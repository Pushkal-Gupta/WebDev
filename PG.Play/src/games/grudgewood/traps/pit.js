// Hidden pit — leaf-covered tile that gives way when stood on. Falling
// resolves immediately as a kill (we tag it pit so the camera does the drop sting).

import * as THREE from 'three';
import { Trap } from './base.js';
import { sfx } from '../audio.js';

export class HiddenPit extends Trap {
  constructor({ biome, anchor, radius = 1.4 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    // Leaf cover — slightly raised disk that drops away on trigger.
    const cover = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.1, 14),
      new THREE.MeshStandardMaterial({
        color: biome.grass.color, roughness: 0.95, flatShading: true,
      }),
    );
    cover.position.y = 0.05;
    cover.castShadow = false;
    g.add(cover);
    // Pit shaft — black cylinder dropped below ground.
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 4, 14, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }),
    );
    shaft.position.y = -2;
    g.add(shaft);

    super({ kind: 'pit', group: g, anchor, hitRadius: radius * 0.9, anticipation: 0, cooldown: 0 });
    this.cover = cover;
    this.shaft = shaft;
    this.radius = radius;
  }

  tick(dt, ctx) {
    this.t += dt;
    if (this.phase === 'idle') {
      const onTop = this.anchor.distanceTo(ctx.player) < this.radius && Math.abs(ctx.player.y - this.anchor.y) < 1.4;
      if (onTop && ctx.playerGrounded) {
        this.phase = 'strike';
        this.t = 0;
        sfx.pitFall();
      }
    } else if (this.phase === 'strike') {
      const k = Math.min(1, this.t / 0.18);
      this.cover.position.y = THREE.MathUtils.lerp(0.05, -2.5, k);
      this.cover.rotation.x = -k * 1.2;
      this.lethalActive = true;
      this.lethalCenter.copy(this.anchor).setY(this.anchor.y - 0.4);
      this.hitRadius = this.radius * 0.95;
      if (this.t > 0.4) {
        this.phase = 'done';
        this.lethalActive = false;
      }
    }
  }
}
