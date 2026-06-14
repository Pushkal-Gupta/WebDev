import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Shuffle } from 'lucide-react';
import './LISPatienceViz.css';

// Lower-bound binary search inside frame builder, emitting one probe frame per
// comparison so the reader watches the search converge. Returns the index of
// the first tails entry >= x (or tails.length if x is larger than all).
function buildFrames(input) {
  const n = input.length;
  const frames = [];
  const tails = []; // tails[len-1] = smallest possible tail of an increasing subseq of length len
  const tailIdx = []; // index in input of the element currently sitting at each tails slot
  const prev = new Array(n).fill(-1); // predecessor link for reconstruction

  const snap = (extra) => ({
    phase: 'init',
    tails: [...tails],
    cur: null, // index in input of element being processed
    lo: null,
    hi: null,
    mid: null,
    found: null, // resolved insertion index
    action: null, // 'append' | 'replace'
    lisIndices: [], // indices (in input) forming the reconstructed LIS at end
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Start: scan ${n} values left to right. Keep tails[] where tails[k] is the smallest possible tail of an increasing subsequence of length k+1. The final LIS length is tails.length.`,
  }));

  for (let i = 0; i < n; i++) {
    const x = input[i];

    // lower_bound: first index with tails[idx] >= x
    let lo = 0;
    let hi = tails.length;
    frames.push(snap({
      phase: 'pick',
      cur: i,
      lo,
      hi,
      note: tails.length === 0
        ? `x=${x}: tails is empty, so x starts the first pile. Append.`
        : `x=${x}: binary search tails [${tails.join(', ')}] for the first entry >= ${x}.`,
    }));

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      frames.push(snap({
        phase: 'probe',
        cur: i,
        lo,
        hi,
        mid,
        note: `probe mid=${mid}: tails[${mid}]=${tails[mid]} ${tails[mid] >= x ? '>=' : '<'} ${x} -> ${tails[mid] >= x ? 'search left half' : 'search right half'}.`,
      }));
      if (tails[mid] >= x) hi = mid;
      else lo = mid + 1;
    }

    const idx = lo;
    const isAppend = idx === tails.length;

    // link predecessor: element before this in tails (the slot to the left)
    prev[i] = idx > 0 ? tailIdx[idx - 1] : -1;

    if (isAppend) {
      tails.push(x);
      tailIdx.push(i);
    } else {
      tails[idx] = x;
      tailIdx[idx] = i;
    }

    frames.push(snap({
      phase: 'apply',
      cur: i,
      found: idx,
      action: isAppend ? 'append' : 'replace',
      note: isAppend
        ? `x=${x}: first >= ${x} is past the end (idx ${idx}) -> append. tails grows to length ${tails.length}, LIS length is now ${tails.length}.`
        : `x=${x}: first >= ${x} is at idx ${idx} (was ${input[tailIdx[idx]] === x ? x : 'larger'}) -> replace tails[${idx}]=${x}. Length unchanged at ${tails.length}; the pile now has a smaller tail, leaving more room to grow.`,
    }));
  }

  // Reconstruct one actual LIS by following prev[] from the last tails slot back.
  const lisIndices = [];
  if (tailIdx.length > 0) {
    let cur = tailIdx[tailIdx.length - 1];
    while (cur !== -1) {
      lisIndices.push(cur);
      cur = prev[cur];
    }
    lisIndices.reverse();
  }

  frames.push(snap({
    phase: 'done',
    lisIndices,
    note: `Done. tails.length = ${tails.length}, so the longest increasing subsequence has length ${tails.length}. Following predecessor links yields one such LIS: [${lisIndices.map((j) => input[j]).join(', ')}]. Total work O(n log n).`,
  }));

  return frames;
}

function randomArray(size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(1 + Math.floor(Math.random() * 19));
  return out;
}

const DEFAULT_ARR = [10, 9, 2, 5, 3, 7, 101, 18];

function parseInput(text) {
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const nums = [];
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 99) return null;
    nums.push(v);
  }
  if (nums.length < 2 || nums.length > 12) return null;
  return nums;
}

export default function LISPatienceViz() {
  const [data, setData] = useState(DEFAULT_ARR);
  const [draft, setDraft] = useState(DEFAULT_ARR.join(' '));
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(data), [data]);

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

  const applyDraft = () => {
    const parsed = parseInput(draft);
    if (!parsed) return;
    setIsRunningRaw(false);
    setStep(0);
    setData(parsed);
    setDraft(parsed.join(' '));
  };

  const reshuffle = () => {
    const arr = randomArray(data.length);
    setIsRunningRaw(false);
    setStep(0);
    setData(arr);
    setDraft(arr.join(' '));
  };

  const draftValid = parseInput(draft) !== null;

  const n = data.length;
  const tails = current.tails;
  const tLen = tails.length;
  const lisSet = new Set(current.lisIndices);

  // layout
  const W = 960;
  const H = 430;
  const padX = 44;
  const cellGap = 8;
  const inputW = (W - padX * 2 - cellGap * (n - 1)) / n;
  const cellH = 44;

  const inputY = 64;
  const tailsY = 250;

  const inputX = (i) => padX + i * (inputW + cellGap);
  // tails cells reuse input cell width so the binary-search columns line up visually
  const tailCellW = Math.min(inputW, 72);
  const tailX = (k) => padX + k * (tailCellW + cellGap);

  const phaseLabel = {
    init: 'initialise',
    pick: 'pick element',
    probe: 'binary search',
    apply: 'append / replace',
    done: 'complete',
  }[current.phase] || current.phase;

  const inProbe = current.phase === 'probe';
  const curVal = current.cur != null ? data[current.cur] : null;

  return (
    <div className="lpv">
      <div className="lpv-head">
        <h3 className="lpv-title">Longest increasing subsequence — patience sorting, O(n log n)</h3>
        <p className="lpv-sub">
          Scan left to right. For each value, binary-search the tails array for the first entry that is &gt;= it,
          then replace that slot — or append if the value beats every tail. The tails length is the LIS length.
        </p>
      </div>

      <div className="lpv-controls">
        <div className="lpv-actions">
          <div className="lpv-buttons">
            <button
              type="button"
              className="lpv-btn lpv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {isRunning ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="lpv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="lpv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="lpv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="lpv-btn" onClick={reshuffle}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
          <label className="lpv-speed">
            <span className="lpv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="lpv-speed-range"
            />
            <span className="lpv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="lpv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
        <div className="lpv-edit">
          <span className="lpv-edit-label">array (0–99, comma/space, 2–12 vals)</span>
          <input
            type="text"
            className={`lpv-edit-input${draftValid ? '' : ' lpv-edit-invalid'}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyDraft();
            }}
            spellCheck={false}
          />
          <button type="button" className="lpv-btn" onClick={applyDraft} disabled={!draftValid}>
            Apply
          </button>
        </div>
      </div>

      <div className="lpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lpv-svg" preserveAspectRatio="xMidYMid meet">
          {/* INPUT ROW */}
          <text x={padX} y={inputY - 16} className="lpv-row-label">input (scanning left → right)</text>
          {data.map((v, i) => {
            const isCur = current.cur === i;
            const done = current.cur != null && i < current.cur;
            const inLis = current.phase === 'done' && lisSet.has(i);
            const fill = inLis ? 'var(--easy)'
              : isCur ? 'var(--hue-pink)'
              : done ? 'rgba(var(--accent-rgb), 0.16)'
              : 'rgba(var(--accent-rgb), 0.06)';
            const stroke = inLis ? 'var(--easy)'
              : isCur ? 'var(--hue-pink)'
              : done ? 'var(--accent)'
              : 'var(--border)';
            return (
              <g key={`in-${i}`}>
                <rect
                  x={inputX(i)}
                  y={inputY}
                  width={inputW}
                  height={cellH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCur || inLis ? 2.4 : 1.2}
                />
                <text
                  x={inputX(i) + inputW / 2}
                  y={inputY + cellH / 2 + 5}
                  className={`lpv-cell-val${isCur || inLis ? ' lpv-cell-val-focus' : ''}`}
                >
                  {v}
                </text>
                <text x={inputX(i) + inputW / 2} y={inputY + cellH + 16} className="lpv-cell-idx">{i}</text>
              </g>
            );
          })}

          {/* current element pointer */}
          {current.cur != null && current.phase !== 'done' && (
            <text x={inputX(current.cur) + inputW / 2} y={inputY - 26} className="lpv-pointer">
              x = {curVal}
            </text>
          )}

          {/* TAILS ROW */}
          <text x={padX} y={tailsY - 16} className="lpv-row-label">
            tails[k] = smallest tail of an increasing subseq of length k+1
          </text>
          {tLen === 0 && (
            <text x={padX} y={tailsY + cellH / 2 + 5} className="lpv-empty">empty</text>
          )}
          {tails.map((v, k) => {
            const inSearch = inProbe && k >= current.lo && k < current.hi;
            const isMid = inProbe && current.mid === k;
            const isFound = current.phase === 'apply' && current.found === k;
            const isAppendSlot = isFound && current.action === 'append';
            const fill = isMid ? 'var(--hue-sky)'
              : isFound ? (isAppendSlot ? 'var(--easy)' : 'var(--hard)')
              : inSearch ? 'rgba(var(--accent-rgb), 0.22)'
              : 'var(--surface)';
            const stroke = isMid ? 'var(--hue-sky)'
              : isFound ? (isAppendSlot ? 'var(--easy)' : 'var(--hard)')
              : inSearch ? 'var(--accent)'
              : 'var(--border)';
            return (
              <g key={`tail-${k}`}>
                <rect
                  x={tailX(k)}
                  y={tailsY}
                  width={tailCellW}
                  height={cellH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isMid || isFound ? 2.4 : 1.2}
                />
                <text
                  x={tailX(k) + tailCellW / 2}
                  y={tailsY + cellH / 2 + 5}
                  className={`lpv-cell-val${isMid || isFound ? ' lpv-cell-val-focus' : ''}`}
                >
                  {v}
                </text>
                <text x={tailX(k) + tailCellW / 2} y={tailsY + cellH + 16} className="lpv-cell-idx">k={k}</text>
                {isMid && <text x={tailX(k) + tailCellW / 2} y={tailsY - 4} className="lpv-mark lpv-mark-mid">mid</text>}
                {isFound && (
                  <text x={tailX(k) + tailCellW / 2} y={tailsY - 4} className="lpv-mark lpv-mark-act">
                    {current.action}
                  </text>
                )}
              </g>
            );
          })}

          {/* append target ghost cell */}
          {current.phase === 'apply' && current.action === 'append' && (
            <g>
              <rect
                x={tailX(current.found)}
                y={tailsY}
                width={tailCellW}
                height={cellH}
                rx={6}
                fill="none"
                stroke="var(--easy)"
                strokeWidth={2.4}
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* lo / hi search-window bracket during probe */}
          {inProbe && current.hi > current.lo && (
            <g>
              <line
                x1={tailX(current.lo)}
                y1={tailsY - 10}
                x2={tailX(current.hi - 1) + tailCellW}
                y2={tailsY - 10}
                stroke="var(--accent)"
                strokeWidth={1.6}
                strokeDasharray="3 3"
              />
              <text x={tailX(current.lo) + 2} y={tailsY - 26} className="lpv-mark">lo={current.lo}</text>
              <text x={tailX(current.hi - 1) + tailCellW - 2} y={tailsY - 26} className="lpv-mark lpv-mark-end">
                hi={current.hi}
              </text>
            </g>
          )}

          {/* arrow from current input element down to tails when applying */}
          {current.phase === 'apply' && current.cur != null && current.found != null && (
            <line
              x1={inputX(current.cur) + inputW / 2}
              y1={inputY + cellH + 24}
              x2={tailX(current.found) + tailCellW / 2}
              y2={tailsY - 38}
              stroke={current.action === 'append' ? 'var(--easy)' : 'var(--hard)'}
              strokeWidth={2}
              strokeDasharray="5 4"
              markerEnd="url(#lpv-arrow)"
            />
          )}
          <defs>
            <marker id="lpv-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--hard)" />
            </marker>
          </defs>

          {/* reconstructed LIS chips on the done frame */}
          {current.phase === 'done' && current.lisIndices.length > 0 && (
            <g>
              <text x={padX} y={tailsY + cellH + 52} className="lpv-row-label">one LIS</text>
              {current.lisIndices.map((j, k) => (
                <g key={`lis-${j}`}>
                  <rect
                    x={padX + k * (52 + 8)}
                    y={tailsY + cellH + 62}
                    width={52}
                    height={34}
                    rx={6}
                    fill="var(--easy)"
                    stroke="var(--easy)"
                  />
                  <text x={padX + k * (52 + 8) + 26} y={tailsY + cellH + 62 + 22} className="lpv-cell-val lpv-cell-val-focus">
                    {data[j]}
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="lpv-metrics">
        <div className="lpv-metric">
          <span className="lpv-metric-label">phase</span>
          <span className="lpv-metric-value">{phaseLabel}</span>
        </div>
        <div className="lpv-metric">
          <span className="lpv-metric-label">current x</span>
          <span className="lpv-metric-value">{curVal != null ? curVal : '—'}</span>
        </div>
        <div className="lpv-metric">
          <span className="lpv-metric-label">search [lo, hi)</span>
          <span className="lpv-metric-value">
            {inProbe || current.phase === 'pick' ? `[${current.lo}, ${current.hi})` : '—'}
          </span>
        </div>
        <div className="lpv-metric">
          <span className="lpv-metric-label">tails</span>
          <span className="lpv-metric-value">[{tails.join(', ')}]</span>
        </div>
        <div className="lpv-metric lpv-metric-dim">
          <span className="lpv-metric-label">LIS length</span>
          <span className="lpv-metric-value lpv-metric-dimval">{tLen}</span>
        </div>
      </div>

      <div className="lpv-arith">
        <span className="lpv-arith-label">trace</span>
        <span className="lpv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
