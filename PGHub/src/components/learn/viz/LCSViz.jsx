import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './LCSViz.css';

const MAX_LEN = 10;
const TICK_MS = 460;
const DEFAULT_A = 'ABCBDAB';
const DEFAULT_B = 'BDCAB';

function sanitize(raw) {
  if (!raw) return '';
  const upper = String(raw).toUpperCase();
  let out = '';
  for (const ch of upper) {
    if (/[A-Z0-9]/.test(ch)) out += ch;
    if (out.length >= MAX_LEN) break;
  }
  return out;
}

function buildSteps(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const steps = [];

  for (let i = 0; i <= m; i += 1) {
    for (let j = 0; j <= n; j += 1) {
      let kind;
      let value;
      let fromUpLeft = null;
      let fromUp = null;
      let fromLeft = null;
      let pickedRole = null;

      if (i === 0 || j === 0) {
        value = 0;
        kind = 'base';
      } else {
        const ca = a[i - 1];
        const cb = b[j - 1];
        fromUp = dp[i - 1][j];
        fromLeft = dp[i][j - 1];
        if (ca === cb) {
          fromUpLeft = dp[i - 1][j - 1];
          value = fromUpLeft + 1;
          kind = 'match';
          pickedRole = 'diag';
        } else {
          if (fromUp >= fromLeft) {
            value = fromUp;
            pickedRole = 'up';
          } else {
            value = fromLeft;
            pickedRole = 'left';
          }
          kind = 'mismatch';
        }
      }

      dp[i][j] = value;
      steps.push({
        idx: steps.length,
        i,
        j,
        kind,
        value,
        fromUpLeft,
        fromUp,
        fromLeft,
        pickedRole,
        charA: i > 0 ? a[i - 1] : null,
        charB: j > 0 ? b[j - 1] : null,
      });
    }
  }

  return { steps, finalDp: dp };
}

function traceback(a, b, dp) {
  let i = a.length;
  let j = b.length;
  const chars = [];
  const matchedAIdx = new Set();
  const matchedBIdx = new Set();
  const path = new Set();
  while (i > 0 && j > 0) {
    path.add(`${i}-${j}`);
    if (a[i - 1] === b[j - 1]) {
      chars.push(a[i - 1]);
      matchedAIdx.add(i - 1);
      matchedBIdx.add(j - 1);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return { lcs: chars.reverse().join(''), matchedAIdx, matchedBIdx, path };
}

function cellId(i, j) {
  return `${i}-${j}`;
}

function formulaForStep(step) {
  if (!step) return 'match: dp[i-1][j-1] + 1   else: max(dp[i-1][j], dp[i][j-1])';
  const { i, j, kind, value, fromUpLeft, fromUp, fromLeft, charA, charB } = step;
  if (kind === 'base') {
    if (i === 0) return `dp[0][${j}] = 0   (empty A)`;
    return `dp[${i}][0] = 0   (empty B)`;
  }
  if (kind === 'match') {
    return `A[${i - 1}]='${charA}' = B[${j - 1}]='${charB}'   dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${fromUpLeft} + 1 = ${value}`;
  }
  return `A[${i - 1}]='${charA}' != B[${j - 1}]='${charB}'   dp[${i}][${j}] = max(dp[${i - 1}][${j}]=${fromUp}, dp[${i}][${j - 1}]=${fromLeft}) = ${value}`;
}

function describeStep(step) {
  if (!step) return '';
  const { i, j, kind, value, fromUp, fromLeft, fromUpLeft, charA, charB, pickedRole } = step;
  if (kind === 'base') {
    if (i === 0) return `Row 0 represents an empty prefix of A, so dp[0][${j}] = 0.`;
    return `Column 0 represents an empty prefix of B, so dp[${i}][0] = 0.`;
  }
  if (kind === 'match') {
    return `Characters match ('${charA}'). We extend the LCS of the shorter prefixes by 1: dp[${i - 1}][${j - 1}] + 1 = ${fromUpLeft} + 1 = ${value}.`;
  }
  const fromLabel = pickedRole === 'up' ? `dp[${i - 1}][${j}]` : `dp[${i}][${j - 1}]`;
  const fromVal = pickedRole === 'up' ? fromUp : fromLeft;
  return `Mismatch ('${charA}' vs '${charB}'). Take the better of the two neighbors: ${fromLabel} = ${fromVal}. dp[${i}][${j}] = ${value}.`;
}

export default function LCSViz() {
  const [aRaw, setARaw] = useState(DEFAULT_A);
  const [bRaw, setBRaw] = useState(DEFAULT_B);
  const a = useMemo(() => sanitize(aRaw) || DEFAULT_A, [aRaw]);
  const b = useMemo(() => sanitize(bRaw) || DEFAULT_B, [bRaw]);

  const built = useMemo(() => buildSteps(a, b), [a, b]);
  const { steps, finalDp } = built;
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  // Reset playhead when the input changes (prev-state-during-render pattern).
  const [prevA, setPrevA] = useState(a);
  const [prevB, setPrevB] = useState(b);
  if (prevA !== a || prevB !== b) {
    setPrevA(a);
    setPrevB(b);
    setIdx(-1);
    setPlaying(false);
  }

  const total = steps.length;
  const current = idx >= 0 ? steps[idx] : null;
  const atEnd = idx >= total - 1;
  const finalAnswer = finalDp[a.length][b.length];
  const playing = playingRaw && idx < total - 1;

  const next = useCallback(() => {
    setIdx((i) => Math.min(i + 1, total - 1));
  }, [total]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(() => {
      next();
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(-1);
  };

  const handleRun = () => {
    if (atEnd) {
      setIdx(-1);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const handleStep = () => {
    setPlaying(false);
    if (idx < total - 1) setIdx(idx + 1);
  };

  const handlePause = () => setPlaying(false);

  const handleRunAll = () => {
    setPlaying(false);
    setIdx(total - 1);
  };

  const filledMap = useMemo(() => {
    const map = new Map();
    if (idx < 0) return map;
    for (let k = 0; k <= idx; k += 1) {
      const s = steps[k];
      map.set(cellId(s.i, s.j), s.value);
    }
    return map;
  }, [idx, steps]);

  const dependencies = useMemo(() => {
    if (!current || current.kind === 'base') return [];
    const deps = [];
    if (current.kind === 'match') {
      deps.push({ i: current.i - 1, j: current.j - 1, role: 'diag' });
    } else if (current.pickedRole === 'up') {
      deps.push({ i: current.i - 1, j: current.j, role: 'up' });
    } else {
      deps.push({ i: current.i, j: current.j - 1, role: 'left' });
    }
    return deps;
  }, [current]);

  const depMap = useMemo(() => {
    const map = new Map();
    dependencies.forEach((d) => map.set(cellId(d.i, d.j), d.role));
    return map;
  }, [dependencies]);

  const trace = useMemo(() => {
    if (!atEnd) return { lcs: '', matchedAIdx: new Set(), matchedBIdx: new Set(), path: new Set() };
    return traceback(a, b, finalDp);
  }, [atEnd, a, b, finalDp]);

  // Light up the matching chars when current step is a match
  const liveMatchA = current && current.kind === 'match' ? current.i - 1 : -1;
  const liveMatchB = current && current.kind === 'match' ? current.j - 1 : -1;

  // SVG layout
  const m = a.length;
  const n = b.length;
  const rows = m + 1;
  const cols = n + 1;
  const PADDING_L = 56;
  const PADDING_T = 48;
  const PADDING_R = 14;
  const PADDING_B = 14;
  const cellSize = useMemo(() => {
    const maxCanvasW = 760;
    const maxCanvasH = 460;
    const availW = maxCanvasW - PADDING_L - PADDING_R;
    const availH = maxCanvasH - PADDING_T - PADDING_B;
    return Math.max(28, Math.floor(Math.min(availW / cols, availH / rows)));
  }, [cols, rows]);

  const gridW = cellSize * cols;
  const gridH = cellSize * rows;
  const viewW = gridW + PADDING_L + PADDING_R;
  const viewH = gridH + PADDING_T + PADDING_B;

  const cellX = (j) => PADDING_L + j * cellSize;
  const cellY = (i) => PADDING_T + i * cellSize;
  const cellCx = (j) => cellX(j) + cellSize / 2;
  const cellCy = (i) => cellY(i) + cellSize / 2;

  return (
    <div className="lcsviz">
      <div className="lcsviz-header">
        <div className="lcsviz-title">Longest Common Subsequence — DP fill</div>
      </div>

      <div className="lcsviz-inputs">
        <label className="lcsviz-input">
          <span className="lcsviz-input-label">string A</span>
          <input
            type="text"
            value={aRaw}
            maxLength={MAX_LEN}
            spellCheck={false}
            onChange={(e) => setARaw(sanitize(e.target.value))}
            aria-label="string A"
          />
        </label>
        <label className="lcsviz-input">
          <span className="lcsviz-input-label">string B</span>
          <input
            type="text"
            value={bRaw}
            maxLength={MAX_LEN}
            spellCheck={false}
            onChange={(e) => setBRaw(sanitize(e.target.value))}
            aria-label="string B"
          />
        </label>
        <span className="lcsviz-input-note">A-Z, 0-9, up to {MAX_LEN} chars each</span>
      </div>

      <div className="lcsviz-strings">
        <div className="lcsviz-strings-row">
          <span className="lcsviz-strings-tag">A</span>
          <div className="lcsviz-strings-cells">
            {a.split('').map((ch, k) => {
              const matched = atEnd ? trace.matchedAIdx.has(k) : false;
              const live = k === liveMatchA;
              let cls = 'lcsviz-char';
              if (matched) cls += ' lcsviz-char-matched';
              if (live) cls += ' lcsviz-char-live';
              return (
                <span key={`a-${k}`} className={cls}>
                  <span className="lcsviz-char-glyph">{ch}</span>
                  <span className="lcsviz-char-idx">{k}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="lcsviz-strings-row">
          <span className="lcsviz-strings-tag">B</span>
          <div className="lcsviz-strings-cells">
            {b.split('').map((ch, k) => {
              const matched = atEnd ? trace.matchedBIdx.has(k) : false;
              const live = k === liveMatchB;
              let cls = 'lcsviz-char';
              if (matched) cls += ' lcsviz-char-matched';
              if (live) cls += ' lcsviz-char-live';
              return (
                <span key={`b-${k}`} className={cls}>
                  <span className="lcsviz-char-glyph">{ch}</span>
                  <span className="lcsviz-char-idx">{k}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lcsviz-legend">
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-empty" /> empty
        </span>
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-filled" /> filled
        </span>
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-diag" /> match (diag)
        </span>
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-up" /> from above
        </span>
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-left" /> from left
        </span>
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-current" /> filling now
        </span>
        <span className="lcsviz-legend-item">
          <span className="lcsviz-dot lcsviz-dot-trace" /> traceback
        </span>
      </div>

      <div className="lcsviz-stage">
        <svg
          className="lcsviz-svg"
          viewBox={`0 0 ${viewW} ${viewH}`}
          role="img"
          aria-label={`LCS DP table ${rows} by ${cols}`}
        >
          <defs>
            <marker
              id="lcsviz-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="lcsviz-arrow-head" />
            </marker>
          </defs>

          {/* Axis: B chars across top */}
          <g className="lcsviz-axes">
            <text
              className="lcsviz-axis-corner"
              x={PADDING_L / 2}
              y={PADDING_T / 2}
              textAnchor="middle"
              dominantBaseline="central"
            >
              i\j
            </text>
            <text
              className="lcsviz-axis-strlabel"
              x={PADDING_L + gridW / 2}
              y={14}
              textAnchor="middle"
            >
              B
            </text>
            <text
              className="lcsviz-axis-strlabel"
              x={16}
              y={PADDING_T + gridH / 2}
              textAnchor="middle"
            >
              A
            </text>
            {/* column index numbers + B chars */}
            <text
              className="lcsviz-axis-label"
              x={cellCx(0)}
              y={PADDING_T - 22}
              textAnchor="middle"
            >
              0
            </text>
            <text
              className="lcsviz-axis-label lcsviz-axis-empty"
              x={cellCx(0)}
              y={PADDING_T - 8}
              textAnchor="middle"
            >
              ε
            </text>
            {b.split('').map((ch, j) => (
              <g key={`col-${j}`}>
                <text
                  className="lcsviz-axis-label"
                  x={cellCx(j + 1)}
                  y={PADDING_T - 22}
                  textAnchor="middle"
                >
                  {j + 1}
                </text>
                <text
                  className={`lcsviz-axis-char${liveMatchB === j ? ' lcsviz-axis-char-live' : ''}`}
                  x={cellCx(j + 1)}
                  y={PADDING_T - 8}
                  textAnchor="middle"
                >
                  {ch}
                </text>
              </g>
            ))}
            {/* row index numbers + A chars */}
            <text
              className="lcsviz-axis-label"
              x={PADDING_L - 24}
              y={cellCy(0)}
              textAnchor="end"
              dominantBaseline="central"
            >
              0
            </text>
            <text
              className="lcsviz-axis-label lcsviz-axis-empty"
              x={PADDING_L - 8}
              y={cellCy(0)}
              textAnchor="end"
              dominantBaseline="central"
            >
              ε
            </text>
            {a.split('').map((ch, i) => (
              <g key={`row-${i}`}>
                <text
                  className="lcsviz-axis-label"
                  x={PADDING_L - 24}
                  y={cellCy(i + 1)}
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {i + 1}
                </text>
                <text
                  className={`lcsviz-axis-char${liveMatchA === i ? ' lcsviz-axis-char-live' : ''}`}
                  x={PADDING_L - 8}
                  y={cellCy(i + 1)}
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {ch}
                </text>
              </g>
            ))}
          </g>

          {/* Cells */}
          <g className="lcsviz-cells">
            {Array.from({ length: rows }).flatMap((_, i) =>
              Array.from({ length: cols }).map((__, j) => {
                const id = cellId(i, j);
                const isFilled = filledMap.has(id);
                const isCurrent = current && current.i === i && current.j === j;
                const depRole = depMap.get(id);
                const isGoal = i === m && j === n;
                const isOnPath = atEnd && trace.path.has(id);
                let cls = 'lcsviz-cell';
                if (isFilled && !isCurrent) cls += ' lcsviz-cell-filled';
                if (isCurrent) cls += ' lcsviz-cell-current';
                if (depRole === 'diag') cls += ' lcsviz-cell-dep-diag';
                if (depRole === 'up') cls += ' lcsviz-cell-dep-up';
                if (depRole === 'left') cls += ' lcsviz-cell-dep-left';
                if (isOnPath && !isCurrent) cls += ' lcsviz-cell-trace';
                if (isGoal && atEnd) cls += ' lcsviz-cell-goal';
                return (
                  <g key={id} className={cls}>
                    <rect
                      x={cellX(j)}
                      y={cellY(i)}
                      width={cellSize}
                      height={cellSize}
                      rx={5}
                      ry={5}
                    />
                    {isFilled ? (
                      <text
                        x={cellCx(j)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {filledMap.get(id)}
                      </text>
                    ) : (
                      <text
                        className="lcsviz-cell-placeholder"
                        x={cellCx(j)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        ·
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </g>

          {/* Dependency arrows */}
          {current && current.kind !== 'base' && (
            <g className="lcsviz-arrows">
              {dependencies.map((d) => {
                const x1 = cellCx(d.j);
                const y1 = cellCy(d.i);
                const x2 = cellCx(current.j);
                const y2 = cellCy(current.i);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const inset = cellSize * 0.36;
                const sx = x1 + (dx / len) * inset;
                const sy = y1 + (dy / len) * inset;
                const ex = x2 - (dx / len) * inset;
                const ey = y2 - (dy / len) * inset;
                return (
                  <line
                    key={`arrow-${d.role}`}
                    className={`lcsviz-arrow lcsviz-arrow-${d.role}`}
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    markerEnd="url(#lcsviz-arrow)"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="lcsviz-status">
        <div className="lcsviz-status-row">
          <span className="lcsviz-status-label">Step</span>
          <span className="lcsviz-status-value">
            {Math.max(idx + 1, 0)} / {total}
          </span>
        </div>
        <div className="lcsviz-status-row">
          <span className="lcsviz-status-label">Cell</span>
          <span className="lcsviz-status-value">
            {current ? (
              <>dp[{current.i}][{current.j}]</>
            ) : (
              <span className="lcsviz-muted">not started</span>
            )}
          </span>
        </div>
        <div className="lcsviz-status-row">
          <span className="lcsviz-status-label">Table</span>
          <span className="lcsviz-status-value">
            {rows} × {cols}
          </span>
        </div>
      </div>

      <div className="lcsviz-formula">
        <span className="lcsviz-formula-label">Recurrence</span>
        <code className="lcsviz-formula-body">{formulaForStep(current)}</code>
      </div>

      <p className="lcsviz-caption">
        {current
          ? describeStep(current)
          : `Press Step or Run to fill the (m+1) × (n+1) table row by row. The bottom-right cell holds the LCS length of "${a}" and "${b}".`}
      </p>

      {atEnd && (
        <div className="lcsviz-answer">
          <div className="lcsviz-answer-line">
            <span className="lcsviz-answer-label">LCS length</span>
            <span className="lcsviz-answer-value">{finalAnswer}</span>
          </div>
          <div className="lcsviz-answer-line">
            <span className="lcsviz-answer-label">LCS</span>
            <span className="lcsviz-answer-lcs">
              {trace.lcs
                ? trace.lcs.split('').map((ch, k) => (
                    <span key={`lcs-${k}`} className="lcsviz-answer-char">
                      {ch}
                    </span>
                  ))
                : <span className="lcsviz-muted">(empty)</span>}
            </span>
          </div>
          <span className="lcsviz-answer-note">
            traced from dp[{m}][{n}] back to dp[0][0]
          </span>
        </div>
      )}

      <div className="lcsviz-controls">
        <button
          type="button"
          className="lcsviz-btn lcsviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="lcsviz-btn lcsviz-btn-primary"
          onClick={handleRun}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="lcsviz-btn lcsviz-btn-secondary"
          onClick={handlePause}
          disabled={!playing}
          aria-label="Pause"
        >
          <Pause size={16} />
          <span>Pause</span>
        </button>
        <button
          type="button"
          className="lcsviz-btn lcsviz-btn-secondary"
          onClick={handleStep}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <button
          type="button"
          className="lcsviz-btn lcsviz-btn-secondary"
          onClick={handleRunAll}
          disabled={atEnd}
          aria-label="Run to end"
        >
          <span>Skip to end</span>
        </button>
      </div>
    </div>
  );
}
