import React, { useState, useEffect, useRef } from 'react';
import { Boxes, Play, Pause, SkipForward, RotateCcw, Gauge, CircleCheck, CircleSlash } from 'lucide-react';
import './FpMaybeViz.css';

// Deterministic Maybe/Option chain. A value flows through three fallible steps.
// 'some' mode succeeds end to end; 'none' mode fails mid-chain and short-circuits.
const MODES = {
  some: {
    label: 'Some',
    tag: 'x = 4',
    input: '4',
    ops: [
      { label: 'requireNonNeg', rule: 'x >= 0', state: 'some', val: '4' },
      { label: 'reciprocal', rule: '1 / x', state: 'some', val: '0.25' },
      { label: 'sqrt', rule: 'sqrt x', state: 'some', val: '0.5' },
    ],
    result: { state: 'some', val: '0.5' },
  },
  none: {
    label: 'None',
    tag: 'x = 0',
    input: '0',
    ops: [
      { label: 'requireNonNeg', rule: 'x >= 0', state: 'some', val: '0' },
      { label: 'reciprocal', rule: '1 / x', state: 'none', val: 'None' },
      { label: 'sqrt', rule: 'sqrt x', state: 'skip', val: 'None' },
    ],
    result: { state: 'none', val: 'None' },
  },
};
const MODE_ORDER = ['some', 'none'];

const W = 440;
const H = 468;
const BOX_W = 250;
const BOX_H = 52;
const BOX_X = (W - BOX_W) / 2;
const Y_INPUT = 22;
const Y_OPS = [104, 206, 308];
const Y_RESULT = 404;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FpMaybeViz() {
  const [mode, setMode] = useState('some');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const M = MODES[mode];
  const total = 3; // op0, op1, op2, result

  function selectMode(m) {
    setMode(m); setStep(0); setPlaying(false);
  }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 500 : 1050) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  // carry label on the edge entering box index i (0..3, where 3 = result).
  const carryInto = (i) => {
    if (i === 0) return `Some ${M.input}`;
    const prev = M.ops[i - 1];
    return prev.state === 'some' ? `Some ${prev.val}` : 'None';
  };

  const opStatus = (i) => {
    if (step < i) return 'pending';
    return M.ops[i].state; // some | none | skip
  };
  const resultStatus = step < total ? 'pending' : M.result.state;

  const failedAt = M.ops.findIndex((o) => o.state === 'none');
  const note = (() => {
    if (step < 3) {
      const o = M.ops[step];
      if (o.state === 'some') return `${o.label} succeeds: it returns Some ${o.val}, so the value keeps flowing down the chain.`;
      if (o.state === 'none') return `${o.label} fails (${o.rule} is undefined here): it returns None. Every step below is skipped — the chain short-circuits.`;
      return `${o.label} never runs: a None arrived from above, so it is skipped and None passes straight through.`;
    }
    return M.result.state === 'some'
      ? `Every step returned Some, so the final result is Some ${M.result.val} — one unwrap at the end, no null checks in between.`
      : `A None from step ${failedAt + 1} propagated untouched to the end: the result is None. No exception, no crash — failure is just a value.`;
  })();

  return (
    <div className="fpmb">
      <div className="fpmb-head">
        <div className="fpmb-head-icon"><Boxes size={18} /></div>
        <div className="fpmb-head-text">
          <h3 className="fpmb-title">Maybe: a value that might not be there</h3>
          <p className="fpmb-sub">
            A value flows through three steps that can each fail. Some carries the value forward;
            the first None short-circuits every step below it.
          </p>
        </div>
        <button type="button" className="fpmb-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="fpmb-modes">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={`fpmb-mode-btn fpmb-mode-${m}${mode === m ? ' is-on' : ''}`}
            onClick={() => selectMode(m)}
          >
            <span className="fpmb-mode-label">{MODES[m].label} path</span>
            <span className="fpmb-mode-tag">{MODES[m].tag}</span>
          </button>
        ))}
      </div>

      <div className="fpmb-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fpmb-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="fpmb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="fpmb-arrow-head" />
            </marker>
            <marker id="fpmb-arrow-none" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="fpmb-arrow-head-none" />
            </marker>
          </defs>

          {/* edges: input->op0->op1->op2->result */}
          {[0, 1, 2, 3].map((i) => {
            const yTop = i === 0 ? Y_INPUT + BOX_H : Y_OPS[i - 1] + BOX_H;
            const yBot = i === 3 ? Y_RESULT : Y_OPS[i];
            const carry = carryInto(i);
            const isNone = carry === 'None';
            const revealed = step >= i - 1; // edge entering box i shows once box i-1 evaluated
            return (
              <g key={`edge-${i}`} className={`fpmb-edgegrp ${revealed ? 'is-on' : 'is-off'} ${isNone ? 'is-none' : 'is-some'}`}>
                <line
                  x1={W / 2} y1={yTop} x2={W / 2} y2={yBot - 4}
                  className="fpmb-edge"
                  markerEnd={isNone ? 'url(#fpmb-arrow-none)' : 'url(#fpmb-arrow)'}
                />
                <text x={W / 2 + 12} y={(yTop + yBot) / 2 + 4} className="fpmb-carry" textAnchor="start">{carry}</text>
              </g>
            );
          })}

          {/* input chip */}
          <g className="fpmb-node is-input">
            <rect x={BOX_X + 55} y={Y_INPUT} width={BOX_W - 110} height={BOX_H} rx={26} className="fpmb-node-box" />
            <text x={W / 2} y={Y_INPUT + 32} className="fpmb-node-title" textAnchor="middle">input {M.input}</text>
          </g>

          {/* op boxes */}
          {M.ops.map((o, i) => {
            const st = opStatus(i);
            return (
              <g key={`op-${i}`} className={`fpmb-node is-op is-${st} ${step === i ? 'is-active' : ''}`}>
                <rect x={BOX_X} y={Y_OPS[i]} width={BOX_W} height={BOX_H} rx={11} className="fpmb-node-box" />
                <text x={BOX_X + 16} y={Y_OPS[i] + 22} className="fpmb-node-title" textAnchor="start">{o.label}</text>
                <text x={BOX_X + 16} y={Y_OPS[i] + 40} className="fpmb-node-rule" textAnchor="start">{o.rule}</text>
                <text x={BOX_X + BOX_W - 16} y={Y_OPS[i] + 33} className="fpmb-node-out" textAnchor="end">
                  {st === 'pending' ? '·' : st === 'some' ? `Some ${o.val}` : st === 'none' ? 'None' : 'skipped'}
                </text>
              </g>
            );
          })}

          {/* result */}
          <g className={`fpmb-node is-result is-${resultStatus}`}>
            <rect x={BOX_X + 40} y={Y_RESULT} width={BOX_W - 80} height={BOX_H - 8} rx={11} className="fpmb-node-box" />
            <text x={W / 2} y={Y_RESULT + 29} className="fpmb-node-title" textAnchor="middle">
              {resultStatus === 'pending' ? 'result …' : resultStatus === 'some' ? `Some ${M.result.val}` : 'None'}
            </text>
          </g>
        </svg>
      </div>

      <div className="fpmb-controls">
        <button type="button" className="fpmb-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="fpmb-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="fpmb-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="fpmb-speed-range"
          />
          <span className="fpmb-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="fpmb-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="fpmb-readout">
        <div className="fpmb-stat is-some">
          <CircleCheck size={15} />
          <span className="fpmb-stat-label">Some carries</span>
          <span className="fpmb-stat-val">value forward</span>
        </div>
        <div className="fpmb-stat is-none">
          <CircleSlash size={15} />
          <span className="fpmb-stat-label">None</span>
          <span className="fpmb-stat-val">short-circuits</span>
        </div>
        <div className="fpmb-stat is-out">
          <span className="fpmb-stat-label">result</span>
          <span className="fpmb-stat-val">{resultStatus === 'pending' ? '…' : resultStatus === 'some' ? `Some ${M.result.val}` : 'None'}</span>
        </div>
      </div>

      <div className="fpmb-note">
        <span className="fpmb-note-label">now</span>
        <span className="fpmb-note-body">{note}</span>
      </div>
    </div>
  );
}
