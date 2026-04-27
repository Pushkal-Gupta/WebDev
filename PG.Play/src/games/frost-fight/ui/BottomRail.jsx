// Frost Fight — bottom rail.
//
// Three columns on desktop: keycaps · contextual tip · CTA slot.
// Tip line evolves through play (level intro → "all clear" → "frozen,
// respawning" → win). Caller passes `tip` already resolved.

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function Key({ children, wide }) {
  return <kbd className={'ff-key' + (wide ? ' ff-key-wide' : '')}>{children}</kbd>;
}

export default function BottomRail({ tip, status, isTouch, onPlayAgain }) {
  const reduced = useReducedMotion();
  return (
    <div className="ff-rail-row">
      {!isTouch ? (
        <div className="ff-keycaps" aria-label="Controls">
          <span className="ff-keycap-group">
            <Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key>
            <span className="ff-keycap-label">Move</span>
          </span>
          <span className="ff-keycap-group">
            <Key wide>Space</Key>
            <span className="ff-keycap-label">Freeze · Melt</span>
          </span>
          <span className="ff-keycap-group">
            <Key>R</Key>
            <span className="ff-keycap-label">Restart room</span>
          </span>
        </div>
      ) : (
        <div className="ff-keycaps ff-keycaps-touch">
          <span className="ff-keycap-label">Pad to move · Action to freeze a tile</span>
        </div>
      )}

      <div className="ff-rail-tip" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span
            key={tip}
            initial={reduced ? false : { y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: -6, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            {tip}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="ff-rail-cta">
        {status === 'won' && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onPlayAgain}>
            Play again
          </button>
        )}
      </div>
    </div>
  );
}
