// Predator tree — a tree with a glowing eye that tracks the player. When the
// player stops in its sightline, the canopy strikes downward like an axe.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makePredatorTree } from '../props.js';
import { sfx } from '../audio.js';

const tmpV = new THREE.Vector3();

export class PredatorTree extends Trap {
  constructor({ biome, anchor }) {
    const g = makePredatorTree(biome);
    g.position.copy(anchor);
    super({ kind: 'predator', group: g, anchor, hitRadius: 1.6, anticipation: 1.0, cooldown: 3.5 });
    this.eye = g.userData.eye;
    this.tree = g;
    this.lockTimer = 0;
    this.strikeT = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    const dx = ctx.player.x - this.anchor.x;
    const dz = ctx.player.z - this.anchor.z;
    const range = Math.hypot(dx, dz);

    // Eye pulse pulse.
    const pulse = 0.8 + Math.sin(this.t * 4) * 0.4;
    this.eye.material.emissiveIntensity = pulse;

    // Lock-on if player slow inside range.
    if (this.phase === 'idle') {
      if (range < 7 && ctx.playerSpeedXZ < 1.6) {
        this.lockTimer += dt;
        if (this.lockTimer > 0.6) {
          this.phase = 'anticipation';
          this.t = 0;
          this.lockTimer = 0;
          sfx.predEye();
        }
      } else {
        this.lockTimer = Math.max(0, this.lockTimer - dt * 0.7);
      }
    } else if (this.phase === 'anticipation') {
      const k = Math.min(1, this.t / this.anticipation);
      // Tree leans toward player.
      this.tree.rotation.x = Math.sin(k * Math.PI) * 0.18;
      this.eye.material.emissiveIntensity = 1.6 + k * 1.5;
      if (this.t >= this.anticipation) {
        this.phase = 'strike';
        this.t = 0;
        sfx.predStrike();
      }
    } else if (this.phase === 'strike') {
      const k = Math.min(1, this.t / 0.18);
      this.tree.rotation.x = THREE.MathUtils.lerp(0.18, -0.45, k);
      // Lethal sphere swings forward in front of the tree along XZ vector to player at lock time.
      const fx = dx, fz = dz;
      const mag = Math.max(0.001, Math.hypot(fx, fz));
      tmpV.set(this.anchor.x + (fx / mag) * 3 * k, this.anchor.y + 1.0, this.anchor.z + (fz / mag) * 3 * k);
      this.lethalCenter.copy(tmpV);
      this.hitRadius = 1.6;
      this.lethalActive = true;
      if (this.t >= 0.18) { this.phase = 'cooldown'; this.t = 0; this.lethalActive = false; }
    } else {
      const k = Math.min(1, this.t / 1.2);
      this.tree.rotation.x = THREE.MathUtils.lerp(-0.45, 0, k);
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
