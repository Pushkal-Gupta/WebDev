import styles from './Modals.module.css';

/**
 * @param {{ message, ratingDelta, botMessage, onNewGame, onCancel, onAnalyse, onReview }} props
 * ratingDelta: { oldRating, newRating, ratingChange } | null
 * botMessage: { avatar, name, text } | null  — shown when game was vs a bot
 */
export default function GameOverModal({ message, ratingDelta, botMessage, onNewGame, onCancel, onAnalyse, onReview }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>Game Over</h3>
        <p>{message}</p>

        {botMessage && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: `${botMessage.color || 'rgba(255,255,255,0.03)'}08`,
            border: `1px solid ${botMessage.color || 'rgba(255,255,255,0.07)'}22`,
            margin: '8px 0',
          }}>
            {botMessage.icon ? (
              <svg width="32" height="32" viewBox="0 0 24 24"
                style={{ color: botMessage.color || '#00fff5', flexShrink: 0, filter: `drop-shadow(0 0 4px ${botMessage.color || '#00fff5'}44)` }}
                dangerouslySetInnerHTML={{ __html: botMessage.icon }}
              />
            ) : (
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>&#9822;</span>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: botMessage.color || 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
                {botMessage.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{botMessage.text}"
              </div>
            </div>
          </div>
        )}

        {ratingDelta && (
          <div className={styles.ratingRow}>
            <span className={styles.ratingOld}>{ratingDelta.oldRating}</span>
            <span className={styles.ratingArrow}>&#x2192;</span>
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
