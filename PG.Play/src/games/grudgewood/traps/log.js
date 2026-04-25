// Rolling log — a log perched at the high side of the corridor releases when
// the player enters its trigger zone, rolls along world-X (across the path),
// and is lethal while moving.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeLog } from '../props.js';
import { sfx } from '../audio.js';

export class RollingLog extends Trap {
  constructor({ biome, anchor, dir = -1, length = 5, speed = 14 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    const log = makeLog(biome, length, 0.6);
    log.position.set(dir > 0 ? -10 : 10, 0.6, 0);
    g.add(log);
    super({ kind: 'log', group: g, anchor, hitRadius: 0.85, anticipation: 0.6, cooldown: 4.0 });
    this.log = log;
    this.dir = dir;
    this.speed = speed;
    this.length = length;
    this.startX = log.position.x;
    this.travel = 22;
    this.creaked = false;
  }

  tick(dt, ctx) {
    this.t += dt;
    if (this.phase === 'idle') {
      const ahead = ctx.player.z - this.anchor.z;
      const trigger = Math.abs(ahead) < 6 && Math.abs(ctx.player.x - this.anchor.x) < 12;
      if (trigger) {
        this.phase = 'anticipation';
        this.t = 0;
        this.creaked = false;
      }
    } else if (this.phase === 'anticipation') {
      // Tilt log a bit, audio creak.
      this.log.rotation.z = -this.dir * Math.min(0.2, this.t / this.anticipation * 0.2);
      if (!this.creaked && this.t > 0.2) { this.creaked = true; sfx.branchCreak(); }
      if (this.t >= this.anticipation) {
        this.phase = 'strike';
        this.t = 0;
        sfx.logRoll();
      }
    } else if (this.phase === 'strike') {
      const moved = this.dir * this.speed * this.t;
      this.log.position.x = this.startX + moved;
      // Roll the log around world-Z visually.
      this.log.rotation.x += this.dir * dt * 8;
      this.lethalCenter.copy(this.anchor).add(new THREE.Vector3(this.log.position.x, 0.6, 0));
      this.hitRadius = 1.0;
      this.lethalActive = true;
      if (Math.abs(moved) > this.travel) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
        sfx.logImpact();
      }
    } else {
      // Reset log back to start slowly.
      const k = Math.min(1, this.t / 1.5);
      this.log.position.x = THREE.MathUtils.lerp(this.startX + this.dir * this.travel, this.startX, k);
      this.log.rotation.z = 0;
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
