// ErrorBoundary — last-line catcher around the app router.
//
// React class component because hooks can't catch render errors. When any
// child throws during render/lifecycle/effects-that-bubble, we swap the
// tree for a friendly ErrorState card with a retry that resets `hasError`
// (and replaces the children — so the next attempt mounts fresh).
//
// We also stash the error string so the user can expand <details> if they
// want to ping the dev with something concrete.

import { Component } from 'react';
import ErrorState from './states/ErrorState.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface to console for local debugging — production observability
    // would plug a logger here. We deliberately don't swallow.
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[PG.Play] ErrorBoundary caught:', error, info);
    }
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      const detail = this.state.error
        ? (this.state.error.stack || this.state.error.message || String(this.state.error))
        : null;
      return (
        <div className="err-wrap">
          <ErrorState
            title="Something broke."
            body="We're sorry. Hit reload — and ping the dev if it keeps happening."
            onRetry={this.handleRetry}
            details={detail}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
