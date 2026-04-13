<p align="center">
  <img src="public/images/logo.png" alt="PG.Chess" width="64" />
</p>

<h1 align="center">PG.Chess</h1>

<p align="center">
  A full-featured online chess platform built with React, Vite, and Supabase.
  <br />
  Play online, challenge 24 AI opponents, solve puzzles, analyze games, and compete in tournaments.
  <br /><br />
  <a href="https://pushkalgupta.com/onlineChess/dist/index.html"><strong>Live Demo</strong></a>
</p>

---

## Highlights

- **6 game modes** -- Local, vs Computer (24 bots), Online Multiplayer, Peer-to-Peer, Tournaments, Spectate
- **Real-time multiplayer** -- Supabase Realtime with server-side move validation
- **Stockfish 18 WASM** -- Runs locally in a Web Worker for AI and 4-pass game analysis
- **Glicko-2 rating system** -- Server-authoritative ratings across bullet, blitz, rapid, classical
- **Puzzle training** -- Rated, Rush, Streak, Daily, and 21+ theme categories
- **Opening explorer** -- Lichess database integration with win/draw/loss stats
- **Millisecond-precision timers** -- 12 time presets with Fischer increment support
- **Code-split** -- Lazy-loaded routes, ~570KB main bundle

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, CSS Modules |
| Build | Vite 5 |
| State | Zustand (10 stores) |
| Chess Logic | chess.js |
| AI Engine | Stockfish 18 WASM (Web Worker) |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Edge Functions) |
| Routing | react-router-dom 7 (HashRouter) |
| Charts | uplot |
| P2P | WebRTC + QR codes (qrcode.react, html5-qrcode) |
| Testing | Vitest |

---

## Quick Start

```bash
# Clone
git clone https://github.com/Pushkal-Gupta/onlineChess.git
cd onlineChess

# Install
npm install

# Development
npm run dev        # http://localhost:5173

# Production build
npm run build      # Output in dist/

# Preview production build
npm run preview

# Run tests
npm run test
```

---

## Project Structure

```
src/
  components/           # 41 React components
    Board/              # Chess board rendering + move animations
    Cell/               # Individual squares with drag-and-drop
    AnalysisBoard/      # Game analysis, opening explorer, board editor
    Puzzles/            # Puzzle modes (Rated, Rush, Streak, Daily)
    OnlineLobby/        # Online matchmaking + room creation
    P2PPlay/            # WebRTC peer-to-peer games
    Tournaments/        # Swiss-format tournament system
    Clubs/              # Club management
    Friends/            # Social features
    Spectate/           # Watch live games
    Training/           # Coordinate trainer
    Settings/           # User preferences
    Chat/               # In-game messaging
    modals/             # Login, GameOver, Promotion, Confirm dialogs
    ...
  store/                # 10 Zustand stores
    gameStore.js        # Board state, timers, moves, game modes
    authStore.js        # Supabase authentication
    puzzleStore.js      # Puzzle system + Glicko-2 puzzle rating
    matchmakingStore.js # Auto-matchmaking with expanding rating window
    ratingStore.js      # Player ratings (bullet/blitz/rapid/classical)
    themeStore.js       # Board themes, piece sets, colors
    prefsStore.js       # User preferences (persisted to localStorage)
    friendStore.js      # Friend relationships
    tournamentStore.js  # Tournament brackets + Swiss pairings
    notificationStore.js
  hooks/                # Custom React hooks
    useComputerAI.js    # AI move generation (local + Stockfish)
    useGameTimer.js     # High-frequency timer (100ms ticks)
  utils/                # 23 utility modules
    analysisEngine.js   # 4-pass Stockfish analysis (depth 12-22)
    reviewEngine.js     # Move classification (brilliant/blunder/etc)
    glicko2.js          # Glicko-2 rating algorithm
    multiplayerService.js # Supabase Realtime room management
    openingExplorer.js  # Lichess Explorer API with proxy fallback
    soundManager.js     # Web Audio API synthesis (no external files)
    stockfishEngine.js  # Stockfish WASM worker interface
    localAI.js          # Minimax AI for strength 1-6
    swissPairing.js     # Swiss tournament pairing algorithm
    tablebaseService.js # 7-piece endgame tablebase (Lichess API)
    serverMoveService.js    # Edge Function client for move validation
    serverRatingService.js  # Edge Function client for rating updates
    ...
  data/
    bots.js             # 24 AI opponents (100-2800 rating)

supabase/
  functions/
    validate-move/      # Server-side move validation (chess.js + timing)
    update-rating/      # Server-side Glicko-2 computation
    opening-explorer/   # Lichess Explorer API proxy
  migration_v1-v12.sql  # Database schema (12 migrations)
```

---

## Game Modes

### Local Play
Pass-and-play on the same device with full time controls.

### vs Computer
24 bot personalities from Snaily (100 ELO) to Stockfish (2800 ELO). Strength 1-6 uses a local minimax engine; strength 7-10 uses Stockfish 18 WASM. Each bot has a unique personality with custom win/loss/draw messages.

### Online Multiplayer
Real-time games via Supabase Realtime channels. Features:
- Auto-matchmaking with expanding rating window (200 -> 400 -> 800 -> unlimited)
- Private rooms with 6-character codes
- In-game chat
- Undo request/response protocol (max 2 per player)
- Server-side move validation via Edge Functions
- Server-authoritative timing

### Peer-to-Peer
WebRTC-based games with no server required. Share a connection via QR code or JSON. Uses Google STUN for NAT traversal.

### Tournaments
Swiss-format tournaments with automatic pairing, rating-based seeding, bye allocation, and multi-round support.

### Spectate
Watch live public games in real-time with a read-only board view.

---

## Analysis

- **4-pass Stockfish analysis** -- Progressive depth (12 -> 15 -> 18 -> 22) with real-time progress
- **Move classifications** -- Brilliant, Best, Excellent, Okay, Inaccuracy, Mistake, Blunder, Theory
- **Per-phase accuracy** -- Opening, middlegame, endgame breakdown
- **Evaluation chart** -- Visual eval graph with click-to-seek
- **Opening explorer** -- Lichess database (millions of games) with win rates and top continuations
- **Endgame tablebase** -- 7-piece lookup via Lichess API
- **Import games** -- From Chess.com, Lichess, or PGN text
- **Board editor** -- Custom position setup with FEN input

---

## Puzzles

- **Rated** -- Glicko-2 puzzle rating with 21+ tactical themes
- **Rush** -- Solve as many as possible in 3-5 minutes (up to 3 strikes)
- **Streak** -- Difficulty ramps with each correct answer
- **Daily** -- One new puzzle per day
- **Themes** -- Fork, pin, skewer, discovered attack, mate-in-N, and more
- **Review** -- Step through solutions with move highlighting
- **Rating chart** -- Track puzzle rating progress over time

---

## Architecture

### State Management
10 Zustand stores with selective subscriptions to minimize re-renders. Game state, auth, themes, ratings, matchmaking, puzzles, friends, tournaments, notifications, and preferences each have dedicated stores.

### Server-Side Security (Supabase Edge Functions)
- `validate-move` -- Validates every online move server-side with chess.js. Prevents client-side cheating. Manages server-authoritative timing with Fischer increment.
- `update-rating` -- Computes Glicko-2 ratings server-side with atomic double-rating prevention. Clients cannot manipulate their own ratings.
- `opening-explorer` -- Proxies Lichess Explorer API with server-side authentication and 1-hour caching.

### Real-Time
Supabase Realtime Broadcast channels for move sync, chat, resign, draw offers, and undo requests. No custom WebSocket server needed.

### Performance
- Code-split with `React.lazy` -- 14 route chunks loaded on demand
- Stockfish runs in a dedicated Web Worker (non-blocking)
- Analysis runs in a separate Web Worker
- Millisecond-precision timers via `performance.now()` delta tracking
- LRU caches for Stockfish evaluations (300 positions) and opening data (500 entries)

---

## Theming

- **Dark / Light mode** with full CSS variable system
- **6 piece sets** -- Classic, Default, Virtual, Cartoon, Wooden, Wooden2
- **Board themes** -- Color-based (customizable RGB) and image-based
- **Background themes** -- Default, Wood, Ocean, Forest, Slate
- **5 sound themes** -- Synthesized via Web Audio API (no external audio files)
- **Accessibility** -- Reduced motion, high contrast, and adjustable piece scale

---

## Database

12 PostgreSQL migrations via Supabase:

| Migration | Purpose |
|-----------|---------|
| v1 | Core tables: chess_rooms, chess_games, user_ratings |
| v2 | Matchmaking queue with atomic pair-claiming RPC |
| v3 | User profiles |
| v4 | Puzzles with themes and ratings |
| v5 | Spectating |
| v6 | Friendships |
| v7 | Leaderboard snapshots |
| v8 | Tournaments with Swiss pairings |
| v9 | Clubs |
| v10 | Puzzle system overhaul |
| v11 | Theme preferences |
| v12 | Server-side timing columns |

Row-Level Security (RLS) on all tables. Users can only read/write their own data.

---

## Environment

The app uses two Supabase secrets (set via `supabase secrets set`):

| Secret | Purpose |
|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase runtime for Edge Functions |
| `LICHESS_API_TOKEN` | Lichess Explorer API authentication |

The public Supabase anon key is in the client code (standard for SPAs with RLS).

---

## Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint
npm run test      # Vitest (69 tests)
```

---

## License

MIT

---

Built by [Pushkal Gupta](https://pushkalgupta.com)
