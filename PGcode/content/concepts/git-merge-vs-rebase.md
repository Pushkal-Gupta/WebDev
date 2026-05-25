---
slug: git-merge-vs-rebase
module: cs-tools-encodings
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
- **Linux kernel workflow**: Linus rebases hundreds of patches per release window to maintain a bisectable, single-parent history; the kernel's policy explicitly forbids merge commits on contributor branches because rebase keeps `git bisect` fast across decades of commits.
- **GitHub / GitLab / Bitbucket PR workflows**: "Rebase and merge" vs "Squash and merge" vs "Create a merge commit" are the three buttons every PR offers; teams calcify around one choice because mixing them produces unreadable history.
- **Production incident bisection (Stripe, Cloudflare post-mortems)**: `git bisect` is dramatically more useful with linear history — every step lands on a single commit you can `git blame`. Merge-heavy histories require `bisect skip` on integration commits, doubling the search.
- **Microservice deployments at Google, Meta, Netflix**: continuous-deployment systems read commit-level metadata for release notes and ownership routing; rebased history makes every commit a deployable unit, mergy history forces parsing trees.
- **Open-source contribution norms**: most maintainers ask contributors to rebase against `main` before review to avoid review-time conflicts with concurrently-merged PRs; understanding the request is table-stakes for OSS work.

The cost of getting it wrong is concrete: rebasing a published branch and force-pushing has destroyed weeks of collaborators' work at well-known companies (the canonical war story is the "GitHub force-push outage of 2014"). Teams argue about merge vs rebase because the tradeoff is real — history clarity vs collaboration safety — and the wrong choice in either direction causes pain.

## intuition
Merge and rebase produce the same final tree (same files, same contents) but very different histories. The choice is entirely about which history you want to live with for the next decade of `git log`, `git blame`, and `git bisect` queries.

Merge says "both branches happened; record that fact". It synthesises a new commit with *two* parents — one from your branch, one from main — and the resulting graph shows the divergence and re-convergence as a literal fork in the road. History is honest: future readers can see "feature X was developed in parallel with feature Y and integrated on date Z". The cost is visual noise. After a year of busy development, `git log --graph` looks like a subway map — twenty merge commits per week, each saying "Merge branch 'main' into feature-something", with the actual feature work buried in the side branches that fork off. `git bisect` becomes harder because half the commits on the main line are merge commits whose tree differs from both parents — the bug could be in either side.

Rebase says "pretend my work was done after main's latest changes". It takes your branch's commits, sets them aside, fast-forwards your branch to main's tip, then replays your commits one by one on top of that new base. Each replayed commit gets a new hash (because its parent changed), and the original commits become unreachable (garbage-collected after 90 days). The story now reads linearly: every commit on main is a single-parent commit you can blame, bisect, and revert cleanly. The honesty cost is that the timestamps lie — the rebased commit's "author date" still says when you originally wrote it, but its position in history makes it look like it was authored after main's latest commit, which it wasn't.

The danger zone is rebasing *published* history. Once you've pushed a branch and a collaborator has pulled it, they have local commits that descend from your original commits. If you rebase and force-push, the original commits become unreachable on the remote, but your collaborator still has them locally — and the next time they push, they push the *old* commits back, undoing your rebase. Merge conflicts ensue, work gets lost, blame gets assigned. The unconditional rule that prevents this is "rebase locally, merge to integrate". Rebase your private feature branch against main as often as you like before pushing; once others base work on your branch, only merge.

The community has converged on a small set of policies that work. Squash-merge for feature PRs (collapses the branch into one commit on main; clean history at the cost of intra-PR granularity). Rebase-then-fast-forward for solo work and short-lived branches (linear history, full granularity preserved). Merge commit with `--no-ff` for long-lived integration branches (preserves the "this was a feature" boundary, accepts the visual noise). Pick one per repo, document it in CONTRIBUTING.md, and use repository settings to enforce it — switching styles mid-repo is the worst of both worlds.

## optimal
The operative rule is "rebase locally, merge to integrate". Rebase your private feature branch as often as you like to keep it on top of main; merge (or squash-merge) when integrating into the shared branch. Configure `pull.rebase = true` so `git pull` never creates pointless "merge remote-tracking branch" commits.

```bash
# One-time per-repo setup that prevents most footguns:
git config pull.rebase true              # git pull = rebase, not merge
git config rebase.autoStash true         # auto-stash dirty changes during rebase
git config rerere.enabled true           # remember conflict resolutions across rebases
git config branch.autoSetupRebase always # new branches default to rebase on pull

# Daily flow: keep your feature branch on top of main.
git checkout feature
git fetch origin
git rebase origin/main                   # replay your commits on latest main
# resolve conflicts per commit; `git rebase --continue` to advance
# `git rebase --abort` to bail out cleanly if you change your mind

# Squash trivial commits before pushing (interactive rebase against the merge base):
git rebase -i $(git merge-base feature origin/main)
# mark fixup commits as `f`, reword messages as `r`, leave the meaningful ones as `pick`

# Integrating into main — three sanctioned policies, pick ONE per repo:
git merge --no-ff feature                # preserves feature boundary; visible in log
git merge --squash feature && git commit # collapses to one commit on main
git rebase feature main && git push      # linear, fast-forwarded; no merge commit at all

# Safety net for botched rebases — reflog is your friend:
git reflog                               # shows every HEAD movement, 90-day retention
git reset --hard HEAD@{5}                # rewind to a known-good state
```

Why this is the right toolkit: rebase locally hits the goal of linear, bisectable history for the commits that survive review; merge-to-integrate preserves the "this PR happened" boundary on the shared branch and avoids force-pushing public commits; `pull.rebase = true` eliminates the dominant source of accidental merge-bubbles ("Merge branch 'main' of origin/main into main"). The conflict resolution cost is bounded: `rerere` records each conflict resolution and replays it automatically on future rebases, so a re-rebase against an evolved main doesn't make you resolve the same conflict three times. The reflog is a non-negotiable safety net — every HEAD movement is logged for 90 days, so even a force-pushed rebase that destroyed work locally can be recovered via `git reset --hard HEAD@{N}` until garbage collection runs.

Three discipline rules that prevent the destructive failure modes: (1) never rebase a branch others have based work on — once pushed and consumed, the branch is immutable; (2) prefer `--force-with-lease` over `--force` when pushing a rebased branch — `--force-with-lease` refuses to overwrite if the remote has commits you don't know about, catching the "collaborator pushed while you were rebasing" race; (3) use `--no-ff` merges for feature branches even when fast-forward is possible, so the merge commit serves as a permanent "this was a feature, integrated on this date" marker — invaluable for release notes and post-incident archaeology; (4) for PR workflows on GitHub/GitLab, configure repo-level merge policy (Settings → "Allow squash merging only") so contributors can't accidentally produce the wrong commit shape; mixed-policy repos accumulate the pathologies of every style.

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
