import React, { useState, useEffect, useRef } from 'react';
import { Workflow, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './CompilerParseTreeViz.css';

// Deterministic recursive-descent build of the AST for `2 + 3 * 4`.
// Nodes/edges reveal progressively so multiplication sits BELOW addition,
// showing precedence. No randomness anywhere.
const TOKENS = ['2', '+', '3', '*', '4'];

const NODES = [
  { id: 'add', x: 228, y: 58, label: '+', kind: 'op', revealAt: 8 },
  { id: 'n2', x: 150, y: 150, label: '2', kind: 'num', revealAt: 1 },
  { id: 'mul', x: 306, y: 150, label: '*', kind: 'op', revealAt: 7 },
  { id: 'n3', x: 258, y: 244, label: '3', kind: 'num', revealAt: 4 },
  { id: 'n4', x: 356, y: 244, label: '4', kind: 'num', revealAt: 6 },
];
const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

const EDGES = [
  { from: 'mul', to: 'n3', revealAt: 7 },
  { from: 'mul', to: 'n4', revealAt: 7 },
  { from: 'add', to: 'n2', revealAt: 8 },
  { from: 'add', to: 'mul', revealAt: 8 },
];

const FRAMES = [
  { tok: 0, reveal: 0, desc: 'expression() calls term() calls factor(): read NUMBER 2.' },
  { tok: 0, reveal: 1, desc: 'factor() returns the leaf 2.' },
  { tok: 1, reveal: 1, desc: "expression() sees '+', consumes it, and parses the right-hand term." },
  { tok: 2, reveal: 1, desc: 'term() calls factor(): read NUMBER 3.' },
  { tok: 2, reveal: 4, desc: 'factor() returns the leaf 3.' },
  { tok: 3, reveal: 4, desc: "term() sees '*' (binds tighter) — consume it and parse another factor." },
  { tok: 4, reveal: 6, desc: 'factor() returns the leaf 4.' },
  { tok: 4, reveal: 7, desc: 'term() folds 3 * 4 into a Mul node — precedence captured below the +.' },
  { tok: 4, reveal: 8, desc: 'expression() folds 2 + (3 * 4) into the Add root.' },
  { tok: -1, reveal: 8, desc: 'Done: Add(2, Mul(3, 4)) — this evaluates to 14, not 20.' },
];

const RADIUS = 22;
const W = 460;
const H = 300;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CompilerParseTreeViz() {
  const total = FRAMES.length - 1;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const cur = FRAMES[Math.min(step, total)];

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 420 : 1000) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  return (
    <div className="cptv">
      <div className="cptv-head">
        <div className="cptv-head-icon"><Workflow size={18} /></div>
        <div className="cptv-head-text">
          <h3 className="cptv-title">Recursive descent builds the AST</h3>
          <p className="cptv-sub">
            Parsing <code>2 + 3 * 4</code>: layering the grammar by precedence forces the
            multiplication into a subtree below the addition, so the tree groups correctly.
          </p>
        </div>
        <button type="button" className="cptv-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cptv-tokenbar">
        {TOKENS.map((t, idx) => (
          <span key={idx} className={`cptv-tok${idx === cur.tok ? ' is-active' : ''}${idx < cur.tok || (cur.tok === -1) ? ' is-done' : ''}`}>
            {t}
          </span>
        ))}
        <span className={`cptv-tok cptv-tok-eof${cur.tok === -1 ? ' is-active' : ''}`}>EOF</span>
      </div>

      <div className="cptv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cptv-svg" preserveAspectRatio="xMidYMid meet">
          {EDGES.map((e) => {
            const f = NODE_BY_ID[e.from];
            const t = NODE_BY_ID[e.to];
            const shown = e.revealAt <= cur.reveal;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={f.x} y1={f.y + RADIUS} x2={t.x} y2={t.y - RADIUS}
                className={`cptv-edge${shown ? ' is-shown' : ''}`}
              />
            );
          })}
          {NODES.map((n) => {
            const shown = n.revealAt <= cur.reveal;
            const justAdded = n.revealAt === cur.reveal;
            return (
              <g key={n.id} className={`cptv-node cptv-node-${n.kind}${shown ? ' is-shown' : ''}${justAdded ? ' is-new' : ''}`}>
                <circle cx={n.x} cy={n.y} r={RADIUS} className="cptv-node-circle" />
                <text x={n.x} y={n.y + 6} textAnchor="middle" className="cptv-node-text">{n.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cptv-controls">
        <button type="button" className="cptv-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="cptv-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="cptv-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="cptv-speed-range"
          />
          <span className="cptv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="cptv-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="cptv-readout">
        <div className="cptv-stat is-nodes">
          <span className="cptv-stat-label">nodes built</span>
          <span className="cptv-stat-val">{NODES.filter((n) => n.revealAt <= cur.reveal).length}</span>
        </div>
        <div className="cptv-stat is-tok">
          <span className="cptv-stat-label">token</span>
          <span className="cptv-stat-val">{cur.tok === -1 ? 'EOF' : TOKENS[cur.tok]}</span>
        </div>
        <div className="cptv-stat is-result">
          <span className="cptv-stat-label">groups as</span>
          <span className="cptv-stat-val">2 + (3*4)</span>
        </div>
      </div>

      <div className="cptv-note">
        <span className="cptv-note-label">now</span>
        <span className="cptv-note-body">{cur.desc}</span>
      </div>
    </div>
  );
}
