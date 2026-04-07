import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import LoginModal from './LoginModal';
import AccountModal from './AccountModal';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  return (
    <header className="navbar-header">
      <div className="pg-wrap">
        <div className="navbar-group">
          <div className="nav-left">
            <a href="https://pushkalgupta.com/PG/main.html" className="pgcode-nav-link">
              <ArrowLeft size={18} className="hover-arrow" />
              <span className="brand-name">Pushkal Gupta</span>
              <span className="brand-suffix">Code</span>
            </a>
          </div>
          
          <div className="navbar-right">
            <div className="toggle-wrap" onClick={toggleTheme}>
              <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              <div className="switch-base"></div>
            </div>
            
            {session ? (
              <button className="btn-outline" onClick={() => setShowAccount(true)}>
                ACCOUNT
              </button>
            ) : (
              <button className="btn-outline" onClick={() => setShowLogin(true)}>
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
