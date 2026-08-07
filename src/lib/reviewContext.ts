import siteConfig from '@/config/site.config';
import { loadHostess } from '@/lib/hostess';
import { reviewSiteKey } from '@/lib/reviewAuth';
import type { ReviewCompletePayload } from '@/lib/reviewWebhook';

const HOSTESS_GITHUB_ORG = 'hostess-pl';

export function buildReviewCompletePayload(): ReviewCompletePayload {
  const hostess = loadHostess();
  return {
    event: 'review_complete',
    triggeredBy: 'user',
    submissionId: hostess.submissionId,
    siteKey: reviewSiteKey(),
    previewUrl: siteConfig.url.replace(/\/$/, ''),
    repo: `${HOSTESS_GITHUB_ORG}/${hostess.slug}`,
    submittedAt: new Date().toISOString(),
  };
}
