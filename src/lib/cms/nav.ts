import type { CmsChromeStrings } from '@/lib/cms/i18n'

export type CmsNavGroup = 'home' | 'insights' | 'media' | 'content' | 'account'

export type CmsSectionId =
  | 'dashboard'
  | 'analytics'
  | 'assets'
  | 'account'
  | 'profile'
  | 'hero'
  | 'about'
  | 'experience'
  | 'gallery'
  | 'contact'

export type CmsNavItem = {
  id: CmsSectionId
  label: string
  group: CmsNavGroup
}

export type DashboardBlock = {
  id: CmsSectionId
  label: string
  hint: string
  height: 'xs' | 'sm' | 'md' | 'lg'
}

export function navGroupLabels(t: CmsChromeStrings): Record<CmsNavGroup, string> {
  return {
    home: t.overview,
    insights: t.insights,
    media: t.media,
    content: t.content,
    account: t.account,
  }
}

export function buildCmsNav(t: CmsChromeStrings, options: { includeAnalytics?: boolean } = {}): CmsNavItem[] {
  return [
    { id: 'dashboard', label: t.dashboard, group: 'home' },
    ...(options.includeAnalytics ? [{ id: 'analytics' as const, label: t.analytics, group: 'insights' as const }] : []),
    { id: 'assets', label: t.assets, group: 'media' },
    { id: 'hero', label: t.hero, group: 'content' },
    { id: 'about', label: t.about, group: 'content' },
    { id: 'experience', label: t.experience, group: 'content' },
    { id: 'gallery', label: t.gallery, group: 'content' },
    { id: 'contact', label: t.contact, group: 'content' },
    { id: 'profile', label: t.profile, group: 'content' },
    { id: 'account', label: t.account, group: 'account' },
  ]
}

export function buildDashboardBlocks(t: CmsChromeStrings): DashboardBlock[] {
  return [
    { id: 'hero', label: t.hero, hint: 'Headline, greeting, CTA', height: 'lg' },
    { id: 'about', label: t.about, hint: t.subsectionAboutCopy, height: 'lg' },
    { id: 'experience', label: t.experience, hint: t.subsectionEmployment, height: 'md' },
    { id: 'gallery', label: t.gallery, hint: 'Events / portfolio', height: 'md' },
    { id: 'contact', label: t.contact, hint: 'Contact block', height: 'sm' },
    { id: 'profile', label: t.profile, hint: 'Name, location, socials', height: 'sm' },
  ]
}

/** Fields never shown in generic / list editors. */
export const HIDDEN_DOC_KEYS = new Set([
  'id',
  'submissionId',
  'contactRef',
  'slug',
  'analytics',
  'assets',
  'assetsB64',
  'githubDispatchPayload',
  'repoName',
  'templateKey',
  'templateRepo',
  'ok',
  'normalized',
  'media',
  'domain',
  'branding',
  'metadata',
])
