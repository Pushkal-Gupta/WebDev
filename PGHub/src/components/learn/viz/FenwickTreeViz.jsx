import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Sigma, Layers, RotateCcw, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './FenwickTreeViz.css';

const INITIAL_ARRAY = [2, 5, 1, 4, 9, 3, 6, 7];
const SVG_W = 880;
const SVG_H = 360;
const STEP_MS = 850;

// Build a Fenwick tree (1-indexed). bit[i] stores the sum of arr indices
// (i - lowbit(i), i] under 1-indexed convention.
function buildBIT(arr) {
  const n = arr.length;
  const bit = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    let j = i + 1;
    while (j <= n) {
      bit[j] += arr[i];
      j += j & -j;
    }
  }
  return bit;
}

function lowbit(i) {
  return i & -i;
}

// Each BIT index i (1-indexed) covers the 1-indexed range (i - lowbit(i), i].
// Returned here in user-facing 1-indexed inclusive form.
function coverage(i) {
  const lo = i - lowbit(i) + 1;
  const hi = i;
  return [lo, hi];
}

function depthOf(i) {
  // Depth in the BIT forest grows with lowbit size: 1,2,4,8 -> depths 0,1,2,3.
  return Math.log2(lowbit(i));
}

function layoutBIT(n) {
  const pad = 60;
  const usable = SVG_W - pad * 2;
  const cellW = usable / n;
  const positions = {};

  let maxDepth = 0;
  for (let i = 1; i <= n; i++) {
    const d = depthOf(i);
    if (d > maxDepth) maxDepth = d;
  }
  const yTop = 60;
  const yBottom = SVG_H - 60;
  const yStep = maxDepth === 0 ? 0 : (yBottom - yTop) / maxDepth;

  for (let i = 1; i <= n; i++) {
    const d = depthOf(i);
    // Anchor each node above its high-end index so it sits over its coverage range.
    const x = pad + (i - 0.5) * cellW;
    const y = yBottom - d * yStep;
    positions[i] = { x, y, depth: d };
  }
  return { positions, cellW, pad };
}

// Parent in BIT forest = i + lowbit(i). Used to draw the tree edges.
function bitParent(i, n) {
  const p = i + lowbit(i);
  return p <= n ? p : null;
}

function updateFrames(bitIn, arrIn, n, idx0, delta) {
  const bit = [...bitIn];
  const arr = [...arrIn];
  const frames = [];
  const idx1 = idx0 + 1;

  arr[idx0] += delta;
  frames.push({
    kind: 'update',
    phase: 'start',
    node: null,
    visited: [],
    arr: [...arr],
    bit: [...bit],
    idx0,
    delta,
    caption: `Update arr[${idx0}] += ${delta}. Walk BIT from i=${idx1} via i += i & -i, adding ${delta} at each stop.`,
  });

  const visited = [];
  let i = idx1;
  while (i <= n) {
    bit[i] += delta;
    visited.push(i);
    const [lo, hi] = coverage(i);
    const lb = lowbit(i);
    const next = i + lb;
    frames.push({
      kind: 'update',
      phase: 'step',
      node: i,
      visited: [...visited],
      arr: [...arr],
      bit: [...bit],
      idx0,
      delta,
      caption: `bit[${i}] covers (${lo - 1}, ${hi}] (1-indexed [${lo}, ${hi}]). Add ${delta} -> bit[${i}] = ${bit[i]}. Next: i += lowbit(${i}) = ${lb} -> ${next}.`,
    });
    i = next;
  }

  frames.push({
    kind: 'update',
    phase: 'done',
    node: null,
    visited: [...visited],
    arr: [...arr],
    bit: [...bit],
    idx0,
    delta,
    caption: `Update done. Touched ${visited.length} BIT node${visited.length === 1 ? '' : 's'}: ${visited.join(' -> ')}.`,
  });

  return frames;
}

function prefixFrames(bitIn, n, upto1, label = 'prefixSum') {
  const frames = [];
  const visited = [];
  let total = 0;

  frames.push({
    kind: 'prefix',
    phase: 'start',
    node: null,
    visited: [],
    total: 0,
    upto: upto1,
    label,
    caption: `${label}: i=${upto1}. Walk down via i -= i & -i, summing bit[i] at each stop.`,
  });

  let i = upto1;
  while (i > 0) {
    total += bitIn[i];
    visited.push(i);
    const [lo, hi] = coverage(i);
    const lb = lowbit(i);
    const next = i - lb;
    frames.push({
      kind: 'prefix',
      phase: 'step',
      node: i,
      visited: [...visited],
      total,
      upto: upto1,
      label,
      caption: `bit[${i}] = ${bitIn[i]} covers [${lo}, ${hi}]. Sum = ${total}. Next: i -= lowbit(${i}) = ${lb} -> ${next}.`,
    });
    i = next;
  }

  frames.push({
    kind: 'prefix',
    phase: 'done',
    node: null,
    visited: [...visited],
    total,
    upto: upto1,
    label,
    caption: `${label}(${upto1}) = ${total} after ${visited.length} step${visited.length === 1 ? '' : 's'}.`,
  });

  return { frames, total };
}

function rangeSumFrames(bitIn, n, l0, r0) {
  // RangeSum(l, r) = PrefixSum(r+1) - PrefixSum(l), using 1-indexed BIT.
  const frames = [];
  const hi = r0 + 1;
  const lo = l0; // PrefixSum(l0) corresponds to 1-indexed prefix up to l0 (exclusive of l0 in 0-indexed).

  frames.push({
    kind: 'range',
    phase: 'start',
    node: null,
    visited: [],
    total: 0,
    l0,
    r0,
    leftSum: null,
    rightSum: null,
    caption: `RangeSum([${l0}, ${r0}]) = prefixSum(${hi}) - prefixSum(${lo}). Compute prefixSum(${hi}) first.`,
  });

  const right = prefixFrames(bitIn, n, hi, `prefixSum(r+1)=prefixSum(${hi})`);
  for (const f of right.frames) {
    frames.push({
      ...f,
      kind: 'range',
      side: 'right',
      l0,
      r0,
      leftSum: null,
      rightSum: f.total,
    });
  }

  if (lo === 0) {
    frames.push({
      kind: 'range',
      phase: 'skip-left',
      node: null,
      visited: right.frames[right.frames.length - 1].visited,
      total: right.total,
      l0,
      r0,
      leftSum: 0,
      rightSum: right.total,
      caption: `l = 0 so prefixSum(0) = 0. RangeSum = ${right.total} - 0 = ${right.total}.`,
    });
    return frames;
  }

  frames.push({
    kind: 'range',
    phase: 'mid',
    node: null,
    visited: right.frames[right.frames.length - 1].visited,
    total: right.total,
    l0,
    r0,
    leftSum: null,
    rightSum: right.total,
    caption: `prefixSum(${hi}) = ${right.total}. Now compute prefixSum(${lo}) and subtract.`,
  });

  const left = prefixFrames(bitIn, n, lo, `prefixSum(l)=prefixSum(${lo})`);
  for (const f of left.frames) {
    frames.push({
      ...f,
      kind: 'range',
      side: 'left',
      l0,
      r0,
      leftSum: f.total,
      rightSum: right.total,
    });
  }

  const result = right.total - left.total;
  frames.push({
    kind: 'range',
    phase: 'done',
    node: null,
    visited: left.frames[left.frames.length - 1].visited,
    total: result,
    l0,
    r0,
    leftSum: left.total,
    rightSum: right.total,
    caption: `RangeSum([${l0}, ${r0}]) = ${right.total} - ${left.total} = ${result}.`,
  });

  return frames;
}

export default function FenwickTreeViz() {
  const [arr, setArr] = useState(INITIAL_ARRAY);
  const [upi, setUpi] = useState('3');
  const [upv, setUpv] = useState('5');
  const [pi, setPi] = useState('5');
  const [rl, setRl] = useState('2');
  const [rr, setRr] = useState('6');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playRef = useRef(null);

  const delay = Math.round(STEP_MS / speed);
  const n = arr.length;
  const baseBIT = useMemo(() => buildBIT(arr), [arr]);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  // Derive `playing` from the raw toggle + bounds so the auto-run effect never
  // needs to call setPlaying(false) when we hit the end.
  const playing = playingRaw && idx >= 0 && idx < frames.length - 1;

  // Updates mutate bit + arr; prefix/range queries read the static baseBIT.
  const displayBIT = currentFrame && currentFrame.kind === 'update' ? currentFrame.bit : baseBIT;
  const displayArr = currentFrame && currentFrame.kind === 'update' ? currentFrame.arr : arr;

  const { positions, cellW, pad } = useMemo(() => layoutBIT(n), [n]);

  const edges = useMemo(() => {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const p = bitParent(i, n);
      if (p) out.push({ child: i, parent: p });
    }
    return out;
  }, [n]);

  const runUpdate = useCallback(() => {
    const i = Number(upi);
    const v = Number(upv);
    if (!Number.isInteger(i) || !Number.isFinite(v)) return;
    if (i < 0 || i >= n) return;
    const built = updateFrames(baseBIT, arr, n, i, v);
    setFrames(built);
    setIdx(0);
    setPlaying(true);
  }, [upi, upv, baseBIT, arr, n]);

  const runPrefix = useCallback(() => {
    const i = Number(pi);
    if (!Number.isInteger(i)) return;
    if (i < 0 || i >= n) return;
    const { frames: built } = prefixFrames(baseBIT, n, i + 1, `prefixSum(arr[0..${i}])`);
    setFrames(built);
    setIdx(0);
    setPlaying(true);
  }, [pi, baseBIT, n]);

  const runRange = useCallback(() => {
    const a = Number(rl);
    const b = Number(rr);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return;
    if (a < 0 || b >= n || a > b) return;
    const built = rangeSumFrames(baseBIT, n, a, b);
    setFrames(built);
    setIdx(0);
    setPlaying(true);
  }, [rl, rr, baseBIT, n]);

  const reset = useCallback(() => {
    setPlaying(false);
    setArr(INITIAL_ARRAY);
    setFrames([]);
    setIdx(-1);
    setUpi('3');
    setUpv('5');
    setPi('5');
    setRl('2');
    setRr('6');
  }, []);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setTimeout(() => {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      // Commit `update` frames to the live array when we land on the final frame.
      if (nextIdx === frames.length - 1) {
        const last = frames[nextIdx];
        if (last && last.kind === 'update') setArr(last.arr);
      }
    }, delay);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames, delay]);

  const stepNext = () => {
    if (idx < frames.length - 1) {
      const next = idx + 1;
      setIdx(next);
      if (next === frames.length - 1) {
        const last = frames[next];
        if (last.kind === 'update') setArr(last.arr);
      }
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

  const visitedSet = useMemo(() => {
    if (!currentFrame) return new Set();
    return new Set(currentFrame.visited || []);
  }, [currentFrame]);

  const currentNode = currentFrame && currentFrame.node ? currentFrame.node : null;

  // Highlight the array slice covered by the active node, when available.
  const highlightedArrRange = useMemo(() => {
    if (!currentNode) return null;
    const [lo, hi] = coverage(currentNode);
    return [lo - 1, hi - 1]; // back to 0-indexed for display
  }, [currentNode]);

  const step = idx + 1;
  const totalSteps = frames.length;

  const caption = currentFrame
    ? currentFrame.caption
    : 'Run an update, prefix sum, or range sum to begin.';

  const headerMode = !currentFrame
    ? 'idle'
    : currentFrame.kind === 'update'
      ? `update arr[${currentFrame.idx0}] += ${currentFrame.delta}`
      : currentFrame.kind === 'prefix'
        ? `prefixSum(${currentFrame.upto})`
        : `rangeSum([${currentFrame.l0}, ${currentFrame.r0}])`;

  // Array cell highlight handling — query target range for range mode + coverage of active node.
  const isCellInRange = (i) => {
    if (currentFrame && currentFrame.kind === 'range') {
      if (i >= currentFrame.l0 && i <= currentFrame.r0) return true;
    }
    return false;
  };

  const isCellInCoverage = (i) => {
    if (!highlightedArrRange) return false;
    return i >= highlightedArrRange[0] && i <= highlightedArrRange[1];
  };

  const isCellUpdateTarget = (i) =>
    currentFrame && currentFrame.kind === 'update' && i === currentFrame.idx0;

  // Right-side stat values vary per mode.
  const runningTotal =
    currentFrame && (currentFrame.kind === 'prefix' || currentFrame.kind === 'range')
      ? currentFrame.total
      : null;

  return (
    <div className="ftv-root">
      <div className="ftv-head">
        <div className="ftv-title-block">
          <h3 className="ftv-title">Fenwick tree — binary indexed tree</h3>
          <p className="ftv-sub">
            Each BIT index i stores the sum of a power-of-two slice ending at i. Updates climb via
            i += i &amp; -i; prefix sums descend via i -= i &amp; -i. Range sum [l, r] = prefix(r+1) - prefix(l).
          </p>
        </div>
      </div>

      <div className="ftv-controls">
        <div className="ftv-control-group">
          <span className="ftv-group-label">Update</span>
          <label className="ftv-input-label">
            i
            <input
              type="number"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="ftv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="ftv-input-label">
            +val
            <input
              type="number"
              value={upv}
              onChange={(e) => setUpv(e.target.value)}
              className="ftv-input"
            />
          </label>
          <button type="button" className="ftv-btn ftv-btn-primary" onClick={runUpdate}>
            <Edit3 size={14} /> Update
          </button>
        </div>

        <div className="ftv-control-group">
          <span className="ftv-group-label">Prefix sum</span>
          <label className="ftv-input-label">
            i
            <input
              type="number"
              value={pi}
              onChange={(e) => setPi(e.target.value)}
              className="ftv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <button type="button" className="ftv-btn ftv-btn-primary" onClick={runPrefix}>
            <Sigma size={14} /> Prefix
          </button>
        </div>

        <div className="ftv-control-group">
          <span className="ftv-group-label">Range sum</span>
          <label className="ftv-input-label">
            l
            <input
              type="number"
              value={rl}
              onChange={(e) => setRl(e.target.value)}
              className="ftv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <label className="ftv-input-label">
            r
            <input
              type="number"
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              className="ftv-input"
              min={0}
              max={n - 1}
            />
          </label>
          <button type="button" className="ftv-btn ftv-btn-primary" onClick={runRange}>
            <Layers size={14} /> Range
          </button>
        </div>

        <div className="ftv-control-group ftv-control-group-end">
          <button type="button" className="ftv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <div className="ftv-control-divider" />
          <button
            type="button"
            className="ftv-btn"
            onClick={stepPrev}
            disabled={frames.length === 0 || idx <= 0}
            aria-label="Previous step"
          >
            <SkipBack size={14} />
          </button>
          <button
            type="button"
            className="ftv-btn"
            onClick={togglePlay}
            disabled={frames.length === 0}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            className="ftv-btn"
            onClick={stepNext}
            disabled={frames.length === 0 || idx >= frames.length - 1}
            aria-label="Next step"
          >
            <SkipForward size={14} />
          </button>
          <label className="ftv-speed">
            <span className="ftv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="ftv-speed-range"
            />
            <span className="ftv-speed-value">{speed.toFixed(1)}×</span>
          </label>
        </div>
      </div>

      <div className="ftv-array-row">
        <span className="ftv-array-label">arr (0-idx)</span>
        <div className="ftv-array-cells">
          {displayArr.map((v, i) => {
            const inRange = isCellInRange(i);
            const inCoverage = isCellInCoverage(i);
            const isUpdate = isCellUpdateTarget(i);
            return (
              <div
                key={i}
                className={[
                  'ftv-cell',
                  inRange ? 'ftv-cell-in-range' : '',
                  inCoverage ? 'ftv-cell-in-coverage' : '',
                  isUpdate ? 'ftv-cell-update' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="ftv-cell-value">{v}</span>
                <span className="ftv-cell-index">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ftv-stage">
        <svg
          className="ftv-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Fenwick tree visualization"
        >
          {/* Coverage bars per BIT node — drawn as thin bands above the array,
              showing which 1-indexed range each node owns. */}
          {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, n).map((i) => {
            const [lo, hi] = coverage(i);
            const x = pad + (lo - 1) * cellW + 2;
            const w = (hi - lo + 1) * cellW - 4;
            const y = positions[i].y - 28;
            const active = visitedSet.has(i) || currentNode === i;
            return (
              <rect
                key={`cov-${i}`}
                x={x}
                y={y}
                width={w}
                height={4}
                rx={2}
                className={`ftv-cov ${active ? 'ftv-cov-active' : ''}`}
              />
            );
          })}

          {/* BIT forest edges. */}
          {edges.map((e, ei) => {
            const a = positions[e.child];
            const b = positions[e.parent];
            if (!a || !b) return null;
            const onPath = visitedSet.has(e.child) && visitedSet.has(e.parent);
            return (
              <path
                key={`e${ei}`}
                d={`M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}`}
                className={`ftv-edge ${onPath ? 'ftv-edge-active' : ''}`}
                fill="none"
              />
            );
          })}

          {/* BIT nodes. */}
          {Array.from({ length: n }, (_, k) => k + 1).map((i) => {
            const p = positions[i];
            if (!p) return null;
            const [lo, hi] = coverage(i);
            const isVisited = visitedSet.has(i) && currentNode !== i;
            const isCurrent = currentNode === i;
            const cls = [
              'ftv-node',
              isVisited ? 'ftv-node-visited' : '',
              isCurrent ? 'ftv-node-current' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const w = 56;
            const h = 44;
            return (
              <g key={i} className={cls} transform={`translate(${p.x}, ${p.y})`}>
                {isCurrent && (
                  <rect
                    x={-w / 2 - 5}
                    y={-h / 2 - 5}
                    width={w + 10}
                    height={h + 10}
                    rx={9}
                    className="ftv-node-ring"
                  />
                )}
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx={7}
                  className="ftv-node-box"
                />
                <text x={0} y={-9} textAnchor="middle" className="ftv-node-label">
                  bit[{i}]
                </text>
                <text x={0} y={5} textAnchor="middle" className="ftv-node-value">
                  {displayBIT[i]}
                </text>
                <text x={0} y={16} textAnchor="middle" className="ftv-node-range">
                  [{lo},{hi}]
                </text>
              </g>
            );
          })}

          {/* Index ticks under nodes that double as the 1-indexed lane labels. */}
          {Array.from({ length: n }, (_, k) => k + 1).map((i) => {
            const p = positions[i];
            return (
              <text
                key={`tick-${i}`}
                x={p.x}
                y={SVG_H - 14}
                textAnchor="middle"
                className="ftv-tick"
              >
                {i}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="ftv-footer">
        <div className="ftv-stat">
          <span className="ftv-stat-label">Step</span>
          <span className="ftv-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="ftv-stat">
          <span className="ftv-stat-label">Mode</span>
          <span className="ftv-stat-value">{headerMode}</span>
        </div>
        <div className="ftv-stat ftv-stat-grow">
          <span className="ftv-stat-label">Status</span>
          <span className="ftv-stat-value">{caption}</span>
        </div>
        {runningTotal !== null && (
          <div className="ftv-stat">
            <span className="ftv-stat-label">
              {currentFrame.kind === 'range' ? 'Result' : 'Running sum'}
            </span>
            <span className="ftv-stat-value ftv-stat-emph">{runningTotal}</span>
          </div>
        )}
        {currentFrame && currentFrame.kind === 'range' && currentFrame.rightSum !== null && (
          <div className="ftv-stat">
            <span className="ftv-stat-label">prefix(r+1)</span>
            <span className="ftv-stat-value">{currentFrame.rightSum}</span>
          </div>
        )}
        {currentFrame && currentFrame.kind === 'range' && currentFrame.leftSum !== null && (
          <div className="ftv-stat">
            <span className="ftv-stat-label">prefix(l)</span>
            <span className="ftv-stat-value">{currentFrame.leftSum}</span>
          </div>
        )}
      </div>
    </div>
  );
}
