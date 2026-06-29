export default {
  'find-substring-with-given-hash-value': {
    python: `class Solution:
    def subStrHash(self, s: str, power: int, modulo: int, k: int, hashValue: int) -> str:
        n = len(s)
        def val(c):
            return ord(c) - ord('a') + 1
        # compute rolling hash from the right
        pk = pow(power, k, modulo)
        h = 0
        ans = -1
        # window covering s[i .. i+k-1], iterate i from n-k down to 0
        for i in range(n - 1, -1, -1):
            h = (h * power + val(s[i])) % modulo
            if i + k < n:
                # remove the char that left the window on the right (s[i+k])
                h = (h - val(s[i + k]) * pk) % modulo
            if i + k <= n:
                if h % modulo == hashValue:
                    ans = i
        return s[ans:ans + k]`
  },
  'find-the-closest-palindrome': {
    python: `class Solution:
    def nearestPalindromic(self, n: str) -> str:
        length = len(n)
        num = int(n)
        candidates = set()
        # edge candidates: 10...01 and 99...9
        candidates.add(10 ** (length - 1) - 1)
        candidates.add(10 ** length + 1)
        prefix = int(n[:(length + 1) // 2])
        for p in (prefix - 1, prefix, prefix + 1):
            ps = str(p)
            if length % 2 == 0:
                pal = ps + ps[::-1]
            else:
                pal = ps + ps[:-1][::-1]
            candidates.add(int(pal))
        candidates.discard(num)
        best = None
        for c in candidates:
            if c < 0:
                continue
            if best is None:
                best = c
            else:
                if abs(c - num) < abs(best - num) or (abs(c - num) == abs(best - num) and c < best):
                    best = c
        return str(best)`
  },
  'find-the-degree-of-each-vertex': {
    python: `class Solution:
    def findDegrees(self, matrix):
        return [sum(row) for row in matrix]`
  },
  'find-the-grid-of-region-average': {
    python: `class Solution:
    def resultGrid(self, image, threshold):
        m = len(image)
        n = len(image[0])
        total = [[0] * n for _ in range(m)]
        count = [[0] * n for _ in range(m)]
        for i in range(m - 2):
            for j in range(n - 2):
                ok = True
                s = 0
                for r in range(i, i + 3):
                    for c in range(j, j + 3):
                        s += image[r][c]
                        if c + 1 < j + 3 and abs(image[r][c] - image[r][c + 1]) > threshold:
                            ok = False
                        if r + 1 < i + 3 and abs(image[r][c] - image[r + 1][c]) > threshold:
                            ok = False
                if ok:
                    avg = s // 9
                    for r in range(i, i + 3):
                        for c in range(j, j + 3):
                            total[r][c] += avg
                            count[r][c] += 1
        result = [[0] * n for _ in range(m)]
        for i in range(m):
            for j in range(n):
                if count[i][j] == 0:
                    result[i][j] = image[i][j]
                else:
                    result[i][j] = total[i][j] // count[i][j]
        return result`
  },
  'find-the-k-sum-of-an-array': {
    python: `import heapq
class Solution:
    def kSum(self, nums, k):
        maxSum = sum(x for x in nums if x > 0)
        absVals = sorted(abs(x) for x in nums)
        # we want kth largest subsequence sum.
        # maxSum is the largest. Each other sum = maxSum - (some subset sum of absVals).
        # find kth smallest subset-sum of absVals (including empty=0), subtract from maxSum.
        # heap of (subsetSum, index)
        heap = [(0, 0)]
        result = maxSum
        for _ in range(k):
            cur, i = heapq.heappop(heap)
            result = maxSum - cur
            if i < len(absVals):
                # include absVals[i] in addition
                heapq.heappush(heap, (cur + absVals[i], i + 1))
                # replace absVals[i-1] with absVals[i]
                if i > 0:
                    heapq.heappush(heap, (cur + absVals[i] - absVals[i - 1], i + 1))
        return result`
  },
  'find-the-kth-smallest-sum-of-a-matrix-with-sorted-rows': {
    python: `import heapq
class Solution:
    def kthSmallest(self, mat, k):
        # maintain up to k smallest sums row by row
        cur = [0]
        for row in mat:
            nxt = []
            for s in cur:
                for v in row:
                    nxt.append(s + v)
            nxt.sort()
            cur = nxt[:k]
        return cur[k - 1]`
  },
  'find-the-lexicographically-largest-string-from-the-box-i': {
    python: `class Solution:
    def answerString(self, word: str, numFriends: int) -> str:
        if numFriends == 1:
            return word
        n = len(word)
        # each piece can have length up to n - (numFriends - 1)
        maxLen = n - (numFriends - 1)
        best = ""
        for i in range(n):
            cand = word[i:i + maxLen]
            if cand > best:
                best = cand
        return best`
  },
  'find-the-losers-of-the-circular-game': {
    python: `class Solution:
    def circularGameLosers(self, n: int, k: int):
        seen = [False] * n
        pos = 0
        seen[0] = True
        i = 1
        while True:
            pos = (pos + i * k) % n
            if seen[pos]:
                break
            seen[pos] = True
            i += 1
        return [idx + 1 for idx in range(n) if not seen[idx]]`
  },
  'find-the-maximum-length-of-a-good-subsequence-ii': {
    python: `class Solution:
    def maximumLength(self, nums, k):
        # dp[j] is a dict mapping value -> best length of good subsequence
        #   ending with that value using exactly j "changes" allowed budget index.
        # dp[j][v] = max length of subsequence with at most j adjacent-unequal pairs, ending in v
        # best[j] = overall max length for budget j (the best dp[j] value)
        from collections import defaultdict
        dp = [defaultdict(int) for _ in range(k + 1)]
        best = [0] * (k + 1)
        ans = 0
        for x in nums:
            for j in range(k, -1, -1):
                # extend a same-value run: dp[j][x] + 1
                cur = dp[j][x] + 1
                # extend from a different value with one fewer change budget: best[j-1] + 1
                if j > 0:
                    cur = max(cur, best[j - 1] + 1)
                if cur > dp[j][x]:
                    dp[j][x] = cur
                if cur > best[j]:
                    best[j] = cur
                if cur > ans:
                    ans = cur
        return ans`
  },
  'find-the-maximum-number-of-marked-indices': {
    python: `class Solution:
    def maxNumOfMarkedIndices(self, nums):
        nums.sort()
        n = len(nums)
        i = 0
        count = 0
        for j in range((n + 1) // 2, n):
            if 2 * nums[i] <= nums[j]:
                count += 2
                i += 1
        return count`
  },
  'find-the-minimum-amount-of-time-to-brew-potions': {
    python: `class Solution:
    def minTime(self, skill, mana):
        n = len(skill)
        # done[i] = time at which wizard i finishes current potion
        done = [0] * n
        for mj in mana:
            # finishing time of potion at each wizard, starting fresh prefix
            t = 0
            for i in range(n):
                t = max(t, done[i]) + skill[i] * mj
            # t is finish time of last wizard for this potion.
            # back-propagate actual finish times for each wizard
            done[n - 1] = t
            for i in range(n - 2, -1, -1):
                done[i] = done[i + 1] - skill[i + 1] * mj
        return done[n - 1]`
  }
};
