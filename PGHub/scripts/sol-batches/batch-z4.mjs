// Batch z4: zerosol-authorable.json indices [42, 56).
// Each value is the METHOD BODY ONLY in the LeetCode-style class/function shape
// that wrapWithDriver expects, signatures matching
// generateTemplate(language, method_name, params, return_type) exactly
// (verified against PGcode_problems in the DB).
//
// Skipped (see report):
//   populating-next-right-pointers-in-each-node — param typed List[int] is passed
//     as a FLAT int array (no tree reconstruction), and the stored `expected`
//     ("[1,#,2,3,#,...]") is a bespoke next-pointer serialization the driver can
//     never produce. Not gradeable through this harness.
//   remove-duplicates-from-sorted-array — stored `expected` is a LeetCode display
//     string ("2, nums = [1,2,_]"), not JSON; the int-return serializer prints a
//     bare int and can never match it.
//
// n-queens GOTCHA: DB return_type is List[List[str]] but every stored test case
//   expects the INTEGER COUNT of distinct solutions ("1","0","2","10","92"...).
//   So the canonical RETURNS THE COUNT (an int). Python/JS print a bare int that
//   matches. Java/C++ are intentionally omitted: their generateTemplate signature
//   is vector<vector<string>> / List<List<String>> and returning an int there is a
//   compile error — supplying boards instead would serialize as a board list and
//   never match the integer expected. The grader tolerates missing langs.

export default {
  // minMeetingRooms(intervals: List[List[int]]) -> int
  // Sweep: sort starts and ends, count concurrent meetings.
  'meeting-rooms': {
    python: `class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        if not intervals:
            return 0
        starts = sorted(i[0] for i in intervals)
        ends = sorted(i[1] for i in intervals)
        rooms = 0
        best = 0
        s = e = 0
        n = len(intervals)
        while s < n:
            if starts[s] < ends[e]:
                rooms += 1
                best = max(best, rooms)
                s += 1
            else:
                rooms -= 1
                e += 1
        return best`,
    javascript: `var minMeetingRooms = function(intervals) {
    if (!intervals || intervals.length === 0) return 0;
    const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
    const ends = intervals.map(i => i[1]).sort((a, b) => a - b);
    let rooms = 0, best = 0, s = 0, e = 0;
    const n = intervals.length;
    while (s < n) {
        if (starts[s] < ends[e]) { rooms++; best = Math.max(best, rooms); s++; }
        else { rooms--; e++; }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        if (intervals == null || intervals.length == 0) return 0;
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, best = 0, s = 0, e = 0;
        while (s < n) {
            if (starts[s] < ends[e]) { rooms++; best = Math.max(best, rooms); s++; }
            else { rooms--; e++; }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        if (intervals.empty()) return 0;
        int n = intervals.size();
        vector<int> starts(n), ends(n);
        for (int i = 0; i < n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0, best = 0, s = 0, e = 0;
        while (s < n) {
            if (starts[s] < ends[e]) { rooms++; best = max(best, rooms); s++; }
            else { rooms--; e++; }
        }
        return best;
    }
};`,
  },

  // isMonotonic(nums: List[int]) -> bool
  'monotonic-array': {
    python: `class Solution:
    def isMonotonic(self, nums: List[int]) -> bool:
        inc = dec = True
        for i in range(1, len(nums)):
            if nums[i] > nums[i - 1]:
                dec = False
            if nums[i] < nums[i - 1]:
                inc = False
        return inc or dec`,
    javascript: `var isMonotonic = function(nums) {
    let inc = true, dec = true;
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] > nums[i - 1]) dec = false;
        if (nums[i] < nums[i - 1]) inc = false;
    }
    return inc || dec;
};`,
    java: `class Solution {
    public boolean isMonotonic(int[] nums) {
        boolean inc = true, dec = true;
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] > nums[i - 1]) dec = false;
            if (nums[i] < nums[i - 1]) inc = false;
        }
        return inc || dec;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isMonotonic(vector<int>& nums) {
        bool inc = true, dec = true;
        for (int i = 1; i < (int)nums.size(); i++) {
            if (nums[i] > nums[i - 1]) dec = false;
            if (nums[i] < nums[i - 1]) inc = false;
        }
        return inc || dec;
    }
};`,
  },

  // removeStones(stones: List[List[int]]) -> int
  // Union rows and columns; answer = stones - number of connected components.
  'most-stones-removed-with-same-row-or-column': {
    python: `class Solution:
    def removeStones(self, stones: List[List[int]]) -> int:
        parent = {}
        def find(x):
            parent.setdefault(x, x)
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        for r, c in stones:
            union(('r', r), ('c', c))
        roots = {find(('r', r)) for r, c in stones}
        return len(stones) - len(roots)`,
    javascript: `var removeStones = function(stones) {
    const parent = new Map();
    const find = (x) => {
        if (!parent.has(x)) parent.set(x, x);
        while (parent.get(x) !== x) {
            parent.set(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    };
    const union = (a, b) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent.set(ra, rb);
    };
    for (const [r, c] of stones) union('r' + r, 'c' + c);
    const roots = new Set();
    for (const [r, c] of stones) roots.add(find('r' + r));
    return stones.length - roots.size;
};`,
    java: `import java.util.*;
class Solution {
    private Map<String, String> parent = new HashMap<>();
    private String find(String x) {
        parent.putIfAbsent(x, x);
        while (!parent.get(x).equals(x)) {
            parent.put(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    }
    private void union(String a, String b) {
        String ra = find(a), rb = find(b);
        if (!ra.equals(rb)) parent.put(ra, rb);
    }
    public int removeStones(int[][] stones) {
        for (int[] s : stones) union("r" + s[0], "c" + s[1]);
        Set<String> roots = new HashSet<>();
        for (int[] s : stones) roots.add(find("r" + s[0]));
        return stones.length - roots.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    unordered_map<string, string> parent;
    string find(const string& x) {
        if (!parent.count(x)) parent[x] = x;
        string r = x;
        while (parent[r] != r) { parent[r] = parent[parent[r]]; r = parent[r]; }
        return r;
    }
    void uni(const string& a, const string& b) {
        string ra = find(a), rb = find(b);
        if (ra != rb) parent[ra] = rb;
    }
    int removeStones(vector<vector<int>>& stones) {
        for (auto& s : stones) uni("r" + to_string(s[0]), "c" + to_string(s[1]));
        set<string> roots;
        for (auto& s : stones) roots.insert(find("r" + to_string(s[0])));
        return (int)stones.size() - (int)roots.size();
    }
};`,
  },

  // solveNQueens(n: int) -> List[List[str]]  — but stored tests expect the INTEGER
  // COUNT of distinct solutions. Canonical returns the count (python/js only).
  'n-queens': {
    python: `class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        cols = set()
        diag = set()
        anti = set()
        self.count = 0
        def place(r):
            if r == n:
                self.count += 1
                return
            for c in range(n):
                if c in cols or (r - c) in diag or (r + c) in anti:
                    continue
                cols.add(c); diag.add(r - c); anti.add(r + c)
                place(r + 1)
                cols.remove(c); diag.remove(r - c); anti.remove(r + c)
        place(0)
        return self.count`,
    javascript: `var solveNQueens = function(n) {
    const cols = new Set(), diag = new Set(), anti = new Set();
    let count = 0;
    const place = (r) => {
        if (r === n) { count++; return; }
        for (let c = 0; c < n; c++) {
            if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;
            cols.add(c); diag.add(r - c); anti.add(r + c);
            place(r + 1);
            cols.delete(c); diag.delete(r - c); anti.delete(r + c);
        }
    };
    place(0);
    return count;
};`,
  },

  // nextGreaterElement(nums1: List[int], nums2: List[int]) -> List[int]
  // Monotonic stack over nums2 maps each value to its next greater; look up nums1.
  'next-greater-element-i': {
    python: `class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        nxt = {}
        stack = []
        for x in nums2:
            while stack and stack[-1] < x:
                nxt[stack.pop()] = x
            stack.append(x)
        return [nxt.get(x, -1) for x in nums1]`,
    javascript: `var nextGreaterElement = function(nums1, nums2) {
    const nxt = new Map();
    const stack = [];
    for (const x of nums2) {
        while (stack.length && stack[stack.length - 1] < x) nxt.set(stack.pop(), x);
        stack.push(x);
    }
    return nums1.map(x => nxt.has(x) ? nxt.get(x) : -1);
};`,
    java: `import java.util.*;
class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> nxt = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int x : nums2) {
            while (!stack.isEmpty() && stack.peek() < x) nxt.put(stack.pop(), x);
            stack.push(x);
        }
        int[] res = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) res[i] = nxt.getOrDefault(nums1[i], -1);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {
        unordered_map<int, int> nxt;
        vector<int> stack;
        for (int x : nums2) {
            while (!stack.empty() && stack.back() < x) { nxt[stack.back()] = x; stack.pop_back(); }
            stack.push_back(x);
        }
        vector<int> res;
        for (int x : nums1) res.push_back(nxt.count(x) ? nxt[x] : -1);
        return res;
    }
};`,
  },

  // nextLargerNodes(head: List[int]) -> List[int]  — input passed as a flat int
  // array (param typed List[int], not ListNode). Monotonic stack of indices.
  'next-greater-node-in-linked-list': {
    python: `class Solution:
    def nextLargerNodes(self, head: List[int]) -> List[int]:
        res = [0] * len(head)
        stack = []
        for i, v in enumerate(head):
            while stack and head[stack[-1]] < v:
                res[stack.pop()] = v
            stack.append(i)
        return res`,
    javascript: `var nextLargerNodes = function(head) {
    const res = new Array(head.length).fill(0);
    const stack = [];
    for (let i = 0; i < head.length; i++) {
        while (stack.length && head[stack[stack.length - 1]] < head[i]) res[stack.pop()] = head[i];
        stack.push(i);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] nextLargerNodes(int[] head) {
        int[] res = new int[head.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < head.length; i++) {
            while (!stack.isEmpty() && head[stack.peek()] < head[i]) res[stack.pop()] = head[i];
            stack.push(i);
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextLargerNodes(vector<int>& head) {
        int n = head.size();
        vector<int> res(n, 0), stack;
        for (int i = 0; i < n; i++) {
            while (!stack.empty() && head[stack.back()] < head[i]) { res[stack.back()] = head[i]; stack.pop_back(); }
            stack.push_back(i);
        }
        return res;
    }
};`,
  },

  // findCircleNum(isConnected: List[List[int]]) -> int  — count DSU components.
  'number-of-provinces': {
    python: `class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for i in range(n):
            for j in range(i + 1, n):
                if isConnected[i][j] == 1:
                    parent[find(i)] = find(j)
        return sum(1 for i in range(n) if find(i) == i)`,
    javascript: `var findCircleNum = function(isConnected) {
    const n = isConnected.length;
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    };
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
            if (isConnected[i][j] === 1) parent[find(i)] = find(j);
    let count = 0;
    for (let i = 0; i < n; i++) if (find(i) === i) count++;
    return count;
};`,
    java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if (isConnected[i][j] == 1) parent[find(i)] = find(j);
        int count = 0;
        for (int i = 0; i < n; i++) if (find(i) == i) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    int findCircleNum(vector<vector<int>>& isConnected) {
        int n = isConnected.size();
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if (isConnected[i][j] == 1) parent[find(i)] = find(j);
        int count = 0;
        for (int i = 0; i < n; i++) if (find(i) == i) count++;
        return count;
    }
};`,
  },

  // openLock(deadends: List[str], target: str) -> int  — BFS over 4-digit states.
  'open-the-lock': {
    python: `class Solution:
    def openLock(self, deadends: List[str], target: str) -> int:
        dead = set(deadends)
        if "0000" in dead:
            return -1
        if target == "0000":
            return 0
        from collections import deque
        q = deque([("0000", 0)])
        seen = {"0000"}
        while q:
            state, steps = q.popleft()
            for i in range(4):
                d = int(state[i])
                for nd in ((d + 1) % 10, (d + 9) % 10):
                    nxt = state[:i] + str(nd) + state[i + 1:]
                    if nxt == target:
                        return steps + 1
                    if nxt not in seen and nxt not in dead:
                        seen.add(nxt)
                        q.append((nxt, steps + 1))
        return -1`,
    javascript: `var openLock = function(deadends, target) {
    const dead = new Set(deadends);
    if (dead.has("0000")) return -1;
    if (target === "0000") return 0;
    const seen = new Set(["0000"]);
    let q = ["0000"], steps = 0;
    while (q.length) {
        const next = [];
        for (const state of q) {
            if (state === target) return steps;
            for (let i = 0; i < 4; i++) {
                const d = state.charCodeAt(i) - 48;
                for (const nd of [(d + 1) % 10, (d + 9) % 10]) {
                    const cand = state.slice(0, i) + nd + state.slice(i + 1);
                    if (!seen.has(cand) && !dead.has(cand)) { seen.add(cand); next.push(cand); }
                }
            }
        }
        q = next; steps++;
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int openLock(String[] deadends, String target) {
        Set<String> dead = new HashSet<>(Arrays.asList(deadends));
        if (dead.contains("0000")) return -1;
        if (target.equals("0000")) return 0;
        Set<String> seen = new HashSet<>();
        seen.add("0000");
        Queue<String> q = new LinkedList<>();
        q.add("0000");
        int steps = 0;
        while (!q.isEmpty()) {
            int sz = q.size();
            for (int k = 0; k < sz; k++) {
                String state = q.poll();
                if (state.equals(target)) return steps;
                for (int i = 0; i < 4; i++) {
                    int d = state.charAt(i) - '0';
                    for (int nd : new int[]{(d + 1) % 10, (d + 9) % 10}) {
                        String cand = state.substring(0, i) + nd + state.substring(i + 1);
                        if (!seen.contains(cand) && !dead.contains(cand)) { seen.add(cand); q.add(cand); }
                    }
                }
            }
            steps++;
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int openLock(vector<string>& deadends, string target) {
        unordered_set<string> dead(deadends.begin(), deadends.end());
        if (dead.count("0000")) return -1;
        if (target == "0000") return 0;
        unordered_set<string> seen{"0000"};
        queue<string> q; q.push("0000");
        int steps = 0;
        while (!q.empty()) {
            int sz = q.size();
            for (int k = 0; k < sz; k++) {
                string state = q.front(); q.pop();
                if (state == target) return steps;
                for (int i = 0; i < 4; i++) {
                    int d = state[i] - '0';
                    for (int nd : {(d + 1) % 10, (d + 9) % 10}) {
                        string cand = state;
                        cand[i] = char('0' + nd);
                        if (!seen.count(cand) && !dead.count(cand)) { seen.insert(cand); q.push(cand); }
                    }
                }
            }
            steps++;
        }
        return -1;
    }
};`,
  },

  // numPairsDivisibleBy60(time: List[int]) -> int  — count pairs (a+b)%60==0.
  'pairs-of-songs-with-total-durations-divisible-by-60': {
    python: `class Solution:
    def numPairsDivisibleBy60(self, time: List[int]) -> int:
        count = [0] * 60
        res = 0
        for t in time:
            r = t % 60
            res += count[(60 - r) % 60]
            count[r] += 1
        return res`,
    javascript: `var numPairsDivisibleBy60 = function(time) {
    const count = new Array(60).fill(0);
    let res = 0;
    for (const t of time) {
        const r = t % 60;
        res += count[(60 - r) % 60];
        count[r]++;
    }
    return res;
};`,
    java: `class Solution {
    public int numPairsDivisibleBy60(int[] time) {
        int[] count = new int[60];
        int res = 0;
        for (int t : time) {
            int r = t % 60;
            res += count[(60 - r) % 60];
            count[r]++;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numPairsDivisibleBy60(vector<int>& time) {
        vector<int> count(60, 0);
        int res = 0;
        for (int t : time) {
            int r = t % 60;
            res += count[(60 - r) % 60];
            count[r]++;
        }
        return res;
    }
};`,
  },

  // isPowerOfTwo(n: int) -> bool
  'power-of-two': {
    python: `class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        return n > 0 and (n & (n - 1)) == 0`,
    javascript: `var isPowerOfTwo = function(n) {
    return n > 0 && (n & (n - 1)) === 0;
};`,
    java: `class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
};`,
  },

  // reconstructQueue(people: List[List[int]]) -> List[List[int]]
  // Sort by height desc, k asc; insert each at index k.
  'queue-reconstruction-by-height': {
    python: `class Solution:
    def reconstructQueue(self, people: List[List[int]]) -> List[List[int]]:
        people.sort(key=lambda p: (-p[0], p[1]))
        res = []
        for p in people:
            res.insert(p[1], p)
        return res`,
    javascript: `var reconstructQueue = function(people) {
    people.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    const res = [];
    for (const p of people) res.splice(p[1], 0, p);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] reconstructQueue(int[][] people) {
        Arrays.sort(people, (a, b) -> a[0] != b[0] ? b[0] - a[0] : a[1] - b[1]);
        List<int[]> res = new ArrayList<>();
        for (int[] p : people) res.add(p[1], p);
        return res.toArray(new int[res.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> reconstructQueue(vector<vector<int>>& people) {
        sort(people.begin(), people.end(), [](const vector<int>& a, const vector<int>& b){
            return a[0] != b[0] ? a[0] > b[0] : a[1] < b[1];
        });
        vector<vector<int>> res;
        for (auto& p : people) res.insert(res.begin() + p[1], p);
        return res;
    }
};`,
  },

  // findRedundantConnection(edges: List[List[int]]) -> List[int]
  // Union-find; first edge that connects two already-joined nodes is redundant.
  'redundant-connection': {
    python: `class Solution:
    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:
        parent = list(range(len(edges) + 1))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:
                return [a, b]
            parent[ra] = rb
        return []`,
    javascript: `var findRedundantConnection = function(edges) {
    const parent = Array.from({length: edges.length + 1}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    };
    for (const [a, b] of edges) {
        const ra = find(a), rb = find(b);
        if (ra === rb) return [a, b];
        parent[ra] = rb;
    }
    return [];
};`,
    java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public int[] findRedundantConnection(int[][] edges) {
        parent = new int[edges.length + 1];
        for (int i = 0; i < parent.length; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return new int[]{e[0], e[1]};
            parent[ra] = rb;
        }
        return new int[0];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    vector<int> findRedundantConnection(vector<vector<int>>& edges) {
        parent.resize(edges.size() + 1);
        for (size_t i = 0; i < parent.size(); i++) parent[i] = i;
        for (auto& e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return {e[0], e[1]};
            parent[ra] = rb;
        }
        return {};
    }
};`,
  },
};
