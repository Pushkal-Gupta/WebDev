#!/usr/bin/env node
// Build WAVE 35K: middle-of-the-linked-list + merge-nodes-in-between-zeros
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ============================================================
// PROBLEM 1: middle-of-the-linked-list (LC 876)
//   middleNode(head: LC array) -> LC array (tail from middle node)
//   When two middles exist, return the SECOND.
//   Slow/fast pointer; reference works directly on the array.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F36AA);

  function ref(arr) {
    // Equivalent to slow/fast on a linked list whose values are arr.
    // For even-length, returns the second middle (index n/2 if 0-indexed).
    const n = arr.length;
    if (n === 0) return [];
    const mid = Math.floor(n / 2);
    return arr.slice(mid);
  }

  const cases = [];
  // LC sample 1: [1,2,3,4,5] -> [3,4,5]
  cases.push([[1, 2, 3, 4, 5]]);
  // LC sample 2: [1,2,3,4,5,6] -> [4,5,6]
  cases.push([[1, 2, 3, 4, 5, 6]]);
  // Single node
  cases.push([[1]]);
  // Two nodes -> second is middle
  cases.push([[1, 2]]);
  // Three nodes -> middle is index 1
  cases.push([[1, 2, 3]]);
  // Four nodes -> second middle is index 2
  cases.push([[1, 2, 3, 4]]);
  // Empty (defensive)
  cases.push([[]]);
  // All identical
  cases.push([[7, 7, 7, 7, 7]]);
  cases.push([[7, 7, 7, 7]]);
  // Negative values
  cases.push([[-5, -3, -1]]);
  cases.push([[-10, -20, -30, -40]]);
  // Mixed sign
  cases.push([[-2, -1, 0, 1, 2]]);
  // Larger odd
  cases.push([[1, 2, 3, 4, 5, 6, 7]]);
  cases.push([[10, 20, 30, 40, 50, 60, 70, 80, 90]]);
  // Larger even
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8]]);
  cases.push([[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]]);
  // Strictly increasing
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]);
  // Strictly decreasing
  cases.push([[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]]);
  // With zeros
  cases.push([[0, 0, 0]]);
  cases.push([[0, 1, 0, 1]]);
  // Length 12, 13
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]]);
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]]);
  // Boundary-ish values (LC says -100..100, 1..100 nodes)
  cases.push([[100, -100, 100, -100]]);
  cases.push([[100]]);
  cases.push([[-100]]);
  // Palindrome-shaped
  cases.push([[1, 2, 3, 2, 1]]);
  cases.push([[1, 2, 2, 1]]);
  // Random LCG cases
  while (cases.length < 35) {
    const n = 1 + (lcg() % 20); // 1..20
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push((lcg() % 201) - 100); // -100..100
    }
    cases.push([arr]);
  }

  const test_cases = cases.map(([arr]) => ({
    inputs: [JSON.stringify(arr)],
    expected: JSON.stringify(ref(arr))
  }));

  return {
    slug: "middle-of-the-linked-list",
    obj: {
      description: "Given the `head` of a singly linked list, return **the middle node** of the linked list. If there are **two middle nodes**, return the **second** middle node.\n\n**Example 1**\n\n```\nInput:  head = [1,2,3,4,5]\nOutput: [3,4,5]\nExplanation: The middle node of the list is node 3.\n```\n\n**Example 2**\n\n```\nInput:  head = [1,2,3,4,5,6]\nOutput: [4,5,6]\nExplanation: Since the list has two middle nodes with values 3 and 4, we return the second one.\n```\n\nThis is **LeetCode 876**. The canonical one-pass solution uses the **slow/fast pointer (tortoise & hare)** trick: advance `slow` by one and `fast` by two each step. When `fast` falls off the end, `slow` sits exactly on the middle node — automatically the second middle when the length is even.",
      method_name: "middleNode",
      params: [
        { name: "head", type: "ListNode" }
      ],
      return_type: "ListNode",
      tags: ["linked-list", "two-pointers", "fast-slow-pointers"],
      pattern: "**Slow/fast pointer (tortoise & hare) — single pass, O(1) extra space.**\n\n**The setup.** Initialize both pointers to `head`. In a loop, advance `slow` by 1 and `fast` by 2 per iteration. Terminate when `fast` is null OR `fast.next` is null — at that moment, `slow` is on the middle node.\n\n```\nslow = head\nfast = head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\nreturn slow\n```\n\n**Why it lands on the middle.** Each iteration `slow` covers half as much ground as `fast`. When `fast` has covered the full length `n` (and stops), `slow` has covered `n / 2` — the middle node. The loop guard `while fast and fast.next` handles both parity cases without a branch:\n\n- **Odd length `n = 2k + 1`:** `fast` walks `0 -> 2 -> 4 -> ... -> 2k`. At that point `fast.next == null`, so the loop exits. `slow` has walked `0 -> 1 -> 2 -> ... -> k`. That is the exact middle.\n- **Even length `n = 2k`:** `fast` walks `0 -> 2 -> 4 -> ... -> 2k - 2 -> null`. Loop exit on `fast == null`. `slow` has walked `0 -> 1 -> 2 -> ... -> k`. Index `k` of a length-`2k` list is the **second** middle (LC's required tie-break).\n\n**Worked example.** `head = [1, 2, 3, 4, 5, 6]`. Iteration trace:\n\n```\nstart:   slow=1, fast=1\niter 1:  slow=2, fast=3\niter 2:  slow=3, fast=5\niter 3:  slow=4, fast=null (5.next.next = null)\nexit.    return slow = 4. Tail from slow = [4, 5, 6].\n```\n\n**Brute-force.** Walk the list once to compute length `n`. Walk again from `head` to index `n / 2`. Two passes, still `O(n)` time and `O(1)` space — slightly cleaner code but loses the elegance of a single traversal. Acceptable in an interview; the one-pass version is preferred because it generalizes (find-cycle, find-kth-from-end, etc.).\n\n**Array-backing approach.** Push every node into a list, return `nodes[n / 2]`. `O(n)` time AND `O(n)` space — strictly worse. Only useful when you also need random access for other reasons.\n\n**Why the second-middle bias is automatic.** When `n` is even, after `k` iterations `slow` is at index `k` (which is the second middle of a 0-indexed length-`2k` list). To return the FIRST middle instead, you would either (a) use a one-step-behind pointer (initialize `slow_prev = null`, advance `slow_prev = slow` before bumping `slow`), or (b) start `fast` one node ahead so the parity flips. LC asks for the second middle, which the textbook code already gives.\n\n**Edge cases.**\n- **Empty list** (`head == null`): the loop never enters; `slow` is null; return null. Most LC implementations return `head` unchanged when null.\n- **Single node**: loop guard fails on `fast.next == null` immediately; return `head`.\n- **Two nodes**: one iteration; `slow` lands on the second node.\n- **Three nodes**: one iteration; `slow` lands on the middle (index 1).\n\n**Why this matters for follow-ups.** The tortoise-and-hare technique is the foundation for **detecting cycles** (LC 141), **finding the start of a cycle** (LC 142), **finding the kth-from-end node**, and **palindrome list check** (split at the middle, reverse the second half). Mastering the off-by-one of when `slow` lands on the FIRST vs SECOND middle is a recurring interview snag.",
      follow_up: "**Variant 1 — return the FIRST middle when the length is even.** Use a one-step-behind pointer:\n\n```\nprev = None\nslow = fast = head\nwhile fast and fast.next:\n    prev = slow\n    slow = slow.next\n    fast = fast.next.next\nreturn slow if (length is odd) else prev\n```\n\nA cleaner alternative: start `fast` one node ahead (`fast = head.next`). The parity flips and `slow` ends on the first middle.\n\n**Variant 2 — find the kth-from-end node.** Same tortoise/hare trick with a delay: advance `fast` by `k` steps first, then advance both pointers in lock-step until `fast` falls off the end.\n\n**Variant 3 — split the list at the middle.** After finding the middle, sever the link from the node before the middle to the middle itself; return the two heads. Useful for merge-sort on linked lists.\n\n**Variant 4 — middle of a circular list.** Detect cycle first (Floyd's cycle detection). For a single-loop circular list with no acyclic prefix, the 'middle' is well-defined only relative to a chosen start.\n\n**Variant 5 — middle of a doubly-linked list.** Same algorithm; the doubly-linked structure is irrelevant for finding the middle but lets you walk backward from the middle for some downstream work.\n\n**Variant 6 — return the middle as `(value, position)`.** Track the index by incrementing a counter alongside `slow`.\n\n**Implementation pitfalls.**\n1. **Using `while fast.next and fast.next.next`.** Off-by-one: returns the first middle instead of the second. Use `while fast and fast.next` for LC 876 semantics.\n2. **Initializing `slow = head.next`.** Same off-by-one — `slow` finishes one node ahead of where LC wants.\n3. **Not guarding against `head == null`.** Dereferencing `head` crashes. The `while fast and fast.next` guard handles this if `fast` and `slow` both start at `head`.\n4. **Forgetting that the return is a NODE, not an INDEX.** Some interviews want the node reference (so the caller can walk the tail); others want the value. Clarify with the interviewer.\n5. **Trying to track length separately.** Defeats the purpose of the technique — the elegance is that you NEVER need to know `n` explicitly.\n6. **Using `fast.next != null && fast.next.next != null` in the wrong place.** Equivalent to the off-by-one variant; consistent with first-middle semantics.",
      complexity: {
        time: "**O(n)** where `n` is the list length. `slow` traverses `n / 2` nodes; `fast` traverses `n` nodes. Total work is linear.",
        space: "**O(1)** — two pointers, no allocations. The two-pass length-then-walk approach is also `O(1)` space; the array-backing approach is `O(n)` and strictly worse.",
        notes: "Two-pointer tricks are constant-extra-space and single-pass — the canonical answer for any 'find a structural anchor in a linked list' problem.",
        optimal: "**O(n) time and O(1) space** is tight — you must visit at least `n / 2` nodes to know where the middle is, and you cannot avoid traversing the structure of a singly-linked list."
      },
      constraints: [
        "The number of nodes in the list is in the range [1, 100].",
        "1 <= Node.val <= 100",
        "Return the SECOND middle when two middles exist (even-length lists)."
      ],
      hints: [
        "**Use two pointers** starting at `head`. Advance one by 1 and the other by 2 per iteration.",
        "**Loop guard `while fast and fast.next`** — terminates correctly for both odd and even lengths.",
        "**When the loop exits, `slow` is exactly on the middle node.** For even-length lists, this is the SECOND middle (LC's required tie-break).",
        "**One pass, O(1) space.** No need to count the list first.",
        "**To return the FIRST middle instead, start `fast = head.next`** (parity flips) OR keep a `prev` pointer that lags one step behind `slow`.",
        "**Tortoise-and-hare generalizes** to cycle detection, kth-from-end, and palindrome-list checks."
      ],
      test_cases,
      solutions: {
        python: "from typing import Optional, List\n\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n\nclass Solution:\n    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        slow = head\n        fast = head\n        while fast and fast.next:\n            slow = slow.next\n            fast = fast.next.next\n        return slow\n",
        javascript: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val);\n *     this.next = (next===undefined ? null : next);\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar middleNode = function(head) {\n    let slow = head;\n    let fast = head;\n    while (fast && fast.next) {\n        slow = slow.next;\n        fast = fast.next.next;\n    }\n    return slow;\n};\n",
        java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode middleNode(ListNode head) {\n        ListNode slow = head;\n        ListNode fast = head;\n        while (fast != null && fast.next != null) {\n            slow = slow.next;\n            fast = fast.next.next;\n        }\n        return slow;\n    }\n}\n",
        cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* middleNode(ListNode* head) {\n        ListNode* slow = head;\n        ListNode* fast = head;\n        while (fast != nullptr && fast->next != nullptr) {\n            slow = slow->next;\n            fast = fast->next->next;\n        }\n        return slow;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: merge-nodes-in-between-zeros (LC 2181)
//   mergeNodes(head: LC array) -> LC array
//   List starts and ends with 0. Between consecutive 0s, sum the values into
//   a single node; drop the 0s.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F36AB);

  function ref(arr) {
    // arr always starts and ends with 0. Sum values strictly between consecutive 0s.
    const out = [];
    let acc = 0;
    let inSegment = false;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v === 0) {
        if (inSegment) {
          out.push(acc);
          acc = 0;
          inSegment = false;
        }
        // first zero marks segment start; subsequent zeros end a segment
        inSegment = true;
      } else {
        acc += v;
      }
    }
    // Per problem: arr begins AND ends with 0, so the loop naturally flushes.
    // The trailing 0 sets inSegment = true with acc = 0; nothing to push.
    return out;
  }

  // Helper: build a "zeros-delimited" array from a list of positive sums.
  function makeFromSegments(segments, segLen) {
    // segments: array of arrays of positive ints; each becomes a segment between 0s.
    // Output: [0, seg0..., 0, seg1..., 0, ..., 0]
    const out = [0];
    for (const seg of segments) {
      for (const v of seg) out.push(v);
      out.push(0);
    }
    return out;
  }

  const cases = [];
  // LC sample 1: [0,3,1,0,4,5,2,0] -> [4,11]
  cases.push([[0, 3, 1, 0, 4, 5, 2, 0]]);
  // LC sample 2: [0,1,0,3,0,2,2,0] -> [1,3,4]
  cases.push([[0, 1, 0, 3, 0, 2, 2, 0]]);
  // Smallest valid: [0,0] would be empty between, but constraint says no two consecutive 0s.
  // So minimum is [0, v, 0] -> [v]
  cases.push([[0, 5, 0]]);
  cases.push([[0, 1, 0]]);
  cases.push([[0, 1000, 0]]);
  // Two segments
  cases.push([[0, 1, 2, 0, 3, 0]]);
  cases.push([[0, 1, 0, 2, 0]]);
  // Three segments of length 1
  cases.push([[0, 1, 0, 2, 0, 3, 0]]);
  // Single segment of varying lengths
  cases.push([[0, 1, 2, 3, 4, 5, 0]]);
  cases.push([[0, 10, 20, 30, 40, 50, 60, 70, 0]]);
  // Mixed lengths and values
  cases.push([[0, 7, 0, 1, 2, 3, 0, 4, 0]]);
  cases.push([[0, 100, 200, 0, 50, 0, 1, 2, 3, 4, 0]]);
  // Long single segment
  cases.push([[0, 1, 1, 1, 1, 1, 1, 1, 1, 0]]);
  // All equal in each segment
  cases.push([[0, 5, 5, 5, 0, 5, 5, 0]]);
  // Single-value segments alternating
  cases.push([[0, 9, 0, 9, 0, 9, 0]]);
  // Segment with max-ish values
  cases.push([[0, 999, 1, 0]]);
  cases.push([[0, 500, 500, 0]]);
  // Larger structure
  cases.push([[0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]]);
  cases.push([[0, 2, 0, 4, 0, 6, 0, 8, 0]]);
  // Long mixed
  cases.push([[0, 1, 2, 3, 0, 4, 5, 0, 6, 0, 7, 8, 9, 10, 0]]);
  // Two segments of equal sum
  cases.push([[0, 3, 4, 0, 7, 0]]);
  // Segment with descending values
  cases.push([[0, 5, 4, 3, 2, 1, 0]]);
  // Segment with ascending values
  cases.push([[0, 1, 2, 3, 4, 5, 0, 6, 7, 0]]);
  // Lots of small segments
  cases.push([[0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]]);
  // Mixed singletons and longer segments
  cases.push([[0, 11, 0, 1, 2, 0, 33, 0, 4, 5, 6, 0]]);

  // Random LCG cases.
  while (cases.length < 35) {
    const segCount = 1 + (lcg() % 5); // 1..5 segments
    const segs = [];
    for (let s = 0; s < segCount; s++) {
      const len = 1 + (lcg() % 5); // 1..5 nodes per segment
      const seg = [];
      for (let i = 0; i < len; i++) {
        seg.push(1 + (lcg() % 999)); // 1..999
      }
      segs.push(seg);
    }
    cases.push([makeFromSegments(segs)]);
  }

  const test_cases = cases.map(([arr]) => ({
    inputs: [JSON.stringify(arr)],
    expected: JSON.stringify(ref(arr))
  }));

  return {
    slug: "merge-nodes-in-between-zeros",
    obj: {
      description: "You are given the `head` of a linked list, which contains a series of integers **separated by `0`'s**. The **beginning** and **end** of the linked list will have `Node.val == 0`.\n\nFor every two consecutive `0`'s, **merge** all the nodes lying in between them into a single node whose value is the **sum** of all the merged nodes. The modified list should **not contain any `0`'s**.\n\nReturn the `head` of the modified linked list.\n\n**Example 1**\n\n```\nInput:  head = [0,3,1,0,4,5,2,0]\nOutput: [4,11]\nExplanation:\n  Segment 1 between the first two 0s: 3 + 1 = 4.\n  Segment 2 between the last two 0s: 4 + 5 + 2 = 11.\n```\n\n**Example 2**\n\n```\nInput:  head = [0,1,0,3,0,2,2,0]\nOutput: [1,3,4]\nExplanation:\n  Segment 1: 1.\n  Segment 2: 3.\n  Segment 3: 2 + 2 = 4.\n```\n\nThis is **LeetCode 2181**. The canonical solution is a **single linear scan** with a running accumulator that flushes into the output list whenever a `0` boundary is hit.",
      method_name: "mergeNodes",
      params: [
        { name: "head", type: "ListNode" }
      ],
      return_type: "ListNode",
      tags: ["linked-list", "simulation", "two-pointers"],
      pattern: "**Single linear scan with a running accumulator — O(n) time, O(1) extra space.**\n\n**The structure of the input.** The list always begins and ends with `0`. Between every pair of consecutive `0`s lies a non-empty run of strictly-positive values (constraint: no two `0`s are adjacent). The merged output has exactly `(number of zeros - 1)` nodes, each holding the sum of one segment.\n\n**Algorithm.**\n\n```\ndummy = new ListNode(0)\ntail = dummy\nacc = 0\ncur = head.next        # skip the leading 0\nwhile cur:\n    if cur.val == 0:\n        tail.next = new ListNode(acc)\n        tail = tail.next\n        acc = 0\n    else:\n        acc += cur.val\n    cur = cur.next\nreturn dummy.next\n```\n\n**Why the dummy node?** Standard linked-list pattern when the OUTPUT head depends on data you encounter mid-traversal. The first segment sum becomes `dummy.next`, and we return `dummy.next` at the end — no special case for the first emit.\n\n**Why skip `head` initially?** The first node's value is guaranteed `0` by the problem constraints. Starting at `head.next` lets us treat every subsequent `0` uniformly as a 'flush boundary'. If you want to be conservative, you can start at `head` and add a guard `if cur.val == 0 and acc == 0: continue` to skip leading zeros — slightly more verbose but symmetric.\n\n**Worked example.** `head = [0, 3, 1, 0, 4, 5, 2, 0]`. Iteration trace (starting at the node after the first 0):\n\n```\ncur=3, acc=0+3=3\ncur=1, acc=3+1=4\ncur=0, emit 4, acc=0, output: [4]\ncur=4, acc=0+4=4\ncur=5, acc=4+5=9\ncur=2, acc=9+2=11\ncur=0, emit 11, acc=0, output: [4, 11]\ncur=null, exit\nreturn dummy.next -> [4, 11]\n```\n\n**Brute-force comparison.** Brute would scan the list once to find every zero, then a second pass for each segment to sum it. Still `O(n)` total but two passes instead of one. The single-pass version is the natural answer.\n\n**In-place variant — overwrite the existing nodes.** Instead of allocating new nodes, reuse existing ones. Maintain a `write` pointer starting at `head` (the first 0 node) and an accumulator. Walk `cur` from `head.next`; on hitting a 0, write `acc` into `write.val` and advance `write`. After the loop, terminate the list with `write.next = null`. This is `O(1)` extra space AND `O(n)` time, using strictly fewer allocations than the dummy-node version. Some interviewers explicitly ask for this variant.\n\n**Why this is a beautiful problem.** It looks like it needs nested loops (one over segments, one over nodes within a segment), but the boundary-flush pattern collapses it to a single pass. The dummy-head trick removes the special case for the first segment. Total code is ~10 lines.\n\n**Edge cases.**\n- **Two zeros only (`[0, v, 0]`)**: one segment of length 1, output `[v]`.\n- **Many tiny segments (`[0, 1, 0, 2, 0, 3, 0]`)**: output `[1, 2, 3]`. Each segment is a single node; the accumulator is just that value.\n- **One huge segment**: the whole list (sans the framing zeros) sums into a single output node.\n- **All segment values equal**: output sums are simple multiples of the value.\n\n**Why the constraints help.** The problem guarantees no two adjacent `0`s, so a segment is always non-empty. That removes the 'what if the accumulator is 0 at flush time' edge case — we never emit a spurious 0.\n\n**Common bugs.** Forgetting to flush the LAST segment (it works for free because the trailing `0` is the final boundary). Emitting the 0 nodes themselves (use the dummy node + only emit when crossing a 0 boundary, never on a non-zero node). Off-by-one in the in-place variant where `write` is left pointing at a stale node — always terminate with `write.next = null`.",
      follow_up: "**Variant 1 — separator is `k` instead of `0`.** Replace `cur.val == 0` with `cur.val == k`. The algorithm is otherwise identical.\n\n**Variant 2 — multiplicative reduction instead of sum.** Replace `acc += cur.val` with `acc *= cur.val` and initialize `acc = 1` after each flush. Identical shape; just changes the reduction operator.\n\n**Variant 3 — emit max/min of each segment.** Track `seg_min` / `seg_max` instead of (or alongside) a running sum. Useful when the problem changes from 'sum the segment' to 'pick the dominant value'.\n\n**Variant 4 — list does NOT end with `0`.** Add an explicit flush after the loop: `if seen_any_in_segment: emit acc`. Handles trailing unfinished segments.\n\n**Variant 5 — list contains negative values.** The algorithm is sign-agnostic. The accumulator handles negatives naturally; the only thing to watch is integer overflow in C++ / Java if the segment can be very long.\n\n**Variant 6 — preserve segment boundaries.** Instead of merging within a segment, return a list of lists where each inner list is the original segment.\n\n**Variant 7 — in-place reuse with O(1) allocations.** Walk a `write` pointer alongside a `read` pointer; overwrite `write.val` on each flush and advance `write`. Terminate with `write.next = null`. Use this when the interviewer pushes on memory.\n\n**Implementation pitfalls.**\n1. **Including the leading `0` in the output.** Skip `head` initially OR add a guard `if cur.val == 0 and acc == 0: skip`.\n2. **Forgetting to flush the final segment.** Works automatically because the trailing `0` triggers the flush. If you remove the leading/trailing `0` guarantee, you must add an explicit post-loop flush.\n3. **Emitting a spurious `0` node when two flushes happen in a row.** Constraint forbids this (no two consecutive `0`s in the input), but defensive code should add `if acc != 0` before emitting.\n4. **Resetting `acc` BEFORE emitting.** Order matters: emit first, then reset.\n5. **Using `head` itself as the result head.** When the first segment sum differs from the leading `0`'s value, you need a fresh node (or overwrite). The dummy-node pattern sidesteps this.\n6. **In-place version not terminating the tail.** Leftover nodes from the original list will hang off the end. Always `write.next = null` after the last flush.",
      complexity: {
        time: "**O(n)** where `n` is the number of nodes in the original list. Each node is visited exactly once; the accumulator update is O(1) per visit.",
        space: "**O(m)** where `m = (number of zeros - 1)` is the number of segments — the size of the OUTPUT list. If we don't count output, **O(1) extra space** (one accumulator, three pointers). The in-place variant reuses existing nodes for O(1) auxiliary memory beyond input.",
        notes: "Output dominates space when the input is dominated by single-value segments (`[0,1,0,2,0,...]`); for long segments, the output is much smaller than input.",
        optimal: "**O(n) time and O(1) extra space (or O(m) for the output)** is tight — you must visit every node at least once to compute the sums."
      },
      constraints: [
        "The number of nodes in the list is in the range [3, 2 * 10^5].",
        "0 <= Node.val <= 1000",
        "There are no two consecutive nodes with Node.val == 0.",
        "The beginning and end of the linked list have Node.val == 0."
      ],
      hints: [
        "**Single linear scan.** Walk the list once with a running accumulator that resets at every `0` boundary.",
        "**Skip the leading `0`** (start at `head.next`) so every subsequent `0` is uniformly treated as a 'flush this segment' boundary.",
        "**Use a dummy node** for the output so the first segment sum becomes `dummy.next` without a special case.",
        "**Emit a new node on each `0`, then reset the accumulator.** Order matters — emit first, then reset.",
        "**The trailing `0` flushes the last segment automatically.** No special post-loop code needed if the input is well-formed.",
        "**In-place variant**: reuse the original nodes by maintaining `write` and `read` pointers; overwrite `write.val` on each flush. O(1) extra space."
      ],
      test_cases,
      solutions: {
        python: "from typing import Optional, List\n\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n\nclass Solution:\n    def mergeNodes(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        dummy = ListNode(0)\n        tail = dummy\n        acc = 0\n        cur = head.next if head else None\n        while cur is not None:\n            if cur.val == 0:\n                tail.next = ListNode(acc)\n                tail = tail.next\n                acc = 0\n            else:\n                acc += cur.val\n            cur = cur.next\n        return dummy.next\n",
        javascript: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val);\n *     this.next = (next===undefined ? null : next);\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar mergeNodes = function(head) {\n    const dummy = new ListNode(0);\n    let tail = dummy;\n    let acc = 0;\n    let cur = head ? head.next : null;\n    while (cur !== null) {\n        if (cur.val === 0) {\n            tail.next = new ListNode(acc);\n            tail = tail.next;\n            acc = 0;\n        } else {\n            acc += cur.val;\n        }\n        cur = cur.next;\n    }\n    return dummy.next;\n};\n",
        java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeNodes(ListNode head) {\n        ListNode dummy = new ListNode(0);\n        ListNode tail = dummy;\n        long acc = 0;\n        ListNode cur = (head != null) ? head.next : null;\n        while (cur != null) {\n            if (cur.val == 0) {\n                tail.next = new ListNode((int) acc);\n                tail = tail.next;\n                acc = 0;\n            } else {\n                acc += cur.val;\n            }\n            cur = cur.next;\n        }\n        return dummy.next;\n    }\n}\n",
        cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeNodes(ListNode* head) {\n        ListNode dummy(0);\n        ListNode* tail = &dummy;\n        long long acc = 0;\n        ListNode* cur = (head != nullptr) ? head->next : nullptr;\n        while (cur != nullptr) {\n            if (cur->val == 0) {\n                tail->next = new ListNode((int) acc);\n                tail = tail->next;\n                acc = 0;\n            } else {\n                acc += cur->val;\n            }\n            cur = cur->next;\n        }\n        return dummy.next;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 35K START =====",
    "// === WAVE 35K " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35K " + p1.slug + " END ===",
    "// === WAVE 35K " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35K " + p2.slug + " END ===",
    "// ===== WAVE 35K END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// Guard: don't double-write.
if (src.indexOf("WAVE 35K START") !== -1) {
  console.error("WAVE 35K already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35J END marker and append block after it.
const ANCHOR = "// ===== WAVE 35J END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave35k " + p1.slug + " + " + p2.slug);
