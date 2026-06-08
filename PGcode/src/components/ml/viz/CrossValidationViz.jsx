import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const DEFAULT_N = 20;
const DEFAULT_K = 5;
const MIN_K = 2;
const MAX_K = 10;
const STEP_DELAY = 700;

// SVG layout — wide horizontal strip across the top.
const SW = 520;
const SH = 240;
const STRIP_PAD_X = 24;
const STRIP_PAD_TOP = 60;
const STRIP_HEIGHT = 42;
const ACC_BAND_Y = STRIP_PAD_TOP + STRIP_HEIGHT + 40;
const ACC_BAND_H = 70;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Stable hash from a sorted list of indices → bounded [0, 1).
function hashIndices(indices) {
  let h = 2166136261 >>> 0;
  const sorted = [...indices].sort((a, b) => a - b);
  for (const idx of sorted) {
    h ^= idx + 0x9e3779b9 + ((h << 6) >>> 0) + ((h >>> 2) >>> 0);
    h = (h * 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967296;
}

// Deterministic fake "accuracy" given which points are in the test fold. Anchored
// around 0.85 with mild spread so the readout looks plausible.
function fakeAccuracy(testIndices) {
  const u = hashIndices(testIndices);
  // Centered around 0.85, spread ±0.07; clamp to [0.60, 0.99].
  const acc = 0.85 + (u - 0.5) * 0.14;
  return Math.max(0.60, Math.min(0.99, acc));
}

// Partition [0..N-1] into K contiguous folds — sizes differ by at most one.
function buildFolds(n, k) {
  const folds = [];
  const base = Math.floor(n / k);
  const rem = n % k;
  let cursor = 0;
  for (let i = 0; i < k; i++) {
    const size = base + (i < rem ? 1 : 0);
    const test = [];
    for (let j = 0; j < size; j++) test.push(cursor + j);
    cursor += size;
    folds.push({ test });
  }
  return folds;
}

function mean(arr) {
  if (!arr.length) return 0;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  let s = 0;
  for (const v of arr) s += (v - m) * (v - m);
  return Math.sqrt(s / arr.length);
}

function formatRanges(indices) {
  if (!indices.length) return '—';
  const sorted = [...indices].sort((a, b) => a - b);
  const out = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    out.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = sorted[i];
    prev = sorted[i];
  }
  out.push(start === prev ? `${start}` : `${start}–${prev}`);
  return out.join(', ');
}

export default function CrossValidationViz({ initialN = DEFAULT_N, initialK = DEFAULT_K } = {}) {
  const [n] = useState(() => Math.max(4, Math.min(40, initialN | 0 || DEFAULT_N)));
  const [k, setK] = useState(() => Math.max(MIN_K, Math.min(MAX_K, initialK | 0 || DEFAULT_K)));

  const folds = useMemo(() => buildFolds(n, k), [n, k]);

  // foldAccs[i] = number once fold i has been graded; null otherwise.
  const [foldAccs, setFoldAccs] = useState(() => new Array(k).fill(null));
  const [currentFold, setCurrentFold] = useState(0);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  // Whenever k changes, reset the run.
  useEffect(() => {
    setFoldAccs(new Array(k).fill(null));
    setCurrentFold(0);
    setRunning(false);
    runningRef.current = false;
  }, [k]);

  const completedCount = useMemo(
    () => foldAccs.reduce((c, a) => c + (a == null ? 0 : 1), 0),
    [foldAccs]
  );
  const allDone = completedCount === k;

  // Display the fold being shown: the next-to-run fold while in progress,
  // or the final fold once everything has been graded.
  const displayFold = allDone ? k - 1 : currentFold;
  const displayFoldData = folds[displayFold] || folds[0];
  const testSet = displayFoldData.test;
  const testSetMembership = useMemo(() => {
    const s = new Set(testSet);
    return s;
  }, [testSet]);

  const trainSet = useMemo(() => {
    const out = [];
    for (let i = 0; i < n; i++) if (!testSetMembership.has(i)) out.push(i);
    return out;
  }, [n, testSetMembership]);

  const completedAccs = useMemo(
    () => foldAccs.filter((a) => a != null),
    [foldAccs]
  );
  const meanAcc = useMemo(() => mean(completedAccs), [completedAccs]);
  const stdAcc = useMemo(() => stddev(completedAccs), [completedAccs]);

  const stepOne = useCallback(() => {
    setFoldAccs((prev) => {
      // Find the first ungraded fold.
      const idx = prev.findIndex((a) => a == null);
      if (idx < 0) return prev;
      const acc = fakeAccuracy(folds[idx].test);
      const next = prev.slice();
      next[idx] = acc;
      // Move the "current" cursor forward.
      setCurrentFold(Math.min(k - 1, idx + 1));
      return next;
    });
  }, [folds, k]);

  const handleStepFold = useCallback(() => {
    if (runningRef.current) return;
    stepOne();
  }, [stepOne]);

  const handleRunAll = useCallback(() => {
    if (runningRef.current) return;
    if (foldAccs.every((a) => a != null)) return;
    runningRef.current = true;
    setRunning(true);
  }, [foldAccs]);

  const handleStop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setFoldAccs(new Array(k).fill(null));
    setCurrentFold(0);
  }, [k]);

  // Auto-stepper while "Run All" is active.
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setFoldAccs((prev) => {
        const idx = prev.findIndex((a) => a == null);
        if (idx < 0) {
          runningRef.current = false;
          setRunning(false);
          return prev;
        }
        const acc = fakeAccuracy(folds[idx].test);
        const next = prev.slice();
        next[idx] = acc;
        setCurrentFold(Math.min(k - 1, idx + 1));
        if (idx + 1 >= prev.length) {
          runningRef.current = false;
          setRunning(false);
        }
        return next;
      });
    }, STEP_DELAY);
    return () => clearInterval(id);
  }, [running, folds]);

  const cellW = (SW - STRIP_PAD_X * 2) / n;
  const cellGap = Math.min(2, cellW * 0.12);
  const cellInner = Math.max(2, cellW - cellGap);

  const COLOR_TEST = 'var(--accent)';
  const COLOR_TRAIN = 'var(--text-dim)';
  const COLOR_DONE_TEST = 'rgba(var(--accent-rgb), 0.35)';

  // For each cell, decide its visual state.
  function cellFill(i) {
    if (testSetMembership.has(i)) return COLOR_TEST;
    return 'transparent';
  }

  function cellStroke(i) {
    if (testSetMembership.has(i)) return COLOR_TEST;
    return COLOR_TRAIN;
  }

  // Bar chart of per-fold accuracy.
  const barAreaX = STRIP_PAD_X;
  const barAreaY = ACC_BAND_Y;
  const barAreaW = SW - STRIP_PAD_X * 2;
  const barAreaH = ACC_BAND_H;
  const barW = barAreaW / k;
  const ACC_MIN = 0.55;
  const ACC_MAX = 1.0;

  function accToY(a) {
    const t = (a - ACC_MIN) / (ACC_MAX - ACC_MIN);
    return barAreaY + barAreaH - t * barAreaH;
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ flexDirection: 'column', gap: '0.6rem' }}>
        <svg
          viewBox={`0 0 ${SW} ${SH}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${SW} / ${SH}`, maxWidth: '620px' }}
        >
          {/* Header line */}
          <text
            x={STRIP_PAD_X}
            y={20}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
          >
            DATASET — N={n}
          </text>
          <text
            x={SW - STRIP_PAD_X}
            y={20}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
            textAnchor="end"
          >
            FOLD {Math.min(displayFold + 1, k)} / {k}
          </text>

          {/* Legend */}
          <g>
            <rect
              x={STRIP_PAD_X}
              y={32}
              width={10}
              height={10}
              fill={COLOR_TEST}
              opacity="0.9"
            />
            <text
              x={STRIP_PAD_X + 14}
              y={41}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >
              test
            </text>
            <rect
              x={STRIP_PAD_X + 70}
              y={32}
              width={10}
              height={10}
              fill="transparent"
              stroke="var(--text-dim)"
              strokeWidth="1"
            />
            <text
              x={STRIP_PAD_X + 84}
              y={41}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >
              train
            </text>
          </g>

          {/* Data point strip */}
          {Array.from({ length: n }).map((_, i) => {
            const x = STRIP_PAD_X + i * cellW + cellGap / 2;
            const isTest = testSetMembership.has(i);
            return (
              <g key={`cell-${i}`}>
                <rect
                  x={x}
                  y={STRIP_PAD_TOP}
                  width={cellInner}
                  height={STRIP_HEIGHT}
                  fill={cellFill(i)}
                  fillOpacity={isTest ? 0.85 : 0}
                  stroke={cellStroke(i)}
                  strokeWidth={isTest ? 1.5 : 1}
                  rx="2"
                  style={{ transition: 'fill 200ms ease, stroke 200ms ease' }}
                />
                {n <= 24 && (
                  <text
                    x={x + cellInner / 2}
                    y={STRIP_PAD_TOP + STRIP_HEIGHT + 12}
                    fontSize="8.5"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="middle"
                  >
                    {i}
                  </text>
                )}
              </g>
            );
          })}

          {/* Per-fold accuracy chart */}
          <g>
            {/* baseline */}
            <line
              x1={barAreaX}
              y1={barAreaY + barAreaH}
              x2={barAreaX + barAreaW}
              y2={barAreaY + barAreaH}
              stroke="var(--border)"
              strokeWidth="1"
            />
            {/* axis y labels at 0.6, 0.8, 1.0 */}
            {[0.6, 0.8, 1.0].map((tick) => (
              <g key={`yt-${tick}`}>
                <line
                  x1={barAreaX}
                  y1={accToY(tick)}
                  x2={barAreaX + barAreaW}
                  y2={accToY(tick)}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
                <text
                  x={barAreaX - 4}
                  y={accToY(tick) + 3}
                  fontSize="8.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}

            {/* mean line, if any */}
            {completedAccs.length > 0 && (
              <line
                x1={barAreaX}
                y1={accToY(meanAcc)}
                x2={barAreaX + barAreaW}
                y2={accToY(meanAcc)}
                stroke="var(--accent)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* bars */}
            {folds.map((_, i) => {
              const acc = foldAccs[i];
              const filled = acc != null;
              const x = barAreaX + i * barW + barW * 0.18;
              const w = barW * 0.64;
              const y = filled ? accToY(acc) : barAreaY + barAreaH - 2;
              const h = filled ? barAreaY + barAreaH - y : 2;
              const isCurrent = i === displayFold;
              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={Math.max(2, h)}
                    fill={filled ? (isCurrent ? 'var(--accent)' : COLOR_DONE_TEST) : 'var(--border)'}
                    opacity={filled ? 0.95 : 0.45}
                    stroke={isCurrent ? 'var(--accent)' : 'none'}
                    strokeWidth={isCurrent ? 1.4 : 0}
                    style={{ transition: 'y 220ms ease, height 220ms ease, fill 220ms ease' }}
                  />
                  <text
                    x={x + w / 2}
                    y={barAreaY + barAreaH + 12}
                    fontSize="8.5"
                    fill={isCurrent ? 'var(--accent)' : 'var(--text-dim)'}
                    fontFamily="var(--mono, monospace)"
                    textAnchor="middle"
                    fontWeight={isCurrent ? 700 : 400}
                  >
                    f{i + 1}
                  </text>
                  {filled && (
                    <text
                      x={x + w / 2}
                      y={y - 3}
                      fontSize="8.5"
                      fill="var(--text-main)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >
                      {snap(acc * 100, 1)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* axis label */}
            <text
              x={barAreaX}
              y={barAreaY - 4}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              letterSpacing="0.12em"
            >
              ACCURACY PER FOLD
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* K slider */}
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">K folds</span>
            <input
              type="range"
              min={MIN_K}
              max={MAX_K}
              step="1"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{k}</span>
          </label>
        </div>

        {/* Step / Run / Reset */}
        <div className="mlviz-row mlviz-btn-row" style={{ gap: '0.4rem' }}>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStepFold}
            disabled={running || allDone}
          >
            <StepForward size={13} />
            <span>Step Fold</span>
          </button>
          {running ? (
            <button
              type="button"
              className="mlviz-btn mlviz-btn-primary"
              onClick={handleStop}
            >
              <Square size={13} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              className="mlviz-btn mlviz-btn-primary"
              onClick={handleRunAll}
              disabled={allDone}
            >
              <Play size={13} />
              <span>Run All</span>
            </button>
          )}
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running || (completedCount === 0 && currentFold === 0)}
            style={{ marginLeft: 'auto' }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Index readout for current fold */}
        <div className="mlviz-row" style={{
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '0.25rem',
          fontFamily: 'var(--mono)',
          fontSize: '0.72rem',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
            <span style={{
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              minWidth: '54px',
            }}>
              test
            </span>
            <span style={{ color: 'var(--text-main)' }}>
              {formatRanges(testSet)}
              <span style={{ color: 'var(--text-dim)' }}>  ({testSet.length})</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
            <span style={{
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              minWidth: '54px',
            }}>
              train
            </span>
            <span style={{ color: 'var(--text-main)' }}>
              {formatRanges(trainSet)}
              <span style={{ color: 'var(--text-dim)' }}>  ({trainSet.length})</span>
            </span>
          </div>
        </div>

        {/* Final readout */}
        <div className="mlviz-row mlviz-row-hi" style={{
          gap: '1rem',
          fontFamily: 'var(--mono)',
          fontSize: '0.74rem',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>folds done</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {completedCount} / {k}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>mean acc</span>
            <span style={{
              color: allDone ? 'var(--accent)' : 'var(--text-main)',
              fontWeight: allDone ? 700 : 600,
            }}>
              {completedCount > 0 ? `${snap(meanAcc * 100, 2)}%` : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>± std</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {completedCount > 1 ? `${snap(stdAcc * 100, 2)}%` : '—'}
            </span>
          </div>
          {allDone && (
            <div style={{
              marginLeft: 'auto',
              padding: '0.35rem 0.55rem',
              border: '1px solid var(--accent)',
              borderRadius: '4px',
              background: 'rgba(var(--accent-rgb), 0.08)',
              color: 'var(--accent)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>
              {snap(meanAcc * 100, 2)}% ± {snap(stdAcc * 100, 2)}%
            </div>
          )}
        </div>

        <div className="mlviz-hint">
          K-fold splits data into K equal blocks · each block is held out once for test, rest trains · final score = mean ± std over folds
        </div>
      </div>
    </div>
  );
}
