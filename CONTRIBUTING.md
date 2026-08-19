# Contributing

Contributions are welcome — bug reports, fixes, new problems and lessons, visualizations, and features. This is a quality-first project with a single maintainer, so the bar for merging is deliberately high, but the door is open to anyone willing to meet it. Read this page before opening a pull request.

This repository is a monorepo — several projects live side by side and are served together at [pushkalgupta.com](https://pushkalgupta.com):

| Project | Path | What it is | Detailed guide |
|---------|------|------------|----------------|
| PG Hub | [`PGHub/`](PGHub/) | Coding hub — DSA roadmap, judged problems, compiler, contests, ML | [`PGHub/CONTRIBUTING.md`](PGHub/CONTRIBUTING.md) |
| PG.Play | [`PG.Play/`](PG.Play/) | Browser arcade | [`PG.Play/CONTRIBUTING.md`](PG.Play/CONTRIBUTING.md) |
| onlineChess | [`onlineChess/`](onlineChess/) | Multiplayer chess platform | see project README |
| PG | [`PG/`](PG/) | Portfolio homepage + shared auth | — |
| blog | [`blog/`](blog/) | Essays | — |

**Each project that has its own `CONTRIBUTING.md` sets its own detailed rules — read the one for the project you are touching.** The rules below apply everywhere.

## Before you start

1. **Open an issue first** for anything beyond a typo, a broken link, or a one-line fix. Direction is agreed in the issue before code is written — large unsolicited PRs are hard to accept after the fact. Small, obvious fixes can go straight to a PR.
2. **One PR, one concern.** A pull request fixes one bug, or adds one feature, or refactors one thing. Do not mix unrelated changes or reformat files your change does not touch.
3. **Don't add dependencies** without agreeing it in the issue first.

## Ground rules (every project)

- **GPLv3.** By contributing you agree your contribution is licensed under this repository's [`LICENSE`](LICENSE) (GNU General Public License v3.0). Contributions must be your own work or properly attributed and license-compatible.
- **No secrets in code, ever.** Keys come from environment variables; `.env` is git-ignored. A committed secret is rejected and must be rotated.
- **No emoji** — in source, UI copy, commit messages, or PR descriptions. Use named icons in code.
- **Lint and build must pass.** Run the project's checks locally before pushing (for PG Hub: `node scripts/verify.js`, `npm run lint`, `npm run build`). A red check does not merge.
- **Verify in the running app, not just the build.** For any UI change, include before/after screenshots at desktop and a narrow width. "It builds" is not "it works."
- **No committed build output** (`dist/`, `.gradle/`, editor folders) or unrelated lockfile churn.
- **Be respectful.** Reviews critique the code, not the person. See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Pull request checklist

- Title is imperative and specific (`Fix roadmap re-fit on window resize`), not `Update files`.
- Description covers what changed, why, the issue it closes (`Closes #NN`), and how you verified it.
- The diff contains only the files your change needs.
- Commit messages are present-tense and explain the *why* for anything non-obvious.

## Reporting bugs and requesting features

Open an issue with clear steps to reproduce (for bugs) or the problem you want solved (for features). Screenshots and the browser/OS help.

## Security

Please report vulnerabilities privately — see [`SECURITY.md`](SECURITY.md). Never open a public issue or PR for a security problem.

---

In short: open an issue, keep the PR small and single-purpose, make the checks pass, show your verification, and follow the project's rules. Meet the bar and your change merges quickly.
