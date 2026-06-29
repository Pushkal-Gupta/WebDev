// batch-stub550-B.mjs — Python-only canonical solutions for a slice of
// stub problems. Auto-loaded by backfill-solutions.mjs; Judge0-graded vs
// each problem's stored test_cases before write.

export default {
  // findLonely(nums: List[int]) -> List[int]
  'find-all-lonely-numbers-in-the-array': {
    python: `class Solution:
    def findLonely(self, nums: List[int]) -> List[int]:
        from collections import Counter
        cnt = Counter(nums)
        res = []
        for x in nums:
            if cnt[x] == 1 and (x - 1) not in cnt and (x + 1) not in cnt:
                res.append(x)
        return res`,
  },

  // findAllRecipes(recipes, ingredients, supplies) -> List[str]
  'find-all-possible-recipes-from-given-supplies': {
    python: `class Solution:
    def findAllRecipes(self, recipes: List[str], ingredients: List[List[str]], supplies: List[str]) -> List[str]:
        from collections import deque, defaultdict
        supply = set(supplies)
        recipe_set = set(recipes)
        indeg = {}
        graph = defaultdict(list)
        for r, ings in zip(recipes, ingredients):
            cnt = 0
            for ing in ings:
                if ing not in supply:
                    graph[ing].append(r)
                    cnt += 1
            indeg[r] = cnt
        q = deque(r for r in recipes if indeg[r] == 0)
        res = []
        while q:
            r = q.popleft()
            res.append(r)
            for nxt in graph[r]:
                if nxt in indeg:
                    indeg[nxt] -= 1
                    if indeg[nxt] == 0:
                        q.append(nxt)
        return res`,
  },

  // numberOfStableArrays(zero, one, limit) -> int  (small constraints)
  'find-all-possible-stable-binary-arrays-i': {
    python: `class Solution:
    def numberOfStableArrays(self, zero: int, one: int, limit: int) -> int:
        MOD = 10**9 + 7
        # dp[i][j][c]: arrays with i zeros, j ones, ending with c (0 or 1)
        dp = [[[0, 0] for _ in range(one + 1)] for _ in range(zero + 1)]
        for i in range(min(zero, limit) + 1):
            if i >= 1:
                dp[i][0][0] = 1
        for j in range(min(one, limit) + 1):
            if j >= 1:
                dp[0][j][1] = 1
        for i in range(1, zero + 1):
            for j in range(1, one + 1):
                # ending with 0: previous block of zeros of length 1..limit
                v = (dp[i - 1][j][0] + dp[i - 1][j][1]) % MOD
                if i - limit - 1 >= 0:
                    v = (v - dp[i - limit - 1][j][1]) % MOD
                dp[i][j][0] = v
                v = (dp[i][j - 1][0] + dp[i][j - 1][1]) % MOD
                if j - limit - 1 >= 0:
                    v = (v - dp[i][j - limit - 1][0]) % MOD
                dp[i][j][1] = v
        return (dp[zero][one][0] + dp[zero][one][1]) % MOD`,
  },

  // numberOfStableArrays(zero, one, limit) -> int  (large constraints, same DP)
  'find-all-possible-stable-binary-arrays-ii': {
    python: `class Solution:
    def numberOfStableArrays(self, zero: int, one: int, limit: int) -> int:
        MOD = 10**9 + 7
        dp = [[[0, 0] for _ in range(one + 1)] for _ in range(zero + 1)]
        for i in range(min(zero, limit) + 1):
            if i >= 1:
                dp[i][0][0] = 1
        for j in range(min(one, limit) + 1):
            if j >= 1:
                dp[0][j][1] = 1
        for i in range(1, zero + 1):
            row = dp[i]
            prow = dp[i - 1]
            for j in range(1, one + 1):
                v = (prow[j][0] + prow[j][1]) % MOD
                if i - limit - 1 >= 0:
                    v = (v - dp[i - limit - 1][j][1]) % MOD
                row[j][0] = v
                v = (row[j - 1][0] + row[j - 1][1]) % MOD
                if j - limit - 1 >= 0:
                    v = (v - row[j - limit - 1][0]) % MOD
                row[j][1] = v
        return (dp[zero][one][0] + dp[zero][one][1]) % MOD`,
  },

  // recoverArray(n, sums) -> List[int]
  'find-array-given-subset-sums': {
    python: `class Solution:
    def recoverArray(self, n: int, sums: List[int]) -> List[int]:
        from collections import Counter
        sums = sorted(sums)
        res = []
        cnt = Counter(sums)
        # work on the current list of sums
        cur = sums
        for _ in range(n):
            d = cur[1] - cur[0]  # smallest gap = abs value of an element
            # split cur into two multisets: one without the element (left),
            # one with it (right = left + d), peeling greedily.
            c = Counter(cur)
            left = []
            right = []
            for x in cur:
                if c[x] <= 0:
                    continue
                c[x] -= 1
                left.append(x)
                c[x + d] -= 1
                right.append(x + d)
            # left has sums NOT including the element; right includes it.
            # If 0 is in left -> the element is +d; else it is -d, and the
            # branch containing the empty-subset (0) is 'right'.
            if 0 in Counter(left):
                res.append(d)
                cur = left
            else:
                res.append(-d)
                cur = right
        return res`,
  },

  // beautifulIndices(s, a, b, k) -> List[int]  (small)
  'find-beautiful-indices-in-the-given-array-i': {
    python: `class Solution:
    def beautifulIndices(self, s: str, a: str, b: str, k: int) -> List[int]:
        import bisect
        A = []
        start = s.find(a)
        while start != -1:
            A.append(start)
            start = s.find(a, start + 1)
        B = []
        start = s.find(b)
        while start != -1:
            B.append(start)
            start = s.find(b, start + 1)
        res = []
        for i in A:
            p = bisect.bisect_left(B, i)
            ok = False
            if p < len(B) and abs(B[p] - i) <= k:
                ok = True
            elif p > 0 and abs(B[p - 1] - i) <= k:
                ok = True
            if ok:
                res.append(i)
        return res`,
  },

  // beautifulIndices(s, a, b, k) -> List[int]  (large, same logic)
  'find-beautiful-indices-in-the-given-array-ii': {
    python: `class Solution:
    def beautifulIndices(self, s: str, a: str, b: str, k: int) -> List[int]:
        import bisect
        def find_all(text, pat):
            res = []
            start = text.find(pat)
            while start != -1:
                res.append(start)
                start = text.find(pat, start + 1)
            return res
        A = find_all(s, a)
        B = find_all(s, b)
        res = []
        for i in A:
            p = bisect.bisect_left(B, i)
            if (p < len(B) and abs(B[p] - i) <= k) or (p > 0 and abs(B[p - 1] - i) <= k):
                res.append(i)
        return res`,
  },

  // findCenter(edges) -> int
  'find-center-of-star-graph': {
    python: `class Solution:
    def findCenter(self, edges: List[List[int]]) -> int:
        a, b = edges[0]
        c, d = edges[1]
        if a == c or a == d:
            return a
        return b`,
  },

  // findChampion(grid) -> int
  'find-champion-i': {
    python: `class Solution:
    def findChampion(self, grid: List[List[int]]) -> int:
        n = len(grid)
        for i in range(n):
            if sum(grid[i]) == n - 1:
                return i
        return 0`,
  },

  // findChampion(n, edges) -> int
  'find-champion-ii': {
    python: `class Solution:
    def findChampion(self, n: int, edges: List[List[int]]) -> int:
        indeg = [0] * n
        for u, v in edges:
            indeg[v] += 1
        champ = -1
        for i in range(n):
            if indeg[i] == 0:
                if champ != -1:
                    return -1
                champ = i
        return champ`,
  },
};
