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
  const lastMoveIsNew = useGameStore(s => s.lastMoveIsNew);
  const boardThemeType = useThemeStore(s => s.boardThemeType);
  const boardImageUrl = useThemeStore(s => s.boardImageUrl);
  const boardImageFailed = useThemeStore(s => s.boardImageFailed);
  const animationSpeed = usePrefsStore(s => s.animationSpeed);
  const resolvePiece = usePieceResolver();

  // ── Move animation state ──────────────────────────────────────────────────
  // animating: { pieces: [{ type, color, fromRow, fromCol, toRow, toCol }], hideSquares: [{row,col}], duration }
  const [animating, setAnimating] = useState(null);
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
    if (!lastMoveIsNew) return;
    if (!lastMove || !boardState) return;

    const durationMs = animationSpeed === 'fast' ? 80 : animationSpeed === 'slow' ? 300 : 150;
    const flags = lastMove.flags || '';
    const color = lastMove.pieceColor || 'w';
    const pieces = [];
    const hideSquares = [];

    // Use source piece type for promotion (show pawn sliding, not queen)
    const pieceType = lastMove.pieceType || boardState[lastMove.to.row]?.[lastMove.to.col]?.type || 'p';

    // Main piece animation
    pieces.push({
      type: pieceType,
      color,
      fromRow: lastMove.from.row,
      fromCol: lastMove.from.col,
      toRow: lastMove.to.row,
      toCol: lastMove.to.col,
    });
    hideSquares.push({ row: lastMove.to.row, col: lastMove.to.col });

    // Castling: also animate the rook
    if (flags.includes('k')) {
      // Kingside castle — rook moves from h-file to f-file
      const rookRow = lastMove.from.row;
      pieces.push({ type: 'r', color, fromRow: rookRow, fromCol: 7, toRow: rookRow, toCol: 5 });
      hideSquares.push({ row: rookRow, col: 5 });
    } else if (flags.includes('q')) {
      // Queenside castle — rook moves from a-file to d-file
      const rookRow = lastMove.from.row;
      pieces.push({ type: 'r', color, fromRow: rookRow, fromCol: 0, toRow: rookRow, toCol: 3 });
      hideSquares.push({ row: rookRow, col: 3 });
    }

    // En passant: hide the captured pawn's square
    if (flags.includes('e')) {
      // Captured pawn is on the same column as destination, same row as source
      hideSquares.push({ row: lastMove.from.row, col: lastMove.to.col });
    }

    setAnimating({ pieces, hideSquares, duration: durationMs });
    const timer = setTimeout(() => setAnimating(null), durationMs + 10);
    return () => clearTimeout(timer);
  }, [lastMove, lastMoveIsNew, boardState, animationSpeed]);

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

  // Compute animation overlays (one per animated piece)
  let animOverlay = null;
  if (animating) {
    animOverlay = animating.pieces.map((p, i) => {
      const fromDisplayRow = flipped ? 7 - p.fromRow : p.fromRow;
      const fromDisplayCol = flipped ? 7 - p.fromCol : p.fromCol;
      const toDisplayRow = flipped ? 7 - p.toRow : p.toRow;
      const toDisplayCol = flipped ? 7 - p.toCol : p.toCol;

      return (
        <div
          key={`anim-${i}`}
          className={styles.moveAnimation}
          style={{
            '--anim-from-left': `${fromDisplayCol * 12.5}%`,
            '--anim-from-top': `${fromDisplayRow * 12.5}%`,
            '--anim-to-left': `${toDisplayCol * 12.5}%`,
            '--anim-to-top': `${toDisplayRow * 12.5}%`,
            '--anim-duration': `${animating.duration}ms`,
            width: '12.5%',
            height: '12.5%',
          }}
        >
          <img
            src={resolvePiece(p.type, p.color)}
            alt=""
            className={styles.moveAnimPiece}
          />
        </div>
      );
    });
  }

  // Hide pieces at destination squares during animation (+ en passant captured pawn)
  const hideSquares = animating ? animating.hideSquares : null;

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
              hidePiece={hideSquares?.some(sq => sq.row === row && sq.col === col)}
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
