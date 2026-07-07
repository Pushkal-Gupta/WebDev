---
slug: git-remotes-workflow
module: git-vcs
title: Remotes & Collaboration Workflow
subtitle: How local repositories sync with a shared one — remotes, fetch versus pull, tracking branches and ahead/behind counts, and the pull-request workflows that turn solo commits into reviewed team history.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [git-model-commits, git-branching-merging]
relatedProblems: []
references:
  - title: "Pro Git — Git Basics: Working with Remotes"
    url: "https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes"
    type: article
  - title: "Pro Git — Git Branching: Remote Branches"
    url: "https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches"
    type: article
  - title: "GitHub Docs — About pull requests"
    url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests"
    type: article
  - title: "GitHub Docs — Fork a repository"
    url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo"
    type: article
status: published
---

## intro
Everything Git does locally — commit, branch, merge — happens in a self-contained repository on your machine, with full history and no network required. Collaboration begins when two such repositories learn about each other. A **remote** is a named bookmark for another copy of the repository, usually one hosted on GitHub or GitLab that the team treats as the source of truth. Syncing is deliberately explicit: you **fetch** to download others' commits, **push** to upload yours, and Git tracks precisely how far **ahead** or **behind** your branch is. On top of this sits the **pull request**, the workflow that turns raw commits into reviewed, discussed, and gated team history.

## whyItMatters
Distributed version control means there is no single authoritative copy by default — every clone is a full repository — so a team needs a shared convention for where the truth lives and how work flows to it. Understanding remotes is understanding that your local `main` and the remote's `main` are *different branches* that you keep in sync manually; most "why is Git yelling at me to pull" confusion comes from missing that. Get it right and you can collaborate with dozens of people without stepping on each other; get it wrong and you overwrite work, push to the wrong place, or spend an afternoon untangling a branch that diverged from its remote. Fluency here is assumed on every engineering team and probed in interviews as a proxy for "can this person work with others' code safely."

## intuition
Think of your project as living in several complete copies. On your laptop is a full repository — every commit, every branch, all of history. On GitHub is another full repository. They are peers; neither is special to Git itself, though your team *agrees* to treat the GitHub one, conventionally named **origin**, as canonical. A **remote** is simply a saved name and URL so you can refer to that other copy without retyping its address.

Here is the key subtlety. When you clone, Git copies origin's history and also plants a set of **remote-tracking branches** — read-only local bookmarks named like `origin/main` that record "where origin's `main` was the last time I talked to it." Your own `main` and `origin/main` are two separate pointers. As you commit locally, your `main` moves forward while `origin/main` stays frozen at the last sync — you are now **ahead** of origin by however many commits you have made. Meanwhile a teammate pushes to origin's real `main`; nothing on your machine changes until you contact origin, so you are also **behind** by their commits, even though your `origin/main` bookmark has not noticed yet.

Two commands close the gap, and the difference between them matters. **Fetch** is the honest, safe one: it contacts origin and updates your remote-tracking branches (`origin/main` moves to the true remote tip) but touches *none* of your own branches. You can now inspect exactly what changed before integrating. **Pull** is fetch plus an immediate integration: it fetches, then merges (or rebases) origin's changes into your current branch in one step. Pull is convenient but combines "look at what's new" with "apply it," which is why a surprising merge or conflict often appears right after a pull. **Push** sends your local commits up to origin and moves the remote branch — but Git refuses if you are behind, because that would erase the commits you have not yet seen. That refusal is the source of the classic "updates were rejected; fetch first" message, and it is Git protecting the shared history, not obstructing you.

## visualization
```
 Two full repositories; origin/main is a bookmark of "last known remote tip".

 clone:      local main = origin/main = C            (in sync: ahead 0, behind 0)

 you commit D, E locally:
   local:    A---B---C---D---E   (main, HEAD)
   origin:   A---B---C           (origin/main frozen)   -> ahead 2, behind 0

 git push:   origin fast-forwards to E
   origin:   A---B---C---D---E   (main)                 -> ahead 0, behind 0

 teammate pushes F to origin; you have not fetched:
   origin:   A---B---C---D---E---F     but your origin/main still shows E
   git fetch -> origin/main moves to F  -> you are behind 1 (main unchanged)
   git pull  -> fetch + merge/rebase F into your main  -> in sync again

 push while behind:
   ! [rejected]  updates were rejected because the remote contains work
                 you do not have locally  ->  fetch/pull first, then push
```

## bruteForce
The pre-remote way to "collaborate" is to zip up your project folder and email it around, or drop it in a shared drive, and let each person edit their copy. It collapses immediately: there is no way to merge two people's edits to the same file, no record of who changed what or why, no history to roll back to, and the "latest" version is whoever saved last, silently clobbering everyone else. Even a shared network folder with the raw files has no notion of commits, branches, or reconciliation. Remotes replace this with structured synchronisation — commits carry identity and lineage, fetch/push move them explicitly, and Git refuses any operation that would silently lose someone's work.

## optimal
A remote is just a name-to-URL mapping plus the tracking branches under it:

```bash
git clone <url>            # copies history, sets 'origin', creates origin/* tracking branches
git remote -v              # list remotes and their URLs
git branch -vv             # show each local branch, its upstream, and ahead/behind counts
```

The everyday sync loop separates downloading from integrating:

```bash
git fetch origin           # update origin/* tracking branches ONLY; your branches untouched
git log --oneline main..origin/main   # inspect exactly what you are about to merge
git merge origin/main      # integrate the fetched commits into your current branch
# or do fetch + integrate in one step:
git pull                   # = fetch + merge (use --rebase to replay your commits on top instead)
```

Pushing publishes your commits and sets an **upstream** so Git remembers the pairing:

```bash
git push -u origin feature   # push 'feature', set origin/feature as its upstream (first time)
git push                     # thereafter, Git knows where to send it
# if rejected because you are behind:
git pull --rebase            # replay your local commits on top of the remote's new work
git push                     # now the push fast-forwards cleanly
```

On top of this plumbing sit the two collaboration models. In the **shared-repository** model, everyone has write access to one repository: you push feature branches directly to origin and open a **pull request** to merge into `main`. In the **fork-and-pull** model — standard for open source where you cannot write to the upstream — you **fork** the project into your own copy, push branches there, and open a pull request *across* repositories asking the maintainers to pull your branch. Both funnel through the same review gate: a **pull request** bundles a branch's commits with a diff, a discussion thread, and automated checks (CI, linters, required approvals), so nothing lands on `main` until it has been reviewed and passes. The disciplined loop is: branch off an up-to-date `main`, commit, push the branch, open a PR, address review, and let the platform merge it — then delete the branch and pull `main` to sync. Keeping feature branches short-lived and syncing with origin often keeps you close to the shared tip, which is exactly what minimises the ahead/behind gap and the conflicts that grow with it. The whole workflow is just careful management of when commits cross the boundary between your repository and everyone else's.

## complexity
time: Fetch and push transfer only the objects the other side lacks — roughly O(new commits + their new trees/blobs), not the whole history — so ongoing syncs are cheap after the initial clone. Computing ahead/behind is a graph walk between your branch and its tracking branch.
space: A clone stores the full history locally (O(all objects)); thereafter each side keeps only its own copy plus the deduplicated objects exchanged. Remote-tracking branches are just refs — a hash each, effectively free.
notes: Because every clone is a complete repository, most operations are local and instant; the network is touched only on clone, fetch, pull, and push, which is what makes distributed workflows fast and offline-friendly.

## pitfalls
- **Confusing your `main` with `origin/main`.** They are separate pointers; `origin/main` only updates when you fetch. Acting as if they are the same causes "why won't it push" surprises. Fix: run `git fetch` then `git branch -vv` to see the real ahead/behind picture before pushing.
- **`git pull` when you meant to just look.** Pull integrates immediately, so it can drop a surprise merge or conflict onto your working branch. Fix: `git fetch` first, inspect with `git log main..origin/main`, then merge or rebase deliberately.
- **Reacting to a rejected push with `git push --force`.** The rejection means the remote has commits you lack; forcing overwrites and destroys them. Fix: `git pull --rebase` (or merge) to incorporate the remote work, then push normally; reserve `--force-with-lease` for intentional rewrites of your *own* branch.
- **Letting a feature branch fall far behind origin/main.** The longer it drifts, the bigger and more conflict-prone the eventual merge. Fix: regularly `git pull --rebase origin main` (or merge main in) to stay close to the shared tip.
- **Pushing to the wrong remote in a fork setup.** With a fork you have two remotes (`origin` = your fork, `upstream` = the original); pushing to `upstream` fails or is wrong. Fix: `git remote -v` to confirm names, push branches to `origin`, and open the PR against `upstream`.

## interviewTips
- Explain that every clone is a full repository and a remote is just a named URL, then nail the key distinction: your `main` and `origin/main` are different branches, and `origin/main` only moves on fetch. That framing preempts most collaboration confusion.
- Contrast fetch and pull explicitly — fetch updates tracking branches only and is always safe to run, pull is fetch plus an integration that can surprise you — and explain a rejected push as Git protecting commits you have not yet fetched, fixed by pulling first.
- Describe both workflows: shared-repo (push branches, open a PR) and fork-and-pull (fork, push to your fork, PR across repos), and frame the pull request as the review-and-CI gate that keeps unreviewed code off `main`.

## keyTakeaways
- A remote is a named bookmark for another full copy of the repository; cloning also creates read-only remote-tracking branches like `origin/main` that record where the remote was at your last sync.
- Fetch downloads others' commits and updates tracking branches without touching your work; pull is fetch plus an immediate merge or rebase; push uploads your commits but is rejected if you are behind, protecting shared history.
- Team work funnels through pull requests — in a shared repo you push branches and open PRs, in fork-and-pull you fork and PR across repositories — with short-lived branches and frequent syncing keeping the ahead/behind gap and conflicts small.
