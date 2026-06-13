# PG.Play — working notes for Claude

A hand-built arcade. React + Vite + Three.js. One repo, ~22 self-contained games, a single home screen, no required login.

**Read `docs/llm-wiki.md` before exploring.** It carries the game id↔folder map, renderer contracts, the puppeteer verify harness, debug handles, and hard-won gotchas. Keep it updated when contracts change.

## Golden rules

- **Don't destroy what's been built.** Prefer minimum-risk refactors. If a public file path or import is load-bearing, keep it stable and move implementation behind it (see the shim pattern below).
- **No emoji anywhere.** Code uses named Lucide icons (`Icon.search`, `Icon.menu`, etc.). When referring to icons in chat, name them — don't paste the glyph.
- **No secrets in code.** Anything sensitive goes through env vars; never hardcode keys, tokens, or service URLs that carry credentials.
- **Don't auto-commit.** Stop after the change and surface a commit message; the user runs `git commit` themselves.

## Per-game module shape

Every game in `src/games/` is a re-export shim, not the implementation:

```
src/games/
  FrostFightGame.jsx          <- 4-line shim
  frost-fight/
    index.jsx                 <- actual game
    ui/, utils/, assets/      <- game-local helpers
```

The shim is exactly:

```jsx
// Re-export shim. The implementation lives under `src/games/<folder>/`.
// Keeps the lazy import in src/components/GameIntro.jsx working unchanged.

export { default } from './<folder>/index.jsx';
```

Why the shim: `src/components/GameIntro.jsx` `lazy()`-imports each game by its capitalised filename. Keeping the filename stable means we can reorganise internals freely without touching the loader or the build's chunk names.

When moving a monolith into a folder, two import rewrites apply inside the moved file:
- `from '../X'` → `from '../../X'` (one dir deeper now)
- `from './<folder>/X'` → `from './X'` (sibling, not nested)

## Build & test chain

`npm run build` triggers `prebuild` which runs `validate:catalog && test`. A green `vite build` therefore means the catalog validator and the vitest suite also passed. Don't bypass `prebuild`.

Useful scripts:
- `npm run dev` — Vite dev server
- `npm run test` / `npm run test:watch` — vitest
- `npm run validate:catalog` — checks `src/data/games.js` against assets on disk
- `npm run optimize:covers` — sharp pass over cover art
- `npm run deploy` — repo's own deploy pipeline
- Era Siege has its own asset pipeline: `sim:` / `bake:` / `import:` / `verify:` / `library:era-siege`

## Layout / navigation conventions

- **Sidebar (`src/components/Sidebar.jsx`) is the primary nav.** It owns the brand mark, search pill, genre filters, and account block.
- **Brand link.** The "PG.Play" wordmark at the top of the sidebar links to `https://pushkalgupta.com/PG/main.html`, matching the convention in `onlineChess`, `blog`, and `PGcode`. Don't add a second brand mark in the topbar.
- **Topbar (`.main-topbar` in `src/pages/Home.jsx`).** Holds the hamburger and the avatar / Sign-in. Uses `marginInlineStart: auto` on the right-side control to pin it — `.main-topbar` has `gap` but no `justify-content`, so the auto-margin is what does the right-alignment.
- **Search entry points.** Sidebar pill, hero "Browse all" CTA, and the ⌘K shortcut wired in `App.jsx`. All three open the same palette. Don't add a fourth — the duplicate topbar pill has already been removed once.

## Game integration checklist

When wiring a new game in:
1. Implementation goes under `src/games/<kebab-name>/index.jsx`.
2. Add the capitalised shim at `src/games/<PascalName>Game.jsx`.
3. Register it in `src/data/games.js` (catalog validator will yell if you forget).
4. Add a `lazy()` line in `src/components/GameIntro.jsx`.
5. Drop cover art in `public/games/<kebab-name>/` and run `npm run optimize:covers`.
6. Run `npm run build` — the prebuild chain confirms catalog + tests + build all pass.

## Era Siege specifics

The Era Siege asset pipeline (`scripts/era-siege-*.mjs`) is complete. Six background sheets are still pending generation — surface this if the user picks the work back up.

## What lives where

- `src/pages/Home.jsx` — home screen, hero, grid, topbar layout
- `src/components/Sidebar.jsx` — left nav, brand, search trigger
- `src/components/GameIntro.jsx` — per-game lazy loader and intro modal
- `src/data/games.js` — game catalog (titles, slugs, covers, categories)
- `src/styles.css` — single global stylesheet, broken into thematic sections
- `scripts/` — build, validation, and Era Siege pipeline tooling
- `public/games/<slug>/` — per-game public assets (covers, sprites, audio)
- `dist/` — build output, committed (the deploy script reads it)
