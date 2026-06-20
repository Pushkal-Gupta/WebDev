---
slug: array-cyclic-sort
module: arrays-pointers-windows
title: Cyclic Sort
subtitle: Sort an array of 1..N in O(n) by placing each value at its destination index.
difficulty: Intermediate
position: 35
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Cyclic Sort — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/cycle-sort/"
    type: blog
  - title: "CLRS Solutions — Chapter 8: Sorting in Linear Time"
    url: "https://walkccc.me/CLRS/Chap08/8.1/"
    type: book
  - title: "TheAlgorithms/Python — cycle_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/cycle_sort.py"
    type: repo
status: published
---

## intro
Cyclic sort is a niche but elegant technique: when an array contains the values 1..N (or 0..N-1) in some order, possibly with duplicates or missing elements, you can sort it in O(n) time and O(1) extra space by swapping each value to its "home" index. The trick reduces a whole family of "find the missing / duplicate number" problems to a single sweep.

## whyItMatters
- ID-allocation systems (PostgreSQL sequences, Twitter's Snowflake ID compaction, Apache Kafka offset reconciliation) check for missing or duplicate IDs in dense ranges using cyclic-sort-style passes.
- Object-pool managers in game engines (Unity's pool, Unreal's UObject GC) detect freed-but-not-returned handles by exploiting the 1..N invariant on slot indices.
- File-descriptor leak detection in Linux's `/proc/<pid>/fd` audits walks expected FD ranges with cyclic-sort logic to identify the smallest missing FD for reuse.
- A surprising number of interview problems fit the 1..N constraint — missing number, all duplicates, smallest missing positive, first k missing positives — and cyclic sort solves all of them in O(n) time and O(1) space, beating hash-set and sort-based solutions on both axes.
- The O(n) time, O(1) space combination is what interviewers prize — it shows you noticed the 1..N structure and used it instead of reaching for a generic data structure.

## intuition
The technique is named "cyclic" because each value belongs to exactly one slot (its home), and the array can be decomposed into independent cycles of misplaced values that the algorithm rotates into position. The setup observation is that if the array were sorted and contained values 1..N, value v would sit at index v - 1 (or v for 0..N-1). So walk the array with a pointer i, and ask: is `arr[i]` at its home? If not, swap it to where it belongs. After the swap, the new value at position i might also be out of place — do not advance i; repeat. Eventually `arr[i]` is either at home, out of the valid range, or a duplicate that would collide with an already-home twin; then advance i. The amortized analysis is the elegant part: each successful swap places at least one value at its correct home, and we never displace a value once it is home. So the total number of swaps across the entire algorithm is bounded by n, giving O(n) total work despite the nested-looking control flow. The reason this works is that the values themselves act as the index into where they belong — the array is its own permutation table, and we are computing its inverse in place. Once cyclic sort finishes, every position i either holds `i + 1` or holds an indicator that `i + 1` is missing (a duplicate or out-of-range value sitting there instead). A second linear scan reads off whatever question the problem asked: smallest missing, all duplicates, first k missing — same placement loop, different final scan. The deep lesson is that dense integer ranges admit O(n) time, O(1) space algorithms because the values can serve as their own indices.

## visualization
Array [3, 1, 5, 4, 2] (values 1..5). i=0: 3 belongs at index 2, swap -> [5, 1, 3, 4, 2]. Still i=0: 5 belongs at index 4, swap -> [2, 1, 3, 4, 5]. Still i=0: 2 belongs at index 1, swap -> [1, 2, 3, 4, 5]. Now arr[0]=1 is home; advance i. Indices 1..4 all already home. Total swaps: 3. Total comparisons: 5.

## bruteForce
Sort with a comparison sort in O(n log n) and walk for the answer. Or hash every value into a set and scan 1..n. Both work; both miss the structure that values are 1..N. For "find the smallest missing positive," any solution above O(1) extra space is considered weak.

## optimal
Single-pass cyclic placement, O(n) time and O(1) space. Walk index i from 0 to n-1. At each position, compute `target = arr[i] - 1` (the home index for value `arr[i]`). If target is in range and `arr[i] != arr[target]` (not already at home, not a duplicate of the home value), swap `arr[i]` with `arr[target]` and stay at the same i — the new value at i may also need placement. Otherwise advance i. The total number of swaps is bounded by n because each swap places at least one value permanently at its home, and we never undo a placement; so the amortized inner-loop cost is O(1) per outer iteration despite the nested while.

```python
def cyclic_sort(arr):
    i = 0
    n = len(arr)
    while i < n:
        target = arr[i] - 1                  # home index for value arr[i]
        # Skip if out of range or already at home (duplicate guard).
        if 0 <= target < n and arr[i] != arr[target]:
            arr[i], arr[target] = arr[target], arr[i]
        else:
            i += 1
    return arr

def find_missing(arr):
    cyclic_sort(arr)
    for i in range(len(arr)):
        if arr[i] != i + 1:                  # first home not holding its value
            return i + 1
    return len(arr) + 1                      # all present, smallest missing is n+1
```

The `arr[i] != arr[target]` guard is the duplicate-detection step — without it, two copies of the same value swap forever. The amortized O(n) bound is the load-bearing observation: total swap count is bounded by n because each swap is a permanent placement, so the algorithm never "redoes" work. The trailing scan (`find_missing`) is interchangeable depending on the question — find-all-duplicates collects every `arr[i] != i + 1`, smallest-missing-positive picks the first such i, and so on.

## complexity
time: O(n) average and worst case
space: O(1) auxiliary, in-place
notes: Comparison count and swap count are both bounded by 2n — at most n "place" swaps plus the n advances of i. Cache-friendly because access is sequential.

## pitfalls
- Forgetting to bounds-check arr[i] before treating it as an index — values outside 1..N must be skipped, not swapped.
- Infinite loop on duplicates: always check `arr[i] != arr[arr[i] - 1]` before swapping; if they're equal, advance.
- Off-by-one when the problem uses 0..N-1 instead of 1..N — change the target slot from `v - 1` to `v`.
- Combining cyclic sort with re-iteration to "find all duplicates" but accidentally collecting the same duplicate twice — collect only when arr[i] != i + 1 in the final scan.

## interviewTips
- Spot the cue: "array of size N contains numbers from 1 to N." That's a cyclic-sort flag.
- State the invariant aloud: "Each successful swap places at least one value at its home; total work is linear."
- Show O(1) extra space — it's the differentiator from hash-set approaches.
- Be ready for follow-ups: smallest missing positive, find all duplicates, find all missing — they all reuse the placement loop with different final scans.

## code.python
```python
def cyclic_sort(arr):
    i = 0
    n = len(arr)
    while i < n:
        target = arr[i] - 1
        if 0 <= target < n and arr[i] != arr[target]:
            arr[i], arr[target] = arr[target], arr[i]
        else:
            i += 1
    return arr

def find_missing(arr):
    cyclic_sort(arr)
    for i in range(len(arr)):
        if arr[i] != i + 1:
            return i + 1
    return len(arr) + 1

def find_all_duplicates(arr):
    cyclic_sort(arr)
    return [arr[i] for i in range(len(arr)) if arr[i] != i + 1]
```

## code.javascript
```javascript
function cyclicSort(arr) {
  let i = 0;
  const n = arr.length;
  while (i < n) {
    const target = arr[i] - 1;
    if (target >= 0 && target < n && arr[i] !== arr[target]) {
      [arr[i], arr[target]] = [arr[target], arr[i]];
    } else {
      i++;
    }
  }
  return arr;
}

function findMissing(arr) {
  cyclicSort(arr);
  for (let i = 0; i < arr.length; i++) if (arr[i] !== i + 1) return i + 1;
  return arr.length + 1;
}
```

## code.java
```java
public void cyclicSort(int[] arr) {
    int i = 0;
    while (i < arr.length) {
        int target = arr[i] - 1;
        if (target >= 0 && target < arr.length && arr[i] != arr[target]) {
            int tmp = arr[i];
            arr[i] = arr[target];
            arr[target] = tmp;
        } else {
            i++;
        }
    }
}

public int findMissing(int[] arr) {
    cyclicSort(arr);
    for (int i = 0; i < arr.length; i++) if (arr[i] != i + 1) return i + 1;
    return arr.length + 1;
}
```

## code.cpp
```cpp
void cyclicSort(vector<int>& arr) {
    int i = 0, n = arr.size();
    while (i < n) {
        int target = arr[i] - 1;
        if (target >= 0 && target < n && arr[i] != arr[target]) {
            swap(arr[i], arr[target]);
        } else {
            i++;
        }
    }
}

int findMissing(vector<int>& arr) {
    cyclicSort(arr);
    for (int i = 0; i < (int)arr.size(); i++) if (arr[i] != i + 1) return i + 1;
    return arr.size() + 1;
}
```
