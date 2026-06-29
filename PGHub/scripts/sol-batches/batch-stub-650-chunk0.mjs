export default {
  'find-subarray-with-bitwise-or-closest-to-k': {
    python: `class Solution:
    def minimumDifference(self, nums, k):
        best = abs(nums[0] - k)
        cur = set()
        for x in nums:
            cur = {y | x for y in cur}
            cur.add(x)
            for v in cur:
                d = abs(v - k)
                if d < best:
                    best = d
        return best`
  },

  'find-sum-of-array-product-of-magical-sequences': {
    python: `class Solution:
    def magicalSum(self, m, k, nums):
        MOD = 10**9 + 7
        n = len(nums)
        maxbits = m.bit_length() + 1
        from math import comb
        fact = [1] * (m + 1)
        for i in range(1, m + 1):
            fact[i] = fact[i - 1] * i % MOD
        inv_fact = [1] * (m + 1)
        inv_fact[m] = pow(fact[m], MOD - 2, MOD)
        for i in range(m - 1, -1, -1):
            inv_fact[i] = inv_fact[i + 1] * (i + 1) % MOD
        # powers of nums[i]
        powtab = [[1] * (m + 1) for _ in range(n)]
        for i in range(n):
            for c in range(1, m + 1):
                powtab[i][c] = powtab[i][c - 1] * nums[i] % MOD
        # dp over indices: state (used count, carry bits to higher position)
        # dp[used][carry] = sum over assignments so far of product * multinomial-partial
        # We process bit position by bit position is the standard approach:
        # dp[i][j][c] where i = index processed, j = total elements used, c = carry into current bit
        # Simpler: iterate index, track how many elements assigned and a "carry" accumulator of counts at this bit level.
        # Standard solution: process each index, choosing count cnt_i of seq positions equal to i.
        # The number 2^seq sums; total = sum 2^i * cnt_i. set bits of that total must be k.
        # dp[idx][used][carry]: carry = floor of contributions carried into bit (idx) from lower indices.
        # bits counted so far = popcount accumulation.
        # dp[used][carry][bitsSoFar]
        dp = [[[0] * (k + 1) for _ in range(maxbits + 2)] for _ in range(m + 1)]
        dp[0][0][0] = 1
        for i in range(n):
            ndp = [[[0] * (k + 1) for _ in range(maxbits + 2)] for _ in range(m + 1)]
            for used in range(m + 1):
                for carry in range(maxbits + 2):
                    for bits in range(k + 1):
                        cur = dp[used][carry][bits]
                        if cur == 0:
                            continue
                        for cnt in range(0, m - used + 1):
                            total = carry + cnt
                            bit = total & 1
                            newcarry = total >> 1
                            newbits = bits + bit
                            if newbits > k:
                                continue
                            if newcarry > maxbits + 1:
                                continue
                            add = cur * inv_fact[cnt] % MOD * powtab[i][cnt] % MOD
                            ndp[used + cnt][newcarry][newbits] = (ndp[used + cnt][newcarry][newbits] + add) % MOD
            dp = ndp
        ans = 0
        for carry in range(maxbits + 2):
            for bits in range(k + 1):
                v = dp[m][carry][bits]
                if v == 0:
                    continue
                rem = bits + bin(carry).count('1')
                if rem == k:
                    ans = (ans + v * fact[m]) % MOD
        return ans % MOD`
  },

  'find-the-count-of-monotonic-pairs-i': {
    python: `class Solution:
    def countOfPairs(self, nums):
        MOD = 10**9 + 7
        n = len(nums)
        mx = max(nums)
        # dp[a] = number of ways with arr1[i] = a (arr2[i] = nums[i]-a)
        # transition: arr1 non-decreasing -> a' >= a ; arr2 non-increasing -> nums[i+1]-a' <= nums[i]-a
        prev = [1] * (nums[0] + 1)
        for i in range(1, n):
            # prefix sums of prev
            pref = [0] * (len(prev) + 1)
            for j in range(len(prev)):
                pref[j + 1] = (pref[j] + prev[j]) % MOD
            cur = [0] * (nums[i] + 1)
            for a in range(nums[i] + 1):
                # need a_prev <= a and nums[i]-a <= nums[i-1]-a_prev
                # => a_prev <= a and a_prev <= a - (nums[i]-nums[i-1])  ... derive
                # arr2[i] <= arr2[i-1]: nums[i]-a <= nums[i-1]-a_prev => a_prev <= a_prev...
                # nums[i]-a <= nums[i-1]-a_prev => a_prev <= nums[i-1]-nums[i]+a
                hi = min(a, nums[i - 1] - nums[i] + a)
                if hi < 0:
                    continue
                if hi > len(prev) - 1:
                    hi = len(prev) - 1
                cur[a] = pref[hi + 1] % MOD
            prev = cur
        return sum(prev) % MOD`
  },

  'find-the-divisibility-array-of-a-string': {
    python: `class Solution:
    def divisibilityArray(self, word, m):
        res = []
        cur = 0
        for ch in word:
            cur = (cur * 10 + (ord(ch) - 48)) % m
            res.append(1 if cur == 0 else 0)
        return res`
  },

  'find-the-integer-added-to-array-ii': {
    python: `class Solution:
    def minimumAddedInteger(self, nums1, nums2):
        nums1.sort()
        nums2.sort()
        n = len(nums1)
        best = float('inf')
        # remove two elements from nums1; the smallest x.
        # try the 3 possible positions for the first kept element (index 0,1,2 of nums1)
        for i in range(3):
            x = nums2[0] - nums1[i]
            # greedily match nums2 against nums1 allowing up to 2 skips
            j = i
            p = 0
            skips = 0
            ok = True
            while p < len(nums2) and j < n:
                if nums1[j] + x == nums2[p]:
                    p += 1
                    j += 1
                else:
                    j += 1
                    skips += 1
                    if skips > 2:
                        ok = False
                        break
            if p == len(nums2) and skips <= 2:
                best = min(best, x)
        return best`
  },

  'find-the-k-th-character-in-string-game-ii': {
    python: `class Solution:
    def kthCharacter(self, k, operations):
        # find smallest power-of-two length >= k built by ops
        shift = 0
        idx = k - 1
        # determine how many ops needed
        lengths = [1]
        for op in operations:
            lengths.append(lengths[-1] * 2)
            if lengths[-1] >= k:
                break
        depth = len(lengths) - 1
        for i in range(depth - 1, -1, -1):
            half = lengths[i]
            if idx >= half:
                idx -= half
                if operations[i] == 1:
                    shift += 1
        return chr((shift % 26) + 97)`
  },

  'find-the-largest-palindrome-divisible-by-k': {
    python: `class Solution:
    def largestPalindrome(self, n, k):
        # build largest n-digit palindrome divisible by k using digit DP over half
        digits = [0] * n
        half = (n + 1) // 2
        pow10 = [pow(10, i, k) for i in range(n)]
        # contribution of position i (0-indexed from left) digit d to value mod k = d * 10^(n-1-i)
        # we fill mirrored positions; do DP over first half deciding digit, track remainder
        from functools import lru_cache
        import sys
        # iterative greedy with memo on (pos, rem) feasibility
        seen = set()
        def solve(pos, rem):
            if pos == half:
                return rem == 0 if True else False
            for d in range(9, -1, -1):
                if pos == 0 and d == 0 and n > 1:
                    continue
                i = pos
                j = n - 1 - pos
                add = d * pow10[n - 1 - i] % k
                if i != j:
                    add = (add + d * pow10[n - 1 - j]) % k
                nrem = (rem + add) % k
                if (pos + 1, nrem) in seen:
                    continue
                digits[i] = d
                digits[j] = d
                if solve(pos + 1, nrem):
                    return True
                seen.add((pos + 1, nrem))
            return False
        sys.setrecursionlimit(300000)
        solve(0, 0)
        return ''.join(str(x) for x in digits)`
  },

  'find-the-longest-equal-subarray': {
    python: `class Solution:
    def longestEqualSubarray(self, nums, k):
        from collections import defaultdict
        pos = defaultdict(list)
        for i, v in enumerate(nums):
            pos[v].append(i)
        ans = 0
        for v, idxs in pos.items():
            left = 0
            for right in range(len(idxs)):
                # window of occurrences idxs[left..right]
                # deletions needed = (idxs[right]-idxs[left]) - (right-left)
                while (idxs[right] - idxs[left]) - (right - left) > k:
                    left += 1
                ans = max(ans, right - left + 1)
        return ans`
  },

  'find-the-maximum-divisibility-score': {
    python: `class Solution:
    def maxDivScore(self, nums, divisors):
        best_score = -1
        best_div = None
        for d in divisors:
            score = sum(1 for x in nums if x % d == 0)
            if score > best_score or (score == best_score and d < best_div):
                best_score = score
                best_div = d
        return best_div`
  },

  'find-the-maximum-length-of-valid-subsequence-ii': {
    python: `class Solution:
    def maximumLength(self, nums, k):
        ans = 0
        for r in range(k):
            # dp[prev_mod] = longest subsequence ending with element of residue prev_mod
            # such that consecutive sums % k == r
            dp = [0] * k
            for x in nums:
                a = x % k
                b = (r - a) % k
                dp[a] = dp[b] + 1
                if dp[a] > ans:
                    ans = dp[a]
        return ans`
  },

  'find-the-maximum-sum-of-node-values': {
    python: `class Solution:
    def maximumValueSum(self, nums, k, edges):
        total = 0
        cnt = 0
        delta_min = float('inf')
        net = 0
        for v in nums:
            x = v ^ k
            total += v
            if x > v:
                net += x - v
                cnt += 1
            delta_min = min(delta_min, abs(x - v))
        if cnt % 2 == 0:
            return total + net
        return total + net - delta_min`
  },

  'find-the-minimum-area-to-cover-all-ones-i': {
    python: `class Solution:
    def minimumArea(self, grid):
        rmin = cmin = float('inf')
        rmax = cmax = -1
        for i, row in enumerate(grid):
            for j, v in enumerate(row):
                if v == 1:
                    rmin = min(rmin, i)
                    rmax = max(rmax, i)
                    cmin = min(cmin, j)
                    cmax = max(cmax, j)
        return (rmax - rmin + 1) * (cmax - cmin + 1)`
  },
};
