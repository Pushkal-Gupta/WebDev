import styles from './Modals.module.css';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
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
