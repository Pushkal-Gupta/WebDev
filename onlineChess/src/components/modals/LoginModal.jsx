import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';

export default function LoginModal({ onClose, onSuccess }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const [screen, setScreen]       = useState('main'); // 'main' | 'otp' | 'new-pass'
  const [mode, setMode]           = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [otp, setOtp]             = useState('');
  const [newPass, setNewPass]     = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const { login, signup, loginWithGoogle, loginWithGithub, resetPasswordForEmail, verifyOtp, updatePassword } = useAuthStore();

  const switchMode = (m) => { setMode(m); setError(''); };

  const handleSubmit = async () => {
    setError('');
    if (mode === 'reset') {
      if (!email) { setError('Please enter your email.'); return; }
      setLoading(true);
      try {
        await resetPasswordForEmail(email);
        setResetEmail(email);
        setScreen('otp');
        setOtp('');
      } catch (e) {
        setError(e.message || 'Failed to send reset email');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const data = await signup(email, password);
        if (data?.session) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError('Check your email for a verification link.');
        }
      } else {
        await login(email, password);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (e) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(e.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGithub = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGithub();
    } catch (e) {
      setError(e.message || 'GitHub sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async () => {
    setError('');
    if (!otp || otp.length < 6) { setError('Please enter the full code.'); return; }
    setLoading(true);
    try {
      await verifyOtp(resetEmail, otp);
      setScreen('new-pass');
      setNewPass('');
      setConfirmNew('');
    } catch (e) {
      setError(e.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPass = async () => {
    setError('');
    if (!newPass || newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmNew) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await updatePassword(newPass);
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const PgMark = (
    <svg className="pgauth-mark" width="40" height="36" viewBox="0 0 36 32" aria-hidden="true">
      <path d="M3 4 L3 28 M3 4 L10.5 4 Q15.5 4 15.5 10 Q15.5 16 10.5 16 L3 16" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 9.5 Q33 4 27 4 Q20.5 4 20.5 11.5 L20.5 20.5 Q20.5 28 27 28 Q33 28 33 22.5 L33 18.5 L27.5 18.5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const heading = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Welcome back';
  const subtitle = mode === 'signup' ? "A few details and you're in" : mode === 'reset' ? "We'll email you a recovery code" : 'Enter your credentials to continue';
  const primaryLabel = loading ? 'Working…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send code' : 'Sign in';

  return (
    <div className="pgauth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <button className="pgauth-close" onClick={onClose} aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="pgauth-stack">
        <div className="pgauth-brand">
          <div className="pgauth-brand-row">
            {PgMark}
            <span className="pgauth-wordmark">Pushkal Gupta <span className="accent">Chess</span></span>
          </div>
          <span className="pgauth-tagline">Online chess — play live, climb the ladder.</span>
        </div>

        <div className="pgauth-card">
          {screen === 'main' && (
            <>
              <div className="pgauth-head">
                <h3>{heading}</h3>
                <p className="pgauth-sub">{subtitle}</p>
              </div>
              {error && <p className="pgauth-error">{error}</p>}
              <div className="pgauth-form">
                <div className="pgauth-field">
                  <label htmlFor="pgauth-email">Email</label>
                  <input
                    id="pgauth-email"
                    type="email"
                    className="pgauth-input"
                    placeholder="me@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {mode !== 'reset' && (
                  <div className="pgauth-field">
                    <div className="pgauth-label-row">
                      <label htmlFor="pgauth-password">Password</label>
                      {mode === 'login' && (
                        <button type="button" className="pgauth-link" onClick={() => switchMode('reset')}>Forgot password?</button>
                      )}
                    </div>
                    <div className="pgauth-passwrap">
                      <input
                        id="pgauth-password"
                        type={showPass ? 'text' : 'password'}
                        className="pgauth-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      />
                      <button
                        type="button"
                        className="pgauth-eye"
                        onClick={() => setShowPass(s => !s)}
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="pgauth-field">
                    <label htmlFor="pgauth-confirm">Confirm password</label>
                    <input
                      id="pgauth-confirm"
                      type={showPass ? 'text' : 'password'}
                      className="pgauth-input"
                      placeholder="Re-enter it"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                )}

                <button className="pgauth-primary" onClick={handleSubmit} disabled={loading}>
                  {primaryLabel}
                </button>

                <div className="pgauth-divider"><span>Or continue with</span></div>

                <div className="pgauth-social">
                  <button type="button" className="pgauth-social-btn" onClick={handleGoogle} disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="16" height="16" />
                    Google
                  </button>
                  <button type="button" className="pgauth-social-btn" onClick={handleGithub} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                <p className="pgauth-foot">
                  {mode === 'login' && (
                    <>New here? <button className="pgauth-link" onClick={() => switchMode('signup')}>Create account</button></>
                  )}
                  {mode === 'signup' && (
                    <>Already have an account? <button className="pgauth-link" onClick={() => switchMode('login')}>Sign in</button></>
                  )}
                  {mode === 'reset' && (
                    <>Remembered it? <button className="pgauth-link" onClick={() => switchMode('login')}>Sign in</button></>
                  )}
                </p>
              </div>
            </>
          )}

          {screen === 'otp' && (
            <>
              <div className="pgauth-head">
                <h3>Check your email</h3>
                <p className="pgauth-sub">Enter the code we just sent</p>
              </div>
              {error && <p className="pgauth-error">{error}</p>}
              <div className="pgauth-form">
                <p className="pgauth-hint">We sent a code to <strong>{resetEmail}</strong>.</p>
                <div className="pgauth-field">
                  <label htmlFor="pgauth-otp">Recovery code</label>
                  <input
                    id="pgauth-otp"
                    type="text"
                    className="pgauth-input"
                    maxLength={8}
                    placeholder="00000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleOtp()}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
                  />
                </div>
                <button className="pgauth-primary" onClick={handleOtp} disabled={loading}>
                  {loading ? 'Working…' : 'Verify code'}
                </button>
                <p className="pgauth-foot">
                  <button className="pgauth-link" onClick={() => { switchMode('reset'); setScreen('main'); }}>Resend code</button>
                  {' · '}
                  <button className="pgauth-link" onClick={() => { switchMode('login'); setScreen('main'); }}>Back to login</button>
                </p>
              </div>
            </>
          )}

          {screen === 'new-pass' && (
            <>
              <div className="pgauth-head">
                <h3>Set a new password</h3>
                <p className="pgauth-sub">Pick something memorable</p>
              </div>
              {error && <p className="pgauth-error">{error}</p>}
              <div className="pgauth-form">
                <div className="pgauth-field">
                  <label htmlFor="pgauth-newpass">New password</label>
                  <input
                    id="pgauth-newpass"
                    type="password"
                    className="pgauth-input"
                    placeholder="At least 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewPass()}
                  />
                </div>
                <div className="pgauth-field">
                  <label htmlFor="pgauth-confirmnew">Confirm password</label>
                  <input
                    id="pgauth-confirmnew"
                    type="password"
                    className="pgauth-input"
                    placeholder="Re-enter it"
                    value={confirmNew}
                    onChange={(e) => setConfirmNew(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewPass()}
                  />
                </div>
                <button className="pgauth-primary" onClick={handleNewPass} disabled={loading}>
                  {loading ? 'Working…' : 'Set password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
