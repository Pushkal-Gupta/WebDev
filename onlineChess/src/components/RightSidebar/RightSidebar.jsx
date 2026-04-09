import { useRef } from 'react';
import styles from './RightSidebar.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';
import { getOpeningName } from '../../utils/evaluation';
import { CLASSIFICATIONS } from '../../utils/reviewEngine';

export default function RightSidebar({ onAlert, reviewResults, isReviewing, isOnlineGame = false }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    getPgn, gameStarted, flipped, setFlipped, undoMove, undoTwoMoves, isComp, isOnline,
  } = useGameStore();

  const { pieceSets, pieceSetIndex } = useThemeStore();
  const moveHistoryRef = useRef(null);

  // Auto-scroll to active move
  const scrollToActive = () => {
    if (moveHistoryRef.current) {
      const active = moveHistoryRef.current.querySelector(`.${styles.moveCellActive}`);
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleCopyPgn = () => {
    const pgn = getPgn();
    if (!pgn) { onAlert?.('No game in progress'); return; }
    navigator.clipboard.writeText(pgn).then(() => onAlert?.('PGN copied!'));
  };

  // Build move row pairs
  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],       whiteIdx: i,
      black: moveHistory[i + 1] || null, blackIdx: i + 1,
    });
  }

  return (
    <aside className={styles.sidebar}>
      {/* Review progress bar */}
      {isReviewing && (
        <div className={styles.reviewBar}>
          <span className={styles.reviewLabel}>Reviewing game...</span>
          <div className={styles.reviewSpinner} />
        </div>
      )}

      {/* Move history */}
      <div className={styles.moveHistory} ref={moveHistoryRef} onScroll={() => {}}>
        {moveHistory.length === 0 ? (
          <div className={styles.emptyMoves}>No moves yet</div>
        ) : (
          <table className={styles.moveTable}>
            <tbody>
              {moveRows.map((row) => {
                const wReview = reviewResults?.[row.whiteIdx];
                const bReview = row.black ? reviewResults?.[row.blackIdx] : null;
                const wClass  = wReview ? CLASSIFICATIONS[wReview.classification] : null;
                const bClass  = bReview ? CLASSIFICATIONS[bReview.classification] : null;
                return (
                  <tr key={row.number} className={styles.moveRow}>
                    <td className={styles.moveCellNum}>{row.number}.</td>
                    <td
                      className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveCellActive : ''}`}
                      onClick={() => { goToMove(row.whiteIdx); setTimeout(scrollToActive, 50); }}
                    >
                      {row.white?.san || ''}
                      {wClass && (
                        <span className={styles.badge} style={{ color: wClass.color }} title={wClass.label}>
                          {wClass.symbol}
                        </span>
                      )}
                    </td>
                    <td
                      className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveCellActive : ''}`}
                      onClick={() => { if (row.black) { goToMove(row.blackIdx); setTimeout(scrollToActive, 50); } }}
                    >
                      {row.black?.san || ''}
                      {bClass && (
                        <span className={styles.badge} style={{ color: bClass.color }} title={bClass.label}>
                          {bClass.symbol}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Navigation buttons */}
      <div className={styles.navBtns}>
        <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">⏮</button>
        <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} title="Prev" disabled={currentMoveIndex < 0}>◀</button>
        <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} title="Next" disabled={currentMoveIndex >= moveHistory.length - 1}>▶</button>
        <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">⏭</button>
      </div>

      {/* Action row */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => setFlipped(!flipped)} title="Flip board">⇅ Flip</button>
        {!isOnline && (
          <button className={styles.actionBtn} onClick={() => isComp ? undoTwoMoves() : undoMove()} disabled={!gameStarted} title="Undo">↩ Undo</button>
        )}
        <button className={styles.actionBtn} onClick={handleCopyPgn} title="Copy PGN">⎘ PGN</button>
      </div>
    </aside>
  );
}
