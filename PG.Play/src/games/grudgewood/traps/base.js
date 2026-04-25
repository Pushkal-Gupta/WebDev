// Trap base — every trap is a small state machine with phases:
//   idle → anticipation → strike → cooldown → idle
// Each trap owns: a Three.js Group (visual), an anchor (world position),
// a hitbox sphere (kept simple — gameplay reads collisions via centerVsSphere),
// an update(dt, ctx) function, and a reset().
//
// Traps register themselves with the segment; the segment iterates their update
// each frame and asks each trap whether the player intersects its lethal shape.

import * as THREE from 'three';

export class Trap {
  constructor({ kind, group, anchor, hitRadius = 1.2, anticipation = 0.6, cooldown = 1.5 }) {
    this.kind = kind;
    this.group = group;
    this.anchor = anchor.clone();
    this.hitRadius = hitRadius;
    this.anticipation = anticipation;
    this.cooldown = cooldown;
    this.phase = 'idle';
    this.t = 0;
    this.armed = true;
    // Lethal sphere center — most traps update this each frame to follow strike geometry.
    this.lethalCenter = anchor.clone();
    this.lethalActive = false;
  }

  // World-space sphere check. ctx.player is a Vector3.
  hitsPlayer(player, playerRadius = 0.5) {
    if (!this.lethalActive) return false;
    const r = this.hitRadius + playerRadius;
    return this.lethalCenter.distanceToSquared(player) <= r * r;
  }

  reset() {
    this.phase = 'idle';
    this.t = 0;
    this.lethalActive = false;
    this.armed = true;
  }

  // Subclasses override:
  // tick(dt, ctx) { ... }  — drive animation/phase
  tick(dt, ctx) {}
  // dispose() — free GPU resources
  dispose() {
    this.group?.traverse?.((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
        else o.material.dispose?.();
      }
    });
  }
}
