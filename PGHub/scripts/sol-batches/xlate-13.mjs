// xlate-13 — translations of verified Python solutions to JS/Java/C++.
// Slice [360,390) of pyReal && missingLangs targets, sorted by id ascending.
// Signatures match generateTemplate(language, method_name, params, return_type)
// exactly. Algorithms preserved faithfully from the stored Python canonicals.

export default {
  // totalMatches(players: int) -> int  — single-elimination => players - 1.
  'pghub-b33-tournament-bracket': {
    javascript: `var totalMatches = function(players) {
    return players - 1;
};`,
    java: `class Solution {
    public int totalMatches(int players) {
        return players - 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalMatches(int players) {
        return players - 1;
    }
};`,
  },

  // maxTreasure(grid: List[List[int]]) -> int  — DP from top-left, down/right.
  'pghub-b33-treasure-grid': {
    javascript: `var maxTreasure = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const dp = Array.from({length: rows}, () => new Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 && c === 0) { dp[r][c] = grid[r][c]; continue; }
            let best = -Infinity;
            if (r > 0) best = Math.max(best, dp[r - 1][c]);
            if (c > 0) best = Math.max(best, dp[r][c - 1]);
            dp[r][c] = grid[r][c] + best;
        }
    }
    return dp[rows - 1][cols - 1];
};`,
    java: `class Solution {
    public int maxTreasure(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] dp = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) { dp[r][c] = grid[r][c]; continue; }
                int best = Integer.MIN_VALUE;
                if (r > 0) best = Math.max(best, dp[r - 1][c]);
                if (c > 0) best = Math.max(best, dp[r][c - 1]);
                dp[r][c] = grid[r][c] + best;
            }
        }
        return dp[rows - 1][cols - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTreasure(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<int>> dp(rows, vector<int>(cols, 0));
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) { dp[r][c] = grid[r][c]; continue; }
                int best = INT_MIN;
                if (r > 0) best = max(best, dp[r - 1][c]);
                if (c > 0) best = max(best, dp[r][c - 1]);
                dp[r][c] = grid[r][c] + best;
            }
        }
        return dp[rows - 1][cols - 1];
    }
};`,
  },

  // countPrefixes(words: List[str], queries: List[str]) -> List[int]  — trie counts.
  'pghub-b33-word-prefixes': {
    javascript: `var countPrefixes = function(words, queries) {
    const root = {};
    for (const w of words) {
        let node = root;
        for (const ch of w) {
            if (!(ch in node)) node[ch] = { '#': 0 };
            node = node[ch];
            node['#'] += 1;
        }
    }
    const res = [];
    for (const q of queries) {
        let node = root, ok = true;
        for (const ch of q) {
            if (!(ch in node)) { ok = false; break; }
            node = node[ch];
        }
        res.push(ok ? node['#'] : 0);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    static class Node {
        Map<Character, Node> next = new HashMap<>();
        int count = 0;
    }
    public int[] countPrefixes(String[] words, String[] queries) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char ch : w.toCharArray()) {
                node = node.next.computeIfAbsent(ch, k -> new Node());
                node.count++;
            }
        }
        int[] res = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            Node node = root;
            boolean ok = true;
            for (char ch : queries[i].toCharArray()) {
                Node nxt = node.next.get(ch);
                if (nxt == null) { ok = false; break; }
                node = nxt;
            }
            res[i] = ok ? node.count : 0;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    struct Node {
        unordered_map<char, Node*> next;
        int count = 0;
    };
    vector<int> countPrefixes(vector<string>& words, vector<string>& queries) {
        Node* root = new Node();
        for (auto& w : words) {
            Node* node = root;
            for (char ch : w) {
                if (!node->next.count(ch)) node->next[ch] = new Node();
                node = node->next[ch];
                node->count++;
            }
        }
        vector<int> res;
        for (auto& q : queries) {
            Node* node = root;
            bool ok = true;
            for (char ch : q) {
                auto it = node->next.find(ch);
                if (it == node->next.end()) { ok = false; break; }
                node = it->second;
            }
            res.push_back(ok ? node->count : 0);
        }
        return res;
    }
};`,
  },

  // zigzag(values: List[int]) -> List[int]  — alternate ends inward.
  'pghub-b33-zigzag-list': {
    javascript: `var zigzag = function(values) {
    let left = 0, right = values.length - 1;
    const out = [];
    let takeLeft = true;
    while (left <= right) {
        if (takeLeft) { out.push(values[left]); left++; }
        else { out.push(values[right]); right--; }
        takeLeft = !takeLeft;
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] zigzag(int[] values) {
        int left = 0, right = values.length - 1;
        int[] out = new int[values.length];
        int idx = 0;
        boolean takeLeft = true;
        while (left <= right) {
            if (takeLeft) out[idx++] = values[left++];
            else out[idx++] = values[right--];
            takeLeft = !takeLeft;
        }
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> zigzag(vector<int>& values) {
        int left = 0, right = (int)values.size() - 1;
        vector<int> out;
        bool takeLeft = true;
        while (left <= right) {
            if (takeLeft) out.push_back(values[left++]);
            else out.push_back(values[right--]);
            takeLeft = !takeLeft;
        }
        return out;
    }
};`,
  },

  // maxCoins(grid: List[List[int]]) -> int  — two-row DP.
  'pghub-b34-coin-rows': {
    javascript: `var maxCoins = function(grid) {
    const cols = grid[0].length;
    let top = grid[0][0], bot = grid[1][0];
    for (let c = 1; c < cols; c++) {
        const newTop = Math.max(top, bot) + grid[0][c];
        const newBot = Math.max(top, bot) + grid[1][c];
        top = newTop; bot = newBot;
    }
    return Math.max(top, bot);
};`,
    java: `class Solution {
    public int maxCoins(int[][] grid) {
        int cols = grid[0].length;
        int top = grid[0][0], bot = grid[1][0];
        for (int c = 1; c < cols; c++) {
            int newTop = Math.max(top, bot) + grid[0][c];
            int newBot = Math.max(top, bot) + grid[1][c];
            top = newTop; bot = newBot;
        }
        return Math.max(top, bot);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCoins(vector<vector<int>>& grid) {
        int cols = grid[0].size();
        int top = grid[0][0], bot = grid[1][0];
        for (int c = 1; c < cols; c++) {
            int newTop = max(top, bot) + grid[0][c];
            int newBot = max(top, bot) + grid[1][c];
            top = newTop; bot = newBot;
        }
        return max(top, bot);
    }
};`,
  },

  // minTrips(weights: List[int], capacity: int) -> int  — sort + two-pointer greedy.
  'pghub-b34-elevator-trips': {
    javascript: `var minTrips = function(weights, capacity) {
    weights = weights.slice().sort((a, b) => a - b);
    let lo = 0, hi = weights.length - 1, trips = 0;
    while (lo <= hi) {
        if (weights[lo] + weights[hi] <= capacity) lo++;
        hi--;
        trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int minTrips(int[] weights, int capacity) {
        int[] w = weights.clone();
        Arrays.sort(w);
        int lo = 0, hi = w.length - 1, trips = 0;
        while (lo <= hi) {
            if (w[lo] + w[hi] <= capacity) lo++;
            hi--;
            trips++;
        }
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int capacity) {
        vector<int> w = weights;
        sort(w.begin(), w.end());
        int lo = 0, hi = (int)w.size() - 1, trips = 0;
        while (lo <= hi) {
            if (w[lo] + w[hi] <= capacity) lo++;
            hi--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // minSprinklers(ranges: List[int]) -> int  — interval cover greedy, -1 if gap.
  'pghub-b34-garden-water': {
    javascript: `var minSprinklers = function(ranges) {
    const n = ranges.length;
    const reach = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        const left = Math.max(0, i - ranges[i]);
        reach[left] = Math.max(reach[left], i + ranges[i]);
    }
    let count = 0, i = 0, covered = -1;
    while (i < n) {
        let best = -1, j = i;
        while (j < n && j <= covered + 1) {
            if (reach[j] >= best) best = reach[j];
            j++;
        }
        if (best <= covered) return -1;
        count++;
        covered = best;
        i = covered + 1;
    }
    return count;
};`,
    java: `class Solution {
    public int minSprinklers(int[] ranges) {
        int n = ranges.length;
        int[] reach = new int[n];
        for (int i = 0; i < n; i++) {
            int left = Math.max(0, i - ranges[i]);
            reach[left] = Math.max(reach[left], i + ranges[i]);
        }
        int count = 0, i = 0, covered = -1;
        while (i < n) {
            int best = -1, j = i;
            while (j < n && j <= covered + 1) {
                if (reach[j] >= best) best = reach[j];
                j++;
            }
            if (best <= covered) return -1;
            count++;
            covered = best;
            i = covered + 1;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSprinklers(vector<int>& ranges) {
        int n = ranges.size();
        vector<int> reach(n, 0);
        for (int i = 0; i < n; i++) {
            int left = max(0, i - ranges[i]);
            reach[left] = max(reach[left], i + ranges[i]);
        }
        int count = 0, i = 0, covered = -1;
        while (i < n) {
            int best = -1, j = i;
            while (j < n && j <= covered + 1) {
                if (reach[j] >= best) best = reach[j];
                j++;
            }
            if (best <= covered) return -1;
            count++;
            covered = best;
            i = covered + 1;
        }
        return count;
    }
};`,
  },

  // maxProfit(jobs: List[List[int]]) -> int  — sort by deadline + min-heap of profits.
  'pghub-b34-job-scheduler': {
    javascript: `var maxProfit = function(jobs) {
    const sorted = jobs.slice().sort((a, b) => a[0] - b[0]);
    // min-heap of profits
    const heap = [];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            const n = heap.length;
            while (true) {
                let s = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < n && heap[l] < heap[s]) s = l;
                if (r < n && heap[r] < heap[s]) s = r;
                if (s === i) break;
                [heap[s], heap[i]] = [heap[i], heap[s]];
                i = s;
            }
        }
        return top;
    };
    for (const [deadline, profit] of sorted) {
        push(profit);
        if (heap.length > deadline) pop();
    }
    let sum = 0;
    for (const x of heap) sum += x;
    return sum;
};`,
    java: `import java.util.*;
class Solution {
    public int maxProfit(int[][] jobs) {
        int[][] sorted = jobs.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] job : sorted) {
            int deadline = job[0], profit = job[1];
            heap.add(profit);
            if (heap.size() > deadline) heap.poll();
        }
        int sum = 0;
        for (int x : heap) sum += x;
        return sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<vector<int>>& jobs) {
        vector<vector<int>> sorted = jobs;
        sort(sorted.begin(), sorted.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> heap;
        for (auto& job : sorted) {
            int deadline = job[0], profit = job[1];
            heap.push(profit);
            if ((int)heap.size() > deadline) heap.pop();
        }
        int sum = 0;
        while (!heap.empty()) { sum += heap.top(); heap.pop(); }
        return sum;
    }
};`,
  },

  // minPresses(word: str) -> int  — freq desc, cost = idx//9 + 1.
  'pghub-b34-keypad-presses': {
    javascript: `var minPresses = function(word) {
    const counts = {};
    for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
    const freq = Object.values(counts).sort((a, b) => b - a);
    let total = 0;
    for (let idx = 0; idx < freq.length; idx++) {
        const cost = Math.floor(idx / 9) + 1;
        total += cost * freq[idx];
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int minPresses(String word) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char ch : word.toCharArray())
            counts.merge(ch, 1, Integer::sum);
        List<Integer> freq = new ArrayList<>(counts.values());
        freq.sort(Collections.reverseOrder());
        int total = 0;
        for (int idx = 0; idx < freq.size(); idx++) {
            int cost = idx / 9 + 1;
            total += cost * freq.get(idx);
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPresses(string word) {
        unordered_map<char, int> counts;
        for (char ch : word) counts[ch]++;
        vector<int> freq;
        for (auto& kv : counts) freq.push_back(kv.second);
        sort(freq.begin(), freq.end(), greater<int>());
        int total = 0;
        for (int idx = 0; idx < (int)freq.size(); idx++) {
            int cost = idx / 9 + 1;
            total += cost * freq[idx];
        }
        return total;
    }
};`,
  },

  // mergeLogs(a: List[int], b: List[int]) -> List[int]  — merge two sorted lists.
  'pghub-b34-merge-logs': {
    javascript: `var mergeLogs = function(a, b) {
    let i = 0, j = 0;
    const out = [];
    while (i < a.length && j < b.length) {
        if (a[i] <= b[j]) out.push(a[i++]);
        else out.push(b[j++]);
    }
    while (i < a.length) out.push(a[i++]);
    while (j < b.length) out.push(b[j++]);
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] mergeLogs(int[] a, int[] b) {
        int i = 0, j = 0, k = 0;
        int[] out = new int[a.length + b.length];
        while (i < a.length && j < b.length) {
            if (a[i] <= b[j]) out[k++] = a[i++];
            else out[k++] = b[j++];
        }
        while (i < a.length) out[k++] = a[i++];
        while (j < b.length) out[k++] = b[j++];
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> mergeLogs(vector<int>& a, vector<int>& b) {
        size_t i = 0, j = 0;
        vector<int> out;
        while (i < a.size() && j < b.size()) {
            if (a[i] <= b[j]) out.push_back(a[i++]);
            else out.push_back(b[j++]);
        }
        while (i < a.size()) out.push_back(a[i++]);
        while (j < b.size()) out.push_back(b[j++]);
        return out;
    }
};`,
  },

  // largestSquare(board: List[List[int]]) -> int  — max square DP, returns area.
  'pghub-b34-photo-frames': {
    javascript: `var largestSquare = function(board) {
    const rows = board.length, cols = board[0].length;
    const dp = Array.from({length: rows}, () => new Array(cols).fill(0));
    let best = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 1) {
                if (r === 0 || c === 0) dp[r][c] = 1;
                else dp[r][c] = 1 + Math.min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1]);
                best = Math.max(best, dp[r][c]);
            }
        }
    }
    return best * best;
};`,
    java: `class Solution {
    public int largestSquare(int[][] board) {
        int rows = board.length, cols = board[0].length;
        int[][] dp = new int[rows][cols];
        int best = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (board[r][c] == 1) {
                    if (r == 0 || c == 0) dp[r][c] = 1;
                    else dp[r][c] = 1 + Math.min(dp[r-1][c], Math.min(dp[r][c-1], dp[r-1][c-1]));
                    best = Math.max(best, dp[r][c]);
                }
            }
        }
        return best * best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestSquare(vector<vector<int>>& board) {
        int rows = board.size(), cols = board[0].size();
        vector<vector<int>> dp(rows, vector<int>(cols, 0));
        int best = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (board[r][c] == 1) {
                    if (r == 0 || c == 0) dp[r][c] = 1;
                    else dp[r][c] = 1 + min({dp[r-1][c], dp[r][c-1], dp[r-1][c-1]});
                    best = max(best, dp[r][c]);
                }
            }
        }
        return best * best;
    }
};`,
  },

  // matchPrefix(routes: List[str], address: str) -> str  — longest matching prefix in trie.
  'pghub-b34-prefix-router': {
    javascript: `var matchPrefix = function(routes, address) {
    const trie = {};
    const END = '#';
    for (const r of routes) {
        let node = trie;
        for (const ch of r) {
            if (!(ch in node)) node[ch] = {};
            node = node[ch];
        }
        node[END] = true;
    }
    let node = trie, best = '';
    const cur = [];
    for (const ch of address) {
        if (!(ch in node)) break;
        node = node[ch];
        cur.push(ch);
        if (END in node) best = cur.join('');
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    static class Node {
        Map<Character, Node> next = new HashMap<>();
        boolean end = false;
    }
    public String matchPrefix(String[] routes, String address) {
        Node trie = new Node();
        for (String r : routes) {
            Node node = trie;
            for (char ch : r.toCharArray())
                node = node.next.computeIfAbsent(ch, k -> new Node());
            node.end = true;
        }
        Node node = trie;
        String best = "";
        StringBuilder cur = new StringBuilder();
        for (char ch : address.toCharArray()) {
            Node nxt = node.next.get(ch);
            if (nxt == null) break;
            node = nxt;
            cur.append(ch);
            if (node.end) best = cur.toString();
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    struct Node {
        unordered_map<char, Node*> next;
        bool end = false;
    };
    string matchPrefix(vector<string>& routes, string address) {
        Node* trie = new Node();
        for (auto& r : routes) {
            Node* node = trie;
            for (char ch : r) {
                if (!node->next.count(ch)) node->next[ch] = new Node();
                node = node->next[ch];
            }
            node->end = true;
        }
        Node* node = trie;
        string best = "", cur = "";
        for (char ch : address) {
            auto it = node->next.find(ch);
            if (it == node->next.end()) break;
            node = it->second;
            cur += ch;
            if (node->end) best = cur;
        }
        return best;
    }
};`,
  },

  // reachableNodes(n, edges, start) -> int  — DFS count of reachable nodes.
  'pghub-b34-relay-network': {
    javascript: `var reachableNodes = function(n, edges, start) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const seen = new Array(n).fill(false);
    seen[start] = true;
    const stack = [start];
    let count = 0;
    while (stack.length > 0) {
        const node = stack.pop();
        count++;
        for (const nb of adj[node]) {
            if (!seen[nb]) { seen[nb] = true; stack.push(nb); }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int reachableNodes(int n, int[][] edges, int start) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        boolean[] seen = new boolean[n];
        seen[start] = true;
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        int count = 0;
        while (!stack.isEmpty()) {
            int node = stack.pop();
            count++;
            for (int nb : adj.get(node)) {
                if (!seen[nb]) { seen[nb] = true; stack.push(nb); }
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int reachableNodes(int n, vector<vector<int>>& edges, int start) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
        vector<bool> seen(n, false);
        seen[start] = true;
        vector<int> stack = {start};
        int count = 0;
        while (!stack.empty()) {
            int node = stack.back(); stack.pop_back();
            count++;
            for (int nb : adj[node]) {
                if (!seen[nb]) { seen[nb] = true; stack.push_back(nb); }
            }
        }
        return count;
    }
};`,
  },

  // findBook(shelf: List[int], target: int) -> int  — rotated-array binary search.
  'pghub-b34-shelf-search': {
    javascript: `var findBook = function(shelf, target) {
    let lo = 0, hi = shelf.length - 1;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (shelf[mid] === target) return mid;
        if (shelf[lo] <= shelf[mid]) {
            if (shelf[lo] <= target && target < shelf[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (shelf[mid] < target && target <= shelf[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
};`,
    java: `class Solution {
    public int findBook(int[] shelf, int target) {
        int lo = 0, hi = shelf.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (shelf[mid] == target) return mid;
            if (shelf[lo] <= shelf[mid]) {
                if (shelf[lo] <= target && target < shelf[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (shelf[mid] < target && target <= shelf[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findBook(vector<int>& shelf, int target) {
        int lo = 0, hi = (int)shelf.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (shelf[mid] == target) return mid;
            if (shelf[lo] <= shelf[mid]) {
                if (shelf[lo] <= target && target < shelf[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (shelf[mid] < target && target <= shelf[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};`,
  },

  // countPeaks(readings: List[int]) -> int  — strict local maxima count.
  'pghub-b34-signal-peaks': {
    javascript: `var countPeaks = function(readings) {
    let count = 0;
    for (let i = 1; i < readings.length - 1; i++) {
        if (readings[i] > readings[i - 1] && readings[i] > readings[i + 1]) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countPeaks(int[] readings) {
        int count = 0;
        for (int i = 1; i < readings.length - 1; i++) {
            if (readings[i] > readings[i - 1] && readings[i] > readings[i + 1]) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPeaks(vector<int>& readings) {
        int count = 0;
        for (int i = 1; i + 1 < (int)readings.size(); i++) {
            if (readings[i] > readings[i - 1] && readings[i] > readings[i + 1]) count++;
        }
        return count;
    }
};`,
  },

  // evalPostfix(tokens: List[str]) -> int  — stack-based RPN eval (+,-,*).
  'pghub-b34-stack-machine': {
    javascript: `var evalPostfix = function(tokens) {
    const stack = [];
    for (const tok of tokens) {
        if (tok === '+' || tok === '-' || tok === '*') {
            const b = stack.pop();
            const a = stack.pop();
            if (tok === '+') stack.push(a + b);
            else if (tok === '-') stack.push(a - b);
            else stack.push(a * b);
        } else {
            stack.push(parseInt(tok, 10));
        }
    }
    return stack[stack.length - 1];
};`,
    java: `import java.util.*;
class Solution {
    public int evalPostfix(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String tok : tokens) {
            if (tok.equals("+") || tok.equals("-") || tok.equals("*")) {
                int b = stack.pop();
                int a = stack.pop();
                if (tok.equals("+")) stack.push(a + b);
                else if (tok.equals("-")) stack.push(a - b);
                else stack.push(a * b);
            } else {
                stack.push(Integer.parseInt(tok));
            }
        }
        return stack.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int evalPostfix(vector<string>& tokens) {
        vector<int> stack;
        for (auto& tok : tokens) {
            if (tok == "+" || tok == "-" || tok == "*") {
                int b = stack.back(); stack.pop_back();
                int a = stack.back(); stack.pop_back();
                if (tok == "+") stack.push_back(a + b);
                else if (tok == "-") stack.push_back(a - b);
                else stack.push_back(a * b);
            } else {
                stack.push_back(stoi(tok));
            }
        }
        return stack.back();
    }
};`,
  },

  // longestBalanced(s: str) -> int  — prefix-balance first-seen index map.
  'pghub-b34-token-stream': {
    javascript: `var longestBalanced = function(s) {
    const first = new Map([[0, -1]]);
    let bal = 0, best = 0;
    for (let i = 0; i < s.length; i++) {
        bal += (s[i] === 'a') ? 1 : -1;
        if (first.has(bal)) best = Math.max(best, i - first.get(bal));
        else first.set(bal, i);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestBalanced(String s) {
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);
        int bal = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            bal += (s.charAt(i) == 'a') ? 1 : -1;
            if (first.containsKey(bal)) best = Math.max(best, i - first.get(bal));
            else first.put(bal, i);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestBalanced(string s) {
        unordered_map<int, int> first;
        first[0] = -1;
        int bal = 0, best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            bal += (s[i] == 'a') ? 1 : -1;
            if (first.count(bal)) best = max(best, i - first[bal]);
            else first[bal] = i;
        }
        return best;
    }
};`,
  },

  // dialDistance(code: List[int], slots: int) -> int  — circular dial min step.
  'pghub-b34-vault-code': {
    javascript: `var dialDistance = function(code, slots) {
    let pos = 0, total = 0;
    for (const target of code) {
        const d = Math.abs(target - pos);
        total += Math.min(d, slots - d);
        pos = target;
    }
    return total;
};`,
    java: `class Solution {
    public int dialDistance(int[] code, int slots) {
        int pos = 0, total = 0;
        for (int target : code) {
            int d = Math.abs(target - pos);
            total += Math.min(d, slots - d);
            pos = target;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int dialDistance(vector<int>& code, int slots) {
        int pos = 0, total = 0;
        for (int target : code) {
            int d = abs(target - pos);
            total += min(d, slots - d);
            pos = target;
        }
        return total;
    }
};`,
  },

  // lonelySensor(ids: List[int]) -> int  — XOR accumulate.
  'pghub-b34-xor-pairs': {
    javascript: `var lonelySensor = function(ids) {
    let acc = 0;
    for (const x of ids) acc ^= x;
    return acc;
};`,
    java: `class Solution {
    public int lonelySensor(int[] ids) {
        int acc = 0;
        for (int x : ids) acc ^= x;
        return acc;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lonelySensor(vector<int>& ids) {
        int acc = 0;
        for (int x : ids) acc ^= x;
        return acc;
    }
};`,
  },

  // balancePoint(masses: List[int]) -> int  — pivot index, -1 if none.
  'pghub-b35-cargo-balance': {
    javascript: `var balancePoint = function(masses) {
    let total = 0;
    for (const m of masses) total += m;
    let left = 0;
    for (let i = 0; i < masses.length; i++) {
        if (left === total - left - masses[i]) return i;
        left += masses[i];
    }
    return -1;
};`,
    java: `class Solution {
    public int balancePoint(int[] masses) {
        int total = 0;
        for (int m : masses) total += m;
        int left = 0;
        for (int i = 0; i < masses.length; i++) {
            if (left == total - left - masses[i]) return i;
            left += masses[i];
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int balancePoint(vector<int>& masses) {
        long long total = 0;
        for (int m : masses) total += m;
        long long left = 0;
        for (int i = 0; i < (int)masses.size(); i++) {
            if (left == total - left - masses[i]) return i;
            left += masses[i];
        }
        return -1;
    }
};`,
  },

  // maxDepth(parent: List[int]) -> int  — root is parent[i] == -1; DFS depth.
  'pghub-b35-circuit-tree': {
    javascript: `var maxDepth = function(parent) {
    const n = parent.length;
    if (n === 0) return 0;
    const children = Array.from({length: n}, () => []);
    let root = 0;
    for (let i = 0; i < n; i++) {
        if (parent[i] === -1) root = i;
        else children[parent[i]].push(i);
    }
    let best = 0;
    const stack = [[root, 1]];
    while (stack.length > 0) {
        const [node, d] = stack.pop();
        if (d > best) best = d;
        for (const c of children[node]) stack.push([c, d + 1]);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxDepth(int[] parent) {
        int n = parent.length;
        if (n == 0) return 0;
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children.get(parent[i]).add(i);
        }
        int best = 0;
        Deque<int[]> stack = new ArrayDeque<>();
        stack.push(new int[]{root, 1});
        while (!stack.isEmpty()) {
            int[] cur = stack.pop();
            int node = cur[0], d = cur[1];
            if (d > best) best = d;
            for (int c : children.get(node)) stack.push(new int[]{c, d + 1});
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(vector<int>& parent) {
        int n = parent.size();
        if (n == 0) return 0;
        vector<vector<int>> children(n);
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children[parent[i]].push_back(i);
        }
        int best = 0;
        vector<pair<int,int>> stack = {{root, 1}};
        while (!stack.empty()) {
            auto [node, d] = stack.back(); stack.pop_back();
            if (d > best) best = d;
            for (int c : children[node]) stack.push_back({c, d + 1});
        }
        return best;
    }
};`,
  },

  // topKEvents(events: List[int], k: int) -> List[int]  — sort by (-freq, code).
  'pghub-b35-event-priority': {
    javascript: `var topKEvents = function(events, k) {
    const freq = new Map();
    for (const e of events) freq.set(e, (freq.get(e) || 0) + 1);
    const items = [...freq.entries()];
    items.sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]));
    return items.slice(0, k).map(x => x[0]);
};`,
    java: `import java.util.*;
class Solution {
    public int[] topKEvents(int[] events, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int e : events) freq.merge(e, 1, Integer::sum);
        List<int[]> items = new ArrayList<>();
        for (Map.Entry<Integer, Integer> en : freq.entrySet())
            items.add(new int[]{en.getKey(), en.getValue()});
        items.sort((a, b) -> (a[1] != b[1]) ? Integer.compare(b[1], a[1]) : Integer.compare(a[0], b[0]));
        int take = Math.min(k, items.size());
        int[] res = new int[take];
        for (int i = 0; i < take; i++) res[i] = items.get(i)[0];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> topKEvents(vector<int>& events, int k) {
        unordered_map<int, int> freq;
        for (int e : events) freq[e]++;
        vector<pair<int,int>> items(freq.begin(), freq.end());
        sort(items.begin(), items.end(), [](const pair<int,int>& a, const pair<int,int>& b){
            if (a.second != b.second) return a.second > b.second;
            return a.first < b.first;
        });
        vector<int> res;
        for (int i = 0; i < k && i < (int)items.size(); i++) res.push_back(items[i].first);
        return res;
    }
};`,
  },

  // maxConcurrent(bookings: List[List[int]]) -> int  — sweep line max overlap.
  'pghub-b35-festival-stalls': {
    javascript: `var maxConcurrent = function(bookings) {
    const events = [];
    for (const [s, e] of bookings) {
        events.push([s, 1]);
        events.push([e, -1]);
    }
    events.sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]));
    let cur = 0, best = 0;
    for (const [, delta] of events) {
        cur += delta;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxConcurrent(int[][] bookings) {
        List<int[]> events = new ArrayList<>();
        for (int[] b : bookings) {
            events.add(new int[]{b[0], 1});
            events.add(new int[]{b[1], -1});
        }
        events.sort((x, y) -> (x[0] != y[0]) ? Integer.compare(x[0], y[0]) : Integer.compare(x[1], y[1]));
        int cur = 0, best = 0;
        for (int[] ev : events) {
            cur += ev[1];
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxConcurrent(vector<vector<int>>& bookings) {
        vector<pair<int,int>> events;
        for (auto& b : bookings) {
            events.push_back({b[0], 1});
            events.push_back({b[1], -1});
        }
        sort(events.begin(), events.end());
        int cur = 0, best = 0;
        for (auto& ev : events) {
            cur += ev.second;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // mutationSteps(start, end, bank) -> int  — BFS over gene strings.
  'pghub-b35-gene-mutation': {
    javascript: `var mutationSteps = function(start, end, bank) {
    const bankSet = new Set(bank);
    if (!bankSet.has(end)) return -1;
    const queue = [[start, 0]];
    let head = 0;
    const seen = new Set([start]);
    const chars = 'ACGT';
    while (head < queue.length) {
        const [gene, steps] = queue[head++];
        if (gene === end) return steps;
        for (let i = 0; i < gene.length; i++) {
            for (const ch of chars) {
                if (ch === gene[i]) continue;
                const nxt = gene.slice(0, i) + ch + gene.slice(i + 1);
                if (bankSet.has(nxt) && !seen.has(nxt)) {
                    seen.add(nxt);
                    queue.push([nxt, steps + 1]);
                }
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int mutationSteps(String start, String end, String[] bank) {
        Set<String> bankSet = new HashSet<>(Arrays.asList(bank));
        if (!bankSet.contains(end)) return -1;
        Queue<String> queue = new LinkedList<>();
        Map<String, Integer> dist = new HashMap<>();
        queue.add(start);
        dist.put(start, 0);
        char[] chars = {'A', 'C', 'G', 'T'};
        while (!queue.isEmpty()) {
            String gene = queue.poll();
            int steps = dist.get(gene);
            if (gene.equals(end)) return steps;
            char[] arr = gene.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char ch : chars) {
                    if (ch == orig) continue;
                    arr[i] = ch;
                    String nxt = new String(arr);
                    if (bankSet.contains(nxt) && !dist.containsKey(nxt)) {
                        dist.put(nxt, steps + 1);
                        queue.add(nxt);
                    }
                }
                arr[i] = orig;
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mutationSteps(string start, string end, vector<string>& bank) {
        unordered_set<string> bankSet(bank.begin(), bank.end());
        if (!bankSet.count(end)) return -1;
        queue<pair<string,int>> q;
        unordered_set<string> seen;
        q.push({start, 0});
        seen.insert(start);
        string chars = "ACGT";
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            if (gene == end) return steps;
            for (int i = 0; i < (int)gene.size(); i++) {
                char orig = gene[i];
                for (char ch : chars) {
                    if (ch == orig) continue;
                    gene[i] = ch;
                    if (bankSet.count(gene) && !seen.count(gene)) {
                        seen.insert(gene);
                        q.push({gene, steps + 1});
                    }
                }
                gene[i] = orig;
            }
        }
        return -1;
    }
};`,
  },

  // countPalindromeWords(words: List[str]) -> int  — count palindromes.
  'pghub-b35-palindrome-rungs': {
    javascript: `var countPalindromeWords = function(words) {
    let count = 0;
    for (const w of words) {
        if (w === w.split('').reverse().join('')) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countPalindromeWords(String[] words) {
        int count = 0;
        for (String w : words) {
            if (w.equals(new StringBuilder(w).reverse().toString())) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPalindromeWords(vector<string>& words) {
        int count = 0;
        for (auto& w : words) {
            string r(w.rbegin(), w.rend());
            if (w == r) count++;
        }
        return count;
    }
};`,
  },

  // minLargestBatch(tasks: List[int], workers: int) -> int  — binary search on cap.
  'pghub-b35-quota-split': {
    javascript: `var minLargestBatch = function(tasks, workers) {
    const feasible = (cap) => {
        let groups = 1, cur = 0;
        for (const t of tasks) {
            if (cur + t > cap) {
                groups++;
                cur = t;
                if (groups > workers) return false;
            } else {
                cur += t;
            }
        }
        return true;
    };
    let lo = Math.max(...tasks);
    let hi = tasks.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minLargestBatch(int[] tasks, int workers) {
        int lo = 0;
        long hi = 0;
        for (int t : tasks) { lo = Math.max(lo, t); hi += t; }
        long loL = lo;
        while (loL < hi) {
            long mid = (loL + hi) / 2;
            if (feasible(tasks, workers, mid)) hi = mid;
            else loL = mid + 1;
        }
        return (int) loL;
    }
    private boolean feasible(int[] tasks, int workers, long cap) {
        int groups = 1;
        long cur = 0;
        for (int t : tasks) {
            if (cur + t > cap) {
                groups++;
                cur = t;
                if (groups > workers) return false;
            } else {
                cur += t;
            }
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minLargestBatch(vector<int>& tasks, int workers) {
        long long lo = 0, hi = 0;
        for (int t : tasks) { lo = max(lo, (long long)t); hi += t; }
        auto feasible = [&](long long cap) {
            int groups = 1;
            long long cur = 0;
            for (int t : tasks) {
                if (cur + t > cap) {
                    groups++;
                    cur = t;
                    if (groups > workers) return false;
                } else {
                    cur += t;
                }
            }
            return true;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // cycleLength(next_runner: List[int]) -> int  — Floyd cycle detect + measure.
  'pghub-b35-relay-baton': {
    javascript: `var cycleLength = function(next_runner) {
    let slow = 0, fast = 0;
    while (true) {
        slow = next_runner[slow];
        fast = next_runner[next_runner[fast]];
        if (slow === fast) break;
    }
    let length = 1;
    let cur = next_runner[slow];
    while (cur !== slow) {
        cur = next_runner[cur];
        length++;
    }
    return length;
};`,
    java: `class Solution {
    public int cycleLength(int[] next_runner) {
        int slow = 0, fast = 0;
        while (true) {
            slow = next_runner[slow];
            fast = next_runner[next_runner[fast]];
            if (slow == fast) break;
        }
        int length = 1;
        int cur = next_runner[slow];
        while (cur != slow) {
            cur = next_runner[cur];
            length++;
        }
        return length;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cycleLength(vector<int>& next_runner) {
        int slow = 0, fast = 0;
        while (true) {
            slow = next_runner[slow];
            fast = next_runner[next_runner[fast]];
            if (slow == fast) break;
        }
        int length = 1;
        int cur = next_runner[slow];
        while (cur != slow) {
            cur = next_runner[cur];
            length++;
        }
        return length;
    }
};`,
  },

  // priceSpans(prices: List[int]) -> List[int]  — monotonic stack stock span.
  'pghub-b35-stock-span': {
    javascript: `var priceSpans = function(prices) {
    const spans = [];
    const stack = [];
    for (let i = 0; i < prices.length; i++) {
        let span = 1;
        while (stack.length > 0 && prices[stack[stack.length - 1]] <= prices[i]) {
            span += spans[stack[stack.length - 1]];
            stack.pop();
        }
        spans.push(span);
        stack.push(i);
    }
    return spans;
};`,
    java: `import java.util.*;
class Solution {
    public int[] priceSpans(int[] prices) {
        int n = prices.length;
        int[] spans = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            int span = 1;
            while (!stack.isEmpty() && prices[stack.peek()] <= prices[i]) {
                span += spans[stack.peek()];
                stack.pop();
            }
            spans[i] = span;
            stack.push(i);
        }
        return spans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> priceSpans(vector<int>& prices) {
        vector<int> spans;
        vector<int> stack;
        for (int i = 0; i < (int)prices.size(); i++) {
            int span = 1;
            while (!stack.empty() && prices[stack.back()] <= prices[i]) {
                span += spans[stack.back()];
                stack.pop_back();
            }
            spans.push_back(span);
            stack.push_back(i);
        }
        return spans;
    }
};`,
  },

  // maxSubsetXor(nums: List[int]) -> int  — linear basis (greedy XOR basis).
  'pghub-b35-subset-xor': {
    javascript: `var maxSubsetXor = function(nums) {
    let basis = [];
    for (const num of nums) {
        let cur = num;
        for (const b of basis) cur = Math.min(cur, cur ^ b);
        if (cur > 0) {
            basis.push(cur);
            basis.sort((a, b) => b - a);
        }
    }
    let result = 0;
    for (const b of basis) result = Math.max(result, result ^ b);
    return result;
};`,
    java: `import java.util.*;
class Solution {
    public int maxSubsetXor(int[] nums) {
        List<Integer> basis = new ArrayList<>();
        for (int num : nums) {
            int cur = num;
            for (int b : basis) cur = Math.min(cur, cur ^ b);
            if (cur > 0) {
                basis.add(cur);
                basis.sort(Collections.reverseOrder());
            }
        }
        int result = 0;
        for (int b : basis) result = Math.max(result, result ^ b);
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSubsetXor(vector<int>& nums) {
        vector<int> basis;
        for (int num : nums) {
            int cur = num;
            for (int b : basis) cur = min(cur, cur ^ b);
            if (cur > 0) {
                basis.push_back(cur);
                sort(basis.begin(), basis.end(), greater<int>());
            }
        }
        int result = 0;
        for (int b : basis) result = max(result, result ^ b);
        return result;
    }
};`,
  },

  // serviceTime(durations: List[int], target: int) -> int  — prefix sum to target.
  'pghub-b35-ticket-window': {
    javascript: `var serviceTime = function(durations, target) {
    let elapsed = 0;
    for (let i = 0; i <= target; i++) elapsed += durations[i];
    return elapsed;
};`,
    java: `class Solution {
    public int serviceTime(int[] durations, int target) {
        int elapsed = 0;
        for (int i = 0; i <= target; i++) elapsed += durations[i];
        return elapsed;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int serviceTime(vector<int>& durations, int target) {
        int elapsed = 0;
        for (int i = 0; i <= target; i++) elapsed += durations[i];
        return elapsed;
    }
};`,
  },
};
