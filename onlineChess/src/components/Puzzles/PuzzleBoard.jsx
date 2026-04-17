import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import styles from './PuzzlePage.module.css';
import useThemeStore from '../../store/themeStore';
import { usePieceResolver, getFallbackUrl } from '../../utils/pieceResolver';
import { FILE_LABELS, squareName, rankToRow, fileToCol, parseFen } from '../../utils/boardHelpers';
import PromotionModal from '../modals/PromotionModal';

function PuzzleBoard({ fen, playerColor, onMove, status, lastMoveFrom, lastMoveTo, hintSquare, moveIndex, totalMoves }) {
  const { clr1: _c1, clr2: _c2, clr1p, clr2p, clr1x, clr2x, clr1c, clr2c, boardThemeType, boardImageUrl, boardImageFailed } = useThemeStore();
  const isImageTheme = boardThemeType === 'image' && !!boardImageUrl && !boardImageFailed;
  const clr1 = isImageTheme || _c1 === 'transparent' ? '#EEEED2' : _c1;
  const clr2 = isImageTheme || _c2 === 'transparent' ? '#769656' : _c2;
  const resolvePiece = usePieceResolver();
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [chess]     = useState(() => new Chess());
  const [pendingPromotion, setPendingPromotion] = useState(null);

  useEffect(() => {
    if (boardThemeType !== 'image' || !boardImageUrl) return;
    const img = new Image();
    img.onload = () => useThemeStore.getState().setBoardImageFailed(false);
    img.onerror = () => useThemeStore.getState().setBoardImageFailed(true);
    img.src = boardImageUrl;
  }, [boardImageUrl, boardThemeType]);

  const flipped   = playerColor === 'b';
  const rows      = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols      = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const interactive = status === 'playing';

  useEffect(() => {
    setSelected(null);
    setValidMoves([]);
    setPendingPromotion(null);
  }, [fen]);

  const handleCellClick = useCallback((row, col) => {
    if (!interactive || pendingPromotion) return;
    chess.load(fen);
    const turn = chess.turn();
    if (playerColor !== turn) return;

    const sq = squareName(row, col);
    const piece = chess.get(sq);

    const target = validMoves.find(m => m.row === row && m.col === col);
    if (target && selected) {
      // Check if this square has multiple promotion options
      const promoMoves = validMoves.filter(m => m.row === row && m.col === col && m.uci.length === 5);
      if (promoMoves.length > 1) {
        // Show promotion chooser
        setPendingPromotion({ moves: promoMoves, row, col });
        return;
      }
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
  }, [fen, selected, validMoves, interactive, playerColor, onMove, chess, pendingPromotion]);

  const handlePromotionSelect = useCallback((piece) => {
    if (!pendingPromotion) return;
    const move = pendingPromotion.moves.find(m => m.uci.endsWith(piece));
    if (move) onMove(move.uci);
    setPendingPromotion(null);
    setSelected(null);
    setValidMoves([]);
  }, [pendingPromotion, onMove]);

  const board = parseFen(fen);

  return (
    <div className={styles.boardWrapper}>
      <div
        className={styles.board}
        style={isImageTheme ? { backgroundImage: `url(${boardImageUrl})`, backgroundSize: '25% 25%' } : undefined}
      >
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

            let bg = isImageTheme ? 'transparent' : (isLight ? clr1 : clr2);
            if (isHintFrom) bg = 'rgba(255, 200, 0, 0.45)';
            else if (isHintTo) bg = 'rgba(255, 200, 0, 0.25)';
            else if (isSel) bg = isImageTheme ? (isLight ? 'rgba(255,255,50,0.42)' : 'rgba(255,255,50,0.42)') : (isLight ? clr1x : clr2x);
            else if (isLastFrom || isLastTo) bg = isImageTheme ? (isLight ? 'rgba(255,255,50,0.32)' : 'rgba(255,255,50,0.32)') : (isLight ? clr1p : clr2p);

            const showFileLabel = displayRow === 7;
            const showRankLabel = displayCol === 0;
            const fileLabel = FILE_LABELS[col];
            const rankLabel = 8 - row;

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
                    crossOrigin="anonymous"
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
      {pendingPromotion && (
        <PromotionModal
          color={playerColor === 'w' ? 'white' : 'black'}
          onSelect={handlePromotionSelect}
        />
      )}
    </div>
  );
}

export default PuzzleBoard;
