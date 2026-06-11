#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 5 (30 problems).
// Same shape as batches 1+2+3+4: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch5.mjs

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
  'valid-sudoku': [
    {
      inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example — a partially filled valid board. Walk every cell once. For each digit, track three hash sets: `rows[i]`, `cols[j]`, and `boxes[(i/3)*3 + j/3]`. If the digit is already in any of the three, return `false`; otherwise insert. After scanning all 81 cells with no conflict, return `true`. **O(81) = O(1)** time and space because the board is fixed-size. The trick is the box index `(i/3)*3 + j/3` — it groups each cell into one of the nine 3x3 regions without nested loops.',
      viz_anchor: null,
    },
    {
      inputs: ['[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'],
      expected: 'false',
      explanation_md:
        'A near-duplicate of the canonical example, with cell `(0,0)` changed from `5` to `8`. Now column `0` has `8` at row `0` and `8` at row `3` — a duplicate. Equivalently, the top-left 3x3 box has two `8`s. Either of the three checks (row, column, or box) catches this and returns `false`. Proves the algorithm correctly flags **any** of the three constraint violations, not just rows. A brittle implementation that checks only rows and columns would falsely return `true` for boards where the conflict is box-only.',
      viz_anchor: null,
    },
    {
      inputs: ['[[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'],
      expected: 'true',
      explanation_md:
        'The empty-board edge case. Every cell is `.`, so the inner loop never inserts anything into the hash sets. No conflicts possible, return `true`. Proves the algorithm only validates **placed digits** — it does not require the board to be solvable or complete. A brittle implementation that counts filled cells and rejects under-filled boards would fail here. The Valid Sudoku problem is strictly "are the existing placements consistent", not "can this be solved".',
      viz_anchor: null,
    },
  ],

  'sudoku-solver': [
    {
      inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'],
      expected: '[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]',
      explanation_md:
        'The canonical LC example. Backtracking with constraint checks. Find the next empty cell; try digits `1..9`; for each, check row/column/box availability; recurse; on failure, undo and try the next. Use three boolean arrays `rowUsed[9][10]`, `colUsed[9][10]`, `boxUsed[9][10]` for **O(1)** placement checks. The first empty cell `(0,2)` accepts `4`; the solver proceeds depth-first. Worst-case **O(9^81)** but constraint propagation prunes aggressively — typical boards solve in milliseconds.',
      viz_anchor: null,
    },
    {
      inputs: ['[["1","2","3","4","5","6","7","8","."],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]'],
      expected: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]',
      explanation_md:
        'A single-cell edge case — only `(0,8)` is empty. Row 0 has `1..8`, column 8 has `3,6,5,7,4,5,8,1,2`, box 2 has the rest. Only `9` remains valid. The backtracking immediately places `9` and returns. Proves the solver handles the trivial single-step case without overhead — the depth-first search terminates after one recursion. A brittle implementation that always tries `1..9` in order still works because the constraint checks reject the first eight before accepting `9`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[".",".","9","7","4","8",".",".","."],["7",".",".",".",".",".",".",".","."],[".","2",".","1",".","9",".",".","."],[".",".","7",".",".",".","2","4","."],[".","6","4",".","1",".","5","9","."],[".","9","8",".",".",".","3",".","."],[".",".",".","8",".","3",".","2","."],[".",".",".",".",".",".",".",".","6"],[".",".",".","2","7","5","9",".","."]]'],
      expected: '[["5","1","9","7","4","8","6","3","2"],["7","8","3","6","5","2","4","1","9"],["4","2","6","1","3","9","8","7","5"],["3","5","7","9","8","6","2","4","1"],["2","6","4","3","1","7","5","9","8"],["1","9","8","5","2","4","3","6","7"],["9","7","5","8","6","3","1","2","4"],["8","3","2","4","9","1","7","5","6"],["6","4","1","2","7","5","9","8","3"]]',
      explanation_md:
        'A sparse board requiring deep backtracking. The solver fills the first empty `(0,0)` with `5` (only legal digit given column 0 has `7`), continues, hits conflicts at deeper rows and unwinds. Standard recursion with row/column/box bookkeeping completes in milliseconds. Proves the algorithm scales to mostly-empty boards without changing the recursion shape — the constraint structures handle pruning identically regardless of input density.',
      viz_anchor: null,
    },
  ],

  'rotate-list': [
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: '[4,5,1,2,3]',
      explanation_md:
        'The canonical LC example. Rotate right by `k` means the last `k` nodes move to the front. Trick: compute length `n = 5`, then `k = k % n = 2` (no rotation if `k == 0`). Find the new tail at index `n - k - 1 = 2` (node `3`). Break the list there: new head is its next (`4`), old tail (`5`) points to old head (`1`). Return new head. **O(n)** time, **O(1)** space. Single pass to find length, second pass to find new tail.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,2]', '4'],
      expected: '[2,0,1]',
      explanation_md:
        'A case where `k > n`. With `n = 3`, `k = 4 % 3 = 1`. Find the new tail at index `3 - 1 - 1 = 1` (node `1`). New head is `2`; old tail (`2`) points to old head (`0`). Return `[2, 0, 1]`. Proves the `k % n` step is essential — without it, the algorithm would walk the list `k = 4` times and overshoot the end. Modular arithmetic compresses `k` into `[0, n)`.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '5'],
      expected: '[]',
      explanation_md:
        'The empty-list edge case. With `head == null`, return `null` immediately. A brittle implementation that computes `k % n` would divide by zero (`n = 0`). The `if (!head) return null` guard is mandatory. Single-node lists (`n = 1`) also reduce trivially because `k % 1 == 0` means no rotation happens.',
      viz_anchor: null,
    },
  ],

  'swap-nodes-in-pairs': [
    {
      inputs: ['[1,2,3,4]'],
      expected: '[2,1,4,3]',
      explanation_md:
        'The canonical LC example. Swap adjacent pairs: `(1,2)` becomes `(2,1)`, `(3,4)` becomes `(4,3)`. Use a dummy node before the head so the first pair has a uniform "previous" pointer. Iterate while there are two more nodes: rewire `prev -> b -> a -> next` where `a, b` are the current pair. Advance `prev` to `a` (now the tail of the swapped pair). **O(n)** time, **O(1)** space. Clean iterative version avoids recursion stack.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-list edge case. The loop condition checks `prev.next && prev.next.next` — both fail immediately. Return the dummy\'s next, which is `null`. Proves the dummy-node pattern handles empty input gracefully. A brittle implementation that special-cases the first pair without a dummy would crash on empty input.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '[2,1,3]',
      explanation_md:
        'The odd-length case. Swap `(1,2)` to `(2,1)`, then `3` has no partner — leave it untouched. Loop runs once (pair `1,2`), then `prev.next.next == null` fails, exit. Final list: `2 -> 1 -> 3`. Proves the algorithm handles odd-length lists by leaving the trailing node in place. A brittle implementation that always swaps in pairs would crash trying to access `node.next.next` past the end.',
      viz_anchor: null,
    },
  ],

  'reverse-nodes-in-k-group': [
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: '[2,1,4,3,5]',
      explanation_md:
        'The canonical LC example. Reverse every `k = 2` consecutive nodes. Repeatedly: peek ahead `k` nodes — if fewer than `k` remain, stop. Reverse the group in place by relinking pointers, then stitch into the result. First group `(1,2)` becomes `(2,1)`; second `(3,4)` becomes `(4,3)`; last `5` left alone (fewer than 2 remain). Return `[2,1,4,3,5]`. **O(n)** time, **O(1)** space. Dummy node simplifies the first-group handoff.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]', '3'],
      expected: '[3,2,1,4,5]',
      explanation_md:
        'A case where `n` is not a multiple of `k`. First group `(1,2,3)` reverses to `(3,2,1)`. Next, only two nodes (`4,5`) remain — fewer than `k=3`, so leave them. Final list: `3 -> 2 -> 1 -> 4 -> 5`. Proves the algorithm correctly **does not** reverse the trailing partial group. A brittle implementation that reverses any group, partial or full, would produce `[3,2,1,5,4]` — wrong by spec.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '[1]',
      explanation_md:
        'The `k = 1` edge case — reversing groups of size 1 is a no-op. The loop reverses each single node, which leaves the list unchanged. Return `[1]`. Proves the algorithm handles `k = 1` without any special-casing. The reverse-in-place loop trivially completes after zero swaps for each one-element group.',
      viz_anchor: null,
    },
  ],

  'copy-list-with-random-pointer': [
    {
      inputs: ['[[7,null],[13,0],[11,4],[10,2],[1,0]]'],
      expected: '[[7,null],[13,0],[11,4],[10,2],[1,0]]',
      explanation_md:
        'The canonical LC example. Deep-copy a list where each node has `next` and `random` pointers. Three-pass interleaving trick: (1) insert a clone after each original, so `A -> A\' -> B -> B\' -> ...`. (2) Wire clone randoms: `A\'.random = A.random.next`. (3) Split the two lists. **O(n)** time, **O(1)** extra space (vs. **O(n)** hash-map approach). The genius is using the original list itself as the "old -> new" map.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[2,1]]'],
      expected: '[[1,1],[2,1]]',
      explanation_md:
        'A two-node case where both randoms point to the same target. After interleaving: `1 -> 1\' -> 2 -> 2\'`. `1.random = 2`, so `1\'.random = 2.next = 2\'`. `2.random = 2`, so `2\'.random = 2.next = 2\'`. Split. Both clone randoms correctly point to the clone of node 2. Proves randoms pointing into the middle of the list are handled correctly by the interleave trick.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-list edge case. `head == null`, return `null` immediately. No clones to create. Proves the algorithm short-circuits on empty input. A brittle implementation that always tries to access `head.next` would crash here. Single-node lists also work: clone is inserted after head, random rewired, then split into two single-node lists.',
      viz_anchor: null,
    },
  ],

  'linked-list-cycle-ii': [
    {
      inputs: ['[3,2,0,-4]', '1'],
      expected: '1',
      explanation_md:
        'The canonical LC example. Floyd\'s algorithm in two phases. Phase 1: slow/fast pointers until they meet inside the cycle. Phase 2: reset one pointer to head; advance both by 1 step each — they meet at the cycle entry. List: `3 -> 2 -> 0 -> -4 -> 2 (back to index 1)`. Cycle entry is index `1` (node value `2`). Math: if `a` is distance from head to entry and `b` is distance from entry to meeting point, after the reset both pointers travel `a` more steps and meet at the entry. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '0'],
      expected: '0',
      explanation_md:
        'A case where the entire list is a cycle. Cycle entry is the head itself (index 0). Phase 1: slow and fast meet inside the cycle. Phase 2: reset slow to head — `slow == entry` already. Fast advances; they meet at the head. Return index `0`. Proves the algorithm correctly identifies entry-at-head cases without special-casing. A brittle implementation that returns `null` when slow starts at the entry would fail here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '-1'],
      expected: '-1',
      explanation_md:
        'The "no cycle" edge case. Fast pointer reaches `null` without meeting slow. Return `null` (or `-1` in test-format convention). Proves the algorithm correctly distinguishes acyclic lists from cyclic ones — phase 2 is only entered if phase 1 found a meeting point. The acyclic check is the `while (fast && fast.next)` loop terminating without a `slow == fast` match.',
      viz_anchor: null,
    },
  ],

  'intersection-of-two-linked-lists': [
    {
      inputs: ['[4,1,8,4,5]', '[5,6,1,8,4,5]', '2', '3'],
      expected: '8',
      explanation_md:
        'The canonical LC example. Two-pointer trick: walk both lists; when a pointer hits `null`, redirect to the other list\'s head. After at most `m + n` steps, both pointers either meet at the intersection or both reach `null` together. List A length 5, list B length 6. After A pointer traverses A then B (5+3=8 steps), B pointer traverses B then A (6+2=8 steps) — both at node `8`. Return `8`. **O(m+n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,9,1,2,4]', '[3,2,4]', '3', '1'],
      expected: '2',
      explanation_md:
        'A case where the lists have different lengths but intersect. List A length 5, list B length 3. The two-pointer walk equalizes effective starting positions by having each pointer traverse both lists. They meet at node `2` (the intersection). Proves the algorithm self-aligns without explicit length computation — the redirect trick is what handles unequal lengths implicitly.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,6,4]', '[1,5]', '3', '2'],
      expected: 'null',
      explanation_md:
        'The "no intersection" case. Lists are disjoint. Each pointer traverses both lists (length 3+2=5 steps for each), then both reach `null` simultaneously. Loop exits with `pA == pB == null`. Return `null`. Proves the algorithm correctly detects disjoint lists — the simultaneous null-termination is the signal. A brittle implementation that uses different traversal lengths could loop forever; the redirect-once-only invariant is essential.',
      viz_anchor: null,
    },
  ],

  'palindrome-linked-list': [
    {
      inputs: ['[1,2,2,1]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. **O(n)** time, **O(1)** space: find the middle with slow/fast pointers, reverse the second half in place, walk both halves comparing values. List `1 -> 2 -> 2 -> 1`: middle at index 2 (node `2`). Reverse second half → `1 -> 2 | 1 -> 2` (second half reversed). Compare pairs: `1 == 1, 2 == 2`. Return `true`. Optionally restore the second half on the way out. The naive copy-to-array approach is **O(n)** space, easier but heavier.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: 'false',
      explanation_md:
        'A two-node non-palindrome. Slow lands at node `1` (index 0), fast at `2`. Reverse second half → just `2`. Compare `1 vs 2` — mismatch, return `false`. Proves the algorithm handles even-length lists correctly. A brittle implementation that splits at the wrong index would falsely accept `[1,2]` as a palindrome.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: 'true',
      explanation_md:
        'The single-node edge case. A list of one element is trivially a palindrome. The slow/fast loop exits immediately with slow at the head; the second half is empty; no comparisons needed. Return `true`. Proves the algorithm handles `n = 1` without special-casing. The empty-second-half comparison loop runs zero iterations and falls through to `true`.',
      viz_anchor: null,
    },
  ],

  'remove-linked-list-elements': [
    {
      inputs: ['[1,2,6,3,4,5,6]', '6'],
      expected: '[1,2,3,4,5]',
      explanation_md:
        'The canonical LC example. Remove all nodes with value `val = 6`. Use a dummy node before head so the head itself can be removed uniformly. Walk with a `prev` pointer: if `prev.next.val == val`, skip it (`prev.next = prev.next.next`); else advance `prev`. The dummy ensures the head-removal case has no special path. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '1'],
      expected: '[]',
      explanation_md:
        'The empty-list edge case. Dummy points to `null`. The loop condition `prev.next != null` fails immediately. Return dummy.next = `null`. Proves the dummy-node pattern handles empty lists without crashing. A brittle implementation that always reads `head.val` first would NPE on empty input.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,7,7,7]', '7'],
      expected: '[]',
      explanation_md:
        'The "remove everything" case. Every node has value `7`. The loop removes them one by one until dummy.next = `null`. Return `null`. Proves the algorithm correctly handles full removal — without the dummy node, the head pointer would need explicit reassignment after each removal. The dummy abstracts the "before head" position, making the loop uniform.',
      viz_anchor: null,
    },
  ],

  'delete-node-in-a-linked-list': [
    {
      inputs: ['[4,5,1,9]', '5'],
      expected: '[4,1,9]',
      explanation_md:
        'The canonical LC example. You\'re given a pointer to the node to delete, NOT the head. The trick: copy the **next** node\'s value into the current node, then unlink the next. `node.val = node.next.val; node.next = node.next.next`. The current node now holds the next value, and the old next is unlinked. Result: `4 -> 1 -> 9`. **O(1)** time, **O(1)** space. Works only because the problem guarantees the node is not the tail.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,5,1,9]', '1'],
      expected: '[4,5,9]',
      explanation_md:
        'A second case. Pointer is at node value `1`. Copy `node.next.val = 9` into it, then unlink: `node.next = null`. Result: `4 -> 5 -> 9`. Proves the trick works on any non-tail position. The cleverness: there\'s no way to access the predecessor in O(1), so instead we overwrite the current node\'s identity with the next node\'s data and delete the next.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]', '3'],
      expected: '[1,2,4]',
      explanation_md:
        'A third case, near the tail. Pointer is at node value `3`. Copy `node.next.val = 4` into it, unlink. Result: `1 -> 2 -> 4`. Proves the algorithm works just before the tail. If `3` were the actual tail, the trick would break (no `next` to copy from) — but the problem explicitly excludes that case.',
      viz_anchor: null,
    },
  ],

  'middle-of-the-linked-list': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[3,4,5]',
      explanation_md:
        'The canonical LC example. Slow/fast pointers: slow advances 1 step per iteration, fast advances 2. When fast reaches the end, slow is at the middle. For odd-length list `[1,2,3,4,5]`: slow lands at index 2 (node `3`). Return the sublist from there: `[3,4,5]`. **O(n)** time, **O(1)** space. Single-pass — no length computation needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5,6]'],
      expected: '[4,5,6]',
      explanation_md:
        'The even-length case. Spec says return the **second** of the two middles. For `[1,2,3,4,5,6]`: slow lands at index 3 (node `4`). Return `[4,5,6]`. The loop condition `while fast && fast.next` is what produces "second middle" — if instead we used `while fast.next && fast.next.next`, slow would stop one earlier at the **first** middle. The chosen condition matches the problem spec exactly.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'The single-node edge case. Slow starts at the head; the loop condition `fast.next != null` fails immediately. Return the head — `[1]`. Proves the algorithm handles `n = 1` without entering the loop. A brittle implementation that always advances slow once before checking the condition would skip past the end on single-node input.',
      viz_anchor: null,
    },
  ],

  'design-linked-list': [
    {
      inputs: ['["MyLinkedList","addAtHead","addAtTail","addAtIndex","get","deleteAtIndex","get"]', '[[],[1],[3],[1,2],[1],[1],[1]]'],
      expected: '[null,null,null,null,2,null,3]',
      explanation_md:
        'The canonical LC example. Implement a singly linked list with `addAtHead`, `addAtTail`, `addAtIndex`, `get`, `deleteAtIndex`. Use a dummy head to simplify edge cases. Track size to bounds-check operations. Trace: addHead(1) → `1`. addTail(3) → `1 -> 3`. addAtIndex(1, 2) → `1 -> 2 -> 3`. get(1) → `2`. deleteAtIndex(1) → `1 -> 3`. get(1) → `3`. All operations are **O(n)** worst case (walk to index); space **O(n)** total.',
      viz_anchor: null,
    },
    {
      inputs: ['["MyLinkedList","get"]', '[[],[0]]'],
      expected: '[null,-1]',
      explanation_md:
        'The empty-list edge case. `get(0)` on an empty list returns `-1` (out of bounds). The bounds check is `index < 0 || index >= size`. Proves the size counter is mandatory for **O(1)** bounds-checking. A brittle implementation that walks until null without checking size would crash with NPE.',
      viz_anchor: null,
    },
    {
      inputs: ['["MyLinkedList","addAtHead","deleteAtIndex","get"]', '[[],[1],[0],[0]]'],
      expected: '[null,null,null,-1]',
      explanation_md:
        'A case proving size decrements on delete. Start empty. addHead(1) → `1`, size 1. deleteAtIndex(0) → empty, size 0. get(0) returns `-1` because size is now `0`. Proves the size counter must decrement on `delete`, not just increment on `add`. A brittle implementation that forgets the decrement would return the stale node value here.',
      viz_anchor: null,
    },
  ],

  'add-two-numbers': [
    {
      inputs: ['[2,4,3]', '[5,6,4]'],
      expected: '[7,0,8]',
      explanation_md:
        'The canonical LC example. Digits stored in reverse order (least-significant first), so addition proceeds left-to-right with carry. Walk both lists in parallel: `2+5=7` (carry 0), `4+6=10` (carry 1, digit 0), `3+4+1=8` (carry 0). Numbers: `342 + 465 = 807` → reversed `[7,0,8]`. **O(max(m,n))** time, **O(max(m,n))** space for the result. Use a dummy node to simplify head construction.',
      viz_anchor: null,
    },
    {
      inputs: ['[9,9,9,9,9,9,9]', '[9,9,9,9]'],
      expected: '[8,9,9,9,0,0,0,1]',
      explanation_md:
        'A case where the carry extends past the longest input. `9999999 + 9999 = 10009998` → reversed `[8,9,9,9,0,0,0,1]`. The loop must continue while either pointer is in bounds OR carry is nonzero — that final `1` carry needs a new node. Proves the loop condition `while (l1 || l2 || carry)` is mandatory; checking only `l1 || l2` would lose the trailing carry.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]', '[0]'],
      expected: '[0]',
      explanation_md:
        'The zero edge case. `0 + 0 = 0` → result list is `[0]`. The loop runs once with both digits `0`, no carry, append `0`. Return the single node. Proves the algorithm correctly handles the all-zero case without producing an empty list. A brittle implementation that strips leading zeros at the end would return `[]` here.',
      viz_anchor: null,
    },
  ],

  'merge-k-sorted-lists': [
    {
      inputs: ['[[1,4,5],[1,3,4],[2,6]]'],
      expected: '[1,1,2,3,4,4,5,6]',
      explanation_md:
        'The canonical LC example. Min-heap of `k` list heads. Pop the smallest, append to result, push the popped node\'s next (if any). Each push/pop is **O(log k)**. Total **O(N log k)** where `N` is the total node count. For 3 lists merged: pop `1`, push `4` from list 0; pop `1`, push `3`; pop `2`, push `6`; pop `3`, push `4`; etc. Final: `[1,1,2,3,4,4,5,6]`. Beats divide-and-conquer pairwise merge in clarity though same complexity.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-input edge case. `k = 0`, no lists to merge. Heap starts empty, return `null`. Proves the algorithm handles the zero-list case. A brittle implementation that always pops the first element would crash. The heap loop condition `while (!heap.isEmpty())` short-circuits cleanly.',
      viz_anchor: null,
    },
    {
      inputs: ['[[]]'],
      expected: '[]',
      explanation_md:
        'A case with one empty list. `k = 1`, but the only list is null. The heap initialization filters null heads, so the heap starts empty. Return `null`. Proves the algorithm correctly handles **internal** empty lists, not just an empty outer array. A brittle implementation that pushes every head without null-checking would crash on the first pop.',
      viz_anchor: null,
    },
  ],

  'balanced-binary-tree': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. A tree is balanced if for every node, the heights of its left and right subtrees differ by at most 1. Bottom-up DFS: return the height, or `-1` if imbalanced anywhere below. If either child returns `-1`, propagate; if `|left - right| > 1`, return `-1`. **O(n)** time, **O(h)** stack. The naive top-down `isBalanced(left) && isBalanced(right) && |height(left) - height(right)| <= 1` is **O(n²)** because height is recomputed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,2,3,3,null,null,4,4]'],
      expected: 'false',
      explanation_md:
        'A skewed tree. The left subtree has depth 4 (`1 -> 2 -> 3 -> 4`); the right subtree has depth 2 (`1 -> 2`). At the root, `|left - right| = 2 > 1` → imbalanced. Return `false`. The bottom-up DFS catches this at the deepest skewed node (`2` with depth-2 left vs depth-0 right) and propagates `-1` all the way up. Proves the algorithm detects imbalance at any level, not just the root.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: 'true',
      explanation_md:
        'The empty-tree edge case. An empty tree is trivially balanced. DFS returns height `0` at the null base case. No imbalance signaled. Return `true`. Proves the algorithm correctly considers null trees as balanced. A brittle implementation that requires a non-null root would crash on empty input.',
      viz_anchor: null,
    },
  ],

  'minimum-depth-of-binary-tree': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Min depth = the number of nodes along the shortest root-to-**leaf** path. BFS is cleanest: level-by-level, return the level at which the first leaf is found. For `[3,9,20,null,null,15,7]`: level 1 = root `3`; level 2 includes `9` (leaf!), return `2`. **O(n)** time worst case, but BFS short-circuits at the first leaf — much faster than DFS on lopsided trees. **O(w)** space where `w` is max level width.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,null,3,null,4,null,5,null,6]'],
      expected: '5',
      explanation_md:
        'A right-skewed tree, every node has only a right child. The single leaf is at depth 5. The naive `min(left, right) + 1` recursive formula would return `1` (treating null-left as depth 0) — that\'s wrong. The fix: if one child is null, take the other child\'s depth; only take the min when both are non-null. This input is the canonical proof that `null` is not a leaf.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-tree edge case. Min depth of an empty tree is defined as `0` (no path, no nodes). Recursion returns `0` at the null base. BFS exits the queue without finding anything. Either way, return `0`. Proves the algorithm handles empty input cleanly. A brittle implementation that requires a leaf to be reached would loop forever or NPE.',
      viz_anchor: null,
    },
  ],

  'count-complete-tree-nodes': [
    {
      inputs: ['[1,2,3,4,5,6]'],
      expected: '6',
      explanation_md:
        'The canonical LC example. Naive DFS is **O(n)**, but we can do **O(log²n)** by exploiting completeness. Walk left from root counting left-depth; walk right counting right-depth. If equal, the subtree is a perfect tree with `2^depth - 1` nodes — return without recursing. If different, recurse into both children. For `[1,2,3,4,5,6]`: left-depth from root = 3, right-depth = 2. Not perfect, recurse. Left subtree is perfect (depth 2, 3 nodes); right subtree count = `1 + 1 + 0 = 2`. Total `1 + 3 + 2 = 6`. Verify left-depth/right-depth at every recursion.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-tree edge case. No nodes. Return `0` immediately. Proves the algorithm short-circuits on null root without crashing. A brittle implementation that always reads `root.left` first would NPE here. The base case `if (!root) return 0` is mandatory.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'The single-node edge case. Left-depth and right-depth both `1`. The "perfect" shortcut returns `2^1 - 1 = 1` without recursing. Proves the perfect-tree formula correctly handles the smallest perfect tree. A brittle implementation that requires recursion for every case would still get the right answer but in **O(1)** instead of via the shortcut.',
      viz_anchor: null,
    },
  ],

  'binary-tree-paths': [
    {
      inputs: ['[1,2,3,null,5]'],
      expected: '["1->2->5","1->3"]',
      explanation_md:
        'The canonical LC example. DFS with a path buffer. At each node, append the current value; if leaf, record the joined path; else recurse into non-null children; pop on the way out. For `[1,2,3,null,5]`: path `1 -> 2 -> 5` (left subtree leaf), path `1 -> 3` (right child is a leaf). Return `["1->2->5", "1->3"]`. **O(n·h)** time, **O(h)** stack. The buffer mutation pattern (push/pop) keeps space optimal.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '["1"]',
      explanation_md:
        'The single-node edge case. The root is itself a leaf. Path is just `"1"`. Proves the algorithm correctly treats a single-node tree as one path. A brittle implementation that requires at least one edge would return an empty list. The leaf check `if (!node.left && !node.right) record` is what handles this.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. No paths. Return `[]`. Proves the DFS short-circuits on null root. A brittle implementation that always reads `root.val` would NPE here. The base case `if (!root) return []` (or equivalent guard in the DFS helper) is essential.',
      viz_anchor: null,
    },
  ],

  'sum-of-left-leaves': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: '24',
      explanation_md:
        'The canonical LC example. DFS, but with a flag indicating whether the current node is a **left** child. At each leaf, add to the sum only if the left-child flag is set. For `[3,9,20,null,null,15,7]`: `9` is a left child AND a leaf → add 9. `15` is a left child AND a leaf → add 15. `7` is a right child → skip. Total `24`. **O(n)** time, **O(h)** stack. The flag distinguishes "left leaf" from "any leaf" without restructuring the tree.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-tree edge case. No leaves, sum is `0`. The DFS short-circuits on null root. Proves the base case handles empty trees cleanly. A brittle implementation that always reads `root.val` would NPE here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '0',
      explanation_md:
        'The single-node edge case. The root is a leaf but **not** a left child (it has no parent). Return `0`. Proves the algorithm correctly excludes the root from the "left leaves" set — the left-child flag is `false` at the root level. A brittle implementation that counts any leaf would return `1` here, wrong.',
      viz_anchor: null,
    },
  ],

  'find-mode-in-binary-search-tree': [
    {
      inputs: ['[1,null,2,2]'],
      expected: '[2]',
      explanation_md:
        'The canonical LC example. BST inorder traversal visits values in sorted order, so duplicates are consecutive. Walk inorder, tracking `currentVal, currentCount, maxCount, modes`. On each visit: if same as `currentVal`, increment `currentCount`; else reset. If `currentCount > maxCount`, clear modes and start a new list; if equal, append. For `[1,null,2,2]`: inorder `1, 2, 2`. `1` count 1 → mode. `2` count 1 → tie with 1 → mode set `[1,2]`... wait, restart: `2` count 2 → exceeds `1` → modes `[2]`. Return `[2]`. **O(n)** time, **O(1)** extra space (excluding stack).',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[0]',
      explanation_md:
        'The single-node edge case. Only one value, trivially the mode. Inorder visits `0`, count 1, maxCount 1, modes `[0]`. Proves the algorithm handles `n = 1` without special-casing. The reset/append logic gracefully degenerates: the first visit always sets the mode to itself.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,2]'],
      expected: '[1]',
      explanation_md:
        'A multi-mode candidate case. Tree: root `1`, left `1`, right `2`. Inorder: `1, 1, 2`. First `1`: count 1, modes `[1]`. Second `1`: count 2, exceeds maxCount → modes `[1]`. `2`: count 1, less than maxCount → no change. Return `[1]`. Proves the algorithm correctly tracks count transitions across the tree structure, not just along a single path.',
      viz_anchor: null,
    },
  ],

  'diameter-of-binary-tree': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '3',
      explanation_md:
        'The canonical LC example. Diameter = longest path between any two nodes (counted in edges). For each node, the longest path **through** it equals `leftHeight + rightHeight`. Track a running max. DFS returns the height; at each node, update `diameter = max(diameter, left + right)`. For `[1,2,3,4,5]`: left subtree (root `2`) has height 2, right (root `3`) has height 1. At root, path `4 -> 2 -> 1 -> 3` has 3 edges. Return `3`. **O(n)** time, **O(h)** stack.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: '1',
      explanation_md:
        'A two-node case. Root has only a left child. Left height 1, right height 0. Diameter through root = 1 edge. Return `1`. Proves the algorithm correctly counts **edges**, not nodes — the path `1 -> 2` has 1 edge despite touching 2 nodes. A brittle implementation that counts nodes would return `2` here, wrong by spec.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-tree edge case. No nodes, no path, diameter `0`. The DFS short-circuits on null root, returning height `0` without updating the diameter. Proves the algorithm handles empty input cleanly. A brittle implementation that requires at least one node to initialize the diameter would crash here.',
      viz_anchor: null,
    },
  ],

  'subtree-of-another-tree': [
    {
      inputs: ['[3,4,5,1,2]', '[4,1,2]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. For each node in `root`, check if the subtree rooted there is structurally identical to `subRoot`. Recursive check: `isSame(a, b)` returns true if both null, or values match and both children match. Outer DFS: `isSubtree(root) = isSame(root, subRoot) || isSubtree(root.left) || isSubtree(root.right)`. For `[3,4,5,1,2]` vs `[4,1,2]`: at node `4` in root, `isSame` succeeds. Return `true`. **O(m·n)** worst case where `m`, `n` are tree sizes.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,4,5,1,2,null,null,null,null,0]', '[4,1,2]'],
      expected: 'false',
      explanation_md:
        'A case where the candidate subtree has the same root value but extra nodes. Node `4` in `root` has a child `2` with a further child `0`; `subRoot` `[4,1,2]` has no such grandchild. `isSame` detects the mismatch at the `2 vs 0` level and returns false. The outer DFS continues but no other node matches `4`. Return `false`. Proves structural identity is required, not just value match at the root of the candidate.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]', '[1]'],
      expected: 'true',
      explanation_md:
        'A case where the subRoot is a leaf. `subRoot = [1]` (single node). Walking `root = [1,1]`: at node `1` (left child, a leaf), `isSame(leaf, [1])` succeeds (both null children match). Return `true`. Proves the algorithm correctly finds single-node subtrees. The leaf-leaf comparison terminates with `both children null`, which `isSame` handles as a match.',
      viz_anchor: null,
    },
  ],

  'average-of-levels-in-binary-tree': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: '[3.00000,14.50000,11.00000]',
      explanation_md:
        'The canonical LC example. BFS level by level. For each level, sum values and divide by the count. Level 0: `[3]`, avg `3.0`. Level 1: `[9, 20]`, avg `14.5`. Level 2: `[15, 7]`, avg `11.0`. Return `[3.0, 14.5, 11.0]`. **O(n)** time, **O(w)** space where `w` is max level width. Use a queue and process exactly `levelSize` nodes per iteration.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,9,20,15,7]'],
      expected: '[3.00000,14.50000,11.00000]',
      explanation_md:
        'A complete-tree version of the canonical case. Level 0: `[3]`, avg `3.0`. Level 1: `[9, 20]`, avg `14.5`. Level 2: `[15, 7]` (children of `9`), avg `11.0`. Proves the BFS iteration correctly groups children of distinct parents within the same level — the queue interleaves them but the level-size counter slices them correctly.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1.00000]',
      explanation_md:
        'The single-node edge case. One level, one value, average `1.0`. The BFS loop processes one node, computes the level avg, exits. Return `[1.0]`. Proves the algorithm handles `n = 1` without special-casing. The level-size counter starts at 1 and processes the root cleanly.',
      viz_anchor: null,
    },
  ],

  'binary-tree-right-side-view': [
    {
      inputs: ['[1,2,3,null,5,null,4]'],
      expected: '[1,3,4]',
      explanation_md:
        'The canonical LC example. The right view = rightmost node at each level. BFS level by level; record the last node of each level. Level 0: `[1]` → `1`. Level 1: `[2, 3]` → `3`. Level 2: `[5, 4]` → `4`. Return `[1, 3, 4]`. **O(n)** time, **O(w)** space. Alternatively, DFS right-first with depth tracking, recording the first node seen at each new depth.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,null,3]'],
      expected: '[1,3]',
      explanation_md:
        'A case where the rightmost path is on the right child only. Level 0: `[1]`, level 1: `[3]`. The view is `[1, 3]`. Proves the algorithm correctly handles trees where the left side is missing — the rightmost node of each level is simply whatever exists. A brittle implementation that requires both children at every level would fail here.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. No levels, no view. Return `[]`. The BFS queue starts empty, loop never enters. Proves the algorithm correctly handles null root without special-casing. A brittle implementation that always reads `root.val` first would NPE.',
      viz_anchor: null,
    },
  ],

  'binary-tree-level-order-traversal': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: '[[3],[9,20],[15,7]]',
      explanation_md:
        'The canonical LC example. BFS, grouping nodes by level. Queue starts with root; for each iteration, capture the current queue size (the level width), pop that many nodes appending values to a level array, push non-null children for the next iteration. Result: `[[3], [9, 20], [15, 7]]`. **O(n)** time, **O(w)** space where `w` is max level width. The level-size snapshot is essential — it slices the queue into per-level buckets.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[[1]]',
      explanation_md:
        'The single-node edge case. One level, one node. The BFS loop runs once with level-size 1. Return `[[1]]`. Proves the algorithm handles `n = 1` without special-casing. The level-size capture starts at 1 and the loop terminates after processing the root.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. No levels, empty result. The BFS queue starts empty, the outer loop never enters. Return `[]`. Proves the algorithm correctly handles null root. A brittle implementation that initializes a level array before checking for null would return `[[]]` — wrong by spec.',
      viz_anchor: null,
    },
  ],

  'binary-tree-zigzag-level-order-traversal': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: '[[3],[20,9],[15,7]]',
      explanation_md:
        'The canonical LC example. BFS level by level, but reverse every other level. Track a `leftToRight` flag, flipping after each level. For `[3,9,20,null,null,15,7]`: level 0 LTR `[3]`. Level 1 RTL → reverse `[9, 20]` to `[20, 9]`. Level 2 LTR `[15, 7]`. Return `[[3], [20, 9], [15, 7]]`. **O(n)** time, **O(w)** space. The reversal can be done by appending to a deque from front or back depending on direction — avoids the explicit reverse call.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[[1]]',
      explanation_md:
        'The single-node edge case. One level, no zigzag needed. Return `[[1]]`. Proves the algorithm handles `n = 1` without entering the reversal logic — the flag stays at its initial state.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. No levels. Return `[]`. The BFS queue starts empty. Proves the algorithm correctly handles null root. A brittle implementation that always flips the direction flag before the null check would still return `[]` but waste a no-op flip.',
      viz_anchor: null,
    },
  ],

  'populate-next-right-pointers-in-each-node': [
    {
      inputs: ['[1,2,3,4,5,6,7]'],
      expected: '[1,#,2,3,#,4,5,6,7,#]',
      explanation_md:
        'The canonical LC example for a **perfect** binary tree. Connect each node\'s `next` pointer to its right neighbor at the same level (or null if rightmost). Trick: use established `next` pointers on level `k` to traverse level `k+1` in **O(1)** space. At each node: `node.left.next = node.right` and `node.right.next = node.next ? node.next.left : null`. Traverse left edge to descend levels. **O(n)** time, **O(1)** extra space — beats BFS (which uses **O(w)**).',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. No nodes, return immediately. The traversal loop\'s outer condition `if (!root) return null` short-circuits. Proves the algorithm handles null root without crashing. A brittle implementation that always reads `root.left` first would NPE here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '[1,#,2,3,#]',
      explanation_md:
        'A two-level perfect tree. Root has left `2` and right `3`. Set `2.next = 3`, `3.next = null` (root has no `next`). Return. Proves the algorithm correctly handles the smallest perfect tree (depth 2). The level-2 traversal uses the now-established `next` links — for level 2, both `2.left` and `2.right` are null, so no further wiring happens.',
      viz_anchor: null,
    },
  ],

  'flatten-binary-tree-to-linked-list': [
    {
      inputs: ['[1,2,5,3,4,null,6]'],
      expected: '[1,null,2,null,3,null,4,null,5,null,6]',
      explanation_md:
        'The canonical LC example. Flatten to a right-skewed list in preorder. **O(n)** time, **O(1)** extra space using the Morris-style trick: at each node, if it has a left child, find the rightmost node of the left subtree, attach the right subtree there, then move the left subtree to the right and null out the left. Move to right and repeat. For `[1,2,5,3,4,null,6]`: preorder `1, 2, 3, 4, 5, 6`. After flatten, list is `1 -> 2 -> 3 -> 4 -> 5 -> 6` (all right pointers).',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. Nothing to flatten. Return immediately. Proves the algorithm handles null root without crashing. A brittle implementation that always reads `root.right` first would NPE here.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[0]',
      explanation_md:
        'The single-node edge case. Already "flat" — no left subtree to move, no right subtree to attach. Return as-is. Proves the algorithm correctly handles `n = 1` — the Morris loop iterates over `root`, finds no left child, advances to `null` and exits.',
      viz_anchor: null,
    },
  ],

  'construct-binary-tree-from-preorder-and-inorder-traversal': [
    {
      inputs: ['[3,9,20,15,7]', '[9,3,15,20,7]'],
      expected: '[3,9,20,null,null,15,7]',
      explanation_md:
        'The canonical LC example. Preorder gives root-first; inorder splits into left/right subtrees around the root. Use a hash map `value -> inorder index` for **O(1)** lookups. Recursive: take next preorder value as the current root, find its index in inorder, recurse on the inorder-left segment, then inorder-right segment. Tree: root `3`, left subtree from `[9]` is leaf `9`, right subtree from `[15, 20, 7]` has root `20` with children `15, 7`. Final tree matches `[3,9,20,null,null,15,7]`. **O(n)** time and space.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1]', '[-1]'],
      expected: '[-1]',
      explanation_md:
        'The single-node edge case. Both arrays are `[-1]`. The recursion creates a leaf with value `-1` and returns. Proves the algorithm correctly handles `n = 1` without special-casing — the recursive base case `if (lo > hi) return null` short-circuits left and right subtrees of the lone leaf.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '[3,2,1]'],
      expected: '[1,2,null,3]',
      explanation_md:
        'A left-skewed tree. Preorder `[1, 2, 3]` says root is `1`, then `2`, then `3`. Inorder `[3, 2, 1]` says `1` is rightmost, so its entire tree is left-of-`1`. Within left, root is `2`, and inorder says `2` is rightmost there too — so its tree is left-of-`2`. Recursion yields tree `1 (left=2 (left=3))`. Proves the algorithm correctly handles fully skewed trees, where one side is always empty. The hash map ensures each split is **O(1)**.',
      viz_anchor: null,
    },
  ],
};

async function main() {
  const ids = Object.keys(PAYLOAD);
  const { data: rows, error: readErr } = await sb
    .from('PGcode_problems').select('id').in('id', ids);
  if (readErr) { console.error('READ ERR', readErr.message); process.exit(1); }
  const present = new Set(rows.map(r => r.id));

  let ok = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const samples = PAYLOAD[id];
    if (!present.has(id)) {
      console.log(`SKIP   ${id}  (not in DB)`);
      skipped++;
      continue;
    }
    if (!Array.isArray(samples) || samples.length !== 3) {
      console.log(`ERR    ${id}  (payload length ${samples?.length} != 3)`);
      failed++;
      continue;
    }
    let shapeOk = true;
    for (const s of samples) {
      if (!Array.isArray(s.inputs) || typeof s.expected !== 'string'
          || typeof s.explanation_md !== 'string'
          || (s.viz_anchor !== null && typeof s.viz_anchor !== 'string')) {
        shapeOk = false; break;
      }
    }
    if (!shapeOk) {
      console.log(`ERR    ${id}  (sample shape invalid)`);
      failed++;
      continue;
    }
    const { error } = await sb.from('PGcode_problems')
      .update({ explained_samples: samples })
      .eq('id', id);
    if (error) {
      console.log(`ERR    ${id}  ${error.message}`);
      failed++;
    } else {
      console.log(`✓ ${id}`);
      ok++;
    }
  }
  console.log(`\nDone. ok=${ok}  skipped=${skipped}  failed=${failed}  total=${ids.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
