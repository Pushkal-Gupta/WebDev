import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

const W = 780;
const H = 400;
const GROUND = 330;
const TREE_SPACING = 170;
const TREE_COUNT = 25;
const LEVEL_LEN = 200 + TREE_COUNT * TREE_SPACING + 200;
const GOAL_X = LEVEL_LEN - 120;
const PLAYER_R = 12;

// Forest (0) → Dark Swamp (after tree 12)
const biomeOf = (i) => (i < 12 ? 'forest' : 'swamp');

// 10 trap kinds, each with a distinct trigger range and tell.
const TRAP_KINDS = ['punch', 'cannon', 'log', 'spike', 'saw', 'arrow', 'boulder', 'bees', 'thwomp', 'pit'];

// Human-readable labels used in the death recap card.
const TRAP_LABELS = {
  punch:   'branch to the ribs',
  cannon:  'woody cannonball',
  log:     'falling log',
  spike:   'spike trap',
  saw:     'chained saw blade',
  arrow:   'bramble arrow',
  boulder: 'rolling boulder',
  bees:    'swarm of hostile bees',
  thwomp:  'sentient stone',
  pit:     'trapdoor pit',
};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const BASE_TREES = Array.from({ length: TREE_COUNT }).map((_, i) => ({
  x: 200 + i * TREE_SPACING,
  biome: biomeOf(i),
}));

const CHECKPOINTS = [
  { x: BASE_TREES[6].x + 60 },
  { x: BASE_TREES[12].x + 60 },
  { x: BASE_TREES[18].x + 60 },
];

const initTrees = (armedCount) => {
  const order = BASE_TREES.map((_, i) => i).sort(() => Math.random() - 0.5);
  const armed = new Set(order.slice(0, Math.min(armedCount, TREE_COUNT - 1)));
  return BASE_TREES.map((t, i) => ({
    ...t,
    trap: armed.has(i) ? pick(TRAP_KINDS) : null,
    triggered: false,
    anim: 0,
    ballX: 0, ballY: 0, ballVX: 0, ballVY: 0,
    logY: 0,
    sawAngle: 0,
    sawSwing: rand(-1, 1) > 0 ? 1 : -1,
    spikeActive: false,
    spikeTimer: 0,
    arrows: [],
    arrowTimer: 0,
    boulderX: 0, boulderY: 0, boulderVX: 0, boulderR: 18,
    bees: [],
    thwompY: 0, thwompState: 'rising', thwompTimer: 0,
    pitOpen: false, pitTimer: 0,
  }));
};

export default function GrudgewoodGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [deaths, setDeaths] = useState(0);
  const [best, setBest] = useState(Infinity);
  const [checkpoint, setCheckpoint] = useState(0); // index into CHECKPOINTS+1 (0 = start)
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'dead'
  const [lastTrap, setLastTrap] = useState(null);
  const startTimeRef = useRef(performance.now());
  const deathsRef = useRef(0);
  const checkpointRef = useRef(0);

  useEffect(() => { deathsRef.current = deaths; }, [deaths]);
  useEffect(() => { checkpointRef.current = checkpoint; }, [checkpoint]);

  const reset = (freshDeathCount = 0, fromCheckpoint = 0) => {
    const armed = Math.min(5 + freshDeathCount, TREE_COUNT - 2);
    const startX = fromCheckpoint === 0 ? 80 : CHECKPOINTS[fromCheckpoint - 1].x;
    stateRef.current = {
      player: { x: startX, y: GROUND - PLAYER_R, vx: 0, vy: 0, onGround: true, flash: 0, coyote: 0, jumpBuffer: 0, jumpWasDown: false },
      trees: initTrees(armed),
      camera: 0,
      shake: 0,
      particles: [],
      dustTick: 0,
    };
    startTimeRef.current = performance.now();
    setStatus('playing');
  };

  useEffect(() => { reset(0, 0); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const keys = { left: false, right: false, jump: false };
    const kd = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { keys.jump = true; e.preventDefault(); }
      if (e.key === 'r' || e.key === 'R') { setDeaths(0); setCheckpoint(0); reset(0, 0); }
    };
    const ku = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.jump = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const kill = (byTrap) => {
      if (status !== 'playing') return;
      const nextDeaths = deathsRef.current + 1;
      setDeaths(nextDeaths);
      setLastTrap(byTrap || 'the grove');
      setStatus('dead');
      const s = stateRef.current;
      if (s) {
        s.shake = 16;
        for (let i = 0; i < 22; i++) {
          s.particles.push({
            x: s.player.x, y: s.player.y,
            vx: rand(-3.5, 3.5), vy: rand(-7, -1),
            life: 40 + Math.random() * 24, color: i % 2 ? '#ff4d6d' : '#c91e1e',
          });
        }
      }
      setTimeout(() => reset(nextDeaths, checkpointRef.current), 1100);
    };

    const win = () => {
      if (status !== 'playing') return;
      const t = (performance.now() - startTimeRef.current) / 1000;
      setBest((b) => Math.min(b, deathsRef.current));
      setStatus('won');
      const score = Math.max(0, Math.round(900 - deathsRef.current * 22 - t));
      submitScore('grudgewood', score, { deaths: deathsRef.current, time: Math.round(t), checkpoint: checkpointRef.current });
    };

    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }

      if (status === 'playing') {
        const p = s.player;

        // Movement
        const accel = 0.48;
        const friction = 0.82;
        if (keys.left)  p.vx -= accel;
        if (keys.right) p.vx += accel;
        p.vx *= friction;
        if (Math.abs(p.vx) < 0.02) p.vx = 0;
        p.vx = Math.max(-4.0, Math.min(4.0, p.vx));

        // Jump buffer + coyote time.
        //   • jumpBuffer: remember jump press for ~8 frames so you can press
        //     slightly early and still get the jump when you land.
        //   • coyote: allow jump for ~7 frames after walking off a ledge.
        if (keys.jump && !p.jumpWasDown) { p.jumpBuffer = 8; }
        p.jumpWasDown = keys.jump;
        if (p.jumpBuffer > 0) p.jumpBuffer--;
        if (p.coyote > 0) p.coyote--;

        const canJump = p.onGround || p.coyote > 0;
        if (p.jumpBuffer > 0 && canJump) {
          p.vy = -7.8;
          p.onGround = false;
          p.coyote = 0;
          p.jumpBuffer = 0;
        }

        p.vy += 0.42;
        p.x += p.vx;
        p.y += p.vy;
        const wasGround = p.onGround;
        if (p.y >= GROUND - PLAYER_R) { p.y = GROUND - PLAYER_R; p.vy = 0; p.onGround = true; }
        else if (wasGround) { p.coyote = 7; p.onGround = false; }
        p.x = Math.max(0, Math.min(LEVEL_LEN - 20, p.x));

        const cam = Math.max(0, Math.min(p.x - W / 2 + 100, LEVEL_LEN - W));
        s.camera = cam;

        // Running dust
        if (p.onGround && Math.abs(p.vx) > 1.5) {
          s.dustTick++;
          if (s.dustTick % 4 === 0) {
            s.particles.push({
              x: p.x - Math.sign(p.vx) * 10, y: GROUND - 2,
              vx: -p.vx * 0.1, vy: -0.3,
              life: 16, color: 'rgba(140,120,90,0.5)',
            });
          }
        }

        // Checkpoint touches
        CHECKPOINTS.forEach((cp, i) => {
          if (checkpointRef.current <= i && Math.abs(p.x - cp.x) < 22) {
            setCheckpoint(i + 1);
          }
        });

        // Trees
        s.trees.forEach((t) => {
          if (t.trap && !t.triggered) {
            const range = {
              arrow: 170, bees: 140, cannon: 115, pit: 60,
              boulder: 120, thwomp: 90, saw: 95,
            }[t.trap] ?? 80;
            if (Math.abs(p.x - t.x) < range) {
              t.triggered = true;
              t.anim = 0;
              if (t.trap === 'cannon') {
                const dir = p.x < t.x ? -1 : 1;
                t.ballX = t.x;
                t.ballY = GROUND - 140;
                t.ballVX = 5.0 * dir;
                t.ballVY = -1.6;
              }
              if (t.trap === 'log') { t.logY = -30; }
              if (t.trap === 'spike') { t.spikeActive = false; t.spikeTimer = 26; }
              if (t.trap === 'saw') { t.sawAngle = 0; }
              if (t.trap === 'arrow') { t.arrowTimer = 18; }
              if (t.trap === 'boulder') {
                const dir = p.x < t.x ? -1 : 1;
                t.boulderX = t.x;
                t.boulderY = GROUND - 22;
                t.boulderVX = 2.8 * dir;
              }
              if (t.trap === 'bees') {
                for (let i = 0; i < 6; i++) {
                  t.bees.push({
                    x: t.x + rand(-20, 20),
                    y: GROUND - 150 + rand(-10, 10),
                    vx: 0, vy: 0,
                  });
                }
              }
              if (t.trap === 'thwomp') { t.thwompY = -80; t.thwompState = 'rising'; t.thwompTimer = 30; }
              if (t.trap === 'pit') { t.pitOpen = true; t.pitTimer = 0; }
            }
          }

          if (!t.triggered) return;
          t.anim += 1 / 30;

          if (t.trap === 'punch') {
            if (t.anim > 0.2 && t.anim < 0.55) {
              if (Math.abs(p.x - t.x) < 62 && p.y > GROUND - 56) kill(t.trap);
            }
          }
          if (t.trap === 'cannon') {
            t.ballX += t.ballVX;
            t.ballY += t.ballVY;
            t.ballVY += 0.22;
            if (Math.hypot(t.ballX - p.x, t.ballY - p.y) < PLAYER_R + 10) kill(t.trap);
          }
          if (t.trap === 'log') {
            t.logY += 8;
            if (t.logY > 150 && Math.abs(p.x - t.x) < 40 && p.y > GROUND - 40) kill(t.trap);
          }
          if (t.trap === 'spike') {
            t.spikeTimer--;
            if (t.spikeTimer <= 0 && !t.spikeActive) t.spikeActive = true;
            if (t.spikeActive && Math.abs(p.x - t.x) < 32 && p.y > GROUND - 30) kill(t.trap);
          }
          if (t.trap === 'saw') {
            t.sawAngle += 0.09;
            const sx = t.x + Math.sin(t.sawAngle) * 96;
            const sy = GROUND - 94;
            if (Math.hypot(sx - p.x, sy - p.y) < PLAYER_R + 18) kill(t.trap);
            t.lastSawX = sx; t.lastSawY = sy;
          }
          if (t.trap === 'arrow') {
            t.arrowTimer--;
            if (t.arrowTimer <= 0) {
              const dir = p.x < t.x ? -1 : 1;
              t.arrows.push({ x: t.x, y: GROUND - 85, vx: 7.0 * dir });
              t.arrowTimer = 52;
            }
            for (let i = t.arrows.length - 1; i >= 0; i--) {
              const a = t.arrows[i];
              a.x += a.vx;
              if (Math.abs(a.x - p.x) < PLAYER_R && Math.abs(a.y - p.y) < PLAYER_R + 4) kill(t.trap);
              if (a.x < -20 || a.x > LEVEL_LEN + 20) t.arrows.splice(i, 1);
            }
          }
          if (t.trap === 'boulder') {
            t.boulderX += t.boulderVX;
            if (Math.hypot(t.boulderX - p.x, t.boulderY - p.y) < PLAYER_R + 16) kill(t.trap);
          }
          if (t.trap === 'bees') {
            t.bees.forEach((b, i) => {
              const jitter = 0.25;
              const toX = p.x + rand(-20, 20), toY = p.y - 6 + rand(-20, 20);
              b.vx += (toX - b.x) * 0.002 + rand(-jitter, jitter);
              b.vy += (toY - b.y) * 0.002 + rand(-jitter, jitter);
              b.vx *= 0.94; b.vy *= 0.94;
              b.x += b.vx; b.y += b.vy;
              if (Math.hypot(b.x - p.x, b.y - p.y) < PLAYER_R + 4) kill(t.trap);
            });
            // Despawn after a while
            if (t.anim > 4) t.bees = [];
          }
          if (t.trap === 'thwomp') {
            t.thwompTimer--;
            if (t.thwompState === 'rising' && t.thwompTimer <= 0) {
              t.thwompState = 'falling';
            }
            if (t.thwompState === 'falling') {
              t.thwompY += 14;
              if (t.thwompY > 130) {
                t.thwompY = 130;
                t.thwompState = 'sit';
                s.shake = Math.max(s.shake, 10);
              }
            }
            if (t.thwompY > 70 && Math.abs(p.x - t.x) < 28 && p.y > GROUND - 40) kill(t.trap);
          }
          if (t.trap === 'pit') {
            t.pitTimer++;
            if (t.pitTimer > 8 && Math.abs(p.x - t.x) < 18 && p.onGround) {
              kill('pit');
            }
          }
        });

        if (p.x >= GOAL_X) win();
      }

      // Particles
      s.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.25;
        pt.life--;
      });
      s.particles = s.particles.filter((pt) => pt.life > 0);

      if (s.shake > 0) s.shake--;

      // ── Render ─────────────────────────────────────────
      const cam = s.camera;
      const sx = (Math.random() - 0.5) * s.shake;
      const sy = (Math.random() - 0.5) * s.shake;
      ctx.save();
      ctx.translate(sx, sy);

      // Biome palette based on player x (for smooth transition)
      const biomeT = Math.min(1, Math.max(0, (s.player.x - BASE_TREES[10].x) / (BASE_TREES[14].x - BASE_TREES[10].x)));
      const mix = (c1, c2, t) => {
        const parse = (c) => c.match(/\d+/g).map(Number);
        const [r1, g1, b1] = parse(c1);
        const [r2, g2, b2] = parse(c2);
        return `rgb(${Math.round(r1 + (r2-r1)*t)},${Math.round(g1 + (g2-g1)*t)},${Math.round(b1 + (b2-b1)*t)})`;
      };
      const skyTop = mix('rgb(90,199,245)', 'rgb(30,40,60)', biomeT);
      const skyBot = mix('rgb(217,242,255)', 'rgb(52,65,88)', biomeT);
      const groundColor = mix('rgb(90,124,58)', 'rgb(42,58,40)', biomeT);
      const groundDark = mix('rgb(63,90,36)', 'rgb(22,36,28)', biomeT);

      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, skyTop);
      grad.addColorStop(0.7, skyBot);
      grad.addColorStop(1, groundDark);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Clouds (fade in swamp)
      ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - biomeT)})`;
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 380 - cam * 0.2) % (W + 400)) - 200;
        ctx.beginPath();
        ctx.ellipse(cx, 60 + (i % 3) * 20, 40, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Swamp fog
      if (biomeT > 0.3) {
        ctx.fillStyle = `rgba(80,100,120,${0.2 * (biomeT - 0.3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Distant parallax trees
      ctx.fillStyle = `rgba(30, 110, 50, ${0.45 * (1 - biomeT) + 0.15})`;
      for (let i = 0; i < 30; i++) {
        const x = ((i * 170 - cam * 0.4) % (LEVEL_LEN + 200));
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 28, 220);
        ctx.lineTo(x + 56, 300);
        ctx.closePath();
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = groundColor;
      ctx.fillRect(-cam, GROUND, LEVEL_LEN, H - GROUND);
      ctx.strokeStyle = groundDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-cam, GROUND); ctx.lineTo(LEVEL_LEN - cam, GROUND);
      ctx.stroke();
      // Grass tufts
      ctx.fillStyle = groundDark;
      for (let i = 0; i < 80; i++) {
        const gx = (i * 48) - cam;
        if (gx < -80 || gx > W + 80) continue;
        ctx.fillRect(gx, GROUND + 6, 2, 8);
        ctx.fillRect(gx + 14, GROUND + 10, 2, 6);
      }

      // Checkpoint flags
      CHECKPOINTS.forEach((cp, i) => {
        const cx = cp.x - cam;
        if (cx < -30 || cx > W + 30) return;
        const reached = checkpointRef.current > i;
        ctx.strokeStyle = reached ? '#35f0c9' : '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, GROUND); ctx.lineTo(cx, GROUND - 56);
        ctx.stroke();
        ctx.fillStyle = reached ? '#35f0c9' : 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(cx, GROUND - 56);
        ctx.lineTo(cx + 18, GROUND - 50);
        ctx.lineTo(cx, GROUND - 44);
        ctx.closePath();
        ctx.fill();
      });

      // Trees
      s.trees.forEach((t) => {
        const tx = t.x - cam;
        if (tx < -120 || tx > W + 120) return;
        const isSwamp = t.biome === 'swamp';
        // trunk
        ctx.fillStyle = isSwamp ? '#3a1f0a' : '#6b3a1a';
        ctx.fillRect(tx - 11, GROUND - 118, 22, 118);
        // canopy
        ctx.fillStyle = isSwamp ? '#1a3a1a' : '#2f6a2a';
        ctx.beginPath();
        ctx.arc(tx, GROUND - 142, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx - 30, GROUND - 122, 33, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx + 30, GROUND - 122, 33, 0, Math.PI * 2);
        ctx.fill();

        if (t.triggered) {
          ctx.fillStyle = '#ff4d6d';
          ctx.beginPath();
          ctx.arc(tx - 9, GROUND - 90, 3.8, 0, Math.PI * 2);
          ctx.arc(tx + 9, GROUND - 90, 3.8, 0, Math.PI * 2);
          ctx.fill();

          if (t.trap === 'punch' && t.anim < 0.7) {
            const dir = (t.anim < 0.5) ? 1 : -1;
            const swing = Math.sin(Math.min(1, t.anim * 2) * Math.PI) * 58;
            ctx.strokeStyle = '#8a4a1a';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, GROUND - 62);
            ctx.lineTo(tx + swing * dir, GROUND - 42);
            ctx.stroke();
            ctx.fillStyle = '#c08040';
            ctx.beginPath();
            ctx.arc(tx + swing * dir, GROUND - 42, 11, 0, Math.PI * 2);
            ctx.fill();
          }
          if (t.trap === 'cannon') {
            ctx.fillStyle = '#222';
            ctx.fillRect(tx - 14, GROUND - 150, 28, 16);
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(t.ballX - cam, t.ballY, 9, 0, Math.PI * 2);
            ctx.fill();
          }
          if (t.trap === 'log') {
            ctx.fillStyle = '#5a2a0a';
            ctx.fillRect(tx - 25, GROUND - 162 + t.logY, 50, 22);
            ctx.strokeStyle = '#3a1a05';
            ctx.strokeRect(tx - 25, GROUND - 162 + t.logY, 50, 22);
          }
          if (t.trap === 'spike') {
            if (t.spikeActive) {
              ctx.fillStyle = '#9aa0a8';
              for (let i = -2; i <= 2; i++) {
                const bx = tx + i * 11;
                ctx.beginPath();
                ctx.moveTo(bx - 5, GROUND);
                ctx.lineTo(bx, GROUND - 24);
                ctx.lineTo(bx + 5, GROUND);
                ctx.closePath();
                ctx.fill();
              }
            } else {
              ctx.fillStyle = '#6b4a1a';
              ctx.fillRect(tx - 14, GROUND - 3, 28, 3);
            }
          }
          if (t.trap === 'saw') {
            const sawX = t.lastSawX ?? t.x;
            const sawY = t.lastSawY ?? GROUND - 94;
            const sx = sawX - cam;
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx, GROUND - 172);
            ctx.lineTo(sx, sawY);
            ctx.stroke();
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.arc(sx, sawY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9aa0a8';
            for (let k = 0; k < 10; k++) {
              const a = (k * 36 + t.sawAngle * 120) * Math.PI / 180;
              ctx.beginPath();
              ctx.moveTo(sx + Math.cos(a) * 12, sawY + Math.sin(a) * 12);
              ctx.lineTo(sx + Math.cos(a + 0.2) * 22, sawY + Math.sin(a + 0.2) * 22);
              ctx.lineTo(sx + Math.cos(a + 0.4) * 12, sawY + Math.sin(a + 0.4) * 12);
              ctx.closePath();
              ctx.fill();
            }
          }
          if (t.trap === 'arrow') {
            t.arrows.forEach((a) => {
              const ax = a.x - cam;
              ctx.fillStyle = '#9aa0a8';
              ctx.beginPath();
              const tip = Math.sign(a.vx);
              ctx.moveTo(ax + 4 * tip, a.y);
              ctx.lineTo(ax - 4 * tip, a.y - 3);
              ctx.lineTo(ax - 4 * tip, a.y + 3);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#5a3a1a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(ax, a.y);
              ctx.lineTo(ax - 12 * tip, a.y);
              ctx.stroke();
            });
          }
          if (t.trap === 'boulder') {
            const bx = t.boulderX - cam;
            ctx.fillStyle = '#6a6a6a';
            ctx.beginPath();
            ctx.arc(bx, t.boulderY, t.boulderR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = 2;
            ctx.stroke();
            // spinning lines
            ctx.strokeStyle = '#444';
            const spin = t.boulderX * 0.08;
            for (let k = 0; k < 4; k++) {
              const a = (k * Math.PI / 2) + spin;
              ctx.beginPath();
              ctx.moveTo(bx + Math.cos(a) * 6, t.boulderY + Math.sin(a) * 6);
              ctx.lineTo(bx + Math.cos(a) * 14, t.boulderY + Math.sin(a) * 14);
              ctx.stroke();
            }
          }
          if (t.trap === 'bees') {
            t.bees.forEach((b) => {
              const bx = b.x - cam;
              ctx.fillStyle = '#ffe14f';
              ctx.beginPath();
              ctx.ellipse(bx, b.y, 4, 3, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(bx - 2, b.y); ctx.lineTo(bx + 2, b.y);
              ctx.stroke();
              // motion wings
              ctx.fillStyle = 'rgba(255,255,255,0.5)';
              ctx.fillRect(bx - 2, b.y - 4, 4, 1.5);
            });
          }
          if (t.trap === 'thwomp') {
            const thY = GROUND - 150 + t.thwompY;
            ctx.fillStyle = '#5a5a6a';
            ctx.fillRect(tx - 28, thY, 56, 40);
            ctx.fillStyle = '#3a3a4a';
            // eyes
            ctx.fillStyle = '#ff4d6d';
            ctx.beginPath();
            ctx.arc(tx - 10, thY + 16, 3, 0, Math.PI * 2);
            ctx.arc(tx + 10, thY + 16, 3, 0, Math.PI * 2);
            ctx.fill();
            // teeth
            ctx.fillStyle = '#fff';
            ctx.fillRect(tx - 14, thY + 28, 4, 6);
            ctx.fillRect(tx - 4, thY + 28, 4, 6);
            ctx.fillRect(tx + 6, thY + 28, 4, 6);
          }
          if (t.trap === 'pit') {
            // dark hole on the ground
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(tx, GROUND + 2, 18, 6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t.trap === 'spike') {
          ctx.fillStyle = '#4a3210';
          ctx.fillRect(tx - 10, GROUND - 2, 20, 2);
        }
      });

      // Goal flag
      const gx = GOAL_X - cam;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND); ctx.lineTo(gx, GROUND - 100);
      ctx.stroke();
      ctx.fillStyle = '#ffe14f';
      ctx.beginPath();
      ctx.moveTo(gx, GROUND - 100);
      ctx.lineTo(gx + 38, GROUND - 86);
      ctx.lineTo(gx, GROUND - 72);
      ctx.closePath();
      ctx.fill();

      // Particles
      s.particles.forEach((pt) => {
        ctx.globalAlpha = Math.min(1, pt.life / 30);
        ctx.fillStyle = pt.color;
        ctx.fillRect((pt.x - cam) - 2, pt.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      });

      // Player
      const px = s.player.x - cam;
      const py = s.player.y;
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(px, py - 2, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd1a6';
      ctx.beginPath();
      ctx.arc(px, py - 22, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath();
      ctx.arc(px - 2, py - 23, 1.3, 0, Math.PI * 2);
      ctx.arc(px + 3, py - 23, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (status === 'dead') {
        ctx.fillStyle = 'rgba(200, 30, 30, 0.35)';
        ctx.fillRect(0, 0, W, H);
      }
      if (status === 'won') {
        ctx.fillStyle = 'rgba(0, 255, 245, 0.18)';
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [status]);

  const cpText = checkpoint === 0 ? 'start' : `CP ${checkpoint}/${CHECKPOINTS.length}`;

  return (
    <div className="grudgewood">
      <div className="grudgewood-bar">
        <span>Deaths <b>{deaths}</b></span>
        {isFinite(best) && <span>Best <b>{best}</b></span>}
        <span>Checkpoint <b>{cpText}</b></span>
        <span>Goal <b style={{color: 'var(--accent)'}}>→ flag</b></span>
        <button className="btn btn-ghost btn-sm" onClick={() => { setDeaths(0); setCheckpoint(0); reset(0, 0); }}>Start over</button>
      </div>
      <div className="grudgewood-stage">
        <canvas ref={canvasRef} className="grudgewood-canvas" width={W} height={H} tabIndex={0}/>
        {status === 'dead' && lastTrap && (
          <div className="grudgewood-death">
            <div className="grudgewood-death-k">OOF</div>
            <div className="grudgewood-death-t">killed by a {TRAP_LABELS[lastTrap] || lastTrap}</div>
          </div>
        )}
      </div>
      {status === 'won' && (
        <div className="grudgewood-bar">
          <span style={{color: 'var(--accent)', fontWeight: 700}}>
            Made it through · {deaths} death{deaths === 1 ? '' : 's'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => { setDeaths(0); setCheckpoint(0); reset(0, 0); }}>
            Play again
          </button>
        </div>
      )}
      <div className="grudgewood-hint">A/D or ←/→ to move · Space / W to jump (coyote+buffered) · R to restart · 10 trap kinds · forest → swamp · 3 checkpoints</div>
    </div>
  );
}
