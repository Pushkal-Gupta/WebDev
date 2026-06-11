# PGcode LLM Wiki

A Karpathy-style knowledge base for AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) working in this repo. The wiki captures what's been learned about the codebase across hundreds of agent-sessions — the gotchas, the established patterns, the anti-patterns we keep re-discovering.

Inspired by [Andrej Karpathy's LLM wiki for Claude Code](https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code). The idea: instead of agents rebuilding the same understanding every session, point them at a wiki of stable, distilled knowledge.

## Why this exists

We've been running waves of parallel agents on this codebase since ~600 problems ago. Patterns repeat:

- Agents keep re-discovering the same `useState(() => fn(ref.current))` anti-pattern → we wrote `viz-component-patterns.md`.
- Agents stalled writing into `mlContent.js` (7,000-line file) twice → we wrote `large-file-edit-strategy.md`.
- Agents kept double-importing concepts that already existed → we wrote `concept-audit-checklist.md`.

Each file here is a 100–400 word distillation of "do this, not that" from real session experience. Agents read these *before* doing work, not after they hit the problem.

## How to use as an agent

1. Read `00-orient.md` first — it points you at the rest based on what you're doing.
2. Skim the topic file matching your task (writing a viz, adding a concept, touching `mlContent.js`, etc.).
3. The advice here OVERRIDES general best-practice intuition. Trust the wiki on PGcode-specific calls.

## How to use as a human author

When you notice an agent stalling, repeating a mistake, or producing the same bug a third time — write a short page here. Future agents will pick it up. The wiki gets better the more sessions pass through it.

## Index

| File | Topic |
|---|---|
| `00-orient.md` | Start here — routes you to the right page by task type |
| `viz-component-patterns.md` | How to write a new SVG viz without tripping lint or scrollbars |
| `large-file-edit-strategy.md` | Why `mlContent.js` writes stall — and what to do instead |
| `concept-audit-checklist.md` | How to add a new `content/concepts/*.md` without duplicating |
| `test-coverage-pipeline.md` | The Stage 1–6 plan + which scripts do what |
| `explained-samples-backfill.md` | How to write 60–120 word explanation paragraphs that teach |
| `scrollbar-rule.md` | The single hardest rule — only the vertical page scroll exists |
| `judge0-and-backgrounds.md` | When to launch background processes + how to monitor them |
| `agent-dispatch-recipes.md` | Wave templates that have worked (and ones that haven't) |
| `pattern-1-quoting-bug.md` | The JSON-double-quoting storage bug + fix recipe |

## Authoring rules for wiki pages

- **≤ 400 words each.** A wiki page that's longer than a screen will be skimmed and missed.
- **Lead with the failure mode**, not the success path. Agents need to recognize what they're doing wrong.
- **Cite a real session**. "Wave 11 verify-prune sweep exited without launching the bg process" is better than "agents sometimes don't follow instructions."
- **Code snippets are gold**. A 6-line before/after is more useful than 200 words of prose.
- **Update timestamps** at the bottom so readers know which advice is stale.
- **Cross-link aggressively**. If pattern X is mentioned in 3 pages, every mention should `[link](./other.md)` back to the canonical page.

## When to retire a page

If a problem hasn't recurred in 3+ sessions, the page can move to `archive/` — keep it for context but stop loading it.
