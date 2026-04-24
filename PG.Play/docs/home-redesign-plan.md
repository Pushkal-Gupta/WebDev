# PG.Play — home redesign plan

*The home surface upgrade that shipped with this pass. Pairs with
`ui-audit.md` (the before) and `game-page-redesign-plan.md`.*

## Goal

Make the home screen feel like a curated arcade — not a grid. Keep
the brand dark and minimal, but give the eye rhythm: one cinematic
hero, one differentiated rail per section, one big asymmetric
Editor's picks block, and a tight filter grid at the bottom.

## What changed (file-level)

- **`src/components/FeaturedHero.jsx`** — rebuilt as a cinematic
  split layout. Left copy column has eyebrow + kicker + serif title
  + tagline + story + chip row + CTA stack. Right art column is a
  tilted cover with a radial glow behind it and a thin brand-tinted
  frame. Chips surface player count, device label, session length,
  skill tags. Secondary CTA is "Save" (heart), tertiary is the
  personal-best stat.
- **`src/components/Card.jsx`** — added skill chips, New/Original
  badges, a device pill, a gradient shade that darkens on hover, and
  size variants (`card-sm`, `card-wide`) for rail differentiation.
- **`src/components/Sidebar.jsx`** — new Collections group under
  Browse surfacing 5 curated entries directly (Originals, New &
  updated, Pass the laptop, Mobile friendly, Fast twitch). Active
  state now uses a left accent bar (2px) alongside the bg tint.
- **`src/App.jsx`** — expanded `HOME_RAILS` from 2 to 6 curated
  collections plus a "Because you played X" computed rail and an
  Editor's picks asymmetric grid. Added collection routing so the
  sidebar items filter the main grid. Added `EDITORS_PICKS` data.
- **`src/data.js`** — new `sessionLength`, `isOriginal`, `updated`
  fields. Two new collections: `originals`, `new-updated`. Editor's
  picks export. Swap `football` → `goalbound`. Moved `featured` from
  `fbwg` (unplayable stub) to `goalbound` (the new flagship).
- **`src/components/Collection.jsx`** — added a "See all" subtle
  button that filters the main grid via `onOpenAll`.
- **`src/App.jsx` topbar** — pill search with `⌘K` hint + focus glow
  and a clear button. Mobile-only quick-filter chip row under the
  topbar (sidebar is off-canvas below 900px).
- **`src/styles.css`** — new tokens (motion-slow, spring, stagger),
  semantic surface tiers, `.chip`, `.btn-lg`, `.btn-subtle`, hero
  composition, editor-picks grid, sidebar accent bar, pill search.

## Rail sequence (top to bottom)

1. Featured hero — cinematic header with cover + CTAs.
2. Continue playing — recent session stack, preserved.
3. Editor’s picks — asymmetric 4-tile grid. Hand-curated.
4. Because you played X — computed from the last-played game's cat
   and skill tags (top 6 by overlap).
5. Originals — PG.Play's own games.
6. Pass the laptop — local versus.
7. Mobile friendly — `mobileSupport: 'native'` titles.
8. Fast twitch — movement/aim/reflex.
9. Brainy — planning-heavy.
10. Mean but funny — rage picks.
11. Main grid — filter-aware tiles.

Each rail has a kicker eyebrow + title (+ blurb for collections) and
a count. Every other rail could still be promoted to a
`card-wide`-first treatment if the roster grows.

## Mobile strategy

The sidebar collapses to an off-canvas drawer below 900px. To keep
fast navigation one-thumb-reachable, the quick-filter chip row under
the topbar (only visible < 900px) holds the 5 primary filters
horizontally scrollable.

## Not in this pass

- Live-preview card hovers (video/lottie).
- Personalized "for you" rails derived from bests/achievements.
- Search type-ahead.
- "Last week's top scorers" leaderboard rail.
