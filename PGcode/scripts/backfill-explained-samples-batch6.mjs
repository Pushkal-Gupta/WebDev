#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 6 (30 problems).
// Same shape as batches 1+2+3+4+5: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch6.mjs

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
  'daily-temperatures': [
    {
      inputs: ['[73,74,75,71,69,72,76,73]'],
      expected: '[1,1,4,2,1,1,0,0]',
      explanation_md:
        'The canonical LC example. Monotonic decreasing stack of **indices**. Walk left-to-right; while the current temperature `T[i]` is greater than the temperature at the stack-top index, pop the top and set `answer[top] = i - top`. Push `i`. Trace: stack starts `[]`. `73`→stack `[0]`. `74`>`73`, pop `0`, ans[0]=1, stack `[1]`. `75`>`74`, pop `1`, ans[1]=1, stack `[2]`. `71`<`75`, push, stack `[2,3]`. `69`<`71`, push `[2,3,4]`. `72`>`69` pop ans[4]=1, `72`>`71` pop ans[3]=2, stack `[2,5]`. `76`>`75` pop ans[2]=4, `76`>`72` pop ans[5]=1, stack `[6]`. `73`<`76`, stack `[6,7]`. Leftover indices stay `0`. **O(n)** time, **O(n)** stack.',
      viz_anchor: null,
    },
    {
      inputs: ['[30,40,50,60]'],
      expected: '[1,1,1,0]',
      explanation_md:
        'A strictly increasing input. Every element finds its warmer neighbor immediately to its right. `30`→stack `[0]`. `40`>`30`, pop, ans[0]=1, stack `[1]`. `50`>`40`, pop, ans[1]=1, stack `[2]`. `60`>`50`, pop, ans[2]=1, stack `[3]`. Last index has no warmer day ahead, ans[3]=0. The stack is always at most depth 1, so the algorithm degrades to a constant-space sweep on monotonic inputs. Proves the pop loop correctly resolves each element on its first comparison.',
      viz_anchor: null,
    },
    {
      inputs: ['[30,60,90]'],
      expected: '[1,1,0]',
      explanation_md:
        'A tiny strictly-increasing case. Each element is resolved by the next. `30`→stack `[0]`. `60`>`30`, pop, ans[0]=1, stack `[1]`. `90`>`60`, pop, ans[1]=1, stack `[2]`. Last element has nothing to its right, ans[2]=0. Proves trailing elements with no warmer future correctly remain at the default `0` — the stack-leftovers represent days that never find a warmer day. A brittle implementation that overwrites every position would corrupt those zeros.',
      viz_anchor: null,
    },
  ],

  'next-greater-element-i': [
    {
      inputs: ['[4,1,2]', '[1,3,4,2]'],
      expected: '[-1,3,-1]',
      explanation_md:
        'The canonical LC example. Precompute `nextGreater[x]` for every value in `nums2` using a monotonic decreasing stack — pop while `nums2[i]` exceeds the stack-top, mapping each popped value to `nums2[i]`. Trace on `[1,3,4,2]`: `1`→stack `[1]`. `3`>`1`, pop, map `1→3`, push `3`. `4`>`3`, pop, map `3→4`, push `4`. `2`<`4`, push. Leftovers `4` and `2` map to `-1`. Then look up each of `nums1 = [4,1,2]`: `4→-1`, `1→3`, `2→-1`. Result `[-1,3,-1]`. **O(m+n)** time, **O(n)** stack and map.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4]', '[1,2,3,4]'],
      expected: '[3,-1]',
      explanation_md:
        'A case where the answer for one element is `-1`. Build the map from `nums2 = [1,2,3,4]`: `1→2, 2→3, 3→4, 4→-1` (4 has no greater to its right). Look up `[2,4]`: `2→3`, `4→-1`. Result `[3,-1]`. Proves the precompute correctly maps the last element of a strictly increasing sequence to `-1`. The map is the bridge between the two arrays — without it, you would search `nums2` for each `nums1` element in **O(n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '[1]'],
      expected: '[-1]',
      explanation_md:
        'The single-element edge case. `nums2 = [1]` has no element to its right, so `1→-1`. Lookup `nums1 = [1]` gives `-1`. Result `[-1]`. Proves the algorithm handles the smallest input without special-casing. The stack is left with `1` after the loop; the cleanup pass maps every leftover to `-1`.',
      viz_anchor: null,
    },
  ],

  'next-greater-element-ii': [
    {
      inputs: ['[1,2,1]'],
      expected: '[2,-1,2]',
      explanation_md:
        'The canonical LC example for circular arrays. Trick: walk the array **twice** using indices `i % n`, push onto the monotonic decreasing stack on the first pass, only resolve answers on both passes. Trace: `1`(i=0) push `[0]`. `2`(i=1) > `1`, pop, ans[0]=2, push `[1]`. `1`(i=2) push `[1,2]`. Second pass: `1`(i=3,%n=0) ≤ 2, push? Already resolved 0. `2`(i=4,%n=1) ≤ 2, no pop. `1`(i=5,%n=2) ≤ 1, no pop. End: indices 1 and 2 unresolved — ans[1]=-1, ans[2] should be 2... Re-trace: at i=3 (val 1) we pop ans[2]=... actually, comparing with stack top val 1, 1 is not greater so we don\'t pop. At i=4 (val 2) > 1, pop, ans[2]=2. Final `[2,-1,2]`. **O(n)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,3]'],
      expected: '[2,3,4,-1,4]',
      explanation_md:
        'A case demonstrating the circular wrap. For index 3 (value 4), no greater element exists anywhere → `-1`. For index 4 (value 3), wrapping past the end reaches index 3 (4), which is greater → answer is `4`. Without the circular pass, index 4 would incorrectly resolve to `-1`. Proves the two-pass strategy is essential. The monotonic stack handles regular cases on pass 1, and the second pass catches wrap-around resolutions.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,3,2,1]'],
      expected: '[-1,5,5,5,5]',
      explanation_md:
        'A strictly decreasing input. The largest element (5 at index 0) has no greater anywhere in the cycle → `-1`. Every other element wraps around and finds `5`. Stack on first pass: `[0,1,2,3,4]` (no pops since strictly decreasing). Second pass starting at i=5 (%n=0, val 5): pop 4 (val 1) → ans[4]=5, pop 3 (val 2) → ans[3]=5, pop 2 → ans[2]=5, pop 1 → ans[1]=5. Stack `[0]` left → ans[0]=-1. Result `[-1,5,5,5,5]`. Proves the circular trick correctly resolves every non-maximal element.',
      viz_anchor: null,
    },
  ],

  'next-greater-element-iii': [
    {
      inputs: ['12'],
      expected: '21',
      explanation_md:
        'The canonical "next permutation of digits" problem. Convert `n` to digit array `[1,2]`. Walk right-to-left: find the first index `i` where `digits[i] < digits[i+1]` — here `i=0` (1<2). Find the smallest digit right of `i` that is > `digits[i]` — that\'s `2` at `i+1`. Swap → `[2,1]`. Reverse the suffix after `i` (already single-element). Result `21`. Check it fits in a signed 32-bit int (≤ 2147483647); otherwise return `-1`. **O(d)** time, **O(d)** space where `d` is the digit count.',
      viz_anchor: null,
    },
    {
      inputs: ['21'],
      expected: '-1',
      explanation_md:
        'A descending-digit input. No `i` exists where `digits[i] < digits[i+1]` because the array is fully decreasing. That means `21` is already the largest permutation — there is no next greater. Return `-1`. Proves the algorithm correctly detects the "already maximum" case via the absence of a swap pivot.',
      viz_anchor: null,
    },
    {
      inputs: ['2147483486'],
      expected: '-1',
      explanation_md:
        'An overflow edge case. The digits permute to `2147483648`, but that exceeds the signed 32-bit max of `2147483647`. The algorithm finds a valid next permutation in digit space, but the 32-bit overflow check rejects it. Return `-1`. Proves the overflow guard is mandatory — without it, the function would return a Long-fitting result that doesn\'t fit in `int`.',
      viz_anchor: null,
    },
  ],

  'largest-rectangle-in-histogram': [
    {
      inputs: ['[2,1,5,6,2,3]'],
      expected: '10',
      explanation_md:
        'The canonical LC example. Monotonic increasing stack of **indices**. For each bar, pop while the stack-top\'s height exceeds the current bar; each popped bar\'s width is bounded by the current index on the right and the new stack-top on the left. Trace: heights `[2,1,5,6,2,3]`. i=0: stack `[0]`. i=1: 1<2, pop 0, width=1, area=2; push 1, stack `[1]`. i=2,3: push, stack `[1,2,3]`. i=4: 2<6, pop 3, width=4-3=... width = i - stack.top - 1 = 4-2-1=1, area=6*1=6; pop 2, width=4-1-1=2, area=5*2=10 (max so far); push 4, stack `[1,4]`. i=5: push. End: pop with sentinel right=`n=6`. Final max `10`. **O(n)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4]'],
      expected: '4',
      explanation_md:
        'A two-bar case. Heights `[2,4]`. Stack `[0]`, then push 1 → `[0,1]`. End of array, treat right boundary as `i=2`. Pop 1: width=2-0-1=1, area=4. Pop 0: width=2 (stack empty so full left), area=4. Max = 4. Proves the algorithm correctly handles strictly increasing inputs — the cleanup pass after the loop is what catches these bars that never get popped during the main scan.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'The single-bar edge case. Stack `[0]`. End of array, cleanup pops 0: width=1, area=1. Return 1. Proves the algorithm handles `n=1` without special-casing — the sentinel-on-right treatment of the loop end is what resolves the lone bar.',
      viz_anchor: null,
    },
  ],

  'maximal-rectangle': [
    {
      inputs: ['[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]'],
      expected: '6',
      explanation_md:
        'The canonical LC example. Reduce to "largest rectangle in histogram" applied row by row. Maintain a `heights[j]` array: if `matrix[i][j] == 1`, `heights[j]++`; else reset to 0. After updating, compute the largest rectangle in this row\'s histogram using a monotonic stack. Trace: row 0 heights `[1,0,1,0,0]` → max 1. Row 1 → `[2,0,2,1,1]` → max 3. Row 2 → `[3,1,3,2,2]` → max 6 (the answer). Row 3 → `[4,0,0,3,0]` → max 4. Overall max 6. **O(m·n)** time, **O(n)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[["0"]]'],
      expected: '0',
      explanation_md:
        'The all-zeros edge case. heights stays `[0]`, the histogram has no positive bars, the largest rectangle is `0`. Return 0. Proves the algorithm correctly handles a board with no `1`s. The histogram routine returns 0 cleanly when all heights are 0.',
      viz_anchor: null,
    },
    {
      inputs: ['[["1"]]'],
      expected: '1',
      explanation_md:
        'A single `1` cell. heights becomes `[1]`, histogram routine returns 1. Proves the smallest "rectangle exists" case is handled correctly. The reduction to histogram is robust to single-cell input — no row-or-column special-casing needed.',
      viz_anchor: null,
    },
  ],

  'trapping-rain-water': [
    {
      inputs: ['[0,1,0,2,1,0,1,3,2,1,2,1]'],
      expected: '6',
      explanation_md:
        'The canonical LC example. Two-pointer approach. Maintain `left, right, leftMax, rightMax`. At each step, the side with the smaller height is the limiting factor — its water is `currentMax - height[ptr]`. Move that pointer inward. Walk: left=0, right=11. Heights 0 and 1, left smaller, water=0-0=0, leftMax=0. Advance. Continue: cumulative trapped = 1+1+0+1+2+1+0+0=6. Total 6. **O(n)** time, **O(1)** space — beats the **O(n)**-space prefix-max approach.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,2,0,3,2,5]'],
      expected: '9',
      explanation_md:
        'A second canonical case. Trapped water: at index 1 (h=2), bounded by 4 and 5, water=4-2=2. At index 2 (h=0), water=4-0=4. At index 3 (h=3), bounded by 4 left and 5 right, water=4-3=1. At index 4 (h=2), water=4-2=2. Total 2+4+1+2=9. Proves the two-pointer approach correctly resolves bowls with mixed heights — the limiting side flips when the larger side becomes smaller.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,0,2,0,4]'],
      expected: '7',
      explanation_md:
        'A three-bowl case. Trapped: index 1 (h=0) bounded by left=3, right=4, water=3-0=3. Index 2 (h=2) bounded by 3 and 4, water=3-2=1. Index 3 (h=0) bounded by 3 (eventually) and 4, water=3-0=3. Total 3+1+3=7. Proves the two-pointer algorithm correctly tracks the running max from both sides simultaneously — the inward-shrinking window never misses a trapped unit.',
      viz_anchor: null,
    },
  ],

  'evaluate-reverse-polish-notation': [
    {
      inputs: ['["2","1","+","3","*"]'],
      expected: '9',
      explanation_md:
        'The canonical LC example. Process tokens left-to-right with a stack. If the token is a number, push it. If it\'s an operator, pop two operands (right first, then left), apply, push the result. Trace: push 2, stack `[2]`. push 1 `[2,1]`. `+`: pop 1, pop 2, push 3 → `[3]`. push 3 `[3,3]`. `*`: pop 3, pop 3, push 9 → `[9]`. Final stack `[9]`, return 9. The expression `(2+1)*3 = 9`. **O(n)** time, **O(n)** stack. The right-first pop order matters for `-` and `/`.',
      viz_anchor: null,
    },
    {
      inputs: ['["4","13","5","/","+"]'],
      expected: '6',
      explanation_md:
        'A division case. Push 4, 13, 5. `/`: pop 5, pop 13, push `13/5 = 2` (integer division). Stack `[4,2]`. `+`: pop 2, pop 4, push 6. Return 6. Proves division uses integer truncation toward zero (per LC spec, not floor) and pop order (right operand first) is correct. A brittle implementation that pops left first would compute `5/13 = 0` here.',
      viz_anchor: null,
    },
    {
      inputs: ['["10","6","9","3","+","-11","*","/","*","17","+","5","+"]'],
      expected: '22',
      explanation_md:
        'A deep-stack expression. Equivalent to `((10 * (6 / ((9 + 3) * -11))) + 17) + 5 = ((10 * (6/-132)) + 17) + 5 = (0 + 17) + 5 = 22`. Note `6/-132` truncates toward zero to `0`. Walks through compound operations testing nested operator precedence handled by the post-order RPN encoding. Proves the algorithm scales to deeper expressions without changing shape — the stack grows and shrinks as operators consume their operands.',
      viz_anchor: null,
    },
  ],

  'basic-calculator': [
    {
      inputs: ['"1 + 1"'],
      expected: '2',
      explanation_md:
        'The simplest canonical case. The calculator handles `+`, `-`, integers, and parentheses. Use a stack to save running totals across parens, plus a `sign` (+1 or -1) and `result` accumulator. Walk left-to-right: build digits into a number, then on `+/-` flush the number into result with the current sign and update sign. Trace `"1 + 1"`: digit 1 → num=1. `+`: result += sign*num → result=1, sign=+1, num=0. Digit 1 → num=1. End of string: result += 1 = 2. Return 2.',
      viz_anchor: null,
    },
    {
      inputs: ['" 2-1 + 2 "'],
      expected: '3',
      explanation_md:
        'A case with whitespace. The walker skips spaces. Compute `2 - 1 + 2 = 3`. Process: digit 2 → num=2. `-`: result=2, sign=-1. digit 1 → num=1. `+`: result=2-1=1, sign=+1. digit 2 → num=2. End: result=1+2=3. Proves the algorithm correctly ignores whitespace and handles mixed `+/-` sequences without special-casing.',
      viz_anchor: null,
    },
    {
      inputs: ['"(1+(4+5+2)-3)+(6+8)"'],
      expected: '23',
      explanation_md:
        'A nested-parentheses case. On `(`, push the current `result` and `sign` onto the stack and reset. On `)`, finalize the inner result and combine with the stacked values. Compute `(1+(4+5+2)-3)+(6+8) = (1+11-3)+14 = 9+14 = 23`. The stack lets each level remember its parent\'s sign and accumulated value. Proves the algorithm correctly handles arbitrary nesting depth via the stack of `(result, sign)` pairs.',
      viz_anchor: null,
    },
  ],

  'basic-calculator-ii': [
    {
      inputs: ['"3+2*2"'],
      expected: '7',
      explanation_md:
        'The canonical LC example. Handles `+, -, *, /` with precedence but no parens. Use a stack: for `+`, push the number; for `-`, push the negation; for `*` or `/`, pop the top, apply the operation with the new number, and push the result back. Track the last operator. Trace: num=3, op=+. See `+`, push 3, op=+. num=2, op=+ then `*`. See `*`, op=*. num=2. End: op=*, pop 2, push 2*2=4. Stack `[3,4]`. Sum stack = 7. Operator precedence handled by deferred push.',
      viz_anchor: null,
    },
    {
      inputs: ['" 3/2 "'],
      expected: '1',
      explanation_md:
        'A single division. `3/2 = 1` (integer division). num=3, op=+ (default). See `/`. num=2. End: pop 3, push 3/2=1. Stack `[1]`. Sum=1. Proves the algorithm correctly handles integer division alone and ignores surrounding whitespace.',
      viz_anchor: null,
    },
    {
      inputs: ['" 3+5 / 2 "'],
      expected: '5',
      explanation_md:
        'A precedence test. `5/2 = 2`, then `3+2 = 5`. Trace: num=3, op=+, see `+`, push 3, op=+. num=5, see `/`, op=/. num=2. End: pop 5, push 5/2=2. Stack `[3,2]`. Sum=5. Proves operator precedence is preserved without parentheses — the `*`/`/` operators consume their right operand immediately while `+`/`-` defer to the final sum.',
      viz_anchor: null,
    },
  ],

  'decode-string': [
    {
      inputs: ['"3[a]2[bc]"'],
      expected: '"aaabcbc"',
      explanation_md:
        'The canonical LC example. Two stacks: one for repeat counts, one for accumulated strings. Walk the input: on digit, build the count. On `[`, push current string and count to their stacks; reset. On `]`, pop count `k` and previous string `prev`; new current = `prev + current * k`. On letter, append. Trace `"3[a]2[bc]"`: 3→count. `[`: push prev="", count=3. `a` → current="a". `]`: current="" + "a"*3 = "aaa". 2→count. `[`: push prev="aaa", count=2. `bc` → current="bc". `]`: current="aaa" + "bc"*2 = "aaabcbc". Return "aaabcbc".',
      viz_anchor: null,
    },
    {
      inputs: ['"3[a2[c]]"'],
      expected: '"accaccacc"',
      explanation_md:
        'A nested case. Walk: 3 → count. `[`: push (prev="", k=3). `a` → cur="a". 2 → count. `[`: push (prev="a", k=2). `c` → cur="c". `]`: cur = "a" + "c"*2 = "acc". `]`: cur = "" + "acc"*3 = "accaccacc". Proves the two-stack approach correctly handles arbitrary nesting depth — each `[`/`]` pair manages its own frame. A brittle implementation that builds string-then-repeat per level fails on inner repeats.',
      viz_anchor: null,
    },
    {
      inputs: ['"2[abc]3[cd]ef"'],
      expected: '"abcabccdcdcdef"',
      explanation_md:
        'A sequence of sibling groups followed by literal characters. Walk: 2 → k. `[`: push("", 2). `abc` → cur="abc". `]`: cur = "" + "abc"*2 = "abcabc". 3 → k. `[`: push("abcabc", 3). `cd` → cur="cd". `]`: cur = "abcabc" + "cd"*3 = "abcabccdcdcd". `ef` → cur="abcabccdcdcdef". Return. Proves the algorithm correctly handles literal characters after a group AND sibling groups at the same depth, by accumulating into the current frame after each pop.',
      viz_anchor: null,
    },
  ],

  'simplify-path': [
    {
      inputs: ['"/home/"'],
      expected: '"/home"',
      explanation_md:
        'The canonical LC example. Split the path by `/`, walk segments, manage a stack of directory names. For each segment: if empty or `.`, skip. If `..`, pop. Else push. Join with `/` prefixed by a leading `/`. Trace `"/home/"`: split → ["", "home", ""]. Skip empties. Stack = ["home"]. Join: "/home". Return. Proves trailing slashes are stripped and the canonical form is `/dir1/dir2`.',
      viz_anchor: null,
    },
    {
      inputs: ['"/../"'],
      expected: '"/"',
      explanation_md:
        'A "pop above root" edge case. `..` on an empty stack means we\'re already at root — the pop is a no-op (or `stack.pop()` on empty does nothing). Final stack empty → `"/"`. Proves the algorithm correctly handles the root-boundary case. A brittle implementation that always pops without checking would underflow or produce `""`.',
      viz_anchor: null,
    },
    {
      inputs: ['"/home//foo/"'],
      expected: '"/home/foo"',
      explanation_md:
        'A double-slash case. Split → `["", "home", "", "foo", ""]`. Skip all empties. Stack = `["home", "foo"]`. Join → `/home/foo`. Proves consecutive slashes are treated as a single separator. The "skip empties" rule absorbs this case without explicit pre-processing.',
      viz_anchor: null,
    },
  ],

  'backspace-string-compare': [
    {
      inputs: ['"ab#c"', '"ad#c"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Build each string with a stack: push letters, pop on `#`. Compare final stacks. `"ab#c"`: push a, push b, pop (#), push c → stack `[a,c]` → "ac". `"ad#c"`: push a, push d, pop, push c → `[a,c]` → "ac". Match, return true. **O(n+m)** time, **O(n+m)** space. The two-pointer **O(1)**-space variant walks from the right counting backspaces; more clever but the stack version is the canonical.',
      viz_anchor: null,
    },
    {
      inputs: ['"a##c"', '"#a#c"'],
      expected: 'true',
      explanation_md:
        'A case with leading/trailing backspaces that overshoot. `"a##c"`: push a, pop, pop (no-op on empty), push c → "c". `"#a#c"`: pop (empty), push a, pop, push c → "c". Match. Proves pops on empty stacks are safely no-ops — without this, the algorithm would crash. Also proves backspaces beyond the leading characters are absorbed cleanly.',
      viz_anchor: null,
    },
    {
      inputs: ['"a#c"', '"b"'],
      expected: 'false',
      explanation_md:
        'A mismatch case. `"a#c"`: push a, pop, push c → "c". `"b"`: push b → "b". Stacks differ → return false. Proves the algorithm correctly identifies non-equal strings after processing — the final stacks are the canonical "what the user actually typed" comparison.',
      viz_anchor: null,
    },
  ],

  'remove-all-adjacent-duplicates-in-string': [
    {
      inputs: ['"abbaca"'],
      expected: '"ca"',
      explanation_md:
        'The canonical LC example. Use a stack. For each character: if it equals the stack top, pop; else push. Trace `"abbaca"`: push a `[a]`. push b `[a,b]`. b == top, pop `[a]`. a == top, pop `[]`. push c `[c]`. push a `[c,a]`. Final stack joined → "ca". Return "ca". **O(n)** time, **O(n)** stack. The cascading-pop is the magic: removing `bb` exposes adjacent `aa`, which the next iteration catches.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaaaaaa"'],
      expected: '""',
      explanation_md:
        'A case where the entire string cancels. Push a, then a==top pop, then push a, then pop, etc. After 8 chars, stack alternates between empty and `[a]`. Final state: empty. Return "". Proves the algorithm correctly handles full cancellation. A brittle implementation that always pushes the first character before the loop would miss this — the stack-empty check at each iteration is essential.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"'],
      expected: '"abc"',
      explanation_md:
        'A no-duplicates case. Push a, push b (≠a), push c (≠b). Final "abc". Return unchanged. Proves the algorithm correctly handles inputs without adjacent duplicates — the comparison fails each time and the character is pushed as-is.',
      viz_anchor: null,
    },
  ],

  'score-of-parentheses': [
    {
      inputs: ['"()"'],
      expected: '1',
      explanation_md:
        'The base case. A single pair `()` scores 1. Stack approach: push 0 on `(`, on `)` pop top `v`; new top += `max(2v, 1)` (use `max(2v, 1)` so `()` adds 1, `(X)` adds `2X`). Trace: stack `[0]`. `(` → `[0,0]`. `)` → pop 0, top += max(0, 1) = 1 → stack `[1]`. Return 1. **O(n)** time, **O(n)** stack.',
      viz_anchor: null,
    },
    {
      inputs: ['"(())"'],
      expected: '2',
      explanation_md:
        'A nested case. `(())` scores `2 * 1 = 2`. Stack trace: `[0]`. `(` → `[0,0]`. `(` → `[0,0,0]`. `)` → pop 0, top += max(0,1)=1, stack `[0,1]`. `)` → pop 1, top += max(2*1, 1)=2, stack `[2]`. Return 2. Proves the `max(2v, 1)` rule: when the popped value is 0 (atomic `()`), add 1; when it\'s nonzero (already-scored inner content), double it.',
      viz_anchor: null,
    },
    {
      inputs: ['"()()"'],
      expected: '2',
      explanation_md:
        'A sibling-pairs case. Two siblings each score 1 → total 2. Stack: `[0]`. `(` → `[0,0]`. `)` → pop 0, top += 1, `[1]`. `(` → `[1,0]`. `)` → pop 0, top += 1, `[2]`. Return 2. Proves siblings accumulate at the same level — the rule is `add(v)`, not `multiply` for siblings.',
      viz_anchor: null,
    },
  ],

  'minimum-remove-to-make-valid-parentheses': [
    {
      inputs: ['"lee(t(c)o)de)"'],
      expected: '"lee(t(c)o)de"',
      explanation_md:
        'The canonical LC example. Two-pass scan. Pass 1 left-to-right: track open count; on `(` push its index to a stack; on `)` pop if stack non-empty, else mark this `)` for removal. Pass 2: any indices left in the stack are unmatched `(`; mark them too. Build result skipping marked indices. Trace `"lee(t(c)o)de)"`: indices of `(` 3, 5; `)` at 7 matches 5, `)` at 9 matches 3. `)` at 12 has empty stack → mark for removal. Stack now empty. Build result without index 12 → `"lee(t(c)o)de"`. **O(n)** time, **O(n)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['"a)b(c)d"'],
      expected: '"ab(c)d"',
      explanation_md:
        'A case with one stray `)`. Pass 1: index 1 is `)` with empty stack → mark. Index 3 `(` push. Index 5 `)` pop. Stack ends empty. Build result skipping index 1 → "ab(c)d". Proves the algorithm correctly removes the minimum number of unmatched parens — only index 1 is removed, leaving the validly paired `(c)` intact.',
      viz_anchor: null,
    },
    {
      inputs: ['"))(("'],
      expected: '""',
      explanation_md:
        'A fully invalid input. Both `)` are unmatched (mark for removal), both `(` are left in the stack (mark for removal). All four characters removed → return "". Proves the algorithm handles maximal-removal cases. A brittle implementation that only handles one direction would leave `((` or `))` in the result.',
      viz_anchor: null,
    },
  ],

  'longest-valid-parentheses': [
    {
      inputs: ['"(()"'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Stack of **indices**, initialized with `-1` as a sentinel. On `(`, push index. On `)`, pop top; if stack now empty, push current index as new base; else update max length as `i - stack.top()`. Trace `"(()`": stack `[-1]`. `(`(i=0) push `[-1,0]`. `(`(i=1) push `[-1,0,1]`. `)`(i=2) pop, stack `[-1,0]`, max = 2-0 = 2. End. Return 2. **O(n)** time, **O(n)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['")()())"'],
      expected: '4',
      explanation_md:
        'A case with leading unmatched `)`. Stack `[-1]`. `)`(0) pop, stack empty, push 0 as base. `(`(1) push `[0,1]`. `)`(2) pop, top=0, max=2-0=2. `(`(3) push `[0,3]`. `)`(4) pop, top=0, max=4-0=4. `)`(5) pop, empty, push 5. End. Return 4. Proves the sentinel/base trick correctly handles unmatched `)` breaking the valid region into segments.',
      viz_anchor: null,
    },
    {
      inputs: ['""'],
      expected: '0',
      explanation_md:
        'The empty-string edge case. Stack `[-1]`, loop never runs. Max stays 0. Return 0. Proves the algorithm correctly handles empty input. A brittle implementation that always reads s[0] would crash here.',
      viz_anchor: null,
    },
  ],

  'group-anagrams': [
    {
      inputs: ['["eat","tea","tan","ate","nat","bat"]'],
      expected: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      explanation_md:
        'The canonical LC example. Group words that are anagrams of each other. Use a hash map keyed by the **sorted** form of each word — anagrams produce identical sorted strings. `eat -> "aet"`, `tea -> "aet"`, `ate -> "aet"` all collide into the same bucket. Final map: `"aet" -> [eat, tea, ate]`, `"ant" -> [tan, nat]`, `"abt" -> [bat]`. Return the values. **O(n · k log k)** time where `k` is max word length (sorting dominates), **O(n · k)** space. Alternative key: a 26-length count array stringified — saves the sort but bulkier.',
      viz_anchor: null,
    },
    {
      inputs: ['[""]'],
      expected: '[[""]]',
      explanation_md:
        'The single-empty-string edge case. Sorted form of `""` is `""`. Map: `"" -> [""]`. Return `[[""]]`. Proves the algorithm handles empty strings as valid anagram-group members — the empty string is its own anagram class. A brittle implementation that skips empty strings would return `[]`, wrong by spec.',
      viz_anchor: null,
    },
    {
      inputs: ['["a"]'],
      expected: '[["a"]]',
      explanation_md:
        'The single-character case. Sorted form `"a"`. Map: `"a" -> ["a"]`. One bucket, one entry. Return `[["a"]]`. Proves the algorithm correctly outputs a singleton group when no other words collide. The hash map auto-initializes the bucket on first insert; no special-casing for "first word" needed.',
      viz_anchor: null,
    },
  ],

  'different-ways-to-add-parentheses': [
    {
      inputs: ['"2-1-1"'],
      expected: '[0,2]',
      explanation_md:
        'The canonical LC example. Divide-and-conquer with memoization. For each operator in the expression, split into left and right, recursively compute all values for each side, then combine via the operator. Trace `"2-1-1"`: split at first `-` (index 1) → left=[2], right values of "1-1"=[0]. Combine: 2-0=2. Split at second `-` (index 3) → left="2-1"=[1], right=[1]. Combine: 1-1=0. Results: [2, 0] → sorted [0, 2]. The recursion tree corresponds to all ways to parenthesize. **O(C_n)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['"2*3-4*5"'],
      expected: '[-34,-14,-10,-10,10]',
      explanation_md:
        'A more complex case yielding 5 results — one per valid parenthesization. Computations: `(2*(3-(4*5))) = -34`, `((2*3)-(4*5)) = -14`, `((2*(3-4))*5) = -10`, `(2*((3-4)*5)) = -10`, `(((2*3)-4)*5) = 10`. Catalan number C_3 = 5 ways. Proves the algorithm enumerates all parenthesizations exhaustively via the split-on-each-operator recursion.',
      viz_anchor: null,
    },
    {
      inputs: ['"11"'],
      expected: '[11]',
      explanation_md:
        'A pure-number edge case. No operators to split on — the base case returns `[parseInt(input)]`. Result `[11]`. Proves the algorithm correctly handles operator-free input. A brittle implementation that assumes at least one operator would crash on parse.',
      viz_anchor: null,
    },
  ],

  'valid-parenthesis-string': [
    {
      inputs: ['"()"'],
      expected: 'true',
      explanation_md:
        'The simplest valid case. Track a range of possible open-count `[low, high]`. On `(`: low++, high++. On `)`: low--, high--. On `*`: low--, high++ (it could be `(`, `)`, or empty). If high < 0 at any point, return false. At end, return low == 0 (low clamped at 0 mid-walk). Trace `"()"`: `(` → low=1, high=1. `)` → low=0, high=0. End: low==0, return true. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['"(*)"'],
      expected: 'true',
      explanation_md:
        'A case with a `*`. `*` could match `(`, `)`, or be empty. Trace: `(` → [1,1]. `*` → [0,2]. `)` → [-1,1] → clamp low to 0 → [0,1]. End: 0 ≤ 0 ≤ 1, return true (the `*` was empty). Proves the range tracking correctly models the wildcard\'s three possibilities. A brittle stack-based approach would need to enumerate all three interpretations.',
      viz_anchor: null,
    },
    {
      inputs: ['"(*))"'],
      expected: 'true',
      explanation_md:
        'A case where `*` must act as `(`. Trace: `(` → [1,1]. `*` → [0,2]. `)` → [-1,1] → clamp → [0,1]. `)` → [-1,0] → clamp → [0,0]. End: low==0, return true. The `*` here represents an open paren, balancing the two `)`s. Proves the range model captures all valid interpretations without explicit enumeration.',
      viz_anchor: null,
    },
  ],

  'check-if-word-is-valid-after-substitutions': [
    {
      inputs: ['"aabcbc"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. The string is valid if it can be reduced to empty by repeatedly removing `"abc"` substrings. Stack approach: push each char; whenever the top three are `a`, `b`, `c`, pop all three. Trace `"aabcbc"`: push a, push a, push b, push c. Top three = "abc" → pop all → stack `[a]`. Push b, push c. Top three = "abc" → pop → stack `[]`. Final empty, return true. **O(n)** time, **O(n)** stack.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcabcababcc"'],
      expected: 'true',
      explanation_md:
        'A nested-removal case. Walk: push a, b, c → pop → []. Push a, b, c → pop → []. Push a, b, a, b, c → "abc" at top, pop → [a, b]. Push c → top "abc", pop → []. Final empty, return true. Proves the algorithm correctly handles cascading reductions: removing one `abc` can expose another. The stack approach naturally cascades because each pop re-exposes the new top three.',
      viz_anchor: null,
    },
    {
      inputs: ['"abccba"'],
      expected: 'false',
      explanation_md:
        'A case that cannot reduce. Walk: push a, b, c → pop → []. Push c, b, a → top three "cba" ≠ "abc". Stack non-empty at end → return false. Proves the algorithm correctly rejects strings that aren\'t reducible. A brittle implementation that only checks the start or end of the string would falsely accept this.',
      viz_anchor: null,
    },
  ],

  'reverse-string-ii': [
    {
      inputs: ['"abcdefg"', '2'],
      expected: '"bacdfeg"',
      explanation_md:
        'The canonical LC example. Walk the string in blocks of `2k = 4`. In each block, reverse the first `k = 2` chars, leave the rest. `"abcdefg"`: block 0 (indices 0..3) → reverse "ab" → "ba", keep "cd" → "bacd". block 1 (indices 4..7, but only 4..6) → reverse "ef" → "fe", keep "g" → "feg". Result "bacdfeg". **O(n)** time, **O(n)** space for output. The block-stride loop is the trick.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcd"', '2'],
      expected: '"bacd"',
      explanation_md:
        'A case where `n = 2k`. One block. Reverse first 2 → "ba", keep "cd". Result "bacd". Proves the algorithm correctly handles inputs that are exactly one block long. The single block-iteration reverses the prefix and the suffix stays in place.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '2'],
      expected: '"a"',
      explanation_md:
        'A case where `n < k`. The block routine attempts to reverse 2 chars but only 1 exists — reverse what\'s there (1 char, no-op). Result "a". Proves the algorithm correctly handles short inputs by clamping the reverse range to the available length. A brittle implementation that always reverses `k` chars would index out of bounds.',
      viz_anchor: null,
    },
  ],

  'reverse-words-in-a-string': [
    {
      inputs: ['"the sky is blue"'],
      expected: '"blue is sky the"',
      explanation_md:
        'The canonical LC example. Split on whitespace, filter empty strings, reverse the list, join with single spaces. `"the sky is blue"` → ["the","sky","is","blue"] → ["blue","is","sky","the"] → "blue is sky the". **O(n)** time, **O(n)** space. Many languages provide trim+split idioms; the manual two-pointer in-place version is more elegant but harder to get right.',
      viz_anchor: null,
    },
    {
      inputs: ['"  hello world  "'],
      expected: '"world hello"',
      explanation_md:
        'A case with leading and trailing whitespace plus multiple spaces. Split with whitespace filter removes empties. `"  hello world  "` → ["hello", "world"] → ["world", "hello"] → "world hello". Proves the algorithm correctly normalizes whitespace. A brittle implementation using `split(" ")` (single-space delimiter) would retain empty strings and produce extra spaces in the result.',
      viz_anchor: null,
    },
    {
      inputs: ['"a good   example"'],
      expected: '"example good a"',
      explanation_md:
        'A case with embedded multiple spaces. The split-with-filter approach collapses all whitespace runs. ["a","good","example"] → reversed → ["example","good","a"] → "example good a". Proves the joined output uses single spaces regardless of input spacing — multi-space runs do not survive.',
      viz_anchor: null,
    },
  ],

  'length-of-last-word': [
    {
      inputs: ['"Hello World"'],
      expected: '5',
      explanation_md:
        'The canonical LC example. Walk from the right: skip trailing spaces, then count non-space characters until you hit a space or the start. `"Hello World"` → end at index 10 (`d`), count 5 chars (`World`). Return 5. **O(n)** time, **O(1)** space. Alternatively split on whitespace and return the length of the last token, but the right-walk avoids allocating a list.',
      viz_anchor: null,
    },
    {
      inputs: ['"   fly me   to   the moon  "'],
      expected: '4',
      explanation_md:
        'A case with mixed whitespace. The right-walk skips trailing spaces, then counts `moon` = 4. Return 4. Proves the algorithm correctly skips trailing whitespace before counting. A brittle implementation that just counts from the end without the skip would return 0.',
      viz_anchor: null,
    },
    {
      inputs: ['"luffy is still joyboy"'],
      expected: '6',
      explanation_md:
        'A no-trailing-whitespace case. Walk from the right: count `joyboy` = 6. Return 6. Proves the algorithm correctly handles the simple case where no skip is needed. The trailing-skip phase exits immediately because the last character is non-space.',
      viz_anchor: null,
    },
  ],

  'count-and-say': [
    {
      inputs: ['1'],
      expected: '"1"',
      explanation_md:
        'The base case. `countAndSay(1) = "1"` by definition. Return `"1"`. Proves the recursion correctly returns the seed value. For `n > 1`, the recurrence applies: `say(n)` is the run-length encoding of `say(n-1)`.',
      viz_anchor: null,
    },
    {
      inputs: ['4'],
      expected: '"1211"',
      explanation_md:
        'A small recursive case. `say(1) = "1"`. `say(2) = "11"` (one 1). `say(3) = "21"` (two 1s). `say(4) = "1211"` (one 2, one 1). Walk through: start with previous string, run-length encode by walking and counting same-char runs, emit `count + char` for each run. Result `"1211"`. Proves the algorithm correctly chains the run-length encoding across iterations.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '"111221"',
      explanation_md:
        'One more step. From `"1211"`: one 1 → "11", one 2 → "12", two 1s → "21". Concatenate: "111221". Return. Proves the run-length encoding correctly handles a string with multiple distinct runs. A brittle implementation that lumps all chars into one count would produce wrong output here.',
      viz_anchor: null,
    },
  ],

  'find-the-difference': [
    {
      inputs: ['"abcd"', '"abcde"'],
      expected: '"e"',
      explanation_md:
        'The canonical LC example. Two clean approaches. (1) XOR all characters of both strings — paired characters cancel, the lone character remains. (2) Sum char codes of `t` and subtract sum of `s`; convert back to char. Trace XOR: a^b^c^d^a^b^c^d^e = e. Return "e". **O(n)** time, **O(1)** space. The XOR trick is the cleanest; sum-difference is equivalent.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '"y"'],
      expected: '"y"',
      explanation_md:
        'An empty-s edge case. `s = ""`, `t = "y"`. XOR of all = `y` (only one char). Return "y". Proves the algorithm correctly handles the trivial single-extra case. A brittle implementation that requires non-empty `s` would crash.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"aa"'],
      expected: '"a"',
      explanation_md:
        'A case where the extra char duplicates one already in `s`. XOR: a^a^a = a. Sum t - sum s = 2*97 - 97 = 97 = "a". Return "a". Proves the algorithm correctly identifies the extra char even when it\'s a duplicate of an existing char. A brittle implementation using "set difference" would return an empty set here.',
      viz_anchor: null,
    },
  ],

  'ransom-note': [
    {
      inputs: ['"a"', '"b"'],
      expected: 'false',
      explanation_md:
        'The canonical LC example. Count character frequencies in `magazine`; for each character in `ransomNote`, decrement; if any count goes negative, return false. Or: count both, ensure ransom counts ≤ magazine counts for each char. Trace: magazine "b" has counts `{b:1}`. ransom "a" — `a` not in magazine, return false. **O(n+m)** time, **O(1)** space (since alphabet is 26).',
      viz_anchor: null,
    },
    {
      inputs: ['"aa"', '"ab"'],
      expected: 'false',
      explanation_md:
        'A case where the magazine has enough distinct letters but not enough copies. magazine `{a:1, b:1}`. ransom needs `a:2`, but only 1 available → return false. Proves the algorithm correctly checks **counts**, not just presence. A brittle implementation that uses a set instead of a counter would falsely return true.',
      viz_anchor: null,
    },
    {
      inputs: ['"aa"', '"aab"'],
      expected: 'true',
      explanation_md:
        'A success case. magazine `{a:2, b:1}`. ransom needs `a:2` — magazine has 2, OK. Return true. Proves the algorithm correctly identifies sufficient counts. The leftover `b` in magazine is fine (we only need ≤ counts, not exact match).',
      viz_anchor: null,
    },
  ],

  'isomorphic-strings': [
    {
      inputs: ['"egg"', '"add"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Two strings are isomorphic if there\'s a bijection between their character sets preserving order. Track two maps: `s→t` and `t→s`. For each position, check both directions: if `s[i]` already maps to a different `t[i]`, or `t[i]` maps to a different `s[i]`, return false. Trace `"egg" "add"`: i=0: e→a, a→e. i=1: g→d, d→g. i=2: g→d ✓, d→g ✓. Return true. **O(n)** time, **O(1)** space (256-char alphabet).',
      viz_anchor: null,
    },
    {
      inputs: ['"foo"', '"bar"'],
      expected: 'false',
      explanation_md:
        'A case where the bijection fails. i=0: f→b, b→f. i=1: o→a, a→o. i=2: o was mapped to `a`, but now needs `r` → conflict. Return false. Proves the bidirectional map is essential — without the s→t check, `oo` and `ar` would falsely match.',
      viz_anchor: null,
    },
    {
      inputs: ['"paper"', '"title"'],
      expected: 'true',
      explanation_md:
        'A longer canonical case. Trace: p→t, t→p. a→i, i→a. p already maps to t ✓. e→l, l→e. r→e — but e already maps to l, conflict... wait, let me re-check. Actually p→t, a→i, p→t (consistent), e→l, r→e. Reverse: t→p, i→a, l→e, e→r. Both maps consistent. Return true. Proves the algorithm correctly handles longer strings with multiple distinct character classes.',
      viz_anchor: null,
    },
  ],

  'word-pattern': [
    {
      inputs: ['"abba"', '"dog cat cat dog"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Same as isomorphic strings, but mapping pattern chars to whole words. Split the string on whitespace; if length differs from pattern length, return false. Maintain `char→word` and `word→char` maps. Trace `"abba"` vs `["dog","cat","cat","dog"]`: a→dog, dog→a. b→cat, cat→b. b→cat ✓. a→dog ✓. Return true. **O(n)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['"abba"', '"dog cat cat fish"'],
      expected: 'false',
      explanation_md:
        'A case where the bijection breaks. i=0: a→dog. i=1: b→cat. i=2: b→cat ✓. i=3: a should map to "dog" but actual is "fish" → conflict. Return false. Proves the consistency check across positions is essential — the same pattern char must map to the same word everywhere.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaa"', '"dog cat cat dog"'],
      expected: 'false',
      explanation_md:
        'A case where the **reverse** map breaks. i=0: a→dog, dog→a. i=1: a→dog needed but actual word is "cat" → s→t check fails. Or alternatively: a→dog, then `cat` would need to map to `a` but `a→dog` is already set. Return false. Proves the bidirectional map catches one-to-many and many-to-one violations.',
      viz_anchor: null,
    },
  ],

  'repeated-substring-pattern': [
    {
      inputs: ['"abab"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Slick trick: `s` is built from a repeated substring iff `s` appears in `(s+s)[1 : 2n-1]`. The +1, -1 strips off positions that would just match `s` to itself trivially. Trace: `s + s = "abababab"`. Slice `[1:7] = "bababa"`. Does "abab" appear? Yes (position 1). Return true. **O(n)** time using KMP-based substring search; **O(n)** space. Alternative: try every divisor `d` of `n` and check repetition.',
      viz_anchor: null,
    },
    {
      inputs: ['"aba"'],
      expected: 'false',
      explanation_md:
        'A non-repeating case. `s + s = "abaaba"`, slice `[1:5] = "baab"`. Does "aba" appear? No. Return false. Proves the slice-and-search technique correctly rejects non-repeating strings. The divisor approach would also reject because `n=3` has only divisors 1 and 3, and neither produces a valid repeat (since repeating "a" three times gives "aaa", not "aba").',
      viz_anchor: null,
    },
    {
      inputs: ['"abcabcabcabc"'],
      expected: 'true',
      explanation_md:
        'A longer repeating case. `s` = "abc" repeated 4 times. The doubled string "abcabcabcabcabcabcabcabc" contains "abcabcabcabc" at position 3 (and others). Return true. Proves the algorithm correctly identifies multi-period repeats, not just the shortest period. The substring search finds any valid embedding within the doubled string.',
      viz_anchor: null,
    },
  ],

  'first-unique-character-in-a-string': [
    {
      inputs: ['"leetcode"'],
      expected: '0',
      explanation_md:
        'The canonical LC example. Find the first non-repeating character. Two-pass approach: pass 1 builds a count map (`l:1, e:3, t:1, c:1, o:1, d:1`); pass 2 walks the string left-to-right returning the index of the first char with count 1. At `i=0`, `l` has count 1 → return `0`. **O(n)** time, **O(1)** space (alphabet size 26). A brittle single-pass `indexOf == lastIndexOf` check is **O(n²)**.',
      viz_anchor: null,
    },
    {
      inputs: ['"loveleetcode"'],
      expected: '2',
      explanation_md:
        'A case where the first char repeats. Counts: `l:2, o:2, v:1, e:4, t:1, c:1, d:1`. Walk: `l` count 2 (skip), `o` count 2 (skip), `v` count 1 → return `2`. The naive "is this the first occurrence" check would still work but takes **O(n²)** to confirm uniqueness for each candidate. The hashmap precomputation is what makes pass 2 linear. Proves the algorithm correctly skips repeating prefixes before landing on the first unique.',
      viz_anchor: null,
    },
    {
      inputs: ['"aabb"'],
      expected: '-1',
      explanation_md:
        'The "no unique character" edge case. Every character repeats: `a:2, b:2`. Pass 2 walks all 4 chars finding no count-1 entries, falls through, returns `-1`. Proves the algorithm correctly signals "no unique" with `-1` rather than crashing or returning index 0. A brittle implementation that returns the first index unconditionally would return `0` here, wrong by spec.',
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
