// Authored Python solutions for stub-targets slice [200,250). Keyed by slug.
// Each value is the FULL Python class Solution source.
export default {

'convert-a-number-to-hexadecimal': `class Solution:
    def toHex(self, num: int) -> str:
        if num == 0:
            return "0"
        if num < 0:
            num += 1 << 32
        digits = "0123456789abcdef"
        res = []
        while num > 0:
            res.append(digits[num & 15])
            num >>= 4
        return "".join(reversed(res))`,

'convert-an-array-into-a-2d-array-with-conditions': `from collections import Counter
class Solution:
    def findMatrix(self, nums):
        cnt = Counter()
        rows = []
        for x in nums:
            r = cnt[x]
            if r == len(rows):
                rows.append([])
            rows[r].append(x)
            cnt[x] += 1
        return rows`,

'convert-integer-to-the-sum-of-two-no-zero-integers': `class Solution:
    def getNoZeroIntegers(self, n: int):
        def ok(x):
            return "0" not in str(x)
        for a in range(1, n):
            b = n - a
            if ok(a) and ok(b):
                return [a, b]
        return []`,

'convert-sorted-list-to-binary-search-tree': `class Solution:
    def sortedListToBST(self, nums):
        # nums arrives as a plain list (linked-list values). Build a height-balanced
        # BST and return its level-order serialization (trailing nulls trimmed).
        class T:
            __slots__=('v','l','r')
            def __init__(s,v): s.v=v; s.l=None; s.r=None
        def build(lo, hi):
            if lo > hi:
                return None
            mid = (lo + hi + 1) // 2
            node = T(nums[mid])
            node.l = build(lo, mid - 1)
            node.r = build(mid + 1, hi)
            return node
        root = build(0, len(nums) - 1)
        if not root:
            return []
        out = []
        q = [root]
        while q:
            n = q.pop(0)
            if n is None:
                out.append(None)
                continue
            out.append(n.v)
            q.append(n.l)
            q.append(n.r)
        while out and out[-1] is None:
            out.pop()
        return out`,

'convert-to-base-2': `class Solution:
    def baseNeg2(self, n: int) -> str:
        if n == 0:
            return "0"
        res = []
        while n != 0:
            r = n % (-2)
            n //= (-2)
            if r < 0:
                r += 2
                n += 1
            res.append(str(r))
        return "".join(reversed(res))`,

'coordinate-with-maximum-network-quality': `import math
class Solution:
    def bestCoordinate(self, towers, radius):
        best_q = -1
        best = [0, 0]
        maxx = max(t[0] for t in towers)
        maxy = max(t[1] for t in towers)
        for x in range(0, maxx + 1):
            for y in range(0, maxy + 1):
                q = 0
                for tx, ty, tq in towers:
                    d2 = (tx - x) ** 2 + (ty - y) ** 2
                    if d2 <= radius * radius:
                        d = math.sqrt(d2)
                        q += tq // (1 + d) if False else int(tq // (1 + d))
                if q > best_q:
                    best_q = q
                    best = [x, y]
        return best`,

'count-all-possible-routes': `class Solution:
    def countRoutes(self, locations, start, finish, fuel):
        MOD = 10**9 + 7
        n = len(locations)
        from functools import lru_cache
        @lru_cache(maxsize=None)
        def dp(city, f):
            res = 1 if city == finish else 0
            for nxt in range(n):
                if nxt == city:
                    continue
                cost = abs(locations[city] - locations[nxt])
                if cost <= f:
                    res += dp(nxt, f - cost)
            return res % MOD
        return dp(start, fuel) % MOD`,

'count-all-valid-pickup-and-delivery-options': `class Solution:
    def countOrders(self, n: int) -> int:
        MOD = 10**9 + 7
        res = 1
        for i in range(1, n + 1):
            res = res * i * (2 * i - 1) % MOD
        return res`,

'count-almost-equal-pairs-i': `class Solution:
    def countPairs(self, nums) -> int:
        def variants(x):
            s = str(x)
            res = set()
            res.add(int(s))
            d = list(s)
            for i in range(len(d)):
                for j in range(i + 1, len(d)):
                    e = d[:]
                    e[i], e[j] = e[j], e[i]
                    res.add(int("".join(e)))
            return res
        ans = 0
        n = len(nums)
        vs = [variants(x) for x in nums]
        for i in range(n):
            for j in range(i + 1, n):
                a, b = nums[i], nums[j]
                if a == b or a in vs[j] or b in vs[i]:
                    ans += 1
        return ans`,

'count-almost-equal-pairs-ii': `class Solution:
    def countPairs(self, nums) -> int:
        from collections import Counter
        def variants(x):
            res = set()
            s = str(x)
            base = set()
            base.add(s)
            for i in range(len(s)):
                for j in range(i + 1, len(s)):
                    e = list(s)
                    e[i], e[j] = e[j], e[i]
                    base.add("".join(e))
            two = set(base)
            for t in base:
                for i in range(len(t)):
                    for j in range(i + 1, len(t)):
                        e = list(t)
                        e[i], e[j] = e[j], e[i]
                        two.add("".join(e))
            return set(int(v) for v in two)
        n = len(nums)
        vs = [variants(x) for x in nums]
        ans = 0
        for i in range(n):
            for j in range(i + 1, n):
                a, b = nums[i], nums[j]
                if a == b or a in vs[j] or b in vs[i]:
                    ans += 1
        return ans`,

'count-array-pairs-divisible-by-k': `from math import gcd
from collections import defaultdict
class Solution:
    def countPairs(self, nums, k) -> int:
        cnt = defaultdict(int)
        ans = 0
        for x in nums:
            g = gcd(x, k)
            need = k // g
            for d, c in cnt.items():
                if d % need == 0:
                    ans += c
            cnt[g] += 1
        return ans`,

'count-artifacts-that-can-be-extracted': `class Solution:
    def digArtifacts(self, n, artifacts, dig) -> int:
        dug = set((r, c) for r, c in dig)
        ans = 0
        for r1, c1, r2, c2 in artifacts:
            ok = True
            for r in range(r1, r2 + 1):
                for c in range(c1, c2 + 1):
                    if (r, c) not in dug:
                        ok = False
                        break
                if not ok:
                    break
            if ok:
                ans += 1
        return ans`,

'count-beautiful-numbers': `class Solution:
    def beautifulNumbers(self, l, r) -> int:
        def count(x):
            if x <= 0:
                return 0
            res = 0
            for v in range(1, x + 1):
                p = 1
                s = 0
                for ch in str(v):
                    d = int(ch)
                    p *= d
                    s += d
                if p % s == 0:
                    res += 1
            return res
        return count(r) - count(l - 1)`,

'count-beautiful-splits-in-an-array': `class Solution:
    def beautifulSplits(self, nums) -> int:
        n = len(nums)
        ans = 0
        def is_prefix(a_start, a_len, b_start, b_len):
            if a_len > b_len:
                return False
            for i in range(a_len):
                if nums[a_start + i] != nums[b_start + i]:
                    return False
            return True
        for i in range(1, n):
            for j in range(i + 1, n):
                len1 = i
                len2 = j - i
                len3 = n - j
                cond1 = is_prefix(0, len1, i, len2)
                cond2 = is_prefix(i, len2, j, len3)
                if cond1 or cond2:
                    ans += 1
        return ans`,

'count-beautiful-substrings-i': `class Solution:
    def beautifulSubstrings(self, s, k) -> int:
        vowels = set('aeiou')
        n = len(s)
        ans = 0
        for i in range(n):
            v = c = 0
            for j in range(i, n):
                if s[j] in vowels:
                    v += 1
                else:
                    c += 1
                if v == c and (v * c) % k == 0:
                    ans += 1
        return ans`,

'count-beautiful-substrings-ii': `class Solution:
    def beautifulSubstrings(self, s, k) -> int:
        vowels = set('aeiou')
        n = len(s)
        ans = 0
        for i in range(n):
            v = c = 0
            for j in range(i, n):
                if s[j] in vowels:
                    v += 1
                else:
                    c += 1
                if v == c and (v * c) % k == 0:
                    ans += 1
        return ans`,

'count-binary-palindromic-numbers': `class Solution:
    def countBinaryPalindromes(self, n: int) -> int:
        if n < 0:
            return 0
        count = 1  # for 0
        L = n.bit_length()
        def palindromes_of_length(length):
            half = (length + 1) // 2
            total = 0
            start = 1 << (half - 1)
            end = 1 << half
            for h in range(start, end):
                hs = bin(h)[2:]
                if length % 2 == 0:
                    full = hs + hs[::-1]
                else:
                    full = hs + hs[-2::-1]
                val = int(full, 2)
                if val <= n:
                    total += 1
            return total
        for length in range(1, L + 1):
            count += palindromes_of_length(length)
        return count`,

'count-bowl-subarrays': `class Solution:
    def bowlSubarrays(self, nums) -> int:
        n = len(nums)
        ans = 0
        st = []
        for i in range(n):
            popped = False
            while st and nums[st[-1]] < nums[i]:
                st.pop()
                popped = True
                if st:
                    ans += 1
            if st and not popped and i - st[-1] >= 2:
                ans += 1
            st.append(i)
        return ans`,

'count-caesar-cipher-pairs': `from collections import Counter
class Solution:
    def countPairs(self, words) -> int:
        def key(w):
            return tuple((ord(w[i+1]) - ord(w[i])) % 26 for i in range(len(w)-1))
        cnt = Counter()
        ans = 0
        for w in words:
            k = (len(w), key(w))
            ans += cnt[k]
            cnt[k] += 1
        return ans`,

'count-cells-in-overlapping-horizontal-and-vertical-substrings': `class Solution:
    def countCells(self, grid, pattern) -> int:
        m = len(grid)
        n = len(grid[0])
        p = len(pattern)
        L = m * n
        horiz = [grid[i][j] for i in range(m) for j in range(n)]
        vert = [grid[i][j] for j in range(n) for i in range(m)]
        def matches(arr, allow_wrap_full):
            res = [False] * L
            patt = pattern
            text = "".join(arr)
            start = 0
            while True:
                idx = text.find(patt, start)
                if idx == -1:
                    break
                for t in range(idx, idx + p):
                    res[t] = True
                start = idx + 1
            return res
        h = matches(horiz, True)
        v = matches(vert, True)
        marked = [[False]*n for _ in range(m)]
        for pos in range(L):
            if h[pos]:
                marked[pos // n][pos % n] = True
        ans = 0
        for pos in range(L):
            if v[pos]:
                r = pos % m
                c = pos // m
                if marked[r][c]:
                    ans += 1
        return ans`,

'count-collisions-of-monkeys-on-a-polygon': `class Solution:
    def monkeyMove(self, n: int) -> int:
        MOD = 10**9 + 7
        return (pow(2, n, MOD) - 2) % MOD`,

'count-collisions-on-a-road': `class Solution:
    def countCollisions(self, directions) -> int:
        s = directions.lstrip('L').rstrip('R')
        return sum(1 for ch in s if ch != 'S')`,

'count-commas-in-range': `class Solution:
    def countCommas(self, n: int) -> int:
        total = 0
        for x in range(1, n + 1):
            digits = len(str(x))
            total += (digits - 1) // 3
        return total`,

'count-commas-in-range-ii': `class Solution:
    def countCommas(self, n: int) -> int:
        total = 0
        d = len(str(n))
        for length in range(4, d + 1):
            lo = 10 ** (length - 1)
            hi = 10 ** length - 1
            hi = min(hi, n)
            if lo > hi:
                continue
            cnt = hi - lo + 1
            commas = (length - 1) // 3
            total += cnt * commas
        return total`,

'count-common-words-with-one-occurrence': `from collections import Counter
class Solution:
    def countWords(self, words1, words2) -> int:
        c1 = Counter(words1)
        c2 = Counter(words2)
        ans = 0
        for w, c in c1.items():
            if c == 1 and c2.get(w, 0) == 1:
                ans += 1
        return ans`,

'count-complete-subarrays-in-an-array': `class Solution:
    def countCompleteSubarrays(self, nums) -> int:
        total_distinct = len(set(nums))
        n = len(nums)
        from collections import defaultdict
        ans = 0
        left = 0
        cnt = defaultdict(int)
        distinct = 0
        for right in range(n):
            if cnt[nums[right]] == 0:
                distinct += 1
            cnt[nums[right]] += 1
            while distinct == total_distinct:
                ans += n - right
                cnt[nums[left]] -= 1
                if cnt[nums[left]] == 0:
                    distinct -= 1
                left += 1
        return ans`,

'count-connected-components-in-lcm-graph': `from math import gcd
class Solution:
    def countComponents(self, nums, threshold) -> int:
        n = len(nums)
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        def lcm(a, b):
            return a // gcd(a, b) * b
        valpos = {v: i for i, v in enumerate(nums)}
        vals = [v for v in nums if v <= threshold]
        # For each d, union the smallest in-range multiple-of-d value with every
        # other in-range multiple-of-d value whose lcm with it stays <= threshold.
        for d in range(1, threshold + 1):
            mn = None
            for v in vals:
                if v % d == 0 and (mn is None or v < mn):
                    mn = v
            if mn is None:
                continue
            for v in vals:
                if v % d == 0 and lcm(v, mn) <= threshold:
                    union(valpos[v], valpos[mn])
        return len({find(i) for i in range(n)})`,

'count-connected-subgraphs-with-even-node-sum': `class Solution:
    def evenSumSubgraphs(self, nums, edges) -> int:
        n = len(nums)
        adj = [0] * n
        for u, v in edges:
            adj[u] |= (1 << v)
            adj[v] |= (1 << u)
        ans = 0
        for mask in range(1, 1 << n):
            s = 0
            bits = []
            for i in range(n):
                if mask & (1 << i):
                    s += nums[i]
                    bits.append(i)
            if s % 2 != 0:
                continue
            start = bits[0]
            seen = 1 << start
            stack = [start]
            while stack:
                node = stack.pop()
                nbrs = adj[node] & mask & ~seen
                j = nbrs
                while j:
                    low = j & (-j)
                    idx = low.bit_length() - 1
                    seen |= low
                    stack.append(idx)
                    j ^= low
            if seen == mask:
                ans += 1
        return ans`,

'count-days-spent-together': `class Solution:
    def countDaysTogether(self, arriveAlice, leaveAlice, arriveBob, leaveBob) -> int:
        days = [31,28,31,30,31,30,31,31,30,31,30,31]
        prefix = [0]*13
        for i in range(12):
            prefix[i+1] = prefix[i] + days[i]
        def to_day(s):
            mm = int(s[:2]); dd = int(s[3:])
            return prefix[mm-1] + dd
        start = max(to_day(arriveAlice), to_day(arriveBob))
        end = min(to_day(leaveAlice), to_day(leaveBob))
        return max(0, end - start + 1)`,

'count-days-without-meetings': `class Solution:
    def countDays(self, days, meetings) -> int:
        meetings.sort()
        free = 0
        cur = 1
        for s, e in meetings:
            if s > cur:
                free += s - cur
            cur = max(cur, e + 1)
        if cur <= days:
            free += days - cur + 1
        return free`,

'count-digit-appearances': `class Solution:
    def countDigitOccurrences(self, nums, digit) -> int:
        d = str(digit)
        return sum(str(x).count(d) for x in nums)`,

'count-distinct-integers-after-removing-zeros': `class Solution:
    def countDistinct(self, n: int) -> int:
        seen = set()
        for x in range(1, n + 1):
            seen.add(int(str(x).replace('0', '')))
        return len(seen)`,

'count-distinct-numbers-on-board': `class Solution:
    def distinctIntegers(self, n: int) -> int:
        if n == 1:
            return 1
        return n - 1`,

'count-distinct-subarrays-divisible-by-k-in-sorted-array': `class Solution:
    def numGoodSubarrays(self, nums, k) -> int:
        distinct = set()
        n = len(nums)
        for i in range(n):
            ssum = 0
            for j in range(i, n):
                ssum += nums[j]
                if ssum % k == 0:
                    distinct.add(tuple(nums[i:j+1]))
        return len(distinct)`,

'count-dominant-indices': `class Solution:
    def dominantIndices(self, nums) -> int:
        n = len(nums)
        suffix = 0
        cnt = 0
        ans = 0
        for i in range(n - 1, -1, -1):
            if cnt > 0:
                avg = suffix / cnt
                if nums[i] > avg:
                    ans += 1
            suffix += nums[i]
            cnt += 1
        return ans`,

'count-elements-with-at-least-k-greater-values': `class Solution:
    def countElements(self, nums, k) -> int:
        s = sorted(nums)
        n = len(nums)
        ans = 0
        import bisect
        for x in nums:
            # number strictly greater than x
            greater = n - bisect.bisect_right(s, x)
            if greater >= k:
                ans += 1
        return ans`,

'count-elements-with-maximum-frequency': `from collections import Counter
class Solution:
    def maxFrequencyElements(self, nums) -> int:
        c = Counter(nums)
        mx = max(c.values())
        return sum(v for v in c.values() if v == mx)`,

'count-fancy-numbers-in-a-range': `class Solution:
    def countFancy(self, l, r) -> int:
        def is_good(x):
            s = str(x)
            if len(s) == 1:
                return True
            inc = all(s[i] < s[i+1] for i in range(len(s)-1))
            dec = all(s[i] > s[i+1] for i in range(len(s)-1))
            return inc or dec
        def is_fancy(x):
            if is_good(x):
                return True
            ds = sum(int(c) for c in str(x))
            return is_good(ds)
        return sum(1 for x in range(l, r + 1) if is_fancy(x))`,

'count-fertile-pyramids-in-a-land': `class Solution:
    def countPyramids(self, grid) -> int:
        m = len(grid)
        n = len(grid[0])
        def solve(g):
            R = len(g)
            C = len(g[0])
            dp = [[0]*C for _ in range(R)]
            total = 0
            for i in range(R - 1, -1, -1):
                for j in range(C):
                    if g[i][j] == 0:
                        dp[i][j] = 0
                    elif i == R - 1 or j == 0 or j == C - 1:
                        dp[i][j] = 1
                    else:
                        dp[i][j] = 1 + min(dp[i+1][j-1], dp[i+1][j], dp[i+1][j+1])
                    if dp[i][j] > 1:
                        total += dp[i][j] - 1
            return total
        up = solve(grid)
        flipped = grid[::-1]
        down = solve(flipped)
        return up + down`,

'count-good-integers-on-a-grid-path': `class Solution:
    def countGoodIntegersOnPath(self, l, r, directions) -> int:
        # path of 7 cells in 4x4 grid from (0,0), digits in row-major of 16-digit padded x
        coords = []
        rr = cc = 0
        coords.append((rr, cc))
        for ch in directions:
            if ch == 'D':
                rr += 1
            else:
                cc += 1
            coords.append((rr, cc))
        idxs = [r4 * 4 + c4 for r4, c4 in coords]
        ans = 0
        for x in range(l, r + 1):
            s = str(x).zfill(16)
            seq = [s[i] for i in idxs]
            good = all(seq[i] <= seq[i+1] for i in range(len(seq)-1))
            if good:
                ans += 1
        return ans`,

'count-hills-and-valleys-in-an-array': `class Solution:
    def countHillValley(self, nums) -> int:
        comp = [nums[0]]
        for x in nums[1:]:
            if x != comp[-1]:
                comp.append(x)
        ans = 0
        for i in range(1, len(comp) - 1):
            if comp[i] > comp[i-1] and comp[i] > comp[i+1]:
                ans += 1
            elif comp[i] < comp[i-1] and comp[i] < comp[i+1]:
                ans += 1
        return ans`,

'count-increasing-quadruplets': `class Solution:
    def countQuadruplets(self, nums) -> int:
        n = len(nums)
        ans = 0
        for j in range(n):
            for k in range(j + 1, n):
                if nums[j] > nums[k]:
                    cnt_i = sum(1 for i in range(j) if nums[i] < nums[k])
                    cnt_l = sum(1 for l in range(k + 1, n) if nums[l] > nums[j])
                    ans += cnt_i * cnt_l
        return ans`,

'count-indices-with-opposite-parity': `class Solution:
    def countOppositeParity(self, nums):
        n = len(nums)
        suffix_even = [0] * (n + 1)
        suffix_odd = [0] * (n + 1)
        for i in range(n - 1, -1, -1):
            suffix_even[i] = suffix_even[i+1] + (1 if nums[i] % 2 == 0 else 0)
            suffix_odd[i] = suffix_odd[i+1] + (1 if nums[i] % 2 == 1 else 0)
        res = []
        for i in range(n):
            if nums[i] % 2 == 0:
                res.append(suffix_odd[i+1])
            else:
                res.append(suffix_even[i+1])
        return res`,

'count-integers-with-even-digit-sum': `class Solution:
    def countEven(self, num: int) -> int:
        ans = 0
        for x in range(1, num + 1):
            if sum(int(c) for c in str(x)) % 2 == 0:
                ans += 1
        return ans`,

'count-islands-with-total-value-divisible-by-k': `class Solution:
    def countIslands(self, grid, k) -> int:
        m = len(grid)
        n = len(grid[0])
        seen = [[False]*n for _ in range(m)]
        ans = 0
        for i in range(m):
            for j in range(n):
                if grid[i][j] > 0 and not seen[i][j]:
                    stack = [(i, j)]
                    seen[i][j] = True
                    total = 0
                    while stack:
                        r, c = stack.pop()
                        total += grid[r][c]
                        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > 0 and not seen[nr][nc]:
                                seen[nr][nc] = True
                                stack.append((nr, nc))
                    if total % k == 0:
                        ans += 1
        return ans`,

};
