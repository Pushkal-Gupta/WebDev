// Spore Cloud — a slowfield. Stepping into the haze halves the player's
// max speed for a beat; not lethal alone, but pairs ruthlessly with
// predator trees and acorn cannons that count on the player's normal
// reach to dodge.
//
// Implemented as a "trap" because it lives in the same lifecycle as one,
// but its lethalActive stays false. It applies a clean slow effect
// through ctx.applySlow on the player controller.

import * as THREE from 'three';
import { Trap } from './base.js';

const RADIUS = 2.0;
const SLOW_FACTOR = 0.55;
const SLOW_DURATION = 0.18;     // refreshed every frame the player is inside

export class SporeCloud extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    const stain = new THREE.Mesh(
      new THREE.CircleGeometry(RADIUS, 24),
      new THREE.MeshBasicMaterial({ color: '#a060ff', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.y = 0.05;
    g.add(stain);

    const cloudMat = new THREE.MeshBasicMaterial({
      color: '#c89cff', transparent: true, opacity: 0.28, depthWrite: false,
    });
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.9, 14, 10), cloudMat);
    cloud.position.y = 0.85;
    cloud.scale.set(1, 0.45, 1);
    g.add(cloud);

    super({ kind: 'spore', group: g, anchor, hitRadius: 0, anticipation: 0, cooldown: 0 });
    this.stain = stain;
    this.cloud = cloud;
  }

  tick(dt, ctx) {
    this.t += dt;
    const breath = 1 + Math.sin(this.t * 1.8) * 0.06;
    this.cloud.scale.set(breath, 0.45 * breath, breath);

    const dx = ctx.player.x - this.anchor.x;
    const dz = ctx.player.z - this.anchor.z;
    if (Math.hypot(dx, dz) < RADIUS && ctx.applySlow) {
      ctx.applySlow(SLOW_FACTOR, SLOW_DURATION);
    }
  }

  // Spore does not register lethal hits.
  hitsPlayer() { return false; }
}
