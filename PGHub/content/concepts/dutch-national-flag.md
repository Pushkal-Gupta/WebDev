---
slug: dutch-national-flag
module: arrays-pointers-windows
title: Dutch National Flag
subtitle: Three-way partition in a single pass — sort an array of 0s, 1s, and 2s in place.
difficulty: Intermediate
position: 36
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sort an array of 0s, 1s and 2s — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/sort-an-array-of-0s-1s-and-2s/"
    type: blog
  - title: "CLRS Solutions — Chapter 7: Quicksort"
    url: "https://walkccc.me/CLRS/Chap07/7.1/"
    type: book
  - title: "TheAlgorithms/Python — dutch_national_flag_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/dutch_national_flag_sort.py"
    type: repo
status: published
---

## intro
Dijkstra's Dutch National Flag algorithm partitions an array into three regions in a single pass: less-than-pivot, equal-to-pivot, greater-than-pivot. The canonical demo is sorting an array of 0s, 1s, and 2s in O(n) time and O(1) space, but the same scheme accelerates quicksort with many duplicates and underpins three-way partitioning for selection problems.

## whyItMatters
- **Quicksort with duplicates (Bentley-McIlroy "ternary quicksort")**: production sort routines in Java's `Arrays.sort(int[])`, OpenBSD's `qsort`, and GHC's `sort` use three-way partitioning to handle inputs with heavy duplication in O(n log k) where k is the number of distinct values — vs O(n²) for naive quicksort.
- **PostgreSQL's `quicksort_ssup` path**: when sorting columns with low cardinality (boolean, enum, low-distinct-value indexes), the planner switches to three-way partitioning to skip equal-to-pivot recursion.
- **Stream traffic shaping**: routers triage packets into low / normal / high priority queues in a single pass through a buffer using the same three-pointer scan.
- **Pre-processing for selection / kth-smallest**: quickselect with three-way partitioning gives O(n) expected time even when the input has many duplicates of the median, where two-way partitioning degenerates.
- **Interview signal**: "sort 0/1/2 in place in one pass" appears in Amazon, Microsoft, Bloomberg, Goldman, ByteDance loops as the canonical test of whether a candidate can manage three moving indices without losing the loop invariant. Getting the mid-increment-after-high-swap wrong is the most common failure.

The pattern generalises to any "classify each element into one of three regions" problem — colour-sorting, ternary search partition, mark-sweep-compact garbage collection's three-region pass.

## intuition
The naive approaches to sorting an array of three distinct values (0, 1, 2) leave money on the table. Counting sort tallies how many of each, then rewrites the array — O(n) time and correct, but two passes and full overwrite. Comparison sort is O(n log n) and ignores the bounded alphabet. Dijkstra's insight (the algorithm is named for the Dutch flag's three horizontal bands of red/white/blue) is that you can classify *and place* each element in one pass with just three integer pointers and constant extra space.

The invariant is the entire algorithm. Maintain three indices: `low`, `mid`, `high`. They partition the array into four regions:
- `arr[0..low-1]` — all known less than pivot (the "red band", will be 0s)
- `arr[low..mid-1]` — all known equal to pivot (the "white band", will be 1s)
- `arr[mid..high]` — unclassified, still to be examined
- `arr[high+1..n-1]` — all known greater than pivot (the "blue band", will be 2s)

The loop advances `mid` through the unclassified region one element at a time. At each step, the value at `arr[mid]` is in exactly one of three cases:
1. **Less than pivot**: it belongs in the low band. Swap `arr[low]` and `arr[mid]`, then advance both `low++` and `mid++`. The swapped-in value at `arr[mid]` came from the low band itself (or from `mid` if `low == mid`), so it's already known to be equal to pivot — safe to advance `mid` past it.
2. **Equal to pivot**: it's already in the right place (the mid region grows by one). Just `mid++`.
3. **Greater than pivot**: it belongs in the high band. Swap `arr[mid]` and `arr[high]`, then `high--`. **Do not advance mid** — the value just brought in from `arr[high]` was unclassified and must be examined on the next iteration. This is the subtle step that trips up most candidates.

The loop terminates when `mid > high` — the unclassified region has shrunk to empty. Every element has been examined exactly once and placed in its final band. No element moves more than once into its destination band (it may participate in two swaps total: once on the way in, once when its temporary slot is needed).

The asymmetry between the low-swap (advance both) and high-swap (advance only high) is the entire conceptual difficulty. Internalising it: the low-swap brings in a value from a *known* region (you've classified everything before `mid`), so the swapped-in element is already classified and `mid` can move past it. The high-swap brings in a value from the *unknown* region (everything past `mid` is uninspected), so the new `arr[mid]` is still unclassified and the loop must re-examine it.

The pattern generalises immediately to three-way partitioning around an arbitrary pivot: replace the equality test with `< pivot`, `== pivot`, `> pivot`. This is the kernel of Bentley-McIlroy's three-way quicksort, which gives O(n log k) on inputs with k distinct keys — a strict improvement over Hoare's two-way partition when duplicates are common.

## optimal
The three-pointer sweep runs in one pass, in-place, with exactly one comparison per index visit and at most n swaps total. The implementation is six lines once you have the invariants in your head; the discipline is the invariants, not the code.

```python
def dutch_national_flag(arr: list[int]) -> list[int]:
    """Sort an array of 0s, 1s, 2s in place. O(n) time, O(1) space, one pass."""
    low, mid, high = 0, 0, len(arr) - 1
    while mid <= high:
        if arr[mid] == 0:
            arr[low], arr[mid] = arr[mid], arr[low]
            low += 1                   # the value we just placed at low is a 0 — done
            mid += 1                   # the value swapped in at mid came from low region: classified
        elif arr[mid] == 1:
            mid += 1                   # already in the mid band; grow it by one
        else:  # arr[mid] == 2
            arr[mid], arr[high] = arr[high], arr[mid]
            high -= 1                  # value placed at high is a 2 — done
            # DO NOT advance mid: arr[mid] now holds an unclassified value from the unknown region
    return arr

def three_way_partition(arr: list, pivot) -> tuple[int, int]:
    """Bentley-McIlroy three-way partition around `pivot`. Returns (low, high)
    such that arr[:low] < pivot, arr[low:high+1] == pivot, arr[high+1:] > pivot."""
    low, mid, high = 0, 0, len(arr) - 1
    while mid <= high:
        if arr[mid] < pivot:
            arr[low], arr[mid] = arr[mid], arr[low]
            low += 1; mid += 1
        elif arr[mid] == pivot:
            mid += 1
        else:
            arr[mid], arr[high] = arr[high], arr[mid]
            high -= 1
    return low, high
```

Why optimal: the lower bound for sorting an array of n bounded-value integers in place is Ω(n) — you must read every element at least once to know it's in the right place. The Dutch flag algorithm hits that bound exactly: one comparison per element visit, at most n swaps total, O(1) auxiliary space. Counting sort matches the asymptotic time but requires two passes (one to count, one to rewrite), so the constant factor is roughly 2× and it cannot work in place without scratch space. Comparison sort is provably worse at Ω(n log n). The three-pointer sweep is therefore optimal in both time and space for this problem class, and it generalises cleanly to arbitrary pivots for the quicksort partition.

Three implementation invariants that prevent the common bugs: (1) the `arr[mid] == 2` branch must not advance `mid` — the swapped-in value came from the unclassified region and must be examined; advancing `mid` here corrupts the last few elements every time; (2) the loop condition is `mid <= high`, not `mid < high` — when they're equal, that final element still needs classification; (3) the `high` index points to the *last unclassified* slot, not the *first known-greater* slot — off-by-one here writes past the array boundary or skips the last element. The cleanest way to internalise these is to step through `[2, 0, 1, 2, 0, 1]` on paper before writing the code; the invariants make the swap rules obvious. For interview presentations, write the invariants as a contract comment before the loop body — interviewers consistently reward precision over speed on this problem.

## visualization
Array [2, 0, 1, 2, 1, 0] sorting around pivot 1. Start low=0, mid=0, high=5. arr[0]=2: swap arr[mid] with arr[high], high-- -> [0, 0, 1, 2, 1, 2]. arr[0]=0: swap with arr[low], low++, mid++ -> [0, 0, 1, 2, 1, 2]. arr[1]=0: swap, low++, mid++. arr[2]=1: mid++. arr[3]=2: swap with high, high-- -> [0, 0, 1, 1, 2, 2]. arr[3]=1: mid++. mid now > high. Done in one pass.

## bruteForce
Counting sort: tally how many 0s, 1s, 2s, then rewrite the array. O(n) time, O(1) space — actually optimal. But it makes two passes and overwrites the array entirely, which fails the prompt when it specifies "single pass, in-place." Comparison sort would be O(n log n) and ignore the bounded alphabet.

## complexity
time: O(n)
space: O(1) auxiliary, in-place
notes: Exactly one comparison per index visit; at most n swaps. Branch prediction stays cheap because the three cases are simple integer compares.

## pitfalls
- Advancing mid after swapping with high: the new value at arr[mid] hasn't been classified.
- Confusing the role of high — it points to "last unclassified," not "first greater-than." Off-by-one here corrupts the last element.
- Generalising to arbitrary pivot without changing the comparison from `==` to `< / == / >` — copy-paste hazard.
- Using Dutch National Flag on already-sorted nearly-uniform data — counting sort is simpler and faster when you control the layout.

## interviewTips
- Write the three invariants as a comment-free contract before coding — interviewers love the precision.
- Mention the connection to three-way quicksort partition (Bentley-McIlroy) for arrays with many duplicates.
- For the 0/1/2 variant, note both two-pass (counting) and one-pass (Dijkstra) solutions and ask which the interviewer prefers.
- Trace a small example with mid never decreasing and high only decreasing to sell correctness.

## code.python
```python
def dutch_national_flag(arr):
    low, mid, high = 0, 0, len(arr) - 1
    while mid <= high:
        if arr[mid] == 0:
            arr[low], arr[mid] = arr[mid], arr[low]
            low += 1
            mid += 1
        elif arr[mid] == 1:
            mid += 1
        else:
            arr[mid], arr[high] = arr[high], arr[mid]
            high -= 1
    return arr

def three_way_partition(arr, pivot):
    low, mid, high = 0, 0, len(arr) - 1
    while mid <= high:
        if arr[mid] < pivot:
            arr[low], arr[mid] = arr[mid], arr[low]
            low += 1
            mid += 1
        elif arr[mid] == pivot:
            mid += 1
        else:
            arr[mid], arr[high] = arr[high], arr[mid]
            high -= 1
    return arr
```

## code.javascript
```javascript
function dutchNationalFlag(arr) {
  let low = 0, mid = 0, high = arr.length - 1;
  while (mid <= high) {
    if (arr[mid] === 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      low++; mid++;
    } else if (arr[mid] === 1) {
      mid++;
    } else {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      high--;
    }
  }
  return arr;
}
```

## code.java
```java
public void dutchNationalFlag(int[] arr) {
    int low = 0, mid = 0, high = arr.length - 1;
    while (mid <= high) {
        if (arr[mid] == 0) {
            int t = arr[low]; arr[low] = arr[mid]; arr[mid] = t;
            low++; mid++;
        } else if (arr[mid] == 1) {
            mid++;
        } else {
            int t = arr[mid]; arr[mid] = arr[high]; arr[high] = t;
            high--;
        }
    }
}
```

## code.cpp
```cpp
void dutchNationalFlag(vector<int>& arr) {
    int low = 0, mid = 0, high = (int)arr.size() - 1;
    while (mid <= high) {
        if (arr[mid] == 0) {
            swap(arr[low], arr[mid]);
            low++; mid++;
        } else if (arr[mid] == 1) {
            mid++;
        } else {
            swap(arr[mid], arr[high]);
            high--;
        }
    }
}
```
