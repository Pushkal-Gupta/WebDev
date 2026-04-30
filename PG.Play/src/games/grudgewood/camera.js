// Grudgewood — fixed-angle isometric pan camera. The camera holds a
// constant orientation in world space and pans to follow the player; it
// does NOT spin to follow player facing. This keeps WASD aligned with
// world axes (W = +Z always), matching trees-hate-you's read-the-room
// camera and avoiding any "controls flipped because I turned" surprise.
//
// Modes:
//   chase   — fixed iso, pans with player, mild look-ahead in velocity dir.
//   menu    — slow orbit overhead so the menu has motion behind it.
//   reveal  — pulled back, higher angle.
//   death   — frames the player + the trap that killed them.

import * as THREE from 'three';

const tmp = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

// Iso offset: camera sits PURE south and above the player so world axes
// align with screen axes. World +X projects to screen-right, world +Z to
// screen-up. This is what fixes the "A and D feel flipped" complaint —
// a non-zero X offset rotates the view a few degrees and makes D feel
// like a diagonal move instead of "right".
//
// Pitch ~42° down, no yaw. Slightly more depth than pure top-down so
// walls still show their front faces and trees look 3D.
const ISO_OFFSET = new THREE.Vector3(0, 7.0, -7.5);
const ISO_LOOK_HEIGHT = 1.4;

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
    this.hasDeathFocus = !!focus;
  }

  bump(amount = 0.6) { this.shake = Math.min(1.6, this.shake + amount); }

  // dt and player ({ pos, facing, vel, alive, deathKind })
  update(dt, player) {
    this.modeT += dt;

    // Mild look-ahead in velocity direction so the camera leans forward
    // when the player is moving — but only by a couple of metres, never
    // enough to rotate the view.
    const speed = Math.hypot(player.vel.x, player.vel.z);
    const leadX = THREE.MathUtils.clamp(player.vel.x * 0.18, -1.6, 1.6);
    const leadZ = THREE.MathUtils.clamp(player.vel.z * 0.18, -1.6, 1.6);

    // Iso target: a point at the player's head height, slightly ahead of
    // them in their direction of travel.
    const desiredTarget = tmpA.set(
      player.pos.x + leadX,
      player.pos.y + ISO_LOOK_HEIGHT,
      player.pos.z + leadZ,
    );
    // Iso position: same offset relative to the player, world-axis aligned.
    const desiredPos = tmpB.set(
      player.pos.x + ISO_OFFSET.x,
      player.pos.y + ISO_OFFSET.y,
      player.pos.z + ISO_OFFSET.z,
    );

    // Death camera: keep the iso angle but reframe between the player
    // and the trap that killed them so both are in shot. No orbit so the
    // killer is held still long enough to be recognised.
    if (this.mode === 'death') {
      if (this.hasDeathFocus) {
        const mid = tmp.set(
          (player.pos.x + this.deathFocus.x) * 0.5,
          (player.pos.y + this.deathFocus.y) * 0.5 + 1.4,
          (player.pos.z + this.deathFocus.z) * 0.5,
        );
        // Camera pulls back further and a bit higher to fit both in frame.
        desiredPos.set(
          mid.x + ISO_OFFSET.x * 1.15,
          mid.y + ISO_OFFSET.y * 0.9,
          mid.z + ISO_OFFSET.z * 1.15,
        );
        desiredTarget.copy(mid);
      } else {
        desiredTarget.set(player.pos.x, player.pos.y + 0.9, player.pos.z);
        desiredPos.set(
          player.pos.x + ISO_OFFSET.x * 1.1,
          player.pos.y + ISO_OFFSET.y * 0.95,
          player.pos.z + ISO_OFFSET.z * 1.1,
        );
      }
      this.fovTarget = 50;
    } else if (this.mode === 'reveal') {
      // Pull further back and higher for a wider reveal moment.
      desiredPos.set(
        player.pos.x + ISO_OFFSET.x * 1.6,
        player.pos.y + ISO_OFFSET.y * 1.4,
        player.pos.z + ISO_OFFSET.z * 1.6,
      );
      desiredTarget.set(player.pos.x, player.pos.y + 1.2, player.pos.z);
      this.fovTarget = 70;
    } else if (this.mode === 'menu') {
      // Slow overhead orbit behind the player so the menu has motion behind it.
      desiredPos.set(
        player.pos.x + Math.cos(this.modeT * 0.3) * 10,
        player.pos.y + 5 + Math.sin(this.modeT * 0.4) * 1.2,
        player.pos.z + Math.sin(this.modeT * 0.3) * 10,
      );
      desiredTarget.set(player.pos.x, player.pos.y + 1.0, player.pos.z);
      this.fovTarget = 60;
    } else {
      // Fixed iso while playing. Slight FOV bloom when sprinting.
      this.fovTarget = speed > 6 ? 62 : 58;
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
