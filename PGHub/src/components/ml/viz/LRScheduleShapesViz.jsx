import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const PAD_L = 48;
const PAD_R = 18;
const PAD_T = 22;
const PAD_B = 40;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

function snap(v, p = 4) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

const SCHEDULES = [
  { key: 'step', label: 'Step decay', color: 'var(--hue-sky)', dash: '' },
  { key: 'exp', label: 'Exponential decay', color: 'var(--hue-violet)', dash: '5 4' },
  { key: 'cosine', label: 'Cosine annealing', color: 'var(--accent)', dash: '' },
  { key: 'warmcos', label: 'Warmup + cosine', color: 'var(--hue-mint)', dash: '2 3' },
];

// LR at fractional progress p in [0,1] for each schedule, normalized to eta0.
function lrAt(key, p, warmupFrac) {
  const TWO_PI_HALF = Math.PI;
  switch (key) {
    case 'step': {
      // four equal plateaus, halved each time
      const stage = Math.min(3, Math.floor(p * 4));
      return Math.pow(0.5, stage);
    }
    case 'exp': {
      // eta0 * gamma^(p*N); pick gamma so end is ~0.05
      const gamma = 0.05;
      return Math.pow(gamma, p);
    }
    case 'cosine': {
      return 0.5 * (1 + Math.cos(TWO_PI_HALF * p));
    }
    case 'warmcos': {
      if (warmupFrac <= 0) {
        return 0.5 * (1 + Math.cos(TWO_PI_HALF * p));
      }
      if (p < warmupFrac) {
        return p / warmupFrac;
      }
      const q = (p - warmupFrac) / (1 - warmupFrac);
      return 0.5 * (1 + Math.cos(TWO_PI_HALF * q));
    }
    default:
      return 1;
  }
}

function pToPx(p) {
  return PAD_L + p * PLOT_W;
}
function lrToPx(v) {
  // v in [0,1] of eta0
  return PAD_T + (1 - v) * PLOT_H;
}

function buildPath(key, warmupFrac, samples = 160) {
  const parts = [];
  for (let i = 0; i <= samples; i++) {
    const p = i / samples;
    const v = lrAt(key, p, warmupFrac);
    parts.push(`${i === 0 ? 'M' : 'L'}${pToPx(p).toFixed(2)},${lrToPx(v).toFixed(2)}`);
  }
  return parts.join(' ');
}

export default function LRScheduleShapesViz() {
  const [totalSteps, setTotalSteps] = useState(1000);
  const [warmupFrac, setWarmupFrac] = useState(0.1);
  const [eta0, setEta0] = useState(0.01);
  const [marker, setMarker] = useState(0.25); // fractional position of the step marker

  const paths = useMemo(
    () => SCHEDULES.map((s) => ({ ...s, d: buildPath(s.key, warmupFrac) })),
    [warmupFrac],
  );

  const markerStep = Math.round(marker * totalSteps);
  const markerValues = useMemo(
    () =>
      SCHEDULES.map((s) => ({
        ...s,
        norm: lrAt(s.key, marker, warmupFrac),
        lr: lrAt(s.key, marker, warmupFrac) * eta0,
      })),
    [marker, warmupFrac, eta0],
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const handleReset = () => {
    setTotalSteps(1000);
    setWarmupFrac(0.1);
    setEta0(0.01);
    setMarker(0.25);
  };

  const mx = pToPx(marker);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg lrss-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* gridlines + y labels */}
          {yTicks.map((g) => (
            <g key={`yt-${g}`}>
              <line
                x1={PAD_L}
                y1={lrToPx(g)}
                x2={W - PAD_R}
                y2={lrToPx(g)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="2 3"
                opacity={g === 0 ? 0.9 : 0.45}
              />
              <text
                x={PAD_L - 8}
                y={lrToPx(g) + 3}
                fontSize="8"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="end"
              >
                {snap(g * eta0, 4)}
              </text>
            </g>
          ))}

          {/* x labels: fraction of run -> step count */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <text
              key={`xt-${p}`}
              x={pToPx(p)}
              y={H - PAD_B + 14}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              {Math.round(p * totalSteps)}
            </text>
          ))}
          <text
            x={PAD_L + PLOT_W / 2}
            y={H - 6}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            step t (total T = {totalSteps})
          </text>
          <text
            x={14}
            y={PAD_T + PLOT_H / 2}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.08em"
            transform={`rotate(-90 14 ${PAD_T + PLOT_H / 2})`}
          >
            learning rate η
          </text>

          {/* warmup shading for warmcos */}
          {warmupFrac > 0 && (
            <rect
              x={PAD_L}
              y={PAD_T}
              width={warmupFrac * PLOT_W}
              height={PLOT_H}
              fill="var(--hue-mint)"
              opacity="0.06"
            />
          )}

          {/* schedule curves */}
          {paths.map((s) => (
            <path
              key={s.key}
              d={s.d}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.dash}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.92"
            />
          ))}

          {/* draggable step marker */}
          <line
            x1={mx}
            y1={PAD_T}
            x2={mx}
            y2={H - PAD_B}
            stroke="var(--text-dim)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.8"
          />
          {markerValues.map((s) => (
            <circle
              key={`mk-${s.key}`}
              cx={mx}
              cy={lrToPx(s.norm)}
              r={3.4}
              fill={s.color}
              stroke="var(--bg)"
              strokeWidth="1.2"
            />
          ))}
          <text
            x={mx}
            y={PAD_T - 6}
            fontSize="8.5"
            fill="var(--text-main)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            fontWeight="700"
          >
            t = {markerStep}
          </text>

          {/* legend */}
          <g transform={`translate(${PAD_L + 6}, ${PAD_T + 4})`}>
            <rect x="-4" y="-4" width="172" height="62" rx="6" fill="var(--surface)" opacity="0.86" stroke="var(--border)" />
            {SCHEDULES.map((s, i) => (
              <g key={`lg-${s.key}`} transform={`translate(0, ${i * 14 + 6})`}>
                <line x1="0" y1="3" x2="18" y2="3" stroke={s.color} strokeWidth="2.2" strokeDasharray={s.dash} />
                <text x="24" y="6" fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono)">
                  {s.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">step marker</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={marker}
            onChange={(e) => setMarker(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{markerStep}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">total steps T</span>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={totalSteps}
            onChange={(e) => setTotalSteps(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{totalSteps}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">warmup frac</span>
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.01"
            value={warmupFrac}
            onChange={(e) => setWarmupFrac(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(warmupFrac, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">initial η₀</span>
          <input
            type="range"
            min="0.001"
            max="0.05"
            step="0.001"
            value={eta0}
            onChange={(e) => setEta0(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(eta0, 3)}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.3rem' }}
        >
          {markerValues.map((s) => (
            <div className="mlviz-row" key={`ro-${s.key}`} style={{ gap: '0.6rem' }}>
              <span className="mlviz-val" style={{ color: s.color, minWidth: '9.5rem' }}>
                {s.label}
              </span>
              <span className="mlviz-val">η = {snap(s.lr, 5)}</span>
              <span className="mlviz-sub">{snap(s.norm * 100, 1)}% of η₀</span>
            </div>
          ))}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          four shapes, one axis · step decay drops in cliffs · cosine lands softly · warmup ramps from zero before decaying · drag the marker to read η at any step
        </div>
      </div>

      <style>{`
        .lrss-svg { aspect-ratio: ${W} / ${H}; max-width: 620px; }
      `}</style>
    </div>
  );
}
