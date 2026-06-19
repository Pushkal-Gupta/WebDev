---
source_url: "https://visualgo.net/en/fenwicktree"
title: "Binary Indexed (Fenwick) Tree - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

-7![rewind 7 frames](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![forward 7 frames](https://visualgo.net/img/nextFrame.png)+7

![>](https://visualgo.net/img/arrow_black_right.png)

![>](https://visualgo.net/img/arrow_white_right.png)

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![play](https://visualgo.net/img/play.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

R1101120324255627108191m=100112031425362718190m=100000000000

slide 1 (3%)

✍

✘

A Binary Indexed (Fenwick) Tree is a data structure that provides efficient methods for implementing **dynamic cumulative frequency tables**.

This Fenwick Tree data structure uses many [bit manipulation techniques](https://visualgo.net/en/bitmask). In this visualization, we will refer to this data structure using the term Fenwick Tree (usually abbreviated as 'FT') as the abbreviation 'BIT' of Binary Indexed Tree is usually associated with the usual bit manipulation.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Binary Indexed (Fenwick) Tree   1-1. Cumulative Frequency Table   1-2. Range Sum Query: rsq(i, j)   1-3. Dynamic Cumulative Frequency Table2\. Modes and the First/Default Mode3\. Point Update Range Query (PU RQ)   3-1. The Visualization - Part 1   3-2. The Visualization - Part 2   3-3. The Visualization - Part 3   3-4. Example: ft\[4\] = rsq(1, 4)   3-5. Example: ft\[6\] = rsq(5, 6)   3-6. Range Query: rsq(j)   3-7. Example: rsq(6) = ft\[6\]+ft\[4\]   3-8. Range Query: rsq(i, j)   3-9. Example: rsq(4, 6) = rsq(6) - ...   3-10. Example: rsq(4, 6) = rsq(6) - rsq(3)   3-11. Example: rsq(4, 6) = 7 - 1 = 6   3-12. Point Update: update(i, v)4\. Second Mode5\. Range Update Point Query (RU PQ)   5-1. The RU PQ Visualization6\. Third Mode7\. Range Update Range Query (RU RQ)   7-1. The RU RQ Visualization8\. Extras   8-1. Implementation

Suppose that we have a _multiset_ of _integers_ **s = {2,4,5,6,5,6,8,6,7,9,7}** (not necessarily sorted). There are **n = 11** elements in **s**. Also suppose that the largest integer that we will ever use is **m = 10** and we never use integer 0. For example, these integers represent student (integer) scores from \[1..10\]. Notice that **n** is independent of **m**.

We can create a frequency table **f** from **s** with a trivial **O(n)** time loop (recall the first counting pass of [counting sort](https://visualgo.net/en/sorting?slide=15)). We can then create cumulative frequency table **cf** from frequency table **f** in **O(m)** time using technique similar to DP 1D prefix sum, e.g., in the table below, **cf\[5\] = cf\[4\]+f\[5\] = 2+2 = 4** and afterwards **cf\[6\] = cf\[5\]+f\[6\] = 4+3 = 7**.

| Index/Score/Symbol | Frequency **f** | Cumulative Frequency **cf** |
| --- | --- | --- |
| 0 | - | \- (index 0 is ignored) |
| 1 | 0 | 0 |
| 2 | 1 | 1 |
| 3 | 0 | 1 |
| 4 | 1 | 2 |
| 5 | 2 | 4 == **cf\[4\]+f\[5\]** |
| 6 | 3 | 7 == **cf\[5\]+f\[6\]** |
| 7 | 2 | 9 |
| 8 | 1 | 10 |
| 9 | 1 | 11 |
| 10 == **m** | 0 | 11 == **n** |

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

With such cumulative frequency table **cf**, we can perform **Range Sum Query: rsq(i, j)** to return the sum of frequencies between index **i** and **j** (inclusive), in efficient **O(1)** time, again using the DP 1D prefix sum (i.e., the inclusion-exclusion principle). For example, **rsq(5, 9) = rsq(1, 9) - rsq(1, 4) = 11-2 = 9**. As these keys: 5, 6, 7, 8, and 9 represent scores, **rsq(5, 9)** means the total number of students (9) who scored between 5 to 9, inclusive.

| Index/Score/Symbol | Frequency **f** | Cumulative Frequency **cf** |
| --- | --- | --- |
| 0 | - | \- (index 0 is ignored) |
| 1 | 0 | 0 |
| 2 | 1 | 1 |
| 3 | 0 | 1 |
| 4 | 1 | 2 == **rsq(1, 4)** |
| 5 | 2 | 4 |
| 6 | 3 | 7 |
| 7 | 2 | 9 |
| 8 | 1 | 10 |
| 9 | 1 | 11 == **rsq(1, 9)** |
| 10 == **m** | 0 | 11 == **n** |

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

A dynamic data structure need to support (frequent) updates in between queries. For example, we may update (add) the frequency of score **7** from 2 → 5 (e.g., 3 more students score 7) and update (subtract) the frequency of score **9** from 1 → 0 (e.g., 1 student who previously scored 9 is found to have plagiarized the work and is now penalized to 0, i.e., removed from the scores), thereby updating the table into:

| Index/Score/Symbol | Frequency **f** | Cumulative Frequency **cf** |
| --- | --- | --- |
| 0 | - | \- (index 0 is ignored) |
| 1 | 0 | 0 |
| 2 | 1 | 1 |
| 3 | 0 | 1 |
| 4 | 1 | 2 |
| 5 | 2 | 4 |
| 6 | 3 | 7 |
| 7 | 2 → 5 | 9 → 12 |
| 8 | 1 | 10 → 13 |
| 9 | 1 → 0 | 11 → 13 |
| 10 == **m** | 0 | 11 → 13 == **n** |

A pure array based data structure for implementing this dynamic cumulative frequency table will need **O(m)** per update operation. Can we do better?

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

Introducing: Fenwick Tree data structure.

There are three mode of usages of Fenwick Tree in this visualization.

The first mode is the default Fenwick Tree that can handle both **Point Update (PU)** and **Range Query (RQ)** in O(log **m**) where **m** is the largest (integer) index/key in the data structure. Remember that the actual number of keys in the data structure is denoted by another variable **n**. We abbreviate this default type as **PU RQ** that simply stands for **Point Update Range Query**.

This clever arrangement of integer keys idea is the one that originally appears in [Peter M. Fenwick's 1994 paper](https://onlinelibrary.wiley.com/doi/abs/10.1002/spe.4380240306).

←

→

🕑

You can click the ' **Create**' menu to create a frequency array **f** where **f\[i\]** denotes the frequency of appearance of key **i** in our original array of keys **s**.

IMPORTANT: This frequency array **f** is not the original array of keys **s**. For example, if you enter {0,1,0,1,2,3,2,1,1,0}, it means that you are creating 0 one, 1 two, 0 three, 1 four, 2 fives, ..., 0 ten (1-based indexing). The largest index/integer key is **m = 10** in this example as in the earlier slides.

If you have the original array **s** of **n** elements, e.g., {2,4,5,6,5,6,8,6,7,9,7} from the earlier slides ( **s** does not need to be necessarily sorted), you can do an O( **n**) pass to convert **s** into frequency table **f** of **m** indices/integer keys. ( _We will provide this alternative input method in the near future_).

You can click the ' **Randomize**' button to generate random frequencies of **m** keys.

Click ' **Go**' to iteratively call **n** operations of **update(i, f\[i\])**. ( _We will provide a faster build FT feature in the near future_).

←

→

🕑

Although conceptually this data structure is a **tree**, it will be implemented as an integer **array** called **ft** that ranges from index 1 to index **m** (we sacrifice index 0 of our **ft** array). The values inside the (black outline and white inner) vertices of the Fenwick Tree shown above are the values stored in the 1-based Fenwick Tree **ft** array.

Currently the edges of this Fenwick Tree are not shown yet. There are two versions of the tree, the interrogation/query tree and the updating Tree.

←

→

🕑

The values inside the bottom (blue inner) vertices are the values of the frequency array **f**.

←

→

🕑

The value stored in index **i** in array **ft** (vertex **i** in the Fenwick Tree), i.e., **ft\[i\]** is the cumulative frequency of keys in range **\[i-LSOne(i)+1 .. i\]**. Visually, this range is shown by the edges of the (interrogation/query version of) Fenwick Tree.

For a review of **LSOne(i) = (i) & -(i)** operation, see [our bitmask visualization page](https://visualgo.net/en/bitmask).

←

→

🕑

**ft\[4\] = 2** stores the cumulative frequency of keys in **\[4-LSOne(4)+1 .. 4\]**.

(follow the edge from index 4 back upwards to index 0, plus 1 index).

This is **\[4-4+1 .. 4\] = \[1 .. 4\]** and **f\[1\]+f\[2\]+f\[3\]+f\[4\] = 0+1+0+1 = 2**.

←

→

🕑

**ft\[6\] = 5** stores the cumulative frequency of keys in **\[6-LSOne(6)+1 .. 6\]**.

(follow the edge from index 6 back upwards to index 4, plus 1 index).

This is **\[6-2+1 .. 6\] = \[5 .. 6\]** and **f\[5\]+f\[6\] = 2+3 = 5**.

←

→

🕑

The function **rsq(j)** returns the cumulative frequencies from the first index 1 (ignoring index 0) to index **j**.

This value is the sum of sub-frequencies stored in array **ft** with indices related to **j** via this formula **j' = j-LSOne(j)**. This relationship forms a Fenwick Tree, specifically, the 'interrogation tree' of Fenwick Tree.

We apply this formula iteratively until **j** is 0.

This function runs is O(log **m**), regardless of **n**. Discussion: Why?

←

→

🕑

We have seen earlier that ft\[6\] = rsq(5, 6) and ft\[4\] = rsq(1, 4).

Thus, rsq(6) = ft\[6\] + ft\[6-LSOne(6)\] = ft\[6\] + ft\[6-2\] =

ft\[6\] + ft\[4\] = 5 + 2 = 7.

PS: 4-LSOne(4) = 4-4 = 0.

←

→

🕑

**rsq(i, j)** returns the cumulative frequencies from index **i** to **j**, inclusive.

If **i = 1**, we can just use **rsq(j)** as earlier.

If **i > 1**, we simply need to return: **rsq(j) – rsq(i–1)** (Principle of Inclusion-Exclusion).

Discussion: Do you understand the reason?

This function also runs in O(log **m**), regardless of **n**. Discussion: Why?

←

→

🕑

rsq(4, 6) = **rsq(6)** – \[next slide...\].

And we have seen earlier that **rsq(6)** = ft\[6\]+ft\[4\] = 5+2 = 7.

←

→

🕑

rsq(4, 6) = rsq(6) – **rsq(3)**.

We can compute similarly that **rsq(3)** = ft\[3\]+ft\[2\] = 0+1 = 1.

←

→

🕑

rsq(4, 6) = rsq(6) – rsq(3) = 7 - 1 = 6.

←

→

🕑

To update the frequency of a key (an index) **i** by **v** ( **v** is either positive or negative; **\|v\|** does not necessarily be one), we use **update(i, v)**.

Indices that are related to **i** via **i' = i+LSOne(i)** will be updated by **v** when **i** < **ft.size()** (Note that **ft.size()** is **m+1** (as we ignore index 0). These relationships form a variant of Fenwick Tree structure called the 'updating tree'.

Discussion: Do you understand this operation and on why we avoided index 0?

This function also runs in O(log **m**), regardless of **n**. Discussion: Why?

←

→

🕑

The second mode of Fenwick Tree is the one that can handle **Range Update (RU)** but only able to handle **Point Query (PQ)** in O(log **n**).

We abbreviate this type as **RU PQ**.

←

→

🕑

Create the data and try running the **Range Update** or **Point Query** algorithms on it. Creating the data for this type means inserting several intervals. For example, if you enter \[2,4\],\[3,5\], it means that we are updating range 2 to 4 by +1 and then updating range 3 to 5 by +1, thus we have the following frequency table: 0,1,2,2,1 that means 0 one, 1 two, 2 threes, 2 fours, 1 five.

←

→

🕑

The vertices at the top shows the values stored in the Fenwick Tree (the **ft** array).

The vertices at the bottom shows the values of the data (the frequency table **f**).

Notice the clever modification of Fenwick Tree used in this RU PQ type: We increase the start of the range by +1 but decrease one index after the end of the range by -1 to achieve this result.

←

→

🕑

The third mode of Fenwick Tree is the one that can handle both **Range Update (RU)** and **Range Query (RQ)** in O(log **n**), making this type on par with **[Segment Tree with Lazy Update](https://visualgo.net/en/segmenttree)** that can also do RU RQ in O(log **n**).

←

→

🕑

Create the data and try running the **Range Update** or **Range Query** algorithms on it.

Creating the data is inserting several intervals, similar as RU PQ version. But this time, you can also do Range Query efficiently.

←

→

🕑

In Range Update Range Query Fenwick Tree, we need to have two Fenwick Trees. The vertices at the top shows the values of the first Fenwick Tree (BIT1\[\] array), the vertices at the middle shows the values of the second Fenwick Tree (BIT2\[\] array), while the vertices at the bottom shows the values of the data (the frequency table). The first Fenwick Tree behaves the same as in RU PQ version. The second Fenwick Tree is used to do clever offset to allow Range Query again.

←

→

🕑

We have a few more extra stuffs involving this data structure.

←

→

🕑

Unfortunately, this data structure is not yet available in C++ STL, Java API, Python or OCaml Standard Library as of 2020. Therefore, we have to write our own implementation.

Please look at the following C++/Python/Java/OCaml implementations of this Fenwick Tree data structure in Object-Oriented Programming (OOP) fashion:

[fenwicktree\_ds.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/fenwicktree_ds.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/fenwicktree_ds.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/fenwicktree_ds.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/ourown/fenwicktree_ds.ml)

Again, you are free to customize this custom library implementation to suit your needs.

* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

Create - O( **m** log **m**)

Create - O( **m**)

RSQ(i, j)

Update(i, v)

>

multiset s =

Go

or f


arr


arr


=

Randomize f

Go

multiset s =

Go

or f


arr


arr


=

Randomize f

Go

i =

j =

Go

i =

Go

L =

R =

Go

i =

v =

Go

L =

R =

delta =

L =

R =

delta =

Go

Go

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/fenwicktree)

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