// Authored Python canonicals for stub-targets slice [890,950).
// Keyed by problem id (== slug). Each value is the FULL class Solution source.
// The harness binds params POSITIONALLY by stored order+type, so each `def`
// is written against the stored param order (DB param NAMES may be garbled).

export default {
  // kthLargestLevelSum(root, k) -> int. root is a level-order list with nulls.
  // sum each tree level, return kth largest level-sum (-1 if <k levels).
  'kth-largest-sum-in-a-binary-tree': `from collections import deque
class Solution:
    def kthLargestLevelSum(self, root: List[int], k: int) -> int:
        if not root or root[0] is None:
            return -1
        # build children from level-order array with explicit nulls
        n = len(root)
        # BFS over the array representation
        sums = []
        idx = 1
        level = [0]  # indices into root for current level
        while level:
            s = 0
            nxt = []
            for i in level:
                if root[i] is None:
                    continue
                s += root[i]
                # children are next two non-consumed slots in array order
            sums.append(s)
            # advance: collect children indices
            children = []
            for i in level:
                if root[i] is None:
                    continue
                if idx < n:
                    children.append(idx); idx += 1
                if idx < n:
                    children.append(idx); idx += 1
            level = [c for c in children if c < n and root[c] is not None]
        sums.sort(reverse=True)
        if k > len(sums):
            return -1
        return sums[k - 1]`,

  // findKthSmallest(coins, k) -> int. kth smallest number divisible by at least
  // one coin. Binary search on value + inclusion-exclusion over coin LCMs.
  'kth-smallest-amount-with-single-denomination-combination': `from math import gcd
from itertools import combinations
class Solution:
    def findKthSmallest(self, coins: List[int], k: int) -> int:
        n = len(coins)
        # precompute signed LCM subsets via inclusion-exclusion
        subs = []
        for r in range(1, n + 1):
            for comb in combinations(coins, r):
                l = 1
                for c in comb:
                    l = l * c // gcd(l, c)
                subs.append((l, 1 if r % 2 == 1 else -1))
        def count(x):
            t = 0
            for l, sign in subs:
                t += sign * (x // l)
            return t
        lo, hi = 1, min(coins) * k
        while lo < hi:
            mid = (lo + hi) // 2
            if count(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo`,

  // kthSmallestPath(destination, k) -> str. destination=[row,col]; lexicographic
  // (H<V) kth path using row down-moves 'V' and col right-moves 'H'.
  'kth-smallest-instructions': `from math import comb
class Solution:
    def kthSmallestPath(self, destination: List[int], k: int) -> str:
        v, h = destination
        res = []
        for _ in range(v + h):
            if h == 0:
                res.append('V'); v -= 1
                continue
            if v == 0:
                res.append('H'); h -= 1
                continue
            # number of paths if we place 'H' now: remaining choose (v among h-1+v)
            ways = comb(h - 1 + v, v)
            if k <= ways:
                res.append('H'); h -= 1
            else:
                res.append('V'); v -= 1; k -= ways
        return ''.join(res)`,

  // findKthNumber(m, n, k) -> int. kth smallest in m x n multiplication table.
  'kth-smallest-number-in-multiplication-table': `class Solution:
    def findKthNumber(self, m: int, n: int, k: int) -> int:
        def count(x):
            t = 0
            for i in range(1, m + 1):
                t += min(x // i, n)
            return t
        lo, hi = 1, m * n
        while lo < hi:
            mid = (lo + hi) // 2
            if count(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo`,

  // kthSmallest(par, vals, queries) -> List[int]. tree rooted at 0; path XOR sum
  // root->node. For each [u,k] return kth smallest DISTINCT path-XOR in subtree(u).
  'kth-smallest-path-xor-sum': `class Solution:
    def kthSmallest(self, par: List[int], vals: List[int], queries: List[List[int]]) -> List[int]:
        n = len(vals)
        children = [[] for _ in range(n)]
        for i in range(n):
            if par[i] != -1:
                children[par[i]].append(i)
        pathxor = [0] * n
        pathxor[0] = vals[0]
        stack = [0]
        while stack:
            u = stack.pop()
            for c in children[u]:
                pathxor[c] = pathxor[u] ^ vals[c]
                stack.append(c)
        subtree = [None] * n
        st = [(0, False)]
        while st:
            u, processed = st.pop()
            if processed:
                s = {pathxor[u]}
                for c in children[u]:
                    s |= subtree[c]
                subtree[u] = s
            else:
                st.append((u, True))
                for c in children[u]:
                    st.append((c, False))
        res = []
        for u, k in queries:
            arr = sorted(subtree[u]) if subtree[u] is not None else []
            res.append(arr[k - 1] if 1 <= k <= len(arr) else -1)
        return res`,

  // kthSmallestProduct(nums1, nums2, k) -> int. kth smallest product over all pairs.
  'kth-smallest-product-of-two-sorted-arrays': `from bisect import bisect_right, bisect_left
class Solution:
    def kthSmallestProduct(self, nums1: List[int], nums2: List[int], k: int) -> int:
        n2 = nums2
        pos = [x for x in n2 if x > 0]
        neg = [x for x in n2 if x < 0]
        zero = sum(1 for x in n2 if x == 0)
        def count(target):
            # number of products <= target
            c = 0
            for a in nums1:
                if a > 0:
                    # a*y <= target -> y <= target/a
                    import math
                    lim = math.floor(target / a)
                    c += bisect_right(n2, lim)
                elif a < 0:
                    import math
                    lim = math.ceil(target / a)
                    c += len(n2) - bisect_left(n2, lim)
                else:
                    if target >= 0:
                        c += len(n2)
            return c
        lo, hi = -10**18, 10**18
        while lo < hi:
            mid = (lo + hi) // 2
            if count(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo`,

  // largestPathValue(colors, edges) -> int. directed graph; max count of a single
  // color along any path. -1 if a cycle exists (topological DP).
  'largest-color-value-in-a-directed-graph': `from collections import deque
class Solution:
    def largestPathValue(self, colors: str, edges: List[List[int]]) -> int:
        n = len(colors)
        g = [[] for _ in range(n)]
        indeg = [0] * n
        for a, b in edges:
            g[a].append(b)
            indeg[b] += 1
        cnt = [[0] * 26 for _ in range(n)]
        q = deque(i for i in range(n) if indeg[i] == 0)
        seen = 0
        best = 0
        while q:
            u = q.popleft()
            seen += 1
            ci = ord(colors[u]) - 97
            cnt[u][ci] += 1
            best = max(best, cnt[u][ci])
            for v in g[u]:
                for c in range(26):
                    if cnt[u][c] > cnt[v][c]:
                        cnt[v][c] = cnt[u][c]
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        return best if seen == n else -1`,

  // largestCombination(candidates) -> int. max subset whose AND > 0 = max count
  // of numbers sharing any single bit.
  'largest-combination-with-bitwise-and-greater-than-zero': `class Solution:
    def largestCombination(self, candidates: List[int]) -> int:
        best = 0
        for b in range(32):
            c = sum(1 for x in candidates if x & (1 << b))
            best = max(best, c)
        return best`,

  // largestComponentSize(nums) -> int. union by shared prime factor; largest group.
  'largest-component-size-by-common-factor': `class Solution:
    def largestComponentSize(self, nums: List[int]) -> int:
        mx = max(nums)
        parent = list(range(mx + 1))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        for x in nums:
            v = x
            f = 2
            while f * f <= v:
                if v % f == 0:
                    union(x, f)
                    while v % f == 0:
                        v //= f
                f += 1
            if v > 1:
                union(x, v)
        from collections import Counter
        c = Counter(find(x) for x in nums)
        return max(c.values())`,

  // maxArrayValue(nums) -> int. from right, if nums[i] <= nums[i+1] merge (sum).
  'largest-element-in-an-array-after-merge-operations': `class Solution:
    def maxArrayValue(self, nums: List[int]) -> int:
        cur = nums[-1]
        for i in range(len(nums) - 2, -1, -1):
            if nums[i] <= cur:
                cur += nums[i]
            else:
                cur = nums[i]
        return cur`,

  // largestEven(s) -> str. rearrange digits to largest even number; "" if none.
  // (based on samples: "1112"->"1112", "221"->"22", "1"->"")
  'largest-even-number': `class Solution:
    def largestEven(self, s: str) -> str:
        for i in range(len(s) - 1, -1, -1):
            if int(s[i]) % 2 == 0:
                return s[:i + 1]
        return ""`,

  // largestLocal(grid) -> List[List[int]]. (n-2)x(n-2) of max in each 3x3 block.
  'largest-local-values-in-a-matrix': `class Solution:
    def largestLocal(self, grid: List[List[int]]) -> List[List[int]]:
        n = len(grid)
        res = [[0] * (n - 2) for _ in range(n - 2)]
        for i in range(n - 2):
            for j in range(n - 2):
                res[i][j] = max(grid[i + di][j + dj] for di in range(3) for dj in range(3))
        return res`,

  // countLocalMaximums(matrix) -> int. count cells that are the strict-or-equal max
  // of their 3x3 neighbourhood (clamped at edges). Matches samples.
  'largest-local-values-in-a-matrix-ii': `class Solution:
    def countLocalMaximums(self, matrix: List[List[int]]) -> int:
        n = len(matrix)
        m = len(matrix[0])
        cnt = 0
        for i in range(n):
            for j in range(m):
                v = matrix[i][j]
                if v <= 0:
                    continue
                is_max = True
                for di in (-1, 0, 1):
                    for dj in (-1, 0, 1):
                        if di == 0 and dj == 0:
                            continue
                        ni, nj = i + di, j + dj
                        if 0 <= ni < n and 0 <= nj < m and matrix[ni][nj] > v:
                            is_max = False
                            break
                    if not is_max:
                        break
                if is_max:
                    cnt += 1
        return cnt`,

  // largestInteger(num) -> int. swap digits sharing parity to maximise.
  'largest-number-after-digit-swaps-by-parity': `class Solution:
    def largestInteger(self, num: int) -> int:
        digits = [int(c) for c in str(num)]
        odd = sorted((d for d in digits if d % 2 == 1), reverse=True)
        even = sorted((d for d in digits if d % 2 == 0), reverse=True)
        oi = ei = 0
        res = []
        for d in digits:
            if d % 2 == 1:
                res.append(odd[oi]); oi += 1
            else:
                res.append(even[ei]); ei += 1
        return int(''.join(map(str, res)))`,

  // maximumNumber(num, change) -> str. mutate one contiguous substring d->change[d]
  // to maximise the number.
  'largest-number-after-mutating-substring': `class Solution:
    def maximumNumber(self, num: str, change: List[int]) -> str:
        s = list(num)
        started = False
        for i, c in enumerate(s):
            d = int(c)
            if change[d] > d:
                s[i] = str(change[d])
                started = True
            elif change[d] < d:
                if started:
                    break
            else:
                if started:
                    continue
        return ''.join(s)`,

  // largestOddNumber(num) -> str. longest prefix ending in an odd digit.
  'largest-odd-number-in-string': `class Solution:
    def largestOddNumber(self, num: str) -> str:
        for i in range(len(num) - 1, -1, -1):
            if int(num[i]) % 2 == 1:
                return num[:i + 1]
        return ""`,

  // largestPalindrome(n) -> int. largest palindrome that is product of two n-digit
  // numbers, returned in full (samples: n=2->987, n=1->9).
  'largest-palindrome-product': `class Solution:
    def largestPalindrome(self, n: int) -> int:
        if n == 1:
            return 9
        hi = 10 ** n - 1
        lo = 10 ** (n - 1)
        for a in range(hi, lo - 1, -1):
            s = str(a)
            cand = int(s + s[::-1])
            j = hi
            while j * j >= cand:
                if cand % j == 0 and lo <= cand // j <= hi:
                    return cand % 1337
                j -= 1
        return 9`,

  // largestPalindromic(num) -> str. largest palindrome formable from digits of num,
  // no leading zero (unless "0"). samples: "444947137"->"7449447","00009"->"9".
  'largest-palindromic-number': `from collections import Counter
class Solution:
    def largestPalindromic(self, num: str) -> str:
        cnt = Counter(num)
        half = []
        mid = ''
        for d in '9876543210':
            c = cnt.get(d, 0)
            half.append(d * (c // 2))
            if c % 2 and mid == '':
                mid = d
        first = ''.join(half)
        first = first.lstrip('0')
        if first == '':
            return mid if mid else '0'
        return first + mid + first[::-1]`,

  // orderOfLargestPlusSign(n, mines) -> int. largest plus sign of 1s in n x n grid.
  'largest-plus-sign': `class Solution:
    def orderOfLargestPlusSign(self, n: int, mines: List[List[int]]) -> int:
        mine = set((r, c) for r, c in mines)
        dp = [[0] * n for _ in range(n)]
        for i in range(n):
            cnt = 0
            for j in range(n):
                cnt = 0 if (i, j) in mine else cnt + 1
                dp[i][j] = cnt
            cnt = 0
            for j in range(n - 1, -1, -1):
                cnt = 0 if (i, j) in mine else cnt + 1
                dp[i][j] = min(dp[i][j], cnt)
        best = 0
        for j in range(n):
            cnt = 0
            for i in range(n):
                cnt = 0 if (i, j) in mine else cnt + 1
                dp[i][j] = min(dp[i][j], cnt)
            cnt = 0
            for i in range(n - 1, -1, -1):
                cnt = 0 if (i, j) in mine else cnt + 1
                dp[i][j] = min(dp[i][j], cnt)
                best = max(best, dp[i][j])
        return best`,

  // findMaxK(nums) -> int. largest k where both k and -k present, else -1.
  'largest-positive-integer-that-exists-with-its-negative': `class Solution:
    def findMaxK(self, nums: List[int]) -> int:
        s = set(nums)
        best = -1
        for x in nums:
            if x > 0 and -x in s:
                best = max(best, x)
        return best`,

  // largestPrime(n) -> int. largest prime <= n expressible as a sum of consecutive
  // primes starting from 2; 0 if none. (samples n=20->17, n=2->2)
  'largest-prime-from-consecutive-prime-sum': `class Solution:
    def largestPrime(self, n: int) -> int:
        if n < 2:
            return 0
        sieve = [True] * (n + 1)
        sieve[0] = sieve[1] = False
        for i in range(2, int(n ** 0.5) + 1):
            if sieve[i]:
                for j in range(i * i, n + 1, i):
                    sieve[j] = False
        primes = [i for i in range(2, n + 1) if sieve[i]]
        best = 0
        s = 0
        for p in primes:
            s += p
            if s > n:
                break
            if sieve[s]:
                best = s
        return best`,

  // largestSubmatrix(matrix) -> int. columns can be reordered; max area rectangle
  // of 1s after building heights then sorting each row's heights descending.
  'largest-submatrix-with-rearrangements': `class Solution:
    def largestSubmatrix(self, matrix: List[List[int]]) -> int:
        n = len(matrix)
        m = len(matrix[0])
        for j in range(m):
            for i in range(1, n):
                if matrix[i][j]:
                    matrix[i][j] += matrix[i - 1][j]
        best = 0
        for i in range(n):
            row = sorted(matrix[i], reverse=True)
            for k, h in enumerate(row):
                best = max(best, h * (k + 1))
        return best`,

  // largestValsFromLabels(values, labels, numWanted, useLimit) -> int.
  'largest-values-from-labels': `from collections import defaultdict
class Solution:
    def largestValsFromLabels(self, values: List[int], labels: List[int], numWanted: int, useLimit: int) -> int:
        pairs = sorted(zip(values, labels), reverse=True)
        used = defaultdict(int)
        total = 0
        chosen = 0
        for v, l in pairs:
            if chosen >= numWanted:
                break
            if used[l] < useLimit:
                total += v
                used[l] += 1
                chosen += 1
        return total`,

  // latestDayToCross(row, col, cells) -> int. cells flood in order; last day top
  // row still connects to bottom row through land. Binary search + BFS/DSU.
  'last-day-where-you-can-still-cross': `from collections import deque
class Solution:
    def latestDayToCross(self, row: int, col: int, cells: List[List[int]]) -> int:
        def can(day):
            grid = [[0] * col for _ in range(row)]
            for r, c in cells[:day]:
                grid[r - 1][c - 1] = 1
            q = deque()
            seen = [[False] * col for _ in range(row)]
            for c in range(col):
                if grid[0][c] == 0:
                    q.append((0, c)); seen[0][c] = True
            while q:
                r, c = q.popleft()
                if r == row - 1:
                    return True
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < row and 0 <= nc < col and not seen[nr][nc] and grid[nr][nc] == 0:
                        seen[nr][nc] = True
                        q.append((nr, nc))
            return False
        lo, hi = 1, len(cells)
        ans = 0
        while lo <= hi:
            mid = (lo + hi) // 2
            if can(mid):
                ans = mid; lo = mid + 1
            else:
                hi = mid - 1
        return ans`,

  // getLastMoment(n, left, right) -> int. ants pass through; max distance to fall.
  'last-moment-before-all-ants-fall-out-of-a-plank': `class Solution:
    def getLastMoment(self, n: int, left: List[int], right: List[int]) -> int:
        best = 0
        for x in left:
            best = max(best, x)
        for x in right:
            best = max(best, n - x)
        return best`,

  // lastInteger(n) -> int. write 1..n; alternately delete every second from left,
  // then from right, until one remains. (samples n=8->3, n=5->1, n=1->1)
  'last-remaining-integer-after-alternating-deletion-operations': `class Solution:
    def lastInteger(self, n: int) -> int:
        a = list(range(1, n + 1))
        left = True
        while len(a) > 1:
            if left:
                a = a[0::2]
            else:
                r = a[::-1][0::2]
                a = r[::-1]
            left = not left
        return a[0]`,

  // lastSubstring(s) -> str. lexicographically largest suffix.
  'last-substring-in-lexicographical-order': `class Solution:
    def lastSubstring(self, s: str) -> str:
        i, j, k = 0, 1, 0
        n = len(s)
        while j + k < n:
            if s[i + k] == s[j + k]:
                k += 1
            elif s[i + k] < s[j + k]:
                i = max(i + k + 1, j)
                j = i + 1
                k = 0
            else:
                j = j + k + 1
                k = 0
        return s[i:]`,

  // maximumTime(time) -> str. 24h "HH:MM" with '?'; latest valid.
  'latest-time-by-replacing-hidden-digits': `class Solution:
    def maximumTime(self, time: str) -> str:
        t = list(time)
        if t[0] == '?':
            t[0] = '2' if (t[1] in '?0123') else '1'
        if t[1] == '?':
            t[1] = '3' if t[0] == '2' else '9'
        if t[3] == '?':
            t[3] = '5'
        if t[4] == '?':
            t[4] = '9'
        return ''.join(t)`,

  // findLatestTime(s) -> str. 12h "HH:MM" HH 00..11, MM 00..59 with '?'; latest.
  'latest-time-you-can-obtain-after-replacing-characters': `class Solution:
    def findLatestTime(self, s: str) -> str:
        t = list(s)
        if t[0] == '?':
            t[0] = '1' if (t[1] in '?01') else '0'
        if t[1] == '?':
            t[1] = '1' if t[0] == '1' else '9'
        if t[3] == '?':
            t[3] = '5'
        if t[4] == '?':
            t[4] = '9'
        return ''.join(t)`,

  // leafSimilar(root1, root2) -> bool. compare leaf value sequences (level-order
  // arrays with nulls).
  'leaf-similar-trees': `class Solution:
    def leafSimilar(self, root1: List[int], root2: List[int]) -> bool:
        def leaves(arr):
            if not arr or arr[0] is None:
                return []
            n = len(arr)
            children = {}
            idx = 1
            order = [0]
            res = []
            queue = [0]
            qi = 0
            kids = {}
            while qi < len(queue):
                u = queue[qi]; qi += 1
                l = r = None
                if idx < n:
                    if arr[idx] is not None:
                        l = idx; queue.append(idx)
                    idx += 1
                if idx < n:
                    if arr[idx] is not None:
                        r = idx; queue.append(idx)
                    idx += 1
                kids[u] = (l, r)
            for u, (l, r) in kids.items():
                if l is None and r is None:
                    res.append(arr[u])
            # res is in BFS order; need DFS left-to-right leaf order
            out = []
            stack = [0]
            while stack:
                u = stack.pop()
                l, r = kids.get(u, (None, None))
                if l is None and r is None:
                    out.append(arr[u])
                else:
                    if r is not None:
                        stack.append(r)
                    if l is not None:
                        stack.append(l)
            return out
        return leaves(root1) == leaves(root2)`,

  // findLeastNumOfUniqueInts(arr, k) -> int. remove k elements to minimise distinct.
  'least-number-of-unique-integers-after-k-removals': `from collections import Counter
class Solution:
    def findLeastNumOfUniqueInts(self, arr: List[int], k: int) -> int:
        cnt = sorted(Counter(arr).values())
        unique = len(cnt)
        for c in cnt:
            if k >= c:
                k -= c
                unique -= 1
            else:
                break
        return unique`,

  // leastOpsExpressTarget(x, target) -> int. min operators for x..x expression == target.
  'least-operators-to-express-number': `from functools import lru_cache
class Solution:
    def leastOpsExpressTarget(self, x: int, target: int) -> int:
        @lru_cache(maxsize=None)
        def dp(t):
            if t < x:
                return min(2 * t - 1, 2 * (x - t))
            k = 0
            p = 1
            while p * x <= t:
                p *= x
                k += 1
            res = dp(t - p) + k
            if p * x - t < t:
                res = min(res, dp(p * x - t) + k + 1)
            return res
        return dp(target)`,

  // leftRightDifference(nums) -> List[int]. |leftSum - rightSum| per index.
  'left-and-right-sum-differences': `class Solution:
    def leftRightDifference(self, nums: List[int]) -> List[int]:
        total = sum(nums)
        res = []
        left = 0
        for x in nums:
            right = total - left - x
            res.append(abs(left - right))
            left += x
        return res`,

  // maxSubarrayLength(nums, k) -> int. longest subarray where every value appears
  // at most k times.
  'length-of-longest-subarray-with-at-most-k-frequency': `from collections import defaultdict
class Solution:
    def maxSubarrayLength(self, nums: List[int], k: int) -> int:
        cnt = defaultdict(int)
        left = 0
        best = 0
        for right, v in enumerate(nums):
            cnt[v] += 1
            while cnt[v] > k:
                cnt[nums[left]] -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`,

  // lenOfVDiagonal(grid) -> int. longest V-shaped diagonal: starts 1, then 2,0,2,0
  // sequence, at most one clockwise 90-degree turn.
  'length-of-longest-v-shaped-diagonal-segment': `from functools import lru_cache
import sys
class Solution:
    def lenOfVDiagonal(self, grid: List[List[int]]) -> int:
        sys.setrecursionlimit(1000000)
        n = len(grid)
        m = len(grid[0])
        # diagonal directions, clockwise order
        dirs = [(1, 1), (1, -1), (-1, -1), (-1, 1)]
        clockwise = {0: 1, 1: 2, 2: 3, 3: 0}
        @lru_cache(maxsize=None)
        def dfs(r, c, d, turned, expected):
            # expected: the value we expect at (r,c); returns length of remaining seq
            dr, dc = dirs[d]
            nr, nc = r + dr, c + dc
            best = 0
            if 0 <= nr < n and 0 <= nc < m and grid[nr][nc] == expected:
                nxt = 2 if expected == 0 else 0
                best = max(best, 1 + dfs(nr, nc, d, turned, nxt))
            if not turned:
                nd = clockwise[d]
                ndr, ndc = dirs[nd]
                tr, tc = r + ndr, c + ndc
                if 0 <= tr < n and 0 <= tc < m and grid[tr][tc] == expected:
                    nxt = 2 if expected == 0 else 0
                    best = max(best, 1 + dfs(tr, tc, nd, True, nxt))
            return best
        ans = 0
        for i in range(n):
            for j in range(m):
                if grid[i][j] == 1:
                    for d in range(4):
                        ans = max(ans, 1 + dfs(i, j, d, False, 2))
        return ans`,

  // longestContinuousSubstring(s) -> int. longest run of consecutive alphabet chars.
  'length-of-the-longest-alphabetical-continuous-substring': `class Solution:
    def longestContinuousSubstring(self, s: str) -> int:
        best = 1
        cur = 1
        for i in range(1, len(s)):
            if ord(s[i]) - ord(s[i - 1]) == 1:
                cur += 1
                best = max(best, cur)
            else:
                cur = 1
        return best`,

  // maxPathLength(coordinates, k) -> int. longest strictly-increasing (both x,y)
  // path passing through coordinates[k]. LIS in 2D anchored at point k.
  'length-of-the-longest-increasing-path': `from bisect import bisect_left
class Solution:
    def maxPathLength(self, coordinates: List[List[int]], k: int) -> int:
        px, py = coordinates[k]
        def lis(points):
            # strictly increasing in both; sort by x asc, y desc for ties; LIS on y
            points.sort(key=lambda p: (p[0], -p[1]))
            tails = []
            for _, y in points:
                idx = bisect_left(tails, y)
                if idx == len(tails):
                    tails.append(y)
                else:
                    tails[idx] = y
            return len(tails)
        lower = [(x, y) for x, y in coordinates if x < px and y < py]
        upper = [(x, y) for x, y in coordinates if x > px and y > py]
        return lis(lower) + 1 + lis(upper)`,

  // lengthOfLongestSubsequence(nums, target) -> int. longest subsequence summing
  // to target, -1 if none. (bounded knapsack DP tracking max count)
  'length-of-the-longest-subsequence-that-sums-to-target': `class Solution:
    def lengthOfLongestSubsequence(self, nums: List[int], target: int) -> int:
        dp = [-1] * (target + 1)
        dp[0] = 0
        for x in nums:
            if x > target:
                continue
            for s in range(target, x - 1, -1):
                if dp[s - x] != -1:
                    dp[s] = max(dp[s], dp[s - x] + 1)
        return dp[target]`,

  // longestValidSubstring(word, forbidden) -> int. longest substring containing no
  // forbidden string. sliding window; forbidden length <= 10.
  'length-of-the-longest-valid-substring': `class Solution:
    def longestValidSubstring(self, word: str, forbidden: List[str]) -> int:
        fset = set(forbidden)
        maxlen = max((len(f) for f in forbidden), default=0)
        n = len(word)
        right = n - 1
        best = 0
        for left in range(n - 1, -1, -1):
            for l in range(1, min(maxlen, right - left + 1) + 1):
                if word[left:left + l] in fset:
                    right = left + l - 2
                    break
            best = max(best, right - left + 1)
        return best`,

  // lexicalOrder(n) -> List[int]. integers 1..n in lexicographic order.
  'lexicographical-numbers': `class Solution:
    def lexicalOrder(self, n: int) -> List[int]:
        res = []
        cur = 1
        for _ in range(n):
            res.append(cur)
            if cur * 10 <= n:
                cur *= 10
            else:
                while cur % 10 == 9 or cur + 1 > n:
                    cur //= 10
                cur += 1
        return res`,

  // clearStars(s) -> str. each '*' removes the smallest char to its left (any one);
  // return lexicographically smallest remaining string.
  'lexicographically-minimum-string-after-removing-stars': `import heapq
class Solution:
    def clearStars(self, s: str) -> str:
        heap = []  # (char, -index) so we pop smallest char, latest index
        removed = [False] * len(s)
        for i, c in enumerate(s):
            if c == '*':
                removed[i] = True
                if heap:
                    ch, negidx = heapq.heappop(heap)
                    removed[-negidx] = True
            else:
                heapq.heappush(heap, (c, -i))
        return ''.join(s[i] for i in range(len(s)) if not removed[i])`,

  // smallestBeautifulString(s, k) -> str. next lexicographically larger beautiful
  // string (no palindromic substring of length 2+) using first k letters; "" none.
  'lexicographically-smallest-beautiful-string': `class Solution:
    def smallestBeautifulString(self, s: str, k: int) -> str:
        arr = [ord(c) - 97 for c in s]
        n = len(arr)
        i = n - 1
        while i >= 0:
            arr[i] += 1
            while arr[i] < k and ((i >= 1 and arr[i] == arr[i - 1]) or (i >= 2 and arr[i] == arr[i - 2])):
                arr[i] += 1
            if arr[i] < k:
                break
            i -= 1
        if i < 0:
            return ""
        for j in range(i + 1, n):
            for c in range(k):
                if (j >= 1 and c == arr[j - 1]) or (j >= 2 and c == arr[j - 2]):
                    continue
                arr[j] = c
                break
        return ''.join(chr(c + 97) for c in arr)`,

  // generateString(str1, str2) -> str. lexicographically smallest word of length
  // n+m-1 satisfying T (==str2 at i) / F (!=str2 at i) constraints; "" if impossible.
  'lexicographically-smallest-generated-string': `class Solution:
    def generateString(self, str1: str, str2: str) -> str:
        n, m = len(str1), len(str2)
        L = n + m - 1
        word = [None] * L
        # place all T constraints first (forced)
        for i in range(n):
            if str1[i] == 'T':
                for j in range(m):
                    pos = i + j
                    if word[pos] is not None and word[pos] != str2[j]:
                        return ""
                    word[pos] = str2[j]
        # fill remaining with 'a' (smallest)
        for i in range(L):
            if word[i] is None:
                word[i] = 'a'
        # verify F constraints; if a window accidentally equals str2, fix the last
        # free position in that window to differ.
        forced = [False] * L
        for i in range(n):
            if str1[i] == 'T':
                for j in range(m):
                    forced[i + j] = True
        def fix():
            changed = True
            while changed:
                changed = False
                for i in range(n):
                    if str1[i] == 'F':
                        if ''.join(word[i:i + m]) == str2:
                            # find a free position in window to bump
                            done = False
                            for j in range(m - 1, -1, -1):
                                pos = i + j
                                if not forced[pos]:
                                    word[pos] = 'b' if str2[j] == 'a' else 'a'
                                    changed = True
                                    done = True
                                    break
                            if not done:
                                return False
            return True
        if not fix():
            return ""
        return ''.join(word)`,

  // lexSmallestNegatedPerm(n, target) -> List[int]. lexicographically smallest array
  // of size n; abs values are a permutation of 1..n; sum == target; [] if impossible.
  'lexicographically-smallest-negated-permutation-that-sums-to-target': `class Solution:
    def lexSmallestNegatedPerm(self, n: int, target: int) -> List[int]:
        total = n * (n + 1) // 2
        if abs(target) > total or (total - target) % 2 != 0:
            return []
        avail = set(range(1, n + 1))
        res = []
        cur = target
        for _ in range(n):
            placed = False
            cands = []
            for v in avail:
                cands.append(-v)
                cands.append(v)
            cands.sort()
            for sv in cands:
                v = abs(sv)
                rem_sum = sum(avail) - v
                need = cur - sv
                if abs(need) <= rem_sum and (rem_sum - need) % 2 == 0:
                    res.append(sv)
                    avail.discard(v)
                    cur = need
                    placed = True
                    break
            if not placed:
                return []
        return res`,

  // makeSmallestPalindrome(s) -> str. min replacements to palindrome, lexicographically
  // smallest.
  'lexicographically-smallest-palindrome': `class Solution:
    def makeSmallestPalindrome(self, s: str) -> str:
        arr = list(s)
        i, j = 0, len(arr) - 1
        while i < j:
            if arr[i] != arr[j]:
                small = min(arr[i], arr[j])
                arr[i] = arr[j] = small
            i += 1
            j -= 1
        return ''.join(arr)`,

  // lexPalindromicPermutation(s, target) -> str. lexicographically smallest string
  // that is both a palindromic permutation of s and strictly > target; "" if none.
  'lexicographically-smallest-palindromic-permutation-greater-than-target': `from collections import Counter
class Solution:
    def lexPalindromicPermutation(self, s: str, target: str) -> str:
        n = len(s)
        cnt = Counter(s)
        odd = [c for c, v in cnt.items() if v % 2 == 1]
        if (n % 2 == 0 and len(odd) != 0) or (n % 2 == 1 and len(odd) != 1):
            return ""
        half_counts = {c: v // 2 for c, v in cnt.items()}
        mid = odd[0] if odd else ''
        half_len = n // 2
        # We build the first half (length half_len); palindrome determined by it.
        # Find lexicographically smallest full palindrome strictly greater than target.
        # Build smallest half:
        def build_smallest(counts):
            res = []
            items = sorted(counts.keys())
            cc = dict(counts)
            for _ in range(half_len):
                for ch in items:
                    if cc.get(ch, 0) > 0:
                        cc[ch] -= 1
                        res.append(ch)
                        break
            return res
        # Greedy: try to make full palindrome > target. We try the smallest half;
        # if its palindrome > target, done. Else increment.
        items = sorted(half_counts.keys())
        def make_palindrome(half):
            h = ''.join(half)
            return h + mid + h[::-1]
        # smallest possible palindrome
        smallest = make_palindrome(build_smallest(half_counts))
        if smallest > target:
            return smallest
        # Otherwise search: build half position by position trying to exceed target.
        # The full string compares against target of equal length n.
        # We attempt to construct the lexicographically smallest half whose resulting
        # palindrome > target by standard "next greater with multiset" over the half,
        # but the mirror complicates direct comparison; brute force the half via
        # backtracking choosing smallest feasible char that can still exceed target.
        target_chars = list(target)
        best = [None]
        def backtrack(pos, counts, half, tight):
            if best[0] is not None:
                return
            if pos == half_len:
                pal = make_palindrome(half)
                if pal > target:
                    best[0] = pal
                return
            for ch in items:
                if counts.get(ch, 0) <= 0:
                    continue
                if tight and ch < target_chars[pos]:
                    continue
                ntight = tight and (ch == target_chars[pos])
                counts[ch] -= 1
                half.append(ch)
                backtrack(pos + 1, counts, half, ntight)
                half.pop()
                counts[ch] += 1
                if best[0] is not None:
                    return
        backtrack(0, dict(half_counts), [], True)
        return best[0] if best[0] is not None else ""`,

  // lexGreaterPermutation(s, target) -> str. lexicographically smallest permutation
  // of s strictly greater than target; "" if none.
  'lexicographically-smallest-permutation-greater-than-target': `from collections import Counter
class Solution:
    def lexGreaterPermutation(self, s: str, target: str) -> str:
        n = len(s)
        cnt = Counter(s)
        chars = sorted(cnt.keys())
        target_chars = list(target)
        res = []
        def smallest_remaining(counts):
            out = []
            for ch in chars:
                out.append(ch * counts[ch])
            return ''.join(out)
        # Try to match target as long as possible (tight), then at some position
        # place a strictly greater char and fill the rest with the smallest arrangement.
        def solve(pos, counts, tight_prefix):
            if pos == n:
                return '' if not tight_prefix else None  # equal to target -> not strictly greater
            # Option A: place a char > target[pos], fill rest smallest -> candidate
            best = None
            for ch in chars:
                if counts[ch] == 0:
                    continue
                if ch > target_chars[pos]:
                    counts[ch] -= 1
                    cand = tight_prefix + ch + smallest_remaining(counts)
                    counts[ch] += 1
                    if best is None or cand < best:
                        best = cand
                    break  # smallest such ch gives smallest candidate
            # Option B: place ch == target[pos], continue tight
            ch = target_chars[pos]
            if counts.get(ch, 0) > 0:
                counts[ch] -= 1
                sub = solve(pos + 1, counts, tight_prefix + ch)
                counts[ch] += 1
                if sub is not None and (best is None or sub < best):
                    best = sub
            return best
        ans = solve(0, dict(cnt), '')
        return ans if ans else ""`,
};
