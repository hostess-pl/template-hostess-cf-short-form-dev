/**
 * Short-form MVP product mode — always on for template-hostess-cf-short-form.
 * Live tip mains must never import this as a default-on path.
 */
import { PORTFOLIO_PRODUCT_MODE } from 'astro:env/server'

export type PortfolioStatus = 'draft' | 'published'

export function isShortFormProductMode(): boolean {
  const mode = String(PORTFOLIO_PRODUCT_MODE || '').trim().toLowerCase()
  return mode === 'short_form' || mode === 'short-form' || mode === '1' || mode === 'true'
}

export function isDraftPortfolioStatus(status: string | null | undefined): boolean {
  return String(status || '').trim().toLowerCase() === 'draft'
}

export function isPublishedPortfolioStatus(status: string | null | undefined): boolean {
  return String(status || '').trim().toLowerCase() === 'published'
}

export function isAwaitingPaymentPortfolioStatus(status: string | null | undefined): boolean {
  return String(status || '').trim().toLowerCase() === 'awaiting_payment'
}

export function isSuspendedPortfolioStatus(status: string | null | undefined): boolean {
  return String(status || '').trim().toLowerCase() === 'suspended'
}

/** Auth-lock anonymous public visitors (draft or suspended). */
export function shouldAuthLockPublicPortfolio(status: string | null | undefined): boolean {
  const s = String(status || '').trim().toLowerCase()
  return s === 'draft' || s === 'suspended'
}

/** Public collection only after publish / while awaiting payment. */
export function shouldCollectPublicAnalytics(status: string | null | undefined): boolean {
  const s = String(status || '').trim().toLowerCase()
  return s === 'published' || s === 'awaiting_payment'
}
