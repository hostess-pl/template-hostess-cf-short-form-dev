#!/usr/bin/env node
/**
 * Generate public/favicon.svg with the hostess initial (letter favicon).
 *
 * Usage:
 *   node scripts/generate-favicon.mjs
 *   node scripts/generate-favicon.mjs --letter Z
 *   node scripts/generate-favicon.mjs --name "Zofia Wielińska"
 *
 * Reads displayName/legalName from src/content/hostess.json when --letter/--name omitted.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hostessJsonPath = resolve(projectRoot, 'src/content/hostess.json');
const faviconPath = resolve(projectRoot, 'public/favicon.svg');

/**
 * First Unicode letter from a name, accents stripped (Zofia → Z, Wielińska → W).
 * @param {string} name
 * @returns {string} uppercase letter or ''
 */
export function initialFromName(name) {
  const polishFold = String(name || '')
    .replace(/[Ąą]/g, 'A')
    .replace(/[Ćć]/g, 'C')
    .replace(/[Ęę]/g, 'E')
    .replace(/[Łł]/g, 'L')
    .replace(/[Ńń]/g, 'N')
    .replace(/[Óó]/g, 'O')
    .replace(/[Śś]/g, 'S')
    .replace(/[ŹźŻż]/g, 'Z');
  const normalized = polishFold
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
  const match = normalized.match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : '';
}

/**
 * @param {{ letter?: string, name?: string, displayName?: string, legalName?: string }} input
 * @returns {string}
 */
export function resolveFaviconLetter(input = {}) {
  const explicit = String(input.letter || '').trim();
  if (explicit) {
    const letter = initialFromName(explicit) || explicit[0].toUpperCase();
    if (/^[A-Z]$/.test(letter)) return letter;
  }
  const fromName = initialFromName(input.name || input.displayName || input.legalName || '');
  return fromName || 'H';
}

/**
 * @param {string} letter single A–Z (or fallback glyph)
 */
export function buildFaviconSvg(letter) {
  const safe = String(letter || 'H').slice(0, 1).toUpperCase() || 'H';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="#FDFAF6"/>
  <text x="16" y="22" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="500" fill="#2A2622">${safe}</text>
  <circle cx="26" cy="6" r="3" fill="#C4A46B"/>
</svg>
`;
}

function parseArgs(argv) {
  let letter = '';
  let name = '';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--letter') {
      letter = argv[++i] || '';
      continue;
    }
    if (arg.startsWith('--letter=')) {
      letter = arg.slice('--letter='.length);
      continue;
    }
    if (arg === '--name') {
      name = argv[++i] || '';
      continue;
    }
    if (arg.startsWith('--name=')) {
      name = arg.slice('--name='.length);
      continue;
    }
  }
  return { letter, name };
}

function loadHostessProfile() {
  if (!existsSync(hostessJsonPath)) return {};
  try {
    const hostess = JSON.parse(readFileSync(hostessJsonPath, 'utf8'));
    return hostess?.profile && typeof hostess.profile === 'object' ? hostess.profile : {};
  } catch {
    return {};
  }
}

export function writeFavicon(letter, outPath = faviconPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buildFaviconSvg(letter), 'utf8');
  return outPath;
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const args = parseArgs(process.argv.slice(2));
  const profile = loadHostessProfile();
  const letter = resolveFaviconLetter({
    letter: args.letter,
    name: args.name,
    displayName: profile.displayName,
    legalName: profile.legalName,
  });
  const path = writeFavicon(letter);
  console.log(`[favicon] Wrote ${path} letter=${letter}`);
}
