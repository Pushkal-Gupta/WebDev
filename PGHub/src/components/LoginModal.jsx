import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Eye, EyeOff, Settings } from 'lucide-react';
import { friendlyError } from '../lib/errors';
import Logo from './Logo';
import './LoginModal.css';

export default function LoginModal({ onClose, onGoToSettings, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // login | signup | reset | otp | newPassword
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const oauthErr = sessionStorage.getItem('pgcode-oauth-error');
    if (oauthErr) {
      setError(oauthErr);
      sessionStorage.removeItem('pgcode-oauth-error');
    }
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;
    } catch (err) {
      console.error('[error]', err);
      setError(friendlyError(err));
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;
    } catch (err) {
      console.error('[error]', err);
      setError(friendlyError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + window.location.pathname },
        });
        if (error) throw error;
        setError(null);
        if (data?.session) {
          onClose();
        } else {
          setError('Check your inbox at ' + email + ' for a verification link.');
          setMode('login');
        }
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
      setError(sanitizeError(err));
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
      console.error('[error]', err);
      setError('Invalid or expired code. Please request a new one.');
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
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const title = {
    login: 'Welcome back',
    signup: 'Create your account',
    reset: 'Reset password',
    otp: 'Check your email',
    newPassword: 'Set a new password',
  }[mode];

  const subtitle = {
    login: 'Enter your credentials to continue',
    signup: 'A few details and you\'re in',
    reset: 'We\'ll send you a recovery code',
    otp: 'Enter the code we just sent',
    newPassword: 'Pick something memorable',
  }[mode];

  return (
    <div className="modalOverlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <button className="modalClose" onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>

      <div className="modalStack">
        <div className="modalBrandOutside">
          <Logo size={44} withWordmark wordmarkSize="lg" tone="light" />
          <span className="modalTagline">Every algorithm, every formula, every interview pattern — one playground.</span>
        </div>

        <div className="modalContent">
          <div className="modalHeader">
            <h2>{title}</h2>
            <p className="modalSubtitle">{subtitle}</p>
          </div>

          {error && (
            <div className="authError" role="alert">
              <span className="authError-msg">{error}</span>
              <div className="authError-actions">
                {/already linked|Settings|different sign-in/i.test(error) && onGoToSettings && (
                  <button type="button" className="authError-action" onClick={onGoToSettings}>
                    <Settings size={13} /> Go to Settings
                  </button>
                )}
                <button type="button" className="authError-dismiss" onClick={() => setError(null)} aria-label="Dismiss">
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handleSubmit} className="authForm">
              <div className="fieldGroup">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="me@example.com"
                  className="inputField"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="fieldGroup">
                <div className="fieldLabelRow">
                  <label htmlFor="auth-pass">Password</label>
                  {mode === 'login' && (
                    <button type="button" className="inlineLink" onClick={() => { setError(null); setMode('reset'); }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="passWrap">
                  <input
                    id="auth-pass"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="inputField"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" className="passToggle" onClick={() => setShowPass(p => !p)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="primaryBtn" disabled={loading}>
                {loading ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>

              <div className="divider"><span>Or continue with</span></div>

              <div className="socialRow">
                <button type="button" className="socialBtn" onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button type="button" className="socialBtn" onClick={handleGithubLogin}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <p className="footerCta">
                {mode === 'login'
                  ? <>Don't have an account? <button type="button" className="inlineLink" onClick={() => { setError(null); setMode('signup'); }}>Sign up</button></>
                  : <>Already have an account? <button type="button" className="inlineLink" onClick={() => { setError(null); setMode('login'); }}>Sign in</button></>
                }
              </p>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleSubmit} className="authForm">
              <div className="fieldGroup">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="me@example.com"
                  className="inputField"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="primaryBtn" disabled={loading}>
                {loading ? 'Sending…' : 'Send code'}
              </button>
              <p className="footerCta">
                Remembered it? <button type="button" className="inlineLink" onClick={() => { setError(null); setMode('login'); }}>Back to login</button>
              </p>
              <div className="modalFill">
                <p className="modalFill-title">While you wait</p>
                <ul className="modalFill-list">
                  <li>Code in the browser — Python, JS, Java, C++ and ten more, all graded server-side.</li>
                  <li>Visual walkthroughs for every algorithm, not just the answer.</li>
                  <li>Track streaks, mastery, and revision queue across the entire catalog.</li>
                </ul>
              </div>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="authForm">
              <p className="resetHint">We sent a code to <strong>{resetEmail}</strong>.</p>
              <div className="fieldGroup">
                <label htmlFor="auth-otp">Recovery code</label>
                <input
                  id="auth-otp"
                  type="text"
                  placeholder="6-digit code"
                  className="inputField"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="primaryBtn" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
              <p className="footerCta">
                <button type="button" className="inlineLink" onClick={() => { setError(null); setMode('login'); }}>Back to login</button>
              </p>
              <div className="modalFill">
                <p className="modalFill-title">Tip</p>
                <ul className="modalFill-list">
                  <li>Codes expire in 10 minutes. Check your spam folder if it doesn't arrive in 30 seconds.</li>
                  <li>The link in the email works too — clicking it skips this step.</li>
                </ul>
              </div>
            </form>
          )}

          {mode === 'newPassword' && (
            <form onSubmit={handleNewPassword} className="authForm">
              <div className="fieldGroup">
                <label htmlFor="auth-newpass">New password</label>
                <input
                  id="auth-newpass"
                  type="password"
                  placeholder="At least 6 characters"
                  className="inputField"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div className="fieldGroup">
                <label htmlFor="auth-confirm">Confirm password</label>
                <input
                  id="auth-confirm"
                  type="password"
                  placeholder="Re-enter it"
                  className="inputField"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="primaryBtn" disabled={loading}>
                {loading ? 'Saving…' : 'Set password'}
              </button>
              <div className="modalFill">
                <p className="modalFill-title">Good passwords</p>
                <ul className="modalFill-list">
                  <li>At least 12 characters — length beats complexity every time.</li>
                  <li>Mix of words is easier to remember than random symbols.</li>
                  <li>Unique to this site. A password manager handles the rest.</li>
                </ul>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
