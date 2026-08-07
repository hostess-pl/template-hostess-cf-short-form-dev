import { getAttribution } from '@/scripts/attribution';
import { isAnalyticsFeatureEnabled } from '@/scripts/analyticsFlags.client';
import { ensureVisitorIds } from '@/lib/analytics/visitor';

let initialized = false;

function currentLocale(): 'en' | 'pl' | 'es' {
  const lang = document.documentElement.lang;
  if (lang === 'pl' || lang === 'es') return lang;
  return 'en';
}

function basePayload() {
  const ids = ensureVisitorIds();
  if (!ids) return null;

  const attr = getAttribution();
  return {
    consent_analytics: true as const,
    visitor_id: ids.visitorId,
    session_id: ids.sessionId,
    locale: currentLocale(),
    referrer: attr.referrer ?? null,
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    traffic_source: attr.traffic_source,
    click_ids: attr.click_ids,
    company: '',
  };
}

function postJson(url: string, body: Record<string, unknown>): void {
  const payload = JSON.stringify(body);
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  });
}

export function trackPageView(): void {
  if (!isAnalyticsFeatureEnabled()) return;

  const base = basePayload();
  if (!base) return;

  const page_path = `${window.location.pathname}${window.location.search}`;
  postJson('/api/analytics/page-view', {
    ...base,
    page_path,
  });
}

export function initAnalytics(): void {
  if (!isAnalyticsFeatureEnabled()) return;
  if (initialized) {
    trackPageView();
    return;
  }

  initialized = true;
  trackPageView();
}

export function setupAnalyticsLifecycle(): void {
  if (!isAnalyticsFeatureEnabled()) return;

  initAnalytics();

  document.addEventListener('astro:page-load', () => {
    if (initialized) {
      trackPageView();
    }
  });
}

export { getAttribution };
