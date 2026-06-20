#!/usr/bin/env node
// Atomic splice: 4sum, 4sum-ii. (3sum-closest already present — skipped to avoid clobber.)
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function fourSumViz(') && src.includes('function fourSumCountViz(')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function fourSumViz() {
  const nums = [1, 0, -1, 0, -2, 2];
  const target = 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const n = sorted.length;
  const frames = [];

  frames.push({
    array: sorted,
    chip: [
      { label: 'nums', value: '[' + nums.join(',') + ']' },
      { label: 'target', value: String(target), tone: 'violet' },
      { label: 'goal', value: 'all unique quadruples summing to target', tone: 'violet' },
    ],
    caption: 'Sort first so duplicate skipping and two-pointer movement both become well-defined. After sorting [' + nums.join(',') + '] becomes [' + sorted.join(',') + ']. The strategy is two nested fixed indices (i, j) plus a two-pointer sweep (l, r) on the rest — total O(n^3).',
  });
  frames.push({
    array: sorted, pointers: {},
    chip: [
      { label: 'dedup rule', value: 'skip a[i] == a[i-1] at every level', tone: 'pink' },
      { label: 'why sort first', value: 'duplicates are then adjacent', tone: 'violet' },
    ],
    caption: 'The "unique quadruple" requirement is enforced by skipping a value whenever it equals the previous value at the same nesting level. Because the array is sorted, all duplicates are adjacent — a single == check per index is enough.',
  });

  const quads = [];

  for (let i = 0; i < n - 3; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) {
      frames.push({
        array: sorted, pointers: { i },
        chip: [
          { label: 'skip dup i', value: 'sorted[' + i + '] = sorted[' + (i - 1) + '] = ' + sorted[i], tone: 'pink' },
        ],
        caption: 'i lands on a repeat of the previous value — any quadruple starting here was already produced when i was at ' + (i - 1) + '. Skip.',
      });
      continue;
    }
    frames.push({
      array: sorted, pointers: { i },
      chip: [
        { label: 'i', value: i + ' (' + sorted[i] + ')', tone: 'violet' },
        { label: 'remaining target', value: String(target - sorted[i]) },
      ],
      caption: 'Fix the first element sorted[i] = ' + sorted[i] + '. Now find a triple in sorted[i+1..n-1] summing to ' + (target - sorted[i]) + '.',
    });

    for (let j = i + 1; j < n - 2; j++) {
      if (j > i + 1 && sorted[j] === sorted[j - 1]) {
        continue;
      }
      let l = j + 1, r = n - 1;
      const need = target - sorted[i] - sorted[j];
      frames.push({
        array: sorted, pointers: { i, j, l, r },
        chip: [
          { label: 'j', value: j + ' (' + sorted[j] + ')', tone: 'violet' },
          { label: 'two-pointer need', value: String(need), tone: 'pink' },
        ],
        caption: 'Fix the second element sorted[j] = ' + sorted[j] + '. The inner two-pointer sweep on l = ' + l + ', r = ' + r + ' must find pairs summing to ' + need + '.',
      });

      while (l < r) {
        const s = sorted[i] + sorted[j] + sorted[l] + sorted[r];
        if (s === target) {
          quads.push([sorted[i], sorted[j], sorted[l], sorted[r]]);
          frames.push({
            array: sorted, pointers: { i, j, l, r },
            chip: [
              { label: 'hit', value: '[' + sorted[i] + ',' + sorted[j] + ',' + sorted[l] + ',' + sorted[r] + ']', tone: 'pink' },
              { label: 'found', value: String(quads.length), tone: 'violet' },
            ],
            caption: 'Sum hits target ' + target + ' — record the quadruple. Then advance both l and r past their duplicate runs so we do not emit the same quadruple twice.',
          });
          l++; r--;
          while (l < r && sorted[l] === sorted[l - 1]) l++;
          while (l < r && sorted[r] === sorted[r + 1]) r--;
        } else if (s < target) {
          l++;
        } else {
          r--;
        }
      }
    }
  }

  frames.push({
    array: sorted, pointers: {},
    chip: [
      { label: 'why O(n^3)', value: 'two nested fixed + linear sweep', tone: 'violet' },
      { label: 'brute', value: 'O(n^4) over all 4-tuples', tone: 'pink' },
    ],
    caption: 'Brute force enumerates every 4-tuple in O(n^4) and dedupes after. The 2-pointer collapse drops the inner loop from O(n^2) to O(n), bringing the whole solve to O(n^3) — still polynomial but cubic in n.',
  });
  frames.push({
    array: sorted, pointers: {},
    chip: [
      { label: 'overflow watch', value: 'sum of 4 ints can exceed 32-bit', tone: 'pink' },
      { label: 'fix', value: 'use long / 64-bit in Java + C++', tone: 'violet' },
    ],
    caption: 'For LC constraints (|nums[i]| ≤ 1e9, n ≤ 200) the sum of four values can exceed Integer.MAX_VALUE. Cast to long (Java) or long long (C++) before comparing to target. Python and JS are immune by default.',
  });
  frames.push({
    array: sorted, pointers: {},
    chip: [
      { label: 'pruning', value: 'min/max bounds on i and j', tone: 'violet' },
      { label: 'speedup', value: '5-10x in worst-case inputs', tone: 'pink' },
    ],
    caption: 'Two cheap prunes: if sorted[i]*4 > target, no quadruple starting at i can ever reach target — break. If sorted[i] + sorted[n-1]*3 < target, this i is too small — continue. Same logic at the j level. Does not change the asymptotic but cuts large constants on adversarial inputs.',
  });
  frames.push({
    array: sorted, pointers: {},
    chip: [
      { label: 'answer count', value: String(quads.length), tone: 'pink' },
      { label: 'time', value: 'O(n^3)', tone: 'violet' },
      { label: 'space', value: 'O(1) extra', tone: 'violet' },
    ],
    caption: 'Found ' + quads.length + ' unique quadruples summing to ' + target + '. Time O(n^3) dominated by the i × j × two-pointer nesting. Space O(1) beyond the output list — sorting in place keeps the auxiliary footprint flat.',
  });

  return { renderer: 'array', title: '4Sum — sort + two fixed + two-pointer', frames };
}

function fourSumCountViz() {
  const A = [1, 2];
  const B = [-2, -1];
  const C = [-1, 2];
  const D = [0, 2];
  const frames = [];

  frames.push({
    array: [], pointers: {},
    chip: [
      { label: 'A', value: '[' + A.join(',') + ']' },
      { label: 'B', value: '[' + B.join(',') + ']' },
      { label: 'C', value: '[' + C.join(',') + ']' },
      { label: 'D', value: '[' + D.join(',') + ']' },
    ],
    caption: 'Count quadruples (i, j, k, l) with A[i] + B[j] + C[k] + D[l] = 0. Each array has length n ≤ 200, so naive O(n^4) is 1.6e9 — too slow. We split the four arrays into two halves and meet in the middle.',
  });
  frames.push({
    array: [], pointers: {},
    chip: [
      { label: 'idea', value: 'sum of (A,B) pairs + sum of (C,D) pairs = 0', tone: 'violet' },
      { label: 'reframe', value: 'how many (a+b) equal -(c+d)?', tone: 'pink' },
    ],
    caption: 'Rearrange: A[i] + B[j] = -(C[k] + D[l]). So if we knew the multiplicity of every possible (A,B) sum, we could iterate (C,D) pairs and look up the matching negated sum. That collapses O(n^4) into O(n^2 + n^2) = O(n^2).',
  });

  const ab = new Map();
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B.length; j++) {
      const s = A[i] + B[j];
      ab.set(s, (ab.get(s) || 0) + 1);
      frames.push({
        array: [], pointers: {},
        chip: [
          { label: 'A[' + i + ']+B[' + j + ']', value: A[i] + '+' + B[j] + '=' + s },
          { label: 'count[' + s + ']', value: String(ab.get(s)), tone: 'pink' },
        ],
        caption: 'Build the A+B sum counter. Each pair contributes its sum once; duplicate sums accumulate in the counter. Final size is at most n^2 distinct keys.',
      });
    }
  }

  frames.push({
    array: [], pointers: {},
    chip: [
      { label: 'AB sums', value: JSON.stringify(Object.fromEntries(ab)), tone: 'violet' },
    ],
    caption: 'Counter built. Every key is a possible A+B sum; the value is the count of (i, j) pairs producing it. Now sweep all (C, D) pairs and ask the counter how many AB pairs offset them.',
  });

  let count = 0;
  for (let k = 0; k < C.length; k++) {
    for (let l = 0; l < D.length; l++) {
      const s = C[k] + D[l];
      const hits = ab.get(-s) || 0;
      count += hits;
      frames.push({
        array: [], pointers: {},
        chip: [
          { label: 'C[' + k + ']+D[' + l + ']', value: C[k] + '+' + D[l] + '=' + s },
          { label: 'look up -(' + s + ')', value: 'hits ' + hits, tone: hits > 0 ? 'pink' : 'violet' },
          { label: 'running count', value: String(count) },
        ],
        caption: 'CD pair sums to ' + s + '. Ask the AB counter for -(' + s + ') = ' + (-s) + ': it appears ' + hits + ' time(s). Each AB pair pairs with this single CD pair to yield ' + hits + ' valid quadruples.',
      });
    }
  }

  frames.push({
    array: [], pointers: {},
    chip: [
      { label: 'why not one big hashmap', value: 'O(n^3) memory + still slow', tone: 'pink' },
      { label: 'half-split wins', value: 'O(n^2) time + space', tone: 'violet' },
    ],
    caption: 'A one-shot hashmap of all A+B+C triples would be O(n^3) — both time and memory. Splitting into two halves of two arrays each keeps both factors at O(n^2) — the meet-in-the-middle sweet spot.',
  });
  frames.push({
    array: [], pointers: {},
    chip: [
      { label: 'overflow', value: 'values can be ±2^28', tone: 'pink' },
      { label: 'fix', value: 'long in Java / long long in C++ for keys', tone: 'violet' },
    ],
    caption: 'LC constraint is |A[i]| ≤ 2^28. The pairwise sum stays in 32-bit, but if you ever switch to a sum of three or four values, promote to 64-bit. JS Number is safe up to 2^53; Python ints are arbitrary precision.',
  });
  frames.push({
    array: [], pointers: {},
    chip: [
      { label: 'count', value: String(count), tone: 'pink' },
      { label: 'time', value: 'O(n^2)', tone: 'violet' },
      { label: 'space', value: 'O(n^2)', tone: 'violet' },
    ],
    caption: 'Final answer: ' + count + ' valid quadruples. Time O(n^2) for the AB build plus O(n^2) for the CD sweep. Space O(n^2) for the counter — unavoidable since the worst case has n^2 distinct sums.',
  });

  return { renderer: 'array', title: '4Sum II — meet-in-the-middle hashmap', frames };
}

`;

const ENTRY_BLOCK = `  '4sum': {
    tags: ['array', 'two-pointers', 'sorting', 'hashmap'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple', 'bloomberg', 'adobe'],
    viz: fourSumViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        out = []
        for i in range(n - 3):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            if nums[i] * 4 > target and nums[i] > 0:
                break
            for j in range(i + 1, n - 2):
                if j > i + 1 and nums[j] == nums[j - 1]:
                    continue
                l, r = j + 1, n - 1
                need = target - nums[i] - nums[j]
                while l < r:
                    s = nums[l] + nums[r]
                    if s == need:
                        out.append([nums[i], nums[j], nums[l], nums[r]])
                        l += 1
                        r -= 1
                        while l < r and nums[l] == nums[l - 1]:
                            l += 1
                        while l < r and nums[r] == nums[r + 1]:
                            r -= 1
                    elif s < need:
                        l += 1
                    else:
                        r -= 1
        return out\`,
        complexity: { time: 'O(n^3)', space: 'O(1) extra (excl. output)' },
        approach: 'Sort, then fix two outer indices i and j and run a two-pointer sweep on the rest. Dedup at every level by skipping consecutive equals — works because sorting makes duplicates adjacent. The break on nums[i]*4 > target is a cheap prune for the case where the smallest possible sum already overshoots a positive target.',
      },
      javascript: {
        code: \`function fourSum(nums, target) {
  nums.sort((a, b) => a - b);
  const n = nums.length;
  const out = [];
  for (let i = 0; i < n - 3; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    for (let j = i + 1; j < n - 2; j++) {
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;
      let l = j + 1, r = n - 1;
      const need = target - nums[i] - nums[j];
      while (l < r) {
        const s = nums[l] + nums[r];
        if (s === need) {
          out.push([nums[i], nums[j], nums[l], nums[r]]);
          l++; r--;
          while (l < r && nums[l] === nums[l - 1]) l++;
          while (l < r && nums[r] === nums[r + 1]) r--;
        } else if (s < need) {
          l++;
        } else {
          r--;
        }
      }
    }
  }
  return out;
}\`,
        complexity: { time: 'O(n^3)', space: 'O(1) extra' },
        approach: 'Numeric comparator on sort — the default lexicographic sort would break the two-pointer invariant. JS numbers are 64-bit doubles so the pairwise sum is safe within LC bounds.',
      },
      java: {
        code: \`class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        int n = nums.length;
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int l = j + 1, r = n - 1;
                long need = (long) target - nums[i] - nums[j];
                while (l < r) {
                    long s = (long) nums[l] + nums[r];
                    if (s == need) {
                        out.add(Arrays.asList(nums[i], nums[j], nums[l], nums[r]));
                        l++; r--;
                        while (l < r && nums[l] == nums[l - 1]) l++;
                        while (l < r && nums[r] == nums[r + 1]) r--;
                    } else if (s < need) {
                        l++;
                    } else {
                        r--;
                    }
                }
            }
        }
        return out;
    }
}\`,
        complexity: { time: 'O(n^3)', space: 'O(1) extra' },
        approach: 'Promote intermediate sums to long — with |nums[i]| ≤ 1e9 the sum of four ints overflows 32-bit. Cast once at the start of each subtraction/addition chain so the comparison is in 64-bit.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        vector<vector<int>> out;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                int l = j + 1, r = n - 1;
                long long need = (long long) target - nums[i] - nums[j];
                while (l < r) {
                    long long s = (long long) nums[l] + nums[r];
                    if (s == need) {
                        out.push_back({nums[i], nums[j], nums[l], nums[r]});
                        l++; r--;
                        while (l < r && nums[l] == nums[l - 1]) l++;
                        while (l < r && nums[r] == nums[r + 1]) r--;
                    } else if (s < need) {
                        l++;
                    } else {
                        r--;
                    }
                }
            }
        }
        return out;
    }
};\`,
        complexity: { time: 'O(n^3)', space: 'O(1) extra' },
        approach: 'long long for the target arithmetic. The vector push for each hit is the only dynamic allocation; everything else operates in place on the sorted input.',
      },
      c: {
        code: \`#include <stdlib.h>

static int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

int** fourSum(int* nums, int numsSize, int target, int* returnSize, int** returnColumnSizes) {
    qsort(nums, numsSize, sizeof(int), cmp_int);
    int cap = 16, sz = 0;
    int** out = malloc(sizeof(int*) * cap);
    int* cols = malloc(sizeof(int) * cap);
    for (int i = 0; i < numsSize - 3; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        for (int j = i + 1; j < numsSize - 2; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) continue;
            int l = j + 1, r = numsSize - 1;
            long long need = (long long) target - nums[i] - nums[j];
            while (l < r) {
                long long s = (long long) nums[l] + nums[r];
                if (s == need) {
                    if (sz == cap) {
                        cap *= 2;
                        out = realloc(out, sizeof(int*) * cap);
                        cols = realloc(cols, sizeof(int) * cap);
                    }
                    out[sz] = malloc(sizeof(int) * 4);
                    out[sz][0] = nums[i]; out[sz][1] = nums[j];
                    out[sz][2] = nums[l]; out[sz][3] = nums[r];
                    cols[sz] = 4;
                    sz++;
                    l++; r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                    while (l < r && nums[r] == nums[r + 1]) r--;
                } else if (s < need) {
                    l++;
                } else {
                    r--;
                }
            }
        }
    }
    *returnSize = sz;
    *returnColumnSizes = cols;
    return out;
}\`,
        complexity: { time: 'O(n^3)', space: 'O(k) for k quadruples' },
        approach: 'Manual realloc growth doubles the output buffer; same dedup pattern via consecutive-equal skips. long long for the target arithmetic guards against 32-bit overflow at the LC bounds.',
      },
      go: {
        code: \`func fourSum(nums []int, target int) [][]int {
    sort.Ints(nums)
    n := len(nums)
    out := [][]int{}
    for i := 0; i < n-3; i++ {
        if i > 0 && nums[i] == nums[i-1] {
            continue
        }
        for j := i + 1; j < n-2; j++ {
            if j > i+1 && nums[j] == nums[j-1] {
                continue
            }
            l, r := j+1, n-1
            need := target - nums[i] - nums[j]
            for l < r {
                s := nums[l] + nums[r]
                if s == need {
                    out = append(out, []int{nums[i], nums[j], nums[l], nums[r]})
                    l++
                    r--
                    for l < r && nums[l] == nums[l-1] {
                        l++
                    }
                    for l < r && nums[r] == nums[r+1] {
                        r--
                    }
                } else if s < need {
                    l++
                } else {
                    r--
                }
            }
        }
    }
    return out
}\`,
        complexity: { time: 'O(n^3)', space: 'O(1) extra' },
        approach: 'Go int is 64-bit on most platforms so overflow is not a concern at LC bounds. Identical pattern: sort, two fixed indices with dedup skips, two-pointer inner sweep.',
      },
    },
  },
  '4sum-ii': {
    tags: ['array', 'hashmap', 'meet-in-the-middle'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple', 'bloomberg'],
    viz: fourSumCountViz(),
    solutions: {
      python: {
        code: \`from collections import Counter

class Solution:
    def fourSumCount(self, nums1: List[int], nums2: List[int], nums3: List[int], nums4: List[int]) -> int:
        ab = Counter()
        for a in nums1:
            for b in nums2:
                ab[a + b] += 1
        count = 0
        for c in nums3:
            for d in nums4:
                count += ab.get(-(c + d), 0)
        return count\`,
        complexity: { time: 'O(n^2)', space: 'O(n^2)' },
        approach: 'Split the four arrays into halves of two. Build a counter of all (A, B) pair sums, then iterate every (C, D) pair and look up the count of (A+B) sums equal to -(C+D). Each match contributes that count to the answer because every AB pair pairs with this single CD pair.',
      },
      javascript: {
        code: \`function fourSumCount(nums1, nums2, nums3, nums4) {
  const ab = new Map();
  for (const a of nums1) {
    for (const b of nums2) {
      const s = a + b;
      ab.set(s, (ab.get(s) || 0) + 1);
    }
  }
  let count = 0;
  for (const c of nums3) {
    for (const d of nums4) {
      count += ab.get(-(c + d)) || 0;
    }
  }
  return count;
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n^2)' },
        approach: 'Map keyed on the AB sum, value = multiplicity. JS Number handles the sum range safely. The || 0 guard covers misses without an extra has() lookup.',
      },
      java: {
        code: \`class Solution {
    public int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {
        Map<Integer, Integer> ab = new HashMap<>();
        for (int a : nums1) {
            for (int b : nums2) {
                ab.merge(a + b, 1, Integer::sum);
            }
        }
        int count = 0;
        for (int c : nums3) {
            for (int d : nums4) {
                count += ab.getOrDefault(-(c + d), 0);
            }
        }
        return count;
    }
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n^2)' },
        approach: 'HashMap<Integer, Integer> with merge for the counter — the int key is fine since LC bounds keep a+b in 32-bit range. getOrDefault avoids a null check on the lookup side.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int fourSumCount(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3, vector<int>& nums4) {
        unordered_map<int, int> ab;
        for (int a : nums1)
            for (int b : nums2)
                ab[a + b]++;
        int count = 0;
        for (int c : nums3)
            for (int d : nums4) {
                auto it = ab.find(-(c + d));
                if (it != ab.end()) count += it->second;
            }
        return count;
    }
};\`,
        complexity: { time: 'O(n^2)', space: 'O(n^2)' },
        approach: 'unordered_map for O(1) average lookups. Iterator-based find avoids the silent insert that operator[] would do on a miss, keeping the map size bounded by distinct AB sums only.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <string.h>

// Hash table for (sum -> count) — open addressing with linear probing.
#define CAP 65536
#define EMPTY 0x80000000

typedef struct { int key; int count; } Slot;

static int hash_idx(int key) {
    unsigned int h = (unsigned int)(key * 2654435761u);
    return h & (CAP - 1);
}

int fourSumCount(int* nums1, int s1, int* nums2, int s2, int* nums3, int s3, int* nums4, int s4) {
    Slot* table = malloc(sizeof(Slot) * CAP);
    for (int i = 0; i < CAP; i++) table[i].count = 0;
    int* keys = malloc(sizeof(int) * CAP);
    int kn = 0;
    for (int i = 0; i < s1; i++) {
        for (int j = 0; j < s2; j++) {
            int sum = nums1[i] + nums2[j];
            int idx = hash_idx(sum);
            while (table[idx].count != 0 && table[idx].key != sum) idx = (idx + 1) & (CAP - 1);
            if (table[idx].count == 0) { table[idx].key = sum; keys[kn++] = idx; }
            table[idx].count++;
        }
    }
    int count = 0;
    for (int i = 0; i < s3; i++) {
        for (int j = 0; j < s4; j++) {
            int want = -(nums3[i] + nums4[j]);
            int idx = hash_idx(want);
            while (table[idx].count != 0 && table[idx].key != want) idx = (idx + 1) & (CAP - 1);
            if (table[idx].count != 0 && table[idx].key == want) count += table[idx].count;
        }
    }
    free(keys); free(table);
    return count;
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n^2)' },
        approach: 'Hand-rolled open-addressing hash table since C has no built-in map. CAP = 65536 is comfortably above the n^2 = 200*200 = 40000 distinct-sum worst case at LC bounds. Knuth multiplicative hash spreads keys well across the table.',
      },
      go: {
        code: \`func fourSumCount(nums1 []int, nums2 []int, nums3 []int, nums4 []int) int {
    ab := make(map[int]int)
    for _, a := range nums1 {
        for _, b := range nums2 {
            ab[a+b]++
        }
    }
    count := 0
    for _, c := range nums3 {
        for _, d := range nums4 {
            count += ab[-(c+d)]
        }
    }
    return count
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n^2)' },
        approach: 'Go map returns the zero value on miss, so the lookup needs no explicit check. The whole solve is two nested doubles — n^2 build, n^2 query.',
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
console.log('Spliced 2 viz fns + 2 entries (4sum, 4sum-ii) into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
