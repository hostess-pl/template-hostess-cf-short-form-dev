/**
 * Build-time media manifest + copy src/assets into public/cms-assets for CMS previews.
 * Wipes public/cms-assets first so pruned/demo leftovers cannot linger across builds.
 * Hostesswebs marks under public/cms-brand/ are never listed in the CMS media picker.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'src/generated')
const outFile = resolve(outDir, 'static-media-assets.json')
const previewDir = resolve(root, 'public/cms-assets')

const EXT_TYPE = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
}

function walkFiles(dir, acc) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['admin', 'node_modules', 'cms-assets', 'cms-brand'].includes(entry.name)) continue
      walkFiles(full, acc)
      continue
    }
    acc.push(full)
  }
}

if (existsSync(previewDir)) {
  rmSync(previewDir, { recursive: true, force: true })
}
mkdirSync(previewDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

const items = []
const seen = new Set()

function add(item) {
  if (seen.has(item.url)) return
  seen.add(item.url)
  items.push(item)
}

for (const folder of [
  resolve(root, 'src/assets/images'),
  resolve(root, 'src/assets/videos'),
]) {
  const files = []
  walkFiles(folder, files)
  for (const full of files) {
    const ext = extname(full).toLowerCase()
    const contentType = EXT_TYPE[ext]
    if (!contentType) continue
    const name = full.split(/[/\\]/).pop()
    const dest = join(previewDir, name)
    copyFileSync(full, dest)
    const st = statSync(full)
    add({
      path: `asset:${name}`,
      url: `/cms-assets/${name}`,
      contentType,
      size: st.size,
      updatedAt: st.mtime.toISOString(),
      name,
      source: 'site',
    })
  }
}

for (const folder of [resolve(root, 'public/images'), resolve(root, 'public')]) {
  const files = []
  walkFiles(folder, files)
  for (const full of files) {
    const ext = extname(full).toLowerCase()
    const contentType = EXT_TYPE[ext]
    if (!contentType) continue
    const rel = relative(resolve(root, 'public'), full).replaceAll('\\', '/')
    if (rel.startsWith('admin/') || rel.startsWith('cms-assets/') || rel.startsWith('cms-brand/')) continue
    const url = `/${rel}`
    const st = statSync(full)
    add({
      path: `site:${url}`,
      url,
      contentType,
      size: st.size,
      updatedAt: st.mtime.toISOString(),
      name: rel.split('/').pop(),
      source: 'site',
    })
  }
}

items.sort((a, b) => a.name.localeCompare(b.name))
writeFileSync(outFile, `${JSON.stringify({ items }, null, 2)}\n`, 'utf8')
console.log(`[assets] wrote ${items.length} media paths → ${relative(root, outFile)}`)
