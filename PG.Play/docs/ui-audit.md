# PG.Play — UI audit (pre-upgrade snapshot)

*Snapshot written at the start of the premium redesign pass. Pairs with
`home-redesign-plan.md`, `game-page-redesign-plan.md`, and the Goalbound
and mobile notes. Lives in `docs/` alongside `platform-audit.md`.*

## The pitch

PG.Play already has a coherent dark aesthetic, a disciplined token
system, and a modular component tree. What it didn't have — before this
pass — was editorial weight on the home page, a real play shell, and an
honest name on the football title.

This audit lists what was weak; the sibling docs describe what the pass
changed.

## Home surface — before

- **Hero** (`components/FeaturedHero.jsx`) was a passive 2-column card.
  One primary CTA, one heart, no support labels, no motion, no depth.
- **Rails** exposed only two of the six curated collections in
  `data.js` — the rest never surfaced. No "Mobile-friendly", no "New &
  updated", no "Because you played X", no "Editor’s picks".
- **Cards** (`components/Card.jsx`) were identical 3:4 tiles with one
  metadata line. No skill-tag chips, no device badge, no continue-ring.
- **Topbar** was a flat strip with a stretched search input. No focus
  glow, no quick-filter chips, no keyboard hint.
- **Sidebar** (`components/Sidebar.jsx`) had `Browse` + `Library` only.
  Active state was a bg tint. No accent bar, no Collections group.

## Game page — before

- `GameIntro.jsx` wrapped every game in `.play-topbar` (Back + title) +
  `.play-stage` (flex-centered game). No Pause/Restart/Help/Mute/
  Fullscreen. Games sat in a void.
- Overlays (pause/help/end) were re-invented per-game or skipped.
- `docs/mobile-support-matrix.md` already called out a missing shared
  virtual-controls layer; `src/input/useVirtualControls.jsx` had been
  drafted in parallel with bindings for six games but wasn't surfaced
  by the shell.
- No "Best on desktop" hint when a desktop-only title was opened on a
  phone.

## Design system — before

- Tokens were good (4px scale, 3 radii, 3 shadows, 2 motion durations)
  but missing semantic surface tiers, motion vocabulary, and a
  `prefers-reduced-motion` guard.
- Buttons covered primary/ghost/icon/sm. No `btn-lg`, no `btn-subtle`,
  no `btn-tool` for the new shell toolbar. No chip primitive.
- Icons were hand-picked in `src/icons.jsx` — missing pause, restart,
  help, mute, volume, fullscreen, kick, trophy, sparkle.

## Football — before

- `data.js:football` was metadata-only with IP-risk name ("Football
  Legends") and a 2v2 tagline that pointed directly at an existing
  franchise.
- No game component. Cover art existed but used a literal grass-green
  pitch with a red figure.

## Scoped out intentionally

- Rebuilding existing playable games wholesale — each works; the shell
  wraps them. Migration to in-shell HUDs is incremental.
- Theme system changes — cyan/teal accents stay. Light theme keeps
  parity.
- Supabase schema — no changes needed. Goalbound logs to
  `pgplay_scores` with the id `goalbound`.
