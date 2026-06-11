#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 11 (30 problems).
// Focus area: linked list.
// Shape: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch11.mjs

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
  'reverse-linked-list-ii': [
    {
      inputs: ['[1,2,3,4,5]', '2', '4'],
      expected: '[1,4,3,2,5]',
      explanation_md:
        'Canonical LC example. Reverse the sublist between positions `left=2` and `right=4` (1-indexed). Walk to the node BEFORE position 2: `prev=1`. Now reverse 3 nodes starting at `curr=2`. Standard reversal: each step, splice `curr.next` to the front. After step 1: chain near prev is `1 -> 3 -> 2 -> 4 -> 5` (3 moves to front of sublist). After step 2: `1 -> 4 -> 3 -> 2 -> 5`. Done — `prev` remained at node `1` throughout, `curr` stayed at node `2` (which sinks to the tail of the reversed window). Output `[1,4,3,2,5]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]', '1', '1'],
      expected: '[5]',
      explanation_md:
        'Edge case: single node, left==right. The reversal window has length 1 — nothing to swap. Loop body runs zero iterations because `right-left = 0`. `prev` is the dummy, `curr` is node `5`. Output `[5]`. Proves the algorithm handles the degenerate window: a buggy version that runs `right-left+1` iterations would do one redundant pointer rewire and crash on `curr.next = None`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]', '1', '5'],
      expected: '[5,4,3,2,1]',
      explanation_md:
        'Reverse the ENTIRE list — `left=1, right=5`. The dummy-node trick matters here: `prev = dummy`, `curr = head = 1`. After 4 splice-to-front moves, the chain is `dummy -> 5 -> 4 -> 3 -> 2 -> 1`. Return `dummy.next`. Without the dummy, the head pointer would still point at `1` (now the tail), losing access to the new head `5`. This is the classic test for whether the dummy-node abstraction is wired correctly.',
      viz_anchor: null,
    },
  ],

  'remove-nth-node-from-end-of-list': [
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: '[1,2,3,5]',
      explanation_md:
        'Canonical LC example. Two-pointer one-pass. Set `fast` and `slow` to dummy. Advance `fast` by `n=2` steps: `fast=2`. Now move both until `fast.next is None`. Step: `fast=3, slow=1`. `fast=4, slow=2`. `fast=5, slow=3`. Stop — `fast.next=None`. `slow=3`, and `slow.next=4` is the node to delete. Wire `slow.next = slow.next.next = 5`. Result `[1,2,3,5]`. The gap of `n` between `fast` and `slow` guarantees `slow` lands one-before the target when `fast` hits the tail.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '[]',
      explanation_md:
        'Edge case: single node, remove the only one. Without the dummy, deleting `head` requires special casing. WITH dummy: `fast=dummy, slow=dummy`. Advance `fast` by 1: `fast=1`. Loop: `fast.next is None` immediately, skip. `slow=dummy`, `slow.next=1` is target. Wire `dummy.next = None`. Return `dummy.next = None` → `[]`. The dummy-node pattern absorbs the head-deletion edge case cleanly — no `if head is target` branch needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '1'],
      expected: '[1]',
      explanation_md:
        'Remove the tail. `fast=dummy, slow=dummy`. Advance fast by 1: `fast=1`. Loop: `fast=2, slow=1`. Stop — `fast.next=None`. `slow=1`, `slow.next=2` is target (the tail). Wire `slow.next = None`. Result `[1]`. Proves the gap-of-n pattern correctly identifies the tail when n=1. A naive "walk to end, count back" would need two passes; this version handles it in one.',
      viz_anchor: null,
    },
  ],

  'odd-even-linked-list': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[1,3,5,2,4]',
      explanation_md:
        'Canonical LC example. Maintain two chains: `odd` starts at head (`1`), `even` starts at head.next (`2`). Save `evenHead=2` for stitching later. Walk: `odd.next = even.next` (link `1->3`), advance `odd=3`. `even.next = odd.next` (link `2->4`), advance `even=4`. Repeat: `odd.next=5`, `odd=5`. `even.next=None`, `even=None`. Stop. Stitch: `odd.next = evenHead` (link `5->2`). Final chain: `1->3->5->2->4`. The two-pointer weave runs in O(n) with O(1) space — no extra arrays.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1,3,5,6,4,7]'],
      expected: '[2,3,6,7,1,5,4]',
      explanation_md:
        'Index-based grouping (not value-based): positions 1,3,5,7 → `[2,3,6,7]`, positions 2,4,6 → `[1,5,4]`. The algorithm interleaves: odd chain `2 -> 3 -> 6 -> 7`, even chain `1 -> 5 -> 4`. After the loop, `odd=7, even=None` (odd ends one step ahead since list length is odd). Stitch `7 -> evenHead=1`. Result `[2,3,6,7,1,5,4]`. A common bug is grouping by VALUE — the problem cares about POSITION only, which is why a `2` at index 1 lands in the odd group.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '[1]',
      explanation_md:
        'Single node — odd group is the whole list, even group is empty. `odd=1, even=None`. The while-loop guard `even and even.next` short-circuits on `even is None`. Stitch step: `odd.next = evenHead = None` (already null). Return head. A buggy implementation that dereferences `even.next` without the guard would crash. Proves both that the empty-even chain is handled and that the guard order matters: `even` first, then `even.next`.',
      viz_anchor: null,
    },
  ],

  'add-two-numbers-ii': [
    {
      inputs: ['[7,2,4,3]', '[5,6,4]'],
      expected: '[7,8,0,7]',
      explanation_md:
        'Canonical LC example. Most-significant digit first: numbers are `7243` and `564`, sum `7807`. Push both lists onto stacks, then pop in lockstep adding with carry — this simulates right-to-left addition. Pop pass: `3+4=7`, push to result. `4+6=10`, carry=1, push `0`. `2+5+1=8`, push `8`. `7+0=7`, push `7`. Result reversed: `[7,8,0,7]`. Stacks are the trick — they reverse access order without mutating the input lists. **O(n+m)** time, **O(n+m)** stack space.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4,3]', '[5,6,4]'],
      expected: '[8,0,7]',
      explanation_md:
        'Numbers `243 + 564 = 807`. Stack pop: `3+4=7`, push. `4+6=10`, carry=1, push `0`. `2+5+1=8`, push `8`. No carry-out. Result `[8,0,7]`. Note the algorithm prepends each new digit (or pushes then reverses the linked-list build), so the final chain reads most-significant first. A bug that appends instead would produce `[7,0,8]` — the reverse of correct.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]', '[5]'],
      expected: '[1,0]',
      explanation_md:
        'Single-digit sum forces a new leading carry. `5+5=10`, push `0`, carry=1. Both stacks empty, carry remains — push `1`. Result chain `1 -> 0`. Output `[1,0]`. Proves the carry-out-of-the-msb branch fires: a bug that stops once both stacks are empty would drop the leading 1 and return `[0]`. The loop guard must be `s1 or s2 or carry`, not just `s1 or s2`.',
      viz_anchor: null,
    },
  ],

  'partition-list': [
    {
      inputs: ['[1,4,3,2,5,2]', '3'],
      expected: '[1,2,2,4,3,5]',
      explanation_md:
        'Canonical LC example. Build two chains: `less` for values < `x=3`, `geq` for values >= 3. Walk: `1<3` → less. `4>=3` → geq. `3>=3` → geq. `2<3` → less. `5>=3` → geq. `2<3` → less. Chains: less = `1 -> 2 -> 2`, geq = `4 -> 3 -> 5`. Stitch `less.tail.next = geq.head`, `geq.tail.next = None`. Result `[1,2,2,4,3,5]`. Original relative order is preserved within each group — this is a STABLE partition, the LC problem requires it.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1]', '2'],
      expected: '[1,2]',
      explanation_md:
        'Boundary case: pivot `x=2` is present. `2>=2` → geq. `1<2` → less. Chains: less=`1`, geq=`2`. Stitch: `1 -> 2`. Result `[1,2]`. Confirms the comparison is `<` (strict) for the less group — values EQUAL to x go to the geq side. A bug using `<=` would put both nodes in the less group and break the partition contract.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '1'],
      expected: '[]',
      explanation_md:
        'Empty list. Both `less` and `geq` start as dummy-only. Walk loop runs zero iterations. Stitch: `less.tail.next = geq.head = None`, return `less.dummy.next = None`. Output `[]`. The dummy-node pattern absorbs the empty case without an `if head is None` branch — same code path as a populated list.',
      viz_anchor: null,
    },
  ],

  'sort-list': [
    {
      inputs: ['[4,2,1,3]'],
      expected: '[1,2,3,4]',
      explanation_md:
        'Canonical LC example — merge sort on a linked list, **O(n log n)** time, **O(log n)** recursion stack. Find middle with `slow`/`fast` (slow=2, fast lands at tail). Split into `[4,2]` and `[1,3]`. Recurse: `[4,2]` → split to `[4]` and `[2]` → merge → `[2,4]`. `[1,3]` already sorted → `[1,3]`. Merge `[2,4]` and `[1,3]`: pick 1, pick 2, pick 3, pick 4 → `[1,2,3,4]`. The fast/slow split is the trick — no random access, but we still find the midpoint in one pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,5,3,4,0]'],
      expected: '[-1,0,3,4,5]',
      explanation_md:
        'Odd length with negatives. Split: slow lands at index 2 (`3`); chain becomes `[-1,5,3]` and `[4,0]`. Recurse further: `[-1,5,3]` splits to `[-1,5]` and `[3]`; `[-1,5]` already sorted; merge `[-1,5]` with `[3]` → `[-1,3,5]`. Right side: `[4,0]` splits, merges to `[0,4]`. Final merge `[-1,3,5]` with `[0,4]`: pick -1, pick 0, pick 3, pick 4, pick 5 → `[-1,0,3,4,5]`. Negative values cause no issue — comparison is sign-correct.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'Empty list. Base case `head is None or head.next is None` fires immediately, return `head=None`. Output `[]`. No recursion, no split, no merge. Proves the base case correctly handles the boundary — a missing `head is None` check would crash inside the split-middle pointer walk on `slow=None.next`.',
      viz_anchor: null,
    },
  ],

  'reorder-list': [
    {
      inputs: ['[1,2,3,4]'],
      expected: '[1,4,2,3]',
      explanation_md:
        'Canonical LC example — three-step combo. Step 1, find middle: `slow=2, fast` walks to tail. Split into `[1,2]` and `[3,4]`. Step 2, reverse the second half: `[3,4]` → `[4,3]`. Step 3, weave: take from front and back alternately. `1 -> 4 -> 2 -> 3`. Output `[1,4,2,3]`. Each step is **O(n)**; in-place with no extra list. A common bug is forgetting to terminate the first half at the split — without it, the weave produces a cycle.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[1,5,2,4,3]',
      explanation_md:
        'Odd length: middle is `3`. With slow/fast, `slow` lands at `3`, splitting into `[1,2,3]` and `[4,5]`. Reverse second half: `[5,4]`. Weave: `1 -> 5 -> 2 -> 4 -> 3`. The odd middle element stays in place at the tail — naturally absorbed by the weave since the first half is one node longer. Output `[1,5,2,4,3]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'Single node — nothing to reorder. The find-middle returns `slow=1`, second half is empty. Reverse of empty is empty. Weave loop runs zero iterations. Output `[1]`. Edge case proves the empty-second-half path is safe: a buggy version that derefs `second.next` without a None guard would crash.',
      viz_anchor: null,
    },
  ],

  'remove-duplicates-from-sorted-list': [
    {
      inputs: ['[1,1,2]'],
      expected: '[1,2]',
      explanation_md:
        'Canonical LC example. Single-pass walker `curr=1`. Check `curr.next.val == curr.val`? `1==1` yes — skip: `curr.next = curr.next.next = 2`. Advance? No — recheck same `curr`. Check `2==1`? No, advance `curr=2`. Check `curr.next` is None → stop. Result `[1,2]`. The pattern is: when matching, splice without advancing (to catch runs of >2 duplicates); when not matching, advance. **O(n)** single pass, in-place.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,2,3,3]'],
      expected: '[1,2,3]',
      explanation_md:
        'Two runs of duplicates. `curr=1, next=1`: splice → `1 -> 2 -> 3 -> 3`. Recheck: `1.next=2`, no match, advance `curr=2`. `curr=2, next=3`: no match, advance `curr=3`. `curr=3, next=3`: splice → `3 -> None`. Recheck: `curr.next=None`, stop. Result `[1,2,3]`. The "don\'t advance after splice" pattern is critical for catching back-to-back-to-back duplicates like `[1,1,1]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'Empty list. Loop guard `curr and curr.next`: `curr is None` fails immediately. Return head=None. Output `[]`. The guard order matters: checking `curr` BEFORE `curr.next` prevents a None-deref. A buggy `curr.next and curr` would crash because Python evaluates left-to-right and `None.next` blows up first.',
      viz_anchor: null,
    },
  ],

  'remove-duplicates-from-sorted-list-ii': [
    {
      inputs: ['[1,2,3,3,4,4,5]'],
      expected: '[1,2,5]',
      explanation_md:
        'Canonical LC example — remove ALL nodes that have a duplicate, not just the dupes. Need a `prev` pointer that lags behind so we can excise an entire duplicate run. Use a dummy node. `prev=dummy, curr=1`. `1!=2` → both prev and curr advance. `2!=3` → advance. `3==3` → mark val=3, skip ALL 3s: `curr=4`. Wire `prev.next=4`. `4==4` → skip all 4s: `curr=5`. Wire `prev.next=5`. `5.next=None` → stop. Result `[1,2,5]`. The dummy is critical because the head itself could be part of a duplicate run.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,2,3]'],
      expected: '[2,3]',
      explanation_md:
        'The head itself is in a duplicate run. `prev=dummy, curr=1`. `curr.val==curr.next.val` (1==1) → mark val=1, walk curr forward while val matches: `curr=1, 1, 2`. Wire `prev.next=2`. Continue: `2!=3` → advance both. `3.next=None`. Result `[2,3]`. Without the dummy, returning `head` would still point at the deleted `1`. The dummy lets us return `dummy.next` after all the splice rewiring — handles the head-deletion case for free.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: '[]',
      explanation_md:
        'Entire list is one duplicate run. `prev=dummy, curr=1`. `1==1` → mark, walk curr past all 1s: `curr=None`. Wire `prev.next=None`. Loop exits. Return `dummy.next = None` → `[]`. Empty output is the correct result — the spec says remove all duplicates. A buggy version that always keeps at least one of each would return `[1]` incorrectly.',
      viz_anchor: null,
    },
  ],

  'flatten-a-multilevel-doubly-linked-list': [
    {
      inputs: ['[1,2,3,4,5,6,null,null,null,7,8,9,10,null,null,11,12]'],
      expected: '[1,2,3,7,8,11,12,9,10,4,5,6]',
      explanation_md:
        'Canonical LC example. DFS into each `child` pointer, splicing the child sublist between the current node and its `next`. Walk: at node 3, child = 7. Recursively flatten the 7-chain (which itself dives into 11-12 at node 8). Flattened child returns `7 -> 8 -> 11 -> 12 -> 9 -> 10`. Splice: `3.next = 7`, `7.prev = 3`, tail (10).next = original-`3.next` = 4, `4.prev = 10`. Clear `3.child = None`. Continue. Result `[1,2,3,7,8,11,12,9,10,4,5,6]`. **O(n)** total work — every node visited once.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,null,3]'],
      expected: '[1,3,2]',
      explanation_md:
        'Node 1 has child=3. Flatten child returns `3` alone. Splice: `1.next=3`, `3.prev=1`, `3.next=2` (original next), `2.prev=3`. Clear `1.child=None`. Continue to node 3 (no child). Continue to node 2 (no child). Result `[1,3,2]`. Tiny case proves the splice-then-advance pattern is correct: after splicing, traversal must continue from the SPLICED child (3), not skip ahead to `next` (2), or we miss any deeper children.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'Empty list. The flatten function returns immediately on `head is None`. Output `[]`. No DFS, no splice. Proves the base case handles the empty input cleanly — a missing None check would crash on the first `curr.child` access.',
      viz_anchor: null,
    },
  ],

  'convert-sorted-list-to-binary-search-tree': [
    {
      inputs: ['[-10,-3,0,5,9]'],
      expected: '[0,-3,9,-10,null,5]',
      explanation_md:
        'Canonical LC example. Build a height-balanced BST from sorted values by picking the middle as root, recursing on left and right halves. Slow/fast finds middle. Mid = `0` → root. Left half `[-10,-3]` → mid=-3 (or -10 with floor) → root, left=-10 leaf. Right half `[5,9]` → mid=5 (or 9) → root, right=9 leaf. Final BFS-level: `[0, -3, 9, -10, null, 5]`. Height is `O(log n)` — every recursion halves the input. **O(n log n)** if scanning to find middle each call; **O(n)** if converting to array first.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'Empty list → empty tree. Base case `head is None` returns None. Output `[]`. Proves the base case is wired right; without it, the slow/fast midpoint walker would deref `None.next` and crash. The output is the BFS serialization of None, which is `[]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'Single node. Slow/fast: `slow=1, fast=None`. Mid is `1`. Left half empty (head==slow boundary), right half also empty (`slow.next=None`). Build: root=1, left=None, right=None. Output BFS: `[1]`. Single-node base case follows the same code path as larger inputs — no special casing needed, just the empty-half recursions terminating immediately.',
      viz_anchor: null,
    },
  ],

  'insertion-sort-list': [
    {
      inputs: ['[4,2,1,3]'],
      expected: '[1,2,3,4]',
      explanation_md:
        'Canonical insertion sort, **O(n^2)** worst case. Use a dummy as the head of the sorted prefix. Walk through input; for each `curr`, scan the sorted prefix to find insertion point, splice in. Trace: insert 4 → sorted=`4`. Insert 2: scan, 2<4, insert before 4 → sorted=`2,4`. Insert 1: scan, 1<2, insert at front → sorted=`1,2,4`. Insert 3: scan, 3>1, 3>2, 3<4, insert between 2 and 4 → sorted=`1,2,3,4`. Result `[1,2,3,4]`. The dummy node spares us a separate "insert at head" branch.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,5,3,4,0]'],
      expected: '[-1,0,3,4,5]',
      explanation_md:
        'Mixed negatives. Insert -1 → `[-1]`. Insert 5 → `[-1,5]` (no rescan needed; new node biggest). Insert 3: scan, 3>-1, 3<5, insert before 5 → `[-1,3,5]`. Insert 4: scan, 4<5, insert before 5 → `[-1,3,4,5]`. Insert 0: scan, 0>-1, 0<3, insert before 3 → `[-1,0,3,4,5]`. Each insert walks at most the current sorted-prefix length — n=5, total work `0+1+2+3+4=10` compares. Result `[-1,0,3,4,5]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'Single node — sorted by definition. Outer loop runs once: insert 1 into empty sorted-prefix. Inner scan finds dummy as insertion point. Output `[1]`. Confirms the empty-prefix branch: a buggy implementation that assumes at least one sorted node would crash on dummy.next deref.',
      viz_anchor: null,
    },
  ],

  'next-greater-node-in-linked-list': [
    {
      inputs: ['[2,1,5]'],
      expected: '[5,5,0]',
      explanation_md:
        'Canonical LC example. Convert to array, then monotonic decreasing stack of indices — for each new value, pop indices whose value is smaller; their answer is the current value. Walk indices 0..2 with values `[2,1,5]`. i=0: push 0, stack=`[0]`. i=1: 1<2 → push 1, stack=`[0,1]`. i=2: 5>1 → pop 1, ans[1]=5; 5>2 → pop 0, ans[0]=5; push 2, stack=`[2]`. End. Remaining stack indices (2) get 0 (no next greater). Result `[5,5,0]`. **O(n)** amortized.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,7,4,3,5]'],
      expected: '[7,0,5,5,0]',
      explanation_md:
        'Trace: i=0 val=2, push. i=1 val=7, pop 0 (2<7) → ans[0]=7, push 1. i=2 val=4, push (4<7). i=3 val=3, push (3<4). i=4 val=5, pop 3 (3<5) → ans[3]=5, pop 2 (4<5) → ans[2]=5, push 4 (5<7). End. Leftover indices 1,4 → ans 0. Result `[7,0,5,5,0]`. The monotonic stack keeps every unresolved index waiting for a future greater value; when one arrives, the stack drains.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[2,3,4,5,0]',
      explanation_md:
        'Strictly increasing — every node finds its next greater immediately. Every push pops the previous index. ans[0]=2, ans[1]=3, ans[2]=4, ans[3]=5. Last node (5) has no next greater → 0. Result `[2,3,4,5,0]`. Best case for the monotonic stack: each index enters and leaves once, total work **O(n)** with constant peak stack size 1.',
      viz_anchor: null,
    },
  ],

  'split-linked-list-in-parts': [
    {
      inputs: ['[1,2,3]', '5'],
      expected: '[[1],[2],[3],[],[]]',
      explanation_md:
        'Canonical LC example with `k > length`. Length=3, k=5. Each part gets `length // k = 0` nodes base, with `length % k = 3` extra (the first 3 parts get one more). So sizes are `[1,1,1,0,0]`. Walk: chop 1 node for part 0 → `[1]`. Chop 1 for part 1 → `[2]`. Chop 1 for part 2 → `[3]`. Parts 3,4 are empty. Result `[[1],[2],[3],[],[]]`. The earlier-parts-larger rule means part lengths differ by at most 1 — the LC spec.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5,6,7,8,9,10]', '3'],
      expected: '[[1,2,3,4],[5,6,7],[8,9,10]]',
      explanation_md:
        'Length=10, k=3. Base = `10//3 = 3`, extra = `10%3 = 1` → sizes `[4,3,3]`. The single extra node goes to the FIRST part (`size + 1` for the first `extra` parts). Walk: chop 4 for part 0 → `[1,2,3,4]`. Chop 3 for part 1 → `[5,6,7]`. Chop 3 for part 2 → `[8,9,10]`. Result `[[1,2,3,4],[5,6,7],[8,9,10]]`. The earlier-bigger rule is what distinguishes this from naive equal-chunking.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '3'],
      expected: '[[],[],[]]',
      explanation_md:
        'Empty input, k=3. Length=0, base=0, extra=0. Every part gets size 0. Loop: produce 3 empty parts. Result `[[],[],[]]`. Proves the algorithm emits exactly `k` parts even on empty input — a bug that returns early on null head would output `[]` instead of `[[],[],[]]`, violating the spec.',
      viz_anchor: null,
    },
  ],

  'swapping-nodes-in-a-linked-list': [
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: '[1,4,3,2,5]',
      explanation_md:
        'Canonical LC example. Swap VALUES of the k-th node from the front and the k-th from the back. k=2. Two-pointer trick: advance `first` to position k → `first=2`. Advance `second` and `first` together until `first.next=None`: `first=3, second=1`. `first=4, second=2`. `first=5, second=3`. Stop — wait, second should be at the kth-from-end. Let me retrace: after first reaches node 2, walk second from head while first goes to tail. `first=2,second=1` → step: `first=3,second=2`; step: `first=4,second=3`; step: `first=5,second=4`. Stop. Swap values of node 2 (=2) and node 4 (=4) → list becomes `[1,4,3,2,5]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,9,6,6,7,8,3,0,9,5]', '5'],
      expected: '[7,9,6,6,8,7,3,0,9,5]',
      explanation_md:
        'Length=10, k=5. First (5th from head) is value 7 (the second 7). Second (5th from tail = 6th from head) is value 8. Swap → list becomes `[7,9,6,6,8,7,3,0,9,5]`. Note position 5 from head and position 5 from tail in a 10-node list are different nodes (indices 4 and 5 zero-based). The two-pointer pattern lands on them without computing length explicitly.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '[1]',
      explanation_md:
        'Single node, k=1. The 1st from head IS the 1st from tail — same node. Swap is a no-op. Output `[1]`. Proves the algorithm handles the self-swap case without crashing or corrupting pointers. A buggy version that unconditionally writes `first.val, second.val = second.val, first.val` works fine here because they point to the same node.',
      viz_anchor: null,
    },
  ],

  'delete-the-middle-node-of-a-linked-list': [
    {
      inputs: ['[1,3,4,7,1,2,6]'],
      expected: '[1,3,4,1,2,6]',
      explanation_md:
        'Canonical LC example. Length=7, middle index = 3 (zero-based), value 7. Find with slow/fast where `slow` lags so it lands on the node BEFORE the middle: track `prev`. Walk: slow=1,fast=1. Step: prev=1, slow=3, fast=4. Step: prev=3, slow=4, fast=1. Step: prev=4, slow=7, fast=6. Stop — fast.next=None. `slow=7` is middle, `prev=4`. Wire `prev.next = slow.next = 1`. Result `[1,3,4,1,2,6]`. Floor(length/2) is the deleted index — exactly the middle for odd length.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]'],
      expected: '[1,2,4]',
      explanation_md:
        'Even length=4, middle index = 2 (floor(4/2)), value 3. Slow/fast walk: prev=1,slow=2,fast=3. prev=2,slow=3,fast=null. Stop — fast.next would be None... actually we use `fast and fast.next` guard. Wire `prev.next = slow.next = 4`. Result `[1,2,4]`. Confirms floor-of-half: the second of the two "middles" gets deleted in even-length lists. A bug using ceil would delete `2` instead of `3`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[]',
      explanation_md:
        'Single node — middle is the only node. Spec: return empty list (or None). Guard `head.next is None` returns None directly. Output `[]`. Without the guard, slow/fast would try to walk and the prev pointer would never get set — `prev.next = slow.next` crashes. The single-node early return is necessary scaffolding for the slow/fast pattern.',
      viz_anchor: null,
    },
  ],

  'maximum-twin-sum-of-a-linked-list': [
    {
      inputs: ['[5,4,2,1]'],
      expected: '6',
      explanation_md:
        'Canonical LC example. "Twins" are nodes i and (n-1-i). Pairs: (5,1)=6, (4,2)=6. Max twin sum = 6. Algorithm: find middle with slow/fast, reverse second half in-place, then walk first-half pointer and reversed-second-half pointer together summing pairs. Trace: slow lands at index 2 (value 2). Reverse `[2,1]` → `[1,2]`. Walk: 5+1=6, 4+2=6. Max=6. **O(n)** time, **O(1)** space — beats hashmap or array materialization.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,2,2,3]'],
      expected: '7',
      explanation_md:
        'Pairs: (4,3)=7, (2,2)=4. Max=7. Trace: slow lands at index 2 (value 2). Reverse `[2,3]` → `[3,2]`. Walk: 4+3=7, 2+2=4. Max=7. Proves the algorithm correctly identifies the larger of the two sums even when one pair has equal twins. Length is guaranteed even by problem spec, so no awkward middle node to handle.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,100000]'],
      expected: '100001',
      explanation_md:
        'Minimum length (2) with the max-value twin. Pair (1, 100000) = 100001. Slow lands at index 1. Reverse `[100000]` → `[100000]`. Walk: 1+100000=100001. Result 100001. Confirms two-element base case works — the loop runs exactly once and the reversal is a no-op on a single node. A buggy version that double-counts twins would output 200002.',
      viz_anchor: null,
    },
  ],

  'merge-in-between-linked-lists': [
    {
      inputs: ['[10,1,13,6,9,5]', '3', '4', '[1000000,1000001,1000002]'],
      expected: '[10,1,13,1000000,1000001,1000002,5]',
      explanation_md:
        'Canonical LC example. Remove nodes from `a=3` to `b=4` inclusive in list1, splice list2 in their place. Walk list1: `prev` lands at index 2 (value 13, the node BEFORE index 3). `after` lands at index 5 (value 5, the node AFTER index 4). Find list2 tail: `1000002`. Wire `prev.next = list2.head = 1000000`, `list2.tail.next = after = 5`. Result `[10,1,13,1000000,1000001,1000002,5]`. Two pointer walks on list1 + one on list2 = **O(n+m)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,2,3,4,5,6]', '2', '5', '[1000000,1000001,1000002,1000003,1000004]'],
      expected: '[0,1,1000000,1000001,1000002,1000003,1000004,6]',
      explanation_md:
        'Remove indices 2..5 (values 2,3,4,5). `prev` at index 1 (value 1). `after` at index 6 (value 6). list2 tail = 1000004. Wire `1 -> 1000000 -> 1000001 -> 1000002 -> 1000003 -> 1000004 -> 6`. Result `[0,1,1000000,1000001,1000002,1000003,1000004,6]`. The inserted segment is longer than the removed segment — splice still works in O(1) once both endpoints are located.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]', '1', '2', '[5,6]'],
      expected: '[1,5,6,4]',
      explanation_md:
        'Remove indices 1..2 (values 2,3). `prev` at index 0 (value 1). `after` at index 3 (value 4). list2 = `5 -> 6`, tail = 6. Wire `1 -> 5 -> 6 -> 4`. Result `[1,5,6,4]`. Compact case proves the splice handles small windows correctly — both ends of the removed segment are adjacent to the splice points.',
      viz_anchor: null,
    },
  ],

  'remove-zero-sum-consecutive-nodes-from-linked-list': [
    {
      inputs: ['[1,2,-3,3,1]'],
      expected: '[3,1]',
      explanation_md:
        'Canonical LC example. Use prefix sums: if two positions have the same prefix sum, the subarray between them sums to zero — splice it out. Dummy node (prefix 0). Walk: prefix 1 → store {1: node1}. Prefix 3 → store {3: node2}. Prefix 0 — collision with dummy! Splice everything after dummy up to and including node `-3`: skip to next. Continue: prefix 3 — collision with node2! Splice node2..next-3. Wait — need to also clear stale map entries between the splice points. After full pass: result `[3,1]`. The hashmap of prefix→node enables **O(n)** detection of zero-sum subarrays.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,-3,4]'],
      expected: '[1,2,4]',
      explanation_md:
        'Prefix sums: 1, 3, 6, 3, 7. The prefix 3 appears twice (at nodes 2 and `-3`). The subarray between them — `[3,-3]` — sums to zero. Splice it out. Pointer wires `2.next = 4`. Result `[1,2,4]`. Confirms the two-pass version: pass 1 fills the map keyed by final value for each prefix; pass 2 walks the chain, jumping from each node to the node whose stored prefix matches the next prefix sum.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,-1]'],
      expected: '[]',
      explanation_md:
        'Tiny zero-sum pair. Prefix sums: 1, 0. Dummy has prefix 0 — collision with the final node. Splice everything from after dummy up through `-1`. Result is empty. Output `[]`. Edge case proves the entire-list-cancels branch: a bug that only splices INTERNAL zero-sum runs (skipping pairs that include the head) would leave residual nodes behind.',
      viz_anchor: null,
    },
  ],

  'double-a-number-represented-as-a-linked-list': [
    {
      inputs: ['[1,8,9]'],
      expected: '[3,7,8]',
      explanation_md:
        'Canonical LC example. Number is 189; `2*189 = 378`. Most-significant-first storage. Trick: if leading digit < 5, doubling produces no extra leading carry. Walk and double each digit. `1*2=2, +carry`. Carry from next: 8*2=16, carry=1. So digit 1 becomes 2+1=3. 8 becomes 16%10=6 + carry from 9 = 7. 9 becomes 9*2=18%10=8. Result `[3,7,8]`. **O(n)** with a single right-to-left pass after reversing, then reverse back — or one pass forward by precomputing the carry from `next.val * 2 >= 10`.',
      viz_anchor: null,
    },
    {
      inputs: ['[9,9,9]'],
      expected: '[1,9,9,8]',
      explanation_md:
        'Number is 999; doubled = 1998. The leading digit is 9, which doubles to 18 → carry-out → result list grows by one node. Walk: 9*2=18, carry=1, digit=8. 9*2=18, +carry=19, digit=9, carry=1. 9*2=18, +carry=19, digit=9, carry=1. Leading carry remains → prepend new node with value 1. Result `[1,9,9,8]`. Proves the carry-out-of-the-msb branch fires correctly. A buggy version that ignores the final carry would output `[9,9,8]`, losing the leading 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[2]',
      explanation_md:
        'Smallest input. Number=1, doubled=2. No carry, no list-growth. Walk: 1*2=2, store. Result `[2]`. Single-node case proves the doubling loop terminates cleanly with no off-by-one. A buggy implementation that expects `next.val` and crashes on None would fail here — the carry lookup must guard for tail.',
      viz_anchor: null,
    },
  ],

  'insert-greatest-common-divisors-in-linked-list': [
    {
      inputs: ['[18,6,10,3]'],
      expected: '[18,6,6,2,10,1,3]',
      explanation_md:
        'Canonical LC example. Between each pair of adjacent nodes, insert a node holding `gcd(a, b)`. Pairs: (18,6)→gcd=6; (6,10)→gcd=2; (10,3)→gcd=1. Walk and splice: `18 -> 6 -> [6] -> 6 -> [2] -> 10 -> [1] -> 3`. Wait — re-trace cleanly: original 18,6,10,3. Between 18 and 6 insert 6. Between 6 and 10 insert 2. Between 10 and 3 insert 1. Result `[18,6,6,2,10,1,3]`. **O(n)** with constant-time gcd lookup via Euclid (which itself runs in **O(log min(a,b))**).',
      viz_anchor: null,
    },
    {
      inputs: ['[7]'],
      expected: '[7]',
      explanation_md:
        'Single node — no adjacent pairs, no insertions. Loop guard `curr.next is not None` short-circuits immediately. Output `[7]`. Single-node case confirms the algorithm exits cleanly without dereferencing a null `next`. A buggy version that computes `gcd(curr.val, None)` would crash; the guard prevents this.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4]'],
      expected: '[2,2,4]',
      explanation_md:
        'Minimum two-node case. gcd(2,4)=2. Insert between → `[2,2,4]`. Confirms the splice mechanics: save `nxt = curr.next`, create new node with gcd value, wire `curr.next = new`, `new.next = nxt`, advance `curr = nxt`. Skipping past the inserted node is critical — otherwise we\'d compute gcd(2, 2) on the next step, an infinite expansion.',
      viz_anchor: null,
    },
  ],

  'convert-binary-number-in-a-linked-list-to-integer': [
    {
      inputs: ['[1,0,1]'],
      expected: '5',
      explanation_md:
        'Canonical LC example. Bits read MSB-first: 101 binary = 5 decimal. Walk and accumulate: `result = (result << 1) | curr.val`. Start `result=0`. Node 1: result = (0<<1)|1 = 1. Node 0: result = (1<<1)|0 = 2. Node 1: result = (2<<1)|1 = 5. Output `5`. **O(n)** single pass, **O(1)** extra space. The shift-and-or is the same trick used in stream binary decoders — no need to know length up front.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '0',
      explanation_md:
        'Single bit, value 0. Walk: result = (0<<1)|0 = 0. Output `0`. Smallest possible input. Confirms the loop runs at least once and handles the all-zeros case. A buggy version that returns a sentinel for empty input would still work if it special-cases `head=None`, but the single-node case is the cleanest baseline.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,1,1,1,1,1]'],
      expected: '255',
      explanation_md:
        'Eight ones = `11111111` binary = 255 decimal (max byte). Each step: result = (result<<1)|1. After 8 iterations, result = `0b11111111` = 255. Output `255`. Proves the shift-and-or accumulates correctly through 8 bits without overflow concerns (Python ints are arbitrary precision; in C++/Java the int width would matter for very long lists). This case mimics testing the maximum value for a small bit-width.',
      viz_anchor: null,
    },
  ],

  'linked-list-components': [
    {
      inputs: ['[0,1,2,3]', '[0,1,3]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Count maximal runs of consecutive list nodes whose values are all in `nums`. Set: {0,1,3}. Walk: node 0 in set — start of a run. Node 1 in set — continue run. Node 2 NOT in set — close run (count=1). Node 3 in set — start new run. End — close (count=2). Output `2`. The trick is counting STARTS of runs: a node is a run-start iff (a) it\'s in the set AND (b) the previous node is null or NOT in the set. **O(n+|nums|)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,2,3,4]', '[0,3,1,4]'],
      expected: '2',
      explanation_md:
        'Set: {0,1,3,4}. Walk: 0 in set, prev null → start (count=1). 1 in set, prev in set → continue. 2 NOT in set → close. 3 in set, prev not in set → start (count=2). 4 in set → continue. End. Output `2`. Two runs: [0,1] and [3,4]. Note `nums` is a set, not a sequence — order doesn\'t matter. The algorithm doesn\'t care about the order in `nums`, only membership.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '[1]'],
      expected: '1',
      explanation_md:
        'Single node in set. Walk: 1 in set, prev null → start (count=1). End. Output `1`. Smallest case proves the boundary "prev is null" branch fires on the head. A buggy implementation requiring an explicit previous node would miss this start and return 0.',
      viz_anchor: null,
    },
  ],

  'remove-nodes-from-linked-list': [
    {
      inputs: ['[5,2,13,3,8]'],
      expected: '[13,8]',
      explanation_md:
        'Canonical LC example. Remove every node that has a greater value to its right. Reverse the list, then walk maintaining running max — drop nodes < max. Reverse: `[8,3,13,2,5]`. Walk with max=0: 8>0, keep, max=8. 3<8, drop. 13>8, keep, max=13. 2<13, drop. 5<13, drop. Kept (reverse order): `[8,13]`. Re-reverse: `[13,8]`. Output `[13,8]`. **O(n)** time, **O(1)** extra space if reversing in place. Monotonic-stack alternative also works without reversal.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,1]'],
      expected: '[1,1,1,1]',
      explanation_md:
        'All equal — nothing has a STRICTLY greater value to its right, so keep everything. Reverse: `[1,1,1,1]`. Walk with max=0: each 1 > previous max (or equal — depends on strict vs non-strict). The spec uses STRICTLY greater, so equal values stay. Kept all 4. Re-reverse → `[1,1,1,1]`. A bug using `>=` would drop all but the last and return `[1]`. Confirms strict-comparison is critical.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,3,2,1]'],
      expected: '[5,4,3,2,1]',
      explanation_md:
        'Monotonically decreasing — every node is greater than all to its right, so keep everything. Reverse: `[1,2,3,4,5]`. Walk max=0: every node greater than previous max, keep all. Re-reverse: `[5,4,3,2,1]`. Best-case output equals input. The monotonic stack alternative shows this clearly: every push increases the max, nothing pops.',
      viz_anchor: null,
    },
  ],

  'middle-linked-list': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[3,4,5]',
      explanation_md:
        'Canonical LC example. Tortoise/hare: `slow` advances 1 step, `fast` advances 2. When `fast.next` is null (odd length) or `fast` is null (even length), `slow` lands on the middle. Walk: slow=1,fast=1. Step: slow=2,fast=3. Step: slow=3,fast=5. fast.next=None → stop. Slow=3 is middle. Return chain from 3 → `[3,4,5]`. **O(n/2)** time, **O(1)** extra space. The classic two-pointer pattern that needs no length pre-scan.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5,6]'],
      expected: '[4,5,6]',
      explanation_md:
        'Even length=6. Walk: slow=1,fast=1. slow=2,fast=3. slow=3,fast=5. slow=4,fast=None. Stop — fast hit null. Slow=4. Return `[4,5,6]`. Spec says return the SECOND middle for even length (index n/2, not n/2-1). The guard `fast and fast.next` ensures slow advances exactly floor(n/2) times = 3 for n=6. A swap of the guard order would land slow on `3` (the first middle) instead.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'Single node — slow stays at head. Loop guard `fast and fast.next` immediately fails (`fast.next is None`). Slow=1. Return chain from 1 → `[1]`. Confirms the loop exits cleanly without any iterations. A bug that runs the body at least once would advance slow to None and crash on the return.',
      viz_anchor: null,
    },
  ],

  'detect-cycle-in-linked-list': [
    {
      inputs: ['[3,2,0,-4]', '1'],
      expected: 'true',
      explanation_md:
        'Floyd\'s tortoise-and-hare. Build the chain `3 -> 2 -> 0 -> -4` then wire the tail back to node at `pos=1` (value 2). Walk: slow=3,fast=3. Step: slow=2,fast=0. Step: slow=0,fast=2 (wrapped). Step: slow=-4,fast=-4. Meeting! Output `true`. Inside the cycle, fast gains on slow by 1 step per iteration; once both are inside the cycle of length L, they meet within L steps. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '0'],
      expected: 'true',
      explanation_md:
        'Tail wraps to position 0 — entire list is one cycle of length 2. slow=1,fast=1. Step: slow=2,fast=1 (fast wrapped twice: 1→2→1). Step: slow=1 (wrapped),fast=1 (wrapped). Meeting at node 1. Output `true`. Tight 2-cycle proves the algorithm catches the smallest non-trivial cycle. A buggy `while fast and fast.next.next` (without checking fast.next first) would crash if the cycle were less obvious.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '-1'],
      expected: 'false',
      explanation_md:
        'No cycle — `pos=-1` means tail does NOT wrap. slow=1,fast=1. Step: slow=2,fast=3. Step: slow=3,fast=None — fast.next is None, loop exits. Return `false`. The exit branch is critical: without it, an acyclic list would loop forever. Proves the guard `fast and fast.next` cleanly terminates on the no-cycle case.',
      viz_anchor: null,
    },
  ],

  'intersection-two-linked-lists': [
    {
      inputs: ['[4,1,8,4,5]', '[5,6,1,8,4,5]', '2', '3'],
      expected: '8',
      explanation_md:
        'Two-pointer trick: pointer A walks listA then continues into listB, pointer B walks listB then into listA. After at most `lenA+lenB` steps they either meet at intersection or both reach null together. Trace: listA tail-portion is `[8,4,5]` shared with listB tail-portion `[8,4,5]`. Walking with the swap, both pointers land on the first shared node (value 8). Output `8`. **O(n+m)** time, **O(1)** space — no hashset needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,9,1,2,4]', '[3,2,4]', '3', '1'],
      expected: '2',
      explanation_md:
        'listA `[1,9,1,2,4]` and listB `[3,2,4]` share tail `[2,4]` starting at value 2. Two-pointer walk: pA does 5+3 steps total before re-pointing, pB does 3+5. The path-length equalization happens at the swap, ensuring both pointers arrive at the first shared node simultaneously. Output `2`. The shared suffix can be at different absolute positions in each list — the trick equalizes the differential.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,6,4]', '[1,5]', '3', '2'],
      expected: '-1',
      explanation_md:
        'No intersection — `skipA=3` (past end of A), `skipB=2` (past end of B), so neither list reaches the other\'s suffix. Two-pointer walk: pA traverses A then B (5 total), pB traverses B then A (5 total). Both reach null simultaneously. Output `-1` (or null, encoded as `-1` per the harness). Confirms the no-intersection branch: both pointers terminate at None at the same step, exiting the loop with no return value.',
      viz_anchor: null,
    },
  ],

  'linked-list-cycle-detection': [
    {
      inputs: ['[3,2,0,-4]'],
      expected: 'false',
      explanation_md:
        'Plain Floyd tortoise-and-hare with no embedded cycle (the test harness doesn\'t wire tail back). slow=3,fast=3. slow=2,fast=0. slow=0,fast=None (fast walked 2 hops past tail). Loop exits — return `false`. No cycle. **O(n)** time, **O(1)** space. Classic case where the acyclic exit branch fires cleanly.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: 'false',
      explanation_md:
        'Two-node acyclic list. slow=1,fast=1. Step: slow=2,fast=None (fast tried to advance twice and hit None on the second hop). Loop exits. Return `false`. Edge case proves the guard `fast and fast.next` correctly handles short lists. A bug that lets fast.next.next run unchecked would crash here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: 'false',
      explanation_md:
        'Single node — guard `fast.next is None` fires immediately. Loop never enters body. Return `false`. Single-node case is the minimum input. Confirms the algorithm exits without ever advancing pointers. A buggy implementation that derefs `fast.next.next` before the guard would crash.',
      viz_anchor: null,
    },
  ],

  'linked-list-in-binary-tree': [
    {
      inputs: ['[4,2,8]', '[1,4,4,null,2,2,null,1,null,6,8,null,null,null,null,1,3]'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. The linked-list `4 -> 2 -> 8` must appear as a downward path in the tree. DFS the tree; at each node, optionally start matching from the list head. Found path: tree root 1 → right 4 → left 2 → right 8. Match: 4 == list[0]=4. Recurse: child 2 == list[1]=2. Recurse: grandchild 8 == list[2]=8 (list end). Output `true`. **O(n * min(L, h))** where n is tree size, L is list length, h is tree height.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,4,2,6]', '[1,4,4,null,2,2,null,1,null,6,8,null,null,null,null,1,3]'],
      expected: 'true',
      explanation_md:
        'List `1 -> 4 -> 2 -> 6` matches the path root(1) → left(4) → right(2) → left(6) — assuming the BFS encoding lines up that way. Output `true`. The DFS-from-every-node pattern is the trick: even though the match starts at the root in this case, the algorithm checks every node as a potential start. Otherwise a list pattern beginning mid-tree would be missed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,4,2,6,8]', '[1,4,4,null,2,2,null,1,null,6,8,null,null,null,null,1,3]'],
      expected: 'false',
      explanation_md:
        'Extended list adds a 5th node (8) after the previous matching path ending at 6. But node 6 has no child that\'s 8 in the tree path. DFS fails to extend. Try other starts — no path matches all 5. Output `false`. Proves the algorithm correctly returns false when a partial match exists but cannot extend: a buggy version that returns true on any partial-match would output true here.',
      viz_anchor: null,
    },
  ],

  'delete-nodes-from-linked-list-present-in-array': [
    {
      inputs: ['[1,2,3]', '[1,2,3,4,5]'],
      expected: '[4,5]',
      explanation_md:
        'Canonical LC example. Build a set from `nums = {1,2,3}`. Walk the list with a dummy node and `prev`. For each node, if val in set → splice out; else advance prev. Trace: prev=dummy, curr=1. 1 in set → prev.next=2. curr=2, 2 in set → prev.next=3. curr=3, 3 in set → prev.next=4. curr=4, 4 not in set → prev=4, curr=5. 5 not in set → prev=5, curr=None. Result `[4,5]`. **O(n + m)** with set lookups O(1).',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '[1,2,1,2,1,2]'],
      expected: '[2,2,2]',
      explanation_md:
        'Delete every node with value 1. Set={1}. Walk: 1 deleted, 2 kept, 1 deleted, 2 kept, 1 deleted, 2 kept. Result `[2,2,2]`. Confirms multiple non-adjacent deletions work — the prev pointer never advances past a deleted node, allowing back-to-back deletes. A bug that always advances prev would skip checking one node after each delete.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]', '[1,2,3,4]'],
      expected: '[1,2,3,4]',
      explanation_md:
        'Nothing to delete — `5` not in list. Set={5}. Walk: every node\'s val (1,2,3,4) NOT in set → prev advances each step. Result `[1,2,3,4]` unchanged. Confirms the "no-delete" branch works: a bug that splices unconditionally would empty the list.',
      viz_anchor: null,
    },
  ],
};

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
