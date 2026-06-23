import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './CanaryDeploymentViz.css';

const STAGES = [1, 10, 50, 100];

// Per-phase observed metrics. control stays steady; canary diverges only in the
// regression scenario, and only once it carries enough traffic to be noticed.
const HEALTHY = {
  1: { canaryErr: 0.4, controlErr: 0.5, canaryP99: 120, controlP99: 118 },
  10: { canaryErr: 0.5, controlErr: 0.5, canaryP99: 122, controlP99: 119 },
  50: { canaryErr: 0.5, controlErr: 0.6, canaryP99: 121, controlP99: 120 },
  100: { canaryErr: 0.5, controlErr: 0.5, canaryP99: 120, controlP99: 120 },
};
const REGRESSION = {
  1: { canaryErr: 0.6, controlErr: 0.5, canaryP99: 130, controlP99: 119 },
  10: { canaryErr: 0.9, controlErr: 0.5, canaryP99: 160, controlP99: 120 },
  50: { canaryErr: 3.8, controlErr: 0.5, canaryP99: 410, controlP99: 121 },
  100: { canaryErr: 3.8, controlErr: 0.5, canaryP99: 410, controlP99: 121 },
};

// error breach: canary error > control * 1.5 + 1.0 (pct points)
function isBreach(m) {
  return m.canaryErr > m.controlErr * 1.5 + 1.0 || m.canaryP99 > m.controlP99 * 1.5;
}

function buildFrames(mode) {
  const table = mode === 'regression' ? REGRESSION : HEALTHY;
  const frames = [];

  const snap = (extra) => ({
    mode,
    phaseIdx: 0,
    canaryPct: 0,
    metrics: null,
    decision: '',       // '', PROMOTE, HOLD, ROLLBACK
    halted: false,
    note: '',
    ...extra,
  });

  frames.push(snap({
    canaryPct: 0,
    note: 'Phase 0 — before. 100% of traffic flows to the OLD (stable) pool. The new build is deployed to a separate canary pool but receives no live traffic yet.',
  }));

  for (let i = 0; i < STAGES.length; i += 1) {
    const pct = STAGES[i];
    const m = table[pct];

    frames.push(snap({
      phaseIdx: i,
      canaryPct: pct,
      metrics: null,
      decision: 'SPLIT',
      note: `Shift the load balancer: ${pct}% of requests now route to the canary pool, ${100 - pct}% stays on the old pool. Same user pinned to the same pool by id-hash.`,
    }));

    frames.push(snap({
      phaseIdx: i,
      canaryPct: pct,
      metrics: m,
      decision: 'OBSERVE',
      note: `Observe at ${pct}%. Canary error ${m.canaryErr.toFixed(1)}% vs control ${m.controlErr.toFixed(1)}%; canary p99 ${m.canaryP99}ms vs control ${m.controlP99}ms. The analyzer compares canary against control measured at the SAME time — not a historical baseline.`,
    }));

    if (isBreach(m)) {
      frames.push(snap({
        phaseIdx: i,
        canaryPct: pct,
        metrics: m,
        decision: 'ROLLBACK',
        halted: true,
        note: `Regression detected at ${pct}%: canary error ${m.canaryErr.toFixed(1)}% breaches control ${m.controlErr.toFixed(1)}% (and p99 is ${m.canaryP99}ms). Halt the rollout and route ALL traffic back to the old pool. Blast radius capped at ${pct}% of users.`,
      }));
      frames.push(snap({
        phaseIdx: i,
        canaryPct: 0,
        metrics: m,
        decision: 'ROLLBACK',
        halted: true,
        note: 'Rolled back. The old pool serves 100% again; the bad build is drained. The bug only ever touched a small slice — that small blast radius is the entire point of a canary.',
      }));
      return frames;
    }

    const last = i === STAGES.length - 1;
    frames.push(snap({
      phaseIdx: i,
      canaryPct: pct,
      metrics: m,
      decision: 'PROMOTE',
      note: last
        ? `Healthy at ${pct}%. The canary now carries all traffic. Drain and remove the old pool — the new build is fully promoted.`
        : `Healthy at ${pct}% — canary metrics track control. Promote to the next step (${STAGES[i + 1]}%) and bake again to catch slow-burn issues.`,
    }));
  }

  frames.push(snap({
    phaseIdx: STAGES.length - 1,
    canaryPct: 100,
    metrics: table[100],
    decision: 'PROMOTE',
    note: 'Done. Metric-gated promotion walked 1% → 10% → 50% → 100% with a bake at each step. No regression ever surfaced, so the canary became the new stable pool.',
  }));

  return frames;
}

const RUN_DELAY_MS = 1300;

// deterministic dot offsets so the stream looks alive without Math.random
function mulberry32(a) {
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CanaryDeploymentViz() {
  const [mode, setMode] = useState('healthy');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchMode = (id) => {
    if (id === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 430;

  const lbX = 40;
  const lbY = 175;
  const lbW = 160;
  const lbH = 80;

  const splitX = 250;
  const splitY = 90;
  const splitW = 150;
  const splitH = 250;

  const oldX = 470;
  const oldY = 80;
  const poolW = 200;
  const poolH = 120;

  const canX = 470;
  const canY = 250;

  const canaryPct = current.canaryPct;
  const oldPct = 100 - canaryPct;

  // dot stream: assign each dot to canary or old by its index ratio
  const rng = useMemo(() => mulberry32(1337), []);
  const dots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 16; i += 1) {
      arr.push({ t: rng(), lane: rng() });
    }
    return arr;
  }, [rng]);

  const decisionClass = current.decision === 'ROLLBACK'
    ? 'is-rollback'
    : current.decision === 'PROMOTE'
      ? 'is-promote'
      : current.decision === 'OBSERVE'
        ? 'is-observe'
        : current.decision === 'HOLD'
          ? 'is-hold'
          : '';

  const m = current.metrics;
  const breachNow = m ? isBreach(m) : false;

  // split-bar geometry (vertical fill of the split box: canary share on top hue, old below)
  const canaryH = (splitH - 16) * (canaryPct / 100);

  return (
    <div className="cdv">
      <div className="cdv-head">
        <h3 className="cdv-title">Canary deployment — ramp, observe, promote or roll back</h3>
        <p className="cdv-sub">
          Pick a scenario, then step a rollout through 1% → 10% → 50% → 100%. At each step the analyzer
          compares the canary pool against the stable control and decides to promote, hold, or halt + roll back.
        </p>
      </div>

      <div className="cdv-controls">
        <div className="cdv-modes" role="tablist" aria-label="Rollout scenario">
          <button
            type="button"
            className={`cdv-mode ${mode === 'healthy' ? 'is-on' : ''}`}
            onClick={() => switchMode('healthy')}
            aria-pressed={mode === 'healthy'}
          >
            HEALTHY ROLLOUT
          </button>
          <button
            type="button"
            className={`cdv-mode ${mode === 'regression' ? 'is-on' : ''}`}
            onClick={() => switchMode('regression')}
            aria-pressed={mode === 'regression'}
          >
            REGRESSION AT 50%
          </button>
        </div>

        <label className="cdv-speed">
          <span className="cdv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cdv-speed-range"
            aria-label="Playback speed"
          />
          <span className="cdv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cdv-spacer" aria-hidden="true" />

        <div className="cdv-buttons">
          <button
            type="button"
            className="cdv-btn cdv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="cdv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cdv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cdv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cdv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cdv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cdv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="cdv-arrowhead" />
            </marker>
            <linearGradient id="cdv-canary-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-pink)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="cdv-old-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--hue-mint)" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* incoming traffic + LB */}
          <text className="cdv-flow-label" x={lbX + lbW / 2} y={lbY - 14}>incoming traffic</text>
          <rect className="cdv-box is-lb" x={lbX} y={lbY} width={lbW} height={lbH} rx={9} />
          <text className="cdv-box-title" x={lbX + lbW / 2} y={lbY + 32}>Load balancer</text>
          <text className="cdv-box-sub" x={lbX + lbW / 2} y={lbY + 54}>weighted split</text>

          {/* animated request dots travelling LB -> split */}
          {dots.map((d, i) => {
            const goesCanary = d.lane < canaryPct / 100;
            const x = lbX + lbW + ((d.t + step * 0.13) % 1) * (splitX - (lbX + lbW));
            const y = lbY + lbH / 2 + (d.lane - 0.5) * 30;
            return (
              <circle
                key={`dot-${i}`}
                className={`cdv-dot ${goesCanary ? 'is-canary' : 'is-old'}`}
                cx={x}
                cy={y}
                r={3.4}
              />
            );
          })}
          <line className="cdv-flow is-on" x1={lbX + lbW} y1={lbY + lbH / 2} x2={splitX} y2={splitY + splitH / 2} markerEnd="url(#cdv-arrow)" />

          {/* split bar: vertical fill, canary share on top */}
          <rect className="cdv-box is-split" x={splitX} y={splitY} width={splitW} height={splitH} rx={9} />
          <text className="cdv-box-title" x={splitX + splitW / 2} y={splitY + 24}>Traffic split</text>
          <rect className="cdv-split-track" x={splitX + 18} y={splitY + 40} width={splitW - 36} height={splitH - 56} rx={6} />
          {canaryPct > 0 && (
            <rect
              className="cdv-split-canary"
              x={splitX + 18}
              y={splitY + 40}
              width={splitW - 36}
              height={Math.max(0, canaryH)}
              rx={6}
            />
          )}
          <text className="cdv-split-pct is-canary" x={splitX + splitW / 2} y={splitY + 40 + Math.max(16, canaryH / 2)}>
            {canaryPct > 0 ? `${canaryPct}% canary` : ''}
          </text>
          <text className="cdv-split-pct is-old" x={splitX + splitW / 2} y={splitY + splitH - 22}>
            {oldPct}% old
          </text>

          {/* arrows to pools */}
          <line
            className={`cdv-flow ${oldPct > 0 ? 'is-on' : ''}`}
            x1={splitX + splitW}
            y1={splitY + splitH - 50}
            x2={oldX}
            y2={oldY + poolH / 2}
            markerEnd="url(#cdv-arrow)"
          />
          <line
            className={`cdv-flow cdv-flow-canary ${canaryPct > 0 ? 'is-on' : ''}`}
            x1={splitX + splitW}
            y1={splitY + 60}
            x2={canX}
            y2={canY + poolH / 2}
            markerEnd="url(#cdv-arrow-canary)"
          />
          <defs>
            <marker id="cdv-arrow-canary" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="cdv-arrowhead-canary" />
            </marker>
          </defs>

          {/* OLD pool */}
          <rect className="cdv-pool is-old" x={oldX} y={oldY} width={poolW} height={poolH} rx={10} />
          <rect x={oldX} y={oldY} width={6} height={poolH} rx={3} className="cdv-pool-stripe is-old" />
          <text className="cdv-pool-title" x={oldX + 22} y={oldY + 26} textAnchor="start">OLD pool · stable</text>
          <text className="cdv-pool-sub" x={oldX + 22} y={oldY + 46} textAnchor="start">v1 · {oldPct}% traffic</text>
          {[0, 1, 2].map((p) => (
            <rect key={`oldpod-${p}`} className="cdv-pod is-old" x={oldX + 22 + p * 44} y={oldY + 64} width={36} height={36} rx={6} />
          ))}
          <text className="cdv-pool-metric" x={oldX + poolW - 14} y={oldY + 26} textAnchor="end">
            err {m ? m.controlErr.toFixed(1) : '—'}%
          </text>

          {/* CANARY pool */}
          <rect className={`cdv-pool is-canary ${breachNow ? 'is-bad' : ''}`} x={canX} y={canY} width={poolW} height={poolH} rx={10} />
          <rect x={canX} y={canY} width={6} height={poolH} rx={3} className={`cdv-pool-stripe is-canary ${breachNow ? 'is-bad' : ''}`} />
          <text className="cdv-pool-title" x={canX + 22} y={canY + 26} textAnchor="start">CANARY pool · new build</text>
          <text className="cdv-pool-sub" x={canX + 22} y={canY + 46} textAnchor="start">v2 · {canaryPct}% traffic</text>
          <rect className={`cdv-pod is-canary ${breachNow ? 'is-bad' : ''}`} x={canX + 22} y={canY + 64} width={36} height={36} rx={6} />
          <text className={`cdv-pool-metric ${breachNow ? 'is-bad' : ''}`} x={canX + poolW - 14} y={canY + 26} textAnchor="end">
            err {m ? m.canaryErr.toFixed(1) : '—'}%
          </text>

          {/* decision badge */}
          <g transform={`translate(${oldX + poolW + 30}, 175)`}>
            <rect className={`cdv-decision ${decisionClass}`} x={0} y={0} width={150} height={86} rx={10} />
            <text className="cdv-decision-label" x={75} y={26}>decision</text>
            <text className={`cdv-decision-value ${decisionClass}`} x={75} y={56}>
              {current.decision || '—'}
            </text>
            <text className="cdv-decision-sub" x={75} y={76}>
              {current.halted ? 'rollout halted' : `step at ${canaryPct}%`}
            </text>
          </g>
        </svg>
      </div>

      <div className="cdv-metrics">
        <div className="cdv-metric">
          <span className="cdv-metric-label">traffic to canary</span>
          <span className="cdv-metric-value is-canary">{canaryPct}%</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">canary error</span>
          <span className={`cdv-metric-value ${breachNow ? 'is-bad' : 'is-canary'}`}>{m ? `${m.canaryErr.toFixed(1)}%` : '—'}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">control error</span>
          <span className="cdv-metric-value is-old">{m ? `${m.controlErr.toFixed(1)}%` : '—'}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">canary p99</span>
          <span className={`cdv-metric-value ${m && m.canaryP99 > m.controlP99 * 1.5 ? 'is-bad' : 'is-canary'}`}>{m ? `${m.canaryP99}ms` : '—'}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">decision</span>
          <span className={`cdv-metric-value ${decisionClass}`}>{current.decision || '—'}</span>
        </div>
      </div>

      <div className="cdv-narration">
        <span className="cdv-narration-label">trace</span>
        <span className="cdv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
