import React, { useMemo, useState, useCallback } from 'react';
import './MLViz.css';

/* ScalingLawsViz
   MANIM-style 2D plot of Chinchilla-style LLM scaling laws.
   - x-axis: model size N (params), log scale 10^7..10^12
   - y-axis: training tokens D, log scale 10^8..10^13
   - Chinchilla frontier: D_opt(N) = 20 * N
   - Iso-compute curves: C = 6 * N * D  =>  D = C / (6 * N)
   - Per isocline, the optimal point (N*, D*) sits where D = 20 * N.
   - Slider sweeps compute budget C in log space (10^19 .. 10^25 FLOPs).
   - Real-model anchors: GPT-3, Chinchilla, LLaMA, LLaMA-2.
   - Hover any anchor: tooltip with N, D, C, and an L(N, D) loss estimate
     from the Chinchilla parametric form L = E + A/N^alpha + B/D^beta. */

const W = 560;
const H = 380;
const PAD_L = 64;
const PAD_R = 24;
const PAD_T = 22;
const PAD_B = 56;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

// Axis bounds in log10.
const N_MIN_LOG = 7;   // 10^7  = 10M
const N_MAX_LOG = 12;  // 10^12 = 1T
const D_MIN_LOG = 8;   // 10^8  = 100M tokens
const D_MAX_LOG = 13;  // 10^13 = 10T tokens

// Compute slider bounds (log10 FLOPs).
const C_MIN_LOG = 19;
const C_MAX_LOG = 25;
const C_DEFAULT_LOG = 23.78; // ~Chinchilla scale (5.76e23)

// Chinchilla (Hoffmann et al., 2022) parametric loss form (approximate constants).
// L(N, D) = E + A / N^alpha + B / D^beta
const LOSS_E = 1.69;
const LOSS_A = 406.4;
const LOSS_B = 410.7;
const LOSS_ALPHA = 0.34;
const LOSS_BETA = 0.28;

function lossEstimate(N, D) {
  return LOSS_E + LOSS_A / Math.pow(N, LOSS_ALPHA) + LOSS_B / Math.pow(D, LOSS_BETA);
}

function nToPx(N) {
  const t = (Math.log10(N) - N_MIN_LOG) / (N_MAX_LOG - N_MIN_LOG);
  return PAD_L + t * PLOT_W;
}
function dToPy(D) {
  const t = (Math.log10(D) - D_MIN_LOG) / (D_MAX_LOG - D_MIN_LOG);
  return PAD_T + (1 - t) * PLOT_H;
}

function fmtSci(x, digits = 2) {
  if (!Number.isFinite(x) || x <= 0) return '0';
  const exp = Math.floor(Math.log10(x));
  const mant = x / Math.pow(10, exp);
  return `${mant.toFixed(digits)}e${exp}`;
}

function fmtParams(N) {
  if (N >= 1e12) return `${(N / 1e12).toFixed(2)}T`;
  if (N >= 1e9) return `${(N / 1e9).toFixed(N >= 1e10 ? 0 : 1)}B`;
  if (N >= 1e6) return `${(N / 1e6).toFixed(0)}M`;
  return `${Math.round(N)}`;
}
function fmtTokens(D) {
  if (D >= 1e12) return `${(D / 1e12).toFixed(2)}T`;
  if (D >= 1e9) return `${(D / 1e9).toFixed(D >= 1e10 ? 0 : 1)}B`;
  if (D >= 1e6) return `${(D / 1e6).toFixed(0)}M`;
  return `${Math.round(D)}`;
}

// Real-model anchors. Each: N params, D tokens, FLOPs derived as 6 * N * D.
const MODELS = [
  {
    key: 'gpt3',
    label: 'GPT-3',
    N: 175e9,
    D: 300e9,
    regime: 'undertrained',
    hue: 'var(--hue-pink, #ff66cc)',
  },
  {
    key: 'chinchilla',
    label: 'Chinchilla',
    N: 70e9,
    D: 1.4e12,
    regime: 'optimal',
    hue: 'var(--accent)',
  },
  {
    key: 'llama',
    label: 'LLaMA',
    N: 65e9,
    D: 1.4e12,
    regime: 'well-trained',
    hue: 'var(--hue-mint, #5cd6a9)',
  },
  {
    key: 'llama2',
    label: 'LLaMA-2',
    N: 70e9,
    D: 2.0e12,
    regime: 'overtrained',
    hue: 'var(--hue-sky, #5ecbff)',
  },
];

// Build a polyline along the Chinchilla frontier D = 20 N, within plot bounds.
function frontierPath() {
  // D = 20 N, in log space: logD = logN + log10(20)
  // intersect with axis bounds
  const k = Math.log10(20);
  // For each N in [N_MIN_LOG, N_MAX_LOG], compute D log
  const pts = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const logN = N_MIN_LOG + (i / steps) * (N_MAX_LOG - N_MIN_LOG);
    const logD = logN + k;
    if (logD < D_MIN_LOG - 0.0001 || logD > D_MAX_LOG + 0.0001) continue;
    const N = Math.pow(10, logN);
    const D = Math.pow(10, logD);
    pts.push([nToPx(N), dToPy(D)]);
  }
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
}

// Build polyline for an isocline C = 6 N D  =>  D = C / (6 N).
// In log space: logD = logC - log10(6) - logN. Straight line with slope -1.
function isoclinePath(logC) {
  const k = logC - Math.log10(6);
  const pts = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const logN = N_MIN_LOG + (i / steps) * (N_MAX_LOG - N_MIN_LOG);
    const logD = k - logN;
    if (logD < D_MIN_LOG - 0.0001 || logD > D_MAX_LOG + 0.0001) continue;
    const N = Math.pow(10, logN);
    const D = Math.pow(10, logD);
    pts.push([nToPx(N), dToPy(D)]);
  }
  if (pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
}

// For compute C, the Chinchilla-optimal point satisfies D = 20 N and C = 6 N D.
// =>  C = 120 N^2  =>  N* = sqrt(C / 120),  D* = 20 N*.
function optimalForCompute(C) {
  const Nstar = Math.sqrt(C / 120);
  const Dstar = 20 * Nstar;
  return { N: Nstar, D: Dstar };
}

function ScalingLawsViz() {
  const [logC, setLogC] = useState(C_DEFAULT_LOG);
  const [hover, setHover] = useState(null);

  const C = useMemo(() => Math.pow(10, logC), [logC]);
  const opt = useMemo(() => optimalForCompute(C), [C]);
  const optInBounds =
    Math.log10(opt.N) >= N_MIN_LOG &&
    Math.log10(opt.N) <= N_MAX_LOG &&
    Math.log10(opt.D) >= D_MIN_LOG &&
    Math.log10(opt.D) <= D_MAX_LOG;

  const frontier = useMemo(() => frontierPath(), []);
  const activeIso = useMemo(() => isoclinePath(logC), [logC]);

  // Background reference isoclines at fixed compute steps.
  const refIsoLogs = useMemo(() => {
    const arr = [];
    for (let v = C_MIN_LOG + 1; v <= C_MAX_LOG - 1; v++) arr.push(v);
    return arr;
  }, []);

  const onMove = useCallback((m) => {
    setHover({
      key: m.key,
      label: m.label,
      N: m.N,
      D: m.D,
      C: 6 * m.N * m.D,
      L: lossEstimate(m.N, m.D),
      regime: m.regime,
      hue: m.hue,
    });
  }, []);
  const onLeave = useCallback(() => setHover(null), []);

  // axis ticks
  const xTicks = [];
  for (let v = N_MIN_LOG; v <= N_MAX_LOG; v++) xTicks.push(v);
  const yTicks = [];
  for (let v = D_MIN_LOG; v <= D_MAX_LOG; v++) yTicks.push(v);

  const optLoss = optInBounds ? lossEstimate(opt.N, opt.D) : null;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <linearGradient id="scal-frontier-glow" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.0" />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="scal-frontier-stroke" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-mint)" />
            </linearGradient>
            <linearGradient id="scal-iso-stroke" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--hue-pink)" />
            </linearGradient>
            <filter id="scal-frontier-blur" x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <filter id="scal-pt-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <clipPath id="scal-plot-clip">
              <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} />
            </clipPath>
          </defs>

          {/* plot background */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--surface)"
            opacity="0.45"
          />

          {/* gridlines */}
          {xTicks.map((v) => {
            const N = Math.pow(10, v);
            const px = nToPx(N);
            return (
              <line
                key={`gx${v}`}
                x1={px}
                y1={PAD_T}
                x2={px}
                y2={PAD_T + PLOT_H}
                stroke="var(--border)"
                strokeWidth="0.6"
                strokeDasharray="2 4"
                opacity="0.45"
              />
            );
          })}
          {yTicks.map((v) => {
            const D = Math.pow(10, v);
            const py = dToPy(D);
            return (
              <line
                key={`gy${v}`}
                x1={PAD_L}
                y1={py}
                x2={PAD_L + PLOT_W}
                y2={py}
                stroke="var(--border)"
                strokeWidth="0.6"
                strokeDasharray="2 4"
                opacity="0.45"
              />
            );
          })}

          {/* background iso-compute lines (faint) */}
          <g clipPath="url(#scal-plot-clip)">
            {refIsoLogs.map((lc) => {
              const d = isoclinePath(lc);
              if (!d) return null;
              return (
                <path
                  key={`iso${lc}`}
                  d={d}
                  fill="none"
                  stroke="var(--text-dim)"
                  strokeWidth="0.9"
                  strokeDasharray="3 5"
                  opacity="0.32"
                />
              );
            })}
            {/* labels for a few reference isoclines */}
            {refIsoLogs.filter((v) => v % 2 === 0).map((lc) => {
              // place label near top edge of plot where the iso line meets it
              const k = lc - Math.log10(6);
              // logD = k - logN, set logD = D_MAX_LOG -> logN = k - D_MAX_LOG
              let logN = k - D_MAX_LOG;
              let logD = D_MAX_LOG;
              if (logN < N_MIN_LOG) {
                logN = N_MIN_LOG;
                logD = k - logN;
                if (logD > D_MAX_LOG || logD < D_MIN_LOG) return null;
              } else if (logN > N_MAX_LOG) {
                return null;
              }
              const px = nToPx(Math.pow(10, logN));
              const py = dToPy(Math.pow(10, logD));
              return (
                <text
                  key={`isol${lc}`}
                  x={px + 4}
                  y={py + 10}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  opacity="0.75"
                >
                  C=10^{lc}
                </text>
              );
            })}
          </g>

          {/* Chinchilla frontier band */}
          <g clipPath="url(#scal-plot-clip)">
            <path
              d={frontier}
              fill="none"
              stroke="url(#scal-frontier-glow)"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d={frontier}
              fill="none"
              stroke="url(#scal-frontier-stroke)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#scal-frontier-blur)"
              opacity="0.5"
            />
            <path
              d={frontier}
              fill="none"
              stroke="url(#scal-frontier-stroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>

          {/* Active isocline (driven by slider) */}
          <g clipPath="url(#scal-plot-clip)">
            <path
              d={activeIso}
              fill="none"
              stroke="url(#scal-iso-stroke)"
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity="0.95"
            />
          </g>

          {/* Optimal point on active isocline */}
          {optInBounds && (
            <g clipPath="url(#scal-plot-clip)">
              <circle
                cx={nToPx(opt.N)}
                cy={dToPy(opt.D)}
                r="11"
                fill="var(--hue-violet, #b388ff)"
                opacity="0.32"
                filter="url(#scal-pt-glow)"
              />
              <circle
                cx={nToPx(opt.N)}
                cy={dToPy(opt.D)}
                r="4.5"
                fill="var(--hue-violet, #b388ff)"
                stroke="var(--bg)"
                strokeWidth="1.4"
              />
            </g>
          )}

          {/* axes */}
          <line
            x1={PAD_L}
            y1={PAD_T + PLOT_H}
            x2={PAD_L + PLOT_W}
            y2={PAD_T + PLOT_H}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={PAD_T + PLOT_H}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* x ticks */}
          {xTicks.map((v) => {
            const px = nToPx(Math.pow(10, v));
            return (
              <g key={`xt${v}`}>
                <line
                  x1={px}
                  y1={PAD_T + PLOT_H}
                  x2={px}
                  y2={PAD_T + PLOT_H + 4}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={PAD_T + PLOT_H + 16}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  10^{v}
                </text>
              </g>
            );
          })}
          {/* y ticks */}
          {yTicks.map((v) => {
            const py = dToPy(Math.pow(10, v));
            return (
              <g key={`yt${v}`}>
                <line
                  x1={PAD_L - 4}
                  y1={py}
                  x2={PAD_L}
                  y2={py}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 6}
                  y={py + 3}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  10^{v}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={PAD_L + PLOT_W / 2}
            y={H - 22}
            fontSize="11.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="middle"
          >
            model size N (parameters, log scale)
          </text>
          <text
            x={-(PAD_T + PLOT_H / 2)}
            y={16}
            fontSize="11.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            training tokens D (log scale)
          </text>

          {/* frontier label */}
          {(() => {
            // place at the upper-right corner of the line
            const logNlabel = Math.min(N_MAX_LOG - 0.4, D_MAX_LOG - Math.log10(20));
            const N = Math.pow(10, logNlabel);
            const D = 20 * N;
            if (Math.log10(D) > D_MAX_LOG) return null;
            const px = nToPx(N);
            const py = dToPy(D);
            return (
              <g>
                <text
                  x={px - 4}
                  y={py - 6}
                  fontSize="10.5"
                  fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                  fontWeight="700"
                >
                  D = 20·N
                </text>
                <text
                  x={px - 4}
                  y={py + 6}
                  fontSize="9"
                  fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                  opacity="0.8"
                >
                  Chinchilla frontier
                </text>
              </g>
            );
          })()}

          {/* Model anchors */}
          {MODELS.map((m) => {
            const px = nToPx(m.N);
            const py = dToPy(m.D);
            const isHover = hover && hover.key === m.key;
            return (
              <g
                key={m.key}
                onMouseEnter={() => onMove(m)}
                onMouseLeave={onLeave}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={px}
                  cy={py}
                  r={isHover ? 14 : 10}
                  fill={m.hue}
                  opacity={isHover ? 0.42 : 0.24}
                  filter="url(#scal-pt-glow)"
                />
                <circle
                  cx={px}
                  cy={py}
                  r={isHover ? 6 : 5}
                  fill={m.hue}
                  stroke="var(--bg)"
                  strokeWidth="1.6"
                />
                <text
                  x={px + 9}
                  y={py - 8}
                  fontSize="10.5"
                  fill={m.hue}
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          {/* Optimal marker label */}
          {optInBounds && (
            <text
              x={nToPx(opt.N) + 9}
              y={dToPy(opt.D) + 13}
              fontSize="10"
              fill="var(--hue-violet, #b388ff)"
              fontFamily="var(--mono, monospace)"
              fontWeight="700"
            >
              N*={fmtParams(opt.N)}, D*={fmtTokens(opt.D)}
            </text>
          )}

          {/* Hover tooltip */}
          {hover && (() => {
            const px = nToPx(hover.N);
            const py = dToPy(hover.D);
            const boxW = 178;
            const boxH = 78;
            let bx = px + 14;
            let by = py - boxH - 10;
            if (bx + boxW > PAD_L + PLOT_W) bx = px - boxW - 14;
            if (by < PAD_T + 2) by = py + 14;
            return (
              <g>
                <rect
                  x={bx}
                  y={by}
                  width={boxW}
                  height={boxH}
                  rx="6"
                  ry="6"
                  fill="var(--surface)"
                  stroke={hover.hue}
                  strokeWidth="1.2"
                  opacity="0.98"
                />
                <text
                  x={bx + 8}
                  y={by + 14}
                  fontSize="10.5"
                  fill={hover.hue}
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {hover.label}  ·  {hover.regime}
                </text>
                <text
                  x={bx + 8}
                  y={by + 28}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                >
                  N = {fmtParams(hover.N)} ({fmtSci(hover.N)})
                </text>
                <text
                  x={bx + 8}
                  y={by + 42}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                >
                  D = {fmtTokens(hover.D)} ({fmtSci(hover.D)})
                </text>
                <text
                  x={bx + 8}
                  y={by + 56}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                >
                  C = {fmtSci(hover.C)} FLOPs
                </text>
                <text
                  x={bx + 8}
                  y={by + 70}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                >
                  L ≈ {hover.L.toFixed(3)} (loss est.)
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">compute C</span>
            <input
              type="range"
              min={C_MIN_LOG}
              max={C_MAX_LOG}
              step="0.01"
              value={logC}
              onChange={(e) => setLogC(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">10^{logC.toFixed(2)} FLOPs</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--hue-violet, #b388ff)' }}>
            optimal
          </span>
          {optInBounds ? (
            <>
              <span className="mlviz-val">N* = {fmtParams(opt.N)}</span>
              <span className="mlviz-val">D* = {fmtTokens(opt.D)}</span>
              <span className="mlviz-sub">
                C = 6·N·D = {fmtSci(6 * opt.N * opt.D)}
              </span>
              {optLoss !== null && (
                <span className="mlviz-sub">L ≈ {optLoss.toFixed(3)}</span>
              )}
            </>
          ) : (
            <span className="mlviz-sub">optimum off-chart at this compute</span>
          )}
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            frontier
          </span>
          <span className="mlviz-val">D_opt(N) = 20·N</span>
          <span className="mlviz-sub">tokens-per-param ratio is ~20 at the optimum</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>
            iso-compute
          </span>
          <span className="mlviz-val">C = 6·N·D</span>
          <span className="mlviz-sub">dashed lines: constant FLOP budgets</span>
        </div>

        <div className="mlviz-hint">
          Hover any model to read N, D, C, and a Chinchilla-form loss estimate
          L = E + A/N^α + B/D^β. Points above the violet frontier are over-trained for their
          size; points below are under-trained.
        </div>
      </div>
    </div>
  );
}

export default ScalingLawsViz;
