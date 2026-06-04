import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function titleToNumber(s) {
  let r = 0;
  for (const ch of s) r = r * 26 + (ch.charCodeAt(0) - 64);
  return r;
}

function randTitle(len) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }
  return s;
}

const fixed = [
  'A', 'B', 'Z',
  'AA', 'AZ', 'BA', 'ZZ',
  'AAA', 'ABC', 'ZY',
  'FXSHRXW',
];

const randomTitles = [
  'KQRT', 'MZAB', 'PYXW', 'GHJK',
  'ABCDE', 'XYZAB', 'QWERT', 'LMNOP',
  'ABCDEF', 'PQRSTU', 'WXYZAB',
  'ABCDEFG', 'PROGRAM', 'CODINGZ',
];

const allTitles = [...fixed, ...randomTitles].slice(0, 25);

const test_cases = allTitles.map((s, i) => ({
  inputs: [JSON.stringify(s)],
  expected: String(titleToNumber(s)),
  sample: i < 3,
}));

const PY_SOLUTION = `class Solution:
    def titleToNumber(self, columnTitle: str) -> int:
        r = 0
        for ch in columnTitle: r = r*26 + (ord(ch)-64)
        return r
`;

async function reseed(slug, cases, python) {
  const { data: existing, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions, test_cases')
    .eq('id', slug)
    .maybeSingle();
  if (fetchErr) { console.error(slug, fetchErr); return null; }
  if (!existing) { console.error('Not found:', slug); return null; }
  const prior = Array.isArray(existing.test_cases) ? existing.test_cases.length : 0;
  const solutions = { ...(existing.solutions || {}), python };
  const { error: upErr } = await sb
    .from('PGcode_problems')
    .update({ test_cases: cases, solutions })
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: cases.length };
}

console.log(`excel-sheet-column-number: ${test_cases.length} cases`);
for (const tc of test_cases.slice(0, 5)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);
console.log(`  ...`);
for (const tc of test_cases.slice(-3)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);

const r = await reseed('excel-sheet-column-number', test_cases, PY_SOLUTION);

console.log('\n--- Results ---');
if (r) console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
