#!/usr/bin/env node
// Part 6: problems 56-75 — sliding-window mostly, plus prefix-sum
import fs from 'node:fs';

const entries = [];
const add = (p) => entries.push(p);

// 56. minimum-window-subsequence (Leetcode 727)
add({
  id: 'minimum-window-subsequence',
  method_name: 'minWindow',
  params: [{ name: 'S', type: 'str' }, { name: 'T', type: 'str' }],
  return_type: 'str',
  pattern: 'Two-pointer expand + contract',
  description: '<p>Given strings <code>S</code> and <code>T</code>, find the minimum (contiguous) substring <code>W</code> of <code>S</code> such that <code>T</code> is a subsequence of <code>W</code>. If multiple windows tie on length, return the leftmost. If no such window exists, return the empty string.</p>',
  hints: [
    'Walk forward through S, advancing a pointer in T whenever characters match.',
    'When the T pointer reaches the end, T is a subsequence of S[start..i].',
    'Then walk back from i to tighten the window — re-match T from right to left.',
    'Record the tightest window seen so far.',
    'Each character of S enters and leaves at most once, giving O(|S| * |T|) worst case.',
  ],
  test_cases: [
    { inputs: ['"abcdebdde"', '"bde"'], expected: '"bcde"' },
    { inputs: ['"jmeqksfrsdcmsiwvaovztaqenprpvnbstl"', '"u"'], expected: '""' },
    { inputs: ['"abc"', '"abc"'], expected: '"abc"' },
    { inputs: ['"abc"', '"d"'], expected: '""' },
    { inputs: ['""', '"a"'], expected: '""' },
    { inputs: ['"a"', '"a"'], expected: '"a"' },
    { inputs: ['"abcdef"', '"af"'], expected: '"abcdef"' },
    { inputs: ['"cnhczmccqouqadqtmjjzl"', '"mm"'], expected: '"mccqouqadqtm"' },
    { inputs: ['"abcabc"', '"ac"'], expected: '"abc"' },
    { inputs: ['"xyzxyz"', '"xz"'], expected: '"xyz"' },
  ],
  editorial_md: `## Intuition
We need the shortest contiguous slice of \`S\` that still contains \`T\` as a subsequence (characters in order, not necessarily adjacent). A simple two-pointer trick is enough: walk through \`S\` advancing a \`T\` pointer on every match. When \`T\` is fully matched, we have a candidate end index. To find the smallest start for that end, walk backwards from the end position re-matching \`T\` from right to left — that gives the latest valid start, which makes the window minimal for this end.

## Approach
1. Pointer \`j = 0\` into \`T\`. Walk \`i\` through \`S\`.
2. When \`S[i] == T[j]\`, advance \`j\`. If \`j == len(T)\`:
   - We have one valid window ending at \`i\`. Backtrack: set \`end = i\`, \`j--\`, and walk \`i\` left while \`j >= 0\`, decrementing \`j\` when \`S[i] == T[j]\`. The position \`i + 1\` is the tightest start.
   - Record the window if it is shorter than the best so far.
   - Reset: \`j = 0\`, \`i = start + 1\` (continue searching beyond the current start).
3. Return the best window, or empty string if none was found.

The forward+backward double-walk is O(|S| * |T|) in the worst case but typically much faster.

## Complexity
- Time: O(|S| * |T|) worst case.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def minWindow(self, S, T):
        n, m = len(S), len(T)
        if m == 0: return ''
        i = 0; j = 0
        best_len = float('inf'); best_start = -1
        while i < n:
            if S[i] == T[j]:
                j += 1
                if j == m:
                    end = i
                    j -= 1
                    while j >= 0:
                        if S[i] == T[j]: j -= 1
                        i -= 1
                    j += 1; i += 1
                    if end - i + 1 < best_len:
                        best_len = end - i + 1
                        best_start = i
                    j = 0
                    i = i + 1
                    continue
            i += 1
        return '' if best_start == -1 else S[best_start:best_start + best_len]
`,
    javascript: `class Solution {
    minWindow(S, T) {
        const n = S.length, m = T.length;
        if (m === 0) return '';
        let i = 0, j = 0, bestLen = Infinity, bestStart = -1;
        while (i < n) {
            if (S[i] === T[j]) {
                j++;
                if (j === m) {
                    let end = i;
                    j--;
                    while (j >= 0) {
                        if (S[i] === T[j]) j--;
                        i--;
                    }
                    j++; i++;
                    if (end - i + 1 < bestLen) { bestLen = end - i + 1; bestStart = i; }
                    j = 0;
                    i++;
                    continue;
                }
            }
            i++;
        }
        return bestStart === -1 ? '' : S.slice(bestStart, bestStart + bestLen);
    }
}
`,
    java: `class Solution {
    public String minWindow(String S, String T) {
        int n = S.length(), m = T.length();
        if (m == 0) return "";
        int i = 0, j = 0, bestLen = Integer.MAX_VALUE, bestStart = -1;
        while (i < n) {
            if (S.charAt(i) == T.charAt(j)) {
                j++;
                if (j == m) {
                    int end = i;
                    j--;
                    while (j >= 0) {
                        if (S.charAt(i) == T.charAt(j)) j--;
                        i--;
                    }
                    j++; i++;
                    if (end - i + 1 < bestLen) { bestLen = end - i + 1; bestStart = i; }
                    j = 0;
                    i++;
                    continue;
                }
            }
            i++;
        }
        return bestStart == -1 ? "" : S.substring(bestStart, bestStart + bestLen);
    }
}
`,
    cpp: `#include <string>
#include <climits>
using namespace std;
class Solution {
public:
    string minWindow(string S, string T) {
        int n = S.size(), m = T.size();
        if (m == 0) return "";
        int i = 0, j = 0, bestLen = INT_MAX, bestStart = -1;
        while (i < n) {
            if (S[i] == T[j]) {
                j++;
                if (j == m) {
                    int end = i;
                    j--;
                    while (j >= 0) {
                        if (S[i] == T[j]) j--;
                        i--;
                    }
                    j++; i++;
                    if (end - i + 1 < bestLen) { bestLen = end - i + 1; bestStart = i; }
                    j = 0;
                    i++;
                    continue;
                }
            }
            i++;
        }
        return bestStart == -1 ? "" : S.substr(bestStart, bestLen);
    }
};
`,
  },
});

// 57. smallest-containing-0-1-and-2 — sort 0 1 2 (Dutch national flag)
add({
  id: 'smallest-containing-0-1-and-2',
  method_name: 'sortColors',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Dutch national flag (three-way partition)',
  description: '<p>Sort an array containing only the values 0, 1, and 2 in place using a single pass. Return the sorted array.</p>',
  hints: [
    'Use three pointers: low, mid, high.',
    'Walk mid from left to right.',
    'At nums[mid] == 0, swap with low and advance both low and mid.',
    'At nums[mid] == 1, just advance mid.',
    'At nums[mid] == 2, swap with high and decrement high (do not advance mid — it may now hold a 0 or 1).',
  ],
  test_cases: [
    { inputs: ['[2,0,2,1,1,0]'], expected: '[0,0,1,1,2,2]' },
    { inputs: ['[2,0,1]'], expected: '[0,1,2]' },
    { inputs: ['[0]'], expected: '[0]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[2]'], expected: '[2]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[0,0,0]'], expected: '[0,0,0]' },
    { inputs: ['[2,2,2]'], expected: '[2,2,2]' },
    { inputs: ['[1,0,2,1,0,2,1,0,2]'], expected: '[0,0,0,1,1,1,2,2,2]' },
    { inputs: ['[2,1,0]'], expected: '[0,1,2]' },
  ],
  editorial_md: `## Intuition
The "Dutch national flag" problem sorts an array of three distinct keys in a single linear pass using only O(1) extra space. We maintain three regions: \`[0, low)\` holds 0s, \`[low, mid)\` holds 1s, \`[mid, high]\` is unprocessed, and \`(high, n - 1]\` holds 2s. A single \`mid\` cursor walks left to right, swapping 0s into the front region and 2s into the back region.

## Approach
1. Initialise \`low = 0\`, \`mid = 0\`, \`high = n - 1\`.
2. While \`mid <= high\`:
   - If \`nums[mid] == 0\`: swap \`nums[mid]\` with \`nums[low]\`; \`low++\`; \`mid++\`.
   - Else if \`nums[mid] == 1\`: \`mid++\`.
   - Else (\`nums[mid] == 2\`): swap \`nums[mid]\` with \`nums[high]\`; \`high--\`. Do **not** advance \`mid\` — the freshly swapped value is unprocessed.
3. The array is sorted in place when the loop ends.

The invariant that every region holds the correct values is preserved by each branch, and \`high - mid\` strictly decreases when we swap a 2 forward, so the loop terminates.

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def sortColors(self, nums):
        low, mid, high = 0, 0, len(nums) - 1
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]; low += 1; mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]; high -= 1
        return nums
`,
    javascript: `class Solution {
    sortColors(nums) {
        let low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] === 0) { [nums[low], nums[mid]] = [nums[mid], nums[low]]; low++; mid++; }
            else if (nums[mid] === 1) mid++;
            else { [nums[mid], nums[high]] = [nums[high], nums[mid]]; high--; }
        }
        return nums;
    }
}
`,
    java: `class Solution {
    public int[] sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) { int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t; low++; mid++; }
            else if (nums[mid] == 1) mid++;
            else { int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t; high--; }
        }
        return nums;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> sortColors(vector<int>& nums) {
        int low = 0, mid = 0, high = nums.size() - 1;
        while (mid <= high) {
            if (nums[mid] == 0) { swap(nums[low], nums[mid]); low++; mid++; }
            else if (nums[mid] == 1) mid++;
            else { swap(nums[mid], nums[high]); high--; }
        }
        return nums;
    }
};
`,
  },
});

// 58. subarrays-with-k-odds
add({
  id: 'subarrays-with-k-odds',
  method_name: 'numberOfSubarraysWithKOdds',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'At-most-K trick (sliding window)',
  description: '<p>Given an integer array and a positive integer <code>k</code>, return the number of contiguous subarrays that contain exactly <code>k</code> odd numbers.</p>',
  hints: [
    'Use the standard at-most-K - at-most-(K-1) decomposition.',
    'A subarray with at most K odds is counted by a window that maintains odd-count <= K.',
    'For each right index, add (window length) to the count.',
    'Exact-K count = atMost(K) - atMost(K - 1).',
    'O(n).',
  ],
  test_cases: [
    { inputs: ['[1,1,2,1,1]', '3'], expected: '2' },
    { inputs: ['[2,4,6]', '1'], expected: '0' },
    { inputs: ['[2,2,2,1,2,2,1,2,2,2]', '2'], expected: '16' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[2]', '1'], expected: '0' },
    { inputs: ['[]', '1'], expected: '0' },
    { inputs: ['[1,1,1,1,1]', '1'], expected: '5' },
    { inputs: ['[1,1,1,1,1]', '5'], expected: '1' },
    { inputs: ['[1,2,1,2,1]', '2'], expected: '7' },
    { inputs: ['[2,2,2,2]', '0'], expected: '10' },
  ],
  editorial_md: `## Intuition
Counting subarrays with exactly \`k\` of some property is a classic case for the at-most-K trick: for each right pointer, count all subarrays ending at \`r\` with at most \`k\` odds, then subtract the count with at most \`k - 1\` odds. The difference is exactly \`k\` odds.

## Approach
1. Define helper \`atMost(k)\`: slide a window \`[l, r]\`. For each \`r\`, increment odd count if \`nums[r]\` is odd. While the odd count exceeds \`k\`, advance \`l\` (decrementing the count for the leaving element). Add \`r - l + 1\` to the running total — this counts all subarrays ending at \`r\` with at most \`k\` odds.
2. Answer = \`atMost(k) - atMost(k - 1)\`.

Edge cases: when \`k == 0\` and the array contains only evens, \`atMost(0)\` counts every subarray and \`atMost(-1)\` is 0. When \`k\` exceeds the total odd count, the answer collapses to all subarrays (if and only if at-most counts cap there).

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def numberOfSubarraysWithKOdds(self, nums, k):
        def at_most(K):
            if K < 0: return 0
            l = 0; odd = 0; total = 0
            for r in range(len(nums)):
                if nums[r] % 2 == 1: odd += 1
                while odd > K:
                    if nums[l] % 2 == 1: odd -= 1
                    l += 1
                total += r - l + 1
            return total
        return at_most(k) - at_most(k - 1)
`,
    javascript: `class Solution {
    numberOfSubarraysWithKOdds(nums, k) {
        const atMost = (K) => {
            if (K < 0) return 0;
            let l = 0, odd = 0, total = 0;
            for (let r = 0; r < nums.length; r++) {
                if (nums[r] % 2 === 1) odd++;
                while (odd > K) { if (nums[l] % 2 === 1) odd--; l++; }
                total += r - l + 1;
            }
            return total;
        };
        return atMost(k) - atMost(k - 1);
    }
}
`,
    java: `class Solution {
    public int numberOfSubarraysWithKOdds(int[] nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }
    private int atMost(int[] nums, int K) {
        if (K < 0) return 0;
        int l = 0, odd = 0, total = 0;
        for (int r = 0; r < nums.length; r++) {
            if ((nums[r] & 1) == 1) odd++;
            while (odd > K) { if ((nums[l] & 1) == 1) odd--; l++; }
            total += r - l + 1;
        }
        return total;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int numberOfSubarraysWithKOdds(vector<int>& nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }
private:
    int atMost(vector<int>& nums, int K) {
        if (K < 0) return 0;
        int l = 0, odd = 0, total = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            if (nums[r] & 1) odd++;
            while (odd > K) { if (nums[l] & 1) odd--; l++; }
            total += r - l + 1;
        }
        return total;
    }
};
`,
  },
});

// 59. subarrays-less-than-k — count subarrays whose product is strictly less than k (Leetcode 713)
add({
  id: 'subarrays-less-than-k',
  method_name: 'numSubarrayProductLessThanK',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window on product',
  description: '<p>Given an array of positive integers and an integer <code>k</code>, return the number of contiguous subarrays whose product is strictly less than <code>k</code>.</p>',
  hints: [
    'Maintain a sliding window with a running product.',
    'When product >= k, advance left and divide out the leaving element.',
    'For each right index, add (window length) to the count.',
    'If k <= 1, no subarray of positive integers has product < 1 -> return 0.',
    'O(n) time.',
  ],
  test_cases: [
    { inputs: ['[10,5,2,6]', '100'], expected: '8' },
    { inputs: ['[1,2,3]', '0'], expected: '0' },
    { inputs: ['[1,1,1]', '2'], expected: '6' },
    { inputs: ['[10]', '11'], expected: '1' },
    { inputs: ['[10]', '10'], expected: '0' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[1,2,3,4]', '10'], expected: '7' },
    { inputs: ['[5,5,5]', '125'], expected: '5' },
    { inputs: ['[100,200,300]', '1'], expected: '0' },
    { inputs: ['[1,2,3,4,5]', '120'], expected: '14' },
  ],
  editorial_md: `## Intuition
With positive integers, the product of a sliding window grows monotonically as you add elements and shrinks monotonically as you remove them. This lets us count subarrays with product < \`k\` in linear time: for each right pointer, contract the left until the product is valid, then the number of valid subarrays ending at \`r\` equals \`r - l + 1\`.

## Approach
1. If \`k <= 1\`, return 0 — no subarray of positive integers can have product less than 1.
2. \`l = 0\`, \`prod = 1\`, \`count = 0\`.
3. For \`r\` from 0 to \`n - 1\`:
   - \`prod *= nums[r]\`.
   - While \`prod >= k\`: \`prod /= nums[l]\`; \`l++\`.
   - Add \`r - l + 1\` to \`count\`.
4. Return \`count\`.

The reason "add \`r - l + 1\`" works: every subarray that ends at \`r\` and starts in \`[l, r]\` is a valid subarray (its product is at most \`prod < k\`). There are \`r - l + 1\` of them.

## Complexity
- Time: O(n) amortised.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def numSubarrayProductLessThanK(self, nums, k):
        if k <= 1: return 0
        l = 0; prod = 1; count = 0
        for r in range(len(nums)):
            prod *= nums[r]
            while prod >= k:
                prod //= nums[l]; l += 1
            count += r - l + 1
        return count
`,
    javascript: `class Solution {
    numSubarrayProductLessThanK(nums, k) {
        if (k <= 1) return 0;
        let l = 0, prod = 1, count = 0;
        for (let r = 0; r < nums.length; r++) {
            prod *= nums[r];
            while (prod >= k) { prod = Math.floor(prod / nums[l]); l++; }
            count += r - l + 1;
        }
        return count;
    }
}
`,
    java: `class Solution {
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        if (k <= 1) return 0;
        int l = 0, count = 0; long prod = 1;
        for (int r = 0; r < nums.length; r++) {
            prod *= nums[r];
            while (prod >= k) { prod /= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if (k <= 1) return 0;
        int l = 0, count = 0; long long prod = 1;
        for (int r = 0; r < (int)nums.size(); r++) {
            prod *= nums[r];
            while (prod >= k) { prod /= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
};
`,
  },
});

// 60. substrings-with-all-vowels (count substrings of s containing all 5 vowels at least once)
add({
  id: 'substrings-with-all-vowels',
  method_name: 'countAllVowelsSubstrings',
  params: [{ name: 's', type: 'str' }],
  return_type: 'int',
  pattern: 'At-most-K sliding window',
  description: '<p>Given a lowercase string, count the number of substrings that contain all five vowels (a, e, i, o, u) at least once each. Consonants may appear anywhere in the substring.</p>',
  hints: [
    'For each right index r, find the smallest left index l such that [l..r] contains all five vowels.',
    'As r grows, l only moves right (monotone).',
    'When [l..r] is valid, every left start in [0, l] yields a valid substring -> add (l + 1) to the count.',
    'Track the multiplicity of each vowel inside the window.',
    'O(n) time, O(1) extra.',
  ],
  test_cases: [
    { inputs: ['"aeiouaeiou"'], expected: '21' },
    { inputs: ['"aaaeeeiiiooouuu"'], expected: '1' },
    { inputs: ['"aeio"'], expected: '0' },
    { inputs: ['"bcdfg"'], expected: '0' },
    { inputs: ['""'], expected: '0' },
    { inputs: ['"a"'], expected: '0' },
    { inputs: ['"aeiou"'], expected: '1' },
    { inputs: ['"aeioub"'], expected: '2' },
    { inputs: ['"baeiou"'], expected: '2' },
    { inputs: ['"xyzaeiouqq"'], expected: '6' },
  ],
  editorial_md: `## Intuition
For each window ending at \`r\`, we want the smallest start \`l\` so that the window contains every vowel. Since adding characters only adds vowels and removing characters only removes them, \`l\` only moves right as \`r\` grows — a classic "shortest valid window" sliding-window problem. Once we know the tightest start at index \`L\`, every start in \`[0, L]\` produces a valid substring ending at \`r\`, contributing \`L + 1\` to the count.

## Approach
1. Map each vowel to a slot in a count array of size 5.
2. \`l = 0\`, \`have = 0\` (number of distinct vowels present), counts initialised to 0.
3. For \`r\` from 0 to \`n - 1\`:
   - If \`s[r]\` is a vowel, increment its count; if its count just became 1, \`have++\`.
   - While \`have == 5\`:
     - Try to shrink: decrement count for \`s[l]\` (if it is a vowel); if it drops to 0, \`have--\`; \`l++\`.
   - At this point \`l\` is one past the smallest valid start, so all valid starts are in \`[0, l - 1]\` — there are \`l\` of them. Add \`l\` to the count if \`r\`'s window ever satisfied the constraint.
4. Tracking "if the window ever satisfied" can be done by simply incrementing the count every time we shrink \`l\` past a vowel that satisfied the constraint — equivalently, after the inner while, add \`l\` (which counts the number of valid starts \`[0..l-1]\` for this \`r\`).

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def countAllVowelsSubstrings(self, s):
        vowels = {'a', 'e', 'i', 'o', 'u'}
        count = {v: 0 for v in vowels}
        have = 0
        l = 0
        total = 0
        for r in range(len(s)):
            c = s[r]
            if c in vowels:
                count[c] += 1
                if count[c] == 1: have += 1
            while have == 5:
                lc = s[l]
                if lc in vowels:
                    count[lc] -= 1
                    if count[lc] == 0: have -= 1
                l += 1
            total += l if have < 5 and self._was_valid(have, count, l) else 0
            # Simpler: a substring ending at r is valid iff its start is in [0, l-1] (after shrink).
            # So just add l after each r.
            total = total  # noop; replaced below
        # Recompute cleanly:
        count = {v: 0 for v in vowels}
        have = 0; l = 0; total = 0
        for r in range(len(s)):
            c = s[r]
            if c in vowels:
                count[c] += 1
                if count[c] == 1: have += 1
            while have == 5:
                lc = s[l]
                if lc in vowels:
                    count[lc] -= 1
                    if count[lc] == 0: have -= 1
                l += 1
            total += l
        return total
    def _was_valid(self, *args): return False
`,
    javascript: `class Solution {
    countAllVowelsSubstrings(s) {
        const idx = {a:0,e:1,i:2,o:3,u:4};
        const count = [0,0,0,0,0];
        let have = 0, l = 0, total = 0;
        for (let r = 0; r < s.length; r++) {
            if (s[r] in idx) {
                if (++count[idx[s[r]]] === 1) have++;
            }
            while (have === 5) {
                if (s[l] in idx) {
                    if (--count[idx[s[l]]] === 0) have--;
                }
                l++;
            }
            total += l;
        }
        return total;
    }
}
`,
    java: `class Solution {
    public int countAllVowelsSubstrings(String s) {
        int[] count = new int[5];
        int have = 0, l = 0, total = 0;
        for (int r = 0; r < s.length(); r++) {
            int vr = vIdx(s.charAt(r));
            if (vr >= 0) { if (++count[vr] == 1) have++; }
            while (have == 5) {
                int vl = vIdx(s.charAt(l));
                if (vl >= 0) { if (--count[vl] == 0) have--; }
                l++;
            }
            total += l;
        }
        return total;
    }
    private int vIdx(char c) {
        switch (c) { case 'a': return 0; case 'e': return 1; case 'i': return 2; case 'o': return 3; case 'u': return 4; default: return -1; }
    }
}
`,
    cpp: `#include <string>
using namespace std;
class Solution {
public:
    int countAllVowelsSubstrings(string s) {
        int count[5] = {0,0,0,0,0};
        int have = 0, l = 0, total = 0;
        auto vidx = [](char c) -> int {
            switch (c) { case 'a': return 0; case 'e': return 1; case 'i': return 2; case 'o': return 3; case 'u': return 4; default: return -1; }
        };
        for (int r = 0; r < (int)s.size(); r++) {
            int vr = vidx(s[r]);
            if (vr >= 0) { if (++count[vr] == 1) have++; }
            while (have == 5) {
                int vl = vidx(s[l]);
                if (vl >= 0) { if (--count[vl] == 0) have--; }
                l++;
            }
            total += l;
        }
        return total;
    }
};
`,
  },
});

// 61. number-of-subarrays-having-sum-less-than-k (positive ints)
add({
  id: 'number-of-subarrays-having-sum-less-than-k',
  method_name: 'countSubarraysLessThanK',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window on positives',
  description: '<p>Given an array of positive integers and an integer <code>k</code>, count the number of contiguous subarrays whose sum is strictly less than <code>k</code>.</p>',
  hints: [
    'Sliding window on positives — sum is monotone.',
    'For each right index, find the largest left such that sum < k.',
    'Add (r - l + 1) to count.',
    'When the running sum >= k, advance left and subtract the leaving element.',
    'O(n) amortised.',
  ],
  test_cases: [
    { inputs: ['[1,11,2,3,15]', '10'], expected: '4' },
    { inputs: ['[1,2,3]', '4'], expected: '4' },
    { inputs: ['[5]', '10'], expected: '1' },
    { inputs: ['[5]', '5'], expected: '0' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[10,10,10]', '5'], expected: '0' },
    { inputs: ['[1,1,1,1]', '2'], expected: '4' },
    { inputs: ['[1,1,1,1]', '3'], expected: '7' },
    { inputs: ['[1,2,3,4,5]', '6'], expected: '7' },
    { inputs: ['[2,3,1,1]', '5'], expected: '6' },
  ],
  editorial_md: `## Intuition
Same monotone trick as the "product less than K" problem: positive elements make window-sum monotone, so we can slide a window where the sum stays strictly less than \`k\`, and for each right pointer add the count of valid subarrays ending at \`r\`.

## Approach
1. \`l = 0\`, \`cur = 0\`, \`count = 0\`.
2. For \`r\` from 0 to \`n - 1\`:
   - \`cur += nums[r]\`.
   - While \`cur >= k\` and \`l <= r\`: \`cur -= nums[l]\`; \`l++\`.
   - Add \`r - l + 1\` to \`count\`.
3. Return \`count\`.

After the inner while, \`cur < k\` (or the window is empty). Every subarray starting at indices \`l..r\` and ending at \`r\` has sum \`<= cur < k\`, so it is valid — that's \`r - l + 1\` subarrays.

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def countSubarraysLessThanK(self, nums, k):
        l = 0; cur = 0; count = 0
        for r in range(len(nums)):
            cur += nums[r]
            while cur >= k and l <= r:
                cur -= nums[l]; l += 1
            count += r - l + 1
        return count
`,
    javascript: `class Solution {
    countSubarraysLessThanK(nums, k) {
        let l = 0, cur = 0, count = 0;
        for (let r = 0; r < nums.length; r++) {
            cur += nums[r];
            while (cur >= k && l <= r) { cur -= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
}
`,
    java: `class Solution {
    public int countSubarraysLessThanK(int[] nums, int k) {
        int l = 0, count = 0; long cur = 0;
        for (int r = 0; r < nums.length; r++) {
            cur += nums[r];
            while (cur >= k && l <= r) { cur -= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int countSubarraysLessThanK(vector<int>& nums, int k) {
        int l = 0, count = 0; long long cur = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            cur += nums[r];
            while (cur >= k && l <= r) { cur -= nums[l]; l++; }
            count += r - l + 1;
        }
        return count;
    }
};
`,
  },
});

// 62. count-subarrays-with-k-equal-value-pairs (count subarrays with exactly k equal value pairs)
add({
  id: 'count-subarrays-with-k-equal-value-pairs',
  method_name: 'countSubarraysWithKPairs',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'At-most-K decomposition + hash map',
  description: '<p>Given an integer array and an integer <code>k</code>, return the number of contiguous subarrays that contain exactly <code>k</code> equal-value pairs (i.e., pairs of indices <code>(i, j)</code> within the subarray such that <code>nums[i] == nums[j]</code> and <code>i &lt; j</code>).</p>',
  hints: [
    'Use the at-most-K minus at-most-(K-1) trick.',
    'Inside a sliding window, track per-value frequency f.',
    'When you add a new value with current frequency f, you create f new pairs.',
    'When you remove a value with current frequency f, you destroy (f - 1) pairs.',
    'Adjust pair count as the window slides.',
  ],
  test_cases: [
    { inputs: ['[1,2,1,2,3]', '2'], expected: '3' },
    { inputs: ['[1,1,1,1,1]', '10'], expected: '1' },
    { inputs: ['[1,2,3,4,5]', '0'], expected: '15' },
    { inputs: ['[1,1]', '1'], expected: '1' },
    { inputs: ['[1,1,1]', '1'], expected: '2' },
    { inputs: ['[1,1,1,1]', '3'], expected: '2' },
    { inputs: ['[]', '0'], expected: '0' },
    { inputs: ['[1]', '0'], expected: '1' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[2,2,2]', '2'], expected: '1' },
  ],
  editorial_md: `## Intuition
Counting subarrays with exactly \`k\` of some property is the canonical at-most-K trick: compute \`atMost(k) - atMost(k - 1)\`. Inside each sliding window, adding a new value with frequency \`f\` creates \`f\` new equal-value pairs (it pairs with every prior copy); removing one with frequency \`f\` destroys \`f - 1\` pairs.

## Approach
1. Helper \`atMost(k)\` slides a window with a frequency map \`cnt\` and a running pair counter \`pairs\`.
2. For each \`r\`:
   - \`pairs += cnt[nums[r]]\`; increment \`cnt[nums[r]]\`.
   - While \`pairs > k\`:
     - Decrement \`cnt[nums[l]]\`; \`pairs -= cnt[nums[l]]\`; \`l++\`.
   - Add \`r - l + 1\` to the total — every subarray ending at \`r\` with start in \`[l, r]\` has at most \`k\` pairs.
3. Answer = \`atMost(k) - atMost(k - 1)\`.

The pair update formula comes from algebra: if a value appears \`f\` times in the window, the number of pairs from that value is \`f * (f - 1) / 2\`. Adding one bumps that to \`(f + 1) * f / 2\`, a delta of \`f\`. Removing one drops it from \`f * (f - 1) / 2\` to \`(f - 1) * (f - 2) / 2\`, a delta of \`f - 1\`.

## Complexity
- Time: O(n) amortised.
- Space: O(d) where d is the number of distinct values.`,
  solutions: {
    python: `from collections import defaultdict
class Solution:
    def countSubarraysWithKPairs(self, nums, k):
        def at_most(K):
            if K < 0: return 0
            cnt = defaultdict(int); pairs = 0; l = 0; total = 0
            for r in range(len(nums)):
                pairs += cnt[nums[r]]
                cnt[nums[r]] += 1
                while pairs > K:
                    cnt[nums[l]] -= 1
                    pairs -= cnt[nums[l]]
                    l += 1
                total += r - l + 1
            return total
        return at_most(k) - at_most(k - 1)
`,
    javascript: `class Solution {
    countSubarraysWithKPairs(nums, k) {
        const atMost = (K) => {
            if (K < 0) return 0;
            const cnt = new Map();
            let pairs = 0, l = 0, total = 0;
            for (let r = 0; r < nums.length; r++) {
                const v = nums[r];
                pairs += cnt.get(v) || 0;
                cnt.set(v, (cnt.get(v) || 0) + 1);
                while (pairs > K) {
                    const lv = nums[l];
                    cnt.set(lv, cnt.get(lv) - 1);
                    pairs -= cnt.get(lv);
                    l++;
                }
                total += r - l + 1;
            }
            return total;
        };
        return atMost(k) - atMost(k - 1);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int countSubarraysWithKPairs(int[] nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }
    private int atMost(int[] nums, int K) {
        if (K < 0) return 0;
        Map<Integer,Integer> cnt = new HashMap<>();
        int pairs = 0, l = 0, total = 0;
        for (int r = 0; r < nums.length; r++) {
            int c = cnt.getOrDefault(nums[r], 0);
            pairs += c;
            cnt.put(nums[r], c + 1);
            while (pairs > K) {
                int lc = cnt.get(nums[l]);
                cnt.put(nums[l], lc - 1);
                pairs -= (lc - 1);
                l++;
            }
            total += r - l + 1;
        }
        return total;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    int countSubarraysWithKPairs(vector<int>& nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }
private:
    int atMost(vector<int>& nums, int K) {
        if (K < 0) return 0;
        unordered_map<int,int> cnt;
        int pairs = 0, l = 0, total = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            pairs += cnt[nums[r]];
            cnt[nums[r]]++;
            while (pairs > K) {
                cnt[nums[l]]--;
                pairs -= cnt[nums[l]];
                l++;
            }
            total += r - l + 1;
        }
        return total;
    }
};
`,
  },
});

// 63. longest-substring-with-distinct (no repeating chars)
add({
  id: 'longest-substring-with-distinct',
  method_name: 'lengthOfLongestSubstring',
  params: [{ name: 's', type: 'str' }],
  return_type: 'int',
  pattern: 'Sliding window with last-seen index',
  description: '<p>Given a string, return the length of the longest substring with all distinct characters.</p>',
  hints: [
    'Slide a window with no duplicates.',
    'Map each character to its most recent index.',
    'When a duplicate appears inside the window, jump left to one past the previous index.',
    'Update the answer at every right step.',
    'O(n) time.',
  ],
  test_cases: [
    { inputs: ['"abcabcbb"'], expected: '3' },
    { inputs: ['"bbbbb"'], expected: '1' },
    { inputs: ['"pwwkew"'], expected: '3' },
    { inputs: ['""'], expected: '0' },
    { inputs: ['" "'], expected: '1' },
    { inputs: ['"au"'], expected: '2' },
    { inputs: ['"dvdf"'], expected: '3' },
    { inputs: ['"abcdef"'], expected: '6' },
    { inputs: ['"abba"'], expected: '2' },
    { inputs: ['"tmmzuxt"'], expected: '5' },
  ],
  editorial_md: `## Intuition
A "longest substring with no repeats" question becomes trivial with a sliding window plus a "last seen index" map. When we encounter a character that already exists inside the current window, we jump the left pointer to one past its previous occurrence — every other case is "just include this new character".

## Approach
1. Initialise \`l = 0\`, \`best = 0\`, and an empty map \`last\`.
2. For each \`r\` from 0 to \`n - 1\`:
   - If \`s[r]\` is in \`last\` and \`last[s[r]] >= l\`, jump: \`l = last[s[r]] + 1\`.
   - Update \`last[s[r]] = r\`.
   - Update \`best = max(best, r - l + 1)\`.
3. Return \`best\`.

The \`last[s[r]] >= l\` guard prevents jumping backwards when a duplicate sits outside the current window (we already moved past it).

## Complexity
- Time: O(n).
- Space: O(min(n, alphabet)).`,
  solutions: {
    python: `class Solution:
    def lengthOfLongestSubstring(self, s):
        last = {}
        l = 0; best = 0
        for r, c in enumerate(s):
            if c in last and last[c] >= l:
                l = last[c] + 1
            last[c] = r
            best = max(best, r - l + 1)
        return best
`,
    javascript: `class Solution {
    lengthOfLongestSubstring(s) {
        const last = new Map();
        let l = 0, best = 0;
        for (let r = 0; r < s.length; r++) {
            const c = s[r];
            if (last.has(c) && last.get(c) >= l) l = last.get(c) + 1;
            last.set(c, r);
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int l = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (last.containsKey(c) && last.get(c) >= l) l = last.get(c) + 1;
            last.put(c, r);
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char,int> last;
        int l = 0, best = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            auto it = last.find(s[r]);
            if (it != last.end() && it->second >= l) l = it->second + 1;
            last[s[r]] = r;
            best = max(best, r - l + 1);
        }
        return best;
    }
};
`,
  },
});

// 64. substring-character-replacement (Leetcode 424)
add({
  id: 'substring-character-replacement',
  method_name: 'characterReplacement',
  params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window with max-frequency',
  description: '<p>Given a string of uppercase letters and an integer <code>k</code>, return the length of the longest substring that can be made up of the same character after replacing at most <code>k</code> other characters.</p>',
  hints: [
    'In a window of length L with max single-char frequency f, replacements needed = L - f.',
    'Slide window. If L - f > k, advance left.',
    'Track max f as window grows.',
    'Answer is the largest valid window size.',
    'O(n) time, O(26) space.',
  ],
  test_cases: [
    { inputs: ['"ABAB"', '2'], expected: '4' },
    { inputs: ['"AABABBA"', '1'], expected: '4' },
    { inputs: ['"AAAA"', '0'], expected: '4' },
    { inputs: ['"ABCDE"', '1'], expected: '2' },
    { inputs: ['""', '0'], expected: '0' },
    { inputs: ['"A"', '0'], expected: '1' },
    { inputs: ['"AB"', '0'], expected: '1' },
    { inputs: ['"AB"', '1'], expected: '2' },
    { inputs: ['"ABABABAB"', '4'], expected: '8' },
    { inputs: ['"AABBCCDD"', '2'], expected: '4' },
  ],
  editorial_md: `## Intuition
A window of length \`L\` can be turned into a single repeated character with \`L - max_freq\` replacements, where \`max_freq\` is the count of the most-common character in the window. The window is valid iff \`L - max_freq <= k\`. Slide the window, never shrinking when \`max_freq\` could still produce a longer valid window — even if it briefly becomes inaccurate, the answer is monotone.

## Approach
1. Maintain a 26-bucket count array, a running max-frequency \`max_freq\`, and a left pointer \`l\`.
2. For each \`r\`:
   - Increment count for \`s[r]\` and update \`max_freq\`.
   - If \`(r - l + 1) - max_freq > k\`, the window is too costly to fix — advance \`l\` and decrement \`count[s[l]]\`. We don't decrement \`max_freq\` here because the answer can never exceed any past \`max_freq + k\`.
3. The largest valid window length seen at any point is the answer.

The trick of not decrementing \`max_freq\` keeps the algorithm O(n) — the resulting window length tracking is correct even though \`max_freq\` is a high-water mark, not the current max.

## Complexity
- Time: O(n).
- Space: O(26) = O(1).`,
  solutions: {
    python: `class Solution:
    def characterReplacement(self, s, k):
        count = [0] * 26
        l = 0; max_freq = 0; best = 0
        for r in range(len(s)):
            count[ord(s[r]) - ord('A')] += 1
            max_freq = max(max_freq, count[ord(s[r]) - ord('A')])
            if (r - l + 1) - max_freq > k:
                count[ord(s[l]) - ord('A')] -= 1
                l += 1
            best = max(best, r - l + 1)
        return best
`,
    javascript: `class Solution {
    characterReplacement(s, k) {
        const count = new Array(26).fill(0);
        let l = 0, maxFreq = 0, best = 0;
        for (let r = 0; r < s.length; r++) {
            const idx = s.charCodeAt(r) - 65;
            count[idx]++;
            maxFreq = Math.max(maxFreq, count[idx]);
            if ((r - l + 1) - maxFreq > k) { count[s.charCodeAt(l) - 65]--; l++; }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    java: `class Solution {
    public int characterReplacement(String s, int k) {
        int[] count = new int[26];
        int l = 0, maxFreq = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            int idx = s.charAt(r) - 'A';
            count[idx]++;
            maxFreq = Math.max(maxFreq, count[idx]);
            if ((r - l + 1) - maxFreq > k) { count[s.charAt(l) - 'A']--; l++; }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    cpp: `#include <string>
#include <algorithm>
using namespace std;
class Solution {
public:
    int characterReplacement(string s, int k) {
        int count[26] = {0};
        int l = 0, maxFreq = 0, best = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            int idx = s[r] - 'A';
            count[idx]++;
            maxFreq = max(maxFreq, count[idx]);
            if ((r - l + 1) - maxFreq > k) { count[s[l] - 'A']--; l++; }
            best = max(best, r - l + 1);
        }
        return best;
    }
};
`,
  },
});

// 65. longest-substring-with-k-uniques
add({
  id: 'longest-substring-with-k-uniques',
  method_name: 'longestKUniques',
  params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window with distinct-count',
  description: '<p>Given a string and an integer <code>k</code>, return the length of the longest substring containing exactly <code>k</code> distinct characters. If no such substring exists, return <code>-1</code>.</p>',
  hints: [
    'Sliding window with a hash map of character counts.',
    'Add chars on the right; if distinct count > k, shrink from the left.',
    'Record the window length whenever distinct count == k.',
    'If we never see a window with exactly k distinct, return -1.',
    'O(n) time.',
  ],
  test_cases: [
    { inputs: ['"aabacbebebe"', '3'], expected: '7' },
    { inputs: ['"aaaa"', '2'], expected: '-1' },
    { inputs: ['"aabbcc"', '1'], expected: '2' },
    { inputs: ['"aabbcc"', '2'], expected: '4' },
    { inputs: ['"aabbcc"', '3'], expected: '6' },
    { inputs: ['""', '1'], expected: '-1' },
    { inputs: ['"a"', '1'], expected: '1' },
    { inputs: ['"a"', '2'], expected: '-1' },
    { inputs: ['"abcabcabc"', '2'], expected: '2' },
    { inputs: ['"eceba"', '2'], expected: '3' },
  ],
  editorial_md: `## Intuition
A standard sliding window tracks how many distinct characters are in the current window. The window is valid when the distinct count equals \`k\`; if it exceeds \`k\`, shrink from the left. We record the length whenever the count hits exactly \`k\`. If that never happens, the answer is \`-1\`.

## Approach
1. \`l = 0\`, \`best = -1\`, \`cnt = empty map\`.
2. For each \`r\`:
   - Increment \`cnt[s[r]]\`.
   - While \`len(cnt) > k\`:
     - Decrement \`cnt[s[l]]\`; if zero, remove the key; \`l++\`.
   - If \`len(cnt) == k\`, update \`best = max(best, r - l + 1)\`.
3. Return \`best\`.

The strict check \`== k\` is what differentiates this from "at most K distinct" — we don't credit any shorter prefix.

## Complexity
- Time: O(n) amortised.
- Space: O(alphabet) = O(min(n, k)).`,
  solutions: {
    python: `from collections import defaultdict
class Solution:
    def longestKUniques(self, s, k):
        cnt = defaultdict(int)
        l = 0; best = -1
        for r in range(len(s)):
            cnt[s[r]] += 1
            while len(cnt) > k:
                cnt[s[l]] -= 1
                if cnt[s[l]] == 0: del cnt[s[l]]
                l += 1
            if len(cnt) == k:
                best = max(best, r - l + 1)
        return best
`,
    javascript: `class Solution {
    longestKUniques(s, k) {
        const cnt = new Map();
        let l = 0, best = -1;
        for (let r = 0; r < s.length; r++) {
            cnt.set(s[r], (cnt.get(s[r]) || 0) + 1);
            while (cnt.size > k) {
                cnt.set(s[l], cnt.get(s[l]) - 1);
                if (cnt.get(s[l]) === 0) cnt.delete(s[l]);
                l++;
            }
            if (cnt.size === k) best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int longestKUniques(String s, int k) {
        Map<Character,Integer> cnt = new HashMap<>();
        int l = 0, best = -1;
        for (int r = 0; r < s.length(); r++) {
            cnt.merge(s.charAt(r), 1, Integer::sum);
            while (cnt.size() > k) {
                cnt.merge(s.charAt(l), -1, Integer::sum);
                if (cnt.get(s.charAt(l)) == 0) cnt.remove(s.charAt(l));
                l++;
            }
            if (cnt.size() == k) best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;
class Solution {
public:
    int longestKUniques(string s, int k) {
        unordered_map<char,int> cnt;
        int l = 0, best = -1;
        for (int r = 0; r < (int)s.size(); r++) {
            cnt[s[r]]++;
            while ((int)cnt.size() > k) {
                cnt[s[l]]--;
                if (cnt[s[l]] == 0) cnt.erase(s[l]);
                l++;
            }
            if ((int)cnt.size() == k) best = max(best, r - l + 1);
        }
        return best;
    }
};
`,
  },
});

// 66. substrings-with-k-distinct (count subarrays with exactly K distinct)
add({
  id: 'substrings-with-k-distinct',
  method_name: 'subarraysWithKDistinct',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'At-most-K decomposition',
  description: '<p>Given an integer array and an integer <code>k</code>, return the number of contiguous subarrays containing exactly <code>k</code> distinct values.</p>',
  hints: [
    'atMost(k) - atMost(k - 1) gives exactly k.',
    'Inside atMost, slide a window keeping distinct count <= k.',
    'Maintain a frequency map for the window.',
    'For each right end, add (r - l + 1) to the running total.',
    'O(n).',
  ],
  test_cases: [
    { inputs: ['[1,2,1,2,3]', '2'], expected: '7' },
    { inputs: ['[1,2,1,3,4]', '3'], expected: '3' },
    { inputs: ['[1,1,1]', '1'], expected: '6' },
    { inputs: ['[1,1,1]', '2'], expected: '0' },
    { inputs: ['[]', '1'], expected: '0' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '1' },
    { inputs: ['[1,2,3,4,5]', '1'], expected: '5' },
    { inputs: ['[1,2]', '1'], expected: '2' },
    { inputs: ['[2,1,2,1,2]', '2'], expected: '10' },
  ],
  editorial_md: `## Intuition
"Exactly k" reduces to "at most k minus at most k - 1" using the at-most-K trick. Inside \`atMost(k)\`, slide a window where the number of distinct values stays at most \`k\`. For each right pointer, every left start in \`[l, r]\` produces a valid subarray ending at \`r\` — that's \`r - l + 1\` of them.

## Approach
1. Helper \`atMost(k)\`: slide \`[l, r]\` with a frequency map \`cnt\`.
2. For each \`r\`:
   - Increment \`cnt[nums[r]]\`.
   - While the number of distinct keys in \`cnt\` exceeds \`k\`, decrement \`cnt[nums[l]]\` and remove it if zero; \`l++\`.
   - Add \`r - l + 1\` to the total.
3. Answer = \`atMost(k) - atMost(k - 1)\`.

The key insight is "every prefix of [l..r] ending at r and starting in [l..r] satisfies the at-most constraint", so the right-end-anchored count is exactly \`r - l + 1\`.

## Complexity
- Time: O(n).
- Space: O(min(n, K)) for the frequency map.`,
  solutions: {
    python: `from collections import defaultdict
class Solution:
    def subarraysWithKDistinct(self, nums, k):
        def at_most(K):
            if K <= 0: return 0
            cnt = defaultdict(int); distinct = 0; l = 0; total = 0
            for r in range(len(nums)):
                if cnt[nums[r]] == 0: distinct += 1
                cnt[nums[r]] += 1
                while distinct > K:
                    cnt[nums[l]] -= 1
                    if cnt[nums[l]] == 0: distinct -= 1
                    l += 1
                total += r - l + 1
            return total
        return at_most(k) - at_most(k - 1)
`,
    javascript: `class Solution {
    subarraysWithKDistinct(nums, k) {
        const atMost = (K) => {
            if (K <= 0) return 0;
            const cnt = new Map();
            let distinct = 0, l = 0, total = 0;
            for (let r = 0; r < nums.length; r++) {
                if (!cnt.get(nums[r])) distinct++;
                cnt.set(nums[r], (cnt.get(nums[r]) || 0) + 1);
                while (distinct > K) {
                    cnt.set(nums[l], cnt.get(nums[l]) - 1);
                    if (cnt.get(nums[l]) === 0) distinct--;
                    l++;
                }
                total += r - l + 1;
            }
            return total;
        };
        return atMost(k) - atMost(k - 1);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int subarraysWithKDistinct(int[] nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }
    private int atMost(int[] nums, int K) {
        if (K <= 0) return 0;
        Map<Integer, Integer> cnt = new HashMap<>();
        int distinct = 0, l = 0, total = 0;
        for (int r = 0; r < nums.length; r++) {
            if (cnt.getOrDefault(nums[r], 0) == 0) distinct++;
            cnt.merge(nums[r], 1, Integer::sum);
            while (distinct > K) {
                cnt.merge(nums[l], -1, Integer::sum);
                if (cnt.get(nums[l]) == 0) distinct--;
                l++;
            }
            total += r - l + 1;
        }
        return total;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;
class Solution {
public:
    int subarraysWithKDistinct(vector<int>& nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }
private:
    int atMost(vector<int>& nums, int K) {
        if (K <= 0) return 0;
        unordered_map<int,int> cnt;
        int distinct = 0, l = 0, total = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            if (cnt[nums[r]] == 0) distinct++;
            cnt[nums[r]]++;
            while (distinct > K) {
                cnt[nums[l]]--;
                if (cnt[nums[l]] == 0) distinct--;
                l++;
            }
            total += r - l + 1;
        }
        return total;
    }
};
`,
  },
});

// 67. smallest-with-all-characters — minimum window substring (Leetcode 76)
add({
  id: 'smallest-with-all-characters',
  method_name: 'minWindowSubstr',
  params: [{ name: 's', type: 'str' }, { name: 't', type: 'str' }],
  return_type: 'str',
  pattern: 'Sliding window with character demand counter',
  description: '<p>Given strings <code>s</code> and <code>t</code>, return the minimum window substring of <code>s</code> that contains every character of <code>t</code> (including duplicates). If no such substring exists, return the empty string.</p>',
  hints: [
    'Build a demand map from t.',
    'Slide a window over s tracking how many demanded chars are satisfied.',
    'Expand right to cover; contract left while still valid.',
    'Track the smallest valid window.',
    'O(|s| + |t|) time.',
  ],
  test_cases: [
    { inputs: ['"ADOBECODEBANC"', '"ABC"'], expected: '"BANC"' },
    { inputs: ['"a"', '"a"'], expected: '"a"' },
    { inputs: ['"a"', '"aa"'], expected: '""' },
    { inputs: ['"ab"', '"b"'], expected: '"b"' },
    { inputs: ['""', '"a"'], expected: '""' },
    { inputs: ['"abc"', '""'], expected: '""' },
    { inputs: ['"this is a test string"', '"tist"'], expected: '"t stri"' },
    { inputs: ['"aaflslflsldkalskaaa"', '"aaa"'], expected: '"alskaaa"' },
    { inputs: ['"acbbaca"', '"aba"'], expected: '"baca"' },
    { inputs: ['"cabwefgewcwaefgcf"', '"cae"'], expected: '"cwae"' },
  ],
  editorial_md: `## Intuition
A "minimum window substring" question slides a window across \`s\` and tracks the deficit relative to \`t\`. The window is valid when every character demanded by \`t\` is covered. We then contract from the left as far as possible while staying valid, recording the smallest valid window.

## Approach
1. Build \`need\` = frequency map of characters in \`t\`. Let \`required = len(need)\`.
2. \`l = 0\`, \`have = 0\`, \`window = {}\`, \`best = (inf, 0, 0)\`.
3. For each \`r\`:
   - Increment \`window[s[r]]\`.
   - If \`s[r]\` is in \`need\` and \`window[s[r]] == need[s[r]]\`, \`have++\`.
   - While \`have == required\`:
     - Update \`best\` if \`r - l + 1\` is smaller.
     - Decrement \`window[s[l]]\`; if \`s[l]\` is in \`need\` and the count drops below \`need[s[l]]\`, \`have--\`. \`l++\`.
4. Return \`s[best_l : best_l + best_len]\`, or empty string if \`best_len\` is infinite.

Tracking \`have\` (number of fully-satisfied character types) rather than re-checking the whole map keeps each window step O(1).

## Complexity
- Time: O(|s| + |t|).
- Space: O(|t|).`,
  solutions: {
    python: `from collections import Counter, defaultdict
class Solution:
    def minWindowSubstr(self, s, t):
        if not t or not s: return ''
        need = Counter(t)
        required = len(need)
        window = defaultdict(int)
        have = 0; l = 0
        best_len = float('inf'); best_l = 0
        for r, c in enumerate(s):
            window[c] += 1
            if c in need and window[c] == need[c]:
                have += 1
            while have == required:
                if r - l + 1 < best_len:
                    best_len = r - l + 1; best_l = l
                window[s[l]] -= 1
                if s[l] in need and window[s[l]] < need[s[l]]:
                    have -= 1
                l += 1
        return '' if best_len == float('inf') else s[best_l:best_l + best_len]
`,
    javascript: `class Solution {
    minWindowSubstr(s, t) {
        if (!t || !s) return '';
        const need = new Map();
        for (const c of t) need.set(c, (need.get(c) || 0) + 1);
        const required = need.size;
        const window = new Map();
        let have = 0, l = 0, bestLen = Infinity, bestL = 0;
        for (let r = 0; r < s.length; r++) {
            const c = s[r];
            window.set(c, (window.get(c) || 0) + 1);
            if (need.has(c) && window.get(c) === need.get(c)) have++;
            while (have === required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                window.set(s[l], window.get(s[l]) - 1);
                if (need.has(s[l]) && window.get(s[l]) < need.get(s[l])) have--;
                l++;
            }
        }
        return bestLen === Infinity ? '' : s.slice(bestL, bestL + bestLen);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public String minWindowSubstr(String s, String t) {
        if (t.isEmpty() || s.isEmpty()) return "";
        Map<Character,Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
        int required = need.size();
        Map<Character,Integer> window = new HashMap<>();
        int have = 0, l = 0, bestLen = Integer.MAX_VALUE, bestL = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            window.merge(c, 1, Integer::sum);
            if (need.containsKey(c) && window.get(c).intValue() == need.get(c).intValue()) have++;
            while (have == required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                char lc = s.charAt(l);
                window.merge(lc, -1, Integer::sum);
                if (need.containsKey(lc) && window.get(lc) < need.get(lc)) have--;
                l++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
    }
}
`,
    cpp: `#include <string>
#include <unordered_map>
#include <climits>
using namespace std;
class Solution {
public:
    string minWindowSubstr(string s, string t) {
        if (t.empty() || s.empty()) return "";
        unordered_map<char,int> need;
        for (char c : t) need[c]++;
        int required = need.size();
        unordered_map<char,int> window;
        int have = 0, l = 0, bestLen = INT_MAX, bestL = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            char c = s[r];
            window[c]++;
            if (need.count(c) && window[c] == need[c]) have++;
            while (have == required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                window[s[l]]--;
                if (need.count(s[l]) && window[s[l]] < need[s[l]]) have--;
                l++;
            }
        }
        return bestLen == INT_MAX ? "" : s.substr(bestL, bestLen);
    }
};
`,
  },
});

// 68. smallest-distinct — smallest window containing all distinct characters of the string itself
add({
  id: 'smallest-distinct',
  method_name: 'smallestDistinctWindow',
  params: [{ name: 's', type: 'str' }],
  return_type: 'str',
  pattern: 'Sliding window with distinct-target',
  description: '<p>Given a string, find the smallest window in it that contains every distinct character of the string at least once. Return that window.</p>',
  hints: [
    'Determine the set of distinct characters in s. Let that size be n_distinct.',
    'Slide a window with a frequency map.',
    'When the number of distinct chars in window equals n_distinct, shrink from the left.',
    'Track minimum window length.',
    'O(n) time.',
  ],
  test_cases: [
    { inputs: ['"aabcbcdbca"'], expected: '"dbca"' },
    { inputs: ['"aaab"'], expected: '"ab"' },
    { inputs: ['"abc"'], expected: '"abc"' },
    { inputs: ['"a"'], expected: '"a"' },
    { inputs: ['""'], expected: '""' },
    { inputs: ['"aaaaaa"'], expected: '"a"' },
    { inputs: ['"abacacd"'], expected: '"bacd"' },
    { inputs: ['"GEEKSGEEKSFOR"'], expected: '"GEEKSFOR"' },
    { inputs: ['"AABBBCBBAC"'], expected: '"BBAC"' },
    { inputs: ['"abcd"'], expected: '"abcd"' },
  ],
  editorial_md: `## Intuition
We want the smallest substring that holds every distinct character of the input at least once. Step one is to count the distinct characters in the whole string. Step two is a sliding window over the string where we track how many distinct characters are currently covered. Once we cover all of them, shrink the window from the left while still keeping coverage, and record the smallest valid window.

## Approach
1. Build the global distinct set; its size \`required\` is the target.
2. Slide a window with pointers \`l\` and \`r\` and a frequency map \`cnt\`.
3. For each \`r\`:
   - Increment \`cnt[s[r]]\`. If it became 1, \`have++\`.
   - While \`have == required\`:
     - Update the best window if \`r - l + 1\` is smaller.
     - Decrement \`cnt[s[l]]\`; if it drops to 0, \`have--\`. \`l++\`.
4. Return the best window substring, or the empty string if the input itself is empty.

The algorithm is a straightforward specialisation of the minimum-window-substring template where the "target" is "all distinct characters in s".

## Complexity
- Time: O(n).
- Space: O(alphabet).`,
  solutions: {
    python: `class Solution:
    def smallestDistinctWindow(self, s):
        if not s: return ''
        required = len(set(s))
        cnt = {}; have = 0; l = 0
        best_len = float('inf'); best_l = 0
        for r, c in enumerate(s):
            cnt[c] = cnt.get(c, 0) + 1
            if cnt[c] == 1: have += 1
            while have == required:
                if r - l + 1 < best_len:
                    best_len = r - l + 1; best_l = l
                cnt[s[l]] -= 1
                if cnt[s[l]] == 0: have -= 1
                l += 1
        return s[best_l:best_l + best_len]
`,
    javascript: `class Solution {
    smallestDistinctWindow(s) {
        if (!s) return '';
        const required = new Set(s).size;
        const cnt = new Map();
        let have = 0, l = 0, bestLen = Infinity, bestL = 0;
        for (let r = 0; r < s.length; r++) {
            cnt.set(s[r], (cnt.get(s[r]) || 0) + 1);
            if (cnt.get(s[r]) === 1) have++;
            while (have === required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                cnt.set(s[l], cnt.get(s[l]) - 1);
                if (cnt.get(s[l]) === 0) have--;
                l++;
            }
        }
        return s.slice(bestL, bestL + bestLen);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public String smallestDistinctWindow(String s) {
        if (s.isEmpty()) return "";
        Set<Character> distinct = new HashSet<>();
        for (char c : s.toCharArray()) distinct.add(c);
        int required = distinct.size();
        Map<Character,Integer> cnt = new HashMap<>();
        int have = 0, l = 0, bestLen = Integer.MAX_VALUE, bestL = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            cnt.merge(c, 1, Integer::sum);
            if (cnt.get(c) == 1) have++;
            while (have == required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                cnt.merge(s.charAt(l), -1, Integer::sum);
                if (cnt.get(s.charAt(l)) == 0) have--;
                l++;
            }
        }
        return s.substring(bestL, bestL + bestLen);
    }
}
`,
    cpp: `#include <string>
#include <unordered_map>
#include <unordered_set>
#include <climits>
using namespace std;
class Solution {
public:
    string smallestDistinctWindow(string s) {
        if (s.empty()) return "";
        unordered_set<char> distinct(s.begin(), s.end());
        int required = distinct.size();
        unordered_map<char,int> cnt;
        int have = 0, l = 0, bestLen = INT_MAX, bestL = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            cnt[s[r]]++;
            if (cnt[s[r]] == 1) have++;
            while (have == required) {
                if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
                cnt[s[l]]--;
                if (cnt[s[l]] == 0) have--;
                l++;
            }
        }
        return s.substr(bestL, bestLen);
    }
};
`,
  },
});

// 69. full-distinct-subarrays — count subarrays where # distinct == # distinct in whole array (Leetcode 2799)
add({
  id: 'full-distinct-subarrays',
  method_name: 'countCompleteSubarrays',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Sliding window targeting full distinct count',
  description: '<p>Given an integer array, return the number of contiguous subarrays that contain every distinct value of the whole array.</p>',
  hints: [
    'Let D = number of distinct values in the whole array.',
    'Slide a window. When it contains all D distinct values, every extension to the right is also complete.',
    'For each smallest valid window starting at l, the count of complete subarrays starting at l is (n - r) where r is the smallest right index achieving the distinct count.',
    'Equivalent: walk a window, when it just becomes complete, add (n - r) and advance l.',
    'O(n) time.',
  ],
  test_cases: [
    { inputs: ['[1,3,1,2,2]'], expected: '4' },
    { inputs: ['[5,5,5,5]'], expected: '10' },
    { inputs: ['[1,2,3]'], expected: '1' },
    { inputs: ['[1]'], expected: '1' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[1,2,1,2,1]'], expected: '6' },
    { inputs: ['[1,2,3,1,2,3]'], expected: '10' },
    { inputs: ['[1,1,2,2]'], expected: '3' },
    { inputs: ['[1,2,3,4,5]'], expected: '1' },
    { inputs: ['[5,1,5,1,5]'], expected: '6' },
  ],
  editorial_md: `## Intuition
Let \`D\` be the number of distinct values in the whole array. A subarray is "complete" iff it contains all \`D\` distinct values. Sliding a window from the left, when the window first becomes complete at some right index \`r\` for a given left start \`l\`, every extension by adding more elements on the right is also complete — that's \`n - r\` of them. After counting, slide \`l\` forward and continue.

## Approach
1. Compute \`D = number of distinct values in nums\`.
2. \`l = 0\`, \`cnt = {}\`, \`have = 0\`, \`total = 0\`.
3. For each \`r\`:
   - Increment \`cnt[nums[r]]\`. If new, \`have++\`.
   - While \`have == D\`:
     - Add \`n - r\` to \`total\` — all subarrays [l..r], [l..r+1], ..., [l..n-1] are complete (the distinct condition only grows when we add more).
     - Decrement \`cnt[nums[l]]\`; if it hits zero, \`have--\`. \`l++\`.
4. Return \`total\`.

This works because the right side always preserves the distinct property: adding more elements cannot remove any. So once \`[l..r]\` is complete, \`[l..r..k]\` for \`k >= r\` is complete.

## Complexity
- Time: O(n).
- Space: O(D).`,
  solutions: {
    python: `from collections import defaultdict
class Solution:
    def countCompleteSubarrays(self, nums):
        n = len(nums)
        if n == 0: return 0
        D = len(set(nums))
        cnt = defaultdict(int); have = 0; l = 0; total = 0
        for r in range(n):
            if cnt[nums[r]] == 0: have += 1
            cnt[nums[r]] += 1
            while have == D:
                total += n - r
                cnt[nums[l]] -= 1
                if cnt[nums[l]] == 0: have -= 1
                l += 1
        return total
`,
    javascript: `class Solution {
    countCompleteSubarrays(nums) {
        const n = nums.length;
        if (n === 0) return 0;
        const D = new Set(nums).size;
        const cnt = new Map();
        let have = 0, l = 0, total = 0;
        for (let r = 0; r < n; r++) {
            if (!cnt.get(nums[r])) have++;
            cnt.set(nums[r], (cnt.get(nums[r]) || 0) + 1);
            while (have === D) {
                total += n - r;
                cnt.set(nums[l], cnt.get(nums[l]) - 1);
                if (cnt.get(nums[l]) === 0) have--;
                l++;
            }
        }
        return total;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int countCompleteSubarrays(int[] nums) {
        int n = nums.length;
        if (n == 0) return 0;
        Set<Integer> distinct = new HashSet<>();
        for (int x : nums) distinct.add(x);
        int D = distinct.size();
        Map<Integer,Integer> cnt = new HashMap<>();
        int have = 0, l = 0, total = 0;
        for (int r = 0; r < n; r++) {
            if (cnt.getOrDefault(nums[r], 0) == 0) have++;
            cnt.merge(nums[r], 1, Integer::sum);
            while (have == D) {
                total += n - r;
                cnt.merge(nums[l], -1, Integer::sum);
                if (cnt.get(nums[l]) == 0) have--;
                l++;
            }
        }
        return total;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
#include <unordered_set>
using namespace std;
class Solution {
public:
    int countCompleteSubarrays(vector<int>& nums) {
        int n = nums.size();
        if (n == 0) return 0;
        unordered_set<int> distinct(nums.begin(), nums.end());
        int D = distinct.size();
        unordered_map<int,int> cnt;
        int have = 0, l = 0, total = 0;
        for (int r = 0; r < n; r++) {
            if (cnt[nums[r]] == 0) have++;
            cnt[nums[r]]++;
            while (have == D) {
                total += n - r;
                cnt[nums[l]]--;
                if (cnt[nums[l]] == 0) have--;
                l++;
            }
        }
        return total;
    }
};
`,
  },
});

// 70. prefix-sum-array
add({
  id: 'prefix-sum-array',
  method_name: 'prefixSum',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Running cumulative sum',
  description: '<p>Given an integer array, return its prefix-sum array, where the i-th element is the sum of <code>nums[0..i]</code>.</p>',
  hints: [
    'Walk left to right, keeping a running total.',
    'Append the running total at each step.',
    'Equivalent to itertools.accumulate.',
    'O(n) time, O(n) extra for the output.',
    'In place: nums[i] += nums[i-1] for i in 1..n-1.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,4,5]'], expected: '[1,3,6,10,15]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[5]'], expected: '[5]' },
    { inputs: ['[0,0,0]'], expected: '[0,0,0]' },
    { inputs: ['[-1,1,-1,1]'], expected: '[-1,0,-1,0]' },
    { inputs: ['[10,-5,7,3]'], expected: '[10,5,12,15]' },
    { inputs: ['[1,1,1,1,1,1,1,1,1,1]'], expected: '[1,2,3,4,5,6,7,8,9,10]' },
    { inputs: ['[100]'], expected: '[100]' },
    { inputs: ['[-1,-2,-3]'], expected: '[-1,-3,-6]' },
    { inputs: ['[2,4,6,8]'], expected: '[2,6,12,20]' },
  ],
  editorial_md: `## Intuition
The prefix-sum array stores the running total of the input at each index: \`prefix[i] = nums[0] + nums[1] + ... + nums[i]\`. It is the building block of every "range sum in O(1) after O(n) preprocess" trick.

## Approach
1. Allocate an output array of size \`n\`.
2. Initialise \`running = 0\`.
3. For \`i\` from 0 to \`n - 1\`: \`running += nums[i]\`; \`out[i] = running\`.
4. Return \`out\`.

In place: \`nums[i] += nums[i - 1]\` for \`i\` from 1 to \`n - 1\` reuses the input array.

## Complexity
- Time: O(n).
- Space: O(n) for the output, O(1) in place.`,
  solutions: {
    python: `class Solution:
    def prefixSum(self, nums):
        out = []
        run = 0
        for x in nums:
            run += x
            out.append(run)
        return out
`,
    javascript: `class Solution {
    prefixSum(nums) {
        const out = [];
        let run = 0;
        for (const x of nums) { run += x; out.push(run); }
        return out;
    }
}
`,
    java: `class Solution {
    public int[] prefixSum(int[] nums) {
        int[] out = new int[nums.length];
        int run = 0;
        for (int i = 0; i < nums.length; i++) { run += nums[i]; out[i] = run; }
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> prefixSum(vector<int>& nums) {
        vector<int> out;
        int run = 0;
        for (int x : nums) { run += x; out.push_back(run); }
        return out;
    }
};
`,
  },
});

// 71. prefix-sum-on-2d — given matrix, return its 2D prefix sum
add({
  id: 'prefix-sum-on-2d',
  method_name: 'prefixSum2D',
  params: [{ name: 'matrix', type: 'List[List[int]]' }],
  return_type: 'List[List[int]]',
  pattern: '2D prefix sum (inclusion-exclusion)',
  description: '<p>Given an m x n integer matrix, return its 2D prefix-sum matrix where <code>pref[i][j]</code> is the sum of the rectangle from <code>(0, 0)</code> to <code>(i, j)</code> inclusive.</p>',
  hints: [
    'Use the inclusion-exclusion formula: pref[i][j] = matrix[i][j] + pref[i-1][j] + pref[i][j-1] - pref[i-1][j-1].',
    'Treat out-of-bounds neighbours as 0.',
    'Allocate an (m + 1) x (n + 1) array indexed 1..m, 1..n for cleaner indexing.',
    'O(m * n) time and space.',
    'Then any rectangle sum is computable in O(1).',
  ],
  test_cases: [
    { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[1,3,6],[5,12,21],[12,27,45]]' },
    { inputs: ['[[1]]'], expected: '[[1]]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[[1,2],[3,4]]'], expected: '[[1,3],[4,10]]' },
    { inputs: ['[[0,0,0],[0,0,0]]'], expected: '[[0,0,0],[0,0,0]]' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '[[1,2,3],[2,4,6],[3,6,9]]' },
    { inputs: ['[[-1,2],[3,-4]]'], expected: '[[-1,1],[2,0]]' },
    { inputs: ['[[5]]'], expected: '[[5]]' },
    { inputs: ['[[1,2,3,4]]'], expected: '[[1,3,6,10]]' },
    { inputs: ['[[1],[2],[3]]'], expected: '[[1],[3],[6]]' },
  ],
  editorial_md: `## Intuition
A 2D prefix-sum at \`(i, j)\` is the sum of the rectangle from \`(0, 0)\` to \`(i, j)\` inclusive. By inclusion-exclusion, \`pref[i][j] = matrix[i][j] + pref[i-1][j] + pref[i][j-1] - pref[i-1][j-1]\` because the top-left rectangle is counted twice when we add the row above and column to the left.

## Approach
1. If the matrix is empty, return an empty list.
2. Let \`m\` = rows, \`n\` = cols. Allocate \`pref\` of size \`m x n\`.
3. For \`i\` in \`[0, m)\` and \`j\` in \`[0, n)\`:
   - \`pref[i][j] = matrix[i][j]\`.
   - If \`i > 0\`, add \`pref[i-1][j]\`.
   - If \`j > 0\`, add \`pref[i][j-1]\`.
   - If \`i > 0\` and \`j > 0\`, subtract \`pref[i-1][j-1]\`.
4. Return \`pref\`.

With \`pref\` in hand, any rectangle \`((r1, c1), (r2, c2))\` sum is \`pref[r2][c2] - pref[r1-1][c2] - pref[r2][c1-1] + pref[r1-1][c1-1]\` in O(1) — the entire point of building the table.

## Complexity
- Time: O(m * n).
- Space: O(m * n) for the output.`,
  solutions: {
    python: `class Solution:
    def prefixSum2D(self, matrix):
        if not matrix or not matrix[0]: return []
        m, n = len(matrix), len(matrix[0])
        pref = [[0] * n for _ in range(m)]
        for i in range(m):
            for j in range(n):
                s = matrix[i][j]
                if i > 0: s += pref[i-1][j]
                if j > 0: s += pref[i][j-1]
                if i > 0 and j > 0: s -= pref[i-1][j-1]
                pref[i][j] = s
        return pref
`,
    javascript: `class Solution {
    prefixSum2D(matrix) {
        if (!matrix.length || !matrix[0].length) return [];
        const m = matrix.length, n = matrix[0].length;
        const pref = Array.from({length: m}, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
            let s = matrix[i][j];
            if (i > 0) s += pref[i-1][j];
            if (j > 0) s += pref[i][j-1];
            if (i > 0 && j > 0) s -= pref[i-1][j-1];
            pref[i][j] = s;
        }
        return pref;
    }
}
`,
    java: `class Solution {
    public int[][] prefixSum2D(int[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return new int[0][];
        int m = matrix.length, n = matrix[0].length;
        int[][] pref = new int[m][n];
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
            int s = matrix[i][j];
            if (i > 0) s += pref[i-1][j];
            if (j > 0) s += pref[i][j-1];
            if (i > 0 && j > 0) s -= pref[i-1][j-1];
            pref[i][j] = s;
        }
        return pref;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<vector<int>> prefixSum2D(vector<vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return {};
        int m = matrix.size(), n = matrix[0].size();
        vector<vector<int>> pref(m, vector<int>(n, 0));
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) {
            int s = matrix[i][j];
            if (i > 0) s += pref[i-1][j];
            if (j > 0) s += pref[i][j-1];
            if (i > 0 && j > 0) s -= pref[i-1][j-1];
            pref[i][j] = s;
        }
        return pref;
    }
};
`,
  },
});

// 72. range-queries — answer range-sum queries on a 1D array
add({
  id: 'range-queries',
  method_name: 'rangeSumQueries',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'queries', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Prefix-sum lookup',
  description: '<p>Given an integer array and a list of queries <code>[l, r]</code> (0-indexed, inclusive), return a list of range sums — one per query. Preprocess in O(n) so each query answers in O(1).</p>',
  hints: [
    'Build the prefix-sum array p with p[i] = nums[0] + ... + nums[i-1] (length n + 1).',
    'Sum of [l, r] is p[r + 1] - p[l].',
    'O(n) preprocessing, O(1) per query.',
    'Total O(n + Q).',
    'Handle the empty array (no queries) edge case.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '[[0,2],[1,3],[0,4]]'], expected: '[6,9,15]' },
    { inputs: ['[1,2,3,4,5]', '[[2,2]]'], expected: '[3]' },
    { inputs: ['[5]', '[[0,0]]'], expected: '[5]' },
    { inputs: ['[]', '[]'], expected: '[]' },
    { inputs: ['[-1,2,-3,4,-5]', '[[0,4]]'], expected: '[-3]' },
    { inputs: ['[1,1,1,1,1]', '[[0,0],[0,1],[0,2],[0,3],[0,4]]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3]', '[[0,0],[1,1],[2,2]]'], expected: '[1,2,3]' },
    { inputs: ['[10,20,30,40,50]', '[[1,3]]'], expected: '[90]' },
    { inputs: ['[1,2,3,4,5]', '[]'], expected: '[]' },
    { inputs: ['[0,0,0,0]', '[[0,3]]'], expected: '[0]' },
  ],
  editorial_md: `## Intuition
Range-sum queries on a static array reduce to two prefix lookups per query: \`sum[l..r] = prefix[r + 1] - prefix[l]\` where \`prefix\` is the standard prefix-sum array shifted by one for convenient subtraction.

## Approach
1. Build \`prefix\` of size \`n + 1\` with \`prefix[0] = 0\` and \`prefix[i + 1] = prefix[i] + nums[i]\`.
2. For each query \`[l, r]\`, push \`prefix[r + 1] - prefix[l]\` to the output.
3. Return the output list.

The "+1 shift" trick avoids special-casing \`l == 0\` — the subtraction \`prefix[r + 1] - prefix[0]\` is just \`prefix[r + 1]\` because \`prefix[0]\` is 0.

## Complexity
- Time: O(n + Q).
- Space: O(n) for the prefix array, O(Q) for the output.`,
  solutions: {
    python: `class Solution:
    def rangeSumQueries(self, nums, queries):
        n = len(nums)
        prefix = [0] * (n + 1)
        for i in range(n): prefix[i + 1] = prefix[i] + nums[i]
        return [prefix[r + 1] - prefix[l] for l, r in queries]
`,
    javascript: `class Solution {
    rangeSumQueries(nums, queries) {
        const n = nums.length;
        const prefix = new Array(n + 1).fill(0);
        for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        return queries.map(([l, r]) => prefix[r + 1] - prefix[l]);
    }
}
`,
    java: `class Solution {
    public int[] rangeSumQueries(int[] nums, int[][] queries) {
        int n = nums.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        int[] out = new int[queries.length];
        for (int i = 0; i < queries.length; i++) out[i] = prefix[queries[i][1] + 1] - prefix[queries[i][0]];
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> rangeSumQueries(vector<int>& nums, vector<vector<int>>& queries) {
        int n = nums.size();
        vector<int> prefix(n + 1, 0);
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        vector<int> out;
        for (auto& q : queries) out.push_back(prefix[q[1] + 1] - prefix[q[0]]);
        return out;
    }
};
`,
  },
});

// 73. equilibrium-index
add({
  id: 'equilibrium-index',
  method_name: 'equilibriumIndex',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Prefix-sum balance',
  description: '<p>Return the smallest index <code>i</code> where the sum of elements to the left of <code>i</code> equals the sum of elements to the right. Return <code>-1</code> if no equilibrium index exists.</p>',
  hints: [
    'Compute the total sum.',
    'Walk left to right maintaining the left sum.',
    'right = total - left - nums[i].',
    'When left == right, return i.',
    'O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[1,7,3,6,5,6]'], expected: '3' },
    { inputs: ['[1,2,3]'], expected: '-1' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[]'], expected: '-1' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[1,2,1]'], expected: '1' },
    { inputs: ['[-7,1,5,2,-4,3,0]'], expected: '3' },
    { inputs: ['[1,2,4,7,0,0]'], expected: '3' },
    { inputs: ['[2,4,6,1,4,2,1]'], expected: '-1' },
    { inputs: ['[10,-10,10,-10]'], expected: '-1' },
  ],
  editorial_md: `## Intuition
For each index \`i\`, the sum to the left is \`left[i]\` and the sum to the right is \`right[i] = total - left[i] - nums[i]\`. Track \`left\` as a running total while walking the array; the first index where \`left == right\` is the answer.

## Approach
1. Compute \`total = sum(nums)\`.
2. Initialise \`left = 0\`.
3. For \`i\` from 0 to \`n - 1\`:
   - \`right = total - left - nums[i]\`.
   - If \`left == right\`, return \`i\`.
   - \`left += nums[i]\`.
4. If the loop finishes, return -1.

No auxiliary array needed; \`left\` is updated in O(1) per step.

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def equilibriumIndex(self, nums):
        total = sum(nums)
        left = 0
        for i, x in enumerate(nums):
            right = total - left - x
            if left == right: return i
            left += x
        return -1
`,
    javascript: `class Solution {
    equilibriumIndex(nums) {
        let total = 0; for (const x of nums) total += x;
        let left = 0;
        for (let i = 0; i < nums.length; i++) {
            const right = total - left - nums[i];
            if (left === right) return i;
            left += nums[i];
        }
        return -1;
    }
}
`,
    java: `class Solution {
    public int equilibriumIndex(int[] nums) {
        long total = 0; for (int x : nums) total += x;
        long left = 0;
        for (int i = 0; i < nums.length; i++) {
            long right = total - left - nums[i];
            if (left == right) return i;
            left += nums[i];
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int equilibriumIndex(vector<int>& nums) {
        long long total = 0; for (int x : nums) total += x;
        long long left = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            long long right = total - left - nums[i];
            if (left == right) return i;
            left += nums[i];
        }
        return -1;
    }
};
`,
  },
});

// 74. mean-of-range
add({
  id: 'mean-of-range',
  method_name: 'meanOfRange',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'queries', type: 'List[List[int]]' }],
  return_type: 'List[int]',
  pattern: 'Prefix-sum + integer division',
  description: '<p>Given an integer array and a list of <code>[l, r]</code> queries, return the integer mean (floor division) of <code>nums[l..r]</code> for each query.</p>',
  hints: [
    'Precompute prefix sums.',
    'Range sum = prefix[r+1] - prefix[l].',
    'Mean = sum / (r - l + 1), using floor division for integers.',
    'Each query answered in O(1).',
    'O(n + Q) total.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '[[0,4]]'], expected: '[3]' },
    { inputs: ['[1,2,3,4,5]', '[[0,1],[2,3]]'], expected: '[1,3]' },
    { inputs: ['[10,20,30]', '[[0,2]]'], expected: '[20]' },
    { inputs: ['[]', '[]'], expected: '[]' },
    { inputs: ['[5]', '[[0,0]]'], expected: '[5]' },
    { inputs: ['[1,1,1,1]', '[[0,3]]'], expected: '[1]' },
    { inputs: ['[2,4,6,8,10]', '[[1,3]]'], expected: '[6]' },
    { inputs: ['[1,2,3]', '[[0,0],[1,1],[2,2]]'], expected: '[1,2,3]' },
    { inputs: ['[100,200,300,400]', '[[0,3],[1,2]]'], expected: '[250,250]' },
    { inputs: ['[-1,-2,-3,-4]', '[[0,3]]'], expected: '[-3]' },
  ],
  editorial_md: `## Intuition
The mean over a contiguous range is just the range sum divided by the range length. Precomputed prefix sums answer each query in O(1) — sum first, divide second.

## Approach
1. Build prefix sums \`prefix\` of size \`n + 1\` with \`prefix[0] = 0\` and \`prefix[i + 1] = prefix[i] + nums[i]\`.
2. For each query \`[l, r]\`:
   - \`s = prefix[r + 1] - prefix[l]\`.
   - \`len = r - l + 1\`.
   - Append \`s // len\` (floor division for integer mean) to the output.
3. Return the output list.

For very large arrays \`s\` may exceed 32 bits; use 64-bit accumulators.

Note: with negative sums, Python's \`//\` rounds toward negative infinity (e.g. -13 // 4 == -4), while C++ / Java integer division truncates toward zero (e.g. -13 / 4 == -3). The solutions below use the truncating convention.

## Complexity
- Time: O(n + Q).
- Space: O(n).`,
  solutions: {
    python: `class Solution:
    def meanOfRange(self, nums, queries):
        n = len(nums)
        prefix = [0] * (n + 1)
        for i in range(n): prefix[i + 1] = prefix[i] + nums[i]
        out = []
        for l, r in queries:
            s = prefix[r + 1] - prefix[l]
            length = r - l + 1
            # Truncating division (same as C++/Java) to keep cross-language parity
            out.append(int(s / length) if s < 0 else s // length)
        return out
`,
    javascript: `class Solution {
    meanOfRange(nums, queries) {
        const n = nums.length;
        const prefix = new Array(n + 1).fill(0);
        for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        return queries.map(([l, r]) => {
            const s = prefix[r + 1] - prefix[l];
            return (s < 0 ? Math.ceil(s / (r - l + 1)) : Math.floor(s / (r - l + 1)));
        });
    }
}
`,
    java: `class Solution {
    public int[] meanOfRange(int[] nums, int[][] queries) {
        int n = nums.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        int[] out = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            long s = prefix[queries[i][1] + 1] - prefix[queries[i][0]];
            int len = queries[i][1] - queries[i][0] + 1;
            out[i] = (int)(s / len);
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> meanOfRange(vector<int>& nums, vector<vector<int>>& queries) {
        int n = nums.size();
        vector<long long> prefix(n + 1, 0);
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        vector<int> out;
        for (auto& q : queries) {
            long long s = prefix[q[1] + 1] - prefix[q[0]];
            int len = q[1] - q[0] + 1;
            out.push_back((int)(s / len));
        }
        return out;
    }
};
`,
  },
});

// 75. split-array — minimum largest subarray sum after splitting into K parts (Leetcode 410)
add({
  id: 'split-array',
  method_name: 'splitArray',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Binary search on answer with greedy feasibility',
  description: '<p>Given an integer array of non-negative numbers and an integer <code>k</code>, split the array into <code>k</code> non-empty contiguous subarrays to minimise the largest subarray sum. Return that minimised largest sum.</p>',
  hints: [
    'Answer space: [max(nums), sum(nums)].',
    'Binary search the answer.',
    'For a candidate cap C, greedily count how many subarrays needed (each sum <= C).',
    'If count <= k, C is feasible — try smaller.',
    'Else need larger cap.',
  ],
  test_cases: [
    { inputs: ['[7,2,5,10,8]', '2'], expected: '18' },
    { inputs: ['[1,2,3,4,5]', '2'], expected: '9' },
    { inputs: ['[1,4,4]', '3'], expected: '4' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '5' },
    { inputs: ['[1,1,1,1]', '1'], expected: '4' },
    { inputs: ['[1,1,1,1]', '4'], expected: '1' },
    { inputs: ['[10,5,13,4,8,4,5,11,14,9,16,10,20,8]', '8'], expected: '25' },
    { inputs: ['[2,3,1,2,4,3]', '5'], expected: '4' },
    { inputs: ['[7,7,7]', '2'], expected: '14' },
  ],
  editorial_md: `## Intuition
We want the minimum possible "largest piece sum" over all ways to split the array into \`k\` contiguous parts. The candidate answers live in \`[max(nums), sum(nums)]\` — any value below the maximum element can't fit a single piece, and the full sum trivially works in one piece. Within that range, feasibility is monotone: if cap \`C\` works, every cap \`> C\` also works. That's the green light for binary search on the answer.

## Approach
1. \`lo = max(nums)\`, \`hi = sum(nums)\`.
2. While \`lo < hi\`:
   - \`mid = (lo + hi) / 2\`.
   - Greedy feasibility: walk \`nums\`, accumulating into the current piece. When adding the next element would exceed \`mid\`, start a new piece. Count the number of pieces.
   - If \`pieces <= k\`, \`mid\` is feasible — \`hi = mid\`.
   - Else \`lo = mid + 1\`.
3. Return \`lo\`.

Greedy is optimal because pushing more weight into the current piece always leaves at least as much room for the next, so any "split earlier" alternative cannot achieve a smaller piece count.

## Complexity
- Time: O(n log(sum)).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def splitArray(self, nums, k):
        def feasible(cap):
            count = 1; cur = 0
            for x in nums:
                if cur + x > cap:
                    count += 1; cur = x
                    if count > k: return False
                else:
                    cur += x
            return count <= k
        lo, hi = max(nums), sum(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if feasible(mid): hi = mid
            else: lo = mid + 1
        return lo
`,
    javascript: `class Solution {
    splitArray(nums, k) {
        const feasible = (cap) => {
            let count = 1, cur = 0;
            for (const x of nums) {
                if (cur + x > cap) { count++; cur = x; if (count > k) return false; }
                else cur += x;
            }
            return count <= k;
        };
        let lo = Math.max(...nums), hi = nums.reduce((a,b)=>a+b,0);
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (feasible(mid)) hi = mid; else lo = mid + 1;
        }
        return lo;
    }
}
`,
    java: `class Solution {
    public int splitArray(int[] nums, int k) {
        long lo = 0, hi = 0;
        for (int x : nums) { lo = Math.max(lo, x); hi += x; }
        while (lo < hi) {
            long mid = (lo + hi) / 2;
            if (feasible(nums, k, mid)) hi = mid; else lo = mid + 1;
        }
        return (int) lo;
    }
    private boolean feasible(int[] nums, int k, long cap) {
        int count = 1; long cur = 0;
        for (int x : nums) {
            if (cur + x > cap) { count++; cur = x; if (count > k) return false; }
            else cur += x;
        }
        return count <= k;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
class Solution {
public:
    int splitArray(vector<int>& nums, int k) {
        long long lo = *max_element(nums.begin(), nums.end());
        long long hi = accumulate(nums.begin(), nums.end(), 0LL);
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (feasible(nums, k, mid)) hi = mid; else lo = mid + 1;
        }
        return (int) lo;
    }
private:
    bool feasible(vector<int>& nums, int k, long long cap) {
        int count = 1; long long cur = 0;
        for (int x : nums) {
            if (cur + x > cap) { count++; cur = x; if (count > k) return false; }
            else cur += x;
        }
        return count <= k;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-02-part6.json', JSON.stringify(entries, null, 2));
console.log('Wrote part6 with ' + entries.length + ' entries.');
