import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildWorkersDevUrl,
  parseDeployedWorkersUrl,
  previewWorkerName,
  resolvePreviewUrl,
} from './workers-dev-url.mjs';
import { seedCmsPreviewIfNeeded, ensureOpsCmsMembership } from './seed-cms-preview.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OPS_ENV_PATH = '/opt/iluro-core-ops/.env';

function loadEnvFile(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const vars = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

function loadHostessJson() {
  try {
    return JSON.parse(readFileSync(resolve(projectRoot, 'src/content/hostess.json'), 'utf8'));
  } catch {
    return null;
  }
}

function loadHostessSubmissionId(hostess) {
  if (typeof hostess?.submissionId === 'string' && hostess.submissionId.trim()) {
    return hostess.submissionId.trim();
  }
  return null;
}

function loadCmsSiteSlug(fallback) {
  try {
    const meta = JSON.parse(readFileSync(resolve(projectRoot, 'cms.site.json'), 'utf8'));
    if (typeof meta.siteSlug === 'string' && meta.siteSlug.trim()) {
      return meta.siteSlug.trim();
    }
  } catch {
    // optional
  }
  return fallback;
}

function runCommand(command, options = {}) {
  const { input, env = {}, captureStdout = false } = options;
  const result = spawnSync(command, {
    shell: true,
    stdio: input
      ? ['pipe', captureStdout ? 'pipe' : 'inherit', 'inherit']
      : captureStdout
        ? ['inherit', 'pipe', 'inherit']
        : 'inherit',
    input,
    cwd: projectRoot,
    env: { ...process.env, ...env },
  });

  if (result.error) {
    console.error('[deploy:preview] Command failed:', result.error.message);
    return { status: 1, stdout: '' };
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout ? result.stdout.toString() : '',
  };
}

function extractWorkersSubdomainFromSiteUrl(siteUrl) {
  const match = String(siteUrl).match(/^https:\/\/[^.]+\.([a-z0-9-]+)\.workers\.dev\/?$/i);
  return match?.[1] ?? '';
}

function readWranglerSubdomain() {
  try {
    const raw = readFileSync(resolve(projectRoot, 'wrangler.jsonc'), 'utf8');
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const match = stripped.match(/"SITE_URL"\s*:\s*"([^"]+)"/);
    if (!match) return '';
    return extractWorkersSubdomainFromSiteUrl(match[1]);
  } catch {
    return '';
  }
}

function resolveWorkersDevSubdomain(envFile) {
  return (
    process.env.WORKERS_DEV_SUBDOMAIN?.trim() ||
    envFile.WORKERS_DEV_SUBDOMAIN?.trim() ||
    readWranglerSubdomain() ||
    ''
  );
}

function putSecret(secretName, value, workerName) {
  if (!value) {
    console.warn(`[deploy:preview] Skipping ${secretName} — not found in .env`);
    return false;
  }

  const { status } = runCommand(`npx wrangler secret put ${secretName} --name ${workerName}`, { input: value });
  if (status !== 0) {
    console.error(`[deploy:preview] Failed to set ${secretName} on ${workerName}`);
    return false;
  }

  return true;
}

function resolveSessionKvId(workerName) {
  const sessionTitle = `${workerName}-session`;
  const list = runCommand('npx wrangler kv namespace list', { captureStdout: true });
  let namespaces = [];
  try {
    namespaces = JSON.parse(list.stdout || '[]');
  } catch {
    namespaces = [];
  }
  let sessionId = namespaces.find((n) => n.title === sessionTitle)?.id || '';
  if (sessionId) return sessionId;

  console.log(`[deploy:preview] Creating KV ${sessionTitle}`);
  const created = runCommand(`npx wrangler kv namespace create ${JSON.stringify(sessionTitle)}`, {
    captureStdout: true,
  });
  const match =
    (created.stdout || '').match(/id\s*=\s*"([^"]+)"/i) ||
    (created.stdout || '').match(/"id"\s*:\s*"([^"]+)"/);
  sessionId = match?.[1] || '';
  if (!sessionId) {
    const refreshed = runCommand('npx wrangler kv namespace list', { captureStdout: true });
    try {
      namespaces = JSON.parse(refreshed.stdout || '[]');
    } catch {
      namespaces = [];
    }
    sessionId = namespaces.find((n) => n.title === sessionTitle)?.id || '';
  }
  return sessionId;
}

function envFlagTrue(value) {
  return ['1', 'true', 'yes'].includes(String(value || '').trim().toLowerCase());
}

const opsEnv = loadEnvFile(OPS_ENV_PATH);
const envFile = { ...opsEnv, ...loadEnvFile(resolve(projectRoot, '.env')) };
const hostess = loadHostessJson();
const workersDevSubdomain = resolveWorkersDevSubdomain(envFile);
const hostessSubmissionId = loadHostessSubmissionId(hostess);

const rawId =
  process.env.PREVIEW_ID ||
  hostessSubmissionId ||
  process.env.WORKERS_CI_BRANCH ||
  process.env.WORKERS_CI_BUILD_UUID ||
  process.env.BUILD_ID ||
  process.env.CF_PAGES_BRANCH ||
  process.env.BRANCH ||
  process.argv[2] ||
  'local';

const previewName = previewWorkerName(rawId);
const normalizedId = previewName.replace(/^preview-/, '');
const workersDevUrl = buildWorkersDevUrl(previewName, workersDevSubdomain);
let siteUrl = workersDevUrl;
let platformFqdn = '';

const skipPlatformHostname = envFlagTrue(
  process.env.SKIP_PLATFORM_HOSTNAME || envFile.SKIP_PLATFORM_HOSTNAME,
);
if (!skipPlatformHostname) {
  const allocEnv = {
    ...process.env,
    ...envFile,
    WORKER_NAME: previewName,
    PLATFORM_ALLOCATE_ONLY: '1',
    PREVIEW_ID: String(rawId),
  };
  if (process.env.PLATFORM_HOSTNAME || envFile.PLATFORM_HOSTNAME) {
    allocEnv.PLATFORM_HOSTNAME = process.env.PLATFORM_HOSTNAME || envFile.PLATFORM_HOSTNAME;
  }
  const alloc = runCommand('node ./scripts/attach-platform-hostname.mjs', {
    env: allocEnv,
    captureStdout: true,
  });
  if (alloc.status === 0) {
    try {
      const parsed = JSON.parse(String(alloc.stdout || '').trim().split('\n').filter(Boolean).at(-1) || '{}');
      if (parsed.ok && parsed.siteUrl && parsed.fqdn) {
        platformFqdn = parsed.fqdn;
        siteUrl = parsed.siteUrl;
        console.log(`[deploy:preview] Platform hostname: ${platformFqdn}`);
      }
    } catch {
      console.warn('[deploy:preview] Could not parse platform hostname allocation; using workers.dev SITE_URL');
    }
  } else {
    console.warn('[deploy:preview] Platform hostname allocation skipped/failed; using workers.dev SITE_URL');
  }
}

const hostingPlan =
  String(process.env.HOSTING_PLAN || envFile.HOSTING_PLAN || '').trim().toLowerCase() === 'pro'
    ? 'pro'
    : 'normal';
const cmsRequested =
  hostingPlan === 'pro' ||
  envFlagTrue(process.env.CMS_ENABLED || envFile.CMS_ENABLED) ||
  Boolean(String(process.env.PUBLIC_CMS_SITE_SLUG || envFile.PUBLIC_CMS_SITE_SLUG || '').trim());
const isCms = cmsRequested;
const effectiveHostingPlan = isCms ? 'pro' : hostingPlan;
const cmsSlug = loadCmsSiteSlug(
  String(process.env.PUBLIC_CMS_SITE_SLUG || envFile.PUBLIC_CMS_SITE_SLUG || normalizedId).trim() ||
    normalizedId,
);

const trackingEnabled =
  isCms ||
  envFlagTrue(process.env.SUPABASE_TRACKING_ENABLED || envFile.SUPABASE_TRACKING_ENABLED);
const trackingFlag = trackingEnabled ? 'true' : 'false';
const analyticsEnv =
  String(process.env.ANALYTICS_ENV || (trackingEnabled ? 'development' : previewName)).trim() ||
  (trackingEnabled ? 'development' : previewName);

const publicSupabaseUrl =
  process.env.PUBLIC_SUPABASE_URL ||
  envFile.PUBLIC_SUPABASE_URL ||
  process.env.WF_SUPABASE_URL_HOSTESSWEBS_TEST ||
  envFile.WF_SUPABASE_URL_HOSTESSWEBS_TEST ||
  '';
const publicSupabaseAnon =
  process.env.PUBLIC_SUPABASE_ANON_KEY ||
  envFile.PUBLIC_SUPABASE_ANON_KEY ||
  process.env.WF_SUPABASE_ANON_KEY_HOSTESSWEBS_TEST ||
  envFile.WF_SUPABASE_ANON_KEY_HOSTESSWEBS_TEST ||
  '';

if (!workersDevSubdomain) {
  console.warn(
    '[deploy:preview] WORKERS_DEV_SUBDOMAIN not set — using legacy workers.dev URL. Set WORKERS_DEV_SUBDOMAIN (e.g. hostesspl) for account-scoped preview URLs.',
  );
}

if (isCms && (!publicSupabaseUrl || !publicSupabaseAnon)) {
  console.error(
    '[deploy:preview] CMS/pro preview requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (or WF_SUPABASE_*_HOSTESSWEBS_TEST).',
  );
  process.exit(1);
}

console.log(
  `[deploy:preview] Building for ${siteUrl} (hosting_plan=${effectiveHostingPlan}, cms=${isCms ? cmsSlug : 'off'}, tracking=${trackingFlag}, analyticsEnv=${analyticsEnv})`,
);

// Short-form MVP tip: never enable deposit/review toolbar — product draft UI owns chrome.
const reviewModeEnabled = 'false';
const portfolioProductMode = String(
  process.env.PORTFOLIO_PRODUCT_MODE || 'short_form',
).trim() || 'short_form';

// Always regenerate letter favicon from hostess.json before build (never ship tip default "H").
try {
  const { resolveFaviconLetter, writeFavicon } = await import('./generate-favicon.mjs');
  const letter = resolveFaviconLetter({
    displayName: hostess?.profile?.displayName,
    legalName: hostess?.profile?.legalName,
  });
  const favPath = writeFavicon(letter);
  console.log(`[deploy:preview] Favicon letter=${letter} → ${favPath}`);
} catch (err) {
  console.warn(
    '[deploy:preview] Favicon regenerate failed (non-fatal):',
    err instanceof Error ? err.message : err,
  );
}

const buildEnv = {
  SITE_URL: siteUrl,
  REVIEW_MODE_ENABLED: reviewModeEnabled,
  PORTFOLIO_PRODUCT_MODE: portfolioProductMode,
  SUPABASE_TRACKING_ENABLED: trackingFlag,
  PUBLIC_ANALYTICS_ENABLED: trackingFlag,
  ANALYTICS_ENV: analyticsEnv,
  HOSTING_PLAN: effectiveHostingPlan,
};

if (isCms) {
  buildEnv.PUBLIC_SUPABASE_URL = publicSupabaseUrl;
  buildEnv.PUBLIC_SUPABASE_ANON_KEY = publicSupabaseAnon;
  buildEnv.PUBLIC_CMS_SITE_SLUG = cmsSlug;
  buildEnv.CMS_SITE_SLUG = cmsSlug;
}

const buildResult = runCommand('pnpm run build', { env: buildEnv });

if (buildResult.status !== 0) {
  process.exit(buildResult.status);
}

let sessionId = '';
const generatedPath = resolve(projectRoot, 'dist/server/wrangler.json');
if (!existsSync(generatedPath)) {
  console.error('[deploy:preview] Missing dist/server/wrangler.json');
  process.exit(1);
}
const generated = JSON.parse(readFileSync(generatedPath, 'utf8'));
generated.name = previewName;
generated.topLevelName = previewName;
generated.vars = {
  ...(generated.vars || {}),
  SITE_URL: siteUrl,
  REVIEW_MODE_ENABLED: reviewModeEnabled,
  PORTFOLIO_PRODUCT_MODE: portfolioProductMode,
  CHECK_ORIGIN: 'true',
  HOSTING_PLAN: effectiveHostingPlan,
  SUPABASE_TRACKING_ENABLED: trackingFlag,
  PUBLIC_ANALYTICS_ENABLED: trackingFlag,
  ANALYTICS_ENV: analyticsEnv,
};
if (isCms) {
  sessionId = resolveSessionKvId(previewName);
  if (!sessionId) {
    console.error(`[deploy:preview] Could not resolve SESSION KV for ${previewName}-session`);
    process.exit(1);
  }
  generated.vars.PUBLIC_CMS_SITE_SLUG = cmsSlug;
  generated.vars.CMS_SITE_SLUG = cmsSlug;
  generated.vars.PUBLIC_SUPABASE_URL = publicSupabaseUrl;
  generated.vars.PUBLIC_SUPABASE_ANON_KEY = publicSupabaseAnon;
  generated.kv_namespaces = [{ binding: 'SESSION', id: sessionId }];
  if (generated.previews?.kv_namespaces) {
    generated.previews.kv_namespaces = [{ binding: 'SESSION', id: sessionId }];
  }
}
// Keep technical workers.dev URL available alongside branded custom domain.
generated.workers_dev = true;
generated.preview_urls = true;
writeFileSync(generatedPath, JSON.stringify(generated, null, 2));

console.log(`[deploy:preview] Deploying ${previewName} → ${siteUrl}`);

const domainFlag = platformFqdn ? `--domain ${platformFqdn}` : '';
const deployCmd = `npx wrangler deploy -c dist/server/wrangler.json ${domainFlag}`.trim();

const deployResult = runCommand(deployCmd, { captureStdout: true });

if (deployResult.status !== 0) {
  process.exit(deployResult.status);
}

if (platformFqdn && !domainFlag) {
  console.log(`[deploy:preview] Attaching platform hostname ${platformFqdn} → ${previewName}`);
  const attach = runCommand('node ./scripts/attach-platform-hostname.mjs', {
    env: {
      ...process.env,
      ...envFile,
      WORKER_NAME: previewName,
      PLATFORM_HOSTNAME: platformFqdn,
      PLATFORM_ATTACH_ONLY: '1',
    },
    captureStdout: true,
  });
  if (attach.status !== 0) {
    console.error('[deploy:preview] Failed to attach platform hostname');
    process.exit(attach.status || 1);
  }
  console.log(String(attach.stdout || '').trim());
} else if (platformFqdn) {
  console.log(`[deploy:preview] Platform hostname attached via wrangler --domain ${platformFqdn}`);
}

const resolvedUrl = resolvePreviewUrl({
  submissionId: rawId,
  workersDevSubdomain,
  wranglerStdout: deployResult.stdout,
});
const deployedUrl = parseDeployedWorkersUrl(deployResult.stdout);
if (platformFqdn) {
  siteUrl = `https://${platformFqdn}`;
} else if (deployedUrl && deployedUrl !== siteUrl) {
  console.log(
    workersDevSubdomain
      ? `[deploy:preview] Wrangler reported ${deployedUrl}; keeping configured ${siteUrl}`
      : `[deploy:preview] Using deployed URL from wrangler: ${deployedUrl}`,
  );
  siteUrl = resolvedUrl;
} else {
  siteUrl = resolvedUrl;
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  envFile.SUPABASE_URL ||
  (isCms
    ? publicSupabaseUrl
    : trackingEnabled
      ? process.env.WF_SUPABASE_URL_LEGACY_ILURO || envFile.WF_SUPABASE_URL_LEGACY_ILURO
      : '') ||
  (isCms ? process.env.WF_SUPABASE_URL_HOSTESSWEBS_TEST || envFile.WF_SUPABASE_URL_HOSTESSWEBS_TEST : '');
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  envFile.SUPABASE_SERVICE_ROLE_KEY ||
  (isCms
    ? process.env.SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST ||
      envFile.SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST
    : '') ||
  (trackingEnabled
    ? process.env.WF_SUPABASE_SERVICE_ROLE_KEY_LEGACY_ILURO ||
      envFile.WF_SUPABASE_SERVICE_ROLE_KEY_LEGACY_ILURO
    : '');
const reviewClientCode = process.env.REVIEW_CLIENT_CODE || randomBytes(16).toString('hex');
const reviewAdminCode = process.env.REVIEW_ADMIN_CODE || envFile.REVIEW_ADMIN_CODE;
const reviewAuthSalt =
  process.env.REVIEW_AUTH_SALT ||
  envFile.REVIEW_AUTH_SALT ||
  envFile.RATE_LIMIT_SALT ||
  randomBytes(16).toString('hex');
const analyticsSalt =
  process.env.ANALYTICS_SALT ||
  envFile.ANALYTICS_SALT ||
  process.env.WF_ANALYTICS_SALT ||
  envFile.WF_ANALYTICS_SALT ||
  process.env.WF_REVIEW_AUTH_SALT ||
  envFile.WF_REVIEW_AUTH_SALT ||
  reviewAuthSalt;
const rateLimitSalt =
  process.env.RATE_LIMIT_SALT || envFile.RATE_LIMIT_SALT || analyticsSalt;

console.log(`[deploy:preview] Syncing secrets to ${previewName}`);
putSecret('SUPABASE_URL', supabaseUrl, previewName);
putSecret('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey, previewName);
putSecret('REVIEW_CLIENT_CODE', reviewClientCode, previewName);
putSecret('REVIEW_ADMIN_CODE', reviewAdminCode, previewName);
putSecret('REVIEW_AUTH_SALT', reviewAuthSalt, previewName);
if (trackingEnabled || isCms) {
  putSecret('ANALYTICS_SALT', analyticsSalt, previewName);
  putSecret('RATE_LIMIT_SALT', rateLimitSalt, previewName);
}

const reviewWebhookSecret = process.env.REVIEW_WEBHOOK_SECRET || envFile.REVIEW_WEBHOOK_SECRET;
const n8nReviewCompleteUrl = process.env.N8N_REVIEW_COMPLETE_URL || envFile.N8N_REVIEW_COMPLETE_URL;
putSecret('REVIEW_WEBHOOK_SECRET', reviewWebhookSecret, previewName);
putSecret('N8N_REVIEW_COMPLETE_URL', n8nReviewCompleteUrl, previewName);

const portfolioPublishNotifyUrl =
  process.env.PORTFOLIO_PUBLISH_NOTIFY_URL
  || envFile.PORTFOLIO_PUBLISH_NOTIFY_URL
  || process.env.WF_PORTFOLIO_PUBLISH_NOTIFY_URL
  || envFile.WF_PORTFOLIO_PUBLISH_NOTIFY_URL;
const portfolioPublishHmac =
  process.env.PORTFOLIO_PUBLISH_HMAC_SECRET
  || envFile.PORTFOLIO_PUBLISH_HMAC_SECRET
  || process.env.WF_PORTFOLIO_PUBLISH_HMAC_SECRET
  || envFile.WF_PORTFOLIO_PUBLISH_HMAC_SECRET
  || process.env.WF_OPS_RUNNER_SECRET
  || envFile.WF_OPS_RUNNER_SECRET;
putSecret('PORTFOLIO_PUBLISH_NOTIFY_URL', portfolioPublishNotifyUrl, previewName);
putSecret('PORTFOLIO_PUBLISH_HMAC_SECRET', portfolioPublishHmac, previewName);
if (!portfolioPublishNotifyUrl) {
  console.warn('[deploy:preview] PORTFOLIO_PUBLISH_NOTIFY_URL unset — publish will not notify the client');
}

const hostessEmail =
  typeof hostess?.profile?.email === 'string' ? hostess.profile.email.trim() : '';
const resendApiKey =
  process.env.RESEND_API_KEY ||
  envFile.RESEND_API_KEY ||
  process.env.WF_RESEND_API_KEY ||
  envFile.WF_RESEND_API_KEY;
const resendFrom =
  process.env.RESEND_FROM ||
  envFile.RESEND_FROM ||
  process.env.WF_RESEND_FROM ||
  envFile.WF_RESEND_FROM;
const resendTo =
  process.env.RESEND_TO || envFile.RESEND_TO || hostessEmail;
putSecret('RESEND_API_KEY', resendApiKey, previewName);
putSecret('RESEND_FROM', resendFrom, previewName);
putSecret('RESEND_TO', resendTo, previewName);
const cmsOpsOwnerEmails =
  process.env.CMS_OPS_OWNER_EMAILS ||
  envFile.CMS_OPS_OWNER_EMAILS ||
  '';
putSecret('CMS_OPS_OWNER_EMAILS', cmsOpsOwnerEmails, previewName);
if (!resendApiKey) {
  console.warn('[deploy:preview] RESEND_API_KEY not set — contact form will return email service not configured.');
} else if (!resendTo) {
  console.warn('[deploy:preview] RESEND_TO unset and hostess.profile.email missing — inquiry routing may fail.');
} else {
  console.log(`[deploy:preview] Contact inquiries → ${resendTo}`);
}

if (isCms || platformFqdn) {
  // Register preview / platform origin on Hostesswebs Test Auth redirect allowlist.
  const originArgs = [siteUrl, workersDevUrl, platformFqdn ? `https://${platformFqdn}` : '']
    .filter(Boolean)
    .flatMap((origin) => ['--origin', JSON.stringify(origin)])
    .join(' ');
  const ensureRedirects = runCommand(`node ./scripts/ensure-cms-auth-redirects.mjs ${originArgs}`);
  if (ensureRedirects.status !== 0) {
    console.warn(
      '[deploy:preview] ensure-cms-auth-redirects failed (non-fatal) — magic links may fall back to Auth Site URL until allowlist is fixed',
    );
  }
}

if (isCms) {
  const seed = await seedCmsPreviewIfNeeded({
    slug: cmsSlug,
    supabaseUrl,
    serviceKey: supabaseServiceRoleKey,
    hostess: loadHostessJson(),
  });
  if (seed.reason === 'site_error' || seed.reason === 'content_error' || seed.reason === 'lookup_error') {
    console.warn('[deploy:preview] CMS preview seed failed (non-fatal):', seed.reason);
  }
} else if (supabaseUrl && supabaseServiceRoleKey) {
  // Non-Pro preview: ops membership only (no Pro content seed / client invite).
  // Short-intake lite sets HOSTING_PLAN=pro above and uses seedCmsPreviewIfNeeded.
  const ops = await ensureOpsCmsMembership({
    slug: cmsSlug,
    supabaseUrl,
    serviceKey: supabaseServiceRoleKey,
    hostess: loadHostessJson(),
  });
  if (!ops.ok && ops.reason !== 'no_ops_emails') {
    console.warn('[deploy:preview] Ops CMS membership failed (non-fatal):', ops.reason);
  }
}

const deploySummary = {
  previewUrl: siteUrl,
  workersDevUrl,
  platformHostname: platformFqdn || null,
  clientCode: reviewClientCode,
  workerName: previewName,
  submissionId: hostessSubmissionId ?? normalizedId,
  analyticsEnv,
  trackingEnabled,
  hostingPlan: effectiveHostingPlan,
  cmsSiteSlug: isCms ? cmsSlug : null,
  contactTo: resendTo || null,
  workersDevSubdomain: workersDevSubdomain || null,
};

console.log(`[deploy:preview] Ready: ${siteUrl}`);
console.log(`[deploy:preview] Hostess feedback code: ${reviewClientCode}`);
console.log(`[deploy:preview] Result: ${JSON.stringify(deploySummary)}`);

if (!reviewAdminCode) {
  console.warn('[deploy:preview] REVIEW_ADMIN_CODE not set — admin unlock will be unavailable.');
}
