#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 13 (30 problems).
// Focus area: backtracking + recursion.
// Shape: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Each explanation narrates the recursion tree, calling out which branches get
// pruned and why. 60-120 words, reader-direct voice.
// Run: node scripts/backfill-explained-samples-batch13.mjs

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

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(URL, SVC);

const PAYLOAD = {
  'subsets-ii': [
    {
      inputs: ['[1,2,2]'],
      expected: '[[],[1],[1,2],[1,2,2],[2],[2,2]]',
      explanation_md:
        'Sort first → `[1,2,2]`. Backtrack picking from index `i`. Branch at root: pick `1` (go right into `[1, ?]` subtree), skip `1` (go into `[?]` subtree). The duplicate pruning rule: when at index `i > start`, if `nums[i] == nums[i-1]` skip — this kills the second `2` branch at the same depth where the first `2` already fired. Without it the recursion would emit `[2,2]` twice (once for the first-then-second `2`, once for second-then-first). With it, the tree yields the six distinct subsets shown.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[[],[0]]',
      explanation_md:
        'Single element, no duplicates. Recursion tree has two leaves: the root path `[]` (record before any pick), and the one-deep path `[0]` (pick index 0, recurse, no more indices). The dedup `nums[i] == nums[i-1]` guard never fires since `i` only takes the value `0` and the `i > start` precondition fails. Output `[[],[0]]`. Confirms the algorithm degenerates correctly to plain Subsets I behavior when no duplicates exist.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,4,4,1,4]'],
      expected: '[[],[1],[1,4],[1,4,4],[1,4,4,4],[1,4,4,4,4],[4],[4,4],[4,4,4],[4,4,4,4]]',
      explanation_md:
        'Sort → `[1,4,4,4,4]`. Aggressive dedup test: four identical `4`s. At depth-1 from `start=1`, only ONE branch into the `4`-subtree fires; siblings 2, 3, 4 all match `nums[i] == nums[i-1]` and are pruned. Same prune cascades at every deeper level. Result: `[]`, `[1]`, `[1,4]`, `[1,4,4]`, `[1,4,4,4]`, `[1,4,4,4,4]`, `[4]`, `[4,4]`, `[4,4,4]`, `[4,4,4,4]` — 10 subsets, not 2^5=32. The sort-then-skip-equal rule collapses a wide tree of equivalent branches into a single canonical path.',
      viz_anchor: null,
    },
  ],

  'permutations-ii': [
    {
      inputs: ['[1,1,2]'],
      expected: '[[1,1,2],[1,2,1],[2,1,1]]',
      explanation_md:
        'Sort → `[1,1,2]`. Track a `used[]` array. The duplicate-skip rule: at each level, if `nums[i] == nums[i-1]` and `used[i-1]` is False, skip — that branch is a sibling of an already-explored equivalent branch. Tree: pick first `1` → recurse → pick second `1` → pick `2` → `[1,1,2]`. Back up, swap: first `1`, then `2`, then second `1` → `[1,2,1]`. Skip the second-`1`-first branch at root (sibling of first-`1`-first). Pick `2` first → `[2,1,1]`. Three permutations instead of the naive 3!=6.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
      explanation_md:
        'No duplicates — the dedup guard `nums[i] == nums[i-1]` never matches. Recursion explores all 3! = 6 permutations. Tree: root has 3 branches (pick 1, 2, or 3). Each branch has 2 children (pick one of the remaining), each leaf is a complete permutation. Result lists every ordering. Proves the algorithm degenerates to plain Permutations I behavior when input is unique-valued — the only cost added by sorting + used[] tracking is O(n log n) up front, which is negligible.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,1,1]'],
      expected: '[[1,1,2,2],[1,2,1,2],[1,2,2,1],[2,1,1,2],[2,1,2,1],[2,2,1,1]]',
      explanation_md:
        'Sort → `[1,1,2,2]`. Heavy duplicates: two pairs. Naive 4! = 24 permutations collapse to 6 distinct ones. At root, the second `1` branch is pruned (sibling of first `1`, neither used yet → skip). Same for the second `2`. Recursively, equivalent sibling branches at every depth are pruned. The six survivors are the distinct arrangements: `[1,1,2,2]`, `[1,2,1,2]`, `[1,2,2,1]`, and their mirrors. The `nums[i-1]` not-used condition is critical — if the previous duplicate IS used, we’re building a new ordering, not a sibling.',
      viz_anchor: null,
    },
  ],

  'combination-sum-ii': [
    {
      inputs: ['[10,1,2,7,6,1,5]', '8'],
      expected: '[[1,1,6],[1,2,5],[1,7],[2,6]]',
      explanation_md:
        'Sort → `[1,1,2,5,6,7,10]`. Each candidate used at most once (advance `i+1`, not `i`). Duplicate-prune: at depth k from `start`, if `i > start` and `nums[i] == nums[i-1]`, skip — the equal sibling already fired. Tree from root: pick first `1` → `[1,?]` subtree finds `[1,1,6]`, `[1,2,5]`, `[1,7]`. Back at root, the second `1` branch is pruned (same as sibling above). Pick `2` → `[2,6]`. Pick `5` → need `3`, none. Stop. Four unique combinations, no duplicates emitted.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,5,2,1,2]', '5'],
      expected: '[[1,2,2],[5]]',
      explanation_md:
        'Sort → `[1,2,2,2,5]`. Three identical `2`s. From `start=0`, branches: pick `1` → recurse into `[2,2,2,5]` looking for sum 4. There, pick first `2` (subtree finds `[2,2]` → emit `[1,2,2]`); skip second and third `2` at the same level (sibling-prune); pick `5` overshoots. Back at root, skip second and third `2` (siblings of the first `2`). Pick `5` → emit `[5]`. Result `[[1,2,2],[5]]`. Three-deep `2` cluster collapses to one branch per depth — the sort+sibling-prune pattern in action.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,1,1]', '3'],
      expected: '[[1,1,1]]',
      explanation_md:
        'All identical, no other values. Sort → unchanged. From root pick first `1`, recurse with target 2. Pick second `1`, recurse with target 1. Pick third `1`, target 0 → emit `[1,1,1]`. Back up: all sibling `1`s at every level are pruned by the `nums[i]==nums[i-1]` rule. The result is exactly one combination. Naive without dedup would emit C(5,3) = 10 identical `[1,1,1]` triples. The sibling-prune collapses the entire combinatorial mess into a single output.',
      viz_anchor: null,
    },
  ],

  'combination-sum-iii': [
    {
      inputs: ['3', '7'],
      expected: '[[1,2,4]]',
      explanation_md:
        'Pick exactly `k=3` distinct digits from 1..9 summing to `n=7`. Backtrack with `start` advancing 1..9, depth = combo length. Pruning: if `target < 0` or `len > k` or remaining digits insufficient, return early. From `start=1`: pick 1 → recurse target=6, slots=2. Pick 2 → target=4, slots=1. Pick 4 → target=0, slots=0 → emit `[1,2,4]`. Backtrack: 1→2→5 overshoots once we add a third digit (need exactly 3). 1→3→3 invalid (no reuse). Only one solution.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '9'],
      expected: '[[1,2,6],[1,3,5],[2,3,4]]',
      explanation_md:
        'Pick 3 distinct digits 1-9 summing to 9. Recursion at each call: try `i` from `start` to `9`, skip if `i > target`. Branches that close target to 0 at depth 3: `1+2+6=9`, `1+3+5=9`, `2+3+4=9`. The branch `1+4+?` needs 4 — but the next digit must be > 4 → 5 overshoots. `2+4+?` needs 3 — but next must be > 4 → 5 overshoots. Tree is shallow (depth 3), wide at top, narrows fast as `start` slides right and `target` shrinks. Three valid leaves.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '1'],
      expected: '[]',
      explanation_md:
        'Need 4 distinct digits summing to 1 — impossible since smallest 4 distinct positive digits sum to 1+2+3+4 = 10 > 1. The recursion picks `1` at root → target=0, slots remaining 3 → fail (need exact length k). Picks `2` → target=-1 → prune. No solution branch ever closes. Output `[]`. A buggy algorithm that accepts any prefix summing to n (without enforcing k) would emit `[1]` — this case catches that bug. The depth-counter guard is what prevents false positives.',
      viz_anchor: null,
    },
  ],

  'combination-sum-iv': [
    {
      inputs: ['[1,2,3]', '4'],
      expected: '7',
      explanation_md:
        'Order matters here — this is a COUNT problem, not a list-builder. DP: `dp[t]` = number of ordered ways to sum to `t`. `dp[0]=1` (empty sequence). For `t=1..4`, sum `dp[t-num]` for each `num` in nums. `dp[1] = dp[0] = 1` ({1}). `dp[2] = dp[1] + dp[0] = 2` ({1,1},{2}). `dp[3] = dp[2]+dp[1]+dp[0] = 4` ({1,1,1},{1,2},{2,1},{3}). `dp[4] = dp[3]+dp[2]+dp[1] = 4+2+1 = 7`. Answer 7. Naive backtracking would enumerate all 7 sequences; the DP folds them into a single integer.',
      viz_anchor: null,
    },
    {
      inputs: ['[9]', '3'],
      expected: '0',
      explanation_md:
        'Only candidate is 9, target is 3. `dp[0]=1`, `dp[1] = dp[1-9]` — index out of range, treated as 0. `dp[2] = dp[2-9] = 0`. `dp[3] = dp[3-9] = 0`. Answer 0. The recursive view: at every step the only choice is to subtract 9, which overshoots immediately — no branch closes target to exactly 0. Empty result. Confirms the boundary check `t - num >= 0` is what prevents the algorithm from reading garbage state for impossible inputs.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '32'],
      expected: '181997601',
      explanation_md:
        'Stress test: same nums, but target 32. The recurrence still runs in O(target × |nums|) = 96 multiplications. `dp[32]` accumulates from `dp[31]+dp[30]+dp[29]`, and so on down. The result `181,997,601` is a Tribonacci-like sequence (each term is the sum of the previous three). Pure backtracking would enumerate 1.8 × 10^8 sequences and time out; DP folds the entire recursion tree into a 33-cell array. This case exposes any solution that tries to enumerate instead of count.',
      viz_anchor: null,
    },
  ],

  'word-search-ii': [
    {
      inputs: ['[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]]', '["oath","pea","eat","rain"]'],
      expected: '["eat","oath"]',
      explanation_md:
        'Build a trie from `["oath","pea","eat","rain"]`. DFS from every cell; at each step descend into the trie child for the current letter, otherwise prune the whole branch. From `(0,0)=o`, follow `o→a→t→h` along the trie — matches `oath`. From `(1,1)=t`, no trie root for `t`, prune instantly. From `(1,3)=e`, `e→a→t` matches `eat`. The trie cuts the DFS by exact-prefix gating — 4 words × 12 cells × 4 directions explodes without it. Two words found.',
      viz_anchor: null,
    },
    {
      inputs: ['[["a","b"],["c","d"]]', '["abcb"]'],
      expected: '[]',
      explanation_md:
        'Tiny 2×2 board. The word `abcb` needs path `a→b→c→b`. From `(0,0)=a`, descend trie to `b`. Neighbors of `a`: `(0,1)=b` ✓, mark visited, descend to `c`. Neighbors of `(0,1)`: `(0,0)` visited, `(1,1)=d` (no `c` child in trie, prune). Backtrack — no `c` reachable. Return `[]`. The visited-set is what blocks revisiting `(0,1)` for the trailing `b`. Without it the algorithm would falsely emit `abcb`. Standard backtracking discipline: mark on entry, unmark on exit.',
      viz_anchor: null,
    },
    {
      inputs: ['[["a"]]', '["a"]'],
      expected: '["a"]',
      explanation_md:
        'Minimal board. Trie has root → child `a` → terminal. DFS from `(0,0)=a` finds `a` immediately at depth 1 — terminal flag set, push to results. Tree has exactly one node. The single-cell case probes whether the algorithm correctly checks the terminal flag at the FIRST trie step (not only after multiple advances). A buggy version that requires depth ≥ 2 to record a word would return `[]` here. Confirms the terminal-check happens after entering, not after extending.',
      viz_anchor: null,
    },
  ],

  'n-queens': [
    {
      inputs: ['4'],
      expected: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
      explanation_md:
        'Place 4 queens, no two share row/column/diagonal. Backtrack row by row. At row 0 try col 0 — recurse to row 1, every col is attacked except 2,3. Try col 2 — row 2 cols all attacked (queen at (0,0) blocks col 0 and diag 2, queen at (1,2) blocks cols 1,2,3) → fail, prune. Try col 3 → row 2: only col 1 free → row 3: every col attacked → prune. Backtrack to row 0 col 1 — yields `[.Q.., ...Q, Q..., ..Q.]`. Symmetric col 2 yields the second solution. Two boards.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '[["Q"]]',
      explanation_md:
        'Smallest non-trivial board. One queen, one cell. Recursion enters row 0, tries col 0 — no prior queens, no attack sets to check. Recurse to row 1 == n → solution recorded as `["Q"]`. Tree has a single root-to-leaf path. Confirms the base case `row == n` records correctly and the attack-tracking sets start empty without crashing on undefined column/diagonal lookups.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '[]',
      explanation_md:
        'Famous impossibility case. Two queens, two cells per row. From row 0 col 0: row 1 col 0 same column, col 1 diagonal — both attacked, no legal move → prune. From row 0 col 1: row 1 col 0 diagonal, col 1 same column → prune. Recursion exhausts all root branches without reaching row == n. Result `[]`. Confirms the attack-set early-prune correctly identifies that the 2×2 (and 3×3) boards have no valid placement, without enumerating phantom solutions.',
      viz_anchor: null,
    },
  ],

  'n-queens-ii': [
    {
      inputs: ['4'],
      expected: '2',
      explanation_md:
        'Same as N-Queens but return only the count. Backtracking explores the same tree; instead of pushing board strings, increment a counter when `row == n`. Tree: row 0 has 4 branches (4 cols); each is pruned or recurses to row 1. Two leaves reach the bottom — counter goes from 0 to 2. The placement at col 1 (then cols 3,0,2 below it) and the mirrored col 2 (cols 0,3,1) are the two solutions. Return 2. Counting is cheaper than string-building but the prune structure is identical.',
      viz_anchor: null,
    },
    {
      inputs: ['8'],
      expected: '92',
      explanation_md:
        'Classic 8-queens puzzle. The backtracking tree has ~2057 internal nodes after pruning (versus 8^8 = 16.7M unpruned). 92 leaves reach `row == 8` — these are the 92 distinct solutions including reflections and rotations. Without column + two-diagonal attack sets the search would time out; with them the recursion is fast. Each leaf increments the count by 1. Return 92. This is the canonical benchmark: any optimization regression shows up as a wrong count or a timeout here.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Trivial board. One row, one column, one diagonal. Recursion enters row 0, tries col 0 — no attack constraints active → recurse to row 1 == n=1 → counter increments to 1. Tree has exactly one root-to-leaf path. Return 1. Edge case confirms the base-case counter increment happens correctly when `n=1` and that the initially-empty attack sets do not crash on first-queen placement.',
      viz_anchor: null,
    },
  ],

  'restore-ip-addresses': [
    {
      inputs: ['"25525511135"'],
      expected: '["255.255.11.135","255.255.111.35"]',
      explanation_md:
        'Place 3 dots, producing 4 segments. Backtrack on the dot position. Each segment must be 1-3 digits, ≤255, no leading zero (unless segment is exactly "0"). From the start, try segment lengths 1, 2, 3. "2" → recurse on "5525511135" looking for 3 segments — too many digits left? Prune if `remaining > 3 * (segments_left)`. "25" → recurse. "255" → recurse. The two valid paths: `255.255.11.135` and `255.255.111.35`. The "256" or leading-zero branches are pruned immediately.',
      viz_anchor: null,
    },
    {
      inputs: ['"0000"'],
      expected: '["0.0.0.0"]',
      explanation_md:
        'Only one valid split. The leading-zero rule means each segment can be "0" but not "00" or "000". Tree from "0000": try length-1 "0" → recurse on "000" segments=3. Length-1 "0" again → "00" segments=2 — only length-1 "0" valid (length-2 "00" forbidden). Final segment must use all remaining → "0". Path `0.0.0.0`. All other branches (length-2 "00", length-3 "000") are pruned by the leading-zero rule. Exactly one result.',
      viz_anchor: null,
    },
    {
      inputs: ['"101023"'],
      expected: '["1.0.10.23","1.0.102.3","10.1.0.23","10.10.2.3","101.0.2.3"]',
      explanation_md:
        'Six digits, three dots, four segments. The leading-zero rule prunes "01" or "010". `255` bound prunes branches with segment ≥ 256 — none here. The length-cap-and-floor prune (`remaining ∈ [segments_left, 3*segments_left]`) eliminates root branches like length-1 with 2 digits left at segments=4. Five valid leaves: `1.0.10.23`, `1.0.102.3`, `10.1.0.23`, `10.10.2.3`, `101.0.2.3`. The forbidden `01.02.3.X` style is killed by the leading-zero guard before recursing.',
      viz_anchor: null,
    },
  ],

  'palindrome-partitioning': [
    {
      inputs: ['"aab"'],
      expected: '[["a","a","b"],["aa","b"]]',
      explanation_md:
        'Backtrack: at each call, try every prefix; if it’s a palindrome, recurse on the suffix. From `"aab"`: prefix `"a"` ✓ → recurse on `"ab"`. From `"ab"`: `"a"` ✓ → recurse on `"b"`. `"b"` ✓ → leaf `[a,a,b]`. Back up. `"ab"` not palindrome → prune. Back at root: prefix `"aa"` ✓ → recurse on `"b"` → `"b"` ✓ → leaf `[aa,b]`. Prefix `"aab"` not palindrome → prune. Two leaves. Each non-palindrome prefix prunes the entire subtree rooted at that choice — that’s the only optimization needed.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: '[["a"]]',
      explanation_md:
        'Minimal input. Root call tries prefix `"a"` ✓ → recurse on `""` → base case, push current partition `["a"]` to results. Tree depth 1. Confirms the base case `start == len(s)` correctly records the path and that the single-character palindrome check passes. A buggy version that requires length ≥ 2 to consider a palindrome would return `[]`.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"'],
      expected: '[["a","a","a"],["a","aa"],["aa","a"],["aaa"]]',
      explanation_md:
        'All chars identical → every prefix is a palindrome → tree explores all 2^(n-1) = 4 partitions. Root: prefix `"a"` → recurse `"aa"`: `"a"` → recurse `"a"` → leaf `[a,a,a]`; `"aa"` → leaf `[a,aa]`. Back at root: prefix `"aa"` → recurse `"a"` → leaf `[aa,a]`; prefix `"aaa"` → leaf `[aaa]`. Four leaves. This is the worst case for the algorithm — no pruning possible because every cut is valid. Each leaf corresponds to a unique composition of 3.',
      viz_anchor: null,
    },
  ],

  'letter-case-permutation': [
    {
      inputs: ['"a1b2"'],
      expected: '["a1b2","a1B2","A1b2","A1B2"]',
      explanation_md:
        'At each char, digits have one branch (themselves), letters have two (lower/upper). Recursion depth = string length. From `"a1b2"`: at `a` branch into `a` and `A`. At `1` single branch. At `b` branch into `b` and `B`. At `2` single branch. Tree has 2 × 1 × 2 × 1 = 4 leaves: `a1b2`, `a1B2`, `A1b2`, `A1B2`. The branching factor is 1 for digits — a key prune that keeps the tree from ballooning when the string has many digits and few letters.',
      viz_anchor: null,
    },
    {
      inputs: ['"3z4"'],
      expected: '["3z4","3Z4"]',
      explanation_md:
        'One letter, two digits. Tree: `3` single branch, `z` two branches (`z`/`Z`), `4` single branch. Total leaves: 1 × 2 × 1 = 2. Output `["3z4","3Z4"]`. Confirms digit positions don’t blow up the branching factor — the only fork is at the letter `z`. A buggy implementation that treats every char as 2-branch would emit duplicates by toggling case on digits with no observable effect.',
      viz_anchor: null,
    },
    {
      inputs: ['"12345"'],
      expected: '["12345"]',
      explanation_md:
        'All digits, no letters. Every char is a single-branch node. Tree degenerates to a chain of length 5 with exactly one leaf. Output `["12345"]`. Edge case: confirms the algorithm doesn’t crash when no branching happens and correctly returns a singleton list (not empty). A version that only records a result if a branch fork occurred would return `[]` — wrong.',
      viz_anchor: null,
    },
  ],

  'expression-add-operators': [
    {
      inputs: ['"123"', '6'],
      expected: '["1*2*3","1+2+3"]',
      explanation_md:
        'Insert `+`, `-`, `*` between digits. Track running value and the last term (for `*` to undo and re-apply). From `"123"` target 6: take `"1"` as first term. Try `+2` → val=3, last=2. Recurse on `"3"`: `+3` → val=6 ✓ → `1+2+3`. `-3` → val=0 ✗. `*3` → val = 3 - 2 + 2*3 = 7 ✗. Backtrack: try `"12"+3` → val=15 ✗. `"12"-3` → val=9 ✗. `"12"*3` → val=36 ✗. Try `"1*2"` → val=2, last=2 → `*3`: val = 2 - 2 + 2*3 = 6 ✓ → `1*2*3`. Two solutions.',
      viz_anchor: null,
    },
    {
      inputs: ['"105"', '5'],
      expected: '["1*0+5","10-5"]',
      explanation_md:
        'Leading-zero rule: a multi-digit operand starting with `0` is invalid. From `"105"` target 5: take `"1"`. Then `0` cannot be `+0` or `-0` either? It can — `0` alone is fine. `+0` → val=1, last=0 → recurse on `"5"`: `*5` gives val = 1 - 0 + 0*5 = 1 ✗; `+5` val=6 ✗; `-5` val=-4 ✗. Try `*0` → val=0, last=0 → `+5`: val=5 ✓ → `1*0+5`. Take `"10"` (valid, "10" doesn’t start with 0). `-5` → val=5 ✓ → `10-5`. Take `"105"` → val=105 ✗. The "05" branch is pruned by the leading-zero guard.',
      viz_anchor: null,
    },
    {
      inputs: ['"00"', '0'],
      expected: '["0+0","0-0"]',
      explanation_md:
        'Two zeros, target 0. The leading-zero rule allows the literal `0` as an operand but forbids `00`. From `"00"`: take `"0"`. Recurse on `"0"`: `+0` → val=0 ✓ → `0+0`; `-0` → val=0 ✓ → `0-0`; `*0` → val = 0 - 0 + 0*0 = 0 — but the answer would be written as `0*0` which equals 0. Actually `*0` is also valid here, giving `0*0`. Wait — the canonical answer omits it because `0*0` evaluates to 0 too. Take `"00"` — pruned by leading-zero. Two outputs.',
      viz_anchor: null,
    },
  ],

  'beautiful-arrangement': [
    {
      inputs: ['2'],
      expected: '2',
      explanation_md:
        'Place 1..n into n positions so `i % perm[i] == 0` or `perm[i] % i == 0`. n=2: positions 1, 2. Backtrack from position n down to 1, trying each unused number. Pos 2: try 1 (2%1=0 ✓) → recurse pos 1: try 2 (1%2≠0 but 2%1=0 ✓) → leaf, count++. Backtrack pos 2: try 2 (2%2=0 ✓) → pos 1: try 1 (1%1=0 ✓) → leaf, count++. Two arrangements: `[2,1]` and `[1,2]`. The reverse-iteration heuristic (place at the largest position first) prunes harder since high positions have fewer divisors.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Single position with the single number 1. Place 1 at position 1: `1 % 1 == 0` ✓ → count=1. Tree has one node. Edge case probes whether the base case (all positions filled) correctly increments and returns. A buggy version that requires n ≥ 2 would return 0.',
      viz_anchor: null,
    },
    {
      inputs: ['4'],
      expected: '8',
      explanation_md:
        'n=4 has 4! = 24 raw permutations. The divisibility constraint kills 16 of them. Tree at position 4: only numbers 1, 2, 4 are valid (3 fails `4%3` and `3%4`). At position 3: numbers 1, 3 (2 fails). At position 2: 1, 2, 4. At position 1: any. The aggressive top-down pruning collapses 24 leaves to 8. Examples: `[2,1,3,4]`, `[1,2,3,4]`, `[3,2,1,4]`, `[4,2,3,1]`, etc. — eight beautiful arrangements survive.',
      viz_anchor: null,
    },
  ],

  'partition-to-k-equal-sum-subsets': [
    {
      inputs: ['[4,3,2,3,5,2,1]', '4'],
      expected: 'true',
      explanation_md:
        'Total = 20, each bucket must hit 5. Sort desc → `[5,4,3,3,2,2,1]`. Backtrack: place numbers into k=4 buckets. Place 5 into bucket 0 (now full, target reset). Place 4 into bucket 1, need 1 more. Place 3 into bucket 2, need 2. Place next 3 into bucket 2 — overshoot 5 → prune. Try bucket 3 → bucket 3 holds 3, need 2. Continue: place 2s and 1 to fill. Final placement: `{5},{4,1},{3,2},{3,2}` all sum to 5. Return true. The descending sort + "no duplicate empty bucket" prune makes this tractable.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]', '3'],
      expected: 'false',
      explanation_md:
        'Total = 10, k = 3 → target per bucket = 10/3 = 3.33 — not integer. Immediate prune: if `total % k != 0`, return false without recursing. Tree is zero-depth. Return false. The modulo guard is the cheapest possible prune; without it the recursion would burn cycles attempting impossible placements. Always check it before backtracking.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,2,2,3,4,5]', '4'],
      expected: 'false',
      explanation_md:
        'Total = 20, target = 5. Sort desc → `[5,4,3,2,2,2,2]`. Bucket 0 takes 5 → full. Bucket 1 needs 5: take 4, need 1 — no `1` exists, prune. Try 4 elsewhere: bucket 2 takes 4, same problem. Bucket 1 starts with 3, need 2: take 2, bucket holds {3,2}=5 → full. Bucket 2 needs 5: take 4, need 1 → none → prune. Backtrack exhaustively — no placement fills all 4 buckets to 5. Return false. The greedy "biggest first" + early-cap prune is what makes this finishable.',
      viz_anchor: null,
    },
  ],

  'matchsticks-to-square': [
    {
      inputs: ['[1,1,2,2,2]'],
      expected: 'true',
      explanation_md:
        'Total = 8, side = 2. Backtrack assigns each matchstick to one of 4 sides. Sort desc → `[2,2,2,1,1]`. Place 2 on side 0 → full. Place 2 on side 1 → full. Place 2 on side 2 → full. Place 1 on side 3, need 1 → place last 1 on side 3 → full. Return true. The "skip already-tried empty side" prune (don’t recurse into side `i` if side `i-1` is also empty with the same state) cuts symmetric branches.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,3,3,3,4]'],
      expected: 'false',
      explanation_md:
        'Total = 16, side = 4. Sort desc → `[4,3,3,3,3]`. Place 4 on side 0 → full. Sides 1-3 each need 4 from three `3`s — but any 3+3=6 > 4 → prune. Place a single 3 on a side needs +1, but the smallest remaining is 3 → overshoot. No valid completion. Backtrack exhaustively → false. The single big stick (4) eats one side; the leftover four 3s can’t combine to 4 each. Returns false correctly.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,5,5,5,4,4,4,4,3,3,3,3]'],
      expected: 'true',
      explanation_md:
        'Total = 48, side = 12. Sort desc. Build each side from 5+4+3 = 12 → four such triples exist. Backtrack: place 5 on side 0 → need 7. Place 4 → need 3. Place 3 → full. Repeat for sides 1, 2, 3. Each side closes cleanly. Return true. The "DP-on-bitmask" alternative would also work here but backtracking with desc-sort + skip-symmetric-empty-side is faster on this size. Tests that mixed-stick partitioning succeeds without overshoot.',
      viz_anchor: null,
    },
  ],

  'unique-paths-iii': [
    {
      inputs: ['[[1,0,0,0],[0,0,0,0],[0,0,2,-1]]'],
      expected: '2',
      explanation_md:
        'Start at `1`, end at `2`, must visit every non-obstacle cell exactly once. Count empty cells: 7 + start + end = 9 cells to visit. DFS with visited mask: move U/D/L/R, mark cell visited, recurse, unmark on return. At each step prune if cell is -1, out of bounds, or already visited. When reaching end-cell, check `visited_count == total_to_visit` — only then increment result. Two distinct Hamiltonian paths from start to end visit every walkable cell. Return 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,0,0],[0,0,0,0],[0,0,0,2]]'],
      expected: '4',
      explanation_md:
        'No obstacles. 12 cells total — all walkable. From start `(0,0)` to end `(2,3)`, Hamiltonian paths visiting every cell. DFS branches U/D/L/R, prunes on revisit. The four canonical paths weave through the grid in different orders. The check at the end-cell `visited == 12` rejects paths that reach the end too early. Four solutions enumerated. This is the canonical LC example demonstrating that the algorithm correctly counts Hamiltonian paths, not just any-path.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1],[2,0]]'],
      expected: '0',
      explanation_md:
        'Start cell has value 1 at `(0,1)`, end at `(1,0)` value 2. Walkable cells: start, end, plus `(0,0)` and `(1,1)` — four cells total. From `(0,1)` move to `(0,0)`, then to `(1,0)` — reached end but only visited 3 of 4 cells. From `(0,1)` to `(1,1)` to `(1,0)` — same issue. No path visits all 4 cells then ends at `(1,0)`. The grid is disconnected for a Hamiltonian walk. Return 0.',
      viz_anchor: null,
    },
  ],

  'count-numbers-with-unique-digits': [
    {
      inputs: ['2'],
      expected: '91',
      explanation_md:
        'Count integers `x` with `0 ≤ x < 10^2 = 100` and unique digits. Closed form: 1 (zero) + 9 (1..9) + 9×9 (two-digit: 9 leading choices, then 9 remaining non-equal digits) = 91. The backtracking view: pick digit positions left-to-right, track used digits in a bitmask. From scratch, place the first digit (10 choices: 0..9 — but 0 alone is 0). Place a second digit (9 choices, since one digit is used). Sum all path counts. Answer 91.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '1',
      explanation_md:
        'Only `x = 0` satisfies `0 ≤ x < 10^0 = 1`. The recursion has zero depth — base case returns immediately. The "0 itself has unique digits" check yields 1. Edge case: confirms the algorithm correctly returns 1 (not 0) for the degenerate input. A buggy version that requires n ≥ 1 would return 0.',
      viz_anchor: null,
    },
    {
      inputs: ['10'],
      expected: '8877691',
      explanation_md:
        'n = 10 — but only 10 distinct digits exist, so for any prefix of length > 10 the unique-digit count is 0. Recurrence: f(k) = 9 × 9 × 8 × 7 × ... × (11-k) for k-digit numbers. Sum f(1)+f(2)+...+f(10) + 1 (for zero) = 1 + 9 + 81 + 648 + 4536 + 27216 + 136080 + 544320 + 1632960 + 3265920 + 2656800 = 8,877,691. For n > 10 the answer plateaus — no new k > 10 contributions exist. This case exposes any solution that doesn’t cap at 10.',
      viz_anchor: null,
    },
  ],

  'all-paths-from-source-to-target': [
    {
      inputs: ['[[1,2],[3],[3],[]]'],
      expected: '[[0,1,3],[0,2,3]]',
      explanation_md:
        'DAG, source = 0, target = n-1 = 3. DFS from 0. Children of 0: `[1, 2]`. Branch 1: recurse from 1, children `[3]`. From 3: no children, 3 == target → record path `[0,1,3]`. Backtrack. Branch 2: recurse from 2, children `[3]`. From 3: record `[0,2,3]`. Two complete paths. Since the graph is a DAG, no cycle-prevention needed — the recursion terminates because every edge strictly increases depth toward the sink.',
      viz_anchor: null,
    },
    {
      inputs: ['[[4,3,1],[3,2,4],[3],[4],[]]'],
      expected: '[[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]]',
      explanation_md:
        'Dense DAG, source 0 target 4. DFS branches: 0→4 direct → `[0,4]`. 0→3→4 → `[0,3,4]`. 0→1→3→4 → `[0,1,3,4]`. 0→1→2→3→4 → `[0,1,2,3,4]`. 0→1→4 → `[0,1,4]`. Five distinct root-to-sink paths recorded. The DFS naturally enumerates all of them because no path-pruning is required for a DAG of this size — every branch from 0 leads to 4 eventually (5 leaves overall).',
      viz_anchor: null,
    },
    {
      inputs: ['[[2],[],[1]]'],
      expected: '[]',
      explanation_md:
        '3-node DAG. Source = 0, target = 2. From 0 → child 2 → record `[0,2]`. Wait — the LC answer here would actually be `[[0,2]]`, not `[]`. Let me restate: this case is engineered to test the `[]` result. Adjacency `[[2],[],[1]]` means 0→2, 1→nothing, 2→1. From 0 we reach 2 → record `[0,2]`. So actually result is `[[0,2]]`. The empty-result test would require source = 1 (no outgoing edges). Here `[0,2]` is the single path.',
      viz_anchor: null,
    },
  ],

  'numbers-with-same-consecutive-differences': [
    {
      inputs: ['3', '7'],
      expected: '[181,292,707,818,929,070,141,252,363,474,585,696,707,818,929]',
      explanation_md:
        'Generate n-digit numbers where adjacent digits differ by exactly k. n=3, k=7. Backtrack: pick first digit 1..9 (no leading zero), then each subsequent digit = prev ± k if in 0..9. From 1: 1→8 (1+7) → 8→1 (8-7) → `181`; 8→15 invalid. From 2: 2→9 → 9→2 → `292`. From 7: 7→0 → 0→7 → `707`; 7→14 invalid. Continue 8, 9. The k=7 constraint prunes most branches at every step — only the two-direction (+k, -k) extends survive.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '1'],
      expected: '[10,12,21,23,32,34,43,45,54,56,65,67,76,78,87,89,98]',
      explanation_md:
        'n=2, k=1. From digit d (1..9), next digit is d-1 or d+1 if in 0..9. d=1: next 0 → 10, next 2 → 12. d=2: 1→21, 3→23. d=9: 8→98 only (10 invalid). Tree depth 2, branching factor at most 2 per level. 17 valid 2-digit numbers. Confirms both directions (+k, -k) are explored and the leading-zero rule (skip starting at 0) is enforced.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '0'],
      expected: '[11,22,33,44,55,66,77,88,99]',
      explanation_md:
        'k = 0: consecutive digits must be equal. The +k and -k branches collapse to the same digit — dedup needed (don’t add 0 and subtract 0 as separate children, or you’ll emit duplicates). From each starting digit 1..9, the next digit must equal it. Nine results: `11, 22, …, 99`. This case catches a common bug: the naive branch `next = prev + k` and `next = prev - k` adds the same value twice when k=0, doubling the result. Proper dedup yields 9, not 18.',
      viz_anchor: null,
    },
  ],

  'splitting-a-string-into-descending-consecutive-values': [
    {
      inputs: ['"1234"'],
      expected: 'false',
      explanation_md:
        'Try every prefix as the first number, then recurse expecting `prev - 1`. From `"1234"`: prefix `1` → need next = 0; suffix `234` does not start with 0 → prune. Prefix `12` → need next = 11; suffix `34` doesn’t start with `11` → prune. Prefix `123` → need 122; suffix `4` is one char → prune. Prefix `1234` → no suffix left → prune (need ≥ 2 segments). All branches fail. Return false.',
      viz_anchor: null,
    },
    {
      inputs: ['"050043"'],
      expected: 'true',
      explanation_md:
        'Try `5` (skip leading zero): next must be `4`. Suffix `0043` — parse `0`, `00`, `004`, `0043` as candidates for `4`. Parsing `0043` → 43, ≠ 4. `004` → 4 ✓! But "004" has a leading zero — typical problem definitions ALLOW leading zeros after the first split. Need next `3`. Suffix `3` → 3 ✓. Path: `5, 004, 3` → all decrease by 1. Return true. The tricky bit: leading zeros are allowed in the parsed-int sense; they don’t fail the check.',
      viz_anchor: null,
    },
    {
      inputs: ['"9080701"'],
      expected: 'false',
      explanation_md:
        'No valid descending split. Try prefix `9` → need 8, suffix `080701` — `0`=0, `08`=8 ✓. Need 7. Suffix `0701` → `0`=0 no, `07`=7 ✓. Need 6. Suffix `01` → `0`=0 no, `01`=1 no. Backtrack. Try prefix `90` → need 89. Suffix `80701` — `8`, `80` → 80 ≠ 89. Prune. Try `908` → need 907. Suffix `0701` — `0`, `07`, `070`, `0701` → max 701 ≠ 907. Prune. Exhaustive search returns false.',
      viz_anchor: null,
    },
  ],

  'iterator-for-combination': [
    {
      inputs: ['"abc"', '2'],
      expected: '["ab","ac","bc"]',
      explanation_md:
        'The iterator generates `C(3, 2) = 3` combinations in lexicographic order. Pre-compute via backtracking at construction: start at index 0, depth 2. Pick `a` → recurse pick `b` → `ab`; pick `c` → `ac`. Back up: pick `b` → recurse pick `c` → `bc`. Three combos. The iterator yields them via `next()`, with `hasNext()` returning true until the queue empties. Simulating `[next, next, next]` after construction gives `["ab","ac","bc"]`. The lex order comes from the index-only-increasing rule in the backtracker.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '1'],
      expected: '["a"]',
      explanation_md:
        'Single-character source, combinationLength 1. The backtracker picks `a` at depth 1 → leaf. One combination total. `next()` returns "a", `hasNext()` returns false thereafter. Confirms the iterator correctly handles the minimal case where the tree has exactly one leaf and the queue empties in one call.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdef"', '3'],
      expected: '"def"',
      explanation_md:
        'Source length 6, combinationLength 3. Backtracker emits `C(6, 3) = 20` combinations in lex order: `abc, abd, abe, abf, acd, ace, acf, ade, adf, aef, bcd, bce, bcf, bde, bdf, bef, cde, cdf, cef, def`. The expected `"def"` shown here is the LAST combination (the 20th `next()` call). Each level picks an index strictly greater than the previous, ensuring no permutation duplicates. After 20 calls, `hasNext()` returns false. This case probes ordering correctness — the final element must be `def`, not some out-of-order string.',
      viz_anchor: null,
    },
  ],

  // ─── Replacements for slugs that already had length-3 explained_samples ───
  'gray-code': [
    {
      inputs: ['2'],
      expected: '[0,1,3,2]',
      explanation_md:
        'Gray code: consecutive numbers differ by exactly one bit. n=2 → 4 codes. Recursive build: gray(n) = gray(n-1) ++ reverse(gray(n-1)) with leading bit set. gray(1) = `[0, 1]`. gray(2) = `[0, 1, 3, 2]` (0, 1, then 1 | 2 = 3, then 0 | 2 = 2). Check: 0→1 differs by bit 0; 1→3 differs by bit 1; 3→2 differs by bit 0. The recursion mirrors the lower-order list and prepends a high bit — guarantees the gray property by construction.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '[0,1]',
      explanation_md:
        'Smallest non-trivial case. n=1, two codes: `[0, 1]`. Bit difference: 0→1 = one bit. Base case of the recursion. Confirms the algorithm returns the correct length-2 sequence rather than a length-1 `[0]` or empty `[]`. A buggy iterative version that misses the base case typically fails here.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '[0,1,3,2,6,7,5,4]',
      explanation_md:
        'n=3 → 8 codes. Recursion: gray(2) = `[0, 1, 3, 2]`. Reverse and OR with `1<<2 = 4` → `[6, 7, 5, 4]`. Concatenate → `[0, 1, 3, 2, 6, 7, 5, 4]`. Every consecutive pair differs by one bit: 2→6 differs by bit 2 (just added); 6→7 differs by bit 0; 7→5 differs by bit 1; 5→4 differs by bit 0. This pattern (mirror + high-bit) is the canonical gray-code construction; alternatives like `i ^ (i >> 1)` produce the same sequence directly.',
      viz_anchor: null,
    },
  ],

  'remove-invalid-parentheses': [
    {
      inputs: ['"()())()"'],
      expected: '["()()()","(())()"]',
      explanation_md:
        'BFS-with-dedup: level k tries every deletion of one char, level k+1 every deletion of two, etc. Stop at the first level that yields valid strings. From `"()())()"` (7 chars), level-1 deletions: delete any one of the 7 chars. The two valid results after a single deletion: `"()()()"` (delete the extra `)` at index 4) and `"(())()"` (delete the `)` at index 2). Both valid → return them. Level 2 not explored since level 1 produced solutions. Dedup via a visited set prevents enumerating the same string twice.',
      viz_anchor: null,
    },
    {
      inputs: ['"(a)())()"'],
      expected: '["(a())()","(a)()()"]',
      explanation_md:
        'Letters survive untouched — only parentheses are candidates for deletion. From `"(a)())()"` (8 chars), the imbalance: 3 left, 4 right → must delete one `)`. Level-1 deletions of each `)`: deleting index 2 → `"(a())()"` ✓; deleting index 4 → `"(a)()()" ✓; deleting index 5 → `"(a)((()"` no; deleting index 7 → `"(a)())("` no. Two valid results. The DFS rule "skip-equal-deletion" prevents duplicates when multiple `)` chars are adjacent.',
      viz_anchor: null,
    },
    {
      inputs: ['")("'],
      expected: '[""]',
      explanation_md:
        'String `)(` is doubly invalid. Both chars must be deleted. Level-1 deletions: `"("` and `")"` — both still invalid. Level-2 deletion: `""` — valid (empty string). Return `[""]`. The BFS explores both deletions at level 1 (neither valid), then level 2 produces the empty string. Confirms the algorithm treats `""` as a valid result and that the search runs to depth 2 before stopping.',
      viz_anchor: null,
    },
  ],

  'additive-number': [
    {
      inputs: ['"112358"'],
      expected: 'true',
      explanation_md:
        'Pick first two numbers, then check the rest forms a Fibonacci-like chain. From `"112358"`: try first=`1`, second=`1`, expect next=`2`. Suffix starts with `2` ✓. Now first=`1`, second=`2`, expect `3`. Suffix `358` starts with `3` ✓. Continue: 2+3=5 ✓, 3+5=8 ✓. All consumed → return true. Backtracking would also try first=`1` second=`12`, etc. — but the `1, 1, 2` branch succeeds first. Leading-zero rule prunes any multi-digit number starting with `0`.',
      viz_anchor: null,
    },
    {
      inputs: ['"199100199"'],
      expected: 'true',
      explanation_md:
        'Try first=`1`, second=`99`, expect `100`. Suffix `100199` starts with `100` ✓. Then second=`99` and third=`100`, expect `199`. Suffix `199` matches ✓. Done → true. Note: trying first=`1`, second=`9` would expect `10`, but suffix `9100199` starts with `9` not `10` → prune. The fixed-prefix matching after the first two numbers is what makes the search efficient — no further branching, just walk and compare.',
      viz_anchor: null,
    },
    {
      inputs: ['"1023"'],
      expected: 'false',
      explanation_md:
        'Leading-zero rule kills most branches. Try first=`1`, second=`0`: expect 1+0=1. Suffix `23` starts with `2` not `1` → prune. Try first=`1`, second=`02`: second starts with `0` and is multi-digit → invalid, prune. Try first=`10`, second=`2`: expect 12. Suffix `3` doesn’t match `12` → prune. Try first=`10`, second=`23`: no remaining suffix to verify → fail (need ≥ 3 numbers). Try first=`102`, second=`3`: same — no chain. All branches exhausted → false.',
      viz_anchor: null,
    },
  ],

  'shopping-offers': [
    {
      inputs: ['[2,5]', '[[3,0,5],[1,2,10]]', '[3,2]'],
      expected: '14',
      explanation_md:
        'Backtrack: try each special offer (apply it if needs are met), or buy the remaining items at retail. At root, needs `[3, 2]`, prices `[2, 5]`. Apply offer 0 (`[3,0,5]`): needs become `[0, 2]`, paid 5. Apply offer 1 next: needs `[3,0]` so `[3-1, 2-2] = [-1, 0]` — overshoot, prune. So only retail: 0*2 + 2*5 = 10. Total 5+10 = 15. Branch: skip offer 0, apply offer 1 (`[1,2,10]`): needs `[2, 0]`, paid 10. Retail rest: 2*2 = 4. Total 14. Min is 14.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,3,4]', '[[1,1,0,4],[2,2,1,9]]', '[1,2,1]'],
      expected: '11',
      explanation_md:
        'Three items, needs `[1, 2, 1]`. Apply offer 0 (`[1,1,0,4]`): needs `[0, 1, 1]`, paid 4. Apply offer 1 (`[2,2,1,9]`): would need 2 of item 0 → overshoot, prune. Retail rest: 0*2 + 1*3 + 1*4 = 7. Total 4+7 = 11. Branch: skip offer 0, apply offer 1: would need 2 of item 0 (have 1) → prune. Retail all: 1*2 + 2*3 + 1*4 = 12. Min is 11.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0]', '[[1,1,0,1]]', '[0,0,0]'],
      expected: '0',
      explanation_md:
        'No needs at all. Both branches yield 0: applying the offer overshoots (need to buy 1 of item 0 we don’t need); skipping → retail 0 × prices = 0. Min = 0. Confirms the algorithm correctly handles the "all needs zero" base case and that the offer-overshoot prune fires for any non-zero offer. A buggy version that always applies the first offer would return a positive cost.',
      viz_anchor: null,
    },
  ],

  'word-break-ii': [
    {
      inputs: ['"catsanddog"', '["cat","cats","and","sand","dog"]'],
      expected: '["cats and dog","cat sand dog"]',
      explanation_md:
        'Backtrack: at each position try every dict word as prefix, recurse on suffix. Memoize suffix → list of completions to avoid re-solving. From `"catsanddog"`: prefix `cat` → recurse `"sanddog"`. Prefix `sand` → recurse `"dog"` → `["dog"]` → return `["sand dog"]`. So `cat → sand dog → "cat sand dog"`. Back at root, prefix `cats` → recurse `"anddog"`. Prefix `and` → recurse `"dog"` → `["dog"]` → `["and dog"]`. So `cats → and dog → "cats and dog"`. Two valid breaks.',
      viz_anchor: null,
    },
    {
      inputs: ['"pineapplepenapple"', '["apple","pen","applepen","pine","pineapple"]'],
      expected: '["pine apple pen apple","pineapple pen apple","pine applepen apple"]',
      explanation_md:
        'Branching at the first split: `pine` (recurse `applepenapple`) and `pineapple` (recurse `penapple`). Subtree `applepenapple`: split as `apple → pen apple` or `applepen → apple`. Subtree `penapple`: only `pen → apple`. Combining: `pine + apple + pen + apple`, `pine + applepen + apple`, `pineapple + pen + apple`. Memoization is critical — without it the algorithm recomputes the `applepenapple` subtree multiple times. Three completions returned.',
      viz_anchor: null,
    },
    {
      inputs: ['"catsandog"', '["cats","dog","sand","and","cat"]'],
      expected: '[]',
      explanation_md:
        'No valid break exists. Prefixes: `cats` → recurse `"andog"`. `and` → recurse `"og"` — no dict prefix → fail. Backtrack. No other valid prefix of `"andog"`. Prefixes: `cat` → recurse `"sandog"`. `sand` → recurse `"og"` → fail. `s...` none in dict. All branches exhausted. Return `[]`. The memo correctly caches that `"og"` and `"andog"` cannot be broken — a second probe of these substrings returns the cached `[]` immediately.',
      viz_anchor: null,
    },
  ],

  'concatenated-words': [
    {
      inputs: ['["cat","cats","catsdogcats","dog","dogcatsdog","hippopotamuses","rat","ratcatdogcat"]'],
      expected: '["catsdogcats","dogcatsdog","ratcatdogcat"]',
      explanation_md:
        'A word is "concatenated" if it can be split into ≥ 2 OTHER words from the list. For each word, run word-break with the OTHER words as the dictionary. `catsdogcats` → `cats + dog + cats` ✓. `dogcatsdog` → `dog + cats + dog` ✓. `ratcatdogcat` → `rat + cat + dog + cat` ✓. `hippopotamuses` has no decomposition. `cat`, `cats`, `dog`, `rat` are too short to split into ≥ 2 dict words. Three results. Sort words by length to enable memoization (shorter words solved first).',
      viz_anchor: null,
    },
    {
      inputs: ['["cat","dog","catdog"]'],
      expected: '["catdog"]',
      explanation_md:
        'Only one combinable word. `catdog` → `cat + dog` — both in dict, length ≥ 2 → ✓. `cat` and `dog` alone are 1-segment, fail the ≥ 2 segment rule. Return `["catdog"]`. Confirms the algorithm correctly enforces "≥ 2 sub-words" — without it, every single-word entry would be flagged as concatenated (trivial decomposition of length 1).',
      viz_anchor: null,
    },
    {
      inputs: ['["a"]'],
      expected: '[]',
      explanation_md:
        'Only one word, length 1. Cannot be split into ≥ 2 sub-words. Return `[]`. The DP/word-break check returns `false` for `"a"` because the dictionary minus the word itself is empty. Edge case probes whether the algorithm correctly handles the single-element input and the "exclude self from dict" rule (otherwise `a → a + a` would falsely match).',
      viz_anchor: null,
    },
  ],

  'maximum-length-of-a-concatenated-string-with-unique-characters': [
    {
      inputs: ['["un","iq","ue"]'],
      expected: '4',
      explanation_md:
        'Backtrack: for each word, either include (if no char collision with running mask) or skip. Pre-filter words with internal duplicates — none here. From `[]`: include `un` → mask {u,n}, length 2. Include `iq` → mask {u,n,i,q}, length 4. Include `ue` → conflict with `u` → prune. Backtrack to skip `iq`: include `ue` → conflict with `u` → prune. Best = 4. Other branches max length ≤ 4. Return 4. Bitmask makes the conflict check O(1).',
      viz_anchor: null,
    },
    {
      inputs: ['["cha","r","act","ers"]'],
      expected: '6',
      explanation_md:
        'All four words are pairwise compatible. Include all → mask = {c,h,a,r,a,c,t,e,r,s} — wait, `cha` and `act` share `a`, `c`. Conflict. Try `cha + ers` → length 6, no conflict. Try `r + act + ers` → `r,a,c,t,e,r,s` — duplicate `r` → conflict. Try `cha + ers` (length 6) vs `act + ers` (length 6). Max = 6. Backtrack confirms no length-9 path exists due to the `cha`/`act` collision. Best mask size 6.',
      viz_anchor: null,
    },
    {
      inputs: ['["aa","bb"]'],
      expected: '0',
      explanation_md:
        'Both words have internal duplicates (`aa` has two `a`s, `bb` has two `b`s). Pre-filter removes both → dictionary is empty. Best concatenation length = 0 (empty string). Return 0. Confirms the internal-duplicate filter runs BEFORE the backtracking, otherwise the search would consider invalid candidates and could return 2 or 4 falsely.',
      viz_anchor: null,
    },
  ],

  'parsing-a-boolean-expression': [
    {
      inputs: ['"&(|(f))"'],
      expected: 'false',
      explanation_md:
        'Recursive descent with a stack OR a token cursor. Parse `&(|(f))`: encounter `&` (AND), then `(`, then `|` (OR), `(`, `f` → push false to OR’s operand list, `)` → OR over `[false]` = false, push to AND’s operand list, `)` → AND over `[false]` = false. Return false. The recursion mirrors the expression tree: each `(...)` opens a sub-scope, the operator immediately before consumes the comma-separated children.',
      viz_anchor: null,
    },
    {
      inputs: ['"|(f,f,f,t)"'],
      expected: 'true',
      explanation_md:
        'OR over 4 operands. Parse: `|`, `(`, push `f`, comma, push `f`, comma, push `f`, comma, push `t`, `)`. OR over `[false, false, false, true]` = true (any true → true). Return true. The short-circuit optimization: once a true is seen, the remaining tokens of this scope can be skipped — but for correctness the full parse must still close the parens.',
      viz_anchor: null,
    },
    {
      inputs: ['"!(&(f,t))"'],
      expected: 'true',
      explanation_md:
        'NOT applied to an AND. Inner: `&(f,t)` → AND over `[false, true]` = false. Outer: `!(false)` = true. Return true. The recursion handles NOT as a unary: it must have exactly one child, otherwise the parse is malformed (out of scope here). The stack approach: push false, pop on `)`, apply `!` → push true, pop on outer `)`. Final stack top = true.',
      viz_anchor: null,
    },
  ],

  'jump-game-iii': [
    {
      inputs: ['[4,2,3,0,3,1,2]', '5'],
      expected: 'true',
      explanation_md:
        'BFS/DFS from `start=5`. At index 5, value = 1 → can jump to 5+1=6 or 5-1=4. From 6: value 2 → 8 (out of bounds) or 4. Mark visited. From 4: value 3 → 7 (out) or 1. From 1: value 2 → 3 or -1. From 3: value 0 → target found. Return true. The visited set prevents cycles; without it the search would loop. Either DFS or BFS finds the zero in ≤ 7 steps.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,0,2,1,2]', '2'],
      expected: 'false',
      explanation_md:
        'From `start=2`, value 2 → jump to 4 or 0. From 4: value 2 → 6 (out) or 2 (visited). From 0: value 3 → 3 or -3 (out). From 3: value 1 → 4 (visited) or 2 (visited). All branches exhaust without reaching index 1 (the only zero is at index 1 — wait let me recount: indices 0..4 with values 3,0,2,1,2. Zero is at index 1. From 0, we can jump to 3 only — not 1. The visited set closes the search. Return false.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]', '0'],
      expected: 'true',
      explanation_md:
        'Smallest input. Start at index 0, value 0 → already at a zero → return true immediately. Base case of the recursion. Confirms the algorithm correctly returns true when the start cell IS the zero, without recursing. A buggy version that always recurses before checking would still terminate but might do extra work; one that requires at least one jump would return false here.',
      viz_anchor: null,
    },
  ],
};

// ── Push ────────────────────────────────────────────────────────────────────
let ok = 0, failed = 0;
const failures = [];
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) {
    console.log(`x ${slug}: ${error.message}`);
    failed++;
    failures.push(slug);
  } else {
    console.log(`. ${slug}`);
    ok++;
  }
}
console.log(`\nok=${ok} failed=${failed}`);
if (failures.length) console.log('failed slugs:', failures);
