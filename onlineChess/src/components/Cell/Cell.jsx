import { memo, useState, useCallback } from 'react';
import styles from './Cell.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';
import usePrefsStore from '../../store/prefsStore';
import { usePieceResolver, getFallbackUrl } from '../../utils/pieceResolver';

const PIECE_NAME_MAP = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};
const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const Cell = memo(function Cell({ row, col, displayRow, displayCol, flipped, piece }) {
  const [draggingThis, setDraggingThis] = useState(false);

  // Zustand selectors — only subscribe to what this Cell needs
  const selectedSquare = useGameStore(s => s.selectedSquare);
  const validMoves = useGameStore(s => s.validMoves);
  const lastMove = useGameStore(s => s.lastMove);
  const underCheck = useGameStore(s => s.underCheck);
  const selectSquare = useGameStore(s => s.selectSquare);
  const makeMove = useGameStore(s => s.makeMove);
  const showLabels = useGameStore(s => s.showLabels);
  const showLegalDots = useGameStore(s => s.showLegalDots);
  const highlightLastMove = useGameStore(s => s.highlightLastMove);
  const highlightSelected = useGameStore(s => s.highlightSelected);
  const dotSize = useGameStore(s => s.dotSize);
  const gameStarted = useGameStore(s => s.gameStarted);
  const blindfoldMode = useGameStore(s => s.blindfoldMode);

  const pieceScale = usePrefsStore(s => s.pieceScale);
  const animationSpeed = usePrefsStore(s => s.animationSpeed);

  const clr1 = useThemeStore(s => s.clr1);
  const clr2 = useThemeStore(s => s.clr2);
  const clr1c = useThemeStore(s => s.clr1c);
  const clr2c = useThemeStore(s => s.clr2c);
  const clr1p = useThemeStore(s => s.clr1p);
  const clr2p = useThemeStore(s => s.clr2p);
  const clr1x = useThemeStore(s => s.clr1x);
  const clr2x = useThemeStore(s => s.clr2x);
  const boardThemeType = useThemeStore(s => s.boardThemeType);
  const resolvePiece = usePieceResolver();

  const isLight = (row + col) % 2 === 0;

  const isSelected = highlightSelected && selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  const isValidMove = validMoves.some(m => m.row === row && m.col === col);
  const isLastMoveFrom = highlightLastMove && lastMove && lastMove.from.row === row && lastMove.from.col === col;
  const isLastMoveTo = highlightLastMove && lastMove && lastMove.to.row === row && lastMove.to.col === col;
  const isInCheck = underCheck && underCheck.row === row && underCheck.col === col;

  const isImageTheme = boardThemeType === 'image';
  let bgColor = isImageTheme ? 'transparent' : (isLight ? clr1 : clr2);
  if (isInCheck) bgColor = isLight ? clr1c : clr2c;
  else if (isSelected) bgColor = isLight ? clr1x : clr2x;
  else if (isLastMoveFrom || isLastMoveTo) bgColor = isLight ? clr1p : clr2p;

  const handleClick = useCallback(() => {
    if (!gameStarted) return;
    const isValid = validMoves.some(m => m.row === row && m.col === col);
    if (isValid && selectedSquare) {
      makeMove(selectedSquare, { row, col });
    } else {
      selectSquare(row, col);
    }
  }, [gameStarted, validMoves, selectedSquare, makeMove, selectSquare, row, col]);

  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('fromRow', row);
    e.dataTransfer.setData('fromCol', col);
    setDraggingThis(true);
  }, [row, col]);

  const handleDragEnd = useCallback(() => setDraggingThis(false), []);
  const handleDragOver = useCallback((e) => e.preventDefault(), []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (!gameStarted) return;
    const fromRow = parseInt(e.dataTransfer.getData('fromRow'));
    const fromCol = parseInt(e.dataTransfer.getData('fromCol'));
    if (fromRow === row && fromCol === col) return;
    makeMove({ row: fromRow, col: fromCol }, { row, col });
  }, [makeMove, row, col, gameStarted]);

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

      {piece && !blindfoldMode && (
        <img
          src={resolvePiece(piece.type, piece.color)}
          alt={`${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAME_MAP[piece.type]}`}
          onError={e => { e.target.onerror = null; e.target.src = getFallbackUrl(piece.type, piece.color); }}
          className={`${styles.piece} ${draggingThis ? styles.dragging : ''}`}
          style={{
            transform: pieceScale !== 100 ? `scale(${pieceScale / 100})` : undefined,
            transition: animationSpeed === 'none' ? 'none'
              : `transform ${animationSpeed === 'fast' ? 80 : animationSpeed === 'slow' ? 300 : 150}ms ease`,
          }}
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
});

export default Cell;
