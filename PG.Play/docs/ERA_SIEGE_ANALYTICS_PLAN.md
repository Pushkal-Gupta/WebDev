# Era Siege — Analytics & Telemetry Plan

## Strategy
PG.Play has no analytics vendor wired in today. Era Siege ships a
**no-op transport** with the right surface so a future vendor (PostHog,
Plausible, Sentry) can be wired up without touching the sim or HUD.

## Surface
```js
// src/games/era-siege/utils/telemetry.js
export const telemetry = {
  emit(event, payload) { /* no-op v1 */ },
};
```
The HUD imports `telemetry.emit('event_name', payload)` directly.
The sim never imports telemetry — it emits sim events; the HUD's event
adapter forwards them to telemetry. This keeps the sim deterministic
and side-effect-free.

## Tracked events
| Event | Payload | When |
|---|---|---|
| `era_siege:match_start` | `{ difficulty, seed }` | First sim tick |
| `era_siege:tutorial_complete` | `{ skipped: bool }` | Tutorial dismissed |
| `era_siege:unit_spawned` | `{ unitId, era }` | Player spawn (sampled at 1/4) |
| `era_siege:turret_built` | `{ slot, turretId, era }` | Player turret build |
| `era_siege:special_used` | `{ specialId, era }` | Player special cast |
| `era_siege:evolve_clicked` | `{ fromEra, toEra, atTimeSec, atGold, atXp }` | Evolve action |
| `era_siege:era_reached` | `{ era, atTimeSec }` | Auto-emitted on entering era N (player & enemy separately) |
| `era_siege:low_gold_error` | `{ unitId, gold, cost }` | Spawn click that cost-fails (rate-limited 1/sec) |
| `era_siege:rage_quit` | `{ era, timeSec, hpRatio }` | Unmount before win/lose |
| `era_siege:match_end` | `{ won: bool, era, timeSec, score, hp, units, turrets, specials, difficulty }` | Win/lose reached |
| `era_siege:fps_bucket` | `{ avg, p99, durationSec, deviceClass }` | Per minute (telemetry sampler) |

## Rate limiting
- `unit_spawned` is sampled at 1 in 4 to avoid event flood on rush
  strategies.
- `low_gold_error` fires at most 1/sec.
- `fps_bucket` fires once per minute and on unmount.

## Device class detection
```
const dpr = window.devicePixelRatio || 1
const w   = window.innerWidth
const ua  = navigator.userAgent.toLowerCase()
const isTouch = 'ontouchstart' in window
const isMobile = /(iphone|ipod|android.*mobile|windows phone|blackberry)/.test(ua)
deviceClass =
  isMobile ? 'mobile'
  : (isTouch && w < 1100) ? 'tablet'
  : 'desktop'
```

## FPS sampler
```
let frames = 0; let last = performance.now(); let p99frames = []
each RAF:
  frames++
  const dt = now - last; last = now
  p99frames.push(dt)
  if (p99frames.length > 60) p99frames.shift()
each minute:
  emit('era_siege:fps_bucket', {
    avg: 60 / (perfMinuteEnd - perfMinuteStart) * 1000,
    p99: percentile(p99frames, 99),
    durationSec: 60,
    deviceClass,
  })
```

## Error logging
- React errors bubble to PG.Play's existing `ErrorBoundary` (no extra
  hook needed in v1).
- Sim errors are caught in the loop, emit
  `era_siege:client_error` with `{ message, stack, era, timeSec }`,
  and end the match as a defeat (no UI corruption).

## Privacy
- No PII is collected.
- The seed is randomly generated per match — not derived from user
  identity.

## Opt-out
- The site's existing settings drawer has a global "data" toggle.
  Telemetry reads it before emitting; if disabled, no event leaves the
  no-op transport.

## Deferred (v2)
- Server-side analytics ingestion (`POST /api/game-events`) — schema
  reserved; not implemented.
- Daily-challenge seeded runs.
- Heatmap of where the player loses.
