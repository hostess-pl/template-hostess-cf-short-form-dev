import { getSupabaseAdmin } from '@/lib/supabase';
import { reviewSiteKey } from '@/lib/reviewAuth';

export type ReviewAccessReason =
  | 'preview_view'
  | 'build_feedback'
  | 'feedback_locked'
  | 'awaiting_ops'
  | 'awaiting_payment'
  | 'not_found'
  | 'unconfigured';

export type ReviewAccessResult = {
  viewable: boolean;
  allowed: boolean;
  feedbackLocked: boolean;
  reason: ReviewAccessReason;
  reviewDeadlineAt?: string | null;
  status?: string | null;
};

function normalizeStatus(status: string): string {
  const s = String(status || '').trim();
  if (s === 'open') return 'build_window';
  if (s === 'submitted') return 'building';
  return s;
}

const VIEWABLE_STATUSES = new Set([
  'preview_sent',
  'awaiting_payment',
  'build_window',
  'building',
  'final_preview_ready',
  'awaiting_domain',
  'awaiting_final_payment',
  'ready_to_deploy',
  'live',
]);

type SessionRow = {
  status?: string | null;
  review_deadline_at?: string | null;
};

function toAccessResult(data: SessionRow): ReviewAccessResult {
  const status = normalizeStatus(String(data.status || ''));
  if (VIEWABLE_STATUSES.has(status)) {
    const feedbackAllowed = status === 'build_window';
    const feedbackLocked = status === 'building';
    return {
      viewable: true,
      allowed: feedbackAllowed,
      feedbackLocked,
      reason: feedbackAllowed
        ? 'build_feedback'
        : feedbackLocked
          ? 'feedback_locked'
          : 'preview_view',
      status,
      reviewDeadlineAt: data.review_deadline_at,
    };
  }

  const reason: ReviewAccessReason =
    status === 'awaiting_ops' || status === 'awaiting_payment'
      ? status
      : 'not_found';

  return {
    viewable: false,
    allowed: false,
    feedbackLocked: false,
    reason,
    status,
    reviewDeadlineAt: data.review_deadline_at,
  };
}

export async function getReviewAccess(siteKey = reviewSiteKey()): Promise<ReviewAccessResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      viewable: false,
      allowed: false,
      feedbackLocked: false,
      reason: 'unconfigured',
    };
  }

  const bySiteKey = await supabase
    .from('preview_review_sessions')
    .select('status, review_deadline_at')
    .eq('site_key', siteKey)
    .maybeSingle();

  if (!bySiteKey.error && bySiteKey.data) {
    return toAccessResult(bySiteKey.data);
  }

  // Fallback for older rows seeded with workers.dev site_key after branded SITE_URL attach.
  const previewUrl = `https://${siteKey}`;
  const byPreview = await supabase
    .from('preview_review_sessions')
    .select('status, review_deadline_at')
    .eq('preview_url', previewUrl)
    .maybeSingle();

  if (!byPreview.error && byPreview.data) {
    return toAccessResult(byPreview.data);
  }

  return {
    viewable: false,
    allowed: false,
    feedbackLocked: false,
    reason: 'not_found',
  };
}

export async function requireOpenReviewAccess(siteKey = reviewSiteKey()): Promise<ReviewAccessResult> {
  const access = await getReviewAccess(siteKey);
  if (!access.allowed) {
    return access;
  }
  return access;
}
