import { memo, useEffect, useState, useRef, useCallback } from 'react';
import styles from './Board.module.css';
import Cell from '../Cell/Cell';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';
import usePrefsStore from '../../store/prefsStore';
import { usePieceResolver } from '../../utils/pieceResolver';

const NORMAL_ORDER  = [0, 1, 2, 3, 4, 5, 6, 7];
const FLIPPED_ORDER = [7, 6, 5, 4, 3, 2, 1, 0];

const Board = memo(function Board({ arrows, badges }) {
  const boardState = useGameStore(s => s.boardState);
  const flipped = useGameStore(s => s.flipped);
  const lastMove = useGameStore(s => s.lastMove);
  const boardThemeType = useThemeStore(s => s.boardThemeType);
  const boardImageUrl = useThemeStore(s => s.boardImageUrl);
  const boardImageFailed = useThemeStore(s => s.boardImageFailed);
  const animationSpeed = usePrefsStore(s => s.animationSpeed);
  const resolvePiece = usePieceResolver();

  // ── Move animation state ──────────────────────────────────────────────────
  const [animating, setAnimating] = useState(null); // { piece, fromRow, fromCol, toRow, toCol }
  const prevLastMoveRef = useRef(null);
  const boardRef = useRef(null);

  // ── Illegal move shake ────────────────────────────────────────────────────
  const illegalMoveAt = useGameStore(s => s.illegalMoveAt);
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!illegalMoveAt) return;
    setShaking(true);
    const timer = setTimeout(() => setShaking(false), 300);
    return () => clearTimeout(timer);
  }, [illegalMoveAt]);

  useEffect(() => {
    if (animationSpeed === 'none') return;
    const prev = prevLastMoveRef.current;
    prevLastMoveRef.current = lastMove;

    // Only animate if lastMove actually changed (new move was made)
    if (!lastMove || !boardState) return;
    if (prev && prev.from.row === lastMove.from.row && prev.from.col === lastMove.from.col
             && prev.to.row === lastMove.to.row && prev.to.col === lastMove.to.col) return;

    // Get the piece that just moved (it's now at the destination)
    const piece = boardState[lastMove.to.row]?.[lastMove.to.col];
    if (!piece) return;

    const durationMs = animationSpeed === 'fast' ? 80 : animationSpeed === 'slow' ? 300 : 150;

    setAnimating({
      piece,
      fromRow: lastMove.from.row,
      fromCol: lastMove.from.col,
      toRow: lastMove.to.row,
      toCol: lastMove.to.col,
      duration: durationMs,
    });

    const timer = setTimeout(() => setAnimating(null), durationMs + 10);
    return () => clearTimeout(timer);
  }, [lastMove, boardState, animationSpeed]);

  // Test board image URL — fall back to color theme if CDN fails
  useEffect(() => {
    if (boardThemeType !== 'image' || !boardImageUrl) return;
    const img = new Image();
    img.onload = () => useThemeStore.getState().setBoardImageFailed(false);
    img.onerror = () => useThemeStore.getState().setBoardImageFailed(true);
    img.src = boardImageUrl;
  }, [boardImageUrl, boardThemeType]);

  const rows = flipped ? FLIPPED_ORDER : NORMAL_ORDER;
  const cols = flipped ? FLIPPED_ORDER : NORMAL_ORDER;

  if (!boardState) {
    return (
      <div className={styles.boardWrapper}>
        <div className={styles.placeholder}>Select a time control to begin</div>
      </div>
    );
  }

  const boardStyle = boardThemeType === 'image' && boardImageUrl && !boardImageFailed
    ? { backgroundImage: `url(${boardImageUrl})`, backgroundSize: '25% 25%' }
    : undefined;

  // Convert (row, col) to SVG coordinates respecting flip
  const toSvg = (r, c) => {
    const dr = flipped ? 7 - r : r;
    const dc = flipped ? 7 - c : c;
    return { x: dc * 100 + 50, y: dr * 100 + 50 };
  };

  const hasOverlays = (arrows?.length > 0) || (badges?.length > 0);

  // Compute animation overlay position (percentage-based for responsiveness)
  let animOverlay = null;
  if (animating) {
    const { piece, fromRow, fromCol, toRow, toCol, duration } = animating;
    const fromDisplayRow = flipped ? 7 - fromRow : fromRow;
    const fromDisplayCol = flipped ? 7 - fromCol : fromCol;
    const toDisplayRow = flipped ? 7 - toRow : toRow;
    const toDisplayCol = flipped ? 7 - toCol : toCol;

    // Start position (percentage of board)
    const startLeft = `${fromDisplayCol * 12.5}%`;
    const startTop  = `${fromDisplayRow * 12.5}%`;
    const endLeft   = `${toDisplayCol * 12.5}%`;
    const endTop    = `${toDisplayRow * 12.5}%`;

    animOverlay = (
      <div
        className={styles.moveAnimation}
        style={{
          '--anim-from-left': startLeft,
          '--anim-from-top': startTop,
          '--anim-to-left': endLeft,
          '--anim-to-top': endTop,
          '--anim-duration': `${duration}ms`,
          width: '12.5%',
          height: '12.5%',
        }}
      >
        <img
          src={resolvePiece(piece.type, piece.color)}
          alt=""
          className={styles.moveAnimPiece}
        />
      </div>
    );
  }

  // Hide piece at destination during animation
  const hideSquare = animating
    ? { row: animating.toRow, col: animating.toCol }
    : null;

  return (
    <div className={styles.boardWrapper}>
      <div className={`${styles.board} ${shaking ? styles.shake : ''}`} style={boardStyle} ref={boardRef}>
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
              hidePiece={hideSquare && hideSquare.row === row && hideSquare.col === col}
            />
          ))
        )}
        {animOverlay}
        {hasOverlays && (
          <svg className={styles.boardOverlay} viewBox="0 0 800 800">
            <defs>
              {(arrows || []).map((a, i) => (
                <marker key={`ah${i}`} id={`ah${i}`} markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">
                  <path d="M0,0 L4,2 L0,4 Z" fill={a.color} />
                </marker>
              ))}
            </defs>
            {(arrows || []).map((a, i) => {
              const from = toSvg(a.from.row, a.from.col);
              const to = toSvg(a.to.row, a.to.col);
              // Shorten arrow slightly so head doesn't overshoot center
              const dx = to.x - from.x, dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const shorten = 12;
              const tx = to.x - (dx / len) * shorten;
              const ty = to.y - (dy / len) * shorten;
              return (
                <line key={`ar${i}`}
                  x1={from.x} y1={from.y} x2={tx} y2={ty}
                  stroke={a.color} strokeWidth="10" strokeLinecap="round"
                  opacity="0.75" markerEnd={`url(#ah${i})`}
                />
              );
            })}
            {(badges || []).map((b, i) => {
              const dr = flipped ? 7 - b.row : b.row;
              const dc = flipped ? 7 - b.col : b.col;
              const bx = dc * 100 + 82;
              const by = dr * 100 + 18;
              return (
                <g key={`bg${i}`}>
                  <circle cx={bx} cy={by} r="16" fill={b.color} opacity="0.9" />
                  <text x={bx} y={by} textAnchor="middle" dominantBaseline="central"
                    fill="#fff" fontSize="14" fontWeight="800" fontFamily="sans-serif"
                  >{b.symbol}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
});

export default Board;
