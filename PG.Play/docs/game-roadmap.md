# PG.Play — game roadmap

*Build order. Honest about complexity. Names are "original title inspired by X"
unless the title is already original IP (Slipshot, Grudgewood, Nightcap, Arena,
Raycaster FPS).*

## Wave 1 — library completion, touch-first (≈2 sessions)

Goal: remove every `PlayPlaceholder` on mobile-native genres. These share the
Canvas-2D + `requestAnimationFrame` pattern already used by Cut the Rope,
2048, Stickman Hook.

| Priority | Working name | Inspired by | Status | Complexity | Session unit |
|---|---|---|---|---|---|
| 1.1 | **Slither-lite** | Slither.io | *this session* | low | 1 |
| 1.2 | **Loft Defense** | Bloons-style TD | stub | medium | 1 |
| 1.3 | **Hoop Shot** | Basket Champs | stub | low | 0.5 |
| 1.4 | **Short Order** | Papa's Pizzeria | stub | medium | 1 |
| 1.5 | **Era Lane** | Age of War | stub | medium | 1 |

Deliverables: five new `*.jsx` game files; `data.js` entries flipped to
`playable: true` with original names; covers updated; achievements wired.

## Wave 2 — mobile adaptation layer (1 session)

Goal: no new games — make the existing ones phone-playable.

- New module: `src/input/useVirtualControls.jsx` + `<VirtualControls/>` overlay
  with left-thumb d-pad and right-thumb action buttons; slot config per game.
- Adapt: Grudgewood, Nightcap, Arena, Stickman Hook. Raycaster FPS goes behind
  the virtual-controls feature flag.
- Add **"Best on desktop"** banner inside `GameIntro` when the registry says
  `mobileSupport === 'desktop-only'` AND viewport is < 820px.
- Add mobile badge on cards.

## Wave 3 — deeper action titles (≈2 sessions)

Higher fidelity required. Expect one game per half-session of focused work.

| Priority | Working name | Inspired by | Complexity |
|---|---|---|---|
| 3.1 | **8-Ball** (keep, expand) | 8-Ball Pool | finish AI, aim-assist polish |
| 3.2 | **Night Shift** | Bob the Robber | medium (stealth: guards, cones, doors) |
| 3.3 | **Trace** | Vex-like | medium (wall-jump, saws, restart-fast feel) |
| 3.4 | **Street Kick** | Football Legends | high (ragdoll-ish 1v1 local) |

## Wave 4 — flagship co-op / physics (≈2 sessions)

The hardest titles to ship well. They deserve dedicated sessions — not shared.

| Priority | Working name | Inspired by | Why it's hard |
|---|---|---|---|
| 4.1 | **Ember & Tide** | Fireboy & Watergirl | two-character same-keyboard puzzles; level design is the work, not the engine |
| 4.2 | **Frost Fight** | Bad Ice Cream | co-op maze-action; AI bots for solo if no second player |
| 4.3 | **Faceplant** | Happy Wheels-like | ragdoll physics tuning is a craft problem |

## Shared engines (extracted when second game in a genre lands)

Don't extract engines upfront — do it on the second instance. Likely
candidates after Wave 1/2:

- **`src/engines/platformer2d.js`** — shared gravity/AABB/coyote+buffer used
  by Grudgewood, Nightcap, eventually Vex, Bob, Happy Wheels.
- **`src/engines/td.js`** — lane/path iteration + tower placement grid for
  Loft Defense (Wave 1.2). Reusable for Era Lane and future TD titles.
- **`src/engines/sports2d.js`** — trajectory + gravity + scoring for
  Hoop Shot + Street Kick + the eventual Football sequel.
- **Already real:** 3D engine baked inside `SlipshotGame.jsx` (Three.js);
  a `src/engines/fps3d.js` extraction only makes sense if we add a second
  3D game.

## IP-safety renames (must happen before Wave 1.2 ships)

| Current id | Current name | Proposed original |
|---|---|---|
| bloons | Bloons TD | **Loft Defense** |
| papa | Papa's Pizzeria | **Short Order** |
| basket | Basket Champs | **Hoop Shot** |
| football | Football Legends | **Street Kick** |
| aow | Age of War 2 | **Era Lane** |
| slither | Slither.io | **Slither-lite** *(internal placeholder; rename to `Coil` or similar before public launch)* |
| vex | Vex | **Trace** |
| bob | Bob the Robber | **Night Shift** |
| fbwg | Fireboy & Watergirl | **Ember & Tide** |
| badicecream | Bad Ice Cream | **Frost Fight** |
| happywheels | Happy Wheels | **Faceplant** |

Each rename also gets original story copy, original cover palette, and an
original game-feel pass — the same treatment Slipshot (← KrunkerLite) and
Grudgewood (← TreesHateYou) already got.

## Platform features to ship alongside game waves

| After Wave | Platform addition |
|---|---|
| 1 | Proper game detail page (react-router or view-state split); controls visualization per game |
| 2 | Mobile-supported badge on cards; "best on desktop" intro banner |
| 2 | Challenge of the Day — daily-seed modifier on one game |
| 3 | Score history sparkline per game in ProfilePanel |
| 3 | Leaderboard view (top 10 from `pgplay_scores`) per game |
| 4 | Seasonal collections rotating every 4 weeks from a `SEASONS` table |

## Non-goals (saying no on purpose)

- Gamepad support — defer until a user actually asks.
- Full multiplayer netcode — Arena / Slipshot's trust-the-shooter pattern
  is the ceiling without a dedicated server. Deal with that when we do.
- Account system beyond Supabase email + Google OAuth.
- NFTs, cosmetics economy, battle pass. Not the product.
