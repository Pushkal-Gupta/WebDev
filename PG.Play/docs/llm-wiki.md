# PG.Play LLM wiki

Dense reference for AI sessions. Read this INSTEAD of re-exploring. Update it when
contracts or gotchas change — stale entries cost more than missing ones.

## Game id ↔ folder map (ids differ from folders; ids live in src/data.js)

| id | folder | tech | notes |
|---|---|---|---|
| aow | era-siege | 2D canvas + Three.js | Age of War clone; 3D renderer default ('3d' art pack) |
| grudgewood | grudgewood | Three.js | "trees-hate-you" concept; 3D forest maze, 21 trap types |
| badicecream | frost-fight | 2D canvas | 40 levels, 364 sprite assets, premium |
| cutrope | cut-rope | 2D canvas | rope physics, 16 levels |
| goalbound | goalbound | 2D canvas | 1v1 sports + tournament system |
| slipshot | slipshot | Three.js | FPS score-attack, single file |
| slither | slither-lite | 2D canvas | slither.io clone |
| fps | raycaster-fps | 2D canvas | raycaster; juiced 2026-06 (textures, waves, weapon) |
| basket | hoop-shot | 2D canvas | juiced 2026-06 (court, fire mode, trails) |
| stickman-hook | stickman-hook | 2D canvas | juiced + first REGISTERED 2026-06 (was orphaned) |
| hook | swingwire | 2D canvas | NOT stickman-hook; one-button swing |
| bloons | loft-defense | 2D canvas | tower defense |
| bob | night-shift | 2D canvas | stealth |
| happywheels | faceplant | 2D canvas | bike physics |
| vex | trace | 2D canvas | precision platformer |
| fbwg | ember-tide | 2D canvas | fire/water co-op |
| eightball | eight-ball | 2D canvas | pool |
| papa | short-order | DOM | kitchen orders |
| connect4 / g2048 | connect4 / game-2048 | DOM | classics |
| arena | arena | 2D canvas | INCOMPLETE, WebSocket stub |
| bricklands | bricklands | 2D canvas | platformer |

Routes: `#/game/<id>`. Shims: `src/games/<Pascal>Game.jsx` re-export → `<folder>/index.jsx`.
Catalog validator regex accepts quoted hyphenated ids in GameIntro.jsx PLAYABLE map.

## Era Siege (src/games/era-siege/)

- Sim is framework-agnostic, NEVER touch `sim/` + `content/` for presentation work.
- Renderer contract: `makeRenderer()` (2D, engine/renderer.js) and
  `makeRenderer3D({canvas})` (engine/renderer3d.js) both expose
  `{ render, resize, clearCache, dispose }`; 2D render takes `(ctx, match, dt)`,
  3D takes `(match, dt)`. index.jsx keys the `<canvas>` on render mode — a canvas
  can only ever hold ONE context type (2d vs webgl).
- artPack setting: 'classic' | 'v2' | '3d' (default '3d'), live-switchable; in
  utils/settings.js + ui/SettingsDrawer.jsx.
- renderer3d.js key facts:
  - `match.view` is in CANVAS px (fluid-sized, viewport-dependent). World scale
    MUST normalize: `SX = LANE_WORLD_W(50m) / (laneRight-laneLeft)`, `SY = SX*0.5`,
    recomputed each frame. Never use constant px→m scale.
  - `ERA_LOOKS[eraIdx]` table = per-era sky/sun/fog/hill/ground/mote colors;
    lerped over ~1.2s on evolve. Sun z-components POSITIVE (camera side, south).
  - Stylized scales: UNIT_SCALE 2.9, TURRET_SCALE 2.1, fortress 1.55 (real-size
    figures are ants at full-lane framing — same reason 2D uses UNIT_RENDER_SCALE 2.10).
  - Camera: fixed dir (0,0.27,0.96), distance from `frameCamera()` fitting
    laneHalfWorld + 5.5m (fortresses sit ~50 sim-px BEYOND lane ends).
  - Interp alpha = `match._acc / (1/60)` for smooth unit x between sim steps.
  - Pools everywhere (units/projectiles/numbers/explosions); zero per-frame allocs;
    rig cache key `team|era|role|champion`.
  - Two cross fills (±40,26,34) — single fill leaves one fortress's lane face black.
  - Dev handle: `window.__es3d = {scene,camera,renderer}` (DEV only).
  - Recoil trigger: turret cooldown ratio `cdR > 0.85` (matches 2D).
- Sim hp fields: `side.base.hp / side.base.maxHp`; flash via `side.baseFlashMs`.
- 2D-only asset pipeline: scripts/era-siege-*.mjs; sheets in assets/age-of-war/;
  485 PNGs in public/games/era-siege/. 3D mode uses none of it.

## Grudgewood (src/games/grudgewood/)

- engine.js: makeEngine → {renderer, scene, camera, sun, hemi, ambient, q,
  resize, applyBiome, tickFx, spawnPuff, dispose}. tickFx(realDt, playerPos)
  drives mote field + dust puffs + RE-ANCHORS SUN RIG ON PLAYER (shadow camera
  is ±50m box; world streams infinitely).
- Walls: walls.js builds jittered vertex-colored stone + merged foliage crest;
  AABB from NOMINAL extents (jitter visual-only). `buildMossyBox` exported for
  platforms. Deterministic seeding from world pos (cells rebuild identically).
- chunkManager: 5x5 cell ring, `ChunkManager(scene, {foliage})`. Shared geometry
  must set `userData.sharedGeo = true` or disposeCell kills it (grass tufts do).
- biomes.js: 6 biomes; `particle` + `vignette` config consumed by engine.tickFx /
  index.jsx overlay. Sun angles: z must stay NEGATIVE (south = camera side).
- Dev handle: `window.__gw = {engine,chunks,player,cam,gameState,teleport(x,z)}`.
- Wall layout probe: import mazeGrid.js in node directly (pure JS).

## Verify harness (MANDATORY for visual work — tests can't see composition)

- `npm run dev` (port shifts, often 5180). Puppeteer is a dependency; scripts
  must live in repo for module resolution. Convention `scripts/_dev-*.mjs`,
  DELETE before finishing (not gitignored).
- Click-through: arcade intro "Start" → game menu button ("New Walk"/"Easy"/...).
  ~2.5-3s waits. First run after adding a new import path (e.g. three/addons)
  triggers Vite re-optimize + page reload that eats the session — rerun once.
- Screenshot 1440x850, then CROP with sharp before judging (thumbnails lie).
- Light-lab: mutate live scene via page.evaluate + screenshot variants — much
  faster than edit+HMR loops for lighting/exposure tuning.
- FPS probe: count rAF over 2s. The supabase `leaderboard` 422 console error on
  intro pages is pre-existing noise, ignore it.

## Gotchas (hard-won)

1. Fixed-camera 3D: sun must sit on the CAMERA side or every visible face is unlit.
2. Shadow camera + sun.target must follow the player/focus in streaming worlds.
3. `THREE.Color` ops are in linear space (colors look darker than hex suggests
   under ACESFilmic); verify visually, not arithmetically.
4. Flat-shaded + per-vertex hash noise = checkerboard artifact. Use low-frequency
   layered sin noise for color drift, hash only for tiny grain.
5. Don't dispose shared/module-level geometries in per-cell dispose paths.
6. `prebuild` = validate:catalog + vitest; `npm run build` green means all green.
   NEVER bypass.
7. dist/ is committed (deploy reads it) — build churn in git status is normal.
8. No emoji anywhere; user commits manually (surface a commit message instead).

## State ledger

- 2026-06-11/12: Grudgewood visual rebuild; Era Siege 3D renderer (default);
  juice passes fps/basket/stickman-hook; stickman-hook newly registered.
- 2026-06-12: Era Siege articulated rigs — two-segment limbs (hip/knee,
  shoulder/elbow pivot groups), helmets+visors, team tabard + shoulder caps
  (side-view team read), real weapons (sword/guard, half-torus bow + nocked
  arrow during windup, hammer), role attack poses (melee coil+lunge, archer
  draw), knee-bend stride. Rig contract: legL/legR are HIP GROUPS, plus
  kneeL/R, elbowW/O, armO, headG, hipY, isRanged.
- 2026-06-12: batch-2 juice passes landed — eightball (rails/cue/ghost-aim/
  power meter), happywheels (parallax meadow, articulated ragdoll rider,
  course bar), bob (museum light-pools, flashlight cones, loot). All verified
  by canvas-grab. NOTE: eightball intro uses "vs Bot"/"2 Player" buttons, not
  "Start" — generic click-through scripts must handle it.
- 2026-06-12 (round 2): Era Siege reference-matched models — units/turrets now
  follow assets/era-siege/unit_sprite_sheet.png + turret_spirits.png (e1 hooded
  tribals+clubs/ballista, e2 spear+tower-shield knights/wheeled cannon, e3
  bronze+mech-golem heavy/mortar, e4 energy troopers+shoulder-cannon walker/
  tesla coil, e5 floating wraiths (legs hidden, wisp cone, hover anim)/void
  lance). Turret `visual.kind` (crossbow/cannon/bell/tesla/lance) selects the
  silhouette. In-world turret UX: pylon towers w/ ghost preview + pulsing ring
  + holo marker on empty player slots, upgrade pips on caps, canvas click →
  pickPlayerSlot() → same modal flow; pylons+turrets nudged 4.4m lane-ward
  (sim x sits inside the 3D fortress footprint). renderer3d exposes
  pickPlayerSlot/screenPosForSlot (also on window.__es3d in DEV).
  assets/era-seige-2/ = alternate bio-alien art direction (future v2 pack),
  NOT used by the 3D renderer.
- 2026-06-12 (round 2) Grudgewood: tier-2 watchtowers on deep platform cells
  (cz>=14, cellHasTier2) — upper deck 2.4m + east stepped stair, heightmap-
  driven so physics is free; jump (2.1m apex) is the skill route. Grudge wisps:
  off-spine collectibles (spawn.js pickups, side cells cz>=6, 40% roll),
  +25 score each, run-scoped collectedWisps Set on ChunkManager.
- Remaining backlog: papa, connect4, g2048, fbwg, vex, bloons, arena
  (incomplete); Era Siege DOM HUD restyle (minimal/slick pass) + anchoring
  build modal to screenPosForSlot; Grudgewood trap-taxed ground routes at
  towers.

## Headless capture fallback (host GPU contention)

When `page.screenshot` times out (Page.captureScreenshot ProtocolError even on
DOM pages — happens when the host runs many Chrome processes): hook the app's
own render via `window.__es3d.renderer.render` wrapper and `toDataURL()` in
the SAME frame (preserveDrawingBuffer is false — a manual out-of-band
renderer.render() produces garbage frames; never screenshot that way).
Launch with `--enable-unsafe-swiftshader`.
