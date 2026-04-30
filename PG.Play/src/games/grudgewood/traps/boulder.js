// Boulder Drop — a tree that hangs a boulder over the path, drops a clear
// shadow circle on the ground, and releases the rock when the player
// stands inside it. Dodge by leaving the circle. Death is unambiguous:
// the rock is bigger than the player.

import * as THREE from 'three';
import { Trap } from './base.js';
import { sfx } from '../audio.js';

const SHADOW_RADIUS = 1.3;
const WINDUP = 0.7;
const FALL_TIME = 0.55;
const COOLDOWN = 3.4;

export class BoulderDrop extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // Stout pine-shaped tree above the path.
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, 5.5, 7),
      new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
    );
    trunk.position.y = 2.8;
    trunk.castShadow = true;
    g.add(trunk);
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 0),
      new THREE.MeshStandardMaterial({ color: biome.treeLeaf, roughness: 0.85, flatShading: true }),
    );
    canopy.position.y = 6;
    canopy.castShadow = true;
    g.add(canopy);

    // Boulder — held by branches above the path until released.
    const boulder = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({ color: biome.rock, roughness: 0.9, flatShading: true }),
    );
    boulder.position.y = 5.6;
    boulder.castShadow = true;
    g.add(boulder);

    // Shadow circle on the ground — high contrast against any biome.
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(SHADOW_RADIUS, 24),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.42, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);

    // Warning ring — bright accent. Pulses while player is inside.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(SHADOW_RADIUS - 0.05, SHADOW_RADIUS + 0.15, 28),
      new THREE.MeshBasicMaterial({ color: '#ff6060', transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    g.add(ring);

    super({ kind: 'boulder', group: g, anchor, hitRadius: 1.0, anticipation: WINDUP, cooldown: COOLDOWN });
    this.boulder = boulder;
    this.shadow = shadow;
    this.ring = ring;
    this.startY = 5.6;
  }

  tick(dt, ctx) {
    this.t += dt;
    const onTop = Math.hypot(ctx.player.x - this.anchor.x, ctx.player.z - this.anchor.z) < SHADOW_RADIUS + 0.2;

    if (this.phase === 'idle') {
      // Boulder bobs slightly so it reads "held precariously".
      this.boulder.position.y = this.startY + Math.sin(this.t * 1.6) * 0.08;
      if (onTop) {
        this.phase = 'winding';
        this.t = 0;
        sfx.branchCreak?.();
      }
      this.ring.material.opacity = 0;
    } else if (this.phase === 'winding') {
      const k = Math.min(1, this.t / WINDUP);
      // Ring strobes red — visible from far away.
      this.ring.material.opacity = 0.4 + Math.sin(this.t * 24) * 0.4 * (k);
      // Boulder rocks more aggressively.
      this.boulder.position.x = Math.sin(this.t * 18) * 0.12 * k;
      if (this.t >= WINDUP) {
        this.phase = 'falling';
        this.t = 0;
        sfx.branchSnap?.();
      }
    } else if (this.phase === 'falling') {
      const k = Math.min(1, this.t / FALL_TIME);
      // Quadratic fall feels heavier than linear.
      const y = this.startY + (0.4 - this.startY) * k * k;
      this.boulder.position.y = y;
      this.boulder.rotation.x += dt * 6;
      this.lethalCenter.set(this.anchor.x, this.anchor.y + y, this.anchor.z);
      this.hitRadius = 1.0;
      this.lethalActive = y < 3.5;
      if (this.t >= FALL_TIME) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
        sfx.logImpact?.();
      }
    } else {
      // Cooldown — boulder slowly hauled back into place.
      const k = Math.min(1, this.t / (COOLDOWN * 0.7));
      this.boulder.position.y = THREE.MathUtils.lerp(0.4, this.startY, k);
      this.boulder.position.x = 0;
      this.ring.material.opacity = Math.max(0, this.ring.material.opacity - dt * 2);
      if (this.t >= COOLDOWN) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
