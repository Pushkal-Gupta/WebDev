#!/usr/bin/env node
// Part 5: problems 41-55 (binary-search variants & sliding-window)
import fs from 'node:fs';

const entries = [];
const add = (p) => entries.push(p);

// 41. insertion-position
add({
  id: 'insertion-position',
  method_name: 'searchInsert',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'int',
  pattern: 'Binary search (lower bound)',
  description: '<p>Given a sorted array of distinct integers and a target value, return the index where the target would be inserted to keep the array sorted. If the target is already present, return its index. Solve in O(log n).</p>',
  hints: [
    'Classic lower-bound binary search.',
    'Maintain lo, hi with lo = 0, hi = n.',
    'When lo < hi: mid = (lo + hi) / 2. If nums[mid] < target, lo = mid + 1, else hi = mid.',
    'After the loop, lo is the insertion index.',
    'Equivalent: bisect_left(nums, target).',
  ],
  test_cases: [
    { inputs: ['[1,3,5,6]', '5'], expected: '2' },
    { inputs: ['[1,3,5,6]', '2'], expected: '1' },
    { inputs: ['[1,3,5,6]', '7'], expected: '4' },
    { inputs: ['[1,3,5,6]', '0'], expected: '0' },
    { inputs: ['[1]', '0'], expected: '0' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[1]', '2'], expected: '1' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[1,2,3,4,5,6,7,8,9]', '4'], expected: '3' },
    { inputs: ['[1,2,3,4,5,6,7,8,9]', '10'], expected: '9' },
  ],
  editorial_md: `## Intuition
The problem asks for the position where \`target\` belongs in a sorted array — the first index whose value is greater than or equal to \`target\`. This is exactly the "lower bound" operation, solvable with one binary search.

## Approach
1. Maintain \`lo = 0\` and \`hi = n\` (note: \`n\`, not \`n-1\`, so the answer can be \`n\` for "after the last element").
2. While \`lo < hi\`:
   - \`mid = (lo + hi) / 2\` (use integer division).
   - If \`nums[mid] < target\`, the answer must be to the right — set \`lo = mid + 1\`.
   - Otherwise, the answer is at \`mid\` or to its left — set \`hi = mid\`.
3. When the loop ends, \`lo == hi\` is the insertion index.

The loop terminates because \`hi - lo\` strictly decreases each iteration; correctness comes from the loop invariant "answer lies in \`[lo, hi]\`".

## Complexity
- Time: O(log n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def searchInsert(self, nums, target):
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] < target: lo = mid + 1
            else: hi = mid
        return lo
`,
    javascript: `class Solution {
    searchInsert(nums, target) {
        let lo = 0, hi = nums.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
`,
    java: `class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
`,
  },
});

// 42. lower-bound
add({
  id: 'lower-bound',
  method_name: 'lowerBound',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'int',
  pattern: 'Binary search (first index with value >= target)',
  description: '<p>Given a sorted (non-decreasing) integer array and a target value, return the smallest index <code>i</code> such that <code>nums[i] &gt;= target</code>. Return <code>n</code> (the length) if no such index exists.</p>',
  hints: [
    'Binary search with lo = 0, hi = n.',
    'When nums[mid] < target shrink left: lo = mid + 1.',
    'Else shrink right: hi = mid.',
    'Loop until lo == hi.',
    'Same as Python bisect_left.',
  ],
  test_cases: [
    { inputs: ['[1,2,4,4,4,5,7]', '4'], expected: '2' },
    { inputs: ['[1,2,4,4,4,5,7]', '3'], expected: '2' },
    { inputs: ['[1,2,4,4,4,5,7]', '8'], expected: '7' },
    { inputs: ['[1,2,4,4,4,5,7]', '0'], expected: '0' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[5,5,5,5]', '5'], expected: '0' },
    { inputs: ['[5,5,5,5]', '6'], expected: '4' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[1,3,5,7,9]', '4'], expected: '2' },
    { inputs: ['[1,3,5,7,9]', '9'], expected: '4' },
  ],
  editorial_md: `## Intuition
The lower bound of a value in a sorted array is the first index whose element is \`>=\` the target. Binary search collapses the search range by half each step, achieving O(log n) — far better than a linear scan, especially for repeated queries on the same array.

## Approach
1. Initialise \`lo = 0\`, \`hi = n\`.
2. While \`lo < hi\`:
   - \`mid = (lo + hi) / 2\`.
   - If \`nums[mid] < target\`: the answer is strictly to the right — \`lo = mid + 1\`.
   - Else (\`nums[mid] >= target\`): the answer is at \`mid\` or to the left — \`hi = mid\`.
3. Return \`lo\`.

Equivalent to Python's \`bisect.bisect_left\`, C++'s \`std::lower_bound\`, Java's \`Arrays.binarySearch\` (when normalised). All return \`n\` when every element is strictly less than the target.

## Complexity
- Time: O(log n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def lowerBound(self, nums, target):
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] < target: lo = mid + 1
            else: hi = mid
        return lo
`,
    javascript: `class Solution {
    lowerBound(nums, target) {
        let lo = 0, hi = nums.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
`,
    java: `class Solution {
    public int lowerBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int lowerBound(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
};
`,
  },
});

// 43. upper-bound
add({
  id: 'upper-bound',
  method_name: 'upperBound',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'int',
  pattern: 'Binary search (first index with value > target)',
  description: '<p>Given a sorted (non-decreasing) integer array and a target value, return the smallest index <code>i</code> such that <code>nums[i] &gt; target</code>. Return <code>n</code> if all elements are <code>&lt;= target</code>.</p>',
  hints: [
    'Same skeleton as lower bound, with the comparison nums[mid] <= target.',
    'lo = 0, hi = n. Until lo == hi.',
    'mid = (lo + hi) / 2; if nums[mid] <= target lo = mid + 1 else hi = mid.',
    'Equivalent to Python bisect_right.',
    'Useful for counting occurrences: upperBound - lowerBound.',
  ],
  test_cases: [
    { inputs: ['[1,2,4,4,4,5,7]', '4'], expected: '5' },
    { inputs: ['[1,2,4,4,4,5,7]', '3'], expected: '2' },
    { inputs: ['[1,2,4,4,4,5,7]', '8'], expected: '7' },
    { inputs: ['[1,2,4,4,4,5,7]', '0'], expected: '0' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[5,5,5,5]', '5'], expected: '4' },
    { inputs: ['[5,5,5,5]', '4'], expected: '0' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1,3,5,7,9]', '4'], expected: '2' },
    { inputs: ['[1,3,5,7,9]', '9'], expected: '5' },
  ],
  editorial_md: `## Intuition
The upper bound returns the first index strictly greater than the target. The only change from lower bound is the comparison: we move \`lo\` past every element that is \`<=\` target, not just \`<\`. This gives \`(upper - lower)\` = number of occurrences of \`target\` in the sorted array, a useful identity.

## Approach
1. Initialise \`lo = 0\`, \`hi = n\`.
2. While \`lo < hi\`:
   - \`mid = (lo + hi) / 2\`.
   - If \`nums[mid] <= target\`: shift past — \`lo = mid + 1\`.
   - Else: \`hi = mid\`.
3. Return \`lo\`.

The invariant is "answer lies in \`[lo, hi]\`", so the loop converges in O(log n).

Pair with \`lowerBound\` to get a count: \`occurrences(target) = upperBound - lowerBound\`. This is the building block of every "count in range" / "first occurrence" / "last occurrence" interview question.

## Complexity
- Time: O(log n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def upperBound(self, nums, target):
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] <= target: lo = mid + 1
            else: hi = mid
        return lo
`,
    javascript: `class Solution {
    upperBound(nums, target) {
        let lo = 0, hi = nums.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] <= target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
`,
    java: `class Solution {
    public int upperBound(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] <= target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int upperBound(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] <= target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
};
`,
  },
});

// 44. single-element — single non-duplicate in sorted array
add({
  id: 'single-element',
  method_name: 'singleNonDuplicate',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Binary search on parity',
  description: '<p>Given a sorted array where every element appears exactly twice except for one element that appears once, return the single element. Solve in O(log n).</p>',
  hints: [
    'Before the single element, pairs start at even indices.',
    'After the single element, pairs start at odd indices.',
    'Binary search the boundary: at mid, check if nums[mid] matches its paired neighbour.',
    'If the pair is intact at mid, the single is to the right; otherwise it is at mid or to the left.',
    'Trick: pair index = mid XOR 1 (toggles last bit).',
  ],
  test_cases: [
    { inputs: ['[1,1,2,3,3,4,4,8,8]'], expected: '2' },
    { inputs: ['[3,3,7,7,10,11,11]'], expected: '10' },
    { inputs: ['[1]'], expected: '1' },
    { inputs: ['[1,1,2]'], expected: '2' },
    { inputs: ['[1,2,2]'], expected: '1' },
    { inputs: ['[1,1,2,2,3,3,4]'], expected: '4' },
    { inputs: ['[0,1,1,2,2]'], expected: '0' },
    { inputs: ['[-1,-1,0,0,1]'], expected: '1' },
    { inputs: ['[1,1,3,3,5,5,7,7,9]'], expected: '9' },
    { inputs: ['[1,2,2,3,3]'], expected: '1' },
  ],
  editorial_md: `## Intuition
In a sorted array of paired duplicates with one singleton, the singleton breaks the regular "even-index starts a pair" pattern. Before the singleton, \`nums[2k] == nums[2k+1]\` for every \`k\`. After the singleton, the pattern shifts. Binary-searching on this property finds the boundary in O(log n).

## Approach
1. Let \`lo = 0\`, \`hi = n - 1\`.
2. While \`lo < hi\`:
   - \`mid = (lo + hi) / 2\`.
   - Compute \`mate = mid XOR 1\` — this flips the last bit, giving the index of \`mid\`'s expected pair (even ↔ next odd, or odd ↔ previous even).
   - If \`nums[mid] == nums[mate]\`, all pairs up to and including \`mid\` are intact — singleton must be to the right: \`lo = mid + 1\`.
   - Else the pairing is already broken — singleton is at \`mid\` or to the left: \`hi = mid\`.
3. After the loop, \`lo == hi\` is the singleton's index.

The \`mid XOR 1\` trick neatly handles both parities of \`mid\` without a conditional.

## Complexity
- Time: O(log n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def singleNonDuplicate(self, nums):
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            mate = mid ^ 1
            if nums[mid] == nums[mate]: lo = mid + 1
            else: hi = mid
        return nums[lo]
`,
    javascript: `class Solution {
    singleNonDuplicate(nums) {
        let lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] === nums[mid ^ 1]) lo = mid + 1; else hi = mid;
        }
        return nums[lo];
    }
}
`,
    java: `class Solution {
    public int singleNonDuplicate(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] == nums[mid ^ 1]) lo = mid + 1; else hi = mid;
        }
        return nums[lo];
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int singleNonDuplicate(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == nums[mid ^ 1]) lo = mid + 1; else hi = mid;
        }
        return nums[lo];
    }
};
`,
  },
});

// 45. missing-natural
add({
  id: 'missing-natural',
  method_name: 'missingNumber',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Sum formula or XOR',
  description: '<p>Given an array of n distinct numbers taken from the range <code>[0, n]</code>, return the single missing number from the range.</p>',
  hints: [
    'Expected sum of 0..n = n * (n + 1) / 2.',
    'Subtract the actual sum to get the missing one.',
    'Overflow-safe alternative: XOR all indices [0..n] with all values.',
    'The pairs cancel; the survivor is the missing number.',
    'Both are O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[3,0,1]'], expected: '2' },
    { inputs: ['[0,1]'], expected: '2' },
    { inputs: ['[9,6,4,2,3,5,7,0,1]'], expected: '8' },
    { inputs: ['[0]'], expected: '1' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[0,1,2,3,4]'], expected: '5' },
    { inputs: ['[5,4,3,2,1]'], expected: '0' },
    { inputs: ['[1,2,3,4,5]'], expected: '0' },
    { inputs: ['[0,1,2,3,5]'], expected: '4' },
    { inputs: ['[2,0]'], expected: '1' },
  ],
  editorial_md: `## Intuition
The sum of the integers \`0\` through \`n\` has the closed form \`n * (n + 1) / 2\`. Subtracting the actual sum of the array gives the single missing number. The XOR approach is overflow-safe: XOR-ing every \`i\` from 0 to n with every value cancels each present number, leaving only the missing one.

## Approach (sum formula)
1. Compute \`expected = n * (n + 1) / 2\`.
2. Compute \`actual = sum(nums)\`.
3. Return \`expected - actual\`.

## Approach (XOR)
1. Initialise \`x = n\` (so the index \`n\` is included even though no value sits there).
2. For each \`i\` from 0 to \`n - 1\`, \`x ^= i ^ nums[i]\`.
3. Every present number appears twice (once as index, once as value) and cancels via XOR. The only survivor is the missing value.

XOR avoids any chance of integer overflow on very large \`n\` — useful for tight environments.

## Complexity
- Time: O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def missingNumber(self, nums):
        n = len(nums)
        return n * (n + 1) // 2 - sum(nums)
`,
    javascript: `class Solution {
    missingNumber(nums) {
        const n = nums.length;
        let s = 0; for (const x of nums) s += x;
        return n * (n + 1) / 2 - s;
    }
}
`,
    java: `class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length, s = 0;
        for (int x : nums) s += x;
        return n * (n + 1) / 2 - s;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = nums.size(), s = 0;
        for (int x : nums) s += x;
        return n * (n + 1) / 2 - s;
    }
};
`,
  },
});

// 46. count-occurrences — count occurrences of target in sorted array
add({
  id: 'count-occurrences',
  method_name: 'countOccurrences',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'int',
  pattern: 'Upper bound - Lower bound',
  description: '<p>Given a sorted (non-decreasing) integer array and a target value, return the number of times the target appears in the array. Solve in O(log n).</p>',
  hints: [
    'Find the first index where nums[i] >= target (lower bound).',
    'Find the first index where nums[i] > target (upper bound).',
    'The count is upper - lower.',
    'Both bounds use the same binary-search skeleton with different comparisons.',
    'If target is absent, lower == upper, giving count 0.',
  ],
  test_cases: [
    { inputs: ['[1,1,2,2,2,3,4]', '2'], expected: '3' },
    { inputs: ['[1,2,3,4,5]', '6'], expected: '0' },
    { inputs: ['[5,5,5,5]', '5'], expected: '4' },
    { inputs: ['[1,2,3,4,5]', '3'], expected: '1' },
    { inputs: ['[]', '1'], expected: '0' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1]', '2'], expected: '0' },
    { inputs: ['[-3,-2,-2,-1,0,1,2]', '-2'], expected: '2' },
    { inputs: ['[1,1,1,1,1,1,1]', '1'], expected: '7' },
    { inputs: ['[1,2,2,3,3,3,4,4,4,4]', '4'], expected: '4' },
  ],
  editorial_md: `## Intuition
In a sorted array, every occurrence of a value sits in a contiguous block. The first occurrence is the lower bound (first index \`>= target\`) and one past the last occurrence is the upper bound (first index \`> target\`). Subtracting gives the count, all in two binary searches.

## Approach
1. Compute \`lo = lowerBound(nums, target)\` — first index where \`nums[i] >= target\`.
2. Compute \`hi = upperBound(nums, target)\` — first index where \`nums[i] > target\`.
3. Return \`hi - lo\`. If \`target\` is absent, both bounds land at the same index and the count is 0.

Each bound is O(log n), so the total cost is O(log n).

This is the canonical use case for the lower/upper-bound primitive — every "count value v in sorted range \`[L, R]\`" question reduces to it.

## Complexity
- Time: O(log n).
- Space: O(1).`,
  solutions: {
    python: `from bisect import bisect_left, bisect_right
class Solution:
    def countOccurrences(self, nums, target):
        return bisect_right(nums, target) - bisect_left(nums, target)
`,
    javascript: `class Solution {
    countOccurrences(nums, target) {
        const lb = (cmp) => {
            let lo = 0, hi = nums.length;
            while (lo < hi) { const mid = (lo + hi) >> 1; if (cmp(nums[mid])) lo = mid + 1; else hi = mid; }
            return lo;
        };
        return lb(v => v <= target) - lb(v => v < target);
    }
}
`,
    java: `class Solution {
    public int countOccurrences(int[] nums, int target) {
        return upper(nums, target) - lower(nums, target);
    }
    private int lower(int[] a, int t) {
        int lo = 0, hi = a.length;
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (a[mid] < t) lo = mid + 1; else hi = mid; }
        return lo;
    }
    private int upper(int[] a, int t) {
        int lo = 0, hi = a.length;
        while (lo < hi) { int mid = (lo + hi) >>> 1; if (a[mid] <= t) lo = mid + 1; else hi = mid; }
        return lo;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int countOccurrences(vector<int>& nums, int target) {
        return upper_bound(nums.begin(), nums.end(), target) - lower_bound(nums.begin(), nums.end(), target);
    }
};
`,
  },
});

// 47. 2d-search
add({
  id: '2d-search',
  method_name: 'searchMatrix',
  params: [{ name: 'matrix', type: 'List[List[int]]' }, { name: 'target', type: 'int' }],
  return_type: 'bool',
  pattern: 'Staircase / binary search on flattened matrix',
  description: '<p>Search a target value in an m x n matrix sorted in row-major order (rows sorted ascending, first element of each row greater than the last element of the previous row). Return true if the target exists, false otherwise.</p>',
  hints: [
    'The flattened matrix is just a sorted array of length m * n.',
    'Binary-search indices [0, m * n) and map index k -> (k / n, k % n).',
    'O(log(m * n)) = O(log m + log n).',
    'Alternative (works on row+column sorted matrix too): start at top-right, move left on bigger and down on smaller.',
    'For the staircase method, complexity is O(m + n).',
  ],
  test_cases: [
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '3'], expected: 'true' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '13'], expected: 'false' },
    { inputs: ['[[1]]', '1'], expected: 'true' },
    { inputs: ['[[1]]', '2'], expected: 'false' },
    { inputs: ['[]', '1'], expected: 'false' },
    { inputs: ['[[1,2,3]]', '2'], expected: 'true' },
    { inputs: ['[[1],[2],[3]]', '2'], expected: 'true' },
    { inputs: ['[[1,3],[5,7]]', '7'], expected: 'true' },
    { inputs: ['[[1,3],[5,7]]', '4'], expected: 'false' },
    { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '60'], expected: 'true' },
  ],
  editorial_md: `## Intuition
The matrix is sorted as if it were a single 1D array of length \`m * n\` laid out row by row. So one binary search over \`[0, m * n)\` finds the target, mapping every midpoint index \`k\` back to the cell \`(k / n, k % n)\`.

## Approach
1. Let \`m\` = rows, \`n\` = columns. Handle the empty matrix early.
2. Set \`lo = 0\`, \`hi = m * n - 1\`.
3. While \`lo <= hi\`:
   - \`mid = (lo + hi) / 2\`.
   - \`val = matrix[mid / n][mid % n]\`.
   - If \`val == target\`, return \`true\`.
   - If \`val < target\`, set \`lo = mid + 1\`; else \`hi = mid - 1\`.
4. Return \`false\` if the loop completes without finding the target.

A second approach — useful when the matrix is only row-sorted and column-sorted (Leetcode 240) — starts at the top-right corner and walks left on too-big, down on too-small. That runs in O(m + n) and is equally simple to code.

## Complexity
- Time: O(log(m * n)) for the flattened binary search.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def searchMatrix(self, matrix, target):
        if not matrix or not matrix[0]: return False
        m, n = len(matrix), len(matrix[0])
        lo, hi = 0, m * n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            val = matrix[mid // n][mid % n]
            if val == target: return True
            if val < target: lo = mid + 1
            else: hi = mid - 1
        return False
`,
    javascript: `class Solution {
    searchMatrix(matrix, target) {
        if (!matrix.length || !matrix[0].length) return false;
        const m = matrix.length, n = matrix[0].length;
        let lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const val = matrix[Math.floor(mid / n)][mid % n];
            if (val === target) return true;
            if (val < target) lo = mid + 1; else hi = mid - 1;
        }
        return false;
    }
}
`,
    java: `class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        if (matrix.length == 0 || matrix[0].length == 0) return false;
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            if (val < target) lo = mid + 1; else hi = mid - 1;
        }
        return false;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        if (matrix.empty() || matrix[0].empty()) return false;
        int m = matrix.size(), n = matrix[0].size();
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            if (val < target) lo = mid + 1; else hi = mid - 1;
        }
        return false;
    }
};
`,
  },
});

// 48. sorted-rotated
add({
  id: 'sorted-rotated',
  method_name: 'searchRotated',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'int',
  pattern: 'Binary search with sorted-half detection',
  description: '<p>Given an integer array originally sorted in ascending order then rotated at an unknown pivot, return the index of <code>target</code>, or <code>-1</code> if not present. All values are distinct. Solve in O(log n).</p>',
  hints: [
    'At every step one half of [lo, hi] is sorted; identify it by comparing nums[lo] to nums[mid].',
    'If nums[lo] <= nums[mid], the left half is sorted.',
    'Check whether target lies in the sorted half; if yes, restrict to it.',
    'Otherwise restrict to the other half.',
    'Loop until lo > hi.',
  ],
  test_cases: [
    { inputs: ['[4,5,6,7,0,1,2]', '0'], expected: '4' },
    { inputs: ['[4,5,6,7,0,1,2]', '3'], expected: '-1' },
    { inputs: ['[1]', '0'], expected: '-1' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[3,1]', '1'], expected: '1' },
    { inputs: ['[1,3]', '3'], expected: '1' },
    { inputs: ['[5,1,3]', '5'], expected: '0' },
    { inputs: ['[5,1,3]', '3'], expected: '2' },
    { inputs: ['[6,7,1,2,3,4,5]', '4'], expected: '5' },
    { inputs: ['[]', '5'], expected: '-1' },
  ],
  editorial_md: `## Intuition
A rotated sorted array can be split at the pivot into two sorted halves. Any midpoint binary search has the property that at least one of \`[lo, mid]\` or \`[mid, hi]\` is fully sorted — we identify which by comparing values at the boundaries, then check whether the target lies in the sorted half. If yes, restrict to that half; if no, the target must live in the other half. Either way, we halve the search range every step.

## Approach
1. \`lo = 0\`, \`hi = n - 1\`.
2. While \`lo <= hi\`:
   - \`mid = (lo + hi) / 2\`.
   - If \`nums[mid] == target\`, return \`mid\`.
   - If \`nums[lo] <= nums[mid]\` (left half sorted):
     - If \`nums[lo] <= target < nums[mid]\`, recurse left: \`hi = mid - 1\`.
     - Else \`lo = mid + 1\`.
   - Else (right half sorted):
     - If \`nums[mid] < target <= nums[hi]\`, recurse right: \`lo = mid + 1\`.
     - Else \`hi = mid - 1\`.
3. Return \`-1\` if the loop finishes.

The decision at each step uses constant work, so the algorithm runs in O(log n).

## Complexity
- Time: O(log n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def searchRotated(self, nums, target):
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target: return mid
            if nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]: hi = mid - 1
                else: lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]: lo = mid + 1
                else: hi = mid - 1
        return -1
`,
    javascript: `class Solution {
    searchRotated(nums, target) {
        let lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] === target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return -1;
    }
}
`,
    java: `class Solution {
    public int searchRotated(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int searchRotated(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return -1;
    }
};
`,
  },
});

// 49. sorted-rotated-ii (with duplicates)
add({
  id: 'sorted-rotated-ii',
  method_name: 'searchRotatedII',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'bool',
  pattern: 'Binary search with duplicate side-trim',
  description: '<p>Same problem as Sorted-Rotated, but values may repeat. Return <code>true</code> if the target is present, else <code>false</code>. Worst case O(n) because duplicates can disambiguate sides only by walking them off.</p>',
  hints: [
    'When nums[lo] == nums[mid] == nums[hi], we cannot tell which half is sorted.',
    'In that case, shrink both ends: lo++, hi--.',
    'Otherwise apply the sorted-half logic from the distinct case.',
    'Average remains O(log n); worst case O(n) when many duplicates.',
    'Boolean return — we only need existence.',
  ],
  test_cases: [
    { inputs: ['[2,5,6,0,0,1,2]', '0'], expected: 'true' },
    { inputs: ['[2,5,6,0,0,1,2]', '3'], expected: 'false' },
    { inputs: ['[1,0,1,1,1]', '0'], expected: 'true' },
    { inputs: ['[1,1,1,1,1]', '1'], expected: 'true' },
    { inputs: ['[1,1,1,1,1]', '2'], expected: 'false' },
    { inputs: ['[]', '5'], expected: 'false' },
    { inputs: ['[1]', '1'], expected: 'true' },
    { inputs: ['[1,1,1,2,1]', '2'], expected: 'true' },
    { inputs: ['[3,1]', '3'], expected: 'true' },
    { inputs: ['[1,3,1,1,1]', '3'], expected: 'true' },
  ],
  editorial_md: `## Intuition
With duplicates, the trick of "compare \`nums[lo]\` to \`nums[mid]\` to decide which half is sorted" sometimes fails: when \`nums[lo] == nums[mid] == nums[hi]\` we can't tell. The remedy is to shrink \`lo\` and \`hi\` by one whenever that ambiguous case occurs — this can happen at most \`n\` times total, so the worst case becomes O(n) but the average remains O(log n).

## Approach
1. \`lo = 0\`, \`hi = n - 1\`.
2. While \`lo <= hi\`:
   - \`mid = (lo + hi) / 2\`.
   - If \`nums[mid] == target\`, return \`true\`.
   - If \`nums[lo] == nums[mid] == nums[hi]\`: shrink — \`lo++\`, \`hi--\`.
   - Else if \`nums[lo] <= nums[mid]\` (left sorted):
     - If \`nums[lo] <= target < nums[mid]\`, \`hi = mid - 1\`; else \`lo = mid + 1\`.
   - Else (right sorted):
     - If \`nums[mid] < target <= nums[hi]\`, \`lo = mid + 1\`; else \`hi = mid - 1\`.
3. Return \`false\` if the loop finishes.

The "shrink" step is what makes the worst case O(n); when only a few duplicates appear it almost never fires.

## Complexity
- Time: average O(log n), worst case O(n).
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def searchRotatedII(self, nums, target):
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target: return True
            if nums[lo] == nums[mid] == nums[hi]:
                lo += 1; hi -= 1
            elif nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]: hi = mid - 1
                else: lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]: lo = mid + 1
                else: hi = mid - 1
        return False
`,
    javascript: `class Solution {
    searchRotatedII(nums, target) {
        let lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] === target) return true;
            if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return false;
    }
}
`,
    java: `class Solution {
    public boolean searchRotatedII(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return false;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    bool searchRotatedII(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }
            else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return false;
    }
};
`,
  },
});

// 50. first-negative-in-every-window
add({
  id: 'first-negative-in-every-window',
  method_name: 'firstNegativeInWindow',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'List[int]',
  pattern: 'Monotonic deque of negative indices',
  description: '<p>Given an integer array and a window size <code>k</code>, return a list where the i-th element is the first negative number in the window starting at index <code>i</code>. If a window has no negative number, write <code>0</code>.</p>',
  hints: [
    'Maintain a deque of indices of negative values currently in the window.',
    'When the window slides, remove indices that fall outside.',
    'Append the new index if its value is negative.',
    'The front of the deque is the first negative; if empty, write 0.',
    'O(n) amortised.',
  ],
  test_cases: [
    { inputs: ['[-8,2,3,-6,10]', '2'], expected: '[-8,0,-6,-6]' },
    { inputs: ['[12,-1,-7,8,-15,30,16,28]', '3'], expected: '[-1,-1,-7,-15,-15,0]' },
    { inputs: ['[1,2,3,4]', '2'], expected: '[0,0,0]' },
    { inputs: ['[-1,-2,-3,-4]', '2'], expected: '[-1,-2,-3]' },
    { inputs: ['[1]', '1'], expected: '[0]' },
    { inputs: ['[-1]', '1'], expected: '[-1]' },
    { inputs: ['[1,-1,2,-2,3,-3]', '3'], expected: '[-1,-1,-2,-2]' },
    { inputs: ['[1,2,-3,4,5]', '3'], expected: '[-3,-3,-3]' },
    { inputs: ['[-5,-4,-3,-2,-1]', '3'], expected: '[-5,-4,-3]' },
    { inputs: ['[10,20,30]', '1'], expected: '[0,0,0]' },
  ],
  editorial_md: `## Intuition
A sliding window of size \`k\` shifts by one each step. The first negative in any window is the leftmost negative index that still lies inside the window — exactly what a deque of negative indices, kept in sorted order, gives us in O(1) per step. As the window slides, we evict front indices that fell outside and push newly-arrived negatives at the back.

## Approach
1. Maintain a deque \`dq\` of indices of negative values currently in the window.
2. For \`i\` from 0 to \`n - 1\`:
   - If \`nums[i] < 0\`, append \`i\` to the back of \`dq\`.
   - If the front index \`<= i - k\`, pop it (it has exited the window).
   - Once \`i >= k - 1\`, the window is full — append to the output: \`nums[dq[0]]\` if \`dq\` is non-empty, else \`0\`.
3. Return the output list of length \`n - k + 1\`.

Every index enters and leaves the deque at most once, giving O(n) total time.

## Complexity
- Time: O(n).
- Space: O(k).`,
  solutions: {
    python: `from collections import deque
class Solution:
    def firstNegativeInWindow(self, nums, k):
        n = len(nums)
        dq = deque()
        out = []
        for i in range(n):
            if nums[i] < 0: dq.append(i)
            while dq and dq[0] <= i - k: dq.popleft()
            if i >= k - 1:
                out.append(nums[dq[0]] if dq else 0)
        return out
`,
    javascript: `class Solution {
    firstNegativeInWindow(nums, k) {
        const n = nums.length, dq = [], out = [];
        for (let i = 0; i < n; i++) {
            if (nums[i] < 0) dq.push(i);
            while (dq.length && dq[0] <= i - k) dq.shift();
            if (i >= k - 1) out.push(dq.length ? nums[dq[0]] : 0);
        }
        return out;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[] firstNegativeInWindow(int[] nums, int k) {
        int n = nums.length;
        Deque<Integer> dq = new ArrayDeque<>();
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (nums[i] < 0) dq.offerLast(i);
            while (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
            if (i >= k - 1) out.add(dq.isEmpty() ? 0 : nums[dq.peekFirst()]);
        }
        int[] arr = new int[out.size()];
        for (int i = 0; i < out.size(); i++) arr[i] = out.get(i);
        return arr;
    }
}
`,
    cpp: `#include <vector>
#include <deque>
using namespace std;
class Solution {
public:
    vector<int> firstNegativeInWindow(vector<int>& nums, int k) {
        int n = nums.size();
        deque<int> dq;
        vector<int> out;
        for (int i = 0; i < n; i++) {
            if (nums[i] < 0) dq.push_back(i);
            while (!dq.empty() && dq.front() <= i - k) dq.pop_front();
            if (i >= k - 1) out.push_back(dq.empty() ? 0 : nums[dq.front()]);
        }
        return out;
    }
};
`,
  },
});

// 51. chocolate-distribution
add({
  id: 'chocolate-distribution',
  method_name: 'findMinDiff',
  params: [{ name: 'arr', type: 'List[int]' }, { name: 'm', type: 'int' }],
  return_type: 'int',
  pattern: 'Sort + sliding window',
  description: '<p>Given an array of chocolate-packet sizes and an integer <code>m</code>, distribute one packet to each of <code>m</code> students such that the difference between the maximum and minimum packet sizes given is minimised. Return that minimum difference. If <code>m</code> is 0 or greater than <code>n</code>, return 0.</p>',
  hints: [
    'After sorting, the m chosen packets are contiguous in the sorted order.',
    'Slide a window of size m and track the smallest max - min.',
    'O(n log n) for sort + O(n) for sweep.',
    'Handle edge cases: m == 0 or m > n -> return 0.',
    'Difference for window [i, i + m - 1] is arr[i + m - 1] - arr[i].',
  ],
  test_cases: [
    { inputs: ['[7,3,2,4,9,12,56]', '3'], expected: '2' },
    { inputs: ['[3,4,1,9,56,7,9,12]', '5'], expected: '6' },
    { inputs: ['[12,4,7,9,2,23,25,41,30,40,28,42,30,44,48,43,50]', '7'], expected: '10' },
    { inputs: ['[1]', '1'], expected: '0' },
    { inputs: ['[1,2,3,4,5]', '5'], expected: '4' },
    { inputs: ['[]', '0'], expected: '0' },
    { inputs: ['[5,5,5,5]', '3'], expected: '0' },
    { inputs: ['[1,5,9,13]', '2'], expected: '4' },
    { inputs: ['[1,5,9,13]', '0'], expected: '0' },
    { inputs: ['[1,5,9,13]', '10'], expected: '0' },
  ],
  editorial_md: `## Intuition
To minimise the max-min of the chosen \`m\` packets, the chosen packets should be as close in value as possible — which means they should be consecutive in sorted order. Sorting reduces the problem to: scan every window of size \`m\` over the sorted array and pick the smallest \`window_end - window_start\`.

## Approach
1. Handle edge cases: if \`m == 0\`, \`n == 0\`, or \`m > n\`, return 0.
2. Sort the array ascending.
3. Initialise \`best = +inf\`.
4. For \`i\` from 0 to \`n - m\`:
   - \`diff = arr[i + m - 1] - arr[i]\`.
   - Update \`best = min(best, diff)\`.
5. Return \`best\`.

Why must the chosen packets be consecutive in sorted order? If they weren't, swapping in any closer neighbour can only reduce the spread — exchange argument.

## Complexity
- Time: O(n log n).
- Space: O(1) extra (sort uses O(log n) stack).`,
  solutions: {
    python: `class Solution:
    def findMinDiff(self, arr, m):
        n = len(arr)
        if m == 0 or n == 0 or m > n: return 0
        arr.sort()
        best = float('inf')
        for i in range(n - m + 1):
            diff = arr[i + m - 1] - arr[i]
            if diff < best: best = diff
        return best
`,
    javascript: `class Solution {
    findMinDiff(arr, m) {
        const n = arr.length;
        if (m === 0 || n === 0 || m > n) return 0;
        arr.sort((a, b) => a - b);
        let best = Infinity;
        for (let i = 0; i <= n - m; i++) {
            const diff = arr[i + m - 1] - arr[i];
            if (diff < best) best = diff;
        }
        return best;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int findMinDiff(int[] arr, int m) {
        int n = arr.length;
        if (m == 0 || n == 0 || m > n) return 0;
        Arrays.sort(arr);
        int best = Integer.MAX_VALUE;
        for (int i = 0; i <= n - m; i++) {
            int diff = arr[i + m - 1] - arr[i];
            if (diff < best) best = diff;
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
class Solution {
public:
    int findMinDiff(vector<int>& arr, int m) {
        int n = arr.size();
        if (m == 0 || n == 0 || m > n) return 0;
        sort(arr.begin(), arr.end());
        int best = INT_MAX;
        for (int i = 0; i + m - 1 < n; i++) {
            int diff = arr[i + m - 1] - arr[i];
            if (diff < best) best = diff;
        }
        return best;
    }
};
`,
  },
});

// 52. maximize-ones — Longest subarray of 1s with at most k flips
add({
  id: 'maximize-ones',
  method_name: 'longestOnes',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window with bounded zero-count',
  description: '<p>Given a binary array and an integer <code>k</code>, return the length of the longest contiguous subarray containing only 1s after flipping at most <code>k</code> zeros to 1s.</p>',
  hints: [
    'Slide a window [l, r] with at most k zeros inside.',
    'Expand r. If the zero count exceeds k, advance l until valid.',
    'Track max window size.',
    'Each index enters and exits the window at most once -> O(n).',
    'Equivalent: longest substring with at most k zeros.',
  ],
  test_cases: [
    { inputs: ['[1,1,1,0,0,0,1,1,1,1,0]', '2'], expected: '6' },
    { inputs: ['[0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1]', '3'], expected: '10' },
    { inputs: ['[1,1,1,1]', '0'], expected: '4' },
    { inputs: ['[0,0,0,0]', '0'], expected: '0' },
    { inputs: ['[0,0,0,0]', '2'], expected: '2' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[1]', '0'], expected: '1' },
    { inputs: ['[0]', '0'], expected: '0' },
    { inputs: ['[0,0,1,1,1,0,0]', '0'], expected: '3' },
    { inputs: ['[1,0,1,0,1,0,1]', '2'], expected: '5' },
  ],
  editorial_md: `## Intuition
"Longest run of 1s after at most k flips" reformulates to "longest window with at most k zeros". A sliding window expands its right edge to swallow more elements, contracts its left edge when the zero count exceeds k, and tracks the maximum width along the way. Each index enters and leaves the window once, giving O(n).

## Approach
1. \`l = 0\`, \`zeros = 0\`, \`best = 0\`.
2. For \`r\` in \`[0, n)\`:
   - If \`nums[r] == 0\`, \`zeros++\`.
   - While \`zeros > k\`:
     - If \`nums[l] == 0\`, \`zeros--\`.
     - \`l++\`.
   - Update \`best = max(best, r - l + 1)\`.
3. Return \`best\`.

The window invariant "\`zeros <= k\`" is what keeps the subarray legal. When the right side breaks it, we shrink from the left until it holds again.

## Complexity
- Time: O(n) amortised.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def longestOnes(self, nums, k):
        l = 0; zeros = 0; best = 0
        for r in range(len(nums)):
            if nums[r] == 0: zeros += 1
            while zeros > k:
                if nums[l] == 0: zeros -= 1
                l += 1
            best = max(best, r - l + 1)
        return best
`,
    javascript: `class Solution {
    longestOnes(nums, k) {
        let l = 0, zeros = 0, best = 0;
        for (let r = 0; r < nums.length; r++) {
            if (nums[r] === 0) zeros++;
            while (zeros > k) {
                if (nums[l] === 0) zeros--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    java: `class Solution {
    public int longestOnes(int[] nums, int k) {
        int l = 0, zeros = 0, best = 0;
        for (int r = 0; r < nums.length; r++) {
            if (nums[r] == 0) zeros++;
            while (zeros > k) { if (nums[l] == 0) zeros--; l++; }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int longestOnes(vector<int>& nums, int k) {
        int l = 0, zeros = 0, best = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            if (nums[r] == 0) zeros++;
            while (zeros > k) { if (nums[l] == 0) zeros--; l++; }
            best = max(best, r - l + 1);
        }
        return best;
    }
};
`,
  },
});

// 53. equal-substring-with-cost-less-than-k
add({
  id: 'equal-substring-with-cost-less-than-k',
  method_name: 'equalSubstring',
  params: [{ name: 's', type: 'str' }, { name: 't', type: 'str' }, { name: 'maxCost', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window with running cost',
  description: '<p>Given equal-length strings <code>s</code> and <code>t</code>, the cost to change <code>s[i]</code> into <code>t[i]</code> is <code>|s[i] - t[i]|</code>. Return the maximum length of a substring of <code>s</code> that can be changed into the corresponding substring of <code>t</code> with total cost at most <code>maxCost</code>.</p>',
  hints: [
    'Precompute diff[i] = |s[i] - t[i]|.',
    'Find the longest subarray of diff with sum <= maxCost.',
    'Sliding window with l, r and running sum.',
    'Expand r; while sum > maxCost, advance l and subtract.',
    'Track the longest window size seen.',
  ],
  test_cases: [
    { inputs: ['"abcd"', '"bcdf"', '3'], expected: '3' },
    { inputs: ['"abcd"', '"cdef"', '3'], expected: '1' },
    { inputs: ['"abcd"', '"acde"', '0'], expected: '1' },
    { inputs: ['"krrgw"', '"zjxss"', '19'], expected: '2' },
    { inputs: ['""', '""', '5'], expected: '0' },
    { inputs: ['"a"', '"a"', '0'], expected: '1' },
    { inputs: ['"a"', '"b"', '0'], expected: '0' },
    { inputs: ['"a"', '"b"', '1'], expected: '1' },
    { inputs: ['"abc"', '"abc"', '0'], expected: '3' },
    { inputs: ['"abcd"', '"acdb"', '4'], expected: '4' },
  ],
  editorial_md: `## Intuition
Each character pair has a fixed conversion cost \`|s[i] - t[i]|\`. The substring of \`s\` we can transform is a contiguous range whose total cost stays within \`maxCost\`. That is exactly "longest subarray with sum at most K" on the cost array, solved by a sliding window.

## Approach
1. Build the cost array \`diff[i] = abs(ord(s[i]) - ord(t[i]))\`.
2. Slide a window with pointers \`l\` and \`r\` and a running sum \`cur\`.
3. For each \`r\`:
   - Add \`diff[r]\` to \`cur\`.
   - While \`cur > maxCost\`, subtract \`diff[l]\` and advance \`l\`.
   - Update best length \`r - l + 1\`.
4. Return the best length.

Equivalent without building a separate \`diff\` array: compute the per-index cost on the fly. Each index enters and leaves the window at most once, so the algorithm is amortised O(n).

## Complexity
- Time: O(n).
- Space: O(1) (or O(n) if a separate diff array is built).`,
  solutions: {
    python: `class Solution:
    def equalSubstring(self, s, t, maxCost):
        l = 0; cur = 0; best = 0
        for r in range(len(s)):
            cur += abs(ord(s[r]) - ord(t[r]))
            while cur > maxCost:
                cur -= abs(ord(s[l]) - ord(t[l]))
                l += 1
            best = max(best, r - l + 1)
        return best
`,
    javascript: `class Solution {
    equalSubstring(s, t, maxCost) {
        let l = 0, cur = 0, best = 0;
        for (let r = 0; r < s.length; r++) {
            cur += Math.abs(s.charCodeAt(r) - t.charCodeAt(r));
            while (cur > maxCost) {
                cur -= Math.abs(s.charCodeAt(l) - t.charCodeAt(l));
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    java: `class Solution {
    public int equalSubstring(String s, String t, int maxCost) {
        int l = 0, cur = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            cur += Math.abs(s.charAt(r) - t.charAt(r));
            while (cur > maxCost) { cur -= Math.abs(s.charAt(l) - t.charAt(l)); l++; }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}
`,
    cpp: `#include <string>
#include <algorithm>
#include <cstdlib>
using namespace std;
class Solution {
public:
    int equalSubstring(string s, string t, int maxCost) {
        int l = 0, cur = 0, best = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            cur += abs(s[r] - t[r]);
            while (cur > maxCost) { cur -= abs(s[l] - t[l]); l++; }
            best = max(best, r - l + 1);
        }
        return best;
    }
};
`,
  },
});

// 54. subarray-with-given-sum (positive-only array)
add({
  id: 'subarray-with-given-sum',
  method_name: 'subarraySum',
  params: [{ name: 'arr', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'List[int]',
  pattern: 'Sliding window on positives',
  description: '<p>Given an array of positive integers and a target sum, return the 1-indexed <code>[start, end]</code> indices of the first contiguous subarray whose elements sum to the target. If none exists, return <code>[-1]</code>.</p>',
  hints: [
    'All numbers are positive — expand right to grow the window sum, shrink left when it overshoots.',
    'Track current sum.',
    'When current sum == target, return [left + 1, right + 1].',
    'If we walk past the end without finding, return [-1].',
    'O(n) amortised — each index enters/exits at most once.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,7,5]', '12'], expected: '[2,4]' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '15'], expected: '[1,5]' },
    { inputs: ['[1,2,3,4,5]', '9'], expected: '[2,4]' },
    { inputs: ['[1,2,3]', '100'], expected: '[-1]' },
    { inputs: ['[]', '5'], expected: '[-1]' },
    { inputs: ['[5]', '5'], expected: '[1,1]' },
    { inputs: ['[5]', '6'], expected: '[-1]' },
    { inputs: ['[10,5,2,7,1,9]', '15'], expected: '[1,2]' },
    { inputs: ['[1,1,1,1,1]', '3'], expected: '[1,3]' },
    { inputs: ['[2,4,6,8,10]', '14'], expected: '[3,4]' },
  ],
  editorial_md: `## Intuition
With strictly positive numbers, the running sum of a window is monotone in both directions: adding an element increases the sum, removing one decreases it. So a two-pointer sliding window can scan left to right, shrinking from the left whenever the sum exceeds the target, and stopping when the sum matches. Negative numbers would break this monotonicity and require the prefix-sum + hash-map approach instead.

## Approach
1. \`l = 0\`, \`cur = 0\`.
2. For \`r\` from 0 to \`n - 1\`:
   - \`cur += arr[r]\`.
   - While \`cur > target\` and \`l <= r\`: \`cur -= arr[l]\`, \`l++\`.
   - If \`cur == target\`, return \`[l + 1, r + 1]\` (1-indexed).
3. If the loop ends without a match, return \`[-1]\`.

The "1-indexed" return is a quirk of the canonical GfG version of this problem; adjust if your platform uses 0-indexing.

## Complexity
- Time: O(n) amortised.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def subarraySum(self, arr, target):
        l = 0; cur = 0
        for r in range(len(arr)):
            cur += arr[r]
            while cur > target and l <= r:
                cur -= arr[l]; l += 1
            if cur == target:
                return [l + 1, r + 1]
        return [-1]
`,
    javascript: `class Solution {
    subarraySum(arr, target) {
        let l = 0, cur = 0;
        for (let r = 0; r < arr.length; r++) {
            cur += arr[r];
            while (cur > target && l <= r) { cur -= arr[l]; l++; }
            if (cur === target) return [l + 1, r + 1];
        }
        return [-1];
    }
}
`,
    java: `class Solution {
    public int[] subarraySum(int[] arr, int target) {
        int l = 0; long cur = 0;
        for (int r = 0; r < arr.length; r++) {
            cur += arr[r];
            while (cur > target && l <= r) { cur -= arr[l]; l++; }
            if (cur == target) return new int[]{l + 1, r + 1};
        }
        return new int[]{-1};
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> subarraySum(vector<int>& arr, int target) {
        int l = 0; long long cur = 0;
        for (int r = 0; r < (int)arr.size(); r++) {
            cur += arr[r];
            while (cur > target && l <= r) { cur -= arr[l]; l++; }
            if (cur == target) return {l + 1, r + 1};
        }
        return {-1};
    }
};
`,
  },
});

// 55. smallest-subarray-with-sum-greater-than-x
add({
  id: 'smallest-subarray-with-sum-greater-than-x',
  method_name: 'smallestSubWithSum',
  params: [{ name: 'arr', type: 'List[int]' }, { name: 'x', type: 'int' }],
  return_type: 'int',
  pattern: 'Sliding window on positives',
  description: '<p>Given an array of positive integers and a target value <code>x</code>, return the length of the smallest contiguous subarray whose sum is strictly greater than <code>x</code>. Return 0 if no such subarray exists.</p>',
  hints: [
    'Slide a window. Expand right to grow sum.',
    'When sum > x, shrink left while still > x and record window length.',
    'Track minimum length.',
    'Initialise answer to INT_MAX; return 0 if untouched.',
    'O(n) amortised.',
  ],
  test_cases: [
    { inputs: ['[1,4,45,6,0,19]', '51'], expected: '3' },
    { inputs: ['[1,10,5,2,7]', '9'], expected: '1' },
    { inputs: ['[1,11,100,1,0,200,3,2,1,250]', '280'], expected: '4' },
    { inputs: ['[1,2,4]', '8'], expected: '0' },
    { inputs: ['[]', '5'], expected: '0' },
    { inputs: ['[100]', '50'], expected: '1' },
    { inputs: ['[100]', '100'], expected: '0' },
    { inputs: ['[1,2,3,4,5]', '11'], expected: '3' },
    { inputs: ['[10,5,5,5,10]', '14'], expected: '2' },
    { inputs: ['[1,1,1,1,1,1,1,1,1,1]', '5'], expected: '6' },
  ],
  editorial_md: `## Intuition
Since all elements are positive, extending the window always raises the sum and contracting it always lowers the sum. This lets the two-pointer trick find the smallest window whose sum exceeds \`x\` in linear time: grow the window until the sum exceeds \`x\`, then shrink from the left as far as possible while still exceeding \`x\`, recording the minimum length each time the threshold is crossed.

## Approach
1. \`l = 0\`, \`cur = 0\`, \`best = INF\`.
2. For \`r\` from 0 to \`n - 1\`:
   - \`cur += arr[r]\`.
   - While \`cur > x\`:
     - \`best = min(best, r - l + 1)\`.
     - \`cur -= arr[l]\`; \`l++\`.
3. Return \`best\` if \`best != INF\`, else 0.

Negative numbers would break the monotonic shrink — the prefix-sum + sorted-deque trick (Leetcode 862) is the right tool for that variant.

## Complexity
- Time: O(n) amortised.
- Space: O(1).`,
  solutions: {
    python: `class Solution:
    def smallestSubWithSum(self, arr, x):
        l = 0; cur = 0; best = float('inf')
        for r in range(len(arr)):
            cur += arr[r]
            while cur > x:
                best = min(best, r - l + 1)
                cur -= arr[l]; l += 1
        return 0 if best == float('inf') else best
`,
    javascript: `class Solution {
    smallestSubWithSum(arr, x) {
        let l = 0, cur = 0, best = Infinity;
        for (let r = 0; r < arr.length; r++) {
            cur += arr[r];
            while (cur > x) {
                best = Math.min(best, r - l + 1);
                cur -= arr[l]; l++;
            }
        }
        return best === Infinity ? 0 : best;
    }
}
`,
    java: `class Solution {
    public int smallestSubWithSum(int[] arr, int x) {
        int l = 0; long cur = 0; int best = Integer.MAX_VALUE;
        for (int r = 0; r < arr.length; r++) {
            cur += arr[r];
            while (cur > x) {
                best = Math.min(best, r - l + 1);
                cur -= arr[l]; l++;
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }
}
`,
    cpp: `#include <vector>
#include <climits>
#include <algorithm>
using namespace std;
class Solution {
public:
    int smallestSubWithSum(vector<int>& arr, int x) {
        int l = 0; long long cur = 0; int best = INT_MAX;
        for (int r = 0; r < (int)arr.size(); r++) {
            cur += arr[r];
            while (cur > x) {
                best = min(best, r - l + 1);
                cur -= arr[l]; l++;
            }
        }
        return best == INT_MAX ? 0 : best;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-02-part5.json', JSON.stringify(entries, null, 2));
console.log('Wrote part5 with ' + entries.length + ' entries.');
