import { SUPABASE_TRACKING_ENABLED } from 'astro:env/server';
import { z } from 'astro/zod';

import { readEnvBool } from '@/lib/runtimeEnv';

import { getAnalyticsEnv } from './analyticsEnv';
import {
  invalidateProfileCache,
  isCollectEnabled,
  resolveSiteProfile,
  syncSiteProfile,
} from './analyticsProfile';
import { getAnalyticsSubprojectId, getDeployHost, resolveDeploymentSiteId } from './analyticsSite';
import { getSupabaseAdmin } from './supabase';
import {
  type DeviceType,
  getAnonymizedHash,
  getVisitorHash,
  normalizeClickIdNames,
  normalizeUtm,
} from './analyticsUtils';
import { isShortFormProductMode, shouldCollectPublicAnalytics } from './portfolioMode';
import { resolveCmsSite } from './cms/site';

const localeSchema = z.enum(['en', 'pl', 'es']);

const attributionFields = {
  referrer: z.string().max(2000).optional().nullable(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  traffic_source: z.string().max(200).optional(),
  click_ids: z.array(z.enum(['fbclid', 'gclid', 'msclkid', 'ttclid'])).max(4).optional(),
};

export const consentClientFields = {
  consent_analytics: z.literal(true),
  visitor_id: z.string().uuid(),
  session_id: z.string().uuid(),
  company: z.string().max(0).optional(),
};

export const pageViewPayloadSchema = z
  .object({
    ...consentClientFields,
    ...attributionFields,
    locale: localeSchema.optional(),
    page_path: z.string().max(500),
  })
  .strict();

export type PageViewPayload = z.infer<typeof pageViewPayloadSchema>;

export type AnalyticsContext = {
  email: string;
  locale: string;
  page_path: string;
  device_type: DeviceType;
  referrer?: string | null;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  traffic_source?: string;
  click_ids?: string[];
};

type AnalyticsEventInsert = {
  event_type: string;
  user_hash: string;
  locale: string;
  page_path: string;
  device_type: DeviceType;
  referrer?: string | null;
  utm_source: string;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  metadata?: Record<string, unknown>;
};

function shouldTrackSupabase(): boolean {
  // Prefer astro:env (wired to CF Worker bindings); process.env is often empty on Workers.
  if (SUPABASE_TRACKING_ENABLED === true) return true;
  return readEnvBool('SUPABASE_TRACKING_ENABLED', false);
}

async function insertAnalyticsEvent(row: AnalyticsEventInsert): Promise<void> {
  if (!shouldTrackSupabase()) return;

  // Short-form: collect only after publish (not while draft).
  if (isShortFormProductMode()) {
    try {
      const site = await resolveCmsSite();
      if (site && !shouldCollectPublicAnalytics(site.portfolio_status)) {
        return;
      }
    } catch {
      // Fail closed for short-form if site status cannot be resolved.
      return;
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const env = getAnalyticsEnv();
  const subprojectId = getAnalyticsSubprojectId();

  try {
    await syncSiteProfile(supabase);
    const profile = await resolveSiteProfile(supabase);
    if (!isCollectEnabled(profile, row.event_type)) {
      return;
    }

    const site_id = await resolveDeploymentSiteId(supabase);

    const metadata = {
      ...(row.metadata ?? {}),
      subproject_id: subprojectId,
      env,
      deploy_host: getDeployHost(),
    };

    const { error } = await supabase.from('analytics_events').insert({
      ...row,
      site_id,
      env,
      metadata,
    });

    if (error) console.error('[Supabase Analytics Error]:', error.message);
  } catch (e) {
    console.error('[Supabase Analytics Error]:', e);
  } finally {
    invalidateProfileCache();
  }
}

export async function trackPageView(
  payload: PageViewPayload,
  deviceType: DeviceType = 'unknown',
): Promise<void> {
  const user_hash = getVisitorHash(payload.visitor_id);
  if (!user_hash) return;

  const utm = normalizeUtm(payload);
  const clickIds = normalizeClickIdNames(payload.click_ids);
  await insertAnalyticsEvent({
    event_type: 'page_view',
    user_hash,
    locale: payload.locale ?? 'en',
    page_path: payload.page_path,
    device_type: deviceType,
    referrer: payload.referrer ?? null,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    metadata: {
      session_id: payload.session_id,
      traffic_source: utm.utm_source,
      ...(clickIds.length ? { click_ids: clickIds } : {}),
    },
  });
}

export async function trackLeadCaptured(ctx: AnalyticsContext): Promise<void> {
  const user_hash = getAnonymizedHash(ctx.email);
  if (!user_hash) return;

  const utm = normalizeUtm(ctx);
  const clickIds = normalizeClickIdNames(ctx.click_ids);
  await insertAnalyticsEvent({
    event_type: 'lead_captured',
    user_hash,
    locale: ctx.locale,
    page_path: ctx.page_path,
    device_type: ctx.device_type,
    referrer: ctx.referrer ?? null,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    metadata: {
      traffic_source: utm.utm_source,
      ...(clickIds.length ? { click_ids: clickIds } : {}),
    },
  });
}
