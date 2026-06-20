// Print first few test_cases for the 25 flagship problems so I can verify expected outputs.
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

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const IDS = [
  'two-sum','add-two-numbers','longest-substring-without-repeating-characters',
  'longest-palindromic-substring','container-with-most-water','three-sum',
  'valid-parentheses','merge-two-sorted-lists','remove-nth-node-from-end-of-list',
  'search-in-rotated-sorted-array','valid-anagram','group-anagrams',
  'maximum-subarray','climbing-stairs','best-time-to-buy-and-sell-stock',
  'single-number','linked-list-cycle','binary-tree-inorder-traversal',
  'symmetric-tree','validate-binary-search-tree','number-of-islands',
  'kth-largest-element-in-an-array','course-schedule','implement-trie',
  'longest-common-prefix',
];

const { data, error } = await sb.from('PGcode_problems')
  .select('id, test_cases')
  .in('id', IDS);
if (error) { console.error(error); process.exit(1); }

for (const r of data) {
  const tc = Array.isArray(r.test_cases) ? r.test_cases : [];
  console.log(`\n=== ${r.id}  (${tc.length} cases) ===`);
  for (let i = 0; i < Math.min(5, tc.length); i++) {
    console.log(`  [${i}] inputs=${JSON.stringify(tc[i].inputs)}  expected=${JSON.stringify(tc[i].expected)}`);
  }
}
