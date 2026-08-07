import { createPortfolioProfile } from '@/lib/analyticsProfileSchema';
import { loadHostess } from '@/lib/hostess';

const hostess = loadHostess();

export const analyticsRepoKey = hostess.analytics.siteId;
export const analyticsProjectId = hostess.analytics.subprojectId;
export const analyticsSubprojectId = hostess.analytics.siteId;

export const analyticsProfile = createPortfolioProfile(hostess.profile.displayName);
