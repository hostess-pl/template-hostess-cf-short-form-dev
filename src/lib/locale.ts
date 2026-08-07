import type { Locale } from '@/config/site.config';

const VALID_LOCALES: Locale[] = ['en', 'pl', 'es'];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'pl' || value === 'es';
}

/** Resolve locale from Accept-Language: pl → pl, es/ca → es, otherwise en. */
export function resolveLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return 'en';

  const preferences = header
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';');
      const q = qPart?.trim().startsWith('q=') ? Number.parseFloat(qPart.trim().slice(2)) : 1;
      const primary = tag.trim().toLowerCase().split('-')[0] ?? '';
      return { primary, q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { primary } of preferences) {
    if (primary === 'pl') return 'pl';
    if (primary === 'es' || primary === 'ca') return 'es';
  }

  return 'en';
}

export function resolveRequestLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return resolveLocaleFromAcceptLanguage(acceptLanguage);
}

export { VALID_LOCALES };
