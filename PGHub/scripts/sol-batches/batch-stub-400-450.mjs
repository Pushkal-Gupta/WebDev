// Python-only canonicals for stub slice [400,450). Authored + graded against
// preserved test cases on local Judge0. Tree/linked-list problems are typed
// List[int] in the registry (NOT TreeNode/ListNode), so the driver passes a
// plain level-order / value list and serializes the returned plain list as JSON
// — each solution rebuilds the structure internally and returns a plain list.
export default {
  'decoded-string-at-index': {
    python: `class Solution:
    def decodeAtIndex(self, s: str, k: int) -> str:
        size = 0
        for c in s:
            if c.isdigit():
                size *= int(c)
            else:
                size += 1
        for c in reversed(s):
            k %= size
            if k == 0 and c.isalpha():
                return c
            if c.isdigit():
                size //= int(c)
            else:
                size -= 1
        return ""`,
  },

  'decremental-string-concatenation': {
    python: `class Solution:
    def minimizeConcatenatedLength(self, words: List[str]) -> int:
        from functools import lru_cache
        n = len(words)
        @lru_cache(maxsize=None)
        def dp(i, first, last):
            if i == n:
                return 0
            w = words[i]
            a = len(w) + dp(i + 1, first, w[-1]) - (1 if w[0] == last else 0)
            b = len(w) + dp(i + 1, w[0], last) - (1 if w[-1] == first else 0)
            return min(a, b)
        return len(words[0]) + dp(1, words[0][0], words[0][-1])`,
  },

  'decrypt-string-from-alphabet-to-integer-mapping': {
    python: `class Solution:
    def freqAlphabets(self, s: str) -> str:
        res = []
        i = 0
        n = len(s)
        while i < n:
            if i + 2 < n and s[i + 2] == '#':
                res.append(chr(ord('a') + int(s[i:i + 2]) - 1))
                i += 3
            else:
                res.append(chr(ord('a') + int(s[i]) - 1))
                i += 1
        return ''.join(res)`,
  },

  'defuse-the-bomb': {
    python: `class Solution:
    def decrypt(self, code: List[int], k: int) -> List[int]:
        n = len(code)
        res = [0] * n
        if k == 0:
            return res
        for i in range(n):
            if k > 0:
                res[i] = sum(code[(i + j) % n] for j in range(1, k + 1))
            else:
                res[i] = sum(code[(i + j) % n] for j in range(k, 0))
        return res`,
  },

  'delete-characters-to-make-fancy-string': {
    python: `class Solution:
    def makeFancyString(self, s: str) -> str:
        res = []
        for c in s:
            if len(res) >= 2 and res[-1] == c and res[-2] == c:
                continue
            res.append(c)
        return ''.join(res)`,
  },

  'delete-columns-to-make-sorted-ii': {
    python: `class Solution:
    def minDeletionSize(self, strs: List[str]) -> int:
        n = len(strs)
        m = len(strs[0]) if strs else 0
        sorted_ = [False] * n
        res = 0
        for col in range(m):
            bad = False
            for i in range(1, n):
                if not sorted_[i] and strs[i][col] < strs[i - 1][col]:
                    bad = True
                    break
            if bad:
                res += 1
            else:
                for i in range(1, n):
                    if strs[i][col] > strs[i - 1][col]:
                        sorted_[i] = True
        return res`,
  },

  'delete-columns-to-make-sorted-iii': {
    python: `class Solution:
    def minDeletionSize(self, strs: List[str]) -> int:
        n = len(strs[0]) if strs else 0
        dp = [1] * n
        for j in range(n):
            for i in range(j):
                if all(row[i] <= row[j] for row in strs):
                    dp[j] = max(dp[j], dp[i] + 1)
        return n - max(dp) if n else 0`,
  },

  'delete-greatest-value-in-each-row': {
    python: `class Solution:
    def deleteGreatestValue(self, grid: List[List[int]]) -> int:
        for row in grid:
            row.sort()
        ans = 0
        for col in zip(*grid):
            ans += max(col)
        return ans`,
  },

  'delete-leaves-with-a-given-value': {
    python: `class Solution:
    def removeLeafNodes(self, root: List[int], target: int):
        class TN:
            __slots__ = ('val', 'left', 'right')
            def __init__(self, v):
                self.val = v; self.left = None; self.right = None
        def build(arr):
            if not arr or arr[0] is None:
                return None
            r = TN(arr[0]); q = [r]; i = 1
            while q and i < len(arr):
                nd = q.pop(0)
                if i < len(arr) and arr[i] is not None:
                    nd.left = TN(arr[i]); q.append(nd.left)
                i += 1
                if i < len(arr) and arr[i] is not None:
                    nd.right = TN(arr[i]); q.append(nd.right)
                i += 1
            return r
        def prune(nd):
            if nd is None:
                return None
            nd.left = prune(nd.left)
            nd.right = prune(nd.right)
            if nd.left is None and nd.right is None and nd.val == target:
                return None
            return nd
        def serialize(r):
            if not r:
                return []
            out = []; q = [r]
            while q:
                nd = q.pop(0)
                if nd is None:
                    out.append(None)
                else:
                    out.append(nd.val); q.append(nd.left); q.append(nd.right)
            while out and out[-1] is None:
                out.pop()
            return out
        return serialize(prune(build(root)))`,
  },

  'delete-nodes-and-return-forest': {
    python: `class Solution:
    def delNodes(self, root: List[int], to_delete: List[int]) -> List[List[int]]:
        class TN:
            __slots__ = ('val', 'left', 'right')
            def __init__(self, v):
                self.val = v; self.left = None; self.right = None
        def build(arr):
            if not arr or arr[0] is None:
                return None
            r = TN(arr[0]); q = [r]; i = 1
            while q and i < len(arr):
                nd = q.pop(0)
                if i < len(arr) and arr[i] is not None:
                    nd.left = TN(arr[i]); q.append(nd.left)
                i += 1
                if i < len(arr) and arr[i] is not None:
                    nd.right = TN(arr[i]); q.append(nd.right)
                i += 1
            return r
        def serialize(r):
            out = []; q = [r]
            while q:
                nd = q.pop(0)
                if nd is None:
                    out.append(None)
                else:
                    out.append(nd.val); q.append(nd.left); q.append(nd.right)
            while out and out[-1] is None:
                out.pop()
            return out
        ds = set(to_delete)
        roots = []
        def dfs(nd, is_root):
            if nd is None:
                return None
            deleted = nd.val in ds
            if is_root and not deleted:
                roots.append(nd)
            nd.left = dfs(nd.left, deleted)
            nd.right = dfs(nd.right, deleted)
            return None if deleted else nd
        dfs(build(root), True)
        return [serialize(r) for r in roots]`,
  },

  'delete-nodes-from-linked-list-present-in-array': {
    python: `class Solution:
    def modifiedList(self, nums: List[int], head: List[int]) -> List[int]:
        bad = set(nums)
        return [x for x in head if x not in bad]`,
  },

  'delivering-boxes-from-storage-to-ports': {
    python: `class Solution:
    def boxDelivering(self, boxes: List[List[int]], portsCount: int, maxBoxes: int, maxWeight: int) -> int:
        n = len(boxes)
        # neededTrips[i] = extra trips for the segment up to box i (port changes)
        dp = [0] * (n + 1)
        j = 0
        cur_weight = 0
        cur_trips = 0
        for i in range(n):
            cur_weight += boxes[i][1]
            if i > 0 and boxes[i][0] != boxes[i - 1][0]:
                cur_trips += 1
            while (i - j + 1) > maxBoxes or cur_weight > maxWeight or (j < i and dp[j + 1] == dp[j]):
                cur_weight -= boxes[j][1]
                if boxes[j][0] != boxes[j + 1][0]:
                    cur_trips -= 1
                j += 1
            dp[i + 1] = dp[j] + cur_trips + 2
        return dp[n]`,
  },

  'describe-the-painting': {
    python: `class Solution:
    def splitPainting(self, segments: List[List[int]]) -> List[List[int]]:
        from collections import defaultdict
        diff = defaultdict(int)
        for s, e, c in segments:
            diff[s] += c
            diff[e] -= c
        res = []
        prev = None
        cur = 0
        for x in sorted(diff):
            if prev is not None and cur != 0:
                res.append([prev, x, cur])
            cur += diff[x]
            prev = x
        return res`,
  },

  'destination-city': {
    python: `class Solution:
    def destCity(self, paths: List[List[str]]) -> str:
        sources = {a for a, b in paths}
        for a, b in paths:
            if b not in sources:
                return b
        return ""`,
  },

  'destroy-sequential-targets': {
    python: `class Solution:
    def destroyTargets(self, nums: List[int], space: int) -> int:
        from collections import Counter
        cnt = Counter(x % space for x in nums)
        best = max(cnt.values())
        ans = float('inf')
        for x in nums:
            if cnt[x % space] == best:
                ans = min(ans, x)
        return ans`,
  },

  'destroying-asteroids': {
    python: `class Solution:
    def asteroidsDestroyed(self, mass: int, asteroids: List[int]) -> bool:
        cur = mass
        for a in sorted(asteroids):
            if cur < a:
                return False
            cur += a
        return True`,
  },

  'detect-cycles-in-2d-grid': {
    python: `class Solution:
    def containsCycle(self, grid: List[List[str]]) -> bool:
        m, n = len(grid), len(grid[0])
        seen = [[False] * n for _ in range(m)]
        def dfs(r, c, pr, pc):
            seen[r][c] = True
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == grid[r][c]:
                    if (nr, nc) == (pr, pc):
                        continue
                    if seen[nr][nc]:
                        return True
                    if dfs(nr, nc, r, c):
                        return True
            return False
        import sys
        sys.setrecursionlimit(1 << 20)
        for i in range(m):
            for j in range(n):
                if not seen[i][j] and dfs(i, j, -1, -1):
                    return True
        return False`,
  },

  'determine-color-of-a-chessboard-square': {
    python: `class Solution:
    def squareIsWhite(self, coordinates: str) -> bool:
        return (ord(coordinates[0]) - ord('a') + int(coordinates[1])) % 2 == 0`,
  },

  'determine-if-a-cell-is-reachable-at-a-given-time': {
    python: `class Solution:
    def isReachableAtTime(self, sx: int, sy: int, fx: int, fy: int, t: int) -> bool:
        dx = abs(sx - fx)
        dy = abs(sy - fy)
        d = max(dx, dy)
        if d == 0:
            return t != 1
        return t >= d`,
  },

  'determine-if-two-events-have-conflict': {
    python: `class Solution:
    def haveConflict(self, event1: List[str], event2: List[str]) -> bool:
        return event1[0] <= event2[1] and event2[0] <= event1[1]`,
  },

  'determine-if-two-strings-are-close': {
    python: `class Solution:
    def closeStrings(self, word1: str, word2: str) -> bool:
        from collections import Counter
        c1, c2 = Counter(word1), Counter(word2)
        return set(c1) == set(c2) and sorted(c1.values()) == sorted(c2.values())`,
  },

  'determine-the-minimum-sum-of-a-k-avoiding-array': {
    python: `class Solution:
    def minimumSum(self, n: int, k: int) -> int:
        used = set()
        total = 0
        cur = 1
        added = 0
        while added < n:
            if (k - cur) not in used:
                used.add(cur)
                total += cur
                added += 1
            cur += 1
        return total`,
  },
};
