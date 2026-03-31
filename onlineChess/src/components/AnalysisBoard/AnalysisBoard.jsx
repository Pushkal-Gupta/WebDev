import { useState, useEffect, useRef } from 'react';
import Board from '../Board/Board';
import styles from './AnalysisBoard.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';
import { getPositionScore } from '../../utils/localAI';
import { Chess } from 'chess.js';
import { CLASSIFICATIONS, reviewGame } from '../../utils/reviewEngine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function evalToWhitePct(score) {
  if (score > 9000) return 99;
  if (score < -9000) return 1;
  return 50 + 50 * Math.tanh(score / 400);
}

function formatEval(score) {
  if (score > 9000) return 'M';
  if (score < -9000) return '-M';
  return (score >= 0 ? '+' : '') + (score / 100).toFixed(1);
}

// Returns top-n candidate moves with scores (shallow, single-ply look-ahead)
function getTopMoves(fen, n = 3) {
  try {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return [];
    const moves = chess.moves({ verbose: true });
    if (!moves.length) return [];
    const isMax = chess.turn() === 'w';
    const scored = moves.map(m => {
      chess.move(m);
      const score = getPositionScore(chess.fen(), 1);
      chess.undo();
      return { san: m.san, from: m.from, to: m.to, score };
    });
    scored.sort((a, b) => isMax ? b.score - a.score : a.score - b.score);
    return scored.slice(0, n);
  } catch {
    return [];
  }
}

// Build accuracy summary counts from reviewResults
function buildAccSummary(reviewResults) {
  if (!reviewResults) return null;
  const counts = {};
  reviewResults.forEach(r => {
    counts[r.classification] = (counts[r.classification] || 0) + 1;
  });
  return counts;
}

// ── Eval Graph ────────────────────────────────────────────────────────────────

function EvalGraph({ data, currentIdx, onSeek }) {
  const W = 400;
  const H = 52;
  const pad = 1;
  const usableW = W - pad * 2;
  const usableH = H - pad * 2;

  const evalToY = (score) => {
    const pct = evalToWhitePct(score) / 100;
    return pad + usableH * (1 - pct);
  };

  const pts = data.map((score, i) => {
    const x = data.length > 1 ? pad + (i / (data.length - 1)) * usableW : W / 2;
    return [x, evalToY(score)];
  });

  const pathD = pts.length > 1
    ? 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ')
    : null;

  const fillD = pathD
    ? `${pathD} L ${pts[pts.length - 1][0].toFixed(1)},${H} L ${pts[0][0].toFixed(1)},${H} Z`
    : null;

  const curX = currentIdx >= 0 && currentIdx < data.length
    ? pts[currentIdx][0]
    : null;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (data.length - 1));
    onSeek(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <svg
      className={styles.evalGraph}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      onClick={handleClick}
      title="Click to jump to that position"
    >
      {/* BG halves */}
      <rect x={0} y={0} width={W} height={H / 2} fill="rgba(255,255,255,0.03)" />
      <rect x={0} y={H / 2} width={W} height={H / 2} fill="rgba(0,0,0,0.12)" />
      {/* Zero line */}
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />
      {/* Filled area */}
      {fillD && <path d={fillD} fill="rgba(0,255,245,0.07)" />}
      {/* Eval path */}
      {pathD && (
        <path d={pathD} fill="none" stroke="rgba(0,255,245,0.65)" strokeWidth={1.5} strokeLinejoin="round" />
      )}
      {/* Current position marker */}
      {curX !== null && (
        <line
          x1={curX} y1={pad}
          x2={curX} y2={H - pad}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalysisBoard({ savedGames = [], gamesLoading = false }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    chessInstance, importPgn, setDisableBoard, flipped, setFlipped,
  } = useGameStore();

  const [currentEval, setCurrentEval]     = useState(0);
  const [engineLines, setEngineLines]     = useState([]);
  const [engineBusy, setEngineBusy]       = useState(false);
  const [reviewResults, setReviewResults] = useState(null);
  const [isReviewing, setIsReviewing]     = useState(false);
  const [pgnInput, setPgnInput]           = useState('');
  const [showPgnInput, setShowPgnInput]   = useState(false);
  const [gameLoaded, setGameLoaded]       = useState(false);

  const evalTimerRef = useRef(null);
  const moveListRef  = useRef(null);

  // Keep board non-interactive during analysis
  useEffect(() => {
    if (gameLoaded) setDisableBoard(true);
  }, [gameLoaded, currentMoveIndex]);

  // Compute engine lines when position changes
  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;

    if (evalTimerRef.current) clearTimeout(evalTimerRef.current);
    setEngineBusy(true);

    evalTimerRef.current = setTimeout(() => {
      try {
        const fen = currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
          ? moveHistory[currentMoveIndex].fen
          : chessInstance.fen();

        const lines = getTopMoves(fen, 3);
        setEngineLines(lines);
        setCurrentEval(lines.length > 0 ? lines[0].score : getPositionScore(fen, 1));
      } catch {
        // ignore
      } finally {
        setEngineBusy(false);
      }
    }, 200);

    return () => clearTimeout(evalTimerRef.current);
  }, [currentMoveIndex, gameLoaded, chessInstance]);

  // Auto-scroll move list to active move
  useEffect(() => {
    if (!moveListRef.current) return;
    const el = moveListRef.current.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMoveIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!gameLoaded) return;
    const onKey = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft')  goToMove(currentMoveIndex - 1);
      else if (e.key === 'ArrowRight') goToMove(currentMoveIndex + 1);
      else if (e.key === 'ArrowUp')    goToMove(-1);
      else if (e.key === 'ArrowDown')  goToMove(moveHistory.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameLoaded, currentMoveIndex, moveHistory.length]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLoadPgn = () => {
    if (!pgnInput.trim()) return;
    const ok = importPgn(pgnInput.trim());
    if (ok) {
      setGameLoaded(true);
      setReviewResults(null);
      setShowPgnInput(false);
      setPgnInput('');
      setDisableBoard(true);
    }
  };

  const handleLoadGame = (game) => {
    if (!game.pgnStr) return;
    const ok = importPgn(game.pgnStr);
    if (ok) {
      setGameLoaded(true);
      setReviewResults(null);
      setDisableBoard(true);
    }
  };

  const handleReview = async () => {
    if (!moveHistory.length) return;
    setIsReviewing(true);
    setReviewResults(null);
    try {
      const results = await reviewGame(moveHistory, () => {});
      setReviewResults(results);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleBackToGames = () => {
    setGameLoaded(false);
    setReviewResults(null);
    setEngineLines([]);
    setCurrentEval(0);
  };

  // ── Build move table ─────────────────────────────────────────────────────────

  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({
      number:   Math.floor(i / 2) + 1,
      white:    moveHistory[i],       whiteIdx: i,
      black:    moveHistory[i + 1] || null, blackIdx: i + 1,
    });
  }

  // Eval graph data — white-relative score at each move
  const evalGraph = reviewResults
    ? reviewResults.map((r, i) => {
        const isWhite = moveHistory[i]?.color === 'w';
        return isWhite ? r.playedScore : -r.playedScore;
      })
    : [];

  const whitePct  = evalToWhitePct(currentEval);
  const accSummary = buildAccSummary(reviewResults);

  // ── Games list (no game loaded) ──────────────────────────────────────────────

  if (!gameLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>Game Analysis</span>
          <div className={styles.headerActions}>
            <button className={styles.headerBtn} onClick={() => setShowPgnInput(v => !v)}>
              {showPgnInput ? 'Cancel' : 'Load PGN'}
            </button>
          </div>
        </div>

        {showPgnInput && (
          <div className={styles.pgnInputArea}>
            <textarea
              className={styles.pgnTextarea}
              value={pgnInput}
              onChange={e => setPgnInput(e.target.value)}
              placeholder="Paste PGN here…"
              rows={5}
            />
            <button className={styles.loadBtn} onClick={handleLoadPgn}>Analyse →</button>
          </div>
        )}

        <div className={styles.gamesList}>
          {gamesLoading && <p className={styles.empty}>Loading games…</p>}
          {!gamesLoading && savedGames.length === 0 && !showPgnInput && (
            <p className={styles.empty}>No saved games yet. Play some, or load a PGN above.</p>
          )}
          {savedGames.map((game, i) => (
            <div key={i} className={styles.gameCard} onClick={() => handleLoadGame(game)}>
              <div className={styles.gameCardTop}>
                <span className={`${styles.colorDot} ${game.color === 'white' ? styles.white : styles.black}`} />
                <span className={styles.gameVs}>
                  {game.color === 'white' ? 'You (W)' : 'You (B)'} vs {game.opponent || 'Opponent'}
                </span>
                {game.result && (
                  <span className={`${styles.resultBadge} ${styles[game.result]}`}>{game.result}</span>
                )}
              </div>
              <div className={styles.gamePgn}>{(game.pgnStr || '').slice(0, 72)}…</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Analysis view (game loaded) ──────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBackToGames}>← Games</button>
        <span className={styles.title}>Analysis</span>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} onClick={() => setFlipped(!flipped)}>⇅ Flip</button>
          <button
            className={styles.headerBtn}
            onClick={handleReview}
            disabled={isReviewing || !moveHistory.length}
          >
            {isReviewing ? 'Reviewing…' : reviewResults ? '✓ Re-Review' : 'Review'}
          </button>
          <button className={styles.headerBtn} onClick={() => setShowPgnInput(v => !v)}>PGN</button>
        </div>
      </div>

      {/* PGN import */}
      {showPgnInput && (
        <div className={styles.pgnInputArea}>
          <textarea
            className={styles.pgnTextarea}
            value={pgnInput}
            onChange={e => setPgnInput(e.target.value)}
            placeholder="Paste PGN to load a new game…"
            rows={4}
          />
          <button className={styles.loadBtn} onClick={handleLoadPgn}>Load</button>
        </div>
      )}

      {/* Review progress */}
      {isReviewing && (
        <div className={styles.reviewBar}>
          <span className={styles.reviewLabel}>Analysing moves…</span>
          <div className={styles.reviewSpinner} />
        </div>
      )}

      {/* Main layout */}
      <div className={styles.analysisLayout}>
        {/* ── Eval bar ── */}
        <div className={styles.evalBarWrap}>
          <div className={styles.evalBarWhite} style={{ height: `${whitePct}%` }} />
          <div className={styles.evalBarBlack} />
          <span
            className={styles.evalScore}
            style={{
              top:    whitePct >= 55 ? 'auto' : '4px',
              bottom: whitePct >= 55 ? '4px'  : 'auto',
              color:  whitePct >= 55 ? '#333' : '#bbb',
            }}
          >
            {formatEval(currentEval)}
          </span>
        </div>

        {/* ── Board column ── */}
        <div className={styles.boardColumn}>
          <div className={styles.boardWrap}>
            <Board />
          </div>

          {/* Eval graph */}
          {evalGraph.length > 1 && (
            <div className={styles.evalGraphWrap}>
              <EvalGraph
                data={evalGraph}
                currentIdx={currentMoveIndex}
                onSeek={goToMove}
              />
            </div>
          )}

          {/* Navigation */}
          <div className={styles.navRow}>
            <button className={styles.navBtn} title="Start (↑)" onClick={() => goToMove(-1)}>⏮</button>
            <button className={styles.navBtn} title="Prev (←)" onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex < 0}>◀</button>
            <button className={styles.navBtn} title="Next (→)" onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moveHistory.length - 1}>▶</button>
            <button className={styles.navBtn} title="End (↓)" onClick={() => goToMove(moveHistory.length - 1)}>⏭</button>
          </div>
          <div className={styles.kbdHint}>← → arrow keys to navigate</div>
        </div>

        {/* ── Right panel ── */}
        <div className={styles.rightPanel}>
          {/* Engine lines */}
          <div className={styles.enginePanel}>
            <div className={styles.engineTitle}>Engine</div>
            {engineBusy && <div className={styles.engineComputing}>Computing…</div>}
            {!engineBusy && engineLines.map((line, i) => {
              const evalClass = line.score > 20 ? styles.lineEvalPos
                : line.score < -20 ? styles.lineEvalNeg
                : styles.lineEvalNeut;
              return (
                <div key={i} className={styles.engineLine}>
                  <span className={styles.lineRank}>{i + 1}.</span>
                  <span className={`${styles.lineEval} ${evalClass}`}>{formatEval(line.score)}</span>
                  <span className={styles.lineMove}>{line.san}</span>
                </div>
              );
            })}
            {!engineBusy && engineLines.length === 0 && (
              <div className={styles.engineComputing}>Game over</div>
            )}
          </div>

          {/* Accuracy summary */}
          {accSummary && (
            <div className={styles.accuracySummary}>
              {Object.entries(CLASSIFICATIONS).map(([key, cls]) => {
                const count = accSummary[key] || 0;
                if (!count) return null;
                return (
                  <span key={key} className={styles.accItem} title={cls.label}>
                    <span className={styles.accSymbol} style={{ color: cls.color }}>{cls.symbol}</span>
                    <span className={styles.accCount}>{count}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Move list */}
          <div className={styles.moveList} ref={moveListRef}>
            {moveRows.map(row => {
              const wReview = reviewResults?.[row.whiteIdx];
              const bReview = row.black ? reviewResults?.[row.blackIdx] : null;
              const wClass  = wReview ? CLASSIFICATIONS[wReview.classification] : null;
              const bClass  = bReview ? CLASSIFICATIONS[bReview.classification] : null;

              return (
                <div key={row.number} className={styles.moveRow}>
                  <span className={styles.moveNum}>{row.number}.</span>

                  <span
                    data-active={currentMoveIndex === row.whiteIdx ? 'true' : 'false'}
                    className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveActive : ''}`}
                    onClick={() => goToMove(row.whiteIdx)}
                  >
                    {row.white?.san || ''}
                    {wClass && (
                      <sup className={styles.moveBadge} style={{ color: wClass.color }} title={wClass.label}>
                        {wClass.symbol}
                      </sup>
                    )}
                  </span>

                  <span
                    data-active={row.black && currentMoveIndex === row.blackIdx ? 'true' : 'false'}
                    className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveActive : ''}`}
                    onClick={() => row.black && goToMove(row.blackIdx)}
                  >
                    {row.black?.san || ''}
                    {bClass && (
                      <sup className={styles.moveBadge} style={{ color: bClass.color }} title={bClass.label}>
                        {bClass.symbol}
                      </sup>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
