import { memo, useEffect } from 'react';
import styles from './Board.module.css';
import Cell from '../Cell/Cell';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';

const NORMAL_ORDER  = [0, 1, 2, 3, 4, 5, 6, 7];
const FLIPPED_ORDER = [7, 6, 5, 4, 3, 2, 1, 0];

const Board = memo(function Board({ arrows, badges }) {
  const boardState = useGameStore(s => s.boardState);
  const flipped = useGameStore(s => s.flipped);
  const boardThemeType = useThemeStore(s => s.boardThemeType);
  const boardImageUrl = useThemeStore(s => s.boardImageUrl);
  const boardImageFailed = useThemeStore(s => s.boardImageFailed);

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
