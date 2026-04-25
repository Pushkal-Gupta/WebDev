// Root snare — a hidden patch erupts when the player slows or pauses on it.
// Tell: subtle ground "shimmer" decal that grows as the player lingers.
// Strike: arched root rises to player height; lethal while extended.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeRoot } from '../props.js';
import { sfx } from '../audio.js';

export class RootSnare extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // Telegraph: a slightly off-color flat ring on the ground.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1.1, 18),
      new THREE.MeshBasicMaterial({ color: biome.accent, transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    g.add(ring);

    const root = makeRoot(biome, 1.4);
    // Hidden underground until strike.
    root.position.y = -1.4;
    root.rotation.x = Math.PI / 2;
    g.add(root);

    super({ kind: 'snare', group: g, anchor, hitRadius: 1.2, anticipation: 1.1, cooldown: 1.6 });
    this.ring = ring;
    this.root = root;
    this.lingered = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    const onTop = this.anchor.distanceTo(ctx.player) < 1.6;
    const slow = ctx.playerSpeedXZ < 1.5;

    if (this.phase === 'idle') {
      // Gradual telegraph as the player lingers within the ring.
      if (onTop && slow) {
        this.lingered += dt;
        this.ring.material.opacity = Math.min(0.65, this.lingered * 0.9);
      } else {
        this.lingered = Math.max(0, this.lingered - dt * 0.6);
        this.ring.material.opacity = Math.max(0, this.ring.material.opacity - dt * 0.8);
      }
      if (this.lingered > 0.7) {
        this.phase = 'anticipation';
        this.t = 0;
        sfx.rootRumble();
      }
    } else if (this.phase === 'anticipation') {
      const k = Math.min(1, this.t / 0.18);
      this.root.position.y = THREE.MathUtils.lerp(-1.4, 1.0, k);
      if (this.t >= 0.18) {
        this.phase = 'strike';
        this.t = 0;
        sfx.rootSnap();
        this.lethalActive = true;
        this.lethalCenter.copy(this.anchor).setY(this.anchor.y + 0.8);
      }
    } else if (this.phase === 'strike') {
      // Hold extended for a beat.
      this.root.position.y = 1.0 + Math.sin(this.t * 24) * 0.04;
      if (this.t >= 0.55) { this.phase = 'cooldown'; this.t = 0; this.lethalActive = false; }
    } else {
      const k = Math.min(1, this.t / 0.7);
      this.root.position.y = THREE.MathUtils.lerp(1.0, -1.4, k);
      this.ring.material.opacity = Math.max(0, this.ring.material.opacity - dt);
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; this.lingered = 0; }
    }
  }
}
