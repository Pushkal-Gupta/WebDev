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
import { sampleHeight as sampleHeightGlobal, cellHasPlatform, PLATFORM } from './heightmap.js';
import { biomeAt, biomeForCell } from './biomeProgression.js';
import { spawnCellContent } from './spawn.js';
import { buildCellWalls } from './walls.js';
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
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = sampleHeightGlobal(x, z);
    pos.setY(i, y);
    // Smooth ground → grass blend with cell-local random patches so the
    // floor doesn't look flat-shaded uniform. No path stripe — the
    // forest reads cleaner without an explicit "go this way" marker;
    // we steer the player by walling off the wrong directions instead.
    const dx = x - (o.x + CELL_SIZE / 2);
    const dz = z - (o.z + CELL_SIZE / 2);
    const r = Math.hypot(dx, dz) / (CELL_SIZE * 0.7);
    const t = Math.max(0, 1 - r) * 0.6;
    tmp.copy(cGround).lerp(cGrass, t).lerp(cGrassLt, t * 0.4);
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

// Builds the visual deck + ramps for a platform cell. Heights match
// PLATFORM constants so the mesh sits exactly on the heightmap surface.
// Returned group can be added to the cell as a single child.
function buildPlatformMesh(biome, cx, cz) {
  const g = new THREE.Group();
  const cc = cellCenter(cx, cz);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: biome.rock, roughness: 0.95, metalness: 0.0, flatShading: true,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: biome.rock.clone().lerp(new THREE.Color('#ffffff'), 0.16),
    roughness: 0.9, flatShading: true,
  });

  // Deck — 4×4 box at +0.6 (centered on the platform's interior
  // mid-height). Top sits at PLATFORM.HEIGHT to match the heightmap.
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM.HALF * 2, PLATFORM.HEIGHT, PLATFORM.HALF * 2),
    stoneMat,
  );
  deck.position.set(cc.x, PLATFORM.HEIGHT / 2, cc.z);
  deck.castShadow = true;
  deck.receiveShadow = true;
  g.add(deck);
  // Cap stripe on the deck edges for a subtle step-line read.
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM.HALF * 2 + 0.06, 0.12, PLATFORM.HALF * 2 + 0.06),
    capMat,
  );
  cap.position.set(cc.x, PLATFORM.HEIGHT - 0.06, cc.z);
  cap.castShadow = true;
  g.add(cap);

  // South ramp — sloped triangular prism. Built as a thin box tilted
  // around its top-edge so the bottom touches y=0 and the top meets the
  // deck at y=PLATFORM.HEIGHT. Width matches the deck.
  const rampW = PLATFORM.HALF * 2;
  const rampLen = PLATFORM.RAMP_LENGTH;
  const slopeLen = Math.hypot(rampLen, PLATFORM.HEIGHT);
  const slopeAngle = Math.atan2(PLATFORM.HEIGHT, rampLen);
  // The ramp is a thin box rotated about X so its top edge sits at the
  // deck top and bottom edge sits on the ground rampLen away.
  function buildRamp(zOffsetSign) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(rampW, 0.18, slopeLen),
      stoneMat,
    );
    m.castShadow = true;
    m.receiveShadow = true;
    // The ramp's local +Z extends from the deck edge outward by rampLen
    // toward the ground. Rotate so the slope matches the elevation drop.
    m.rotation.x = zOffsetSign * slopeAngle;
    // Position centre: midway between deck edge (at cc.z ± HALF) and
    // ground edge (at cc.z ± HALF ± rampLen), at half the elevation.
    const mid = PLATFORM.HALF + rampLen / 2;
    m.position.set(cc.x, PLATFORM.HEIGHT / 2, cc.z + zOffsetSign * mid);
    g.add(m);
  }
  buildRamp(1);   // north
  buildRamp(-1);  // south

  return g;
}

function buildCell(scene, cx, cz, raisedFlags) {
  const biome = biomeForCell(cx, cz);
  const group = new THREE.Group();
  scene.add(group);

  group.add(buildCellFloor(biome, cx, cz));

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

  const { traps: trapDefs, props: propDefs } = spawnCellContent(cx, cz, biome);

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

  return { cx, cz, group, props, traps, biome, wallAABBs: wallResult.aabbs, flag, _lodLevel: 'near' };
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
    if (o.geometry) o.geometry.dispose?.();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
      else o.material.dispose?.();
    }
  });
}

const cellKey = (cx, cz) => `${cx},${cz}`;

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.cells = new Map();          // key -> cell record
    this._lastPlayerCell = null;
    this._building = new Set();      // keys currently scheduled but not built
    this.raisedFlags = new Set();    // level indices that are currently raised
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
          this.cells.set(k, buildCell(this.scene, cx, cz, this.raisedFlags));
        } else {
          this._building.add(k);
          idle(() => {
            if (!this._building.has(k)) return;
            this._building.delete(k);
            if (this.cells.has(k)) return;
            this.cells.set(k, buildCell(this.scene, cx, cz, this.raisedFlags));
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
    for (const cell of this.cells.values()) {
      for (const trap of cell.traps) trap.tick(dt, ctx);
      if (cell.flag) {
        const want = this.raisedFlags.has(cell.flag.level);
        tickFlag(cell.flag.mesh, dt, want);
      }
    }
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
