import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './Modals.module.css';

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

  const { login, signup, loginWithGoogle, resetPasswordForEmail, verifyOtp, updatePassword } = useAuthStore();

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

  const title = screen === 'otp' ? 'Check Your Email' : screen === 'new-pass' ? 'Set New Password' :
    mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Reset Password' : 'Login to Continue';

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.popup}>
        <h3>{title}</h3>

        {screen === 'main' && (
          <>
            <button
              className={`${styles.btn} ${styles.btnCancel}`}
              onClick={handleGoogle}
              disabled={loading}
              style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="16" height="16" />
              Continue with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 8px', color: 'var(--text-muted, #888)', fontSize: '0.8rem' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #444' }} />
              or use email
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #444' }} />
            </div>
            <div className={styles.loginFields}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {mode !== 'reset' && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              )}
              {mode === 'signup' && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              )}
            </div>
            {error && <p style={{ color: '#ff9999', fontSize: '0.85rem', textAlign: 'center', margin: '4px 0' }}>{error}</p>}
            <div className={styles.btnRow}>
              <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={handleSubmit} disabled={loading}>
                {loading ? '...' : mode === 'signup' ? 'Sign Up' : mode === 'reset' ? 'Send Code' : 'Login'}
              </button>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Cancel</button>
            </div>
            <div className={styles.loginLinks}>
              {mode !== 'reset' && (
                <>
                  <span>{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode(mode === 'signup' ? 'login' : 'signup'); }}>
                    {mode === 'signup' ? 'Login' : 'Sign Up'}
                  </a>
                </>
              )}
              {mode === 'login' && (
                <a href="#" onClick={(e) => { e.preventDefault(); switchMode('reset'); }} style={{ marginTop: '4px', display: 'block' }}>
                  Forgot password?
                </a>
              )}
              {mode === 'reset' && (
                <a href="#" onClick={(e) => { e.preventDefault(); switchMode('login'); }}>
                  Back to login
                </a>
              )}
            </div>
          </>
        )}

        {screen === 'otp' && (
          <>
            <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#aaa', margin: '4px 0 12px' }}>
              Enter the 8-digit code sent to <strong style={{ color: '#fff' }}>{resetEmail}</strong>
            </p>
            <div className={styles.loginFields}>
              <input
                type="text"
                placeholder="00000000"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleOtp()}
                inputMode="numeric"
                autoComplete="one-time-code"
                style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2rem' }}
              />
            </div>
            {error && <p style={{ color: '#ff9999', fontSize: '0.85rem', textAlign: 'center', margin: '4px 0' }}>{error}</p>}
            <div className={styles.btnRow}>
              <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={handleOtp} disabled={loading}>
                {loading ? '...' : 'Verify Code'}
              </button>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Cancel</button>
            </div>
            <div className={styles.loginLinks}>
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode('reset'); setScreen('main'); }}>Resend code</a>
              <a href="#" onClick={(e) => { e.preventDefault(); switchMode('login'); setScreen('main'); }}>Back to login</a>
            </div>
          </>
        )}

        {screen === 'new-pass' && (
          <>
            <div className={styles.loginFields}>
              <input
                type="password"
                placeholder="New Password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNewPass()}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNewPass()}
              />
            </div>
            {error && <p style={{ color: '#ff9999', fontSize: '0.85rem', textAlign: 'center', margin: '4px 0' }}>{error}</p>}
            <div className={styles.btnRow}>
              <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={handleNewPass} disabled={loading}>
                {loading ? '...' : 'Set Password'}
              </button>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
