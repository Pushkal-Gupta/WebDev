// Wind gust — cliffside biome. A telegraphed gust pushes the player sideways
// while jumping, throwing off arc. Not directly lethal — it creates the miss.

import * as THREE from 'three';
import { Trap } from './base.js';
import { sfx } from '../audio.js';

export class WindGust extends Trap {
  constructor({ biome, anchor, dir = 1, force = 22, length = 8 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    // Visual: a faint elongated streak along the gust direction.
    const streakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.4), streakMat);
    streak.rotation.x = -Math.PI / 2;
    streak.rotation.z = 0; // along world X
    streak.position.y = 1.2;
    g.add(streak);

    super({ kind: 'wind', group: g, anchor, hitRadius: 0.0, anticipation: 0.5, cooldown: 2.2 });
    this.dir = dir;
    this.force = force;
    this.length = length;
    this.streak = streak;
    this.streakMat = streakMat;
  }

  tick(dt, ctx) {
    this.t += dt;
    if (this.phase === 'idle') {
      const inZone = Math.abs(ctx.player.x - this.anchor.x) < this.length / 2 && Math.abs(ctx.player.z - this.anchor.z) < 3;
      if (inZone) {
        this.phase = 'anticipation';
        this.t = 0;
      }
      this.streakMat.opacity = Math.max(0, this.streakMat.opacity - dt);
    } else if (this.phase === 'anticipation') {
      const k = Math.min(1, this.t / this.anticipation);
      this.streakMat.opacity = 0.4 * k;
      if (this.t >= this.anticipation) {
        this.phase = 'strike'; this.t = 0; sfx.windGust();
      }
    } else if (this.phase === 'strike') {
      // Apply external force on player while strike active.
      ctx.applyForce?.({ x: this.dir * this.force, y: 0, z: 0 }, dt);
      this.streakMat.opacity = 0.7;
      if (this.t >= 0.6) { this.phase = 'cooldown'; this.t = 0; }
    } else {
      const k = Math.min(1, this.t / this.cooldown);
      this.streakMat.opacity = THREE.MathUtils.lerp(0.7, 0, k);
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
