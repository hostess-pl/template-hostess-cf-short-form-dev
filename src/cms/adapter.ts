/**
 * Per-template CMS adapter.
 */
import {
  buildCmsNav,
  buildDashboardBlocks,
  type CmsNavItem,
  type DashboardBlock,
} from '@/lib/cms/nav'
import { chromeStrings, type CmsChromeLocale } from '@/lib/cms/i18n'

export const CMS_DOCUMENT_LOCALE = '_'
export const CMS_DOCUMENT_SECTION = 'document'

export function getCmsNav(
  chromeLocale: CmsChromeLocale = 'pl',
  options: { includeAnalytics?: boolean } = {},
): CmsNavItem[] {
  return buildCmsNav(chromeStrings(chromeLocale), options)
}

export function getDashboardBlocks(chromeLocale: CmsChromeLocale = 'pl'): DashboardBlock[] {
  return buildDashboardBlocks(chromeStrings(chromeLocale))
}
