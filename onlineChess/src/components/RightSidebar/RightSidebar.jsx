import { useRef, useEffect, useMemo } from 'react';
import styles from './RightSidebar.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';
import { getOpeningName } from '../../utils/evaluation';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_NAME_MAP = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function calcMaterial(captured) {
  return captured.reduce((sum, p) => sum + (PIECE_VALUES[p.type] || 0), 0);
}

export default function RightSidebar({ onAlert }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    whiteTime, blackTime, activeColor, timerRunning, timeControl,
    capturedByWhite, capturedByBlack,
    oppName, setOppName,
    youName,
    getPgn,
    gameStarted,
    flipped,
  } = useGameStore();

  const { pieceSets, pieceSetIndex } = useThemeStore();
  const imagePath = `./images/${pieceSets[pieceSetIndex].path}`;

  const moveHistoryRef = useRef(null);

  // Convert moveHistory (from/to as strings like 'e2') to row/col format for opening lookup
  const openingName = useMemo(() => {
    if (!moveHistory.length) return '';
    const adapted = moveHistory.map(m => ({
      from: { col: m.from.charCodeAt(0) - 97, row: 8 - parseInt(m.from[1]) },
      to:   { col: m.to.charCodeAt(0) - 97,   row: 8 - parseInt(m.to[1]) },
    }));
    return getOpeningName(adapted);
  }, [moveHistory]);

  // Auto-scroll move history
  useEffect(() => {
    if (moveHistoryRef.current) {
      const activeRow = moveHistoryRef.current.querySelector(`.${styles.moveCellActive}`);
      if (activeRow) activeRow.scrollIntoView({ block: 'nearest' });
    }
  }, [currentMoveIndex]);

  const handleCopyPgn = () => {
    const pgn = getPgn();
    if (!pgn) { onAlert && onAlert('No game in progress'); return; }
    navigator.clipboard.writeText(pgn).then(() => onAlert && onAlert('PGN copied!'));
  };

  // Build move rows (pairs of white + black)
  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      whiteIdx: i,
      black: moveHistory[i + 1] || null,
      blackIdx: i + 1,
    });
  }

  // Material advantage
  const whiteMaterial = calcMaterial(capturedByWhite);
  const blackMaterial = calcMaterial(capturedByBlack);
  const whiteAdv = whiteMaterial - blackMaterial;
  const blackAdv = blackMaterial - whiteMaterial;

  // Determine who's on top vs bottom based on flip
  const topColor = flipped ? 'w' : 'b';
  const bottomColor = flipped ? 'b' : 'w';
  const topName = flipped ? youName : oppName;
  const bottomName = flipped ? oppName : youName;
  const topCaptured = flipped ? capturedByBlack : capturedByWhite;
  const bottomCaptured = flipped ? capturedByWhite : capturedByBlack;
  const topAdv = flipped ? blackAdv : whiteAdv;
  const bottomAdv = flipped ? whiteAdv : blackAdv;
  const topTime = flipped ? whiteTime : blackTime;
  const bottomTime = flipped ? blackTime : whiteTime;
  const topActive = activeColor === topColor;
  const bottomActive = activeColor === bottomColor;

  return (
    <aside className={styles.sidebar}>
      {/* Top player (opponent) */}
      <div className={styles.playerRow}>
        <div className={styles.playerInfo}>
          <input
            className={styles.playerNameInput}
            value={topColor === 'b' ? oppName : youName}
            onChange={(e) => topColor === 'b' ? setOppName(e.target.value) : null}
            readOnly={topColor !== 'b'}
            placeholder="Opponent"
          />
          <div className={styles.capturedRow}>
            {topCaptured.map((p, i) => (
              <img
                key={i}
                src={`${imagePath}${PIECE_NAME_MAP[p.type]}+${p.color === 'w' ? 'white' : 'black'}.png`}
                className={styles.capturedPiece}
                alt={p.type}
              />
            ))}
          </div>
          {topAdv > 0 && <span className={styles.material}>+{topAdv}</span>}
        </div>
        {timeControl && (
          <div className={`${styles.timerDisplay} ${topActive && timerRunning ? styles.timerActive : ''} ${topActive && timerRunning && topTime <= 30 ? styles.timerLow : ''}`}>
            {formatTime(topTime)}
          </div>
        )}
      </div>

      {/* Opening name */}
      {openingName && (
        <div className={styles.openingName}>{openingName}</div>
      )}

      {/* Move history */}
      <div className={styles.moveHistory} ref={moveHistoryRef}>
        <table className={styles.moveTable}>
          <thead>
            <tr>
              <th style={{ width: '28px' }}>#</th>
              <th>White</th>
              <th>Black</th>
            </tr>
          </thead>
          <tbody>
            {moveRows.map((row) => (
              <tr key={row.number} className={styles.moveRow}>
                <td className={styles.moveCellNum}>{row.number}.</td>
                <td
                  className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveCellActive : ''}`}
                  onClick={() => goToMove(row.whiteIdx)}
                >
                  {row.white?.san || ''}
                </td>
                <td
                  className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveCellActive : ''}`}
                  onClick={() => row.black && goToMove(row.blackIdx)}
                >
                  {row.black?.san || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation buttons */}
      <div className={styles.navBtns}>
        <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">⏮</button>
        <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} title="Prev" disabled={currentMoveIndex < 0}>⬅</button>
        <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} title="Next" disabled={currentMoveIndex >= moveHistory.length - 1}>➡</button>
        <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">⏭</button>
      </div>

      <button className={styles.copyBtn} onClick={handleCopyPgn}>Copy PGN</button>

      {/* Bottom player (you) */}
      <div className={styles.playerRow}>
        <div className={styles.playerInfo}>
          <span className={styles.playerName}>{bottomColor === 'w' ? youName : oppName}</span>
          <div className={styles.capturedRow}>
            {bottomCaptured.map((p, i) => (
              <img
                key={i}
                src={`${imagePath}${PIECE_NAME_MAP[p.type]}+${p.color === 'w' ? 'white' : 'black'}.png`}
                className={styles.capturedPiece}
                alt={p.type}
              />
            ))}
          </div>
          {bottomAdv > 0 && <span className={styles.material}>+{bottomAdv}</span>}
        </div>
        {timeControl && (
          <div className={`${styles.timerDisplay} ${bottomActive && timerRunning ? styles.timerActive : ''} ${bottomActive && timerRunning && bottomTime <= 30 ? styles.timerLow : ''}`}>
            {formatTime(bottomTime)}
          </div>
        )}
      </div>
    </aside>
  );
}
