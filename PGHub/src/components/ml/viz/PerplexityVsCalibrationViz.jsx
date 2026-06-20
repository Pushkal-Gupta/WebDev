import React, { useMemo, useState } from 'react';
import { Sliders, TrendingDown, Gauge } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 340;
const PAD_L = 56;
const PAD_R = 56;
const PAD_T = 30;
const PAD_B = 52;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const MAX_STEPS = 1000;
const N_TRACE = 80;
const SEED = 4242;

const PPL_MAX = 220;
const PPL_MIN = 14;
const ECE_MAX = 0.32;
const ECE_MIN = 0.02;

function mulberry32(a) {
  let s = a >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function perplexityAt(step, rng) {
  // PPL drops sharply (exponential decay), with a little training noise
  const t = step / MAX_STEPS;
  const base = PPL_MIN + (PPL_MAX - PPL_MIN) * Math.exp(-4.2 * t);
  const noise = (rng() - 0.5) * 4 * Math.max(0.15, 1 - t);
  return Math.max(PPL_MIN - 1, base + noise);
}

function eceAt(step, rng) {
  // ECE drops slowly — sublinear decay, plus drift back upward late
  const t = step / MAX_STEPS;
  // sublinear early progress
  const decay = ECE_MIN + (ECE_MAX - ECE_MIN) * Math.pow(1 - t, 0.55);
  // late-training overconfidence drift
  const drift = t > 0.6 ? (t - 0.6) * 0.05 : 0;
  const noise = (rng() - 0.5) * 0.008;
  return Math.max(0.005, decay + drift + noise);
}

function xToStep(i, n) {
  return Math.round((i / (n - 1)) * MAX_STEPS);
}

function stepToX(step) {
  return PAD_L + (step / MAX_STEPS) * PLOT_W;
}

function pplToY(ppl) {
  const t = (ppl - PPL_MIN) / (PPL_MAX - PPL_MIN);
  return PAD_T + (1 - t) * PLOT_H;
}

function eceToY(ece) {
  const t = (ece - 0) / (ECE_MAX - 0);
  return PAD_T + (1 - t) * PLOT_H;
}

export default function PerplexityVsCalibrationViz() {
  const [step, setStep] = useState(420);

  const trace = useMemo(() => {
    const r = mulberry32(SEED);
    const out = [];
    for (let i = 0; i < N_TRACE; i++) {
      const s = xToStep(i, N_TRACE);
      out.push({
        step: s,
        ppl: perplexityAt(s, r),
        ece: eceAt(s, r),
      });
    }
    return out;
  }, []);

  const pplPath = useMemo(() => {
    return trace
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${stepToX(p.step).toFixed(1)} ${pplToY(p.ppl).toFixed(1)}`)
      .join(' ');
  }, [trace]);

  const ecePath = useMemo(() => {
    return trace
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${stepToX(p.step).toFixed(1)} ${eceToY(p.ece).toFixed(1)}`)
      .join(' ');
  }, [trace]);

  const live = useMemo(() => {
    // smooth interpolation between the two surrounding trace points
    const tFrac = step / MAX_STEPS;
    const fIdx = tFrac * (N_TRACE - 1);
    const lo = Math.floor(fIdx);
    const hi = Math.min(N_TRACE - 1, lo + 1);
    const frac = fIdx - lo;
    const ppl = trace[lo].ppl * (1 - frac) + trace[hi].ppl * frac;
    const ece = trace[lo].ece * (1 - frac) + trace[hi].ece * frac;
    return { ppl, ece };
  }, [step, trace]);

  // gridlines + ticks
  const stepTicks = [0, 250, 500, 750, 1000];
  const pplTicks = [PPL_MIN, 50, 100, 150, PPL_MAX];
  const eceTicks = [0, 0.08, 0.16, 0.24, ECE_MAX];

  const cursorX = stepToX(step);
  const pplCursorY = pplToY(live.ppl);
  const eceCursorY = eceToY(live.ece);

  // qualitative regime tag
  const regime = step < 150
    ? 'early'
    : step < 600
      ? 'mid (PPL collapsing)'
      : 'late (ECE drifting up)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            rx="6"
            opacity="0.6"
          />

          {/* gridlines */}
          {stepTicks.map((s) => (
            <line
              key={`gx-${s}`}
              x1={stepToX(s)}
              y1={PAD_T}
              x2={stepToX(s)}
              y2={PAD_T + PLOT_H}
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          {pplTicks.map((p) => (
            <line
              key={`gy-${p}`}
              x1={PAD_L}
              y1={pplToY(p)}
              x2={PAD_L + PLOT_W}
              y2={pplToY(p)}
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}

          {/* ECE axis labels (right) */}
          {eceTicks.map((e) => (
            <text
              key={`ey-${e}`}
              x={PAD_L + PLOT_W + 8}
              y={eceToY(e) + 3}
              fontSize="9"
              fill="var(--hue-pink)"
              fontFamily="var(--mono)"
              textAnchor="start"
            >
              {e.toFixed(2)}
            </text>
          ))}

          {/* PPL axis labels (left) */}
          {pplTicks.map((p) => (
            <text
              key={`py-${p}`}
              x={PAD_L - 8}
              y={pplToY(p) + 3}
              fontSize="9"
              fill="var(--hue-sky)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {p}
            </text>
          ))}

          {/* step tick labels */}
          {stepTicks.map((s) => (
            <text
              key={`sx-${s}`}
              x={stepToX(s)}
              y={PAD_T + PLOT_H + 14}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              {s}
            </text>
          ))}

          {/* axis titles */}
          <text
            x={PAD_L - 38}
            y={PAD_T - 14}
            fontSize="10"
            fill="var(--hue-sky)"
            fontFamily="var(--mono)"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            PPL
          </text>
          <text
            x={PAD_L + PLOT_W + 8}
            y={PAD_T - 14}
            fontSize="10"
            fill="var(--hue-pink)"
            fontFamily="var(--mono)"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            ECE
          </text>
          <text
            x={PAD_L + PLOT_W / 2}
            y={PAD_T + PLOT_H + 32}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            training steps
          </text>

          {/* PPL curve */}
          <path d={pplPath} fill="none" stroke="var(--hue-sky)" strokeWidth="1.8" opacity="0.9" />
          {/* ECE curve */}
          <path d={ecePath} fill="none" stroke="var(--hue-pink)" strokeWidth="1.8" opacity="0.9" strokeDasharray="4 3" />

          {/* live cursor */}
          <line
            x1={cursorX}
            y1={PAD_T}
            x2={cursorX}
            y2={PAD_T + PLOT_H}
            stroke="var(--accent)"
            strokeWidth="1"
            opacity="0.65"
            strokeDasharray="3 3"
          />

          {/* live PPL marker */}
          <circle cx={cursorX} cy={pplCursorY} r="5" fill="var(--hue-sky)" stroke="var(--bg)" strokeWidth="1.5" />
          {/* live ECE marker */}
          <circle cx={cursorX} cy={eceCursorY} r="5" fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth="1.5" />

          {/* regime annotation */}
          <text
            x={PAD_L + 10}
            y={PAD_T + 16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            PPL crashes; ECE limps down then drifts upward
          </text>

          {/* legend */}
          <g transform={`translate(${PAD_L + PLOT_W - 168}, ${PAD_T + 6})`}>
            <rect x="0" y="0" width="160" height="38" rx="6" fill="var(--surface)" stroke="var(--border)" opacity="0.85" />
            <line x1="10" y1="14" x2="34" y2="14" stroke="var(--hue-sky)" strokeWidth="2" />
            <text x="40" y="18" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono)">perplexity (lower=better)</text>
            <line x1="10" y1="28" x2="34" y2="28" stroke="var(--hue-pink)" strokeWidth="2" strokeDasharray="4 3" />
            <text x="40" y="32" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono)">ECE (calibration gap)</text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              training step
            </span>
            <input
              type="range"
              min="0"
              max={MAX_STEPS}
              step="10"
              value={step}
              onChange={(e) => setStep(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{step}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <TrendingDown size={11} style={{ color: 'var(--hue-sky)', alignSelf: 'center' }} />
            <span className="mlviz-tag">PPL</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{live.ppl.toFixed(1)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Gauge size={11} style={{ color: 'var(--hue-pink)', alignSelf: 'center' }} />
            <span className="mlviz-tag">ECE</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{live.ece.toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="mlviz-tag">regime</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{regime}</span>
          </span>
        </div>

        <div className="mlviz-hint">
          drag the slider — PPL plummets while ECE lags, then drifts back up: the model gets sharper but more over-confident
        </div>
      </div>
    </div>
  );
}
