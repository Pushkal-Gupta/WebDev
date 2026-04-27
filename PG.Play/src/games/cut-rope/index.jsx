// Cut the Rope — root component. Owns the canvas, the engine, the
// gameplay loop, the level lifecycle, and the UI overlay tree.

import { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';
import { makeEngine, screenToWorld } from './engine.js';
import { step as stepWorld, cutAlongSegment, cutAtPoint } from './physics.js';
import { LEVELS, PALETTE, levelById } from './levels.js';
import { loadLevel, disposeLevel } from './loader.js';
import { audio } from './audio.js';
import { readState, recordAttempt } from './state.js';
import { submitScore } from '../../scoreBus.js';
import Hud from './ui/Hud.jsx';
import {
  StartScreen, LevelSelect, PauseMenu, LevelComplete, LevelFail, HintPill,
} from './ui/Overlays.jsx';

const STAR_PICKUP_RADIUS = 0.45;
const TARGET_PICKUP_RADIUS = 0.7;
const CUT_RADIUS = 0.18;
const SWIPE_MIN_DIST = 0.04;     // world units
const FAIL_OOB = { minX: -7, maxX: 7, maxY: 6.6 };

export default function CutRopeGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const levelRef = useRef(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const swipeRef = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const finishedRef = useRef(false);

  const [scene, setScene] = useState('start');     // 'start' | 'play' | 'levels' | 'paused' | 'won' | 'lost'
  const [levelId, setLevelId] = useState(LEVELS[0].id);
  const [stars, setStars] = useState(0);
  const [failReason, setFailReason] = useState(null);
  const [progress, setProgress] = useState(() => readState());

  const level = levelById(levelId) || LEVELS[0];
  const hasNext = LEVELS.findIndex((l) => l.id === level.id) < LEVELS.length - 1;

  // ── Engine bootstrap (mounts once) ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const engine = makeEngine({ canvas });
    engineRef.current = engine;

    const fitToWrap = () => {
      const r = wrap.getBoundingClientRect();
      const w = Math.max(2, Math.floor(r.width));
      const h = Math.max(2, Math.floor(r.height));
      engine.fit(w, h);
    };
    fitToWrap();
    const ro = new ResizeObserver(fitToWrap);
    ro.observe(wrap);
    window.addEventListener('orientationchange', fitToWrap);

    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', fitToWrap);
      cancelAnimationFrame(rafRef.current);
      disposeLevel(engine.sceneRoot, levelRef.current);
      levelRef.current = null;
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mount/swap a level when entering play ─────────────────────────────
  useEffect(() => {
    if (scene !== 'play') return;
    const engine = engineRef.current;
    if (!engine) return;

    // Tear down any previous level.
    disposeLevel(engine.sceneRoot, levelRef.current);

    // Fresh load.
    const lv = loadLevel(engine.scene, engine.sceneRoot, level);
    levelRef.current = lv;
    engine.setBackdrop(lv.palette.backdropTop, lv.palette.backdropBot);

    // If there's an initial bubble around the candy, attach it.
    for (const b of lv.bubbles) {
      const dx = lv.candy.point.x - b.state.x;
      const dy = lv.candy.point.y - b.state.y;
      if (Math.hypot(dx, dy) < b.state.r) b.attach(lv.candy.point);
    }

    finishedRef.current = false;
    setStars(0);
    setFailReason(null);

    // Kick the loop.
    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.034, (now - lastRef.current) / 1000);
      lastRef.current = now;
      tick(dt);
      engine.renderer.render(engine.scene, engine.camera);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, levelId]);

  // ── Main per-frame tick ───────────────────────────────────────────────
  const tick = (dt) => {
    const engine = engineRef.current;
    const lv = levelRef.current;
    if (!engine || !lv) return;
    if (finishedRef.current) {
      // Keep the scene rendering smoothly during the win/fail UI but stop
      // physics so the candy holds its final pose.
      lv.target.update(dt, lv.candy.point);
      lv.stars.forEach((s) => s.update(dt));
      lv.candy.sync();
      lv.ropes.forEach((r) => r.rebuild());
      attachRopeMeshes(engine, lv);
      return;
    }

    // Apply blower forces (force fields) to every active world point.
    for (const blower of lv.blowers) {
      blower.update();
      for (const p of lv.world.points) blower.apply(p);
    }

    // Step physics.
    stepWorld(lv.world, dt);

    // Anchor track motion (after the integrate, so the next step feels it).
    lv.anchors.forEach((a) => a.update(dt));

    // Bubble follow + auto-pop on touch (handled by pointer; nothing here).
    lv.bubbles.forEach((b) => {
      b.update(dt);
      if (b.state.alive && b.state.attached === lv.candy.point) {
        b.follow(lv.candy.point);
      }
    });

    // Star collect.
    let pickedAny = false;
    let starsNow = stars;
    for (const s of lv.stars) {
      if (s.state.taken) continue;
      const dx = s.state.x - lv.candy.point.x;
      const dy = s.state.y - lv.candy.point.y;
      if (Math.hypot(dx, dy) < STAR_PICKUP_RADIUS) {
        s.take();
        pickedAny = true;
        starsNow += 1;
      }
      s.update(dt);
    }
    if (pickedAny) {
      audio.starGet();
      setStars(starsNow);
    }

    // Spike fail.
    for (const sp of lv.spikes) {
      if (sp.contains(lv.candy.point.x, lv.candy.point.y)) {
        finishLevel(false, 'spike', starsNow);
        return;
      }
    }

    // Out-of-bounds fail (after the candy has fully detached from rope).
    const allRopesDead = lv.ropes.every((r) => !r.points.some((p) => isPointInAliveChain(lv.world, p)));
    const detached = allRopesDead;
    if (detached) {
      const c = lv.candy.point;
      if (c.x < FAIL_OOB.minX || c.x > FAIL_OOB.maxX || c.y > FAIL_OOB.maxY) {
        finishLevel(false, 'oob', starsNow);
        return;
      }
    }

    // Target chomp — only after the candy is moving roughly toward Mochi
    // and within the pickup radius. Detached candy only.
    if (detached) {
      const c = lv.candy.point;
      const t = lv.target.pos;
      const d = Math.hypot(c.x - t.x, c.y - t.y);
      if (d < TARGET_PICKUP_RADIUS) {
        lv.target.setPhase('chomp');
        finishLevel(true, null, starsNow);
        return;
      }
    }

    lv.target.update(dt, lv.candy.point);
    lv.candy.sync();
    lv.ropes.forEach((r) => r.rebuild());
    attachRopeMeshes(engine, lv);
  };

  // Add any newly-rebuilt rope meshes that aren't yet in the scene tree.
  const attachRopeMeshes = (engine, lv) => {
    for (const r of lv.ropes) {
      if (r.mesh && !r.mesh.parent) engine.sceneRoot.add(r.mesh);
    }
  };

  // ── Level finish wiring ──────────────────────────────────────────────
  const finishLevel = (won, reason, finalStars) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (won) {
      audio.targetChomp();
      audio.levelClear();
      const next = recordAttempt(progress, level.id, finalStars, true);
      setProgress(next);
      // Submit the per-level star count. Edge fn maxScore is 50.
      submitScore('cutrope', finalStars * 10 + level.world * 1, {
        level: `${level.world}-${level.number}`,
        levelId: level.id,
        world: level.world,
        stars: finalStars,
      });
      setScene('won');
    } else {
      audio.levelFail();
      const lv = levelRef.current;
      if (lv?.target?.setPhase) lv.target.setPhase('sad');
      setFailReason(reason);
      setScene('lost');
    }
  };

  // ── Pointer / cut handling ───────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (scene !== 'play' || finishedRef.current) return;
    e.preventDefault();
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;
    const w = screenToWorld(engine.camera, canvas, e.clientX, e.clientY);
    swipeRef.current = { active: true, lastX: w.x, lastY: w.y, moved: false };

    // Bubble-pop check at the press point.
    const lv = levelRef.current;
    if (lv) {
      for (const b of lv.bubbles) {
        if (!b.state.alive) continue;
        const d = Math.hypot(w.x - b.state.x, w.y - b.state.y);
        if (d < b.state.r + 0.12) {
          b.pop();
          audio.bubblePop();
          break;
        }
        // If the bubble is attached + moving with the candy, follow its mesh.
        if (b.state.attached) {
          const m = b.mesh.position;
          const d2 = Math.hypot(w.x - m.x, w.y - m.y);
          if (d2 < b.state.r + 0.18) { b.pop(); audio.bubblePop(); break; }
        }
      }
    }
  }, [scene]);

  const onPointerMove = useCallback((e) => {
    const sw = swipeRef.current;
    if (!sw.active) return;
    if (scene !== 'play' || finishedRef.current) return;
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const lv = levelRef.current;
    if (!engine || !canvas || !lv) return;
    const w = screenToWorld(engine.camera, canvas, e.clientX, e.clientY);
    const dx = w.x - sw.lastX, dy = w.y - sw.lastY;
    if (Math.hypot(dx, dy) < SWIPE_MIN_DIST) return;
    const cuts = cutAlongSegment(lv.world, sw.lastX, sw.lastY, w.x, w.y);
    if (cuts > 0) audio.ropeCut();
    sw.lastX = w.x; sw.lastY = w.y; sw.moved = true;
  }, [scene]);

  const onPointerUp = useCallback((e) => {
    const sw = swipeRef.current;
    if (!sw.active) return;
    sw.active = false;
    if (scene !== 'play' || finishedRef.current) return;
    if (sw.moved) return;
    // Tap-cut fallback.
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const lv = levelRef.current;
    if (!engine || !canvas || !lv) return;
    const w = screenToWorld(engine.camera, canvas, e.clientX, e.clientY);
    const cuts = cutAtPoint(lv.world, w.x, w.y, CUT_RADIUS);
    if (cuts > 0) audio.ropeCut();
  }, [scene]);

  // ── Keyboard ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'r' || e.key === 'R') { onRetry(); }
      else if (e.key === 'Escape') { onPause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // ── UI handlers ──────────────────────────────────────────────────────
  const onPlay = () => { audio.buttonClick(); setLevelId(firstUnplayedOrFirst(progress)); setScene('play'); };
  const onPause = () => { if (scene === 'play') { audio.buttonClick(); setScene('paused'); } };
  const onResume = () => { audio.buttonClick(); setScene('play'); lastRef.current = performance.now(); };
  const onRetry = () => { audio.buttonClick(); setScene('play'); /* effect dep on scene/levelId reloads */ setLevelId((id) => id); /* nudge */ };
  const onMenu = () => { audio.buttonClick(); setScene('levels'); };
  const onPickLevel = (id) => { audio.buttonClick(); setLevelId(id); setScene('play'); };
  const onCloseLevels = () => { audio.buttonClick(); setScene('start'); };
  const onNext = () => {
    audio.buttonClick();
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    if (idx < LEVELS.length - 1) { setLevelId(LEVELS[idx + 1].id); setScene('play'); }
    else setScene('levels');
  };

  // Force a reload of the same level by toggling a key — the easy hack is
  // to swap to a sentinel and back, but we already trigger reload on the
  // 'play' scene effect. So onRetry just sets scene back to 'play' from
  // a non-play scene, which re-runs the effect.
  const reTriggerSameLevel = () => {
    setScene('paused');                  // briefly leave 'play'
    setTimeout(() => setScene('play'), 0);
  };
  // Wire onRetry properly — leaving + returning re-runs the load effect.
  const handleRetry = () => {
    audio.buttonClick();
    if (scene === 'play') reTriggerSameLevel();
    else setScene('play');
  };

  return (
    <div className="cutrope-root" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="cr-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {scene === 'play' && (
        <>
          <Hud
            level={level}
            stars={stars}
            onPause={onPause}
            onRetry={handleRetry}
            onMenu={onMenu}
          />
          {level.hint && <HintPill text={level.hint} />}
        </>
      )}

      {scene === 'start'  && <StartScreen progress={progress} onPlay={onPlay} onLevelSelect={() => setScene('levels')} />}
      {scene === 'levels' && <LevelSelect progress={progress} onPick={onPickLevel} onClose={onCloseLevels} />}
      {scene === 'paused' && <PauseMenu onResume={onResume} onRetry={handleRetry} onMenu={onMenu} />}
      {scene === 'won'    && <LevelComplete stars={stars} level={level} onRetry={handleRetry} onNext={onNext} onMenu={onMenu} hasNext={hasNext} />}
      {scene === 'lost'   && <LevelFail reason={failReason} onRetry={handleRetry} onMenu={onMenu} />}
    </div>
  );
}

function firstUnplayedOrFirst(progress) {
  for (const l of LEVELS) {
    if (!progress.levels[l.id]?.cleared) return l.id;
  }
  return LEVELS[0].id;
}

// True if the given point is part of any rope chain that's still attached
// from anchor through to candy. Used for "the candy detached" detection.
function isPointInAliveChain(world, p) {
  return world.constraints.some((c) => c.alive && (c.a === p || c.b === p));
}
