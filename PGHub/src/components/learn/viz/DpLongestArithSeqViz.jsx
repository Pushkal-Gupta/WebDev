import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus } from 'lucide-react';
import './DpLongestArithSeqViz.css';

const DEFAULT_NUMS = [9, 4, 7, 2, 10];
const MAX_LEN = 8;
const MIN_LEN = 2;

function buildFrames(nums) {
  const frames = [];
  const dp = nums.map(() => ({}));
  const back = nums.map(() => ({}));
  let bestLen = nums.length > 0 ? 1 : 0;
  let bestEnd = nums.length > 0 ? 0 : -1;
  let bestDiff = 0;

  const reconstruct = (end, diff) => {
    if (end < 0) return [];
    const chain = [end];
    let cur = end;
    let d = diff;
    while (back[cur][d] !== undefined) {
      cur = back[cur][d];
      chain.push(cur);
      d = diff;
    }
    return chain.reverse();
  };

  const snap = (extra) => ({
    i: null,
    j: null,
    diff: null,
    updatedLen: null,
    bestLen,
    bestEnd,
    bestDiff,
    bestChain: reconstruct(bestEnd, bestDiff),
    activeMap: extra.i != null ? { ...dp[extra.i] } : {},
    note: '',
    done: false,
    ...extra,
  });

  if (nums.length === 0) {
    frames.push(snap({ note: 'Empty array — no subsequence exists.', done: true }));
    return frames;
  }

  frames.push(
    snap({
      note: `Start with an empty dp map per index. Every single element is itself an arithmetic run of length 1, so the best so far is 1.`,
    }),
  );

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      const diff = nums[i] - nums[j];
      const prior = dp[j][diff] !== undefined ? dp[j][diff] : 1;
      const updated = prior + 1;
      dp[i][diff] = updated;
      back[i][diff] = j;
      if (updated > bestLen) {
        bestLen = updated;
        bestEnd = i;
        bestDiff = diff;
      }
      frames.push(
        snap({
          i,
          j,
          diff,
          updatedLen: updated,
          activeMap: { ...dp[i] },
          note: `Pair (j=${j}, i=${i}): diff = nums[${i}] − nums[${j}] = ${nums[i]} − ${nums[j]} = ${diff}. dp[${j}][${diff}]=${prior} → dp[${i}][${diff}] = ${prior}+1 = ${updated}. Best run length = ${bestLen}.`,
        }),
      );
    }
  }

  frames.push(
    snap({
      done: true,
      note: `Done. Longest arithmetic subsequence has length ${bestLen} with common difference ${bestDiff}, ending at index ${bestEnd}. The highlighted indices form one optimal run.`,
    }),
  );

  return frames;
}

export default function DpLongestArithSeqViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [nums, setNums] = useState(() => [...DEFAULT_NUMS]);
  const [draft, setDraft] = useState(() => DEFAULT_NUMS.join(', '));
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(nums), [nums]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const applyDraft = (raw) => {
    const parsed = raw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => Number(t))
      .filter((n) => Number.isFinite(n))
      .slice(0, MAX_LEN);
    if (parsed.length < MIN_LEN) return;
    setIsRunningRaw(false);
    setStep(0);
    setNums(parsed.map((n) => Math.round(n)));
  };

  const addElement = () => {
    if (nums.length >= MAX_LEN) return;
    const seed = (nums.length * 7 + 3) % 13;
    const next = [...nums, seed];
    setIsRunningRaw(false);
    setStep(0);
    setNums(next);
    setDraft(next.join(', '));
  };

  const removeElement = () => {
    if (nums.length <= MIN_LEN) return;
    const next = nums.slice(0, -1);
    setIsRunningRaw(false);
    setStep(0);
    setNums(next);
    setDraft(next.join(', '));
  };

  const W = 940;
  const CELL = Math.min(72, Math.floor((W - 360) / Math.max(nums.length, 1)));
  const arrStartX = 40;
  const arrY = 60;
  const arrH = 52;
  const panelX = arrStartX + nums.length * (CELL + 8) + 28;
  const mapY = 168;
  const H = 430;
  const realPanelX = Math.max(panelX, 520);
  const panelW = W - realPanelX - 28;

  const chainSet = useMemo(() => new Set(current.bestChain), [current.bestChain]);

  const mapEntries = useMemo(() => {
    const entries = Object.entries(current.activeMap).map(([d, len]) => ({
      diff: Number(d),
      len,
    }));
    entries.sort((a, b) => a.diff - b.diff);
    return entries;
  }, [current.activeMap]);

  const cellFill = (idx) => {
    if (idx === current.i) return 'var(--hue-pink)';
    if (idx === current.j) return 'var(--hue-sky)';
    if (chainSet.has(idx)) return 'var(--accent)';
    return 'var(--bg)';
  };

  const cellDark = (idx) =>
    idx === current.i || idx === current.j || chainSet.has(idx);

  const entryCols = 4;
  const entryW = 96;
  const entryH = 44;
  const entryGapX = 12;
  const entryGapY = 12;

  return (
    <div className="dlas">
      <div className="dlas-head">
        <h3 className="dlas-title">Longest arithmetic subsequence — dp keyed by common difference</h3>
        <p className="dlas-sub">
          dp[i][diff] = longest arithmetic run ending at index i with step diff. For each pair (j, i) the step is
          nums[i] − nums[j]; extend the run that ended at j with that same diff: dp[i][diff] = dp[j][diff] + 1.
        </p>
      </div>

      <div className="dlas-controls">
        <div className="dlas-actions">
          <div className="dlas-buttons">
            <button
              type="button"
              className="dlas-btn dlas-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="dlas-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="dlas-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="dlas-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="dlas-edit">
            <span className="dlas-edit-label">nums</span>
            <input
              type="text"
              className="dlas-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => applyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyDraft(e.currentTarget.value);
              }}
              aria-label="array values"
            />
            <button
              type="button"
              className="dlas-chip"
              onClick={removeElement}
              disabled={nums.length <= MIN_LEN}
              aria-label="remove last element"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              className="dlas-chip"
              onClick={addElement}
              disabled={nums.length >= MAX_LEN}
              aria-label="add element"
            >
              <Plus size={13} />
            </button>
          </div>

          <label className="dlas-speed">
            <span className="dlas-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="dlas-speed-range"
            />
            <span className="dlas-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="dlas-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="dlas-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dlas-svg" preserveAspectRatio="xMidYMid meet">
          <text x={arrStartX} y={arrY - 14} className="dlas-row-label">
            array — pink = i, sky = j, accent = best run so far
          </text>

          {nums.map((v, idx) => {
            const x = arrStartX + idx * (CELL + 8);
            const fill = cellFill(idx);
            const dark = cellDark(idx);
            return (
              <g key={`cell-${idx}`}>
                <rect
                  x={x}
                  y={arrY}
                  width={CELL}
                  height={arrH}
                  rx={7}
                  fill={fill}
                  stroke={
                    idx === current.i
                      ? 'var(--hue-pink)'
                      : idx === current.j
                        ? 'var(--hue-sky)'
                        : 'var(--border)'
                  }
                  strokeWidth={idx === current.i || idx === current.j ? 2.4 : 1.2}
                />
                <text
                  x={x + CELL / 2}
                  y={arrY + arrH / 2 + 6}
                  className="dlas-cell-v"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-main)' }}
                >
                  {v}
                </text>
                <text x={x + CELL / 2} y={arrY + arrH + 16} className="dlas-cell-idx">
                  {idx}
                </text>
              </g>
            );
          })}

          {current.i != null && current.j != null && (
            <text x={arrStartX} y={mapY - 36} className="dlas-diff-line">
              {`diff = nums[${current.i}] − nums[${current.j}] = ${nums[current.i]} − ${nums[current.j]} = ${current.diff}`}
            </text>
          )}

          <text x={arrStartX} y={mapY - 12} className="dlas-row-label">
            {current.i != null ? `dp[${current.i}] — diff → run length` : 'dp map for active index'}
          </text>

          {mapEntries.length === 0 ? (
            <text x={arrStartX + 4} y={mapY + 24} className="dlas-empty">
              {current.done ? 'all pairs processed' : 'no entries yet'}
            </text>
          ) : (
            mapEntries.map((e, k) => {
              const col = k % entryCols;
              const row = Math.floor(k / entryCols);
              const ex = arrStartX + col * (entryW + entryGapX);
              const ey = mapY + row * (entryH + entryGapY);
              const isActive = current.diff === e.diff && current.updatedLen === e.len;
              return (
                <g key={`map-${e.diff}`}>
                  <rect
                    x={ex}
                    y={ey}
                    width={entryW}
                    height={entryH}
                    rx={6}
                    fill={isActive ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                    stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={isActive ? 2.2 : 1.2}
                  />
                  <text x={ex + 10} y={ey + 18} className="dlas-entry-diff">
                    {`d=${e.diff}`}
                  </text>
                  <text x={ex + entryW - 10} y={ey + entryH - 11} className="dlas-entry-len">
                    {`len ${e.len}`}
                  </text>
                </g>
              );
            })
          )}

          <rect
            x={realPanelX - 12}
            y={arrY - 12}
            width={panelW + 24}
            height={H - arrY - 18}
            fill="var(--surface)"
            stroke="var(--border)"
            rx={8}
          />
          <text x={realPanelX} y={arrY + 8} className="dlas-row-label">
            best run so far
          </text>
          <text x={realPanelX} y={arrY + 46} className="dlas-readout-big">
            {`length ${current.bestLen}`}
          </text>
          <text x={realPanelX} y={arrY + 72} className="dlas-readout-sub">
            {`common difference ${current.bestDiff}`}
          </text>

          <line
            x1={realPanelX}
            y1={arrY + 90}
            x2={realPanelX + panelW}
            y2={arrY + 90}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text x={realPanelX} y={arrY + 114} className="dlas-row-label">
            subsequence
          </text>
          <text x={realPanelX} y={arrY + 142} className="dlas-readout-seq">
            {current.bestChain.length
              ? current.bestChain.map((idx) => nums[idx]).join('  →  ')
              : '—'}
          </text>
          <text x={realPanelX} y={arrY + 166} className="dlas-readout-idx">
            {current.bestChain.length ? `indices [${current.bestChain.join(', ')}]` : ''}
          </text>

          <line
            x1={realPanelX}
            y1={arrY + 184}
            x2={realPanelX + panelW}
            y2={arrY + 184}
            stroke="var(--border)"
            strokeWidth={1}
          />
          {[
            { fill: 'var(--hue-pink)', label: 'index i (end of run)' },
            { fill: 'var(--hue-sky)', label: 'index j (extend from)' },
            { fill: 'var(--accent)', label: 'best subsequence' },
          ].map((row, li) => {
            const ly = arrY + 204 + li * 24;
            return (
              <g key={`lg-${row.label}`}>
                <rect
                  x={realPanelX}
                  y={ly}
                  width={16}
                  height={16}
                  rx={4}
                  fill={row.fill}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text x={realPanelX + 24} y={ly + 12} className="dlas-legend-text">
                  {row.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dlas-metrics">
        <div className="dlas-metric">
          <span className="dlas-metric-label">best length</span>
          <span className="dlas-metric-value">{current.bestLen}</span>
        </div>
        <div className="dlas-metric">
          <span className="dlas-metric-label">best diff</span>
          <span className="dlas-metric-value">{current.bestDiff}</span>
        </div>
        <div className="dlas-metric">
          <span className="dlas-metric-label">pair (j, i)</span>
          <span className="dlas-metric-value">
            {current.i != null ? `(${current.j}, ${current.i})` : '—'}
          </span>
        </div>
        <div className="dlas-metric">
          <span className="dlas-metric-label">dp update</span>
          <span className="dlas-metric-value">
            {current.updatedLen != null ? `d=${current.diff} → ${current.updatedLen}` : '—'}
          </span>
        </div>
      </div>

      <div className="dlas-trace">
        <span className="dlas-trace-label">trace</span>
        <span className="dlas-trace-vals">{current.note}</span>
      </div>
    </div>
  );
}
