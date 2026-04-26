// Match screen — runs the match engine and renders the canvas +
// scoreboard + pause overlay. Handles keyboard input, virtual
// controls, and transitions to results on finish.

import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { submitScore } from '../../../scoreBus.js';
import {
  teamById, playerById, arenaById, weatherById, ballById, crowdById,
  durationById, difficultyById, PHYSICS,
} from '../content.js';
import {
  setRoute, setMatch, useSelection, useGoalboundStore,
  recordMatchResult, setTournament,
} from '../store.js';
import { createMatch } from '../engine/match.js';
import { drawFrame } from '../engine/render.js';
import { recordFixture, recordKnockout, simulateOthers } from '../engine/tournament.js';
import { evaluateChallenge, buildResult, challengeById } from '../engine/challenges.js';
import { createGamepadReader } from '../engine/gamepad.js';

const KEYS = {
  p1: { left:['a','keya'], right:['d','keyd'], jump:['w','keyw'], kick:['s','keys',' ','space'] },
  p2: { left:['arrowleft'], right:['arrowright'], jump:['arrowup'], kick:['/','shift','shiftleft','shiftright'] },
};

export default function MatchScreen() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const keysRef   = useRef({});
  const rafRef    = useRef(0);
  const pausedRef = useRef(false);
  const tournamentRef = useRef(null);
  const matchFinishedRef = useRef(false);

  const sel = useSelection();
  const challengeId = useGoalboundStore((s) => s.challenge);
  const tournament  = useGoalboundStore((s) => s.tournament);

  const [scoreHome, setH] = useState(0);
  const [scoreAway, setA] = useState(0);
  const [clock, setClock] = useState(0);
  const [, setStatus] = useState('playing');
  useEffect(() => { tournamentRef.current = tournament; }, [tournament]);

  // Ambient pause — GameShell sets [data-paused="1"] on its root when
  // the user pauses via its toolbar or the P key. We watch for it so
  // the sim actually halts instead of ticking behind the overlay.
  useEffect(() => {
    const update = () => {
      const el = canvasRef.current?.closest('[data-paused]');
      pausedRef.current = el?.getAttribute('data-paused') === '1';
    };
    update();
    const observers = [];
    const host = canvasRef.current?.closest('[data-paused]');
    if (host) {
      const obs = new MutationObserver(update);
      obs.observe(host, { attributes: true, attributeFilter: ['data-paused'] });
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // R-key restart — in-place reset without remounting the whole shell.
  // GameShell also catches R, but its handler is null because we don't
  // pass onRestart from GameIntro for Goalbound; ours is canonical.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const home = teamById(sel.homeTeam);
  const away = teamById(sel.awayTeam);
  const homePlayer = playerById(sel.homeTeam, sel.homePlayer);
  const awayPlayer = playerById(sel.awayTeam, sel.awayPlayer);
  const arena = arenaById(sel.arena);
  const weather = weatherById(sel.weather);
  const ball = ballById(sel.ball);
  const crowd = crowdById(sel.crowd);
  const duration = durationById(sel.duration);
  const diffObj = difficultyById(sel.difficulty);

  // Determine challenge modifiers (if any) and actual match mode.
  const challenge = challengeId ? challengeById(challengeId) : null;
  const modifiers = challenge?.modifiers || {};
  const mode = sel.mode === '2p' ? '2p'
              : sel.mode === 'practice' ? 'practice'
              : 'bot';
  const effectiveDiff = modifiers.difficulty
    ? difficultyById(modifiers.difficulty)
    : diffObj;
  const effectiveDuration = modifiers.duration || duration.seconds;
  const effectiveWeather  = modifiers.weather ? weatherById(modifiers.weather) : weather;
  const enemyHead        = modifiers.enemyHead || 0;
  const noJump           = !!modifiers.noJump;
  const goldenOnly       = !!modifiers.goldenOnly;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const engine = createMatch({
      mode,
      difficulty: mode === 'bot' ? effectiveDiff : null,
      duration: effectiveDuration,
      ballCfg: { bounceMul: ball.bounceMul, powerMul: ball.powerMul, dragMul: ball.dragMul },
      weather: effectiveWeather,
      crowd,
      arena,
      home, away, homePlayer, awayPlayer,
      goldenOnly,
      noJump,
      listeners: {
        onGoal:   () => { sfx.goal(); setTimeout(() => sfx.cheer?.(), 220); },
        onKick:   () => { sfx.kick(); },
        onBounce: () => { /* too noisy; skip */ },
        onWhistle: () => sfx.whistle(),
        onFinish: ({ reason, won, scoreHome, scoreAway, ...rest }) => {
          onFinish({ reason, won, scoreHome, scoreAway, ...rest });
        },
      },
    });
    engineRef.current = engine;

    // Handicap: enemy gets a head start (comeback challenge).
    if (enemyHead > 0) {
      engine.state.scoreAway = enemyHead;
      engine.state.peakAwayLead = enemyHead;
    }

    const kd = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      keysRef.current[e.code?.toLowerCase()] = true;
    };
    const ku = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
      keysRef.current[e.code?.toLowerCase()] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch zones (parallel to keyboard, doesn't replace it):
    //  - Left half of the canvas: analog move stick (anchored where you
    //    first touch). Past 12px left/right of anchor activates that direction.
    //  - Right half: tap (under ~180ms with no slide) = jump.
    //                hold-and-release = charge kick (engine fires on release).
    const touch = { left:false, right:false, jump:false, kick:false };
    const moveTouch = { id: null, ax: 0 };
    const actionTouch = { id: null, startT: 0, charging: false };
    const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

    const onTouchStart = (e) => {
      const rect = canvas.getBoundingClientRect();
      for (const t of e.changedTouches) {
        const x = t.clientX - rect.left;
        const isLeft = x < rect.width / 2;
        if (isLeft && moveTouch.id === null) {
          moveTouch.id = t.identifier;
          moveTouch.ax = x;
          touch.left = false; touch.right = false;
        } else if (!isLeft && actionTouch.id === null) {
          actionTouch.id = t.identifier;
          actionTouch.startT = performance.now();
          actionTouch.charging = true;
          touch.kick = true; // start charging immediately on press
        }
      }
      e.preventDefault();
    };
    const onTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      for (const t of e.changedTouches) {
        if (t.identifier === moveTouch.id) {
          const x = t.clientX - rect.left;
          const dx = x - moveTouch.ax;
          touch.left  = dx < -12;
          touch.right = dx >  12;
        }
      }
      e.preventDefault();
    };
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === moveTouch.id) {
          moveTouch.id = null; moveTouch.ax = 0;
          touch.left = false; touch.right = false;
        } else if (t.identifier === actionTouch.id) {
          const held = performance.now() - actionTouch.startT;
          // Quick tap (no real charge) = jump pulse; otherwise just release
          // the kick so the engine fires the charged shot on the falling edge.
          if (held < 180) {
            touch.jump = true;
            // Cancel kick charge so a tap doesn't also fire a tiny kick.
            touch.kick = false;
            actionTouch.charging = false;
            // Release jump on next frame.
            setTimeout(() => { touch.jump = false; }, 80);
          } else {
            // Drop kick — engine sees release edge and launches.
            touch.kick = false;
            actionTouch.charging = false;
          }
          actionTouch.id = null;
        }
      }
      e.preventDefault();
    };

    if (isTouch) {
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
      canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
      canvas.addEventListener('touchcancel',onTouchEnd,   { passive: false });
    }

    const gamepad = createGamepadReader();

    const last = { t: performance.now() };
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.033, (now - last.t) / 1000);
      last.t = now;

      if (!pausedRef.current && engine.state.status !== 'ended' && engine.state.status !== 'aborted') {
        // Map keys to engine inputs.
        const k = keysRef.current;
        const kb = (arr) => arr.some((key) => k[key]);
        const pads = gamepad.read();
        const p1Pad = pads?.[0];
        const p2Pad = pads?.[1];
        engine.setP1({
          left:  kb(KEYS.p1.left)  || !!p1Pad?.left  || touch.left,
          right: kb(KEYS.p1.right) || !!p1Pad?.right || touch.right,
          jump:  kb(KEYS.p1.jump)  || !!p1Pad?.jump  || touch.jump,
          kick:  kb(KEYS.p1.kick)  || !!p1Pad?.kick  || touch.kick,
        });
        if (mode === '2p') {
          engine.setP2({
            left:  kb(KEYS.p2.left)  || !!p2Pad?.left,
            right: kb(KEYS.p2.right) || !!p2Pad?.right,
            jump:  kb(KEYS.p2.jump)  || !!p2Pad?.jump,
            kick:  kb(KEYS.p2.kick)  || !!p2Pad?.kick,
          });
        }
        engine.step(dt);
        const snap = engine.getSnapshot();
        setH(snap.scoreHome);
        setA(snap.scoreAway);
        setClock(snap.clock);
        setStatus(snap.status);
      }

      drawFrame(ctx, engine.state, arena, { home, away, weather: effectiveWeather });
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      if (isTouch) {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove',  onTouchMove);
        canvas.removeEventListener('touchend',   onTouchEnd);
        canvas.removeEventListener('touchcancel',onTouchEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.mode, challengeId]);

  const restart = () => {
    matchFinishedRef.current = false;
    engineRef.current?.reset({ keepScore: false });
    setH(0); setA(0); setStatus('playing');
    setMatch(null);
  };

  const onFinish = ({ reason, won, scoreHome, scoreAway, firstGoalAt, wasDownBy2, jumpCount, goalLog }) => {
    if (matchFinishedRef.current) return;
    matchFinishedRef.current = true;
    const drawn = scoreHome === scoreAway && !won && reason !== 'flip';
    // Scorebus: only on a fresh non-challenge completion or a clean quick match.
    if (sel.mode === 'quick' || sel.mode === 'tournament' || sel.mode === 'practice') {
      const score = Math.max(0, scoreHome * 120 - scoreAway * 60);
      submitScore('goalbound', score, {
        mode: sel.mode, difficulty: sel.difficulty,
        scored: scoreHome, conceded: scoreAway, reason, won,
      });
    }

    // Tournament progression.
    let updatedTournament = tournamentRef.current;
    if (sel.mode === 'tournament' && updatedTournament) {
      const myId = updatedTournament.playerTeamId;
      // Find the first unfinished player fixture — that's the one we just played.
      const fix = updatedTournament.fixtures?.find((f) => !f.done && (f.home === myId || f.away === myId));
      if (fix) {
        const hg = fix.home === myId ? scoreHome : scoreAway;
        const ag = fix.away === myId ? scoreAway : scoreHome;
        updatedTournament = recordFixture(updatedTournament, fix.id, hg, ag);
      } else if (updatedTournament.bracket) {
        let bm = null;
        for (const round of updatedTournament.bracket.rounds) {
          const m = round.matches.find((x) => x.home === myId || x.away === myId);
          if (m && !m.score && m.home && m.away) { bm = m; break; }
        }
        if (bm) {
          const hg = bm.home === myId ? scoreHome : scoreAway;
          const ag = bm.away === myId ? scoreAway : scoreHome;
          updatedTournament = recordKnockout(updatedTournament, bm.id, hg, ag);
        }
      }
      // Simulate non-player matches in the same round automatically.
      updatedTournament = simulateOthers(updatedTournament);
      setTournament(updatedTournament);
    }

    // Challenge evaluation.
    let stars = 0;
    if (challengeId) {
      const result = buildResult({
        scored: scoreHome, conceded: scoreAway, endReason: reason, won,
        firstGoalAt, wasDownBy2, jumpCount, goalLog,
      });
      stars = evaluateChallenge(challengeId, result);
    }

    // Record to stats.
    recordMatchResult({
      scored: scoreHome, conceded: scoreAway, won, drawn,
      endReason: reason,
      templateId: sel.mode === 'tournament' && updatedTournament?.champion === updatedTournament?.playerTeamId ? updatedTournament?.templateId : null,
      teamId: sel.homeTeam,
      challengeId,
      challengeStars: stars,
    });

    // Store the result in the match slot for the Results screen.
    setMatch({
      finished: true,
      won, drawn, reason,
      scoreHome, scoreAway,
      homeId: sel.homeTeam, awayId: sel.awayTeam,
      homePlayerId: sel.homePlayer, awayPlayerId: sel.awayPlayer,
      mode: sel.mode,
      challengeId,
      challengeStars: stars,
      goalLog,
      at: Date.now(),
    });
    setTimeout(() => setRoute('results'), 400);
  };

  const golden = engineRef.current?.state?.golden;

  return (
    <div className="gb-match">
      <header className="gb-match-hud">
        <div className="gb-match-team gb-match-team-home">
          <span className="gb-match-team-swatch" style={{ background: home.primary }}/>
          <span className="gb-match-team-name">{home.short}</span>
          <span className="gb-match-team-score">{scoreHome}</span>
        </div>

        <div className={`gb-match-clock ${clock <= 10 ? 'is-urgent' : ''} ${golden ? 'is-golden' : ''}`}>
          <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
            <circle cx="28" cy="28" r="25" fill="none" stroke="var(--line)" strokeWidth="3"/>
            <circle
              cx="28" cy="28" r="25" fill="none"
              stroke={golden ? 'var(--warn)' : clock <= 10 ? 'var(--danger)' : 'var(--accent)'}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 25}`}
              strokeDashoffset={`${2 * Math.PI * 25 * (1 - clock / (effectiveDuration || 60))}`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: 'stroke-dashoffset 150ms linear, stroke 200ms' }}/>
          </svg>
          <div className="gb-match-clock-value">{clock}</div>
          <div className="gb-match-clock-sub">{golden ? 'GG' : 'sec'}</div>
        </div>

        <div className="gb-match-team gb-match-team-away">
          <span className="gb-match-team-score">{scoreAway}</span>
          <span className="gb-match-team-name">{away.short}</span>
          <span className="gb-match-team-swatch" style={{ background: away.primary }}/>
        </div>

        <div className="gb-match-hud-buttons">
          <button className="gb-hud-btn" onClick={restart} aria-label="Restart">{Icon.restart}</button>
          <button className="gb-hud-btn" onClick={() => { engineRef.current?.abort(); setRoute('menu'); }} aria-label="Quit to menu">{Icon.close}</button>
        </div>
      </header>

      <canvas
        ref={canvasRef}
        className="gb-match-canvas"
        width={PHYSICS.W}
        height={PHYSICS.H}/>

      {challenge && (
        <div className="gb-match-challenge-strip">
          <span className="gb-pill gb-pill-warm">Challenge</span>
          <b>{challenge.label}</b>
          <span>· {challenge.goal}</span>
        </div>
      )}

      <div className="gb-match-hint">
        {mode === '2p'
          ? 'P1: A/D · W · S    ·    P2: ← → · ↑ · /'
          : 'Move A/D · Jump W · Kick S (hold to charge)'}
        <span className="gb-match-hint-sep">·</span>
        <kbd>P</kbd> pause · <kbd>R</kbd> restart
      </div>

    </div>
  );
}
