// ErrorState — friendly error card.
//
// Sibling to EmptyState. Used by the global ErrorBoundary and by any page
// that wants to surface a recoverable failure without bouncing the user
// to a blank screen. Tone is conversational ("Try again — it's usually a
// one-time hiccup."), not corporate stack-trace energy.
//
// Props:
//   title    — heading (display font)
//   body     — short body copy
//   onRetry  — optional callback. When present, a primary "Retry" button
//              renders below the body.
//   details  — optional pre-formatted technical detail. Hidden by default
//              behind a <details> disclosure for the curious / for bug
//              reports. Plain string or JSX both work.

import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '../../icons.jsx';

export default function ErrorState({
  title = "Something didn't load",
  body = "Try again — it's usually a one-time hiccup.",
  onRetry,
  details,
  className = '',
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`err glass ${className}`.trim()}
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
    >
      <div className="err-icon" aria-hidden="true">{Icon.alert}</div>
      <div className="err-title">{title}</div>
      <div className="err-body">{body}</div>
      {onRetry ? (
        <div className="err-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      ) : null}
      {details ? (
        <details className="err-details">
          <summary>Details</summary>
          <pre>{typeof details === 'string' ? details : String(details)}</pre>
        </details>
      ) : null}
    </motion.div>
  );
}
