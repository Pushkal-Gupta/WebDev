#!/usr/bin/env node
// Read src/content/problemContent.js (RICH_CONTENT, COMPLETE_PROBLEMS), pluck
// the per-language solutions + viz frames + tags + companies, and push them
// into PGcode_problems.solutions / viz_steps / tags columns.
//
// Existing rows are UPDATED (not inserted) — this never creates a new problem.
// Idempotent: re-runs overwrite with the latest source-of-truth from the file.

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
if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, SVC);

// Dynamically import the ESM file. Vite alias-free here.
const { RICH_CONTENT } = await import(path.join(__dirname, '..', 'src', 'content', 'problemContent.js'));

const slugs = Object.keys(RICH_CONTENT);
console.log(`Pushing ${slugs.length} problems' rich content to DB...`);

let ok = 0, fail = 0;
for (const slug of slugs) {
  const c = RICH_CONTENT[slug];
  const update = {
    solutions: c.solutions || null,
    viz_steps: c.viz || null,
    tags: c.tags || null,
  };
  const { error } = await sb.from('PGcode_problems').update(update).eq('id', slug);
  if (error) { console.log(`  ${slug}: ${error.message.slice(0, 120)}`); fail++; }
  else { console.log(`  ${slug}: ok`); ok++; }
}
console.log(`\nDone: ${ok} updated, ${fail} failed.`);
