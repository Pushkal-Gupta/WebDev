import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './LcaBstViz.css';

// Fixed BST matching the lesson's example tree.
const TREE = {
  v: 8,
  l: { v: 4, l: { v: 2 }, r: { v: 6, l: { v: 5 }, r: { v: 7 } } },
  r: { v: 12, r: { v: 16 } },
};

const VALUES = [2, 4, 5, 6, 7, 8, 12, 16];

function layout(root) {
  const nodes = [];
  let order = 0;
  (function walk(node, depth) {
    if (!node) return;
    walk(node.l, depth + 1);
    node._order = order++;
    node._depth = depth;
    nodes.push(node);
    walk(node.r, depth + 1);
  })(root, 0);
  return nodes;
}

function buildFrames(root, p, q) {
  const frames = [];
  let cur = root;
  const lo = Math.min(p, q);
  const hi = Math.max(p, q);
  frames.push({
    cur: null, path: [], decided: false, lca: null,
    note: `Find LCA(${p}, ${q}). Start at the root and use the BST order to pick a side.`,
  });
  const path = [];
  while (cur) {
    path.push(cur.v);
    if (hi < cur.v) {
      frames.push({ cur: cur.v, path: [...path], decided: false, lca: null,
        note: `${lo} and ${hi} both < ${cur.v} -> both lie in the left subtree. Go left.` });
      cur = cur.l;
    } else if (lo > cur.v) {
      frames.push({ cur: cur.v, path: [...path], decided: false, lca: null,
        note: `${lo} and ${hi} both > ${cur.v} -> both lie in the right subtree. Go right.` });
      cur = cur.r;
    } else {
      frames.push({ cur: cur.v, path: [...path], decided: true, lca: cur.v,
        note: `${lo} <= ${cur.v} <= ${hi}: the values straddle ${cur.v} (or one equals it). This is the split point — LCA = ${cur.v}.` });
      break;
    }
  }
  return frames;
}

const NODE_R = 19;

export default function LcaBstViz() {
  const [p, setP] = useState(2);
  const [q, setQ] = useState(7);
  const [frames, setFrames] = useState(() => buildFrames(TREE, 2, 7));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const timer = useRef(null);

  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const delay = Math.round(1000 / speed);
  const running = playing && step < total - 1;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, step, delay, total]);

  const nodes = useMemo(() => layout(TREE), []);

  const rebuild = (np, nq) => {
    setPlaying(false);
    setFrames(buildFrames(TREE, np, nq));
    setStep(0);
  };

  const W = 760;
  const H = 320;
  const padX = 50;
  const topY = 48;
  const levelGap = 78;
  const count = nodes.length;
  const xOf = (n) => padX + (n._order + 0.5) * ((W - padX * 2) / count);
  const yOf = (n) => topY + n._depth * levelGap;

  const edges = [];
  (function collect(node) {
    if (!node) return;
    if (node.l) { edges.push([node, node.l]); collect(node.l); }
    if (node.r) { edges.push([node, node.r]); collect(node.r); }
  })(TREE);

  const pathSet = new Set(cur.path);

  return (
    <div className="lcav">
      <div className="lcav-head">
        <h3 className="lcav-title">Lowest common ancestor in a BST — one root-down walk</h3>
        <p className="lcav-sub">
          Pick p and q. At each node the BST order tells you which subtree contains both — the first node
          where they straddle (or one equals it) is the LCA. O(h), no recursion, no extra memory.
        </p>
      </div>

      <div className="lcav-controls">
        <label className="lcav-pick">
          <span className="lcav-pick-label">p</span>
          <select className="lcav-select" value={p} onChange={(e) => { const v = Number(e.target.value); setP(v); rebuild(v, q); }}>
            {VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="lcav-pick">
          <span className="lcav-pick-label">q</span>
          <select className="lcav-select" value={q} onChange={(e) => { const v = Number(e.target.value); setQ(v); rebuild(p, v); }}>
            {VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <button type="button" className="lcav-btn" onClick={() => { if (step >= total - 1) return; setPlaying((x) => !x); }} disabled={step >= total - 1}>
          {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="lcav-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="lcav-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
          <SkipForward size={14} /> Skip
        </button>
        <button type="button" className="lcav-btn" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={14} /> Reset</button>
        <label className="lcav-speed">
          <span className="lcav-speed-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="lcav-range" />
        </label>
        <div className="lcav-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="lcav-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lcav-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />
          {edges.map(([a, b], i) => {
            const onp = pathSet.has(a.v) && pathSet.has(b.v);
            return <line key={i} x1={xOf(a)} y1={yOf(a)} x2={xOf(b)} y2={yOf(b)} stroke={onp ? 'var(--accent)' : 'var(--border)'} strokeWidth={onp ? 2.8 : 1.6} opacity={onp ? 1 : 0.7} />;
          })}
          {nodes.map((nd) => {
            const isCur = nd.v === cur.cur && !cur.decided;
            const isLca = cur.decided && nd.v === cur.lca;
            const isPQ = nd.v === p || nd.v === q;
            const visited = pathSet.has(nd.v);
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            let label = 'var(--text-main)';
            if (isLca) { fill = 'var(--easy)'; stroke = 'var(--easy)'; label = 'var(--bg)'; }
            else if (isCur) { fill = 'var(--medium)'; stroke = 'var(--medium)'; label = 'var(--bg)'; }
            else if (visited) { fill = 'rgba(var(--accent-rgb), 0.18)'; stroke = 'var(--accent)'; }
            return (
              <g key={nd.v}>
                <circle cx={xOf(nd)} cy={yOf(nd)} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={isCur || isLca ? 3 : 2} />
                {isPQ && !isLca && (
                  <circle cx={xOf(nd)} cy={yOf(nd)} r={NODE_R + 5} fill="none" stroke="var(--hue-violet)" strokeWidth={2} strokeDasharray="3 2" />
                )}
                <text x={xOf(nd)} y={yOf(nd) + 5} className="lcav-node-label" style={{ fill: label }}>{nd.v}</text>
                {isPQ && <text x={xOf(nd)} y={yOf(nd) - NODE_R - 9} className="lcav-pq-tag">{nd.v === p ? 'p' : ''}{nd.v === p && nd.v === q ? '' : ''}{nd.v === q && nd.v !== p ? 'q' : ''}{nd.v === p && nd.v === q ? 'p,q' : ''}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="lcav-metrics">
        <div className="lcav-metric"><span className="lcav-metric-label">at node</span><span className="lcav-metric-value">{cur.cur == null ? '—' : cur.cur}</span></div>
        <div className="lcav-metric"><span className="lcav-metric-label">hops</span><span className="lcav-metric-value">{Math.max(0, cur.path.length - 1)}</span></div>
        <div className="lcav-metric"><span className="lcav-metric-label">range</span><span className="lcav-metric-value">[{Math.min(p, q)}, {Math.max(p, q)}]</span></div>
        <div className="lcav-metric lcav-metric-dim"><span className="lcav-metric-label">LCA</span><span className="lcav-metric-value lcav-metric-dimval">{cur.lca == null ? 'searching' : cur.lca}</span></div>
      </div>

      <div className="lcav-note">
        <span className="lcav-note-label">decision</span>
        <span className="lcav-note-text">{cur.note}</span>
      </div>
    </div>
  );
}
