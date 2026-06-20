#!/usr/bin/env node
// Seed PGcode_company_problems with a curated map of company → flagship problems.
// Pulls from the well-known interview-frequency lists. Only links problems that
// actually exist (graded) in PGcode_problems.

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

// company_slug → [problem_id, frequency_score (0-100)]
const MAP = {
  google: [
    ['two-sum', 95], ['longest-substr-no-repeat', 90], ['median-of-two-sorted-arrays', 88],
    ['add-two-numbers', 85], ['merge-intervals', 82], ['valid-parentheses', 80],
    ['word-ladder', 78], ['lru-cache', 88], ['number-of-islands', 86],
    ['course-schedule', 82], ['kth-largest-element', 80], ['max-product-subarray', 75],
    ['trapping-rain-water', 90], ['edit-distance', 78], ['regular-expression-matching', 70],
  ],
  meta: [
    ['valid-parentheses', 92], ['merge-intervals', 88], ['add-two-numbers', 85],
    ['lowest-common-ancestor', 90], ['lru-cache', 82], ['kth-largest-element', 80],
    ['number-of-islands', 88], ['word-ladder', 75], ['best-time-to-buy-sell-stock', 85],
    ['binary-tree-right-side', 78], ['copy-list-random-pointer', 80], ['validate-bst', 82],
    ['palindrome-partitioning', 70], ['subsets', 78], ['permutations', 75],
  ],
  amazon: [
    ['two-sum', 95], ['lru-cache', 92], ['number-of-islands', 90], ['merge-intervals', 88],
    ['word-ladder', 85], ['trapping-rain-water', 88], ['copy-list-random-pointer', 80],
    ['kth-largest-element', 82], ['task-scheduler', 78], ['best-time-to-buy-sell-stock', 85],
    ['valid-parentheses', 80], ['add-two-numbers', 78], ['course-schedule', 80],
    ['evaluate-division', 70], ['find-median-data-stream', 75],
  ],
  microsoft: [
    ['add-two-numbers', 90], ['reverse-linked-list', 88], ['valid-parentheses', 85],
    ['merge-intervals', 82], ['lru-cache', 80], ['two-sum', 92], ['rotate-image', 78],
    ['spiral-matrix', 80], ['copy-list-random-pointer', 75], ['validate-bst', 82],
    ['lowest-common-ancestor', 78], ['find-min-rotated', 70], ['search-in-rotated-sorted-array', 78],
    ['longest-palindromic-substring', 75], ['edit-distance', 72],
  ],
  apple: [
    ['two-sum', 90], ['lru-cache', 88], ['merge-intervals', 85], ['valid-parentheses', 80],
    ['lowest-common-ancestor', 82], ['add-two-numbers', 78], ['trapping-rain-water', 80],
    ['copy-list-random-pointer', 75], ['kth-largest-element', 78], ['number-of-islands', 80],
  ],
  netflix: [
    ['lru-cache', 92], ['merge-intervals', 85], ['valid-parentheses', 80], ['two-sum', 85],
    ['find-median-data-stream', 82], ['sliding-window-maximum', 78], ['task-scheduler', 75],
  ],
  uber: [
    ['lru-cache', 88], ['number-of-islands', 85], ['merge-intervals', 82], ['valid-parentheses', 80],
    ['two-sum', 85], ['find-median-data-stream', 78], ['trapping-rain-water', 75],
    ['evaluate-division', 80], ['course-schedule', 78], ['best-time-to-buy-sell-stock', 70],
  ],
  bloomberg: [
    ['two-sum', 92], ['valid-parentheses', 88], ['lru-cache', 85], ['merge-intervals', 80],
    ['kth-largest-element', 82], ['add-two-numbers', 78], ['validate-bst', 80],
    ['number-of-islands', 75], ['min-stack', 78],
  ],
  adobe: [
    ['two-sum', 85], ['merge-intervals', 80], ['valid-parentheses', 78], ['add-two-numbers', 75],
    ['lru-cache', 75], ['number-of-islands', 78], ['longest-palindromic-substring', 72],
  ],
  atlassian: [
    ['lru-cache', 85], ['merge-intervals', 82], ['two-sum', 80], ['lowest-common-ancestor', 78],
    ['valid-parentheses', 75], ['number-of-islands', 70],
  ],
  oracle: [
    ['two-sum', 80], ['valid-parentheses', 78], ['merge-intervals', 75], ['add-two-numbers', 72],
    ['lru-cache', 70], ['rotate-image', 75], ['spiral-matrix', 70],
  ],
  paypal: [
    ['two-sum', 85], ['valid-parentheses', 80], ['merge-intervals', 78], ['lru-cache', 75],
    ['number-of-islands', 70], ['kth-largest-element', 72],
  ],
  intuit: [
    ['two-sum', 80], ['merge-intervals', 78], ['valid-parentheses', 75], ['lru-cache', 70],
  ],
  servicenow: [
    ['two-sum', 78], ['merge-intervals', 75], ['valid-parentheses', 72], ['add-two-numbers', 70],
  ],
  samsung: [
    ['two-sum', 75], ['merge-intervals', 70], ['valid-parentheses', 72], ['number-of-islands', 68],
    ['add-two-numbers', 65],
  ],
  // India tier
  flipkart: [
    ['two-sum', 88], ['valid-parentheses', 82], ['merge-intervals', 80], ['lru-cache', 78],
    ['lowest-common-ancestor', 75], ['number-of-islands', 78], ['kth-largest-element', 70],
  ],
  swiggy: [
    ['two-sum', 80], ['lru-cache', 78], ['merge-intervals', 75], ['valid-parentheses', 72],
    ['number-of-islands', 70],
  ],
  zomato: [
    ['two-sum', 80], ['lru-cache', 78], ['merge-intervals', 75], ['valid-parentheses', 72],
  ],
  razorpay: [
    ['two-sum', 82], ['lru-cache', 80], ['valid-parentheses', 75], ['merge-intervals', 72],
    ['min-stack', 70],
  ],
  cred: [
    ['two-sum', 75], ['lru-cache', 72], ['valid-parentheses', 70], ['merge-intervals', 68],
  ],
  meesho: [
    ['two-sum', 75], ['valid-parentheses', 72], ['merge-intervals', 70],
  ],
  walmart: [
    ['two-sum', 78], ['merge-intervals', 75], ['valid-parentheses', 72], ['lru-cache', 70],
  ],
  infosys: [
    ['two-sum', 65], ['valid-parentheses', 62], ['merge-intervals', 60], ['reverse-integer', 70],
  ],
  tcs: [
    ['two-sum', 65], ['reverse-integer', 70], ['valid-parentheses', 60], ['palindrome-partitioning', 55],
  ],
  wipro: [
    ['two-sum', 60], ['reverse-integer', 65], ['valid-parentheses', 58],
  ],
  zoho: [
    ['two-sum', 70], ['valid-parentheses', 68], ['merge-intervals', 65], ['rotate-image', 65],
  ],
  // Finance tier
  'goldman-sachs': [
    ['two-sum', 88], ['merge-intervals', 85], ['valid-parentheses', 80], ['lru-cache', 78],
    ['kth-largest-element', 82], ['find-median-data-stream', 80], ['min-stack', 75],
    ['trapping-rain-water', 78],
  ],
  'de-shaw': [
    ['two-sum', 85], ['merge-intervals', 82], ['lru-cache', 80], ['kth-largest-element', 80],
    ['find-median-data-stream', 82], ['regular-expression-matching', 70],
  ],
  'tower-research': [
    ['two-sum', 82], ['merge-intervals', 80], ['lru-cache', 78], ['find-median-data-stream', 80],
    ['sliding-window-maximum', 75],
  ],
};

const { data: existingProblems } = await sb.from('PGcode_problems').select('id').not('method_name', 'is', null);
const validIds = new Set((existingProblems || []).map(p => p.id));

let total = 0, skipped = 0;
const rows = [];
for (const [slug, problems] of Object.entries(MAP)) {
  for (const [pid, freq] of problems) {
    if (!validIds.has(pid)) { skipped++; continue; }
    rows.push({ company_slug: slug, problem_id: pid, frequency_score: freq, role: 'SDE' });
    total++;
  }
}

if (rows.length > 0) {
  const { error } = await sb.from('PGcode_company_problems').upsert(rows, { onConflict: 'company_slug,problem_id,role' });
  if (error) {
    console.error('Upsert error:', error.message);
    process.exit(1);
  }
}

console.log(`Seeded ${total} company-problem links across ${Object.keys(MAP).length} companies.`);
if (skipped > 0) console.log(`Skipped ${skipped} (problem id not graded yet).`);
