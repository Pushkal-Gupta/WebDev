// Ember rain — Heart biome ambient hazard. Spawns burning ember spheres
// over a zone; lethal on contact while falling. Predictable cycles so it's fair.

import * as THREE from 'three';
import { Trap } from './base.js';
import { sfx } from '../audio.js';

export class EmberRain extends Trap {
  constructor({ biome, anchor, radius = 6, count = 5, period = 1.6 }) {
    const g = new THREE.Group();
    g.position.copy(anchor);
    super({ kind: 'embers', group: g, anchor, hitRadius: 0.5, anticipation: 0, cooldown: 0 });
    this.radius = radius;
    this.count = count;
    this.period = period;
    this.spawnT = 0;
    this.embers = [];
    this.mat = new THREE.MeshStandardMaterial({
      color: biome.accent, emissive: biome.accent, emissiveIntensity: 1.4, roughness: 0.4, flatShading: true,
    });
    // Soft visual cue ring on the ground showing the danger zone.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.1, radius, 32),
      new THREE.MeshBasicMaterial({ color: biome.accent, transparent: true, opacity: 0.2, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    g.add(ring);
  }

  spawnEmber() {
    const ang = Math.random() * Math.PI * 2;
    const r = Math.random() * this.radius;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), this.mat);
    m.position.set(x, 8, z);
    m.userData.vy = -6 - Math.random() * 4;
    m.userData.life = 1.6;
    this.group.add(m);
    this.embers.push(m);
    sfx.emberHiss();
  }

  tick(dt, ctx) {
    this.t += dt;
    this.spawnT += dt;
    if (this.spawnT >= this.period) {
      this.spawnT = 0;
      for (let i = 0; i < this.count; i++) this.spawnEmber();
    }
    // Update embers; lethal sphere is a moving point along each.
    let hitAny = false;
    let hitCenter = null;
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.position.y += e.userData.vy * dt;
      e.userData.life -= dt;
      const worldPos = new THREE.Vector3();
      e.getWorldPosition(worldPos);
      if (worldPos.distanceTo(ctx.player) < 0.5) {
        hitAny = true; hitCenter = worldPos;
      }
      if (e.position.y <= 0 || e.userData.life <= 0) {
        this.group.remove(e);
        e.geometry.dispose();
        this.embers.splice(i, 1);
      }
    }
    this.lethalActive = hitAny;
    if (hitCenter) this.lethalCenter.copy(hitCenter);
    this.hitRadius = 0.5;
  }
}
