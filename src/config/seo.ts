import { loadHostess } from '@/lib/hostess';
import { getDefaultLocale, getLocales, type Locale } from '@/config/site.config';

export interface LocaleSeo {
  title: string;
  description: string;
  ogLocale: string;
  jobTitle: string;
}

const ogLocales: Record<Locale, string> = {
  en: 'en_US',
  pl: 'pl_PL',
  es: 'es_ES',
};

const jobTitles: Record<Locale, string> = {
  en: 'Professional Hostess',
  pl: 'Profesjonalna hostessa',
  es: 'Azafata profesional',
};

function buildSeo(): Record<Locale, LocaleSeo> {
  const hostess = loadHostess();
  const name = hostess.profile.displayName;
  const location = hostess.profile.location;
  const bio = hostess.bio.short;
  return {
    en: {
      title: `${name} — Professional Hostess`,
      description: `${bio} Professional hostess in ${location}.`,
      ogLocale: ogLocales.en,
      jobTitle: jobTitles.en,
    },
    pl: {
      title: `${name} — Profesjonalna hostessa`,
      description: `${bio} Profesjonalna hostessa w ${location}.`,
      ogLocale: ogLocales.pl,
      jobTitle: jobTitles.pl,
    },
    es: {
      title: `${name} — Azafata profesional`,
      description: `${bio} Azafata profesional en ${location}.`,
      ogLocale: ogLocales.es,
      jobTitle: jobTitles.es,
    },
  };
}

/** Request-scoped SEO (CMS overlay aware). */
export const seo: Record<Locale, LocaleSeo> = new Proxy({} as Record<Locale, LocaleSeo>, {
  get(_target, prop) {
    return Reflect.get(buildSeo() as object, prop);
  },
});

export function localePath(locale: Locale): string {
  if (locale === getDefaultLocale()) return '/';
  return `/${locale}`;
}

export function localeUrl(locale: Locale, baseUrl: string): string {
  return new URL(localePath(locale), baseUrl).href;
}

export function isEnabledLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'pl' || value === 'es'
    ? getLocales().includes(value)
    : false;
}

/** Locale encoded in the URL path segment (not the default root). */
export function localeFromPath(pathname: string): Locale | null {
  if (pathname === '/' || pathname === '') return getDefaultLocale();
  const match = pathname.match(/^\/(en|pl|es)(?:\/|$)/);
  if (!match) return null;
  const locale = match[1] as Locale;
  return isEnabledLocale(locale) ? locale : null;
}
