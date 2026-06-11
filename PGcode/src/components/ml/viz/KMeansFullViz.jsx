import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Play,
  StepForward,
  RotateCcw,
  Square,
  Shuffle,
  Sparkles,
  Dice5,
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
const MAX_K = 6;
const MIN_K = 2;
const CONVERGE_EPS = 0.005;
const MAX_ITER = 40;
const TRAIL_LIMIT = 16;

const PHASE_DELAY = 520;
const ANIM_FRAMES = 18;
const ANIM_MS = 520;

const CLUSTER_COLORS = [
  'var(--accent)',
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
  'var(--hue-mint, #74e3a3)',
  'var(--warning, #f5a623)',
  'var(--hue-violet, #b884ff)',
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
  // Three well-separated centers, randomly rotated so each new seed feels fresh.
  const theta = rand() * Math.PI * 2;
  const radius = 3.0 + rand() * 0.5;
  const centers = [0, 1, 2].map((i) => {
    const a = theta + (i * Math.PI * 2) / 3;
    return {
      x: Math.cos(a) * radius + (rand() - 0.5) * 0.6,
      y: Math.sin(a) * radius + (rand() - 0.5) * 0.6,
    };
  });
  const spread = 0.78 + rand() * 0.18;
  const pts = [];
  const per = Math.floor(N_POINTS / centers.length);
  for (let i = 0; i < N_POINTS; i++) {
    const idx = Math.min(centers.length - 1, Math.floor(i / per));
    const c = centers[idx];
    const dx = boxMuller(rand) * spread;
    const dy = boxMuller(rand) * spread;
    const x = Math.max(X_MIN + 0.3, Math.min(X_MAX - 0.3, c.x + dx));
    const y = Math.max(Y_MIN + 0.3, Math.min(Y_MAX - 0.3, c.y + dy));
    pts.push({ x, y });
  }
  return { pts, trueCenters: centers };
}

function randomInit(seed, k) {
  const rand = rngFrom(seed * 53 + 7);
  const cs = [];
  for (let i = 0; i < k; i++) {
    const x = X_MIN + 0.8 + rand() * (X_MAX - X_MIN - 1.6);
    const y = Y_MIN + 0.8 + rand() * (Y_MAX - Y_MIN - 1.6);
    cs.push({ x, y });
  }
  return cs;
}

// k-means++ initialization. Picks first centroid uniformly, then each next with
// probability proportional to squared distance from the nearest existing centroid.
function kmeansPlusPlusInit(points, k, seed) {
  const rand = rngFrom(seed * 131 + 19);
  const n = points.length;
  if (n === 0 || k === 0) return [];
  const cs = [];
  const firstIdx = Math.floor(rand() * n);
  cs.push({ ...points[firstIdx] });
  const dists = new Array(n).fill(Infinity);
  for (let s = 1; s < k; s++) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      const last = cs[cs.length - 1];
      const dx = points[i].x - last.x;
      const dy = points[i].y - last.y;
      const d = dx * dx + dy * dy;
      if (d < dists[i]) dists[i] = d;
      total += dists[i];
    }
    if (total <= 0) {
      // Fallback if all points coincide.
      cs.push({ x: points[0].x + s * 0.1, y: points[0].y + s * 0.1 });
      continue;
    }
    let pick = rand() * total;
    let chosen = n - 1;
    for (let i = 0; i < n; i++) {
      pick -= dists[i];
      if (pick <= 0) { chosen = i; break; }
    }
    cs.push({ ...points[chosen] });
  }
  return cs;
}

function assignPoints(points, centroids) {
  const out = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < centroids.length; j++) {
      const dx = points[i].x - centroids[j].x;
      const dy = points[i].y - centroids[j].y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = j; }
    }
    out[i] = best;
  }
  return out;
}

function meanCentroids(points, assignments, centroids) {
  const sums = centroids.map(() => ({ x: 0, y: 0, n: 0 }));
  for (let i = 0; i < points.length; i++) {
    const a = assignments[i];
    sums[a].x += points[i].x;
    sums[a].y += points[i].y;
    sums[a].n += 1;
  }
  return sums.map((s, j) =>
    s.n > 0 ? { x: s.x / s.n, y: s.y / s.n } : { ...centroids[j] }
  );
}

function computeWCSS(points, assignments, centroids) {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const c = centroids[assignments[i]];
    const dx = points[i].x - c.x;
    const dy = points[i].y - c.y;
    total += dx * dx + dy * dy;
  }
  return total;
}

function maxCentroidShift(prev, next) {
  let m = 0;
  for (let i = 0; i < prev.length; i++) {
    const dx = prev[i].x - next[i].x;
    const dy = prev[i].y - next[i].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > m) m = d;
  }
  return m;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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
        opacity={isZero ? 0.85 : 0.35}
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
        opacity={isZero ? 0.85 : 0.35}
      />
    );
  }
  return <g>{lines}</g>;
}

function Centroid({ cx, cy, color, trail, isGhost, label }) {
  return (
    <g>
      {trail && trail.length > 1 && (
        <polyline
          points={trail
            .map((t) => `${xToPx(t.x).toFixed(2)},${yToPx(t.y).toFixed(2)}`)
            .join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeDasharray="3 3"
          opacity="0.55"
          strokeLinecap="round"
        />
      )}
      <circle cx={cx} cy={cy} r={16} fill={color} opacity={isGhost ? 0.08 : 0.16} />
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill={color}
        stroke="var(--bg)"
        strokeWidth="2.4"
        opacity={isGhost ? 0.65 : 1}
      />
      <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
      {label != null && (
        <text
          x={cx + 13}
          y={cy - 11}
          fill={color}
          fontSize="10"
          fontFamily="var(--mono)"
          fontWeight="700"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function KMeansFullViz() {
  const animRef = useRef(null);
  const runningRef = useRef(false);
  const cancelRef = useRef(false);

  const [k, setK] = useState(3);
  const [dataSeed, setDataSeed] = useState(1);
  const [centroidSeed, setCentroidSeed] = useState(1);
  const [initMode, setInitMode] = useState('random'); // 'random' | 'kmeans++'

  const { pts: points } = useMemo(() => generatePoints(dataSeed), [dataSeed]);

  const computeInitial = useCallback(
    (seed, kk, mode) => {
      return mode === 'kmeans++'
        ? kmeansPlusPlusInit(points, kk, seed)
        : randomInit(seed, kk);
    },
    [points]
  );

  const [centroids, setCentroids] = useState(() =>
    computeInitial(1, 3, 'random')
  );
  const [renderCentroids, setRenderCentroids] = useState(centroids);
  const [assignments, setAssignments] = useState(() =>
    new Array(N_POINTS).fill(-1)
  );
  const [iter, setIter] = useState(0);
  const [phase, setPhase] = useState('init'); // 'init' | 'assign' | 'update' | 'converged'
  const [trails, setTrails] = useState(() => centroids.map((c) => [c]));
  const [running, setRunning] = useState(false);
  const [converged, setConverged] = useState(false);
  const [lossHistory, setLossHistory] = useState([]);

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
  const hardResetState = useCallback(
    (seed, kk, mode) => {
      setRunning(false);
      const cs = mode === 'kmeans++'
        ? kmeansPlusPlusInit(points, kk, seed)
        : randomInit(seed, kk);
      setCentroids(cs);
      setRenderCentroids(cs);
      setAssignments(new Array(N_POINTS).fill(-1));
      setIter(0);
      setPhase('init');
      setConverged(false);
      setTrails(cs.map((c) => [c]));
      setLossHistory([]);
    },
    [points]
  );

  // Re-init when k / seed / mode / data changes. Tracked-dep render-phase reset
  // (React's recommended pattern over setState-in-effect cascades).
  const resetKey = `${k}|${centroidSeed}|${initMode}|${dataSeed}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    hardResetState(centroidSeed, k, initMode);
  }

  useEffect(() => {
    runningRef.current = false;
    cancelAnim();
    cancelRef.current = false;
  }, [k, centroidSeed, initMode, dataSeed, cancelAnim]);

  // Animate centroids from `from` to `to` over ANIM_FRAMES.
  const animateMove = useCallback(
    (from, to) =>
      new Promise((resolve) => {
        cancelRef.current = false;
        const start = performance.now();
        const tick = (now) => {
          if (cancelRef.current) {
            setRenderCentroids(to);
            resolve();
            return;
          }
          const t = Math.min(1, (now - start) / ANIM_MS);
          const e = easeInOut(t);
          const cur = from.map((c, j) => ({
            x: c.x + (to[j].x - c.x) * e,
            y: c.y + (to[j].y - c.y) * e,
          }));
          setRenderCentroids(cur);
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
          if (cancelRef.current) {
            resolve();
            return;
          }
          if (now - start >= ms) {
            resolve();
            return;
          }
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      }),
    []
  );

  // One full iteration with animated sub-steps.
  const stepOnce = useCallback(async () => {
    if (converged) return { done: true };
    // 1) Assignment sub-step.
    const newAssign = assignPoints(points, centroids);
    setAssignments(newAssign);
    setPhase('assign');
    const wcssAfterAssign = computeWCSS(points, newAssign, centroids);
    setLossHistory((h) => [...h, wcssAfterAssign]);
    await wait(PHASE_DELAY);
    if (cancelRef.current) return { done: false };
    // 2) Update sub-step (animated).
    const newCentroids = meanCentroids(points, newAssign, centroids);
    setPhase('update');
    await animateMove(centroids, newCentroids);
    if (cancelRef.current) return { done: false };
    const shift = maxCentroidShift(centroids, newCentroids);
    setCentroids(newCentroids);
    setRenderCentroids(newCentroids);
    setTrails((prev) => {
      const next = newCentroids.map((c, j) => {
        const t = prev[j] ? [...prev[j], c] : [c];
        if (t.length > TRAIL_LIMIT) t.splice(0, t.length - TRAIL_LIMIT);
        return t;
      });
      return next;
    });
    setIter((n) => n + 1);
    const didConverge = shift < CONVERGE_EPS;
    setConverged(didConverge);
    setPhase(didConverge ? 'converged' : 'update');
    return { done: didConverge };
  }, [animateMove, centroids, converged, points, wait]);

  const handleStep = useCallback(async () => {
    if (runningRef.current) return;
    if (converged) return;
    runningRef.current = true;
    setRunning(true);
    await stepOnce();
    runningRef.current = false;
    setRunning(false);
  }, [converged, stepOnce]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    cancelAnim();
  }, [cancelAnim]);

  const handleRun = useCallback(async () => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    if (converged) return;
    runningRef.current = true;
    setRunning(true);
    cancelRef.current = false;
    let count = 0;
    let curCentroids = centroids;
    while (runningRef.current && count < MAX_ITER) {
      const newAssign = assignPoints(points, curCentroids);
      setAssignments(newAssign);
      setPhase('assign');
      const wcssAfterAssign = computeWCSS(points, newAssign, curCentroids);
      setLossHistory((h) => [...h, wcssAfterAssign]);
      await wait(PHASE_DELAY);
      if (!runningRef.current || cancelRef.current) break;
      const newCentroids = meanCentroids(points, newAssign, curCentroids);
      setPhase('update');
      await animateMove(curCentroids, newCentroids);
      if (!runningRef.current || cancelRef.current) break;
      const shift = maxCentroidShift(curCentroids, newCentroids);
      curCentroids = newCentroids;
      setCentroids(newCentroids);
      setRenderCentroids(newCentroids);
      setTrails((prev) => {
        const next = newCentroids.map((c, j) => {
          const t = prev[j] ? [...prev[j], c] : [c];
          if (t.length > TRAIL_LIMIT) t.splice(0, t.length - TRAIL_LIMIT);
          return t;
        });
        return next;
      });
      setIter((n) => n + 1);
      count += 1;
      if (shift < CONVERGE_EPS) {
        setConverged(true);
        setPhase('converged');
        break;
      }
      await wait(PHASE_DELAY / 2);
    }
    runningRef.current = false;
    setRunning(false);
  }, [animateMove, centroids, converged, points, stopRun, wait]);

  const handleReset = useCallback(() => {
    setCentroidSeed((s) => (s + 1) >>> 0);
  }, []);

  const handleNewData = useCallback(() => {
    setDataSeed((s) => (s + 1) >>> 0);
  }, []);

  const toggleInit = useCallback(() => {
    setInitMode((m) => (m === 'random' ? 'kmeans++' : 'random'));
  }, []);

  const currentWCSS = useMemo(() => {
    if (assignments[0] === -1) return null;
    return computeWCSS(points, assignments, centroids);
  }, [assignments, centroids, points]);

  const phaseLabel = (() => {
    switch (phase) {
      case 'assign':
        return 'assign · color by nearest';
      case 'update':
        return 'update · move to mean';
      case 'converged':
        return 'converged';
      default:
        return 'ready';
    }
  })();

  // Build voronoi-style decision boundary chips: for each grid sample, color by nearest centroid.
  const decisionTiles = useMemo(() => {
    if (assignments[0] === -1) return null;
    const N = 22;
    const tiles = [];
    const stepW = PLOT / N;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const px = PAD + (i + 0.5) * stepW;
        const py = PAD + (j + 0.5) * stepW;
        const wx = X_MIN + ((px - PAD) / PLOT) * (X_MAX - X_MIN);
        const wy = Y_MIN + (1 - (py - PAD) / PLOT) * (Y_MAX - Y_MIN);
        let best = 0;
        let bd = Infinity;
        for (let c = 0; c < renderCentroids.length; c++) {
          const dx = wx - renderCentroids[c].x;
          const dy = wy - renderCentroids[c].y;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = c; }
        }
        tiles.push({
          x: PAD + i * stepW,
          y: PAD + j * stepW,
          w: stepW,
          color: CLUSTER_COLORS[best % CLUSTER_COLORS.length],
        });
      }
    }
    return tiles;
  }, [renderCentroids, assignments]);

  // Loss sparkline geometry.
  const sparkline = useMemo(() => {
    if (lossHistory.length < 2) return null;
    const w = 160;
    const h = 36;
    const max = Math.max(...lossHistory);
    const min = Math.min(...lossHistory);
    const range = Math.max(1e-6, max - min);
    const pts = lossHistory.map((v, i) => {
      const x = (i / Math.max(1, lossHistory.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { w, h, pts: pts.join(' '), min, max };
  }, [lossHistory]);

  const clusterSizes = useMemo(() => {
    if (assignments[0] === -1) return centroids.map(() => 0);
    const sizes = centroids.map(() => 0);
    for (let i = 0; i < assignments.length; i++) sizes[assignments[i]] += 1;
    return sizes;
  }, [assignments, centroids]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg" style={{ maxWidth: 460 }}>
          {/* Decision boundary background (faint voronoi). */}
          {decisionTiles && (
            <g opacity="0.08">
              {decisionTiles.map((t, idx) => (
                <rect
                  key={`t${idx}`}
                  x={t.x}
                  y={t.y}
                  width={t.w + 0.5}
                  height={t.w + 0.5}
                  fill={t.color}
                />
              ))}
            </g>
          )}

          <Grid />

          {/* Assignment connectors. */}
          {assignments[0] !== -1 &&
            points.map((p, i) => {
              const a = assignments[i];
              const c = renderCentroids[a];
              if (!c) return null;
              const col = CLUSTER_COLORS[a % CLUSTER_COLORS.length];
              return (
                <line
                  key={`l${i}`}
                  x1={xToPx(p.x)}
                  y1={yToPx(p.y)}
                  x2={xToPx(c.x)}
                  y2={yToPx(c.y)}
                  stroke={col}
                  strokeWidth="0.55"
                  opacity="0.28"
                />
              );
            })}

          {/* Data points. */}
          {points.map((p, i) => {
            const a = assignments[i];
            const col =
              a >= 0
                ? CLUSTER_COLORS[a % CLUSTER_COLORS.length]
                : 'var(--text-dim)';
            return (
              <circle
                key={`p${i}`}
                cx={xToPx(p.x)}
                cy={yToPx(p.y)}
                r={4.2}
                fill={col}
                opacity={a >= 0 ? 0.95 : 0.55}
                style={{ transition: 'fill 0.35s ease' }}
              />
            );
          })}

          {/* Centroids. */}
          {renderCentroids.map((c, j) => (
            <Centroid
              key={`c${j}`}
              cx={xToPx(c.x)}
              cy={yToPx(c.y)}
              color={CLUSTER_COLORS[j % CLUSTER_COLORS.length]}
              trail={trails[j]}
              label={`c${j + 1}`}
            />
          ))}

          {/* Loss sparkline (bottom right corner). */}
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
                stroke="var(--accent)"
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
                WCSS
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            k-means
          </span>
          <span className="mlviz-val">k = {k}</span>
          <span className="mlviz-sub">init {initMode}</span>
          <span className="mlviz-sub">iter {iter}</span>
          <span className="mlviz-sub">
            WCSS {currentWCSS !== null ? snap(currentWCSS, 2) : '—'}
          </span>
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
          {clusterSizes.map((n, j) => (
            <span
              key={`cs${j}`}
              className="mlviz-toggle"
              style={{
                '--toggle-color': CLUSTER_COLORS[j % CLUSTER_COLORS.length],
                cursor: 'default',
                color: 'var(--text-main)',
                borderColor: CLUSTER_COLORS[j % CLUSTER_COLORS.length],
                background: `color-mix(in srgb, ${CLUSTER_COLORS[j % CLUSTER_COLORS.length]} 10%, transparent)`,
              }}
            >
              <span className="mlviz-toggle-dot" />
              c{j + 1} · n={n}
            </span>
          ))}
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">clusters k</span>
            <input
              type="range"
              min={MIN_K}
              max={MAX_K}
              step="1"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{k}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || converged}
            title="One full iteration: assignment + centroid update"
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={converged && !running}
            title="Run iterations until convergence"
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run all'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
            title="Reshuffle centroids with current init mode"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewData}
            disabled={running}
            title="Resample clusters with a new seed"
          >
            <Shuffle size={13} />
            <span>Sample new data</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={toggleInit}
            disabled={running}
            title="Toggle between random and k-means++ initialization"
            style={
              initMode === 'kmeans++'
                ? {
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                    background: 'rgba(var(--accent-rgb, 0, 255, 245), 0.08)',
                  }
                : undefined
            }
          >
            {initMode === 'kmeans++' ? (
              <Sparkles size={13} />
            ) : (
              <Dice5 size={13} />
            )}
            <span>
              {initMode === 'kmeans++' ? 'k-means++' : 'random init'}
            </span>
          </button>
        </div>

        <div className="mlviz-hint">
          {converged
            ? `converged in ${iter} iteration${iter === 1 ? '' : 's'} · WCSS ${
                currentWCSS !== null ? snap(currentWCSS, 2) : '—'
              }`
            : 'each step: recolor points by nearest centroid · slide each centroid to its cluster mean'}
        </div>
      </div>
    </div>
  );
}
