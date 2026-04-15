import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoginModal from './LoginModal';
import AccountModal from './AccountModal';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme, isWorkspace }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // On the home page the brand links out to the portfolio landing; on any
  // deeper page it goes back to the PGcode app home.
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
            <div className="toggle-wrap" onClick={toggleTheme}>
              <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              <div className="switch-base"></div>
            </div>

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
      {showAccount && <AccountModal session={session} onClose={() => setShowAccount(false)} />}
    </header>
  );
}
