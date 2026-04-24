// GOALBOUND — original 1v1 arcade football on a tiny pitch.
//
//  Modes:
//   - 'bot'       Quick Match vs AI (default). Three difficulty tiers.
//   - '2p'        Local Versus, two players sharing one keyboard.
//   - 'shootout'  Penalty Shootout — 5 rounds of alternating
//                 kicker/keeper. Works on a single phone (no simultaneous
//                 inputs) so mobile hotseat play stays honest.
//
//  Keyboard:
//   P1 — A/D move · W jump · S kick
//   P2 — ←/→ move · ↑ jump · / or Shift kick
//   Shell — P pause, R restart, M mute, F fullscreen
//
//  Virtual controls (touch) are wired via src/input/useVirtualControls.jsx.
//
//  Match flow: 60 seconds total. First to 3 wins early. Timer-out +
//  tied => 45-second golden goal; still tied => coin flip. Local Versus
//  keeps the golden goal rule. Shootout mode replaces the open field
//  with 5 alternating kicks.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sfx } from '../sound.js';

const W = 760;
const H = 420;
const FLOOR = 360;
const P_W = 26, P_H = 46;
const GOAL_W = 70, GOAL_H = 140;
const BALL_R = 10;
const GRAVITY = 1500;
const PLAYER_MOVE = 260;
const PLAYER_JUMP = -540;
const BALL_FRICTION = 0.995;
const BALL_BOUNCE_GROUND = 0.58;
const BALL_BOUNCE_WALL = 0.75;
const KICK_CD = 0.35;
const KICK_RANGE = 42;
const KICK_POWER = 460;
const MATCH_SECONDS = 60;
const GOLDEN_SECONDS = 45;
const WIN_GOALS = 3;

// AI difficulty tiers — reactTime is seconds between re-decisions; aim
// shifts the AI's "goToX" target away from the ball (anti-perfection);
// contestAir is 0..1 chance to attempt header contest; punish is how
// hard the AI commits to counterattacks.
const AI_TIERS = {
  casual: { label: 'Casual', reactTime: 0.26, aim: 0.40, contestAir: 0.25, punish: 0.35 },
  pro:    { label: 'Pro',    reactTime: 0.16, aim: 0.18, contestAir: 0.55, punish: 0.65 },
  legend: { label: 'Legend', reactTime: 0.08, aim: 0.08, contestAir: 0.9,  punish: 0.85 },
};

const COLOR_HOME = '#00e8d0';
const COLOR_AWAY = '#ff8855';

export default function GoalboundGame({ mode = 'bot' }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const aiCfgRef  = useRef(AI_TIERS.casual);
  const submittedRef = useRef(false);
  const [scoreHome, setHome] = useState(0);
  const [scoreAway, setAway] = useState(0);
  const [time, setTime]      = useState(MATCH_SECONDS);
  const [status, setStatus]  = useState('playing'); // playing | golden | ended
  const [difficulty, setDifficulty] = useState(mode === 'bot' ? 'casual' : null);
  const [endReason, setEndReason]   = useState(null); // 'time' | 'first-to-3' | 'golden' | 'flip'

  const isVersus  = mode === '2p';
  const isShootout = mode === 'shootout';

  // ─────────────────────────────────────────────────────────────
  // SHOOTOUT MODE — a small hotseat penalty mini-game. Returns early
  // before we mount the main side-view game loop.
  // ─────────────────────────────────────────────────────────────
  if (isShootout) return <Shootout/>;

  const reset = (keepDifficulty = true) => {
    stateRef.current = {
      home: { x: 160, y: FLOOR - P_H, vx: 0, vy: 0, onGround: true, kickCd: 0, facing: 1, kickAnim: 0 },
      away: { x: W - 160 - P_W, y: FLOOR - P_H, vx: 0, vy: 0, onGround: true, kickCd: 0, facing: -1, kickAnim: 0, aiTimer: 0, aiAction: null },
      ball: { x: W / 2, y: FLOOR - 160, vx: 0, vy: 0 },
      clock: MATCH_SECONDS,
      celebT: 0,
      celebFor: null,
      kickOffT: 0.6,
      golden: false,
    };
    setHome(0); setAway(0); setTime(MATCH_SECONDS);
    setStatus('playing');
    setEndReason(null);
    submittedRef.current = false;
    if (!keepDifficulty && mode === 'bot') setDifficulty('casual');
  };

  useEffect(() => { reset(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);
  useEffect(() => { aiCfgRef.current = AI_TIERS[difficulty || 'casual']; }, [difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      // Let R bubble up to the shell's restart handler too.
    };
    const ku = (e) => { keys[e.key.toLowerCase()] = false; keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const resetAfterGoal = (scorer) => {
      const s = stateRef.current; if (!s) return;
      s.celebT = 1.4; s.celebFor = scorer;
      s.ball.x = W / 2; s.ball.y = FLOOR - 160;
      s.ball.vx = 0; s.ball.vy = 0;
      s.home.x = 160; s.home.y = FLOOR - P_H; s.home.vx = 0; s.home.vy = 0;
      s.away.x = W - 160 - P_W; s.away.y = FLOOR - P_H; s.away.vx = 0; s.away.vy = 0;
      s.kickOffT = 0.8;
      sfx.goal();
    };

    const stepPlayer = (s, dt, p, ctl, dirFacingHint = null) => {
      if (ctl.left)  { p.vx = -PLAYER_MOVE; p.facing = -1; }
      else if (ctl.right) { p.vx = PLAYER_MOVE; p.facing = 1; }
      else p.vx *= 0.75;
      if (dirFacingHint !== null && !ctl.left && !ctl.right) p.facing = dirFacingHint;

      if (ctl.jump && p.onGround) { p.vy = PLAYER_JUMP; p.onGround = false; }
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.y + P_H >= FLOOR) { p.y = FLOOR - P_H; p.vy = 0; p.onGround = true; }
      if (p.x < 8) { p.x = 8; p.vx = 0; }
      if (p.x + P_W > W - 8) { p.x = W - 8 - P_W; p.vx = 0; }

      if (p.kickCd > 0) p.kickCd -= dt;
      if (p.kickAnim > 0) p.kickAnim -= dt;
      if (ctl.kick && p.kickCd <= 0) {
        p.kickCd = KICK_CD;
        p.kickAnim = 0.18;
        const bx = s.ball.x, by = s.ball.y;
        const cx = p.x + P_W / 2, cy = p.y + P_H / 2;
        const d = Math.hypot(bx - cx, by - cy);
        if (d < KICK_RANGE + BALL_R) {
          const upLift = Math.max(0, (p.y + P_H - by) / 60);
          const horizDir = p.facing;
          s.ball.vx = horizDir * KICK_POWER * (1.05 + Math.random() * 0.1);
          s.ball.vy = -180 - upLift * 80 - Math.random() * 60;
          sfx.kick();
        }
      }
    };

    const stepBallBounceOn = (s, p) => {
      const cx = p.x + P_W / 2, cy = p.y + P_H / 2;
      const halfW = P_W / 2, halfH = P_H / 2;
      const dx = s.ball.x - cx;
      const dy = s.ball.y - cy;
      const absX = Math.abs(dx) - halfW;
      const absY = Math.abs(dy) - halfH;
      if (absX < BALL_R && absY < BALL_R) {
        const penX = BALL_R - absX;
        const penY = BALL_R - absY;
        if (penX < penY) {
          s.ball.x += (dx > 0 ? penX : -penX);
          s.ball.vx = Math.sign(dx) * Math.max(220, Math.abs(s.ball.vx));
          s.ball.vx += p.vx * 0.25;
        } else {
          s.ball.y += (dy > 0 ? penY : -penY);
          if (dy < 0) {
            s.ball.vy = -Math.max(260, Math.abs(s.ball.vy));
            s.ball.vx += p.vx * 0.35 + p.facing * 60;
          } else {
            s.ball.vy = Math.sign(dy) * 120;
          }
        }
        sfx.bounce();
      }
    };

    const runAI = (s, dt) => {
      const cfg = aiCfgRef.current;
      const me = s.away, ball = s.ball;
      me.aiTimer -= dt;
      if (me.aiTimer <= 0) {
        me.aiTimer = cfg.reactTime + Math.random() * 0.05;
        const ballHeadingHome = ball.vx > 80;
        const aimWobble = (Math.random() - 0.5) * cfg.aim * 80;
        const goToX = ballHeadingHome
          ? Math.max(me.x, Math.min(W - 90, ball.x - 20 + aimWobble))
          : ball.x + 20 + aimWobble;
        me.aiAction = { goToX, jump: false, kick: false };
        const ballAir = ball.y < FLOOR - P_H - 10;
        const nearX = Math.abs(ball.x - (me.x + P_W / 2)) < 90;
        if (ballAir && nearX && me.onGround && Math.random() < cfg.contestAir) {
          me.aiAction.jump = true;
        }
        if (Math.abs(ball.x - (me.x + P_W / 2)) < KICK_RANGE && ball.vx > -50 * cfg.punish) {
          me.aiAction.kick = true;
        }
      }
      const act = me.aiAction || {};
      const dx = (act.goToX ?? me.x) - (me.x + P_W / 2);
      const wantLeft = dx < -6, wantRight = dx > 6;
      stepPlayer(s, dt, me, {
        left: wantLeft,
        right: wantRight,
        jump: act.jump,
        kick: act.kick,
      });
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;

      // Dusk pitch gradient
      const grad = ctx.createLinearGradient(0, 0, 0, FLOOR);
      grad.addColorStop(0, '#1a2f3e');
      grad.addColorStop(1, '#2a4557');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, FLOOR);

      // Distant stands
      for (let i = 0; i < 40; i++) {
        const x = i * 20, h = 10 + (i * 31 % 16);
        ctx.fillStyle = i % 2 ? '#0f202c' : '#14293a';
        ctx.fillRect(x, FLOOR - 100 - h, 18, h);
      }

      // Pitch floor
      const pg = ctx.createLinearGradient(0, FLOOR, 0, H);
      pg.addColorStop(0, '#1a5530');
      pg.addColorStop(1, '#0f3a1f');
      ctx.fillStyle = pg;
      ctx.fillRect(0, FLOOR, W, H - FLOOR);

      // Midline + halo
      ctx.strokeStyle = 'rgba(0,232,208,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, FLOOR); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, FLOOR - 90, 54, 0, Math.PI * 2); ctx.stroke();

      // Goals
      const drawGoal = (xLeft, side, accent) => {
        const x = xLeft;
        const y = FLOOR - GOAL_H;
        ctx.fillStyle = 'rgba(6,12,18,0.45)';
        ctx.fillRect(x, y, GOAL_W, GOAL_H);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        if (side === 'left') {
          ctx.beginPath();
          ctx.moveTo(x + GOAL_W, y); ctx.lineTo(x, y); ctx.lineTo(x, FLOOR); ctx.lineTo(x + GOAL_W, FLOOR);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + GOAL_W, y); ctx.lineTo(x + GOAL_W, FLOOR); ctx.lineTo(x, FLOOR);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
          ctx.beginPath(); ctx.moveTo(x + (i * GOAL_W / 6), y); ctx.lineTo(x + (i * GOAL_W / 6), FLOOR); ctx.stroke();
        }
        for (let i = 1; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(x, y + (i * GOAL_H / 4)); ctx.lineTo(x + GOAL_W, y + (i * GOAL_H / 4)); ctx.stroke();
        }
      };
      drawGoal(0, 'left', COLOR_HOME);
      drawGoal(W - GOAL_W, 'right', COLOR_AWAY);

      // Players
      const drawPlayer = (p, color) => {
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(p.x + P_W / 2, FLOOR - 1, 16, 3, 0, 0, Math.PI * 2); ctx.fill();
        // body
        ctx.fillStyle = color;
        ctx.fillRect(p.x, p.y + 12, P_W, P_H - 14);
        // head
        ctx.fillStyle = '#0a1014';
        ctx.beginPath(); ctx.arc(p.x + P_W / 2, p.y + 8, 8, 0, Math.PI * 2); ctx.fill();
        // shorts
        ctx.fillStyle = '#0a1014';
        ctx.fillRect(p.x + 4, p.y + 26, P_W - 8, 10);
        // kicking leg
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const legEx = p.kickAnim > 0 ? 20 : 6;
        const dir = p.facing;
        ctx.moveTo(p.x + P_W / 2, p.y + P_H - 12);
        ctx.lineTo(p.x + P_W / 2 + dir * legEx, p.y + P_H);
        ctx.stroke();
      };
      drawPlayer(s.home, COLOR_HOME);
      drawPlayer(s.away, COLOR_AWAY);

      // Ball
      ctx.fillStyle = '#f0f5f8';
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0a0d0e'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath();
      ctx.moveTo(s.ball.x, s.ball.y - 5);
      ctx.lineTo(s.ball.x + 4, s.ball.y);
      ctx.lineTo(s.ball.x, s.ball.y + 5);
      ctx.lineTo(s.ball.x - 4, s.ball.y);
      ctx.closePath(); ctx.fill();

      // Kickoff freeze ring
      if (s.kickOffT > 0) {
        const alpha = Math.max(0, s.kickOffT / 0.8);
        ctx.strokeStyle = `rgba(0,232,208,${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(W / 2, FLOOR - 160, 24 + (1 - alpha) * 40, 0, Math.PI * 2); ctx.stroke();
      }

      // Celebration
      if (s.celebT > 0) {
        const c = s.celebFor === 'home' ? COLOR_HOME : COLOR_AWAY;
        ctx.fillStyle = `${c}33`;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 54px "Lora", serif';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL!', W / 2, H / 2);
      }

      // Golden goal banner
      if (s.golden && s.celebT <= 0) {
        ctx.fillStyle = 'rgba(255, 183, 77, 0.1)';
        ctx.fillRect(0, 0, W, 34);
        ctx.fillStyle = '#ffb74d';
        ctx.font = 'bold 14px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GOLDEN GOAL', W / 2, 22);
      }
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const finish = (reason, wonByHome) => {
      setStatus('ended');
      setEndReason(reason);
      if (!submittedRef.current) {
        submittedRef.current = true;
        const score = Math.max(0, scoreHome * 120 - scoreAway * 60);
        submitScore('goalbound', score, {
          mode,
          difficulty,
          scored: scoreHome,
          conceded: scoreAway,
          reason,
          won: wonByHome,
        });
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s || status === 'ended') return;

      if (s.celebT > 0) { s.celebT -= dt; draw(); return; }
      if (s.kickOffT > 0) s.kickOffT -= dt;

      s.clock -= dt;
      const clampedTime = Math.max(0, Math.ceil(s.clock));
      setTime(clampedTime);

      if (s.clock <= 0) {
        if (scoreHome > scoreAway) { finish('time', true); draw(); return; }
        if (scoreAway > scoreHome) { finish('time', false); draw(); return; }
        // Tied — enter golden goal
        if (!s.golden) {
          s.golden = true;
          s.clock = GOLDEN_SECONDS;
        } else {
          // still tied after GG → coin flip
          const won = Math.random() > 0.5;
          if (won) setHome((v) => v + 1); else setAway((v) => v + 1);
          finish('flip', won);
          draw(); return;
        }
      }

      // P1 (home)
      const p1Left  = keys['a'] || keys['keya'];
      const p1Right = keys['d'] || keys['keyd'];
      const p1Jump  = keys['w'] || keys['keyw'];
      const p1Kick  = keys['s'] || keys['keys'] || keys[' '] || keys['space'];

      if (s.kickOffT <= 0) {
        stepPlayer(s, dt, s.home, { left: p1Left, right: p1Right, jump: p1Jump, kick: p1Kick });
        if (isVersus) {
          const p2Left  = keys['arrowleft'];
          const p2Right = keys['arrowright'];
          const p2Jump  = keys['arrowup'];
          const p2Kick  = keys['/'] || keys['shift'] || keys['shiftleft'] || keys['shiftright'];
          stepPlayer(s, dt, s.away, { left: p2Left, right: p2Right, jump: p2Jump, kick: p2Kick }, -1);
        } else {
          runAI(s, dt);
        }
      } else {
        stepPlayer(s, dt, s.home, {});
        stepPlayer(s, dt, s.away, {});
      }

      // Ball physics
      if (s.kickOffT <= 0) {
        s.ball.vy += GRAVITY * dt;
        s.ball.vx *= BALL_FRICTION;
        s.ball.x += s.ball.vx * dt;
        s.ball.y += s.ball.vy * dt;

        if (s.ball.y + BALL_R >= FLOOR) {
          s.ball.y = FLOOR - BALL_R;
          if (Math.abs(s.ball.vy) < 80) s.ball.vy = 0;
          else s.ball.vy = -s.ball.vy * BALL_BOUNCE_GROUND;
          s.ball.vx *= 0.92;
        }
        if (s.ball.y - BALL_R < 0) {
          s.ball.y = BALL_R;
          s.ball.vy = -s.ball.vy * BALL_BOUNCE_WALL;
        }
        const inLeftGoalMouth = s.ball.y > FLOOR - GOAL_H && s.ball.x < GOAL_W;
        const inRightGoalMouth = s.ball.y > FLOOR - GOAL_H && s.ball.x > W - GOAL_W;
        if (s.ball.x - BALL_R < 0 && !inLeftGoalMouth) {
          s.ball.x = BALL_R;
          s.ball.vx = -s.ball.vx * BALL_BOUNCE_WALL;
        }
        if (s.ball.x + BALL_R > W && !inRightGoalMouth) {
          s.ball.x = W - BALL_R;
          s.ball.vx = -s.ball.vx * BALL_BOUNCE_WALL;
        }
        if (inLeftGoalMouth && s.ball.x < GOAL_W / 2) {
          const nxt = scoreAway + 1;
          setAway(nxt); resetAfterGoal('away');
          if (nxt >= WIN_GOALS || s.golden) { finish(s.golden ? 'golden' : 'first-to-3', false); return; }
        } else if (inRightGoalMouth && s.ball.x > W - GOAL_W / 2) {
          const nxt = scoreHome + 1;
          setHome(nxt); resetAfterGoal('home');
          if (nxt >= WIN_GOALS || s.golden) { finish(s.golden ? 'golden' : 'first-to-3', true); return; }
        }

        stepBallBounceOn(s, s.home);
        stepBallBounceOn(s, s.away);
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
  }, [status, scoreHome, scoreAway, difficulty, mode]);

  const awayLabel = isVersus ? 'P2' : (difficulty ? AI_TIERS[difficulty].label : 'AI');
  const homeLabel = isVersus ? 'P1' : 'YOU';

  return (
    <div className="goalbound">
      <div className="goalbound-bar">
        <div className="goalbound-scoreboard">
          <div className="goalbound-side goalbound-home">
            <span className="goalbound-side-label">{homeLabel}</span>
            <span className="goalbound-side-score">{scoreHome}</span>
          </div>
          <div className="goalbound-sep">—</div>
          <div className="goalbound-side goalbound-away">
            <span className="goalbound-side-score">{scoreAway}</span>
            <span className="goalbound-side-label">{awayLabel}</span>
          </div>
        </div>
        <div className="goalbound-clock">
          <div className={`goalbound-clock-ring ${time <= 10 ? 'is-urgent' : ''}`}>
            <span>{time}</span>
          </div>
          <div className="goalbound-clock-label">
            {status === 'playing' && stateRef.current?.golden ? 'golden goal' : 'seconds'}
          </div>
        </div>
      </div>

      {mode === 'bot' && !stateRef.current?.started && (
        <div className="goalbound-difficulty">
          {(['casual','pro','legend']).map((id) => (
            <button
              key={id}
              className={`goalbound-tier ${difficulty === id ? 'is-active' : ''}`}
              onClick={() => setDifficulty(id)}>
              {AI_TIERS[id].label}
            </button>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="goalbound-canvas" width={W} height={H}/>

      {status === 'ended' && (
        <div className="goalbound-end">
          <div className="goalbound-end-kicker">
            {endReason === 'first-to-3' ? 'First to 3' :
             endReason === 'golden'     ? 'Golden goal' :
             endReason === 'flip'       ? 'Coin flip' : 'Full time'}
          </div>
          <div className="goalbound-end-title">
            {scoreHome > scoreAway ? (isVersus ? 'Player 1 wins' : 'Match won') :
             scoreHome < scoreAway ? (isVersus ? 'Player 2 wins' : 'Match lost') : 'Draw'}
          </div>
          <div className="goalbound-end-score">{scoreHome}–{scoreAway}</div>
          <button className="btn btn-primary btn-lg" onClick={() => reset(true)}>Rematch</button>
        </div>
      )}

      <div className="goalbound-hint">
        {isVersus
          ? 'P1: A/D · W · S  —  P2: ←/→ · ↑ · /'
          : 'Move A/D · Jump W · Kick S (or Space)'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHOOTOUT — 5-round hotseat penalty kicks. Alternates which side
// shoots and which side keeps. Tap/click to aim along an angle arc,
// then release to launch. Keeper mirrors the input after a delay.
// ─────────────────────────────────────────────────────────────

const SHOOT_ROUNDS = 5;

function Shootout() {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);
  const [round, setRound] = useState(0);       // 0..SHOOT_ROUNDS-1
  const [turn, setTurn]   = useState('home');  // 'home' shoots, 'away' keeps; then swap
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [phase, setPhase] = useState('aim');   // aim | kicking | result | done
  const [resultText, setResultText] = useState(null);

  const CW = 760, CH = 380;
  const goalLeft = 240, goalRight = 520, goalTop = 60, goalBot = 260;

  const reset = () => {
    stateRef.current = {
      aim: { x: CW/2, y: CH - 80, power: 0 },
      ball: null,
      keeper: { x: CW/2, y: goalBot - 40, tx: CW/2 },
    };
    setRound(0); setTurn('home');
    setHomeGoals(0); setAwayGoals(0);
    setPhase('aim'); setResultText(null);
    submittedRef.current = false;
  };
  useEffect(() => { reset(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      // sky
      const g = ctx.createLinearGradient(0, 0, 0, CH);
      g.addColorStop(0, '#0c1a24'); g.addColorStop(1, '#1f3548');
      ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);

      // goal
      ctx.strokeStyle = turn === 'home' ? COLOR_AWAY : COLOR_HOME;
      ctx.lineWidth = 3;
      ctx.strokeRect(goalLeft, goalTop, goalRight - goalLeft, goalBot - goalTop);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const x = goalLeft + (i * (goalRight - goalLeft)) / 8;
        ctx.beginPath(); ctx.moveTo(x, goalTop); ctx.lineTo(x, goalBot); ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        const y = goalTop + (i * (goalBot - goalTop)) / 4;
        ctx.beginPath(); ctx.moveTo(goalLeft, y); ctx.lineTo(goalRight, y); ctx.stroke();
      }

      // Keeper
      ctx.fillStyle = turn === 'home' ? COLOR_AWAY : COLOR_HOME;
      ctx.fillRect(s.keeper.x - 12, s.keeper.y - 20, 24, 40);
      ctx.fillStyle = '#0a1014';
      ctx.beginPath(); ctx.arc(s.keeper.x, s.keeper.y - 26, 8, 0, Math.PI * 2); ctx.fill();

      // Ball at spot
      if (!s.ball) {
        ctx.fillStyle = '#f0f5f8';
        ctx.beginPath(); ctx.arc(s.aim.x, s.aim.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a1014'; ctx.lineWidth = 1.2; ctx.stroke();
      } else {
        ctx.fillStyle = '#f0f5f8';
        ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0a1014'; ctx.lineWidth = 1.2; ctx.stroke();
      }
    };

    let raf = 0;
    const last = { t: performance.now() };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - last.t) / 1000);
      last.t = now;
      const s = stateRef.current; if (!s) return;

      // Keeper easing
      s.keeper.x += (s.keeper.tx - s.keeper.x) * Math.min(1, dt * 6);

      // Ball travel
      if (s.ball) {
        s.ball.vy += 180 * dt;
        s.ball.x += s.ball.vx * dt;
        s.ball.y += s.ball.vy * dt;

        // Goal line check
        if (s.ball.y <= goalTop + 8 || (s.ball.y < goalBot && s.ball.x > goalLeft && s.ball.x < goalRight && s.ball.vy < 0 === false && s.ball.y > goalTop)) {
          const inside = s.ball.x > goalLeft && s.ball.x < goalRight && s.ball.y > goalTop && s.ball.y < goalBot;
          // Keeper save zone: a circle around keeper
          const dx = s.ball.x - s.keeper.x;
          const dy = s.ball.y - s.keeper.y;
          const saved = Math.hypot(dx, dy) < 26;
          if (!s.ball.resolved) {
            s.ball.resolved = true;
            if (saved) {
              setResultText('SAVED');
              sfx.save();
              setPhase('result');
            } else if (inside) {
              setResultText('GOAL');
              sfx.goal();
              if (turn === 'home') setHomeGoals((v) => v + 1);
              else setAwayGoals((v) => v + 1);
              setPhase('result');
            } else if (s.ball.y < goalTop - 12 || s.ball.y > goalBot + 60 || s.ball.x < goalLeft - 40 || s.ball.x > goalRight + 40) {
              setResultText('MISS');
              setPhase('result');
            }
          }
        }
      }

      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => {
      // Next turn
      const nextTurn = turn === 'home' ? 'away' : 'home';
      const nextRound = turn === 'away' ? round + 1 : round;
      if (turn === 'away' && nextRound >= SHOOT_ROUNDS) {
        setPhase('done');
        if (!submittedRef.current) {
          submittedRef.current = true;
          const score = Math.max(0, homeGoals * 120 - awayGoals * 60);
          submitScore('goalbound', score, { mode: 'shootout', scored: homeGoals, conceded: awayGoals });
        }
        return;
      }
      setTurn(nextTurn);
      setRound(nextRound);
      setPhase('aim');
      setResultText(null);
      if (stateRef.current) { stateRef.current.ball = null; }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onClick = (e) => {
    if (phase !== 'aim') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CW;
    const y = ((e.clientY - rect.top) / rect.height) * CH;
    const s = stateRef.current;
    if (!s) return;
    // Keeper guess — mirror across center of goal with skill noise
    const mid = (goalLeft + goalRight) / 2;
    const guessDelta = (x - mid) * (-0.3 - Math.random() * 0.4);
    s.keeper.tx = Math.max(goalLeft + 14, Math.min(goalRight - 14, mid + guessDelta));
    // Launch ball toward tap
    const dx = x - s.aim.x;
    const dy = y - s.aim.y;
    const d = Math.max(80, Math.hypot(dx, dy));
    const power = Math.min(1, d / 260);
    const vx = dx / d * 420 * (0.8 + power * 0.8);
    const vy = dy / d * 360 * (0.9 + power * 0.6);
    s.ball = { x: s.aim.x, y: s.aim.y, vx, vy };
    setPhase('kicking');
  };

  return (
    <div className="goalbound shootout">
      <div className="goalbound-bar">
        <div className="goalbound-scoreboard">
          <div className="goalbound-side goalbound-home">
            <span className="goalbound-side-label">P1</span>
            <span className="goalbound-side-score">{homeGoals}</span>
          </div>
          <div className="goalbound-sep">—</div>
          <div className="goalbound-side goalbound-away">
            <span className="goalbound-side-score">{awayGoals}</span>
            <span className="goalbound-side-label">P2</span>
          </div>
        </div>
        <div className="shootout-round">
          Round <b>{Math.min(round + 1, SHOOT_ROUNDS)}</b> / {SHOOT_ROUNDS} · {turn === 'home' ? 'P1 kicks' : 'P2 kicks'}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="goalbound-canvas"
        width={CW}
        height={CH}
        onClick={onClick}
        style={{ cursor: phase === 'aim' ? 'crosshair' : 'default' }}/>

      {resultText && <div className="shootout-result">{resultText}</div>}

      {phase === 'done' && (
        <div className="goalbound-end">
          <div className="goalbound-end-kicker">Shootout over</div>
          <div className="goalbound-end-title">
            {homeGoals > awayGoals ? 'Player 1 wins' : homeGoals < awayGoals ? 'Player 2 wins' : 'Draw'}
          </div>
          <div className="goalbound-end-score">{homeGoals}–{awayGoals}</div>
          <button className="btn btn-primary btn-lg" onClick={reset}>Rematch</button>
        </div>
      )}

      <div className="goalbound-hint">
        Tap in the goal to aim and shoot. The keeper guesses once you release.
      </div>
    </div>
  );
}
