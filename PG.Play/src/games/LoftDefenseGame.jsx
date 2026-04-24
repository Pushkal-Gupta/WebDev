// LOFT DEFENSE — original path-based tower defense.
//
//  • One winding path from the top-left to the bottom-right.
//  • Ten waves of drifting balloons. Enemies scale HP + speed + count.
//  • Three tower archetypes (single-target fast, splash slow, slow-field).
//  • Tap empty ground to open the placement palette. Tap a placed tower to
//    open upgrade/sell. No grid — freeform placement with min-distance
//    constraints + "off the path" check.
//  • Touch-native. All interactions are taps.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 800;
const H = 500;
const START_LIVES = 20;
const START_GOLD = 160;
const TOWER_RADIUS = 18;
const ENEMY_R = 12;
const PATH_WIDTH = 34;
const TOWER_MIN_DIST = 44;

// Hand-authored path waypoints — builds a readable S-curve.
const PATH = [
  [-10, 90],  [160, 90], [160, 220], [360, 220], [360, 100],
  [560, 100], [560, 360], [260, 360], [260, 460], [810, 460],
];

const TOWER_TYPES = {
  dart: {
    name: 'Dart', cost: 80,
    range: 120, cd: 0.55, dmg: 8, splash: 0, slow: 0,
    projSpeed: 340, color: '#00fff5', bg: '#00c8c0',
    upgrade: { cost: 120, range: 150, cd: 0.4, dmg: 14 },
  },
  splash: {
    name: 'Splash', cost: 140,
    range: 110, cd: 1.1, dmg: 6, splash: 36, slow: 0,
    projSpeed: 240, color: '#ff8a3a', bg: '#c84d1a',
    upgrade: { cost: 190, range: 130, cd: 0.9, dmg: 12, splash: 48 },
  },
  frost: {
    name: 'Frost', cost: 110,
    range: 130, cd: 1.0, dmg: 2, splash: 0, slow: 0.45, slowFor: 1.6,
    projSpeed: 280, color: '#35d6f5', bg: '#1a87aa',
    upgrade: { cost: 150, range: 150, cd: 0.8, slow: 0.65, slowFor: 2.0 },
  },
};

// Ten waves: { count, type, spacing, hpMult, speedMult }
const WAVES = [
  { count: 10, fast: false, spacing: 0.9, hp: 1.0, speed: 1.0 },
  { count: 14, fast: false, spacing: 0.8, hp: 1.2, speed: 1.0 },
  { count: 12, fast: true,  spacing: 0.6, hp: 1.0, speed: 1.45 },
  { count: 18, fast: false, spacing: 0.7, hp: 1.6, speed: 1.1 },
  { count: 20, fast: true,  spacing: 0.5, hp: 1.2, speed: 1.5 },
  { count: 18, fast: false, spacing: 0.6, hp: 2.2, speed: 1.2 },
  { count: 24, fast: true,  spacing: 0.45, hp: 1.5, speed: 1.6 },
  { count: 24, fast: false, spacing: 0.5, hp: 3.0, speed: 1.3 },
  { count: 28, fast: true,  spacing: 0.4, hp: 2.0, speed: 1.7 },
  { count: 22, fast: false, spacing: 0.45, hp: 5.0, speed: 1.4 }, // boss-ish
];

// ── path geometry helpers ──
function pathAt(dist) {
  // dist in pixels from start; returns {x, y, done}.
  let remaining = dist;
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1];
    const [bx, by] = PATH[i];
    const segLen = Math.hypot(bx - ax, by - ay);
    if (remaining <= segLen) {
      const t = remaining / segLen;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, done: false };
    }
    remaining -= segLen;
  }
  const [ex, ey] = PATH[PATH.length - 1];
  return { x: ex, y: ey, done: true };
}

// Distance from a point to the path (approx — checks every segment).
function distToPath(px, py) {
  let best = Infinity;
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1];
    const [bx, by] = PATH[i];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy;
    const d = Math.hypot(px - qx, py - qy);
    if (d < best) best = d;
  }
  return best;
}

export default function LoftDefenseGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [hud, setHud] = useState({
    lives: START_LIVES,
    gold: START_GOLD,
    wave: 0,
    status: 'pre',   // 'pre' | 'spawning' | 'wave' | 'won' | 'lost'
    selected: null,  // tower type for placement
    hoverTower: null, // id of placed tower with open menu
  });

  const reset = () => {
    stateRef.current = {
      towers: [],
      enemies: [],
      bullets: [],
      particles: [],
      spawnQueue: [],
      spawnTimer: 0,
      waveIdx: 0,
      waveActive: false,
      pointer: { x: -1, y: -1 },
      hoverTowerId: null,
      selectedType: null,
      gold: START_GOLD,
      lives: START_LIVES,
      elapsed: 0,
    };
    setHud({ lives: START_LIVES, gold: START_GOLD, wave: 0, status: 'pre', selected: null, hoverTower: null });
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const rectOf = () => canvas.getBoundingClientRect();
    const toLocal = (cx, cy) => {
      const r = rectOf();
      return { x: (cx - r.left) * (W / r.width), y: (cy - r.top) * (H / r.height) };
    };

    const onTap = (x, y) => {
      const s = stateRef.current; if (!s) return;
      if (hud.status === 'won' || hud.status === 'lost') return;

      // If a tower is tapped, open its menu.
      for (const t of s.towers) {
        if (Math.hypot(x - t.x, y - t.y) <= TOWER_RADIUS + 2) {
          s.hoverTowerId = s.hoverTowerId === t.id ? null : t.id;
          s.selectedType = null;
          setHud((h) => ({ ...h, hoverTower: s.hoverTowerId, selected: null }));
          return;
        }
      }

      // If a type is selected, try to place.
      if (s.selectedType) {
        if (distToPath(x, y) < PATH_WIDTH / 2 + 6) return; // on the path
        for (const t of s.towers) if (Math.hypot(x - t.x, y - t.y) < TOWER_MIN_DIST) return; // too close
        if (x < 20 || y < 20 || x > W - 20 || y > H - 20) return; // off canvas
        const spec = TOWER_TYPES[s.selectedType];
        if (s.gold < spec.cost) return;
        s.gold -= spec.cost;
        const id = Math.random().toString(36).slice(2, 9);
        s.towers.push({
          id, x, y, type: s.selectedType,
          level: 1,
          cd: 0,
          angle: 0,
        });
        s.selectedType = null;
        setHud((h) => ({ ...h, gold: s.gold, selected: null }));
        return;
      }

      // Empty tap elsewhere clears selection/menu.
      if (s.hoverTowerId || s.selectedType) {
        s.hoverTowerId = null; s.selectedType = null;
        setHud((h) => ({ ...h, hoverTower: null, selected: null }));
      }
    };

    const onMouseDown = (e) => { const p = toLocal(e.clientX, e.clientY); onTap(p.x, p.y); };
    const onMouseMove = (e) => {
      const s = stateRef.current; if (!s) return;
      const p = toLocal(e.clientX, e.clientY);
      s.pointer.x = p.x; s.pointer.y = p.y;
    };
    const onTouchStart = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
      const s = stateRef.current; if (s) { s.pointer.x = p.x; s.pointer.y = p.y; }
      onTap(p.x, p.y);
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
      const s = stateRef.current; if (s) { s.pointer.x = p.x; s.pointer.y = p.y; }
    };
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });

    const drawPath = () => {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      // path base (darker underlay)
      ctx.strokeStyle = '#3a2a0a';
      ctx.lineWidth = PATH_WIDTH + 6;
      ctx.beginPath();
      ctx.moveTo(PATH[0][0], PATH[0][1]);
      for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i][0], PATH[i][1]);
      ctx.stroke();
      // path top
      ctx.strokeStyle = '#d4b479';
      ctx.lineWidth = PATH_WIDTH;
      ctx.stroke();
      // dashes
      ctx.strokeStyle = '#8b6b3a';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawEnemy = (e) => {
      const baseColor = e.fast ? '#ff4d6d' : '#35f0c9';
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, ENEMY_R, ENEMY_R + 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(-4, -5, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ENEMY_R + 3); ctx.lineTo(0, ENEMY_R + 10);
      ctx.stroke();
      // slowed indicator
      if (e.slowT > 0) {
        ctx.strokeStyle = '#35d6f5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ENEMY_R + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      // hp bar
      const ratio = e.hp / e.maxHp;
      if (ratio < 1) {
        ctx.fillStyle = '#0008';
        ctx.fillRect(e.x - 12, e.y - ENEMY_R - 9, 24, 3);
        ctx.fillStyle = ratio > 0.5 ? '#35f0c9' : ratio > 0.25 ? '#ffe14f' : '#ff4d6d';
        ctx.fillRect(e.x - 12, e.y - ENEMY_R - 9, 24 * Math.max(0, ratio), 3);
      }
    };

    const drawTower = (t) => {
      const spec = TOWER_TYPES[t.type];
      // base
      ctx.fillStyle = spec.bg;
      ctx.beginPath();
      ctx.arc(t.x, t.y, TOWER_RADIUS + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spec.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, TOWER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 2;
      ctx.stroke();
      // barrel
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(t.angle) * (TOWER_RADIUS + 6), t.y + Math.sin(t.angle) * (TOWER_RADIUS + 6));
      ctx.stroke();
      // level dots
      if (t.level > 1) {
        ctx.fillStyle = '#ffe14f';
        ctx.beginPath();
        ctx.arc(t.x + TOWER_RADIUS - 4, t.y - TOWER_RADIUS + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawRangeRing = (t) => {
      const spec = TOWER_TYPES[t.type];
      const range = t.level > 1 ? spec.upgrade.range : spec.range;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, range, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;

      // grass background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#6fbf2a');
      grad.addColorStop(1, '#3c7a1f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // subtle grass specks
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 200; i++) {
        const x = (i * 53) % W;
        const y = (i * 29) % H;
        ctx.fillRect(x, y, 2, 2);
      }

      drawPath();

      // Placement ghost
      if (s.selectedType && s.pointer.x > 0) {
        const spec = TOWER_TYPES[s.selectedType];
        const onPath = distToPath(s.pointer.x, s.pointer.y) < PATH_WIDTH / 2 + 6;
        const tooClose = s.towers.some((t) => Math.hypot(s.pointer.x - t.x, s.pointer.y - t.y) < TOWER_MIN_DIST);
        const ok = !onPath && !tooClose && s.gold >= spec.cost;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = ok ? spec.color : '#ff4d6d';
        ctx.beginPath();
        ctx.arc(s.pointer.x, s.pointer.y, TOWER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // range ring on ghost
        ctx.strokeStyle = ok ? 'rgba(255,255,255,0.35)' : 'rgba(255,77,109,0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(s.pointer.x, s.pointer.y, spec.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // range ring on selected tower
      if (s.hoverTowerId) {
        const t = s.towers.find((x) => x.id === s.hoverTowerId);
        if (t) drawRangeRing(t);
      }

      // Draw enemies then towers then bullets
      s.enemies.forEach(drawEnemy);
      s.towers.forEach(drawTower);

      // Bullets
      s.bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.splash ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Particles
      s.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 24));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      });
    };

    const spawnFromQueue = (s, dt) => {
      if (s.spawnQueue.length === 0) return;
      s.spawnTimer -= dt;
      if (s.spawnTimer > 0) return;
      const next = s.spawnQueue.shift();
      const baseHp = 10;
      s.enemies.push({
        x: PATH[0][0], y: PATH[0][1],
        dist: 0,
        speed: 60 * next.speed,
        hp: baseHp * next.hp,
        maxHp: baseHp * next.hp,
        reward: Math.max(2, Math.round(2 * next.hp)),
        slowT: 0,
        slowMult: 1,
        fast: next.fast,
      });
      s.spawnTimer = next.spacing;
    };

    const startWave = () => {
      const s = stateRef.current; if (!s) return;
      if (s.waveIdx >= WAVES.length) return;
      const w = WAVES[s.waveIdx];
      s.spawnQueue = Array.from({ length: w.count }).map(() => ({
        fast: w.fast,
        speed: w.speed, hp: w.hp,
        spacing: w.spacing * (0.85 + Math.random() * 0.3),
      }));
      s.spawnTimer = 0;
      s.waveActive = true;
      setHud((h) => ({ ...h, wave: s.waveIdx + 1, status: 'spawning' }));
    };

    const stepBullet = (s, b, dt) => {
      if (!b.target || b.target.hp <= 0) {
        // look for a new target in the path direction
        const rng = b.range || 200;
        let best = null, bestD = rng;
        for (const e of s.enemies) {
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < bestD) { best = e; bestD = d; }
        }
        b.target = best;
      }
      if (!b.target) { b.life -= dt; return; }
      const dx = b.target.x - b.x;
      const dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const step = b.speed * dt;
      if (d <= step) {
        // hit
        applyHit(s, b, b.target);
        b.hit = true;
        return;
      }
      b.x += (dx / d) * step;
      b.y += (dy / d) * step;
      b.life -= dt;
    };

    const applyHit = (s, b, enemy) => {
      const dmg = b.dmg;
      const hit = (e) => {
        e.hp -= dmg;
        if (b.slow) { e.slowT = b.slowFor; e.slowMult = 1 - b.slow; }
      };
      if (b.splash > 0) {
        for (const e of s.enemies) {
          if (Math.hypot(e.x - enemy.x, e.y - enemy.y) <= b.splash) hit(e);
        }
      } else {
        hit(enemy);
      }
      // Impact sparkle
      for (let k = 0; k < 6; k++) {
        s.particles.push({
          x: enemy.x, y: enemy.y,
          vx: (Math.random() - 0.5) * 80,
          vy: -30 - Math.random() * 60,
          life: 14 + Math.random() * 10,
          color: b.color,
        });
      }
    };

    const fireTower = (s, t) => {
      const spec = TOWER_TYPES[t.type];
      const range = t.level > 1 ? spec.upgrade.range : spec.range;
      const cd    = t.level > 1 ? spec.upgrade.cd    : spec.cd;
      const dmg   = t.level > 1 ? spec.upgrade.dmg ?? spec.dmg : spec.dmg;
      const slow  = (t.level > 1 ? spec.upgrade.slow ?? spec.slow : spec.slow) || 0;
      const slowFor = (t.level > 1 ? spec.upgrade.slowFor ?? spec.slowFor : spec.slowFor) || 0;
      const splash = (t.level > 1 ? spec.upgrade.splash ?? spec.splash : spec.splash) || 0;

      // Target: furthest-along enemy in range.
      let target = null, bestDist = -1;
      for (const e of s.enemies) {
        const d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d > range) continue;
        if (e.dist > bestDist) { bestDist = e.dist; target = e; }
      }
      if (!target) return;
      // aim toward target
      t.angle = Math.atan2(target.y - t.y, target.x - t.x);
      t.cd = cd;
      s.bullets.push({
        x: t.x + Math.cos(t.angle) * (TOWER_RADIUS + 6),
        y: t.y + Math.sin(t.angle) * (TOWER_RADIUS + 6),
        target, dmg, slow, slowFor, splash,
        color: spec.color,
        speed: spec.projSpeed, range: range + 30,
        life: 2.0,
        hit: false,
      });
    };

    // Main loop
    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;

      if (hud.status !== 'won' && hud.status !== 'lost') {
        // Spawn enemies if wave is active
        if (s.waveActive) spawnFromQueue(s, dt);

        // Move enemies along path
        for (const e of s.enemies) {
          const mult = e.slowT > 0 ? e.slowMult : 1;
          e.dist += e.speed * mult * dt;
          const p = pathAt(e.dist);
          e.x = p.x; e.y = p.y;
          if (p.done) {
            s.lives -= 1;
            setHud((h) => ({ ...h, lives: Math.max(0, s.lives) }));
            e.hp = -1;
            if (s.lives <= 0) {
              setHud((h) => ({ ...h, status: 'lost' }));
              if (!s._submitted) {
                s._submitted = true;
                submitScore('bloons', s.waveIdx * 100, { wave: s.waveIdx + 1, lives: 0 });
              }
            }
          }
          if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowMult = 1; }
        }
        // rewards + cleanup
        for (const e of s.enemies) {
          if (e.hp <= 0 && e.reward > 0) {
            s.gold += e.reward;
            e.reward = 0;
            setHud((h) => ({ ...h, gold: s.gold }));
          }
        }
        s.enemies = s.enemies.filter((e) => e.hp > 0);

        // Towers fire
        for (const t of s.towers) {
          t.cd -= dt;
          if (t.cd <= 0) fireTower(s, t);
        }
        // Bullets
        s.bullets.forEach((b) => stepBullet(s, b, dt));
        s.bullets = s.bullets.filter((b) => b.life > 0 && !b.hit);
        // Particles
        s.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= 1; });
        s.particles = s.particles.filter((p) => p.life > 0);

        // Wave transition
        if (s.waveActive && s.spawnQueue.length === 0 && s.enemies.length === 0) {
          s.waveActive = false;
          s.waveIdx += 1;
          if (s.waveIdx >= WAVES.length) {
            setHud((h) => ({ ...h, status: 'won' }));
            if (!s._submitted) {
              s._submitted = true;
              submitScore('bloons', 1000 + s.lives * 50, { wave: WAVES.length, lives: s.lives });
            }
          } else {
            // bonus gold between waves
            s.gold += 30 + s.waveIdx * 6;
            setHud((h) => ({ ...h, gold: s.gold, status: 'pre' }));
          }
        }
      }

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hud.status]);

  const startWaveUI = () => {
    const s = stateRef.current; if (!s) return;
    if (hud.status === 'pre' && s.waveIdx < WAVES.length) {
      const w = WAVES[s.waveIdx];
      s.spawnQueue = Array.from({ length: w.count }).map(() => ({
        fast: w.fast, speed: w.speed, hp: w.hp,
        spacing: w.spacing * (0.85 + Math.random() * 0.3),
      }));
      s.spawnTimer = 0;
      s.waveActive = true;
      setHud((h) => ({ ...h, wave: s.waveIdx + 1, status: 'spawning' }));
    }
  };

  const selectType = (type) => {
    const s = stateRef.current; if (!s) return;
    if (hud.status === 'won' || hud.status === 'lost') return;
    s.selectedType = s.selectedType === type ? null : type;
    s.hoverTowerId = null;
    setHud((h) => ({ ...h, selected: s.selectedType, hoverTower: null }));
  };

  const upgradeSelected = () => {
    const s = stateRef.current; if (!s) return;
    const t = s.towers.find((x) => x.id === s.hoverTowerId);
    if (!t || t.level >= 2) return;
    const cost = TOWER_TYPES[t.type].upgrade.cost;
    if (s.gold < cost) return;
    s.gold -= cost;
    t.level = 2;
    setHud((h) => ({ ...h, gold: s.gold }));
  };
  const sellSelected = () => {
    const s = stateRef.current; if (!s) return;
    const idx = s.towers.findIndex((x) => x.id === s.hoverTowerId);
    if (idx < 0) return;
    const t = s.towers[idx];
    const refund = Math.round(TOWER_TYPES[t.type].cost * 0.6 + (t.level > 1 ? TOWER_TYPES[t.type].upgrade.cost * 0.5 : 0));
    s.gold += refund;
    s.towers.splice(idx, 1);
    s.hoverTowerId = null;
    setHud((h) => ({ ...h, gold: s.gold, hoverTower: null }));
  };

  const selectedTower = stateRef.current?.towers.find((t) => t.id === hud.hoverTower) || null;

  const towerBtn = (type) => {
    const spec = TOWER_TYPES[type];
    const disabled = hud.gold < spec.cost || hud.status === 'won' || hud.status === 'lost';
    return (
      <button
        key={type}
        className={'loft-btn' + (hud.selected === type ? ' is-active' : '') + (disabled ? ' is-disabled' : '')}
        onClick={() => selectType(type)}
        aria-label={`${spec.name} tower`}>
        <div className="loft-btn-name" style={{color: spec.color}}>{spec.name}</div>
        <div className="loft-btn-cost">{spec.cost}g</div>
      </button>
    );
  };

  return (
    <div className="loft">
      <div className="loft-bar">
        <span>Lives <b style={{color: hud.lives < 5 ? '#ff4d6d' : 'var(--text)'}}>{hud.lives}</b></span>
        <span>Gold <b style={{color:'var(--accent)'}}>{hud.gold}</b></span>
        <span>Wave <b>{hud.wave}/{WAVES.length}</b></span>
        <span style={{marginLeft:'auto'}}>
          {hud.status === 'pre' && <button className="btn btn-primary btn-sm" onClick={startWaveUI}>Start wave {Math.min(WAVES.length, (stateRef.current?.waveIdx ?? 0) + 1)}</button>}
          {(hud.status === 'won' || hud.status === 'lost') && <button className="btn btn-primary btn-sm" onClick={reset}>Play again</button>}
        </span>
      </div>
      <canvas ref={canvasRef} className="loft-canvas" width={W} height={H}/>
      <div className="loft-towers">
        {towerBtn('dart')}
        {towerBtn('splash')}
        {towerBtn('frost')}
        {selectedTower && (
          <div className="loft-tower-menu">
            <div className="loft-tower-name" style={{color: TOWER_TYPES[selectedTower.type].color}}>
              {TOWER_TYPES[selectedTower.type].name} · L{selectedTower.level}
            </div>
            <div className="loft-tower-actions">
              {selectedTower.level < 2 && (
                <button className="btn btn-ghost btn-sm" onClick={upgradeSelected}
                  disabled={hud.gold < TOWER_TYPES[selectedTower.type].upgrade.cost}>
                  Upgrade · {TOWER_TYPES[selectedTower.type].upgrade.cost}g
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={sellSelected}>Sell</button>
            </div>
          </div>
        )}
      </div>
      {hud.status === 'won' && (
        <div className="loft-result" style={{color:'var(--accent)'}}>
          <b>All waves cleared</b> · {hud.lives} lives left
        </div>
      )}
      {hud.status === 'lost' && (
        <div className="loft-result" style={{color:'#ff4d6d'}}>
          <b>Overrun</b> on wave {hud.wave}
        </div>
      )}
      <div className="loft-hint">Tap a tower type, then tap the grass to place · tap a placed tower to upgrade or sell</div>
    </div>
  );
}
