import styles from './PuzzlePage.module.css';

export default function DailyPuzzle({ dailyPuzzle, dailySolved, onPlay, loading }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) {
    return (
      <div className={styles.dailyBanner}>
        <div className={styles.dailyDate}>{today}</div>
        <div className={styles.dailyTitle}>Daily Puzzle</div>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (!dailyPuzzle) {
    return (
      <div className={styles.dailyBanner}>
        <div className={styles.dailyDate}>{today}</div>
        <div className={styles.dailyTitle}>Daily Puzzle</div>
        <div className={styles.emptyMsg}>No daily puzzle available</div>
      </div>
    );
  }

  return (
    <div className={styles.dailyBanner}>
      <div className={styles.dailyDate}>{today}</div>
      <div className={styles.dailyTitle}>Daily Puzzle</div>

      <div className={styles.dailyInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Difficulty</span>
          <span className={styles.infoVal}>{dailyPuzzle.rating}</span>
        </div>
        {dailyPuzzle.themes?.length > 0 && (
          <div className={styles.themes}>
            {dailyPuzzle.themes.slice(0, 4).map(t => (
              <span key={t} className={styles.theme}>
                {t.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            ))}
          </div>
        )}
        {dailyPuzzle.opening_tags && (
          <span className={styles.openingTag}>
            {dailyPuzzle.opening_tags.replace(/_/g, ' ').split(' ').slice(0, 3).join(' ')}
          </span>
        )}
      </div>

      {dailySolved ? (
        <div className={styles.dailySolvedBadge}>Solved</div>
      ) : (
        <button className={styles.dailyPlayBtn} onClick={onPlay}>
          Play Daily Puzzle
        </button>
      )}
    </div>
  );
}
