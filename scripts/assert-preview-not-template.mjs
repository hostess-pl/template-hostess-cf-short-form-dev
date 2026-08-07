#!/usr/bin/env node
/**
 * Fail if a deployed preview still shows tip-template placeholder content.
 *
 *   node scripts/assert-preview-not-template.mjs --url https://preview-xxx.workers.dev
 *   node scripts/assert-preview-not-template.mjs --url … --name "Karolina Prostko"
 *
 * Short-form MVP drafts auth-lock `/` → `/edit/login`. In that case we only
 * assert the wall (no tip placeholders), not displayName in public HTML.
 *
 * Retries transient post-deploy failures (network / HTTP 5xx / empty body)
 * so Workers route+secrets settle before provision callback is skipped.
 *
 * Exit 0 on pass, 1 on fail.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? String(process.argv[i + 1] || '').trim() : ''
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const url = argValue('--url') || process.env.PREVIEW_URL || ''
let expectName = argValue('--name') || process.env.EXPECT_DISPLAY_NAME || ''

if (!expectName && existsSync(resolve(process.cwd(), 'src/content/hostess.json'))) {
  try {
    const hostess = JSON.parse(readFileSync(resolve(process.cwd(), 'src/content/hostess.json'), 'utf8'))
    expectName = String(hostess?.profile?.displayName || '').trim()
  } catch {
    // ignore
  }
}

if (!url) {
  console.error('[assert-preview] --url or PREVIEW_URL required')
  process.exit(1)
}

const banned = ['Template Hostess', 'Placeholder event', 'template@example.com', 'Template placeholder']
const MAX_ATTEMPTS = 10
/** Backoff seconds between attempts (sum ≈ 54s). */
const BACKOFF_SEC = [2, 3, 5, 5, 7, 8, 8, 8, 8]

async function fetchPreview() {
  const probe = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  const res = await fetch(probe, {
    headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'HostessWebsPreviewAssert/1.0' },
    redirect: 'follow',
  })
  const html = await res.text()
  return { res, html, finalUrl: String(res.url || url) }
}

let html = ''
let finalUrl = url
let lastError = ''

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    const { res, html: body, finalUrl: landed } = await fetchPreview()
    html = body
    finalUrl = landed
    const empty = !String(html || '').trim()

    if (res.ok && !empty) {
      console.log(`[assert-preview] attempt ${attempt}/${MAX_ATTEMPTS} status=${res.status} ok`)
      break
    }

    // Permanent client errors — do not retry.
    if (!res.ok && res.status < 500) {
      console.error(`[assert-preview] attempt ${attempt}/${MAX_ATTEMPTS} status=${res.status}`)
      console.error(`[assert-preview] HTTP ${res.status} for ${url}`)
      process.exit(1)
    }

    lastError = empty ? `status=${res.status} empty_body` : `status=${res.status}`
    console.warn(`[assert-preview] attempt ${attempt}/${MAX_ATTEMPTS} ${lastError}`)
  } catch (error) {
    lastError = `network ${error?.cause?.code || error?.message || error}`
    console.warn(`[assert-preview] attempt ${attempt}/${MAX_ATTEMPTS} ${lastError}`)
  }

  if (attempt === MAX_ATTEMPTS) {
    console.error(`[assert-preview] failed for ${url} after ${MAX_ATTEMPTS} attempts (${lastError})`)
    process.exit(1)
  }
  const waitSec = BACKOFF_SEC[Math.min(attempt - 1, BACKOFF_SEC.length - 1)]
  await sleep(waitSec * 1000)
}

const hits = banned.filter((s) => html.includes(s))
if (hits.length) {
  console.error(`[assert-preview] FAIL template markers still present: ${hits.join(', ')}`)
  process.exit(1)
}

const draftAuthWall =
  /\/edit\/login/i.test(finalUrl)
  || (/\/edit\/login/i.test(html) && /(zaloguj|sign\s*in|password|hasło|haslo|magic\s*link)/i.test(html))

if (expectName && !html.includes(expectName)) {
  if (draftAuthWall) {
    console.log(
      JSON.stringify({
        ok: true,
        draftAuthWall: true,
        url,
        finalUrl,
        expectName,
        bytes: html.length,
        note: 'Public HTML is CMS login (draft lock); displayName checked via hostess.json only',
      }),
    )
    process.exit(0)
  }
  console.error(`[assert-preview] FAIL expected displayName "${expectName}" not found in HTML`)
  process.exit(1)
}

console.log(
  JSON.stringify({
    ok: true,
    url,
    finalUrl,
    expectName: expectName || null,
    bytes: html.length,
  }),
)
