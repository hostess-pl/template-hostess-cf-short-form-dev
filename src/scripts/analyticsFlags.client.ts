/** Flags injected on <html data-consent-enabled data-analytics-enabled> at request time. */
export function isConsentFeatureEnabled(): boolean {
  return document.documentElement.dataset.consentEnabled === '1';
}

export function isAnalyticsFeatureEnabled(): boolean {
  return document.documentElement.dataset.analyticsEnabled === '1';
}
