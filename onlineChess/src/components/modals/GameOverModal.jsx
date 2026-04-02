import styles from './Modals.module.css';

/**
 * @param {{ message, ratingDelta, onNewGame, onCancel, onAnalyse, onReview }} props
 * ratingDelta: { oldRating, newRating, ratingChange } | null
 */
export default function GameOverModal({ message, ratingDelta, onNewGame, onCancel, onAnalyse, onReview }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>Game Over</h3>
        <p>{message}</p>

        {ratingDelta && (
          <div className={styles.ratingRow}>
            <span className={styles.ratingOld}>{ratingDelta.oldRating}</span>
            <span className={styles.ratingArrow}>→</span>
            <span className={styles.ratingNew}>{ratingDelta.newRating}</span>
            <span className={`${styles.ratingDelta} ${ratingDelta.ratingChange >= 0 ? styles.ratingUp : styles.ratingDown}`}>
              ({ratingDelta.ratingChange >= 0 ? '+' : ''}{ratingDelta.ratingChange})
            </span>
          </div>
        )}

        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={onNewGame}>New Game</button>
          <button className={`${styles.btn} ${styles.btnAnalyse}`} onClick={onReview}>Review Game</button>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>Close</button>
        </div>
      </div>
    </div>
  );
}
