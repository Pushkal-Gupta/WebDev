---
source_url: "https://visualgo.net/en/suffixarray"
title: "Suffix Array - VisuAlgo"
scraped_at: 2026-06-18
---

- [Profile](https://visualgo.net/profile)
- [Training](https://visualgo.net/training)
- [Tests](https://visualgo.net/tests)
- [Log Out](https://visualgo.net/logout)

-7![rewind 7 frames](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![replay](https://visualgo.net/img/replay.png)![forward 7 frames](https://visualgo.net/img/nextFrame.png)+7

![>](https://visualgo.net/img/arrow_white_right.png)

![>](https://visualgo.net/img/arrow_white_right.png)

1x

![go to beginning](https://visualgo.net/img/goToBeginning.png)![previous frame](https://visualgo.net/img/prevFrame.png)![pause](https://visualgo.net/img/pause.png)![replay](https://visualgo.net/img/replay.png)![next frame](https://visualgo.net/img/nextFrame.png)![go to end](https://visualgo.net/img/goToEnd.png)

iSA\[i\]LCP\[i\]Suffix T\[SA\[i\]:\]070$150AT$232ATAT$314ATATAT$400RATATAT$560T$641TAT$723TATAT$

slide 1 (8%)

✍

✘

**Suffix Array** is a sorted array of all suffixes of a given (usually long) text string **T** of length **n** characters ( **n** can be in order of hundred thousands characters).

Suffix Array is a simple, yet powerful data structure which is used, among others, in full text indices, data compression algorithms, and within the field of bioinformatics.

This data structure is very related to the [Suffix Tree](https://visualgo.net/en/suffixtree) data structure. Both data structures are usually studied together.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Suffix Array2\. Suffix Array Visualization3\. Available Operations   3-1. Construct Suffix Array - UI   3-2. The Prefix Doubling Algorithm   3-3. Search   3-4. Longest Common Prefix (LCP) - Part 1   3-5. Longest Common Prefix (LCP) - Part 2   3-6. Longest Common Prefix (LCP) - Part 3   3-7. Longest Repeated Substring (LRS)   3-8. Longest Common Substring (LCS)4\. Implementation

The visualization of Suffix Array is simply a table where each row represents a suffix and each column represents the attributes of the suffixes.

The four (basic) attributes of each row **i** are:

1. index i, ranging from 0 to **n**-1,
2. SA\[i\] is the i-th lexicographically smallest suffix of **T** is the SA\[i\]-th suffix

The SA values (permutation of \[0.. **n**-1\]) is the one that we need to compute _fast_,
3. LCP\[i\] is the Longest Common Prefix between the i-th and the (i-1)-th lexicographically smallest suffixes of **T** is LCP\[i\]

The LCP values also need to be computed _fast_ and we will see the application of this attribute soon, and
4. Suffix T\[SA\[i\]:\] is the i-th lexicographically smallest suffix of **T** is from index SA\[i\] to the end (index **n**-1)

We do _not_ actually compute these suffixes (it is very slow to do so) and these sorted suffixes are only in this visualization to aid quick understanding of the Suffix Array (and LCP) algorithms.

Some operations may add more attributes to each row and are explained when that operations are discussed.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

All available operations on the Suffix Array are listed below.

1. **Construct Suffix Array (SA)** is the O( **n** log **n**) Suffix Array construction algorithm based on the idea by Karp, Miller, & Rosenberg (1972) that sort prefixes of the suffix in increasing length (1, 2, 4, 8, ...).
2. **Search** utilizes the fact that the suffixes in Suffix Array are sorted and call two binary searches in O( **m** log **n**) to find the first and the last occurrence(s) of pattern string **P** of length **m**.
3. **Longest Common Prefix (LCP)** between two adjacent suffixes (excluding the first suffix) can be computed in O( **n**) using the Permuted LCP (PLCP) theorem. The name of this algorithm is Kasai's algorithm.
4. **Longest Repeated Substring (LRS)** is a simple O( **n**) algorithm that finds the suffix with the highest LCP value.
5. **Longest Common Substring (LCS)** is a simple O( **n**) algorithm that finds the suffix with the highest LCP value that comes from two different strings.

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

In this visualization, we show the proper O( **n log n**) construction of Suffix Array based on the idea of Karp, Miller, & Rosenberg (1972) that sort prefixes of the suffix in increasing length (1, 2, 4, 8, ...), a.k.a. the prefix doubling algorithm.

We limit the input to only accept up to 12 (cannot be too long due to the available drawing space — but in the real application of Suffix Tree, **n** can be in order of hundred thousand to million characters) UPPERCASE (we delete your lowercase input) alphabet and the special terminating symbol '$' characters (i.e., \[A-Z$\]). If you do not write a terminating symbol '$' at the back of your input string, we will automatically do so. If you place character '$' in the middle of the input string, it will be ignored. And if you enter an empty input string, we will resort to the default "GATAGACA$".

For convenience, we provide a few classic test case input strings usually found in Suffix Tree/Array lectures, but to showcase the strength of this visualization tool, you are encouraged to enter any up-to-12-characters string of your choice (ending with '$').

Note that the LCP Array column remains empty in this operation. They are to be computed separately via the Longest Common Prefix operation.

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

This Prefix Doubling Algorithm runs in O( **log n**) iterations, where for each iteration, it compares substring T\[SA\[i\]:SA\[i+k\]\] with T\[SA\[i+k\]:SA\[i+2\*k\]\], i.e., in layman's terms: first compare two pairs of characters, then compare first two characters with the next two, then compare the first four characters with the next four, and so on.

This algorithm is best explored via visualization, see ConstructSA("GATAGACA$") in action (it is advisable that you exit this e-Lecture mode, run the algorithm in exploration mode, pause the algorithm and replay it frame-by-frame as there are too many elements changing especially during the first sorting iteration).

Time complexity: There are O( **log n**) prefix doubling iterations, and each iteration we call O( **n**) Radix Sort, thus it runs in O( **n log n**) — good enough to handle up to **n ≤ 200K** characters in typical programming competition problems involving long strings.

←

→

🕑

After we construct the Suffix Array of **T** in O( **n log n**), we can search for the occurrence of Pattern string **P** in O( **m log n**) by binary searching the sorted suffixes to find the lower bound (the first occurrence of **P** as a prefix of any suffix of **T**) and the upper bound positions (the last occurrence of **P** as a prefix of any suffix of **T**).

Time complexity: O( **m log n**) and it will return an interval of size **k** where **k** is the total number of occurrences.

For example, on the Suffix Array of **T** = "GATAGACA$" above, try these scenarios:

1. **P** returns a range of rows: Search("GA"), occurrences = {4, 0}
2. **P** returns one row only: Search("CA"), occurrences = {2}
3. **P** is not found in **T**: Search("WONKA"), occurrences = {NIL}

PS: There is a slightly faster O( **m+log n**) variant that has not been visualized yet.

←

→

🕑

We can compute the Longest Common Prefix (LCP) of two adjacent suffixes (in Suffix Array order) in O(n) time using three phases of Kasai's algorithm. This algorithm takes advantage that if we have a long LCP between two adjacent suffixes (in Suffix Array order), that long LCP has lots of overlap with another suffix in positional order when its first character is removed.

The first phase: Compute the value of Phi\[\], where Phi\[SA\[i\]\] = SA\[i-1\] in O( **n**). This is to help the algorithm knows in O( **1**) time of which Suffix is behind Suffix-SA\[i\] in Suffix Array order. Try LCP("GATAGACA$") and focus on the first part on filling column Phi\[\] (it is advisable that you exit this e-Lecture mode, run the algorithm in exploration mode, pause the algorithm and replay it frame-by-frame as there are too many elements changing).

←

→

🕑

The second phase: Compute the PLCP\[\] values between a Suffix-i in positional order with Suffix-Phi\[i\] (the one behind Suffix-i in Suffix Array order). When we advance to the next index i+1 in positional order, we will remove the front most character of the suffix, but possibly retain lots of LCP value between Suffix-(i+1) and Suffix-Phi\[(i+1)\].

PLCP Theorem (not proven) shows that the LCP values can only be incremented up to **n** times, and thus can only be decremented at most **n** times too, making the overall complexity of the second phase to be also O( **n**).

Now, retry LCP("GATAGACA$") again and focus on the middle part on filling column PLCP\[\] (again, it is advisable that you exit this e-Lecture mode, run the algorithm in exploration mode, pause the algorithm and replay it frame-by-frame as there are too many elements changing).

←

→

🕑

The third phase: We compute the value of LCP\[\], where LCP\[i\] = PLCP\[SA\[i\]\] in O( **n**). This LCP values are the one that we use for other Suffix Array applications later.

Finally, retry LCP("GATAGACA$") again and focus on the last part on filling column LCP\[\] (as usual, exit this e-Lecture mode, run the algorithm in exploration mode, pause the algorithm and replay it frame-by-frame as there are too many elements changing).

Time complexity: Kasai's algorithm utilizes the PLCP theorem where the total number of increase (and decrease) operations of the value of the LCP is at most O( **n**). Thus Kasai's algorithm runs in O( **n**) overall. Thus, the combination of O( **n log n**) Suffix Array construction (via the Prefix Doubling algorithm) and the O( **n**) computation of LCP Array using this Kasai's algorithm is good enough to handle up to **n ≤ 200K** characters in typical programming competition problems involving long strings.

←

→

🕑

After we construct the Suffix Array of **T** in O( **n log n**) and compute its LCP Array in O( **n**), we can find the Longest Repeated Substring (LRS) in **T** by simply iterating through all LCP values and reporting the largest one.

This is because each value LCP\[i\] the LCP Array means the longest common prefix between two lexicographically adjacent suffixes: Suffix-i and Suffix-(i-1). This corresponds to an internal vertex of the equivalent Suffix Tree of **T** that branches out to at least two (or more) suffixes, thus this common prefix of these adjacent suffixes are **repeated**.

The longest common (repeated) prefix is the required answer, which can be found in O( **n**) by going through the LCP array once.

Without further ado, try LRS("GATAGACA$"). We have LRS = "GA".

It is possible that **T** contains more than one LRS, e.g., try LRS("BANANABAN$").

We have LRS = "ANA" (actually overlap) or "BAN" (without overlap).

←

→

🕑

After we construct the generalized Suffix Array of the concatenation of both strings **T1$T2#** of length **n = n1+n2** in O( **n log n**) and compute its LCP Array in O( **n**), we can find the Longest Common Substring (LCS) in **T** by simply iterating through all LCP values and reporting the largest one that comes from two different strings.

Without further ado, try LCS("GATAGACA$", "CATA#") on the generalized Suffix Array of string **T1** = "GATAGACA$" and **T2** = "CATA#". We have LCS = "ATA".

←

→

🕑

You are allowed to use/modify our implementation code for fast Suffix Array+LCP: [sa\_lcp.cpp \|](https://github.com/stevenhalim/cpbook-code/blob/master/ch6/sa_lcp.cpp) [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch6/sa_lcp.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch6/sa_lcp.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch6/sa_lcp.ml) to solve programming contest problems that need it.

* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

Construct Suffix Array

Search

Longest Common Prefix

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

T =

Go

P =

Go

T1 =

T2 =

Go

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/suffixarray)

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