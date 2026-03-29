import styles from './Modals.module.css';

export default function GameOverModal({ message, onNewGame, onCancel, onAnalyse }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>Game Over</h3>
        <p>{message}</p>
        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={onNewGame}>New Game</button>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>Close</button>
          <button className={`${styles.btn} ${styles.btnAnalyse}`} onClick={onAnalyse}>Analyse</button>
        </div>
      </div>
    </div>
  );
}
