// Mirror Tree — a tree that wears a glowing humanoid silhouette on its
// trunk. The figure mirrors the player's lateral position so the player
// recognises themselves in it. The mechanic: while the player lingers
// inside its 7m range, the tree creeps closer in 0.4s lurches. Once it
// closes the gap it slams a branch through where the player just stood.
//
// Why a mirror: telegraph by recognition. The first time it happens you
// see "that thing is me." The second time, you know to keep moving.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree, makeBranch } from '../props.js';
import { sfx } from '../audio.js';

const RANGE = 7.5;
const LINGER_THRESHOLD = 1.0;        // seconds inside range before it lurches
const LURCH_DIST = 2.4;
const LURCH_TIME = 0.35;
const MAX_LURCHES = 3;
const STRIKE_REACH = 4.5;
const STRIKE_TIME = 0.22;
const COOLDOWN = 3.4;

export class MirrorTree extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    const tree = makeTree(biome, 1.4, 2);
    g.add(tree);

    // Glowing humanoid silhouette on the trunk — a small stick figure
    // built from boxes. The figure is parented to the TREE (not the trap
    // group) so it travels with every lurch instead of detaching from the
    // tree visually as the tree creeps closer.
    const figure = new THREE.Group();
    const figMat = new THREE.MeshBasicMaterial({ color: biome.accent.getStyle(), transparent: true, opacity: 0.85 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.05), figMat);
    head.position.y = 1.95;
    figure.add(head);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.05), figMat);
    torso.position.y = 1.55;
    figure.add(torso);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.05), figMat);
    legL.position.set(-0.08, 1.04, 0);
    figure.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.05), figMat);
    legR.position.set(0.08, 1.04, 0);
    figure.add(legR);
    figure.position.set(0, 0, 0.3);     // sits on the front of the trunk facing the path
    tree.add(figure);

    // Striking arm — also a child of the tree so it lunges from the
    // tree's *current* position, not the original anchor. Without this
    // the strike telegraphs "miss-by-design" because the branch comes
    // from where the tree used to be.
    const pivot = new THREE.Group();
    pivot.position.set(0, 4.0, 0);
    tree.add(pivot);
    const arm = makeBranch(biome, STRIKE_REACH, 0.2);
    arm.rotation.x = -Math.PI / 2;       // points along +Z initially
    pivot.add(arm);

    super({ kind: 'mirror', group: g, anchor, hitRadius: 1.0, anticipation: 0, cooldown: COOLDOWN });
    this.tree = tree;
    this.figure = figure;
    this.pivot = pivot;
    this.arm = arm;
    this.stage = 'watching';        // watching | lurching | striking | cooldown
    this.tStage = 0;
    this.linger = 0;
    this.lurches = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    this.tStage += dt;
    const dx = ctx.player.x - this.anchor.x;
    const dz = ctx.player.z - this.anchor.z;
    const range = Math.hypot(dx, dz);
    const inRange = range < RANGE;

    // Always update the figure to mirror the player's lateral offset.
    // Clamps to the trunk width so it stays visually attached.
    const targetOffsetX = THREE.MathUtils.clamp(dx * 0.18, -0.45, 0.45);
    this.figure.position.x = THREE.MathUtils.lerp(this.figure.position.x, targetOffsetX, Math.min(1, dt * 6));
    this.figure.rotation.y = -Math.atan2(dx, dz);

    if (this.stage === 'watching') {
      if (inRange) {
        this.linger += dt;
        // Figure brightens as the trap heats up — clearer the closer the
        // player stays.
        const heat = Math.min(1, this.linger / LINGER_THRESHOLD);
        this.figure.children.forEach((c) => { if (c.material) c.material.opacity = 0.5 + heat * 0.5; });
        if (this.linger >= LINGER_THRESHOLD && this.lurches < MAX_LURCHES) {
          this.stage = 'lurching';
          this.tStage = 0;
          this.linger = 0;
          this.lurches += 1;
          sfx.rootRumble?.();
        }
      } else {
        this.linger = Math.max(0, this.linger - dt * 0.6);
        this.figure.children.forEach((c) => { if (c.material) c.material.opacity = Math.max(0.5, c.material.opacity - dt * 0.6); });
        // Reset lurch counter once the player has clearly walked off.
        if (range > RANGE * 1.5) this.lurches = 0;
      }
    } else if (this.stage === 'lurching') {
      const k = Math.min(1, this.tStage / LURCH_TIME);
      // Tree lurches a step closer to the player along XZ.
      const dirX = Math.sign(dx) || 0;
      const dirZ = Math.sign(dz) || 0;
      const step = LURCH_DIST * (k - (k - dt / LURCH_TIME));     // incremental
      this.tree.position.x += dirX * step * 0.5;
      this.tree.position.z += dirZ * step * 0.5;
      // Same for the figure and pivot so the silhouette stays attached.
      this.figure.position.z = THREE.MathUtils.lerp(0.3, 0.3, 1);
      if (this.tStage >= LURCH_TIME) {
        // After the third lurch it commits to a strike.
        if (this.lurches >= MAX_LURCHES || range < 2.5) {
          this.stage = 'striking';
          this.tStage = 0;
          sfx.branchSnap?.();
        } else {
          this.stage = 'watching';
          this.tStage = 0;
        }
      }
    } else if (this.stage === 'striking') {
      const k = Math.min(1, this.tStage / STRIKE_TIME);
      // Slam down toward the path centerline in front of the trunk. The
      // arm is now a descendant of the tree, so localToWorld already
      // accounts for the tree's lurched position — no extra offset needed.
      this.pivot.rotation.x = THREE.MathUtils.lerp(0, -0.9, k);
      const tip = this.arm.localToWorld(new THREE.Vector3(0, STRIKE_REACH, 0));
      this.lethalCenter.copy(tip);
      this.hitRadius = 1.0;
      this.lethalActive = true;
      if (this.tStage >= STRIKE_TIME) {
        this.stage = 'cooldown';
        this.tStage = 0;
        this.lethalActive = false;
      }
    } else {
      // Cooldown — branch returns, tree slowly retreats to its starting
      // post so the trick can play again later.
      const k = Math.min(1, this.tStage / COOLDOWN);
      this.pivot.rotation.x = THREE.MathUtils.lerp(this.pivot.rotation.x, 0, Math.min(1, dt * 3));
      this.tree.position.x = THREE.MathUtils.lerp(this.tree.position.x, 0, Math.min(1, dt * 1.4));
      this.tree.position.z = THREE.MathUtils.lerp(this.tree.position.z, 0, Math.min(1, dt * 1.4));
      if (this.tStage >= COOLDOWN) {
        this.tree.position.set(0, 0, 0);
        this.pivot.rotation.x = 0;
        this.stage = 'watching';
        this.tStage = 0;
        this.lurches = 0;
        this.linger = 0;
      }
    }
  }
}
