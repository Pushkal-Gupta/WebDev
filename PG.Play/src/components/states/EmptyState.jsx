// EmptyState — friendly placeholder for "we have nothing to show yet."
//
// Used wherever a list/grid renders zero items: empty favorites tab, empty
// leaderboard, search-with-no-results, etc. The tone of voice is sharp and
// confident — each consumer passes its own copy, this component just paints
// a glass card with an icon, title (display font), body (dim), and an
// optional CTA.
//
// `icon` accepts either an Icon name string (looked up on Icon.*) or a JSX
// node, so callers can stay terse while keeping the door open for one-off
// graphics later.

import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '../../icons.jsx';

export default function EmptyState({
  icon = 'sparkle',
  title,
  body,
  action,
  className = '',
}) {
  const reduce = useReducedMotion();
  const node = typeof icon === 'string' ? Icon[icon] || Icon.sparkle : icon;

  const enter = reduce
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0 };
  const initial = reduce
    ? { opacity: 0, y: 0 }
    : { opacity: 0, y: 8 };

  return (
    <motion.div
      className={`empty glass ${className}`.trim()}
      initial={initial}
      animate={enter}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      role="status"
    >
      <div className="empty-icon" aria-hidden="true">{node}</div>
      {title ? <div className="empty-title">{title}</div> : null}
      {body ? <div className="empty-body">{body}</div> : null}
      {action ? (
        <div className="empty-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
