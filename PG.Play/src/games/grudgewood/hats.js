// Grudgewood — hats catalog. Each hat is a procedural Three.js Group
// attached to the player head bone. Unlock conditions are simple, evaluated
// against the save profile.

import * as THREE from 'three';

function leafCrown() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.05, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x3c5e22, roughness: 0.8, flatShading: true }),
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.18, 5),
      new THREE.MeshStandardMaterial({ color: 0x4f7a26, roughness: 0.7, flatShading: true }),
    );
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.34, 0.06, Math.sin(a) * 0.34);
    leaf.rotation.set(-Math.PI / 2 + 0.4, a, 0);
    g.add(leaf);
  }
  return g;
}

function lumberCap() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x8a1313, roughness: 0.7, flatShading: true }),
  );
  dome.scale.set(1, 0.6, 1);
  g.add(dome);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0x4a0808, roughness: 0.8, flatShading: true }),
  );
  brim.position.y = -0.02;
  brim.position.z = 0.1;
  g.add(brim);
  return g;
}

function mushroomCap() {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.6, flatShading: true }),
  );
  cap.scale.set(1, 0.8, 1);
  g.add(cap);
  // White spots.
  for (let i = 0; i < 5; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xfff8dd, flatShading: true }),
    );
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.32;
    dot.position.set(Math.cos(a) * r, 0.32 - r * 0.3, Math.sin(a) * r);
    g.add(dot);
  }
  return g;
}

function cone() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.6, 14, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.6, flatShading: true }),
  );
  c.position.y = 0.3;
  g.add(c);
  // White ring stripes via thin cylinders.
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.18 - i * 0.06, 0.02, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.18 + i * 0.18;
    g.add(ring);
  }
  return g;
}

function bucket() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.36, 0.4, 14),
    new THREE.MeshStandardMaterial({ color: 0xa8a8b0, metalness: 0.5, roughness: 0.5, flatShading: true }),
  );
  m.position.y = 0.22;
  g.add(m);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.02, 6, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x303035, metalness: 0.4, roughness: 0.6 }),
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.y = 0.42;
  g.add(handle);
  return g;
}

function topHat() {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.85, 18),
    new THREE.MeshStandardMaterial({ color: 0x100a14, roughness: 0.5, flatShading: true }),
  );
  cyl.position.y = 0.45;
  g.add(cyl);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.04, 18),
    new THREE.MeshStandardMaterial({ color: 0x100a14, roughness: 0.6, flatShading: true }),
  );
  brim.position.y = 0.04;
  g.add(brim);
  return g;
}

function twigHalo() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 6, 22),
    new THREE.MeshStandardMaterial({ color: 0x3a2410, emissive: 0x2a1808, roughness: 0.7, flatShading: true }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.42;
  g.add(ring);
  return g;
}

function picnicHat() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.18, 18),
    new THREE.MeshStandardMaterial({ color: 0xeee0b8, roughness: 0.8, flatShading: true }),
  );
  dome.position.y = 0.16;
  g.add(dome);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.03, 22),
    new THREE.MeshStandardMaterial({ color: 0xeee0b8, roughness: 0.85, flatShading: true }),
  );
  brim.position.y = 0.06;
  g.add(brim);
  // Red ribbon.
  const ribbon = new THREE.Mesh(
    new THREE.TorusGeometry(0.225, 0.03, 6, 18),
    new THREE.MeshStandardMaterial({ color: 0xb91414, flatShading: true }),
  );
  ribbon.rotation.x = Math.PI / 2;
  ribbon.position.y = 0.09;
  g.add(ribbon);
  return g;
}

function antlers() {
  const g = new THREE.Group();
  const branchMat = new THREE.MeshStandardMaterial({ color: 0xc8b48a, roughness: 0.9, flatShading: true });
  for (let s = -1; s <= 1; s += 2) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 6), branchMat);
    stem.position.set(s * 0.18, 0.32, 0);
    stem.rotation.z = -s * 0.3;
    g.add(stem);
    for (let i = 0; i < 2; i++) {
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 6), branchMat);
      fork.position.set(s * (0.28 + i * 0.05), 0.5 + i * 0.1, 0);
      fork.rotation.z = -s * (0.6 + i * 0.2);
      g.add(fork);
    }
  }
  return g;
}

function flameCrown() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.03, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x180000, roughness: 0.7 }),
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  const fmat = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5010, emissiveIntensity: 1.2, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 5), fmat);
    const a = (i / 7) * Math.PI * 2;
    f.position.set(Math.cos(a) * 0.32, 0.12 + Math.random() * 0.04, Math.sin(a) * 0.32);
    g.add(f);
  }
  return g;
}

function axeCirclet() {
  const g = new THREE.Group();
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.025, 6, 22),
    new THREE.MeshStandardMaterial({ color: 0x9aa6c8, metalness: 0.7, roughness: 0.3, flatShading: true }),
  );
  band.rotation.x = Math.PI / 2;
  g.add(band);
  // Tiny glowing axe motif.
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xddeeff, emissive: 0x4060a0, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }),
  );
  head.position.set(0, 0.14, 0.32);
  g.add(head);
  return g;
}

export const HATS = {
  'leaf-crown':   { name: 'Leaf Crown',     blurb: 'Standard issue. Free with the forest.', build: leafCrown },
  'lumber-cap':   { name: 'Lumber Cap',     blurb: 'Issued posthumously.', build: lumberCap },
  'mushroom-cap': { name: 'Mushroom Cap',   blurb: 'It pops back.', build: mushroomCap },
  'cone-of-shame':{ name: 'Cone of Shame',  blurb: 'You earned it. Possibly.', build: cone },
  'bucket':       { name: 'Lost Bucket',    blurb: 'Visibility: poor. Style: present.', build: bucket },
  'top-hat':      { name: 'Absurd Top Hat', blurb: 'Tall enough for the forest to notice.', build: topHat },
  'twig-halo':    { name: 'Cursed Twig Halo', blurb: 'A halo, but local.', build: twigHalo },
  'picnic':       { name: 'Broken Picnic',  blurb: 'There were sandwiches once.', build: picnicHat },
  'antlers':      { name: 'Antler Pair',    blurb: 'Found, not grown.', build: antlers },
  'flame-crown':  { name: 'Flame Crown',    blurb: 'Cooks the embers right back.', build: flameCrown },
  'axe-circlet':  { name: 'Axe Circlet',    blurb: 'Quiet. Old. Gifted only once.', build: axeCirclet },
};

// Unlock conditions evaluated against save profile (s).
// Each returns true if currently unlocked or earnable.
export const HAT_UNLOCK = {
  'leaf-crown':   () => true,
  'lumber-cap':   (s) => s.stats.deaths >= 5,
  'mushroom-cap': (s) => (s.stats.traps?.mushroom || 0) >= 3,
  'cone-of-shame':(s) => s.stats.deaths >= 25,
  'bucket':       (s) => !!s.secretsFound?.includes('bucket'),
  'top-hat':      (s) => s.furthestBiome === 'rotbog' || s.furthestBiome === 'cliffside' || s.furthestBiome === 'heart' || s.furthestBiome === 'sanctum',
  'twig-halo':    (s) => (s.stats.traps?.predator || 0) >= 3,
  'picnic':       (s) => !!s.secretsFound?.includes('picnic'),
  'antlers':      (s) => !!s.secretsFound?.includes('antlers'),
  'flame-crown':  (s) => s.furthestBiome === 'heart' || s.furthestBiome === 'sanctum',
  'axe-circlet':  (s) => !!s.axeUnlocked,
};

export const HAT_HINT = {
  'leaf-crown': 'Yours from the start.',
  'lumber-cap': 'Die five times. Forest pays its respects.',
  'mushroom-cap': 'Step on three mushroom traps across runs.',
  'cone-of-shame': 'Die twenty-five times. The forest insists.',
  'bucket': 'There is a bucket. Mosswake. Off the path. Look up.',
  'top-hat': 'Reach the Rotbog.',
  'twig-halo': 'Be killed by a predator tree three times.',
  'picnic': 'Hidden in the Trickster Grove. The forest set a table.',
  'antlers': 'Cliffside Pines, somewhere quiet.',
  'flame-crown': 'Reach the Heart.',
  'axe-circlet': 'Take the Axe.',
};
