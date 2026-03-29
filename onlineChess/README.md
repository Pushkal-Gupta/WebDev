# PG.Chess (Online)

A full-featured online chess application built with React 18 and Vite. Play locally against a friend, challenge the Stockfish AI engine, or review your saved games — all in a clean dark-themed interface.

---

## Features

### Core Gameplay
- Full 8×8 chess board with legal move validation (via chess.js)
- Click-to-move and drag-and-drop piece movement
- Valid move highlighting with customisable dot indicators
- Last move highlighting
- Selected piece highlighting
- King highlight when in check
- Pawn promotion dialog (Queen, Rook, Bishop, Knight)
- Flip board button
- Row and column labels (toggleable)

### Time Controls
- Bullet: 1 min, 1|1
- Blitz: 2|1, 3 min, 3|2
- Rapid: 5 min, 10 min, 15|10
- Classical: 30 min
- Per-move time increment support
- Countdown timers for both players with low-time warning

### Game Modes
- **Local 2-player** — pass-and-play on the same device
- **vs Computer** — powered by the Stockfish API (10 strength levels, choose White / Black / Random)

### Board and Visual Customisation
- **Themes**: Default, Chess.com style, Lichess style
- Custom colour pickers for light/dark squares, highlight, check, and last-move colours
- **Piece sets**: Classic, Default, Virtual, Cartoon, Wooden, Wooden2
- Move indicator dot size slider

### Game Management
- Full PGN export and copy to clipboard
- PGN import (paste and load any game)
- Undo / Redo moves
- Move history table with click-to-navigate
- First / Prev / Next / Last navigation buttons
- Captured pieces display with material advantage counter

### Auth and Cloud (Supabase)
- Shared session with other PG sites (blog, home page)
- Sign up / Login / Logout modals
- Persistent login via onAuthStateChange

### Game Storage
- Completed games automatically saved to the PG Chess server (when logged in)
- Analysis tab: browse and replay all saved games

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| State Management | Zustand 4 |
| Chess Logic | chess.js 1 |
| Auth and Backend | Supabase |
| Styling | Pure CSS Modules |
| AI Engine | Stockfish (remote API) |

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Building for Production

```bash
npm run build
```

Output is placed in the `dist/` directory. Preview the production build locally with:

```bash
npm run preview
```

---

## Deployment Notes

The `vite.config.js` sets `base: './'` so the app works when served from any sub-path (e.g. GitHub Pages).

For GitHub Pages deployment, push the contents of `dist/` to the `gh-pages` branch, or use the `gh-pages` npm package:

```bash
npm install -D gh-pages
# Add to package.json scripts: "deploy": "gh-pages -d dist"
npm run build && npm run deploy
```

If hosting at a custom sub-path (e.g. `/onlineChess/`), update `base` in `vite.config.js` accordingly.

---

## Project Structure

```
src/
  components/
    Board/          Chess board rendering
    Cell/           Individual board squares with drag and drop
    Navbar/         Top navigation bar
    LeftSidebar/    Board settings, move settings, game settings
    RightSidebar/   Player info, timers, move history, navigation
    Timer/          Countdown timer component
    modals/         All modal dialogs (login, game over, promotion, etc.)
  store/
    gameStore.js    Zustand store — board, moves, timers, AI settings
    authStore.js    Zustand store — Supabase user session
    themeStore.js   Zustand store — colours, piece set
  utils/
    stockfish.js    Stockfish API call with retry logic
    gameServer.js   Save and retrieve games from PG Chess server
    supabase.js     Supabase client initialisation
  App.jsx           Root component and routing logic
  App.css           Global dark theme styles
  main.jsx          Entry point
public/
  images/           Chess piece images (6 sets) and board assets
```
