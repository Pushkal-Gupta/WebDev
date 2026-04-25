// Branch whip — a tree's branch winds back, creaks, then snaps across the path.
// Tell: tree leans + audio creak. Strike: branch swings horizontally.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree, makeBranch } from '../props.js';
import { sfx } from '../audio.js';

const tmpV = new THREE.Vector3();

export class BranchWhip extends Trap {
  constructor({ biome, anchor, side = 'right', length = 4 }) {
    const g = new THREE.Group();
    const tree = makeTree(biome, 1.4, 0);
    g.add(tree);
    // Branch arm rooted near canopy, swung along world-X.
    const pivot = new THREE.Group();
    pivot.position.set(0, 4.2, 0);
    g.add(pivot);
    const branch = makeBranch(biome, length, 0.22);
    // Branch points "up" by default — rotate so it points sideways.
    branch.rotation.z = side === 'right' ? -Math.PI / 2 : Math.PI / 2;
    pivot.add(branch);

    super({ kind: 'whip', group: g, anchor, hitRadius: 0.8, anticipation: 0.7, cooldown: 2.2 });
    g.position.copy(anchor);
    this.pivot = pivot;
    this.branch = branch;
    this.length = length;
    this.side = side;
    this.windupAngle = 0.55;
    this.strikeAngle = -1.05;
    this.creaked = false;
    this.swinging = false;
    this.swingT = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    const playerNear = this.anchor.distanceTo(ctx.player) < 9 && Math.abs(ctx.player.z - this.anchor.z) < 4;

    if (this.phase === 'idle') {
      if (playerNear) {
        this.phase = 'anticipation';
        this.t = 0;
        this.creaked = false;
      }
      // Light wind sway.
      this.pivot.rotation.x = Math.sin(this.t * 1.4) * 0.05;
    } else if (this.phase === 'anticipation') {
      const k = Math.min(1, this.t / this.anticipation);
      // Wind up — branch leans away from path.
      this.pivot.rotation.x = -this.windupAngle * k;
      if (!this.creaked && k > 0.5) { this.creaked = true; sfx.branchCreak(); }
      if (this.t >= this.anticipation) {
        this.phase = 'strike';
        this.t = 0;
        sfx.branchSnap();
      }
    } else if (this.phase === 'strike') {
      const k = Math.min(1, this.t / 0.18);
      this.pivot.rotation.x = THREE.MathUtils.lerp(-this.windupAngle, this.strikeAngle, k);
      // Update lethal sphere — sweep tip across the path.
      const tip = this.branch.localToWorld(tmpV.set(0, this.length, 0));
      this.lethalCenter.copy(tip);
      this.hitRadius = 1.0;
      this.lethalActive = true;
      if (this.t >= 0.18) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
      }
    } else {
      // cooldown: branch returns home.
      const k = Math.min(1, this.t / 0.9);
      this.pivot.rotation.x = THREE.MathUtils.lerp(this.strikeAngle, 0, k);
      if (this.t >= this.cooldown) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
