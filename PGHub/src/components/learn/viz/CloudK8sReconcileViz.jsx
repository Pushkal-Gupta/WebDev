import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Boxes, Play, Pause, SkipForward, RotateCcw, Gauge, RefreshCw, Heart } from 'lucide-react';
import './CloudK8sReconcileViz.css';

// A pod slot is a name plus a status. Everything is a fixed script — no
// randomness anywhere, so a given run is fully deterministic.
const r = (name) => ({ name, status: 'running' });
const f = (name) => ({ name, status: 'failed' });
const c = (name) => ({ name, status: 'creating' });

// The whole story: steady -> a pod dies -> drift -> controller acts ->
// healed -> a deliberate scale-up 3->4 -> controller adds -> steady again.
const STEPS = [
  {
    desired: 3, loop: 'steady', title: 'Steady state',
    pods: [r('P1'), r('P2'), r('P3')],
    note: 'Three replicas declared, three healthy. Actual matches desired, so the control loop sits idle.',
  },
  {
    desired: 3, loop: 'observe', title: 'A pod fails',
    pods: [r('P1'), r('P2'), f('P3')],
    note: 'A pod crashes. The controller observes the world and the healthy count drops to 2.',
  },
  {
    desired: 3, loop: 'diff', title: 'Drift detected',
    pods: [r('P1'), r('P2'), f('P3')],
    note: 'Diff: desired 3, actual 2. A gap of +1 means reality no longer matches intent.',
  },
  {
    desired: 3, loop: 'act', title: 'Creating replacement',
    pods: [r('P1'), r('P2'), c('P4')],
    note: 'The controller acts — it schedules a fresh pod onto a healthy node to close the gap.',
  },
  {
    desired: 3, loop: 'steady', title: 'Self-healed',
    pods: [r('P1'), r('P2'), r('P4')],
    note: 'The replacement is Ready. Actual is back to 3 with no human and no script — self-healed.',
  },
  {
    desired: 4, loop: 'diff', title: 'Scale up declared',
    pods: [r('P1'), r('P2'), r('P4')],
    note: 'You edit replicas 3 -> 4. Desired jumps; actual is still 3 — the same kind of gap as a crash.',
  },
  {
    desired: 4, loop: 'act', title: 'Adding a pod',
    pods: [r('P1'), r('P2'), r('P4'), c('P5')],
    note: 'The controller schedules a fourth pod. A scale-up and a repair are the same reconcile action.',
  },
  {
    desired: 4, loop: 'steady', title: 'Scaled, steady',
    pods: [r('P1'), r('P2'), r('P4'), r('P5')],
    note: 'Four pods Ready. Actual matches the new desired count and the loop goes quiet again.',
  },
];

const LOOP_STAGES = [
  { key: 'observe', label: 'observe' },
  { key: 'diff', label: 'diff' },
  { key: 'act', label: 'act' },
];

// Geometry.
const W = 400;
const H = 248;

// Control-loop cycle (left).
const LC_X = 92;
const LC_Y = 128;
const LC_R = 50;
// Three nodes on the ring, clockwise: observe (top), diff (lower-right), act (lower-left).
const NODE = {
  observe: { x: LC_X, y: LC_Y - LC_R },
  diff: { x: LC_X + 43, y: LC_Y + 25 },
  act: { x: LC_X - 43, y: LC_Y + 25 },
};

// Pod slots (right).
const POD_XS = [206, 254, 302, 350];
const POD_TOP = 92;
const POD_W = 40;
const POD_H = 48;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CloudK8sReconcileViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = STEPS.length - 1;
  const safeStep = Math.min(step, total);
  const cur = STEPS[safeStep];

  const actual = useMemo(
    () => cur.pods.filter((p) => p.status === 'running').length,
    [cur],
  );
  const inSync = actual === cur.desired && cur.loop === 'steady';

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 380 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  return (
    <div className="ckr">
      <div className="ckr-head">
        <div className="ckr-head-icon"><Boxes size={18} /></div>
        <div className="ckr-head-text">
          <h3 className="ckr-title">Desired state and the reconcile loop</h3>
          <p className="ckr-sub">
            You declare how many replicas you want; a controller runs observe &rarr; diff &rarr; act
            forever, driving the actual pods toward that number. A crash and a scale-up are the same gap.
          </p>
        </div>
        <button type="button" className="ckr-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="ckr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ckr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ckr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="ckr-arrow-head" />
            </marker>
            <filter id="ckr-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ---- control loop (left) ---- */}
          <text x={LC_X} y={20} className="ckr-section" textAnchor="middle">RECONCILE LOOP</text>
          <circle cx={LC_X} cy={LC_Y} r={LC_R} className="ckr-loop-ring" />

          {/* directional arcs observe -> diff -> act -> observe (clockwise) */}
          <path d={`M${NODE.observe.x} ${NODE.observe.y} A${LC_R} ${LC_R} 0 0 1 ${NODE.diff.x} ${NODE.diff.y}`}
            className="ckr-loop-arc" markerEnd="url(#ckr-arrow)" fill="none" />
          <path d={`M${NODE.diff.x} ${NODE.diff.y} A${LC_R} ${LC_R} 0 0 1 ${NODE.act.x} ${NODE.act.y}`}
            className="ckr-loop-arc" markerEnd="url(#ckr-arrow)" fill="none" />
          <path d={`M${NODE.act.x} ${NODE.act.y} A${LC_R} ${LC_R} 0 0 1 ${NODE.observe.x} ${NODE.observe.y}`}
            className="ckr-loop-arc" markerEnd="url(#ckr-arrow)" fill="none" />

          {LOOP_STAGES.map((s) => {
            const p = NODE[s.key];
            const on = cur.loop === s.key;
            return (
              <g key={s.key} className={`ckr-loop-node is-${s.key}${on ? ' is-on' : ''}`}>
                <circle cx={p.x} cy={p.y} r={17} className="ckr-loop-dot" filter={on ? 'url(#ckr-glow)' : undefined} />
                <text x={p.x} y={p.y + 3.5} className="ckr-loop-label" textAnchor="middle">{s.label}</text>
              </g>
            );
          })}

          {/* ---- pods (right) ---- */}
          <text x={280} y={20} className="ckr-section" textAnchor="middle">MANAGED PODS</text>
          <text x={280} y={38} className="ckr-desired" textAnchor="middle">
            desired = {cur.desired}
          </text>

          {POD_XS.map((cx, i) => {
            const pod = cur.pods[i];
            const left = cx - POD_W / 2;
            if (!pod) {
              return (
                <rect key={`empty-${i}`} x={left} y={POD_TOP} width={POD_W} height={POD_H} rx={9}
                  className="ckr-pod-empty" />
              );
            }
            return (
              <g key={pod.name + i} className={`ckr-pod is-${pod.status}`}>
                <rect x={left} y={POD_TOP} width={POD_W} height={POD_H} rx={9} className="ckr-pod-box"
                  filter={pod.status === 'running' ? 'url(#ckr-glow)' : undefined} />
                <circle cx={cx} cy={POD_TOP + 18} r={6} className="ckr-pod-dot" />
                {pod.status === 'failed' && (
                  <g className="ckr-pod-x">
                    <line x1={cx - 4} y1={POD_TOP + 14} x2={cx + 4} y2={POD_TOP + 22} />
                    <line x1={cx + 4} y1={POD_TOP + 14} x2={cx - 4} y2={POD_TOP + 22} />
                  </g>
                )}
                <text x={cx} y={POD_TOP + 40} className="ckr-pod-name" textAnchor="middle">{pod.name}</text>
              </g>
            );
          })}

          <text x={280} y={POD_TOP + POD_H + 34} className="ckr-actual" textAnchor="middle">
            actual running = {actual}
          </text>
          <text x={280} y={POD_TOP + POD_H + 52}
            className={`ckr-verdict${inSync ? ' is-sync' : ' is-drift'}`} textAnchor="middle">
            {inSync ? 'in sync' : `drift: ${actual} of ${cur.desired}`}
          </text>
        </svg>
      </div>

      <div className="ckr-controls">
        <button type="button" className="ckr-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="ckr-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="ckr-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="ckr-speed-range"
          />
          <span className="ckr-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="ckr-progress">{safeStep} / {total}</span>
      </div>

      <div className="ckr-readout">
        <div className="ckr-stat is-desired">
          <RefreshCw size={14} />
          <span className="ckr-stat-label">desired</span>
          <span className="ckr-stat-val">{cur.desired}</span>
        </div>
        <div className="ckr-stat is-actual">
          <Boxes size={14} />
          <span className="ckr-stat-label">actual</span>
          <span className="ckr-stat-val">{actual}</span>
        </div>
        <div className={`ckr-stat is-status${inSync ? ' is-sync' : ' is-drift'}`}>
          <Heart size={14} />
          <span className="ckr-stat-label">status</span>
          <span className="ckr-stat-val">{inSync ? 'in sync' : 'reconciling'}</span>
        </div>
      </div>

      <div className="ckr-note">
        <span className="ckr-note-label">{cur.title}</span>
        <span className="ckr-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
