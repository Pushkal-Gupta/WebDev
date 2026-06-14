import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './OptimalBSTViz.css';

// Optimal Binary Search Tree — interval DP.
// Keys k1..kn (sorted) have access frequencies f1..fn. A search for ki costs
// (depth of ki + 1) probes. The expected search cost of a BST is
//   sum over i of fi * (depthInTree(ki) + 1).
// dp[i][j] = minimum expected cost of an optimal BST built from keys ki..kj.
//   dp[i][i-1] = 0            (empty range)
//   dp[i][j]   = min over root r in [i, j] of
//                dp[i][r-1] + dp[r+1][j] + sum(f[i..j])
// The freqSum term is added because making ki..kj a subtree pushes every key
// in the range one level deeper, so each contributes one extra probe.
// Fill order is by increasing interval LENGTH so every sub-range is ready.

const KEYS = [10, 20, 30, 40]; // sorted keys k1..k4
const FREQ = [4, 2, 6, 3]; // access frequencies f1..f4
const N = KEYS.length;
const INF = Infinity;

// prefix[j] = f1 + ... + fj, prefix[0] = 0. sum(f[i..j]) = prefix[j] - prefix[i-1].
const PREFIX = (() => {
  const p = [0];
  for (let i = 0; i < N; i++) p.push(p[i] + FREQ[i]);
  return p;
})();
const freqSum = (i, j) => PREFIX[j] - PREFIX[i - 1];
const TOTAL_FREQ = PREFIX[N];

function emptyTable() {
  const dp = [];
  const root = [];
  for (let i = 0; i <= N + 1; i++) {
    dp.push(new Array(N + 2).fill(INF));
    root.push(new Array(N + 2).fill(-1));
  }
  // Empty ranges dp[i][i-1] = 0.
  for (let i = 1; i <= N + 1; i++) dp[i][i - 1] = 0;
  return { dp, root };
}

function cloneTable(t) {
  return {
    dp: t.dp.map((r) => r.slice()),
    root: t.root.map((r) => r.slice()),
  };
}

// Reconstruct the optimal BST for keys i..j from the root table.
function buildTree(root, i, j) {
  if (i > j) return null;
  const r = root[i][j];
  return {
    keyIdx: r,
    key: KEYS[r - 1],
    freq: FREQ[r - 1],
    left: buildTree(root, i, r - 1),
    right: buildTree(root, r + 1, j),
  };
}

function buildFrames() {
  const t = emptyTable();
  const frames = [];

  // Length-1 intervals: a single key is its own root, cost = its frequency.
  for (let i = 1; i <= N; i++) {
    t.dp[i][i] = FREQ[i - 1];
    t.root[i][i] = i;
  }
  frames.push({
    table: cloneTable(t),
    i: null,
    j: null,
    r: null,
    len: 1,
    cand: null,
    best: null,
    bestRoot: null,
    accepted: null,
    cells: [],
    phase: 'diagonal',
    note:
      `Length-1 ranges: a single key ki is its own root, so dp[i][i] = fi ` +
      `(one probe, weighted by frequency). These seed every larger range.`,
  });

  // Increasing interval length.
  for (let len = 2; len <= N; len++) {
    for (let i = 1; i <= N - len + 1; i++) {
      const j = i + len - 1;
      const fs = freqSum(i, j);
      let best = INF;
      let bestRoot = -1;
      for (let r = i; r <= j; r++) {
        const left = t.dp[i][r - 1];
        const right = t.dp[r + 1][j];
        const cand = left + right + fs;
        const accepted = cand < best;
        if (accepted) {
          best = cand;
          bestRoot = r;
        }
        frames.push({
          table: cloneTable(t),
          i,
          j,
          r,
          len,
          left,
          right,
          fs,
          cand,
          best: best === INF ? null : best,
          bestRoot,
          accepted,
          cells: [
            { ri: i, ci: r - 1, side: 'left' },
            { ri: r + 1, ci: j, side: 'right' },
          ],
          phase: 'try',
          note:
            `dp[${i}][${j}]: root=k${r} -> dp[${i}][${r - 1}] + dp[${r + 1}][${j}] + freqSum(${i}..${j}) = ` +
            `${left} + ${right} + ${fs} = ${cand}. ` +
            (accepted
              ? `New best ${best} with root k${r}.`
              : `Not better than ${best}; keep root k${bestRoot}.`),
        });
      }
      t.dp[i][j] = best;
      t.root[i][j] = bestRoot;
      frames.push({
        table: cloneTable(t),
        i,
        j,
        r: bestRoot,
        len,
        fs,
        cand: best,
        best,
        bestRoot,
        accepted: true,
        cells: [{ ri: i, ci: j, side: 'target' }],
        phase: 'commit',
        note:
          `Commit dp[${i}][${j}] = ${best}, best root = k${bestRoot} (key ${KEYS[bestRoot - 1]}). ` +
          `This range is now ready for longer intervals.`,
      });
    }
  }

  const answer = t.dp[1][N];
  frames.push({
    table: cloneTable(t),
    i: 1,
    j: N,
    r: t.root[1][N],
    len: N,
    cand: answer,
    best: answer,
    bestRoot: t.root[1][N],
    accepted: null,
    cells: [{ ri: 1, ci: N, side: 'target' }],
    phase: 'done',
    note:
      `Optimal expected cost dp[1][${N}] = ${answer} probes (weighted). Reconstruct from the root ` +
      `table: the frequent key lands near the root so common searches stay shallow. O(n^3) over O(n^2) states.`,
  });

  return frames;
}

const VAL = (v) => (v === INF || v == null ? '·' : v);

// Lay out the reconstructed tree: x by in-order index, y by depth.
function layoutTree(root) {
  const nodes = [];
  const edges = [];
  let order = 0;
  let maxDepth = 0;
  (function walk(node, depth) {
    if (!node) return;
    walk(node.left, depth + 1);
    node._order = order++;
    node._depth = depth;
    if (depth > maxDepth) maxDepth = depth;
    nodes.push(node);
    walk(node.right, depth + 1);
  })(root, 0);
  (function collect(node) {
    if (!node) return;
    if (node.left) { edges.push([node, node.left]); collect(node.left); }
    if (node.right) { edges.push([node, node.right]); collect(node.right); }
  })(root);
  return { nodes, edges, count: nodes.length || 1, maxDepth };
}

export default function OptimalBSTViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  // ---- geometry ----
  const W = 940;
  const H = 500;

  // Keys + frequency strip across the top.
  const keyTop = 44;
  const keyH = 60;
  const keyGap = 8;
  const keyX0 = 24;
  const keyW = (W - 2 * keyX0 - (N - 1) * keyGap) / N;

  // dp triangular table on the left below the strip.
  const tblTop = keyTop + keyH + 56;
  const tblX = 86;
  const cellSize = Math.min(56, (W * 0.46 - tblX) / N, (H - tblTop - 24) / N);
  const cellPad = 3;
  const colX = (c) => tblX + (c - 1) * cellSize;
  const rowY = (r) => tblTop + (r - 1) * cellSize;

  const dp = current.table.dp;
  const rootTbl = current.table.root;

  // Active-cell highlight sets.
  const subLeft =
    current.phase === 'try' && current.cells
      ? current.cells.find((c) => c.side === 'left')
      : null;
  const subRight =
    current.phase === 'try' && current.cells
      ? current.cells.find((c) => c.side === 'right')
      : null;
  const subKey = (c) => (c ? `${c.ri}-${c.ci}` : null);
  const leftKey = subKey(subLeft);
  const rightKey = subKey(subRight);
  const targetCell =
    current.i != null && current.j != null ? `${current.i}-${current.j}` : null;

  // Final optimal tree once the whole range is solved.
  const showTree =
    current.phase === 'done' || (rootTbl[1][N] !== -1);
  const optTree = showTree ? buildTree(rootTbl, 1, N) : null;
  const treeLayout = optTree ? layoutTree(optTree) : null;

  // Tree drawing region: right half, below the strip.
  const treeX0 = W * 0.5 + 8;
  const treeX1 = W - 24;
  const treeTop = tblTop + 6;
  const treeLevelGap = 78;
  const NODE_R = 19;
  const treeXOf = (nd) =>
    treeLayout
      ? treeX0 + ((nd._order + 0.5) * (treeX1 - treeX0)) / treeLayout.count
      : 0;
  const treeYOf = (nd) => treeTop + nd._depth * treeLevelGap;
  const rootKeyIdx = optTree ? optTree.keyIdx : null;

  return (
    <div className="obv">
      <div className="obv-head">
        <h3 className="obv-title">Optimal binary search tree — interval DP</h3>
        <p className="obv-sub">
          Keys with access frequencies. dp[i][j] is the least weighted search cost for keys ki..kj.
          Grow the interval, try every root r, and add freqSum because rooting a range pushes every
          key one level deeper.
        </p>
      </div>

      <div className="obv-controls">
        <div className="obv-buttons">
          <button
            type="button"
            className="obv-btn obv-btn-primary"
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
            className="obv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="obv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="obv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="obv-speed">
          <span className="obv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="obv-speed-range"
          />
          <span className="obv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="obv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="obv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="obv-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- keys + frequency strip ---- */}
          <text x={keyX0} y={keyTop - 12} className="obv-panel-label">
            keys k1..k{N} with access frequencies
          </text>
          {Array.from({ length: N }).map((_, idx) => {
            const m = idx + 1;
            const x = keyX0 + idx * (keyW + keyGap);
            const inRange =
              current.phase !== 'diagonal' &&
              current.i != null &&
              m >= current.i &&
              m <= current.j;
            const isRoot = current.phase === 'try' && current.r === m;
            let fill = 'var(--surface)';
            let stroke = 'var(--border)';
            if (isRoot) {
              fill = 'var(--hue-pink)';
              stroke = 'var(--hue-pink)';
            } else if (inRange) {
              fill = 'rgba(var(--accent-rgb), 0.18)';
              stroke = 'var(--accent)';
            }
            const txtFill = isRoot ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`key-${m}`}>
                <rect
                  x={x}
                  y={keyTop}
                  width={keyW}
                  height={keyH}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isRoot || inRange ? 2 : 1}
                />
                <text x={x + keyW / 2} y={keyTop + 24} className="obv-key-name" style={{ fill: txtFill }}>
                  k{m}={KEYS[m - 1]}
                </text>
                <text x={x + keyW / 2} y={keyTop + 44} className="obv-key-freq" style={{ fill: txtFill }}>
                  f={FREQ[m - 1]}
                </text>
              </g>
            );
          })}
          {/* root marker over the strip */}
          {current.phase === 'try' && current.r != null && (() => {
            const x = keyX0 + (current.r - 1) * (keyW + keyGap) + keyW / 2;
            return (
              <text x={x} y={keyTop + keyH + 16} className="obv-root-tag">
                root k{current.r}
              </text>
            );
          })()}

          {/* ---- dp triangular table ---- */}
          <text x={tblX} y={tblTop - 30} className="obv-panel-label">
            dp[i][j] — min weighted cost for keys ki..kj
          </text>
          {/* column headers (j) */}
          {Array.from({ length: N }).map((_, idx) => {
            const j = idx + 1;
            return (
              <text key={`colh-${j}`} x={colX(j) + cellSize / 2} y={tblTop - 10} className="obv-axh">
                j={j}
              </text>
            );
          })}
          {/* row headers (i) */}
          {Array.from({ length: N }).map((_, idx) => {
            const i = idx + 1;
            return (
              <text key={`rowh-${i}`} x={tblX - 12} y={rowY(i) + cellSize / 2 + 4} className="obv-axh obv-axh-row">
                i={i}
              </text>
            );
          })}

          {Array.from({ length: N }).map((_, ri) => {
            const i = ri + 1;
            return Array.from({ length: N }).map((__, ci) => {
              const j = ci + 1;
              if (j < i) return null; // lower triangle unused
              const val = dp[i][j];
              const known = val !== INF;
              const key = `${i}-${j}`;
              const isTarget = key === targetCell && current.phase !== 'done';
              const isLeft = key === leftKey;
              const isRight = key === rightKey;
              const isDiag = i === j;
              let fill = 'var(--bg)';
              let stroke = 'var(--border)';
              if (isTarget && current.phase === 'commit') {
                fill = 'var(--accent)';
                stroke = 'var(--accent)';
              } else if (isTarget) {
                fill = 'rgba(var(--accent-rgb), 0.30)';
                stroke = 'var(--accent)';
              } else if (isLeft) {
                fill = 'var(--hue-sky)';
                stroke = 'var(--hue-sky)';
              } else if (isRight) {
                fill = 'var(--hue-mint)';
                stroke = 'var(--hue-mint)';
              } else if (isDiag && known) {
                fill = 'rgba(var(--accent-rgb), 0.16)';
                stroke = 'var(--accent)';
              } else if (known) {
                fill = 'rgba(var(--accent-rgb), 0.12)';
                stroke = 'rgba(var(--accent-rgb), 0.4)';
              }
              const txtFill =
                (isTarget && current.phase === 'commit') || isLeft || isRight
                  ? 'var(--bg)'
                  : known
                  ? 'var(--text-main)'
                  : 'var(--border)';
              return (
                <g key={`cell-${key}`}>
                  <rect
                    x={colX(j) + cellPad}
                    y={rowY(i) + cellPad}
                    width={cellSize - cellPad * 2}
                    height={cellSize - cellPad * 2}
                    rx={5}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isTarget || isLeft || isRight ? 2.4 : 1}
                  />
                  <text
                    x={colX(j) + cellSize / 2}
                    y={rowY(i) + cellSize / 2 + 4}
                    className="obv-cellval"
                    style={{ fill: txtFill }}
                  >
                    {VAL(val)}
                  </text>
                </g>
              );
            });
          })}

          {/* ---- reconstructed optimal tree (right half) ---- */}
          <text x={treeX0} y={tblTop - 30} className="obv-panel-label">
            {current.phase === 'done' ? 'optimal BST — frequent keys near the root' : 'best tree so far'}
          </text>
          {treeLayout && (
            <>
              {treeLayout.edges.map(([p, c], i) => (
                <line
                  key={`tedge-${i}`}
                  x1={treeXOf(p)}
                  y1={treeYOf(p)}
                  x2={treeXOf(c)}
                  y2={treeYOf(c)}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  opacity={0.8}
                />
              ))}
              {treeLayout.nodes.map((nd) => {
                const isRootNode = nd.keyIdx === rootKeyIdx && nd._depth === 0;
                return (
                  <g key={`tnode-${nd.keyIdx}`}>
                    <circle
                      cx={treeXOf(nd)}
                      cy={treeYOf(nd)}
                      r={NODE_R}
                      fill={isRootNode ? 'var(--hue-pink)' : 'var(--surface)'}
                      stroke={isRootNode ? 'var(--hue-pink)' : 'var(--accent)'}
                      strokeWidth={isRootNode ? 3 : 2}
                    />
                    <text
                      x={treeXOf(nd)}
                      y={treeYOf(nd) + 1}
                      className="obv-tnode-key"
                      style={{ fill: isRootNode ? 'var(--bg)' : 'var(--text-main)' }}
                    >
                      {nd.key}
                    </text>
                    <text
                      x={treeXOf(nd)}
                      y={treeYOf(nd) + 13}
                      className="obv-tnode-freq"
                      style={{ fill: isRootNode ? 'var(--bg)' : 'var(--text-dim)' }}
                    >
                      f{nd.freq}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className="obv-metrics">
        <div className="obv-metric">
          <span className="obv-metric-label">interval [i, j]</span>
          <span className="obv-metric-value">
            {current.i != null ? `[${current.i}, ${current.j}]` : '—'}
          </span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">root r tried</span>
          <span className="obv-metric-value">
            {current.phase === 'try' ? `k${current.r}` : '—'}
          </span>
        </div>
        <div className="obv-metric">
          <span className="obv-metric-label">candidate cost</span>
          <span className="obv-metric-value">
            {current.phase === 'try' ? current.cand : '—'}
          </span>
        </div>
        <div className="obv-metric obv-metric-best">
          <span className="obv-metric-label">best root</span>
          <span className="obv-metric-value">
            {current.bestRoot == null || current.bestRoot < 0 ? '—' : `k${current.bestRoot}`}
          </span>
        </div>
        <div className="obv-metric obv-metric-total">
          <span className="obv-metric-label">total expected cost</span>
          <span className="obv-metric-value">
            {dp[1][N] === INF ? '—' : `${dp[1][N]} / ${TOTAL_FREQ}`}
          </span>
        </div>
      </div>

      <div className="obv-arith">
        <span className="obv-arith-label">trace</span>
        <span className="obv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
