# Contributing to PG.Play

Short guide. The codebase has strong conventions; the validator + tests enforce most of them.

## Branch + commit

- Work on a feature branch named after what you're shipping: `bricklands-ledge-jump`, `coil-faster-zoom`.
- Commit messages use a verb-first phrase: "fix Slipshot drone retreat radius", "add Mosswake checkpoint pylon".
- Never `git push --force` to main. Never bypass hooks.

## Dev loop

```sh
npm run dev                        # http://localhost:5180/
npm run validate:catalog           # asserts catalog integrity
npm test                           # 48 tests
npm run build                      # full prebuild gauntlet + production
```

The `prebuild` script runs `validate:catalog` then `vitest run` — if either fails, `npm run build` refuses to produce a dist. This is intentional.

## What changes are easy vs hard

**Easy** — these don't require platform-side changes:

- Tweak game constants (jump arc, enemy speed, spawn distance) inside the game file.
- Add or modify a per-game stinger by editing `src/sound.js` and calling it from the game.
- Add a new genre accent to a game by mapping its `cat` in `Card.jsx` and `GameIntro.jsx`.

**Medium** — touch shared systems:

- New game (see [README §Adding a game](./README.md#adding-a-game)).
- New skin / cosmetic preference: extend `pgplay_profiles.prefs` in a migration, follow the `coilSkin.js` helper pattern.
- Bespoke 3D ambient for a game: drop a component under `src/components/three/`, register it in `BESPOKE` map in `GameAmbient.jsx`.

**Hard** — touch the trust boundary:

- Score validation rules: `supabase/functions/_shared/scoreRules.ts` + redeploy. Every new playable game needs a rule.
- New auth flow: rare. The current `useSession` + email/Google + signed JWT is sufficient.
- Service worker behaviour: `public/sw.js`. Bump `VERSION` whenever the static-asset shape changes; the activate step purges old caches.

## Game contract (must follow)

```jsx
import { submitScore } from '../scoreBus.js';
import { isMuted } from '../sound.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

export default function MyGame() {
  // 1. Default-export a React component.
  // 2. Manage your canvas/RAF/listeners internally; clean up on unmount.
  // 3. On natural end state, call submitScore('myid', score, meta).
  // 4. If you instantiate AudioContext, gate beep() on isMuted().
  // 5. Use sizeCanvasFluid for crisp full-viewport rendering.
  // 6. Add 1-1.6s of post-spawn invulnerability if enemies can hit on frame 0.
  // ...
}
```

The validator catches missing wirings; the mount tests catch render-time crashes; the catalog test asserts catalog integrity. Three layers of guardrails — they fail loudly, not silently.

## Style

- React function components only.
- No emojis in code or UI.
- Tab/space conventions: 2-space soft tabs, single quotes for JS strings, double quotes for JSX attributes.
- CSS variables for every color, spacing, radius, shadow. No hardcoded hex except inside game-specific palettes.
- Don't add comments that explain WHAT the code does. Add a one-line comment when the WHY is non-obvious (a workaround, a constraint, a reason for an unusual choice).
- Don't add a try/catch unless it has a real meaningful catch.
- Don't add backwards-compat shims. We're a small project; rename + change.

## Testing

- Add a smoke import line to `test/games.smoke.test.js` for any new game.
- The mount test (`test/games.mount.test.jsx`) auto-discovers playable games — if your game crashes on mount, the suite fails.
- For shared utility additions, add a small targeted test under `test/`.
- Three.js games skip the mount test (jsdom can't fake WebGL); they still go through import smoke.

## Performance budget

- Initial bundle gzipped: ≤ 60 KB. Currently 39 KB.
- A single game chunk: aim for ≤ 30 KB gz. Anything larger should justify its weight.
- 60fps target on 2018 laptops. Use `useReducedMotion()` for cosmetic flourishes.
- Never animate `box-shadow` — animate opacity on a stacked glow layer.

## Deployment

GitHub Pages serves the repo's `dist/` subdirectory at `pushkalgupta.com/PG.Play/dist/`. The `dist/` directory is committed (the `.gitignore` exempts it; this is intentional — a Pages-served subdirectory must be in the repo).

Deploy:

```sh
npm run deploy                     # validates + tests + builds + prints commands
git add -A
git commit -m "deploy: <description>"
git push origin main
```

Returning users with a stale Service Worker from a previous deploy auto-unstick on first navigation (see `src/main.jsx`).

## Issues + product questions

- **`ARCADE_AUDIT.md`** has the canonical audit + per-game QA grades + the prioritized action plan.
- The README has the architecture overview.
- For ad-hoc product questions, open a GitHub issue or ping the author.
