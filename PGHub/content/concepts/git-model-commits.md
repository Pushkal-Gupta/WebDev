---
slug: git-model-commits
module: git-vcs
title: Git's Object Model — Commits as Snapshots
subtitle: How Git stores history as a chain of immutable snapshots — blobs for file contents, trees for directories, commits that point to a tree and their parents, all named by the SHA-1 hash of what they contain.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Pro Git — Git Internals: Git Objects"
    url: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects"
    type: article
  - title: "Pro Git — Git Basics: Recording Changes to the Repository"
    url: "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository"
    type: article
  - title: "Pro Git — Git Branching: Branches in a Nutshell"
    url: "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell"
    type: article
  - title: "GitHub Docs — About Git"
    url: "https://docs.github.com/en/get-started/using-git/about-git"
    type: article
status: published
---

## intro
Most people picture Git as storing a list of edits — "added this line, deleted that one" — layered on top of an original file. That mental model is wrong, and almost every confusing thing about Git dissolves once you replace it. Git stores **snapshots**, not differences. Every time you commit, Git records what your entire tracked project looked like at that instant, addresses that snapshot by a hash of its contents, and links it to the commit that came before. History is a chain of these immutable snapshots, and the whole tool is built on four small object types.

## whyItMatters
Understanding the object model is the single highest-leverage thing you can learn about Git. Once you know that a commit is an immutable snapshot named by a hash, that a branch is just a movable pointer to one commit, and that HEAD points at the branch you are on, then branching, merging, rebasing, resetting, and "detached HEAD" stop being memorised incantations and become obvious consequences of a tiny data structure. It also explains Git's guarantees: because every object is named by the hash of its content, corruption is detectable, history is tamper-evident, and identical content is stored only once. Interviewers probe this because it separates people who ran commands from people who understand the system.

## intuition
Imagine every commit as a photograph of your project's working directory, filed in a giant archive. When you take the photo, you do not write "changed line 12 of `app.js`" on the back — you capture the whole scene as it currently is. Git does exactly this. When you run a commit, it takes the current contents of every tracked file, stores each file's bytes as a **blob**, records the folder structure that ties those blobs to filenames as a **tree**, and then creates a **commit** object that points to the top-level tree plus a message, an author, a timestamp, and — crucially — a pointer to its **parent** commit.

Now the clever part: every object is named by the **SHA-1 hash of its own contents** (newer repositories use SHA-256, but the idea is identical). Change one byte in one file and that file's blob gets a brand-new hash; the tree that referenced it changes, so the tree's hash changes; the commit that referenced that tree changes, so the commit's hash changes. The name of a thing *is* a fingerprint of everything inside it. This is called **content addressing**, and it is why two files with identical contents are stored once, why Git can instantly verify nothing has been tampered with, and why a commit hash uniquely pins down the exact state of your entire project.

Because each commit records its parent, the commits form a **directed acyclic graph** (a DAG) — arrows always point backward in time, from a child to the parent it was built on. A **branch** like `main` is nothing more than a lightweight file containing one commit hash: a sticky note that says "the tip of this line of work is here." **HEAD** is another pointer, usually pointing at a branch, that answers "which commit am I standing on right now." Commit, and Git creates the new snapshot, then slides the branch pointer and HEAD forward to it. Nothing gets rewritten; a new node is appended and two pointers move.

## visualization
```
 working dir          the four object types              the commit DAG
 -----------          --------------------              --------------

 app.js  ---> blob a1b2  (bytes of app.js)      C1 <---- C2 <---- C3
 lib/                                            |        |        ^
   util.js ---> blob c3d4 (bytes of util.js)    tree     tree    tree
                                                  |                |
 tree (root) 9f8e:                              blobs            blobs
   app.js  -> a1b2
   lib/    -> tree 77aa   (subdir tree)         branch main ------+  <- points at C3
     util.js -> c3d4                            HEAD -> main         <- you are here

 commit C3 e4f5:
   tree   = 9f8e            (snapshot of the whole project)
   parent = C2 (hash)       (arrow points BACKWARD in time)
   author, date, message

 change one byte in util.js  ->  new blob hash
   -> new lib/ tree hash -> new root tree hash -> new commit hash
   (a snapshot is NOT a diff; the hash chains all the way up)
```

## bruteForce
The naive model treats a version-control system as a pile of diffs: keep the original file, then store patch after patch, and reconstruct any version by replaying patches from the start. Some older systems (RCS, SCCS, and to a degree Subversion) really did think per-file and delta-first. It seems space-efficient, but it makes everything else painful: reconstructing an old state means applying a long patch chain, renames confuse the per-file tracking, branching is expensive, and integrity is hard to verify because there is no global fingerprint of "the whole project at this moment." Git deliberately rejects this: it stores whole snapshots and lets a separate, invisible compression layer worry about not wasting disk.

## optimal
Git has exactly four object types, all stored in `.git/objects`, all named by the hash of their content. A **blob** holds the raw bytes of one file — no filename, no permissions, just content, which is why two identical files anywhere in history share one blob. A **tree** represents a directory: it lists entries, each mapping a name to a mode (file, executable, or subdirectory) and the hash of a blob or another tree. A **commit** points to exactly one top-level tree (the full snapshot), zero or more **parent** commits (zero for the first commit, one normally, two or more for a merge), plus author, committer, timestamps, and the message. A **tag** object is an optional named, annotated pointer to a commit.

The staging area (the **index**) sits between your working directory and history. `git add` writes blobs and records them in the index; `git commit` freezes the index into a tree and wraps it in a commit object. You can watch this happen with Git's plumbing commands:

```bash
# Peel back the layers of a commit by hand.
git cat-file -t HEAD          # -> commit
git cat-file -p HEAD          # shows: tree <hash>, parent <hash>, author, message
git cat-file -p HEAD^{tree}   # lists the root tree: mode  type  hash  name
git rev-parse HEAD            # the full 40-char SHA of the current commit
git log --oneline --graph     # the DAG, newest first, with branch/HEAD labels
```

Because names are content hashes, Git objects are **immutable**: you never edit a commit, you create a new one. Commands that "change history" (amend, rebase, reset) do not mutate objects — they build new objects and move pointers, leaving the old objects reachable for a while via the reflog. A **branch** is a 41-byte file under `.git/refs/heads/` holding one commit hash; creating a branch is O(1) and nearly free, which is why Git branching is cheap where older tools made it expensive. **HEAD** normally holds a symbolic ref like `ref: refs/heads/main`; committing advances that branch and HEAD together. Point HEAD directly at a commit instead of a branch and you get a **detached HEAD** — you can look around and even commit, but no branch is following you, so those commits are easy to lose. This whole edifice — content-addressed blobs, trees, commits, and movable refs — is the entire model, and everything else in Git is an operation on it.

## complexity
time: Committing is roughly O(size of changed files) to hash new blobs plus O(number of directories touched) to write new trees; unchanged subtrees are reused by hash, so a commit does not re-hash the whole project. Looking up any object by its hash is effectively O(1). Walking history (`git log`) is O(commits visited).
space: Objects are zlib-compressed and deduplicated by content, so identical blobs cost once; periodic `git gc` further packs objects and stores deltas between similar blobs behind the scenes. A snapshot model is therefore not the disk hog it appears — you get snapshot semantics with delta-like storage.
notes: The key invariant is content-addressing: an object's name is the hash of its bytes, so any change anywhere ripples up to a new commit hash, and integrity is verifiable end to end.

## pitfalls
- **Thinking a commit stores a diff.** Commits are full snapshots; the diff you see in `git show` is *computed on the fly* by comparing a commit's tree to its parent's tree. Believing commits are patches leads to wrong intuitions about rebase, cherry-pick, and merge. Fix: internalise "snapshot addressed by hash," and treat every diff as a derived view.
- **Confusing a branch with the commits on it.** Deleting a branch pointer does not delete commits — it just removes a sticky note; the snapshots survive (findable via reflog) until garbage-collected. Conversely, moving a branch does not alter any commit. Fix: separate "the pointer" from "the graph of snapshots it points into."
- **Committing on a detached HEAD and losing the work.** Checking out a raw commit hash or a tag detaches HEAD; commits you make there are not on any branch and vanish from view once you switch away. Fix: before working, `git switch -c fix-branch` so a branch tracks your new commits; if you already detached, `git branch keep <hash>` immediately.
- **Assuming identical file contents are stored twice.** They are not — content addressing means one blob backs every identical copy. People "optimise" by avoiding duplicate files for disk reasons that do not apply. Fix: trust deduplication; organise files for humans, not for the object store.
- **Reading a short hash as the whole identity.** Git shows 7-character prefixes for readability, but the true name is the full SHA; in a large repo a prefix can become ambiguous. Fix: use `git rev-parse` to resolve the full hash when scripting or when Git reports an ambiguous short hash.

## interviewTips
- State the four object types (blob, tree, commit, tag) and the one-line role of each, then say the load-bearing sentence: "a commit is an immutable snapshot of the whole project, named by the SHA of its contents, with a pointer to its parent." That single sentence signals you understand Git rather than just its commands.
- When asked "what is a branch," answer "a movable pointer to a commit — a tiny file holding one hash," and add that HEAD points at the current branch. This reframes branching, merging, and reset as pointer moves, which is exactly what interviewers want to hear.
- If asked why Git uses hashes, connect it to guarantees: deduplication of identical content, O(1) lookup, and tamper-evident integrity because any change anywhere changes the commit hash. Mentioning the DAG (parents point backward, merges have two parents) shows you see the whole structure.

## keyTakeaways
- Git stores snapshots, not diffs: every commit records the full state of the tracked project as a tree of blobs, and any diff you see is computed by comparing two snapshots.
- Every object — blob, tree, commit, tag — is named by the SHA hash of its own contents, giving content addressing, deduplication, and tamper-evident history; changing one byte ripples a new hash all the way up to a new commit.
- A branch is just a movable pointer to a commit and HEAD points at the branch you are on, so committing appends a new snapshot to the DAG and slides two pointers forward — nothing is ever rewritten in place.
