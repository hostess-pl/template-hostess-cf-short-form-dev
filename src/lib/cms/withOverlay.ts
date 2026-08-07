import { AsyncLocalStorage } from 'node:async_hooks'
import type { HostessData } from '@/content/hostess.schema'
import { fetchCmsDocumentOverlay } from '@/lib/cms/overlay'
import {
  bindHostessAls,
  loadHostessJson,
  parseHostessOverlay,
  runWithHostessData,
} from '@/lib/hostess'
import { readEnvString } from '@/lib/runtimeEnv'

type OverlayStore = { data: HostessData }

const overlayAls = new AsyncLocalStorage<OverlayStore>()
bindHostessAls(overlayAls)

/**
 * Server-only: fetch CMS document and run the request with merged hostess data.
 * `hostess` is the overlay-merged document when present, otherwise null (baked JSON only).
 */
export async function withCmsHostessOverlay<T>(
  fn: (hostess: HostessData | null) => T | Promise<T>,
): Promise<T> {
  const base = loadHostessJson()
  const hostingPlan = readEnvString('HOSTING_PLAN').trim().toLowerCase()
  // Normal (non-Pro) previews must never pull template CMS docs (e.g. leftover tpl-*).
  if (hostingPlan === 'normal') {
    return await fn(null)
  }
  try {
    const overlay = await fetchCmsDocumentOverlay()
    if (!overlay) return await fn(null)
    const data = parseHostessOverlay(base, overlay)
    return await runWithHostessData(data, () => fn(data))
  } catch (err) {
    console.warn('[cms] overlay skipped', err instanceof Error ? err.message : err)
    return await fn(null)
  }
}
