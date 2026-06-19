---
source_url: "https://visualgo.net/en/bitmask"
title: "Bitmask (Bit Manipulation) - VisuAlgo"
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

543210I0II00000000000000 = indices= S = 44= mask

slide 1 (10%)

✍

✘

Bitmask provide an efficient way to manipulate a small set of Booleans that is stored as a 32-(or 64-)bit signed integer in base-10 but interpreted as a short 32-(or 64-) characters string.

By using bitwise operations, each bit of the integer can be checked, turned on (or turned off) easily and quickly. It can be used in various algorithms such as the [Dynamic Programming solution for Travelling Salesperson Problem](https://visualgo.net/en/tsp) to speed up crucial (small) set-based operations.

* * *

**Remarks**: By default, we show e-Lecture Mode for first time (or non logged-in) visitor.

If you are an NUS student and a repeat visitor, please [login](https://visualgo.net/login).

→

🕑

1\. Bitmask2\. Visualisation3\. Bitmask Operations   3-1. Set S   3-2. Set j-th Bit   3-3. Check j-th Bit   3-4. Clear j-th Bit   3-5. Toggle j-th Bit   3-6. Least Significant One4\. Challenges

The visualisation of a bitmask data structure and its operations are shown above.

The top row describes the indices of the bits of the input integer **S** starting from the 0-th bit as the rightmost bit. Note that we use 1-digit hexadecimal notation of A/B/../E for the 10/11/../14-th bit.

The second row describes the bits of the input integer **S**. In practical applications, this is usually a 32-bit signed integer (e.g., `int` in C++/most other programming languages in 2023). Sometimes, this is a 64-bit signed integer (e.g., `long long` in C++). For this visualization, we limit **S** to 16-bit signed integer.

The third row describes the bits of the **(bit)mask** that will be applied to **S** together with the associated bitwise operation.

The last row describes **the result**.

* * *

Pro-tip 1: Since you are not [logged-in](https://visualgo.net/login), you may be a first time visitor (or not an NUS student) who are not aware of the following keyboard shortcuts to navigate this e-Lecture mode: **\[PageDown\]**/ **\[PageUp\]** to go to the next/previous slide, respectively, (and if the drop-down box is highlighted, you can also use **\[→ or ↓/← or ↑\]** to do the same),and **\[Esc\]** to toggle between this e-Lecture mode and exploration mode.

←

→

🕑

In this visualization, we currently support 6 Bitmask operations (all run in O(1)):

1. Set S (several ways)
2. Set j-th Bit
3. Check j-th Bit
4. Clear j-th Bit
5. Toggle j-th Bit
6. Least Significant Bit

* * *

Pro-tip 2: We designed this visualization and this e-Lecture mode to look good on 1366x768 resolution **or larger** (typical modern laptop resolution in 2021). We recommend using Google Chrome to access VisuAlgo. Go to full screen mode ( **F11**) to enjoy this setup. However, you can use zoom-in ( **Ctrl +**) or zoom-out ( **Ctrl -**) to calibrate this.

←

→

🕑

We can enter a (small) Integer between \[0..32767 (215-1)\] in Decimal (base-10) and the Binary (base-2) form of **S** will be visualized.

Alternatively, we can select any random Integer between the same range \[0..32767\], a random powers of 2 (with specific pattern of '10...0'), or a random powers of 2 minus 1 (with specific pattern of '11...1').

* * *

Pro-tip 3: Other than using the typical media UI at the bottom of the page, you can also control the animation playback using keyboard shortcuts (in Exploration Mode): **Spacebar** to play/pause/replay the animation, **←**/ **→** to step the animation backwards/forwards, respectively, and **-**/ **+** to decrease/increase the animation speed, respectively.

←

→

🕑

We can enter the index of the j-th Bit of S to be set (turned on).

Note that index starts from 0 but counted from the rightmost bit (refer to the top row).

The bitwise operation is simple: **S OR (1 << j)**.

Setting a bit that is already on will not change anything.

←

→

🕑

We can enter the index of the j-th Bit of S to be checked (on whether it is on or off).

Note that index starts from 0 but counted from the rightmost bit (refer to the top row).

The bitwise operation is simple: **S AND (1 << j)**.

←

→

🕑

We can enter the index of the j-th Bit of S to be cleared (turned off).

Note that index starts from 0 but counted from the rightmost bit (refer to the top row).

The bitwise operation is simple: **S AND ~(1 << j)**.

Clearing a bit that is already off will not change anything.

←

→

🕑

We can enter the index of the j-th Bit of S to be toggled (on → off or off → on).

Note that index starts from 0 but counted from the rightmost bit (refer to the top row).

The bitwise operation is simple: **S XOR (1 << j)**.

←

→

🕑

This operation requires no input. It is a special operation to quickly identify the rightmost bit that is on in **S**.

The bitwise operation is simple: **S AND (-S)**.

Note that in [Two's complement](https://en.wikipedia.org/wiki/Two%27s_complement), **-S = NOT(S)+1**.

←

→

🕑

For source code example involving bitmask/bit manipulation, please review: [bit\_manipulation.cpp](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/lineards/bit_manipulation.cpp) \| [py](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/lineards/bit_manipulation.py) \| [java](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/lineards/bit_manipulation.java) \| [ml](https://github.com/stevenhalim/cpbook-code/blob/master/ch2/lineards/bit_manipulation.ml).

To test your understanding about bit manipulation, try our [Online Quiz on bitmask topic](https://visualgo.net/training?diff=Medium&n=7&tl=0&module=bitmask).

And for more challenging problems involving bitmask/bit manipulation, try the following online judge problems: [UVa 11933 - Splitting Numbers](http://uva.onlinejudge.org/external/119/11933.pdf) and [Kattis - bitbybit](https://open.kattis.com/problems/bitbybit).

Beyond these simple applications, bitmask frequently used as low-level optimizations in a few advanced algorithms, so get ready when you encounter bitmask as sub-component of the bigger algorithms.

* * *

You have reached the last slide. Return to 'Exploration Mode' to start exploring!

Note that if you notice any bug in this visualization or if you want to request for a new visualization feature, do not hesitate to drop an email to the project leader: Dr Steven Halim via his email address: stevenhalim at gmail dot com.

←

🕑

X Close

Please rotate your device to landscape mode for a better user experience

Please make the window wider for a better user experience

Increment

Set S

Set j-th Bit

Check j-th Bit

Clear j-th Bit

Toggle j-th Bit

Least Significant Bit

>

S =

Go

Random

Random 2^N

Random 2^N-1

j =

Go

j =

Go

j =

Go

j =

Go

1.0xShareAboutTeamTerms of usePrivacy Policy [Open in Browser](https://visualgo.net/en/bitmask)

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