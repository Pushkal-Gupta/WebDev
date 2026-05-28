#!/usr/bin/env node
// Generic upsert script. Takes a JSON file of problem-content patches and
// writes only the non-null fields back to PGcode_problems.
//
// Input file shape:
//   [
//     {
//       "id": "two-sum",                     // required
//       "method_name": "twoSum",             // optional
//       "params": [{"name":"nums","type":"List[int]"}, {"name":"target","type":"int"}],
//       "return_type": "List[int]",
//       "test_cases": [{"inputs":["[2,7,11,15]","9"], "expected":"[0,1]"}, ...],
//       "hints": ["Hint 1", "Hint 2", "Hint 3"],
//       "editorial_md": "# Intuition\n...",
//       "solutions": { "python": "...", "javascript": "...", "java": "...", "cpp": "..." },
//       "pattern": "Two Pointers",
//       "topic_id": "arrays",
//       "tags": ["arrays","hash-table"]
//     }
//   ]
//
// Usage: node scripts/upsert-problem-content.js <path-to-json>

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

const SB_URL = process.env.VITE_SUPABASE_URL;
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SR_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const sb = createClient(SB_URL, SR_KEY);

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/upsert-problem-content.js <path-to-json>');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(payload)) {
  console.error('Input must be a JSON array of problem patches');
  process.exit(1);
}

const ALLOWED = new Set([
  'method_name', 'params', 'return_type', 'test_cases', 'hints',
  'editorial_md', 'solutions', 'pattern', 'topic_id', 'tags', 'description',
]);

let ok = 0, fail = 0, skipped = 0;
const failures = [];

for (const entry of payload) {
  if (!entry || typeof entry !== 'object' || !entry.id) {
    skipped++; continue;
  }
  const id = String(entry.id);
  const patch = {};
  for (const [k, v] of Object.entries(entry)) {
    if (k === 'id') continue;
    if (!ALLOWED.has(k)) continue;
    if (v === null || v === undefined) continue;
    patch[k] = v;
  }
  if (Object.keys(patch).length === 0) { skipped++; continue; }

  const { error } = await sb.from('PGcode_problems').update(patch).eq('id', id);
  if (error) {
    fail++;
    failures.push({ id, error: error.message });
  } else {
    ok++;
  }
}

console.log(JSON.stringify({
  input: inputPath,
  total: payload.length,
  updated: ok,
  failed: fail,
  skipped,
  failures: failures.slice(0, 10),
}, null, 2));
