/** Read env at runtime (Docker) with build-time fallback (import.meta.env). */
export function readEnvString(key: string): string {
  if (typeof process !== 'undefined') {
    const fromProcess = process.env[key];
    if (typeof fromProcess === 'string' && fromProcess.trim().length > 0) {
      return fromProcess.trim();
    }
  }

  const fromMeta = (import.meta.env as Record<string, unknown>)[key];
  return typeof fromMeta === 'string' ? fromMeta.trim() : '';
}

export function readEnvBool(key: string, defaultValue = false): boolean {
  const raw = readEnvString(key);
  if (!raw) return defaultValue;
  const normalized = raw.toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}
