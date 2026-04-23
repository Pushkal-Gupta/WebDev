import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';
import './LoginModal.css';

export default function AccountModal({ session, onClose }) {
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    onClose();
  };

  if (showSettings) {
    return <SettingsModal session={session} onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="modalOverlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modalContent">
        <button className="account-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2>Account</h2>
        </div>

        <div className="account-body">
          <p className="account-email">{session?.user?.email}</p>

          <button className="account-settings-btn" onClick={() => setShowSettings(true)}>
            <Settings size={14} /> Settings & Friends
          </button>

          <button className="account-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
