import { useState, useCallback } from 'react';
import styles from './BoardEditor.module.css';
import useThemeStore, { useBoardColors, cellStyle, boardContainerStyle } from '../../store/themeStore';
import { usePieceResolver, getFallbackUrl } from '../../utils/pieceResolver';
import { PIECE_NAME, FILE_LABELS, parseFen as parseFenToBoard } from '../../utils/boardHelpers';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EMPTY_BOARD = Array.from({ length: 8 }, () => Array(8).fill(null));

const PALETTE_PIECES = [
  { type: 'k', color: 'w' }, { type: 'q', color: 'w' }, { type: 'r', color: 'w' },
  { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'p', color: 'w' },
  { type: 'k', color: 'b' }, { type: 'q', color: 'b' }, { type: 'r', color: 'b' },
  { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'p', color: 'b' },
];

function boardToFen(board, turn, castling) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) { empty++; continue; }
      if (empty > 0) { row += empty; empty = 0; }
      const ch = p.color === 'w' ? p.type.toUpperCase() : p.type;
      row += ch;
    }
    if (empty > 0) row += empty;
    rows.push(row);
  }

  let castleStr = '';
  if (castling.K) castleStr += 'K';
  if (castling.Q) castleStr += 'Q';
  if (castling.k) castleStr += 'k';
  if (castling.q) castleStr += 'q';
  if (!castleStr) castleStr = '-';

  return `${rows.join('/')} ${turn} ${castleStr} - 0 1`;
}

export default function BoardEditor({ onAnalyse }) {
  const { clr1, clr2, clr1x, clr2x, isImageTheme, boardImageUrl } = useBoardColors();
  const resolvePiece = usePieceResolver();

  const [board, setBoard] = useState(() => parseFenToBoard(START_FEN));
  const [selectedPiece, setSelectedPiece] = useState(null); // { type, color } or 'eraser'
  const [turn, setTurn] = useState('w');
  const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
  const [fenInput, setFenInput] = useState('');
  const [fenError, setFenError] = useState('');

  const handleCellClick = useCallback((row, col) => {
    if (!selectedPiece) return;
    setBoard(prev => {
      const next = prev.map(r => [...r]);
      if (selectedPiece === 'eraser') {
        next[row][col] = null;
      } else {
        next[row][col] = { ...selectedPiece };
      }
      return next;
    });
  }, [selectedPiece]);

  const handleClear = () => {
    setBoard(EMPTY_BOARD.map(r => [...r]));
    setCastling({ K: false, Q: false, k: false, q: false });
  };

  const handleStartPos = () => {
    setBoard(parseFenToBoard(START_FEN));
    setCastling({ K: true, Q: true, k: true, q: true });
    setTurn('w');
  };

  const handleLoadFen = () => {
    setFenError('');
    if (!fenInput.trim()) { setFenError('Enter a FEN string'); return; }
    try {
      const b = parseFenToBoard(fenInput.trim());
      // Validate it has at least some pieces
      const hasPieces = b.some(row => row.some(cell => cell !== null));
      if (!hasPieces) { setFenError('FEN has no pieces'); return; }
      setBoard(b);
      // Parse turn
      const parts = fenInput.trim().split(' ');
      if (parts[1] === 'b') setTurn('b'); else setTurn('w');
      // Parse castling
      const c = parts[2] || '-';
      setCastling({ K: c.includes('K'), Q: c.includes('Q'), k: c.includes('k'), q: c.includes('q') });
    } catch {
      setFenError('Invalid FEN format');
    }
  };

  const handleAnalyse = () => {
    const fen = boardToFen(board, turn, castling);
    onAnalyse(fen);
  };

  const currentFen = boardToFen(board, turn, castling);

  return (
    <div className={styles.editor}>
      {/* Mini board */}
      <div className={styles.boardGrid} style={boardContainerStyle(isImageTheme, boardImageUrl)}>
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const piece = board[row]?.[col];
            const isLight = (row + col) % 2 === 0;
            const bg = isLight ? clr1 : clr2;

            return (
              <div
                key={`${row}-${col}`}
                className={styles.cell}
                style={cellStyle(isLight, bg, isImageTheme, boardImageUrl, false)}
                onClick={() => handleCellClick(row, col)}
              >
                {piece && (
                  <img
                    src={resolvePiece(piece.type, piece.color)}
                    onError={e => { e.target.onerror = null; e.target.src = getFallbackUrl(piece.type, piece.color); }}
                    alt={`${piece.color}${piece.type}`}
                    className={styles.cellPiece}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Piece palette */}
      <div className={styles.palette}>
        <div className={styles.paletteLabel}>Select piece to place:</div>
        <div className={styles.paletteRow}>
          {PALETTE_PIECES.filter(p => p.color === 'w').map(p => (
            <div
              key={`w${p.type}`}
              className={`${styles.palettePiece} ${selectedPiece?.type === p.type && selectedPiece?.color === 'w' ? styles.palettePieceActive : ''}`}
              onClick={() => setSelectedPiece(selectedPiece?.type === p.type && selectedPiece?.color === p.color ? null : p)}
            >
              <img src={resolvePiece(p.type, 'w')} onError={e => { e.target.onerror = null; e.target.src = getFallbackUrl(p.type, 'w'); }} alt={p.type} className={styles.paletteImg} />
            </div>
          ))}
        </div>
        <div className={styles.paletteRow}>
          {PALETTE_PIECES.filter(p => p.color === 'b').map(p => (
            <div
              key={`b${p.type}`}
              className={`${styles.palettePiece} ${selectedPiece?.type === p.type && selectedPiece?.color === 'b' ? styles.palettePieceActive : ''}`}
              onClick={() => setSelectedPiece(selectedPiece?.type === p.type && selectedPiece?.color === p.color ? null : p)}
            >
              <img src={resolvePiece(p.type, 'b')} onError={e => { e.target.onerror = null; e.target.src = getFallbackUrl(p.type, 'b'); }} alt={p.type} className={styles.paletteImg} />
            </div>
          ))}
        </div>
        <div className={styles.paletteRow}>
          <div
            className={`${styles.palettePiece} ${styles.eraserBtn} ${selectedPiece === 'eraser' ? styles.palettePieceActive : ''}`}
            onClick={() => setSelectedPiece(selectedPiece === 'eraser' ? null : 'eraser')}
          >
            &#x2715;
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Side to move */}
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Turn:</span>
          <button className={`${styles.toggleBtn} ${turn === 'w' ? styles.toggleActive : ''}`}
            onClick={() => setTurn('w')}>White</button>
          <button className={`${styles.toggleBtn} ${turn === 'b' ? styles.toggleActive : ''}`}
            onClick={() => setTurn('b')}>Black</button>
        </div>

        {/* Castling */}
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Castling:</span>
          <div className={styles.castlingChecks}>
            {[['K', 'K'], ['Q', 'Q'], ['k', 'k'], ['q', 'q']].map(([key, label]) => (
              <label key={key} className={styles.castlingLabel}>
                <input type="checkbox" checked={castling[key]}
                  onChange={() => setCastling(prev => ({ ...prev, [key]: !prev[key] }))} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className={styles.controlRow}>
          <button className={styles.smallBtn} onClick={handleStartPos}>Start Position</button>
          <button className={styles.smallBtn} onClick={handleClear}>Clear Board</button>
        </div>

        {/* FEN input */}
        <div className={styles.fenRow}>
          <input
            className={styles.fenInput}
            value={fenInput}
            onChange={e => { setFenInput(e.target.value); setFenError(''); }}
            placeholder="Load FEN..."
            onKeyDown={e => e.key === 'Enter' && handleLoadFen()}
          />
          <button className={styles.smallBtn} onClick={handleLoadFen}>Load</button>
        </div>
        {fenError && <div className={styles.fenError}>{fenError}</div>}

        {/* Current FEN display */}
        <div className={styles.fenDisplay}>
          <span className={styles.fenDisplayLabel}>FEN:</span>
          <span className={styles.fenDisplayVal}>{currentFen}</span>
        </div>

        {/* Analyse button */}
        <button className={styles.analyseBtn} onClick={handleAnalyse}>
          Analyse Position
        </button>
      </div>
    </div>
  );
}
