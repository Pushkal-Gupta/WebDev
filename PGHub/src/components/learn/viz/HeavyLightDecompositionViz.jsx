import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './HeavyLightDecompositionViz.css';

// Fixed tree: 10 nodes, root = 0.
// Adjacency (parent -> children):
// 0 -> 1, 2
// 1 -> 3, 4, 5
// 2 -> 6
// 3 -> 7, 8
// 5 -> 9
const TREE = {
  parent: [-1, 0, 0, 1, 1, 1, 2, 3, 3, 5],
  children: {
    0: [1, 2],
    1: [3, 4, 5],
    2: [6],
    3: [7, 8],
    4: [],
    5: [9],
    6: [],
    7: [],
    8: [],
    9: [],
  },
};
const N = 10;

// Fixed positions chosen for clarity.
const POS = {
  0: { x: 420, y: 60 },
  1: { x: 260, y: 150 },
  2: { x: 620, y: 150 },
  3: { x: 140, y: 240 },
  4: { x: 280, y: 240 },
  5: { x: 420, y: 240 },
  6: { x: 620, y: 240 },
  7: { x: 80, y: 330 },
  8: { x: 200, y: 330 },
  9: { x: 420, y: 330 },
};

// Chain color palette via theme tokens.
const CHAIN_COLORS = [
  'var(--hue-violet)',
  'var(--hue-sky)',
  'var(--hue-pink)',
  'var(--hue-mint)',
  'var(--accent)',
  'var(--easy)',
];

function computeSubtreeSizes() {
  const size = new Array(N).fill(1);
  const order = [];
  const visited = new Array(N).fill(false);
  // iterative post-order from root 0
  const stack = [[0, false]];
  while (stack.length) {
    const [u, processed] = stack.pop();
    if (processed) {
      for (const c of TREE.children[u]) size[u] += size[c];
      order.push(u);
      continue;
    }
    if (visited[u]) continue;
    visited[u] = true;
    stack.push([u, true]);
    for (const c of TREE.children[u]) stack.push([c, false]);
  }
  return { size, order };
}

function buildHldFrames() {
  const { size, order } = computeSubtreeSizes();
  const heavyChild = new Array(N).fill(-1);
  const chainOf = new Array(N).fill(-1);
  const chainTop = new Array(N).fill(-1);
  const chains = [];
  const frames = [];

  frames.push({
    phase: 'intro',
    size: [...size],
    heavyChild: [...heavyChild],
    chainOf: [...chainOf],
    chains: [],
    activeNode: -1,
    note: `Subtree sizes computed bottom-up. size[0] = ${size[0]} (the whole tree). Now identify the heavy child of each internal node.`,
  });

  // Identify heavy children (top-down for narration).
  for (let u = 0; u < N; u++) {
    const kids = TREE.children[u];
    if (!kids.length) continue;
    let best = kids[0];
    for (const c of kids) if (size[c] > size[best]) best = c;
    heavyChild[u] = best;
    frames.push({
      phase: 'heavy-pick',
      size: [...size],
      heavyChild: [...heavyChild],
      chainOf: [...chainOf],
      chains: [],
      activeNode: u,
      heavyEdge: [u, best],
      note: `Node ${u}: children = [${kids.join(', ')}]. Sizes = [${kids.map((c) => size[c]).join(', ')}]. Heavy child = ${best}.`,
    });
  }

  // Build chains: DFS from root, extend chain into heavy child.
  function dfsChain(u, chainId) {
    chainOf[u] = chainId;
    chains[chainId].push(u);
    if (chainTop[chainId] === -1) chainTop[chainId] = u;
    frames.push({
      phase: 'chain-extend',
      size: [...size],
      heavyChild: [...heavyChild],
      chainOf: [...chainOf],
      chains: chains.map((c) => [...c]),
      activeNode: u,
      note: `Attach node ${u} to chain ${chainId}. Chain so far: [${chains[chainId].join(' → ')}].`,
    });
    const hc = heavyChild[u];
    if (hc !== -1) dfsChain(hc, chainId);
    for (const c of TREE.children[u]) {
      if (c === hc) continue;
      chains.push([]);
      const newId = chains.length - 1;
      frames.push({
        phase: 'chain-start',
        size: [...size],
        heavyChild: [...heavyChild],
        chainOf: [...chainOf],
        chains: chains.map((arr) => [...arr]),
        activeNode: c,
        note: `Light edge ${u} → ${c}. Open a new chain ${newId} starting at ${c}.`,
      });
      dfsChain(c, newId);
    }
  }
  chains.push([]);
  dfsChain(0, 0);

  frames.push({
    phase: 'done',
    size: [...size],
    heavyChild: [...heavyChild],
    chainOf: [...chainOf],
    chains: chains.map((c) => [...c]),
    activeNode: -1,
    note: `Decomposition complete. ${chains.length} heavy paths. Every root-to-leaf path crosses ≤ O(log n) light edges.`,
  });

  // Order is consumed for narration; not needed beyond this point.
  void order;

  return { frames, chainOf, chains, heavyChild, size };
}

function depth(u) {
  let d = 0;
  let v = u;
  while (TREE.parent[v] !== -1) { v = TREE.parent[v]; d++; }
  return d;
}

function buildLcaFrames(u, v, chainOf, chains) {
  const frames = [];
  const visited = new Set();
  let a = u, b = v;
  const hopsPath = [];

  frames.push({
    phase: 'lca-init',
    u: a, v: b,
    cur: -1,
    visited: new Set(),
    hopsPath: [],
    note: `LCA(${u}, ${v}). Repeatedly jump the deeper endpoint up to the top of its heavy chain, then take one parent step until both are on the same chain.`,
  });

  while (chainOf[a] !== chainOf[b]) {
    const topA = chains[chainOf[a]][0];
    const topB = chains[chainOf[b]][0];
    // Move the one whose chain top is deeper.
    if (depth(topA) >= depth(topB)) {
      hopsPath.push({ from: a, to: topA, chain: chainOf[a] });
      for (const node of chains[chainOf[a]]) {
        if (depth(node) >= depth(topA) && depth(node) <= depth(a)) visited.add(node);
      }
      frames.push({
        phase: 'lca-hop',
        u: a, v: b,
        cur: a,
        visited: new Set(visited),
        hopsPath: [...hopsPath],
        note: `Endpoint a = ${a} (chain ${chainOf[a]}, top ${topA}). Jump to top: a = ${topA}. Then take one parent step.`,
      });
      a = TREE.parent[topA];
      visited.add(a);
    } else {
      hopsPath.push({ from: b, to: topB, chain: chainOf[b] });
      for (const node of chains[chainOf[b]]) {
        if (depth(node) >= depth(topB) && depth(node) <= depth(b)) visited.add(node);
      }
      frames.push({
        phase: 'lca-hop',
        u: a, v: b,
        cur: b,
        visited: new Set(visited),
        hopsPath: [...hopsPath],
        note: `Endpoint b = ${b} (chain ${chainOf[b]}, top ${topB}). Jump to top: b = ${topB}. Then take one parent step.`,
      });
      b = TREE.parent[topB];
      visited.add(b);
    }
  }

  const lca = depth(a) < depth(b) ? a : b;
  // mark intervening nodes on the shared chain
  for (const node of chains[chainOf[a]]) {
    if (depth(node) >= depth(lca) && depth(node) <= Math.max(depth(a), depth(b))) visited.add(node);
  }
  frames.push({
    phase: 'lca-found',
    u: a, v: b,
    cur: lca,
    visited: new Set(visited),
    hopsPath: [...hopsPath],
    lca,
    note: `a and b now share chain ${chainOf[a]}. LCA = the shallower of (${a}, ${b}) = ${lca}.`,
  });

  return frames;
}

export default function HeavyLightDecompositionViz() {
  const hld = useMemo(() => buildHldFrames(), []);
  const [mode, setMode] = useState('build');
  const [queryU, setQueryU] = useState(7);
  const [queryV, setQueryV] = useState(9);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const lcaFrames = useMemo(
    () => buildLcaFrames(queryU, queryV, hld.chainOf, hld.chains),
    [queryU, queryV, hld]
  );

  const frames = mode === 'build' ? hld.frames : lcaFrames;
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
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

  const applyMode = (next) => {
    if (next === mode) return;
    reset();
    setMode(next);
  };

  // Resolve edges with heavy/light classification.
  const finalChainOf = hld.chainOf;
  const finalHeavy = hld.heavyChild;

  // chain-of state for build mode (running)
  const liveChainOf = mode === 'build' ? current.chainOf : finalChainOf;
  const liveHeavy = mode === 'build' ? current.heavyChild : finalHeavy;
  const heavyEdge = mode === 'build' && current.heavyEdge ? current.heavyEdge : null;

  // Determine query-path hop chains for LCA mode.
  const lcaHopChains = mode === 'lca' ? (current.hopsPath || []).map((h) => h.chain) : [];

  const W = 800;
  const H = 410;

  // Build edges array
  const edges = [];
  for (let v = 1; v < N; v++) {
    const p = TREE.parent[v];
    edges.push({ a: p, b: v });
  }

  return (
    <div className="hldv">
      <div className="hldv-head">
        <h3 className="hldv-title">Heavy-Light Decomposition — chains + O(log n) LCA</h3>
        <p className="hldv-sub">
          Pick each node's heaviest child to extend its chain. Every root path crosses at most O(log n) light edges, so queries that jump chain-by-chain run in O(log² n) with a segment tree (O(log n) for plain LCA).
        </p>
      </div>

      <div className="hldv-controls">
        <div className="hldv-tabs">
          <button type="button" className={`hldv-tab ${mode === 'build' ? 'hldv-tab-active' : ''}`} onClick={() => applyMode('build')}>Build chains</button>
          <button type="button" className={`hldv-tab ${mode === 'lca' ? 'hldv-tab-active' : ''}`} onClick={() => applyMode('lca')}>LCA query</button>
        </div>

        {mode === 'lca' && (
          <>
            <div className="hldv-field">
              <span className="hldv-label">u</span>
              <div className="hldv-slider">
                <input type="range" min={0} max={N - 1} step={1} value={queryU} onChange={(e) => { setQueryU(Number(e.target.value)); reset(); }} className="hldv-slider-range" />
                <span className="hldv-slider-value">{queryU}</span>
              </div>
            </div>
            <div className="hldv-field">
              <span className="hldv-label">v</span>
              <div className="hldv-slider">
                <input type="range" min={0} max={N - 1} step={1} value={queryV} onChange={(e) => { setQueryV(Number(e.target.value)); reset(); }} className="hldv-slider-range" />
                <span className="hldv-slider-value">{queryV}</span>
              </div>
            </div>
          </>
        )}

        <div className="hldv-actions">
          <div className="hldv-buttons">
            <button type="button" className="hldv-btn hldv-btn-primary" onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}>
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="hldv-btn" onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
              <ChevronRight size={14} /> Step
            </button>
            <button type="button" className="hldv-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="hldv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="hldv-speed">
            <span className="hldv-speed-label">speed</span>
            <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="hldv-speed-range" />
            <span className="hldv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="hldv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="hldv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="hldv-svg" preserveAspectRatio="xMidYMid meet">
          {edges.map(({ a, b }) => {
            // Heavy edge if b is heavy child of a (in known state).
            const isHeavy = liveHeavy[a] === b;
            const chainId = liveChainOf[b];
            const isHighlight = heavyEdge && heavyEdge[0] === a && heavyEdge[1] === b;
            let color = 'var(--border)';
            let width = 1.5;
            if (isHeavy && chainId !== -1) {
              color = CHAIN_COLORS[chainId % CHAIN_COLORS.length];
              width = 4;
            } else if (isHeavy) {
              color = 'var(--accent)';
              width = 3;
            }
            if (isHighlight) {
              color = 'var(--accent)';
              width = 4.5;
            }
            // LCA mode: highlight hop edges
            if (mode === 'lca') {
              const hopChain = lcaHopChains.includes(finalChainOf[b]) && finalHeavy[a] === b;
              if (hopChain) {
                color = CHAIN_COLORS[finalChainOf[b] % CHAIN_COLORS.length];
                width = 4.5;
              }
            }
            return (
              <line
                key={`e-${a}-${b}`}
                x1={POS[a].x}
                y1={POS[a].y}
                x2={POS[b].x}
                y2={POS[b].y}
                stroke={color}
                strokeWidth={width}
                className="hldv-edge"
                strokeDasharray={!isHeavy ? '3 3' : undefined}
                opacity={!isHeavy && mode === 'lca' ? 0.5 : 1}
              />
            );
          })}

          {Array.from({ length: N }, (_, u) => {
            const { x, y } = POS[u];
            const chainId = liveChainOf[u];
            const inChain = chainId !== -1;
            const isActive = current.activeNode === u || (mode === 'lca' && (current.u === u || current.v === u));
            const isLca = mode === 'lca' && current.phase === 'lca-found' && current.lca === u;
            const isVisited = mode === 'lca' && current.visited && current.visited.has(u);
            let fill = 'var(--surface)';
            let stroke = 'var(--border)';
            let sw = 1.5;
            if (inChain) {
              const color = CHAIN_COLORS[chainId % CHAIN_COLORS.length];
              fill = `color-mix(in srgb, ${color} 18%, var(--surface))`;
              stroke = color;
              sw = 2;
            }
            if (isVisited) {
              sw = 2.5;
            }
            if (isActive) {
              stroke = 'var(--hue-pink)';
              sw = 3;
            }
            if (isLca) {
              fill = 'rgba(var(--accent-rgb), 0.30)';
              stroke = 'var(--accent)';
              sw = 3.5;
            }
            return (
              <g key={`n-${u}`}>
                <circle cx={x} cy={y} r={22} fill={fill} stroke={stroke} strokeWidth={sw} className="hldv-node-circle" />
                <text x={x} y={y} className="hldv-node-text">{u}</text>
                <text x={x} y={y + 36} className="hldv-node-meta">size={hld.size[u]}</text>
              </g>
            );
          })}

          {mode === 'lca' && current.phase === 'lca-found' && (
            <text x={W / 2} y={H - 12} fontSize="13" fontFamily="var(--mono)" fontWeight="700" fill="var(--accent)" textAnchor="middle">
              LCA({queryU}, {queryV}) = {current.lca}
            </text>
          )}
        </svg>
      </div>

      <div className="hldv-chains">
        {(current.chains || hld.chains).map((chain, idx) => (
          chain.length ? (
            <div key={`c-${idx}`} className="hldv-chain-pill">
              <span className="hldv-chain-dot" style={{ background: CHAIN_COLORS[idx % CHAIN_COLORS.length] }} />
              chain {idx}: {chain.join(' → ')}
            </div>
          ) : null
        ))}
      </div>

      <div className="hldv-metrics">
        <div className="hldv-metric">
          <span className="hldv-metric-label">nodes</span>
          <span className="hldv-metric-value">{N}</span>
        </div>
        <div className="hldv-metric">
          <span className="hldv-metric-label">chains</span>
          <span className="hldv-metric-value">{(current.chains || hld.chains).filter((c) => c.length).length}</span>
        </div>
        {mode === 'lca' && (
          <div className="hldv-metric">
            <span className="hldv-metric-label">hops</span>
            <span className="hldv-metric-value">{(current.hopsPath || []).length}</span>
          </div>
        )}
        <div className="hldv-metric kmpv-metric-dim">
          <span className="hldv-metric-label">phase</span>
          <span className="hldv-metric-value hldv-metric-dimval">{current.phase}</span>
        </div>
      </div>

      <div className="hldv-arith">
        <span className="hldv-arith-label">trace</span>
        <span className="hldv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
