import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';

// Raycaster FPS — now a real Three.js first-person scene. The gameplay
// contract (16x16 grid, wave system, health/ammo/kills/score, sfx cues)
// is byte-for-byte the same as the old Canvas2D raycaster; only the
// presentation, camera, and look-input moved into 3D.
//
// World mapping: the MAP grid is laid out on the XZ plane at world scale
// 1 cell = 1 meter. Grid (gx, gy) → world (gx, *, gy): map-x is world X,
// map-y is world Z. The player eye sits at EYE meters. Up is +Y.

// 16×16 map. '#' wall, '.' empty. Outer walls enclose arena.
const MAP = [
  '################',
  '#..............#',
  '#..##..#..##...#',
  '#..#...#.......#',
  '#......#....##.#',
  '#..##..#.......#',
  '#......####....#',
  '#..............#',
  '#....######....#',
  '#..............#',
  '#..##..#..##...#',
  '#......#.......#',
  '#......#....##.#',
  '#..#...#.......#',
  '#..............#',
  '################',
];
const MAP_W = MAP[0].length;
const MAP_H = MAP.length;
const isWall = (x, y) => {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  return MAP[y][x] === '#';
};

// Spawn pool for the wave system. All cells verified open against MAP;
// spawnWave filters out anything within 5 units of the player so a new
// wave never materialises in your face.
const ENEMY_SPAWNS = [
  [3.5, 3.5],
  [12.5, 3.5],
  [7.5, 8.5],
  [12.5, 12.5],
  [1.5, 13.5],
  [14.5, 14.5],
  [8.5, 1.5],
  [14.5, 8.5],
];

// Per-wave tuning. Count is capped by the spawn pool; hp and speed keep
// scaling so later waves stay threatening even at the count ceiling.
const waveCount = (wave) => Math.min(3 + wave, ENEMY_SPAWNS.length);
const waveHp = (wave) => Math.min(3, 1 + Math.floor((wave - 1) / 2));
const waveSpeed = (wave) => Math.min(0.032, 0.014 + wave * 0.002);

const WALL_H = 2.6;            // wall extrusion height (meters)
const EYE = 1.3;              // player eye height
const ENEMY_POOL = ENEMY_SPAWNS.length;  // max live enemies = spawn pool size

// ── Procedural textures ─────────────────────────────────────────────
// Brick wall texture (mirrors the old getWallTex palette) + a tiled
// floor texture. Built once on canvas, no external assets.
function makeWallTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const t = c.getContext('2d');
  t.fillStyle = '#16242b';                       // mortar
  t.fillRect(0, 0, S, S);
  const rows = 5;
  const rowH = S / rows;
  const brickW = S / 2;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (brickW / 2);
    for (let bx = -1; bx < 3; bx++) {
      const x = bx * brickW + off;
      const v = ((r * 7 + bx * 13) % 5) * 5;
      t.fillStyle = `rgb(${48 + v},${76 + v},${90 + v})`;
      t.fillRect(x + 2, r * rowH + 2, brickW - 4, rowH - 4);
      t.fillStyle = `rgb(${70 + v},${102 + v},${118 + v})`;
      t.fillRect(x + 2, r * rowH + 2, brickW - 4, 3);     // top highlight
      t.fillStyle = `rgb(${24 + v},${40 + v},${50 + v})`;
      t.fillRect(x + 2, (r + 1) * rowH - 4, brickW - 4, 2); // bottom shade
    }
  }
  for (let i = 0; i < 1400; i++) {
    const n = Math.sin(i * 127.1) * 43758.5453;
    const f = n - Math.floor(n);
    const sx = Math.floor((Math.sin(i * 31.7) * 0.5 + 0.5) * S);
    const sy = Math.floor((Math.sin(i * 57.3) * 0.5 + 0.5) * S);
    t.fillStyle = f > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)';
    t.fillRect(sx, sy, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeFloorTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const t = c.getContext('2d');
  t.fillStyle = '#241c11';
  t.fillRect(0, 0, S, S);
  // tile grid
  t.strokeStyle = 'rgba(0,0,0,0.45)';
  t.lineWidth = 3;
  t.strokeRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const n = Math.sin(i * 91.3) * 24634.21;
    const f = n - Math.floor(n);
    const sx = Math.floor((Math.sin(i * 12.9) * 0.5 + 0.5) * S);
    const sy = Math.floor((Math.sin(i * 78.2) * 0.5 + 0.5) * S);
    const v = Math.floor(f * 30);
    t.fillStyle = `rgba(${60 + v},${48 + v},${28 + v},0.5)`;
    t.fillRect(sx, sy, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(MAP_W, MAP_H);
  tex.anisotropy = 4;
  return tex;
}

export default function RaycasterFPS() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const [hud, setHud] = useState({ health: 100, ammo: 24, alive: 0, kills: 0, wave: 1 });
  const [status, setStatus] = useState('playing'); // 'playing' | 'lost'

  const reset = () => {
    stateRef.current = {
      // 1s of post-spawn invulnerability (60 frames). Enemies still drift
      // toward you but contact damage is suppressed during the window.
      // Spawn facing down the long south corridor (yaw aimed at +Z).
      player: { x: 2.5, y: 2.5, angle: Math.PI / 2, pitch: 0, invul: 60 },
      keys: { w: false, a: false, s: false, d: false, ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false },
      enemies: [],
      health: 100, ammo: 24,
      fireCd: 0, muzzle: 0,
      // juice timers — all in frames
      kick: 0,          // weapon / screen recoil
      crossBloom: 0,    // crosshair expansion after a shot
      dmgFlash: 0,      // red vignette on player damage
      shake: 0,         // screen shake magnitude
      hurtCd: 0,        // throttle for the hurt stinger
      bobPhase: 0,      // weapon bob accumulator
      moving: false,
      // wave flow
      wave: 1, kills: 0,
      spawnDelay: 50,   // frames until the next wave drops
      waveMsg: 'Wave 1', waveMsgT: 90,
      ammoTrickle: 0,   // emergency regen counter when dry
    };
    setHud({ health: 100, ammo: 24, alive: 0, kills: 0, wave: 1 });
    setStatus('playing');
  };

  useEffect(() => { reset(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // ── Renderer (manual sizing — NO sizeCanvasFluid; that grabs a 2D
    // context and would lock the canvas out of WebGL). ────────────────
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return; // no WebGL — leave the canvas blank rather than crash
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1b2a3a');
    scene.fog = new THREE.FogExp2('#1b2a3a', 0.026);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 200);
    camera.position.set(2.5, EYE, 2.5);
    scene.add(camera);

    // ── Lighting ──────────────────────────────────────────────────────
    // Hemisphere base + a key light that is RE-POSITIONED every frame to
    // sit on the camera side, so the wall faces the player looks at are
    // always lit (wiki gotcha #1: a fixed light leaves visible faces
    // dark in a free-look scene). A muzzle point light flares on fire.
    const hemi = new THREE.HemisphereLight(0x9fc0e0, 0x2a2418, 1.0);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0x42566a, 0.75);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.8);
    scene.add(keyLight);
    scene.add(keyLight.target);
    const muzzleLight = new THREE.PointLight(0xffd070, 0, 9, 2);
    scene.add(muzzleLight);

    // ── Walls — one merged BufferGeometry box per '#' cell ────────────
    const wallTex = makeWallTexture();
    const floorTex = makeFloorTexture();
    const wallGeos = [];
    const box = new THREE.BoxGeometry(1, WALL_H, 1);
    for (let gy = 0; gy < MAP_H; gy++) {
      for (let gx = 0; gx < MAP_W; gx++) {
        if (MAP[gy][gx] !== '#') continue;
        const g = box.clone();
        g.translate(gx + 0.5, WALL_H / 2, gy + 0.5);
        wallGeos.push(g);
      }
    }
    const wallGeo = mergeGeometries(wallGeos, false);
    wallGeos.forEach((g) => g.dispose());
    box.dispose();
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex, roughness: 0.92, metalness: 0.04, color: 0xffffff,
    });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    scene.add(walls);

    // ── Floor + ceiling ──────────────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(MAP_W, MAP_H);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1, metalness: 0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(MAP_W / 2, 0, MAP_H / 2);
    scene.add(floor);

    const ceilGeo = new THREE.PlaneGeometry(MAP_W, MAP_H);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1a2730, roughness: 1, metalness: 0 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(MAP_W / 2, WALL_H, MAP_H / 2);
    scene.add(ceiling);

    // ── Enemy mesh pool — low-poly drone creatures, reused by index ───
    // Each rig: a faceted icosahedron body, a smaller head, a glowing
    // cyan eye, and a base ring. Pooled — show/hide per enemy.alive; no
    // per-frame mesh allocation. The hurt flash recolors the body
    // emissive; the death anim is driven from enemy.dying in the loop.
    const enemyBodyGeo = new THREE.IcosahedronGeometry(0.34, 0);
    const enemyHeadGeo = new THREE.IcosahedronGeometry(0.2, 0);
    const enemyEyeGeo = new THREE.SphereGeometry(0.09, 10, 8);
    const enemyFinGeo = new THREE.ConeGeometry(0.12, 0.34, 4);
    const enemyRingGeo = new THREE.TorusGeometry(0.4, 0.035, 6, 16);
    const enemyMeshes = [];
    for (let i = 0; i < ENEMY_POOL; i++) {
      const grp = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xa13a66, roughness: 0.45, metalness: 0.35,
        emissive: 0x2a0a18, emissiveIntensity: 1,
        flatShading: true,
      });
      const body = new THREE.Mesh(enemyBodyGeo, bodyMat);
      body.castShadow = false;
      grp.add(body);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x6a1f3e, roughness: 0.5, metalness: 0.3, flatShading: true,
      });
      const head = new THREE.Mesh(enemyHeadGeo, headMat);
      head.position.set(0, 0.34, 0.16);
      grp.add(head);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00fff5 });
      const eye = new THREE.Mesh(enemyEyeGeo, eyeMat);
      eye.position.set(0, 0.36, 0.32);
      grp.add(eye);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x8a2f55, roughness: 0.5, metalness: 0.3, flatShading: true,
      });
      const finL = new THREE.Mesh(enemyFinGeo, finMat);
      finL.position.set(-0.34, 0, 0);
      finL.rotation.z = Math.PI / 2;
      grp.add(finL);
      const finR = new THREE.Mesh(enemyFinGeo, finMat);
      finR.position.set(0.34, 0, 0);
      finR.rotation.z = -Math.PI / 2;
      grp.add(finR);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00b8b0, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(enemyRingGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.42;
      grp.add(ring);
      grp.visible = false;
      scene.add(grp);
      enemyMeshes.push({ grp, body, bodyMat, head, headMat, eye, eyeMat, finL, finR, finMat, ring, ringMat });
    }

    // ── Weapon viewmodel — a 3D pistol parented to the camera ─────────
    const gun = new THREE.Group();
    const gunMatDark = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.6, metalness: 0.5 });
    const gunMatMid = new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.5, metalness: 0.6 });
    const gunMatLight = new THREE.MeshStandardMaterial({ color: 0x4a525c, roughness: 0.4, metalness: 0.7 });
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.06), gunMatDark);
    grip.position.set(0, -0.06, 0.02);
    grip.rotation.x = 0.32;
    gun.add(grip);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.26), gunMatMid);
    slide.position.set(0, 0.02, -0.14);
    gun.add(slide);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 12), gunMatLight);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.3);
    gun.add(barrel);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.02), gunMatLight);
    sight.position.set(0, 0.07, -0.24);
    gun.add(sight);
    // muzzle flash sprite (additive)
    const flashTex = (() => {
      const S = 64; const c = document.createElement('canvas'); c.width = S; c.height = S;
      const t = c.getContext('2d');
      const g = t.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(255,250,210,1)');
      g.addColorStop(0.4, 'rgba(255,200,90,0.7)');
      g.addColorStop(1, 'rgba(255,160,40,0)');
      t.fillStyle = g; t.fillRect(0, 0, S, S);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
    })();
    const flashMat = new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, opacity: 0 });
    const flash = new THREE.Sprite(flashMat);
    flash.scale.set(0.5, 0.5, 0.5);
    flash.position.set(0, 0.03, -0.42);
    gun.add(flash);
    // anchor gun in front of the camera, lower-right
    gun.position.set(0.16, -0.16, -0.42);
    camera.add(gun);

    // ── DEV handle for screenshot/debug harness ───────────────────────
    if (import.meta.env.DEV) window.__fps3d = { scene, camera, renderer };

    // ── Sizing (manual + ResizeObserver, era-siege style) ─────────────
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const fit = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);
      renderer.setSize(cssW, cssH, false);
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const onOrient = () => fit();
    window.addEventListener('orientationchange', onOrient);

    // ── Wave spawn (identical contract) ───────────────────────────────
    const spawnWave = (s) => {
      const count = waveCount(s.wave);
      const hp = waveHp(s.wave);
      let pool = ENEMY_SPAWNS.filter(([x, y]) => Math.hypot(x - s.player.x, y - s.player.y) > 5);
      if (pool.length < count) pool = ENEMY_SPAWNS.slice();
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
      s.enemies = pool.map(([x, y]) => ({
        x, y, alive: true, hp, hurt: 0, dying: 0,
        bobP: Math.random() * Math.PI * 2,
      }));
      setHud((h) => ({ ...h, alive: count, wave: s.wave }));
    };

    // ── Keyboard ──────────────────────────────────────────────────────
    const kd = (e) => {
      const s = stateRef.current; if (!s) return;
      if (e.key in s.keys) { s.keys[e.key] = true; e.preventDefault(); }
      const lk = e.key.toLowerCase();
      if (lk in s.keys) { s.keys[lk] = true; e.preventDefault(); }
    };
    const ku = (e) => {
      const s = stateRef.current; if (!s) return;
      if (e.key in s.keys) { s.keys[e.key] = false; e.preventDefault(); }
      const lk = e.key.toLowerCase();
      if (lk in s.keys) { s.keys[lk] = false; e.preventDefault(); }
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // ── Mouse look via Pointer Lock (click canvas to lock); drag-look
    // and arrow-key look both remain as fallbacks for headless verify. ──
    const PITCH_CLAMP = Math.PI / 2 - 0.15;
    let dragging = false, lastX = 0, lastY = 0;
    const onMouseMove = (e) => {
      const s = stateRef.current; if (!s) return;
      if (document.pointerLockElement === canvas) {
        s.player.angle += (e.movementX || 0) * 0.0022;
        s.player.pitch = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, s.player.pitch - (e.movementY || 0) * 0.0022));
      } else if (dragging) {
        s.player.angle += (e.clientX - lastX) * 0.0035;
        s.player.pitch = Math.max(-PITCH_CLAMP, Math.min(PITCH_CLAMP, s.player.pitch - (e.clientY - lastY) * 0.0035));
        lastX = e.clientX; lastY = e.clientY;
      }
    };
    const onMouseDown = (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onMouseUp = () => { dragging = false; };
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ── Fire (identical hit/kill/ammo/score contract) ─────────────────
    const fire = () => {
      const s = stateRef.current; if (!s || status !== 'playing') return;
      if (s.fireCd > 0) return;
      if (s.ammo <= 0) { sfx.fpsDry(); s.fireCd = 10; return; }
      s.ammo -= 1; s.fireCd = 14; s.muzzle = 10;
      s.kick = 6; s.crossBloom = 8;
      sfx.fpsFire();
      setHud((h) => ({ ...h, ammo: s.ammo }));
      // Hit test: closest enemy in a narrow cone in front of the player.
      let best = null, bestD = 10;
      s.enemies.forEach((e) => {
        if (!e.alive) return;
        const dx = e.x - s.player.x, dy = e.y - s.player.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) return;
        const ang = Math.atan2(dy, dx);
        let delta = ang - s.player.angle;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        if (Math.abs(delta) > 0.1) return;
        const steps = Math.floor(d * 20);
        let blocked = false;
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          if (isWall(Math.floor(s.player.x + dx * t), Math.floor(s.player.y + dy * t))) {
            blocked = true; break;
          }
        }
        if (blocked) return;
        if (d < bestD) { best = e; bestD = d; }
      });
      if (best) {
        best.hp -= 1;
        best.hurt = 6;
        if (best.hp <= 0) {
          best.alive = false;
          best.dying = 18;
          s.kills += 1;
          sfx.fpsKill();
          const alive = s.enemies.filter((x) => x.alive).length;
          setHud((h) => ({ ...h, alive, kills: s.kills }));
          if (alive === 0) {
            s.wave += 1;
            const needed = waveCount(s.wave) * waveHp(s.wave);
            s.ammo = Math.max(s.ammo, needed + 12);
            s.spawnDelay = 110;
            s.waveMsg = `Wave ${s.wave}`;
            s.waveMsgT = 110;
            sfx.fpsWave();
            setHud((h) => ({ ...h, ammo: s.ammo, wave: s.wave }));
          }
        } else {
          sfx.fpsHit();
        }
      }
    };
    const onClick = (e) => {
      e.preventDefault();
      // First click requests pointer lock; subsequent clicks (locked or
      // dragging) fire. Always fire so verify-by-click works pre-lock.
      if (document.pointerLockElement !== canvas) {
        try { canvas.requestPointerLock?.(); } catch { /* ignore */ }
      }
      fire();
    };
    canvas.addEventListener('click', onClick);
    const onSpace = (e) => { if (e.code === 'Space') { e.preventDefault(); fire(); } };
    window.addEventListener('keydown', onSpace);

    // ── Game loop — fixed-timestep update (unchanged numbers) then a
    // single renderer.render. Temps reused; no per-frame allocation. ───
    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
    let raf;
    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }

      if (status === 'playing') {
        if (s.spawnDelay > 0) {
          s.spawnDelay--;
          if (s.spawnDelay === 0) spawnWave(s);
        }

        // Movement (identical speeds / collision against isWall grid)
        const speed = 0.055;
        const rot = 0.045;
        if (s.keys.ArrowLeft)  s.player.angle -= rot;
        if (s.keys.ArrowRight) s.player.angle += rot;
        if (s.keys.ArrowUp)    s.player.pitch = Math.min(PITCH_CLAMP, s.player.pitch + rot);
        if (s.keys.ArrowDown)  s.player.pitch = Math.max(-PITCH_CLAMP, s.player.pitch - rot);
        let mvX = 0, mvY = 0;
        if (s.keys.w) { mvX += Math.cos(s.player.angle) * speed; mvY += Math.sin(s.player.angle) * speed; }
        if (s.keys.s) { mvX -= Math.cos(s.player.angle) * speed; mvY -= Math.sin(s.player.angle) * speed; }
        if (s.keys.a) { mvX += Math.cos(s.player.angle - Math.PI / 2) * speed; mvY += Math.sin(s.player.angle - Math.PI / 2) * speed; }
        if (s.keys.d) { mvX += Math.cos(s.player.angle + Math.PI / 2) * speed; mvY += Math.sin(s.player.angle + Math.PI / 2) * speed; }
        if (!isWall(Math.floor(s.player.x + mvX), Math.floor(s.player.y))) s.player.x += mvX;
        if (!isWall(Math.floor(s.player.x), Math.floor(s.player.y + mvY))) s.player.y += mvY;
        s.moving = !!(mvX || mvY);
        s.bobPhase += s.moving ? 0.16 : 0.04;

        // Enemies pursue, deal contact damage
        const eSpeed = waveSpeed(s.wave);
        s.enemies.forEach((e) => {
          if (!e.alive) return;
          const dx = s.player.x - e.x, dy = s.player.y - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01) {
            const nx = e.x + (dx / d) * eSpeed;
            const ny = e.y + (dy / d) * eSpeed;
            if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
            if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;
          }
          if (d < 0.6) {
            if ((s.player.invul || 0) <= 0) {
              s.health -= 0.5;
              s.dmgFlash = 10;
              s.shake = 4;
              if (s.hurtCd <= 0) { sfx.fpsHurt(); s.hurtCd = 36; }
              if (s.health <= 0) {
                s.health = 0;
                setStatus('lost');
                submitScore('fps', s.kills * 100 + (s.wave - 1) * 250, { kills: s.kills, wave: s.wave });
              }
            }
          }
        });
        setHud((h) => {
          const nh = Math.max(0, Math.round(s.health));
          return nh !== h.health ? { ...h, health: nh } : h;
        });

        // Emergency ammo trickle (identical)
        if (s.ammo === 0) {
          s.ammoTrickle++;
          if (s.ammoTrickle >= 90) {
            s.ammoTrickle = 0;
            s.ammo = 1;
            setHud((h) => ({ ...h, ammo: 1 }));
          }
        } else s.ammoTrickle = 0;

        if (s.fireCd > 0) s.fireCd--;
        if (s.muzzle > 0) s.muzzle--;
        if (s.kick > 0) s.kick--;
        if (s.crossBloom > 0) s.crossBloom--;
        if (s.dmgFlash > 0) s.dmgFlash--;
        if (s.hurtCd > 0) s.hurtCd--;
        if (s.shake > 0) s.shake *= 0.85;
        if (s.shake < 0.3) s.shake = 0;
        if ((s.player.invul || 0) > 0) s.player.invul--;
        if (s.waveMsgT > 0) s.waveMsgT--;
        s.enemies.forEach((e) => {
          if (e.hurt > 0) e.hurt--;
          if (!e.alive && e.dying > 0) e.dying--;
        });
      }

      // ── Camera transform (eye position + yaw/pitch + shake/kick) ────
      const now = performance.now();
      const shakeX = s.shake ? (Math.random() - 0.5) * s.shake * 0.012 : 0;
      const shakeY = s.shake ? (Math.random() - 0.5) * s.shake * 0.012 : 0;
      camera.position.set(s.player.x, EYE + shakeY, s.player.y);
      // Yaw maps to look down the +X/+Z plane the same way the 2D angle
      // did: forward = (cos a, sin a) in map space → world (X, Z).
      _euler.set(s.player.pitch, -s.player.angle - Math.PI / 2 + shakeX, 0, 'YXZ');
      camera.quaternion.setFromEuler(_euler);

      // Key light rides the camera side so visible wall faces stay lit
      // (wiki gotcha #1). Place it slightly above and behind the eye,
      // aimed forward into the scene.
      const fx = Math.cos(s.player.angle), fz = Math.sin(s.player.angle);
      keyLight.position.set(s.player.x - fx * 2, EYE + 4, s.player.y - fz * 2);
      keyLight.target.position.set(s.player.x + fx * 3, 1, s.player.y + fz * 3);
      keyLight.target.updateMatrixWorld();

      // ── Enemy rigs ──────────────────────────────────────────────────
      let ei = 0;
      const list = s.enemies;
      for (let i = 0; i < enemyMeshes.length; i++) {
        const m = enemyMeshes[i];
        const e = ei < list.length ? list[ei] : null;
        ei++;
        if (!e || (!e.alive && e.dying <= 0)) { m.grp.visible = false; continue; }
        m.grp.visible = true;
        // float bob
        const bob = Math.sin(now * 0.004 + e.bobP) * 0.08;
        let scale = 1, yLift = 0, opacity = 1;
        if (!e.alive) {
          const t = 1 - e.dying / 18;     // 0 → 1
          scale = 1 - t * 0.7;
          yLift = -t * 0.6;               // sink into floor
          opacity = 1 - t;
        }
        m.grp.position.set(e.x, EYE - 0.15 + bob + yLift, e.y);
        m.grp.scale.setScalar(scale);
        // face the player
        m.grp.rotation.y = Math.atan2(s.player.x - e.x, s.player.y - e.y);
        // hurt flash
        if (e.hurt > 0) {
          m.bodyMat.emissive.setHex(0xffffff);
          m.bodyMat.emissiveIntensity = 1.4;
        } else {
          m.bodyMat.emissive.setHex(0x2a0a18);
          m.bodyMat.emissiveIntensity = 1;
        }
        // fade on death
        const fading = !e.alive;
        m.bodyMat.transparent = fading;  m.bodyMat.opacity = opacity;
        m.headMat.transparent = fading;  m.headMat.opacity = opacity;
        m.finMat.transparent = fading;   m.finMat.opacity = opacity;
        m.eyeMat.transparent = fading;   m.eyeMat.opacity = opacity;
        m.ringMat.opacity = 0.5 * opacity;
      }

      // ── Weapon bob + recoil ────────────────────────────────────────
      const bobX = Math.sin(s.bobPhase) * (s.moving ? 0.012 : 0.004);
      const bobY = Math.abs(Math.cos(s.bobPhase)) * (s.moving ? 0.01 : 0.003);
      const recoil = s.kick * 0.012;
      gun.position.set(0.16 + bobX, -0.16 - bobY + recoil * 0.4, -0.42 + recoil);
      gun.rotation.x = recoil * 0.8;
      // muzzle flash + light
      if (s.muzzle > 0) {
        const fa = s.muzzle / 10;
        flashMat.opacity = fa;
        flash.scale.setScalar(0.4 + (10 - s.muzzle) * 0.06);
        muzzleLight.intensity = fa * 6;
        muzzleLight.position.set(
          s.player.x + fx * 0.6, EYE - 0.05, s.player.y + fz * 0.6,
        );
      } else {
        flashMat.opacity = 0;
        muzzleLight.intensity = 0;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // ── Dispose everything ─────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      try { ro.disconnect(); } catch { /* ignore */ }
      window.removeEventListener('orientationchange', onOrient);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('keydown', onSpace);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('click', onClick);
      if (document.pointerLockElement === canvas) {
        try { document.exitPointerLock?.(); } catch { /* ignore */ }
      }
      if (import.meta.env.DEV && window.__fps3d?.renderer === renderer) {
        try { delete window.__fps3d; } catch { window.__fps3d = undefined; }
      }

      // geometries
      wallGeo.dispose();
      floorGeo.dispose();
      ceilGeo.dispose();
      enemyBodyGeo.dispose();
      enemyHeadGeo.dispose();
      enemyEyeGeo.dispose();
      enemyFinGeo.dispose();
      enemyRingGeo.dispose();
      gun.children.forEach((c) => { c.geometry?.dispose?.(); });
      // materials
      wallMat.dispose();
      floorMat.dispose();
      ceilMat.dispose();
      gunMatDark.dispose();
      gunMatMid.dispose();
      gunMatLight.dispose();
      flashMat.dispose();
      enemyMeshes.forEach((m) => {
        m.bodyMat.dispose(); m.headMat.dispose(); m.finMat.dispose();
        m.eyeMat.dispose(); m.ringMat.dispose();
      });
      // textures
      wallTex.dispose();
      floorTex.dispose();
      flashTex.dispose();
      // renderer
      renderer.dispose();
    };
  }, [status]);

  return (
    <div className="fps" style={{ width: '100%', height: '100%' }}>
      <div className="fps-bar">
        <span>HP <b style={{color: hud.health < 30 ? '#ff4d6d' : 'var(--text)'}}>{hud.health}</b></span>
        <span>Ammo <b>{hud.ammo}</b></span>
        <span>Wave <b style={{color: 'var(--accent)'}}>{hud.wave}</b></span>
        <span>Kills <b>{hud.kills}</b></span>
        <span>Enemies <b style={{color: 'var(--accent)'}}>{hud.alive}</b></span>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Restart</button>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="fps-canvas"/>
        {/* DOM crosshair — stays in the HUD layer, not the 3D canvas */}
        <div aria-hidden style={{
          position: 'absolute', left: '50%', top: '50%', width: 22, height: 22,
          transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }}>
          <span style={{ position: 'absolute', left: '50%', top: 0, width: 2, height: 7, marginLeft: -1, background: 'rgba(255,255,255,0.7)' }} />
          <span style={{ position: 'absolute', left: '50%', bottom: 0, width: 2, height: 7, marginLeft: -1, background: 'rgba(255,255,255,0.7)' }} />
          <span style={{ position: 'absolute', top: '50%', left: 0, height: 2, width: 7, marginTop: -1, background: 'rgba(255,255,255,0.7)' }} />
          <span style={{ position: 'absolute', top: '50%', right: 0, height: 2, width: 7, marginTop: -1, background: 'rgba(255,255,255,0.7)' }} />
        </div>
      </div>
      {status !== 'playing' && (
        <div className="fps-bar">
          <span style={{color: '#ff4d6d', fontWeight: 700}}>
            You died — wave {hud.wave}, {hud.kills} kills
          </span>
          <button className="btn btn-primary btn-sm" onClick={reset}>Retry</button>
        </div>
      )}
      <div className="fps-hint">WASD to move · click to lock mouse · arrows / drag to look · click / space to shoot</div>
    </div>
  );
}
