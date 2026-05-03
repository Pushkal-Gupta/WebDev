// Grudgewood — fixed-orientation pan camera with chase-style distance.
//
// Why fixed orientation: a chase cam that rotates with player.facing
// creates a feedback spin when the input is camera-relative — holding
// "left" pulls the player CCW, which pulls the camera CCW, which rotates
// the world-meaning of "left" CCW, which pulls the player CCW... loop.
// We avoid that by holding the camera at a constant world-axis offset
// and letting the BODY rotate to face the absolute movement direction.
//
// Why not pure top-down: too overhead reads as a twin-stick shooter.
// Pitch ≈ atan(4.5 / 6.0) ≈ 37° — clearly third-person/iso, with walls
// showing their front faces and trees readable in 3D.
//
// Modes:
//   chase   — fixed pan, mild velocity look-ahead, FOV bloom on sprint.
//   menu    — slow overhead orbit so the menu has motion behind it.
//   reveal  — pulled back, higher angle.
//   death   — frames the player + the trap that killed them.

import * as THREE from 'three';

const tmp = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

// Pan offset relative to the player. Camera always sits at the same
// world-axis offset (south + above), regardless of where the player
// is facing. World +X = screen-left (three.js up×back convention),
// world +Z = screen-up — the player.js input mirrors X to compensate.
//
// Pitch ≈ atan(5.5 / 6) ≈ 42° — a touch more top-down than the prior
// 37° so the player can read the room without being overhead-shooter.
const PAN_OFFSET_X = 0;
const PAN_OFFSET_Y = 5.5;
const PAN_OFFSET_Z = -6.0;
const LOOK_HEIGHT = 1.4;

export class ChaseCamera {
  constructor(camera) {
    this.cam = camera;
    this.target = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.targetVel = new THREE.Vector3();
    this.posVel = new THREE.Vector3();
    this.shake = 0;
    this.shakeSeed = Math.random() * 1000;
    this.fov = 60;
    this.fovTarget = 60;
    this.mode = 'chase';   // 'chase' | 'death' | 'reveal' | 'menu'
    this.modeT = 0;
    this.shakeMul = 1.0;
    this.deathFocus = new THREE.Vector3();
    this.hasDeathFocus = false;
  }

  setShakeMultiplier(v) { this.shakeMul = v; }

  setMode(mode, focus) {
    this.mode = mode;
    this.modeT = 0;
    if (focus) this.deathFocus.copy(focus);
    this.hasDeathFocus = !!focus;
  }

  bump(amount = 0.6) { this.shake = Math.min(1.6, this.shake + amount); }

  // dt and player ({ pos, facing, vel, alive, deathKind }); optional
  // walls list (AABBs from chunkManager) is used for occlusion.
  update(dt, player, walls = null) {
    this.modeT += dt;

    // Forward-only velocity look-ahead — when the player walks +Z the
    // camera leans an extra metre or two into the scene so they can
    // read what's coming. We deliberately DON'T lead on X: with the
    // fixed-orientation camera, an X look-ahead pans the look-target
    // sideways and rotates the view a few degrees, which reads as a
    // "weird tilt" when walking purely east or west.
    const speed = Math.hypot(player.vel.x, player.vel.z);
    const leadZ = THREE.MathUtils.clamp(player.vel.z * 0.16, -1.2, 1.6);

    const desiredTarget = tmpA.set(
      player.pos.x,
      player.pos.y + LOOK_HEIGHT,
      player.pos.z + leadZ,
    );
    const desiredPos = tmpB.set(
      player.pos.x + PAN_OFFSET_X,
      player.pos.y + PAN_OFFSET_Y,
      player.pos.z + PAN_OFFSET_Z,
    );

    if (this.mode === 'death') {
      // Reframe between the player and the trap that killed them.
      // Camera still uses the same axis-aligned offset so the death cam
      // is consistent with normal play — no orbit, just a wider frame.
      if (this.hasDeathFocus) {
        const mid = tmp.set(
          (player.pos.x + this.deathFocus.x) * 0.5,
          (player.pos.y + this.deathFocus.y) * 0.5 + 1.4,
          (player.pos.z + this.deathFocus.z) * 0.5,
        );
        desiredPos.set(
          mid.x + PAN_OFFSET_X * 1.2,
          mid.y + PAN_OFFSET_Y + 0.6,
          mid.z + PAN_OFFSET_Z * 1.2,
        );
        desiredTarget.copy(mid);
      } else {
        desiredPos.set(
          player.pos.x + PAN_OFFSET_X * 1.15,
          player.pos.y + PAN_OFFSET_Y + 0.4,
          player.pos.z + PAN_OFFSET_Z * 1.15,
        );
        desiredTarget.set(player.pos.x, player.pos.y + 0.9, player.pos.z);
      }
      this.fovTarget = 52;
    } else if (this.mode === 'reveal') {
      // Wider reveal: same direction, more distance + altitude.
      desiredPos.set(
        player.pos.x + PAN_OFFSET_X * 1.6,
        player.pos.y + PAN_OFFSET_Y + 4,
        player.pos.z + PAN_OFFSET_Z * 1.6,
      );
      desiredTarget.set(player.pos.x, player.pos.y + 1.2, player.pos.z);
      this.fovTarget = 70;
    } else if (this.mode === 'menu') {
      // Slow overhead orbit so the menu screen has motion behind it.
      desiredPos.set(
        player.pos.x + Math.cos(this.modeT * 0.3) * 10,
        player.pos.y + 5 + Math.sin(this.modeT * 0.4) * 1.2,
        player.pos.z + Math.sin(this.modeT * 0.3) * 10,
      );
      desiredTarget.set(player.pos.x, player.pos.y + 1.0, player.pos.z);
      this.fovTarget = 60;
    } else {
      // Subtle FOV bloom when sprinting; otherwise a calm wide-ish FOV.
      this.fovTarget = speed > 6 ? 62 : 58;
    }

    // Occlusion — if any wall AABB sits between the desired camera and
    // the player in the XZ plane, slide the desired camera forward along
    // the cam→player ray until it's just in front of the wall. Walls are
    // 3.4m tall (taller than camera/player), so a 2D AABB intersection
    // in XZ is sufficient — no need for a 3D test.
    if (walls && this.mode !== 'menu') {
      adjustForOcclusion(desiredPos, player.pos, walls);
    }

    // Critically-damped smoothing keeps the chase smooth without lag.
    this.smooth(this.position, this.posVel, desiredPos, dt, 6.5);
    this.smooth(this.target, this.targetVel, desiredTarget, dt, 8);

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

    this.fov += (this.fovTarget - this.fov) * Math.min(1, dt * 4);
    this.cam.fov = this.fov;
    this.cam.updateProjectionMatrix();
  }

  // Critically-damped spring smoother. omega controls responsiveness.
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

  // Snap to an explicit world-space camera/target pair. Used after
  // respawn so the camera doesn't trail through walls catching up.
  snapTo(pos, target) {
    this.position.copy(pos);
    this.target.copy(target);
    this.cam.position.copy(pos);
    this.cam.lookAt(target);
    this.posVel.set(0, 0, 0);
    this.targetVel.set(0, 0, 0);
  }
}

export const CHASE_FOLLOW_DIST = -PAN_OFFSET_Z;
export const CHASE_FOLLOW_HEIGHT = PAN_OFFSET_Y;
export const CHASE_LOOK_HEIGHT = LOOK_HEIGHT;

// Slab-method ray-AABB intersection in XZ. Returns the entry distance t
// along the ray (camera origin + t*dir) for the nearest hit, or Infinity
// when the ray misses. Used by adjustForOcclusion.
function rayAabb2D(ox, oz, dx, dz, w) {
  const tx1 = (w.minX - ox) / (dx || 1e-12);
  const tx2 = (w.maxX - ox) / (dx || 1e-12);
  const tz1 = (w.minZ - oz) / (dz || 1e-12);
  const tz2 = (w.maxZ - oz) / (dz || 1e-12);
  const txmin = Math.min(tx1, tx2);
  const txmax = Math.max(tx1, tx2);
  const tzmin = Math.min(tz1, tz2);
  const tzmax = Math.max(tz1, tz2);
  const tmin = Math.max(txmin, tzmin);
  const tmax = Math.min(txmax, tzmax);
  if (tmax < 0 || tmin > tmax) return Infinity;
  return Math.max(0, tmin);
}

// Mutates `cam` so that the line from cam → playerPos doesn't cross any
// wall. Camera always stays at least MIN_DIST metres back so it doesn't
// jam into the player's body when a wall is right behind them.
const MIN_OCCLUSION_DIST = 2.2;
const OCCLUSION_PADDING = 0.5;
function adjustForOcclusion(cam, playerPos, walls) {
  const dx = playerPos.x - cam.x;
  const dz = playerPos.z - cam.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.5) return;
  const nx = dx / dist;
  const nz = dz / dist;
  let earliest = dist;
  for (const w of walls) {
    const t = rayAabb2D(cam.x, cam.z, nx, nz, w);
    if (t < earliest) earliest = t;
  }
  if (earliest < dist) {
    // Stop just shy of the wall, but never closer to the player than MIN.
    const safeT = Math.max(MIN_OCCLUSION_DIST, earliest - OCCLUSION_PADDING);
    const slide = dist - safeT;
    cam.x += nx * slide;
    cam.z += nz * slide;
  }
}
