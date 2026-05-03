// Branch Lash Combo — paired trees on opposite flanks. Both trees light up
// in sync, then whip across the path one after the other (~0.45s offset).
// The combo forces a player to time a sprint or jump through the gap
// instead of strolling between two waiting branches.
//
// Why two trees as one trap: the timing between strikes is the whole
// point. If they were independent traps they could drift out of phase
// after one fires and the joke wouldn't land.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree, makeBranch, makePusher } from '../props.js';
import { sfx } from '../audio.js';

const FLANK = 6.5;             // distance from path centerline to each tree
const WINDUP = 0.65;
const STRIKE = 0.18;
const GAP = 0.45;              // delay between left-strike and right-strike
const COOLDOWN = 2.6;
const LENGTH = 4.2;

export class BranchLashCombo extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // Two trees on opposite flanks of the path.
    const treeL = makeTree(biome, 1.35, 0);
    treeL.position.set(-FLANK, 0, 0);
    g.add(treeL);
    const treeR = makeTree(biome, 1.35, 1);
    treeR.position.set(FLANK, 0, 0);
    g.add(treeR);

    // Each tree has its own pivot + branch arm. Branch points up by
    // default — we rotate it to lie horizontal toward the path so the
    // strike sweep is readable in profile.
    const pivotL = new THREE.Group();
    pivotL.position.set(-FLANK, 4.2, 0);
    g.add(pivotL);
    const branchL = makeBranch(biome, LENGTH, 0.22);
    branchL.rotation.z = -Math.PI / 2;       // points +X (toward path)
    pivotL.add(branchL);

    const pivotR = new THREE.Group();
    pivotR.position.set(FLANK, 4.2, 0);
    g.add(pivotR);
    const branchR = makeBranch(biome, LENGTH, 0.22);
    branchR.rotation.z = Math.PI / 2;        // points -X (toward path)
    pivotR.add(branchR);

    // Synchronisation marker — bright stripe on the path so a player
    // approaching the combo sees they're walking into something paired.
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(FLANK * 2 - 0.5, 1.6),
      new THREE.MeshBasicMaterial({ color: '#ff8a40', transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.y = 0.04;
    g.add(stripe);

    // Two pusher gremlins — one behind each tree, both heaving inward
    // toward the path. The animation in tick() alternates their shove
    // timing to match the alternating whips: pusher L lunges first
    // when branch L strikes, pusher R lunges on the second beat.
    const pusherL = makePusher(biome);
    pusherL.position.set(-FLANK, 0, -0.9);
    pusherL.rotation.y = Math.PI;
    g.add(pusherL);
    const pusherR = makePusher(biome);
    pusherR.position.set( FLANK, 0, -0.9);
    pusherR.rotation.y = Math.PI;
    g.add(pusherR);

    super({ kind: 'lash', group: g, anchor, hitRadius: 1.0, anticipation: WINDUP, cooldown: COOLDOWN });
    this.pivots = [pivotL, pivotR];
    this.branches = [branchL, branchR];
    this.stripe = stripe;
    this.stage = 'idle';            // idle | windup | strikeL | gap | strikeR | cooldown
    this.tStage = 0;
    this.pusherBodies = [pusherL.userData.body, pusherR.userData.body];
  }

  // Helper to read the world-space tip of one branch for hit detection.
  _branchTip(idx, out) {
    const b = this.branches[idx];
    return b.localToWorld(out.set(0, LENGTH, 0));
  }

  tick(dt, ctx) {
    this.t += dt;
    this.tStage += dt;
    const dz = ctx.player.z - this.anchor.z;
    const between = Math.abs(dz) < 4.5;

    // Pusher animation per stage. Each pusher's body tilts forward
    // when their tree's branch is striking, leans back during the
    // windup, and settles during the cooldown.
    let tiltL = 0, tiltR = 0;
    if (this.stage === 'windup') {
      tiltL = tiltR = -0.32 * Math.min(1, this.tStage / WINDUP);
    } else if (this.stage === 'strikeL') {
      tiltL = THREE.MathUtils.lerp(-0.32, 0.45, Math.min(1, this.tStage / STRIKE));
      tiltR = -0.32;
    } else if (this.stage === 'gap') {
      tiltL = THREE.MathUtils.lerp(0.45, 0.0, Math.min(1, this.tStage / GAP));
      tiltR = THREE.MathUtils.lerp(-0.32, -0.42, Math.min(1, this.tStage / GAP));
    } else if (this.stage === 'strikeR') {
      tiltL = 0.0;
      tiltR = THREE.MathUtils.lerp(-0.42, 0.5, Math.min(1, this.tStage / STRIKE));
    } else if (this.stage === 'cooldown') {
      const k = Math.min(1, this.tStage / (COOLDOWN * 0.8));
      tiltL = THREE.MathUtils.lerp(0.0, 0, k);
      tiltR = THREE.MathUtils.lerp(0.5, 0, k);
    }
    this.pusherBodies[0].rotation.x = tiltL;
    this.pusherBodies[1].rotation.x = tiltR;

    if (this.stage === 'idle') {
      if (between) {
        this.stage = 'windup';
        this.tStage = 0;
        sfx.branchCreak?.();
      }
      this.stripe.material.opacity = 0;
      // Idle sway, opposing phases so the trees feel alive but separate.
      this.pivots[0].rotation.x = Math.sin(this.t * 1.2) * 0.04;
      this.pivots[1].rotation.x = Math.sin(this.t * 1.2 + 1.7) * 0.04;
    } else if (this.stage === 'windup') {
      const k = Math.min(1, this.tStage / WINDUP);
      this.pivots[0].rotation.x = -0.55 * k;
      this.pivots[1].rotation.x = -0.55 * k;
      this.stripe.material.opacity = 0.2 + k * 0.55;
      if (this.tStage >= WINDUP) {
        this.stage = 'strikeL';
        this.tStage = 0;
        sfx.branchSnap?.();
      }
    } else if (this.stage === 'strikeL') {
      const k = Math.min(1, this.tStage / STRIKE);
      this.pivots[0].rotation.x = THREE.MathUtils.lerp(-0.55, -1.05, k);
      const tip = new THREE.Vector3();
      this._branchTip(0, tip);
      this.lethalCenter.copy(tip);
      this.hitRadius = 1.1;
      this.lethalActive = true;
      if (this.tStage >= STRIKE) {
        this.stage = 'gap';
        this.tStage = 0;
        this.lethalActive = false;
      }
    } else if (this.stage === 'gap') {
      // Left branch retracts while right branch waits to fire.
      const k = Math.min(1, this.tStage / GAP);
      this.pivots[0].rotation.x = THREE.MathUtils.lerp(-1.05, -0.2, k);
      // Right branch dips back as the wind-up for its strike.
      this.pivots[1].rotation.x = THREE.MathUtils.lerp(-0.55, -0.85, k);
      if (this.tStage >= GAP) {
        this.stage = 'strikeR';
        this.tStage = 0;
        sfx.branchSnap?.();
      }
    } else if (this.stage === 'strikeR') {
      const k = Math.min(1, this.tStage / STRIKE);
      this.pivots[1].rotation.x = THREE.MathUtils.lerp(-0.85, -1.25, k);
      const tip = new THREE.Vector3();
      this._branchTip(1, tip);
      this.lethalCenter.copy(tip);
      this.hitRadius = 1.1;
      this.lethalActive = true;
      if (this.tStage >= STRIKE) {
        this.stage = 'cooldown';
        this.tStage = 0;
        this.lethalActive = false;
      }
    } else {
      // Cooldown — both branches return home, stripe fades.
      const k = Math.min(1, this.tStage / (COOLDOWN * 0.8));
      this.pivots[0].rotation.x = THREE.MathUtils.lerp(this.pivots[0].rotation.x, 0, Math.min(1, dt * 4));
      this.pivots[1].rotation.x = THREE.MathUtils.lerp(this.pivots[1].rotation.x, 0, Math.min(1, dt * 4));
      this.stripe.material.opacity = Math.max(0, this.stripe.material.opacity - dt * 1.4);
      if (this.tStage >= COOLDOWN) { this.stage = 'idle'; this.tStage = 0; }
    }
  }
}
