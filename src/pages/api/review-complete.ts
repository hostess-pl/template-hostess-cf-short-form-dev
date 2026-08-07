export const prerender = false;

import type { APIRoute } from 'astro';
import { N8N_REVIEW_COMPLETE_URL, REVIEW_WEBHOOK_SECRET } from 'astro:env/server';

import { buildReviewCompletePayload } from '@/lib/reviewContext';
import { requireReviewAuth, reviewSiteKey } from '@/lib/reviewAuth';
import { isReviewModeEnabled, reviewModeDisabledResponse } from '@/lib/reviewFlags';
import { countSiteComments } from '@/lib/reviewSummary';
import { readEnvString } from '@/lib/runtimeEnv';
import { getSupabaseAdmin } from '@/lib/supabase';
import { serializeReviewPayload, signReviewPayload } from '@/lib/reviewWebhook';

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type N8nCompleteResponse = {
  ok?: boolean;
  duplicate?: boolean;
  error?: string;
  session?: unknown;
};

function parseN8nResponse(raw: string): N8nCompleteResponse {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as N8nCompleteResponse;
  } catch {
    return {};
  }
}

function isPreviewWorkersHost(siteKey: string): boolean {
  const host = siteKey.toLowerCase();
  return host.startsWith('preview-') && host.endsWith('.workers.dev');
}

/** Demo / video previews: lock feedback without calling n8n. */
async function mockCompleteForPreview(siteKey: string): Promise<Response> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('preview_review_sessions')
      .update({
        status: 'building',
        submitted_at: now,
        triggered_by: 'user',
        updated_at: now,
      })
      .eq('site_key', siteKey)
      .in('status', ['build_window', 'open']);
    if (error) {
      console.error('review-complete mock session update failed:', error.message);
    }
  }

  return jsonResponse({ ok: true, mock: true, duplicate: false, session: null }, 200);
}

export const POST: APIRoute = async ({ request }) => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();

  const auth = requireReviewAuth(request);
  if (!auth) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  const siteKey = reviewSiteKey();
  const webhookSecret = REVIEW_WEBHOOK_SECRET || readEnvString('REVIEW_WEBHOOK_SECRET');
  const webhookUrl = N8N_REVIEW_COMPLETE_URL || readEnvString('N8N_REVIEW_COMPLETE_URL');
  const previewHost = isPreviewWorkersHost(siteKey);

  const commentCount = await countSiteComments(siteKey);
  if (commentCount < 1) {
    return jsonResponse({ ok: false, error: 'no_feedback' }, 400);
  }

  // Preview demos often lack webhook secrets / funnel sessions — allow a local mock.
  if (!webhookSecret || !webhookUrl) {
    if (previewHost) {
      return mockCompleteForPreview(siteKey);
    }
    return jsonResponse({ ok: false, error: 'review_webhook_not_configured' }, 503);
  }

  const payload = buildReviewCompletePayload();
  const body = serializeReviewPayload(payload);
  const signature = signReviewPayload(payload, webhookSecret);

  let upstream: Response;
  try {
    upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hostess-Signature': signature,
      },
      body,
    });
  } catch (error) {
    console.error('review-complete fetch error:', error);
    if (previewHost) {
      return mockCompleteForPreview(siteKey);
    }
    return jsonResponse({ ok: false, error: 'upstream_unreachable' }, 502);
  }

  const rawText = await upstream.text();
  const parsed = parseN8nResponse(rawText);

  if (upstream.status === 401 || parsed.error === 'invalid_signature') {
    console.error('review-complete signature rejected by n8n');
    if (previewHost) {
      return mockCompleteForPreview(siteKey);
    }
    return jsonResponse({ ok: false, error: 'invalid_signature' }, 502);
  }

  if (upstream.status === 404 || parsed.error === 'session_not_found') {
    if (previewHost) {
      return mockCompleteForPreview(siteKey);
    }
    return jsonResponse(
      {
        ok: false,
        error: 'session_not_found',
        message: 'Review window not open yet — contact support.',
      },
      404,
    );
  }

  if (upstream.ok && parsed.ok === false) {
    if (previewHost) {
      return mockCompleteForPreview(siteKey);
    }
    return jsonResponse(
      {
        ok: false,
        error: parsed.error || 'session_not_found',
        message: 'Review window not open yet — contact support.',
      },
      404,
    );
  }

  if (!upstream.ok) {
    if (previewHost) {
      return mockCompleteForPreview(siteKey);
    }
    return jsonResponse(
      {
        ok: false,
        error: parsed.error || 'upstream_error',
        message: 'Could not submit your review. Please try again or contact support.',
      },
      upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
    );
  }

  return jsonResponse(
    {
      ok: parsed.ok ?? true,
      duplicate: parsed.duplicate ?? false,
      session: parsed.session ?? null,
    },
    200,
  );
};
