import styles from './Board.module.css';
import Cell from '../Cell/Cell';
import useGameStore from '../../store/gameStore';

export default function Board() {
  const { boardState, flipped, gameStarted } = useGameStore();

  if (!boardState) {
    return (
      <div className={styles.boardWrapper}>
        <div className={styles.placeholder}>Select a time control to begin</div>
      </div>
    );
  }

  // Build rows/cols arrays, optionally flipped
  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {rows.map((row, displayRow) =>
          cols.map((col, displayCol) => (
            <Cell
              key={`${row}-${col}`}
              row={row}
              col={col}
              displayRow={displayRow}
              displayCol={displayCol}
              flipped={flipped}
            />
          ))
        )}
      </div>
    </div>
  );
}
