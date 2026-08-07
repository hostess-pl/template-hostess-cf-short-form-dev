import { ANALYTICS_ENV } from 'astro:env/server';

import { readEnvString } from '@/lib/runtimeEnv';

export function getAnalyticsEnv(): string {
  const raw = (ANALYTICS_ENV || readEnvString('ANALYTICS_ENV')).trim();
  if (raw) return raw;
  return import.meta.env.PROD ? 'production' : 'development';
}
