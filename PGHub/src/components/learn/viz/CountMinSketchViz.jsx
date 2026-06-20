import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  AlertTriangle,
} from 'lucide-react';
import './CountMinSketchViz.css';

const STEP_MS = 720;
const D_MIN = 2;
const D_MAX = 5;
const W_MIN = 4;
const W_MAX = 12;
const DEFAULT_D = 3;
const DEFAULT_W = 8;
// Initial multiset: token -> count. Chosen so collisions surface at small w.
const INITIAL_STREAM = ['a', 'a', 'a', 'a', 'b', 'b', 'c', 'a', 'c', 'b', 'a'];

// FNV-1a 32-bit with a per-row salt so each of the d rows hashes independently.
function fnv1a(str, salt) {
  let h = 0x811c9dc5 ^ (salt * 0x01000193);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= salt * 0x9e3779b9;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

// One column per row for the given token: row r maps token -> column in [0, w).
function colsFor(str, d, w) {
  const out = [];
  for (let r = 0; r < d; r++) {
    out.push(fnv1a(str, r + 1) % w);
  }
  return out;
}

function emptyGrid(d, w) {
  return Array.from({ length: d }, () => new Array(w).fill(0));
}

// Replay the whole multiset into a fresh grid so it always matches d/w.
function buildGrid(stream, d, w) {
  const grid = emptyGrid(d, w);
  for (const tok of stream) {
    const cols = colsFor(tok, d, w);
    for (let r = 0; r < d; r++) grid[r][cols[r]] += 1;
  }
  return grid;
}

function trueCounts(stream) {
  const m = new Map();
  for (const tok of stream) m.set(tok, (m.get(tok) || 0) + 1);
  return m;
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

// Increment frames: reveal d target cells, then bump each row one at a time.
function buildIncrementFrames(grid, token, cols, d) {
  const frames = [];
  frames.push({
    grid: cloneGrid(grid),
    label: `Hash "${token}" in each of the ${d} rows -> columns [${cols.join(', ')}].`,
    activeCells: [],
    pendingCells: cols.map((c, r) => ({ r, c })),
    mode: 'inc',
    status: 'hash',
    token,
    cols,
  });
  let working = cloneGrid(grid);
  for (let r = 0; r < d; r++) {
    const c = cols[r];
    const next = cloneGrid(working);
    next[r][c] += 1;
    frames.push({
      grid: next,
      label: `row ${r}: hash("${token}") = col ${c}. Increment cell (${r}, ${c}) -> ${next[r][c]}.`,
      activeCells: [{ r, c }],
      pendingCells: cols.slice(r + 1).map((cc, k) => ({ r: r + 1 + k, c: cc })),
      mode: 'inc',
      status: 'bump',
      token,
      cols,
    });
    working = next;
  }
  frames.push({
    grid: working,
    label: `"${token}" recorded — one cell bumped in each of the ${d} rows.`,
    activeCells: cols.map((c, r) => ({ r, c })),
    pendingCells: [],
    mode: 'inc',
    status: 'inc-done',
    token,
    cols,
  });
  return { frames, finalGrid: working };
}

// Query frames: probe each row's hashed cell, track the running minimum.
function buildQueryFrames(grid, token, cols, d, truth) {
  const frames = [];
  frames.push({
    grid: cloneGrid(grid),
    label: `Estimate count("${token}") = MIN over its ${d} hashed cells. Columns [${cols.join(', ')}].`,
    activeCells: [],
    pendingCells: cols.map((c, r) => ({ r, c })),
    probed: [],
    minSoFar: null,
    minCell: null,
    mode: 'query',
    status: 'hash',
    token,
    cols,
    truth,
  });
  let minSoFar = Infinity;
  let minCell = null;
  const probed = [];
  for (let r = 0; r < d; r++) {
    const c = cols[r];
    const val = grid[r][c];
    probed.push({ r, c, val });
    if (val < minSoFar) {
      minSoFar = val;
      minCell = { r, c };
    }
    frames.push({
      grid: cloneGrid(grid),
      label: `row ${r}: cell (${r}, ${c}) = ${val}. Running min = ${minSoFar}.`,
      activeCells: [{ r, c }],
      pendingCells: cols.slice(r + 1).map((cc, k) => ({ r: r + 1 + k, c: cc })),
      probed: probed.slice(),
      minSoFar,
      minCell: minCell ? { ...minCell } : null,
      mode: 'query',
      status: 'probe',
      token,
      cols,
      truth,
    });
  }
  const over = minSoFar > truth;
  frames.push({
    grid: cloneGrid(grid),
    label: over
      ? `estimate = MIN = ${minSoFar}. True count = ${truth}. Over-counted by ${minSoFar - truth} (collision inflation) — but never under.`
      : `estimate = MIN = ${minSoFar}. True count = ${truth}. Exact — no collision touched every row.`,
    activeCells: minCell ? [minCell] : [],
    pendingCells: [],
    probed: probed.slice(),
    minSoFar,
    minCell: minCell ? { ...minCell } : null,
    mode: 'query',
    status: over ? 'query-over' : 'query-exact',
    token,
    cols,
    truth,
  });
  return { frames, estimate: minSoFar, over };
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

function gridLayout(d, w) {
  const cellW = w <= 8 ? 50 : w <= 10 ? 44 : 38;
  const cellH = 40;
  const gap = 6;
  const rowGap = 10;
  const padX = 70;
  const padY = 30;
  const width = padX + 24 + w * cellW + (w - 1) * gap + 24;
  const height = padY * 2 + d * cellH + (d - 1) * rowGap + 22;
  return { cellW, cellH, gap, rowGap, padX, padY, width, height };
}

function cellPos(r, c, layout) {
  const x = layout.padX + c * (layout.cellW + layout.gap);
  const y = layout.padY + 22 + r * (layout.cellH + layout.rowGap);
  return { x, y };
}

export default function CountMinSketchViz() {
  const [d, setD] = useState(DEFAULT_D);
  const [w, setW] = useState(DEFAULT_W);
  const [stream, setStream] = useState(() => [...INITIAL_STREAM]);
  const [incInput, setIncInput] = useState('b');
  const [queryInput, setQueryInput] = useState('a');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const [, setPendingTok] = useState(null);
  const [operation, setOperation] = useState('Pre-loaded with an 11-token stream.');
  const [verdict, setVerdict] = useState(null);
  const playRef = useRef(null);

  // Live grid derived from the stream + current d/w — always consistent.
  const built = useMemo(() => buildGrid(stream, d, w), [stream, d, w]);
  const truths = useMemo(() => trueCounts(stream), [stream]);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  // Derive `playing` from bounds so the auto-run effect never calls setPlaying.
  const playing = playingRaw && idx >= 0 && idx < frames.length - 1;

  const renderGrid = currentFrame ? currentFrame.grid : built;
  const layout = useMemo(() => gridLayout(d, w), [d, w]);

  const totalIncrements = stream.length;

  const commitPendingTok = useCallback(() => {
    setPendingTok((current) => {
      if (current !== null) setStream((prev) => [...prev, current]);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setTimeout(() => {
      setIdx((i) => {
        const next = i + 1;
        if (next === frames.length - 1) commitPendingTok();
        return next;
      });
    }, STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [playing, frames, commitPendingTok]);

  const startFrames = useCallback(
    (newFrames) => {
      setFrames(newFrames);
      setIdx(0);
      setPlaying(true);
      if (newFrames.length <= 1) commitPendingTok();
    },
    [commitPendingTok],
  );

  const normalize = (raw) => String(raw).trim();

  const onIncrement = useCallback(() => {
    const tok = normalize(incInput);
    if (!tok) {
      setOperation('Increment: enter a non-empty token.');
      setVerdict(null);
      return;
    }
    const cols = colsFor(tok, d, w);
    const { frames: fs } = buildIncrementFrames(built, tok, cols, d);
    setPendingTok(tok);
    setOperation(`Increment "${tok}"`);
    setVerdict({ kind: 'ok', text: 'Recorded' });
    startFrames(fs);
  }, [incInput, d, w, built, startFrames]);

  const onQuery = useCallback(() => {
    const tok = normalize(queryInput);
    if (!tok) {
      setOperation('Query: enter a non-empty token.');
      setVerdict(null);
      return;
    }
    const cols = colsFor(tok, d, w);
    const truth = truths.get(tok) || 0;
    const { frames: fs, estimate, over } = buildQueryFrames(built, tok, cols, d, truth);
    setPendingTok(null);
    setOperation(`Query "${tok}"`);
    setVerdict(
      over
        ? { kind: 'over', text: `Over-count +${estimate - truth}` }
        : { kind: 'exact', text: 'Exact estimate' },
    );
    startFrames(fs);
  }, [queryInput, d, w, built, truths, startFrames]);

  const onReset = useCallback(() => {
    setPlaying(false);
    setStream([...INITIAL_STREAM]);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setVerdict(null);
    setOperation('Stream reset to the default 11 tokens.');
  }, []);

  const onClear = useCallback(() => {
    setPlaying(false);
    setStream([]);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setVerdict(null);
    setOperation('Sketch cleared — every counter is zero.');
  }, []);

  const onDChange = (e) => {
    const v = clampInt(e.target.value, D_MIN, D_MAX, DEFAULT_D);
    setPlaying(false);
    setD(v);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setVerdict(null);
    setOperation(`Depth d = ${v} rows. More rows -> lower over-count probability.`);
  };

  const onWChange = (e) => {
    const v = clampInt(e.target.value, W_MIN, W_MAX, DEFAULT_W);
    setPlaying(false);
    setW(v);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setVerdict(null);
    setOperation(`Width w = ${v} columns. Wider rows -> fewer collisions -> tighter estimates.`);
  };

  const stepNext = () => {
    if (idx < frames.length - 1) {
      setIdx((i) => {
        const next = i + 1;
        if (next === frames.length - 1) commitPendingTok();
        return next;
      });
    }
  };
  const stepPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };
  const togglePlay = () => {
    if (frames.length === 0) return;
    if (idx >= frames.length - 1) {
      setIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const opLabel = currentFrame ? currentFrame.label : operation;
  const activeCells = currentFrame ? currentFrame.activeCells : [];
  const pendingCells = currentFrame ? currentFrame.pendingCells : [];
  const status = currentFrame ? currentFrame.status : null;
  const minCell = currentFrame ? currentFrame.minCell : null;

  const cellKey = (r, c) => `${r}:${c}`;
  const activeSet = new Set(activeCells.map((p) => cellKey(p.r, p.c)));
  const pendingSet = new Set(pendingCells.map((p) => cellKey(p.r, p.c)));

  // Live readouts for the token currently in focus.
  const focusToken = currentFrame ? currentFrame.token : null;
  const focusCols = currentFrame ? currentFrame.cols : null;
  const focusTruth =
    currentFrame && currentFrame.mode === 'query' ? currentFrame.truth : null;
  const focusMin =
    currentFrame && currentFrame.mode === 'query' ? currentFrame.minSoFar : null;

  const step = idx + 1;
  const totalSteps = frames.length;

  // Tradeoff readout: P[over-count > 0] <= (1 - e^-1)^d-ish bound feel; we show
  // the standard CMS guarantees in plain terms.
  const eps = (Math.E / w).toFixed(3);
  const space = d * w;

  return (
    <div className="cms-root">
      <div className="cms-head">
        <div className="cms-title-block">
          <h3 className="cms-title">Count-min sketch</h3>
          <p className="cms-sub">
            A d-by-w grid of counters plus d hash functions. Incrementing a token bumps one cell
            per row; estimating its count returns the MIN of those d cells. Collisions can inflate
            the estimate, but the true count is never under-reported.
          </p>
        </div>
      </div>

      <div className="cms-controls">
        <div className="cms-control-group">
          <label className="cms-input-label" htmlFor="cms-d">
            Depth d
          </label>
          <input
            id="cms-d"
            type="range"
            className="cms-range"
            min={D_MIN}
            max={D_MAX}
            step={1}
            value={d}
            onChange={onDChange}
          />
          <span className="cms-range-value">{d}</span>
        </div>

        <div className="cms-control-group">
          <label className="cms-input-label" htmlFor="cms-w">
            Width w
          </label>
          <input
            id="cms-w"
            type="range"
            className="cms-range"
            min={W_MIN}
            max={W_MAX}
            step={1}
            value={w}
            onChange={onWChange}
          />
          <span className="cms-range-value">{w}</span>
        </div>

        <div className="cms-control-group">
          <label className="cms-input-label" htmlFor="cms-inc">
            Increment
          </label>
          <input
            id="cms-inc"
            type="text"
            value={incInput}
            onChange={(e) => setIncInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onIncrement();
            }}
            className="cms-input"
            placeholder="token"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="cms-btn cms-btn-primary" onClick={onIncrement}>
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="cms-control-group">
          <label className="cms-input-label" htmlFor="cms-query">
            Query
          </label>
          <input
            id="cms-query"
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onQuery();
            }}
            className="cms-input"
            placeholder="token"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="cms-btn cms-btn-accent" onClick={onQuery}>
            <Search size={14} /> Estimate
          </button>
        </div>

        {verdict && (
          <span className={`cms-result-pill cms-result-${verdict.kind}`}>
            {verdict.kind === 'over' && <AlertTriangle size={12} />}
            {verdict.text}
          </span>
        )}

        <div className="cms-control-spacer" />

        <button
          type="button"
          className="cms-btn"
          onClick={stepPrev}
          disabled={frames.length === 0 || idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="cms-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          className="cms-btn"
          onClick={stepNext}
          disabled={frames.length === 0 || idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
        <button type="button" className="cms-btn" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="cms-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cms-formula-row">
        <span className="cms-formula-label">Estimate</span>
        <code className="cms-formula">count(x) = min over r of grid[r][h_r(x)]</code>
        <span className="cms-formula-sep">·</span>
        <code className="cms-formula cms-formula-result">
          d={d}, w={w}, space={space} counters, error ε ≈ e/w = {eps}
        </code>
        {focusToken && focusCols && (
          <>
            <span className="cms-formula-sep">·</span>
            <code className="cms-formula">
              cols("{focusToken}") = [{focusCols.join(', ')}]
            </code>
          </>
        )}
      </div>

      <div className="cms-stage">
        <svg
          className="cms-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Count-min sketch counter grid"
        >
          {/* Column index header */}
          {Array.from({ length: w }).map((_, c) => {
            const { x } = cellPos(0, c, layout);
            return (
              <text
                key={`col-${c}`}
                x={x + layout.cellW / 2}
                y={layout.padY + 8}
                textAnchor="middle"
                className="cms-axis-label"
              >
                {c}
              </text>
            );
          })}

          {renderGrid.map((row, r) => {
            const rowY = cellPos(r, 0, layout).y;
            return (
              <g key={`row-${r}`}>
                {/* Row / hash label */}
                <text
                  x={layout.padX - 12}
                  y={rowY + layout.cellH / 2 + 4}
                  textAnchor="end"
                  className="cms-axis-label cms-row-label"
                >
                  h{r}
                </text>
                {row.map((val, c) => {
                  const { x, y } = cellPos(r, c, layout);
                  const k = cellKey(r, c);
                  const isActive = activeSet.has(k);
                  const isPending = pendingSet.has(k);
                  const isMin =
                    minCell &&
                    minCell.r === r &&
                    minCell.c === c &&
                    (status === 'query-over' || status === 'query-exact');
                  const cls = [
                    'cms-cell',
                    val > 0 ? 'cms-cell-nonzero' : 'cms-cell-zero',
                    isActive && status === 'bump' ? 'cms-cell-bump' : '',
                    isActive && status === 'probe' ? 'cms-cell-probe' : '',
                    isActive && status === 'inc-done' ? 'cms-cell-done' : '',
                    isMin ? 'cms-cell-min' : '',
                    isActive && !isMin ? 'cms-cell-active' : '',
                    isPending ? 'cms-cell-pending' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <g key={`cell-${r}-${c}`} className={cls}>
                      <rect
                        x={x}
                        y={y}
                        width={layout.cellW}
                        height={layout.cellH}
                        rx={6}
                        className="cms-cell-box"
                      />
                      <text
                        x={x + layout.cellW / 2}
                        y={y + layout.cellH / 2 + 5}
                        textAnchor="middle"
                        className="cms-cell-val"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cms-footer">
        <div className="cms-stat">
          <span className="cms-stat-label">Depth d</span>
          <span className="cms-stat-value">{d} rows</span>
        </div>
        <div className="cms-stat">
          <span className="cms-stat-label">Width w</span>
          <span className="cms-stat-value">{w} cols</span>
        </div>
        <div className="cms-stat">
          <span className="cms-stat-label">Stream size</span>
          <span className="cms-stat-value">{totalIncrements}</span>
        </div>
        <div className="cms-stat">
          <span className="cms-stat-label">Step</span>
          <span className="cms-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        {focusToken && (
          <div className="cms-stat">
            <span className="cms-stat-label">Hashed cells</span>
            <span className="cms-stat-value">
              {focusCols
                ? focusCols.map((c, r) => `(${r},${c})`).join(' ')
                : '—'}
            </span>
          </div>
        )}
        {focusTruth !== null && (
          <div className="cms-stat">
            <span className="cms-stat-label">Estimate vs true</span>
            <span className="cms-stat-value cms-stat-emph">
              min {focusMin === null || focusMin === Infinity ? '—' : focusMin} · true {focusTruth}
            </span>
          </div>
        )}
        <div className="cms-stat cms-stat-grow">
          <span className="cms-stat-label">Current operation</span>
          <span className="cms-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
