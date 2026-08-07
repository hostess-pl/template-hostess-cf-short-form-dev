import { isAnalyticsFeatureEnabled, isConsentFeatureEnabled } from '@/scripts/analyticsFlags.client';
import { hasConsentChoice, setAnalyticsConsent } from '@/lib/analytics/visitor';
import { captureAttributionOnce } from '@/scripts/attribution';

export function isConsentedForForm(): boolean {
  return isAnalyticsFeatureEnabled();
}

export function initConsentBanner(): void {
  if (!isConsentFeatureEnabled()) return;

  captureAttributionOnce();

  const banner = document.getElementById('consent-banner');
  if (!banner) return;

  if (hasConsentChoice()) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');

  const acceptBtn = document.getElementById('consent-accept');
  const declineBtn = document.getElementById('consent-decline');

  acceptBtn?.addEventListener('click', () => {
    setAnalyticsConsent(true);
    banner.classList.add('hidden');
  });

  declineBtn?.addEventListener('click', () => {
    setAnalyticsConsent(false);
    banner.classList.add('hidden');
  });
}
