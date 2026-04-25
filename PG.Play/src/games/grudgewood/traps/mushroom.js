// Mushroom pop — looks like decoration. Step on it; the cap puffs and
// detonates a spore cloud that's lethal for a beat.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeMushroom } from '../props.js';
import { sfx } from '../audio.js';

export class MushroomPop extends Trap {
  constructor({ biome, anchor, capColor = '#c33' }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    const m = makeMushroom(biome, capColor, 1.0);
    g.add(m);

    // Spore puff (hidden until strike).
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 12, 10),
      new THREE.MeshBasicMaterial({ color: capColor, transparent: true, opacity: 0.0 }),
    );
    puff.position.y = 0.6;
    puff.scale.setScalar(0.01);
    g.add(puff);

    super({ kind: 'mushroom', group: g, anchor, hitRadius: 1.4, anticipation: 0.05, cooldown: 1.2 });
    this.cap = m.userData.cap;
    this.body = m;
    this.puff = puff;
  }

  tick(dt, ctx) {
    this.t += dt;
    if (this.phase === 'idle') {
      // Idle — cap idle wobble.
      this.cap.position.y = 0.6 + Math.sin(this.t * 3) * 0.02;
      if (this.anchor.distanceTo(ctx.player) < 1.0 && Math.abs(ctx.player.y - this.anchor.y) < 1.2) {
        this.phase = 'anticipation';
        this.t = 0;
        sfx.mushPop();
      }
    } else if (this.phase === 'anticipation') {
      // Quick squash before pop.
      const k = Math.min(1, this.t / 0.06);
      this.cap.scale.set(1 + k * 0.3, 1 - k * 0.3, 1 + k * 0.3);
      if (this.t >= 0.06) { this.phase = 'strike'; this.t = 0; }
    } else if (this.phase === 'strike') {
      const k = Math.min(1, this.t / 0.2);
      this.puff.scale.setScalar(THREE.MathUtils.lerp(0.4, 1.4, k));
      this.puff.material.opacity = THREE.MathUtils.lerp(0.7, 0.0, k);
      this.body.visible = k < 0.4;
      this.lethalActive = true;
      this.lethalCenter.copy(this.anchor).setY(this.anchor.y + 0.6);
      this.hitRadius = 1.4;
      if (this.t >= 0.2) {
        this.phase = 'cooldown'; this.t = 0; this.lethalActive = false;
      }
    } else {
      // Don't recover — stays popped (cap gone).
      this.body.visible = false;
      if (this.t >= this.cooldown) { /* stays in cooldown forever */ }
    }
  }
}
