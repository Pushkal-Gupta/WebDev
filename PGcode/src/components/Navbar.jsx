import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import LoginModal from './LoginModal';
import AccountModal from './AccountModal';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  return (
    <header className="navbar-header">
      <div className="navbar-group">
        <a href="https://pushkalgupta.com/PG/main.html" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft color="cyan" size={20} />
          PG<span>Code</span>
        </a>
        <div className="navbar-right">
          <div onClick={toggleTheme} className="theme-toggle" style={{ cursor: 'pointer' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          
          {session ? (
            <button className="btn-primary" onClick={() => setShowAccount(true)} style={{ textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
              ACCOUNT
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setShowLogin(true)}>
              LOGIN
            </button>
          )}
        </div>
      </div>
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showAccount && <AccountModal session={session} onClose={() => setShowAccount(false)} />}
    </header>
  );
}
