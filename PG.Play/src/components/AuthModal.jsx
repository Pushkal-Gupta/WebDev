// AuthModal — boutique auth surface.
//
// Glass-strong card centered on a faint backdrop. Display-font headline,
// large monospace-placeholder inputs with a cyan focus ring, full-width
// primary CTA, and a sibling "Continue with Google" secondary button.
// Tab cycles inside the card; Esc closes; framer-motion handles entrance.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { supabase } from '../supabase.js';
import { Icon } from '../icons.jsx';

export default function AuthModal({ onClose }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null);

  const cardRef = useRef(null);
  const reduced = useReducedMotion();

  // Esc-to-close + Tab-trap inside the card.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const focusables = cardRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    // Initial focus on the email input for keyboard users.
    const t = setTimeout(() => {
      cardRef.current?.querySelector('input[type="email"]')?.focus();
    }, 60);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
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

  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
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
    } catch (err) {
      setMessage({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const headline =
    mode === 'signup' ? 'Create account'
    : mode === 'reset' ? 'Reset password'
    : 'Welcome back';

  const sub =
    mode === 'signup' ? 'One account, every game. Best scores and unlocks travel with you.'
    : mode === 'reset' ? 'We will email you a one-tap link to set a new password.'
    : 'Sign in to sync your favorites, bests, and achievements.';

  const ctaLabel =
    loading ? 'Please wait…'
    : mode === 'signup' ? 'Create account'
    : mode === 'reset' ? 'Send reset link'
    : 'Sign in';

  return (
    <AnimatePresence>
      <motion.div
        key="auth-backdrop"
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        key="auth-card"
        ref={cardRef}
        className="auth-card-v2 glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        transition={{ duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          className="auth-card-close icon-btn"
          onClick={onClose}
          aria-label="Close"
          type="button">
          {Icon.close}
        </button>

        <div className="auth-kicker">PG.Play</div>
        <h2 id="auth-title" className="auth-card-title">{headline}</h2>
        <p className="auth-card-sub">{sub}</p>

        <button
          className="auth-cta-google"
          onClick={oauthGoogle}
          disabled={loading}
          type="button">
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C33.9 6 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8c1.8-4.4 6.1-7.5 11.1-7.5 3.1 0 5.9 1.1 8 3l5.7-5.7C33.9 6 29.2 4 24 4 16.1 4 9.3 8.6 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.1 0 9.7-1.9 13.2-5l-6.1-5c-2 1.4-4.4 2.2-7.1 2.2-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 39.2 16 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.1 5c-.4.4 6.8-5 6.8-14.5 0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider-v2"><span>or use email</span></div>

        <form className="auth-form-v2" onSubmit={submit} noValidate>
          <label className="auth-field">
            <span className="auth-field-label">Email</span>
            <input
              className="auth-input-v2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              spellCheck={false}
              required
            />
          </label>

          {mode !== 'reset' && (
            <label className="auth-field">
              <span className="auth-field-label">
                Password
                {mode === 'login' && (
                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() => { setMode('reset'); setMessage(null); }}>
                    Forgot password?
                  </button>
                )}
              </span>
              <input
                className="auth-input-v2"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </label>
          )}

          {message && (
            <div className={'auth-msg-v2 ' + (message.type === 'ok' ? 'is-ok' : 'is-err')} role="status">
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="auth-cta"
            disabled={loading || !email || (mode !== 'reset' && !password)}>
            {ctaLabel}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' && (
            <span>
              New to PG.Play?{' '}
              <button className="link" onClick={() => { setMode('signup'); setMessage(null); }}>Create an account</button>
            </span>
          )}
          {mode === 'signup' && (
            <span>
              Already have one?{' '}
              <button className="link" onClick={() => { setMode('login'); setMessage(null); }}>Sign in</button>
            </span>
          )}
          {mode === 'reset' && (
            <button className="link" onClick={() => { setMode('login'); setMessage(null); }}>
              Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
