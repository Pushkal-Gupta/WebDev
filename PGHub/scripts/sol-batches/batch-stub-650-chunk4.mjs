export default {
  'find-subtree-sizes-after-changes': {
    python: `class Solution:
    def findSubtreeSizes(self, parent, s):
        n = len(parent)
        children = [[] for _ in range(n)]
        new_parent = [-1] * n
        stack_by_char = {chr(c): [] for c in range(ord('a'), ord('z') + 1)}

        order = []
        adj = [[] for _ in range(n)]
        for i in range(1, n):
            adj[parent[i]].append(i)

        new_children = [[] for _ in range(n)]
        st = [(0, False)]
        while st:
            node, processed = st.pop()
            if processed:
                stack_by_char[s[node]].pop()
                continue
            if node != 0:
                anc = stack_by_char[s[node]]
                if anc:
                    new_children[anc[-1]].append(node)
                else:
                    new_children[parent[node]].append(node)
            st.append((node, True))
            stack_by_char[s[node]].append(node)
            for ch in adj[node]:
                st.append((ch, False))

        size = [1] * n
        order2 = []
        st2 = [(0, False)]
        while st2:
            node, processed = st2.pop()
            if processed:
                for ch in new_children[node]:
                    size[node] += size[ch]
                continue
            st2.append((node, True))
            for ch in new_children[node]:
                st2.append((ch, False))
        return size
`
  },

  'find-the-count-of-good-integers': {
    python: `from math import factorial
from itertools import product

class Solution:
    def countGoodIntegers(self, n, k):
        good = set()
        half = (n + 1) // 2
        for combo in product('0123456789', repeat=half):
            left = ''.join(combo)
            if n % 2 == 0:
                pal = left + left[::-1]
            else:
                pal = left + left[-2::-1]
            if pal[0] == '0':
                continue
            if int(pal) % k != 0:
                continue
            good.add(''.join(sorted(pal)))

        ans = 0
        for sig in good:
            cnt = [0] * 10
            for ch in sig:
                cnt[int(ch)] += 1
            total = factorial(n)
            for c in cnt:
                total //= factorial(c)
            if cnt[0] > 0:
                lead = factorial(n - 1)
                for d in range(10):
                    if d == 0:
                        lead //= factorial(cnt[0] - 1)
                    else:
                        lead //= factorial(cnt[d])
                total -= lead
            ans += total
        return ans
`
  },

  'find-the-distinct-difference-array': {
    python: `class Solution:
    def distinctDifferenceArray(self, nums):
        n = len(nums)
        suffix = [0] * (n + 1)
        seen = set()
        for i in range(n - 1, -1, -1):
            seen.add(nums[i])
            suffix[i] = len(seen)
        res = []
        pre = set()
        for i in range(n):
            pre.add(nums[i])
            res.append(len(pre) - suffix[i + 1])
        return res
`
  },

  'find-the-integer-added-to-array-i': {
    python: `class Solution:
    def addedInteger(self, nums1, nums2):
        return min(nums2) - min(nums1)
`
  },

  'find-the-k-th-character-in-string-game-i': {
    python: `class Solution:
    def kthCharacter(self, k):
        word = 'a'
        while len(word) < k:
            word += ''.join(chr((ord(c) - 97 + 1) % 26 + 97) for c in word)
        return word[k - 1]
`
  },

  'find-the-largest-area-of-square-inside-two-rectangles': {
    python: `class Solution:
    def largestSquareArea(self, bottomLeft, topRight):
        n = len(bottomLeft)
        best = 0
        for i in range(n):
            for j in range(i + 1, n):
                x1 = max(bottomLeft[i][0], bottomLeft[j][0])
                y1 = max(bottomLeft[i][1], bottomLeft[j][1])
                x2 = min(topRight[i][0], topRight[j][0])
                y2 = min(topRight[i][1], topRight[j][1])
                w = x2 - x1
                h = y2 - y1
                if w > 0 and h > 0:
                    side = min(w, h)
                    best = max(best, side * side)
        return best
`
  },

  'find-the-lexicographically-smallest-valid-sequence': {
    python: `class Solution:
    def validSequence(self, word1, word2):
        n, m = len(word1), len(word2)
        suf = [0] * (n + 1)
        j = m - 1
        for i in range(n - 1, -1, -1):
            if j >= 0 and word1[i] == word2[j]:
                j -= 1
            suf[i] = m - 1 - j
        res = []
        used_change = False
        k = 0
        for i in range(n):
            if k == m:
                break
            if word1[i] == word2[k]:
                res.append(i)
                k += 1
            elif not used_change:
                remaining = m - k - 1
                if i + 1 <= n and suf[i + 1] >= remaining:
                    res.append(i)
                    used_change = True
                    k += 1
        if k == m:
            return res
        return []
`
  },

  'find-the-maximum-achievable-number': {
    python: `class Solution:
    def theMaximumAchievableX(self, num, t):
        return num + 2 * t
`
  },

  'find-the-maximum-length-of-valid-subsequence-i': {
    python: `class Solution:
    def maximumLength(self, nums):
        even = sum(1 for x in nums if x % 2 == 0)
        odd = len(nums) - even
        best = max(even, odd)
        for target in (0, 1):
            cnt = 0
            expect = None
            for x in nums:
                p = x % 2
                if expect is None or p == expect:
                    cnt += 1
                    expect = (target - p) % 2
            best = max(best, cnt)
        return best
`
  },

  'find-the-maximum-sequence-value-of-array': {
    python: `class Solution:
    def maxValue(self, nums, k):
        n = len(nums)
        BITS = 7
        MAXOR = 1 << BITS

        def compute(arr):
            m = len(arr)
            dp = [[False] * MAXOR for _ in range(k + 1)]
            dp[0][0] = True
            res = []
            for idx in range(m):
                v = arr[idx]
                for cnt in range(min(k - 1, idx), -1, -1):
                    row = dp[cnt]
                    nxt = dp[cnt + 1]
                    for o in range(MAXOR):
                        if row[o]:
                            nxt[o | v] = True
                cur = [o for o in range(MAXOR) if dp[k][o]]
                res.append(set(cur))
            return res

        prefix = compute(nums)
        suffix = compute(nums[::-1])

        best = 0
        for i in range(k - 1, n - k):
            left = prefix[i]
            right = suffix[n - 1 - (i + 1)]
            if not left or not right:
                continue
            for a in left:
                for b in right:
                    val = a ^ b
                    if val > best:
                        best = val
        return best
`
  },

  'find-the-minimum-and-maximum-number-of-nodes-between-critical-points': {
    python: `class Solution:
    def nodesBetweenCriticalPoints(self, head):
        vals = head
        n = len(vals)
        crit = []
        for i in range(1, n - 1):
            if (vals[i] > vals[i - 1] and vals[i] > vals[i + 1]) or (vals[i] < vals[i - 1] and vals[i] < vals[i + 1]):
                crit.append(i)
        if len(crit) < 2:
            return [-1, -1]
        min_d = min(crit[i + 1] - crit[i] for i in range(len(crit) - 1))
        max_d = crit[-1] - crit[0]
        return [min_d, max_d]
`
  },
};
