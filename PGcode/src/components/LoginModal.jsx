import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './LoginModal.css';

export default function LoginModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
      if (e.target.className === 'modalOverlay') onClose();
    }}>
      <div className="modalContent">
        <div className="modalHeader">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
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
          
          <button type="submit" className="authBtn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="toggleMeta">
          <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button type="button" className="toggleBtn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
