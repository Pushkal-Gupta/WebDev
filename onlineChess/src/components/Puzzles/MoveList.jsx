import React from 'react';
import styles from './PuzzlePage.module.css';

export default function MoveList({ solutionMoves, playerMoves, moveIndex, reviewMode, reviewIndex, onReviewJump, status }) {
  if (!solutionMoves || solutionMoves.length === 0) return null;

  const showAll = status === 'solved' || status === 'failed';
  const visibleMoves = showAll ? solutionMoves : solutionMoves.slice(0, moveIndex);

  // Group moves into pairs (white + black)
  // solutionMoves[0] is typically the opponent's setup move
  // Determine which side moves first based on the first move

  return (
    <div className={styles.moveList}>
      {visibleMoves.map((move, i) => {
        const isActive = reviewMode && reviewIndex === i + 1;
        const moveNum = Math.floor(i / 2) + 1;
        const isWhiteMove = i % 2 === 0;

        return (
          <React.Fragment key={i}>
            {isWhiteMove && <span className={styles.moveNumber}>{moveNum}.</span>}
            <span
              className={`${styles.moveSan} ${isActive ? styles.moveSanActive : ''} ${reviewMode ? styles.moveSanClickable : ''}`}
              onClick={() => reviewMode && onReviewJump?.(i + 1)}
              title={move.uci}
            >
              {move.san}
            </span>
          </React.Fragment>
        );
      })}
      {!showAll && status === 'playing' && (
        <span className={styles.moveEllipsis}>...</span>
      )}
    </div>
  );
}
