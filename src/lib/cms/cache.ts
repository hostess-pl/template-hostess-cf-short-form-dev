type CacheEntry<T> = { value: T; expiresAt: number; version: number }

const store = new Map<string, CacheEntry<unknown>>()

const TTL_MS = 15_000

export function cmsCacheGet<T>(key: string, version: number): T | null {
  const hit = store.get(key)
  if (!hit) return null
  if (hit.version !== version || Date.now() > hit.expiresAt) {
    store.delete(key)
    return null
  }
  return hit.value as T
}

export function cmsCacheSet<T>(key: string, version: number, value: T): void {
  store.set(key, { value, version, expiresAt: Date.now() + TTL_MS })
}

export function cmsCacheInvalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
