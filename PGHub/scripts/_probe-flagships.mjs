// Probe whether the 25 flagship problem IDs exist in the DB.
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
  .select('id, method_name, params, return_type, test_cases')
  .in('id', IDS);
if (error) { console.error(error); process.exit(1); }

const found = new Map(data.map(r => [r.id, r]));
for (const id of IDS) {
  const r = found.get(id);
  if (!r) { console.log(`MISSING ${id}`); continue; }
  const tc = Array.isArray(r.test_cases) ? r.test_cases.length : 0;
  console.log(`OK ${id}  method=${r.method_name}  params=${JSON.stringify(r.params)}  ret=${r.return_type}  cases=${tc}`);
}
