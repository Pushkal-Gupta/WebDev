// AchievementToast — landing moment for unlock events.
//
// The earlier version was a small static card. Polished to feel like a
// real moment: glass surface, gradient trophy badge, framer-motion
// scale+slide entrance, exit when the toast clears.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '../icons.jsx';

export default function AchievementToast({ toast }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id || `${toast.label}-${toast.desc}`}
          className="ach-toast glass-strong"
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          transition={{ duration: reduced ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ach-toast-badge" aria-hidden="true">
            {Icon.trophy}
          </div>
          <div className="ach-toast-text">
            <div className="ach-toast-kicker">Achievement unlocked</div>
            <div className="ach-toast-title">{toast.label}</div>
            {toast.desc && <div className="ach-toast-desc">{toast.desc}</div>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
