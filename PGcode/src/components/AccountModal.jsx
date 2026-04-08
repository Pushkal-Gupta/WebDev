import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';
import './LoginModal.css';

export default function AccountModal({ session, onClose }) {
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  if (showSettings) {
    return <SettingsModal session={session} onClose={() => setShowSettings(false)} />;
  }

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
            {session?.user?.email}
          </p>

          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Settings size={14} /> Settings & Friends
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: 'none',
              border: '1px solid #e05a5a',
              color: '#e05a5a',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'background 0.2s',
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
