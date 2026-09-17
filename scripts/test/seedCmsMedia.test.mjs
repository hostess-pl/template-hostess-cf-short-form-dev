import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { persistProvisionedImages } from '../seed-cms-preview.mjs'

const root = await mkdtemp(join(tmpdir(), 'hostess-media-'))
const images = join(root, 'src', 'assets', 'images')
await mkdir(images, { recursive: true })
await writeFile(join(images, 'hero.jpg'), Buffer.from('real hero'))
await writeFile(join(images, 'event-1.jpg'), Buffer.from('real event'))

const uploads = []
const admin = {
  storage: {
    from(bucket) {
      assert.equal(bucket, 'site-media')
      return {
        async upload(path, body, options) {
          uploads.push({ path, body: Buffer.from(body), options })
          return { error: null }
        },
        getPublicUrl(path) {
          return { data: { publicUrl: `https://storage.example/site-media/${path}` } }
        },
      }
    },
  },
}

const source = {
  assets: { hero: 'https://storage.tally.so/private/hero.jpg?token=temporary' },
  events: [
    {
      // The first gallery photo can be promoted to Hero, leaving a non-contiguous event id.
      id: 'event-2',
      imageFile: 'https://storage.tally.so/private/event.jpg?token=temporary',
    },
  ],
}

try {
  const first = await persistProvisionedImages({ admin, siteId: 'site-123', hostess: source, root })
  const second = await persistProvisionedImages({ admin, siteId: 'site-123', hostess: source, root })

  assert.equal(source.assets.hero.includes('tally.so'), true, 'input document must not be mutated')
  assert.match(first.assets.hero, /^https:\/\/storage\.example\/site-media\/site-123\/provision\/hero-[a-f0-9]{64}\.jpg$/)
  assert.match(first.events[0].imageFile, /^https:\/\/storage\.example\/site-media\/site-123\/provision\/event-1-[a-f0-9]{64}\.jpg$/)
  assert.deepEqual(first, second, 'content-hashed paths must make retries deterministic')
  assert.equal(uploads.length, 4)
  assert.equal(uploads.every((item) => item.options.contentType === 'image/jpeg'), true)
  assert.equal(uploads.every((item) => item.options.upsert === true), true)

  await rm(join(images, 'event-1.jpg'))
  await assert.rejects(
    persistProvisionedImages({ admin, siteId: 'site-123', hostess: source, root }),
    /Missing provisioned image: event-1\.jpg/,
  )
} finally {
  await rm(root, { recursive: true, force: true })
}

console.log('seedCmsMedia tests passed')
