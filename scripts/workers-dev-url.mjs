/**
 * Pure helpers for Cloudflare workers.dev preview URLs.
 * Prefer WORKERS_DEV_SUBDOMAIN over wrangler stdout (legacy account slugs).
 */

export function buildWorkersDevUrl(workerName, subdomain) {
  const name = String(workerName || '').trim();
  const sub = String(subdomain || '').trim();
  if (!name) return '';
  if (sub) return `https://${name}.${sub}.workers.dev`;
  return `https://${name}.workers.dev`;
}

export function previewWorkerName(submissionId) {
  const normalizedId =
    String(submissionId || 'local')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'local';
  return `preview-${normalizedId}`;
}

export function parseDeployedWorkersUrl(stdout) {
  const matches = String(stdout || '').match(
    /https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)?\.workers\.dev/gi,
  );
  if (!matches?.length) return '';
  return matches[matches.length - 1];
}

/**
 * Resolve final preview URL after wrangler deploy.
 * When WORKERS_DEV_SUBDOMAIN is set, keep the configured URL even if wrangler
 * echoes a different (legacy) account subdomain.
 */
export function resolvePreviewUrl({
  submissionId,
  workersDevSubdomain,
  wranglerStdout = '',
}) {
  const workerName = previewWorkerName(submissionId);
  const configured = buildWorkersDevUrl(workerName, workersDevSubdomain);
  const deployed = parseDeployedWorkersUrl(wranglerStdout);
  if (deployed && deployed !== configured) {
    if (workersDevSubdomain) return configured;
    return deployed;
  }
  return configured;
}
