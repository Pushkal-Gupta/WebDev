import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase.js';
import { submitScore } from '../scoreBus.js';
import { sizeCanvas } from '../util/canvasDpr.js';

const W = 720;
const H = 440;
const PLAYER_R = 12;
const BULLET_R = 3;
const BULLET_SPEED = 5.2;
const BULLET_LIFE = 90;
const MOVE = 2.2;
const BOT_COUNT = 3;
const MAX_HP = 3;
const WIN_KILLS = 5;

const WALLS = [
  // x, y, w, h
  [40, 40, 640, 20],   // top
  [40, 380, 640, 20],  // bottom
  [40, 40, 20, 360],   // left
  [660, 40, 20, 360],  // right
  [200, 140, 80, 20],
  [440, 280, 80, 20],
  [340, 190, 40, 60],
  [150, 260, 20, 60],
  [550, 140, 20, 60],
];

const COLORS = ['#00fff5', '#ff4d6d', '#ffe14f', '#35f0c9', '#a78bfa', '#ff8a3a', '#6fbf2a', '#35c7f5'];
const NAMES = ['Vega', 'Quill', 'Nova', 'Rune', 'Solo', 'Kite', 'Dune', 'Echo', 'Sage', 'Ranger'];
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const pickName = () => NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(10 + Math.random() * 89);

const randSpawn = () => {
  // Keep away from center
  while (true) {
    const x = 80 + Math.random() * (W - 160);
    const y = 80 + Math.random() * (H - 160);
    if (!collidesWall(x, y, PLAYER_R)) return { x, y };
  }
};

function collidesWall(x, y, r) {
  for (const [wx, wy, ww, wh] of WALLS) {
    const cx = Math.max(wx, Math.min(x, wx + ww));
    const cy = Math.max(wy, Math.min(y, wy + wh));
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}

function segmentHitsWall(x1, y1, x2, y2) {
  // Step-sample segment; cheap but adequate for small bullets
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (collidesWall(x, y, BULLET_R)) return true;
  }
  return false;
}

// ── bot AI ────────────────────────────────────────────────────
function stepBot(bot, targets) {
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
    if (!collidesWall(nx, bot.y, PLAYER_R)) bot.x = nx;
    if (!collidesWall(bot.x, ny, PLAYER_R)) bot.y = ny;
  } else if (bestD < 70) {
    // back off
    const nx = bot.x - Math.cos(ang) * MOVE * 0.4;
    const ny = bot.y - Math.sin(ang) * MOVE * 0.4;
    if (!collidesWall(nx, bot.y, PLAYER_R)) bot.x = nx;
    if (!collidesWall(bot.x, ny, PLAYER_R)) bot.y = ny;
  }
  // Strafe randomly
  bot.strafeTick = (bot.strafeTick || 0) + 1;
  if (bot.strafeTick % 45 === 0) bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
  const sx = bot.x + Math.cos(ang + Math.PI / 2) * MOVE * 0.45 * (bot.strafeDir || 0);
  const sy = bot.y + Math.sin(ang + Math.PI / 2) * MOVE * 0.45 * (bot.strafeDir || 0);
  if (!collidesWall(sx, bot.y, PLAYER_R)) bot.x = sx;
  if (!collidesWall(bot.x, sy, PLAYER_R)) bot.y = sy;
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

  // Init game state once
  useEffect(() => {
    const spawn = randSpawn();
    stateRef.current = {
      me: { x: spawn.x, y: spawn.y, angle: 0, hp: MAX_HP, kills: 0, fireCd: 0, deadUntil: 0 },
      keys: {},
      mouse: { x: W / 2, y: H / 2, down: false },
      bullets: [],
      bots: Array.from({ length: BOT_COUNT }).map((_, i) => {
        const p = randSpawn();
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
      const cur = s.remotes.get(id) || { x: W / 2, y: H / 2, angle: 0, hp: MAX_HP, kills: 0, color: '#fff', name: 'Player' };
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
    const ctx = sizeCanvas(canvas, W, H);

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
      const r = canvas.getBoundingClientRect();
      s.mouse.x = (e.clientX - r.left) * (W / r.width);
      s.mouse.y = (e.clientY - r.top) * (H / r.height);
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

      // background
      ctx.fillStyle = '#0a1116';
      ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // walls
      ctx.fillStyle = '#1a2630';
      ctx.strokeStyle = '#2a3a46';
      ctx.lineWidth = 2;
      WALLS.forEach(([x, y, w, h]) => {
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
      // me
      if (s.me.hp > 0) drawEntity(s.me.x, s.me.y, s.me.angle, me.color, s.me.hp, me.name + ' (you)', true);

      // bullets
      s.bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
        ctx.fillStyle = b.remote ? '#ff4d6d' : '#ffe14f';
        ctx.fill();
      });
    };

    const step = () => {
      const s = stateRef.current; if (!s) { raf = requestAnimationFrame(step); return; }

      // Respawn
      if (s.me.hp <= 0 && performance.now() > s.me.deadUntil) {
        const p = randSpawn();
        s.me.x = p.x; s.me.y = p.y;
        s.me.hp = MAX_HP;
        setMyHp(MAX_HP);
        setStatus('playing');
      }

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
            if (!collidesWall(nx, you.y, PLAYER_R)) you.x = nx;
            if (!collidesWall(you.x, ny, PLAYER_R)) you.y = ny;
          }
          you.angle = Math.atan2(mouse.y - you.y, mouse.x - you.x);
          if (you.fireCd > 0) you.fireCd--;
          if ((mouse.down || keys[' '] || keys['space']) && you.fireCd === 0) fireMine();
        }

        // Bots
        s.bots.forEach((b) => {
          if (b.hp <= 0) return;
          const targets = [s.me, ...s.bots.filter((x) => x !== b), ...Array.from(s.remotes.values())];
          const result = stepBot(b, targets);
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
          if (b.life <= 0 || segmentHitsWall(prevX, prevY, b.x, b.y)) {
            s.bullets.splice(i, 1);
            continue;
          }
          // Hit me?
          if (b.from !== me.id && s.me.hp > 0 && Math.hypot(b.x - s.me.x, b.y - s.me.y) < PLAYER_R + BULLET_R) {
            // Local bullet from bot hits me; remote bullets don't damage here (remote says hit via event)
            if (!b.remote) {
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
                    if (!stateRef.current) return;
                    const p = randSpawn();
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
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      canvas.removeEventListener('mousemove', mm);
      canvas.removeEventListener('mousedown', md);
      window.removeEventListener('mouseup', mu);
    };
  }, [me, status]);

  const restart = () => {
    const s = stateRef.current; if (!s) return;
    const p = randSpawn();
    s.me.x = p.x; s.me.y = p.y; s.me.hp = MAX_HP; s.me.kills = 0;
    s.bullets = [];
    s.bots.forEach((b, i) => { const sp = randSpawn(); b.x = sp.x; b.y = sp.y; b.hp = MAX_HP; });
    setMyHp(MAX_HP);
    setMyKills(0);
    setStatus('playing');
  };

  return (
    <div className="arena">
      <div className="arena-bar">
        <span>Kills <b style={{color: 'var(--accent)'}}>{myKills}</b>/{WIN_KILLS}</span>
        <span>HP <b style={{color: myHp > 1 ? 'var(--text)' : '#ff4d6d'}}>{myHp}</b></span>
        <span>Others <b>{remoteCount}</b></span>
        <span style={{marginLeft: 'auto', color: 'var(--text-mute)'}}>{me.name}</span>
      </div>
      <canvas ref={canvasRef} className="arena-canvas" width={W} height={H}/>
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
