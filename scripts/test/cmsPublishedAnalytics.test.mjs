import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const editApp = await readFile(new URL('../../src/components/edit/EditApp.tsx', import.meta.url), 'utf8')
const analytics = await readFile(
  new URL('../../src/pages/api/edit/analytics/summary.ts', import.meta.url),
  'utf8',
)

assert.match(
  editApp,
  /!hasPublished\s*(?:&&|\?)\s*\(?\s*<button[\s\S]{0,300}data-tour="publish"/,
  'published portfolios must not render the Publish button',
)
assert.match(
  analytics,
  /resolveDeploymentSiteId\(admin\)/,
  'analytics must resolve the canonical deployment site id',
)
assert.match(
  analytics,
  /\.eq\(['"]site_id['"],\s*siteId\)/,
  'analytics must query the exact canonical deployment site id',
)
assert.doesNotMatch(
  analytics,
  /\.like\(['"]site_id['"],\s*`\$\{slug\}:%`\)/,
  'analytics must not assume the CMS slug is the analytics site id',
)

console.log('cmsPublishedAnalytics tests passed')
