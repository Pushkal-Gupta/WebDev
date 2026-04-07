import React from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import './LoginModal.css';

export default function AccountModal({ session, onClose }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={(e) => {
      if (e.target.className === 'modalOverlay') onClose();
    }}>
      <div className="modalContent">
        <button className="closeBtn" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2>Account</h2>
        </div>
        
        <div className="modalBody" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p className="accountEmail" style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {session?.user?.email}
          </p>
          
          <p className="oauthNote" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '1.5rem', fontFamily: 'var(--sans)' }}>
            Signed in with Google — password change not available.
          </p>
          
          <button 
            onClick={handleLogout}
            className="logout-btn"
            style={{
              padding: '0.7rem',
              background: 'none',
              border: '1px solid #c0392b',
              color: '#c0392b',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              transition: 'background var(--t)'
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}
