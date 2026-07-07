---
slug: git-branching-merging
module: git-vcs
title: Branching & Merging
subtitle: Branches as cheap movable pointers, and the two ways Git combines them — a fast-forward that just slides a pointer, and a three-way merge that builds a merge commit from a common ancestor.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 13
prereqs: [git-model-commits]
relatedProblems: []
references:
  - title: "Pro Git — Git Branching: Branches in a Nutshell"
    url: "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell"
    type: article
  - title: "Pro Git — Git Branching: Basic Branching and Merging"
    url: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging"
    type: article
  - title: "GitHub Docs — About merge conflicts"
    url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts"
    type: article
  - title: "GitHub Docs — Resolving a merge conflict using the command line"
    url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line"
    type: article
status: published
---

## intro
A branch in Git is not a copy of your files and not a heavyweight fork of the project — it is a single pointer to one commit, and making one is nearly instant. That cheapness is the reason Git culture revolves around branching: a branch per feature, per bug, per experiment. The interesting question is what happens when you want to bring two branches back together. Git has exactly two answers — a **fast-forward** that just slides a pointer, and a **three-way merge** that creates a new commit — and knowing which one you get, and why, removes most of the mystery from merging.

## whyItMatters
Merging is where teams collide, literally. Two people edit near the same code, both branch off `main`, and integration has to reconcile their work without silently dropping either change. If you understand that Git finds the **common ancestor** and does a three-way comparison, you understand exactly when a merge is clean, when it conflicts, and why the conflict markers look the way they do. You also stop fearing merges: a merge commit is just an ordinary commit with two parents, not a destructive rewrite. Getting this right is the difference between confidently resolving a conflict in a minute and blindly clicking "accept theirs" and shipping a regression — which is why it is a fixture of engineering interviews and code reviews alike.

## intuition
Start from the object model: a branch is a sticky note holding one commit hash, and HEAD marks which branch you are on. `git switch -c feature` writes a new sticky note pointing at your current commit and moves HEAD onto it. Now commit on `feature`, and only that sticky note slides forward; `main` stays exactly where it was. The two branches have **diverged** — they share a common ancestor but each has commits the other does not.

When you merge `feature` back into `main`, Git first asks a simple question: has `main` moved at all since `feature` branched off? If `main` is still sitting on the exact commit that `feature` grew out of, there is nothing to reconcile — `feature` is simply `main` plus some extra commits in a straight line. Git can then do a **fast-forward**: it slides the `main` pointer forward to the tip of `feature`. No new commit is made; the history stays perfectly linear, as if the work had always been on `main`.

But usually `main` has moved too — someone else merged a fix while you were working. Now both branches have new commits since they split, and no pointer-slide can capture both sets of changes. Git performs a **three-way merge**. The "three" are the two branch tips plus their **merge base**, the most recent commit they both descend from. Git compares each branch tip against that shared base: any file changed on only one side is taken as-is; a file changed on both sides is combined line by line. If the two sides touched different lines, Git merges them automatically. If they changed the *same* lines in incompatible ways, Git cannot guess — it marks a **conflict** and asks you to decide. Either way the result is captured in a new **merge commit** with *two* parents, one on each branch, permanently recording that these two lines of history joined here.

## visualization
```
 Fast-forward (main never moved since feature split):

   before:   A---B---C   (main, and where feature started)
                      \
                       D---E   (feature)

   git switch main && git merge feature
   after:    A---B---C---D---E   (main == feature)   <- pointer just slid, no new commit


 Three-way merge (both branches advanced):

   before:   A---B---C---F   (main)        merge base = B
                  \
                   D---E      (feature)

   git switch main && git merge feature
   after:    A---B---C---F---M   (main)     M has TWO parents: F and E
                  \         /
                   D---E---'   (feature)

   conflict marker in a file both sides changed:
   <<<<<<< HEAD        (main's version)
   theirs vs
   =======
   ours line          (feature's version)
   >>>>>>> feature
```

## bruteForce
The clumsy way to combine two lines of work is to eyeball both and hand-copy changes from one into the other — open `feature`'s files, read `main`'s files side by side, and paste in what looks new. It fails constantly: you miss a change buried in a file you did not think to open, you cannot tell whether a line differs because *you* added it or because the *other* side deleted the surrounding block, and you have no record afterward of what was combined or why. Two-way comparison simply lacks the information to decide who changed what — you need the original both sides started from. That missing third input is exactly what a three-way merge supplies.

## optimal
Creating and switching branches is cheap because it only writes and moves refs:

```bash
git switch -c feature      # create 'feature' at HEAD and switch onto it
# ...edit, git add, git commit...  (feature advances; main does not)
git switch main            # HEAD now points at main again
git merge feature          # integrate feature into main
```

What `git merge` does depends on the graph. If `main` is an **ancestor** of `feature` (main never moved), Git fast-forwards: it slides `main` to `feature`'s tip and stops. History stays linear and no merge commit appears. If both branches advanced, Git runs a **three-way merge** using the merge base — the commit `git merge-base main feature` reports. It diffs base-to-main and base-to-feature; non-overlapping changes are combined automatically and a **merge commit** with two parents is written. Overlapping edits to the same lines produce a **conflict**: Git pauses the merge, writes both versions into the file between `<<<<<<<`, `=======`, and `>>>>>>>` markers, and lists the file under "Unmerged paths."

Resolving is mechanical once you know the shape:

```bash
git merge feature
# CONFLICT (content): Merge conflict in src/app.js
git status                 # shows 'Unmerged paths'
# edit src/app.js: pick the correct combined result, delete ALL conflict markers
git add src/app.js         # mark this file resolved
git commit                 # finish the merge commit (message is pre-filled)
# or, to bail out entirely and return to the pre-merge state:
git merge --abort
```

Two policy choices matter. First, you can force a merge commit even when a fast-forward is possible with `git merge --no-ff feature`; teams do this so every feature integration leaves a visible marker in history rather than a flat line. Second, you can forbid fast-forwards or require them, per team convention. The mental model to keep: a **fast-forward changes nothing except a pointer**, so it is safe and linear; a **three-way merge creates a real commit** that ties two histories together and never rewrites either parent. Conflicts are not errors — they are Git correctly refusing to guess when two people changed the same lines, handing you the decision with all three versions (base implied, ours, theirs) available. Because the merge commit records both parents, the full history of how the branches recombined is preserved forever, which is precisely the property that makes merging safe to do often.

## complexity
time: A fast-forward is O(1) — it writes one ref. A three-way merge is roughly O(size of the changes on both sides) to diff each branch against the merge base and combine hunks; finding the merge base is a graph walk, near-linear in the commits between the tips and their common ancestor.
space: A clean merge adds one commit object plus new trees/blobs for files that changed; unchanged subtrees are shared by hash, so a merge does not duplicate the whole project.
notes: Conflict frequency scales with how much two branches overlap and how long they diverge before merging — short-lived branches conflict less, which is the practical argument for merging often.

## pitfalls
- **Not realising a fast-forward left no merge commit.** After a fast-forward, history is linear and there is no marker that a branch ever existed. If your team wants an auditable integration point, use `git merge --no-ff` so a merge commit is always created. Fix: agree on a fast-forward policy and configure it, rather than being surprised by flat history.
- **Committing with conflict markers still in the file.** `<<<<<<<`, `=======`, `>>>>>>>` are plain text; Git will happily commit them if you `git add` without editing, breaking the build. Fix: after resolving, grep for the marker strings, then `git add` and commit; many editors highlight unresolved markers.
- **`git add`-ing a conflicted file you did not actually fix.** Staging is how you tell Git "this conflict is resolved," so staging a still-broken file marks it done and hides the problem. Fix: open every file under "Unmerged paths," produce the real combined result, and only then stage it.
- **Long-lived branches that drift for weeks.** The longer a branch diverges from `main`, the larger the merge base gap and the more conflicts pile up. Fix: integrate frequently — merge `main` into your branch (or rebase) regularly so conflicts stay small and local.
- **Panicking mid-conflict and making it worse.** A half-resolved merge left in a messy state feels irreversible. It is not. Fix: `git merge --abort` returns you cleanly to the pre-merge commit so you can retry with a clear head.

## interviewTips
- Draw the two cases: a fast-forward slides a pointer because one branch is a direct descendant of the other, while a three-way merge builds a two-parent commit from the merge base. Naming "merge base" and "three-way" explicitly signals real understanding.
- When asked how conflicts arise, say Git auto-combines non-overlapping changes but refuses to guess when both sides edit the same lines — the markers show ours (HEAD) versus theirs, and resolving means editing to the right result, `git add`, then commit. Mention `git merge --abort` as the safe escape hatch.
- If pushed on merge strategy, contrast `--no-ff` (always a visible merge commit, richer history) with fast-forward-preferred (linear, cleaner log), and tie the choice to team auditability needs rather than claiming one is universally correct.

## keyTakeaways
- A branch is a cheap movable pointer to a commit; switching and creating branches just writes refs, which is why branch-per-task is Git's default culture.
- Merging has two outcomes: a fast-forward simply slides a pointer when one branch directly descends from the other, while a three-way merge uses the common ancestor (merge base) to build a new merge commit with two parents.
- Conflicts happen only when both sides change the same lines; Git marks them with ours/theirs markers instead of guessing, and you resolve by editing to the intended result, staging, and committing — with `git merge --abort` always available to undo.
