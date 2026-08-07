import hostessJson from '@/content/hostess.json'
import { hostessSchema, type HostessData } from '@/content/hostess.schema'

type OverlayStore = { data: HostessData }

type AlsLike = {
  run: <T>(store: OverlayStore, fn: () => T) => T
  getStore: () => OverlayStore | undefined
}

/** Bound from server-only middleware (node:async_hooks) — never import async_hooks here. */
let overlayAls: AlsLike | null = null

export function bindHostessAls(als: AlsLike): void {
  overlayAls = als
}

let jsonCached: HostessData | null = null

export function loadHostessJson(): HostessData {
  if (jsonCached) return jsonCached
  const parsed = hostessSchema.safeParse(hostessJson)
  if (!parsed.success) {
    throw new Error(`Invalid hostess.json: ${parsed.error.message}`)
  }
  jsonCached = parsed.data
  return jsonCached
}

/**
 * Request-scoped hostess (JSON + optional CMS overlay set by middleware ALS).
 * Prefer Astro.locals.cmsHostess in .astro when available as a belt-and-suspenders read.
 */
export function loadHostess(localsHostess?: HostessData | null): HostessData {
  return overlayAls?.getStore()?.data ?? localsHostess ?? loadHostessJson()
}

export function hostessSlug(): string {
  return loadHostess().slug
}

/** Used only from server middleware. Always await the returned promise. */
export async function runWithHostessData<T>(
  data: HostessData,
  fn: () => T | Promise<T>,
): Promise<T> {
  if (!overlayAls) return await fn()
  return await overlayAls.run({ data }, fn)
}

function deepMergeHostess(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    if (value === null || value === undefined) continue
    const prev = out[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      prev &&
      typeof prev === 'object' &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMergeHostess(prev as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      out[key] = value
    }
  }
  return out
}

export function parseHostessOverlay(
  base: HostessData,
  overlay: Record<string, unknown>,
): HostessData {
  const merged = deepMergeHostess(base as unknown as Record<string, unknown>, overlay)
  const parsed = hostessSchema.safeParse(merged)
  if (parsed.success) return parsed.data
  console.warn('[cms] overlay failed schema validation — applying merge best-effort')
  return merged as HostessData
}
