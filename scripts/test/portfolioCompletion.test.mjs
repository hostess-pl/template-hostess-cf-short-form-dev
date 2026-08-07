/**
 * Weighted portfolio completion unit checks (short-form onboarding).
 * Run from tip root: node --experimental-strip-types scripts/test/portfolioCompletion.test.mjs
 */
import assert from 'node:assert/strict'
import {
  computePortfolioCompletion,
} from '../../src/lib/cms/portfolioCompletion.ts'

const base = {
  profile: { displayName: 'Test', socials: {} },
  events: [{ id: 'event-1', title: '', imageFile: 'event-1.jpg' }],
  languages: [],
  employment: [],
  education: { entries: [] },
  bio: { short: '' },
  copy: {},
  appearance: {},
  mobility: {},
}

{
  const withBaked = computePortfolioCompletion(base, { hasBakedHero: true })
  assert.equal(withBaked.milestones.find((m) => m.id === 'hero')?.done, true)
  assert.equal(withBaked.milestones.find((m) => m.id === 'event_story')?.done, false)
  assert.ok(withBaked.pct > 0)
}

{
  const titled = computePortfolioCompletion(
    {
      ...base,
      events: [{ id: 'event-1', title: 'Warsaw Expo', imageFile: 'event-1.jpg' }],
    },
    { hasBakedHero: true },
  )
  assert.equal(titled.milestones.find((m) => m.id === 'event_story')?.done, true)
}

{
  const noHero = computePortfolioCompletion({ ...base, assets: {} }, { hasBakedHero: false })
  assert.equal(noHero.milestones.find((m) => m.id === 'hero')?.done, false)
}

{
  const deep = computePortfolioCompletion(
    {
      ...base,
      events: [
        { id: 'e1', title: 'A', imageFile: 'a.jpg' },
        { id: 'e2', title: '', imageFile: 'b.jpg' },
      ],
    },
    { hasBakedHero: true },
  )
  assert.equal(deep.milestones.find((m) => m.id === 'gallery_depth')?.done, true)
}

{
  const weights = computePortfolioCompletion(base, { hasBakedHero: true })
  const eventW = weights.milestones.find((m) => m.id === 'event_story')?.weight ?? 0
  const socialW = weights.milestones.find((m) => m.id === 'socials')?.weight ?? 0
  assert.ok(eventW > socialW)
  assert.equal(weights.next?.id, 'event_story')
}

console.log('portfolioCompletion.test.mjs: ok')
