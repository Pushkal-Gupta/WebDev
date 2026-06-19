import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './MorrisTraversalViz.css';

// Fixed 7-node BST so the layout is clean and the threading is easy to follow.
//          4
//      2       6
//    1   3   5   7
const NODES = {
  4: { val: 4, left: 2, right: 6, x: 470, y: 60 },
  2: { val: 2, left: 1, right: 3, x: 270, y: 140 },
  6: { val: 6, left: 5, right: 7, x: 670, y: 140 },
  1: { val: 1, left: null, right: null, x: 170, y: 220 },
  3: { val: 3, left: null, right: null, x: 370, y: 220 },
  5: { val: 5, left: null, right: null, x: 570, y: 220 },
  7: { val: 7, left: null, right: null, x: 770, y: 220 },
};

// Simulate Morris in-order, recording threads created/removed and visits.
function buildFrames() {
  const left = {}; const right = {};
  for (const k of Object.keys(NODES)) { left[k] = NODES[k].left; right[k] = NODES[k].right; }
  const frames = [];
  const threads = {}; // node -> thread target (for drawing)
  const visited = [];
  let cur = 4;

  const snap = (active, pred, action, note) =>
    frames.push({ cur: active, pred, threads: { ...threads }, visited: visited.slice(), action, note });

  snap(cur, null, 'start', 'Morris in-order: visit nodes left→root→right using O(1) extra space. Instead of a stack, temporarily thread each node\'s in-order predecessor\'s right pointer back to it, then undo the thread on the way back.');

  while (cur !== null) {
    if (left[cur] === null) {
      visited.push(NODES[cur].val);
      snap(cur, null, 'visit', `Node ${NODES[cur].val} has no left child → visit it now, then follow its right link. Output so far: [${visited.join(', ')}].`);
      cur = right[cur];
    } else {
      let pred = left[cur];
      while (right[pred] !== null && right[pred] !== cur) pred = right[pred];
      if (right[pred] === null) {
        right[pred] = cur;
        threads[pred] = cur;
        snap(cur, pred, 'thread', `Left subtree exists. Its in-order predecessor is ${NODES[pred].val}. Thread ${NODES[pred].val}.right → ${NODES[cur].val} so we can climb back later, then descend left.`);
        cur = left[cur];
      } else {
        right[pred] = null;
        delete threads[pred];
        visited.push(NODES[cur].val);
        snap(cur, pred, 'unthread', `Came back via the thread from ${NODES[pred].val}. Remove it (restore the tree), visit ${NODES[cur].val}, then go right. Output: [${visited.join(', ')}].`);
        cur = right[cur];
      }
    }
  }
  snap(null, null, 'done', `Done. In-order sequence: [${visited.join(', ')}]. Every thread was created once and removed once, so the tree is left exactly as it started — all with O(1) extra memory.`);
  return frames;
}

const EDGES = [];
for (const k of Object.keys(NODES)) {
  const n = NODES[k];
  if (n.left != null) EDGES.push([k, n.left]);
  if (n.right != null) EDGES.push([k, n.right]);
}

export default function MorrisTraversalViz() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];

  const isRunning = running && step < total - 1;
  const delay = Math.round(1000 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, total]);

  const reset = () => { setRunning(false); setStep(0); };

  const W = 940;
  const H = 300;
  const R = 24;

  return (
    <div className="mor">
      <div className="mor-head">
        <h3 className="mor-title">Morris traversal — in-order without a stack</h3>
        <p className="mor-sub">
          Thread each node&apos;s in-order predecessor back to it, descend left, then follow the thread up and
          remove it. Visits nodes left→root→right in O(1) extra space. Dashed links are temporary threads.
        </p>
      </div>

      <div className="mor-controls">
        <div className="mor-buttons">
          <button type="button" className="mor-btn mor-btn-primary" onClick={() => { if (step >= total - 1) setStep(0); setRunning((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="mor-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="mor-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="mor-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <label className="mor-speed">
          <span>speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mor-speed-range" />
          <span className="mor-speed-val">{speed.toFixed(1)}×</span>
        </label>
        <div className="mor-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="mor-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mor-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* real edges */}
          {EDGES.map(([a, b]) => (
            <line key={`e-${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
              stroke="var(--border)" strokeWidth={1.6} />
          ))}

          {/* thread links (temporary) */}
          {Object.entries(cur.threads).map(([from, to]) => {
            const a = NODES[from]; const b = NODES[to];
            const midX = (a.x + b.x) / 2 + 40;
            const midY = (a.y + b.y) / 2;
            return (
              <path key={`t-${from}`} d={`M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`}
                fill="none" stroke="var(--hue-pink)" strokeWidth={2} strokeDasharray="5 4" />
            );
          })}

          {/* nodes */}
          {Object.keys(NODES).map((k) => {
            const n = NODES[k];
            const isCur = String(cur.cur) === k;
            const isPred = String(cur.pred) === k;
            const done = cur.visited.includes(n.val);
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            if (isCur) { fill = 'var(--accent)'; stroke = 'var(--accent)'; }
            else if (isPred) { fill = 'rgba(var(--accent-rgb), 0.18)'; stroke = 'var(--hue-pink)'; }
            else if (done) { fill = 'rgba(var(--accent-rgb), 0.12)'; stroke = 'var(--accent)'; }
            return (
              <g key={`n-${k}`}>
                <circle cx={n.x} cy={n.y} r={R} fill={fill} stroke={stroke} strokeWidth={isCur || isPred ? 2.8 : 1.6} />
                <text x={n.x} y={n.y + 6} className="mor-node-val" style={{ fill: isCur ? 'var(--bg)' : 'var(--text-main)' }}>{n.val}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mor-output">
        <span className="mor-output-label">in-order output</span>
        <div className="mor-output-cells">
          {cur.visited.length === 0
            ? <span className="mor-output-empty">(nothing yet)</span>
            : cur.visited.map((v, i) => <span key={i} className="mor-output-cell">{v}</span>)}
        </div>
      </div>

      <div className="mor-trace">
        <span className="mor-trace-label">trace</span>
        <span className="mor-trace-body">{cur.note}</span>
      </div>
    </div>
  );
}
