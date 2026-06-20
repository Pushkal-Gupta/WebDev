---
source_url: "https://visualgo.net/en/ufds"
title: "Union-Find Disjoint Sets (UFDS) - VisuAlgo"
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

N=14, 4 set(s)

012r: 2, s: 113456789101112131111111111

slide 1 (3%)

✍

✘

The Union-Find Disjoint Sets (UFDS) data structure is used to model a collection of disjoint sets, which is able to _efficiently (i.e., in nearly constant time)_ determine which set an item belongs to, test if two items belong to the same set, and union two disjoint sets into one when needed. It can be used to find Connected Components (CCs) in an undirected graph, and can hence be used as part of Kruskal's algorithm for the [Minimum Spanning Tree (MST)](https://visualgo.net/en/mst) problem.

Note that this data structure has another alternative name: Disjoint Sets Union (DSU).

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Union-Find Disjoint Sets (UFDS)2\. Visualization   2-1. Checkpoint 1   2-2. Storing the Data - Part 1   2-3. The Implications   2-4. Checkpoint 2   2-5. Storing the Data - Part 2   2-6. Checkpoint 33\. Operations 4\. Initialize(N, M)5\. FindSet(i)   5-1. Hands-on Examples6\. IsSameSet(i, j)   6-1. Hands-on Examples7\. UnionSet(i, j)   7-1. Indirect Path Compression   7-2. Hands-on Examples   7-3. Mini Quizzes   7-4. The Answer8\. Actual Time Complexities9\. Extras   9-1. Source Code   9-2. Online Quiz   9-3. Online Judge Exercises   9-4. The Hints   9-5. Union, Find, de-Union?   9-6. The Answer

View the visualization of a sample Union-Find Disjoint Sets here!

Each tree represents a disjoint set (thus a collection of disjoint sets form _a forest of trees_) and the root of the tree is the representative item of this disjoint set.

Now stop and look at the currently visualized trees. How many items ( **N**) are there overall? How many disjoint sets are there? What are the members of each disjoint set? What is the representative item of each disjoint set?

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

As we fixed the default example for this e-Lecture, your answers should be: **N = 13** and there are 4 disjoint sets: {0, 1, 2, 3, 4, 10}, {5, 7, 8, 11}, {6, 9}, {12} with the underlined members be the representative items (of their own disjoint set).

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

We can simply record this _forest of trees_ with an array **p** of size **N** items where **p\[i\]** records the parent of item **i** and if **p\[i\] = i**, then **i** is the root of this tree and also the representative item of the set that contains item **i**.

Once again, look at the visualization above and determine the values inside this array **p**.

Discuss: If **i** is the root of the tree that contains it, can we set **p\[i\] = -1** instead of **p\[i\] = i**? What are the implications?

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

On the same fixed example, your answers should be **p = \[1, 3, 3, 3, 3, 5, 6, 5, 5, 6, 4, 8, 12\]** of size **N = 13** ranging from **p\[0\] to p\[12\].**

You can check that **p\[3\] = 3**, **p\[5\] = 5**, **p\[6\] = 6**, and **p\[12\] = 12**, which are consistent with the fact that {3, 5, 6, 12} are the representative items (of their own disjoint set).

←

→

🕑

We also record one more information in array **rank** also of size **N**. The value of **rank\[i\]** is the _upperbound_ of the height of subtree rooted at vertex **i** that will be used as _guiding heuristic_ for **UnionSet(i, j)** operation. You will notice that after 'path-compression' heuristic (to be described later) compresses some path, the rank values no longer reflect the true height of that subtree.

As there are many items with rank 0, we set the visualization as follows to minimize clutter: Only when the rank of a vertex **i** is greater than 0, then VisuAlgo will show the value of **rank\[i\]** (abbreviated as a single character **r**) as a red text below vertex **i**.

←

→

🕑

On the same fixed example, verify that {1, 4, 6, 8} have rank 1 and {3, 5} have rank 2, with the rest having rank 0 (not shown).

At this point of time, all rank values are correct, i.e., they really describe the height of the subtree rooted at that vertex. We will soon see that they will not be always correct in the next few slides.

←

→

🕑

There are five available UFDS operations in this visualization page:

**Examples**, **Initialize(N)**, **FindSet(i)**, **IsSameSet(i, j)**, and **UnionSet(i, j)**.

The first operation ( **Examples**) is trivial: List of example UFDS structures with various special characteristics for your starting point. This e-Lecture mode always use the ' **Four disjoint sets**' example as the starting point.

Also notice that none of the example contains a 'very tall' tree. You will soon understand the reason after we describe the two heuristics used.

←

→

🕑

**Initialize(N, M)**: Create **N** items and form **M** disjoint sets with these **N** items. We randomly pick two disjoint sets and merge them until we have **M** random disjoint sets. Due to the union-by-rank heuristics used and the randomness, it is very unlikely that this initialization process creates a tall tree.

The default form is **Initialize(N, N)**, i.e., **M = N**, all with **p\[i\] = i** and **rank\[i\] = 0** (all these rank values are initially not shown). The time complexity of this operation is clearly O( **N**).

Due to the limitation of screen size, we set 1 ≤ **N** ≤ 32\. Obviously **M** ≤ **N**.

←

→

🕑

**FindSet(i)**: From vertex **i**, recursively go up the tree. That is, from vertex **i**, we go to vertex **p\[i\]**) until we find the root of this tree, which is the representative item with **p\[i\] = i** of this disjoint set.

In this **FindSet(i)** operation, we employ _path-compression_ heuristic after each call of **FindSet(i)** as now every single vertex along the path from vertex **i** to the root know that the root is their representative item and can point to it directly in O( **1**).

←

→

🕑

If we execute FindSet(12), we will immediately get vertex 12.

If we execute FindSet(9) we will get vertex 6 after 1 step and no other change.

Now try executing FindSet(0). If this is your first call on this default UFDS example, it will return vertex 3 after 2 steps and then modify the underlying UFDS structure due to path-compression in action (that is, vertex 0 points to vertex 3 directly). Notice that rank value of **rank\[1\] = 1** is now wrong as vertex 1 becomes a new leaf. However, we will not bother to update its value for efficiency.

Notice that the next time you execute FindSet(0) again, it will be (much) faster as the path has been _compressed_. For now, we assume that **FindSet(i)** runs in O( **1**).

←

→

🕑

**IsSameSet(i, j)**: Simply check if **FindSet(i) == FindSet(j)** or not. This function is used extensively in [Kruskal's MST algorithm](https://visualgo.net/en/mst). As it only calls **FindSet** operation twice, we will assume it also runs in O( **1**).

Note that **FindSet** function is called inside **IsSameSet** function, so _path-compression_ heuristic is also indirectly used.

←

→

🕑

If we call **IsSameSet(3, 5)**, we should get false as vertex 3 and vertex 5 are representative items of their respective disjoint sets and they are different.

Now try IsSameSet(0, 11) on the same default example to see indirect _path-compression_ on vertex 0 and vertex 11. We should get false as the two representative items: vertex 3 and vertex 5, are different. Notice that the rank values at vertex {1, 5, 8} are now wrong. But we will not fix them, again — for efficiency.

←

→

🕑

**UnionSet(i, j)**: If item i and j come from two disjoint sets initially, we link the representative item of the **shorter** tree/disjoint set to the representative item of the **taller** tree/disjoint set (otherwise, we do nothing). This is also done in O( **1**).

This is _union-by-rank_ heuristic in action and will cause the resulting tree to be relatively short. Only if the two trees are equally tall before union (by comparing their rank values heuristically — note that we are not comparing their actual — the current — heights), then the rank of the resulting tree will increase by one unit.

←

→

🕑

Also note that **FindSet** function is called inside **UnionSet** function, so _path-compression_ heuristic is also indirectly used. Each time _path-compression_ heuristic compresses a path, at least one rank values will be incorrect. We do not bother fixing these rank values as they are only used as guiding heuristic for this **UnionSet** function.

←

→

🕑

On the same default example, try UnionSet(9, 12). As the tree that represents disjoint set {6, 9} is currently taller (according to the value of **rank\[6\] = 1**), then the shorter tree that represents disjoint set {12} will be slotted under vertex 6, without increasing the height of the combined tree at all.

On the same default example, try UnionSet(0, 11). Notice that the ranks of vertex 3 and vertex 5 are the same **rank\[3\] = rank\[5\] = 2**. Thus, we can either put vertex 3 under vertex 5 (our implementation) or vertex 5 under vertex 3 (both will increase the resulting height of the combined tree by 1). Notice the indirect _path-compression_ heuristic in action.

←

→

🕑

Quiz: **Starting with N = 8 disjoint sets, how tall (heuristically) can the resulting final tree if we call 7 UnionSet(i, j) operations strategically?**

rank:4

rank:2

rank:1

rank:5

rank:3

Submit

Quiz: **Starting with N = 8 disjoint sets, how short (heuristically) can the resulting final tree if we call 7 UnionSet(i, j) operations strategically?**

rank:3

rank:5

rank:1

rank:2

rank:4

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

So far, we say that **FindSet(i)**, **IsSameSet(i, j)**, and **UnionSet(i, j)** runs in O( **1**). Actually they run in O(α( **N**)) if the UFDS is implemented with both _path-compression_ and _union-by-rank_ heuristics. The analysis is quite involved and is skipped in this visualization.

This α( **N**) is called the [inverse Ackermann function](https://en.wikipedia.org/wiki/Ackermann_function#Inverse) that grows extremely slowly. For practical usage of this UFDS data structure (assuming **N ≤ 1M**), we have α( **1M**) ≈ 1.

←

→

🕑

You have reached the end of the basic stuffs of this UFDS data structure and we encourage you to go to **Exploration Mode** and explore this simple but interesting data structure using your own examples.

However, we still have a few more interesting UFDS challenges for you.

←

→

🕑

Please look at the following C++/Python/Java/OCaml implementations of this Union-Find Disjoint Sets data structure in Object-Oriented Programming (OOP) fashion: [unionfind\_ds.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/unionfind_ds.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/unionfind_ds.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/unionfind_ds.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/unionfind_ds.ml)

You are free to customize this implementation to suit your needs as some harder problem requires customization of this basic implementation.

I do wish that one day C++/Python/Java/OCaml/other programming languages will include this interesting data structure in their base libraries.

←

→

🕑

For a few more interesting questions about this data structure, please practice on [Union-Find Disjoint Sets](https://visualgo.net/training?diff=Medium&n=10&tl=0&module=ufds) training module.

←

→

🕑

Even after clearing the Online Quiz of this UFDS module, do you think that you have really mastered this data structure?

Let us challenge you by asking you to solve three programming problems that somewhat requires the usage of this Union-Find Disjoint Sets data structure: [LeetCode - number-of-provinces](https://leetcode.com/problems/number-of-provinces/description/?envType=study-plan-v2&envId=leetcode-75), [UVa 01329 - Corporative Network](https://onlinejudge.org/external/13/1329.pdf), and [Kattis - control](https://open.kattis.com/problems/control).

Beware that two of the three problems are actual International Collegiate Programming Contest (ICPC) problems, i.e., they are "not trivial".

←

→

🕑

The content of this interesting slide (the answer of the usually intriguing discussion point from the earlier slide) is hidden and only available for legitimate CS lecturer worldwide. This mechanism is used in the various [flipped classrooms](https://en.wikipedia.org/wiki/Flipped_classroom) in NUS.

**If you are really a CS lecturer (or an IT teacher)** (outside of NUS) and are interested to know the answers, please drop an email to stevenhalim at gmail dot com ( **show your University staff profile/relevant proof to Steven**) for Steven to manually activate this CS lecturer-only feature for you.

FAQ: This feature will **NOT** be given to anyone else who is not a CS lecturer.

←

→

🕑

Notice that there is no 'undo' operation for Union-Find Disjoint Sets (UFDS) data structure. Once two initially disjoint sets were union-ed, it is not easy to split them back into the original two disjoint sets, especially when path compressions have flattened the combined tree.

Discussion: So what to do if we need this 'de-Union' or 'split' or 'cut' operation?

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

Examples

Initialize

FindSet

IsSameSet

UnionSet

>

4 sets

3 sets

GtCP 7.41

Default

Two disjoint sets

CLRS3 21.4

CP4 2.11

Rank 3

Rank 2

Rank 1

1 Tree of Rank 4

N =

items into


M =

disjoint sets


Go

i =

Go

i =

j =

Go

i =

j =

Go

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/ufds)

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