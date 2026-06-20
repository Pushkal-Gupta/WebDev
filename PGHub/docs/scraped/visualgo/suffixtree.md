---
source_url: "https://visualgo.net/en/suffixtree"
title: "Suffix Tree - VisuAlgo"
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

87531640211111111111

$A$CA$GACA$TAGACA$CA$GACA$TAGACA$TAGACA$

slide 1 (7%)

✍

✘

A **Suffix Tree** is a compressed tree containing all the suffixes of the given (usually long) text string **T** of length **n** characters ( **n** can be on order of hundred thousands of characters).

The positions of each suffix in the text string **T** are recorded as integer indices at the leaves of the Suffix Tree whereas the path labels (concatenation of edge labels starting from the root) of the leaves describe the suffixes.

Suffix Tree provides a particularly fast implementation for many important (long) string operations.

This data structure is very related to the [Suffix Array](https://visualgo.net/en/suffixarray) data structure. Both data structures are usually studied together.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Suffix Tree   1-1. Suffix of a String T2\. Suffix Tree Visualization   2-1. Example with T = "GATAGACA$"   2-2. Terminating Symbol $   2-3. Suffix Tree has O(n) Vertices   2-4. Much Shorter Suffix Tree3\. Available Operations   3-1. Build Suffix Tree (instant)   3-2. Search   3-3. Longest Repeated Substring (LRS)   3-4. Longest Common Substring (LCS)4\. Extras

The suffix **i** (or the **i**-th suffix) of a (usually long) text string **T** is a 'special case' of substring that goes from the **i**-th character of the string up to its _last_ character.

For example, if **T** = "STEVEN$", then suffix 0 of **T** is "STEVEN$" (0-based indexing), suffix 2 of **T** is "EVEN$", suffix 4 of **T** is "EN$", etc.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

The visualization of Suffix Tree of a string **T** is basically a rooted tree where path label (concatenation of edge label(s)) from root to each leaf describes a suffix of **T**. Each leaf vertex is a suffix and the integer value written inside the leaf vertex (we ensure this property with terminating symbol $) is the suffix number.

An internal vertex will branch to more than one child vertex, therefore there are more than one suffix from the root to the leaves via this internal vertex. The path label of an internal vertex is a common prefix among those suffix(es).

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

The Suffix Tree above is built from string **T** = "GATAGACA$" that have these 9 suffixes:

| **i** | **Suffix** |
| --- | --- |
| 0 | GATAGACA$ |
| 1 | ATAGACA$ |
| 2 | TAGACA$ |
| 3 | AGACA$ |
| 4 | GACA$ |
| 5 | ACA$ |
| 6 | CA$ |
| 7 | A$ |
| 8 | $ |

Now verify that the path labels of suffix 7/6/2 are "A$"/"CA$"/"TAGACA$", respectively (there are 6 other suffixes). The internal vertices with path label "A"/"GA" branch out to 4 suffixes {7, 5, 3, 1}/2 suffixes {4, 0}, respectively. Root vertex branches out to all 9 suffixes.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

In order to ensure that every suffix of the input string **T** ends in a leaf vertex, we enforce that string **T** ends with a special terminating symbol '$' that is not used in the original string **T** and has ASCII value lower than the lowest allowable character in **T** (which is character 'A' in this visualization). This way, edge label '$' always appears at the leftmost edge of the root vertex of this Suffix Tree visualization.

For the Suffix Tree example above (for **T** = "GATAGACA$"), if we do not have terminating symbol '$', notice that suffix 7 "A" (without the '$') does NOT end in a leaf vertex and can complicate some operations later.

←

→

🕑

As we have ensured that all suffixes end at a leaf vertex, there are _at most_ **n** leaves/suffixes in a Suffix Tree. All internal vertices (including the root vertex if it is an internal vertex) are always branching thus there can be at most **n**-1 such vertices, as shown with one of the extreme test case on the right.

The maximum number of vertices in a Suffix Tree is thus = **n** (leaves) + ( **n**-1) internal vertices = **2n**-1 ∈ O( **n**) vertices. As Suffix Tree is a tree, the maximum number of edges in a Suffix Tree is also ( **2n**-1)-1 ∈ O( **n**) edges.

←

→

🕑

When all the characters in string **T** is all distinct (e.g., **T** = "ABCDE$"), we can have the following very short Suffix Tree with exactly **n** +1 vertices (+1 due to root vertex).

←

→

🕑

All available operations on the Suffix Tree in this visualization are listed below:

1. **Build Suffix Tree (instant/details omitted)** — instantly build the Suffix Tree from string **T**.
2. **Search** — Find the vertex in Suffix Tree of a (usually longer) string **T** that has path label containing the (usually (much) shorter) pattern/search string **P**.
3. **Longest Repeated Substring (LRS)** — Find the deepest (the one that has the longest path label) internal vertex (as that vertex shares common prefix between two (or more) suffixes of **T**).
4. **Longest Common Substring (LCS)** — Find the deepest internal vertex that contains suffixes from two different original strings.

There are a few other possible operations of Suffix Tree that are not included in this visualization.

←

→

🕑

In this visualization, we only show the fully constructed Suffix Tree _without describing the details of the O( **n**) Suffix Tree construction algorithm_ — it is a bit too complicated. Interested readers can explore [this](https://en.wikipedia.org/wiki/Ukkonen%27s_algorithm) instead.

We limit the input to only accept up to 25 (cannot be too long due to the available drawing space — but in the real application of Suffix Tree, **n** can be in order of hundred thousand to million characters) ASCII (or even Unicode) characters. If you do not write a terminating symbol '$' at the back of your input string, we will automatically do so. If you place character '$' in the middle of the input string, it will be ignored. And if you enter an empty input string, we will resort to the default "GATAGACA$".

For convenience, we provide a few classic test case input strings usually found in Suffix Tree/Array lectures, but to showcase the strength of this visualization tool, you are encouraged to enter any up-to-25-characters string of your choice (ending with character '$'). You can use Chinese characters, e.g., "四是四十是十十四不是四十四十不是十四$".

←

→

🕑

Assuming that the Suffix Tree of a (usually longer) string **T** (of length **n**) has been built, we want to find all occurrences of pattern/search string **P** (of length **m**).

To do this, we search for the vertex **x** in the suffix Tree of **T** which has path label (concatenation of edge label(s) from the root to **x**) where **P** is the prefix of that path label. Once we find this vertex **x**, all the leaves in the subtree rooted at **x** are the occurrences.

Time complexity: O( **m+k**) where **k** is the total number of occurrences.

For example, on the Suffix Tree of **T** = "GATAGACA$" above, try these scenarios:

1. **P** is a full match with the path label of vertex **x**:

Search("A"), occurrences = {7, 5, 3, 1} or Search("GA"), occurrences = {4, 0}
2. **P** is a partial match with the path label of vertex **x**:

Search("T"), occurrences = {2} or Search("GAT"), occurrences = {0}
3. **P** is not found in **T**:

Search("WALDO"), occurrences = {NIL}

←

→

🕑

Assuming that the Suffix Tree of a (usually longer) string **T** (of length **n**) has been built, we can find the Longest Repeated Substring (LRS) in **T** by simply finding the deepest (the one that has the longest path label) internal vertex of the Suffix Tree of **T**.

This is because each internal vertex of the Suffix Tree of **T** branches out to at least two (or more) suffixes, i.e., the path label (common prefix of these suffixes) are **repeated**.

The deepest (the one that has the longest path label) internal vertex is the required answer, which can be found in O( **n**) with a simple tree traversal.

Without further ado, try LRS("GATAGACA$"). We have LRS = "GA".

It is possible that **T** contains more than one LRS, e.g., try LRS("BANANABAN$").

We have LRS = "ANA" (actually overlap) or "BAN" (without overlap).

←

→

🕑

This time, we need two input strings **T1** and **T2** that terminate with symbol '$'/'#', respectively. We then create the **generalized** Suffix Tree of these two strings **T1+T2** in O( **n**) where **n = n1+n2** (sum of the length of the two strings). We can find the Longest Common Substring (LCS) of those two strings **T1** and **T2** by simply finding the deepest **and valid** internal vertex of the generalized Suffix Tree of **T1+T2**.

To be a valid internal vertex for consideration as an LCS candidate, an internal vertex must represents suffixes from **both strings**, i.e., a **common** substring found in both **T1** and **T2**.

Then, since an internal vertex of the Suffix Tree of **T** branches out to at least two (or more) suffixes, i.e., the path label (common prefix of these suffixes) are **repeated**. If that internal vertex is also a valid internal vertex, then it is a **common** substring that is **repeated**.

The valid and deepest (the one that has the longest path label) internal vertex is the required answer, which can be found in O( **n**) with a simple tree traversal.

Without further ado, try LCS(T1,T2) on the generalized Suffix Tree of string **T1** = "GATAGACA$" and **T2** = "CATA#" (notice that the UI will change to generalized Suffix Tree version). We have LCS = "ATA".

←

→

🕑

There are a few other things that we can do with Suffix Tree like "Finding Longest Repeated Substring without overlap", "Finding Longest Common Substring of ≥ 2 strings", etc, but we will keep that for later.

We will continue the discussion of this String-specific data structure with the more versatile to [Suffix Array](https://visualgo.net/en/suffixarray) data structure.

* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

Build Suffix Tree

Search

Longest Repeated Substring

Longest Common Substring

>

GATAGACA$

BANANABAN$

MISSISSIPPI$

ABRACADABRA$

RATATAT$

AAAAAAA$

ABCDE$

AABBCC$

你問我愛你有多深 我愛你有幾分$

四是四 Tongue Twister

T =

Go

P =

Go

T1 =

T2 =

Go

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/suffixtree)

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