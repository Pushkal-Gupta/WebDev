import { useRef } from 'react';
import styles from './RightSidebar.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';
import { getOpeningName } from '../../utils/evaluation';

export default function RightSidebar({ onAlert }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    getPgn, gameStarted, flipped, setFlipped, undoMove,
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
      {/* Move history */}
      <div className={styles.moveHistory} ref={moveHistoryRef} onScroll={() => {}}>
        {moveHistory.length === 0 ? (
          <div className={styles.emptyMoves}>No moves yet</div>
        ) : (
          <table className={styles.moveTable}>
            <tbody>
              {moveRows.map((row) => (
                <tr key={row.number} className={styles.moveRow}>
                  <td className={styles.moveCellNum}>{row.number}.</td>
                  <td
                    className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveCellActive : ''}`}
                    onClick={() => { goToMove(row.whiteIdx); setTimeout(scrollToActive, 50); }}
                  >
                    {row.white?.san || ''}
                  </td>
                  <td
                    className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveCellActive : ''}`}
                    onClick={() => { row.black && goToMove(row.blackIdx); setTimeout(scrollToActive, 50); }}
                  >
                    {row.black?.san || ''}
                  </td>
                </tr>
              ))}
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
        <button className={styles.actionBtn} onClick={undoMove} disabled={!gameStarted} title="Undo">↩ Undo</button>
        <button className={styles.actionBtn} onClick={handleCopyPgn} title="Copy PGN">⎘ PGN</button>
      </div>
    </aside>
  );
}
