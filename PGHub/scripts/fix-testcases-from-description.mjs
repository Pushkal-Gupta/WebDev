#!/usr/bin/env node
// Parse LC-style descriptions for "Input: ... Output: ..." example blocks and
// turn them into proper test_cases entries. Targets problems where:
//   - test_cases is null/empty, OR
//   - test_cases has all-null `expected` (unusable for grading)
//
// Doesn't touch problems that already have at least one expected value set —
// those were filled by agents and shouldn't be overwritten.
//
// Usage: node scripts/fix-testcases-from-description.mjs [--dry]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dry = process.argv.includes('--dry');

function decodeHtml(s) {
  let out = String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  let prev;
  do { prev = out; out = out.replace(/<[^>]+>/g, ''); } while (out !== prev);
  return out;
}

// Extract all "Input: ... Output: ..." example pairs from the description.
function extractExamples(desc) {
  if (!desc) return [];
  const text = decodeHtml(desc);
  // Match "Input: <inputs> Output: <output>" — non-greedy until next "Input:" or "Explanation:" or end
  const re = /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=(?:\n\s*Input:|\n\s*Explanation:|\n\s*Constraints:|\n\s*Example|\nFollow ?-?up|$))/gi;
  const examples = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const input = m[1].trim().replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');
    const output = m[2].trim().replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');
    if (input && output) examples.push({ input, output });
    if (examples.length >= 6) break;
  }
  return examples;
}

// Split "a = X, b = Y, c = Z" → ["X", "Y", "Z"], respecting brackets.
function splitNamedArgs(s) {
  const parts = [];
  let depth = 0, buf = '';
  for (const ch of s) {
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '}' || ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  return parts.map(p => {
    const eq = p.indexOf('=');
    return eq === -1 ? p.trim() : p.slice(eq + 1).trim();
  });
}

function cleanOutput(o) {
  // Strip trailing periods or example explanations bleeding in.
  return o.replace(/\s*Example\s+\d+.*$/i, '').trim();
}

const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,description,params,test_cases')
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Loaded ${all.length} problems`);

const eligible = all.filter(p => {
  if (!p.description) return false;
  const tc = Array.isArray(p.test_cases) ? p.test_cases : null;
  if (!tc || tc.length === 0) return true; // empty
  const goodCount = tc.filter(t => t.expected !== null && t.expected !== undefined).length;
  return goodCount === 0; // all-null expected
});
console.log(`Eligible (no good test cases yet): ${eligible.length}`);

const patches = [];
let extracted = 0, skipped = 0;
for (const p of eligible) {
  const examples = extractExamples(p.description);
  if (!examples.length) { skipped++; continue; }
  const test_cases = examples.map((ex, i) => ({
    inputs: splitNamedArgs(ex.input),
    expected: cleanOutput(ex.output),
    is_sample: i === 0,
  }));
  patches.push({ id: p.id, test_cases });
  extracted++;
}
console.log(`Extracted test cases for ${extracted}, couldn't parse ${skipped}`);

if (!patches.length) process.exit(0);

const out = '/tmp/fix-testcases.json';
fs.writeFileSync(out, JSON.stringify(patches));
console.log(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);

console.log('Sample 3:');
patches.slice(0, 3).forEach(p => console.log(' ', p.id, ':', JSON.stringify(p.test_cases[0])));

if (dry) process.exit(0);

console.log('Run: node scripts/upsert-problem-content.js /tmp/fix-testcases.json');
