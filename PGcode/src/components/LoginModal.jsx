import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import './LoginModal.css';

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login'); // login | signup | reset | otp | newPassword
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href.split('#')[0],
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
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError(null);
        alert('Check your inbox at ' + email + ' for a verification link!');
        setMode('login');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setResetEmail(email);
        setMode('otp');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the full code from your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: otpCode,
        type: 'recovery',
      });
      if (error) throw error;
      setMode('newPassword');
    } catch (err) {
      setError('Invalid or expired code. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      onClose();
      setTimeout(() => alert('Password updated! You are now logged in.'), 200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = {
    login: 'Welcome Back',
    signup: 'Create Account',
    reset: 'Reset Password',
    otp: 'Check Your Email',
    newPassword: 'New Password',
  }[mode];

  return (
    <div className="modalOverlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modalContent">
        <button className="closeBtn" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2>{title}</h2>
        </div>

        {/* Google OAuth — only on login/signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="socialAuthSection">
            <button type="button" onClick={handleGoogleLogin} className="googleLoginBtn">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              Continue with Google
            </button>
            <div className="divider"><span>or use email</span></div>
          </div>
        )}

        {error && <p className="errorText">{error}</p>}

        {/* Login / Signup form */}
        {(mode === 'login' || mode === 'signup') && (
          <form onSubmit={handleSubmit} className="inputGroup">
            <input type="email" placeholder="Email Address" className="inputField"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="inputField"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <div className="authBtnRow">
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* Reset password — email entry */}
        {mode === 'reset' && (
          <form onSubmit={handleSubmit} className="inputGroup">
            <p className="resetHint">Enter your email and we'll send a recovery code.</p>
            <input type="email" placeholder="Email Address" className="inputField"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="authBtnRow">
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : 'Send Code'}
              </button>
            </div>
          </form>
        )}

        {/* OTP verification */}
        {mode === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="inputGroup">
            <p className="resetHint">We sent a code to <strong>{resetEmail}</strong>. Enter it below.</p>
            <input type="text" placeholder="Enter code" className="inputField"
              value={otpCode} onChange={e => setOtpCode(e.target.value)} autoFocus />
            <div className="authBtnRow">
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}

        {/* New password */}
        {mode === 'newPassword' && (
          <form onSubmit={handleNewPassword} className="inputGroup">
            <input type="password" placeholder="New Password" className="inputField"
              value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={6} autoFocus />
            <input type="password" placeholder="Confirm Password" className="inputField"
              value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required minLength={6} />
            <div className="authBtnRow">
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : 'Set Password'}
              </button>
            </div>
          </form>
        )}

        {/* Footer links */}
        <div className="toggleMeta">
          {mode === 'login' && (
            <>
              <button type="button" className="toggleBtn" onClick={() => { setError(null); setMode('reset'); }}>
                Forgot password?
              </button>
              <span>New here? <button type="button" className="toggleBtn" onClick={() => { setError(null); setMode('signup'); }}>Create account</button></span>
            </>
          )}
          {mode === 'signup' && (
            <span>Already have an account? <button type="button" className="toggleBtn" onClick={() => { setError(null); setMode('login'); }}>Log in instead</button></span>
          )}
          {(mode === 'reset' || mode === 'otp' || mode === 'newPassword') && (
            <span>Remembered it? <button type="button" className="toggleBtn" onClick={() => { setError(null); setMode('login'); }}>Back to login</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
