// Onboarding — a one-shot tip for first-time visitors.
//
// Renders a small glass card in the bottom-right with two hints (search
// shortcut + featured CTA) and a dismiss button. Persists dismissal in
// localStorage under `pgplay_onboarded` so it never appears twice.
// Auto-dismisses after 12 seconds even if the user ignores it.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../icons.jsx';

const KEY = 'pgplay_onboarded';

export default function Onboarding({ featuredName }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(KEY) !== '1'; }
    catch { return false; }
  });

  useEffect(() => {
    if (!open) return;
    // Auto-dismiss after 12s.
    const t = setTimeout(() => dismiss(), 12000);
    // Or on first ⌘K / first click on a bento card — both indicate
    // the user has self-discovered the affordances.
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') dismiss();
    };
    const onClick = (e) => {
      if (e.target.closest('.bento-card, .editors-tile, .home-hero-actions')) dismiss();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick, true);
    };
  }, [open]);

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="onboard glass-strong"
          role="dialog"
          aria-label="Welcome tip"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: reduced ? 0 : 0.32, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.6 }}
        >
          <div className="onboard-head">
            <span className="onboard-kicker">First time?</span>
            <button
              type="button"
              className="onboard-close"
              onClick={dismiss}
              aria-label="Dismiss welcome tip"
            >
              {Icon.close}
            </button>
          </div>
          <ul className="onboard-list">
            <li className="onboard-row">
              <kbd className="onboard-kbd">⌘K</kbd>
              <span>Search any game by name, genre, or vibe</span>
            </li>
            <li className="onboard-row">
              <kbd className="onboard-kbd">{Icon.play}</kbd>
              <span>Hit <b>Play {featuredName || 'featured'}</b> at the top — it's the new one</span>
            </li>
          </ul>
          <div className="onboard-foot">
            One click and you're in. No accounts, no downloads.
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
