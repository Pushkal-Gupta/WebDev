import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Boxes, Database, Zap, Play, Pause, SkipForward, RotateCcw, Gauge, Check } from 'lucide-react';
import './TestMockingViz.css';

// Test-double swap viz. Deterministic; no randomness anywhere.
// The same unit-under-test talks to a real slow dependency, or to a fast
// in-memory double swapped in at the injection seam.

const W = 460;
const H = 430;

// Node geometry (single vertical column: unit -> seam -> dependency).
const UNIT = { x: 140, y: 36, w: 180, h: 60 };
const SEAM = { x: 150, y: 176, w: 160, h: 46 };
const DEP = { x: 130, y: 300, w: 200, h: 70 };
const TRUNK_X = 230;

// One entry per phase. Token Y position + per-mode elapsed cost (ms).
const PHASES = [
  { key: 'idle', y: UNIT.y + UNIT.h, realMs: 0, dblMs: 0 },
  { key: 'call', y: SEAM.y, realMs: 8, dblMs: 0.1 },
  { key: 'arrive', y: DEP.y, realMs: 3, dblMs: 0.05 },
  { key: 'work', y: DEP.y + 34, realMs: 180, dblMs: 0.2 },
  { key: 'return', y: SEAM.y, realMs: 9, dblMs: 0.1 },
  { key: 'done', y: UNIT.y + UNIT.h, realMs: 0, dblMs: 0 },
];

const MODES = {
  real: {
    label: 'Real dependency',
    tag: 'slow · flaky',
    depTitle: 'Postgres',
    depSub: 'network + disk round trip',
    isolated: false,
  },
  double: {
    label: 'Test double',
    tag: 'fast · isolated',
    depTitle: 'InMemoryRepo',
    depSub: 'in-memory · deterministic',
    isolated: true,
  },
};

const MODE_ORDER = ['real', 'double'];

function stepText(phaseKey, mode) {
  switch (phaseKey) {
    case 'idle': return 'checkout() is about to call the injected dependency.';
    case 'call': return 'The call crosses the injection seam downward.';
    case 'arrive': return 'The request reaches the dependency.';
    case 'work':
      return mode === 'real'
        ? 'Postgres does a network + disk round trip — slow and flaky.'
        : 'InMemoryRepo answers instantly from memory — fast and isolated.';
    case 'return': return 'The response travels back up through the seam.';
    case 'done': return 'checkout() returns; the test assertion runs.';
    default: return '';
  }
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fmtMs(ms) {
  if (ms >= 1) return `${ms.toFixed(0)} ms`;
  return `${ms.toFixed(2)} ms`;
}

export default function TestMockingViz() {
  const [mode, setMode] = useState('real');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = PHASES.length - 1;
  const current = PHASES[Math.min(step, total)];

  const elapsed = useMemo(() => {
    let sum = 0;
    for (let i = 0; i <= Math.min(step, total); i += 1) {
      sum += mode === 'real' ? PHASES[i].realMs : PHASES[i].dblMs;
    }
    return sum;
  }, [step, total, mode]);

  function selectMode(m) {
    setMode(m);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 380 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const isWork = current.key === 'work';
  const tokenMoving = current.key !== 'idle' && current.key !== 'done';
  const modeCls = mode === 'real' ? 'is-real' : 'is-double';

  const cxUnit = UNIT.x + UNIT.w / 2;
  const cxSeam = SEAM.x + SEAM.w / 2;
  const cxDep = DEP.x + DEP.w / 2;

  return (
    <div className={`tmk ${modeCls}`}>
      <div className="tmk-head">
        <div className="tmk-head-icon"><Boxes size={18} /></div>
        <div className="tmk-head-text">
          <h3 className="tmk-title">Swapping a dependency at the injection seam</h3>
          <p className="tmk-sub">
            The unit under test talks to a real, slow dependency &mdash; or to a fast in-memory
            double plugged in at the same seam. Watch the elapsed time collapse.
          </p>
        </div>
        <button type="button" className="tmk-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="tmk-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tmk-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tmk-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="tmk-arrow-head" />
            </marker>
            <filter id="tmk-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* trunk edges */}
          <line x1={cxUnit} y1={UNIT.y + UNIT.h} x2={TRUNK_X} y2={SEAM.y} className="tmk-edge" markerEnd="url(#tmk-arrow)" />
          <line x1={cxSeam} y1={SEAM.y + SEAM.h} x2={TRUNK_X} y2={DEP.y} className="tmk-edge" markerEnd="url(#tmk-arrow)" />

          {/* unit under test */}
          <g className="tmk-node tmk-unit">
            <rect x={UNIT.x} y={UNIT.y} width={UNIT.w} height={UNIT.h} rx={11} className="tmk-node-box" />
            <text x={cxUnit} y={UNIT.y + 26} className="tmk-node-label" textAnchor="middle">OrderService.checkout()</text>
            <text x={cxUnit} y={UNIT.y + 44} className="tmk-node-sub" textAnchor="middle">unit under test</text>
          </g>

          {/* injection seam: socket with two plug prongs */}
          <g className="tmk-node tmk-seam">
            <rect x={SEAM.x} y={SEAM.y} width={SEAM.w} height={SEAM.h} rx={9} className="tmk-seam-box" />
            <line x1={cxSeam - 26} y1={SEAM.y} x2={cxSeam - 26} y2={SEAM.y - 12} className="tmk-prong" />
            <line x1={cxSeam + 26} y1={SEAM.y} x2={cxSeam + 26} y2={SEAM.y - 12} className="tmk-prong" />
            <text x={cxSeam} y={SEAM.y + 20} className="tmk-seam-label" textAnchor="middle">injection seam</text>
            <text x={cxSeam} y={SEAM.y + 36} className="tmk-seam-sub" textAnchor="middle">repo passed in from outside</text>
          </g>

          {/* dependency (swapped by mode) */}
          <g className={`tmk-node tmk-dep ${modeCls}${isWork ? ' is-working' : ''}`}>
            <rect x={DEP.x} y={DEP.y} width={DEP.w} height={DEP.h} rx={11} className="tmk-node-box" />
            <text x={cxDep} y={DEP.y + 28} className="tmk-node-label" textAnchor="middle">{MODES[mode].depTitle}</text>
            <text x={cxDep} y={DEP.y + 47} className="tmk-node-sub" textAnchor="middle">{MODES[mode].depSub}</text>
          </g>

          {/* request token */}
          <g
            className={`tmk-token-g ${modeCls}${tokenMoving ? ' is-live' : ''}`}
            style={{ transform: `translate(${TRUNK_X}px, ${current.y}px)` }}
          >
            <circle r={isWork ? 9 : 7} className="tmk-token" filter="url(#tmk-glow)" />
          </g>
        </svg>
      </div>

      <div className="tmk-modes">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={`tmk-mode-btn tmk-mode-${m}${mode === m ? ' is-on' : ''}`}
            onClick={() => selectMode(m)}
          >
            <span className="tmk-mode-ic">{m === 'real' ? <Database size={15} /> : <Zap size={15} />}</span>
            <span className="tmk-mode-txt">
              <span className="tmk-mode-label">{MODES[m].label}</span>
              <span className="tmk-mode-tag">{MODES[m].tag}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="tmk-controls">
        <button type="button" className="tmk-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="tmk-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="tmk-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="tmk-speed-range"
          />
          <span className="tmk-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="tmk-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="tmk-readout">
        <div className="tmk-stat is-mode">
          <span className="tmk-stat-label">mode</span>
          <span className="tmk-stat-val">{MODES[mode].label}</span>
        </div>
        <div className={`tmk-stat is-elapsed ${modeCls}`}>
          <span className="tmk-stat-label">elapsed</span>
          <span className="tmk-stat-val">{fmtMs(elapsed)}</span>
        </div>
        <div className={`tmk-stat is-iso ${MODES[mode].isolated ? 'is-yes' : 'is-no'}`}>
          <span className="tmk-stat-label">isolated?</span>
          <span className="tmk-stat-val">
            {MODES[mode].isolated ? <Check size={14} /> : null}
            {MODES[mode].isolated ? 'yes' : 'no'}
          </span>
        </div>
      </div>

      <div className="tmk-note">
        <span className="tmk-note-label">now</span>
        <span className="tmk-note-body">{stepText(current.key, mode)}</span>
      </div>
    </div>
  );
}
