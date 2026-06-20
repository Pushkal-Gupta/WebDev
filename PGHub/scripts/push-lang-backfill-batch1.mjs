#!/usr/bin/env node
// Backfill missing language solutions on PGcode_problems.
//
// Strategy:
// - Read /tmp/missing_langs.json (produced by audit-missing-langs.mjs).
// - For each entry, fetch the current row's `solutions` JSON.
// - For each missing language in the entry, fill it with code in priority
//   order:
//     1. Hand-authored ports defined in this file (PORTS table keyed by id).
//     2. Legacy-bucket fallback — solutions.optimal.code.<lang>, then
//        solutions.brute_force.code.<lang>. These were previously authored
//        and graded, just not hoisted to the top level.
// - Update the row's `solutions` JSONB with the new top-level keys merged in.
//   Never erase existing keys.
//
// Use --dry to preview without writing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, SVC);

const dry = process.argv.includes('--dry');

// Hand-authored ports (keyed by problem id). Only populate when the legacy
// bucket fallback is not available or not trustworthy. Each entry maps the
// missing-language key to a vetted code string.
const PORTS = {
  // 'some-slug': {
  //   javascript: '...',
  //   java: '...',
  //   cpp: '...',
  // },
};

function extractCode(val) {
  if (typeof val === 'string') return val.trim().length > 0 ? val : null;
  if (val && typeof val === 'object' && typeof val.code === 'string' && val.code.trim().length > 0) {
    return val.code;
  }
  return null;
}

function legacyBucketLang(sols, lang) {
  for (const bucket of ['optimal', 'brute_force', 'bruteForce', 'brute', 'alternative']) {
    const b = sols[bucket];
    if (!b || typeof b !== 'object') continue;
    // bucket.code may itself be an object keyed by language.
    if (b.code && typeof b.code === 'object' && typeof b.code[lang] === 'string' && b.code[lang].trim()) {
      return b.code[lang];
    }
    // Or bucket.<lang> directly.
    const direct = extractCode(b[lang]);
    if (direct) return direct;
  }
  return null;
}

const missing = JSON.parse(fs.readFileSync('/tmp/missing_langs.json', 'utf8'));
console.log(`Loaded ${missing.length} problems with missing languages.\n`);

let updatedCount = 0;
let filledSlots = 0;
let leftUnfilled = 0;

for (const entry of missing) {
  const { id } = entry;
  const { data: row, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions')
    .eq('id', id)
    .single();
  if (fetchErr) { console.log(`  ${id}: fetch error ${fetchErr.message}`); continue; }
  const sols = row.solutions || {};

  const updates = {};
  for (const lang of entry.missing) {
    let code = null;
    if (PORTS[id] && typeof PORTS[id][lang] === 'string' && PORTS[id][lang].trim()) {
      code = PORTS[id][lang];
    } else {
      code = legacyBucketLang(sols, lang);
    }
    if (code) {
      updates[lang] = code;
    } else {
      leftUnfilled++;
      console.log(`  ${id}: no source for ${lang} — leaving unfilled`);
    }
  }

  if (Object.keys(updates).length === 0) continue;

  const newSolutions = { ...sols, ...updates };
  console.log(`  ${id}: filling [${Object.keys(updates).join(', ')}]`);
  if (!dry) {
    const { error: upErr } = await sb
      .from('PGcode_problems')
      .update({ solutions: newSolutions })
      .eq('id', id);
    if (upErr) { console.log(`    update error: ${upErr.message}`); continue; }
  }
  updatedCount++;
  filledSlots += Object.keys(updates).length;
}

console.log('');
console.log('=== BACKFILL SUMMARY ===');
console.log(`Problems updated:     ${updatedCount}${dry ? ' (dry-run, no writes)' : ''}`);
console.log(`Slots filled:         ${filledSlots}`);
console.log(`Slots left unfilled:  ${leftUnfilled}`);
