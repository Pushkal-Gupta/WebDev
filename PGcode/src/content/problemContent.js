// Rich problem content keyed by problem id.
//
// Workspace reads from `problem.solutions` / `problem.viz_steps` (DB) first;
// if either is missing, falls back to this client-side registry. That way
// the curated 30 core problems work in any environment (incl. when schema
// migrate-28 hasn't been applied yet to the live DB).
//
// Shape per entry:
//   {
//     solutions: { python: { code, complexity: { time, space }, approach }, javascript, java, cpp },
//     viz: { renderer: 'array'|'graph'|'tree'|'window'|'grid', title, frames: [{ caption, ...payload }] },
//     tags: [...],
//     companies: [...],   // company-slug strings; resolved to names via PGcode_companies
//     constraints: '...',
//     followUp: '...',
//     similar: [...],     // sibling problem ids
//   }

function binarySearchViz() {
  const arr = [-1, 0, 3, 5, 9, 12];
  const target = 9;
  const frames = [];
  let lo = 0, hi = arr.length - 1;
  const eliminated = new Set();
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(eliminated),
    caption: `Sorted input: [${arr.join(', ')}]. Search target = ${target}. Initialize lo=${lo}, hi=${hi}.`,
  });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `mid = (lo + hi) / 2 = (${lo} + ${hi}) / 2 = ${mid}. arr[${mid}] = ${arr[mid]}.`,
    });
    if (arr[mid] === target) {
      frames.push({
        array: arr,
        highlights: { [mid]: 'match' },
        eliminated: new Set(eliminated),
        caption: `Match! arr[${mid}] equals ${target}. Return ${mid}.`,
      });
      break;
    }
    if (arr[mid] < target) {
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
        eliminated: new Set([...eliminated, ...Array.from({ length: mid - lo + 1 }, (_, k) => lo + k)]),
        caption: `${arr[mid]} < ${target} — target must be in the right half. Discard arr[${lo}..${mid}].`,
      });
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high' },
        eliminated: new Set(eliminated),
        caption: `Move lo to ${lo}. Active window: arr[${lo}..${hi}].`,
      });
    } else {
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
        eliminated: new Set([...eliminated, ...Array.from({ length: hi - mid + 1 }, (_, k) => mid + k)]),
        caption: `${arr[mid]} > ${target} — target must be in the left half. Discard arr[${mid}..${hi}].`,
      });
      for (let k = mid; k <= hi; k++) eliminated.add(k);
      hi = mid - 1;
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high' },
        eliminated: new Set(eliminated),
        caption: `Move hi to ${hi}. Active window: arr[${lo}..${hi}].`,
      });
    }
  }
  frames.push({
    array: arr,
    eliminated: new Set(eliminated),
    caption: `Done. Binary search runs in O(log n) — for n=${arr.length}, at most ${Math.ceil(Math.log2(arr.length + 1))} compares.`,
  });
  return { renderer: 'array', title: 'Binary search step-by-step', frames };
}

// ── Two Sum ─────────────────────────────────────────────────────────
function twoSumViz() {
  const nums = [2, 7, 11, 15];
  const target = 9;
  const seen = {};
  const frames = [];
  frames.push({
    array: nums,
    caption: `Find indices of two numbers in [${nums.join(', ')}] summing to ${target}. We'll scan once, remembering numbers in a hashmap.`,
  });
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    frames.push({
      array: nums,
      highlights: { [i]: 'mid' },
      caption: `i=${i}, nums[i]=${nums[i]}. Look for complement (${target} − ${nums[i]} = ${need}) in the hashmap. Seen so far: {${Object.entries(seen).map(([k, v]) => `${k}:${v}`).join(', ') || '∅'}}.`,
    });
    if (need in seen) {
      frames.push({
        array: nums,
        highlights: { [seen[need]]: 'match', [i]: 'match' },
        caption: `Found! ${nums[seen[need]]} (index ${seen[need]}) + ${nums[i]} (index ${i}) = ${target}. Return [${seen[need]}, ${i}].`,
      });
      return { renderer: 'array', title: 'Two Sum — single-pass hashmap', frames };
    }
    seen[nums[i]] = i;
    frames.push({
      array: nums,
      highlights: { [i]: 'low' },
      caption: `Complement ${need} not yet seen. Record nums[${i}]=${nums[i]} → ${i} in the hashmap and move on.`,
    });
  }
  return { renderer: 'array', title: 'Two Sum — single-pass hashmap', frames };
}

// ── Maximum Subarray (Kadane's) ─────────────────────────────────────
function kadaneVizFlagship() {
  const a = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
  const frames = [];
  let cur = a[0], best = a[0], bestStart = 0, bestEnd = 0, curStart = 0;
  frames.push({
    array: a,
    highlights: { 0: 'mid' },
    caption: `Kadane's: walk left→right keeping (cur = best ending here, best = best so far). cur = best = a[0] = ${a[0]}.`,
  });
  for (let i = 1; i < a.length; i++) {
    if (cur + a[i] < a[i]) { cur = a[i]; curStart = i; }
    else { cur = cur + a[i]; }
    const elim = new Set();
    for (let k = 0; k < curStart; k++) elim.add(k);
    let beat = false;
    if (cur > best) { best = cur; bestStart = curStart; bestEnd = i; beat = true; }
    frames.push({
      array: a,
      highlights: { [i]: 'mid', [curStart]: 'low' },
      eliminated: elim,
      caption: `i=${i}: cur = ${cur} (subarray a[${curStart}..${i}]). best = ${best}.${beat ? ' New maximum!' : ''}`,
    });
  }
  const elim = new Set();
  for (let k = 0; k < a.length; k++) if (k < bestStart || k > bestEnd) elim.add(k);
  frames.push({
    array: a,
    highlights: Object.fromEntries(Array.from({ length: bestEnd - bestStart + 1 }, (_, k) => [bestStart + k, 'match'])),
    eliminated: elim,
    caption: `Maximum subarray is a[${bestStart}..${bestEnd}] with sum ${best}.`,
  });
  return { renderer: 'array', title: "Kadane's algorithm", frames };
}

// ── Valid Parentheses ───────────────────────────────────────────────
function validParensViz() {
  const s = '({[]})';
  const stack = [];
  const PAIR = { ')': '(', ']': '[', '}': '{' };
  const frames = [];
  frames.push({
    array: s.split('').map(c => c.charCodeAt(0)),
    caption: `Validate "${s}". Push opens, pop on closes and verify match.`,
  });
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch in PAIR) {
      const top = stack[stack.length - 1];
      const match = top === PAIR[ch];
      frames.push({
        array: s.split('').map(c => c.charCodeAt(0)),
        highlights: { [i]: match ? 'match' : 'high' },
        caption: `i=${i}: '${ch}' is a close. Top of stack is '${top || 'empty'}'. ${match ? 'Matches — pop.' : 'Mismatch — invalid.'}`,
      });
      if (match) stack.pop();
      else return { renderer: 'array', title: 'Valid parentheses', frames };
    } else {
      stack.push(ch);
      frames.push({
        array: s.split('').map(c => c.charCodeAt(0)),
        highlights: { [i]: 'low' },
        caption: `i=${i}: '${ch}' is an open. Push to stack. Stack: [${stack.join('')}].`,
      });
    }
  }
  frames.push({
    array: s.split('').map(c => c.charCodeAt(0)),
    caption: stack.length === 0 ? `End reached, stack empty → valid.` : `Stack non-empty: [${stack.join('')}] → invalid.`,
  });
  return { renderer: 'array', title: 'Valid parentheses', frames };
}

// ── Climbing Stairs ────────────────────────────────────────────────
function climbingStairsViz() {
  const n = 7;
  const dp = [1, 1];
  const frames = [];
  frames.push({
    array: [1, 1, 0, 0, 0, 0, 0, 0],
    highlights: { 0: 'match', 1: 'match' },
    caption: `Climb to step ${n}. dp[0]=1, dp[1]=1 (one way to start, one way to be on step 1).`,
  });
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    frames.push({
      array: [...dp, ...Array(n + 1 - dp.length).fill(0)],
      highlights: { [i]: 'mid', [i - 1]: 'low', [i - 2]: 'low' },
      caption: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`,
    });
  }
  frames.push({
    array: dp,
    highlights: { [n]: 'match' },
    caption: `Answer = dp[${n}] = ${dp[n]} distinct ways to climb ${n} steps. O(n) time, O(1) extra space possible.`,
  });
  return { renderer: 'array', title: 'Climbing stairs DP', frames };
}

// ── Reverse Linked List ────────────────────────────────────────────
function reverseListViz() {
  const list = [1, 2, 3, 4, 5];
  const frames = [];
  frames.push({
    array: list,
    caption: `Reverse the list [${list.join(' → ')}]. Maintain three pointers: prev (red), cur (highlighted), next (yellow).`,
  });
  let prev = -1, cur = 0;
  const order = [...list];
  while (cur < list.length) {
    const next = cur + 1;
    frames.push({
      array: order,
      highlights: {
        ...(prev >= 0 ? { [prev]: 'high' } : {}),
        [cur]: 'mid',
        ...(next < list.length ? { [next]: 'low' } : {}),
      },
      caption: `prev = ${prev >= 0 ? order[prev] : 'null'}, cur = ${order[cur]}, next = ${next < list.length ? order[next] : 'null'}. Rewire cur.next → prev.`,
    });
    prev = cur;
    cur = next;
  }
  frames.push({
    array: [...list].reverse(),
    highlights: Object.fromEntries(list.map((_, i) => [i, 'match'])),
    caption: `Done. New head = ${list[list.length - 1]}. Reversed: [${[...list].reverse().join(' → ')}].`,
  });
  return { renderer: 'array', title: 'Reverse linked list — 3-pointer rewire', frames };
}

export const RICH_CONTENT = {
  // ── 5 flagship problems with full multi-lang solutions + viz ──────
  'two-sum': {
    tags: ['array', 'hash-map'],
    companies: ['google', 'meta', 'amazon', 'microsoft', 'apple', 'bloomberg'],
    viz: twoSumViz(),
    solutions: {
      python: {
        code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Single pass — for each x, look up the complement (target - x) in a hashmap we build as we go. The first hit is the answer.',
      },
      javascript: {
        code: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Same hashmap idea using JS Map. Map preserves insertion order which is irrelevant here but is what you want for related problems.',
      },
      java: {
        code: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Java HashMap. Allocate result array only if found. Returning new int[0] for the impossible case (problem guarantees an answer exists).',
      },
      cpp: {
        code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int need = target - nums[i];
            auto it = seen.find(need);
            if (it != seen.end()) return {it->second, i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'unordered_map for O(1) average lookup. Use auto+find to avoid double hashing (vs. count() + []).',
      },
    },
  },
  'max-subarray': {
    tags: ['array', 'dynamic-programming'],
    companies: ['amazon', 'microsoft', 'apple', 'meta', 'bloomberg'],
    viz: kadaneVizFlagship(),
    solutions: {
      python: {
        code: `def maxSubArray(nums: list[int]) -> int:
    cur = best = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)   # extend or restart
        best = max(best, cur)
    return best`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: "Kadane's algorithm. For each element, decide: start fresh here (x) or extend the running sum (cur + x). Track the best ever.",
      },
      javascript: {
        code: `function maxSubArray(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Iterative Kadane in JS. Equivalent to the Python version, just spelled out with Math.max.',
      },
      java: {
        code: `class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same one-pass Kadane.',
      },
      cpp: {
        code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int cur = nums[0], best = nums[0];
        for (size_t i = 1; i < nums.size(); ++i) {
            cur = max(nums[i], cur + nums[i]);
            best = max(best, cur);
        }
        return best;
    }
};`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same one-pass Kadane in C++.',
      },
    },
  },
  'valid-parentheses': {
    tags: ['stack', 'string'],
    companies: ['amazon', 'microsoft', 'meta', 'google', 'bloomberg'],
    viz: validParensViz(),
    solutions: {
      python: {
        code: `def isValid(s: str) -> bool:
    stack = []
    pair = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in pair:
            if not stack or stack.pop() != pair[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Push opens, pop on each close and verify it matches. Valid iff stack empties to nothing.',
      },
      javascript: {
        code: `function isValid(s) {
  const stack = [];
  const pair = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if (ch in pair) {
      if (stack.pop() !== pair[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Same stack pattern. `stack.pop()` on empty returns undefined which compares !== to any opener — short-circuits cleanly.',
      },
      java: {
        code: `class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> pair = Map.of(')', '(', ']', '[', '}', '{');
        for (char ch : s.toCharArray()) {
            if (pair.containsKey(ch)) {
                if (stack.isEmpty() || stack.pop() != pair.get(ch)) return false;
            } else {
                stack.push(ch);
            }
        }
        return stack.isEmpty();
    }
}`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Use ArrayDeque (faster than legacy Stack class). Map.of for a tiny immutable lookup.',
      },
      cpp: {
        code: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> pair = {{')', '('}, {']', '['}, {'}', '{'}};
        for (char ch : s) {
            if (pair.count(ch)) {
                if (st.empty() || st.top() != pair[ch]) return false;
                st.pop();
            } else {
                st.push(ch);
            }
        }
        return st.empty();
    }
};`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Standard std::stack of chars. count() avoids the find()+!=end() dance.',
      },
    },
  },
  'climbing-stairs': {
    tags: ['dynamic-programming', 'math'],
    companies: ['amazon', 'apple', 'microsoft', 'google', 'bloomberg'],
    viz: climbingStairsViz(),
    solutions: {
      python: {
        code: `def climbStairs(n: int) -> int:
    a, b = 1, 1     # ways(0), ways(1)
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Fibonacci shifted by one. Only the last two values matter — keep them in two ints, no array needed.',
      },
      javascript: {
        code: `function climbStairs(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Tuple-swap for the rolling pair. JS destructuring keeps it terse.',
      },
      java: {
        code: `class Solution {
    public int climbStairs(int n) {
        int a = 1, b = 1;
        for (int i = 2; i <= n; i++) {
            int next = a + b;
            a = b; b = next;
        }
        return b;
    }
}`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Explicit `next` var since Java has no tuple-swap. Same O(1) space.',
      },
      cpp: {
        code: `class Solution {
public:
    int climbStairs(int n) {
        int a = 1, b = 1;
        for (int i = 2; i <= n; ++i) {
            int next = a + b;
            a = b; b = next;
        }
        return b;
    }
};`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same rolling-pair pattern. Could also use std::tie/swap.',
      },
    },
  },
  'reverse-linked-list': {
    tags: ['linked-list', 'recursion'],
    companies: ['amazon', 'meta', 'microsoft', 'apple', 'google'],
    viz: reverseListViz(),
    solutions: {
      python: {
        code: `def reverseList(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Three-pointer iterative rewire. prev starts null; each iteration flips cur.next to prev then walks both forward.',
      },
      javascript: {
        code: `function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const nxt = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Standard iterative reverse. Recursive version is one-liner but O(n) call-stack space.',
      },
      java: {
        code: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;
        while (cur != null) {
            ListNode nxt = cur.next;
            cur.next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }
}`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Three-pointer iterative reverse in Java.',
      },
      cpp: {
        code: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *prev = nullptr, *cur = head;
        while (cur) {
            ListNode* nxt = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }
};`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same iterative reverse in C++ with raw pointers.',
      },
    },
  },

  'binary-search': {
    tags: ['binary-search', 'array', 'divide-and-conquer'],
    companies: ['google', 'meta', 'amazon', 'microsoft', 'apple', 'bloomberg'],
    constraints:
      '1 ≤ nums.length ≤ 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.',
    followUp:
      'Can you handle duplicates by returning the leftmost or rightmost occurrence? Look at "Find First and Last Position of Element in Sorted Array."',
    similar: ['search-insert-position', 'find-first-last-position', 'search-rotated-sorted', 'find-minimum-rotated-sorted', 'find-peak-element', 'sqrt-x'],
    viz: binarySearchViz(),
    solutions: {
      python: {
        code: `def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2   # avoid overflow on very large arrays
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach:
          'Maintain a half-open window [lo, hi] that must contain the target if it exists. Each iteration halves the window by comparing the middle element. When lo crosses hi, the target was absent.',
      },
      javascript: {
        code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);   // bit-shift for floor division
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach:
          'Same iterative window-halving as Python. The bit-shift `>> 1` is functionally equivalent to `Math.floor((hi-lo)/2)` and slightly faster.',
      },
      java: {
        code: `class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;   // avoid (lo + hi) overflow
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach:
          '`lo + (hi - lo) / 2` is the standard Java idiom — `(lo + hi) / 2` overflows when both are near Integer.MAX_VALUE.',
      },
      cpp: {
        code: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
};`,
        complexity: { time: 'O(log n)', space: 'O(1)' },
        approach:
          'STL `std::lower_bound` does this exact search in 1 line — but writing it yourself is the canonical interview answer.',
      },
    },
  },
};

// Generate 35 deterministic test cases for binary-search (for future seed).
export function binarySearchTestCases() {
  const cases = [
    // canonical
    { inputs: ['[-1,0,3,5,9,12]', '9'], expected: '4' },
    { inputs: ['[-1,0,3,5,9,12]', '2'], expected: '-1' },
    // boundaries
    { inputs: ['[5]', '5'], expected: '0' },
    { inputs: ['[5]', '-5'], expected: '-1' },
    { inputs: ['[1,2]', '1'], expected: '0' },
    { inputs: ['[1,2]', '2'], expected: '1' },
    { inputs: ['[1,2]', '0'], expected: '-1' },
    { inputs: ['[1,2]', '3'], expected: '-1' },
    // target at start, middle, end
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '1'], expected: '0' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '10'], expected: '9' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'], expected: '4' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '6'], expected: '5' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '11'], expected: '-1' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '0'], expected: '-1' },
    // negatives
    { inputs: ['[-10,-5,0,3,7]', '0'], expected: '2' },
    { inputs: ['[-10,-5,0,3,7]', '-10'], expected: '0' },
    { inputs: ['[-10,-5,0,3,7]', '7'], expected: '4' },
    { inputs: ['[-10,-5,0,3,7]', '-3'], expected: '-1' },
    { inputs: ['[-10,-5,0,3,7]', '8'], expected: '-1' },
    { inputs: ['[-10,-5,0,3,7]', '-11'], expected: '-1' },
    // odd-length, near-middle
    { inputs: ['[1,3,5,7,9,11,13]', '7'], expected: '3' },
    { inputs: ['[1,3,5,7,9,11,13]', '6'], expected: '-1' },
    { inputs: ['[1,3,5,7,9,11,13]', '13'], expected: '6' },
    { inputs: ['[1,3,5,7,9,11,13]', '1'], expected: '0' },
    // singletons + missing
    { inputs: ['[100]', '100'], expected: '0' },
    { inputs: ['[100]', '99'], expected: '-1' },
    // even-length sweep
    { inputs: ['[2,4,6,8,10,12,14,16]', '2'], expected: '0' },
    { inputs: ['[2,4,6,8,10,12,14,16]', '16'], expected: '7' },
    { inputs: ['[2,4,6,8,10,12,14,16]', '8'], expected: '3' },
    { inputs: ['[2,4,6,8,10,12,14,16]', '10'], expected: '4' },
    { inputs: ['[2,4,6,8,10,12,14,16]', '9'], expected: '-1' },
    { inputs: ['[2,4,6,8,10,12,14,16]', '17'], expected: '-1' },
    { inputs: ['[2,4,6,8,10,12,14,16]', '1'], expected: '-1' },
    // stress: 100-element sorted range, every other target
    { inputs: ['[' + Array.from({ length: 100 }, (_, i) => i * 2).join(',') + ']', '50'], expected: '25' },
    { inputs: ['[' + Array.from({ length: 100 }, (_, i) => i * 2).join(',') + ']', '99'], expected: '-1' },
    { inputs: ['[' + Array.from({ length: 100 }, (_, i) => i * 2).join(',') + ']', '198'], expected: '99' },
  ];
  return cases;
}
