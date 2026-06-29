// batch-stub550-D.mjs — Python-only canonical solutions slice.
// Loaded by backfill-solutions.mjs. Signatures match the stored
// method_name + params (positional binding). No `from typing import`
// (the driver injects List/Optional/Dict/Tuple/Set).

export default {
  // findGoodStrings(n, s1, s2, evil) -> int  (mod 1e9+7)
  // Digit-DP over positions with a KMP automaton state for `evil`.
  'find-all-good-strings': {
    python: `class Solution:
    def findGoodStrings(self, n: int, s1: str, s2: str, evil: str) -> int:
        MOD = 10**9 + 7
        m = len(evil)

        # KMP failure table for evil.
        fail = [0] * m
        k = 0
        for i in range(1, m):
            while k > 0 and evil[i] != evil[k]:
                k = fail[k - 1]
            if evil[i] == evil[k]:
                k += 1
            fail[i] = k

        # Transition table: from automaton state s reading char c -> new state.
        trans = [[0] * 26 for _ in range(m)]
        for s in range(m):
            for c in range(26):
                ch = chr(ord('a') + c)
                j = s
                while j > 0 and evil[j] != ch:
                    j = fail[j - 1]
                if evil[j] == ch:
                    j += 1
                trans[s][c] = j

        from functools import lru_cache

        # Count strings of length n whose evil-automaton state never hits m,
        # with optional lower/upper bounds.
        def count(bound, is_low):
            # is_low True -> bound is the lower string (we count strings >= bound)
            # is_low False -> bound is the upper string (strings <= bound)
            # We always count strings <= upper or >= lower via tight flag; here
            # we implement a single direction and combine via inclusion below.
            return None

        # Implement f(upper) = count of strings <= upper with no evil substring.
        @lru_cache(maxsize=None)
        def dp_free(pos, state):
            # Number of ways to fill positions [pos, n) freely (any letter)
            # without ever completing evil, starting from automaton state.
            if state == m:
                return 0
            if pos == n:
                return 1
            total = 0
            for c in range(26):
                ns = trans[state][c]
                if ns == m:
                    continue
                total += dp_free(pos + 1, ns)
            return total % MOD

        def f_upper(upper):
            # strings <= upper, length n, no evil.
            res = 0
            state = 0
            for pos in range(n):
                limit = ord(upper[pos]) - ord('a')
                for c in range(limit):
                    ns = trans[state][c]
                    if ns == m:
                        continue
                    res = (res + dp_free(pos + 1, ns)) % MOD
                # take c == upper[pos] exactly, continue tight
                state = trans[state][limit]
                if state == m:
                    return res  # prefix equal to upper already has evil
            # the upper string itself, if it survived without evil
            res = (res + 1) % MOD
            return res

        def has_evil(s):
            state = 0
            for ch in s:
                c = ord(ch) - ord('a')
                state = trans[state][c]
                if state == m:
                    return True
            return False

        ans = (f_upper(s2) - f_upper(s1)) % MOD
        if not has_evil(s1):
            ans = (ans + 1) % MOD
        return ans % MOD`,
  },

  // canAliceWin(nums: List[int]) -> bool
  // Alice can win iff single-digit sum differs from double-digit sum.
  'find-if-digit-game-can-be-won': {
    python: `class Solution:
    def canAliceWin(self, nums: List[int]) -> bool:
        single = sum(x for x in nums if x < 10)
        double = sum(x for x in nums if 10 <= x < 100)
        return single != double`,
  },

  // get(mountainArr: List[int], target: int) -> int
  // Array delivered directly; return minimum index with value == target.
  'find-in-mountain-array': {
    python: `class Solution:
    def get(self, mountainArr: List[int], target: int) -> int:
        arr = mountainArr
        n = len(arr)

        # Find peak index.
        lo, hi = 0, n - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] < arr[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        peak = lo

        # Leftmost index in ascending part [0, peak].
        lo, hi = 0, peak
        while lo <= hi:
            mid = (lo + hi) // 2
            if arr[mid] < target:
                lo = mid + 1
            elif arr[mid] > target:
                hi = mid - 1
            else:
                return mid

        # Leftmost index in descending part (peak, n-1].
        lo, hi = peak + 1, n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if arr[mid] > target:
                lo = mid + 1
            elif arr[mid] < target:
                hi = mid - 1
            else:
                return mid

        return -1`,
  },

  // stableMountains(height: List[int], threshold: int) -> List[int]
  'find-indices-of-stable-mountains': {
    python: `class Solution:
    def stableMountains(self, height: List[int], threshold: int) -> List[int]:
        return [i for i in range(1, len(height)) if height[i - 1] > threshold]`,
  },

  // findIndices(nums, indexDifference, valueDifference) -> List[int]  (O(n^2))
  'find-indices-with-index-and-value-difference-i': {
    python: `class Solution:
    def findIndices(self, nums: List[int], indexDifference: int, valueDifference: int) -> List[int]:
        n = len(nums)
        for i in range(n):
            for j in range(n):
                if abs(i - j) >= indexDifference and abs(nums[i] - nums[j]) >= valueDifference:
                    return [i, j]
        return [-1, -1]`,
  },

  // findIndices(nums, indexDifference, valueDifference) -> List[int]  (O(n))
  'find-indices-with-index-and-value-difference-ii': {
    python: `class Solution:
    def findIndices(self, nums: List[int], indexDifference: int, valueDifference: int) -> List[int]:
        n = len(nums)
        minIdx = maxIdx = -1
        for j in range(indexDifference, n):
            i = j - indexDifference
            if minIdx == -1 or nums[i] < nums[minIdx]:
                minIdx = i
            if maxIdx == -1 or nums[i] > nums[maxIdx]:
                maxIdx = i
            if nums[maxIdx] - nums[j] >= valueDifference:
                return [maxIdx, j]
            if nums[j] - nums[minIdx] >= valueDifference:
                return [minIdx, j]
        return [-1, -1]`,
  },
};
