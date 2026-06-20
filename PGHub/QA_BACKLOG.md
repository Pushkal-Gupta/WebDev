# QA_BACKLOG

Worked by the QA Scrum Flow (`docs/QA_SCRUM_FLOW.md`). Open items drain through
the role pipeline; when empty, an identifier sweep refills it.

## Open

- [ ] P0 search-number-rpc — Practice search by number returns no rows · file:`scripts/migrate-58-search-number-bucket-fix.sql` · repro: search "1840" under Number sort → "No problems match" though #1840 exists · expect: matching rows render. **Fix written; needs apply to live DB (user authorization required).**

## Done

- [x] P1 code-multibox — Tutorials/lessons showed 4 separate per-language code boxes (Done: unified into one `RunnableCodePanel` with language tab bar + Run).
- [x] P1 ml-problem-ui — ML problem page didn't match the DSA Workspace (Done: adopted `RunnableCodePanel` fill + Submit→grader).
- [x] P1 card-visuals — Card thumbnails were random/unrelated to topic (Done: topic→kind map + `chain`/`grid` archetypes in ForgeThumb).
- [x] P0 viz-oversized — Algorithm viz overflowed the screen (Done: responsive viewBox + flex cells + bounded height across all renderers; explanation panel added).
- [x] P2 attentionstep-lint — set-state-in-effect error (Done: scoped eslint-disable on the one-shot reduced-motion branch).
