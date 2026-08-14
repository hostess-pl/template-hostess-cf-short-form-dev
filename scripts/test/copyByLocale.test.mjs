import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appearanceTextForPublic,
  defaultCopyPlaceholders,
  eventTextForPublic,
  getAppearanceTextRaw,
  getCopyFieldsRaw,
  getCopyForLocale,
  getEventTextRaw,
  getLanguagesRaw,
  languagesForPublic,
  migrateCopyByLocale,
  pickPublicCopyField,
  publicCopyForLocale,
  seedCopyLocaleIfMissing,
  setAppearanceTextForLocale,
  setCopyForLocale,
  setEventTextForLocale,
  setLanguagesForLocale,
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

test('pickPublicCopyField does not copy PL headline into EN', () => {
  const copyByLocale = {
    pl: { headline: 'PL headline', aboutLabel: 'O mnie' },
    en: { aboutLabel: 'About' },
  }
  const flat = { headline: 'PL headline' }
  assert.equal(pickPublicCopyField(copyByLocale, flat, 'en', 'headline'), '')
  assert.equal(pickPublicCopyField(copyByLocale, flat, 'en', 'aboutLabel'), 'About')
  assert.equal(pickPublicCopyField(copyByLocale, flat, 'pl', 'headline'), 'PL headline')
})

test('pickPublicCopyField returns filled EN headline as-is', () => {
  const copyByLocale = {
    pl: { headline: 'PL headline' },
    en: { headline: 'EN headline', aboutLabel: 'About' },
  }
  assert.equal(pickPublicCopyField(copyByLocale, { headline: 'PL headline' }, 'en', 'headline'), 'EN headline')
})

test('publicCopyForLocale leaves empty EN marketing empty', () => {
  const copyByLocale = {
    pl: { headline: 'PL marketing', greeting: 'Cześć', profile: 'PL bio', aboutLead: 'PL about' },
    en: { aboutLabel: 'About', experienceLabel: 'Experience' },
  }
  const en = publicCopyForLocale(copyByLocale, copyByLocale.pl, 'en')
  assert.equal(en.headline, '')
  assert.equal(en.greeting, '')
  assert.equal(en.profile, '')
  assert.equal(en.aboutLead, '')
  assert.equal(en.aboutLabel, 'About')
})

test('languagesForPublic does not copy PL names into EN', () => {
  const doc = {
    languages: [{ name: 'Angielski', level: 'zaawansowany' }],
    languagesByLocale: {
      pl: [{ name: 'Angielski', level: 'zaawansowany' }],
      en: [],
    },
    locales: ['pl', 'en'],
    extras: { englishVersion: true },
  }
  const en = languagesForPublic(doc, 'en')
  const pl = languagesForPublic(doc, 'pl')
  assert.equal(en.length, 0)
  assert.equal(pl[0]?.name, 'Angielski')
  assert.equal(getLanguagesRaw(doc, 'en').length, 0)
})

test('setLanguagesForLocale en edit does not change pl or flat languages', () => {
  const doc = {
    languages: [{ name: 'Angielski', level: 'B2' }],
    languagesByLocale: { pl: [{ name: 'Angielski', level: 'B2' }] },
  }
  const next = setLanguagesForLocale(doc, 'en', [{ name: 'English', level: 'B2' }])
  assert.equal(next.languages?.[0]?.name, 'Angielski')
  assert.equal(next.languagesByLocale?.pl?.[0]?.name, 'Angielski')
  assert.equal(next.languagesByLocale?.en?.[0]?.name, 'English')
})

test('appearanceTextForPublic does not copy PL hair/eyes into EN', () => {
  const doc = {
    appearance: { height: '175', dressSize: '36', hairColor: 'brązowe', eyeColor: 'niebieskie' },
    appearanceTextByLocale: {
      pl: { hairColor: 'brązowe', eyeColor: 'niebieskie' },
      en: { hairColor: '', eyeColor: '' },
    },
    locales: ['pl', 'en'],
    extras: { englishVersion: true },
  }
  const en = appearanceTextForPublic(doc, 'en')
  const pl = appearanceTextForPublic(doc, 'pl')
  assert.equal(en.hairColor, '')
  assert.equal(en.eyeColor, '')
  assert.equal(pl.hairColor, 'brązowe')
  assert.equal(getAppearanceTextRaw(doc, 'en').hairColor, '')
})

test('setAppearanceTextForLocale en edit keeps shared height and PL hair', () => {
  const doc = {
    appearance: { height: '175', dressSize: '36', hairColor: 'brązowe', eyeColor: 'niebieskie' },
    appearanceTextByLocale: { pl: { hairColor: 'brązowe', eyeColor: 'niebieskie' } },
  }
  const next = setAppearanceTextForLocale(doc, 'en', { hairColor: 'Brown', eyeColor: 'Blue' })
  assert.equal(next.appearance?.height, '175')
  assert.equal(next.appearance?.hairColor, 'brązowe')
  assert.equal(next.appearanceTextByLocale?.en?.hairColor, 'Brown')
  assert.equal(next.appearanceTextByLocale?.pl?.hairColor, 'brązowe')
})

test('migrateCopyByLocale seeds empty EN language and appearance buckets', () => {
  const doc = {
    languages: [{ name: 'Angielski', level: 'B2' }],
    appearance: { height: '175', hairColor: 'brązowe', eyeColor: 'niebieskie' },
    locales: ['pl', 'en'],
    extras: { englishVersion: true },
  }
  const { doc: migrated, changed } = migrateCopyByLocale(doc)
  assert.equal(changed, true)
  assert.equal(migrated.languagesByLocale?.pl?.[0]?.name, 'Angielski')
  assert.deepEqual(migrated.languagesByLocale?.en, [])
  assert.equal(migrated.appearanceTextByLocale?.pl?.hairColor, 'brązowe')
  assert.equal(migrated.appearanceTextByLocale?.en?.hairColor, '')
  assert.equal(languagesForPublic(migrated, 'en').length, 0)
  assert.equal(appearanceTextForPublic(migrated, 'en').hairColor, '')
})

test('eventTextForPublic does not copy PL title into EN', () => {
  const event = {
    title: 'Targi Warszawa',
    description: 'Opis PL',
    titleByLocale: { pl: 'Targi Warszawa', en: '' },
    descriptionByLocale: { pl: 'Opis PL', en: '' },
  }
  const en = eventTextForPublic(event, 'en')
  const pl = eventTextForPublic(event, 'pl')
  assert.equal(en.title, '')
  assert.equal(pl.title, 'Targi Warszawa')
  assert.equal(getEventTextRaw(event, 'en').title, '')
})

test('setEventTextForLocale en edit keeps PL title and shared photo', () => {
  const doc = {
    events: [
      {
        id: 'event-1',
        title: 'Targi Warszawa',
        description: 'Opis PL',
        imageFile: 'cover.jpg',
        titleByLocale: { pl: 'Targi Warszawa' },
        descriptionByLocale: { pl: 'Opis PL' },
      },
    ],
  }
  const next = setEventTextForLocale(doc, 0, 'en', { title: 'Warsaw Expo', description: 'EN blurb' })
  assert.equal(next.events?.[0]?.title, 'Targi Warszawa')
  assert.equal(next.events?.[0]?.imageFile, 'cover.jpg')
  assert.equal(next.events?.[0]?.titleByLocale?.en, 'Warsaw Expo')
  assert.equal(next.events?.[0]?.titleByLocale?.pl, 'Targi Warszawa')
})

test('migrateCopyByLocale seeds empty EN event text buckets', () => {
  const doc = {
    events: [{ id: 'event-1', title: 'Targi Warszawa', description: 'Opis PL', imageFile: 'a.jpg' }],
    locales: ['pl', 'en'],
    extras: { englishVersion: true },
  }
  const { doc: migrated, changed } = migrateCopyByLocale(doc)
  assert.equal(changed, true)
  assert.equal(migrated.events?.[0]?.titleByLocale?.pl, 'Targi Warszawa')
  assert.equal(migrated.events?.[0]?.titleByLocale?.en, '')
  assert.equal(eventTextForPublic(migrated.events[0], 'en').title, '')
  assert.equal(eventTextForPublic(migrated.events[0], 'pl').title, 'Targi Warszawa')
})
