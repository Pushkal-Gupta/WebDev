import { memo } from 'react';
import styles from './Board.module.css';
import Cell from '../Cell/Cell';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';

const NORMAL_ORDER  = [0, 1, 2, 3, 4, 5, 6, 7];
const FLIPPED_ORDER = [7, 6, 5, 4, 3, 2, 1, 0];

const Board = memo(function Board() {
  const boardState = useGameStore(s => s.boardState);
  const flipped = useGameStore(s => s.flipped);
  const boardThemeType = useThemeStore(s => s.boardThemeType);
  const boardImageUrl = useThemeStore(s => s.boardImageUrl);

  const rows = flipped ? FLIPPED_ORDER : NORMAL_ORDER;
  const cols = flipped ? FLIPPED_ORDER : NORMAL_ORDER;

  if (!boardState) {
    return (
      <div className={styles.boardWrapper}>
        <div className={styles.placeholder}>Select a time control to begin</div>
      </div>
    );
  }

  const boardStyle = boardThemeType === 'image' && boardImageUrl
    ? { backgroundImage: `url(${boardImageUrl})`, backgroundSize: '25% 25%' }
    : undefined;

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board} style={boardStyle}>
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
