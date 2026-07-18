import React from 'react';

// Granular error boundary so a single bad visualization / editorial / renderer
// can never white-screen the whole route. Wrap any risky subtree; on a render
// throw it shows a compact, theme-token fallback instead of crashing the page.
// `label` names what failed; `silent` renders nothing at all (for optional
// sections that should just disappear when they can't render).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Keep the detail out of the UI (no DB names / stack in user-facing text);
    // a console line is enough for local debugging.
    if (import.meta.env?.DEV) console.error('[ErrorBoundary]', this.props.label || 'section', error);
  }

  componentDidUpdate(prevProps) {
    // Recover automatically when the caller swaps in new content (e.g. a
    // different problem), so one bad problem doesn't wedge the panel forever.
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      if (this.props.silent) return null;
      return (
        <div
          style={{
            padding: '0.85rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--surface)',
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
            lineHeight: 1.5,
          }}
        >
          {this.props.fallback || `This ${this.props.label || 'section'} couldn't be displayed. The rest of the page is unaffected.`}
        </div>
      );
    }
    return this.props.children;
  }
}
