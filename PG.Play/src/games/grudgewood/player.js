// Grudgewood — player character mesh, controller, and animation.
// Mesh is a simple stylized humanoid built from primitives so it stays
// performant and consistent with the rest of the world.

import * as THREE from 'three';
import { HATS } from './hats.js';
import { sfx } from './audio.js';

const tmp = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

const SKIN = 0xeec99a;
const SHIRT = 0x4a82c4;
const PANTS = 0x2a3a5a;
const SHOES = 0x1a1410;

export function makePlayer() {
  const root = new THREE.Group();

  // Visual rig — simple jointed mannequin.
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.85, flatShading: true });
  const shirtMat = new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.85, flatShading: true });
  const pantsMat = new THREE.MeshStandardMaterial({ color: PANTS, roughness: 0.9, flatShading: true });
  const shoeMat = new THREE.MeshStandardMaterial({ color: SHOES, roughness: 0.95, flatShading: true });

  const body = new THREE.Group();
  root.add(body);

  // Hips (root for animation).
  const hips = new THREE.Group();
  hips.position.y = 0.9;
  body.add(hips);

  // Torso.
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.32), shirtMat);
  torso.position.y = 0.5;
  torso.castShadow = true;
  hips.add(torso);

  // Head + neck.
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.32), skinMat);
  head.position.y = 1.0;
  head.castShadow = true;
  hips.add(head);

  // Hat slot.
  const hatSlot = new THREE.Group();
  hatSlot.position.set(0, 1.18, 0);
  hips.add(hatSlot);

  // Arms.
  const armL = new THREE.Group(); armL.position.set(-0.34, 0.7, 0); hips.add(armL);
  const armR = new THREE.Group(); armR.position.set( 0.34, 0.7, 0); hips.add(armR);
  const upperArm = (parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), shirtMat);
    m.position.y = -0.25; m.castShadow = true; parent.add(m);
    return m;
  };
  upperArm(armL); upperArm(armR);

  // Legs.
  const legL = new THREE.Group(); legL.position.set(-0.14, 0.0, 0); hips.add(legL);
  const legR = new THREE.Group(); legR.position.set( 0.14, 0.0, 0); hips.add(legR);
  const buildLeg = (parent) => {
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.22), pantsMat);
    upper.position.y = -0.28; upper.castShadow = true; parent.add(upper);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.34), shoeMat);
    shoe.position.set(0, -0.6, 0.06); shoe.castShadow = true; parent.add(shoe);
  };
  buildLeg(legL); buildLeg(legR);

  // Held axe (for late-game). Hidden by default; revealed when axe unlocked.
  const axe = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1f, roughness: 0.9 }));
  handle.position.y = -0.35; axe.add(handle);
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xddeeff, emissive: 0x4060a0, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 }));
  axeHead.position.set(0.12, -0.05, 0); axe.add(axeHead);
  axe.position.set(0.16, 0.3, 0.18);
  axe.rotation.x = -0.4;
  axe.visible = false;
  armR.add(axe);

  function setHat(hatId) {
    while (hatSlot.children.length) {
      const c = hatSlot.children[0];
      hatSlot.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
    }
    if (hatId && HATS[hatId]) {
      const m = HATS[hatId].build();
      hatSlot.add(m);
    }
  }

  // Default hat.
  setHat('leaf-crown');

  return {
    root, body, hips, head, torso, armL, armR, legL, legR, hatSlot, axe,
    setHat,
    setAxeVisible(v) { axe.visible = !!v; },
  };
}

// ── Player controller ─────────────────────────────────────────────────────
// Movement tuning. Walk is the default cruise; Shift = sprint. The corridor
// barrier (see corridorPush below) replaced the older slope-reflect wall
// code, which got the player into a feedback loop where input pushed into a
// cliff, the reflection capped velocity, then input pushed again — making
// the player feel "stuck" against any rising terrain. The new system
// guarantees the player can always move on the floor.
// Movement tempo: deliberately under the old corridor tuning. Trees-hate-you
// asks the player to read rooms before walking through them, so a brisk
// stroll beats a sprint here. Sprint is still meaningfully faster.
const WALK_MAX = 6.8;
const SPRINT_MAX = 9.5;
const ACCEL_GROUND = 42;
const ACCEL_AIR = 20;
const FRICTION_GROUND = 28;        // lower friction = more carry, less "stop on a dime"
const JUMP_V = 10.5;
const GRAVITY = 26;
const MAX_FALL = 28;
const COYOTE = 0.14;
const JUMP_BUFFER = 0.16;
const TURN_RATE = 26;              // snappy turn-around
const PLAYER_R = 0.55;
const PLAYER_H = 1.8;

export class PlayerController {
  constructor(rig) {
    this.rig = rig;
    this.pos = new THREE.Vector3(0, 0, 2);
    this.vel = new THREE.Vector3();
    this.facing = 0;       // angle around Y; 0 = forward (+Z)
    this.grounded = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.alive = true;
    this.invuln = 0;
    this.deathT = 0;
    this.deathKind = null;
    // Animation state.
    this.gait = 0;         // 0..1 walk cycle phase
    this.lastStep = 0;
    this.stumble = 0;       // post-near-miss flinch
    this.slowFactor = 1;    // movement multiplier from area effects (spores etc)
    this.slowTimer = 0;     // seconds remaining of slow
  }

  // Call from a trap's tick() via ctx.applySlow(factor, duration). The
  // strongest currently-active slow wins. A weaker slow can never refresh
  // a stronger slow's timer — otherwise a brush past a weak cloud would
  // extend a strong cloud's hold on the player.
  applySlow(factor, duration) {
    if (factor < this.slowFactor) {
      this.slowFactor = factor;
      this.slowTimer = duration;
    } else if (factor === this.slowFactor && this.slowTimer < duration) {
      this.slowTimer = duration;
    }
  }

  reset(pos, facing = 0) {
    this.pos.copy(pos);
    this.vel.set(0, 0, 0);
    this.facing = facing;
    this.alive = true;
    // 1.6s of post-spawn invulnerability — long enough that a player can
    // orient themselves, see what's ahead, and choose to walk or wait
    // without dying to a trap they hadn't read yet.
    this.invuln = 1.6;
    this.deathT = 0;
    this.deathKind = null;
    this.stumble = 0;
    this.rig.body.rotation.set(0, this.facing, 0);
    this.rig.root.position.copy(this.pos);
    this.rig.body.position.set(0, 0, 0);
  }

  applyForce(f, dt) {
    this.vel.x += f.x * dt;
    this.vel.y += f.y * dt;
    this.vel.z += f.z * dt;
  }

  kill(kind = 'unknown') {
    if (!this.alive) return;
    this.alive = false;
    this.deathT = 0;
    this.deathKind = kind;
    sfx.death();
  }

  // Resolve circle-vs-AABB push-out for every wall the cell manager
  // knows about. Iterating each frame is cheap because the cell manager
  // only loads a 3×3 ring (≤ ~12 walls). The push direction comes from
  // the closest point on the box to the player; we also kill the
  // velocity component pointed *into* the wall so the player doesn't
  // stutter back and forth.
  resolveWalls(walls) {
    const r = PLAYER_R;
    for (const w of walls) {
      const cx = Math.max(w.minX, Math.min(this.pos.x, w.maxX));
      const cz = Math.max(w.minZ, Math.min(this.pos.z, w.maxZ));
      const dx = this.pos.x - cx;
      const dz = this.pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      const d = Math.sqrt(d2);
      let nx, nz;
      if (d > 1e-4) {
        nx = dx / d; nz = dz / d;
      } else {
        // Player centre exactly on a wall edge — pick the shortest exit.
        const halfX = (w.maxX - w.minX) / 2;
        const halfZ = (w.maxZ - w.minZ) / 2;
        const px = (this.pos.x - (w.minX + halfX));
        const pz = (this.pos.z - (w.minZ + halfZ));
        if (Math.abs(px) > Math.abs(pz)) { nx = Math.sign(px) || 1; nz = 0; }
        else { nx = 0; nz = Math.sign(pz) || 1; }
      }
      const push = r - d;
      this.pos.x += nx * push;
      this.pos.z += nz * push;
      // Kill velocity into the wall normal.
      const vn = this.vel.x * nx + this.vel.z * nz;
      if (vn < 0) {
        this.vel.x -= vn * nx;
        this.vel.z -= vn * nz;
      }
    }
  }

  update(dt, { input, sampleHeight, casualMode, walls }) {
    // Death animation only.
    if (!this.alive) {
      this.deathT += dt;
      // Slow tumble — body falls, rotates.
      this.rig.body.rotation.x += dt * (this.deathKind === 'pit' ? -2.2 : 3.2);
      this.rig.body.rotation.z += dt * 1.6;
      this.rig.body.position.y -= dt * (this.deathKind === 'pit' ? 8 : 1.4);
      return;
    }

    // Input → desired direction. Controls are ABSOLUTE world-axis with
    // an X mirror to compensate for three.js's camera convention: with
    // the camera positioned south of the player, camera-right ends up
    // pointing at world -X (because three.js builds camera basis as
    // _x = up × back, and with back = -Z that gives -X). Without the
    // mirror, pressing D walks +X which projects to screen-LEFT.
    //
    //   A → world +X  (renders to screen-LEFT  ✓ — A means left)
    //   D → world -X  (renders to screen-RIGHT ✓ — D means right)
    //   W → world +Z  (renders to screen-UP)
    //   S → world -Z  (renders to screen-DOWN)
    //
    // No camera-relative rotation; holding A always moves the body the
    // same world direction so the chase-cam-spin loop is impossible.
    let mx = 0, mz = 0;
    if (input.left)  mx += 1;     // A → world +X
    if (input.right) mx -= 1;     // D → world -X
    if (input.fwd)   mz += 1;
    if (input.back)  mz -= 1;
    const mag = Math.hypot(mx, mz);
    if (mag > 0) { mx /= mag; mz /= mag; }
    const sprint = !!input.sprint;
    // Bleed off any active slow effect (spore cloud etc).
    if (this.slowTimer > 0) {
      this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.slowTimer === 0) this.slowFactor = 1;
    }
    const maxSpeed = (sprint ? SPRINT_MAX : WALK_MAX) * this.slowFactor;

    // Update facing toward movement direction (snappier turn-around now).
    if (mag > 0.01) {
      const target = Math.atan2(mx, mz);
      let d = target - this.facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.facing += d * Math.min(1, dt * TURN_RATE);
    }

    // Acceleration on ground / in air.
    const acc = this.grounded ? ACCEL_GROUND : ACCEL_AIR;
    this.vel.x += mx * acc * dt;
    this.vel.z += mz * acc * dt;

    // Clamp horizontal speed.
    const horiz = Math.hypot(this.vel.x, this.vel.z);
    if (horiz > maxSpeed) {
      this.vel.x *= maxSpeed / horiz;
      this.vel.z *= maxSpeed / horiz;
    }

    // Friction when no input on ground.
    if (this.grounded && mag === 0) {
      const f = FRICTION_GROUND * dt;
      const sp = Math.hypot(this.vel.x, this.vel.z);
      if (sp <= f) { this.vel.x = 0; this.vel.z = 0; }
      else {
        this.vel.x -= (this.vel.x / sp) * f;
        this.vel.z -= (this.vel.z / sp) * f;
      }
    }

    // Gravity.
    this.vel.y -= GRAVITY * dt;
    if (this.vel.y < -MAX_FALL) this.vel.y = -MAX_FALL;

    // Jump (with coyote + buffer).
    if (input.jumpPressed) this.jumpBuffer = JUMP_BUFFER;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vel.y = JUMP_V;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      sfx.jump();
    }

    // Integrate position. Wall collisions resolved next.
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;

    if (walls) this.resolveWalls(walls);

    // Ground collision via heightmap sample.
    const groundY = sampleHeight(this.pos.x, this.pos.z);
    if (this.pos.y <= groundY + 0.001) {
      const wasAir = !this.grounded;
      this.pos.y = groundY;
      if (this.vel.y < -2 && wasAir) sfx.land();
      this.vel.y = 0;
      this.grounded = true;
      this.coyote = COYOTE;
    } else {
      this.grounded = false;
      this.coyote = Math.max(0, this.coyote - dt);
    }

    if (this.invuln > 0) this.invuln -= dt;
    if (this.stumble > 0) this.stumble -= dt;

    // Animation.
    const speed = Math.hypot(this.vel.x, this.vel.z);
    const moving = speed > 0.5;
    this.gait += dt * (moving ? (sprint ? 12 : 8) : 0);
    const swing = moving ? Math.sin(this.gait) * (sprint ? 0.7 : 0.5) : 0;
    this.rig.legL.rotation.x = swing;
    this.rig.legR.rotation.x = -swing;
    this.rig.armL.rotation.x = -swing * 0.9;
    this.rig.armR.rotation.x = swing * 0.9;
    // Slight bounce.
    const bounce = moving ? Math.abs(Math.sin(this.gait * 2)) * 0.04 : 0;
    this.rig.hips.position.y = 0.9 + bounce;

    // Footstep audio.
    const stepKey = Math.floor(this.gait / Math.PI);
    if (moving && this.grounded && stepKey !== this.lastStep) {
      this.lastStep = stepKey;
      sfx.step();
    }

    // Stumble overlay (set externally on near-miss).
    if (this.stumble > 0) this.rig.body.rotation.z = Math.sin(this.stumble * 30) * 0.08;
    else this.rig.body.rotation.z = 0;

    // Apply transform.
    this.rig.root.position.copy(this.pos);
    this.rig.body.rotation.y = this.facing;
    this.rig.body.position.set(0, 0, 0);
  }

  speedXZ() { return Math.hypot(this.vel.x, this.vel.z); }
}

export const PLAYER_RADIUS = PLAYER_R;
export const PLAYER_HEIGHT = PLAYER_H;
