// Frost Fight — overlays (level intro, level clear chip, win card).
//
// All entries fade in / out via framer-motion and short-circuit under
// reduced motion. The level-intro card is dismissable (click / any key)
// but auto-dismisses after ~1.1 s. The win card is sticky and offers
// Play again + Back to lobby.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export function LevelIntro({ open, levelIdx, levelName, levelTip }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="intro"
          className="ff-overlay ff-overlay-intro"
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          aria-live="polite">
          <motion.div
            className="ff-card ff-card-intro"
            initial={reduced ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: -10, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
            <div className="ff-card-eyebrow">Room {levelIdx + 1}</div>
            <div className="ff-card-title">{levelName}</div>
            <div className="ff-card-body">{levelTip}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LevelClearChip({ open, levelName }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="clear"
          className="ff-clear-chip"
          initial={reduced ? { opacity: 0 } : { y: -8, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { y: -8, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}>
          <span className="ff-clear-chip-tag">Room cleared</span>
          <span className="ff-clear-chip-name">{levelName}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fmt(time) {
  const m = Math.floor(time / 60);
  const s = time % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

export function WinCard({ open, deaths, time, best, bestBeaten, levelCount, peaches, coverUrl, onPlayAgain, onExit }) {
  const reduced = useReducedMotion();
  const t = fmt(time);
  // Best line — show the recorded best and a small "NEW BEST" tag when
  // the just-finished run improved on it.
  const hasBest = best && typeof best.time === 'number';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="win"
          className="ff-overlay ff-overlay-win"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-label="You win">
          <motion.div
            className="ff-card ff-card-win"
            initial={reduced ? false : { y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}>
            {coverUrl && (
              <div
                className="ff-card-art"
                aria-hidden="true"
                style={{ backgroundImage: `url(${coverUrl})` }}/>
            )}
            <div className="ff-card-eyebrow">All rooms cleared</div>
            <div className="ff-card-title ff-card-title-xl">Frost Fight</div>
            <div className="ff-card-stats">
              <div className="ff-card-stat">
                <span>Rooms</span><b>{levelCount}</b>
              </div>
              <div className="ff-card-stat">
                <span>Deaths</span><b>{deaths}</b>
              </div>
              <div className="ff-card-stat">
                <span>Time</span><b>{t}</b>
              </div>
              <div className={'ff-card-stat ff-card-stat-best' + (bestBeaten ? ' is-new' : '')}>
                <span>{bestBeaten ? 'New best' : 'Best'}</span>
                <b>{hasBest ? fmt(best.time) : '—'}</b>
              </div>
              {peaches > 0 && (
                <div className="ff-card-stat ff-card-stat-peach">
                  <span>Peaches</span><b>{peaches}</b>
                </div>
              )}
            </div>
            <div className="ff-card-cta">
              <button type="button" className="btn btn-primary btn-lg" onClick={onPlayAgain}>
                Play again
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={onExit}>
                Back to lobby
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Phase 19 — game-over card. Fires when the run-wide lives pool is
// exhausted (or first death on Insane). Mirrors the WinCard chrome
// with a warm-danger tint. Try Again restarts the run from the
// lobby's chosen start level; Back returns to the lobby.
export function GameOverCard({ open, deaths, time, levelIdx, levelCount, levelName, difficulty, onPlayAgain, onExit }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gameover"
          className="ff-overlay ff-overlay-gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-label="Game over">
          <motion.div
            className="ff-card ff-card-gameover"
            initial={reduced ? false : { y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}>
            <div className="ff-card-eyebrow">Out of lives</div>
            <div className="ff-card-title ff-card-title-xl">Game over</div>
            <div className="ff-card-body">
              {difficulty?.label} run ended on <b>{levelName}</b>. Lower the difficulty or learn the row casts.
            </div>
            <div className="ff-card-stats">
              <div className="ff-card-stat"><span>Difficulty</span><b>{difficulty?.label}</b></div>
              <div className="ff-card-stat"><span>Reached</span><b>{levelIdx + 1}/{levelCount}</b></div>
              <div className="ff-card-stat"><span>Deaths</span><b>{deaths}</b></div>
              <div className="ff-card-stat"><span>Time</span><b>{fmt(time)}</b></div>
            </div>
            <div className="ff-card-cta">
              <button type="button" className="btn btn-primary btn-lg" onClick={onPlayAgain}>
                Try again
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={onExit}>
                Back to lobby
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Theme preload overlay — covers the canvas while preloadTheme warms
// every atlas frame + wall + floor texture for the chosen theme.
// Visualised as a circular cyan ring that fills as progress climbs;
// the percentage number in the centre interpolates smoothly between
// actual report ticks so the readout reads as continuous rather than
// jumping in chunks. A second concentric ring spins behind it for
// motion, plus a soft pulse to keep the wait visually alive.
export function ThemePreloadOverlay({ open, themeLabel, progress }) {
  const reduced = useReducedMotion();
  const target = Math.max(0, Math.min(1, progress || 0));

  // Smooth-tick the displayed percentage toward the actual progress so
  // the number isn't a step function. Each animation frame eases ~12%
  // of the remaining gap so the digit climbs visibly even when load
  // settles in big batches.
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      const next = shownRef.current + (target - shownRef.current) * 0.12;
      const snapped = Math.abs(target - next) < 0.0008 ? target : next;
      shownRef.current = snapped;
      setShown(snapped);
      if (snapped !== target || target < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, target]);

  // Reset the smoothing baseline when the overlay reopens for a new
  // theme so the ring doesn't flash back from 100%.
  useEffect(() => {
    if (open) {
      shownRef.current = 0;
      setShown(0);
    }
  }, [open]);

  const pct = Math.max(0, Math.min(1, shown));
  const pctText = Math.round(pct * 100);
  // SVG ring geometry. Radius 56 → circumference ≈ 351.86. Stroke 7
  // sits comfortably inside an 130×130 svg viewBox.
  const R = 56;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - pct);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="preload"
          className="ff-overlay ff-overlay-preload"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-live="polite"
          role="status">
          <motion.div
            className="ff-card ff-card-preload"
            initial={reduced ? false : { y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}>
            <div className="ff-preload-ring-wrap">
              {/* Spinning halo behind the progress ring — pure decoration. */}
              <div className="ff-preload-halo" aria-hidden="true"/>
              <svg
                className="ff-preload-ring"
                viewBox="0 0 130 130"
                aria-hidden="true">
                <defs>
                  <linearGradient id="ff-preload-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#6cd0f0"/>
                    <stop offset="50%"  stopColor="#a8ecff"/>
                    <stop offset="100%" stopColor="#6cd0f0"/>
                  </linearGradient>
                  <filter id="ff-preload-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="b"/>
                    <feMerge>
                      <feMergeNode in="b"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Track */}
                <circle
                  cx="65" cy="65" r={R}
                  fill="none"
                  stroke="rgba(108, 208, 240, 0.14)"
                  strokeWidth="7"/>
                {/* Progress arc — rotated -90° so it grows from the top. */}
                <circle
                  cx="65" cy="65" r={R}
                  fill="none"
                  stroke="url(#ff-preload-grad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={dashOffset}
                  filter="url(#ff-preload-glow)"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '65px 65px',
                    transition: 'stroke-dashoffset 80ms linear',
                  }}/>
              </svg>
              <div className="ff-preload-pct">
                <span className="ff-preload-pct-num">{pctText}</span>
                <span className="ff-preload-pct-sym">%</span>
              </div>
            </div>
            <div className="ff-card-eyebrow">Loading</div>
            <div className="ff-card-title">{themeLabel}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
