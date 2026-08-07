import { createHash } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  analyticsProfile,
  analyticsProjectId,
  analyticsRepoKey,
} from '@/config/analytics.profile';
import {
  type AnalyticsEventKey,
  type AnalyticsSiteProfile,
  analyticsSiteProfileSchema,
} from '@/lib/analyticsProfileSchema';
import { getAnalyticsEnv } from '@/lib/analyticsEnv';
import {
  fallbackDeploymentSiteId,
  getAnalyticsSubprojectId,
  getDeployHost,
} from '@/lib/analyticsSite';

type ProfileRow = {
  subproject_id: string;
  profile_version: number;
  config: unknown;
  repo_profile_hash: string | null;
};

let cachedProfile: { profile: AnalyticsSiteProfile; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export function getRepoProfile(): AnalyticsSiteProfile {
  return analyticsSiteProfileSchema.parse(analyticsProfile);
}

export function hashRepoProfile(profile: AnalyticsSiteProfile): string {
  return createHash('sha256').update(JSON.stringify(profile)).digest('hex');
}

function parseProfileConfig(raw: unknown): AnalyticsSiteProfile | null {
  const parsed = analyticsSiteProfileSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function syncSiteProfile(supabase: SupabaseClient): Promise<void> {
  const subprojectId = getAnalyticsSubprojectId();
  const repoProfile = getRepoProfile();
  const repoHash = hashRepoProfile(repoProfile);
  const now = new Date().toISOString();

  const { data: existing, error: fetchErr } = await supabase
    .from('analytics_subproject_profiles')
    .select('subproject_id, profile_version, config, repo_profile_hash')
    .eq('subproject_id', subprojectId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[analyticsProfile] sync fetch error:', fetchErr.message);
    return;
  }

  const row = existing as ProfileRow | null;
  const profileUnchanged = row?.repo_profile_hash === repoHash;

  const { error: subprojectErr } = await supabase.from('analytics_subprojects').upsert(
    {
      subproject_id: subprojectId,
      project_id: analyticsProjectId,
      display_name: repoProfile.display_name,
      repo_key: analyticsRepoKey,
      updated_at: now,
    },
    { onConflict: 'subproject_id' },
  );

  if (subprojectErr) {
    console.error('[analyticsProfile] sync subproject upsert error:', subprojectErr.message);
    return;
  }

  if (!profileUnchanged) {
    const { error: profileErr } = await supabase.from('analytics_subproject_profiles').upsert(
      {
        subproject_id: subprojectId,
        profile_version: (row?.profile_version ?? 0) + 1,
        config: repoProfile,
        repo_profile_hash: repoHash,
        updated_at: now,
      },
      { onConflict: 'subproject_id' },
    );

    if (profileErr) {
      console.error('[analyticsProfile] sync profile upsert error:', profileErr.message);
      return;
    }

    cachedProfile = null;
  }

  // Always register the deployment leaf so hub queries by subproject→sites find events.
  const env = getAnalyticsEnv();
  const siteId = fallbackDeploymentSiteId();
  const hostname = getDeployHost();
  const { error: siteErr } = await supabase.from('analytics_sites').upsert(
    {
      site_id: siteId,
      subproject_id: subprojectId,
      hostname: hostname === 'unknown' ? `${subprojectId}.workers.dev` : hostname,
      env,
      display_name: repoProfile.display_name,
      is_primary: true,
      active: true,
      updated_at: now,
    },
    { onConflict: 'site_id' },
  );

  if (siteErr) {
    console.error('[analyticsProfile] sync site upsert error:', siteErr.message);
  }
}

export async function resolveSiteProfile(supabase: SupabaseClient): Promise<AnalyticsSiteProfile> {
  const now = Date.now();
  if (cachedProfile && cachedProfile.expiresAt > now) {
    return cachedProfile.profile;
  }

  const subprojectId = getAnalyticsSubprojectId();
  const { data, error } = await supabase
    .from('analytics_subproject_profiles')
    .select('config')
    .eq('subproject_id', subprojectId)
    .maybeSingle();

  if (error) {
    console.error('[analyticsProfile] resolve error:', error.message);
    const fallback = getRepoProfile();
    cachedProfile = { profile: fallback, expiresAt: now + CACHE_TTL_MS };
    return fallback;
  }

  const dbProfile = parseProfileConfig((data as { config?: unknown } | null)?.config);
  const profile = dbProfile ?? getRepoProfile();
  cachedProfile = { profile, expiresAt: now + CACHE_TTL_MS };
  return profile;
}

export function isCollectEnabled(
  profile: AnalyticsSiteProfile,
  eventType: string,
): eventType is AnalyticsEventKey {
  const flags = profile.events[eventType as AnalyticsEventKey];
  return flags?.collect === true;
}

export function invalidateProfileCache(): void {
  cachedProfile = null;
}
