# pushkalgupta.com

Personal portfolio of web applications — live at **[pushkalgupta.com](https://pushkalgupta.com)**

---

## Projects

### [onlineChess](onlineChess/) — Full-Featured Chess Platform

A production-grade chess application with real-time multiplayer, AI opponents, and comprehensive training tools.

**Stack:** React 18 | Vite 5 | Zustand | Supabase (Auth, Realtime, Edge Functions, PostgreSQL) | Stockfish 18 WASM

**Game Modes**
- Local play (human vs human on same device)
- vs Computer — 24 AI bots (100–2800 ELO) powered by minimax (strengths 1–6) and Stockfish WASM (7–10)
- Online multiplayer via Supabase Realtime with server-side move validation
- Peer-to-peer via WebRTC with QR code connection
- Spectate live games
- Swiss-format tournaments

**Training**
- Puzzle Rush, Streak, and Daily modes with Glicko-2 ratings across 21+ themes
- Opening trainer with Lichess Explorer API integration
- Endgame trainer with Syzygy 7-piece tablebase lookup
- Coordinate trainer, lessons, and AI coach

**Analysis**
- 4-pass Stockfish analysis (depth 12–22) with move classification (brilliant/best/good/inaccuracy/mistake/blunder)
- Opening explorer, board editor, PGN import/export
- Game import from Lichess and Chess.com accounts

**Infrastructure**
- 10 Zustand stores, 27 utility modules, 29 component directories
- 3 Supabase Edge Functions (move validation, rating updates, opening explorer proxy)
- 12 database migrations with Row-Level Security on all tables
- Web Workers for Stockfish and analysis (non-blocking UI)
- Code-split lazy routes (~570 KB main bundle)
- 12 time presets with Fischer increment, millisecond-precision timers
- 6 piece sets, board/background themes, 5 synthesized sound themes (Web Audio API)
- Dark/light mode, high contrast, reduced motion, adjustable piece scale

**Live:** [pushkalgupta.com/onlineChess](https://pushkalgupta.com/onlineChess/dist/index.html)

---

### [PGcode](PGcode/) — DSA Learning Platform

A structured Data Structures & Algorithms platform with interactive visualizations, spaced repetition, and live code execution.

**Stack:** React 19 | Vite 5 | Monaco Editor | ReactFlow | Judge0 CE API | Supabase (Auth, PostgreSQL)

**Features**
- Three-tier roadmap: 200 core / 300 interview prep / 500 mastery problems across 22 DSA topics in 7 learning tiers
- Interactive DAG roadmap showing prerequisite dependencies with per-topic progress tracking
- Monaco code editor with Python, JavaScript, and Java support
- Real-time code execution via Judge0 with per-test-case pass/fail results
- Multi-approach solutions with intuition, algorithm breakdown, complexity analysis, and code in 3 languages
- Step-by-step algorithm dry runs with 6 data structure visualizers (Array, Tree, Graph, LinkedList, Stack/Queue, HashMap)
- Embedded quiz questions within dry runs
- Spaced repetition review queue with confidence-based scheduling (1–30 day intervals)
- Progress tracking: completion status, SVG progress rings, 52-week activity calendar, streak counter
- Dark/light theme with custom design tokens (Lora, Space Mono, Inter fonts)

**Database:** 10 PostgreSQL tables with RLS — topics, edges, problems, templates, solution approaches, dry runs, questions, user progress, profiles, videos

**Live:** [pushkalgupta.com/PGcode](https://pushkalgupta.com/PGcode/dist/index.html)

---

### [PG](PG/) — Portfolio Homepage

Landing page with authentication and project navigation.

**Stack:** Vanilla JS | Supabase Auth (email + Google OAuth)

**Live:** [pushkalgupta.com](https://pushkalgupta.com/PG/main.html)

---

### [blog](blog/) — Blog

Personal blog with long-form essays.

**Stack:** Vanilla JS | Supabase Auth

**Posts:**
- *AI and the Lion's Cage* (March 2026)
- *The Architecture of Power* (April 2026)

**Live:** [pushkalgupta.com/blog](https://pushkalgupta.com/blog/blog.html)

---

### Smaller Projects

| Project | Description |
|---------|-------------|
| [chess](chess/) | Standalone chess game with basic AI (vanilla JS) |
| [PG.Quiz](PG.Quiz/) | Quiz application |
| [employeeSystem](employeeSystem/) | Employee management system |
| [studentSystem](studentSystem/) | Student management system |
| [PG.Web_Basics](PG.Web_Basics/) | 60+ HTML/CSS/JS exercises from a web development course |

---

## Shared Infrastructure

| Component | Details |
|-----------|---------|
| **Backend** | Single Supabase project shared across onlineChess, PGcode, PG, and blog |
| **Auth** | Email + Google OAuth via Supabase Auth |
| **Database** | PostgreSQL with Row-Level Security on all user tables |
| **Hosting** | GitHub Pages with custom domain (`pushkalgupta.com`) |
| **Routing** | Root `index.html` redirects to `PG/main.html` |

---

## Repository Structure

```
.
├── onlineChess/          # Chess platform (React + Supabase + Stockfish)
│   ├── src/
│   │   ├── components/   # 29 component directories
│   │   ├── store/        # 10 Zustand stores
│   │   ├── utils/        # 27 utility modules
│   │   ├── hooks/        # useComputerAI, useGameTimer
│   │   └── data/         # Bots, opening lines, lessons
│   ├── supabase/
│   │   └── functions/    # 3 Edge Functions (Deno/TypeScript)
│   └── dist/             # Production build
│
├── PGcode/               # DSA learning platform (React + Monaco + Judge0)
│   ├── src/
│   │   ├── components/   # 22 components + 6 renderers
│   │   ├── lib/          # Supabase client, code runner, driver code
│   │   └── styles/       # Design tokens (dark/light themes)
│   ├── scripts/          # SQL migrations and seed data
│   └── dist/             # Production build
│
├── PG/                   # Portfolio homepage
├── blog/                 # Blog
├── chess/                # Simple chess game
├── PG.Quiz/              # Quiz app
├── PG.Web_Basics/        # Web dev exercises
├── employeeSystem/       # Employee management
├── studentSystem/        # Student management
├── supabase/             # Shared Supabase config
│
├── index.html            # Root redirect → PG/main.html
├── CNAME                 # Custom domain config
├── .nojekyll             # Bypass Jekyll on GitHub Pages
└── LICENSE               # MIT
```

---

## Local Development

Both major projects use Vite:

```bash
# onlineChess
cd onlineChess
npm install
npm run dev       # http://localhost:5173

# PGcode
cd PGcode
npm install
npm run dev       # http://localhost:5173
```

PGcode requires a `.env` file — copy `.env.example` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

onlineChess Supabase Edge Functions require the [Supabase CLI](https://supabase.com/docs/guides/cli) for local development.

---

## License

[MIT](LICENSE)
