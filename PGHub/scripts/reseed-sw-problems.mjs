import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- Reference implementations (JS mirrors of Python solutions) ----------

function characterReplacement(s, k) {
  const c = new Map();
  let l = 0, best = 0, mx = 0;
  for (let r = 0; r < s.length; r++) {
    const ch = s[r];
    c.set(ch, (c.get(ch) || 0) + 1);
    if (c.get(ch) > mx) mx = c.get(ch);
    while (r - l + 1 - mx > k) {
      c.set(s[l], c.get(s[l]) - 1);
      l++;
    }
    if (r - l + 1 > best) best = r - l + 1;
  }
  return best;
}

function minWindow(s, t) {
  if (!t || t.length > s.length) return '';
  const need = new Map();
  for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
  let missing = t.length;
  let l = 0, start = 0, end = 0;
  for (let r = 1; r <= s.length; r++) {
    const ch = s[r - 1];
    if ((need.get(ch) || 0) > 0) missing--;
    need.set(ch, (need.get(ch) || 0) - 1);
    if (missing === 0) {
      while ((need.get(s[l]) || 0) < 0) {
        need.set(s[l], need.get(s[l]) + 1);
        l++;
      }
      if (end === 0 || r - l < end - start) {
        start = l;
        end = r;
      }
      need.set(s[l], need.get(s[l]) + 1);
      missing++;
      l++;
    }
  }
  return s.slice(start, end);
}

// ---------- Test inputs ----------

// longest-repeating-character-replacement: 25 cases
const lrcrInputs = [
  ['ABAB', 2],
  ['AABABBA', 1],
  ['A', 0],
  ['A', 1],
  ['AB', 0],
  ['AB', 1],
  ['AAAA', 2],
  ['ABCDE', 1],
  ['ABCDE', 4],
  ['AABBCC', 2],
  ['AAABBB', 2],
  ['AAABBB', 3],
  ['ABBB', 2],
  ['ABBBA', 1],
  ['BAAAB', 2],
  ['ABABABAB', 3],
  ['ABCABCABC', 2],
  ['ZZZZZZZZZZ', 0],
  ['XYZXYZXYZX', 5],
  ['KRSCDCSONAJNHLBMDQGIFCPEKPOHQIHLTDIQGEKLRLCQNBOHNDQGHJPNDQPERNFSSSRDEQLFPCCCARFMDLHADJADAGNNSBNCJQOF', 4],
  ['AABBCCDDAA', 3],
  ['HHHHGGGG', 1],
  ['MNOPQRST', 7],
  ['ABABABABCABAB', 2],
  ['BABABA', 0],
];

// minimum-window-substring: 25 cases
const mwsInputs = [
  ['ADOBECODEBANC', 'ABC'],
  ['a', 'a'],
  ['a', 'aa'],
  ['ab', 'b'],
  ['ab', 'a'],
  ['ab', 'ab'],
  ['ab', 'ba'],
  ['aa', 'aa'],
  ['cabwefgewcwaefgcf', 'cae'],
  ['this is a test string', 'tist'],
  ['ADOBECODEBANCXYZ', 'ABC'],
  ['XYZADOBECODEBANC', 'ABC'],
  ['aabbcc', 'abc'],
  ['aaaabbbbcccc', 'abc'],
  ['abcdef', 'fa'],
  ['abcdef', 'fed'],
  ['xxxxAxxxxBxxxxC', 'ABC'],
  ['ABABABAB', 'AAB'],
  ['a', 'b'],
  ['', 'a'],
  ['acbbaca', 'aba'],
  ['bbaa', 'aba'],
  ['aabdec', 'abc'],
  ['ZZAZZBZZCZZ', 'ABC'],
  ['cabwefgewcwaefcf', 'cae'],
];

// ---------- Build test_cases ----------

function quoteStr(s) {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function buildLrcrCases() {
  return lrcrInputs.map(([s, k], i) => {
    const out = characterReplacement(s, k);
    return {
      inputs: [quoteStr(s), String(k)],
      expected: String(out),
      sample: i < 3,
    };
  });
}

function buildMwsCases() {
  return mwsInputs.map(([s, t], i) => {
    const out = minWindow(s, t);
    return {
      inputs: [quoteStr(s), quoteStr(t)],
      expected: quoteStr(out),
      sample: i < 3,
    };
  });
}

// ---------- Canonical Python solutions ----------

const PY_LRCR = `class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        from collections import Counter
        c = Counter()
        l = 0
        best = 0
        mx = 0
        for r, ch in enumerate(s):
            c[ch] += 1
            if c[ch] > mx:
                mx = c[ch]
            while r - l + 1 - mx > k:
                c[s[l]] -= 1
                l += 1
            if r - l + 1 > best:
                best = r - l + 1
        return best
`;

const PY_MWS = `class Solution:
    def minWindow(self, s: str, t: str) -> str:
        from collections import Counter
        if not t or len(t) > len(s):
            return ""
        need = Counter(t)
        missing = len(t)
        l = 0
        start, end = 0, 0
        for r, ch in enumerate(s, 1):
            if need[ch] > 0:
                missing -= 1
            need[ch] -= 1
            if missing == 0:
                while need[s[l]] < 0:
                    need[s[l]] += 1
                    l += 1
                if end == 0 or r - l < end - start:
                    start, end = l, r
                need[s[l]] += 1
                missing += 1
                l += 1
        return s[start:end]
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

const lrcrCases = buildLrcrCases();
const mwsCases = buildMwsCases();

console.log(`longest-repeating-character-replacement: ${lrcrCases.length} cases`);
for (const tc of lrcrCases.slice(0, 3)) console.log(`  ${tc.inputs.join(', ')} -> ${tc.expected}`);
console.log(`minimum-window-substring: ${mwsCases.length} cases`);
for (const tc of mwsCases.slice(0, 3)) console.log(`  ${tc.inputs.join(', ')} -> ${tc.expected}`);

const r1 = await reseed('longest-repeating-character-replacement', lrcrCases, PY_LRCR);
const r2 = await reseed('minimum-window-substring', mwsCases, PY_MWS);

console.log('\n--- Results ---');
for (const r of [r1, r2]) {
  if (!r) continue;
  console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
}
