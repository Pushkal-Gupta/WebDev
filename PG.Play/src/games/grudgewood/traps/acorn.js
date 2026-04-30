// Acorn Cannon — a flank-mounted tree that grows a glowing seed in its
// canopy and lobs it on a parabolic arc toward the player's predicted
// position. Telegraph is a bright, accelerating glow on the seed (visible
// against any biome) plus a faint ground line where the projectile will
// land. Dodge by lateral step — the lead is small but real.
//
// Why this trap matters: it's the game's only true ranged threat at
// medium range. It pulls players off the edge of the path even when
// nothing on the path is firing.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree } from '../props.js';
import { sfx } from '../audio.js';

const tmp = new THREE.Vector3();

const REACH = 18;
const WINDUP = 0.6;
const FLIGHT = 0.9;
const COOLDOWN = 2.6;
const LEAD_TIME = 0.45;        // seconds of player velocity to lead by

export class AcornCannon extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    const tree = makeTree(biome, 1.25, 1);
    g.add(tree);
    g.position.copy(anchor);

    // Seed pod glows in the canopy during windup.
    const seed = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color: '#ffe066', emissive: '#ffe066', emissiveIntensity: 0.0,
        roughness: 0.35, metalness: 0.1, flatShading: true,
      }),
    );
    seed.position.set(0.15, 4.6, 0.3);
    seed.visible = false;
    g.add(seed);

    // Ground reticle showing landing point. Bright, biome-independent yellow.
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.85, 24),
      new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
    );
    reticle.rotation.x = -Math.PI / 2;
    reticle.position.y = 0.04;
    g.add(reticle);

    super({ kind: 'acorn', group: g, anchor, hitRadius: 0.6, anticipation: WINDUP, cooldown: COOLDOWN });
    this.tree = tree;
    this.seed = seed;
    this.reticle = reticle;
    this.projectile = null;       // mesh in flight
    this.target = new THREE.Vector3();
    this.startPos = new THREE.Vector3();
    this.flightT = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    const dx = ctx.player.x - this.anchor.x;
    const dz = ctx.player.z - this.anchor.z;
    const range = Math.hypot(dx, dz);

    if (this.phase === 'idle') {
      if (range < REACH) {
        this.phase = 'winding';
        this.t = 0;
        this.seed.visible = true;
        this.reticle.material.opacity = 0;
        sfx.predEye?.();
      }
    } else if (this.phase === 'winding') {
      const k = Math.min(1, this.t / WINDUP);
      this.seed.material.emissiveIntensity = 0.4 + k * 2.0;
      this.seed.scale.setScalar(0.6 + k * 0.6);

      // Lead the player by their current XZ velocity.
      const lead = LEAD_TIME * Math.min(1, k + 0.4);
      this.target.set(
        ctx.player.x + (ctx.applyForce ? 0 : 0), // velocity not directly available — approximate via heading
        0,
        ctx.player.z,
      );
      // Approximate velocity-direction lead via a simple drag along player heading.
      const speed = ctx.playerSpeedXZ || 0;
      const heading = Math.atan2(dx, dz);
      this.target.x = ctx.player.x + Math.sin(heading) * speed * lead * 0.4;
      this.target.z = ctx.player.z + Math.cos(heading) * speed * lead * 0.4;

      // Position reticle on the ground at the predicted impact.
      this.reticle.position.set(this.target.x - this.anchor.x, 0.04, this.target.z - this.anchor.z);
      this.reticle.material.opacity = 0.25 + k * 0.45;

      if (this.t >= WINDUP) {
        this.phase = 'flight';
        this.t = 0;
        this.flightT = 0;
        // Spawn the projectile mesh; tracks an arc from canopy to target.
        this.startPos.set(this.anchor.x + this.seed.position.x, this.anchor.y + this.seed.position.y, this.anchor.z + this.seed.position.z);
        const pmat = new THREE.MeshStandardMaterial({
          color: '#ffe066', emissive: '#ffe066', emissiveIntensity: 1.6, roughness: 0.3, flatShading: true,
        });
        const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), pmat);
        // Parent to the trap group so it disposes cleanly with the chunk.
        this.group.add(p);
        this.projectile = p;
        this.seed.visible = false;
        sfx.branchSnap?.();
      }
    } else if (this.phase === 'flight') {
      this.flightT += dt;
      const k = Math.min(1, this.flightT / FLIGHT);
      // Parabolic arc: linear in XZ, sin-curve in Y.
      const px = this.startPos.x + (this.target.x - this.startPos.x) * k;
      const pz = this.startPos.z + (this.target.z - this.startPos.z) * k;
      const py = this.startPos.y + (0.5 - this.startPos.y) * k - Math.sin(k * Math.PI) * 1.6;
      // Project into local group coordinates.
      this.projectile.position.set(px - this.anchor.x, py - this.anchor.y, pz - this.anchor.z);
      this.projectile.rotation.x += dt * 8;

      // Lethal sphere follows the projectile in world space.
      tmp.set(px, py, pz);
      this.lethalCenter.copy(tmp);
      this.hitRadius = 0.6;
      this.lethalActive = py < 4.5;     // active once it leaves the canopy

      if (this.flightT >= FLIGHT) {
        // Land — small dust effect via reticle pulse.
        this.lethalActive = false;
        this.group.remove(this.projectile);
        this.projectile.geometry.dispose();
        this.projectile.material.dispose();
        this.projectile = null;
        this.reticle.material.opacity = 0.0;
        this.phase = 'cooldown';
        this.t = 0;
        sfx.logImpact?.();
      }
    } else {
      // Cooldown — seed dim, reticle off, ready to re-target.
      this.seed.material.emissiveIntensity = 0;
      this.reticle.material.opacity = 0;
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; }
    }

    // Light idle sway.
    this.tree.rotation.x = Math.sin(this.t * 1.2) * 0.03;
  }
}
