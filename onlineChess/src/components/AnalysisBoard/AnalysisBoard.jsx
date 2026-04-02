import { useState, useEffect, useRef, useId } from 'react';
import Board from '../Board/Board';
import styles from './AnalysisBoard.module.css';
import useGameStore from '../../store/gameStore';
import { getPositionScore, getLocalBestMoveWithScore } from '../../utils/localAI';
import { Chess } from 'chess.js';
import { CLASSIFICATIONS, reviewGame } from '../../utils/reviewEngine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function evalToWhitePct(score) {
  if (score > 9000) return 99;
  if (score < -9000) return 1;
  return Math.max(1, Math.min(99, 50 + 50 * Math.tanh(score / 400)));
}

function formatEval(score) {
  if (score > 9000) return 'M';
  if (score < -9000) return '-M';
  return (score >= 0 ? '+' : '') + (score / 100).toFixed(1);
}

// Build top-N engine lines with 3-move PV each (depth 2 eval + continuation)
function getTopLines(fen, n = 3) {
  try {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return [];
    const moves = chess.moves({ verbose: true });
    if (!moves.length) return [];
    const isMax = chess.turn() === 'w';

    // Score all moves at depth 2 (good balance of speed/quality)
    const scored = moves.map(m => {
      chess.move(m);
      const score = getPositionScore(chess.fen(), 2);
      chess.undo();
      return { move: m, score };
    });
    scored.sort((a, b) => isMax ? b.score - a.score : a.score - b.score);

    // For top n, build 3-move continuation lines
    return scored.slice(0, n).map(({ move, score }) => {
      const lineChess = new Chess(fen);
      lineChess.move(move);
      const sanMoves = [move.san];

      for (let d = 0; d < 2; d++) {
        const { move: bestUci } = getLocalBestMoveWithScore(lineChess.fen(), 1);
        if (!bestUci) break;
        const result = lineChess.move({
          from: bestUci.slice(0, 2),
          to:   bestUci.slice(2, 4),
          promotion: bestUci[4] || undefined,
        });
        if (!result) break;
        sanMoves.push(result.san);
      }

      return { san: move.san, score, line: sanMoves };
    });
  } catch { return []; }
}

// Fetch opening name from lichess opening explorer (free, no key needed)
const _openingCache = new Map();
async function fetchOpeningName(fen) {
  if (_openingCache.has(fen)) return _openingCache.get(fen);
  try {
    const res = await fetch(
      `https://explorer.lichess.ovh/opening?fen=${encodeURIComponent(fen)}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const name = json?.opening?.name || null;
    _openingCache.set(fen, name);
    return name;
  } catch { return null; }
}

// Try loading PGN — attempts normalization if raw parse fails
function tryLoadPgn(pgnStr) {
  const chess = new Chess();
  // Attempt 1: raw
  try { chess.loadPgn(pgnStr); return chess; } catch {}
  // Attempt 2: strip headers + normalize spaces around move numbers
  try {
    const stripped = pgnStr.replace(/\[.*?\]\s*/gs, '').trim();
    const spaced   = stripped.replace(/(\d+)\./g, ' $1. ').replace(/\s+/g, ' ').trim();
    chess.loadPgn(spaced);
    return chess;
  } catch {}
  // Attempt 3: treat as FEN
  try { const c = new Chess(pgnStr.trim()); return c; } catch {}
  return null;
}

const ACC_WEIGHTS = { brilliant: 100, best: 100, good: 85, inaccuracy: 65, mistake: 40, blunder: 10 };

function calcAccuracy(reviewResults, moveHistory, color) {
  if (!reviewResults?.length) return null;
  const results = reviewResults.filter((_, i) => moveHistory[i]?.color === color);
  if (!results.length) return null;
  return Math.round(results.reduce((s, r) => s + (ACC_WEIGHTS[r.classification] ?? 50), 0) / results.length);
}

function buildCounts(reviewResults, moveHistory, color) {
  const counts = {};
  reviewResults?.forEach((r, i) => {
    if (moveHistory[i]?.color !== color) return;
    counts[r.classification] = (counts[r.classification] || 0) + 1;
  });
  return counts;
}

// ── Eval Graph ────────────────────────────────────────────────────────────────

function EvalGraph({ data, currentIdx, onSeek }) {
  const uid = useId().replace(/:/g, '');
  const W = 400, H = 48, pad = 1;
  const evalToY = s => pad + (H - pad * 2) * (1 - evalToWhitePct(s) / 100);
  const pts = data.map((s, i) => [
    data.length > 1 ? pad + (i / (data.length - 1)) * (W - pad * 2) : W / 2,
    evalToY(s),
  ]);
  const pathD = pts.length > 1 ? 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') : null;
  const fillD = pathD ? `${pathD} L ${pts.at(-1)[0].toFixed(1)},${H / 2} L ${pts[0][0].toFixed(1)},${H / 2} Z` : null;
  const curX  = currentIdx >= 0 && currentIdx < data.length ? pts[currentIdx][0] : null;
  const handleClick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
  };
  return (
    <svg className={styles.evalGraph} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onClick={handleClick}>
      <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.3)" />
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
      {fillD && (
        <>
          <clipPath id={`ug${uid}`}><rect x={0} y={0} width={W} height={H/2} /></clipPath>
          <clipPath id={`lg${uid}`}><rect x={0} y={H/2} width={W} height={H/2} /></clipPath>
          <path d={fillD} fill="rgba(220,220,220,0.2)" clipPath={`url(#ug${uid})`} />
          <path d={fillD} fill="rgba(20,20,20,0.5)"   clipPath={`url(#lg${uid})`} />
        </>
      )}
      {pathD && <path d={pathD} fill="none" stroke="rgba(0,255,245,0.65)" strokeWidth={1.5} strokeLinejoin="round" />}
      {curX !== null && <line x1={curX} y1={pad} x2={curX} y2={H-pad} stroke="rgba(255,255,255,0.55)" strokeWidth={1} strokeDasharray="2 2" />}
      {curX !== null && <circle cx={curX} cy={evalToY(data[currentIdx])} r={2.5} fill="#00fff5" />}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalysisBoard({ savedGames = [], gamesLoading = false }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    chessInstance, importPgn, setDisableBoard, flipped, setFlipped,
  } = useGameStore();

  const [currentEval, setCurrentEval]       = useState(0);
  const [engineLines, setEngineLines]       = useState([]);
  const [engineBusy, setEngineBusy]         = useState(false);
  const [reviewResults, setReviewResults]   = useState(null);
  const [isReviewing, setIsReviewing]       = useState(false);
  const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 });
  const [pgnInput, setPgnInput]             = useState('');
  const [pgnError, setPgnError]             = useState('');
  const [gameLoaded, setGameLoaded]         = useState(false);
  const [evalHistory, setEvalHistory]       = useState([]);
  const [pgnHeaders, setPgnHeaders]         = useState({});
  const [liveOpeningName, setLiveOpeningName] = useState(null);
  const openingAbortRef = useRef(null);

  const evalTimerRef = useRef(null);
  const moveListRef  = useRef(null);
  const fileRef      = useRef(null);

  useEffect(() => { if (gameLoaded) setDisableBoard(true); }, [gameLoaded, currentMoveIndex]);

  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;
    try { setPgnHeaders(chessInstance.header?.() || {}); } catch { setPgnHeaders({}); }
    setEvalHistory([]);
  }, [gameLoaded]);

  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;
    clearTimeout(evalTimerRef.current);
    setEngineBusy(true);
    evalTimerRef.current = setTimeout(() => {
      try {
        const fen = currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
          ? moveHistory[currentMoveIndex].fen : chessInstance.fen();
        const lines = getTopLines(fen, 3);
        const ev    = lines.length > 0 ? lines[0].score : getPositionScore(fen, 2);
        setEngineLines(lines);
        setCurrentEval(ev);
        if (currentMoveIndex >= 0) {
          setEvalHistory(prev => { const n = [...prev]; n[currentMoveIndex] = ev; return n; });
        }

        // Fetch opening name for current position (debounced, cached)
        if (openingAbortRef.current) openingAbortRef.current.abort?.();
        fetchOpeningName(fen).then(name => {
          if (name) setLiveOpeningName(name);
        });
      } catch {} finally { setEngineBusy(false); }
    }, 200);
    return () => clearTimeout(evalTimerRef.current);
  }, [currentMoveIndex, gameLoaded, chessInstance]);

  useEffect(() => {
    if (!moveListRef.current) return;
    moveListRef.current.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMoveIndex]);

  useEffect(() => {
    if (!gameLoaded) return;
    const onKey = e => {
      if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft')  goToMove(currentMoveIndex - 1);
      if (e.key === 'ArrowRight') goToMove(currentMoveIndex + 1);
      if (e.key === 'ArrowUp')    goToMove(-1);
      if (e.key === 'ArrowDown')  goToMove(moveHistory.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameLoaded, currentMoveIndex, moveHistory.length]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const doLoad = (pgnStr) => {
    setPgnError('');
    if (!pgnStr.trim()) { setPgnError('Paste a PGN or FEN first.'); return; }
    // Try normalizing before passing to store's importPgn
    const chess = tryLoadPgn(pgnStr);
    if (!chess) { setPgnError('Could not parse PGN. Check the format and try again.'); return; }
    // Re-export clean PGN so importPgn always gets valid input
    const cleanPgn = chess.pgn() || pgnStr;
    const ok = importPgn(cleanPgn || pgnStr);
    if (ok) {
      setGameLoaded(true);
      setReviewResults(null);
      setPgnInput('');
      setDisableBoard(true);
    } else {
      setPgnError('Failed to load game. Check PGN format.');
    }
  };

  const handleLoadGame = (game) => {
    if (!game.pgnStr) return;
    doLoad(game.pgnStr);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => { setPgnInput(evt.target.result); };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReview = async () => {
    if (!moveHistory.length) return;
    setIsReviewing(true); setReviewResults(null);
    setReviewProgress({ current: 0, total: moveHistory.length });
    try {
      const results = await reviewGame(moveHistory, (current, total) => setReviewProgress({ current, total }));
      setReviewResults(results);
    } finally { setIsReviewing(false); setReviewProgress({ current: 0, total: 0 }); }
  };

  const handleNewGame = () => {
    setGameLoaded(false); setReviewResults(null);
    setEngineLines([]); setCurrentEval(0);
    setEvalHistory([]); setPgnHeaders({}); setPgnError('');
    setLiveOpeningName(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({ number: Math.floor(i/2)+1, white: moveHistory[i], whiteIdx: i, black: moveHistory[i+1]||null, blackIdx: i+1 });
  }

  const graphData = (() => {
    if (reviewResults?.length) {
      return reviewResults.map((r, i) => moveHistory[i]?.color === 'w' ? r.playedScore : -r.playedScore);
    }
    if (evalHistory.some(v => v !== undefined)) {
      const out = [];
      for (let i = 0; i < moveHistory.length; i++) {
        if (evalHistory[i] !== undefined) out.push(evalHistory[i]); else break;
      }
      return out.length > 1 ? out : [];
    }
    return [];
  })();

  const whitePct      = evalToWhitePct(currentEval);
  const whiteAcc      = calcAccuracy(reviewResults, moveHistory, 'w');
  const blackAcc      = calcAccuracy(reviewResults, moveHistory, 'b');
  const whiteCounts   = buildCounts(reviewResults, moveHistory, 'w');
  const blackCounts   = buildCounts(reviewResults, moveHistory, 'b');
  const topName       = flipped ? (pgnHeaders.White || 'White') : (pgnHeaders.Black || 'Black');
  const bottomName    = flipped ? (pgnHeaders.Black || 'Black') : (pgnHeaders.White || 'White');
  const topColor      = flipped ? 'w' : 'b';
  const botColor      = flipped ? 'b' : 'w';
  const topAcc        = topColor === 'w' ? whiteAcc : blackAcc;
  const botAcc        = botColor === 'w' ? whiteAcc : blackAcc;
  const topCounts     = topColor === 'w' ? whiteCounts : blackCounts;
  const botCounts     = botColor === 'w' ? whiteCounts : blackCounts;
  const openingName   = liveOpeningName || pgnHeaders.Opening || pgnHeaders.ECO || null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Left: eval bar + board column ── */}
      <div className={styles.leftCol}>

        {/* Eval bar */}
        <div className={styles.evalBar}>
          <div className={styles.evalWhite} style={{ height: `${whitePct}%` }} />
          <div className={styles.evalBlack} />
          <span className={styles.evalScore} style={{
            top: whitePct >= 55 ? 'auto' : '4px',
            bottom: whitePct >= 55 ? '4px' : 'auto',
            color: whitePct >= 55 ? '#333' : '#bbb',
          }}>{formatEval(currentEval)}</span>
        </div>

        {/* Board + player bars */}
        <div className={styles.boardCol}>
          {/* Top player */}
          <div className={styles.playerBar}>
            <div className={styles.playerLeft}>
              <span className={`${styles.pDot} ${topColor === 'w' ? styles.pDotW : styles.pDotB}`} />
              <span className={styles.pName}>{topName}</span>
            </div>
            {topAcc !== null && (
              <span className={styles.pAcc} style={{ color: topAcc >= 85 ? '#3ddc84' : topAcc >= 65 ? '#f0c94c' : '#e05555' }}>
                {topAcc}%
              </span>
            )}
          </div>

          <div className={styles.boardWrap}>
            <Board />
          </div>

          {/* Bottom player */}
          <div className={styles.playerBar}>
            <div className={styles.playerLeft}>
              <span className={`${styles.pDot} ${botColor === 'w' ? styles.pDotW : styles.pDotB}`} />
              <span className={styles.pName}>{bottomName}</span>
            </div>
            {botAcc !== null && (
              <span className={styles.pAcc} style={{ color: botAcc >= 85 ? '#3ddc84' : botAcc >= 65 ? '#f0c94c' : '#e05555' }}>
                {botAcc}%
              </span>
            )}
          </div>

          {/* Eval graph */}
          {graphData.length > 1 && (
            <div className={styles.graphWrap}>
              <EvalGraph data={graphData} currentIdx={currentMoveIndex} onSeek={goToMove} />
            </div>
          )}

          {/* Nav bar */}
          {gameLoaded && (
            <div className={styles.navRow}>
              <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">⏮</button>
              <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex < 0} title="Prev ←">◀</button>
              <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moveHistory.length - 1} title="Next →">▶</button>
              <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">⏭</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: analysis panel ── */}
      <div className={styles.panel}>

        {/* Panel header */}
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Game Analysis</span>
          <div className={styles.panelActions}>
            {gameLoaded && (
              <>
                <button className={styles.iconBtn} onClick={() => setFlipped(f => !f)} title="Flip board">⇅</button>
                <button
                  className={`${styles.iconBtn} ${reviewResults ? styles.iconBtnDone : ''}`}
                  onClick={handleReview}
                  disabled={isReviewing || !moveHistory.length}
                  title="Review game"
                >
                  {isReviewing ? `${reviewProgress.current}/${reviewProgress.total}` : '⟳'}
                </button>
                <button className={styles.iconBtn} onClick={handleNewGame} title="New analysis">✕</button>
              </>
            )}
          </div>
        </div>

        {/* Review progress */}
        {isReviewing && (
          <div className={styles.reviewProgress}>
            <div className={styles.reviewBar} style={{ width: `${(reviewProgress.current / reviewProgress.total) * 100}%` }} />
          </div>
        )}

        {/* ── Game loaded: engine + move list ── */}
        {gameLoaded ? (
          <>
            {openingName && <div className={styles.opening}>{openingName}</div>}

            {/* Engine */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Engine</div>
              {engineBusy
                ? <div className={styles.dim}>Computing…</div>
                : engineLines.length === 0
                  ? <div className={styles.dim}>Game over</div>
                  : engineLines.map((l, i) => (
                    <div key={i} className={styles.engineLine}>
                      <span className={styles.lineEval} style={{ color: l.score > 20 ? '#e8e8e8' : l.score < -20 ? '#e05555' : 'rgba(255,255,255,0.45)' }}>
                        {formatEval(l.score)}
                      </span>
                      <span className={styles.lineMove}>
                        {l.line ? l.line.map((m, mi) => (
                          <span key={mi} className={mi === 0 ? styles.lineMoveFirst : styles.lineMoveCont}>
                            {m}{' '}
                          </span>
                        )) : l.san}
                      </span>
                    </div>
                  ))
              }
            </div>

            {/* Accuracy */}
            {reviewResults && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Accuracy</div>
                {[{color: topColor, name: topName, acc: topAcc, counts: topCounts},
                  {color: botColor, name: bottomName, acc: botAcc, counts: botCounts}].map(p => (
                  <div key={p.color} className={styles.accRow}>
                    <span className={`${styles.pDot} ${p.color === 'w' ? styles.pDotW : styles.pDotB}`} />
                    <span className={styles.accName}>{p.name}</span>
                    <span className={styles.accPct} style={{ color: p.acc >= 85 ? '#3ddc84' : p.acc >= 65 ? '#f0c94c' : '#e05555' }}>
                      {p.acc !== null ? `${p.acc}%` : '—'}
                    </span>
                    <div className={styles.accBadges}>
                      {Object.entries(CLASSIFICATIONS).map(([k, cls]) => {
                        const n = p.counts?.[k]; if (!n) return null;
                        return (
                          <span key={k} className={styles.accBadge} title={`${cls.label}: ${n}`}>
                            <span style={{ color: cls.color }}>{cls.symbol}</span>
                            <span className={styles.badgeN}>{n}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Move list */}
            <div className={styles.moveList} ref={moveListRef}>
              {moveRows.map(row => {
                const wC = reviewResults?.[row.whiteIdx] ? CLASSIFICATIONS[reviewResults[row.whiteIdx].classification] : null;
                const bC = row.black && reviewResults?.[row.blackIdx] ? CLASSIFICATIONS[reviewResults[row.blackIdx].classification] : null;
                return (
                  <div key={row.number} className={styles.moveRow}>
                    <span className={styles.moveN}>{row.number}.</span>
                    <span
                      data-active={currentMoveIndex === row.whiteIdx ? 'true' : 'false'}
                      className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveActive : ''}`}
                      onClick={() => goToMove(row.whiteIdx)}
                    >
                      {row.white?.san || ''}
                      {wC && <sup className={styles.moveBadge} style={{ color: wC.color }}>{wC.symbol}</sup>}
                    </span>
                    <span
                      data-active={row.black && currentMoveIndex === row.blackIdx ? 'true' : 'false'}
                      className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveActive : ''}`}
                      onClick={() => row.black && goToMove(row.blackIdx)}
                    >
                      {row.black?.san || ''}
                      {bC && <sup className={styles.moveBadge} style={{ color: bC.color }}>{bC.symbol}</sup>}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* ── No game: input area ── */}
            <div className={styles.inputSection}>
              <div className={styles.sectionLabel}>Load game from PGN</div>
              <textarea
                className={styles.pgnTextarea}
                value={pgnInput}
                onChange={e => { setPgnInput(e.target.value); setPgnError(''); }}
                placeholder="Paste PGN or FEN here…"
                rows={6}
              />
              {pgnError && <div className={styles.pgnError}>{pgnError}</div>}

              {/* Hidden file input */}
              <input ref={fileRef} type="file" accept=".pgn,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
              <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                ↑ Upload PGN File
              </button>
              <button className={styles.analyseBtn} onClick={() => doLoad(pgnInput)}>
                🔍 Analyse
              </button>
            </div>

            {/* Saved games */}
            {(gamesLoading || savedGames.length > 0) && (
              <div className={styles.savedSection}>
                <div className={styles.sectionLabel}>Recent Games</div>
                {gamesLoading && <div className={styles.dim}>Loading…</div>}
                <div className={styles.savedList}>
                  {savedGames.map((g, i) => (
                    <div key={i} className={styles.savedGame} onClick={() => handleLoadGame(g)}>
                      <div className={styles.savedTop}>
                        <span className={`${styles.pDot} ${g.color === 'white' ? styles.pDotW : styles.pDotB}`} />
                        <span className={styles.savedVs}>
                          {g.color === 'white' ? 'W' : 'B'} · {g.opponent || 'vs Opponent'}
                        </span>
                        {g.result && (
                          <span className={`${styles.resBadge} ${styles['res_' + g.result]}`}>
                            {g.result === 'draw' ? '½' : g.result === g.color ? 'W' : 'L'}
                          </span>
                        )}
                      </div>
                      <div className={styles.savedPgn}>{(g.pgnStr || '').slice(0, 60)}…</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
