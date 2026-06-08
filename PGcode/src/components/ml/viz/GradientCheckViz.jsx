import React, { useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './MLViz.css';

const W = 520;
const H = 320;

const PAD_L = 44;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 36;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const FUNCS = {
  square: {
    label: 'f(x) = x²',
    tex: 'f(x) = x^2',
    dtex: "f'(x) = 2x",
    f: (x) => x * x,
    df: (x) => 2 * x,
    domain: [-3, 3],
    yRange: [-1, 9.5],
    defaultX: 1.4,
  },
  cube: {
    label: 'f(x) = x³',
    tex: 'f(x) = x^3',
    dtex: "f'(x) = 3x^2",
    f: (x) => x * x * x,
    df: (x) => 3 * x * x,
    domain: [-2.4, 2.4],
    yRange: [-14, 14],
    defaultX: 1.1,
  },
  sin: {
    label: 'f(x) = sin(x)',
    tex: 'f(x) = \\sin(x)',
    dtex: "f'(x) = \\cos(x)",
    f: (x) => Math.sin(x),
    df: (x) => Math.cos(x),
    domain: [-Math.PI * 1.2, Math.PI * 1.2],
    yRange: [-1.4, 1.4],
    defaultX: 0.9,
  },
  exp: {
    label: 'f(x) = eˣ',
    tex: 'f(x) = e^{x}',
    dtex: "f'(x) = e^{x}",
    f: (x) => Math.exp(x),
    df: (x) => Math.exp(x),
    domain: [-2.4, 2.4],
    yRange: [-1, 11],
    defaultX: 1.0,
  },
};

// log slider: position 0..1 maps to log10(eps) in [-1 .. -7]
const EPS_LOG_MIN = -7;
const EPS_LOG_MAX = -1;

function fmtSci(v, p = 3) {
  if (!Number.isFinite(v)) return 'NaN';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e-3 && abs < 1e4) {
    const m = Math.pow(10, p);
    return (Math.round(v * m) / m).toString();
  }
  return v.toExponential(p);
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

export default function GradientCheckViz() {
  const [fnKey, setFnKey] = useState('square');
  const [x0, setX0] = useState(FUNCS.square.defaultX);
  const [epsLog, setEpsLog] = useState(-4); // central sweet spot

  const fn = FUNCS[fnKey];
  const eps = Math.pow(10, epsLog);

  // sync x to a sensible value when switching function
  const onFnChange = (key) => {
    setFnKey(key);
    const d = FUNCS[key];
    if (x0 < d.domain[0] || x0 > d.domain[1]) setX0(d.defaultX);
  };

  // axis scaling
  const [xmin, xmax] = fn.domain;
  const [ymin, ymax] = fn.yRange;
  const xs = (x) => PAD_L + ((x - xmin) / (xmax - xmin)) * PLOT_W;
  const ys = (y) => PAD_T + (1 - (y - ymin) / (ymax - ymin)) * PLOT_H;

  // curve sample
  const curvePath = useMemo(() => {
    const N = 240;
    let p = '';
    for (let i = 0; i <= N; i++) {
      const x = xmin + (i / N) * (xmax - xmin);
      const y = fn.f(x);
      // clamp to plot area
      const cy = Math.max(ymin, Math.min(ymax, y));
      const cx = x;
      const cmd = i === 0 ? 'M' : 'L';
      p += `${cmd}${xs(cx).toFixed(2)},${ys(cy).toFixed(2)} `;
    }
    return p.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fnKey, xmin, xmax, ymin, ymax]);

  // gradient computations
  const fAtX = fn.f(x0);
  const analytic = fn.df(x0);
  const fxPlus = fn.f(x0 + eps);
  const fxMinus = fn.f(x0 - eps);
  const numericCentral = (fxPlus - fxMinus) / (2 * eps);
  const numericForward = (fxPlus - fAtX) / eps;

  const errCentral = Math.abs(numericCentral - analytic);
  const errForward = Math.abs(numericForward - analytic);
  const relCentral = Math.abs(analytic) > 1e-12 ? errCentral / Math.abs(analytic) : errCentral;

  // tangent line: y = f(x0) + analytic * (x - x0). draw across visible x range
  const tangentEndpoints = useMemo(() => {
    const xL = xmin;
    const xR = xmax;
    const yL = fAtX + analytic * (xL - x0);
    const yR = fAtX + analytic * (xR - x0);
    return { xL, yL, xR, yR };
  }, [xmin, xmax, fAtX, analytic, x0]);

  // secant (central): from (x0-eps, f(x0-eps)) to (x0+eps, f(x0+eps)), then extend
  const secantEndpoints = useMemo(() => {
    const slope = numericCentral;
    const xL = xmin;
    const xR = xmax;
    const yL = fAtX + slope * (xL - x0);
    const yR = fAtX + slope * (xR - x0);
    return { xL, yL, xR, yR };
  }, [xmin, xmax, fAtX, numericCentral, x0]);

  // grid ticks (5 x ticks, 5 y ticks)
  const xTicks = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 4; i++) {
      const v = xmin + (i / 4) * (xmax - xmin);
      out.push(v);
    }
    return out;
  }, [xmin, xmax]);
  const yTicks = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 4; i++) {
      const v = ymin + (i / 4) * (ymax - ymin);
      out.push(v);
    }
    return out;
  }, [ymin, ymax]);

  // sweet-spot detection
  const sweetSpot = epsLog >= -6 && epsLog <= -4;
  const tooSmall = epsLog < -6;
  const tooLarge = epsLog > -3;

  const errBadge = sweetSpot
    ? { label: 'SWEET SPOT', color: 'var(--easy, #7be0c0)' }
    : tooSmall
    ? { label: 'FLOAT NOISE', color: 'var(--hard, #ff7a7a)' }
    : tooLarge
    ? { label: 'TRUNCATION ERR', color: 'var(--warning, #ffb84d)' }
    : { label: 'OK', color: 'var(--text-dim)' };

  const centralTex = useMemo(
    () => katexHtml(
      "\\dfrac{f(x+\\varepsilon) - f(x-\\varepsilon)}{2\\varepsilon} \\;\\approx\\; f'(x)",
      true
    ),
    []
  );

  const forwardTex = useMemo(
    () => katexHtml(
      "\\dfrac{f(x+\\varepsilon) - f(x)}{\\varepsilon} \\;\\approx\\; f'(x)",
      true
    ),
    []
  );

  // x0 marker positions
  const x0px = xs(x0);
  const fAtXpx = ys(fAtX);

  // epsilon neighborhood markers (clamped visually)
  const xPlusPx = xs(Math.min(xmax, x0 + eps));
  const xMinusPx = xs(Math.max(xmin, x0 - eps));

  // visual eps display markers: enforce a min visible gap so they don't merge for very small eps
  const minDisplayPx = 6;
  let xPlusDisp = xPlusPx;
  let xMinusDisp = xMinusPx;
  if (xPlusDisp - xMinusDisp < minDisplayPx) {
    xPlusDisp = x0px + minDisplayPx / 2;
    xMinusDisp = x0px - minDisplayPx / 2;
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <marker id="gc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <clipPath id="gc-plot-clip">
              <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} />
            </clipPath>
          </defs>

          {/* Plot background */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Grid */}
          {xTicks.map((v, i) => (
            <line
              key={`gx-${i}`}
              x1={xs(v)}
              x2={xs(v)}
              y1={PAD_T}
              y2={PAD_T + PLOT_H}
              stroke="var(--border)"
              strokeWidth="0.6"
              opacity="0.45"
            />
          ))}
          {yTicks.map((v, i) => (
            <line
              key={`gy-${i}`}
              x1={PAD_L}
              x2={PAD_L + PLOT_W}
              y1={ys(v)}
              y2={ys(v)}
              stroke="var(--border)"
              strokeWidth="0.6"
              opacity="0.45"
            />
          ))}

          {/* Axes (x=0, y=0) */}
          {xmin < 0 && xmax > 0 && (
            <line x1={xs(0)} x2={xs(0)} y1={PAD_T} y2={PAD_T + PLOT_H} stroke="var(--text-dim)" strokeWidth="0.9" opacity="0.7" />
          )}
          {ymin < 0 && ymax > 0 && (
            <line x1={PAD_L} x2={PAD_L + PLOT_W} y1={ys(0)} y2={ys(0)} stroke="var(--text-dim)" strokeWidth="0.9" opacity="0.7" />
          )}

          {/* Tick labels */}
          {xTicks.map((v, i) => (
            <text
              key={`tx-${i}`}
              x={xs(v)}
              y={PAD_T + PLOT_H + 13}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              {fmtSci(v, 2)}
            </text>
          ))}
          {yTicks.map((v, i) => (
            <text
              key={`ty-${i}`}
              x={PAD_L - 5}
              y={ys(v) + 3}
              textAnchor="end"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              {fmtSci(v, 2)}
            </text>
          ))}

          {/* Axis labels */}
          <text x={PAD_L + PLOT_W - 4} y={PAD_T + PLOT_H - 6} textAnchor="end" fontSize="10" fontStyle="italic" fontFamily="var(--serif, serif)" fill="var(--text-dim)">x</text>
          <text x={PAD_L + 6} y={PAD_T + 12} fontSize="10" fontStyle="italic" fontFamily="var(--serif, serif)" fill="var(--text-dim)">f(x)</text>

          {/* The function curve */}
          <g clipPath="url(#gc-plot-clip)">
            <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth="2" />
          </g>

          {/* Secant (central difference) — drawn under tangent so tangent reads on top */}
          <g clipPath="url(#gc-plot-clip)">
            <line
              x1={xs(secantEndpoints.xL)}
              y1={ys(secantEndpoints.yL)}
              x2={xs(secantEndpoints.xR)}
              y2={ys(secantEndpoints.yR)}
              stroke="var(--hue-pink, #ff66cc)"
              strokeWidth="1.6"
              strokeDasharray="6 4"
              opacity="0.95"
            />
          </g>

          {/* Tangent (analytic) */}
          <g clipPath="url(#gc-plot-clip)">
            <line
              x1={xs(tangentEndpoints.xL)}
              y1={ys(tangentEndpoints.yL)}
              x2={xs(tangentEndpoints.xR)}
              y2={ys(tangentEndpoints.yR)}
              stroke="var(--hue-mint, #7be0c0)"
              strokeWidth="2"
              opacity="0.95"
            />
          </g>

          {/* x = x0 vertical guide */}
          <line
            x1={x0px}
            x2={x0px}
            y1={PAD_T}
            y2={PAD_T + PLOT_H}
            stroke="var(--text-dim)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.7"
          />

          {/* Epsilon neighborhood band */}
          <rect
            x={xMinusDisp}
            y={PAD_T}
            width={Math.max(2, xPlusDisp - xMinusDisp)}
            height={PLOT_H}
            fill="var(--hue-violet, #b48bff)"
            opacity="0.08"
          />
          <line x1={xMinusDisp} x2={xMinusDisp} y1={PAD_T} y2={PAD_T + PLOT_H} stroke="var(--hue-violet, #b48bff)" strokeWidth="0.8" opacity="0.65" />
          <line x1={xPlusDisp} x2={xPlusDisp} y1={PAD_T} y2={PAD_T + PLOT_H} stroke="var(--hue-violet, #b48bff)" strokeWidth="0.8" opacity="0.65" />

          {/* Sample points: x-eps, x, x+eps */}
          {(() => {
            const pts = [
              { x: x0 - eps, y: fxMinus, xPx: xMinusDisp, color: 'var(--hue-violet, #b48bff)', label: 'x−ε' },
              { x: x0, y: fAtX, xPx: x0px, color: 'var(--accent)', label: 'x' },
              { x: x0 + eps, y: fxPlus, xPx: xPlusDisp, color: 'var(--hue-violet, #b48bff)', label: 'x+ε' },
            ];
            return pts.map((p, i) => {
              const yClamped = Math.max(ymin, Math.min(ymax, p.y));
              const yPx = ys(yClamped);
              return (
                <g key={`pt-${i}`}>
                  <circle cx={p.xPx} cy={yPx} r={i === 1 ? 5 : 4} fill={p.color} stroke="var(--bg)" strokeWidth="1.2" />
                </g>
              );
            });
          })()}

          {/* Center point bigger ring */}
          <circle cx={x0px} cy={fAtXpx} r={8} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />

          {/* Legend, top-right */}
          <g transform={`translate(${W - PAD_R - 152}, ${PAD_T + 4})`}>
            <rect x={0} y={0} width={150} height={56} rx={5} ry={5} fill="var(--bg)" stroke="var(--border)" strokeWidth="0.8" opacity="0.92" />
            <line x1={8} x2={28} y1={14} y2={14} stroke="var(--accent)" strokeWidth="2" />
            <text x={32} y={17} fontSize="9.5" fontFamily="var(--mono, monospace)" fill="var(--text-main)">f(x)</text>
            <line x1={8} x2={28} y1={28} y2={28} stroke="var(--hue-mint, #7be0c0)" strokeWidth="2" />
            <text x={32} y={31} fontSize="9.5" fontFamily="var(--mono, monospace)" fill="var(--text-main)">tangent · f'(x)</text>
            <line x1={8} x2={28} y1={42} y2={42} stroke="var(--hue-pink, #ff66cc)" strokeWidth="1.6" strokeDasharray="6 4" />
            <text x={32} y={45} fontSize="9.5" fontFamily="var(--mono, monospace)" fill="var(--text-main)">secant · numeric</text>
          </g>

          {/* Sweet-spot badge bottom-left */}
          <g transform={`translate(${PAD_L + 6}, ${PAD_T + PLOT_H - 22})`}>
            <rect x={0} y={0} width={120} height={16} rx={4} ry={4} fill="var(--bg)" stroke={errBadge.color} strokeWidth="1" opacity="0.96" />
            <circle cx={9} cy={8} r={3} fill={errBadge.color} />
            <text x={18} y={11} fontSize="9" fontFamily="var(--mono, monospace)" letterSpacing="0.1em" fontWeight="700" fill={errBadge.color}>
              {errBadge.label}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* Formulas */}
        <div className="mlviz-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Numerical gradient check</div>
          <div
            style={{ color: 'var(--hue-pink, #ff66cc)', fontSize: 13 }}
            dangerouslySetInnerHTML={{ __html: centralTex }}
          />
          <div
            style={{ color: 'var(--text-dim)', fontSize: 12 }}
            dangerouslySetInnerHTML={{ __html: forwardTex }}
          />
        </div>

        {/* Live derivatives */}
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>f'(x)</span>
          <span className="mlviz-val">{fmtSci(analytic, 6)}</span>
          <span className="mlviz-sub">analytic, exact</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)' }}>central</span>
          <span className="mlviz-val">{fmtSci(numericCentral, 6)}</span>
          <span className="mlviz-sub">err = {fmtSci(errCentral, 3)}</span>
          <span className="mlviz-sub">rel = {fmtSci(relCentral, 3)}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-violet, #b48bff)' }}>forward</span>
          <span className="mlviz-val">{fmtSci(numericForward, 6)}</span>
          <span className="mlviz-sub">err = {fmtSci(errForward, 3)}</span>
          <span className="mlviz-sub">O(ε) vs central O(ε²)</span>
        </div>

        {/* Function picker */}
        <div className="mlviz-row mlviz-controls" style={{ gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(FUNCS).map(([k, v]) => {
            const active = k === fnKey;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onFnChange(k)}
                className="mlviz-btn"
                style={{
                  background: active ? 'var(--accent)' : 'var(--surface)',
                  color: active ? 'var(--bg)' : 'var(--text-main)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 11,
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {/* x slider */}
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider" style={{ flex: 1 }}>
            <span className="mlviz-slider-label">x</span>
            <input
              type="range"
              min={xmin}
              max={xmax}
              step={(xmax - xmin) / 400}
              value={x0}
              onChange={(e) => setX0(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{fmtSci(x0, 3)}</span>
          </label>
        </div>

        {/* eps slider (log scale) */}
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider" style={{ flex: 1 }}>
            <span className="mlviz-slider-label">ε</span>
            <input
              type="range"
              min={EPS_LOG_MIN}
              max={EPS_LOG_MAX}
              step={0.05}
              value={epsLog}
              onChange={(e) => setEpsLog(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">1e{epsLog.toFixed(2)}</span>
          </label>
        </div>

        {/* Sweet spot callout */}
        <div
          className="mlviz-row"
          style={{
            border: `1px solid ${errBadge.color}`,
            borderRadius: 6,
            padding: '6px 9px',
            background: 'var(--bg)',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: errBadge.color, fontWeight: 700, letterSpacing: '0.08em' }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: errBadge.color,
            }} />
            {errBadge.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.45 }}>
            {tooLarge && 'ε too large — secant slope misses curvature; truncation error dominates (O(ε²) on central).'}
            {sweetSpot && 'central difference is at the sweet spot: ε≈1e-4..1e-6 balances truncation and float roundoff.'}
            {tooSmall && 'ε too small — f(x+ε) and f(x-ε) collapse to nearly identical doubles; cancellation noise wrecks the estimate.'}
            {!tooLarge && !tooSmall && !sweetSpot && 'ε near the edge of the useful range — central difference still reasonable, forward less so.'}
          </div>
        </div>

        <div className="mlviz-hint">
          shrink ε → numerical converges to analytic; shrink too far → floating-point cancellation noise takes over
        </div>
      </div>
    </div>
  );
}
