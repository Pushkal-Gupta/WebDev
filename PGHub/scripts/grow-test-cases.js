#!/usr/bin/env node
// Grow test-case count to >= 50 for the 16 curated problems in src/content/problemContent.js.
// Uses the Python canonical solution from RICH_CONTENT, wraps with the shared driver
// (src/lib/driverCode.js — same harness Workspace uses), submits to Judge0 public CE
// to capture the expected output, and merges back into PGcode_problems.test_cases.
//
// Usage:
//   node scripts/grow-test-cases.js                    # all curated problems
//   node scripts/grow-test-cases.js --slug two-sum     # single problem
//   node scripts/grow-test-cases.js --slug two-sum --dry   # 3-case dry-run print
//   node scripts/grow-test-cases.js --target 60        # custom target

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { RICH_CONTENT } from '../src/content/problemContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(SUPA_URL, SVC);

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const onlySlug = arg('slug');
const isDry = !!arg('dry');
const TARGET = Number(arg('target') || 50);
const PAUSE_MS = Number(arg('pause') || 400);
const JUDGE0_URL = arg('judge0') || 'https://ce.judge0.com';
const PYTHON_LANG_ID = 71;

// ── per-problem input strategies ─────────────────────────────────────────────
const STRATEGIES = {
  'two-sum':                                   { kind: 'twoSum',         numsLen: [2, 12], numRange: [-100, 100], targetRange: [-100, 100] },
  'contains-duplicate':                        { kind: 'intArr',         numsLen: [1, 20], numRange: [-100, 100] },
  'valid-anagram':                             { kind: 'twoStr',         strLen: [0, 15] },
  'valid-palindrome':                          { kind: 'oneStr',         strLen: [0, 25] },
  'two-sum-ii-input-array-is-sorted':          { kind: 'sortedTwoSum',   numsLen: [2, 12], numRange: [-50, 100] },
  'max-subarray':                              { kind: 'intArr',         numsLen: [1, 15], numRange: [-30, 30] },
  'maximum-subarray':                          { kind: 'intArr',         numsLen: [1, 15], numRange: [-30, 30] },
  'valid-parentheses':                         { kind: 'brackets',       maxLen: 20 },
  'climbing-stairs':                           { kind: 'singleInt',      nRange: [1, 45], wideRange: [1, 80] },
  'reverse-linked-list':                       { kind: 'linkedList',     listLen: [0, 15], numRange: [-100, 100] },
  'binary-search':                             { kind: 'binarySearch',   numsLen: [0, 20], numRange: [-100, 100], targetRange: [-110, 110] },
  'binary-tree-level-order-traversal-ii':      { kind: 'tree',           treeSize: [0, 10] },
  'convert-sorted-array-to-binary-search-tree':{ kind: 'sortedDistinct', numsLen: [0, 15], numRange: [-50, 50] },
  'product-of-array-except-self':              { kind: 'intArr',         numsLen: [2, 12], numRange: [-10, 10] },
  'house-robber':                              { kind: 'intArr',         numsLen: [1, 15], numRange: [0, 100] },
  'best-time-to-buy-and-sell-stock':           { kind: 'intArr',         numsLen: [1, 15], numRange: [0, 100] },
  'coin-change':                               { kind: 'coinChange',     coinsCount: [1, 5], coinValues: [1, 50], amountRange: [0, 30] },
  'maximum-depth-of-binary-tree':              { kind: 'singleTree',     treeSize: [0, 12] },
  'invert-binary-tree':                        { kind: 'singleTree',     treeSize: [0, 12] },
  'same-tree':                                 { kind: 'twoTrees',       treeSize: [0, 10] },
  '3sum':                                      { kind: 'threeSum',       numsLen: [3, 12], numRange: [-30, 30] },
  'container-with-most-water':                 { kind: 'heights',        numsLen: [2, 15], numRange: [1, 50] },
  'longest-substring-without-repeating-characters': { kind: 'narrowStr', strLen: [0, 20], alpha: 'abcdefghij' },
  'group-anagrams':                            { kind: 'wordList',       listLen: [1, 8], wordLen: [1, 6], alpha: 'abcd' },
  'merge-two-sorted-lists':                    { kind: 'twoSortedLists', listLen: [0, 10], numRange: [-50, 50] },
  'jump-game':                                 { kind: 'intArr',         numsLen: [1, 12], numRange: [0, 5] },
  'spiral-matrix':                             { kind: 'matrix',         rows: [1, 5], cols: [1, 5], numRange: [-99, 99] },
  'merge-intervals':                           { kind: 'intervals',      intervalCount: [1, 8], rangeMax: 30 },
  'search-in-rotated-sorted-array':            { kind: 'rotatedSearch',  numsLen: [1, 20], numRange: [-100, 100] },
  'subsets':                                   { kind: 'intArr',         numsLen: [0, 8], numRange: [-10, 10] },
  'maximum-product-subarray':                  { kind: 'intArr',         numsLen: [1, 15], numRange: [-10, 10] },
  'longest-palindromic-substring':             { kind: 'narrowStr',      strLen: [1, 30], alpha: 'abc' },
  'linked-list-cycle':                         { kind: 'cycledList',     listLen: [0, 12], numRange: [-50, 50] },
  // Wave 2G + 2H
  'number-of-islands':                         { kind: 'matrix',         rows: [1, 6], cols: [1, 6], numRange: [0, 1], asChar: true },
  'clone-graph':                               { kind: 'cloneGraph',     numNodes: [0, 8] },
  'top-k-frequent-elements':                   { kind: 'topK',           numsLen: [1, 15], numRange: [-10, 10] },
  'kth-largest-element-in-an-array':           { kind: 'kthLargest',     numsLen: [1, 15], numRange: [-50, 50] },
  'combination-sum':                           { kind: 'combinationSum', candCount: [1, 6], candRange: [1, 8], targetRange: [1, 20] },
  'find-minimum-in-rotated-sorted-array':      { kind: 'rotatedMin',     numsLen: [1, 15], numRange: [-50, 50] },
  'longest-increasing-subsequence':            { kind: 'intArr',         numsLen: [1, 15], numRange: [-20, 20] },
  'word-search':                               { kind: 'wordSearch',     rows: [1, 4], cols: [1, 4], wordLen: [1, 5], alpha: 'abcd' },
  // Wave 2I
  'letter-combinations-of-a-phone-number':     { kind: 'digitsStr',      digitLen: [0, 4] },
  'word-break':                                { kind: 'wordBreak',      strLen: [1, 15], wordCount: [1, 5], wordLen: [1, 5], alpha: 'abc' },
  'course-schedule':                           { kind: 'courseSchedule', numCourses: [1, 6], edgeMaxRatio: 0.4 },
  'kth-smallest-element-in-a-bst':             { kind: 'bstKth',         treeSize: [1, 12] },
  // Wave 2J
  'unique-paths':                              { kind: 'twoInts',        range1: [1, 10], range2: [1, 10] },
  'longest-common-subsequence':                { kind: 'twoStrShort',    strLen: [0, 12], alpha: 'abc' },
  'partition-equal-subset-sum':                { kind: 'intArr',         numsLen: [1, 12], numRange: [1, 20] },
  'decode-ways':                               { kind: 'digitStr',       strLen: [1, 12] },
  // Wave 2K
  '3sum-closest':                              { kind: 'threeSum',       numsLen: [3, 12], numRange: [-30, 30] },
  'rotate-image':                              { kind: 'squareMatrix',   size: [1, 5], numRange: [-50, 50] },
  'set-matrix-zeroes':                         { kind: 'matrix',         rows: [1, 5], cols: [1, 5], numRange: [-3, 3] },
  'generate-parentheses':                      { kind: 'singleInt',      nRange: [0, 7], wideRange: [0, 8] },
  // Wave 2L
  'trapping-rain-water':                       { kind: 'heights',        numsLen: [0, 15], numRange: [0, 8] },
  'validate-binary-search-tree':               { kind: 'singleTree',     treeSize: [0, 10] },
  'minimum-window-substring':                  { kind: 'twoStrShort',    strLen: [1, 12], alpha: 'ABCabc' },
  'sort-colors':                               { kind: 'colorsArr',      numsLen: [0, 12] },
  // Wave 2M
  'word-ladder':                               { kind: 'wordLadder',     wordLen: 3, dictSize: [2, 8], alpha: 'abcd' },
  'palindrome-partitioning':                   { kind: 'narrowStr',      strLen: [0, 8], alpha: 'abc' },
  'longest-consecutive':                       { kind: 'intArr',         numsLen: [0, 12], numRange: [-15, 15] },
  'edit-distance':                             { kind: 'twoStrShort',    strLen: [0, 8], alpha: 'abc' },
  // Wave 2N
  'subarray-sum-equals-k':                     { kind: 'subarrSumK',     numsLen: [1, 15], numRange: [-5, 5], kRange: [-10, 10] },
  'daily-temperatures':                        { kind: 'intArr',         numsLen: [1, 15], numRange: [30, 100] },
  'k-closest-points-to-origin':                { kind: 'kClosest',       pointCount: [1, 8], coordRange: [-20, 20] },
  'find-the-duplicate-number':                 { kind: 'dupNumber',      numsLen: [2, 12] },
};

// ── RNG helpers ──────────────────────────────────────────────────────────────
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randArr = (n, lo, hi) => Array.from({ length: n }, () => rand(lo, hi));
const choice = (xs) => xs[rand(0, xs.length - 1)];

function randomIntArr(s) {
  const n = rand(s.numsLen[0], s.numsLen[1]);
  let a = randArr(n, s.numRange[0], s.numRange[1]);
  if (s.sorted) a.sort((x, y) => x - y);
  if (s.distinct) {
    const seen = new Set();
    a = a.filter(v => (seen.has(v) ? false : (seen.add(v), true)));
    if (s.sorted) a.sort((x, y) => x - y);
  }
  return a;
}

function randomString(s) {
  const n = rand(s.strLen[0], s.strLen[1]);
  // bias toward lowercase letters so anagrams/palindromes have a chance to hit
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const wide = alpha + alpha.toUpperCase() + '0123456789 .,!?-';
  const pool = Math.random() < 0.6 ? alpha : wide;
  let out = '';
  for (let i = 0; i < n; i++) out += pool[rand(0, pool.length - 1)];
  return out;
}

function randomBalancedOrInvalid(maxLen) {
  // 50% balanced, 50% random / corrupted — keeps validator honest.
  const pairs = [['(', ')'], ['[', ']'], ['{', '}']];
  const len = rand(0, maxLen);
  if (Math.random() < 0.5) {
    // build a random balanced string
    const stack = [];
    let s = '';
    for (let i = 0; i < len; i++) {
      const canClose = stack.length > 0;
      const mustClose = stack.length >= maxLen - i;
      if (canClose && (mustClose || Math.random() < 0.5)) {
        s += stack.pop();
      } else {
        const p = choice(pairs);
        s += p[0];
        stack.push(p[1]);
      }
    }
    while (stack.length) s += stack.pop();
    return s.slice(0, maxLen);
  } else {
    // random bracket soup (often invalid)
    const all = '()[]{}';
    let s = '';
    for (let i = 0; i < len; i++) s += all[rand(0, all.length - 1)];
    return s;
  }
}

function randomTreeLevelOrder(strategy) {
  const size = rand(strategy.treeSize[0], strategy.treeSize[1]);
  if (size === 0) return [];
  const out = [rand(-50, 50)];
  let nonNull = 1;
  for (let i = 1; i < size * 2; i++) {
    if (out.length >= size + 4) break;
    if (Math.random() < 0.7 && nonNull > 0) {
      out.push(rand(-50, 50));
      nonNull++;
    } else {
      out.push(null);
      nonNull--;
      if (nonNull <= 0) break;
    }
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}

// Generate a random binary tree as a level-order array with nulls for missing children.
// ~20% null probability — yields realistic mix of balanced/skewed trees.
function randomTree(size) {
  if (size <= 0) return [];
  // BFS-style: start with root, fill children left-to-right.
  const out = [rand(-50, 50)];
  let placed = 1;
  let cursor = 0; // pointer into existing non-null slots
  while (placed < size) {
    // Walk to next non-null parent slot.
    while (cursor < out.length && out[cursor] === null) cursor++;
    if (cursor >= out.length) break;
    // Add left then right child.
    for (let side = 0; side < 2 && placed < size; side++) {
      if (Math.random() < 0.2) {
        out.push(null);
      } else {
        out.push(rand(-50, 50));
        placed++;
      }
    }
    cursor++;
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}

function randomNarrowString(strLen, alpha) {
  const n = rand(strLen[0], strLen[1]);
  let out = '';
  for (let i = 0; i < n; i++) out += alpha[rand(0, alpha.length - 1)];
  return out;
}

function randomWordList(s) {
  const k = rand(s.listLen[0], s.listLen[1]);
  const words = [];
  for (let i = 0; i < k; i++) {
    const wlen = rand(s.wordLen[0], s.wordLen[1]);
    let w = '';
    for (let j = 0; j < wlen; j++) w += s.alpha[rand(0, s.alpha.length - 1)];
    words.push(w);
  }
  return words;
}

function randomMatrix(s) {
  const r = rand(s.rows[0], s.rows[1]);
  const c = rand(s.cols[0], s.cols[1]);
  const out = [];
  for (let i = 0; i < r; i++) {
    out.push(randArr(c, s.numRange[0], s.numRange[1]));
  }
  return out;
}

function randomIntervals(s) {
  const k = rand(s.intervalCount[0], s.intervalCount[1]);
  const out = [];
  for (let i = 0; i < k; i++) {
    const start = rand(0, s.rangeMax);
    const len = rand(0, 5);
    out.push([start, start + len]);
  }
  return out;
}

function randomSortedArr(listLen, numRange) {
  const n = rand(listLen[0], listLen[1]);
  const a = randArr(n, numRange[0], numRange[1]);
  a.sort((x, y) => x - y);
  return a;
}

function genCycledList(strategy) {
  const len = rand(strategy.listLen[0], strategy.listLen[1]);
  const values = Array.from({ length: len }, () => rand(strategy.numRange[0], strategy.numRange[1]));
  const pos = (len === 0 || Math.random() < 0.4) ? -1 : rand(0, len - 1);
  return [JSON.stringify(values), JSON.stringify(pos)];
}

function genRotatedSearch(strategy) {
  const len = rand(strategy.numsLen[0], strategy.numsLen[1]);
  if (len === 0) {
    return [JSON.stringify([]), JSON.stringify(rand(strategy.numRange[0], strategy.numRange[1]))];
  }
  const vals = [...new Set(Array.from({ length: len * 2 }, () => rand(strategy.numRange[0], strategy.numRange[1])))]
    .slice(0, len)
    .sort((a, b) => a - b);
  const k = rand(0, vals.length - 1);
  const rotated = vals.slice(k).concat(vals.slice(0, k));
  const target = (Math.random() < 0.5 && rotated.length > 0)
    ? rotated[rand(0, rotated.length - 1)]
    : rand(strategy.numRange[0], strategy.numRange[1]);
  return [JSON.stringify(rotated), JSON.stringify(target)];
}

// ── per-problem case-builder dispatch ────────────────────────────────────────
function generateCase(slug) {
  const s = STRATEGIES[slug];
  if (!s) return null;
  switch (s.kind) {
    case 'twoSum': {
      const nums = randomIntArr({ numsLen: s.numsLen, numRange: s.numRange });
      // 60% biased target so a real pair exists; 40% random.
      let target;
      if (nums.length >= 2 && Math.random() < 0.6) {
        const i = rand(0, nums.length - 1);
        let j = rand(0, nums.length - 1);
        if (j === i) j = (j + 1) % nums.length;
        target = nums[i] + nums[j];
      } else {
        target = rand(s.targetRange[0], s.targetRange[1]);
      }
      return [JSON.stringify(nums), String(target)];
    }
    case 'sortedTwoSum': {
      const nums = randomIntArr({ numsLen: s.numsLen, numRange: s.numRange, sorted: true });
      let target;
      if (nums.length >= 2 && Math.random() < 0.8) {
        // ensure a real pair so 1-indexed answer exists (1 ≤ i < j ≤ n)
        const i = rand(0, nums.length - 2);
        const j = rand(i + 1, nums.length - 1);
        target = nums[i] + nums[j];
      } else {
        target = rand(s.numRange[0] * 2, s.numRange[1] * 2);
      }
      return [JSON.stringify(nums), String(target)];
    }
    case 'binarySearch': {
      const nums = randomIntArr({ numsLen: s.numsLen, numRange: s.numRange, sorted: true, distinct: true });
      let target;
      if (nums.length > 0 && Math.random() < 0.5) {
        target = choice(nums);
      } else {
        target = rand(s.targetRange[0], s.targetRange[1]);
      }
      return [JSON.stringify(nums), String(target)];
    }
    case 'intArr': {
      const nums = randomIntArr({ numsLen: s.numsLen, numRange: s.numRange });
      return [JSON.stringify(nums)];
    }
    case 'sortedDistinct': {
      const nums = randomIntArr({ numsLen: s.numsLen, numRange: s.numRange, sorted: true, distinct: true });
      return [JSON.stringify(nums)];
    }
    case 'oneStr': {
      const s1 = randomString({ strLen: s.strLen });
      return [JSON.stringify(s1)];
    }
    case 'twoStr': {
      // 40% anagram pair, 60% random pair
      const s1 = randomString({ strLen: s.strLen });
      let s2;
      if (Math.random() < 0.4 && s1.length > 0) {
        s2 = s1.split('').sort(() => Math.random() - 0.5).join('');
      } else {
        s2 = randomString({ strLen: s.strLen });
      }
      return [JSON.stringify(s1), JSON.stringify(s2)];
    }
    case 'singleInt': {
      const range = s.wideRange || s.nRange;
      const n = rand(range[0], range[1]);
      return [String(n)];
    }
    case 'brackets': {
      const str = randomBalancedOrInvalid(s.maxLen);
      return [JSON.stringify(str)];
    }
    case 'linkedList': {
      const arr = randomIntArr({ numsLen: s.listLen, numRange: s.numRange });
      return [JSON.stringify(arr)];
    }
    case 'tree': {
      const arr = randomTreeLevelOrder(s);
      return [JSON.stringify(arr)];
    }
    case 'coinChange': {
      const k = rand(s.coinsCount[0], s.coinsCount[1]);
      const set = new Set();
      while (set.size < k) set.add(rand(s.coinValues[0], s.coinValues[1]));
      const coins = [...set].sort((a, b) => a - b);
      const amount = rand(s.amountRange[0], s.amountRange[1]);
      return [JSON.stringify(coins), String(amount)];
    }
    case 'singleTree': {
      const size = rand(s.treeSize[0], s.treeSize[1]);
      const arr = randomTree(size);
      return [JSON.stringify(arr)];
    }
    case 'twoTrees': {
      // 30% same, 30% similar (small mutation), 40% different.
      const sizeA = rand(s.treeSize[0], s.treeSize[1]);
      const a = randomTree(sizeA);
      let b;
      const r = Math.random();
      if (r < 0.3) {
        b = a.slice();
      } else if (r < 0.6 && a.length > 0) {
        b = a.slice();
        // tweak one slot (flip a value or null)
        const idx = rand(0, b.length - 1);
        if (b[idx] === null) b[idx] = rand(-50, 50);
        else if (Math.random() < 0.5) b[idx] = b[idx] + rand(1, 5);
        else b[idx] = null;
      } else {
        const sizeB = rand(s.treeSize[0], s.treeSize[1]);
        b = randomTree(sizeB);
      }
      return [JSON.stringify(a), JSON.stringify(b)];
    }
    case 'threeSum': {
      // include occasional duplicate-heavy arrays to test dedup logic
      const n = rand(s.numsLen[0], s.numsLen[1]);
      let nums;
      if (Math.random() < 0.35) {
        // small pool → many duplicates
        const poolSize = Math.max(2, Math.floor(n / 2));
        const pool = randArr(poolSize, s.numRange[0], s.numRange[1]);
        nums = Array.from({ length: n }, () => pool[rand(0, pool.length - 1)]);
      } else {
        nums = randArr(n, s.numRange[0], s.numRange[1]);
      }
      return [JSON.stringify(nums)];
    }
    case 'heights': {
      const n = rand(s.numsLen[0], s.numsLen[1]);
      const h = randArr(n, s.numRange[0], s.numRange[1]);
      return [JSON.stringify(h)];
    }
    case 'narrowStr': {
      const str = randomNarrowString(s.strLen, s.alpha);
      return [JSON.stringify(str)];
    }
    case 'wordList': {
      const words = randomWordList(s);
      return [JSON.stringify(words)];
    }
    case 'twoSortedLists': {
      const a = randomSortedArr(s.listLen, s.numRange);
      const b = randomSortedArr(s.listLen, s.numRange);
      return [JSON.stringify(a), JSON.stringify(b)];
    }
    case 'matrix': {
      const m = randomMatrix(s);
      return [JSON.stringify(m)];
    }
    case 'intervals': {
      const iv = randomIntervals(s);
      return [JSON.stringify(iv)];
    }
    case 'cycledList': {
      return genCycledList(s);
    }
    case 'rotatedSearch': {
      return genRotatedSearch(s);
    }
    case 'cloneGraph': {
      const n = rand(s.numNodes[0], s.numNodes[1]);
      if (n === 0) return [JSON.stringify([]), JSON.stringify(0)];
      // adjacency list with random edges (undirected — both sides)
      const adj = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.random() < 0.35) {
            adj[i].push(j + 1); // 1-indexed
            adj[j].push(i + 1);
          }
        }
      }
      const startVal = rand(1, n);
      return [JSON.stringify(adj), JSON.stringify(startVal)];
    }
    case 'topK': {
      const n = rand(s.numsLen[0], s.numsLen[1]);
      // Bias toward repeats so freq order is interesting.
      const pool = Math.max(2, Math.floor(n / 2));
      const vals = randArr(pool, s.numRange[0], s.numRange[1]);
      const nums = Array.from({ length: n }, () => vals[rand(0, vals.length - 1)]);
      const distinct = new Set(nums).size;
      const k = distinct === 0 ? 1 : rand(1, distinct);
      return [JSON.stringify(nums), JSON.stringify(k)];
    }
    case 'kthLargest': {
      const n = rand(s.numsLen[0], s.numsLen[1]);
      const nums = randArr(n, s.numRange[0], s.numRange[1]);
      const k = rand(1, Math.max(1, n));
      return [JSON.stringify(nums), JSON.stringify(k)];
    }
    case 'combinationSum': {
      const cn = rand(s.candCount[0], s.candCount[1]);
      const setVals = new Set();
      while (setVals.size < cn) setVals.add(rand(s.candRange[0], s.candRange[1]));
      const cands = [...setVals].sort((a, b) => a - b);
      const target = rand(s.targetRange[0], s.targetRange[1]);
      return [JSON.stringify(cands), JSON.stringify(target)];
    }
    case 'rotatedMin': {
      const n = rand(s.numsLen[0], s.numsLen[1]);
      const setVals = new Set();
      while (setVals.size < n) setVals.add(rand(s.numRange[0], s.numRange[1]));
      const sorted = [...setVals].sort((a, b) => a - b);
      const k = rand(0, sorted.length - 1);
      const rotated = sorted.slice(k).concat(sorted.slice(0, k));
      return [JSON.stringify(rotated)];
    }
    case 'wordSearch': {
      const rows = rand(s.rows[0], s.rows[1]);
      const cols = rand(s.cols[0], s.cols[1]);
      const board = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => s.alpha[rand(0, s.alpha.length - 1)])
      );
      const wlen = rand(s.wordLen[0], s.wordLen[1]);
      const word = Array.from({ length: wlen }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
      return [JSON.stringify(board), JSON.stringify(word)];
    }
    case 'digitsStr': {
      const dlen = rand(s.digitLen[0], s.digitLen[1]);
      const digits = Array.from({ length: dlen }, () => '23456789'[rand(0, 7)]).join('');
      return [JSON.stringify(digits)];
    }
    case 'wordBreak': {
      const slen = rand(s.strLen[0], s.strLen[1]);
      const str = Array.from({ length: slen }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
      const wc = rand(s.wordCount[0], s.wordCount[1]);
      const dict = [];
      const seen = new Set();
      for (let i = 0; i < wc; i++) {
        const wlen = rand(s.wordLen[0], s.wordLen[1]);
        const w = Array.from({ length: wlen }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
        if (!seen.has(w)) { seen.add(w); dict.push(w); }
      }
      return [JSON.stringify(str), JSON.stringify(dict)];
    }
    case 'courseSchedule': {
      const n = rand(s.numCourses[0], s.numCourses[1]);
      const prereqs = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j && Math.random() < s.edgeMaxRatio) prereqs.push([i, j]);
        }
      }
      return [JSON.stringify(n), JSON.stringify(prereqs)];
    }
    case 'colorsArr': {
      const n = rand(s.numsLen[0], s.numsLen[1]);
      const arr = Array.from({ length: n }, () => rand(0, 2));
      return [JSON.stringify(arr)];
    }
    case 'wordLadder': {
      const dn = rand(s.dictSize[0], s.dictSize[1]);
      const begin = Array.from({ length: s.wordLen }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
      const end = Array.from({ length: s.wordLen }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
      const dict = [end];
      while (dict.length < dn) {
        const w = Array.from({ length: s.wordLen }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
        if (!dict.includes(w)) dict.push(w);
      }
      return [JSON.stringify(begin), JSON.stringify(end), JSON.stringify(dict)];
    }
    case 'subarrSumK': {
      const n = rand(s.numsLen[0], s.numsLen[1]);
      const arr = randArr(n, s.numRange[0], s.numRange[1]);
      const k = rand(s.kRange[0], s.kRange[1]);
      return [JSON.stringify(arr), JSON.stringify(k)];
    }
    case 'kClosest': {
      const n = rand(s.pointCount[0], s.pointCount[1]);
      const pts = Array.from({ length: n }, () => [rand(s.coordRange[0], s.coordRange[1]), rand(s.coordRange[0], s.coordRange[1])]);
      const k = rand(1, Math.max(1, n));
      return [JSON.stringify(pts), JSON.stringify(k)];
    }
    case 'dupNumber': {
      // Per LC 287: nums has length n+1, values in [1, n], exactly one repeats
      const n = rand(s.numsLen[0], s.numsLen[1]);
      const arr = Array.from({ length: n }, (_, i) => i + 1);
      const dupIndex = rand(0, n - 1);
      arr.push(arr[dupIndex]);
      // shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = rand(0, i);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return [JSON.stringify(arr)];
    }
    case 'squareMatrix': {
      const n = rand(s.size[0], s.size[1]);
      const m = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => rand(s.numRange[0], s.numRange[1]))
      );
      return [JSON.stringify(m)];
    }
    case 'twoInts': {
      return [JSON.stringify(rand(s.range1[0], s.range1[1])), JSON.stringify(rand(s.range2[0], s.range2[1]))];
    }
    case 'twoStrShort': {
      const a = Array.from({ length: rand(s.strLen[0], s.strLen[1]) }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
      const b = Array.from({ length: rand(s.strLen[0], s.strLen[1]) }, () => s.alpha[rand(0, s.alpha.length - 1)]).join('');
      return [JSON.stringify(a), JSON.stringify(b)];
    }
    case 'digitStr': {
      const len = rand(s.strLen[0], s.strLen[1]);
      // Mix valid (1-9) and 0 sometimes, since 0 alone is invalid; this is good test coverage.
      const str = Array.from({ length: len }, () => String(rand(0, 9))).join('');
      return [JSON.stringify(str)];
    }
    case 'bstKth': {
      // Random BST: insert random distinct values
      const n = rand(s.treeSize[0], s.treeSize[1]);
      const vals = new Set();
      while (vals.size < n) vals.add(rand(-30, 30));
      const arr = [...vals];
      // Build BST and emit level-order with nulls
      function build(values) {
        const root = { val: values[0], left: null, right: null };
        for (let i = 1; i < values.length; i++) {
          let node = root;
          while (true) {
            if (values[i] < node.val) {
              if (!node.left) { node.left = { val: values[i], left: null, right: null }; break; }
              node = node.left;
            } else {
              if (!node.right) { node.right = { val: values[i], left: null, right: null }; break; }
              node = node.right;
            }
          }
        }
        // level-order with nulls
        const out = [];
        const q = [root];
        while (q.length) {
          const x = q.shift();
          if (x === null) { out.push(null); continue; }
          out.push(x.val);
          if (x.left || x.right) {
            q.push(x.left || null);
            q.push(x.right || null);
          }
        }
        while (out.length && out[out.length - 1] === null) out.pop();
        return out;
      }
      const tree = build(arr);
      const k = rand(1, arr.length);
      return [JSON.stringify(tree), JSON.stringify(k)];
    }
    default:
      return null;
  }
}

// ── Judge0 client ────────────────────────────────────────────────────────────
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function judgeRun(sourceCode, stdin) {
  const url = `${JUDGE0_URL.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language_id: PYTHON_LANG_ID,
          source_code: sourceCode,
          stdin,
          cpu_time_limit: 5,
          wall_time_limit: 8,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${body.slice(0, 100)}`);
      }
      const data = await res.json();
      const status = (data?.status?.description || '').toLowerCase();
      const ok = status === 'accepted' || status === '';
      if (!ok) {
        const detail = (data.stderr || data.compile_output || data.message || status).toString().slice(0, 120);
        throw new Error(`${data?.status?.description || 'error'}: ${detail}`);
      }
      return (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
    } catch (e) {
      lastErr = e;
      await sleep(500 * attempt * attempt);
    }
  }
  throw lastErr;
}

// ── per-problem grow loop ───────────────────────────────────────────────────
async function growForProblem(problem, opts = {}) {
  const { id, method_name, params, return_type, test_cases } = problem;
  const rich = RICH_CONTENT[id];
  const py = rich?.solutions?.python?.code;
  if (!py) {
    return { id, before: (test_cases || []).length, after: (test_cases || []).length, added: 0, dedupd: 0, skipped: 'no RICH_CONTENT python solution' };
  }
  const strat = STRATEGIES[id];
  if (!strat) {
    return { id, before: (test_cases || []).length, after: (test_cases || []).length, added: 0, dedupd: 0, skipped: 'no strategy registered' };
  }

  const existing = Array.isArray(test_cases) ? test_cases : [];
  const beforeCount = existing.length;
  if (!opts.dryCount && beforeCount >= TARGET) {
    return { id, before: beforeCount, after: beforeCount, added: 0, dedupd: 0, skipped: `already >= ${TARGET}` };
  }

  // Wrap user solution with the same driver Workspace uses, then dispatch to Judge0.
  const wrapped = wrapWithDriver(py, 'python', method_name, params, return_type);

  const seen = new Set(existing.map(tc => JSON.stringify(tc.inputs)));
  const newCases = [];
  let dedupd = 0;
  let droppedVerify = 0;
  let consecutiveFails = 0;
  const need = opts.dryCount || (TARGET - beforeCount);
  const maxAttempts = need * 6 + 12;

  for (let attempt = 0; attempt < maxAttempts && newCases.length < need; attempt++) {
    const inputs = generateCase(id);
    if (!inputs) break;
    const key = JSON.stringify(inputs);
    if (seen.has(key)) { dedupd++; continue; }
    seen.add(key);

    const stdin = buildStdin(inputs) + '\n';
    try {
      const expected = await judgeRun(wrapped, stdin);
      if (expected === '' || expected.length > 4000) {
        consecutiveFails++;
        if (consecutiveFails > 10) break;
        continue;
      }
      // VERIFY GATE — re-run the canonical solution against the same inputs and
      // confirm we get a byte-identical result. Drops any case where the solution
      // is non-deterministic, flaky, or otherwise can't be trusted.
      await sleep(PAUSE_MS);
      let verifyOutput;
      try {
        verifyOutput = await judgeRun(wrapped, stdin);
      } catch (verr) {
        droppedVerify++;
        if (opts.verbose) console.log(`    drop verify-error inputs=${JSON.stringify(inputs)} (${verr.message.slice(0, 80)})`);
        consecutiveFails++;
        if (consecutiveFails > 10) break;
        continue;
      }
      if (verifyOutput !== expected) {
        droppedVerify++;
        if (opts.verbose) console.log(`    drop mismatch inputs=${JSON.stringify(inputs)} expected=${expected.slice(0, 40)} verify=${verifyOutput.slice(0, 40)}`);
        consecutiveFails++;
        if (consecutiveFails > 10) break;
        continue;
      }
      consecutiveFails = 0;
      newCases.push({ inputs, expected });
      if (opts.onCase) opts.onCase({ inputs, expected });
    } catch (e) {
      consecutiveFails++;
      if (opts.verbose) console.log(`    skip (${e.message.slice(0, 80)})`);
      if (consecutiveFails > 8) break;
    }
    await sleep(PAUSE_MS);
  }

  const merged = [...existing, ...newCases];
  if (!opts.dryCount && newCases.length > 0) {
    const { error } = await sb.from('PGcode_problems').update({ test_cases: merged }).eq('id', id);
    if (error) {
      return { id, before: beforeCount, after: beforeCount, added: 0, dedupd, droppedVerify, skipped: `db write failed: ${error.message}` };
    }
  }
  return { id, before: beforeCount, after: merged.length, added: newCases.length, dedupd, droppedVerify };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const slugs = onlySlug ? [onlySlug] : Object.keys(STRATEGIES).filter(s => s in RICH_CONTENT || s === onlySlug);
  // De-dup against RICH_CONTENT — only the 16 curated ones.
  const curatedSlugs = onlySlug ? [onlySlug] : slugs.filter(s => RICH_CONTENT[s]);

  const { data, error } = await sb
    .from('PGcode_problems')
    .select('id, method_name, params, return_type, test_cases')
    .in('id', curatedSlugs);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) {
    console.error(`No matching problems for ${curatedSlugs.join(', ')}`);
    process.exit(1);
  }
  const byId = Object.fromEntries(data.map(r => [r.id, r]));

  if (isDry) {
    const slug = onlySlug || curatedSlugs[0];
    const problem = byId[slug];
    if (!problem) { console.error(`DRY RUN: ${slug} not in DB`); process.exit(1); }
    console.log(`DRY RUN: ${slug} — generating 3 sample cases (no DB write)\n`);
    const result = await growForProblem(problem, {
      dryCount: 3,
      verbose: true,
      onCase: ({ inputs, expected }) => {
        console.log(`  inputs=${JSON.stringify(inputs)}`);
        console.log(`  expected=${expected}`);
        console.log('');
      },
    });
    console.log(`DRY RUN done: ${result.added} cases generated, ${result.dedupd} deduped`);
    return;
  }

  // Full run — process in registration order so output is stable.
  const ordered = curatedSlugs.map(s => byId[s]).filter(Boolean);
  console.log(`Growing ${ordered.length} problem(s) to ${TARGET}+ cases each.\n`);
  const results = [];
  for (const p of ordered) {
    process.stdout.write(`${p.id.padEnd(48)} `);
    const r = await growForProblem(p);
    results.push(r);
    if (r.skipped) {
      console.log(`SKIP (${r.skipped})`);
    } else {
      console.log(`${String(r.before).padStart(3)} -> ${String(r.after).padStart(3)}  (+${r.added})${r.dedupd ? ` [${r.dedupd} dedup]` : ''}`);
    }
  }

  const totalAdded = results.reduce((s, r) => s + (r.added || 0), 0);
  const skipped = results.filter(r => r.skipped);
  console.log(`\nTOTAL: ${ordered.length} problems, ${totalAdded} new cases added`);
  if (skipped.length) {
    console.log(`Skipped: ${skipped.length}`);
    for (const r of skipped) console.log(`  ${r.id}: ${r.skipped}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
