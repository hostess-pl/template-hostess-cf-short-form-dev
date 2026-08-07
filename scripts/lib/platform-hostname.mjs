/**
 * Platform hostname allocation for *.hostesswebs.pl (preview + production branding).
 * Pure candidate generation is sync; occupancy checks are injected for testability.
 */

export const DEFAULT_PLATFORM_ZONE = 'hostesswebs.pl';

export const RESERVED_PLATFORM_LABELS = new Set([
  'www',
  'pay',
  'mail',
  'email',
  'smtp',
  'api',
  'app',
  'edit',
  'cms',
  'admin',
  'ops',
  'status',
  'cdn',
  'static',
  'assets',
  'media',
  'auth',
  'login',
  'kontakt',
  'contact',
  'support',
  'help',
  'docs',
  'blog',
  'shop',
  'store',
  'billing',
  'invoice',
  'hostess',
  'hostesswebs',
  'preview',
  'live',
  'test',
  'staging',
  'dev',
  'demo',
  'karolina',
]);

/**
 * @param {string} fullName
 * @returns {string[]}
 */
export function nameTokensFromFullName(fullName) {
  const normalized = String(fullName || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim();
  if (!normalized) return [];
  return normalized
    .split(/[\s-]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
}

/**
 * Build ordered label candidates (without zone).
 * 1 concat, 2 hyphenated, 3 concat+lastLetter, 4 hyphenated+lastLetter,
 * then safety suffixes with shortSubmissionId.
 *
 * @param {{ legalName?: string, displayName?: string, submissionId?: string }} input
 * @returns {string[]}
 */
export function buildPlatformLabelCandidates(input = {}) {
  const fullName = String(input.legalName || input.displayName || '').trim();
  const tokens = nameTokensFromFullName(fullName);
  if (tokens.length === 0) return [];

  const concat = tokens.join('');
  const hyphenated = tokens.join('-');
  const last = tokens[tokens.length - 1];
  const lastChar = last.slice(-1);
  const concatRepeat = lastChar ? `${concat}${lastChar}` : concat;
  const hyphenRepeat = lastChar ? `${hyphenated}${lastChar}` : hyphenated;

  const primary = [concat, hyphenated, concatRepeat, hyphenRepeat]
    .map((label) => clampDnsLabel(label))
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const label of primary) {
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }

  const shortId = String(input.submissionId || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  if (shortId) {
    for (const base of [...out]) {
      const safety = clampDnsLabel(`${base}-${shortId}`);
      if (safety && !seen.has(safety)) {
        seen.add(safety);
        out.push(safety);
      }
    }
  }

  return out;
}

function clampDnsLabel(label) {
  let v = String(label || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  v = v.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (v.length > 63) v = v.slice(0, 63).replace(/-$/, '');
  if (v.length < 1) return '';
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(v) && v.length > 1) return '';
  if (v.length === 1 && !/^[a-z0-9]$/.test(v)) return '';
  return v;
}

export function getCfPlatformZone(env = {}) {
  return String(env.WF_CF_PLATFORM_ZONE || DEFAULT_PLATFORM_ZONE).trim().toLowerCase() || DEFAULT_PLATFORM_ZONE;
}

/**
 * @param {string} label
 * @param {string} zone
 */
export function buildPlatformFqdn(label, zone = DEFAULT_PLATFORM_ZONE) {
  const l = clampDnsLabel(label);
  const z = String(zone || DEFAULT_PLATFORM_ZONE).trim().toLowerCase();
  if (!l || !z) return '';
  return `${l}.${z}`;
}

/**
 * @param {string} label
 * @param {Set<string>|string[]} reserved
 */
export function isReservedPlatformLabel(label, reserved = RESERVED_PLATFORM_LABELS) {
  const set = reserved instanceof Set ? reserved : new Set(reserved);
  return set.has(String(label || '').toLowerCase());
}

/**
 * Allocate first free platform hostname.
 *
 * @param {object} input
 * @param {string} [input.legalName]
 * @param {string} [input.displayName]
 * @param {string} [input.submissionId]
 * @param {string} [input.zone]
 * @param {Set<string>|string[]} [input.reserved]
 * @param {(fqdn: string, label: string) => boolean | Promise<boolean>} [input.isTaken]
 * @returns {Promise<{ ok: boolean, fqdn?: string, label?: string, candidateIndex?: number, error?: string, candidates?: string[] }>}
 */
export async function allocatePlatformHostname(input = {}) {
  const zone = String(input.zone || DEFAULT_PLATFORM_ZONE).trim().toLowerCase() || DEFAULT_PLATFORM_ZONE;
  const candidates = buildPlatformLabelCandidates(input);
  if (candidates.length === 0) {
    return { ok: false, error: 'platform_hostname_name_required', candidates };
  }

  const isTaken = typeof input.isTaken === 'function'
    ? input.isTaken
    : async () => false;

  for (let i = 0; i < candidates.length; i += 1) {
    const label = candidates[i];
    if (isReservedPlatformLabel(label, input.reserved)) continue;
    const fqdn = buildPlatformFqdn(label, zone);
    const taken = await isTaken(fqdn, label);
    if (taken) continue;
    return {
      ok: true,
      fqdn,
      label,
      candidateIndex: i,
      candidates,
      zone,
    };
  }

  return {
    ok: false,
    error: 'platform_hostname_exhausted',
    candidates,
    zone,
  };
}
