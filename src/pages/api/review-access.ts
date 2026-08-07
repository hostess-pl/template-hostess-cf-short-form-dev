export const prerender = false;

import type { APIRoute } from 'astro';

import { getReviewAccess } from '@/lib/reviewAccess';
import { reviewSiteKey } from '@/lib/reviewAuth';
import { isReviewModeEnabled, reviewModeDisabledResponse } from '@/lib/reviewFlags';

export const GET: APIRoute = async () => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();
  const access = await getReviewAccess(reviewSiteKey());
  return new Response(
    JSON.stringify({
      viewable: access.viewable,
      allowed: access.allowed,
      feedbackLocked: access.feedbackLocked,
      reason: access.reason,
      reviewDeadlineAt: access.reviewDeadlineAt ?? null,
      status: access.status ?? null,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
