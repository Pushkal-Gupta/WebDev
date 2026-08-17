# Contributing to PG Hub

Thanks for your interest. **This is a quality-first, single-maintainer project, and the bar for merging is high on purpose.** These rules are strict and enforced by CI and review — a PR that ignores them will be asked to change or closed, regardless of how useful the underlying idea is. Read this document in full before opening a pull request.

If you only remember one thing: **the burden of proof that a change is correct, complete, and consistent with the existing design is on the contributor, not the reviewer.**

---

## 0. Before you write any code

1. **Open an issue first.** Every non-trivial change (anything beyond a typo, a broken link, or a one-line bug fix) must start as an issue that is triaged and accepted. Unsolicited large PRs are closed on sight — not because the work has no value, but because direction is set before code is written, never after.
2. **One PR, one concern.** A PR fixes one bug, or adds one feature, or refactors one thing. Mixed-purpose PRs ("fixed the bug and also reformatted 40 files") are rejected.
3. **No drive-by reformatting, renaming, or dependency bumps** unless that *is* the accepted task. Do not touch files your change does not need.
4. **Do not add dependencies** without prior approval in the issue. New runtime dependencies are approved rarely and only with a clear justification of why an existing tool cannot do the job.

---

## 1. Hard gates — a PR does not merge unless ALL pass

These are non-negotiable. CI enforces most; review enforces the rest.

- **`node scripts/verify.js` passes fully.** This is the single source of truth (build + lint + concept-parse + smoke checks). If it does not pass, the change is not shippable. Run it locally before pushing.
- **`npm run lint` is clean — zero errors, zero warnings.** Lint is zero-tolerance. Do not disable rules to get green; fix the code. The few existing `eslint-disable` lines are documented exceptions — do not add new ones without justification in the PR.
- **`npm run build` succeeds.**
- **The change is verified in the running app, not just built.** "It builds" is not "it works." Screenshots or a screen recording of the actual rendered result are required for any UI/visual change (see §4).

---

## 2. Absolute code rules (the maintainer will reject on sight)

These come straight from the project's standards. They are not stylistic preferences — they are the house style, and they are absolute.

1. **No emoji. Anywhere.** Not in source, not in UI copy, not in commit messages, not in the PR description. Use Lucide icons in code; refer to icons by name in prose ("the ArrowRight icon").
2. **No hardcoded colors.** Every color is a theme token: `var(--accent)`, `var(--bg)`, `var(--surface)`, `var(--text-main)`, `var(--text-dim)`, `var(--border)`, `var(--hover-box)`, difficulty/status tokens, and the `--hue-*` palette. A raw hex or named color in a component is a rejection. All theme palettes must keep working — test in more than one.
3. **No secrets in code.** Ever. Keys come from environment variables (`.env` is git-ignored). A committed secret is an immediate rejection and must be rotated.
4. **No new files unless necessary.** Prefer editing an existing file. New top-level files, new docs, and new "utils" dumping grounds are discouraged.
5. **No comments that explain _what_ code does.** Comment only non-obvious _why_ (a hidden constraint, a workaround, a subtle invariant). Default to no comments.
6. **No `try/catch` around code that cannot fail.** Guard only real boundaries (user input, Supabase, Judge0, the network).
7. **All Supabase reads/writes go through `src/lib/queries.js`** with a stable `qk.*` key. Components never call `supabase.from()` directly.
8. **All schema changes go through a numbered, idempotent `scripts/migrate-NN-*.sql`** (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`, `DROP POLICY IF EXISTS` then `CREATE POLICY`). A migration that cannot be run twice safely is rejected.
9. **HashRouter is locked. Vite SPA, no SSR, is locked.** Do not propose switching routers or adding SSR.

---

## 3. The layout / visual rules (enforced as strictly as the code rules)

The UI has a specific, deliberate standard. These have each bitten the project before and are treated as P0:

- **No scrollbars anywhere except the single vertical page scroll.** Not horizontal, not inside a section, card, modal, code block, math block, table, or visualization. If content does not fit, make it fit (reflow, scale the viewBox, shrink the font, wrap, split) — never reach for `overflow: auto`/`overflow-x: auto` on inner content.
- **No dead whitespace.** Every page fills the viewport; lists/grids use the full width and height. A band of empty space below content is a bug.
- **Breathing room after content.** Content must never sit flush against the edge that encloses it — every container ends with a small, deliberate gap.
- **Text is never sliced by its box.** Containers size to content; `min-height` is a floor, never a cap. Never pair `overflow: hidden` with a fixed height on an element holding flowing text. Clamp cleanly with `-webkit-line-clamp` + ellipsis only when a string is genuinely unbounded.
- **A visualization and all its controls fit on screen at once** (audit at 1440×900 and 1366×768) — no scrolling to reach Play/Step/Reset.
- **Architecture / model / pipeline diagrams flow top-to-bottom, never left-to-right.** Reuse `ArchitectureDiagram.jsx`.
- **No ASCII art for visual diagrams.** Build a real SVG component instead. ASCII is only for pseudo-code / tabular text where monospace alignment matters.
- **Math renders via KaTeX** (`\(...\)` inline, `\[...\]` display) — never raw LaTeX in a `<code>`/`<pre>`.

If your change touches learning content, it must also meet the **Interactive / Visual / Intuitive** bar: default to an interactive visual over a wall of text.

---

## 4. Pull request requirements

A PR that omits any of the following will be sent back:

- **Title:** imperative and specific (`Fix roadmap re-fit on window resize`), not `Update files`.
- **Description** covering: what changed, why, the issue it closes (`Closes #NN`), and how you verified it.
- **Proof of verification:** the output of `node scripts/verify.js`, plus — for any UI/visual change — before/after screenshots (or a short recording) at desktop **and** a narrow (mobile) width. Claiming a visual result without showing it is not accepted.
- **Scope:** the diff contains only files your change needs. If the diff is large, expect it to sit until it is split.
- **No generated artifacts committed** (`dist/`, build output, `.gradle/`, editor folders, lockfile churn unrelated to a dependency change).
- **Commit messages:** present tense, no emoji, explain the why for anything non-obvious. Squash noise before requesting review.

Review is adversarial by design — reviewers actively try to break the change (edge cases, other themes, narrow viewports, long strings, empty states). Address the failure the reviewer describes; do not argue that it is unlikely.

---

## 5. Content contributions (concepts, lessons, problems)

Content is held to explicit quality bars — thin filler is rejected. Summary (full detail in the README and `docs/`):

- **Concepts** hit the 13-section template with real word-count floors (intuition ≥ 200 w, optimal ≥ 200 w, ≥ 4 pitfalls, all 4 language code blocks) and an interactive visualization.
- **Problems** are only "shippable" when: the canonical Python solution passes **every** test case via Judge0; every test case has been graded by that solution (bad cases pruned, not patched around); coverage is at least the equivalent LeetCode problem's; and Python/JS/Java/C++ all compile and pass. A wrong solution slipping through the grader is a P0 incident.
- **Voice:** every user-facing line is written *for the reader*, not as a product/PM pitch. No "we built", no "integrated syllabus", no manifesto sections. Page intros are one short line.
- **External links** must be the exact, verified topic URL — not a generic playlist or homepage.

Do not "fix" LaTeX source files by rewriting them to Unicode — fix the renderer instead. Do not silently reduce test-case counts or coverage.

---

## 6. Security

- Report vulnerabilities **privately** (see `SECURITY.md` if present, otherwise open a minimal private report to the maintainer) — never in a public issue or PR.
- Never commit credentials, tokens, or a populated `.env`. Rotate anything exposed.
- Dual-use or security-sensitive changes require explicit maintainer sign-off.

---

## 7. Licensing and conduct

- By contributing, you agree your contribution is licensed under this repository's `LICENSE`.
- Contributions must be your own work (or properly attributed and license-compatible). Do not paste code, content, or visualizations from sources you do not have the right to relicense.
- Be direct, be technical, be respectful. Reviews critique the code, not the person — and contributors extend the same courtesy.

---

**In short:** open an issue, keep the PR small and single-purpose, make `verify.js` pass, show your verification, and follow the code and layout rules to the letter. Meet the bar and your change merges quickly; skip it and it will not.
