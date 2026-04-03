import { useState, useEffect, useRef, useId, useMemo, memo } from 'react';
import Board from '../Board/Board';
import styles from './AnalysisBoard.module.css';
import useGameStore from '../../store/gameStore';
import { getPositionScore, getLocalBestMoveWithScore } from '../../utils/localAI';
import { Chess } from 'chess.js';
import { CLASSIFICATIONS, reviewGame } from '../../utils/reviewEngine';
import { fetchChessComGames } from '../../utils/chessComService';
import { fetchLichessGames } from '../../utils/lichessService';
import BoardEditor from './BoardEditor';
import OpeningExplorer from './OpeningExplorer';
import { countPieces, fetchTablebase } from '../../utils/tablebaseService';

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

const _topLinesCache = new Map();
function getTopLines(fen, n = 3) {
  const key = `${fen}:${n}`;
  if (_topLinesCache.has(key)) return _topLinesCache.get(key);
  try {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return [];
    const moves = chess.moves({ verbose: true });
    if (!moves.length) return [];
    const isMax = chess.turn() === 'w';
    const scored = moves.map(m => {
      chess.move(m);
      const score = getPositionScore(chess.fen(), 2);
      chess.undo();
      return { move: m, score };
    });
    scored.sort((a, b) => isMax ? b.score - a.score : a.score - b.score);
    const result = scored.slice(0, n).map(({ move, score }) => {
      const lineChess = new Chess(fen);
      lineChess.move(move);
      const sanMoves = [move.san];
      for (let d = 0; d < 2; d++) {
        const { move: bestUci } = getLocalBestMoveWithScore(lineChess.fen(), 1);
        if (!bestUci) break;
        const r = lineChess.move({
          from: bestUci.slice(0, 2), to: bestUci.slice(2, 4),
          promotion: bestUci[4] || undefined,
        });
        if (!r) break;
        sanMoves.push(r.san);
      }
      return { san: move.san, score, line: sanMoves };
    });
    // Cap cache at 200 entries
    if (_topLinesCache.size > 200) {
      const firstKey = _topLinesCache.keys().next().value;
      _topLinesCache.delete(firstKey);
    }
    _topLinesCache.set(key, result);
    return result;
  } catch { return []; }
}

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
    if (_openingCache.size > 200) {
      const firstKey = _openingCache.keys().next().value;
      _openingCache.delete(firstKey);
    }
    _openingCache.set(fen, name);
    return name;
  } catch { return null; }
}

function tryLoadPgn(pgnStr) {
  const chess = new Chess();
  try { chess.loadPgn(pgnStr); return chess; } catch {}
  try {
    const stripped = pgnStr.replace(/\[.*?\]\s*/gs, '').trim();
    const spaced   = stripped.replace(/(\d+)\./g, ' $1. ').replace(/\s+/g, ' ').trim();
    chess.loadPgn(spaced);
    return chess;
  } catch {}
  try { return new Chess(pgnStr.trim()); } catch {}
  return null;
}

const ACC_WEIGHTS = {
  brilliant: 100, critical: 95, best: 100, excellent: 85, okay: 70,
  inaccuracy: 45, mistake: 20, blunder: 0, theory: 100,
};

function calcAccuracy(reviewResults, moveHistory, color) {
  if (!reviewResults?.length) return null;
  const results = reviewResults.filter((_, i) => moveHistory[i]?.color === color);
  if (!results.length) return null;
  return Math.round(results.reduce((s, r) => s + (ACC_WEIGHTS[r.classification] ?? 50), 0) / results.length);
}

function estimateElo(accuracy) {
  if (accuracy == null) return null;
  // Rough mapping: 30%~600, 50%~900, 65%~1200, 75%~1500, 85%~1800, 95%~2200
  return Math.max(400, Math.min(2400, Math.round(400 + (accuracy / 100) * 1900)));
}

function buildCounts(reviewResults, moveHistory, color) {
  const counts = {};
  reviewResults?.forEach((r, i) => {
    if (moveHistory[i]?.color !== color) return;
    counts[r.classification] = (counts[r.classification] || 0) + 1;
  });
  return counts;
}

// Classification display order for the report table
const CLASS_ORDER = ['brilliant', 'critical', 'best', 'excellent', 'okay', 'inaccuracy', 'mistake', 'blunder', 'theory'];

// ── Eval Graph ────────────────────────────────────────────────────────────────

const EvalGraph = memo(function EvalGraph({ data, currentIdx, onSeek }) {
  const uid = useId().replace(/:/g, '');
  const W = 500, H = 60, pad = 1;
  const evalToY = s => pad + (H - pad * 2) * (1 - evalToWhitePct(s) / 100);
  const pts = data.map((s, i) => [
    data.length > 1 ? pad + (i / (data.length - 1)) * (W - pad * 2) : W / 2,
    evalToY(s),
  ]);
  const pathD = pts.length > 1 ? 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') : null;
  const fillD = pathD ? `${pathD} L ${pts.at(-1)[0].toFixed(1)},${H / 2} L ${pts[0][0].toFixed(1)},${H / 2} Z` : null;
  const curX  = currentIdx >= 0 && currentIdx < data.length ? pts[currentIdx][0] : null;

  // Find blunder/mistake positions for markers
  const markers = [];
  data.forEach((s, i) => {
    if (i === 0) return;
    const diff = Math.abs(s - data[i - 1]);
    if (diff > 200) markers.push({ x: pts[i][0], y: pts[i][1], type: 'blunder' });
    else if (diff > 100) markers.push({ x: pts[i][0], y: pts[i][1], type: 'mistake' });
  });

  const handleClick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
  };

  return (
    <svg className={styles.evalGraph} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onClick={handleClick}>
      <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.35)" rx={4} />
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      {fillD && (
        <>
          <clipPath id={`ug${uid}`}><rect x={0} y={0} width={W} height={H/2} /></clipPath>
          <clipPath id={`lg${uid}`}><rect x={0} y={H/2} width={W} height={H/2} /></clipPath>
          <path d={fillD} fill="rgba(255,255,255,0.12)" clipPath={`url(#ug${uid})`} />
          <path d={fillD} fill="rgba(0,0,0,0.35)" clipPath={`url(#lg${uid})`} />
        </>
      )}
      {pathD && <path d={pathD} fill="none" stroke="rgba(0,255,245,0.55)" strokeWidth={1.5} strokeLinejoin="round" />}
      {markers.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={2.5}
          fill={m.type === 'blunder' ? '#cc3333' : '#e08c00'} opacity={0.7} />
      ))}
      {curX !== null && <line x1={curX} y1={pad} x2={curX} y2={H-pad} stroke="rgba(255,255,255,0.45)" strokeWidth={1} strokeDasharray="2 2" />}
      {curX !== null && <circle cx={curX} cy={evalToY(data[currentIdx])} r={3} fill="#00fff5" stroke="rgba(0,0,0,0.3)" strokeWidth={1} />}
    </svg>
  );
});

// ── Accuracy Bar ──────────────────────────────────────────────────────────────

function AccuracyBar({ label, color, acc, dotClass }) {
  const barColor = acc >= 85 ? '#3ddc84' : acc >= 65 ? '#f0c94c' : '#e05555';
  return (
    <div className={styles.accBarRow}>
      <span className={`${styles.pDot} ${dotClass}`} />
      <span className={styles.accBarLabel}>{label}</span>
      <div className={styles.accBarTrack}>
        <div className={styles.accBarFill} style={{ width: `${acc}%`, background: barColor }} />
      </div>
      <span className={styles.accBarPct} style={{ color: barColor }}>{acc}%</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalysisBoard({ savedGames = [], gamesLoading = false, pendingPgn = null, onPendingPgnConsumed = null }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    chessInstance, importPgn, setDisableBoard, flipped, setFlipped,
  } = useGameStore();

  // UI state
  const [panelTab, setPanelTab]             = useState('report'); // report | analysis
  const [importTab, setImportTab]           = useState('pgn');    // pgn | chesscom | lichess
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

  // Tablebase state
  const [tablebaseData, setTablebaseData] = useState(null);

  // External import state
  const [externalUsername, setExternalUsername] = useState('');
  const [externalGames, setExternalGames]     = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError]     = useState('');

  const openingAbortRef = useRef(null);
  const evalTimerRef = useRef(null);
  const moveListRef  = useRef(null);
  const fileRef      = useRef(null);

  useEffect(() => { if (gameLoaded) setDisableBoard(true); }, [gameLoaded, currentMoveIndex]);

  // Auto-load PGN from post-game review and start analysis
  useEffect(() => {
    if (!pendingPgn) return;
    const ok = importPgn(pendingPgn);
    if (ok) {
      setGameLoaded(true);
      setReviewResults(null);
      setPanelTab('report');
      // Auto-start review after a brief delay to let the board render
      setTimeout(async () => {
        const history = useGameStore.getState().moveHistory;
        if (!history.length) return;
        setIsReviewing(true);
        setReviewProgress({ current: 0, total: history.length });
        try {
          const results = await reviewGame(history, (cur, tot) => setReviewProgress({ current: cur, total: tot }));
          setReviewResults(results);
        } finally {
          setIsReviewing(false);
        }
      }, 300);
    }
    if (onPendingPgnConsumed) onPendingPgnConsumed();
  }, [pendingPgn]); // eslint-disable-line

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
        if (openingAbortRef.current) openingAbortRef.current.abort?.();
        fetchOpeningName(fen).then(name => { if (name) setLiveOpeningName(name); }).catch(err => console.error('Opening fetch error:', err));
      } catch (err) { console.error('Engine eval error:', err); } finally { setEngineBusy(false); }
    }, 400);
    return () => clearTimeout(evalTimerRef.current);
  }, [currentMoveIndex, gameLoaded, chessInstance]);

  // Tablebase lookup for <=7 piece positions
  useEffect(() => {
    if (!chessInstance || !gameLoaded) { setTablebaseData(null); return; }
    const fen = currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
      ? moveHistory[currentMoveIndex].fen : chessInstance.fen();
    if (countPieces(fen) > 7) { setTablebaseData(null); return; }
    let cancelled = false;
    fetchTablebase(fen).then(result => { if (!cancelled) setTablebaseData(result); }).catch(() => { if (!cancelled) setTablebaseData(null); });
    return () => { cancelled = true; };
  }, [currentMoveIndex, gameLoaded, chessInstance]);

  useEffect(() => {
    if (!moveListRef.current) return;
    moveListRef.current.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentMoveIndex]);

  const moveIdxRef = useRef(currentMoveIndex);
  const histLenRef = useRef(moveHistory.length);
  moveIdxRef.current = currentMoveIndex;
  histLenRef.current = moveHistory.length;

  useEffect(() => {
    if (!gameLoaded) return;
    const onKey = e => {
      if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft')  goToMove(moveIdxRef.current - 1);
      if (e.key === 'ArrowRight') goToMove(moveIdxRef.current + 1);
      if (e.key === 'ArrowUp')    goToMove(-1);
      if (e.key === 'ArrowDown')  goToMove(histLenRef.current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameLoaded, goToMove]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const doLoad = (pgnStr) => {
    setPgnError('');
    if (!pgnStr.trim()) { setPgnError('Paste a PGN or FEN first.'); return; }
    const chess = tryLoadPgn(pgnStr);
    if (!chess) { setPgnError('Invalid PGN format. Paste the full game text including move numbers (e.g., 1. e4 e5 2. Nf3 Nc6...) or a valid FEN string.'); return; }
    const cleanPgn = chess.pgn() || pgnStr;
    const ok = importPgn(cleanPgn || pgnStr);
    if (ok) {
      setGameLoaded(true);
      setReviewResults(null);
      setPgnInput('');
      setDisableBoard(true);
      setPanelTab('report');
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
    reader.onerror = () => { setPgnError('Failed to read file'); };
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
      setPanelTab('report');
    } finally { setIsReviewing(false); setReviewProgress({ current: 0, total: 0 }); }
  };

  const handleNewGame = () => {
    setGameLoaded(false); setReviewResults(null);
    setEngineLines([]); setCurrentEval(0);
    setEvalHistory([]); setPgnHeaders({}); setPgnError('');
    setLiveOpeningName(null); setExternalGames([]); setExternalError('');
  };

  const handleFetchExternal = async () => {
    if (!externalUsername.trim()) { setExternalError('Enter a username'); return; }
    setExternalLoading(true); setExternalError(''); setExternalGames([]);
    try {
      const games = importTab === 'chesscom'
        ? await fetchChessComGames(externalUsername, 20)
        : await fetchLichessGames(externalUsername, 20);
      if (!games.length) setExternalError('No games found');
      else setExternalGames(games);
    } catch (err) {
      setExternalError(err.message || 'Failed to fetch games');
    } finally { setExternalLoading(false); }
  };

  // ── Derived (memoized) ─────────────────────────────────────────────────────

  const moveRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      rows.push({ number: Math.floor(i/2)+1, white: moveHistory[i], whiteIdx: i, black: moveHistory[i+1]||null, blackIdx: i+1 });
    }
    return rows;
  }, [moveHistory]);

  const graphData = useMemo(() => {
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
  }, [reviewResults, evalHistory, moveHistory]);

  const whitePct      = evalToWhitePct(currentEval);
  const whiteAcc      = useMemo(() => calcAccuracy(reviewResults, moveHistory, 'w'), [reviewResults, moveHistory]);
  const blackAcc      = useMemo(() => calcAccuracy(reviewResults, moveHistory, 'b'), [reviewResults, moveHistory]);
  const whiteCounts   = useMemo(() => buildCounts(reviewResults, moveHistory, 'w'), [reviewResults, moveHistory]);
  const blackCounts   = useMemo(() => buildCounts(reviewResults, moveHistory, 'b'), [reviewResults, moveHistory]);
  const topName       = flipped ? (pgnHeaders.White || 'White') : (pgnHeaders.Black || 'Black');
  const bottomName    = flipped ? (pgnHeaders.Black || 'Black') : (pgnHeaders.White || 'White');
  const topColor      = flipped ? 'w' : 'b';
  const botColor      = flipped ? 'b' : 'w';
  const topAcc        = topColor === 'w' ? whiteAcc : blackAcc;
  const botAcc        = botColor === 'w' ? whiteAcc : blackAcc;
  const openingName   = liveOpeningName || pgnHeaders.Opening || pgnHeaders.ECO || null;

  // Current move annotation
  const curReview = reviewResults && currentMoveIndex >= 0 ? reviewResults[currentMoveIndex] : null;
  const curClass  = curReview ? CLASSIFICATIONS[curReview.classification] : null;
  const curMove   = currentMoveIndex >= 0 ? moveHistory[currentMoveIndex] : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Left: board column ── */}
      <div className={styles.leftCol}>
        <div className={styles.boardCol}>
          {gameLoaded ? (
            <>
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

              {/* Eval bar + board row */}
              <div className={styles.boardRow}>
                <div className={styles.evalBar}>
                  <div className={styles.evalWhite} style={{ height: `${whitePct}%` }} />
                  <div className={styles.evalBlack} />
                  <span className={styles.evalScore} style={{
                    top: whitePct >= 55 ? 'auto' : '4px',
                    bottom: whitePct >= 55 ? '4px' : 'auto',
                    color: whitePct >= 55 ? '#333' : '#bbb',
                  }}>{formatEval(currentEval)}</span>
                </div>
                <div className={styles.boardWrap}>
                  <Board />
                </div>
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
            </>
          ) : (
            /* Board placeholder when no game loaded */
            <div className={styles.boardRow}>
              <div className={styles.boardWrap}>
                <div className={styles.boardPlaceholder}>
                  <svg className={styles.boardPlaceholderIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="12" width="3" height="6" rx="1"/>
                    <rect x="8" y="8" width="3" height="10" rx="1"/>
                    <rect x="14" y="4" width="3" height="14" rx="1"/>
                    <path d="M3.5 11.5l5-4.5 4 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.boardPlaceholderText}>Import a game from the panel to start analysis</span>
                </div>
              </div>
            </div>
          )}

          {/* Nav bar */}
          {gameLoaded && (
            <div className={styles.navRow}>
              <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">|&#x25C0;</button>
              <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex < 0} title="Prev">&#x25C0;</button>
              <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moveHistory.length - 1} title="Next">&#x25B6;</button>
              <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">&#x25B6;|</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: analysis panel ── */}
      <div className={`${styles.panel} ${!gameLoaded ? styles.panelExpanded : ''}`}>

        {/* Panel header */}
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Game Analysis</span>
          <div className={styles.panelActions}>
            {gameLoaded && (
              <>
                <button className={styles.iconBtn} onClick={() => setFlipped(f => !f)} title="Flip board">&#x21C5;</button>
                <button
                  className={`${styles.iconBtn} ${reviewResults ? styles.iconBtnDone : ''}`}
                  onClick={handleReview}
                  disabled={isReviewing || !moveHistory.length}
                  title="Review game"
                >
                  {isReviewing ? `${reviewProgress.current}/${reviewProgress.total}` : '&#x27F3;'}
                </button>
                <button className={styles.iconBtn} onClick={handleNewGame} title="New analysis">&#x2715;</button>
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

        {/* ── Game loaded: tabs + content ── */}
        {gameLoaded ? (
          <>
            {/* Tab switcher */}
            <div className={styles.tabRow}>
              <button className={`${styles.tab} ${panelTab === 'report' ? styles.tabActive : ''}`}
                onClick={() => setPanelTab('report')}>Report</button>
              <button className={`${styles.tab} ${panelTab === 'analysis' ? styles.tabActive : ''}`}
                onClick={() => setPanelTab('analysis')}>Analysis</button>
              <button className={`${styles.tab} ${panelTab === 'explorer' ? styles.tabActive : ''}`}
                onClick={() => setPanelTab('explorer')}>Explorer</button>
            </div>

            {/* ── REPORT TAB ── */}
            {panelTab === 'report' && (
              <div className={styles.reportContent}>
                {/* Eval graph */}
                {graphData.length > 1 && (
                  <div className={styles.graphWrap}>
                    <EvalGraph data={graphData} currentIdx={currentMoveIndex} onSeek={goToMove} />
                  </div>
                )}

                {/* Accuracy bars + ELO estimation */}
                {reviewResults && (whiteAcc !== null || blackAcc !== null) && (
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Accuracies</div>
                    {whiteAcc !== null && (
                      <AccuracyBar label={pgnHeaders.White || 'White'} acc={whiteAcc} dotClass={styles.pDotW} />
                    )}
                    {blackAcc !== null && (
                      <AccuracyBar label={pgnHeaders.Black || 'Black'} acc={blackAcc} dotClass={styles.pDotB} />
                    )}
                    {(whiteAcc !== null || blackAcc !== null) && (
                      <div className={styles.eloEstRow}>
                        {whiteAcc !== null && (
                          <div className={styles.eloEstItem}>
                            <span className={styles.eloEstLabel}>{pgnHeaders.White || 'White'}</span>
                            <span className={styles.eloEstVal}>~{estimateElo(whiteAcc)}</span>
                          </div>
                        )}
                        {blackAcc !== null && (
                          <div className={styles.eloEstItem}>
                            <span className={styles.eloEstLabel}>{pgnHeaders.Black || 'Black'}</span>
                            <span className={styles.eloEstVal}>~{estimateElo(blackAcc)}</span>
                          </div>
                        )}
                        <div className={styles.eloEstHint}>Estimated rating (this game)</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Classification table */}
                {reviewResults && (
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Move Classifications</div>
                    <table className={styles.classTable}>
                      <thead>
                        <tr>
                          <th></th>
                          <th></th>
                          <th className={styles.classColHead}>W</th>
                          <th className={styles.classColHead}>B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CLASS_ORDER.map(key => {
                          const cls = CLASSIFICATIONS[key];
                          const wN = whiteCounts[key] || 0;
                          const bN = blackCounts[key] || 0;
                          if (wN === 0 && bN === 0) return null;
                          return (
                            <tr key={key} className={styles.classRow}>
                              <td className={styles.classIcon} style={{ color: cls.color }}>{cls.icon}</td>
                              <td className={styles.classLabel} style={{ color: cls.color }}>{cls.label}</td>
                              <td className={styles.classCount}>{wN || '-'}</td>
                              <td className={styles.classCount}>{bN || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!reviewResults && !isReviewing && (
                  <div className={styles.reviewPrompt}>
                    <button className={styles.reviewBtn} onClick={handleReview} disabled={!moveHistory.length}>
                      &#x27F3; Review Game
                    </button>
                    <p className={styles.reviewHint}>Analyse each move to see accuracy, classifications, and the evaluation graph.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYSIS TAB ── */}
            {panelTab === 'analysis' && (
              <div className={styles.analysisContent}>
                {/* Eval graph (compact in analysis tab too) */}
                {graphData.length > 1 && (
                  <div className={styles.graphWrapSmall}>
                    <EvalGraph data={graphData} currentIdx={currentMoveIndex} onSeek={goToMove} />
                  </div>
                )}

                {/* Engine lines */}
                <div className={styles.section}>
                  <div className={styles.engineHeader}>
                    <span className={styles.sectionLabel}>Engine</span>
                    <span className={styles.depthBadge}>D2</span>
                  </div>
                  {engineBusy
                    ? <div className={styles.dim}>Computing...</div>
                    : engineLines.length === 0
                      ? <div className={styles.dim}>Game over</div>
                      : engineLines.map((l, i) => (
                        <div key={i} className={styles.engineLine}>
                          <span className={styles.lineEval} style={{
                            color: l.score > 20 ? '#e8e8e8' : l.score < -20 ? '#e05555' : 'rgba(255,255,255,0.45)'
                          }}>
                            {formatEval(l.score)}
                          </span>
                          <span className={styles.lineMove}>
                            {l.line.map((m, mi) => (
                              <span key={mi} className={mi === 0 ? styles.lineMoveFirst : styles.lineMoveCont}>
                                {m}{' '}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))
                  }
                </div>

                {/* Tablebase result */}
                {tablebaseData && (
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Tablebase</div>
                    <div className={styles.tablebaseResult}>
                      <span className={`${styles.tbCategory} ${styles['tb_' + tablebaseData.category]}`}>
                        {tablebaseData.category === 'win' ? 'White wins' : tablebaseData.category === 'loss' ? 'Black wins' : tablebaseData.category === 'draw' ? 'Draw' : 'Unknown'}
                      </span>
                      {tablebaseData.dtm != null && (
                        <span className={styles.tbDtm}>Mate in {Math.ceil(tablebaseData.dtm / 2)}</span>
                      )}
                      {tablebaseData.bestMove && (
                        <span className={styles.tbBest}>Best: <strong>{tablebaseData.bestMove.san}</strong></span>
                      )}
                    </div>
                    {tablebaseData.moves.length > 0 && (
                      <div className={styles.tbMoves}>
                        {tablebaseData.moves.map(m => (
                          <div key={m.san} className={styles.tbMove}>
                            <span className={styles.tbMoveSan}>{m.san}</span>
                            <span className={`${styles.tbMoveCat} ${styles['tb_' + m.category]}`}>
                              {m.category === 'win' ? 'Win' : m.category === 'loss' ? 'Loss' : m.category === 'draw' ? 'Draw' : '?'}
                            </span>
                            {m.dtz != null && <span className={styles.tbMoveDtz}>DTZ {m.dtz}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Move annotation */}
                {curReview && curClass && curMove && (
                  <div className={styles.annotation} style={{ borderLeftColor: curClass.color }}>
                    <div className={styles.annotIcon} style={{ background: curClass.bg, color: curClass.color }}>
                      {curClass.icon}
                    </div>
                    <div className={styles.annotBody}>
                      <div className={styles.annotTitle}>
                        <strong>{curMove.san}</strong> is {curClass.label}
                      </div>
                      {curReview.bestMoveSan && curReview.bestMoveSan !== curMove.san && (
                        <div className={styles.annotBest}>
                          The best move was <strong>{curReview.bestMoveSan}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Opening */}
                {openingName && <div className={styles.opening}>{openingName}</div>}

                {/* Move list */}
                <div className={styles.moveList} ref={moveListRef}>
                  {moveRows.map(row => {
                    const wR = reviewResults?.[row.whiteIdx];
                    const bR = row.black ? reviewResults?.[row.blackIdx] : null;
                    const wC = wR ? CLASSIFICATIONS[wR.classification] : null;
                    const bC = bR ? CLASSIFICATIONS[bR.classification] : null;
                    return (
                      <div key={row.number} className={styles.moveRow}>
                        <span className={styles.moveN}>{row.number}.</span>
                        <span
                          data-active={currentMoveIndex === row.whiteIdx ? 'true' : 'false'}
                          className={`${styles.moveCell} ${currentMoveIndex === row.whiteIdx ? styles.moveActive : ''}`}
                          onClick={() => goToMove(row.whiteIdx)}
                        >
                          {wC && <span className={styles.moveIcon} style={{ color: wC.color }}>{wC.icon}</span>}
                          {row.white?.san || ''}
                        </span>
                        <span
                          data-active={row.black && currentMoveIndex === row.blackIdx ? 'true' : 'false'}
                          className={`${styles.moveCell} ${row.black && currentMoveIndex === row.blackIdx ? styles.moveActive : ''}`}
                          onClick={() => row.black && goToMove(row.blackIdx)}
                        >
                          {bC && <span className={styles.moveIcon} style={{ color: bC.color }}>{bC.icon}</span>}
                          {row.black?.san || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── EXPLORER TAB ── */}
            {panelTab === 'explorer' && (
              <div className={styles.analysisContent}>
                <OpeningExplorer
                  fen={currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
                    ? moveHistory[currentMoveIndex].fen
                    : chessInstance?.fen()}
                  onPlayMove={(uci, san) => {
                    if (currentMoveIndex < moveHistory.length - 1) return;
                    // Only allow playing moves at the end of the line
                    try {
                      const chess = new Chess(
                        currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
                          ? moveHistory[currentMoveIndex].fen
                          : chessInstance?.fen()
                      );
                      const from = uci.slice(0, 2);
                      const to = uci.slice(2, 4);
                      const promo = uci[4] || undefined;
                      chess.move({ from, to, promotion: promo });
                    } catch {}
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── No game: import area ── */}
            <div className={styles.importTabs}>
              <button className={`${styles.importTab} ${importTab === 'pgn' ? styles.importTabActive : ''}`}
                onClick={() => { setImportTab('pgn'); setExternalError(''); }}>PGN</button>
              <button className={`${styles.importTab} ${importTab === 'chesscom' ? styles.importTabActive : ''}`}
                onClick={() => { setImportTab('chesscom'); setExternalError(''); setPgnError(''); }}>Chess.com</button>
              <button className={`${styles.importTab} ${importTab === 'lichess' ? styles.importTabActive : ''}`}
                onClick={() => { setImportTab('lichess'); setExternalError(''); setPgnError(''); }}>Lichess</button>
              <button className={`${styles.importTab} ${importTab === 'setup' ? styles.importTabActive : ''}`}
                onClick={() => { setImportTab('setup'); setExternalError(''); setPgnError(''); }}>Setup</button>
            </div>

            {/* PGN tab */}
            {importTab === 'pgn' && (
              <div className={styles.inputSection}>
                <textarea
                  className={styles.pgnTextarea}
                  value={pgnInput}
                  onChange={e => { setPgnInput(e.target.value); setPgnError(''); }}
                  placeholder="Paste PGN or FEN here..."
                  rows={8}
                />
                {pgnError && <div className={styles.pgnError}>{pgnError}</div>}
                <input ref={fileRef} type="file" accept=".pgn,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                <div className={styles.importBtns}>
                  <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                    Upload .pgn
                  </button>
                  <button className={styles.analyseBtn} onClick={() => doLoad(pgnInput)}>
                    Analyse
                  </button>
                </div>
              </div>
            )}

            {/* Chess.com / Lichess tab */}
            {(importTab === 'chesscom' || importTab === 'lichess') && (
              <div className={styles.inputSection}>
                <div className={styles.externalHeader}>
                  <span className={styles.externalLogo}>
                    {importTab === 'chesscom' ? 'CC' : 'Li'}
                  </span>
                  <span className={styles.externalTitle}>
                    {importTab === 'chesscom' ? 'Chess.com' : 'Lichess.org'}
                  </span>
                </div>
                <div className={styles.externalRow}>
                  <input
                    className={styles.usernameInput}
                    value={externalUsername}
                    onChange={e => { setExternalUsername(e.target.value); setExternalError(''); }}
                    placeholder="Enter username"
                    onKeyDown={e => e.key === 'Enter' && handleFetchExternal()}
                  />
                  <button className={styles.fetchBtn} onClick={handleFetchExternal} disabled={externalLoading}>
                    {externalLoading ? '...' : 'Fetch'}
                  </button>
                </div>
                {externalError && <div className={styles.pgnError}>{externalError}</div>}
                <p className={styles.externalHint}>Free, no login required. Uses the public API.</p>
              </div>
            )}

            {/* Setup (board editor) tab */}
            {importTab === 'setup' && (
              <BoardEditor onAnalyse={(fen) => doLoad(fen)} />
            )}

            {/* External games list */}
            {externalGames.length > 0 && (
              <div className={styles.savedSection}>
                <div className={styles.sectionLabel}>
                  {externalGames.length} games found
                </div>
                <div className={styles.savedList}>
                  {externalGames.map((g, i) => (
                    <div key={i} className={styles.savedGame} onClick={() => handleLoadGame(g)}>
                      <div className={styles.savedTop}>
                        <span className={`${styles.pDot} ${g.color === 'white' ? styles.pDotW : styles.pDotB}`} />
                        <span className={styles.savedVs}>
                          {g.white} vs {g.black}
                        </span>
                        <span className={`${styles.resBadge} ${styles['res_' + g.result]}`}>
                          {g.result === 'draw' ? '1/2' : g.result === 'win' ? 'W' : 'L'}
                        </span>
                      </div>
                      <div className={styles.savedMeta}>
                        {g.whiteRating && <span>{g.whiteRating}</span>}
                        {g.whiteRating && g.blackRating && <span> vs </span>}
                        {g.blackRating && <span>{g.blackRating}</span>}
                        {g.timeControl && <span> · {g.timeControl}</span>}
                        {g.opening && <span> · {g.opening}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved games from Supabase */}
            {(gamesLoading || savedGames.length > 0) && (
              <div className={styles.savedSection}>
                <div className={styles.sectionLabel}>Your Games</div>
                {gamesLoading && <div className={styles.dim}>Loading...</div>}
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
                            {g.result === 'draw' ? '1/2' : g.result === g.color ? 'W' : 'L'}
                          </span>
                        )}
                      </div>
                      <div className={styles.savedPgn}>{(g.pgnStr || '').slice(0, 60)}...</div>
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
