-- Grow catalog 200 → 300: graphs topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'find-center-star-graph','find-town-judge-graph','keys-and-rooms','number-of-provinces',
  'is-graph-bipartite','max-area-of-island','flood-fill','longest-increasing-path-matrix'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'find-center-star-graph','find-town-judge-graph','keys-and-rooms','number-of-provinces',
  'is-graph-bipartite','max-area-of-island','flood-fill','longest-increasing-path-matrix'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'find-center-star-graph','find-town-judge-graph','keys-and-rooms','number-of-provinces',
  'is-graph-bipartite','max-area-of-island','flood-fill','longest-increasing-path-matrix'
);

-- ============================================================
-- 1) find-center-star-graph (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-center-star-graph', 'graphs', 'Find Center of Star Graph', 'Easy',
$$<p>A star graph has one center node connected to every other node; the other nodes are connected only to the center. Given the edge list of a star graph, return the center node.</p>$$,
'', ARRAY[
  'The center appears in every edge. Compare the two endpoints of the first two edges — the common vertex is the center.',
  'Only the first two edges are enough to determine the center.',
  'No need to iterate the full adjacency list.'
], '300', 'https://leetcode.com/problems/find-center-of-star-graph/',
'findCenter',
'[{"name":"edges","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[1,2],[2,3],[4,2]]"],"expected":"2"},
  {"inputs":["[[1,2],[5,1],[1,3],[1,4]]"],"expected":"1"},
  {"inputs":["[[1,2],[3,2]]"],"expected":"2"},
  {"inputs":["[[4,5],[1,5],[2,5],[3,5]]"],"expected":"5"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-center-star-graph', 'python',
$PY$class Solution:
    def findCenter(self, edges: List[List[int]]) -> int:
        $PY$),
('find-center-star-graph', 'javascript',
$JS$var findCenter = function(edges) {

};$JS$),
('find-center-star-graph', 'java',
$JAVA$class Solution {
    public int findCenter(int[][] edges) {

    }
}$JAVA$),
('find-center-star-graph', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findCenter(vector<vector<int>>& edges) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-center-star-graph', 1, 'Common Endpoint of First Two Edges',
'In a star graph the center participates in every edge, so the only vertex shared by the first two edges must be the center. Two comparisons suffice — no graph traversal needed.',
'["Take edges[0] = [a, b] and edges[1] = [c, d].","Return a if a == c or a == d, else return b."]'::jsonb,
$PY$class Solution:
    def findCenter(self, edges: List[List[int]]) -> int:
        a, b = edges[0]
        c, d = edges[1]
        return a if a == c or a == d else b
$PY$,
$JS$var findCenter = function(edges) {
    const [a, b] = edges[0];
    const [c, d] = edges[1];
    return (a === c || a === d) ? a : b;
};
$JS$,
$JAVA$class Solution {
    public int findCenter(int[][] edges) {
        int a = edges[0][0], b = edges[0][1];
        int c = edges[1][0], d = edges[1][1];
        return (a == c || a == d) ? a : b;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findCenter(vector<vector<int>>& edges) {
        int a = edges[0][0], b = edges[0][1];
        int c = edges[1][0], d = edges[1][1];
        return (a == c || a == d) ? a : b;
    }
};
$CPP$,
'O(1)', 'O(1)');

-- ============================================================
-- 2) find-town-judge-graph (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-town-judge-graph', 'graphs', 'Find the Town Judge', 'Easy',
$$<p>In a town of <code>n</code> people labeled <code>1</code> to <code>n</code>, one person is the judge if and only if everyone (except them) trusts the judge and the judge trusts nobody. The directed trust list <code>trust[i] = [a, b]</code> means person <code>a</code> trusts person <code>b</code>. Return the judge or <code>-1</code> if no such person exists.</p>$$,
'', ARRAY[
  'Track net trust = incoming - outgoing for each person.',
  'The judge has net trust exactly n - 1 (trusted by everyone else, trusts no one).',
  'Scan once to build the counts, then scan once to find any person with the target net count. Uniqueness makes the first match the answer.'
], '300', 'https://leetcode.com/problems/find-the-town-judge/',
'findJudge',
'[{"name":"n","type":"int"},{"name":"trust","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["2","[[1,2]]"],"expected":"2"},
  {"inputs":["3","[[1,3],[2,3]]"],"expected":"3"},
  {"inputs":["3","[[1,3],[2,3],[3,1]]"],"expected":"-1"},
  {"inputs":["1","[]"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-town-judge-graph', 'python',
$PY$class Solution:
    def findJudge(self, n: int, trust: List[List[int]]) -> int:
        $PY$),
('find-town-judge-graph', 'javascript',
$JS$var findJudge = function(n, trust) {

};$JS$),
('find-town-judge-graph', 'java',
$JAVA$class Solution {
    public int findJudge(int n, int[][] trust) {

    }
}$JAVA$),
('find-town-judge-graph', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findJudge(int n, vector<vector<int>>& trust) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-town-judge-graph', 1, 'Net Trust Counter',
'Represent each trust edge a -> b as -1 for a and +1 for b. The judge is the unique person whose net value equals n - 1: they are trusted by everyone else (+n - 1) and trust nobody (0).',
'["Initialize score[1..n] = 0.","For each [a, b] in trust: score[a] -= 1; score[b] += 1.","Scan i from 1 to n; return i if score[i] == n - 1. Otherwise return -1."]'::jsonb,
$PY$class Solution:
    def findJudge(self, n: int, trust: List[List[int]]) -> int:
        score = [0] * (n + 1)
        for a, b in trust:
            score[a] -= 1
            score[b] += 1
        for i in range(1, n + 1):
            if score[i] == n - 1:
                return i
        return -1
$PY$,
$JS$var findJudge = function(n, trust) {
    const score = new Array(n + 1).fill(0);
    for (const [a, b] of trust) { score[a]--; score[b]++; }
    for (let i = 1; i <= n; i++) {
        if (score[i] === n - 1) return i;
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int findJudge(int n, int[][] trust) {
        int[] score = new int[n + 1];
        for (int[] t : trust) { score[t[0]]--; score[t[1]]++; }
        for (int i = 1; i <= n; i++) {
            if (score[i] == n - 1) return i;
        }
        return -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findJudge(int n, vector<vector<int>>& trust) {
        vector<int> score(n + 1, 0);
        for (auto& t : trust) { score[t[0]]--; score[t[1]]++; }
        for (int i = 1; i <= n; i++) {
            if (score[i] == n - 1) return i;
        }
        return -1;
    }
};
$CPP$,
'O(n + m)', 'O(n)');

-- ============================================================
-- 3) keys-and-rooms (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('keys-and-rooms', 'graphs', 'Keys and Rooms', 'Medium',
$$<p>There are <code>n</code> rooms labeled <code>0..n - 1</code>, all locked except room 0. <code>rooms[i]</code> lists the keys inside room <code>i</code>. Return <code>true</code> if you can visit every room starting from room 0.</p>$$,
'', ARRAY[
  'This is plain reachability on a directed graph where the edges are key possessions.',
  'DFS or BFS from room 0, marking each visited room. Success iff visited count equals n.',
  'Both traversals are O(rooms + keys).'
], '300', 'https://leetcode.com/problems/keys-and-rooms/',
'canVisitAllRooms',
'[{"name":"rooms","type":"List[List[int]]"}]'::jsonb,
'bool',
'[
  {"inputs":["[[1],[2],[3],[]]"],"expected":"true"},
  {"inputs":["[[1,3],[3,0,1],[2],[0]]"],"expected":"false"},
  {"inputs":["[[]]"],"expected":"true"},
  {"inputs":["[[1],[]]"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('keys-and-rooms', 'python',
$PY$class Solution:
    def canVisitAllRooms(self, rooms: List[List[int]]) -> bool:
        $PY$),
('keys-and-rooms', 'javascript',
$JS$var canVisitAllRooms = function(rooms) {

};$JS$),
('keys-and-rooms', 'java',
$JAVA$class Solution {
    public boolean canVisitAllRooms(List<List<Integer>> rooms) {

    }
}$JAVA$),
('keys-and-rooms', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canVisitAllRooms(vector<vector<int>>& rooms) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('keys-and-rooms', 1, 'DFS Reachability',
'This is classical reachability: each key in a room acts as a directed edge. Start a DFS or BFS from room 0 and mark every room you can reach. The answer is whether that count equals the number of rooms.',
'["Create a visited array of size n, seed with 0.","Push 0 onto a stack. While the stack is non-empty, pop room r and iterate its keys; push any unvisited neighbor and mark it.","Return visited count == n."]'::jsonb,
$PY$class Solution:
    def canVisitAllRooms(self, rooms: List[List[int]]) -> bool:
        n = len(rooms)
        visited = [False] * n
        visited[0] = True
        stack = [0]
        while stack:
            r = stack.pop()
            for k in rooms[r]:
                if not visited[k]:
                    visited[k] = True
                    stack.append(k)
        return all(visited)
$PY$,
$JS$var canVisitAllRooms = function(rooms) {
    const n = rooms.length;
    const visited = new Array(n).fill(false);
    visited[0] = true;
    const stack = [0];
    while (stack.length) {
        const r = stack.pop();
        for (const k of rooms[r]) {
            if (!visited[k]) { visited[k] = true; stack.push(k); }
        }
    }
    return visited.every(Boolean);
};
$JS$,
$JAVA$class Solution {
    public boolean canVisitAllRooms(List<List<Integer>> rooms) {
        int n = rooms.size();
        boolean[] visited = new boolean[n];
        visited[0] = true;
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        while (!stack.isEmpty()) {
            int r = stack.pop();
            for (int k : rooms.get(r)) {
                if (!visited[k]) { visited[k] = true; stack.push(k); }
            }
        }
        for (boolean v : visited) if (!v) return false;
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool canVisitAllRooms(vector<vector<int>>& rooms) {
        int n = rooms.size();
        vector<bool> visited(n, false);
        visited[0] = true;
        stack<int> st;
        st.push(0);
        while (!st.empty()) {
            int r = st.top(); st.pop();
            for (int k : rooms[r]) {
                if (!visited[k]) { visited[k] = true; st.push(k); }
            }
        }
        for (bool v : visited) if (!v) return false;
        return true;
    }
};
$CPP$,
'O(n + sum of keys)', 'O(n)');

-- ============================================================
-- 4) number-of-provinces (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('number-of-provinces', 'graphs', 'Number of Provinces', 'Medium',
$$<p>You are given an <code>n x n</code> adjacency matrix <code>isConnected</code> where <code>isConnected[i][j] == 1</code> if cities <code>i</code> and <code>j</code> are directly connected. A province is a maximal group of connected cities. Return the number of provinces.</p>$$,
'', ARRAY[
  'This is counting connected components on an undirected graph given in adjacency matrix form.',
  'For each city, if it is not yet visited, DFS/BFS from it and bump the province counter.',
  'Union-Find works equally well in O(n^2 * alpha(n)).'
], '300', 'https://leetcode.com/problems/number-of-provinces/',
'findCircleNum',
'[{"name":"isConnected","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[1,1,0],[1,1,0],[0,0,1]]"],"expected":"2"},
  {"inputs":["[[1,0,0],[0,1,0],[0,0,1]]"],"expected":"3"},
  {"inputs":["[[1]]"],"expected":"1"},
  {"inputs":["[[1,1,1],[1,1,1],[1,1,1]]"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('number-of-provinces', 'python',
$PY$class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        $PY$),
('number-of-provinces', 'javascript',
$JS$var findCircleNum = function(isConnected) {

};$JS$),
('number-of-provinces', 'java',
$JAVA$class Solution {
    public int findCircleNum(int[][] isConnected) {

    }
}$JAVA$),
('number-of-provinces', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findCircleNum(vector<vector<int>>& isConnected) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('number-of-provinces', 1, 'DFS Over Cities',
'Each province is a connected component. Scan cities and whenever we meet a previously unseen city, DFS to mark the entire component it belongs to and bump the counter.',
'["Let n = len(isConnected). Create visited[n] = False.","For each city i: if not visited[i], dfs(i) and count += 1.","dfs(i) marks visited[i] = True and recurses into every j where isConnected[i][j] == 1 and j is unvisited.","Return count."]'::jsonb,
$PY$class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        visited = [False] * n
        def dfs(i):
            visited[i] = True
            for j in range(n):
                if isConnected[i][j] and not visited[j]:
                    dfs(j)
        count = 0
        for i in range(n):
            if not visited[i]:
                dfs(i)
                count += 1
        return count
$PY$,
$JS$var findCircleNum = function(isConnected) {
    const n = isConnected.length;
    const visited = new Array(n).fill(false);
    const dfs = (i) => {
        visited[i] = true;
        for (let j = 0; j < n; j++) {
            if (isConnected[i][j] && !visited[j]) dfs(j);
        }
    };
    let count = 0;
    for (let i = 0; i < n; i++) {
        if (!visited[i]) { dfs(i); count++; }
    }
    return count;
};
$JS$,
$JAVA$class Solution {
    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        boolean[] visited = new boolean[n];
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (!visited[i]) { dfs(isConnected, visited, i); count++; }
        }
        return count;
    }
    private void dfs(int[][] g, boolean[] visited, int i) {
        visited[i] = true;
        for (int j = 0; j < g.length; j++) {
            if (g[i][j] == 1 && !visited[j]) dfs(g, visited, j);
        }
    }
}
$JAVA$,
$CPP$class Solution {
    void dfs(vector<vector<int>>& g, vector<bool>& visited, int i) {
        visited[i] = true;
        for (int j = 0; j < (int)g.size(); j++) {
            if (g[i][j] && !visited[j]) dfs(g, visited, j);
        }
    }
public:
    int findCircleNum(vector<vector<int>>& isConnected) {
        int n = isConnected.size();
        vector<bool> visited(n, false);
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (!visited[i]) { dfs(isConnected, visited, i); count++; }
        }
        return count;
    }
};
$CPP$,
'O(n^2)', 'O(n)');

-- ============================================================
-- 5) is-graph-bipartite (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('is-graph-bipartite', 'graphs', 'Is Graph Bipartite?', 'Medium',
$$<p>Given an undirected graph in adjacency-list form (<code>graph[i]</code> is the list of neighbors of node <code>i</code>), return <code>true</code> iff it is bipartite — i.e. its nodes can be split into two sets with every edge crossing between them.</p>$$,
'', ARRAY[
  'A graph is bipartite iff it is 2-colorable and contains no odd-length cycles.',
  'BFS from every unvisited node, coloring it 0, its neighbors 1, theirs 0, and so on. A conflict (neighbor already has the same color as its parent) proves not bipartite.',
  'Repeat for each connected component.'
], '300', 'https://leetcode.com/problems/is-graph-bipartite/',
'isBipartite',
'[{"name":"graph","type":"List[List[int]]"}]'::jsonb,
'bool',
'[
  {"inputs":["[[1,2,3],[0,2],[0,1,3],[0,2]]"],"expected":"false"},
  {"inputs":["[[1,3],[0,2],[1,3],[0,2]]"],"expected":"true"},
  {"inputs":["[[]]"],"expected":"true"},
  {"inputs":["[[2,4],[2,3,4],[0,1],[1],[0,1]]"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('is-graph-bipartite', 'python',
$PY$class Solution:
    def isBipartite(self, graph: List[List[int]]) -> bool:
        $PY$),
('is-graph-bipartite', 'javascript',
$JS$var isBipartite = function(graph) {

};$JS$),
('is-graph-bipartite', 'java',
$JAVA$class Solution {
    public boolean isBipartite(int[][] graph) {

    }
}$JAVA$),
('is-graph-bipartite', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBipartite(vector<vector<int>>& graph) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('is-graph-bipartite', 1, 'Two-Coloring BFS per Component',
'A bipartite graph is exactly one that is 2-colorable. BFS from any unvisited node assigning alternating colors; if we ever encounter an edge whose endpoints got the same color, the graph contains an odd cycle and is not bipartite.',
'["Initialize color[n] = -1.","For each i from 0 to n - 1: if color[i] == -1, BFS starting there with color[i] = 0.","In the BFS loop pop u and iterate neighbors v: if color[v] == -1, set color[v] = 1 - color[u] and enqueue; else if color[v] == color[u], return False.","If all components two-color cleanly, return True."]'::jsonb,
$PY$class Solution:
    def isBipartite(self, graph: List[List[int]]) -> bool:
        from collections import deque
        n = len(graph)
        color = [-1] * n
        for i in range(n):
            if color[i] != -1:
                continue
            color[i] = 0
            queue = deque([i])
            while queue:
                u = queue.popleft()
                for v in graph[u]:
                    if color[v] == -1:
                        color[v] = 1 - color[u]
                        queue.append(v)
                    elif color[v] == color[u]:
                        return False
        return True
$PY$,
$JS$var isBipartite = function(graph) {
    const n = graph.length;
    const color = new Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
        if (color[i] !== -1) continue;
        color[i] = 0;
        const queue = [i];
        while (queue.length) {
            const u = queue.shift();
            for (const v of graph[u]) {
                if (color[v] === -1) { color[v] = 1 - color[u]; queue.push(v); }
                else if (color[v] === color[u]) return false;
            }
        }
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isBipartite(int[][] graph) {
        int n = graph.length;
        int[] color = new int[n];
        Arrays.fill(color, -1);
        for (int i = 0; i < n; i++) {
            if (color[i] != -1) continue;
            color[i] = 0;
            Deque<Integer> queue = new ArrayDeque<>();
            queue.offer(i);
            while (!queue.isEmpty()) {
                int u = queue.poll();
                for (int v : graph[u]) {
                    if (color[v] == -1) { color[v] = 1 - color[u]; queue.offer(v); }
                    else if (color[v] == color[u]) return false;
                }
            }
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isBipartite(vector<vector<int>>& graph) {
        int n = graph.size();
        vector<int> color(n, -1);
        for (int i = 0; i < n; i++) {
            if (color[i] != -1) continue;
            color[i] = 0;
            queue<int> q;
            q.push(i);
            while (!q.empty()) {
                int u = q.front(); q.pop();
                for (int v : graph[u]) {
                    if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                    else if (color[v] == color[u]) return false;
                }
            }
        }
        return true;
    }
};
$CPP$,
'O(V + E)', 'O(V)');

-- ============================================================
-- 6) max-area-of-island (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('max-area-of-island', 'graphs', 'Max Area of Island', 'Medium',
$$<p>Given an <code>m x n</code> binary grid, return the size (number of cells) of the largest connected island. A cell is part of an island iff it contains <code>1</code>; connectivity is 4-directional.</p>$$,
'', ARRAY[
  'Scan every cell; when you hit an unvisited 1, DFS/BFS the whole island and measure its size.',
  'Mark visited cells in place (flip to 0) or with a separate matrix.',
  'Keep a running max and return it.'
], '300', 'https://leetcode.com/problems/max-area-of-island/',
'maxAreaOfIsland',
'[{"name":"grid","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]]"],"expected":"6"},
  {"inputs":["[[0,0,0,0,0,0,0,0]]"],"expected":"0"},
  {"inputs":["[[1]]"],"expected":"1"},
  {"inputs":["[[1,1],[1,0]]"],"expected":"3"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('max-area-of-island', 'python',
$PY$class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        $PY$),
('max-area-of-island', 'javascript',
$JS$var maxAreaOfIsland = function(grid) {

};$JS$),
('max-area-of-island', 'java',
$JAVA$class Solution {
    public int maxAreaOfIsland(int[][] grid) {

    }
}$JAVA$),
('max-area-of-island', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAreaOfIsland(vector<vector<int>>& grid) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('max-area-of-island', 1, 'DFS Flood Fill with Size',
'Every island is one connected component. Scan the grid; for each unvisited 1, run a DFS that returns the component''s size while sinking it (marking cells 0). Track the maximum across components.',
'["Let rows = m, cols = n. best = 0.","For each cell (r, c): if grid[r][c] == 1, best = max(best, dfs(r, c)).","dfs(r, c) returns 0 if out of bounds or cell is 0; else mark cell as 0 and return 1 + dfs(neighbors).","Return best."]'::jsonb,
$PY$class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        m, n = len(grid), len(grid[0])
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] == 0:
                return 0
            grid[r][c] = 0
            return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1)
        best = 0
        for r in range(m):
            for c in range(n):
                if grid[r][c] == 1:
                    area = dfs(r, c)
                    if area > best:
                        best = area
        return best
$PY$,
$JS$var maxAreaOfIsland = function(grid) {
    const m = grid.length, n = grid[0].length;
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === 0) return 0;
        grid[r][c] = 0;
        return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1);
    };
    let best = 0;
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c] === 1) best = Math.max(best, dfs(r, c));
        }
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxAreaOfIsland(int[][] grid) {
        int best = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == 1) best = Math.max(best, dfs(grid, r, c));
            }
        }
        return best;
    }
    private int dfs(int[][] g, int r, int c) {
        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] == 0) return 0;
        g[r][c] = 0;
        return 1 + dfs(g, r + 1, c) + dfs(g, r - 1, c) + dfs(g, r, c + 1) + dfs(g, r, c - 1);
    }
}
$JAVA$,
$CPP$class Solution {
    int dfs(vector<vector<int>>& g, int r, int c) {
        if (r < 0 || r >= (int)g.size() || c < 0 || c >= (int)g[0].size() || g[r][c] == 0) return 0;
        g[r][c] = 0;
        return 1 + dfs(g, r + 1, c) + dfs(g, r - 1, c) + dfs(g, r, c + 1) + dfs(g, r, c - 1);
    }
public:
    int maxAreaOfIsland(vector<vector<int>>& grid) {
        int best = 0;
        for (int r = 0; r < (int)grid.size(); r++) {
            for (int c = 0; c < (int)grid[0].size(); c++) {
                if (grid[r][c] == 1) best = max(best, dfs(grid, r, c));
            }
        }
        return best;
    }
};
$CPP$,
'O(m * n)', 'O(m * n)');

-- ============================================================
-- 7) flood-fill (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('flood-fill', 'graphs', 'Flood Fill', 'Medium',
$$<p>Given an <code>m x n</code> image of integers, the starting pixel <code>(sr, sc)</code>, and a target <code>color</code>, replace the color of the starting pixel and every 4-directionally connected pixel sharing its original color with <code>color</code>. Return the modified image.</p>$$,
'', ARRAY[
  'DFS or BFS from (sr, sc). Only recurse into neighbors that share the ORIGINAL color of the starting pixel.',
  'Guard against an infinite loop when the target color already equals the starting color — either early-exit or use a visited marker.',
  'In-place modification works because comparing against the original color keeps the stopping condition stable once cells are recolored.'
], '300', 'https://leetcode.com/problems/flood-fill/',
'floodFill',
'[{"name":"image","type":"List[List[int]]"},{"name":"sr","type":"int"},{"name":"sc","type":"int"},{"name":"color","type":"int"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[[1,1,1],[1,1,0],[1,0,1]]","1","1","2"],"expected":"[[2,2,2],[2,2,0],[2,0,1]]"},
  {"inputs":["[[0,0,0],[0,0,0]]","0","0","0"],"expected":"[[0,0,0],[0,0,0]]"},
  {"inputs":["[[0,0,0],[0,1,1]]","1","1","1"],"expected":"[[0,0,0],[0,1,1]]"},
  {"inputs":["[[1]]","0","0","2"],"expected":"[[2]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('flood-fill', 'python',
$PY$class Solution:
    def floodFill(self, image: List[List[int]], sr: int, sc: int, color: int) -> List[List[int]]:
        $PY$),
('flood-fill', 'javascript',
$JS$var floodFill = function(image, sr, sc, color) {

};$JS$),
('flood-fill', 'java',
$JAVA$class Solution {
    public int[][] floodFill(int[][] image, int sr, int sc, int color) {

    }
}$JAVA$),
('flood-fill', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('flood-fill', 1, 'DFS From Starting Pixel',
'Flood fill = graph reachability where edges only exist between same-colored pixels of the starting color. DFS recolors cells to the new color; recursion naturally stops at boundaries and at cells whose original color differed.',
'["Let original = image[sr][sc]. If original == color, return the image unchanged.","Define dfs(r, c): if out of bounds or image[r][c] != original, return.","Set image[r][c] = color and recurse into the four neighbors.","Call dfs(sr, sc); return image."]'::jsonb,
$PY$class Solution:
    def floodFill(self, image: List[List[int]], sr: int, sc: int, color: int) -> List[List[int]]:
        original = image[sr][sc]
        if original == color:
            return image
        m, n = len(image), len(image[0])
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or image[r][c] != original:
                return
            image[r][c] = color
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        dfs(sr, sc)
        return image
$PY$,
$JS$var floodFill = function(image, sr, sc, color) {
    const original = image[sr][sc];
    if (original === color) return image;
    const m = image.length, n = image[0].length;
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] !== original) return;
        image[r][c] = color;
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    dfs(sr, sc);
    return image;
};
$JS$,
$JAVA$class Solution {
    public int[][] floodFill(int[][] image, int sr, int sc, int color) {
        int original = image[sr][sc];
        if (original == color) return image;
        dfs(image, sr, sc, original, color);
        return image;
    }
    private void dfs(int[][] img, int r, int c, int original, int color) {
        if (r < 0 || r >= img.length || c < 0 || c >= img[0].length || img[r][c] != original) return;
        img[r][c] = color;
        dfs(img, r + 1, c, original, color);
        dfs(img, r - 1, c, original, color);
        dfs(img, r, c + 1, original, color);
        dfs(img, r, c - 1, original, color);
    }
}
$JAVA$,
$CPP$class Solution {
    void dfs(vector<vector<int>>& img, int r, int c, int original, int color) {
        if (r < 0 || r >= (int)img.size() || c < 0 || c >= (int)img[0].size() || img[r][c] != original) return;
        img[r][c] = color;
        dfs(img, r + 1, c, original, color);
        dfs(img, r - 1, c, original, color);
        dfs(img, r, c + 1, original, color);
        dfs(img, r, c - 1, original, color);
    }
public:
    vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int color) {
        int original = image[sr][sc];
        if (original == color) return image;
        dfs(image, sr, sc, original, color);
        return image;
    }
};
$CPP$,
'O(m * n)', 'O(m * n)');

-- ============================================================
-- 8) longest-increasing-path-matrix (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('longest-increasing-path-matrix', 'graphs', 'Longest Increasing Path in a Matrix', 'Hard',
$$<p>Given an <code>m x n</code> integer matrix, return the length of the longest path along which values are strictly increasing. Moves are 4-directional.</p>$$,
'', ARRAY[
  'Define f(r, c) = longest increasing path starting at (r, c). It depends only on strictly larger neighbors, so the implicit graph is a DAG.',
  'Memoize: f(r, c) = 1 + max over neighbors (nr, nc) with matrix[nr][nc] > matrix[r][c] of f(nr, nc).',
  'Run DFS with memoization from every cell; answer is max f(r, c).'
], '300', 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/',
'longestIncreasingPath',
'[{"name":"matrix","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[9,9,4],[6,6,8],[2,1,1]]"],"expected":"4"},
  {"inputs":["[[3,4,5],[3,2,6],[2,2,1]]"],"expected":"4"},
  {"inputs":["[[1]]"],"expected":"1"},
  {"inputs":["[[7,7,5],[2,4,6],[8,2,0]]"],"expected":"4"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('longest-increasing-path-matrix', 'python',
$PY$class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        $PY$),
('longest-increasing-path-matrix', 'javascript',
$JS$var longestIncreasingPath = function(matrix) {

};$JS$),
('longest-increasing-path-matrix', 'java',
$JAVA$class Solution {
    public int longestIncreasingPath(int[][] matrix) {

    }
}$JAVA$),
('longest-increasing-path-matrix', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestIncreasingPath(vector<vector<int>>& matrix) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('longest-increasing-path-matrix', 1, 'DFS + Memoization on DAG',
'Edges only go from smaller to larger values, so the underlying graph is a DAG. The longest path from (r, c) equals 1 + max over strictly-larger neighbors. Memoizing each cell''s answer makes the total work linear in the number of cells.',
'["Let memo be an m x n matrix of zeros (meaning \"not computed\").","Define dfs(r, c): if memo[r][c] != 0, return memo[r][c].","  Set best = 1. For each of 4 neighbors (nr, nc): if in bounds and matrix[nr][nc] > matrix[r][c], best = max(best, 1 + dfs(nr, nc)).","  memo[r][c] = best; return best.","Return the max of dfs(r, c) over all cells."]'::jsonb,
$PY$class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        m, n = len(matrix), len(matrix[0])
        memo = [[0] * n for _ in range(m)]
        def dfs(r, c):
            if memo[r][c]:
                return memo[r][c]
            best = 1
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and matrix[nr][nc] > matrix[r][c]:
                    best = max(best, 1 + dfs(nr, nc))
            memo[r][c] = best
            return best
        return max(dfs(r, c) for r in range(m) for c in range(n))
$PY$,
$JS$var longestIncreasingPath = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    const memo = Array.from({ length: m }, () => new Array(n).fill(0));
    const dfs = (r, c) => {
        if (memo[r][c]) return memo[r][c];
        let best = 1;
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && matrix[nr][nc] > matrix[r][c]) {
                best = Math.max(best, 1 + dfs(nr, nc));
            }
        }
        memo[r][c] = best;
        return best;
    };
    let answer = 0;
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) answer = Math.max(answer, dfs(r, c));
    return answer;
};
$JS$,
$JAVA$class Solution {
    public int longestIncreasingPath(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] memo = new int[m][n];
        int answer = 0;
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                answer = Math.max(answer, dfs(matrix, r, c, memo));
            }
        }
        return answer;
    }
    private int dfs(int[][] mx, int r, int c, int[][] memo) {
        if (memo[r][c] != 0) return memo[r][c];
        int best = 1;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < mx.length && nc >= 0 && nc < mx[0].length && mx[nr][nc] > mx[r][c]) {
                best = Math.max(best, 1 + dfs(mx, nr, nc, memo));
            }
        }
        memo[r][c] = best;
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
    int dfs(vector<vector<int>>& mx, int r, int c, vector<vector<int>>& memo) {
        if (memo[r][c]) return memo[r][c];
        int best = 1;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < (int)mx.size() && nc >= 0 && nc < (int)mx[0].size() && mx[nr][nc] > mx[r][c]) {
                best = max(best, 1 + dfs(mx, nr, nc, memo));
            }
        }
        return memo[r][c] = best;
    }
public:
    int longestIncreasingPath(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        vector<vector<int>> memo(m, vector<int>(n, 0));
        int answer = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                answer = max(answer, dfs(matrix, r, c, memo));
        return answer;
    }
};
$CPP$,
'O(m * n)', 'O(m * n)');

COMMIT;
