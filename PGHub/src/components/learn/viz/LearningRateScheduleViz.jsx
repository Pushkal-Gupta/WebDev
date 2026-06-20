import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, TrendingDown, Activity, Waves } from 'lucide-react';
import './LearningRateScheduleViz.css';

const SCHEDULES = [
  { id: 'step', label: 'step decay', token: 'var(--hue-sky)' },
  { id: 'exp', label: 'exponential', token: 'var(--hue-pink)' },
  { id: 'cosine', label: 'cosine anneal', token: 'var(--hue-violet)' },
  { id: 'warmcos', label: 'warmup+cosine', token: 'var(--hue-mint)' },
];

function lrAt(id, step, totalSteps, baseLR, warmup) {
  const t = Math.max(0, Math.min(totalSteps, step));
  switch (id) {
    case 'step': {
      const period = Math.max(1, Math.floor(totalSteps / 4));
      const drops = Math.floor(t / period);
      return baseLR * 0.5 ** drops;
    }
    case 'exp': {
      const gamma = Math.exp(Math.log(0.05) / Math.max(1, totalSteps));
      return baseLR * gamma ** t;
    }
    case 'cosine': {
      const frac = t / Math.max(1, totalSteps);
      return baseLR * 0.5 * (1 + Math.cos(Math.PI * frac));
    }
    case 'warmcos': {
      const w = Math.max(0, warmup);
      if (t < w) return baseLR * (t / Math.max(1, w));
      const frac = (t - w) / Math.max(1, totalSteps - w);
      return baseLR * 0.5 * (1 + Math.cos(Math.PI * Math.min(1, frac)));
    }
    default:
      return baseLR;
  }
}

function lossDescent(id, totalSteps, baseLR, warmup) {
  const curvature = 2.4;
  let loss = 1.0;
  const pts = [loss];
  for (let s = 0; s < totalSteps; s += 1) {
    const lr = lrAt(id, s, totalSteps, baseLR, warmup);
    const grad = curvature * loss;
    let next = loss - lr * grad;
    if (next < 0) next = Math.abs(next) * 0.6;
    if (next > 1.6) next = 1.6;
    loss = next;
    pts.push(loss);
  }
  return pts;
}

export default function LearningRateScheduleViz() {
  const [active, setActive] = useState({ step: true, exp: true, cosine: true, warmcos: true });
  const [focus, setFocus] = useState('warmcos');
  const [totalSteps, setTotalSteps] = useState(100);
  const [baseLR, setBaseLR] = useState(0.4);
  const [warmup, setWarmup] = useState(15);
  const [curStep, setCurStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const safeWarmup = Math.min(warmup, Math.max(1, totalSteps - 5));

  const model = useMemo(() => {
    const lrCurves = {};
    const lossCurves = {};
    SCHEDULES.forEach(({ id }) => {
      const lr = [];
      for (let s = 0; s <= totalSteps; s += 1) {
        lr.push(lrAt(id, s, totalSteps, baseLR, safeWarmup));
      }
      lrCurves[id] = lr;
      lossCurves[id] = lossDescent(id, totalSteps, baseLR, safeWarmup);
    });
    const maxLoss = Math.max(
      1,
      ...SCHEDULES.flatMap(({ id }) => lossCurves[id]),
    );
    return { lrCurves, lossCurves, maxLoss };
  }, [totalSteps, baseLR, safeWarmup]);

  const isRunning = isRunningRaw && curStep < totalSteps;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setCurStep((s) => Math.min(s + 1, totalSteps));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, curStep, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setCurStep(0);
  };

  const toggleSchedule = (id) => {
    setActive((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  };

  const playLabel = isRunningRaw && curStep < totalSteps ? 'Pause' : (curStep >= totalSteps ? 'Replay' : 'Play');

  const W = 940;
  const H = 420;
  const padL = 56;
  const padR = 24;
  const padT = 28;
  const panelGap = 34;
  const panelH = (H - padT - panelGap - 30) / 2;
  const lrTop = padT;
  const lossTop = padT + panelH + panelGap;
  const plotW = W - padL - padR;

  const baseMax = baseLR * 1.05 || 1;

  const sx = (s) => padL + (s / Math.max(1, totalSteps)) * plotW;
  const lrSy = (v) => lrTop + panelH - (v / baseMax) * panelH;
  const lossSy = (v) => lossTop + panelH - (v / model.maxLoss) * panelH;

  const buildPath = (arr, syFn) => arr
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${syFn(v).toFixed(1)}`)
    .join(' ');

  const focusMeta = SCHEDULES.find((s) => s.id === focus) || SCHEDULES[0];
  const curStepClamped = Math.min(curStep, totalSteps);

  const lrGrid = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ f, v: baseMax * f }));
  const stepTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * totalSteps));

  return (
    <div className="lrs">
      <div className="lrs-head">
        <h3 className="lrs-title">Learning-rate schedules — shape the step size, shape the descent</h3>
        <p className="lrs-sub">
          Each schedule sets the learning rate as a pure function of the training step. Toggle curves, scrub the
          step, and watch a toy loss descend: too-hot constant LR oscillates, cosine and warmup settle smoothly.
        </p>
      </div>

      <div className="lrs-controls">
        <label className="lrs-slider">
          <span className="lrs-input-label">total steps</span>
          <input
            type="range" min={40} max={200} step={10} value={totalSteps}
            onChange={(e) => { setIsRunning(false); setCurStep(0); setTotalSteps(Number(e.target.value)); }}
            className="lrs-range" aria-label="Total training steps"
          />
          <span className="lrs-slider-val">{totalSteps}</span>
        </label>
        <label className="lrs-slider">
          <span className="lrs-input-label">base LR</span>
          <input
            type="range" min={0.05} max={0.8} step={0.05} value={baseLR}
            onChange={(e) => { setIsRunning(false); setCurStep(0); setBaseLR(Number(e.target.value)); }}
            className="lrs-range" aria-label="Base learning rate"
          />
          <span className="lrs-slider-val">{baseLR.toFixed(2)}</span>
        </label>
        <label className="lrs-slider">
          <span className="lrs-input-label">warmup steps</span>
          <input
            type="range" min={0} max={50} step={1} value={warmup}
            onChange={(e) => { setIsRunning(false); setCurStep(0); setWarmup(Number(e.target.value)); }}
            className="lrs-range" aria-label="Warmup steps"
          />
          <span className="lrs-slider-val">{safeWarmup}</span>
        </label>
        <label className="lrs-slider">
          <span className="lrs-input-label">current step</span>
          <input
            type="range" min={0} max={totalSteps} step={1} value={curStepClamped}
            onChange={(e) => { setIsRunning(false); setCurStep(Number(e.target.value)); }}
            className="lrs-range" aria-label="Current step scrubber"
          />
          <span className="lrs-slider-val">{curStepClamped}</span>
        </label>
        <label className="lrs-slider">
          <span className="lrs-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="lrs-range" aria-label="Playback speed"
          />
          <span className="lrs-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="lrs-spacer" aria-hidden="true" />

        <div className="lrs-buttons">
          <button
            type="button"
            className="lrs-btn lrs-btn-primary"
            onClick={() => {
              if (curStep >= totalSteps) setCurStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && curStep < totalSteps ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="lrs-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="lrs-toggles">
        {SCHEDULES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`lrs-toggle ${active[s.id] ? 'is-on' : ''} ${focus === s.id ? 'is-focus' : ''}`}
            style={{ '--lrs-c': s.token }}
            onClick={() => { toggleSchedule(s.id); if (!active[s.id]) setFocus(s.id); }}
            onMouseEnter={() => active[s.id] && setFocus(s.id)}
          >
            <span className="lrs-toggle-swatch" />
            {s.label}
          </button>
        ))}
        <span className="lrs-focus-note">
          loss panel tracks: <strong style={{ color: focusMeta.token }}>{focusMeta.label}</strong>
        </span>
      </div>

      <div className="lrs-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lrs-svg" preserveAspectRatio="xMidYMid meet">
          {/* LR panel */}
          <text className="lrs-panel-title" x={padL} y={lrTop - 10}>
            <tspan className="lrs-panel-icon">●</tspan> learning rate vs step
          </text>
          {lrGrid.map((g) => (
            <g key={`lrg-${g.f}`}>
              <line className="lrs-grid" x1={padL} y1={lrSy(g.v)} x2={W - padR} y2={lrSy(g.v)} />
              <text className="lrs-axis-y" x={padL - 8} y={lrSy(g.v) + 3}>{g.v.toFixed(2)}</text>
            </g>
          ))}
          <line className="lrs-axis" x1={padL} y1={lrTop} x2={padL} y2={lrTop + panelH} />
          <line className="lrs-axis" x1={padL} y1={lrTop + panelH} x2={W - padR} y2={lrTop + panelH} />

          {SCHEDULES.map((s) => active[s.id] && (
            <path
              key={`lrp-${s.id}`}
              className={`lrs-curve ${focus === s.id ? 'is-focus' : ''}`}
              style={{ stroke: s.token }}
              d={buildPath(model.lrCurves[s.id], lrSy)}
            />
          ))}

          {/* loss panel */}
          <text className="lrs-panel-title" x={padL} y={lossTop - 10}>
            <tspan className="lrs-panel-icon" style={{ fill: focusMeta.token }}>●</tspan>
            {' '}toy loss descent · {focusMeta.label}
          </text>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={`lossg-${f}`}>
              <line
                className="lrs-grid"
                x1={padL}
                y1={lossTop + panelH - f * panelH}
                x2={W - padR}
                y2={lossTop + panelH - f * panelH}
              />
              <text className="lrs-axis-y" x={padL - 8} y={lossTop + panelH - f * panelH + 3}>
                {(model.maxLoss * f).toFixed(2)}
              </text>
            </g>
          ))}
          <line className="lrs-axis" x1={padL} y1={lossTop} x2={padL} y2={lossTop + panelH} />
          <line className="lrs-axis" x1={padL} y1={lossTop + panelH} x2={W - padR} y2={lossTop + panelH} />

          <path
            className="lrs-loss-curve"
            style={{ stroke: focusMeta.token }}
            d={buildPath(model.lossCurves[focus], lossSy)}
          />

          {/* x axis ticks */}
          {stepTicks.map((t, i) => (
            <text key={`xt-${i}`} className="lrs-axis-x" x={sx(t)} y={lossTop + panelH + 18}>{t}</text>
          ))}
          <text className="lrs-axis-x-label" x={(padL + W - padR) / 2} y={H - 4}>training step</text>

          {/* current-step scrubber line spanning both panels */}
          <line
            className="lrs-scrub"
            x1={sx(curStepClamped)}
            y1={lrTop - 2}
            x2={sx(curStepClamped)}
            y2={lossTop + panelH}
          />
          {SCHEDULES.map((s) => active[s.id] && (
            <circle
              key={`dot-${s.id}`}
              className={`lrs-dot ${focus === s.id ? 'is-focus' : ''}`}
              style={{ fill: s.token }}
              cx={sx(curStepClamped)}
              cy={lrSy(model.lrCurves[s.id][curStepClamped])}
              r={focus === s.id ? 5 : 3.5}
            />
          ))}
          <circle
            className="lrs-loss-dot"
            style={{ fill: focusMeta.token }}
            cx={sx(curStepClamped)}
            cy={lossSy(model.lossCurves[focus][curStepClamped])}
            r={5}
          />
        </svg>
      </div>

      <div className="lrs-metrics">
        <div className="lrs-metric">
          <span className="lrs-metric-label">current step</span>
          <span className="lrs-metric-value is-hi">{curStepClamped} / {totalSteps}</span>
        </div>
        {SCHEDULES.map((s) => active[s.id] && (
          <div key={`m-${s.id}`} className={`lrs-metric ${focus === s.id ? 'is-focus' : ''}`}>
            <span className="lrs-metric-label" style={{ color: s.token }}>{s.label} LR</span>
            <span className="lrs-metric-value" style={{ color: s.token }}>
              {model.lrCurves[s.id][curStepClamped].toFixed(3)}
            </span>
          </div>
        ))}
        <div className="lrs-metric">
          <span className="lrs-metric-label">focus loss</span>
          <span className="lrs-metric-value">{model.lossCurves[focus][curStepClamped].toFixed(3)}</span>
        </div>
      </div>

      <div className="lrs-narration">
        <span className="lrs-narration-label">read</span>
        <span className="lrs-narration-body">
          {(() => {
            const lr = model.lrCurves[focus][curStepClamped];
            const inWarmup = focus === 'warmcos' && curStepClamped < safeWarmup;
            if (inWarmup) {
              return `Warmup phase: LR ramps linearly from 0 toward base. At step ${curStepClamped} it is ${lr.toFixed(3)} — small enough that the descent stays stable while the optimizer finds its footing.`;
            }
            if (baseLR > 0.55) {
              return `Base LR ${baseLR.toFixed(2)} is hot. Early steps take large jumps — watch the ${focusMeta.label} loss curve bounce before the schedule cools it to ${lr.toFixed(3)} at step ${curStepClamped} and the descent settles.`;
            }
            return `At step ${curStepClamped}, ${focusMeta.label} sets LR ${lr.toFixed(3)}. The step size is the gradient multiplier — a shrinking LR means smaller, steadier moves toward the loss floor.`;
          })()}
        </span>
      </div>
    </div>
  );
}
