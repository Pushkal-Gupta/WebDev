import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square, Shuffle } from 'lucide-react';
import './MLViz.css';

const SIZE = 380;
const PAD = 22;
const PLOT = SIZE - PAD * 2;
const X_MIN = -5;
const X_MAX = 5;
const Y_MIN = -5;
const Y_MAX = 5;

const N_POINTS = 60;
const MAX_K = 5;
const STEP_DELAY = 360;
const CONVERGE_EPS = 0.01;
const MAX_ITER = 30;
const TRAIL_LIMIT = 12;

const CLUSTER_COLORS = [
  'var(--accent)',
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
  'var(--hue-mint, #74e3a3)',
  'var(--warning, #f5a623)',
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

// Mulberry32 — deterministic PRNG seeded by integer.
function rngFrom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
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
  const centers = [
    { x: -2.4, y: 2.0 },
    { x: 2.6, y: 1.6 },
    { x: 0.2, y: -2.6 },
  ];
  const spread = 0.85;
  const pts = [];
  for (let i = 0; i < N_POINTS; i++) {
    const c = centers[i % centers.length];
    const dx = boxMuller(rand) * spread;
    const dy = boxMuller(rand) * spread;
    const x = Math.max(X_MIN + 0.2, Math.min(X_MAX - 0.2, c.x + dx));
    const y = Math.max(Y_MIN + 0.2, Math.min(Y_MAX - 0.2, c.y + dy));
    pts.push({ x, y });
  }
  return pts;
}

function generateCentroids(seed, k) {
  const rand = rngFrom(seed * 53 + 7);
  const cs = [];
  for (let i = 0; i < k; i++) {
    const x = X_MIN + 0.8 + rand() * (X_MAX - X_MIN - 1.6);
    const y = Y_MIN + 0.8 + rand() * (Y_MAX - Y_MIN - 1.6);
    cs.push({ x, y });
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
  return sums.map((s, j) => s.n > 0
    ? { x: s.x / s.n, y: s.y / s.n }
    : { ...centroids[j] }
  );
}

function computeInertia(points, assignments, centroids) {
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

function Grid() {
  const lines = [];
  for (let i = -5; i <= 5; i++) {
    const sy = yToPx(i);
    const sx = xToPx(i);
    lines.push(<line key={`h${i}`} x1={PAD} y1={sy} x2={SIZE - PAD} y2={sy} stroke="var(--border)" strokeWidth={i === 0 ? 1.1 : 0.4} opacity={i === 0 ? 0.8 : 0.5} />);
    lines.push(<line key={`v${i}`} x1={sx} y1={PAD} x2={sx} y2={SIZE - PAD} stroke="var(--border)" strokeWidth={i === 0 ? 1.1 : 0.4} opacity={i === 0 ? 0.8 : 0.5} />);
  }
  return <g>{lines}</g>;
}

function Centroid({ cx, cy, color, trail }) {
  return (
    <g>
      {trail && trail.length > 1 && (
        <polyline
          points={trail.map(t => `${xToPx(t.x).toFixed(2)},${yToPx(t.y).toFixed(2)}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeDasharray="3 3"
          opacity="0.55"
          strokeLinecap="round"
        />
      )}
      <circle cx={cx} cy={cy} r={13} fill={color} opacity="0.16" />
      <circle cx={cx} cy={cy} r={8} fill={color} stroke="var(--bg)" strokeWidth="2" />
      <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" />
      <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

export default function KMeansViz() {
  const timeoutRef = useRef(null);
  const runningRef = useRef(false);

  const [k, setK] = useState(3);
  const [dataSeed, setDataSeed] = useState(1);
  const [centroidSeed, setCentroidSeed] = useState(1);

  const points = useMemo(() => generatePoints(dataSeed), [dataSeed]);

  const [centroids, setCentroids] = useState(() => generateCentroids(1, 3));
  const [assignments, setAssignments] = useState(() => new Array(N_POINTS).fill(-1));
  const [iter, setIter] = useState(0);
  const [phase, setPhase] = useState('init'); // 'init' | 'assign' | 'update' | 'converged'
  const [trails, setTrails] = useState(() => generateCentroids(1, 3).map(c => [c]));
  const [running, setRunning] = useState(false);
  const [converged, setConverged] = useState(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimers();
  }, [clearTimers]);

  // State-only reset (safe at render-phase); imperative ref/timer cleanup
  // lives in a sibling effect below.
  const resetCentroidsState = useCallback((seed, kk) => {
    setRunning(false);
    const cs = generateCentroids(seed, kk);
    setCentroids(cs);
    setAssignments(new Array(N_POINTS).fill(-1));
    setIter(0);
    setPhase('init');
    setConverged(false);
    setTrails(cs.map(c => [c]));
  }, []);

  // Regenerate centroids when k / centroidSeed / dataSeed change. Tracked-dep
  // render-phase reset (React's recommended pattern over setState-in-effect).
  const resetKey = `${k}|${centroidSeed}|${dataSeed}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    resetCentroidsState(centroidSeed, k);
  }

  useEffect(() => {
    runningRef.current = false;
    clearTimers();
  }, [k, centroidSeed, dataSeed, clearTimers]);

  // One full iteration: assign then update.
  const stepOnce = useCallback(() => {
    if (converged) return { done: true };
    // assignment phase
    const newAssign = assignPoints(points, centroids);
    setAssignments(newAssign);
    setPhase('assign');
    // schedule update phase after a short delay so the color change is visible
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(() => {
        const newCentroids = meanCentroids(points, newAssign, centroids);
        const shift = maxCentroidShift(centroids, newCentroids);
        setCentroids(newCentroids);
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
        resolve({ done: didConverge });
      }, STEP_DELAY / 2);
    });
  }, [points, centroids, converged]);

  const handleStep = useCallback(async () => {
    if (runningRef.current) return;
    if (converged) return;
    await stepOnce();
  }, [stepOnce, converged]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const handleRun = useCallback(async () => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    if (converged) return;
    runningRef.current = true;
    setRunning(true);
    let count = 0;
    let curCentroids = centroids;
    while (runningRef.current && count < MAX_ITER) {
      const newAssign = assignPoints(points, curCentroids);
      setAssignments(newAssign);
      setPhase('assign');
      await new Promise((res) => {
        timeoutRef.current = setTimeout(res, STEP_DELAY);
      });
      if (!runningRef.current) break;
      const newCentroids = meanCentroids(points, newAssign, curCentroids);
      const shift = maxCentroidShift(curCentroids, newCentroids);
      curCentroids = newCentroids;
      setCentroids(newCentroids);
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
      setPhase('update');
      await new Promise((res) => {
        timeoutRef.current = setTimeout(res, STEP_DELAY);
      });
    }
    runningRef.current = false;
    setRunning(false);
  }, [centroids, points, converged, stopRun]);

  const handleReset = useCallback(() => {
    const ns = (centroidSeed + 1) >>> 0;
    setCentroidSeed(ns);
  }, [centroidSeed]);

  const handleNewData = useCallback(() => {
    const ns = (dataSeed + 1) >>> 0;
    setDataSeed(ns);
  }, [dataSeed]);

  const inertia = useMemo(() => {
    if (assignments[0] === -1) return null;
    return computeInertia(points, assignments, centroids);
  }, [points, assignments, centroids]);

  const phaseLabel = (() => {
    switch (phase) {
      case 'assign': return 'assign points';
      case 'update': return 'move centroids';
      case 'converged': return 'converged';
      default: return 'ready';
    }
  })();

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mlviz-svg"
        >
          <Grid />

          {/* assignment connectors (faint) */}
          {assignments[0] !== -1 && points.map((p, i) => {
            const a = assignments[i];
            const c = centroids[a];
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
                strokeWidth="0.6"
                opacity="0.22"
              />
            );
          })}

          {/* data points */}
          {points.map((p, i) => {
            const a = assignments[i];
            const col = a >= 0 ? CLUSTER_COLORS[a % CLUSTER_COLORS.length] : 'var(--text-dim)';
            return (
              <circle
                key={`p${i}`}
                cx={xToPx(p.x)}
                cy={yToPx(p.y)}
                r={4}
                fill={col}
                opacity={a >= 0 ? 0.95 : 0.55}
                style={{ transition: 'fill 0.35s ease' }}
              />
            );
          })}

          {/* centroids */}
          {centroids.map((c, j) => (
            <Centroid
              key={`c${j}`}
              cx={xToPx(c.x)}
              cy={yToPx(c.y)}
              color={CLUSTER_COLORS[j % CLUSTER_COLORS.length]}
              trail={trails[j]}
            />
          ))}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>k-means</span>
          <span className="mlviz-val">k = {k}</span>
          <span className="mlviz-sub">iter {iter}</span>
          <span className="mlviz-sub">inertia {inertia !== null ? snap(inertia, 2) : '—'}</span>
          <span className="mlviz-sub" style={{ color: converged ? 'var(--hue-mint, #74e3a3)' : 'var(--text-dim)' }}>
            {phaseLabel}
          </span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">clusters k</span>
            <input
              type="range"
              min="2"
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
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={converged && !running}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewData}
            disabled={running}
          >
            <Shuffle size={13} />
            <span>New data</span>
          </button>
        </div>

        <div className="mlviz-hint">assign · update · repeat until centroids stop moving</div>
      </div>
    </div>
  );
}
