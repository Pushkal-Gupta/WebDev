import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import styles from './PuzzlePage.module.css';
import usePuzzleStore from '../../store/puzzleStore';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const PIECE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// ── Inline board that works from a raw FEN ─────────────────────────────────

function PuzzleBoard({ fen, playerColor, onMove, status, lastMoveFrom, lastMoveTo }) {
  const { clr1, clr2, clr1p, clr2p, clr1x, clr2x, pieceSetIndex, pieceSets } = useThemeStore();
  const [selected, setSelected] = useState(null);   // { row, col }
  const [validMoves, setValidMoves] = useState([]);  // [{ row, col, uci }]
  const [chess]     = useState(() => new Chess());

  const imagePath = `./images/${pieceSets[pieceSetIndex].path}`;
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
    const turnColor = turn === 'w' ? 'w' : 'b';
    if (playerColor !== turnColor) return;

    const sq = squareName(row, col);
    const piece = chess.get(sq);

    // If clicking a valid move target
    const target = validMoves.find(m => m.row === row && m.col === col);
    if (target && selected) {
      onMove(target.uci);
      setSelected(null);
      setValidMoves([]);
      return;
    }

    // Selecting own piece
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

            let bg = isLight ? clr1 : clr2;
            if (isSel) bg = isLight ? clr1x : clr2x;
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
                    src={`${imagePath}${PIECE_NAME[piece.type]}-${piece.color === 'w' ? 'white' : 'black'}.png`}
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
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function squareName(row, col) {
  return FILE_LABELS[col] + (8 - row);
}
function rankToRow(rankChar) { return 8 - parseInt(rankChar); }
function fileToCol(fileChar) { return FILE_LABELS.indexOf(fileChar); }

function parseFen(fen) {
  if (!fen) return [];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const rows = fen.split(' ')[0].split('/');
  rows.forEach((rowStr, r) => {
    let c = 0;
    for (const ch of rowStr) {
      if (isNaN(ch)) {
        board[r][c] = { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b' };
        c++;
      } else {
        c += parseInt(ch);
      }
    }
  });
  return board;
}

// ── Main PuzzlePage ────────────────────────────────────────────────────────

export default function PuzzlePage() {
  const { user } = useAuthStore();
  const {
    puzzle, currentFen, playerColor, status, streak,
    userPuzzleRating, lastRatingChange,
    loadNextPuzzle, handlePlayerMove,
  } = usePuzzleStore();

  const [lastMoveFrom, setLastMoveFrom] = useState(null);
  const [lastMoveTo,   setLastMoveTo]   = useState(null);
  const [feedback,     setFeedback]     = useState(null); // 'correct'|'wrong'|null

  // Load first puzzle on mount if none loaded yet
  useEffect(() => {
    if (status === 'idle' || status === 'empty') {
      loadNextPuzzle(user?.id);
    }
  }, []); // eslint-disable-line

  const onMove = useCallback(async (uci) => {
    setLastMoveFrom([rankToRow(uci[1]), fileToCol(uci[0])]);
    setLastMoveTo([rankToRow(uci[3]), fileToCol(uci[2])]);

    const result = await handlePlayerMove(uci, user?.id);
    if (result.correct) {
      setFeedback('correct');
      if (result.solved) {
        setTimeout(() => setFeedback(null), 1500);
      } else {
        setTimeout(() => setFeedback(null), 600);
      }
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  }, [handlePlayerMove, user?.id]);

  const handleNext = () => {
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setFeedback(null);
    loadNextPuzzle(user?.id);
  };

  const puzzleRating = userPuzzleRating?.rating || 1500;

  return (
    <div className={styles.page}>
      {/* ── Board column ── */}
      <div className={styles.boardCol}>
        {/* Turn indicator */}
        <div className={styles.turnBar}>
          {status === 'playing' && (
            <>
              <span className={`${styles.turnDot} ${playerColor === 'w' ? styles.dotW : styles.dotB}`} />
              <span>{playerColor === 'w' ? 'White' : 'Black'} to move</span>
            </>
          )}
          {status === 'loading' && <span className={styles.turnHint}>Loading puzzle…</span>}
          {status === 'idle'    && <span className={styles.turnHint}>Press "New Puzzle" to start</span>}
          {status === 'empty'   && <span className={styles.turnHint}>No puzzles available</span>}
          {status === 'solved'  && <span className={styles.feedbackSolved}>Puzzle solved!</span>}
          {status === 'failed'  && <span className={styles.feedbackFailed}>Incorrect — try next</span>}
        </div>

        {/* Inline feedback flash */}
        {feedback === 'correct' && <div className={styles.flash + ' ' + styles.flashCorrect}>✓</div>}
        {feedback === 'wrong'   && <div className={styles.flash + ' ' + styles.flashWrong}>✗</div>}

        {currentFen
          ? <PuzzleBoard
              fen={currentFen}
              playerColor={playerColor}
              onMove={onMove}
              status={status}
              lastMoveFrom={lastMoveFrom}
              lastMoveTo={lastMoveTo}
            />
          : <div className={styles.emptyBoard} />
        }
      </div>

      {/* ── Panel column ── */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Puzzles</span>
          <span className={styles.streakBadge}>🔥 {streak}</span>
        </div>

        {/* Rating */}
        <div className={styles.ratingRow}>
          <div className={styles.ratingBox}>
            <div className={styles.ratingVal}>{puzzleRating}</div>
            <div className={styles.ratingLbl}>Puzzle Rating</div>
          </div>
          {lastRatingChange != null && (
            <div className={`${styles.ratingDelta} ${lastRatingChange >= 0 ? styles.deltaUp : styles.deltaDown}`}>
              {lastRatingChange >= 0 ? '+' : ''}{lastRatingChange}
            </div>
          )}
        </div>

        {/* Puzzle info */}
        {puzzle && (
          <div className={styles.puzzleInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Difficulty</span>
              <span className={styles.infoVal}>{puzzle.rating}</span>
            </div>
            {puzzle.themes?.length > 0 && (
              <div className={styles.themes}>
                {puzzle.themes.slice(0, 4).map(t => (
                  <span key={t} className={styles.theme}>{t.replace(/([A-Z])/g, ' $1').trim()}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <div className={styles.statNum} style={{color:'#6fdc8c'}}>{userPuzzleRating?.wins || 0}</div>
            <div className={styles.statLbl}>Solved</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum} style={{color:'#ff7875'}}>{userPuzzleRating?.losses || 0}</div>
            <div className={styles.statLbl}>Failed</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>{userPuzzleRating?.games_played || 0}</div>
            <div className={styles.statLbl}>Total</div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {(status === 'solved' || status === 'failed') && (
            <button className={styles.nextBtn} onClick={handleNext}>
              Next Puzzle →
            </button>
          )}
          {status === 'playing' && (
            <button className={styles.skipBtn} onClick={handleNext}>
              Skip
            </button>
          )}
          {(status === 'idle' || status === 'loading') && (
            <button
              className={styles.nextBtn}
              onClick={() => loadNextPuzzle(user?.id)}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Loading…' : 'New Puzzle'}
            </button>
          )}
          {status === 'empty' && (
            <div className={styles.emptyMsg}>
              Puzzles aren't available yet. Check back soon or import the Lichess puzzle database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
