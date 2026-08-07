import {
  analyticsConsentKey,
  analyticsSessionKey,
  analyticsVisitorKey,
} from '@/config/analytics.keys';
import { isAnalyticsFeatureEnabled } from '@/scripts/analyticsFlags.client';

/** Banner choice is stored for future use; tracking is not gated on it. */
export function isAnalyticsConsented(): boolean {
  if (typeof window === 'undefined') return false;
  return isAnalyticsFeatureEnabled();
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureVisitorIds(): { visitorId: string; sessionId: string } | null {
  if (!isAnalyticsConsented()) return null;
  try {
    let visitorId = localStorage.getItem(analyticsVisitorKey);
    if (!visitorId) {
      visitorId = randomId();
      localStorage.setItem(analyticsVisitorKey, visitorId);
    }

    let sessionId = sessionStorage.getItem(analyticsSessionKey);
    if (!sessionId) {
      sessionId = randomId();
      sessionStorage.setItem(analyticsSessionKey, sessionId);
    }

    return { visitorId, sessionId };
  } catch {
    return null;
  }
}

export function clearVisitorIds(): void {
  try {
    localStorage.removeItem(analyticsVisitorKey);
    sessionStorage.removeItem(analyticsSessionKey);
  } catch {
    // storage blocked
  }
}

export function setAnalyticsConsent(accepted: boolean): void {
  try {
    localStorage.setItem(
      analyticsConsentKey,
      JSON.stringify({ categories: { analytics: accepted } }),
    );
    document.dispatchEvent(new CustomEvent('consent-updated'));
  } catch {
    // storage blocked
  }
}

export function hasConsentChoice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(analyticsConsentKey) !== null;
  } catch {
    return false;
  }
}
