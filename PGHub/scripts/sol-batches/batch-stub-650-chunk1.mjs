export default {
  'find-subarrays-with-equal-sum': {
    python: `class Solution:
    def findSubarrays(self, nums: List[int]) -> bool:
        seen = set()
        for i in range(len(nums) - 1):
            s = nums[i] + nums[i + 1]
            if s in seen:
                return True
            seen.add(s)
        return False`
  },

  'find-the-array-concatenation-value': {
    python: `class Solution:
    def findTheArrayConcVal(self, nums: List[int]) -> int:
        i, j = 0, len(nums) - 1
        total = 0
        while i < j:
            total += int(str(nums[i]) + str(nums[j]))
            i += 1
            j -= 1
        if i == j:
            total += nums[i]
        return total`
  },

  'find-the-count-of-monotonic-pairs-ii': {
    python: `class Solution:
    def countOfPairs(self, nums: List[int]) -> int:
        MOD = 10**9 + 7
        n = len(nums)
        prev = [1] * (nums[0] + 1)
        for i in range(1, n):
            pref = [0] * (nums[i - 1] + 2)
            for v in range(nums[i - 1] + 1):
                pref[v + 1] = (pref[v] + prev[v]) % MOD
            delta = nums[i] - nums[i - 1]
            if delta < 0:
                delta = 0
            cur = [0] * (nums[i] + 1)
            for a in range(nums[i] + 1):
                hi = a - delta
                if hi > nums[i - 1]:
                    hi = nums[i - 1]
                if hi >= 0:
                    cur[a] = pref[hi + 1] % MOD
            prev = cur
        return sum(prev) % MOD`
  },

  'find-the-encrypted-string': {
    python: `class Solution:
    def getEncryptedString(self, s: str, k: int) -> str:
        n = len(s)
        return ''.join(s[(i + k) % n] for i in range(n))`
  },

  'find-the-k-beauty-of-a-number': {
    python: `class Solution:
    def divisorSubstrings(self, num: int, k: int) -> int:
        s = str(num)
        cnt = 0
        for i in range(len(s) - k + 1):
            d = int(s[i:i + k])
            if d != 0 and num % d == 0:
                cnt += 1
        return cnt`
  },

  'find-the-key-of-the-numbers': {
    python: `class Solution:
    def generateKey(self, num1: int, num2: int, num3: int) -> int:
        a = str(num1).zfill(4)
        b = str(num2).zfill(4)
        c = str(num3).zfill(4)
        key = ''.join(str(min(int(a[i]), int(b[i]), int(c[i]))) for i in range(4))
        return int(key)`
  },

  'find-the-least-frequent-digit': {
    python: `class Solution:
    def getLeastFrequentDigit(self, n: int) -> int:
        s = str(n)
        counts = {}
        for ch in s:
            counts[ch] = counts.get(ch, 0) + 1
        best_digit = -1
        best_freq = None
        for d in range(10):
            ch = str(d)
            if ch in counts:
                f = counts[ch]
                if best_freq is None or f < best_freq:
                    best_freq = f
                    best_digit = d
        return best_digit`
  },

  'find-the-longest-semi-repetitive-substring': {
    python: `class Solution:
    def longestSemiRepetitiveSubstring(self, s: str) -> int:
        n = len(s)
        if n <= 2:
            return n
        left = 0
        pairs = 0
        best = 1
        for right in range(1, n):
            if s[right] == s[right - 1]:
                pairs += 1
            while pairs > 1:
                if s[left] == s[left + 1]:
                    pairs -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`
  },

  'find-the-maximum-factor-score-of-array': {
    python: `from math import gcd
class Solution:
    def maxScore(self, nums: List[int]) -> int:
        def lcm(a, b):
            if a == 0 or b == 0:
                return 0
            return a // gcd(a, b) * b
        n = len(nums)
        def score(arr):
            if not arr:
                return 0
            g = arr[0]
            l = arr[0]
            for x in arr[1:]:
                g = gcd(g, x)
                l = lcm(l, x)
            return g * l
        best = score(nums)
        if n > 1:
            for i in range(n):
                sub = nums[:i] + nums[i + 1:]
                best = max(best, score(sub))
        return best`
  },

  'find-the-maximum-number-of-elements-in-subset': {
    python: `from collections import Counter
class Solution:
    def maximumLength(self, nums: List[int]) -> int:
        cnt = Counter(nums)
        best = 1
        ones = cnt.get(1, 0)
        if ones > 0:
            best = ones if ones % 2 == 1 else ones - 1
            if best < 1:
                best = 1
        for x in cnt:
            if x == 1:
                continue
            length = 0
            cur = x
            while cnt.get(cur, 0) >= 2:
                length += 2
                cur = cur * cur
            if cnt.get(cur, 0) >= 1:
                length += 1
            else:
                length -= 1
            best = max(best, length)
        return best`
  },

  'find-the-median-of-the-uniqueness-array': {
    python: `class Solution:
    def medianOfUniquenessArray(self, nums: List[int]) -> int:
        n = len(nums)
        total = n * (n + 1) // 2
        target = (total + 1) // 2

        def count_at_most(k):
            from collections import defaultdict
            freq = defaultdict(int)
            distinct = 0
            left = 0
            res = 0
            for right in range(n):
                if freq[nums[right]] == 0:
                    distinct += 1
                freq[nums[right]] += 1
                while distinct > k:
                    freq[nums[left]] -= 1
                    if freq[nums[left]] == 0:
                        distinct -= 1
                    left += 1
                res += right - left + 1
            return res

        lo, hi = 1, n
        while lo < hi:
            mid = (lo + hi) // 2
            if count_at_most(mid) >= target:
                hi = mid
            else:
                lo = mid + 1
        return lo`
  },

  'find-the-minimum-area-to-cover-all-ones-ii': {
    python: `class Solution:
    def minimumSum(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])

        def area(r1, r2, c1, c2):
            minr, maxr = rows, -1
            minc, maxc = cols, -1
            for r in range(r1, r2):
                for c in range(c1, c2):
                    if grid[r][c] == 1:
                        if r < minr: minr = r
                        if r > maxr: maxr = r
                        if c < minc: minc = c
                        if c > maxc: maxc = c
            if maxr == -1:
                return 0
            return (maxr - minr + 1) * (maxc - minc + 1)

        best = float('inf')

        # Configurations splitting the whole grid into 3 rectangles.
        # 1) Two horizontal cuts -> three full-width horizontal strips.
        for i in range(1, rows):
            for j in range(i + 1, rows):
                s = area(0, i, 0, cols) + area(i, j, 0, cols) + area(j, rows, 0, cols)
                best = min(best, s)

        # 2) Two vertical cuts -> three full-height vertical strips.
        for i in range(1, cols):
            for j in range(i + 1, cols):
                s = area(0, rows, 0, i) + area(0, rows, i, j) + area(0, rows, j, cols)
                best = min(best, s)

        # 3) One horizontal cut, then split one of the two halves vertically.
        for i in range(1, rows):
            for k in range(1, cols):
                # top split vertically + bottom whole
                s = area(0, i, 0, k) + area(0, i, k, cols) + area(i, rows, 0, cols)
                best = min(best, s)
                # top whole + bottom split vertically
                s = area(0, i, 0, cols) + area(i, rows, 0, k) + area(i, rows, k, cols)
                best = min(best, s)

        # 4) One vertical cut, then split one of the two halves horizontally.
        for j in range(1, cols):
            for k in range(1, rows):
                # left split horizontally + right whole
                s = area(0, k, 0, j) + area(k, rows, 0, j) + area(0, rows, j, cols)
                best = min(best, s)
                # left whole + right split horizontally
                s = area(0, rows, 0, j) + area(0, k, j, cols) + area(k, rows, j, cols)
                best = min(best, s)

        return best`
  }
};
