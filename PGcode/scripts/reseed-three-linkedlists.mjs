import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- Helpers: reverse / middle on plain arrays ----------

function reverseArr(values) {
  return values.slice().reverse();
}

function middleArr(values) {
  if (!values.length) return [];
  const mid = Math.floor(values.length / 2);
  return values.slice(mid);
}

// ---------- Cases ----------

// linked-list-cycle: (values, pos) -> bool
const cycleInputs = [
  { values: [3, 2, 0, -4], pos: 1, expected: true },
  { values: [1, 2], pos: 0, expected: true },
  { values: [1], pos: -1, expected: false },
  { values: [], pos: -1, expected: false },
  { values: [1, 2, 3, 4, 5], pos: 2, expected: true },
  { values: [1, 2, 3, 4, 5], pos: -1, expected: false },
  { values: [1, 2, 3], pos: 0, expected: true },
  { values: [1, 2, 3], pos: 2, expected: true },
  { values: [1], pos: 0, expected: true },
  { values: [-1, -2, -3, -4], pos: 1, expected: true },
  { values: [10, 20, 30, 40, 50], pos: 3, expected: true },
  { values: [10, 20, 30, 40, 50], pos: -1, expected: false },
  { values: [0, 0, 0, 0], pos: 0, expected: true },
  { values: [7, 14, 21, 28, 35, 42], pos: 4, expected: true },
  { values: [7, 14, 21, 28, 35, 42], pos: -1, expected: false },
  { values: [100], pos: -1, expected: false },
  { values: [1, 2], pos: 1, expected: true },
  { values: [1, 2], pos: -1, expected: false },
  { values: [5, 4, 3, 2, 1], pos: 0, expected: true },
  { values: [5, 4, 3, 2, 1], pos: -1, expected: false },
  { values: [9, 8, 7, 6, 5, 4, 3, 2, 1], pos: 5, expected: true },
  { values: [-5, -10, -15, -20], pos: 2, expected: true },
  { values: [1, 1, 1, 1, 1], pos: -1, expected: false },
  { values: [1, 1, 1, 1, 1], pos: 4, expected: true },
  { values: [2, 4, 6, 8, 10, 12], pos: -1, expected: false },
];

// reverse-linked-list: values -> reversed list
const reverseInputs = [
  [],
  [1],
  [1, 2],
  [1, 2, 3],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [-1, -2, -3],
  [0, 0, 0, 0],
  [10],
  [10, 20],
  [10, 20, 30, 40, 50, 60, 70],
  [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
  [100, 200, 300],
  [7, 14, 21, 28, 35],
  [9],
  [9, 8],
  [9, 8, 7, 6, 5, 4, 3, 2, 1],
  [1, 1, 1],
  [-100],
  [42, 17, 8, 99, 23, 56, 11],
  [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
  [-10, 10, -20, 20, -30, 30],
  [1000, 2000, 3000, 4000],
  [0],
  [-1, 1, -1, 1, -1, 1],
];

// middle-of-the-linked-list: values -> middle-onwards
const middleInputs = [
  [1, 2, 3, 4, 5],
  [1, 2, 3, 4, 5, 6],
  [1],
  [1, 2],
  [1, 2, 3],
  [1, 2, 3, 4],
  [10, 20, 30, 40, 50, 60, 70],
  [10, 20, 30, 40, 50, 60, 70, 80],
  [-1, -2, -3, -4, -5],
  [-1, -2, -3, -4, -5, -6],
  [0, 0, 0, 0, 0],
  [42],
  [42, 17],
  [42, 17, 8],
  [42, 17, 8, 99],
  [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
  [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8],
  [100, 200, 300, 400, 500, 600, 700, 800, 900],
  [5, 4, 3, 2, 1],
  [9, 8, 7, 6, 5, 4, 3, 2, 1],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  [-100, 100],
  [7, 14, 21],
  [1, 1, 1, 1, 1, 1, 1],
  [2, 4, 6, 8, 10, 12, 14, 16],
];

// ---------- Build test_cases ----------

function buildCycleCases() {
  return cycleInputs.map(({ values, pos, expected }, i) => ({
    inputs: [JSON.stringify(values), String(pos)],
    expected: expected ? 'True' : 'False',
    sample: i < 3,
  }));
}

function buildReverseCases() {
  return reverseInputs.map((values, i) => ({
    inputs: [JSON.stringify(values)],
    expected: JSON.stringify(reverseArr(values)),
    sample: i < 3,
  }));
}

function buildMiddleCases() {
  return middleInputs.map((values, i) => ({
    inputs: [JSON.stringify(values)],
    expected: JSON.stringify(middleArr(values)),
    sample: i < 3,
  }));
}

// ---------- Canonical Python solutions ----------

const PY_CYCLE = `class Solution:
    def hasCycle(self, head):
        s, f = head, head
        while f and f.next:
            s = s.next; f = f.next.next
            if s is f: return True
        return False
`;

const PY_REVERSE = `class Solution:
    def reverseList(self, head):
        prev = None; cur = head
        while cur:
            nxt = cur.next; cur.next = prev; prev = cur; cur = nxt
        return prev
`;

const PY_MIDDLE = `class Solution:
    def middleNode(self, head):
        s, f = head, head
        while f and f.next:
            s = s.next; f = f.next.next
        return s
`;

// ---------- Apply ----------

async function reseed(slug, { method_name, params, return_type }, test_cases, python) {
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
    .update({ test_cases, solutions, method_name, params, return_type })
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases.length };
}

const cycleCases = buildCycleCases();
const reverseCases = buildReverseCases();
const middleCases = buildMiddleCases();

console.log(`linked-list-cycle: ${cycleCases.length} cases`);
for (const tc of cycleCases.slice(0, 3)) console.log(`  (${tc.inputs[0]}, ${tc.inputs[1]}) -> ${tc.expected}`);
console.log(`reverse-linked-list: ${reverseCases.length} cases`);
for (const tc of reverseCases.slice(0, 3)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);
console.log(`middle-of-the-linked-list: ${middleCases.length} cases`);
for (const tc of middleCases.slice(0, 3)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);

const r1 = await reseed(
  'linked-list-cycle',
  {
    method_name: 'hasCycle',
    params: [
      { name: 'values', type: 'List[int]' },
      { name: 'pos', type: 'int' },
    ],
    return_type: 'bool',
  },
  cycleCases,
  PY_CYCLE,
);

const r2 = await reseed(
  'reverse-linked-list',
  {
    method_name: 'reverseList',
    params: [{ name: 'head', type: 'Optional[ListNode]' }],
    return_type: 'Optional[ListNode]',
  },
  reverseCases,
  PY_REVERSE,
);

const r3 = await reseed(
  'middle-of-the-linked-list',
  {
    method_name: 'middleNode',
    params: [{ name: 'head', type: 'Optional[ListNode]' }],
    return_type: 'Optional[ListNode]',
  },
  middleCases,
  PY_MIDDLE,
);

console.log('\n--- Results ---');
for (const r of [r1, r2, r3]) {
  if (!r) continue;
  console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
}
