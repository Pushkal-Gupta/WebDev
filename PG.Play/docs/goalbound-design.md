# Goalbound — design spec (v2)

*Original arcade football title. Rebuilt from the first-pass
prototype into a full product with menu, tournament, team/player
select, challenges, and a juiced match engine. See `src/games/goalbound/`
for the implementation.*

## Identity

- **Title:** Goalbound.
- **Tagline:** *One pitch. One minute. All yours.*
- **Fantasy:** Twilight stadium. Two rival clubs. Charged shots,
  wall-bounces, golden-goal tie-breaks. Silhouettes are clean and
  readable — no caricature.
- **Palette:** brand cyan (`#00e8d0`) vs ember orange (`#ff8855`).
  Dusk pitch, stadium lights in `#ffe6a8`.
- **Art direction:** procedural SVG crests + portraits per club,
  canvas-rendered match with particles, camera shake, hit-stop.

## File structure

```
src/games/goalbound/
  index.jsx              # Shell + route switch
  store.js               # Versioned, validated persistent store
  content.js             # Teams, players, arenas, difficulties, challenges, physics
  styles.css             # Scoped UI styles
  engine/
    match.js             # Match simulation (physics, FX, scoring, rules)
    ai.js                # Opponent AI (layered state machine)
    render.js            # Canvas renderer (stadium, players, ball, weather, FX)
    tournament.js        # Fixture / standings / bracket engine
    challenges.js        # Challenge evaluator
  ui/
    Crest.jsx            # Procedural SVG team crests
    Portrait.jsx         # Procedural SVG player portraits
    primitives.jsx       # ScreenHead, Choice, Pill, Stat, BackBar, …
  screens/
    Boot.jsx             # First-launch splash
    Menu.jsx             # Main menu + resume card
    Mode.jsx             # Secondary mode picker
    TeamSelect.jsx       # Club picker (home + away)
    PlayerSelect.jsx     # Player cycler with attributes
    Difficulty.jsx       # Casual / Pro / Hard / Legend
    MatchSettings.jsx    # Duration, weather, ball, arena, crowd, a11y
    TournamentSetup.jsx  # Format + seeding + AI difficulty
    GroupStage.jsx       # Standings + fixtures + simulate
    Bracket.jsx          # Knockout tree + trophy
    MatchIntro.jsx       # Versus screen + countdown
    Match.jsx            # Live match (canvas + HUD)
    Results.jsx          # Scoreline, goal timeline, challenge stars
    Stats.jsx            # Matches, trophies, medals, favorite club
    Help.jsx             # Controls, modes, tips, reset progress
    Challenges.jsx       # Scenario list
    Shootout.jsx         # Hotseat penalty mode
    Pause.jsx            # Pause overlay (unused — GameShell owns pause)
```

## Modes

| Mode              | Entry           | Notes |
|-------------------|-----------------|-------|
| Quick Match       | Menu > Quick    | 1v1 vs AI, full pre-match flow (team → player → difficulty → settings → intro). |
| Tournament        | Menu > Tournament | 3 formats: Mini Cup, Continental, World Series. Standings + bracket + persistence. |
| Local Versus      | Menu > Versus   | 2P hotseat. Desktop-first; shell already hides on narrow screens. |
| Penalty Shootout  | Menu > Shootout | 5 alternating kicks. Works on single phone. |
| Challenges        | Menu > Challenges | 7 scenarios. Applied modifiers + star checker. |
| Practice          | Menu > Practice | Free play. No AI pressure. No clock win. |

## Persistence

All state lives under `localStorage[pd-goalbound-v1]` as a single
versioned JSON blob. The store validates on load, deep-merges over
defaults to tolerate missing fields, and falls back to a clean reset
if the blob is corrupted or the version doesn't match.

Persisted surface:

- `route` (last screen)
- `selections` (mode, home/away team, players, difficulty, duration,
  arena, weather, ball, crowd, template, seeding)
- `settings` (sfx, reducedMotion, staticStadium)
- `tournament` (full bracket / fixtures / standings snapshot)
- `challenge` (active challenge id)
- `match` (last-finished match snapshot, used by Results)
- `stats` (matches, wins/draws/losses, goals, hat-tricks, clean sheets,
  trophies, challenge stars, streaks, favorite team)
- `meta` (bootedOnce, lastPlayedAt)

Reload restores the last route and all selections. If the user reloads
mid-match, the route is `match`, so they land on a fresh kick-off
with their same selections — a sensible resumable default.

## Physics + feel

Tuning lives at the top of `content.js` (`PHYSICS`). Match engine
adds: acceleration/deceleration (smoother movement), charged kicks
(hold to charge up to ~0.55s), hit-stop (brief freeze on contact),
camera shake (bigger on goals, tiny on shots), squash/stretch on
jump/land, turf dust on bounces, confetti on goals, post-hit rings,
and a crowd pulse that drives subtle stand animation.

## AI

Four tiers (Casual / Pro / Hard / Legend). Each tier tunes:

- `reactTime` — seconds between re-decisions
- `aim` — noise added to targeted-X
- `contestAir` — probability to jump aerial balls
- `punish` — aggression on counter-attacks
- `chase` — movement-speed multiplier
- `mistakes` — random misposition probability

The AI is a 1D state machine: pick `{goToX, jump, kick, chargeMore}`
every `reactTime`, apply until the next decision.

## Tournament

Three templates:

- **Mini Cup** — 4 teams round-robin, highest points wins.
- **Continental** — 8 teams, 2 groups of 4, top 2 → SF → F.
- **World Series** — 8 teams straight knockouts (QF → SF → F).

Non-player matches are simulated by a Poisson sampler modulated by
rating delta. "Simulate others" / "Simulate round" finishes the
current round off-screen so the player can stay in their lane.
Drawn knockouts resolve by coin flip.

## Challenges

Seven scenarios with temporary match modifiers. Checker function is
bundled with each challenge in `content.js`; results are evaluated
after finish via `engine/challenges.js#evaluateChallenge`. Highest
star count earned is persisted.

## Integration with PG.Play

- `src/games/GoalboundGame.jsx` is a thin re-export of `goalbound/index.jsx`
  so the lobby's lazy-load map keeps working.
- `src/components/GameIntro.jsx` exposes a single primary CTA — **Enter
  Goalbound** — that drops into the Goalbound menu. The Penalty
  Shootout shortcut is retained for users who want the one-tap path.
- The outer `GameShell` owns pause/help/mute/fullscreen/restart. The
  Match component watches the shell's `[data-paused]` attribute so
  the sim actually stops when the shell pauses.
- Score bus (`submitScore('goalbound', score, meta)`) is still
  emitted on match completion for quick/tournament/practice modes
  so platform bests update.

## Inputs

- **Keyboard.** Always available. P1: A/D/W/S; P2: ←/→/↑///Shift.
- **Touch.** Virtual controls layer (`useVirtualControls.jsx`) registers
  a Goalbound binding (left/right + Jump + Kick). Surfaces only on
  `(max-width: 820px), (pointer: coarse)`.
- **Gamepad.** Standard mapping via the Gamepad API (`engine/gamepad.js`).
  Left stick / D-pad maps to move, A = jump, B/X = kick. Two pads → P1
  + P2 in Local Versus.

## Known limitations

- Controls remapping isn't exposed (defaults are fixed). The mapping
  table lives in `Match.jsx#KEYS`.
- Shootout is intentionally separate from tournaments — side mini-game.
- Music is a stub toggle in the store (no track ships). SFX is Web
  Audio synthesis — no samples.
- Mid-match reload lands on a fresh kick-off with the same selections
  (rather than full positional replay).

## Tuning dials at a glance

- Make matches shorter: `content.js#MATCH_DURATIONS` defaults
- Make goals easier: `PHYSICS.KICK_POWER` / `PHYSICS.GOAL_W`
- Make Pro feel like Legend: shrink `DIFFICULTIES.pro.reactTime`
- Calmer FX: lower `CROWD_MODIFIERS.*.energy` or enable `staticStadium`
