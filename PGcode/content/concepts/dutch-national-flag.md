---
slug: dutch-national-flag
module: arrays-searching
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
A standard quicksort partition wastes work when values repeat: equal elements get shuffled needlessly, dragging performance toward O(n^2). Three-way partitioning collapses the equal-to-pivot region into a single fixed band that the recursion skips entirely. As an interview problem, "sort 0/1/2 in place in one pass" tests whether you can manage three moving indices without losing invariants.

## intuition
Maintain three pointers: `low`, `mid`, `high`. The invariants are arr[0..low-1] are all less than pivot, arr[low..mid-1] are equal, arr[mid..high] are unknown, arr[high+1..n-1] are greater. Step mid through the array, swapping into the low or high regions as needed. The whole array is classified when mid passes high.

## visualization
Array [2, 0, 1, 2, 1, 0] sorting around pivot 1. Start low=0, mid=0, high=5. arr[0]=2: swap arr[mid] with arr[high], high-- -> [0, 0, 1, 2, 1, 2]. arr[0]=0: swap with arr[low], low++, mid++ -> [0, 0, 1, 2, 1, 2]. arr[1]=0: swap, low++, mid++. arr[2]=1: mid++. arr[3]=2: swap with high, high-- -> [0, 0, 1, 1, 2, 2]. arr[3]=1: mid++. mid now > high. Done in one pass.

## bruteForce
Counting sort: tally how many 0s, 1s, 2s, then rewrite the array. O(n) time, O(1) space — actually optimal. But it makes two passes and overwrites the array entirely, which fails the prompt when it specifies "single pass, in-place." Comparison sort would be O(n log n) and ignore the bounded alphabet.

## optimal
The three-pointer sweep runs in one pass and never moves an element more than once into its final region. The key subtlety: when you swap arr[mid] with arr[high], do **not** advance mid — the value just brought in is unknown and must be classified next iteration. When you swap with arr[low], both low and mid advance because the swapped-in value came from the already-known less-than region (or from mid itself).

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
