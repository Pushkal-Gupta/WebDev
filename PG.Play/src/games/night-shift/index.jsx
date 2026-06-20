// NIGHT SHIFT — stealth, now in real 3D (Three.js).
//
//  • You have three nights, three floors, each ending with a glowing exit door.
//  • Guards patrol a fixed path. Each sweeps a flashlight cone — enter it
//    standing and a detection meter fills. Fill it and the guard snaps to
//    alert, and you restart the current night.
//  • Hold Shift to tiptoe — 45 % slower, detection rate cut in half.
//  • Loot (gems on pedestals, paintings on the wall) is optional — walk
//    past a piece to lift it. The win card tallies the haul per night.
//  • No combat. No saves. Just read patrols, time the gap, walk.
//  • Controls: A/D or arrows to move. Shift to tiptoe. R to restart the
//    current night. Space (or the on-screen pad) also tiptoes for touch.
//
//  3D rewrite. The ENTIRE simulation is byte-for-byte the original: level
//  layout, thief movement, guard patrol AI, the cone detection math, loot
//  pickups, exit/win, lives/score, the submitScore call, and every sfx. Only
//  the presentation moved from a flat 2D canvas to a real Three.js scene.
//
//  Plane mapping (2.5D — the sim is a side-view museum corridor): the sim
//  runs on the same (x, y) plane it always did, in logical 840x460 px with a
//  floor line at FLOOR_Y. The renderer maps it onto the z = 0 play plane:
//      simX → +X,   simY → −Y   (sim y grows downward; three's +Y is up)
//  so entities stand UP in +Y above the floor. The physics never touches z,
//  so gravity-free horizontal movement, the cone-contains-player test, loot
//  proximity and the exit clamp keep their exact 2D meaning. Depth, walls,
//  display cases, shadows, the 3/4 angled camera and the real SpotLight
//  vision cones are pure decoration over the unchanged sim.
//
//  Visual language preserved: shadow is SAFE, light is DANGEROUS. Warm room
//  light pools fall on the floor; guard flashlights are real warm SpotLights
//  that snap red on alert. The scene is intentionally moody/dark — tuned so
//  the thief, loot and guards still read clearly.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';

// ── Sim constants — IDENTICAL to the original 2D game. Do not change. ──
const W = 840;
const H = 460;
const FLOOR_Y = 360;
const P_W = 18, P_H = 30;
const WALK_SPEED = 180;
const TIPTOE_SPEED = 100;
const DETECT_RATE_WALK = 2.4;     // full detection in ~0.42s when walking
const DETECT_RATE_TIPTOE = 1.1;   // ~0.91s when tiptoe — still dangerous up close
const DETECT_DECAY = 3.0;
const CONE_HALF_ANGLE = 0.42;     // ~24°
const CONE_RANGE = 210;
const ALERT_HOLD = 0.9;           // guard freezes + "!" before the night resets

const LEVELS = [
  {
    name: 'Reception',
    exit: W - 64,
    guards: [
      { x: 420, y: FLOOR_Y - P_H, minX: 260, maxX: 680, speed: 80, dir: 1 },
    ],
    props: [{ x: 150, y: FLOOR_Y - 28, w: 40, h: 28 }], // crate you can tuck behind (visual only)
    lamps: [150, 420, 690],
    frames: [ // wall decor only — not collectible
      { x: 88, y: 70, w: 54, h: 40 }, { x: 300, y: 62, w: 70, h: 52 }, { x: 640, y: 72, w: 48, h: 38 },
    ],
    shelf: { x: 470, w: 80 },
    loot: [
      { x: 240, kind: 'gem', value: 250 },
      { x: 560, y: 76, kind: 'painting', value: 400 },
    ],
  },
  {
    name: 'Second floor',
    exit: W - 64,
    guards: [
      { x: 260, y: FLOOR_Y - P_H, minX: 140, maxX: 420, speed: 110, dir: 1 },
      { x: 620, y: FLOOR_Y - P_H, minX: 480, maxX: 760, speed: 80, dir: -1 },
    ],
    props: [{ x: 440, y: FLOOR_Y - 34, w: 46, h: 34 }],
    lamps: [130, 400, 670],
    frames: [
      { x: 196, y: 66, w: 58, h: 44 }, { x: 560, y: 60, w: 76, h: 54 },
    ],
    shelf: { x: 300, w: 90 },
    loot: [
      { x: 100, y: 74, kind: 'painting', value: 350 },
      { x: 350, kind: 'gem', value: 200 },
      { x: 730, kind: 'gem', value: 300 },
    ],
  },
  {
    name: 'Penthouse',
    exit: W - 64,
    guards: [
      { x: 220, y: FLOOR_Y - P_H, minX: 120, maxX: 330, speed: 120, dir: 1 },
      { x: 480, y: FLOOR_Y - P_H, minX: 370, maxX: 580, speed: 90, dir: -1 },
      { x: 700, y: FLOOR_Y - P_H, minX: 610, maxX: 780, speed: 130, dir: 1 },
    ],
    props: [
      { x: 340, y: FLOOR_Y - 32, w: 32, h: 32 },
      { x: 590, y: FLOOR_Y - 32, w: 32, h: 32 },
    ],
    lamps: [120, 420, 700],
    frames: [
      { x: 60, y: 64, w: 64, h: 48 }, { x: 380, y: 58, w: 84, h: 58 }, { x: 690, y: 68, w: 52, h: 42 },
    ],
    shelf: { x: 180, w: 80 },
    loot: [
      { x: 280, y: 70, kind: 'painting', value: 500 },
      { x: 520, kind: 'gem', value: 250 },
      { x: 660, kind: 'gem', value: 250 },
    ],
  },
];

// Deterministic per-index jitter — keeps placements stable without state.
const hash01 = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ── 2.5D plane mapping. Sim (x, y) → three world (x, -y). Sim y grows
// downward (screen coords); three +Y is up, so we negate. The depth of the
// room is the +Z/−Z axis (decoration only — the sim never sees z). ──
const w2x = (x) => x;
const w2y = (y) => -y;
const ROOM_DEPTH = 220;   // how deep the corridor extends along +Z toward camera

// ----------------------------------------------------------------------
// Procedural textures (no external assets). Built once, shared.
// ----------------------------------------------------------------------
function makeFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#11192a';
  g.fillRect(0, 0, 128, 128);
  // parquet planks
  for (let y = 0; y < 128; y += 16) {
    const shift = ((y / 16) % 2) * 32;
    for (let x = -32; x < 160; x += 64) {
      g.fillStyle = ((x + y) / 16) % 2 < 1 ? '#16213a' : '#131c30';
      g.fillRect(x + shift, y, 62, 14);
    }
  }
  g.strokeStyle = 'rgba(160,190,255,0.05)';
  g.lineWidth = 1;
  for (let y = 0; y <= 128; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#0d1320';
  g.fillRect(0, 0, 128, 128);
  // wainscot panels
  g.strokeStyle = 'rgba(140,170,230,0.10)';
  g.lineWidth = 2;
  for (let x = 8; x < 128; x += 40) g.strokeRect(x, 30, 30, 80);
  g.fillStyle = 'rgba(140,170,230,0.07)';
  g.fillRect(0, 24, 128, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeArtTexture(hollow) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  if (hollow) {
    g.fillStyle = '#1a2336';
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(190,205,235,0.25)';
    g.setLineDash([5, 5]);
    g.lineWidth = 2;
    g.strokeRect(6, 6, 52, 52);
  } else {
    const grd = g.createLinearGradient(0, 0, 64, 64);
    grd.addColorStop(0, '#1c2a45');
    grd.addColorStop(0.55, '#2c3050');
    grd.addColorStop(1, '#15203a');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(200,215,255,0.16)';
    g.beginPath();
    g.moveTo(0, 64); g.lineTo(38, 30); g.lineTo(64, 64); g.closePath(); g.fill();
    g.beginPath();
    g.arc(50, 20, 5, 0, Math.PI * 2);
    g.fillStyle = 'rgba(230,238,255,0.5)'; g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Soft radial sprite for room-light floor pools & particles.
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// ----------------------------------------------------------------------
// Three.js renderer. Built once; rebuildLevel() builds static geometry from
// the SAME layout the sim uses. render() reads live sim state each frame.
// dispose() tears everything down.
// ----------------------------------------------------------------------
function makeRenderer3D(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060a12');
  scene.fog = new THREE.Fog('#060a12', 600, 1400);

  // Angled 3/4 top-down camera framing the corridor. Looks down −Z and −Y
  // at the play plane; high enough to read the whole layout.
  const camera = new THREE.PerspectiveCamera(42, W / H, 1, 4000);
  scene.add(camera);

  // ── Lighting. Dark base ambient so stealth reads; warm room pools and the
  // guard SpotLight cones do the lifting. A soft cool key keeps figures
  // legible without washing out the dark.
  const ambient = new THREE.AmbientLight(0x223047, 0.55);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x2a3a5a, 0x05080f, 0.5);
  scene.add(hemi);
  // Cool fill from the camera side so the thief/loot/guards are visible.
  const key = new THREE.DirectionalLight(0x9fc0ff, 0.45);
  key.position.set(-200, 500, 600);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 2000;
  key.shadow.camera.left = -560;
  key.shadow.camera.right = 560;
  key.shadow.camera.top = 200;
  key.shadow.camera.bottom = -520;
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(key.target);
  key.target.position.set(W / 2, w2y(FLOOR_Y), 0);
  key.target.updateMatrixWorld();

  // Shared textures.
  const floorTex = makeFloorTexture();
  floorTex.repeat.set(W / 128, ROOM_DEPTH / 128);
  const wallTex = makeWallTexture();
  wallTex.repeat.set(W / 256, 1);
  const glowTex = makeGlowTexture();

  // Persistent ground + back wall (level-independent geometry).
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: '#ffffff', roughness: 0.85, metalness: 0.08 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 200, ROOM_DEPTH + 80), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(W / 2, w2y(FLOOR_Y), ROOM_DEPTH / 2 - 40);
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: '#ffffff', roughness: 0.95, metalness: 0.02 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W + 200, 420), wallMat);
  backWall.position.set(W / 2, w2y(FLOOR_Y) + 210, -40);
  backWall.receiveShadow = true;
  scene.add(backWall);
  // ceiling band (dark cap, anchors the moody ceiling)
  const ceilMat = new THREE.MeshStandardMaterial({ color: '#070b14', roughness: 1 });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W + 200, ROOM_DEPTH + 80), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(W / 2, w2y(FLOOR_Y) + 420, ROOM_DEPTH / 2 - 40);
  scene.add(ceiling);

  // ── Per-level container + tracked resources for disposal.
  let levelGroup = new THREE.Group();
  scene.add(levelGroup);
  let levelMats = [];
  let levelGeos = [];

  // Records the render loop animates.
  let goalRec = null;             // { glowMat, light }
  const lampRecs = [];            // { light, poolMat, beamMat }
  const lootRecs = [];            // { group, kind, twinkleMat?, gemMesh? } parallel to s.loot
  const guardRecs = [];           // { group, spot, coneMat, capMat, exclaim, exclaimMat, torchMat }

  // ── Persistent thief rig — a sleek crouching figure.
  const thiefGroup = new THREE.Group();
  const thiefCloth = new THREE.MeshStandardMaterial({ color: '#222c4a', roughness: 0.7, metalness: 0.05 });
  const thiefSkin = new THREE.MeshStandardMaterial({ color: '#e8c49a', roughness: 0.6 });
  const beanieMat = new THREE.MeshStandardMaterial({ color: '#39415c', roughness: 0.8 });
  const limbMat = new THREE.MeshStandardMaterial({ color: '#151b2e', roughness: 0.8 });
  const sackMat = new THREE.MeshStandardMaterial({ color: '#4a3a22', roughness: 0.85 });
  // torso
  const tBody = new THREE.Mesh(new THREE.BoxGeometry(P_W, P_H - 13, 11), thiefCloth);
  tBody.position.set(0, (P_H - 13) / 2 + 6, 0);
  tBody.castShadow = true;
  thiefGroup.add(tBody);
  // head
  const tHead = new THREE.Mesh(new THREE.SphereGeometry(6.5, 16, 12), thiefSkin);
  tHead.position.set(0, P_H - 4, 1);
  tHead.castShadow = true;
  thiefGroup.add(tHead);
  // beanie cap (half sphere over the crown)
  const tBeanie = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), beanieMat);
  tBeanie.position.set(0, P_H - 2, 1);
  tBeanie.castShadow = true;
  thiefGroup.add(tBeanie);
  // loot sack on the back (scales with haul)
  const tSack = new THREE.Mesh(new THREE.SphereGeometry(5.5, 12, 10), sackMat);
  tSack.position.set(-8, P_H - 12, -5);
  tSack.castShadow = true;
  thiefGroup.add(tSack);
  // legs (animated)
  const tLegGeo = new THREE.BoxGeometry(4, 12, 5);
  const tLegL = new THREE.Mesh(tLegGeo, limbMat); tLegL.castShadow = true;
  const tLegR = new THREE.Mesh(tLegGeo, limbMat); tLegR.castShadow = true;
  tLegL.position.set(-3.5, 6, 0);
  tLegR.position.set(3.5, 6, 0);
  thiefGroup.add(tLegL); thiefGroup.add(tLegR);
  thiefGroup.position.z = 0;
  scene.add(thiefGroup);

  // ── Particle pool — instanced quads (sparkle / dust / alarm). No per-frame
  // allocation.
  const PART_N = 200;
  const partMat = new THREE.MeshBasicMaterial({
    map: glowTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true,
  });
  const partGeo = new THREE.PlaneGeometry(5, 5);
  const partMesh = new THREE.InstancedMesh(partGeo, partMat, PART_N);
  partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  partMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PART_N * 3), 3);
  partMesh.frustumCulled = false;
  scene.add(partMesh);

  // Reusable temps.
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _c = new THREE.Color();

  function disposeGroup(group) {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
    });
  }

  function clearLevel() {
    scene.remove(levelGroup);
    disposeGroup(levelGroup);
    levelMats.forEach((m) => {
      // material.dispose() does NOT free attached CanvasTextures (the
      // per-painting art maps) — free them explicitly to avoid a GPU leak
      // across level rebuilds.
      m.map?.dispose?.();
      m.dispose?.();
    });
    levelGeos.forEach((g) => g.dispose?.());
    levelMats = [];
    levelGeos = [];
    goalRec = null;
    lampRecs.length = 0;
    lootRecs.length = 0;
    guardRecs.length = 0;
    levelGroup = new THREE.Group();
    scene.add(levelGroup);
  }

  // ── Build the whole level scene from the SAME layout the sim uses. We only
  // read coords here; we never change them.
  function rebuildLevel(state) {
    clearLevel();
    camPrimed = false;
    const lv = state.lv;
    const fy = w2y(FLOOR_Y);

    // ── Ceiling lamp fixtures + warm room-light pools (PointLights + a
    // floor glow sprite + a translucent beam cone). "light pool" preserved.
    lv.lamps.forEach((lx) => {
      // warm point light hanging from the ceiling
      const light = new THREE.PointLight(0xffce8c, 0.9, 360, 1.6);
      light.position.set(lx, fy + 300, 20);
      light.castShadow = false;
      levelGroup.add(light);
      // lamp fixture (small cone shade + bulb)
      const shadeGeo = new THREE.ConeGeometry(12, 14, 8, 1, true);
      levelGeos.push(shadeGeo);
      const shadeMat = new THREE.MeshStandardMaterial({ color: '#222a3d', roughness: 0.8, side: THREE.DoubleSide });
      levelMats.push(shadeMat);
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(lx, fy + 308, 20);
      levelGroup.add(shade);
      const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffe2ae' });
      levelMats.push(bulbMat);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), bulbMat);
      levelGeos.push(bulb.geometry);
      bulb.position.set(lx, fy + 300, 20);
      levelGroup.add(bulb);
      // floor light pool — additive glow sprite lying on the floor
      const poolMat = new THREE.MeshBasicMaterial({
        map: glowTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color: '#ffce8c', opacity: 0.55,
      });
      levelMats.push(poolMat);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(200, 130), poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(lx, fy + 1.5, 30);
      levelGroup.add(pool);
      // soft volumetric beam cone (translucent, additive)
      const beamMat = new THREE.MeshBasicMaterial({
        color: '#ffba6e', transparent: true, opacity: 0.06,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      levelMats.push(beamMat);
      const beamGeo = new THREE.ConeGeometry(95, 300, 16, 1, true);
      levelGeos.push(beamGeo);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(lx, fy + 150, 24);
      levelGroup.add(beam);
      lampRecs.push({ light, poolMat, beamMat });
    });

    // ── Wall art frames (decor only).
    (lv.frames || []).forEach((f) => {
      const frameGeo = new THREE.BoxGeometry(f.w + 8, f.h + 8, 6);
      levelGeos.push(frameGeo);
      const goldMat = new THREE.MeshStandardMaterial({ color: '#6b5a32', roughness: 0.5, metalness: 0.5, emissive: '#1a1408', emissiveIntensity: 0.3 });
      levelMats.push(goldMat);
      const frame = new THREE.Mesh(frameGeo, goldMat);
      // wall y: sim f.y is from the top; place mid-frame on the back wall.
      frame.position.set(f.x + f.w / 2, w2y(f.y + f.h / 2), -34);
      frame.receiveShadow = true;
      levelGroup.add(frame);
      const artMat = new THREE.MeshStandardMaterial({ map: makeArtTexture(false), roughness: 0.7, emissive: '#0a1020', emissiveIntensity: 0.25 });
      levelMats.push(artMat);
      const artGeo = new THREE.PlaneGeometry(f.w, f.h);
      levelGeos.push(artGeo);
      const art = new THREE.Mesh(artGeo, artMat);
      art.position.set(f.x + f.w / 2, w2y(f.y + f.h / 2), -30.5);
      levelGroup.add(art);
    });

    // ── Shelf with little busts (decor).
    if (lv.shelf) {
      const s = lv.shelf;
      const sy = 132;
      const shelfGeo = new THREE.BoxGeometry(s.w, 5, 18);
      levelGeos.push(shelfGeo);
      const shelfMat = new THREE.MeshStandardMaterial({ color: '#2a3145', roughness: 0.8 });
      levelMats.push(shelfMat);
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(s.x + s.w / 2, w2y(sy), -24);
      shelf.castShadow = true; shelf.receiveShadow = true;
      levelGroup.add(shelf);
      const bustMat = new THREE.MeshStandardMaterial({ color: '#3d4a68', roughness: 0.6 });
      levelMats.push(bustMat);
      for (let i = 0; i < 3; i++) {
        const vx = s.x + 12 + i * (s.w - 24) / 2;
        const h = 12 + hash01(s.x + i) * 10;
        const bg = new THREE.CylinderGeometry(4, 5.5, h, 8);
        levelGeos.push(bg);
        const bust = new THREE.Mesh(bg, bustMat);
        bust.position.set(vx, w2y(sy) + 2.5 + h / 2, -24);
        bust.castShadow = true;
        levelGroup.add(bust);
      }
    }

    // ── Crates / props (real boxes, from the SAME coords).
    lv.props.forEach((pr) => {
      const depth = Math.max(20, pr.h);
      const geo = new THREE.BoxGeometry(pr.w, pr.h, depth);
      levelGeos.push(geo);
      const mat = new THREE.MeshStandardMaterial({ color: '#3a2c18', roughness: 0.85, metalness: 0.05 });
      levelMats.push(mat);
      const m = new THREE.Mesh(geo, mat);
      // sim prop top-left at (pr.x, pr.y); center it, stand it on the floor plane.
      m.position.set(pr.x + pr.w / 2, w2y(pr.y + pr.h / 2), depth / 2 - 4);
      m.castShadow = true; m.receiveShadow = true;
      levelGroup.add(m);
    });

    // ── Exit doorway — lit cool doorway (cool = safe).
    {
      const dx = lv.exit;
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#0a3a36', emissive: '#00fff5', emissiveIntensity: 0.5,
        roughness: 0.4, metalness: 0.3,
      });
      levelMats.push(frameMat);
      const jambGeo = new THREE.BoxGeometry(8, 72, 14);
      levelGeos.push(jambGeo);
      const left = new THREE.Mesh(jambGeo, frameMat);
      left.position.set(dx - 2, w2y(FLOOR_Y - 36), -10);
      const right = new THREE.Mesh(jambGeo, frameMat);
      right.position.set(dx + 34, w2y(FLOOR_Y - 36), -10);
      const lintelGeo = new THREE.BoxGeometry(44, 8, 14);
      levelGeos.push(lintelGeo);
      const lintel = new THREE.Mesh(lintelGeo, frameMat);
      lintel.position.set(dx + 16, w2y(FLOOR_Y - 72), -10);
      levelGroup.add(left); levelGroup.add(right); levelGroup.add(lintel);
      // glowing inner panel
      const panelMat = new THREE.MeshBasicMaterial({ color: '#00fff5', transparent: true, opacity: 0.5 });
      levelMats.push(panelMat);
      const panelGeo = new THREE.PlaneGeometry(30, 64);
      levelGeos.push(panelGeo);
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(dx + 16, w2y(FLOOR_Y - 32), -16);
      levelGroup.add(panel);
      // cool door light
      const dLight = new THREE.PointLight(0x00fff5, 0.7, 220, 2);
      dLight.position.set(dx + 16, w2y(FLOOR_Y - 36), 20);
      levelGroup.add(dLight);
      goalRec = { glowMat: panelMat, light: dLight };
    }

    // ── Loot — glinting 3D gems on pedestals / paintings on the wall.
    state.loot.forEach((o, i) => {
      const group = new THREE.Group();
      if (o.kind === 'painting') {
        // gilded frame on the wall, with art that vanishes when taken.
        const frameGeo = new THREE.BoxGeometry(54, 44, 6);
        levelGeos.push(frameGeo);
        const goldMat = new THREE.MeshStandardMaterial({ color: '#caa84a', roughness: 0.4, metalness: 0.6, emissive: '#2a2008', emissiveIntensity: 0.4 });
        levelMats.push(goldMat);
        const frame = new THREE.Mesh(frameGeo, goldMat);
        frame.position.set(o.x, w2y(o.y + 18), -34);
        group.add(frame);
        const artMat = new THREE.MeshStandardMaterial({ map: makeArtTexture(false), roughness: 0.6, emissive: '#101830', emissiveIntensity: 0.3 });
        levelMats.push(artMat);
        const artGeo = new THREE.PlaneGeometry(44, 36);
        levelGeos.push(artGeo);
        const art = new THREE.Mesh(artGeo, artMat);
        art.position.set(o.x, w2y(o.y + 18), -30.5);
        group.add(art);
        levelGroup.add(group);
        lootRecs[i] = { group, kind: 'painting', art, artMat };
      } else {
        // pedestal + floating gem
        const pedGeo = new THREE.CylinderGeometry(11, 13, 24, 12);
        levelGeos.push(pedGeo);
        const pedMat = new THREE.MeshStandardMaterial({ color: '#2c3650', roughness: 0.7, metalness: 0.1 });
        levelMats.push(pedMat);
        const ped = new THREE.Mesh(pedGeo, pedMat);
        ped.position.set(o.x, w2y(FLOOR_Y - 12), 30);
        ped.castShadow = true; ped.receiveShadow = true;
        group.add(ped);
        const gemGeo = new THREE.OctahedronGeometry(8, 0);
        levelGeos.push(gemGeo);
        const gemMat = new THREE.MeshStandardMaterial({
          color: '#37e0c0', emissive: '#1fa890', emissiveIntensity: 0.6,
          roughness: 0.15, metalness: 0.4, flatShading: true,
        });
        levelMats.push(gemMat);
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(o.x, w2y(FLOOR_Y - 36), 30);
        gem.castShadow = true;
        group.add(gem);
        // gem glow light
        const gLight = new THREE.PointLight(0x37e0c0, 0.35, 90, 2);
        gLight.position.set(o.x, w2y(FLOOR_Y - 36), 36);
        group.add(gLight);
        levelGroup.add(group);
        lootRecs[i] = { group, kind: 'gem', gemMesh: gem, gemMat, gLight, baseY: w2y(FLOOR_Y - 36) };
      }
    });

    // ── Guards — real 3D figures with a head + flashlight + a real cone of
    // light (SpotLight) plus a translucent cone mesh for the visible beam.
    state.guards.forEach((g, i) => {
      const group = new THREE.Group();
      // torso (navy uniform)
      const torsoMat = new THREE.MeshStandardMaterial({ color: '#2d3c5e', roughness: 0.7 });
      levelMats.push(torsoMat);
      const torso = new THREE.Mesh(new THREE.BoxGeometry(P_W, P_H - 13, 12), torsoMat);
      levelGeos.push(torso.geometry);
      torso.position.set(0, (P_H - 13) / 2 + 6, 0);
      torso.castShadow = true;
      group.add(torso);
      // belt
      const beltMat = new THREE.MeshStandardMaterial({ color: '#161e2e', roughness: 0.6 });
      levelMats.push(beltMat);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(P_W + 1, 4, 13), beltMat);
      levelGeos.push(belt.geometry);
      belt.position.set(0, 9, 0);
      group.add(belt);
      // head
      const head = new THREE.Mesh(new THREE.SphereGeometry(6.5, 16, 12), new THREE.MeshStandardMaterial({ color: '#ffd1a6', roughness: 0.6 }));
      levelMats.push(head.material); levelGeos.push(head.geometry);
      head.position.set(0, P_H - 4, 1);
      head.castShadow = true;
      group.add(head);
      // cap (color flips red on alert)
      const capMat = new THREE.MeshStandardMaterial({ color: '#1b2534', roughness: 0.7 });
      levelMats.push(capMat);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 5, 10), capMat);
      levelGeos.push(cap.geometry);
      cap.position.set(0, P_H + 1, 1);
      group.add(cap);
      // legs
      const gLegGeo = new THREE.BoxGeometry(4, 12, 5);
      levelGeos.push(gLegGeo);
      const gLegMat = new THREE.MeshStandardMaterial({ color: '#1c2638', roughness: 0.8 });
      levelMats.push(gLegMat);
      const gLegL = new THREE.Mesh(gLegGeo, gLegMat); gLegL.castShadow = true;
      const gLegR = new THREE.Mesh(gLegGeo, gLegMat); gLegR.castShadow = true;
      gLegL.position.set(-3.5, 6, 0);
      gLegR.position.set(3.5, 6, 0);
      group.add(gLegL); group.add(gLegR);
      // torch (flashlight) — emissive cylinder held forward
      const torchMat = new THREE.MeshStandardMaterial({ color: '#11151f', emissive: '#ffe4a4', emissiveIntensity: 0.8, roughness: 0.4 });
      levelMats.push(torchMat);
      const torch = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 8, 8), torchMat);
      levelGeos.push(torch.geometry);
      torch.rotation.z = Math.PI / 2;
      torch.position.set(10, P_H - 8, 8);
      group.add(torch);

      // Real vision SpotLight — the danger cone. Angle/range matched to the
      // sim's CONE_HALF_ANGLE / CONE_RANGE so the light reads as the hitbox.
      const spot = new THREE.SpotLight(0xffe4a4, 6.0, CONE_RANGE * 1.05, CONE_HALF_ANGLE, 0.45, 1.4);
      spot.position.set(10, P_H - 8, 8);
      spot.castShadow = false;
      group.add(spot);
      group.add(spot.target);

      // Translucent visible beam cone mesh (additive) for the volumetric look.
      const coneMat = new THREE.MeshBasicMaterial({
        color: '#ffe4a4', transparent: true, opacity: 0.18,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      levelMats.push(coneMat);
      // cone of radius = range*tan(halfAngle), height = range; built along +X
      const coneR = CONE_RANGE * Math.tan(CONE_HALF_ANGLE);
      const coneGeo = new THREE.ConeGeometry(coneR, CONE_RANGE, 18, 1, true);
      levelGeos.push(coneGeo);
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      // ConeGeometry points +Y by default; rotate so it opens along +X, apex
      // at the torch. Pivot the cone group so apex sits at torch.
      const coneGroup = new THREE.Group();
      coneMesh.rotation.z = -Math.PI / 2;   // tip toward +X
      coneMesh.position.x = CONE_RANGE / 2;  // shift so apex at origin
      coneGroup.add(coneMesh);
      coneGroup.position.set(10, P_H - 8, 8);
      group.add(coneGroup);

      // "!" exclaim sprite above head (alert pop).
      const exclaimMat = new THREE.MeshBasicMaterial({ color: '#ff4d6d', transparent: true, opacity: 0, depthTest: false });
      levelMats.push(exclaimMat);
      const exclaim = new THREE.Mesh(new THREE.PlaneGeometry(8, 16), exclaimMat);
      levelGeos.push(exclaim.geometry);
      exclaim.position.set(0, P_H + 16, 4);
      group.add(exclaim);

      levelGroup.add(group);
      guardRecs[i] = { group, spot, coneGroup, coneMesh, coneMat, capMat, head, exclaim, exclaimMat, torch };
      void g;
    });
  }

  // ── Manual sizing (NOT sizeCanvasFluid).
  let camPrimed = false;
  function resize(cssW, cssH) {
    const w = Math.max(1, cssW), h = Math.max(1, cssH);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Camera distance to fit W sim-px across, matching the original framing.
  function camDistanceForSpan(spanX) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.4, camera.aspect));
    return (spanX / 2) / Math.tan(hHalf);
  }

  // ── Per-frame render. Reads sim state; never mutates it.
  function render(state, rawDt) {
    if (!state) return;
    const t = performance.now() / 1000;
    const p = state.player;
    const alert = !!state.alert;

    // Camera: angled 3/4 framing of the whole corridor, gently following the
    // thief horizontally so it reads the layout. Sit back and above.
    const dist = camDistanceForSpan(W * 1.02);
    const centerX = THREE.MathUtils.clamp(p.x + P_W / 2, W * 0.34, W * 0.66);
    const targetX = w2x(centerX);
    const targetY = w2y(FLOOR_Y) + 70;
    const camTX = targetX;
    const camTY = targetY + dist * 0.42;       // raise for the top-down tilt
    const camTZ = dist * 0.92;
    if (!camPrimed) {
      camera.position.set(camTX, camTY, camTZ);
      camPrimed = true;
    } else {
      const k = Math.min(1, rawDt * 6);
      camera.position.x += (camTX - camera.position.x) * k;
      camera.position.y += (camTY - camera.position.y) * k;
      camera.position.z += (camTZ - camera.position.z) * k;
    }
    camera.lookAt(targetX, w2y(FLOOR_Y) + 60, 0);

    // ── Room lamp pools flicker (matches the 2D flicker).
    lampRecs.forEach((rec, li) => {
      const flick = 1 + 0.04 * Math.sin(t * 7.3 + li * 9.1) * Math.sin(t * 1.7 + li);
      rec.light.intensity = 0.9 * flick;
      rec.poolMat.opacity = 0.55 * flick;
      rec.beamMat.opacity = 0.06 * flick;
    });

    // ── Exit door glow pulse.
    if (goalRec) {
      const dg = 0.55 + 0.25 * Math.sin(t * 3.6);
      goalRec.glowMat.opacity = dg;
      goalRec.light.intensity = 0.5 + 0.4 * dg;
    }

    // ── Loot — float/spin gems, hide taken, paintings vanish when taken.
    for (let i = 0; i < lootRecs.length; i++) {
      const o = state.loot[i];
      const rec = lootRecs[i];
      if (!rec || !o) continue;
      if (rec.kind === 'gem') {
        rec.gemMesh.visible = !o.taken;
        rec.gLight.visible = !o.taken;
        if (!o.taken) {
          rec.gemMesh.position.y = rec.baseY + Math.sin(t * 2.2 + i * 2.1) * 2;
          rec.gemMesh.rotation.y = t * 1.5 + i;
          rec.gemMat.emissiveIntensity = 0.5 + 0.25 * Math.abs(Math.sin(t * 1.8 + i));
        }
      } else {
        // painting taken → leave the empty hollow frame look (art hidden).
        rec.art.visible = !o.taken;
      }
    }

    // ── Guards — position + facing + cone aim + alert state.
    for (let i = 0; i < guardRecs.length; i++) {
      const g = state.guards[i];
      const rec = guardRecs[i];
      if (!g || !rec) continue;
      const bob = Math.sin(g.phase) * 1.2;
      // stand the figure on the floor: sim guard top-left (g.x, g.y), feet at FLOOR_Y.
      rec.group.position.set(g.x + P_W / 2, w2y(FLOOR_Y), 0);
      rec.group.position.y += bob * 0.5;
      // facing — flip the whole rig by g.dir.
      rec.group.scale.x = g.dir >= 0 ? 1 : -1;
      // cone aim — the SAME aim wobble the 2D version used (visual only).
      const aimWobble = Math.sin(g.phase * 0.8) * 0.05;
      rec.coneGroup.rotation.z = aimWobble;
      rec.spot.position.set(10, P_H - 8, 8);
      rec.spot.target.position.set(10 + CONE_RANGE * Math.cos(aimWobble), P_H - 8 + CONE_RANGE * Math.sin(aimWobble), 8);
      rec.spot.target.updateMatrixWorld();
      // alert colors: warm → red.
      const coneCol = alert ? '#ff5060' : '#ffe4a4';
      rec.coneMat.color.set(coneCol);
      rec.coneMat.opacity = alert ? 0.30 : 0.18;
      rec.spot.color.set(coneCol);
      rec.spot.intensity = alert ? 8 : 6;
      rec.capMat.color.set(alert ? '#5e1b28' : '#1b2534');
      rec.torch.material.emissive.set(coneCol);
      // "!" pop above head when fully spotted.
      if (alert && g.alertPop > 0) {
        const kk = Math.min(1, g.alertPop / 0.22);
        const e = 1 - Math.pow(1 - kk, 3);
        rec.exclaimMat.opacity = e;
        rec.exclaim.scale.setScalar(0.6 + e * (0.6 + 0.4 * Math.sin(kk * Math.PI)));
      } else {
        rec.exclaimMat.opacity = 0;
      }
    }

    // ── Thief rig — position, facing, crouch, leg stride, sack swell.
    thiefGroup.position.set(w2x(p.x + P_W / 2), w2y(FLOOR_Y), 0);
    thiefGroup.scale.x = p.facing >= 0 ? 1 : -1;
    // crouch when sneaking: scale the body down a touch + lower head.
    const crouch = p.sneak ? 0.82 : 1;
    tBody.scale.y = crouch;
    tBody.position.y = ((P_H - 13) / 2 + 6) * crouch;
    tHead.position.y = (P_H - 4) * crouch;
    tBeanie.position.y = (P_H - 2) * crouch;
    tSack.position.y = (P_H - 12) * crouch;
    // sack swells with the haul.
    const sackScale = 1 + Math.min(0.9, (state.lootCount || 0) * 0.28);
    tSack.scale.setScalar(sackScale);
    // leg stride.
    const stride = p.moving ? Math.sin(p.stride * Math.PI * 2) * (p.sneak ? 0.5 : 0.9) : 0;
    tLegL.rotation.x = stride;
    tLegR.rotation.x = -stride;

    // ── Particles (sparkle on grab, dust on step, red alarm flash on spot).
    let pi = 0;
    for (const q of state.parts) {
      if (pi >= PART_N) break;
      const a = Math.max(0, 1 - q.t / 0.6);
      _p.set(w2x(q.x), w2y(q.y), 18);
      _q.identity();
      const sz = 0.4 + a * 1.1;
      _s.set(sz, sz, sz);
      _m.compose(_p, _q, _s);
      partMesh.setMatrixAt(pi, _m);
      _c.set(q.hue || '#ffd86e');
      partMesh.setColorAt(pi, _c);
      pi++;
    }
    for (let k = pi; k < PART_N; k++) {
      _m.makeScale(0, 0, 0);
      partMesh.setMatrixAt(k, _m);
    }
    partMesh.count = PART_N;
    partMesh.instanceMatrix.needsUpdate = true;
    if (partMesh.instanceColor) partMesh.instanceColor.needsUpdate = true;

    // ── Detection / alarm tint via exposure + ambient (visual only). Red
    // pressure when seen, hard red flash when caught.
    const hb = state.heartPulse * Math.min(1, state.detect + (alert ? 1 : 0));
    const caughtFlash = Math.max(0, state.caughtFlash);
    const exitFlash = Math.max(0, state.exitFlash);
    if (caughtFlash > 0) {
      ambient.color.set('#ff2d3d');
      ambient.intensity = 0.55 + caughtFlash * 1.4;
    } else if (exitFlash > 0) {
      ambient.color.set('#00fff5');
      ambient.intensity = 0.55 + exitFlash * 0.8;
    } else {
      ambient.color.set('#223047');
      ambient.intensity = 0.55 + hb * 0.25;
    }
    renderer.toneMappingExposure = 1.3 + hb * 0.12;

    renderer.render(scene, camera);
  }

  function dispose() {
    clearLevel();
    scene.remove(levelGroup);
    // persistent meshes
    thiefGroup.traverse((o) => { o.geometry?.dispose?.(); });
    [thiefCloth, thiefSkin, beanieMat, limbMat, sackMat].forEach((m) => m.dispose?.());
    floor.geometry.dispose(); floorMat.dispose();
    backWall.geometry.dispose(); wallMat.dispose();
    ceiling.geometry.dispose(); ceilMat.dispose();
    floorTex.dispose(); wallTex.dispose(); glowTex.dispose();
    partGeo.dispose(); partMat.dispose();
    renderer.dispose();
  }

  return { scene, camera, renderer, rebuildLevel, render, resize, dispose };
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function NightShiftGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef  = useRef(null);
  const rendererRef = useRef(null);
  const submittedRef = useRef(false);
  const lootBankRef = useRef(0);      // value from completed nights
  const lootLogRef = useRef([]);      // ["2/2", ...] per finished night
  const [level, setLevel]     = useState(() => {
    const adminStart = consumeAdminStartLevel('bob');
    return adminStart != null ? Math.max(0, Math.min(2, adminStart)) : 0;
  });
  const [caught, setCaught]   = useState(0);
  const [time, setTime]       = useState(0);
  const [lootHud, setLootHud] = useState(0);
  const [status, setStatus]   = useState('playing'); // playing | won

  const loadLevel = (idx) => {
    const lv = LEVELS[idx];
    stateRef.current = {
      lv,
      player: { x: 40, y: FLOOR_Y - P_H, facing: 1, stride: 0, moving: false, sneak: false },
      guards: lv.guards.map((g) => ({ ...g, phase: Math.random() * Math.PI * 2, alertPop: 0 })),
      loot: lv.loot.map((o) => ({ ...o, taken: false })),
      lootVal: 0,
      lootCount: 0,
      detect: 0,
      sightPop: 0,        // "?" pop timer — restarts each time sight is regained
      sighted: false,
      alert: null,        // { t } while a guard has fully spotted you
      heartT: 0,          // countdown to next heartbeat
      heartPulse: 0,      // 1 on beat, decays — drives the vignette
      floats: [],         // { x, y, txt, t }
      parts: [],          // sparkle particles { x, y, vx, vy, t, hue }
      elapsed: 0,
      caughtFlash: 0,
      exitFlash: 0,
    };
    setLootHud(lootBankRef.current);
    // Rebuild the 3D scene for this level (if the renderer is up).
    if (rendererRef.current) rendererRef.current.rebuildLevel(stateRef.current);
  };

  useEffect(() => {
    loadLevel(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // ── Build the WebGL renderer. WebGL can be unavailable (old GPU, blocked
    // context); fail loud in DEV but don't crash the host page.
    let renderer = null;
    try { renderer = makeRenderer3D(canvas); }
    catch (err) { renderer = null; if (import.meta.env.DEV) console.error('[night-shift] WebGL init failed', err); }
    rendererRef.current = renderer;
    // The level was loaded before the renderer existed — build its scene now.
    if (renderer && stateRef.current) renderer.rebuildLevel(stateRef.current);

    if (import.meta.env.DEV && renderer) {
      window.__bob3d = { scene: renderer.scene, camera: renderer.camera, renderer: renderer.renderer };
    }

    // ── Manual fluid sizing (NOT sizeCanvasFluid — it grabs a 2D context,
    // locking the canvas out of WebGL). ResizeObserver + orientationchange.
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const sizeCanvas = () => {
      const cssW = Math.max(320, Math.floor(wrap.clientWidth));
      const cssH = Math.max(180, Math.floor(wrap.clientHeight));
      renderer?.resize(cssW, cssH);
    };
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);
    const onOrient = () => sizeCanvas();
    window.addEventListener('orientationchange', onOrient);

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') {
        submittedRef.current = false;
        loadLevel(level);
      }
    };
    const ku = (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay flags — flipped by the pill buttons rendered in JSX below.
    const touchKeys = { left: false, right: false, tiptoe: false };
    wrap._setTouch = (id, v) => {
      if (id === 'left')   touchKeys.left   = v;
      if (id === 'right')  touchKeys.right  = v;
      if (id === 'tiptoe') touchKeys.tiptoe = v;
    };

    // ── Sim: cone-contains-player — IDENTICAL math to the 2D original.
    const coneContainsPlayer = (g, px, py) => {
      const dx = px - g.x;
      const dy = py - g.y;
      const d = Math.hypot(dx, dy);
      if (d > CONE_RANGE || d < 4) return false;
      const dir = g.dir >= 0 ? 0 : Math.PI;
      const ang = Math.atan2(dy, dx);
      let delta = ang - dir;
      while (delta >  Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      return Math.abs(delta) < CONE_HALF_ANGLE;
    };

    const caughtReset = () => {
      setCaught((c) => c + 1);
      setStatus('playing');
      loadLevel(level);
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s || status !== 'playing') return;

      const p = s.player;
      const left  = keys['a'] || keys['arrowleft']  || keys['keya'] || touchKeys.left;
      const right = keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.right;
      const sneak = keys['shift'] || keys['shiftleft'] || keys['shiftright'] || keys[' '] || keys['space'] || touchKeys.tiptoe;

      p.sneak = !!sneak;
      s.lootCount = s.loot.filter((o) => o.taken).length;

      // ── alert phase: the moment of being caught is a beat, not a cut.
      if (s.alert) {
        s.alert.t += dt;
        s.guards.forEach((g) => { g.alertPop += dt; });
        if (s.alert.t >= ALERT_HOLD && !s.alert.flashed) {
          s.alert.flashed = true;
          s.caughtFlash = 1.0;
          sfx.lose();
        }
        if (s.alert.t >= ALERT_HOLD + 0.3) {
          caughtReset();
          return;
        }
      } else {
        const speed = sneak ? TIPTOE_SPEED : WALK_SPEED;
        let dx = 0;
        if (left) dx -= 1;
        if (right) dx += 1;
        p.x += dx * speed * dt;
        if (dx !== 0) p.facing = dx;
        p.moving = dx !== 0;

        // Footstep cadence — stride drives both the leg swing and the sfx.
        if (p.moving) {
          const prev = p.stride;
          p.stride += speed * dt * (sneak ? 0.011 : 0.009);
          if (Math.floor(p.stride * 2) !== Math.floor(prev * 2)) {
            sfx.nightStep(sneak);
            // footstep dust puff (visual only).
            for (let i = 0; i < 3; i++) {
              s.parts.push({
                x: p.x + P_W / 2 + (hash01(p.stride + i) - 0.5) * 10,
                y: FLOOR_Y - 2,
                vx: (hash01(i + p.x) - 0.5) * 30, vy: -10 - hash01(i) * 20,
                t: 0, hue: '#5a6478',
              });
            }
          }
        }

        // Clamp to world
        p.x = Math.max(8, Math.min(W - P_W - 8, p.x));

        // Guards patrol
        s.guards.forEach((g) => {
          g.x += g.dir * g.speed * dt;
          g.phase += g.speed * dt * 0.09;
          if (g.x < g.minX) { g.x = g.minX; g.dir = 1; }
          if (g.x > g.maxX) { g.x = g.maxX; g.dir = -1; }
        });
      }

      // Detection
      const px = p.x + P_W / 2;
      const py = p.y + P_H / 2;
      let spotter = -1;
      s.guards.forEach((g, i) => {
        if (spotter < 0 && coneContainsPlayer(g, px, py)) spotter = i;
      });
      const anySight = spotter >= 0;
      if (!s.alert) {
        if (anySight) {
          if (!s.sighted) s.sightPop = 0;       // restart the "?" pop
          s.sighted = true;
          s.sightPop += dt;
          s.detect += (sneak ? DETECT_RATE_TIPTOE : DETECT_RATE_WALK) * dt;
        } else {
          s.sighted = false;
          s.detect = Math.max(0, s.detect - DETECT_DECAY * dt);
        }

        if (s.detect >= 1) {
          s.detect = 1;
          s.alert = { t: 0, flashed: false };
          s.guards.forEach((g) => {
            g.dir = px > g.x + P_W / 2 ? 1 : -1;  // everyone snaps toward you
            g.alertPop = 0;
          });
          sfx.nightAlert();
          // alarm burst — red sparks from the player (visual only).
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const v = 60 + hash01(i) * 70;
            s.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, hue: '#ff3a52' });
          }
        }
      }

      // Heartbeat — rate climbs with detection; each beat fires the sfx
      // and kicks the vignette pulse.
      const tension = s.alert ? 1 : Math.min(1, s.detect);
      if (tension > 0.12) {
        s.heartT -= dt;
        if (s.heartT <= 0) {
          s.heartT = 1.0 - tension * 0.62;
          s.heartPulse = 1;
          sfx.nightHeart(tension);
        }
      } else {
        s.heartT = 0;
      }
      s.heartPulse = Math.max(0, s.heartPulse - dt * 4.5);

      // Loot pickup — walk past a piece to lift it.
      if (!s.alert) {
        s.loot.forEach((o) => {
          if (o.taken || Math.abs(px - o.x) > 16) return;
          o.taken = true;
          s.lootVal += o.value;
          setLootHud(lootBankRef.current + s.lootVal);
          const fy = o.kind === 'painting' ? o.y + 16 : FLOOR_Y - 40;
          s.floats.push({ x: o.x, y: fy, txt: `+$${o.value}`, t: 0 });
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const v = 40 + hash01(i + o.x) * 60;
            s.parts.push({
              x: o.x, y: fy,
              vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
              t: 0,
              hue: o.kind === 'gem' ? '#8ff5e2' : '#ffd86e',
            });
          }
          sfx.nightCollect();
        });
      }

      // FX decay
      s.floats.forEach((f) => { f.t += dt; });
      s.floats = s.floats.filter((f) => f.t < 1.1);
      s.parts.forEach((q) => {
        q.t += dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 130 * dt;
      });
      s.parts = s.parts.filter((q) => q.t < 0.6);

      // Exit
      if (!s.alert && p.x + P_W >= s.lv.exit) {
        s.exitFlash = 0.4;
        lootBankRef.current += s.lootVal;
        lootLogRef.current.push(`${s.loot.filter((o) => o.taken).length}/${s.loot.length}`);
        setLootHud(lootBankRef.current);
        if (level + 1 >= LEVELS.length) {
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1800 - caught * 120 - s.elapsed * 2 + lootBankRef.current));
            submitScore('bob', score, { caught, time: Math.round(s.elapsed), level: level + 1, loot: lootBankRef.current });
          }
          sfx.nightClear();
          setTimeout(() => sfx.win(), 260);
          setStatus('won');
        } else {
          sfx.nightClear();
          setLevel((l) => l + 1);
          return;
        }
      }

      if (s.caughtFlash > 0) s.caughtFlash -= dt * 1.8;
      if (s.exitFlash > 0) s.exitFlash -= dt * 1.6;
      s.elapsed += dt;
      if ((s.elapsed * 2 | 0) !== (s._hud | 0)) {
        s._hud = s.elapsed * 2;
        setTime(Math.round(s.elapsed));
      }

      renderer?.render(s, dt);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      try { ro.disconnect(); } catch { /* ignore */ }
      window.removeEventListener('orientationchange', onOrient);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      try { renderer?.dispose(); } catch { /* ignore */ }
      if (rendererRef.current === renderer) rendererRef.current = null;
      if (import.meta.env.DEV && renderer) { try { delete window.__bob3d; } catch { /* ignore */ } }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, status]);

  const restart = () => {
    submittedRef.current = false;
    lootBankRef.current = 0;
    lootLogRef.current = [];
    setCaught(0);
    setTime(0);
    setLootHud(0);
    setLevel(0);
    setStatus('playing');
  };

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const setTouch = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div className="nightshift" style={{ width: '100%', height: '100%' }}>
      <div className="nightshift-bar">
        <span>Night <b style={{color:'var(--accent)'}}>{Math.min(LEVELS.length, level + 1)}</b>/{LEVELS.length}</span>
        <span>{LEVELS[level]?.name}</span>
        <span>Caught <b>{caught}</b></span>
        <span>Time <b>{time}s</b></span>
        <span>Loot <b style={{color:'#ffd86e'}}>${lootHud}</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', maxWidth: 'none', position: 'relative' }}>
        <canvas ref={canvasRef} className="nightshift-canvas"/>
        {isTouch && (
          <>
            <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', gap: 10, zIndex: 5 }}>
              <PillBtn label="←" onDown={() => setTouch('left', true)}  onUp={() => setTouch('left', false)} />
              <PillBtn label="→" onDown={() => setTouch('right', true)} onUp={() => setTouch('right', false)} />
            </div>
            <div style={{ position: 'absolute', bottom: 18, right: 18, zIndex: 5 }}>
              <PillBtn label="TIPTOE" wide onDown={() => setTouch('tiptoe', true)} onUp={() => setTouch('tiptoe', false)} />
            </div>
          </>
        )}
      </div>
      {status === 'won' ? (
        <div className="nightshift-tip" style={{color:'var(--accent)', fontWeight:700}}>
          Clean out · {caught} caught · {time}s · <span style={{color:'#ffd86e'}}>${lootHud} lifted</span>
          {lootLogRef.current.length > 0 && (
            <span style={{color:'var(--text-mute)', fontWeight:400}}>
              {' '}— {lootLogRef.current.map((l, i) => `N${i + 1} ${l}`).join(' · ')}
            </span>
          )}
        </div>
      ) : (
        <div className="nightshift-tip">Walk is loud. Tiptoe is slow. Shadow is safe — light is not. Lift the loot if you dare.</div>
      )}
      <div className="nightshift-hint">A/D move · Shift or Space to tiptoe · R restart night · slip past cones, reach the door</div>
    </div>
  );
}

// Inline-styled touch pill — matches the shared shape used across the
// other touch-enabled games. `wide` widens the body for word labels.
function PillBtn({ label, wide, onDown, onUp }) {
  const base = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: wide ? 96 : 56,
    height: 56,
    borderRadius: 28,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontSize: wide ? 11 : 18,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    pointerEvents: 'auto',
    cursor: 'pointer',
  };
  return (
    <button
      style={base}
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDown?.(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerCancel={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerLeave={(e) => { if (e.buttons === 0) onUp?.(); }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
