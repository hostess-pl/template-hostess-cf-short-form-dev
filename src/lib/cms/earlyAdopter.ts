/**
 * Early Adopter / Program Pierwszych 20 — tip-side counter (CMS service role).
 * Mirrors hostesses/scripts/lib/early-adopter.mjs exclude rules.
 */

import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'

export const EARLY_ADOPTER_PUBLISH_CAP = 20
/** Hide finished promo card this many days after sold-out. */
export const EARLY_ADOPTER_FINISHED_FADE_DAYS = 14

const EXCLUDED_SLUG_PREFIXES = ['test', 'preview-', 'template-', 'tpl-', 'ops-', 'demo-'] as const

/** Exact CMS slugs that are brand/dev seeds, not client portfolios. */
const EXCLUDED_SLUG_EXACT = ['hostesswebs', 'karolina-konieczna-dev'] as const

export function isExcludedFromEarlyAdopterCount(slug: string | null | undefined): boolean {
  const s = String(slug || '').trim().toLowerCase()
  if (!s) return true
  if ((EXCLUDED_SLUG_EXACT as readonly string[]).includes(s)) return true
  return EXCLUDED_SLUG_PREFIXES.some((p) => s.startsWith(p))
}

export type EarlyAdopterSnapshot = {
  ok: boolean
  claimed: number
  cap: number
  remaining: number
  eligible: boolean
  /** ISO when we first observed sold-out (client may also track via localStorage). */
  soldOutHint: boolean
  error?: string
}

export async function countPublishedPortfoliosForEarlyAdopter(): Promise<EarlyAdopterSnapshot> {
  const cap = EARLY_ADOPTER_PUBLISH_CAP
  const admin = getCmsSupabaseAdmin()
  if (!admin) {
    return {
      ok: false,
      claimed: 0,
      cap,
      remaining: cap,
      eligible: true,
      soldOutHint: false,
      error: 'cms_unavailable',
    }
  }

  const { data, error } = await admin
    .from('cms_sites')
    .select('slug,published_at')
    .eq('portfolio_status', 'published')
    .order('published_at', { ascending: true })
    .limit(500)

  if (error) {
    return {
      ok: false,
      claimed: 0,
      cap,
      remaining: cap,
      eligible: true,
      soldOutHint: false,
      error: error.message,
    }
  }

  const rows = Array.isArray(data) ? data : []
  const claimed = rows.filter((row) => !isExcludedFromEarlyAdopterCount(row?.slug)).length
  const remaining = Math.max(0, cap - claimed)
  const eligible = claimed < cap
  return {
    ok: true,
    claimed,
    cap,
    remaining,
    eligible,
    soldOutHint: !eligible,
  }
}
