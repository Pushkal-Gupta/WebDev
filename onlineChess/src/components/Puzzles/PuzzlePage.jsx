import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import styles from './PuzzlePage.module.css';
import usePuzzleStore from '../../store/puzzleStore';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { PIECE_NAME, FILE_LABELS, squareName, rankToRow, fileToCol, parseFen } from '../../utils/boardHelpers';

// ── Inline board that works from a raw FEN ─────────────────────────────────

function PuzzleBoard({ fen, playerColor, onMove, status, lastMoveFrom, lastMoveTo, hintSquare }) {
  const { clr1, clr2, clr1p, clr2p, clr1x, clr2x, pieceSetIndex, pieceSets } = useThemeStore();
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [chess]     = useState(() => new Chess());

  const safeIndex = Math.max(0, Math.min(pieceSetIndex ?? 0, pieceSets.length - 1));
  const imagePath = `./images/${pieceSets[safeIndex].path}`;
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

// Helpers imported from ../../utils/boardHelpers

function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Main PuzzlePage ────────────────────────────────────────────────────────

export default function PuzzlePage() {
  const { user } = useAuthStore();
  const {
    puzzle, currentFen, playerColor, status, streak, mode,
    userPuzzleRating, lastRatingChange, errorMsg,
    loadNextPuzzle, handlePlayerMove, setMode,
    // Rush
    rushTimeLeft, rushScore, rushStrikes, rushActive, rushBestScore, startRush, stopRushTimer,
    // Streak
    streakCount, streakActive, streakBestCount, startStreak,
    // Hint
    hintSquare, hintUsed, getHint, clearHint,
  } = usePuzzleStore();

  const [lastMoveFrom, setLastMoveFrom] = useState(null);
  const [lastMoveTo,   setLastMoveTo]   = useState(null);
  const [feedback,     setFeedback]     = useState(null);

  // Load first puzzle on mount and when user changes
  const initRef = useRef(false);
  useEffect(() => {
    if (mode === 'rated' && (status === 'idle' || status === 'empty' || status === 'error' || !initRef.current)) {
      initRef.current = true;
      loadNextPuzzle(user?.id);
    }
  }, [user?.id, mode]); // eslint-disable-line

  // Cleanup rush timer on unmount
  useEffect(() => {
    return () => stopRushTimer();
  }, []); // eslint-disable-line

  const onMove = useCallback(async (uci) => {
    clearHint();
    setLastMoveFrom([rankToRow(uci[1]), fileToCol(uci[0])]);
    setLastMoveTo([rankToRow(uci[3]), fileToCol(uci[2])]);

    const result = await handlePlayerMove(uci, user?.id);
    if (result.correct) {
      setFeedback('correct');
      if (result.solved) {
        setTimeout(() => setFeedback(null), 500);
      } else {
        setTimeout(() => setFeedback(null), 400);
      }
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  }, [handlePlayerMove, user?.id]);

  const handleNext = () => {
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setFeedback(null);
    loadNextPuzzle(user?.id);
  };

  const handleModeChange = (newMode) => {
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setFeedback(null);
    setMode(newMode);
    if (newMode === 'rated') {
      loadNextPuzzle(user?.id);
    }
  };

  const puzzleRating = userPuzzleRating?.rating || 1500;

  return (
    <div className={styles.page}>
      {/* ── Board column ── */}
      <div className={styles.boardCol}>
        {/* Mode tabs */}
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${mode === 'rated' ? styles.modeTabActive : ''}`}
            onClick={() => handleModeChange('rated')}
          >
            Rated
          </button>
          <button
            className={`${styles.modeTab} ${mode === 'rush' ? styles.modeTabActive : ''}`}
            onClick={() => handleModeChange('rush')}
          >
            Rush
          </button>
          <button
            className={`${styles.modeTab} ${mode === 'streak' ? styles.modeTabActive : ''}`}
            onClick={() => handleModeChange('streak')}
          >
            Streak
          </button>
        </div>

        {/* Turn indicator / status */}
        <div className={styles.turnBar}>
          {status === 'playing' && (
            <>
              <span className={`${styles.turnDot} ${playerColor === 'w' ? styles.dotW : styles.dotB}`} />
              <span>{playerColor === 'w' ? 'White' : 'Black'} to move</span>
            </>
          )}
          {status === 'loading' && <span className={styles.turnHint}>Loading puzzle...</span>}
          {status === 'idle' && mode === 'rated' && <span className={styles.turnHint}>Press "New Puzzle" to start</span>}
          {status === 'idle' && mode === 'rush' && <span className={styles.turnHint}>Choose a time and start!</span>}
          {status === 'idle' && mode === 'streak' && <span className={styles.turnHint}>Start your streak!</span>}
          {status === 'empty'  && <span className={styles.turnHint}>No puzzles available</span>}
          {status === 'error'  && <span className={styles.feedbackFailed}>{errorMsg || 'Error loading puzzle'}</span>}
          {status === 'solved' && <span className={styles.feedbackSolved}>Puzzle solved!</span>}
          {status === 'failed' && <span className={styles.feedbackFailed}>Incorrect -- try next</span>}
          {status === 'rush_over' && <span className={styles.feedbackFailed}>Rush Over!</span>}
          {status === 'streak_over' && <span className={styles.feedbackFailed}>Streak Over!</span>}
        </div>

        {/* Feedback flash */}
        {feedback === 'correct' && <div className={styles.flash + ' ' + styles.flashCorrect}>+1</div>}
        {feedback === 'wrong'   && <div className={styles.flash + ' ' + styles.flashWrong}>X</div>}

        {currentFen
          ? <PuzzleBoard
              fen={currentFen}
              playerColor={playerColor}
              onMove={onMove}
              status={status}
              lastMoveFrom={lastMoveFrom}
              lastMoveTo={lastMoveTo}
              hintSquare={hintSquare}
            />
          : <div className={styles.emptyBoard} />
        }
      </div>

      {/* ── Panel column ── */}
      <div className={styles.panel}>
        {/* ── Rated mode panel ── */}
        {mode === 'rated' && (
          <>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Puzzles</span>
              <span className={styles.streakBadge}>Streak {streak}</span>
            </div>

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

            <div className={styles.actions}>
              {(status === 'solved' || status === 'failed') && (
                <button className={styles.nextBtn} onClick={handleNext}>Next Puzzle</button>
              )}
              {status === 'playing' && (
                <>
                  <button className={styles.hintBtn} onClick={getHint} disabled={hintUsed}>
                    {hintUsed ? 'Hint Used' : 'Hint'}
                  </button>
                  <button className={styles.skipBtn} onClick={handleNext}>Skip</button>
                </>
              )}
              {(status === 'idle' || status === 'loading') && (
                <button className={styles.nextBtn} onClick={() => loadNextPuzzle(user?.id)} disabled={status === 'loading'}>
                  {status === 'loading' ? 'Loading...' : 'New Puzzle'}
                </button>
              )}
              {status === 'error' && (
                <button className={styles.nextBtn} onClick={handleNext}>Try Again</button>
              )}
            </div>
            {hintUsed && status === 'playing' && (
              <div className={styles.hintNote}>Rating gain reduced when using hints</div>
            )}
          </>
        )}

        {/* ── Rush mode panel ── */}
        {mode === 'rush' && (
          <>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Puzzle Rush</span>
            </div>

            {!rushActive && status !== 'rush_over' && (
              <div className={styles.rushSetup}>
                <p className={styles.rushDesc}>
                  Solve as many puzzles as you can! 3 wrong answers and it's over.
                </p>
                <div className={styles.rushBtns}>
                  <button className={styles.rushStartBtn} onClick={() => startRush(180, user?.id)}>
                    3 Min Rush
                  </button>
                  <button className={styles.rushStartBtn} onClick={() => startRush(300, user?.id)}>
                    5 Min Rush
                  </button>
                </div>
                {rushBestScore > 0 && (
                  <div className={styles.bestScore}>Best: {rushBestScore}</div>
                )}
              </div>
            )}

            {(rushActive || status === 'rush_over') && (
              <div className={styles.rushHud}>
                <div className={styles.rushTimer}>
                  <div className={`${styles.rushClockVal} ${rushTimeLeft <= 10 ? styles.rushClockLow : ''}`}>
                    {formatClock(rushTimeLeft)}
                  </div>
                  <div className={styles.rushClockLbl}>Time</div>
                </div>

                <div className={styles.rushScoreBox}>
                  <div className={styles.rushScoreVal}>{rushScore}</div>
                  <div className={styles.rushScoreLbl}>Solved</div>
                </div>

                <div className={styles.rushHeartsRow}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`${styles.rushHeart} ${i < (3 - rushStrikes) ? styles.rushHeartFull : styles.rushHeartEmpty}`}>
                      {i < (3 - rushStrikes) ? '\u2764' : '\u2661'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {status === 'rush_over' && (
              <div className={styles.rushOverPanel}>
                <div className={styles.rushOverTitle}>Rush Complete!</div>
                <div className={styles.rushOverScore}>Score: {rushScore}</div>
                {rushScore >= rushBestScore && rushScore > 0 && (
                  <div className={styles.rushNewBest}>New Best!</div>
                )}
                <div className={styles.bestScore}>Best: {rushBestScore}</div>
                <button className={styles.nextBtn} onClick={() => handleModeChange('rush')}>
                  Play Again
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Streak mode panel ── */}
        {mode === 'streak' && (
          <>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Puzzle Streak</span>
            </div>

            {!streakActive && status !== 'streak_over' && (
              <div className={styles.rushSetup}>
                <p className={styles.rushDesc}>
                  Puzzles get harder as you go. One wrong move and it's over!
                </p>
                <button className={styles.rushStartBtn} onClick={() => startStreak(user?.id)}>
                  Start Streak
                </button>
                {streakBestCount > 0 && (
                  <div className={styles.bestScore}>Best: {streakBestCount}</div>
                )}
              </div>
            )}

            {(streakActive || status === 'streak_over') && (
              <div className={styles.rushHud}>
                <div className={styles.rushScoreBox}>
                  <div className={styles.rushScoreVal}>{streakCount}</div>
                  <div className={styles.rushScoreLbl}>Streak</div>
                </div>

                {puzzle && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Difficulty</span>
                    <span className={styles.infoVal}>{puzzle.rating}</span>
                  </div>
                )}
              </div>
            )}

            {status === 'streak_over' && (
              <div className={styles.rushOverPanel}>
                <div className={styles.rushOverTitle}>Streak Over!</div>
                <div className={styles.rushOverScore}>Score: {streakCount}</div>
                {streakCount >= streakBestCount && streakCount > 0 && (
                  <div className={styles.rushNewBest}>New Best!</div>
                )}
                <div className={styles.bestScore}>Best: {streakBestCount}</div>
                <button className={styles.nextBtn} onClick={() => handleModeChange('streak')}>
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
