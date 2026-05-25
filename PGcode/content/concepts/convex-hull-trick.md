---
slug: convex-hull-trick
module: dp-advanced
title: Convex Hull Trick
subtitle: Answer min(m_i * x + b_i) queries in amortized O(1) when slopes are monotonic.
difficulty: Advanced
position: 30
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 14: Dynamic Programming (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap14/"
    type: book
  - title: "TopCoder — Dynamic Programming: From Novice to Advanced"
    url: "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
The Convex Hull Trick (CHT) speeds up dynamic programs whose transition has the form `dp[i] = min over j (m_j * x_i + b_j)`. Treating each (m_j, b_j) as a line, the answer to a query at point x is the lowest line evaluated at x. Maintaining only the lines that contribute to the lower envelope reduces O(n²) DPs to O(n log n) — or O(n) when both query x's and slope additions are sorted.

## whyItMatters
DP problems with the shape "minimize sum of squared distances" (segmented least squares, kinetic energy, batch jobs) collapse to CHT once expanded. So do "best partition of array" problems where the cost of a segment is `(prefix[i] - prefix[j])² + const` — that opens to `prefix[i]² - 2*prefix[i]*prefix[j] + prefix[j]²`, exactly a line in prefix[j] queried at prefix[i]. Recognizing this transformation is what separates a tight contest solution from a TLE.

## intuition
Each line `y = m·x + b` is a candidate "policy." At any query point x, only one line is best. As x grows, the best line changes — and in convex order. The set of useful lines forms the lower envelope, a piecewise-linear convex function. Lines that are dominated everywhere (their full graph sits above some pair of others) can be discarded. When inserting lines in slope-monotone order, we pop dominated lines from the back of a deque, like building a convex hull — hence the name.

## visualization
```
Three lines:  L1: y = 1x + 8   (small slope)
              L2: y = 2x + 4
              L3: y = 4x + 1   (large slope)

Lower envelope:
  x in (-inf, 2): L1 wins (1*2+8 = 10, 2*2+4 = 8, 4*2+1 = 9 -> wait, L2 best at x=2)
  Intersections: L1=L2 at x=4, L2=L3 at x=1.5
  Real envelope: L1 for x<=1.5? recompute -> at x=0: L1=8, L2=4, L3=1; L3 wins.
  So envelope = L3 (x<=1.5), L2 (1.5..4), L1 (x>=4).

Deque after insertion (sorted by slope ascending): [L1, L2, L3]
Query x=3: pointer at L2 -> y=10. Correct.
```

## bruteForce
For each of n DP states, scan all O(n) candidate j values and compute `m_j * x_i + b_j`. That is O(n²) — fine for n ≤ 5000, fatal for n = 10⁵. The redundancy: most j's are never the minimum for any query x, yet we evaluate them anyway. CHT exploits this by storing only the j's that win for some range of x.

## optimal
Two variants:

**Monotonic CHT (deque).** Insert lines with monotonically increasing (or decreasing) slope; query points also sorted. Maintain a deque of lines forming the lower envelope. To insert a new line L, pop from the back while the last line is dominated by L and the second-to-last — check via `bad(L1, L2, L3) = (L3.b - L1.b)*(L1.m - L2.m) <= (L2.b - L1.b)*(L1.m - L3.m)`. To query at increasing x, pop from the front while the second line beats the first at x.

```
add(line):
    while size >= 2 and bad(back2, back1, line): pop_back
    push_back(line)

query(x):  // x monotonic
    while size >= 2 and eval(front1, x) >= eval(front2, x): pop_front
    return eval(front, x)
```

**Li Chao tree.** When neither slopes nor queries are monotone, use a segment tree over the x-coordinate domain. Each node stores one "best" line for its midpoint; on insertion, recurse into the half where the new line might still beat the stored line. Both insert and query are O(log X).

## complexity
time: O(n) amortized for monotonic CHT (both insertions and queries sorted); O(n log n) for binary search on the deque; O(n log X) for Li Chao on coordinate range X
space: O(n) for the deque or O(X) / O(n log X) for Li Chao depending on implementation
notes: Use `long long` for cross-multiplied dominance tests — products can overflow 32-bit. Floating-point intersection x-coordinates are simpler but risk precision errors near parallel lines.

## pitfalls
- Comparing slopes naively when two lines are parallel — dominance test must early-return on equal slopes.
- Mixing minimum-CHT logic with maximum queries — flip the inequality everywhere or negate slopes and intercepts.
- Forgetting that "monotonic" means slope order, not insertion order — sort lines by slope first.
- Off-by-one in the back-pop loop: must run while size ≥ 2 and the last two are dominated, not size ≥ 1.
- Using integer division in the intersection formula — always cross-multiply to compare.

## interviewTips
- Lead with the recognition: "This DP transition reduces to evaluating lines — that's the Convex Hull Trick."
- State which variant applies: "Slopes are sorted by construction, queries are sorted — so monotonic deque, O(n) total."
- If the interviewer adds adversarial queries, switch to Li Chao tree and explain the O(log X) bound.
- Mention CHT's cousin, the Knuth-Yao quadrangle inequality, when the DP satisfies a monotonicity condition but not the line structure.

## code.python
```python
from collections import deque

class CHT:
    def __init__(self):
        self.dq = deque()

    def _bad(self, l1, l2, l3):
        return (l3[1] - l1[1]) * (l1[0] - l2[0]) <= (l2[1] - l1[1]) * (l1[0] - l3[0])

    def add(self, m, b):
        line = (m, b)
        while len(self.dq) >= 2 and self._bad(self.dq[-2], self.dq[-1], line):
            self.dq.pop()
        self.dq.append(line)

    def query(self, x):
        while len(self.dq) >= 2 and self.dq[0][0] * x + self.dq[0][1] >= self.dq[1][0] * x + self.dq[1][1]:
            self.dq.popleft()
        m, b = self.dq[0]
        return m * x + b
```

## code.javascript
```javascript
class CHT {
  constructor() { this.dq = []; }
  bad(l1, l2, l3) {
    return (l3[1] - l1[1]) * (l1[0] - l2[0]) <= (l2[1] - l1[1]) * (l1[0] - l3[0]);
  }
  add(m, b) {
    const line = [m, b];
    while (this.dq.length >= 2 && this.bad(this.dq[this.dq.length-2], this.dq[this.dq.length-1], line))
      this.dq.pop();
    this.dq.push(line);
  }
  query(x) {
    while (this.dq.length >= 2 && this.dq[0][0]*x + this.dq[0][1] >= this.dq[1][0]*x + this.dq[1][1])
      this.dq.shift();
    const [m, b] = this.dq[0];
    return m * x + b;
  }
}
```

## code.java
```java
public class CHT {
    private Deque<long[]> dq = new ArrayDeque<>();

    private boolean bad(long[] l1, long[] l2, long[] l3) {
        return (l3[1] - l1[1]) * (l1[0] - l2[0]) <= (l2[1] - l1[1]) * (l1[0] - l3[0]);
    }

    public void add(long m, long b) {
        long[] line = {m, b};
        while (dq.size() >= 2) {
            long[] last = dq.pollLast();
            long[] prev = dq.peekLast();
            if (bad(prev, last, line)) continue;
            dq.offerLast(last);
            break;
        }
        dq.offerLast(line);
    }

    public long query(long x) {
        while (dq.size() >= 2) {
            long[] first = dq.pollFirst();
            long[] second = dq.peekFirst();
            if (first[0]*x + first[1] >= second[0]*x + second[1]) continue;
            dq.offerFirst(first);
            break;
        }
        long[] best = dq.peekFirst();
        return best[0] * x + best[1];
    }
}
```

## code.cpp
```cpp
struct CHT {
    deque<pair<long long, long long>> dq;

    bool bad(pair<long long,long long> l1, pair<long long,long long> l2, pair<long long,long long> l3) {
        return (l3.second - l1.second) * (l1.first - l2.first)
             <= (l2.second - l1.second) * (l1.first - l3.first);
    }

    void add(long long m, long long b) {
        pair<long long, long long> line = {m, b};
        while (dq.size() >= 2 && bad(dq[dq.size()-2], dq.back(), line))
            dq.pop_back();
        dq.push_back(line);
    }

    long long eval(pair<long long,long long> l, long long x) {
        return l.first * x + l.second;
    }

    long long query(long long x) {
        while (dq.size() >= 2 && eval(dq[0], x) >= eval(dq[1], x))
            dq.pop_front();
        return eval(dq.front(), x);
    }
};
```
