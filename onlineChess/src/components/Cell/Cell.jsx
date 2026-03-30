import { useRef, useState } from 'react';
import styles from './Cell.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';

const PIECE_NAME_MAP = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};
const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export default function Cell({ row, col, displayRow, displayCol, flipped }) {
  const [draggingThis, setDraggingThis] = useState(false);

  const {
    boardState, selectedSquare, validMoves, lastMove, underCheck,
    selectSquare, makeMove, showLabels, showLegalDots, highlightLastMove,
    highlightSelected, dotSize, gameStarted,
  } = useGameStore();

  const { clr1, clr2, clr1c, clr2c, clr1p, clr2p, clr1x, clr2x, pieceSetIndex, pieceSets } = useThemeStore();

  const imagePath = `./images/${pieceSets[pieceSetIndex].path}`;

  const piece = boardState ? boardState[row][col] : null;
  const isLight = (row + col) % 2 === 0;

  const isSelected = highlightSelected && selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  const isValidMove = validMoves.some(m => m.row === row && m.col === col);
  const isLastMoveFrom = highlightLastMove && lastMove && lastMove.from.row === row && lastMove.from.col === col;
  const isLastMoveTo = highlightLastMove && lastMove && lastMove.to.row === row && lastMove.to.col === col;
  const isInCheck = underCheck && underCheck.row === row && underCheck.col === col;

  let bgColor = isLight ? clr1 : clr2;
  if (isInCheck) bgColor = isLight ? clr1c : clr2c;
  else if (isSelected) bgColor = isLight ? clr1x : clr2x;
  else if (isLastMoveFrom || isLastMoveTo) bgColor = isLight ? clr1p : clr2p;

  const handleClick = () => {
    if (!gameStarted) return;
    // If clicking a valid move destination
    const isValid = validMoves.some(m => m.row === row && m.col === col);
    if (isValid && selectedSquare) {
      makeMove(selectedSquare, { row, col });
    } else {
      selectSquare(row, col);
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('fromRow', row);
    e.dataTransfer.setData('fromCol', col);
    setDraggingThis(true);
  };

  const handleDragEnd = () => setDraggingThis(false);

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const fromRow = parseInt(e.dataTransfer.getData('fromRow'));
    const fromCol = parseInt(e.dataTransfer.getData('fromCol'));
    if (fromRow === row && fromCol === col) return;
    // First select the source to set validMoves
    selectSquare(fromRow, fromCol);
    // Then make the move
    setTimeout(() => makeMove({ row: fromRow, col: fromCol }, { row, col }), 0);
  };

  // Corner class
  let cornerClass = '';
  if (displayRow === 0 && displayCol === 0) cornerClass = styles.cornerTopLeft;
  else if (displayRow === 0 && displayCol === 7) cornerClass = styles.cornerTopRight;
  else if (displayRow === 7 && displayCol === 0) cornerClass = styles.cornerBottomLeft;
  else if (displayRow === 7 && displayCol === 7) cornerClass = styles.cornerBottomRight;

  // Labels
  const showFileLabel = showLabels && displayRow === 7;
  const showRankLabel = showLabels && displayCol === 0;
  const fileLabel = FILE_LABELS[flipped ? 7 - col : col];
  const rankLabel = flipped ? row + 1 : 8 - row;
  const labelColor = isLight ? (isLight ? clr2 : clr1) : (isLight ? clr1 : clr2);

  const canDrag = piece && gameStarted;

  return (
    <div
      className={`${styles.cell} ${cornerClass}`}
      style={{ backgroundColor: bgColor }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {showRankLabel && (
        <span className={styles.labelCol} style={{ color: isLight ? clr2 : clr1 }}>
          {rankLabel}
        </span>
      )}
      {showFileLabel && (
        <span className={styles.labelRow} style={{ color: isLight ? clr2 : clr1 }}>
          {fileLabel}
        </span>
      )}

      {piece && (
        <img
          src={`${imagePath}${PIECE_NAME_MAP[piece.type]}-${piece.color === 'w' ? 'white' : 'black'}.png`}
          alt={`${piece.color}${piece.type}`}
          className={`${styles.piece} ${draggingThis ? styles.dragging : ''}`}
          draggable={canDrag}
          onDragStart={canDrag ? handleDragStart : undefined}
          onDragEnd={canDrag ? handleDragEnd : undefined}
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
        />
      )}

      {isValidMove && showLegalDots && (
        <div className={styles.dotContainer}>
          <svg viewBox="0 0 80 80" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            {piece ? (
              <circle cx="40" cy="40" r={dotSize * 2.5} fill="rgba(255, 100, 100, 0.35)" />
            ) : (
              <circle cx="40" cy="40" r={dotSize} fill="rgba(80, 80, 80, 0.45)" />
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
