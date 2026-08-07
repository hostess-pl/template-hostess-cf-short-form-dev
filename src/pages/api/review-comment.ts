export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';

import { getSupabaseAdmin } from '@/lib/supabase';
import { requireReviewAuth, reviewSiteKey } from '@/lib/reviewAuth';
import { getReviewAccess } from '@/lib/reviewAccess';
import { isReviewModeEnabled, reviewModeDisabledResponse } from '@/lib/reviewFlags';

const reviewSchema = z
  .object({
    message: z.string().trim().min(3).max(2000),
    page_path: z.string().trim().min(1).max(500),
    locale: z.enum(['en', 'pl', 'es']),
    selector: z.string().trim().min(1).max(400),
    rel_x: z.number().min(0).max(1),
    rel_y: z.number().min(0).max(1),
    rel_w: z.number().min(0).max(1).optional(),
    rel_h: z.number().min(0).max(1).optional(),
    doc_x: z.number().int().min(0).max(200000),
    doc_y: z.number().int().min(0).max(200000),
    annotation_type: z.enum(['point', 'region']).default('point'),
    author_name: z.string().trim().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.annotation_type === 'region') {
      if (value.rel_w === undefined) {
        ctx.addIssue({ code: 'custom', message: 'rel_w is required for region annotations.', path: ['rel_w'] });
      }
      if (value.rel_h === undefined) {
        ctx.addIssue({ code: 'custom', message: 'rel_h is required for region annotations.', path: ['rel_h'] });
      }
    }
  });

const listSchema = z.object({
  page_path: z.string().trim().min(1).max(500),
  locale: z.enum(['en', 'pl', 'es']),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();
  const access = await getReviewAccess();
  if (!access.viewable) {
    return jsonResponse({ success: false, message: 'Review not open yet.', reason: access.reason }, 403);
  }

  const auth = requireReviewAuth(request);
  if (!auth) {
    return jsonResponse({ success: false, message: 'Unauthorized.' }, 401);
  }

  const parsed = listSchema.safeParse({
    page_path: url.searchParams.get('page_path') || '',
    locale: url.searchParams.get('locale') || '',
  });
  if (!parsed.success) {
    return jsonResponse({ success: false, message: 'Invalid query.' }, 400);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonResponse({ success: false, message: 'Feedback DB is not configured.' }, 503);
  }

  const { page_path, locale } = parsed.data;
  const { data, error } = await supabase
    .from('preview_feedback_comments')
    .select(
      'id,message,page_path,locale,selector,rel_x,rel_y,rel_w,rel_h,doc_x,doc_y,annotation_type,status,created_at',
    )
    .eq('site_key', reviewSiteKey())
    .eq('page_path', page_path)
    .eq('locale', locale)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('review GET error:', error.message);
    return jsonResponse({ success: false, message: 'Could not read feedback.' }, 502);
  }

  return jsonResponse({ success: true, comments: data ?? [] }, 200);
};

export const POST: APIRoute = async ({ request }) => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();
  const access = await getReviewAccess();
  if (!access.allowed) {
    return jsonResponse({ success: false, message: 'Review not open yet.', reason: access.reason }, 403);
  }

  const auth = requireReviewAuth(request);
  if (!auth) {
    return jsonResponse({ success: false, message: 'Unauthorized.' }, 401);
  }

  let parsedJson: unknown;
  try {
    parsedJson = await request.json();
  } catch {
    return jsonResponse({ success: false, message: 'Invalid payload.' }, 400);
  }

  const result = reviewSchema.safeParse(parsedJson);
  if (!result.success) {
    return jsonResponse({ success: false, message: 'Invalid payload.' }, 400);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonResponse({ success: false, message: 'Feedback DB is not configured.' }, 503);
  }

  const {
    message,
    page_path,
    locale,
    selector,
    rel_x,
    rel_y,
    rel_w,
    rel_h,
    doc_x,
    doc_y,
    annotation_type,
    author_name,
  } = result.data;

  const { data, error } = await supabase
    .from('preview_feedback_comments')
    .insert({
      site_key: reviewSiteKey(),
      page_path,
      locale,
      selector,
      rel_x,
      rel_y,
      rel_w: annotation_type === 'region' ? rel_w : null,
      rel_h: annotation_type === 'region' ? rel_h : null,
      doc_x,
      doc_y,
      annotation_type,
      message,
      author_name: author_name || '',
      status: 'open',
    })
    .select(
      'id,message,page_path,locale,selector,rel_x,rel_y,rel_w,rel_h,doc_x,doc_y,annotation_type,status,created_at',
    )
    .single();

  if (error || !data) {
    console.error('review POST error:', error?.message ?? 'empty response');
    return jsonResponse({ success: false, message: 'Could not store feedback.' }, 502);
  }

  return jsonResponse({ success: true, comment: data }, 200);
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();
  const access = await getReviewAccess();
  if (!access.allowed) {
    return jsonResponse({ success: false, message: 'Review not open yet.', reason: access.reason }, 403);
  }

  const auth = requireReviewAuth(request);
  if (!auth) {
    return jsonResponse({ success: false, message: 'Unauthorized.' }, 401);
  }

  let parsedJson: unknown;
  try {
    parsedJson = await request.json();
  } catch {
    return jsonResponse({ success: false, message: 'Invalid payload.' }, 400);
  }

  const result = deleteSchema.safeParse(parsedJson);
  if (!result.success) {
    return jsonResponse({ success: false, message: 'Invalid payload.' }, 400);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonResponse({ success: false, message: 'Feedback DB is not configured.' }, 503);
  }

  const { error } = await supabase
    .from('preview_feedback_comments')
    .delete()
    .eq('site_key', reviewSiteKey())
    .eq('id', result.data.id);

  if (error) {
    console.error('review DELETE error:', error.message);
    return jsonResponse({ success: false, message: 'Could not delete feedback.' }, 502);
  }

  return jsonResponse({ success: true }, 200);
};
