# PGHub — Tech Stack

Just the technologies, what each is used for, and where it lives. For *how they fit
together* see `SYSTEM_ARCHITECTURE.md`; for the real-time calling stack see
`PGBATTLE_REALTIME_COMMS.md`.

---

## Frontend

| Tech | Version | Used for |
|---|---|---|
| **React** | 19 | The whole SPA UI. Function components + hooks only. |
| **Vite** | build/dev | Dev server (`:5173`), production bundle → `dist/`. `manualChunks` splits react / monaco / reactflow / query / supabase / icons into cached vendor chunks. |
| **React Router** | 7 (**HashRouter**) | Client routing. HashRouter is locked — the app is served from a sub-path on a static host, so URLs use `#/`. Every route is `React.lazy` + `Suspense` in `src/App.jsx`. |
| **TanStack Query** | v5 | Server-state cache for all Supabase reads; `localStorage` persistence (`src/lib/queryClient.js`). Every read/write goes through a `qk.*`-keyed hook in `src/lib/queries.js`. |
| **@monaco-editor/react** | — | The code editor in Workspace, Playground, PGBattle, and course example blocks. |
| **reactflow** | — | Node/edge rendering for the roadmap graphs. |
| **KaTeX** | — | Math rendering (`\(inline\)` / `\[display\]`) in ML lessons and concepts. Never render raw LaTeX. |
| **lucide-react** | — | The only icon set. **No emoji anywhere** (source, UI, commits). |

Styling is plain CSS files co-located with components + a CSS-variable theme system
(`src/styles/theme.css`, 8 palettes on `[data-theme]`).

---

## Backend — Supabase (project `ykpjmvoyatcrlqyqbgfu`, Singapore)

| Piece | Used for |
|---|---|
| **Postgres** | All persistent data. Tables prefixed `PGcode_*`; RPCs `pgcode_*`. Schema changes are numbered idempotent migrations `scripts/migrate-NN-*.sql`. |
| **Auth** | Google / GitHub OAuth + email. Session shared with the PG hub via `localStorage`. |
| **Row Level Security** | Public-read policies for content; user-owned write policies for lists/progress/submissions. |
| **Realtime** | WebSocket presence + broadcast for PGBattle: match state (`versus:{code}`) and comms signaling+chat (`comms:{code}`). Ephemeral — no DB rows. |
| **Edge Functions** (Deno) | Server-side logic — see below. |
| **pg_cron + pg_net** | Scheduled HTTP calls to edge functions (contest scrapes, field builds). Runs in UTC. |

### Edge Functions (`supabase/functions/*`)

| Function | Purpose |
|---|---|
| `run-code` | Proxies **Judge0** for code execution (14 languages). |
| `grade-submission` | Loads tests + driver from the DB, calls Judge0, returns an aggregated verdict. |
| `lc-user`, `lc-contest`, `lc-contest-ranking`, `lc-user-contest-rank` | LeetCode profile / contest data via LeetCode's GraphQL + ranking API. |
| `scrape-contest`, `scrape-cron` | Proactive leaderboard scrape for a recently-ended contest (resumable, self-chaining). |
| `build-field` | Builds a contest's **field rating distribution** for the dense-field rating predictor (ranking API for ranks + GraphQL for ratings). |
| `fetch-contests` | Aggregates external contest calendars (Codeforces/AtCoder/CodeChef, hackathons). |

---

## Code execution & grading

| Tech | Used for |
|---|---|
| **Judge0** | Sandboxed multi-language execution, reached only via the `run-code` edge function. 5s wall-clock ⇒ TLE. |
| **Driver-code harness** | `src/lib/driverCode.js` (client) + `grade-submission` (edge) wrap user code with I/O drivers for Py / JS / Java / C++ (`HARNESS_LANGS`). The two must stay in sync. |
| **Local grader** | `scripts/local-grade.mjs` — grades offline for content scripts (verify/prune/stress). |

---

## Real-time calling (PGBattle)

| Tech | Used for |
|---|---|
| **WebRTC** (`RTCPeerConnection`) | Direct peer-to-peer video/audio. |
| **STUN** | Google + Metered STUN — discover the public NAT mapping for direct P2P. |
| **TURN** | Media relay when direct fails. Configurable via `VITE_TURN_*` (e.g. Metered); OpenRelay TCP:80 fallback. |
| **Supabase Realtime** | Signaling transport (SDP/ICE) + text chat — the app-level signaling WebRTC deliberately leaves unspecified. |

Full detail: `PGBATTLE_REALTIME_COMMS.md`.

---

## External services

- **Judge0** — code execution (self-host notes in `JUDGE0_SELF_HOST.md`).
- **Jina AI Reader** (`r.jina.ai`) — headless-browser proxy that clears Cloudflare on
  LeetCode's ranking API (edge functions + field builder). Optional `JINA_KEY`.
- **LeetCode GraphQL / ranking API** — contest + profile data.
- **Metered** (or any TURN provider) — TURN relay for cross-network calls.

---

## Tooling & CI

- **ESLint** (`npm run lint`) — no emoji, theme tokens only, hook rules.
- **`scripts/verify.js`** — single source of truth: build + lint + concept-parse + dev
  smoke (17 checks). If it isn't 17/17, the change isn't shippable.
- **GitHub Actions** (`.github/workflows/`) — build/lint on push; CodeQL code scanning.
- **Supabase CLI** — linked to the project; migrations via `supabase db query --linked`
  (or the Management API SQL endpoint), edge deploys via `supabase functions deploy`.

---

## Hard stack rules (from `CLAUDE.md`)

- **HashRouter, not BrowserRouter.** Static host, no SSR.
- **No `supabase.from()` in components** — everything through `src/lib/queries.js` (`qk.*`).
- **All schema changes = a numbered idempotent migration.**
- **Secrets via env vars only** (`.env` gitignored; service-role key only in scripts).
- **No emoji; theme tokens only (no hardcoded colors); the whole-page vertical scroll is
  the only allowed scrollbar.**
