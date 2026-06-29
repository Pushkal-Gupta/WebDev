// wave-stubpy-A1.mjs — Python-only canonicals for stub-targets slice [0,50).
// Keyed by problem id (== slug). Each value is METHOD-BODY-ONLY in the
// LeetCode class shape that wrapWithDriver expects.
export default {
  'arithmetic-subarrays': {
    python: `class Solution:
    def checkArithmeticSubarrays(self, nums: List[int], l: List[int], r: List[int]) -> List[bool]:
        def ok(sub):
            if len(sub) <= 1:
                return True
            mn, mx = min(sub), max(sub)
            if (mx - mn) % (len(sub) - 1) != 0:
                return False
            d = (mx - mn) // (len(sub) - 1)
            if d == 0:
                return all(v == mn for v in sub)
            seen = set(sub)
            return len(seen) == len(sub) and all(mn + i * d in seen for i in range(len(sub)))
        return [ok(nums[l[i]:r[i] + 1]) for i in range(len(l))]`,
  },

  'average-of-levels-in-binary-tree': {
    python: `from collections import deque
class Solution:
    def averageOfLevels(self, root: List[Optional[int]]) -> List[float]:
        if not root:
            return []
        nodes = [None if v is None else v for v in root]
        n = len(nodes)
        children = []
        idx = 1
        adj = {0: []}
        for i in range(n):
            if nodes[i] is None:
                continue
            for _ in range(2):
                if idx < n and nodes[idx] is not None:
                    adj.setdefault(i, []).append(idx)
                    adj.setdefault(idx, [])
                if idx < n:
                    idx += 1
        res = []
        level = [0] if nodes and nodes[0] is not None else []
        while level:
            res.append(sum(nodes[i] for i in level) / len(level))
            nxt = []
            for i in level:
                nxt.extend(adj.get(i, []))
            level = nxt
        return res`,
  },

  'avoid-flood-in-the-city': {
    python: `import bisect
class Solution:
    def avoidFlood(self, rains: List[int]) -> List[int]:
        ans = [1] * len(rains)
        full = {}
        dry = []
        for i, lake in enumerate(rains):
            if lake == 0:
                dry.append(i)
            else:
                ans[i] = -1
                if lake in full:
                    j = bisect.bisect_right(dry, full[lake])
                    if j == len(dry):
                        return []
                    di = dry.pop(j)
                    ans[di] = lake
                full[lake] = i
        return ans`,
  },

  'balanced-binary-tree': {
    python: `class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        def h(node):
            if not node:
                return 0
            lh = h(node.left)
            if lh == -1:
                return -1
            rh = h(node.right)
            if rh == -1:
                return -1
            if abs(lh - rh) > 1:
                return -1
            return max(lh, rh) + 1
        return h(root) != -1`,
  },

  'balanced-k-factor-decomposition': {
    python: `class Solution:
    def minDifference(self, n: int, k: int) -> List[int]:
        best = [None, float('inf')]
        def rec(remaining, count, current):
            if count == 1:
                vals = current + [remaining]
                diff = max(vals) - min(vals)
                if diff < best[1]:
                    best[1] = diff
                    best[0] = vals[:]
                return
            d = 1
            while d * d <= remaining:
                if remaining % d == 0:
                    for f in (d, remaining // d):
                        if f >= 1:
                            rec(remaining // f, count - 1, current + [f])
                d += 1
        rec(n, k, [])
        return best[0]`,
  },

  'battleships-in-a-board': {
    python: `class Solution:
    def countBattleships(self, board: List[List[str]]) -> int:
        count = 0
        for i in range(len(board)):
            for j in range(len(board[0])):
                if board[i][j] == 'X':
                    if i > 0 and board[i-1][j] == 'X':
                        continue
                    if j > 0 and board[i][j-1] == 'X':
                        continue
                    count += 1
        return count`,
  },

  'beautiful-arrangement': {
    python: `class Solution:
    def countArrangement(self, n: int) -> int:
        used = [False] * (n + 1)
        def rec(pos):
            if pos > n:
                return 1
            total = 0
            for v in range(1, n + 1):
                if not used[v] and (v % pos == 0 or pos % v == 0):
                    used[v] = True
                    total += rec(pos + 1)
                    used[v] = False
            return total
        return rec(1)`,
  },

  'beautiful-arrangement-ii': {
    python: `class Solution:
    def constructArray(self, n: int, k: int) -> List[int]:
        res = list(range(1, n - k))
        lo, hi = n - k, n
        toggle = True
        while lo <= hi:
            if toggle:
                res.append(lo)
                lo += 1
            else:
                res.append(hi)
                hi -= 1
            toggle = not toggle
        return res`,
  },

  'beautiful-towers-i': {
    python: `class Solution:
    def maximumSumOfHeights(self, maxHeights: List[int]) -> int:
        n = len(maxHeights)
        best = 0
        for peak in range(n):
            total = maxHeights[peak]
            cur = maxHeights[peak]
            for i in range(peak - 1, -1, -1):
                cur = min(cur, maxHeights[i])
                total += cur
            cur = maxHeights[peak]
            for i in range(peak + 1, n):
                cur = min(cur, maxHeights[i])
                total += cur
            best = max(best, total)
        return best`,
  },

  'best-poker-hand': {
    python: `from collections import Counter
class Solution:
    def bestHand(self, ranks: List[int], suits: List[str]) -> str:
        if len(set(suits)) == 1:
            return "Flush"
        cnt = Counter(ranks)
        m = max(cnt.values())
        if m >= 3:
            return "Three of a Kind"
        if m == 2:
            return "Pair"
        return "High Card"`,
  },

  'best-reachable-tower': {
    python: `class Solution:
    def bestTower(self, towers: List[List[int]], center: List[int], radius: int) -> List[int]:
        cx, cy = center
        best = None
        for x, y, q in towers:
            if abs(x - cx) + abs(y - cy) <= radius:
                if best is None or q > best[0] or (q == best[0] and (x, y) < (best[1], best[2])):
                    best = (q, x, y)
        if best is None:
            return [-1, -1]
        return [best[1], best[2]]`,
  },

  'best-team-with-no-conflicts': {
    python: `class Solution:
    def bestTeamScore(self, scores: List[int], ages: List[int]) -> int:
        players = sorted(zip(ages, scores))
        n = len(players)
        dp = [0] * n
        best = 0
        for i in range(n):
            dp[i] = players[i][1]
            for j in range(i):
                if players[j][1] <= players[i][1]:
                    dp[i] = max(dp[i], dp[j] + players[i][1])
            best = max(best, dp[i])
        return best`,
  },

  'best-time-to-buy-and-sell-stock-using-strategy': {
    python: `class Solution:
    def maxProfit(self, prices: List[int], strategy: List[int], k: int) -> int:
        n = len(prices)
        base = sum(strategy[i] * prices[i] for i in range(n))
        h = k // 2
        prefSP = [0] * (n + 1)
        prefP = [0] * (n + 1)
        for i in range(n):
            prefSP[i + 1] = prefSP[i] + strategy[i] * prices[i]
            prefP[i + 1] = prefP[i] + prices[i]
        best = base
        for start in range(0, n - k + 1):
            removed = prefSP[start + k] - prefSP[start]
            added = prefP[start + k] - prefP[start + h]
            best = max(best, base - removed + added)
        return best`,
  },

  'best-time-to-buy-and-sell-stock-v': {
    python: `class Solution:
    def maximumProfit(self, prices: List[int], k: int) -> int:
        n = len(prices)
        NEG = float('-inf')
        hold_long = [NEG] * (k + 1)
        hold_short = [NEG] * (k + 1)
        cash = [0] * (k + 1)
        for p in prices:
            for t in range(k, 0, -1):
                cash[t] = max(cash[t], hold_long[t] + p, hold_short[t] - p)
                hold_long[t] = max(hold_long[t], cash[t - 1] - p)
                hold_short[t] = max(hold_short[t], cash[t - 1] + p)
        return max(cash)`,
  },

  'binary-prefix-divisible-by-5': {
    python: `class Solution:
    def prefixesDivBy5(self, nums: List[int]) -> List[bool]:
        res = []
        cur = 0
        for b in nums:
            cur = (cur * 2 + b) % 5
            res.append(cur == 0)
        return res`,
  },

  'binary-string-with-substrings-representing-1-to-n': {
    python: `class Solution:
    def queryString(self, s: str, n: int) -> bool:
        return all(bin(i)[2:] in s for i in range(1, n + 1))`,
  },

  'binary-tree-coloring-game': {
    python: `class Solution:
    def btreeGameWinningMove(self, root: TreeNode, n: int, x: int) -> bool:
        self.left = self.right = 0
        def count(node):
            if not node:
                return 0
            l = count(node.left)
            r = count(node.right)
            if node.val == x:
                self.left = l
                self.right = r
            return l + r + 1
        count(root)
        parent = n - self.left - self.right - 1
        half = n // 2
        return parent > half or self.left > half or self.right > half`,
  },

  'binary-tree-maximum-path-sum': {
    python: `class Solution:
    def maxPathSum(self, root: List[int]) -> int:
        nodes = root
        n = len(nodes)
        children = {}
        idx = 1
        for i in range(n):
            if nodes[i] is None:
                continue
            l = r = None
            if idx < n:
                if nodes[idx] is not None:
                    l = idx
                idx += 1
            if idx < n:
                if nodes[idx] is not None:
                    r = idx
                idx += 1
            children[i] = (l, r)
        self.best = float('-inf')
        def gain(i):
            if i is None:
                return 0
            l, r = children.get(i, (None, None))
            lg = max(gain(l), 0)
            rg = max(gain(r), 0)
            self.best = max(self.best, nodes[i] + lg + rg)
            return nodes[i] + max(lg, rg)
        if n == 0 or nodes[0] is None:
            return 0
        gain(0)
        return self.best`,
  },

  'binary-tree-paths': {
    python: `class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:
        res = []
        def dfs(node, path):
            if not node:
                return
            path = path + [str(node.val)]
            if not node.left and not node.right:
                res.append('->'.join(path))
                return
            dfs(node.left, path)
            dfs(node.right, path)
        dfs(root, [])
        return res`,
  },

  'binary-tree-postorder-traversal': {
    python: `class Solution:
    def postorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def dfs(node):
            if not node:
                return
            dfs(node.left)
            dfs(node.right)
            res.append(node.val)
        dfs(root)
        return res`,
  },

  'binary-trees-with-factors': {
    python: `class Solution:
    def numFactoredBinaryTrees(self, arr: List[int]) -> int:
        MOD = 10**9 + 7
        arr.sort()
        dp = {}
        for i, v in enumerate(arr):
            total = 1
            for j in range(i):
                f = arr[j]
                if v % f == 0 and (v // f) in dp:
                    total += dp[f] * dp[v // f]
            dp[v] = total % MOD
        return sum(dp.values()) % MOD`,
  },

  'bitwise-or-of-even-numbers-in-an-array': {
    python: `class Solution:
    def evenNumberBitwiseORs(self, nums: List[int]) -> int:
        res = 0
        for v in nums:
            if v % 2 == 0:
                res |= v
        return res`,
  },

  'bitwise-ors-of-subarrays': {
    python: `class Solution:
    def subarrayBitwiseORs(self, arr: List[int]) -> int:
        res = set()
        cur = set()
        for v in arr:
            cur = {v | x for x in cur} | {v}
            res |= cur
        return len(res)`,
  },

  'bitwise-xor-of-all-pairings': {
    python: `class Solution:
    def xorAllNums(self, nums1: List[int], nums2: List[int]) -> int:
        res = 0
        if len(nums2) % 2 == 1:
            for v in nums1:
                res ^= v
        if len(nums1) % 2 == 1:
            for v in nums2:
                res ^= v
        return res`,
  },

  'block-placement-queries': {
    python: `import bisect
class Solution:
    def getResults(self, queries: List[List[int]]) -> List[bool]:
        obstacles = []
        res = []
        for q in queries:
            if q[0] == 1:
                bisect.insort(obstacles, q[1])
            else:
                _, x, sz = q
                idx = bisect.bisect_right(obstacles, x)
                prev = 0
                gap = 0
                ok = False
                for i in range(idx):
                    if obstacles[i] - prev >= sz:
                        ok = True
                        break
                    prev = obstacles[i]
                if not ok and x - prev >= sz:
                    ok = True
                res.append(ok)
        return res`,
  },

  'break-a-palindrome': {
    python: `class Solution:
    def breakPalindrome(self, palindrome: str) -> str:
        n = len(palindrome)
        if n == 1:
            return ""
        chars = list(palindrome)
        for i in range(n // 2):
            if chars[i] != 'a':
                chars[i] = 'a'
                return ''.join(chars)
        chars[-1] = 'b'
        return ''.join(chars)`,
  },

  'brace-expansion-ii': {
    python: `class Solution:
    def braceExpansionII(self, expression: str) -> List[str]:
        def parse(s, i):
            groups = [set()]
            cur = {""}
            while i < len(s):
                c = s[i]
                if c == '{':
                    inner, i = parse(s, i + 1)
                    cur = {a + b for a in cur for b in inner}
                elif c == '}':
                    i += 1
                    break
                elif c == ',':
                    groups.append(cur)
                    cur = {""}
                    i += 1
                else:
                    cur = {a + c for a in cur}
                    i += 1
            groups.append(cur)
            result = set()
            for g in groups:
                result |= g
            return result, i
        res, _ = parse(expression, 0)
        return sorted(res)`,
  },

  'brick-wall': {
    python: `from collections import defaultdict
class Solution:
    def leastBricks(self, wall: List[List[int]]) -> int:
        edges = defaultdict(int)
        for row in wall:
            pos = 0
            for b in row[:-1]:
                pos += b
                edges[pos] += 1
        most = max(edges.values()) if edges else 0
        return len(wall) - most`,
  },

  'bricks-falling-when-hit': {
    python: `class Solution:
    def hitBricks(self, grid: List[List[int]], hits: List[List[int]]) -> List[int]:
        m, n = len(grid), len(grid[0])
        g = [row[:] for row in grid]
        for r, c in hits:
            g[r][c] = 0
        parent = list(range(m * n + 1))
        size = [1] * (m * n + 1)
        TOP = m * n
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
                size[rb] += size[ra]
        def idx(r, c):
            return r * n + c
        for c in range(n):
            if g[0][c] == 1:
                union(idx(0, c), TOP)
        for r in range(m):
            for c in range(n):
                if g[r][c] == 1:
                    if r > 0 and g[r-1][c] == 1:
                        union(idx(r, c), idx(r-1, c))
                    if c > 0 and g[r][c-1] == 1:
                        union(idx(r, c), idx(r, c-1))
        res = [0] * len(hits)
        dirs = [(-1,0),(1,0),(0,-1),(0,1)]
        for k in range(len(hits) - 1, -1, -1):
            r, c = hits[k]
            if grid[r][c] == 0:
                continue
            before = size[find(TOP)]
            g[r][c] = 1
            if r == 0:
                union(idx(r, c), TOP)
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and g[nr][nc] == 1:
                    union(idx(r, c), idx(nr, nc))
            after = size[find(TOP)]
            res[k] = max(0, after - before - 1)
        return res`,
  },

  'broken-calculator': {
    python: `class Solution:
    def brokenCalc(self, startValue: int, target: int) -> int:
        ops = 0
        while target > startValue:
            if target % 2 == 0:
                target //= 2
            else:
                target += 1
            ops += 1
        return ops + (startValue - target)`,
  },

  'build-an-array-with-stack-operations': {
    python: `class Solution:
    def buildArray(self, target: List[int], n: int) -> List[str]:
        res = []
        cur = 1
        for t in target:
            while cur < t:
                res.append("Push")
                res.append("Pop")
                cur += 1
            res.append("Push")
            cur += 1
        return res`,
  },

  'build-array-from-permutation': {
    python: `class Solution:
    def buildArray(self, nums: List[int]) -> List[int]:
        return [nums[nums[i]] for i in range(len(nums))]`,
  },

  'build-array-where-you-can-find-the-maximum-exactly-k-comparisons': {
    python: `class Solution:
    def numOfArrays(self, n: int, m: int, k: int) -> int:
        MOD = 10**9 + 7
        if k == 0:
            return 0
        dp = [[0] * (k + 1) for _ in range(m + 1)]
        for v in range(1, m + 1):
            dp[v][1] = 1
        for length in range(2, n + 1):
            ndp = [[0] * (k + 1) for _ in range(m + 1)]
            prefix = [[0] * (k + 1) for _ in range(m + 1)]
            for v in range(1, m + 1):
                for c in range(k + 1):
                    prefix[v][c] = (prefix[v-1][c] + dp[v][c]) % MOD
            for v in range(1, m + 1):
                for c in range(1, k + 1):
                    val = (dp[v][c] * v) % MOD
                    val = (val + prefix[v-1][c-1]) % MOD
                    ndp[v][c] = val
            dp = ndp
        return sum(dp[v][k] for v in range(1, m + 1)) % MOD`,
  },

  'building-boxes': {
    python: `class Solution:
    def minimumBoxes(self, n: int) -> int:
        total = 0
        floor = 0
        k = 0
        while total < n:
            k += 1
            floor += k
            total += floor
        total -= floor
        floor -= k
        removed = floor
        add = 0
        i = 0
        while total < n:
            i += 1
            total += i
            add += 1
        return removed + add`,
  },
};
