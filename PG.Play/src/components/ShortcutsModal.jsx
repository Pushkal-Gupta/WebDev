// ShortcutsModal — pressed `?` from anywhere on the platform shell.
// Closed by default; opens via the global hotkey listener installed once
// in App.jsx. Escape or click-outside dismisses.

import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../icons.jsx';

const ROWS = [
  { keys: ['⌘', 'K'], label: 'Open the search palette', context: 'anywhere' },
  { keys: ['↵'],      label: 'Launch the highlighted game',    context: 'in search' },
  { keys: ['↑', '↓'], label: 'Move highlight in search',       context: 'in search' },
  { keys: ['Esc'],    label: 'Close any panel or exit play',   context: 'anywhere' },
  { keys: ['P'],      label: 'Pause / resume the game',        context: 'in game' },
  { keys: ['R'],      label: 'Restart the game',               context: 'in game' },
  { keys: ['M'],      label: 'Mute / unmute audio',            context: 'in game' },
  { keys: ['F'],      label: 'Toggle fullscreen',              context: 'in game' },
  { keys: ['?'],      label: 'Show this list',                 context: 'anywhere' },
];

export default function ShortcutsModal({ open, onClose }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="shortcuts-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title">
          <motion.div
            className="shortcuts-card glass-strong"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <div className="shortcuts-head">
              <div>
                <div className="shortcuts-kicker">Keyboard</div>
                <h2 id="shortcuts-title" className="shortcuts-title">Shortcuts</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                aria-label="Close shortcuts">
                {Icon.close}
              </button>
            </div>
            <ul className="shortcuts-list">
              {ROWS.map((row, i) => (
                <li key={i} className="shortcuts-row">
                  <span className="shortcuts-keys">
                    {row.keys.map((k, ki) => (
                      <kbd key={ki} className="shortcuts-kbd">{k}</kbd>
                    ))}
                  </span>
                  <span className="shortcuts-label">{row.label}</span>
                  <span className="shortcuts-ctx">{row.context}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
