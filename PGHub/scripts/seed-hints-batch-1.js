#!/usr/bin/env node
// Hydrate `hints` (3 graduated prose hints) for top-500 problems (roadmap_set 100/200/300)
// that currently have zero hints. Idempotent: skips any row that already has >= 3 hints.

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

// Topic-keyed 3-tier hint templates. Each tier escalates from broad orientation
// to algorithmic shape to optimality/complexity.
const TEMPLATES = {
  arrays: [
    'Sketch what a brute force would look like first — usually a nested scan over the array. What is repeated work that you could skip?',
    'Many array problems collapse to one pass plus a hash map or prefix-sum array: store something useful about elements you have already seen so a later element can finish the answer in O(1).',
    'Aim for O(n) time and O(n) extra space; verify your invariant holds at every index before submitting.',
  ],
  'two-pointers': [
    'Picture two indices walking the array. From which ends should they start, and what condition would let you advance one of them?',
    'If the array is sorted (or you can sort it), opposite-end pointers let you decide which side to move based on whether the current pair is too small or too large.',
    'The pointers together visit each element at most once, so the loop is O(n); add sorting and the total becomes O(n log n) time, O(1) extra space.',
  ],
  'sliding-window': [
    'Think of a window [l, r] over the array or string. What does it mean for the window to be valid, and how does adding the next character change that?',
    'Expand r to include new elements; whenever the window breaks the constraint, advance l until it is valid again. Track the best answer at each step.',
    'Each index enters and leaves the window once, so the whole scan is O(n). Use a hash map or counter to update window state in O(1).',
  ],
  strings: [
    'Strings are arrays of characters — start by asking whether a single left-to-right pass with a counter or hash map could be enough.',
    'For matching, anagram, or palindrome problems, compare two strings via frequency arrays of fixed size 26 (or 128) rather than sorting.',
    'Most string solutions land at O(n) time with O(1) or O(k) space where k is the alphabet size; anything slower is usually doing extra work.',
  ],
  hashing: [
    'For each element, what fact about earlier elements would let you decide the answer immediately?',
    'Store that fact in a hash map keyed by value (or by some derived signature) so you can look it up in O(1).',
    'One pass through the input, O(n) time, O(n) extra space — verify nothing forces you to scan twice.',
  ],
  stack: [
    'When the answer for an index depends on the nearest earlier element with some property, a stack of unresolved indices is usually the right tool.',
    'Push the current index; before pushing, pop everything that cannot beat it on the stack — that pop is when you finalize an earlier answer (the monotonic-stack pattern).',
    'Each index is pushed and popped at most once, giving O(n) amortized time and O(n) space for the stack.',
  ],
  queue: [
    'Sliding-window extremes and level-order problems both want a queue that exposes a running aggregate of the current window.',
    'A monotonic deque keeps useful candidates only: pop from the back anything that the new element dominates, push the new index, and the front is your current answer.',
    'Each index enters and leaves the deque at most once, so the total work is O(n) with O(k) space where k is the window size.',
  ],
  heap: [
    'When you need the k smallest or k largest items, or the next event in a schedule, a heap delivers that minimum or maximum in O(log n) per update.',
    'For top-k problems, keep a heap of size k and push/pop as you scan — the heap stays small even when the input is huge.',
    'Total cost is O(n log k); the alternative quickselect approach is O(n) average but harder to implement correctly.',
  ],
  binarySearch: [
    'Identify the monotonic predicate: as some parameter increases, the answer to "is this enough?" flips from false to true exactly once.',
    'Binary search the parameter space (often answer values, not indices). At each midpoint run an O(n) feasibility check.',
    'Total time is O(n log V) where V is the range of the parameter — much better than scanning every possible answer.',
  ],
  linkedlist: [
    'Many linked-list problems become trivial with a dummy head node and one or two pointers walking the list.',
    'A fast pointer at 2x speed and a slow pointer at 1x speed detects cycles, finds the middle, or locates the k-th-from-end node in one pass.',
    'One pass is O(n) time and O(1) extra space — recursion-based answers are elegant but cost O(n) stack space.',
  ],
  trees: [
    'Most tree problems decompose recursively: the answer for a node is a function of the answers for its two subtrees.',
    'Decide whether you need preorder (root first), inorder (BST sorted), or postorder (children first) and whether you should return one value or a pair from each recursive call.',
    'A clean recursion visits every node once, so it runs in O(n) time and uses O(h) stack space, where h is the tree height (log n if balanced).',
  ],
  tries: [
    'When the problem mentions many prefix lookups or large dictionaries, a trie collapses repeated work across shared prefixes.',
    'Each node has up to 26 children (one per lowercase letter) plus an end-of-word flag; insertion and lookup follow the characters of the key.',
    'Both operations run in O(L) where L is the key length, regardless of how many words live in the trie.',
  ],
  graphs: [
    'First identify the graph: what are the nodes, what are the edges, is it directed, is it weighted, can it have cycles?',
    'For shortest path in an unweighted graph use BFS; for connectivity use DFS or union-find; for weighted shortest path use Dijkstra with a min-heap.',
    'Plain BFS or DFS runs in O(V + E); Dijkstra is O(E log V). Keep a visited set to avoid revisiting nodes.',
  ],
  'advanced-graphs': [
    'Recognise the structural pattern: shortest path on a weighted graph, minimum spanning tree, topological order, or strongly connected components — each has a canonical algorithm.',
    'Dijkstra uses a min-heap keyed by distance; topological sort uses Kahn\'s in-degree BFS or DFS finishing order; MST uses Kruskal with union-find or Prim with a heap.',
    'These all run in roughly O((V + E) log V) — anything closer to O(V * E) is probably doing extra work that the right algorithm avoids.',
  ],
  backtracking: [
    'Cast the problem as a decision tree: at each step decide which next element to include, and recurse into the resulting subproblem.',
    'When recursing, push the choice into a partial-solution buffer, recurse, then pop on the way back so the buffer is reused across branches.',
    'Prune branches early — if a partial solution can no longer beat the best so far, return immediately. The worst case is still exponential in the choice count.',
  ],
  recursion: [
    'Define the base case (smallest input you can solve directly) and the recursive case (how the answer for n depends on answers for smaller inputs).',
    'Trust the recursion: assume it returns the right answer for any input strictly smaller than n, and write the combine step.',
    'If subproblems repeat, memoise — turning exponential recursion into polynomial DP is often a one-line change.',
  ],
  dp: [
    'Identify the state: what is the smallest set of variables that fully describes a subproblem? The DP table is indexed by those variables.',
    'Write the transition: dp[state] = combine(dp[smaller states]). Verify it handles boundary states cleanly.',
    'Total time is (states) * (transition cost). If the table is large, look for ways to keep only the last row or column — that drops space from O(n*m) to O(m).',
  ],
  '2d-dp': [
    'A 2D grid of subproblems usually means two varying parameters — try (i, j) where i and j index two sequences or two grid coordinates.',
    'Write dp[i][j] in terms of dp[i-1][j], dp[i][j-1], and dp[i-1][j-1] — the right combination depends on whether you are matching, counting paths, or optimising.',
    'O(n*m) time is typical; you can often reduce space to O(m) by keeping only the previous row.',
  ],
  greedy: [
    'Identify the locally optimal choice: at each step what is the best immediate decision, ignoring the future?',
    'Sort the input so that the locally optimal move is obvious, then make a single pass.',
    'A greedy works only if the exchange argument holds — prove that swapping any non-greedy choice with the greedy one cannot worsen the answer.',
  ],
  intervals: [
    'Sort intervals by start time (sometimes end time) — this is the universal first move for interval problems.',
    'After sorting, sweep left to right and merge or process pairwise: each interval interacts with the running rightmost endpoint or a heap of active intervals.',
    'Sorting dominates the cost at O(n log n); the sweep is O(n).',
  ],
  math: [
    'Look for a closed-form pattern by computing the answer for small n by hand — n = 0, 1, 2, 3 — and look for the recurrence or formula.',
    'Common moves: factor the problem via prime factorisation, GCD/LCM, modular arithmetic, or telescoping sums.',
    'Many math problems have O(log n) solutions via fast exponentiation, Euclid\'s algorithm, or sieve precomputation.',
  ],
  'bit-manipulation': [
    'Think in binary: each bit can be set independently, and AND / OR / XOR / shift operate on all 32 or 64 bits in O(1).',
    'XOR is its own inverse — a XOR a = 0 — which makes it perfect for cancellation problems like "find the unique number".',
    'n & (n - 1) clears the lowest set bit; 1 << i isolates the i-th bit. These two tricks solve most bit problems in O(log n) or O(n).',
  ],
  geometry: [
    'Identify the geometric primitive: distance, cross product (orientation), area, or angle.',
    'Use the cross product to test orientation (clockwise vs counterclockwise) — it is integer-safe and avoids floating-point error.',
    'Sort by polar angle or x-coordinate, then sweep. Convex-hull-style algorithms run in O(n log n).',
  ],
  'first-order': [
    'Before reaching for a fancy algorithm, brute-force the problem and inspect the small-case answers — the pattern often jumps out.',
    'Reduce the problem to a known shape: can it be cast as a known sort + scan, hash lookup, or graph traversal?',
    'Verify your insight on the boundary cases (empty input, single element, all duplicates) before generalising.',
  ],
};

// Canonical aliases so binary-search → binarySearch template etc.
const TOPIC_ALIAS = {
  'binary-search': 'binarySearch',
  '2d-dp': '2d-dp',
};

const FALLBACK = [
  'Sketch a brute force first — even an O(n^2) or exponential solution gives you a correctness baseline and shows where the wasted work lives.',
  'Can you avoid recomputation by caching intermediate results, sorting the input, or maintaining a running aggregate as you scan?',
  'What time complexity does the optimal solution have? Most interview problems are O(n), O(n log n), or O(n * m) — anything slower usually needs another pass of thought.',
];

function hintsFor(topicId) {
  const key = TOPIC_ALIAS[topicId] || topicId;
  const t = TEMPLATES[key];
  if (t && t.length >= 3) return t.slice(0, 3);
  return FALLBACK;
}

async function main() {
  const dryRun = process.argv.includes('--dry');

  // Paginate via .range() — PostgREST caps single SELECT at 1000 rows.
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, name, topic_id, roadmap_set, hints')
      .in('roadmap_set', ['100', '200', '300'])
      .order('roadmap_set', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error('select failed:', error); process.exit(1); }
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  console.log(`fetched ${rows.length} top-500-tier problems`);

  const needs = rows.filter(r => !Array.isArray(r.hints) || r.hints.length < 3);
  console.log(`${needs.length} need hints (idempotent skip applied)`);

  let updated = 0, skipped = 0, failed = 0;
  for (let i = 0; i < needs.length; i++) {
    const p = needs[i];
    const hints = hintsFor(p.topic_id);
    if (dryRun) {
      if (i < 5) console.log(`[dry] ${p.id} (${p.topic_id}) -> ${hints[0].slice(0, 60)}...`);
      skipped++;
      continue;
    }
    const { error: upErr } = await sb
      .from('PGcode_problems')
      .update({ hints })
      .eq('id', p.id);
    if (upErr) { failed++; console.error(`fail ${p.id}:`, upErr.message); }
    else updated++;
    if ((i + 1) % 50 === 0) console.log(`progress: ${i + 1}/${needs.length} (updated ${updated}, failed ${failed})`);
  }
  console.log(`done. updated=${updated} skipped=${skipped} failed=${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
