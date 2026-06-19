import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  RotateCcw,
  Square,
  StepForward,
  Shuffle,
  FastForward,
} from 'lucide-react';
import './MLViz.css';

const SIZE = 460;
const PAD = 26;
const PLOT = SIZE - PAD * 2;
const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -6;
const Y_MAX = 6;

const N_POINTS = 60;
const K = 3;
const MAX_ITER = 60;
const CONVERGE_EPS = 1e-3;
const ANIM_MS = 520;
const PHASE_DELAY = 380;
const MIN_COV = 0.05;
const REG = 1e-4;

const COMPONENT_COLORS = [
  'var(--accent)',
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function xToPx(x) {
  return PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT;
}

function yToPx(y) {
  return PAD + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT;
}

function scaleX() {
  return PLOT / (X_MAX - X_MIN);
}

function scaleY() {
  return PLOT / (Y_MAX - Y_MIN);
}

function rngFrom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rand) {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generatePoints(seed) {
  const rand = rngFrom(seed * 17 + 91);
  const theta = rand() * Math.PI * 2;
  const radius = 3.0 + rand() * 0.5;
  const centers = [0, 1, 2].map((i) => {
    const a = theta + (i * Math.PI * 2) / 3;
    return {
      x: Math.cos(a) * radius + (rand() - 0.5) * 0.6,
      y: Math.sin(a) * radius + (rand() - 0.5) * 0.6,
    };
  });
  const spreads = [
    0.78 + rand() * 0.22,
    0.7 + rand() * 0.22,
    0.85 + rand() * 0.22,
  ];
  const pts = [];
  const per = Math.floor(N_POINTS / centers.length);
  for (let i = 0; i < N_POINTS; i++) {
    const idx = Math.min(centers.length - 1, Math.floor(i / per));
    const c = centers[idx];
    const sp = spreads[idx];
    const dx = boxMuller(rand) * sp;
    const dy = boxMuller(rand) * sp;
    const x = Math.max(X_MIN + 0.3, Math.min(X_MAX - 0.3, c.x + dx));
    const y = Math.max(Y_MIN + 0.3, Math.min(Y_MAX - 0.3, c.y + dy));
    pts.push({ x, y });
  }
  return { pts, trueCenters: centers };
}

function initComponents(seed) {
  const rand = rngFrom(seed * 53 + 7);
  const comps = [];
  for (let i = 0; i < K; i++) {
    const x = X_MIN + 1.0 + rand() * (X_MAX - X_MIN - 2.0);
    const y = Y_MIN + 1.0 + rand() * (Y_MAX - Y_MIN - 2.0);
    comps.push({
      pi: 1 / K,
      mu: { x, y },
      // 2x2 cov [[a,b],[b,c]] — start near-isotropic with mild noise.
      cov: {
        a: 1.4 + rand() * 0.4,
        b: (rand() - 0.5) * 0.2,
        c: 1.4 + rand() * 0.4,
      },
    });
  }
  return comps;
}

function gaussianPdf(x, y, mu, cov) {
  const a = cov.a;
  const b = cov.b;
  const c = cov.c;
  const det = a * c - b * b;
  if (det <= 1e-12) return 1e-300;
  const inv00 = c / det;
  const inv11 = a / det;
  const inv01 = -b / det;
  const dx = x - mu.x;
  const dy = y - mu.y;
  const mahal = dx * (inv00 * dx + inv01 * dy) + dy * (inv01 * dx + inv11 * dy);
  const norm = 1 / (2 * Math.PI * Math.sqrt(det));
  return norm * Math.exp(-0.5 * mahal);
}

function eStep(points, comps) {
  const N = points.length;
  const Kc = comps.length;
  const resp = Array.from({ length: N }, () => new Array(Kc).fill(0));
  let ll = 0;
  for (let n = 0; n < N; n++) {
    let total = 0;
    const row = new Array(Kc);
    for (let k = 0; k < Kc; k++) {
      const p = comps[k].pi * gaussianPdf(points[n].x, points[n].y, comps[k].mu, comps[k].cov);
      row[k] = p;
      total += p;
    }
    if (total <= 1e-300) {
      // Fallback uniform if numerics collapse — keeps responsibilities valid.
      for (let k = 0; k < Kc; k++) resp[n][k] = 1 / Kc;
      ll += Math.log(1e-300);
    } else {
      for (let k = 0; k < Kc; k++) resp[n][k] = row[k] / total;
      ll += Math.log(total);
    }
  }
  return { resp, ll };
}

function mStep(points, resp) {
  const N = points.length;
  const Kc = resp[0].length;
  const next = [];
  for (let k = 0; k < Kc; k++) {
    let Nk = 0;
    for (let n = 0; n < N; n++) Nk += resp[n][k];
    if (Nk < 1e-9) Nk = 1e-9;
    let mx = 0;
    let my = 0;
    for (let n = 0; n < N; n++) {
      mx += resp[n][k] * points[n].x;
      my += resp[n][k] * points[n].y;
    }
    mx /= Nk;
    my /= Nk;
    let a = 0;
    let b = 0;
    let c = 0;
    for (let n = 0; n < N; n++) {
      const dx = points[n].x - mx;
      const dy = points[n].y - my;
      const r = resp[n][k];
      a += r * dx * dx;
      b += r * dx * dy;
      c += r * dy * dy;
    }
    a = a / Nk + REG;
    b = b / Nk;
    c = c / Nk + REG;
    if (a < MIN_COV) a = MIN_COV;
    if (c < MIN_COV) c = MIN_COV;
    next.push({
      pi: Nk / N,
      mu: { x: mx, y: my },
      cov: { a, b, c },
    });
  }
  return next;
}

function argmax(row) {
  let best = 0;
  let bestV = -Infinity;
  for (let k = 0; k < row.length; k++) {
    if (row[k] > bestV) { bestV = row[k]; best = k; }
  }
  return best;
}

// Blend the component theme tokens by responsibility weights via nested
// color-mix — keeps the soft tint while staying token-only (no raw hex).
function softColor(weights) {
  let acc = COMPONENT_COLORS[0];
  let accW = weights[0] || 0;
  for (let k = 1; k < weights.length; k++) {
    const wk = weights[k] || 0;
    const total = accW + wk;
    if (total <= 1e-9) continue;
    const pct = ((wk / total) * 100).toFixed(2);
    acc = `color-mix(in srgb, ${COMPONENT_COLORS[k % COMPONENT_COLORS.length]} ${pct}%, ${acc})`;
    accW = total;
  }
  return acc;
}

// Eigen decomp of a symmetric 2x2 [[a,b],[b,c]] — returns half-axes (length, length)
// and rotation angle (rad).
function ellipseFromCov(cov, chi2 = 5.991) {
  const a = cov.a;
  const b = cov.b;
  const c = cov.c;
  const tr = a + c;
  const det = a * c - b * b;
  const disc = Math.max(0, (tr * tr) / 4 - det);
  const s = Math.sqrt(disc);
  const lam1 = tr / 2 + s;
  const lam2 = Math.max(1e-9, tr / 2 - s);
  // Eigenvector for lam1.
  let vx, vy;
  if (Math.abs(b) > 1e-9) {
    vx = lam1 - c;
    vy = b;
  } else if (a >= c) {
    vx = 1;
    vy = 0;
  } else {
    vx = 0;
    vy = 1;
  }
  const norm = Math.hypot(vx, vy) || 1;
  vx /= norm;
  vy /= norm;
  const angle = Math.atan2(vy, vx);
  const rx = Math.sqrt(lam1 * chi2);
  const ry = Math.sqrt(lam2 * chi2);
  return { rx, ry, angle };
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerpComps(a, b, t) {
  return a.map((ca, i) => {
    const cb = b[i];
    return {
      pi: ca.pi + (cb.pi - ca.pi) * t,
      mu: {
        x: ca.mu.x + (cb.mu.x - ca.mu.x) * t,
        y: ca.mu.y + (cb.mu.y - ca.mu.y) * t,
      },
      cov: {
        a: ca.cov.a + (cb.cov.a - ca.cov.a) * t,
        b: ca.cov.b + (cb.cov.b - ca.cov.b) * t,
        c: ca.cov.c + (cb.cov.c - ca.cov.c) * t,
      },
    };
  });
}

function compsDelta(a, b) {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    m = Math.max(m, Math.abs(a[i].mu.x - b[i].mu.x));
    m = Math.max(m, Math.abs(a[i].mu.y - b[i].mu.y));
    m = Math.max(m, Math.abs(a[i].cov.a - b[i].cov.a));
    m = Math.max(m, Math.abs(a[i].cov.b - b[i].cov.b));
    m = Math.max(m, Math.abs(a[i].cov.c - b[i].cov.c));
    m = Math.max(m, Math.abs(a[i].pi - b[i].pi));
  }
  return m;
}

function Grid() {
  const lines = [];
  for (let i = X_MIN; i <= X_MAX; i++) {
    const sy = yToPx(i);
    const sx = xToPx(i);
    const isZero = i === 0;
    lines.push(
      <line
        key={`h${i}`}
        x1={PAD}
        y1={sy}
        x2={SIZE - PAD}
        y2={sy}
        stroke="var(--border)"
        strokeWidth={isZero ? 1.1 : 0.4}
        opacity={isZero ? 0.85 : 0.32}
      />
    );
    lines.push(
      <line
        key={`v${i}`}
        x1={sx}
        y1={PAD}
        x2={sx}
        y2={SIZE - PAD}
        stroke="var(--border)"
        strokeWidth={isZero ? 1.1 : 0.4}
        opacity={isZero ? 0.85 : 0.32}
      />
    );
  }
  return <g>{lines}</g>;
}

function ComponentEllipse({ comp, color, label }) {
  const sx = scaleX();
  const sy = scaleY();
  const e1 = ellipseFromCov(comp.cov, 1.0);
  const e2 = ellipseFromCov(comp.cov, 5.991);
  const cx = xToPx(comp.mu.x);
  const cy = yToPx(comp.mu.y);
  const deg = -(e1.angle * 180) / Math.PI;
  return (
    <g>
      <g transform={`translate(${cx} ${cy}) rotate(${deg})`}>
        <ellipse
          cx={0}
          cy={0}
          rx={e2.rx * sx}
          ry={e2.ry * sy}
          fill={color}
          opacity={0.06}
        />
        <ellipse
          cx={0}
          cy={0}
          rx={e2.rx * sx}
          ry={e2.ry * sy}
          fill="none"
          stroke={color}
          strokeWidth={1.1}
          strokeDasharray="3 3"
          opacity={0.65}
        />
        <ellipse
          cx={0}
          cy={0}
          rx={e1.rx * sx}
          ry={e1.ry * sy}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          opacity={0.95}
        />
      </g>
      <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--bg)" strokeWidth={1.6} />
      <text
        x={cx + 8}
        y={cy - 9}
        fill={color}
        fontSize="10"
        fontFamily="var(--mono)"
        fontWeight="700"
      >
        {label}
      </text>
    </g>
  );
}

export default function EMAlgorithmViz() {
  const animRef = useRef(null);
  const runningRef = useRef(false);
  const cancelRef = useRef(false);

  const [dataSeed, setDataSeed] = useState(1);
  const [initSeed, setInitSeed] = useState(1);

  const { pts: points } = useMemo(() => generatePoints(dataSeed), [dataSeed]);

  const [comps, setComps] = useState(() => initComponents(1));
  const [renderComps, setRenderComps] = useState(comps);
  const [resp, setResp] = useState(() =>
    Array.from({ length: N_POINTS }, () => new Array(K).fill(1 / K))
  );
  const [iter, setIter] = useState(0);
  const [phase, setPhase] = useState('init'); // 'init' | 'E' | 'M' | 'converged'
  const [llHistory, setLlHistory] = useState([]);
  const [converged, setConverged] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastDelta, setLastDelta] = useState(null);

  const cancelAnim = useCallback(() => {
    cancelRef.current = true;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      runningRef.current = false;
      cancelAnim();
    },
    [cancelAnim]
  );

  // State-only reset (safe at render-phase); imperative ref/anim cleanup lives
  // in a sibling effect below.
  const hardResetState = useCallback((seed) => {
    setRunning(false);
    const c0 = initComponents(seed);
    setComps(c0);
    setRenderComps(c0);
    setResp(Array.from({ length: N_POINTS }, () => new Array(K).fill(1 / K)));
    setIter(0);
    setPhase('init');
    setConverged(false);
    setLlHistory([]);
    setLastDelta(null);
  }, []);

  // Reset on seed changes. Tracked-dep render-phase reset for state; effect
  // handles ref/animation cancellation (React's recommended pattern over
  // setState-in-effect cascades).
  const [lastSeedKey, setLastSeedKey] = useState(`${initSeed}|${dataSeed}`);
  const seedKey = `${initSeed}|${dataSeed}`;
  if (seedKey !== lastSeedKey) {
    setLastSeedKey(seedKey);
    hardResetState(initSeed);
  }

  useEffect(() => {
    runningRef.current = false;
    cancelAnim();
    cancelRef.current = false;
  }, [initSeed, dataSeed, cancelAnim]);

  const animateComps = useCallback(
    (from, to) =>
      new Promise((resolve) => {
        cancelRef.current = false;
        const start = performance.now();
        const tick = (now) => {
          if (cancelRef.current) {
            setRenderComps(to);
            resolve();
            return;
          }
          const t = Math.min(1, (now - start) / ANIM_MS);
          const e = easeInOut(t);
          setRenderComps(lerpComps(from, to, e));
          if (t < 1) {
            animRef.current = requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        animRef.current = requestAnimationFrame(tick);
      }),
    []
  );

  const wait = useCallback(
    (ms) =>
      new Promise((resolve) => {
        const start = performance.now();
        const tick = (now) => {
          if (cancelRef.current) { resolve(); return; }
          if (now - start >= ms) { resolve(); return; }
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      }),
    []
  );

  const doEStep = useCallback(async () => {
    const { resp: r, ll } = eStep(points, comps);
    setResp(r);
    setPhase('E');
    setLlHistory((h) => [...h, ll]);
    await wait(PHASE_DELAY);
    return { resp: r, ll };
  }, [comps, points, wait]);

  const doMStep = useCallback(
    async (rGiven) => {
      const r = rGiven || resp;
      const next = mStep(points, r);
      const d = compsDelta(comps, next);
      setLastDelta(d);
      setPhase('M');
      await animateComps(comps, next);
      setComps(next);
      setRenderComps(next);
      setIter((n) => n + 1);
      const did = d < CONVERGE_EPS;
      setConverged(did);
      if (did) setPhase('converged');
      return { next, delta: d, converged: did };
    },
    [animateComps, comps, points, resp]
  );

  const handleStepE = useCallback(async () => {
    if (runningRef.current || converged) return;
    runningRef.current = true;
    setRunning(true);
    await doEStep();
    runningRef.current = false;
    setRunning(false);
  }, [converged, doEStep]);

  const handleStepM = useCallback(async () => {
    if (runningRef.current || converged) return;
    runningRef.current = true;
    setRunning(true);
    await doMStep();
    runningRef.current = false;
    setRunning(false);
  }, [converged, doMStep]);

  const handleStepEM = useCallback(async () => {
    if (runningRef.current || converged) return;
    runningRef.current = true;
    setRunning(true);
    const { resp: r } = await doEStep();
    if (!cancelRef.current) await doMStep(r);
    runningRef.current = false;
    setRunning(false);
  }, [converged, doEStep, doMStep]);

  const handleRun = useCallback(async () => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      cancelAnim();
      return;
    }
    if (converged) return;
    runningRef.current = true;
    setRunning(true);
    cancelRef.current = false;
    let curComps = comps;
    let count = 0;
    while (runningRef.current && count < MAX_ITER) {
      const { resp: r, ll } = eStep(points, curComps);
      setResp(r);
      setPhase('E');
      setLlHistory((h) => [...h, ll]);
      await wait(PHASE_DELAY);
      if (!runningRef.current || cancelRef.current) break;
      const next = mStep(points, r);
      const d = compsDelta(curComps, next);
      setLastDelta(d);
      setPhase('M');
      await animateComps(curComps, next);
      if (!runningRef.current || cancelRef.current) break;
      curComps = next;
      setComps(next);
      setRenderComps(next);
      setIter((n) => n + 1);
      count += 1;
      if (d < CONVERGE_EPS) {
        setConverged(true);
        setPhase('converged');
        break;
      }
      await wait(PHASE_DELAY / 2);
    }
    runningRef.current = false;
    setRunning(false);
  }, [animateComps, cancelAnim, comps, converged, points, wait]);

  const handleReset = useCallback(() => {
    setInitSeed((s) => (s + 1) >>> 0);
  }, []);

  const handleNewData = useCallback(() => {
    setDataSeed((s) => (s + 1) >>> 0);
  }, []);

  const lastLL = llHistory.length ? llHistory[llHistory.length - 1] : null;

  const phaseLabel = (() => {
    switch (phase) {
      case 'E':
        return 'E-step · responsibilities';
      case 'M':
        return 'M-step · update params';
      case 'converged':
        return 'converged';
      default:
        return 'ready';
    }
  })();

  const sparkline = useMemo(() => {
    if (llHistory.length < 2) return null;
    const w = 160;
    const h = 36;
    const max = Math.max(...llHistory);
    const min = Math.min(...llHistory);
    const range = Math.max(1e-6, max - min);
    const pts = llHistory.map((v, i) => {
      const x = (i / Math.max(1, llHistory.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { w, h, pts: pts.join(' '), min, max };
  }, [llHistory]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg" style={{ maxWidth: 560 }}>
          <defs>
            <linearGradient id="em-spark-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="em-spark-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
            <filter id="em-pt-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </defs>
          <Grid />

          {/* Data points colored by responsibility blend. */}
          {points.map((p, i) => {
            const w = resp[i];
            const hard = argmax(w);
            const fill = softColor(w);
            const stroke = COMPONENT_COLORS[hard % COMPONENT_COLORS.length];
            const cx = xToPx(p.x);
            const cy = yToPx(p.y);
            return (
              <g key={`pt${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={5.6}
                  fill={stroke}
                  opacity={0.32}
                  filter="url(#em-pt-glow)"
                  style={{ transition: 'fill 0.4s ease' }}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={4.2}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.8}
                  opacity={0.95}
                  style={{ transition: 'fill 0.4s ease' }}
                />
              </g>
            );
          })}

          {/* Gaussian fits as ellipses. */}
          {renderComps.map((c, k) => (
            <ComponentEllipse
              key={`comp${k}`}
              comp={c}
              color={COMPONENT_COLORS[k % COMPONENT_COLORS.length]}
              label={`μ${k + 1}`}
            />
          ))}

          {/* Log-likelihood sparkline. */}
          {sparkline && (
            <g transform={`translate(${SIZE - PAD - sparkline.w - 8} ${SIZE - PAD - sparkline.h - 6})`}>
              <rect
                x={-6}
                y={-6}
                width={sparkline.w + 12}
                height={sparkline.h + 12}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth="0.6"
                rx="4"
                opacity="0.92"
              />
              <polyline
                points={sparkline.pts}
                fill="none"
                stroke="url(#em-spark-grad)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#em-spark-glow)"
                opacity="0.55"
              />
              <polyline
                points={sparkline.pts}
                fill="none"
                stroke="url(#em-spark-grad)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x={0}
                y={-8}
                fontSize="8"
                fontFamily="var(--mono)"
                fill="var(--text-dim)"
                letterSpacing="0.1em"
              >
                LOG-LIKELIHOOD
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>EM</span>
          <span className="mlviz-val">K = {K}</span>
          <span className="mlviz-sub">iter {iter}</span>
          <span className="mlviz-sub">
            log L {lastLL !== null ? snap(lastLL, 2) : '—'}
          </span>
          {lastDelta !== null && (
            <span className="mlviz-sub">Δ {snap(lastDelta, 4)}</span>
          )}
          <span
            className="mlviz-sub"
            style={{
              color: converged
                ? 'var(--hue-mint, #74e3a3)'
                : 'var(--text-dim)',
            }}
          >
            {phaseLabel}
          </span>
        </div>

        <div className="mlviz-row" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
          {renderComps.map((c, k) => (
            <span
              key={`mix${k}`}
              className="mlviz-toggle"
              style={{
                '--toggle-color': COMPONENT_COLORS[k % COMPONENT_COLORS.length],
                cursor: 'default',
                color: 'var(--text-main)',
                borderColor: COMPONENT_COLORS[k % COMPONENT_COLORS.length],
                background: `color-mix(in srgb, ${COMPONENT_COLORS[k % COMPONENT_COLORS.length]} 10%, transparent)`,
              }}
            >
              <span className="mlviz-toggle-dot" />
              π{k + 1}={snap(c.pi, 2)} · μ=({snap(c.mu.x, 1)}, {snap(c.mu.y, 1)})
            </span>
          ))}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStepE}
            disabled={running || converged}
            title="Compute responsibilities r_nk for all points"
          >
            <StepForward size={13} />
            <span>Step E</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStepM}
            disabled={running || converged}
            title="Update π, μ, Σ from current responsibilities"
          >
            <StepForward size={13} />
            <span>Step M</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStepEM}
            disabled={running || converged}
            title="Run one full E + M iteration"
          >
            <FastForward size={13} />
            <span>Step EM</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={converged && !running}
            title="Run until log-likelihood stabilises"
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run to convergence'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
            title="Re-initialise components with a new seed"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewData}
            disabled={running}
            title="Resample 60 points from a fresh 3-cluster mixture"
          >
            <Shuffle size={13} />
            <span>Sample new data</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {converged
            ? `converged in ${iter} iteration${iter === 1 ? '' : 's'} · log L ${
                lastLL !== null ? snap(lastLL, 2) : '—'
              }`
            : 'E-step: soft-assign each point · M-step: refit each gaussian to its weighted points'}
        </div>
      </div>
    </div>
  );
}
