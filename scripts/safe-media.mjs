/**
 * Image/video URL / buffer allowlists and HTML escaping for untrusted Tally input.
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

/** sharp / magic-byte formats we accept after download (always re-encoded to JPEG). */
export const ALLOWED_IMAGE_FORMATS = new Set([
  'jpeg',
  'jpg',
  'png',
  'webp',
  'heic',
  'heif',
]);

/** Hostnames allowed for Tally (and future CDN) asset downloads */
export const ALLOWED_IMAGE_HOSTS = new Set([
  'storage.tally.so',
  'tally.so',
  'www.tally.so',
  'leeufppoeavlyrhjbzuy.supabase.co',
]);

export const ALLOWED_MEDIA_HOSTS = ALLOWED_IMAGE_HOSTS;

/** Explicit allowlist of path suffixes (empty path / no ext still OK — validated after download). */
export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);

export const ALLOWED_VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.m4v',
  '.webm',
  '.mov',
]);

export const ALLOWED_VIDEO_FORMATS = new Set(['mp4', 'm4v', 'webm', 'mov', 'quicktime']);

const DENIED_IMAGE_EXTENSIONS = new Set([
  '.svg',
  '.svgz',
  '.gif',
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.pdf',
  '.xml',
  '.mp4',
  '.m4v',
  '.webm',
  '.mov',
]);

const DENIED_VIDEO_EXTENSIONS = new Set([
  '.svg',
  '.svgz',
  '.gif',
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.pdf',
  '.xml',
  '.exe',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|\[::1\])/i;

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncateText(value, maxLen) {
  const s = String(value ?? '');
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

function assertHttpsTallyUrl(url, { deniedExts, allowedExts }) {
  const raw = String(url || '').trim();
  if (!raw) return { ok: false, error: 'empty_url' };

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'invalid_url' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'https_required' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'credentials_forbidden' };
  }

  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_RE.test(host) || PRIVATE_HOST_RE.test(parsed.href)) {
    return { ok: false, error: 'private_host_forbidden' };
  }
  if (!ALLOWED_MEDIA_HOSTS.has(host)) {
    return { ok: false, error: `host_not_allowed:${host}` };
  }

  const pathLower = parsed.pathname.toLowerCase();
  for (const ext of deniedExts) {
    if (pathLower.endsWith(ext)) {
      return { ok: false, error: `extension_denied:${ext}` };
    }
  }
  const lastSlash = pathLower.lastIndexOf('/');
  const base = pathLower.slice(lastSlash + 1);
  const dot = base.lastIndexOf('.');
  if (dot > 0) {
    const ext = base.slice(dot);
    if (!allowedExts.has(ext)) {
      return { ok: false, error: `extension_denied:${ext}` };
    }
  }

  return { ok: true, url: parsed };
}

/**
 * @param {string} url
 * @returns {{ ok: true, url: URL } | { ok: false, error: string }}
 */
export function assertAllowedImageUrl(url) {
  return assertHttpsTallyUrl(url, {
    deniedExts: DENIED_IMAGE_EXTENSIONS,
    allowedExts: ALLOWED_IMAGE_EXTENSIONS,
  });
}

/**
 * @param {string} url
 * @returns {{ ok: true, url: URL } | { ok: false, error: string }}
 */
export function assertAllowedVideoUrl(url) {
  return assertHttpsTallyUrl(url, {
    deniedExts: DENIED_VIDEO_EXTENSIONS,
    allowedExts: ALLOWED_VIDEO_EXTENSIONS,
  });
}

/**
 * Fast path for normalize (no sharp): URL policy only.
 * @param {string} url
 * @returns {string} empty string if rejected
 */
export function sanitizeAssetUrl(url) {
  const result = assertAllowedImageUrl(url);
  return result.ok ? String(url).trim() : '';
}

export function sanitizeVideoUrl(url) {
  const result = assertAllowedVideoUrl(url);
  return result.ok ? String(url).trim() : '';
}

/**
 * Detect image format from magic bytes (no sharp required).
 * @param {Buffer} buf
 * @returns {string|null}
 */
export function detectImageFormat(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'webp';
  }
  // HEIC/HEIF (ISO BMFF): size(4) + 'ftyp' + brand(4)
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12).replace(/\0/g, '');
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].includes(brand)) {
      return 'heic';
    }
  }
  // SVG / XML sniff
  const head = buf.subarray(0, Math.min(256, buf.length)).toString('utf8').trimStart();
  if (head.startsWith('<svg') || head.startsWith('<?xml') || head.includes('<svg')) {
    return 'svg';
  }
  if (head.startsWith('GIF87a') || head.startsWith('GIF89a')) return 'gif';
  return null;
}

/**
 * Detect video container from magic bytes.
 * @param {Buffer} buf
 * @returns {string|null} mp4 | webm | mov | null
 */
export function detectVideoFormat(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  // WebM / Matroska EBML
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return 'webm';
  }
  // ISO BMFF (mp4 / mov / m4v)
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12).replace(/\0/g, '');
    if (brand === 'qt  ' || brand.startsWith('qt')) return 'mov';
    if (['heic', 'heix', 'mif1', 'msf1', 'heim', 'heis'].includes(brand)) return null;
    return 'mp4';
  }
  return null;
}

/**
 * @param {Buffer} buf
 * @param {{ format?: string|null }} [meta]
 * @returns {{ ok: true, format: string } | { ok: false, error: string }}
 */
export function assertAllowedImageBuffer(buf, meta = {}) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return { ok: false, error: 'empty_buffer' };
  }
  if (buf.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: `too_large:${buf.length}` };
  }

  const magic = detectImageFormat(buf);
  if (magic === 'svg' || magic === 'gif') {
    return { ok: false, error: `format_denied:${magic}` };
  }

  let format = String(meta.format || magic || '')
    .toLowerCase()
    .replace('jpg', 'jpeg');
  if (format === 'heif') format = 'heic';

  if (!format || !ALLOWED_IMAGE_FORMATS.has(format)) {
    return { ok: false, error: `format_denied:${format || 'unknown'}` };
  }

  return { ok: true, format: format === 'jpg' ? 'jpeg' : format };
}

/**
 * @param {Buffer} buf
 * @returns {{ ok: true, format: string, extension: string } | { ok: false, error: string }}
 */
export function assertAllowedVideoBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return { ok: false, error: 'empty_buffer' };
  }
  if (buf.length > MAX_VIDEO_BYTES) {
    return { ok: false, error: `too_large:${buf.length}` };
  }

  const format = detectVideoFormat(buf);
  if (!format || !ALLOWED_VIDEO_FORMATS.has(format)) {
    return { ok: false, error: `format_denied:${format || 'unknown'}` };
  }

  const extension = format === 'mov' ? '.mov' : format === 'webm' ? '.webm' : '.mp4';
  return { ok: true, format, extension };
}

/** Safe on-disk basename for an event video (no user input). */
export function eventVideoFileName(eventIndex, extension = '.mp4') {
  const n = Number(eventIndex);
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    throw new Error(`invalid_event_index:${eventIndex}`);
  }
  const ext = String(extension || '.mp4').toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    throw new Error(`invalid_video_extension:${ext}`);
  }
  return `event-${n}${ext}`;
}

/**
 * Shell-safe base64 for piping JSON into scripts via `base64 -d`.
 * @param {unknown} value
 */
export function jsonToShellBase64(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
}
