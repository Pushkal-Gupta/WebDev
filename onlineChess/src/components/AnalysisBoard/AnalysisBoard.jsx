import { useState, useEffect, useRef } from 'react';
import Board from '../Board/Board';
import styles from './AnalysisBoard.module.css';
import useGameStore from '../../store/gameStore';
import { getPositionScore } from '../../utils/localAI';
import { Chess } from 'chess.js';
import { CLASSIFICATIONS, reviewGame } from '../../utils/reviewEngine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function evalToWhitePct(score) {
  if (score > 9000) return 99;
  if (score < -9000) return 1;
  const pct = 50 + 50 * Math.tanh(score / 400);
  return Math.max(1, Math.min(99, pct));
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

const ACC_WEIGHTS = { brilliant: 100, best: 100, good: 85, inaccuracy: 65, mistake: 40, blunder: 10 };

function calcAccuracy(reviewResults, moveHistory, color) {
  if (!reviewResults || !moveHistory.length) return null;
  const playerResults = reviewResults.filter((_, i) => moveHistory[i]?.color === color);
  if (!playerResults.length) return null;
  const sum = playerResults.reduce((s, r) => s + (ACC_WEIGHTS[r.classification] ?? 50), 0);
  return Math.round(sum / playerResults.length);
}

function buildPlayerCounts(reviewResults, moveHistory, color) {
  if (!reviewResults) return {};
  const counts = {};
  reviewResults.forEach((r, i) => {
    if (moveHistory[i]?.color !== color) return;
    counts[r.classification] = (counts[r.classification] || 0) + 1;
  });
  return counts;
}

// ── Eval Graph ────────────────────────────────────────────────────────────────

function EvalGraph({ data, currentIdx, onSeek }) {
  const W = 400;
  const H = 56;
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

  // White area (above center)
  const whiteFillD = pathD
    ? `${pathD} L ${pts[pts.length - 1][0].toFixed(1)},${H / 2} L ${pts[0][0].toFixed(1)},${H / 2} Z`
    : null;
  // Black area (below center)
  const blackFillD = pathD
    ? `${pathD} L ${pts[pts.length - 1][0].toFixed(1)},${H / 2} L ${pts[0][0].toFixed(1)},${H / 2} Z`
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
      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.2)" />
      {/* White region (upper half) */}
      <rect x={0} y={0} width={W} height={H / 2} fill="rgba(255,255,255,0.03)" />
      {/* Center line */}
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
      {/* White advantage fill */}
      {whiteFillD && (
        <clipPath id="upperHalf">
          <rect x={0} y={0} width={W} height={H / 2} />
        </clipPath>
      )}
      {whiteFillD && <path d={whiteFillD} fill="rgba(230,230,230,0.18)" clipPath="url(#upperHalf)" />}
      {/* Black advantage fill */}
      {blackFillD && (
        <clipPath id="lowerHalf">
          <rect x={0} y={H / 2} width={W} height={H / 2} />
        </clipPath>
      )}
      {blackFillD && <path d={blackFillD} fill="rgba(30,30,30,0.4)" clipPath="url(#lowerHalf)" />}
      {/* Eval line */}
      {pathD && (
        <path d={pathD} fill="none" stroke="rgba(0,255,245,0.7)" strokeWidth={1.5} strokeLinejoin="round" />
      )}
      {/* Current position marker */}
      {curX !== null && (
        <line
          x1={curX} y1={pad}
          x2={curX} y2={H - pad}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
      {/* Current position dot */}
      {curX !== null && currentIdx >= 0 && currentIdx < data.length && (
        <circle
          cx={curX}
          cy={evalToY(data[currentIdx])}
          r={2.5}
          fill="#00fff5"
        />
      )}
    </svg>
  );
}

// ── Accuracy Bar ─────────────────────────────────────────────────────────────

function AccuracyRow({ color, name, accuracy, counts }) {
  const acc = accuracy ?? '—';
  const accColor = accuracy >= 85 ? '#3ddc84' : accuracy >= 65 ? '#f0c94c' : '#e05555';
  return (
    <div className={styles.accRow}>
      <div className={styles.accLeft}>
        <span className={`${styles.accDot} ${color === 'w' ? styles.accDotW : styles.accDotB}`} />
        <span className={styles.accName}>{name}</span>
      </div>
      <div className={styles.accRight}>
        {accuracy !== null && (
          <span className={styles.accPct} style={{ color: accColor }}>{acc}%</span>
        )}
        <div className={styles.accBadges}>
          {Object.entries(CLASSIFICATIONS).map(([key, cls]) => {
            const count = counts?.[key];
            if (!count) return null;
            return (
              <span key={key} className={styles.accBadge} title={`${cls.label}: ${count}`}>
                <span style={{ color: cls.color }}>{cls.symbol}</span>
                <span className={styles.accBadgeCount}>{count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
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
  const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 });
  const [pgnInput, setPgnInput]           = useState('');
  const [showPgnInput, setShowPgnInput]   = useState(false);
  const [gameLoaded, setGameLoaded]       = useState(false);
  const [evalHistory, setEvalHistory]     = useState([]);   // white-relative score per move idx
  const [pgnHeaders, setPgnHeaders]       = useState({});   // { White, Black, Event, Opening }

  const evalTimerRef = useRef(null);
  const moveListRef  = useRef(null);

  // Keep board non-interactive during analysis
  useEffect(() => {
    if (gameLoaded) setDisableBoard(true);
  }, [gameLoaded, currentMoveIndex]);

  // Load PGN headers on game load
  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;
    try {
      const h = chessInstance.header?.() || {};
      setPgnHeaders(h);
    } catch {
      setPgnHeaders({});
    }
    // Reset eval history on new game
    setEvalHistory([]);
  }, [gameLoaded]);

  // Compute engine lines + track eval history when position changes
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
        const evalScore = lines.length > 0 ? lines[0].score : getPositionScore(fen, 1);

        setEngineLines(lines);
        setCurrentEval(evalScore);

        // Store eval at this index for the graph
        if (currentMoveIndex >= 0) {
          setEvalHistory(prev => {
            const next = [...prev];
            next[currentMoveIndex] = evalScore;
            return next;
          });
        }
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
    setReviewProgress({ current: 0, total: moveHistory.length });
    try {
      const results = await reviewGame(moveHistory, (current, total) => {
        setReviewProgress({ current, total });
      });
      setReviewResults(results);
    } finally {
      setIsReviewing(false);
      setReviewProgress({ current: 0, total: 0 });
    }
  };

  const handleBackToGames = () => {
    setGameLoaded(false);
    setReviewResults(null);
    setEngineLines([]);
    setCurrentEval(0);
    setEvalHistory([]);
    setPgnHeaders({});
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

  // Eval graph data — white-relative scores from evalHistory or reviewResults
  const graphData = (() => {
    if (reviewResults && reviewResults.length) {
      return reviewResults.map((r, i) => {
        const isWhite = moveHistory[i]?.color === 'w';
        return isWhite ? r.playedScore : -r.playedScore;
      });
    }
    // Live evals from navigation history
    if (evalHistory.some(v => v !== undefined)) {
      const out = [];
      for (let i = 0; i < moveHistory.length; i++) {
        if (evalHistory[i] !== undefined) out.push(evalHistory[i]);
        else break; // stop at first gap
      }
      return out.length > 1 ? out : [];
    }
    return [];
  })();

  const whitePct = evalToWhitePct(currentEval);

  // Player data
  const whitePlayerName = pgnHeaders.White || 'White';
  const blackPlayerName = pgnHeaders.Black || 'Black';
  const openingName     = pgnHeaders.Opening || pgnHeaders.ECO || null;

  const topName    = flipped ? whitePlayerName : blackPlayerName;
  const bottomName = flipped ? blackPlayerName : whitePlayerName;
  const topColor   = flipped ? 'w' : 'b';
  const botColor   = flipped ? 'b' : 'w';

  const whiteAcc   = calcAccuracy(reviewResults, moveHistory, 'w');
  const blackAcc   = calcAccuracy(reviewResults, moveHistory, 'b');
  const topAcc     = topColor === 'w' ? whiteAcc : blackAcc;
  const botAcc     = botColor === 'w' ? whiteAcc : blackAcc;
  const whiteCounts = buildPlayerCounts(reviewResults, moveHistory, 'w');
  const blackCounts = buildPlayerCounts(reviewResults, moveHistory, 'b');

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
        <div className={styles.titleGroup}>
          <span className={styles.title}>Analysis</span>
          {openingName && <span className={styles.opening}>{openingName}</span>}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} onClick={() => setFlipped(!flipped)}>⇅</button>
          <button
            className={`${styles.headerBtn} ${reviewResults ? styles.headerBtnDone : ''}`}
            onClick={handleReview}
            disabled={isReviewing || !moveHistory.length}
          >
            {isReviewing
              ? `${reviewProgress.current}/${reviewProgress.total}`
              : reviewResults ? '✓ Re-review' : 'Review'}
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

      {/* Review progress bar */}
      {isReviewing && reviewProgress.total > 0 && (
        <div className={styles.reviewBar}>
          <span className={styles.reviewLabel}>
            Analysing… {reviewProgress.current}/{reviewProgress.total}
          </span>
          <div className={styles.reviewProgressWrap}>
            <div
              className={styles.reviewProgressFill}
              style={{ width: `${(reviewProgress.current / reviewProgress.total) * 100}%` }}
            />
          </div>
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
          {/* Top player */}
          <div className={`${styles.playerBar} ${styles.playerBarTop}`}>
            <div className={styles.playerInfo}>
              <span className={`${styles.playerDot} ${topColor === 'w' ? styles.playerDotW : styles.playerDotB}`} />
              <span className={styles.playerName}>{topName}</span>
            </div>
            {topAcc !== null && (
              <span
                className={styles.playerAccuracy}
                style={{ color: topAcc >= 85 ? '#3ddc84' : topAcc >= 65 ? '#f0c94c' : '#e05555' }}
              >
                {topAcc}%
              </span>
            )}
          </div>

          <div className={styles.boardWrap}>
            <Board />
          </div>

          {/* Bottom player */}
          <div className={`${styles.playerBar} ${styles.playerBarBottom}`}>
            <div className={styles.playerInfo}>
              <span className={`${styles.playerDot} ${botColor === 'w' ? styles.playerDotW : styles.playerDotB}`} />
              <span className={styles.playerName}>{bottomName}</span>
            </div>
            {botAcc !== null && (
              <span
                className={styles.playerAccuracy}
                style={{ color: botAcc >= 85 ? '#3ddc84' : botAcc >= 65 ? '#f0c94c' : '#e05555' }}
              >
                {botAcc}%
              </span>
            )}
          </div>

          {/* Eval graph */}
          {graphData.length > 1 && (
            <div className={styles.evalGraphWrap}>
              <EvalGraph
                data={graphData}
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

          {/* Per-player accuracy (after review) */}
          {reviewResults && (
            <div className={styles.accuracySection}>
              <div className={styles.accuracySectionTitle}>Accuracy</div>
              <AccuracyRow
                color={topColor}
                name={topName}
                accuracy={topColor === 'w' ? whiteAcc : blackAcc}
                counts={topColor === 'w' ? whiteCounts : blackCounts}
              />
              <AccuracyRow
                color={botColor}
                name={bottomName}
                accuracy={botColor === 'w' ? whiteAcc : blackAcc}
                counts={botColor === 'w' ? whiteCounts : blackCounts}
              />
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
