#!/usr/bin/env node
/**
 * Ensure Hostesswebs Test Supabase Auth Site URL + redirect allowlist for multi-tenant CMS.
 *
 * Merges required wildcard patterns and any site-specific /edit/auth/callback URLs.
 * Never removes unrelated allowlist entries. Idempotent.
 *
 * Usage:
 *   node ensure-cms-auth-redirects.mjs
 *   node ensure-cms-auth-redirects.mjs --origin https://zofiawielinska.hostesswebs.pl
 *   SITE_URL=https://preview-x.hostesspl.workers.dev node ensure-cms-auth-redirects.mjs
 *
 * Env:
 *   WF_SUPABASE_ACCESS_TOKEN_HOSTESSWEBS (required)
 *   WF_SUPABASE_URL_HOSTESSWEBS_TEST or SUPABASE_URL (optional; derives project ref)
 *   SUPABASE_PROJECT_REF (optional override; default tdkxfaordqpoofqpyvjo)
 *   SITE_URL / PLATFORM_HOSTNAME / PLATFORM_FQDN (optional origins to allowlist)
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_REF = 'tdkxfaordqpoofqpyvjo';
const DEFAULT_SITE_URL = 'https://hostesswebs.pl';
const REQUIRED_PATTERNS = [
  'https://*.hostesswebs.pl/**',
  'https://*.hostesspl.workers.dev/**',
  'http://localhost:4321/**',
];
const ZOFIA_EXPLICIT = [
  'https://zofiawielinska.hostesswebs.pl/edit/auth/callback',
  'https://preview-z9v59x5.hostesspl.workers.dev/edit/auth/callback',
];

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

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

function resolveOpsEnvPath() {
  const fromEnv = String(process.env.HOSTESS_OPS_ROOT || process.env.ILURO_OPS_ROOT || '').trim();
  const candidates = [
    fromEnv ? resolve(fromEnv, '.env') : '',
    '/opt/iluro-core-ops/.env',
    '/opt/hostesswebs-n8n/.env',
    resolve(THIS_DIR, '../../.env'),
    resolve(process.cwd(), '.env'),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || '';
}

function parseArgs(argv) {
  const origins = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--origin' || arg === '--site-url') {
      const next = argv[i + 1];
      if (next) {
        origins.push(next);
        i += 1;
      }
      continue;
    }
    if (arg.startsWith('--origin=')) {
      origins.push(arg.slice('--origin='.length));
      continue;
    }
    if (arg.startsWith('--site-url=')) {
      origins.push(arg.slice('--site-url='.length));
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: ensure-cms-auth-redirects.mjs [--origin <url>]...  (env: SITE_URL, PLATFORM_HOSTNAME)',
      );
      process.exit(0);
    }
  }
  return { origins };
}

function normalizeOrigin(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  try {
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withScheme);
    if (!u.hostname) return '';
    return `${u.protocol}//${u.host}`.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function toCallbackUrl(originOrUrl) {
  const s = String(originOrUrl || '').trim();
  if (!s) return '';
  if (/\/edit\/auth\/callback\/?$/i.test(s)) {
    return s.replace(/\/$/, '');
  }
  const origin = normalizeOrigin(s);
  if (!origin) return '';
  return `${origin}/edit/auth/callback`;
}

function splitAllowList(raw) {
  return String(raw || '')
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function mergeAllowList(existing, additions) {
  const seen = new Set();
  const out = [];
  for (const item of [...existing, ...additions]) {
    const key = String(item).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function projectRefFromUrl(url) {
  try {
    const host = new URL(String(url)).hostname;
    const ref = host.split('.')[0];
    return ref && ref !== 'supabase' ? ref : '';
  } catch {
    return '';
  }
}

async function managementRequest(ref, token, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const detail = typeof data === 'object' ? JSON.stringify(data).slice(0, 400) : String(text).slice(0, 400);
    throw new Error(`supabase_auth_config_${response.status}:${detail}`);
  }
  return data;
}

export async function ensureCmsAuthRedirects(options = {}) {
  const fileEnv = loadEnvFile(resolveOpsEnvPath());
  const env = { ...fileEnv, ...process.env, ...(options.env || {}) };

  const token = String(
    env.WF_SUPABASE_ACCESS_TOKEN_HOSTESSWEBS || env.SUPABASE_ACCESS_TOKEN || '',
  ).trim();
  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing_WF_SUPABASE_ACCESS_TOKEN_HOSTESSWEBS',
    };
  }

  // Prefer the Supabase URL actually used by this deploy (Prod vs Test), not a hard-coded Test default.
  const ref =
    String(env.SUPABASE_PROJECT_REF || '').trim() ||
    projectRefFromUrl(env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '') ||
    projectRefFromUrl(env.WF_SUPABASE_URL_HOSTESSWEBS_PROD || '') ||
    projectRefFromUrl(env.WF_SUPABASE_URL_HOSTESSWEBS_TEST || '') ||
    DEFAULT_REF;

  const siteUrl = String(env.AUTH_SITE_URL || DEFAULT_SITE_URL).trim() || DEFAULT_SITE_URL;

  const extraOrigins = [
    ...(options.origins || []),
    env.SITE_URL,
    env.PLATFORM_HOSTNAME,
    env.PLATFORM_FQDN,
    env.PRODUCTION_HOSTNAME,
    ...(Array.isArray(options.extraCallbacks) ? options.extraCallbacks : []),
  ];

  const additions = [
    ...REQUIRED_PATTERNS,
    ...ZOFIA_EXPLICIT,
    ...extraOrigins.map(toCallbackUrl).filter(Boolean),
  ];

  const current = await managementRequest(ref, token, { method: 'GET' });
  const existingList = splitAllowList(current?.uri_allow_list);
  const merged = mergeAllowList(existingList, additions);
  const currentSiteUrl = String(current?.site_url || '').trim();
  const allowListChanged = merged.join(',') !== existingList.join(',');
  const siteUrlChanged = currentSiteUrl !== siteUrl;

  if (!allowListChanged && !siteUrlChanged) {
    return {
      ok: true,
      changed: false,
      ref,
      site_url: siteUrl,
      uri_allow_list: merged,
      added: [],
    };
  }

  await managementRequest(ref, token, {
    method: 'PATCH',
    body: {
      site_url: siteUrl,
      uri_allow_list: merged.join(','),
    },
  });

  const added = merged.filter((item) => !existingList.includes(item));
  return {
    ok: true,
    changed: true,
    ref,
    site_url: siteUrl,
    previous_site_url: currentSiteUrl,
    uri_allow_list: merged,
    added,
    site_url_updated: siteUrlChanged,
  };
}

async function main() {
  const { origins } = parseArgs(process.argv.slice(2));
  try {
    const result = await ensureCmsAuthRedirects({ origins });
    if (result.skipped) {
      console.warn(`[ensure-cms-auth-redirects] skipped: ${result.reason}`);
      process.exit(0);
      return;
    }
    if (!result.changed) {
      console.log(
        `[ensure-cms-auth-redirects] ok (unchanged) site_url=${result.site_url} allowlist=${result.uri_allow_list.length}`,
      );
    } else {
      console.log(
        `[ensure-cms-auth-redirects] updated site_url=${result.site_url}` +
          (result.previous_site_url ? ` (was ${result.previous_site_url})` : '') +
          ` allowlist=${result.uri_allow_list.length}` +
          (result.added?.length ? ` added=${result.added.length}` : ''),
      );
      if (result.added?.length) {
        for (const item of result.added) {
          console.log(`[ensure-cms-auth-redirects] + ${item}`);
        }
      }
    }
    console.log(`[ensure-cms-auth-redirects] Result: ${JSON.stringify({
      ok: result.ok,
      changed: result.changed,
      ref: result.ref,
      site_url: result.site_url,
      allowlist_count: result.uri_allow_list.length,
      added: result.added || [],
    })}`);
  } catch (error) {
    console.error(`[ensure-cms-auth-redirects] ${error?.message || error}`);
    process.exit(1);
  }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  await main();
}
