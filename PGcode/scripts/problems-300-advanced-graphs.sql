-- Grow catalog 200 → 300: advanced-graphs topic (+6 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'eventual-safe-states','minimum-height-trees','all-paths-source-target',
  'path-with-min-effort','critical-connections','redundant-connection-ii'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'eventual-safe-states','minimum-height-trees','all-paths-source-target',
  'path-with-min-effort','critical-connections','redundant-connection-ii'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'eventual-safe-states','minimum-height-trees','all-paths-source-target',
  'path-with-min-effort','critical-connections','redundant-connection-ii'
);

-- ============================================================
-- 1) eventual-safe-states (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('eventual-safe-states', 'advanced-graphs', 'Find Eventual Safe States', 'Medium',
$$<p>In a directed graph, a node is <strong>safe</strong> iff every path starting from it eventually ends at a terminal node (no outgoing edges). Return all safe nodes in ascending order. <code>graph[i]</code> is the adjacency list of node <code>i</code>.</p>$$,
'', ARRAY[
  'A node is safe iff it is not part of any cycle and all its descendants are safe.',
  'Coloring DFS: 0 = unvisited, 1 = on stack (cycle pending), 2 = safe.',
  'Alternatively, reverse-graph topological sort: terminal nodes have in-degree 0 in the reversed graph; propagate safeness from there.'
], '300', 'https://leetcode.com/problems/find-eventual-safe-states/',
'eventualSafeNodes',
'[{"name":"graph","type":"List[List[int]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[1,2],[2,3],[5],[0],[5],[],[]]"],"expected":"[2,4,5,6]"},
  {"inputs":["[[1,2,3,4],[1,2],[3,4],[0,4],[]]"],"expected":"[4]"},
  {"inputs":["[[]]"],"expected":"[0]"},
  {"inputs":["[[0]]"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('eventual-safe-states', 'python',
$PY$class Solution:
    def eventualSafeNodes(self, graph: List[List[int]]) -> List[int]:
        $PY$),
('eventual-safe-states', 'javascript',
$JS$var eventualSafeNodes = function(graph) {

};$JS$),
('eventual-safe-states', 'java',
$JAVA$class Solution {
    public List<Integer> eventualSafeNodes(int[][] graph) {

    }
}$JAVA$),
('eventual-safe-states', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> eventualSafeNodes(vector<vector<int>>& graph) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('eventual-safe-states', 1, 'Three-Color DFS',
'A node is safe iff its DFS never revisits a node on the current recursion stack. Mark nodes white (unvisited), gray (in-progress), black (safe). Hitting a gray node proves a cycle — the current start is unsafe; hitting a black node means we can cut that branch short.',
'["color[v] = 0 for all v. Define safe(v): if color[v] != 0, return color[v] == 2.","Mark color[v] = 1 (gray). For each neighbor u: if color[u] == 2, skip. Else if color[u] == 1 or !safe(u), return False.","Mark color[v] = 2. Return True.","Collect all v with safe(v) == True into the result and sort."]'::jsonb,
$PY$class Solution:
    def eventualSafeNodes(self, graph: List[List[int]]) -> List[int]:
        n = len(graph)
        color = [0] * n
        def safe(v):
            if color[v] != 0:
                return color[v] == 2
            color[v] = 1
            for u in graph[v]:
                if color[u] == 2:
                    continue
                if color[u] == 1 or not safe(u):
                    return False
            color[v] = 2
            return True
        return [v for v in range(n) if safe(v)]
$PY$,
$JS$var eventualSafeNodes = function(graph) {
    const n = graph.length;
    const color = new Array(n).fill(0);
    const safe = (v) => {
        if (color[v] !== 0) return color[v] === 2;
        color[v] = 1;
        for (const u of graph[v]) {
            if (color[u] === 2) continue;
            if (color[u] === 1 || !safe(u)) return false;
        }
        color[v] = 2;
        return true;
    };
    const result = [];
    for (let v = 0; v < n; v++) if (safe(v)) result.push(v);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> eventualSafeNodes(int[][] graph) {
        int n = graph.length;
        int[] color = new int[n];
        List<Integer> result = new ArrayList<>();
        for (int v = 0; v < n; v++) if (safe(graph, color, v)) result.add(v);
        return result;
    }
    private boolean safe(int[][] g, int[] color, int v) {
        if (color[v] != 0) return color[v] == 2;
        color[v] = 1;
        for (int u : g[v]) {
            if (color[u] == 2) continue;
            if (color[u] == 1 || !safe(g, color, u)) return false;
        }
        color[v] = 2;
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
    bool safe(vector<vector<int>>& g, vector<int>& color, int v) {
        if (color[v] != 0) return color[v] == 2;
        color[v] = 1;
        for (int u : g[v]) {
            if (color[u] == 2) continue;
            if (color[u] == 1 || !safe(g, color, u)) return false;
        }
        color[v] = 2;
        return true;
    }
public:
    vector<int> eventualSafeNodes(vector<vector<int>>& graph) {
        int n = graph.size();
        vector<int> color(n, 0);
        vector<int> result;
        for (int v = 0; v < n; v++) if (safe(graph, color, v)) result.push_back(v);
        return result;
    }
};
$CPP$,
'O(V + E)', 'O(V)');

-- ============================================================
-- 2) minimum-height-trees (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('minimum-height-trees', 'advanced-graphs', 'Minimum Height Trees', 'Medium',
$$<p>Given an undirected tree of <code>n</code> nodes labeled <code>0..n-1</code> with <code>edges</code>, return every node that could serve as a root producing the minimum-height tree. Return the answer in any order.</p>$$,
'', ARRAY[
  'The answer is always one or two nodes — specifically the centroid(s) of the tree.',
  'Repeatedly peel off leaves (nodes with degree 1) layer by layer until 1 or 2 nodes remain.',
  'Those survivors are the MHT roots.'
], '300', 'https://leetcode.com/problems/minimum-height-trees/',
'findMinHeightTrees',
'[{"name":"n","type":"int"},{"name":"edges","type":"List[List[int]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["4","[[1,0],[1,2],[1,3]]"],"expected":"[1]"},
  {"inputs":["6","[[3,0],[3,1],[3,2],[3,4],[5,4]]"],"expected":"[3,4]"},
  {"inputs":["1","[]"],"expected":"[0]"},
  {"inputs":["2","[[0,1]]"],"expected":"[0,1]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('minimum-height-trees', 'python',
$PY$class Solution:
    def findMinHeightTrees(self, n: int, edges: List[List[int]]) -> List[int]:
        $PY$),
('minimum-height-trees', 'javascript',
$JS$var findMinHeightTrees = function(n, edges) {

};$JS$),
('minimum-height-trees', 'java',
$JAVA$class Solution {
    public List<Integer> findMinHeightTrees(int n, int[][] edges) {

    }
}$JAVA$),
('minimum-height-trees', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findMinHeightTrees(int n, vector<vector<int>>& edges) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('minimum-height-trees', 1, 'Iterative Leaf Trimming',
'A tree''s minimum-height root(s) lie at its center(s). Repeatedly shaving off all current leaves moves the frontier inward; when 1 or 2 nodes remain, those are the centroids — the MHT roots.',
'["Handle n <= 2 as a base case (every node is a root).","Build adjacency lists and compute each node''s degree.","Collect all degree-1 nodes as leaves. Loop while remaining > 2:","  new_leaves = []. For each leaf, decrement its neighbor''s degree; if the neighbor drops to 1, add to new_leaves. remaining -= len(leaves); leaves = new_leaves.","Return leaves."]'::jsonb,
$PY$class Solution:
    def findMinHeightTrees(self, n: int, edges: List[List[int]]) -> List[int]:
        if n <= 2:
            return list(range(n))
        adj = [set() for _ in range(n)]
        for a, b in edges:
            adj[a].add(b)
            adj[b].add(a)
        leaves = [i for i in range(n) if len(adj[i]) == 1]
        remaining = n
        while remaining > 2:
            remaining -= len(leaves)
            new_leaves = []
            for leaf in leaves:
                neighbor = next(iter(adj[leaf]))
                adj[neighbor].remove(leaf)
                if len(adj[neighbor]) == 1:
                    new_leaves.append(neighbor)
            leaves = new_leaves
        return leaves
$PY$,
$JS$var findMinHeightTrees = function(n, edges) {
    if (n <= 2) return Array.from({ length: n }, (_, i) => i);
    const adj = Array.from({ length: n }, () => new Set());
    for (const [a, b] of edges) { adj[a].add(b); adj[b].add(a); }
    let leaves = [];
    for (let i = 0; i < n; i++) if (adj[i].size === 1) leaves.push(i);
    let remaining = n;
    while (remaining > 2) {
        remaining -= leaves.length;
        const next = [];
        for (const leaf of leaves) {
            const [neighbor] = adj[leaf];
            adj[neighbor].delete(leaf);
            if (adj[neighbor].size === 1) next.push(neighbor);
        }
        leaves = next;
    }
    return leaves;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> findMinHeightTrees(int n, int[][] edges) {
        List<Integer> result = new ArrayList<>();
        if (n <= 2) { for (int i = 0; i < n; i++) result.add(i); return result; }
        Set<Integer>[] adj = new HashSet[n];
        for (int i = 0; i < n; i++) adj[i] = new HashSet<>();
        for (int[] e : edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
        List<Integer> leaves = new ArrayList<>();
        for (int i = 0; i < n; i++) if (adj[i].size() == 1) leaves.add(i);
        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size();
            List<Integer> next = new ArrayList<>();
            for (int leaf : leaves) {
                int neighbor = adj[leaf].iterator().next();
                adj[neighbor].remove(leaf);
                if (adj[neighbor].size() == 1) next.add(neighbor);
            }
            leaves = next;
        }
        return leaves;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> findMinHeightTrees(int n, vector<vector<int>>& edges) {
        if (n <= 2) { vector<int> r(n); iota(r.begin(), r.end(), 0); return r; }
        vector<unordered_set<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].insert(e[1]); adj[e[1]].insert(e[0]); }
        vector<int> leaves;
        for (int i = 0; i < n; i++) if (adj[i].size() == 1) leaves.push_back(i);
        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size();
            vector<int> next;
            for (int leaf : leaves) {
                int neighbor = *adj[leaf].begin();
                adj[neighbor].erase(leaf);
                if (adj[neighbor].size() == 1) next.push_back(neighbor);
            }
            leaves = move(next);
        }
        return leaves;
    }
};
$CPP$,
'O(V + E)', 'O(V + E)');

-- ============================================================
-- 3) all-paths-source-target (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('all-paths-source-target', 'advanced-graphs', 'All Paths From Source to Target', 'Medium',
$$<p>Given a directed acyclic graph <code>graph</code> where <code>graph[i]</code> is the adjacency list of node <code>i</code>, return all paths from node <code>0</code> to node <code>n - 1</code>.</p>$$,
'', ARRAY[
  'The graph is a DAG, so DFS with a path stack enumerates every source → target path without revisiting.',
  'When the current node is n - 1, commit a copy of the path.',
  'Pop after recursing to backtrack.'
], '300', 'https://leetcode.com/problems/all-paths-from-source-to-target/',
'allPathsSourceTarget',
'[{"name":"graph","type":"List[List[int]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[1,2],[3],[3],[]]"],"expected":"[[0,1,3],[0,2,3]]"},
  {"inputs":["[[4,3,1],[3,2,4],[3],[4],[]]"],"expected":"[[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]]"},
  {"inputs":["[[1],[]]"],"expected":"[[0,1]]"},
  {"inputs":["[[]]"],"expected":"[[0]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('all-paths-source-target', 'python',
$PY$class Solution:
    def allPathsSourceTarget(self, graph: List[List[int]]) -> List[List[int]]:
        $PY$),
('all-paths-source-target', 'javascript',
$JS$var allPathsSourceTarget = function(graph) {

};$JS$),
('all-paths-source-target', 'java',
$JAVA$class Solution {
    public List<List<Integer>> allPathsSourceTarget(int[][] graph) {

    }
}$JAVA$),
('all-paths-source-target', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> allPathsSourceTarget(vector<vector<int>>& graph) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('all-paths-source-target', 1, 'DFS with Path Stack',
'Because the graph is a DAG there are no cycles to worry about. A straightforward DFS from node 0 with a growing path list enumerates every simple source-to-target path; when we reach the target we snapshot the path and continue backtracking.',
'["target = len(graph) - 1. DFS(node, path).","Append node to path. If node == target, append a copy of path to result.","For each neighbor: recurse(neighbor).","Pop node from path."]'::jsonb,
$PY$class Solution:
    def allPathsSourceTarget(self, graph: List[List[int]]) -> List[List[int]]:
        target = len(graph) - 1
        result = []
        path = []
        def dfs(node):
            path.append(node)
            if node == target:
                result.append(path.copy())
            else:
                for nxt in graph[node]:
                    dfs(nxt)
            path.pop()
        dfs(0)
        return result
$PY$,
$JS$var allPathsSourceTarget = function(graph) {
    const target = graph.length - 1;
    const result = [];
    const path = [];
    const dfs = (node) => {
        path.push(node);
        if (node === target) result.push([...path]);
        else for (const nxt of graph[node]) dfs(nxt);
        path.pop();
    };
    dfs(0);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> allPathsSourceTarget(int[][] graph) {
        List<List<Integer>> result = new ArrayList<>();
        dfs(graph, 0, new ArrayList<>(), result);
        return result;
    }
    private void dfs(int[][] g, int node, List<Integer> path, List<List<Integer>> result) {
        path.add(node);
        if (node == g.length - 1) result.add(new ArrayList<>(path));
        else for (int nxt : g[node]) dfs(g, nxt, path, result);
        path.remove(path.size() - 1);
    }
}
$JAVA$,
$CPP$class Solution {
    void dfs(vector<vector<int>>& g, int node, vector<int>& path, vector<vector<int>>& result) {
        path.push_back(node);
        if (node == (int)g.size() - 1) result.push_back(path);
        else for (int nxt : g[node]) dfs(g, nxt, path, result);
        path.pop_back();
    }
public:
    vector<vector<int>> allPathsSourceTarget(vector<vector<int>>& graph) {
        vector<vector<int>> result;
        vector<int> path;
        dfs(graph, 0, path, result);
        return result;
    }
};
$CPP$,
'O(2^V * V)', 'O(V) stack');

-- ============================================================
-- 4) path-with-min-effort (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('path-with-min-effort', 'advanced-graphs', 'Path With Minimum Effort', 'Medium',
$$<p>Given an <code>m x n</code> grid <code>heights</code>, return the minimum possible value of the maximum absolute height difference between any two consecutive cells on a path from <code>(0, 0)</code> to <code>(m - 1, n - 1)</code>. Moves are 4-directional.</p>$$,
'', ARRAY[
  'We want the path that minimizes the MAXIMUM single-edge cost. This is a minimax shortest path.',
  'Dijkstra works if we replace "sum of edge weights" with "max of edge weights along the path".',
  'Keep a distance grid seeded with infinity except (0, 0) = 0. Relax neighbors via max(dist, |h_new - h_curr|).'
], '300', 'https://leetcode.com/problems/path-with-minimum-effort/',
'minimumEffortPath',
'[{"name":"heights","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[1,2,2],[3,8,2],[5,3,5]]"],"expected":"2"},
  {"inputs":["[[1,2,3],[3,8,4],[5,3,5]]"],"expected":"1"},
  {"inputs":["[[1,2,1,1,1],[1,2,1,2,1],[1,2,1,2,1],[1,2,1,2,1],[1,1,1,2,1]]"],"expected":"0"},
  {"inputs":["[[4,3,4,10,5,5,9,2],[10,8,2,10,9,7,5,6],[5,8,10,10,10,7,4,2],[5,1,3,1,1,3,1,9],[6,4,10,6,10,9,4,6]]"],"expected":"5"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('path-with-min-effort', 'python',
$PY$class Solution:
    def minimumEffortPath(self, heights: List[List[int]]) -> int:
        $PY$),
('path-with-min-effort', 'javascript',
$JS$var minimumEffortPath = function(heights) {

};$JS$),
('path-with-min-effort', 'java',
$JAVA$class Solution {
    public int minimumEffortPath(int[][] heights) {

    }
}$JAVA$),
('path-with-min-effort', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumEffortPath(vector<vector<int>>& heights) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('path-with-min-effort', 1, 'Dijkstra on Max-Edge Cost',
'Replace the additive accumulator in Dijkstra with a max. The "distance" to a cell is the smallest possible maximum edge weight along any path; relaxing a neighbor uses max(current_best, |h_new - h_curr|).',
'["Initialize dist[r][c] = infinity; dist[0][0] = 0.","Push (0, 0, 0) into a min-heap keyed by current effort.","Pop (d, r, c). If (r, c) == target, return d.","For each neighbor (nr, nc): new_d = max(d, abs(heights[nr][nc] - heights[r][c])). If new_d < dist[nr][nc], update and push."]'::jsonb,
$PY$class Solution:
    def minimumEffortPath(self, heights: List[List[int]]) -> int:
        import heapq
        m, n = len(heights), len(heights[0])
        dist = [[float('inf')] * n for _ in range(m)]
        dist[0][0] = 0
        heap = [(0, 0, 0)]
        while heap:
            d, r, c = heapq.heappop(heap)
            if r == m - 1 and c == n - 1:
                return d
            if d > dist[r][c]:
                continue
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n:
                    nd = max(d, abs(heights[nr][nc] - heights[r][c]))
                    if nd < dist[nr][nc]:
                        dist[nr][nc] = nd
                        heapq.heappush(heap, (nd, nr, nc))
        return 0
$PY$,
$JS$var minimumEffortPath = function(heights) {
    const m = heights.length, n = heights[0].length;
    const dist = Array.from({ length: m }, () => new Array(n).fill(Infinity));
    dist[0][0] = 0;
    const heap = [[0, 0, 0]];
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] > heap[i][0]) { [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
            else break;
        }
    };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let s = i;
                if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
                if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
                if (s === i) break;
                [heap[i], heap[s]] = [heap[s], heap[i]];
                i = s;
            }
        }
        return top;
    };
    while (heap.length) {
        const [d, r, c] = pop();
        if (r === m - 1 && c === n - 1) return d;
        if (d > dist[r][c]) continue;
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                const nd = Math.max(d, Math.abs(heights[nr][nc] - heights[r][c]));
                if (nd < dist[nr][nc]) { dist[nr][nc] = nd; push([nd, nr, nc]); }
            }
        }
    }
    return 0;
};
$JS$,
$JAVA$class Solution {
    public int minimumEffortPath(int[][] heights) {
        int m = heights.length, n = heights[0].length;
        int[][] dist = new int[m][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        dist[0][0] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.offer(new int[]{0, 0, 0});
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], r = top[1], c = top[2];
            if (r == m - 1 && c == n - 1) return d;
            if (d > dist[r][c]) continue;
            for (int[] dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                    int nd = Math.max(d, Math.abs(heights[nr][nc] - heights[r][c]));
                    if (nd < dist[nr][nc]) {
                        dist[nr][nc] = nd;
                        heap.offer(new int[]{nd, nr, nc});
                    }
                }
            }
        }
        return 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minimumEffortPath(vector<vector<int>>& heights) {
        int m = heights.size(), n = heights[0].size();
        vector<vector<int>> dist(m, vector<int>(n, INT_MAX));
        dist[0][0] = 0;
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> heap;
        heap.push({0, 0, 0});
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!heap.empty()) {
            auto [d, r, c] = heap.top(); heap.pop();
            if (r == m - 1 && c == n - 1) return d;
            if (d > dist[r][c]) continue;
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                    int nd = max(d, abs(heights[nr][nc] - heights[r][c]));
                    if (nd < dist[nr][nc]) {
                        dist[nr][nc] = nd;
                        heap.push({nd, nr, nc});
                    }
                }
            }
        }
        return 0;
    }
};
$CPP$,
'O(m * n * log(m * n))', 'O(m * n)');

-- ============================================================
-- 5) critical-connections (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('critical-connections', 'advanced-graphs', 'Critical Connections in a Network', 'Hard',
$$<p>There are <code>n</code> servers connected by undirected <code>connections</code>. A <strong>critical connection</strong> is an edge whose removal disconnects the network. Return all critical connections in any order.</p>$$,
'', ARRAY[
  'Tarjan''s bridge-finding algorithm runs in O(V + E).',
  'For each edge (u, v) tracked in DFS tree, maintain disc[v] and low[v]. low[v] is the smallest disc reachable from v''s subtree.',
  'The edge u — v is a bridge iff low[v] > disc[u].'
], '300', 'https://leetcode.com/problems/critical-connections-in-a-network/',
'criticalConnections',
'[{"name":"n","type":"int"},{"name":"connections","type":"List[List[int]]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["4","[[0,1],[1,2],[2,0],[1,3]]"],"expected":"[[1,3]]"},
  {"inputs":["2","[[0,1]]"],"expected":"[[0,1]]"},
  {"inputs":["5","[[1,0],[2,0],[3,2],[4,2],[4,3],[3,0],[4,0]]"],"expected":"[[1,0]]"},
  {"inputs":["6","[[0,1],[1,2],[2,0],[1,3],[3,4],[4,5],[5,3]]"],"expected":"[[1,3]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('critical-connections', 'python',
$PY$class Solution:
    def criticalConnections(self, n: int, connections: List[List[int]]) -> List[List[int]]:
        $PY$),
('critical-connections', 'javascript',
$JS$var criticalConnections = function(n, connections) {

};$JS$),
('critical-connections', 'java',
$JAVA$class Solution {
    public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {

    }
}$JAVA$),
('critical-connections', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('critical-connections', 1, 'Tarjan''s Bridge-Finding DFS',
'Walk the graph with DFS and assign each node a unique discovery timestamp disc[v]. Alongside, compute low[v] = the smallest discovery timestamp reachable from v''s DFS subtree via tree edges and at most one back edge. An edge u → v in the DFS tree is a bridge iff low[v] > disc[u], because then v''s subtree has no alternative route to u.',
'["Build an adjacency list.","Initialize disc[v] = -1 for all v; timer = 0; result = [].","DFS(u, parent): disc[u] = low[u] = timer; timer += 1.","For each neighbor v of u: if v == parent, skip once. If disc[v] == -1, DFS(v, u); low[u] = min(low[u], low[v]); if low[v] > disc[u], add [u, v] to result. Else low[u] = min(low[u], disc[v]).","Call DFS(0, -1)."]'::jsonb,
$PY$class Solution:
    def criticalConnections(self, n: int, connections: List[List[int]]) -> List[List[int]]:
        adj = [[] for _ in range(n)]
        for a, b in connections:
            adj[a].append(b)
            adj[b].append(a)
        disc = [-1] * n
        low = [0] * n
        result = []
        self.timer = 0
        def dfs(u, parent):
            disc[u] = low[u] = self.timer
            self.timer += 1
            skipped = False
            for v in adj[u]:
                if v == parent and not skipped:
                    skipped = True
                    continue
                if disc[v] == -1:
                    dfs(v, u)
                    low[u] = min(low[u], low[v])
                    if low[v] > disc[u]:
                        result.append([u, v])
                else:
                    low[u] = min(low[u], disc[v])
        dfs(0, -1)
        return result
$PY$,
$JS$var criticalConnections = function(n, connections) {
    const adj = Array.from({ length: n }, () => []);
    for (const [a, b] of connections) { adj[a].push(b); adj[b].push(a); }
    const disc = new Array(n).fill(-1);
    const low = new Array(n).fill(0);
    const result = [];
    let timer = 0;
    const dfs = (u, parent) => {
        disc[u] = low[u] = timer++;
        let skipped = false;
        for (const v of adj[u]) {
            if (v === parent && !skipped) { skipped = true; continue; }
            if (disc[v] === -1) {
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) result.push([u, v]);
            } else {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    };
    dfs(0, -1);
    return result;
};
$JS$,
$JAVA$class Solution {
    private int timer = 0;
    private List<List<Integer>> adj;
    private int[] disc, low;
    private List<List<Integer>> result = new ArrayList<>();

    public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (List<Integer> c : connections) {
            adj.get(c.get(0)).add(c.get(1));
            adj.get(c.get(1)).add(c.get(0));
        }
        disc = new int[n];
        low = new int[n];
        Arrays.fill(disc, -1);
        dfs(0, -1);
        return result;
    }
    private void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        boolean skipped = false;
        for (int v : adj.get(u)) {
            if (v == parent && !skipped) { skipped = true; continue; }
            if (disc[v] == -1) {
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) result.add(Arrays.asList(u, v));
            } else {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }
}
$JAVA$,
$CPP$class Solution {
    int timer = 0;
    vector<vector<int>> adj;
    vector<int> disc, low;
    vector<vector<int>> result;
    void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        bool skipped = false;
        for (int v : adj[u]) {
            if (v == parent && !skipped) { skipped = true; continue; }
            if (disc[v] == -1) {
                dfs(v, u);
                low[u] = min(low[u], low[v]);
                if (low[v] > disc[u]) result.push_back({u, v});
            } else {
                low[u] = min(low[u], disc[v]);
            }
        }
    }
public:
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {
        adj.assign(n, {});
        for (auto& c : connections) { adj[c[0]].push_back(c[1]); adj[c[1]].push_back(c[0]); }
        disc.assign(n, -1);
        low.assign(n, 0);
        result.clear();
        timer = 0;
        dfs(0, -1);
        return result;
    }
};
$CPP$,
'O(V + E)', 'O(V + E)');

-- ============================================================
-- 6) redundant-connection-ii (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('redundant-connection-ii', 'advanced-graphs', 'Redundant Connection II', 'Hard',
$$<p>A rooted tree with <code>n</code> nodes gets one extra directed edge added, producing a graph with exactly <code>n</code> directed edges. Return the extra edge whose removal restores a valid rooted tree. If multiple answers are possible, return the one that appears last in the input.</p>$$,
'', ARRAY[
  'The root has in-degree 0; every other node has in-degree 1. One extra edge can cause either (a) a node with in-degree 2, (b) a cycle, or (c) both.',
  'If a node has two incoming edges, mark the two candidate edges. Try removing the later candidate first; if the remaining graph forms a valid rooted tree (connected, every node in-degree 1 except root), return it; else return the earlier candidate.',
  'If no in-degree 2 node exists, the extra edge is the one that closes a cycle — detect with union-find.'
], '300', 'https://leetcode.com/problems/redundant-connection-ii/',
'findRedundantDirectedConnection',
'[{"name":"edges","type":"List[List[int]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[1,2],[1,3],[2,3]]"],"expected":"[2,3]"},
  {"inputs":["[[1,2],[2,3],[3,4],[4,1],[1,5]]"],"expected":"[4,1]"},
  {"inputs":["[[2,1],[3,1],[4,2],[1,4]]"],"expected":"[2,1]"},
  {"inputs":["[[4,2],[1,5],[5,2],[5,3],[2,4]]"],"expected":"[5,2]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('redundant-connection-ii', 'python',
$PY$class Solution:
    def findRedundantDirectedConnection(self, edges: List[List[int]]) -> List[int]:
        $PY$),
('redundant-connection-ii', 'javascript',
$JS$var findRedundantDirectedConnection = function(edges) {

};$JS$),
('redundant-connection-ii', 'java',
$JAVA$class Solution {
    public int[] findRedundantDirectedConnection(int[][] edges) {

    }
}$JAVA$),
('redundant-connection-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('redundant-connection-ii', 1, 'Case Split on Two-Parent Node',
'The added edge creates either (a) a node with two parents, (b) a cycle, or (c) both. Case (a): two candidate edges point to the same node — try removing the later one; if the rest forms a valid rooted tree, return it; else the earlier candidate is the extra edge. Case (b): run union-find; the first edge that would merge two already-connected components is the extra edge.',
'["Scan edges; if a node has two parents, record cand1 = first edge, cand2 = second edge.","Run union-find skipping cand2. If a cycle forms: if cand1 exists, return cand1; else return the offending edge.","If the loop completes with no cycle: return cand2 (since we removed it and got a valid tree)."]'::jsonb,
$PY$class Solution:
    def findRedundantDirectedConnection(self, edges: List[List[int]]) -> List[int]:
        n = len(edges)
        parent = [0] * (n + 1)
        cand1 = cand2 = None
        for i, (u, v) in enumerate(edges):
            if parent[v] != 0:
                cand1 = [parent[v], v]
                cand2 = [u, v]
                edges[i] = [0, 0]
                break
            parent[v] = u

        ds = list(range(n + 1))
        def find(x):
            while ds[x] != x:
                ds[x] = ds[ds[x]]
                x = ds[x]
            return x
        for u, v in edges:
            if u == 0:
                continue
            pu, pv = find(u), find(v)
            if pu == pv:
                return cand1 if cand1 else [u, v]
            ds[pv] = pu
        return cand2
$PY$,
$JS$var findRedundantDirectedConnection = function(edges) {
    const n = edges.length;
    const parent = new Array(n + 1).fill(0);
    let cand1 = null, cand2 = null;
    for (let i = 0; i < n; i++) {
        const [u, v] = edges[i];
        if (parent[v] !== 0) {
            cand1 = [parent[v], v];
            cand2 = [u, v];
            edges[i] = [0, 0];
            break;
        }
        parent[v] = u;
    }
    const ds = Array.from({ length: n + 1 }, (_, i) => i);
    const find = (x) => {
        while (ds[x] !== x) { ds[x] = ds[ds[x]]; x = ds[x]; }
        return x;
    };
    for (const [u, v] of edges) {
        if (u === 0) continue;
        const pu = find(u), pv = find(v);
        if (pu === pv) return cand1 ? cand1 : [u, v];
        ds[pv] = pu;
    }
    return cand2;
};
$JS$,
$JAVA$class Solution {
    public int[] findRedundantDirectedConnection(int[][] edges) {
        int n = edges.length;
        int[] parent = new int[n + 1];
        int[] cand1 = null, cand2 = null;
        int skip = -1;
        for (int i = 0; i < n; i++) {
            int u = edges[i][0], v = edges[i][1];
            if (parent[v] != 0) {
                cand1 = new int[]{parent[v], v};
                cand2 = new int[]{u, v};
                skip = i;
                break;
            }
            parent[v] = u;
        }
        int[] ds = new int[n + 1];
        for (int i = 0; i <= n; i++) ds[i] = i;
        for (int i = 0; i < n; i++) {
            if (i == skip) continue;
            int u = edges[i][0], v = edges[i][1];
            int pu = find(ds, u), pv = find(ds, v);
            if (pu == pv) return cand1 != null ? cand1 : new int[]{u, v};
            ds[pv] = pu;
        }
        return cand2;
    }
    private int find(int[] ds, int x) {
        while (ds[x] != x) { ds[x] = ds[ds[x]]; x = ds[x]; }
        return x;
    }
}
$JAVA$,
$CPP$class Solution {
    int find(vector<int>& ds, int x) {
        while (ds[x] != x) { ds[x] = ds[ds[x]]; x = ds[x]; }
        return x;
    }
public:
    vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        vector<int> parent(n + 1, 0);
        vector<int> cand1, cand2;
        int skip = -1;
        for (int i = 0; i < n; i++) {
            int u = edges[i][0], v = edges[i][1];
            if (parent[v] != 0) {
                cand1 = {parent[v], v};
                cand2 = {u, v};
                skip = i;
                break;
            }
            parent[v] = u;
        }
        vector<int> ds(n + 1);
        iota(ds.begin(), ds.end(), 0);
        for (int i = 0; i < n; i++) {
            if (i == skip) continue;
            int u = edges[i][0], v = edges[i][1];
            int pu = find(ds, u), pv = find(ds, v);
            if (pu == pv) return !cand1.empty() ? cand1 : vector<int>{u, v};
            ds[pv] = pu;
        }
        return cand2;
    }
};
$CPP$,
'O(n * alpha(n))', 'O(n)');

COMMIT;
