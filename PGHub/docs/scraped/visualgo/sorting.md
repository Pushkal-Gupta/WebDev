---
source_url: "https://visualgo.net/en/sorting"
title: "Sorting (Bubble, Selection, Insertion, Merge, Quick, Counting, Radix) - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

-7![rewind 7 frames](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![forward 7 frames](https://visualgo.net/img/nextFrame.png)+7

![>](https://visualgo.net/img/arrow_white_right.png)

![>](https://visualgo.net/img/arrow_white_right.png)

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

slide 1 (1%)

✍

✘

Sorting is a very classic problem of reordering items (that can be compared, e.g., integers, floating-point numbers, strings, etc) of an array (or a list) in a certain order (increasing, non-decreasing (increasing or flat), decreasing, non-increasing (decreasing or flat), lexicographical, etc).

There are many different sorting algorithms, each has its own advantages and limitations.

Sorting is commonly used as the introductory problem in various Computer Science classes to showcase a range of algorithmic ideas.

Without loss of generality, we assume that we will sort only **Integers**, not necessarily distinct, in **non-decreasing order** in this visualization. Try clicking Bubble Sort for a sample animation of sorting the list of 5 jumbled integers (with duplicate) above.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Sorting Problem and Sorting Algorithms   1-1. Motivation - Interesting CS Ideas   1-2. Motivation - Applications2\. Actions   2-1. Define Your Own Input   2-2. Execute the Selected Sorting Algorithm3\. Visualisation4\. Common Sorting Algorithms   4-1. Abbreviations5\. 3 O(N^2) Comparison-based Sorting Algorithms6\. Analysis of Algorithms (Basics)   6-1. Mathematical Pre-requisites   6-2. What Is It?   6-3. Measuring the Actual Running Time?   6-4. Counting # of Operations (1)   6-5. Counting # of Operations (2)   6-6. Asymptotic Analysis   6-7. Ignoring Coefficient of the Leading Term   6-8. Upper Bound: The Big-O Notation   6-9. Big-O Notation (Mathematics)   6-10. Growth Terms   6-11. Growth Terms (Visualized/Compared)7\. Bubble Sort   7-1. Bubble Sort, Pseudocode & Analysis   7-2. Bubble Sort: Early Termination   7-3. The Answer8\. Selection Sort   8-1. Selection Sort, Pseudocode & Analysis   8-2. Mini Quiz9\. Insertion Sort   9-1. Insertion Sort, Pseudocode and Analysis 1   9-2. Insertion Sort: Analysis 2   9-3. Mini Quiz10\. 2.5 O(N log N) Comparison-based Sorting11\. Merge Sort   11-1. Important Subroutine, O(N) Merge   11-2. Merge Subroutine Pseudocode Implementation   11-3. Divide and Conquer Paradigm   11-4. Merge Sort as a D&C Algorithm   11-5. Merge Sort Pseudocode Implementation   11-6. Demonstration   11-7. Merge Sort: Analysis Part 1   11-8. Merge Sort: Analysis Part 2   11-9. Merge Sort: Analysis Part 3   11-10. Pros and Cons   11-11. The Answer12\. Quick Sort   12-1. Quick Sort as a D&C Algorithm   12-2. Important Sub-routine, O(N) Partition   12-3. The Answer   12-4. Partition - Continued   12-5. Partition - Case when A\[k\] > p   12-6. Partition - Case when A\[k\] < p   12-7. Partition Pseudocode Implementation   12-8. Quick Sort Pseudocode Implementation   12-9. Demonstration   12-10. Quick Sort: Analysis Part 1   12-11. Quick Sort: Analysis Part 2   12-12. Quick Sort: Analysis Part 3   12-13. Quick Sort: Best Case (Rare)13\. Random Quick Sort   13-1. Magical Analysis   13-2. The Answer14\. 2 O(N) Non Comparison-based Sorting Algorithms   14-1. Lower Bound of Sorting Algorithm15\. Counting Sort16\. Radix Sort   16-1. The Best Sorting Algorithm for Integers?   16-2. The Answer17\. Additional Properties of Sorting Algorithms   17-1. In-Place Sorting   17-2. Stable Sort   17-3. Caching Performance18\. Quizzes   18-1. Quiz #1   18-2. Quiz #219\. Extras   19-1. Challenge   19-2. Inversion Index/Count   19-3. Implementation   19-4. Online Quiz   19-5. Online Judge Exercises20\. Detailed Analysis of Randomized Quicksort

Sorting problem has a variety of interesting algorithmic solutions that embody many Computer Science ideas:

1. [Comparison](https://visualgo.net/en/sorting?slide=5) versus [non-comparison](https://visualgo.net/en/sorting?slide=14) based strategies,
2. Iterative versus Recursive implementation,
3. Divide-and-Conquer paradigm (e.g., [Merge Sort](https://visualgo.net/en/sorting?slide=11-4) or [Quick Sort](https://visualgo.net/en/sorting?slide=12-1)),
4. Best/Worst/Average-case Time Complexity analysis,
5. [Randomized Algorithms](https://visualgo.net/en/sorting?slide=13), etc.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

When an (integer) array **A** is sorted, many problems involving **A** become easy (or easier), please review the [applications](https://visualgo.net/en/array?slide=2-7), the slower/harder [unsorted array](https://visualgo.net/en/array?slide=5-1) solutions, and the faster/easier [sorted array](https://visualgo.net/en/array?slide=6-1) solutions.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

There are two actions that you can do in this visualization.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

The first action is about defining **your own** input, an array/a list **A** that is:

1. Totally random,
2. Random but sorted (in non-decreasing or non-increasing order),
3. Random but **nearly** sorted (in non-decreasing or non-increasing order),
4. Random and contain many duplicates (thus small range of integers), or
5. Defined solely by yourself.

In Exploration mode, you can experiment with various sorting algorithms provided in this visualization to figure out their best and worst case inputs.

←

→

🕑

The second action is the most important one: Execute the active sorting algorithm by clicking the "Sort" button.

Remember that you can switch active algorithm by clicking the [respective abbreviation](https://visualgo.net/en/sorting?slide=4-1) on the top side of this visualization page.

←

→

🕑

View the visualisation/animation of the chosen sorting algorithm here.

Without loss of generality, we only show Integers in this visualization and our objective is to sort them from the initial state into non-decreasing order state. Remember, non-decreasing means mostly ascending (or increasing) order, but because there can be duplicates, there can be flat/equal line between two adjacent equal integers.

←

→

🕑

At the top, you will see the list of commonly taught sorting algorithms in Computer Science classes. To activate each algorithm, select the [abbreviation](https://visualgo.net/en/sorting?slide=4-1) of respective algorithm name before clicking "Sort".

To facilitate more diversity, we randomize the active algorithm upon each page load.

The first six algorithms in this module are **comparison-based** sorting algorithms while the last two are not. We will discuss this idea [midway through](https://visualgo.net/en/sorting?slide=13) this e-Lecture.

The middle three algorithms are **recursive** sorting algorithms while the rest are usually implemented iteratively.

←

→

🕑

To save screen space, we abbreviate algorithm names into three characters each:

1. Comparison-based Sorting Algorithms:
1. BUB - Bubble Sort,
2. SEL - Selection Sort,
3. INS - Insertion Sort,
4. MER - Merge Sort (recursive implementation),
5. QUI - Quick Sort (recursive implementation),
6. R-Q - Random Quick Sort (recursive implementation).
2. Not Comparison-based Sorting Algorithms:
1. COU - Counting Sort,
2. RAD - Radix Sort.

←

→

🕑

We will discuss three comparison-based sorting algorithms in the next few slides:

1. [Bubble Sort](https://visualgo.net/en/sorting?slide=6),
2. [Selection Sort](https://visualgo.net/en/sorting?slide=7),
3. [Insertion Sort](https://visualgo.net/en/sorting?slide=8).

They are called **comparison-based** as they compare pairs of elements of the array and decide whether to swap them or not.

These three sorting algorithms are the easiest to implement but also not the most efficient, as they run in O( **N** 2).

←

→

🕑

Before we start with the discussion of various sorting algorithms, it may be a good idea to discuss the basics of asymptotic algorithm analysis, so that you can follow the discussions of the various O( **N** ^2), O( **N** log **N**), and special O( **N**) sorting algorithms later.

This section can be skipped if you already know this topic.

←

→

🕑

You need to already understand/remember all these:

-. Logarithm and Exponentiation, e.g., log2(1024) = 10, 210 = 1024

-. Arithmetic progression, e.g., 1+2+3+4+…+10 = 10\*11/2 = 55

-. Geometric progression, e.g., 1+2+4+8+..+1024 = 1\*(1-211)/(1-2) = 2047

-. Linear/Quadratic/Cubic function, e.g., f1(x) = x+2, f2(x) = x2+x-1, f3(x) = x3+2x2-x+7

-. Ceiling, Floor, and Absolute function, e.g., ceil(3.1) = 4, floor(3.1) = 3, abs(-7) = 7

←

→

🕑

Analysis of Algorithm is a process to evaluate rigorously the resources (time and space) needed by an algorithm and represent the result of the evaluation with a (simple) formula.

The time/space requirement of an algorithm is also called the time/space complexity of the algorithm, respectively.

For this module, we focus more on time requirement of various sorting algorithms.

←

→

🕑

We can measure the actual running time of a program by using wall clock time or by inserting timing-measurement code into our program, e.g., see the code shown in [SpeedTest.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SpeedTest.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SpeedTest.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SpeedTest.java).

However, actual running time is not meaningful when comparing two algorithms as they are possibly coded in different languages, using different data sets, or running on different computers.

←

→

🕑

Instead of measuring the actual timing, we count the # of operations (arithmetic, assignment, comparison, etc). This is a way to assess its efficiency as an algorithm's execution time is correlated to the # of operations that it requires.

See the code shown in [SpeedTest.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SpeedTest.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SpeedTest.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SpeedTest.java) and the comments (especially on how to get the final value of variable counter).

Knowing the (precise) number of operations required by the algorithm, we can state something like this: Algorithm **X** takes **2n2 \+ 100n** operations to solve problem of size **n**.

←

→

🕑

If the time **t** needed for one operation is known, then we can state that algorithm **X** takes **(2n2 \+ 100n)t** time units to solve problem of size **n**.

However, time **t** is dependent on the factors mentioned earlier, e.g., different languages, compilers and computers, the complexity of the operation itself (addition/subtraction is easier/faster to compute than multiplication/division), etc.

Therefore, instead of tying the analysis to actual time **t**, we can state that algorithm **X** takes time that is **proportional to 2n2 \+ 100n** to solving problem of size **n**.

←

→

🕑

[Asymptotic](https://www.collinsdictionary.com/dictionary/english/asymptotic) analysis is an analysis of algorithms that focuses on analyzing problems of **large input size n**, considers **only the leading term** of the formula, and **ignores the coefficient** of the leading term.

We choose the leading term because the lower order terms contribute lesser to the overall cost as the input grows larger, e.g., for f(n) = 2n2 \+ 100n, we have:

f(1000) = 2\*10002 \+ 100\*1000 = 2.1M, vs

f(100000) = 2\*1000002 \+ 100\*100000 = 20010M.

(notice that the lower order term 100n has lesser contribution).

←

→

🕑

Suppose two algorithms have 2n2 and 30n2 as the leading terms, respectively.

Although actual time will be different due to the different constants, the growth rates of the running time are the same.

Compared with another algorithm with leading term of n3, the difference in growth rate is a much more dominating factor.

Hence, we can drop the coefficient of leading term when studying algorithm complexity.

←

→

🕑

If algorithm A requires time proportional to **f(n)**, we say that algorithm A is of the order of f(n).

We write that algorithm A has time complexity of **O(f(n))**, where **f(n)** is the growth rate function for algorithm A.

←

→

🕑

Mathematically, an algorithm A is of O( **f(n)**) if there exist a constant **k** and a positive integer **n0** such that algorithm A requires no more than **k\*f(n)** time units to solve a problem of size **n ≥ n0**, i.e., when the problem size is larger than **n0**, then algorithm A is (always) bounded from above by this simple formula **k\*f(n)**.

![Big-O Notation](https://visualgo.net/img/big_O_notation.png)

Note that: **n0** and **k** are not unique and there can be many possible valid **f(n)**.

←

→

🕑

In asymptotic analysis, a formula can be simplified to a single term with coefficient 1.

Such a term is called a growth term (rate of growth, order of growth, order of magnitude).

The most common growth terms can be ordered from fastest to slowest as follows:

O( **1**)/constant time < O(log **n**)/logarithmic time < O( **n**)/linear time <

O( **n** log **n**)/quasilinear time < O( **n** 2)/quadratic time < O( **n** 3)/cubic time <

O(2**n**)/exponential time < O( **n**!)/also-exponential time < ∞ (e.g., an infinite loop).

Note that a few other common time complexities are not shown (also see the visualization in the next slide).

←

→

🕑

![Common Growth Terms](https://visualgo.net/img/growth_rates.png)

We will see three different growth rates O( **n2**), O( **n log n**), and O( **n**) throughout the remainder of this sorting module.

←

→

🕑

Given an array of **N** elements, Bubble Sort will:

1. **Compare** a pair of adjacent items (a, b),
2. Swap that pair if the items are out of order (in this case, when a > b),
3. Repeat Step 1 and 2 until we reach the end of array

(the last pair is the ( **N**-2)-th and ( **N**-1)-th items as we use 0-based indexing),
4. By now, the largest item will be at the last position.

We then reduce **N** by 1 and repeat Step 1 until we have **N = 1**.

Without further ado, let's try Bubble Sort on the small example array \[29, 10, 14, 37, 14\].

You should see a 'bubble-like' animation if you imagine the larger items 'bubble up' (actually 'float to the right side of the array').

←

→

🕑

```
method bubbleSort(array A, integer N) // the standard version
  for each R from N-1 down to 1 // repeat for N-1 iterations
    for each index i in [0..R-1] // the 'unsorted region', O(N)
      if A[i] > A[i+1] // these two are not in non-decreasing order
        swap(a[i], a[i+1]) // swap them in O(1)
```

Comparison and swap require time that is bounded by a constant, let's call it **c**. Then, there are two nested loops in (the standard) Bubble Sort. The outer loop runs for exactly **N-1** iterations. But the inner loop runs get shorter and shorter:

1. When R= **N**-1, ( **N** −1) iterations (of comparisons and possibly swaps),
2. When R= **N**-2, ( **N** −2) iterations,

...,
3. When R=1, 1 iteration (then done).

Thus, the total number of iterations = ( **N** −1)+( **N** −2)+...+1 = **N**\*( **N** −1)/2 ( [derivation](https://en.wikipedia.org/wiki/Arithmetic_progression#Sum)).

Total time = c\* **N**\*( **N** −1)/2 = O( **N** ^2).

See the code shown in [SortingDemo.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.java).

←

→

🕑

Bubble Sort is actually inefficient with its **O(N^2)** time complexity. Imagine that we have **N** = 105 numbers. Even if our computer is super fast and can compute 108 operations in 1 second, Bubble Sort will need about 100 seconds to complete.

However, it can be terminated early, e.g., on the small sorted ascending example shown above \[3, 6, 11, 25, 39\], Bubble Sort can terminates in O( **N**) time.

The improvement idea is simple: If we go through the inner loop with **no swapping** at all, it means that the array is **already sorted** and we can stop Bubble Sort at that point.

Discussion: Although it makes Bubble Sort runs faster in general cases, this improvement idea does not change **O(N^2)** time complexity of Bubble Sort... Why?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Given an array of **N** items and **L** = 0, Selection Sort will:

1. Find the position **X** of the smallest item in the range of \[ **L**... **N** −1\],
2. Swap **X**-th item with the **L**-th item,
3. Increase the lower-bound **L** by 1 and repeat Step 1 until **L** = **N**-2.

Let's try Selection Sort on the same small example array \[29, 10, 14, 37, 13\].

Without loss of generality, we can also implement Selection Sort in reverse:

Find the position of the largest item **Y** and swap it with the last item.

←

→

🕑

```
method selectionSort(array A[], integer N)
  for each L in [0..N-2] // O(N)
    let X be the index of the minimum element in A[L..N-1] // O(N)
    swap(A[X], A[L]) // O(1), X may be equal to L (no actual swap)
```

Total: O( **N** 2) — To be precise, it is similar to [Bubble Sort analysis](https://visualgo.net/en/sorting?slide=7-1).

See the code shown in [SortingDemo.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.java).

←

→

🕑

Quiz: **How many (real) swaps are required to sort \[29, 10, 14, 37, 13\] by Selection Sort?**
4

1

3

2

Submit

←

→

🕑

Insertion sort is similar to how most people arrange a hand of poker cards. ![Insertion Sort Illustration](https://visualgo.net/img/insertion_sort.png)

1. Start with one card in your hand,
2. Pick the next card and insert it into its proper sorted order,
3. Repeat previous step for all cards.

Let's try Insertion Sort on the small example array \[6, 2, 10, 7\].

←

→

🕑

```
method insertionSort(array A[], integer N)
  for i in [1..N-1] // O(N)
    let X be A[i] // X is the next item to be inserted into A[0..i-1]
    for j from i-1 down to 0 // this loop can be fast or slow
      if A[j] > X
        A[j+1] = A[j] // make a place for X
      else
        break
    A[j+1] = X // insert X at index j+1
```

See the code shown in [SortingDemo.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.java).

←

→

🕑

The outer loop executes **N** −1 times, that's quite clear.

But the number of times the inner-loop is executed depends on the input:

1. In best-case scenario, the array is already sorted and (a\[j\] > X) is always false

So no shifting of data is necessary and the inner loop runs in O( **1**),
2. In worst-case scenario, the array is reverse sorted and (a\[j\] > X) is always true

Insertion always occur at the front of the array and the inner loop runs in O( **N**).

Thus, the best-case time is O( **N × 1**) = O( **N**) and the worst-case time is O( **N × N**) = O( **N** 2).

←

→

🕑

Quiz: **What is the complexity of Insertion Sort on any input array?**
O(N)

O(1)

O(N log N)

O(N^2)

Submit

Ask your instructor if you are not clear on this or read similar remarks on [this slide](https://visualgo.net/en/sorting?slide=11-10).

←

→

🕑

We will discuss two (and a half) comparison-based sorting algorithms soon:

1. [Merge Sort](https://visualgo.net/en/sorting?slide=11),
2. [Quick Sort](https://visualgo.net/en/sorting?slide=12) and its [Randomized version](https://visualgo.net/en/sorting?slide=13) (which only has one change).

These sorting algorithms are usually implemented recursively, use Divide and Conquer problem solving paradigm, and run in O( **N** log **N**) time for Merge Sort and O( **N** log **N**) time _in expectation_ for Randomized Quick Sort.

PS: The non-randomized version of Quick Sort runs in O( **N2**) though.

←

→

🕑

Given an array of **N** items, Merge Sort will:

1. Merge each pair of individual element (which is by default, sorted) into sorted arrays of 2 elements,
2. Merge each pair of sorted arrays of 2 elements into sorted arrays of 4 elements,

Repeat the process...,
3. Final step: Merge 2 sorted arrays of **N**/2 elements (for simplicity of this discussion, we assume that **N** is even) to obtain a fully sorted array of **N** elements.

This is just the general idea and we need a few more details before we can discuss the true form of Merge Sort.

←

→

🕑

We will dissect this Merge Sort algorithm by first discussing its most important sub-routine: The O( **N**) `merge`.

Given two sorted array, A and B, of size **N1** and **N2**, we can efficiently merge them into one larger combined sorted array of size **N** = **N1** + **N2**, in O( **N**) time.

This is achieved by simply comparing the front of the two arrays and take the smaller of the two at all times. However, this simple but fast O( **N**) `merge` sub-routine will need additional array to do this merging correctly.

←

→

🕑

```
method merge(array A, integer low, integer mid, integer high)
  // subarray1 = a[low..mid], subarray2 = a[mid+1..high], both sorted
  int N = high-low+1
  create array B of size N // discuss: why do we need a temp array b?
  int left = low, right = mid+1, bIdx = 0
  while (left <= mid && right <= high) // the merging
    if (A[left] <= A[right])
      B[bIdx++] = A[left++]
    else
      B[bIdx++] = A[right++]
  while (left <= mid)
    B[bIdx++] = A[left++] // leftover, if any
  while (right <= high)
    B[bIdx++] = A[right++] // leftover, if any
  for (int k = 0; k < N; ++k)
    A[low+k] = B[k]; // copy back
```

Try Merge Sort on the example array \[1, 5, 19, 20, 2, 11, 15, 17\] that have its first half already sorted \[1, 5, 19, 20\] and its second half also already sorted \[2, 11, 15, 17\]. Concentrate on the last merge of the Merge Sort algorithm.

←

→

🕑

Before we continue, let's talk about Divide and Conquer (abbreviated as D&C), a powerful problem solving paradigm.

Divide and Conquer algorithm solves (certain kind of) problem — like our sorting problem — in the following steps:

1. Divide step: Divide the large, original problem into smaller sub-problems and recursively solve the smaller sub-problems,
2. Conquer step: Combine the results of the smaller sub-problems to produce the result of the larger, original problem.

←

→

🕑

Merge Sort is a Divide and Conquer sorting algorithm.

The divide step is simple: Divide the current array into two halves (perfectly equal if **N** is even or one side is slightly greater by one element if **N** is odd) and then recursively sort the two halves.

The conquer step is the one that does the most work: Merge the two (sorted) halves to form a sorted array, using the merge sub-routine [discussed earlier](https://visualgo.net/en/sorting?slide=11-2).

←

→

🕑

```
method mergeSort(array A, integer low, integer high)
  // the array to be sorted is A[low..high]
  if (low < high) // base case: low >= high (0 or 1 item)
    int mid = (low+high) / 2
    mergeSort(a, low  , mid ) // divide into two halves
    mergeSort(a, mid+1, high) // then recursively sort them
    merge(a, low, mid, high) // conquer: the merge subroutine
```

See the code shown in [SortingDemo.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.java).

←

→

🕑

Contrary to what many other CS printed textbooks usually show (as textbooks are static), the actual execution of Merge Sort does **not** split to two subarrays **level by level**, but it will recursively sort the **left** subarray first before dealing with the **right** subarray.

That's it, running Merge Sort on the example array \[7, 2, 6, 3, 8, 4, 5\], it will recurse to \[7, 2, 6, 3\], then \[7, 2\], then \[7\] (a single element, sorted by default), backtrack, recurse to \[2\] (sorted), backtrack, then finally merge \[7, 2\] into \[2, 7\], before it continue processing \[6, 3\] and so on.

←

→

🕑

In Merge Sort, the bulk of work is done in the conquer/merge step as the divide step does not really do anything (treated as O( **1**)).

When we call `merge(a, low, mid, high)`, we process **k = (high-low+1)** items.

There will be at most **k-1** comparisons.

There are **k** moves from original array **a** to temporary array **b** and another **k** moves back.

In total, number of operations inside `merge` sub-routine is < 3 **k**-1 = O( **k**).

The important question is how many times this `merge` sub-routine is called?

←

→

🕑

![The Recursion Tree of Merge Sort](https://visualgo.net/img/merge.png)

←

→

🕑

Level 1: 2^0=1 calls to merge() with **N**/2^1 items each, O(2^0 x 2 x **N**/2^1) = O( **N**)

Level 2: 2^1=2 calls to merge() with **N**/2^2 items each, O(2^1 x 2 x **N**/2^2) = O( **N**)

Level 3: 2^2=4 calls to merge() with **N**/2^3 items each, O(2^2 x 2 x **N**/2^3) = O( **N**)

...

Level (log **N**): 2^(log **N**-1) (or **N**/2) calls to merge() with **N**/2^log **N** (or 1) item each, O( **N**)

There are log **N** levels and in each level, we perform O( **N**) work, thus the overall time complexity is O( **N** log **N**). We will [later](https://visualgo.net/en/sorting?slide=14-1) see that this is an optimal (comparison-based) sorting algorithm, i.e., we cannot do better than this.

←

→

🕑

The most important good part of Merge Sort is its O( **N** log **N**) performance guarantee, regardless of the original ordering of the input. That's it, there is **no** adversary test case that can make Merge Sort runs longer than O( **N** log **N**) for **any** array of **N** elements.

Merge Sort is therefore very suitable to sort extremely large number of inputs as O( **N** log **N**) grows much slower than the O( **N** 2) sorting algorithms that we have [discussed earlier](https://visualgo.net/en/sorting?slide=5).

There are however, several not-so-good parts of Merge Sort. First, it is actually not easy to implement from scratch ( [but we don't have to](https://visualgo.net/en/sorting?slide=19-3)). Second, it requires additional O( **N**) storage during [merging operation](https://visualgo.net/en/sorting?slide=11-2), thus not really memory efficient and [not in-place](https://visualgo.net/en/sorting?slide=17-1). Btw, if you are interested to see what have been done to address these (classic) Merge Sort not-so-good parts, you can read [this](https://en.wikipedia.org/wiki/Merge_sort#Variants).

Merge Sort is also a [stable sort](https://visualgo.net/en/sorting?slide=17-2) algorithm. Discussion: Why?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Quick Sort is another Divide and Conquer sorting algorithm (the other one discussed in this visualization page is [Merge Sort](https://visualgo.net/en/sorting?slide=11)).

We will see that this deterministic, non randomized version of Quick Sort can have bad time complexity of O( **N** 2) on adversary input before continuing with the [randomized](https://visualgo.net/en/sorting?slide=13) and usable version later.

←

→

🕑

Divide step: Choose an item **p** (known as the pivot)

Then partition the items of **A\[i..j\]** into three parts: **A\[i..m-1\]**, **A\[m\]**, and **A\[m+1..j\]**.

**A\[i..m-1\]** (possibly empty) contains items that are smaller than (or equal to) **p**.

**A\[m\] = p**, i.e., index **m** is the correct position for **p** in the sorted order of array **a**.

**A\[m+1..j\]** (possibly empty) contains items that are greater than (or equal to) **p**.

Then, recursively sort the two parts.

Conquer step: Don't be surprised... We do nothing :O!

If you compare this with [Merge Sort](https://visualgo.net/en/sorting?slide=11-4), you will see that Quick Sort D&C steps are totally opposite with Merge Sort.

←

→

🕑

We will dissect this Quick Sort algorithm by first discussing its most important sub-routine: The O( **N**) `partition` (classic version).

To partition **A\[i..j\]**, we first choose **A\[i\]** as the pivot **p**.

The remaining items (i.e., **A\[i+1..j\]**) are divided into 3 regions:

1. **S1** = **A\[i+1..m\]** where items are ≤ **p**,
2. **S2** = **A\[m+1..k-1\]** where items are ≥ **p**, and
3. Unknown = **A\[k..j\]**, where items are yet to be assigned to either **S1** or **S2**.

Discussion: Why do we choose **p** = **A\[i\]**? Are there other choices?

Harder Discussion: If **A\[k\] == p**, should we put it in region S1 or S2?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Initially, both **S1** and **S2** regions are empty, i.e., all items excluding the designated pivot **p** are in the unknown region.

Then, for each item **A\[k\]** in the unknown region, we compare **A\[k\]** with **p** and decide one of the three cases:

1. If **A\[k\]** \> **p**, put **A\[k\]** into **S2**,
2. If **A\[k\]** < **p**, put **A\[k\]** into **S1**,
3. If **A\[k\]** == **p**, throw a coin and put **A\[k\]** into **S1**/ **S2** if it lands head/tail, respectively.

These three cases are elaborated in the next two slides.

Lastly, we swap **A\[i\]** and **A\[m\]** to put pivot **p** right in the middle of **S1** and **S2**.

←

→

🕑

![Case when a[k] ≥ p, increment k, extend S2 by 1 item](https://visualgo.net/img/partition1.png)

←

→

🕑

![Case when a[k] < p, increment m, swap a[k] with a[m], increment k, extend S1 by 1 item](https://visualgo.net/img/partition2.png)

←

→

🕑

```
int partition(array A, integer i, integer j)
  int p = a[i] // p is the pivot
  int m = i // S1 and S2 are initially empty
  for (int k = i+1; k <= j; ++k) // explore the unknown region
    if ((A[k] < p) || ((A[k] == p) && (rand()%2 == 0)))  { // case 2+3
      ++m
      swap(A[k], A[m]) // exchange these two indices
    // notice that we do nothing in case 1: A[k] > p
  swap(A[i], A[m]) // final step, swap pivot with a[m]
  return m // return the index of pivot
```

←

→

🕑

```
method quickSort(array A, integer low, integer high)
  if (low < high)
    int m = partition(a, low, high) // O(N)
    // A[low..high] ~> A[low..m–1], pivot, A[m+1..high]
    quickSort(A, low, m-1); // recursively sort left subarray
    // A[m] = pivot is already sorted after partition
    quickSort(A, m+1, high); // then sort right subarray
```

See the code shown in [SortingDemo.cpp](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.cpp) \| [py](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.py) \| [java](https://www.comp.nus.edu.sg/~stevenha/cs2040/demos/SortingDemo.java).

←

→

🕑

Try Quick Sort on example array \[27, 38, 12, 39, 29, 16\]. We shall elaborate the first partition step as follows:

We set **p = A\[0\] = 27**.

We set **A\[1\] = 38** as part of **S2** so **S1 = {}** and **S2 = {38}**.

We swap **A\[1\] = 38** with **A\[2\] = 12** so **S1 = {12}** and **S2 = {38}**.

We set **A\[3\] = 39** and later **A\[4\] = 29** as part of **S2** so **S1 = {12}** and **S2 = {38,39,29}**.

We swap **A\[2\] = 38** with **A\[5\] = 16** so **S1 = {12,16}** and **S2 = {39,29,38}**.

We swap **p = A\[0\] = 27** with **A\[2\] = 16** so **S1 = {16,12}**, **p = {27}**, and **S2 = {39,29,38}**.

After this, **A\[2\] = 27** is guaranteed to be sorted and now Quick Sort recursively sorts the left side **A\[0..1\]** first and later recursively sorts the right side **A\[3..5\]**.

←

→

🕑

First, we analyze the cost of one call of `partition`.

Inside `partition(A, i, j)`, there is only a single for-loop that iterates through (j-i) times. As j can be as big as **N**-1 and i can be as low as 0, then the time complexity of partition is O( **N**).

Similar to [Merge Sort analysis](https://visualgo.net/en/sorting?slide=11-7), the time complexity of Quick Sort is then dependent on the number of times `partition(A, i, j)` is called.

←

→

🕑

When the array **A** is already in ascending order, e.g., **A** = \[5, 18, 23, 39, 44, 50\], Quick Sort will set **p = A\[0\] = 5**, and will return **m = 0**, thereby making **S1** region **empty** and **S2** region: Everything else other than the pivot ( **N**-1 items).

←

→

🕑

On such worst case input scenario, this is what happens:

![Worst Case analysis of Quick Sort](https://visualgo.net/img/qsort_worstcase.png)

The first partition takes O( **N**) time, splits **A** into 0, 1, **N**-1 items, then recurse right.

The second one takes O( **N**-1) time, splits **A** into 0, 1, **N**-2 items, then recurse right again.

...

Until the last, **N**-th partition splits **A** into 0, 1, 1 item, and Quick Sort recursion stops.

This is the classic **N+(N-1)+(N-2)+...+1** pattern, which is O( **N** 2), similar analysis as the one [in this Bubble Sort analysis slide](https://visualgo.net/en/sorting?slide=7-1)...

←

→

🕑

The best case scenario of Quick Sort occurs when partition always splits the array into **two equal halves**, like [Merge Sort](https://visualgo.net/en/sorting?slide=11-8).

When that happens, the depth of recursion is only O(log **N**).

As each level takes O( **N**) comparisons, the time complexity is O( **N** log **N**).

Try Quick Sort on this hand-crafted example input array \[4, 1, 3, 2, 6, 5, 7\].

In practice, this is rare, thus we need to devise a better way: [Randomized Quick Sort](https://visualgo.net/en/sorting?slide=13).

←

→

🕑

Same as **Quick Sort** except just before executing the partition algorithm, it **randomly** select the pivot between **A\[i..j\]** instead of always choosing **A\[i\]** (or any other fixed index between **\[i..j\]**) deterministically.

Mini exercise: Implement the idea above to the implementation shown in [this slide](https://visualgo.net/en/sorting?slide=12-7)!

Running Random Quick Sort on this large and somewhat random example array **a** = \[3,44,38,5,47,15,36,26,27,2,46,4,19,50,48\] feels fast.

←

→

🕑

It will take about 1 hour lecture to properly explain why this randomized version of Quick Sort has expected time complexity of O( **N** log **N**) on **any** input array of **N** elements.

In this e-Lecture, we will assume that it is true.

If you need non formal explanation: Just imagine that on randomized version of Quick Sort that randomizes the pivot selection, we will **not** always get extremely bad split of 0 (empty), 1 (pivot), and **N**-1 other items. This combination of lucky (half-pivot-half), somewhat lucky, somewhat unlucky, and extremely unlucky (empty, pivot, the rest) yields an average time complexity of O( **N** log **N**).

Discussion: For the implementation of [Partition](https://visualgo.net/en/sorting?slide=12-4), what happen if **A\[k\] == p**, we _always_ put **A\[k\]** on either side ( **S1** or **S2**) deterministically?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

We will discuss two **non comparison-based** sorting algorithms in the next few slides:

1. [Counting Sort](https://visualgo.net/en/sorting?slide=15),
2. [Radix Sort](https://visualgo.net/en/sorting?slide=16).

These sorting algorithms can be faster than the lower bound of comparison-based sorting algorithm of Ω( **N** log **N**) by **not** comparing the items of the array.

←

→

🕑

It is known (also not proven in this visualization as it will take about half-an-hour lecture about decision tree model to do so) that all **comparison-based** sorting algorithms have a lower bound time complexity of Ω( **N** log **N**).

Thus, any comparison-based sorting algorithm with worst-case complexity O( **N** log **N**), like [Merge Sort](https://visualgo.net/en/sorting?slide=11-9) is considered an optimal algorithm, i.e., we cannot do better than that.

However, we can achieve faster sorting algorithm — i.e., in O( **N**) — if certain assumptions of the input array exist and thus we can avoid comparing the items to determine the sorted order.

←

→

🕑

**Assumption**: If the items to be sorted are **Integers with small range**, we can count the frequency of occurrence of each Integer (in that small range) and then loop through that small range to output the items in sorted order.

Try Counting Sort on the example array above where all Integers are within \[1..9\], thus we just need to count how many times Integer 1 appears, Integer 2 appears, ..., Integer 9 appears, and then loop through 1 to 9 to print out **x** copies of Integer **y** if frequency\[ **y**\] = **x**.

The time complexity is O( **N**) to count the frequencies and O( **N+k**) to print out the output in sorted order where **k** is the range of the input Integers, which is 9-1+1 = 9 in this example. The time complexity of Counting Sort is thus O( **N+k**), which is O( **N**) if **k** is small.

We will not be able to do the counting part of Counting Sort when **k** is relatively big due to memory limitation, as we need to store frequencies of those **k** integers.

PS: This version of Counting Sort is not stable, as it does not actually remember the (input) ordering of duplicate integers. The version presented in CLRS is stable, but is a bit more complex than this form.

←

→

🕑

**Assumption**: If the items to be sorted are **Integers with large range but of few digits**, we can combine [Counting Sort](https://visualgo.net/en/sorting?slide=15) idea with Radix Sort to achieve the linear time complexity.

In Radix Sort, we treat each item to be sorted as a string of **w** digits (we pad Integers that have less than **w** digits with leading zeroes if necessary).

For the least significant (rightmost) digit to the most significant digit (leftmost), we pass through the **N** items and put them according to the active digit into 10 Queues (one for each digit \[0..9\]), which is like a _modified_ Counting Sort as this one preserves [stability](https://visualgo.net/en/sorting?slide=17-2) (remember, the Counting Sort version shown in [this slide earlier](https://visualgo.net/en/sorting?slide=15) is not a stable sort). Then we re-concatenate the groups again for subsequent iteration.

Try Radix Sort on the random 4-digits array above for clearer explanation.

Notice that we only perform O( **w × (N+k)**) iterations. In this example, **w = 4** and **k = 10**.

←

→

🕑

Now, having discussed about Radix Sort, should we use it for **every** sorting situation?

For example, it should be theoretically faster to sort many ( **N** is very large) 32-bit signed integers as **w ≤ 10** digits and **k = 10** if we interpret those 32-bit signed integers in Decimal. O(10 × ( **N** +10)) = O( **N**).

Discussion: Using base-10 as shown in this visualization is actually not the best way to sort **N** 32-bit signed integers. What should be the better setup?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

There are a few other properties that can be used to differentiate sorting algorithms on top of whether they are comparison or non-comparison, recursive or iterative.

In this section, we will talk about in-place versus not in-place, stable versus not stable, and caching performance of sorting algorithms.

←

→

🕑

A sorting algorithm is said to be an **in-place sorting** algorithm if it requires only a constant amount (i.e., O( **1**)) of extra space during the sorting process. That's it, a few, constant number of extra variables is OK but we are not allowed to have variables that has variable length depending on the input size **N**.

[Merge Sort](https://visualgo.net/en/sorting?slide=11-2) (the classic version), due to its `merge` sub-routine that requires additional temporary array of size **N**, is not in-place.

Discussion: How about Bubble Sort, Selection Sort, Insertion Sort, Quick Sort (randomized or not), Counting Sort, and Radix Sort. Which ones are in-place?

←

→

🕑

A sorting algorithm is called **stable** if the relative order of elements **with the same key value** is preserved by the algorithm after sorting is performed.

Example application of stable sort: Assume that we have student names that have been sorted in alphabetical order. Now, if this list is sorted again by tutorial group number (recall that one tutorial group usually has many students), a stable sort algorithm would ensure that all students in the same tutorial group still appear in alphabetical order of their names. [Radix sort](https://visualgo.net/en/sorting?slide=16) that goes through multiple round of sorts digit-by-digit requires a stable sort sub-routine for it to work correctly.

Discussion: Which of the sorting algorithms discussed in this e-Lecture are stable?

Try sorting array A = {3, 4a, 2, 4b, 1}, i.e. there are two copies of 4 (4a first, then 4b).

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

We are nearing the end of this e-Lecture.

Time for a few simple questions.

←

→

🕑

Quiz: **Which of these algorithms run in O(N log N) on any input array of size N?**

Bubble Sort

Merge Sort

Insertion Sort

Quick Sort (Deterministic)

Submit

←

→

🕑

Quiz: **Which of these algorithms has worst case time complexity of Θ(N^2) for sorting N integers?**

Insertion Sort

Bubble Sort

Radix Sort

Selection Sort

Merge Sort

Submit

Θ is a tight time complexity analysis where the best case Ω and the worst case big-O analysis match.

←

→

🕑

We have reached the end of sorting e-Lecture.

However, there are two other sorting algorithms in VisuAlgo that are embedded in other data structures: [Heap Sort](https://visualgo.net/en/heap) and [Balanced BST Sort](https://visualgo.net/en/bst). We will discuss them when you go through the e-Lecture of those two data structures.

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

Actually, the C++ source code for many of these basic sorting algorithms are already scattered throughout these e-Lecture slides. For other programming languages, you can translate the given C++ source code to the other programming language.

Usually, sorting is just a small part in problem solving process and nowadays, most of programming languages have their own sorting functions so we don't really have to re-code them _unless absolutely necessary_.

In C++, you can use [std::sort](http://en.cppreference.com/w/cpp/algorithm/sort) (most likely a hybrid sorting algorithm: Introsort), [std::stable\_sort](http://en.cppreference.com/w/cpp/algorithm/stable_sort) (most likely Merge Sort), or [std::partial\_sort](http://en.cppreference.com/w/cpp/algorithm/partial_sort) (most likely Binary Heap) in STL algorithm.

In Python, you can use [sort](https://docs.python.org/3/library/stdtypes.html#list.sort) (most likely a hybrid sorting algorithm: Timsort).

In Java, you can use [Collections.sort](https://docs.oracle.com/javase/9/docs/api/java/util/Collections.html#sort-java.util.List-).

In OCaml, you can use [List.sort compare list\_name](https://caml.inria.fr/pub/docs/manual-ocaml/libref/List.html).

If the comparison function is problem-specific, we may need to supply additional comparison function to those built-in sorting routines.

←

→

🕑

Now it is time for you to see if you have understand the basics of various sorting algorithms discussed so far.

Test your understanding [here](https://visualgo.net/training?diff=Medium&n=7&tl=0&module=sorting).

←

→

🕑

Now that you have reached the end of this e-Lecture, do you think sorting problem is just as simple as calling built-in sort routine?

Try these online judge problems to find out more:

[Kattis - mjehuric](https://open.kattis.com/problems/mjehuric)

[Kattis - sortofsorting](https://open.kattis.com/problems/sortofsorting), or

[Kattis - sidewayssorting](https://open.kattis.com/problems/sidewayssorting)

This is not the end of the topic of sorting. When you explore other topics in VisuAlgo, you will realise that sorting is a pre-processing step for many other advanced algorithms for harder problems, e.g. as the pre-processing step for [Kruskal's algorithm](https://visualgo.net/en/mst), creatively used in [Suffix Array](https://visualgo.net/en/suffixarray) data structure, etc.

←

→

🕑

start of 3230 material


* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

2910143714

01234

0123456789ABCDEF

Bubble Sort

Create(A)

Sort

>

N =

Random

Sorted

Non-increasing

Non-decreasing

Nearly sorted

Non-increasing

Non-decreasing

Many Duplicates

A =

Go

(base) k =

Set base

(base) k =

Set base

Simple

Stable

Show depth

Hide depth

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/sorting)

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