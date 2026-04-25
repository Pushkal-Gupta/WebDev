// Fake stump — looks like an inviting place to step on. Player approaches,
// stump lifts up revealing a launching spike that flings them.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeStump } from '../props.js';
import { sfx } from '../audio.js';

export class FakeStump extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    const stump = makeStump(biome, 1.0);
    g.add(stump);
    // Spike — hidden inside the stump until strike.
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: '#e0d8b8', emissive: '#400', emissiveIntensity: 0.2, roughness: 0.5, flatShading: true }),
    );
    spike.position.y = 0.3;
    spike.scale.set(0.2, 0.01, 0.2);
    g.add(spike);

    super({ kind: 'stump', group: g, anchor, hitRadius: 1.0, anticipation: 0.5, cooldown: 2.5 });
    this.stump = stump;
    this.spike = spike;
  }

  tick(dt, ctx) {
    this.t += dt;
    if (this.phase === 'idle') {
      if (this.anchor.distanceTo(ctx.player) < 1.8) {
        this.phase = 'anticipation'; this.t = 0;
      }
    } else if (this.phase === 'anticipation') {
      // Stump bobs in place — false reassurance, then a small tilt.
      this.stump.rotation.z = Math.sin(this.t * 14) * 0.04;
      if (this.t >= this.anticipation) {
        this.phase = 'strike'; this.t = 0; sfx.rootSnap();
      }
    } else if (this.phase === 'strike') {
      const k = Math.min(1, this.t / 0.16);
      this.spike.scale.set(0.2 + k * 0.5, 0.01 + k * 1.4, 0.2 + k * 0.5);
      this.spike.position.y = 0.3 + k * 1.0;
      this.lethalActive = true;
      this.lethalCenter.copy(this.anchor).setY(this.anchor.y + 1.0);
      this.hitRadius = 0.8;
      if (this.t >= 0.16) { this.phase = 'cooldown'; this.t = 0; this.lethalActive = false; }
    } else {
      const k = Math.min(1, this.t / 1.2);
      this.spike.position.y = THREE.MathUtils.lerp(1.3, 0.3, k);
      this.spike.scale.set(THREE.MathUtils.lerp(0.7, 0.2, k), THREE.MathUtils.lerp(1.4, 0.01, k), THREE.MathUtils.lerp(0.7, 0.2, k));
      this.stump.rotation.z = 0;
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
