#!/usr/bin/env node
/**
 * Allocate + attach *.hostesswebs.pl Workers Custom Domain for a preview/live worker.
 * Env: CLOUDFLARE_API_TOKEN or WF_CLOUDFLARE_API_TOKEN, WF_CLOUDFLARE_ACCOUNT_ID,
 *      WF_CF_PLATFORM_ZONE (default hostesswebs.pl),
 *      WORKER_NAME (required), PLATFORM_HOSTNAME (optional override),
 *      or hostess.json legalName/displayName + submissionId for allocation.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allocatePlatformHostname,
  getCfPlatformZone,
  buildPlatformFqdn,
} from './lib/platform-hostname.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile('/opt/iluro-core-ops/.env'),
  ...loadEnvFile(resolve(root, '.env')),
};
const env = { ...fileEnv, ...process.env };

const apiToken = String(env.CLOUDFLARE_API_TOKEN || env.WF_CLOUDFLARE_API_TOKEN || '').trim();
const accountId = String(env.CLOUDFLARE_ACCOUNT_ID || env.WF_CLOUDFLARE_ACCOUNT_ID || '').trim();
const workerName = String(env.WORKER_NAME || '').trim();
const zoneName = getCfPlatformZone(env);
const allocateOnly = ['1', 'true', 'yes'].includes(
  String(env.PLATFORM_ALLOCATE_ONLY || '').trim().toLowerCase(),
);
const attachOnly = ['1', 'true', 'yes'].includes(
  String(env.PLATFORM_ATTACH_ONLY || '').trim().toLowerCase(),
);

if (!apiToken || !accountId) {
  console.error(JSON.stringify({ ok: false, error: 'cloudflare_credentials_missing' }));
  process.exit(1);
}
if (!workerName && !allocateOnly) {
  console.error(JSON.stringify({ ok: false, error: 'worker_name_required' }));
  process.exit(1);
}

async function cf(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success !== false, status: res.status, data };
}

async function resolveZoneId() {
  const listed = await cf(`/zones?name=${encodeURIComponent(zoneName)}`);
  const zones = Array.isArray(listed.data?.result) ? listed.data.result : [];
  const zone = zones.find((z) => String(z?.name || '').toLowerCase() === zoneName) || zones[0];
  return zone?.id || '';
}

async function isTaken(fqdn, zoneId) {
  const host = String(fqdn || '').toLowerCase();
  const domains = await cf(
    `/accounts/${accountId}/workers/domains?hostname=${encodeURIComponent(host)}`,
  );
  const rows = Array.isArray(domains.data?.result) ? domains.data.result : [];
  const foreign = rows.filter((r) => String(r?.service || '') !== workerName);
  if (foreign.length > 0) return true;
  // Same worker already owns this hostname — reusable (not taken by someone else).
  if (rows.some((r) => String(r?.service || '') === workerName)) return false;
  if (zoneId) {
    const dns = await cf(
      `/zones/${zoneId}/dns_records?name=${encodeURIComponent(host)}&per_page=5`,
    );
    const dnsRows = Array.isArray(dns.data?.result) ? dns.data.result : [];
    // DNS present without our worker binding may be occupied; if our worker owns it above, we already returned.
    if (dnsRows.length > 0 && rows.length === 0) return true;
  }
  return false;
}

async function attach(hostname, zoneId) {
  const existing = await cf(
    `/accounts/${accountId}/workers/domains?hostname=${encodeURIComponent(hostname)}`,
  );
  const rows = Array.isArray(existing.data?.result) ? existing.data.result : [];
  const match = rows.find(
    (r) =>
      String(r?.hostname || '').toLowerCase() === hostname &&
      String(r?.service || '') === workerName,
  );
  if (match) {
    return { ok: true, reused: true, domain: match };
  }
  const body = {
    hostname,
    service: workerName,
    environment: 'production',
  };
  if (zoneId) body.zone_id = zoneId;
  const created = await cf(`/accounts/${accountId}/workers/domains`, {
    method: 'POST',
    body,
  });
  if (!created.ok) {
    return {
      ok: false,
      error: created.data?.errors?.[0]?.message || 'worker_domain_attach_failed',
      status: created.status,
    };
  }
  return { ok: true, attached: true, domain: created.data?.result || null };
}

function loadHostess() {
  try {
    return JSON.parse(readFileSync(resolve(root, 'src/content/hostess.json'), 'utf8'));
  } catch {
    return null;
  }
}

const zoneId = await resolveZoneId();
if (!zoneId) {
  console.error(JSON.stringify({ ok: false, error: 'platform_zone_not_found', zone: zoneName }));
  process.exit(1);
}

let fqdn = String(env.PLATFORM_HOSTNAME || env.PLATFORM_FQDN || '')
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .split('/')[0];

if (!fqdn && !attachOnly) {
  const hostess = loadHostess();
  const allocated = await allocatePlatformHostname({
    legalName: hostess?.profile?.legalName,
    displayName: hostess?.profile?.displayName,
    submissionId: hostess?.submissionId || env.PREVIEW_ID || env.SUBMISSION_ID,
    zone: zoneName,
    isTaken: async (candidate) => isTaken(candidate, zoneId),
  });
  if (!allocated.ok) {
    console.error(JSON.stringify({ ok: false, error: allocated.error, candidates: allocated.candidates }));
    process.exit(1);
  }
  fqdn = allocated.fqdn;
} else if (fqdn && !fqdn.includes('.')) {
  fqdn = buildPlatformFqdn(fqdn, zoneName);
}

if (!fqdn) {
  console.error(JSON.stringify({ ok: false, error: 'platform_hostname_required' }));
  process.exit(1);
}

if (allocateOnly) {
  console.log(JSON.stringify({
    ok: true,
    fqdn,
    siteUrl: `https://${fqdn}`,
    workerName,
    zone: zoneName,
    zoneId,
    allocateOnly: true,
  }));
  process.exit(0);
}

const attached = await attach(fqdn, zoneId);
if (!attached.ok) {
  console.error(JSON.stringify({ ok: false, fqdn, error: attached.error, status: attached.status }));
  process.exit(1);
}

const out = {
  ok: true,
  fqdn,
  siteUrl: `https://${fqdn}`,
  workerName,
  zone: zoneName,
  zoneId,
  reused: Boolean(attached.reused),
  attached: Boolean(attached.attached),
};
console.log(JSON.stringify(out));
