---
source_url: "https://visualgo.net/en/mst"
title: "Minimum Spanning Tree (Prim&#39;s, Kruskal&#39;s) - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

-7![rewind 7 frames](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![forward 7 frames](https://visualgo.net/img/nextFrame.png)+7

![>](https://visualgo.net/img/arrow_black_right.png)

![>](https://visualgo.net/img/arrow_black_right.png)

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

0123456788899111112121213141619202125

slide 1 (3%)

✍

✘

A **Spanning Tree (ST)** of a connected undirected weighted graph **G** is a subgraph of **G** that is a **tree** and **connects (spans) all vertices of G**. A graph **G** can have many STs (see [this](https://en.wikipedia.org/wiki/Cayley%27s_formula) or [this](https://en.wikipedia.org/wiki/Kirchhoff%27s_theorem)), each with different total weight (the sum of edge weights in the ST).

A **Min(imum) Spanning Tree (MST)** of **G** is an ST of **G** that has the **smallest total weight** among the various STs.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Min(imum) Spanning Tree (MST)   1-1. MST Problem   1-2. Motivating Example   1-3. MST Algorithms2\. Visualisation3\. Input Graph4\. Kruskal's Algorithm   4-1. The Basic Idea   4-2. The Answer   4-3. The Basic Idea - Continued   4-4. Short Proof of Correctness - 1   4-5. Short Proof of Correctness - 2   4-6. Short Proof of Correctness - 3   4-7. Implementation Sketch5\. Prim's Algorithm   5-1. The Basic Idea   5-2. Short Proof of Correctness - Part 1   5-3. If T != T\*, Part 1   5-4. If T != T\*, Part 2   5-5. Short Proof of Correctness - Part 2   5-6. Implementation Sketch6\. Poll   6-1. The Answer7\. Extras   7-1. MST Problem Variants   7-2. Online Quiz   7-3. Online Judge Exercises   7-4. Discussion

The **MST** problem is a standard graph (and also optimization) problem defined as follows: Given a connected undirected weighted graph **G = (V, E)**, select a **subset** of edges of **G** such that the graph is still connected but with minimum total weight. The output is either the actual MST of **G** (there can be several possible MSTs of **G**) or usually just the minimum total weight itself (this is unique).

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

Government wants to link **N** rural villages in the country with **N-1** roads.

(that is a _spanning tree_ with **N** vertices and **N-1** edges).

The cost to build a road to connect two villages depends on the terrain, distance, etc.

(that is a _complete undirected weighted graph_ of **N\*(N-1)/2** weighted edges).

You want to minimize the total building cost. How are you going to build the roads?

(that is _minimum spanning tree_).

PS: There is a variant of this problem that requires more advanced solution, e.g., see [this](https://visualgo.net/en/steinertree).

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

The **MST** problem has polynomial solutions.

In this visualization, we will learn two of them: Kruskal's algorithm and Prim's algorithm. Both are classified as **Greedy** Algorithms. Note that there are other MST algorithms outside the two presented here.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

View the visualisation of MST algorithm above.

Originally, all vertices and edges in the input graph are colored with the standard black color on white background.

At the end of the MST algorithm, **\|V\|-1** MST edges (and all **\|V\|** vertices) will be colored orange and non-MST edges will be colored grey.

←

→

🕑

There are threedifferent sources for specifying an input graph:

1. **Edit Graph**: You can edit the currently displayed connected undirected weighted graph or draw your own graph.
2. **Input Graph**: You can input a graph (in Edge List/Adjacency List/Adjacency Matrix format) and VisuAlgo will propose a 2D graph drawing for your graph.
3. **Example Graphs**: You can select from the list of example connected undirected weighted graphs to get you started.

←

→

🕑

**Kruskal's algorithm**: An O( **E** log **V**) greedy MST algorithm that grows a forest of minimum spanning trees and eventually combine them into one MST.

Kruskal's requires [a good sorting algorithm](https://visualgo.net/en/sorting) to sort edges of the input graph (usually stored in an [Edge List](https://visualgo.net/en/graphds) data structure) by non-decreasing weight and another data structure called [Union-Find Disjoint Sets (UFDS)](https://visualgo.net/en/ufds) to help in checking/preventing cycle.

←

→

🕑

Kruskal's algorithm first sort the set of edges **E** in non-decreasing weight (there can be edges with the same weight), and if ties, by increasing smaller vertex number of the edge, and if still ties, by increasing larger vertex number of the edge.

Discussion: Is this the only possible sort criteria?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Then, Kruskal's algorithm will perform a loop through these sorted edges (that already have non-decreasing weight property) and **greedily** taking the next edge **e** if it does **not** create any cycle w.r.t. edges that have been taken earlier.

Without further ado, let's try Kruskal on the default example graph (that has three edges with the same weight). Go through this animated example first before continuing.

←

→

🕑

To see on why the **Greedy Strategy** of Kruskal's algorithm works, we define a **loop invariant**: Every edge **e** that is added into tree **T** by Kruskal's algorithm is part of the **MST**.

At the start of Kruskal's main loop, **T = {}** is always part of **MST** by definition.

Kruskal's has a special cycle check in its main loop (using [UFDS](https://visualgo.net/en/ufds) data structure) and only add an edge **e** into **T** if it will never form a cycle w.r.t. the previously selected edges.

At the end of the main loop, Kruskal's can only select **V**-1 edges from a connected undirected weighted graph **G** without having any cycle. This implies that Kruskal's produces a Spanning Tree.

On the default example, notice that after taking the first 2 edges: 0-1 and 0-3, in that order, Kruskal's **cannot** take edge 1-3 as it will cause a cycle 0-1-3-0. Kruskal's then take edge 0-2 but it cannot take edge 2-3 as it will cause cycle 0-2-3-0.

←

→

🕑

We have seen in the previous slide that Kruskal's algorithm will produce a tree **T** that is a Spanning Tree (ST) when it stops. But is it the minimum ST, i.e., the **MST**?

To prove this, we need to recall that **before** running Kruskal's main loop, we have already sort the edges in non-decreasing weight, i.e., the latter edges will have equal or **larger** weight than the earlier edges.

←

→

🕑

At the start of every loop, **T** is always part of MST.

If Kruskal's only add a legal edge **e** (that will not cause cycle w.r.t. the edges that have been taken earlier) with **min cost**, then we can be sure that **w(T U e) ≤ w(T U any other unprocessed edge e' that does not form cycle)** (by virtue that Kruskal's has sorted the edges, so **w(e) ≤ w(e')**).

Therefore, at the end of the loop, the Spanning Tree **T** must have minimal overall weight **w(T)**, so **T** is the final MST.

On the default example, notice that after taking the first 2 edges: 0-1 and 0-3, in that order, and ignoring edge 1-3 as it will cause a cycle 0-1-3-0, we can safely take the next smallest legal edge 0-2 (with weight 2) as taking any other legal edge (e.g., edge 2-3 with **larger** weight 3) will either create **another** MST with equal weight (not in this example) or **another** ST that is not minimum (which is this example).

←

→

🕑

There are two parts of Kruskal's algorithm: Sorting and the Kruskal's main loop.

The sorting of edges is easy. We just store the graph using **Edge List** [data structure](https://visualgo.net/en/graphds) and sort **E** edges using any O( **E** log **E**) = O( **E** log **V**) [sorting algorithm](https://visualgo.net/en/sorting) (or just use C++/Python/Java sorting library routine) by non-decreasing weight, smaller vertex number, higher vertex number. This O( **E** log **V**) is the bottleneck part of Kruskal's algorithm as the second part is actually lighter, see below.

Kruskal's main loop can be easily implemented using [Union-Find Disjoint Sets](https://visualgo.net/en/ufds) data structure. We use **IsSameSet(u, v)** to test if taking edge **e** with endpoints **u** and **v** will cause a cycle (same connected component -- there is another path in the subtree that can connect **u** to **v**, thus adding edge **(u, v)** will cause a cycle) or not. If **IsSameSet(u, v)** returns false, we greedily take this next smallest and legal edge **e** and call **UnionSet(u, v)** to prevent future cycles involving this edge. This part runs in O( **E**) as we assume UFDS **IsSameSet(u, v)** and **UnionSet(u, v)** operations run in O( **1**) for a relatively small graph.

←

→

🕑

**Prim's algorithm**: Another O( **E** log **V**) greedy MST algorithm that grows a Minimum Spanning Tree from a starting source vertex until it spans the entire graph.

Prim's requires a Priority Queue data structure (usually implemented using [Binary Heap](https://visualgo.net/en/heap) but we can also use [Balanced Binary Search Tree](https://visualgo.net/en/avl) too) to dynamically order the currently considered edges based on non-decreasing weight, an [Adjacency List data structure](https://visualgo.net/en/graphds) for fast neighbor enumeration of a vertex, and a Boolean array ( [a Direct Addressing Table](https://visualgo.net/en/hashtable?slide=2-2)) to help in checking cycle.

Another name of Prim's algorithm is Jarnik-Prim's algorithm.

←

→

🕑

Prim's algorithm starts from a designated source vertex **s** (usually vertex 0) and enqueues all edges incident to **s** into a Priority Queue (PQ) according to non-decreasing weight, and if ties, by increasing vertex number (of the neighboring vertex number). Then it will repeatedly do the following greedy steps: If the vertex **v** of the front-most edge pair information **e: (w, v)** in the PQ has **not** been visited, it means that we can greedily extends the tree **T** to include vertex **v** and enqueue edges connected to **v** into the PQ, otherwise we discard edge **e** (because Prim's grows one spanning tree from **s**, the fact that **v** is already visited implies that there is another path from **s** to **v** and adding this edge will cause a cycle).

Without further ado, let's try Prim(1) on the default example graph (that has three edges with the same weight). That's it, we start Prim's algorithm from source vertex **s = 1**. Go through this animated example first before continuing.

←

→

🕑

Prim's algorithm is a **Greedy Algorithm** because at each step of its main loop, it always try to select the next valid edge **e** with minimal weight (that is greedy!).

To convince us that Prim's algorithm is correct, let's go through the following simple proof: Let **T** be the spanning tree of graph **G** generated by Prim's algorithm and **T\*** be the spanning tree of **G** that is known to have minimal cost, i.e. **T\*** is the **MST**.

If **T == T\***, that's it, Prim's algorithm produces exactly the same **MST** as **T\***, we are done.

But if **T != T\***...

←

→

🕑

Assume that on the default example, **T = {0-1, 0-3, 0-2}** but **T\* = {0-1, 1-3, 0-2}** instead.

Let **ek = (u, v)** be the first edge chosen by Prim's Algorithm at the **k**-th iteration that is not in **T\*** (on the default example, **k = 2**, **e2 = (0, 3)**, note that **(0, 3)** is not in **T\***).

Let **P** be the path from **u** to **v** in **T\***, and let **e\*** be an edge in **P** such that one endpoint is in the tree generated at the ( **k** −1)-th iteration of Prim's algorithm and the other is not (on the default example, **P = 0-1-3** and **e\* = (1, 3)**, note that vertex **1** is inside **T** at first iteration **k = 1**).

←

→

🕑

If the weight of **e\*** is less than the weight of **ek**, then Prim's algorithm would have chosen **e\*** on its **k**-th iteration as that is how Prim's algorithm works.

So, it is certain that **w(e\*) ≥ w(ek)**.

(on the example graph, **e\* = (1, 3)** has weight 1 and **ek = (0, 3)** also has weight 1).

When weight **e\*** is = weight **ek**, the choice between the **e\*** or **ek** is actually arbitrary. And whether the weight of **e\*** is ≥ weight of **ek**, **e\*** can always be substituted with **ek** while preserving minimal total weight of **T\***. (on the example graph, when we replace **e\* = (1, 3)** with **ek = (0, 3)**, we manage to transform **T\*** into **T**).

←

→

🕑

But if **T != T\***... (continued)

We can repeat the substitution process outlined earlier repeatedly until **T\* = T** and thereby we have shown that the spanning tree generated by any instance of Prim's algorithm (from any source vertex **s**) is an MST as whatever the optimal MST is, it can be transformed to the output of Prim's algorithm.

←

→

🕑

We can easily implement Prim's algorithm with two well-known data structures:

1. A Priority Queue PQ ( [Binary Heap](https://visualgo.net/en/heap) inside C++ STL priority\_queue/Python heapq/Java PriorityQueue or [Balanced BST](https://visualgo.net/en/avl) inside C++ STL set/Java TreeSet), and
2. A Boolean array of size **V**, essentially a [Direct Addressing Table](https://visualgo.net/en/hashtable?slide=2-2) (to decide if a vertex has been taken or not, i.e., in the same connected component as the source vertex **s** or not).

With these, we can run Prim's Algorithm in O( **E** log **V**) because we process each edge once and each time, we call **Insert((w, v))** and **(w, v) = ExtractMax()** from a PQ in O(log **E**) = O(log **V2**) = O(2 log **V**) = O(log **V**). As there are **E** edges, Prim's Algorithm runs in O( **E** log **V**).

←

→

🕑

Quiz: **Having seen both Kruskal's and Prim's Algorithms, which one is the better MST algorithm?**

It Depends

Prim's Algorithm

Kruskal's Algorithm

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

You have reached the end of the basic stuffs of this Min(imum) Spanning Tree graph problem and its two classic algorithms: Kruskal's and Prim's (there are others, like another O(E log V) [Boruvka's](https://en.wikipedia.org/wiki/Bor%C5%AFvka%27s_algorithm) algorithm, but not discussed in this visualization). We encourage you to explore further in the **Exploration Mode**.

However, the harder MST problems can be (much) more challenging that its basic version.

Once you have (roughly) mastered this MST topic, we encourage you to study more on harder graph problems where MST is used as a component, e.g., approximation algorithm for NP-hard [(Metric No-Repeat) TSP](https://visualgo.net/en/tsp) and [Steiner Tree](https://visualgo.net/en/steinertree) problems.

←

→

🕑

We write a few MST problem variants in the [Competitive Programming book](https://cpbook.net/).

1. Max(imum) Spanning Tree,
2. Min(imum) Spanning Subgraph,
3. Min(imum) Spanning Forest,
4. Second Best Spanning Tree,
5. Minimax (Maximin) Path Problem, etc

Advertisement: Buy CP book to study more about these variants and see that sometimes Kruskal's is better and sometimes Prim's is better at some of these variants.

←

→

🕑

For a few more challenging questions about this MST problem and/or Kruskal's/Prim's Algorithms, please practice on [MST](https://visualgo.net/training?diff=Medium&n=10&tl=0&module=mst) training module (no login is required, but on medium difficulty setting only).

However, for NUS students, you should login to officially clear this module and such achievement will be recorded in your user account.

←

→

🕑

This MST problem can be much more challenging than this basic form. Therefore we encourage you to try the following two ACM ICPC contest problems about MST: [UVa 01234 - RACING](https://uva.onlinejudge.org/external/12/1234.pdf "") and [Kattis - arcticnetwork](https://open.kattis.com/problems/arcticnetwork "").

Try them to consolidate and improve your understanding about this graph problem.

You are allowed to use/modify our implementation code for Kruskal's/Prim's Algorithms:

[kruskal.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/kruskal.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/kruskal.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/kruskal.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/kruskal.ml)

[prim.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/prim.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/prim.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/prim.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch4/mst/prim.ml)

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

Kruskal's Algorithm

Prim's Algorithm(s)

>

CP 4.10

CP 4.14

K5

Rail

Tessellation

Large

s =

Go

Status

No Warning

No Error

# Input   Directed = true, Weighted = false

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

CancelClearDoneHelpReshuffle LayoutNegate Edge Weights

- Click on empty spaces to add vertex
- Drag from vertex to vertex to add edge
- Select + Delete to delete vertex/edge
- Select Edge + Enter to change edge's weight
- Press Shift and drag vertex to reposition them
- For Mac users, use Fn + Del for deletion

Copy JSON text to clipboard

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/mst)

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