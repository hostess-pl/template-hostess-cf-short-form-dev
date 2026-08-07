export const prerender = false;

import type { APIRoute } from 'astro';

import { reviewSiteKey } from '@/lib/reviewAuth';
import { countSiteComments } from '@/lib/reviewSummary';
import { isReviewModeEnabled, reviewModeDisabledResponse } from '@/lib/reviewFlags';

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async () => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();
  const commentCount = await countSiteComments(reviewSiteKey());
  return jsonResponse({ commentCount }, 200);
};
