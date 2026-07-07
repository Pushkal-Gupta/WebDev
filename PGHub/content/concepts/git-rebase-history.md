---
slug: git-rebase-history
module: git-vcs
title: Rebase & Rewriting History
subtitle: Replaying a branch's commits onto a new base to keep history linear — how rebase differs from merge, what interactive rebase can reshape, and the golden rule that keeps you out of trouble.
difficulty: Advanced
position: 3
estimatedReadMinutes: 14
prereqs: [git-model-commits, git-branching-merging]
relatedProblems: []
references:
  - title: "Pro Git — Git Branching: Rebasing"
    url: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing"
    type: article
  - title: "Pro Git — Git Tools: Rewriting History"
    url: "https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History"
    type: article
  - title: "git-rebase Documentation"
    url: "https://git-scm.com/docs/git-rebase"
    type: article
  - title: "GitHub Docs — About Git rebase"
    url: "https://docs.github.com/en/get-started/using-git/about-git-rebase"
    type: article
status: published
---

## intro
Merging and rebasing solve the same problem — integrating one branch's work with another's — but they leave very different histories behind. A merge preserves exactly what happened, forks and all, and records the join with a merge commit. A **rebase** rewrites the story so it reads as a straight line: it takes your branch's commits and **replays** them, one by one, on top of the latest tip of another branch, as though you had started your work there all along. The result is a clean, linear history — but because it creates new commits in place of your old ones, rebasing comes with a rule you break at your peril.

## whyItMatters
Rebase is the tool most likely to either make you look like a Git expert or blow up your team's repository, and the difference is entirely about understanding what it does to commit identity. Used well, `git rebase` turns a tangled feature branch into a tidy sequence that reviewers can read commit by commit, and `git rebase -i` lets you squash typo-fix commits, reorder work, and rewrite messages before anyone sees them. Used carelessly on commits others have already pulled, it duplicates history and forces everyone into painful reconciliation. Every serious team has a rebase policy, and interviewers ask about it precisely because the right answer requires understanding that rebasing does not move commits — it *replaces* them.

## intuition
Recall that a commit is an immutable snapshot named by the hash of its contents — and that its contents include its parent's hash. That last detail is the whole story of rebase. If you change a commit's parent, you have changed its contents, so it gets a **new hash** — it is a different commit, even if the file changes it introduces are identical. Rebase leans on this entirely.

Picture your `feature` branch: three commits, D, E, F, built on an old tip of `main` called B. Meanwhile `main` has moved on to G and H. With a **merge**, Git leaves D-E-F exactly where they are and creates a merge commit that ties them to H — the fork in the road stays visible forever. With a **rebase**, Git does something different. It sets your D-E-F aside, moves you to the current tip of `main` (H), and then **replays** each of your commits on top: it applies D's changes to H and writes a brand-new commit D' whose parent is H; then applies E's changes on top of D' to make E'; then F's to make F'. Same edits, same messages, same order — but three new commits with new hashes and a new lineage. Your branch now looks as if you had branched from H in the first place, so history is a clean line with no fork.

The original D, E, F are not gone immediately; they are just no longer on your branch, findable through the reflog for a while. But to everyone reading the branch, the fork has vanished. This is why rebasing is called **rewriting history**: you did not preserve what happened, you rewrote a tidier version of it. **Interactive rebase** (`git rebase -i`) exposes this power directly — before replaying, Git hands you the list of commits and lets you reorder them, drop them, edit their messages, or **squash** several into one, then replays the edited plan. It is a history editor. And that is exactly why the **golden rule** exists: never rebase commits that other people have already based work on, because rewriting them yanks the ground out from under everyone who has the originals.

## visualization
```
 Start:  main has moved to H; feature still sits on old base B.

   main:     A---B---G---H
                  \
   feature:        D---E---F


 MERGE (git merge main, from feature):  fork preserved, join recorded
   feature:  A---B---G---H---M
                  \         /
                   D---E---F'      M has two parents; D,E,F stay put


 REBASE (git rebase main, from feature):  commits REPLAYED, linear
   feature:  A---B---G---H---D'---E'---F'
                              ^^^^^^^^^^^^
              new commits, new hashes; original D,E,F now dangling (reflog)


 INTERACTIVE (git rebase -i HEAD~3):  edit the plan, then replay
   pick   D  add parser
   squash E  fix typo          ->  E folds into D
   reword F  wire up parser    ->  new message on F'
```

## bruteForce
Without rebase, the only way to make a messy branch presentable is to fake it by hand: create a fresh branch off the latest `main`, then manually re-apply your changes and craft new commits so the history "looks" linear. It is tedious and error-prone — you copy diffs by hand, lose the exact authorship and timestamps, and easily drop a change. The alternative brute force is to just merge everything and accept a history full of tiny "fix typo" commits and criss-crossing merge lines that no reviewer can follow. Rebase automates the first option correctly and cleanly, replaying real commits with their real changes instead of asking you to reconstruct them by hand.

## optimal
The two everyday uses of rebase are **updating a branch** onto a moved base and **cleaning up** your own commits before sharing.

```bash
# 1. Replay your feature onto the latest main (linear integration).
git switch feature
git rebase main            # replay feature's commits on top of main's tip
# resolve any conflict, then:
git add <file>
git rebase --continue      # proceed to the next replayed commit
# or bail out and restore the original branch exactly:
git rebase --abort
```

During a rebase, conflicts are resolved per replayed commit, not once at the end — so you may fix, `git add`, and `git rebase --continue` several times as each commit lands on the new base. This is a real difference from merge, where you resolve the combined conflict a single time. In exchange you get a history with no merge bubble.

Interactive rebase is the history editor:

```bash
git rebase -i HEAD~4        # opens an editor listing the last 4 commits, oldest first
# change the verb before each commit:
#   pick   = keep as-is
#   reword = keep changes, edit the message
#   squash = fold into the previous commit, combine messages
#   fixup  = like squash but discard this commit's message
#   edit   = pause here to amend the snapshot itself
#   drop   = delete the commit entirely
# save and close; Git replays the plan, pausing where you asked.
```

Now the decision: **rebase or merge?** Rebase when you want a clean, linear, readable history and the commits are **private** — your own local work not yet shared, or a feature branch only you have. Merge when the branch is **shared** or when you want to preserve the true shape of history, including the fact that a feature was developed in parallel and integrated at a point in time. The **golden rule of rebasing** is absolute: *never rebase commits that exist outside your own repository* — anything you have pushed and others may have pulled. Rebasing rewrites those commits into new ones with new hashes; anyone who already has the originals will find their history diverged from yours, and the "fix" is a mess of duplicated commits. Keep rebase for tidying private work before it is shared, use merge to combine public branches, and if you must force-update a shared branch after a deliberate rebase, use `git push --force-with-lease` (which refuses if someone else pushed in the meantime) rather than a blind `--force`. Follow that discipline and rebase becomes a precision tool; ignore it and it becomes the reason your teammates dread pulling.

## complexity
time: A rebase is roughly O(number of commits replayed x average change size) — Git re-applies each commit's diff onto the new base in turn, so a branch of k commits does up to k applications, each of which can raise its own conflict. A merge does one combined three-way reconciliation instead.
space: Rebase writes new commit objects (and any new trees/blobs) for every replayed commit; the originals linger as unreachable objects until `git gc` collects them, so briefly you store both.
notes: Conflicts during rebase are paid per commit rather than once, which can mean resolving the same overlapping region several times — a practical cost weighed against the cleaner linear history you gain.

## pitfalls
- **Rebasing shared/pushed commits — the golden-rule violation.** Rewriting commits others already have forces everyone into duplicated history and painful reconciliation. Fix: only rebase private, unpushed work; to integrate a shared branch, merge instead.
- **Blind `git push --force` after a rebase.** A plain force-push overwrites the remote branch even if a teammate pushed in the meantime, destroying their commit. Fix: use `git push --force-with-lease`, which aborts if the remote moved since you last fetched.
- **Resolving the same conflict repeatedly and giving up halfway.** Because rebase replays commit by commit, an overlapping change can conflict on several commits in a row, and a half-finished rebase feels stuck. Fix: `git rebase --abort` restores the branch exactly; consider enabling `rerere` so Git remembers earlier resolutions, or squash first to reduce the number of replays.
- **Squashing away meaningful history.** Interactive rebase makes it easy to collapse commits that documented a real, non-obvious decision into one opaque blob. Fix: squash noise (typo fixes, WIP checkpoints) but keep commits that tell a reviewer *why* a change happened.
- **Assuming rebase moved your commits.** It did not — it created new ones with new hashes. Scripts, tags, or teammates referencing the old hashes now point at orphaned commits. Fix: treat rebased hashes as brand-new identities and re-point anything that referenced the originals.

## interviewTips
- Lead with the identity insight: rebase does not move commits, it *replays* them as new commits with new hashes because a commit's parent is part of its content. That one sentence explains linear history, the golden rule, and why force-push is needed — all at once.
- State the golden rule crisply: never rebase commits that have left your repository. Then give the decision heuristic — rebase private work for a clean line, merge shared branches to preserve true history — and mention `--force-with-lease` over `--force` for the rare deliberate shared rewrite.
- If asked about interactive rebase, list what it can do (reorder, drop, reword, squash, fixup, edit) and frame it as a pre-share history editor: tidy your own commits before review, never someone else's afterward.

## keyTakeaways
- Rebase replays a branch's commits onto a new base, producing new commits with new hashes (a commit's parent is part of its content) and a clean, linear history with no merge commit.
- Choose by ownership and intent: rebase private, unshared commits for a tidy line; merge shared branches to preserve the real shape of history and record the integration point.
- The golden rule is absolute — never rebase commits others already have — and when a deliberate shared rewrite is unavoidable, use `git push --force-with-lease`, never a blind force.
