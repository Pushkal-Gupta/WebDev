// Authored-from-scratch 4-language canonicals for zero-solution famous problems.
// Slice [56,68) of scripts/zerosol-authorable.json. Signatures match
// generateTemplate(language, method_name, params, return_type) from
// src/lib/driverCode.js exactly. The backfill runner grades each language
// against the problem's own stored test_cases via Judge0 and writes only
// passing languages. Skipped (not present here): remove-duplicates-from-sorted-array-ii
// (return Any with display-string expected "5, nums = [...]"), unique-binary-search-trees-ii
// (return Any with tree-node arrays + null tokens the driver cannot grade).

export default {
  // repeatedSubstringPattern(s: str) -> bool
  // s is built from a repeated substring iff s is a non-trivial rotation of itself:
  // (s + s) with first and last char removed still contains s.
  'repeated-substring-pattern': {
    python: `class Solution:
    def repeatedSubstringPattern(self, s: str) -> bool:
        return s in (s + s)[1:-1]`,
    javascript: `var repeatedSubstringPattern = function(s) {
    return (s + s).slice(1, -1).includes(s);
};`,
    java: `class Solution {
    public boolean repeatedSubstringPattern(String s) {
        String d = (s + s).substring(1, 2 * s.length() - 1);
        return d.contains(s);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool repeatedSubstringPattern(string s) {
        string d = (s + s).substr(1, 2 * s.size() - 2);
        return d.find(s) != string::npos;
    }
};`,
  },

  // rotateRight(head: List[int], k: int) -> List[int]
  // head arrives as a plain array (driver passes List[int], not a ListNode here);
  // rotate the array right by k (mod length). Empty -> empty.
  'rotate-list': {
    python: `class Solution:
    def rotateRight(self, head: List[int], k: int) -> List[int]:
        n = len(head)
        if n == 0:
            return []
        k %= n
        if k == 0:
            return head[:]
        return head[-k:] + head[:-k]`,
    javascript: `var rotateRight = function(head, k) {
    const n = head.length;
    if (n === 0) return [];
    k %= n;
    if (k === 0) return head.slice();
    return head.slice(n - k).concat(head.slice(0, n - k));
};`,
    java: `class Solution {
    public int[] rotateRight(int[] head, int k) {
        int n = head.length;
        if (n == 0) return new int[0];
        k %= n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) {
            res[(i + k) % n] = head[i];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& head, int k) {
        int n = head.size();
        if (n == 0) return {};
        k %= n;
        vector<int> res(n);
        for (int i = 0; i < n; i++) {
            res[(i + k) % n] = head[i];
        }
        return res;
    }
};`,
  },

  // snakesAndLadders(input: List[List[int]]) -> Any (int)
  // BFS over board squares numbered 1..n*n in boustrophedon order; a square with
  // value != -1 teleports to that destination. Min number of dice moves to reach n*n.
  'snakes-and-ladders': {
    python: `class Solution:
    def snakesAndLadders(self, input: List[List[int]]) -> Any:
        board = input
        n = len(board)
        target = n * n
        def cell(num):
            r = (num - 1) // n
            c = (num - 1) % n
            if r % 2 == 1:
                c = n - 1 - c
            return board[n - 1 - r][c]
        from collections import deque
        seen = {1}
        q = deque([(1, 0)])
        while q:
            cur, moves = q.popleft()
            if cur == target:
                return moves
            for nxt in range(cur + 1, min(cur + 6, target) + 1):
                dest = cell(nxt)
                if dest != -1:
                    nxt = dest
                if nxt not in seen:
                    seen.add(nxt)
                    q.append((nxt, moves + 1))
        return -1`,
    javascript: `var snakesAndLadders = function(input) {
    const board = input, n = board.length, target = n * n;
    const cell = (num) => {
        let r = Math.floor((num - 1) / n);
        let c = (num - 1) % n;
        if (r % 2 === 1) c = n - 1 - c;
        return board[n - 1 - r][c];
    };
    const seen = new Set([1]);
    let q = [[1, 0]];
    while (q.length) {
        const next = [];
        for (const [cur, moves] of q) {
            if (cur === target) return moves;
            for (let nx = cur + 1; nx <= Math.min(cur + 6, target); nx++) {
                let d = cell(nx);
                let v = d === -1 ? nx : d;
                if (!seen.has(v)) { seen.add(v); next.push([v, moves + 1]); }
            }
        }
        q = next;
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int snakesAndLadders(int[][] input) {
        int[][] board = input;
        int n = board.length, target = n * n;
        boolean[] seen = new boolean[target + 1];
        Deque<int[]> q = new ArrayDeque<>();
        q.add(new int[]{1, 0});
        seen[1] = true;
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            if (cur[0] == target) return cur[1];
            for (int nx = cur[0] + 1; nx <= Math.min(cur[0] + 6, target); nx++) {
                int r = (nx - 1) / n, c = (nx - 1) % n;
                if (r % 2 == 1) c = n - 1 - c;
                int d = board[n - 1 - r][c];
                int v = d == -1 ? nx : d;
                if (!seen[v]) { seen[v] = true; q.add(new int[]{v, cur[1] + 1}); }
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int snakesAndLadders(vector<vector<int>>& input) {
        vector<vector<int>>& board = input;
        int n = board.size(), target = n * n;
        vector<bool> seen(target + 1, false);
        queue<pair<int,int>> q;
        q.push({1, 0});
        seen[1] = true;
        while (!q.empty()) {
            auto [cur, moves] = q.front(); q.pop();
            if (cur == target) return moves;
            for (int nx = cur + 1; nx <= min(cur + 6, target); nx++) {
                int r = (nx - 1) / n, c = (nx - 1) % n;
                if (r % 2 == 1) c = n - 1 - c;
                int d = board[n - 1 - r][c];
                int v = d == -1 ? nx : d;
                if (!seen[v]) { seen[v] = true; q.push({v, moves + 1}); }
            }
        }
        return -1;
    }
};`,
  },

  // compress(chars: List[str]) -> int
  // In-place run-length compress; return the new length. Driver serializes the
  // returned int (the expected values are lengths like 6, 1, 4).
  'string-compression': {
    python: `class Solution:
    def compress(self, chars: List[str]) -> int:
        write = 0
        read = 0
        n = len(chars)
        while read < n:
            ch = chars[read]
            count = 0
            while read < n and chars[read] == ch:
                read += 1
                count += 1
            chars[write] = ch
            write += 1
            if count > 1:
                for d in str(count):
                    chars[write] = d
                    write += 1
        return write`,
    javascript: `var compress = function(chars) {
    let write = 0, read = 0;
    const n = chars.length;
    while (read < n) {
        const ch = chars[read];
        let count = 0;
        while (read < n && chars[read] === ch) { read++; count++; }
        chars[write++] = ch;
        if (count > 1) {
            for (const d of String(count)) chars[write++] = d;
        }
    }
    return write;
};`,
    java: `class Solution {
    public int compress(String[] chars) {
        int write = 0, read = 0, n = chars.length;
        while (read < n) {
            String ch = chars[read];
            int count = 0;
            while (read < n && chars[read].equals(ch)) { read++; count++; }
            chars[write++] = ch;
            if (count > 1) {
                for (char d : Integer.toString(count).toCharArray()) {
                    chars[write++] = String.valueOf(d);
                }
            }
        }
        return write;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compress(vector<string>& chars) {
        int write = 0, read = 0, n = chars.size();
        while (read < n) {
            string ch = chars[read];
            int count = 0;
            while (read < n && chars[read] == ch) { read++; count++; }
            chars[write++] = ch;
            if (count > 1) {
                for (char d : to_string(count)) chars[write++] = string(1, d);
            }
        }
        return write;
    }
};`,
  },

  // checkRecord(s: str) -> bool
  // Reward eligible iff < 2 'A' total and no 3 consecutive 'L'.
  'student-attendance-record-i': {
    python: `class Solution:
    def checkRecord(self, s: str) -> bool:
        return s.count('A') < 2 and 'LLL' not in s`,
    javascript: `var checkRecord = function(s) {
    let a = 0;
    for (const c of s) if (c === 'A') a++;
    return a < 2 && !s.includes('LLL');
};`,
    java: `class Solution {
    public boolean checkRecord(String s) {
        int a = 0;
        for (int i = 0; i < s.length(); i++) if (s.charAt(i) == 'A') a++;
        return a < 2 && !s.contains("LLL");
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool checkRecord(string s) {
        int a = 0;
        for (char c : s) if (c == 'A') a++;
        return a < 2 && s.find("LLL") == string::npos;
    }
};`,
  },

  // swapPairs(head: Optional[ListNode]) -> Optional[ListNode]
  // Swap every two adjacent nodes. Real ListNode signature; driver builds the
  // list from the input array and serializes the returned list head.
  'swap-nodes-in-pairs': {
    python: `class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        dummy.next = head
        prev = dummy
        while prev.next and prev.next.next:
            first = prev.next
            second = first.next
            first.next = second.next
            second.next = first
            prev.next = second
            prev = first
        return dummy.next`,
    javascript: `var swapPairs = function(head) {
    const dummy = new ListNode(0);
    dummy.next = head;
    let prev = dummy;
    while (prev.next && prev.next.next) {
        const first = prev.next;
        const second = first.next;
        first.next = second.next;
        second.next = first;
        prev.next = second;
        prev = first;
    }
    return dummy.next;
};`,
    java: `class Solution {
    public ListNode swapPairs(ListNode head) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode prev = dummy;
        while (prev.next != null && prev.next.next != null) {
            ListNode first = prev.next;
            ListNode second = first.next;
            first.next = second.next;
            second.next = first;
            prev.next = second;
            prev = first;
        }
        return dummy.next;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode dummy(0);
        dummy.next = head;
        ListNode* prev = &dummy;
        while (prev->next && prev->next->next) {
            ListNode* first = prev->next;
            ListNode* second = first->next;
            first->next = second->next;
            second->next = first;
            prev->next = second;
            prev = first;
        }
        return dummy.next;
    }
};`,
  },

  // leastInterval(tasks: List[str], n: int) -> int
  // Greedy: arrange around the most frequent task. Answer is
  // max(len(tasks), (maxFreq-1)*(n+1) + #tasks-with-maxFreq).
  'task-scheduler': {
    python: `class Solution:
    def leastInterval(self, tasks: List[str], n: int) -> int:
        from collections import Counter
        counts = Counter(tasks)
        max_freq = max(counts.values())
        n_max = sum(1 for c in counts.values() if c == max_freq)
        return max(len(tasks), (max_freq - 1) * (n + 1) + n_max)`,
    javascript: `var leastInterval = function(tasks, n) {
    const counts = {};
    for (const t of tasks) counts[t] = (counts[t] || 0) + 1;
    let maxFreq = 0;
    for (const k in counts) maxFreq = Math.max(maxFreq, counts[k]);
    let nMax = 0;
    for (const k in counts) if (counts[k] === maxFreq) nMax++;
    return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + nMax);
};`,
    java: `import java.util.*;
class Solution {
    public int leastInterval(String[] tasks, int n) {
        Map<String, Integer> counts = new HashMap<>();
        for (String t : tasks) counts.merge(t, 1, Integer::sum);
        int maxFreq = 0;
        for (int c : counts.values()) maxFreq = Math.max(maxFreq, c);
        int nMax = 0;
        for (int c : counts.values()) if (c == maxFreq) nMax++;
        return Math.max(tasks.length, (maxFreq - 1) * (n + 1) + nMax);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int leastInterval(vector<string>& tasks, int n) {
        unordered_map<string,int> counts;
        for (auto& t : tasks) counts[t]++;
        int maxFreq = 0;
        for (auto& p : counts) maxFreq = max(maxFreq, p.second);
        int nMax = 0;
        for (auto& p : counts) if (p.second == maxFreq) nMax++;
        return max((int)tasks.size(), (maxFreq - 1) * (n + 1) + nMax);
    }
};`,
  },

  // numTrees(n: int) -> int
  // Count of structurally-unique BSTs over n nodes = the nth Catalan number,
  // via DP: dp[i] = sum_{j=0}^{i-1} dp[j]*dp[i-1-j].
  'unique-binary-search-trees': {
    python: `class Solution:
    def numTrees(self, n: int) -> int:
        dp = [0] * (n + 1)
        dp[0] = 1
        for nodes in range(1, n + 1):
            for root in range(nodes):
                dp[nodes] += dp[root] * dp[nodes - 1 - root]
        return dp[n]`,
    javascript: `var numTrees = function(n) {
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let nodes = 1; nodes <= n; nodes++) {
        for (let root = 0; root < nodes; root++) {
            dp[nodes] += dp[root] * dp[nodes - 1 - root];
        }
    }
    return dp[n];
};`,
    java: `class Solution {
    public int numTrees(int n) {
        long[] dp = new long[n + 1];
        dp[0] = 1;
        for (int nodes = 1; nodes <= n; nodes++) {
            for (int root = 0; root < nodes; root++) {
                dp[nodes] += dp[root] * dp[nodes - 1 - root];
            }
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numTrees(int n) {
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        for (int nodes = 1; nodes <= n; nodes++) {
            for (int root = 0; root < nodes; root++) {
                dp[nodes] += dp[root] * dp[nodes - 1 - root];
            }
        }
        return (int) dp[n];
    }
};`,
  },

  // checkValidString(s: str) -> bool
  // '*' may be '(' , ')' or empty. Track the range [lo, hi] of possible open counts.
  'valid-parenthesis-string': {
    python: `class Solution:
    def checkValidString(self, s: str) -> bool:
        lo = hi = 0
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
        return lo == 0`,
    javascript: `var checkValidString = function(s) {
    let lo = 0, hi = 0;
    for (const c of s) {
        if (c === '(') { lo++; hi++; }
        else if (c === ')') { lo--; hi--; }
        else { lo--; hi++; }
        if (hi < 0) return false;
        if (lo < 0) lo = 0;
    }
    return lo === 0;
};`,
    java: `class Solution {
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
}`,
    cpp: `#include <bits/stdc++.h>
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
};`,
  },

  // xorOperation(nums: int, target: int) -> Any (int)
  // LC 1486: nums == n, target == start. Result = XOR of (start + 2*i) for i in 0..n-1.
  'xor-operation-in-an-array': {
    python: `class Solution:
    def xorOperation(self, nums: int, target: int) -> Any:
        result = 0
        for i in range(nums):
            result ^= target + 2 * i
        return result`,
    javascript: `var xorOperation = function(nums, target) {
    let result = 0;
    for (let i = 0; i < nums; i++) {
        result ^= target + 2 * i;
    }
    return result;
};`,
    java: `class Solution {
    public int xorOperation(int nums, int target) {
        int result = 0;
        for (int i = 0; i < nums; i++) {
            result ^= target + 2 * i;
        }
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int xorOperation(int nums, int target) {
        int result = 0;
        for (int i = 0; i < nums; i++) {
            result ^= target + 2 * i;
        }
        return result;
    }
};`,
  },
};
