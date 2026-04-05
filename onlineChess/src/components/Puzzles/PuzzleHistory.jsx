import { useState } from 'react';
import styles from './PuzzlePage.module.css';

function formatTime(seconds) {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function relativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PuzzleHistory({ history, loading, onSelectPuzzle }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className={styles.historySection}>
        <div className={styles.historySectionHeader} onClick={() => setExpanded(!expanded)}>
          <span>Recent Puzzles</span>
          <span className={styles.expandArrow}>{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.historySection}>
      <div className={styles.historySectionHeader} onClick={() => setExpanded(!expanded)}>
        <span>Recent Puzzles</span>
        <span className={styles.expandArrow}>{expanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expanded && (
        <div className={styles.historyList}>
          {(!history || history.length === 0) ? (
            <div className={styles.emptyMsg}>No puzzles attempted yet</div>
          ) : (
            history.map((item, i) => (
              <div
                key={item.puzzle_id + '-' + i}
                className={styles.historyRow}
                onClick={() => onSelectPuzzle?.(item.puzzle_id)}
              >
                <span className={item.solved ? styles.historyIconSolved : styles.historyIconFailed}>
                  {item.solved ? '\u2713' : '\u2717'}
                </span>
                <span className={styles.historyRating}>
                  {item.puzzles?.rating || item.puzzle_rating || '?'}
                </span>
                <span className={styles.historyTime}>
                  {formatTime(item.time_taken)}
                </span>
                {item.rating_change != null && (
                  <span className={item.rating_change >= 0 ? styles.deltaUp : styles.deltaDown}>
                    {item.rating_change >= 0 ? '+' : ''}{item.rating_change}
                  </span>
                )}
                <span className={styles.historyDate}>
                  {relativeDate(item.attempted_at)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
