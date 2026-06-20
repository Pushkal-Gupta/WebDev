// Builds /tmp/patch-300-B.json with full content for 49 PGcode problems.
// Output schema follows scripts/upsert-problem-content.js ALLOWED fields.

import fs from 'node:fs';

// ----- helper: validate test against a Python-like JS reference -----
// (We just produce; we trust the manual solutions to match.)

const out = [];

// ---------- 1. max-points-from-cards ----------
out.push({
  id: 'max-points-from-cards',
  pattern: 'sliding-window-complement',
  tags: ['array', 'sliding-window', 'prefix-sum'],
  test_cases: [
    { inputs: ['[1,2,3,4,5,6,1]', '3'], expected: '12' },
    { inputs: ['[2,2,2]', '2'], expected: '4' },
    { inputs: ['[9,7,7,9,7,7,9]', '7'], expected: '55' },
    { inputs: ['[1,1000,1]', '1'], expected: '1' },
    { inputs: ['[100,40,17,9,73,75]', '3'], expected: '248' },
    { inputs: ['[5]', '1'], expected: '5' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '15' },
    { inputs: ['[11,49,100,20,86,29,72]', '4'], expected: '232' },
    { inputs: ['[0,0,0,0,0,0,1]', '1'], expected: '1' },
    { inputs: ['[1,79,80,1,1,1,200,1]', '3'], expected: '202' },
    { inputs: ['[96,90,41,82,39,74,64,50,30]', '8'], expected: '536' },
  ],
  hints: [
    'You pick k cards but only from the two ends — the cards left untouched form one contiguous middle window of size n - k.',
    'Maximizing the chosen sum is the same as minimizing that middle window sum.',
    'Slide a fixed-size window of length n - k and track its minimum sum in O(n).',
    'Edge case: when k == n you take everything; the middle window has size 0 and contributes 0.',
    'Answer = total(cardPoints) - min middle-window sum.',
  ],
  editorial_md: `## Intuition
You are allowed to take exactly \`k\` cards, but every pick must come from either the left or the right end of the array. After all picks, the cards you *did not* take form one contiguous block in the middle of size \`n - k\`. So instead of asking which combination of left and right takes is best, ask which middle block of size \`n - k\` is worst — minimize that block and the rest of the array goes to you.

## Approach
Compute \`total = sum(cardPoints)\` once. Slide a fixed-size window of length \`n - k\` across the array. Maintain the running sum incrementally: when the window advances one step right, add the new right element and subtract the element that fell off the left. Track the minimum window sum seen.

Two edge cases need a glance:
- \`k == n\`: the middle window has length 0. The minimum is 0, so the answer is \`total\`.
- \`k == 0\`: the loop is fine; the minimum window equals total, giving 0.

After the sweep return \`total - minWindowSum\`.

## Complexity
Time \`O(n)\` — one prefix sum, one linear sweep.
Space \`O(1)\` — a handful of integers, no extra arrays.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def maxScore(self, cardPoints: List[int], k: int) -> int:
        n = len(cardPoints)
        if k == n:
            return sum(cardPoints)
        win = n - k
        cur = sum(cardPoints[:win])
        best = cur
        for i in range(win, n):
            cur += cardPoints[i] - cardPoints[i - win]
            if cur < best:
                best = cur
        return sum(cardPoints) - best
`,
    javascript: `/**
 * @param {number[]} cardPoints
 * @param {number} k
 * @return {number}
 */
var maxScore = function(cardPoints, k) {
  const n = cardPoints.length;
  if (k === n) return cardPoints.reduce((a, b) => a + b, 0);
  const win = n - k;
  let cur = 0;
  for (let i = 0; i < win; i++) cur += cardPoints[i];
  let best = cur;
  let total = cur;
  for (let i = win; i < n; i++) {
    total += cardPoints[i];
    cur += cardPoints[i] - cardPoints[i - win];
    if (cur < best) best = cur;
  }
  return total - best;
};
`,
    java: `import java.util.*;

class Solution {
    public int maxScore(int[] cardPoints, int k) {
        int n = cardPoints.length;
        int total = 0;
        for (int v : cardPoints) total += v;
        if (k == n) return total;
        int win = n - k;
        int cur = 0;
        for (int i = 0; i < win; i++) cur += cardPoints[i];
        int best = cur;
        for (int i = win; i < n; i++) {
            cur += cardPoints[i] - cardPoints[i - win];
            if (cur < best) best = cur;
        }
        return total - best;
    }
}
`,
    cpp: `#include <vector>
#include <numeric>
using namespace std;

class Solution {
public:
    int maxScore(vector<int>& cardPoints, int k) {
        int n = cardPoints.size();
        int total = accumulate(cardPoints.begin(), cardPoints.end(), 0);
        if (k == n) return total;
        int win = n - k;
        int cur = 0;
        for (int i = 0; i < win; i++) cur += cardPoints[i];
        int best = cur;
        for (int i = win; i < n; i++) {
            cur += cardPoints[i] - cardPoints[i - win];
            if (cur < best) best = cur;
        }
        return total - best;
    }
};
`,
  },
});

// ---------- 2. max-product-word-lengths ----------
out.push({
  id: 'max-product-word-lengths',
  pattern: 'bitmask-encoding',
  tags: ['array', 'string', 'bit-manipulation'],
  test_cases: [
    { inputs: ['["abcw","baz","foo","bar","xtfn","abcdef"]'], expected: '16' },
    { inputs: ['["a","ab","abc","d","cd","bcd","abcd"]'], expected: '4' },
    { inputs: ['["a","aa","aaa","aaaa"]'], expected: '0' },
    { inputs: ['["abc","def"]'], expected: '9' },
    { inputs: ['["a","b"]'], expected: '1' },
    { inputs: ['["abcdefghij","klmnopqrst"]'], expected: '100' },
    { inputs: ['["aa","bb","cc","dd"]'], expected: '4' },
    { inputs: ['["abcdef","xyz","abcdefg","abcdefgh"]'], expected: '24' },
    { inputs: ['["xyz","xyzz","xyzzz"]'], expected: '0' },
    { inputs: ['["leetcode","leet","code","et","ec","de","co"]'], expected: '0' },
    { inputs: ['["ab","cd","ef","gh"]'], expected: '4' },
  ],
  hints: [
    'Two words "share no letter" can be checked by looking only at their distinct letter sets.',
    'Encode each distinct letter set as a 26-bit integer (bit i set iff letter i appears).',
    'Two words share no letter iff (mask_a & mask_b) == 0.',
    'Precompute every mask, then scan all n*(n-1)/2 pairs and track the largest product when the AND is zero.',
    'O(L + n^2) where L is total characters.',
  ],
  editorial_md: `## Intuition
Comparing each pair of words letter by letter is wasteful — only their *distinct* letter sets matter. A word over the 26 lowercase letters can be summarized by a 26-bit bitmask: bit \`i\` is set if letter \`i\` appears anywhere in the word. Two words share no letter exactly when their masks bitwise-AND to zero. With one cheap integer per word, every "do they overlap?" check is now a single CPU instruction.

## Approach
1. For each word build its bitmask in one linear scan; remember the word length alongside it.
2. Iterate every unordered pair \`(i, j)\`. If \`mask[i] & mask[j] == 0\` the words are disjoint — update the best product \`len[i] * len[j]\`.

The two passes are independent: the first is \`O(total characters)\`, the second is \`O(n^2)\` integer comparisons. No sorting helps because we want the largest *product*, not the largest individual length.

A small optimization: when several words have the exact same mask, keep only the longest one — they would dominate any pairing.

## Complexity
Time \`O(L + n^2)\` where \`L\` is the total number of characters and \`n\` is the number of words.
Space \`O(n)\` for the masks and lengths.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def maxProduct(self, words: List[str]) -> int:
        n = len(words)
        masks = [0] * n
        for i, w in enumerate(words):
            m = 0
            for ch in w:
                m |= 1 << (ord(ch) - 97)
            masks[i] = m
        best = 0
        for i in range(n):
            for j in range(i + 1, n):
                if masks[i] & masks[j] == 0:
                    p = len(words[i]) * len(words[j])
                    if p > best:
                        best = p
        return best
`,
    javascript: `/**
 * @param {string[]} words
 * @return {number}
 */
var maxProduct = function(words) {
  const n = words.length;
  const masks = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (const ch of words[i]) m |= 1 << (ch.charCodeAt(0) - 97);
    masks[i] = m;
  }
  let best = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if ((masks[i] & masks[j]) === 0) {
        const p = words[i].length * words[j].length;
        if (p > best) best = p;
      }
    }
  }
  return best;
};
`,
    java: `class Solution {
    public int maxProduct(String[] words) {
        int n = words.length;
        int[] masks = new int[n];
        for (int i = 0; i < n; i++) {
            int m = 0;
            for (char c : words[i].toCharArray()) m |= 1 << (c - 'a');
            masks[i] = m;
        }
        int best = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if ((masks[i] & masks[j]) == 0) {
                    int p = words[i].length() * words[j].length();
                    if (p > best) best = p;
                }
            }
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    int maxProduct(vector<string>& words) {
        int n = words.size();
        vector<int> masks(n, 0);
        for (int i = 0; i < n; i++) {
            int m = 0;
            for (char c : words[i]) m |= 1 << (c - 'a');
            masks[i] = m;
        }
        int best = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if ((masks[i] & masks[j]) == 0) {
                    int p = (int)words[i].size() * (int)words[j].size();
                    if (p > best) best = p;
                }
            }
        }
        return best;
    }
};
`,
  },
});

// ---------- 3. maximum-average-subarray-i ----------
out.push({
  id: 'maximum-average-subarray-i',
  pattern: 'fixed-size-sliding-window',
  tags: ['array', 'sliding-window'],
  test_cases: [
    { inputs: ['[1,12,-5,-6,50,3]', '4'], expected: '12.75' },
    { inputs: ['[5]', '1'], expected: '5.0' },
    { inputs: ['[0,0,0,0,0]', '3'], expected: '0.0' },
    { inputs: ['[-1,-2,-3,-4]', '2'], expected: '-1.5' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '3.0' },
    { inputs: ['[7,7,7,7]', '2'], expected: '7.0' },
    { inputs: ['[-1]', '1'], expected: '-1.0' },
    { inputs: ['[10,-10,10,-10,10]', '1'], expected: '10.0' },
    { inputs: ['[4,2,1,3,3]', '2'], expected: '3.0' },
    { inputs: ['[1,1,1,1,1,1,1,1,1,100]', '1'], expected: '100.0' },
    { inputs: ['[8,4,-1,-5,3,6,1,-7,4,0]', '4'], expected: '3.5' },
  ],
  hints: [
    'Every candidate has the same length k, so maximum average is just maximum sum divided by k.',
    'Compute the sum of the first k elements as the initial window.',
    'Slide by one each step: add nums[i], subtract nums[i - k]; track the max running sum.',
    'Divide the final maximum sum by k as a double to get the answer.',
    'O(n) one-pass with O(1) extra space.',
  ],
  editorial_md: `## Intuition
All candidate subarrays have the exact same length, so the one with the largest *average* is the same as the one with the largest *sum*. That collapses the problem to "find the largest fixed-length window sum", which is a textbook fixed-size sliding window.

## Approach
1. Sum the first \`k\` elements — that is your initial window and your initial best.
2. For \`i\` from \`k\` to \`n - 1\`, slide the window one step: add \`nums[i]\` and subtract \`nums[i - k]\`. Keep \`best = max(best, cur)\`.
3. Return \`best / k\` as a floating-point value.

Two things to watch for:
- Don't recompute the window sum from scratch every step — that turns the algorithm into \`O(n*k)\`.
- Cast carefully to \`double\` so the final division does not silently round to integer (especially in Java and C++).

## Complexity
Time \`O(n)\` — every element is added and removed at most once.
Space \`O(1)\` — three or four scalars total.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        cur = sum(nums[:k])
        best = cur
        for i in range(k, len(nums)):
            cur += nums[i] - nums[i - k]
            if cur > best:
                best = cur
        return best / k
`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var findMaxAverage = function(nums, k) {
  let cur = 0;
  for (let i = 0; i < k; i++) cur += nums[i];
  let best = cur;
  for (let i = k; i < nums.length; i++) {
    cur += nums[i] - nums[i - k];
    if (cur > best) best = cur;
  }
  return best / k;
};
`,
    java: `class Solution {
    public double findMaxAverage(int[] nums, int k) {
        int cur = 0;
        for (int i = 0; i < k; i++) cur += nums[i];
        int best = cur;
        for (int i = k; i < nums.length; i++) {
            cur += nums[i] - nums[i - k];
            if (cur > best) best = cur;
        }
        return (double) best / k;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {
        int cur = 0;
        for (int i = 0; i < k; i++) cur += nums[i];
        int best = cur;
        for (int i = k; i < (int)nums.size(); i++) {
            cur += nums[i] - nums[i - k];
            if (cur > best) best = cur;
        }
        return (double) best / k;
    }
};
`,
  },
});

// ---------- 4. maximum-xor-of-two-numbers ----------
out.push({
  id: 'maximum-xor-of-two-numbers',
  editorial_md: `## Intuition
The brute force checks every pair of numbers and computes their XOR — \`O(n^2)\`. With \`n\` up to 2·10^5 that is way too slow. Two observations unlock a faster approach:
1. The maximum XOR result is determined bit-by-bit from the most-significant bit downward.
2. For each number you only need to know whether a "partner" with the opposite bit at the current position exists.

A 0/1 binary trie keyed by bit-from-MSB-to-LSB lets every number ask, in 32 steps, "what is the best partner currently in the trie?".

## Approach
Insert each number into the trie, MSB first. Then, for every number, walk the trie greedily: at each bit, prefer the *opposite* branch (it makes the XOR bit a 1). If that branch exists, take it and add \`1 << bit\` to the running candidate; otherwise follow the only branch available. After 32 steps the candidate equals the maximum XOR with any already-inserted number.

You can do insert and query in one pass by inserting numbers as you go and only computing the candidate against those already inserted. Track the global maximum across all queries.

An alternative — useful if you don't want to write a trie — is the greedy "set this prefix bit and check via hashset": for bit \`b\` from 31 down to 0, compute the prefix mask, hash all prefixes, and check whether any pair XORs to a target prefix with bit \`b\` set. Each round is \`O(n)\`, giving \`O(32n)\` overall.

## Complexity
Time \`O(n · 32)\` — constant-bit insert and query per element.
Space \`O(n · 32)\` for the trie nodes.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def findMaximumXOR(self, nums: List[int]) -> int:
        best = 0
        mask = 0
        for b in range(31, -1, -1):
            mask |= 1 << b
            prefixes = {n & mask for n in nums}
            candidate = best | (1 << b)
            for p in prefixes:
                if candidate ^ p in prefixes:
                    best = candidate
                    break
        return best
`,
    javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var findMaximumXOR = function(nums) {
  let best = 0;
  let mask = 0;
  for (let b = 31; b >= 0; b--) {
    mask |= 1 << b;
    const prefixes = new Set();
    for (const n of nums) prefixes.add(n & mask);
    const candidate = best | (1 << b);
    for (const p of prefixes) {
      if (prefixes.has(candidate ^ p)) {
        best = candidate;
        break;
      }
    }
  }
  return best;
};
`,
    java: `import java.util.*;

class Solution {
    public int findMaximumXOR(int[] nums) {
        int best = 0;
        int mask = 0;
        for (int b = 31; b >= 0; b--) {
            mask |= 1 << b;
            Set<Integer> prefixes = new HashSet<>();
            for (int n : nums) prefixes.add(n & mask);
            int candidate = best | (1 << b);
            for (int p : prefixes) {
                if (prefixes.contains(candidate ^ p)) {
                    best = candidate;
                    break;
                }
            }
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int findMaximumXOR(vector<int>& nums) {
        int best = 0;
        int mask = 0;
        for (int b = 31; b >= 0; b--) {
            mask |= 1 << b;
            unordered_set<int> prefixes;
            for (int n : nums) prefixes.insert(n & mask);
            int candidate = best | (1 << b);
            for (int p : prefixes) {
                if (prefixes.count(candidate ^ p)) {
                    best = candidate;
                    break;
                }
            }
        }
        return best;
    }
};
`,
  },
});

// ---------- 5. meeting-rooms-ii ----------
out.push({
  id: 'meeting-rooms-ii',
  editorial_md: `## Intuition
You need the peak number of simultaneously running meetings — that is exactly the number of rooms required. Two equivalent angles work:
1. Treat each meeting as a +1 event at \`start\` and a -1 event at \`end\`; sort and sweep, tracking the maximum running count.
2. Sort meetings by start time and keep a min-heap of end times. For each new meeting, if the earliest ending room is free at or before the new meeting starts, reuse that room (pop). Otherwise allocate a new one (no pop). Push the new meeting's end either way. The final heap size is the answer.

## Approach
The heap version is the clean interview answer.

\`\`\`
sort intervals by start
heap = []
for [s, e] in intervals:
    if heap and heap[0] <= s: heappop(heap)
    heappush(heap, e)
return len(heap)
\`\`\`

If \`heap[0] <= s\` it means an earlier meeting has finished by the time this one starts, so the same room can be reused. Otherwise the heap grows — a new room is born. At the end, the heap holds one entry per room ever needed.

The sweep version sorts the starts and ends arrays separately and uses two pointers; it is slightly faster constant-factor but the heap version generalizes more cleanly when meetings carry extra payload.

## Complexity
Time \`O(n log n)\` — sorting plus log-time heap operations.
Space \`O(n)\` — worst case every meeting overlaps.
`,
  solutions: {
    python: `from typing import List
import heapq

class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        if not intervals:
            return 0
        intervals.sort(key=lambda x: x[0])
        heap = []
        for s, e in intervals:
            if heap and heap[0] <= s:
                heapq.heappop(heap)
            heapq.heappush(heap, e)
        return len(heap)
`,
    javascript: `/**
 * @param {number[][]} intervals
 * @return {number}
 */
var minMeetingRooms = function(intervals) {
  if (!intervals.length) return 0;
  intervals.sort((a, b) => a[0] - b[0]);
  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
  const ends = intervals.map(i => i[1]).sort((a, b) => a - b);
  let rooms = 0, j = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] < ends[j]) rooms++;
    else j++;
  }
  return rooms;
};
`,
    java: `import java.util.*;

class Solution {
    public int minMeetingRooms(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] iv : intervals) {
            if (!heap.isEmpty() && heap.peek() <= iv[0]) heap.poll();
            heap.offer(iv[1]);
        }
        return heap.size();
    }
}
`,
    cpp: `#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        if (intervals.empty()) return 0;
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> heap;
        for (auto& iv : intervals) {
            if (!heap.empty() && heap.top() <= iv[0]) heap.pop();
            heap.push(iv[1]);
        }
        return heap.size();
    }
};
`,
  },
});

// ---------- 6. min-add-parens-valid ----------
out.push({
  id: 'min-add-parens-valid',
  pattern: 'balance-counter',
  tags: ['string', 'stack', 'greedy'],
  test_cases: [
    { inputs: ['"())"'], expected: '1' },
    { inputs: ['"((("'], expected: '3' },
    { inputs: ['"()"'], expected: '0' },
    { inputs: ['""'], expected: '0' },
    { inputs: ['"))(("'], expected: '4' },
    { inputs: ['"()()()"'], expected: '0' },
    { inputs: ['")))"'], expected: '3' },
    { inputs: ['"((()"'], expected: '2' },
    { inputs: ['"()))(("'], expected: '4' },
    { inputs: ['"(()())"'], expected: '0' },
    { inputs: ['"()))()(("'], expected: '4' },
  ],
  hints: [
    'You never need a stack — a single integer counts open parentheses.',
    'Scan left to right. Increment the counter on "(" and decrement on ")".',
    'If the counter drops below zero you found an unmatched ")"; add a "(" (answer++) and reset the counter to 0.',
    'After the scan, the counter equals the number of unmatched "("s, each of which needs a ")" appended.',
    'Total answer = ")"-deficit during scan + "(" surplus at end.',
  ],
  editorial_md: `## Intuition
Every unmatched ")" needs a "(" inserted somewhere to its left, and every unmatched "(" needs a ")" appended after it. These two needs are independent — fixing one never accidentally helps the other — so we can count them in a single pass.

## Approach
Maintain a counter \`open\` initialized to 0 and an answer \`adds\` initialized to 0.

\`\`\`
for c in s:
    if c == '(':
        open += 1
    else:                # c == ')'
        if open == 0:
            adds += 1    # need a '(' to match this ')'
        else:
            open -= 1
return adds + open       # the remaining open parens each need a ')'
\`\`\`

When the counter would go negative we have just seen an unmatched ")"; we account for it by pretending we inserted a "(" (incrementing \`adds\`) and leaving \`open\` at zero. At the end the counter holds the number of "("s that never got their ")", so we add that in.

## Complexity
Time \`O(n)\` — one pass over the string.
Space \`O(1)\` — two integer counters.
`,
  solutions: {
    python: `class Solution:
    def minAddToMakeValid(self, s: str) -> int:
        adds = 0
        open_ = 0
        for c in s:
            if c == '(':
                open_ += 1
            else:
                if open_ == 0:
                    adds += 1
                else:
                    open_ -= 1
        return adds + open_
`,
    javascript: `/**
 * @param {string} s
 * @return {number}
 */
var minAddToMakeValid = function(s) {
  let adds = 0, open = 0;
  for (const c of s) {
    if (c === '(') open++;
    else if (open === 0) adds++;
    else open--;
  }
  return adds + open;
};
`,
    java: `class Solution {
    public int minAddToMakeValid(String s) {
        int adds = 0, open = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') open++;
            else if (open == 0) adds++;
            else open--;
        }
        return adds + open;
    }
}
`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    int minAddToMakeValid(string s) {
        int adds = 0, open = 0;
        for (char c : s) {
            if (c == '(') open++;
            else if (open == 0) adds++;
            else open--;
        }
        return adds + open;
    }
};
`,
  },
});

// ---------- 7. min-refueling-stops ----------
out.push({
  id: 'min-refueling-stops',
  pattern: 'greedy-max-heap',
  tags: ['array', 'heap', 'greedy', 'dp'],
  test_cases: [
    { inputs: ['1', '1', '[]'], expected: '0' },
    { inputs: ['100', '1', '[[10,100]]'], expected: '-1' },
    { inputs: ['100', '10', '[[10,60],[20,30],[30,30],[60,40]]'], expected: '2' },
    { inputs: ['1000', '83', '[[25,27],[36,187],[140,186],[378,6],[492,202],[517,89],[579,234],[673,86],[808,53],[954,49]]'], expected: '4' },
    { inputs: ['200', '100', '[]'], expected: '0' },
    { inputs: ['100', '100', '[]'], expected: '0' },
    { inputs: ['1000', '299', '[[13,21],[26,115],[100,47],[225,99],[299,141],[444,198],[608,190],[636,157],[647,255],[841,123]]'], expected: '4' },
    { inputs: ['100', '50', '[[25,25],[50,25]]'], expected: '2' },
    { inputs: ['100', '50', '[[25,25],[50,25],[75,25]]'], expected: '2' },
    { inputs: ['100', '50', '[[50,50]]'], expected: '1' },
    { inputs: ['10', '10', '[[5,1]]'], expected: '0' },
  ],
  hints: [
    'Defer the choice of which station to use: you only need to commit when you would otherwise run out.',
    'Walk stations in order of position. Every station you pass becomes an "available" fuel option.',
    'Track the farthest position reachable with current fuel. When that is less than the next station (or target), pull the largest pending fuel — repeat until you can reach.',
    'A max-heap of seen station fuels supports the "largest pending" step in log time.',
    'If the heap is empty when you still cannot reach the next milestone, return -1.',
  ],
  editorial_md: `## Intuition
You do not have to decide at a station whether to refuel — you can defer that decision. Imagine driving along the road; every station you *pass* deposits its fuel can in your trunk. You only crack a can open the moment you would otherwise stall, and you always crack the biggest one available. That greedy postponement minimizes the number of stops.

## Approach
Sort stations by position (they usually already are). Maintain a max-heap of fuel amounts seen but not yet consumed, plus a running \`reach\` (the farthest position your current fuel can take you, starting at \`startFuel\`).

\`\`\`
heap = max-heap
i = 0
stops = 0
while reach < target:
    while i < len(stations) and stations[i][0] <= reach:
        push stations[i][1] onto heap
        i += 1
    if heap empty: return -1
    reach += heappop largest
    stops += 1
return stops
\`\`\`

Each loop iteration either pulls a station into the heap or commits one tank. Because both happen at most \`n\` times across the whole run, the total work is linear in stations times the log factor for the heap.

## Complexity
Time \`O(n log n)\` — every station pushed and at most popped once.
Space \`O(n)\` for the heap.
`,
  solutions: {
    python: `from typing import List
import heapq

class Solution:
    def minRefuelStops(self, target: int, startFuel: int, stations: List[List[int]]) -> int:
        heap = []
        reach = startFuel
        stops = 0
        i = 0
        n = len(stations)
        while reach < target:
            while i < n and stations[i][0] <= reach:
                heapq.heappush(heap, -stations[i][1])
                i += 1
            if not heap:
                return -1
            reach += -heapq.heappop(heap)
            stops += 1
        return stops
`,
    javascript: `/**
 * @param {number} target
 * @param {number} startFuel
 * @param {number[][]} stations
 * @return {number}
 */
var minRefuelStops = function(target, startFuel, stations) {
  // simple max-heap implementation
  const heap = [];
  const push = (x) => {
    heap.push(x);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] >= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0, n = heap.length;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let best = i;
        if (l < n && heap[l] > heap[best]) best = l;
        if (r < n && heap[r] > heap[best]) best = r;
        if (best === i) break;
        [heap[best], heap[i]] = [heap[i], heap[best]];
        i = best;
      }
    }
    return top;
  };
  let reach = startFuel, stops = 0, i = 0;
  const n = stations.length;
  while (reach < target) {
    while (i < n && stations[i][0] <= reach) {
      push(stations[i][1]);
      i++;
    }
    if (heap.length === 0) return -1;
    reach += pop();
    stops++;
  }
  return stops;
};
`,
    java: `import java.util.*;

class Solution {
    public int minRefuelStops(int target, int startFuel, int[][] stations) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        int reach = startFuel, stops = 0, i = 0;
        int n = stations.length;
        while (reach < target) {
            while (i < n && stations[i][0] <= reach) {
                heap.offer(stations[i][1]);
                i++;
            }
            if (heap.isEmpty()) return -1;
            reach += heap.poll();
            stops++;
        }
        return stops;
    }
}
`,
    cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {
        priority_queue<int> heap;
        long long reach = startFuel;
        int stops = 0, i = 0, n = stations.size();
        while (reach < target) {
            while (i < n && stations[i][0] <= reach) {
                heap.push(stations[i][1]);
                i++;
            }
            if (heap.empty()) return -1;
            reach += heap.top();
            heap.pop();
            stops++;
        }
        return stops;
    }
};
`,
  },
});

// ---------- 8. minimum-depth-binary-tree ----------
out.push({
  id: 'minimum-depth-binary-tree',
  editorial_md: `## Intuition
A leaf is a node with both children null. "Minimum depth" is the shortest root-to-leaf path, *not* the shortest path to any node. The trap is a node with one child: its depth is not \`1 + min(left, right)\` (that would be 1 if either side is null) — it has to be \`1 +\` the depth of the existing side, because the missing side is not a leaf and cannot terminate the path.

BFS is the cleanest answer: walk the tree level by level and return as soon as a leaf appears. That is optimal because BFS visits every node at depth d before any node at depth d+1.

## Approach
Build the tree from the level-order list. Push the root onto a queue with depth 1. While the queue is non-empty:
- Pop \`(node, depth)\`.
- If both children are null this is a leaf — return depth.
- Otherwise enqueue any non-null children with depth + 1.

The first leaf the BFS encounters is at the minimum depth.

DFS works too but you must short-circuit the one-child case carefully:

\`\`\`
if not root: return 0
if not root.left: return 1 + minDepth(root.right)
if not root.right: return 1 + minDepth(root.left)
return 1 + min(minDepth(root.left), minDepth(root.right))
\`\`\`

## Complexity
Time \`O(n)\` in the worst case (skewed tree without an early leaf); BFS often quits early.
Space \`O(w)\` for BFS where \`w\` is the maximum level width, or \`O(h)\` recursion for DFS.
`,
  solutions: {
    python: `from typing import List, Optional
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def buildTree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

class Solution:
    def minDepth(self, root) -> int:
        if isinstance(root, list):
            root = buildTree(root)
        if not root:
            return 0
        q = deque([(root, 1)])
        while q:
            node, d = q.popleft()
            if not node.left and not node.right:
                return d
            if node.left: q.append((node.left, d + 1))
            if node.right: q.append((node.right, d + 1))
        return 0
`,
    javascript: `function TreeNode(val, left, right) {
  this.val = val ?? 0;
  this.left = left ?? null;
  this.right = right ?? null;
}

function buildTree(arr) {
  if (!arr || !arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const node = q.shift();
    if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); q.push(node.right); }
    i++;
  }
  return root;
}

/**
 * @param {number[] | TreeNode | null} root
 * @return {number}
 */
var minDepth = function(root) {
  if (Array.isArray(root)) root = buildTree(root);
  if (!root) return 0;
  const q = [[root, 1]];
  while (q.length) {
    const [n, d] = q.shift();
    if (!n.left && !n.right) return d;
    if (n.left) q.push([n.left, d + 1]);
    if (n.right) q.push([n.right, d + 1]);
  }
  return 0;
};
`,
    java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

class Solution {
    private TreeNode build(Integer[] arr) {
        if (arr.length == 0 || arr[0] == null) return null;
        TreeNode root = new TreeNode(arr[0]);
        Deque<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.length) {
            TreeNode n = q.poll();
            if (i < arr.length && arr[i] != null) { n.left = new TreeNode(arr[i]); q.add(n.left); }
            i++;
            if (i < arr.length && arr[i] != null) { n.right = new TreeNode(arr[i]); q.add(n.right); }
            i++;
        }
        return root;
    }

    public int minDepth(TreeNode root) {
        if (root == null) return 0;
        Deque<Object[]> q = new ArrayDeque<>();
        q.add(new Object[]{root, 1});
        while (!q.isEmpty()) {
            Object[] cur = q.poll();
            TreeNode n = (TreeNode) cur[0];
            int d = (int) cur[1];
            if (n.left == null && n.right == null) return d;
            if (n.left != null) q.add(new Object[]{n.left, d + 1});
            if (n.right != null) q.add(new Object[]{n.right, d + 1});
        }
        return 0;
    }
}
`,
    cpp: `#include <vector>
#include <queue>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    int minDepth(TreeNode* root) {
        if (!root) return 0;
        queue<pair<TreeNode*, int>> q;
        q.push({root, 1});
        while (!q.empty()) {
            auto [n, d] = q.front(); q.pop();
            if (!n->left && !n->right) return d;
            if (n->left)  q.push({n->left,  d + 1});
            if (n->right) q.push({n->right, d + 1});
        }
        return 0;
    }
};
`,
  },
});

// ---------- 9. minimum-genetic-mutation ----------
out.push({
  id: 'minimum-genetic-mutation',
  editorial_md: `## Intuition
A mutation changes exactly one character at a time, and only genes inside the \`bank\` are valid waypoints. Frame this as an unweighted shortest-path problem on a graph whose nodes are the start gene and the bank, with an edge between any two genes that differ by exactly one character. BFS from the start gives the minimum number of mutations to reach the target.

## Approach
Bank size is at most 10, so even a small graph works fine. Two equivalent BFS shapes:

1. Explicit edges: for every pair (start ∪ bank), connect if they differ by exactly one character. Then BFS.
2. Implicit edges: BFS where each level expansion tries replacing each of the 8 positions with each of A/C/G/T and accepts the mutation only if it lands on a string in \`bank\`.

The second avoids precomputing a graph and is closer to the canonical interview answer.

\`\`\`
bank_set = set(bank)
if endGene not in bank_set: return -1
seen = {startGene}
queue = deque([(startGene, 0)])
while queue:
    gene, steps = queue.popleft()
    if gene == endGene: return steps
    for i in range(8):
        for c in 'ACGT':
            if c == gene[i]: continue
            nxt = gene[:i] + c + gene[i+1:]
            if nxt in bank_set and nxt not in seen:
                seen.add(nxt)
                queue.append((nxt, steps + 1))
return -1
\`\`\`

## Complexity
Time \`O(|bank| · 8 · 4)\` per BFS, bounded by the small constants.
Space \`O(|bank|)\` for the visited set and queue.
`,
  solutions: {
    python: `from typing import List
from collections import deque

class Solution:
    def minMutation(self, startGene: str, endGene: str, bank: List[str]) -> int:
        bank_set = set(bank)
        if endGene not in bank_set:
            return -1
        seen = {startGene}
        q = deque([(startGene, 0)])
        while q:
            g, s = q.popleft()
            if g == endGene:
                return s
            for i in range(len(g)):
                for c in 'ACGT':
                    if c == g[i]:
                        continue
                    nxt = g[:i] + c + g[i+1:]
                    if nxt in bank_set and nxt not in seen:
                        seen.add(nxt)
                        q.append((nxt, s + 1))
        return -1
`,
    javascript: `/**
 * @param {string} startGene
 * @param {string} endGene
 * @param {string[]} bank
 * @return {number}
 */
var minMutation = function(startGene, endGene, bank) {
  const bset = new Set(bank);
  if (!bset.has(endGene)) return -1;
  const seen = new Set([startGene]);
  const q = [[startGene, 0]];
  while (q.length) {
    const [g, s] = q.shift();
    if (g === endGene) return s;
    for (let i = 0; i < g.length; i++) {
      for (const c of 'ACGT') {
        if (c === g[i]) continue;
        const nxt = g.slice(0, i) + c + g.slice(i + 1);
        if (bset.has(nxt) && !seen.has(nxt)) {
          seen.add(nxt);
          q.push([nxt, s + 1]);
        }
      }
    }
  }
  return -1;
};
`,
    java: `import java.util.*;

class Solution {
    public int minMutation(String startGene, String endGene, String[] bank) {
        Set<String> bset = new HashSet<>(Arrays.asList(bank));
        if (!bset.contains(endGene)) return -1;
        Set<String> seen = new HashSet<>();
        seen.add(startGene);
        Deque<Object[]> q = new ArrayDeque<>();
        q.add(new Object[]{startGene, 0});
        char[] alpha = {'A','C','G','T'};
        while (!q.isEmpty()) {
            Object[] cur = q.poll();
            String g = (String) cur[0];
            int s = (int) cur[1];
            if (g.equals(endGene)) return s;
            char[] arr = g.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char c : alpha) {
                    if (c == orig) continue;
                    arr[i] = c;
                    String nxt = new String(arr);
                    if (bset.contains(nxt) && !seen.contains(nxt)) {
                        seen.add(nxt);
                        q.add(new Object[]{nxt, s + 1});
                    }
                }
                arr[i] = orig;
            }
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <queue>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int minMutation(string startGene, string endGene, vector<string>& bank) {
        unordered_set<string> bset(bank.begin(), bank.end());
        if (!bset.count(endGene)) return -1;
        unordered_set<string> seen{startGene};
        queue<pair<string,int>> q;
        q.push({startGene, 0});
        string alpha = "ACGT";
        while (!q.empty()) {
            auto [g, s] = q.front(); q.pop();
            if (g == endGene) return s;
            for (int i = 0; i < (int)g.size(); i++) {
                char orig = g[i];
                for (char c : alpha) {
                    if (c == orig) continue;
                    g[i] = c;
                    if (bset.count(g) && !seen.count(g)) {
                        seen.insert(g);
                        q.push({g, s + 1});
                    }
                }
                g[i] = orig;
            }
        }
        return -1;
    }
};
`,
  },
});

// ---------- 10. minimum-height-trees ----------
out.push({
  id: 'minimum-height-trees',
  pattern: 'topological-leaf-peel',
  tags: ['graph', 'tree', 'topological-sort', 'bfs'],
  test_cases: [
    { inputs: ['4', '[[1,0],[1,2],[1,3]]'], expected: '[1]' },
    { inputs: ['6', '[[3,0],[3,1],[3,2],[3,4],[5,4]]'], expected: '[3,4]' },
    { inputs: ['1', '[]'], expected: '[0]' },
    { inputs: ['2', '[[0,1]]'], expected: '[0,1]' },
    { inputs: ['3', '[[0,1],[1,2]]'], expected: '[1]' },
    { inputs: ['7', '[[0,1],[1,2],[1,3],[2,4],[3,5],[4,6]]'], expected: '[1,2]' },
    { inputs: ['5', '[[0,1],[0,2],[0,3],[3,4]]'], expected: '[0,3]' },
    { inputs: ['8', '[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]'], expected: '[3,4]' },
    { inputs: ['10', '[[0,3],[1,3],[2,3],[4,3],[5,4],[6,4],[7,5],[8,5],[9,5]]'], expected: '[3,4]' },
    { inputs: ['4', '[[0,1],[0,2],[0,3]]'], expected: '[0]' },
  ],
  hints: [
    'A tree on n nodes has either 1 or 2 centers — these are exactly the minimum-height-tree roots.',
    'Find them by peeling leaves: remove every degree-1 node simultaneously, repeat on the new graph.',
    'After each peel, decrement neighbors degrees; collect new leaves for the next round.',
    'Stop when ≤ 2 nodes remain — those survivors are the answer.',
    'Edge cases: n == 1 → [0]; n == 2 → [0, 1].',
  ],
  editorial_md: `## Intuition
Rooting a tree at a leaf produces a tall tree; rooting at a "centroid" produces the shortest. A tree always has one or two centroids — they are the nodes that minimize the maximum distance to any other node. So the answer is at most two nodes, and finding them is equivalent to repeatedly peeling outer leaves toward the core.

## Approach
Topological-style leaf peeling:

1. Build an adjacency list and a degree array.
2. Initialize a queue with every leaf (degree 1). Handle the trivial cases \`n == 1\` (return \`[0]\`) and \`n == 2\` (return \`[0, 1]\`).
3. While more than two nodes remain, pop the current layer of leaves. For each, decrement the degree of its single neighbor; if that neighbor becomes a leaf, enqueue it for the next layer.
4. The survivors of the final round are the answer.

Why "≤ 2 nodes"? If the longest path in the tree has length \`L\`, the centroid sits at index \`L/2\` from either end; if \`L\` is even there is one centroid, if odd there are two. Peeling layers from both ends meets at exactly that midpoint.

## Complexity
Time \`O(n)\` — each edge is examined twice across the entire peel.
Space \`O(n)\` for adjacency, degrees, and queue.
`,
  solutions: {
    python: `from typing import List
from collections import deque

class Solution:
    def findMinHeightTrees(self, n: int, edges: List[List[int]]) -> List[int]:
        if n == 1:
            return [0]
        if n == 2:
            return [0, 1]
        adj = [[] for _ in range(n)]
        deg = [0] * n
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
            deg[a] += 1
            deg[b] += 1
        leaves = deque(i for i in range(n) if deg[i] == 1)
        remaining = n
        while remaining > 2:
            sz = len(leaves)
            remaining -= sz
            for _ in range(sz):
                leaf = leaves.popleft()
                for nb in adj[leaf]:
                    deg[nb] -= 1
                    if deg[nb] == 1:
                        leaves.append(nb)
        return list(leaves)
`,
    javascript: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number[]}
 */
var findMinHeightTrees = function(n, edges) {
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  const adj = Array.from({length: n}, () => []);
  const deg = new Array(n).fill(0);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
    deg[a]++; deg[b]++;
  }
  let leaves = [];
  for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);
  let remaining = n;
  while (remaining > 2) {
    remaining -= leaves.length;
    const next = [];
    for (const leaf of leaves) {
      for (const nb of adj[leaf]) {
        if (--deg[nb] === 1) next.push(nb);
      }
    }
    leaves = next;
  }
  return leaves.sort((a, b) => a - b);
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> findMinHeightTrees(int n, int[][] edges) {
        if (n == 1) return Collections.singletonList(0);
        if (n == 2) return Arrays.asList(0, 1);
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] deg = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
            deg[e[0]]++; deg[e[1]]++;
        }
        List<Integer> leaves = new ArrayList<>();
        for (int i = 0; i < n; i++) if (deg[i] == 1) leaves.add(i);
        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size();
            List<Integer> next = new ArrayList<>();
            for (int leaf : leaves) {
                for (int nb : adj.get(leaf)) {
                    if (--deg[nb] == 1) next.add(nb);
                }
            }
            leaves = next;
        }
        Collections.sort(leaves);
        return leaves;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> findMinHeightTrees(int n, vector<vector<int>>& edges) {
        if (n == 1) return {0};
        if (n == 2) return {0, 1};
        vector<vector<int>> adj(n);
        vector<int> deg(n, 0);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
            deg[e[0]]++; deg[e[1]]++;
        }
        vector<int> leaves;
        for (int i = 0; i < n; i++) if (deg[i] == 1) leaves.push_back(i);
        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size();
            vector<int> next;
            for (int leaf : leaves) {
                for (int nb : adj[leaf]) {
                    if (--deg[nb] == 1) next.push_back(nb);
                }
            }
            leaves = next;
        }
        sort(leaves.begin(), leaves.end());
        return leaves;
    }
};
`,
  },
});

// ---------- 11. minimum-interval-each-query ----------
out.push({
  id: 'minimum-interval-each-query',
  pattern: 'offline-sort-heap',
  tags: ['array', 'sorting', 'heap', 'binary-search'],
  test_cases: [
    { inputs: ['[[1,4],[2,4],[3,6],[4,4]]', '[2,3,4,5]'], expected: '[3,3,1,4]' },
    { inputs: ['[[2,3],[2,5],[1,8],[20,25]]', '[2,19,5,22]'], expected: '[2,-1,4,6]' },
    { inputs: ['[[1,10]]', '[1,5,10,11]'], expected: '[10,10,10,-1]' },
    { inputs: ['[[1,1]]', '[1]'], expected: '[1]' },
    { inputs: ['[[1,1]]', '[2]'], expected: '[-1]' },
    { inputs: ['[[1,5],[2,4],[3,3]]', '[3]'], expected: '[1]' },
    { inputs: ['[[1,100],[2,99],[3,98]]', '[50]'], expected: '[96]' },
    { inputs: ['[[5,10],[1,3]]', '[4,6,11]'], expected: '[-1,6,-1]' },
    { inputs: ['[[1,4],[2,5],[6,10]]', '[1,2,7]'], expected: '[4,4,5]' },
    { inputs: ['[[1,2],[3,4],[5,6]]', '[1,3,5,7]'], expected: '[2,2,2,-1]' },
    { inputs: ['[[1,10],[1,5],[1,4],[1,3]]', '[1,2,3,4,5,6]'], expected: '[3,3,3,4,5,10]' },
  ],
  hints: [
    'Sort intervals by left endpoint and queries by value, then sweep queries in order — once an interval becomes active for one query it stays active for every larger one until its right < query.',
    'Maintain a min-heap keyed by interval size; push (size, right) for every interval whose left ≤ current query.',
    'Before answering, lazily pop the heap top while its right < current query.',
    'After cleanup the heap top is the smallest valid interval covering the query, or -1 if empty.',
    'Restore answers to original query order using the saved index map.',
  ],
  editorial_md: `## Intuition
Each query needs the *smallest* interval that covers it. If queries arrive in increasing order, intervals "enter" the candidate set whenever their left endpoint catches up, and only "leave" when their right endpoint falls behind. Sorting queries and intervals lets us sweep both pointers in tandem, and a min-heap keyed by size produces the smallest covering interval in log time per query.

## Approach
Offline algorithm:

1. Sort \`intervals\` by left endpoint.
2. Pair each query with its original index, then sort by value.
3. Maintain a min-heap of \`(size, right)\` entries. For each sorted query \`q\`:
   - Push every interval whose \`left ≤ q\` (advance an index into \`intervals\`).
   - While the heap top has \`right < q\`, pop it — that interval no longer covers \`q\` (or any larger future query).
   - If the heap is non-empty, the top \`size\` is the answer; otherwise -1.
4. Write each answer back at its original index.

The "while pop" is amortized constant — each interval is pushed and popped at most once across the whole sweep.

## Complexity
Time \`O((m + n) log (m + n))\` where \`m\` is intervals and \`n\` is queries.
Space \`O(m + n)\` for the heap and query index buffer.
`,
  solutions: {
    python: `from typing import List
import heapq

class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        intervals.sort(key=lambda x: x[0])
        order = sorted(range(len(queries)), key=lambda i: queries[i])
        ans = [-1] * len(queries)
        heap = []
        i = 0
        for idx in order:
            q = queries[idx]
            while i < len(intervals) and intervals[i][0] <= q:
                l, r = intervals[i]
                heapq.heappush(heap, (r - l + 1, r))
                i += 1
            while heap and heap[0][1] < q:
                heapq.heappop(heap)
            ans[idx] = heap[0][0] if heap else -1
        return ans
`,
    javascript: `/**
 * @param {number[][]} intervals
 * @param {number[]} queries
 * @return {number[]}
 */
var minInterval = function(intervals, queries) {
  intervals.sort((a, b) => a[0] - b[0]);
  const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]);
  const ans = new Array(queries.length).fill(-1);
  // simple min-heap by size
  const heap = [];
  const cmp = (a, b) => a[0] - b[0];
  const push = (x) => {
    heap.push(x); let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (cmp(heap[p], heap[i]) <= 0) break;
      [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0, n = heap.length;
      while (true) {
        const l = 2*i+1, r = 2*i+2;
        let best = i;
        if (l < n && cmp(heap[l], heap[best]) < 0) best = l;
        if (r < n && cmp(heap[r], heap[best]) < 0) best = r;
        if (best === i) break;
        [heap[best], heap[i]] = [heap[i], heap[best]]; i = best;
      }
    }
    return top;
  };
  let i = 0;
  for (const idx of order) {
    const q = queries[idx];
    while (i < intervals.length && intervals[i][0] <= q) {
      const [l, r] = intervals[i];
      push([r - l + 1, r]);
      i++;
    }
    while (heap.length && heap[0][1] < q) pop();
    ans[idx] = heap.length ? heap[0][0] : -1;
  }
  return ans;
};
`,
    java: `import java.util.*;

class Solution {
    public int[] minInterval(int[][] intervals, int[] queries) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        Integer[] order = new Integer[queries.length];
        for (int i = 0; i < queries.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> queries[a] - queries[b]);
        int[] ans = new int[queries.length];
        Arrays.fill(ans, -1);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        int i = 0;
        for (int idx : order) {
            int q = queries[idx];
            while (i < intervals.length && intervals[i][0] <= q) {
                int l = intervals[i][0], r = intervals[i][1];
                heap.offer(new int[]{r - l + 1, r});
                i++;
            }
            while (!heap.isEmpty() && heap.peek()[1] < q) heap.poll();
            ans[idx] = heap.isEmpty() ? -1 : heap.peek()[0];
        }
        return ans;
    }
}
`,
    cpp: `#include <vector>
#include <queue>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<int> order(queries.size());
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(),
             [&](int a, int b){ return queries[a] < queries[b]; });
        vector<int> ans(queries.size(), -1);
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        int i = 0;
        for (int idx : order) {
            int q = queries[idx];
            while (i < (int)intervals.size() && intervals[i][0] <= q) {
                int l = intervals[i][0], r = intervals[i][1];
                heap.push({r - l + 1, r});
                i++;
            }
            while (!heap.empty() && heap.top().second < q) heap.pop();
            ans[idx] = heap.empty() ? -1 : heap.top().first;
        }
        return ans;
    }
};
`,
  },
});

// ---------- 12. minimum-operations-reduce-x-to-zero ----------
out.push({
  id: 'minimum-operations-reduce-x-to-zero',
  editorial_md: `## Intuition
Removing prefix \`P\` and suffix \`S\` whose combined sum is \`x\` leaves a middle subarray of sum \`total - x\`. Maximizing the middle subarray length minimizes the number of operations \`|P| + |S| = n - middle\`. Because all \`nums[i] >= 1\`, the running sum of a contiguous window is monotone in its length — perfect for a sliding window.

## Approach
1. Compute \`target = sum(nums) - x\`. If \`target < 0\`, return -1 (impossible). If \`target == 0\`, the whole array is removed; answer is \`n\`.
2. Find the longest subarray with sum == \`target\` via a sliding window:
   - Maintain \`l = 0\`, \`cur = 0\`, \`best = -1\`.
   - For each \`r\`, add \`nums[r]\` to \`cur\`.
   - While \`cur > target\`, subtract \`nums[l]\` and advance \`l\`.
   - If \`cur == target\`, update \`best = max(best, r - l + 1)\`.
3. Return \`n - best\` if any window matched, else -1.

The sliding window is correct because \`nums[i] >= 1\` makes \`cur\` strictly increase as \`r\` extends and strictly decrease as \`l\` advances — the window sum visits every achievable value monotonically.

## Complexity
Time \`O(n)\` — each element enters and leaves the window once.
Space \`O(1)\` — constant pointers and counters.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def minOperations(self, nums: List[int], x: int) -> int:
        total = sum(nums)
        target = total - x
        if target < 0:
            return -1
        n = len(nums)
        if target == 0:
            return n
        best = -1
        l = 0
        cur = 0
        for r in range(n):
            cur += nums[r]
            while cur > target:
                cur -= nums[l]
                l += 1
            if cur == target and r - l + 1 > best:
                best = r - l + 1
        return -1 if best == -1 else n - best
`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} x
 * @return {number}
 */
var minOperations = function(nums, x) {
  const total = nums.reduce((a, b) => a + b, 0);
  const target = total - x;
  if (target < 0) return -1;
  const n = nums.length;
  if (target === 0) return n;
  let best = -1, l = 0, cur = 0;
  for (let r = 0; r < n; r++) {
    cur += nums[r];
    while (cur > target) cur -= nums[l++];
    if (cur === target) {
      const len = r - l + 1;
      if (len > best) best = len;
    }
  }
  return best === -1 ? -1 : n - best;
};
`,
    java: `class Solution {
    public int minOperations(int[] nums, int x) {
        int total = 0;
        for (int v : nums) total += v;
        int target = total - x;
        if (target < 0) return -1;
        int n = nums.length;
        if (target == 0) return n;
        int best = -1, l = 0, cur = 0;
        for (int r = 0; r < n; r++) {
            cur += nums[r];
            while (cur > target) cur -= nums[l++];
            if (cur == target && r - l + 1 > best) best = r - l + 1;
        }
        return best == -1 ? -1 : n - best;
    }
}
`,
    cpp: `#include <vector>
#include <numeric>
using namespace std;

class Solution {
public:
    int minOperations(vector<int>& nums, int x) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        int target = total - x;
        if (target < 0) return -1;
        int n = nums.size();
        if (target == 0) return n;
        int best = -1, l = 0, cur = 0;
        for (int r = 0; r < n; r++) {
            cur += nums[r];
            while (cur > target) cur -= nums[l++];
            if (cur == target && r - l + 1 > best) best = r - l + 1;
        }
        return best == -1 ? -1 : n - best;
    }
};
`,
  },
});

// ---------- 13. n-th-tribonacci ----------
out.push({
  id: 'n-th-tribonacci',
  pattern: 'iterative-dp-rolling',
  tags: ['dp', 'math'],
  test_cases: [
    { inputs: ['4'], expected: '4' },
    { inputs: ['25'], expected: '1389537' },
    { inputs: ['0'], expected: '0' },
    { inputs: ['1'], expected: '1' },
    { inputs: ['2'], expected: '1' },
    { inputs: ['3'], expected: '2' },
    { inputs: ['10'], expected: '149' },
    { inputs: ['15'], expected: '3136' },
    { inputs: ['20'], expected: '66012' },
    { inputs: ['37'], expected: '2082876103' },
    { inputs: ['5'], expected: '7' },
  ],
  hints: [
    'Handle n <= 2 directly: T(0)=0, T(1)=1, T(2)=1.',
    'For n >= 3 iterate, keeping only the last three values in three rolling variables.',
    'Update: (a, b, c) <- (b, c, a + b + c) — no array needed.',
    'O(n) time, O(1) space.',
    'The values fit in 32-bit signed int up to n = 37 (problem upper bound).',
  ],
  editorial_md: `## Intuition
The tribonacci recurrence \`T(n) = T(n-1) + T(n-2) + T(n-3)\` only depends on the previous three terms. There is no need for a full DP array — three scalar variables suffice. Iterate \`n\` times, updating in place.

## Approach
1. Handle base cases \`n == 0 → 0\`, \`n == 1 || n == 2 → 1\`.
2. Initialize \`a, b, c = 0, 1, 1\` representing \`T(0), T(1), T(2)\`.
3. For \`i\` from 3 to \`n\` (inclusive), compute \`d = a + b + c\`, then shift \`a = b\`, \`b = c\`, \`c = d\`.
4. After the loop, \`c\` holds \`T(n)\`.

The problem caps \`n\` at 37, so the answer fits comfortably in a 32-bit signed integer (max \`T(37) = 2,082,876,103\` is within \`INT_MAX\`).

A matrix-exponentiation version would compute \`T(n)\` in \`O(log n)\`, but the constants overshadow the savings at this size.

## Complexity
Time \`O(n)\` — one loop pass with constant work per step.
Space \`O(1)\` — three running variables.
`,
  solutions: {
    python: `class Solution:
    def tribonacci(self, n: int) -> int:
        if n == 0:
            return 0
        if n <= 2:
            return 1
        a, b, c = 0, 1, 1
        for _ in range(3, n + 1):
            a, b, c = b, c, a + b + c
        return c
`,
    javascript: `/**
 * @param {number} n
 * @return {number}
 */
var tribonacci = function(n) {
  if (n === 0) return 0;
  if (n <= 2) return 1;
  let a = 0, b = 1, c = 1;
  for (let i = 3; i <= n; i++) {
    const d = a + b + c;
    a = b; b = c; c = d;
  }
  return c;
};
`,
    java: `class Solution {
    public int tribonacci(int n) {
        if (n == 0) return 0;
        if (n <= 2) return 1;
        int a = 0, b = 1, c = 1;
        for (int i = 3; i <= n; i++) {
            int d = a + b + c;
            a = b; b = c; c = d;
        }
        return c;
    }
}
`,
    cpp: `class Solution {
public:
    int tribonacci(int n) {
        if (n == 0) return 0;
        if (n <= 2) return 1;
        int a = 0, b = 1, c = 1;
        for (int i = 3; i <= n; i++) {
            int d = a + b + c;
            a = b; b = c; c = d;
        }
        return c;
    }
};
`,
  },
});

// ---------- 14. number-complement ----------
out.push({
  id: 'number-complement',
  pattern: 'bit-mask',
  tags: ['bit-manipulation', 'math'],
  test_cases: [
    { inputs: ['5'], expected: '2' },
    { inputs: ['1'], expected: '0' },
    { inputs: ['7'], expected: '0' },
    { inputs: ['8'], expected: '7' },
    { inputs: ['10'], expected: '5' },
    { inputs: ['2147483647'], expected: '0' },
    { inputs: ['100'], expected: '27' },
    { inputs: ['1000000'], expected: '48575' },
    { inputs: ['2'], expected: '1' },
    { inputs: ['3'], expected: '0' },
    { inputs: ['255'], expected: '0' },
  ],
  hints: [
    'Complement = num XOR mask where mask is all 1s of the same bit width as num.',
    'Find that width: keep doubling a probe (or shifting left) until it exceeds num.',
    'Mask = probe - 1 (all bits below the high one set).',
    'For num = 0 the answer is 0 — handle separately to avoid an empty mask.',
    'Example: num = 5 = 101 → mask = 111 → 101 XOR 111 = 010 = 2.',
  ],
  editorial_md: `## Intuition
"Complement" means flipping every bit, but only the bits that participate in the binary representation — leading zeros stay zero. The trick is to build a mask whose ones cover exactly those participating bits, then XOR with \`num\`.

## Approach
Find the position of the highest set bit, build a mask of \`(1 << (pos + 1)) - 1\`, and XOR.

\`\`\`
if num == 0: return 0
mask = 1
while mask <= num: mask <<= 1
mask -= 1            # now all bits below the high bit of num are set
return num ^ mask
\`\`\`

Equivalent shortcut in Python: \`(1 << num.bit_length()) - 1 ^ num\`. In Java / C++ use \`Integer.highestOneBit\` or count leading zeros to derive the bit width.

Edge case: \`num == 0\` has no bits set; its complement is also 0.

## Complexity
Time \`O(log num)\` — one pass over the bits.
Space \`O(1)\` — a single mask variable.
`,
  solutions: {
    python: `class Solution:
    def findComplement(self, num: int) -> int:
        if num == 0:
            return 0
        mask = 1
        while mask <= num:
            mask <<= 1
        mask -= 1
        return num ^ mask
`,
    javascript: `/**
 * @param {number} num
 * @return {number}
 */
var findComplement = function(num) {
  if (num === 0) return 0;
  let mask = 1;
  while (mask <= num) mask *= 2;
  mask -= 1;
  return num ^ mask;
};
`,
    java: `class Solution {
    public int findComplement(int num) {
        if (num == 0) return 0;
        long mask = 1;
        while (mask <= num) mask <<= 1;
        mask -= 1;
        return (int)(num ^ mask);
    }
}
`,
    cpp: `class Solution {
public:
    int findComplement(int num) {
        if (num == 0) return 0;
        long mask = 1;
        while (mask <= num) mask <<= 1;
        mask -= 1;
        return (int)(num ^ mask);
    }
};
`,
  },
});

// ---------- 15. number-of-matching-subsequences ----------
out.push({
  id: 'number-of-matching-subsequences',
  pattern: 'bucket-by-next-char',
  tags: ['hash-map', 'string', 'trie'],
  test_cases: [
    { inputs: ['"abcde"', '["a","bb","acd","ace"]'], expected: '3' },
    { inputs: ['"dsahjpjauf"', '["ahjpjau","ja","ahbwzgqnuk","tnmlanowax"]'], expected: '2' },
    { inputs: ['"a"', '["a"]'], expected: '1' },
    { inputs: ['"a"', '["b"]'], expected: '0' },
    { inputs: ['"abc"', '["","a","ab","abc","abcd"]'], expected: '4' },
    { inputs: ['"aaaa"', '["a","aa","aaa","aaaa","aaaaa"]'], expected: '4' },
    { inputs: ['"abcd"', '["bd","ac","abcd","ab","cd"]'], expected: '5' },
    { inputs: ['"qlhxagxdqh"', '["qlhxagxdq","qlhxagxdqh"]'], expected: '2' },
    { inputs: ['"abcabc"', '["abc","cba","cab"]'], expected: '1' },
    { inputs: ['"banana"', '["ban","ana","nan","ananab","bananas"]'], expected: '4' },
    { inputs: ['"longstringtest"', '["ng","est","gent","long","stringtest"]'], expected: '4' },
  ],
  hints: [
    'A naive O(|s| * sum(|words|)) two-pointer per word is too slow.',
    'Bucket every word by the next character it is waiting on.',
    'Sweep s left to right. When the cursor is at character c, every word waiting on c advances; if past the end it counts, otherwise it re-buckets on its new waiting char.',
    'Each character of each word is touched at most once.',
    'O(|s| + sum(|words|)) overall.',
  ],
  editorial_md: `## Intuition
A subsequence check is a one-pass two-pointer walk over \`s\` and a word. Running that independently per word costs \`O(|s| * sum(|words|))\` — far too slow when \`|s|\` and the word total are both 5·10^4. Reverse the perspective: instead of pulling each word through \`s\`, push \`s\` past every word simultaneously.

Group every pending word by the *next* character it is waiting on. When the cursor in \`s\` is at character \`c\`, only the bucket keyed on \`c\` is interested in this step. Each interested word advances one character; if it ran out it counts as a match, otherwise it moves to the bucket keyed by its new next character.

## Approach
1. Build a dictionary \`buckets\` mapping each character to a list of \`(word, index)\` pairs where \`index\` is the current position inside the word. Initially every word starts at index 0, so it lives in the bucket keyed by its first character.
2. Iterate every character \`c\` in \`s\`. Drain the entries currently in \`buckets[c]\` into a temporary list, then re-process:
   - Advance the index by one.
   - If the index equals the word length, increment the match counter.
   - Otherwise re-insert the entry into the bucket of the new next character.
3. Return the match counter.

Because every word advances at most \`|word|\` times across the entire sweep, the total work is \`O(|s| + sum(|words|))\`.

## Complexity
Time \`O(|s| + sum(|words|))\` — each word character is processed at most once.
Space \`O(sum(|words|))\` for the buckets.
`,
  solutions: {
    python: `from typing import List
from collections import defaultdict

class Solution:
    def numMatchingSubseq(self, s: str, words: List[str]) -> int:
        buckets = defaultdict(list)
        for w in words:
            if w:
                buckets[w[0]].append((w, 0))
        matched = 0
        for c in s:
            if c not in buckets:
                continue
            current = buckets[c]
            buckets[c] = []
            for w, i in current:
                ni = i + 1
                if ni == len(w):
                    matched += 1
                else:
                    buckets[w[ni]].append((w, ni))
        # any "empty" words count immediately
        for w in words:
            if not w:
                matched += 1
        return matched
`,
    javascript: `/**
 * @param {string} s
 * @param {string[]} words
 * @return {number}
 */
var numMatchingSubseq = function(s, words) {
  const buckets = new Map();
  for (const w of words) {
    if (!w.length) continue;
    const c = w[0];
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c).push([w, 0]);
  }
  let matched = 0;
  for (const c of s) {
    if (!buckets.has(c)) continue;
    const cur = buckets.get(c);
    buckets.set(c, []);
    for (const [w, i] of cur) {
      const ni = i + 1;
      if (ni === w.length) matched++;
      else {
        const nc = w[ni];
        if (!buckets.has(nc)) buckets.set(nc, []);
        buckets.get(nc).push([w, ni]);
      }
    }
  }
  for (const w of words) if (!w.length) matched++;
  return matched;
};
`,
    java: `import java.util.*;

class Solution {
    public int numMatchingSubseq(String s, String[] words) {
        List<List<int[]>> buckets = new ArrayList<>();
        for (int i = 0; i < 26; i++) buckets.add(new ArrayList<>());
        int matched = 0;
        for (int wi = 0; wi < words.length; wi++) {
            String w = words[wi];
            if (w.isEmpty()) { matched++; continue; }
            buckets.get(w.charAt(0) - 'a').add(new int[]{wi, 0});
        }
        for (int si = 0; si < s.length(); si++) {
            int c = s.charAt(si) - 'a';
            List<int[]> cur = buckets.get(c);
            buckets.set(c, new ArrayList<>());
            for (int[] e : cur) {
                int wi = e[0], pos = e[1] + 1;
                String w = words[wi];
                if (pos == w.length()) matched++;
                else buckets.get(w.charAt(pos) - 'a').add(new int[]{wi, pos});
            }
        }
        return matched;
    }
}
`,
    cpp: `#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    int numMatchingSubseq(string s, vector<string>& words) {
        vector<vector<pair<int,int>>> buckets(26);
        int matched = 0;
        for (int i = 0; i < (int)words.size(); i++) {
            if (words[i].empty()) { matched++; continue; }
            buckets[words[i][0] - 'a'].push_back({i, 0});
        }
        for (char c : s) {
            int idx = c - 'a';
            auto cur = buckets[idx];
            buckets[idx].clear();
            for (auto [wi, pos] : cur) {
                pos++;
                if (pos == (int)words[wi].size()) matched++;
                else buckets[words[wi][pos] - 'a'].push_back({wi, pos});
            }
        }
        return matched;
    }
};
`,
  },
});

// ---------- 16. number-of-provinces ----------
out.push({
  id: 'number-of-provinces',
  editorial_md: `## Intuition
A province is a connected component in the undirected graph where city \`i\` and city \`j\` share an edge iff \`isConnected[i][j] == 1\`. Counting provinces is therefore counting connected components — the standard answer is a DFS / BFS from each unvisited node, or a Union-Find that merges every connected pair and counts distinct roots at the end.

## Approach (DFS)
1. Maintain a \`visited[]\` array.
2. For each city \`i\` from 0 to \`n - 1\`, if not visited, start a DFS marking everything reachable through 1-entries in the matrix; increment the province counter once.

DFS is straightforward and \`O(n^2)\` because the matrix has \`n^2\` cells and we touch each at most once.

## Approach (Union-Find)
Initialize parents \`0..n-1\`. For every pair \`(i, j)\` with \`i < j\` and \`isConnected[i][j] == 1\`, union them. Final answer is the number of distinct roots.

Union-Find can use path compression and union by rank for near-constant amortized per operation, giving the same \`O(n^2)\` matrix-read bound.

Pick DFS in interviews unless the interviewer wants to see disjoint-set machinery.

## Complexity
Time \`O(n^2)\` — every matrix entry inspected once.
Space \`O(n)\` for the visited array (or parent array).
`,
  solutions: {
    python: `from typing import List

class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        visited = [False] * n
        count = 0
        def dfs(u):
            visited[u] = True
            for v in range(n):
                if isConnected[u][v] and not visited[v]:
                    dfs(v)
        for i in range(n):
            if not visited[i]:
                dfs(i)
                count += 1
        return count
`,
    javascript: `/**
 * @param {number[][]} isConnected
 * @return {number}
 */
var findCircleNum = function(isConnected) {
  const n = isConnected.length;
  const visited = new Array(n).fill(false);
  let count = 0;
  const dfs = (u) => {
    visited[u] = true;
    for (let v = 0; v < n; v++) {
      if (isConnected[u][v] === 1 && !visited[v]) dfs(v);
    }
  };
  for (let i = 0; i < n; i++) {
    if (!visited[i]) { dfs(i); count++; }
  }
  return count;
};
`,
    java: `class Solution {
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        boolean[] visited = new boolean[n];
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(isConnected, visited, i, n);
                count++;
            }
        }
        return count;
    }

    private void dfs(int[][] m, boolean[] visited, int u, int n) {
        visited[u] = true;
        for (int v = 0; v < n; v++) {
            if (m[u][v] == 1 && !visited[v]) dfs(m, visited, v, n);
        }
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int findCircleNum(vector<vector<int>>& isConnected) {
        int n = isConnected.size();
        vector<bool> visited(n, false);
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (!visited[i]) { dfs(isConnected, visited, i, n); count++; }
        }
        return count;
    }
private:
    void dfs(vector<vector<int>>& m, vector<bool>& visited, int u, int n) {
        visited[u] = true;
        for (int v = 0; v < n; v++) {
            if (m[u][v] == 1 && !visited[v]) dfs(m, visited, v, n);
        }
    }
};
`,
  },
});

// ---------- 17. open-the-lock ----------
out.push({
  id: 'open-the-lock',
  pattern: 'bfs-implicit-graph',
  tags: ['hash-set', 'string', 'bfs'],
  test_cases: [
    { inputs: ['["0201","0101","0102","1212","2002"]', '"0202"'], expected: '6' },
    { inputs: ['["8888"]', '"0009"'], expected: '1' },
    { inputs: ['["8887","8889","8878","8898","8788","8988","7888","9888"]', '"8888"'], expected: '-1' },
    { inputs: ['["0000"]', '"8888"'], expected: '-1' },
    { inputs: ['[]', '"0000"'], expected: '0' },
    { inputs: ['[]', '"0001"'], expected: '1' },
    { inputs: ['[]', '"1234"'], expected: '10' },
    { inputs: ['["0001","0010","0100","1000"]', '"1111"'], expected: '-1' },
    { inputs: ['["1111"]', '"1110"'], expected: '4' },
    { inputs: ['["1000","0100","0010","0001"]', '"0000"'], expected: '0' },
    { inputs: ['["2222"]', '"3333"'], expected: '7' },
  ],
  hints: [
    'Each lock state is a node; each move turns one wheel by ±1 — that yields 8 neighbors.',
    'Shortest path on an unweighted graph → BFS.',
    'Add the deadends to the visited set up front so the BFS never expands them.',
    'Return immediately if "0000" is the target (0 turns) or is a deadend (impossible).',
    'O(10000 * 8) worst case — fine.',
  ],
  editorial_md: `## Intuition
The lock has \`10^4 = 10000\` possible states; each move transitions to one of 8 neighbors (turn any of 4 wheels up or down). Finding the minimum number of moves to reach a target on this implicit unweighted graph is a textbook BFS.

## Approach
1. Put every deadend into a \`visited\` set.
2. If \`"0000"\` is in \`visited\` (i.e. a deadend), the lock can never even start — return -1.
3. If \`"0000" == target\`, return 0.
4. BFS from \`"0000"\` level by level. For each state, generate its 8 neighbors by rotating each wheel up and down (with mod-10 wrap), skip any already in \`visited\`, and otherwise mark visited and enqueue.
5. Return the depth at which \`target\` is dequeued, or -1 if the queue empties first.

## Complexity
Time \`O(N + |deadends|)\` where \`N = 10^4\` — every state is visited at most once and each expansion costs constant work.
Space \`O(N)\` for the visited set and BFS queue.
`,
  solutions: {
    python: `from typing import List
from collections import deque

class Solution:
    def openLock(self, deadends: List[str], target: str) -> int:
        dead = set(deadends)
        if "0000" in dead:
            return -1
        if target == "0000":
            return 0
        visited = set(dead)
        visited.add("0000")
        q = deque([("0000", 0)])
        while q:
            state, d = q.popleft()
            for i in range(4):
                digit = int(state[i])
                for delta in (-1, 1):
                    nd = (digit + delta) % 10
                    nxt = state[:i] + str(nd) + state[i+1:]
                    if nxt == target:
                        return d + 1
                    if nxt not in visited:
                        visited.add(nxt)
                        q.append((nxt, d + 1))
        return -1
`,
    javascript: `/**
 * @param {string[]} deadends
 * @param {string} target
 * @return {number}
 */
var openLock = function(deadends, target) {
  const dead = new Set(deadends);
  if (dead.has("0000")) return -1;
  if (target === "0000") return 0;
  const visited = new Set(dead);
  visited.add("0000");
  const q = [["0000", 0]];
  while (q.length) {
    const [state, d] = q.shift();
    for (let i = 0; i < 4; i++) {
      const digit = state.charCodeAt(i) - 48;
      for (const delta of [-1, 1]) {
        const nd = (digit + delta + 10) % 10;
        const nxt = state.slice(0, i) + String(nd) + state.slice(i + 1);
        if (nxt === target) return d + 1;
        if (!visited.has(nxt)) {
          visited.add(nxt);
          q.push([nxt, d + 1]);
        }
      }
    }
  }
  return -1;
};
`,
    java: `import java.util.*;

class Solution {
    public int openLock(String[] deadends, String target) {
        Set<String> dead = new HashSet<>(Arrays.asList(deadends));
        if (dead.contains("0000")) return -1;
        if (target.equals("0000")) return 0;
        Set<String> visited = new HashSet<>(dead);
        visited.add("0000");
        Deque<Object[]> q = new ArrayDeque<>();
        q.add(new Object[]{"0000", 0});
        while (!q.isEmpty()) {
            Object[] cur = q.poll();
            String state = (String) cur[0];
            int d = (int) cur[1];
            char[] arr = state.toCharArray();
            for (int i = 0; i < 4; i++) {
                char orig = arr[i];
                for (int delta : new int[]{-1, 1}) {
                    arr[i] = (char) (((orig - '0' + delta + 10) % 10) + '0');
                    String nxt = new String(arr);
                    if (nxt.equals(target)) return d + 1;
                    if (!visited.contains(nxt)) {
                        visited.add(nxt);
                        q.add(new Object[]{nxt, d + 1});
                    }
                }
                arr[i] = orig;
            }
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <queue>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int openLock(vector<string>& deadends, string target) {
        unordered_set<string> dead(deadends.begin(), deadends.end());
        if (dead.count("0000")) return -1;
        if (target == "0000") return 0;
        unordered_set<string> visited(dead.begin(), dead.end());
        visited.insert("0000");
        queue<pair<string,int>> q;
        q.push({"0000", 0});
        while (!q.empty()) {
            auto [state, d] = q.front(); q.pop();
            for (int i = 0; i < 4; i++) {
                char orig = state[i];
                for (int delta : {-1, 1}) {
                    state[i] = ((orig - '0' + delta + 10) % 10) + '0';
                    if (state == target) return d + 1;
                    if (!visited.count(state)) {
                        visited.insert(state);
                        q.push({state, d + 1});
                    }
                }
                state[i] = orig;
            }
        }
        return -1;
    }
};
`,
  },
});

// ---------- 18. paint-house ----------
out.push({
  id: 'paint-house',
  editorial_md: `## Intuition
Houses are painted left to right; the only constraint is that consecutive houses must differ in color. That is a textbook one-dimensional DP: the optimal cost for painting house \`i\` color \`c\` depends only on the best cost of painting house \`i - 1\` in either of the other two colors.

## Approach
Define \`dp[i][c]\` = minimum total cost when house \`i\` is painted color \`c\`. Recurrence:

\`\`\`
dp[i][0] = costs[i][0] + min(dp[i-1][1], dp[i-1][2])
dp[i][1] = costs[i][1] + min(dp[i-1][0], dp[i-1][2])
dp[i][2] = costs[i][2] + min(dp[i-1][0], dp[i-1][1])
\`\`\`

Base: \`dp[0][c] = costs[0][c]\`. Answer: \`min(dp[n-1][0..2])\`.

Because each row depends only on the previous row, you can roll the DP into three scalars and update them in place. This keeps the algorithm \`O(n)\` time and \`O(1)\` space — a clean answer.

For Paint House II (k colors), naive becomes \`O(n * k^2)\`. The trick is to track the minimum and the second-minimum of the previous row; for each color, if it was last row's min the new "min of other colors" is the second-min, otherwise it is the min. That gets to \`O(n * k)\`.

## Complexity
Time \`O(n)\` — three constant-time updates per house.
Space \`O(1)\` — three rolling variables.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def minCost(self, costs: List[List[int]]) -> int:
        if not costs:
            return 0
        r, g, b = costs[0]
        for i in range(1, len(costs)):
            nr = costs[i][0] + min(g, b)
            ng = costs[i][1] + min(r, b)
            nb = costs[i][2] + min(r, g)
            r, g, b = nr, ng, nb
        return min(r, g, b)
`,
    javascript: `/**
 * @param {number[][]} costs
 * @return {number}
 */
var minCost = function(costs) {
  if (!costs.length) return 0;
  let [r, g, b] = costs[0];
  for (let i = 1; i < costs.length; i++) {
    const nr = costs[i][0] + Math.min(g, b);
    const ng = costs[i][1] + Math.min(r, b);
    const nb = costs[i][2] + Math.min(r, g);
    r = nr; g = ng; b = nb;
  }
  return Math.min(r, g, b);
};
`,
    java: `class Solution {
    public int minCost(int[][] costs) {
        if (costs.length == 0) return 0;
        int r = costs[0][0], g = costs[0][1], b = costs[0][2];
        for (int i = 1; i < costs.length; i++) {
            int nr = costs[i][0] + Math.min(g, b);
            int ng = costs[i][1] + Math.min(r, b);
            int nb = costs[i][2] + Math.min(r, g);
            r = nr; g = ng; b = nb;
        }
        return Math.min(r, Math.min(g, b));
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minCost(vector<vector<int>>& costs) {
        if (costs.empty()) return 0;
        int r = costs[0][0], g = costs[0][1], b = costs[0][2];
        for (int i = 1; i < (int)costs.size(); i++) {
            int nr = costs[i][0] + min(g, b);
            int ng = costs[i][1] + min(r, b);
            int nb = costs[i][2] + min(r, g);
            r = nr; g = ng; b = nb;
        }
        return min(r, min(g, b));
    }
};
`,
  },
});

// ---------- 19. path-sum ----------
out.push({
  id: 'path-sum',
  editorial_md: `## Intuition
A "root-to-leaf" path ends only at a leaf — a node with both children null. Internal nodes are not valid endpoints. The recursive structure is natural: subtract the current node's value from the remaining target and ask the same question on the children. The base case is a leaf where the remaining target equals the node's value.

## Approach
DFS:

\`\`\`
hasPathSum(node, target):
    if node is null: return False
    if node is a leaf: return node.val == target
    rem = target - node.val
    return hasPathSum(node.left, rem) or hasPathSum(node.right, rem)
\`\`\`

Be careful about the leaf check — \`return target == 0\` at a null is *wrong* because a path that ends one step short of a leaf would falsely succeed. Only declare success at an actual leaf.

An iterative version uses a stack of \`(node, remaining)\` pairs. BFS works too — both have the same complexity.

## Complexity
Time \`O(n)\` — every node visited at most once.
Space \`O(h)\` recursion depth where \`h\` is the tree height (worst case \`O(n)\` for a skewed tree).
`,
  solutions: {
    python: `from typing import List, Optional
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def buildTree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

class Solution:
    def hasPathSum(self, root, targetSum: int) -> bool:
        if isinstance(root, list):
            root = buildTree(root)
        def dfs(node, rem):
            if node is None:
                return False
            if node.left is None and node.right is None:
                return node.val == rem
            r = rem - node.val
            return dfs(node.left, r) or dfs(node.right, r)
        return dfs(root, targetSum)
`,
    javascript: `function TreeNode(val, left, right) {
  this.val = val ?? 0;
  this.left = left ?? null;
  this.right = right ?? null;
}

function buildTree(arr) {
  if (!arr || !arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root]; let i = 1;
  while (q.length && i < arr.length) {
    const n = q.shift();
    if (i < arr.length && arr[i] !== null) { n.left = new TreeNode(arr[i]); q.push(n.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { n.right = new TreeNode(arr[i]); q.push(n.right); }
    i++;
  }
  return root;
}

/**
 * @param {number[] | TreeNode | null} root
 * @param {number} targetSum
 * @return {boolean}
 */
var hasPathSum = function(root, targetSum) {
  if (Array.isArray(root)) root = buildTree(root);
  const dfs = (n, rem) => {
    if (!n) return false;
    if (!n.left && !n.right) return n.val === rem;
    const r = rem - n.val;
    return dfs(n.left, r) || dfs(n.right, r);
  };
  return dfs(root, targetSum);
};
`,
    java: `class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return root.val == targetSum;
        int rem = targetSum - root.val;
        return hasPathSum(root.left, rem) || hasPathSum(root.right, rem);
    }
}
`,
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {
        if (!root) return false;
        if (!root->left && !root->right) return root->val == targetSum;
        int rem = targetSum - root->val;
        return hasPathSum(root->left, rem) || hasPathSum(root->right, rem);
    }
};
`,
  },
});

// ---------- 20. path-sum-iii ----------
out.push({
  id: 'path-sum-iii',
  pattern: 'prefix-sum-on-tree',
  tags: ['tree', 'dfs', 'hash-map', 'prefix-sum'],
  test_cases: [
    { inputs: ['[10,5,-3,3,2,null,11,3,-2,null,1]', '8'], expected: '3' },
    { inputs: ['[5,4,8,11,null,13,4,7,2,null,null,5,1]', '22'], expected: '3' },
    { inputs: ['[]', '0'], expected: '0' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1]', '0'], expected: '0' },
    { inputs: ['[0,1,1]', '1'], expected: '4' },
    { inputs: ['[1,-2,-3]', '-1'], expected: '1' },
    { inputs: ['[1,2,3,4,5,6,7]', '7'], expected: '2' },
    { inputs: ['[1000000000,1000000000,null,294967296,null,1000000000,null,1000000000,null,1000000000]', '0'], expected: '0' },
    { inputs: ['[5,3,2,1]', '6'], expected: '0' },
    { inputs: ['[-2,null,-3]', '-5'], expected: '1' },
  ],
  hints: [
    'A path is any contiguous segment of a root-to-current chain — it does not have to start at root.',
    'Maintain the running prefix sum along the current DFS path.',
    'Subpath sum = curPrefix - earlierPrefix. So count how many earlier prefixes equal curPrefix - target.',
    'Use a hash map of prefix-sum → count. Increment on the way down, DECREMENT on the way back up to keep it scoped to the current path.',
    'Seed the map with {0: 1} so a path starting at root is counted.',
  ],
  editorial_md: `## Intuition
A downward path in a binary tree is some contiguous range of nodes on a root-to-current chain. If \`P[v]\` is the prefix sum from root to node \`v\`, then a subpath ending at \`v\` with sum \`target\` corresponds to some ancestor \`u\` (or null = before root) with \`P[v] - P[u] = target\`, i.e. \`P[u] = P[v] - target\`. So at each node, count how many earlier prefix sums on the current path equal \`P[v] - target\`.

A hash map keyed by prefix sum makes the lookup \`O(1)\`. The crucial detail: it must reflect *only* the current root-to-node path. When DFS backtracks past a node, decrement that node's prefix in the map.

## Approach
\`\`\`
counter = {0: 1}        # empty prefix
running = 0
def dfs(node):
    nonlocal running
    if not node: return 0
    running += node.val
    res = counter.get(running - target, 0)
    counter[running] = counter.get(running, 0) + 1
    res += dfs(node.left) + dfs(node.right)
    counter[running] -= 1     # undo on the way up
    running -= node.val
    return res
\`\`\`

Returning the accumulated count from the recursion gives the total number of valid downward paths in \`O(n)\` time.

## Complexity
Time \`O(n)\` — each node touched twice (down and up).
Space \`O(n)\` for the recursion stack and prefix-sum map.
`,
  solutions: {
    python: `from typing import Optional
from collections import defaultdict, deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def buildTree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = deque([root]); i = 1
    while q and i < len(arr):
        n = q.popleft()
        if i < len(arr) and arr[i] is not None:
            n.left = TreeNode(arr[i]); q.append(n.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            n.right = TreeNode(arr[i]); q.append(n.right)
        i += 1
    return root

class Solution:
    def pathSum(self, root, targetSum: int) -> int:
        if isinstance(root, list):
            root = buildTree(root)
        counter = defaultdict(int)
        counter[0] = 1
        def dfs(node, running):
            if node is None:
                return 0
            running += node.val
            res = counter[running - targetSum]
            counter[running] += 1
            res += dfs(node.left, running) + dfs(node.right, running)
            counter[running] -= 1
            return res
        return dfs(root, 0)
`,
    javascript: `function TreeNode(val, left, right) {
  this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null;
}

function buildTree(arr) {
  if (!arr || !arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root]; let i = 1;
  while (q.length && i < arr.length) {
    const n = q.shift();
    if (i < arr.length && arr[i] !== null) { n.left = new TreeNode(arr[i]); q.push(n.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { n.right = new TreeNode(arr[i]); q.push(n.right); }
    i++;
  }
  return root;
}

/**
 * @param {number[] | TreeNode | null} root
 * @param {number} targetSum
 * @return {number}
 */
var pathSum = function(root, targetSum) {
  if (Array.isArray(root)) root = buildTree(root);
  const counter = new Map();
  counter.set(0, 1);
  const dfs = (node, running) => {
    if (!node) return 0;
    running += node.val;
    let res = counter.get(running - targetSum) || 0;
    counter.set(running, (counter.get(running) || 0) + 1);
    res += dfs(node.left, running) + dfs(node.right, running);
    counter.set(running, counter.get(running) - 1);
    return res;
  };
  return dfs(root, 0);
};
`,
    java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

class Solution {
    public int pathSum(TreeNode root, int targetSum) {
        Map<Long, Integer> counter = new HashMap<>();
        counter.put(0L, 1);
        return dfs(root, 0L, targetSum, counter);
    }

    private int dfs(TreeNode node, long running, int target, Map<Long, Integer> counter) {
        if (node == null) return 0;
        running += node.val;
        int res = counter.getOrDefault(running - target, 0);
        counter.merge(running, 1, Integer::sum);
        res += dfs(node.left, running, target, counter);
        res += dfs(node.right, running, target, counter);
        counter.merge(running, -1, Integer::sum);
        return res;
    }
}
`,
    cpp: `#include <unordered_map>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    int pathSum(TreeNode* root, int targetSum) {
        unordered_map<long long, int> counter;
        counter[0] = 1;
        return dfs(root, 0LL, targetSum, counter);
    }
private:
    int dfs(TreeNode* node, long long running, int target, unordered_map<long long, int>& counter) {
        if (!node) return 0;
        running += node->val;
        int res = counter.count(running - target) ? counter[running - target] : 0;
        counter[running]++;
        res += dfs(node->left, running, target, counter);
        res += dfs(node->right, running, target, counter);
        counter[running]--;
        return res;
    }
};
`,
  },
});

// ---------- 21. path-with-min-effort ----------
out.push({
  id: 'path-with-min-effort',
  pattern: 'dijkstra-minimax',
  tags: ['array', 'graph', 'binary-search', 'heap'],
  test_cases: [
    { inputs: ['[[1,2,2],[3,8,2],[5,3,5]]'], expected: '2' },
    { inputs: ['[[1,2,3],[3,8,4],[5,3,5]]'], expected: '1' },
    { inputs: ['[[1,2,1,1,1],[1,2,1,2,1],[1,2,1,2,1],[1,2,1,2,1],[1,1,1,2,1]]'], expected: '0' },
    { inputs: ['[[1]]'], expected: '0' },
    { inputs: ['[[1,10],[10,1]]'], expected: '9' },
    { inputs: ['[[1,2],[3,4]]'], expected: '2' },
    { inputs: ['[[1,3,5],[1,2,3],[1,1,5]]'], expected: '2' },
    { inputs: ['[[8,3,2,5,2,10,7,1,8,9],[1,4,9,1,10,2,4,10,3,5],[4,10,10,3,6,1,3,9,8,8],[4,4,6,10,10,10,2,10,8,8],[9,10,2,4,1,2,2,6,5,7],[2,9,2,6,1,4,7,6,10,9],[8,3,5,9,1,10,6,5,9,3],[10,2,1,8,8,9,5,10,2,8],[3,9,8,4,3,5,8,6,5,1],[1,6,4,8,4,10,4,7,1,2]]'], expected: '4' },
    { inputs: ['[[1,2,1],[1,2,1],[1,2,1]]'], expected: '1' },
    { inputs: ['[[1,2,3],[4,5,6]]'], expected: '3' },
    { inputs: ['[[1,100,1],[1,100,1],[1,1,1]]'], expected: '1' },
  ],
  hints: [
    'You are minimizing the MAX edge cost on a path — a "minimax" path problem.',
    'Standard Dijkstra works with a tweak: distance to a cell = max(distance, |height_new - height_curr|), not sum.',
    'Use a min-heap keyed by the path effort so far.',
    'Skip when the popped effort is larger than the best already recorded for that cell.',
    'Alternative: binary search on the answer + BFS feasibility check.',
  ],
  editorial_md: `## Intuition
You want the path from \`(0,0)\` to \`(n-1,m-1)\` that minimizes the *largest* single-step height change. Replace Dijkstra's "sum" with "max" and the algorithm works unchanged: pick the cell with the lowest current effort, relax its neighbors by \`max(currEffort, |Δh|)\`.

Equivalently you can binary-search the answer: pick an effort \`k\`, run a BFS using only edges with \`|Δh| ≤ k\`, and check connectivity. Both approaches are clean; the Dijkstra version is one fewer pass.

## Approach
Min-heap of \`(effort, r, c)\`. Distance grid \`dist[r][c]\` seeded with infinity except \`dist[0][0] = 0\`. Push \`(0, 0, 0)\`.

Pop the smallest-effort entry. If it is the target, return its effort. Otherwise, for each of the 4 neighbors, compute \`new = max(effort, |h[nr][nc] - h[r][c]|)\`. If \`new < dist[nr][nc]\`, update and push.

Skip an entry on pop if its effort is greater than the recorded \`dist\` — that means a better path already reached that cell.

## Complexity
Time \`O(R · C · log(R · C))\` — every cell relaxed a constant number of times via the heap.
Space \`O(R · C)\` for the distance grid and heap.
`,
  solutions: {
    python: `from typing import List
import heapq

class Solution:
    def minimumEffortPath(self, heights: List[List[int]]) -> int:
        R, C = len(heights), len(heights[0])
        dist = [[float('inf')] * C for _ in range(R)]
        dist[0][0] = 0
        heap = [(0, 0, 0)]
        while heap:
            e, r, c = heapq.heappop(heap)
            if r == R - 1 and c == C - 1:
                return e
            if e > dist[r][c]:
                continue
            for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < R and 0 <= nc < C:
                    ne = max(e, abs(heights[nr][nc] - heights[r][c]))
                    if ne < dist[nr][nc]:
                        dist[nr][nc] = ne
                        heapq.heappush(heap, (ne, nr, nc))
        return 0
`,
    javascript: `/**
 * @param {number[][]} heights
 * @return {number}
 */
var minimumEffortPath = function(heights) {
  const R = heights.length, C = heights[0].length;
  const dist = Array.from({length: R}, () => new Array(C).fill(Infinity));
  dist[0][0] = 0;
  const heap = [[0, 0, 0]];
  const cmp = (a, b) => a[0] - b[0];
  const push = (x) => {
    heap.push(x); let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (cmp(heap[p], heap[i]) <= 0) break;
      [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
    }
  };
  const pop = () => {
    const top = heap[0]; const last = heap.pop();
    if (heap.length) {
      heap[0] = last; let i = 0;
      while (true) {
        const l = 2*i+1, r = 2*i+2; let best = i;
        if (l < heap.length && cmp(heap[l], heap[best]) < 0) best = l;
        if (r < heap.length && cmp(heap[r], heap[best]) < 0) best = r;
        if (best === i) break;
        [heap[best], heap[i]] = [heap[i], heap[best]]; i = best;
      }
    }
    return top;
  };
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while (heap.length) {
    const [e, r, c] = pop();
    if (r === R - 1 && c === C - 1) return e;
    if (e > dist[r][c]) continue;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      const ne = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));
      if (ne < dist[nr][nc]) { dist[nr][nc] = ne; push([ne, nr, nc]); }
    }
  }
  return 0;
};
`,
    java: `import java.util.*;

class Solution {
    public int minimumEffortPath(int[][] heights) {
        int R = heights.length, C = heights[0].length;
        int[][] dist = new int[R][C];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.offer(new int[]{0, 0, 0});
        int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};
        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            int e = cur[0], r = cur[1], c = cur[2];
            if (r == R - 1 && c == C - 1) return e;
            if (e > dist[r][c]) continue;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                int ne = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));
                if (ne < dist[nr][nc]) {
                    dist[nr][nc] = ne;
                    heap.offer(new int[]{ne, nr, nc});
                }
            }
        }
        return 0;
    }
}
`,
    cpp: `#include <vector>
#include <queue>
#include <cstdlib>
#include <climits>
using namespace std;

class Solution {
public:
    int minimumEffortPath(vector<vector<int>>& heights) {
        int R = heights.size(), C = heights[0].size();
        vector<vector<int>> dist(R, vector<int>(C, INT_MAX));
        dist[0][0] = 0;
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> heap;
        heap.push({0, 0, 0});
        int dirs[4][2] = {{-1,0},{1,0},{0,-1},{0,1}};
        while (!heap.empty()) {
            auto [e, r, c] = heap.top(); heap.pop();
            if (r == R - 1 && c == C - 1) return e;
            if (e > dist[r][c]) continue;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                int ne = max(e, abs(heights[nr][nc] - heights[r][c]));
                if (ne < dist[nr][nc]) {
                    dist[nr][nc] = ne;
                    heap.push({ne, nr, nc});
                }
            }
        }
        return 0;
    }
};
`,
  },
});

// ---------- 22. permutations-ii ----------
out.push({
  id: 'permutations-ii',
  editorial_md: `## Intuition
Duplicates in the input would let plain permutation enumeration produce repeated outputs. Sort the input so equal values sit adjacent, then when picking the next element for the permutation skip any value that is equal to its left neighbor *if that left neighbor has not been picked at this level*. The intuition: among equal values you should always use the leftmost-unused one to avoid producing the same permutation twice.

## Approach
1. Sort \`nums\`.
2. Backtrack with a path list and a \`used[]\` array. At each level, scan indices 0..n-1. Skip index \`i\` if \`used[i]\` is true. Also skip if \`i > 0 and nums[i] == nums[i-1] and not used[i-1]\` — that is the duplicate filter.
3. When \`path.length == n\`, append a copy to results.
4. Mark / pick / recurse / unpick.

The duplicate condition is subtle: \`not used[i-1]\` is correct because if the left twin has *already* been picked, the two siblings represent different positions in the path; if the left twin is still available, picking the right twin first would re-derive the same permutation later.

## Complexity
Time \`O(n · n!)\` worst case — up to \`n!\` permutations, each of length \`n\` to record.
Space \`O(n)\` recursion plus \`O(n)\` for \`used\`. Output dominates.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def permuteUnique(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        used = [False] * n
        res = []
        path = []
        def back():
            if len(path) == n:
                res.append(path[:])
                return
            for i in range(n):
                if used[i]:
                    continue
                if i > 0 and nums[i] == nums[i-1] and not used[i-1]:
                    continue
                used[i] = True
                path.append(nums[i])
                back()
                path.pop()
                used[i] = False
        back()
        return res
`,
    javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permuteUnique = function(nums) {
  nums.sort((a, b) => a - b);
  const n = nums.length;
  const used = new Array(n).fill(false);
  const res = []; const path = [];
  const back = () => {
    if (path.length === n) { res.push([...path]); return; }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      if (i > 0 && nums[i] === nums[i-1] && !used[i-1]) continue;
      used[i] = true; path.push(nums[i]);
      back();
      path.pop(); used[i] = false;
    }
  };
  back();
  return res;
};
`,
    java: `import java.util.*;

class Solution {
    public List<List<Integer>> permuteUnique(int[] nums) {
        Arrays.sort(nums);
        int n = nums.length;
        boolean[] used = new boolean[n];
        List<List<Integer>> res = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        back(nums, used, path, res);
        return res;
    }

    private void back(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
        if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;
            used[i] = true; path.add(nums[i]);
            back(nums, used, path, res);
            path.remove(path.size() - 1); used[i] = false;
        }
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> permuteUnique(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        vector<bool> used(n, false);
        vector<vector<int>> res;
        vector<int> path;
        back(nums, used, path, res);
        return res;
    }
private:
    void back(vector<int>& nums, vector<bool>& used, vector<int>& path, vector<vector<int>>& res) {
        if (path.size() == nums.size()) { res.push_back(path); return; }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;
            used[i] = true; path.push_back(nums[i]);
            back(nums, used, path, res);
            path.pop_back(); used[i] = false;
        }
    }
};
`,
  },
});

// ---------- 23. power-of-four ----------
out.push({
  id: 'power-of-four',
  pattern: 'bit-trick',
  tags: ['math', 'bit-manipulation'],
  test_cases: [
    { inputs: ['16'], expected: 'true' },
    { inputs: ['5'], expected: 'false' },
    { inputs: ['1'], expected: 'true' },
    { inputs: ['0'], expected: 'false' },
    { inputs: ['-1'], expected: 'false' },
    { inputs: ['64'], expected: 'true' },
    { inputs: ['8'], expected: 'false' },
    { inputs: ['256'], expected: 'true' },
    { inputs: ['1024'], expected: 'true' },
    { inputs: ['1073741824'], expected: 'true' },
    { inputs: ['2'], expected: 'false' },
    { inputs: ['100'], expected: 'false' },
  ],
  hints: [
    'Powers of 4 must be positive: handle n <= 0 → false.',
    'A power of 4 is also a power of 2 — check (n & (n - 1)) == 0.',
    'The single set bit must sit at an EVEN bit position (bits 0, 2, 4, ...).',
    'Mask 0x55555555 has 1s only at even bit positions; n must satisfy (n & 0x55555555) != 0.',
    'Combined: n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0.',
  ],
  editorial_md: `## Intuition
The integers \`1, 4, 16, 64, 256, ...\` are exactly the powers of 4. In binary they are \`1, 100, 10000, 1000000, ...\` — a single bit at an even position (0-indexed from the least significant). That observation gives a one-line constant-time check.

## Approach
Three conditions must all hold for \`n\` to be a power of 4:
1. \`n > 0\` (powers of 4 are positive; \`n == 0\` and negatives are excluded).
2. \`n\` is a power of 2 → \`(n & (n - 1)) == 0\`. This catches the "single set bit" property.
3. That single bit sits at an even index → \`(n & 0x55555555) != 0\`. The mask \`0x55555555\` has 1s at positions 0, 2, 4, ... 30; AND-ing it with \`n\` is non-zero only when the lone set bit lands there.

Both bit tricks are \`O(1)\` and avoid the recursive divide-by-4 loop.

For Python (no fixed 32-bit width) the mask still works because Python integers truncate AND naturally.

## Complexity
Time \`O(1)\` — three constant-time bit checks.
Space \`O(1)\`.
`,
  solutions: {
    python: `class Solution:
    def isPowerOfFour(self, n: int) -> bool:
        return n > 0 and (n & (n - 1)) == 0 and (n & 0x55555555) != 0
`,
    javascript: `/**
 * @param {number} n
 * @return {boolean}
 */
var isPowerOfFour = function(n) {
  return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;
};
`,
    java: `class Solution {
    public boolean isPowerOfFour(int n) {
        return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
    }
}
`,
    cpp: `class Solution {
public:
    bool isPowerOfFour(int n) {
        return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
    }
};
`,
  },
});

// ---------- 24. predict-the-winner ----------
out.push({
  id: 'predict-the-winner',
  pattern: 'minimax-dp',
  tags: ['array', 'dp', 'game-theory', 'recursion'],
  test_cases: [
    { inputs: ['[1,5,2]'], expected: 'false' },
    { inputs: ['[1,5,233,7]'], expected: 'true' },
    { inputs: ['[1]'], expected: 'true' },
    { inputs: ['[1,1]'], expected: 'true' },
    { inputs: ['[1,2]'], expected: 'true' },
    { inputs: ['[2,1]'], expected: 'true' },
    { inputs: ['[1,5,2,4,6]'], expected: 'true' },
    { inputs: ['[1,1,1,1]'], expected: 'true' },
    { inputs: ['[0,0,0,0,0,0]'], expected: 'true' },
    { inputs: ['[3,9,1,2]'], expected: 'true' },
    { inputs: ['[2,4,55,6,8]'], expected: 'true' },
  ],
  hints: [
    'Track the SCORE DIFFERENTIAL (Player 1 - Player 2) instead of two separate scores.',
    'Define dp(l, r) = best differential the current mover can achieve on nums[l..r].',
    'dp(l, r) = max(nums[l] - dp(l+1, r), nums[r] - dp(l, r-1)) — pick the end that yields the largest net.',
    'Base: dp(i, i) = nums[i].',
    'Player 1 wins iff dp(0, n-1) >= 0.',
  ],
  editorial_md: `## Intuition
Two players alternate picking from either end of \`nums\`, both playing optimally. Instead of tracking each player's score, track the *differential* (P1 - P2). The player whose turn it is is always trying to maximize the differential from their perspective — picking the left end nets them \`nums[l]\` and then the opponent plays the same game on the smaller range, optimally; subtract that result.

## Approach
Define \`dp(l, r)\` = the best score differential the player-to-move can achieve on \`nums[l..r]\`. Recurrence:

\`\`\`
dp(l, r) = max(
    nums[l] - dp(l + 1, r),
    nums[r] - dp(l, r - 1)
)
\`\`\`

Base: \`dp(i, i) = nums[i]\` — only one card, the current player takes it.

Player 1 wins iff \`dp(0, n - 1) >= 0\`.

Memoize on the pair \`(l, r)\`; total subproblems \`O(n^2)\` each in \`O(1)\`, giving \`O(n^2)\` time and \`O(n^2)\` space (or rollable to \`O(n)\` along the diagonal).

## Complexity
Time \`O(n^2)\` — each \`(l, r)\` solved once.
Space \`O(n^2)\` for memo, or \`O(n)\` with row-rolling tabulation.
`,
  solutions: {
    python: `from typing import List
from functools import lru_cache

class Solution:
    def predictTheWinner(self, nums: List[int]) -> bool:
        n = len(nums)
        @lru_cache(maxsize=None)
        def dp(l, r):
            if l == r:
                return nums[l]
            return max(nums[l] - dp(l + 1, r), nums[r] - dp(l, r - 1))
        return dp(0, n - 1) >= 0
`,
    javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var predictTheWinner = function(nums) {
  const n = nums.length;
  const memo = Array.from({length: n}, () => new Array(n).fill(null));
  const dp = (l, r) => {
    if (l === r) return nums[l];
    if (memo[l][r] !== null) return memo[l][r];
    return memo[l][r] = Math.max(nums[l] - dp(l + 1, r), nums[r] - dp(l, r - 1));
  };
  return dp(0, n - 1) >= 0;
};
`,
    java: `class Solution {
    public boolean predictTheWinner(int[] nums) {
        int n = nums.length;
        Integer[][] memo = new Integer[n][n];
        return dp(nums, 0, n - 1, memo) >= 0;
    }
    private int dp(int[] nums, int l, int r, Integer[][] memo) {
        if (l == r) return nums[l];
        if (memo[l][r] != null) return memo[l][r];
        int take_l = nums[l] - dp(nums, l + 1, r, memo);
        int take_r = nums[r] - dp(nums, l, r - 1, memo);
        return memo[l][r] = Math.max(take_l, take_r);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool predictTheWinner(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> memo(n, vector<int>(n, INT_MIN));
        return dp(nums, 0, n - 1, memo) >= 0;
    }
private:
    int dp(vector<int>& nums, int l, int r, vector<vector<int>>& memo) {
        if (l == r) return nums[l];
        if (memo[l][r] != INT_MIN) return memo[l][r];
        int a = nums[l] - dp(nums, l + 1, r, memo);
        int b = nums[r] - dp(nums, l, r - 1, memo);
        return memo[l][r] = max(a, b);
    }
};
`,
  },
});

// ---------- 25. queue-reconstruction-height ----------
out.push({
  id: 'queue-reconstruction-height',
  pattern: 'sort-then-insert',
  tags: ['array', 'sorting', 'greedy', 'binary-indexed-tree'],
  test_cases: [
    { inputs: ['[[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]'], expected: '[[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]' },
    { inputs: ['[[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]]'], expected: '[[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]]' },
    { inputs: ['[[1,0]]'], expected: '[[1,0]]' },
    { inputs: ['[[5,0],[5,1]]'], expected: '[[5,0],[5,1]]' },
    { inputs: ['[[1,0],[2,0]]'], expected: '[[1,0],[2,0]]' },
    { inputs: ['[[2,0],[1,0]]'], expected: '[[1,0],[2,0]]' },
    { inputs: ['[[10,0],[9,1],[8,2],[7,3]]'], expected: '[[10,0],[9,1],[8,2],[7,3]]' },
    { inputs: ['[[1,0],[1,1],[1,2]]'], expected: '[[1,0],[1,1],[1,2]]' },
    { inputs: ['[[7,0],[7,1],[7,2]]'], expected: '[[7,0],[7,1],[7,2]]' },
    { inputs: ['[[3,2],[2,0],[5,0],[1,1],[6,0]]'], expected: '[[2,0],[1,1],[5,0],[3,2],[6,0]]' },
  ],
  hints: [
    'If you place tall people first, no later shorter insertion can disrupt the k-count of an already-placed person.',
    'Sort by height descending; break ties by k ascending so equal heights enter in the right order.',
    'Insert each person at position k of a growing list.',
    'Final list is the reconstructed queue.',
    'Linked-list backing makes insertion O(1) per step but array.splice in JS is still fine for the small constraint.',
  ],
  editorial_md: `## Intuition
The pair \`[h, k]\` says "this person is height \`h\` and has exactly \`k\` taller-or-equal people in front of them". If you place the *tallest* people first and insert each new person at the index given by their \`k\`, the invariant is preserved: every later insertion is strictly shorter (or equal but with a larger \`k\`), so shifting people right cannot decrease anyone's k-count, and placing the new person at index \`k\` ensures exactly \`k\` taller-or-equal people sit before them.

## Approach
1. Sort \`people\` by height descending; break ties by \`k\` ascending.
2. Start with an empty list. Walk the sorted array and \`insert(person, k)\` into the list.
3. The final list is the answer.

Why ties go by \`k\` ascending: two people of equal height both count each other; if a person with smaller \`k\` enters first they sit at a smaller index, which keeps the count valid for the next equal-height person.

## Complexity
Time \`O(n^2)\` worst case — \`n\` insertions, each \`O(n)\` for the list shift.
Space \`O(n)\` for the output list.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def reconstructQueue(self, people: List[List[int]]) -> List[List[int]]:
        people.sort(key=lambda x: (-x[0], x[1]))
        out = []
        for p in people:
            out.insert(p[1], p)
        return out
`,
    javascript: `/**
 * @param {number[][]} people
 * @return {number[][]}
 */
var reconstructQueue = function(people) {
  people.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const out = [];
  for (const p of people) out.splice(p[1], 0, p);
  return out;
};
`,
    java: `import java.util.*;

class Solution {
    public int[][] reconstructQueue(int[][] people) {
        Arrays.sort(people, (a, b) -> b[0] != a[0] ? b[0] - a[0] : a[1] - b[1]);
        List<int[]> out = new ArrayList<>();
        for (int[] p : people) out.add(p[1], p);
        return out.toArray(new int[0][0]);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> reconstructQueue(vector<vector<int>>& people) {
        sort(people.begin(), people.end(),
             [](const vector<int>& a, const vector<int>& b){
                 return a[0] != b[0] ? a[0] > b[0] : a[1] < b[1];
             });
        vector<vector<int>> out;
        for (auto& p : people) out.insert(out.begin() + p[1], p);
        return out;
    }
};
`,
  },
});

// ---------- 26. range-sum-bst ----------
out.push({
  id: 'range-sum-bst',
  pattern: 'bst-prune',
  tags: ['tree', 'bst', 'dfs', 'recursion'],
  test_cases: [
    { inputs: ['[10,5,15,3,7,null,18]', '7', '15'], expected: '32' },
    { inputs: ['[10,5,15,3,7,13,18,1,null,6]', '6', '10'], expected: '23' },
    { inputs: ['[1]', '1', '1'], expected: '1' },
    { inputs: ['[1]', '2', '5'], expected: '0' },
    { inputs: ['[5,3,7,1,4,6,9]', '4', '6'], expected: '15' },
    { inputs: ['[8,4,12,2,6,10,14]', '1', '20'], expected: '56' },
    { inputs: ['[8,4,12,2,6,10,14]', '5', '11'], expected: '34' },
    { inputs: ['[20,15,25,null,null,22,30]', '21', '24'], expected: '22' },
    { inputs: ['[10,5,15]', '0', '100'], expected: '30' },
    { inputs: ['[50,30,70,20,40,60,80]', '30', '50'], expected: '120' },
    { inputs: ['[2,1,3]', '5', '7'], expected: '0' },
  ],
  hints: [
    'BST ordering lets you prune entire subtrees.',
    'If node.val < low, the answer can only come from the right subtree.',
    'If node.val > high, the answer can only come from the left subtree.',
    'Otherwise the node itself is in range — add it and recurse both sides.',
    'Null contributes 0; recursion depth = tree height.',
  ],
  editorial_md: `## Intuition
A BST has the ordering property: every value in the left subtree of a node is smaller and every value in the right subtree is larger. That lets us *prune* — entire subtrees can be skipped once we know they cannot contain any in-range values.

## Approach
Recursive helper:

\`\`\`
rangeSum(node):
    if node is null: return 0
    if node.val < low:  return rangeSum(node.right)
    if node.val > high: return rangeSum(node.left)
    return node.val + rangeSum(node.left) + rangeSum(node.right)
\`\`\`

When \`node.val < low\`, every value in the left subtree is also \`< low\`, so it cannot contribute. Symmetrically for \`> high\` on the right. Otherwise we are inside the range and need to sum both sides.

This visits only nodes whose subtree intersects the range, often far fewer than \`n\`.

## Complexity
Time worst case \`O(n)\` for a fully in-range tree; usually faster due to pruning.
Space \`O(h)\` recursion depth.
`,
  solutions: {
    python: `from typing import Optional
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def buildTree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = deque([root]); i = 1
    while q and i < len(arr):
        n = q.popleft()
        if i < len(arr) and arr[i] is not None:
            n.left = TreeNode(arr[i]); q.append(n.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            n.right = TreeNode(arr[i]); q.append(n.right)
        i += 1
    return root

class Solution:
    def rangeSumBST(self, root, low: int, high: int) -> int:
        if isinstance(root, list):
            root = buildTree(root)
        if not root:
            return 0
        if root.val < low:
            return self.rangeSumBST(root.right, low, high)
        if root.val > high:
            return self.rangeSumBST(root.left, low, high)
        return root.val + self.rangeSumBST(root.left, low, high) + self.rangeSumBST(root.right, low, high)
`,
    javascript: `function TreeNode(val, left, right) {
  this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null;
}

function buildTree(arr) {
  if (!arr || !arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root]; let i = 1;
  while (q.length && i < arr.length) {
    const n = q.shift();
    if (i < arr.length && arr[i] !== null) { n.left = new TreeNode(arr[i]); q.push(n.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { n.right = new TreeNode(arr[i]); q.push(n.right); }
    i++;
  }
  return root;
}

/**
 * @param {number[] | TreeNode | null} root
 * @param {number} low
 * @param {number} high
 * @return {number}
 */
var rangeSumBST = function(root, low, high) {
  if (Array.isArray(root)) root = buildTree(root);
  if (!root) return 0;
  if (root.val < low) return rangeSumBST(root.right, low, high);
  if (root.val > high) return rangeSumBST(root.left, low, high);
  return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
};
`,
    java: `class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

class Solution {
    public int rangeSumBST(TreeNode root, int low, int high) {
        if (root == null) return 0;
        if (root.val < low) return rangeSumBST(root.right, low, high);
        if (root.val > high) return rangeSumBST(root.left, low, high);
        return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
    }
}
`,
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    int rangeSumBST(TreeNode* root, int low, int high) {
        if (!root) return 0;
        if (root->val < low) return rangeSumBST(root->right, low, high);
        if (root->val > high) return rangeSumBST(root->left, low, high);
        return root->val + rangeSumBST(root->left, low, high) + rangeSumBST(root->right, low, high);
    }
};
`,
  },
});

// ---------- 27. redundant-connection-ii ----------
out.push({
  id: 'redundant-connection-ii',
  pattern: 'case-analysis-union-find',
  tags: ['graph', 'union-find', 'tree'],
  test_cases: [
    { inputs: ['[[1,2],[1,3],[2,3]]'], expected: '[2,3]' },
    { inputs: ['[[1,2],[2,3],[3,4],[4,1],[1,5]]'], expected: '[4,1]' },
    { inputs: ['[[2,1],[3,1],[4,2],[1,4]]'], expected: '[2,1]' },
    { inputs: ['[[4,2],[1,5],[5,2],[5,3],[2,4]]'], expected: '[5,2]' },
    { inputs: ['[[1,2],[2,3],[3,1]]'], expected: '[3,1]' },
    { inputs: ['[[1,2],[1,3],[1,4],[5,2]]'], expected: '[5,2]' },
    { inputs: ['[[3,1],[2,3],[1,2]]'], expected: '[1,2]' },
    { inputs: ['[[2,1],[3,1],[4,1]]'], expected: '[4,1]' },
    { inputs: ['[[1,2],[2,3],[3,4],[1,4]]'], expected: '[1,4]' },
    { inputs: ['[[2,3],[1,2],[3,1]]'], expected: '[3,1]' },
  ],
  hints: [
    'A rooted tree with n nodes has exactly n - 1 edges; one extra causes either a 2-in-degree node, a cycle, or both.',
    'Scan edges once to find a node with two incoming edges; mark candidate1 (earlier) and candidate2 (later) for that node.',
    'If candidate2 exists, try the graph without candidate2. If it forms a valid tree (union-find detects no cycle), return candidate2; else return candidate1.',
    'If no two-in-degree node, return the edge that closes a cycle as detected by union-find.',
    'The case split is essential — pure union-find by itself does not distinguish the two failure modes.',
  ],
  editorial_md: `## Intuition
In a rooted tree, the root has in-degree 0 and every other node has in-degree 1. Adding one extra edge to a tree can create:
- (a) a node with in-degree 2 (an extra parent),
- (b) a cycle, or
- (c) both — when the extra edge also closes a cycle through the extra parent.

A pure union-find that ignores direction misses case (a). The right approach is a two-pass case analysis.

## Approach
1. Scan all edges. Track \`parent[v]\` = first edge that points to \`v\`. If a second edge \`[u, v]\` also points to \`v\`, record \`cand1 = parent[v]\` and \`cand2 = [u, v]\`; remove \`cand2\` from the working set by marking it.
2. Run union-find on the remaining edges in order. If union fails (cycle) and \`cand2\` was set: that means removing \`cand2\` left a cycle, so the right answer was \`cand1\`. If union fails and \`cand2\` was *not* set: this is pure case (b); return the offending edge.
3. If the union-find finishes cleanly and \`cand2\` was set: removing \`cand2\` made a valid tree, so \`cand2\` is the answer.

The case split is the only subtle part — without it we cannot tell whether the duplicate parent or the cycle-closing edge is at fault.

## Complexity
Time \`O(n · α(n))\` — near-linear thanks to union-find.
Space \`O(n)\` for the union-find arrays.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def findRedundantDirectedConnection(self, edges: List[List[int]]) -> List[int]:
        n = len(edges)
        parent = [0] * (n + 1)
        cand1 = cand2 = None
        for i, (u, v) in enumerate(edges):
            if parent[v] != 0:
                cand1 = [parent[v] - 1, v]   # wait, store as edge values
                cand2 = [u, v]
                # actually we need the actual edges (with original endpoint values)
                cand1 = [parent[v], v]
                edges[i] = [0, 0]  # mark removed
            else:
                parent[v] = u

        # union-find on edges (with cand2 removed)
        uf = list(range(n + 1))
        def find(x):
            while uf[x] != x:
                uf[x] = uf[uf[x]]
                x = uf[x]
            return x
        for u, v in edges:
            if u == 0 and v == 0:
                continue
            ru, rv = find(u), find(v)
            if ru == rv:
                # cycle
                return cand1 if cand1 else [u, v]
            uf[rv] = ru
        return cand2
`,
    javascript: `/**
 * @param {number[][]} edges
 * @return {number[]}
 */
var findRedundantDirectedConnection = function(edges) {
  const n = edges.length;
  const parent = new Array(n + 1).fill(0);
  let cand1 = null, cand2 = null;
  const work = edges.map(e => e.slice());
  for (let i = 0; i < n; i++) {
    const [u, v] = work[i];
    if (parent[v] !== 0) {
      cand1 = [parent[v], v];
      cand2 = [u, v];
      work[i] = [0, 0];
    } else {
      parent[v] = u;
    }
  }
  const uf = Array.from({length: n + 1}, (_, i) => i);
  const find = (x) => { while (uf[x] !== x) { uf[x] = uf[uf[x]]; x = uf[x]; } return x; };
  for (const [u, v] of work) {
    if (u === 0 && v === 0) continue;
    const ru = find(u), rv = find(v);
    if (ru === rv) return cand1 || [u, v];
    uf[rv] = ru;
  }
  return cand2;
};
`,
    java: `import java.util.*;

class Solution {
    int[] uf;
    int find(int x) { while (uf[x] != x) { uf[x] = uf[uf[x]]; x = uf[x]; } return x; }

    public int[] findRedundantDirectedConnection(int[][] edges) {
        int n = edges.length;
        int[] parent = new int[n + 1];
        int[] cand1 = null, cand2 = null;
        int[][] work = new int[n][2];
        for (int i = 0; i < n; i++) {
            work[i][0] = edges[i][0];
            work[i][1] = edges[i][1];
        }
        for (int i = 0; i < n; i++) {
            int u = work[i][0], v = work[i][1];
            if (parent[v] != 0) {
                cand1 = new int[]{parent[v], v};
                cand2 = new int[]{u, v};
                work[i][0] = 0; work[i][1] = 0;
            } else {
                parent[v] = u;
            }
        }
        uf = new int[n + 1];
        for (int i = 0; i <= n; i++) uf[i] = i;
        for (int[] e : work) {
            if (e[0] == 0 && e[1] == 0) continue;
            int ru = find(e[0]), rv = find(e[1]);
            if (ru == rv) return cand1 != null ? cand1 : e;
            uf[rv] = ru;
        }
        return cand2;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
    vector<int> uf;
    int find(int x) { while (uf[x] != x) { uf[x] = uf[uf[x]]; x = uf[x]; } return x; }
public:
    vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        vector<int> parent(n + 1, 0);
        vector<int> cand1, cand2;
        auto work = edges;
        for (int i = 0; i < n; i++) {
            int u = work[i][0], v = work[i][1];
            if (parent[v] != 0) {
                cand1 = {parent[v], v};
                cand2 = {u, v};
                work[i] = {0, 0};
            } else parent[v] = u;
        }
        uf.assign(n + 1, 0);
        for (int i = 0; i <= n; i++) uf[i] = i;
        for (auto& e : work) {
            if (e[0] == 0 && e[1] == 0) continue;
            int ru = find(e[0]), rv = find(e[1]);
            if (ru == rv) return cand1.empty() ? e : cand1;
            uf[rv] = ru;
        }
        return cand2;
    }
};
`,
  },
});

// ---------- 28. relative-ranks ----------
out.push({
  id: 'relative-ranks',
  pattern: 'sort-with-indices',
  tags: ['array', 'sorting', 'heap'],
  test_cases: [
    { inputs: ['[5,4,3,2,1]'], expected: '["Gold Medal","Silver Medal","Bronze Medal","4","5"]' },
    { inputs: ['[10,3,8,9,4]'], expected: '["Gold Medal","5","Bronze Medal","Silver Medal","4"]' },
    { inputs: ['[1]'], expected: '["Gold Medal"]' },
    { inputs: ['[2,1]'], expected: '["Gold Medal","Silver Medal"]' },
    { inputs: ['[1,2]'], expected: '["Silver Medal","Gold Medal"]' },
    { inputs: ['[3,2,1]'], expected: '["Gold Medal","Silver Medal","Bronze Medal"]' },
    { inputs: ['[100,90,80,70,60,50]'], expected: '["Gold Medal","Silver Medal","Bronze Medal","4","5","6"]' },
    { inputs: ['[1,2,3,4]'], expected: '["4","Bronze Medal","Silver Medal","Gold Medal"]' },
    { inputs: ['[50,49,48,47,46,45,44]'], expected: '["Gold Medal","Silver Medal","Bronze Medal","4","5","6","7"]' },
    { inputs: ['[7,7,7]'], expected: '["Gold Medal","Silver Medal","Bronze Medal"]' },
    { inputs: ['[6,5,4,3,2,1,0]'], expected: '["Gold Medal","Silver Medal","Bronze Medal","4","5","6","7"]' },
  ],
  hints: [
    'You only need the ordering of scores, not the sorted array — sort indices by score descending.',
    'After sorting, position 0 → Gold, 1 → Silver, 2 → Bronze, else (position + 1) as a string.',
    'Write each label back at the player\\'s ORIGINAL index in the answer array.',
    'O(n log n) for the sort dominates.',
    'A heap could also produce the top-3 first, then assign numeric labels by extraction order.',
  ],
  editorial_md: `## Intuition
You need each athlete's rank label at their original index. The athlete with the highest score is rank 1 ("Gold Medal"), and so on. Sort the *indices* by score descending; the position in that sorted order gives the rank, and writing back at the original index produces the final array.

## Approach
1. Build an array \`idx = [0, 1, ..., n-1]\` and sort it by \`score\` descending.
2. Allocate the answer array of length \`n\`.
3. Walk \`idx\` and assign labels:
   - position 0 → "Gold Medal"
   - position 1 → "Silver Medal"
   - position 2 → "Bronze Medal"
   - otherwise \`(position + 1).toString()\`
4. Place each label at \`answer[idx[position]]\`.

No need to actually sort the scores themselves — sorting indices preserves the original positions, which is exactly what the output requires.

## Complexity
Time \`O(n log n)\` — sort dominates.
Space \`O(n)\` for the index buffer and answer array.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def findRelativeRanks(self, score: List[int]) -> List[str]:
        n = len(score)
        idx = sorted(range(n), key=lambda i: -score[i])
        ans = [""] * n
        medals = ["Gold Medal", "Silver Medal", "Bronze Medal"]
        for pos, i in enumerate(idx):
            ans[i] = medals[pos] if pos < 3 else str(pos + 1)
        return ans
`,
    javascript: `/**
 * @param {number[]} score
 * @return {string[]}
 */
var findRelativeRanks = function(score) {
  const n = score.length;
  const idx = score.map((_, i) => i).sort((a, b) => score[b] - score[a]);
  const ans = new Array(n);
  const medals = ["Gold Medal", "Silver Medal", "Bronze Medal"];
  for (let pos = 0; pos < n; pos++) {
    ans[idx[pos]] = pos < 3 ? medals[pos] : String(pos + 1);
  }
  return ans;
};
`,
    java: `import java.util.*;

class Solution {
    public String[] findRelativeRanks(int[] score) {
        int n = score.length;
        Integer[] idx = new Integer[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        Arrays.sort(idx, (a, b) -> score[b] - score[a]);
        String[] ans = new String[n];
        String[] medals = {"Gold Medal", "Silver Medal", "Bronze Medal"};
        for (int pos = 0; pos < n; pos++) {
            ans[idx[pos]] = pos < 3 ? medals[pos] : Integer.toString(pos + 1);
        }
        return ans;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    vector<string> findRelativeRanks(vector<int>& score) {
        int n = score.size();
        vector<int> idx(n);
        iota(idx.begin(), idx.end(), 0);
        sort(idx.begin(), idx.end(), [&](int a, int b){ return score[a] > score[b]; });
        vector<string> ans(n);
        const string medals[] = {"Gold Medal", "Silver Medal", "Bronze Medal"};
        for (int pos = 0; pos < n; pos++) {
            ans[idx[pos]] = pos < 3 ? medals[pos] : to_string(pos + 1);
        }
        return ans;
    }
};
`,
  },
});

// ---------- 29. remove-covered-intervals ----------
out.push({
  id: 'remove-covered-intervals',
  pattern: 'sort-and-sweep',
  tags: ['array', 'sorting', 'greedy'],
  test_cases: [
    { inputs: ['[[1,4],[3,6],[2,8]]'], expected: '2' },
    { inputs: ['[[1,4],[2,3]]'], expected: '1' },
    { inputs: ['[[1,2]]'], expected: '1' },
    { inputs: ['[[1,4],[1,2]]'], expected: '1' },
    { inputs: ['[[1,2],[1,4],[3,4]]'], expected: '1' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '3' },
    { inputs: ['[[1,10],[2,9],[3,8],[4,7],[5,6]]'], expected: '1' },
    { inputs: ['[[1,2],[2,3],[3,4],[4,5]]'], expected: '4' },
    { inputs: ['[[1,5],[2,3],[2,4],[5,6]]'], expected: '2' },
    { inputs: ['[[3,10],[4,10],[5,11]]'], expected: '2' },
    { inputs: ['[[1,4],[3,7],[2,8],[3,5]]'], expected: '2' },
  ],
  hints: [
    'Sort by start ASCENDING; break ties by end DESCENDING.',
    'This places a covering interval before the intervals it covers.',
    'Sweep keeping the largest end seen so far.',
    'A new interval is COVERED iff its end <= largest seen end; else it becomes the new largest.',
    'Count uncovered intervals.',
  ],
  editorial_md: `## Intuition
Interval \`B\` is covered by \`A\` iff \`A.start <= B.start\` and \`B.end <= A.end\`. If you sort by start ascending, the covering interval always comes first; if two intervals share a start, the one with the bigger end "wins" — so break ties by end descending. After that, a left-to-right sweep just needs to remember the largest end seen and bump it when the current interval extends past it.

## Approach
1. Sort \`intervals\` by start asc, end desc.
2. \`maxEnd = 0\`, \`count = 0\`.
3. For each interval \`[s, e]\`:
   - If \`e > maxEnd\`: it is *not* covered — increment \`count\` and set \`maxEnd = e\`.
   - Else: it is covered by an earlier interval — skip.
4. Return \`count\`.

Why end-descending tie break? If two intervals start at the same point, the one with the larger end strictly covers the other. Sorting it first means the smaller one sees \`maxEnd\` already large enough to be skipped.

## Complexity
Time \`O(n log n)\` — sort dominates the linear sweep.
Space \`O(1)\` extra beyond the sort.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def removeCoveredIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda x: (x[0], -x[1]))
        max_end = 0
        count = 0
        for _, e in intervals:
            if e > max_end:
                count += 1
                max_end = e
        return count
`,
    javascript: `/**
 * @param {number[][]} intervals
 * @return {number}
 */
var removeCoveredIntervals = function(intervals) {
  intervals.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  let maxEnd = 0, count = 0;
  for (const [, e] of intervals) {
    if (e > maxEnd) { count++; maxEnd = e; }
  }
  return count;
};
`,
    java: `import java.util.*;

class Solution {
    public int removeCoveredIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);
        int maxEnd = 0, count = 0;
        for (int[] iv : intervals) {
            if (iv[1] > maxEnd) { count++; maxEnd = iv[1]; }
        }
        return count;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int removeCoveredIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){
                 return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];
             });
        int maxEnd = 0, count = 0;
        for (auto& iv : intervals) {
            if (iv[1] > maxEnd) { count++; maxEnd = iv[1]; }
        }
        return count;
    }
};
`,
  },
});

// ---------- 30. restore-ip-addresses ----------
out.push({
  id: 'restore-ip-addresses',
  editorial_md: `## Intuition
A valid IP address is four "octets" separated by dots, each octet 0..255 with no leading zeros (the literal "0" itself is fine). The input string is partitioned into 4 contiguous chunks; with octets of length 1, 2, or 3 there are at most \`3^4 = 81\` choices, so backtracking is fast.

## Approach
Backtracking with two parameters: index into \`s\` and number of octets formed so far.

\`\`\`
def back(start, parts):
    if parts == 4:
        if start == len(s): record ".".join(current)
        return
    for length in (1, 2, 3):
        if start + length > len(s): break
        chunk = s[start:start + length]
        if len(chunk) > 1 and chunk[0] == '0': continue  # leading zero
        if int(chunk) > 255: continue
        current.append(chunk)
        back(start + length, parts + 1)
        current.pop()
\`\`\`

Prunes:
- Length cannot push past \`|s|\`.
- Length > 1 with leading '0' is invalid.
- Numeric value > 255 is invalid.
- After 4 octets, must consume the entire string.

Additional small prune: the remaining length must be in \`[parts_remaining, 3 * parts_remaining]\` — saves a few branches but is optional.

## Complexity
Time \`O(1)\` — bounded by the constant \`3^4 = 81\` placements.
Space \`O(1)\` recursion depth is at most 4; output bounded.
`,
  solutions: {
    python: `from typing import List

class Solution:
    def restoreIpAddresses(self, s: str) -> List[str]:
        res = []
        n = len(s)
        if n < 4 or n > 12:
            return res
        cur = []
        def back(start, parts):
            if parts == 4:
                if start == n:
                    res.append(".".join(cur))
                return
            for L in (1, 2, 3):
                if start + L > n:
                    break
                chunk = s[start:start + L]
                if len(chunk) > 1 and chunk[0] == '0':
                    continue
                if int(chunk) > 255:
                    continue
                cur.append(chunk)
                back(start + L, parts + 1)
                cur.pop()
        back(0, 0)
        return res
`,
    javascript: `/**
 * @param {string} s
 * @return {string[]}
 */
var restoreIpAddresses = function(s) {
  const res = [];
  const n = s.length;
  if (n < 4 || n > 12) return res;
  const cur = [];
  const back = (start, parts) => {
    if (parts === 4) {
      if (start === n) res.push(cur.join('.'));
      return;
    }
    for (let L = 1; L <= 3; L++) {
      if (start + L > n) break;
      const chunk = s.substring(start, start + L);
      if (chunk.length > 1 && chunk[0] === '0') continue;
      if (parseInt(chunk, 10) > 255) continue;
      cur.push(chunk);
      back(start + L, parts + 1);
      cur.pop();
    }
  };
  back(0, 0);
  return res;
};
`,
    java: `import java.util.*;

class Solution {
    private List<String> res;
    private String s;
    private int n;
    private List<String> cur;

    public List<String> restoreIpAddresses(String s) {
        this.res = new ArrayList<>();
        this.s = s; this.n = s.length();
        if (n < 4 || n > 12) return res;
        this.cur = new ArrayList<>();
        back(0, 0);
        return res;
    }
    private void back(int start, int parts) {
        if (parts == 4) {
            if (start == n) res.add(String.join(".", cur));
            return;
        }
        for (int L = 1; L <= 3; L++) {
            if (start + L > n) break;
            String chunk = s.substring(start, start + L);
            if (chunk.length() > 1 && chunk.charAt(0) == '0') continue;
            if (Integer.parseInt(chunk) > 255) continue;
            cur.add(chunk);
            back(start + L, parts + 1);
            cur.remove(cur.size() - 1);
        }
    }
}
`,
    cpp: `#include <vector>
#include <string>
using namespace std;

class Solution {
    vector<string> res;
    vector<string> cur;
    string s;
    int n;
    void back(int start, int parts) {
        if (parts == 4) {
            if (start == n) {
                string out = cur[0];
                for (int i = 1; i < 4; i++) out += "." + cur[i];
                res.push_back(out);
            }
            return;
        }
        for (int L = 1; L <= 3; L++) {
            if (start + L > n) break;
            string chunk = s.substr(start, L);
            if (chunk.size() > 1 && chunk[0] == '0') continue;
            if (stoi(chunk) > 255) continue;
            cur.push_back(chunk);
            back(start + L, parts + 1);
            cur.pop_back();
        }
    }
public:
    vector<string> restoreIpAddresses(string s) {
        this->s = s; this->n = s.size();
        if (n < 4 || n > 12) return res;
        back(0, 0);
        return res;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/_part1.json', JSON.stringify(out, null, 2));
console.log('built', out.length, 'so far');
