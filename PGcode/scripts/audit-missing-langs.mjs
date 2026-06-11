#!/usr/bin/env node
// Audit PGcode_problems for rows with a Python solution but missing one or
// more of [javascript, java, cpp].
//
// "Has a solution for lang L" means EITHER:
//   - solutions[L] is a non-empty string, OR
//   - solutions[L] is an object with a non-empty string `code` field (legacy
//     wrapped format used by some seed waves).
//
// Writes /tmp/missing_langs.json with rows that have python but miss at least
// one required lang, and prints a per-language breakdown.

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

const PAGE = 1000;
const REQUIRED = ['javascript', 'java', 'cpp'];

function extractCode(val) {
  if (typeof val === 'string') return val.trim().length > 0 ? val : null;
  if (val && typeof val === 'object') {
    if (typeof val.code === 'string' && val.code.trim().length > 0) return val.code;
    // Sometimes legacy entries use lang-keyed sub-objects: { python: '...', java: '...' }.
    // We do not treat those as language solutions because the parent key tells us nothing.
  }
  return null;
}

function findLangInTree(sols, lang) {
  // 1. Direct top-level string.
  const direct = sols[lang];
  const direct1 = extractCode(direct);
  if (direct1) return direct1;
  // 2. Look inside legacy buckets — solutions.optimal.<lang>, solutions.brute_force.<lang>.
  for (const bucket of ['optimal', 'brute_force', 'bruteForce', 'brute', 'alternative']) {
    const b = sols[bucket];
    if (b && typeof b === 'object') {
      const v = extractCode(b[lang]);
      if (v) return v;
    }
  }
  return null;
}

async function pageAll() {
  let from = 0;
  const rows = [];
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions')
      .range(from, from + PAGE - 1)
      .order('id');
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

const all = await pageAll();
console.log(`Scanned ${all.length} problems.`);

const missingList = [];
const counts = { javascript: 0, java: 0, cpp: 0 };
let pythonPresent = 0;
let allFourPresent = 0;

for (const row of all) {
  const sols = row.solutions || {};
  const py = findLangInTree(sols, 'python');
  if (!py) continue;
  pythonPresent++;

  const missing = REQUIRED.filter((l) => !findLangInTree(sols, l));
  if (missing.length === 0) { allFourPresent++; continue; }

  for (const l of missing) counts[l]++;
  missingList.push({
    id: row.id,
    method_name: row.method_name,
    params: row.params,
    return_type: row.return_type,
    missing,
    existing_python: py,
  });
}

const outPath = '/tmp/missing_langs.json';
fs.writeFileSync(outPath, JSON.stringify(missingList, null, 2));

const missingSlots = counts.javascript + counts.java + counts.cpp;
console.log('');
console.log('=== AUDIT SUMMARY ===');
console.log(`Total problems:                       ${all.length}`);
console.log(`Problems with python solution:        ${pythonPresent}`);
console.log(`Problems with all 4 languages:        ${allFourPresent}`);
console.log(`Problems missing >= 1 language:       ${missingList.length}`);
console.log(`Total missing-language slots:         ${missingSlots}`);
console.log(`  javascript missing:                 ${counts.javascript}`);
console.log(`  java missing:                       ${counts.java}`);
console.log(`  cpp missing:                        ${counts.cpp}`);
console.log('');
console.log(`Wrote details to ${outPath}`);
