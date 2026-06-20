#!/usr/bin/env node
// Two fixes in one pass over PGcode_problems:
//   1. Normalize `constraints` to newline-separated text (column type is `text`,
//      so writing a JS array got JSON.stringify'd and rendered as a single
//      bracketed bullet in the UI).
//   2. Strip the inline "Constraints:" and "Follow-up:" sections from `description`
//      so they don't render twice (once from the description HTML, once from the
//      separate columns).
//
// Usage:
//   node scripts/normalize-constraints.js --dry
//   node scripts/normalize-constraints.js

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
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) { console.error('Need env vars'); process.exit(1); }
const sb = createClient(URL, SVC);

const DRY = process.argv.includes('--dry');

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return null;
  const s = value.trim();
  // Already a JSON array?
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  // Newline-separated text: keep as-is.
  return null;
}

function stripInlineSections(html) {
  if (!html || typeof html !== 'string') return html;
  let h = html;
  // Strip "Constraints:" header + the immediately-following <ul> block.
  h = h.replace(/<p>[^<]*<strong>\s*Constraints\s*:?\s*<\/strong>[^<]*<\/p>\s*<ul[\s\S]*?<\/ul>/gi, '');
  h = h.replace(/<p>\s*<b>\s*Constraints\s*:?\s*<\/b>\s*<\/p>\s*<ul[\s\S]*?<\/ul>/gi, '');
  // Strip "Follow-up:" line and the trailing paragraph(s) up to end.
  h = h.replace(/<p>[^<]*<strong>\s*Follow[\s-]?up\s*:?\s*<\/strong>[\s\S]*?$/gi, '');
  h = h.replace(/<p>\s*<b>\s*Follow[\s-]?up\s*:?\s*<\/b>[\s\S]*?$/gi, '');
  // Strip standalone "<strong>Follow up:</strong> ..." text without enclosing <p>
  h = h.replace(/<strong>\s*Follow[\s-]?up\s*:?\s*<\/strong>[\s\S]*?$/gi, '');
  // Trailing &nbsp; <p> garbage.
  h = h.replace(/(<p>&nbsp;<\/p>\s*)+$/g, '');
  return h.trim();
}

async function loadAll() {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, constraints, description')
      .order('id', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

(async function main() {
  const rows = await loadAll();
  console.log(`Loaded ${rows.length} rows. Normalizing${DRY ? ' (DRY)' : ''}...`);
  let cFixed = 0, dFixed = 0, fail = 0;
  for (const row of rows) {
    const updates = {};
    // 1. Constraints: if a JSON-stringified array, convert to newline text.
    const arr = asArray(row.constraints);
    if (arr && arr.length) {
      updates.constraints = arr.join('\n');
    }
    // 2. Description: strip inline Constraints/Follow-up sections.
    if (row.description && typeof row.description === 'string') {
      const stripped = stripInlineSections(row.description);
      if (stripped !== row.description) {
        updates.description = stripped;
      }
    }
    if (Object.keys(updates).length === 0) continue;
    if (updates.constraints !== undefined) cFixed++;
    if (updates.description !== undefined) dFixed++;
    if (DRY) continue;
    const { error } = await sb.from('PGcode_problems').update(updates).eq('id', row.id);
    if (error) { console.log(`  ${row.id} ERROR: ${error.message}`); fail++; }
  }
  console.log(`\nDone. constraints_fixed=${cFixed} description_stripped=${dFixed} failed=${fail}`);
})();
