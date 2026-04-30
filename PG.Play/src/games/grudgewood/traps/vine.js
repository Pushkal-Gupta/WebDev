// Carnivorous Vine — a slow, snake-like vine that sweeps perpetually
// across the path. Always lethal on contact, never bursts; the player
// reads the gap and times their dash through. No windup — its existence
// is the threat.

import * as THREE from 'three';
import { Trap } from './base.js';
import { sfx } from '../audio.js';

const SWEEP_HALF = 6.5;       // metres each side of trap anchor
const PERIOD = 3.4;           // seconds for one full back-and-forth

export class CarnivorousVine extends Trap {
  constructor({ biome, anchor }) {
    const g = new THREE.Group();
    g.position.copy(anchor);

    // The vine itself — a long, undulating segmented snake on the floor.
    const vineMat = new THREE.MeshStandardMaterial({
      color: '#4a8e3a', emissive: '#1a3a18', emissiveIntensity: 0.3,
      roughness: 0.7, flatShading: true,
    });
    const segments = 7;
    const segs = [];
    const segLen = 0.6;
    for (let i = 0; i < segments; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), vineMat);
      m.position.set((i - (segments - 1) / 2) * segLen, 0.32, 0);
      g.add(m);
      segs.push(m);
    }
    // Head — slightly bigger.
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), vineMat);
    g.add(head);

    // Bright accent stripe along the floor showing the sweep zone.
    const zone = new THREE.Mesh(
      new THREE.PlaneGeometry(SWEEP_HALF * 2, 1.4),
      new THREE.MeshBasicMaterial({ color: '#7afc7a', transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.y = 0.03;
    g.add(zone);

    super({ kind: 'vine', group: g, anchor, hitRadius: 0.6, anticipation: 0, cooldown: 0 });
    this.segs = segs;
    this.head = head;
    this.zone = zone;
    this.lethalActive = true;     // vines are always lethal on contact
  }

  tick(dt, ctx) {
    this.t += dt;
    // Smooth back-and-forth sweep.
    const phase = (this.t / PERIOD) * Math.PI * 2;
    const x = Math.sin(phase) * SWEEP_HALF;
    // Each segment trails the head with a slight phase offset for body wave.
    for (let i = 0; i < this.segs.length; i++) {
      const lag = i * 0.18;
      const sx = Math.sin(phase - lag) * SWEEP_HALF;
      const sz = Math.cos(phase - lag) * 0.4;
      this.segs[i].position.set(sx, 0.32, sz);
    }
    this.head.position.set(x + Math.cos(phase) * 0.35, 0.45, Math.sin(phase) * 0.4);

    // Lethal sphere follows the head.
    this.lethalCenter.set(this.anchor.x + this.head.position.x, this.anchor.y + 0.45, this.anchor.z + this.head.position.z);
    this.hitRadius = 0.6;

    // Hiss audio at the extremes for telegraph rhythm.
    const swept = Math.abs(Math.sin(phase));
    if (swept > 0.97 && (this._lastHiss || 0) + 1.4 < this.t) {
      this._lastHiss = this.t;
      sfx.emberHiss?.();
    }
  }
}
