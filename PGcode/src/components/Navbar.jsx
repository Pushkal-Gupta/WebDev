import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Moon, Sun, LogOut } from 'lucide-react';
import LoginModal from './LoginModal';
import './Navbar.css';

export default function Navbar({ session, theme, toggleTheme }) {
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="navbar-header">
      <div className="navbar-group">
        <Link to="/" className="brand">
          PG<span>Code</span>
        </Link>
        <div className="navbar-right">
          <div onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          
          {session ? (
            <div className="navbar-user-actions">
              <span className="navbar-user-email">
                {session.user.email}
              </span>
              <button className="btn-primary logout-btn" onClick={handleLogout}>
                <LogOut size={14} /> <span>Logout</span>
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setShowLogin(true)}>
              LOGIN
            </button>
          )}
        </div>
      </div>
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  );
}
