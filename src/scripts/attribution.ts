import { attributionStorageKey } from '@/config/analytics.keys';

const CLICK_ID_PARAMS = ['fbclid', 'gclid', 'msclkid', 'ttclid'] as const;

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  /** Known click-id query param names present on first touch (names only, not values). */
  click_ids?: string[];
  referrer?: string | null;
  /** Display label: utm_source → click-id name → referrer host → direct */
  traffic_source?: string;
};

function referrerHost(referrer: string | null | undefined): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).hostname.replace(/^www\./i, '') || undefined;
  } catch {
    return undefined;
  }
}

/** Resolve a stable traffic source label for dashboards (no invented brand names). */
export function resolveTrafficSource(attr: Attribution): string {
  const utm = typeof attr.utm_source === 'string' ? attr.utm_source.trim() : '';
  if (utm) return utm;
  if (Array.isArray(attr.click_ids) && attr.click_ids.length > 0) {
    return attr.click_ids[0]!;
  }
  const host = referrerHost(attr.referrer);
  if (host) return host;
  return 'direct';
}

export function captureAttributionOnce(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(attributionStorageKey)) return;
    const url = new URL(window.location.href);
    const referrer = document.referrer || '';
    const isExternal = referrer && !referrer.startsWith(window.location.origin);
    const click_ids = CLICK_ID_PARAMS.filter((key) => Boolean(url.searchParams.get(key)));
    const attribution: Attribution = {
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined,
      click_ids: click_ids.length ? click_ids : undefined,
      referrer: isExternal ? referrer : null,
    };
    attribution.traffic_source = resolveTrafficSource(attribution);
    sessionStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
  } catch {
    // sessionStorage blocked
  }
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(attributionStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed.traffic_source) {
      parsed.traffic_source = resolveTrafficSource(parsed);
    }
    return parsed;
  } catch {
    return {};
  }
}
