import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { sfx } from '../../sound.js';

// Default render dimensions used for initial calculations. The fluid
// sizer overwrites view.w / view.h on every fit; the raycast loop reads
// view to size its column step.
const W = 640;
const H = 360;
const FOV = Math.PI / 3;           // 60°
const HALF_FOV = FOV / 2;
const COL_STEP = 2;                // one rendered column per 2 css pixels
const MAX_DEPTH = 18;

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

// ── Procedural wall texture ──────────────────────────────────────
// 64×64 brick courses on a dark mortar base, built once and sliced per
// column with drawImage. Slight per-brick value variance breaks up the
// flatness without needing an asset.
const TEX = 64;
let wallTex = null;
const getWallTex = () => {
  if (wallTex) return wallTex;
  const c = document.createElement('canvas');
  c.width = TEX; c.height = TEX;
  const t = c.getContext('2d');
  t.fillStyle = '#1c2c34';                    // mortar
  t.fillRect(0, 0, TEX, TEX);
  const rowH = TEX / 4;
  const brickW = TEX / 2;
  for (let r = 0; r < 4; r++) {
    const off = (r % 2) * (brickW / 2);
    for (let bx = -1; bx < 3; bx++) {
      const x = bx * brickW + off;
      const v = ((r * 7 + bx * 13) % 5) * 4;  // deterministic variance
      t.fillStyle = `rgb(${50 + v},${78 + v},${92 + v})`;
      t.fillRect(x + 1, r * rowH + 1, brickW - 2, rowH - 2);
      // top-edge highlight so each brick reads as a 3D course
      t.fillStyle = `rgb(${66 + v},${98 + v},${112 + v})`;
      t.fillRect(x + 1, r * rowH + 1, brickW - 2, 2);
    }
  }
  // Deterministic speckle grain so extreme close-ups (one brick filling
  // the screen) still read as a surface instead of a flat fill.
  for (let i = 0; i < 420; i++) {
    const n = Math.sin(i * 127.1) * 43758.5453;
    const f = n - Math.floor(n);
    const sx = Math.floor((Math.sin(i * 31.7) * 0.5 + 0.5) * TEX);
    const sy = Math.floor((Math.sin(i * 57.3) * 0.5 + 0.5) * TEX);
    t.fillStyle = f > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';
    t.fillRect(sx, sy, 1 + (i % 2), 1);
  }
  wallTex = c;
  return c;
};

export default function RaycasterFPS() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const viewRef = useRef({ w: W, h: H }); // fluid render dimensions
  const [hud, setHud] = useState({ health: 100, ammo: 24, alive: 0, kills: 0, wave: 1 });
  const [status, setStatus] = useState('playing'); // 'playing' | 'lost'

  const reset = () => {
    stateRef.current = {
      // 1s of post-spawn invulnerability (60 frames). Enemies still drift
      // toward you but contact damage is suppressed during the window —
      // enough time to finish parsing the maze.
      // Spawn facing down the long south corridor (angle π/2 = +y) —
      // facing +x stares straight into the wall block at (3,2).
      player: { x: 2.5, y: 2.5, angle: Math.PI / 2, invul: 60 },
      keys: { w: false, a: false, s: false, d: false, ArrowLeft: false, ArrowRight: false },
      enemies: [],
      health: 100, ammo: 24,
      fireCd: 0, muzzle: 0,
      // juice timers — all in frames
      kick: 0,          // weapon / screen recoil
      crossBloom: 0,    // crosshair expansion after a shot
      dmgFlash: 0,      // red vignette on player damage
      shake: 0,         // screen shake magnitude (px)
      hurtCd: 0,        // throttle for the hurt stinger
      bobPhase: 0,      // weapon bob accumulator
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
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Fluid sizer — every fit updates viewRef so the raycast loop
    // recomputes its column count and wall slice height for the new
    // canvas dimensions on the next frame.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      viewRef.current = { w: cssW, h: cssH };
    });

    const spawnWave = (s) => {
      const count = waveCount(s.wave);
      const hp = waveHp(s.wave);
      // Prefer spawn points far from the player; fall back to the full
      // pool if the filter leaves too few.
      let pool = ENEMY_SPAWNS.filter(([x, y]) => Math.hypot(x - s.player.x, y - s.player.y) > 5);
      if (pool.length < count) pool = ENEMY_SPAWNS.slice();
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
      s.enemies = pool.map(([x, y]) => ({
        x, y, alive: true, hp, hurt: 0, dying: 0,
        bobP: Math.random() * Math.PI * 2,
      }));
      setHud((h) => ({ ...h, alive: count, wave: s.wave }));
    };

    // Keyboard
    const kd = (e) => {
      const s = stateRef.current; if (!s) return;
      if (e.key in s.keys) { s.keys[e.key] = true; e.preventDefault(); }
      if (e.key.toLowerCase() in s.keys) { s.keys[e.key.toLowerCase()] = true; e.preventDefault(); }
    };
    const ku = (e) => {
      const s = stateRef.current; if (!s) return;
      if (e.key in s.keys) { s.keys[e.key] = false; e.preventDefault(); }
      if (e.key.toLowerCase() in s.keys) { s.keys[e.key.toLowerCase()] = false; e.preventDefault(); }
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Mouse — drag to look
    let dragging = false, lastX = 0;
    const md = (e) => {
      dragging = true;
      lastX = e.clientX;
    };
    const mm = (e) => {
      const s = stateRef.current; if (!s || !dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      s.player.angle += dx * 0.0035;
    };
    const mu = () => { dragging = false; };
    canvas.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);

    const fire = () => {
      const s = stateRef.current; if (!s || status !== 'playing') return;
      if (s.fireCd > 0) return;
      if (s.ammo <= 0) { sfx.fpsDry(); s.fireCd = 10; return; }
      s.ammo -= 1; s.fireCd = 14; s.muzzle = 10;
      s.kick = 6; s.crossBloom = 8;
      sfx.fpsFire();
      setHud((h) => ({ ...h, ammo: s.ammo }));
      // Hit test: find closest enemy in narrow cone in front of player.
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
        // Wall occlusion check
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
          best.dying = 18;       // ~300ms death anim at 60fps
          s.kills += 1;
          sfx.fpsKill();
          const alive = s.enemies.filter((x) => x.alive).length;
          setHud((h) => ({ ...h, alive, kills: s.kills }));
          if (alive === 0) {
            // Wave cleared — refill enough ammo for the next wave plus
            // a margin, then schedule the next drop.
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
    const click = (e) => { e.preventDefault(); fire(); };
    canvas.addEventListener('click', click);
    const space = (e) => { if (e.code === 'Space') { e.preventDefault(); fire(); } };
    window.addEventListener('keydown', space);

    // Game loop
    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }

      if (status === 'playing') {
        // Pending wave drop
        if (s.spawnDelay > 0) {
          s.spawnDelay--;
          if (s.spawnDelay === 0) spawnWave(s);
        }

        // Movement
        const speed = 0.055;
        const rot = 0.045;
        if (s.keys.ArrowLeft)  s.player.angle -= rot;
        if (s.keys.ArrowRight) s.player.angle += rot;
        let mvX = 0, mvY = 0;
        if (s.keys.w) { mvX += Math.cos(s.player.angle) * speed; mvY += Math.sin(s.player.angle) * speed; }
        if (s.keys.s) { mvX -= Math.cos(s.player.angle) * speed; mvY -= Math.sin(s.player.angle) * speed; }
        if (s.keys.a) { mvX += Math.cos(s.player.angle - Math.PI / 2) * speed; mvY += Math.sin(s.player.angle - Math.PI / 2) * speed; }
        if (s.keys.d) { mvX += Math.cos(s.player.angle + Math.PI / 2) * speed; mvY += Math.sin(s.player.angle + Math.PI / 2) * speed; }
        if (!isWall(Math.floor(s.player.x + mvX), Math.floor(s.player.y))) s.player.x += mvX;
        if (!isWall(Math.floor(s.player.x), Math.floor(s.player.y + mvY))) s.player.y += mvY;
        // Weapon bob — faster while moving, slow idle sway otherwise.
        s.bobPhase += (mvX || mvY) ? 0.16 : 0.04;

        // Enemies pursue the player, deal contact damage
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
            // Spawn-safety: damage is gated by the invul timer so the
            // enemy can be in contact range without burning HP.
            if ((s.player.invul || 0) <= 0) {
              // 0.5/frame ≈ 30 HP/s — enemies now pursue from anywhere,
              // so the old 0.8 melted the player too fast.
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

        // Emergency ammo trickle so a dry clip mid-wave is never a
        // soft-lock — one round every 1.5s while at zero.
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

      // ── Render. Read live dimensions from viewRef so a resize takes
      // effect on the very next frame.
      const VW = viewRef.current.w;
      const VH = viewRef.current.h;
      const numRays = Math.max(64, Math.floor(VW / COL_STEP));
      const colW = VW / numRays;
      const now = performance.now();
      // Re-assert every frame: a canvas resize (the fluid sizer) resets
      // context state, and smoothing-on turns the texture slices to mush.
      ctx.imageSmoothingEnabled = false;

      // Screen shake + recoil kick: translate the world pass, restore
      // before the weapon / HUD overlays so the crosshair stays put.
      const shakeX = s.shake ? (Math.random() - 0.5) * s.shake * 2 : 0;
      const shakeY = (s.shake ? (Math.random() - 0.5) * s.shake * 2 : 0) + (s.kick > 0 ? s.kick * 0.4 : 0);
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Ceiling / floor — gradients darkening toward the horizon so the
      // distance fog on the walls reads as one continuous depth cue.
      const ceil = ctx.createLinearGradient(0, 0, 0, VH / 2);
      ceil.addColorStop(0, '#223340');
      ceil.addColorStop(1, '#070c10');
      ctx.fillStyle = ceil;
      ctx.fillRect(-8, -8, VW + 16, VH / 2 + 8);
      const floor = ctx.createLinearGradient(0, VH / 2, 0, VH);
      floor.addColorStop(0, '#0c0905');
      floor.addColorStop(1, '#352a18');
      ctx.fillStyle = floor;
      ctx.fillRect(-8, VH / 2, VW + 16, VH / 2 + 8);

      // Cast rays
      const tex = getWallTex();
      const zBuffer = new Array(numRays);
      for (let col = 0; col < numRays; col++) {
        const rayAngle = s.player.angle - HALF_FOV + (col / numRays) * FOV;
        const cos = Math.cos(rayAngle);
        const sin = Math.sin(rayAngle);
        let dist = 0;
        let hit = false;
        let stepLen = 0.04;
        while (!hit && dist < MAX_DEPTH) {
          dist += stepLen;
          const tx = s.player.x + cos * dist;
          const ty = s.player.y + sin * dist;
          if (isWall(Math.floor(tx), Math.floor(ty))) { hit = true; }
        }
        // Binary refine of the hit point — kills the texture swim the
        // coarse march would otherwise produce.
        let lo = dist - stepLen, hi = dist;
        for (let i = 0; i < 5; i++) {
          const mid = (lo + hi) / 2;
          if (isWall(Math.floor(s.player.x + cos * mid), Math.floor(s.player.y + sin * mid))) hi = mid;
          else lo = mid;
        }
        dist = hi;
        const hx = s.player.x + cos * dist;
        const hy = s.player.y + sin * dist;
        // Face detection: which grid line did the refined ray cross
        // last? Vertical crossing = E/W face, drawn darker for cheap
        // directional lighting.
        const px = s.player.x + cos * lo;
        const vertical = Math.floor(px) !== Math.floor(hx);
        const wallU = vertical ? hy - Math.floor(hy) : hx - Math.floor(hx);

        const corrected = dist * Math.cos(rayAngle - s.player.angle);
        zBuffer[col] = corrected;
        const wallH = Math.min(VH * 2, (VH * 1.2) / corrected);
        const y = (VH - wallH) / 2;

        // Texture slice
        const texX = Math.min(TEX - 1, Math.floor(wallU * TEX));
        ctx.drawImage(tex, texX, 0, 1, TEX, col * colW, y, colW + 0.5, wallH);

        // Distance fog + face shading as one dark overlay per column.
        const shade = Math.max(0.12, 1 - corrected / MAX_DEPTH) * (vertical ? 0.72 : 1);
        const fogA = Math.min(0.92, 1 - shade);
        if (fogA > 0.02) {
          ctx.fillStyle = `rgba(5,9,13,${fogA.toFixed(3)})`;
          ctx.fillRect(col * colW, y, colW + 0.5, wallH);
        }
      }

      // Enemies as billboards — alive ones plus death animations.
      const toDraw = s.enemies
        .filter((e) => e.alive || e.dying > 0)
        .map((e) => {
          const dx = e.x - s.player.x, dy = e.y - s.player.y;
          const d = Math.hypot(dx, dy);
          return { e, d, dx, dy };
        })
        .sort((a, b) => b.d - a.d);

      toDraw.forEach(({ e, d, dx, dy }) => {
        const ang = Math.atan2(dy, dx) - s.player.angle;
        let a = ang;
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        if (Math.abs(a) > HALF_FOV + 0.2) return;
        let size = Math.min(VH, (VH * 0.9) / d);
        const screenX = (0.5 + a / FOV) * VW - size / 2;
        let screenY = (VH - size) / 2 + size * 0.05;
        // occlusion
        const col = Math.floor((screenX + size / 2) / colW);
        if (col >= 0 && col < numRays && zBuffer[col] < d - 0.05) return;

        // Idle bob so the billboards never look frozen.
        screenY += Math.sin(now * 0.004 + e.bobP) * size * 0.035;

        // Death animation: shrink, sink, and fade over ~300ms.
        let alpha = 1;
        if (!e.alive) {
          const t = 1 - e.dying / 18;       // 0 → 1 over the anim
          alpha = 1 - t;
          screenY += size * 0.5 * t;        // sink into the floor
          size *= 1 - t * 0.6;              // collapse
        }
        // Distance fog on sprites too, matching the walls.
        const fog = Math.max(0.25, 1 - d / MAX_DEPTH);
        ctx.globalAlpha = alpha;

        const cx = screenX + size / 2 + (size - size) / 2;
        const cy = screenY + size / 2;
        // Body (rounded shape) — white flash while hurt.
        if (e.hurt > 0) {
          ctx.fillStyle = '#ffffff';
        } else {
          const br = Math.floor(161 * fog), bg = Math.floor(58 * fog), bb = Math.floor(102 * fog);
          ctx.fillStyle = `rgb(${br},${bg},${bb})`;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, size / 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Darker underside so the blob reads as lit from above.
        if (e.hurt <= 0) {
          ctx.fillStyle = `rgba(20,8,16,${(0.35 * fog).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(cx, cy + size / 9, size / 2.9, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.fill();
        }
        // Eyes (cyan dots)
        ctx.fillStyle = e.hurt > 0 ? '#0a0a0a' : '#00fff5';
        const ey = cy - size / 10;
        ctx.beginPath();
        ctx.arc(cx - size / 8, ey, size / 18, 0, Math.PI * 2);
        ctx.arc(cx + size / 8, ey, size / 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.restore(); // end shake/kick world pass

      // ── Weapon — procedural pistol with movement bob and recoil.
      // All dimensions scale with viewport height so the gun stays
      // proportionate from the small embed up to fullscreen.
      const k = VH / 360;
      const bobX = Math.sin(s.bobPhase) * 7 * k;
      const bobY = Math.abs(Math.cos(s.bobPhase)) * 5 * k + s.kick * 2.2 * k;
      const gx = VW / 2 + bobX;
      const gy = VH + bobY;
      // grip
      ctx.fillStyle = '#15181c';
      ctx.beginPath();
      ctx.moveTo(gx - 52 * k, gy);
      ctx.lineTo(gx + 52 * k, gy);
      ctx.lineTo(gx + 26 * k, gy - 64 * k);
      ctx.lineTo(gx - 26 * k, gy - 64 * k);
      ctx.closePath();
      ctx.fill();
      // slide
      ctx.fillStyle = '#2c3138';
      ctx.fillRect(gx - 18 * k, gy - 78 * k, 36 * k, 18 * k);
      ctx.fillStyle = '#41474f';
      ctx.fillRect(gx - 18 * k, gy - 78 * k, 36 * k, 4 * k);
      // barrel + front sight
      ctx.fillStyle = '#383d45';
      ctx.fillRect(gx - 6 * k, gy - 96 * k, 12 * k, 20 * k);
      ctx.fillStyle = '#555c66';
      ctx.fillRect(gx - 2 * k, gy - 100 * k, 4 * k, 5 * k);
      // Muzzle flash — radial bloom plus a four-point star at the tip.
      if (s.muzzle > 0) {
        const fa = s.muzzle / 10;
        const fy = gy - 102 * k;
        const fr = (16 + (10 - s.muzzle) * 2) * k;
        const fg = ctx.createRadialGradient(gx, fy, 2, gx, fy, fr * 1.6);
        fg.addColorStop(0, `rgba(255,250,210,${fa})`);
        fg.addColorStop(0.4, `rgba(255,200,90,${(fa * 0.7).toFixed(3)})`);
        fg.addColorStop(1, 'rgba(255,160,40,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(gx, fy, fr * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,240,180,${fa})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx - fr, fy); ctx.lineTo(gx + fr, fy);
        ctx.moveTo(gx, fy - fr); ctx.lineTo(gx, fy + fr);
        ctx.stroke();
      }

      // Damage vignette — red radial wash that tracks dmgFlash.
      if (s.dmgFlash > 0) {
        const va = (s.dmgFlash / 10) * 0.45;
        const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.3, VW / 2, VH / 2, VH * 0.75);
        vg.addColorStop(0, 'rgba(255,30,40,0)');
        vg.addColorStop(1, `rgba(255,30,40,${va.toFixed(3)})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, VW, VH);
      }

      // Spawn-safety frame: while invul, breathe a cyan vignette around
      // the viewport edge so the player sees they're protected.
      if ((s.player.invul || 0) > 0) {
        const a = 0.35 + 0.25 * Math.cos(now * 0.016);
        ctx.strokeStyle = `rgba(0,255,245,${a.toFixed(3)})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, VW - 6, VH - 6);
      }

      // Crosshair — gap blooms outward right after a shot.
      const gap = (3 + s.crossBloom) * k;
      const len = 6 * k;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = Math.max(1, k);
      ctx.beginPath();
      ctx.moveTo(VW / 2 - gap - len, VH / 2); ctx.lineTo(VW / 2 - gap, VH / 2);
      ctx.moveTo(VW / 2 + gap, VH / 2); ctx.lineTo(VW / 2 + gap + len, VH / 2);
      ctx.moveTo(VW / 2, VH / 2 - gap - len); ctx.lineTo(VW / 2, VH / 2 - gap);
      ctx.moveTo(VW / 2, VH / 2 + gap); ctx.lineTo(VW / 2, VH / 2 + gap + len);
      ctx.stroke();

      // Wave banner — fades out over its timer.
      if (s.waveMsgT > 0 && status === 'playing') {
        const ta = Math.min(1, s.waveMsgT / 30);
        ctx.fillStyle = `rgba(0,255,245,${(ta * 0.9).toFixed(3)})`;
        ctx.font = `700 ${Math.max(22, Math.floor(VH * 0.07))}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(s.waveMsg, VW / 2, VH * 0.32);
        ctx.textAlign = 'left';
      }

      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('keydown', space);
      canvas.removeEventListener('mousedown', md);
      canvas.removeEventListener('click', click);
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
      </div>
      {status !== 'playing' && (
        <div className="fps-bar">
          <span style={{color: '#ff4d6d', fontWeight: 700}}>
            You died — wave {hud.wave}, {hud.kills} kills
          </span>
          <button className="btn btn-primary btn-sm" onClick={reset}>Retry</button>
        </div>
      )}
      <div className="fps-hint">WASD to move · arrows / drag to look · click / space to shoot</div>
    </div>
  );
}
