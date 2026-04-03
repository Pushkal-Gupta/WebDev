import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Moon, Sun, LogOut } from 'lucide-react';

export default function Navbar({ session, theme, toggleTheme }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header style={headerStyle}>
      <div style={navGroupStyle}>
        <Link to="/" className="brand">
          PG<span>Code</span>
        </Link>
        <div style={rightNavStyle}>
          <div onClick={toggleTheme} style={toggleStyle}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          
          {session ? (
            <div style={userActionsStyle}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'var(--mono)'}}>
                {session.user.email}
              </span>
              <button className="btn-primary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => {/* Will trigger auth modal */}}>
              LOGIN
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const headerStyle = {
  padding: '1rem 2rem',
  borderBottom: '1px solid var(--border)',
  background: 'var(--bg)',
  position: 'sticky',
  top: 0,
  zIndex: 100
};

const navGroupStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1200px',
  margin: '0 auto'
};

const rightNavStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem'
};

const toggleStyle = {
  cursor: 'pointer',
  color: 'var(--text-dim)',
  display: 'flex',
  alignItems: 'center'
};

const userActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};
