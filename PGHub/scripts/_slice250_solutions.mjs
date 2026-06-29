// Hand-authored Python solutions for stub-targets slice [250,300).
// Keyed by problem id (slug). Each value is the FULL class with the canonical
// method, matching the stored method_name + positional params order.
export const SOLUTIONS = {

'count-k-th-roots-in-a-range': `class Solution:
    def countKthRoots(self, l: int, r: int, k: int) -> int:
        count = 0
        x = 1
        while True:
            y = x ** k
            if y > r:
                break
            if y >= l:
                count += 1
            x += 1
        return count`,

'count-lattice-points-inside-a-circle': `class Solution:
    def countLatticePoints(self, circles):
        pts = set()
        for cx, cy, r in circles:
            for x in range(cx - r, cx + r + 1):
                for y in range(cy - r, cy + r + 1):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                        pts.add((x, y))
        return len(pts)`,

'count-mentions-per-user': `class Solution:
    def countMentions(self, numberOfUsers: int, events):
        def key(e):
            t = int(e[1])
            return (t, 0 if e[0] == "OFFLINE" else 1)
        events = sorted(events, key=key)
        mentions = [0] * numberOfUsers
        online_at = [0] * numberOfUsers
        cur = 0
        for typ, ts, data in events:
            t = int(ts)
            if typ == "OFFLINE":
                uid = int(data)
                online_at[uid] = t + 60
            else:
                if data == "ALL":
                    for i in range(numberOfUsers):
                        mentions[i] += 1
                elif data == "HERE":
                    for i in range(numberOfUsers):
                        if online_at[i] <= t:
                            mentions[i] += 1
                else:
                    for tok in data.split():
                        uid = int(tok[2:])
                        mentions[uid] += 1
        return mentions`,

'count-monobit-integers': `class Solution:
    def countMonobit(self, n: int) -> int:
        count = 0
        for i in range(n + 1):
            b = bin(i)[2:]
            if all(c == b[0] for c in b):
                count += 1
        return count`,

'count-negative-numbers-in-a-sorted-matrix': `class Solution:
    def countNegatives(self, grid) -> int:
        return sum(1 for row in grid for v in row if v < 0)`,

'count-nice-pairs-in-an-array': `class Solution:
    def countNicePairs(self, nums) -> int:
        MOD = 10 ** 9 + 7
        from collections import Counter
        cnt = Counter()
        ans = 0
        for x in nums:
            key = x - int(str(x)[::-1])
            ans = (ans + cnt[key]) % MOD
            cnt[key] += 1
        return ans`,

'count-no-zero-pairs-that-sum-to-n': `class Solution:
    def countNoZeroPairs(self, n: int) -> int:
        def has_zero(x):
            return '0' in str(x)
        count = 0
        for a in range(1, n):
            b = n - a
            if not has_zero(a) and not has_zero(b):
                count += 1
        return count`,

'count-nodes-equal-to-average-of-subtree': `class Solution:
    def averageOfSubtree(self, root) -> int:
        if not root:
            return 0
        n = len(root)
        left = [None] * n
        right = [None] * n
        idx = 1
        for i in range(n):
            if root[i] is None:
                continue
            if idx < n and root[idx] is not None:
                left[i] = idx
            idx += 1
            if idx < n and root[idx] is not None:
                right[i] = idx
            idx += 1
        self.ans = 0
        def dfs(i):
            if i is None or root[i] is None:
                return (0, 0)
            ls, lc = dfs(left[i])
            rs, rc = dfs(right[i])
            s = ls + rs + root[i]
            c = lc + rc + 1
            if s // c == root[i]:
                self.ans += 1
            return (s, c)
        dfs(0)
        return self.ans`,

'count-nodes-with-the-highest-score': `class Solution:
    def countHighestScoreNodes(self, parents) -> int:
        n = len(parents)
        children = [[] for _ in range(n)]
        for i in range(1, n):
            children[parents[i]].append(i)
        size = [0] * n
        order = []
        import sys
        sys.setrecursionlimit(300000)
        def comp(node):
            s = 1
            for c in children[node]:
                s += comp(c)
            size[node] = s
            return s
        comp(0)
        best = 0
        cnt = 0
        for i in range(n):
            score = 1
            for c in children[i]:
                score *= size[c]
            above = n - size[i]
            if above > 0:
                score *= above
            if score > best:
                best = score
                cnt = 1
            elif score == best:
                cnt += 1
        return cnt`,

'count-non-decreasing-arrays-with-given-digit-sums': `class Solution:
    def countArrays(self, digitSum) -> int:
        MOD = 10 ** 9 + 7
        LIMIT = 5000
        def ds(x):
            s = 0
            while x:
                s += x % 10
                x //= 10
            return s
        vals = [[] for _ in range(46)]
        for v in range(LIMIT + 1):
            vals[ds(v)].append(v)
        n = len(digitSum)
        prev = None
        ways = None
        for i in range(n):
            cur_vals = vals[digitSum[i]] if digitSum[i] <= 45 else []
            if i == 0:
                ways = {v: 1 for v in cur_vals}
            else:
                from bisect import bisect_left
                keys = sorted(ways.keys())
                pref = [0]
                for kk in keys:
                    pref.append((pref[-1] + ways[kk]) % MOD)
                new_ways = {}
                for v in cur_vals:
                    j = bisect_left(keys, v + 1)
                    new_ways[v] = pref[j] % MOD
                ways = new_ways
        return sum(ways.values()) % MOD if ways else 0`,

'count-non-decreasing-subarrays-after-k-operations': `class Solution:
    def countNonDecreasingSubarrays(self, nums, k: int) -> int:
        n = len(nums)
        ans = 0
        for l in range(n):
            mx = nums[l]
            cost = 0
            for r in range(l, n):
                if nums[r] > mx:
                    mx = nums[r]
                cost += mx - nums[r]
                if cost <= k:
                    ans += 1
                else:
                    break
        return ans`,

'count-number-of-balanced-permutations': `class Solution:
    def countBalancedPermutations(self, num: str) -> int:
        MOD = 10 ** 9 + 7
        from math import factorial
        from collections import Counter
        digits = [int(c) for c in num]
        total = sum(digits)
        if total % 2:
            return 0
        n = len(num)
        half = n // 2
        target = total // 2
        cnt = Counter(digits)
        fact = [1] * (n + 1)
        for i in range(1, n + 1):
            fact[i] = fact[i - 1] * i % MOD
        inv_fact = [1] * (n + 1)
        inv_fact[n] = pow(fact[n], MOD - 2, MOD)
        for i in range(n, 0, -1):
            inv_fact[i - 1] = inv_fact[i] * i % MOD
        ceil_half = n - half
        from functools import lru_cache
        digs = list(range(10))
        dp = {}
        dp[(0, 0, 0)] = 1
        for d in range(10):
            c = cnt[d]
            ndp = {}
            for (cntEven, sEven), ways in [((k[1], k[2]), v) for k, v in dp.items() if k[0] == d] if False else []:
                pass
            new = {}
            for (di, ce, se), ways in dp.items():
                if di != d:
                    continue
                for take in range(0, c + 1):
                    nce = ce + take
                    if nce > half:
                        continue
                    nse = se + take * d
                    if nse > target:
                        continue
                    contrib = ways * inv_fact[take] % MOD * inv_fact[c - take] % MOD
                    key = (d + 1, nce, nse)
                    new[key] = (new.get(key, 0) + contrib) % MOD
            for k, v in new.items():
                dp[k] = (dp.get(k, 0) + v) % MOD
        ans = dp.get((10, half, target), 0)
        ans = ans * fact[half] % MOD * fact[ceil_half] % MOD
        return ans`,

'count-number-of-distinct-integers-after-reverse-operations': `class Solution:
    def countDistinctIntegers(self, nums) -> int:
        s = set()
        for x in nums:
            s.add(x)
            s.add(int(str(x)[::-1]))
        return len(s)`,

'count-number-of-homogenous-substrings': `class Solution:
    def countHomogenous(self, s: str) -> int:
        MOD = 10 ** 9 + 7
        ans = 0
        run = 0
        prev = ''
        for c in s:
            if c == prev:
                run += 1
            else:
                run = 1
                prev = c
            ans += run
        return ans % MOD`,

'count-number-of-maximum-bitwise-or-subsets': `class Solution:
    def countMaxOrSubsets(self, nums) -> int:
        max_or = 0
        for x in nums:
            max_or |= x
        n = len(nums)
        count = 0
        for mask in range(1, 1 << n):
            cur = 0
            for i in range(n):
                if mask & (1 << i):
                    cur |= nums[i]
            if cur == max_or:
                count += 1
        return count`,

'count-number-of-possible-root-nodes': `class Solution:
    def rootCount(self, edges, guesses, k: int) -> int:
        from collections import defaultdict
        n = len(edges) + 1
        adj = defaultdict(list)
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
        guess_set = set((u, v) for u, v in guesses)
        import sys
        sys.setrecursionlimit(300000)
        correct0 = 0
        parent = [-1] * n
        order = []
        stack = [0]
        visited = [False] * n
        visited[0] = True
        while stack:
            node = stack.pop()
            order.append(node)
            for nb in adj[node]:
                if not visited[nb]:
                    visited[nb] = True
                    parent[nb] = node
                    stack.append(nb)
        for node in order:
            for nb in adj[node]:
                if parent[node] == nb:
                    continue
                if (node, nb) in guess_set:
                    correct0 += 1
        ans = 0
        score = [0] * n
        score[0] = correct0
        for node in order[1:]:
            p = parent[node]
            s = score[p]
            if (p, node) in guess_set:
                s -= 1
            if (node, p) in guess_set:
                s += 1
            score[node] = s
        return sum(1 for x in score if x >= k)`,

'count-number-of-rectangles-containing-each-point': `class Solution:
    def countRectangles(self, rectangles, points):
        from bisect import bisect_left
        by_height = [[] for _ in range(101)]
        for l, h in rectangles:
            by_height[h].append(l)
        for h in range(101):
            by_height[h].sort()
        res = []
        for x, y in points:
            cnt = 0
            for h in range(y, 101):
                arr = by_height[h]
                cnt += len(arr) - bisect_left(arr, x)
            res.append(cnt)
        return res`,

'count-number-of-special-subsequences': `class Solution:
    def countSpecialSubsequences(self, nums) -> int:
        MOD = 10 ** 9 + 7
        c0 = c1 = c2 = 0
        for v in nums:
            if v == 0:
                c0 = (2 * c0 + 1) % MOD
            elif v == 1:
                c1 = (2 * c1 + c0) % MOD
            else:
                c2 = (2 * c2 + c1) % MOD
        return c2 % MOD`,

'count-number-of-teams': `class Solution:
    def numTeams(self, rating) -> int:
        n = len(rating)
        ans = 0
        for j in range(n):
            less_left = sum(1 for i in range(j) if rating[i] < rating[j])
            great_left = j - less_left
            less_right = sum(1 for k in range(j + 1, n) if rating[k] < rating[j])
            great_right = (n - j - 1) - less_right
            ans += less_left * great_right + great_left * less_right
        return ans`,

'count-number-of-texts': `class Solution:
    def countTexts(self, pressedKeys: str) -> int:
        MOD = 10 ** 9 + 7
        n = len(pressedKeys)
        dp3 = [0] * (n + 1)
        dp4 = [0] * (n + 1)
        dp3[0] = 1
        dp4[0] = 1
        for i in range(1, n + 1):
            c = pressedKeys[i - 1]
            dp3[i] = dp3[i - 1]
            if i >= 2 and pressedKeys[i - 2] == c:
                dp3[i] = (dp3[i] + dp3[i - 2]) % MOD
            if i >= 3 and pressedKeys[i - 3] == c == pressedKeys[i - 2]:
                dp3[i] = (dp3[i] + dp3[i - 3]) % MOD
            dp4[i] = dp4[i - 1]
            if i >= 2 and pressedKeys[i - 2] == c:
                dp4[i] = (dp4[i] + dp4[i - 2]) % MOD
            if i >= 3 and pressedKeys[i - 3] == c == pressedKeys[i - 2]:
                dp4[i] = (dp4[i] + dp4[i - 3]) % MOD
            if i >= 4 and c in '79' and pressedKeys[i - 4] == c == pressedKeys[i - 3] == pressedKeys[i - 2]:
                dp4[i] = (dp4[i] + dp4[i - 4]) % MOD
        ans = 1
        i = 0
        while i < n:
            j = i
            while j < n and pressedKeys[j] == pressedKeys[i]:
                j += 1
            run = j - i
            if pressedKeys[i] in '79':
                ans = ans * dp4[run] % MOD
            else:
                ans = ans * dp3[run] % MOD
            i = j
        return ans % MOD`,

'count-number-of-trapezoids-i': `class Solution:
    def countTrapezoids(self, points) -> int:
        MOD = 10 ** 9 + 7
        from collections import Counter
        rows = Counter()
        for x, y in points:
            rows[y] += 1
        pair_counts = []
        for y, c in rows.items():
            pair_counts.append(c * (c - 1) // 2)
        total = sum(pair_counts) % MOD
        sum_sq = sum(p * p for p in pair_counts) % MOD
        ans = (total * total - sum_sq) % MOD
        ans = ans * pow(2, MOD - 2, MOD) % MOD
        return ans`,

'count-number-of-trapezoids-ii': `class Solution:
    def countTrapezoids(self, points) -> int:
        from collections import defaultdict
        from math import gcd
        n = len(points)
        slope_pairs = defaultdict(int)
        slope_mid = defaultdict(lambda: defaultdict(int))
        for i in range(n):
            x1, y1 = points[i]
            for j in range(i + 1, n):
                x2, y2 = points[j]
                dx = x2 - x1
                dy = y2 - y1
                g = gcd(dx, dy)
                if g != 0:
                    dx //= g
                    dy //= g
                if dx < 0 or (dx == 0 and dy < 0):
                    dx, dy = -dx, -dy
                slope = (dx, dy)
                slope_pairs[slope] += 1
                mx = x1 + x2
                my = y1 + y2
                slope_mid[slope][(mx, my)] += 1
        total_par = 0
        for slope, c in slope_pairs.items():
            total_par += c * (c - 1) // 2
        para = 0
        for slope, mids in slope_mid.items():
            for mid, c in mids.items():
                para += c * (c - 1) // 2
        return total_par - para`,

'count-number-of-ways-to-place-houses': `class Solution:
    def countHousePlacements(self, n: int) -> int:
        MOD = 10 ** 9 + 7
        a, b = 1, 1
        for _ in range(n):
            a, b = b, (a + b) % MOD
        single = b
        return single * single % MOD`,

'count-numbers-with-non-decreasing-digits': `class Solution:
    def countNumbers(self, l: str, r: str, b: int) -> int:
        MOD = 10 ** 9 + 7
        def to_base(num, base):
            if num == 0:
                return [0]
            ds = []
            while num:
                ds.append(num % base)
                num //= base
            return ds[::-1]
        def count_up_to(num):
            if num < 0:
                return 0
            if num == 0:
                return 1
            digits = to_base(num, b)
            from functools import lru_cache
            n = len(digits)
            @lru_cache(maxsize=None)
            def dp(pos, prev, tight, started):
                if pos == n:
                    return 1
                limit = digits[pos] if tight else b - 1
                total = 0
                for d in range(0, limit + 1):
                    if started and d < prev:
                        continue
                    nstarted = started or d > 0
                    nprev = d if nstarted else 0
                    total += dp(pos + 1, nprev, tight and d == limit, nstarted)
                return total % MOD
            res = dp(0, 0, True, False)
            dp.cache_clear()
            return res % MOD
        L = int(l)
        R = int(r)
        return (count_up_to(R) - count_up_to(L - 1)) % MOD`,

'count-odd-numbers-in-an-interval-range': `class Solution:
    def countOdds(self, low: int, high: int) -> int:
        return (high + 1) // 2 - low // 2`,

'count-of-integers': `class Solution:
    def count(self, num1: str, num2: str, min_sum: int, max_sum: int) -> int:
        MOD = 10 ** 9 + 7
        def count_up_to(num_str):
            digits = [int(c) for c in num_str]
            n = len(digits)
            from functools import lru_cache
            @lru_cache(maxsize=None)
            def dp(pos, ssum, tight):
                if ssum > max_sum:
                    return 0
                if pos == n:
                    return 1 if min_sum <= ssum <= max_sum else 0
                limit = digits[pos] if tight else 9
                total = 0
                for d in range(0, limit + 1):
                    total += dp(pos + 1, ssum + d, tight and d == limit)
                return total % MOD
            res = dp(0, 0, True)
            dp.cache_clear()
            return res % MOD
        hi = count_up_to(num2)
        lo_num = int(num1) - 1
        if lo_num < 0:
            lo = 0
        else:
            lo = count_up_to(str(lo_num))
        return (hi - lo) % MOD`,

'count-of-interesting-subarrays': `class Solution:
    def countInterestingSubarrays(self, nums, modulo: int, k: int) -> int:
        from collections import defaultdict
        cnt = defaultdict(int)
        cnt[0] = 1
        prefix = 0
        ans = 0
        for v in nums:
            if v % modulo == k:
                prefix += 1
            need = (prefix - k) % modulo
            ans += cnt[need]
            cnt[prefix % modulo] += 1
        return ans`,

'count-of-range-sum': `class Solution:
    def countRangeSum(self, nums, lower: int, upper: int) -> int:
        prefix = [0]
        for x in nums:
            prefix.append(prefix[-1] + x)
        def sort_count(lo, hi):
            if hi - lo <= 1:
                return 0
            mid = (lo + hi) // 2
            count = sort_count(lo, mid) + sort_count(mid, hi)
            j = k = mid
            for left in prefix[lo:mid]:
                while j < hi and prefix[j] - left < lower:
                    j += 1
                while k < hi and prefix[k] - left <= upper:
                    k += 1
                count += k - j
            prefix[lo:hi] = sorted(prefix[lo:hi])
            return count
        return sort_count(0, len(prefix))`,

'count-of-sub-multisets-with-bounded-sum': `class Solution:
    def countSubMultisets(self, nums, l: int, r: int) -> int:
        MOD = 10 ** 9 + 7
        from collections import Counter
        cnt = Counter(nums)
        dp = [0] * (r + 1)
        dp[0] = 1
        zeros = cnt.pop(0, 0)
        for val, c in cnt.items():
            if val > r:
                continue
            ndp = dp[:]
            for s in range(val, r + 1):
                ndp[s] = (ndp[s] + ndp[s - val]) % MOD
                j = s - (c + 1) * val
                if j >= 0:
                    ndp[s] = (ndp[s] - dp[j]) % MOD
            dp = ndp
        ans = sum(dp[l:r + 1]) % MOD
        ans = ans * (zeros + 1) % MOD
        return ans`,

'count-of-substrings-containing-every-vowel-and-k-consonants-i': `class Solution:
    def countOfSubstrings(self, word: str, k: int) -> int:
        vowels = set('aeiou')
        def at_least(m):
            from collections import defaultdict
            res = 0
            vc = defaultdict(int)
            distinct = 0
            cons = 0
            left = 0
            for right in range(len(word)):
                c = word[right]
                if c in vowels:
                    vc[c] += 1
                    if vc[c] == 1:
                        distinct += 1
                else:
                    cons += 1
                while distinct == 5 and cons >= m:
                    res += len(word) - right
                    lc = word[left]
                    if lc in vowels:
                        vc[lc] -= 1
                        if vc[lc] == 0:
                            distinct -= 1
                    else:
                        cons -= 1
                    left += 1
            return res
        return at_least(k) - at_least(k + 1)`,

'count-of-substrings-containing-every-vowel-and-k-consonants-ii': `class Solution:
    def countOfSubstrings(self, word: str, k: int) -> int:
        vowels = set('aeiou')
        def at_least(m):
            from collections import defaultdict
            res = 0
            vc = defaultdict(int)
            distinct = 0
            cons = 0
            left = 0
            for right in range(len(word)):
                c = word[right]
                if c in vowels:
                    vc[c] += 1
                    if vc[c] == 1:
                        distinct += 1
                else:
                    cons += 1
                while distinct == 5 and cons >= m:
                    res += len(word) - right
                    lc = word[left]
                    if lc in vowels:
                        vc[lc] -= 1
                        if vc[lc] == 0:
                            distinct -= 1
                    else:
                        cons -= 1
                    left += 1
            return res
        return at_least(k) - at_least(k + 1)`,

'count-operations-to-obtain-zero': `class Solution:
    def countOperations(self, num1: int, num2: int) -> int:
        ops = 0
        while num1 > 0 and num2 > 0:
            if num1 >= num2:
                ops += num1 // num2
                num1 %= num2
            else:
                ops += num2 // num1
                num2 %= num1
        return ops`,

'count-pairs-of-connectable-servers-in-a-weighted-tree-network': `class Solution:
    def countPairsOfConnectableServers(self, edges, signalSpeed):
        from collections import defaultdict
        n = len(edges) + 1
        adj = defaultdict(list)
        for a, b, w in edges:
            adj[a].append((b, w))
            adj[b].append((a, w))
        res = [0] * n
        for c in range(n):
            branch_counts = []
            for nb, w in adj[c]:
                cnt = self._dfs(nb, c, w % signalSpeed, adj, signalSpeed)
                branch_counts.append(cnt)
            total = sum(branch_counts)
            pairs = 0
            for cnt in branch_counts:
                pairs += cnt * (total - cnt)
            res[c] = pairs // 2
        return res

    def _dfs(self, node, parent, dist, adj, signalSpeed):
        cnt = 1 if dist == 0 else 0
        for nb, w in adj[node]:
            if nb != parent:
                cnt += self._dfs(nb, node, (dist + w) % signalSpeed, adj, signalSpeed)
        return cnt`,

'count-pairs-of-nodes': `class Solution:
    def countPairs(self, n: int, edges, queries):
        from collections import defaultdict, Counter
        deg = [0] * (n + 1)
        shared = defaultdict(int)
        for u, v in edges:
            deg[u] += 1
            deg[v] += 1
            if u > v:
                u, v = v, u
            shared[(u, v)] += 1
        sorted_deg = sorted(deg[1:])
        res = []
        for q in queries:
            count = 0
            lo, hi = 0, n - 1
            while lo < hi:
                if sorted_deg[lo] + sorted_deg[hi] > q:
                    count += hi - lo
                    hi -= 1
                else:
                    lo += 1
            for (u, v), s in shared.items():
                if deg[u] + deg[v] > q and deg[u] + deg[v] - s <= q:
                    count -= 1
            res.append(count)
        return res`,

'count-pairs-of-points-with-distance-k': `class Solution:
    def countPairs(self, coordinates, k: int) -> int:
        from collections import defaultdict
        seen = defaultdict(int)
        ans = 0
        for x, y in coordinates:
            for a in range(k + 1):
                b = k - a
                px = x ^ a
                py = y ^ b
                ans += seen[(px, py)]
            seen[(x, y)] += 1
        return ans`,

'count-pairs-that-form-a-complete-day-i': `class Solution:
    def countCompleteDayPairs(self, hours) -> int:
        from collections import Counter
        cnt = Counter()
        ans = 0
        for h in hours:
            r = h % 24
            need = (24 - r) % 24
            ans += cnt[need]
            cnt[r] += 1
        return ans`,

'count-pairs-that-form-a-complete-day-ii': `class Solution:
    def countCompleteDayPairs(self, hours) -> int:
        from collections import Counter
        cnt = Counter()
        ans = 0
        for h in hours:
            r = h % 24
            need = (24 - r) % 24
            ans += cnt[need]
            cnt[r] += 1
        return ans`,

'count-pairs-whose-sum-is-less-than-target': `class Solution:
    def countPairs(self, nums, target: int) -> int:
        nums = sorted(nums)
        lo, hi = 0, len(nums) - 1
        ans = 0
        while lo < hi:
            if nums[lo] + nums[hi] < target:
                ans += hi - lo
                lo += 1
            else:
                hi -= 1
        return ans`,

'count-pairs-with-xor-in-a-range': `class Solution:
    def countPairs(self, nums, low: int, high: int) -> int:
        class Trie:
            def __init__(self):
                self.children = [None, None]
                self.count = 0
        BITS = 15
        root = Trie()
        def insert(num):
            node = root
            for i in range(BITS, -1, -1):
                b = (num >> i) & 1
                if node.children[b] is None:
                    node.children[b] = Trie()
                node = node.children[b]
                node.count += 1
        def count_less(num, limit):
            node = root
            res = 0
            for i in range(BITS, -1, -1):
                if node is None:
                    break
                nb = (num >> i) & 1
                lb = (limit >> i) & 1
                if lb == 1:
                    if node.children[nb]:
                        res += node.children[nb].count
                    node = node.children[nb ^ 1]
                else:
                    node = node.children[nb]
            return res
        ans = 0
        for x in nums:
            ans += count_less(x, high + 1) - count_less(x, low)
            insert(x)
        return ans`,

'count-palindromic-subsequences': `class Solution:
    def countPalindromes(self, s: str) -> int:
        MOD = 10 ** 9 + 7
        ans = 0
        for d1 in range(10):
            for d2 in range(10):
                ans = (ans + self._count_pattern(s, str(d1), str(d2))) % MOD
        return ans % MOD

    def _count_pattern(self, s, c1, c2):
        MOD = 10 ** 9 + 7
        n = len(s)
        pre = [0] * n
        cnt1 = 0
        cnt12 = 0
        for i in range(n):
            pre[i] = cnt12
            if s[i] == c2:
                cnt12 += cnt1
            if s[i] == c1:
                cnt1 += 1
        suf = [0] * (n + 1)
        d1c = 0
        d12c = 0
        for i in range(n - 1, -1, -1):
            suf[i] = d12c
            if s[i] == c2:
                d12c += d1c
            if s[i] == c1:
                d1c += 1
        ans = 0
        for i in range(n):
            ans = (ans + pre[i] * suf[i + 1]) % MOD
        return ans`,

'count-partitions-with-even-sum-difference': `class Solution:
    def countPartitions(self, nums) -> int:
        total = sum(nums)
        left = 0
        ans = 0
        n = len(nums)
        for i in range(n - 1):
            left += nums[i]
            right = total - left
            if (left - right) % 2 == 0:
                ans += 1
        return ans`,

'count-partitions-with-max-min-difference-at-most-k': `class Solution:
    def countPartitions(self, nums, k: int) -> int:
        MOD = 10 ** 9 + 7
        from collections import deque
        n = len(nums)
        dp = [0] * (n + 1)
        dp[0] = 1
        prefix = [0] * (n + 1)
        prefix[0] = 1
        maxq = deque()
        minq = deque()
        left = 0
        for r in range(n):
            while maxq and nums[maxq[-1]] <= nums[r]:
                maxq.pop()
            maxq.append(r)
            while minq and nums[minq[-1]] >= nums[r]:
                minq.pop()
            minq.append(r)
            while nums[maxq[0]] - nums[minq[0]] > k:
                if maxq[0] == left:
                    maxq.popleft()
                if minq[0] == left:
                    minq.popleft()
                left += 1
            dp[r + 1] = (prefix[r + 1] - prefix[left]) % MOD
            prefix[r + 2 - 1] = 0
            prefix[r + 1 + 1 - 1] = 0
            prefix_val = (prefix[r + 1] + dp[r + 1]) % MOD
            if r + 2 <= n:
                prefix[r + 2] = prefix_val
            else:
                prefix.append(prefix_val)
        return dp[n] % MOD`,

'count-paths-that-can-form-a-palindrome-in-a-tree': `class Solution:
    def countPalindromePaths(self, parent, s: str) -> int:
        from collections import defaultdict
        n = len(parent)
        children = defaultdict(list)
        for i in range(1, n):
            children[parent[i]].append(i)
        mask = [0] * n
        order = [0]
        stack = [0]
        while stack:
            node = stack.pop()
            for c in children[node]:
                bit = 1 << (ord(s[c]) - ord('a'))
                mask[c] = mask[node] ^ bit
                stack.append(c)
        from collections import Counter
        cnt = Counter()
        ans = 0
        for i in range(n):
            m = mask[i]
            if m in cnt:
                ans += cnt[m]
            for b in range(26):
                t = m ^ (1 << b)
                if t in cnt:
                    ans += cnt[t]
            cnt[m] += 1
        return ans`,

'count-paths-with-the-given-xor-value': `class Solution:
    def countPathsWithXorValue(self, grid, k: int) -> int:
        MOD = 10 ** 9 + 7
        m = len(grid)
        n = len(grid[0])
        from collections import defaultdict
        dp = [[defaultdict(int) for _ in range(n)] for _ in range(m)]
        dp[0][0][grid[0][0]] = 1
        for i in range(m):
            for j in range(n):
                if i == 0 and j == 0:
                    continue
                cur = grid[i][j]
                cell = dp[i][j]
                if i > 0:
                    for x, c in dp[i - 1][j].items():
                        cell[x ^ cur] = (cell[x ^ cur] + c) % MOD
                if j > 0:
                    for x, c in dp[i][j - 1].items():
                        cell[x ^ cur] = (cell[x ^ cur] + c) % MOD
        return dp[m - 1][n - 1].get(k, 0) % MOD`,

'count-prefix-and-suffix-pairs-i': `class Solution:
    def countPrefixSuffixPairs(self, words) -> int:
        n = len(words)
        ans = 0
        for i in range(n):
            for j in range(i + 1, n):
                a, b = words[i], words[j]
                if len(a) <= len(b) and b.startswith(a) and b.endswith(a):
                    ans += 1
        return ans`,

'count-prefix-and-suffix-pairs-ii': `class Solution:
    def countPrefixSuffixPairs(self, words) -> int:
        from collections import defaultdict
        ans = 0
        root = {}
        for word in words:
            node = root
            for i in range(len(word)):
                pair = (word[i], word[len(word) - 1 - i])
                if pair not in node:
                    node[pair] = {'_cnt': 0}
                node = node[pair]
                ans += node.get('_cnt', 0)
            node['_cnt'] = node.get('_cnt', 0) + 1
        return ans`,

'count-prefixes-of-a-given-string': `class Solution:
    def countPrefixes(self, words, s: str) -> int:
        return sum(1 for w in words if s.startswith(w))`,

'count-prime-gap-balanced-subarrays': `class Solution:
    def primeSubarray(self, nums, k: int) -> int:
        from collections import deque
        n = len(nums)
        MAXV = max(nums) + 1 if nums else 2
        sieve = [True] * (MAXV + 1)
        sieve[0] = False
        if MAXV >= 1:
            sieve[1] = False
        for i in range(2, int(MAXV ** 0.5) + 1):
            if sieve[i]:
                for j in range(i * i, MAXV + 1, i):
                    sieve[j] = False
        def is_prime(x):
            return 0 <= x <= MAXV and sieve[x]
        ans = 0
        left = 0
        maxq = deque()
        minq = deque()
        prime_positions = deque()
        for right in range(n):
            if is_prime(nums[right]):
                while maxq and nums[maxq[-1]] <= nums[right]:
                    maxq.pop()
                maxq.append(right)
                while minq and nums[minq[-1]] >= nums[right]:
                    minq.pop()
                minq.append(right)
                prime_positions.append(right)
            while maxq and minq and nums[maxq[0]] - nums[minq[0]] > k:
                left += 1
                while maxq and maxq[0] < left:
                    maxq.popleft()
                while minq and minq[0] < left:
                    minq.popleft()
                while prime_positions and prime_positions[0] < left:
                    prime_positions.popleft()
            if len(prime_positions) >= 2:
                second_prime = prime_positions[1]
                ans += second_prime - left + 1
        return ans`,

'count-residue-prefixes': `class Solution:
    def residuePrefixes(self, s: str) -> int:
        seen = set()
        ans = 0
        for i, c in enumerate(s):
            seen.add(c)
            length = i + 1
            if len(seen) == length % 3:
                ans += 1
        return ans`,

};
