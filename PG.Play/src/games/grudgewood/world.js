// Grudgewood — world manager. Owns the active terrain segment and a sliver
// of the next segment for visual continuity. Spawns props/traps/checkpoints
// and exposes per-frame update + collision.

import * as THREE from 'three';
import { buildTerrain, TERRAIN_SEG_LEN } from './terrain.js';
import { biomeFor } from './biomes.js';
import { makeTree, makePine, makeShrub, makeRock, makeStump, makeMushroom, makeCheckpoint } from './props.js';
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
import { SEGMENTS, SECRETS } from './levels.js';
import { sfx } from './audio.js';

const TRAP_CLASS = {
  whip: BranchWhip,
  snare: RootSnare,
  mushroom: MushroomPop,
  log: RollingLog,
  pit: HiddenPit,
  predator: PredatorTree,
  stump: FakeStump,
  embers: EmberRain,
  wind: WindGust,
  sign: LyingSign,
};

const PROP_BUILDER = {
  tree: (b, e) => makeTree(b, e.scale || 1, e.variant || 0),
  pine: (b, e) => makePine(b, e.scale || 1),
  shrub: (b, e) => makeShrub(b, e.scale || 1),
  rock: (b, e) => makeRock(b, e.scale || 1),
  stump: (b, e) => makeStump(b, e.scale || 1),
  mushroom: (b, e) => makeMushroom(b, e.capColor || '#c33', e.scale || 1),
};

export class World {
  constructor(scene) {
    this.scene = scene;
    this.segmentIndex = -1;
    this.segmentGroup = null;
    this.terrain = null;
    this.traps = [];
    this.props = [];
    this.checkpoints = [];
    this.secret = null;
    this.altar = null;
    this.particles = null;
    this.particleField = null;
  }

  loadSegment(index) {
    const def = SEGMENTS[index];
    if (!def) return null;
    this.disposeSegment();
    this.segmentIndex = index;

    const biome = biomeFor(def.biome);
    const group = new THREE.Group();
    this.scene.add(group);
    this.segmentGroup = group;

    // Terrain.
    const terrain = buildTerrain(biome, index);
    group.add(terrain.mesh);
    this.terrain = terrain;

    // Decorative props — placed in segment-local Z, offset along ground via height sample.
    for (const e of def.props || []) {
      const builder = PROP_BUILDER[e.kind];
      if (!builder) continue;
      const m = builder(biome, e);
      const x = e.x;
      const z = e.z;
      const y = terrain.sampleHeight(x, z);
      m.position.set(x, y, z);
      group.add(m);
      this.props.push(m);
    }

    // Traps + checkpoints from segment definition.
    for (const t of def.traps || []) {
      if (t.kind === 'checkpoint') {
        const cp = makeCheckpoint(biome);
        const x = t.x ?? 0;
        const z = t.z;
        const y = terrain.sampleHeight(x, z);
        cp.position.set(x, y, z);
        group.add(cp);
        this.checkpoints.push({ obj: cp, anchor: new THREE.Vector3(x, y, z), reached: false, segmentIndex: index });
        continue;
      }
      if (t.kind === 'altar') {
        // Special: the axe altar — interactable, not a trap.
        const altar = new THREE.Group();
        const stone = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.6, 1.6),
          new THREE.MeshStandardMaterial({ color: biome.rock, roughness: 0.8, flatShading: true }),
        );
        stone.position.y = 0.3;
        stone.castShadow = true;
        altar.add(stone);
        const axe = new THREE.Group();
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x5a3a1f, roughness: 0.9 }),
        );
        handle.rotation.z = Math.PI / 2;
        axe.add(handle);
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.22, 0.06),
          new THREE.MeshStandardMaterial({ color: 0xddeeff, emissive: 0x4060a0, emissiveIntensity: 1.6, metalness: 0.7, roughness: 0.2 }),
        );
        head.position.set(0.7, 0, 0);
        axe.add(head);
        axe.position.set(t.x ?? 0, terrain.sampleHeight(t.x ?? 0, t.z) + 1.0, t.z);
        group.add(altar);
        const altarPos = new THREE.Vector3(t.x ?? 0, terrain.sampleHeight(t.x ?? 0, t.z), t.z);
        altar.position.copy(altarPos);
        group.add(axe);
        this.altar = { obj: altar, axeMesh: axe, anchor: altarPos.clone() };
        continue;
      }
      const Cls = TRAP_CLASS[t.kind];
      if (!Cls) continue;
      const x = t.x ?? 0;
      const z = t.z;
      const y = terrain.sampleHeight(x, z);
      const trap = new Cls({ biome, anchor: new THREE.Vector3(x, y, z), ...(t.opts || {}) });
      group.add(trap.group);
      this.traps.push(trap);
    }

    // Secret marker for this segment, if any.
    const sec = SECRETS.find((s) => s.segmentIndex === index);
    if (sec) {
      const y = terrain.sampleHeight(sec.x, sec.z);
      // Visualize as a faint sparkle (small icosahedron).
      const s = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color: biome.accent, emissive: biome.accent, emissiveIntensity: 1.2 }),
      );
      s.position.set(sec.x, y + 0.4, sec.z);
      group.add(s);
      this.secret = { id: sec.id, hat: sec.hat, anchor: new THREE.Vector3(sec.x, y, sec.z), mesh: s, taken: false };
    }

    // Atmosphere particles — drifting motes / falling embers.
    this.particleField = makeParticles(biome);
    group.add(this.particleField.mesh);

    return def;
  }

  disposeSegment() {
    if (!this.segmentGroup) return;
    for (const t of this.traps) t.dispose?.();
    this.traps = [];
    this.props = [];
    this.checkpoints = [];
    this.secret = null;
    this.altar = null;
    if (this.particleField) {
      this.particleField.mesh.geometry.dispose();
      this.particleField.mesh.material.dispose();
      this.particleField = null;
    }
    this.scene.remove(this.segmentGroup);
    this.segmentGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
    this.segmentGroup = null;
    this.terrain = null;
  }

  sampleHeight(x, z) {
    if (!this.terrain) return 0;
    return this.terrain.sampleHeight(x, z);
  }

  // dt + ctx { player, playerSpeedXZ, playerGrounded, applyForce }
  update(dt, ctx) {
    for (const trap of this.traps) trap.tick(dt, ctx);
    if (this.particleField) this.particleField.update(dt);

    // Spin axe altar reward.
    if (this.altar) {
      this.altar.axeMesh.rotation.y += dt * 1.4;
      this.altar.axeMesh.position.y = this.altar.anchor.y + 1.0 + Math.sin(performance.now() * 0.002) * 0.1;
    }
  }

  // Returns { reachedIndex, anchor } if a not-yet-reached checkpoint was just touched.
  checkCheckpointTouch(player) {
    for (const cp of this.checkpoints) {
      if (cp.reached) continue;
      if (cp.anchor.distanceTo(player) < 1.6) {
        cp.reached = true;
        cp.obj.userData.activate?.();
        sfx.checkpoint();
        return cp;
      }
    }
    return null;
  }

  // Returns secret hat id if the player is on the secret marker.
  checkSecretTouch(player) {
    if (!this.secret || this.secret.taken) return null;
    if (this.secret.anchor.distanceTo(player) < 1.0) {
      this.secret.taken = true;
      this.segmentGroup.remove(this.secret.mesh);
      this.secret.mesh.geometry.dispose();
      this.secret.mesh.material.dispose();
      sfx.hatUnlock();
      return { id: this.secret.id, hat: this.secret.hat };
    }
    return null;
  }

  // Returns first lethal trap hitting the player, or null.
  checkLethalHit(player, playerRadius) {
    for (const trap of this.traps) {
      if (trap.hitsPlayer(player, playerRadius)) return trap;
    }
    return null;
  }

  // Altar reach — returns true once when player touches altar.
  checkAltarReach(player) {
    if (!this.altar) return false;
    if (this.altar.anchor.distanceTo(player) < 1.6) {
      const reached = !this.altar.taken;
      this.altar.taken = true;
      return reached;
    }
    return false;
  }

  // Player has reached end of segment when z > segLength - 4.
  reachedEnd(player) {
    return player.z > TERRAIN_SEG_LEN - 4;
  }
}

function makeParticles(biome) {
  const count = biome.particle.count;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const fall = !!biome.particle.fall;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = Math.random() * 14 + (fall ? 4 : 0);
    positions[i * 3 + 2] = Math.random() * TERRAIN_SEG_LEN;
    if (fall) {
      velocities[i * 3] = (Math.random() - 0.5) * 0.3;
      velocities[i * 3 + 1] = -1.4 - Math.random() * 1.6;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    } else {
      velocities[i * 3] = -0.4 - Math.random() * 0.6;
      velocities[i * 3 + 1] = -0.05 + Math.random() * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: biome.particle.color,
    size: fall ? 0.16 : 0.10,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const mesh = new THREE.Points(geo, mat);

  function update(dt) {
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3] += velocities[i * 3] * dt;
      p[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      p[i * 3 + 2] += velocities[i * 3 + 2] * dt;
      // Wrap.
      if (p[i * 3] < -30) p[i * 3] += 60;
      if (p[i * 3] > 30) p[i * 3] -= 60;
      if (fall && p[i * 3 + 1] < 0.1) {
        p[i * 3 + 1] = 14;
        p[i * 3 + 2] = Math.random() * TERRAIN_SEG_LEN;
      }
      if (p[i * 3 + 2] < 0) p[i * 3 + 2] += TERRAIN_SEG_LEN;
      if (p[i * 3 + 2] > TERRAIN_SEG_LEN) p[i * 3 + 2] -= TERRAIN_SEG_LEN;
    }
    geo.attributes.position.needsUpdate = true;
  }

  return { mesh, update };
}
