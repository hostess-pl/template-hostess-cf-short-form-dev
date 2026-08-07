import type { SupabaseClient } from '@supabase/supabase-js';

import { analyticsRepoKey, analyticsSubprojectId } from '@/config/analytics.profile';

import { ANALYTICS_SITE_ID, SITE_URL } from 'astro:env/server';

import { getAnalyticsEnv } from './analyticsEnv';
import { readEnvString } from './runtimeEnv';

let cachedDeploymentSiteId: { id: string; expiresAt: number } | null = null;
const DEPLOYMENT_SITE_CACHE_MS = 60_000;

export function getAnalyticsSubprojectId(): string {
  const override = (ANALYTICS_SITE_ID || readEnvString('ANALYTICS_SITE_ID')).trim();
  if (override) return override;
  return analyticsSubprojectId;
}

export function getDeployHost(): string {
  const siteUrl = (
    SITE_URL
    || readEnvString('SITE_URL')
    || (typeof import.meta.env.SITE === 'string' ? import.meta.env.SITE : '')
  ).trim();
  if (!siteUrl) return 'unknown';
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return siteUrl;
  }
}

export function fallbackDeploymentSiteId(): string {
  return `${getAnalyticsSubprojectId()}:${getAnalyticsEnv()}`;
}

function isUsableSiteId(id: string): boolean {
  const trimmed = id.trim();
  return trimmed.length > 0 && !trimmed.startsWith('unknown:');
}

/**
 * Resolve deployment leaf site_id (e.g. preview-karolina-minimal:production).
 * Never persist RPC fallback `unknown:*` — that hides events from the metrics hub.
 */
export async function resolveDeploymentSiteId(supabase: SupabaseClient): Promise<string> {
  const now = Date.now();
  if (cachedDeploymentSiteId && cachedDeploymentSiteId.expiresAt > now) {
    return cachedDeploymentSiteId.id;
  }

  const { data, error } = await supabase.rpc('analytics_resolve_site', {
    p_hostname: getDeployHost(),
    p_env: getAnalyticsEnv(),
    p_repo_key: analyticsRepoKey,
  });

  const resolved =
    !error && typeof data === 'string' && isUsableSiteId(data) ? data.trim() : '';
  const id = resolved || fallbackDeploymentSiteId();

  cachedDeploymentSiteId = { id, expiresAt: now + DEPLOYMENT_SITE_CACHE_MS };
  return id;
}

export function invalidateDeploymentSiteCache(): void {
  cachedDeploymentSiteId = null;
}
