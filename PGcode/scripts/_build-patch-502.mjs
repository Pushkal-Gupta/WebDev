#!/usr/bin/env node
// Builds /tmp/patch-500-02.json from hand-authored entries.
// Run: node scripts/_build-patch-502.mjs
import fs from 'node:fs';

const entries = [];

// ─────────────────────────────────────────────────────────
// Helper to inline solutions (multi-line) without escape pain.
const py = (s) => s.replace(/^\n/, '').replace(/\n+$/, '\n');
const js_ = py, jv = py, cp = py;

function addProblem(p) { entries.push(p); }

// ─────────────────────────────────────────────────────────
// 1. aggressive-cows (already has tc, hints, mn, params; missing editorial+solutions)
addProblem({
  id: 'aggressive-cows',
  editorial_md: `## Intuition
We are asked to place \`k\` cows in stalls such that the minimum pairwise distance between any two cows is maximised. This is a classic monotonic-feasibility problem: if distance \`d\` is achievable, every smaller \`d'\` is also achievable. That monotonic predicate is the green light for binary search on the answer.

## Approach
1. Sort the stalls in ascending order.
2. Binary search the candidate distance \`d\` in the range \`[1, stalls[-1] - stalls[0]]\`.
3. For each \`d\`, greedily place the first cow at \`stalls[0]\`, then walk forward and place the next cow at the first stall \`>= last_placed + d\`. Count placements.
4. If we placed at least \`k\` cows, \`d\` is feasible — push the lower bound up. Otherwise, shrink the upper bound.
5. The largest feasible \`d\` is the answer.

The greedy feasibility check is correct because any solution with min-gap \`>= d\` must use a stall \`<= stalls[0]\` for the first cow (otherwise we could shift it left without breaking constraints), so starting at \`stalls[0]\` is never worse.

## Complexity
- Time: O(n log n) for the sort plus O(n log(range)) for the search, dominated by O(n log(max_stall)).
- Space: O(1) extra; the sort may use O(log n) stack.`,
  solutions: {
    python: `class Solution:
    def aggressiveCows(self, stalls, k):
        stalls.sort()
        def feasible(d):
            count, last = 1, stalls[0]
            for s in stalls[1:]:
                if s - last >= d:
                    count += 1
                    last = s
                    if count >= k:
                        return True
            return count >= k
        lo, hi = 1, stalls[-1] - stalls[0]
        ans = 0
        while lo <= hi:
            mid = (lo + hi) // 2
            if feasible(mid):
                ans = mid
                lo = mid + 1
            else:
                hi = mid - 1
        return ans
`,
    javascript: `class Solution {
    aggressiveCows(stalls, k) {
        stalls.sort((a, b) => a - b);
        const feasible = (d) => {
            let count = 1, last = stalls[0];
            for (let i = 1; i < stalls.length; i++) {
                if (stalls[i] - last >= d) { count++; last = stalls[i]; if (count >= k) return true; }
            }
            return count >= k;
        };
        let lo = 1, hi = stalls[stalls.length - 1] - stalls[0], ans = 0;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (feasible(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;
        }
        return ans;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int aggressiveCows(int[] stalls, int k) {
        Arrays.sort(stalls);
        int lo = 1, hi = stalls[stalls.length - 1] - stalls[0], ans = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(stalls, k, mid)) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
    private boolean feasible(int[] s, int k, int d) {
        int count = 1, last = s[0];
        for (int i = 1; i < s.length; i++) {
            if (s[i] - last >= d) { count++; last = s[i]; if (count >= k) return true; }
        }
        return count >= k;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
class Solution {
public:
    int aggressiveCows(vector<int>& stalls, int k) {
        sort(stalls.begin(), stalls.end());
        auto feasible = [&](int d) {
            int count = 1, last = stalls[0];
            for (size_t i = 1; i < stalls.size(); i++) {
                if (stalls[i] - last >= d) { count++; last = stalls[i]; if (count >= k) return true; }
            }
            return count >= k;
        };
        int lo = 1, hi = stalls.back() - stalls.front(), ans = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(mid)) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
};
`,
  },
});

// 2. remove-invalid-parentheses (has tc/hints/mn/params)
addProblem({
  id: 'remove-invalid-parentheses',
  return_type: 'List[str]',
  pattern: 'BFS / Backtracking with prune',
  editorial_md: `## Intuition
We want the shortest list of removals that makes the string valid, and we need all such results. Two facts shape the solution: (1) the minimum number of removals is fixed — it equals the count of unmatched '(' plus unmatched ')' — and (2) BFS level-by-level guarantees we stop at the first level where any valid string appears.

## Approach
Use BFS starting from the input string. At each level, take every string and generate all "remove one parenthesis" neighbours. If any neighbour is valid, collect every valid one at that level and return — no deeper search needed. Track visited strings via a hash set to avoid exponential blow-up from repeated states.

A leaner alternative is backtracking. First scan to compute \`leftRem\` = unmatched '(' and \`rightRem\` = unmatched ')'. Then DFS the string, at each '(' or ')' choose to keep or skip. Skip only if budget allows. After the walk, validate balance and add to the answer set if balanced and budgets are zero. This avoids storing every BFS level.

## Complexity
- Time: O(2^n) worst case but the prune (leftRem / rightRem budgets) cuts this drastically in practice.
- Space: O(n * 2^n) for the result set and recursion stack in the worst case.`,
  solutions: {
    python: `class Solution:
    def removeInvalidParentheses(self, s):
        def is_valid(t):
            bal = 0
            for c in t:
                if c == '(': bal += 1
                elif c == ')':
                    bal -= 1
                    if bal < 0: return False
            return bal == 0
        level = {s}
        while True:
            valid = [t for t in level if is_valid(t)]
            if valid:
                return sorted(valid)
            nxt = set()
            for t in level:
                for i, c in enumerate(t):
                    if c in '()':
                        nxt.add(t[:i] + t[i+1:])
            if not nxt:
                return [""]
            level = nxt
`,
    javascript: `class Solution {
    removeInvalidParentheses(s) {
        const isValid = (t) => {
            let bal = 0;
            for (const c of t) {
                if (c === '(') bal++;
                else if (c === ')') { bal--; if (bal < 0) return false; }
            }
            return bal === 0;
        };
        let level = new Set([s]);
        while (true) {
            const valid = [...level].filter(isValid);
            if (valid.length) return valid.sort();
            const next = new Set();
            for (const t of level) {
                for (let i = 0; i < t.length; i++) {
                    if (t[i] === '(' || t[i] === ')') next.add(t.slice(0, i) + t.slice(i + 1));
                }
            }
            if (!next.size) return [""];
            level = next;
        }
    }
}
`,
    java: `import java.util.*;
class Solution {
    public List<String> removeInvalidParentheses(String s) {
        Set<String> level = new HashSet<>();
        level.add(s);
        while (true) {
            List<String> valid = new ArrayList<>();
            for (String t : level) if (isValid(t)) valid.add(t);
            if (!valid.isEmpty()) { Collections.sort(valid); return valid; }
            Set<String> next = new HashSet<>();
            for (String t : level) {
                for (int i = 0; i < t.length(); i++) {
                    char c = t.charAt(i);
                    if (c == '(' || c == ')') next.add(t.substring(0, i) + t.substring(i + 1));
                }
            }
            if (next.isEmpty()) return Collections.singletonList("");
            level = next;
        }
    }
    private boolean isValid(String t) {
        int bal = 0;
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (c == '(') bal++;
            else if (c == ')') { bal--; if (bal < 0) return false; }
        }
        return bal == 0;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_set>
#include <algorithm>
using namespace std;
class Solution {
public:
    vector<string> removeInvalidParentheses(string s) {
        unordered_set<string> level{s};
        while (true) {
            vector<string> valid;
            for (auto& t : level) if (isValid(t)) valid.push_back(t);
            if (!valid.empty()) { sort(valid.begin(), valid.end()); return valid; }
            unordered_set<string> nxt;
            for (auto& t : level) {
                for (size_t i = 0; i < t.size(); i++) {
                    if (t[i] == '(' || t[i] == ')') nxt.insert(t.substr(0, i) + t.substr(i + 1));
                }
            }
            if (nxt.empty()) return {""};
            level = nxt;
        }
    }
private:
    bool isValid(const string& t) {
        int bal = 0;
        for (char c : t) {
            if (c == '(') bal++;
            else if (c == ')') { bal--; if (bal < 0) return false; }
        }
        return bal == 0;
    }
};
`,
  },
});

// 3. cycle-sort
addProblem({
  id: 'cycle-sort',
  method_name: 'cycleSort',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'In-place cyclic placement',
  description: '<p>Sort an array containing distinct integers from 1 to n using the cycle sort technique. Each element is placed at its correct index (value <code>v</code> goes to index <code>v-1</code>) with the minimum number of writes.</p><p>Return the sorted array.</p>',
  hints: [
    'Every element has a known final position: value v belongs at index v-1.',
    'Walk i from 0 to n-1. While nums[i] is not at its correct spot, swap it with the slot it belongs in.',
    'Each swap places one element correctly, so the algorithm runs in O(n) swaps.',
    'Avoid infinite loops by always swapping toward the correct slot, never away from it.',
    'Cycle sort minimises the number of writes — useful when writes are expensive (e.g. flash storage).',
  ],
  test_cases: [
    { inputs: ['[3,1,2]'], expected: '[1,2,3]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[2,1]'], expected: '[1,2]' },
    { inputs: ['[5,4,3,2,1]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[4,3,1,2]'], expected: '[1,2,3,4]' },
    { inputs: ['[6,5,4,3,2,1]'], expected: '[1,2,3,4,5,6]' },
    { inputs: ['[2,3,1,4,6,5]'], expected: '[1,2,3,4,5,6]' },
    { inputs: ['[7,1,5,3,6,2,4]'], expected: '[1,2,3,4,5,6,7]' },
    { inputs: ['[10,9,8,7,6,5,4,3,2,1]'], expected: '[1,2,3,4,5,6,7,8,9,10]' },
  ],
  editorial_md: `## Intuition
When an array contains distinct integers from 1 to n, every value has a known final position: the number \`v\` belongs at index \`v-1\`. We can sort it in-place by simply walking through the array and, whenever the current value is in the wrong slot, swapping it into the slot it belongs to. After every swap the slot we wrote into is correct forever, so the total number of swaps is bounded by n. This is the essence of cycle sort, the algorithm with the theoretically minimal number of writes.

## Approach
1. Iterate \`i\` from 0 to n-1.
2. As long as \`nums[i]\` does not equal \`i + 1\` (i.e. it is not in its correct slot), swap it with \`nums[nums[i] - 1]\` — the index where it belongs.
3. Because every swap places one element correctly, the inner while never executes more than once on average across the array, giving O(n) total swaps.
4. After the outer loop finishes, every index holds its proper value.

## Complexity
- Time: O(n) — every element is moved at most once to its final position.
- Space: O(1) — sorting is done in place.`,
  solutions: {
    python: `class Solution:
    def cycleSort(self, nums):
        n = len(nums)
        i = 0
        while i < n:
            correct = nums[i] - 1
            if 0 <= correct < n and nums[i] != nums[correct]:
                nums[i], nums[correct] = nums[correct], nums[i]
            else:
                i += 1
        return nums
`,
    javascript: `class Solution {
    cycleSort(nums) {
        const n = nums.length;
        let i = 0;
        while (i < n) {
            const correct = nums[i] - 1;
            if (correct >= 0 && correct < n && nums[i] !== nums[correct]) {
                [nums[i], nums[correct]] = [nums[correct], nums[i]];
            } else {
                i++;
            }
        }
        return nums;
    }
}
`,
    java: `class Solution {
    public int[] cycleSort(int[] nums) {
        int n = nums.length, i = 0;
        while (i < n) {
            int correct = nums[i] - 1;
            if (correct >= 0 && correct < n && nums[i] != nums[correct]) {
                int t = nums[i]; nums[i] = nums[correct]; nums[correct] = t;
            } else i++;
        }
        return nums;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    vector<int> cycleSort(vector<int>& nums) {
        int n = nums.size(), i = 0;
        while (i < n) {
            int correct = nums[i] - 1;
            if (correct >= 0 && correct < n && nums[i] != nums[correct]) swap(nums[i], nums[correct]);
            else i++;
        }
        return nums;
    }
};
`,
  },
});

// 4. longest-span (longest span with same sum in two binary arrays)
addProblem({
  id: 'longest-span',
  method_name: 'longestCommonSum',
  params: [{ name: 'a', type: 'List[int]' }, { name: 'b', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Prefix-sum difference hashing',
  description: '<p>Given two binary arrays <code>a</code> and <code>b</code> of equal length, find the length of the longest common span <code>[i, j]</code> such that the sum of elements of <code>a</code> from <code>i</code> to <code>j</code> equals the sum of elements of <code>b</code> from <code>i</code> to <code>j</code>.</p>',
  hints: [
    'Look at d[i] = prefix_a[i] - prefix_b[i]. The span [l+1..r] is valid iff d[r] == d[l].',
    'So we need the longest distance between two equal values in the d array.',
    'Hash each value of d to its earliest index.',
    'For each i, if d[i] was seen before at index j, candidate length is i - j.',
    'O(n) time, O(n) space.',
  ],
  test_cases: [
    { inputs: ['[0,1,0,0,0,0]', '[1,0,1,0,0,1]'], expected: '6' },
    { inputs: ['[0,1,0,1,1,1,1]', '[1,1,1,1,1,0,1]'], expected: '4' },
    { inputs: ['[0,0,1,1,1,1]', '[0,1,1,0,1,1]'], expected: '6' },
    { inputs: ['[1,1,1,1,1,1]', '[0,0,0,0,0,0]'], expected: '0' },
    { inputs: ['[1]', '[1]'], expected: '1' },
    { inputs: ['[1]', '[0]'], expected: '0' },
    { inputs: ['[0,0,0]', '[0,0,0]'], expected: '3' },
    { inputs: ['[1,0,1,0]', '[0,1,0,1]'], expected: '4' },
    { inputs: ['[1,0,0,1,0,0,1]', '[0,1,1,0,1,1,0]'], expected: '7' },
    { inputs: ['[0,1]', '[1,0]'], expected: '2' },
  ],
  editorial_md: `## Intuition
Let \`d[i] = prefix_a[i] - prefix_b[i]\`. A span \`(l, r]\` has equal sums in both arrays exactly when \`d[r] == d[l]\`. So the problem reduces to finding the maximum distance between two indices with the same value in the prefix-difference array — a classic hash-map trick.

## Approach
1. Walk through indices 0..n-1 keeping a running sum \`diff = prefix_a - prefix_b\`.
2. Maintain a hash map from each value of \`diff\` to the **earliest** index where it appeared.
3. Seed the map with \`diff = 0 -> index = -1\` so a prefix that already balances counts from the start.
4. At each index \`i\`, if \`diff\` is in the map at index \`j\`, update the answer with \`i - j\`. Otherwise record this index as the first occurrence.
5. Return the maximum span.

## Complexity
- Time: O(n) — single pass with O(1) hash operations.
- Space: O(n) — the hash map can grow with the number of distinct prefix differences.`,
  solutions: {
    python: `class Solution:
    def longestCommonSum(self, a, b):
        first = {0: -1}
        diff = 0
        best = 0
        for i in range(len(a)):
            diff += a[i] - b[i]
            if diff in first:
                best = max(best, i - first[diff])
            else:
                first[diff] = i
        return best
`,
    javascript: `class Solution {
    longestCommonSum(a, b) {
        const first = new Map([[0, -1]]);
        let diff = 0, best = 0;
        for (let i = 0; i < a.length; i++) {
            diff += a[i] - b[i];
            if (first.has(diff)) best = Math.max(best, i - first.get(diff));
            else first.set(diff, i);
        }
        return best;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int longestCommonSum(int[] a, int[] b) {
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);
        int diff = 0, best = 0;
        for (int i = 0; i < a.length; i++) {
            diff += a[i] - b[i];
            if (first.containsKey(diff)) best = Math.max(best, i - first.get(diff));
            else first.put(diff, i);
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;
class Solution {
public:
    int longestCommonSum(vector<int>& a, vector<int>& b) {
        unordered_map<int,int> first{{0,-1}};
        int diff = 0, best = 0;
        for (int i = 0; i < (int)a.size(); i++) {
            diff += a[i] - b[i];
            auto it = first.find(diff);
            if (it != first.end()) best = max(best, i - it->second);
            else first[diff] = i;
        }
        return best;
    }
};
`,
  },
});

// 5. flatten-tree (has tc, hints, mn — needs solutions+editorial)
addProblem({
  id: 'flatten-tree',
  editorial_md: `## Intuition
Flatten a binary tree to a singly-linked-list "in preorder, using only the right pointer". The trick is to notice that the rightmost node of the left subtree should become the parent of the original right subtree — so a single right-spine pre-order rotation does the job without recursion.

## Approach (Morris-style, O(1) extra space)
1. Start at the root. While the current node is not null:
   - If it has a left child, find the rightmost node of its left subtree.
   - Reattach the current node's right subtree to that rightmost node's right pointer.
   - Move the left subtree to become the new right subtree, and set left to null.
2. Advance to \`current = current.right\` and continue.

Each node is visited at most twice (once as current, once when found as the rightmost node of some left subtree), giving O(n) overall.

## Complexity
- Time: O(n).
- Space: O(1) extra — the tree is rewired in place.`,
  solutions: {
    python: `class Solution:
    def flatten(self, root):
        cur = root
        while cur:
            if cur.left:
                rightmost = cur.left
                while rightmost.right:
                    rightmost = rightmost.right
                rightmost.right = cur.right
                cur.right = cur.left
                cur.left = None
            cur = cur.right
        return root
`,
    javascript: `class Solution {
    flatten(root) {
        let cur = root;
        while (cur) {
            if (cur.left) {
                let r = cur.left;
                while (r.right) r = r.right;
                r.right = cur.right;
                cur.right = cur.left;
                cur.left = null;
            }
            cur = cur.right;
        }
        return root;
    }
}
`,
    java: `class Solution {
    public TreeNode flatten(TreeNode root) {
        TreeNode cur = root;
        while (cur != null) {
            if (cur.left != null) {
                TreeNode r = cur.left;
                while (r.right != null) r = r.right;
                r.right = cur.right;
                cur.right = cur.left;
                cur.left = null;
            }
            cur = cur.right;
        }
        return root;
    }
}
`,
    cpp: `class Solution {
public:
    TreeNode* flatten(TreeNode* root) {
        TreeNode* cur = root;
        while (cur) {
            if (cur->left) {
                TreeNode* r = cur->left;
                while (r->right) r = r->right;
                r->right = cur->right;
                cur->right = cur->left;
                cur->left = nullptr;
            }
            cur = cur->right;
        }
        return root;
    }
};
`,
  },
});

// 6. majority-element-ii (has tc/hints/mn)
addProblem({
  id: 'majority-element-ii',
  editorial_md: `## Intuition
At most two distinct values can occur more than n/3 times — if three different values each exceeded n/3 the total would surpass n. Boyer-Moore generalises perfectly: track two candidate-count pairs, and the survivors are the only possible answers.

## Approach
1. Maintain two candidates \`c1, c2\` and two counters \`k1, k2\`, all initially zero/None.
2. For each x:
   - If x equals an existing candidate, increment its counter.
   - Else if a counter is zero, adopt x as that candidate with count 1.
   - Else decrement both counters.
3. After the pass, \`c1\` and \`c2\` are *possible* majority candidates — verify by counting their true frequencies in a second pass and emit those above n/3.

The first pass is a vote-cancellation argument: any value occurring more than n/3 times cannot be fully cancelled out by the others, so it must survive as one of the two candidates.

## Complexity
- Time: O(n) — two linear passes.
- Space: O(1) — only two candidate slots regardless of input size.`,
  solutions: {
    python: `class Solution:
    def majorityElement(self, nums):
        c1 = c2 = None
        k1 = k2 = 0
        for x in nums:
            if c1 == x: k1 += 1
            elif c2 == x: k2 += 1
            elif k1 == 0: c1, k1 = x, 1
            elif k2 == 0: c2, k2 = x, 1
            else: k1 -= 1; k2 -= 1
        n = len(nums)
        out = []
        for c in (c1, c2):
            if c is not None and nums.count(c) > n // 3 and c not in out:
                out.append(c)
        out.sort()
        return out
`,
    javascript: `class Solution {
    majorityElement(nums) {
        let c1 = null, c2 = null, k1 = 0, k2 = 0;
        for (const x of nums) {
            if (c1 === x) k1++;
            else if (c2 === x) k2++;
            else if (k1 === 0) { c1 = x; k1 = 1; }
            else if (k2 === 0) { c2 = x; k2 = 1; }
            else { k1--; k2--; }
        }
        const n = nums.length, out = [];
        for (const c of [c1, c2]) {
            if (c === null || out.includes(c)) continue;
            let cnt = 0; for (const x of nums) if (x === c) cnt++;
            if (cnt > Math.floor(n / 3)) out.push(c);
        }
        return out.sort((a,b)=>a-b);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public List<Integer> majorityElement(int[] nums) {
        Integer c1 = null, c2 = null;
        int k1 = 0, k2 = 0;
        for (int x : nums) {
            if (c1 != null && c1 == x) k1++;
            else if (c2 != null && c2 == x) k2++;
            else if (k1 == 0) { c1 = x; k1 = 1; }
            else if (k2 == 0) { c2 = x; k2 = 1; }
            else { k1--; k2--; }
        }
        List<Integer> out = new ArrayList<>();
        int n = nums.length;
        for (Integer c : new Integer[]{c1, c2}) {
            if (c == null || out.contains(c)) continue;
            int cnt = 0; for (int x : nums) if (x == c) cnt++;
            if (cnt > n / 3) out.add(c);
        }
        Collections.sort(out);
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <optional>
using namespace std;
class Solution {
public:
    vector<int> majorityElement(vector<int>& nums) {
        long long c1 = LLONG_MIN, c2 = LLONG_MIN;
        int k1 = 0, k2 = 0;
        for (int x : nums) {
            if (c1 == (long long)x) k1++;
            else if (c2 == (long long)x) k2++;
            else if (k1 == 0) { c1 = x; k1 = 1; }
            else if (k2 == 0) { c2 = x; k2 = 1; }
            else { k1--; k2--; }
        }
        vector<int> out;
        int n = nums.size();
        for (long long c : {c1, c2}) {
            if (c == LLONG_MIN) continue;
            if (find(out.begin(), out.end(), (int)c) != out.end()) continue;
            int cnt = 0; for (int x : nums) if (x == (int)c) cnt++;
            if (cnt > n / 3) out.push_back((int)c);
        }
        sort(out.begin(), out.end());
        return out;
    }
};
`,
  },
});

// 7. kth-smallest-element (has tc/hints — uses params already)
addProblem({
  id: 'kth-smallest-element',
  editorial_md: `## Intuition
The k-th smallest element doesn't require a full sort — once we know its position relative to a pivot, we can throw away the half that doesn't contain it. Quickselect uses this insight to average O(n) by partitioning around random pivots and recursing into only the side that holds the target rank.

## Approach (Quickselect)
1. Pick a random pivot index in \`[lo, hi]\`. Move the pivot to the end.
2. Partition the array: elements smaller than the pivot value go left, larger go right. The pivot lands at some index \`p\`.
3. If \`p == k-1\` we are done — return \`nums[p]\`.
4. If \`p < k-1\`, recurse on \`[p+1, hi]\`. Else recurse on \`[lo, p-1]\`.

Random pivots avoid the adversarial O(n^2) case; expected time is O(n) by the standard quickselect recurrence T(n) = T(n/2) + O(n).

A heap-based alternative (max-heap of size k or min-heap of size n) runs in O(n log k) and is easier to read, but quickselect is the canonical interview answer for "kth-smallest in expected linear time".

## Complexity
- Time: average O(n), worst case O(n^2) (mitigated by random pivot).
- Space: O(log n) recursion stack on average.`,
  solutions: {
    python: `import random
class Solution:
    def kthSmallest(self, nums, k):
        a = list(nums)
        lo, hi = 0, len(a) - 1
        k -= 1
        while lo <= hi:
            pivot = a[random.randint(lo, hi)]
            i, j = lo, hi
            while i <= j:
                while a[i] < pivot: i += 1
                while a[j] > pivot: j -= 1
                if i <= j:
                    a[i], a[j] = a[j], a[i]
                    i += 1; j -= 1
            if k <= j: hi = j
            elif k >= i: lo = i
            else: return a[k]
        return a[k]
`,
    javascript: `class Solution {
    kthSmallest(nums, k) {
        const a = nums.slice();
        let lo = 0, hi = a.length - 1; k--;
        while (lo <= hi) {
            const pivot = a[lo + Math.floor(Math.random() * (hi - lo + 1))];
            let i = lo, j = hi;
            while (i <= j) {
                while (a[i] < pivot) i++;
                while (a[j] > pivot) j--;
                if (i <= j) { [a[i], a[j]] = [a[j], a[i]]; i++; j--; }
            }
            if (k <= j) hi = j;
            else if (k >= i) lo = i;
            else return a[k];
        }
        return a[k];
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int kthSmallest(int[] nums, int k) {
        int[] a = nums.clone();
        int lo = 0, hi = a.length - 1; k--;
        Random rng = new Random(1);
        while (lo <= hi) {
            int pivot = a[lo + rng.nextInt(hi - lo + 1)];
            int i = lo, j = hi;
            while (i <= j) {
                while (a[i] < pivot) i++;
                while (a[j] > pivot) j--;
                if (i <= j) { int t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; }
            }
            if (k <= j) hi = j;
            else if (k >= i) lo = i;
            else return a[k];
        }
        return a[k];
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <random>
using namespace std;
class Solution {
public:
    int kthSmallest(vector<int>& nums, int k) {
        vector<int> a = nums;
        int lo = 0, hi = a.size() - 1; k--;
        mt19937 rng(1);
        while (lo <= hi) {
            int pivot = a[lo + rng() % (hi - lo + 1)];
            int i = lo, j = hi;
            while (i <= j) {
                while (a[i] < pivot) i++;
                while (a[j] > pivot) j--;
                if (i <= j) { swap(a[i], a[j]); i++; j--; }
            }
            if (k <= j) hi = j;
            else if (k >= i) lo = i;
            else return a[k];
        }
        return a[k];
    }
};
`,
  },
});

// 8. prefix-and-suffix-search (has 4 tc/3 hints/mn)
addProblem({
  id: 'prefix-and-suffix-search',
  editorial_md: `## Intuition
For each query (prefix, suffix) we need the highest-indexed word that begins with the prefix and ends with the suffix. A linear scan per query is O(q * n * w), too slow when there are many queries. The standard trick is to fold both prefix and suffix into one key by inserting all "suffix#prefix" combinations into a hash map keyed to the word's index.

## Approach
1. For each word at index \`i\` and every (suffix, prefix) pair of its prefixes and suffixes, store the key \`suffix + '#' + prefix\` mapped to \`i\` (later inserts overwrite earlier ones, so the map ends with the largest index for each key).
2. For each query \`(prefix, suffix)\`, look up \`suffix + '#' + prefix\`. Return the stored index, or -1.

The "#" separator avoids ambiguity between prefixes and suffixes during the lookup. Each word of length \`L\` contributes O(L^2) keys, so build is O(n * L^2). Queries are O(L) each.

A space-leaner alternative uses two tries (one keyed by prefix, one by reversed suffix, storing index sets at each node) and intersects them per query, but it adds significant code with no big-O improvement for typical inputs.

## Complexity
- Time: O(n * L^2) build, O(L) per query.
- Space: O(n * L^2) for the hash map.`,
  solutions: {
    python: `class WordFilter:
    def __init__(self, words):
        self.m = {}
        for i, w in enumerate(words):
            for p in range(len(w) + 1):
                for s in range(len(w) + 1):
                    self.m[w[len(w)-s:] + '#' + w[:p]] = i
    def f(self, prefix, suffix):
        return self.m.get(suffix + '#' + prefix, -1)

class Solution:
    def prefixSuffixSearch(self, words, queries):
        wf = WordFilter(words)
        out = []
        for q in queries:
            p, s = q
            out.append(wf.f(p, s))
        return out
`,
    javascript: `class Solution {
    prefixSuffixSearch(words, queries) {
        const m = new Map();
        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            for (let p = 0; p <= w.length; p++) {
                for (let s = 0; s <= w.length; s++) {
                    m.set(w.slice(w.length - s) + '#' + w.slice(0, p), i);
                }
            }
        }
        return queries.map(([pre, suf]) => m.has(suf + '#' + pre) ? m.get(suf + '#' + pre) : -1);
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int[] prefixSuffixSearch(String[] words, String[][] queries) {
        Map<String,Integer> m = new HashMap<>();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            for (int p = 0; p <= w.length(); p++) {
                for (int s = 0; s <= w.length(); s++) {
                    m.put(w.substring(w.length() - s) + "#" + w.substring(0, p), i);
                }
            }
        }
        int[] out = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            out[i] = m.getOrDefault(queries[i][1] + "#" + queries[i][0], -1);
        }
        return out;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_map>
using namespace std;
class Solution {
public:
    vector<int> prefixSuffixSearch(vector<string>& words, vector<vector<string>>& queries) {
        unordered_map<string,int> m;
        for (int i = 0; i < (int)words.size(); i++) {
            const string& w = words[i];
            for (int p = 0; p <= (int)w.size(); p++) {
                for (int s = 0; s <= (int)w.size(); s++) {
                    m[w.substr(w.size() - s) + "#" + w.substr(0, p)] = i;
                }
            }
        }
        vector<int> out;
        for (auto& q : queries) {
            auto it = m.find(q[1] + "#" + q[0]);
            out.push_back(it == m.end() ? -1 : it->second);
        }
        return out;
    }
};
`,
  },
});

// 9. minimum-missing-positive
addProblem({
  id: 'minimum-missing-positive',
  method_name: 'firstMissingPositive',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'In-place hashing (index = value)',
  description: '<p>Given an unsorted integer array, return the smallest missing positive integer. Solve in O(n) time and O(1) extra space.</p>',
  hints: [
    'The answer always lies in the range [1, n+1] where n = len(nums).',
    'Use the array itself as a hash map: put value v at index v-1.',
    'Iterate i = 0..n-1. While 1 <= nums[i] <= n and nums[nums[i]-1] != nums[i], swap nums[i] with nums[nums[i]-1].',
    'After placement, the first i where nums[i] != i+1 is the answer.',
    'If every index matches, the answer is n+1.',
  ],
  test_cases: [
    { inputs: ['[1,2,0]'], expected: '3' },
    { inputs: ['[3,4,-1,1]'], expected: '2' },
    { inputs: ['[7,8,9,11,12]'], expected: '1' },
    { inputs: ['[1]'], expected: '2' },
    { inputs: ['[2]'], expected: '1' },
    { inputs: ['[1,2,3,4,5]'], expected: '6' },
    { inputs: ['[-1,-2,-3]'], expected: '1' },
    { inputs: ['[1,1,1]'], expected: '2' },
    { inputs: ['[0,2,2,1,1]'], expected: '3' },
    { inputs: ['[5,4,3,2,1]'], expected: '6' },
  ],
  editorial_md: `## Intuition
With \`n\` array slots we can hold at most \`n\` distinct positive integers, so the answer is forced to lie in \`[1, n+1]\`. Treating the array itself as a hash table — index \`i\` holds value \`i+1\` — lets us answer in O(n) time and O(1) extra space.

## Approach
1. Walk \`i\` from 0 to n-1. While \`nums[i]\` is in \`[1, n]\` and is not already in its slot (i.e. \`nums[nums[i]-1] != nums[i]\`), swap \`nums[i]\` with \`nums[nums[i]-1]\`.
2. After this pass, every value \`v\` in \`[1, n]\` that exists sits at index \`v-1\`. Values outside that range, and duplicates, end up in mismatched slots.
3. Scan once more: the first index \`i\` where \`nums[i] != i+1\` gives answer \`i+1\`.
4. If everything matches, the answer is \`n+1\`.

The while-inside-for loop is amortised O(n): each swap places one value correctly, and a correctly placed value never participates in another swap.

## Complexity
- Time: O(n).
- Space: O(1) — input array is mutated.`,
  solutions: {
    python: `class Solution:
    def firstMissingPositive(self, nums):
        n = len(nums)
        i = 0
        while i < n:
            j = nums[i] - 1
            if 1 <= nums[i] <= n and nums[j] != nums[i]:
                nums[i], nums[j] = nums[j], nums[i]
            else:
                i += 1
        for k in range(n):
            if nums[k] != k + 1: return k + 1
        return n + 1
`,
    javascript: `class Solution {
    firstMissingPositive(nums) {
        const n = nums.length;
        let i = 0;
        while (i < n) {
            const j = nums[i] - 1;
            if (nums[i] >= 1 && nums[i] <= n && nums[j] !== nums[i]) {
                [nums[i], nums[j]] = [nums[j], nums[i]];
            } else i++;
        }
        for (let k = 0; k < n; k++) if (nums[k] !== k + 1) return k + 1;
        return n + 1;
    }
}
`,
    java: `class Solution {
    public int firstMissingPositive(int[] nums) {
        int n = nums.length, i = 0;
        while (i < n) {
            int j = nums[i] - 1;
            if (nums[i] >= 1 && nums[i] <= n && nums[j] != nums[i]) {
                int t = nums[i]; nums[i] = nums[j]; nums[j] = t;
            } else i++;
        }
        for (int k = 0; k < n; k++) if (nums[k] != k + 1) return k + 1;
        return n + 1;
    }
}
`,
    cpp: `#include <vector>
using namespace std;
class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        int n = nums.size(), i = 0;
        while (i < n) {
            int j = nums[i] - 1;
            if (nums[i] >= 1 && nums[i] <= n && nums[j] != nums[i]) swap(nums[i], nums[j]);
            else i++;
        }
        for (int k = 0; k < n; k++) if (nums[k] != k + 1) return k + 1;
        return n + 1;
    }
};
`,
  },
});

// 10. min-swaps-to-sort
addProblem({
  id: 'min-swaps-to-sort',
  method_name: 'minSwaps',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Permutation cycle decomposition',
  description: '<p>Given an array of distinct integers, return the minimum number of swaps required to sort it in ascending order.</p>',
  hints: [
    'Pair each value with its current index and sort by value to know each value\'s target index.',
    'Build a permutation that maps current index to target index.',
    'Decompose the permutation into disjoint cycles.',
    'A cycle of length L needs L-1 swaps to fix.',
    'Answer = sum over cycles of (length - 1) = n - (number of cycles).',
  ],
  test_cases: [
    { inputs: ['[4,3,2,1]'], expected: '2' },
    { inputs: ['[1,5,4,3,2]'], expected: '2' },
    { inputs: ['[1,2,3,4]'], expected: '0' },
    { inputs: ['[2,4,5,1,3]'], expected: '3' },
    { inputs: ['[10,19,6,3,5]'], expected: '2' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[2,1]'], expected: '1' },
    { inputs: ['[3,1,2]'], expected: '2' },
    { inputs: ['[7,1,3,2,4,5,6]'], expected: '5' },
    { inputs: ['[101,758,315,730,472,619,460,479]'], expected: '5' },
  ],
  editorial_md: `## Intuition
Sorting is the act of moving every value from its current position to its target position. If we draw arrows from each current index to its target index, the result is a set of disjoint cycles. A cycle of length \`L\` can be fixed with exactly \`L - 1\` swaps (rotate the cycle one step at a time). So the answer is \`n - (number of cycles)\`.

## Approach
1. Create pairs \`(value, original_index)\` and sort by value. The i-th pair tells us "the value that belongs at index i originally lived at \`pair[i].original_index\`".
2. Walk through indices, using a visited flag. For each unvisited index, traverse the cycle starting there until we return to the start, counting its length.
3. Add \`length - 1\` to the answer per cycle.

The trick is the cycle-length lower bound. A cycle of length L cannot be sorted with fewer than L-1 swaps because each swap can place at most one element into its final slot; the last element falls into place automatically once L-1 have settled.

## Complexity
- Time: O(n log n) for the sort, then O(n) for the cycle walk.
- Space: O(n) for the paired array and visited markers.`,
  solutions: {
    python: `class Solution:
    def minSwaps(self, nums):
        n = len(nums)
        order = sorted(range(n), key=lambda i: nums[i])
        seen = [False] * n
        swaps = 0
        for i in range(n):
            if seen[i] or order[i] == i:
                seen[i] = True
                continue
            length = 0
            j = i
            while not seen[j]:
                seen[j] = True
                j = order[j]
                length += 1
            swaps += length - 1
        return swaps
`,
    javascript: `class Solution {
    minSwaps(nums) {
        const n = nums.length;
        const order = Array.from({length: n}, (_, i) => i).sort((a, b) => nums[a] - nums[b]);
        const seen = new Array(n).fill(false);
        let swaps = 0;
        for (let i = 0; i < n; i++) {
            if (seen[i] || order[i] === i) { seen[i] = true; continue; }
            let len = 0, j = i;
            while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
            swaps += len - 1;
        }
        return swaps;
    }
}
`,
    java: `import java.util.*;
class Solution {
    public int minSwaps(int[] nums) {
        int n = nums.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> nums[a] - nums[b]);
        boolean[] seen = new boolean[n];
        int swaps = 0;
        for (int i = 0; i < n; i++) {
            if (seen[i] || order[i] == i) { seen[i] = true; continue; }
            int len = 0, j = i;
            while (!seen[j]) { seen[j] = true; j = order[j]; len++; }
            swaps += len - 1;
        }
        return swaps;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
class Solution {
public:
    int minSwaps(vector<int>& nums) {
        int n = nums.size();
        vector<int> order(n); iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return nums[a] < nums[b]; });
        vector<char> seen(n, 0);
        int swaps = 0;
        for (int i = 0; i < n; i++) {
            if (seen[i] || order[i] == i) { seen[i] = 1; continue; }
            int len = 0, j = i;
            while (!seen[j]) { seen[j] = 1; j = order[j]; len++; }
            swaps += len - 1;
        }
        return swaps;
    }
};
`,
  },
});

fs.writeFileSync('/tmp/patch-500-02-part1.json', JSON.stringify(entries, null, 2));
console.log('Wrote part1 with ' + entries.length + ' entries.');
