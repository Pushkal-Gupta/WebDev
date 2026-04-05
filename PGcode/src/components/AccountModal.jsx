import React from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import './LoginModal.css'; // Reusing LoginModal styles for overlay/content structure

export default function AccountModal({ session, onClose }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div className="modalOverlay" onClick={(e) => {
      if (e.target.className === 'modalOverlay') onClose();
    }}>
      <div className="modalContent" style={{ maxWidth: '400px' }}>
        <div className="modalHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Account</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#fff' }}>
          <p style={{ fontSize: '1rem' }}>{session?.user?.email}</p>
          <p style={{ fontSize: '0.85rem', color: '#a0a0a0', fontStyle: 'italic', marginBottom: '1rem' }}>
            Signed in with Google — password change not available.
          </p>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px',
              background: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
