import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase.js';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

// Default world dimensions used for initial spawns before the canvas
// has measured itself. The fluid sizer overrides view.w / view.h on
// every fit; arena clamps to MAX_W / MAX_H so 4K screens don't render
// gigantic playfields.
const W = 720;
const H = 440;
const MAX_W = 1200;
const MAX_H = 740;
const PLAYER_R = 12;
const SPAWN_INVUL_F = 90;       // 1.5s @ 60fps — read time after spawn / respawn
const BULLET_R = 3;
const BULLET_SPEED = 5.2;
const BULLET_LIFE = 90;
const MOVE = 2.2;
const BOT_COUNT = 3;
const MAX_HP = 3;
const WIN_KILLS = 5;

// Walls are computed lazily so they adapt to the current world size.
// Border walls hug the world rect; interior obstacles are placed at
// fractions of width / height so the shape of the playfield is roughly
// preserved as the canvas grows or shrinks.
function buildWalls(w, h) {
  const wall = 20;
  const inner = 20;       // gap between world edge and wall
  const innerR = w - inner - wall;
  const innerB = h - inner - wall;
  return [
    [inner, inner, w - inner * 2, wall],                 // top
    [inner, h - inner - wall, w - inner * 2, wall],      // bottom
    [inner, inner, wall, h - inner * 2],                 // left
    [innerR, inner, wall, h - inner * 2],                // right
    // Interior obstacles, placed proportionally
    [Math.round(w * 0.28), Math.round(h * 0.32), 80, 20],
    [Math.round(w * 0.61), Math.round(h * 0.64), 80, 20],
    [Math.round(w * 0.47), Math.round(h * 0.43), 40, 60],
    [Math.round(w * 0.21), Math.round(h * 0.59), 20, 60],
    [Math.round(w * 0.76), Math.round(h * 0.32), 20, 60],
  ];
}

const COLORS = ['#00fff5', '#ff4d6d', '#ffe14f', '#35f0c9', '#a78bfa', '#ff8a3a', '#6fbf2a', '#35c7f5'];
const NAMES = ['Vega', 'Quill', 'Nova', 'Rune', 'Solo', 'Kite', 'Dune', 'Echo', 'Sage', 'Ranger'];
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const pickName = () => NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(10 + Math.random() * 89);

function randSpawn(walls, w, h) {
  // Keep away from edges. Tries up to 200 attempts then falls back to
  // a center-ish position to avoid an infinite loop on tiny worlds.
  for (let i = 0; i < 200; i++) {
    const x = 80 + Math.random() * Math.max(1, w - 160);
    const y = 80 + Math.random() * Math.max(1, h - 160);
    if (!collidesWall(walls, x, y, PLAYER_R)) return { x, y };
  }
  return { x: w / 2, y: h / 2 };
}

function collidesWall(walls, x, y, r) {
  for (const [wx, wy, ww, wh] of walls) {
    const cx = Math.max(wx, Math.min(x, wx + ww));
    const cy = Math.max(wy, Math.min(y, wy + wh));
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}

function segmentHitsWall(walls, x1, y1, x2, y2) {
  // Step-sample segment; cheap but adequate for small bullets
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (collidesWall(walls, x, y, BULLET_R)) return true;
  }
  return false;
}

// ── bot AI ────────────────────────────────────────────────────
function stepBot(bot, targets, walls) {
  if (bot.hp <= 0) return;
  // Pick nearest alive target
  let best = null, bestD = Infinity;
  targets.forEach((t) => {
    if (t.hp <= 0) return;
    const d = Math.hypot(t.x - bot.x, t.y - bot.y);
    if (d < bestD) { best = t; bestD = d; }
  });
  if (!best) return;
  const dx = best.x - bot.x, dy = best.y - bot.y;
  const ang = Math.atan2(dy, dx);
  bot.angle = ang;
  // Move toward, but not too close
  if (bestD > 120) {
    const nx = bot.x + Math.cos(ang) * MOVE * 0.6;
    const ny = bot.y + Math.sin(ang) * MOVE * 0.6;
    if (!collidesWall(walls, nx, bot.y, PLAYER_R)) bot.x = nx;
    if (!collidesWall(walls, bot.x, ny, PLAYER_R)) bot.y = ny;
  } else if (bestD < 70) {
    // back off
    const nx = bot.x - Math.cos(ang) * MOVE * 0.4;
    const ny = bot.y - Math.sin(ang) * MOVE * 0.4;
    if (!collidesWall(walls, nx, bot.y, PLAYER_R)) bot.x = nx;
    if (!collidesWall(walls, bot.x, ny, PLAYER_R)) bot.y = ny;
  }
  // Strafe randomly
  bot.strafeTick = (bot.strafeTick || 0) + 1;
  if (bot.strafeTick % 45 === 0) bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
  const sx = bot.x + Math.cos(ang + Math.PI / 2) * MOVE * 0.45 * (bot.strafeDir || 0);
  const sy = bot.y + Math.sin(ang + Math.PI / 2) * MOVE * 0.45 * (bot.strafeDir || 0);
  if (!collidesWall(walls, sx, bot.y, PLAYER_R)) bot.x = sx;
  if (!collidesWall(walls, bot.x, sy, PLAYER_R)) bot.y = sy;
  // Fire (cooldown)
  bot.fireCd = (bot.fireCd || 0) - 1;
  if (bot.fireCd <= 0 && bestD < 260) {
    bot.fireCd = 48 + Math.random() * 30;
    return { fire: true, ang };
  }
  return null;
}

export default function ArenaGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const channelRef = useRef(null);

  const [me] = useState(() => ({
    id: 'c' + Math.random().toString(36).slice(2, 9),
    name: pickName(),
    color: pickColor(),
  }));
  const [remoteCount, setRemoteCount] = useState(0);
  const [myKills, setMyKills] = useState(0);
  const [myHp, setMyHp] = useState(MAX_HP);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'dead'

  // Init game state once. World w/h start at the default and get
  // overwritten by the first onResize fit.
  useEffect(() => {
    const w = W, h = H;
    const walls = buildWalls(w, h);
    const spawn = randSpawn(walls, w, h);
    stateRef.current = {
      view: { w, h, walls },
      me: { x: spawn.x, y: spawn.y, angle: 0, hp: MAX_HP, kills: 0, fireCd: 0, deadUntil: 0, invul: SPAWN_INVUL_F },
      keys: {},
      mouse: { x: w / 2, y: h / 2, down: false },
      bullets: [],
      bots: Array.from({ length: BOT_COUNT }).map((_, i) => {
        const p = randSpawn(walls, w, h);
        return {
          id: 'bot' + i,
          x: p.x, y: p.y,
          hp: MAX_HP,
          kills: 0,
          angle: 0,
          color: COLORS[(i + 3) % COLORS.length],
          name: 'Bot ' + (i + 1),
        };
      }),
      remotes: new Map(), // id -> { x, y, angle, hp, kills, color, name }
      lastBroadcast: 0,
    };
  }, []);

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel('pgplay-arena', {
      config: { presence: { key: me.id }, broadcast: { ack: false, self: false } },
    });

    const ensureRemote = (id, data) => {
      const s = stateRef.current;
      if (!s) return;
      const cur = s.remotes.get(id) || { x: s.view.w / 2, y: s.view.h / 2, angle: 0, hp: MAX_HP, kills: 0, color: '#fff', name: 'Player' };
      s.remotes.set(id, { ...cur, ...data });
    };

    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (!payload || payload.id === me.id) return;
        ensureRemote(payload.id, {
          x: payload.x, y: payload.y, angle: payload.angle,
          hp: payload.hp, kills: payload.kills,
          color: payload.color, name: payload.name,
        });
      })
      .on('broadcast', { event: 'shot' }, ({ payload }) => {
        if (!payload || payload.id === me.id) return;
        const s = stateRef.current; if (!s) return;
        s.bullets.push({
          x: payload.x, y: payload.y,
          vx: Math.cos(payload.angle) * BULLET_SPEED,
          vy: Math.sin(payload.angle) * BULLET_SPEED,
          life: BULLET_LIFE,
          from: payload.id,
          remote: true,
        });
      })
      .on('broadcast', { event: 'hit' }, ({ payload }) => {
        // Someone says they hit me
        if (!payload || payload.target !== me.id) return;
        const s = stateRef.current; if (!s) return;
        if (s.me.hp <= 0) return;
        // Spawn-safety: discard hits while invuln so a remote shooter
        // can't burn through the read window.
        if (s.me.invul > 0) return;
        s.me.hp -= 1;
        setMyHp(s.me.hp);
        if (s.me.hp <= 0) {
          // Respawn after a moment
          s.me.deadUntil = performance.now() + 2000;
          setStatus('dead');
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = Object.keys(state).filter((id) => id !== me.id);
        setRemoteCount(ids.length);
        const s = stateRef.current; if (!s) return;
        // prune stale remotes
        [...s.remotes.keys()].forEach((id) => {
          if (!ids.includes(id)) s.remotes.delete(id);
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const s = stateRef.current; if (!s) return;
        leftPresences.forEach((p) => s.remotes.delete(p.key || p.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: me.id, name: me.name, color: me.color });
        }
      });

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [me]);

  // Input + game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer: clamp playfield to MAX_W × MAX_H so a 4K screen
    // doesn't render an unmanageable arena. The canvas buffer still
    // matches the parent's full size; we render a centered playfield
    // and pad with a flat backdrop. The view object is read every
    // frame by draw / step.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      const s = stateRef.current; if (!s) return;
      const w = Math.min(MAX_W, Math.max(360, cssW));
      const h = Math.min(MAX_H, Math.max(280, cssH));
      const walls = buildWalls(w, h);
      s.view = { w, h, walls, cssW, cssH };
      // Clamp every entity into the new world so a shrink doesn't leave
      // anyone outside; spawn fresh positions for anything that ends up
      // inside a wall.
      const fix = (e) => {
        e.x = Math.max(PLAYER_R + 24, Math.min(w - PLAYER_R - 24, e.x));
        e.y = Math.max(PLAYER_R + 24, Math.min(h - PLAYER_R - 24, e.y));
        if (collidesWall(walls, e.x, e.y, PLAYER_R)) {
          const p = randSpawn(walls, w, h);
          e.x = p.x; e.y = p.y;
        }
      };
      fix(s.me);
      s.bots.forEach(fix);
    });

    const kd = (e) => {
      const s = stateRef.current; if (!s) return;
      s.keys[e.key.toLowerCase()] = true;
    };
    const ku = (e) => {
      const s = stateRef.current; if (!s) return;
      s.keys[e.key.toLowerCase()] = false;
    };
    const mm = (e) => {
      const s = stateRef.current; if (!s) return;
      // Style is 100%/100% so the bounding rect IS the rendered css size.
      // The world is drawn centered inside the canvas; subtract the
      // playfield offset so mouse coords land in world space.
      const r = canvas.getBoundingClientRect();
      const offX = (r.width  - s.view.w) / 2;
      const offY = (r.height - s.view.h) / 2;
      s.mouse.x = (e.clientX - r.left) - offX;
      s.mouse.y = (e.clientY - r.top)  - offY;
    };
    const md = (e) => {
      const s = stateRef.current; if (!s) return;
      s.mouse.down = true;
    };
    const mu = () => {
      const s = stateRef.current; if (!s) return;
      s.mouse.down = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    canvas.addEventListener('mousemove', mm);
    canvas.addEventListener('mousedown', md);
    window.addEventListener('mouseup', mu);

    const fireMine = () => {
      const s = stateRef.current; if (!s) return;
      if (s.me.fireCd > 0) return;
      if (s.me.hp <= 0) return;
      s.me.fireCd = 18;
      const dx = s.mouse.x - s.me.x, dy = s.mouse.y - s.me.y;
      const ang = Math.atan2(dy, dx);
      const bx = s.me.x + Math.cos(ang) * (PLAYER_R + 2);
      const by = s.me.y + Math.sin(ang) * (PLAYER_R + 2);
      s.bullets.push({
        x: bx, y: by,
        vx: Math.cos(ang) * BULLET_SPEED,
        vy: Math.sin(ang) * BULLET_SPEED,
        life: BULLET_LIFE,
        from: me.id,
      });
      // broadcast shot
      channelRef.current?.send({
        type: 'broadcast', event: 'shot',
        payload: { id: me.id, x: bx, y: by, angle: ang },
      });
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { view } = s;
      const r = canvas.getBoundingClientRect();
      const cssW = r.width, cssH = r.height;

      // Outer backdrop fills the canvas (everything outside the playfield)
      ctx.fillStyle = '#06090c';
      ctx.fillRect(0, 0, cssW, cssH);

      // Center the playfield inside the canvas
      const offX = (cssW - view.w) / 2;
      const offY = (cssH - view.h) / 2;
      ctx.save();
      ctx.translate(offX, offY);

      // playfield background
      ctx.fillStyle = '#0a1116';
      ctx.fillRect(0, 0, view.w, view.h);
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < view.w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, view.h); ctx.stroke();
      }
      for (let y = 0; y < view.h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(view.w, y); ctx.stroke();
      }

      // walls
      ctx.fillStyle = '#1a2630';
      ctx.strokeStyle = '#2a3a46';
      ctx.lineWidth = 2;
      view.walls.forEach(([x, y, w, h]) => {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      });

      const drawEntity = (x, y, angle, color, hp, name, isMe = false) => {
        // glow
        if (isMe) {
          ctx.beginPath();
          ctx.arc(x, y, PLAYER_R + 6, 0, Math.PI * 2);
          ctx.fillStyle = color + '22';
          ctx.fill();
        }
        // body
        ctx.beginPath();
        ctx.arc(x, y, PLAYER_R, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // gun
        ctx.strokeStyle = '#0a1014';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * (PLAYER_R + 8), y + Math.sin(angle) * (PLAYER_R + 8));
        ctx.stroke();
        // HP bar
        const barW = 26, barH = 3;
        ctx.fillStyle = '#00000080';
        ctx.fillRect(x - barW / 2, y - PLAYER_R - 10, barW, barH);
        ctx.fillStyle = hp > 1 ? '#35f0c9' : '#ff4d6d';
        ctx.fillRect(x - barW / 2, y - PLAYER_R - 10, barW * (hp / MAX_HP), barH);
        // name
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, y - PLAYER_R - 14);
      };

      // remote players
      s.remotes.forEach((r) => {
        if (r.hp <= 0) return;
        drawEntity(r.x, r.y, r.angle, r.color, r.hp, r.name);
      });
      // bots
      s.bots.forEach((b) => {
        if (b.hp <= 0) return;
        drawEntity(b.x, b.y, b.angle, b.color, b.hp, b.name);
      });
      // me — flash alpha while invuln so the spawn-safety window is
      // legible. Uses the project-standard 6-frame strobe pattern.
      if (s.me.hp > 0) {
        const flash = (s.me.invul || 0) > 0 && (Math.floor(s.me.invul / 6) % 2 === 0);
        if (flash) {
          ctx.save();
          ctx.globalAlpha = 0.4;
        }
        drawEntity(s.me.x, s.me.y, s.me.angle, me.color, s.me.hp, me.name + ' (you)', true);
        if (flash) ctx.restore();
      }

      // bullets
      s.bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
        ctx.fillStyle = b.remote ? '#ff4d6d' : '#ffe14f';
        ctx.fill();
      });

      ctx.restore();
    };

    const step = () => {
      const s = stateRef.current; if (!s) { raf = requestAnimationFrame(step); return; }

      const walls = s.view.walls;

      // Respawn
      if (s.me.hp <= 0 && performance.now() > s.me.deadUntil) {
        const p = randSpawn(walls, s.view.w, s.view.h);
        s.me.x = p.x; s.me.y = p.y;
        s.me.hp = MAX_HP;
        // Fresh post-respawn invuln so we don't drop straight back into
        // a kill funnel.
        s.me.invul = SPAWN_INVUL_F;
        setMyHp(MAX_HP);
        setStatus('playing');
      }

      // Decay player invul each frame (independent of input lock).
      if (s.me.invul > 0) s.me.invul -= 1;

      if (status !== 'won') {
        // Me movement + aim
        const { keys, mouse, me: you } = s;
        if (you.hp > 0) {
          let mvX = 0, mvY = 0;
          if (keys.w || keys.arrowup)    mvY -= 1;
          if (keys.s || keys.arrowdown)  mvY += 1;
          if (keys.a || keys.arrowleft)  mvX -= 1;
          if (keys.d || keys.arrowright) mvX += 1;
          if (mvX || mvY) {
            const m = Math.hypot(mvX, mvY) || 1;
            mvX /= m; mvY /= m;
            const nx = you.x + mvX * MOVE;
            const ny = you.y + mvY * MOVE;
            if (!collidesWall(walls, nx, you.y, PLAYER_R)) you.x = nx;
            if (!collidesWall(walls, you.x, ny, PLAYER_R)) you.y = ny;
          }
          you.angle = Math.atan2(mouse.y - you.y, mouse.x - you.x);
          if (you.fireCd > 0) you.fireCd--;
          if ((mouse.down || keys[' '] || keys['space']) && you.fireCd === 0) fireMine();
        }

        // Bots
        s.bots.forEach((b) => {
          if (b.hp <= 0) return;
          // Spawn-safety: drop the player from the target list while they
          // are invulnerable so bots can't queue fire that would resolve
          // the moment invuln drops.
          const meTargetable = s.me.hp > 0 && (s.me.invul || 0) <= 0;
          const targets = [
            ...(meTargetable ? [s.me] : []),
            ...s.bots.filter((x) => x !== b),
            ...Array.from(s.remotes.values()),
          ];
          const result = stepBot(b, targets, walls);
          if (result?.fire) {
            s.bullets.push({
              x: b.x + Math.cos(result.ang) * (PLAYER_R + 2),
              y: b.y + Math.sin(result.ang) * (PLAYER_R + 2),
              vx: Math.cos(result.ang) * BULLET_SPEED * 0.9,
              vy: Math.sin(result.ang) * BULLET_SPEED * 0.9,
              life: BULLET_LIFE,
              from: b.id,
            });
          }
        });

        // Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          const prevX = b.x, prevY = b.y;
          b.x += b.vx; b.y += b.vy;
          b.life--;
          if (b.life <= 0 || segmentHitsWall(walls, prevX, prevY, b.x, b.y)) {
            s.bullets.splice(i, 1);
            continue;
          }
          // Hit me?
          if (b.from !== me.id && s.me.hp > 0 && Math.hypot(b.x - s.me.x, b.y - s.me.y) < PLAYER_R + BULLET_R) {
            // Local bullet from bot hits me; remote bullets don't damage here (remote says hit via event)
            if (!b.remote) {
              if (s.me.invul > 0) {
                // Spawn-safety: bullet still pops visually (consumed) but
                // does no damage during the read window.
                s.bullets.splice(i, 1);
                continue;
              }
              s.me.hp -= 1;
              setMyHp(s.me.hp);
              if (s.me.hp <= 0) {
                s.me.deadUntil = performance.now() + 2000;
                setStatus('dead');
              }
            }
            s.bullets.splice(i, 1);
            continue;
          }
          // My bullet hits a bot?
          if (b.from === me.id) {
            let hit = false;
            for (const bot of s.bots) {
              if (bot.hp <= 0) continue;
              if (Math.hypot(b.x - bot.x, b.y - bot.y) < PLAYER_R + BULLET_R) {
                bot.hp -= 1;
                if (bot.hp <= 0) {
                  s.me.kills += 1;
                  setMyKills(s.me.kills);
                  if (s.me.kills >= WIN_KILLS) {
                    setStatus('won');
                    submitScore('arena', s.me.kills, { hp: s.me.hp });
                  }
                  // Respawn bot after delay
                  setTimeout(() => {
                    const sNow = stateRef.current;
                    if (!sNow) return;
                    const p = randSpawn(sNow.view.walls, sNow.view.w, sNow.view.h);
                    bot.x = p.x; bot.y = p.y; bot.hp = MAX_HP;
                  }, 1400);
                }
                hit = true;
                break;
              }
            }
            if (hit) { s.bullets.splice(i, 1); continue; }
            // Remote player? signal hit
            for (const [rid, r] of s.remotes) {
              if (r.hp <= 0) continue;
              if (Math.hypot(b.x - r.x, b.y - r.y) < PLAYER_R + BULLET_R) {
                channelRef.current?.send({
                  type: 'broadcast', event: 'hit',
                  payload: { target: rid, from: me.id },
                });
                s.me.kills += 1; // trust our own hit
                setMyKills(s.me.kills);
                if (s.me.kills >= WIN_KILLS) {
                  setStatus('won');
                  submitScore('arena', s.me.kills, { hp: s.me.hp });
                }
                s.bullets.splice(i, 1);
                break;
              }
            }
          }
        }

        // Broadcast my state at ~15Hz
        const now = performance.now();
        if (now - s.lastBroadcast > 66) {
          s.lastBroadcast = now;
          channelRef.current?.send({
            type: 'broadcast', event: 'state',
            payload: {
              id: me.id, x: s.me.x, y: s.me.y, angle: s.me.angle,
              hp: s.me.hp, kills: s.me.kills,
              color: me.color, name: me.name,
            },
          });
        }
      }

      draw();
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      canvas.removeEventListener('mousemove', mm);
      canvas.removeEventListener('mousedown', md);
      window.removeEventListener('mouseup', mu);
    };
  }, [me, status]);

  const restart = () => {
    const s = stateRef.current; if (!s) return;
    const p = randSpawn(s.view.walls, s.view.w, s.view.h);
    s.me.x = p.x; s.me.y = p.y; s.me.hp = MAX_HP; s.me.kills = 0; s.me.invul = SPAWN_INVUL_F;
    s.bullets = [];
    s.bots.forEach((b) => {
      const sp = randSpawn(s.view.walls, s.view.w, s.view.h);
      b.x = sp.x; b.y = sp.y; b.hp = MAX_HP;
    });
    setMyHp(MAX_HP);
    setMyKills(0);
    setStatus('playing');
  };

  return (
    <div className="arena" style={{ width: '100%', height: '100%' }}>
      <div className="arena-bar">
        <span>Kills <b style={{color: 'var(--accent)'}}>{myKills}</b>/{WIN_KILLS}</span>
        <span>HP <b style={{color: myHp > 1 ? 'var(--text)' : '#ff4d6d'}}>{myHp}</b></span>
        <span>Others <b>{remoteCount}</b></span>
        <span style={{marginLeft: 'auto', color: 'var(--text-mute)'}}>{me.name}</span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="arena-canvas"/>
      </div>
      {status !== 'playing' && (
        <div className="arena-bar">
          <span style={{color: status === 'won' ? 'var(--accent)' : '#ff4d6d', fontWeight: 700}}>
            {status === 'won' ? `Arena cleared · ${myKills} kills` : 'Eliminated · respawn incoming'}
          </span>
          {status === 'won' && (
            <button className="btn btn-primary btn-sm" onClick={restart}>New round</button>
          )}
        </div>
      )}
      <div className="arena-hint">WASD to move · aim with mouse · click or space to fire · first to {WIN_KILLS} kills wins</div>
    </div>
  );
}
