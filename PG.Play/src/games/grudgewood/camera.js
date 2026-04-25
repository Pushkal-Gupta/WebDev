// Grudgewood — third-person chase camera with shake, lookahead, trap-focus
// micro-zoom, and a dramatic death angle. Smoothing is critical-damped so
// fast direction changes don't make players motion-sick.

import * as THREE from 'three';

const tmp = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

export class ChaseCamera {
  constructor(camera) {
    this.cam = camera;
    this.target = new THREE.Vector3();   // smoothed look-at
    this.position = new THREE.Vector3(); // smoothed position
    this.targetVel = new THREE.Vector3();
    this.posVel = new THREE.Vector3();
    this.shake = 0;        // intensity
    this.shakeSeed = Math.random() * 1000;
    this.fov = 60;
    this.fovTarget = 60;
    this.mode = 'chase';   // 'chase' | 'death' | 'reveal' | 'menu'
    this.modeT = 0;
    this.shakeMul = 1.0;   // user setting
    this.deathFocus = new THREE.Vector3();
  }

  setShakeMultiplier(v) { this.shakeMul = v; }

  setMode(mode, focus) {
    this.mode = mode;
    this.modeT = 0;
    if (focus) this.deathFocus.copy(focus);
  }

  bump(amount = 0.6) { this.shake = Math.min(1.6, this.shake + amount); }

  // dt and player ({ pos, facing, vel, alive, deathKind })
  update(dt, player) {
    this.modeT += dt;

    // Desired offsets in player-local space.
    const followDist = 7.5;
    const followHeight = 3.6;
    let lookHeight = 1.4;

    // Look-ahead in horizontal velocity direction.
    const speed = Math.hypot(player.vel.x, player.vel.z);
    const lead = THREE.MathUtils.clamp(speed * 0.18, 0, 1.6);
    const fwdX = Math.sin(player.facing);
    const fwdZ = Math.cos(player.facing);

    // Compute desired camera position behind the player along facing.
    const desiredTarget = tmpA.set(
      player.pos.x + fwdX * lead,
      player.pos.y + lookHeight,
      player.pos.z + fwdZ * lead,
    );
    const desiredPos = tmpB.set(
      player.pos.x - fwdX * followDist,
      player.pos.y + followHeight,
      player.pos.z - fwdZ * followDist,
    );

    // Death camera: orbit slowly + zoom in on player.
    if (this.mode === 'death') {
      const orbit = this.modeT * 0.6;
      const radius = 4.2;
      desiredPos.set(
        player.pos.x + Math.cos(orbit) * radius,
        player.pos.y + 2.8,
        player.pos.z + Math.sin(orbit) * radius,
      );
      desiredTarget.copy(player.pos).add(tmp.set(0, 0.8, 0));
      this.fovTarget = 48;
    } else if (this.mode === 'reveal') {
      // Higher, wider — used for new biome reveals.
      desiredPos.set(
        player.pos.x - fwdX * 14, player.pos.y + 7, player.pos.z - fwdZ * 14,
      );
      desiredTarget.copy(player.pos).add(tmp.set(fwdX * 4, 1.5, fwdZ * 4));
      this.fovTarget = 70;
    } else if (this.mode === 'menu') {
      desiredPos.set(
        Math.cos(this.modeT * 0.3) * 10,
        4 + Math.sin(this.modeT * 0.4) * 1.5,
        Math.sin(this.modeT * 0.3) * 10,
      );
      desiredTarget.copy(player.pos).add(tmp.set(0, 1.0, 0));
      this.fovTarget = 60;
    } else {
      this.fovTarget = speed > 6 ? 64 : 60;
    }

    // Critically-damped smoothing.
    this.smooth(this.position, this.posVel, desiredPos, dt, 6.5);
    this.smooth(this.target, this.targetVel, desiredTarget, dt, 8);

    // Apply shake (decays exponentially).
    this.shake = Math.max(0, this.shake - dt * 2.4);
    if (this.shake > 0 && this.shakeMul > 0) {
      const k = this.shake * 0.4 * this.shakeMul;
      this.shakeSeed += dt * 30;
      const sx = (Math.sin(this.shakeSeed * 1.7) + Math.sin(this.shakeSeed * 3.1) * 0.5) * k;
      const sy = (Math.cos(this.shakeSeed * 1.3) + Math.sin(this.shakeSeed * 2.9) * 0.5) * k * 0.6;
      this.cam.position.set(this.position.x + sx, this.position.y + sy, this.position.z);
    } else {
      this.cam.position.copy(this.position);
    }

    this.cam.lookAt(this.target);

    // FOV breathing.
    this.fov += (this.fovTarget - this.fov) * Math.min(1, dt * 4);
    this.cam.fov = this.fov;
    this.cam.updateProjectionMatrix();
  }

  // Spring-style critically-damped smoothing.
  smooth(out, vel, target, dt, omega) {
    const f = 1 + 2 * dt * omega;
    const ww = omega * omega;
    const fff = dt * ww;
    const detFFF = 1 / (f + dt * fff);

    const dx = (out.x - target.x);
    const dy = (out.y - target.y);
    const dz = (out.z - target.z);

    const tx = (vel.x + ww * dx) * dt;
    const ty = (vel.y + ww * dy) * dt;
    const tz = (vel.z + ww * dz) * dt;

    vel.x = (vel.x - fff * tx) * detFFF;
    vel.y = (vel.y - fff * ty) * detFFF;
    vel.z = (vel.z - fff * tz) * detFFF;

    out.x = target.x + (dx + dt * vel.x) * detFFF;
    out.y = target.y + (dy + dt * vel.y) * detFFF;
    out.z = target.z + (dz + dt * vel.z) * detFFF;
  }

  // Snap to a position immediately (used after respawn so we don't trail through walls).
  snapTo(pos, target) {
    this.position.copy(pos);
    this.target.copy(target);
    this.cam.position.copy(pos);
    this.cam.lookAt(target);
    this.posVel.set(0, 0, 0);
    this.targetVel.set(0, 0, 0);
  }
}
