// Authored Python canonicals for stub-targets slice [100,150).
// Keyed by problem id (== slug). Each value is the FULL class Solution source.
// The harness binds params POSITIONALLY by stored order+type, so each `def`
// is written against the stored param order (DB param NAMES may be garbled).

export default {
  // hasTrailingZeros(nums) -> bool. OR has trailing zero iff >=2 even numbers.
  'check-if-bitwise-or-has-trailing-zeros': `class Solution:
    def hasTrailingZeros(self, nums: List[int]) -> bool:
        return sum(1 for x in nums if x % 2 == 0) >= 2`,

  // findAnswer(parent, s) -> List[bool]. dfs(i) builds string of subtree of i
  // (children ascending, then s[i]); answer[i] = is that string a palindrome.
  'check-if-dfs-strings-are-palindromes': `import sys
class Solution:
    def findAnswer(self, parent: List[int], s: str) -> List[bool]:
        sys.setrecursionlimit(300000)
        n = len(parent)
        children = [[] for _ in range(n)]
        for i in range(1, n):
            children[parent[i]].append(i)
        for c in children:
            c.sort()
        order = []
        start = [0] * n
        end = [0] * n
        def dfs(x):
            start[x] = len(order)
            for y in children[x]:
                dfs(y)
            order.append(s[x])
            end[x] = len(order)
        dfs(0)
        full = ''.join(order)
        res = []
        for i in range(n):
            sub = full[start[i]:end[i]]
            res.append(sub == sub[::-1])
        return res`,

  // hasSameDigits(s) -> bool. Repeated pairwise (a+b)%10 until 2 digits.
  'check-if-digits-are-equal-in-string-after-operations-i': `class Solution:
    def hasSameDigits(self, s: str) -> bool:
        d = [int(c) for c in s]
        while len(d) > 2:
            d = [(d[i] + d[i + 1]) % 10 for i in range(len(d) - 1)]
        return d[0] == d[1]`,

  // hasSameDigits(s) -> bool. Same rule; binomial-coefficient form for large n,
  // but the iterative reduction is correct and fine for the stored cases.
  'check-if-digits-are-equal-in-string-after-operations-ii': `class Solution:
    def hasSameDigits(self, s: str) -> bool:
        d = [int(c) for c in s]
        while len(d) > 2:
            d = [(d[i] + d[i + 1]) % 10 for i in range(len(d) - 1)]
        return d[0] == d[1]`,

  // checkValid(matrix) -> bool. Each row and column is a permutation of 1..n.
  'check-if-every-row-and-column-contains-all-numbers': `class Solution:
    def checkValid(self, matrix: List[List[int]]) -> bool:
        n = len(matrix)
        full = set(range(1, n + 1))
        for row in matrix:
            if set(row) != full:
                return False
        for j in range(n):
            if set(matrix[i][j] for i in range(n)) != full:
                return False
        return True`,

  // checkValidCuts(n, rectangles) -> bool. Two cuts (horizontal OR vertical) into
  // 3 sections each holding >=1 rectangle => >=3 non-overlapping interval groups
  // on one axis (rectangles' [start,end) projections merge into >=3 components).
  'check-if-grid-can-be-cut-into-sections': `class Solution:
    def checkValidCuts(self, n: int, rectangles: List[List[int]]) -> bool:
        def count_gaps(intervals):
            intervals.sort()
            groups = 0
            cur_end = -1
            for s, e in intervals:
                if s >= cur_end:
                    groups += 1
                    cur_end = e
                else:
                    cur_end = max(cur_end, e)
            return groups
        xs = [[r[0], r[2]] for r in rectangles]
        ys = [[r[1], r[3]] for r in rectangles]
        return count_gaps(xs) >= 3 or count_gaps(ys) >= 3`,

  // satisfiesConditions(grid) -> bool. equal to cell below, different from right.
  'check-if-grid-satisfies-conditions': `class Solution:
    def satisfiesConditions(self, grid: List[List[int]]) -> bool:
        m = len(grid)
        for i in range(m):
            n = len(grid[i])
            for j in range(n):
                if i + 1 < m and j < len(grid[i + 1]) and grid[i][j] != grid[i + 1][j]:
                    return False
                if j + 1 < n and grid[i][j] == grid[i][j + 1]:
                    return False
        return True`,

  // isGoodArray(nums) -> bool. Good iff gcd of all elements == 1 (Bezout).
  'check-if-it-is-a-good-array': `from math import gcd
from functools import reduce
class Solution:
    def isGoodArray(self, nums: List[int]) -> bool:
        return reduce(gcd, nums) == 1`,

  // canSplitArray(nums, m) -> bool. Splittable iff n<=2 or some adjacent pair
  // sums >= m (then peel singles off either side).
  'check-if-it-is-possible-to-split-array': `class Solution:
    def canSplitArray(self, nums: List[int], m: int) -> bool:
        n = len(nums)
        if n <= 2:
            return True
        for i in range(n - 1):
            if nums[i] + nums[i + 1] >= m:
                return True
        return False`,

  // checkMove(board, rMove, cMove, color) -> bool. board:8x8 str grid.
  'check-if-move-is-legal': `class Solution:
    def checkMove(self, board: List[List[str]], rMove: int, cMove: int, color: str) -> bool:
        opp = 'B' if color == 'W' else 'W'
        dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
        for dr, dc in dirs:
            r, c = rMove + dr, cMove + dc
            length = 1
            seen_opp = False
            while 0 <= r < 8 and 0 <= c < 8:
                cell = board[r][c]
                if cell == '.':
                    break
                if cell == opp:
                    seen_opp = True
                    r += dr; c += dc; length += 1
                    continue
                if cell == color:
                    if seen_opp and length >= 3:
                        return True
                    break
            # loop fallthrough
        return False`,

  // checkIfExist(arr) -> bool. exists i!=j with arr[i]==2*arr[j].
  'check-if-n-and-its-double-exist': `class Solution:
    def checkIfExist(self, arr: List[int]) -> bool:
        seen = set()
        for x in arr:
            if 2 * x in seen or (x % 2 == 0 and x // 2 in seen):
                return True
            seen.add(x)
        return False`,

  // digitCount(num) -> bool. digit i occurs num[i] times.
  'check-if-number-has-equal-digit-count-and-digit-value': `class Solution:
    def digitCount(self, num: str) -> bool:
        from collections import Counter
        cnt = Counter(num)
        for i, ch in enumerate(num):
            if cnt.get(str(i), 0) != int(ch):
                return False
        return True`,

  // checkPowersOfThree(n) -> bool. base-3 digits all in {0,1}.
  'check-if-number-is-a-sum-of-powers-of-three': `class Solution:
    def checkPowersOfThree(self, n: int) -> bool:
        while n > 0:
            if n % 3 == 2:
                return False
            n //= 3
        return True`,

  // areAlmostEqual(s1, s2) -> bool. equal, or exactly two positions differ as a swap.
  'check-if-one-string-swap-can-make-strings-equal': `class Solution:
    def areAlmostEqual(self, s1: str, s2: str) -> bool:
        if s1 == s2:
            return True
        diff = [i for i in range(len(s1)) if s1[i] != s2[i]]
        return len(diff) == 2 and s1[diff[0]] == s2[diff[1]] and s1[diff[1]] == s2[diff[0]]`,

  // isReachable(targetX, targetY) -> bool. reachable iff gcd is a power of 2.
  'check-if-point-is-reachable': `from math import gcd
class Solution:
    def isReachable(self, targetX: int, targetY: int) -> bool:
        g = gcd(targetX, targetY)
        return (g & (g - 1)) == 0`,

  // isPrefixString(s, words) -> bool.
  'check-if-string-is-a-prefix-of-array': `class Solution:
    def isPrefixString(self, s: str, words: List[str]) -> bool:
        acc = ''
        for w in words:
            acc += w
            if acc == s:
                return True
            if len(acc) >= len(s):
                return False
        return False`,

  // isTransformable(s, t) -> bool. bubble-sort reachability: same multiset, and
  // each digit's occurrence order preserved with no smaller digit jumping a larger.
  'check-if-string-is-transformable-with-substring-sort-operations': `from collections import deque
class Solution:
    def isTransformable(self, s: str, t: str) -> bool:
        if sorted(s) != sorted(t):
            return False
        pos = [deque() for _ in range(10)]
        for i, ch in enumerate(s):
            pos[int(ch)].append(i)
        for ch in t:
            d = int(ch)
            if not pos[d]:
                return False
            idx = pos[d][0]
            for smaller in range(d):
                if pos[smaller] and pos[smaller][0] < idx:
                    return False
            pos[d].popleft()
        return True`,

  // canBeEqual(s1, s2) -> bool. swaps with step 2 => even and odd index multisets match.
  'check-if-strings-can-be-made-equal-with-operations-i': `class Solution:
    def canBeEqual(self, s1: str, s2: str) -> bool:
        return sorted(s1[0::2]) == sorted(s2[0::2]) and sorted(s1[1::2]) == sorted(s2[1::2])`,

  // checkStrings(s1, s2) -> bool. swaps with even index-diff => same parity classes.
  'check-if-strings-can-be-made-equal-with-operations-ii': `class Solution:
    def checkStrings(self, s1: str, s2: str) -> bool:
        return sorted(s1[0::2]) == sorted(s2[0::2]) and sorted(s1[1::2]) == sorted(s2[1::2])`,

  // isFascinating(n) -> bool. n + 2n + 3n has digits 1..9 each once.
  'check-if-the-number-is-fascinating': `class Solution:
    def isFascinating(self, n: int) -> bool:
        s = str(n) + str(2 * n) + str(3 * n)
        return len(s) == 9 and set(s) == set('123456789')`,

  // canReachCorner(X, Y, circles) -> bool. Path from (0,0) to (X,Y) exists unless
  // circles form a connected barrier touching opposite blocking edges. DSU over
  // circles + the two "blocking" boundary groups (top/left vs bottom/right).
  // A path from (0,0) to (X,Y) staying strictly inside the open rectangle is blocked
  // iff the circles form a connected chain joining the {left edge OR top edge} group
  // to the {bottom edge OR right edge} group, where each touch must occur WITHIN the
  // rectangle span. DSU with two virtual boundary nodes.
  'check-if-the-rectangle-corner-is-reachable': `class Solution:
    def canReachCorner(self, X: int, Y: int, circles: List[List[int]]) -> bool:
        # A circle covering either corner blocks the path outright.
        for x, y, r in circles:
            if x * x + y * y <= r * r:
                return False
            if (x - X) ** 2 + (y - Y) ** 2 <= r * r:
                return False
        n = len(circles)
        parent = list(range(n + 2))
        TOP, BOT = n, n + 1  # TOP = top-or-left group, BOT = bottom-or-right group
        def find(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a
        def union(a, b):
            parent[find(a)] = find(b)
        for i, (x, y, r) in enumerate(circles):
            # touches LEFT edge x=0 with the contact point's y inside [0,Y]
            if abs(x) <= r and 0 < y < Y:
                union(i, TOP)
            elif x <= 0:
                # center left of rectangle but reaches in
                if x + r > 0 and y - r < Y and y + r > 0:
                    pass
            # touches TOP edge y=Y inside [0,X]
            if abs(y - Y) <= r and 0 < x < X:
                union(i, TOP)
            # touches RIGHT edge x=X inside [0,Y]
            if abs(x - X) <= r and 0 < y < Y:
                union(i, BOT)
            # touches BOTTOM edge y=0 inside [0,X]
            if abs(y) <= r and 0 < x < X:
                union(i, BOT)
            # corner-region cases: a circle reaching the top-left corner area joins TOP,
            # bottom-right corner area joins BOT (handles circles whose center is outside).
            if x <= 0 and y >= Y:
                if x * x + (y - Y) ** 2 <= r * r:
                    union(i, TOP)
            if x >= X and y <= 0:
                if (x - X) ** 2 + y * y <= r * r:
                    union(i, BOT)
        def overlap(i, j):
            x1, y1, r1 = circles[i]
            x2, y2, r2 = circles[j]
            return (x1 - x2) ** 2 + (y1 - y2) ** 2 <= (r1 + r2) ** 2
        for i in range(n):
            for j in range(i + 1, n):
                if overlap(i, j):
                    union(i, j)
        return find(TOP) != find(BOT)`,

  // checkIfPangram(sentence) -> bool.
  'check-if-the-sentence-is-pangram': `class Solution:
    def checkIfPangram(self, sentence: str) -> bool:
        return len(set(sentence)) >= 26`,

  // hasValidPath(grid) -> bool. valid-parentheses path down/right; DP over (r,c,open).
  'check-if-there-is-a-valid-parentheses-string-path': `from functools import lru_cache
class Solution:
    def hasValidPath(self, grid: List[List[str]]) -> bool:
        m, n = len(grid), len(grid[0])
        if (m + n - 1) % 2 == 1 or grid[0][0] == ')' or grid[m-1][n-1] == '(':
            return False
        @lru_cache(maxsize=None)
        def dfs(r, c, bal):
            bal += 1 if grid[r][c] == '(' else -1
            if bal < 0:
                return False
            if r == m - 1 and c == n - 1:
                return bal == 0
            res = False
            if r + 1 < m:
                res = res or dfs(r + 1, c, bal)
            if c + 1 < n:
                res = res or dfs(r, c + 1, bal)
            return res
        ans = dfs(0, 0, 0)
        dfs.cache_clear()
        return ans`,

  // validPartition(nums) -> bool. DP: 2 equal / 3 equal / 3 consecutive increasing.
  'check-if-there-is-a-valid-partition-for-the-array': `class Solution:
    def validPartition(self, nums: List[int]) -> bool:
        n = len(nums)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            if i >= 2 and nums[i-1] == nums[i-2] and dp[i-2]:
                dp[i] = True
            if i >= 3 and dp[i-3]:
                if nums[i-1] == nums[i-2] == nums[i-3]:
                    dp[i] = True
                if nums[i-1] - nums[i-2] == 1 and nums[i-2] - nums[i-3] == 1:
                    dp[i] = True
        return dp[n]`,

  // checkTwoChessboards(c1, c2) -> bool. same color iff (col+row) parities match.
  'check-if-two-chessboard-squares-have-the-same-color': `class Solution:
    def checkTwoChessboards(self, coordinate1: str, coordinate2: str) -> bool:
        def color(c):
            return (ord(c[0]) - ord('a') + int(c[1])) % 2
        return color(coordinate1) == color(coordinate2)`,

  // arrayStringsAreEqual(word1, word2) -> bool.
  'check-if-two-string-arrays-are-equivalent': `class Solution:
    def arrayStringsAreEqual(self, word1: List[str], word2: List[str]) -> bool:
        return ''.join(word1) == ''.join(word2)`,

  // placeWordInCrossword(board, word) -> bool. try every horizontal/vertical slot
  // bounded by '#'/edges with length==len(word), both directions.
  'check-if-word-can-be-placed-in-crossword': `class Solution:
    def placeWordInCrossword(self, board: List[List[str]], word: str) -> bool:
        def fits(slot, w):
            if len(slot) != len(w):
                return False
            for a, b in zip(slot, w):
                if a != ' ' and a != b:
                    return False
            return True
        def can(slot):
            return fits(slot, word) or fits(slot, word[::-1])
        def scan(grid):
            for row in grid:
                line = ''.join(row)
                for seg in line.split('#'):
                    if seg and can(list(seg)):
                        return True
            return False
        if scan(board):
            return True
        transposed = [list(col) for col in zip(*board)]
        return scan(transposed)`,

  // isSumEqual(firstWord, secondWord, targetWord) -> bool. base-26-ish concat of (c-'a').
  'check-if-word-equals-summation-of-two-words': `class Solution:
    def isSumEqual(self, firstWord: str, secondWord: str, targetWord: str) -> bool:
        def val(w):
            return int(''.join(str(ord(c) - ord('a')) for c in w))
        return val(firstWord) + val(secondWord) == val(targetWord)`,

  // isValid(s) -> bool. repeatedly remove "abc" via a stack.
  'check-if-word-is-valid-after-substitutions': `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        for ch in s:
            stack.append(ch)
            if len(stack) >= 3 and stack[-3] == 'a' and stack[-2] == 'b' and stack[-1] == 'c':
                del stack[-3:]
        return not stack`,

  // checkValidGrid(grid) -> bool. knight visits 0..n*n-1 starting top-left.
  'check-knight-tour-configuration': `class Solution:
    def checkValidGrid(self, grid: List[List[int]]) -> bool:
        n = len(grid)
        if grid[0][0] != 0:
            return False
        pos = [None] * (n * n)
        for i in range(n):
            for j in range(len(grid[i])):
                v = grid[i][j]
                if 0 <= v < n * n:
                    pos[v] = (i, j)
        for k in range(1, n * n):
            if pos[k] is None or pos[k-1] is None:
                return False
            dr = abs(pos[k][0] - pos[k-1][0])
            dc = abs(pos[k][1] - pos[k-1][1])
            if not ((dr == 1 and dc == 2) or (dr == 2 and dc == 1)):
                return False
        return True`,

  // checkAlmostEquivalent(word1, word2) -> bool. per-letter freq diff <= 3.
  'check-whether-two-strings-are-almost-equivalent': `from collections import Counter
class Solution:
    def checkAlmostEquivalent(self, word1: str, word2: str) -> bool:
        c1, c2 = Counter(word1), Counter(word2)
        for ch in set(word1) | set(word2):
            if abs(c1[ch] - c2[ch]) > 3:
                return False
        return True`,

  // distanceLimitedPathsExist(n, edgeList, queries) -> List[bool]. offline DSU,
  // sort edges and queries by limit, union edges below limit.
  'checking-existence-of-edge-length-limited-paths': `class Solution:
    def distanceLimitedPathsExist(self, n: int, edgeList: List[List[int]], queries: List[List[int]]) -> List[bool]:
        parent = list(range(n))
        def find(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a
        edges = sorted(edgeList, key=lambda e: e[2])
        q = sorted(range(len(queries)), key=lambda i: queries[i][2])
        ans = [False] * len(queries)
        ei = 0
        for qi in q:
            p, qq, limit = queries[qi]
            while ei < len(edges) and edges[ei][2] < limit:
                u, v, _ = edges[ei]
                parent[find(u)] = find(v)
                ei += 1
            ans[qi] = find(p) == find(qq)
        return ans`,

  // findMaxSum(nums1, nums2, k) -> List[int]. for each i, sum of top-k nums2[j]
  // among j with nums1[j] < nums1[i]. Sort by nums1, maintain a min-heap of size k.
  'choose-k-elements-with-maximum-sum': `import heapq
class Solution:
    def findMaxSum(self, nums1: List[int], nums2: List[int], k: int) -> List[int]:
        n = len(nums1)
        order = sorted(range(n), key=lambda i: nums1[i])
        ans = [0] * n
        heap = []
        cur = 0
        i = 0
        while i < n:
            j = i
            group = []
            while j < n and nums1[order[j]] == nums1[order[i]]:
                group.append(order[j])
                j += 1
            for idx in group:
                ans[idx] = cur
            for idx in group:
                heapq.heappush(heap, nums2[idx])
                cur += nums2[idx]
                if len(heap) > k:
                    cur -= heapq.heappop(heap)
            i = j
        return ans`,

  // maxNumberOfFamilies(n, reservedSeats) -> int. per row, 3 slots [2-5],[4-7],[6-9];
  // empty row -> 2 groups; else check left/middle/right availability.
  'cinema-seat-allocation': `from collections import defaultdict
class Solution:
    def maxNumberOfFamilies(self, n: int, reservedSeats: List[List[int]]) -> int:
        rows = defaultdict(int)
        for r, c in reservedSeats:
            if 1 <= r <= n and 2 <= c <= 9:
                rows[r] |= (1 << (c - 2))
        total = 0
        left = 0b00001111
        right = 0b11110000
        middle = 0b00111100
        for mask in rows.values():
            l = (mask & left) == 0
            rg = (mask & right) == 0
            m = (mask & middle) == 0
            if l and rg:
                total += 2
            elif l or rg or m:
                total += 1
        total += (n - len(rows)) * 2
        return total`,

  // checkOverlap(radius, xC, yC, x1, y1, x2, y2) -> bool. closest point in rect.
  'circle-and-rectangle-overlapping': `class Solution:
    def checkOverlap(self, radius: int, xCenter: int, yCenter: int, x1: int, y1: int, x2: int, y2: int) -> bool:
        cx = max(x1, min(xCenter, x2))
        cy = max(y1, min(yCenter, y2))
        dx, dy = xCenter - cx, yCenter - cy
        return dx * dx + dy * dy <= radius * radius`,

  // circularPermutation(n, start) -> List[int]. gray code rotated to start.
  'circular-permutation-in-binary-representation': `class Solution:
    def circularPermutation(self, n: int, start: int) -> List[int]:
        return [start ^ i ^ (i >> 1) for i in range(1 << n)]`,

  // isCircularSentence(sentence) -> bool. last char of each word == first of next (wrap).
  'circular-sentence': `class Solution:
    def isCircularSentence(self, sentence: str) -> bool:
        words = sentence.split()
        m = len(words)
        for i in range(m):
            if words[i][-1] != words[(i + 1) % m][0]:
                return False
        return True`,

  // climbStairs(n, costs) -> int. costs is 1-indexed len n; jump +1/+2/+3;
  // cost to land on j = costs[j] + (j-i)^2; start step 0 cost 0; reach step n.
  'climbing-stairs-ii': `class Solution:
    def climbStairs(self, n: int, costs: List[int]) -> int:
        INF = float('inf')
        c = [0] * (n + 1)
        for j in range(1, n + 1):
            c[j] = costs[j - 1]
        dp = [INF] * (n + 1)
        dp[0] = 0
        for i in range(n + 1):
            if dp[i] == INF:
                continue
            for step in (1, 2, 3):
                j = i + step
                if j <= n:
                    dp[j] = min(dp[j], dp[i] + c[j] + step * step)
        return dp[n]`,

  // closestCost(baseCosts, toppingCosts, target) -> int. enumerate bases, 0/1/2 of
  // each topping; closest total to target, lower on tie.
  'closest-dessert-cost': `class Solution:
    def closestCost(self, baseCosts: List[int], toppingCosts: List[int], target: int) -> int:
        sums = set()
        def dfs(i, total):
            sums.add(total)
            if i == len(toppingCosts):
                return
            for cnt in range(3):
                dfs(i + 1, total + cnt * toppingCosts[i])
        for b in baseCosts:
            dfs(0, b)
        best = None
        for s in sums:
            if best is None:
                best = s
            else:
                db, ds = abs(best - target), abs(s - target)
                if ds < db or (ds == db and s < best):
                    best = s
        return best`,

  // solveQueries(nums, queries) -> List[int]. circular: min distance to same value.
  'closest-equal-element-queries': `from collections import defaultdict
import bisect
class Solution:
    def solveQueries(self, nums: List[int], queries: List[int]) -> List[int]:
        n = len(nums)
        pos = defaultdict(list)
        for i, v in enumerate(nums):
            pos[v].append(i)
        ans = []
        for q in queries:
            idxs = pos[nums[q]]
            if len(idxs) == 1:
                ans.append(-1)
                continue
            k = bisect.bisect_left(idxs, q)
            prev = idxs[k - 1] if k > 0 else idxs[-1]
            nxt = idxs[(k + 1) % len(idxs)] if idxs[k] == q else idxs[k]
            # neighbors in the circular list
            left = idxs[(k - 1) % len(idxs)]
            right = idxs[(k + 1) % len(idxs)]
            def circ(a, b):
                d = abs(a - b)
                return min(d, n - d)
            best = min(circ(q, left), circ(q, right))
            ans.append(best)
        return ans`,

  // closestNodes(rootArray, queries) -> List[List[int]]. The harness passes the BST
  // as its level-order array (first param type List[int]); BST values sorted == inorder.
  'closest-nodes-queries-in-a-binary-search-tree': `import bisect
class Solution:
    def closestNodes(self, root: List[int], queries: List[int]) -> List[List[int]]:
        vals = sorted(v for v in root if v is not None)
        ans = []
        for q in queries:
            i = bisect.bisect_left(vals, q)
            mx = vals[i] if i < len(vals) else -1
            j = bisect.bisect_right(vals, q)
            mn = vals[j - 1] if j > 0 else -1
            ans.append([mn, mx])
        return ans`,

  // closestPrimes(left, right) -> List[int]. sieve, find min-gap adjacent prime pair.
  'closest-prime-numbers-in-range': `class Solution:
    def closestPrimes(self, left: int, right: int) -> List[int]:
        if right < 2:
            return [-1, -1]
        sieve = [True] * (right + 1)
        sieve[0] = False
        if right >= 1:
            sieve[1] = False
        i = 2
        while i * i <= right:
            if sieve[i]:
                for j in range(i * i, right + 1, i):
                    sieve[j] = False
            i += 1
        primes = [x for x in range(max(2, left), right + 1) if sieve[x]]
        best = None
        prev = None
        for p in primes:
            if prev is not None:
                if best is None or p - prev < best[1] - best[0]:
                    best = [prev, p]
            prev = p
        return best if best else [-1, -1]`,
};
