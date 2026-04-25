// Shootout — five alternating penalties. Same-device hotseat design
// for mobile: kicker and keeper use the same surface in sequence.

import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { submitScore } from '../../../scoreBus.js';
import { teamById } from '../content.js';
import { setRoute, useSelection } from '../store.js';
import { Crest } from '../ui/Crest.jsx';
import { BackBar, ScreenHead, Pill } from '../ui/primitives.jsx';

const ROUNDS = 5;
const CW = 760, CH = 380;
const GL = 240, GR = 520, GT = 70, GB = 270;

export default function Shootout() {
  const sel = useSelection();
  const home = teamById(sel.homeTeam);
  const away = teamById(sel.awayTeam);
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);
  const [round, setRound] = useState(0);
  const [turn, setTurn]   = useState('home');
  const [homeG, setHomeG] = useState(0);
  const [awayG, setAwayG] = useState(0);
  const [phase, setPhase] = useState('aim');
  const [verdict, setVerdict] = useState(null);

  const reset = () => {
    stateRef.current = {
      aim: { x: CW / 2, y: CH - 80 },
      ball: null,
      keeper: { x: CW / 2, y: GB - 40, tx: CW / 2 },
      confetti: [],
    };
    setRound(0); setTurn('home');
    setHomeG(0); setAwayG(0);
    setPhase('aim'); setVerdict(null);
    submittedRef.current = false;
  };
  useEffect(() => { reset(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const last = { t: performance.now() };
    let raf = 0;

    const drawSide = (accent) => {
      // Gradient sky
      const g = ctx.createLinearGradient(0, 0, 0, CH);
      g.addColorStop(0, '#0a1622'); g.addColorStop(1, '#1b2c3e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
      // pitch strip
      const pg = ctx.createLinearGradient(0, GB, 0, CH);
      pg.addColorStop(0, '#1a5530'); pg.addColorStop(1, '#0f3a1f');
      ctx.fillStyle = pg; ctx.fillRect(0, GB, CW, CH - GB);
      // Goal frame
      ctx.strokeStyle = accent; ctx.lineWidth = 4;
      ctx.strokeRect(GL, GT, GR - GL, GB - GT);
      // Net
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) { const x = GL + i * (GR - GL) / 10;
        ctx.beginPath(); ctx.moveTo(x, GT); ctx.lineTo(x, GB); ctx.stroke(); }
      for (let i = 1; i < 5; i++)  { const y = GT + i * (GB - GT) / 5;
        ctx.beginPath(); ctx.moveTo(GL, y); ctx.lineTo(GR, y); ctx.stroke(); }
      // penalty spot
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(CW / 2, CH - 80, 3, 0, Math.PI * 2); ctx.fill();
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const accent = turn === 'home' ? away.primary : home.primary;
      drawSide(accent);

      // Keeper
      const kcolor = turn === 'home' ? away.primary : home.primary;
      ctx.fillStyle = kcolor;
      ctx.fillRect(s.keeper.x - 14, s.keeper.y - 24, 28, 48);
      ctx.fillStyle = '#0e161c';
      ctx.beginPath(); ctx.arc(s.keeper.x, s.keeper.y - 30, 9, 0, Math.PI * 2); ctx.fill();

      // Ball
      const ballPos = s.ball ? s.ball : s.aim;
      ctx.fillStyle = '#f3f6f8';
      ctx.beginPath(); ctx.arc(ballPos.x, ballPos.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0a1014'; ctx.lineWidth = 1.2; ctx.stroke();

      // Aim guide
      if (phase === 'aim' && !s.ball) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(ballPos.x, ballPos.y); ctx.lineTo(ballPos.x, GT + 20); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Confetti on GOAL
      for (const c of s.confetti) {
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, 1 - c.age / c.life);
        ctx.fillRect(c.x, c.y, c.size, c.size);
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.033, (now - last.t) / 1000);
      last.t = now;
      const s = stateRef.current; if (!s) return;

      // Keeper easing
      s.keeper.x += (s.keeper.tx - s.keeper.x) * Math.min(1, dt * 6);

      if (s.ball) {
        s.ball.vy += 220 * dt;
        s.ball.x += s.ball.vx * dt;
        s.ball.y += s.ball.vy * dt;
        // Collision check on goal line entry.
        if (!s.ball.resolved) {
          const inside = s.ball.x > GL && s.ball.x < GR && s.ball.y > GT && s.ball.y < GB;
          const dx = s.ball.x - s.keeper.x, dy = s.ball.y - s.keeper.y;
          const saved = Math.hypot(dx, dy) < 28;
          if (s.ball.y < GT - 10 || s.ball.x < GL - 30 || s.ball.x > GR + 30) {
            s.ball.resolved = true;
            setVerdict('MISS');
            setPhase('result');
          } else if (saved) {
            s.ball.resolved = true;
            sfx.save();
            setVerdict('SAVED');
            setPhase('result');
          } else if (inside && s.ball.y > GT + 5) {
            s.ball.resolved = true;
            sfx.goal();
            setVerdict('GOAL');
            setPhase('result');
            // confetti burst
            const color = turn === 'home' ? home.primary : away.primary;
            for (let i = 0; i < 36; i++) {
              s.confetti.push({
                x: s.ball.x, y: s.ball.y,
                vx: (Math.random() - 0.5) * 240,
                vy: -60 - Math.random() * 200,
                age: 0, life: 1.2 + Math.random() * 0.4,
                size: 3 + Math.random() * 3,
                color,
              });
            }
          }
        }
      }

      // Decay confetti
      for (let i = s.confetti.length - 1; i >= 0; i--) {
        const c = s.confetti[i];
        c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 540 * dt; c.vx *= 0.98;
        if (c.age >= c.life) s.confetti.splice(i, 1);
      }

      draw();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, phase]);

  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => {
      // If this was last round of last turn, done.
      const nextTurn = turn === 'home' ? 'away' : 'home';
      const nextRound = turn === 'away' ? round + 1 : round;
      if (turn === 'away' && nextRound >= ROUNDS) {
        setPhase('done');
        if (!submittedRef.current) {
          submittedRef.current = true;
          const score = Math.max(0, homeG * 120 - awayG * 60);
          submitScore('goalbound', score, { mode: 'shootout', scored: homeG, conceded: awayG });
        }
        return;
      }
      setTurn(nextTurn);
      setRound(nextRound);
      setPhase('aim');
      setVerdict(null);
      if (stateRef.current) { stateRef.current.ball = null; stateRef.current.confetti.length = 0; }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onClick = (e) => {
    if (phase !== 'aim') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CW;
    const y = ((e.clientY - rect.top) / rect.height) * CH;
    const s = stateRef.current; if (!s) return;
    // Keeper guesses opposite-ish side.
    const mid = (GL + GR) / 2;
    const guessDelta = (x - mid) * (-0.25 - Math.random() * 0.5);
    s.keeper.tx = Math.max(GL + 18, Math.min(GR - 18, mid + guessDelta));
    // Launch ball toward target with physics.
    const dx = x - s.aim.x, dy = y - s.aim.y;
    const d = Math.max(80, Math.hypot(dx, dy));
    const power = Math.min(1, d / 240);
    const vx = dx / d * 420 * (0.8 + power * 0.8);
    const vy = dy / d * 360 * (0.9 + power * 0.6);
    s.ball = { x: s.aim.x, y: s.aim.y, vx, vy };
    sfx.kick();
    setPhase('kicking');
  };

  const hero = turn === 'home' ? home : away;
  const rival = turn === 'home' ? away : home;
  const myLabel = turn === 'home' ? 'P1' : 'P2';

  return (
    <div className="gb-page gb-page-shootout">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Shootout"
        title={phase === 'done'
          ? (homeG > awayG ? `${home.name} wins` : homeG < awayG ? `${away.name} wins` : 'Draw')
          : `${myLabel} · ${hero.name} to kick`}
        blurb={phase === 'done'
          ? 'Full shootout done. Tap rematch to go again.'
          : 'Tap inside the goal to aim. The keeper guesses once you release.'}>
        <Pill tone={phase === 'done' ? 'accent' : 'ghost'}>Round {Math.min(round + 1, ROUNDS)} / {ROUNDS}</Pill>
      </ScreenHead>

      <section className="gb-shootout-board">
        <div className="gb-shootout-team gb-shootout-team-home">
          <Crest team={home} size={40}/><span>{home.short}</span>
          <b>{homeG}</b>
        </div>
        <div className="gb-shootout-sep">vs</div>
        <div className="gb-shootout-team gb-shootout-team-away">
          <b>{awayG}</b>
          <span>{away.short}</span><Crest team={away} size={40}/>
        </div>
      </section>

      <div className="gb-shootout-wrap">
        <canvas
          ref={canvasRef}
          className="gb-shootout-canvas"
          width={CW}
          height={CH}
          onClick={onClick}
          style={{ cursor: phase === 'aim' ? 'crosshair' : 'default' }}/>
        {verdict && <div className={`gb-shootout-verdict is-${verdict.toLowerCase()}`}>{verdict}</div>}
      </div>

      <div className="gb-ctabar">
        {phase === 'done'
          ? <button className="btn btn-primary btn-lg" onClick={reset}>{Icon.restart} Rematch</button>
          : <Pill tone="warm">Aim · release · keeper reads</Pill>}
        <button className="btn btn-ghost" onClick={() => setRoute('menu')}>{Icon.home} To menu</button>
      </div>
    </div>
  );
}
