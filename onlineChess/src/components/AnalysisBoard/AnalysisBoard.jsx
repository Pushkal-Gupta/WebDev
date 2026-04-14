import { useState, useEffect, useRef, useId, useMemo, useCallback, memo } from 'react';
import Board from '../Board/Board';
import styles from './AnalysisBoard.module.css';
import useGameStore from '../../store/gameStore';
import { getTopLinesAsync, analyzeGame, ANALYSIS_PASSES } from '../../utils/analysisEngine';
import { Chess } from 'chess.js';
import { CLASSIFICATIONS, classifyFromEvals, explainMove, classifyPhases } from '../../utils/reviewEngine';
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
const _ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q';
async function fetchOpeningName(fen) {
  if (_openingCache.has(fen)) return _openingCache.get(fen);
  try {
    const params = new URLSearchParams({ fen, db: 'masters' });
    const res = await fetch(
      `https://ykpjmvoyatcrlqyqbgfu.supabase.co/functions/v1/opening-explorer?${params}`,
      {
        headers: { Accept: 'application/json', apikey: _ANON_KEY, Authorization: `Bearer ${_ANON_KEY}` },
        signal: AbortSignal.timeout(5000),
      }
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
  // Smooth curve using Catmull-Rom → Bezier for a gentler line than straight segments.
  const pathD = pts.length > 1 ? (() => {
    let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  })() : null;
  const fillD = pathD ? `${pathD} L ${pts.at(-1)[0].toFixed(1)},${H} L ${pts[0][0].toFixed(1)},${H} Z` : null;
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
        <defs>
          <linearGradient id={`ag${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,255,245,0.22)" />
            <stop offset="100%" stopColor="rgba(0,255,245,0)" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.35)" rx={4} />
        <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} strokeDasharray="2 3" />
        {fillD && <path d={fillD} fill={`url(#ag${uid})`} />}
        {pathD && <path d={pathD} fill="none" stroke="rgba(0,255,245,0.7)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />}
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

// ── Accuracy Ring Gauge (chess.com-style circular gauge) ─────────────────────

function AccuracyRing({ value, label, name, dotClass }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (value == null) return;
    let start = null;
    const duration = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const r = 38, cx = 44, cy = 44, circ = 2 * Math.PI * r;
  const pct = value != null ? Math.min(100, Math.max(0, value)) : 0;
  const offset = circ * (1 - pct / 100);
  const ringColor = value == null ? 'rgba(255,255,255,0.1)' : value >= 85 ? '#3ddc84' : value >= 65 ? '#f0c94c' : '#e05555';

  return (
    <div className={styles.accRing}>
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        {value != null && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringColor} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
      </svg>
      <div className={styles.accRingInner}>
        <span className={styles.accRingValue} style={{ color: ringColor }}>
          {value != null ? display : '--'}
        </span>
      </div>
      <div className={styles.accRingLabel}>ACCURACY</div>
      <div className={styles.accRingName}>
        <span className={`${styles.accRingDot} ${dotClass}`} />
        {name}
      </div>
    </div>
  );
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
  // reviewProgress is now handled via precomputeProgress (Stockfish 4-pass)
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
  const [precomputeProgress, setPrecomputeProgress] = useState({ current: 0, total: 0, passIndex: 0, passLabel: '', totalPasses: ANALYSIS_PASSES.length });

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

  // Auto-load PGN from post-game review — 4-pass analysis auto-starts via [gameLoaded] effect
  useEffect(() => {
    if (!pendingPgn) return;
    const ok = importPgn(pendingPgn);
    if (ok) {
      setLoadedPgn(pendingPgn);
      setGameLoaded(true);
      setReviewResults(null);
      setPanelTab('report');
      setReportAnimated(false);
    }
    if (onPendingPgnConsumed) onPendingPgnConsumed();
  }, [pendingPgn]); // eslint-disable-line

  // Ref to hold the evolving evals map across passes (avoids stale closures)
  const evalsMapRef = useRef(new Map());

  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;
    try { setPgnHeaders(chessInstance.header?.() || {}); } catch { setPgnHeaders({}); }
    setEvalHistory([]);
    setReviewResults(null);
    setPartialReviewData([]);

    const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    // Collect all unique FENs needed: starting pos + after each move
    const allFens = [START_FEN, ...moveHistory.map(m => m.fen).filter(Boolean)];
    const uniqueFens = [...new Set(allFens)];
    if (uniqueFens.length < 2) return;

    // Build index: which evalHistory slot each FEN maps to (after-move FENs)
    const fenToMoveIdx = new Map();
    moveHistory.forEach((m, i) => { if (m.fen) fenToMoveIdx.set(m.fen, i); });

    evalsMapRef.current = new Map();
    setIsPrecomputing(true);
    setIsReviewing(true);
    setPrecomputeProgress({ current: 0, total: uniqueFens.length, passIndex: 0, passLabel: ANALYSIS_PASSES[0].label, totalPasses: ANALYSIS_PASSES.length });

    const controller = new AbortController();
    reviewAbortRef.current = controller;

    analyzeGame(uniqueFens, {
      signal: controller.signal,
      onPassStart(passIndex, _depth, label) {
        setPrecomputeProgress(prev => ({ ...prev, current: 0, passIndex, passLabel: label }));
      },
      onPositionDone(idx, fen, result, passIndex) {
        evalsMapRef.current.set(fen, { score: result.score, bestMove: result.bestMove, depth: ANALYSIS_PASSES[passIndex].depth });
        // Update eval chart for after-move FENs
        const moveIdx = fenToMoveIdx.get(fen);
        if (moveIdx !== undefined) {
          setEvalHistory(prev => {
            const next = [...prev];
            next[moveIdx] = result.score;
            return next;
          });
        }
      },
      onProgress(cur, tot, passIndex) {
        setPrecomputeProgress(prev => ({ ...prev, current: cur, total: tot, passIndex }));
      },
      onPassDone(passIndex, evals) {
        // Reclassify all moves with the latest evals
        const history = useGameStore.getState().moveHistory;
        const results = classifyFromEvals(history, evals);
        if (results) {
          setPartialReviewData([...results]);
          setReviewResults(results);
          if (passIndex === 0) {
            setPanelTab('report');
            setReportAnimated(false);
            setTimeout(() => setReportAnimated(true), 50);
          }
        }
      },
    })
      .then(() => { setIsPrecomputing(false); setIsReviewing(false); })
      .catch(() => { setIsPrecomputing(false); setIsReviewing(false); });

    return () => controller.abort();
  }, [gameLoaded]); // eslint-disable-line

  useEffect(() => {
    if (!chessInstance || !gameLoaded) return;
    clearTimeout(evalTimerRef.current);

    // If Stockfish already evaluated this position (from 4-pass analysis), use that immediately
    if (currentMoveIndex >= 0 && evalHistory[currentMoveIndex] !== undefined) {
      setCurrentEval(evalHistory[currentMoveIndex]);
    }

    // Don't compute engine lines while the full-game analysis is running;
    // Stockfish is busy with the review passes. Surface "Computing..." instead.
    if (isPrecomputing) {
      setEngineLines([]);
      setEngineBusy(true);
      return;
    }

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
        // Only update currentEval from minimax if Stockfish hasn't provided a value
        if (evalHistory[currentMoveIndex] === undefined) {
          setCurrentEval(ev);
        }
        if (openingAbortRef.current) openingAbortRef.current.abort?.();
        fetchOpeningName(fen).then(name => { if (name && !cancelled) setLiveOpeningName(name); }).catch(err => console.error('Opening fetch error:', err));
      } catch (err) { if (!cancelled) console.error('Engine eval error:', err); }
      finally { if (!cancelled) setEngineBusy(false); }
    }, 150);
    return () => { cancelled = true; clearTimeout(evalTimerRef.current); };
  }, [currentMoveIndex, gameLoaded, chessInstance, evalHistory, isPrecomputing]);

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
    setIsPrecomputing(false);
  };

  const handleReview = () => {
    if (!moveHistory.length) return;
    if (isReviewing || isPrecomputing) { cancelReview(); return; }
    // Re-trigger the 4-pass Stockfish analysis by toggling gameLoaded
    setReviewResults(null);
    setPartialReviewData([]);
    setEvalHistory([]);
    setReportAnimated(false);
    setGameLoaded(false);
    setTimeout(() => setGameLoaded(true), 50);
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
  const phaseGrades = useMemo(() => classifyPhases(moveHistory, reviewResults), [moveHistory, reviewResults]);

  // Key moment navigation
  const KEY_CLASSES = useMemo(() => new Set(['brilliant', 'critical', 'inaccuracy', 'mistake', 'blunder']), []);
  const goToNextKey = useCallback(() => {
    if (!reviewResults) return;
    for (let i = currentMoveIndex + 1; i < reviewResults.length; i++) {
      if (reviewResults[i] && KEY_CLASSES.has(reviewResults[i].classification)) { goToMove(i); return; }
    }
  }, [reviewResults, currentMoveIndex, goToMove, KEY_CLASSES]);
  const goToPrevKey = useCallback(() => {
    if (!reviewResults) return;
    for (let i = currentMoveIndex - 1; i >= 0; i--) {
      if (reviewResults[i] && KEY_CLASSES.has(reviewResults[i].classification)) { goToMove(i); return; }
    }
  }, [reviewResults, currentMoveIndex, goToMove, KEY_CLASSES]);

  // ── Board overlay arrows + badges ──
  const { boardArrows, boardBadges } = useMemo(() => {
    const arrows = [];
    const badges = [];
    if (!curReview || !curMove) return { boardArrows: arrows, boardBadges: badges };
    const cls = CLASSIFICATIONS[curReview.classification];

    // Played move arrow (red/orange for bad moves)
    if (['mistake', 'blunder', 'inaccuracy'].includes(curReview.classification)) {
      arrows.push({ from: curMove.from, to: curMove.to, color: cls.color });
    }

    // Best move arrow (green) — parse UCI string to row/col
    if (curReview.bestMoveSan && curReview.classification !== 'best' && curReview.classification !== 'excellent' && curReview.classification !== 'theory') {
      const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fenBefore = currentMoveIndex === 0 ? START_FEN : moveHistory[currentMoveIndex - 1]?.fen;
      if (fenBefore) {
        try {
          const tempChess = new Chess(fenBefore);
          const mv = tempChess.move(curReview.bestMoveSan);
          if (mv) {
            const bFrom = { row: 8 - parseInt(mv.from[1]), col: mv.from.charCodeAt(0) - 97 };
            const bTo = { row: 8 - parseInt(mv.to[1]), col: mv.to.charCodeAt(0) - 97 };
            arrows.push({ from: bFrom, to: bTo, color: '#3ddc84' });
          }
        } catch {}
      }
    }

    // Badge on destination square of played move
    if (cls && curReview.classification !== 'okay' && curReview.classification !== 'theory') {
      badges.push({ row: curMove.to.row, col: curMove.to.col, symbol: cls.symbol, color: cls.color });
    }

    return { boardArrows: arrows, boardBadges: badges };
  }, [curReview, curMove, currentMoveIndex, moveHistory]);

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

      {/* ── Game loaded ── */}
      {gameLoaded && (
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
                className={`${styles.iconBtn} ${reviewResults && !isPrecomputing ? styles.iconBtnDone : ''}`}
                onClick={handleReview}
                disabled={!moveHistory.length}
                title={isPrecomputing ? 'Cancel analysis' : 'Re-analyze game'}
              >
                {isPrecomputing ? '\u2716' : '\u27F3'}
              </button>
              <button className={`${styles.iconBtn} ${styles.importBtn}`} onClick={handleNewGame} title="Import new game">
                &#x2795; New
              </button>
            </div>
          </div>

          {/* Inline evaluation progress card — 4-pass Stockfish */}
          {isPrecomputing && (
            <div className={styles.evalCard}>
              <div className={styles.evalCardHeader}>
                <span className={styles.evalCardTitle}>
                  {precomputeProgress.passLabel || 'Evaluating...'}
                </span>
                <span className={styles.evalCardPct}>
                  {(() => {
                    const p = precomputeProgress;
                    if (!p.total || !p.totalPasses) return '0.0';
                    const passSlice = 100 / p.totalPasses;
                    return (p.passIndex * passSlice + (p.current / p.total) * passSlice).toFixed(1);
                  })()}%
                </span>
              </div>
              <div className={styles.evalCardTrack}>
                <div className={styles.evalCardFill} style={{
                  width: (() => {
                    const p = precomputeProgress;
                    if (!p.total || !p.totalPasses) return '0%';
                    const passSlice = 100 / p.totalPasses;
                    return `${p.passIndex * passSlice + (p.current / p.total) * passSlice}%`;
                  })()
                }} />
              </div>
              <div className={styles.evalCardHint}>
                {precomputeProgress.passIndex === 0
                  ? 'Stockfish depth 12 — board is ready to use'
                  : `Pass ${precomputeProgress.passIndex + 1} of ${precomputeProgress.totalPasses} — depth ${ANALYSIS_PASSES[precomputeProgress.passIndex]?.depth || '?'}`}
              </div>
            </div>
          )}

          {/* ── REPORT TAB: chess.com-style full report ── */}
          {panelTab === 'report' && (
            <div className={styles.reportScroll}>
              <div className={styles.reportCenter}>
                {/* ── Result banner ── */}
                {(moveHistory.length > 0 || reviewResults) && (
                  <div className={styles.resultBanner}>
                    <span className={styles.resultText}>
                      {pgnHeaders.Result || (moveHistory.length > 0 ? '*' : '')}
                    </span>
                    {openingName && <span className={styles.resultOpening}>{openingName}</span>}
                  </div>
                )}

                {/* ── Accuracy rings ── */}
                {(moveHistory.length > 0 || reviewResults) && (
                  <div className={`${styles.accSection} ${reportAnimated ? styles.scoreCardAnimated : ''}`}>
                    <AccuracyRing
                      value={whiteAcc}
                      name={pgnHeaders.White || 'White'}
                      dotClass={styles.accDotW}
                    />
                    <div className={styles.accCenter}>
                      {gameCharacter && (
                        <>
                          <span className={styles.accCenterIcon}>{gameCharacter.icon}</span>
                          <span className={styles.accCenterLabel}>{gameCharacter.label}</span>
                        </>
                      )}
                    </div>
                    <AccuracyRing
                      value={blackAcc}
                      name={pgnHeaders.Black || 'Black'}
                      dotClass={styles.accDotB}
                    />
                  </div>
                )}

                {/* ── Game description ── */}
                {gameDesc && <div className={styles.gameDescription}>{gameDesc}</div>}

                {/* ── Eval graph ── */}
                {graphData.length > 1 && (
                  <div className={styles.reportGraphWrap}>
                    <EvalGraph data={graphData} currentIdx={currentMoveIndex} onSeek={goToMove} large
                      reviewResults={reviewResults} moveHistory={moveHistory} />
                  </div>
                )}

                {/* ── Rating estimation ── */}
                {reviewResults && (whiteAcc !== null || blackAcc !== null) && (
                  <div className={styles.eloSection}>
                    <div className={styles.eloSectionTitle}>Estimated Rating</div>
                    <div className={styles.eloCards}>
                      {whiteAcc !== null && (() => {
                        const elo = estimateElo(whiteAcc);
                        const tier = elo >= 2000 ? 'master' : elo >= 1500 ? 'expert' : elo >= 1000 ? 'club' : 'beginner';
                        return (
                          <div className={`${styles.eloPlayerCard} ${styles[`eloTier_${tier}`]}`}>
                            <div className={styles.eloPlayerHeader}>
                              <span className={`${styles.eloPlayerDot} ${styles.eloPlayerDotW}`} />
                              <span className={styles.eloPlayerName}>{pgnHeaders.White || 'White'}</span>
                            </div>
                            <div className={styles.eloPlayerRating}>~{elo}</div>
                            <div className={styles.eloPlayerBar}>
                              <div className={styles.eloPlayerBarFill} style={{ width: `${Math.min(100, Math.max(5, ((elo - 400) / 2000) * 100))}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                      {blackAcc !== null && (() => {
                        const elo = estimateElo(blackAcc);
                        const tier = elo >= 2000 ? 'master' : elo >= 1500 ? 'expert' : elo >= 1000 ? 'club' : 'beginner';
                        return (
                          <div className={`${styles.eloPlayerCard} ${styles[`eloTier_${tier}`]}`}>
                            <div className={styles.eloPlayerHeader}>
                              <span className={`${styles.eloPlayerDot} ${styles.eloPlayerDotB}`} />
                              <span className={styles.eloPlayerName}>{pgnHeaders.Black || 'Black'}</span>
                            </div>
                            <div className={styles.eloPlayerRating}>~{elo}</div>
                            <div className={styles.eloPlayerBar}>
                              <div className={styles.eloPlayerBarFill} style={{ width: `${Math.min(100, Math.max(5, ((elo - 400) / 2000) * 100))}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className={styles.eloFootnote}>Based on accuracy this game</div>
                  </div>
                )}

                {/* ── Classification breakdown ── */}
                {reviewResults && (
                  <div className={styles.classCard}>
                    <table className={styles.classTable}>
                      <thead>
                        <tr>
                          <th className={styles.classColHead}>W</th>
                          <th colSpan="2"></th>
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
                              <td className={styles.classCountW} style={{ color: wN > 0 ? cls.color : 'rgba(255,255,255,0.15)' }}>{wN}</td>
                              <td className={styles.classIcon} style={{ color: cls.color }}>{cls.symbol}</td>
                              <td className={styles.classLabel} style={{ color: cls.color }}>{cls.label}</td>
                              <td className={styles.classCountB} style={{ color: bN > 0 ? cls.color : 'rgba(255,255,255,0.15)' }}>{bN}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Phase grades */}
                {phaseGrades && (
                  <div className={styles.phaseCard}>
                    <div className={styles.phaseSectionTitle}>Performance by Phase</div>
                    <div className={styles.phaseGrid} style={{
                      gridTemplateColumns: phaseGrades.endgame ? 'auto repeat(3, 1fr)' : 'auto repeat(2, 1fr)',
                    }}>
                      <div />
                      <div className={styles.phaseColHead}>Opening</div>
                      <div className={styles.phaseColHead}>Middle</div>
                      {phaseGrades.endgame && <div className={styles.phaseColHead}>Endgame</div>}
                      <div className={styles.phaseRowLabel}>
                        <span className={`${styles.accRingDot} ${styles.accDotW}`} />
                        {pgnHeaders.White || 'White'}
                      </div>
                      {['opening', 'middlegame', 'endgame'].map(p => {
                        if (p === 'endgame' && !phaseGrades.endgame) return null;
                        const v = phaseGrades[p]?.white;
                        return (
                          <div key={`w-${p}`} className={styles.phaseCell}
                            style={{ color: v == null ? 'rgba(255,255,255,0.2)' : v >= 85 ? '#3ddc84' : v >= 65 ? '#f0c94c' : '#e05555' }}>
                            {v != null ? `${v}%` : '--'}
                          </div>
                        );
                      })}
                      <div className={styles.phaseRowLabel}>
                        <span className={`${styles.accRingDot} ${styles.accDotB}`} />
                        {pgnHeaders.Black || 'Black'}
                      </div>
                      {['opening', 'middlegame', 'endgame'].map(p => {
                        if (p === 'endgame' && !phaseGrades.endgame) return null;
                        const v = phaseGrades[p]?.black;
                        return (
                          <div key={`b-${p}`} className={styles.phaseCell}
                            style={{ color: v == null ? 'rgba(255,255,255,0.2)' : v >= 85 ? '#3ddc84' : v >= 65 ? '#f0c94c' : '#e05555' }}>
                            {v != null ? `${v}%` : '--'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review prompt if not reviewed */}
                {!reviewResults && !isPrecomputing && !isReviewing && moveHistory.length > 0 && (
                  <div className={styles.reviewPrompt}>
                    <button className={styles.reviewBtn} onClick={handleReview}>
                      &#x27F3; Analyze Game
                    </button>
                    <p className={styles.reviewHint}>Run Stockfish analysis at depths 12-22 to see accuracy, classifications, and the evaluation graph.</p>
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

                {/* Real-time graph building up during review */}
                {isReviewing && graphData.length > 1 && (
                  <div className={styles.reviewingSection}>
                    <div className={styles.reportGraphWrap}>
                      <EvalGraph data={graphData} currentIdx={-1} onSeek={() => {}} large
                        reviewResults={partialReviewData.length ? partialReviewData : null}
                        moveHistory={moveHistory} />
                    </div>
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
                      color: displayPct >= 55 ? '#111' : '#eee',
                      textShadow: displayPct >= 55 ? '0 1px 1px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.6)',
                    }}>{formatEval(currentEval)}</span>
                  </div>
                  <div className={styles.boardWrap}>
                    <Board arrows={boardArrows} badges={boardBadges} />
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
                  {reviewResults && (
                    <>
                      <span className={styles.navSep} />
                      <button className={styles.keyBtn} onClick={goToPrevKey} title="Previous key moment">&#x25C0;&#x26A1;</button>
                      <button className={styles.keyBtn} onClick={goToNextKey} title="Next key moment">&#x26A1;&#x25B6;</button>
                    </>
                  )}
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
                    {!isPrecomputing && !engineBusy && engineLines.length > 0 && (
                      <span className={styles.depthBadge}>D2</span>
                    )}
                  </div>
                  {isPrecomputing || engineBusy
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

                {/* Move annotation card */}
                {curReview && curClass && curMove && (
                  <div className={styles.annotationCard}>
                    <div className={styles.annotationHeader}>
                      <span className={styles.annotationBadge} style={{ background: curClass.bg, color: curClass.color }}>
                        {curClass.symbol} {curClass.label}
                      </span>
                      <span className={styles.annotationEval}>
                        {formatEval(curReview.bestScore)} → {formatEval(curReview.playedScore)}
                      </span>
                    </div>
                    <div className={styles.annotationMove}>
                      <strong>{curMove.san}</strong>
                    </div>
                    <p className={styles.annotationText}>
                      {explainMove(curReview.classification, curReview.bestMoveSan, curMove.san)}
                    </p>
                    {curReview.bestMoveSan && curReview.bestMoveSan !== curMove.san && (
                      <div className={styles.annotationBest}>
                        Best move: <strong>{curReview.bestMoveSan}</strong>
                      </div>
                    )}
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
                      color: displayPct >= 55 ? '#111' : '#eee',
                      textShadow: displayPct >= 55 ? '0 1px 1px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.6)',
                    }}>{formatEval(currentEval)}</span>
                  </div>
                  <div className={styles.boardWrap}>
                    <Board arrows={boardArrows} badges={boardBadges} />
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
                  {reviewResults && (
                    <>
                      <span className={styles.navSep} />
                      <button className={styles.keyBtn} onClick={goToPrevKey} title="Previous key moment">&#x25C0;&#x26A1;</button>
                      <button className={styles.keyBtn} onClick={goToNextKey} title="Next key moment">&#x26A1;&#x25B6;</button>
                    </>
                  )}
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
