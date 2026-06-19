---
source_url: "https://visualgo.net/en/matching"
title: "Graph Matching (Maximum Cardinality Bipartite Matching/MCBM) - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

-7![rewind 7 frames](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![forward 7 frames](https://visualgo.net/img/nextFrame.png)+7

![>](https://visualgo.net/img/arrow_white_right.png)

![>](https://visualgo.net/img/arrow_black_right.png)

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

0123456789101112111111

slide 1 (2%)

✍

✘

A **Matching** in a graph **G = (V, E)** is a subset of edges **M** of a graph **G = (V, E)** such that no two edges share a common vertex.

**Maximum Cardinality Matching (MCM)** problem is a Graph Matching problem where we seek a matching **M** that contains the largest possible number of edges. A desirable but rarely possible result is **Perfect Matching** where all \| **V** \| vertices are matched (assuming \| **V** \| is even), i.e., the cardinality of **M** is \| **V** \| **/2**.

A **Bipartite Graph** is a graph whose vertices can be partitioned into two disjoint sets **U** and **V** such that every edge can only connect a vertex in **U** to a vertex in **V**.

**Maximum Cardinality Bipartite Matching (MCBM)** problem is the **MCM** problem in a Bipartite Graph, which is a lot easier than **MCM** problem in a General Graph.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Graph Matching   1-1. Motivation-Applications   1-2. Current Limitation: No Weighted MCM   1-3. Switching Modes2\. Visualisation3\. Input Graph   3-1. Rook Attack Modeling   3-2. Unweighted Bipartite Graph Modeling4\. MCBM Algorithms   4-1. MCBM ≤p Max-Flow   4-2. The Answer   4-3. Should We Stop Here?   4-4. Augmenting Path (Berge's) Theorem   4-5. Proof of Berge's Theorem   4-6. M∈G is max → there is no AP in G w.r.t M   4-7. M∈G is max ← there is no AP in G w.r.t M   4-8. Proof, Continued (1)   4-9. Proof, Continued (2)   4-10. O(V×E) Augmenting Path Algorithm   4-11. Example C++ Code - Part 1   4-12. Example C++ Code - Part 2   4-13. An Extreme Test Case   4-14. O(√(V)×E) Hopcroft-Karp Algorithm   4-15. O(k×E) Augmenting Path Algorithm Plus   4-16. Another Hard Test Case   4-17. So, Max Flow or AP Route?   4-18. Our Take (Part 1)   4-19. Our Take (Part 2)   4-20. Our Take (Part 3)   4-21. Hall's Matching Theorem (1)   4-22. Hall's Matching Theorem (2)   4-23. Steven's Matching Theorems (1)   4-24. Steven's Matching Theorems (2)   4-25. Steven's Matching Theorems (3)   4-26. Steven's Matching Theorems (4)5\. Weighted MCBM Algorithms   5-1. Current Limitation6\. MCM Algorithms   6-1. O(V^3) Edmonds' Matching Algorithm   6-2. O(V^3) Edmonds' Matching Algorithm Plus7\. Closing Remarks   7-1. Programming Challenges   7-2. Implementation

Graph Matching problems (and its variants) arise in various applications, e.g.,

1. Matching job openings (one disjoint set) to job applicants (the other disjoint set)
2. The weighted version of #2 is called the [Assignment problem](https://en.wikipedia.org/wiki/Assignment_problem)
3. Special-case of some NP-hard optimization problems

(e.g., [MVC, MIS](https://visualgo.net/en/mvc), MPC on DAG, etc)
4. Deterministic 2-opt Approximation Algorithm for [MVC](https://visualgo.net/en/mvc)
5. Sub-routine of Christofides's 1.5-approximation algorithm for [TSP](https://visualgo.net/en/tsp), etc...

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

In some applications, the weights of edges are not uniform (1 unit) but varies, and we may then want to take MCBM or MCM with minimum (or even maximum) total weight.

This visualization support both unweighted and weighted MCBM, but only works for unweighted MCM.

We do not have immediate plan to add support for weighted MCM and only rely on Dynamic Programming with Bitmask for small graphs solution.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

To switch between the unweighted **MCBM** (default, as it is much more popular), weighted **MCBM**, and unweighted **MCM** mode, click the respective header.

Here is an example of **MCM** mode. In **MCM** mode, one can draw a **General**, not necessarily **Bipartite** graphs. However, the graphs are unweighted (all edges have uniform weight 1).

The available algorithms (and example graphs) are different in each mode.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

You can view the visualisation here!

For **Bipartite Graph** visualization, we will mostly layout the vertices of the graph so that the two disjoint sets ( **U** and **V**) are clearly visible as Left ( **U**) and Right ( **V**) sets. When you draw your input bipartite graph, you can choose to re-layout your bipartite graph into this easier-to-visualize form. However, you do not have to visualize Bipartite Graph in this form, e.g., you can click Grid Graph to load an example grid graph and notice that vertices {0,1,2,3} can form set **U** and vertices {4,5,6,7,8} can form set **V**. There is no odd-length cycle in this grid graph.

For **General Graph**, we do not (and usually cannot) re-layout the vertices into this Left Set and Right Set form.

Initially, edges have grey color. Matched edges will have black color. Free/Matched edges along an augmenting path will have Orange/Light Blue colors, respectively.

←

→

🕑

There are four different sources for specifying an input graph:

1. **Edit Graph**: You can draw **any** undirected unweighted graph as the input graph.

However, due to the way we visualize our MCBM algorithms, we need to impose one additional graph drawing constraint that does not exist in the actual MCBM problems. That constraint is that vertices on the left set are numbered from \[0, n), and vertices on the right set are numbered from \[n, n+m). You do not have to visually draw them in left-right sets form, as shown in this Grid Graph example.\
2. **Input Graph**: This is a new (not fully tested) feature.\
3. **Modeling**: Several graph problems can be reduced into an **MCBM** problem. In this visualization, we have the modeling examples for the famous Rook Attack problem and standard **MCBM** problem (also valid in **MCM** mode).\
4. **Example Graphs**: You can select from the list of our example graphs to get you started. The list of examples is slightly different in the two **MCBM** vs **MCM** modes.\
\
←\
\
→\
\
🕑\
\
This slide is a stub and will be expanded with the explanation of this problem and how to interpret the bipartite graph created.\
\
←\
\
→\
\
🕑\
\
You can create any (small) bipartite graph with **n**/ **m** vertices on the left set, respectively, and set the density of the edges, with 100% being a complete bipartite graph **Kn,m** and 0% being a bipartite graph with no edge.\
\
←\
\
→\
\
🕑\
\
There are several Max Cardinality Bipartite Matching (MCBM) algorithms in this visualization, plus one more in Max Flow visualization:\
\
1. By reducing MCBM problem into a Max-Flow problem in polynomial time,\
\
we can actually use any Max Flow algorithm to solve MCBM.\
2. O( **V×E**) **Augmenting Path Algorithm** (without greedy pre-processing),\
3. O( **√(V)×E**) **Dinic's** or **Hopcroft-Karp Algorithm**,\
4. O( **k×E**) **Augmenting Path Algorithm** (with randomized greedy pre-processing),\
\
PS1: Although possible, we will likely not use O( **V3**) **Edmonds' Matching Algorithm** if the input is guaranteed to be a **Bipartite Graph** (as it is much slower).\
\
PS2: Although possible, we will also likely not use O( **V3**) **Kuhn-Munkres Algorithm** if the input is guaranteed to be an **unweighted** Bipartite Graph (again, as it is much slower).\
\
←\
\
→\
\
🕑\
\
The **MCBM** problem can be modeled (or reduced into) as a Max Flow problem in polynomial time.\
\
Go to [Max Flow](https://visualgo.net/en/maxflow) visualization page and see the flow graph modeling of MCBM problem (select Modeling → Bipartite Matching → all 1). Basically, create a super source vertex **s** that connects to all vertices in the left set and also create a super sink vertex **t** where all vertices in the right set connect to **t**. Keep all edges in the flow graph **directed** from source to sink and with unit weight 1.\
\
If we use one of the earliest Max Flow algorithm, i.e., a simple Ford-Fulkerson algorithm, the time complexity will be tighter than O( **M×E**) as all edge weights in the flow graph are unit weight so the max flow value **M ≤ V**, i.e., so O( **V×E**) overall.\
\
If we use one of the fastest Max Flow algorithm, i.e., Dinic's algorithm on this flow graph, we can find Max Flow = MCBM in O( **√(V)×E**) time — [the analysis is omitted for now](https://en.wikipedia.org/wiki/Dinic%27s_algorithm#Special_cases). This allows us to solve MCBM problem with **V** ∈ \[1000..1500\] in a typical 1s allowed runtime in many programming competitions.\
\
Discussion: Must the edges in the flow graph be directed or can they be undirected? Explain.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
Actually, we can just stop here, i.e., when given any MCBM(-related) problem, we can simply reduce it into a Max-Flow problem and use (the fastest) Max Flow algorithm.\
\
However, there is a far simpler Graph Matching algorithm that we will see in the next few slides. It is based on a crucial theorem and can be implemented as an easy variation of the standard Depth-First Search (DFS) algorithm.\
\
←\
\
→\
\
🕑\
\
**Augmenting Path** is a path that starts from a free (unmatched) vertex **u** in graph **G** (note that **G** does not necessarily has to be a bipartite graph although augmenting path, if any, is much easier to find in a bipartite graph), alternates through unmatched (or free/'f'), matched (or 'm'), ..., unmatched ('f') edges in **G**, until it ends at another free vertex **v**. The pattern of any Augmenting Path will be fmf...fmf and is of odd length.\
\
If we flip the edge status along that augmenting path, i.e., fmf...fmf into mfm...mfm, we will increase the number of edges in the matching set **M** by exactly 1 unit and eliminates this augmenting path.\
\
In 1957, Claude Berge proposes the following [theorem](https://en.wikipedia.org/wiki/Berge%27s_theorem):\
\
_A matching **M** in graph **G** is maximum iff there is no more augmenting path in G_.\
\
Discussion: In class, prove the correctness of Berge's theorem!\
\
In practice, we can just [use it verbatim](https://visualgo.net/en/matching?slide=4-9).\
\
←\
\
→\
\
🕑\
\
The proof claims if and only if, thus it has two parts:\
\
the forwards direction and the backwards direction.\
\
The forwards proof is easier:\
\
**M∈G** is maximum → there is no augmenting path in **G** w.r.t **M**.\
\
The backwards proof is a bit harder:\
\
**M∈G** is maximum ← there is no augmenting path in **G** w.r.t **M**.\
\
←\
\
→\
\
🕑\
\
Proof by contradiction:\
\
Suppose **M∈G** is maximum but **G** _still has_ an augmenting path w.r.t matching **M**.\
\
Now, this augmenting path: fmf...fmf (which has odd length) can be flipped into another matching **M'** that drops the previously matched edges (the 'm's) and takes the _other_ free edges (the 'f's) along the augmenting path. Thus, making **\|M'\| = \|M\|+1**.\
\
This contradicts the statement that **M** is maximum matching.\
\
So, if **M∈G** is maximum → there is no more augmenting path w.r.t matching **M** in G.\
\
←\
\
→\
\
🕑\
\
This part is usually challenging to be understood in one go. Please read carefully.\
\
We use proof by contradiction again:\
\
Suppose there is no augmenting path in **G** w.r.t **M** but **M∈G** is not maximum,\
\
i.e., we have **M'** that is larger than **M**.\
\
First, we take a [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference) of **M'** and **M** to produce a new graph **G'** that has the same vertices as **G**, but only edges that are involved in either **M'** or **M** (but not both).\
\
Let's observe this new graph **G'**. Notice that **G'** will only consist of vertices with degree 0 (isolated vertices, we ignore them), degree 1 (endpoint of an augmenting path), or degree 2 (in the middle of augmenting path, a vertex that connects an edge in **M** and another edge in **M'**). Graph with degree not more than 2 can only consist of paths or cycles.\
\
On cycles and paths, we have two sub-possibilities: odd-length or even-length.\
\
We can have even-length path (as currently show in the background), but it also doesn't help with this proof (as it implies **\|M\| = \|M'\|**, i.e., **M'** is not larger than **M**).\
\
←\
\
→\
\
🕑\
\
We can have even-length cycle (as currently shown in the background) but it doesn't help with this proof (as it implies **\|M\| = \|M'\|**, i.e., **M'** is not larger than **M**).\
\
We won't have odd-length cycle as the edges in **G'** only comes from **M** and **M'** (draw a triangle which is the smallest odd length cycle and convince yourself that after assigning one edge to **M** and another edge to **M'**, we cannot assign the third edge of the triangle into either **M** or **M'** — same situation for any other longer odd-length cycles).\
\
←\
\
→\
\
🕑\
\
Lastly, we can have odd-length path where the path starts and ends with edges from the 'larger' **M'** and edges in **M** are slightly inside, that fmf...fmf pattern. Now what is this? This is an augmenting path w.r.t. **M**. We earlier claimed that is no augmenting path in **G** w.r.t **M**, so again we arrive at a contradiction.\
\
Overall conclusion: Berge's theorem is not only the core mechanism behind the Augmenting Path algorithm, but it also lays the groundwork for algorithms that will be discussed later on, like Kuhn-Munkres (Hungarian) and Edmonds' Matching.\
\
←\
\
→\
\
🕑\
\
Recall: Berge's theorem states:\
\
_A matching **M** in graph **G** is maximum iff there is no more augmenting path in G_.\
\
The **Augmenting Path Algorithm** (on Bipartite Graph) is a simple O( **V\*(V+E)**) = O( **V2 \+ V×E**) = O( **V×E**) implementation (a modification of DFS) of that theorem: Find and then eliminate augmenting paths in Bipartite Graph **G**.\
\
Click Augmenting Path Algorithm Demo to visualize this algorithm on a special test case called X̄ (X-bar).\
\
Basically, this Augmenting Path Algorithm scans through all vertices on the left set (that were initially free vertices) one by one. Suppose **L** on the left set is a free vertex, this algorithm will recursively (via modification of DFS) go to a vertex **R** on the right set:\
\
1. If **R** is another free vertex, we have found one augmenting path (e.g., Augmenting Path 0-2 initially), and\
2. If **R** is already matched (this information is stored at **match\[R\]**), we immediately return to the left set and recurse (e.g, path 1-2-immediately return to 0-then 0-3, to find the second Augmenting Path 1-2-0-3)\
\
←\
\
→\
\
🕑\
\
```\
vi match, vis;           // global variables\
\
int Aug(int L) {         // similar with DFS algorithm\
  if (vis[L]) return 0;  // L visited, return 0\
  vis[L] = 1;\
  for (auto& R : AL[L])\
    if ((match[R] == -1) || Aug(match[R])) { // the key part\
      match[R] = L;      // flip status\
      return 1;          // found 1 matching\
    }\
  return 0;              // Augmenting Path is not found\
}\
```\
\
←\
\
→\
\
🕑\
\
```\
// in int main(), build the bipartite graph\
// use directed edges from left set (of size VLeft) to right set\
  int MCBM = 0;\
  match.assign(V, -1);\
  for (int L = 0; L < VLeft; ++L) { // try all left vertices\
    vis.assign(VLeft, 0);\
    MCBM += Aug(L);      // find augmenting path starting from L\
  }\
  printf("Found %d matchings\n", MCBM);\
```\
\
Please see the full implementation at Competitive Programming book repository: [mcbm.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.ml).\
\
←\
\
→\
\
🕑\
\
If we are given a **Complete** Bipartite Graph **KN/2,N/2**, i.e.,\
\
**V = N/2+N/2 = N** and **E = N/2×N/2 = N2/4 ≈ N2**, then\
\
the Augmenting Path Algorithm discussed earlier (that process neighbouring vertices in increasing vertex number) will run in O( **V×E**) = O( **N×N2**) = O( **N3**).\
\
This is only OK for **V** ∈ \[400..500\] in a typical 1s allowed runtime in many programming competitions.\
\
Try executing the **standard** Augmenting Path Algorithm on this Extreme Test Case, which is an almost complete **K5,5** Bipartite Graph.\
\
It feels bad, especially on the latter iterations...\
\
So, should we avoid using this simple Augmenting Path algorithm?\
\
←\
\
→\
\
🕑\
\
The key idea of Hopcroft-Karp (HK) Algorithm (invented in 1973) is identical to [Dinic's Max Flow Algorithm](https://visualgo.net/en/maxflow), i.e., prioritize shortest augmenting paths (in terms of number of edges used) first. That's it, augmenting paths with 1 edge are processed first before longer augmenting paths with 3 edges, 5 edges, 7 edges, etc (the length always increase by 2 due to the nature of augmenting path in a Bipartite Graph).\
\
Hopcroft-Karp Algorithm has time complexity of O( **√(V)×E**) — [analysis omitted for now](https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm#Analysis). This allows us to solve MCBM problem with **V** ∈ \[1000..1500\] in a typical 1s allowed runtime in many programming competitions — the similar range as with running Dinic's algorithm on Bipartite Matching flow graph.\
\
Try HK Algorithm on the same Extreme Test Case earlier. You will notice that HK Algorithm can find the MCBM in a much faster time than the previous standard O( **V×E**) Augmenting Path Algorithm.\
\
Since Hopcroft-Karp algorithm is essentially also Dinic's algorithm, we treat both as 'approximately equal'.\
\
←\
\
→\
\
🕑\
\
However, we can actually make the easy-to-code **Augmenting Path Algorithm** [discussed earlier](https://visualgo.net/en/matching?slide=4-9) to avoid its worst case O( **V×E**) behavior by doing O( **V+E**) randomized (to avoid adversary test case) greedy pre-processing (not just about randomizing the list of neighbors of each vertex) _before_ running the actual algorithm.\
\
This O( **V+E**) additional pre-processing step is simple: For every vertex on the left set, match it with a _randomly chosen_ unmatched neighbouring vertex on the right set. This way, we eliminate many trivial (one-edge) Augmenting Paths that consist of a free vertex **u**, an unmatched edge **(u, v)**, and a free vertex **v**.\
\
Try Augmenting Path Algorithm Plus on the same Extreme Test Case earlier. Notice that the pre-processing step already eliminates many trivial 1-edge augmenting paths, making the actual Augmenting Path Algorithm only need to do little amount of additional work.\
\
←\
\
→\
\
🕑\
\
Quite often, on **randomly generated** Bipartite Graph, the randomized greedy pre-processing step has cleared most of the matchings.\
\
However, we can construct test case like: **Example Graphs, Corner Case, Rand Greedy AP Killer** to make randomization as ineffective as possible. For every group of 4 vertices, there are 2 matchings. Random greedy processing has 50% chance of making mistake per group (but since each group has only short Augmenting Paths, the fixes are not 'long'). Try this Test Case with Multiple Components case to see for yourself.\
\
The worst case time complexity is no longer O( **V×E**) but now O( **k×E**) where **k** is a small integer, much smaller than **V**, **k** can be as small as 0 and is at most **V/2** (any maximal matching, as with this case, has size of at least half of the maximum matching). In our _empirical experiments_, we estimate **k** to be "about √( **V**)" too on randomly generated bipartite graphs (not the special case that is currently shown). This version of Augmenting Path Algorithm Plus also allows us to solve MCBM problem with **V** ∈ \[1000..1500\] in a typical 1s allowed runtime in many programming competitions.\
\
←\
\
→\
\
🕑\
\
So, when presented with an MCBM problem, which route should we take?\
\
1. Reduce the MCBM problem into Max-Flow and use Dinic's algorithm (essentially Hopcroft-Karp algorithm) and gets **O(√(V)×E)** theoretical performance guarantee but with a much longer implementation?\
2. Use Augmenting Path algorithm with Randomized Greedy Processing with **O(k×E)** performance with good empirical results and a much shorter implementation?\
\
Discussion: Discuss these two routes!\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
NEW FOR 2025. We have just added Min-Cost-Max-Flow (mcmf) in maxflow visualization and Hungarian/Kuhn-Munkres visualization in this VisuAlgo page.\
\
However, these features are still experimental and maybe different from the way these algorithms were written back in July 2020 for CP4.\
\
Do report to Prof Halim if you encounter technical issue(s).\
\
←\
\
→\
\
🕑\
\
The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.\
\
**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.\
\
FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.\
\
←\
\
→\
\
🕑\
\
When Graph Matching is posed on general graphs (the MCM problem), it is (much) harder to find Augmenting Path. In fact, before Jack Edmonds published his famous paper titled "Paths, Trees, and Flowers" in 1965, this MCM problem was thought to be an (NP-)hard optimization problem.\
\
There are two Max Cardinality Matching (MCM) algorithms in this visualization:\
\
1. O( **V^3**) **Edmonds' Matching** algorithm (without greedy pre-processing),\
2. O( **V^3**) **Edmonds' Matching** algorithm (with greedy pre-processing),\
\
←\
\
→\
\
🕑\
\
In General Graph (like the graph shown in the background that has \|MCM\| = 4), we may have Odd-Length cycle. Augmenting Path is not well defined in such a graph, hence we cannot easily implement [Claude Berge's theorem](https://visualgo.net/en/matching?slide=4-4) like what we did with Bipartite Graph.\
\
Jack Edmonds call a path that starts from a free vertex **u**, alternates between free, matched, ..., free edges, and returns to the **same** free vertex **u** as a **Blossom**. This situation is only possible if we have Odd-Length cycle, i.e., in a non-Bipartite Graph. For example, assume edge 1-2 has been matched in the graph shown in the background, then path 3-1=2-3 is a blossom.\
\
Edmonds then proposed [Blossom shrinking/contraction and expansion algorithm](https://en.wikipedia.org/wiki/Blossom_algorithm) to solve this issue. For details on how this algorithm works, read CP4 Section 9.28 as the current visualization of Edmonds' matching algorithm in VisuAlgo is still 'a bit too hard too understand' for beginners, try Edmonds' Matching. In a live class in NUS, these steps will be explained verbally.\
\
This algorithm can be implemented in O( **V^3**).\
\
←\
\
→\
\
🕑\
\
O(V^3) Edmonds' Matching Algorithm Plus\
\
As with the **Augmenting Path Algorithm Plus** for the MCBM problem, we can also do randomized greedy pre-processing step to eliminate as many 'trivial matchings' as possible upfront. This reduces the amount of work of **Edmonds' Matching Algorithm**, thus resulting in a faster time complexity — analysis TBA.\
\
←\
\
→\
\
🕑\
\
We have not added the visualization(s) for weighted variant of **MCM** problem. They are for future work.\
\
The [Hungarian](https://en.wikipedia.org/wiki/Hungarian_algorithm) (Kuhn-Munkres) algorithm visualization for **weighted MCBM** is very new and requires users testing, thus do report if you encounter technical issue(s).\
\
←\
\
→\
\
🕑\
\
To strengthen your understanding about these Graph Matching problem, its variations, and the multiple possible solutions, please try solving as many of these programming competition problems listed below:\
\
1. Standard MCBM (but need a fast algorithm): [Kattis - flippingcards](https://open.kattis.com/problems/flippingcards)\
2. Greedy Bipartite Matching: [Kattis - froshweek2](https://open.kattis.com/problems/froshweek2)\
\
(you do **not** need a specific MCBM algorithm for this,\
\
in fact, it will be too slow if you use any algorithm discussed here)\
3. Special case of an NP-hard optimization problem: [Kattis - bilateral](https://open.kattis.com/problems/bilateral)\
4. Rather straightforward weighted MCBM: [Kattis - engaging](https://open.kattis.com/problems/engaging)\
\
←\
\
→\
\
🕑\
\
To tackle those programming contest problems, you are allowed to use/modify our implementation code for Augmenting Path Algorithm (with Randomized Greedy Preprocessing): [mcbm.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mcbm.ml)\
\
* * *\
\
You have reached the last slide. Return to 'Exploration Mode' to start exploring!\
\
Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.\
\
←\
\
🕑\
\
X Close\
\
Please rotate your device to landscape mode for a better user experience\
\
Please make the window wider for a better user experience\
\
Edit Graph\
\
Input Graph\
\
Modeling\
\
Example Graphs\
\
Augmenting Path\
\
>\
\
Rook Attack\
\
rows =\
\
cols =\
\
Go\
\
Generate Random Bipartite Graph, specify n, m, and edge density\
\
n =\
\
m =\
\
d =\
\
Go\
\
Generate Random Weighted Bipartite Graph, specify n\
\
n =\
\
Go\
\
K2,2\
\
X̄\
\
F-mod\
\
Corner Case\
\
House of Cards\
\
Rand Greedy AP Killer (many X̄)\
\
Undirected MF Killer\
\
Special Case\
\
Grid\
\
Tree\
\
Even Cycle\
\
Odd Line\
\
Even Line\
\
Performance Test\
\
K7,7 (d=50%)\
\
K7,7 (SMT 3)\
\
K5,5 (d=50%)\
\
K5,5 (SMT 3)\
\
Matching with Capacity\
\
waif (WA)\
\
CP4 3.11a\*\
\
CP4 3.11b\*\
\
Theorem\
\
SMT 4\
\
SMT 3\
\
SMT 2\
\
SMT 1\
\
HMT 2\
\
HMT 1\
\
Sample Weighted Bipartite\
\
Sample Weighted Bipartite TUM\
\
Sample Weighted CP4 9.24 UVa 10746\
\
Standard\
\
With Randomized Greedy Preprocessing\
\
Hopcroft Karp\
\
Edmonds Blossom\
\
Edmonds Blossom + Greedy\
\
Hungarian\
\
Status\
\
No Warning\
\
No Error\
\
# Input   Directed = true, Weighted = true\
\
Indexing Options\
\
0-Indexed\
1-Indexed\
\
\
Add dummy 0 vertex: (only work with 1-indexing)\
\
Graph Input Type\
\
Edge List\
Adjacency Matrix\
Adjacency List\
\
\
Preferred Output Graph\
\
Default  Bipartite  Line  Cycle  DAG  Tree  Flow\
\
SubmitCloseHelp!\
\
### Special Notes:\
\
The drawn graph is always 0-indexed regardless of the input index option.\
\
The dummy 0 vertex option is used to preserve the numbering of the 1 indexed graph input by adding a dummy 0 vertex.\
This is automatically unchecked after submission.\
\
Default drawing randomly draw the graphs each time. If unsatisfied, continue to press submit.\
\
- Flow graph assumes 0 as source and n-1 as sink.\
\
\
### Input format for Edge List:\
\
V E\
\
For each edge:\
\
u v (w if weighted)\
\
### Example (in 1 indexed):\
\
4 6 (4 vertices, 6 edges)\
\
1 2\
\
2 3\
\
3 1\
\
1 4\
\
4 3\
\
### Input format for Adjacency Matrix:\
\
V\
\
Adjacency Matrix\
\
### Example:\
\
4\
\
0 1 1 1\
\
1 0 1 0\
\
1 1 0 1\
\
1 0 1 0\
\
### Input format for Adjacency List:\
\
V\
\
For each vertex:\
\
Deg(v) v1 (w1) v2 (w2)...\
\
### Example (Unweighted, 1 Indexed):\
\
4\
\
3 2 3 4\
\
2 1 3\
\
3 1 2 4\
\
2 1 3\
\
CancelClearDoneHelpRefresh Layout\
\
- Click on empty spaces to add vertex\
- Drag from vertex to vertex to add edge\
- Select + Delete to delete vertex/edge\
- Select Edge + Enter to change edge's weight\
- Press Shift and drag vertex to reposition them\
- For Mac users, use Fn + Del for deletion\
\
Copy JSON text to clipboard\
\
1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/matching)\
\
#### About\
\
✕\
\
Initially conceived in 2011 by Associate Professor Steven Halim, VisuAlgo aimed to facilitate a deeper understanding of data structures and algorithms for his students by providing a self-paced, interactive learning platform.\
\
Featuring numerous advanced algorithms discussed in Dr. Steven Halim's book, 'Competitive Programming' — co-authored with Dr. Felix Halim and Dr. Suhendry Effendy — VisuAlgo remains the exclusive platform for visualizing and animating several of these complex algorithms even after a decade.\
\
While primarily designed for National University of Singapore (NUS) students enrolled in various data structure and algorithm courses (e.g., CS1010/equivalent, CS2040/equivalent (including IT5003), CS3230, CS3233, and CS4234), VisuAlgo also serves as a valuable resource for inquisitive minds worldwide, promoting online learning.\
\
Initially, VisuAlgo was not designed for small touch screens like smartphones, as intricate algorithm visualizations required substantial pixel space and click-and-drag interactions. For an optimal user experience, a minimum screen resolution of 1366x768 is recommended. However, since April 2022, a mobile (lite) version of VisuAlgo has been made available, making it possible to use a subset of VisuAlgo features on smartphone screens.\
\
VisuAlgo remains a work in progress, with the ongoing development of more complex visualizations. At present, the platform features 24 visualization modules.\
\
Equipped with a built-in question generator and answer verifier, VisuAlgo's "online quiz system" enables students to test their knowledge of basic data structures and algorithms. Questions are randomly generated based on specific rules, and students' answers are automatically graded upon submission to our grading server. As more CS instructors adopt this online quiz system worldwide, it could effectively eliminate manual basic data structure and algorithm questions from standard Computer Science exams in many universities. By assigning a small (but non-zero) weight to passing the online quiz, CS instructors can significantly enhance their students' mastery of these basic concepts, as they have access to an almost unlimited number of practice questions that can be instantly verified before taking the online quiz. Each VisuAlgo visualization module now includes its own online quiz component.\
\
VisuAlgo has been translated into three primary languages: English, Chinese, and Indonesian. Additionally, we have authored public notes about VisuAlgo in various languages, including Indonesian, Korean, Vietnamese, and Thai:\
\
[id](https://www.facebook.com/notes/steven-halim/httpidvisualgonet-visualisasi-struktur-data-dan-algoritma-dengan-animasi/10153236934439689),\
[kr](http://blog.naver.com/visualgo_nus),\
[vn](https://www.facebook.com/groups/163215593699283/permalink/824003417620494/),\
[th](http://pantip.com/topic/32736343).\
\
\
#### Team\
\
✕\
\
**Project Leader & Advisor (Jul 2011-present)**\
\
[Associate Professor Steven Halim](https://www.comp.nus.edu.sg/~stevenha/), School of Computing (SoC), National University of Singapore (NUS)\
\
[Dr Felix Halim](https://www.linkedin.com/in/felixhalim/), Senior Software Engineer, Google (Mountain View)\
\
\
**Undergraduate Student Researchers 1**\
\
**CDTL TEG 1: Jul 2011-Apr 2012**: Koh Zi Chun, Victor Loh Bo Huai\
\
\
**Final Year Project/UROP students 1**\
\
**Jul 2012-Dec 2013**: Phan Thi Quynh Trang, Peter Phandi, Albert Millardo Tjindradinata, Nguyen Hoang Duy\
\
**Jun 2013-Apr 2014** [Rose Marie Tan Zhao Yun](https://www.rosemarietan.com/), Ivan Reinaldo\
\
\
**Undergraduate Student Researchers 2**\
\
**CDTL TEG 2: May 2014-Jul 2014**: Jonathan Irvin Gunawan, Nathan Azaria, Ian Leow Tze Wei, Nguyen Viet Dung, Nguyen Khac Tung, Steven Kester Yuwono, Cao Shengze, Mohan Jishnu\
\
\
**Final Year Project/UROP students 2**\
\
**Jun 2014-Apr 2015**: Erin Teo Yi Ling, Wang Zi\
\
**Jun 2016-Dec 2017**: Truong Ngoc Khanh, John Kevin Tjahjadi, Gabriella Michelle, Muhammad Rais Fathin Mudzakir\
\
**Aug 2021-Apr 2023**: Liu Guangyuan, Manas Vegi, Sha Long, Vuong Hoang Long, Ting Xiao, Lim Dewen Aloysius\
\
**Undergraduate Student Researchers 3**\
\
**Optiver: Aug 2023-Oct 2023**: Bui Hong Duc, Tay Ngan Lin\
\
**Final Year Project/UROP students 3**\
\
**Aug 2023-Apr 2024**: Xiong Jingya, Radian Krisno, Ng Wee Han, Tan Chee Heng\
\
**Aug 2024-Apr 2025**: Edbert Geraldy Cangdinata, Huang Xing Chen, Nicholas Patrick\
\
List of translators who have contributed ≥ 100 translations can be found at [statistics](https://visualgo.net/statistics) page.\
\
\
**Acknowledgements**\
\
NUS [CDTL](https://nus.edu.sg/cdtl) gave Teaching Enhancement Grant to kickstart this project.\
\
For Academic Year 2023/24 - present (currently AY 2025/26) - generous donations from Optiver will be used to further develop VisuAlgo.\
\
#### Terms of use\
\
✕\
\
VisuAlgo is generously offered at no cost to the global Computer Science community. If you appreciate VisuAlgo, we kindly request that you **spread the word about its existence to fellow Computer Science students and instructors**. You can share VisuAlgo through social media platforms (e.g., Facebook, YouTube, Instagram, TikTok, Twitter, etc), course webpages, blog reviews, emails, and more.\
\
Data Structures and Algorithms (DSA) students and instructors are welcome to use this website directly for their classes. If you capture screenshots or videos from this site, feel free to use them elsewhere, provided that you cite the URL of this website ( [https://visualgo.net](https://visualgo.net/)) and/or the list of publications below as references. However, please refrain from downloading VisuAlgo's client-side files and hosting them on your website, as this constitutes plagiarism. At this time, we do not permit others to fork this project or create VisuAlgo variants. Personal use of an offline copy of the client-side VisuAlgo is acceptable.\
\
Please note that VisuAlgo's online quiz component has a substantial server-side element, and it is not easy to save server-side scripts and databases locally. Currently, the general public can access the online quiz system only through the 'training mode.' The 'test mode' offers a more controlled environment for using randomly generated questions and automatic verification in real examinations at NUS.\
\
**List of Publications**\
\
This work has been presented at the CLI Workshop at the ICPC World Finals 2012 (Poland, Warsaw) and at the IOI Conference at IOI 2012 (Sirmione-Montichiari, Italy). You can click [this link](https://ioinformatics.org/journal/INFOL099.pdf) to read our 2012 paper about this system (it was not yet called VisuAlgo back in 2012) and [this link](https://ioinformatics.org/journal/v9_2015_243_245.pdf) for the short update in 2015 (to link VisuAlgo name with the previous project).\
\
**Bug Reports or Request for New Features**\
\
VisuAlgo is not a finished project. Associate Professor Steven Halim is still actively improving VisuAlgo. If you are using VisuAlgo and spot a bug in any of our visualization page/online quiz tool or if you want to request for new features, please contact Associate Professor Steven Halim. His contact is the concatenation of his name and add gmail dot com.\
\
#### Privacy Policy\
\
✕\
\
**Version 1.2 (Updated Fri, 18 Aug 2023).**\
\
Since Fri, 18 Aug 2023, we no longer use Google Analytics. Thus, all cookies that we use now are solely for the operations of this website. The annoying cookie-consent popup is now turned off even for first-time visitors.\
\
Since Fri, 07 Jun 2023, thanks to a generous donation by Optiver, anyone in the world can self-create a VisuAlgo account to store a few customization settings (e.g., layout mode, default language, playback speed, etc).\
\
Additionally, for NUS students, by using a VisuAlgo account (a tuple of NUS official email address, student name as in the class roster, and a password that is encrypted on the server side — no other personal data is stored), you are giving a consent for your course lecturer to keep track of your e-lecture slides reading and online quiz training progresses that is needed to run the course smoothly. Your VisuAlgo account will also be needed for taking NUS official VisuAlgo Online Quizzes and thus passing your account credentials to another person to do the Online Quiz on your behalf constitutes an academic offense. Your user account will be purged after the conclusion of the course unless you choose to keep your account (OPT-IN). Access to the full VisuAlgo database (with encrypted passwords) is limited to Prof Halim himself.\
\
For other CS lecturers worldwide who have written to Steven, a VisuAlgo account (your (non-NUS) email address, you can use any display name, and encrypted password) is needed to distinguish your online credential versus the rest of the world. Your account will have CS lecturer specific features, namely the ability to see the hidden slides that contain (interesting) answers to the questions presented in the preceding slides before the hidden slides. You can also access Hard setting of the VisuAlgo Online Quizzes. You can freely use the material to enhance your data structures and algorithm classes. Note that there can be other CS lecturer specific features in the future.\
\
For anyone with VisuAlgo account, you can remove your own account by yourself should you wish to no longer be associated with VisuAlgo tool.