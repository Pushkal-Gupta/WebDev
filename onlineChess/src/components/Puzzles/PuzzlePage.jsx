import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './PuzzlePage.module.css';
import PuzzleBoard from './PuzzleBoard';
import MoveList from './MoveList';
import ThemePicker from './ThemePicker';
import DailyPuzzle from './DailyPuzzle';
import PuzzleHistory from './PuzzleHistory';
import RatingChart from './RatingChart';
import usePuzzleStore from '../../store/puzzleStore';
import useAuthStore from '../../store/authStore';
import { playSound } from '../../utils/soundManager';
import { rankToRow, fileToCol } from '../../utils/boardHelpers';

function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Main PuzzlePage ────────────────────────────────────────────────────────

export default function PuzzlePage() {
  const { user } = useAuthStore();
  const {
    puzzle, currentFen, playerColor, status, streak, mode, moveIndex,
    userPuzzleRating, lastRatingChange, errorMsg,
    loadNextPuzzle, handlePlayerMove, setMode,
    // Rush
    rushTimeLeft, rushScore, rushStrikes, rushActive, rushBestScore, startRush, stopRushTimer,
    // Streak
    streakCount, streakActive, streakBestCount, startStreak,
    // Hint
    hintSquare, hintUsed, getHint, clearHint,
    // Retry / Give Up
    wrongAttempt, attempts, giveUp,
    // Daily
    dailyPuzzle, dailySolved, loadDailyPuzzle,
    // Theme training
    selectedTheme, loadByTheme,
    // Difficulty
    difficultyLevel, loadByDifficulty,
    // Solution review
    reviewMode, reviewIndex, solutionMoves, playerMoves,
    enterReviewMode, reviewStep, retryPuzzle,
    // History
    puzzleHistory, historyLoading, loadPuzzleHistory,
    ratingHistory, ratingHistoryLoading, loadRatingHistory,
  } = usePuzzleStore();

  const [lastMoveFrom, setLastMoveFrom] = useState(null);
  const [lastMoveTo,   setLastMoveTo]   = useState(null);
  const [feedback,     setFeedback]     = useState(null);
  const [copied,       setCopied]       = useState(false);

  // Load first puzzle on mount and when user changes
  const initRef = useRef(false);
  useEffect(() => {
    if (mode === 'rated' && (status === 'idle' || status === 'empty' || status === 'error' || !initRef.current)) {
      initRef.current = true;
      loadNextPuzzle(user?.id);
    }
  }, [user?.id, mode]); // eslint-disable-line

  // Load daily puzzle when switching to daily mode
  useEffect(() => {
    if (mode === 'daily' && !dailyPuzzle) {
      loadDailyPuzzle(user?.id);
    }
  }, [mode]); // eslint-disable-line

  // Load history and rating chart data when user is present
  useEffect(() => {
    if (user?.id && mode === 'rated') {
      loadPuzzleHistory(user.id);
      loadRatingHistory(user.id);
    }
  }, [user?.id, mode]); // eslint-disable-line

  // Cleanup rush timer on unmount
  useEffect(() => {
    return () => stopRushTimer();
  }, []); // eslint-disable-line

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (reviewMode) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); reviewStep(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); reviewStep(1); }
      }
      if (e.key === 'r' && (status === 'solved' || status === 'failed')) {
        retryPuzzle();
      }
      if (e.key === 'n' && (status === 'solved' || status === 'failed')) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewMode, status]); // eslint-disable-line

  const onMove = useCallback(async (uci) => {
    clearHint();
    setLastMoveFrom([rankToRow(uci[1]), fileToCol(uci[0])]);
    setLastMoveTo([rankToRow(uci[3]), fileToCol(uci[2])]);

    const result = await handlePlayerMove(uci, user?.id);
    if (result.correct) {
      // Play appropriate sound
      if (uci.length > 4) playSound('promote');
      else playSound('move');
      setFeedback('correct');
      if (result.solved) {
        setTimeout(() => setFeedback(null), 1200);
      } else {
        setTimeout(() => setFeedback(null), 400);
      }
    } else {
      playSound('illegal');
      setLastMoveFrom(null);
      setLastMoveTo(null);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [handlePlayerMove, user?.id, clearHint]);

  const handleNext = () => {
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setFeedback(null);
    if (mode === 'themes' && selectedTheme) {
      loadByTheme(selectedTheme, user?.id);
    } else {
      loadNextPuzzle(user?.id);
    }
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

  const handleThemeSelect = (theme) => {
    if (theme) {
      loadByTheme(theme, user?.id);
    }
  };

  const handleDifficultyChange = (level) => {
    loadByDifficulty(level, user?.id);
  };

  const handleShare = () => {
    if (!puzzle) return;
    const url = `${window.location.origin}${window.location.pathname}?puzzleId=${puzzle.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReviewJump = (index) => {
    if (reviewMode) reviewStep(index - reviewIndex);
  };

  const handleRetry = () => {
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setFeedback(null);
    retryPuzzle();
  };

  const puzzleRating = userPuzzleRating?.rating || 1500;
  const totalMoves = puzzle?.moves?.length || 0;
  const isFinished = status === 'solved' || status === 'failed';

  // Determine board interactivity — not interactive during review
  const boardStatus = reviewMode ? 'review' : status;

  return (
    <div className={styles.page}>
      {/* ── Board column ── */}
      <div className={styles.boardCol}>
        {/* Mode tabs */}
        <div className={styles.modeTabs}>
          {['daily', 'rated', 'themes', 'rush', 'streak'].map(m => (
            <button
              key={m}
              className={`${styles.modeTab} ${mode === m ? styles.modeTabActive : ''}`}
              onClick={() => handleModeChange(m)}
            >
              {m === 'daily' ? 'Daily' : m === 'rated' ? 'Rated' : m === 'themes' ? 'Themes' : m === 'rush' ? 'Rush' : 'Streak'}
            </button>
          ))}
        </div>

        {/* Turn indicator / status */}
        <div className={styles.turnBar}>
          {status === 'playing' && !reviewMode && (
            <>
              <span className={`${styles.turnDot} ${playerColor === 'w' ? styles.dotW : styles.dotB}`} />
              <span>{playerColor === 'w' ? 'White' : 'Black'} to move</span>
              {wrongAttempt && (
                <span className={styles.feedbackFailed} style={{marginLeft: 8, fontSize: '0.85rem'}}>
                  Incorrect -- try again ({attempts} {attempts === 1 ? 'attempt' : 'attempts'})
                </span>
              )}
            </>
          )}
          {reviewMode && <span className={styles.turnHint}>Review mode (arrow keys to navigate)</span>}
          {status === 'loading' && <span className={styles.turnHint}>Loading puzzle...</span>}
          {status === 'idle' && mode === 'rated' && <span className={styles.turnHint}>Press "New Puzzle" to start</span>}
          {status === 'idle' && mode === 'daily' && <span className={styles.turnHint}>Today's puzzle awaits</span>}
          {status === 'idle' && mode === 'themes' && <span className={styles.turnHint}>Select a theme to begin</span>}
          {status === 'idle' && mode === 'rush' && <span className={styles.turnHint}>Choose a time and start!</span>}
          {status === 'idle' && mode === 'streak' && <span className={styles.turnHint}>Start your streak!</span>}
          {status === 'empty'  && <span className={styles.turnHint}>No puzzles available</span>}
          {status === 'error'  && <span className={styles.feedbackFailed}>{errorMsg || 'Error loading puzzle'}</span>}
          {status === 'solved' && !reviewMode && <span className={styles.feedbackSolved}>Puzzle solved!</span>}
          {status === 'failed' && !reviewMode && <span className={styles.feedbackFailed}>Incorrect -- try next</span>}
          {status === 'rush_over' && <span className={styles.feedbackFailed}>Rush Over!</span>}
          {status === 'streak_over' && <span className={styles.feedbackFailed}>Streak Over!</span>}
        </div>

        {/* Feedback flash */}
        {feedback === 'correct' && <div className={styles.flash + ' ' + styles.flashCorrect}>+1</div>}
        {feedback === 'wrong'   && <div className={styles.flash + ' ' + styles.flashWrong}>X</div>}

        {currentFen && status !== 'loading'
          ? <PuzzleBoard
              fen={currentFen}
              playerColor={playerColor}
              onMove={onMove}
              status={boardStatus}
              lastMoveFrom={lastMoveFrom}
              lastMoveTo={lastMoveTo}
              hintSquare={hintSquare}
              moveIndex={moveIndex}
              totalMoves={totalMoves}
            />
          : (
            <div className={styles.loadingBoard}>
              <div className={styles.loadingPulse} />
              <div className={styles.loadingText}>
                {status === 'loading' ? 'Analyzing position...' : 'Select a mode to begin'}
              </div>
            </div>
          )
        }

        {/* Move list below board */}
        {puzzle && solutionMoves.length > 0 && (
          <MoveList
            solutionMoves={solutionMoves}
            playerMoves={playerMoves}
            moveIndex={moveIndex}
            reviewMode={reviewMode}
            reviewIndex={reviewIndex}
            onReviewJump={handleReviewJump}
            status={status}
          />
        )}
      </div>

      {/* ── Panel column ── */}
      <div className={styles.panel}>

        {/* ── Daily mode panel ── */}
        {mode === 'daily' && (
          <>
            <DailyPuzzle
              dailyPuzzle={dailyPuzzle}
              dailySolved={dailySolved}
              onPlay={() => loadDailyPuzzle(user?.id)}
              loading={status === 'loading'}
            />
            {puzzle && (status === 'playing' || isFinished) && (
              <>
                <div className={styles.actions}>
                  {status === 'playing' && (
                    <>
                      <button className={styles.hintBtn} onClick={getHint} disabled={hintUsed}>
                        {hintUsed ? 'Hint Used' : 'Hint'}
                      </button>
                      <button className={styles.skipBtn} onClick={() => giveUp(user?.id)}>Give Up</button>
                    </>
                  )}
                  {isFinished && (
                    <>
                      <button className={styles.nextBtn} onClick={() => enterReviewMode()}>
                        {reviewMode ? 'Reviewing...' : 'Review Solution'}
                      </button>
                      {reviewMode && (
                        <div className={styles.reviewControls}>
                          <button className={styles.reviewBtn} onClick={() => reviewStep(-1)} disabled={reviewIndex <= 0}>&#9664;</button>
                          <span className={styles.reviewLabel}>{reviewIndex}/{solutionMoves.length}</span>
                          <button className={styles.reviewBtn} onClick={() => reviewStep(1)} disabled={reviewIndex >= solutionMoves.length}>&#9654;</button>
                        </div>
                      )}
                      <button className={styles.skipBtn} onClick={handleRetry}>Retry</button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

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
                {puzzle.opening_tags && (
                  <span className={styles.openingTag}>
                    {puzzle.opening_tags.replace(/_/g, ' ').split(' ').slice(0, 3).join(' ')}
                  </span>
                )}
              </div>
            )}

            {/* Difficulty selector */}
            <div className={styles.difficultyRow}>
              {['easy', 'medium', 'hard'].map(lvl => (
                <button
                  key={lvl}
                  className={`${styles.diffBtn} ${styles[`diffBtn${lvl.charAt(0).toUpperCase() + lvl.slice(1)}`]} ${difficultyLevel === lvl ? styles.diffBtnActive : ''}`}
                  onClick={() => handleDifficultyChange(lvl)}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>

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
              {isFinished && (
                <>
                  <div className={styles.actionRow}>
                    <button className={styles.nextBtn} onClick={handleNext}>Next Puzzle</button>
                    <button className={styles.skipBtn} onClick={handleRetry}>Retry</button>
                  </div>
                  <button className={styles.skipBtn} onClick={() => enterReviewMode()}>
                    {reviewMode ? 'Reviewing...' : 'Review Solution'}
                  </button>
                  {reviewMode && (
                    <div className={styles.reviewControls}>
                      <button className={styles.reviewBtn} onClick={() => reviewStep(-1)} disabled={reviewIndex <= 0}>&#9664;</button>
                      <span className={styles.reviewLabel}>{reviewIndex}/{solutionMoves.length}</span>
                      <button className={styles.reviewBtn} onClick={() => reviewStep(1)} disabled={reviewIndex >= solutionMoves.length}>&#9654;</button>
                    </div>
                  )}
                </>
              )}
              {status === 'playing' && (
                <>
                  <button className={styles.hintBtn} onClick={getHint} disabled={hintUsed}>
                    {hintUsed ? 'Hint Used' : 'Hint (-rating)'}
                  </button>
                  <button className={styles.skipBtn} onClick={() => giveUp(user?.id)}>Give Up</button>
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

            {/* Share */}
            {puzzle && (
              <div style={{textAlign: 'center'}}>
                <button className={styles.shareBtn} onClick={handleShare}>
                  {copied ? <span className={styles.copiedToast}>Copied!</span> : 'Share Puzzle'}
                </button>
              </div>
            )}

            {/* Expandable sections */}
            <PuzzleHistory
              history={puzzleHistory}
              loading={historyLoading}
              onSelectPuzzle={() => {}}
            />
            <RatingChart
              ratingHistory={ratingHistory}
              loading={ratingHistoryLoading}
            />
          </>
        )}

        {/* ── Themes mode panel ── */}
        {mode === 'themes' && (
          <>
            {!selectedTheme || status === 'idle' ? (
              <ThemePicker
                selectedTheme={selectedTheme}
                onSelectTheme={handleThemeSelect}
              />
            ) : (
              <>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>
                    {selectedTheme?.replace(/([A-Z])/g, ' $1').trim() || 'Theme Training'}
                  </span>
                  <button className={styles.shareBtn} onClick={() => setMode('themes')}>
                    Change Theme
                  </button>
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

                <div className={styles.actions}>
                  {isFinished && (
                    <>
                      <div className={styles.actionRow}>
                        <button className={styles.nextBtn} onClick={handleNext}>Next Puzzle</button>
                        <button className={styles.skipBtn} onClick={handleRetry}>Retry</button>
                      </div>
                      <button className={styles.skipBtn} onClick={() => enterReviewMode()}>
                        {reviewMode ? 'Reviewing...' : 'Review Solution'}
                      </button>
                      {reviewMode && (
                        <div className={styles.reviewControls}>
                          <button className={styles.reviewBtn} onClick={() => reviewStep(-1)} disabled={reviewIndex <= 0}>&#9664;</button>
                          <span className={styles.reviewLabel}>{reviewIndex}/{solutionMoves.length}</span>
                          <button className={styles.reviewBtn} onClick={() => reviewStep(1)} disabled={reviewIndex >= solutionMoves.length}>&#9654;</button>
                        </div>
                      )}
                    </>
                  )}
                  {status === 'playing' && (
                    <>
                      <button className={styles.hintBtn} onClick={getHint} disabled={hintUsed}>
                        {hintUsed ? 'Hint Used' : 'Hint'}
                      </button>
                      <button className={styles.skipBtn} onClick={() => giveUp(user?.id)}>Give Up</button>
                    </>
                  )}
                  {status === 'loading' && (
                    <button className={styles.nextBtn} disabled>Loading...</button>
                  )}
                </div>
              </>
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
