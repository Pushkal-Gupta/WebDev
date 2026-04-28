// Grudgewood — chunk manager for a streaming, infinite forest.
//
// The world is sliced into fixed-length tiles along Z. As the player walks
// forward, chunks ahead of them are built on demand and chunks far behind
// are disposed. Each chunk owns a terrain mesh, decorative props, and a set
// of traps; the manager forwards per-frame updates and lethal-hit checks.
//
// Why chunks instead of one giant world: GPU memory scales with mesh count
// and trap count. Chunked streaming keeps the active scene small (~3 chunks)
// no matter how far the player has run.

import * as THREE from 'three';
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

export const CHUNK_LENGTH = 64;     // meters along Z per chunk
export const CHUNK_HALF_W = 32;     // meters either side of the corridor
const TERRAIN_RES_X = 30;
const TERRAIN_RES_Z = 64;
const CHUNKS_AHEAD = 2;             // load this many chunks beyond the player
const CHUNKS_BEHIND = 1;            // keep one behind so the player can backtrack briefly

const TRAP_CLASS = {
  whip: BranchWhip, snare: RootSnare, mushroom: MushroomPop, log: RollingLog,
  pit: HiddenPit, predator: PredatorTree, stump: FakeStump, embers: EmberRain,
  wind: WindGust, sign: LyingSign,
};
const PROP_BUILDER = {
  tree:     (b, e) => makeTree(b, e.scale || 1, e.variant || 0),
  pine:     (b, e) => makePine(b, e.scale || 1),
  shrub:    (b, e) => makeShrub(b, e.scale || 1),
  rock:     (b, e) => makeRock(b, e.scale || 1),
  stump:    (b, e) => makeStump(b, e.scale || 1),
  mushroom: (b, e) => makeMushroom(b, e.capColor || '#c33', e.scale || 1),
};

// Build a flat-relative terrain mesh for a chunk. The mesh is positioned at
// world Z = chunkIndex * CHUNK_LENGTH; vertices and the height sample function
// are both expressed in world coordinates so adjacent chunks line up.
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
    const t = Math.max(0, Math.min(1, 1 - dist / 6));
    const g = Math.max(0, Math.min(1, (noise2D(x * 0.4, z * 0.4) - 0.4) * 1.6));
    tmp.copy(cGround).lerp(cGrass, t * 0.55).lerp(cGrassLt, t * g * 0.5);
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

// One chunk = its terrain + props + traps + scene group.
function buildChunk(scene, chunkIndex) {
  const biome = biomeForChunk(chunkIndex, CHUNK_LENGTH);
  const group = new THREE.Group();
  scene.add(group);

  const terrain = buildChunkTerrain(biome, chunkIndex);
  group.add(terrain);

  const { traps: trapDefs, props: propDefs } = spawnChunkContent(chunkIndex, biome, CHUNK_LENGTH);

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

  return { index: chunkIndex, group, terrain, props, traps, biome };
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
    this.chunks = new Map();      // chunkIndex -> chunk
    this._lastPlayerChunk = null; // cache so we only re-stream on chunk-change
  }

  // Ensure chunks around the player are loaded; dispose chunks too far away.
  ensureLoadedAround(playerZ) {
    const center = Math.floor(playerZ / CHUNK_LENGTH);
    if (this._lastPlayerChunk === center) return;
    this._lastPlayerChunk = center;

    const minIdx = Math.max(0, center - CHUNKS_BEHIND);
    const maxIdx = center + CHUNKS_AHEAD;

    // Load anything missing.
    for (let i = minIdx; i <= maxIdx; i++) {
      if (!this.chunks.has(i)) {
        this.chunks.set(i, buildChunk(this.scene, i));
      }
    }
    // Drop anything outside the window.
    for (const [idx, chunk] of this.chunks) {
      if (idx < minIdx || idx > maxIdx) {
        disposeChunk(this.scene, chunk);
        this.chunks.delete(idx);
      }
    }
  }

  // Walk every active trap, ticking it and forwarding ctx (player pos etc).
  tickTraps(dt, ctx) {
    for (const chunk of this.chunks.values()) {
      for (const trap of chunk.traps) trap.tick(dt, ctx);
    }
  }

  // First lethal trap hitting the player, or null.
  checkLethalHit(player, playerRadius) {
    for (const chunk of this.chunks.values()) {
      for (const trap of chunk.traps) {
        if (trap.hitsPlayer(player, playerRadius)) return trap;
      }
    }
    return null;
  }

  // Iterate all active traps for camera near-miss checks.
  *traps() {
    for (const chunk of this.chunks.values()) {
      for (const trap of chunk.traps) yield trap;
    }
  }

  // Dispose every loaded chunk. Used on game teardown.
  disposeAll() {
    for (const chunk of this.chunks.values()) disposeChunk(this.scene, chunk);
    this.chunks.clear();
    this._lastPlayerChunk = null;
  }

  // Sample terrain height at any world coordinate. Pure function via the
  // global heightmap, so chunks don't actually need to be loaded for this.
  sampleHeight(x, z) {
    return sampleHeightGlobal(x, z);
  }

  // Biome description and biome-blend at a given Z. Used for the engine's
  // sky/fog crossfade and the HUD label.
  biomeAt(z) { return biomeAt(z); }
}
