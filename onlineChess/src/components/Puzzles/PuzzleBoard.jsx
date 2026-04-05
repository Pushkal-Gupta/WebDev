import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import styles from './PuzzlePage.module.css';
import useThemeStore from '../../store/themeStore';
import { usePieceResolver, getFallbackUrl } from '../../utils/pieceResolver';
import { FILE_LABELS, squareName, rankToRow, fileToCol, parseFen } from '../../utils/boardHelpers';

function PuzzleBoard({ fen, playerColor, onMove, status, lastMoveFrom, lastMoveTo, hintSquare, moveIndex, totalMoves }) {
  const { clr1, clr2, clr1p, clr2p, clr1x, clr2x } = useThemeStore();
  const resolvePiece = usePieceResolver();
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [chess]     = useState(() => new Chess());

  const flipped   = playerColor === 'b';
  const rows      = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols      = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const interactive = status === 'playing';

  useEffect(() => {
    setSelected(null);
    setValidMoves([]);
  }, [fen]);

  const handleCellClick = useCallback((row, col) => {
    if (!interactive) return;
    chess.load(fen);
    const turn = chess.turn();
    if (playerColor !== turn) return;

    const sq = squareName(row, col);
    const piece = chess.get(sq);

    const target = validMoves.find(m => m.row === row && m.col === col);
    if (target && selected) {
      onMove(target.uci);
      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === playerColor) {
      const moves = chess.moves({ square: sq, verbose: true });
      setSelected({ row, col });
      setValidMoves(moves.map(m => ({
        row: rankToRow(m.to[1]),
        col: fileToCol(m.to[0]),
        uci: m.from + m.to + (m.promotion || ''),
      })));
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  }, [fen, selected, validMoves, interactive, playerColor, onMove, chess]);

  const board = parseFen(fen);

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {rows.map((row, displayRow) =>
          cols.map((col, displayCol) => {
            const piece    = board[row]?.[col];
            const isLight  = (row + col) % 2 === 0;
            const isSel    = selected?.row === row && selected?.col === col;
            const isTarget = validMoves.some(m => m.row === row && m.col === col);
            const isLastFrom = lastMoveFrom && lastMoveFrom[0] === row && lastMoveFrom[1] === col;
            const isLastTo   = lastMoveTo   && lastMoveTo[0]   === row && lastMoveTo[1]   === col;
            const isHintFrom = hintSquare && hintSquare.from === squareName(row, col);
            const isHintTo   = hintSquare && hintSquare.to === squareName(row, col);

            let bg = isLight ? clr1 : clr2;
            if (isHintFrom) bg = 'rgba(255, 200, 0, 0.45)';
            else if (isHintTo) bg = 'rgba(255, 200, 0, 0.25)';
            else if (isSel) bg = isLight ? clr1x : clr2x;
            else if (isLastFrom || isLastTo) bg = isLight ? clr1p : clr2p;

            const showFileLabel = displayRow === 7;
            const showRankLabel = displayCol === 0;
            const fileLabel = FILE_LABELS[flipped ? 7 - col : col];
            const rankLabel = flipped ? row + 1 : 8 - row;

            return (
              <div
                key={`${row}-${col}`}
                className={styles.cell}
                style={{ backgroundColor: bg }}
                onClick={() => handleCellClick(row, col)}
              >
                {showRankLabel && (
                  <span className={styles.rankLabel} style={{ color: isLight ? clr2 : clr1 }}>
                    {rankLabel}
                  </span>
                )}
                {showFileLabel && (
                  <span className={styles.fileLabel} style={{ color: isLight ? clr2 : clr1 }}>
                    {fileLabel}
                  </span>
                )}
                {piece && (
                  <img
                    src={resolvePiece(piece.type, piece.color)}
                    onError={e => { e.target.onerror = null; e.target.src = getFallbackUrl(piece.type, piece.color); }}
                    alt={piece.type}
                    className={styles.piece}
                    onClick={e => { e.stopPropagation(); handleCellClick(row, col); }}
                  />
                )}
                {isTarget && (
                  <svg viewBox="0 0 80 80" className={styles.dot}>
                    {piece
                      ? <circle cx="40" cy="40" r="30" fill="rgba(255,100,100,0.35)" />
                      : <circle cx="40" cy="40" r="18" fill="rgba(80,80,80,0.45)" />
                    }
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${totalMoves > 0 ? (moveIndex / totalMoves) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export default PuzzleBoard;
