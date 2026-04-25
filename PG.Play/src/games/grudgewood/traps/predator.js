// Predator tree — a tree with a glowing eye that tracks the player. When the
// player walks into its reach the canopy winds back and slams a branch
// through the player's predicted path. This is the game's defining mechanic
// ("trees hate you"), so it intentionally telegraphs aggressively but commits
// to a fixed strike direction so a player who keeps moving can dodge it.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makePredatorTree } from '../props.js';
import { sfx } from '../audio.js';

const tmpV = new THREE.Vector3();

// Reach values are tuned so an idle/walking player on the path will be hit if
// the tree is within ~12 units; sprinting past the edge of reach is dodgeable.
const ATTACK_REACH = 12;
const WINDUP_SECONDS = 0.35;     // ~350ms telegraph
const STRIKE_SECONDS = 0.20;
const COOLDOWN_SECONDS = 2.6;
const STRIKE_REACH = 5;          // distance the swing tip travels from the trunk

export class PredatorTree extends Trap {
  constructor({ biome, anchor }) {
    const g = makePredatorTree(biome);
    g.position.copy(anchor);
    super({
      kind: 'predator',
      group: g,
      anchor,
      hitRadius: 1.6,
      anticipation: WINDUP_SECONDS,
      cooldown: COOLDOWN_SECONDS,
    });
    this.eye = g.userData.eye;
    this.tree = g;
    this.lockTimer = 0;
    // Strike direction (XZ) — locked at the moment of wind-up so a moving
    // player can sidestep. Includes a small lead based on player velocity.
    this.lockDirX = 0;
    this.lockDirZ = 1;
  }

  tick(dt, ctx) {
    this.t += dt;
    const dx = ctx.player.x - this.anchor.x;
    const dz = ctx.player.z - this.anchor.z;
    const range = Math.hypot(dx, dz);

    // Eye pulses faster as the tree heats up.
    const heat = this.phase === 'idle' ? 0.6 : 1.4;
    const pulse = 0.8 + Math.sin(this.t * 4 * heat) * 0.5;
    if (this.eye?.material) this.eye.material.emissiveIntensity = pulse;

    if (this.phase === 'idle') {
      // Lock-on as soon as the player is in reach. We still ramp via lockTimer
      // (~0.25s) so a fast sprint-by isn't always punished.
      if (range < ATTACK_REACH) {
        this.lockTimer += dt;
        if (this.lockTimer > 0.25) {
          // Lock the strike direction toward the player's predicted position
          // ~WINDUP_SECONDS ahead, using their XZ velocity if available.
          const vx = ctx.applyForce ? 0 : 0; // velocity isn't directly exposed; lead is approximated below.
          const leadT = WINDUP_SECONDS;
          // playerSpeedXZ is provided; we infer direction from the position
          // delta vs. anchor for a simple lead.
          const speed = ctx.playerSpeedXZ || 0;
          const heading = Math.atan2(dx, dz);
          const lx = dx + Math.sin(heading) * speed * leadT * 0.4;
          const lz = dz + Math.cos(heading) * speed * leadT * 0.4;
          const m = Math.max(0.001, Math.hypot(lx, lz));
          this.lockDirX = lx / m;
          this.lockDirZ = lz / m;
          this.phase = 'winding';
          this.t = 0;
          this.lockTimer = 0;
          sfx.predEye?.();
        }
      } else {
        this.lockTimer = Math.max(0, this.lockTimer - dt * 0.7);
      }
      // Light idle sway.
      this.tree.rotation.x = Math.sin(this.t * 1.6) * 0.04;
    } else if (this.phase === 'winding') {
      // Tree leans back, eye flares — readable wind-up.
      const k = Math.min(1, this.t / WINDUP_SECONDS);
      this.tree.rotation.x = THREE.MathUtils.lerp(0, 0.22, k);
      if (this.eye?.material) this.eye.material.emissiveIntensity = 1.2 + k * 1.6;
      if (this.t >= WINDUP_SECONDS) {
        this.phase = 'strike';
        this.t = 0;
        sfx.predStrike?.();
      }
    } else if (this.phase === 'strike') {
      const k = Math.min(1, this.t / STRIKE_SECONDS);
      // Tree slams forward.
      this.tree.rotation.x = THREE.MathUtils.lerp(0.22, -0.5, k);
      // Lethal sphere swings out along the locked direction; one-hit kill on
      // contact thanks to checkLethalHit in world.js.
      tmpV.set(
        this.anchor.x + this.lockDirX * STRIKE_REACH * k,
        this.anchor.y + 1.0,
        this.anchor.z + this.lockDirZ * STRIKE_REACH * k,
      );
      this.lethalCenter.copy(tmpV);
      this.hitRadius = 1.6;
      this.lethalActive = true;
      if (this.t >= STRIKE_SECONDS) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
      }
    } else {
      // Cooldown: branch returns to neutral.
      const k = Math.min(1, this.t / 1.2);
      this.tree.rotation.x = THREE.MathUtils.lerp(-0.5, 0, k);
      if (this.t >= COOLDOWN_SECONDS) { this.phase = 'idle'; this.t = 0; }
    }
  }

  // World-space sphere check exposed for near-miss camera shake. Returns the
  // distance from the player to the lethal center while the swing is active,
  // or Infinity otherwise.
  swingDistanceTo(player) {
    if (this.phase !== 'strike') return Infinity;
    return this.lethalCenter.distanceTo(player);
  }
}
