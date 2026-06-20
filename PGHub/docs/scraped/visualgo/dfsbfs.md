---
source_url: "https://visualgo.net/en/dfsbfs"
title: "Graph Traversal (Depth/Breadth First Search) - VisuAlgo"
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

012349915-4210-99

slide 1 (2%)

✍

✘

Given a graph, we can use the O( **V** + **E**) DFS (Depth-First Search) or BFS (Breadth-First Search) algorithm to traverse the graph and explore the features/properties of the graph. Each algorithm has its own characteristics, features, and side-effects that we will explore in this visualization.

This visualization is rich with a lot of DFS and BFS variants (all run in O( **V** + **E**)) such as:

1. Topological Sort algorithm (both DFS and BFS/Kahn's algorithm version),
2. Bipartite Graph Checker algorithm (both DFS and BFS version),
3. Cut Vertex & Bridge finding algorithm,
4. Strongly Connected Components (SCC) finding algorithms

(both Kosaraju's and Tarjan's version), and
5. 2-SAT Checker algorithm.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. DFS & BFS2\. Visualization3\. Specifying an Input Graph4\. Recap   4-1. Binary Tree Traversal - Source = Root   4-2. Binary Tree Traversal - Pre-/In-/Post-order   4-3. The Answer   4-4. Binary Tree Traversal - Acyclic   4-5. Issues in General Graph5\. DFS   5-1. Analogy   5-2. Trying All Options   5-3. Avoiding Cycle   5-4. Memorizing the Path   5-5. Hands-on Example   5-6. O(V+E) Time Complexity   5-7. O(V+E) at all times?   5-8. The Answer6\. BFS   6-1. Analogy   6-2. Try All, Avoid Cycle, Memorize Path   6-3. Hands-on Example   6-4. O(V+E) Time Complexity7\. Simple DFS/BFS Applications   7-1. Reachability Test   7-2. Print the Traversal Path   7-3. Identifying a Connected Component (CC)   7-4. Counting the Number of/Labeling the CCs   7-5. Wait, What is the Time Complexity?   7-6. The Answer   7-7. Detecting Cycle - Part 1   7-8. Detecting Cycle - Part 2   7-9. Hands-on Example (Detailed)   7-10. Topological Sort - Definition   7-11. Topological Sort   7-12. Bipartite Graph Checker8\. More Advanced DFS/BFS Applications9\. Find Cut Vertices & Bridges10\. Find Strongly Connected Components11\. 2-SAT Checker Algorithm12\. Which One is Better?   12-1. The Answer13\. Extras   13-1. Online Quiz   13-2. Online Judge Exercises   13-3. Discussion

When the chosen graph traversal algorithm is running, the animation will be shown here.

We use vertex+edge color (the color scheme will be elaborated soon) and occasionally the extra text under the vertex (in red font) to highlight the changes.

All graph traversal algorithms work on directed graphs (this is the default setting, where each edge has an arrowtip to indicate its direction) but the **Bipartite Graph Check** algorithm and the **Cut Vertex & Bridge** finding algorithm requires the undirected graphs (the conversion is done automatically by this visualization).

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

There are three different sources for specifying an input graph:

1. **Edit Graph**: You can draw a new graph or edit an example unweighted directed graph as the input graph (to draw bidirectional edge (u, v), you can draw two directed edges u → v and v → u; or click 'Include Reverse Edges' button to do this for all directed edges).
2. **Input Graph**: You can specify Edge List/Adjacency Matrix/Adjacency List information and VisuAlgo will propose a 2D graph drawing layout of that graph.
3. **Example Graphs**: You can select from the list of our selected example graphs to get you started.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

If you arrive at this e-Lecture **without** having first explore/master the concept of [Binary Heap](https://visualgo.net/en/heap) and especially [Binary Search Tree](https://visualgo.net/en/bst), we suggest that you explore them first, as traversing a (Binary) Tree structure is much simpler than traversing a general graph.

Quiz: **Mini pre-requisite check. What are the Pre-/In-/Post-order traversal of the binary tree shown (root = vertex 0), left and right child are as drawn?**

In = 1, 0, 3, 2, 4

Pre = 0, 1, 2, 3, 4

In = 4, 2, 3, 0, 1

Post = 4, 3, 2, 1, 0

Pre = 0, 2, 4, 3, 1

Post = 1, 3, 4, 2, 0

Submit

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

We normally start from the most important vertex of a (binary) tree: The **root** vertex.

If the given tree is not 'rooted' (see the example picture), we can pick any one vertex (for example, vertex 0 in the example picture) and designate it as the root. If we imagine that all edges are strings of similar length, then after "virtually pulling the designated root upwards" and let gravity pulls the rest downwards, we have a rooted directed (downwards) tree — see the next slide.

PS: Technically, this transformation is done by running `DFS(0)` that we will explore soon.

←

→

🕑

In a **binary** tree, we only have **up to two** neighboring choices: From the current vertex, we can go to the left subtree first or go to the right subtree first. We also have option to visit the current vertex before or after visiting one of the (or both) subtree(s).

This gives rise to the classics: pre-order (visit current vertex, visit its left subtree, visit its right subtree), in-order (left, current, right), and post-order (left, right, current) traversals.

Discussion: Do you notice that there are three other possible binary tree traversal combinations? What are they?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

In a binary tree, or in a tree structure in general, there is no (non-trivial) cycle involving 3 or more distinct vertices to worry about (we do not consider the trivial cycle involving bi-directional edges which can be taken care of easily — see three slides earlier).

←

→

🕑

In general graph, we do not have the notion of root vertex. Instead, we need to pick one distinguished vertex to be the starting point of the traversal, i.e. the source vertex **s**.

We also have 0, 1, ..., **k** neighbors of a vertex instead of just ≤ 2, and **k** can be up to **V**-1.

We **may (or actually very likely)** have cycle(s) in our general graph instead of acyclic tree,

be it the trivial one like u → v → u or the non-trivial one like a → b → c → a.

But fret not, graph traversal is an easy problem with two classic algorithms: DFS and BFS.

←

→

🕑

One of the most basic graph traversal algorithm is the O( **V** + **E**) Depth-First Search (DFS).

DFS takes one input parameter: The source vertex **s**.

DFS is one of the most fundamental graph algorithm, so please spend time to understand the key steps of this algorithm.

←

→

🕑

![maze](https://visualgo.net/img/maze.svg)The closest analogy of the behavior of DFS is to imagine a maze with only one entrance and one exit. You are at the entrance and want to explore the maze to reach the exit. Obviously you cannot split yourself into more than one.

Ask these reflective questions before continuing: What will you do if there are branching options in front of you? How to avoid going in cycle? How to mark your own path? Hint: You need a chalk, stones (or any other marker) and a (long) string.

←

→

🕑

As it name implies, DFS starts from a distinguished source vertex **s** and uses recursion (an implicit stack) to order the visitation sequence as deep as possible before backtracking.

If DFS is at a vertex **u** and it has **X** neighbors, it will pick the first neighbor **V1** (usually the vertex with the lowest vertex number), recursively explore all reachable vertices from vertex **V1**, and eventually backtrack to vertex **u**. DFS will then do the same for the other neighbors until it finishes exploring the last neighbor **VX** and its reachable vertices.

This wordy explanation will be clearer with DFS animation later.

←

→

🕑

If the graph is **cyclic**, the previous 'try-all' strategy may lead DFS to run in cycle.

So _the basic form of DFS_ uses an array **status\[u\]** of size **V** vertices to decide between _binary conditions_: Whether vertex **u** has been visited or unvisited. Only if vertex **u** is still unvisited, then DFS can visit vertex **u**.

When DFS runs out of option, it **backtrack** to previous vertex ( **p\[u\]**, see the next slide) as the recursion unwinds.

←

→

🕑

DFS uses another array **p\[u\]** of size **V** vertices to remember the **parent/predecessor/previous** of each vertex **u** along the DFS traversal path.

The predecessor of the source vertex, i.e., **p\[s\]** is set to -1 to say that the source vertex has no predecessor (as the lowest vertex number is vertex 0).

The sequence of vertices from a vertex **u** that is reachable from the source vertex **s** back to **s** forms the **DFS spanning tree**. We color these **tree edges** with red color.

←

→

🕑

For now, ignore the extra **status\[u\] = explored** in the displayed pseudocode and the presence of blue and grey edges in the visualization (to be explained soon).

Without further ado, let's execute DFS(0) on the default example graph for this e-Lecture (CP4 Figure 4.1). Recap DFS Example

The _basic version_ of DFS presented so far is already enough for most simple cases.

←

→

🕑

The time complexity of DFS is O( **V** + **E**) because:

1. Each vertex is only visited once due to the fact that DFS will only recursively explore a vertex **u** if **status\[u\] = unvisited** — O( **V**)
2. Every time a vertex is visited, all its **k** neighbors are explored and therefore after all vertices are visited, we have examined all **E** edges — (O( **E**) as the total number of neighbors of each vertex equals to **E**).

←

→

🕑

The O( **V** + **E**) time complexity of DFS only achievable if we can visit all **k** neighboring vertices of a vertex in O( **k**) time.

Quiz: **Which underlying graph data structure support that operation?**

Adjacency Matrix

Edge List

Adjacency List

Submit

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

Another basic graph traversal algorithm is the O( **V** + **E**) Breadth-First Search (BFS).

As with DFS, BFS also takes one input parameter: The source vertex **s**.

Both DFS and BFS have their own strengths and weaknesses. It is important to learn both and apply the correct graph traversal algorithm for the correct situation.

←

→

🕑

![ripple](https://visualgo.net/img/ripple.jpg)Imagine a still body of water and then you throw a stone into it. The first location where the stone hits the water surface is the position of the source vertex and the subsequent **ripple effect** across the water surface is like the BFS traversal pattern.

←

→

🕑

BFS is very similar with DFS that have been discussed earlier, but with some differences.

BFS starts from a source vertex **s** but it uses a [queue](https://visualgo.net/en/list?mode=Queue) to order the visitation sequence _as breadth as possible before going deeper_.

BFS also uses a Boolean array of size **V** vertices to distinguish between two states: visited and unvisited vertices (we will not use BFS to detect back edge(s) as with DFS).

In this visualization, we also show that starting from the same source vertex **s** in an **unweighted graph**, BFS spanning tree of the graph equals to its [SSSP spanning tree](https://visualgo.net/en/sssp).

←

→

🕑

Without further ado, let's execute BFS(5) on the default example graph for this e-Lecture (CP4 Figure 4.2). Recap BFS Example.

Notice the _Breadth-first_ exploration due to the usage of FIFO data structure: Queue?

←

→

🕑

The time complexity of BFS is O( **V** + **E**) because:

1. Each vertex is only visited once as it can only enter the queue once — O( **V**)
2. Every time a vertex is dequeued from the queue, all its **k** neighbors are explored and therefore after all vertices are visited, we have examined all **E** edges — (O( **E**) as the total number of neighbors of each vertex equals to **E**).

As with DFS, this O( **V** + **E**) time complexity is only possible if we use [Adjacency List](https://visualgo.net/en/graphds) graph data structure — same reason as with DFS analysis.

←

→

🕑

So far, we can use DFS/BFS to solve a few graph traversal problem variants:

1. Reachability test,
2. Actually printing the traversal path,
3. Identifying/Counting/Labeling Connected Components (CCs) of undirected graphs,
4. Detecting if a graph is cyclic,
5. Topological Sort (only on DAGs),

For most data structures and algorithms courses, the applications of DFS/BFS are up to these few basic ones only, although DFS/BFS can do much more...

←

→

🕑

If you are asked to test whether a vertex **s** and a (different) vertex **t** in a graph are reachable, i.e., connected directly (via a direct edge) or indirectly (via a simple, non cyclic, path), you can call the O( **V** + **E**) `DFS(s)` (or `BFS(s)`) and check if `status[t] = visited`.

Example 1: **s = 0** and **t = 4**, run DFS(0) and notice that `status[4] = visited`.

Example 2: **s = 0** and **t = 7**, run DFS(0) and notice that `status[7] = unvisited`.

←

→

🕑

[Remember](https://visualgo.net/en/dfsbfs/?slide=5-4) that we set **p\[v\] = u** every time we manage to extend DFS/BFS traversal from vertex **u** to vertex **v** — a tree edge in the DFS/BFS spanning tree. Thus, we can use following simple recursive function to print out the path stored in array **p**. Possible follow-up discussion: Can you write this in **iterative** form? (trivial)

```
method backtrack(u)
  if (u == -1) stop
  backtrack(p[u]);
  output vertex u
```

To print out the path from a source vertex **s** to a target vertex **t** in a graph, you can call O( **V** + **E**) `DFS(s)` (or `BFS(s)`) and then O( **V**) `backtrack(t)`. Example: **s = 0** and **t = 4**, you can call DFS(0) and then `backtrack(4)`. Elaborate

←

→

🕑

We can enumerate **all** vertices that are reachable from a vertex **s** in an **undirected graph** (as the example graph shown above) by simply calling O( **V** + **E**) `DFS(s)` (or `BFS(s)`) and enumerate all vertex **v** that has `status[v] = visited`.

Example: **s = 0**, run DFS(0) and notice that `status[{0,1,2,3,4}] = visited` so they are all reachable vertices from vertex 0, i.e., they form one **Connected Component (CC)**.

←

→

🕑

We can use the following pseudo-code to count the number of CCs:

```
CC = 0
for all u in V, set status[u] = unvisited
for all u in V
  if (status[u] == unvisited)
    ++CC // we can use CC counter number as the CC label
    DFS(u) // or BFS(u), that will flag its members as visited
output CC // the answer is 3 for the example graph above, i.e.
// CC 0 = {0,1,2,3,4}, CC 1 = {5}, CC 2 = {6,7,8}
```

You can modify the DFS(u)/BFS(u) code a bit if you want to use it to label each CC with the identifier of that CC.

←

→

🕑

Quiz: **What is the time complexity of Counting the Number of CCs algorithm?**

Calling O(V+E) DFS/BFS V times, so O(V\*(V+E)) = O(V^2 + VE)

It is still O(V+E)

Trick question, the answer is none of the above, it is O(\_\_\_\_\_)

Submit

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

We can actually _augment_ the basic DFS further to give more insights about the underlying graph.

In this visualization, we use blue color to highlight **back** edge(s) of the DFS spanning tree. The presence of at least one back edge shows that the traversed graph (component) is **cyclic** while its absence shows that at least the component connected to the source vertex of the traversed graph is **acyclic**.

←

→

🕑

Back edge can be detected by modifying array **status\[u\]** to record **three** different states:

1. **unvisited**: same as earlier, DFS has not reach vertex **u** before,
2. **explored**: DFS has visited vertex **u**, but at least one neighbor of vertex **u** has not been visited yet (DFS will go depth-first to that neighbor first),
3. **visited**: now stronger definition: all neighbors of vertex **u** have also been visited and DFS is about to backtrack from vertex **u** to vertex **p\[u\]**.

If DFS is now at vertex **x** and explore edge **x → y** and encounter **status\[y\] = explored**, we can declare **x → y** is a **back edge** (a cycle is found as we were previously at vertex **y** (hence **status\[y\] = explored**), go deep to neighbor of **y** and so on, but we are now at vertex **x** that is reachable from **y** but vertex **x** leads back to vertex **y**).

←

→

🕑

The edges in the graph that are not tree edge(s) nor back edge(s) are colored grey. They are called **forward or cross edge(s)** and currently have limited use (not elaborated).

Now try DFS(0) on the example graph above with this new understanding, especially about the 3 possible status of a vertex (unvisited/normal black circle, explored/blue circle, visited/orange circle) and back edge. Edge 2 → 1 will be discovered as a back edge as it is part of cycle 1 → 3 → 2 → 1 (as vertex 2 is \`explored' to vertex 1 which is currently \`explored') (similarly with Edge 6 → 4 as part of cycle 4 → 5 → 7 → 6 → 4).

Note that if edges 2 → 1 and 6 → 4 are reversed to 1 → 2 and 4 → 6, then the graph is correctly classified as acyclic as edge 3 → 2 and 4 → 6 go from \`explored' to \`fully visited'. If we only use binary states: \`unvisited' vs \`visited', we cannot distinguish these two cases.

←

→

🕑

There is another DFS (and also BFS) application that can be treated as 'simple': Performing Topological Sort(ing) of a Directed Acyclic Graph (DAG) — see example above.

Topological sort of a DAG is a linear ordering of the DAG's vertices in which each vertex comes before all vertices to which it has outbound edges.

Every DAG (can be checked with [DFS earlier](https://visualgo.net/en/dfsbfs/?slide=7-7)) has at least one but possibly more topological sorts/ordering.

One of the main purpose of (at least one) topological sort of a DAG is for [Dynamic Programming (DP)](https://visualgo.net/en/recursion) technique. For example, this topological sorting process is used internally in [DP solution for SSSP on DAG](https://visualgo.net/en/sssp).

←

→

🕑

We can use either the O( **V** + **E**) DFS or BFS to perform Topological Sort of a Directed Acyclic Graph (DAG).

The DFS version requires just one additional line compared to the normal DFS and is basically the post-order traversal of the graph. Try Toposort (DFS) on the example DAG.

The BFS version is based on the idea of vertices without incoming edge and is also called as Kahn's algorithm. Try Toposort (BFS/Kahn's) on the example DAG.

←

→

🕑

We can use the O( **V** + **E**) DFS or BFS (they work similarly) to check if a given graph is a Bipartite Graph by giving alternating color (orange versus blue in this visualization) between neighboring vertices and report 'non bipartite' if we ends up assigning same color to two adjacent vertices or 'bipartite' if it is possible to do such '2-coloring' process. Try DFS\_Checker or BFS\_Checker on the example Bipartite Graph.

Bipartite Graphs have useful applications in [(Bipartite) Graph Matching problem](https://visualgo.net/en/matching).

Note that Bipartite Graphs are usually only defined for undirected graphs so this visualization will convert directed input graphs into its undirected version automatically before continuing. This action is irreversible and you may have to redraw the directed input graph again for other purposes.

←

→

🕑

As of now, you have seen DFS/BFS and what it can solve (with just minor tweaks). There are a few more advanced applications that require more tweaks and we will let advanced students to explore them on their own:

1. Finding Articulation Points (Cut Vertices) and Bridges of an Undirected Graph (DFS only),
2. Finding Strongly Connected Components (SCCs) of a Directed Graph (Tarjan's and Kosaraju's algorithms), and
3. 2-SAT(isfiability) Checker algorithms.

* * *

Advertisement: The details are written in [Competitive Programming book](https://cpbook.net/).

←

→

🕑

We can modify (but unfortunately, not trivially) the O( **V** + **E**) DFS algorithm into an algorithm to find Cut Vertices & Bridges of an Undirected Graph.

A Cut Vertex, or an Articulation Point, is a vertex of an undirected graph which removal disconnects the graph. Similarly, a bridge is an edge of an undirected graph which removal disconnects the graph.

Note that this algorithm for finding Cut Vertices & Bridges only works for undirected graphs so this visualization will convert directed input graphs into its undirected version automatically before continuing. This action is irreversible and you may have to redraw the directed input graph again for other purposes. You can try to Find Cut Vertices & Bridges on the example graph above.

←

→

🕑

We can modify (but unfortunately, not trivially) the O( **V** + **E**) DFS algorithm into an algorithm to find Strongly Connected Components (SCCs) of a Directed Graph G.

An SCC of a directed graph G a is defined as a subgraph S of G such that for any two vertices u and v in S, vertex u can reach vertex v directly or via a path, and vertex v can also reach vertex u back directly or via a path.

There are two known algorithms for finding SCCs of a Directed Graph: Kosaraju's and Tarjan's. Both of them are available in this visualization. Try Kosaraju's Algorithm and/or Tarjan's Algorithm on the example directed graph above.

←

→

🕑

We also have the 2-SAT Checker algorithm. Given a 2-Satisfiability (2-SAT) instance in the form of conjuction of clauses: (clause1) ^ (clause2) ^ ... ^ (clausen) and each clause is in form of disjunction of up to two variables (vara v varb), determine if we can assign True/False values to these variables so that the entire 2-SAT instance is evaluated to be true, i.e. satisfiable.

It turns out that each clause (a v b) can be turned into four vertices a, not a, b, and not b with two edges: (not a → b) and (not b → a). Thus we have a Directed Graph. If there is at least one variable and its negation inside an SCC of such graph, we know that it is impossible to satisfy the 2-SAT instance.

After such directed graph modeling, we can run an SCC finding algorithm (Kosaraju's or Tarjan's algorithm) to determine the satisfiability of the 2-SAT instance.

←

→

🕑

Quiz: **Which Graph Traversal Algorithm is Better?**

Always DFS

Always BFS

Both are Equally Good

It Depends on the Situation

Submit

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

There are lots of things that we can still do with just DFS and/or BFS...

←

→

🕑

There are interesting questions about these two graph traversal algorithms: DFS+BFS and variants of graph traversal problems, please practice on [Graph Traversal](https://visualgo.net/training?diff=Medium&n=7&tl=0&module=dfsbfs) training module (no login is required, but short and of medium difficulty setting only).

However, for registered users, you should login and then go to the [Main Training Page](https://visualgo.net/training) to officially clear this module and such achievement will be recorded in your user account.

←

→

🕑

We also have a few programming problems that somewhat requires the usage of DFS and/or BFS: [Kattis - reachableroads](https://open.kattis.com/problems/reachableroads "") and [Kattis - breakingbad](https://open.kattis.com/problems/breakingbad "").

Try to solve them and then try the **many more** interesting twists/variants of this simple graph traversal problem and/or algorithm.

You are allowed to use/modify our implementation code for DFS/BFS Algorithms:

[dfs\_cc.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/traversal/dfs_cc.cpp)/ [bfs.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/sssp/bfs.cpp)

[dfs\_cc.java](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/traversal/dfs_cc.java)/ [bfs.java](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/sssp/bfs.java)

[dfs\_cc.py](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/traversal/dfs_cc.py)/ [bfs.py](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/sssp/bfs.py)

[dfs\_cc.ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/traversal/dfs_cc.ml)/ [bfs.ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/sssp/bfs.ml)

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

Edit Graph

Input Graph

Example Graphs

Depth-First Search

Breadth-First Search

Topological Sort

Bipartite Graph Check

Cut Vertex & Bridge

SCC Algorithms

2-SAT Checker

>

CP4 4.1

CP4 4.2

CP4 4.3 DAG

CP4 4.7

CP4 4.16\*

CP4 4.20 DAG, Bipartite

CP4 4.22 Bipartite

Large Graph

Large, Cycles

CLRS 22.5 (with curvy edges)

s =

Go

s =

Go

DFS version

BFS version (Kahn's algorithm)

DFS version

BFS version

Kosaraju's Algorithm

Tarjan's Algorithm

Number of clauses =

Number of variables =

GO

Status

No Warning

No Error

# Input   Directed = false, Weighted = true

Indexing Options

0-Indexed
1-Indexed


Add dummy 0 vertex: (only work with 1-indexing)

Graph Input Type

Edge List
Adjacency Matrix
Adjacency List


Preferred Output Graph

Default  Bipartite  Line  Cycle  DAG  Tree  Flow

SubmitCloseHelp!

### Special Notes:

The drawn graph is always 0-indexed regardless of the input index option.

The dummy 0 vertex option is used to preserve the numbering of the 1 indexed graph input by adding a dummy 0 vertex.
This is automatically unchecked after submission.

Default drawing randomly draw the graphs each time. If unsatisfied, continue to press submit.

- Flow graph assumes 0 as source and n-1 as sink.


### Input format for Edge List:

V E

For each edge:

u v (w if weighted)

### Example (in 1 indexed):

4 6 (4 vertices, 6 edges)

1 2

2 3

3 1

1 4

4 3

### Input format for Adjacency Matrix:

V

Adjacency Matrix

### Example:

4

0 1 1 1

1 0 1 0

1 1 0 1

1 0 1 0

### Input format for Adjacency List:

V

For each vertex:

Deg(v) v1 (w1) v2 (w2)...

### Example (Unweighted, 1 Indexed):

4

3 2 3 4

2 1 3

3 1 2 4

2 1 3

CancelClearDoneHelpReshuffle LayoutInclude Reverse Edges

- Click on empty spaces to add vertex
- Drag from vertex to vertex to add edge
- Select + Delete to delete vertex/edge
- Select Edge + Enter to change edge's weight
- Press Shift and drag vertex to reposition them
- For Mac users, use Fn + Del for deletion

Copy JSON text to clipboard

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/dfsbfs)

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