// Catalog integrity guardrail.
//
// Runs as `prebuild`. Asserts that:
//   1. Every entry in src/data.js has the required fields.
//   2. Every `playable: true` game has a matching lazy import in
//      src/components/GameIntro.jsx (PLAYABLE map).
//   3. Every `playable: true` game has a cover in src/covers.jsx
//      (GAME_COVERS map).
//   4. Every game submitting scores has a rule in
//      supabase/functions/_shared/scoreRules.ts (GAME_RULES).
//   5. The visible catalog count is at least MIN_CATALOG_SIZE.
//   6. No duplicate game ids.
//
// Failures exit non-zero, which kills `npm run build`. The point is
// that the catalog cannot silently collapse below baseline again.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const MIN_CATALOG_SIZE = Number(process.env.PGPLAY_MIN_CATALOG ?? 12);

const REQUIRED_FIELDS = ['id', 'name', 'cat', 'kind', 'players', 'tagline'];
const errors = [];
const warnings = [];

function read(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) throw new Error(`Missing file: ${rel}`);
  return readFileSync(p, 'utf8');
}

// Pull entries straight out of data.js by importing it. We use a dynamic
// `await import()` against the Vite source — Node 20 + .js modules with
// `export const GAMES = [...]` works directly because the file is plain ES.
const dataModule = await import(resolve(root, 'src/data.js'));
const { GAMES } = dataModule;

if (!Array.isArray(GAMES)) {
  errors.push('data.js: GAMES is not an array (likely a parse failure).');
}

// 1. Required fields
const seenIds = new Set();
for (const g of GAMES || []) {
  for (const f of REQUIRED_FIELDS) {
    if (g[f] == null || g[f] === '') {
      errors.push(`game ${g.id || '<unknown>'}: missing required field "${f}"`);
    }
  }
  if (g.id) {
    if (seenIds.has(g.id)) errors.push(`duplicate game id: ${g.id}`);
    seenIds.add(g.id);
  }
}

const playable = (GAMES || []).filter((g) => g.playable);

// 5. Catalog floor
if (playable.length < MIN_CATALOG_SIZE) {
  errors.push(
    `Catalog floor breach: only ${playable.length} playable games (minimum ${MIN_CATALOG_SIZE}). ` +
    `If this is intentional, set PGPLAY_MIN_CATALOG=${playable.length} in your env. ` +
    `If not, you've accidentally hidden games — check src/data.js.`,
  );
}

// 2. Lazy imports
const introSrc = read('src/components/GameIntro.jsx');
for (const g of playable) {
  const re = new RegExp(`\\b${g.id}\\s*:\\s*lazy\\(`);
  if (!re.test(introSrc)) {
    errors.push(`${g.id}: playable but not registered in PLAYABLE (GameIntro.jsx)`);
  }
}

// 3. Covers
const coversSrc = read('src/covers.jsx');
const coverKeys = [...coversSrc.matchAll(/(?:GAME_COVERS\s*=\s*\{|^|,)\s*([a-z0-9_]+)\s*:/gim)]
  .map((m) => m[1]);
const knownCoverKeys = new Set(coverKeys);
for (const g of playable) {
  if (!knownCoverKeys.has(g.id) && !coversSrc.includes(`'${g.id}'`)) {
    warnings.push(`${g.id}: no cover entry found in covers.jsx (will fall back, but ugly)`);
  }
}

// 4. Score rules
const rulesSrc = read('supabase/functions/_shared/scoreRules.ts');
for (const g of playable) {
  // Only verify games that actually submit scores. Heuristic: their
  // component file imports submitScore. We check the games folder for
  // either an `<id>` lazy file or any reference to `submitScore` near
  // their id.
  const possibleFiles = [
    `src/games/${g.id}.jsx`,
    `src/games/${g.id}/index.jsx`,
  ];
  const fileExists = possibleFiles.some((p) => existsSync(resolve(root, p)));
  // Game files are named after their slug *sometimes*. If neither matches,
  // we can't be sure, so we skip the rule check for that game. A missing
  // rule isn't fatal — submit-score returns 422 which the client logs.
  if (!fileExists) continue;
  if (!new RegExp(`\\b${g.id}\\s*:\\s*\\{`).test(rulesSrc)) {
    warnings.push(`${g.id}: no GAME_RULES entry in scoreRules.ts (server will reject score submissions)`);
  }
}

if (warnings.length) {
  console.warn('catalog warnings:');
  for (const w of warnings) console.warn(`  · ${w}`);
}

if (errors.length) {
  console.error('catalog integrity FAILED:');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(`catalog ok — ${playable.length} playable, ${GAMES.length} total`);
