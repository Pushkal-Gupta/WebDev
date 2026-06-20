#!/usr/bin/env node
// Part B — adds patches 11-25 to /tmp/patch-w3-400-23.json (append).

import fs from 'node:fs';

const existing = JSON.parse(fs.readFileSync('/tmp/patch-w3-400-23.json', 'utf8'));
const ids = new Set(existing.map(e => e.id));
const PATCHES = {};

function ed(intuition, approach, complexity, pitfalls) {
  return `## Intuition\n${intuition}\n\n## Approach\n${approach}\n\n## Complexity\n${complexity}\n\n## Pitfalls\n${pitfalls}`;
}
function add(id, patch) { PATCHES[id] = patch; }

// ============================================================
// two-city-scheduling
// ============================================================
add('two-city-scheduling', {
  pattern: 'greedy-sort-by-delta',
  hints: [
    'For each person, compute the delta = cost[i][0] - cost[i][1] (cost of sending to city A minus city B).',
    'Sorting by delta ascending puts "biggest savings if sent to A" first. Send the first n to A, the rest to B.',
    'Equivalently: assume everyone goes to B, then pick the n people with the smallest cost[i][0] - cost[i][1] to switch to A.',
    'Greedy works because the choice for each person is independent given the count constraint, and the delta exactly measures the swap cost.',
  ],
  test_cases: [
    { inputs: ['[[10,20],[30,200],[400,50],[30,20]]'], expected: '110' },
    { inputs: ['[[259,770],[448,54],[926,667],[184,139],[840,118],[577,469]]'], expected: '1859' },
    { inputs: ['[[1,2],[3,4]]'], expected: '5' },
    { inputs: ['[[10,10]]'], expected: '0' },
    { inputs: ['[[10,10],[20,20]]'], expected: '30' },
    { inputs: ['[[1,100],[100,1]]'], expected: '2' },
    { inputs: ['[[1,1],[2,2],[3,3],[4,4]]'], expected: '10' },
    { inputs: ['[[100,200],[200,100],[300,400],[400,300]]'], expected: '800' },
    { inputs: ['[[515,563],[451,713],[537,709],[343,819],[855,779],[457,60],[650,359],[631,42]]'], expected: '3086' },
    { inputs: ['[[70,311],[14,924],[2,372],[1,162],[510,541],[692,2],[330,388],[373,587],[268,182],[990,540]]'], expected: '2317' },
  ],
  editorial_md: ed(
    'Each person\'s decision is "go to A or go to B?" The constraint says exactly `n` go to each. Since the choices interact only through the count, you can rephrase it: imagine everyone goes to B for free, then pick the `n` people for whom switching to A saves the most money (or costs the least extra). That difference per person is `cost[i][0] - cost[i][1]`, the "delta to switch."',
    'Compute `delta[i] = cost[i][0] - cost[i][1]` for each person. Sort indices by ascending `delta`: a very negative delta means flying to A is much cheaper than B for that person — perfect candidates to send to A.\n\nSend the first `n` (smallest deltas) to A, the rest to B. Sum `cost[i][0]` for the A-half and `cost[i][1]` for the B-half.\n\nAn equivalent formulation: start by summing `cost[i][1]` for everyone (assume all go to B), then add `delta[i]` for the `n` smallest deltas (the cheapest swaps). Same answer, slightly cleaner code.\n\nWhy greedy works: any other assignment that doesn\'t put the `n` smallest-delta people in A can be improved by swapping a chosen high-delta person out and a low-delta non-chosen in — strict reduction in total cost. So the greedy choice is optimal.',
    'Time O(n log n) for the sort. Space O(n) for the deltas / sorted indices, or O(1) if you sort the input array directly.',
    'Sorting by `cost[i][0]` alone instead of the delta ignores that B-cost matters — picking the absolutely-cheap-A people may miss cases where B-cost is cheaper still. The "n" in `2n` is the size per city, not the total — make sure you split the array at index `n` (= `len/2`), not at the end.'
  ),
  solutions: {
    python: `class Solution:
    def twoCitySchedCost(self, costs):
        costs.sort(key=lambda c: c[0] - c[1])
        n = len(costs) // 2
        total = 0
        for i in range(n):
            total += costs[i][0]
        for i in range(n, len(costs)):
            total += costs[i][1]
        return total
`,
    javascript: `var twoCitySchedCost = function(costs) {
    costs.sort((a, b) => (a[0] - a[1]) - (b[0] - b[1]));
    const n = costs.length / 2;
    let total = 0;
    for (let i = 0; i < n; i++) total += costs[i][0];
    for (let i = n; i < costs.length; i++) total += costs[i][1];
    return total;
};
`,
    java: `class Solution {
    public int twoCitySchedCost(int[][] costs) {
        Arrays.sort(costs, (a, b) -> (a[0] - a[1]) - (b[0] - b[1]));
        int n = costs.length / 2;
        int total = 0;
        for (int i = 0; i < n; i++) total += costs[i][0];
        for (int i = n; i < costs.length; i++) total += costs[i][1];
        return total;
    }
}
`,
    cpp: `class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
        sort(costs.begin(), costs.end(), [](const vector<int>& a, const vector<int>& b) {
            return (a[0] - a[1]) < (b[0] - b[1]);
        });
        int n = costs.size() / 2;
        int total = 0;
        for (int i = 0; i < n; i++) total += costs[i][0];
        for (int i = n; i < (int)costs.size(); i++) total += costs[i][1];
        return total;
    }
};
`,
  },
});

// ============================================================
// design-browser-history
// ============================================================
// Test uses single visit method returning the url. Add a few visits.
add('design-browser-history', {
  pattern: 'two-stacks-or-array-with-pointer',
  hints: [
    'Two stacks: one for back history, one for forward history. visit() pushes current onto back, sets new current, clears forward.',
    'Alternatively: one array with a current index, and a size pointer that shrinks on visit() to invalidate future entries.',
    'back(steps): pop `steps` (or until back stack empty) entries off back to forward, set current accordingly. Symmetric for forward.',
    'The array-with-pointer version is O(1) per operation and simpler to reason about than two stacks.',
  ],
  test_cases: [
    { inputs: ['"leetcode.com"'], expected: '"leetcode.com"' },
    { inputs: ['"google.com"'], expected: '"google.com"' },
    { inputs: ['"facebook.com"'], expected: '"facebook.com"' },
    { inputs: ['"youtube.com"'], expected: '"youtube.com"' },
    { inputs: ['"github.com"'], expected: '"github.com"' },
    { inputs: ['"twitter.com"'], expected: '"twitter.com"' },
    { inputs: ['"reddit.com"'], expected: '"reddit.com"' },
    { inputs: ['"news.ycombinator.com"'], expected: '"news.ycombinator.com"' },
    { inputs: ['"stackoverflow.com"'], expected: '"stackoverflow.com"' },
    { inputs: ['"medium.com"'], expected: '"medium.com"' },
  ],
  editorial_md: ed(
    'Browser history is a sequence with a movable cursor. Visiting a new URL truncates anything ahead of the cursor (the redo history), which is exactly the semantics of array-plus-pointer. Two stacks (back + forward) is equivalent and is the textbook framing, but the array version is cheaper because back/forward are pure pointer moves, not stack transfers.',
    'Maintain an array `hist` and two indices: `cur` (current position) and `last` (the highest valid index — anything past this is stale forward history).\n\n- Constructor: `hist = [homepage]`, `cur = 0`, `last = 0`.\n- `visit(url)`: increment `cur`. Either write to `hist[cur]` (if it exists) or push. Set `last = cur` — this invalidates everything ahead.\n- `back(steps)`: `cur = max(0, cur - steps)`. Return `hist[cur]`.\n- `forward(steps)`: `cur = min(last, cur + steps)`. Return `hist[cur]`.\n\nEvery operation is O(1) amortized (visit may rarely resize the array). The `last` pointer is the key trick: it acts as a logical "delete past this point" without actually freeing memory, which keeps the array reusable.\n\nThe two-stack variant works too: `back.push(current); current = url; forward.clear()` for visit, etc. Same asymptotic complexity but each clear is O(forward size), and pulling N entries off back to forward for `back(N)` is O(N). Array-pointer keeps it pointer-only.',
    'Time O(1) per `visit`, O(1) per `back` and `forward` (just pointer arithmetic). Space O(V) where V is the number of distinct visit calls — the array grows monotonically.',
    'Resizing the array on every visit without tracking `last` leaves dead forward entries that re-appear after `back()`. Forgetting `max(0, ...)` and `min(last, ...)` allows the pointer to escape bounds. Returning the URL before applying the step count silently corrupts state.'
  ),
  solutions: {
    python: `class BrowserHistory:
    def __init__(self, homepage: str):
        self.hist = [homepage]
        self.cur = 0
        self.last = 0

    def visit(self, url: str) -> None:
        self.cur += 1
        if self.cur < len(self.hist):
            self.hist[self.cur] = url
        else:
            self.hist.append(url)
        self.last = self.cur

    def back(self, steps: int) -> str:
        self.cur = max(0, self.cur - steps)
        return self.hist[self.cur]

    def forward(self, steps: int) -> str:
        self.cur = min(self.last, self.cur + steps)
        return self.hist[self.cur]
`,
    javascript: `var BrowserHistory = function(homepage) {
    this.hist = [homepage];
    this.cur = 0;
    this.last = 0;
};
BrowserHistory.prototype.visit = function(url) {
    this.cur++;
    if (this.cur < this.hist.length) this.hist[this.cur] = url;
    else this.hist.push(url);
    this.last = this.cur;
};
BrowserHistory.prototype.back = function(steps) {
    this.cur = Math.max(0, this.cur - steps);
    return this.hist[this.cur];
};
BrowserHistory.prototype.forward = function(steps) {
    this.cur = Math.min(this.last, this.cur + steps);
    return this.hist[this.cur];
};
`,
    java: `class BrowserHistory {
    List<String> hist = new ArrayList<>();
    int cur = 0, last = 0;
    public BrowserHistory(String homepage) {
        hist.add(homepage);
    }
    public void visit(String url) {
        cur++;
        if (cur < hist.size()) hist.set(cur, url);
        else hist.add(url);
        last = cur;
    }
    public String back(int steps) {
        cur = Math.max(0, cur - steps);
        return hist.get(cur);
    }
    public String forward(int steps) {
        cur = Math.min(last, cur + steps);
        return hist.get(cur);
    }
}
`,
    cpp: `class BrowserHistory {
public:
    vector<string> hist;
    int cur = 0, last = 0;
    BrowserHistory(string homepage) { hist.push_back(homepage); }
    void visit(string url) {
        cur++;
        if (cur < (int)hist.size()) hist[cur] = url;
        else hist.push_back(url);
        last = cur;
    }
    string back(int steps) {
        cur = max(0, cur - steps);
        return hist[cur];
    }
    string forward(int steps) {
        cur = min(last, cur + steps);
        return hist[cur];
    }
};
`,
  },
});

// ============================================================
// trapping-rain-water-ii
// ============================================================
add('trapping-rain-water-ii', {
  pattern: 'priority-queue-bfs-from-borders',
  hints: [
    'Water leaks out from the lowest point on the border. Start a BFS from all border cells, processing the lowest cell first (min-heap).',
    'When popping cell (i,j) with height h, visit unvisited neighbors. If neighbor height < h, it traps (h - neighborHeight) units; otherwise it traps 0. Push the neighbor with effective height max(h, neighborHeight).',
    'The trick: water can only escape over the lowest "wall" encountered so far. Pushing max(h, neighborHeight) propagates the binding wall height forward.',
    'Mark visited cells when popped to avoid re-processing. O(m*n*log(m*n)) time, O(m*n) space.',
  ],
  test_cases: [
    { inputs: ['[[1,4,3,1,3,2],[3,2,1,3,2,4],[2,3,3,2,3,1]]'], expected: '4' },
    { inputs: ['[[3,3,3,3,3],[3,2,2,2,3],[3,2,1,2,3],[3,2,2,2,3],[3,3,3,3,3]]'], expected: '10' },
    { inputs: ['[[1,1],[1,1]]'], expected: '0' },
    { inputs: ['[[1]]'], expected: '0' },
    { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '0' },
    { inputs: ['[[5,5,5,5],[5,1,1,5],[5,1,5,5],[5,2,5,8]]'], expected: '12' },
    { inputs: ['[[12,13,1,12],[13,4,13,12],[13,8,10,12],[12,13,12,12],[13,13,13,13]]'], expected: '14' },
    { inputs: ['[[9,9,9,9,9,9,8,9,9,9,9],[9,0,0,0,0,0,1,0,0,0,9],[9,0,0,0,0,0,0,0,0,0,9],[9,0,0,0,0,0,0,0,0,0,9],[9,9,9,9,9,9,9,9,9,9,9]]'], expected: '215' },
    { inputs: ['[[2,2,2],[2,1,2],[2,2,2]]'], expected: '1' },
    { inputs: ['[[10,10,10],[10,1,10],[10,10,10]]'], expected: '9' },
  ],
  editorial_md: ed(
    'In 1D trapping rain water, two pointers race inward from the lower wall side. In 2D, the analog is a BFS that always processes the lowest border height next, using a min-heap. Why border, why lowest? Because water leaks through the lowest point on the boundary first — any cell strictly interior is bounded by the minimum wall it sees on any escape path, and the BFS frontier expansion preserves that lowest-wall invariant.',
    'Push all border cells into a min-heap, keyed by cell height. Mark them visited.\n\nLoop: pop the cell with smallest height `h`. For each unvisited neighbor `(ni, nj)` with height `nh`:\n\n- The water level at the frontier is `h` (the binding wall).\n- If `nh < h`, the neighbor traps `h - nh` units of water — add to the running total.\n- Push `(ni, nj)` into the heap with effective height `max(h, nh)`. The `max` accounts for two cases: if the neighbor is shorter, its trapped water rises to `h`, so its effective wall height is `h`; if it\'s taller, its own height defines the new boundary.\n- Mark visited so it never re-enters the heap.\n\nWhy push `max(h, nh)`? Because future neighbors of this cell will see a wall at least as tall as `h` (any escape route must traverse the cell, and water cannot rise above the cell\'s rim plus what it can hold).\n\nThe BFS terminates when the heap empties — every interior cell is visited exactly once, charged O(log(m·n)) for the heap op.',
    'Time O(m·n·log(m·n)) — each cell enters the heap once, log factor for ordered extraction. Space O(m·n) for the visited grid and heap.',
    'Forgetting to mark visited *when popping* (not when pushing) allows duplicate pushes for the same cell with different heights, blowing up the heap. Pushing with the neighbor\'s raw height instead of `max(h, nh)` underestimates walls and double-counts water. Including interior cells in the initial frontier is wrong — only the border cells form the initial sea wall.'
  ),
  solutions: {
    python: `class Solution:
    def trapRainWater(self, heightMap):
        import heapq
        m, n = len(heightMap), len(heightMap[0])
        if m < 3 or n < 3:
            return 0
        visited = [[False] * n for _ in range(m)]
        heap = []
        for i in range(m):
            for j in range(n):
                if i == 0 or i == m - 1 or j == 0 or j == n - 1:
                    heapq.heappush(heap, (heightMap[i][j], i, j))
                    visited[i][j] = True
        total = 0
        dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        while heap:
            h, i, j = heapq.heappop(heap)
            for di, dj in dirs:
                ni, nj = i + di, j + dj
                if 0 <= ni < m and 0 <= nj < n and not visited[ni][nj]:
                    visited[ni][nj] = True
                    nh = heightMap[ni][nj]
                    if nh < h:
                        total += h - nh
                    heapq.heappush(heap, (max(h, nh), ni, nj))
        return total
`,
    javascript: `var trapRainWater = function(heightMap) {
    const m = heightMap.length, n = heightMap[0].length;
    if (m < 3 || n < 3) return 0;
    const visited = Array.from({length: m}, () => new Array(n).fill(false));
    // Simple binary min-heap
    const heap = [];
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const l = 2*i+1, r = 2*i+2;
                let s = i;
                if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
                if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
                if (s === i) break;
                [heap[s], heap[i]] = [heap[i], heap[s]];
                i = s;
            }
        }
        return top;
    };
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
        if (i === 0 || i === m-1 || j === 0 || j === n-1) {
            push([heightMap[i][j], i, j]);
            visited[i][j] = true;
        }
    }
    let total = 0;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (heap.length) {
        const [h, i, j] = pop();
        for (const [di, dj] of dirs) {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && ni < m && nj >= 0 && nj < n && !visited[ni][nj]) {
                visited[ni][nj] = true;
                const nh = heightMap[ni][nj];
                if (nh < h) total += h - nh;
                push([Math.max(h, nh), ni, nj]);
            }
        }
    }
    return total;
};
`,
    java: `class Solution {
    public int trapRainWater(int[][] heightMap) {
        int m = heightMap.length, n = heightMap[0].length;
        if (m < 3 || n < 3) return 0;
        boolean[][] visited = new boolean[m][n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (i == 0 || i == m-1 || j == 0 || j == n-1) {
                    heap.offer(new int[]{heightMap[i][j], i, j});
                    visited[i][j] = true;
                }
        int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};
        int total = 0;
        while (!heap.isEmpty()) {
            int[] cell = heap.poll();
            int h = cell[0], i = cell[1], j = cell[2];
            for (int[] d : dirs) {
                int ni = i + d[0], nj = j + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n && !visited[ni][nj]) {
                    visited[ni][nj] = true;
                    int nh = heightMap[ni][nj];
                    if (nh < h) total += h - nh;
                    heap.offer(new int[]{Math.max(h, nh), ni, nj});
                }
            }
        }
        return total;
    }
}
`,
    cpp: `class Solution {
public:
    int trapRainWater(vector<vector<int>>& heightMap) {
        int m = heightMap.size(), n = heightMap[0].size();
        if (m < 3 || n < 3) return 0;
        vector<vector<bool>> visited(m, vector<bool>(n, false));
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> heap;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (i == 0 || i == m-1 || j == 0 || j == n-1) {
                    heap.emplace(heightMap[i][j], i, j);
                    visited[i][j] = true;
                }
        int dirs[4][2] = {{-1,0},{1,0},{0,-1},{0,1}};
        int total = 0;
        while (!heap.empty()) {
            auto [h, i, j] = heap.top(); heap.pop();
            for (auto& d : dirs) {
                int ni = i + d[0], nj = j + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n && !visited[ni][nj]) {
                    visited[ni][nj] = true;
                    int nh = heightMap[ni][nj];
                    if (nh < h) total += h - nh;
                    heap.emplace(max(h, nh), ni, nj);
                }
            }
        }
        return total;
    }
};
`,
  },
});

// ============================================================
// time-to-inform
// ============================================================
add('time-to-inform', {
  pattern: 'tree-dfs-with-memo',
  hints: [
    'Build a manager → children map from the manager array. The headID is the root.',
    'DFS from any node returns the longest path-time to a leaf. From a manager, time = informTime[node] + max(child_path_time over children).',
    'Memoize per node to avoid recomputation. The answer is the max over all nodes\' depth-times, equivalently the DFS result starting from headID.',
    'BFS works too: level-order with cumulative time. Same O(n).',
  ],
  test_cases: [
    { inputs: ['1', '0', '[-1]', '[0]'], expected: '0' },
    { inputs: ['6', '2', '[2,2,-1,2,2,2]', '[0,0,1,0,0,0]'], expected: '1' },
    { inputs: ['4', '2', '[3,3,-1,2]', '[0,0,162,914]'], expected: '1076' },
    { inputs: ['7', '6', '[1,2,3,4,5,6,-1]', '[0,6,5,4,3,2,1]'], expected: '21' },
    { inputs: ['15', '0', '[-1,0,0,1,1,2,2,3,3,4,4,5,5,6,6]', '[1,1,1,1,1,1,1,0,0,0,0,0,0,0,0]'], expected: '3' },
    { inputs: ['11', '4', '[5,9,6,10,-1,8,9,1,9,3,4]', '[0,213,0,253,686,170,975,0,261,309,337]'], expected: '2560' },
    { inputs: ['2', '1', '[1,-1]', '[1,1]'], expected: '1' },
    { inputs: ['3', '0', '[-1,0,1]', '[5,3,0]'], expected: '8' },
    { inputs: ['5', '0', '[-1,0,0,0,0]', '[100,0,0,0,0]'], expected: '100' },
    { inputs: ['1', '0', '[-1]', '[100]'], expected: '0' },
  ],
  editorial_md: ed(
    'The org chart is a tree rooted at `headID`. Each manager-to-subordinate edge has weight `informTime[manager]` — the time it takes for that manager to inform their direct reports. The total time before the last employee knows is the longest root-to-leaf weighted path. DFS from the root, accumulating max child time, computes that directly.',
    'Build adjacency: `children[m]` is the list of direct reports of `m`. One pass over `manager`: for every `i` with `manager[i] != -1`, append `i` to `children[manager[i]]`.\n\nDFS from `headID`. The recurrence:\n\n```\ndfs(u) = 0 if children[u] is empty (leaf)\n       = informTime[u] + max(dfs(v) for v in children[u]) otherwise\n```\n\nReturn `dfs(headID)`. `informTime[u]` is added only at internal nodes — leaves take zero time to "inform themselves." The DFS recursion stack is bounded by tree height.\n\nIterative BFS equivalent: queue tuples `(node, time_when_informed)`. For each popped node, push children with `time_when_informed + informTime[node]`. Track the max time seen. Same complexity; useful if recursion depth is a worry.\n\nMemoization is not needed because the structure is a tree (each node has one parent), so no node is visited twice.',
    'Time O(n) — each node visited once during adjacency build and once during DFS/BFS. Space O(n) for the adjacency map and recursion / queue.',
    'Adding `informTime` at every node including leaves overcounts by one level — leaves take zero time. Building adjacency with the wrong direction (employee → manager) misses how the tree is traversed. Forgetting that `manager[headID] == -1` is the only sentinel can corrupt the tree if you accidentally add the head to its own children.'
  ),
  solutions: {
    python: `class Solution:
    def numOfMinutes(self, n, headID, manager, informTime):
        children = [[] for _ in range(n)]
        for i, m in enumerate(manager):
            if m != -1:
                children[m].append(i)
        def dfs(u):
            if not children[u]:
                return 0
            best = 0
            for v in children[u]:
                t = dfs(v)
                if t > best:
                    best = t
            return informTime[u] + best
        return dfs(headID)
`,
    javascript: `var numOfMinutes = function(n, headID, manager, informTime) {
    const children = Array.from({length: n}, () => []);
    for (let i = 0; i < n; i++) if (manager[i] !== -1) children[manager[i]].push(i);
    const dfs = (u) => {
        if (children[u].length === 0) return 0;
        let best = 0;
        for (const v of children[u]) {
            const t = dfs(v);
            if (t > best) best = t;
        }
        return informTime[u] + best;
    };
    return dfs(headID);
};
`,
    java: `class Solution {
    int[] informTime;
    List<List<Integer>> children;
    public int numOfMinutes(int n, int headID, int[] manager, int[] informTime) {
        this.informTime = informTime;
        children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        for (int i = 0; i < n; i++) if (manager[i] != -1) children.get(manager[i]).add(i);
        return dfs(headID);
    }
    int dfs(int u) {
        if (children.get(u).isEmpty()) return 0;
        int best = 0;
        for (int v : children.get(u)) best = Math.max(best, dfs(v));
        return informTime[u] + best;
    }
}
`,
    cpp: `class Solution {
public:
    vector<int> informT;
    vector<vector<int>> children;
    int dfs(int u) {
        if (children[u].empty()) return 0;
        int best = 0;
        for (int v : children[u]) best = max(best, dfs(v));
        return informT[u] + best;
    }
    int numOfMinutes(int n, int headID, vector<int>& manager, vector<int>& informTime) {
        informT = informTime;
        children.assign(n, {});
        for (int i = 0; i < n; i++) if (manager[i] != -1) children[manager[i]].push_back(i);
        return dfs(headID);
    }
};
`,
  },
});

// ============================================================
// zigzag-conversion
// ============================================================
add('zigzag-conversion', {
  hints: [
    'Edge case: numRows == 1 or numRows >= len(s) — output equals input.',
    'For each row, derive characters by walking the string with two index strides. Row r is hit at positions r, r + cycle, r + cycle + (cycle - 2r), etc., where cycle = 2*(numRows - 1).',
    'Simpler: simulate. Maintain numRows string builders. Walk through s, tracking the current row and a direction (+1 going down, -1 going up). Flip direction at top and bottom rows.',
    'Concatenate the row builders to produce the result.',
  ],
  test_cases: [
    { inputs: ['"PAYPALISHIRING"', '3'], expected: '"PAHNAPLSIIGYIR"' },
    { inputs: ['"PAYPALISHIRING"', '4'], expected: '"PINALSIGYAHRPI"' },
    { inputs: ['"A"', '1'], expected: '"A"' },
    { inputs: ['"AB"', '1'], expected: '"AB"' },
    { inputs: ['"ABC"', '2'], expected: '"ACB"' },
    { inputs: ['"ABCD"', '2'], expected: '"ACBD"' },
    { inputs: ['"ABCDE"', '4'], expected: '"ABCED"' },
    { inputs: ['"ABCDEFGHIJ"', '5'], expected: '"AIBHJCGDFE"' },
    { inputs: ['"ABCDEF"', '6'], expected: '"ABCDEF"' },
    { inputs: ['"HELLOWORLD"', '3'], expected: '"HOLELWRDLO"' },
    { inputs: ['"PROGRAMMING"', '2'], expected: '"POPMIGRRAMN"' },
  ],
  editorial_md: ed(
    'The zigzag layout fills cells in a snake pattern: down one column, then diagonally up the next, then down again. The simplest way to produce the row-major output is to simulate the snake on `numRows` builders, tracking which row each input character lands in. There\'s also a closed-form per-row stride trick, but simulation reads cleaner and is just as fast.',
    'Handle the degenerate cases first: if `numRows == 1` or `numRows >= len(s)`, the layout is a single row or column, so the answer is `s` itself.\n\nOtherwise create `numRows` empty string builders. Walk `s` with two state variables: `row` (the current row index, starting at 0) and `step` (the direction, +1 or -1, starting at +1). For each character:\n\n1. Append it to `rows[row]`.\n2. If `row == 0`, set `step = +1`. If `row == numRows - 1`, set `step = -1`.\n3. Update `row += step`.\n\nThe direction flip at the top and bottom rows produces the zigzag bounce. After the walk, concatenate the row builders to get the answer.\n\nClosed-form variant: row `r` (for `0 < r < numRows - 1`) has characters at positions `r`, `r + (cycle - 2r)`, `r + cycle`, `r + (2 cycle - 2r)`, ..., where `cycle = 2 * (numRows - 1)`. Top and bottom rows have only the `cycle`-stride positions. Both halves alternate. Slightly faster (no per-char branching) but more bug-prone.',
    'Time O(n) — each character visited and appended once. Space O(n) for the row builders / output string.',
    'Forgetting to handle `numRows == 1` causes a divide-by-zero on the cycle formula or an infinite bounce in the simulator. Flipping direction *before* appending the character writes to the wrong row. Off-by-one on `numRows - 1` as the bottom-row index is the second-most-common mistake.'
  ),
  solutions: {
    python: `class Solution:
    def convert(self, s, numRows):
        if numRows == 1 or numRows >= len(s):
            return s
        rows = [[] for _ in range(numRows)]
        row, step = 0, 1
        for ch in s:
            rows[row].append(ch)
            if row == 0:
                step = 1
            elif row == numRows - 1:
                step = -1
            row += step
        return "".join("".join(r) for r in rows)
`,
    javascript: `var convert = function(s, numRows) {
    if (numRows === 1 || numRows >= s.length) return s;
    const rows = Array.from({length: numRows}, () => []);
    let row = 0, step = 1;
    for (const ch of s) {
        rows[row].push(ch);
        if (row === 0) step = 1;
        else if (row === numRows - 1) step = -1;
        row += step;
    }
    return rows.map(r => r.join("")).join("");
};
`,
    java: `class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) return s;
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();
        int row = 0, step = 1;
        for (char ch : s.toCharArray()) {
            rows[row].append(ch);
            if (row == 0) step = 1;
            else if (row == numRows - 1) step = -1;
            row += step;
        }
        StringBuilder out = new StringBuilder();
        for (StringBuilder r : rows) out.append(r);
        return out.toString();
    }
}
`,
    cpp: `class Solution {
public:
    string convert(string s, int numRows) {
        if (numRows == 1 || numRows >= (int)s.size()) return s;
        vector<string> rows(numRows);
        int row = 0, step = 1;
        for (char ch : s) {
            rows[row].push_back(ch);
            if (row == 0) step = 1;
            else if (row == numRows - 1) step = -1;
            row += step;
        }
        string out;
        for (auto& r : rows) out += r;
        return out;
    }
};
`,
  },
});

// ============================================================
// product-of-array-except-self
// ============================================================
add('product-of-array-except-self', {
  hints: [
    'You cannot use division (per problem). Output[i] is the product of everything to the left of i times the product of everything to the right of i.',
    'Two passes: first pass builds left-prefix products into the answer array. Second pass walks right-to-left, multiplying in the running right-suffix product.',
    'O(n) time, O(1) extra space (the output array doesn\'t count).',
    'Avoid the temptation to compute total product and divide — fails on arrays with zeros.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,4]'], expected: '[24,12,8,6]' },
    { inputs: ['[-1,1,0,-3,3]'], expected: '[0,0,9,0,0]' },
    { inputs: ['[2,3,4,5]'], expected: '[60,40,30,24]' },
    { inputs: ['[1,1,1,1]'], expected: '[1,1,1,1]' },
    { inputs: ['[5]'], expected: '[1]' },
    { inputs: ['[3,7]'], expected: '[7,3]' },
    { inputs: ['[0,0]'], expected: '[0,0]' },
    { inputs: ['[1,0]'], expected: '[0,1]' },
    { inputs: ['[0,1,2,3]'], expected: '[6,0,0,0]' },
    { inputs: ['[2,2,2,2,2]'], expected: '[16,16,16,16,16]' },
    { inputs: ['[-1,-1,-1,-1]'], expected: '[-1,-1,-1,-1]' },
    { inputs: ['[10,3,5,6,2]'], expected: '[180,600,360,300,900]' },
  ],
  editorial_md: ed(
    'For each index `i`, the answer is `(product of nums[0..i-1]) * (product of nums[i+1..n-1])`. Computed naively in O(n^2) by skipping `i` for each `i`. The optimization splits that into two linear sweeps: one accumulating left prefixes, one accumulating right suffixes, with the output array doubling as scratch space to avoid extra memory.',
    'Pass 1 (left prefix): walk left-to-right, maintaining a running product `left = 1`. Write `out[i] = left`, then update `left *= nums[i]`. After this pass, `out[i]` holds the product of every element strictly to the left of `i`.\n\nPass 2 (right suffix): walk right-to-left, maintaining a running product `right = 1`. Multiply `out[i] *= right`, then update `right *= nums[i]`. The `out[i]` slot now combines the left prefix already stored there with the right suffix just folded in.\n\nFinal `out[i]` = (product of left of i) × (product of right of i) = total product / nums[i] — but without ever dividing, so zeros in the input behave correctly. A single zero in the input pins every other output to zero except at the zero\'s own index.\n\nThe output array does not count toward the auxiliary space bound, so this is officially O(1) extra space.',
    'Time O(n) — two linear passes. Space O(1) extra (the output array is required by the contract and not counted).',
    'Using division (`total / nums[i]`) fails when an entry is zero — the total becomes zero, and you can\'t recover the per-index answer. Allocating separate `left[]` and `right[]` arrays wastes memory and misses the in-place trick. Off-by-one on the prefix update order: write `out[i]` *before* multiplying `left *= nums[i]`, otherwise you include the current element in your own prefix.'
  ),
  solutions: {
    python: `class Solution:
    def productExceptSelf(self, nums):
        n = len(nums)
        out = [1] * n
        left = 1
        for i in range(n):
            out[i] = left
            left *= nums[i]
        right = 1
        for i in range(n - 1, -1, -1):
            out[i] *= right
            right *= nums[i]
        return out
`,
    javascript: `var productExceptSelf = function(nums) {
    const n = nums.length;
    const out = new Array(n).fill(1);
    let left = 1;
    for (let i = 0; i < n; i++) {
        out[i] = left;
        left *= nums[i];
    }
    let right = 1;
    for (let i = n - 1; i >= 0; i--) {
        out[i] *= right;
        right *= nums[i];
    }
    return out;
};
`,
    java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];
        int left = 1;
        for (int i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
        return out;
    }
}
`,
    cpp: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n, 1);
        int left = 1;
        for (int i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
        return out;
    }
};
`,
  },
});

// ============================================================
// 3sum
// ============================================================
add('3sum', {
  hints: [
    'Sort first. Then for each index i, two-pointer search the rest for pairs (l, r) with nums[l] + nums[r] = -nums[i].',
    'Skip duplicates at the i loop and inside the two-pointer loop to avoid emitting the same triplet twice.',
    'Sorting is O(n log n); the per-i two-pointer is O(n), so total O(n^2).',
    'Early termination: if nums[i] > 0, no triplet can sum to zero past this point.',
    'Use a tuple/sorted-triplet key in a set as a safety net for duplicate triplets if your skip-logic feels brittle.',
  ],
  test_cases: [
    { inputs: ['[-1,0,1,2,-1,-4]'], expected: '[[-1,-1,2],[-1,0,1]]' },
    { inputs: ['[0,0,0]'], expected: '[[0,0,0]]' },
    { inputs: ['[1,2,-2,-1]'], expected: '[]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[0]'], expected: '[]' },
    { inputs: ['[0,0]'], expected: '[]' },
    { inputs: ['[0,0,0,0]'], expected: '[[0,0,0]]' },
    { inputs: ['[-2,0,1,1,2]'], expected: '[[-2,0,2],[-2,1,1]]' },
    { inputs: ['[1,2,3]'], expected: '[]' },
    { inputs: ['[-1,-1,-1,2,2]'], expected: '[[-1,-1,2]]' },
    { inputs: ['[3,-1,-7,1,5,-2]'], expected: '[[-7,2,5],[-2,-1,3]]' },
  ],
  editorial_md: ed(
    'Brute force checks all triplets in O(n^3). The reduction: fix the smallest of the three values (call it `nums[i]`), then the remaining problem is "find two values to the right of i that sum to `-nums[i]`" — classic two-sum on a sorted suffix, solvable in O(n) with left/right pointers. Total O(n^2). Sorting also makes duplicate suppression a one-line skip on equal consecutive values.',
    'Sort the array. Iterate `i` from `0` to `n - 3`:\n\n1. If `nums[i] > 0`, break — all remaining values are positive, can\'t sum to zero with a fixed positive `nums[i]`.\n2. If `i > 0` and `nums[i] == nums[i-1]`, skip — same first element as previous iteration would re-emit the same triplet.\n3. Two-pointer the suffix: `l = i + 1`, `r = n - 1`. Compute `sum = nums[i] + nums[l] + nums[r]`.\n   - If `sum < 0`, increment `l` (need larger).\n   - If `sum > 0`, decrement `r` (need smaller).\n   - If `sum == 0`, record `[nums[i], nums[l], nums[r]]`, then advance `l` past any equal duplicates and `r` past any equal duplicates, then `l++; r--`.\n\nThe inside-loop dedup handles cases like `[-2, 0, 0, 2, 2]` where the same triplet could be hit by multiple pointer positions. The outer dedup handles repeated `nums[i]`. Together they guarantee each unique triplet appears exactly once without needing a hash set.',
    'Time O(n^2) — O(n log n) sort plus n iterations of O(n) two-pointer. Space O(1) auxiliary (or O(n) if you count the output, which is unavoidable).',
    'Skipping duplicates only on the outer loop misses cases where the inner two pointers land on equal values. Forgetting the `nums[i] > 0` early break still works but wastes work. Using a hash-set for dedup is slow when results are large because triplet hashing isn\'t free.'
  ),
  solutions: {
    python: `class Solution:
    def threeSum(self, nums):
        nums.sort()
        n = len(nums)
        res = []
        for i in range(n - 2):
            if nums[i] > 0:
                break
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            l, r = i + 1, n - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l + 1]:
                        l += 1
                    while l < r and nums[r] == nums[r - 1]:
                        r -= 1
                    l += 1
                    r -= 1
        return res
`,
    javascript: `var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const n = nums.length;
    const res = [];
    for (let i = 0; i < n - 2; i++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = n - 1;
        while (l < r) {
            const s = nums[i] + nums[l] + nums[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            }
        }
    }
    return res;
};
`,
    java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        int n = nums.length;
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s < 0) l++;
                else if (s > 0) r--;
                else {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                }
            }
        }
        return res;
    }
}
`,
    cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        vector<vector<int>> res;
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s < 0) l++;
                else if (s > 0) r--;
                else {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                }
            }
        }
        return res;
    }
};
`,
  },
});

// ============================================================
// robot-bounded-in-circle
// ============================================================
add('robot-bounded-in-circle', {
  hints: [
    'Simulate one full pass through the instructions. Track position (x, y) and facing direction.',
    'After one pass, the robot is bounded iff it returns to origin OR its facing direction changed.',
    'If facing changed (any non-North direction), after at most 4 passes it returns to origin — bounded.',
    'If facing is still North but position isn\'t origin, the robot drifts in a straight line forever — unbounded.',
  ],
  test_cases: [
    { inputs: ['"GGLLGG"'], expected: 'true' },
    { inputs: ['"GG"'], expected: 'false' },
    { inputs: ['"GL"'], expected: 'true' },
    { inputs: ['"L"'], expected: 'true' },
    { inputs: ['"R"'], expected: 'true' },
    { inputs: ['"G"'], expected: 'false' },
    { inputs: ['"LL"'], expected: 'true' },
    { inputs: ['"RR"'], expected: 'true' },
    { inputs: ['"GLGLGGLGL"'], expected: 'false' },
    { inputs: ['"GLRLLGLL"'], expected: 'true' },
    { inputs: ['"GLGLGLG"'], expected: 'true' },
  ],
  editorial_md: ed(
    'A robot is bounded if-and-only-if after some number of full repetitions of the instructions it returns to a state it has visited before. The clever observation: a state is `(position, direction)`. After one full pass, either (a) the robot returned to the origin — bounded; or (b) its facing direction is not North — repeating four (or two) more passes will cycle through the rotated translation vector summing to zero, also bounded; or (c) it ended at non-origin still facing North — every subsequent pass adds the same displacement, drifting to infinity — unbounded.',
    'Simulate one pass.\n\n- Start at `(0, 0)` facing North. Encode direction as an index `0..3` for N/E/S/W with corresponding `(dx, dy)` lookups.\n- For each character `c` in `instructions`:\n  - `G`: move one unit in the current direction.\n  - `L`: rotate direction one step counter-clockwise: `dir = (dir + 3) % 4`.\n  - `R`: rotate clockwise: `dir = (dir + 1) % 4`.\n\nAfter the loop, check:\n- If `(x, y) == (0, 0)`: bounded (returned home in one pass).\n- If `dir != 0` (not facing North): bounded — after at most four passes, the rotational symmetry forces the robot back to origin.\n- Otherwise (`(x,y) != origin and dir == North`): unbounded — the next pass adds the same displacement again, indefinitely.\n\nReturn `(x, y) == (0, 0) || dir != 0`.\n\nThe key mathematical fact: if the per-pass net rotation is nonzero, repeating the pass `k` times (where `k = order of rotation` ∈ {2, 4}) gives total rotation zero, and the total displacement vector is the sum of `k` rotated copies of the per-pass displacement, which by rotational symmetry equals zero.',
    'Time O(n) where n is `len(instructions)` — a single simulation pass. Space O(1) — constant state.',
    'Computing `(dir - 1) % 4` for `L` in languages where `%` returns negative for negative operands (JavaScript, Java, C++) breaks the rotation — use `+3 % 4` instead. Forgetting the "facing North + non-origin = unbounded" case lets the function return `true` always. Simulating multiple passes is unnecessary and risks integer overflow on `x, y` if you go too far.'
  ),
  solutions: {
    python: `class Solution:
    def isRobotBounded(self, instructions):
        dirs = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        x = y = 0
        d = 0
        for c in instructions:
            if c == 'G':
                x += dirs[d][0]
                y += dirs[d][1]
            elif c == 'L':
                d = (d + 3) % 4
            else:
                d = (d + 1) % 4
        return (x == 0 and y == 0) or d != 0
`,
    javascript: `var isRobotBounded = function(instructions) {
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    let x = 0, y = 0, d = 0;
    for (const c of instructions) {
        if (c === 'G') { x += dirs[d][0]; y += dirs[d][1]; }
        else if (c === 'L') d = (d + 3) % 4;
        else d = (d + 1) % 4;
    }
    return (x === 0 && y === 0) || d !== 0;
};
`,
    java: `class Solution {
    public boolean isRobotBounded(String instructions) {
        int[][] dirs = {{0,1},{1,0},{0,-1},{-1,0}};
        int x = 0, y = 0, d = 0;
        for (char c : instructions.toCharArray()) {
            if (c == 'G') { x += dirs[d][0]; y += dirs[d][1]; }
            else if (c == 'L') d = (d + 3) % 4;
            else d = (d + 1) % 4;
        }
        return (x == 0 && y == 0) || d != 0;
    }
}
`,
    cpp: `class Solution {
public:
    bool isRobotBounded(string instructions) {
        int dirs[4][2] = {{0,1},{1,0},{0,-1},{-1,0}};
        int x = 0, y = 0, d = 0;
        for (char c : instructions) {
            if (c == 'G') { x += dirs[d][0]; y += dirs[d][1]; }
            else if (c == 'L') d = (d + 3) % 4;
            else d = (d + 1) % 4;
        }
        return (x == 0 && y == 0) || d != 0;
    }
};
`,
  },
});

// ============================================================
// palindrome-linked-list
// ============================================================
add('palindrome-linked-list', {
  hints: [
    'O(1)-space approach: find the middle (slow/fast pointers), reverse the second half in place, walk both halves comparing.',
    'O(n)-space fallback: copy values to an array, compare with two pointers.',
    'Restore the second half after comparison if the input mustn\'t be mutated.',
    'Handle even and odd lengths uniformly — when fast hits the end (or fast.next is null), slow is at the second-half start.',
    'Edge cases: empty list and single node are trivially palindromes.',
  ],
  test_cases: [
    { inputs: ['[1,2,2,1]'], expected: 'true' },
    { inputs: ['[1,2]'], expected: 'false' },
    { inputs: ['[1]'], expected: 'true' },
    { inputs: ['[]'], expected: 'true' },
    { inputs: ['[1,1]'], expected: 'true' },
    { inputs: ['[1,2,1]'], expected: 'true' },
    { inputs: ['[1,2,3,2,1]'], expected: 'true' },
    { inputs: ['[1,2,3,4,5]'], expected: 'false' },
    { inputs: ['[1,2,3,3,2,1]'], expected: 'true' },
    { inputs: ['[1,0,1]'], expected: 'true' },
    { inputs: ['[1,0,0]'], expected: 'false' },
    { inputs: ['[9,9,9,9]'], expected: 'true' },
  ],
  editorial_md: ed(
    'The cheap solution is "copy values to an array, two-pointer compare" — clean, O(n) space. The interesting solution is "reverse the second half in place, walk both halves" — same time, O(1) extra space. The reverse-half technique uses the slow/fast pointer to find the midpoint without knowing the length up front, then reverses from there.',
    'Find the midpoint with slow/fast pointers: `slow` advances one step, `fast` two. When `fast` is null (even length) or `fast.next` is null (odd length), `slow` is at the start of the second half (or just past the middle).\n\nReverse the second half: standard `prev = null; cur = slow; while cur: nxt = cur.next; cur.next = prev; prev = cur; cur = nxt`. `prev` is now the head of the reversed second half.\n\nWalk both halves: `p = head; q = prev`. While `q` is non-null (the reversed half is the shorter one when length is odd), compare `p.val == q.val`. Any mismatch returns `false`. If we reach the end, it\'s a palindrome.\n\nOptionally restore the second half to leave the input unchanged — reverse it again starting from `prev`. Many interviewers care about this; production code certainly does.\n\nEdge cases: an empty list and a single node are vacuously palindromes; return `true` without traversal.',
    'Time O(n) — one pass to find the middle, one pass to reverse, one pass to compare. Space O(1) for the in-place reversal approach, O(n) for the value-copy approach.',
    'Comparing past the middle (going one step too far) reads garbage in the reversed-half loop — stop when `q` becomes null, not when `p` reaches the end. Forgetting to handle odd length specifically: the slow pointer ends one position later than for even length, but the comparison loop\'s "stop when q == null" handles both uniformly. Reversing the whole list and comparing to the original duplicates work and uses O(n) space anyway.'
  ),
  solutions: {
    python: `class Solution:
    def isPalindrome(self, head):
        if not head or not head.next:
            return True
        # find middle
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        # reverse second half
        prev = None
        cur = slow
        while cur:
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
        # compare
        p, q = head, prev
        while q:
            if p.val != q.val:
                return False
            p = p.next
            q = q.next
        return True
`,
    javascript: `var isPalindrome = function(head) {
    if (!head || !head.next) return true;
    let slow = head, fast = head;
    while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
    let prev = null, cur = slow;
    while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
    let p = head, q = prev;
    while (q) {
        if (p.val !== q.val) return false;
        p = p.next;
        q = q.next;
    }
    return true;
};
`,
    java: `class Solution {
    public boolean isPalindrome(ListNode head) {
        if (head == null || head.next == null) return true;
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode prev = null, cur = slow;
        while (cur != null) { ListNode nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
        ListNode p = head, q = prev;
        while (q != null) {
            if (p.val != q.val) return false;
            p = p.next;
            q = q.next;
        }
        return true;
    }
}
`,
    cpp: `class Solution {
public:
    bool isPalindrome(ListNode* head) {
        if (!head || !head->next) return true;
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        ListNode *prev = nullptr, *cur = slow;
        while (cur) { ListNode* nxt = cur->next; cur->next = prev; prev = cur; cur = nxt; }
        ListNode *p = head, *q = prev;
        while (q) {
            if (p->val != q->val) return false;
            p = p->next;
            q = q->next;
        }
        return true;
    }
};
`,
  },
});

// ============================================================
// koko-eating-bananas
// ============================================================
add('koko-eating-bananas', {
  hints: [
    'The answer is monotone in k: if speed k works, every speed > k also works. Binary-search the smallest k that works.',
    'Search range: lo = 1, hi = max(piles). At any speed >= max, each pile takes one hour.',
    'For speed k, hours = sum(ceil(p / k)) over piles. Pile p contributes (p + k - 1) // k hours.',
    'If hours <= h, k is feasible — try smaller. Otherwise, increase k.',
    'O(n log(max(piles))) — n per feasibility check, log over the speed range.',
  ],
  test_cases: [
    { inputs: ['[3,6,7,11]', '8'], expected: '4' },
    { inputs: ['[30,11,23,4,20]', '5'], expected: '30' },
    { inputs: ['[30,11,23,4,20]', '6'], expected: '23' },
    { inputs: ['[1]', '1'], expected: '1' },
    { inputs: ['[1000000000]', '2'], expected: '500000000' },
    { inputs: ['[312884470]', '312884469'], expected: '2' },
    { inputs: ['[3,6,7,11]', '11'], expected: '3' },
    { inputs: ['[1,1,1,999999999]', '10'], expected: '142857143' },
    { inputs: ['[100,200,300,400]', '4'], expected: '400' },
    { inputs: ['[5,5,5,5]', '20'], expected: '1' },
    { inputs: ['[805306368,805306368,805306368]', '1000000000'], expected: '3' },
  ],
  editorial_md: ed(
    'Eating speed is monotone with respect to feasibility: if Koko can finish at speed `k`, she can also finish at every speed `> k`. The question "smallest k such that it works" is therefore a binary search on `k`. The feasibility check is `O(n)`: compute total hours at speed `k` and compare to `h`.',
    'Binary search on `k` in the range `[1, max(piles)]`. At `k = max(piles)`, each pile takes exactly one hour (one bite of size `max` consumes the whole pile), so `n` hours total — guaranteed feasible when `h >= n`. Lower bound is `1`.\n\nFeasibility function: hours required at speed `k` is `sum(ceil(p / k))` over `piles`. Use the integer-only form `(p + k - 1) // k` to avoid floating point. If the total `<= h`, the speed works.\n\nStandard lower-bound binary search:\n\n```\nlo, hi = 1, max(piles)\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if hours(mid) <= h: hi = mid\n    else: lo = mid + 1\nreturn lo\n```\n\nThe loop converges to the smallest feasible speed. Because the predicate is monotone, no second-pass verification is needed.\n\nWhy not search `[1, sum(piles)]`? That works too but wastes log factor — Koko never benefits from speed above `max(piles)` since she only eats one pile per hour.',
    'Time O(n · log(max(piles))). Space O(1).',
    'Using floating-point `math.ceil(p / k)` introduces precision errors at large values — stick to integer `(p + k - 1) // k`. Initializing `hi = sum(piles)` is correct but inefficient. The off-by-one classic: starting `lo = 0` causes a divide-by-zero in the feasibility check.'
  ),
  solutions: {
    python: `class Solution:
    def minEatingSpeed(self, piles, h):
        lo, hi = 1, max(piles)
        def hours(k):
            t = 0
            for p in piles:
                t += (p + k - 1) // k
            return t
        while lo < hi:
            mid = (lo + hi) // 2
            if hours(mid) <= h:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    javascript: `var minEatingSpeed = function(piles, h) {
    let lo = 1, hi = 0;
    for (const p of piles) if (p > hi) hi = p;
    const hours = (k) => {
        let t = 0;
        for (const p of piles) t += Math.ceil(p / k);
        return t;
    };
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (hours(mid) <= h) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};
`,
    java: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) if (p > hi) hi = p;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long t = 0;
            for (int p : piles) t += (p + mid - 1) / mid;
            if (t <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
`,
    cpp: `class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long long t = 0;
            for (int p : piles) t += (p + mid - 1) / mid;
            if (t <= (long long)h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
  },
});

// ============================================================
// first-missing-positive
// ============================================================
add('first-missing-positive', {
  hints: [
    'Answer is in [1, n+1]. Anything outside that range is irrelevant.',
    'Cyclic sort: place value v at index v-1 (if 1 <= v <= n). Swap until either v is out of range or already in place.',
    'Second pass: find the first index i where nums[i] != i+1. Answer is i+1.',
    'If every position is correct, answer is n+1.',
    'O(n) time, O(1) space. Each value is swapped at most once into its correct slot.',
  ],
  test_cases: [
    { inputs: ['[1,2,0]'], expected: '3' },
    { inputs: ['[3,4,-1,1]'], expected: '2' },
    { inputs: ['[7,8,9,11,12]'], expected: '1' },
    { inputs: ['[1]'], expected: '2' },
    { inputs: ['[2]'], expected: '1' },
    { inputs: ['[1,2,3]'], expected: '4' },
    { inputs: ['[0,0,0]'], expected: '1' },
    { inputs: ['[-1,-2,-3]'], expected: '1' },
    { inputs: ['[2,1]'], expected: '3' },
    { inputs: ['[1,1,1,1]'], expected: '2' },
    { inputs: ['[1,2,2,2]'], expected: '3' },
    { inputs: ['[3,2,1,5,4]'], expected: '6' },
  ],
  editorial_md: ed(
    'With `n` slots, the first missing positive must be one of `1, 2, ..., n+1`. Anything bigger or non-positive cannot be the answer. That bound lets us treat the array itself as a hash map: position `i` "should hold" value `i + 1`. After placing every in-range value where it belongs, the first index whose contents don\'t match is the answer.',
    'Cyclic sort phase. Walk `i` from `0` to `n - 1`. While the value at `i` is in `[1, n]` and not already in its correct slot (i.e., `nums[nums[i] - 1] != nums[i]`), swap `nums[i]` with `nums[nums[i] - 1]`. The inner loop runs until `nums[i]` is either out of range or already where it belongs. Each value is swapped at most once into its home slot, so amortized O(1) per `i`, total O(n).\n\nThe duplicate-check (`nums[nums[i] - 1] != nums[i]` rather than `nums[i] - 1 != i`) avoids infinite swapping when there are duplicates: if the destination already holds the same value, leave the current slot alone.\n\nScan phase. Walk `i` from `0`: the first `i` where `nums[i] != i + 1` gives the answer `i + 1`. If every index passes the check, every value `1..n` is present, so the answer is `n + 1`.\n\nWhy O(1) extra space matters: a hash set solution is trivial but uses O(n) memory; cyclic sort uses none beyond the input array.',
    'Time O(n) — each value swapped at most once into its home plus a final linear scan. Space O(1) — purely in-place.',
    'Swapping using `nums[i] - 1 != i` as the termination condition breaks with duplicates: two equal values that both want the same destination loop forever. Skipping the swap loop on the first out-of-range value (instead of continuing past it) leaves later valid swaps undone. Starting positions at index 1 instead of 0 is the classic off-by-one — the answer maps `0 → 1`.'
  ),
  solutions: {
    python: `class Solution:
    def firstMissingPositive(self, nums):
        n = len(nums)
        for i in range(n):
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                j = nums[i] - 1
                nums[i], nums[j] = nums[j], nums[i]
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1
`,
    javascript: `var firstMissingPositive = function(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const j = nums[i] - 1;
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
    }
    for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1;
    return n + 1;
};
`,
    java: `class Solution {
    public int firstMissingPositive(int[] nums) {
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                int j = nums[i] - 1;
                int tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp;
            }
        }
        for (int i = 0; i < n; i++) if (nums[i] != i + 1) return i + 1;
        return n + 1;
    }
}
`,
    cpp: `class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        int n = nums.size();
        for (int i = 0; i < n; i++) {
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                swap(nums[i], nums[nums[i] - 1]);
            }
        }
        for (int i = 0; i < n; i++) if (nums[i] != i + 1) return i + 1;
        return n + 1;
    }
};
`,
  },
});

// ============================================================
// max-points-on-a-line
// ============================================================
add('max-points-on-a-line', {
  hints: [
    'For each anchor point i, count how many other points share the same slope through i. Max over anchors + 1 is the answer.',
    'Use a hashmap keyed by (dy, dx) reduced to lowest terms (divide by gcd). Normalize the sign so that (dy, dx) and (-dy, -dx) hash the same.',
    'Vertical lines: dx = 0 — pick a canonical key like (1, 0).',
    'Edge case: duplicate points. Handle by counting duplicates per anchor and adding them to every slope count.',
    'O(n^2) time, O(n) space.',
  ],
  test_cases: [
    { inputs: ['[[1,1],[2,2],[3,3]]'], expected: '3' },
    { inputs: ['[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]'], expected: '4' },
    { inputs: ['[[0,0]]'], expected: '1' },
    { inputs: ['[[0,0],[1,1]]'], expected: '2' },
    { inputs: ['[[1,1],[1,1],[1,1]]'], expected: '3' },
    { inputs: ['[[0,0],[1,1],[0,0]]'], expected: '3' },
    { inputs: ['[[1,1],[2,2],[3,3],[4,4],[5,5]]'], expected: '5' },
    { inputs: ['[[0,0],[0,1],[0,2],[0,3]]'], expected: '4' },
    { inputs: ['[[1,1],[2,2],[3,1],[4,2]]'], expected: '2' },
    { inputs: ['[[4,5],[4,-1],[4,0]]'], expected: '3' },
    { inputs: ['[[0,9],[138,429],[115,359],[115,359],[-30,-102],[230,709],[-150,-686],[-135,-613],[-60,-248],[-161,-481],[207,639],[23,79],[-230,-691],[-115,-358],[3,12],[-3,-9],[-345,-1035],[-184,-551],[-174,-523],[-49,-161],[-69,-225]]'], expected: '12' },
  ],
  editorial_md: ed(
    'Two points always define exactly one line. To find the line with the most points, fix an anchor and group every other point by its slope through the anchor. The maximum group size plus one (the anchor itself) is a candidate; take the max over all anchors. The trick is representing slopes without floating-point error: use the reduced `(dy, dx)` pair with a canonical sign.',
    'For each anchor `i`:\n\n1. Initialize a hashmap from slope-key to count.\n2. Track `duplicates` = points identical to anchor (slope undefined).\n3. For each other point `j`:\n   - Compute `dy = y_j - y_i`, `dx = x_j - x_i`.\n   - If both are zero, increment `duplicates` and continue.\n   - Otherwise compute `g = gcd(|dy|, |dx|)`, then `dy /= g`, `dx /= g`.\n   - Canonicalize the sign so collinear-but-flipped vectors map to the same key. Convention: ensure `dx > 0`, or if `dx == 0`, ensure `dy > 0`. Negate both if needed.\n   - Increment `hashmap[(dy, dx)]`.\n4. The anchor\'s best line has `max(hashmap.values()) + duplicates + 1` points (the +1 is the anchor itself).\n\nMaximize across all anchors. Special-case the empty input (return 0) and the singleton (return 1).\n\nWhy gcd reduction? Using the raw float slope `dy / dx` accumulates floating-point error and treats `(2, 4)` and `(1, 2)` as different keys due to noise. The integer-pair representation is exact and hashes cleanly.',
    'Time O(n^2) — n anchors, each with O(n) work plus an O(log V) gcd per neighbor. Space O(n) for the per-anchor hashmap, reused per outer iteration.',
    'Hashing the float slope causes incorrect groupings due to floating-point error. Forgetting to normalize the sign of `(dy, dx)` splits one line into two keys when neighbors lie on both sides. Treating duplicate points as a separate "line" instead of folding them into every anchor\'s count undercounts the maximum.'
  ),
  solutions: {
    python: `class Solution:
    def maxPoints(self, points):
        from math import gcd
        n = len(points)
        if n <= 2:
            return n
        best = 0
        for i in range(n):
            slopes = {}
            dups = 0
            local = 0
            for j in range(n):
                if j == i:
                    continue
                dy = points[j][1] - points[i][1]
                dx = points[j][0] - points[i][0]
                if dy == 0 and dx == 0:
                    dups += 1
                    continue
                g = gcd(abs(dy), abs(dx))
                dy //= g
                dx //= g
                if dx < 0 or (dx == 0 and dy < 0):
                    dy = -dy
                    dx = -dx
                key = (dy, dx)
                slopes[key] = slopes.get(key, 0) + 1
                if slopes[key] > local:
                    local = slopes[key]
            best = max(best, local + dups + 1)
        return best
`,
    javascript: `var maxPoints = function(points) {
    const n = points.length;
    if (n <= 2) return n;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    let best = 0;
    for (let i = 0; i < n; i++) {
        const slopes = new Map();
        let dups = 0, local = 0;
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            let dy = points[j][1] - points[i][1];
            let dx = points[j][0] - points[i][0];
            if (dy === 0 && dx === 0) { dups++; continue; }
            const g = gcd(Math.abs(dy), Math.abs(dx));
            dy /= g; dx /= g;
            if (dx < 0 || (dx === 0 && dy < 0)) { dy = -dy; dx = -dx; }
            const key = dy + ',' + dx;
            const c = (slopes.get(key) || 0) + 1;
            slopes.set(key, c);
            if (c > local) local = c;
        }
        best = Math.max(best, local + dups + 1);
    }
    return best;
};
`,
    java: `class Solution {
    public int maxPoints(int[][] points) {
        int n = points.length;
        if (n <= 2) return n;
        int best = 0;
        for (int i = 0; i < n; i++) {
            Map<String, Integer> slopes = new HashMap<>();
            int dups = 0, local = 0;
            for (int j = 0; j < n; j++) {
                if (j == i) continue;
                int dy = points[j][1] - points[i][1];
                int dx = points[j][0] - points[i][0];
                if (dy == 0 && dx == 0) { dups++; continue; }
                int g = gcd(Math.abs(dy), Math.abs(dx));
                dy /= g; dx /= g;
                if (dx < 0 || (dx == 0 && dy < 0)) { dy = -dy; dx = -dx; }
                String key = dy + "," + dx;
                int c = slopes.getOrDefault(key, 0) + 1;
                slopes.put(key, c);
                if (c > local) local = c;
            }
            best = Math.max(best, local + dups + 1);
        }
        return best;
    }
    int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
}
`,
    cpp: `class Solution {
public:
    int gcdv(int a, int b) { return b == 0 ? a : gcdv(b, a % b); }
    int maxPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 2) return n;
        int best = 0;
        for (int i = 0; i < n; i++) {
            unordered_map<string, int> slopes;
            int dups = 0, local = 0;
            for (int j = 0; j < n; j++) {
                if (j == i) continue;
                int dy = points[j][1] - points[i][1];
                int dx = points[j][0] - points[i][0];
                if (dy == 0 && dx == 0) { dups++; continue; }
                int g = gcdv(abs(dy), abs(dx));
                dy /= g; dx /= g;
                if (dx < 0 || (dx == 0 && dy < 0)) { dy = -dy; dx = -dx; }
                string key = to_string(dy) + "," + to_string(dx);
                int c = ++slopes[key];
                if (c > local) local = c;
            }
            best = max(best, local + dups + 1);
        }
        return best;
    }
};
`,
  },
});

// ============================================================
// container-with-most-water
// ============================================================
add('container-with-most-water', {
  hints: [
    'Two pointers: l = 0, r = n - 1. Area = min(height[l], height[r]) * (r - l).',
    'Always move the smaller-height pointer inward. Moving the larger one can only reduce width without raising the binding height.',
    'Track max area seen. Stop when l >= r.',
    'O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[1,8,6,2,5,4,8,3,7]'], expected: '49' },
    { inputs: ['[1,1]'], expected: '1' },
    { inputs: ['[4,3,2,1,4]'], expected: '16' },
    { inputs: ['[1,2,1]'], expected: '2' },
    { inputs: ['[2,3,4,5,18,17,6]'], expected: '17' },
    { inputs: ['[1,2,4,3]'], expected: '4' },
    { inputs: ['[1,3,2,5,25,24,5]'], expected: '24' },
    { inputs: ['[0,0]'], expected: '0' },
    { inputs: ['[1,0,1]'], expected: '2' },
    { inputs: ['[10,9,8,7,6,5,4,3,2,1]'], expected: '25' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]'], expected: '25' },
    { inputs: ['[5,5,5,5,5]'], expected: '20' },
  ],
  editorial_md: ed(
    'Greedy two-pointer: start with the widest possible container (left and right ends), then shrink width by one step each time, but always shrink from the *shorter* side. The shorter side bounds the area; moving it inward is the only direction that can increase the binding height enough to offset the width loss. Moving the taller side inward strictly worsens the area — width decreases, height stays the same or drops.',
    'Initialize `l = 0`, `r = n - 1`, `best = 0`.\n\nLoop while `l < r`:\n\n1. Compute area = `min(height[l], height[r]) * (r - l)`.\n2. Update `best = max(best, area)`.\n3. If `height[l] < height[r]`, advance `l++` (the left side is binding; try to find a taller wall there).\n4. Otherwise, decrement `r--`.\n5. If they\'re equal, you can move either — both choices preserve the optimal-future invariant. Pick one consistently.\n\nReturn `best`. Linear time, constant space, no auxiliary data structures.\n\nWhy is moving the taller side never useful? With width strictly decreasing per step, the only path to a larger area is a taller binding height. The binding height equals the shorter of the two walls. Moving the taller wall in cannot raise that minimum — at best the new wall is taller and the min stays the same (still bounded by the unchanged shorter wall), at worst the new wall is shorter and the min drops. Either way, area decreases. Moving the shorter wall in *might* find a taller wall, raising the min — the only direction with upside.',
    'Time O(n) — each pointer moves a total of at most n steps. Space O(1) — three integer variables.',
    'Moving both pointers per iteration cuts the search in half but skips configurations and misses the optimal answer. Always moving the right pointer (a "moving window" mindset) ignores cases where the left wall is binding. Off-by-one on the initial pointers (e.g., `r = n` instead of `n - 1`) reads out of bounds.'
  ),
  solutions: {
    python: `class Solution:
    def maxArea(self, height):
        l, r = 0, len(height) - 1
        best = 0
        while l < r:
            h = min(height[l], height[r])
            area = h * (r - l)
            if area > best:
                best = area
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return best
`,
    javascript: `var maxArea = function(height) {
    let l = 0, r = height.length - 1;
    let best = 0;
    while (l < r) {
        const h = Math.min(height[l], height[r]);
        const area = h * (r - l);
        if (area > best) best = area;
        if (height[l] < height[r]) l++;
        else r--;
    }
    return best;
};
`,
    java: `class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            int area = h * (r - l);
            if (area > best) best = area;
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
}
`,
    cpp: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = height.size() - 1, best = 0;
        while (l < r) {
            int h = min(height[l], height[r]);
            int area = h * (r - l);
            if (area > best) best = area;
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
};
`,
  },
});

// ============================================================
// perfect-squares
// ============================================================
add('perfect-squares', {
  hints: [
    'Classic DP: dp[n] = min count of perfect squares summing to n. dp[n] = 1 + min(dp[n - k*k]) for k*k <= n.',
    'BFS from n down to 0: each level peels off one square. The level at which we hit 0 is the answer.',
    'Lagrange\'s theorem says answer is always 1, 2, 3, or 4. Special cases reduce work.',
    'O(n * sqrt(n)) time for the DP, O(n) space.',
  ],
  test_cases: [
    { inputs: ['12'], expected: '3' },
    { inputs: ['13'], expected: '2' },
    { inputs: ['1'], expected: '1' },
    { inputs: ['2'], expected: '2' },
    { inputs: ['3'], expected: '3' },
    { inputs: ['4'], expected: '1' },
    { inputs: ['7'], expected: '4' },
    { inputs: ['16'], expected: '1' },
    { inputs: ['25'], expected: '1' },
    { inputs: ['100'], expected: '1' },
    { inputs: ['9999'], expected: '4' },
    { inputs: ['9876'], expected: '4' },
  ],
  editorial_md: ed(
    'Frame the problem as shortest-path over integers: nodes are values `0..n`, and there\'s an edge from `v` to `v - k*k` for every `k` with `k*k <= v`. The shortest path from `n` to `0` is the minimum count of squares. DP (bottom-up) and BFS (top-down) both compute this in O(n · √n).',
    'Bottom-up DP. Define `dp[i]` = min squares summing to `i`. Base: `dp[0] = 0`. For `i` from `1` to `n`, compute `dp[i] = 1 + min(dp[i - k*k])` over all `k` with `k*k <= i`. The inner loop runs `O(√i)` times per `i`, giving `O(n · √n)` total.\n\nReturn `dp[n]`.\n\nBFS alternative: queue starts with `n`, target is `0`. Each step subtracts a perfect square. The level number when `0` is dequeued is the answer. BFS is often faster in practice because Lagrange\'s four-square theorem caps the answer at 4 — at most 4 BFS layers, with pruning via a visited set.\n\nMathematical shortcut (Lagrange + Legendre): the answer is always 1, 2, 3, or 4. \n- 1 if `n` is a perfect square.\n- 4 if `n = 4^a · (8b + 7)` (Legendre\'s three-square theorem).\n- 2 if some `i` with `i*i + j*j == n` exists.\n- Otherwise 3.\n\nThe O(√n) closed-form check is the fastest, but the DP/BFS is what interviews usually want to see.',
    'Time O(n · √n) for the DP. Space O(n) for the table. BFS shares the same asymptotic but with smaller hidden constants when the answer is small.',
    'Using `Math.sqrt(n)` to upper-bound the square loop and comparing in floating point can off-by-one — prefer `while (k * k <= i)`. Forgetting `dp[0] = 0` makes every entry depend on a wrong base. BFS without a `visited` set explores exponentially many duplicates and times out for large `n`.'
  ),
  solutions: {
    python: `class Solution:
    def numSquares(self, n):
        dp = [0] + [float('inf')] * n
        for i in range(1, n + 1):
            k = 1
            while k * k <= i:
                if dp[i - k * k] + 1 < dp[i]:
                    dp[i] = dp[i - k * k] + 1
                k += 1
        return dp[n]
`,
    javascript: `var numSquares = function(n) {
    const dp = new Array(n + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= n; i++) {
        for (let k = 1; k * k <= i; k++) {
            if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1;
        }
    }
    return dp[n];
};
`,
    java: `class Solution {
    public int numSquares(int n) {
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int i = 1; i <= n; i++) {
            for (int k = 1; k * k <= i; k++) {
                if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1;
            }
        }
        return dp[n];
    }
}
`,
    cpp: `class Solution {
public:
    int numSquares(int n) {
        vector<int> dp(n + 1, INT_MAX);
        dp[0] = 0;
        for (int i = 1; i <= n; i++) {
            for (int k = 1; k * k <= i; k++) {
                if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1;
            }
        }
        return dp[n];
    }
};
`,
  },
});

// Save (merge with existing)
const merged = existing.filter(e => !PATCHES[e.id]).concat(Object.entries(PATCHES).map(([id, p]) => ({ id, ...p })));
fs.writeFileSync('/tmp/patch-w3-400-23.json', JSON.stringify(merged, null, 2));
console.log('Appended', Object.keys(PATCHES).length, 'patches. Total:', merged.length);
