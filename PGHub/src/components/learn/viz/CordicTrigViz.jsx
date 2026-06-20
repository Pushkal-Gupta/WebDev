import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './CordicTrigViz.css';

function cordicGain(n) {
  let k = 1;
  for (let i = 0; i < n; i += 1) {
    k *= 1 / Math.sqrt(1 + Math.pow(2, -2 * i));
  }
  return k;
}

function buildFrames(targetRad, n) {
  const frames = [];
  const k = cordicGain(n);
  let x = k;
  let y = 0;
  let angle = 0;

  const snap = (extra) => ({
    iter: 0,
    sigma: 0,
    micro: 0,
    angle,
    x,
    y,
    fromX: x,
    fromY: y,
    note: '',
    phase: 'run',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Start with the unit vector prescaled by the CORDIC gain K = ${k.toFixed(6)} so the tip lands on the unit circle after convergence. Vector at angle 0: (${x.toFixed(4)}, ${y.toFixed(4)}). Target = ${(targetRad * 180 / Math.PI).toFixed(2)}°.`,
  }));

  for (let i = 0; i < n; i += 1) {
    const micro = Math.atan(Math.pow(2, -i));
    const sigma = angle < targetRad ? 1 : -1;
    const fromX = x;
    const fromY = y;
    const factor = Math.pow(2, -i);
    const nx = x - sigma * y * factor;
    const ny = y + sigma * x * factor;
    x = nx;
    y = ny;
    angle += sigma * micro;
    frames.push(snap({
      phase: i === n - 1 ? 'done' : 'rotate',
      iter: i,
      sigma,
      micro,
      x,
      y,
      angle,
      fromX,
      fromY,
      note: `Iter ${i}: accumulated angle ${sigma === 1 ? 'below' : 'above'} target → σ = ${sigma > 0 ? '+1' : '-1'} (${sigma > 0 ? 'counter-clockwise' : 'clockwise'}). Rotate by ${sigma > 0 ? '+' : '-'}atan(2^-${i}) = ${(sigma * micro * 180 / Math.PI).toFixed(4)}°. Shift-add: x' = x - σ·y·2^-${i}, y' = y + σ·x·2^-${i}. New vector (${x.toFixed(4)}, ${y.toFixed(4)}), angle ${(angle * 180 / Math.PI).toFixed(4)}°.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1000;

export default function CordicTrigViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [targetDeg, setTargetDeg] = useState(60);
  const [iterN, setIterN] = useState(10);
  const runTimer = useRef(null);

  const targetRad = (targetDeg * Math.PI) / 180;
  const frames = useMemo(() => buildFrames(targetRad, iterN), [targetRad, iterN]);
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
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

  const W = 760;
  const H = 420;
  const cx = 215;
  const cy = H / 2;
  const R = 150;
  const sx = (v) => cx + v * R;
  const sy = (v) => cy - v * R;

  const trueCos = Math.cos(targetRad);
  const trueSin = Math.sin(targetRad);
  const errCos = Math.abs(current.x - trueCos);
  const errSin = Math.abs(current.y - trueSin);
  const remaining = (totalSteps - 1) - safeStep;

  const tipX = sx(current.x);
  const tipY = sy(current.y);
  const headLen = 12;
  const ang = Math.atan2(current.y, current.x);
  const ah1x = tipX - headLen * Math.cos(ang - 0.4);
  const ah1y = tipY + headLen * Math.sin(ang - 0.4);
  const ah2x = tipX - headLen * Math.cos(ang + 0.4);
  const ah2y = tipY + headLen * Math.sin(ang + 0.4);

  const rayX = sx(Math.cos(targetRad));
  const rayY = sy(Math.sin(targetRad));

  const trail = frames.slice(0, safeStep + 1).map((f) => `${sx(f.x)},${sy(f.y)}`).join(' ');

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="cdv">
      <div className="cdv-head">
        <h3 className="cdv-title">CORDIC — sin and cos by shift-and-add rotations</h3>
        <p className="cdv-sub">
          The vector starts at angle 0, prescaled by the CORDIC gain. Each step rotates by ±atan(2^-i) toward the
          target ray using only shifts and adds; the converged tip's coordinates are cos and sin of the target.
        </p>
      </div>

      <div className="cdv-controls">
        <label className="cdv-field">
          <span className="cdv-input-label">target {targetDeg}°</span>
          <input
            type="range"
            min={-90}
            max={90}
            step={1}
            value={targetDeg}
            onChange={(e) => { setTargetDeg(Number(e.target.value)); reset(); }}
            className="cdv-range"
            aria-label="Target angle in degrees"
          />
        </label>

        <label className="cdv-field">
          <span className="cdv-input-label">iterations {iterN}</span>
          <input
            type="range"
            min={1}
            max={14}
            step={1}
            value={iterN}
            onChange={(e) => { setIterN(Number(e.target.value)); reset(); }}
            className="cdv-range"
            aria-label="Iteration count"
          />
        </label>

        <label className="cdv-field">
          <span className="cdv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cdv-range cdv-range-narrow"
            aria-label="Playback speed"
          />
          <span className="cdv-speed-value">{speed.toFixed(1)}×</span>
        </label>

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
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cdv-svg" preserveAspectRatio="xMidYMid meet">
          {Array.from({ length: 9 }, (_, i) => {
            const t = -1 + i * 0.25;
            return (
              <g key={`grid-${i}`}>
                <line x1={sx(t)} y1={sy(-1)} x2={sx(t)} y2={sy(1)} stroke="var(--border)" strokeWidth={0.6} opacity={0.35} />
                <line x1={sx(-1)} y1={sy(t)} x2={sx(1)} y2={sy(t)} stroke="var(--border)" strokeWidth={0.6} opacity={0.35} />
              </g>
            );
          })}

          <line x1={sx(-1.08)} y1={sy(0)} x2={sx(1.08)} y2={sy(0)} stroke="var(--text-dim)" strokeWidth={1} />
          <line x1={sx(0)} y1={sy(-1.08)} x2={sx(0)} y2={sy(1.08)} stroke="var(--text-dim)" strokeWidth={1} />
          <text x={sx(1.08) + 4} y={sy(0) + 4} className="cdv-axis-label">x</text>
          <text x={sx(0) - 4} y={sy(1.08) - 4} className="cdv-axis-label" textAnchor="end">y</text>

          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--accent)" strokeWidth={1.2} opacity={0.5} />

          <line x1={cx} y1={cy} x2={rayX} y2={rayY} stroke="var(--hue-pink)" strokeWidth={2} strokeDasharray="6 4" />
          <circle cx={rayX} cy={rayY} r={4} fill="var(--hue-pink)" />

          {safeStep > 0 && (
            <polyline points={trail} fill="none" stroke="var(--hue-mint)" strokeWidth={1.5} opacity={0.7} strokeLinejoin="round" />
          )}

          {current.phase === 'rotate' && (
            <line x1={cx} y1={cy} x2={sx(current.fromX)} y2={sy(current.fromY)} stroke="var(--hue-sky)" strokeWidth={1.5} opacity={0.55} strokeDasharray="3 3" />
          )}

          <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke="var(--accent)" strokeWidth={2.6} />
          <polygon points={`${tipX},${tipY} ${ah1x},${ah1y} ${ah2x},${ah2y}`} fill="var(--accent)" />
          <circle cx={tipX} cy={tipY} r={5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.5} />

          <g className="cdv-panel">
            <text x={W - 250} y={48} className="cdv-panel-title">readout</text>
            <text x={W - 250} y={76} className="cdv-panel-row">cos≈ {current.x.toFixed(6)}</text>
            <text x={W - 250} y={98} className="cdv-panel-row">true {trueCos.toFixed(6)}</text>
            <text x={W - 250} y={120} className="cdv-panel-err">err {errCos.toExponential(2)}</text>
            <text x={W - 250} y={158} className="cdv-panel-row">sin≈ {current.y.toFixed(6)}</text>
            <text x={W - 250} y={180} className="cdv-panel-row">true {trueSin.toFixed(6)}</text>
            <text x={W - 250} y={202} className="cdv-panel-err">err {errSin.toExponential(2)}</text>
            <text x={W - 250} y={240} className="cdv-panel-row">angle {(current.angle * 180 / Math.PI).toFixed(4)}°</text>
            <text x={W - 250} y={262} className="cdv-panel-row">target {targetDeg}.0000°</text>
            <text x={W - 250} y={284} className="cdv-panel-row">left {remaining} iter</text>
          </g>
        </svg>
      </div>

      <div className="cdv-metrics">
        <div className="cdv-metric">
          <span className="cdv-metric-label">phase</span>
          <span className="cdv-metric-value">{current.phase}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">sigma</span>
          <span className="cdv-metric-value">{current.phase === 'init' ? '—' : (current.sigma > 0 ? '+1' : '-1')}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">micro angle</span>
          <span className="cdv-metric-value">{current.phase === 'init' ? '—' : `${(current.micro * 180 / Math.PI).toFixed(4)}°`}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">accum angle</span>
          <span className="cdv-metric-value">{(current.angle * 180 / Math.PI).toFixed(4)}°</span>
        </div>
        <div className="cdv-metric cdv-metric-dim">
          <span className="cdv-metric-label">cos error</span>
          <span className="cdv-metric-value cdv-metric-dimval">{errCos.toExponential(2)}</span>
        </div>
        <div className="cdv-metric cdv-metric-dim">
          <span className="cdv-metric-label">sin error</span>
          <span className="cdv-metric-value cdv-metric-dimval">{errSin.toExponential(2)}</span>
        </div>
      </div>

      <div className="cdv-narration">
        <span className="cdv-narration-label">trace</span>
        <span className="cdv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
