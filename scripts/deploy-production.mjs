import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
    const raw = readFileSync(resolve(projectRoot, 'src/content/hostess.json'), 'utf8');
    return JSON.parse(raw);
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
    console.error('[deploy:production] Command failed:', result.error.message);
    return { status: 1, stdout: '' };
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout ? result.stdout.toString() : '',
  };
}

function normalizeSubmissionId(rawId) {
  return String(rawId)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'local';
}

function putSecret(secretName, value, workerName) {
  if (!value) {
    console.warn(`[deploy:production] Skipping ${secretName} — not found in env`);
    return false;
  }

  const { status } = runCommand(`npx wrangler secret put ${secretName} --name ${workerName}`, { input: value });
  if (status !== 0) {
    console.error(`[deploy:production] Failed to set ${secretName} on ${workerName}`);
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

  console.log(`[deploy:production] Creating KV ${sessionTitle}`);
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

async function seedCmsAndInvite({
  slug,
  supabaseUrl,
  serviceKey,
  hostess,
  plan = 'pro',
  seedContent = true,
  includeHostess = true,
}) {
  if (!supabaseUrl || !serviceKey) {
    console.warn('[deploy:production] Skipping CMS seed — SUPABASE_URL / SERVICE_ROLE missing');
    return { seeded: false, invited: false };
  }
  if (seedContent && (!hostess || typeof hostess !== 'object')) {
    console.warn('[deploy:production] Skipping CMS seed — hostess.json missing');
    return { seeded: false, invited: false };
  }

  const { parseOwnerEmails, ensureCmsSiteAndInviteOwners } = await import('./lib/cms-ops-invite.mjs');
  const hostessEmail = String(hostess?.profile?.email || '').trim().toLowerCase();
  const ownerEmails = parseOwnerEmails({ hostessEmail, includeHostess });

  if (!ownerEmails.length && !seedContent) {
    console.warn('[deploy:production] No CMS owners to invite (set CMS_OPS_OWNER_EMAILS)');
    return { seeded: false, invited: false };
  }

  const result = await ensureCmsSiteAndInviteOwners({
    supabaseUrl,
    serviceKey,
    slug,
    plan,
    hostess,
    seedContent,
    ownerEmails,
  });

  if (!result.ok) {
    console.error(`[deploy:production] CMS seed failed (${result.reason}):`, result.error || 'unknown');
    return { seeded: false, invited: false };
  }

  if (seedContent) {
    console.log(`[deploy:production] CMS seeded slug=${slug} plan=${plan}`);
  } else {
    console.log(`[deploy:production] CMS site ensured slug=${slug} plan=${plan} (ops membership)`);
  }

  for (const fail of result.failed) {
    console.error(`[deploy:production] CMS invite failed for ${fail.email}:`, fail.error);
  }
  if (result.invited.length) {
    console.log(`[deploy:production] CMS owners invited: ${result.invited.join(', ')}`);
  } else if (!ownerEmails.length) {
    console.warn('[deploy:production] No profile.email / CMS_OPS_OWNER_EMAILS — skip CMS owner invite');
  }
  return { seeded: Boolean(seedContent), invited: result.invited.length > 0 };
}

const envFile = loadEnvFile(resolve(projectRoot, '.env'));
const verifyCfg = existsSync(resolve(projectRoot, 'wrangler.cms-verify.jsonc'))
  ? JSON.parse(readFileSync(resolve(projectRoot, 'wrangler.cms-verify.jsonc'), 'utf8'))
  : { vars: {} };

const hostess = loadHostessJson();
const hostessSubmissionId = loadHostessSubmissionId(hostess);
const productionHostname = String(
  process.env.PRODUCTION_HOSTNAME
  || process.argv[2]
  || '',
).trim().toLowerCase();

if (!productionHostname) {
  console.error('[deploy:production] PRODUCTION_HOSTNAME is required');
  process.exit(1);
}

const rawId = process.env.SUBMISSION_ID || hostessSubmissionId || 'local';
const normalizedId = normalizeSubmissionId(rawId);
const workerName = String(process.env.WORKER_NAME || `live-${normalizedId}`).trim();
const productionUrl = `https://${productionHostname}`;
const analyticsEnv = 'production';
const hostingPlan = String(process.env.HOSTING_PLAN || '').trim().toLowerCase() === 'pro' ? 'pro' : 'normal';
const isPro = hostingPlan === 'pro';
const trackingEnabled = isPro ? 'true' : 'false';
const cmsSlug = normalizedId;

const publicSupabaseUrl =
  process.env.PUBLIC_SUPABASE_URL
  || envFile.PUBLIC_SUPABASE_URL
  || verifyCfg.vars?.PUBLIC_SUPABASE_URL
  || process.env.SUPABASE_URL
  || envFile.SUPABASE_URL
  || '';
const publicSupabaseAnon =
  process.env.PUBLIC_SUPABASE_ANON_KEY
  || envFile.PUBLIC_SUPABASE_ANON_KEY
  || verifyCfg.vars?.PUBLIC_SUPABASE_ANON_KEY
  || '';

console.log(`[deploy:production] Building for ${productionUrl} (hosting_plan=${hostingPlan}, tracking=${trackingEnabled}, cmsSlug=${cmsSlug})`);

// Always bake submission slug (never tpl-*). Cleared leftovers via ensure-public.
const ensureEnv = runCommand('node ./scripts/ensure-public-supabase-env.mjs', {
  env: {
    HOSTING_PLAN: hostingPlan,
    SITE_URL: productionUrl,
    PUBLIC_CMS_SITE_SLUG: cmsSlug,
    CMS_SITE_SLUG: cmsSlug,
    ...(publicSupabaseUrl ? { PUBLIC_SUPABASE_URL: publicSupabaseUrl } : {}),
    ...(publicSupabaseAnon ? { PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnon } : {}),
  },
});
if (ensureEnv.status !== 0) {
  console.warn('[deploy:production] ensure-public-supabase-env failed (continuing)');
}

const manifestEnv = runCommand('node ./scripts/generate-static-assets-manifest.mjs');
if (manifestEnv.status !== 0) {
  console.warn('[deploy:production] generate-static-assets-manifest failed (continuing)');
}

const buildEnv = {
  SITE_URL: productionUrl,
  REVIEW_MODE_ENABLED: 'false',
  PORTFOLIO_PRODUCT_MODE: 'short_form',
  SUPABASE_TRACKING_ENABLED: trackingEnabled,
  PUBLIC_ANALYTICS_ENABLED: trackingEnabled,
  ANALYTICS_ENV: analyticsEnv,
  HOSTING_PLAN: hostingPlan,
  PUBLIC_CMS_SITE_SLUG: cmsSlug,
  CMS_SITE_SLUG: cmsSlug,
};

if (publicSupabaseUrl) buildEnv.PUBLIC_SUPABASE_URL = publicSupabaseUrl;
if (publicSupabaseAnon) buildEnv.PUBLIC_SUPABASE_ANON_KEY = publicSupabaseAnon;

const buildResult = runCommand('npx astro build', { env: buildEnv });

if (buildResult.status !== 0) {
  process.exit(buildResult.status);
}

let sessionId = '';
const generatedPath = resolve(projectRoot, 'dist/server/wrangler.json');
if (existsSync(generatedPath)) {
  if (isPro) {
    sessionId = resolveSessionKvId(workerName);
    if (!sessionId) {
      console.error(`[deploy:production] Could not resolve SESSION KV for ${workerName}-session`);
      process.exit(1);
    }
  }

  const generated = JSON.parse(readFileSync(generatedPath, 'utf8'));
  generated.name = workerName;
  generated.topLevelName = workerName;
  generated.vars = {
    ...(generated.vars || {}),
    SITE_URL: productionUrl,
    REVIEW_MODE_ENABLED: 'false',
    PORTFOLIO_PRODUCT_MODE: 'short_form',
    CHECK_ORIGIN: 'true',
    HOSTING_PLAN: hostingPlan,
    SUPABASE_TRACKING_ENABLED: trackingEnabled,
    PUBLIC_ANALYTICS_ENABLED: trackingEnabled,
    ANALYTICS_ENV: analyticsEnv,
    // Always bake submission slug so /edit/login membership resolves (never tpl-*).
    PUBLIC_CMS_SITE_SLUG: cmsSlug,
    CMS_SITE_SLUG: cmsSlug,
    ...(publicSupabaseUrl ? { PUBLIC_SUPABASE_URL: publicSupabaseUrl } : {}),
    ...(publicSupabaseAnon ? { PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnon } : {}),
  };
  if (isPro && sessionId) {
    generated.kv_namespaces = [{ binding: 'SESSION', id: sessionId }];
    if (generated.previews?.kv_namespaces) {
      generated.previews.kv_namespaces = [{ binding: 'SESSION', id: sessionId }];
    }
  }
  writeFileSync(generatedPath, JSON.stringify(generated, null, 2));
}

const attachCustomDomain = String(process.env.ATTACH_CUSTOM_DOMAIN ?? 'true').trim().toLowerCase() !== 'false';
const domainFlag = attachCustomDomain ? `--domain ${productionHostname}` : '';

console.log(`[deploy:production] Deploying ${workerName}${attachCustomDomain ? ` with custom domain ${productionHostname}` : ' (worker update only)'}`);

const deployCmd = existsSync(generatedPath)
  ? `npx wrangler deploy -c dist/server/wrangler.json ${domainFlag}`
  : `npx wrangler deploy --name ${workerName} ${domainFlag} --var SITE_URL:${productionUrl} --var SUPABASE_TRACKING_ENABLED:${trackingEnabled} --var PUBLIC_ANALYTICS_ENABLED:${trackingEnabled} --var ANALYTICS_ENV:${analyticsEnv} --var REVIEW_MODE_ENABLED:false --var HOSTING_PLAN:${hostingPlan} --var PUBLIC_CMS_SITE_SLUG:${cmsSlug} --var CMS_SITE_SLUG:${cmsSlug}`;

const deployResult = runCommand(deployCmd, { captureStdout: true });

if (deployResult.status !== 0) {
  process.exit(deployResult.status);
}

const supabaseUrl = process.env.SUPABASE_URL || envFile.SUPABASE_URL || publicSupabaseUrl;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;
const reviewClientCode = process.env.REVIEW_CLIENT_CODE || randomBytes(16).toString('hex');
const reviewAdminCode = process.env.REVIEW_ADMIN_CODE || envFile.REVIEW_ADMIN_CODE;
const reviewAuthSalt =
  process.env.REVIEW_AUTH_SALT
  || envFile.REVIEW_AUTH_SALT
  || envFile.RATE_LIMIT_SALT
  || randomBytes(16).toString('hex');
const analyticsSalt =
  process.env.ANALYTICS_SALT
  || envFile.ANALYTICS_SALT
  || process.env.REVIEW_AUTH_SALT
  || envFile.REVIEW_AUTH_SALT
  || reviewAuthSalt;
const rateLimitSalt =
  process.env.RATE_LIMIT_SALT
  || envFile.RATE_LIMIT_SALT
  || analyticsSalt;

console.log(`[deploy:production] Syncing secrets to ${workerName}`);
putSecret('SUPABASE_URL', supabaseUrl, workerName);
putSecret('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey, workerName);
putSecret('REVIEW_CLIENT_CODE', reviewClientCode, workerName);
putSecret('REVIEW_ADMIN_CODE', reviewAdminCode, workerName);
putSecret('REVIEW_AUTH_SALT', reviewAuthSalt, workerName);

if (isPro) {
  putSecret('ANALYTICS_SALT', analyticsSalt, workerName);
  putSecret('RATE_LIMIT_SALT', rateLimitSalt, workerName);
} else {
  console.log('[deploy:production] Skipping analytics salts (hosting_plan=normal)');
}

const reviewWebhookSecret = process.env.REVIEW_WEBHOOK_SECRET || envFile.REVIEW_WEBHOOK_SECRET;
const n8nReviewCompleteUrl = process.env.N8N_REVIEW_COMPLETE_URL || envFile.N8N_REVIEW_COMPLETE_URL;
putSecret('REVIEW_WEBHOOK_SECRET', reviewWebhookSecret, workerName);
putSecret('N8N_REVIEW_COMPLETE_URL', n8nReviewCompleteUrl, workerName);

const resendApiKey = process.env.RESEND_API_KEY || envFile.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || envFile.RESEND_FROM;
const resendTo = process.env.RESEND_TO || envFile.RESEND_TO;
putSecret('RESEND_API_KEY', resendApiKey, workerName);
putSecret('RESEND_FROM', resendFrom, workerName);
putSecret('RESEND_TO', resendTo, workerName);

let cmsSeeded = false;
let cmsInvited = false;
if (isPro) {
  const cms = await seedCmsAndInvite({
    slug: cmsSlug,
    supabaseUrl,
    serviceKey: supabaseServiceRoleKey,
    hostess,
    plan: 'pro',
    seedContent: true,
    includeHostess: true,
  });
  cmsSeeded = cms.seeded;
  cmsInvited = cms.invited;
  } else {
  // Normal sites: cms_sites row (plan=free|pro; DB rejects other values) + ops owners.
  // Worker stays HOSTING_PLAN=normal so client does not get Pro CMS UI.
  const cms = await seedCmsAndInvite({
    slug: cmsSlug,
    supabaseUrl,
    serviceKey: supabaseServiceRoleKey,
    hostess,
    plan: 'free',
    seedContent: false,
    includeHostess: false,
  });
  cmsInvited = cms.invited;
}

if (isPro || cmsInvited) {
  // Register this origin on Hostesswebs Test Auth redirect allowlist (idempotent).
  const ensureRedirects = runCommand(
    `node ./scripts/ensure-cms-auth-redirects.mjs --origin ${JSON.stringify(productionUrl)}`,
  );
  if (ensureRedirects.status !== 0) {
    console.warn(
      '[deploy:production] ensure-cms-auth-redirects failed (non-fatal) — magic links may fall back to Auth Site URL until allowlist is fixed',
    );
  }
}

const deploySummary = {
  productionUrl,
  workerName,
  submissionId: hostessSubmissionId ?? normalizedId,
  hostname: productionHostname,
  analyticsEnv,
  hostingPlan,
  trackingEnabled: isPro,
  reviewModeEnabled: false,
  cmsSlug,
  cmsSeeded,
  cmsInvited,
  sessionKvBound: Boolean(sessionId),
};

console.log(`[deploy:production] Ready: ${productionUrl}`);
console.log(`[deploy:production] Result: ${JSON.stringify(deploySummary)}`);
