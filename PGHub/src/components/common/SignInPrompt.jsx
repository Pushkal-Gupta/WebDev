import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import LoginModal from '../LoginModal';
import './SignInPrompt.css';

// Drop-in signed-out empty state: a centered card with a short reader-direct
// line plus Sign in / Create account buttons that open the real LoginModal
// locally, so a deep page can authenticate without hunting for the navbar.
export default function SignInPrompt({
  message = 'Sign in to pick up where you left off.',
  title = 'Sign in to continue',
  icon,
}) {
  const Icon = icon || ShieldCheck;
  const [showLogin, setShowLogin] = useState(false);
  const [startMode, setStartMode] = useState('login');

  const open = (mode) => {
    setStartMode(mode);
    setShowLogin(true);
  };

  return (
    <div className="signin-prompt">
      <div className="signin-prompt-card">
        <span className="signin-prompt-icon" aria-hidden="true">
          <Icon size={26} strokeWidth={1.8} />
        </span>
        <h2 className="signin-prompt-title">{title}</h2>
        <p className="signin-prompt-msg">{message}</p>
        <div className="signin-prompt-actions">
          <button
            type="button"
            className="signin-prompt-btn signin-prompt-btn--primary"
            onClick={() => open('login')}
            aria-label="Sign in"
          >
            <LogIn size={16} strokeWidth={2} /> Sign in
          </button>
          <button
            type="button"
            className="signin-prompt-btn signin-prompt-btn--ghost"
            onClick={() => open('signup')}
            aria-label="Create an account"
          >
            <UserPlus size={16} strokeWidth={2} /> Create account
          </button>
        </div>
      </div>

      {showLogin && (
        <LoginModal
          initialMode={startMode}
          onClose={() => setShowLogin(false)}
          onGoToSettings={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
