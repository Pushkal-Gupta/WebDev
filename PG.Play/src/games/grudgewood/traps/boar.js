// Boar Tree — a stocky tree that uproots when the player crosses its line
// and charges sideways across the path at high speed. The telegraph is
// large and unmissable: dirt cloud, dust trail, hunch posture, and a
// solid red ground line showing where the charge will run. Dodge by
// jumping the body or sprinting clear before it commits.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree } from '../props.js';
import { sfx } from '../audio.js';

const REACH_Z = 5;             // trigger when player's z is within this many metres
const ENGAGE_X = 14;           // engage when player is within this lateral metres
const WINDUP = 0.8;
const CHARGE_SPEED = 16;
const CHARGE_DIST = 22;
const COOLDOWN = 4.0;

export class BoarTree extends Trap {
  constructor({ biome, anchor, side = 1 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // The "boar" is a squat, hunched tree; the trunk is wider and shorter.
    const tree = makeTree(biome, 1.0, 0);
    tree.scale.setScalar(0.85);
    g.add(tree);

    // Eyes — two glowing spheres so the tree reads as alive and pointed.
    const eyeMat = new THREE.MeshStandardMaterial({
      color: '#ff5050', emissive: '#ff5050', emissiveIntensity: 1.4, roughness: 0.3,
    });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
    eye1.position.set(-0.32, 3.2, side * 0.35);
    eye2.position.set( 0.32, 3.2, side * 0.35);
    g.add(eye1); g.add(eye2);

    // Charge-line decal — drawn along world-X, length = CHARGE_DIST.
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(CHARGE_DIST, 1.3),
      new THREE.MeshBasicMaterial({ color: '#ff3030', transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
    );
    line.rotation.x = -Math.PI / 2;
    // Anchored at trunk, extending across the path in the charge direction.
    line.position.set(-side * (CHARGE_DIST / 2), 0.05, 0);
    g.add(line);

    super({ kind: 'boar', group: g, anchor, hitRadius: 1.3, anticipation: WINDUP, cooldown: COOLDOWN });
    this.tree = tree;
    this.line = line;
    this.eyes = [eye1, eye2];
    this.side = side;             // -1 charges -X, +1 charges +X
    this.startX = 0;              // local X position
    this.t = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    const dz = Math.abs(ctx.player.z - this.anchor.z);
    const dx = ctx.player.x - this.anchor.x;

    if (this.phase === 'idle') {
      // Engage when player crosses our z-line and is on the path side.
      if (dz < REACH_Z && Math.abs(dx) < ENGAGE_X) {
        this.phase = 'winding';
        this.t = 0;
        sfx.rootRumble?.();
      }
      // Slow idle sway.
      this.tree.rotation.x = Math.sin(this.t * 1.0) * 0.04;
    } else if (this.phase === 'winding') {
      const k = Math.min(1, this.t / WINDUP);
      // Hunch back, charge line lights up.
      this.tree.rotation.x = -0.18 * k;
      this.tree.rotation.z = -this.side * 0.05 * k;
      this.line.material.opacity = 0.35 + k * 0.45;
      for (const e of this.eyes) e.material.emissiveIntensity = 1.4 + k * 1.2;

      if (this.t >= WINDUP) {
        this.phase = 'charge';
        this.t = 0;
        this.startX = this.tree.position.x;     // 0 in local coords
        sfx.branchSnap?.();
      }
    } else if (this.phase === 'charge') {
      // Move tree and lethal sphere together along world-X.
      const moved = -this.side * CHARGE_SPEED * this.t;     // -side because chargeDir = -side relative to startX
      this.tree.position.x = this.startX + moved;
      this.tree.rotation.x = -0.05 + Math.sin(this.t * 26) * 0.06;
      this.tree.rotation.z = this.side * 0.18;

      // Hitbox at the trunk's body height.
      this.lethalCenter.set(this.anchor.x + this.tree.position.x, this.anchor.y + 1.4, this.anchor.z);
      this.hitRadius = 1.5;
      this.lethalActive = true;

      if (Math.abs(moved) >= CHARGE_DIST) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
        sfx.logImpact?.();
      }
    } else {
      // Cooldown — tree returns home, line fades, eyes dim.
      const k = Math.min(1, this.t / (COOLDOWN * 0.6));
      this.tree.position.x = THREE.MathUtils.lerp(this.tree.position.x, 0, k);
      this.tree.rotation.x = THREE.MathUtils.lerp(-0.05, 0, k);
      this.tree.rotation.z = THREE.MathUtils.lerp(this.tree.rotation.z, 0, k);
      this.line.material.opacity = Math.max(0, this.line.material.opacity - dt * 1.2);
      for (const e of this.eyes) e.material.emissiveIntensity = Math.max(0.4, e.material.emissiveIntensity - dt * 2);
      if (this.t >= COOLDOWN) {
        this.tree.position.x = 0;
        this.phase = 'idle';
        this.t = 0;
      }
    }
  }
}
