# Contributing

Contributions are welcome — **bug reports, bug fixes, new features, new problems and lessons, visualizations, documentation, and design improvements.** This is a quality-first project with a single maintainer, so the bar for merging is deliberately high, but the door is open to anyone willing to meet it. Read this page before opening a pull request.

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Repository layout](#repository-layout)
- [Before you start](#before-you-start)
- [Development setup](#development-setup)
- [Making a change](#making-a-change)
- [Checks that must pass](#checks-that-must-pass)
- [UI and visual changes require proof](#ui-and-visual-changes-require-proof)
- [Disclosing AI-assisted contributions](#disclosing-ai-assisted-contributions)
- [Code rules](#code-rules)
- [Content contributions](#content-contributions)
- [Commit messages](#commit-messages)
- [Pull request checklist](#pull-request-checklist)
- [Review process](#review-process)
- [Security](#security)
- [Licensing and Contributor License Agreement](#licensing-and-contributor-license-agreement)
- [Code of Conduct](#code-of-conduct)

## Ways to contribute

All of these are wanted:

- **Report a bug** — open an issue with clear reproduction steps.
- **Fix a bug** — small, obvious fixes can go straight to a PR; anything larger starts as an issue.
- **Propose and build a feature** — features are welcome. Open an issue first so the direction is agreed before you write code (see [Before you start](#before-you-start)).
- **Add or improve content** — problems, test cases, concepts, lessons, and interactive visualizations (see [Content contributions](#content-contributions)).
- **Improve docs** — READMEs, this guide, inline explanations of non-obvious *why*.
- **Improve design/UX** — layout, accessibility, responsiveness, and polish, following the visual rules.

## Repository layout

This repository is a monorepo — several projects live side by side and are served together at [pushkalgupta.com](https://pushkalgupta.com):

| Project | Path | What it is | Detailed guide |
|---------|------|------------|----------------|
| PG Hub | [`PGHub/`](PGHub/) | Coding hub — DSA roadmap, judged problems, compiler, contests, ML | [`PGHub/CONTRIBUTING.md`](PGHub/CONTRIBUTING.md) |
| PG.Play | [`PG.Play/`](PG.Play/) | Browser arcade | [`PG.Play/CONTRIBUTING.md`](PG.Play/CONTRIBUTING.md) |
| onlineChess | [`onlineChess/`](onlineChess/) | Multiplayer chess platform | see project README |
| PG | [`PG/`](PG/) | Portfolio homepage + shared auth | — |
| blog | [`blog/`](blog/) | Essays | — |

**Each project that has its own `CONTRIBUTING.md` sets its own detailed rules — read the one for the project you're touching.** The rules below apply everywhere.

## Before you start

1. **Open an issue first** for anything beyond a typo, a broken link, or a one-line fix. Direction is agreed in the issue before code is written — large unsolicited PRs are hard to accept after the fact. Small, obvious fixes can go straight to a PR.
2. **One PR, one concern.** A pull request fixes one bug, or adds one feature, or refactors one thing. Do not mix unrelated changes or reformat files your change does not touch.
3. **Don't add dependencies** without agreeing it in the issue first. New runtime dependencies are approved rarely and only when an existing tool genuinely cannot do the job.
4. **Check existing issues and PRs** before starting, so you don't duplicate work in flight.

## Development setup

Node 20+ is required. Each project is a standalone package:

```bash
# Clone your fork
git clone https://github.com/<you>/WebDev.git
cd WebDev

# Pick the project you're working on, e.g. PG Hub
cd PGHub
npm install
cp .env.example .env      # fill in your Supabase credentials
npm run dev               # http://localhost:5173
```

`PGHub` and `onlineChess` are Vite apps that need a `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never commit a populated `.env` — it is git-ignored. See each project's README for project-specific commands.

## Making a change

- **Branch** off `main` with a descriptive name for what you're shipping: `fix-roadmap-refit`, `add-interval-scheduling-lesson`.
- Keep the branch focused on one concern.
- **Never** `git push --force` to `main`, and never bypass hooks or CI.
- Rebase or merge `main` in if your branch falls behind.

## Checks that must pass

A PR does not merge unless all of these are green. Run them locally before pushing.

- **Lint is clean — zero errors, zero warnings.** Lint is zero-tolerance. Do not disable rules to get green; fix the code. (PG Hub: `npm run lint`.)
- **The build succeeds.** (PG Hub: `npm run build`.)
- **The project's full verify passes** where one exists. For PG Hub this is `node scripts/verify.js` — the single source of truth (build + lint + content-parse + smoke checks). If it does not pass, the change is not shippable.
- **The change is verified in the running app**, not just built. "It builds" is not "it works."

## UI and visual changes require proof

**Any change that affects the UI — layout, a component, a visualization, styling, copy placement — MUST include a screenshot or a short screen recording of the actual rendered result. This is a hard gate, not a nicety: a PR that changes UI without visual proof will be sent back.**

- Attach **before and after** images (or a recording) so the reviewer can see what changed.
- Capture at **desktop and a narrow (mobile) width** — responsiveness is part of the bar.
- For an interactive change (a viz, a control, an animation), a **short screen recording or GIF** is preferred over stills.
- Claiming a visual result without showing it is not accepted. The maintainer will not take "it looks fine" on trust.

## Disclosing AI-assisted contributions

AI coding tools are allowed, and many contributions will use them — but **you must disclose it and you remain fully responsible for what you submit.**

- **Disclose AI assistance in the PR description.** State which parts were AI-generated or AI-assisted and which tool you used (for example: "solution and tests drafted with an AI assistant, reviewed and corrected by me"). A one-line note is enough.
- **You own the result.** You are responsible for the correctness, quality, and licensing of every line you submit, regardless of how it was produced. "The AI wrote it" is never an excuse for a bug, a security hole, or a rule violation.
- **Understand what you submit.** Do not open a PR containing code you cannot explain. Be ready to answer questions about how and why it works in review.
- **No low-effort AI dumps.** Unreviewed, untested, or auto-generated bulk PRs ("AI slop") are closed on sight. The same quality bar and checks apply — often the effort to verify AI output properly is *more*, not less.
- **Licensing and originality.** Ensure AI-generated code or content does not reproduce copyrighted or license-incompatible material, and that you have the right to license it under this repository's `LICENSE` (see [Licensing and Contributor License Agreement](#licensing-and-contributor-license-agreement)). Do not submit AI-generated content you cannot relicense as GPLv3.
- The same applies to **content** (problems, lessons, prose) and **visualizations**: AI-assisted is fine, disclosed and verified; unverified AI content that fails the content bar is rejected.

## Code rules

These are the house style and are absolute — they come straight from the project's standards. The per-project `CONTRIBUTING.md` has the full list; the universal ones:

1. **No emoji anywhere** — not in source, UI copy, commit messages, or PR descriptions. Use named icons in code (Lucide), and refer to icons by name in prose.
2. **No hardcoded colors.** Every color is a theme token (`var(--accent)`, `var(--bg)`, `var(--surface)`, `var(--text-main)`, `var(--border)`, difficulty/status tokens, the `--hue-*` palette). A raw hex in a component is a rejection, and all theme palettes must keep working.
3. **No secrets in code, ever.** Keys come from environment variables; `.env` is git-ignored. A committed secret is rejected and must be rotated.
4. **No new files unless necessary** — prefer editing an existing file.
5. **No comments that explain *what* code does** — comment only the non-obvious *why*.
6. **No `try/catch` around code that cannot fail** — guard only real boundaries (user input, Supabase, Judge0, the network).
7. **All Supabase reads/writes go through the project's query layer** (`PGHub/src/lib/queries.js`) with a stable key — components never call `supabase.from()` directly.
8. **All schema changes go through a numbered, idempotent migration** (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`, `DROP POLICY IF EXISTS` then `CREATE POLICY`).
9. **No committed build output** (`dist/`, `.gradle/`, editor folders) or unrelated lockfile churn.
10. **Locked decisions stay locked** — HashRouter, Vite SPA (no SSR). Do not propose switching routers or adding SSR.

The visual rules (no inner scrollbars, no dead whitespace, text never sliced by its box, a viz and its controls fit on screen, architecture diagrams flow top-to-bottom, math renders via KaTeX) are enforced as strictly as the code rules — see [`PGHub/CONTRIBUTING.md`](PGHub/CONTRIBUTING.md) for the full statement.

## Content contributions

Content is held to explicit quality bars — thin filler is rejected.

- **Concepts** hit the section template with real word-count floors and an interactive visualization.
- **Problems** are only shippable when the canonical Python solution passes **every** test case via the grader; every test case has been graded by that solution (bad cases pruned, not patched around); coverage is at least the equivalent LeetCode problem's; and Python/JS/Java/C++ all compile and pass. A wrong solution slipping through the grader is a P0 incident.
- **Voice:** every user-facing line is written *for the reader*, not as a product pitch. No "we built", no manifesto sections; page intros are one short line.
- **External links** must be the exact, verified topic URL — not a generic playlist or homepage.

Full detail in [`PGHub/CONTRIBUTING.md`](PGHub/CONTRIBUTING.md).

## Commit messages

- Present tense, imperative, specific: `Fix roadmap re-fit on window resize`, not `Update files`.
- Explain the *why* for anything non-obvious in the body.
- No emoji. Squash noise before requesting review.

## Pull request checklist

Before you request review, confirm:

- [ ] An issue exists and is accepted (for anything non-trivial), and the PR references it (`Closes #NN`).
- [ ] The PR does one thing; the diff contains only the files the change needs.
- [ ] Lint, build, and the project's verify all pass locally.
- [ ] The change was tested in the running app.
- [ ] **UI change: before/after screenshots or a recording are attached, at desktop and narrow width.**
- [ ] **AI assistance, if any, is disclosed in the description.**
- [ ] No secrets, no committed build output, no unrelated reformatting.
- [ ] The description covers what changed, why, and how you verified it.

## Review process

Review is adversarial by design — reviewers actively try to break the change (edge cases, other themes, narrow viewports, long strings, empty states). Address the failure the reviewer describes; do not argue that it is unlikely. Meet the bar and your change merges quickly; skip it and it will sit until it is fixed or split.

## Security

Please report vulnerabilities **privately** — see [`SECURITY.md`](SECURITY.md). Never open a public issue or PR for a security problem.

## Licensing and Contributor License Agreement

**Read this section carefully. By submitting a contribution you agree to all of it. If you do not agree, do not contribute.**

Opening a pull request, issue with a patch, or otherwise submitting any code, content, test cases, visualizations, documentation, or other material (a "Contribution") to this repository constitutes your acceptance of the following terms:

1. **The open-source project stays GPLv3.** The public project is distributed under the [`LICENSE`](LICENSE) (GNU General Public License v3.0), and public copies remain GPLv3 for everyone.

2. **Grant of rights to the maintainer (this is the important part).** You grant Pushkal Gupta (the project maintainer) and their successors and assigns a **perpetual, worldwide, non-exclusive, royalty-free, irrevocable license** to use, reproduce, modify, adapt, publish, translate, distribute, sublicense, and **relicense your Contribution, in whole or in part, under any license terms whatsoever — including closed-source, proprietary, and commercial terms.**

3. **Commercial and enterprise use is explicitly permitted.** This grant expressly includes the right to **include your Contribution in, and to sell, license, or otherwise commercialize it as part of, a proprietary, closed-source, or enterprise product or service**, on terms different from and additional to the GPLv3, without any obligation to you. In plain terms: **by contributing, you agree that your code may be sold as, or as part of, a commercial/enterprise offering, and you consent to that.**

4. **You keep your copyright.** This is a license grant, not an assignment — you retain ownership of your Contribution. The grant above simply gives the maintainer the rights needed to dual-license and commercialize the combined work.

5. **Your representations.** You represent and warrant that: (a) the Contribution is your own original work, or you otherwise have the full right and authority to submit it and to grant the rights above; (b) the Contribution does not, to your knowledge, infringe or misappropriate anyone's copyright, patent, trademark, trade secret, or other rights; and (c) you have the right to grant this license free of any obligations to third parties (including your employer, where applicable). Do **not** submit code, content, or AI-generated output that you cannot license on these terms.

6. **No obligation.** The maintainer is under no obligation to use, include, or ship your Contribution, or to compensate you for it in any way.

7. **This is a dual-licensing model.** The project remains free and open-source under the GPLv3 for the community, while the maintainer retains the right to offer the same code under separate commercial or enterprise licenses. This is a common and legitimate model (used by projects such as Qt, GitLab, and MySQL).

> **Note:** This section is a Contributor License Agreement, not legal advice. It is written to be clear, not to substitute for a lawyer. If the enterprise/commercial grant matters to you or your employer, review it (and have counsel review it) before contributing.

Contributions must otherwise be your own work or properly attributed and license-compatible; do not paste code, content, or visualizations (including AI-generated output) that you do not have the right to license as described above.

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Be direct, be technical, be respectful — reviews critique the code, not the person.

---

In short: open an issue, keep the PR small and single-purpose, make the checks pass, **show your UI work with screenshots or video**, **disclose any AI assistance**, and follow the project's rules. Meet the bar and your change merges quickly.
