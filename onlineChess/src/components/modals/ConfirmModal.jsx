import { useEffect } from 'react';
import styles from './Modals.module.css';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.popup}>
        <p>{message}</p>
        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={onConfirm}>OK</button>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
