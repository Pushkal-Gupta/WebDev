---
source_url: "https://visualgo.net/en/recursion"
title: "Recursion Tree and DAG (Dynamic Programming/DP) - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![replay](https://visualgo.net/img/replay.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

Number of subproblems visited: 45

Number of subproblems repeated (excluding base cases): 20

Number of times base cases visited: 18

72310022110041001100310022110062221100310022110051110022110041001100310022110000110022110011111111111111111111111111111111111111111111

slide 1 (2%)

✍

✘

This visualization can visualize the recursion tree of any recursive algorithm or the recursion tree of a Divide and Conquer (D&C) algorithm recurrence (e.g., Master Theorem) that we can legally write in JavaScript.

We can also visualize the Directed Acyclic Graph (DAG) of a Dynamic Programming (DP) algorithm and compare the dramatic search-space difference of a DP problem versus when its overlapping sub-problems are naively recomputed, e.g., [the exponential Ω(2n/2) recursive Fibonacci versus its O(n) DP version](https://visualgo.net/en/recursion?slide=4-1).

On some problems, we can also visualize the difference between what a Complete Search (recursive backtracking) that explores the entire search space, a greedy algorithm (that greedily picks one branch each time), versus Dynamic Programming look like in the same recursion tree, e.g., [Coin-Change](https://visualgo.net/en/recursion?slide=5-1) of v = 7 cents with 4 coins {4, 3, 1, 5} cents.

Most recursion trees require large drawing space, therefore view this visualization page on a large screen. For obvious reason, we cannot really visualize very big trees/DAGs. Therefore, we call our recursion with small parameter(s).

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Visualization2\. Recursion Tree   2-1. Recursion DAG3\. Example Recursion - One Subproblem   3-1. Factorial Numbers   3-2. Binary Search   3-3. Modulo Power   3-4. Greatest Common Divisor (GCD)   3-5. Max Range Sum   3-6. Catalan Numbers4\. Example Recursion - Two Subproblems   4-1. Fibonacci Numbers (Tree)   4-2. Fibonacci Numbers (DAG)   4-3. Binomial Coefficient C(n, k) (Tree)   4-4. Binomial Coefficient C(n, k) (DAG)   4-5. 0-1 Knapsack (Tree)   4-6. 0-1 Knapsack (DAG)5\. Example Recursion - Many Subproblems   5-1. Longest Inc Subseq (LIS) (DAG)   5-2. Coin Change (Tree)   5-3. Cutting Rod (Tree)   5-4. Matrix Chain Mult (Tree)   5-5. Longest Common Subseq (LCS) (Tree)   5-6. Longest Common Subseq (LCS) (DAG)   5-7. Graph Matching   5-8. Traveling Salesperson Problem (TSP)6\. Example D&C Recurrences   6-1. Merge Sort Analysis (1)   6-2. Analysis (2)   6-3. Analysis (3)   6-4. Analysis (4)   6-5. (Non-Randomized) Quick Sort Analysis   6-6. Analysis (2)   6-7. Analysis (3)   6-8. Analysis (4)   6-9. Master Theorem, Case 1 (1)   6-10. Case 1 (2)   6-11. Master Theorem, Case 2   6-12. Master Theorem, Case 3

This is the Recursion Tree and Recursion Directed Acyclic Graph (DAG) visualization area. The Recursion Tree/DAG are drawn/animated as per how a real computer program that implements this recursion works, i.e., "depth-first".

The recursion starts from the initial state that is colored dark brown. The current parameter value is shown inside each vertex (comma-separated for recursion with two or more parameters). Active vertices will be colored orange. Vertices that are no longer calling any other recursive problem (the base cases) will be colored green. Vertices (subproblems) that are repeated will be colored lightblue for the second occurrence onwards. The return value of each recursive call is written as a red text below the vertex. This visualization is generic for any recursion that you can legally write in JavaScript.

Note that due to combinatorial explosion, it will be very hard to visualize the Recursion Tree for large instances.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

For the Recursion DAG, it will also be very hard to minimize the number of edge crossings in the event of overlapping subproblems. However, we try our best to give a custom DAG drawing layout for certain DP problems to improve the presentation.

For example, we currently show the recursion DAG of the computation of the n-th Fibonacci number. We layout the vertices from leftmost (the two green-colored base cases `n = 0` and `n = 1`) to rightmost (the initial `n`). Ideally this is shown as a flat 1-D (memoization) array. However as VisuAlgo does not have curvy edge yet, we decided to put odd-numbered vertices slightly below the even-numbered vertices to get around the overlapping edges issue. To compute `fib(n)`, we only need to know the result of two immediate results: `fib(n-1) + fib(n-2)` that is depicted as the two arrows from vertex `n` to vertices `n-1` and `n-2`. The results of the summation, i.e., the values of each `fib(n)`, are displayed as red text below the vertices. As there is no repeated subproblem computation, there is no lightblue vertex at all in this recursion DAG (such vertices/states will have more than one incoming arrows instead).

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

Select one of the example recursive algorithms in the drop-down list or write our own recursive code — in JavaScript. The final recursion Tree / DAG is immediately displayed. Note that this visualization can run _any_ JavaScript code, including malicious code, so please be careful (it will only affect your own web browser, don't worry).

Click the 'Run' button at the top right corner of the action box to start the step-by-step visualization of the recursive function after you have selected (or written) a valid JavaScript code!

In the next sub-sections, we start with example recursive algorithms with just one sub-problem, i.e., not branching. For these one-subproblem examples, their recursion trees and recursion DAGs are 100% identical (they looked like Singly Linked Lists from the root (initial call) to the leaf (base case)). As there is no overlapping subproblem for the examples in this category, you will not see any lightblue-colored vertex and only one green-colored vertex (the base case). The default orientation for recursion Tree is top-right-to-bottom-left whereas the default orientation for recursion DAG is right-to-left.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

The Factorial Numbers example computes the factorial of an integer `n`.

`f(n) = 1 (if n == 0);
f(n) = n*f(n-1) otherwise`

It is one of the simplest (tail) recursive function that can be easily rewritten into an iterative version. It's time complexity is also simply Θ( `n`).

The value of Factorial `f(n)` grows very fast, thus try only the small integers `n` ∈ \[0..10\]

(we randomize the value of the initial `n` between this range).

←

→

🕑

The Binary Search example finds the index of `a2` in a sorted array `a1[a..b]`. We start binary search from the initial search space of `a=0,b=a1.length-1` (the entire array `a1`, with `n = (a1.length-1) - 0 + 1 = a1.length`).

`f(a,b) = -1 (if a > b);
let mid = floor((a+b)/2);
f(a,b) = mid (if a2 = a1[mid]);
f(a,b) = f(a,mid-1) (if a2 < a1[mid]);
f(a,b) = f(mid+1,b) (if a2 > a1[mid]);`

Only one of the two possible branches will be executed each time, resulting in a recursion tree = recursion DAG situation. The time complexity if Θ(log `n`) as we keep halving the search space each time. The worst-case happens when `a2` is not found in sorted array `a1`.

In this visualization, we randomize the content of sorted array `a1` and the value to be searched `a2`.

TBC: In the near future, we will draw the entire Θ( `n`) search space (both left and right branches at each vertex) and highlight the efficient Θ(log `n`) path taken by Binary Search on this search space. This is like seeing the animation of [Search(v) function of a (balanced) Binary Search Tree](https://visualgo.net/en/bst).

←

→

🕑

The Modulo Power example computes the `a1^p % a2` in efficient way.

`f(p) = 1 (if p == 0);
f(p) = f(floor(p/2))^2 % a2 (if p is even)
f(p) = f(floor(p/2))^2 * a1 % a2 (if p is odd)`

This Divide & Conquer (D&C) algorithm runs in Θ(log `p`).

In this visualization, we randomize the values of `a1` (the base, a small value ∈ \[2..4\]),

`a2` (the modulo, a prime ∈ \[7, 97, 997, 9973\]), and power `p` (we want to raise `a1` to its `p`-th power, modulo `a2`. Due to its low time complexity, it is OK to try very large `0 ≤ p ≤ 256`.

TBC: In the near future, we may draw the comparison between this efficient D&C modulo power algorithm with the naive version that multiply `a1` `p` times that runs in Θ(`p`).

←

→

🕑

The Greatest Common Divisor (GCD) example computes the GCD of two integers `a` and `b`.

`f(a, b) = a (if b == 0);
f(a, b) = f(b, a%b) otherwise`

This is the classic Euclid's algorithm that runs in O(log `n`) where `n = min(a, b)` — depending of the details, `n = max(a, b)` or `n = a+b` are also possible.

Euclid's algorithm is an example of Divide & Conquer (D&C) algorithm.

Due to its low time complexity, it should be OK to try `0 ≤ a, b ≤ 99`.

(we randomize the values of `a` and `b` between this range and set `a ≥ b`).

Note that if we put `a < b`, technically the first recursive step will swap `a` and `b`.

Do explore various possible combinations of `a` and `b` and notice on what values `f(a, b)` terminates very quickly in 1 step ( `b = 0`), 2 steps ( `b = gcd(a, b)`), or the maximum number of steps (try [this sequence](https://visualgo.net/en/recursion?slide=4-1)) — to show the lowerbound Ω(log `n`).

←

→

🕑

The Max Range Sum example computes the value of the subarray with the maximum total sum inside the given (global) array `a1` with `n = a1.length` integers (the first textbox below the code editor textbox). The value of `a1` can be positive integers, zeroes, or negative integers (without negative integer, the answer will obviously the sum of the entire integers in `a1`).

Formally, let's define `RSQ(i, j) = a1[i] + a1[i+1] + ... + a1[j]`, where `0 ≤ i ≤ j ≤ n-1` (RSQ stands for Range Sum Query). Max Range Sum problem seeks to find the optimal `i` and `j` such that `RSQ(i, j)` is the maximum.

`f(i) = max(ai[0], 0) (if i == 0, as ai[0] can be negative);
f(i) = max(f(i-1) + ai[i], 0) otherwise`

We call `f(n-1)`. The largest value of `f(i)` is the answer.

This is the classic [Kadane's algorithm](https://en.wikipedia.org/wiki/Maximum_subarray_problem#Kadane) that runs in O( `n`).

←

→

🕑

The Catalan example computes the **n**-th [Catalan number](https://en.wikipedia.org/wiki/Catalan_number) recursively.

`f(n) = 1 (if n == 0);
f(n) = f(n-1)*2*n*(2*n-1)/(n+1)/n; otherwise`

This explanation is a stub that will be expanded later.

←

→

🕑

In the next sub-sections, we will see example recursive algorithms that have exactly two sub-problems, i.e., branching. The sizes of the subproblems can be identical or vary. For these two sub-problems examples, their recursion trees will usually be much bigger that their recursion DAGs (especially if there are (many) overlapping sub-problems, indicated with the lightblue vertices on the recursion tree drawing).

Currently shown on screen is the recursion tree of a Fibonacci recurrence.

←

→

🕑

The Fibonacci Numbers example computes the `n`-th Fibonacci number.

`f(n) = n (if n <= 1); // i.e., 0 if n == 0 or 1 if n == 1
f(n) = f(n-1) + f(n-2) otherwise`

Unlike [Factorial](https://visualgo.net/en/recursion?slide=3-1) example, this time each recursive step recurses to two other smaller sub-problems (if we call f(n-1) first before f(n-2), then the left side of the recursion tree will be taller than the right side — try swapping the two sub-problems).

The value of Fibonacci `f(n)` grows very fast and its recursion tree — if implemented verbatim as defined above — also grows exponentially, i.e., at least Ω(2n/2), thus try only the small initial values of `n ≤ 7` (to avoid crashing your web browser).

Fibonacci recursion tree is frequently used to showcase the basic idea of recursion, its inefficiency (due to the many overlapping subproblems), and the linkage to Dynamic Programming (DP) topic.

←

→

🕑

The recursion DAG (shown in the background) of Fibonacci computation only contains O( `n`) vertices and thus can go to a larger `n` ≤ 30 (so it still looks nice in this visualization; in practice `n` can go to millions with this DP solution).

Most of the time, the Fibonacci computation is written in iterative fashion after one understands the concept of DP.

It is probably rare to think this way, but this visualization shows that the computation of Fibonacci `f(n)` is basically counting the number of paths from `n` to vertex `1`.

←

→

🕑

The C(n, k) example computes the [binomial coefficient](https://en.wikipedia.org/wiki/Binomial_coefficient)  `C(n, k)`.

`f(n, k) = 1 (if k == 0); // 1 way to take nothing out of n items
f(n, k) = 1 (if k == n); // 1 way to take everything out of n items
f(n, k) = f(n-1, k-1) + f(n-1, k) // take the last item or skip it`

The recursion tree of `C(n, k)` grows very fast, with the largest tree when `k = n/2`, smaller trees when `k` is close to `0` or `n` (a few path(s) with short leafs), and smallest trees when `k` is `0` or `n` (only one vertex).

←

→

🕑

The recursion DAG of `C(n, k)` is basically an inverted [Pascal's Triangle](https://en.wikipedia.org/wiki/Pascal%27s_triangle). It only contains O( `(n/2)*(n/2)`) = O( `n^2/4`) vertices at most (when `k = n/2`) although in practice we probably just use a DP/memo table of size O( `n^2`). Thus we can go to a larger `n` ≤ 15 (so it still looks nice in this visualization) and `k∈[0..n]`, including when `k≈n/2`.

TBC: In the near future, we may draw a dummy vertex (0, 0) --- `C(n, k)` will not actually reach it unless started from `C(0, 0)` with return value of 1 to complete the inverted Pascal's Triangle visualization.

←

→

🕑

The 0-1 Knapsack example solves the [0/1 Knapsack Problem](https://en.wikipedia.org/wiki/Knapsack_problem#0.2F1_knapsack_problem): What is the maximum value that we can get, given a knapsack that can hold a maximum weight of `w`, where the value of the `i`-th item is `a1[i]`, the weight of the i-th item is `a2[i]`?

0-1 Knapsack has a classic DP recurrence `f(i, w)` which we call using `f(n-1, max-w)` where `n = a1.length`.

`f(i, w) = f(i-1, w); // ignore item i (always possible)
f(i, w) = a1[i] + f(i-1, w-a2[i]); // take item i (if a2[i]≤w)
f(<0, w) = 0; // all items have been considered
f(i, 0) = 0; // cannot carry anything else`

The recursion tree of this DP recurrence has a few (like currently shown on screen) to many (e.g., try all items having the same weight, i.e., ones) overlapping sub-problems.

←

→

🕑

The recursion DAG of 0-1 Knapsack only contains O( `n * max-w`) vertices. Thus we can go to a larger `n` ≤ 7 and `max-w` ≤ 15 (so it still looks nice in this visualization).

This DP recurrence basically tries to find the longest (weighted) path in this implicit DAG and has time complexity of O( `n * max-w`).

If the weights of each item in `a2` vary a lot, the recursion DAG will look sparse. Try setting `a2=[1,2,...,2^i]` for a denser recursion DAG (but no overlap) or `a2=[1,1,...,1]` (lots of overlap).

←

→

🕑

In the next sub-sections, we will see example recursive algorithms that have many sub-problems (1, 2, 3, ..., a certain limit). For many of these examples, the sizes of their Recursion Trees are exponential and we will really need to use Dynamic Programming to compute its Recursion DAGs instead.

←

→

🕑

The Longest Increasing Subsequence example solves the [Longest Increasing Subsequence](https://en.wikipedia.org/wiki/Longest_increasing_subsequence) problem: Given an array a1, how long is the Longest Increasing Subsequnce of the array?

The recursion DAG of the default example (not randomized) is as follows: Vertex `j ∈ [0..i-1]` is laid out horizontally (along the x-axis from left/vertex 0 to right/vertex `i-1`), then placed vertically (along the y-axis according to the value of `a1[j]`). We draw an edge between two indices `j` and `k` if `a1[j] < a1[k]` (with all vertices having hidden edge to the dummy max(a1)+1 value at the top-right cell so that all LIS ends at this dummy vertex and we can start the recursion with `f(i)` where `i = a1.length-1`). Then this LIS problem can be visualized as finding the longest path in this (implicit) recursion DAG.

As there are **\|V\| = n** vertices and **\|E\| = O(n^2)** edges (use sorted ascending test case, e.g., {1,2,4,8,16,...} to have nice visualization), the overall time complexity to solve LIS using DP is O( **n^2**). Since early 2000s, we should use the faster O( **n log k**) greedy+binary search solution for LIS (not explained in this slide).

←

→

🕑

The Coin Change example solves the [Coin Change problem](https://en.wikipedia.org/wiki/Change-making_problem): Given a list of coin values in a1, what is the minimum number of coins needed to get the value v?

The recursion tree of the default example (not randomized) has v = 7 cents and 4 coins that are specifically selected to be {4, 3, 1, 5}. What is shown on-screen is the entire recursion tree of Coin-Change recursive function.

A typical greedy algorithm for Coin-Change that always take the largest coin value that does not exceed current value v will be trapped into taking the rightmost branch: 7 cents (take 5 cents coin) → 2 cents (take 1 cent coin) → 1 cent (take another 1 cent coin) → 0 (total 3 coins).

DP algorithm that explores this recursion tree (but avoiding repeated computations on the lightblue vertices will find the lefmost branch: 7 cents (take 4 cents coin) → 3 cents (take 3 cents coin) → 0 (total 2 coins). Alternative solution: 7 → 4 → 0 (also 2 coins).

←

→

🕑

The Cutting Rod example solves the 'fictional' introductory problem in Chapter 14.1 - Dynamic Programming of the "Introductions to Algorithms" (CLRS 4th edition) textbook: Given a rod of length `n` inches and a table of prices `a1` for length 1,2,..., `n` inches, determine the maximum revenue obtainable by cutting up the rod and selling the pieces.

The recursion tree of the default example (not randomized) has n = 4 inches. What is shown on-screen is the entire recursion tree of Cut-Rod recursive function.

`f(n) = max(a1[i-1] + f(n-i)) ∀i∈[1..n];
f(0) = 0; // cannot cut anymore`

←

→

🕑

The Matrix Chain Mult(iplication) example solves the second DP introductory problem in Chapter 14.2 of the "Introductions to Algorithms" (CLRS 4th edition) textbook: Given a sequence (chain)  of `n = a1.length-1` matrices to be multiplied, where the matrices aren't necessarily square, compute the product A1\*A2\*...\*An using the standard O(p\*q\*r) algorithm for multiplying rectangular matrices, while minimizing the number of scalar multiplications.

The recursion tree of the default example (not randomized) has i=1,j=4. What is shown on-screen is the entire recursion tree of MCM recursive function.

`f(i,j) = min(f(i,k)+f(k+1,j)+a1[i-1]*a1[k]*a1[j]) ∀i≤k<j;
f(i,j) = 0 if i == j; // no need to multiply a single matrix`

←

→

🕑

The Longest Common Subsequence (LCS) example solves the [Longest Common Subsequence](https://en.wikipedia.org/wiki/Longest_common_subsequence) problem: Given two strings (character arrays) `a1` (of length `n = a1.length`) and `a2` (of length `m = a2.length`), how long is the Longest Common Subsequence between the two strings?

`f(n, m) = 1 + f(n-1, m-1); // if a1[n] == a2[m]; last char matches
f(n, m) = max(f(n-1, m), f(n, m-1)) // if last char differs
f(n, <0) = 0; // a2 is empty
f(<0, m) = 0; // a1 is empty`

We call `f(n-1, m-1)`, from the last character of both strings.

The recursion tree of this DP recurrence has an exponential (like currently shown on screen) number of overlapping sub-problems if both strings have many different characters (but do try `a1 == a2`; we will see a single-branch recursion tree).

←

→

🕑

The recursion DAG of LCS only contains O( `n * m`) vertices. Thus we can use longer strings with `n` ≤ 10 and `m` ≤ 10 (so it still looks nice in this visualization).

This DP recurrence basically tries to find the longest (0/1-weighted) path in this implicit DAG and has time complexity of O( `n * m`).

←

→

🕑

The Graph Matching problem computes the maximum number of [matching](https://en.wikipedia.org/wiki/Matching_(graph_theory)) on a **small** graph, which is given in the adjacency matrix a1.

This slide is a stub and will be expanded in the future.

←

→

🕑

The Traveling Salesperson example solves the [Traveling Salesperson Problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem) on small graph: How long is the shortest path that goes from city 0, passes through every city once, and goes back again to 0? The distance between city i and city j is denoted by a1\[i\]\[j\].

This slide is a stub and will be expanded in the future.

←

→

🕑

In the next sub-sections, instead of visualizing the recursion tree of a recursive algorithm, we visualize the recursion tree of the recurrence (equation) to help analyze the time complexity of certain Divide and Conquer (D&C) algorithms.

The value computed by `f(n)`(the red label underneath each vertex that signifies the return value of that recursive function/that subproblem) is thus the **total** number of operations taken by that recursive algorithm when its problem size is `n` (the value drawn inside each vertex). Most textbooks will say the function name of this recurrence as `T(n)`, but we choose not to change our default `f(n)` function name that is used in all other recursive algorithm visualizations. Some other textbooks (e.g., CLRS) also put the cost of each vertex only, not the cost of the entire subproblem.

←

→

🕑

In [Sorting](https://visualgo.net/en/sorting?slide=11-8) visualization, we learn about merge sort. It's time complexity recurrences are:

`f(n) = Θ(1) (if n < n0`) — we usually assume that the base cases are Θ(1)

`f(n) = f(n/2) + f(n/2) + c*n (otherwise)`

Please check the recursion tree of the default example (n = 16). We will use the same recursion tree for the next few sub-slides. You should see the initial problem size of `n = 16` written inside the root vertex and its return value (total amount of work done by `f(16)` is `32+32+1*16 = 80`). This value of `f(n)` is consistent throughout the recursion tree, e.g., `f(8) = f(4)+f(4)+1*4 = 12+12+1*8 = 32`.

←

→

🕑

We see that

the height of

this recursion tree

is log2 n

as we keep

halving n by 2

until we reach

the base case

of size 1.

For n = 16, we have

16->

8->

4->

2->

1 (log2 16 = 4 steps).

PS: height of tree =

the number of edges

from root to

the deepest leaf.

←

→

🕑

As the effort done in the recursive step per subproblem of size n is c\*n (the divide (trivial, Θ(1)) and the conquer (merge) operation, the Θ(n)), we will perform exactly c\*n operations per each recursion level of **this** specific recursion tree.

The root of size (n) does c\*n operations during the merge step.

The two children of the root of size (n/2) both do c\*n/2, and 2\*c\*n/2 = c\*n too.

The grandchildren level is 4\*c\*n/4 = c\*n too.

And so on until the last level (the leaves).

As the red label underneath each vertex in this visualization reports the value of the entire subproblem (including the subtrees below), these identical costs per level are not easily seen, e.g., from root to leaf, we see 80, 2x32 = 64, 4x12 = 48, 8x4 = 32, 16x1 = 16 and may get different conclusion... However, if we discounted the values of its subproblems, we will get the same conclusion, e.g., for the root, we do 80-2x32 = 16 operations, for the children of the root, we do 2x(32-2x12) = 2x8 = 16 operations too, etc.

Soon, we will show 'work-done-in-each-level' info in the visualization directly.

←

→

🕑

The number of green leaves is 2log2 n = nlog2 2 = n.

Each of these leaf does Θ(1) step, thus the total work of the last (leaf) level is also Θ(n).

The total work done by Merge sort is thus c\*n per level, multiplied by the height of the recursion tree (log2 n + 1 more for the leaves), or Θ(n log n).

For this example, `f(16) = 80` from 1x16 x (log2 16 + 1) = 16 x (4 + 1) = 16 x 5 = 80.

←

→

🕑

In [Sorting](https://visualgo.net/en/sorting?slide=12-12) visualization, we also learn about the non-random(ized) quick sort.

It may have a worst case behavior of O(n2) on certain kind of (trivial) instances of (nearly-) sorted input and it may have the following time complexity recurrence (with `a = 1`):

`f(n) = Θ(1) (if n < n0)` — we usually assume that the base cases are Θ(1)

`f(n) = f(n-a) + f(a) + c*n (otherwise)`

Note that writing the recurrence in the other direction does not matter much asymptotically, other than the recursion tree will be mirrored.

Please observe the currently drawn recursion tree.

We want to show that this recursion tree has f(n) = O(n2).

←

→

🕑

We see that

the height of

this recursion tree

is rather tall, i.e., `n/a - 1`

as we only reduces `n`

by `a` per level.

Thus, we need `n/a - 1` steps

to reach the base case

( `n = 1`).

For `n = 16, a = 1`, we have

16->

15->

14->

...->

2->

1 (16/1 - 1 = 15 steps).

←

→

🕑

As the effort done in the recursive step per subproblem of size `n` is `c*n` (divide (the partition) operation in Θ(n); the conquer step is trivial — Θ(1)), we will perform exactly c\*n operations per each recursion level.

The root of size (n) does c\*n operations during the partition step.

The children of the root of size (n-a) does c\*(n-1) and the other does f(a).

The grandchildren level does c\*(n-2) and the other does f(a).

And so on until the last level (the leaves both does f(a)).

←

→

🕑

The total work done by Quick sort on this worst-case input is the sum of arithmetic progression series of `1+2+...+n` plus a few other constant factor operations (all the `f(a)` are Θ(1)). This simplifies to `f(n) = Θ(n2)`.

←

→

🕑

For recurrences of the form:

`f(n) = a*f(n/b) + g(n)`

where `a ≥ 1`, `b > 1`, and `g(n)` is asymptotically positive,

we maybe able to apply the master theorem (also called as master method).

PS: In this visualization, we have to rename CLRS function names to our convention:

`f(n) → g(n)` and `T(n) → f(n)`.

We compare the driving function `g(n)` (the amount of divide and conquer work in each recursive step of size `n`) with `nlogba` (the watershed function — also the asymptotic number of leaves of the recursion tree), if `g(n) = O(nlogba-ε)` for ε > 0, it means that the driving function `g(n)` grows polynomially slower than the watershed function nlogba (by a factor of `nε`), thus the watershed function nlogba will dominate and the solution of the recurrence is `f(n) = θ(nlogba)`.

Visually, if you see the recursion tree for recurrence that falls into case 1 category, the cost per level grows exponentially from root level to the leaves (in this picture, 1\*4\*4 = 16, 7\*2\*2 = 28, 49\*1\*1 = 49, ..., 16+28+49 = 93), and the total cost of the leaves dominates the total cost of all internal vertices.

←

→

🕑

The most popular example is [Strassen's algorithm for matrix multiplication](https://en.wikipedia.org/wiki/Strassen_algorithm) where case 1 of master theorem is applicable. The recurrence is: `f(n) = 7*f(n/2) + c*n*n`.

Thus `a = 7`, `b = 2`, watershed = `nlog2 7 = n2.807`, driving = `g(n) = Θ(n2)`.

`n2 = O(n2.807-ε) for ε = 0.807...` — case 1 — Thus `f(n) = Θ(n2.807)`

Exercise: You can try changing the demo code by setting `a = 8` and set `g(n) = c*1` to change the recurrence of Strassen's algorithm to the recurrence of the simple recursive matrix multiplication algorithm that has `f(n) = Θ(n3)`.

←

→

🕑

The detailed analysis of the Merge sort algorithm from [a few slides earlier](https://visualgo.net/en/recursion?slide=6-1) can be simplified using master theorem, e.g., `f(n) = 2*f(n/2) + c*n`.

Thus `a = 2`, `b = 2`, watershed = `nlog2 2 = n`, driving = `g(n) = Θ(n)`.

`n = Θ(n logk n)` for `k = 0`

The watershed and driving functions have the same asymptotic growth — case 2

Thus `f(n) = Θ(n log n)`.

Visually, if you see the recursion tree for recurrence that falls into case 2 category, the cost per level is ~the same, i.e., Θ( `nlogba logk n`) and there are `logb n` levels. We claim that the solution is `f(n) = Θ(nlogba logk+1 n)`. That's it, the solution of the recurrence that falls under case 2 is to add an extra log factor to `g(n)`.

Exercise: You can try changing the demo code by setting `a = 1` and set `g(n) = c*1` to change the recurrence of Merge sort algorithm to the recurrence of the binary search algorithm. For binary search version, `f(n) = Θ(log n)`. Notice that for most of real-life case 2 algorithm recurrences (e.g., Merge Sort and Binary Search), `k = 0`.

←

→

🕑

Case 3 is the opposite of Case 1, where the driving function `g(n)` grows polynomially faster than the watershed function `nlogba`. Thus the bulk of the operations is done by the driving function at the root level (but check the regularity condition too, to be elaborated below). This case 3 is actually rarely appear in real algorithms so we use an example fictional recurrence: `f(n) = 4*f(n/2) + c*n^3`.

Thus `a = 4`, `b = 2`, watershed = `nlog2 4 = n2, driving = g(n) = Θ(n3).
n^3 = Ω(n2+ε) for ε = 1 and
4*(n/2)3 ≤ c*n3 (regularity condition) for c = 1/2 — case 3
Thus f(n) = Θ(n3).`

Visually, if you see the recursion tree for recurrence that falls into case 3 category, the cost per level **drops** exponentially from root level to the leaves (in this picture, 1\*4\*4\*4 = 64, 4\*2\*2\*2 = 32, 16\*1\*1\*1 = 16, ..., 64+32+16 = 112), and the total cost of the root dominates the total cost of all other internal vertices (including the (many) leaves).

* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

f(){
Factorial NumbersBinary SearchModulo PowerGCD(a, b)Max Range SumCatalan NumbersFibonacci NumbersC(n, k)0-1 KnapsackLISCoin ChangeCutting RodMatrix Chain MultLCSMatchingTSPMerge Sort AnalysisQuick Sort AnalysisRand Q Sort AnalysisMaster T, Case 2MT2 (L2 Example)Master T, Case 1MT1 (L2 Example)Master T, Case 3MT3 (L2 Example)Custom Code

Run

}


var a1 =


var a2 =



T(n) = a T(n/b) + c nd (log2 n)k; T(n) = c for all 0 ≤ n ≤ 1


Run

Master Theorem Case 1 (Example 1, Strassen's Matrix Multiplication Analysis)
Master Theorem Case 1 (Example 2)Master Theorem Case 2 (Example 1, Merge Sort Analysis)Master Theorem Case 2 (Example 2)Master Theorem Case 3 (Example 1)Custom Example

|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| T(n) | = |  |  | T(n/) |
|  |  | \+ |  | n^ <br> (log2 n)^ |
| n | = |  |  |

![>](https://visualgo.net/img/arrow_white_right.png)

GO

Enter an **n by n matrix**.

n=

CancelDone

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/recursion)

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