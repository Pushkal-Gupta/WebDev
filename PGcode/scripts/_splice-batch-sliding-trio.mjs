#!/usr/bin/env node
// Atomic splice: subarray-product-less-than-k, longest-mountain-in-array, array-of-doubled-pairs.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function subarrayProductLessThanKViz(')
  && src.includes('function longestMountainViz(')
  && src.includes('function canReorderDoubledViz(')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function subarrayProductLessThanKViz() {
  const nums = [10, 5, 2, 6];
  const k = 100;
  const frames = [];
  let l = 0, prod = 1, count = 0;

  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'nums', value: '[' + nums.join(',') + ']' },
      { label: 'k', value: String(k), tone: 'violet' },
      { label: 'goal', value: 'count contiguous subarrays with product < k', tone: 'violet' },
    ],
    caption: 'Sliding window over a strictly-positive array. The window invariant we maintain: product of nums[l..r] is always < k. Whenever a new right element pushes the product past k, we shrink from the left until it fits again.',
  });
  frames.push({
    array: nums, pointers: { l: 0 },
    chip: [
      { label: 'product', value: '1', tone: 'pink' },
      { label: 'count', value: '0', tone: 'violet' },
      { label: 'trick', value: 'each valid r contributes (r-l+1) new subarrays', tone: 'violet' },
    ],
    caption: 'When the window [l..r] is valid, every subarray ending at r is also valid (they are suffixes of a valid window, and shorter suffixes have smaller product). So we add (r - l + 1) to the answer for each r — that counts all new windows ending at the new right end.',
  });

  for (let r = 0; r < nums.length; r++) {
    prod *= nums[r];
    frames.push({
      array: nums, pointers: { l, r },
      chip: [
        { label: 'r', value: String(r), tone: 'pink' },
        { label: 'mul nums[r]', value: String(nums[r]) },
        { label: 'product', value: String(prod), tone: prod < k ? 'violet' : 'pink' },
      ],
      caption: 'Extend the window by multiplying in nums[r] = ' + nums[r] + '. New product = ' + prod + '. If this is < k the window is already valid; otherwise we must shrink from the left.',
    });
    while (prod >= k && l <= r) {
      prod = Math.floor(prod / nums[l]);
      l++;
      frames.push({
        array: nums, pointers: { l, r },
        chip: [
          { label: 'shrink', value: 'divide out nums[' + (l - 1) + ']', tone: 'pink' },
          { label: 'product', value: String(prod) },
          { label: 'l', value: String(l), tone: 'violet' },
        ],
        caption: 'Product is ≥ k so divide out the leftmost element and advance l. We keep shrinking until the product fits under k again — this preserves the invariant for the next count step.',
      });
    }
    const add = r - l + 1;
    count += add;
    frames.push({
      array: nums, pointers: { l, r },
      chip: [
        { label: '+(r-l+1)', value: '+' + add, tone: 'violet' },
        { label: 'count', value: String(count), tone: 'pink' },
      ],
      caption: 'Add (r - l + 1) = ' + add + ' to count — that is the number of valid subarrays ending exactly at r. Running total: ' + count + '.',
    });
  }

  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'why not brute force', value: 'O(n^2) subarrays × O(n) product', tone: 'violet' },
      { label: 'cost', value: 'O(n^3) baseline', tone: 'pink' },
    ],
    caption: 'Brute force enumerates every (l, r) pair and recomputes the product — O(n^3) without prefix tricks, O(n^2) with prefix products plus a logarithm. The sliding window collapses this to O(n) by reusing both the running product and the position of l.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'why monotone shrink works', value: 'product is non-decreasing as window grows', tone: 'violet' },
    ],
    caption: 'Since every nums[i] ≥ 1, multiplying a value in never decreases the product. So once the window becomes invalid we can never recover by extending right — only by shrinking left. This monotonicity is exactly what justifies the two-pointer move.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'edge', value: 'k ≤ 1', tone: 'pink' },
      { label: 'answer', value: '0' },
    ],
    caption: 'Edge: when k ≤ 1, no subarray of positives can have product < k (the empty product 1 is already ≥ k). We short-circuit with 0 — the inner loop would otherwise divide forever.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'answer', value: String(count), tone: 'pink' },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(1)', tone: 'violet' },
    ],
    caption: 'Total subarrays with product < ' + k + ' is ' + count + '. Amortised O(n): each index is visited at most twice (once by r, once by l). Requires all nums[i] ≥ 1 — a zero would break the divide-out step.',
  });

  return { renderer: 'window', title: 'Subarray Product Less Than K — sliding window with running product', frames };
}

function longestMountainViz() {
  const arr = [2, 1, 4, 7, 3, 2, 5];
  const frames = [];
  const n = arr.length;
  let best = 0;

  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'arr', value: '[' + arr.join(',') + ']' },
      { label: 'mountain', value: 'strict up then strict down, length ≥ 3', tone: 'violet' },
    ],
    caption: 'A mountain has a unique peak with strictly increasing values to its left and strictly decreasing values to its right. Length is the full base-to-base span — both slopes count, plus the peak.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'min length', value: '3', tone: 'pink' },
      { label: 'reason', value: 'need at least 1 element on each slope', tone: 'violet' },
    ],
    caption: 'The minimum mountain has length 3 — one peak with one ascending neighbour and one descending neighbour. Anything shorter cannot have both slopes simultaneously.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'scan range', value: '1 ≤ i ≤ n-2', tone: 'violet' },
      { label: 'endpoints', value: 'cannot be peaks', tone: 'pink' },
    ],
    caption: 'Skip index 0 and n-1 entirely — neither can be a peak since one neighbour is missing. The interior indices are the only peak candidates.',
  });

  let i = 1;
  while (i < n - 1) {
    const isPeak = arr[i - 1] < arr[i] && arr[i] > arr[i + 1];
    frames.push({
      array: arr, pointers: { i },
      chip: [
        { label: 'i', value: String(i), tone: 'violet' },
        { label: 'left<i<right?', value: arr[i - 1] + '<' + arr[i] + '>' + arr[i + 1], tone: isPeak ? 'pink' : 'violet' },
      ],
      caption: 'Inspect index ' + i + '. A peak needs arr[i-1] < arr[i] AND arr[i] > arr[i+1] strictly — flat ridges do not qualify. ' + (isPeak ? 'Peak detected — now expand outward.' : 'Not a peak — advance i.'),
    });
    if (!isPeak) { i++; continue; }

    let l = i - 1;
    while (l > 0 && arr[l - 1] < arr[l]) {
      l--;
      frames.push({
        array: arr, pointers: { peak: i, l },
        chip: [
          { label: 'walk left', value: 'arr[' + (l) + ']=' + arr[l], tone: 'violet' },
          { label: 'still ascending?', value: arr[l - 1] !== undefined ? String(arr[l - 1] < arr[l]) : 'edge', tone: 'pink' },
        ],
        caption: 'Walk l down while arr[l-1] < arr[l] — the left slope must be strictly increasing toward the peak. Stop the moment it flattens or reverses.',
      });
    }

    let r = i + 1;
    while (r < n - 1 && arr[r] > arr[r + 1]) {
      r++;
      frames.push({
        array: arr, pointers: { peak: i, l, r },
        chip: [
          { label: 'walk right', value: 'arr[' + r + ']=' + arr[r], tone: 'violet' },
          { label: 'still descending?', value: r + 1 < n ? String(arr[r] > arr[r + 1]) : 'edge', tone: 'pink' },
        ],
        caption: 'Walk r up while arr[r] > arr[r+1] — the right slope must be strictly decreasing away from the peak.',
      });
    }

    const len = r - l + 1;
    if (len > best) best = len;
    frames.push({
      array: arr, pointers: { peak: i, l, r },
      chip: [
        { label: 'mountain [' + l + '..' + r + ']', value: 'len ' + len, tone: 'pink' },
        { label: 'best', value: String(best), tone: 'violet' },
      ],
      caption: 'Found a complete mountain from ' + l + ' to ' + r + ' (length ' + len + '). Update best. Skip i forward to r — anything before r cannot start a longer mountain since its right slope is already consumed.',
    });
    i = r;
  }

  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'why peak-first', value: 'every mountain has exactly one peak', tone: 'violet' },
    ],
    caption: 'Anchoring on peaks rather than scanning all (l, r) pairs is the key reduction. Each peak owns a unique mountain — there is no overlap possible because two adjacent peaks would require a strictly-decreasing-then-strictly-increasing valley between them, which already counts as the end of one mountain and the start of another.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'why strict inequality', value: 'flats break the slope definition', tone: 'violet' },
    ],
    caption: 'Both slopes must be strict (arr[l-1] < arr[l] and arr[r] > arr[r+1]). A flat stretch in the middle of a slope is ambiguous — it is neither ascending nor descending — so the mountain ends at the start of the flat region.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'i = r jump', value: 'why it stays O(n)', tone: 'pink' },
    ],
    caption: 'After consuming a mountain we move i to r, not to i+1. Anything before r cannot start a new mountain whose right slope has not already been counted, and re-walking that descending slope as ascending is impossible by definition. This jump amortises the inner walks to O(n) total.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'edge', value: 'n < 3 or no peak', tone: 'pink' },
      { label: 'answer', value: '0' },
    ],
    caption: 'Edge: arrays shorter than 3 cannot contain a mountain. Same for monotone arrays — no strict peak exists. Both cases naturally fall through to best = 0 without special handling.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'answer', value: String(best), tone: 'pink' },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(1)', tone: 'violet' },
    ],
    caption: 'Longest mountain has length ' + best + '. Single pass: each index is scanned at most twice (once as a peak candidate, once as part of an outward walk). Return 0 if no mountain of length ≥ 3 exists.',
  });

  return { renderer: 'array', title: 'Longest Mountain in Array — peak expansion in one pass', frames };
}

function canReorderDoubledViz() {
  const arr = [4, -2, 2, -4];
  const frames = [];
  const count = new Map();
  for (const x of arr) count.set(x, (count.get(x) || 0) + 1);
  const keys = [...count.keys()].sort((a, b) => Math.abs(a) - Math.abs(b));
  let ok = true;

  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'arr', value: '[' + arr.join(',') + ']' },
      { label: 'goal', value: 'pair every x with 2x', tone: 'violet' },
    ],
    caption: 'We need to partition arr into pairs of the form (x, 2x). Equivalently: a multiset where every element x can be matched with another element equal to 2x. Length must be even — checked implicitly via counter draining.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'example', value: '[4,-2,2,-4]', tone: 'pink' },
      { label: 'valid pairing', value: '(-2,-4) and (2,4)', tone: 'violet' },
    ],
    caption: 'For [4, -2, 2, -4] the valid grouping is (-2, -4) and (2, 4). Notice -2 pairs with -4 because 2·(-2) = -4 — the "doubling" relationship goes from the smaller-magnitude element to the larger-magnitude one regardless of sign.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'counter', value: JSON.stringify(Object.fromEntries(count)), tone: 'violet' },
      { label: 'order', value: 'sort keys by |x|', tone: 'pink' },
    ],
    caption: 'Build a counter and process keys in increasing |x| order. Why |x|: for positives we want to pair smallest x with 2x; for negatives the "double" -4 is smaller (more negative) than its half -2, so absolute value normalises both signs. Process -2 before -4, and 2 before 4.',
  });
  frames.push({
    array: keys, pointers: {},
    chip: [
      { label: 'sorted by |x|', value: '[' + keys.join(',') + ']', tone: 'violet' },
    ],
    caption: 'Iterate keys in this order. For each key x with remaining count c, consume c copies of 2x from the counter — if 2x has fewer than c left, no valid pairing exists.',
  });

  for (const x of keys) {
    const c = count.get(x) || 0;
    if (c === 0) {
      frames.push({
        array: keys, pointers: {},
        chip: [
          { label: 'x', value: String(x) },
          { label: 'already paired', value: 'skip', tone: 'violet' },
        ],
        caption: 'x = ' + x + ' was already fully matched as the 2y of some smaller |y|. Skip it — no work to do.',
      });
      continue;
    }
    const dbl = 2 * x;
    const have = count.get(dbl) || 0;
    frames.push({
      array: keys, pointers: {},
      chip: [
        { label: 'x', value: String(x), tone: 'pink' },
        { label: 'need 2x', value: String(dbl) + ' x' + c },
        { label: 'have', value: String(have), tone: have >= c ? 'violet' : 'pink' },
      ],
      caption: 'For x = ' + x + ' we need ' + c + ' copies of 2x = ' + dbl + '. Counter has ' + have + '. ' + (have >= c ? 'Enough — consume them.' : 'Not enough — impossible.'),
    });
    if (have < c) { ok = false; break; }
    count.set(dbl, have - c);
    count.set(x, 0);
    frames.push({
      array: keys, pointers: {},
      chip: [
        { label: 'paired', value: c + ' copies of (' + x + ',' + dbl + ')', tone: 'pink' },
        { label: 'counter[' + dbl + ']', value: String(count.get(dbl)), tone: 'violet' },
      ],
      caption: 'Consumed ' + c + ' copies of ' + dbl + '. Both x and the matched portion of 2x are now used. Move on to the next key in |x| order.',
    });
  }

  frames.push({
    array: keys, pointers: {},
    chip: [
      { label: 'why greedy works', value: 'smallest |x| has no smaller partner', tone: 'violet' },
    ],
    caption: 'The smallest |x| key has no possible partner with smaller magnitude — its only valid match is 2x. If we cannot pair it now, we never can. That greedy choice is the foundation of the algorithm.',
  });
  frames.push({
    array: keys, pointers: {},
    chip: [
      { label: 'negatives', value: 'half(-4) = -2, not -8', tone: 'pink' },
    ],
    caption: 'For negatives the pairing direction inverts: the half of -4 is -2, not -8. Sorting by absolute value uniformises the handling — we always look for "twice" the current key, never "half".',
  });
  frames.push({
    array: keys, pointers: {},
    chip: [
      { label: 'zeros', value: 'count(0) must be even', tone: 'violet' },
    ],
    caption: 'Zero is its own double (0 = 2·0). If the count of zeros is odd, no valid pairing exists — the counter check catches this naturally since we would need count[0] copies of 2·0 = 0 and we already used some of them.',
  });
  frames.push({
    array: keys, pointers: {},
    chip: [
      { label: 'why not sort the array', value: 'sort distinct keys instead', tone: 'violet' },
    ],
    caption: 'Sorting the full array would also work but wastes time on duplicates. Sorting the distinct keys is strictly cheaper when the array has many repeats — same asymptotic bound, smaller constant.',
  });
  frames.push({
    array: arr, pointers: {},
    chip: [
      { label: 'answer', value: String(ok), tone: 'pink' },
      { label: 'time', value: 'O(n log n)', tone: 'violet' },
      { label: 'space', value: 'O(n)', tone: 'violet' },
    ],
    caption: 'Result: ' + ok + '. Sorting by |x| dominates (O(n log n)); the counter sweep is O(n). The trick is the absolute-value ordering — without it, the negative case breaks because -4 has "half" -2, not double.',
  });

  return { renderer: 'array', title: 'Array of Doubled Pairs — counter + sort by |x|', frames };
}

`;

const ENTRY_BLOCK = `  'subarray-product-less-than-k': {
    tags: ['array', 'sliding-window', 'two-pointers'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: subarrayProductLessThanKViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def numSubarrayProductLessThanK(self, nums: List[int], k: int) -> int:
        if k <= 1:
            return 0
        count, prod, l = 0, 1, 0
        for r, x in enumerate(nums):
            prod *= x
            while prod >= k:
                prod //= nums[l]
                l += 1
            count += r - l + 1
        return count\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Sliding window over strictly-positive values. Maintain product over [l..r]; whenever the product reaches k, shrink from the left until it dips below again. Each valid right end contributes (r - l + 1) new subarrays — every suffix of a valid window is itself a valid window. Edge: k ≤ 1 is impossible since every product is at least 1.',
      },
      javascript: {
        code: \`function numSubarrayProductLessThanK(nums, k) {
  if (k <= 1) return 0;
  let count = 0, prod = 1, l = 0;
  for (let r = 0; r < nums.length; r++) {
    prod *= nums[r];
    while (prod >= k) {
      prod /= nums[l];
      l++;
    }
    count += r - l + 1;
  }
  return count;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same two-pointer sweep. JS division on integers stays exact here because every shrink divides by a value that was previously multiplied in — no floating-point drift accumulates across the loop.',
      },
      java: {
        code: \`class Solution {
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        if (k <= 1) return 0;
        int count = 0, l = 0;
        long prod = 1;
        for (int r = 0; r < nums.length; r++) {
            prod *= nums[r];
            while (prod >= k) {
                prod /= nums[l++];
            }
            count += r - l + 1;
        }
        return count;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Use long for the running product — even with nums[i] ≤ 1000 and k ≤ 10^6, an intermediate product could overflow int before we shrink. The while-loop guarantees we never let it grow unboundedly.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if (k <= 1) return 0;
        long long prod = 1;
        int count = 0, l = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            prod *= nums[r];
            while (prod >= k) prod /= nums[l++];
            count += r - l + 1;
        }
        return count;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'long long is the safety net for the intermediate product. The amortised cost is O(n): l moves forward only, so it crosses each index at most once across the whole run.',
      },
      c: {
        code: \`int numSubarrayProductLessThanK(int* nums, int numsSize, int k) {
    if (k <= 1) return 0;
    long long prod = 1;
    int count = 0, l = 0;
    for (int r = 0; r < numsSize; r++) {
        prod *= nums[r];
        while (prod >= k) prod /= nums[l++];
        count += r - l + 1;
    }
    return count;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Plain two-pointer C with a long long accumulator. Integer division is exact because every divisor was previously a multiplier — no truncation error.',
      },
      go: {
        code: \`func numSubarrayProductLessThanK(nums []int, k int) int {
    if k <= 1 {
        return 0
    }
    count, l, prod := 0, 0, 1
    for r, x := range nums {
        prod *= x
        for prod >= k {
            prod /= nums[l]
            l++
        }
        count += r - l + 1
    }
    return count
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Go ints are 64-bit on most platforms so no overflow worry for the stated bounds. The pattern is identical: extend right, shrink left until valid, accumulate window size.',
      },
    },
  },
  'longest-mountain-in-array': {
    tags: ['array', 'two-pointers'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: longestMountainViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def longestMountain(self, arr: List[int]) -> int:
        n = len(arr)
        best, i = 0, 1
        while i < n - 1:
            if arr[i - 1] < arr[i] > arr[i + 1]:
                l = i - 1
                while l > 0 and arr[l - 1] < arr[l]:
                    l -= 1
                r = i + 1
                while r < n - 1 and arr[r] > arr[r + 1]:
                    r += 1
                best = max(best, r - l + 1)
                i = r
            else:
                i += 1
        return best\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Find each peak (strict left-less, strict right-less), then expand outward to find the base of both slopes. Strictness matters — flat ridges disqualify the mountain. After consuming a mountain, jump i to r so we never re-walk the descending slope as a new ascending one.',
      },
      javascript: {
        code: \`function longestMountain(arr) {
  const n = arr.length;
  let best = 0, i = 1;
  while (i < n - 1) {
    if (arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {
      let l = i - 1, r = i + 1;
      while (l > 0 && arr[l - 1] < arr[l]) l--;
      while (r < n - 1 && arr[r] > arr[r + 1]) r++;
      best = Math.max(best, r - l + 1);
      i = r;
    } else {
      i++;
    }
  }
  return best;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Peak-then-expand. Skipping i to r after each successful mountain keeps the total work linear — no index is part of more than one expansion.',
      },
      java: {
        code: \`class Solution {
    public int longestMountain(int[] arr) {
        int n = arr.length, best = 0, i = 1;
        while (i < n - 1) {
            if (arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {
                int l = i - 1, r = i + 1;
                while (l > 0 && arr[l - 1] < arr[l]) l--;
                while (r < n - 1 && arr[r] > arr[r + 1]) r++;
                best = Math.max(best, r - l + 1);
                i = r;
            } else {
                i++;
            }
        }
        return best;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Direct port. Alternative: two arrays up[i] / down[i] giving the longest ascending/descending run ending at i — then best = max(up[i] + down[i] + 1) where both are > 0. Same asymptotics, double the memory.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestMountain(vector<int>& arr) {
        int n = arr.size(), best = 0, i = 1;
        while (i < n - 1) {
            if (arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {
                int l = i - 1, r = i + 1;
                while (l > 0 && arr[l - 1] < arr[l]) l--;
                while (r < n - 1 && arr[r] > arr[r + 1]) r++;
                best = max(best, r - l + 1);
                i = r;
            } else {
                i++;
            }
        }
        return best;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same expansion strategy. Length 3 is the minimum mountain — a single rise or single fall does not count. If the array has no peaks at all, best stays 0.',
      },
      c: {
        code: \`int longestMountain(int* arr, int arrSize) {
    int best = 0, i = 1;
    while (i < arrSize - 1) {
        if (arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {
            int l = i - 1, r = i + 1;
            while (l > 0 && arr[l - 1] < arr[l]) l--;
            while (r < arrSize - 1 && arr[r] > arr[r + 1]) r++;
            int len = r - l + 1;
            if (len > best) best = len;
            i = r;
        } else {
            i++;
        }
    }
    return best;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Plain C peak-expansion. Each element is visited O(1) times amortised because i jumps to r after every successful mountain.',
      },
      go: {
        code: \`func longestMountain(arr []int) int {
    n := len(arr)
    best, i := 0, 1
    for i < n-1 {
        if arr[i-1] < arr[i] && arr[i] > arr[i+1] {
            l, r := i-1, i+1
            for l > 0 && arr[l-1] < arr[l] {
                l--
            }
            for r < n-1 && arr[r] > arr[r+1] {
                r++
            }
            if r-l+1 > best {
                best = r - l + 1
            }
            i = r
        } else {
            i++
        }
    }
    return best
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Idiomatic Go with two manual maxes. The i = r jump is the key linearity guarantee — without it the descending slope would be re-traversed as ascending and the worst case degenerates to O(n^2).',
      },
    },
  },
  'array-of-doubled-pairs': {
    tags: ['array', 'hashmap', 'sorting', 'greedy'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: canReorderDoubledViz(),
    solutions: {
      python: {
        code: \`from collections import Counter

class Solution:
    def canReorderDoubled(self, arr: List[int]) -> bool:
        count = Counter(arr)
        for x in sorted(count, key=abs):
            if count[x] == 0:
                continue
            if count[2 * x] < count[x]:
                return False
            count[2 * x] -= count[x]
            count[x] = 0
        return True\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Greedy with the right ordering. Sort keys by absolute value, then for each x match all its copies with copies of 2x. The |x| ordering handles negatives correctly: -2 must be matched as the half of -4, not the other way around, so we process -2 first. If at any step the counter does not have enough copies of 2x, the pairing is impossible.',
      },
      javascript: {
        code: \`function canReorderDoubled(arr) {
  const count = new Map();
  for (const x of arr) count.set(x, (count.get(x) || 0) + 1);
  const keys = [...count.keys()].sort((a, b) => Math.abs(a) - Math.abs(b));
  for (const x of keys) {
    const c = count.get(x);
    if (c === 0) continue;
    if ((count.get(2 * x) || 0) < c) return false;
    count.set(2 * x, count.get(2 * x) - c);
    count.set(x, 0);
  }
  return true;
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Map for the counter; comparator sorts by |x|. The conditional get with || 0 covers the case where 2x is not present at all — same effect as "not enough".',
      },
      java: {
        code: \`class Solution {
    public boolean canReorderDoubled(int[] arr) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : arr) count.merge(x, 1, Integer::sum);
        Integer[] keys = count.keySet().toArray(new Integer[0]);
        Arrays.sort(keys, (a, b) -> Integer.compare(Math.abs(a), Math.abs(b)));
        for (int x : keys) {
            int c = count.get(x);
            if (c == 0) continue;
            if (count.getOrDefault(2 * x, 0) < c) return false;
            count.put(2 * x, count.get(2 * x) - c);
            count.put(x, 0);
        }
        return true;
    }
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Box keys to Integer so the comparator can sort by absolute value. The boxed sort dominates; the sweep is linear in the number of distinct keys.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReorderDoubled(vector<int>& arr) {
        unordered_map<int, int> count;
        for (int x : arr) count[x]++;
        vector<int> keys;
        for (auto& kv : count) keys.push_back(kv.first);
        sort(keys.begin(), keys.end(), [](int a, int b) { return abs(a) < abs(b); });
        for (int x : keys) {
            int c = count[x];
            if (c == 0) continue;
            if (count[2 * x] < c) return false;
            count[2 * x] -= c;
            count[x] = 0;
        }
        return true;
    }
};\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'unordered_map for the counter, vector of keys for the |x|-ordered iteration. Note count[2*x] auto-inserts a 0 entry if missing — harmless here since we read then write the same slot.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <stdbool.h>

static int cmp_abs(const void* a, const void* b) {
    int x = abs(*(const int*)a), y = abs(*(const int*)b);
    return (x > y) - (x < y);
}

bool canReorderDoubled(int* arr, int arrSize) {
    // Sort by |x|; greedily try to pair from smallest magnitude.
    int* a = malloc(sizeof(int) * arrSize);
    for (int i = 0; i < arrSize; i++) a[i] = arr[i];
    qsort(a, arrSize, sizeof(int), cmp_abs);
    int* used = calloc(arrSize, sizeof(int));
    for (int i = 0; i < arrSize; i++) {
        if (used[i]) continue;
        int target = 2 * a[i];
        int j;
        for (j = i + 1; j < arrSize; j++) {
            if (!used[j] && a[j] == target) { used[j] = 1; break; }
        }
        if (j == arrSize) { free(a); free(used); return false; }
        used[i] = 1;
    }
    free(a); free(used);
    return true;
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Without a hashmap in plain C we fall back to sort-by-|x| then linear scan for each pairing. Works within the LeetCode constraint (n ≤ 3·10^4) though slower than the Map version.',
      },
      go: {
        code: \`func canReorderDoubled(arr []int) bool {
    count := make(map[int]int)
    for _, x := range arr {
        count[x]++
    }
    keys := make([]int, 0, len(count))
    for k := range count {
        keys = append(keys, k)
    }
    sort.Slice(keys, func(i, j int) bool {
        a, b := keys[i], keys[j]
        if a < 0 {
            a = -a
        }
        if b < 0 {
            b = -b
        }
        return a < b
    })
    for _, x := range keys {
        c := count[x]
        if c == 0 {
            continue
        }
        if count[2*x] < c {
            return false
        }
        count[2*x] -= c
        count[x] = 0
    }
    return true
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Manual abs inside the comparator since Go has no generic abs for ints in older toolchains. The counter-drain is identical to the other languages.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
let depth = 0, closeIdx = -1;
let state = 'code';
for (let p = openBracePos; p < src.length; p++) {
  const ch = src[p];
  const nx = src[p + 1];
  if (state === 'code') {
    if (ch === '/' && nx === '/') { state = 'line-comment'; p++; continue; }
    if (ch === '/' && nx === '*') { state = 'block-comment'; p++; continue; }
    if (ch === "'") { state = 'sq'; continue; }
    if (ch === '"') { state = 'dq'; continue; }
    if (ch === '`') { state = 'tpl'; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { closeIdx = p; break; }
    }
  } else if (state === 'line-comment') {
    if (ch === '\n') state = 'code';
  } else if (state === 'block-comment') {
    if (ch === '*' && nx === '/') { state = 'code'; p++; }
  } else if (state === 'sq') {
    if (ch === '\\') { p++; continue; }
    if (ch === "'") state = 'code';
  } else if (state === 'dq') {
    if (ch === '\\') { p++; continue; }
    if (ch === '"') state = 'code';
  } else if (state === 'tpl') {
    if (ch === '\\') { p++; continue; }
    if (ch === '`') state = 'code';
  }
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced 3 viz fns + 3 entries into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
