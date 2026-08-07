import { REVIEW_MODE_ENABLED } from 'astro:env/server';

export function getReviewFlags() {
  return {
    reviewAvailable: REVIEW_MODE_ENABLED,
  };
}

export function isReviewModeEnabled(): boolean {
  return REVIEW_MODE_ENABLED;
}

export function reviewModeDisabledResponse(): Response {
  return new Response(JSON.stringify({ error: 'not_found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
