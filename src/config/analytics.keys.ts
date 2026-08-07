import { hostessSlug } from '@/lib/hostess';

const slug = hostessSlug().replace(/[^a-z0-9-]/gi, '-').toLowerCase();

export const analyticsVisitorKey = `${slug}_vid`;
export const analyticsSessionKey = `${slug}_sid`;
export const analyticsConsentKey = `${slug}-consent`;
export const attributionStorageKey = `${slug}_attr_v1`;
