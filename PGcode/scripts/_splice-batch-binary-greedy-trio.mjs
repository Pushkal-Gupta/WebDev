#!/usr/bin/env node
// Atomic splice: find-first-and-last-position-of-element-in-sorted-array, count-number-of-teams, valid-parenthesis-string.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function searchRangeViz(')
  && src.includes('function numTeamsViz(')
  && src.includes('function checkValidStringViz(')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function searchRangeViz() {
  const nums = [5, 7, 7, 8, 8, 8, 10];
  const target = 8;
  const frames = [];

  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'nums', value: '[' + nums.join(',') + ']' },
      { label: 'target', value: String(target), tone: 'violet' },
      { label: 'goal', value: 'leftmost and rightmost index of target', tone: 'violet' },
    ],
    caption: 'Sorted array with duplicates. We want the first and last index where target appears, or [-1, -1] if absent. Linear scan is O(n); binary search collapses it to O(log n) by running two lower-bound style searches with different tie-breaks.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'two searches', value: 'leftmost + rightmost', tone: 'pink' },
      { label: 'shape', value: 'lower-bound variant', tone: 'violet' },
    ],
    caption: 'Search 1: smallest i with nums[i] >= target (the leftmost target if it exists). Search 2: smallest i with nums[i] > target, then subtract 1 (the rightmost target). Both are lower-bound shapes — only the comparison differs.',
  });

  // Leftmost search
  let lo = 0, hi = nums.length;
  frames.push({
    array: nums, pointers: { lo, hi },
    chip: [
      { label: 'phase', value: 'leftmost search', tone: 'pink' },
      { label: 'invariant', value: 'answer in [lo, hi]', tone: 'violet' },
    ],
    caption: 'Initialise lo=0, hi=n. Half-open interval [lo, hi) — hi=n lets the answer be "past the end" when target is larger than all elements. We shrink the window until lo == hi.',
  });
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const goLeft = nums[mid] >= target;
    frames.push({
      array: nums, pointers: { lo, hi, mid },
      chip: [
        { label: 'mid', value: String(mid), tone: 'violet' },
        { label: 'nums[mid]', value: String(nums[mid]) },
        { label: 'nums[mid] >= target', value: String(goLeft), tone: goLeft ? 'pink' : 'violet' },
      ],
      caption: 'mid = ' + mid + ', nums[mid] = ' + nums[mid] + '. ' + (goLeft ? 'It is >= target, so mid is a candidate — shrink hi down to mid (keep mid included).' : 'It is < target, so target lies strictly to the right — move lo to mid+1.'),
    });
    if (goLeft) hi = mid; else lo = mid + 1;
  }
  const left = (lo < nums.length && nums[lo] === target) ? lo : -1;
  frames.push({
    array: nums, pointers: { lo },
    chip: [
      { label: 'leftmost', value: String(left), tone: 'pink' },
      { label: 'check', value: 'nums[lo] === target?', tone: 'violet' },
    ],
    caption: 'Leftmost candidate is lo = ' + lo + '. Confirm by checking nums[lo] === target (handles the "target absent" case where lo points just past where it would have lived). Result: ' + left + '.',
  });

  // Rightmost search
  let lo2 = 0, hi2 = nums.length;
  frames.push({
    array: nums, pointers: { lo: lo2, hi: hi2 },
    chip: [
      { label: 'phase', value: 'rightmost search', tone: 'pink' },
      { label: 'comparison', value: 'nums[mid] > target', tone: 'violet' },
    ],
    caption: 'Restart with lo=0, hi=n. Same shape, different tie-break: shrink left when nums[mid] > target (strictly greater). The result lo points to the first element past target — so the rightmost target is at lo-1.',
  });
  while (lo2 < hi2) {
    const mid = (lo2 + hi2) >> 1;
    const goLeft = nums[mid] > target;
    frames.push({
      array: nums, pointers: { lo: lo2, hi: hi2, mid },
      chip: [
        { label: 'mid', value: String(mid), tone: 'violet' },
        { label: 'nums[mid]', value: String(nums[mid]) },
        { label: 'nums[mid] > target', value: String(goLeft), tone: goLeft ? 'pink' : 'violet' },
      ],
      caption: 'mid = ' + mid + ', nums[mid] = ' + nums[mid] + '. ' + (goLeft ? 'It is strictly greater — shrink hi to mid.' : 'It is <= target — equal values must move lo right of mid so we find the boundary past the last target.'),
    });
    if (goLeft) hi2 = mid; else lo2 = mid + 1;
  }
  const right = (left === -1) ? -1 : lo2 - 1;
  frames.push({
    array: nums, pointers: { lo: lo2 },
    chip: [
      { label: 'first index > target', value: String(lo2), tone: 'violet' },
      { label: 'rightmost', value: String(right), tone: 'pink' },
    ],
    caption: 'lo2 points to the first index whose value is strictly greater than target. The rightmost target sits one step before: lo2 - 1 = ' + right + '. If target was absent the leftmost search already returned -1 and we propagate that.',
  });

  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'why two searches', value: 'one search finds only one boundary', tone: 'violet' },
    ],
    caption: 'A single binary search lands on some occurrence but cannot tell you the range. Two lower-bound searches with different comparators (>= and >) pin down both boundaries in O(log n) each — total still O(log n).',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'why half-open [lo, hi)', value: 'cleaner termination', tone: 'pink' },
    ],
    caption: 'Using hi = n (one past the end) and loop while lo < hi avoids off-by-one bugs. The invariant "answer lives in [lo, hi)" holds throughout — when lo == hi the interval is empty and lo is the answer.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'edge', value: 'target absent', tone: 'pink' },
      { label: 'output', value: '[-1, -1]' },
    ],
    caption: 'When target does not exist, leftmost search lands at the slot where target would be inserted — nums[lo] is not target. We short-circuit to [-1, -1] without running the second search if we want.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'edge', value: 'empty array', tone: 'pink' },
    ],
    caption: 'Empty array: lo = hi = 0 from the start, neither loop runs, the index check fails, output is [-1, -1]. No special branch needed.',
  });
  frames.push({
    array: nums, pointers: {},
    chip: [
      { label: 'answer', value: '[' + left + ', ' + right + ']', tone: 'pink' },
      { label: 'time', value: 'O(log n)', tone: 'violet' },
      { label: 'space', value: 'O(1)', tone: 'violet' },
    ],
    caption: 'Range of target ' + target + ' is [' + left + ', ' + right + ']. Two O(log n) searches, O(1) extra space. The "lower bound with two comparators" idiom generalises to any sorted-range query.',
  });

  return { renderer: 'array', title: 'First and Last Position — two binary searches with different tie-breaks', frames };
}

function numTeamsViz() {
  const rating = [2, 5, 3, 4, 1];
  const n = rating.length;
  const frames = [];
  let total = 0;

  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'rating', value: '[' + rating.join(',') + ']' },
      { label: 'team', value: '(i, j, k) with i<j<k', tone: 'violet' },
      { label: 'condition', value: 'rating[i]<rating[j]<rating[k] or strictly decreasing', tone: 'violet' },
    ],
    caption: 'Count ordered index triples (i, j, k) with i < j < k such that ratings are strictly monotonic (all increasing or all decreasing). Brute force is O(n^3); we get O(n^2) by anchoring on j.',
  });
  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'key idea', value: 'fix middle j, count left/right contributions', tone: 'pink' },
    ],
    caption: 'For each middle index j, count L = number of i<j with rating[i]<rating[j] and R = number of k>j with rating[k]>rating[j]. Then j contributes L*R increasing teams. Same logic with reversed inequality for decreasing teams.',
  });

  for (let j = 1; j < n - 1; j++) {
    let leftLess = 0, leftMore = 0, rightLess = 0, rightMore = 0;
    for (let i = 0; i < j; i++) {
      if (rating[i] < rating[j]) leftLess++;
      else if (rating[i] > rating[j]) leftMore++;
    }
    for (let k = j + 1; k < n; k++) {
      if (rating[k] < rating[j]) rightLess++;
      else if (rating[k] > rating[j]) rightMore++;
    }
    const inc = leftLess * rightMore;
    const dec = leftMore * rightLess;
    total += inc + dec;
    frames.push({
      array: rating, pointers: { j },
      chip: [
        { label: 'j', value: String(j) + ' (rating ' + rating[j] + ')', tone: 'pink' },
        { label: 'left<', value: String(leftLess) },
        { label: 'left>', value: String(leftMore) },
        { label: 'right<', value: String(rightLess) },
        { label: 'right>', value: String(rightMore) },
      ],
      caption: 'Middle j = ' + j + ' (rating ' + rating[j] + '). Increasing teams = leftLess * rightMore = ' + leftLess + ' * ' + rightMore + ' = ' + inc + '. Decreasing teams = leftMore * rightLess = ' + leftMore + ' * ' + rightLess + ' = ' + dec + '. Running total: ' + total + '.',
    });
  }

  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'why anchor on j', value: 'middle uniquely determines L*R', tone: 'violet' },
    ],
    caption: 'Anchoring on the middle is the trick. Anchoring on i or k requires nested loops to find a valid (j, k) pair afterwards — back to O(n^3). The middle splits the triple into two independent counting problems.',
  });
  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'multiplication principle', value: 'independent choices', tone: 'pink' },
    ],
    caption: 'L and R are independent: any qualifying i can pair with any qualifying k since the choices are disjoint by position. So total teams through j equals L * R — no double counting, no missed triples.',
  });
  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'unique values', value: 'rating[i] all distinct', tone: 'violet' },
    ],
    caption: 'The problem guarantees all ratings are distinct, so the strict comparisons partition perfectly into "less" and "more" — no ties to handle. If duplicates were allowed we would need a third bucket.',
  });
  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'O(n log n) variant', value: 'Fenwick tree on sorted ratings', tone: 'pink' },
    ],
    caption: 'Faster solution: coordinate-compress ratings, then use a Fenwick tree to count, for each i, how many earlier indices have a smaller rating. Same again for "greater". Multiply contributions in a sweep — O(n log n). Overkill for n ≤ 1000.',
  });
  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'edge', value: 'n < 3', tone: 'pink' },
      { label: 'answer', value: '0' },
    ],
    caption: 'If fewer than 3 soldiers exist, no team can form. The outer loop j ∈ [1, n-2] is empty so total stays at 0 automatically.',
  });
  frames.push({
    array: rating, pointers: {},
    chip: [
      { label: 'answer', value: String(total), tone: 'pink' },
      { label: 'time', value: 'O(n^2)', tone: 'violet' },
      { label: 'space', value: 'O(1)', tone: 'violet' },
    ],
    caption: 'Total monotonic teams: ' + total + '. The O(n^2) approach is the right balance for n ≤ 1000 — simpler than Fenwick and easily fast enough.',
  });

  return { renderer: 'array', title: 'Count Teams — fix middle, multiply left and right contributions', frames };
}

function checkValidStringViz() {
  const s = '(*))';
  const chars = s.split('');
  const frames = [];
  let lo = 0, hi = 0;

  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 's', value: s },
      { label: 'goal', value: 'is some assignment of * making s balanced?', tone: 'violet' },
    ],
    caption: 'Each * can be (, ), or empty. Question: does there exist any choice of replacements making s a balanced parenthesis string? Brute force is exponential — we collapse it to a single pass tracking a range of possible open-counts.',
  });
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'two counters', value: 'lo, hi', tone: 'pink' },
      { label: 'meaning', value: 'min/max possible open count', tone: 'violet' },
    ],
    caption: 'Maintain lo = minimum possible open-parens count assuming each * is whatever helps close most, hi = maximum possible open count assuming each * is (. The true count lives somewhere in [lo, hi]; if 0 is reachable at the end, we have a valid assignment.',
  });
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'rules', value: '( → lo+1, hi+1', tone: 'violet' },
      { label: '', value: ') → lo-1, hi-1', tone: 'violet' },
      { label: '', value: '* → lo-1, hi+1', tone: 'violet' },
    ],
    caption: 'Per character: ( bumps both. ) drops both. * drops lo (treat as )) and bumps hi (treat as (). Clamp lo at 0 — open count cannot go negative because that would mean we read more ) than (.',
  });

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === '(') { lo++; hi++; }
    else if (c === ')') { lo--; hi--; }
    else { lo--; hi++; }
    const failed = hi < 0;
    const loBefore = lo;
    if (lo < 0) lo = 0;
    frames.push({
      array: chars, pointers: { i },
      chip: [
        { label: 'i', value: String(i), tone: 'violet' },
        { label: 'char', value: c, tone: 'pink' },
        { label: 'lo', value: String(lo) + (loBefore < 0 ? ' (clamped from ' + loBefore + ')' : '') },
        { label: 'hi', value: String(hi), tone: hi < 0 ? 'pink' : 'violet' },
      ],
      caption: 'After char "' + c + '": lo=' + (loBefore < 0 ? loBefore + ' clamped to 0' : lo) + ', hi=' + hi + '. ' + (failed ? 'hi < 0 means even the most generous interpretation overflowed — no valid assignment exists. Bail out.' : 'Still in range; continue.'),
    });
    if (failed) break;
  }

  const valid = lo === 0 && hi >= 0;
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'final lo', value: String(lo), tone: lo === 0 ? 'pink' : 'violet' },
      { label: 'valid?', value: String(valid), tone: 'pink' },
    ],
    caption: 'At the end, lo = ' + lo + '. Valid iff lo == 0 — that means it is possible to have zero unmatched (, which is what "balanced" means. ' + (valid ? 'Valid assignment exists.' : 'No assignment makes s balanced.'),
  });

  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'why clamp lo at 0', value: 'open count cannot be negative', tone: 'violet' },
    ],
    caption: 'If lo dips below 0, it would mean some * was treated as ) when no ( was available — that is not a legal assignment. Clamping at 0 forces those * to be treated as "empty" or "(" instead, preserving the range semantics.',
  });
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'why hi < 0 fails', value: 'even being maximally optimistic overflowed', tone: 'pink' },
    ],
    caption: 'hi is the most generous count — every * is (. If even hi goes negative, there are more ) than (+* could possibly cover. No assignment can save it. Early exit.',
  });
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'alternative', value: 'stack of "(" and "*" indices', tone: 'violet' },
    ],
    caption: 'Equivalent solution: push indices of ( and * onto two stacks; on ) pop from ( first, then *. After the loop, any remaining ( must be matched by a later *. Two-counter version is O(1) space vs O(n) for stacks.',
  });
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'edge', value: 'all *', tone: 'pink' },
      { label: 'result', value: 'valid (treat all as empty)', tone: 'violet' },
    ],
    caption: 'A string of all * is valid — treat every one as empty. lo stays clamped at 0, hi grows then we accept since lo == 0 at the end. The range model handles this naturally.',
  });
  frames.push({
    array: chars, pointers: {},
    chip: [
      { label: 'answer', value: String(valid), tone: 'pink' },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(1)', tone: 'violet' },
    ],
    caption: 'Single pass, two integer counters, O(1) space. The genius is collapsing the exponential decision tree (each * has 3 choices) into a tight interval that captures every reachable state.',
  });

  return { renderer: 'array', title: 'Valid Parenthesis String — min/max open count range', frames };
}

`;

const ENTRY_BLOCK = `  'find-first-and-last-position-of-element-in-sorted-array': {
    tags: ['array', 'binary-search'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: searchRangeViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        def lower_bound(strict_greater: bool) -> int:
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = (lo + hi) // 2
                if (nums[mid] > target) if strict_greater else (nums[mid] >= target):
                    hi = mid
                else:
                    lo = mid + 1
            return lo
        left = lower_bound(False)
        if left == len(nums) or nums[left] != target:
            return [-1, -1]
        right = lower_bound(True) - 1
        return [left, right]\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Two lower-bound style binary searches differing only in tie-break. First finds leftmost index with nums[i] >= target; second finds leftmost index with nums[i] > target (the rightmost target sits one position before). Half-open intervals [lo, hi) avoid off-by-one bugs. If target is missing, the first search lands at the insertion point and the equality check short-circuits to [-1, -1].',
      },
      javascript: {
        code: \`function searchRange(nums, target) {
  const lowerBound = (strictGreater) => {
    let lo = 0, hi = nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const goLeft = strictGreater ? nums[mid] > target : nums[mid] >= target;
      if (goLeft) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
  const left = lowerBound(false);
  if (left === nums.length || nums[left] !== target) return [-1, -1];
  return [left, lowerBound(true) - 1];
}\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Shared helper with a boolean for strict vs non-strict comparison. Same shape twice keeps the code DRY and the boundary semantics consistent.',
      },
      java: {
        code: \`class Solution {
    public int[] searchRange(int[] nums, int target) {
        int left = lowerBound(nums, target, false);
        if (left == nums.length || nums[left] != target) return new int[]{-1, -1};
        int right = lowerBound(nums, target, true) - 1;
        return new int[]{left, right};
    }
    private int lowerBound(int[] nums, int target, boolean strictGreater) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            boolean goLeft = strictGreater ? nums[mid] > target : nums[mid] >= target;
            if (goLeft) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Unsigned right shift (>>>) for the midpoint avoids the (lo + hi) overflow pitfall on very large arrays. The helper pattern keeps both searches in one tested code path.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        int left = lowerBound(nums, target, false);
        if (left == (int)nums.size() || nums[left] != target) return {-1, -1};
        int right = lowerBound(nums, target, true) - 1;
        return {left, right};
    }
private:
    int lowerBound(vector<int>& nums, int target, bool strictGreater) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            bool goLeft = strictGreater ? nums[mid] > target : nums[mid] >= target;
            if (goLeft) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'lo + (hi - lo) / 2 is the safer midpoint formula — never overflows even at INT_MAX. Standard library lower_bound and upper_bound do the same thing in one line each if you trust them.',
      },
      c: {
        code: \`static int lowerBound(int* nums, int n, int target, int strictGreater) {
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int goLeft = strictGreater ? nums[mid] > target : nums[mid] >= target;
        if (goLeft) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

int* searchRange(int* nums, int numsSize, int target, int* returnSize) {
    int* res = malloc(2 * sizeof(int));
    *returnSize = 2;
    int left = lowerBound(nums, numsSize, target, 0);
    if (left == numsSize || nums[left] != target) {
        res[0] = -1; res[1] = -1;
        return res;
    }
    res[0] = left;
    res[1] = lowerBound(nums, numsSize, target, 1) - 1;
    return res;
}\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Caller allocates the result array. Same two-search shape; the helper takes a flag for which comparator to use.',
      },
      go: {
        code: \`func searchRange(nums []int, target int) []int {
    lowerBound := func(strictGreater bool) int {
        lo, hi := 0, len(nums)
        for lo < hi {
            mid := (lo + hi) / 2
            var goLeft bool
            if strictGreater {
                goLeft = nums[mid] > target
            } else {
                goLeft = nums[mid] >= target
            }
            if goLeft {
                hi = mid
            } else {
                lo = mid + 1
            }
        }
        return lo
    }
    left := lowerBound(false)
    if left == len(nums) || nums[left] != target {
        return []int{-1, -1}
    }
    return []int{left, lowerBound(true) - 1}
}\`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach: 'Closure captures nums and target. sort.Search from stdlib does the same thing with a predicate if you want a one-liner.',
      },
    },
  },
  'count-number-of-teams': {
    tags: ['array', 'dynamic-programming', 'binary-indexed-tree'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: numTeamsViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def numTeams(self, rating: List[int]) -> int:
        n = len(rating)
        total = 0
        for j in range(1, n - 1):
            left_less = sum(1 for i in range(j) if rating[i] < rating[j])
            left_more = j - left_less
            right_more = sum(1 for k in range(j + 1, n) if rating[k] > rating[j])
            right_less = (n - 1 - j) - right_more
            total += left_less * right_more + left_more * right_less
        return total\`,
        complexity: { time: 'O(n^2)', space: 'O(1)' },
        approach: 'Anchor on the middle j. For each j, count how many earlier indices are smaller/larger and how many later indices are smaller/larger. Increasing teams through j = leftLess * rightMore; decreasing teams = leftMore * rightLess. Sum across all j. This works because every valid triple has exactly one middle index, and the choices of i and k are independent given j.',
      },
      javascript: {
        code: \`function numTeams(rating) {
  const n = rating.length;
  let total = 0;
  for (let j = 1; j < n - 1; j++) {
    let leftLess = 0, rightMore = 0;
    for (let i = 0; i < j; i++) if (rating[i] < rating[j]) leftLess++;
    for (let k = j + 1; k < n; k++) if (rating[k] > rating[j]) rightMore++;
    const leftMore = j - leftLess;
    const rightLess = (n - 1 - j) - rightMore;
    total += leftLess * rightMore + leftMore * rightLess;
  }
  return total;
}\`,
        complexity: { time: 'O(n^2)', space: 'O(1)' },
        approach: 'Count once, derive the complements. Avoids four separate inner loops — leftMore = j - leftLess and rightLess = (n-1-j) - rightMore by definition.',
      },
      java: {
        code: \`class Solution {
    public int numTeams(int[] rating) {
        int n = rating.length, total = 0;
        for (int j = 1; j < n - 1; j++) {
            int leftLess = 0, rightMore = 0;
            for (int i = 0; i < j; i++) if (rating[i] < rating[j]) leftLess++;
            for (int k = j + 1; k < n; k++) if (rating[k] > rating[j]) rightMore++;
            int leftMore = j - leftLess;
            int rightLess = (n - 1 - j) - rightMore;
            total += leftLess * rightMore + leftMore * rightLess;
        }
        return total;
    }
}\`,
        complexity: { time: 'O(n^2)', space: 'O(1)' },
        approach: 'Plain nested loops. For the stated n ≤ 1000 this is comfortably fast. A Fenwick-tree variant gets you O(n log n) but the code is 3× longer and the input size does not justify it.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numTeams(vector<int>& rating) {
        int n = rating.size(), total = 0;
        for (int j = 1; j < n - 1; j++) {
            int leftLess = 0, rightMore = 0;
            for (int i = 0; i < j; i++) if (rating[i] < rating[j]) leftLess++;
            for (int k = j + 1; k < n; k++) if (rating[k] > rating[j]) rightMore++;
            int leftMore = j - leftLess;
            int rightLess = (n - 1 - j) - rightMore;
            total += leftLess * rightMore + leftMore * rightLess;
        }
        return total;
    }
};\`,
        complexity: { time: 'O(n^2)', space: 'O(1)' },
        approach: 'Identical structure. Ratings are guaranteed distinct so the partition into "less" and "more" is clean — no equal-rating bucket needed.',
      },
      c: {
        code: \`int numTeams(int* rating, int ratingSize) {
    int total = 0;
    for (int j = 1; j < ratingSize - 1; j++) {
        int leftLess = 0, rightMore = 0;
        for (int i = 0; i < j; i++) if (rating[i] < rating[j]) leftLess++;
        for (int k = j + 1; k < ratingSize; k++) if (rating[k] > rating[j]) rightMore++;
        int leftMore = j - leftLess;
        int rightLess = (ratingSize - 1 - j) - rightMore;
        total += leftLess * rightMore + leftMore * rightLess;
    }
    return total;
}\`,
        complexity: { time: 'O(n^2)', space: 'O(1)' },
        approach: 'Direct port; the multiplication principle does all the work. Each middle index contributes leftLess*rightMore increasing plus leftMore*rightLess decreasing teams.',
      },
      go: {
        code: \`func numTeams(rating []int) int {
    n := len(rating)
    total := 0
    for j := 1; j < n-1; j++ {
        leftLess, rightMore := 0, 0
        for i := 0; i < j; i++ {
            if rating[i] < rating[j] {
                leftLess++
            }
        }
        for k := j + 1; k < n; k++ {
            if rating[k] > rating[j] {
                rightMore++
            }
        }
        leftMore := j - leftLess
        rightLess := (n - 1 - j) - rightMore
        total += leftLess*rightMore + leftMore*rightLess
    }
    return total
}\`,
        complexity: { time: 'O(n^2)', space: 'O(1)' },
        approach: 'Idiomatic Go with the same anchor-on-j strategy. For n ≤ 1000 this clears comfortably within typical 1-second limits.',
      },
    },
  },
  'valid-parenthesis-string': {
    tags: ['string', 'greedy', 'stack', 'dynamic-programming'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: checkValidStringViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def checkValidString(self, s: str) -> bool:
        lo, hi = 0, 0
        for c in s:
            if c == '(':
                lo += 1
                hi += 1
            elif c == ')':
                lo -= 1
                hi -= 1
            else:
                lo -= 1
                hi += 1
            if hi < 0:
                return False
            if lo < 0:
                lo = 0
        return lo == 0\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Track lo and hi = the minimum and maximum possible number of open parens given every legal interpretation of the * characters seen so far. ( bumps both; ) drops both; * drops lo and bumps hi (the full range of its choices). Clamp lo at 0 (open count cannot be negative). If hi ever goes negative, even the most generous reading overflowed and no assignment can save it — return False. At the end, valid iff 0 is in the reachable range, i.e. lo == 0.',
      },
      javascript: {
        code: \`function checkValidString(s) {
  let lo = 0, hi = 0;
  for (const c of s) {
    if (c === '(') { lo++; hi++; }
    else if (c === ')') { lo--; hi--; }
    else { lo--; hi++; }
    if (hi < 0) return false;
    if (lo < 0) lo = 0;
  }
  return lo === 0;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same two-counter range model. Collapses an exponential decision tree (each * has 3 possible interpretations) into a single interval [lo, hi] that captures every reachable open-count.',
      },
      java: {
        code: \`class Solution {
    public boolean checkValidString(String s) {
        int lo = 0, hi = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') { lo++; hi++; }
            else if (c == ')') { lo--; hi--; }
            else { lo--; hi++; }
            if (hi < 0) return false;
            if (lo < 0) lo = 0;
        }
        return lo == 0;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same O(1)-space range tracking. Alternative DP solution is O(n^2) memoised over (index, open-count) — correct but much slower and unnecessary given the greedy proof.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool checkValidString(string s) {
        int lo = 0, hi = 0;
        for (char c : s) {
            if (c == '(') { lo++; hi++; }
            else if (c == ')') { lo--; hi--; }
            else { lo--; hi++; }
            if (hi < 0) return false;
            if (lo < 0) lo = 0;
        }
        return lo == 0;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Range collapsing in O(1) space. Stack-based alternative (two stacks for ( and *) works but uses O(n) extra memory for no algorithmic gain.',
      },
      c: {
        code: \`#include <stdbool.h>
#include <string.h>

bool checkValidString(char* s) {
    int lo = 0, hi = 0;
    for (int i = 0; s[i]; i++) {
        char c = s[i];
        if (c == '(') { lo++; hi++; }
        else if (c == ')') { lo--; hi--; }
        else { lo--; hi++; }
        if (hi < 0) return false;
        if (lo < 0) lo = 0;
    }
    return lo == 0;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Plain C, two integer counters, single pass. Clamping lo at 0 is the subtle step — without it, sequences like "(*)" would erroneously reject because lo would drift negative on the *.',
      },
      go: {
        code: \`func checkValidString(s string) bool {
    lo, hi := 0, 0
    for _, c := range s {
        switch c {
        case '(':
            lo++
            hi++
        case ')':
            lo--
            hi--
        default:
            lo--
            hi++
        }
        if hi < 0 {
            return false
        }
        if lo < 0 {
            lo = 0
        }
    }
    return lo == 0
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Switch on rune. The greedy range proof: if 0 is in [lo, hi] at the end and hi never dropped below 0 mid-stream, then some assignment of * choices balances s.',
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
