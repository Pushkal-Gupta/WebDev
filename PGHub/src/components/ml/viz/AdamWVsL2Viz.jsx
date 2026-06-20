import React, { useMemo, useState } from 'react';
import { RotateCcw, Play, Pause, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const PAD = 44;
const PANEL_W = (W - PAD * 2 - 24) / 2;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// quadratic loss with very different per-coordinate scale + uneven update freq.
// x-coord: large, frequently-updated gradient.  y-coord: tiny, rarely updated.
const A = 4.0; // x curvature (steep, big gradient)
const B = 0.04; // y curvature (shallow, tiny gradient)

function grad(x, y) {
  return [A * x, B * y];
}

// run one full trajectory for a given mode ('l2' or 'adamw')
function runTrajectory(mode, steps) {
  const eta = 0.04;
  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;
  const lambda = 0.25; // weight-decay / L2 strength
  let x = 3.6;
  let y = 3.2;
  let mx = 0;
  let my = 0;
  let vx = 0;
  let vy = 0;
  const path = [[x, y]];
  for (let t = 1; t <= steps; t++) {
    let [gx, gy] = grad(x, y);
    if (mode === 'l2') {
      // L2: decay folded INTO the gradient, then run through the adaptive scaler
      gx += lambda * x;
      gy += lambda * y;
    }
    mx = beta1 * mx + (1 - beta1) * gx;
    my = beta1 * my + (1 - beta1) * gy;
    vx = beta2 * vx + (1 - beta2) * gx * gx;
    vy = beta2 * vy + (1 - beta2) * gy * gy;
    const mhx = mx / (1 - Math.pow(beta1, t));
    const mhy = my / (1 - Math.pow(beta1, t));
    const vhx = vx / (1 - Math.pow(beta2, t));
    const vhy = vy / (1 - Math.pow(beta2, t));
    x -= eta * (mhx / (Math.sqrt(vhx) + eps));
    y -= eta * (mhy / (Math.sqrt(vhy) + eps));
    if (mode === 'adamw') {
      // AdamW: decay applied DIRECTLY to weights, uniform, outside the scaler
      x -= eta * lambda * x;
      y -= eta * lambda * y;
    }
    path.push([x, y]);
  }
  return path;
}

const STEPS = 90;

export default function AdamWVsL2Viz() {
  const [step, setStep] = useState(STEPS);
  const [playing, setPlaying] = useState(false);

  const l2Path = useMemo(() => runTrajectory('l2', STEPS), []);
  const adamwPath = useMemo(() => runTrajectory('adamw', STEPS), []);

  React.useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 60);
    return () => clearInterval(id);
  }, [playing]);

  // world -> screen mappers per panel
  const XMIN = -0.6;
  const XMAX = 4.0;
  const YMIN = -0.6;
  const YMAX = 4.0;

  function makeMap(x0) {
    const top = PAD;
    const h = H - PAD - 54;
    return {
      sx: (wx) => x0 + ((wx - XMIN) / (XMAX - XMIN)) * PANEL_W,
      sy: (wy) => top + h - ((wy - YMIN) / (YMAX - YMIN)) * h,
      top,
      h,
    };
  }

  const leftX0 = PAD;
  const rightX0 = PAD + PANEL_W + 24;
  const mL = makeMap(leftX0);
  const mR = makeMap(rightX0);

  const l2Cur = l2Path[step];
  const adamwCur = adamwPath[step];

  const l2Norm = Math.hypot(l2Cur[0], l2Cur[1]);
  const adamwNorm = Math.hypot(adamwCur[0], adamwCur[1]);

  function renderPanel(map, x0, path, cur, color, title) {
    const pts = path.slice(0, step + 1);
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${map.sx(p[0])} ${map.sy(p[1])}`).join(' ');
    return (
      <g>
        <text
          x={x0}
          y={map.top - 16}
          fontSize="9"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          letterSpacing="0.1em"
        >
          {title}
        </text>
        {/* frame */}
        <rect
          x={x0}
          y={map.top}
          width={PANEL_W}
          height={map.h}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.8"
          rx="3"
        />
        {/* origin crosshair (the minimum / decay target) */}
        <line
          x1={map.sx(0)}
          y1={map.top}
          x2={map.sx(0)}
          y2={map.top + map.h}
          stroke="var(--border)"
          strokeWidth="0.4"
          strokeDasharray="2 3"
          opacity="0.6"
        />
        <line
          x1={x0}
          y1={map.sy(0)}
          x2={x0 + PANEL_W}
          y2={map.sy(0)}
          stroke="var(--border)"
          strokeWidth="0.4"
          strokeDasharray="2 3"
          opacity="0.6"
        />
        <circle cx={map.sx(0)} cy={map.sy(0)} r="3" fill="var(--mint, var(--hue-mint))" opacity="0.9" />
        <text
          x={map.sx(0) + 6}
          y={map.sy(0) + 12}
          fontSize="6.5"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
        >
          w = 0
        </text>
        {/* path */}
        <path d={d} fill="none" stroke={color} strokeWidth="1.6" opacity="0.85" />
        {/* current point */}
        <circle cx={map.sx(cur[0])} cy={map.sy(cur[1])} r="4" fill={color} />
        <text
          x={x0 + 6}
          y={map.top + map.h - 8}
          fontSize="7"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
        >
          x rapid · y rare
        </text>
      </g>
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          {renderPanel(mL, leftX0, l2Path, l2Cur, 'var(--hue-pink)', 'ADAM + L2  ·  decay folded into gradient')}
          {renderPanel(mR, rightX0, adamwPath, adamwCur, 'var(--accent)', 'ADAMW  ·  decoupled weight decay')}
          <line
            x1={PAD}
            y1={H - 16}
            x2={W - PAD}
            y2={H - 16}
            stroke="var(--border)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">step</span>
          <input
            type="range"
            min="0"
            max={STEPS}
            step="1"
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{step}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">Adam+L2</span>
            <span className="mlviz-val">
              w = ({snap(l2Cur[0], 2)}, {snap(l2Cur[1], 2)}) · ‖w‖ = {snap(l2Norm, 3)}
            </span>
            <span className="mlviz-sub">y barely shrinks — its decay was divided by tiny √v</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">AdamW</span>
            <span className="mlviz-val">
              w = ({snap(adamwCur[0], 2)}, {snap(adamwCur[1], 2)}) · ‖w‖ = {snap(adamwNorm, 3)}
            </span>
            <span className="mlviz-sub">both coords decay at the same rate ηλ</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">Δ‖w‖</span>
            <span className="mlviz-val">
              AdamW keeps the rarely-updated coord {snap(l2Norm - adamwNorm, 3)} smaller in norm
            </span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStep((s) => Math.min(STEPS, s + 1))}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setStep(STEPS); setPlaying(false); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          L2 decay rides through the 1/√v scaler — the rarely-updated coord has tiny v, so its decay is
          amplified inconsistently · AdamW subtracts ηλw directly, decaying every weight evenly
        </div>
      </div>
    </div>
  );
}
