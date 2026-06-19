---
source_url: "https://visualgo.net/en/maxflow"
title: "Network Flow (Max Flow, Min Cut) - VisuAlgo"
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

0123451399999922

slide 1 (3%)

✍

✘

Maximum (Max) Flow is one of the problems in the family of problems involving flow in networks.

In Max Flow problem, we aim to find the maximum flow from a particular source vertex **s** to a particular sink vertex **t** in a directed weighted graph **G**.

There are several algorithms for finding the maximum flow including Ford-Fulkerson method, Edmonds-Karp algorithm, and Dinic's algorithm (there are a few others, but they are not included in this visualization yet).

The dual problem of Max Flow is Min Cut, i.e., by finding the max **s-t** flow of **G**, we also simultaneously find the min **s-t** cut of **G**, i.e., the set of edges with minimum weight that have to be removed from **G** so that there is no path from **s** to **t** in **G**.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Maximum (Max) Flow   1-1. Motivation-Applications2\. Visualization   2-1. Input   2-2. Output   2-3. The Answer   2-4. Residual Graph3\. Specifying Input Flow Graph4\. Max Flow Algorithms   4-1. Similar But Not The Same5\. Ford-Fulkerson Method   5-1. Max-Flow/Min-Cut Theorem   5-2. Cuts and Flows, Definitions   5-3. Cuts and Flows, Equal   5-4. Cuts and Flows, Weak Duality   5-5. Max-Flow/Min-Cut Theorem, Formally   5-6. Augmenting Path Theorem   5-7. Finding Edges in the Min-Cut   5-8. The Proofs   5-9. Analysis of Ford-Fulkerson Method   5-10. Non-Integer Capacities6\. Shortest Augmenting Paths First   6-1. Idea 1: Edmonds-Karp   6-2. The Proofs   6-3. Idea 2: Dinic's7\. Efficient Max Flow Algorithm Implementation

Max-Flow (or Min-Cut) problems arise in various applications, e.g.,

1. Transportation-related problems (what is the best way to send goods/material from **s** (perhaps a factory) to **t** (perhaps a super-sink of all end-users))
2. Network attacks problems (sabotage/destroy some edges to disconnect two important points **s** and **t**)
3. (Bipartite) Matching and Assignment problems (that also has specialized algorithms, see [Graph Matching](https://visualgo.net/en/matching) visualization
4. [Sport teams prospects](https://en.wikipedia.org/wiki/Maximum_flow_problem#Baseball_elimination)
5. [Image segmentation](https://en.wikipedia.org/wiki/Maximum_flow_problem#Image_segmentation), etc...

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

This visualization page will show the execution of a chosen Max Flow algorithm running on a flow (residual) graph.

To make the visualization of these flow graphs consistent, we enforce a graph drawing rule for this page whereby the source vertex **s**/sink vertex **t** is always vertex 0/ **V**-1 and is always drawn on the leftmost/rightmost side of the visualization, respectively. Another visualization-specific constraint is that the edge capacities are integers between \[1..99\].

These visualization-specific constraints do **not** exist in the standard max flow problems.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

The input for a Max Flow algorithm is a flow graph (a **directed weighted** graph **G** = **(V, E)** where edge weight of edge **e** represent the capacity **c(e)** (the unit is problem-dependent, e.g., liters/second, person/hour, etc) of flow that can go through that edge) with two distinguished vertices: The source vertex **s** (with in-degree 0) and the sink/target/destination vertex **t**(with out-degree 0). The flow graph is usually **s**- **t** connected, i.e., there is at least one path from **s** to **t**(otherwise the max flow is trivially 0).

In this visualization, these two additional inputs of **s** (usually vertex 0) and **t** (usually vertex **V**-1) are asked before the execution of the chosen Max Flow algorithm and can be customized by the user.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

The output for a Max Flow algorithm is the max flow value and an assignment of flow **f** to each edge that satisfies two important constraints:

1. **Capacity constraints** (flow on each edge ( **f(e)**) is between 0 and its (unit) capacity ( **c(e)**), i.e., 0 ≤ **f(e)** ≤ **c(e)** — not negative and not more than the capacity), and
2. **Equilibrium constraints** (for every vertex except **s** and **t**, flow-in = flow-out)

so that the value of the flow ( **value(f) = ∑v: (s, v) ∈ E f(s,v)**) is maximum.

In this visualization, we focus on showing the final max flow value and the final ST-min cut components at the end of each max flow algorithm execution, instead of the precise assignment of flow **f** to each edge, i.e., **f(e)** must be computed manually from the initial capacity **c(e)** (first frame of the animation) minus the final residual capacity of that edge **e** (last frame of the animation). This missing feature will likely be added in the next iteration of this visualization page.

Discussion: Is there other ways to compute the value of the flow **value(f)**?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

At the start of the three Max Flow algorithms discussed in this visualization (Ford-Fulkerson method, Edmonds-Karp algorithm, and Dinic's algorithm), the initial flow graph is converted into residual graph (with potential addition of back flow edges with initial capacity of zeroes).

The edges in the residual graph store the _remaining_ capacities of those edges that can be used by future flow(s). At the beginning, these remaining capacities equal to the original capacities as specified in the input flow graph.

A Max Flow algorithm will send flows to use some (or all) of these available capacities, iteratively.

Once the remaining capacity of an edge reaches 0, that edge can no longer admit any more flow. In the near future, we will update this visualization so that any edge in the residual graph that has capacity 0 (including the initial zeroes of the back flow edges) is **not** shown in the visualization.

←

→

🕑

There are three different sources for specifying an input flow graph:

1. **Draw Graph**: You can draw **any** directed weighted (weight ∈ \[1..99\]) graph as the input flow graph with vertex 0 as the default source vertex (the left side of the screen) and vertex **V**-1 as the default sink vertex (the right side of the screen),
2. **Modeling**: Several graph problems can be reduced into a Max Flow problem. In this visualization, we have the modeling examples for the famous Maximum Cardinality Bipartite Matching (MCBM) problem, Rook Attack problem (currently disabled), and Baseball Elimination problem (currently disabled),
3. **Example Graphs**: You can select from the list of our selected example flow graphs to get you started.

←

→

🕑

There are three different max flow algorithms in this visualization:

1. The slow O( **mf × E**) **Ford-Fulkerson** method,
2. The O( **V × E^2**) **Edmonds-Karp** algorithm, or
3. The O( **V^2 × E**) **Dinic's** algorithm.

There are a few other [max flow algorithms](https://en.wikipedia.org/wiki/Maximum_flow_problem#Algorithms) out there, but they are not available in this visualization yet.

←

→

🕑

For the three Max Flow algorithms discussed in this visualization, successive flows are sent from the source vertex **s** to the sink vertex **t** via available **augmenting paths** (augmenting path is a path from **s** to **t** that goes through edges with positive weight residual capacity ( **c(e)-f(e)**) left).

The three Max Flow algorithms in this visualization have different behavior on how they find augmenting paths.

However, all three Max Flow algorithms in this visualization stop when there is no more augmenting path possible and report the max flow value (and the assignment of flow on each edge in the flow graph).

Later we will discuss that this max flow value is also the min cut value of the flow graph (that famous Max-Flow/Min-Cut Theorem).

←

→

🕑

```
start with 0 flow
while there exists an augmenting path: // iterative algorithm
  find an augmenting path (for now, 'any' graph traversal will do)
  compute bottleneck capacity
  increase flow on the path by the bottleneck capacity
```

←

→

🕑

This famous theorem states that in a flow network, the **maximum flow** from **s** to **t** is equal to the total weight of the edges in a **minimum cut**, i.e., the smallest total weight of the edges that have to be removed to disconnect **s** from **t**.

In a typical Computer Science classes, the lecturer will usually spend some time to properly explain this theorem (explaining what is an st-cut, capacity of an st-cut, net flow across an st-cut equals to current flow f assignment that will never exceed the capacity of the cut, and finally that Max-Flow/Min-Cut Theorem). For this visualization, we just take this statement as it is.

Discussion: For live class in NUS, we will actually discuss these theorem.

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

Using the Max-Flow/Min-Cut Theorem, we can then prove that flow **f** is a maximum flow if and only if there is no (more) augmenting path remaining in the residual graph.

As this is what Ford-Fulkerson Method is doing, we can conclude the correctness of this Ford-Fulkerson Method, i.e., if Ford-Fulkerson Method terminates, then there is no augmenting path left and thus the resulting flow is maximum (and we can also construct the equivalent Min-Cut, next slide).

←

→

🕑

We can constructively identify the edges in the Min-Cut as follows:

1. Run Ford-Fulkerson (or any other Max Flow) algorithm until it terminates.
2. Let **S** be the set of vertices that are still reachable from the source **s**.

We can run DFS (or BFS) in the residual graph from the source vertex **s**.

All the vertices that are still reachable are in **S**.

Let **T** be the remaining vertices, i.e., **T = V \\\ S**.
3. For every vertex in **S**, enumerate outgoing edges:

If edge exits **S** (and into **T**), add to min-cut.

If both ends of edge are in **S**, then continue.

That's it, **(S,T)** is an st-cut, edges from ( **S → T**) are the minimum cut, and the flow that goes through this minimum cut **(S,T)** is the maximum possible.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Ford-Fulkerson method always terminates if the capacities are integers.

This is because every iteration of Ford-Fulkerson method always finds a new augmenting path and each augmenting path must have a bottleneck capacity at least 1 (due to that integer constraint). Therefore, each iteration increases the flow of at least one edge by at least 1, edging the Ford-Fulkerson closer to termination.

As the number of edges is finite (as well as the finite max capacity per edge), this guarantees the eventual termination of Ford-Fulkerson method when the max flow **mf** is reached and there is no more augmenting path left.

In the worst case, Ford-Fulkerson method runs for **mf** iterations, and each time it uses O( **E**) DFS. The rough overall runtime is thus O( **mf × E**) — this is actually not desirable especially if the value of **mf** is a huge number.

Discussion: What if the capacities are rational numbers? What if the capacities are floating-point numbers?

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Idea: What if we don't consider **any** augmenting paths but consider augmenting paths with the smallest number of edges involved first (so we don't put flow on more edges than necessary).

←

→

🕑

Implementation: We first ignore capacity of the edges first (assume all edges in the residual graph have weight 1), and we run O(E) BFS to find the shortest (in terms of # of edges used) augmenting path. Everything else is the same as the basic Ford-Fulkerson Method outlined earlier.

It can be proven that Edmonds-Karp will use at most O(VE) iterations thus it runs in at most in O(VE \* E) = O(VE^2) time.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Dinic's algorithm also uses similar strategy of finding shortest augmenting paths first.

But Dinic's algorithm runs in a faster time of O(V^2 × E) due to the more efficient usage of BFS shortest path information.

This slide will be expanded.

←

→

🕑

When you are presented with a Max Flow (or a Min Cut)-related problem, we do not have to reinvent the wheel every time.

You are allowed to use/modify/adapt/enhance our implementation code for Max Flow Algorithms (Edmonds-Karp/Dinic's): [maxflow.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch8/maxflow.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch8/maxflow.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch8/maxflow.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch8/maxflow.ml).

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

Modeling

Example Graphs

Ford-Fulkerson

Edmonds-Karp

Dinic

Min-Cost-Max-Flow

>

Bipartite Matching

all 1

right 1

left 1

random

Corner Case

CP4 Ex 8.5.3.1\* (correct)

CP4 Ex 8.5.3.1\* (wrong)

CP4 8.11\* (FF Killer)

Special Case

CP4 8.17.C\*

CP4 8.17.B\* (MC T = {t})

CP4 8.17.A\* (MC S = {s})

CS4234 MF Demo

CP4 8.15\* (Dinic Showcase)

Matching with Capacity

waif (AC)

Reduction

CP4 8.29\* (MWVC)

CP4 8.20.B\* (MEDP)

CP4 8.20.A\* (MVDP/MIP)

MCMF

CP4 9.24 UVa 10746

CP4 9.23

s =

t =

Go

s =

t =

Go

s =

t =

Go

s =

t =

Go

Status

No Warning

No Error

# Input   Directed = false, Weighted = false

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

CancelClearDoneHelpRefresh Layout

- Click on empty spaces to add vertex
- Drag from vertex to vertex to add edge
- Select + Delete to delete vertex/edge
- Select Edge + Enter to change edge's weight
- Press Shift and drag vertex to reposition them
- For Mac users, use Fn + Del for deletion

Copy JSON text to clipboard

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/maxflow)

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