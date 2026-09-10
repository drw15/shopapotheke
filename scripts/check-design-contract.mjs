#!/usr/bin/env node
/**
 * Design contract check.
 *
 * Mechanical guard against the drift the approved design warns about:
 * stray hex colours, invented carriers, steering copy, and raw model fields
 * reaching customer-facing code.
 *
 * This does not judge whether a screen looks like Shop Apotheke - only the
 * reference screenshots can settle that. It catches the failures a reviewer
 * should never have to find by eye.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
const TOKENS_FILE = join(SRC, 'styles', 'tokens.css')

const failures = []

function walk(dir) {
  const entries = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) entries.push(...walk(full))
    else entries.push(full)
  }
  return entries
}

const files = walk(SRC)
const rel = (file) => relative(ROOT, file).split(sep).join('/')

// --- 1. Colour values live only in tokens.css -------------------------------
const HEX = /#[0-9a-fA-F]{3,8}\b/g

for (const file of files) {
  if (file === TOKENS_FILE) continue
  if (!/\.(css|ts|tsx)$/.test(file)) continue

  const source = readFileSync(file, 'utf8')
  for (const line of source.split('\n')) {
    // Ignore hex-like strings inside comments and SVG path data references.
    if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) continue
    const matches = line.match(HEX)
    if (matches) {
      failures.push(
        `${rel(file)}: raw colour ${matches.join(', ')} - use a token from src/styles/tokens.css`,
      )
    }
  }
}

// --- 2. No invented carriers or steering copy -------------------------------
const FORBIDDEN_COPY = [
  { pattern: /\bDPD\b/, note: 'DPD is not a carrier in the reference checkout' },
  { pattern: /\bRecommended\b/i, note: 'no recommendation badges' },
  { pattern: /\bBest option\b/i, note: 'no steering copy' },
  { pattern: /\bEmpfohlen\b/i, note: 'no recommendation badges' },
]

// --- 3. Raw model metadata must not reach the UI ----------------------------
const RAW_MODEL_FIELDS = [
  'q10BusinessDays',
  'q50BusinessDays',
  'q90BusinessDays',
  'confidenceScore',
  'calibrationError',
  'supportN',
]

// --- 4. Internal vocabulary must not reach the UI ---------------------------
const INTERNAL_TERMS = [{ pattern: /\bSevenum\b/, note: 'internal fulfilment name' }]

const isUiFile = (file) => {
  const path = rel(file)
  if (!/\.(tsx|css)$/.test(path)) return false
  if (path.includes('.test.')) return false
  return (
    path.startsWith('src/pages/') ||
    path.startsWith('src/components/') ||
    path.startsWith('src/app/') ||
    path.startsWith('src/styles/')
  )
}

for (const file of files) {
  if (!/\.(css|ts|tsx)$/.test(file)) continue
  if (rel(file).includes('.test.')) continue

  const source = readFileSync(file, 'utf8')

  // Strip comments first: the design docs and code comments legitimately
  // discuss what is excluded, and naming a thing is not shipping it.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  for (const { pattern, note } of FORBIDDEN_COPY) {
    if (pattern.test(code)) failures.push(`${rel(file)}: ${pattern} - ${note}`)
  }

  if (isUiFile(file)) {
    for (const field of RAW_MODEL_FIELDS) {
      if (code.includes(field)) {
        failures.push(`${rel(file)}: raw model field \`${field}\` must not reach customer UI`)
      }
    }
    for (const { pattern, note } of INTERNAL_TERMS) {
      if (pattern.test(code)) failures.push(`${rel(file)}: ${pattern} - ${note}`)
    }
  }
}

// --- 5. tokens.css defines exactly the locked palette -----------------------
const EXPECTED_TOKENS = {
  '--sa-red': '#E90033',
  '--sa-green': '#006C48',
  '--sa-text': '#1B1C1B',
  '--sa-white': '#FFFFFF',
  '--sa-surface': '#FBF9F8',
  '--sa-peach-soft': '#FFECE6',
  '--sa-peach-nav': '#FFC8B3',
  '--sa-border': '#E5E4E3',
  '--sa-email-peach': '#FDD1BC',
  '--sa-email-lavender': '#D3CFFF',
  '--dhl-yellow': '#FFCC00',
  '--hermes-blue': '#009AD8',
}

const tokensSource = readFileSync(TOKENS_FILE, 'utf8')
for (const [token, value] of Object.entries(EXPECTED_TOKENS)) {
  const declared = new RegExp(`${token}\\s*:\\s*${value}\\s*;`, 'i')
  if (!declared.test(tokensSource)) {
    failures.push(`src/styles/tokens.css: locked token ${token}:${value} is missing or changed`)
  }
}

// --- Report -----------------------------------------------------------------
if (failures.length > 0) {
  console.error('Design contract violations:\n')
  for (const failure of failures) console.error(`  - ${failure}`)
  console.error(`\n${failures.length} violation(s).`)
  process.exit(1)
}

console.log('Design contract OK.')
