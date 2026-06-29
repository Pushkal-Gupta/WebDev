import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Repeat } from 'lucide-react';
import './NnRnnViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
const HID = 4; // hidden-state dimension shown as a small bar stack
const STEPS = TOKENS.length;

// Deterministic toy weights so the hidden state evolves visibly (no Math.random).
function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStates() {
  const rnd = mulberry32(7);
  const W = Array.from({ length: HID }, () => Array.from({ length: HID }, () => rnd() * 0.8 - 0.4));
  const U = Array.from({ length: HID }, () => rnd() * 1.4 - 0.7);
  const states = [new Array(HID).fill(0)];
  for (let t = 0; t < STEPS; t++) {
    const x = (t + 1) / STEPS; // simple scalar embedding of the token
    const prev = states[t];
    const h = new Array(HID).fill(0).map((_, i) => {
      let s = U[i] * x;
      for (let j = 0; j < HID; j++) s += W[i][j] * prev[j];
      return Math.tanh(s);
    });
    states.push(h);
  }
  return states;
}

const VB_W = 460;
const VB_H = 150;
const CELL_W = 52;
const CELL_H = 50;
const GAP = (VB_W - 22 - STEPS * CELL_W) / (STEPS - 1);
const cellX = (i) => 11 + i * (CELL_W + GAP);
const ROW_Y = 56;

export default function NnRnnViz() {
  const states = useMemo(() => buildStates(), []);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0); // current active step (0..STEPS)
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const reset = () => { setT(0); setPlaying(true); };

  useEffect(() => {
    if (!playing || t >= STEPS) return undefined;
    const interval = reduced ? 950 : 620;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        setT((p) => {
          const next = Math.min(STEPS, p + 1);
          if (next >= STEPS) setPlaying(false);
          return next;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, t, reduced]);

  const h = states[Math.min(t, STEPS)];

  return (
    <div className="nrnn">
      <div className="nrnn-head">
        <div className="nrnn-head-icon"><Repeat size={18} /></div>
        <div className="nrnn-head-text">
          <h3 className="nrnn-title">An RNN unrolled across time: one hidden state carried forward</h3>
          <p className="nrnn-sub">
            The same cell processes each token left to right, folding it into the hidden state
            <span dangerouslySetInnerHTML={{ __html: km('\\;h_t = \\tanh(W h_{t-1} + U x_t + b)') }} />.
          </p>
        </div>
        <button type="button" className="nrnn-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nrnn-controls">
        <button type="button" className="nrnn-btn nrnn-btn-primary"
          onClick={() => (t >= STEPS ? reset() : setPlaying((p) => !p))}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> {t >= STEPS ? 'Replay' : 'Play'}</>}
        </button>
        <span className="nrnn-eq" dangerouslySetInnerHTML={{ __html: km('h_t = f(h_{t-1},\\, x_t)') }} />
      </div>

      <div className="nrnn-stage">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="nrnn-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="nrnn-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* recurrent edges h_{t-1} -> h_t */}
          {TOKENS.map((_, i) => {
            if (i === 0) return null;
            const active = i <= t;
            return (
              <line key={`r${i}`}
                x1={cellX(i - 1) + CELL_W} y1={ROW_Y + CELL_H / 2}
                x2={cellX(i)} y2={ROW_Y + CELL_H / 2}
                className={`nrnn-recur ${active ? 'is-active' : ''}`}
                markerEnd="url(#nrnn-arrow)" />
            );
          })}

          {TOKENS.map((tok, i) => {
            const reached = i < t;        // cell has produced its hidden state
            const isCurrent = i === t - 1; // most recently updated
            const x0 = cellX(i);
            return (
              <g key={i}>
                {/* input token feeding up into the cell */}
                <line x1={x0 + CELL_W / 2} y1={ROW_Y + CELL_H + 26} x2={x0 + CELL_W / 2} y2={ROW_Y + CELL_H + 2}
                  className={`nrnn-inedge ${reached ? 'is-active' : ''}`} markerEnd="url(#nrnn-arrow)" />
                <rect x={x0 + 3} y={ROW_Y + CELL_H + 26} width={CELL_W - 6} height={18} rx={5}
                  className={`nrnn-token ${reached ? 'is-active' : ''} ${isCurrent ? 'is-current' : ''}`} />
                <text x={x0 + CELL_W / 2} y={ROW_Y + CELL_H + 38} className="nrnn-token-lab" textAnchor="middle">{tok}</text>

                {/* the recurrent cell */}
                <rect x={x0} y={ROW_Y} width={CELL_W} height={CELL_H} rx={8}
                  className={`nrnn-cell ${reached ? 'is-active' : ''} ${isCurrent ? 'is-current' : ''}`} />

                {/* hidden-state bars inside the cell */}
                {reached && states[i + 1].map((hv, k) => {
                  const bw = (CELL_W - 12) / HID;
                  const bx = x0 + 6 + k * bw;
                  const mag = Math.abs(hv) * (CELL_H - 14);
                  const up = hv >= 0;
                  const mid = ROW_Y + CELL_H / 2;
                  return <rect key={k} x={bx + 1} y={up ? mid - mag : mid} width={bw - 2} height={Math.max(1, mag)}
                    className={up ? 'nrnn-bar-pos' : 'nrnn-bar-neg'} />;
                })}

                <text x={x0 + CELL_W / 2} y={ROW_Y - 5} className="nrnn-step-lab" textAnchor="middle">{`t=${i + 1}`}</text>
              </g>
            );
          })}

          <text x={11} y={ROW_Y + CELL_H / 2 + 3} className="nrnn-htag" textAnchor="end" dx={-2}>h</text>
        </svg>
      </div>

      <div className="nrnn-foot">
        <div className="nrnn-readouts">
          <div className="nrnn-stat">
            <span className="nrnn-stat-lab">time step</span>
            <span className="nrnn-stat-val">{Math.min(t, STEPS)} <span className="nrnn-stat-max">/ {STEPS}</span></span>
          </div>
          <div className="nrnn-stat nrnn-stat-tok">
            <span className="nrnn-stat-lab">reading token</span>
            <span className="nrnn-stat-val">{t > 0 && t <= STEPS ? `"${TOKENS[t - 1]}"` : '—'}</span>
          </div>
          <div className="nrnn-stat">
            <span className="nrnn-stat-lab">hidden state h</span>
            <span className="nrnn-stat-vec">[{h.map((v) => v.toFixed(2)).join(', ')}]</span>
          </div>
        </div>
        <label className="nrnn-slider">
          <span className="nrnn-slider-lab">
            <span>scrub time</span>
            <span className="nrnn-slider-val">t = {Math.min(t, STEPS)}</span>
          </span>
          <input type="range" min={0} max={STEPS} step={1} value={t}
            onChange={(e) => { setPlaying(false); setT(parseInt(e.target.value, 10)); }} />
        </label>
        <div className="nrnn-note">
          Each cell reuses the same weights — the only thing that changes is the hidden state flowing in
          from the previous step. That recurrence is why one fixed-size network handles a sequence of any length.
        </div>
      </div>
    </div>
  );
}
