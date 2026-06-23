# QA_BACKLOG

Worked by the QA Scrum Flow (`docs/QA_SCRUM_FLOW.md`). Open items drain through
the role pipeline; when empty, an identifier sweep refills it. Last sweep
(`qa-scrum` workflow): 22 confirmed issues, 0 P0.

## Open

(none — DB migrations applied 2026-06-22; awaiting next sweep results)

## Done — DB migrations APPLIED to live Supabase (2026-06-22, verified)

- [x] P0 public-list-rls — `migrate-60` applied: public read + owner read/insert/update/delete on PGcode_user_list_problems. List add/remove + share links work.
- [x] P1 search-number-rpc — `migrate-58` applied: search by number/title works under any sort (verified "two sum"→4, "1840"/"1802"→found).
- [x] P1 status-filter-paging — `migrate-59` applied + client wired (`useProblemPage` passes `p_status`): Status filter works catalog-wide.
- [x] P1 topic-empty-pages — `migrate-59` applied: narrowing filters fall back to position paging (no empty pages).

## Done (prior sweep)

- [x] P1 review-null-diff — /review blanked on null difficulty (guarded `?.toLowerCase()`).
- [x] P1 lists-share-stale — Share link/Copy now appear immediately after toggling Public (live `activeListId` derive).
- [x] P1 rating-predictor — LcHub predictDelta now passes fieldSize; realistic deltas (rank 2000 → +336 vs old −581).
- [x] P2 review-swallow-errors — Review queries now throw on error → error UI fires.
- [x] P2 vault-breadcrumb — Vault back-link added to signed-out/loading/error states of Review/Notes/Lists.
- [x] P2 llm-bars — "Where they break" bars normalized to max share (no overflow).
- [x] P2 lcproblems-error — LcProblemsBrowser shows an error/retry instead of misleading "0 rated".
- [x] P2 problemlist-null-diff — Row/practice-set/sort guarded against null difficulty.
- [x] P2 header-denominator — Solved/total uses real catalog count, not max number (100% reachable).
- [x] P2 footer-count-status — Footer reports real filtered count under a status filter.
- [x] P2 examples-regex — Workspace examples panel no longer suppressed by the word "example" in prose (requires a heading colon).
- [x] P2 output-unbounded — Code output pane capped at 22rem with internal scroll.
- [x] P2 viz-stage-clip — Tall interactive viz scroll inside the stage instead of being clipped.
- [x] P2 dead-runnablecode — Removed orphaned `learn/RunnableCode.jsx`+`.css` (RunnableCodePanel is the single surface).
- [x] P2 progress-heatmap — /progress heatmap now weekday-aligned (reuses ActivityHeatmap).
- [x] P2 topicnode-light — Light-theme TopicNode uses tokens keyed on `[data-theme-mode]` (all 4 light palettes).
- [x] P2 nav-offset — Route containers use `calc(100dvh - var(--pg-nav-h,120px))`; `--pg-nav-h` defined on `:root`.
- [x] P2 dvh — Full-viewport routes use 100dvh (no mobile dead space / inner scroll).
- [x] P2 bulkhead-emoji — Replaced raw ⚠ glyph with a lucide AlertTriangle.

## Done (sweep 2 — visual + code)

- [x] P1 dead-cta — PGForge "Run my code" CTA was inert; now a real button grading the live buffer (RunnableCodePanel exposes an imperative handle).
- [x] P1 inline-wrap-clip — RunnableCodePanel inline height now tracks Monaco's real content height (word-wrapped lines no longer clipped).
- [x] P1 companies-blank — `#/companies` blank route → redirects to `/company`; catch-all prevents blank voids.
- [x] P1 featured-logos — Featured company cards render real logos / themed monogram fallback (no empty white boxes).
- [x] P1 practice-count — Header/footer/page-count all derive from the real catalog count (no 3938-vs-4543 contradiction).
- [x] P2 card-contrast — Visualize/concept card descriptions + meta raised to legible contrast (color-mix toward --text-main).
- [x] P2 papers-accordion — Papers now expand independently (open-set), comfortable reading layout, chevron affordance.
- [x] P2 project-page — ML project detail redesigned (hue hero + ForgeThumb + stepper + runnable scaffold).
- [x] P2 breadcrumb-style — Breadcrumb trail uses theme tokens (no default-blue underline); rule moved to global theme.css so /ml routes get it too.
- [x] P2 viz-blurb-truncation — Visualize card blurbs show complete (no dangling "and").

## Done (prior)

- [x] P1 code-multibox · [x] P1 ml-problem-ui · [x] P1 card-visuals · [x] P0 viz-oversized · [x] P2 attentionstep-lint
