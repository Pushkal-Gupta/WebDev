import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import './MLViz.css';

// Stage geometry. Each panel renders into its own SVG, side by side via flex.
const W = 380;
const H = 300;
const PAD_L = 36;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const X_MIN = -5;
const X_MAX = 5;
const X_RANGE = X_MAX - X_MIN;

// Bimodal mixture: 0.5 * N(-2, 0.8) + 0.5 * N(2, 0.8)
const MU1 = -2;
const MU2 = 2;
const SIGMA = 0.8;
const MIX_W = 0.5;

const PROPOSAL_SIGMA = 1.2;
const CURVE_N = 220;
const HIST_BINS = 28;
const STEP_MS = 30; // frame interval while sampling
const PER_FRAME = 2; // samples drawn per frame
const TOTAL_SAMPLES = 100;
const REJECT_TRAIL_MAX = 60;
const MCMC_TRAIL_MAX = 100;

function gaussPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function targetPdf(x) {
  return MIX_W * gaussPdf(x, MU1, SIGMA) + (1 - MIX_W) * gaussPdf(x, MU2, SIGMA);
}

// M for rejection: target peak * a small safety factor. Uniform proposal on [-5, 5].
// Density of uniform proposal is 1 / X_RANGE = 0.1. We bound target(x) <= M * proposal(x).
// Use scanning peak across the support.
function targetPeak() {
  let m = 0;
  for (let i = 0; i <= 200; i++) {
    const x = X_MIN + (i / 200) * X_RANGE;
    const v = targetPdf(x);
    if (v > m) m = v;
  }
  return m;
}
const TARGET_PEAK = targetPeak();
const UNIFORM_DENSITY = 1 / X_RANGE;
const M_BOUND = (TARGET_PEAK / UNIFORM_DENSITY) * 1.05; // accept prob = target(x) / (M * uniform)

// --- seeded RNG ---
// Mulberry32 — small, deterministic, fast.
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller from uniform rng.
function gaussFromRng(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / X_RANGE) * PLOT_W;
}

function yToPx(y, yMax) {
  const cap = Math.max(yMax, 1e-9);
  return PAD_T + (1 - y / cap) * PLOT_H;
}

function buildTargetPath(yMax) {
  const pts = [];
  for (let i = 0; i <= CURVE_N; i++) {
    const x = X_MIN + (i / CURVE_N) * X_RANGE;
    const y = targetPdf(x);
    pts.push(`${i === 0 ? 'M' : 'L'}${xToPx(x).toFixed(2)},${yToPx(y, yMax).toFixed(2)}`);
  }
  return pts.join(' ');
}

function buildTargetFill(yMax) {
  const line = buildTargetPath(yMax);
  const baseY = yToPx(0, yMax);
  return `${line} L${xToPx(X_MAX).toFixed(2)},${baseY.toFixed(2)} L${xToPx(X_MIN).toFixed(2)},${baseY.toFixed(2)} Z`;
}

// Histogram of samples → density (matching target normalization).
function buildHistogram(samples) {
  const counts = new Array(HIST_BINS).fill(0);
  if (!samples.length) return { counts, density: counts.slice() };
  const binW = X_RANGE / HIST_BINS;
  for (const s of samples) {
    if (s < X_MIN || s > X_MAX) continue;
    let idx = Math.floor((s - X_MIN) / binW);
    if (idx === HIST_BINS) idx = HIST_BINS - 1;
    counts[idx] += 1;
  }
  const n = samples.length;
  const density = counts.map((c) => c / (n * binW));
  return { counts, density };
}

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Y scale for both panels: peak of target + headroom for histogram bars.
const Y_MAX = TARGET_PEAK * 1.55;

function Panel({
  title,
  subtitle,
  target,
  fill,
  yAxisBase,
  samples,
  trail,
  trailKind, // 'reject' or 'mcmc'
  proposalMarker, // {x, accepted} | null
  histogram,
  acceptRate,
  totalProposed,
  runLabel,
  onRun,
  onReset,
  running,
  done,
  uniformBox, // for rejection only — show the M*uniform envelope
}) {
  const histBinW = (PLOT_W / HIST_BINS);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const markerTransition = reducedMotion ? 'none' : 'cx 0.12s ease-out, cy 0.12s ease-out';

  const latest = trail.length ? trail[trail.length - 1] : null;

  return (
    <div className="mlviz-stage" style={{ flex: '1 1 0', minWidth: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '4px 8px 6px',
        gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--serif, serif)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-main)',
            letterSpacing: '0.2px',
          }}>{title}</div>
          <div style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 10,
            color: 'var(--text-dim)',
            marginTop: 1,
          }}>{subtitle}</div>
        </div>
        <div style={{
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          color: 'var(--text-dim)',
        }}>
          {samples.length} / {TOTAL_SAMPLES} kept
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
        <defs>
          <linearGradient id={`samp-fill-${trailKind}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`samp-curve-grad-${trailKind}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--hue-violet)" />
          </linearGradient>
          <filter id={`samp-curve-glow-${trailKind}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id={`samp-pt-glow-${trailKind}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
        </defs>

        {/* vertical grid at x = -4, -2, 0, 2, 4 */}
        {[-4, -2, 0, 2, 4].map((tx) => (
          <line
            key={`gx${tx}`}
            x1={xToPx(tx)}
            y1={PAD_T}
            x2={xToPx(tx)}
            y2={yAxisBase}
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            opacity={tx === 0 ? 0.7 : 0.4}
          />
        ))}

        {/* uniform * M envelope (rejection only) */}
        {uniformBox && (
          <g>
            <line
              x1={xToPx(X_MIN)}
              y1={yToPx(TARGET_PEAK * 1.05, Y_MAX)}
              x2={xToPx(X_MAX)}
              y2={yToPx(TARGET_PEAK * 1.05, Y_MAX)}
              stroke="var(--hue-pink, #ff66cc)"
              strokeWidth="1.1"
              strokeDasharray="4 3"
              opacity="0.85"
            />
            <text
              x={xToPx(X_MAX) - 4}
              y={yToPx(TARGET_PEAK * 1.05, Y_MAX) - 4}
              fontSize="9.5"
              fill="var(--hue-pink, #ff66cc)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
            >
              M · q(x)
            </text>
          </g>
        )}

        {/* histogram of accepted samples */}
        {histogram.density.map((d, i) => {
          if (d <= 0) return null;
          const x = PAD_L + i * histBinW;
          const yTop = yToPx(d, Y_MAX);
          const h = yAxisBase - yTop;
          if (h <= 0.5) return null;
          return (
            <rect
              key={`bin${i}`}
              x={x + 0.5}
              y={yTop}
              width={histBinW - 1}
              height={h}
              fill="var(--accent)"
              fillOpacity="0.18"
              stroke="var(--accent)"
              strokeOpacity="0.35"
              strokeWidth="0.6"
            />
          );
        })}

        {/* target distribution: fill + glow + gradient line */}
        <path d={fill} fill={`url(#samp-fill-${trailKind})`} />
        <path
          d={target}
          fill="none"
          stroke={`url(#samp-curve-grad-${trailKind})`}
          strokeWidth="3.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#samp-curve-glow-${trailKind})`}
          opacity="0.5"
        />
        <path
          d={target}
          fill="none"
          stroke={`url(#samp-curve-grad-${trailKind})`}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* axes */}
        <line x1={PAD_L} y1={yAxisBase} x2={W - PAD_R} y2={yAxisBase} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={yAxisBase} stroke="var(--border)" strokeWidth="1" />

        {/* x ticks */}
        {[-4, -2, 0, 2, 4].map((tx) => {
          const px = xToPx(tx);
          return (
            <g key={`xt${tx}`}>
              <line x1={px} y1={yAxisBase} x2={px} y2={yAxisBase + 4} stroke="var(--border)" strokeWidth="1" />
              <text
                x={px}
                y={yAxisBase + 15}
                fontSize="9.5"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {tx}
              </text>
            </g>
          );
        })}

        {/* axis labels */}
        <text
          x={W - PAD_R}
          y={yAxisBase + 26}
          fontSize="11"
          fill="var(--text-dim)"
          fontFamily="var(--serif, serif)"
          fontStyle="italic"
          textAnchor="end"
        >
          x
        </text>
        <text
          x={PAD_L - 4}
          y={PAD_T + 2}
          fontSize="10.5"
          fill="var(--text-dim)"
          fontFamily="var(--serif, serif)"
          fontStyle="italic"
          textAnchor="end"
        >
          p(x)
        </text>

        {/* trail: rejection samples (acc/rej dots), or MCMC walk segments */}
        {trailKind === 'reject' && trail.map((p, i) => (
          <circle
            key={`tr${i}`}
            cx={xToPx(p.x)}
            cy={yToPx(p.u, Y_MAX)}
            r={p.accepted ? 2.6 : 2}
            fill={p.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
            opacity={p.accepted ? 0.9 : 0.55}
          />
        ))}

        {trailKind === 'mcmc' && trail.length > 1 && (
          <g>
            {trail.map((p, i) => {
              if (i === 0) return null;
              const prev = trail[i - 1];
              const fade = Math.max(0.18, 1 - (trail.length - i) / MCMC_TRAIL_MAX);
              return (
                <line
                  key={`ml${i}`}
                  x1={xToPx(prev.x)}
                  y1={yToPx(targetPdf(prev.x), Y_MAX)}
                  x2={xToPx(p.x)}
                  y2={yToPx(targetPdf(p.x), Y_MAX)}
                  stroke={p.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
                  strokeWidth="1.1"
                  opacity={fade * 0.7}
                />
              );
            })}
            {latest && (
              <circle
                cx={xToPx(latest.x)}
                cy={yToPx(targetPdf(latest.x), Y_MAX)}
                r={7}
                fill={latest.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
                filter={`url(#samp-pt-glow-${trailKind})`}
                opacity={0.55}
                style={{ transition: markerTransition }}
              />
            )}
            {trail.slice(-12).map((p, i, arr) => (
              <circle
                key={`md${i}`}
                cx={xToPx(p.x)}
                cy={yToPx(targetPdf(p.x), Y_MAX)}
                r={i === arr.length - 1 ? 3.4 : 2.2}
                fill={p.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
                opacity={0.85}
                style={i === arr.length - 1 ? { transition: markerTransition } : undefined}
              />
            ))}
          </g>
        )}

        {/* live proposal marker (vertical hint) */}
        {proposalMarker && (
          <g>
            <line
              x1={xToPx(proposalMarker.x)}
              y1={PAD_T}
              x2={xToPx(proposalMarker.x)}
              y2={yAxisBase}
              stroke={proposalMarker.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.75"
            />
            <circle
              cx={xToPx(proposalMarker.x)}
              cy={yToPx(targetPdf(proposalMarker.x), Y_MAX)}
              r={9}
              fill={proposalMarker.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
              filter={`url(#samp-pt-glow-${trailKind})`}
              opacity="0.5"
              style={{ transition: markerTransition }}
            />
            <circle
              cx={xToPx(proposalMarker.x)}
              cy={yToPx(targetPdf(proposalMarker.x), Y_MAX)}
              r={4.5}
              fill="none"
              stroke={proposalMarker.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
              strokeWidth="1.4"
              opacity="0.9"
              style={{ transition: markerTransition }}
            />
          </g>
        )}

        {/* legend strip */}
        <g transform={`translate(${PAD_L + 6}, ${PAD_T + 4})`}>
          <circle cx={4} cy={6} r={3} fill="var(--easy, #2ecc71)" />
          <text x={12} y={9} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">accept</text>
          <circle cx={56} cy={6} r={3} fill="var(--hard, #ff5e5e)" />
          <text x={64} y={9} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">reject</text>
          <line x1={102} y1={6} x2={120} y2={6} stroke={`url(#samp-curve-grad-${trailKind})`} strokeWidth="2" strokeLinecap="round" />
          <text x={124} y={9} fontSize="9.5" fill="var(--accent)" fontFamily="var(--mono, monospace)">target</text>
        </g>
      </svg>

      <div className="mlviz-row mlviz-btn-row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="mlviz-btn mlviz-btn-primary"
          onClick={onRun}
          disabled={running || done}
        >
          <Play size={13} />
          <span>{running ? 'Running…' : runLabel}</span>
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={onReset}
          disabled={running || (samples.length === 0 && totalProposed === 0)}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      <div className="mlviz-statcol mlviz-statrow" style={{ marginTop: 6 }}>
        <div className="mlviz-statcard mlviz-statcard-accent">
          <span className="mlviz-statcard-label">accept rate</span>
          <span className="mlviz-statcard-val">{totalProposed > 0 ? snap(acceptRate, 3) : '—'}</span>
        </div>
        <div className="mlviz-statcard mlviz-statcard-dim">
          <span className="mlviz-statcard-label">proposals kept</span>
          <span className="mlviz-statcard-val">{totalProposed > 0 ? `${samples.length} / ${totalProposed}` : '—'}</span>
          <span className="mlviz-statcard-sub">{totalProposed > 0 ? 'kept / proposed' : 'no proposals yet'}</span>
        </div>
      </div>
    </div>
  );
}

export default function SamplingViz() {
  const [seed, setSeed] = useState(42);

  // Rejection state.
  const [rejSamples, setRejSamples] = useState([]);
  const [rejTrail, setRejTrail] = useState([]); // each {x, u, accepted}
  const [rejProposed, setRejProposed] = useState(0);
  const [rejProposal, setRejProposal] = useState(null);
  const [rejRunning, setRejRunning] = useState(false);

  // MCMC state.
  const [mcSamples, setMcSamples] = useState([]);
  const [mcTrail, setMcTrail] = useState([]); // each {x, accepted}
  const [mcProposed, setMcProposed] = useState(0);
  const [mcAccepted, setMcAccepted] = useState(0); // number of accepted moves, for accept-rate readout
  const [mcProposal, setMcProposal] = useState(null);
  const [mcRunning, setMcRunning] = useState(false);

  const rejTimer = useRef(null);
  const mcTimer = useRef(null);
  const rejRngRef = useRef(null);
  const mcRngRef = useRef(null);
  const mcCurrentX = useRef(null);

  useEffect(() => () => {
    if (rejTimer.current) clearInterval(rejTimer.current);
    if (mcTimer.current) clearInterval(mcTimer.current);
  }, []);

  // Reset both panels when seed changes — seed is the deterministic source.
  // Tracked-dep render-phase reset for state; effect handles timer/ref cleanup.
  const [lastSeed, setLastSeed] = useState(seed);
  if (seed !== lastSeed) {
    setLastSeed(seed);
    setRejSamples([]); setRejTrail([]); setRejProposed(0); setRejProposal(null); setRejRunning(false);
    setMcSamples([]); setMcTrail([]); setMcProposed(0); setMcAccepted(0); setMcProposal(null); setMcRunning(false);
  }
  useEffect(() => {
    if (rejTimer.current) { clearInterval(rejTimer.current); rejTimer.current = null; }
    if (mcTimer.current) { clearInterval(mcTimer.current); mcTimer.current = null; }
    mcCurrentX.current = null;
    rejRngRef.current = null;
    mcRngRef.current = null;
  }, [seed]);

  const resetRej = useCallback(() => {
    if (rejTimer.current) { clearInterval(rejTimer.current); rejTimer.current = null; }
    setRejSamples([]); setRejTrail([]); setRejProposed(0); setRejProposal(null); setRejRunning(false);
    rejRngRef.current = null;
  }, []);

  const resetMc = useCallback(() => {
    if (mcTimer.current) { clearInterval(mcTimer.current); mcTimer.current = null; }
    setMcSamples([]); setMcTrail([]); setMcProposed(0); setMcAccepted(0); setMcProposal(null); setMcRunning(false);
    mcCurrentX.current = null;
    mcRngRef.current = null;
  }, []);

  const runRejection = useCallback(() => {
    if (rejRunning) return;
    if (rejSamples.length >= TOTAL_SAMPLES) return;
    if (!rejRngRef.current) rejRngRef.current = makeRng(seed);
    const rng = rejRngRef.current;
    setRejRunning(true);

    rejTimer.current = setInterval(() => {
      let stop = false;
      setRejSamples((prevSamples) => {
        if (prevSamples.length >= TOTAL_SAMPLES) {
          stop = true;
          return prevSamples;
        }
        let samples = prevSamples;
        let trailAdd = [];
        let proposedAdd = 0;
        let lastProp = null;

        for (let k = 0; k < PER_FRAME && samples.length < TOTAL_SAMPLES; k++) {
          const x = X_MIN + rng() * X_RANGE;
          const u = rng();
          const acceptProb = targetPdf(x) / (M_BOUND * UNIFORM_DENSITY);
          const accepted = u < acceptProb;
          // The trail dot's y position uses u * (M_BOUND * UNIFORM_DENSITY) so dots
          // beneath the target curve are accepted, above are rejected — a literal
          // reading of the rejection geometry.
          const uY = u * (M_BOUND * UNIFORM_DENSITY);
          trailAdd.push({ x, u: uY, accepted });
          proposedAdd += 1;
          lastProp = { x, accepted };
          if (accepted) samples = samples.concat([x]);
        }

        if (trailAdd.length) {
          setRejTrail((t) => {
            const next = t.concat(trailAdd);
            return next.length > REJECT_TRAIL_MAX ? next.slice(next.length - REJECT_TRAIL_MAX) : next;
          });
        }
        if (proposedAdd) setRejProposed((n) => n + proposedAdd);
        if (lastProp) setRejProposal(lastProp);
        if (samples.length >= TOTAL_SAMPLES) stop = true;
        return samples;
      });

      if (stop) {
        clearInterval(rejTimer.current);
        rejTimer.current = null;
        setRejRunning(false);
        // hold the last proposal marker briefly then clear
        setTimeout(() => setRejProposal(null), 600);
      }
    }, STEP_MS);
  }, [rejRunning, rejSamples.length, seed]);

  const runMcmc = useCallback(() => {
    if (mcRunning) return;
    if (mcSamples.length >= TOTAL_SAMPLES) return;
    if (!mcRngRef.current) mcRngRef.current = makeRng(seed ^ 0x9e3779b9);
    const rng = mcRngRef.current;
    if (mcCurrentX.current == null) {
      // initialize start from uniform on [-5, 5]
      mcCurrentX.current = X_MIN + rng() * X_RANGE;
      setMcTrail([{ x: mcCurrentX.current, accepted: true }]);
    }
    setMcRunning(true);

    mcTimer.current = setInterval(() => {
      let stop = false;
      setMcSamples((prevSamples) => {
        if (prevSamples.length >= TOTAL_SAMPLES) {
          stop = true;
          return prevSamples;
        }
        let samples = prevSamples;
        let trailAdd = [];
        let proposedAdd = 0;
        let acceptedAdd = 0;
        let lastProp = null;

        for (let k = 0; k < PER_FRAME && samples.length < TOTAL_SAMPLES; k++) {
          const curr = mcCurrentX.current;
          const step = gaussFromRng(rng) * PROPOSAL_SIGMA;
          const xp = curr + step;
          // Reject proposals outside support entirely (target=0 there).
          const numerator = targetPdf(xp);
          const denom = targetPdf(curr);
          const alpha = denom > 0 ? Math.min(1, numerator / denom) : (numerator > 0 ? 1 : 0);
          const u = rng();
          const accepted = u < alpha;
          proposedAdd += 1;
          if (accepted) {
            mcCurrentX.current = xp;
            acceptedAdd += 1;
          }
          trailAdd.push({ x: mcCurrentX.current, accepted });
          lastProp = { x: xp, accepted };
          samples = samples.concat([mcCurrentX.current]);
        }

        if (trailAdd.length) {
          setMcTrail((t) => {
            const next = t.concat(trailAdd);
            return next.length > MCMC_TRAIL_MAX ? next.slice(next.length - MCMC_TRAIL_MAX) : next;
          });
        }
        if (proposedAdd) setMcProposed((n) => n + proposedAdd);
        if (acceptedAdd) setMcAccepted((n) => n + acceptedAdd);
        if (lastProp) setMcProposal(lastProp);
        if (samples.length >= TOTAL_SAMPLES) stop = true;
        return samples;
      });

      if (stop) {
        clearInterval(mcTimer.current);
        mcTimer.current = null;
        setMcRunning(false);
        setTimeout(() => setMcProposal(null), 600);
      }
    }, STEP_MS);
  }, [mcRunning, mcSamples.length, seed]);

  const targetPath = useMemo(() => buildTargetPath(Y_MAX), []);
  const targetFill = useMemo(() => buildTargetFill(Y_MAX), []);
  const yAxisBase = yToPx(0, Y_MAX);

  const rejHist = useMemo(() => buildHistogram(rejSamples), [rejSamples]);
  const mcHist = useMemo(() => buildHistogram(mcSamples), [mcSamples]);

  const rejAcceptRate = rejProposed > 0 ? rejSamples.length / rejProposed : 0;
  const mcAcceptRate = mcProposed > 0 ? mcAccepted / mcProposed : 0;

  return (
    <div className="mlviz-wrap">
      <div
        className="mlviz-row"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch' }}
      >
        <Panel
          title="Rejection sampling"
          subtitle="q(x) = Uniform[-5, 5];  α = p(x) / (M · q(x))"
          target={targetPath}
          fill={targetFill}
          yAxisBase={yAxisBase}
          samples={rejSamples}
          trail={rejTrail}
          trailKind="reject"
          proposalMarker={rejProposal}
          histogram={rejHist}
          acceptRate={rejAcceptRate}
          totalProposed={rejProposed}
          runLabel="Run 100 samples"
          onRun={runRejection}
          onReset={resetRej}
          running={rejRunning}
          done={rejSamples.length >= TOTAL_SAMPLES}
          uniformBox
        />

        <Panel
          title="Metropolis-Hastings"
          subtitle={`x' = x + N(0, ${PROPOSAL_SIGMA});  α = min(1, p(x') / p(x))`}
          target={targetPath}
          fill={targetFill}
          yAxisBase={yAxisBase}
          samples={mcSamples}
          trail={mcTrail}
          trailKind="mcmc"
          proposalMarker={mcProposal}
          histogram={mcHist}
          acceptRate={mcAcceptRate}
          totalProposed={mcProposed}
          runLabel="Run 100 samples"
          onRun={runMcmc}
          onReset={resetMc}
          running={mcRunning}
          done={mcSamples.length >= TOTAL_SAMPLES}
          uniformBox={false}
        />
      </div>

      <div className="mlviz-readout" style={{ marginTop: 10 }}>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">seed</span>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10))}
              disabled={rejRunning || mcRunning}
            />
            <span className="mlviz-slider-val">{seed}</span>
          </label>
        </div>

        <div className="mlviz-hint">
          Rejection: uniform proposals get screened by the envelope M·q(x) — flat support means many wasted draws.
          Metropolis-Hastings: a random walk that biases toward higher density — proposals near the modes accept often, jumps across the valley rarely.
        </div>
      </div>
    </div>
  );
}
