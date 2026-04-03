import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './Modals.module.css';

export default function LogoutModal({ onClose }) {
  const { logout } = useAuthStore();

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.popup}>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to logout?</p>
        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleLogout}>Yes, Logout</button>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
