import assert from 'node:assert/strict'
import {
  normalizePortfolioPalette,
  portfolioPaletteAccent,
  portfolioPaletteCss,
} from '../../src/lib/portfolioPalette.ts'

assert.equal(normalizePortfolioPalette('rose'), 'rose')
assert.equal(normalizePortfolioPalette('unknown'), 'default')
assert.equal(portfolioPaletteAccent('', 'modern'), null)
assert.equal(portfolioPaletteAccent('blue', 'modern'), '#42678F')
assert.equal(portfolioPaletteAccent('blue', 'luxury'), '#91BCE8')
assert.match(portfolioPaletteCss('sage', 'minimal') || '', /--accent: #52705F/)
assert.equal(portfolioPaletteCss('default', 'elegant'), undefined)

console.log('portfolioPalette.test.mjs: ok')
