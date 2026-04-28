// Cut the Rope — per-world diorama decor. Adds a few low-poly accents
// at z=-2.5 (between the gameplay plane at z=0 and the backdrop at
// z=-3.5) so each world reads as a distinct space. Pure procedural
// geometry; no textures.

import * as THREE from 'three';

const Z_DECOR = -2.5;

export function makeDecor(theme, palette) {
  const group = new THREE.Group();
  const disposables = [];

  const useMat = (mat) => { disposables.push(mat); return mat; };
  const useGeo = (geo) => { disposables.push(geo); return geo; };

  if (theme === 'sweet') {
    // Two shelf brackets + a shelf line.
    const shelfMat = useMat(new THREE.MeshStandardMaterial({
      color: palette.floor, roughness: 0.7, metalness: 0.05,
    }));
    const shelf = new THREE.Mesh(useGeo(new THREE.BoxGeometry(14, 0.18, 0.2)), shelfMat);
    shelf.position.set(0, 5.6, Z_DECOR);
    group.add(shelf);

    const bracketGeo = useGeo(new THREE.BoxGeometry(0.6, 0.6, 0.18));
    const bracketMat = useMat(new THREE.MeshStandardMaterial({
      color: palette.floorEdge, roughness: 0.6, metalness: 0.1,
    }));
    const bL = new THREE.Mesh(bracketGeo, bracketMat); bL.position.set(-4.8, 5.95, Z_DECOR);
    const bR = new THREE.Mesh(bracketGeo, bracketMat); bR.position.set( 4.8, 5.95, Z_DECOR);
    group.add(bL); group.add(bR);

    // Two pastel macaron silhouettes far back-left.
    const macMatA = useMat(new THREE.MeshStandardMaterial({ color: 0xffd6cc, roughness: 0.7 }));
    const macMatB = useMat(new THREE.MeshStandardMaterial({ color: 0xffe9b3, roughness: 0.7 }));
    const macGeo = useGeo(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24));
    const m1 = new THREE.Mesh(macGeo, macMatA); m1.position.set(-5.2, 5.0, Z_DECOR + 0.05); m1.rotation.z = Math.PI / 2;
    const m2 = new THREE.Mesh(macGeo, macMatB); m2.position.set(-5.2, 4.2, Z_DECOR + 0.05); m2.rotation.z = Math.PI / 2;
    group.add(m1); group.add(m2);
  }
  else if (theme === 'green') {
    // A potted fern silhouette far right + an arched window glow.
    const potMat = useMat(new THREE.MeshStandardMaterial({ color: palette.floorEdge, roughness: 0.8 }));
    const pot = new THREE.Mesh(useGeo(new THREE.CylinderGeometry(0.6, 0.7, 0.7, 16)), potMat);
    pot.position.set(5.0, 5.4, Z_DECOR);
    group.add(pot);

    const leafMat = useMat(new THREE.MeshStandardMaterial({ color: 0x6d9a5a, roughness: 0.6 }));
    const leafGeo = useGeo(new THREE.ConeGeometry(0.5, 1.4, 6, 1, true));
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(5.0, 4.4, Z_DECOR);
      leaf.rotation.z = (i - 2) * 0.4;
      leaf.scale.set(0.7, 1.0 + i * 0.05, 0.7);
      group.add(leaf);
    }

    // Soft arched window — a flat plane with a warm additive blend.
    const winMat = useMat(new THREE.MeshBasicMaterial({
      color: 0xfff0d6, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const win = new THREE.Mesh(useGeo(new THREE.CircleGeometry(2.0, 32, 0, Math.PI)), winMat);
    win.position.set(-3.5, 1.4, Z_DECOR + 0.1);
    win.rotation.z = Math.PI;
    group.add(win);
  }
  else if (theme === 'work') {
    // A pendant lamp + two gear silhouettes.
    const wireMat = useMat(new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }));
    const wire = new THREE.Mesh(useGeo(new THREE.BoxGeometry(0.04, 1.6, 0.04)), wireMat);
    wire.position.set(-3.4, 0.6, Z_DECOR);
    group.add(wire);

    const lampMat = useMat(new THREE.MeshStandardMaterial({
      color: 0xff7b3a, roughness: 0.5, metalness: 0.6,
      emissive: 0xff7b3a, emissiveIntensity: 0.7,
    }));
    const lamp = new THREE.Mesh(useGeo(new THREE.ConeGeometry(0.5, 0.8, 18)), lampMat);
    lamp.position.set(-3.4, 1.6, Z_DECOR + 0.05);
    group.add(lamp);

    // Soft warm halo plane below the lamp.
    const haloMat = useMat(new THREE.MeshBasicMaterial({
      color: 0xff9a4a, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const halo = new THREE.Mesh(useGeo(new THREE.CircleGeometry(2.4, 32)), haloMat);
    halo.position.set(-3.4, 2.4, Z_DECOR + 0.12);
    group.add(halo);

    // Two gear silhouettes far right.
    const gearMat = useMat(new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.8 }));
    const g1 = new THREE.Mesh(useGeo(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 12)), gearMat);
    g1.position.set(5.2, 4.8, Z_DECOR); g1.rotation.x = Math.PI / 2;
    const g2 = new THREE.Mesh(useGeo(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 10)), gearMat);
    g2.position.set(5.8, 3.6, Z_DECOR); g2.rotation.x = Math.PI / 2;
    group.add(g1); group.add(g2);
  }

  return {
    mesh: group,
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
