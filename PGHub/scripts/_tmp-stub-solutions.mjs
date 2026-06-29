// Authored Python solutions for stub slice [0,50). method body in LeetCode class shape.
// Signatures match STORED param order (positional binding), not LC names.

export const SOLUTIONS = {

// checkArithmeticSubarrays(nums, l, r) -> List[bool]
'arithmetic-subarrays': `class Solution:
    def checkArithmeticSubarrays(self, nums: List[int], l: List[int], r: List[int]) -> List[bool]:
        res = []
        for a, b in zip(l, r):
            sub = sorted(nums[a:b+1])
            if len(sub) <= 2:
                res.append(True)
                continue
            d = sub[1] - sub[0]
            ok = all(sub[i+1] - sub[i] == d for i in range(len(sub)-1))
            res.append(ok)
        return res`,

// averageOfLevels(root: List[Optional[int]]) -> List[float]  (root passed as a list)
'average-of-levels-in-binary-tree': `class Solution:
    def averageOfLevels(self, root: List[Optional[int]]) -> List[float]:
        from collections import deque
        if not root:
            return []
        # build level structure directly from the level-order list with nulls
        res = []
        # rebuild tree
        vals = root
        nodes = [TreeNode(vals[0]) if vals[0] is not None else None]
        i = 1
        q = deque([nodes[0]])
        while q and i < len(vals):
            node = q.popleft()
            if node is None:
                continue
            if i < len(vals):
                lv = vals[i]; i += 1
                node.left = TreeNode(lv) if lv is not None else None
                q.append(node.left)
            if i < len(vals):
                rv = vals[i]; i += 1
                node.right = TreeNode(rv) if rv is not None else None
                q.append(node.right)
        root_node = nodes[0]
        q = deque([root_node]) if root_node else deque()
        while q:
            n = len(q)
            s = 0
            for _ in range(n):
                node = q.popleft()
                s += node.val
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
            res.append(s / n)
        return res`,

// avoidFlood(input: List[int]) -> List[int]
'avoid-flood-in-the-city': `class Solution:
    def avoidFlood(self, input: List[int]) -> List[int]:
        import bisect
        rains = input
        ans = [-1] * len(rains)
        full = {}
        dry = []
        for i, lake in enumerate(rains):
            if lake == 0:
                bisect.insort(dry, i)
            else:
                if lake in full:
                    j = bisect.bisect_right(dry, full[lake])
                    if j == len(dry):
                        return []
                    day = dry.pop(j)
                    ans[day] = lake
                full[lake] = i
                ans[i] = -1
        for d in dry:
            ans[d] = 1
        return ans`,

// balanceBST(root: List[int]) -> Any  (returns level-order list of balanced BST)
'balance-a-binary-search-tree': `class Solution:
    def balanceBST(self, root: List[int]) -> Any:
        from collections import deque
        vals = root
        if not vals:
            return []
        n0 = TreeNode(vals[0]) if vals[0] is not None else None
        i = 1
        q = deque([n0])
        while q and i < len(vals):
            node = q.popleft()
            if node is None:
                continue
            if i < len(vals):
                lv = vals[i]; i += 1
                node.left = TreeNode(lv) if lv is not None else None
                q.append(node.left)
            if i < len(vals):
                rv = vals[i]; i += 1
                node.right = TreeNode(rv) if rv is not None else None
                q.append(node.right)
        order = []
        def inorder(nd):
            if not nd: return
            inorder(nd.left); order.append(nd.val); inorder(nd.right)
        inorder(n0)
        def build(lo, hi):
            if lo > hi: return None
            mid = (lo + hi) // 2
            nd = TreeNode(order[mid])
            nd.left = build(lo, mid-1)
            nd.right = build(mid+1, hi)
            return nd
        bal = build(0, len(order)-1)
        # serialize level-order trimming trailing nulls
        out = []
        q = deque([bal])
        while q:
            nd = q.popleft()
            if nd is None:
                out.append(None)
            else:
                out.append(nd.val)
                q.append(nd.left); q.append(nd.right)
        while out and out[-1] is None:
            out.pop()
        return out`,

// isBalanced(root: Optional[TreeNode]) -> bool  (driver passes a TreeNode)
'balanced-binary-tree': `class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        def h(node):
            if not node:
                return 0
            l = h(node.left)
            if l == -1: return -1
            r = h(node.right)
            if r == -1: return -1
            if abs(l - r) > 1: return -1
            return max(l, r) + 1
        return h(root) != -1`,

// minDifference(nums: int, target: int) -> List[int]  k-factor decomposition
'balanced-k-factor-decomposition': `class Solution:
    def minDifference(self, nums: int, target: int) -> List[int]:
        n, k = nums, target
        best = [None]
        bestspread = [float('inf')]
        def factors(x):
            fs = []
            d = 2
            while d * d <= x:
                if x % d == 0:
                    fs.append(d)
                    if d != x // d:
                        fs.append(x // d)
                d += 1
            return sorted(fs)
        def rec(rem, count, path):
            if count == 1:
                seq = path + [rem]
                spread = max(seq) - min(seq)
                if spread < bestspread[0]:
                    bestspread[0] = spread
                    best[0] = sorted(seq)
                return
            start = path[-1] if path else 2
            for f in factors(rem):
                if f < start:
                    continue
                if rem % f == 0:
                    rec(rem // f, count - 1, path + [f])
        rec(n, k, [])
        return best[0] if best[0] is not None else []`,

// countBattleships(input: List[List[str]]) -> int
'battleships-in-a-board': `class Solution:
    def countBattleships(self, input: List[List[str]]) -> int:
        board = input
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

// countArrangement(input: int) -> int
'beautiful-arrangement': `class Solution:
    def countArrangement(self, input: int) -> int:
        n = input
        used = [False] * (n + 1)
        def dfs(pos):
            if pos > n:
                return 1
            total = 0
            for v in range(1, n + 1):
                if not used[v] and (v % pos == 0 or pos % v == 0):
                    used[v] = True
                    total += dfs(pos + 1)
                    used[v] = False
            return total
        return dfs(1)`,

// constructArray(nums: int, target: int) -> List[int]
'beautiful-arrangement-ii': `class Solution:
    def constructArray(self, nums: int, target: int) -> List[int]:
        n, k = nums, target
        res = []
        lo, hi = 1, n
        for i in range(k):
            if i % 2 == 0:
                res.append(lo); lo += 1
            else:
                res.append(hi); hi -= 1
        if k % 2 == 0:
            for v in range(hi, lo - 1, -1):
                res.append(v)
        else:
            for v in range(lo, hi + 1):
                res.append(v)
        return res`,

// maximumSumOfHeights(input: List[int]) -> int
'beautiful-towers-i': `class Solution:
    def maximumSumOfHeights(self, input: List[int]) -> int:
        maxH = input
        n = len(maxH)
        best = 0
        for peak in range(n):
            total = maxH[peak]
            cur = maxH[peak]
            for i in range(peak - 1, -1, -1):
                cur = min(cur, maxH[i])
                total += cur
            cur = maxH[peak]
            for i in range(peak + 1, n):
                cur = min(cur, maxH[i])
                total += cur
            best = max(best, total)
        return best`,

// bestHand(nums: List[int], target: List[str]) -> str  (ranks, suits)
'best-poker-hand': `class Solution:
    def bestHand(self, nums: List[int], target: List[str]) -> str:
        from collections import Counter
        ranks, suits = nums, target
        if len(set(suits)) == 1:
            return "Flush"
        rc = Counter(ranks)
        mx = max(rc.values())
        if mx >= 3:
            return "Three of a Kind"
        if mx == 2:
            return "Pair"
        return "High Card"`,

// bestTower(nums, target, k) -> List[int]
'best-reachable-tower': `class Solution:
    def bestTower(self, nums: List[List[int]], target: List[int], k: int) -> List[int]:
        towers = nums
        sx, sy = target
        best = None
        besth = -1
        for x, y, h in towers:
            if abs(x - sx) + abs(y - sy) <= k:
                if h > besth or (h == besth and (best is None or [x, y] < best)):
                    besth = h
                    best = [x, y]
        return best if best is not None else [-1, -1]`,

// bestTeamScore(nums: scores, target: ages) -> int
'best-team-with-no-conflicts': `class Solution:
    def bestTeamScore(self, nums: List[int], target: List[int]) -> int:
        scores, ages = nums, target
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

// best-time-to-buy-and-sell-stock-using-strategy maxProfit(prices, strategy, k) -> int
'best-time-to-buy-and-sell-stock-using-strategy': `class Solution:
    def maxProfit(self, nums: List[int], target: List[int], k: int) -> int:
        prices, strategy = nums, target
        n = len(prices)
        base = sum(strategy[i] * prices[i] for i in range(n))
        # prefix of strategy[i]*prices[i] and prefix of prices
        pref_sp = [0] * (n + 1)
        pref_p = [0] * (n + 1)
        for i in range(n):
            pref_sp[i+1] = pref_sp[i] + strategy[i] * prices[i]
            pref_p[i+1] = pref_p[i] + prices[i]
        best = base
        for i in range(0, n - k + 1):
            # window [i, i+k): first k/2 hold(0), last k/2 buy(+price)
            removed = pref_sp[i+k] - pref_sp[i]
            half = k // 2
            added = pref_p[i+k] - pref_p[i+half]
            best = max(best, base - removed + added)
        return best`,

// best-time-to-buy-and-sell-stock-v maximumProfit(prices, k) -> int (k transactions, long or short)
'best-time-to-buy-and-sell-stock-v': `class Solution:
    def maximumProfit(self, nums: List[int], target: int) -> int:
        prices, k = nums, target
        n = len(prices)
        NEG = float('-inf')
        # states: 0 none, 1 long-open, 2 short-open ; dp[t][state]
        dp = [[NEG, NEG, NEG] for _ in range(k + 1)]
        for t in range(k + 1):
            dp[t][0] = 0
        for p in prices:
            ndp = [row[:] for row in dp]
            for t in range(k + 1):
                # open long: from none state, consume a transaction now (count on open)
                if t >= 1 and dp[t-1][0] != NEG:
                    ndp[t][1] = max(ndp[t][1], dp[t-1][0] - p)
                    ndp[t][2] = max(ndp[t][2], dp[t-1][0] + p)
                # close long
                if dp[t][1] != NEG:
                    ndp[t][0] = max(ndp[t][0], dp[t][1] + p)
                # close short
                if dp[t][2] != NEG:
                    ndp[t][0] = max(ndp[t][0], dp[t][2] - p)
            dp = ndp
        return max(dp[t][0] for t in range(k + 1))`,

// prefixesDivBy5(input: List[int]) -> List[bool]
'binary-prefix-divisible-by-5': `class Solution:
    def prefixesDivBy5(self, input: List[int]) -> List[bool]:
        res = []
        cur = 0
        for b in input:
            cur = (cur * 2 + b) % 5
            res.append(cur == 0)
        return res`,

// queryString(nums: str, target: int) -> bool
'binary-string-with-substrings-representing-1-to-n': `class Solution:
    def queryString(self, nums: str, target: int) -> bool:
        s, n = nums, target
        for i in range(1, n + 1):
            if bin(i)[2:] not in s:
                return False
        return True`,

// btreeGameWinningMove(root: TreeNode, n, x) -> bool
'binary-tree-coloring-game': `class Solution:
    def btreeGameWinningMove(self, root: Optional[TreeNode], n: int, x: int) -> bool:
        self.left = 0
        self.right = 0
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
        parent = n - 1 - self.left - self.right
        half = n // 2
        return max(self.left, self.right, parent) > half`,

// maxPathSum(root: List[int]) -> int  (root passed as list)
'binary-tree-maximum-path-sum': `class Solution:
    def maxPathSum(self, root: List[int]) -> int:
        from collections import deque
        vals = root
        if not vals:
            return 0
        n0 = TreeNode(vals[0]) if vals[0] is not None else None
        i = 1
        q = deque([n0])
        while q and i < len(vals):
            node = q.popleft()
            if node is None:
                continue
            if i < len(vals):
                lv = vals[i]; i += 1
                node.left = TreeNode(lv) if lv is not None else None
                q.append(node.left)
            if i < len(vals):
                rv = vals[i]; i += 1
                node.right = TreeNode(rv) if rv is not None else None
                q.append(node.right)
        self.best = float('-inf')
        def gain(node):
            if not node:
                return 0
            l = max(gain(node.left), 0)
            r = max(gain(node.right), 0)
            self.best = max(self.best, node.val + l + r)
            return node.val + max(l, r)
        gain(n0)
        return self.best`,

// binaryTreePaths(root: Optional[TreeNode]) -> List[str]
'binary-tree-paths': `class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:
        res = []
        def dfs(node, path):
            if not node:
                return
            path = path + [str(node.val)]
            if not node.left and not node.right:
                res.append("->".join(path))
                return
            dfs(node.left, path)
            dfs(node.right, path)
        dfs(root, [])
        return res`,

// postorderTraversal(root: Optional[TreeNode]) -> List[int]
'binary-tree-postorder-traversal': `class Solution:
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

// numFactoredBinaryTrees(root: List[int]) -> int
'binary-trees-with-factors': `class Solution:
    def numFactoredBinaryTrees(self, root: List[int]) -> int:
        arr = sorted(root)
        MOD = 10**9 + 7
        dp = {}
        s = set(arr)
        for x in arr:
            total = 1
            for f in arr:
                if f >= x:
                    break
                if x % f == 0 and (x // f) in dp:
                    total += dp[f] * dp[x // f]
            dp[x] = total
        return sum(dp.values()) % MOD`,

// evenNumberBitwiseORs(nums: List[int]) -> int
'bitwise-or-of-even-numbers-in-an-array': `class Solution:
    def evenNumberBitwiseORs(self, nums: List[int]) -> int:
        res = 0
        for x in nums:
            if x % 2 == 0:
                res |= x
        return res`,

// subarrayBitwiseORs(nums: List[int]) -> int  (count distinct ORs)
'bitwise-ors-of-subarrays': `class Solution:
    def subarrayBitwiseORs(self, nums: List[int]) -> int:
        res = set()
        cur = set()
        for x in nums:
            cur = {x | y for y in cur} | {x}
            res |= cur
        return len(res)`,

// xorAllNums(nums, target) -> int
'bitwise-xor-of-all-pairings': `class Solution:
    def xorAllNums(self, nums: List[int], target: List[int]) -> int:
        a, b = nums, target
        res = 0
        if len(b) % 2 == 1:
            for x in a:
                res ^= x
        if len(a) % 2 == 1:
            for y in b:
                res ^= y
        return res`,

// braceExpansionII(expression: str) -> List[str]
'brace-expansion-ii': `class Solution:
    def braceExpansionII(self, expression: str) -> List[str]:
        def parse(s, i):
            # returns (set_of_strings, next_index); parses a union expression
            union = []
            cur = ['']
            while i < len(s) and s[i] != '}':
                c = s[i]
                if c == '{':
                    sub, i = parse(s, i + 1)
                    i += 1  # skip closing '}'
                    cur = [a + b for a in cur for b in sub]
                elif c == ',':
                    union.extend(cur)
                    cur = ['']
                    i += 1
                else:
                    cur = [a + c for a in cur]
                    i += 1
            union.extend(cur)
            return set(union), i
        res, _ = parse(expression, 0)
        return sorted(res)`,

// breakPalindrome(palindrome: str) -> str
'break-a-palindrome': `class Solution:
    def breakPalindrome(self, palindrome: str) -> str:
        s = palindrome
        n = len(s)
        if n < 2:
            return ""
        arr = list(s)
        for i in range(n // 2):
            if arr[i] != 'a':
                arr[i] = 'a'
                return "".join(arr)
        arr[-1] = 'b'
        return "".join(arr)`,

// leastBricks(input: List[List[int]]) -> int
'brick-wall': `class Solution:
    def leastBricks(self, input: List[List[int]]) -> int:
        from collections import defaultdict
        wall = input
        edges = defaultdict(int)
        for row in wall:
            pos = 0
            for b in row[:-1]:
                pos += b
                edges[pos] += 1
        most = max(edges.values()) if edges else 0
        return len(wall) - most`,

// hitBricks(nums: grid, target: hits) -> List[int]
'bricks-falling-when-hit': `class Solution:
    def hitBricks(self, nums: List[List[int]], target: List[List[int]]) -> List[int]:
        grid = [row[:] for row in nums]
        hits = target
        m, n = len(grid), len(grid[0])
        for r, c in hits:
            grid[r][c] -= 1
        parent = {}
        rank = {}
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra == rb: return
            parent[ra] = rb
            size[rb] += size[ra]
        TOP = (m * n)
        size = {}
        for i in range(m * n + 1):
            parent[i] = i
            size[i] = 0
        def idx(r, c): return r * n + c
        for r in range(m):
            for c in range(n):
                if grid[r][c] == 1:
                    size[idx(r, c)] = 1
        # connect stable bricks
        for r in range(m):
            for c in range(n):
                if grid[r][c] == 1:
                    if r == 0:
                        union(idx(r, c), TOP)
                    if r > 0 and grid[r-1][c] == 1:
                        union(idx(r, c), idx(r-1, c))
                    if c > 0 and grid[r][c-1] == 1:
                        union(idx(r, c), idx(r, c-1))
        def top_size():
            return size[find(TOP)]
        res = [0] * len(hits)
        dirs = [(1,0),(-1,0),(0,1),(0,-1)]
        for i in range(len(hits) - 1, -1, -1):
            r, c = hits[i]
            grid[r][c] += 1
            if grid[r][c] != 1:
                continue
            prev = top_size()
            # re-add this brick
            size[idx(r, c)] = 1
            # union with neighbors
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == 1:
                    union(idx(r, c), idx(nr, nc))
            if r == 0:
                union(idx(r, c), TOP)
            now = top_size()
            res[i] = max(0, now - prev - 1)
        return res`,

// brokenCalc(nums: startValue, target) -> int
'broken-calculator': `class Solution:
    def brokenCalc(self, nums: int, target: int) -> int:
        x, y = nums, target
        ops = 0
        while y > x:
            if y % 2 == 0:
                y //= 2
            else:
                y += 1
            ops += 1
        return ops + (x - y)`,

// buildMatrix(nums: k, target: rowConditions, k: colConditions) -> Any
'build-a-matrix-with-conditions': `class Solution:
    def buildMatrix(self, nums: int, target: List[List[int]], k: List[List[int]]) -> Any:
        k_size = nums
        rowConditions = target
        colConditions = k
        def topo(conds):
            from collections import defaultdict, deque
            adj = defaultdict(set)
            indeg = {i: 0 for i in range(1, k_size + 1)}
            for a, b in conds:
                if b not in adj[a]:
                    adj[a].add(b)
                    indeg[b] += 1
            q = deque([x for x in range(1, k_size + 1) if indeg[x] == 0])
            order = []
            while q:
                u = q.popleft()
                order.append(u)
                for v in adj[u]:
                    indeg[v] -= 1
                    if indeg[v] == 0:
                        q.append(v)
            return order if len(order) == k_size else None
        ro = topo(rowConditions)
        co = topo(colConditions)
        if ro is None or co is None:
            return []
        rowpos = {v: i for i, v in enumerate(ro)}
        colpos = {v: i for i, v in enumerate(co)}
        mat = [[0] * k_size for _ in range(k_size)]
        for v in range(1, k_size + 1):
            mat[rowpos[v]][colpos[v]] = v
        return mat`,

// buildArray(nums: target, target: n) -> List[str]  build-an-array-with-stack-operations
'build-an-array-with-stack-operations': `class Solution:
    def buildArray(self, nums: List[int], target: int) -> List[str]:
        res = []
        cur = 1
        for x in nums:
            while cur < x:
                res.append("Push")
                res.append("Pop")
                cur += 1
            res.append("Push")
            cur += 1
        return res`,

// buildArray(nums: List[int]) -> List[int]  build-array-from-permutation
'build-array-from-permutation': `class Solution:
    def buildArray(self, nums: List[int]) -> List[int]:
        return [nums[nums[i]] for i in range(len(nums))]`,

// numOfArrays(nums: n, target: m, k: k) -> int
'build-array-where-you-can-find-the-maximum-exactly-k-comparisons': `class Solution:
    def numOfArrays(self, nums: int, target: int, k: int) -> int:
        n, m = nums, target
        MOD = 10**9 + 7
        # dp[i][j][c] = ways for arrays of length i, max value j, cost c
        # optimize: dp over length with running
        dp = [[0] * (k + 1) for _ in range(m + 1)]
        for j in range(1, m + 1):
            dp[j][1] = 1
        for i in range(2, n + 1):
            ndp = [[0] * (k + 1) for _ in range(m + 1)]
            # prefix sums over j for each c
            for c in range(1, k + 1):
                pref = 0
                for j in range(1, m + 1):
                    # ways where new max is j and cost c: either stays max j (j choices) with cost c, or new max j with cost c-1 from smaller max
                    val = (dp[j][c] * j) % MOD
                    val = (val + pref) % MOD  # sum dp[1..j-1][c-1]
                    ndp[j][c] = val
                    pref = (pref + dp[j][c - 1]) % MOD
            dp = ndp
        return sum(dp[j][k] for j in range(1, m + 1)) % MOD`,

// minimumBoxes(input: int) -> int
'building-boxes': `class Solution:
    def minimumBoxes(self, input: int) -> int:
        n = input
        total = 0   # boxes placed so far
        floor = 0   # boxes touching the floor
        k = 0       # current complete triangular layer count
        # build complete pyramid while it still fits
        while total + (k + 1) * (k + 2) // 2 <= n:
            k += 1
            total += k * (k + 1) // 2
            floor += k
        # add boxes one floor-cell at a time; the i-th added floor box can
        # support a column of height i (1+2+...) before another floor box is needed
        i = 0
        while total < n:
            i += 1
            floor += 1
            total += i
        return floor`,

};
