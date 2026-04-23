import { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';
import { Icon } from '../icons.jsx';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const oauthGoogle = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) setMessage({ type: 'err', text: error.message });
    setLoading(false);
  };

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMessage({ type: 'ok', text: `Check ${email} for a verification link.` });
        } else { onClose(); }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href,
        });
        if (error) throw error;
        setMessage({ type: 'ok', text: `Password reset email sent to ${email}.` });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (e) {
      setMessage({ type: 'err', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true"/>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close icon-btn" onClick={onClose} aria-label="Close">{Icon.close}</button>
        <h2 id="auth-title" className="auth-title">
          {mode === 'signup' ? 'Create account'
            : mode === 'reset' ? 'Reset password'
            : 'Welcome back'}
        </h2>
        <p className="auth-sub">
          {mode === 'signup' ? 'Save favorites, best scores, and progress across devices.'
            : mode === 'reset' ? 'We\'ll email you a link to reset it.'
            : 'Sign in to sync your favorites and scores.'}
        </p>

        <button className="auth-google" onClick={oauthGoogle} disabled={loading}>
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C33.9 6 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8c1.8-4.4 6.1-7.5 11.1-7.5 3.1 0 5.9 1.1 8 3l5.7-5.7C33.9 6 29.2 4 24 4 16.1 4 9.3 8.6 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.1 0 9.7-1.9 13.2-5l-6.1-5c-2 1.4-4.4 2.2-7.1 2.2-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 39.2 16 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.1 5c-.4.4 6.8-5 6.8-14.5 0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-fields">
          <input
            className="auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"/>
          {mode !== 'reset' && (
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}/>
          )}
        </div>

        {message && (
          <div className={'auth-msg ' + (message.type === 'ok' ? 'ok' : 'err')}>{message.text}</div>
        )}

        <button className="btn btn-primary auth-submit" onClick={submit} disabled={loading || !email || (mode !== 'reset' && !password)}>
          {loading ? 'Please wait…'
            : mode === 'signup' ? 'Create account'
            : mode === 'reset' ? 'Send reset link'
            : 'Sign in'}
        </button>

        <div className="auth-alt">
          {mode === 'login' && (
            <>
              <button className="link" onClick={() => { setMode('signup'); setMessage(null); }}>Create account</button>
              <button className="link" onClick={() => { setMode('reset'); setMessage(null); }}>Forgot password?</button>
            </>
          )}
          {mode === 'signup' && (
            <button className="link" onClick={() => { setMode('login'); setMessage(null); }}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button className="link" onClick={() => { setMode('login'); setMessage(null); }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </>
  );
}
