import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';
import Logo from './Logo';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme, applyTheme, setPreferredLang, preferredLang }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Global hooks so any component can open the login / settings modal without a route.
  useEffect(() => {
    const openLogin = () => (session ? setShowAccount(true) : setShowLogin(true));
    const openSettings = () => setShowAccount(true);
    window.addEventListener('pg:open-login', openLogin);
    window.addEventListener('pg:open-settings', openSettings);
    return () => {
      window.removeEventListener('pg:open-login', openLogin);
      window.removeEventListener('pg:open-settings', openSettings);
    };
  }, [session]);

  // Brand link doubles as cross-app navigation:
  // - On the PGHub home (roadmap), brand → portfolio hub
  // - Anywhere deeper inside PGHub, brand → back to PGHub root
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '';
  const brandHref = isHome
    ? 'https://pushkalgupta.com/'
    : 'https://pushkalgupta.com/PGHub/dist/';

  return (
    <header className="pg-header">
      <div className="pg-wrap">
        <div className="nav-group">
          <div className="nav-left">
            <a href={brandHref} className="brand-link">
              <Logo size={28} />
              <span className="brand-text">Pushkal Gupta <span className="brand-suffix">Hub</span></span>
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

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onGoToSettings={() => { setShowLogin(false); setShowAccount(true); }}
        />
      )}
      {showAccount && (
        <SettingsModal
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
