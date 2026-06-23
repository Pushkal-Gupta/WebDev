import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Check } from 'lucide-react';
import './PrimVsKruskalViz.css';

const TICK_MS = 750;

// Fixed small weighted graph (deterministic, no RNG needed for layout clarity).
const NODES = [
  { id: 0, x: 70, y: 60 },
  { id: 1, x: 220, y: 40 },
  { id: 2, x: 360, y: 80 },
  { id: 3, x: 90, y: 180 },
  { id: 4, x: 240, y: 200 },
  { id: 5, x: 380, y: 190 },
];
const EDGES = [
  { u: 0, v: 1, w: 4 },
  { u: 0, v: 3, w: 3 },
  { u: 1, v: 2, w: 5 },
  { u: 1, v: 3, w: 6 },
  { u: 1, v: 4, w: 2 },
  { u: 2, v: 4, w: 7 },
  { u: 2, v: 5, w: 4 },
  { u: 3, v: 4, w: 8 },
  { u: 4, v: 5, w: 1 },
];

function edgeKey(e) {
  return `${Math.min(e.u, e.v)}-${Math.max(e.u, e.v)}`;
}

function buildKruskal() {
  const steps = [];
  const sorted = [...EDGES].sort((a, b) => a.w - b.w);
  const parent = NODES.map((_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const tree = [];
  let totalW = 0;
  steps.push({ tree: [], consider: null, accept: false, caption: 'Sort all edges by weight, then scan.', total: 0 });
  for (const e of sorted) {
    const ru = find(e.u);
    const rv = find(e.v);
    const cycle = ru === rv;
    if (!cycle) {
      parent[ru] = rv;
      tree.push(edgeKey(e));
      totalW += e.w;
    }
    steps.push({
      tree: [...tree],
      consider: edgeKey(e),
      accept: !cycle,
      caption: cycle
        ? `Edge (${e.u},${e.v}) w=${e.w} would form a cycle — skip.`
        : `Edge (${e.u},${e.v}) w=${e.w} joins two components — add. Total ${totalW}.`,
      total: totalW,
    });
    if (tree.length === NODES.length - 1) break;
  }
  steps.push({ tree: [...tree], consider: null, accept: false, done: true, caption: `MST complete: ${tree.length} edges, total weight ${totalW}.`, total: totalW });
  return steps;
}

function buildPrim() {
  const steps = [];
  const inTree = new Set([0]);
  const tree = [];
  let totalW = 0;
  steps.push({ tree: [], inTree: [0], consider: null, accept: false, caption: 'Seed at vertex 0; grow the lightest frontier edge.', total: 0 });
  while (inTree.size < NODES.length) {
    // frontier edges
    let best = null;
    for (const e of EDGES) {
      const uIn = inTree.has(e.u);
      const vIn = inTree.has(e.v);
      if (uIn !== vIn) {
        if (!best || e.w < best.w) best = e;
      }
    }
    if (!best) break;
    const add = inTree.has(best.u) ? best.v : best.u;
    inTree.add(add);
    tree.push(edgeKey(best));
    totalW += best.w;
    steps.push({
      tree: [...tree],
      inTree: [...inTree],
      consider: edgeKey(best),
      accept: true,
      caption: `Lightest frontier edge (${best.u},${best.v}) w=${best.w} → pull in vertex ${add}. Total ${totalW}.`,
      total: totalW,
    });
  }
  steps.push({ tree: [...tree], inTree: [...inTree], consider: null, accept: false, done: true, caption: `MST complete: ${tree.length} edges, total weight ${totalW}.`, total: totalW });
  return steps;
}

function Graph({ step, algo }) {
  const inTree = algo === 'prim' ? new Set(step.inTree || []) : null;
  return (
    <svg viewBox="0 0 440 250" className="pkviz-svg" role="img" aria-label={`${algo} graph`}>
      {EDGES.map((e) => {
        const a = NODES[e.u];
        const b = NODES[e.v];
        const k = edgeKey(e);
        const inMst = step.tree.includes(k);
        const considered = step.consider === k;
        let cls = 'pkviz-edge';
        if (inMst) cls += ' pkviz-edge-mst';
        else if (considered) cls += step.accept ? ' pkviz-edge-accept' : ' pkviz-edge-reject';
        return (
          <g key={k}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={cls} />
            <text
              x={(a.x + b.x) / 2}
              y={(a.y + b.y) / 2 - 3}
              className={`pkviz-weight ${inMst ? 'pkviz-weight-mst' : ''}`}
              textAnchor="middle"
            >
              {e.w}
            </text>
          </g>
        );
      })}
      {NODES.map((n) => {
        const active = algo === 'prim' ? inTree.has(n.id) : true;
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={14} className={`pkviz-node ${active ? 'pkviz-node-active' : ''}`} />
            <text x={n.x} y={n.y + 4} className="pkviz-node-label" textAnchor="middle">
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PrimVsKruskalViz() {
  const kruskal = useMemo(() => buildKruskal(), []);
  const prim = useMemo(() => buildPrim(), []);
  const maxLen = Math.max(kruskal.length, prim.length);

  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const atEnd = idx >= maxLen - 1;
  const playing = playingRaw && !atEnd;

  const kStep = kruskal[Math.min(idx, kruskal.length - 1)];
  const pStep = prim[Math.min(idx, prim.length - 1)];

  const next = useCallback(() => {
    setIdx((i) => (i >= maxLen - 1 ? i : i + 1));
  }, [maxLen]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }
    timerRef.current = setInterval(next, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  return (
    <div className="pkviz">
      <div className="pkviz-header">
        <div className="pkviz-title">Prim vs Kruskal — same graph, two strategies</div>
        <span className="pkviz-step">{idx} / {maxLen - 1}</span>
      </div>

      <div className="pkviz-grid">
        <div className="pkviz-panel">
          <div className="pkviz-panel-head">
            <span className="pkviz-badge pkviz-badge-k">Kruskal</span>
            <span className="pkviz-panel-sub">global · sort edges + union-find</span>
            {kStep.done && <Check size={14} className="pkviz-doneicon" aria-hidden="true" />}
          </div>
          <Graph step={kStep} algo="kruskal" />
          <div className="pkviz-meta">
            <span>edges in MST: {kStep.tree.length}</span>
            <span>weight: {kStep.total}</span>
          </div>
          <p className="pkviz-cap">{kStep.caption}</p>
        </div>

        <div className="pkviz-panel">
          <div className="pkviz-panel-head">
            <span className="pkviz-badge pkviz-badge-p">Prim</span>
            <span className="pkviz-panel-sub">local · grow from a seed</span>
            {pStep.done && <Check size={14} className="pkviz-doneicon" aria-hidden="true" />}
          </div>
          <Graph step={pStep} algo="prim" />
          <div className="pkviz-meta">
            <span>edges in MST: {pStep.tree.length}</span>
            <span>weight: {pStep.total}</span>
          </div>
          <p className="pkviz-cap">{pStep.caption}</p>
        </div>
      </div>

      <p className="pkviz-foot">
        Both reach the same total weight via the cut property. Kruskal favours sparse graphs (sort + near-O(1)
        union-find); array-based Prim favours dense graphs (O(V²), cache-friendly).
      </p>

      <div className="pkviz-controls">
        <button
          type="button"
          className="pkviz-btn pkviz-btn-ghost"
          onClick={() => {
            setPlaying(false);
            setIdx(0);
          }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="pkviz-btn pkviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button type="button" className="pkviz-btn pkviz-btn-ghost" onClick={next} disabled={atEnd}>
          <SkipForward size={15} aria-hidden="true" />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
