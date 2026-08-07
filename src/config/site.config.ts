import { RESEND_FROM, RESEND_TO } from 'astro:env/server';

import { loadHostess, loadHostessJson } from '@/lib/hostess';
import { readEnvString } from '@/lib/runtimeEnv';
import type { HostessData } from '@/content/hostess.schema';

export type Locale = 'en' | 'pl' | 'es';

export interface SiteConfig {
  name: string;
  /** Person name for footer (legal name); empty when unavailable. */
  personName: string;
  title: string;
  description: string;
  url: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  location: string;
  resend: {
    fromEmail: string;
    managerEmail: string;
  };
  branding: {
    themeColor: string;
    backgroundColor: string;
  };
}

function normalizeSocialUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

/** Bare handles become https://instagram.com/<username>; full URLs are normalized. */
function normalizeInstagramUrl(value: string): string {
  const trimmed = value.trim().replace(/^@+/, '');
  if (!trimmed) return '';
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const igMatch = withoutProtocol.match(/^(?:www\.)?instagram\.com\/([^/?#]+)/i);
  if (igMatch?.[1]) return `https://instagram.com/${igMatch[1]}`;
  if (/instagram\.com/i.test(withoutProtocol)) return normalizeSocialUrl(trimmed);
  return `https://instagram.com/${trimmed}`;
}

/** Bare handles become https://www.tiktok.com/@<username>; full URLs are normalized. */
function normalizeTiktokUrl(value: string): string {
  const trimmed = value.trim().replace(/^@+/, '');
  if (!trimmed) return '';
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const ttMatch = withoutProtocol.match(/^(?:www\.)?tiktok\.com\/@?([^/?#]+)/i);
  if (ttMatch?.[1]) {
    const handle = ttMatch[1].replace(/^@+/, '');
    return handle ? `https://www.tiktok.com/@${handle}` : '';
  }
  if (/tiktok\.com/i.test(withoutProtocol)) return normalizeSocialUrl(trimmed);
  return `https://www.tiktok.com/@${trimmed}`;
}

function resolvePersonName(hostess: HostessData): string {
  const legal = (hostess.profile.legalName || '').trim();
  if (legal) return legal;
  const display = (hostess.profile.displayName || '').trim();
  if (display && !/\.[a-z]{2,}/i.test(display)) return display;
  return '';
}

/** Prefer Polish when enabled so PL-only sites are not stuck on English `/`. */
export function getDefaultLocale(): Locale {
  const list = getLocales();
  return list.includes('pl') ? 'pl' : list[0] ?? 'en';
}

/** Request-scoped locales (CMS overlay via loadHostess when present). */
export function getLocales(): Locale[] {
  return [...(loadHostess().locales as Locale[])];
}

/**
 * Baked locales for static iteration in components.
 * Prefer getLocales() in middleware / request-scoped routing.
 */
export const locales: Locale[] = [...(loadHostessJson().locales as Locale[])];

function buildSiteConfig(hostess: HostessData): SiteConfig {
  return {
    name: hostess.profile.displayName,
    personName: resolvePersonName(hostess),
    title: `${hostess.profile.displayName} — Professional Hostess`,
    description: hostess.bio.short,
    url: import.meta.env.SITE_URL || 'https://hostess-template.workers.dev',
    email: hostess.profile.email,
    instagram: normalizeInstagramUrl(hostess.profile.socials.instagram),
    facebook: normalizeSocialUrl(hostess.profile.socials.facebook),
    tiktok: normalizeTiktokUrl(hostess.profile.socials.tiktok),
    linkedin: normalizeSocialUrl(hostess.profile.socials.linkedin),
    location: hostess.profile.location,
    resend: {
      fromEmail: RESEND_FROM || readEnvString('RESEND_FROM') || 'Portfolio <noreply@example.com>',
      managerEmail: RESEND_TO || readEnvString('RESEND_TO') || hostess.profile.email,
    },
    branding: {
      themeColor: hostess.branding.themeColor,
      backgroundColor: hostess.branding.backgroundColor,
    },
  };
}

/** Request-scoped site config (CMS overlay aware). Object Proxy — not Array. */
const siteConfig: SiteConfig = new Proxy({} as SiteConfig, {
  get(_target, prop) {
    const cfg = buildSiteConfig(loadHostess());
    const value = Reflect.get(cfg as object, prop);
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(cfg) : value;
  },
});

export default siteConfig;
