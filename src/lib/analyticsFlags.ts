import { readEnvBool } from '@/lib/runtimeEnv';

export function getAnalyticsFlags() {
  return {
    consentEnabled: readEnvBool('PUBLIC_CONSENT_ENABLED', false),
    analyticsEnabled: readEnvBool('PUBLIC_ANALYTICS_ENABLED', true),
  };
}
