// TRACE — original precision platformer.
//
//  • Six hand-designed rooms. Each fits one screen (800×500).
//  • Run, jump, wall-slide, wall-jump. Coyote time (120 ms) and jump
//    buffering (110 ms) keep controls forgiving.
//  • Touch spikes or saws = instant restart of the current room.
//  • Reach the green flag = next room. After room 6 = run is done;
//    score = max(0, 2000 − seconds × 5 − deaths × 40).

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 800;
const H = 500;
const T = 40;                          // tile size
const P_W = 22, P_H = 30;              // player AABB
const G = 1750;                        // gravity px/s²
const WALK_MAX = 240;
const AIR_ACCEL = 1500;
const GROUND_ACCEL = 2200;
const GROUND_FRICTION = 1900;
const JUMP_V = -540;
const WALLJUMP_VX = 340;
const WALLJUMP_VY = -480;
const WALL_SLIDE_MAX = 120;
const COYOTE = 0.12;
const BUFFER = 0.11;
const RESPAWN_DELAY = 0.18;

// Rooms: grid[row][col] — each cell is 'S' solid, '#' wall (same as S,
// kept for readability), '.' empty, 'x' spike (half tile, top-facing),
// 'G' goal flag, 'P' player spawn. Saws are authored separately per room.
const ROOMS = [
  { // 1 — Tutorial: just jump a pit.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...................G',
      '....................',
      '....................',
      '....................',
      '..P.................',
      '#####..........#####',
      'SSSSS####xx####SSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [],
    tip: 'A → left · D → right · Space → jump',
  },
  { // 2 — Low wall + spike floor.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...............G....',
      '....................',
      '..........##........',
      '..........##........',
      '..P.......##........',
      '####.....####....####',
      'SSSSxxxxxSSSSxxxxSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [],
    tip: 'Short hops clear the spikes. Don\'t over-commit.',
  },
  { // 3 — Saw blade alley.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...................G',
      '....................',
      '....................',
      '....................',
      '..P.................',
      '####################',
      'SSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [
      { x: 7 * T, y: 9 * T, r: 18 },
      { x: 12 * T, y: 9 * T, r: 18 },
    ],
    tip: 'Saws spin. Your timing is worse than you think.',
  },
  { // 4 — Wall-jump chimney.
    grid: [
      '....................',
      '#........G..........',
      '##..................',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##.........##.......',
      '##P........##.......',
      '########....########',
      'SSSSSSSSxxxxSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [],
    tip: 'Hug the wall mid-air — press jump to launch off.',
  },
  { // 5 — Multi-saw timing.
    grid: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '...................G',
      '............######..',
      '....................',
      '..P..###............',
      '####.###..####..####',
      'SSSSxSSSSxSSSSxxSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [
      { x: 9 * T, y: 6 * T, r: 18 },
      { x: 15 * T, y: 5 * T, r: 18 },
    ],
    tip: 'Read the saws. Wait, jump, land, repeat.',
  },
  { // 6 — Final: chimney + saws + a long jump.
    grid: [
      '....................',
      '#.................G.',
      '##................##',
      '##................##',
      '##.........##.....##',
      '##.........##.....##',
      '##.........##.....##',
      '##.........##.....##',
      '##.........##.....##',
      '##P........##.....##',
      '########......######',
      'SSSSSSSSxxxxxxSSSSSS',
      'SSSSSSSSSSSSSSSSSSSS',
    ],
    saws: [
      { x: 14 * T, y: 7 * T, r: 18 },
    ],
    tip: 'Everything you\'ve learned. One run.',
  },
];

function parseRoom(idx) {
  const room = ROOMS[idx];
  const tiles = [];
  let spawn = { x: 80, y: 300 };
  let goal = { x: 700, y: 200 };
  for (let r = 0; r < room.grid.length; r++) {
    const row = room.grid[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      const x = c * T, y = r * T;
      if (ch === 'S' || ch === '#') tiles.push({ x, y, w: T, h: T, kind: 'solid' });
      else if (ch === 'x')           tiles.push({ x, y: y + T - 14, w: T, h: 14, kind: 'spike' });
      else if (ch === 'P')           spawn = { x: x + T / 2, y: y + T / 2 };
      else if (ch === 'G')           goal  = { x: x + T / 2, y: y + T / 2 };
    }
  }
  return { tiles, saws: room.saws, spawn, goal, tip: room.tip };
}

export default function TraceGame() {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);
  const [roomIdx, setRoomIdx] = useState(0);
  const [deaths, setDeaths]   = useState(0);
  const [time, setTime]       = useState(0);
  const [tip, setTip]         = useState(ROOMS[0].tip);
  const [status, setStatus]   = useState('playing'); // playing | won

  const loadRoom = (idx) => {
    const parsed = parseRoom(idx);
    stateRef.current = {
      room: parsed,
      player: {
        x: parsed.spawn.x - P_W / 2,
        y: parsed.spawn.y - P_H / 2,
        vx: 0, vy: 0,
        onGround: false,
        coyote: 0, buffer: 0, jumpDown: false,
        wall: 0,           // -1 left wall, 0 none, 1 right wall
        respawnIn: 0,
        dead: false,
      },
      sawT: 0,
      elapsed: 0,
    };
    setTip(ROOMS[idx].tip);
  };

  useEffect(() => {
    loadRoom(roomIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') {
        // Restart room
        loadRoom(roomIdx);
      }
    };
    const ku = (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const solidAt = (tiles, x, y, w, h) => {
      for (const t of tiles) {
        if (t.kind !== 'solid') continue;
        if (x < t.x + t.w && x + w > t.x && y < t.y + t.h && y + h > t.y) return t;
      }
      return null;
    };
    const hazardAt = (tiles, x, y, w, h) => {
      for (const t of tiles) {
        if (t.kind !== 'spike') continue;
        if (x < t.x + t.w && x + w > t.x && y < t.y + t.h && y + h > t.y) return true;
      }
      return false;
    };
    const hitSaw = (saws, cx, cy, pw, ph, sawT) => {
      for (const s of saws) {
        const d = Math.hypot((cx + pw / 2) - s.x, (cy + ph / 2) - s.y);
        if (d < s.r + 8) return true;
      }
      return false;
    };

    const kill = () => {
      const s = stateRef.current; if (!s || s.player.dead) return;
      s.player.dead = true;
      s.player.respawnIn = RESPAWN_DELAY;
      setDeaths((d) => d + 1);
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { room, player, sawT } = s;

      // background gradient — soft paper → slate
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#f3efe8');
      grad.addColorStop(1, '#d9d2c4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // graph-paper
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += T / 2) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += T / 2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // solid tiles
      room.tiles.forEach((t) => {
        if (t.kind === 'solid') {
          ctx.fillStyle = '#0a0d0e';
          ctx.fillRect(t.x, t.y, t.w, t.h);
        }
      });
      // spikes
      room.tiles.forEach((t) => {
        if (t.kind === 'spike') {
          ctx.fillStyle = '#c91e1e';
          const steps = Math.floor(t.w / 10);
          ctx.beginPath();
          ctx.moveTo(t.x, t.y + t.h);
          for (let i = 0; i < steps; i++) {
            const x1 = t.x + i * 10;
            ctx.lineTo(x1 + 5, t.y);
            ctx.lineTo(x1 + 10, t.y + t.h);
          }
          ctx.closePath();
          ctx.fill();
        }
      });
      // goal flag
      const g = room.goal;
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y + 16);
      ctx.lineTo(g.x, g.y - 36);
      ctx.stroke();
      ctx.fillStyle = '#35f0c9';
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - 36);
      ctx.lineTo(g.x + 26, g.y - 28);
      ctx.lineTo(g.x, g.y - 20);
      ctx.closePath();
      ctx.fill();

      // saws
      room.saws.forEach((saw) => {
        ctx.save();
        ctx.translate(saw.x, saw.y);
        ctx.rotate(sawT * 6);
        ctx.fillStyle = '#9aa0a8';
        for (let k = 0; k < 10; k++) {
          const a = (k * 36) * Math.PI / 180;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
          ctx.lineTo(Math.cos(a + 0.2) * (saw.r + 4), Math.sin(a + 0.2) * (saw.r + 4));
          ctx.lineTo(Math.cos(a + 0.4) * 12, Math.sin(a + 0.4) * 12);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0d0e';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // player (stickman)
      if (!player.dead) {
        const px = player.x + P_W / 2;
        const py = player.y + P_H / 2;
        ctx.strokeStyle = '#0a0d0e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        // head
        ctx.fillStyle = '#0a0d0e';
        ctx.beginPath();
        ctx.arc(px, py - P_H / 2 + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.beginPath();
        ctx.moveTo(px, py - P_H / 2 + 12);
        ctx.lineTo(px, py + 4);
        ctx.stroke();
        // legs
        const legAng = player.onGround && Math.abs(player.vx) > 20 ? Math.sin(sawT * 14) * 0.6 : 0.2;
        ctx.beginPath();
        ctx.moveTo(px, py + 4);
        ctx.lineTo(px - 8 - legAng * 3, py + P_H / 2);
        ctx.moveTo(px, py + 4);
        ctx.lineTo(px + 8 + legAng * 3, py + P_H / 2);
        ctx.stroke();
        // arms
        ctx.beginPath();
        ctx.moveTo(px, py - 4);
        ctx.lineTo(px - 10, py + 2);
        ctx.moveTo(px, py - 4);
        ctx.lineTo(px + 10, py + 2);
        ctx.stroke();
        // motion tail
        if (Math.abs(player.vx) > 120) {
          ctx.strokeStyle = '#35f0c9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - Math.sign(player.vx) * 14, py - 6);
          ctx.lineTo(px - Math.sign(player.vx) * 24, py - 2);
          ctx.stroke();
        }
      }
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s || status !== 'playing') return;

      s.sawT += dt;
      s.elapsed += dt;

      const p = s.player;

      if (p.dead) {
        p.respawnIn -= dt;
        if (p.respawnIn <= 0) {
          const sp = s.room.spawn;
          p.x = sp.x - P_W / 2; p.y = sp.y - P_H / 2;
          p.vx = 0; p.vy = 0; p.dead = false; p.wall = 0;
          p.coyote = 0; p.buffer = 0;
        }
        draw();
        return;
      }

      // Input
      const left  = keys['a'] || keys['arrowleft']  || keys['keya'];
      const right = keys['d'] || keys['arrowright'] || keys['keyd'];
      const jumpDown = keys[' '] || keys['space'] || keys['w'] || keys['arrowup'];
      if (jumpDown && !p.jumpDown) p.buffer = BUFFER;
      p.jumpDown = jumpDown;

      // Horizontal movement
      const accel = p.onGround ? GROUND_ACCEL : AIR_ACCEL;
      if (left)  p.vx -= accel * dt;
      if (right) p.vx += accel * dt;
      if (!left && !right && p.onGround) {
        const drop = GROUND_FRICTION * dt;
        if (Math.abs(p.vx) <= drop) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * drop;
      }
      p.vx = Math.max(-WALK_MAX, Math.min(WALK_MAX, p.vx));

      // Gravity / wall-slide
      p.vy += G * dt;
      if (p.wall !== 0 && p.vy > WALL_SLIDE_MAX && ((p.wall < 0 && left) || (p.wall > 0 && right))) {
        p.vy = WALL_SLIDE_MAX;
      }
      p.vy = Math.min(p.vy, 1400);

      // Jump consumption
      const canJump = p.onGround || p.coyote > 0;
      if (p.buffer > 0) {
        if (canJump) {
          p.vy = JUMP_V;
          p.onGround = false;
          p.coyote = 0;
          p.buffer = 0;
        } else if (p.wall !== 0) {
          p.vy = WALLJUMP_VY;
          p.vx = -p.wall * WALLJUMP_VX;
          p.wall = 0;
          p.buffer = 0;
        }
      }
      p.buffer -= dt;
      p.coyote -= dt;

      // Jump release dampen
      if (!jumpDown && p.vy < 0) p.vy *= 0.86;

      // Horizontal collision
      const tiles = s.room.tiles;
      const wasGround = p.onGround;
      p.x += p.vx * dt;
      let hit = solidAt(tiles, p.x, p.y, P_W, P_H);
      if (hit) {
        if (p.vx > 0) { p.x = hit.x - P_W; p.wall = 1; }
        else if (p.vx < 0) { p.x = hit.x + hit.w; p.wall = -1; }
        p.vx = 0;
      } else {
        // Check touching a wall (immediately to left or right by 1px).
        const leftHit  = solidAt(tiles, p.x - 1, p.y, P_W, P_H);
        const rightHit = solidAt(tiles, p.x + 1, p.y, P_W, P_H);
        p.wall = rightHit ? 1 : leftHit ? -1 : 0;
      }

      // Vertical collision
      p.y += p.vy * dt;
      hit = solidAt(tiles, p.x, p.y, P_W, P_H);
      p.onGround = false;
      if (hit) {
        if (p.vy > 0) { p.y = hit.y - P_H; p.onGround = true; }
        else if (p.vy < 0) { p.y = hit.y + hit.h; }
        p.vy = 0;
      }
      if (wasGround && !p.onGround) p.coyote = COYOTE;

      // Off-world = death
      if (p.y > H + 80 || p.x < -80 || p.x > W + 80) kill();

      // Hazard checks
      if (hazardAt(tiles, p.x, p.y, P_W, P_H)) kill();
      if (hitSaw(s.room.saws, p.x, p.y, P_W, P_H, s.sawT)) kill();

      // Goal
      const gd = Math.hypot((p.x + P_W / 2) - s.room.goal.x, (p.y + P_H / 2) - s.room.goal.y);
      if (gd < 22) {
        if (roomIdx + 1 >= ROOMS.length) {
          setStatus('won');
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(2000 - s.elapsed * 5 - deaths * 40));
            submitScore('vex', score, { time: Math.round(s.elapsed), deaths });
          }
        } else {
          setRoomIdx((i) => i + 1);
          return; // effect will reload
        }
      }

      // HUD update at ~4Hz
      if ((s.sawT * 4 | 0) !== (s._lastHud | 0)) {
        s._lastHud = s.sawT * 4;
        setTime(Math.round(s.elapsed));
      }

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdx, status]);

  const restart = () => {
    submittedRef.current = false;
    setDeaths(0);
    setRoomIdx(0);
    setStatus('playing');
    setTime(0);
  };

  return (
    <div className="trace">
      <div className="trace-bar">
        <span>Room <b style={{color:'var(--accent)'}}>{Math.min(ROOMS.length, roomIdx + 1)}</b>/{ROOMS.length}</span>
        <span>Deaths <b>{deaths}</b></span>
        <span>Time <b>{time}s</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <canvas ref={canvasRef} className="trace-canvas" width={W} height={H}/>
      {status === 'won' ? (
        <div className="trace-tip" style={{color:'var(--accent)', fontWeight:700}}>
          Cleared · {deaths} death{deaths === 1 ? '' : 's'} · {time}s
        </div>
      ) : (
        <div className="trace-tip">{tip}</div>
      )}
      <div className="trace-hint">A/D move · Space jump · hug wall + jump = wall-jump · R restart room</div>
    </div>
  );
}
