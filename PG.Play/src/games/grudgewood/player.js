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
const WALK_MAX = 6.4;     // m/s
const SPRINT_MAX = 9.6;
const ACCEL_GROUND = 38;
const ACCEL_AIR = 14;
const FRICTION_GROUND = 32;
const JUMP_V = 9.5;
const GRAVITY = 24;
const MAX_FALL = 26;
const COYOTE = 0.10;
const JUMP_BUFFER = 0.12;
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
  }

  reset(pos, facing = 0) {
    this.pos.copy(pos);
    this.vel.set(0, 0, 0);
    this.facing = facing;
    this.alive = true;
    this.invuln = 0.4;
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

  update(dt, { input, sampleHeight, casualMode }) {
    // Death animation only.
    if (!this.alive) {
      this.deathT += dt;
      // Slow tumble — body falls, rotates.
      this.rig.body.rotation.x += dt * (this.deathKind === 'pit' ? -2.2 : 3.2);
      this.rig.body.rotation.z += dt * 1.6;
      this.rig.body.position.y -= dt * (this.deathKind === 'pit' ? 8 : 1.4);
      return;
    }

    // Input → desired direction.
    let mx = 0, mz = 0;
    if (input.left)  mx -= 1;
    if (input.right) mx += 1;
    if (input.fwd)   mz += 1;
    if (input.back)  mz -= 1;
    const mag = Math.hypot(mx, mz);
    if (mag > 0) { mx /= mag; mz /= mag; }
    const sprint = !!input.sprint;
    const maxSpeed = sprint ? SPRINT_MAX : WALK_MAX;

    // Update facing toward movement direction.
    if (mag > 0.01) {
      const target = Math.atan2(mx, mz);
      // Smooth rotation
      let d = target - this.facing;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.facing += d * Math.min(1, dt * 14);
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

    // Integrate.
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

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
