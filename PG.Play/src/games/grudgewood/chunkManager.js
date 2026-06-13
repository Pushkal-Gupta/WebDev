// Grudgewood — 2D cell manager for the maze world.
//
// The world is a grid of cells (see mazeGrid.js). The manager keeps a
// 3×3 ring of cells around the player loaded; cells outside that ring
// are disposed. Walls are built per cell and re-used for both rendering
// and physics — the player's circle-vs-AABB push-out (player.js) reads
// the same AABBs the renderer uses, so visual and physical walls can
// never disagree.

import * as THREE from 'three';
import { CELL_SIZE, cellOf, cellOrigin, cellCenter } from './mazeGrid.js';
import { sampleHeight as sampleHeightGlobal, cellHasPlatform, cellHasTier2, PLATFORM } from './heightmap.js';
import { biomeAt, biomeForCell } from './biomeProgression.js';
import { spawnCellContent } from './spawn.js';
import { buildCellWalls, buildMossyBox } from './walls.js';
import { flagLevelInCell, flagAnchorFor, makeFlag, tickFlag, FLAG_TOUCH_RADIUS } from './flags.js';
import {
  makeTree, makePine, makeShrub, makeRock, makeStump, makeMushroom,
} from './props.js';
import { BranchWhip } from './traps/branch.js';
import { RootSnare } from './traps/root.js';
import { MushroomPop } from './traps/mushroom.js';
import { RollingLog } from './traps/log.js';
import { HiddenPit } from './traps/pit.js';
import { PredatorTree } from './traps/predator.js';
import { FakeStump } from './traps/fakestump.js';
import { EmberRain } from './traps/embers.js';
import { WindGust } from './traps/wind.js';
import { LyingSign } from './traps/sign.js';
import { AcornCannon } from './traps/acorn.js';
import { BoarTree } from './traps/boar.js';
import { CarnivorousVine } from './traps/vine.js';
import { BoulderDrop } from './traps/boulder.js';
import { TarGeyser } from './traps/geyser.js';
import { SporeCloud } from './traps/spore.js';
import { BranchLashCombo } from './traps/lash.js';
import { MirrorTree } from './traps/mirror.js';
import { FallingTree } from './traps/falling.js';
import { EruptingTree } from './traps/erupting.js';

export { CELL_SIZE };

const TERRAIN_RES = 12;            // verts per side of the cell floor mesh
const CELLS_AROUND = 2;            // 5×5 grid loaded — ~48m forward visibility
                                   // so the player can see the next flag and
                                   // path stripe well before reaching them.

const TRAP_CLASS = {
  whip: BranchWhip, snare: RootSnare, mushroom: MushroomPop, log: RollingLog,
  pit: HiddenPit, predator: PredatorTree, stump: FakeStump, embers: EmberRain,
  wind: WindGust, sign: LyingSign,
  acorn: AcornCannon, boar: BoarTree, vine: CarnivorousVine,
  boulder: BoulderDrop, geyser: TarGeyser, spore: SporeCloud,
  lash: BranchLashCombo, mirror: MirrorTree,
  falling: FallingTree, erupting: EruptingTree,
};
const PROP_BUILDER = {
  tree:     (b, e) => makeTree(b, e.scale || 1, e.variant || 0),
  pine:     (b, e) => makePine(b, e.scale || 1),
  shrub:    (b, e) => makeShrub(b, e.scale || 1),
  rock:     (b, e) => makeRock(b, e.scale || 1),
  stump:    (b, e) => makeStump(b, e.scale || 1),
  mushroom: (b, e) => makeMushroom(b, e.capColor || '#c33', e.scale || 1),
};

const idle = (cb) => {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(cb, { timeout: 250 });
  } else {
    Promise.resolve().then(cb);
  }
};

// Cheap deterministic 2D value-noise stand-in. Smooth-ish, tileable
// enough for colour patches, and stable across cell rebuilds.
function patchNoise(x, z) {
  return (
    Math.sin(x * 0.37 + z * 0.21) * 0.5 +
    Math.sin(x * 0.13 - z * 0.31 + 1.7) * 0.3 +
    Math.sin(x * 0.71 + z * 0.53 + 4.1) * 0.2
  ) * 0.5 + 0.5;
}

function buildCellFloor(biome, cx, cz) {
  const o = cellOrigin(cx, cz);
  const geo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE, TERRAIN_RES, TERRAIN_RES);
  geo.rotateX(-Math.PI / 2);
  geo.translate(o.x + CELL_SIZE / 2, 0, o.z + CELL_SIZE / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  const cGround = biome.ground.color;
  const cGrass = biome.grass.color;
  const cGrassLt = biome.grass.light;
  const cDark = biome.ground.darken;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = sampleHeightGlobal(x, z);
    pos.setY(i, y);
    // Noise-driven meadow patches: drifts of grass over bare ground with
    // occasional sunlit highlights and shadowed hollows. World-space
    // noise means patches flow seamlessly across cell seams. No path
    // stripe — the forest reads cleaner without an explicit "go this
    // way" marker; we steer the player by walling off wrong directions.
    const n = patchNoise(x, z);
    const n2 = patchNoise(x * 2.3 + 11, z * 2.3 - 7);
    tmp.copy(cGround).lerp(cGrass, Math.min(1, n * 1.3));
    if (n2 > 0.72) tmp.lerp(cGrassLt, (n2 - 0.72) * 2.2);   // sunlit drifts
    if (n < 0.22) tmp.lerp(cDark, (0.22 - n) * 2.0);        // hollows
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, metalness: 0.0, flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// Scatter of low-poly grass tufts — one InstancedMesh per cell, so the
// whole scatter costs a single draw call. Placement is seeded from the
// cell coordinate (stable across rebuilds) and biased toward the grassy
// noise patches the floor colouring paints.
const TUFT_GEO = new THREE.ConeGeometry(0.09, 0.42, 4);
TUFT_GEO.translate(0, 0.2, 0);
function buildGrassTufts(biome, cx, cz, density = 1) {
  const o = cellOrigin(cx, cz);
  let seed = (Math.imul(cx, 374761393) + Math.imul(cz, 668265263)) | 0;
  const rng = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const count = Math.round(64 * density);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
  const inst = new THREE.InstancedMesh(TUFT_GEO, mat, count);
  inst.userData.sharedGeo = true;    // module-level geometry — never dispose per-cell
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  let placed = 0;
  for (let i = 0; i < count * 3 && placed < count; i++) {
    const x = o.x + rng() * CELL_SIZE;
    const z = o.z + rng() * CELL_SIZE;
    if (patchNoise(x, z) < 0.42) continue;     // only in grassy patches
    p.set(x, sampleHeightGlobal(x, z), z);
    e.set((rng() - 0.5) * 0.3, rng() * Math.PI, (rng() - 0.5) * 0.3);
    q.setFromEuler(e);
    const sc = 0.7 + rng() * 0.9;
    s.set(sc, sc * (0.8 + rng() * 0.7), sc);
    m.compose(p, q, s);
    inst.setMatrixAt(placed, m);
    col.copy(biome.grass.color).lerp(biome.grass.light, rng() * 0.8);
    inst.setColorAt(placed, col);
    placed++;
  }
  inst.count = placed;
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  return inst;
}

// Builds the visual deck + ramps for a platform cell. Heights match
// PLATFORM constants so the mesh sits exactly on the heightmap surface.
// Returned group can be added to the cell as a single child.
function buildPlatformMesh(biome, cx, cz) {
  const g = new THREE.Group();
  const cc = cellCenter(cx, cz);

  // Deck — mossy-stone treatment shared with the maze walls so the
  // platform reads as part of the same overgrown ruin set, not a slab.
  g.add(buildMossyBox(biome, {
    x: cc.x, y: PLATFORM.HEIGHT / 2, z: cc.z,
    sx: PLATFORM.HALF * 2, sy: PLATFORM.HEIGHT, sz: PLATFORM.HALF * 2,
    segs: [6, 2, 6],
  }));

  // Ramps — thin mossy boxes tilted so the bottom touches y=0 and the
  // top meets the deck at y=PLATFORM.HEIGHT. Width matches the deck.
  const rampW = PLATFORM.HALF * 2;
  const rampLen = PLATFORM.RAMP_LENGTH;
  const slopeLen = Math.hypot(rampLen, PLATFORM.HEIGHT);
  const slopeAngle = Math.atan2(PLATFORM.HEIGHT, rampLen);
  function buildRamp(zOffsetSign) {
    const m = buildMossyBox(biome, {
      x: 0, y: 0, z: 0,
      sx: rampW, sy: 0.18, sz: slopeLen,
      segs: [6, 1, 4], topMoss: false,
    });
    // The ramp's local +Z extends from the deck edge outward by rampLen
    // toward the ground. Rotate so the slope matches the elevation drop.
    m.rotation.x = zOffsetSign * slopeAngle;
    const mid = PLATFORM.HALF + rampLen / 2;
    m.position.set(cc.x, PLATFORM.HEIGHT / 2, cc.z + zOffsetSign * mid);
    g.add(m);
  }
  buildRamp(1);   // north
  buildRamp(-1);  // south

  // Tier-2 watchtower — smaller upper deck + east-side stair. The
  // heightmap already carries the elevation; these meshes just paint it.
  if (cellHasTier2(cx, cz)) {
    g.add(buildMossyBox(biome, {
      x: cc.x, y: (PLATFORM.T2_HEIGHT + PLATFORM.HEIGHT) / 2, z: cc.z,
      sx: PLATFORM.T2_HALF * 2, sy: PLATFORM.T2_HEIGHT - PLATFORM.HEIGHT, sz: PLATFORM.T2_HALF * 2,
      segs: [4, 2, 4],
    }));
    // Stair — stepped boxes from the base deck up to the upper deck.
    const run = PLATFORM.HALF - PLATFORM.T2_HALF;
    const rise = PLATFORM.T2_HEIGHT - PLATFORM.HEIGHT;
    const STEPS = 4;
    for (let i = 0; i < STEPS; i++) {
      const t = (i + 0.5) / STEPS;
      const stepH = PLATFORM.HEIGHT + rise * (1 - t);
      g.add(buildMossyBox(biome, {
        x: cc.x + PLATFORM.T2_HALF + run * t,
        y: stepH / 2 + 0.01,
        z: cc.z,
        sx: run / STEPS + 0.04, sy: stepH, sz: PLATFORM.STAIR_W,
        segs: [1, 1, 2], topMoss: false,
      }));
    }
  }

  return g;
}

// Grudge wisp — a small glowing pickup hovering over a faint ring.
// Off-spine rooms only (see spawn.js); collecting one banks bonus score.
function buildWisp(biome, x, z) {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({
    color: '#1a2410', emissive: biome.accent, emissiveIntensity: 2.2, flatShading: true,
  });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
  core.position.y = 1.0;
  g.add(core);
  const ringMat = new THREE.MeshBasicMaterial({
    color: biome.accent, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.46, 20).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.05;
  g.add(ring);
  const y = sampleHeightGlobal(x, z);
  g.position.set(x, y, z);
  g.userData.core = core;
  return g;
}

function buildCell(scene, cx, cz, raisedFlags, foliage = 1, collectedWisps = null) {
  const biome = biomeForCell(cx, cz);
  const group = new THREE.Group();
  scene.add(group);

  group.add(buildCellFloor(biome, cx, cz));
  if (foliage > 0.05) group.add(buildGrassTufts(biome, cx, cz, foliage));

  // Walls are shared across cells (this cell builds N + E only). The
  // collision AABBs land in the chunk's `wallAABBs` list so player.js
  // can iterate them.
  const wallResult = buildCellWalls(biome, cx, cz);
  for (const m of wallResult.meshes) group.add(m);

  // Stone deck + ramps for platform cells. The heightmap already gives
  // the correct elevation across this region, so the mesh just paints
  // the deck visually — physics is driven by sampleHeight.
  if (cellHasPlatform(cx, cz)) {
    group.add(buildPlatformMesh(biome, cx, cz));
  }

  const { traps: trapDefs, props: propDefs, pickups: pickupDefs = [] } = spawnCellContent(cx, cz, biome);

  // Wisp pickups — skipped if already collected this run (the set is
  // keyed by cell+index so cells that stream out and back stay honest).
  const wisps = [];
  for (let wi = 0; wi < pickupDefs.length; wi++) {
    const p = pickupDefs[wi];
    if (p.kind !== 'wisp') continue;
    const id = `${cx},${cz}:${wi}`;
    if (collectedWisps && collectedWisps.has(id)) continue;
    const m = buildWisp(biome, p.x, p.z);
    group.add(m);
    wisps.push({ id, mesh: m, x: p.x, z: p.z });
  }

  const props = [];
  for (const e of propDefs) {
    const builder = PROP_BUILDER[e.kind];
    if (!builder) continue;
    const m = builder(biome, e);
    m.position.set(e.x, sampleHeightGlobal(e.x, e.z), e.z);
    group.add(m);
    props.push(m);
  }

  const traps = [];
  for (const t of trapDefs) {
    const Cls = TRAP_CLASS[t.kind];
    if (!Cls) continue;
    const x = t.x;
    const z = t.z;
    const y = sampleHeightGlobal(x, z);
    const trap = new Cls({ biome, anchor: new THREE.Vector3(x, y, z), ...(t.opts || {}) });
    group.add(trap.group);
    traps.push(trap);
  }

  // Flag checkpoint, if this is a spine flag cell. The mesh is positioned
  // at the cell centre and its raised-state reflects the global
  // raisedFlags Set so rebuilt cells show the correct state immediately.
  const level = flagLevelInCell(cx, cz);
  let flag = null;
  if (level !== null) {
    const anchor = flagAnchorFor(level);
    const raised = raisedFlags.has(level);
    const m = makeFlag({ level, raised });
    m.position.set(anchor.x, sampleHeightGlobal(anchor.x, anchor.z), anchor.z);
    group.add(m);
    flag = { level, mesh: m, anchor };
  }

  return { cx, cz, group, props, traps, wisps, biome, wallAABBs: wallResult.aabbs, flag, _lodLevel: 'near' };
}

function applyCellLOD(cell, level) {
  if (cell._lodLevel === level) return;
  cell._lodLevel = level;
  if (!cell._lodSnapshotted) {
    cell._lodSnapshotted = true;
    cell.group.traverse((o) => {
      if (o.isMesh) o.userData._castShadowOriginal = o.userData._castShadowOriginal ?? o.castShadow;
    });
  }
  const wantShadows = level === 'near';
  cell.group.traverse((o) => {
    if (o.isMesh) o.castShadow = wantShadows && (o.userData?._castShadowOriginal ?? false);
  });
}

function disposeCell(scene, cell) {
  for (const t of cell.traps) t.dispose?.();
  scene.remove(cell.group);
  cell.group.traverse((o) => {
    if (o.geometry && !o.userData?.sharedGeo) o.geometry.dispose?.();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
      else o.material.dispose?.();
    }
  });
}

const cellKey = (cx, cz) => `${cx},${cz}`;

export class ChunkManager {
  constructor(scene, { foliage = 1 } = {}) {
    this.scene = scene;
    this.foliage = foliage;          // grass-tuft density from quality preset
    this.cells = new Map();          // key -> cell record
    this._lastPlayerCell = null;
    this._building = new Set();      // keys currently scheduled but not built
    this.raisedFlags = new Set();    // level indices that are currently raised
    this.collectedWisps = new Set(); // wisp ids collected this run
  }

  // Mark a flag level as raised. Called from index.jsx when the player's
  // proximity check fires. Already-raised flags are silently ignored.
  raiseFlag(level) {
    if (this.raisedFlags.has(level)) return false;
    this.raisedFlags.add(level);
    return true;
  }

  // Ensure cells around the player are loaded; dispose cells too far away.
  // First load is sync (so the player never spawns into a void); the
  // 3×3 ring after that is deferred via requestIdleCallback when supported.
  ensureLoadedAround(playerX, playerZ) {
    const [pcx, pcz] = cellOf(playerX, playerZ);
    // LOD pass — every cell, every call, with an early-out inside applyCellLOD.
    for (const cell of this.cells.values()) {
      const dist = Math.max(Math.abs(cell.cx - pcx), Math.abs(cell.cz - pcz));
      applyCellLOD(cell, dist === 0 ? 'near' : 'far');
    }

    const newKey = cellKey(pcx, pcz);
    if (this._lastPlayerCell === newKey) return;
    this._lastPlayerCell = newKey;

    const wanted = new Set();
    for (let dx = -CELLS_AROUND; dx <= CELLS_AROUND; dx++) {
      for (let dz = -CELLS_AROUND; dz <= CELLS_AROUND; dz++) {
        const cx = pcx + dx, cz = pcz + dz;
        const k = cellKey(cx, cz);
        wanted.add(k);
        if (this.cells.has(k) || this._building.has(k)) continue;
        if (this.cells.size === 0) {
          this.cells.set(k, buildCell(this.scene, cx, cz, this.raisedFlags, this.foliage, this.collectedWisps));
        } else {
          this._building.add(k);
          idle(() => {
            if (!this._building.has(k)) return;
            this._building.delete(k);
            if (this.cells.has(k)) return;
            this.cells.set(k, buildCell(this.scene, cx, cz, this.raisedFlags, this.foliage, this.collectedWisps));
          });
        }
      }
    }
    for (const [k, cell] of this.cells) {
      if (!wanted.has(k)) {
        disposeCell(this.scene, cell);
        this.cells.delete(k);
      }
    }
    for (const k of this._building) {
      if (!wanted.has(k)) this._building.delete(k);
    }
  }

  tickTraps(dt, ctx) {
    this._wispT = (this._wispT || 0) + dt;
    for (const cell of this.cells.values()) {
      for (const trap of cell.traps) trap.tick(dt, ctx);
      if (cell.flag) {
        const want = this.raisedFlags.has(cell.flag.level);
        tickFlag(cell.flag.mesh, dt, want);
      }
      // Wisp idle — hover bob + slow spin, cheap enough to run always.
      for (const w of cell.wisps) {
        const core = w.mesh.userData.core;
        core.position.y = 1.0 + Math.sin(this._wispT * 2.4 + w.x) * 0.12;
        core.rotation.y = this._wispT * 1.8;
      }
    }
  }

  // Uncollected wisps within `radius` of the player. The caller collects
  // via collectWisp(id) which latches the run-wide set and hides the mesh.
  *wispsNear(playerX, playerZ, radius = 1.2) {
    const r2 = radius * radius;
    for (const cell of this.cells.values()) {
      for (const w of cell.wisps) {
        if (this.collectedWisps.has(w.id)) continue;
        const dx = playerX - w.x;
        const dz = playerZ - w.z;
        if (dx * dx + dz * dz <= r2) yield w;
      }
    }
  }

  collectWisp(id) {
    if (this.collectedWisps.has(id)) return false;
    this.collectedWisps.add(id);
    for (const cell of this.cells.values()) {
      const w = cell.wisps.find((x) => x.id === id);
      if (w) { w.mesh.visible = false; break; }
    }
    return true;
  }

  // Loaded flags whose anchor is within `radius` metres of the player.
  // Used by index.jsx to detect the proximity-based "raise" trigger.
  *flagsNear(playerX, playerZ, radius = FLAG_TOUCH_RADIUS) {
    const r2 = radius * radius;
    for (const cell of this.cells.values()) {
      const f = cell.flag;
      if (!f) continue;
      const dx = playerX - f.anchor.x;
      const dz = playerZ - f.anchor.z;
      if (dx * dx + dz * dz <= r2) yield f;
    }
  }

  checkLethalHit(player, playerRadius) {
    for (const cell of this.cells.values()) {
      for (const trap of cell.traps) {
        if (trap.hitsPlayer(player, playerRadius)) return trap;
      }
    }
    return null;
  }

  *traps() {
    for (const cell of this.cells.values()) {
      for (const trap of cell.traps) yield trap;
    }
  }

  // All wall AABBs from currently-loaded cells. Used by player.js to
  // resolve circle-vs-rectangle collisions every frame.
  *wallAABBs() {
    for (const cell of this.cells.values()) {
      for (const w of cell.wallAABBs) yield w;
    }
  }

  disposeAll() {
    for (const cell of this.cells.values()) disposeCell(this.scene, cell);
    this.cells.clear();
    this._building.clear();
    this._lastPlayerCell = null;
  }

  sampleHeight(x, z) {
    return sampleHeightGlobal(x, z);
  }

  // Biome lookup for the cell at world coordinates — used by index.jsx
  // to pick HUD labels and ambient audio.
  biomeAt(x, z) {
    const [cx, cz] = cellOf(x, z);
    return biomeAt(cx, cz);
  }
}
