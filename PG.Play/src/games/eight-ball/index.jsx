// 8-BALL POOL — real 3D rewrite.
//
//  The simulation is unchanged from the 2D version: every ball position,
//  velocity, collision, friction value, pocket test, the cue aim +
//  power/shoot mechanic, and the 8-ball win/lose rules are byte-for-byte
//  the same. Only the *presentation* moved from a flat 2D canvas to a
//  real Three.js scene.
//
//  Ground-plane mapping. The physics still runs in the authored
//  620x360 table coord space. The renderer maps a table point (x, y) to
//  world space as
//      worldX = x - W/2,   worldZ = y - H/2,   worldY = surface
//  i.e. table-y becomes world-z on the felt plane, and balls stand at
//  y = BALL_R above the cloth. Because nothing in the simulation ever
//  touches a third axis, gravity-free 2D billiard physics keeps its
//  exact meaning — the 3D table, rails, pockets, ball spheres, cue stick
//  and lighting are pure decoration over the same numbers.
//
//  Score: balls potted (with shot count for accuracy). Submitted on
//  unmount as 'eightball', identical to the 2D version.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';

// The pool table is authored at 620x360 — every pocket position, ball
// radius, and physics constant is tuned to that coord space.
const W = 620;
const H = 360;
const BALL_R = 14;

// Standard ball palette by number; stripes (9-15) reuse the solid hue
// of (num - 8) on a white body, exactly like a real set.
const BALL_COLORS = {
  1: '#f2b53a', 2: '#2456d4', 3: '#e23b3b', 4: '#7a3cc6',
  5: '#ef7f1a', 6: '#1f9d55', 7: '#8e2f3c', 8: '#15171c',
};
// 15-ball triangle read column by column (apex first). The 8 sits in
// the heart of the rack; solids and stripes alternate around it.
const RACK_NUMS = [1, 9, 4, 2, 8, 10, 11, 3, 14, 6, 7, 13, 5, 15, 12];

const colorOf = (num) => (num === 0 ? '#f4f1e8' : BALL_COLORS[num > 8 ? num - 8 : num]);

// Table → world mapping. Felt surface sits at y = 0; balls ride at
// y = BALL_R. Centre the table on the origin so the camera frames it.
const wx = (x) => x - W / 2;
const wz = (y) => y - H / 2;

// ── Procedural ball texture ──────────────────────────────────────────
// Each ball's surface is baked once into a CanvasTexture wrapped around
// the sphere: a coloured body (or white body + coloured stripe band for
// 9-15), with the number printed in a white circle on two opposite
// faces so it reads from most angles. The cue ball is plain white.
function makeBallTexture(num) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const c = cv.getContext('2d');
  const color = colorOf(num);
  const stripe = num > 8;

  // Base body. Stripe balls are white with a horizontal coloured band
  // mapped to the equator (texture v ~ 0.32..0.68).
  c.fillStyle = stripe || num === 0 ? '#f4f1e8' : color;
  c.fillRect(0, 0, cv.width, cv.height);
  if (stripe) {
    c.fillStyle = color;
    c.fillRect(0, cv.height * 0.30, cv.width, cv.height * 0.40);
  }

  // Number badges — white discs on the two faces (u = 0.25 and 0.75)
  // that sit on the equator, with the number centred in each.
  if (num > 0) {
    [0.25, 0.75].forEach((u) => {
      const cx = cv.width * u, cy = cv.height * 0.5;
      const r = 26;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fillStyle = '#f6f3ea'; c.fill();
      c.fillStyle = '#15171c';
      c.font = `bold ${num > 9 ? 26 : 32}px sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(num), cx, cy + 1);
    });
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function EightBallGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [scored, setScored] = useState(0);
  const [shots, setShots] = useState(0);
  // 'win' | 'lose' | null — drives the end-of-rack card. Win = the 8
  // dropped last; lose = the 8 dropped while object balls remained.
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const stateRef = useRef(null);
  const submitRef = useRef({ scored: 0, shots: 0, started: 0 });
  submitRef.current.scored = scored;
  submitRef.current.shots = shots;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const pockets = [[30,30],[W/2,20],[W-30,30],[30,H-30],[W/2,H-20],[W-30,H-30]];

    // ── Renderer ────────────────────────────────────────────────────
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a1f18');

    // Angled 3/4 over the table (tilted top-down), framing the whole
    // table centred. Looks down the felt from the cue end.
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 4000);
    camera.position.set(0, 560, 440);
    camera.lookAt(0, 0, 10);
    scene.add(camera);

    // ── Lights — bright, warm, "billiard light over the table" ──────
    const hemi = new THREE.HemisphereLight(0xdfeaff, 0x20342a, 1.0);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    // Key light on the CAMERA side (+Z) so the faces we see are lit.
    const key = new THREE.DirectionalLight(0xfff0d6, 1.5);
    key.position.set(-160, 520, 420);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 1600;
    key.shadow.camera.left = -460;
    key.shadow.camera.right = 460;
    key.shadow.camera.top = 340;
    key.shadow.camera.bottom = -340;
    key.shadow.bias = -0.0006;
    scene.add(key);
    scene.add(key.target);

    // Warm overhead pool of light dead centre over the felt.
    const overhead = new THREE.PointLight(0xffe9c0, 0.6, 1600, 2);
    overhead.position.set(0, 420, 0);
    scene.add(overhead);

    // ── Disposal bookkeeping ────────────────────────────────────────
    const disposables = [];
    const track = (obj) => {
      if (obj.geometry) disposables.push(obj.geometry);
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m.map) disposables.push(m.map);
          disposables.push(m);
        });
      }
      return obj;
    };

    // ── Felt surface ────────────────────────────────────────────────
    const felt = track(new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ color: '#15694e', roughness: 0.95, metalness: 0.0 }),
    ));
    felt.rotation.x = -Math.PI / 2;
    felt.position.set(0, 0, 0);
    felt.receiveShadow = true;
    scene.add(felt);

    // Subtle light pool on the felt centre (a softly lit disc).
    const sheen = track(new THREE.Mesh(
      new THREE.CircleGeometry(W * 0.42, 48),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.05 }),
    ));
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.set(0, 0.4, 0);
    scene.add(sheen);

    // ── Wooden rails + pockets ──────────────────────────────────────
    // Rails are four box cushions sitting just outside the play rect,
    // raised above the felt. Pockets are dark cylinders punched into the
    // felt at the six standard positions.
    const FRAME = 34;       // wood width
    const RAIL_H = 26;      // cushion height above felt
    const woodMat = new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.6, metalness: 0.05 });
    disposables.push(woodMat);
    const railTop = wz(0) - FRAME / 2;
    const railBot = wz(H) + FRAME / 2;
    const railLeft = wx(0) - FRAME / 2;
    const railRight = wx(W) + FRAME / 2;

    const addRail = (w, d, x, z) => {
      const m = track(new THREE.Mesh(new THREE.BoxGeometry(w, RAIL_H, d), woodMat));
      m.position.set(x, RAIL_H / 2, z);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
    };
    const fullW = W + FRAME * 2;
    addRail(fullW, FRAME, 0, railTop);                          // top
    addRail(fullW, FRAME, 0, railBot);                          // bottom
    addRail(FRAME, H, railLeft, 0);                             // left
    addRail(FRAME, H, railRight, 0);                            // right

    // Apron / table body sitting below the felt for solidity.
    const apron = track(new THREE.Mesh(
      new THREE.BoxGeometry(fullW + 8, 40, H + FRAME * 2 + 8),
      new THREE.MeshStandardMaterial({ color: '#34200f', roughness: 0.8 }),
    ));
    apron.position.set(0, -22, 0);
    apron.castShadow = true; apron.receiveShadow = true;
    scene.add(apron);

    // Four table legs.
    const legMat = new THREE.MeshStandardMaterial({ color: '#2a1a0c', roughness: 0.8 });
    disposables.push(legMat);
    const legGeo = new THREE.BoxGeometry(40, 220, 40);
    disposables.push(legGeo);
    [[railLeft + 30, railTop + 30], [railRight - 30, railTop + 30],
     [railLeft + 30, railBot - 30], [railRight - 30, railBot - 30]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, -150, z);
      leg.castShadow = true;
      scene.add(leg);
    });

    // Pocket holes — dark cylinders dropping below the felt.
    const pocketMat = new THREE.MeshStandardMaterial({ color: '#08110c', roughness: 1.0 });
    disposables.push(pocketMat);
    const pocketGeo = new THREE.CylinderGeometry(20, 20, 30, 24);
    disposables.push(pocketGeo);
    const jawGeo = new THREE.TorusGeometry(20, 4, 12, 24);
    disposables.push(jawGeo);
    const jawMat = new THREE.MeshStandardMaterial({ color: '#1c1107', roughness: 0.7 });
    disposables.push(jawMat);
    const pocketMeshes = [];
    pockets.forEach(([px, py]) => {
      const hole = new THREE.Mesh(pocketGeo, pocketMat);
      hole.position.set(wx(px), -14, wz(py));
      scene.add(hole);
      const jaw = new THREE.Mesh(jawGeo, jawMat);
      jaw.rotation.x = Math.PI / 2;
      jaw.position.set(wx(px), 1, wz(py));
      scene.add(jaw);
      pocketMeshes.push({ x: px, y: py, jaw });
    });

    // ── Balls — spheres with procedural textures ────────────────────
    const sphereGeo = new THREE.SphereGeometry(BALL_R, 32, 24);
    disposables.push(sphereGeo);
    // Each ball mesh persists for the session; textures are cached by
    // number so re-racking reuses them. Stripe balls spin their texture
    // band to roughly face the camera at rack time (fixed orientation).
    const texCache = new Map();
    const ballTex = (num) => {
      if (!texCache.has(num)) {
        const t = makeBallTexture(num);
        disposables.push(t);
        texCache.set(num, t);
      }
      return texCache.get(num);
    };
    const ballMeshes = new Map();   // num -> mesh
    const getBallMesh = (num) => {
      if (!ballMeshes.has(num)) {
        const mat = new THREE.MeshStandardMaterial({
          map: ballTex(num), roughness: 0.18, metalness: 0.0,
          envMapIntensity: 0.6,
        });
        disposables.push(mat);
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.castShadow = true;
        scene.add(mesh);
        ballMeshes.set(num, mesh);
      }
      return ballMeshes.get(num);
    };

    // ── Cue stick — tapered cylinder, butt thick, tip thin ──────────
    const cueGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(2.0, 4.2, 200, 16);
    disposables.push(shaftGeo);
    const shaftMat = new THREE.MeshStandardMaterial({ color: '#b5803f', roughness: 0.4 });
    disposables.push(shaftMat);
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.z = Math.PI / 2;          // lay along local +X (tip at -X)
    shaft.position.x = -108;                  // butt extends in -X, tip near origin
    shaft.castShadow = true;
    cueGroup.add(shaft);
    const tipGeo = new THREE.CylinderGeometry(2.0, 2.0, 6, 12);
    disposables.push(tipGeo);
    const tipMat = new THREE.MeshStandardMaterial({ color: '#4d8fd1', roughness: 0.5 });
    disposables.push(tipMat);
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.z = Math.PI / 2;
    tip.position.x = -5;
    cueGroup.add(tip);
    cueGroup.visible = false;
    scene.add(cueGroup);

    // ── Aim line + ghost ball ───────────────────────────────────────
    const aimMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 8, gapSize: 6, transparent: true, opacity: 0.55 });
    disposables.push(aimMat);
    const aimGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    disposables.push(aimGeo);
    const aimLine = new THREE.Line(aimGeo, aimMat);
    aimLine.visible = false;
    scene.add(aimLine);

    const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, wireframe: true });
    disposables.push(ghostMat);
    const ghost = new THREE.Mesh(sphereGeo, ghostMat);
    ghost.visible = false;
    scene.add(ghost);

    // ── Particle / effect pool ──────────────────────────────────────
    // Sparks + flashes are short-lived sprites. We keep a small pool of
    // points clouds; effects are recorded in `fx` and rendered each frame
    // by transforming a reusable instanced set. To stay simple + leak
    // free we use one Points cloud whose positions/opacity update live.
    const FX_MAX = 80;
    const fxPositions = new Float32Array(FX_MAX * 3);
    const fxGeo = new THREE.BufferGeometry();
    fxGeo.setAttribute('position', new THREE.BufferAttribute(fxPositions, 3));
    disposables.push(fxGeo);
    const fxMat = new THREE.PointsMaterial({ color: 0xffe9aa, size: 6, transparent: true, opacity: 0.9, depthWrite: false });
    disposables.push(fxMat);
    const fxPoints = new THREE.Points(fxGeo, fxMat);
    fxPoints.frustumCulled = false;
    scene.add(fxPoints);

    // Ring flashes (ball-ball impact, cue strike, pocket) — expanding rings.
    const ringGeo = new THREE.RingGeometry(BALL_R, BALL_R + 3, 28);
    disposables.push(ringGeo);
    const ringPool = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      disposables.push(m.material);
      scene.add(m);
      ringPool.push(m);
    }
    let ringIdx = 0;
    const flashRing = (x, y, color) => {
      const m = ringPool[ringIdx];
      ringIdx = (ringIdx + 1) % ringPool.length;
      m.position.set(wx(x), 1.5, wz(y));
      m.scale.setScalar(1);
      m.material.color.set(color);
      m.material.opacity = 0.85;
      m.visible = true;
      m.userData.t = 0;
    };

    // ─────────────────────────────────────────────────────────────────
    // SIMULATION (unchanged from the 2D version) — runs in 620x360 space
    // ─────────────────────────────────────────────────────────────────
    const initBalls = () => {
      const balls = [{x:140,y:H/2,vx:0,vy:0,num:0,cue:true,in:false}];
      const rx = 432, ry = H/2;
      let i = 0;
      for (let col=0; col<5; col++) {
        for (let row=0; row<=col; row++) {
          const x = rx + col*(BALL_R*2+1);
          const y = ry - col*BALL_R + row*(BALL_R*2+1);
          balls.push({x,y,vx:0,vy:0,num:RACK_NUMS[i],cue:false,in:false});
          i++;
        }
      }
      return balls;
    };

    let balls = initBalls();
    let fx = [];        // transient spark effects: {x,y,life,max,dirs}
    let potted = [];    // ball numbers in pot order
    let over = false;   // 8-ball resolved — input locked until re-rack

    // Pocket-sink animations: meshes shrinking/dropping into a pocket.
    let sinking = [];   // {mesh, px, py, t}

    stateRef.current = {
      reset: () => {
        balls = initBalls(); fx = []; potted = []; over = false; sinking = [];
        ballMeshes.forEach((m) => { m.visible = true; m.scale.setScalar(1); });
        setScored(0); setShots(0); setResult(null); setRolling(false);
      },
    };

    let aim = { x: W/2, y: H/2 };
    let charging = false;
    let power = 0;
    let moving = false;
    let wasRolling = false;
    // Audio throttles — a break shot produces dozens of contacts in a
    // few frames; without a floor the clacks smear into white noise.
    let lastClack = 0;
    let lastRail = 0;

    // Ghost-ball solve: sweep the cue ball along (ux,uy) and find the
    // first object ball whose center comes within 2R of the line.
    const findGhost = (cue, ux, uy) => {
      let best = null;
      const R2 = (BALL_R*2) * (BALL_R*2);
      balls.forEach(b => {
        if (b.cue || b.in) return;
        const rx = b.x - cue.x, ry = b.y - cue.y;
        const proj = rx*ux + ry*uy;
        if (proj <= 0) return;
        const perp2 = rx*rx + ry*ry - proj*proj;
        if (perp2 > R2) return;
        const t = proj - Math.sqrt(R2 - perp2);
        if (t > 0 && (!best || t < best.t)) best = { t, b };
      });
      return best;
    };

    // Distance from the cue ball to the first cushion along (ux,uy).
    const railDist = (cue, ux, uy) => {
      let t = 700;
      if (ux >  1e-6) t = Math.min(t, (W-BALL_R-6 - cue.x) / ux);
      if (ux < -1e-6) t = Math.min(t, (BALL_R+6 - cue.x) / ux);
      if (uy >  1e-6) t = Math.min(t, (H-BALL_R-6 - cue.y) / uy);
      if (uy < -1e-6) t = Math.min(t, (BALL_R+6 - cue.y) / uy);
      return Math.max(0, t);
    };

    // Rail contact: thunk + a puff of spark dust kicked off the cushion.
    const railHit = (s, x, y) => {
      if (s < 0.6) return;
      const now = performance.now();
      if (now - lastRail > 70) { lastRail = now; sfx.poolRail(Math.min(1, s/8)); }
      if (s > 1.6) {
        const dirs = [];
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          dirs.push({ dx: Math.cos(a), dy: Math.sin(a) });
        }
        fx.push({ x, y, life: 0, max: 16, dirs, color: '#cde1cd' });
      }
    };

    const step = () => {
      moving = false;
      balls.forEach(b => {
        if (b.in) return;
        b.x += b.vx; b.y += b.vy;
        b.vx *= 0.985; b.vy *= 0.985;
        if (Math.abs(b.vx) < 0.03) b.vx = 0;
        if (Math.abs(b.vy) < 0.03) b.vy = 0;
        if (b.vx || b.vy) moving = true;
        if (b.x < BALL_R+6) { const s = Math.abs(b.vx); b.x = BALL_R+6; b.vx = -b.vx*0.8; railHit(s, 6, b.y); }
        if (b.x > W-BALL_R-6) { const s = Math.abs(b.vx); b.x = W-BALL_R-6; b.vx = -b.vx*0.8; railHit(s, W-6, b.y); }
        if (b.y < BALL_R+6) { const s = Math.abs(b.vy); b.y = BALL_R+6; b.vy = -b.vy*0.8; railHit(s, b.x, 6); }
        if (b.y > H-BALL_R-6) { const s = Math.abs(b.vy); b.y = H-BALL_R-6; b.vy = -b.vy*0.8; railHit(s, b.x, H-6); }
        pockets.forEach(([px,py]) => {
          if (b.in || Math.hypot(b.x-px,b.y-py) >= 18) return;
          b.in = true;
          sfx.poolPocket();
          flashRing(px, py, '#ffeec8');
          if (b.cue) {
            // Sink the cue mesh, respawn after 450ms (unchanged timing).
            sinking.push({ mesh: getBallMesh(0), px, py, t: 0 });
            setTimeout(() => { b.in = false; b.x = 140; b.y = H/2; b.vx = b.vy = 0;
              const m = getBallMesh(0); m.visible = true; m.scale.setScalar(1); }, 450);
          } else {
            potted.push(b.num);
            sinking.push({ mesh: getBallMesh(b.num), px, py, t: 0 });
            setScored(s => s+1);
            if (b.num === 8) {
              // The rack resolves the moment the 8 drops: clean win if
              // every other object ball already went down, loss if not.
              const left = balls.filter(o => !o.cue && !o.in && o.num !== 8).length;
              over = true;
              const win = left === 0;
              setResult(win ? 'win' : 'lose');
              setTimeout(() => (win ? sfx.win() : sfx.lose()), 320);
            }
          }
        });
      });
      for (let i=0; i<balls.length; i++) {
        for (let j=i+1; j<balls.length; j++) {
          const a = balls[i], b = balls[j];
          if (a.in || b.in) continue;
          const dx = b.x-a.x, dy = b.y-a.y;
          const d = Math.hypot(dx,dy);
          if (d < BALL_R*2 && d > 0) {
            const nx = dx/d, ny = dy/d;
            const overlap = BALL_R*2 - d;
            a.x -= nx*overlap/2; a.y -= ny*overlap/2;
            b.x += nx*overlap/2; b.y += ny*overlap/2;
            const dvx = b.vx-a.vx, dvy = b.vy-a.vy;
            const dot = dvx*nx + dvy*ny;
            if (dot < 0) {
              a.vx += dot*nx; a.vy += dot*ny;
              b.vx -= dot*nx; b.vy -= dot*ny;
              const imp = -dot;
              const now = performance.now();
              if (imp > 0.4 && now - lastClack > 50) {
                lastClack = now;
                sfx.poolClack(Math.min(1, imp/10));
              }
              if (imp > 2.2) {
                const dirs = [];
                for (let k = 0; k < 4; k++) {
                  const ang = Math.random() * Math.PI * 2;
                  dirs.push({ dx: Math.cos(ang), dy: Math.sin(ang) });
                }
                fx.push({ x:(a.x+b.x)/2, y:(a.y+b.y)/2, dirs, life:0, max:14, color:'#ffebaa' });
                flashRing((a.x+b.x)/2, (a.y+b.y)/2, '#ffffff');
              }
            }
          }
        }
      }
      fx = fx.filter(f => { f.life++; return f.life < f.max; });
      // Only ping React on actual transitions — `moving` flips every frame.
      if (moving !== wasRolling) { wasRolling = moving; setRolling(moving); }
    };

    // ── Aim/charge/shoot (unchanged mechanic) ───────────────────────
    let powerTimer = null;
    const startCharge = () => {
      if (moving || balls[0].in || over) return;
      charging = true; power = 0;
      powerTimer = setInterval(() => { power = Math.min(power+3, 100); }, 16);
    };
    const releaseShot = () => {
      if (!charging) return;
      clearInterval(powerTimer);
      const cue = balls[0];
      const dx = aim.x - cue.x, dy = aim.y - cue.y;
      const d = Math.hypot(dx,dy) || 1;
      cue.vx = (dx/d) * power * 0.14;
      cue.vy = (dy/d) * power * 0.14;
      flashRing(cue.x, cue.y, '#ffffff');
      sfx.poolStrike(power / 100);
      setShots(s => s+1);
      charging = false; power = 0;
    };

    // ── Pointer → table-coord raycast ───────────────────────────────
    // Project the pointer onto the felt plane (y = BALL_R) and convert
    // back to table coords so aim lands in the same 620x360 space.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BALL_R);
    const hitPt = new THREE.Vector3();
    const updateAim = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(planeY, hitPt)) {
        aim.x = hitPt.x + W / 2;
        aim.y = hitPt.z + H / 2;
      }
    };

    const onPointerMove = (e) => updateAim(e.clientX, e.clientY);
    const onPointerDown = (e) => {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      updateAim(e.clientX, e.clientY);
      startCharge();
    };
    const onPointerUp = (e) => {
      releaseShot();
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // ── Render: sync meshes to sim, draw aim/cue, update effects ─────
    const syncScene = () => {
      // Balls.
      balls.forEach((b) => {
        const m = getBallMesh(b.num);
        if (b.in) {
          // Visibility handled by the sink animation; if not sinking,
          // keep hidden.
          return;
        }
        m.visible = true;
        m.position.set(wx(b.x), BALL_R, wz(b.y));
        // Roll the ball so motion reads — rotate about the axis
        // perpendicular to travel, proportional to distance moved.
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 0.01) {
          const axis = new THREE.Vector3(b.vy, 0, -b.vx).normalize();
          m.rotateOnWorldAxis(axis, sp / BALL_R);
        }
      });

      // Pocket-sink animations.
      sinking = sinking.filter((s) => {
        s.t += 1;
        const k = Math.min(1, s.t / 18);
        s.mesh.scale.setScalar(1 - k);
        s.mesh.position.set(wx(s.px), BALL_R - k * (BALL_R + 14), wz(s.py));
        if (k >= 1) { s.mesh.visible = false; s.mesh.scale.setScalar(1); return false; }
        return true;
      });

      // Spark particles → fxPoints positions/opacity.
      let p = 0;
      let any = false;
      fx.forEach((f) => {
        const k = f.life / f.max;
        f.dirs.forEach((d) => {
          if (p >= FX_MAX) return;
          const dist = k * 14 + 3;
          fxPositions[p*3]   = wx(f.x + d.dx * dist);
          fxPositions[p*3+1] = BALL_R * 0.5 + Math.sin(k * Math.PI) * 8;
          fxPositions[p*3+2] = wz(f.y + d.dy * dist);
          p++; any = true;
        });
      });
      for (let i = p; i < FX_MAX; i++) { fxPositions[i*3+1] = -9999; }
      fxGeo.attributes.position.needsUpdate = true;
      fxPoints.visible = any;
      if (any) fxMat.opacity = 0.9;

      // Expanding ring flashes.
      ringPool.forEach((m) => {
        if (!m.visible) return;
        m.userData.t += 1;
        const k = m.userData.t / 16;
        m.scale.setScalar(1 + k * 2.2);
        m.material.opacity = 0.85 * (1 - k);
        if (k >= 1) m.visible = false;
      });

      // Aim line + ghost + cue stick.
      const cue = balls[0];
      if (!cue.in && !moving && !over) {
        const dxA = aim.x - cue.x, dyA = aim.y - cue.y;
        const d = Math.hypot(dxA, dyA) || 1;
        const ux = dxA/d, uy = dyA/d;
        const hit = findGhost(cue, ux, uy);
        const reach = hit ? hit.t : railDist(cue, ux, uy);

        const positions = aimGeo.attributes.position.array;
        positions[0] = wx(cue.x + ux*BALL_R); positions[1] = BALL_R; positions[2] = wz(cue.y + uy*BALL_R);
        positions[3] = wx(cue.x + ux*reach);  positions[4] = BALL_R; positions[5] = wz(cue.y + uy*reach);
        aimGeo.attributes.position.needsUpdate = true;
        aimLine.computeLineDistances();
        aimLine.visible = true;

        if (hit) {
          const gx = cue.x + ux*hit.t, gy = cue.y + uy*hit.t;
          ghost.position.set(wx(gx), BALL_R, wz(gy));
          ghost.visible = true;
        } else {
          ghost.visible = false;
        }

        // Cue stick behind the ball, opposite the aim, pulling back with
        // power. Local +X of the group points toward the ball (tip at -X
        // in group space after we orient it). We place the group at the
        // cue ball and rotate it to face the aim direction; the geometry
        // sits in -X (butt) so it appears behind the ball.
        const pull = charging ? 10 + power*0.55 : 6;
        cueGroup.position.set(wx(cue.x), BALL_R, wz(cue.y));
        // Direction from ball outward (away from aim) is (-ux,-uy).
        const ang = Math.atan2(-uy, -ux);   // world-space heading of butt
        cueGroup.rotation.set(0, -ang, 0);
        // Offset the whole stick back along the butt direction by the gap.
        const gap = BALL_R + 4 + pull;
        cueGroup.position.x += -ux * gap;
        cueGroup.position.z += -uy * gap;
        cueGroup.visible = true;
      } else {
        aimLine.visible = false;
        ghost.visible = false;
        cueGroup.visible = false;
      }
    };

    let raf = 0;
    const loop = () => {
      step();
      syncScene();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    // ── Fluid sizing (manual RO — NOT sizeCanvasFluid; that grabs a 2D
    // context and would lock the canvas out of WebGL) ───────────────
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const sizeCanvas = () => {
      const cssW = Math.max(320, Math.floor(wrap.clientWidth));
      const cssH = Math.max(180, Math.floor(wrap.clientHeight));
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
      renderer.setSize(cssW, cssH, false);
    };
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);
    const onOrient = () => sizeCanvas();
    window.addEventListener('orientationchange', onOrient);

    if (import.meta.env.DEV) {
      window.__eightball3d = { scene, camera, renderer };
    }

    submitRef.current.started = performance.now();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(powerTimer);
      try { ro.disconnect(); } catch { /* ignore */ }
      window.removeEventListener('orientationchange', onOrient);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      // Dispose all Three resources.
      disposables.forEach((d) => { try { d.dispose?.(); } catch { /* ignore */ } });
      try { renderer.dispose(); } catch { /* ignore */ }
      if (import.meta.env.DEV) delete window.__eightball3d;
      // Submit the session's running score on unmount — the tally of
      // balls potted, with shot count for the accuracy breakdown.
      const final = submitRef.current.scored;
      if (final > 0) {
        const time = Math.round((performance.now() - submitRef.current.started) / 1000);
        submitScore('eightball', final, { time, shots: submitRef.current.shots });
      }
    };
  }, []);

  const accuracy = shots > 0 ? Math.round((scored / shots) * 100) : 0;

  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:18,fontFamily:'var(--font-mono)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-dim)',padding:'10px 14px'}}>
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:rolling?'#ffe14f':'#35f0c9',boxShadow:rolling?'0 0 6px #ffe14f':'0 0 6px #35f0c9'}}/>
          <b style={{color:'var(--text)'}}>{rolling ? 'Rolling' : 'Your shot'}</b>
        </span>
        <span>Shots <b style={{color:'var(--text)',marginLeft:6}}>{shots}</b></span>
        <span>Potted <b style={{color:'var(--accent)',marginLeft:6}}>{scored}</b></span>
        <button onClick={() => stateRef.current?.reset()} style={{background:'var(--surface)',border:'1px solid var(--line)',color:'var(--text)',padding:'4px 12px',borderRadius:8,fontFamily:'var(--font-mono)',fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>Rack</button>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', maxWidth: 'none', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{cursor:'crosshair',touchAction:'none',width:'100%',height:'100%',display:'block'}}/>
        {result && (
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(4,14,11,0.55)'}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:14,padding:'24px 34px',textAlign:'center',fontFamily:'var(--font-mono)',minWidth:230,boxShadow:'0 18px 50px rgba(0,0,0,0.5)'}}>
              <div style={{fontSize:14,letterSpacing:'0.14em',textTransform:'uppercase',color:result==='win'?'var(--accent)':'#ff4d6d',marginBottom:14}}>
                {result === 'win' ? 'Rack cleared' : 'Eight ball down early'}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:18}}>
                <span>Shots <b style={{color:'var(--text)',marginLeft:6}}>{shots}</b></span>
                <span>Potted <b style={{color:'var(--text)',marginLeft:6}}>{scored}</b></span>
                <span>Accuracy <b style={{color:'var(--accent)',marginLeft:6}}>{accuracy}%</b></span>
              </div>
              <button onClick={() => stateRef.current?.reset()} style={{background:'var(--accent)',border:'none',color:'#06251c',padding:'8px 22px',borderRadius:9,fontFamily:'var(--font-mono)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,cursor:'pointer'}}>Rack again</button>
            </div>
          </div>
        )}
      </div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-mute)',letterSpacing:'0.1em',textTransform:'uppercase',padding:'8px 14px',textAlign:'center'}}>
        Aim · hold to charge · release to shoot · sink the 8 last
      </div>
    </div>
  );
}
