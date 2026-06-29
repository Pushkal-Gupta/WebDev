// batch-stub550-C.mjs — Python-only canonical solutions.
// Signatures match generateTemplate(language, method_name, params, return_type) exactly.
// Driver injects List/Optional/Dict/Tuple/Set; inputs arrive JSON-parsed to native Python.

export default {
  // findBottomLeftValue(root: List[int]) -> int
  // root is a level-order flat list with None for missing nodes. Rebuild the tree,
  // BFS, return the leftmost value of the last level.
  'find-bottom-left-tree-value': {
    python: `class Solution:
    def findBottomLeftValue(self, root: List[int]) -> int:
        if not root or root[0] is None:
            return -1
        class Node:
            __slots__ = ('val', 'left', 'right')
            def __init__(self, v):
                self.val = v
                self.left = None
                self.right = None
        head = Node(root[0])
        queue = [head]
        i = 1
        n = len(root)
        qi = 0
        while qi < len(queue) and i < n:
            node = queue[qi]
            qi += 1
            if i < n:
                v = root[i]
                i += 1
                if v is not None:
                    node.left = Node(v)
                    queue.append(node.left)
            if i < n:
                v = root[i]
                i += 1
                if v is not None:
                    node.right = Node(v)
                    queue.append(node.right)
        level = [head]
        leftmost = head.val
        while level:
            leftmost = level[0].val
            nxt = []
            for nd in level:
                if nd.left:
                    nxt.append(nd.left)
                if nd.right:
                    nxt.append(nd.right)
            level = nxt
        return leftmost`
  },

  // leftmostBuildingQueries(heights: List[int], queries: List[List[int]]) -> List[int]
  // Offline: group queries by the right index needing a strictly-taller building,
  // sweep indices right-to-left with a monotonic stack, binary search for the
  // leftmost building (smallest index > pos) strictly taller than the threshold.
  'find-building-where-alice-and-bob-can-meet': {
    python: `class Solution:
    def leftmostBuildingQueries(self, heights: List[int], queries: List[List[int]]) -> List[int]:
        import bisect
        n = len(heights)
        ans = [-1] * len(queries)
        buckets = [[] for _ in range(n)]
        for qi, (a, b) in enumerate(queries):
            if a > b:
                a, b = b, a
            if a == b or heights[a] < heights[b]:
                ans[qi] = b
            else:
                buckets[b].append((max(heights[a], heights[b]), qi))
        # monotonic stack of indices with strictly decreasing heights, index increasing.
        # stack[k] holds index; heights along stack are strictly decreasing left->right,
        # and indices are strictly decreasing left->right (we push from the right).
        stack = []
        for j in range(n - 1, -1, -1):
            for need, qi in buckets[j]:
                # find leftmost index in stack (largest position) with height > need.
                # stack indices are decreasing; heights are increasing toward the top.
                # Binary search on stack for height > need; want smallest index.
                lo, hi = 0, len(stack)
                pos = -1
                while lo < hi:
                    mid = (lo + hi) // 2
                    if heights[stack[mid]] > need:
                        pos = mid
                        lo = mid + 1
                    else:
                        hi = mid
                if pos != -1:
                    ans[qi] = stack[pos]
            while stack and heights[stack[-1]] <= heights[j]:
                stack.pop()
            stack.append(j)
        return ans`
  },

  // closestMeetingNode(edges: List[int], node1: int, node2: int) -> int
  // Functional graph (<=1 out-edge each). Walk from each start, record distances,
  // pick node minimizing max(d1, d2), tie-break smallest index.
  'find-closest-node-to-given-two-nodes': {
    python: `class Solution:
    def closestMeetingNode(self, edges: List[int], node1: int, node2: int) -> int:
        n = len(edges)
        def dist(start):
            d = [-1] * n
            cur = start
            step = 0
            while cur != -1 and d[cur] == -1:
                d[cur] = step
                step += 1
                cur = edges[cur]
            return d
        d1 = dist(node1)
        d2 = dist(node2)
        best = -1
        bestVal = float('inf')
        for i in range(n):
            if d1[i] != -1 and d2[i] != -1:
                m = max(d1[i], d2[i])
                if m < bestVal:
                    bestVal = m
                    best = i
        return best`
  },

  // findClosest(x: int, y: int, z: int) -> int
  'find-closest-person': {
    python: `class Solution:
    def findClosest(self, x: int, y: int, z: int) -> int:
        d1 = abs(x - z)
        d2 = abs(y - z)
        if d1 < d2:
            return 1
        if d2 < d1:
            return 2
        return 0`
  },

  // findIntersectionValues(nums1: List[int], nums2: List[int]) -> List[int]
  'find-common-elements-between-two-arrays': {
    python: `class Solution:
    def findIntersectionValues(self, nums1: List[int], nums2: List[int]) -> List[int]:
        s1 = set(nums1)
        s2 = set(nums2)
        a1 = sum(1 for v in nums1 if v in s2)
        a2 = sum(1 for v in nums2 if v in s1)
        return [a1, a2]`
  },

  // findCriticalAndPseudoCriticalEdges(n: int, edges: List[List[int]]) -> List[List[int]]
  // Kruskal MST baseline; per-edge test (exclude => critical; force-include => pseudo).
  'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree': {
    python: `class Solution:
    def findCriticalAndPseudoCriticalEdges(self, n: int, edges: List[List[int]]) -> List[List[int]]:
        m = len(edges)
        indexed = [(w, u, v, i) for i, (u, v, w) in enumerate(edges)]
        indexed.sort(key=lambda e: e[0])

        def build(exclude=-1, include=-1):
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x
            total = 0
            used = 0
            if include != -1:
                w, u, v, _ = indexed_by_idx[include]
                ru, rv = find(u), find(v)
                parent[ru] = rv
                total += w
                used += 1
            for w, u, v, idx in indexed:
                if idx == exclude:
                    continue
                ru, rv = find(u), find(v)
                if ru != rv:
                    parent[ru] = rv
                    total += w
                    used += 1
            return total if used == n - 1 else float('inf')

        indexed_by_idx = [None] * m
        for e in indexed:
            indexed_by_idx[e[3]] = e

        base = build()
        critical = []
        pseudo = []
        for i in range(m):
            if build(exclude=i) > base:
                critical.append(i)
            elif build(include=i) == base:
                pseudo.append(i)
        critical.sort()
        pseudo.sort()
        return [critical, pseudo]`
  },

  // findDuplicate(paths: List[str]) -> List[List[str]]
  // Group "dir/name" full paths by file content; return groups with >=2 files.
  'find-duplicate-file-in-system': {
    python: `class Solution:
    def findDuplicate(self, paths: List[str]) -> List[List[str]]:
        groups = {}
        for path in paths:
            parts = path.split(' ')
            directory = parts[0]
            for f in parts[1:]:
                lp = f.find('(')
                name = f[:lp]
                content = f[lp + 1:-1]
                groups.setdefault(content, []).append(directory + '/' + name)
        dup = [v for v in groups.values() if len(v) > 1]
        dup.reverse()
        return dup`
  },

  // findAnswer(n: int, edges: List[List[int]]) -> List[bool]
  // Dijkstra from 0 and from n-1; edge on a shortest path iff it tightens d0[n-1].
  'find-edges-in-shortest-paths': {
    python: `class Solution:
    def findAnswer(self, n: int, edges: List[List[int]]) -> List[bool]:
        import heapq
        adj = [[] for _ in range(n)]
        for i, (a, b, w) in enumerate(edges):
            adj[a].append((b, w, i))
            adj[b].append((a, w, i))

        def dijkstra(src):
            dist = [float('inf')] * n
            dist[src] = 0
            pq = [(0, src)]
            while pq:
                d, u = heapq.heappop(pq)
                if d > dist[u]:
                    continue
                for v, w, _ in adj[u]:
                    nd = d + w
                    if nd < dist[v]:
                        dist[v] = nd
                        heapq.heappush(pq, (nd, v))
            return dist

        d0 = dijkstra(0)
        d1 = dijkstra(n - 1)
        target = d0[n - 1]
        res = [False] * len(edges)
        if target == float('inf'):
            return res
        for i, (a, b, w) in enumerate(edges):
            if d0[a] + w + d1[b] == target or d0[b] + w + d1[a] == target:
                res[i] = True
        return res`
  },

  // goodDaysToRobBank(security: List[int], time: int) -> List[int]
  'find-good-days-to-rob-the-bank': {
    python: `class Solution:
    def goodDaysToRobBank(self, security: List[int], time: int) -> List[int]:
        n = len(security)
        if time == 0:
            return list(range(n))
        non_inc = [0] * n
        non_dec = [0] * n
        for i in range(1, n):
            if security[i] <= security[i - 1]:
                non_inc[i] = non_inc[i - 1] + 1
        for i in range(n - 2, -1, -1):
            if security[i] <= security[i + 1]:
                non_dec[i] = non_dec[i + 1] + 1
        return [i for i in range(n) if non_inc[i] >= time and non_dec[i] >= time]`
  },

  // canSortArray(nums: List[int]) -> bool
  // Sort within equal-popcount blocks; require each block's min >= previous block's max.
  'find-if-array-can-be-sorted': {
    python: `class Solution:
    def canSortArray(self, nums: List[int]) -> bool:
        prev_max = -1
        i = 0
        n = len(nums)
        while i < n:
            j = i
            bits = bin(nums[i]).count('1')
            cur_min = nums[i]
            cur_max = nums[i]
            while j < n and bin(nums[j]).count('1') == bits:
                cur_min = min(cur_min, nums[j])
                cur_max = max(cur_max, nums[j])
                j += 1
            if cur_min < prev_max:
                return False
            prev_max = cur_max
            i = j
        return True`
  }
};
