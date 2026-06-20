---
source_url: "https://visualgo.net/en/heap"
title: "Binary Heap (Priority Queue) - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

-7![rewind 7 frames](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![replay](https://visualgo.net/img/replay.png)![forward 7 frames](https://visualgo.net/img/nextFrame.png)+7

The Binary Max Heap has been created from array A: 5,15,22,22,87,75,2,91,72,84,55,45,49,....

![>](https://visualgo.net/img/arrow_white_right.png)

leave the input array A as it is

for (i = A.length/2; i >= 1; --i)

shiftDown(i)

// **[priority\_queue.cpp/py/java/ml](https://github.com/stevenhalim/cpbook-code/tree/master/ch2/nonlineards)**

![>](https://visualgo.net/img/arrow_black_right.png)

The Binary Max Heap has been created from array A: 5,15,22,22,87,75,2,91,72,84,55,45,49,....

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![replay](https://visualgo.net/img/replay.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

51915162213228875753215912729841055224512496814487971117131879413205421581139231111111111111111111111

slide 1 (2%)

✍

✘

A Binary (Max) Heap is a [complete binary tree](https://en.wikipedia.org/wiki/Binary_tree#Types_of_binary_trees) that maintains the [Max Heap property](https://en.wikipedia.org/wiki/Binary_heap).

Binary Heap is one possible data structure to model an efficient [Priority Queue](https://en.wikipedia.org/wiki/Priority_queue) (PQ) Abstract Data Type (ADT). In a PQ, each element has a "priority" and an element with higher priority is served before an element with lower priority (ties are either simply resolved arbitrarily or broken with standard First-In First-Out (FIFO) rule as with a normal Queue). Try clicking ExtractMax() for a sample animation on extracting the max value of random Binary Heap above.

To focus the discussion scope, this visualization show a Binary **Max** Heap of integers where duplicates are allowed. See [this](https://visualgo.net/en/heap?slide=9-1) for an easy conversion to Binary **Min** Heap. Generally, any other objects that can be compared can be stored in a Binary Max Heap, e.g., Binary Max Heap of floating points, etc.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Binary (Max) Heap   1-1. Definitions   1-2. Priority Queue ADT   1-3. Stability of Equal Highest Key   1-4. Example   1-5. For Live Lecture @ NUS Only   1-6. The Example - Continued   1-7. PQ Examples   1-8. Potential Answers   1-9. Linear DS for PQ?   1-10. The Answer - Part 1   1-11. The Answer - Part 22\. Visualisation + Max Heap Property   2-1. Binary Heap has O(log N) Height   2-2. 1-based Compact Array3\. Binary (Max) Heap Operations   3-1. What Are The Extra Operations?4\. Insert(v)   4-1. Why it is Correct?   4-2. The Answer   4-3. Time Complexity Analysis   4-4. The Answer5\. ExtractMax() - Once   5-1. Why Compare with the Larger Child?   5-2. The Answer   5-3. Time Complexity Analysis   5-4. The Answer6\. Binary Heap for Efficient PQ7\. Create(A) - Two Versions   7-1. Create(A) - O(N log N)   7-2. Create(A) - O(N)   7-3. Many Leaf Vertices8\. HeapSort()   8-1. Discussion   8-2. The Answer9\. Extras   9-1. Create(A) - O(N) Analysis (1)   9-2. Create(A) - O(N) Analysis (2)   9-3. PartialSort()   9-4. Easy Max to Min Heap Conversion   9-5. UpdateKey(i, newv)   9-6. Delete(i)   9-7. The Answer   9-8. Stability Issue   9-9. Source Code   9-10. Online Quiz   9-11. Online Judge Exercises   9-12. Discussion   9-13. Shocking Stuff   9-14. The Answer

**Complete Binary Tree**: Every level in the binary tree, except possibly the last/lowest level, is completely filled, and all vertices in the last level are as far left as possible.

**Binary Max Heap property**: The parent of each vertex - except the root - contains value greater than (or equal to — we now allow duplicates) the value of that vertex. This is an easier-to-verify definition than the following alternative definition: The value of a vertex - except the leaf/leaves - must be greater than (or equal to) the value of its one (or two) child(ren).

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

Priority Queue (PQ) Abstract Data Type (ADT) is similar to normal Queue ADT, but with these two major operations:

1. Enqueue( **x**): Put a new element (key) **x** into the PQ (in some order),
2. **y** = Dequeue(): Return an existing element **y** that has the highest priority (key) in the PQ and if ties, return any.

Discussion: Some PQ ADT reverts to First-In First-Out (FIFO) behavior of a normal [Queue](https://visualgo.net/en/list?mode=Queue) in the event there is a tie of highest priority (key) in the PQ. Does guaranteeing stability on equal highest priority (key) makes PQ ADT harder to implement?

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

Imagine: You are an [Air Traffic Controller (ATC)](https://en.wikipedia.org/wiki/Air_traffic_controller) working in the control tower **T** of an airport. You have scheduled aircraft **X**/ **Y** to land in the next 3/6 minutes, respectively. Both have enough fuel for at least the next 15 minutes and both are just 2 minutes away from your airport. You observe that your airport runway is clear at the moment.

![](https://visualgo.net/img/Airplane_1.png)

In case you do not know, aircraft can be instructed to fly in [holding pattern](https://en.wikipedia.org/wiki/Holding_(aeronautics)) near the airport until the designated landing time.

←

→

🕑

You have to attend the live lecture to figure out what happens next...

There will be two options presented to you and you will have to decide:

- Raise AND wave your hand if you choose option A,
- Raise your hand but do NOT wave it if you choose option B,

If none of the two options is reasonable for you, simply do nothing.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

There are several potential usages of PQ ADT in real-life on top of what you have seen just now regarding ATC (only in live lecture).

Discussion: Can you mention a few other real-life situations where a PQ is needed?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

We are able to implement this PQ ADT using (circular) [Array](https://visualgo.net/en/array) or [Linked List](https://visualgo.net/en/list) but we will have slow (i.e., in O( **N**)) Enqueue or Dequeue operation.

Discussion: Why?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Now, let's view the visualisation of a (random) Binary (Max) Heap above. You should see a complete binary tree and all vertices except the root satisfy the Max Heap property (A\[parent(i)\] ≥ A\[i\]). Duplicate integer keys may appear (note that the [stability](https://visualgo.net/en/sorting?slide=17-2) of equal keys is not guaranteed).

You can Toggle the Visualization Mode between the visually more intuitive complete binary tree form or the compact array based implementation of a Binary (Max) Heap.

Quiz: **Based on this Binary (Max) Heap property, where will the largest integer be located?**

Can be anywhere

At one of the leaf

At the root

Submit

←

→

🕑

Important fact to memorize at this point: If we have a Binary Heap of **N** elements, its height will not be taller than O(log **N**) since we will store it as a complete binary tree.

Simple analysis: The size **N** of a full (more than just a complete) binary tree of height **h** is always **N = 2(h+1)-1**, therefore **h = log2(N+1)-1 ~= log2 N**.

See example above with **N = 7 = 2(2+1)-1** or **h = log2(7+1)-1 = 2**.

This fact is important in the analysis of all Binary Heap-related operations.

←

→

🕑

A complete binary tree can be stored efficiently as a compact array A as there is no gap between vertices of a complete binary tree/elements of a compact array. To simplify the navigation operations below, we use 1-based array. VisuAlgo displays the index of each vertex as a red label below each vertex. Read those indices in sorted order from 1 to **N**, then you will see the vertices of the complete binary tree from top to down, left to right. To help you understand this, Toggle the Visualization Mode several times.

This way, we can implement basic binary tree traversal operations with simple index manipulations (with help of [bit shift manipulation](https://visualgo.net/en/bitmask)):

1. parent(i) = i>>1, index i divided by 2 (integer division),
2. left(i) = i<<1, index i multiplied by 2,
3. right(i) = (i<<1)+1, index i multiplied by 2 and added by 1.

Pro tip: Try opening two copies of VisuAlgo on two browser windows. Try to visualize the same Binary Max Heap in two different modes and compare them.

←

→

🕑

In this visualization, you can perform several Binary (Max) Heap operations:

1. **Create(A)** \- O( **N** log **N**) version ( **N** calls of **Insert(v)** below)
2. **Create(A)** \- O( **N**) version
3. **Insert(v)** in O(log **N**) — you are allowed to insert duplicates
4. 3 versions of **ExtractMax()**:
1. Once, in O(log **N**)
2. **K** times, i.e., **PartialSort()**, in O( **K** log **N**), or
3. **N** times, i.e., **HeapSort()**, in O( **N** log **N)**
5. **UpdateKey(i, newv)** in O(log **N** if **i** is known)
6. **Delete(i)** in O(log **N** if **i** is known)

There are a few other possible Binary (Max) Heap operations, but currently we do not elaborate them for pedagogical reason in a certain NUS module.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

**Insert(v)**: Insertion of a new item **v** into a Binary Max Heap can only be done at the _last index **N** plus 1_ to maintain the compact array = complete binary tree property. However, the Max Heap property _may_ still be violated. This operation then fixes Max Heap property from the insertion point **upwards** (if necessary) and stop when there is no more Max Heap property violation. Now try clicking Insert(v) several times to insert a few random **v** to the currently displayed Binary (Max Heap).

The fix Max Heap property upwards operation has no standard name. We call it **ShiftUp** but others may call it **BubbleUp** or **IncreaseKey** operation.

←

→

🕑

Do you understand why starting from the insertion point (index **N** +1) upwards (at most until the root) and swapping a vertex with its parent when there is a Max Heap property violation during insertion is always a correct strategy?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

The time complexity of this **Insert(v)** operation is O(log **N**).

Discussion: Do you understand the derivation?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

**ExtractMax()**: The reporting and then the deletion of the maximum element (the root) of a Binary Max Heap requires an existing element to replace the root, otherwise the Binary Max Heap (a single complete binary tree, or 林/Lín in Chinese/tree) becomes two disjoint subtrees (two copies of 木/mù in Chinese/wood). That element must be the _last index_ **N** for the same reason: To maintain the compact array = complete binary tree property.

Because we promote a leaf vertex to the root vertex of a Binary Max Heap, it will very likely violates the Max Heap property. ExtractMax() operation then fixes Binary Max Heap property from the root **downwards** by comparing the current value with the its child/the larger of its two children (if necessary). Now try ExtractMax() on the currently displayed Binary (Max) Heap.

The fix Max Heap property downwards operation has no standard name. We call it **ShiftDown** but others may call it **BubbleDown** or **Heapify** operation.

←

→

🕑

Why if a vertex has two children, we have to check (and possibly swap) that vertex with _the larger_ of its two children during the downwards fix of Max Heap property?

Why can't we just compare with the left (or right, if exists) vertex only?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

The time complexity of this **ExtractMax()** operation is O(log **N**).

Discussion: Do you understand the derivation?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Up to here, we have a data structure that can implement the two major operations of Priority Queue (PQ) ADT efficiently:

1. For **Enqueue(x)**, we can use **Insert(x)** in O(log **N**) time, and
2. For **y** = Dequeue(), we can use **y = ExtractMax()** in O(log **N**) time.

However, we can do a few more operations with Binary Heap.

←

→

🕑

**Create(A)**: Creates a valid Binary (Max) Heap from an input array **A** of **N** integers (comma separated) into an initially empty Binary Max Heap.

There are two variants for this operations, one that is simpler but runs in O( **N** log **N**) and a more advanced technique that runs in O( **N**).

Pro tip: Try opening two copies of VisuAlgo on two browser windows. Execute different Create(A) versions on the worst case 'Sorted example' to see the _somewhat dramatic_ differences of the two.

←

→

🕑

**Create(A) - O(N log N)**: Simply insert (that is, by calling **Insert(v)** operation) all **N** integers of the input array into an initially empty Binary Max Heap one by one.

**Analysis**: This operation is clearly O( **N** log **N**) as we call O(log **N**) **Insert(v)** operation **N** times. Let's examine the 'Sorted example' which is one of the hard case of this operation (Now try the Hard Case - O(N log N) where we show a case where **A = \[1,2,3,4,5,6,7\]** \-\- please be patient as this example will take some time to complete). If we insert values in increasing order into an initially empty Binary Max Heap, then every insertion triggers a path from the insertion point (a new leaf) upwards to the root.

←

→

🕑

**Create(A) - O(N)**: This faster version of **Create(A)** operation was invented by Robert W. Floyd in 1964. It takes advantage of the fact that a compact array = complete binary tree and all leaves (i.e., half of the vertices — see the next slide) are Binary Max Heap by default. This operation then fixes Binary Max Heap property (if necessary) only from the last internal vertex back to the root.

**Analysis**: A loose analysis gives another O( **N**/2 log **N**) = O( **N** log **N**) complexity but it is actually just O(2\* **N**) = O( **N**) — details [here](https://visualgo.net/en/heap?slide=9-1). Now try the Hard Case - O(N) on the same input array **A = \[1,2,3,4,5,6,7\]** and see that on the same hard case as with the previous slide (but not the one that generates maximum number of swaps — try 'Diagonal Entry' test case), this operation is far superior than the O( **N** log **N**) version.

←

→

🕑

Simple explanation on why half of Binary (Max) Heap of **N** (without loss of generality, let's assume that **N** is even) elements are leaves are as follows:

Suppose that the last leaf is at index **N**, then the parent of that last leaf is at index **i = N/2**(remember [this slide](https://visualgo.net/en/heap?slide=2-2)). The left child of vertex **i+1**, if exists (it actually does not exist), will be **2\*(i+1) = 2\*(N/2+1) = N+2**, which exceeds index **N** (the last leaf) so index **i+1** must also be a leaf vertex that has no child. As Binary Heap indexing is consecutive, basically indices \[ **i+1 = N/2+1**, **i+2 = N/2+2**, ..., **N**\], or half of the vertices, are leaves.

←

→

🕑

**HeapSort()**: John William Joseph Williams invented **HeapSort()** algorithm in 1964, together with this Binary Heap data structure. **HeapSort()** operation (assuming the Binary Max Heap has been created in O( **N**)) is very easy. Simply call the O(log **N**) **ExtractMax()** operation **N** times. Now try HeapSort() on the currently displayed Binary (Max) Heap.

**Simple Analysis**: **HeapSort()** clearly runs in O( **N** log **N**) — an optimal comparison-based sorting algorithm.

Quiz: **In worst case scenario, HeapSort() is asymptotically faster than...**

Merge Sort

Selection Sort

Bubble Sort

Insertion Sort

Submit

←

→

🕑

Although **HeapSort()** runs in θ( **N** log **N**) time for all (best/average/worst) cases, is it really the best _comparison-based_ sorting algorithm?

Discussion: How about caching performance of **HeapSort()**?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

You have reached the end of the basic stuffs of this Binary (Max) Heap data structure and we encourage you to explore further in the **Exploration Mode**.

However, we still have a few more interesting Binary (Max) Heap challenges for you that are outlined in this section.

When you have cleared them all, we invite you to study more advanced algorithms that use Priority Queue as (one of) its underlying data structure, like [Prim's MST algorithm](https://visualgo.net/en/mst), [Dijkstra's SSSP algorithm](https://visualgo.net/en/sssp), A\* search algorithm (not in VisuAlgo yet), a few other greedy-based algorithms, etc.

←

→

🕑

[Earlier](https://visualgo.net/en/heap?slide=7-2), we have seen that we can create Binary Max Heap from a random array of size **N** elements in O( **N**) instead of O( **N** log **N**). Now, we will properly analyze this tighter bound.

First, we need to recall that the height of a full binary tree of size **N** is log2 **N**.

Second, we need to realise that the cost to run `shiftDown(i)` operation is not the gross upper bound O(log **N**), but O( **h**) where **h** is the height of the subtree rooted at **i**.

Third, there are `ceil(N/2h+1)` vertices at height **h** in a full binary tree.

On the example full binary tree above with **N = 7** and **h = 2**, there are:

`ceil(7/20+1) = 4` vertices: {44,35,26,17} at height **h = 0**,

`ceil(7/21+1) = 2` vertices: {62,53} at height **h = 1**, and

`ceil(7/22+1) = 1` vertex: {71} at height **h = 2**.

←

→

🕑

Cost of Create(A), the O( **N**) version is thus:

![analysis](https://visualgo.net/img/createheapanalysis.png)

PS: If the formula is too complicated, a modern student can also use [WolframAlpha](http://www.wolframalpha.com/input/?i=0%2F1%2B1%2F2%2B2%2F4%2B3%2F8%2B4%2F16%2B...) instead.

←

→

🕑

The faster O( **N**) Create Max Heap from a random array of **N** elements is important for getting a faster solution if we only need top **K** elements out of **N** items, i.e., **PartialSort()**.

After O( **N**) Create Max Heap, we can then call the O(log **N**) **ExtractMax()** operation **K** times to get the top **K** largest elements in the Binary (Max) Heap. Now try PartialSort() on the currently displayed Binary (Max) Heap.

**Analysis**: **PartialSort()** clearly runs in O( **N + K** log **N**) — an output-sensitive algorithm where the time complexity depends on the output size **K**. This is faster than the [lower-bound of O( **N** log **N**)](https://visualgo.net/en/sorting?slide=14-1) if we fully sort the entire **N** elements when **K < N**.

←

→

🕑

If we only deal with numbers (including this visualization that is restricted to integers only), it is easy to convert a Binary Max Heap into a Binary Min Heap without changing anything, or vice versa.

We can re-create a Binary Heap with the negation of every integer in the original Binary Heap. If we start with a Binary Max Heap, the resulting Binary Heap is a Binary Min Heap (if we ignore the negative symbols — see the picture above), and vice versa.

←

→

🕑

For some Priority Queue applications (e.g., [HeapDecreaseKey in Dijkstra's algorithm](https://visualgo.net/en/sssp?slide=7-3)), we may have to modify (increase or decrease) the priority of an existing value that is already inserted into a Binary (Max) Heap. If the index **i** of the value is known, we can do the following simple strategy: Simply update **A\[i\] = newv** and then call **both** **shiftUp(i)** and **shiftDown(i)**. Only at most one of this Max Heap property restoration operation will be successful, i.e., **shiftUp(i)**/ **shiftDown(i)** will be triggered if **newv** >/< old value of **A\[parent(i)\]**/ **A\[larger of the two children of i\]**, respectively.

Thus, **UpdateKey(i, newv)** can be done in O(log **N**), provided we know index **i**.

←

→

🕑

For some Priority Queue applications, we may have to delete an existing value that is already inserted into a Binary (Max) Heap (and this value happens to be not the root). Again, if the index **i** of the value is known, we can do the following simple strategy: Simply update **A\[i\] = A\[1\]+1** (a larger number greater than the current root), call **shiftUp(i)** (technically, **UpdateKey(i, A\[1\]+1)**). This will floats index **i** to be the new root, and from there, we can easily call **ExtractMax()** once to remove it.

Thus, **Delete(i)** can be done in O(log **N**), provided we know index **i**.

Discussion: Now for **UpdateKey(i, newv)** and **Delete(i)**, what if we are given **oldv** instead and thus we have to search for its location in the Binary (Max) Heap? Can we do this faster than O( **N**)?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

If there are duplicate keys, the standard implementation of Binary Heap as shown in this visualization does not guarantee stability. For example, if we insert three copies of {7, 7, 7}, e.g., {7a, 7b, and 7c} (suffix a, b, c are there only for clarity), in that order, into an initially empty Binary (Max) Heap. Then, upon first extraction, the root (7a) will be extracted first and the last existing leaf (7c) will replaces 7a. As 7c and 7b (without the suffixes) are equal (7 and 7), there is no swap happening and thus the second extract max will take out 7c instead of 7b first — [not stable](https://visualgo.net/en/sorting?slide=17-2).

If we really need to guarantee stability of equal elements, we probably need to attach different suffixes as shown earlier to make those identical elements to be unique again.

←

→

🕑

If you are looking for an implementation of Binary (Max) Heap to actually model a Priority Queue, then there is a good news.

C++ and Java already have built-in Priority Queue implementations that very likely use this data structure. They are [C++ STL priority\_queue](http://en.cppreference.com/w/cpp/container/priority_queue) (the default is a Max Priority Queue) and [Java PriorityQueue](https://docs.oracle.com/javase/8/docs/api/java/util/PriorityQueue.html) (the default is a Min Priority Queue). However, the built-in implementation may not be suitable to do some PQ extended operations efficiently (details omitted for pedagogical reason in a certain NUS course).

Python [heapq](https://docs.python.org/3/library/heapq.html) exists but its performance is rather slow. OCaml doesn't have built-in Priority Queue but we can use something else that is going to be mentioned in the other modules in VisuAlgo (the reason on why the details are omitted is the same as above).

PS: Heap Sort is likely used in C++ STL algorithm [partial\_sort](http://en.cppreference.com/w/cpp/algorithm/partial_sort).

* * *

Nevertheless, here is our implementation of [BinaryHeapDemo.cpp](http://www.comp.nus.edu.sg/~stevenha/cs2040c/demos/BinaryHeapDemo.cpp) \| [py](http://www.comp.nus.edu.sg/~stevenha/cs2040c/demos/BinaryHeapDemo.py) \| [java](http://www.comp.nus.edu.sg/~stevenha/cs2040c/demos/BinaryHeapDemo.java).

←

→

🕑

For a few more interesting questions about this data structure, please practice on [Binary Heap](https://visualgo.net/training?diff=Medium&n=7&tl=0&module=heap) training module (no login is required).

However, for NUS students, you should login using your official class account, officially clear this module, and such achievement will be recorded in your user account.

←

→

🕑

We also have a few programming problems that somewhat requires the usage of this Binary Heap data structure: [UVa 01203 - Argus](https://uva.onlinejudge.org/external/12/1203.pdf "") and [Kattis - numbertree](https://open.kattis.com/problems/numbertree "").

Try them to consolidate and improve your understanding about this data structure. You are allowed to use C++ STL priority\_queue, Python heapq, or Java PriorityQueue if that simplifies your implementation.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

After spending one long lecture on Binary (Max) Heap, here is a jaw-dropping moment...

Binary (Max) Heap data structure is probably **not** the best data structure to implement (certain operations of) ADT Priority Queue...

Discussion: So what is the alternative data structure?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

-\> Compact Array Mode

Create(A) - O( **N** log **N**)

Create(A) - O( **N**)

Insert(v)

ExtractMax()

HeapSort()

UpdateKey(i, newv)

Delete(i)

>

A =

Go

Best Case: Sorted Descending

N =

Random

Worst Case: Sorted Ascending

A =

Go

Best Case: Sorted Descending

N =

Random

Worst Case: Diagonal Entry

v =

Go

1x (Once)

K =

Kx (PartialSort)

i =

newv =

Go

Default

In-place

i =

Go

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/heap)

#### About

✕

Initially conceived in 2011 by Associate Professor Steven Halim, VisuAlgo aimed to facilitate a deeper understanding of data structures and algorithms for his students by providing a self-paced, interactive learning platform.

Featuring numerous advanced algorithms discussed in Dr. Steven Halim's book, 'Competitive Programming' — co-authored with Dr. Felix Halim and Dr. Suhendry Effendy — VisuAlgo remains the exclusive platform for visualizing and animating several of these complex algorithms even after a decade.

While primarily designed for National University of Singapore (NUS) students enrolled in various data structure and algorithm courses (e.g., CS1010/equivalent, CS2040/equivalent (including IT5003), CS3230, CS3233, and CS4234), VisuAlgo also serves as a valuable resource for inquisitive minds worldwide, promoting online learning.

Initially, VisuAlgo was not designed for small touch screens like smartphones, as intricate algorithm visualizations required substantial pixel space and click-and-drag interactions. For an optimal user experience, a minimum screen resolution of 1366x768 is recommended. However, since April 2022, a mobile (lite) version of VisuAlgo has been made available, making it possible to use a subset of VisuAlgo features on smartphone screens.

VisuAlgo remains a work in progress, with the ongoing development of more complex visualizations. At present, the platform features 24 visualization modules.

Equipped with a built-in question generator and answer verifier, VisuAlgo's "online quiz system" enables students to test their knowledge of basic data structures and algorithms. Questions are randomly generated based on specific rules, and students' answers are automatically graded upon submission to our grading server. As more CS instructors adopt this online quiz system worldwide, it could effectively eliminate manual basic data structure and algorithm questions from standard Computer Science exams in many universities. By assigning a small (but non-zero) weight to passing the online quiz, CS instructors can significantly enhance their students' mastery of these basic concepts, as they have access to an almost unlimited number of practice questions that can be instantly verified before taking the online quiz. Each VisuAlgo visualization module now includes its own online quiz component.

VisuAlgo has been translated into three primary languages: English, Chinese, and Indonesian. Additionally, we have authored public notes about VisuAlgo in various languages, including Indonesian, Korean, Vietnamese, and Thai:

[id](https://www.facebook.com/notes/steven-halim/httpidvisualgonet-visualisasi-struktur-data-dan-algoritma-dengan-animasi/10153236934439689),
[kr](http://blog.naver.com/visualgo_nus),
[vn](https://www.facebook.com/groups/163215593699283/permalink/824003417620494/),
[th](http://pantip.com/topic/32736343).


#### Team

✕

**Project Leader & Advisor (Jul 2011-present)**

[Associate Professor Steven Halim](https://www.comp.nus.edu.sg/~stevenha/), School of Computing (SoC), National University of Singapore (NUS)

[Dr Felix Halim](https://www.linkedin.com/in/felixhalim/), Senior Software Engineer, Google (Mountain View)


**Undergraduate Student Researchers 1**

**CDTL TEG 1: Jul 2011-Apr 2012**: Koh Zi Chun, Victor Loh Bo Huai


**Final Year Project/UROP students 1**

**Jul 2012-Dec 2013**: Phan Thi Quynh Trang, Peter Phandi, Albert Millardo Tjindradinata, Nguyen Hoang Duy

**Jun 2013-Apr 2014** [Rose Marie Tan Zhao Yun](https://www.rosemarietan.com/), Ivan Reinaldo


**Undergraduate Student Researchers 2**

**CDTL TEG 2: May 2014-Jul 2014**: Jonathan Irvin Gunawan, Nathan Azaria, Ian Leow Tze Wei, Nguyen Viet Dung, Nguyen Khac Tung, Steven Kester Yuwono, Cao Shengze, Mohan Jishnu


**Final Year Project/UROP students 2**

**Jun 2014-Apr 2015**: Erin Teo Yi Ling, Wang Zi

**Jun 2016-Dec 2017**: Truong Ngoc Khanh, John Kevin Tjahjadi, Gabriella Michelle, Muhammad Rais Fathin Mudzakir

**Aug 2021-Apr 2023**: Liu Guangyuan, Manas Vegi, Sha Long, Vuong Hoang Long, Ting Xiao, Lim Dewen Aloysius

**Undergraduate Student Researchers 3**

**Optiver: Aug 2023-Oct 2023**: Bui Hong Duc, Tay Ngan Lin

**Final Year Project/UROP students 3**

**Aug 2023-Apr 2024**: Xiong Jingya, Radian Krisno, Ng Wee Han, Tan Chee Heng

**Aug 2024-Apr 2025**: Edbert Geraldy Cangdinata, Huang Xing Chen, Nicholas Patrick

List of translators who have contributed ≥ 100 translations can be found at [statistics](https://visualgo.net/statistics) page.


**Acknowledgements**

NUS [CDTL](https://nus.edu.sg/cdtl) gave Teaching Enhancement Grant to kickstart this project.

For Academic Year 2023/24 - present (currently AY 2025/26) - generous donations from Optiver will be used to further develop VisuAlgo.

#### Terms of use

✕

VisuAlgo is generously offered at no cost to the global Computer Science community. If you appreciate VisuAlgo, we kindly request that you **spread the word about its existence to fellow Computer Science students and instructors**. You can share VisuAlgo through social media platforms (e.g., Facebook, YouTube, Instagram, TikTok, Twitter, etc), course webpages, blog reviews, emails, and more.

Data Structures and Algorithms (DSA) students and instructors are welcome to use this website directly for their classes. If you capture screenshots or videos from this site, feel free to use them elsewhere, provided that you cite the URL of this website ( [https://visualgo.net](https://visualgo.net/)) and/or the list of publications below as references. However, please refrain from downloading VisuAlgo's client-side files and hosting them on your website, as this constitutes plagiarism. At this time, we do not permit others to fork this project or create VisuAlgo variants. Personal use of an offline copy of the client-side VisuAlgo is acceptable.

Please note that VisuAlgo's online quiz component has a substantial server-side element, and it is not easy to save server-side scripts and databases locally. Currently, the general public can access the online quiz system only through the 'training mode.' The 'test mode' offers a more controlled environment for using randomly generated questions and automatic verification in real examinations at NUS.

**List of Publications**

This work has been presented at the CLI Workshop at the ICPC World Finals 2012 (Poland, Warsaw) and at the IOI Conference at IOI 2012 (Sirmione-Montichiari, Italy). You can click [this link](https://ioinformatics.org/journal/INFOL099.pdf) to read our 2012 paper about this system (it was not yet called VisuAlgo back in 2012) and [this link](https://ioinformatics.org/journal/v9_2015_243_245.pdf) for the short update in 2015 (to link VisuAlgo name with the previous project).

**Bug Reports or Request for New Features**

VisuAlgo is not a finished project. Associate Professor Steven Halim is still actively improving VisuAlgo. If you are using VisuAlgo and spot a bug in any of our visualization page/online quiz tool or if you want to request for new features, please contact Associate Professor Steven Halim. His contact is the concatenation of his name and add gmail dot com.

#### Privacy Policy

✕

**Version 1.2 (Updated Fri, 18 Aug 2023).**

Since Fri, 18 Aug 2023, we no longer use Google Analytics. Thus, all cookies that we use now are solely for the operations of this website. The annoying cookie-consent popup is now turned off even for first-time visitors.

Since Fri, 07 Jun 2023, thanks to a generous donation by Optiver, anyone in the world can self-create a VisuAlgo account to store a few customization settings (e.g., layout mode, default language, playback speed, etc).

Additionally, for NUS students, by using a VisuAlgo account (a tuple of NUS official email address, student name as in the class roster, and a password that is encrypted on the server side — no other personal data is stored), you are giving a consent for your course lecturer to keep track of your e-lecture slides reading and online quiz training progresses that is needed to run the course smoothly. Your VisuAlgo account will also be needed for taking NUS official VisuAlgo Online Quizzes and thus passing your account credentials to another person to do the Online Quiz on your behalf constitutes an academic offense. Your user account will be purged after the conclusion of the course unless you choose to keep your account (OPT-IN). Access to the full VisuAlgo database (with encrypted passwords) is limited to Prof Halim himself.

For other CS lecturers worldwide who have written to Steven, a VisuAlgo account (your (non-NUS) email address, you can use any display name, and encrypted password) is needed to distinguish your online credential versus the rest of the world. Your account will have CS lecturer specific features, namely the ability to see the hidden slides that contain (interesting) answers to the questions presented in the preceding slides before the hidden slides. You can also access Hard setting of the VisuAlgo Online Quizzes. You can freely use the material to enhance your data structures and algorithm classes. Note that there can be other CS lecturer specific features in the future.

For anyone with VisuAlgo account, you can remove your own account by yourself should you wish to no longer be associated with VisuAlgo tool.