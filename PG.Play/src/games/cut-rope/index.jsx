// Cut the Rope — root component. Owns the canvas, the engine, the
// gameplay loop, the level lifecycle, and the UI overlay tree.

import { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';
import { makeEngine, screenToWorld } from './engine.js';
import { step as stepWorld, cutAlongSegment, cutAtPoint } from './physics.js';
import { LEVELS, PALETTE, levelById } from './levels.js';
import { loadLevel, disposeLevel } from './loader.js';
import { audio } from './audio.js';
import { spawnStarBurst, spawnConfetti, spawnCutPuff, tickFx, disposeAllFx } from './fx.js';
import { readState, recordAttempt } from './state.js';
import { submitScore } from '../../scoreBus.js';
import Hud from './ui/Hud.jsx';
import {
  StartScreen, LevelSelect, PauseMenu, LevelComplete, LevelFail, HintPill,
} from './ui/Overlays.jsx';

const STAR_PICKUP_RADIUS = 0.45;
const TARGET_PICKUP_RADIUS = 0.7;
const CUT_RADIUS = 0.22;
const SWIPE_MIN_DIST = 0.04;     // world units
const FAIL_OOB = { minX: -7, maxX: 7, maxY: 6.6 };
// Scenes that keep the canvas updating. Pause + menus freeze the loop.
const ALIVE_SCENES = { play: 1, won: 1, lost: 1 };

export default function CutRopeGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const levelRef = useRef(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const swipeRef = useRef({ active: false, lastX: 0, lastY: 0, moved: false, popped: false });
  const finishedRef = useRef(false);
  const camPunchRef = useRef(0);    // seconds remaining on the camera-zoom punch

  const [scene, setScene] = useState('start');     // 'start' | 'play' | 'levels' | 'paused' | 'won' | 'lost'
  const [levelId, setLevelId] = useState(LEVELS[0].id);
  const [reloadKey, setReloadKey] = useState(0);   // bump to force a level reload (retry)
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
      disposeAllFx(engine.scene);
      disposeLevel(engine.sceneRoot, levelRef.current);
      levelRef.current = null;
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Level lifecycle + RAF loop ────────────────────────────────────────
  // One effect controls both. Levels are (re)loaded only when the levelId
  // or reloadKey changes — pause/resume just toggles scene without
  // touching level state. The RAF loop runs while the level is visible:
  // play, won, lost. Pause + start screen + level select freeze the loop.
  useEffect(() => {
    if (!ALIVE_SCENES[scene]) return;
    const engine = engineRef.current;
    if (!engine) return;

    const cur = levelRef.current;
    const needsReload = !cur || cur._levelId !== levelId || cur._reloadKey !== reloadKey;

    if (needsReload) {
      disposeAllFx(engine.scene);
      disposeLevel(engine.sceneRoot, cur);
      const lv = loadLevel(engine.scene, engine.sceneRoot, level);
      lv._levelId = levelId;
      lv._reloadKey = reloadKey;
      lv._tetheredCache = true;
      levelRef.current = lv;
      engine.setBackdrop(lv.palette.backdropTop, lv.palette.backdropBot, lv.palette.floor);
      // Auto-attach bubble if the candy spawns inside one. We also nudge
      // the candy slightly sideways: with verlet+constraint physics, a
      // perfectly straight-down taut rope locks the candy in place and
      // the bubble can't lift it. The nudge gives the rope an angle so
      // bubble lift converts to a swing-up arc.
      for (const b of lv.bubbles) {
        const dx = lv.candy.point.x - b.state.x;
        const dy = lv.candy.point.y - b.state.y;
        if (Math.hypot(dx, dy) < b.state.r) {
          b.attach(lv.candy.point);
          const cp = lv.candy.point;
          cp.x += 0.04;
          cp.prevX -= 0.04;
        }
      }
      // Add rope meshes once at level load — the new rope geometry is
      // updated in place per frame; no re-add needed.
      for (const r of lv.ropes) if (r.mesh && !r.mesh.parent) engine.sceneRoot.add(r.mesh);
      finishedRef.current = false;
      setStars(0);
      setFailReason(null);
    }

    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      tick(dt);
      engine.renderer.render(engine.scene, engine.camera);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, levelId, reloadKey]);

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
      lv.candy.sync(dt);
      lv.ropes.forEach((r) => r.rebuild());
      return;
    }

    // Anchor track motion runs FIRST so this frame's physics step sees
    // the up-to-date pin positions; the chain feels the move on the
    // same frame instead of one frame late.
    lv.anchors.forEach((a) => a.update(dt));

    // Apply blower forces (force fields) to every active world point.
    for (const blower of lv.blowers) {
      blower.update();
      for (const p of lv.world.points) blower.apply(p);
    }

    // Step physics — fixed-step internally; dt is wall-clock.
    stepWorld(lv.world, dt);

    // Bubble follow + auto-pop on touch (handled by pointer; nothing here).
    let bubbleDirty = false;
    lv.bubbles.forEach((b) => {
      b.update(dt);
      if (b.state.alive && b.state.attached === lv.candy.point) {
        b.follow(lv.candy.point);
      }
      if (b.state.dirty) { bubbleDirty = true; b.state.dirty = false; }
    });
    if (bubbleDirty || lv.world.topologyDirty) {
      propagateBubbleState(lv);
    }

    // Star collect.
    let pickedAny = false;
    let starsNow = stars;
    for (const s of lv.stars) {
      if (s.state.taken) continue;
      const dx = s.state.x - lv.candy.point.x;
      const dy = s.state.y - lv.candy.point.y;
      if (Math.hypot(dx, dy) < STAR_PICKUP_RADIUS) {
        s.take();
        spawnStarBurst(engine.scene, s.state.x, s.state.y);
        pickedAny = true;
        starsNow += 1;
      }
      s.update(dt);
    }
    if (pickedAny) {
      audio.starGet();
      setStars(starsNow);
    }
    tickFx(dt, engine.scene);

    // Spike fail.
    for (const sp of lv.spikes) {
      if (sp.contains(lv.candy.point.x, lv.candy.point.y)) {
        finishLevel(false, 'spike', starsNow);
        return;
      }
    }

    // Out-of-bounds fail (after the candy is fully detached from every
    // anchor — i.e., no live constraint chain links it to any anchor).
    // Cached: only re-walk when the world topology actually changed.
    if (lv.world.topologyDirty) {
      lv._tetheredCache = isCandyTethered(lv);
      lv.world.topologyDirty = false;
      // If the candy is now free, snip any trailing tail constraints
      // so it falls cleanly instead of dragging invisible rope mass.
      if (!lv._tetheredCache) {
        const cs = lv.world.constraints;
        const cp = lv.candy.point;
        for (let i = 0; i < cs.length; i++) {
          const c = cs[i];
          if (c.alive && (c.a === cp || c.b === cp)) c.alive = false;
        }
      }
    }
    const tethered = lv._tetheredCache;
    const detached = !tethered;
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
    lv.candy.sync(dt);
    lv.tutorial?.update(dt);
    lv.ropes.forEach((r) => r.rebuild());

    // Camera punch — eases the ortho zoom back to 1 after a chomp.
    if (camPunchRef.current > 0) {
      camPunchRef.current = Math.max(0, camPunchRef.current - dt);
      const k = camPunchRef.current / 0.36;     // 1 → 0
      const punch = Math.sin(k * Math.PI) * 0.05;
      engine.camera.zoom = 1 + punch;
      engine.camera.updateProjectionMatrix();
    } else if (engine.camera.zoom !== 1) {
      engine.camera.zoom = 1;
      engine.camera.updateProjectionMatrix();
    }
  };

  // ── Level finish wiring ──────────────────────────────────────────────
  const finishLevel = (won, reason, finalStars) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (won) {
      audio.targetChomp();
      audio.levelClear();
      camPunchRef.current = 0.36;     // brief zoom-in then ease back
      const lv = levelRef.current;
      const engine = engineRef.current;
      if (lv && engine) spawnConfetti(engine.scene, lv.target.pos.x, lv.target.pos.y - 0.4);
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
    let popped = false;

    // Bubble-pop check at the press point. If a bubble is here, the
    // press counts as a pop only — we don't treat the same gesture as
    // a rope cut on pointerup.
    const lv = levelRef.current;
    if (lv) {
      for (const b of lv.bubbles) {
        if (!b.state.alive) continue;
        // Use the live mesh position when attached (it follows the candy);
        // otherwise the static def position.
        const bx = b.state.attached ? b.mesh.position.x : b.state.x;
        const by = b.state.attached ? b.mesh.position.y : b.state.y;
        const d = Math.hypot(w.x - bx, w.y - by);
        if (d < b.state.r + 0.18) {
          b.pop();
          audio.bubblePop();
          popped = true;
          break;
        }
      }
    }

    swipeRef.current = { active: true, lastX: w.x, lastY: w.y, moved: false, popped };
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
    if (cuts > 0) {
      audio.ropeCut();
      lv.candy.pulse();
      lv.tutorial?.fade();
      const mx = (sw.lastX + w.x) * 0.5;
      const my = (sw.lastY + w.y) * 0.5;
      spawnCutPuff(engine.scene, mx, my);
    }
    sw.lastX = w.x; sw.lastY = w.y; sw.moved = true;
  }, [scene]);

  const onPointerUp = useCallback((e) => {
    const sw = swipeRef.current;
    if (!sw.active) return;
    sw.active = false;
    if (scene !== 'play' || finishedRef.current) return;
    if (sw.moved || sw.popped) return;
    // Tap-cut fallback (only if the press wasn't already used to pop).
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const lv = levelRef.current;
    if (!engine || !canvas || !lv) return;
    const w = screenToWorld(engine.camera, canvas, e.clientX, e.clientY);
    const cuts = cutAtPoint(lv.world, w.x, w.y, CUT_RADIUS);
    if (cuts > 0) {
      audio.ropeCut();
      lv.candy.pulse();
      lv.tutorial?.fade();
      spawnCutPuff(engine.scene, w.x, w.y);
    }
  }, [scene]);

  // ── UI handlers ──────────────────────────────────────────────────────
  // Retry — bump the reload key (always forces a fresh load of the
  // current level) and ensure scene is 'play'. Bumping reloadKey alone
  // re-runs the level-life effect.
  const handleRetry = useCallback(() => {
    audio.buttonClick();
    setReloadKey((k) => k + 1);
    setScene('play');
  }, []);

  const onPause = useCallback(() => {
    if (scene === 'play') { audio.buttonClick(); setScene('paused'); }
  }, [scene]);

  // ── Keyboard ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'r' || e.key === 'R') handleRetry();
      else if (e.key === 'Escape') onPause();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRetry, onPause]);

  const onPlay = () => { audio.buttonClick(); setLevelId(firstUnplayedOrFirst(progress)); setScene('play'); };
  const onResume = () => { audio.buttonClick(); setScene('play'); lastRef.current = performance.now(); };
  const onMenu = () => { audio.buttonClick(); setScene('levels'); };
  const onPickLevel = (id) => { audio.buttonClick(); setLevelId(id); setScene('play'); };
  const onCloseLevels = () => { audio.buttonClick(); setScene('start'); };
  const onNext = () => {
    audio.buttonClick();
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    if (idx < LEVELS.length - 1) { setLevelId(LEVELS[idx + 1].id); setScene('play'); }
    else setScene('levels');
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
          {level.hint && <HintPill key={`${levelId}:${reloadKey}`} text={level.hint} />}
        </>
      )}

      {scene === 'won' && <div className="cr-flash" />}
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

// BFS along live constraints from candy; returns true iff any anchor
// point is reachable. Used to decide when the candy has been freed.
function isCandyTethered(lv) {
  const anchors = new Set(lv.anchors.map((a) => a.point));
  const candy = lv.candy.point;
  const visited = new Set([candy]);
  const queue = [candy];
  const cs = lv.world.constraints;
  while (queue.length) {
    const cur = queue.shift();
    if (anchors.has(cur)) return true;
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      if (!c.alive) continue;
      const other = c.a === cur ? c.b : c.b === cur ? c.a : null;
      if (other && !visited.has(other)) { visited.add(other); queue.push(other); }
    }
  }
  return false;
}

// Bubble buoyancy propagates along the alive chain. Without this, only
// the candy point gets `bubbled = true`, and the 12-segment rope's
// gravity-bound mass out-pulls the bubble's lift — the candy never
// rises. Runs only when a bubble state changes or the world topology
// changes (a cut), so it's not a per-frame walk.
function propagateBubbleState(lv) {
  const cs = lv.world.constraints;
  // Step 1: clear bubbled on all non-pinned points; we'll re-mark below.
  for (const p of lv.world.points) if (!p.pinned) p.bubbled = false;
  // Step 2: for each attached, alive bubble, BFS the alive chain from
  // its attached point and mark every reachable non-pinned point.
  for (const b of lv.bubbles) {
    if (!b.state.alive || !b.state.attached) continue;
    const seed = b.state.attached;
    const visited = new Set([seed]);
    const queue = [seed];
    seed.bubbled = true;
    while (queue.length) {
      const cur = queue.shift();
      for (let i = 0; i < cs.length; i++) {
        const c = cs[i];
        if (!c.alive) continue;
        const other = c.a === cur ? c.b : c.b === cur ? c.a : null;
        if (other && !visited.has(other) && !other.pinned) {
          visited.add(other);
          other.bubbled = true;
          queue.push(other);
        }
      }
    }
  }
}
