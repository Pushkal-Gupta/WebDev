import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, ChevronRight, SkipForward, RotateCcw, Plus, Minus } from 'lucide-react';
import './GameTheoryDPViz.css';

// Combinatorial game theory on Nim. A state is a multiset of heap sizes; a move
// removes >=1 stone from a single heap. grundy(state) = mex of grundy values of
// reachable states; the position is LOSING (P-position) for the player to move
// iff grundy == 0. Sprague-Grundy says single-pile grundy = pile size, and the
// grundy of independent games is the XOR of their grundy values -- so for Nim
// grundy(heaps) == XOR of heap sizes, and that XOR == 0 iff the position loses.

const W = 940;
const H = 470;

// Canonical key for a heap state: sort descending, drop empty heaps.
function keyOf(heaps) {
  return heaps
    .filter((h) => h > 0)
    .sort((a, b) => b - a)
    .join(',');
}

function xorOf(heaps) {
  return heaps.reduce((acc, h) => acc ^ h, 0);
}

// All states reachable in one move: remove k (1..h) stones from one heap.
function movesFrom(heaps) {
  const out = [];
  for (let i = 0; i < heaps.length; i++) {
    for (let take = 1; take <= heaps[i]; take++) {
      const next = heaps.slice();
      next[i] -= take;
      out.push({ heaps: next, heapIdx: i, take });
    }
  }
  return out;
}

function mex(values) {
  const set = new Set(values);
  let m = 0;
  while (set.has(m)) m += 1;
  return m;
}

// Build a post-order list of distinct states (canonical keys) reachable from the
// root, then emit one frame per state as its grundy is computed from children.
function buildFrames(rootHeaps) {
  const grundy = new Map(); // key -> grundy number
  const stateOf = new Map(); // key -> sorted heaps array
  const order = []; // post-order list of keys

  const visiting = new Set();
  const done = new Set();

  function dfs(heaps) {
    const key = keyOf(heaps);
    if (done.has(key)) return;
    if (visiting.has(key)) return;
    visiting.add(key);
    const sorted = heaps
      .filter((h) => h > 0)
      .sort((a, b) => b - a);
    stateOf.set(key, sorted);
    for (const mv of movesFrom(sorted)) dfs(mv.heaps);
    visiting.delete(key);
    done.add(key);
    order.push(key);
  }
  dfs(rootHeaps);

  const frames = [];
  const rootKey = keyOf(rootHeaps);

  for (const key of order) {
    const sorted = stateOf.get(key);
    // Distinct child states (canonical) and their already-computed grundy.
    const childMap = new Map();
    for (const mv of movesFrom(sorted)) {
      const ck = keyOf(mv.heaps);
      if (!childMap.has(ck)) {
        childMap.set(ck, { key: ck, heaps: stateOf.get(ck) || [], g: grundy.get(ck) });
      }
    }
    const children = [...childMap.values()];
    const childG = children.map((c) => c.g);
    const g = mex(childG);
    grundy.set(key, g);

    const xv = xorOf(sorted);
    const labelHeaps = sorted.length ? `[${sorted.join(', ')}]` : '[ ] (empty)';
    const mexSet = childG.length
      ? `{${[...childG].sort((a, b) => a - b).join(', ')}}`
      : '{}';

    let note;
    if (children.length === 0) {
      note = `${labelHeaps}: no moves left. mex{} = 0 -> grundy = 0. The player to move has already lost (P-position).`;
    } else {
      note =
        `${labelHeaps}: child grundy values ${mexSet}. ` +
        `mex${mexSet} = ${g} -> grundy = ${g} (${g === 0 ? 'LOSING / P-position' : 'WINNING / N-position'}). ` +
        `Nim XOR = ${xv}, which is ${xv === 0 ? '0 -> losing' : 'nonzero -> winning'} (matches grundy == 0 check).`;
    }

    frames.push({
      key,
      heaps: sorted,
      children,
      grundy: g,
      xor: xv,
      grundySnapshot: new Map(grundy),
      isRoot: key === rootKey,
      note,
    });
  }

  return { frames, rootKey };
}

// The winning move from a winning Nim position: pick a heap whose XOR-with-total
// reduces it, leaving overall XOR == 0.
function winningMove(heaps) {
  const total = xorOf(heaps);
  if (total === 0) return null;
  for (let i = 0; i < heaps.length; i++) {
    const target = heaps[i] ^ total;
    if (target < heaps[i]) {
      return { heapIdx: i, from: heaps[i], to: target, take: heaps[i] - target };
    }
  }
  return null;
}

const DEFAULT_HEAPS = [3, 4, 5];
const MAX_HEAPS = 4;
const MAX_STONES = 6;

export default function GameTheoryDPViz() {
  const [heaps, setHeaps] = useState(DEFAULT_HEAPS);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const sortedHeaps = useMemo(
    () => heaps.filter((h) => h > 0).sort((a, b) => b - a),
    [heaps],
  );

  const { frames, rootKey } = useMemo(() => buildFrames(sortedHeaps), [sortedHeaps]);
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

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

  // Any heap edit restarts the grundy walk from the first state.
  const restart = () => {
    setStep(0);
    setIsRunningRaw(false);
  };

  const reset = () => {
    setHeaps(DEFAULT_HEAPS);
    restart();
  };

  const editHeap = (i, delta) => {
    setHeaps((prev) => {
      const next = prev.slice();
      next[i] = Math.max(0, Math.min(MAX_STONES, next[i] + delta));
      return next;
    });
    restart();
  };

  const addHeap = () => {
    setHeaps((prev) => (prev.length >= MAX_HEAPS ? prev : [...prev, 1]));
    restart();
  };
  const removeHeap = () => {
    setHeaps((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
    restart();
  };

  // ---- derived readouts ----
  const rootGrundy = current.grundySnapshot.get(rootKey);
  const rootXor = xorOf(sortedHeaps);
  const rootVerdict = rootGrundy == null ? '—' : rootGrundy === 0 ? 'losing (P)' : 'winning (N)';
  const win = winningMove(sortedHeaps);

  // ---- geometry: left = heap bars, right = current-state mex tree ----
  const heapPanelX = 20;
  const heapPanelW = 360;
  const treeX = heapPanelX + heapPanelW + 26;
  const treeW = W - treeX - 20;

  // Heap bar layout.
  const barAreaTop = 70;
  const barAreaH = H - barAreaTop - 70;
  const barGap = 18;
  const barW = Math.min(
    62,
    (heapPanelW - 40 - barGap * (sortedHeaps.length - 1)) / Math.max(1, sortedHeaps.length),
  );
  const stoneH = Math.min(34, barAreaH / MAX_STONES);
  const barsTotalW = sortedHeaps.length * barW + (sortedHeaps.length - 1) * barGap;
  const barsX0 = heapPanelX + (heapPanelW - barsTotalW) / 2;

  const winHeapIdx = win ? win.heapIdx : -1;

  // Current node + child layout for the mex tree (one parent, fan of children).
  const parentX = treeX + treeW / 2;
  const parentY = 110;
  const nodeR = 30;
  const children = current.children;
  const childCount = children.length;
  const childY = 320;
  const childSpan = treeW - 70;
  const childGap = childCount > 1 ? childSpan / (childCount - 1) : 0;
  const childX0 = childCount > 1 ? treeX + 35 : parentX;
  const cx = (idx) => (childCount > 1 ? childX0 + idx * childGap : parentX);

  const verdictColor = (g) =>
    g == null ? 'var(--text-dim)' : g === 0 ? 'var(--hard)' : 'var(--easy)';

  return (
    <div className="gtv">
      <div className="gtv-head">
        <h3 className="gtv-title">Game theory DP — Grundy numbers &amp; the Nim XOR shortcut</h3>
        <p className="gtv-sub">
          grundy(state) = mex of the grundy values of every state one move away. A position loses
          (P-position) iff grundy = 0. For Nim that equals XOR of heap sizes = 0.
        </p>
      </div>

      <div className="gtv-controls">
        <div className="gtv-buttons">
          <button
            type="button"
            className="gtv-btn gtv-btn-primary"
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
            className="gtv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="gtv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="gtv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="gtv-heap-editor">
          <span className="gtv-editor-label">heaps</span>
          {heaps.map((h, i) => (
            <span className="gtv-heap-stepper" key={`he-${i}`}>
              <button
                type="button"
                className="gtv-mini-btn"
                onClick={() => editHeap(i, -1)}
                aria-label={`decrease heap ${i + 1}`}
              >
                <Minus size={12} />
              </button>
              <span className="gtv-heap-num">{h}</span>
              <button
                type="button"
                className="gtv-mini-btn"
                onClick={() => editHeap(i, 1)}
                aria-label={`increase heap ${i + 1}`}
              >
                <Plus size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="gtv-mini-btn gtv-mini-wide"
            onClick={addHeap}
            disabled={heaps.length >= MAX_HEAPS}
          >
            <Plus size={12} /> heap
          </button>
          <button
            type="button"
            className="gtv-mini-btn gtv-mini-wide"
            onClick={removeHeap}
            disabled={heaps.length <= 1}
          >
            <Minus size={12} /> heap
          </button>
        </div>

        <label className="gtv-speed">
          <span className="gtv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="gtv-speed-range"
          />
          <span className="gtv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="gtv-stepcount">
          state <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="gtv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gtv-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- heap panel ---- */}
          <rect
            x={heapPanelX}
            y={36}
            width={heapPanelW}
            height={H - 56}
            rx={8}
            fill="var(--bg)"
            stroke="var(--border)"
          />
          <text x={heapPanelX + 12} y={26} className="gtv-panel-label">
            Nim heaps — winning heap to play highlighted
          </text>

          {sortedHeaps.map((h, i) => {
            const bx = barsX0 + i * (barW + barGap);
            const isWin = i === winHeapIdx;
            const target = isWin && win ? win.to : null;
            return (
              <g key={`bar-${i}`}>
                {Array.from({ length: MAX_STONES }).map((_, s) => {
                  const filled = s < h;
                  const removable = isWin && target != null && s >= target && s < h;
                  const sy = barAreaTop + barAreaH - (s + 1) * stoneH + 2;
                  let fill = 'var(--surface)';
                  let stroke = 'var(--border)';
                  if (removable) {
                    fill = 'rgba(var(--accent-rgb), 0.18)';
                    stroke = 'var(--hue-pink)';
                  } else if (filled) {
                    fill = 'var(--accent)';
                    stroke = 'var(--accent)';
                  }
                  return (
                    <rect
                      key={`stone-${i}-${s}`}
                      x={bx}
                      y={sy}
                      width={barW}
                      height={stoneH - 4}
                      rx={4}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={removable ? 2 : 1}
                      strokeDasharray={removable ? '4 3' : undefined}
                    />
                  );
                })}
                <text
                  x={bx + barW / 2}
                  y={barAreaTop + barAreaH + 20}
                  className="gtv-heap-size"
                  style={{ fill: isWin ? 'var(--hue-pink)' : 'var(--text-main)' }}
                >
                  {h}
                </text>
                <text x={bx + barW / 2} y={barAreaTop + barAreaH + 34} className="gtv-heap-tag">
                  heap {i + 1}
                </text>
              </g>
            );
          })}

          {/* XOR readout strip under the heaps */}
          <text x={heapPanelX + 12} y={H - 22} className="gtv-xor-line">
            XOR = {sortedHeaps.join(' ^ ') || '0'} = {rootXor}{' '}
            {rootXor === 0 ? '-> losing (P)' : '-> winning (N)'}
          </text>

          {/* ---- mex tree panel ---- */}
          <rect
            x={treeX - 6}
            y={36}
            width={treeW + 12}
            height={H - 56}
            rx={8}
            fill="var(--bg)"
            stroke="var(--border)"
          />
          <text x={treeX} y={26} className="gtv-panel-label">
            mex computation for the current state
          </text>

          {/* edges parent -> children */}
          {children.map((c, idx) => (
            <line
              key={`edge-${idx}`}
              x1={parentX}
              y1={parentY + nodeR}
              x2={cx(idx)}
              y2={childY - 22}
              stroke="var(--border)"
              strokeWidth={1.4}
            />
          ))}

          {/* parent node = current state */}
          <circle
            cx={parentX}
            cy={parentY}
            r={nodeR}
            fill={current.grundy === 0 ? 'rgba(var(--accent-rgb), 0.10)' : 'rgba(var(--accent-rgb), 0.22)'}
            stroke={verdictColor(current.grundy)}
            strokeWidth={3}
          />
          <text x={parentX} y={parentY - 4} className="gtv-node-state">
            [{current.heaps.join(',') || ' '}]
          </text>
          <text
            x={parentX}
            y={parentY + 12}
            className="gtv-node-grundy"
            style={{ fill: verdictColor(current.grundy) }}
          >
            g={current.grundy}
          </text>
          <text
            x={parentX}
            y={parentY - nodeR - 8}
            className="gtv-node-verdict"
            style={{ fill: verdictColor(current.grundy) }}
          >
            {current.grundy === 0 ? 'LOSE (P)' : 'WIN (N)'}
          </text>

          {/* child nodes */}
          {children.map((c, idx) => {
            const x = cx(idx);
            const g = c.g;
            return (
              <g key={`child-${idx}`}>
                <circle
                  cx={x}
                  cy={childY}
                  r={22}
                  fill="var(--surface)"
                  stroke={verdictColor(g)}
                  strokeWidth={2}
                />
                <text x={x} y={childY - 2} className="gtv-child-state">
                  [{c.heaps.join(',') || ' '}]
                </text>
                <text
                  x={x}
                  y={childY + 12}
                  className="gtv-child-grundy"
                  style={{ fill: verdictColor(g) }}
                >
                  g={g}
                </text>
              </g>
            );
          })}
          {childCount === 0 && (
            <text x={parentX} y={childY} className="gtv-no-moves">
              no moves — terminal state
            </text>
          )}

          {/* mex set readout */}
          <text x={treeX} y={H - 40} className="gtv-mex-line">
            children grundy ={' '}
            {childCount
              ? `{${[...children.map((c) => c.g)].sort((a, b) => a - b).join(', ')}}`
              : '{}'}
          </text>
          <text x={treeX} y={H - 22} className="gtv-mex-result">
            mex = {current.grundy} -&gt; grundy([{current.heaps.join(',') || ' '}]) = {current.grundy}{' '}
            ({current.grundy === 0 ? 'losing' : 'winning'})
          </text>
        </svg>
      </div>

      <div className="gtv-metrics">
        <div className="gtv-metric">
          <span className="gtv-metric-label">root heaps</span>
          <span className="gtv-metric-value">[{sortedHeaps.join(', ')}]</span>
        </div>
        <div className="gtv-metric">
          <span className="gtv-metric-label">root XOR</span>
          <span className="gtv-metric-value">{rootXor}</span>
        </div>
        <div className="gtv-metric">
          <span className="gtv-metric-label">root grundy</span>
          <span className="gtv-metric-value">{rootGrundy == null ? '—' : rootGrundy}</span>
        </div>
        <div className="gtv-metric gtv-metric-verdict">
          <span className="gtv-metric-label">verdict (to move)</span>
          <span
            className="gtv-metric-value"
            style={{ color: rootGrundy === 0 ? 'var(--hard)' : 'var(--easy)' }}
          >
            {rootVerdict}
          </span>
        </div>
        <div className="gtv-metric">
          <span className="gtv-metric-label">winning move</span>
          <span className="gtv-metric-value">
            {win
              ? `heap ${win.heapIdx + 1}: ${win.from} -> ${win.to}`
              : 'none (losing)'}
          </span>
        </div>
      </div>

      <div className="gtv-arith">
        <span className="gtv-arith-label">trace</span>
        <span className="gtv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
