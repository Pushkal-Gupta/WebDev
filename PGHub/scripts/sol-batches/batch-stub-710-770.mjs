// Authored Python canonicals for stub-targets slice [710,770).
// Keyed by problem id (== slug). Each value is the FULL class Solution source.
// The harness binds params POSITIONALLY by stored order+type, so each `def` is
// written against the stored param order (DB param NAMES may be garbled).
// SQL / Table / pandas / design (None-return) problems are intentionally absent.

export default {
  'find-the-minimum-number-of-fibonacci-numbers-whose-sum-is-k': { python: `class Solution:
    def findMinFibonacciNumbers(self, k: int) -> int:
        fibs = [1, 1]
        while fibs[-1] <= k:
            fibs.append(fibs[-1] + fibs[-2])
        count = 0
        i = len(fibs) - 1
        while k > 0:
            while fibs[i] > k:
                i -= 1
            k -= fibs[i]
            count += 1
        return count` },
  'find-the-minimum-possible-sum-of-a-beautiful-array': { python: `class Solution:
    def minimumPossibleSum(self, n: int, target: int) -> int:
        MOD = 10**9 + 7
        half = target // 2
        small = min(n, half)
        total = small * (small + 1) // 2
        rest = n - small
        if rest > 0:
            start = target
            total += rest * start + rest * (rest - 1) // 2
        return total % MOD` },
  'find-the-most-common-response': { python: `class Solution:
    def findCommonResponse(self, responses: List[List[str]]) -> str:
        from collections import Counter
        cnt = Counter()
        for day in responses:
            for r in set(day):
                cnt[r] += 1
        best = None
        best_count = -1
        for r, c in cnt.items():
            if c > best_count or (c == best_count and r < best):
                best = r
                best_count = c
        return best` },
  'find-the-most-competitive-subsequence': { python: `class Solution:
    def mostCompetitive(self, nums: List[int], k: int) -> List[int]:
        stack = []
        n = len(nums)
        for i, x in enumerate(nums):
            while stack and stack[-1] > x and len(stack) + (n - i) > k:
                stack.pop()
            if len(stack) < k:
                stack.append(x)
        return stack` },
  'find-the-n-th-value-after-k-seconds': { python: `class Solution:
    def valueAfterKSeconds(self, n: int, k: int) -> int:
        MOD = 10**9 + 7
        a = [1] * n
        for _ in range(k):
            for i in range(1, n):
                a[i] = (a[i] + a[i - 1]) % MOD
        return a[n - 1] % MOD` },
  'find-the-number-of-copy-arrays': { python: `class Solution:
    def countArrays(self, original: List[int], bounds: List[List[int]]) -> int:
        lo, hi = bounds[0][0], bounds[0][1]
        for i in range(1, len(original)):
            d = original[i] - original[i - 1]
            lo = max(lo + d, bounds[i][0])
            hi = min(hi + d, bounds[i][1])
        return max(0, hi - lo + 1)` },
  'find-the-number-of-distinct-colors-among-the-balls': { python: `class Solution:
    def queryResults(self, limit: int, queries: List[List[int]]) -> List[int]:
        from collections import defaultdict
        ball_color = {}
        color_count = defaultdict(int)
        res = []
        for x, y in queries:
            if x in ball_color:
                old = ball_color[x]
                color_count[old] -= 1
                if color_count[old] == 0:
                    del color_count[old]
            ball_color[x] = y
            color_count[y] += 1
            res.append(len(color_count))
        return res` },
  'find-the-number-of-good-pairs-i': { python: `class Solution:
    def numberOfPairs(self, nums1: List[int], nums2: List[int], k: int) -> int:
        count = 0
        for a in nums1:
            for b in nums2:
                if a % (b * k) == 0:
                    count += 1
        return count` },
  'find-the-number-of-good-pairs-ii': { python: `class Solution:
    def numberOfPairs(self, nums1: List[int], nums2: List[int], k: int) -> int:
        from collections import Counter
        cnt = Counter()
        for a in nums1:
            if a % k == 0:
                cnt[a // k] += 1
        if not cnt:
            return 0
        mx = max(cnt)
        freq = [0] * (mx + 1)
        for v, c in cnt.items():
            freq[v] += c
        total = 0
        for b in nums2:
            m = b
            j = m
            while j <= mx:
                total += freq[j]
                j += m
        return total` },
  'find-the-number-of-possible-ways-for-an-event': { python: `class Solution:
    def numberOfWays(self, n: int, x: int, y: int) -> int:
        MOD = 10**9 + 7
        maxk = min(n, x)
        fact = [1] * (x + 1)
        for i in range(1, x + 1):
            fact[i] = fact[i - 1] * i % MOD
        inv_fact = [1] * (x + 1)
        inv_fact[x] = pow(fact[x], MOD - 2, MOD)
        for i in range(x, 0, -1):
            inv_fact[i - 1] = inv_fact[i] * i % MOD
        def perm(a, b):
            if b > a:
                return 0
            return fact[a] * inv_fact[a - b] % MOD
        S = [[0] * (maxk + 1) for _ in range(n + 1)]
        S[0][0] = 1
        for i in range(1, n + 1):
            for j in range(1, min(i, maxk) + 1):
                S[i][j] = (j * S[i - 1][j] + S[i - 1][j - 1]) % MOD
        ans = 0
        for k in range(1, maxk + 1):
            ways_groups = S[n][k] * perm(x, k) % MOD
            ans = (ans + ways_groups * pow(y, k, MOD)) % MOD
        return ans` },
  'find-the-number-of-subarrays-where-boundary-elements-are-maximum': { python: `class Solution:
    def numberOfSubarrays(self, nums: List[int]) -> int:
        stack = []
        ans = 0
        for x in nums:
            while stack and stack[-1][0] < x:
                stack.pop()
            if stack and stack[-1][0] == x:
                stack[-1][1] += 1
                ans += stack[-1][1]
            else:
                stack.append([x, 1])
                ans += 1
        return ans` },
  'find-the-number-of-subsequences-with-equal-gcd': { python: `class Solution:
    def subsequencePairCount(self, nums: List[int]) -> int:
        from math import gcd
        MOD = 10**9 + 7
        M = max(nums)
        dp = [[0] * (M + 1) for _ in range(M + 1)]
        dp[0][0] = 1
        for x in nums:
            ndp = [row[:] for row in dp]
            for g1 in range(M + 1):
                for g2 in range(M + 1):
                    if dp[g1][g2] == 0:
                        continue
                    v = dp[g1][g2]
                    ng1 = gcd(g1, x) if g1 else x
                    ndp[ng1][g2] = (ndp[ng1][g2] + v) % MOD
                    ng2 = gcd(g2, x) if g2 else x
                    ndp[g1][ng2] = (ndp[g1][ng2] + v) % MOD
            dp = ndp
        ans = 0
        for g in range(1, M + 1):
            ans = (ans + dp[g][g]) % MOD
        return ans` },
  'find-the-number-of-ways-to-place-people-i': { python: `class Solution:
    def numberOfPairs(self, points: List[List[int]]) -> int:
        points.sort(key=lambda p: (p[0], -p[1]))
        n = len(points)
        ans = 0
        for i in range(n):
            ay = points[i][1]
            max_y = float('-inf')
            for j in range(i + 1, n):
                by = points[j][1]
                if by <= ay and by > max_y:
                    ans += 1
                    max_y = by
        return ans` },
  'find-the-number-of-ways-to-place-people-ii': { python: `class Solution:
    def numberOfPairs(self, points: List[List[int]]) -> int:
        points.sort(key=lambda p: (p[0], -p[1]))
        n = len(points)
        ans = 0
        for i in range(n):
            ay = points[i][1]
            max_y = float('-inf')
            for j in range(i + 1, n):
                by = points[j][1]
                if by <= ay and by > max_y:
                    ans += 1
                    max_y = by
        return ans` },
  'find-the-number-of-winning-players': { python: `class Solution:
    def winningPlayerCount(self, n: int, pick: List[List[int]]) -> int:
        from collections import defaultdict
        counts = defaultdict(lambda: defaultdict(int))
        for x, y in pick:
            counts[x][y] += 1
        wins = 0
        for i in range(n):
            if any(c > i for c in counts[i].values()):
                wins += 1
        return wins` },
  'find-the-occurrence-of-first-almost-equal-substring': { python: `class Solution:
    def minStartingIndex(self, s: str, pattern: str) -> int:
        n, m = len(s), len(pattern)
        for i in range(n - m + 1):
            mism = 0
            ok = True
            for j in range(m):
                if s[i + j] != pattern[j]:
                    mism += 1
                    if mism > 1:
                        ok = False
                        break
            if ok:
                return i
        return -1` },
  'find-the-original-typed-string-i': { python: `class Solution:
    def possibleStringCount(self, word: str) -> int:
        count = 1
        i = 0
        n = len(word)
        while i < n:
            j = i
            while j < n and word[j] == word[i]:
                j += 1
            count += (j - i - 1)
            i = j
        return count` },
  'find-the-original-typed-string-ii': { python: `class Solution:
    def possibleStringCount(self, word: str, k: int) -> int:
        MOD = 10**9 + 7
        groups = []
        i = 0
        n = len(word)
        while i < n:
            j = i
            while j < n and word[j] == word[i]:
                j += 1
            groups.append(j - i)
            i = j
        total = 1
        for g in groups:
            total = total * g % MOD
        m = len(groups)
        if k <= m:
            return total
        dp = [0] * k
        dp[0] = 1
        for g in groups:
            ndp = [0] * k
            prefix = [0] * (k + 1)
            for t in range(k):
                prefix[t + 1] = (prefix[t] + dp[t]) % MOD
            for t in range(k):
                lo = max(0, t - g)
                ndp[t] = (prefix[t] - prefix[lo]) % MOD
            dp = ndp
        bad = sum(dp) % MOD
        return (total - bad) % MOD` },
  'find-the-peaks': { python: `class Solution:
    def findPeaks(self, mountain: List[int]) -> List[Any]:
        res = []
        for i in range(1, len(mountain) - 1):
            if mountain[i] > mountain[i - 1] and mountain[i] > mountain[i + 1]:
                res.append(i)
        return res` },
  'find-the-power-of-k-size-subarrays-i': { python: `class Solution:
    def resultsArray(self, nums: List[int], k: int) -> List[int]:
        n = len(nums)
        res = []
        run = 1
        for i in range(n):
            if i > 0 and nums[i] == nums[i - 1] + 1:
                run += 1
            else:
                run = 1
            if i >= k - 1:
                res.append(nums[i] if run >= k else -1)
        return res` },
  'find-the-power-of-k-size-subarrays-ii': { python: `class Solution:
    def resultsArray(self, nums: List[int], k: int) -> List[int]:
        n = len(nums)
        res = []
        run = 1
        for i in range(n):
            if i > 0 and nums[i] == nums[i - 1] + 1:
                run += 1
            else:
                run = 1
            if i >= k - 1:
                res.append(nums[i] if run >= k else -1)
        return res` },
  'find-the-punishment-number-of-an-integer': { python: `class Solution:
    def punishmentNumber(self, n: int) -> int:
        def can(s, target, idx, cur):
            if idx == len(s):
                return cur == target
            num = 0
            for j in range(idx, len(s)):
                num = num * 10 + int(s[j])
                if cur + num > target:
                    break
                if can(s, target, j + 1, cur + num):
                    return True
            return False
        total = 0
        for i in range(1, n + 1):
            sq = i * i
            if can(str(sq), i, 0, 0):
                total += sq
        return total` },
  'find-the-safest-path-in-a-grid': { python: `class Solution:
    def maximumSafenessFactor(self, grid: List[List[int]]) -> int:
        from collections import deque
        n = len(grid)
        dist = [[-1] * n for _ in range(n)]
        q = deque()
        for r in range(n):
            for c in range(n):
                if grid[r][c] == 1:
                    dist[r][c] = 0
                    q.append((r, c))
        while q:
            r, c = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and dist[nr][nc] == -1:
                    dist[nr][nc] = dist[r][c] + 1
                    q.append((nr, nc))
        import heapq
        safe = [[-1] * n for _ in range(n)]
        pq = [(-dist[0][0], 0, 0)]
        safe[0][0] = dist[0][0]
        while pq:
            negs, r, c = heapq.heappop(pq)
            s = -negs
            if s < safe[r][c]:
                continue
            if r == n - 1 and c == n - 1:
                return s
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n:
                    ns = min(s, dist[nr][nc])
                    if ns > safe[nr][nc]:
                        safe[nr][nc] = ns
                        heapq.heappush(pq, (-ns, nr, nc))
        return safe[n - 1][n - 1]` },
  'find-the-score-difference-in-a-game': { python: `class Solution:
    def scoreDifference(self, nums: List[int]) -> int:
        scores = [0, 0]
        active = 0
        for i, x in enumerate(nums):
            if nums[i] % 2 == 1:
                active ^= 1
            if (i + 1) % 6 == 0:
                active ^= 1
            scores[active] += x
        return scores[0] - scores[1]` },
  'find-the-score-of-all-prefixes-of-an-array': { python: `class Solution:
    def findPrefixScore(self, nums: List[int]) -> List[int]:
        res = []
        mx = 0
        total = 0
        for x in nums:
            mx = max(mx, x)
            total += x + mx
            res.append(total)
        return res` },
  'find-the-sequence-of-strings-appeared-on-the-screen': { python: `class Solution:
    def stringSequence(self, target: str) -> List[str]:
        res = []
        cur = []
        for ch in target:
            cur.append('a')
            res.append(''.join(cur))
            while cur[-1] != ch:
                cur[-1] = chr(ord(cur[-1]) + 1)
                res.append(''.join(cur))
        return res` },
  'find-the-smallest-balanced-index': { python: `class Solution:
    def smallestBalancedIndex(self, nums: List[int]) -> int:
        n = len(nums)
        suffix_prod = [1] * (n + 1)
        for i in range(n - 1, -1, -1):
            suffix_prod[i] = suffix_prod[i + 1] * nums[i]
        left_sum = 0
        for i in range(n):
            right_prod = suffix_prod[i + 1]
            if left_sum == right_prod:
                return i
            left_sum += nums[i]
        return -1` },
  'find-the-smallest-divisor-given-a-threshold': { python: `class Solution:
    def smallestDivisor(self, nums: List[int], threshold: int) -> int:
        lo, hi = 1, max(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            s = sum((x + mid - 1) // mid for x in nums)
            if s <= threshold:
                hi = mid
            else:
                lo = mid + 1
        return lo` },
  'find-the-string-with-lcp': { python: `class Solution:
    def findTheString(self, lcp: List[List[int]]) -> str:
        n = len(lcp)
        word = [''] * n
        cur = 0
        for i in range(n):
            if word[i] == '':
                if cur >= 26:
                    return ""
                c = chr(ord('a') + cur)
                cur += 1
                for j in range(i, n):
                    if lcp[i][j] > 0:
                        word[j] = c
        for i in range(n - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                if i + 1 < n and j + 1 < n:
                    expected = lcp[i + 1][j + 1] + 1 if word[i] == word[j] else 0
                else:
                    expected = 1 if word[i] == word[j] else 0
                if lcp[i][j] != expected:
                    return ""
        return ''.join(word)` },
  'find-the-student-that-will-replace-the-chalk': { python: `class Solution:
    def chalkReplacer(self, chalk: List[int], k: int) -> int:
        total = sum(chalk)
        k %= total
        for i, c in enumerate(chalk):
            if k < c:
                return i
            k -= c
        return 0` },
  'find-the-substring-with-maximum-cost': { python: `class Solution:
    def maximumCostSubstring(self, s: str, chars: str, vals: List[int]) -> int:
        val_map = {}
        for c, v in zip(chars, vals):
            val_map[c] = v
        best = 0
        cur = 0
        for ch in s:
            v = val_map.get(ch, ord(ch) - ord('a') + 1)
            cur = max(v, cur + v)
            best = max(best, cur)
        return best` },
  'find-the-sum-of-encrypted-integers': { python: `class Solution:
    def sumOfEncryptedInt(self, nums: List[int]) -> int:
        total = 0
        for x in nums:
            s = str(x)
            d = max(int(ch) for ch in s)
            total += int(str(d) * len(s))
        return total` },
  'find-the-sum-of-subsequence-powers': { python: `class Solution:
    def sumOfPowers(self, nums: List[int], k: int) -> int:
        MOD = 10**9 + 7
        nums.sort()
        n = len(nums)
        from functools import lru_cache
        INF = float('inf')
        @lru_cache(maxsize=None)
        def dp(i, prev, cnt, mn):
            if cnt == k:
                return mn % MOD
            if i == n:
                return 0
            res = dp(i + 1, prev, cnt, mn)
            nm = mn if prev == -1 else min(mn, nums[i] - nums[prev])
            res = (res + dp(i + 1, i, cnt + 1, nm)) % MOD
            return res
        ans = dp(0, -1, 0, INF)
        dp.cache_clear()
        return ans % MOD` },
  'find-the-sum-of-the-power-of-all-subsequences': { python: `class Solution:
    def sumOfPower(self, nums: List[int], k: int) -> int:
        MOD = 10**9 + 7
        n = len(nums)
        dp = [[0] * (k + 1) for _ in range(n + 1)]
        dp[0][0] = 1
        for x in nums:
            for c in range(n, 0, -1):
                for s in range(k, -1, -1):
                    dp[c][s] = (2 * dp[c][s]) % MOD
                    if s >= x:
                        dp[c][s] = (dp[c][s] + dp[c - 1][s - x]) % MOD
            dp[0][0] = (2 * dp[0][0]) % MOD
        ans = 0
        for c in range(n + 1):
            ans = (ans + dp[c][k]) % MOD
        return ans` },
  'find-the-value-of-the-partition': { python: `class Solution:
    def findValueOfPartition(self, nums: List[int]) -> int:
        nums.sort()
        return min(nums[i + 1] - nums[i] for i in range(len(nums) - 1))` },
  'find-the-width-of-columns-of-a-grid': { python: `class Solution:
    def findColumnWidth(self, grid: List[List[int]]) -> List[int]:
        n = len(grid[0])
        res = []
        for j in range(n):
            w = 0
            for i in range(len(grid)):
                w = max(w, len(str(grid[i][j])))
            res.append(w)
        return res` },
  'find-the-winner-of-an-array-game': { python: `class Solution:
    def getWinner(self, arr: List[int], k: int) -> int:
        cur = arr[0]
        win = 0
        for i in range(1, len(arr)):
            if arr[i] > cur:
                cur = arr[i]
                win = 1
            else:
                win += 1
            if win == k:
                return cur
        return cur` },
  'find-the-winning-player-in-coin-game': { python: `class Solution:
    def winningPlayer(self, x: int, y: int) -> str:
        turns = min(x, y // 4)
        return "Alice" if turns % 2 == 1 else "Bob"` },
  'find-the-xor-of-numbers-which-appear-twice': { python: `class Solution:
    def duplicateNumbersXOR(self, nums: List[int]) -> int:
        from collections import Counter
        cnt = Counter(nums)
        res = 0
        for v, c in cnt.items():
            if c == 2:
                res ^= v
        return res` },
  'find-triangular-sum-of-an-array': { python: `class Solution:
    def triangularSum(self, nums: List[int]) -> int:
        nums = nums[:]
        while len(nums) > 1:
            nums = [(nums[i] + nums[i + 1]) % 10 for i in range(len(nums) - 1)]
        return nums[0]` },
  'find-two-non-overlapping-sub-arrays-each-with-target-sum': { python: `class Solution:
    def minSumOfLengths(self, arr: List[int], target: int) -> int:
        n = len(arr)
        INF = float('inf')
        best = [INF] * n
        ans = INF
        left = 0
        cur = 0
        min_len = INF
        for right in range(n):
            cur += arr[right]
            while cur > target:
                cur -= arr[left]
                left += 1
            if cur == target:
                cur_len = right - left + 1
                if left > 0 and best[left - 1] != INF:
                    ans = min(ans, best[left - 1] + cur_len)
                min_len = min(min_len, cur_len)
            best[right] = min_len
        return ans if ans != INF else -1` },
  'find-unique-binary-string': { python: `class Solution:
    def findDifferentBinaryString(self, nums: List[str]) -> str:
        seen = set(nums)
        n = len(nums)
        res = []
        for i in range(n):
            res.append('1' if nums[i][i] == '0' else '0')
        return ''.join(res)` },
  'find-valid-matrix-given-row-and-column-sums': { python: `class Solution:
    def restoreMatrix(self, rowSum: List[int], colSum: List[int]) -> str:
        m, n = len(rowSum), len(colSum)
        res = [[0] * n for _ in range(m)]
        rs = rowSum[:]
        cs = colSum[:]
        for i in range(m):
            for j in range(n):
                v = min(rs[i], cs[j])
                res[i][j] = v
                rs[i] -= v
                cs[j] -= v
        return res` },
  'find-valid-pair-of-adjacent-digits-in-string': { python: `class Solution:
    def findValidPair(self, s: str) -> str:
        from collections import Counter
        cnt = Counter(s)
        for i in range(len(s) - 1):
            a, b = s[i], s[i + 1]
            if a != b and cnt[a] == int(a) and cnt[b] == int(b):
                return a + b
        return ""` },
  'find-weighted-median-node-in-tree': { python: `import sys
class Solution:
    def findMedian(self, n: int, edges: List[List[int]], queries: List[List[int]]) -> List[int]:
        sys.setrecursionlimit(300000)
        from collections import defaultdict
        adj = defaultdict(list)
        for u, v, w in edges:
            adj[u].append((v, w))
            adj[v].append((u, w))
        LOG = max(1, (n).bit_length())
        up = [[0] * n for _ in range(LOG)]
        depth = [0] * n
        distw = [0] * n
        order = []
        parent = [-1] * n
        visited = [False] * n
        stack = [(0, -1, 0, 0)]
        while stack:
            node, par, d, dw = stack.pop()
            if visited[node]:
                continue
            visited[node] = True
            parent[node] = par
            depth[node] = d
            distw[node] = dw
            up[0][node] = par if par != -1 else node
            order.append(node)
            for nb, w in adj[node]:
                if not visited[nb]:
                    stack.append((nb, node, d + 1, dw + w))
        for k in range(1, LOG):
            for v in range(n):
                up[k][v] = up[k - 1][up[k - 1][v]]
        def lca(a, b):
            if depth[a] < depth[b]:
                a, b = b, a
            diff = depth[a] - depth[b]
            for k in range(LOG):
                if (diff >> k) & 1:
                    a = up[k][a]
            if a == b:
                return a
            for k in range(LOG - 1, -1, -1):
                if up[k][a] != up[k][b]:
                    a = up[k][a]
                    b = up[k][b]
            return up[0][a]
        def kth_ancestor(node, k):
            for i in range(LOG):
                if (k >> i) & 1:
                    node = up[i][node]
            return node
        def dist(a, b):
            l = lca(a, b)
            return distw[a] + distw[b] - 2 * distw[l]
        res = []
        for u, v in queries:
            if u == v:
                res.append(u)
                continue
            l = lca(u, v)
            total = dist(u, v)
            half = (total + 1) // 2
            du_l = distw[u] - distw[l]
            if du_l >= half:
                node = u
                target = half
                lo, hi = 0, depth[u] - depth[l]
                ans = u
                while lo <= hi:
                    mid = (lo + hi) // 2
                    anc = kth_ancestor(u, mid)
                    if distw[u] - distw[anc] >= target:
                        ans = anc
                        hi = mid - 1
                    else:
                        lo = mid + 1
                res.append(ans)
            else:
                target = total - half
                lo, hi = 0, depth[v] - depth[l]
                ans = v
                while lo <= hi:
                    mid = (lo + hi) // 2
                    anc = kth_ancestor(v, mid)
                    if distw[v] - distw[anc] <= target:
                        ans = anc
                        lo = mid + 1
                    else:
                        hi = mid - 1
                res.append(ans)
        return res` },
  'find-winner-on-a-tic-tac-toe-game': { python: `class Solution:
    def tictactoe(self, moves: List[List[int]]) -> str:
        rows = [[0, 0, 0], [0, 0, 0]]
        cols = [[0, 0, 0], [0, 0, 0]]
        diag = [0, 0]
        anti = [0, 0]
        for idx, (r, c) in enumerate(moves):
            p = idx % 2
            rows[p][r] += 1
            cols[p][c] += 1
            if r == c:
                diag[p] += 1
            if r + c == 2:
                anti[p] += 1
            if rows[p][r] == 3 or cols[p][c] == 3 or diag[p] == 3 or anti[p] == 3:
                return "A" if p == 0 else "B"
        return "Draw" if len(moves) == 9 else "Pending"` },
  'find-words-containing-character': { python: `class Solution:
    def findWordsContaining(self, words: List[str], x: str) -> List[int]:
        return [i for i, w in enumerate(words) if x in w]` },
  'flip-string-to-monotone-increasing': { python: `class Solution:
    def minFlipsMonoIncr(self, s: str) -> int:
        ones = 0
        flips = 0
        for ch in s:
            if ch == '1':
                ones += 1
            else:
                flips = min(flips + 1, ones)
        return flips` },
  'flower-planting-with-no-adjacent': { python: `class Solution:
    def gardenNoAdj(self, n: int, paths: List[List[int]]) -> List[int]:
        from collections import defaultdict
        adj = defaultdict(list)
        for x, y in paths:
            adj[x].append(y)
            adj[y].append(x)
        ans = [0] * (n + 1)
        for g in range(1, n + 1):
            used = {ans[nb] for nb in adj[g]}
            for color in range(1, 5):
                if color not in used:
                    ans[g] = color
                    break
        return ans[1:]` },
};
