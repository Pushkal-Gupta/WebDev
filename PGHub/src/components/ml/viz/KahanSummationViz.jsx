import React, { useMemo, useState } from 'react';
import { RotateCcw, StepForward, FastForward } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 300;
const LEFT_PAD = 50;
const TOP_PAD = 34;
const BOT_PAD = 40;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// mulberry32 deterministic seed
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simulate float32-ish precision loss by rounding to ~7 significant digits.
// Real double sums lose bits the same way; we exaggerate so the gap is visible.
function roundFloat(x, sig = 7) {
  if (x === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(x)));
  const power = sig - d;
  const factor = Math.pow(10, power);
  return Math.round(x * factor) / factor;
}

// One big value followed by many tiny ones — the classic catastrophe.
function buildValues(n, spread) {
  const rand = mulberry32(7 + n * 31 + Math.round(spread * 1000));
  const vals = [];
  const big = Math.pow(10, spread); // first term dominates
  vals.push(big);
  for (let i = 1; i < n; i++) {
    vals.push(0.5 + rand()); // each tiny relative to big
  }
  return vals;
}

export default function KahanSummationViz() {
  const [n, setN] = useState(12);
  const [spread, setSpread] = useState(7); // 10^spread for the big first term
  const [step, setStep] = useState(0);

  const values = useMemo(() => buildValues(n, spread), [n, spread]);

  // Run naive + Kahan up to `step` additions, with simulated precision loss.
  const run = useMemo(() => {
    let naive = 0;
    let kahan = 0;
    let comp = 0; // running compensation term
    const trace = [{ naive: 0, kahan: 0, comp: 0 }];
    for (let i = 0; i < values.length; i++) {
      naive = roundFloat(naive + values[i]);

      const y = roundFloat(values[i] - comp);
      const t = roundFloat(kahan + y);
      comp = roundFloat(roundFloat(t - kahan) - y);
      kahan = t;

      trace.push({ naive, kahan, comp });
    }
    return trace;
  }, [values]);

  const cur = run[Math.min(step, run.length - 1)];
  const partialTrue = useMemo(() => {
    let s = 0;
    for (let i = 0; i < Math.min(step, values.length); i++) s += values[i];
    return s;
  }, [step, values]);

  const naiveErr = Math.abs(cur.naive - partialTrue);
  const kahanErr = Math.abs(cur.kahan - partialTrue);

  // ---- bar layout: error magnitude on a log-ish scale ----
  const plotX = LEFT_PAD;
  const plotY = TOP_PAD;
  const plotW = W - LEFT_PAD * 2;
  const plotH = H - TOP_PAD - BOT_PAD;

  // Map an error to a bar height. Use log scale (errors span orders of magnitude).
  const maxLogErr = 2; // 10^2 caps the visual
  const minLogErr = -8;
  function errToH(err) {
    if (err <= 0) return 1;
    const l = Math.log10(err);
    const clamped = Math.max(minLogErr, Math.min(maxLogErr, l));
    const frac = (clamped - minLogErr) / (maxLogErr - minLogErr);
    return Math.max(2, frac * plotH);
  }

  const naiveBarH = errToH(naiveErr);
  const kahanBarH = errToH(kahanErr);
  const barW = plotW * 0.18;
  const naiveBarX = plotX + plotW * 0.22;
  const kahanBarX = plotX + plotW * 0.6;

  const atEnd = step >= values.length;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '820px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x={plotX}
            y={plotY - 16}
            fontSize="11.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            ABSOLUTE ERROR vs TRUE PARTIAL SUM · step {Math.min(step, values.length)} / {values.length}
          </text>

          {/* log gridlines */}
          {[2, 0, -2, -4, -6, -8].map((g) => {
            const frac = (g - minLogErr) / (maxLogErr - minLogErr);
            const gy = plotY + plotH - frac * plotH;
            return (
              <g key={`g-${g}`}>
                <line
                  x1={plotX}
                  y1={gy}
                  x2={plotX + plotW}
                  y2={gy}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
                <text
                  x={plotX - 6}
                  y={gy + 3}
                  fontSize="11.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  1e{g}
                </text>
              </g>
            );
          })}

          {/* baseline */}
          <line
            x1={plotX}
            y1={plotY + plotH}
            x2={plotX + plotW}
            y2={plotY + plotH}
            stroke="var(--border)"
            strokeWidth="0.8"
          />

          {/* naive bar */}
          <rect
            x={naiveBarX}
            y={plotY + plotH - naiveBarH}
            width={barW}
            height={naiveBarH}
            fill="var(--hard)"
            opacity="0.7"
            rx="3"
          />
          <text
            x={naiveBarX + barW / 2}
            y={plotY + plotH - naiveBarH - 5}
            fontSize="11.5"
            fill="var(--hard)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            fontWeight="700"
          >
            {naiveErr === 0 ? '0' : naiveErr.toExponential(1)}
          </text>
          <text
            x={naiveBarX + barW / 2}
            y={plotY + plotH + 14}
            fontSize="11.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
          >
            naive
          </text>

          {/* kahan bar */}
          <rect
            x={kahanBarX}
            y={plotY + plotH - kahanBarH}
            width={barW}
            height={kahanBarH}
            fill="var(--accent)"
            opacity="0.8"
            rx="3"
          />
          <text
            x={kahanBarX + barW / 2}
            y={plotY + plotH - kahanBarH - 5}
            fontSize="11.5"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            fontWeight="700"
          >
            {kahanErr === 0 ? '0' : kahanErr.toExponential(1)}
          </text>
          <text
            x={kahanBarX + barW / 2}
            y={plotY + plotH + 14}
            fontSize="11.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
          >
            Kahan
          </text>

          {/* current term marker */}
          {step > 0 && step <= values.length && (
            <text
              x={plotX + plotW}
              y={plotY - 16}
              fontSize="11.5"
              fill="var(--text-main)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              + {snap(values[step - 1], 2)}
            </text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">terms</span>
          <input
            type="range"
            min="4"
            max="40"
            step="1"
            value={n}
            onChange={(e) => { setN(parseInt(e.target.value, 10)); setStep(0); }}
          />
          <span className="mlviz-slider-val">{n}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">big term 10^</span>
          <input
            type="range"
            min="3"
            max="9"
            step="1"
            value={spread}
            onChange={(e) => { setSpread(parseInt(e.target.value, 10)); setStep(0); }}
          />
          <span className="mlviz-slider-val">{spread}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">true</span>
            <span className="mlviz-val">{snap(partialTrue, 4)}</span>
            <span className="mlviz-sub">exact partial sum so far</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">naive</span>
            <span className="mlviz-val">{snap(cur.naive, 4)}</span>
            <span className="mlviz-sub">error {naiveErr === 0 ? '0' : naiveErr.toExponential(2)} — low bits dropped</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">Kahan</span>
            <span className="mlviz-val">{snap(cur.kahan, 4)}</span>
            <span className="mlviz-sub">error {kahanErr === 0 ? '0' : kahanErr.toExponential(2)} — comp recovers them</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">comp</span>
            <span className="mlviz-val">{cur.comp === 0 ? '0' : cur.comp.toExponential(2)}</span>
            <span className="mlviz-sub">running compensation term c</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStep((s) => Math.min(values.length, s + 1))}
            disabled={atEnd}
          >
            <StepForward size={13} />
            <span>Add term</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStep(values.length)}
            disabled={atEnd}
          >
            <FastForward size={13} />
            <span>Sum all</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setStep(0); setN(12); setSpread(7); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          a huge first term swamps the running sum · naive addition discards each tiny term&apos;s low bits · Kahan parks them in c and feeds them back
        </div>
      </div>
    </div>
  );
}
