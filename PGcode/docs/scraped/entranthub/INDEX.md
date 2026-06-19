---
source: EntrantHub (entranthub.com) public pages
scraped_at: 2026-06-18
note: Reference scaffolding for our Contest aggregation + LeetCode analytics workstream. MATCH structure then reimplement in PGcode voice — never link/credit/copy verbatim.
---

# EntrantHub scrape index

Captured page structure for the unified contest calendar + LeetCode contest analytics features.

| File | Page | Structure captured |
| --- | --- | --- |
| home.md | `/` | Landing hero ("Hub for Every Tech Entrant"), stat row (events tracked / platforms / update cadence / prize pools), Upcoming Contests list (platform badge, countdown, start time, duration, View Contest link). |
| contests.md | `/contests` | Unified contest calendar: platform filter tabs (All/Upcoming/Live/Past), per-platform counts (LeetCode/Codeforces/AtCoder/CodeChef), "Registration by Server Region" table, LeetCode Hub promo card. |
| contests-leetcode.md | `/contests/leetcode` | LeetCode contest hub: rating predictor pitch, Problem Analytics card, LLM Leaderboard card (GPT/Gemini/Claude ranks), contest list table (Contest / Status / Start Time / Registered / Duration), 610 contests paginated. |
| contests-leetcode-weekly-492.md | `/contests/leetcode/weekly-contest-492` | Single contest analytics page: header (type/number/status), start time, duration, participants, problem count, Rankings + Problems tabs, View on LeetCode link. |
| contests-leetcode-questions.md | `/contests/leetcode/questions` | Problem analytics table: 2,432 problems — Title / Contest / estimated Rating / Solve Rate / Credit / Difficulty (Q1–Q4 grouping), MLE-estimated difficulty ratings. |

## Schema cues for `PGcode_external_contests` + analytics

- Contest entity fields: platform, name, type (weekly/biweekly/div), number, status (upcoming/live/past), start_time, duration, participants/registered count, source URL.
- Problem analytics fields: title, contest ref, estimated rating, solve_rate, credit/score, difficulty (Easy/Medium/Hard), quarter slot (Q1–Q4).
- Extra features observed (out of our stated scope but noted): LLM leaderboard, rating predictor, per-region registration breakdown.

5/5 pages saved successfully (all rendered with real data, no gating).
