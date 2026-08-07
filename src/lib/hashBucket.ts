import { createHmac } from 'node:crypto';

import { ANALYTICS_SALT, RATE_LIMIT_SALT } from 'astro:env/server';

import { readEnvString } from '@/lib/runtimeEnv';

function getRateLimitSalt(): string {
  const salt =
    (RATE_LIMIT_SALT || readEnvString('RATE_LIMIT_SALT') || ANALYTICS_SALT || readEnvString('ANALYTICS_SALT')).trim();
  if (!salt) {
    if (import.meta.env.DEV) {
      console.warn('[rate-limit] RATE_LIMIT_SALT unset; using dev-only fallback');
    }
    return 'dev-rate-limit-salt-change-in-production';
  }
  return salt;
}

export function hashIpBucket(ip: string): string {
  return createHmac('sha256', getRateLimitSalt()).update(ip || 'unknown').digest('hex');
}
