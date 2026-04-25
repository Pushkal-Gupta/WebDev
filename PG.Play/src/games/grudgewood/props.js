// Grudgewood — procedural prop builders. All meshes from primitives.
// Returns Group objects so callers can position/scale freely.

import * as THREE from 'three';

const tmpQ = new THREE.Quaternion();

// Stylized low-poly tree. Trunk is a tapered cylinder, canopy is a few
// bunched icospheres. Bark/leaf colors come from biome.
export function makeTree(biome, scale = 1, variant = 0) {
  const g = new THREE.Group();
  const trunkH = 4 + Math.random() * 3;
  const trunkR = 0.35 + Math.random() * 0.25;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 7),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: biome.treeLeaf, roughness: 0.85, flatShading: true });
  const blobs = 2 + ((variant + 1) % 3);
  for (let i = 0; i < blobs; i++) {
    const r = 1.4 + Math.random() * 1.2;
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafMat);
    blob.position.set(
      (Math.random() - 0.5) * 1.6,
      trunkH + r * 0.4 + Math.random() * 1.2,
      (Math.random() - 0.5) * 1.6,
    );
    blob.castShadow = true;
    g.add(blob);
  }
  g.scale.setScalar(scale);
  g.userData.kind = 'tree';
  return g;
}

// Tall pine for cliffside biome — narrow conical canopy.
export function makePine(biome, scale = 1) {
  const g = new THREE.Group();
  const trunkH = 6 + Math.random() * 3;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.5, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: biome.treeLeaf, roughness: 0.85, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.2 - i * 0.5, 2.6, 7),
      leafMat,
    );
    cone.position.y = trunkH * 0.45 + i * 1.5;
    cone.castShadow = true;
    g.add(cone);
  }
  g.scale.setScalar(scale);
  g.userData.kind = 'pine';
  return g;
}

// Shrub — clumped icospheres at ground level. Filler.
export function makeShrub(biome, scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: biome.treeLeaf, roughness: 0.9, flatShading: true });
  const blobs = 2 + ((Math.random() * 2) | 0);
  for (let i = 0; i < blobs; i++) {
    const r = 0.4 + Math.random() * 0.5;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
    b.position.set((Math.random() - 0.5) * 1.0, r * 0.7, (Math.random() - 0.5) * 1.0);
    b.castShadow = true;
    g.add(b);
  }
  g.scale.setScalar(scale);
  g.userData.kind = 'shrub';
  return g;
}

// Rock — chunky icosahedron, slightly buried.
export function makeRock(biome, scale = 1) {
  const r = 0.6 + Math.random() * 0.8;
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, 0),
    new THREE.MeshStandardMaterial({ color: biome.rock, roughness: 0.9, flatShading: true }),
  );
  m.position.y = r * 0.5;
  m.rotation.set(Math.random(), Math.random() * 6, Math.random());
  m.castShadow = true;
  m.scale.setScalar(scale);
  m.userData.kind = 'rock';
  return m;
}

// Stump — looks like the perfect place to rest. (Some are bait.)
export function makeStump(biome, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.85, 0.9, 10),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  g.add(trunk);
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.05, 10),
    new THREE.MeshStandardMaterial({ color: biome.treeBark.clone().multiplyScalar(1.4), roughness: 0.9, flatShading: true }),
  );
  top.position.y = 0.93;
  g.add(top);
  g.scale.setScalar(scale);
  g.userData.kind = 'stump';
  return g;
}

// Mushroom — a cute cap that may or may not detonate.
export function makeMushroom(biome, capColor = '#c33', scale = 1) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: '#e6dfc7', roughness: 0.9, flatShading: true }),
  );
  stem.position.y = 0.3;
  stem.castShadow = true;
  g.add(stem);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.7, flatShading: true }),
  );
  cap.position.y = 0.6;
  cap.scale.set(1, 0.7, 1);
  cap.castShadow = true;
  g.add(cap);
  g.scale.setScalar(scale);
  g.userData.kind = 'mushroom';
  g.userData.cap = cap;
  return g;
}

// Sign — a wooden plank on a post, with a "text" plate. Used for sign-lie traps.
export function makeSign(biome, label = 'SAFE') {
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.4, 0.16),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  post.position.y = 0.7;
  post.castShadow = true;
  g.add(post);
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.6, 0.08),
    new THREE.MeshStandardMaterial({ color: '#8a6a3a', roughness: 0.9, flatShading: true }),
  );
  plank.position.y = 1.5;
  plank.castShadow = true;
  g.add(plank);

  // Text via canvas texture.
  const tex = makeTextTexture(label, '#2a1a08');
  const text = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.5),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  text.position.set(0, 1.5, 0.045);
  g.add(text);
  const textBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.5),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  textBack.position.set(0, 1.5, -0.045);
  textBack.rotation.y = Math.PI;
  g.add(textBack);

  g.userData.kind = 'sign';
  g.userData.label = label;
  return g;
}

// Checkpoint pylon — a glowing crystalline obelisk. State: dormant/active.
export function makeCheckpoint(biome) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: biome.rock, roughness: 0.9, flatShading: true }),
  );
  base.position.y = 0.2;
  base.castShadow = true;
  g.add(base);
  const obelisk = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 2.4, 6),
    new THREE.MeshStandardMaterial({
      color: biome.accent,
      emissive: biome.accent,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true,
    }),
  );
  obelisk.position.y = 1.6;
  obelisk.castShadow = true;
  g.add(obelisk);

  // Aura ring (wider, lit when active).
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.6, 24),
    new THREE.MeshBasicMaterial({ color: biome.accent, transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.02;
  g.add(aura);

  g.userData.kind = 'checkpoint';
  g.userData.obelisk = obelisk;
  g.userData.aura = aura;
  g.userData.activated = false;
  g.userData.activate = () => {
    if (g.userData.activated) return;
    g.userData.activated = true;
    obelisk.material.emissiveIntensity = 1.6;
    aura.material.opacity = 0.5;
  };

  return g;
}

// Log — long cylinder, used static or rolling.
export function makeLog(biome, length = 4, radius = 0.6) {
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 10),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  log.geometry.rotateZ(Math.PI / 2);
  log.castShadow = true;
  log.userData.kind = 'log';
  return log;
}

// Branch — a curved arm. We model it as a slightly-tapered cylinder pointing
// out from its origin. Used for branch-whip and predator-tree traps.
export function makeBranch(biome, length = 3, radius = 0.18) {
  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.5, radius, length, 7),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  branch.geometry.translate(0, length / 2, 0);
  branch.castShadow = true;
  branch.userData.kind = 'branch';
  return branch;
}

// Root — a thick arc that erupts from the ground.
export function makeRoot(biome, length = 1.6) {
  const root = new THREE.Mesh(
    new THREE.TorusGeometry(length, length * 0.18, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: biome.treeBark, roughness: 0.95, flatShading: true }),
  );
  root.castShadow = true;
  root.userData.kind = 'root';
  return root;
}

// Predator tree — a regular tree with a single visible glowing eye-mote.
// Used to telegraph hostility for the predator-tree trap.
export function makePredatorTree(biome) {
  const g = makeTree(biome, 1.3, 1);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({
      color: biome.accent, emissive: biome.accent, emissiveIntensity: 1.2, roughness: 0.3,
    }),
  );
  // Plant the eye somewhere up in the canopy.
  eye.position.set(0.2, 5.5, 0.6);
  g.add(eye);
  g.userData.kind = 'predator';
  g.userData.eye = eye;
  return g;
}

// 2D label texture for signs.
function makeTextTexture(text, color = '#000') {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 192;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 192);
  ctx.fillStyle = color;
  ctx.font = 'bold 110px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 100);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
