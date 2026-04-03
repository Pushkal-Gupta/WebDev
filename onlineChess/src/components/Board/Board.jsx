import { memo, useMemo } from 'react';
import styles from './Board.module.css';
import Cell from '../Cell/Cell';
import useGameStore from '../../store/gameStore';

const Board = memo(function Board() {
  const boardState = useGameStore(s => s.boardState);
  const flipped = useGameStore(s => s.flipped);

  const rows = useMemo(() => flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7], [flipped]);
  const cols = useMemo(() => flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7], [flipped]);

  if (!boardState) {
    return (
      <div className={styles.boardWrapper}>
        <div className={styles.placeholder}>Select a time control to begin</div>
      </div>
    );
  }

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
              piece={boardState[row][col]}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default Board;
