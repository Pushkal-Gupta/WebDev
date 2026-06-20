---
source_url: "https://visualgo.net/en/mvc"
title: "Minimum Vertex Cover (Bruteforce, Approximation, DP, Greedy) - VisuAlgo"
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

0123428131322271313191419

slide 1 (9%)

✍

✘

A **Vertex Cover** (VC) of a connected undirected (un)weighted graph **G** is a **subset of vertices V** of **G** such that **for every edge** in **G**, **at least one of its endpoints is in V**. A **Minimum Vertex Cover (MVC)** ( **Minimum Weight Vertex Cover (MWVC)** for the weighted variant) of **G** is a VC that has the smallest cardinality (if unweighted) or total weight (if weighted) among all possible VCs. A graph can have multiple VCs but the cardinality/total weight of its MVC/MWVC is unique.

There is another problem called **Maximum Independent Set** (MIS) that attempts to find the **largest** subset of vertices in a (un)weighted graph **G** without any adjacent vertices in the subset. Interestingly, the **complement of an MVC of a graph is an MIS**.

At the end of every visualization, when an algorithm highlights an MVC solution of the currently displayed graph in orange color. For non-approximation solutions, the visualization will also highlight the MIS solution (which is V \ MVC) with light blue color.

MVC, MWVC, MIS, (and MWIS) are all NP-hard combinatorial optimization problems.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Vertex Cover   1-1. Two Modes2\. Visualization3\. Input4\. Bruteforce   4-1. Parameterized Solution5\. DP on Tree6\. Greedy MVC on Tree7\. Kőnig's Theorem8\. Approximation Algorithms   8-1. Approximation Ratio Proofs

There are two available modes: Unweighted (default) and Weighted. You can switch between the two modes by clicking the respective tab.

There are algorithms that work in both modes and there are algorithms that only work in a certain mode.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

View the visualisation of the selected MVC algorithms here.

Originally, all vertices and edges in the input graph are colored with the standard black outline. As the visualization goes on, the color light blue will be used to denote covered edges and the color orange on edge will be used to show traversed edges.

At the end of the selected MVC algorithm, if it finds a **minimum** VC, it will highlight the MVC vertices with orange color and the non MVC vertices (a.k.a. the MIS vertices) with light blue color. Otherwise, if the found vertex cover is not proven to be the minimal one (e.g., the algorithm used is an approximation algorithm), it will highlight the vertices that belong to the found vertex cover with orange color without highlighting the MIS vertices.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

There are two different ways to specify an input graph:

1. **Edit Graph**: You can edit the currently displayed undirected (weighted for MWVC mode) graph into any other undirected (weighted for MWVC mode) graph.
2. **Example Graphs**: You can select from the list of example undirected (weighted for MWVC mode) graphs to get you started.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

**Bruteforce**: It tries all possible 2^ **V** subsets of vertices. In every iteration, it checks whether the currently selected subset of vertices is a valid vertex cover by iterating over all **E** edges in O( **E**) and checking whether all edges are covered by the vertices in the currently selected subset. This bruteforce algorithm keeps the smallest size of the valid vertex cover as the answer.

This bruteforce algorithm is available in both weighted and unweighted version.

Its time complexity is O(2^ **V** × **E**), i.e., extremely slow. We are in the process to improve the visualization so that the 'boring' non-improving parts are cut-out and only the important 'candidate VC' subsets are highlighted.

Discussion: But there is an alternative O(2^ **k** × **E**) parameterized solution if we are told that **k** is 'not-that-large'.

←

→

🕑

Unfortunately this part has not been digitized/visualized yet and is in the pipeline.

Please see CS4234 lecture note for the details.

←

→

🕑

**DP on Tree**: If the graph is a **tree**, the MVC problem can be formulated as a Dynamic Programming problem where the states are (position, take\_current\_vertex).

Then, it can be seen that:

DP(u, take) = cost\[u\] + sum(min(DP(v, take), DP(v, not\_take))) ∀child v of u, and

DP(u, not take) = sum(DP(v, take)) ∀child v of u

This DP algorithm is available in both weighted and unweighted version.

Its time complexity is O( **V**), i.e., very fast, but only if the input graph is a tree.

←

→

🕑

**Greedy MVC on Tree**: Again, if the graph is an **unweighted** **tree**, it can be solved greedily by observing that if there is any MVC solution that takes a leaf vertex, we can obtain a "not worse" solution by taking the parent of that leaf vertex instead. After removing all covered vertices, we can apply the same observation and repeat it until every vertex is covered.

This greedy MVC algorithm is only available in unweighted mode.

Its time complexity is O( **V**), i.e., very fast, but only if the input graph is an unweighted tree.

←

→

🕑

**Kőnig's Theorem**: From Kőnig's Theorem, the size of MVC in an **unweighted bipartite** graph is equal to the cardinality of the maximum matching of the bipartite graph. In the case of **weighted bipartite** graph, we can see that this theorem also holds true, with a tweak in how we construct the graph. In this visualization, we use a reduction to max flow problem to get the value of the MVC.

This algorithm is available in both weighted and unweighted version.

Its time complexity is O( **V** × **E**) (for unweighted version; can be smaller with pre-processing) or O( **E** ^2 × **V**)/O( **V** ^2 × **E**) (for weighted version, depending on the max flow algorithm used).

←

→

🕑

There are several known approximation algorithms for MVC:

1. For unweighted version, we have either the deterministic 2-approximation or probabilistic 2-approximation (in expectation),
2. For weighted version we have the Bar-Yehuda and Even's 2-approximation algorithm.

Note that these algorithms only yield an "approximated" MVC, meaning that they are not a true **minimum** vertex cover, but a good enough one.

←

→

🕑

Unfortunately this part has not been digitized yet and is in the pipeline.

Please see CS4234 lecture note for the details.

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

Bruteforce

MVC on Tree

MVC on Bipartite Graph

Approximation

Parameterized MVC

>

General Graph

Medium Graph

CS4234 Sample

Flow Graph

House of Cards

CP4 4.7

CP4 4.3

CP4 4.2

CP4 4.1

Corner Case

Unconnected Graph

Weighted Det 2-approx Killer

Star (Tree) - Center

Star (Tree) - Leaves

Unweighted Det 2-approx Killer (K Edges)

Special Case

Pseudoforest

Bipartite Graph

Bipartite (Tree)

Tree (Large)

Tree (Small)

Line (odd)

Line (even)

Max Clique

Dense Graph Bar

K̅5

K̅4

Dense Graph

K5

K4

DP on Tree

Greedy MVC on Tree

Kőnig's Theorem

Deterministic 2-opt

Probabilistic 2-opt

k =

Parameterized MVC

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

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/mvc)

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