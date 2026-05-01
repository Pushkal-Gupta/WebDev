// Falling Tree — a tree on the flank topples 90° across the path when
// the player approaches. The whole trunk falls horizontally, sweeping
// the path at ground level. Telegraph: audible creak, slow lean back
// to ~10°, then a fast forward fall. The trunk is lethal during the
// falling motion and for a beat after it lands.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree } from '../props.js';
import { sfx } from '../audio.js';

const REACH = 9;             // metres at which the tree starts winding up
const WINDUP = 0.9;          // back-lean duration (long, very readable)
const FALL_TIME = 0.35;      // 90° fall — fast, players have ~0.3s to dodge
const LIE_TIME = 0.5;        // trunk stays lethal on the ground briefly
const COOLDOWN = 5.0;        // very long — tree has to "stand back up"
const TRUNK_LENGTH = 7.5;    // visible length when felled

export class FallingTree extends Trap {
  constructor({ biome, anchor, side = 1 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // The tree is built standing at its base; we rotate the entire group
    // to fell it. We pivot around the base, so children's local origin
    // lives at ground level.
    const trunkPivot = new THREE.Group();
    g.add(trunkPivot);
    const tree = makeTree(biome, 1.5, 0);
    trunkPivot.add(tree);

    // The fall axis — rotation around world-X (so the canopy sweeps the
    // path along Z). `side` flips it so the tree falls toward the path
    // from whichever flank it was placed on.
    super({ kind: 'falling', group: g, anchor, hitRadius: 0.9, anticipation: WINDUP, cooldown: COOLDOWN });
    this.tree = tree;
    this.pivot = trunkPivot;
    this.side = side;
    this.creaked = false;
    this.lieT = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    const inRange = this.anchor.distanceTo(ctx.player) < REACH;

    if (this.phase === 'idle') {
      // Subtle sway so the tree reads as alive.
      this.pivot.rotation.x = Math.sin(this.t * 1.2) * 0.025;
      if (inRange) {
        this.phase = 'anticipation';
        this.t = 0;
        this.creaked = false;
      }
    } else if (this.phase === 'anticipation') {
      // Lean BACK away from the path before the fall — gives the player
      // a clear "windup" read. Pivot rotation around X tips trunk in Z.
      const k = Math.min(1, this.t / WINDUP);
      this.pivot.rotation.x = THREE.MathUtils.lerp(0, -0.18, k);
      if (!this.creaked && k > 0.4) {
        this.creaked = true;
        sfx.branchCreak?.();
      }
      if (this.t >= WINDUP) {
        this.phase = 'strike';
        this.t = 0;
        sfx.branchSnap?.();
      }
    } else if (this.phase === 'strike') {
      // Fall 90° forward toward the path in FALL_TIME. Quadratic ease-in
      // sells the inertia of the trunk pulling itself over.
      const k = Math.min(1, this.t / FALL_TIME);
      const angle = -0.18 + (Math.PI / 2 + 0.18) * k * k;
      this.pivot.rotation.x = angle;
      // Lethal sphere follows the canopy mid-trunk during the fall.
      const trunkMidY = Math.cos(angle) * (TRUNK_LENGTH / 2);
      const trunkMidZ = Math.sin(angle) * (TRUNK_LENGTH / 2);
      this.lethalCenter.set(
        this.anchor.x,
        this.anchor.y + trunkMidY,
        this.anchor.z + trunkMidZ,
      );
      this.hitRadius = 1.1;
      this.lethalActive = true;
      if (this.t >= FALL_TIME) {
        this.phase = 'lie';
        this.t = 0;
        this.lieT = 0;
        sfx.logImpact?.();
      }
    } else if (this.phase === 'lie') {
      // Trunk lies on ground — still lethal for a beat as the bark
      // settles. The player sees a long log across the path during this
      // window which is the death-card screenshot.
      this.lieT += dt;
      this.lethalCenter.set(
        this.anchor.x,
        this.anchor.y + 0.3,
        this.anchor.z + TRUNK_LENGTH / 2,
      );
      this.hitRadius = TRUNK_LENGTH / 2 + 0.4;
      this.lethalActive = this.lieT < LIE_TIME;
      if (this.lieT >= LIE_TIME) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
      }
    } else {
      // Cooldown — slowly lift the trunk back upright over half the
      // cooldown so the tree is ready to fall again on a return run.
      const k = Math.min(1, this.t / (COOLDOWN * 0.7));
      this.pivot.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, k);
      if (this.t >= COOLDOWN) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
