// Authored Python canonicals for stub-targets slice [450,500).
// Keyed by problem id (== slug). Each value is the FULL class Solution source.
// The harness binds params POSITIONALLY by stored order+type, so each `def`
// is written against the stored param order (DB param NAMES may be garbled).

export default {
  // displayTable(orders) -> List[List[str]]. header Table + foods sorted; rows by
  // table number numerically; each cell = count of that food at that table.
  'display-table-of-food-orders-in-a-restaurant': `class Solution:
    def displayTable(self, orders: List[List[str]]) -> List[List[str]]:
        from collections import defaultdict
        foods = set()
        tables = defaultdict(lambda: defaultdict(int))
        for _name, table, food in orders:
            foods.add(food)
            tables[int(table)][food] += 1
        food_list = sorted(foods)
        res = [['Table'] + food_list]
        for t in sorted(tables):
            row = [str(t)] + [str(tables[t][f]) for f in food_list]
            res.append(row)
        return res`,

  // isWinner(player1, player2) -> int. value 2*x if a 10 in prev 2 turns else x.
  'determine-the-winner-of-a-bowling-game': `class Solution:
    def isWinner(self, player1: List[int], player2: List[int]) -> int:
        def score(p):
            t = 0
            for i, x in enumerate(p):
                if (i >= 1 and p[i - 1] == 10) or (i >= 2 and p[i - 2] == 10):
                    t += 2 * x
                else:
                    t += x
            return t
        s1, s2 = score(player1), score(player2)
        if s1 > s2:
            return 1
        if s2 > s1:
            return 2
        return 0`,

  // findRotation(mat, target) -> bool. try 0/90/180/270 rotations.
  'determine-whether-matrix-can-be-obtained-by-rotation': `class Solution:
    def findRotation(self, mat: List[List[int]], target: List[List[int]]) -> bool:
        def rot(m):
            return [list(row) for row in zip(*m[::-1])]
        cur = mat
        for _ in range(4):
            if cur == target:
                return True
            cur = rot(cur)
        return False`,

  // maximumDetonation(bombs) -> int. directed graph: i reaches j if j in i's radius.
  'detonate-the-maximum-bombs': `class Solution:
    def maximumDetonation(self, bombs: List[List[int]]) -> int:
        n = len(bombs)
        adj = [[] for _ in range(n)]
        for i in range(n):
            xi, yi, ri = bombs[i]
            for j in range(n):
                if i == j:
                    continue
                xj, yj, _ = bombs[j]
                if (xi - xj) ** 2 + (yi - yj) ** 2 <= ri * ri:
                    adj[i].append(j)
        best = 0
        for s in range(n):
            seen = [False] * n
            seen[s] = True
            stack = [s]
            cnt = 1
            while stack:
                u = stack.pop()
                for v in adj[u]:
                    if not seen[v]:
                        seen[v] = True
                        cnt += 1
                        stack.append(v)
            best = max(best, cnt)
        return best`,

  // findDiagonalOrder(mat) -> List[int]. zig-zag diagonal traversal.
  'diagonal-traverse': `class Solution:
    def findDiagonalOrder(self, mat: List[List[int]]) -> List[int]:
        if not mat or not mat[0]:
            return []
        m, n = len(mat), len(mat[0])
        res = []
        for d in range(m + n - 1):
            if d % 2 == 0:
                r = min(d, m - 1)
                c = d - r
                while r >= 0 and c < n:
                    res.append(mat[r][c])
                    r -= 1
                    c += 1
            else:
                c = min(d, n - 1)
                r = d - c
                while c >= 0 and r < m:
                    res.append(mat[r][c])
                    r += 1
                    c -= 1
        return res`,

  // findDiagonalOrder(nums) -> List[int]. jagged: group by i+j, emit larger-i first.
  'diagonal-traverse-ii': `class Solution:
    def findDiagonalOrder(self, nums: List[List[int]]) -> List[int]:
        from collections import defaultdict
        groups = defaultdict(list)
        for i, row in enumerate(nums):
            for j, v in enumerate(row):
                groups[i + j].append(v)
        res = []
        for d in sorted(groups):
            res.extend(reversed(groups[d]))
        return res`,

  // dieSimulator(n, rollMax) -> int. dp[i][last][run]; sum mod 1e9+7.
  'dice-roll-simulation': `class Solution:
    def dieSimulator(self, n: int, rollMax: List[int]) -> int:
        MOD = 10 ** 9 + 7
        # dp[face][run] = sequences of current length ending with run consecutive face
        dp = [[0] * (rollMax[f] + 1) for f in range(6)]
        for f in range(6):
            dp[f][1] = 1
        for _ in range(n - 1):
            ndp = [[0] * (rollMax[f] + 1) for f in range(6)]
            for f in range(6):
                total_f = sum(dp[f]) % MOD
                for g in range(6):
                    if g == f:
                        continue
                    # appending face g (run resets to 1) onto any seq ending in f
                    ndp[g][1] = (ndp[g][1] + total_f) % MOD
                for run in range(1, rollMax[f]):
                    ndp[f][run + 1] = (ndp[f][run + 1] + dp[f][run]) % MOD
            dp = ndp
        ans = 0
        for f in range(6):
            ans = (ans + sum(dp[f])) % MOD
        return ans`,

  // differenceOfSum(nums) -> int. |sum(nums) - sum of digits|.
  'difference-between-element-sum-and-digit-sum-of-an-array': `class Solution:
    def differenceOfSum(self, nums: List[int]) -> int:
        elem = sum(nums)
        digit = sum(int(c) for x in nums for c in str(x))
        return abs(elem - digit)`,

  // maxOutput(n, edges, price) -> int. tree; answer = max over roots of
  // (max root-path sum - that path's min endpoint). Reroot DP: for each node keep
  // best downward path WITH and WITHOUT its leaf-endpoint price. Standard: the cost
  // equals the max path that starts at the root, minus price[root] (one endpoint).
  // Equivalent: max over all nodes u of the longest weighted path from u where one
  // end (a leaf) drops its price -> = max( withLeaf, withoutLeaf ) two-pass tree dp.
  'difference-between-maximum-and-minimum-price-sum': `import sys
class Solution:
    def maxOutput(self, n: int, edges: List[List[int]], price: List[int]) -> int:
        sys.setrecursionlimit(300000)
        g = [[] for _ in range(n)]
        for a, b in edges:
            g[a].append(b)
            g[b].append(a)
        self.ans = 0
        # returns (maxWithAllNodes, maxWithoutLeaf) for paths going DOWN from node
        def dfs(node, parent):
            # withLeaf: path sum including a leaf endpoint's price (full sum down)
            # withoutLeaf: path sum excluding the deepest leaf's price
            withLeaf = price[node]
            withoutLeaf = 0
            for nei in g[node]:
                if nei == parent:
                    continue
                cWith, cWithout = dfs(nei, node)
                # combine two branches: one keeps leaf, other drops it
                self.ans = max(self.ans, withLeaf + cWithout, withoutLeaf + cWith)
                withLeaf = max(withLeaf, cWith + price[node])
                withoutLeaf = max(withoutLeaf, cWithout + price[node])
            return withLeaf, withoutLeaf
        dfs(0, -1)
        return self.ans`,

  // onesMinusZeros(grid) -> List[List[int]]. diff[i][j]=2*onesRow+2*onesCol-m-n.
  'difference-between-ones-and-zeros-in-row-and-column': `class Solution:
    def onesMinusZeros(self, grid: List[List[int]]) -> List[List[int]]:
        m, n = len(grid), len(grid[0])
        onesRow = [sum(grid[i]) for i in range(m)]
        onesCol = [sum(grid[i][j] for i in range(m)) for j in range(n)]
        res = [[0] * n for _ in range(m)]
        for i in range(m):
            for j in range(n):
                res[i][j] = 2 * onesRow[i] + 2 * onesCol[j] - m - n
        return res`,

  // differenceOfDistinctValues(grid) -> List[List[int]]. NOTE: stored return type
  // says str but expected is a matrix-string. We compute the matrix; serialization
  // handles it. abs(distinct leftAbove - distinct rightBelow) per cell.
  'difference-of-number-of-distinct-values-on-diagonals': `class Solution:
    def differenceOfDistinctValues(self, grid):
        m, n = len(grid), len(grid[0])
        ans = [[0] * n for _ in range(m)]
        for i in range(m):
            for j in range(n):
                left = set()
                r, c = i - 1, j - 1
                while r >= 0 and c >= 0:
                    left.add(grid[r][c])
                    r -= 1
                    c -= 1
                right = set()
                r, c = i + 1, j + 1
                while r < m and c < n:
                    right.add(grid[r][c])
                    r += 1
                    c += 1
                ans[i][j] = abs(len(left) - len(right))
        return ans`,

  // diffWaysToCompute(expression) -> List[int]. divide & conquer at each operator.
  'different-ways-to-add-parentheses': `from functools import lru_cache
class Solution:
    def diffWaysToCompute(self, expression: str) -> List[int]:
        @lru_cache(maxsize=None)
        def solve(expr):
            if expr.isdigit():
                return [int(expr)]
            res = []
            for i, ch in enumerate(expr):
                if ch in '+-*':
                    left = solve(expr[:i])
                    right = solve(expr[i + 1:])
                    for a in left:
                        for b in right:
                            if ch == '+':
                                res.append(a + b)
                            elif ch == '-':
                                res.append(a - b)
                            else:
                                res.append(a * b)
            return res
        return solve(expression)`,

  // minOperations(n, m) -> int. Dijkstra over non-prime numbers of same digit-len;
  // edge: change one digit by +-1; cost accumulates the value stepped onto.
  'digit-operations-to-make-two-integers-equal': `import heapq
class Solution:
    def minOperations(self, n: int, m: int) -> int:
        s = str(n)
        L = len(s)
        lo = 10 ** (L - 1) if L > 1 else 0
        hi = 10 ** L - 1
        limit = hi + 1
        sieve = [True] * limit
        sieve[0] = sieve[1] = False
        i = 2
        while i * i < limit:
            if sieve[i]:
                for j in range(i * i, limit, i):
                    sieve[j] = False
            i += 1
        is_prime = lambda x: x < limit and sieve[x]
        if is_prime(n) or is_prime(m):
            return -1
        dist = {n: n}
        pq = [(n, n)]
        while pq:
            d, cur = heapq.heappop(pq)
            if cur == m:
                return d
            if d > dist.get(cur, float('inf')):
                continue
            ds = list(str(cur))
            for idx in range(len(ds)):
                orig = int(ds[idx])
                for delta in (-1, 1):
                    nd = orig + delta
                    if nd < 0 or nd > 9:
                        continue
                    if idx == 0 and nd == 0 and L > 1:
                        continue
                    ds[idx] = str(nd)
                    nxt = int(''.join(ds))
                    ds[idx] = str(orig)
                    if is_prime(nxt):
                        continue
                    ndist = d + nxt
                    if ndist < dist.get(nxt, float('inf')):
                        dist[nxt] = ndist
                        heapq.heappush(pq, (ndist, nxt))
        return -1`,

  // countVisiblePeople(n, pos, k) -> int. left side has `pos` people, right has
  // n-1-pos. Choose a of left to be 'L' (visible) and b of right to be 'R' with
  // a+b=k; the rest are free. C(left,a)*C(right,b)*2^(others), summed; mod 1e9+7.
  'direction-assignments-with-exactly-k-visible-people': `from math import comb
class Solution:
    def countVisiblePeople(self, n: int, pos: int, k: int) -> int:
        MOD = 10 ** 9 + 7
        left = pos
        right = n - 1 - pos
        total = 0
        for a in range(0, left + 1):
            b = k - a
            if b < 0 or b > right:
                continue
            # choose which a of the left are 'L' (visible) and which b of the right
            # are 'R'; the remaining left/right are forced to the non-visible side.
            ways = comb(left, a) % MOD
            ways = ways * (comb(right, b) % MOD) % MOD
            total = (total + ways) % MOD
        # the person at pos chooses freely (does not affect visibility)
        return total * 2 % MOD`,

  // isPossibleToCutPath(grid) -> bool. Two monotone paths; if any interior cell is
  // a cut vertex of all (0,0)->(m-1,n-1) monotone paths, answer True. Run DFS twice
  // marking the path; if a single cell (not endpoints) lies on every path, removable.
  'disconnect-path-in-a-binary-matrix-by-at-most-one-flip': `import sys
class Solution:
    def isPossibleToCutPath(self, grid: List[List[int]]) -> bool:
        sys.setrecursionlimit(300000)
        m, n = len(grid), len(grid[0])
        def dfs(i, j):
            if i >= m or j >= n or grid[i][j] == 0:
                return False
            if i == m - 1 and j == n - 1:
                return True
            grid[i][j] = 0  # block to prevent reuse
            found = dfs(i + 1, j) or dfs(i, j + 1)
            if not (i == 0 and j == 0):
                grid[i][j] = 0
            else:
                grid[i][j] = 1
            return found
        if not dfs(0, 0):
            return True
        grid[0][0] = 1
        grid[m - 1][n - 1] = 1
        if not dfs(0, 0):
            return True
        return False`,

  // rearrangeBarcodes(barcodes) -> List[int]. fill most-frequent into even then odd.
  'distant-barcodes': `from collections import Counter
class Solution:
    def rearrangeBarcodes(self, barcodes: List[int]) -> List[int]:
        n = len(barcodes)
        order = [v for v, _ in Counter(barcodes).most_common()]
        seq = []
        for v in order:
            seq.extend([v] * barcodes.count(v))
        # cleaner: rebuild by counts
        cnt = Counter(barcodes)
        ordered = []
        for v in sorted(cnt, key=lambda x: -cnt[x]):
            ordered.extend([v] * cnt[v])
        res = [0] * n
        idx = 0
        for i in range(0, n, 2):
            res[i] = ordered[idx]
            idx += 1
        for i in range(1, n, 2):
            res[i] = ordered[idx]
            idx += 1
        return res`,

  // distinctPoints(s, k) -> int. removing window [i,i+k) shifts endpoint by the
  // window's net displacement; collect distinct resulting endpoints.
  'distinct-points-reachable-after-substring-removal': `class Solution:
    def distinctPoints(self, s: str, k: int) -> int:
        mv = {'U': (0, 1), 'D': (0, -1), 'L': (-1, 0), 'R': (1, 0)}
        n = len(s)
        # full displacement
        fx = sum(mv[c][0] for c in s)
        fy = sum(mv[c][1] for c in s)
        # window displacement, sliding
        wx = sum(mv[s[i]][0] for i in range(k))
        wy = sum(mv[s[i]][1] for i in range(k))
        seen = set()
        seen.add((fx - wx, fy - wy))
        for i in range(k, n):
            wx += mv[s[i]][0] - mv[s[i - k]][0]
            wy += mv[s[i]][1] - mv[s[i - k]][1]
            seen.add((fx - wx, fy - wy))
        return len(seen)`,

  // distinctPrimeFactors(nums) -> int. union of prime factors over all elements.
  'distinct-prime-factors-of-product-of-array': `class Solution:
    def distinctPrimeFactors(self, nums: List[int]) -> int:
        primes = set()
        for x in nums:
            d = 2
            while d * d <= x:
                while x % d == 0:
                    primes.add(d)
                    x //= d
                d += 1
            if x > 1:
                primes.add(x)
        return len(primes)`,

  // distinctSubseqII(s) -> int. dp; subtract last contribution of each char. mod.
  'distinct-subsequences-ii': `class Solution:
    def distinctSubseqII(self, s: str) -> int:
        MOD = 10 ** 9 + 7
        dp = 0
        last = {}
        for ch in s:
            prev = dp
            dp = (2 * dp + 1) % MOD
            if ch in last:
                dp = (dp - last[ch]) % MOD
            last[ch] = (prev + 1) % MOD
        return dp % MOD`,

  // distributeCandies(n, limit) -> int. inclusion-exclusion on 3 children <= limit.
  'distribute-candies-among-children-i': `class Solution:
    def distributeCandies(self, n: int, limit: int) -> int:
        from math import comb
        def ways(total):
            if total < 0:
                return 0
            return comb(total + 2, 2)
        L = limit + 1
        res = ways(n) - 3 * ways(n - L) + 3 * ways(n - 2 * L) - ways(n - 3 * L)
        return res`,

  // distributeCandies(n, limit) -> int. same inclusion-exclusion, large bounds ok.
  'distribute-candies-among-children-ii': `class Solution:
    def distributeCandies(self, n: int, limit: int) -> int:
        def ways(total):
            if total < 0:
                return 0
            return (total + 2) * (total + 1) // 2
        L = limit + 1
        return ways(n) - 3 * ways(n - L) + 3 * ways(n - 2 * L) - ways(n - 3 * L)`,

  // distributeCandies(candies, num_people) -> List[int]. give 1,2,3,... in turn.
  'distribute-candies-to-people': `class Solution:
    def distributeCandies(self, candies: int, num_people: int) -> List[int]:
        res = [0] * num_people
        give = 1
        i = 0
        while candies > 0:
            amt = min(give, candies)
            res[i % num_people] += amt
            candies -= amt
            give += 1
            i += 1
        return res`,

  // distributeCoins(root) -> int. tree balance; abs(excess) accumulates moves.
  // root param is the level-order array; build the tree first.
  'distribute-coins-in-binary-tree': `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
class Solution:
    def distributeCoins(self, root) -> int:
        # root may arrive as a level-order list (with None) or a TreeNode.
        if isinstance(root, list):
            root = build_tree(root)
        self.moves = 0
        def dfs(node):
            if not node:
                return 0
            left = dfs(node.left)
            right = dfs(node.right)
            self.moves += abs(left) + abs(right)
            return node.val + left + right - 1
        dfs(root)
        return self.moves
def build_tree(arr):
    if not arr or arr[0] is None:
        return None
    from collections import deque
    root = TreeNode(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root`,

  // resultArray(nums) -> List[int]. simulate two arrays by last-element rule.
  'distribute-elements-into-two-arrays-i': `class Solution:
    def resultArray(self, nums: List[int]) -> List[int]:
        arr1 = [nums[0]]
        arr2 = [nums[1]]
        for x in nums[2:]:
            if arr1[-1] > arr2[-1]:
                arr1.append(x)
            else:
                arr2.append(x)
        return arr1 + arr2`,

  // resultArray(nums) -> List[int]. Fenwick on compressed values for greaterCount.
  'distribute-elements-into-two-arrays-ii': `import bisect
class Solution:
    def resultArray(self, nums: List[int]) -> List[int]:
        sorted_vals = sorted(set(nums))
        sz = len(sorted_vals)
        def rank(v):
            return bisect.bisect_left(sorted_vals, v) + 1
        class BIT:
            def __init__(self, n):
                self.n = n
                self.t = [0] * (n + 1)
            def add(self, i, d=1):
                while i <= self.n:
                    self.t[i] += d
                    i += i & (-i)
            def query(self, i):
                s = 0
                while i > 0:
                    s += self.t[i]
                    i -= i & (-i)
                return s
        b1, b2 = BIT(sz), BIT(sz)
        arr1 = [nums[0]]
        arr2 = [nums[1]]
        b1.add(rank(nums[0]))
        b2.add(rank(nums[1]))
        for x in nums[2:]:
            r = rank(x)
            g1 = b1.query(sz) - b1.query(r)
            g2 = b2.query(sz) - b2.query(r)
            if g1 > g2:
                arr1.append(x); b1.add(r)
            elif g1 < g2:
                arr2.append(x); b2.add(r)
            else:
                if len(arr1) <= len(arr2):
                    arr1.append(x); b1.add(r)
                else:
                    arr2.append(x); b2.add(r)
        return arr1 + arr2`,

  // distMoney(money, children) -> int. greedy max children getting exactly 8.
  'distribute-money-to-maximum-children': `class Solution:
    def distMoney(self, money: int, children: int) -> int:
        if money < children:
            return -1
        money -= children  # give everyone 1 first
        eights = min(money // 7, children)
        money -= eights * 7
        children -= eights
        # if leftover money but no children, give it to a child with 8 (so < eights)
        if children == 0 and money > 0:
            eights -= 1
        # if exactly one child left with 3 dollars (would make 4) -> reduce
        elif children == 1 and money == 3:
            eights -= 1
        return max(eights, 0)`,

  // canDistribute(nums, quantity) -> bool. <=50 unique counts; subset-sum dp over
  // customer masks vs each value's count.
  'distribute-repeating-integers': `from collections import Counter
class Solution:
    def canDistribute(self, nums: List[int], quantity: List[int]) -> bool:
        counts = sorted(Counter(nums).values(), reverse=True)
        m = len(quantity)
        full = 1 << m
        # subset sums of quantity
        subSum = [0] * full
        for mask in range(full):
            s = 0
            for i in range(m):
                if mask & (1 << i):
                    s += quantity[i]
            subSum[mask] = s
        # dp[mask] = can satisfy customer-set mask using counts processed so far
        dp = [False] * full
        dp[0] = True
        for cnt in counts:
            ndp = dp[:]
            for mask in range(full):
                if not dp[mask]:
                    continue
                rem = (full - 1) ^ mask
                sub = rem
                while sub > 0:
                    if subSum[sub] <= cnt:
                        ndp[mask | sub] = True
                    sub = (sub - 1) & rem
            dp = ndp
            if dp[full - 1]:
                return True
        return dp[full - 1]`,

  // divideString(s, k, fill) -> List[str]. chunk into size k, pad last with fill.
  'divide-a-string-into-groups-of-size-k': `class Solution:
    def divideString(self, s: str, k: int, fill: str) -> List[str]:
        res = []
        for i in range(0, len(s), k):
            chunk = s[i:i + k]
            if len(chunk) < k:
                chunk += fill * (k - len(chunk))
            res.append(chunk)
        return res`,

  // minimumCost(nums) -> int. nums[0] + two smallest of nums[1:].
  'divide-an-array-into-subarrays-with-minimum-cost-i': `class Solution:
    def minimumCost(self, nums: List[int]) -> int:
        rest = sorted(nums[1:])
        return nums[0] + rest[0] + rest[1]`,

  // minimumCost(nums, k, dist) -> int. nums[0] fixed; pick k-1 starts from a window
  // of length dist+1; maintain k-1 smallest via two heaps as the window slides.
  'divide-an-array-into-subarrays-with-minimum-cost-ii': `import heapq
from collections import defaultdict
class Solution:
    def minimumCost(self, nums: List[int], k: int, dist: int) -> int:
        # nums[0] is always the first subarray's cost. Choose k-1 more split starts
        # i1<...<i_{k-1} from indices [1, n-1] with i_{k-1}-i1 <= dist, minimizing
        # sum(nums[i]). Slide a window of width dist+1 over candidate indices and
        # keep the (k-1) smallest values inside it via two heaps + lazy deletion.
        n = len(nums)
        need = k - 1
        small = []          # max-heap (negated): the need smallest in window
        big = []            # min-heap: the rest of the window
        small_sum = 0
        removed = defaultdict(int)
        in_small = set()

        def clean(h):
            while h and removed[h[0][1]] > 0:
                _, idx = heapq.heappop(h)
                removed[idx] -= 1

        def rebalance():
            nonlocal small_sum
            clean(small); clean(big)
            while len(in_small) < need and big:
                clean(big)
                if not big:
                    break
                v, idx = heapq.heappop(big)
                small_sum += v
                in_small.add(idx)
                heapq.heappush(small, (-v, idx))
            while len(in_small) > need:
                clean(small)
                nv, idx = heapq.heappop(small)
                small_sum += nv  # nv is negative
                in_small.discard(idx)
                heapq.heappush(big, (-nv, idx))

        def add(idx):
            nonlocal small_sum
            v = nums[idx]
            clean(small)
            if len(in_small) < need or (small and v < -small[0][0]):
                small_sum += v
                in_small.add(idx)
                heapq.heappush(small, (-v, idx))
            else:
                heapq.heappush(big, (v, idx))
            rebalance()

        def remove(idx):
            nonlocal small_sum
            removed[idx] += 1
            if idx in in_small:
                in_small.discard(idx)
                small_sum -= nums[idx]
            rebalance()

        best = float('inf')
        for r in range(1, n):
            add(r)
            out = r - dist - 1
            if out >= 1:
                remove(out)
            if len(in_small) == need:
                best = min(best, small_sum)
        if need == 0:
            best = 0
        return nums[0] + best`,

  // minGroups(intervals) -> int. max overlap = sort starts/ends, sweep.
  'divide-intervals-into-minimum-number-of-groups': `class Solution:
    def minGroups(self, intervals: List[List[int]]) -> int:
        starts = sorted(i[0] for i in intervals)
        ends = sorted(i[1] for i in intervals)
        i = j = 0
        active = best = 0
        n = len(intervals)
        while i < n:
            if starts[i] <= ends[j]:
                active += 1
                best = max(best, active)
                i += 1
            else:
                active -= 1
                j += 1
        return best`,

  // magnificentSets(n, edges) -> int. each connected component must be bipartite;
  // answer = sum over components of max BFS layering (diameter+1). -1 if any odd cycle.
  'divide-nodes-into-the-maximum-number-of-groups': `from collections import deque
class Solution:
    def magnificentSets(self, n: int, edges: List[List[int]]) -> int:
        g = [[] for _ in range(n + 1)]
        for a, b in edges:
            g[a].append(b)
            g[b].append(a)
        comp = [0] * (n + 1)
        comps = []
        cid = 0
        for s in range(1, n + 1):
            if comp[s] == 0:
                cid += 1
                nodes = []
                comp[s] = cid
                q = deque([s])
                while q:
                    u = q.popleft()
                    nodes.append(u)
                    for v in g[u]:
                        if comp[v] == 0:
                            comp[v] = cid
                            q.append(v)
                comps.append(nodes)
        def bfs_layers(src):
            dist = {src: 0}
            q = deque([src])
            maxd = 0
            while q:
                u = q.popleft()
                for v in g[u]:
                    if v not in dist:
                        dist[v] = dist[u] + 1
                        maxd = max(maxd, dist[v])
                        q.append(v)
                    elif abs(dist[v] - dist[u]) != 1:
                        return -1
            return maxd + 1
        total = 0
        for nodes in comps:
            best = -1
            for src in nodes:
                layers = bfs_layers(src)
                if layers == -1:
                    return -1
                best = max(best, layers)
            total += best
        return total`,

  // dividePlayers(skill) -> int. sort; pair i with n-1-i; all pairs equal sum.
  'divide-players-into-teams-of-equal-skill': `class Solution:
    def dividePlayers(self, skill: List[int]) -> int:
        skill.sort()
        n = len(skill)
        target = skill[0] + skill[-1]
        total = 0
        i, j = 0, n - 1
        while i < j:
            if skill[i] + skill[j] != target:
                return -1
            total += skill[i] * skill[j]
            i += 1
            j -= 1
        return total`,

  // differenceOfSums(n, m) -> int. total sum - 2*(sum divisible by m).
  'divisible-and-non-divisible-sums-difference': `class Solution:
    def differenceOfSums(self, n: int, m: int) -> int:
        total = n * (n + 1) // 2
        k = n // m
        div = m * k * (k + 1) // 2
        return total - 2 * div`,

  // doubleIt(head) -> List[int]. head is a value list; double the number it forms.
  'double-a-number-represented-as-a-linked-list': `class Solution:
    def doubleIt(self, head: List[int]) -> List[int]:
        num = 0
        for d in head:
            num = num * 10 + d
        num *= 2
        s = str(num)
        return [int(c) for c in s]`,

  // getGoodIndices(variables, target) -> List[int]. ((a^b%10)^c)%m == target.
  'double-modular-exponentiation': `class Solution:
    def getGoodIndices(self, variables: List[List[int]], target: int) -> List[int]:
        res = []
        for i, (a, b, c, m) in enumerate(variables):
            inner = pow(a, b, 10)
            val = pow(inner, c, m)
            if val == target:
                res.append(i)
        return res`,

  // earliestFinishTime(landStartTime, landDuration, waterStartTime, waterDuration)
  // -> int. min over orderings: do one category then the other.
  'earliest-finish-time-for-land-and-water-rides-i': `class Solution:
    def earliestFinishTime(self, landStartTime, landDuration, waterStartTime, waterDuration) -> int:
        land = [landStartTime[i] + landDuration[i] for i in range(len(landStartTime))]
        water = [waterStartTime[i] + waterDuration[i] for i in range(len(waterStartTime))]
        earliest_land = min(land)
        earliest_water = min(water)
        # land then water
        a = min(max(earliest_land, waterStartTime[j]) + waterDuration[j] for j in range(len(waterStartTime)))
        # water then land
        b = min(max(earliest_water, landStartTime[i]) + landDuration[i] for i in range(len(landStartTime)))
        return min(a, b)`,
};
