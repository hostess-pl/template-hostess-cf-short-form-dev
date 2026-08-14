import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCopyForLocale,
  migrateCopyByLocale,
  seedCopyLocaleIfMissing,
} from '../../src/lib/cms/i18n.ts'

test('getCopyForLocale merges per-field with pl fallback', () => {
  const doc = {
    copy: { headline: 'Flat PL', aboutLead: 'Flat about' },
    copyByLocale: {
      pl: { headline: 'PL headline', aboutLead: 'PL about' },
      en: { headline: 'EN headline' },
    },
  }
  const en = getCopyForLocale(doc, 'en')
  assert.equal(en.headline, 'EN headline')
  assert.equal(en.aboutLead, 'PL about')
})

test('migrateCopyByLocale seeds pl from flat copy', () => {
  const doc = { copy: { headline: 'Hello' } }
  const { doc: migrated, changed } = migrateCopyByLocale(doc)
  assert.equal(changed, true)
  assert.deepEqual(migrated.copyByLocale?.pl, { headline: 'Hello' })
})

test('seedCopyLocaleIfMissing copies pl bucket', () => {
  const doc = {
    copy: { headline: 'PL' },
    copyByLocale: { pl: { headline: 'PL bucket' } },
  }
  const next = seedCopyLocaleIfMissing(doc, 'en')
  assert.deepEqual(next.copyByLocale?.en, { headline: 'PL bucket' })
})
