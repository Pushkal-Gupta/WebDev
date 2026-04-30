// Tar Geyser — a passive area-denial trap on a fixed timer. The ground
// circle bubbles, then erupts a vertical column for 0.5 seconds. The
// circle is always visible so an attentive player can plan a path; the
// timing is the puzzle, not the placement.

import * as THREE from 'three';
import { Trap } from './base.js';
import { sfx } from '../audio.js';

const RADIUS = 1.4;
const PERIOD = 4.0;          // total cycle length
const ERUPT_TIME = 0.5;
const WARN_TIME = 0.8;       // last N seconds before eruption: warning pulse

export class TarGeyser extends Trap {
  constructor({ biome, anchor, period = PERIOD, phase = 0 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // Dark patch on the ground — readable on any biome thanks to high contrast.
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(RADIUS, 24),
      new THREE.MeshStandardMaterial({ color: '#1a1010', roughness: 1.0, metalness: 0.0 }),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.y = 0.03;
    g.add(patch);

    // Warning ring — bright orange, pulses near eruption.
    const warn = new THREE.Mesh(
      new THREE.RingGeometry(RADIUS - 0.05, RADIUS + 0.2, 28),
      new THREE.MeshBasicMaterial({ color: '#ffa024', transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
    );
    warn.rotation.x = -Math.PI / 2;
    warn.position.y = 0.04;
    g.add(warn);

    // Plume — invisible until eruption.
    const plume = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.7, 4.2, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: '#0a0a0a', transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }),
    );
    plume.position.y = 2.1;
    g.add(plume);

    super({ kind: 'geyser', group: g, anchor, hitRadius: RADIUS * 0.85, anticipation: 0, cooldown: 0 });
    this.patch = patch;
    this.warn = warn;
    this.plume = plume;
    this.period = period;
    // Phase offset lets multiple geysers be staggered in a chain.
    this.t = phase;
  }

  tick(dt, ctx) {
    this.t += dt;
    const cycle = this.t % this.period;
    const eruptStart = this.period - ERUPT_TIME;
    const warnStart = eruptStart - WARN_TIME;

    if (cycle >= eruptStart) {
      // Eruption.
      const k = (cycle - eruptStart) / ERUPT_TIME;
      this.plume.material.opacity = 0.85 - k * 0.35;
      this.plume.scale.set(1, 1 + k * 0.3, 1);
      this.warn.material.opacity = 0.7;
      this.lethalActive = true;
      this.lethalCenter.copy(this.anchor).setY(this.anchor.y + 1.4);
      this.hitRadius = RADIUS * 0.85;
      if (!this._erupted) {
        this._erupted = true;
        sfx.windGust?.();
      }
    } else if (cycle >= warnStart) {
      // Warning pulse — strobing orange ring.
      const k = (cycle - warnStart) / WARN_TIME;
      this.warn.material.opacity = 0.2 + Math.sin(cycle * 30) * 0.4 * k;
      this.plume.material.opacity = 0;
      this.lethalActive = false;
      this._erupted = false;
    } else {
      // Resting — patch with idle bubbles.
      this.warn.material.opacity = 0.05 + Math.sin(cycle * 1.4) * 0.05;
      this.plume.material.opacity = 0;
      this.lethalActive = false;
    }
  }
}
