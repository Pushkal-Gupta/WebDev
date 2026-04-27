// Frost Fight — bottom rail.
//
// Three columns on desktop: keycaps · contextual tip · CTA slot.
// Tip line evolves through play (level intro → "all clear" → "frozen,
// respawning" → win). Caller passes `tip` already resolved.

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function Key({ children, wide, active, tone }) {
  const cls = ['ff-key'];
  if (wide) cls.push('ff-key-wide');
  if (active) cls.push('is-active');
  if (tone) cls.push('ff-key-' + tone);
  return <kbd className={cls.join(' ')}>{children}</kbd>;
}

export default function BottomRail({ tip, status, isTouch, freezeAction, dangerDirs, onPlayAgain }) {
  const reduced = useReducedMotion();
  // Adaptive: when the player faces a freezable / meltable tile, the
  // SPACE cap lights up. Cyan for freeze, warm rose for melt — matches
  // the in-canvas cursor highlight colors.
  const spaceActive = !!freezeAction;
  const spaceTone   = freezeAction === 'melt' ? 'warm' : freezeAction === 'freeze' ? 'cool' : null;
  const spaceLabel  = freezeAction === 'melt' ? 'Melt' : freezeAction === 'freeze' ? 'Freeze' : 'Freeze · Melt';
  // Danger mask: 'u', 'd', 'l', 'r' = enemy one tile in that direction.
  const danger = dangerDirs || '';
  const moveLabel = danger ? 'Threat adjacent' : 'Move';
  return (
    <div className="ff-rail-row">
      {!isTouch ? (
        <div className="ff-keycaps" aria-label="Controls">
          <span className="ff-keycap-group">
            <Key active={danger.includes('u')} tone={danger.includes('u') ? 'danger' : null}>W</Key>
            <Key active={danger.includes('l')} tone={danger.includes('l') ? 'danger' : null}>A</Key>
            <Key active={danger.includes('d')} tone={danger.includes('d') ? 'danger' : null}>S</Key>
            <Key active={danger.includes('r')} tone={danger.includes('r') ? 'danger' : null}>D</Key>
            <span className={'ff-keycap-label' + (danger ? ' is-danger' : '')}>{moveLabel}</span>
          </span>
          <span className="ff-keycap-group">
            <Key wide active={spaceActive} tone={spaceTone}>Space</Key>
            <span className="ff-keycap-label">{spaceLabel}</span>
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
