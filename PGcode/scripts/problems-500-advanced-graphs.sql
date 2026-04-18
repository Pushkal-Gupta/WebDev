-- Grow catalog 400 → 500: advanced-graphs topic (+8 problems: 1E, 5M, 2H).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'find-if-path-exists',
  'evaluate-division','loud-and-rich','course-schedule-iv','shortest-path-binary-matrix','graph-coloring',
  'shortest-path-visiting-all-nodes','parallel-courses-iii'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'find-if-path-exists',
  'evaluate-division','loud-and-rich','course-schedule-iv','shortest-path-binary-matrix','graph-coloring',
  'shortest-path-visiting-all-nodes','parallel-courses-iii'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'find-if-path-exists',
  'evaluate-division','loud-and-rich','course-schedule-iv','shortest-path-binary-matrix','graph-coloring',
  'shortest-path-visiting-all-nodes','parallel-courses-iii'
);

-- ============================================================
-- 1) find-if-path-exists (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('find-if-path-exists', 'advanced-graphs', 'Find if Path Exists in Graph', 'Easy',
$$<p>There is a bi-directional graph with <code>n</code> vertices labeled <code>0</code> to <code>n - 1</code>. You are given a 2D integer array <code>edges</code> where <code>edges[i] = [u_i, v_i]</code> denotes an edge. Determine if there is a valid path from <code>source</code> to <code>destination</code>.</p>$$,
'', ARRAY[
  'Build an adjacency list from the edges.',
  'Use BFS or DFS from source to check if destination is reachable.',
  'Alternatively use Union-Find.'
], '500', 'https://leetcode.com/problems/find-if-path-exists-in-graph/',
'validPath',
'[{"name":"n","type":"int"},{"name":"edges","type":"List[List[int]]"},{"name":"source","type":"int"},{"name":"destination","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["3","[[0,1],[1,2],[2,0]]","0","2"],"expected":"true"},
  {"inputs":["6","[[0,1],[0,2],[3,5],[5,4],[4,3]]","0","5"],"expected":"false"},
  {"inputs":["1","[]","0","0"],"expected":"true"},
  {"inputs":["4","[[0,1],[2,3]]","0","3"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('find-if-path-exists', 'python',
$PY$class Solution:
    def validPath(self, n: int, edges: List[List[int]], source: int, destination: int) -> bool:
        $PY$),
('find-if-path-exists', 'javascript',
$JS$var validPath = function(n, edges, source, destination) {

};$JS$),
('find-if-path-exists', 'java',
$JAVA$class Solution {
    public boolean validPath(int n, int[][] edges, int source, int destination) {

    }
}$JAVA$),
('find-if-path-exists', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool validPath(int n, vector<vector<int>>& edges, int source, int destination) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('find-if-path-exists', 1, 'BFS',
'Build an adjacency list and perform BFS from source. If we visit destination during the traversal, a path exists.',
'["Build adjacency list from edges.","BFS from source using a queue and visited set.","If destination is reached, return true.","If BFS finishes without reaching destination, return false."]'::jsonb,
$PY$class Solution:
    def validPath(self, n: int, edges: List[List[int]], source: int, destination: int) -> bool:
        from collections import defaultdict, deque
        if source == destination:
            return True
        graph = defaultdict(list)
        for u, v in edges:
            graph[u].append(v)
            graph[v].append(u)
        visited = set([source])
        queue = deque([source])
        while queue:
            node = queue.popleft()
            if node == destination:
                return True
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False
$PY$,
$JS$var validPath = function(n, edges, source, destination) {
    if (source === destination) return true;
    const graph = Array.from({length: n}, () => []);
    for (const [u, v] of edges) {
        graph[u].push(v);
        graph[v].push(u);
    }
    const visited = new Set([source]);
    const queue = [source];
    let head = 0;
    while (head < queue.length) {
        const node = queue[head++];
        if (node === destination) return true;
        for (const neighbor of graph[node]) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return false;
};
$JS$,
$JAVA$class Solution {
    public boolean validPath(int n, int[][] edges, int source, int destination) {
        if (source == destination) return true;
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) {
            graph.get(e[0]).add(e[1]);
            graph.get(e[1]).add(e[0]);
        }
        boolean[] visited = new boolean[n];
        visited[source] = true;
        Queue<Integer> queue = new LinkedList<>();
        queue.add(source);
        while (!queue.isEmpty()) {
            int node = queue.poll();
            if (node == destination) return true;
            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.add(neighbor);
                }
            }
        }
        return false;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool validPath(int n, vector<vector<int>>& edges, int source, int destination) {
        if (source == destination) return true;
        vector<vector<int>> graph(n);
        for (auto& e : edges) {
            graph[e[0]].push_back(e[1]);
            graph[e[1]].push_back(e[0]);
        }
        vector<bool> visited(n, false);
        visited[source] = true;
        queue<int> q;
        q.push(source);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            if (node == destination) return true;
            for (int neighbor : graph[node]) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    q.push(neighbor);
                }
            }
        }
        return false;
    }
};
$CPP$,
'O(V + E)', 'O(V + E)');

-- ============================================================
-- 2) evaluate-division (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('evaluate-division', 'advanced-graphs', 'Evaluate Division', 'Medium',
$$<p>You are given equations in the form <code>A / B = k</code> as arrays <code>equations</code> and <code>values</code>. Given some <code>queries</code>, return the answers. If the answer does not exist, return <code>-1.0</code>.</p><p>equations[i] = [Ai, Bi], values[i] = Ai / Bi. queries[j] = [Cj, Dj] asking Cj / Dj.</p>$$,
'', ARRAY[
  'Build a weighted directed graph: A -> B with weight k, and B -> A with weight 1/k.',
  'For each query, BFS/DFS from C to D, multiplying weights along the path.',
  'If C or D is not in the graph, or no path exists, return -1.0.'
], '500', 'https://leetcode.com/problems/evaluate-division/',
'calcEquation',
'[{"name":"equations","type":"List[List[str]]"},{"name":"values","type":"List[int]"},{"name":"queries","type":"List[List[str]]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[\"a\",\"b\"],[\"b\",\"c\"]]","[2,3]","[[\"a\",\"c\"],[\"b\",\"a\"],[\"a\",\"e\"],[\"a\",\"a\"],[\"x\",\"x\"]]"],"expected":"[6,0,-1,1,-1]"},
  {"inputs":["[[\"a\",\"b\"]]","[2]","[[\"a\",\"b\"],[\"b\",\"a\"]]"],"expected":"[2,0]"},
  {"inputs":["[[\"a\",\"b\"],[\"c\",\"d\"]]","[2,3]","[[\"a\",\"d\"]]"],"expected":"[-1]"},
  {"inputs":["[[\"x\",\"y\"]]","[5]","[[\"x\",\"y\"]]"],"expected":"[5]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('evaluate-division', 'python',
$PY$class Solution:
    def calcEquation(self, equations: List[List[str]], values: List[int], queries: List[List[str]]) -> List[int]:
        $PY$),
('evaluate-division', 'javascript',
$JS$var calcEquation = function(equations, values, queries) {

};$JS$),
('evaluate-division', 'java',
$JAVA$class Solution {
    public double[] calcEquation(String[][] equations, int[] values, String[][] queries) {

    }
}$JAVA$),
('evaluate-division', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<double> calcEquation(vector<vector<string>>& equations, vector<int>& values, vector<vector<string>>& queries) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('evaluate-division', 1, 'BFS on Weighted Graph',
'Model variables as nodes and equations as weighted edges (A/B = k means edge A->B with weight k, B->A with weight 1/k). To evaluate C/D, BFS from C to D multiplying weights along the path.',
$ALGO$["Build weighted adjacency list: for each equation A/B=k, add A->B (k) and B->A (1/k).","For each query [C, D]: if C or D not in graph, answer -1.","BFS from C. Track cumulative product. If D reached, record the product.","Otherwise answer -1."]$ALGO$::jsonb,
$PY$class Solution:
    def calcEquation(self, equations: List[List[str]], values: List[int], queries: List[List[str]]) -> List[int]:
        from collections import defaultdict, deque
        graph = defaultdict(list)
        for (a, b), v in zip(equations, values):
            graph[a].append((b, v))
            graph[b].append((a, 1.0 / v))
        result = []
        for c, d in queries:
            if c not in graph or d not in graph:
                result.append(-1)
                continue
            if c == d:
                result.append(1)
                continue
            visited = set([c])
            queue = deque([(c, 1.0)])
            found = False
            while queue:
                node, product = queue.popleft()
                if node == d:
                    result.append(int(product) if product == int(product) else product)
                    found = True
                    break
                for neighbor, weight in graph[node]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, product * weight))
            if not found:
                result.append(-1)
        return result
$PY$,
$JS$var calcEquation = function(equations, values, queries) {
    const graph = {};
    for (let i = 0; i < equations.length; i++) {
        const [a, b] = equations[i];
        if (!graph[a]) graph[a] = [];
        if (!graph[b]) graph[b] = [];
        graph[a].push([b, values[i]]);
        graph[b].push([a, 1.0 / values[i]]);
    }
    const result = [];
    for (const [c, d] of queries) {
        if (!graph[c] || !graph[d]) { result.push(-1); continue; }
        if (c === d) { result.push(1); continue; }
        const visited = new Set([c]);
        const queue = [[c, 1.0]];
        let found = false;
        let head = 0;
        while (head < queue.length) {
            const [node, product] = queue[head++];
            if (node === d) { result.push(product); found = true; break; }
            for (const [neighbor, weight] of (graph[node] || [])) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, product * weight]);
                }
            }
        }
        if (!found) result.push(-1);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public double[] calcEquation(String[][] equations, int[] values, String[][] queries) {
        Map<String, List<Object[]>> graph = new HashMap<>();
        for (int i = 0; i < equations.length; i++) {
            String a = equations[i][0], b = equations[i][1];
            graph.computeIfAbsent(a, k -> new ArrayList<>()).add(new Object[]{b, (double) values[i]});
            graph.computeIfAbsent(b, k -> new ArrayList<>()).add(new Object[]{a, 1.0 / values[i]});
        }
        double[] result = new double[queries.length];
        for (int q = 0; q < queries.length; q++) {
            String c = queries[q][0], d = queries[q][1];
            if (!graph.containsKey(c) || !graph.containsKey(d)) { result[q] = -1; continue; }
            if (c.equals(d)) { result[q] = 1; continue; }
            Set<String> visited = new HashSet<>();
            visited.add(c);
            Queue<Object[]> queue = new LinkedList<>();
            queue.add(new Object[]{c, 1.0});
            boolean found = false;
            while (!queue.isEmpty()) {
                Object[] curr = queue.poll();
                String node = (String) curr[0];
                double product = (double) curr[1];
                if (node.equals(d)) { result[q] = product; found = true; break; }
                for (Object[] neighbor : graph.getOrDefault(node, new ArrayList<>())) {
                    String next = (String) neighbor[0];
                    double weight = (double) neighbor[1];
                    if (!visited.contains(next)) {
                        visited.add(next);
                        queue.add(new Object[]{next, product * weight});
                    }
                }
            }
            if (!found) result[q] = -1;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<double> calcEquation(vector<vector<string>>& equations, vector<int>& values, vector<vector<string>>& queries) {
        unordered_map<string, vector<pair<string, double>>> graph;
        for (int i = 0; i < (int)equations.size(); i++) {
            graph[equations[i][0]].push_back({equations[i][1], (double)values[i]});
            graph[equations[i][1]].push_back({equations[i][0], 1.0 / values[i]});
        }
        vector<double> result;
        for (auto& q : queries) {
            if (!graph.count(q[0]) || !graph.count(q[1])) { result.push_back(-1); continue; }
            if (q[0] == q[1]) { result.push_back(1); continue; }
            unordered_set<string> visited;
            visited.insert(q[0]);
            queue<pair<string, double>> bfs;
            bfs.push({q[0], 1.0});
            bool found = false;
            while (!bfs.empty()) {
                auto [node, product] = bfs.front(); bfs.pop();
                if (node == q[1]) { result.push_back(product); found = true; break; }
                for (auto& [neighbor, weight] : graph[node]) {
                    if (!visited.count(neighbor)) {
                        visited.insert(neighbor);
                        bfs.push({neighbor, product * weight});
                    }
                }
            }
            if (!found) result.push_back(-1);
        }
        return result;
    }
};
$CPP$,
'O(Q * (V + E))', 'O(V + E)');

-- ============================================================
-- 3) loud-and-rich (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('loud-and-rich', 'advanced-graphs', 'Loud and Rich', 'Medium',
$$<p>There are <code>n</code> people. <code>richer[i] = [a, b]</code> means person <code>a</code> is richer than <code>b</code>. <code>quiet[i]</code> is the quietness of person <code>i</code>. For each person, find the person who is the least quiet among all people who are richer than or equal to them (including themselves). Return an array of answers.</p>$$,
'', ARRAY[
  'Build a graph where edges go from richer to poorer.',
  'DFS/topological sort: propagate the quietest person from richer people down.',
  'For each person, the answer is the person with minimum quiet value in their richer-or-equal set.'
], '500', 'https://leetcode.com/problems/loud-and-rich/',
'loudAndRich',
'[{"name":"richer","type":"List[List[int]]"},{"name":"quiet","type":"List[int]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[[1,0],[2,1],[3,1],[3,7],[4,3],[5,3],[6,3]]","[3,2,5,4,6,1,7,0]"],"expected":"[5,5,2,5,4,5,6,7]"},
  {"inputs":["[]","[0]"],"expected":"[0]"},
  {"inputs":["[[0,1]]","[1,0]"],"expected":"[0,0]"},
  {"inputs":["[[0,1],[1,2]]","[2,1,0]"],"expected":"[0,0,0]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('loud-and-rich', 'python',
$PY$class Solution:
    def loudAndRich(self, richer: List[List[int]], quiet: List[int]) -> List[int]:
        $PY$),
('loud-and-rich', 'javascript',
$JS$var loudAndRich = function(richer, quiet) {

};$JS$),
('loud-and-rich', 'java',
$JAVA$class Solution {
    public int[] loudAndRich(int[][] richer, int[] quiet) {

    }
}$JAVA$),
('loud-and-rich', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> loudAndRich(vector<vector<int>>& richer, vector<int>& quiet) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('loud-and-rich', 1, 'DFS with Memoization',
'Build a graph from poorer to richer (reverse direction). For each person, DFS to find the quietest person among all richer-or-equal people. Memoize results to avoid recomputation.',
$ALGO$["Build graph: for each [a, b] in richer, add edge b -> a (b asks who is quieter among richer people including a).","answer[i] = -1 initially.","DFS(i): if answer[i] != -1, return. Set answer[i] = i. For each richer neighbor j, DFS(j), then if quiet[answer[j]] < quiet[answer[i]], answer[i] = answer[j].","Call DFS for all i. Return answer."]$ALGO$::jsonb,
$PY$class Solution:
    def loudAndRich(self, richer: List[List[int]], quiet: List[int]) -> List[int]:
        from collections import defaultdict
        n = len(quiet)
        graph = defaultdict(list)
        for a, b in richer:
            graph[b].append(a)
        answer = [-1] * n
        def dfs(i):
            if answer[i] != -1:
                return
            answer[i] = i
            for j in graph[i]:
                dfs(j)
                if quiet[answer[j]] < quiet[answer[i]]:
                    answer[i] = answer[j]
        for i in range(n):
            dfs(i)
        return answer
$PY$,
$JS$var loudAndRich = function(richer, quiet) {
    const n = quiet.length;
    const graph = Array.from({length: n}, () => []);
    for (const [a, b] of richer) graph[b].push(a);
    const answer = new Array(n).fill(-1);
    const dfs = (i) => {
        if (answer[i] !== -1) return;
        answer[i] = i;
        for (const j of graph[i]) {
            dfs(j);
            if (quiet[answer[j]] < quiet[answer[i]]) answer[i] = answer[j];
        }
    };
    for (let i = 0; i < n; i++) dfs(i);
    return answer;
};
$JS$,
$JAVA$class Solution {
    public int[] loudAndRich(int[][] richer, int[] quiet) {
        int n = quiet.length;
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] r : richer) graph.get(r[1]).add(r[0]);
        int[] answer = new int[n];
        Arrays.fill(answer, -1);
        for (int i = 0; i < n; i++) dfs(i, graph, quiet, answer);
        return answer;
    }
    private void dfs(int i, List<List<Integer>> graph, int[] quiet, int[] answer) {
        if (answer[i] != -1) return;
        answer[i] = i;
        for (int j : graph.get(i)) {
            dfs(j, graph, quiet, answer);
            if (quiet[answer[j]] < quiet[answer[i]]) answer[i] = answer[j];
        }
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> loudAndRich(vector<vector<int>>& richer, vector<int>& quiet) {
        int n = quiet.size();
        vector<vector<int>> graph(n);
        for (auto& r : richer) graph[r[1]].push_back(r[0]);
        vector<int> answer(n, -1);
        for (int i = 0; i < n; i++) dfs(i, graph, quiet, answer);
        return answer;
    }
    void dfs(int i, vector<vector<int>>& graph, vector<int>& quiet, vector<int>& answer) {
        if (answer[i] != -1) return;
        answer[i] = i;
        for (int j : graph[i]) {
            dfs(j, graph, quiet, answer);
            if (quiet[answer[j]] < quiet[answer[i]]) answer[i] = answer[j];
        }
    }
};
$CPP$,
'O(V + E)', 'O(V + E)');

-- ============================================================
-- 4) course-schedule-iv (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('course-schedule-iv', 'advanced-graphs', 'Course Schedule IV', 'Medium',
$$<p>There are <code>numCourses</code> courses labeled from 0 to numCourses-1. You are given prerequisites and a list of queries. For each query <code>[u, v]</code>, answer whether course <code>u</code> is a prerequisite of course <code>v</code> (directly or indirectly).</p>$$,
'', ARRAY[
  'Compute transitive closure: for each course, find all courses it is a prerequisite of.',
  'BFS/DFS from each node, or use Floyd-Warshall on the reachability matrix.',
  'Then answer each query in O(1).'
], '500', 'https://leetcode.com/problems/course-schedule-iv/',
'checkIfPrerequisite',
'[{"name":"numCourses","type":"int"},{"name":"prerequisites","type":"List[List[int]]"},{"name":"queries","type":"List[List[int]]"}]'::jsonb,
'List[bool]',
'[
  {"inputs":["2","[[1,0]]","[[0,1],[1,0]]"],"expected":"[false,true]"},
  {"inputs":["2","[]","[[1,0],[0,1]]"],"expected":"[false,false]"},
  {"inputs":["3","[[1,2],[1,0],[2,0]]","[[1,0],[1,2]]"],"expected":"[true,true]"},
  {"inputs":["3","[[1,0],[2,0]]","[[0,1],[2,0]]"],"expected":"[false,true]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('course-schedule-iv', 'python',
$PY$class Solution:
    def checkIfPrerequisite(self, numCourses: int, prerequisites: List[List[int]], queries: List[List[int]]) -> List[bool]:
        $PY$),
('course-schedule-iv', 'javascript',
$JS$var checkIfPrerequisite = function(numCourses, prerequisites, queries) {

};$JS$),
('course-schedule-iv', 'java',
$JAVA$class Solution {
    public List<Boolean> checkIfPrerequisite(int numCourses, int[][] prerequisites, int[][] queries) {

    }
}$JAVA$),
('course-schedule-iv', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> checkIfPrerequisite(int numCourses, vector<vector<int>>& prerequisites, vector<vector<int>>& queries) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('course-schedule-iv', 1, 'Floyd-Warshall Transitive Closure',
'Use Floyd-Warshall to compute the transitive closure of the prerequisite graph. reachable[i][j] is true if course i is a prerequisite of course j. Then each query is answered in O(1).',
$ALGO$["Initialize reachable[n][n] = false.","For each [a, b] in prerequisites: reachable[a][b] = true.","Floyd-Warshall: for k, i, j: reachable[i][j] |= reachable[i][k] and reachable[k][j].","For each query [u, v]: return reachable[u][v]."]$ALGO$::jsonb,
$PY$class Solution:
    def checkIfPrerequisite(self, numCourses: int, prerequisites: List[List[int]], queries: List[List[int]]) -> List[bool]:
        reachable = [[False] * numCourses for _ in range(numCourses)]
        for a, b in prerequisites:
            reachable[a][b] = True
        for k in range(numCourses):
            for i in range(numCourses):
                for j in range(numCourses):
                    if reachable[i][k] and reachable[k][j]:
                        reachable[i][j] = True
        return [reachable[u][v] for u, v in queries]
$PY$,
$JS$var checkIfPrerequisite = function(numCourses, prerequisites, queries) {
    const reachable = Array.from({length: numCourses}, () => new Array(numCourses).fill(false));
    for (const [a, b] of prerequisites) reachable[a][b] = true;
    for (let k = 0; k < numCourses; k++)
        for (let i = 0; i < numCourses; i++)
            for (let j = 0; j < numCourses; j++)
                if (reachable[i][k] && reachable[k][j]) reachable[i][j] = true;
    return queries.map(([u, v]) => reachable[u][v]);
};
$JS$,
$JAVA$class Solution {
    public List<Boolean> checkIfPrerequisite(int numCourses, int[][] prerequisites, int[][] queries) {
        boolean[][] reachable = new boolean[numCourses][numCourses];
        for (int[] p : prerequisites) reachable[p[0]][p[1]] = true;
        for (int k = 0; k < numCourses; k++)
            for (int i = 0; i < numCourses; i++)
                for (int j = 0; j < numCourses; j++)
                    if (reachable[i][k] && reachable[k][j]) reachable[i][j] = true;
        List<Boolean> result = new ArrayList<>();
        for (int[] q : queries) result.add(reachable[q[0]][q[1]]);
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<bool> checkIfPrerequisite(int numCourses, vector<vector<int>>& prerequisites, vector<vector<int>>& queries) {
        vector<vector<bool>> reachable(numCourses, vector<bool>(numCourses, false));
        for (auto& p : prerequisites) reachable[p[0]][p[1]] = true;
        for (int k = 0; k < numCourses; k++)
            for (int i = 0; i < numCourses; i++)
                for (int j = 0; j < numCourses; j++)
                    if (reachable[i][k] && reachable[k][j]) reachable[i][j] = true;
        vector<bool> result;
        for (auto& q : queries) result.push_back(reachable[q[0]][q[1]]);
        return result;
    }
};
$CPP$,
'O(n^3 + Q)', 'O(n^2)');

-- ============================================================
-- 5) shortest-path-binary-matrix (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('shortest-path-binary-matrix', 'advanced-graphs', 'Shortest Path in Binary Matrix', 'Medium',
$$<p>Given an <code>n x n</code> binary matrix <code>grid</code>, return the length of the shortest clear path from top-left to bottom-right. A clear path consists of cells with value 0, and you can move in 8 directions. If there is no such path, return -1. The path length is the number of cells visited.</p>$$,
'', ARRAY[
  'BFS from (0,0) to (n-1,n-1) gives the shortest path.',
  'Each cell can connect to 8 neighbors.',
  'Return -1 if start or end cell is blocked.'
], '500', 'https://leetcode.com/problems/shortest-path-in-binary-matrix/',
'shortestPathBinaryMatrix',
'[{"name":"grid","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[0,1],[1,0]]"],"expected":"2"},
  {"inputs":["[[0,0,0],[1,1,0],[1,1,0]]"],"expected":"4"},
  {"inputs":["[[1,0,0],[1,1,0],[1,1,0]]"],"expected":"-1"},
  {"inputs":["[[0]]"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('shortest-path-binary-matrix', 'python',
$PY$class Solution:
    def shortestPathBinaryMatrix(self, grid: List[List[int]]) -> int:
        $PY$),
('shortest-path-binary-matrix', 'javascript',
$JS$var shortestPathBinaryMatrix = function(grid) {

};$JS$),
('shortest-path-binary-matrix', 'java',
$JAVA$class Solution {
    public int shortestPathBinaryMatrix(int[][] grid) {

    }
}$JAVA$),
('shortest-path-binary-matrix', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestPathBinaryMatrix(vector<vector<int>>& grid) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('shortest-path-binary-matrix', 1, 'BFS',
'BFS from the top-left corner explores cells level by level, guaranteeing the shortest path. We move in 8 directions and count cells visited.',
$ALGO$["If grid[0][0] or grid[n-1][n-1] is 1, return -1.","BFS from (0,0) with distance 1.","For each cell, explore 8 neighbors. If neighbor is 0 and unvisited, add with distance+1.","If (n-1,n-1) is reached, return distance.","If BFS exhausts, return -1."]$ALGO$::jsonb,
$PY$class Solution:
    def shortestPathBinaryMatrix(self, grid: List[List[int]]) -> int:
        from collections import deque
        n = len(grid)
        if grid[0][0] == 1 or grid[n-1][n-1] == 1:
            return -1
        queue = deque([(0, 0, 1)])
        grid[0][0] = 1
        dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
        while queue:
            r, c, dist = queue.popleft()
            if r == n - 1 and c == n - 1:
                return dist
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0:
                    grid[nr][nc] = 1
                    queue.append((nr, nc, dist + 1))
        return -1
$PY$,
$JS$var shortestPathBinaryMatrix = function(grid) {
    const n = grid.length;
    if (grid[0][0] === 1 || grid[n-1][n-1] === 1) return -1;
    const queue = [[0, 0, 1]];
    grid[0][0] = 1;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let head = 0;
    while (head < queue.length) {
        const [r, c, dist] = queue[head++];
        if (r === n-1 && c === n-1) return dist;
        for (const [dr, dc] of dirs) {
            const nr = r+dr, nc = c+dc;
            if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0) {
                grid[nr][nc] = 1;
                queue.push([nr, nc, dist+1]);
            }
        }
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int shortestPathBinaryMatrix(int[][] grid) {
        int n = grid.length;
        if (grid[0][0] == 1 || grid[n-1][n-1] == 1) return -1;
        int[][] dirs = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
        Queue<int[]> queue = new LinkedList<>();
        queue.add(new int[]{0, 0, 1});
        grid[0][0] = 1;
        while (!queue.isEmpty()) {
            int[] curr = queue.poll();
            if (curr[0] == n-1 && curr[1] == n-1) return curr[2];
            for (int[] d : dirs) {
                int nr = curr[0]+d[0], nc = curr[1]+d[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                    grid[nr][nc] = 1;
                    queue.add(new int[]{nr, nc, curr[2]+1});
                }
            }
        }
        return -1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int shortestPathBinaryMatrix(vector<vector<int>>& grid) {
        int n = grid.size();
        if (grid[0][0] == 1 || grid[n-1][n-1] == 1) return -1;
        int dirs[][2] = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
        queue<tuple<int,int,int>> q;
        q.push({0, 0, 1});
        grid[0][0] = 1;
        while (!q.empty()) {
            auto [r, c, dist] = q.front(); q.pop();
            if (r == n-1 && c == n-1) return dist;
            for (auto& d : dirs) {
                int nr = r+d[0], nc = c+d[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                    grid[nr][nc] = 1;
                    q.push({nr, nc, dist+1});
                }
            }
        }
        return -1;
    }
};
$CPP$,
'O(n^2)', 'O(n^2)');

-- ============================================================
-- 6) graph-coloring (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('graph-coloring', 'advanced-graphs', 'Possible Bipartition', 'Medium',
$$<p>We want to split a group of <code>n</code> people (labeled from 1 to n) into two groups. Given an array <code>dislikes</code> where <code>dislikes[i] = [a, b]</code> indicates that a and b dislike each other, return <code>true</code> if it is possible to split everyone into two groups such that no two people in the same group dislike each other.</p>$$,
'', ARRAY[
  'This is a graph 2-coloring (bipartite check) problem.',
  'BFS/DFS: try to color each node, ensuring neighbors have different colors.',
  'If a conflict is found, the graph is not bipartite.'
], '500', 'https://leetcode.com/problems/possible-bipartition/',
'possibleBipartition',
'[{"name":"n","type":"int"},{"name":"dislikes","type":"List[List[int]]"}]'::jsonb,
'bool',
'[
  {"inputs":["4","[[1,2],[1,3],[2,4]]"],"expected":"true"},
  {"inputs":["3","[[1,2],[1,3],[2,3]]"],"expected":"false"},
  {"inputs":["5","[[1,2],[2,3],[3,4],[4,5],[1,5]]"],"expected":"false"},
  {"inputs":["1","[]"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('graph-coloring', 'python',
$PY$class Solution:
    def possibleBipartition(self, n: int, dislikes: List[List[int]]) -> bool:
        $PY$),
('graph-coloring', 'javascript',
$JS$var possibleBipartition = function(n, dislikes) {

};$JS$),
('graph-coloring', 'java',
$JAVA$class Solution {
    public boolean possibleBipartition(int n, int[][] dislikes) {

    }
}$JAVA$),
('graph-coloring', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool possibleBipartition(int n, vector<vector<int>>& dislikes) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('graph-coloring', 1, 'BFS Bipartite Check',
'Model people as nodes and dislikes as edges. The problem reduces to checking if the graph is bipartite (2-colorable). BFS from each uncolored node, alternating colors. If a neighbor already has the same color, return false.',
$ALGO$["Build adjacency list from dislikes (1-indexed).","color array of size n+1, initialized to 0 (uncolored).","For each uncolored node, BFS: assign color 1, neighbors get color 2, etc.","If any neighbor has the same color as current, return false.","Return true."]$ALGO$::jsonb,
$PY$class Solution:
    def possibleBipartition(self, n: int, dislikes: List[List[int]]) -> bool:
        from collections import defaultdict, deque
        graph = defaultdict(list)
        for a, b in dislikes:
            graph[a].append(b)
            graph[b].append(a)
        color = [0] * (n + 1)
        for i in range(1, n + 1):
            if color[i] != 0:
                continue
            queue = deque([i])
            color[i] = 1
            while queue:
                node = queue.popleft()
                for neighbor in graph[node]:
                    if color[neighbor] == 0:
                        color[neighbor] = -color[node]
                        queue.append(neighbor)
                    elif color[neighbor] == color[node]:
                        return False
        return True
$PY$,
$JS$var possibleBipartition = function(n, dislikes) {
    const graph = Array.from({length: n+1}, () => []);
    for (const [a, b] of dislikes) {
        graph[a].push(b);
        graph[b].push(a);
    }
    const color = new Array(n+1).fill(0);
    for (let i = 1; i <= n; i++) {
        if (color[i] !== 0) continue;
        const queue = [i];
        color[i] = 1;
        let head = 0;
        while (head < queue.length) {
            const node = queue[head++];
            for (const neighbor of graph[node]) {
                if (color[neighbor] === 0) {
                    color[neighbor] = -color[node];
                    queue.push(neighbor);
                } else if (color[neighbor] === color[node]) {
                    return false;
                }
            }
        }
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean possibleBipartition(int n, int[][] dislikes) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
        for (int[] d : dislikes) {
            graph.get(d[0]).add(d[1]);
            graph.get(d[1]).add(d[0]);
        }
        int[] color = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            if (color[i] != 0) continue;
            Queue<Integer> queue = new LinkedList<>();
            queue.add(i);
            color[i] = 1;
            while (!queue.isEmpty()) {
                int node = queue.poll();
                for (int neighbor : graph.get(node)) {
                    if (color[neighbor] == 0) {
                        color[neighbor] = -color[node];
                        queue.add(neighbor);
                    } else if (color[neighbor] == color[node]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool possibleBipartition(int n, vector<vector<int>>& dislikes) {
        vector<vector<int>> graph(n + 1);
        for (auto& d : dislikes) {
            graph[d[0]].push_back(d[1]);
            graph[d[1]].push_back(d[0]);
        }
        vector<int> color(n + 1, 0);
        for (int i = 1; i <= n; i++) {
            if (color[i] != 0) continue;
            queue<int> q;
            q.push(i);
            color[i] = 1;
            while (!q.empty()) {
                int node = q.front(); q.pop();
                for (int neighbor : graph[node]) {
                    if (color[neighbor] == 0) {
                        color[neighbor] = -color[node];
                        q.push(neighbor);
                    } else if (color[neighbor] == color[node]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
};
$CPP$,
'O(V + E)', 'O(V + E)');

-- ============================================================
-- 7) shortest-path-visiting-all-nodes (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('shortest-path-visiting-all-nodes', 'advanced-graphs', 'Shortest Path Visiting All Nodes', 'Hard',
$$<p>You have an undirected, connected graph of <code>n</code> nodes labeled from 0 to n - 1. You are given an array <code>graph</code> where <code>graph[i]</code> is a list of all the nodes connected with node i. Return the length of the shortest path that visits every node. You may start and stop at any node, revisit nodes, and reuse edges.</p>$$,
'', ARRAY[
  'Use BFS with bitmask state: (current_node, visited_bitmask).',
  'Start BFS from every node simultaneously.',
  'The answer is the first time we reach a state where all bits are set.'
], '500', 'https://leetcode.com/problems/shortest-path-visiting-all-nodes/',
'shortestPathLength',
'[{"name":"graph","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[1,2,3],[0],[0],[0]]"],"expected":"4"},
  {"inputs":["[[1],[0,2,4],[1,3,4],[2],[1,2]]"],"expected":"4"},
  {"inputs":["[[1],[0]]"],"expected":"1"},
  {"inputs":["[[]]"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('shortest-path-visiting-all-nodes', 'python',
$PY$class Solution:
    def shortestPathLength(self, graph: List[List[int]]) -> int:
        $PY$),
('shortest-path-visiting-all-nodes', 'javascript',
$JS$var shortestPathLength = function(graph) {

};$JS$),
('shortest-path-visiting-all-nodes', 'java',
$JAVA$class Solution {
    public int shortestPathLength(int[][] graph) {

    }
}$JAVA$),
('shortest-path-visiting-all-nodes', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestPathLength(vector<vector<int>>& graph) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('shortest-path-visiting-all-nodes', 1, 'BFS with Bitmask',
'State is (node, visited_mask). BFS from all nodes simultaneously. The target is any state where visited_mask has all n bits set. Since we can revisit nodes, the bitmask prevents infinite loops by tracking which nodes have been visited overall.',
$ALGO$["n = len(graph). full_mask = (1 << n) - 1.","Initialize queue with (i, 1 << i, 0) for all i. visited set = all initial states.","BFS: dequeue (node, mask, dist). If mask == full_mask, return dist.","For each neighbor: new_mask = mask | (1 << neighbor). If (neighbor, new_mask) not visited, enqueue with dist+1."]$ALGO$::jsonb,
$PY$class Solution:
    def shortestPathLength(self, graph: List[List[int]]) -> int:
        from collections import deque
        n = len(graph)
        full_mask = (1 << n) - 1
        queue = deque()
        visited = set()
        for i in range(n):
            state = (i, 1 << i)
            queue.append((i, 1 << i, 0))
            visited.add(state)
        while queue:
            node, mask, dist = queue.popleft()
            if mask == full_mask:
                return dist
            for neighbor in graph[node]:
                new_mask = mask | (1 << neighbor)
                state = (neighbor, new_mask)
                if state not in visited:
                    visited.add(state)
                    queue.append((neighbor, new_mask, dist + 1))
        return 0
$PY$,
$JS$var shortestPathLength = function(graph) {
    const n = graph.length;
    const fullMask = (1 << n) - 1;
    const queue = [];
    const visited = new Set();
    for (let i = 0; i < n; i++) {
        const state = `${i},${1 << i}`;
        queue.push([i, 1 << i, 0]);
        visited.add(state);
    }
    let head = 0;
    while (head < queue.length) {
        const [node, mask, dist] = queue[head++];
        if (mask === fullMask) return dist;
        for (const neighbor of graph[node]) {
            const newMask = mask | (1 << neighbor);
            const state = `${neighbor},${newMask}`;
            if (!visited.has(state)) {
                visited.add(state);
                queue.push([neighbor, newMask, dist + 1]);
            }
        }
    }
    return 0;
};
$JS$,
$JAVA$class Solution {
    public int shortestPathLength(int[][] graph) {
        int n = graph.length;
        int fullMask = (1 << n) - 1;
        Queue<int[]> queue = new LinkedList<>();
        boolean[][] visited = new boolean[n][1 << n];
        for (int i = 0; i < n; i++) {
            queue.add(new int[]{i, 1 << i, 0});
            visited[i][1 << i] = true;
        }
        while (!queue.isEmpty()) {
            int[] curr = queue.poll();
            int node = curr[0], mask = curr[1], dist = curr[2];
            if (mask == fullMask) return dist;
            for (int neighbor : graph[node]) {
                int newMask = mask | (1 << neighbor);
                if (!visited[neighbor][newMask]) {
                    visited[neighbor][newMask] = true;
                    queue.add(new int[]{neighbor, newMask, dist + 1});
                }
            }
        }
        return 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int shortestPathLength(vector<vector<int>>& graph) {
        int n = graph.size();
        int fullMask = (1 << n) - 1;
        queue<tuple<int,int,int>> q;
        vector<vector<bool>> visited(n, vector<bool>(1 << n, false));
        for (int i = 0; i < n; i++) {
            q.push({i, 1 << i, 0});
            visited[i][1 << i] = true;
        }
        while (!q.empty()) {
            auto [node, mask, dist] = q.front(); q.pop();
            if (mask == fullMask) return dist;
            for (int neighbor : graph[node]) {
                int newMask = mask | (1 << neighbor);
                if (!visited[neighbor][newMask]) {
                    visited[neighbor][newMask] = true;
                    q.push({neighbor, newMask, dist + 1});
                }
            }
        }
        return 0;
    }
};
$CPP$,
'O(n * 2^n)', 'O(n * 2^n)');

-- ============================================================
-- 8) parallel-courses-iii (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('parallel-courses-iii', 'advanced-graphs', 'Parallel Courses III', 'Hard',
$$<p>You are given <code>n</code> courses, each with a time duration <code>time[i]</code>. There are also prerequisite relations <code>relations[i] = [prev, next]</code> meaning course <code>prev</code> must finish before course <code>next</code> starts. Courses can be taken simultaneously if prerequisites are met. Return the <strong>minimum number of months</strong> needed to complete all courses.</p>$$,
'', ARRAY[
  'This is a longest path in a DAG problem.',
  'Use topological sort. For each course, track the earliest time it can start (max finish time of all prerequisites).',
  'The answer is the maximum finish time across all courses.'
], '500', 'https://leetcode.com/problems/parallel-courses-iii/',
'minimumTime',
'[{"name":"n","type":"int"},{"name":"relations","type":"List[List[int]]"},{"name":"time","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["3","[[1,3],[2,3]]","[3,2,5]"],"expected":"8"},
  {"inputs":["5","[[1,5],[2,5],[3,5],[3,4],[4,5]]","[1,2,3,4,5]"],"expected":"12"},
  {"inputs":["1","[]","[5]"],"expected":"5"},
  {"inputs":["2","[[1,2]]","[3,7]"],"expected":"10"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('parallel-courses-iii', 'python',
$PY$class Solution:
    def minimumTime(self, n: int, relations: List[List[int]], time: List[int]) -> int:
        $PY$),
('parallel-courses-iii', 'javascript',
$JS$var minimumTime = function(n, relations, time) {

};$JS$),
('parallel-courses-iii', 'java',
$JAVA$class Solution {
    public int minimumTime(int n, int[][] relations, int[] time) {

    }
}$JAVA$),
('parallel-courses-iii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumTime(int n, vector<vector<int>>& relations, vector<int>& time) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('parallel-courses-iii', 1, 'Topological Sort (Kahn)',
'Process courses in topological order. Each course starts after all prerequisites finish. The finish time of a course is max(prerequisite finish times) + its own duration. The answer is the maximum finish time.',
$ALGO$["Build adjacency list and in-degree array (1-indexed).","Initialize dist[i] = time[i-1] for all courses with in-degree 0. Add them to queue.","BFS: for each course, update neighbors: dist[neighbor] = max(dist[neighbor], dist[current] + time[neighbor-1]).","Decrement in-degree; if 0, add to queue.","Return max(dist)."]$ALGO$::jsonb,
$PY$class Solution:
    def minimumTime(self, n: int, relations: List[List[int]], time: List[int]) -> int:
        from collections import defaultdict, deque
        graph = defaultdict(list)
        indegree = [0] * (n + 1)
        for prev, nxt in relations:
            graph[prev].append(nxt)
            indegree[nxt] += 1
        dist = [0] * (n + 1)
        queue = deque()
        for i in range(1, n + 1):
            if indegree[i] == 0:
                dist[i] = time[i - 1]
                queue.append(i)
        while queue:
            course = queue.popleft()
            for nxt in graph[course]:
                dist[nxt] = max(dist[nxt], dist[course] + time[nxt - 1])
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)
        return max(dist)
$PY$,
$JS$var minimumTime = function(n, relations, time) {
    const graph = Array.from({length: n+1}, () => []);
    const indegree = new Array(n+1).fill(0);
    for (const [prev, nxt] of relations) {
        graph[prev].push(nxt);
        indegree[nxt]++;
    }
    const dist = new Array(n+1).fill(0);
    const queue = [];
    for (let i = 1; i <= n; i++) {
        if (indegree[i] === 0) {
            dist[i] = time[i-1];
            queue.push(i);
        }
    }
    let head = 0;
    while (head < queue.length) {
        const course = queue[head++];
        for (const nxt of graph[course]) {
            dist[nxt] = Math.max(dist[nxt], dist[course] + time[nxt-1]);
            if (--indegree[nxt] === 0) queue.push(nxt);
        }
    }
    return Math.max(...dist);
};
$JS$,
$JAVA$class Solution {
    public int minimumTime(int n, int[][] relations, int[] time) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
        int[] indegree = new int[n + 1];
        for (int[] r : relations) {
            graph.get(r[0]).add(r[1]);
            indegree[r[1]]++;
        }
        int[] dist = new int[n + 1];
        Queue<Integer> queue = new LinkedList<>();
        for (int i = 1; i <= n; i++) {
            if (indegree[i] == 0) {
                dist[i] = time[i - 1];
                queue.add(i);
            }
        }
        while (!queue.isEmpty()) {
            int course = queue.poll();
            for (int nxt : graph.get(course)) {
                dist[nxt] = Math.max(dist[nxt], dist[course] + time[nxt - 1]);
                if (--indegree[nxt] == 0) queue.add(nxt);
            }
        }
        int ans = 0;
        for (int d : dist) ans = Math.max(ans, d);
        return ans;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minimumTime(int n, vector<vector<int>>& relations, vector<int>& time) {
        vector<vector<int>> graph(n + 1);
        vector<int> indegree(n + 1, 0);
        for (auto& r : relations) {
            graph[r[0]].push_back(r[1]);
            indegree[r[1]]++;
        }
        vector<int> dist(n + 1, 0);
        queue<int> q;
        for (int i = 1; i <= n; i++) {
            if (indegree[i] == 0) {
                dist[i] = time[i - 1];
                q.push(i);
            }
        }
        while (!q.empty()) {
            int course = q.front(); q.pop();
            for (int nxt : graph[course]) {
                dist[nxt] = max(dist[nxt], dist[course] + time[nxt - 1]);
                if (--indegree[nxt] == 0) q.push(nxt);
            }
        }
        return *max_element(dist.begin(), dist.end());
    }
};
$CPP$,
'O(V + E)', 'O(V + E)');

COMMIT;
