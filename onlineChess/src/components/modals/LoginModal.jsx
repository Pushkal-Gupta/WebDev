import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './Modals.module.css';

export default function LoginModal({ onClose, onSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuthStore();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (isSignup && password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
        setError('Check your email for verification link.');
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

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>{isSignup ? 'Create Account' : 'Login to Continue'}</h3>
        <div className={styles.loginFields}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {isSignup && (
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
            {loading ? '...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Cancel</button>
        </div>
        <div className={styles.loginLinks}>
          <span>{isSignup ? 'Already have an account?' : "Don't have an account?"}</span>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); setError(''); }}>
            {isSignup ? 'Login' : 'Sign Up'}
          </a>
        </div>
      </div>
    </div>
  );
}
