// Grudgewood — chunk manager for the streaming, infinite forest.
//
// The world is sliced into fixed-length tiles along Z. As the player walks
// forward, chunks ahead of them are built on demand and chunks far behind
// are disposed. Each chunk owns a terrain mesh, decorative props, and a
// set of traps; the manager forwards per-frame updates and lethal-hit
// checks. Chunk builds are deferred via the next idle/microtask so a
// boundary crossing never costs a single frame.

import * as THREE from 'three';
import { CHUNK_LENGTH, CHUNK_HALF_W } from './chunkConstants.js';
import { pathOffsetAt, sampleHeight as sampleHeightGlobal, noise2D } from './heightmap.js';
import { biomeAt, biomeForChunk } from './biomeProgression.js';
import { spawnChunkContent } from './spawn.js';
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

export { CHUNK_LENGTH, CHUNK_HALF_W };

// Lowering terrain mesh resolution doubles the framerate on low-end laptops
// without changing how the corridor reads visually. The path widths are
// already authored at metre scale so 24×48 verts is plenty of detail.
const TERRAIN_RES_X = 24;
const TERRAIN_RES_Z = 48;
const CHUNKS_AHEAD = 2;
const CHUNKS_BEHIND = 1;

const TRAP_CLASS = {
  whip: BranchWhip, snare: RootSnare, mushroom: MushroomPop, log: RollingLog,
  pit: HiddenPit, predator: PredatorTree, stump: FakeStump, embers: EmberRain,
  wind: WindGust, sign: LyingSign,
  acorn: AcornCannon, boar: BoarTree, vine: CarnivorousVine,
  boulder: BoulderDrop, geyser: TarGeyser, spore: SporeCloud,
  lash: BranchLashCombo, mirror: MirrorTree,
};
const PROP_BUILDER = {
  tree:     (b, e) => makeTree(b, e.scale || 1, e.variant || 0),
  pine:     (b, e) => makePine(b, e.scale || 1),
  shrub:    (b, e) => makeShrub(b, e.scale || 1),
  rock:     (b, e) => makeRock(b, e.scale || 1),
  stump:    (b, e) => makeStump(b, e.scale || 1),
  mushroom: (b, e) => makeMushroom(b, e.capColor || '#c33', e.scale || 1),
};

// Defer non-blocking work to the next idle slot when the browser supports
// it; otherwise fall through to a microtask. The whole point is that a
// chunk build never stalls a single render frame.
const idle = (cb) => {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(cb, { timeout: 250 });
  } else {
    Promise.resolve().then(cb);
  }
};

function buildChunkTerrain(biome, chunkIndex) {
  const z0 = chunkIndex * CHUNK_LENGTH;
  const geo = new THREE.PlaneGeometry(CHUNK_HALF_W * 2, CHUNK_LENGTH, TERRAIN_RES_X, TERRAIN_RES_Z);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, CHUNK_LENGTH / 2 + z0);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cGround = biome.ground.color;
  const cDark = biome.ground.darken;
  const cGrass = biome.grass.color;
  const cGrassLt = biome.grass.light;
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = sampleHeightGlobal(x, z);
    pos.setY(i, y);
    const dist = Math.abs(x - pathOffsetAt(z));
    const t = Math.max(0, Math.min(1, 1 - dist / 7));
    const g = Math.max(0, Math.min(1, (noise2D(x * 0.4, z * 0.4) - 0.4) * 1.6));
    tmp.copy(cGround).lerp(cGrass, t * 0.6).lerp(cGrassLt, t * g * 0.55);
    if (y > 1.5) tmp.lerp(cDark, Math.min(1, (y - 1.5) / 4));
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

function buildChunk(scene, chunkIndex) {
  const biome = biomeForChunk(chunkIndex, CHUNK_LENGTH);
  const group = new THREE.Group();
  scene.add(group);

  const terrain = buildChunkTerrain(biome, chunkIndex);
  group.add(terrain);

  const { traps: trapDefs, props: propDefs, archetype } = spawnChunkContent(chunkIndex, biome, CHUNK_LENGTH);

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

  // LOD state — every prop in this chunk, with its kind tagged. Used by
  // applyLOD below to switch shadow casting and material detail when the
  // player walks far enough away that fine detail won't read.
  const lodProps = props.map((m) => ({ mesh: m, kind: m.userData?.kind }));

  return { index: chunkIndex, group, terrain, props, traps, biome, archetype, lodProps, _lodLevel: 'near' };
}

// Walk a chunk and toggle prop detail. "near" keeps shadow casting on;
// "far" disables shadows and removes the inner foliage blobs that don't
// read past ~50m. Cheap to flip — just a per-mesh attribute toggle, no
// rebuild.
function applyChunkLOD(chunk, level) {
  if (chunk._lodLevel === level) return;
  chunk._lodLevel = level;
  // Snapshot the original cast-shadow flag BEFORE we mutate it — otherwise
  // the first transition to "far" overwrites every mesh's `castShadow` with
  // false, the snapshot reads that false, and shadows are lost permanently.
  if (!chunk._lodSnapshotted) {
    chunk._lodSnapshotted = true;
    chunk.group.traverse((o) => {
      if (o.isMesh) o.userData._castShadowOriginal = o.userData._castShadowOriginal ?? o.castShadow;
    });
  }
  const wantShadows = level === 'near';
  chunk.group.traverse((o) => {
    if (o.isMesh) o.castShadow = wantShadows && (o.userData?._castShadowOriginal ?? false);
  });
}

function disposeChunk(scene, chunk) {
  for (const t of chunk.traps) t.dispose?.();
  scene.remove(chunk.group);
  chunk.group.traverse((o) => {
    if (o.geometry) o.geometry.dispose?.();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
      else o.material.dispose?.();
    }
  });
}

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this._lastPlayerChunk = null;
    this._building = new Set();          // indices currently scheduled but not built
  }

  // Ensure chunks around the player are loaded; dispose chunks too far away.
  // First load (when the manager has no chunks) is synchronous so the player
  // never spawns into a void; subsequent neighbour loads are deferred.
  ensureLoadedAround(playerZ) {
    const center = Math.floor(playerZ / CHUNK_LENGTH);
    // LOD update runs every call regardless of whether streaming changed,
    // so chunks transition smoothly as the player walks within a chunk.
    for (const chunk of this.chunks.values()) {
      const dist = Math.abs(chunk.index - center);
      // Keep both the player's chunk and the immediately-ahead chunk at
      // full detail. The next chunk is always within ~CHUNK_LENGTH metres
      // of the camera so its shadow casts very much read on screen.
      applyChunkLOD(chunk, dist <= 1 ? 'near' : 'far');
    }
    if (this._lastPlayerChunk === center) return;
    this._lastPlayerChunk = center;

    const minIdx = Math.max(0, center - CHUNKS_BEHIND);
    const maxIdx = center + CHUNKS_AHEAD;

    for (let i = minIdx; i <= maxIdx; i++) {
      if (this.chunks.has(i) || this._building.has(i)) continue;
      if (this.chunks.size === 0) {
        // Cold start — must be ready before the loop runs the first frame.
        this.chunks.set(i, buildChunk(this.scene, i));
      } else {
        this._building.add(i);
        idle(() => {
          if (!this._building.has(i)) return;     // disposed before build
          this._building.delete(i);
          if (this.chunks.has(i)) return;
          this.chunks.set(i, buildChunk(this.scene, i));
        });
      }
    }
    for (const [idx, chunk] of this.chunks) {
      if (idx < minIdx || idx > maxIdx) {
        disposeChunk(this.scene, chunk);
        this.chunks.delete(idx);
      }
    }
    // Cancel pending builds outside the window.
    for (const idx of this._building) {
      if (idx < minIdx || idx > maxIdx) this._building.delete(idx);
    }
  }

  tickTraps(dt, ctx) {
    for (const chunk of this.chunks.values()) {
      for (const trap of chunk.traps) trap.tick(dt, ctx);
    }
  }

  checkLethalHit(player, playerRadius) {
    for (const chunk of this.chunks.values()) {
      for (const trap of chunk.traps) {
        if (trap.hitsPlayer(player, playerRadius)) return trap;
      }
    }
    return null;
  }

  *traps() {
    for (const chunk of this.chunks.values()) {
      for (const trap of chunk.traps) yield trap;
    }
  }

  // Find the chunk containing a Z and report its archetype + biome — used
  // by the HUD to label the current room ("Bend", "Clearing", etc.).
  archetypeAt(z) {
    const idx = Math.floor(z / CHUNK_LENGTH);
    return this.chunks.get(idx)?.archetype || null;
  }

  disposeAll() {
    for (const chunk of this.chunks.values()) disposeChunk(this.scene, chunk);
    this.chunks.clear();
    this._building.clear();
    this._lastPlayerChunk = null;
  }

  sampleHeight(x, z) {
    return sampleHeightGlobal(x, z);
  }

  biomeAt(z) { return biomeAt(z); }
}
