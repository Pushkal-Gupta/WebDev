// batch-stub550-A.mjs — Python-only canonical solutions slice.
// Auto-loaded by backfill-solutions.mjs. Signatures match the stored
// method_name + positional param order exactly.

export default {
  // getFinalState(nums: List[int], k: int, multiplier: int) -> List[int]
  // Simulate k ops: each op multiplies the current minimum (leftmost on ties).
  'final-array-state-after-k-multiplication-operations-i': {
    python: `class Solution:
    def getFinalState(self, nums: List[int], k: int, multiplier: int) -> List[int]:
        import heapq
        heap = [(v, i) for i, v in enumerate(nums)]
        heapq.heapify(heap)
        for _ in range(k):
            v, i = heap[0]
            heapq.heapreplace(heap, (v * multiplier, i))
        res = list(nums)
        for v, i in heap:
            res[i] = v
        return res`,
  },

  // getFinalState(nums: List[int], k: int, multiplier: int) -> List[int]
  // k up to 1e9. Simulate with a heap until the array "stabilizes"
  // (min*multiplier exceeds current max), then distribute remaining ops
  // uniformly round-robin in sorted order. mod 1e9+7 only at the very end.
  'final-array-state-after-k-multiplication-operations-ii': {
    python: `class Solution:
    def getFinalState(self, nums: List[int], k: int, multiplier: int) -> List[int]:
        import heapq
        MOD = 10**9 + 7
        if multiplier == 1:
            return [v % MOD for v in nums]
        n = len(nums)
        heap = [(v, i) for i, v in enumerate(nums)]
        heapq.heapify(heap)
        mx = max(nums)
        while k > 0:
            v, i = heap[0]
            if v * multiplier > mx:
                break
            heapq.heapreplace(heap, (v * multiplier, i))
            mx = max(mx, v * multiplier)
            k -= 1
        if k == 0:
            res = [0] * n
            for v, i in heap:
                res[i] = v % MOD
            return res
        arr = sorted(heap)
        full, rem = divmod(k, n)
        res = [0] * n
        for t, (v, i) in enumerate(arr):
            e = full + (1 if t < rem else 0)
            res[i] = (v % MOD) * pow(multiplier, e, MOD) % MOD
        return res`,
  },

  // finalElement(nums: List[int]) -> int
  // Alice maximizes, Bob minimizes, alternating subarray deletions. With
  // distinct values the survivor is always an endpoint; the answer reduces to
  // max(first, last) (single element returns itself). Verified exhaustively.
  'final-element-after-subarray-deletions': {
    python: `class Solution:
    def finalElement(self, nums: List[int]) -> int:
        if len(nums) == 1:
            return nums[0]
        return max(nums[0], nums[-1])`,
  },

  // getTargetCopy(tree: List[int], target: int) -> int
  // Values are unique, so the corresponding node in the clone holds the same value.
  'find-a-corresponding-node-of-a-binary-tree-in-a-clone-of-that-tree': {
    python: `class Solution:
    def getTargetCopy(self, tree: List[int], target: int) -> int:
        return target`,
  },

  // goodSubsetofBinaryMatrix(grid: List[List[int]]) -> List[int]
  // A subset of k rows is good if every column sum <= k//2. A single all-zero
  // row works (k=1, floor 0). Otherwise two rows whose bitwise AND is all zeros
  // work (k=2, floor 1). Return the smallest such (sorted) or [].
  'find-a-good-subset-of-the-matrix': {
    python: `class Solution:
    def goodSubsetofBinaryMatrix(self, grid: List[List[int]]) -> List[int]:
        masks = {}
        for i, row in enumerate(grid):
            m = 0
            for b in row:
                m = (m << 1) | b
            if m == 0:
                return [i]
            if m not in masks:
                masks[m] = i
        keys = list(masks.keys())
        for a in range(len(keys)):
            for b in range(a + 1, len(keys)):
                if keys[a] & keys[b] == 0:
                    return sorted([masks[keys[a]], masks[keys[b]]])
        return []`,
  },

  // findPeakGrid(mat: List[List[int]]) -> List[int]
  // Binary search on ROWS (O(n log m)). At row mid, take the column of its maximum;
  // if the cell below is larger the peak lies strictly below, otherwise at mid or
  // above. The column-max guarantees horizontal neighbors are no greater, so the
  // converged cell is a 2D peak. Matches the canonical [row, col] expectations.
  'find-a-peak-element-ii': {
    python: `class Solution:
    def findPeakGrid(self, mat: List[List[int]]) -> List[int]:
        m, n = len(mat), len(mat[0])
        lo, hi = 0, m - 1
        while lo < hi:
            mid = (lo + hi) // 2
            best = 0
            for c in range(n):
                if mat[mid][c] > mat[mid][best]:
                    best = c
            if mat[mid][best] < mat[mid + 1][best]:
                lo = mid + 1
            else:
                hi = mid
        best = 0
        for c in range(n):
            if mat[lo][c] > mat[lo][best]:
                best = c
        return [lo, best]`,
  },

  // findSafeWalk(grid: List[List[int]], health: int) -> bool
  // 0-1 BFS minimizing total damage (cells with value 1 cost 1 health, including
  // start/end). Reachable safely iff minimal damage < health (health stays >= 1).
  'find-a-safe-walk-through-a-grid': {
    python: `class Solution:
    def findSafeWalk(self, grid: List[List[int]], health: int) -> bool:
        from collections import deque
        m, n = len(grid), len(grid[0])
        INF = float('inf')
        dist = [[INF] * n for _ in range(m)]
        dist[0][0] = grid[0][0]
        dq = deque([(0, 0)])
        while dq:
            r, c = dq.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n:
                    nd = dist[r][c] + grid[nr][nc]
                    if nd < dist[nr][nc]:
                        dist[nr][nc] = nd
                        if grid[nr][nc] == 0:
                            dq.appendleft((nr, nc))
                        else:
                            dq.append((nr, nc))
        return dist[m - 1][n - 1] < health`,
  },

  // goodIndices(nums: List[int], k: int) -> List[int]
  // i is good if the k elements before it are non-increasing AND the k elements
  // after it are non-decreasing. Precompute run lengths with prefix arrays.
  'find-all-good-indices': {
    python: `class Solution:
    def goodIndices(self, nums: List[int], k: int) -> List[int]:
        n = len(nums)
        non_inc = [1] * n
        for i in range(1, n):
            if nums[i] <= nums[i - 1]:
                non_inc[i] = non_inc[i - 1] + 1
        non_dec = [1] * n
        for i in range(n - 2, -1, -1):
            if nums[i] <= nums[i + 1]:
                non_dec[i] = non_dec[i + 1] + 1
        res = []
        for i in range(k, n - k):
            if non_inc[i - 1] >= k and non_dec[i + 1] >= k:
                res.append(i)
        return res`,
  },

  // findFarmland(land: List[List[int]]) -> List[List[int]]
  // Each group is a rectangle of 1s. Scan row-major; a cell is a top-left corner
  // when it is 1 and the cells above and to the left are 0/out of bounds. Expand
  // to find the bottom-right corner, then zero it out.
  'find-all-groups-of-farmland': {
    python: `class Solution:
    def findFarmland(self, land: List[List[int]]) -> List[List[int]]:
        m, n = len(land), len(land[0])
        res = []
        for r in range(m):
            for c in range(n):
                if land[r][c] == 1 and (r == 0 or land[r - 1][c] == 0) and (c == 0 or land[r][c - 1] == 0):
                    r2 = r
                    while r2 + 1 < m and land[r2 + 1][c] == 1:
                        r2 += 1
                    c2 = c
                    while c2 + 1 < n and land[r][c2 + 1] == 1:
                        c2 += 1
                    res.append([r, c, r2, c2])
        return res`,
  },

  // findKDistantIndices(nums: List[int], key: int, k: int) -> List[int]
  // Collect every index i within distance k of some j where nums[j] == key.
  // Merge marked ranges, return sorted unique indices.
  'find-all-k-distant-indices-in-an-array': {
    python: `class Solution:
    def findKDistantIndices(self, nums: List[int], key: int, k: int) -> List[int]:
        n = len(nums)
        res = []
        nxt = 0
        for j in range(n):
            if nums[j] == key:
                lo = max(nxt, j - k)
                hi = min(n - 1, j + k)
                for i in range(lo, hi + 1):
                    res.append(i)
                nxt = hi + 1
        return res`,
  },
};
