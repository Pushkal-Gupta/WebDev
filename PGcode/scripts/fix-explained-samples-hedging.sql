-- Purge hedging / self-doubt phrasing from live explained_samples content.
-- Each UPDATE rewrites exactly one sample inside the JSONB array, matched by a
-- marker substring that only exists in the hedged version (idempotent: once
-- rewritten, the marker is gone and re-runs are no-ops).
-- Where the hedge existed because the seeded `expected` value was wrong, the
-- expected value is corrected to the hand-verified answer.
-- Apply: supabase db query --linked --file scripts/fix-explained-samples-hedging.sql

-- 1. swapping-nodes-in-a-linked-list: false-start retrace removed.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me retrace') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Canonical LC example. Swap VALUES of the k-th node from the front and the k-th from the back. k=2. Two-pointer trick: advance `first` k steps to node 2 — the front swap target. Then start `second` at the head and advance both until `first` reaches the tail: `first=3, second=2` → `first=4, second=3` → `first=5, second=4`. `second` now sits on the k-th node from the end without the length ever being computed. Swap values of node 2 (=2) and node 4 (=4) → list becomes `[1,4,3,2,5]`.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'swapping-nodes-in-a-linked-list';

-- 2. maximum-sum-of-two-non-overlapping-subarrays: expected corrected 23 -> 25
--    (best disjoint L=3 windows are 12 at 0..2 and 13 at 7..9).
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Hmm — expected says 23') > 0
    THEN elem || jsonb_build_object('expected', '25', 'explanation_md', $md$Equal-length subarrays. Prefix sums give every L=3 window: `[4,5,3]=12, [5,3,2]=10, [3,2,4]=9, [2,4,4]=10, [4,4,1]=9, [4,1,4]=9, [1,4,5]=10, [4,5,4]=13, [5,4,1]=10, [4,1,4]=9`. The two best non-overlapping windows are `[4,5,4]=13` at indices 7..9 and `[4,5,3]=12` at indices 0..2 — disjoint, with a four-element gap across 3..6. Sum `13+12=25`. The single-pass DP slides the second window while tracking the best first-window sum that ends before it; running the windows in either order returns the same 25, which is why the implementation must check both orderings.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'maximum-sum-of-two-non-overlapping-subarrays';

-- 3. find-the-index-of-the-first-occurrence-in-a-string: LPS corrected to
--    [0,0,0,1,0] and the KMP fallback traced cleanly.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me redo') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Algorithmically interesting: overlapping false starts. LPS for `"issip"` = [0, 0, 0, 1, 0] — the fourth character `i` matches the prefix `i`. Walk the haystack: `m` mismatches at `i=0`; the match starts at `i=1` and `i,s,s,i` align needle indices 0..3. At `i=5, j=4` the comparison is haystack `s` vs needle `p` — mismatch. KMP falls back to `j = lps[3] = 1` WITHOUT moving `i`: the `i` at haystack index 4 is reused as a fresh one-character prefix match. From `i=5, j=1`: `s==s`, `s==s`, `i==i`, `p==p` — `j` reaches 5 at `i=9`. Match at `i - j = 9 - 5 = 4`. Return `4`. The LPS fallback is exactly what prevents re-scanning haystack characters already validated.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'find-the-index-of-the-first-occurrence-in-a-string';

-- 4. isomorphic-strings: false conflict claim removed; both maps are consistent.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'wait, let me re-check') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$A longer canonical case. Forward map: p→t, a→i, p→t (consistent re-use), e→l, r→e. Reverse map: t→p, i→a, l→e, e→r. Every character maps one-to-one in both directions — `e→l` in the forward map and `r→e` coexist without conflict because the forward and reverse maps are separate structures keyed on different alphabets. Return true. Proves the algorithm handles longer strings with repeated characters and multiple distinct character classes.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'isomorphic-strings';

-- 5. 01-matrix: sample input [[1]] is invalid per spec (needs at least one 0);
--    replaced with the [[0]] trivial case the explanation intended.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me adjust') > 0
    THEN elem || jsonb_build_object('inputs', jsonb_build_array('[[0]]'), 'expected', '[[0]]', 'explanation_md', $md$Edge case: 1x1 all-zero grid. `[[0]]` → `[[0]]`. The single `0` needs no propagation: the queue starts with `(0,0)` and never expands. Return the matrix unchanged. Proves the algorithm handles the trivial case. (An all-1s grid is invalid input — the LC spec guarantees at least one `0`.)$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = '01-matrix';

-- 6. island-perimeter: the recount stub replaced with the full 6-shared-edge count.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'hmm let me recount') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$The canonical LC example. Each `1` cell contributes 4 to the perimeter, minus 2 per shared edge with an adjacent `1` (a shared edge erases one side from each of the two cells). The grid has 7 land cells → 7 × 4 = 28. Shared edges: (0,1)-(1,1), (1,0)-(1,1), (1,1)-(1,2), (1,1)-(2,1), (2,1)-(3,1), (3,0)-(3,1) — six in total. Perimeter = 28 − 2×6 = 16. **O(m·n)** time.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'island-perimeter';

-- 7. max-points-on-a-line: the 4-collinear set is (4,1),(3,2),(2,3),(1,4) on y=-x+5.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'let me re-check') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Algorithmically interesting: a 4-point collinear set hidden among 6 points. The line `y = -x + 5` passes through (4,1), (3,2), (2,3), and (1,4). Anchor (4,1): slope to (3,2) is `(dy,dx) = (1,-1)`; to (2,3) is `(2,-2)` → reduced `(1,-1)`; to (1,4) is `(3,-3)` → reduced `(1,-1)`; to (1,1) is `(0,-3)` → `(0,1)` after sign normalisation; to (5,3) is `(2,1)`. Bucket `(1,-1)` holds 3 points → 3 + anchor = 4. The rival line `y = x/2 + 1/2` through (1,1), (3,2), (5,3) tops out at 3. Return 4. The gcd-reduced rational key with a fixed sign convention is what lands all three slope computations in the same bucket.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'max-points-on-a-line';

-- 8. jump-game-iii: mid-sentence recount removed.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'wait let me recount') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$From `start=2` (value 2) the moves are 2+2=4 and 2−2=0. From 4 (value 2): 6 is out of bounds, 2 is visited. From 0 (value 3): 3 is reachable, −3 is out of bounds. From 3 (value 1): 4 and 2 are both visited. The search exhausts after visiting {2, 4, 0, 3} — index 1, the only zero, is never reached. The visited set closes the search. Return false.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'jump-game-iii';

-- 9. segment-tree: broken mid-derivation parenthetical replaced with the clean decomposition.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'let me re-derive') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Canonical primitive. Build a segment tree over `[1,3,5,7,9,11]` storing range SUM: the root covers [0,5] with sum 36, its children cover [0,2]=9 and [3,5]=27, and so on down to single-index leaves. `query(1,3)` decomposes the range into O(log n) disjoint node segments and sums them: indices 1, 2, 3 hold 3+5+7 = 15. `update(1, 10)` rewrites index 1 from 3 to 10 — a delta of +7 — and propagates that delta up through every ancestor of the leaf. `query(1,3)` now returns 15 + 7 = 22. Each op is O(log n).$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'segment-tree';

-- 10. shortest-path-with-alternating-colors: full verified 7-step alternating chain.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me reconsider') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Algorithmically interesting: alternation forces a long detour. The all-red chain 0→1→2→3→4 is illegal (four RED edges in a row), so node 4 needs an alternating walk. Multi-state BFS over (node, last_color): 0 -R→ 1 (d=1), 1 -B→ 2 (d=2), 2 -R→ 3 (d=3), 3 -B→ 1 (d=4), 1 -R→ 2 (d=5), 2 -B→ 3 (d=6), 3 -R→ 4 (d=7). The blue back-edge 3→1 re-enters nodes 1, 2, 3 in the OPPOSITE color state, which is why dist[4]=7 while dist[3]=3. Return `[0,1,2,3,7]`. A single-color BFS cannot represent that second visit — tracking (node, color) pairs is mandatory.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'shortest-path-with-alternating-colors';

-- 11. all-paths-from-source-to-target: expected corrected [] -> [[0,2]]
--     (adjacency [[2],[],[1]] has the single path 0->2 to target n-1=2).
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me restate') > 0
    THEN elem || jsonb_build_object('expected', '[[0,2]]', 'explanation_md', $md$3-node graph, source 0, target n−1 = 2. Adjacency `[[2],[],[1]]` means 0→2, 1→(nothing), 2→1. DFS from 0 visits child 2 — the target — and records `[0,2]`. The edge 2→1 leads away from the target and contributes no path. Result: `[[0,2]]`. An empty result requires a source with no route to the target (node 1 here has no outgoing edges at all); this case confirms the single direct edge is captured as a complete path.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'all-paths-from-source-to-target';

-- 12. task-scheduler-ii: expected corrected 10 -> 8 (verified against the
--     LC 2365 rule next legal day = last + space + 1).
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me retrace day4 again') > 0
    THEN elem || jsonb_build_object('expected', '8', 'explanation_md', $md$Algorithmically interesting: the cooldown forces idling. space=4, so a repeated type's next legal day is `last + space + 1 = last + 5`. day1 type1 (last1=1), day2 type2 (last2=2), day3 type3 (last3=3). The second type1 arrives at currentDay=4 but its legal day is max(4, 1+5) = 6 — idle days 4 and 5, place on day6 (last1=6). The second type2: legal = max(7, 2+5) = 7 → day7. The second type3: legal = max(8, 3+5) = 8 → day8. Answer `8`. The case exposes whether the implementation advances `currentDay = legal + 1` after each placement and computes the gap as `space + 1`, not `space`.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'task-scheduler-ii';

-- 13. count-negative-numbers-in-a-sorted-matrix: full staircase trace, 4+2+1+1 = 8.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'let me retrace') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Canonical LC example. The matrix is sorted non-increasing along rows and columns. Walk a staircase from the top-right corner: a negative cell means everything below it in that column is negative too — count `m − r` and move left; a non-negative cell means move down. `(0,3)=-1`: count 4, left. `(0,2)=2`: down. `(1,2)=1`: down. `(2,2)=-1`: count 2, left. `(2,1)=1`: down. `(3,1)=-1`: count 1, left. `(3,0)=-1`: count 1, off the grid. Total 4+2+1+1 = 8. O(m+n) vs O(mn) naive.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'count-negative-numbers-in-a-sorted-matrix';

-- 14. minimum-cost-to-make-at-least-one-valid-path-in-a-grid: clean zig-zag trace
--     (also fixes the arrow legend: 2 = left, not down).
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me retrace') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Canonical LC example. 0-1 BFS with a deque: following a cell's arrow costs 0 (push front), overriding it costs 1 (push back). Arrows: 1=right, 2=left, 3=down, 4=up. Row 0 (all 1s) carries you right for free from (0,0) to (0,3); pay 1 to turn down into (1,3). Row 1 (all 2s) carries you left for free to (1,0); pay 1 to turn down into (2,0). Row 2 carries you right to (2,3); pay 1 to drop into (3,3) — the destination. Total modifications: 3. Return `3`. The deque ordering settles cells in nondecreasing cost, so 3 is minimal.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'minimum-cost-to-make-at-least-one-valid-path-in-a-grid';

-- 15. design-authentication-manager: expected corrected 1 -> 0 (both tokens are
--     expired at time 4 under the strict > rule the explanation itself derives).
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'let me recheck') > 0
    THEN elem || jsonb_build_object('expected', '"[null,null,null,null,0]"', 'explanation_md', $md$Algorithmically interesting: renew on an EXPIRED token must be a no-op. ttl=2. `generate("a", 1)`: expiry = 3. `generate("b", 2)`: expiry = 4. `renew("a", 3)`: at time 3, a's expiry IS 3 — not strictly greater than the current time — so a is already expired and the renew is a no-op. `countUnexpired(4)`: a's expiry 3 is not > 4, and b's expiry 4 is not > 4 — both expired. Count = 0. Both checks use strict `>`: a token dies at the exact instant `currentTime == expiry`, the canonical off-by-one trap.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'design-authentication-manager';

-- 16. distinct-echo-substrings: the three echoes enumerated cleanly.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Let me recompute') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$Canonical LC example. Count DISTINCT substrings of the form `a+a` (a non-empty string concatenated with itself). In `"abcabcabc"` every length-6 window is an echo: `"abcabc"` = `"abc"+"abc"`, `"bcabca"` = `"bca"+"bca"`, `"cabcab"` = `"cab"+"cab"`. No shorter echo exists — no doubled single character (`"aa"`, `"bb"`, `"cc"` never occur) and no length-4 echo like `"abab"` appears. The distinct set is {abcabc, bcabca, cabcab} → 3. Rolling hash over each (start, even length) pair with set-based dedup is the standard O(n²) approach.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'distinct-echo-substrings';

-- 17. next-greater-element-ii: clean two-pass monotonic-stack trace.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'should be 2... Re-trace') > 0
    THEN elem || jsonb_build_object('explanation_md', $md$The canonical LC example for circular arrays. Walk the array TWICE with index `i % n`, keeping a monotonic decreasing stack of unresolved indices. Pass 1: `1`(i=0) push → `[0]`. `2`(i=1) > 1 → pop, ans[0]=2, push → `[1]`. `1`(i=2) push → `[1,2]`. Pass 2: at i=3 the value 1 is not greater than the stack top's value 1 — nothing resolves. At i=4 the value 2 pops index 2 (ans[2]=2) but leaves index 1 (2 is not strictly greater than 2). At i=5 nothing resolves. Index 1 survives both passes → ans[1]=-1. Final `[2,-1,2]`. **O(n)** time — each index pushes and pops at most once.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'next-greater-element-ii';

-- 18. reverse-pairs: expected corrected 0 -> 1 (-5 > 2*(-5) = -10 is true).
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'Actually rechecking') > 0
    THEN elem || jsonb_build_object('expected', '1', 'explanation_md', $md$Algorithmically interesting: negatives flip the intuition. With `nums = [-5,-5]`, the only pair is `(0,1)`: `-5 > 2*(-5) = -10` is TRUE, so the count is 1. Doubling a negative makes it MORE negative, so equal negative values DO form a reverse pair — the opposite of equal positives (`5 > 10` is false). The trap: an implementation that computes `2*nums[j]` in unsigned arithmetic reads `-10` as a huge positive and misses the pair. Signed 64-bit arithmetic gives the correct count of `1`.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'reverse-pairs';

-- 19. design-skiplist: expected corrected — 3 adds minus 2 erases leaves one copy,
--     so the final search(5) is true.
UPDATE "PGcode_problems" p SET explained_samples = (
  SELECT jsonb_agg(
    CASE WHEN strpos(elem->>'explanation_md', 'No — count: 3 adds') > 0
    THEN elem || jsonb_build_object('expected', '[null,null,null,null,true,true,true,true,true]', 'explanation_md', $md$Algorithmically interesting: duplicate keys. The LC spec allows duplicates, and each `erase` removes exactly ONE occurrence. add(5) three times pushes three independent nodes, each with its own coin-flipped tower. search(5) → true. erase(5) removes one copy (two remain) → true. search(5) → true. erase(5) removes another (one remains) → true. search(5) → still true: 3 adds minus 2 erases leaves one copy in the list. Duplicates vanish only when ALL copies are erased — store every occurrence (or a per-key count), never a plain "exists" set.$md$)
    ELSE elem END ORDER BY ord)
  FROM jsonb_array_elements(p.explained_samples) WITH ORDINALITY AS t(elem, ord)
) WHERE p.id = 'design-skiplist';
