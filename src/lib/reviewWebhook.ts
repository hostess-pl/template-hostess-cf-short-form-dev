import { createHmac } from 'node:crypto';

export type ReviewCompletePayload = {
  event: 'review_complete';
  triggeredBy: 'user';
  submissionId: string;
  siteKey: string;
  previewUrl: string;
  repo: string;
  submittedAt: string;
};

export function serializeReviewPayload(payload: ReviewCompletePayload): string {
  return JSON.stringify(payload);
}

export function signReviewPayload(payload: ReviewCompletePayload, secret: string): string {
  const raw = serializeReviewPayload(payload);
  const hex = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  return `sha256=${hex}`;
}
