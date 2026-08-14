import assert from 'node:assert/strict'
import test from 'node:test'

import {
  defaultCopyPlaceholders,
  getCopyFieldsRaw,
  getCopyForLocale,
  migrateCopyByLocale,
  seedCopyLocaleIfMissing,
  setCopyForLocale,
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

test('seedCopyLocaleIfMissing uses EN placeholders not PL body', () => {
  const doc = {
    copy: { headline: 'PL marketing', aboutLabel: 'O mnie' },
    copyByLocale: { pl: { headline: 'PL marketing', aboutLabel: 'O mnie' } },
    locales: ['pl', 'en'],
    extras: { englishVersion: true },
  }
  const next = seedCopyLocaleIfMissing(doc, 'en')
  assert.equal(next.copyByLocale?.en?.aboutLabel, 'About')
  assert.equal(next.copyByLocale?.en?.headline, undefined)
})

test('setCopyForLocale en edit does not change pl or flat copy', () => {
  const doc = {
    copy: { headline: 'PL headline' },
    copyByLocale: { pl: { headline: 'PL headline' } },
  }
  const next = setCopyForLocale(doc, 'en', { headline: 'EN only', aboutLabel: 'About' })
  assert.equal(next.copyByLocale?.pl?.headline, 'PL headline')
  const flat = next.copy && typeof next.copy === 'object' ? next.copy : {}
  assert.equal(flat.headline, 'PL headline')
  assert.equal(next.copyByLocale?.en?.headline, 'EN only')
})

test('getCopyFieldsRaw returns locale bucket without pl fallback', () => {
  const doc = {
    copy: { headline: 'PL flat' },
    copyByLocale: { pl: { headline: 'PL bucket' }, en: { aboutLabel: 'About' } },
  }
  const raw = getCopyFieldsRaw(doc, 'en')
  assert.equal(raw.headline, undefined)
  assert.equal(raw.aboutLabel, 'About')
})

test('defaultCopyPlaceholders en has labels only', () => {
  const en = defaultCopyPlaceholders('en', 'Anna')
  assert.equal(en.aboutLabel, 'About')
  assert.equal(en.headline, undefined)
})
