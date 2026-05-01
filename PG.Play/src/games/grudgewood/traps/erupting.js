// Erupting Tree — a small earth mound bubbles in the path; if the
// player walks through, a full tree shoots up out of the ground at
// high speed and impales them from below. Telegraph is the mound
// itself plus an audible rumble as the trigger ramps. A player who
// sees the mound and steps around it is fine.

import * as THREE from 'three';
import { Trap } from './base.js';
import { makeTree } from '../props.js';
import { sfx } from '../audio.js';

const TRIGGER_RADIUS = 1.4;
const WINDUP = 0.25;       // very short — the mound IS the warning
const ERUPT_TIME = 0.45;   // tree rises in this window
const HOLD_TIME = 0.35;    // stays out (lethal trunk) before sinking
const COOLDOWN = 4.5;
const RISE_HEIGHT = 5.5;

export class EruptingTree extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // Earth mound — a low cone visible above the floor. Bright biome-
    // accent rim so it reads on every biome.
    const moundMat = new THREE.MeshStandardMaterial({
      color: biome.ground.darken, roughness: 1.0, flatShading: true,
    });
    const mound = new THREE.Mesh(
      new THREE.ConeGeometry(TRIGGER_RADIUS, 0.45, 16),
      moundMat,
    );
    mound.position.y = 0.22;
    mound.castShadow = true;
    g.add(mound);

    // Rim highlight ring (always visible) so the mound reads as a hazard
    // and not just a rock.
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(TRIGGER_RADIUS, TRIGGER_RADIUS + 0.18, 24),
      new THREE.MeshBasicMaterial({ color: '#ffb070', transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.06;
    g.add(rim);

    // Hidden tree underground — sunk below ground, rises during eruption.
    const tree = makeTree(biome, 1.3, 0);
    tree.position.y = -RISE_HEIGHT;
    g.add(tree);

    super({ kind: 'erupting', group: g, anchor, hitRadius: 0.9, anticipation: WINDUP, cooldown: COOLDOWN });
    this.mound = mound;
    this.rim = rim;
    this.tree = tree;
    this.heldT = 0;
  }

  tick(dt, ctx) {
    this.t += dt;
    if (this.phase === 'idle') {
      // Rim breathes between two opacities — telegraphing "this is alive".
      this.rim.material.opacity = 0.35 + Math.sin(this.t * 2.6) * 0.15;
      const onTop = this.anchor.distanceTo(ctx.player) < TRIGGER_RADIUS;
      if (onTop) {
        this.phase = 'anticipation';
        this.t = 0;
        sfx.rootRumble?.();
      }
    } else if (this.phase === 'anticipation') {
      // Mound lifts a touch — rim flares.
      const k = Math.min(1, this.t / WINDUP);
      this.mound.position.y = 0.22 + 0.18 * k;
      this.rim.material.opacity = 0.6 + k * 0.3;
      if (this.t >= WINDUP) {
        this.phase = 'strike';
        this.t = 0;
        sfx.rootSnap?.();
      }
    } else if (this.phase === 'strike') {
      // Tree shoots up from underground. The mound stays in place at the
      // base. Lethal sphere centred on the trunk above ground level.
      const k = Math.min(1, this.t / ERUPT_TIME);
      const easeOut = 1 - (1 - k) * (1 - k);     // shoots up fast at start
      this.tree.position.y = THREE.MathUtils.lerp(-RISE_HEIGHT, -0.2, easeOut);
      this.lethalCenter.copy(this.anchor).setY(this.anchor.y + 1.6);
      this.hitRadius = 1.1;
      this.lethalActive = true;
      if (this.t >= ERUPT_TIME) {
        this.phase = 'hold';
        this.t = 0;
        this.heldT = 0;
      }
    } else if (this.phase === 'hold') {
      // Tree fully erupted — quivers, lethal for one more beat.
      this.heldT += dt;
      this.tree.rotation.z = Math.sin(this.heldT * 24) * 0.05;
      this.lethalActive = this.heldT < HOLD_TIME;
      if (this.heldT >= HOLD_TIME) {
        this.phase = 'cooldown';
        this.t = 0;
        this.lethalActive = false;
      }
    } else {
      // Cooldown — tree slowly sinks back. Mound resets to idle height.
      const k = Math.min(1, this.t / (COOLDOWN * 0.7));
      this.tree.position.y = THREE.MathUtils.lerp(-0.2, -RISE_HEIGHT, k);
      this.tree.rotation.z = THREE.MathUtils.lerp(this.tree.rotation.z, 0, Math.min(1, dt * 4));
      this.mound.position.y = THREE.MathUtils.lerp(this.mound.position.y, 0.22, Math.min(1, dt * 3));
      if (this.t >= COOLDOWN) { this.phase = 'idle'; this.t = 0; }
    }
  }
}
