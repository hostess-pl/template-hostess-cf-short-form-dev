export const prerender = false;

import type { APIRoute } from 'astro';

import { ANALYTICS_SALT, SUPABASE_TRACKING_ENABLED } from 'astro:env/server';

import { pageViewPayloadSchema, trackPageView } from '@/lib/analyticsEvents';
import { detectDevice } from '@/lib/analyticsUtils';
import { checkAndConsumeApiQuota } from '@/lib/apiRateLimit';
import { getClientIp } from '@/lib/clientIp';
import { readEnvBool, readEnvString } from '@/lib/runtimeEnv';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid' }, 400);
  }

  const parsed = pageViewPayloadSchema.safeParse(json);
  if (!parsed.success) {
    console.error('[api/analytics/page-view] invalid payload:', parsed.error.flatten());
    return jsonResponse({ ok: false, error: 'invalid' }, 400);
  }

  if (parsed.data.company) {
    return jsonResponse({ ok: true });
  }

  const clientIp = getClientIp(request);
  const quota = await checkAndConsumeApiQuota('analytics_page_view', clientIp);
  if (!quota.allowed) {
    return jsonResponse({ ok: false, error: 'rate_limited' }, 429);
  }

  const ua = request.headers.get('user-agent');

  const trackingOn =
    SUPABASE_TRACKING_ENABLED === true || readEnvBool('SUPABASE_TRACKING_ENABLED', false);
  const salt = (ANALYTICS_SALT || readEnvString('ANALYTICS_SALT')).trim();
  if (trackingOn && !salt) {
    console.error('[api/analytics/page-view] ANALYTICS_SALT is not set — events will be dropped');
  }

  // Await tracking so Cloudflare does not tear down the isolate before the insert lands.
  // (locals.cfContext.waitUntil is not always populated on @astrojs/cloudflare v13.)
  try {
    await trackPageView(parsed.data, detectDevice(ua));
  } catch (e) {
    console.error('[api/analytics/page-view] track error:', e);
  }

  return jsonResponse({ ok: true });
};
