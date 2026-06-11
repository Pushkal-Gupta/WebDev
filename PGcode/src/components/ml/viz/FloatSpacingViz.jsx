import React, { useMemo, useState } from 'react';
import { Activity, Zap } from 'lucide-react';
import './MLViz.css';

/*
 * Float spacing visualizer.
 *
 * fp32: 23-bit mantissa  -> ulp(x) ≈ 2^(floor(log2|x|) - 23)
 * fp64: 52-bit mantissa  -> ulp(x) ≈ 2^(floor(log2|x|) - 52)
 *
 * Plot is a log-x axis from 10^-10 to 10^10 with tick marks placed at every
 * binade (powers of two). Each tick is colored by gap size (warm = large,
 * cool = small). A slider selects |x| in log space; we report the gap at
 * that x (its ULP) and the gap relative to x.
 */

const W = 720;
const H = 240;
const PAD_L = 44;
const PAD_R = 28;
const PAD_T = 22;
const PAD_B = 56;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const LOG_MIN = -10;
const LOG_MAX = 10;

const TICK_BASELINE_Y = PAD_T + PLOT_H * 0.78;

function logXToPx(logX) {
  return PAD_L + ((logX - LOG_MIN) / (LOG_MAX - LOG_MIN)) * PLOT_W;
}

function fmtSci(v, digits = 3) {
  if (!Number.isFinite(v)) return '∞';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e-3 && abs < 1e4) {
    return Number(v.toPrecision(digits)).toString();
  }
  return v.toExponential(digits - 1);
}

// Given a precision spec (mantissa bit count), compute ulp(x) for x > 0.
function ulp(x, mantissaBits) {
  if (x <= 0 || !Number.isFinite(x)) return NaN;
  const e = Math.floor(Math.log2(x));
  return Math.pow(2, e - mantissaBits);
}

// Snap x to nearest representable value at given mantissa width. We work
// inside a binade [2^e, 2^(e+1)), scale to integer mantissa, round, scale back.
function nearestRepresentable(x, mantissaBits) {
  if (x <= 0 || !Number.isFinite(x)) return x;
  const e = Math.floor(Math.log2(x));
  const base = Math.pow(2, e);
  const step = Math.pow(2, e - mantissaBits);
  // fractional position inside the binade, in units of step
  const k = Math.round((x - base) / step);
  return base + k * step;
}

// Map a normalized "warmth" in [0,1] (1 = warmest = largest gap) to a stop color.
// We interpolate between three site palette hues so the user gets a clear
// cool->warm read.
function gapColor(t) {
  if (t <= 0) return 'var(--hue-sky, #5ecbff)';
  if (t >= 1) return 'var(--hue-pink, #ff66cc)';
  if (t < 0.5) {
    const a = t / 0.5;
    return `color-mix(in oklab, var(--hue-sky, #5ecbff) ${Math.round((1 - a) * 100)}%, var(--hue-mint, #6ee0a8) ${Math.round(a * 100)}%)`;
  }
  const a = (t - 0.5) / 0.5;
  return `color-mix(in oklab, var(--hue-mint, #6ee0a8) ${Math.round((1 - a) * 100)}%, var(--hue-pink, #ff66cc) ${Math.round(a * 100)}%)`;
}

const PRECISIONS = {
  fp32: { label: 'fp32', mantissa: 23, exp: 8, eps: 1.1920929e-7 },
  fp64: { label: 'fp64', mantissa: 52, exp: 11, eps: 2.220446049250313e-16 },
};

const MAJOR_DECADES = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];

export default function FloatSpacingViz() {
  const [precision, setPrecision] = useState('fp32');
  const [logX, setLogX] = useState(0); // log10 of |x|, default x = 1

  const prec = PRECISIONS[precision];

  // Pre-compute binade ticks: each power of two from 2^-34 to 2^34.
  // Color each by log2(ulp(2^e)) mapped to [0,1] across our display range.
  const ticks = useMemo(() => {
    const out = [];
    const eMin = Math.floor(LOG_MIN * Math.log2(10)) - 1;
    const eMax = Math.ceil(LOG_MAX * Math.log2(10)) + 1;
    // The smallest and largest gap (in log space) across the visible window.
    // ulp(2^e) = 2^(e - mantissaBits) => log10(ulp) = (e - mantissa) * log10(2)
    const log10Ulp = (e) => (e - prec.mantissa) * Math.log10(2);
    const minLog = log10Ulp(eMin);
    const maxLog = log10Ulp(eMax);
    for (let e = eMin; e <= eMax; e++) {
      const v = Math.pow(2, e);
      const lx = Math.log10(v);
      if (lx < LOG_MIN - 0.5 || lx > LOG_MAX + 0.5) continue;
      const t = (log10Ulp(e) - minLog) / (maxLog - minLog);
      out.push({
        e,
        v,
        lx,
        px: logXToPx(lx),
        color: gapColor(t),
        warmth: t,
      });
    }
    return out;
  }, [prec.mantissa]);

  const x = useMemo(() => Math.pow(10, logX), [logX]);
  const snapped = useMemo(() => nearestRepresentable(x, prec.mantissa), [x, prec.mantissa]);
  const u = useMemo(() => ulp(snapped, prec.mantissa), [snapped, prec.mantissa]);
  const next = snapped + u;
  const prev = snapped - u;
  const relGap = u / x;

  const cursorPx = logXToPx(logX);

  // Mini "zoom strip" — show 9 representable values around current snapped x.
  const zoomStrip = useMemo(() => {
    const items = [];
    for (let k = -4; k <= 4; k++) {
      items.push({ k, v: snapped + k * u });
    }
    return items;
  }, [snapped, u]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" role="img" aria-label="Floating-point spacing across log scale">
          <defs>
            <linearGradient id="fsv-axis-glow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky, #5ecbff)" stopOpacity="0.25" />
              <stop offset="50%" stopColor="var(--hue-mint, #6ee0a8)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--hue-pink, #ff66cc)" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* warm/cool background band so the gradient story reads even on slow screens */}
          <rect
            x={PAD_L}
            y={TICK_BASELINE_Y - 32}
            width={PLOT_W}
            height={64}
            fill="url(#fsv-axis-glow)"
            opacity="0.55"
            rx="3"
          />

          {/* main axis */}
          <line
            x1={PAD_L}
            y1={TICK_BASELINE_Y}
            x2={W - PAD_R}
            y2={TICK_BASELINE_Y}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* binade tick marks (powers of two) */}
          {ticks.map((t) => {
            const tall = t.e % 4 === 0;
            const h = tall ? 26 : 14;
            return (
              <line
                key={`tk${t.e}`}
                x1={t.px}
                y1={TICK_BASELINE_Y - h / 2}
                x2={t.px}
                y2={TICK_BASELINE_Y + h / 2}
                stroke={t.color}
                strokeWidth={tall ? 1.4 : 0.9}
                opacity={tall ? 0.95 : 0.75}
              />
            );
          })}

          {/* major decade labels */}
          {MAJOR_DECADES.map((d) => {
            const px = logXToPx(d);
            return (
              <g key={`dec${d}`}>
                <line
                  x1={px}
                  y1={TICK_BASELINE_Y + 16}
                  x2={px}
                  y2={TICK_BASELINE_Y + 22}
                  stroke="var(--text-dim)"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={TICK_BASELINE_Y + 34}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  10^{d}
                </text>
              </g>
            );
          })}

          {/* cursor for current |x| */}
          <line
            x1={cursorPx}
            y1={PAD_T + 4}
            x2={cursorPx}
            y2={TICK_BASELINE_Y + 18}
            stroke="var(--accent)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
            opacity="0.85"
          />
          <circle cx={cursorPx} cy={TICK_BASELINE_Y} r="5" fill="var(--accent)" />
          <text
            x={cursorPx}
            y={PAD_T - 4}
            fontSize="10.5"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            fontWeight="700"
          >
            |x| = {fmtSci(x, 3)}
          </text>

          {/* legend bar */}
          <g transform={`translate(${PAD_L}, ${PAD_T - 6})`}>
            <text
              x="0"
              y="0"
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
            >
              gap between adjacent {prec.label} values — cool = tight, warm = wide
            </text>
          </g>

          {/* y-axis title (vertical) */}
          <text
            x={PAD_L - 30}
            y={TICK_BASELINE_Y}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            transform={`rotate(-90, ${PAD_L - 30}, ${TICK_BASELINE_Y})`}
          >
            binades
          </text>

          {/* zoom strip — shows 9 consecutive representables around current x */}
          <g transform={`translate(0, ${H - 14})`}>
            {(() => {
              if (!Number.isFinite(u) || u <= 0) return null;
              const cx = W / 2;
              const span = Math.min(PLOT_W - 40, 460);
              const stepPx = span / 8;
              return (
                <>
                  <line
                    x1={cx - span / 2 - 4}
                    y1={0}
                    x2={cx + span / 2 + 4}
                    y2={0}
                    stroke="var(--border)"
                    strokeWidth="0.9"
                  />
                  {zoomStrip.map((p, i) => {
                    const px = cx - span / 2 + i * stepPx;
                    const here = p.k === 0;
                    return (
                      <g key={`zs${p.k}`}>
                        <line
                          x1={px}
                          y1={-7}
                          x2={px}
                          y2={7}
                          stroke={here ? 'var(--accent)' : 'var(--hue-sky, #5ecbff)'}
                          strokeWidth={here ? 1.6 : 1}
                          opacity={here ? 1 : 0.85}
                        />
                        {(p.k === -4 || p.k === 0 || p.k === 4) && (
                          <text
                            x={px}
                            y={-10}
                            fontSize="8.5"
                            fill={here ? 'var(--accent)' : 'var(--text-dim)'}
                            fontFamily="var(--mono, monospace)"
                            textAnchor="middle"
                          >
                            {fmtSci(p.v, 3)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <text
                    x={cx - span / 2 - 8}
                    y={3}
                    fontSize="9"
                    fill="var(--text-dim)"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    textAnchor="end"
                  >
                    zoom
                  </text>
                </>
              );
            })()}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-toggles" role="tablist" aria-label="Precision">
          <button
            type="button"
            role="tab"
            aria-selected={precision === 'fp32'}
            className={`mlviz-toggle${precision === 'fp32' ? ' is-on' : ''}`}
            style={{ '--toggle-color': 'var(--hue-sky, #5ecbff)' }}
            onClick={() => setPrecision('fp32')}
          >
            <span className="mlviz-toggle-dot" />
            <Activity size={13} />
            <span>fp32 (23-bit mantissa)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={precision === 'fp64'}
            className={`mlviz-toggle${precision === 'fp64' ? ' is-on' : ''}`}
            style={{ '--toggle-color': 'var(--hue-mint, #6ee0a8)' }}
            onClick={() => setPrecision('fp64')}
          >
            <span className="mlviz-toggle-dot" />
            <Zap size={13} />
            <span>fp64 (52-bit mantissa)</span>
          </button>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">log10 |x|</span>
            <input
              type="range"
              min={LOG_MIN}
              max={LOG_MAX}
              step="0.01"
              value={logX}
              onChange={(e) => setLogX(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{logX.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>at x</span>
          <span className="mlviz-val">x = {fmtSci(x, 6)}</span>
          <span className="mlviz-val">snapped = {fmtSci(snapped, 6)}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>neighbours</span>
          <span className="mlviz-val">prev = {fmtSci(prev, 6)}</span>
          <span className="mlviz-val">next = {fmtSci(next, 6)}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)' }}>gap</span>
          <span className="mlviz-val">ULP(x) = {fmtSci(u, 4)}</span>
          <span className="mlviz-val">gap / |x| = {fmtSci(relGap, 3)}</span>
          <span className="mlviz-sub">≈ 2^{Math.floor(Math.log2(Math.max(x, Number.MIN_VALUE))) - prec.mantissa}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>format</span>
          <span className="mlviz-val">{prec.label}</span>
          <span className="mlviz-sub">eps ≈ {fmtSci(prec.eps, 3)}</span>
          <span className="mlviz-sub">2^{prec.mantissa} values per binade</span>
        </div>
      </div>
    </div>
  );
}
