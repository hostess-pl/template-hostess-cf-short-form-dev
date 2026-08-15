import { mkdir, readFile, writeFile, mkdtemp, rm, readdir, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

import { isNormalizedHostessPayload, tallyToHostess } from './tally-to-hostess.mjs';
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  assertAllowedImageBuffer,
  assertAllowedImageUrl,
  assertAllowedVideoBuffer,
  assertAllowedVideoUrl,
  detectImageFormat,
  eventVideoFileName,
} from './safe-media.mjs';
import {
  heicToJpegBuffer,
  isHeicDecodeError,
  prepareImageBufferForSharp,
} from './heic-decode.mjs';
import {
  resolveFaviconLetter,
  writeFavicon,
} from './generate-favicon.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hostessJsonPath = resolve(projectRoot, 'src/content/hostess.json');
const hostessSchemaPath = resolve(projectRoot, 'src/content/hostess.schema.ts');
const imagesDir = resolve(projectRoot, 'src/assets/images');
const assetVideosDir = resolve(projectRoot, 'src/assets/videos');
const videosDir = resolve(projectRoot, 'public/videos');
const cmsAssetsDir = resolve(projectRoot, 'public/cms-assets');

/** Brand / Karolina demo leftovers that must never ship on client generates. */
const DEMO_MEDIA_BASENAME_RE =
  /^(onelife|event-apteo|event-kinder|event-onelife|event-sopot|event-ukraine)(\.|$)/i;

function fail(message) {
  console.error(`[provision] ${message}`);
  process.exit(1);
}

const TEMPLATE_STUB_SUBMISSION_IDS = new Set(['DqvqE25', 'template-stub']);

function decodeAssetsTransport(encoded) {
  const raw = String(encoded || '').trim();
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      hero: parsed.hero || null,
      events: Array.isArray(parsed.events) ? parsed.events : [],
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
    };
  } catch {
    return null;
  }
}

function resolveProvisionAssets(input, hostess) {
  const direct = input?.assets && typeof input.assets === 'object'
    ? input.assets
    : hostess?.assets && typeof hostess.assets === 'object'
      ? hostess.assets
      : null;
  const hasDirect = Boolean(
    direct?.hero
    || (Array.isArray(direct?.events) && direct.events.some(Boolean)),
  );
  if (hasDirect) {
    return {
      hero: direct.hero || null,
      events: Array.isArray(direct.events) ? direct.events : [],
      videos: Array.isArray(direct.videos) ? direct.videos : [],
    };
  }

  const encoded = input?.assetsB64 || hostess?.assetsB64 || '';
  const decoded = decodeAssetsTransport(encoded);
  if (decoded) return decoded;

  return { hero: null, events: [], videos: [] };
}

/**
 * Drop incomplete employment rows before Zod (title.min(1)).
 * Duties/dates-only slots and empty shells must not fail provision.
 */
function sanitizeEmployment(hostess) {
  if (!hostess || typeof hostess !== 'object') return hostess;
  const jobs = Array.isArray(hostess.employment) ? hostess.employment : [];
  hostess.employment = jobs
    .map((job) => {
      if (!job || typeof job !== 'object') return null;
      const title = String(job.title || '').trim();
      const company = String(job.company || '').trim();
      const resolvedTitle = title || company;
      if (!resolvedTitle) return null;
      return { ...job, title: resolvedTitle, company };
    })
    .filter(Boolean);
  return hostess;
}

function assertProvisionMedia(assets, hostess) {
  if (TEMPLATE_STUB_SUBMISSION_IDS.has(String(hostess?.submissionId || '').trim())) {
    fail('Refusing to provision template stub submissionId');
  }

  const hero = assets?.hero;
  const events = Array.isArray(assets?.events) ? assets.events.filter(Boolean) : [];
  if (!hero && events.length === 0) {
    fail('Provision requires at least one Tally image URL (hero or event photo)');
  }
}

function validateHostess(hostess) {
  const required = [
    ['submissionId', hostess.submissionId],
    ['slug', hostess.slug],
    ['profile.displayName', hostess.profile?.displayName],
    ['profile.email', hostess.profile?.email],
    ['bio.short', hostess.bio?.short],
  ];

  for (const [label, value] of required) {
    if (!value || typeof value !== 'string' || !value.trim()) {
      fail(`Missing required field: ${label}`);
    }
  }

  if (!Array.isArray(hostess.locales) || hostess.locales.length === 0) {
    fail('locales must be a non-empty array');
  }
}

/**
 * Parse hostess with the same Zod schema used at runtime (hostess.schema.ts).
 * Transpiles TS → ESM in a temp file so Node can import without strip-types.
 */
async function validateHostessWithZod(hostess) {
  const require = createRequire(join(projectRoot, 'package.json'));
  let ts;
  let zodEntry;
  try {
    ts = require('typescript');
    zodEntry = pathToFileURL(require.resolve('zod')).href;
  } catch (error) {
    fail(
      `Zod schema validation unavailable (${error instanceof Error ? error.message : error}). Install typescript + zod.`,
    );
  }

  let schemaSource;
  try {
    schemaSource = await readFile(hostessSchemaPath, 'utf8');
  } catch {
    fail(`Missing hostess schema at ${hostessSchemaPath}`);
  }

  const rewritten = schemaSource
    .replace(/from ['"]astro\/zod['"]/, `from '${zodEntry}'`)
    .replace(/^export type .*$/gm, '');
  const { outputText } = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  const tempDir = await mkdtemp(join(tmpdir(), 'hostess-schema-'));
  const tempSchema = join(tempDir, 'hostess.schema.mjs');
  try {
    await writeFile(tempSchema, outputText);
    const { hostessSchema } = await import(pathToFileURL(tempSchema).href);
    if (!hostessSchema || typeof hostessSchema.safeParse !== 'function') {
      fail('hostessSchema export missing after transpile');
    }
    const parsed = hostessSchema.safeParse(hostess);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .slice(0, 8)
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');
      fail(`hostess.json failed Zod validation: ${detail}`);
    }
    return parsed.data;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function readInput(pathArg) {
  const source = pathArg && pathArg !== '-' ? await readFile(resolve(process.cwd(), pathArg), 'utf8') : await readStdin();
  try {
    return JSON.parse(source);
  } catch {
    fail('Input is not valid JSON');
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}


function cleanTallyUrl(url) {
  const raw = String(url || '').trim();
  if (!raw || !raw.startsWith('http')) return raw;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  const seen = new Set();
  const parts = [];
  for (const pair of parsed.search.slice(1).split('&')) {
    if (!pair || !pair.includes('=')) continue;
    const key = pair.slice(0, pair.indexOf('='));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    parts.push(pair);
  }
  parsed.search = parts.length ? `?${parts.join('&')}` : '';
  return parsed.toString();
}

async function downloadImage(url, destination, maxWidth = 1600) {
  const urlCheck = assertAllowedImageUrl(cleanTallyUrl(url));
  if (!urlCheck.ok) {
    throw new Error(`Blocked image URL (${urlCheck.error})`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response;
  try {
    response = await fetch(urlCheck.url.href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/heic,image/heif,*/*', 'User-Agent': 'HostessWebsProvision/1.0' },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${urlCheck.url.hostname}`);
  }

  // Re-validate final URL after redirects
  const finalUrlCheck = assertAllowedImageUrl(response.url || urlCheck.url.href);
  if (!finalUrlCheck.ok) {
    throw new Error(`Blocked redirect target (${finalUrlCheck.error})`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image too large (${contentLength} bytes)`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image too large (${buffer.length} bytes)`);
  }

  const formatCheck = assertAllowedImageBuffer(buffer, { format: detectImageFormat(buffer) });
  if (!formatCheck.ok) {
    throw new Error(`Blocked image buffer (${formatCheck.error})`);
  }

  let work = await prepareImageBufferForSharp(buffer);
  try {
    await sharp(work, { failOn: 'error' }).metadata();
  } catch (err) {
    if (!isHeicDecodeError(err)) throw err;
    work = await heicToJpegBuffer(buffer);
  }

  const resized = await sharp(work, { failOn: 'error' })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  await writeFile(destination, resized);
}

/**
 * Download a video to a fixed safe path under public/videos/.
 * @returns {{ fileName: string }}
 */
async function downloadVideo(url, eventIndex) {
  const urlCheck = assertAllowedVideoUrl(url);
  if (!urlCheck.ok) {
    throw new Error(`Blocked video URL (${urlCheck.error})`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  let response;
  try {
    response = await fetch(urlCheck.url.href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'video/mp4,video/webm,video/quicktime,video/*,*/*', 'User-Agent': 'HostessWebsProvision/1.0' },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for video ${urlCheck.url.hostname}`);
  }

  const finalUrlCheck = assertAllowedVideoUrl(response.url || urlCheck.url.href);
  if (!finalUrlCheck.ok) {
    throw new Error(`Blocked video redirect (${finalUrlCheck.error})`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_VIDEO_BYTES) {
    throw new Error(`Video too large (${contentLength} bytes)`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_VIDEO_BYTES) {
    throw new Error(`Video too large (${buffer.length} bytes)`);
  }

  const formatCheck = assertAllowedVideoBuffer(buffer);
  if (!formatCheck.ok) {
    throw new Error(`Blocked video buffer (${formatCheck.error})`);
  }

  const fileName = eventVideoFileName(eventIndex, formatCheck.extension);
  const destination = resolve(videosDir, fileName);
  await writeFile(destination, buffer);
  return { fileName };
}

/**
 * @param {object} assets
 * @param {object} hostess mutated in place for videoFile paths
 */
async function provisionAssets(assets, hostess) {
  await mkdir(imagesDir, { recursive: true });
  await mkdir(videosDir, { recursive: true });

  if (assets?.hero) {
    await downloadImage(assets.hero, resolve(imagesDir, 'hero.jpg'));
    console.log('[provision] Downloaded hero.jpg');
  }

  const eventUrls = Array.isArray(assets?.events) ? assets.events : [];
  for (let index = 0; index < eventUrls.length; index += 1) {
    const url = eventUrls[index];
    if (!url) continue;
    const fileName = `event-${index + 1}.jpg`;
    await downloadImage(url, resolve(imagesDir, fileName));
    console.log(`[provision] Downloaded ${fileName}`);
  }

  const videos = Array.isArray(assets?.videos) ? assets.videos : [];
  for (const entry of videos) {
    const eventIndex = Number(entry?.eventIndex);
    const url = entry?.url;
    if (!url || !Number.isInteger(eventIndex)) continue;
    try {
      const { fileName } = await downloadVideo(url, eventIndex);
      const event = Array.isArray(hostess?.events)
        ? hostess.events.find((item) => item.id === `event-${eventIndex}`)
        : null;
      if (event) {
        event.videoFile = fileName;
      }
      console.log(`[provision] Downloaded videos/${fileName}`);
    } catch (error) {
      // Soft-fail videos so a bad clip does not block site provision
      console.error(
        `[provision] Skipped video for event-${eventIndex}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function updatePackageName(slug) {
  const packagePath = resolve(projectRoot, 'package.json');
  const raw = await readFile(packagePath, 'utf8');
  const pkg = JSON.parse(raw);
  pkg.name = `hostess-${slug}`;
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function collectReferencedMediaBasenames(hostess) {
  const refs = new Set();
  // Public layouts resolve hero from hero.jpg by convention.
  refs.add('hero.jpg');
  const hero = hostess?.hero;
  if (hero && typeof hero === 'object') {
    for (const key of ['imageFile', 'image', 'photo', 'videoFile']) {
      const value = String(hero[key] || '').trim();
      if (value) refs.add(basename(value));
    }
  }
  for (const event of Array.isArray(hostess?.events) ? hostess.events : []) {
    for (const key of ['imageFile', 'image', 'videoFile', 'video']) {
      const value = String(event?.[key] || '').trim();
      if (value) refs.add(basename(value));
    }
    // Keep local bake companions when CMS/image identity is a remote URL.
    const idMatch = String(event?.id || '').match(/^event-(\d+)$/);
    if (idMatch && /^https?:\/\//i.test(String(event?.imageFile || ''))) {
      refs.add(`event-${idMatch[1]}.jpg`);
    }
  }
  return refs;
}

async function listMediaFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * Delete unreferenced media + known Karolina/demo leftovers under assets dirs.
 * Keeps .gitkeep. Regenerated public/cms-assets copies are pruned the same way.
 */
async function pruneUnreferencedMedia(hostess) {
  const referenced = collectReferencedMediaBasenames(hostess);
  const dirs = [imagesDir, assetVideosDir, videosDir, cmsAssetsDir];
  const removed = [];

  for (const dir of dirs) {
    const names = await listMediaFiles(dir);
    for (const name of names) {
      if (name === '.gitkeep') continue;
      const isDemo = DEMO_MEDIA_BASENAME_RE.test(name);
      const keep = referenced.has(name);
      if (!isDemo && keep) continue;
      try {
        await unlink(resolve(dir, name));
        removed.push(`${basename(dir)}/${name}`);
      } catch {
        // ignore missing
      }
    }
  }

  if (removed.length) {
    console.log(`[provision] Pruned unused media: ${removed.join(', ')}`);
  } else {
    console.log('[provision] Media prune: nothing to remove');
  }
  return removed;
}

function writeHostessFavicon(hostess) {
  const letter = resolveFaviconLetter({
    displayName: hostess?.profile?.displayName,
    legalName: hostess?.profile?.legalName,
  });
  const path = writeFavicon(letter);
  console.log(`[provision] Favicon letter=${letter} → ${path}`);
  return letter;
}

async function main() {
  const pathArg = process.argv[2];
  const input = await readInput(pathArg);

  const transformed = isNormalizedHostessPayload(input)
    ? { hostess: input, assets: input.assets ?? { hero: null, events: [], videos: [] }, repoName: input.slug }
    : tallyToHostess(input);

  validateHostess(transformed.hostess);

  const hostessOnly = { ...transformed.hostess };
  delete hostessOnly.assets;
  delete hostessOnly.assetsB64;

  const assets = resolveProvisionAssets(input, transformed.hostess);
  assertProvisionMedia(assets, transformed.hostess);
  await provisionAssets(assets, hostessOnly);

  sanitizeEmployment(hostessOnly);
  const validated = await validateHostessWithZod(hostessOnly);
  // Persist real hero URL when present; otherwise bake basename for static fallback.
  // Favicon remains the only hard-coded asset name (writeHostessFavicon).
  const heroSource = typeof assets?.hero === 'string' ? assets.hero.trim() : '';
  const heroPersisted = /^https?:\/\//i.test(heroSource) ? heroSource : 'hero.jpg';
  validated.assets = { ...(validated.assets || {}), hero: heroPersisted };

  await writeFile(hostessJsonPath, `${JSON.stringify(validated, null, 2)}\n`);
  console.log(`[provision] Wrote ${hostessJsonPath}`);

  // Client repos inherit template cms.site.json (tpl-*). Clear it so normal
  // previews never overlay demo CMS content (blank pages / wrong hostess).
  const cmsSitePath = resolve(projectRoot, 'cms.site.json');
  await writeFile(cmsSitePath, `${JSON.stringify({ siteSlug: '', workerName: '' }, null, 2)}\n`);
  console.log('[provision] Cleared cms.site.json template CMS slug');

  await pruneUnreferencedMedia(validated);
  writeHostessFavicon(validated);

  await updatePackageName(transformed.hostess.slug);

  const result = {
    slug: transformed.hostess.slug,
    submissionId: transformed.hostess.submissionId,
    repoName: transformed.repoName,
    displayName: transformed.hostess.profile.displayName,
  };

  console.log(`[provision] Result: ${JSON.stringify(result)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('[provision] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}