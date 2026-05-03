// Frost Fight — overlays (level intro, level clear chip, win card).
//
// All entries fade in / out via framer-motion and short-circuit under
// reduced motion. The level-intro card is dismissable (click / any key)
// but auto-dismisses after ~1.1 s. The win card is sticky and offers
// Play again + Back to lobby.

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
