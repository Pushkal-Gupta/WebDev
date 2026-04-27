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

export function WinCard({ open, deaths, time, levelCount, onPlayAgain, onExit }) {
  const reduced = useReducedMotion();
  const m = Math.floor(time / 60);
  const s = time % 60;
  const t = m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
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
