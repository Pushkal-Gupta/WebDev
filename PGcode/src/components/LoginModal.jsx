import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import './LoginModal.css';

export default function LoginModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Optionally show success or auto-close
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modalContent">
        <button className="closeBtn" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        </div>
        
        <div className="socialAuthSection">
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="googleLoginBtn"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Continue with Google
          </button>
          
          <div className="divider">
            <span>or use email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="inputGroup">
          {error && <p className="errorText">{error}</p>}
          
          <input
            type="email"
            placeholder="Email Address"
            className="inputField"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="inputField"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          <div className="authBtnRow">
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? '...' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="toggleMeta">
          <span>{isLogin ? "New here?" : "Already have an account?"}</span>
          <button type="button" className="toggleBtn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Create account' : 'Log in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}
