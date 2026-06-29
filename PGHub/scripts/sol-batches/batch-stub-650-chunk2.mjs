export default {
  'find-subsequence-of-length-k-with-the-largest-sum': {
    python: `class Solution:
    def maxSubsequence(self, nums, k):
        idx = sorted(range(len(nums)), key=lambda i: nums[i], reverse=True)[:k]
        idx.sort()
        return [nums[i] for i in idx]`
  },
  'find-the-child-who-has-the-ball-after-k-seconds': {
    python: `class Solution:
    def numberOfChild(self, n, k):
        cycle = 2 * (n - 1)
        r = k % cycle
        if r <= n - 1:
            return r
        return cycle - r`
  },
  'find-the-count-of-numbers-which-are-not-special': {
    python: `class Solution:
    def nonSpecialCount(self, l, r):
        import math
        total = r - l + 1
        lo = math.isqrt(l)
        if lo * lo < l:
            lo += 1
        hi = math.isqrt(r)
        special = 0
        def is_prime(x):
            if x < 2:
                return False
            if x % 2 == 0:
                return x == 2
            i = 3
            while i * i <= x:
                if x % i == 0:
                    return False
                i += 2
            return True
        for p in range(lo, hi + 1):
            if is_prime(p):
                special += 1
        return total - special`
  },
  'find-the-first-player-to-win-k-games-in-a-row': {
    python: `class Solution:
    def findWinningPlayer(self, skills, k):
        n = len(skills)
        cur = 0
        wins = 0
        for i in range(1, n):
            if skills[i] > skills[cur]:
                cur = i
                wins = 1
            else:
                wins += 1
            if wins >= k:
                return cur
        return cur`
  },
  'find-the-k-or-of-an-array': {
    python: `class Solution:
    def findKOr(self, nums, k):
        res = 0
        for b in range(32):
            cnt = sum(1 for x in nums if (x >> b) & 1)
            if cnt >= k:
                res |= (1 << b)
        return res`
  },
  'find-the-kth-largest-integer-in-the-array': {
    python: `class Solution:
    def kthLargestNumber(self, nums, k):
        s = sorted(nums, key=lambda x: (len(x), x), reverse=True)
        return s[k - 1]`
  },
  'find-the-length-of-the-longest-common-prefix': {
    python: `class Solution:
    def longestCommonPrefix(self, arr1, arr2):
        prefixes = set()
        for x in arr1:
            s = str(x)
            for i in range(1, len(s) + 1):
                prefixes.add(s[:i])
        best = 0
        for y in arr2:
            s = str(y)
            for i in range(1, len(s) + 1):
                if s[:i] in prefixes:
                    best = max(best, i)
                else:
                    break
        return best`
  },
  'find-the-longest-valid-obstacle-course-at-each-position': {
    python: `from bisect import bisect_right
class Solution:
    def longestObstacleCourseAtEachPosition(self, obstacles):
        tails = []
        ans = []
        for h in obstacles:
            pos = bisect_right(tails, h)
            if pos == len(tails):
                tails.append(h)
            else:
                tails[pos] = h
            ans.append(pos + 1)
        return ans`
  },
  'find-the-maximum-length-of-a-good-subsequence-i': {
    python: `class Solution:
    def maximumLength(self, nums, k):
        n = len(nums)
        from collections import defaultdict
        dp = [defaultdict(int) for _ in range(k + 1)]
        best = [0] * (k + 1)
        ans = 0
        for x in nums:
            for j in range(k, -1, -1):
                cand = dp[j][x] + 1
                if j > 0:
                    cand = max(cand, best[j - 1] + 1)
                if cand > dp[j][x]:
                    dp[j][x] = cand
                if cand > best[j]:
                    best[j] = cand
                ans = max(ans, cand)
        return ans`
  },
  'find-the-maximum-number-of-fruits-collected': {
    python: `class Solution:
    def maxCollectedFruits(self, fruits):
        n = len(fruits)
        total = sum(fruits[i][i] for i in range(n))
        NEG = float('-inf')

        # Child from (0, n-1): top-right, moving down each step, stays above diagonal (j > i)
        dp = [[NEG] * n for _ in range(n)]
        dp[0][n - 1] = fruits[0][n - 1]
        for i in range(n - 1):
            for j in range(n):
                if dp[i][j] == NEG:
                    continue
                for nj in (j - 1, j, j + 1):
                    if 0 <= nj < n:
                        ni = i + 1
                        if ni == n - 1 and nj != n - 1:
                            continue
                        if nj <= ni and not (ni == n - 1 and nj == n - 1):
                            continue
                        val = dp[i][j] + (fruits[ni][nj] if not (ni == n - 1 and nj == n - 1) else 0)
                        if val > dp[ni][nj]:
                            dp[ni][nj] = val
        total += dp[n - 1][n - 1]

        # Child from (n-1, 0): bottom-left, moving right each step, stays below diagonal (i > j)
        dp2 = [[NEG] * n for _ in range(n)]
        dp2[n - 1][0] = fruits[n - 1][0]
        for j in range(n - 1):
            for i in range(n):
                if dp2[i][j] == NEG:
                    continue
                for ni in (i - 1, i, i + 1):
                    if 0 <= ni < n:
                        nj = j + 1
                        if nj == n - 1 and ni != n - 1:
                            continue
                        if ni <= nj and not (ni == n - 1 and nj == n - 1):
                            continue
                        val = dp2[i][j] + (fruits[ni][nj] if not (ni == n - 1 and nj == n - 1) else 0)
                        if val > dp2[ni][nj]:
                            dp2[ni][nj] = val
        total += dp2[n - 1][n - 1]
        return total`
  },
  'find-the-middle-index-in-array': {
    python: `class Solution:
    def findMiddleIndex(self, nums):
        total = sum(nums)
        left = 0
        for i, v in enumerate(nums):
            if left == total - left - v:
                return i
            left += v
        return -1`
  },
  'find-the-minimum-cost-array-permutation': {
    python: `class Solution:
    def findPermutation(self, nums):
        n = len(nums)
        FULL = (1 << n) - 1
        from functools import lru_cache

        @lru_cache(maxsize=None)
        def solve(last, mask):
            if mask == FULL:
                return abs(last - nums[0])
            best = float('inf')
            for nxt in range(n):
                if not (mask >> nxt) & 1:
                    c = abs(last - nums[nxt]) + solve(nxt, mask | (1 << nxt))
                    if c < best:
                        best = c
            return best

        perm = [0]
        mask = 1
        last = 0
        for _ in range(n - 1):
            best_cost = float('inf')
            best_nxt = -1
            for nxt in range(n):
                if not (mask >> nxt) & 1:
                    c = abs(last - nums[nxt]) + solve(nxt, mask | (1 << nxt))
                    if c < best_cost:
                        best_cost = c
                        best_nxt = nxt
            perm.append(best_nxt)
            mask |= (1 << best_nxt)
            last = best_nxt
        return perm`
  }
};
