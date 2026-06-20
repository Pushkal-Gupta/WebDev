---
source_url: "https://visualgo.net/en/graphds"
title: "Graph Data Structures (Adjacency Matrix, Adjacency List, Edge List) - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

slide 1 (1%)

✍

✘

A graph is made up of _vertices_/nodes and _edges_/lines that connect those vertices.

A graph may be undirected (meaning that there is no distinction between the two vertices associated with each bidirectional edge) or a graph may be directed (meaning that its edges are directed from one vertex to another but not necessarily in the other direction).

A graph may be weighted (by assigning a weight to each edge, which represent numerical values associated with that connection) or a graph may be unweighted (either all edges have unit weight 1 or all edges have the same constant weight).

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Graph   1-1. Simple Graph   1-2. Terminologies, Part 1   1-3. Terminologies, Part 2   1-4. Terminologies, Part 3   1-5. Terminologies, Part 4   1-6. Terminologies, Part 5   1-7. Terminologies, Part 6   1-8. Special Graphs2\. Graph is Pervasive   2-1. Examples - Easier to See, 1   2-2. Examples - Easier to See, 2   2-3. Examples - Harder to See3\. Modes4\. Visualization   4-1. Visualization Constraints5\. Example Graphs6\. Special Graphs   6-1. Special Graph - Tree, Part 1   6-2. Special Graph - Tree, Part 2   6-3. Special Graph - Tree, Part 3   6-4. Special Graph - Tree, Part 4   6-5. Special Graph - Complete   6-6. Special Graph - Bipartite   6-7. Special Graph - DAG7\. Three Graph Data Structures   7-1. Adjacency Matrix (AM)   7-2. AM - Continued   7-3. The Answer   7-4. Adjacency List (AL)   7-5. Class IntegerPair (in Java)   7-6. Why Vector of Vector Pairs?   7-7. AL - Continued   7-8. The Answer   7-9. Edge List (EL)   7-10. EL - Continued   7-11. The Answer8\. Simple Applications   8-1. Counting V   8-2. The Answer   8-3. Counting E   8-4. The Answer   8-5. Enumerating Neighbors of a Vertex u   8-6. The Answer   8-7. Checking the Existence of Edge (u, v)   8-8. The Answer   8-9. Discussion   8-10. The Answer9\. Extras   9-1. Online Quiz   9-2. Implementation Examples   9-3. Online Judge Exercises   9-4. Discussion   9-5. Implicit Graph   9-6. More Implicit Graphs

Most graph problems that we discuss in VisuAlgo involves _simple_ graphs.

In a simple graph, there is no _(self-)loop_ edge (an edge that connects a vertex with itself) and no _multiple_/ _parallel_ edges (edges between the same pair of vertices). In another word: There can only be up to one edge between a pair of distinct vertices.

The number of edges **E** (formally **\|E\|**, but we can also use **E** without the the vertical bars) in a simple graph can only range from 0 to O( **V2**) where **V** is the number of vertices (formally **\|V\|**, but we can also use **V**).

Graph algorithms on simple graphs are easier than on non-simple graphs.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

An undirected edge **e**: ( **u**, **v**) is said to be incident with its two end-point vertices: **u** and **v**. Two vertices are called adjacent (or neighbor) if they are incident with a common edge. For example, edge (0, 2) is incident to vertices 0+2 and vertices 0+2 are adjacent.

Two edges are called adjacent if they are incident with a common vertex. For example, edge (0, 2) and (2, 4) are adjacent.

The degree of a vertex **v** in an undirected graph is the number of edges incident with vertex **v**. A vertex of degree 0 is called an isolated vertex. For example, vertex 0/2/6 has degree 2/3/1, respectively.

A subgraph **G'** of a graph **G** is a (smaller) graph that contains subset of vertices and edges of **G**. For example, a triangle {0, 1, 2} is a subgraph of the currently displayed graph.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

A path (of length **n**) in an (undirected) graph **G** is a sequence of vertices **{v0, v1, ..., vn-1, vn}** such that there is an edge between **vi** and **vi+1** ∀ **i** ∈ \[0.. **n**-1\] along the path.

If there is no repeated vertex along the path, we call such path as a simple path.

For example, {0, 1, 2, 4, 5} is one simple path in the currently displayed graph.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

An undirected graph **G** is called connected if there is a path between every pair of distinct vertices of **G**. For example, the currently displayed graph is not a connected graph.

An undirected graph **C** is called a connected component of the undirected graph **G** if:

1). **C** is a subgraph of **G**;

2). **C** is connected;

3). no connected subgraph of **G** has **C** as a subgraph and contains vertices or edges that are not in **C** (i.e., **C** is the maximal subgraph that satisfies the other two criteria).

For example, the currently displayed graph have {0, 1, 2, 3, 4} and {5, 6} as its two connected components.

A cut vertex/bridge is a vertex/edge that increases the graph's number of connected components if deleted. For example, in the currently displayed graph, there is no cut vertex, but edge (5, 6) is a bridge.

←

→

🕑

In a directed graph, some of the terminologies mentioned earlier have small adjustments.

**WARNING: The arrow tips disappear on some web browsers; please use Google Chrome**.

If we have a directed edge **e**: ( **u** → **v**), we say that **v** is adjacent to **u** but not necessarily in the other direction. For example, 1 is adjacent to 0 but 0 is not adjacent to 1 in the currently displayed directed graph.

In a directed graph, we have to further differentiate the degree of a vertex **v** into in-degree and out-degree. The in-degree/out-degree is the number of edges coming-into/going-out-from **v**, respectively. For example, vertex 1 has in-degree/out-degree of 2/1, respectively.

←

→

🕑

In a directed graph, we extend the concept of Connected Component (CC) into _Strongly_ Connected Component (SCC). A directed graph **G** is called strongly connected if there is a path **in each direction** between every pair of distinct vertices of **G**.

A directed graph **SCC** is called a strongly connected component of the directed graph **G** if:

1). **SCC** is a subgraph of **G**;

2). **SCC** is **strongly** connected;

3). no connected subgraph of **G** has **SCC** as a subgraph and contains vertices or edges that are not in **SCCC** (i.e., **SCC** is the maximal subgraph that satisfies the other two criteria).

In the currently displayed directed graph, we have {0}, {1, 2, 3}, and {4, 5, 6, 7} as its three SCCs.

←

→

🕑

A cycle is a path that starts and ends with the same vertex.

An acyclic graph is a graph that contains no cycle.

In an undirected graph, each of its undirected edge causes a _trivial_ cycle (of length 2) although we usually will not classify it as a cycle.

A directed graph that is also acyclic has a special name: Directed Acyclic Graph (DAG), as shown above.

There are interesting algorithms that we can perform on acyclic graphs that will be explored in this visualization page and in other graph visualization pages in VisuAlgo.

←

→

🕑

A graph with specific properties involving its vertices and/or edges structure can be called with its specific name, like Tree (like the one currently shown), Complete Graph, Bipartite Graph, Directed Acyclic Graph (DAG), and also the less frequently used: Planar Graph, Line Graph, Star Graph, Wheel Graph, etc.

In this visualization, we will highlight [the first four special graphs later](https://visualgo.net/en/graphds?slide=6).

←

→

🕑

Graph appears very often in various form in real life. The most important part in solving graph problem is thus the **graph modeling** part, i.e., reducing the problem in hand into graph terminologies: vertices, edges, weights, etc.

←

→

🕑

Social Network: Vertices can represent people, Edges represent connection between people (usually undirected and unweighted).

For example, see the undirected graph that is currently shown. This graph shows 7 vertices (people) and 8 edges (connection/relationship) between them. Perhaps we can ask questions like these:

1. Who is/are the friend(s) of people no 0?
2. Who has the most friend(s)?
3. Is there any isolated people (those with no friend)?
4. Is there a common friend between two strangers: People no 3 and people no 5?
5. Etc...

←

→

🕑

Transportation Network: Vertices can represent stations, edges represent connection between stations (usually weighted).

For example, see the directed weighted graph that is currently shown. This graph shows 5 vertices (stations/places) and 6 edges (connections/roads between stations, with positive weight travelling times as indicated). Suppose that we are driving a car. We can perhaps ask what is the path to take to go from station 0 to station 4 so that we reach station 4 using the least amount of time?

Discussion: Think of a few other real life scenarios which can be modeled as a graph.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

To toggle between the graph drawing modes, select the respective header. We have:

1. U/U = Undirected/Unweighted,
2. U/W = Undirected/Weighted,
3. D/U = Directed/Unweighted, and
4. D/W = Directed/Weighted.

We restrict the type of graphs that you can draw according to the selected mode.

←

→

🕑

You can click any one of the example graphs and see its example graph drawing, which is a two-dimensional depiction of that graph. Note that the same graph can have (infinitely) many possible graph drawings.

You can further edit (add/delete/reposition the vertices or add/change the weight of/delete the edges) the currently displayed graph by clicking "Edit Graph" (read the associated Help message in that Edit Graph window).

←

→

🕑

We limit the graphs discussed in VisuAlgo to be **simple** graphs. Refer to its discussion in [this slide](https://visualgo.net/en/graphds?slide=1-1).

While now we do not really limit the number of vertices that you can draw on screen, we recommend that you draw not more than 10 vertices, ranging from vertex 0 to vertex 9 (as the Adjacency Matrix of this graph will already contain 10x10 = 100 cells). This, together with the simple graph constraint earlier, limit the number of undirected/directed edges to be 45/90, respectively.

←

→

🕑

All example graphs can be found here. We provide seven "most relevant" example graphs per category (U/U, U/W, D/U, D/W).

Remember that after loading one of these example graphs, you can further edit the currently displayed graph to suit your needs.

←

→

🕑

Tree, Complete, Bipartite, Directed Acyclic Graph (DAG) are properties of special graphs. As you edit the graph, these properties are checked and updated instantly.

There are other less frequently used special graphs: Planar Graph, Line Graph, Star Graph, Wheel Graph, etc, but they are not currently auto-detected in this visualization.

←

→

🕑

**Tree** is a connected graph with **V** vertices and **E = V-1** edges, acyclic, and has **one unique path** between any pair of vertices. Usually a Tree is defined on undirected graph.

An undirected Tree (see above) actually contains trivial cycles (caused by its bidirectional edges) but it does not contain non-trivial cycle (of length 3 or larger). A directed Tree is clearly acyclic.

As a Tree only have **V-1** edges, it is usually considered a **sparse** graph.

We currently show our **U/U: Tree** example. You can go to 'Exploration Mode' and edit/draw your own trees.

←

→

🕑

Not all Trees have the same graph drawing layout of having a special root vertex at the top and leaf vertices (vertices with degree 1) at the bottom. The (star) graph shown above is also a Tree as it satisfies the properties of a Tree.

Tree with one of its vertex designated as root vertex is called a rooted Tree.

We can always transform any Tree into a rooted Tree by designating a specific vertex (usually vertex 0) as the root, and run a [DFS or BFS algorithm](https://visualgo.net/en/dfsbfs) from the root. This process of "rooting the tree" (of a Tree that is not visually drawn as a tree yet) has a visual explanation. Imagine that each vertex is a small ball (with non-zero weight) and each edge is a rope of the same length connecting two adjacent balls. Now, if we pick the root ball/vertex and pull it up, then gravity will pull the rest of the balls downwards and that is the DFS/BFS spanning tree of the tree.

←

→

🕑

In a rooted tree, we have the concept of hierarchies (parent, children, ancestors, descendants), subtrees, levels, and height. We will illustrate these concepts via examples as their meanings are as with real-life counterparts:

1. The parent of 0/1/7/9/4 are none/0/1/8/3, respectively,
2. The children of 0/1/7 are {1,8}/{2,3,6,7}/none, respectively,
3. The ancestors of 4/6/8 are {3,1,0}/{1,0}/{0}, respectively,
4. The lowest common ancestor between 4 and 6 is 1.
5. The descendants of 1/8 are {2,3,4,5,6,7}/{9}, respectively,
6. The subtree rooted at 1 includes 1, its descendants, and all associated edges,
7. Level 0/1/2/3 members are {0}/{1,8}/{2,3,6,7,9}/{4,5}, respectively,
8. The height of this rooted tree is its maximum level = 3.

←

→

🕑

For rooted tree, we can also define additional properties:

A binary tree is a rooted tree in which a vertex has at most two children that are aptly named: left and right child. We frequently see this form during the discussion of [Binary Search Tree](https://visualgo.net/en/bst) and [Binary Heap](https://visualgo.net/en/heap).

A full binary tree is a binary tree in which each non-leaf (also called the internal) vertex has exactly two children. The binary tree shown above fulfils this criteria.

A complete binary tree is a binary tree in which every level is completely filled, except possibly the last level may be filled as far left as possible. We frequently see this form especially during discussion of [Binary Heap](https://visualgo.net/en/heap).

←

→

🕑

**Complete** graph is a graph with **V** vertices and **E = V\*(V-1)/2** edges (or **E** = O( **V2**)), i.e., there is an edge between any pair of vertices. We denote a Complete graph with **V** vertices as **KV**.

Complete graph is the **most dense** simple graph.

We currently show our **U/W: K5 (Complete)** example. You can go to 'Exploration Mode' and edit/draw your own complete graphs (a bit tedious for larger **V** though).

←

→

🕑

**Bipartite** graph is an undirected graph with **V** vertices that can be partitioned into two disjoint set of vertices of size **m** and **n** where **V = m+n**. There is no edge between members of the same set. Bipartite graph is also free from odd-length cycle.

We currently show our **U/U: Bipartite** example. You can go to 'Exploration Mode' and draw/edit your own bipartite graphs.

A Bipartite Graph can also be complete, i.e., all **m** vertices from one disjoint set are connected to all **n** vertices from the other disjoint set. When **m = n = V/2**, such Complete Bipartite Graphs also have **E** = O( **V2**).

A Tree is also a Bipartite Graph, i.e., all vertices on the even levels form one set, and all vertices on the odd levels form the other set.

←

→

🕑

**Directed Acyclic Graph (DAG)** is a directed graph that has no cycle, which is very relevant for [Dynamic Programming (DP)](https://visualgo.net/en/recursion) techniques.

Each DAG has at least one [Topological Sort/Order](https://visualgo.net/en/dfsbfs) which can be found with a simple tweak to DFS/BFS Graph Traversal algorithm. DAG will be revisited again in [DP technique for SSSP on DAG](https://visualgo.net/en/sssp).

We currently show our **D/W: Four 0→4 Paths** example. You can go to 'Exploration Mode' and draw your own DAGs.

←

→

🕑

There are many ways to store graph information into a graph data structure. In this visualization, we show three graph data structures: Adjacency Matrix, Adjacency List, and Edge List — each with its own strengths and weaknesses.

←

→

🕑

Adjacency Matrix (AM) is a square matrix where the entry AM\[i\]\[j\] shows the edge's weight from vertex i to vertex j. For unweighted graphs, we can set a unit weight = 1 for all edge weights.

We usually set AM\[i\]\[j\] = 0 to indicate that there is no edge (i, j). However, if the graph contains 0-weighted edge, we have to use another symbol to indicate "no edge" (e.g., -1, None, null, etc).

We simply use a C++/Python/Java native 2D array/list of size **VxV** to implement this data structure.

←

→

🕑

Space Complexity Analysis: An AM unfortunately requires a big space complexity of O( **V** 2), even when the graph is actually sparse (not many edges).

Discussion: Knowing the large space complexity of AM, when is it beneficial to use it? Or is AM always an inferior graph data structure and should not be used at all times?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Adjacency List (AL) is an array of **V** lists, one for each vertex (usually in increasing vertex number) where for each vertex i, **AL\[i\]** stores the list of i's neighbors. For weighted graphs, we can store pairs of (neighbor vertex number, weight of this edge) instead.

We use a Vector of Vector pairs (for weighted graphs) to implement this data structure.

In C++: `vector<vector<pair<int, int>>> AL;`

In Python: `AL = [[] for _ in range(N)]`

In Java: `Vector<Vector<IntegerPair>> AL;
// class IntegerPair in Java is like pair<int, int> in C++`

←

→

🕑

```
class IntegerPair implements Comparable<IntegerPair> {
  Integer _f, _s;
  public IntegerPair(Integer f, Integer s) { _f = f; _s = s; }
  public int compareTo(IntegerPair o) {
    if (!this.first().equals(o.first())) // using != test is
      return this.first() - o.first();   // wrong as we want to
    else                                 // compare their values,
      return this.second() - o.second(); // not their references
  }
  Integer first() { return _f; }
  Integer second() { return _s; }
}
// IntegerTriple is similar to IntegerPair, but with 3 fields
```

←

→

🕑

We use pairs as we need to store pairs of information for each edge: (neighbor vertex number, edge weight) where the weight field can be set to 1, 0, unused, or simply dropped for unweighted graph.

We use Vector of Pairs due to Vector's auto-resize feature. If we have **k** neighbors of a vertex, we just add **k** times to an initially empty Vector of Pairs of this vertex (this Vector can be replaced with Linked List).

We use Vector of Vectors of Pairs for Vector's indexing feature, i.e., if we want to enumerate neighbors of vertex **u**, we use AL\[u\] (C++/Python) or AL.get(u) (Java) to access the correct Vector of Pairs.

←

→

🕑

Space Complexity Analysis: AL has space complexity of O( **V** + **E**), which is much more efficient than AM and usually the default graph DS inside most graph algorithms.

Discussion: AL is the most frequently used graph data structure, but discuss several scenarios when AL is actually **not** the best graph data structure?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Edge List (EL) is a collection of edges with both connecting vertices and their weights. Usually, these edges are sorted by increasing weight, e.g., part of [Kruskal's algorithm](https://visualgo.net/en/mst) for Minimum Spanning Tree (MST) problem. However in this visualization, we sort the edges based on increasing first vertex number and if ties, by increasing second vertex number. Note that Bidirectional edges in undirected/directed graph are listed once/twice, respectively.

We use a Vector of triples to implement this data structure.

In C++: `vector<tuple<int, int, int>> EL;`

In Python: `EL = []`

In Java: `Vector<IntegerTriple> EL;
// class IntegerTriple in Java ~ tuple<int, int, int> in C++`

←

→

🕑

Space Complexity Analysis: EL has space complexity of O( **E**), which is much more efficient than AM and as efficient as AL.

Discussion: Elaborate the potential usage of EL other than inside [Kruskal's algorithm](https://visualgo.net/en/mst) for Minimum Spanning Tree (MST) problem!

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

After storing our graph information into a graph DS, we can answer **a few** simple queries.

1. Counting **V**,
2. Counting **E**,
3. Enumerating neighbors of a vertex **u**,
4. Checking the existence of edge **(u, v)**, etc.

←

→

🕑

In an AM and AL, **V** is just the number of rows in the data structure that can be obtained in O( **V**) or even in O( **1**) — depending on the actual implementation.

Discussion: How to count **V** if the graph is stored in an EL?

PS: Sometimes this number is stored/maintained in a separate variable so that we do not have to re-compute this every time — especially if the graph never/rarely changes after it is created, hence O( **1**) performance, e.g., we can store that there are 7 vertices (in our AM/AL/EL data structure) for the example graph shown above.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

In an EL, **E** is just the number of its rows that can be counted in O( **E**) or even in O( **1**) — depending on the actual implementation. Note that depending on the need, we may store a bidirectional edge just once in the EL but on other case, we store both directed edges inside the EL.

In an AL, **E** can be found by summing the length of all **V** lists and divide the final answer by 2 (for undirected graph). This requires O( **V** + **E**) computation time as each vertex and each edge is only processed once. This can also be implemented in O( **V**) in some implementations.

Discussion: How to count **E** if the graph is stored in an AM?

PS: Sometimes this number is stored/maintained in a separate variable for efficiency, e.g., we can store that there are 8 undirected edges (in our AM/AL/EL data structure) for the example graph shown above.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

In an AM, we need to loop through all columns of AM\[u\]\[j\] ∀j ∈ \[0.. **V**-1\] and report pair of (j, AM\[u\]\[j\]) if AM\[u\]\[j\] is not zero. This is O( **V**) — slow.

In an AL, we just need to scan AL\[u\]. If there are only **k** neighbors of vertex **u**, then we just need O( **k**) to enumerate them — this is called an **output-sensitive** time complexity and is already the best possible.

We usually list the neighbors in increasing vertex number. For example, neighbors of vertex 1 in the example graph above are {0, 2, 3}, in that increasing vertex number order.

Discussion: How to do this if the graph is stored in an EL?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

In an AM, we can simply check if AM\[u\]\[v\] is non zero. This is O( **1**) — the fastest possible.

In an AL, we have to check whether AL\[u\] contains vertex **v** or not. This is O( **k**) — slower.

For example, edge (2, 4) exists in the example graph above but edge (2, 6) does not exist.

Note that if we have found edge (u, v), we can also access and/or update its weight.

Discussion: How to do this if the graph is stored in an EL?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Quiz: **So, what is the best graph data structure?**

Adjacency Matrix

Adjacency List

It Depends

Edge List

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

You have reached the end of the basic stuffs of this relatively simple Graph Data Structures and we encourage you to explore further in the **Exploration Mode** by editing the currently drawn graph, by drawing **your own** custom graphs, or by inputting Edge List/Adjacency Matrix/Adjacency List input and ask VisuAlgo to propose a "good enough" graph drawing of that input graph.

However, we still have a few more interesting Graph Data Structures challenges for you that are outlined in this section.

Note that graph data structures are usually just the necessary but not sufficient part to solve the harder graph problems like [MST](https://visualgo.net/en/mst), [SSSP](https://visualgo.net/en/sssp), [MF](https://visualgo.net/en/maxflow), [Matching](https://visualgo.net/en/matching), [MVC](https://visualgo.net/en/mvc), [ST](https://visualgo.net/en/steinertree), or [TSP](https://visualgo.net/en/tsp).

←

→

🕑

For a few more interesting questions about this data structure, please practice on [Graph Data Structures](https://visualgo.net/training?diff=Medium&n=10&tl=0&module=graphds) training module.

←

→

🕑

Please look at the following C++/Python/Java/OCaml implementations of the three graph data structures mentioned in this e-Lecture: Adjacency Matrix, Adjacency List, and Edge List: [graph\_ds.cpp \|](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/graph_ds.cpp) [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/graph_ds.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/graph_ds.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/graph_ds.ml).

←

→

🕑

Try to solve two basic programming problems that somewhat requires the usage of graph data structure without any fancy graph algorithms:

1. [UVa 10895 - Matrix Transpose](https://uva.onlinejudge.org/external/108/10895.pdf) and,
2. [Kattis - flyingsafely](https://open.kattis.com/problems/flyingsafely).

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Last but not least, there are some graphs that are so nicely structured that we do not have to actually store them in any [graph data structure](https://visualgo.net/en/graphds?slide=7) that we have discussed earlier.

For example, a complete **unweighted** graph can be simply stored with just one integer **V**, i.e., we just need to remember it's size and since a complete graph has an edge between any pair of vertices, we can re-construct all those **V \* (V-1) / 2** edges easily.

Discussion: Can you elaborate a few more implicit graphs?

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

012345611111111

Status

No Warning

No Error

# Input   Directed = true, Weighted = true

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

CancelClearDoneHelpReshuffle Layout

- Click on empty spaces to add vertex
- Drag from vertex to vertex to add edge
- Select + Delete to delete vertex/edge
- Select Edge + Enter to change edge's weight
- Press Shift and drag vertex to reposition them
- For Mac users, use Fn + Del for deletion

Copy JSON text to clipboard

|     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- |
| • **V = 7, E = 8** | • Tree? **No** | • Complete? **No** | • Bipartite? **No** | • DAG? **N/A** | • Cross? **No** |

|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Adjacency Matrix

|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| 1 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| 2 | 1 | 1 | 0 | 0 | 1 | 0 | 0 |
| 3 | 0 | 1 | 0 | 0 | 1 | 0 | 0 |
| 4 | 0 | 0 | 1 | 1 | 0 | 1 | 0 |
| 5 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 6 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | | Adjacency List

|     |     |     |     |
| --- | --- | --- | --- |
| 0: | 1 | 2 |
| 1: | 0 | 2 | 3 |
| 2: | 0 | 1 | 4 |
| 3: | 1 | 4 |
| 4: | 2 | 3 | 5 |
| 5: | 4 | 6 |
| 6: | 5 | | Edge List

|     |     |     |
| --- | --- | --- |
| 0: | 0 | 1 |
| 1: | 0 | 2 |
| 2: | 1 | 2 |
| 3: | 1 | 3 |
| 4: | 2 | 4 |
| 5: | 3 | 4 |
| 6: | 4 | 5 |
| 7: | 5 | 6 | |

N.B. You may need to scroll to see the entire table!

Edit Graph

Input Graph

U/U: CP4 Fig 2.7

U/U: CP4 Fig 2.8.B Grid

U/U: CP4 Fig 2.8.C Knight

U/U: CP4 Fig 2.8.D Prime

U/U: Tree

U/U: Binary Tree

U/U: Bipartite

>

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/graphds)

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