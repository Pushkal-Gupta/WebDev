// Cut the Rope — blower device. A static directional force-field
// rendered as a brushed-steel funnel + a faint additive cone.
// Calls `apply(point)` on every world point each step.

import * as THREE from 'three';

export function makeBlower(def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, 0);
  const angle = Math.atan2(def.dirY, def.dirX);
  group.rotation.z = angle;

  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x9aa7b3, roughness: 0.4, metalness: 0.6,
  });
  const nozzleGeo = new THREE.ConeGeometry(0.22, 0.5, 18);
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle.rotation.z = -Math.PI / 2;
  nozzle.position.x = -0.05;
  group.add(nozzle);

  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffe6b3, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const coneGeo = new THREE.PlaneGeometry(def.length, def.radius * 2);
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.x = def.length / 2;
  group.add(cone);

  const nx = Math.cos(angle), ny = Math.sin(angle);

  return {
    mesh: group,
    apply(point) {
      const px = point.x - def.x;
      const py = point.y - def.y;
      const t = px * nx + py * ny;
      if (t < 0 || t > def.length) return;
      const perpX = px - t * nx;
      const perpY = py - t * ny;
      const perp = Math.hypot(perpX, perpY);
      if (perp > def.radius) return;
      const fall = (1 - t / def.length) * (1 - perp / def.radius);
      point.forceX += nx * def.force * fall;
      point.forceY += ny * def.force * fall;
    },
    update() {
      coneMat.opacity = 0.16 + Math.sin(performance.now() / 220) * 0.04;
    },
    dispose() {
      nozzleGeo.dispose(); coneGeo.dispose();
      nozzleMat.dispose(); coneMat.dispose();
    },
  };
}
