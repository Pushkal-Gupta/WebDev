# Era Siege — Audio Plan

## Strategy
PG.Play's `src/sound.js` is a procedural Web Audio mixer (no samples,
respects the global mute, ~0 KB asset footprint). Era Siege uses it.
This is the same posture every other PG.Play original takes (Coil,
Bricklands, Goalbound).

For v2, when we move to sample-based audio, the cue map below is the
contract — only the mixer changes.

## Cue map (v1 → existing src/sound.js)
| Cue | sfx key | Used for |
|---|---|---|
| `click` | `sfx.click` | HUD button press |
| `hover` | `sfx.hover` | HUD hover (desktop only) |
| `confirm` | `sfx.confirm` | Spawn unit success |
| `error` | `sfx.error` | Insufficient gold / on cooldown |
| `coin` | `sfx.coin` | Kill bounty pickup |
| `stomp` | `sfx.stomp` | Melee impact (light) |
| `axeReveal` | `sfx.axeReveal` | Heavy impact / turret hit |
| `shot` | `sfx.shot` | Ranged unit fire / turret fire |
| `bounce` | `sfx.bounce` | Projectile spawn (light) |
| `branchCreak` | `sfx.branchCreak` | Era 1 specific impact flavour |
| `star` | `sfx.star` | XP threshold reached |
| `achievement` | `sfx.achievement` | Era evolved |
| `cheer` | `sfx.cheer` | Special impact (lane mode) |
| `whistle` | `sfx.whistle` | Special charge telegraph |
| `win` | `sfx.win` | Victory |
| `lose` | `sfx.lose` | Defeat |

## Cue policy
- **Throttle** repeating cues per cue id at 6 Hz max — a 40-unit lane
  cannot fire 40 hit sounds in one frame.
- **Pan** is monaural in v1 (the `src/sound.js` mixer does not yet support
  pan). When v2 adds pan, the renderer already passes the impact x-px;
  audio will read `clamp((x / view.w - 0.5) * 2, -1, 1)`.
- **Pitch** the existing tones up by `1.05 ^ era` for ranged & turret
  cues, so later eras read sonically heavier.
- **Mute** is honoured by `src/sound.js`'s internal `muted()` check.
  Era Siege never bypasses it.

## Music (v2 only)
v1 ships no looping background music — the existing PG.Play games
follow this convention. v2 candidates:
- 2 short ambient loops (early-era / late-era).
- A 12-second victory sting.
- A 6-second defeat sting.

```
Asset Category: Background loop
Needed For: Era 1–2 ambient
Search Query: "site:freesound.org ambient drone CC0"
Search Query: "site:pixabay.com music dark ambient royalty free"
Must Have: seamless 60–90s loop, low-energy, no melodic hook
License: CC0 / royalty-free commercial
Format: OGG (preferred) or MP3
Path: public/games/era-siege/audio/music/early-loop.ogg
```
(see `THIRD_PARTY_ASSETS.md` for the full search reference list)

## Audio testing
- A debug overlay (`?debug-audio` URL flag) prints the last 8 fired
  cues.
- A vitest suite mocks `src/sound.js` and asserts that simulating a
  full match fires `match_start`, `era_reached × 4`, and
  `match_end` cues at minimum.

## Volume targets
- Default global volume: -8 dBFS.
- Per-cue gain ceiling: -12 dBFS (already the case in `src/sound.js`).
- Era-up stinger: -6 dBFS (loudest cue, intentional).
