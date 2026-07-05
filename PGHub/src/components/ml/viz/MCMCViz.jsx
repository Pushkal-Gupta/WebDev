import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw, StepForward, FastForward } from 'lucide-react';
import './MLViz.css';

// Two stacked / side-by-side SVG panels: left = chain over target heatmap,
// right = empirical histogram of accumulated samples. Domain is the square
// [-4, 4] x [-4, 4]; target is a 3-component gaussian mixture.

const W = 380;
const H = 360;
const PAD_L = 32;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 30;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const DOM_MIN = -4;
const DOM_MAX = 4;
const DOM_RANGE = DOM_MAX - DOM_MIN;

const HEAT_BINS = 32;
const TRAIL_MAX = 100;
const STEP_BATCH = 50; // steps per animation frame when "run 1000"
const RUN_TARGET = 1000;
const FRAME_MS = 22;

// Target: mixture of 3 anisotropic gaussians.
const MIXTURE = [
  { w: 0.40, mux: -1.8, muy: -1.2, sx: 0.55, sy: 0.55 },
  { w: 0.35, mux:  1.6, muy:  1.4, sx: 0.65, sy: 0.40 },
  { w: 0.25, mux:  0.2, muy: -1.8, sx: 0.50, sy: 0.70 },
];

function gauss2(x, y, mux, muy, sx, sy) {
  const dx = (x - mux) / sx;
  const dy = (y - muy) / sy;
  return Math.exp(-0.5 * (dx * dx + dy * dy)) / (2 * Math.PI * sx * sy);
}

function targetPdf(x, y) {
  let s = 0;
  for (const m of MIXTURE) s += m.w * gauss2(x, y, m.mux, m.muy, m.sx, m.sy);
  return s;
}

// --- seeded RNG (Mulberry32) ---
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

function gaussFromRng(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function xToPx(x) {
  return PAD_L + ((x - DOM_MIN) / DOM_RANGE) * PLOT_W;
}
function yToPx(y) {
  // y goes up on screen → invert
  return PAD_T + (1 - (y - DOM_MIN) / DOM_RANGE) * PLOT_H;
}

// Precompute target density grid for the heatmap. Bin (i, j) -> density at
// bin center.
function buildTargetGrid() {
  const cell = DOM_RANGE / HEAT_BINS;
  const grid = new Array(HEAT_BINS * HEAT_BINS);
  let maxD = 0;
  for (let j = 0; j < HEAT_BINS; j++) {
    const yc = DOM_MIN + (j + 0.5) * cell;
    for (let i = 0; i < HEAT_BINS; i++) {
      const xc = DOM_MIN + (i + 0.5) * cell;
      const d = targetPdf(xc, yc);
      grid[j * HEAT_BINS + i] = d;
      if (d > maxD) maxD = d;
    }
  }
  return { grid, maxD, cell };
}

const TARGET_GRID = buildTargetGrid();

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function buildHistogram(samples) {
  const counts = new Array(HEAT_BINS * HEAT_BINS).fill(0);
  if (!samples.length) return { counts, maxC: 0 };
  const cell = DOM_RANGE / HEAT_BINS;
  let maxC = 0;
  for (const s of samples) {
    if (s.x < DOM_MIN || s.x > DOM_MAX || s.y < DOM_MIN || s.y > DOM_MAX) continue;
    let i = Math.floor((s.x - DOM_MIN) / cell);
    let j = Math.floor((s.y - DOM_MIN) / cell);
    if (i === HEAT_BINS) i = HEAT_BINS - 1;
    if (j === HEAT_BINS) j = HEAT_BINS - 1;
    const idx = j * HEAT_BINS + i;
    counts[idx] += 1;
    if (counts[idx] > maxC) maxC = counts[idx];
  }
  return { counts, maxC };
}

function HeatGrid({ values, maxV, cellPx, opacityScale = 1, colorVar = 'var(--accent-rgb, 102, 153, 255)' }) {
  if (maxV <= 0) return null;
  const out = [];
  for (let j = 0; j < HEAT_BINS; j++) {
    for (let i = 0; i < HEAT_BINS; i++) {
      const v = values[j * HEAT_BINS + i];
      if (v <= 0) continue;
      const t = v / maxV;
      if (t < 0.01) continue;
      const px = PAD_L + i * cellPx;
      const py = PAD_T + (HEAT_BINS - 1 - j) * cellPx;
      out.push(
        <rect
          key={`h${i}-${j}`}
          x={px}
          y={py}
          width={cellPx + 0.4}
          height={cellPx + 0.4}
          fill={`rgba(${colorVar}, ${(Math.pow(t, 0.6) * opacityScale).toFixed(3)})`}
        />
      );
    }
  }
  return <g>{out}</g>;
}

function Axes({ yAxisBase, xRight, label }) {
  return (
    <g>
      <line x1={PAD_L} y1={yAxisBase} x2={xRight} y2={yAxisBase} stroke="var(--border)" strokeWidth="1" />
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={yAxisBase} stroke="var(--border)" strokeWidth="1" />
      {[-3, -1.5, 0, 1.5, 3].map((tx) => {
        const px = xToPx(tx);
        return (
          <g key={`xt${tx}`}>
            <line x1={px} y1={yAxisBase} x2={px} y2={yAxisBase + 4} stroke="var(--border)" strokeWidth="1" />
            <text x={px} y={yAxisBase + 15} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle">{tx}</text>
          </g>
        );
      })}
      {[-3, -1.5, 0, 1.5, 3].map((ty) => {
        const py = yToPx(ty);
        return (
          <g key={`yt${ty}`}>
            <line x1={PAD_L - 4} y1={py} x2={PAD_L} y2={py} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD_L - 6} y={py + 3} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="end">{ty}</text>
          </g>
        );
      })}
      <text x={xRight} y={yAxisBase + 24} fontSize="13" fill="var(--text-dim)" fontFamily="var(--serif, serif)" fontStyle="italic" textAnchor="end">{label || 'x'}</text>
      <text x={PAD_L - 4} y={PAD_T + 2} fontSize="12.5" fill="var(--text-dim)" fontFamily="var(--serif, serif)" fontStyle="italic" textAnchor="end">y</text>
    </g>
  );
}

// Proposal blob: a translucent disc whose radius reflects the proposal sigma.
function ProposalBlob({ cx, cy, sigma }) {
  // Convert sigma in data units to pixels.
  const radPx = (sigma / DOM_RANGE) * PLOT_W;
  return (
    <g>
      <circle cx={cx} cy={cy} r={radPx * 2.0} fill="var(--hue-pink, #ff66cc)" fillOpacity="0.05" stroke="var(--hue-pink, #ff66cc)" strokeOpacity="0.25" strokeDasharray="2 3" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={radPx * 1.0} fill="var(--hue-pink, #ff66cc)" fillOpacity="0.10" stroke="var(--hue-pink, #ff66cc)" strokeOpacity="0.55" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={2.6} fill="var(--hue-pink, #ff66cc)" stroke="var(--bg)" strokeWidth="0.6" />
    </g>
  );
}

export default function MCMCViz() {
  const [seed, setSeed] = useState(7);
  const [sigma, setSigma] = useState(0.6);

  const [samples, setSamples] = useState([]);
  const [trail, setTrail] = useState([]); // last positions [{x,y,accepted}]
  const [proposed, setProposed] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [proposal, setProposal] = useState(null); // last proposed point
  const [running, setRunning] = useState(false);

  const rngRef = useRef(null);
  const currRef = useRef(null); // {x, y}
  const timerRef = useRef(null);
  const remainingRef = useRef(0); // steps remaining in current run

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRunning(false);
  }, []);

  const ensureInit = useCallback(() => {
    if (!rngRef.current) rngRef.current = makeRng(seed);
    if (!currRef.current) {
      const rng = rngRef.current;
      // start far from the modes to make burn-in visible
      const sx = DOM_MIN + rng() * DOM_RANGE;
      const sy = DOM_MIN + rng() * DOM_RANGE;
      currRef.current = { x: sx, y: sy };
      setTrail([{ x: sx, y: sy, accepted: true }]);
    }
  }, [seed]);

  // One Metropolis-Hastings step. Returns { accepted, proposalPoint }.
  const oneStep = useCallback(() => {
    const rng = rngRef.current;
    const curr = currRef.current;
    const dx = gaussFromRng(rng) * sigma;
    const dy = gaussFromRng(rng) * sigma;
    const xp = curr.x + dx;
    const yp = curr.y + dy;
    const num = targetPdf(xp, yp);
    const den = targetPdf(curr.x, curr.y);
    const alpha = den > 0 ? Math.min(1, num / den) : (num > 0 ? 1 : 0);
    const u = rng();
    const acc = u < alpha;
    if (acc) currRef.current = { x: xp, y: yp };
    return { accepted: acc, proposalPoint: { x: xp, y: yp, accepted: acc } };
  }, [sigma]);

  // Batch a number of steps and commit state.
  const runBatch = useCallback((n) => {
    let accCount = 0;
    const newTrail = [];
    const newSamples = [];
    let lastProp = null;
    for (let k = 0; k < n; k++) {
      const r = oneStep();
      if (r.accepted) accCount += 1;
      const c = currRef.current;
      newTrail.push({ x: c.x, y: c.y, accepted: r.accepted });
      newSamples.push({ x: c.x, y: c.y });
      lastProp = r.proposalPoint;
    }
    setSamples((prev) => prev.concat(newSamples));
    setTrail((prev) => {
      const next = prev.concat(newTrail);
      return next.length > TRAIL_MAX ? next.slice(next.length - TRAIL_MAX) : next;
    });
    setProposed((n2) => n2 + n);
    setAccepted((n2) => n2 + accCount);
    if (lastProp) setProposal(lastProp);
  }, [oneStep]);

  const handleStepOnce = useCallback(() => {
    if (running) return;
    ensureInit();
    runBatch(1);
  }, [running, ensureInit, runBatch]);

  const handleRun1000 = useCallback(() => {
    if (running) return;
    ensureInit();
    remainingRef.current = RUN_TARGET;
    setRunning(true);
    timerRef.current = setInterval(() => {
      const take = Math.min(STEP_BATCH, remainingRef.current);
      if (take <= 0) {
        stopTimer();
        setTimeout(() => setProposal(null), 600);
        return;
      }
      runBatch(take);
      remainingRef.current -= take;
      if (remainingRef.current <= 0) {
        stopTimer();
        setTimeout(() => setProposal(null), 600);
      }
    }, FRAME_MS);
  }, [running, ensureInit, runBatch, stopTimer]);

  const handleReset = useCallback(() => {
    stopTimer();
    setSamples([]);
    setTrail([]);
    setProposed(0);
    setAccepted(0);
    setProposal(null);
    currRef.current = null;
    rngRef.current = null;
    remainingRef.current = 0;
  }, [stopTimer]);

  // Reset whenever the seed changes; keep sigma reactive without reset.
  // Tracked-dep render-phase reset for state; effect handles timer/ref cleanup.
  const [lastSeed, setLastSeed] = useState(seed);
  if (seed !== lastSeed) {
    setLastSeed(seed);
    setRunning(false);
    setSamples([]);
    setTrail([]);
    setProposed(0);
    setAccepted(0);
    setProposal(null);
  }

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    currRef.current = null;
    rngRef.current = null;
    remainingRef.current = 0;
  }, [seed]);

  const cellPx = PLOT_W / HEAT_BINS;
  const yAxisBase = yToPx(DOM_MIN);
  const xRight = xToPx(DOM_MAX);

  const empHist = useMemo(() => buildHistogram(samples), [samples]);
  const acceptRate = proposed > 0 ? accepted / proposed : 0;

  // Trail polyline (last 100 positions).
  const trailPath = useMemo(() => {
    if (trail.length < 2) return '';
    return trail.map((p, i) => `${i === 0 ? 'M' : 'L'}${xToPx(p.x).toFixed(2)},${yToPx(p.y).toFixed(2)}`).join(' ');
  }, [trail]);

  // Current chain head.
  const head = trail.length ? trail[trail.length - 1] : null;
  const headPx = head ? { x: xToPx(head.x), y: yToPx(head.y) } : null;

  return (
    <div className="mlviz-wrap">
      <div
        className="mlviz-row"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch' }}
      >
        {/* Panel 1: target heatmap + chain trail */}
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
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--text-main)',
                letterSpacing: '0.2px',
              }}>Target  p(x, y)  +  chain trail</div>
              <div style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 11.5,
                color: 'var(--text-dim)',
                marginTop: 1,
              }}>3-mode mixture · last {TRAIL_MAX} positions of the walk</div>
            </div>
            <div style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: 11.5,
              color: 'var(--text-dim)',
            }}>
              step {proposed}
            </div>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
            <defs>
              <linearGradient id="mcmc-trail-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--hue-mint)" />
                <stop offset="100%" stopColor="var(--easy, #2ecc71)" />
              </linearGradient>
              <filter id="mcmc-trail-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
              <radialGradient id="mcmc-head-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--easy, #2ecc71)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--easy, #2ecc71)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* target heatmap */}
            <HeatGrid values={TARGET_GRID.grid} maxV={TARGET_GRID.maxD} cellPx={cellPx} opacityScale={0.9} colorVar="var(--accent-rgb, 102, 153, 255)" />

            {/* gridlines */}
            {[-3, -1.5, 0, 1.5, 3].map((tx) => (
              <line key={`gx${tx}`} x1={xToPx(tx)} y1={PAD_T} x2={xToPx(tx)} y2={yAxisBase} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity={tx === 0 ? 0.55 : 0.25} />
            ))}
            {[-3, -1.5, 0, 1.5, 3].map((ty) => (
              <line key={`gy${ty}`} x1={PAD_L} y1={yToPx(ty)} x2={xRight} y2={yToPx(ty)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity={ty === 0 ? 0.55 : 0.25} />
            ))}

            <Axes yAxisBase={yAxisBase} xRight={xRight} label="x" />

            {/* chain trail (glowing gradient) */}
            {trailPath && (
              <>
                <path d={trailPath} fill="none" stroke="url(#mcmc-trail-grad)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" filter="url(#mcmc-trail-glow)" opacity="0.4" />
                <path d={trailPath} fill="none" stroke="url(#mcmc-trail-grad)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
              </>
            )}
            {trail.length > 0 && trail.slice(-30).map((p, i, arr) => {
              const fade = 0.25 + 0.65 * (i / Math.max(1, arr.length - 1));
              return (
                <circle
                  key={`tp${i}`}
                  cx={xToPx(p.x)}
                  cy={yToPx(p.y)}
                  r={i === arr.length - 1 ? 0 : 1.8}
                  fill={p.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
                  opacity={fade}
                />
              );
            })}

            {/* glow halo on the active chain head */}
            {headPx && (
              <circle cx={headPx.x} cy={headPx.y} r="12" fill="url(#mcmc-head-glow)" pointerEvents="none" />
            )}

            {/* proposal blob at the current chain head */}
            {headPx && (
              <ProposalBlob cx={headPx.x} cy={headPx.y} sigma={sigma} />
            )}

            {/* last proposed point (if rejected, show outside the head ring) */}
            {proposal && (
              <g>
                <line
                  x1={headPx ? headPx.x : xToPx(proposal.x)}
                  y1={headPx ? headPx.y : yToPx(proposal.y)}
                  x2={xToPx(proposal.x)}
                  y2={yToPx(proposal.y)}
                  stroke={proposal.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                  opacity="0.85"
                />
                <circle
                  cx={xToPx(proposal.x)}
                  cy={yToPx(proposal.y)}
                  r={3.2}
                  fill="none"
                  stroke={proposal.accepted ? 'var(--easy, #2ecc71)' : 'var(--hard, #ff5e5e)'}
                  strokeWidth="1.2"
                  opacity="0.95"
                />
              </g>
            )}

            {/* mode markers */}
            {MIXTURE.map((m, i) => (
              <g key={`mode${i}`}>
                <circle cx={xToPx(m.mux)} cy={yToPx(m.muy)} r={2.2} fill="var(--accent)" opacity="0.75" />
              </g>
            ))}

            {/* legend */}
            <g transform={`translate(${PAD_L + 4}, ${PAD_T + 4})`}>
              <rect x={0} y={2} width={10} height={8} fill="var(--accent)" fillOpacity="0.55" />
              <text x={15} y={10} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">target</text>
              <circle cx={72} cy={6} r={2.8} fill="var(--easy, #2ecc71)" />
              <text x={79} y={10} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">accept</text>
              <circle cx={136} cy={6} r={2.8} fill="var(--hard, #ff5e5e)" />
              <text x={143} y={10} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">reject</text>
              <circle cx={196} cy={6} r={2.8} fill="var(--hue-pink, #ff66cc)" />
              <text x={203} y={10} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">proposal σ</text>
            </g>
          </svg>
        </div>

        {/* Panel 2: empirical histogram of accumulated samples */}
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
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--text-main)',
                letterSpacing: '0.2px',
              }}>Sampled distribution  q̂(x, y)</div>
              <div style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 11.5,
                color: 'var(--text-dim)',
                marginTop: 1,
              }}>2D histogram of every kept chain state</div>
            </div>
            <div style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: 11.5,
              color: 'var(--text-dim)',
            }}>
              N = {samples.length}
            </div>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
            {/* faint target outline grid (for comparison) */}
            <HeatGrid values={TARGET_GRID.grid} maxV={TARGET_GRID.maxD} cellPx={cellPx} opacityScale={0.18} colorVar="var(--accent-rgb, 102, 153, 255)" />

            {/* gridlines */}
            {[-3, -1.5, 0, 1.5, 3].map((tx) => (
              <line key={`gx2${tx}`} x1={xToPx(tx)} y1={PAD_T} x2={xToPx(tx)} y2={yAxisBase} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity={tx === 0 ? 0.55 : 0.25} />
            ))}
            {[-3, -1.5, 0, 1.5, 3].map((ty) => (
              <line key={`gy2${ty}`} x1={PAD_L} y1={yToPx(ty)} x2={xRight} y2={yToPx(ty)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity={ty === 0 ? 0.55 : 0.25} />
            ))}

            <Axes yAxisBase={yAxisBase} xRight={xRight} label="x" />

            {/* sampled histogram */}
            <HeatGrid values={empHist.counts} maxV={empHist.maxC} cellPx={cellPx} opacityScale={1.0} colorVar="46, 204, 113" />

            {/* mode markers (truth reference) */}
            {MIXTURE.map((m, i) => (
              <g key={`mode2${i}`}>
                <circle cx={xToPx(m.mux)} cy={yToPx(m.muy)} r={3} fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.85" />
              </g>
            ))}

            {/* legend */}
            <g transform={`translate(${PAD_L + 6}, ${PAD_T + 4})`}>
              <rect x={0} y={2} width={10} height={8} fill="color-mix(in srgb, var(--hue-mint) 65%, transparent)" />
              <text x={15} y={10} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">samples</text>
              <circle cx={84} cy={6} r={3.2} fill="none" stroke="var(--accent)" strokeWidth="1.2" />
              <text x={91} y={10} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">mode μ</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="mlviz-readout" style={{ marginTop: 10 }}>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">proposal σ</span>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{sigma.toFixed(2)}</span>
          </label>

          <label className="mlviz-slider">
            <span className="mlviz-slider-label">seed</span>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{seed}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStepOnce}
            disabled={running}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun1000}
            disabled={running}
          >
            {running ? <Play size={13} /> : <FastForward size={13} />}
            <span>{running ? 'Running…' : 'Run 1000 steps'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running || (samples.length === 0 && proposed === 0)}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-statrow" style={{ marginTop: 8 }}>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">accept rate</span>
            <span className="mlviz-statcard-val">{proposed > 0 ? snap(acceptRate, 3) : '—'}</span>
            <span className="mlviz-statcard-sub">
              {proposed > 0 ? `${accepted} / ${proposed} accepted` : 'no proposals yet'}
            </span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">kept samples</span>
            <span className="mlviz-statcard-val">{samples.length}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">steps</span>
            <span className="mlviz-statcard-val">{proposed}</span>
          </div>
        </div>

        <div className="mlviz-hint">
          Metropolis-Hastings on a 3-mode 2D mixture. The pink blob is the gaussian proposal centred at the current chain state. Big σ jumps far but most proposals fall into low-density regions and get rejected; small σ accepts almost everything but the chain crawls and rarely escapes a mode. The right panel is the empirical density built from the kept samples — with enough steps it converges to the target on the left.
        </div>
      </div>
    </div>
  );
}
