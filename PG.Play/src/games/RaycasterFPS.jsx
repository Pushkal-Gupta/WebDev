import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 640;
const H = 360;
const FOV = Math.PI / 3;           // 60°
const HALF_FOV = FOV / 2;
const NUM_RAYS = W / 2;            // one column per 2px for speed
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

const ENEMY_SPAWNS = [
  [3.5, 3.5],
  [12.5, 3.5],
  [7.5, 8.5],
  [12.5, 12.5],
];

export default function RaycasterFPS() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [hud, setHud] = useState({ health: 100, ammo: 24, alive: 4 });
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'

  const reset = () => {
    stateRef.current = {
      player: { x: 2.5, y: 2.5, angle: 0 },
      keys: { w: false, a: false, s: false, d: false, ArrowLeft: false, ArrowRight: false },
      enemies: ENEMY_SPAWNS.map(([x, y]) => ({ x, y, alive: true, hurt: 0 })),
      health: 100, ammo: 24,
      fireCd: 0, muzzle: 0,
    };
    setHud({ health: 100, ammo: 24, alive: ENEMY_SPAWNS.length });
    setStatus('playing');
  };

  useEffect(() => { reset(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

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
      if (s.fireCd > 0 || s.ammo <= 0) return;
      s.ammo -= 1; s.fireCd = 14; s.muzzle = 8;
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
        if (Math.abs(delta) > 0.08) return;
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
        best.alive = false;
        best.hurt = 1;
        const alive = s.enemies.filter((x) => x.alive).length;
        setHud((h) => ({ ...h, alive }));
        if (alive === 0) {
          setStatus('won');
          submitScore('fps', Math.max(1, Math.round(s.health)) * 100 + s.ammo * 5, { hp: s.health, ammo: s.ammo });
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

        // Enemies drift toward player, deal contact damage
        s.enemies.forEach((e) => {
          if (!e.alive) return;
          const dx = s.player.x - e.x, dy = s.player.y - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01 && d < 8) {
            const step = 0.015;
            const nx = e.x + (dx / d) * step;
            const ny = e.y + (dy / d) * step;
            if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
            if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;
          }
          if (d < 0.6) {
            s.health -= 0.8;
            if (s.health <= 0) {
              s.health = 0;
              setStatus('lost');
            }
          }
        });
        setHud((h) => {
          const nh = Math.max(0, Math.round(s.health));
          return nh !== h.health ? { ...h, health: nh } : h;
        });

        if (s.fireCd > 0) s.fireCd--;
        if (s.muzzle > 0) s.muzzle--;
      }

      // ── Render
      // Ceiling / floor
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a2530');
      grad.addColorStop(0.5, '#0c1419');
      grad.addColorStop(0.5, '#2a1f14');
      grad.addColorStop(1, '#15110a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Cast rays
      const zBuffer = new Array(NUM_RAYS);
      const colW = W / NUM_RAYS;
      for (let col = 0; col < NUM_RAYS; col++) {
        const rayAngle = s.player.angle - HALF_FOV + (col / NUM_RAYS) * FOV;
        const cos = Math.cos(rayAngle);
        const sin = Math.sin(rayAngle);
        let dist = 0;
        let hit = false;
        let step = 0.04;
        while (!hit && dist < MAX_DEPTH) {
          dist += step;
          const tx = s.player.x + cos * dist;
          const ty = s.player.y + sin * dist;
          if (isWall(Math.floor(tx), Math.floor(ty))) { hit = true; }
        }
        const corrected = dist * Math.cos(rayAngle - s.player.angle);
        zBuffer[col] = corrected;
        const wallH = Math.min(H, (H * 1.2) / corrected);
        const y = (H - wallH) / 2;
        const shade = Math.max(0.15, 1 - corrected / MAX_DEPTH);
        const baseR = 42, baseG = 68, baseB = 80;
        const r = Math.floor(baseR * shade), g = Math.floor(baseG * shade), b = Math.floor(baseB * shade);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(col * colW, y, colW + 0.5, wallH);
      }

      // Enemies as billboards
      const toDraw = s.enemies
        .filter((e) => e.alive)
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
        const size = Math.min(H, (H * 0.9) / d);
        const screenX = (0.5 + a / FOV) * W - size / 2;
        const screenY = (H - size) / 2 + size * 0.05;
        // occlusion
        const col = Math.floor((screenX + size / 2) / colW);
        if (col >= 0 && col < NUM_RAYS && zBuffer[col] < d - 0.05) return;

        // Body (rounded shape)
        ctx.fillStyle = '#a13a66';
        ctx.beginPath();
        ctx.arc(screenX + size / 2, screenY + size / 2, size / 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Eyes (cyan dots)
        ctx.fillStyle = '#00fff5';
        const ey = screenY + size / 2 - size / 10;
        ctx.beginPath();
        ctx.arc(screenX + size / 2 - size / 8, ey, size / 18, 0, Math.PI * 2);
        ctx.arc(screenX + size / 2 + size / 8, ey, size / 18, 0, Math.PI * 2);
        ctx.fill();
      });

      // Weapon / muzzle
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(W / 2 - 50, H);
      ctx.lineTo(W / 2 + 50, H);
      ctx.lineTo(W / 2 + 28, H - 70);
      ctx.lineTo(W / 2 - 28, H - 70);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(W / 2 - 5, H - 90, 10, 25);
      if (s.muzzle > 0) {
        ctx.fillStyle = `rgba(255,230,140,${s.muzzle / 8})`;
        ctx.beginPath();
        ctx.arc(W / 2, H - 95, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 6, H / 2); ctx.lineTo(W / 2 + 6, H / 2);
      ctx.moveTo(W / 2, H / 2 - 6); ctx.lineTo(W / 2, H / 2 + 6);
      ctx.stroke();

      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
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
    <div className="fps">
      <div className="fps-bar">
        <span>HP <b style={{color: hud.health < 30 ? '#ff4d6d' : 'var(--text)'}}>{hud.health}</b></span>
        <span>Ammo <b>{hud.ammo}</b></span>
        <span>Enemies <b style={{color: 'var(--accent)'}}>{hud.alive}</b></span>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Restart</button>
      </div>
      <canvas ref={canvasRef} className="fps-canvas" width={W} height={H}/>
      {status !== 'playing' && (
        <div className="fps-bar">
          <span style={{color: status === 'won' ? 'var(--accent)' : '#ff4d6d', fontWeight: 700}}>
            {status === 'won' ? 'Sector cleared' : 'You died'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={reset}>
            {status === 'won' ? 'Play again' : 'Retry'}
          </button>
        </div>
      )}
      <div className="fps-hint">WASD to move · arrows / drag to look · click / space to shoot</div>
    </div>
  );
}
