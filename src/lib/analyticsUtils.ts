import { createHash, createHmac } from 'node:crypto';

import { ANALYTICS_SALT } from 'astro:env/server';

import { readEnvString } from '@/lib/runtimeEnv';

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

function getAnalyticsSalt(): string {
  // Prefer astro:env (wired to CF Worker bindings); process.env is often empty on Workers.
  return (ANALYTICS_SALT || readEnvString('ANALYTICS_SALT')).trim();
}

export function getAnonymizedHash(email: string): string | null {
  const salt = getAnalyticsSalt();
  if (!salt) return null;
  return createHash('sha256')
    .update(email.trim().toLowerCase() + salt)
    .digest('hex');
}

export function getVisitorHash(visitorId: string): string | null {
  const salt = getAnalyticsSalt();
  if (!salt || !visitorId.trim()) return null;
  return createHmac('sha256', salt).update(visitorId.trim()).digest('hex');
}

export function detectDevice(ua: string | null | undefined): DeviceType {
  if (!ua) return 'unknown';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone|iPod|Opera Mini|IEMobile|BlackBerry/i.test(ua)) return 'mobile';
  return 'desktop';
}

export type NormalizedUtm = {
  utm_source: string;
  utm_medium: string | undefined;
  utm_campaign: string | undefined;
};

export function normalizeUtm(p: {
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  traffic_source?: unknown;
}): NormalizedUtm {
  const clean = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 && v.length <= 200 ? v : undefined;
  const traffic = clean(p.traffic_source);
  return {
    utm_source: clean(p.utm_source) ?? traffic ?? 'direct',
    utm_medium: clean(p.utm_medium),
    utm_campaign: clean(p.utm_campaign),
  };
}

/** Sanitize click-id param names only (never store raw click-id values). */
export function normalizeClickIdNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(['fbclid', 'gclid', 'msclkid', 'ttclid']);
  return value
    .filter((v): v is string => typeof v === 'string' && allowed.has(v))
    .slice(0, 4);
}
