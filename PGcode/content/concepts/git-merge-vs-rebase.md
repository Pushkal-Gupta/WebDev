---
slug: git-merge-vs-rebase
module: cs-core
title: Git Merge vs Rebase
subtitle: Two strategies for integrating branches — when to preserve history and when to rewrite it.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Pro Git Book — Rebasing"
    url: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing"
    type: blog
  - title: "Git Merge vs Rebase — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/git/git-merge-vs-rebase/"
    type: blog
  - title: "git/git — builtin/rebase.c"
    url: "https://github.com/git/git/blob/master/builtin/rebase.c"
    type: repo
status: published
---

## intro
You finish a feature on a branch; meanwhile `main` has moved forward. To integrate, you can `merge` (create a new commit that joins both histories) or `rebase` (replay your commits on top of the new `main`). Both produce a working tree with the same files; the resulting history is very different.

## whyItMatters
Choosing the right strategy determines whether your `git log --graph` is a clean linear story or a tangled subway map. Teams argue about this constantly, and getting it wrong on shared branches (rebasing a published branch) is the single most common way to destroy collaborators' work.

## intuition
Merge says "both branches happened; record that fact." It creates a commit with two parents — history is honest but visually noisy. Rebase says "pretend my work was done after main's latest changes." It takes your commits, sets them aside, fast-forwards your branch to main, then re-applies your commits one by one — each gets a new hash. The story reads linearly, but it is a polite fiction.

## visualization
Before: main A-B-C; feature branches off B as B-D-E. Merge result: A-B-C-M where M has parents C and E, and D-E hang off the side. Rebase result: A-B-C-D'-E' — a straight line with D and E re-applied as new commits D' and E' on top of C; the original D and E are dangling and eventually garbage-collected.

## bruteForce
Always merge, always. Safe, never rewrites history, never loses commits. But over months a busy repo's history becomes a thicket of "Merge branch 'main' into feature" commits that obscure intent, make `git bisect` harder, and bury real changes under merge noise.

## optimal
Rule of thumb: rebase your local work before pushing to keep history linear; merge when integrating into a long-lived shared branch so the merge commit records the integration event. Configure `git pull --rebase` (or `pull.rebase = true`) so pulling never creates pointless "merge remote-tracking branch" commits. Never rebase a branch that other people have already based work on.

## complexity
time: O(commits) for both; rebase replays one commit at a time and may pause for conflict resolution at each.
space: O(1) extra — both operations work in place on the object database.
notes: A conflict during merge happens once; during rebase, it can happen at every replayed commit, which is why interactive rebase exists.

## pitfalls
- Rebasing a published branch and force-pushing — collaborators' clones diverge and they may push the old commits back, undoing your rebase.
- Resolving the same conflict repeatedly during rebase because you did not enable `rerere` (reuse recorded resolution).
- Using `git pull` without `--rebase` configured, then committing the resulting "merge branch 'main' of origin/main" — pollution.
- Squashing during rebase without re-reading the resulting commit messages; you can lose important context.

## interviewTips
- Quote the golden rule: "Rebase locally, merge to integrate." Never rebase shared history.
- Mention `--no-ff` merges for feature branches: forces a merge commit even when fast-forward would work, preserving the "this was a feature" boundary in history.
- Bring up `git reflog` as the safety net: even a botched rebase leaves the old commits reachable for 90 days.

## code.python
```python
import subprocess

def safe_update_branch(branch: str = "feature"):
    subprocess.run(["git", "fetch", "origin"], check=True)
    result = subprocess.run(
        ["git", "rebase", "origin/main"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        subprocess.run(["git", "rebase", "--abort"], check=True)
        subprocess.run(["git", "merge", "origin/main", "--no-ff"], check=True)
```

## code.javascript
```javascript
import { execSync } from "child_process";

export function safeUpdateBranch() {
  execSync("git fetch origin");
  try {
    execSync("git rebase origin/main", { stdio: "inherit" });
  } catch {
    execSync("git rebase --abort");
    execSync("git merge origin/main --no-ff", { stdio: "inherit" });
  }
}
```

## code.java
```java
import java.io.IOException;

public class GitFlow {
    public static void safeUpdate() throws IOException, InterruptedException {
        run("git", "fetch", "origin");
        int rc = run("git", "rebase", "origin/main");
        if (rc != 0) {
            run("git", "rebase", "--abort");
            run("git", "merge", "origin/main", "--no-ff");
        }
    }
    private static int run(String... cmd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(cmd).inheritIO();
        return pb.start().waitFor();
    }
}
```

## code.cpp
```cpp
#include <cstdlib>
#include <string>

int run(const std::string& cmd) { return std::system(cmd.c_str()); }

void safeUpdate() {
    run("git fetch origin");
    if (run("git rebase origin/main") != 0) {
        run("git rebase --abort");
        run("git merge origin/main --no-ff");
    }
}
```
