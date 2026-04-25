// Sign-lie — a cheerful sign points to a "shortcut" or labels a route SAFE.
// The trap is purely social — it's a hint generator. The sign has no lethal
// hitbox; it's read by the level designer to influence trap placement nearby.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeSign } from '../props.js';
import { sfx } from '../audio.js';

export class LyingSign extends Trap {
  constructor({ biome, anchor, label = 'SAFE', face = 1 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    const s = makeSign(biome, label);
    s.rotation.y = face * Math.PI / 2;
    g.add(s);
    super({ kind: 'sign', group: g, anchor, hitRadius: 0.0, anticipation: 0, cooldown: 0 });
    this.sign = s;
    this.creakedAt = -10;
  }

  tick(dt, ctx) {
    this.t += dt;
    // Idle creak when the player nears (sells the bait).
    const d = this.anchor.distanceTo(ctx.player);
    if (d < 4 && this.t - this.creakedAt > 1.6) {
      this.creakedAt = this.t;
      sfx.signCreak();
    }
    // Lazy sway.
    this.sign.rotation.z = Math.sin(this.t * 1.6) * 0.04;
  }
}
