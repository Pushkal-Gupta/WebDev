import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginModal from './LoginModal';
import AccountModal from './AccountModal';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme, applyTheme, setPreferredLang, preferredLang }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Brand link doubles as cross-app navigation:
  // - On the PGcode home (roadmap), brand → portfolio hub
  // - Anywhere deeper inside PGcode, brand → back to PGcode root
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '';
  const brandHref = isHome
    ? 'https://pushkalgupta.com/PG/main.html'
    : 'https://pushkalgupta.com/PGcode/dist/index.html';

  return (
    <header className="pg-header">
      <div className="pg-wrap">
        <div className="nav-group">
          <div className="nav-left">
            <a href={brandHref} className="brand-link">
              Pushkal Gupta <span className="brand-suffix">Code</span>
            </a>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="toggle-wrap"
              onClick={toggleTheme}
              aria-label={`Switch theme (current: ${theme})`}
              title={`Theme: ${theme} — click to switch`}
            >
              <span className="toggle-label">{theme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              <div className="switch-base"></div>
            </button>

            {session ? (
              <button className="auth-btn" onClick={() => setShowAccount(true)}>
                ACCOUNT
              </button>
            ) : (
              <button className="auth-btn" onClick={() => setShowLogin(true)}>
                LOGIN
              </button>
            )}
          </div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showAccount && (
        <AccountModal
          session={session}
          theme={theme}
          applyTheme={applyTheme}
          setPreferredLang={setPreferredLang}
          preferredLang={preferredLang}
          onClose={() => setShowAccount(false)}
        />
      )}
    </header>
  );
}
