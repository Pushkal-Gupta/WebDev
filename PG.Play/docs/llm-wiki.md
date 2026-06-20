# PG.Play LLM wiki

Dense reference for AI sessions. Read this INSTEAD of re-exploring. Update it when
contracts or gotchas change — stale entries cost more than missing ones.

## Game id ↔ folder map (ids differ from folders; ids live in src/data.js)

| id | folder | tech | notes |
|---|---|---|---|
| aow | era-siege | 2D canvas + Three.js | Age of War clone; 3D renderer default ('3d' art pack) |
| grudgewood | grudgewood | Three.js | "trees-hate-you" concept; 3D forest maze, 21 trap types |
| badicecream | frost-fight | 2D canvas | 40 levels, 364 sprite assets, premium |
| goalbound | goalbound | 2D canvas | 1v1 sports + tournament system |
| slipshot | slipshot | Three.js | FPS score-attack, single file |
| slither | slither-lite | 2D canvas | slither.io clone. 3D conversion was ATTEMPTED 2026-06-14 and REVERTED — the InstancedMesh snake segments rendered as faint tiny dots and the arena floor/nebula were invisible (black). Stayed 2D (it was already polished). Redo needs: visibly fat 3D snake bodies + a lit visible arena floor/grid/backdrop before shipping.
| fps | raycaster-fps | Three.js 3D | CONVERTED 2026-06-14 from 2D raycaster to real 3D (extruded walls, perspective+pointer-lock cam, 3D drone enemies, gun viewmodel). Gameplay contract (MAP/waves/hp/ammo/score/sfx) preserved. Dev: window.__fps3d. |
| basket | hoop-shot | 2D canvas | juiced 2026-06 (court, fire mode, trails) |
| stickman-hook | stickman-hook | 2D canvas | juiced + first REGISTERED 2026-06 (was orphaned) |
| hook | swingwire | Three.js 3D | NOT stickman-hook; one-button swing. CONVERTED 2026-06-14 to real 3D (2.5D: sim runs in original x/y, rendered on z=0 plane with perspective follow cam, 3D city towers, orb+wire). Physics identical. Dev: window.__hook3d. |
| bloons | loft-defense | 2D canvas | tower defense |
| bob | night-shift | Three.js 3D | stealth. CONVERTED 2026-06-14 to real 3D (2.5D side-view: sim x/y → world x/-y; 3D museum, volumetric guard light-cones via SpotLight+translucent cone mesh, floor light pools, 3D thief/guards/loot). AI/physics identical. Dev: window.__bob3d. |
| happywheels | faceplant | 2D canvas | bike physics |
| vex | trace | Three.js 3D | precision platformer. CONVERTED 2026-06-15 to real 3D (2.5D: sim x/y → z=0; 3D beveled platforms, spike cones, spinning saw discs, glowing goal portal, ninja-runner char; blueprint-dusk vibe). Physics/rooms identical. Dev: window.__vex3d. |
| fbwg | ember-tide | Three.js 3D | fire/water co-op. CONVERTED 2026-06-14 to real 3D (2.5D: sim x/y → z=0; 3D beveled tiles, fire/water elemental CHARACTERS w/ crests+eyes, gem crystals, cam frames both players). Physics identical. Dev: window.__fbwg3d. |
| eightball | eight-ball | Three.js 3D | pool. CONVERTED 2026-06-14 to real 3D (table x/y → ground plane; 3D felt/rails/pockets, numbered+striped ball spheres via procedural CanvasTexture, 3D cue stick, angled 3/4 cam). Physics identical. Dev: window.__eightball3d. |
| papa | short-order | DOM | kitchen orders |
| connect4 / g2048 | connect4 / game-2048 | DOM | classics |
| arena | arena | 2D canvas | FFA vs 3 bots. 3D conversion was REVERTED 2026-06-14 (user preferred the 2D, like slither) — back to the OG committed 2D (incl. its dead-but-harmless Supabase-realtime "Others 0"; the honesty-strip was also reverted to match OG). LEAVE 2D. |
| cutrope | cut-rope | Three.js 3D | rope physics, 16 levels. NOT 2D canvas (wiki was wrong) — paper-cut WebGL renderer, already fully arted (glossy candy w/ face, braided-rope shader, "Mochi" creature). |
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
- 2026-06-13: backlog sweep landed. (a) arena — stripped the never-working
  Supabase-realtime multiplayer layer (channel/broadcasts/presence/"Others N"
  HUD); now honest single-player FFA vs 3 bots; data.js entry retagged
  Shooter/story/1P. (b) Era Siege — build/turret modal now anchors to
  `renderer3d.screenPosForSlot(slot)` (index.jsx computes {x,y} on open →
  TurretBuildModal `anchor` prop → inline left/top, centered-above + clamped to
  viewport with 8px margin, bottom/right set to 'auto' to beat the CSS). NULL-SAFE:
  no anchor (2D mode / pylon missing / off-screen) → falls back to the original
  `.es-tb-scrim { bottom:168px; right:8px }` CSS, so worst case == prior behavior.
  (c) self-muting sound stingers wired across papa/connect4/g2048/fbwg/vex/bloons
  (sfx.* already no-op when muted, so no isMuted guard needed). (d) BUG FIX:
  connect4 never called submitScore — now persists (win 100 / draw 50 / loss 0,
  once-per-game ref-guarded). Build green (catalog + 108 tests + vite).
- Dead code: `era-siege/ui/HUD.jsx` is unused (live HUD is TopBar.jsx; only
  grudgewood imports its own ./ui/HUD.jsx). "Era Siege DOM HUD restyle" backlog
  item is effectively satisfied by TopBar — left HUD.jsx in place, not deleted.
- 2026-06-14: **2D→3D conversion drive** (user wants real 3D models, "most games").
  Pipeline that works: read game's gameplay contract → rewrite index.jsx with a
  Three.js renderer that PRESERVES all physics/levels/controls/score/sfx (only
  rendering + camera/look-input become 3D; for top-down/side games use a 2.5D
  plane mapping so the sim math is untouched: e.g. game x→worldX, y→worldZ or y→-Y)
  → `npm run build` green → screenshot-verify → lighting tune. Lighting that reads
  well (avoid ACESFilmic underexposure): exposure ~1.45-1.5, hemi ~1.0, ambient
  ~0.7, key ~1.7-1.8 on the CAMERA side, fog color = background and NOT near-black
  (use ~#1b2a3a), fog start pushed out. CONVERTED + verified-in-gameplay: fps, hook,
  arena, stickman-hook, faceplant (happywheels), loft-defense (bloons — its path
  needed side:DoubleSide + y ABOVE the grass plane or it's invisible), bricklands.
  slither (Coil) was converted then REVERTED to 2D — the snake/arena rendered broken
  and I only screenshot-verified its MENU (harness can't click "PRESS TO PLAY"), so
  broken gameplay shipped until the user caught it. LESSON: verify the actual PLAYING
  state (drive into play: press Space / click canvas), not the menu. vex (Trace) got a
  2D depth overhaul instead. Dev handles: window.__fps3d/__hook3d/__arena3d/
  __stickman3d/__happywheels3d/__bloons3d/__bricklands3d (+ existing __es3d/__gw). GOTCHA hit twice: a converted
  game's wrapper CSS must give the WebGL canvas a flex-grow full-bleed box
  (`.X { width:100%; height:100% }` + `.X-stage { flex:1 1 0; min-height:0;
  width:100%; max-width:1120px; margin:0 auto }`) or the canvas falls back to its
  intrinsic 800x600 ("tiny game in void") — copy swingwire's CSS. slither keeps its
  rich 2D HUD as a transparent overlay canvas (pointer-events:none) above the WebGL
  canvas — good pattern for HUD-heavy conversions.
- **Headless WebGL verification WORKS** (revises the old "swiftshader 3D unreliable"
  fear): launch puppeteer with `--enable-unsafe-swiftshader --use-gl=swiftshader`;
  Grudgewood/Slipshot/the new 3D games all render. Caveat: Era Siege's makeRenderer3D
  is fine (window.__es3d set, 3D mounts on fresh storage — default artPack '3d');
  an earlier "era-siege shows 2D" scare was stale/timing, not a bug. Temp harness:
  scripts/_dev-audit.mjs (all games), scripts/_dev-shot.mjs <id> (one game) — DELETE
  when the drive is done. Era Siege's own 3D models are stylized/low-poly — "upgrade
  the models" is still open if the user wants the flagship richer.
- 2026-06-14: **Era Siege models enriched** (renderer3d.js only). GEO limbs
  box→CapsuleGeometry of identical bounds+pivot (capH helper); torsos/heads/shields/
  housings→rounded boxes (roundedBox helper, same extents); round parts seg-bumped
  (cyl 5-6→12, sphere→16x12, cone→12, torus→8x24); materials differentiated —
  armor/weapons metallic (metalness 0.6-0.85, smooth) vs cloth/tabard matte; limbs/
  body now smooth-shaded (flatShading off); additive pooled detail (sword pommel,
  helm ridge, cannon rivets). All pivots/anchors/pooling/animation preserved (rigs
  verified aligned via zoom screenshot). Build green. CAVEAT: era-1 is a night
  palette so the richer models are dark at game start — a scene-light/exposure bump
  (or era-1 ERA_LOOKS lift) would showcase them better; not done (art-direction call).
- 2026-06-14/15: unit-figure SAGA (3 iterations). (1) original box rigs → user "blocks".
  (2) switched to detailed SPRITE BILLBOARDS of the baked art — looked great BUT static
  (no walk; the art has no walk-cycle frames, sheet cells are roles not anim frames).
  (3) user: "walking animation and everything OR convert 2d to 3d" → FINAL: **articulated
  procedural 3D RIGS with a real walk cycle**, styled per era/role to match the sprite
  designs (era0 tribal+club/torch, era1 plate knight+shield/spear, era2 bronze gunner,
  era3 steampunk captain tricorn+pistol+saber, era4 void wraith hood+robe+staff, hovers).
  Rig = pelvis/torso/head + 2 legs (hip→knee) + 2 arms (sho→elbow→hand-weapon), capsule
  limbs (smooth, not blocks), per-era headgear + team tabard/cape. Walk driven by
  u.walkPhaseMs (sim increments while moving): opposite hip/knee swing, arm counter-swing,
  torso bob+lean. Attack from u.attackTickPhase, hurt-flash on hp drop, death topple/fade.
  Shared GEO, per-rig cloned materials, pooled (key team|era|role|champion). The billboard
  + unit-texture code was REMOVED. DON'T go back to billboards — they can't walk.
- 2026-06-15: user "still shit blocks". EVALUATED via zoomed multi-frame closeup
  (scripts/_dev-es-closeup.mjs → /tmp/pgplay-audit/es-closeup.png): root cause was BAD
  PROPORTIONS, not missing animation — an oversized gray loincloth/tabard SLAB dominated
  the body (diaper-on-sticks) and shoulders sat ~0.5 above the chest (hollow gap, tiny
  head). FIX (renderer3d.js): shrank tabard 0.3x0.5→0.26x0.34 + small loincloth, broad
  tall chest 0.46x0.44→0.5x0.62, added waist taper, narrowed pelvis, SHO_Y 1.42→0.8 so
  shoulders sit ON the chest, widened shoulder X, thicker limb capsules, bigger head,
  era1 bare-skin torso + headband. Re-render → proper lean muscular warrior, mid-stride.
  LESSON: evaluate units with a ZOOMED MULTI-FRAME closeup, never a wide static frame.
  Enemy auto-evolves every 30s (sim/world.js:265) → a long harness run reaches era2+.
- 2026-06-14: **turrets moved onto the fortress ROOF TERRACE** (was lane-side in front).
  Both sides: pylons/turrets at world x = fortress x (wx(laneLeft-50)/wx(laneRight+50))
  + lane-facing edge offset 2.2, y = TERRACE_Y 7.15 (keep is 4.6 tall × fortress scale
  1.55 ≈ 7.1 — REMEMBER the 1.55 group scale when placing things on the fortress),
  slots spread along z. Short 0.5 plinths. pickPlayerSlot/screenPosForSlot still work
  (they read pylon world pos). Enemy turrets render here too when the AI builds them
  (Easy aiTurretChance 0.15/tick — happens over a normal game, not in a few seconds).
- 2026-06-14: converted games made FULL-SCREEN (removed max-width:1120px → none on
  .face-stage/.loft-stage/.hook-stage/.swingwire-stage + bricklands inline). arena/fps
  were already full-width. Did NOT touch grudgewood/frost-fight/slither CSS (user: leave
  those). User exclusion list (don't 3D/touch): grudgewood, g2048, connect4, frost-fight,
  slither (slither 3D reverted, stays 2D — user prefers it).
- Remaining 2D→3D conversion queue (true 2D-canvas games still flat): faceplant
  (happywheels — bike-over-terrain physics, the trickiest), loft-defense (bloons —
  tower defense), bricklands (platformer). trace stays 2.5D-styled in 2D unless asked.
  DOM games (papa, connect4, g2048) are not 3D candidates. NOTE: these remaining ones
  already looked decent in 2D (had prior juice passes) — lower urgency than the ones
  done; confirm with user before converting good games (risk of making them worse).
- Remaining backlog: Grudgewood trap-taxed ground routes at towers.

## Headless capture fallback (host GPU contention)

When `page.screenshot` times out (Page.captureScreenshot ProtocolError even on
DOM pages — happens when the host runs many Chrome processes): hook the app's
own render via `window.__es3d.renderer.render` wrapper and `toDataURL()` in
the SAME frame (preserveDrawingBuffer is false — a manual out-of-band
renderer.render() produces garbage frames; never screenshot that way).
Launch with `--enable-unsafe-swiftshader`.
