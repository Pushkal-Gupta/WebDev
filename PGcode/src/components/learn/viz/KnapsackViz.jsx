import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Plus, Trash2 } from 'lucide-react';
import './KnapsackViz.css';

const MIN_CAP = 1;
const MAX_CAP = 20;
const DEFAULT_CAP = 10;
const MAX_ITEMS = 7;
const MIN_ITEMS = 1;
const TICK_MS = 480;

const DEFAULT_ITEMS = [
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
  { weight: 4, value: 5 },
  { weight: 5, value: 6 },
  { weight: 1, value: 2 },
];

function clampInt(value, min, max) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function buildSteps(items, W) {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  const steps = [];

  for (let i = 0; i <= n; i += 1) {
    for (let w = 0; w <= W; w += 1) {
      let kind;
      let value;
      let skip = null;
      let take = null;
      let canTake = false;
      let usedTake = false;

      if (i === 0 || w === 0) {
        value = 0;
        kind = 'base';
      } else {
        const wi = items[i - 1].weight;
        const vi = items[i - 1].value;
        skip = dp[i - 1][w];
        if (wi <= w) {
          canTake = true;
          take = dp[i - 1][w - wi] + vi;
          if (take > skip) {
            usedTake = true;
            value = take;
            kind = 'take';
          } else {
            value = skip;
            kind = 'skip';
          }
        } else {
          value = skip;
          kind = 'too-heavy';
        }
      }

      dp[i][w] = value;

      steps.push({
        idx: steps.length,
        i,
        w,
        kind,
        value,
        skip,
        take,
        canTake,
        usedTake,
        weight: i > 0 ? items[i - 1].weight : null,
        valueOf: i > 0 ? items[i - 1].value : null,
      });
    }
  }

  return { steps, finalDp: dp };
}

function traceback(items, dp, W) {
  const picks = new Set();
  let i = items.length;
  let w = W;
  while (i > 0 && w > 0) {
    if (dp[i][w] !== dp[i - 1][w]) {
      picks.add(i - 1);
      w -= items[i - 1].weight;
    }
    i -= 1;
  }
  return picks;
}

function cellId(i, w) {
  return `${i}-${w}`;
}

function formulaForStep(step) {
  if (!step) return 'dp[i][w] = max(dp[i-1][w], dp[i-1][w-wi] + vi)';
  const { i, w, kind, value, skip, take, weight, valueOf } = step;
  if (kind === 'base') {
    if (i === 0) return `dp[0][${w}] = 0   (no items left)`;
    return `dp[${i}][0] = 0   (capacity exhausted)`;
  }
  if (kind === 'too-heavy') {
    return `wi=${weight} > w=${w}   forced skip   dp[${i}][${w}] = dp[${i - 1}][${w}] = ${skip}`;
  }
  return `dp[${i}][${w}] = max(skip=${skip}, take=dp[${i - 1}][${w - weight}]+${valueOf}=${take}) = ${value}`;
}

function describeStep(step) {
  if (!step) return '';
  const { i, w, kind, value, skip, take, usedTake, weight, valueOf } = step;
  if (kind === 'base') {
    if (i === 0) return `Row 0 means no items are available, so dp[0][${w}] = 0.`;
    return `Column 0 means zero capacity, so dp[${i}][0] = 0.`;
  }
  if (kind === 'too-heavy') {
    return `Item ${i} weighs ${weight} but capacity is only ${w}. We cannot take it, so dp[${i}][${w}] copies the row above: ${skip}.`;
  }
  if (usedTake) {
    return `Taking item ${i} (w=${weight}, v=${valueOf}) gives ${take}, beating skip=${skip}. dp[${i}][${w}] = ${value}.`;
  }
  return `Skipping item ${i} gives ${skip}, which beats take=${take}. dp[${i}][${w}] = ${value}.`;
}

export default function KnapsackViz() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [W, setW] = useState(DEFAULT_CAP);
  const built = useMemo(() => buildSteps(items, W), [items, W]);
  const { steps, finalDp } = built;
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setIdx(-1);
    setPlaying(false);
  }, [items, W]);

  const total = steps.length;
  const current = idx >= 0 ? steps[idx] : null;
  const atEnd = idx >= total - 1;
  const finalAnswer = finalDp[items.length][W];

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= total - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
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

  useEffect(() => {
    if (idx >= total - 1 && playing) setPlaying(false);
  }, [idx, total, playing]);

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

  const handleRunAll = () => {
    setPlaying(false);
    setIdx(total - 1);
  };

  const updateItem = (index, field, value) => {
    const v = clampInt(value, 1, 20);
    setItems((prev) => prev.map((it, k) => (k === index ? { ...it, [field]: v } : it)));
  };

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, { weight: 1, value: 1 }]);
  };

  const removeItem = (index) => {
    if (items.length <= MIN_ITEMS) return;
    setItems((prev) => prev.filter((_, k) => k !== index));
  };

  // Filled map: which cells have been computed up to current step
  const filledMap = useMemo(() => {
    const map = new Map();
    if (idx < 0) return map;
    for (let k = 0; k <= idx; k += 1) {
      const s = steps[k];
      map.set(cellId(s.i, s.w), s.value);
    }
    return map;
  }, [idx, steps]);

  // Dependency cells for current step
  const dependencies = useMemo(() => {
    if (!current || current.kind === 'base') return [];
    const deps = [];
    // skip dep: dp[i-1][w] (directly above)
    deps.push({ i: current.i - 1, w: current.w, role: 'skip' });
    // take dep: dp[i-1][w-wi] (above-left by wi)
    if (current.canTake) {
      deps.push({ i: current.i - 1, w: current.w - current.weight, role: 'take' });
    }
    return deps;
  }, [current]);

  const depMap = useMemo(() => {
    const map = new Map();
    dependencies.forEach((d) => map.set(cellId(d.i, d.w), d.role));
    return map;
  }, [dependencies]);

  // Traceback picks (only when finished)
  const picks = useMemo(() => {
    if (!atEnd) return new Set();
    return traceback(items, finalDp, W);
  }, [atEnd, items, finalDp, W]);

  // SVG layout
  const n = items.length;
  const rows = n + 1;
  const cols = W + 1;
  const PADDING_L = 38;
  const PADDING_T = 30;
  const PADDING_R = 12;
  const PADDING_B = 12;
  const cellSize = useMemo(() => {
    const maxCanvasW = 760;
    const maxCanvasH = 420;
    const availW = maxCanvasW - PADDING_L - PADDING_R;
    const availH = maxCanvasH - PADDING_T - PADDING_B;
    return Math.max(22, Math.floor(Math.min(availW / cols, availH / rows)));
  }, [cols, rows]);

  const gridW = cellSize * cols;
  const gridH = cellSize * rows;
  const viewW = gridW + PADDING_L + PADDING_R;
  const viewH = gridH + PADDING_T + PADDING_B;

  const cellX = (w) => PADDING_L + w * cellSize;
  const cellY = (i) => PADDING_T + i * cellSize;
  const cellCx = (w) => cellX(w) + cellSize / 2;
  const cellCy = (i) => cellY(i) + cellSize / 2;

  return (
    <div className="knapsackviz">
      <div className="knapsackviz-header">
        <div className="knapsackviz-title">0/1 Knapsack — bottom-up DP</div>
        <div className="knapsackviz-cap">
          <label htmlFor="knapsackviz-cap">capacity W</label>
          <input
            id="knapsackviz-cap"
            type="range"
            min={MIN_CAP}
            max={MAX_CAP}
            value={W}
            onChange={(e) => setW(clampInt(e.target.value, MIN_CAP, MAX_CAP))}
          />
          <span className="knapsackviz-cap-value">{W}</span>
        </div>
      </div>

      <div className="knapsackviz-items">
        <div className="knapsackviz-items-head">
          <span>item</span>
          <span>weight</span>
          <span>value</span>
          <span>v/w</span>
          <span></span>
        </div>
        {items.map((it, k) => {
          const ratio = (it.value / it.weight).toFixed(2);
          const picked = picks.has(k);
          return (
            <div
              key={`item-${k}`}
              className={`knapsackviz-items-row${picked ? ' knapsackviz-items-row-picked' : ''}`}
            >
              <span className="knapsackviz-items-idx">{k + 1}</span>
              <input
                type="number"
                min={1}
                max={20}
                value={it.weight}
                onChange={(e) => updateItem(k, 'weight', e.target.value)}
                aria-label={`weight of item ${k + 1}`}
              />
              <input
                type="number"
                min={1}
                max={20}
                value={it.value}
                onChange={(e) => updateItem(k, 'value', e.target.value)}
                aria-label={`value of item ${k + 1}`}
              />
              <span className="knapsackviz-items-ratio">{ratio}</span>
              <button
                type="button"
                className="knapsackviz-items-remove"
                onClick={() => removeItem(k)}
                disabled={items.length <= MIN_ITEMS}
                aria-label={`remove item ${k + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="knapsackviz-items-add"
          onClick={addItem}
          disabled={items.length >= MAX_ITEMS}
        >
          <Plus size={14} />
          <span>add item</span>
        </button>
      </div>

      <div className="knapsackviz-legend">
        <span className="knapsackviz-legend-item">
          <span className="knapsackviz-dot knapsackviz-dot-empty" /> empty
        </span>
        <span className="knapsackviz-legend-item">
          <span className="knapsackviz-dot knapsackviz-dot-filled" /> filled
        </span>
        <span className="knapsackviz-legend-item">
          <span className="knapsackviz-dot knapsackviz-dot-skip" /> skip dep
        </span>
        <span className="knapsackviz-legend-item">
          <span className="knapsackviz-dot knapsackviz-dot-take" /> take dep
        </span>
        <span className="knapsackviz-legend-item">
          <span className="knapsackviz-dot knapsackviz-dot-current" /> filling now
        </span>
        <span className="knapsackviz-legend-item">
          <span className="knapsackviz-dot knapsackviz-dot-goal" /> answer
        </span>
      </div>

      <div className="knapsackviz-stage">
        <svg
          className="knapsackviz-svg"
          viewBox={`0 0 ${viewW} ${viewH}`}
          role="img"
          aria-label={`Knapsack DP table ${rows} by ${cols}`}
        >
          <defs>
            <marker
              id="knapsackviz-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="knapsackviz-arrow-head" />
            </marker>
          </defs>

          {/* Axis labels */}
          <g className="knapsackviz-axes">
            <text
              className="knapsackviz-axis-corner"
              x={PADDING_L / 2}
              y={PADDING_T / 2}
              textAnchor="middle"
              dominantBaseline="central"
            >
              i \ w
            </text>
            {Array.from({ length: cols }).map((_, w) => (
              <text
                key={`col-${w}`}
                className="knapsackviz-axis-label"
                x={cellCx(w)}
                y={PADDING_T - 8}
                textAnchor="middle"
              >
                {w}
              </text>
            ))}
            {Array.from({ length: rows }).map((_, i) => (
              <text
                key={`row-${i}`}
                className="knapsackviz-axis-label"
                x={PADDING_L - 8}
                y={cellCy(i)}
                textAnchor="end"
                dominantBaseline="central"
              >
                {i}
              </text>
            ))}
          </g>

          {/* Cells */}
          <g className="knapsackviz-cells">
            {Array.from({ length: rows }).flatMap((_, i) =>
              Array.from({ length: cols }).map((__, w) => {
                const id = cellId(i, w);
                const isFilled = filledMap.has(id);
                const isCurrent = current && current.i === i && current.w === w;
                const depRole = depMap.get(id);
                const isGoal = i === n && w === W;
                let cls = 'knapsackviz-cell';
                if (isFilled && !isCurrent) cls += ' knapsackviz-cell-filled';
                if (isCurrent) cls += ' knapsackviz-cell-current';
                if (depRole === 'skip') cls += ' knapsackviz-cell-dep-skip';
                if (depRole === 'take') cls += ' knapsackviz-cell-dep-take';
                if (isGoal && atEnd) cls += ' knapsackviz-cell-goal';
                return (
                  <g key={id} className={cls}>
                    <rect
                      x={cellX(w)}
                      y={cellY(i)}
                      width={cellSize}
                      height={cellSize}
                      rx={5}
                      ry={5}
                    />
                    {isFilled ? (
                      <text
                        x={cellCx(w)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {filledMap.get(id)}
                      </text>
                    ) : (
                      <text
                        className="knapsackviz-cell-placeholder"
                        x={cellCx(w)}
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
            <g className="knapsackviz-arrows">
              {dependencies.map((d) => {
                const x1 = cellCx(d.w);
                const y1 = cellCy(d.i);
                const x2 = cellCx(current.w);
                const y2 = cellCy(current.i);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const inset = cellSize * 0.34;
                const sx = x1 + (dx / len) * inset;
                const sy = y1 + (dy / len) * inset;
                const ex = x2 - (dx / len) * inset;
                const ey = y2 - (dy / len) * inset;
                return (
                  <line
                    key={`arrow-${d.role}`}
                    className={`knapsackviz-arrow knapsackviz-arrow-${d.role}`}
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    markerEnd="url(#knapsackviz-arrow)"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="knapsackviz-status">
        <div className="knapsackviz-status-row">
          <span className="knapsackviz-status-label">Step</span>
          <span className="knapsackviz-status-value">
            {Math.max(idx + 1, 0)} / {total}
          </span>
        </div>
        <div className="knapsackviz-status-row">
          <span className="knapsackviz-status-label">Cell</span>
          <span className="knapsackviz-status-value">
            {current ? (
              <>dp[{current.i}][{current.w}]</>
            ) : (
              <span className="knapsackviz-muted">not started</span>
            )}
          </span>
        </div>
        <div className="knapsackviz-status-row">
          <span className="knapsackviz-status-label">Table</span>
          <span className="knapsackviz-status-value">{rows} × {cols}</span>
        </div>
      </div>

      <div className="knapsackviz-formula">
        <span className="knapsackviz-formula-label">Recurrence</span>
        <code className="knapsackviz-formula-body">{formulaForStep(current)}</code>
      </div>

      <p className="knapsackviz-caption">
        {current
          ? describeStep(current)
          : `Press Step or Run to fill the (n+1) × (W+1) table row by row. The bottom-right cell holds the optimal value for capacity ${W}.`}
      </p>

      {atEnd && (
        <div className="knapsackviz-answer">
          <span className="knapsackviz-answer-label">Optimal value</span>
          <span className="knapsackviz-answer-value">{finalAnswer}</span>
          <span className="knapsackviz-answer-note">
            picked items:{' '}
            {picks.size === 0
              ? 'none'
              : Array.from(picks)
                  .sort((a, b) => a - b)
                  .map((k) => `#${k + 1}`)
                  .join(', ')}
          </span>
        </div>
      )}

      <div className="knapsackviz-controls">
        <button
          type="button"
          className="knapsackviz-btn knapsackviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="knapsackviz-btn knapsackviz-btn-primary"
          onClick={handleRun}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="knapsackviz-btn knapsackviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <button
          type="button"
          className="knapsackviz-btn knapsackviz-btn-secondary"
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
