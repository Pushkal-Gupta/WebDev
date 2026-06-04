import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- Reference implementations ----------

function lengthOfLastWord(s) {
  const parts = s.split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1].length : 0;
}

function strStr(haystack, needle) {
  if (needle === '') return 0;
  return haystack.indexOf(needle);
}

function reverseWords(s) {
  return s.split(/\s+/).filter(Boolean).reverse().join(' ');
}

function reverseWordsIII(s) {
  return s.split(' ').map(w => w.split('').reverse().join('')).join(' ');
}

// ---------- Input → quoted JSON-string literal ----------
// Driver receives `["\"hello\""]` style → Python parses as the string "hello"
function quoteStr(s) {
  return JSON.stringify(s);
}

// ---------- Cases ----------

// 1. length-of-last-word
const lastWordInputs = [
  'Hello World',
  '   fly me   to   the moon  ',
  'luffy is still joyboy',
  'a',
  'day',
  'hello',
  'hello ',
  'hello  ',
  '  hello',
  '  hello  ',
  'one two three four',
  'Today is a nice day',
  'The quick brown fox',
  'jumps over the lazy dog',
  'a b c d e f',
  'word',
  'multiple   spaces   here',
  'trailing space   ',
  '   leading space',
  '   both sides   ',
  'singleword',
  'two words',
  'I love coding',
  'last',
  'PGcode rocks',
];

// 2. find-the-index-of-the-first-occurrence-in-a-string
const strStrInputs = [
  ['sadbutsad', 'sad'],
  ['leetcode', 'leeto'],
  ['hello', 'll'],
  ['aaaaa', 'bba'],
  ['abc', ''],
  ['', ''],
  ['mississippi', 'issip'],
  ['mississippi', 'issipi'],
  ['abcdef', 'def'],
  ['abcdef', 'abc'],
  ['abcdef', 'cd'],
  ['abcdef', 'xyz'],
  ['a', 'a'],
  ['a', 'b'],
  ['ab', 'b'],
  ['abab', 'ab'],
  ['abababab', 'baba'],
  ['hello world', 'world'],
  ['hello world', 'hello'],
  ['hello world', 'o w'],
  ['programming', 'gram'],
  ['programming', 'ming'],
  ['programming', 'prog'],
  ['aaaaaaab', 'aab'],
  ['mississippi', 'pi'],
];

// 3. reverse-words-in-a-string
const reverseInputs = [
  'the sky is blue',
  '  hello world  ',
  'a good   example',
  '  Bob    Loves  Alice   ',
  'Alice does not even like bob',
  'single',
  '  single  ',
  'a',
  ' a ',
  'a b',
  'a b c',
  'one two three',
  'I love coding very much',
  '   one   two   ',
  'multiple    spaces',
  'PGcode is great',
  'trailing space  ',
  '   leading space',
  'no  extra  spaces',
  'a b c d e',
  'reverse these words',
  'Hello World',
  '   ',
  ' word ',
  'an apple a day',
];

// 4. reverse-words-in-a-string-iii
const reverseIIIInputs = [
  "Let's take LeetCode contest",
  'God Ding',
  'hello',
  'a b c',
  'abc',
  'racecar',
  'level up',
  'noon noon',
  'a',
  'ab cd',
  'one two three',
  'four five six',
  'mom dad',
  'civic radar',
  'apple banana cherry',
  'I love coding',
  'PGcode rocks',
  'reverse each word',
  'palindrome words like noon',
  'two words',
  'single',
  'hello world foo bar',
  'abcd efgh',
  'short and sweet',
  'the quick brown fox',
];

// ---------- Build test_cases ----------

function buildLastWordCases() {
  return lastWordInputs.map((s, i) => ({
    inputs: [quoteStr(s)],
    expected: String(lengthOfLastWord(s)),
    sample: i < 3,
  }));
}

function buildStrStrCases() {
  return strStrInputs.map(([h, n], i) => ({
    inputs: [quoteStr(h), quoteStr(n)],
    expected: String(strStr(h, n)),
    sample: i < 3,
  }));
}

function buildReverseCases() {
  return reverseInputs.map((s, i) => ({
    inputs: [quoteStr(s)],
    expected: reverseWords(s),
    sample: i < 3,
  }));
}

function buildReverseIIICases() {
  return reverseIIIInputs.map((s, i) => ({
    inputs: [quoteStr(s)],
    expected: reverseWordsIII(s),
    sample: i < 3,
  }));
}

// ---------- Canonical Python solutions ----------

const PY_LAST_WORD = `class Solution:
    def lengthOfLastWord(self, s: str) -> int:
        parts = s.split()
        return len(parts[-1]) if parts else 0
`;

const PY_STR_STR = `class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        return haystack.find(needle)
`;

const PY_REVERSE = `class Solution:
    def reverseWords(self, s: str) -> str:
        return ' '.join(s.split()[::-1])
`;

const PY_REVERSE_III = `class Solution:
    def reverseWords(self, s: str) -> str:
        return ' '.join(w[::-1] for w in s.split())
`;

// ---------- Apply ----------

async function reseed(slug, test_cases, python) {
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
    .update({ test_cases, solutions })
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases.length };
}

const lastWordCases = buildLastWordCases();
const strStrCases = buildStrStrCases();
const reverseCases = buildReverseCases();
const reverseIIICases = buildReverseIIICases();

console.log(`length-of-last-word: ${lastWordCases.length} cases`);
for (const tc of lastWordCases.slice(0, 3)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);
console.log(`find-the-index-of-the-first-occurrence-in-a-string: ${strStrCases.length} cases`);
for (const tc of strStrCases.slice(0, 3)) console.log(`  ${tc.inputs[0]}, ${tc.inputs[1]} -> ${tc.expected}`);
console.log(`reverse-words-in-a-string: ${reverseCases.length} cases`);
for (const tc of reverseCases.slice(0, 3)) console.log(`  ${tc.inputs[0]} -> "${tc.expected}"`);
console.log(`reverse-words-in-a-string-iii: ${reverseIIICases.length} cases`);
for (const tc of reverseIIICases.slice(0, 3)) console.log(`  ${tc.inputs[0]} -> "${tc.expected}"`);

const r1 = await reseed('length-of-last-word', lastWordCases, PY_LAST_WORD);
const r2 = await reseed('find-the-index-of-the-first-occurrence-in-a-string', strStrCases, PY_STR_STR);
const r3 = await reseed('reverse-words-in-a-string', reverseCases, PY_REVERSE);
const r4 = await reseed('reverse-words-in-a-string-iii', reverseIIICases, PY_REVERSE_III);

console.log('\n--- Results ---');
for (const r of [r1, r2, r3, r4]) {
  if (!r) continue;
  console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
}
