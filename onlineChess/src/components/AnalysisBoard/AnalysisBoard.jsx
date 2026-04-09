import { useState, useEffect, useRef, useId, useMemo, useCallback, memo } from 'react';
import Board from '../Board/Board';
import styles from './AnalysisBoard.module.css';
import useGameStore from '../../store/gameStore';
import { getTopLinesAsync, cancelPending, precomputeAll } from '../../utils/analysisEngine';
import { Chess } from 'chess.js';
import { CLASSIFICATIONS, reviewGame } from '../../utils/reviewEngine';
import { fetchChessComGames } from '../../utils/chessComService';
import { fetchLichessGames } from '../../utils/lichessService';
import BoardEditor from './BoardEditor';
import OpeningExplorer from './OpeningExplorer';
import { countPieces, fetchTablebase } from '../../utils/tablebaseService';

// ── Persistence helpers ──────────────────────────────────────────────────────

const ANALYSIS_STATE_KEY = 'chess_analysis_state';

function saveAnalysisState(state) {
  try {
    localStorage.setItem(ANALYSIS_STATE_KEY, JSON.stringify(state));
  } catch {}
}

function loadAnalysisState() {
  try {
    const raw = localStorage.getItem(ANALYSIS_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearAnalysisState() {
  try { localStorage.removeItem(ANALYSIS_STATE_KEY); } catch {}
}

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

const CLASS_ORDER = ['brilliant', 'critical', 'best', 'excellent', 'okay', 'inaccuracy', 'mistake', 'blunder', 'theory'];

// Game result description based on accuracy and outcome
function getGameDescription(whiteAcc, blackAcc, pgnHeaders) {
  const result = pgnHeaders?.Result;
  const whiteName = pgnHeaders?.White || 'White';
  const blackName = pgnHeaders?.Black || 'Black';

  if (whiteAcc == null && blackAcc == null) return null;

  const diff = (whiteAcc || 50) - (blackAcc || 50);
  const absDiff = Math.abs(diff);

  if (result === '1-0') {
    if (absDiff > 20) return `${whiteName} dominated the game with superior play.`;
    if (absDiff > 8) return `A competitive game where ${whiteName} found the better moves.`;
    return `A close battle that could have gone either way \u2014 ${whiteName} held on.`;
  }
  if (result === '0-1') {
    if (absDiff > 20) return `${blackName} dominated the game with superior play.`;
    if (absDiff > 8) return `A competitive game where ${blackName} found the better moves.`;
    return `A close battle that could have gone either way \u2014 ${blackName} held on.`;
  }
  if (result === '1/2-1/2') {
    return 'An evenly matched game that ended in a draw.';
  }

  // Fallback for unknown result
  if (absDiff < 5) return 'A closely contested game.';
  if (diff > 0) return `${whiteName} had the edge in accuracy.`;
  return `${blackName} had the edge in accuracy.`;
}

// Classify game character
function getGameCharacter(reviewResults, moveHistory) {
  if (!reviewResults?.length) return null;
  let swings = 0;
  let totalEvalDiff = 0;
  for (let i = 1; i < reviewResults.length; i++) {
    const diff = Math.abs(reviewResults[i].playedScore - reviewResults[i-1].playedScore);
    totalEvalDiff += diff;
    if (diff > 200) swings++;
  }
  const avgDiff = totalEvalDiff / reviewResults.length;
  if (swings >= 4 || avgDiff > 150) return { label: 'WILD', icon: '\u265E' };
  if (avgDiff < 30) return { label: 'STEADY', icon: '\u2694' };
  if (avgDiff < 70) return { label: 'BALANCED', icon: '\u2696' };
  return { label: 'SHARP', icon: '\u26A1' };
}

// ── Eval Graph (Chess.com-style with classification dots + tooltips) ──────────

const NOTABLE_CLASSES = new Set(['brilliant', 'critical', 'inaccuracy', 'mistake', 'blunder']);

const EvalGraph = memo(function EvalGraph({ data, currentIdx, onSeek, large, reviewResults, moveHistory }) {
  const uid = useId().replace(/:/g, '');
  const [hoverIdx, setHoverIdx] = useState(null);
  const containerRef = useRef(null);
  const W = 500, H = large ? 80 : 60, pad = 1;
  const evalToY = s => pad + (H - pad * 2) * (1 - evalToWhitePct(s) / 100);
  const pts = data.map((s, i) => [
    data.length > 1 ? pad + (i / (data.length - 1)) * (W - pad * 2) : W / 2,
    evalToY(s),
  ]);
  const pathD = pts.length > 1 ? 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') : null;
  const fillD = pathD ? `${pathD} L ${pts.at(-1)[0].toFixed(1)},${H / 2} L ${pts[0][0].toFixed(1)},${H / 2} Z` : null;
  const curX  = currentIdx >= 0 && currentIdx < data.length ? pts[currentIdx][0] : null;

  // Classification markers from review results
  const markers = useMemo(() => {
    if (reviewResults?.length) {
      return reviewResults.map((r, i) => {
        if (i >= pts.length || !NOTABLE_CLASSES.has(r.classification)) return null;
        return { x: pts[i][0], y: pts[i][1], cls: CLASSIFICATIONS[r.classification], idx: i };
      }).filter(Boolean);
    }
    // Fallback to diff-based markers when no review results
    const m = [];
    data.forEach((s, i) => {
      if (i === 0) return;
      const diff = Math.abs(s - data[i - 1]);
      if (diff > 200) m.push({ x: pts[i][0], y: pts[i][1], cls: CLASSIFICATIONS.blunder, idx: i });
      else if (diff > 100) m.push({ x: pts[i][0], y: pts[i][1], cls: CLASSIFICATIONS.mistake, idx: i });
    });
    return m;
  }, [reviewResults, data, pts]);

  const handleClick = e => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
  };

  const handleMouseMove = useCallback(e => {
    const r = e.currentTarget.getBoundingClientRect();
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1))));
    setHoverIdx(idx);
  }, [data.length]);

  const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

  // Tooltip data for hovered index
  const tooltip = hoverIdx !== null && pts[hoverIdx] ? (() => {
    const review = reviewResults?.[hoverIdx];
    const cls = review ? CLASSIFICATIONS[review.classification] : null;
    const move = moveHistory?.[hoverIdx];
    const score = data[hoverIdx];
    const xPct = (pts[hoverIdx][0] / W) * 100;
    return { cls, move, score, xPct, review };
  })() : null;

  return (
    <div ref={containerRef} className={styles.evalGraphContainer}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
    >
      <svg className={styles.evalGraph} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onClick={handleClick}>
        <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.35)" rx={4} />
        <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
        {fillD && (
          <>
            <clipPath id={`ug${uid}`}><rect x={0} y={0} width={W} height={H/2} /></clipPath>
            <clipPath id={`lg${uid}`}><rect x={0} y={H/2} width={W} height={H/2} /></clipPath>
            <path d={fillD} fill="rgba(255,255,255,0.15)" clipPath={`url(#ug${uid})`} />
            <path d={fillD} fill="rgba(0,0,0,0.35)" clipPath={`url(#lg${uid})`} />
          </>
        )}
        {pathD && <path d={pathD} fill="none" stroke="rgba(0,255,245,0.55)" strokeWidth={1.5} strokeLinejoin="round" />}
        {markers.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={large ? 4 : 3}
            fill={m.cls.color} opacity={0.85} stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
        ))}
        {/* Hover cursor line */}
        {hoverIdx !== null && pts[hoverIdx] && (
          <>
            <line x1={pts[hoverIdx][0]} y1={pad} x2={pts[hoverIdx][0]} y2={H-pad}
              stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
            <circle cx={pts[hoverIdx][0]} cy={pts[hoverIdx][1]} r={3.5}
              fill="#fff" stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
          </>
        )}
        {/* Current position cursor (when not hovering) */}
        {hoverIdx === null && curX !== null && (
          <>
            <line x1={curX} y1={pad} x2={curX} y2={H-pad} stroke="rgba(255,255,255,0.45)" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={curX} cy={evalToY(data[currentIdx])} r={3} fill="#00fff5" stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
          </>
        )}
      </svg>
      {/* Tooltip */}
      {tooltip && tooltip.cls && (
        <div className={styles.graphTooltip} style={{
          left: `${Math.max(8, Math.min(92, tooltip.xPct))}%`,
        }}>
          <span className={styles.tooltipIcon} style={{ background: tooltip.cls.bg, color: tooltip.cls.color }}>
            {tooltip.cls.icon}
          </span>
          <div className={styles.tooltipInfo}>
            <span className={styles.tooltipEval}>{formatEval(tooltip.score)}</span>
            <span className={styles.tooltipMove}>{tooltip.move?.san || ''}</span>
          </div>
        </div>
      )}
    </div>
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

// ── Animated Accuracy Counter ─────────────────────────────────────────────────

function AnimatedAccuracy({ value, color }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (value == null) return;
    let start = null;
    const duration = 1200;
    const from = 0;
    const to = value;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  if (value == null) return <span className={styles.accValue} style={{ color: 'rgba(255,255,255,0.3)' }}>--</span>;
  const accColor = value >= 85 ? '#3ddc84' : value >= 65 ? '#f0c94c' : '#e05555';
  return <span className={styles.accValue} style={{ color: accColor }}>{display}</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalysisBoard({ savedGames = [], gamesLoading = false, pendingPgn = null, onPendingPgnConsumed = null }) {
  const {
    moveHistory, currentMoveIndex, goToMove,
    chessInstance, importPgn, flipped, setFlipped,
  } = useGameStore();

  // UI state
  const [panelTab, setPanelTab]             = useState('report');
  const [importTab, setImportTab]           = useState('pgn');
  const [currentEval, setCurrentEval]       = useState(0);
  const [engineLines, setEngineLines]       = useState([]);
  const [engineBusy, setEngineBusy]         = useState(false);
  const [reviewResults, setReviewResults]   = useState(null);
  const [isReviewing, setIsReviewing]       = useState(false);
  const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 });
  const [partialReviewData, setPartialReviewData] = useState([]);
  const [pgnInput, setPgnInput]             = useState('');
  const [pgnError, setPgnError]             = useState('');
  const [gameLoaded, setGameLoaded]         = useState(false);
  const [evalHistory, setEvalHistory]       = useState([]);
  const [pgnHeaders, setPgnHeaders]         = useState({});
  const [liveOpeningName, setLiveOpeningName] = useState(null);
  const [tablebaseData, setTablebaseData]   = useState(null);
  const [externalUsername, setExternalUsername] = useState('');
  const [externalGames, setExternalGames]     = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError]     = useState('');
  // Track the PGN string that was loaded (for persistence)
  const [loadedPgn, setLoadedPgn]           = useState(null);
  // Animation states for report
  const [reportAnimated, setReportAnimated] = useState(false);
  // Pre-computation loading state
  const [isPrecomputing, setIsPrecomputing] = useState(false);
  const [precomputeProgress, setPrecomputeProgress] = useState({ current: 0, total: 0 });

  const openingAbortRef = useRef(null);
  const evalTimerRef = useRef(null);
  const moveListRef  = useRef(null);
  const fileRef      = useRef(null);
  const restoredRef  = useRef(false);
  const reviewAbortRef = useRef(null);

  // ── Restore state on mount ────────────────────────────────────────────────

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadAnalysisState();
    if (!saved?.pgn) {
      // No saved state — initialize board so moves can be played immediately
      importPgn('');
      return;
    }
    const ok = importPgn(saved.pgn);
    if (!ok) { clearAnalysisState(); return; }
    setLoadedPgn(saved.pgn);
    setGameLoaded(true);
    if (saved.reviewResults) setReviewResults(saved.reviewResults);
    if (saved.pgnHeaders) setPgnHeaders(saved.pgnHeaders);
    if (saved.panelTab) setPanelTab(saved.panelTab);
    if (saved.evalHistory) setEvalHistory(saved.evalHistory);
    if (typeof saved.currentMoveIndex === 'number' && saved.currentMoveIndex >= 0) {
      setTimeout(() => goToMove(saved.currentMoveIndex), 50);
    }
    // Skip animation on restore
    if (saved.reviewResults) setReportAnimated(true);
  }, []); // eslint-disable-line

  // ── Persist state on changes ──────────────────────────────────────────────

  useEffect(() => {
    if (!gameLoaded || !loadedPgn) return;
    saveAnalysisState({
      pgn: loadedPgn,
      reviewResults,
      pgnHeaders,
      panelTab,
      evalHistory,
      currentMoveIndex,
    });
  }, [gameLoaded, loadedPgn, reviewResults, pgnHeaders, panelTab, evalHistory, currentMoveIndex]);

  // Analysis mode: board is interactive — players can try alternative moves

  // Auto-load PGN from post-game review and start analysis
  useEffect(() => {
    if (!pendingPgn) return;
    const ok = importPgn(pendingPgn);
    if (ok) {
      setLoadedPgn(pendingPgn);
      setGameLoaded(true);
      setReviewResults(null);
      setPanelTab('report');
      setReportAnimated(false);
      setTimeout(async () => {
        const history = useGameStore.getState().moveHistory;
        if (!history.length) return;
        setIsReviewing(true);
        setPartialReviewData([]);
        setReviewProgress({ current: 0, total: history.length });
        try {
          const results = await reviewGame(history, (cur, tot, partial) => {
            setReviewProgress({ current: cur, total: tot });
            setPartialReviewData([...partial]);
          });
          setReviewResults(results);
          setPartialReviewData([]);
          setReportAnimated(false);
          setTimeout(() => setReportAnimated(true), 50);
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
    // Pre-compute evaluations for all positions with progress
    const fens = moveHistory.map(m => m.fen).filter(Boolean);
    if (fens.length) {
      setIsPrecomputing(true);
      setPrecomputeProgress({ current: 0, total: fens.length });
      precomputeAll(fens, 3, (cur, tot) => setPrecomputeProgress({ current: cur, total: tot }))
        .then(() => setIsPrecomputing(false))
        .catch(() => setIsPrecomputing(false));
    }
  }, [gameLoaded]);

  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;
    clearTimeout(evalTimerRef.current);
    setEngineBusy(true);
    let cancelled = false;
    evalTimerRef.current = setTimeout(async () => {
      try {
        const fen = currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
          ? moveHistory[currentMoveIndex].fen : chessInstance.fen();
        const lines = await getTopLinesAsync(fen, 3);
        if (cancelled) return;
        const ev = lines.length > 0 ? lines[0].score : 0;
        setEngineLines(lines);
        setCurrentEval(ev);
        if (currentMoveIndex >= 0) {
          setEvalHistory(prev => { const n = [...prev]; n[currentMoveIndex] = ev; return n; });
        }
        if (openingAbortRef.current) openingAbortRef.current.abort?.();
        fetchOpeningName(fen).then(name => { if (name && !cancelled) setLiveOpeningName(name); }).catch(err => console.error('Opening fetch error:', err));
      } catch (err) { if (!cancelled) console.error('Engine eval error:', err); }
      finally { if (!cancelled) setEngineBusy(false); }
    }, 150);
    return () => { cancelled = true; clearTimeout(evalTimerRef.current); cancelPending(); };
  }, [currentMoveIndex, gameLoaded, chessInstance]);

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
      setLoadedPgn(cleanPgn || pgnStr);
      setGameLoaded(true);
      setReviewResults(null);
      setPgnInput('');
      setPanelTab('report');
      setReportAnimated(false);
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

  const cancelReview = () => {
    if (reviewAbortRef.current) {
      reviewAbortRef.current.abort();
      reviewAbortRef.current = null;
    }
    setIsReviewing(false);
    setReviewProgress({ current: 0, total: 0 });
  };

  const handleReview = async () => {
    if (!moveHistory.length) return;
    // If already reviewing, cancel instead
    if (isReviewing) { cancelReview(); return; }
    const controller = new AbortController();
    reviewAbortRef.current = controller;
    setIsReviewing(true); setReviewResults(null);
    setPartialReviewData([]);
    setReviewProgress({ current: 0, total: moveHistory.length });
    setReportAnimated(false);
    try {
      const results = await reviewGame(moveHistory, (current, total, partial) => {
        setReviewProgress({ current, total });
        setPartialReviewData([...partial]);
      }, controller.signal);
      if (!controller.signal.aborted) {
        setReviewResults(results);
        setPartialReviewData([]);
        setPanelTab('report');
        setTimeout(() => setReportAnimated(true), 50);
      }
    } finally {
      setIsReviewing(false);
      setReviewProgress({ current: 0, total: 0 });
      reviewAbortRef.current = null;
    }
  };

  const handleNewGame = () => {
    setGameLoaded(false); setReviewResults(null);
    setEngineLines([]); setCurrentEval(0);
    setEvalHistory([]); setPgnHeaders({}); setPgnError('');
    setLiveOpeningName(null); setExternalGames([]); setExternalError('');
    setLoadedPgn(null); setReportAnimated(false);
    clearAnalysisState();
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
    // Show real-time graph during review
    if (partialReviewData?.length > 1) {
      return partialReviewData.map((r, i) => moveHistory[i]?.color === 'w' ? r.playedScore : -r.playedScore);
    }
    if (evalHistory.some(v => v !== undefined)) {
      const out = [];
      for (let i = 0; i < moveHistory.length; i++) {
        if (evalHistory[i] !== undefined) out.push(evalHistory[i]); else break;
      }
      return out.length > 1 ? out : [];
    }
    return [];
  }, [reviewResults, partialReviewData, evalHistory, moveHistory]);

  const whitePct      = evalToWhitePct(currentEval);
  const displayPct    = whitePct;
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

  const curReview = reviewResults && currentMoveIndex >= 0 ? reviewResults[currentMoveIndex] : null;
  const curClass  = curReview ? CLASSIFICATIONS[curReview.classification] : null;
  const curMove   = currentMoveIndex >= 0 ? moveHistory[currentMoveIndex] : null;

  const gameCharacter = useMemo(() => getGameCharacter(reviewResults, moveHistory), [reviewResults, moveHistory]);
  const gameDesc = useMemo(() => getGameDescription(whiteAcc, blackAcc, pgnHeaders), [whiteAcc, blackAcc, pgnHeaders]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* ── When no game loaded: centered import ── */}
      {!gameLoaded && (
        <div className={styles.importCenter}>
          <div className={styles.importCard}>
            <div className={styles.importHeader}>
              <span className={styles.importTitle}>Game Analysis</span>
              <span className={styles.importSubtitle}>Import a game to analyse</span>
            </div>

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
                  <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>Upload .pgn</button>
                  <button className={styles.analyseBtn} onClick={() => doLoad(pgnInput)}>Analyse</button>
                </div>
              </div>
            )}

            {(importTab === 'chesscom' || importTab === 'lichess') && (
              <div className={styles.inputSection}>
                <div className={styles.externalHeader}>
                  <span className={styles.externalLogo}>{importTab === 'chesscom' ? 'CC' : 'Li'}</span>
                  <span className={styles.externalTitle}>{importTab === 'chesscom' ? 'Chess.com' : 'Lichess.org'}</span>
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

            {importTab === 'setup' && (
              <BoardEditor onAnalyse={(fen) => doLoad(fen)} />
            )}

            {externalGames.length > 0 && (
              <div className={styles.savedSection}>
                <div className={styles.sectionLabel}>{externalGames.length} games found</div>
                <div className={styles.savedList}>
                  {externalGames.map((g, i) => (
                    <div key={i} className={styles.savedGame} onClick={() => handleLoadGame(g)}>
                      <div className={styles.savedTop}>
                        <span className={`${styles.pDot} ${g.color === 'white' ? styles.pDotW : styles.pDotB}`} />
                        <span className={styles.savedVs}>{g.white} vs {g.black}</span>
                        <span className={`${styles.resBadge} ${styles['res_' + g.result]}`}>
                          {g.result === 'draw' ? '1/2' : g.result === 'win' ? 'W' : 'L'}
                        </span>
                      </div>
                      <div className={styles.savedMeta}>
                        {g.whiteRating && <span>{g.whiteRating}</span>}
                        {g.whiteRating && g.blackRating && <span> vs </span>}
                        {g.blackRating && <span>{g.blackRating}</span>}
                        {g.timeControl && <span> &middot; {g.timeControl}</span>}
                        {g.opening && <span> &middot; {g.opening}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          {g.color === 'white' ? 'W' : 'B'} &middot; {g.opponent || 'vs Opponent'}
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
          </div>
        </div>
      )}

      {/* ── Pre-computing animation ── */}
      {gameLoaded && isPrecomputing && (
        <div className={styles.precomputeOverlay}>
          <div className={styles.precomputeCard}>
            <div className={styles.precomputeChess}>
              <svg viewBox="0 0 100 100" width="96" height="96" className={styles.precomputeRing}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,255,245,0.08)" strokeWidth="3" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#00fff5" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - (precomputeProgress.total ? precomputeProgress.current / precomputeProgress.total : 0))}`}
                  style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
              <svg viewBox="0 0 45 45" width="48" height="48" className={`${styles.precomputeSpin} ${styles.precomputeKingInner}`}>
                <g fill="none" fillRule="evenodd" stroke="#00fff5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.5 11.63V6M20 8h5" strokeOpacity="0.9"/>
                  <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#00fff5" fillOpacity="0.15"/>
                  <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="#00fff5" fillOpacity="0.1"/>
                </g>
              </svg>
            </div>
            <div className={styles.precomputeTitle}>Analysing Positions</div>
            <div className={styles.precomputeProgress}>
              {Math.ceil(precomputeProgress.current / 2)} / {Math.ceil(precomputeProgress.total / 2)} moves
            </div>
            <div className={styles.precomputeBarTrack}>
              <div className={styles.precomputeBarFill} style={{
                width: `${precomputeProgress.total ? (precomputeProgress.current / precomputeProgress.total) * 100 : 0}%`
              }} />
            </div>
            <div className={styles.precomputeHint}>Computing engine evaluations...</div>
          </div>
        </div>
      )}

      {/* ── Game loaded ── */}
      {gameLoaded && !isPrecomputing && (
        <div className={styles.analysisMain}>
          {/* Top bar with tabs + actions */}
          <div className={styles.topBar}>
            <div className={styles.tabRow}>
              <button className={`${styles.tab} ${panelTab === 'report' ? styles.tabActive : ''}`}
                onClick={() => setPanelTab('report')}>Report</button>
              <button className={`${styles.tab} ${panelTab === 'analysis' ? styles.tabActive : ''}`}
                onClick={() => setPanelTab('analysis')}>Analysis</button>
              <button className={`${styles.tab} ${panelTab === 'explorer' ? styles.tabActive : ''}`}
                onClick={() => setPanelTab('explorer')}>Explorer</button>
            </div>
            <div className={styles.topActions}>
              <button className={styles.iconBtn} onClick={() => setFlipped(f => !f)} title="Flip board">&#x21C5;</button>
              <button
                className={`${styles.iconBtn} ${reviewResults ? styles.iconBtnDone : ''}`}
                onClick={handleReview}
                disabled={isReviewing || !moveHistory.length}
                title="Review game"
              >
                {isReviewing ? `${Math.ceil(reviewProgress.current/2)}/${Math.ceil(reviewProgress.total/2)}` : '\u27F3'}
              </button>
              <button className={`${styles.iconBtn} ${styles.importBtn}`} onClick={handleNewGame} title="Import new game">
                &#x2795; New
              </button>
            </div>
          </div>

          {/* Review progress bar */}
          {isReviewing && (
            <div className={styles.reviewProgress}>
              <div className={styles.reviewBar} style={{ width: `${(reviewProgress.current / reviewProgress.total) * 100}%` }} />
            </div>
          )}

          {/* ── REPORT TAB: chess.com-style full report ── */}
          {panelTab === 'report' && (
            <div className={styles.reportScroll}>
              <div className={styles.reportCenter}>
                {/* Score card — only show when there's data to display */}
                {(moveHistory.length > 0 || reviewResults) && (
                <div className={`${styles.scoreCard} ${reportAnimated ? styles.scoreCardAnimated : ''}`}>
                  {/* Result */}
                  <div className={styles.scoreResult}>
                    {pgnHeaders.Result || (moveHistory.length > 0 ? '*' : '')}
                  </div>

                  {/* Players row */}
                  <div className={styles.playersRow}>
                    <div className={styles.playerCard}>
                      <div className={styles.playerAvatar}>
                        <span className={`${styles.avatarDot} ${styles.avatarDotW}`} />
                      </div>
                      <AnimatedAccuracy value={whiteAcc} />
                      <span className={styles.playerAccLabel}>Accuracy</span>
                      <span className={styles.playerName}>{pgnHeaders.White || 'White'}</span>
                    </div>

                    <div className={styles.vsSection}>
                      {gameCharacter && (
                        <div className={styles.gameCharacter}>
                          <span className={styles.characterIcon}>{gameCharacter.icon}</span>
                          <span className={styles.characterLabel}>{gameCharacter.label}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.playerCard}>
                      <div className={styles.playerAvatar}>
                        <span className={`${styles.avatarDot} ${styles.avatarDotB}`} />
                      </div>
                      <AnimatedAccuracy value={blackAcc} />
                      <span className={styles.playerAccLabel}>Accuracy</span>
                      <span className={styles.playerName}>{pgnHeaders.Black || 'Black'}</span>
                    </div>
                  </div>

                  {/* Game description */}
                  {gameDesc && (
                    <div className={styles.gameDescription}>{gameDesc}</div>
                  )}
                </div>
                )}

                {/* Eval graph */}
                {graphData.length > 1 && (
                  <div className={styles.reportGraphWrap}>
                    <EvalGraph data={graphData} currentIdx={currentMoveIndex} onSeek={goToMove} large
                      reviewResults={reviewResults} moveHistory={moveHistory} />
                  </div>
                )}

                {/* Accuracies — Chess.com-style side-by-side */}
                {reviewResults && (whiteAcc !== null || blackAcc !== null) && (
                  <div className={styles.accuraciesCard}>
                    <div className={styles.accuraciesTitle}>Accuracies</div>
                    <div className={styles.accuraciesRow}>
                      <div className={styles.accuracyWhite}>
                        {whiteAcc !== null ? `${whiteAcc}%` : '--'}
                      </div>
                      <div className={styles.accuracyBlack}>
                        {blackAcc !== null ? `${blackAcc}%` : '--'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ELO estimation */}
                {reviewResults && (whiteAcc !== null || blackAcc !== null) && (
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

                {/* Classification table - chess.com style */}
                {reviewResults && (
                  <div className={styles.reportSection}>
                    <table className={styles.classTable}>
                      <thead>
                        <tr>
                          <th className={styles.classColHead}>W</th>
                          <th></th>
                          <th></th>
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
                              <td className={styles.classCountW} style={{ color: wN > 0 ? cls.color : 'rgba(255,255,255,0.2)' }}>{wN}</td>
                              <td className={styles.classIcon} style={{ color: cls.color }}>{cls.icon}</td>
                              <td className={styles.classLabel} style={{ color: cls.color }}>{cls.label}</td>
                              <td className={styles.classCountB} style={{ color: bN > 0 ? cls.color : 'rgba(255,255,255,0.2)' }}>{bN}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Opening info */}
                {openingName && (
                  <div className={styles.reportSection}>
                    <div className={styles.sectionLabel}>Opening</div>
                    <div className={styles.openingText}>{openingName}</div>
                  </div>
                )}

                {/* Review prompt if not reviewed */}
                {!reviewResults && !isReviewing && moveHistory.length > 0 && (
                  <div className={styles.reviewPrompt}>
                    <button className={styles.reviewBtn} onClick={handleReview}>
                      &#x27F3; Review Game
                    </button>
                    <p className={styles.reviewHint}>Analyse each move to see accuracy, classifications, and the evaluation graph.</p>
                  </div>
                )}

                {/* Import options when no game to review */}
                {!reviewResults && !isReviewing && moveHistory.length === 0 && (
                  <div className={styles.inlineImport}>
                    <div className={styles.inlineImportTitle}>Import a game to analyse</div>
                    <div className={styles.importTabs}>
                      <button className={`${styles.importTab} ${importTab === 'pgn' ? styles.importTabActive : ''}`}
                        onClick={() => { setImportTab('pgn'); setExternalError(''); }}>PGN / FEN</button>
                      <button className={`${styles.importTab} ${importTab === 'chesscom' ? styles.importTabActive : ''}`}
                        onClick={() => { setImportTab('chesscom'); setExternalError(''); setPgnError(''); }}>Chess.com</button>
                      <button className={`${styles.importTab} ${importTab === 'lichess' ? styles.importTabActive : ''}`}
                        onClick={() => { setImportTab('lichess'); setExternalError(''); setPgnError(''); }}>Lichess</button>
                      <button className={`${styles.importTab} ${importTab === 'setup' ? styles.importTabActive : ''}`}
                        onClick={() => { setImportTab('setup'); setExternalError(''); setPgnError(''); }}>Setup</button>
                    </div>

                    {importTab === 'pgn' && (
                      <div className={styles.inputSection}>
                        <textarea
                          className={styles.pgnTextarea}
                          value={pgnInput}
                          onChange={e => { setPgnInput(e.target.value); setPgnError(''); }}
                          placeholder="Paste PGN or FEN here..."
                          rows={6}
                        />
                        {pgnError && <div className={styles.pgnError}>{pgnError}</div>}
                        <input ref={fileRef} type="file" accept=".pgn,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                        <div className={styles.importBtns}>
                          <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>Upload .pgn</button>
                          <button className={styles.analyseBtn} onClick={() => doLoad(pgnInput)}>Analyse</button>
                        </div>
                      </div>
                    )}

                    {(importTab === 'chesscom' || importTab === 'lichess') && (
                      <div className={styles.inputSection}>
                        <div className={styles.externalHeader}>
                          <span className={styles.externalLogo}>{importTab === 'chesscom' ? 'CC' : 'Li'}</span>
                          <span className={styles.externalTitle}>{importTab === 'chesscom' ? 'Chess.com' : 'Lichess.org'}</span>
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

                    {importTab === 'setup' && (
                      <BoardEditor onAnalyse={(fen) => doLoad(fen)} />
                    )}

                    {externalGames.length > 0 && (
                      <div className={styles.savedSection}>
                        <div className={styles.sectionLabel}>{externalGames.length} games found</div>
                        <div className={styles.savedList}>
                          {externalGames.map((g, i) => (
                            <div key={i} className={styles.savedGame} onClick={() => handleLoadGame(g)}>
                              <div className={styles.savedTop}>
                                <span className={`${styles.pDot} ${g.color === 'white' ? styles.pDotW : styles.pDotB}`} />
                                <span className={styles.savedVs}>{g.white} vs {g.black}</span>
                                <span className={`${styles.resBadge} ${styles['res_' + g.result]}`}>
                                  {g.result === 'draw' ? '1/2' : g.result === 'win' ? 'W' : 'L'}
                                </span>
                              </div>
                              <div className={styles.savedMeta}>
                                {g.whiteRating && <span>{g.whiteRating}</span>}
                                {g.whiteRating && g.blackRating && <span> vs </span>}
                                {g.blackRating && <span>{g.blackRating}</span>}
                                {g.timeControl && <span> &middot; {g.timeControl}</span>}
                                {g.opening && <span> &middot; {g.opening}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                                  {g.color === 'white' ? 'W' : 'B'} &middot; {g.opponent || 'vs Opponent'}
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
                  </div>
                )}

                {/* Reviewing animation — Chess.com-style progress */}
                {isReviewing && (
                  <div className={styles.reviewingSection}>
                    <div className={styles.evalProgressCard}>
                      <div className={styles.evalProgressHeader}>
                        <span className={styles.evalProgressTitle}>Evaluating...</span>
                        <span className={styles.evalProgressPct}>
                          {reviewProgress.total ? ((reviewProgress.current / reviewProgress.total) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className={styles.evalProgressTrack}>
                        <div className={styles.evalProgressFill} style={{
                          width: `${reviewProgress.total ? (reviewProgress.current / reviewProgress.total) * 100 : 0}%`
                        }} />
                      </div>
                      <p className={styles.evalProgressHint}>
                        Analysing {Math.ceil(reviewProgress.current/2)} of {Math.ceil(reviewProgress.total/2)} moves...
                      </p>
                    </div>
                    {/* Real-time graph building up during review */}
                    {graphData.length > 1 && (
                      <div className={styles.reportGraphWrap}>
                        <EvalGraph data={graphData} currentIdx={-1} onSeek={() => {}} large
                          reviewResults={partialReviewData.length ? partialReviewData : null}
                          moveHistory={moveHistory} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ANALYSIS TAB: board + engine ── */}
          {panelTab === 'analysis' && (
            <div className={styles.analysisLayout}>
              <div className={styles.analysisBoardSection}>
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

                {/* Eval bar + board */}
                <div className={styles.boardRow}>
                  <div className={styles.evalBar} style={{ flexDirection: flipped ? 'column' : 'column-reverse' }}>
                    <div className={styles.evalWhite} style={{ height: `${displayPct}%` }} />
                    <div className={styles.evalBlack} />
                    <span className={styles.evalScore} style={{
                      top: flipped ? (displayPct >= 55 ? 'auto' : '4px') : (displayPct >= 55 ? '4px' : 'auto'),
                      bottom: flipped ? (displayPct >= 55 ? '4px' : 'auto') : (displayPct >= 55 ? 'auto' : '4px'),
                      color: flipped ? (displayPct >= 55 ? '#000' : '#eee') : (displayPct >= 55 ? '#eee' : '#000'),
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

                {/* Nav */}
                <div className={styles.navRow}>
                  <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">|&#x25C0;</button>
                  <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex < 0} title="Prev">&#x25C0;</button>
                  <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moveHistory.length - 1} title="Next">&#x25B6;</button>
                  <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">&#x25B6;|</button>
                </div>
              </div>

              {/* Engine + move list panel */}
              <div className={styles.analysisPanel}>
                {/* Eval graph */}
                {graphData.length > 1 && (
                  <div className={styles.graphWrapSmall}>
                    <EvalGraph data={graphData} currentIdx={currentMoveIndex} onSeek={goToMove}
                      reviewResults={reviewResults} moveHistory={moveHistory} />
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

                {/* Tablebase */}
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
            </div>
          )}

          {/* ── EXPLORER TAB ── */}
          {panelTab === 'explorer' && (
            <div className={styles.analysisLayout}>
              <div className={styles.analysisBoardSection}>
                <div className={styles.playerBar}>
                  <div className={styles.playerLeft}>
                    <span className={`${styles.pDot} ${topColor === 'w' ? styles.pDotW : styles.pDotB}`} />
                    <span className={styles.pName}>{topName}</span>
                  </div>
                </div>
                <div className={styles.boardRow}>
                  <div className={styles.evalBar} style={{ flexDirection: flipped ? 'column' : 'column-reverse' }}>
                    <div className={styles.evalWhite} style={{ height: `${displayPct}%` }} />
                    <div className={styles.evalBlack} />
                    <span className={styles.evalScore} style={{
                      top: flipped ? (displayPct >= 55 ? 'auto' : '4px') : (displayPct >= 55 ? '4px' : 'auto'),
                      bottom: flipped ? (displayPct >= 55 ? '4px' : 'auto') : (displayPct >= 55 ? 'auto' : '4px'),
                      color: flipped ? (displayPct >= 55 ? '#000' : '#eee') : (displayPct >= 55 ? '#eee' : '#000'),
                    }}>{formatEval(currentEval)}</span>
                  </div>
                  <div className={styles.boardWrap}>
                    <Board />
                  </div>
                </div>
                <div className={styles.playerBar}>
                  <div className={styles.playerLeft}>
                    <span className={`${styles.pDot} ${botColor === 'w' ? styles.pDotW : styles.pDotB}`} />
                    <span className={styles.pName}>{bottomName}</span>
                  </div>
                </div>
                <div className={styles.navRow}>
                  <button className={styles.navBtn} onClick={() => goToMove(-1)} title="Start">|&#x25C0;</button>
                  <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex < 0} title="Prev">&#x25C0;</button>
                  <button className={styles.navBtn} onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= moveHistory.length - 1} title="Next">&#x25B6;</button>
                  <button className={styles.navBtn} onClick={() => goToMove(moveHistory.length - 1)} title="End">&#x25B6;|</button>
                </div>
              </div>
              <div className={styles.analysisPanel}>
                <OpeningExplorer
                  fen={currentMoveIndex >= 0 && moveHistory[currentMoveIndex]
                    ? moveHistory[currentMoveIndex].fen
                    : chessInstance?.fen()}
                  onPlayMove={(uci) => {
                    const from = uci.slice(0, 2);
                    const to = uci.slice(2, 4);
                    const promo = uci[4] || undefined;
                    const fromRow = 8 - parseInt(from[1]);
                    const fromCol = from.charCodeAt(0) - 97;
                    const toRow = 8 - parseInt(to[1]);
                    const toCol = to.charCodeAt(0) - 97;
                    useGameStore.getState().makeMove(
                      { row: fromRow, col: fromCol },
                      { row: toRow, col: toCol },
                      promo,
                      true
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
