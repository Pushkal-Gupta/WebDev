# PGcode

A curated DSA learning platform that takes you from fundamentals to interview-ready. Not another problem dump — a structured system of ~200–500 problems designed to build pattern recognition, not memorization.

**Live:** [pushkalgupta.com/PGcode](https://pushkalgupta.com/PGcode/dist/index.html)

---

## Why PGcode?

Most people fail DSA interviews after solving 300+ problems because they memorize solutions instead of learning patterns. PGcode fixes this with:

- **Curated progression** — 200 / 300 / 500 problem tiers that build on each other
- **Visual roadmap** — interactive DAG showing prerequisite dependencies between 22 topics
- **Interactive dry runs** — step-through algorithm visualizations with embedded quiz questions
- **Spaced repetition** — review queue surfaces problems before you forget them
- **Pattern tags** — every problem tagged with its algorithmic technique, not just its topic
- **Full workspace** — Monaco editor, 3-language support, real code execution via Judge0

## Screenshots

### Roadmap View
Interactive 7-tier learning graph with progress tracking per topic.

### Problem Workspace
LeetCode-style split-pane editor with description, solutions, test cases, and live execution.

### Problem List
Filterable table across all topics with pattern tags, difficulty toggles, and status tracking.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite |
| Visualization | ReactFlow (roadmap DAG), Custom renderers (Array, Tree, Graph, LinkedList, Stack, HashMap) |
| Code Editor | Monaco Editor |
| Code Execution | Judge0 CE API (Python, JavaScript, Java) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Icons | Lucide React |
| Styling | Custom CSS with design tokens (no framework) |

## Project Structure

```
PGcode/
├── src/
│   ├── App.jsx                    # Routes + global state
│   ├── main.jsx                   # React entry point
│   ├── components/
│   │   ├── RoadmapView.jsx        # Interactive ReactFlow DAG
│   │   ├── Workspace.jsx          # Code editor + test runner
│   │   ├── ProblemList.jsx        # Filterable problem table
│   │   ├── ReviewQueue.jsx        # Spaced repetition queue
│   │   ├── TopicModal.jsx         # Problem list drawer per topic
│   │   ├── TopicNode.jsx          # Custom ReactFlow node
│   │   ├── SidePanel.jsx          # Progress ring, calendar, streaks
│   │   ├── SubNav.jsx             # Route navigation bar
│   │   ├── SolutionView.jsx       # Multi-approach solution viewer
│   │   ├── DryRunViewer.jsx       # Step-by-step algorithm visualizer
│   │   ├── LearningsSection.jsx   # Concept content per topic
│   │   ├── Navbar.jsx             # Header with auth + theme toggle
│   │   ├── LoginModal.jsx         # Email/Google OAuth
│   │   ├── AccountModal.jsx       # User account management
│   │   ├── SettingsModal.jsx      # App settings
│   │   └── renderers/             # Data structure visualizers
│   │       ├── ArrayRenderer.jsx
│   │       ├── TreeRenderer.jsx
│   │       ├── GraphRenderer.jsx
│   │       ├── LinkedListRenderer.jsx
│   │       ├── StackQueueRenderer.jsx
│   │       └── HashMapRenderer.jsx
│   ├── lib/
│   │   ├── supabase.js            # Supabase client init
│   │   ├── codeRunner.js          # Judge0 API wrapper
│   │   └── driverCode.js          # Test case wrapping + codegen
│   └── styles/
│       ├── theme.css              # Design tokens (dark + light mode)
│       └── Workspace.css          # Editor layout styles
├── scripts/                       # SQL migrations, seed data, verifiers
├── public/                        # Static assets (favicon, icons)
├── index.html                     # Entry HTML
├── vite.config.js                 # Vite configuration
└── package.json
```

## Features

### Three-Tier Roadmap (200 / 300 / 500)
Progressive difficulty tiers — start with 200 core problems covering every pattern, expand to 300 for interview fluency, then 500 for mastery.

### 22 Topics Across 7 Learning Tiers

| Tier | Topics |
|------|--------|
| Foundation | Arrays & Hashing, Strings |
| Linear Structures | Stack, Queue, Linked List |
| Pattern Discovery | Two Pointers, Binary Search, Sliding Window |
| Hierarchical Systems | Trees, Tries, Graphs, Heaps |
| Recursive Optimization | Recursion, DP, Backtracking, Greedy, Intervals |
| Expert Design | 2D DP, Advanced Graphs |
| Mathematical Synthesis | Math, Bit Manipulation, Geometry |

### Interactive Dry Run Visualizer
Step-through algorithm execution with auto-play, speed control, and inline quiz questions. Six specialized renderers for different data structures.

### Spaced Repetition
After solving a problem, rate your confidence (1–5). The system schedules reviews:
- Confidence 1 → review in 1 day
- Confidence 3 → review in 7 days
- Confidence 5 → review in 30 days

The Review Queue page surfaces all problems due for review.

### Pattern Recognition
Every problem is tagged with its algorithmic patterns (e.g., `two-pointer`, `monotonic-stack`, `sliding-window`). After solving, a Pattern Breakdown panel shows primary/secondary patterns and links to similar problems.

### Workspace
- Monaco code editor with Python, JavaScript, and Java support
- Real-time code execution via Judge0 CE
- Per-test-case pass/fail results
- Solve timer with tab-pause
- Next/Previous problem navigation within topics
- Success animation on accepted submissions

### Progress Tracking
- Completion status and star/bookmark per problem
- SVG progress ring with difficulty breakdown
- Activity calendar with solve dates
- Current and best streak tracking
- "Continue Where You Left Off" section

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### Setup

```bash
# Clone
git clone https://github.com/Pushkal-Gupta/PGcode.git
cd PGcode

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key:
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key

# Run database migrations (in Supabase SQL Editor)
# 1. Run seed_data.sql (topics + edges + initial problems)
# 2. Run migrate_v2.sql (user progress, profiles, friends)
# 3. Run scripts in scripts/ for full problem catalog

# Start dev server
npm run dev
```

### Build

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `PGcode_topics` | 22 DSA topics with tier positions |
| `PGcode_roadmap_edges` | Prerequisite dependencies between topics |
| `PGcode_problems` | Problems with descriptions, test cases, tags, difficulty |
| `PGcode_problem_templates` | Starter code per language |
| `PGcode_solution_approaches` | Multiple solution strategies with code in 3 languages |
| `PGcode_interactive_dry_runs` | Step-by-step visualization data |
| `PGcode_interactive_questions` | Quiz questions embedded in dry runs |
| `PGcode_user_progress` | Per-user completion, stars, confidence, review schedule |
| `PGcode_profiles` | Streak tracking and user stats |
| `PGcode_topic_videos` | Learning videos per topic |

All user data is protected with Row Level Security — users can only access their own progress.

---

## Design System

| Token | Dark | Light |
|-------|------|-------|
| Background | `#030a0a` | `#f5f2ed` |
| Surface | `#061010` | `#ffffff` |
| Accent | `#00fff5` | `#008a7e` |
| Text | `#ffffff` | `#1a1a1a` |
| Easy | `#4caf50` | `#4caf50` |
| Medium | `#f0a500` | `#f0a500` |
| Hard | `#ef4444` | `#ef4444` |

Fonts: **Lora** (serif, branding) · **Space Mono** (monospace, UI) · **Inter** (sans, body)

---

## License

This project is proprietary. All rights reserved.

---

Built by [Pushkal Gupta](https://pushkalgupta.com)
