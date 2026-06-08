import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square, Shuffle } from 'lucide-react';
import './MLViz.css';

const SIZE = 380;
const PAD = 22;
const PLOT = SIZE - PAD * 2;

const N_POINTS = 100;
const N_CLUSTERS = 4;
const HIGH_DIM = 5;
const STEP_DELAY = 60;
const MAX_ITER = 500;
const VIEW_LIMIT = 6;

const CLUSTER_COLORS = [
  'var(--accent)',
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
  'var(--hue-mint, #74e3a3)',
  'var(--warning, #f5a623)',
  'var(--easy, #2db48b)',
];

function snap(v, p = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toString();
}

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

/* synth 5D dataset: N_CLUSTERS Gaussian blobs in 5D, each cluster centered on a
   random unit-ish direction. Returns { X: number[N][HIGH_DIM], labels: number[N] } */
function generateHighDim(seed) {
  const rand = rngFrom(seed * 19 + 3);
  const centers = [];
  for (let c = 0; c < N_CLUSTERS; c++) {
    const vec = [];
    for (let d = 0; d < HIGH_DIM; d++) vec.push(boxMuller(rand) * 3.2);
    centers.push(vec);
  }
  const spread = 0.65;
  const X = new Array(N_POINTS);
  const labels = new Array(N_POINTS);
  for (let i = 0; i < N_POINTS; i++) {
    const c = i % N_CLUSTERS;
    const row = new Array(HIGH_DIM);
    for (let d = 0; d < HIGH_DIM; d++) {
      row[d] = centers[c][d] + boxMuller(rand) * spread;
    }
    X[i] = row;
    labels[i] = c;
  }
  return { X, labels };
}

/* random 2D init (small) */
function generateInitY(seed) {
  const rand = rngFrom(seed * 41 + 11);
  const Y = new Array(N_POINTS);
  for (let i = 0; i < N_POINTS; i++) {
    Y[i] = [boxMuller(rand) * 0.0001, boxMuller(rand) * 0.0001];
  }
  return Y;
}

/* squared euclidean distance matrix (N×N) in high-D space */
function pairwiseSqDist(X) {
  const n = X.length;
  const D = new Array(n);
  for (let i = 0; i < n; i++) D[i] = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let s = 0;
      const a = X[i];
      const b = X[j];
      for (let d = 0; d < a.length; d++) {
        const diff = a[d] - b[d];
        s += diff * diff;
      }
      D[i][j] = s;
      D[j][i] = s;
    }
  }
  return D;
}

/* For each row i, binary-search beta_i = 1/(2 sigma_i^2) such that
   perplexity of the conditional distribution P(j|i) ∝ exp(-D[i][j] * beta_i)
   matches the target perplexity. Returns conditional P matrix. */
function computePCond(D, perplexity) {
  const n = D.length;
  const logU = Math.log(perplexity);
  const P = new Array(n);
  for (let i = 0; i < n; i++) P[i] = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    let betaMin = -Infinity;
    let betaMax = Infinity;
    let beta = 1.0;
    const Di = D[i];
    const Pi = P[i];
    for (let tries = 0; tries < 50; tries++) {
      let sumP = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) { Pi[j] = 0; continue; }
        const v = Math.exp(-Di[j] * beta);
        Pi[j] = v;
        sumP += v;
      }
      if (sumP < 1e-12) sumP = 1e-12;
      let H = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const p = Pi[j] / sumP;
        if (p > 1e-12) H -= p * Math.log(p);
        Pi[j] = p;
      }
      const diff = H - logU;
      if (Math.abs(diff) < 1e-4) break;
      if (diff > 0) {
        betaMin = beta;
        beta = Number.isFinite(betaMax) ? (beta + betaMax) / 2 : beta * 2;
      } else {
        betaMax = beta;
        beta = Number.isFinite(betaMin) ? (beta + betaMin) / 2 : beta / 2;
      }
    }
  }
  return P;
}

/* symmetrize conditional to joint P, normalize to sum 1 */
function symmetrize(Pcond) {
  const n = Pcond.length;
  const P = new Array(n);
  for (let i = 0; i < n; i++) P[i] = new Float64Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = (Pcond[i][j] + Pcond[j][i]) / (2 * n);
      P[i][j] = v;
      sum += v;
    }
  }
  if (sum < 1e-12) sum = 1e-12;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) P[i][j] /= sum;
  }
  return P;
}

/* one t-SNE gradient step on Y using joint P and current Y, returns mutated Y
   and KL-ish loss approximation + velocity (for momentum). */
function tsneStep(Y, P, velocity, learningRate, momentum, exaggeration) {
  const n = Y.length;
  // pairwise Q numerators: 1 / (1 + ||y_i - y_j||^2)
  const num = new Array(n);
  for (let i = 0; i < n; i++) num[i] = new Float64Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Y[i][0] - Y[j][0];
      const dy = Y[i][1] - Y[j][1];
      const v = 1 / (1 + dx * dx + dy * dy);
      num[i][j] = v;
      num[j][i] = v;
      sum += 2 * v;
    }
  }
  if (sum < 1e-12) sum = 1e-12;
  const Q = new Array(n);
  for (let i = 0; i < n; i++) Q[i] = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      Q[i][j] = Math.max(num[i][j] / sum, 1e-12);
    }
  }

  // gradient: 4 * sum_j (p_ij - q_ij) * num_ij * (y_i - y_j)
  const grad = new Array(n);
  for (let i = 0; i < n; i++) {
    let gx = 0;
    let gy = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const pij = P[i][j] * exaggeration;
      const m = (pij - Q[i][j]) * num[i][j];
      gx += m * (Y[i][0] - Y[j][0]);
      gy += m * (Y[i][1] - Y[j][1]);
    }
    grad[i] = [4 * gx, 4 * gy];
  }

  // momentum + update
  const Ynew = new Array(n);
  const Vnew = new Array(n);
  for (let i = 0; i < n; i++) {
    const vx = momentum * velocity[i][0] - learningRate * grad[i][0];
    const vy = momentum * velocity[i][1] - learningRate * grad[i][1];
    Vnew[i] = [vx, vy];
    Ynew[i] = [Y[i][0] + vx, Y[i][1] + vy];
  }
  // recenter
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) { mx += Ynew[i][0]; my += Ynew[i][1]; }
  mx /= n; my /= n;
  for (let i = 0; i < n; i++) { Ynew[i][0] -= mx; Ynew[i][1] -= my; }

  // KL divergence approximation: sum p log(p/q) — only over non-zero p
  let kl = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const p = P[i][j];
      if (p > 1e-12) kl += p * Math.log(p / Q[i][j]);
    }
  }

  return { Y: Ynew, V: Vnew, kl };
}

/* cluster separation: ratio of between-cluster centroid spread to mean
   intra-cluster radius. Higher = better separation. */
function separationScore(Y, labels) {
  const k = N_CLUSTERS;
  const sums = new Array(k);
  const counts = new Array(k).fill(0);
  for (let c = 0; c < k; c++) sums[c] = [0, 0];
  for (let i = 0; i < Y.length; i++) {
    const l = labels[i];
    sums[l][0] += Y[i][0];
    sums[l][1] += Y[i][1];
    counts[l] += 1;
  }
  const centroids = new Array(k);
  for (let c = 0; c < k; c++) {
    if (counts[c] === 0) { centroids[c] = [0, 0]; continue; }
    centroids[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c]];
  }
  // intra: mean per-cluster RMS distance to its centroid
  let intra = 0;
  for (let i = 0; i < Y.length; i++) {
    const c = centroids[labels[i]];
    const dx = Y[i][0] - c[0];
    const dy = Y[i][1] - c[1];
    intra += Math.sqrt(dx * dx + dy * dy);
  }
  intra /= Y.length;
  // inter: mean pairwise centroid distance
  let inter = 0;
  let pairs = 0;
  for (let a = 0; a < k; a++) {
    for (let b = a + 1; b < k; b++) {
      const dx = centroids[a][0] - centroids[b][0];
      const dy = centroids[a][1] - centroids[b][1];
      inter += Math.sqrt(dx * dx + dy * dy);
      pairs += 1;
    }
  }
  inter /= Math.max(1, pairs);
  if (intra < 1e-6) return 0;
  return inter / intra;
}

function Grid() {
  const lines = [];
  for (let i = -VIEW_LIMIT; i <= VIEW_LIMIT; i += 2) {
    const sx = PAD + ((i + VIEW_LIMIT) / (2 * VIEW_LIMIT)) * PLOT;
    const sy = PAD + (1 - (i + VIEW_LIMIT) / (2 * VIEW_LIMIT)) * PLOT;
    const isAxis = i === 0;
    lines.push(
      <line
        key={`h${i}`}
        x1={PAD}
        y1={sy}
        x2={SIZE - PAD}
        y2={sy}
        stroke="var(--border)"
        strokeWidth={isAxis ? 1.1 : 0.4}
        opacity={isAxis ? 0.7 : 0.35}
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
        strokeWidth={isAxis ? 1.1 : 0.4}
        opacity={isAxis ? 0.7 : 0.35}
      />
    );
  }
  return <g>{lines}</g>;
}

export default function TSNEViz() {
  const timeoutRef = useRef(null);
  const runningRef = useRef(false);

  const [dataSeed, setDataSeed] = useState(1);
  const [initSeed, setInitSeed] = useState(1);
  const [perplexity, setPerplexity] = useState(20);
  const [learningRate, setLearningRate] = useState(120);

  const { X, labels } = useMemo(() => generateHighDim(dataSeed), [dataSeed]);
  const D = useMemo(() => pairwiseSqDist(X), [X]);
  const P = useMemo(() => {
    const cond = computePCond(D, perplexity);
    return symmetrize(cond);
  }, [D, perplexity]);

  const [Y, setY] = useState(() => generateInitY(initSeed));
  const [V, setV] = useState(() => {
    const v = new Array(N_POINTS);
    for (let i = 0; i < N_POINTS; i++) v[i] = [0, 0];
    return v;
  });
  const [iter, setIter] = useState(0);
  const [kl, setKl] = useState(null);
  const [running, setRunning] = useState(false);

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

  const resetState = useCallback((seed) => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
    setY(generateInitY(seed));
    const v = new Array(N_POINTS);
    for (let i = 0; i < N_POINTS; i++) v[i] = [0, 0];
    setV(v);
    setIter(0);
    setKl(null);
  }, [clearTimers]);

  useEffect(() => {
    resetState(initSeed);
  }, [initSeed, dataSeed, perplexity, resetState]);

  const doStep = useCallback((curY, curV, curIter) => {
    const momentum = curIter < 50 ? 0.5 : 0.8;
    const exaggeration = curIter < 100 ? 4 : 1;
    const lr = learningRate;
    const result = tsneStep(curY, P, curV, lr, momentum, exaggeration);
    return result;
  }, [P, learningRate]);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    const r = doStep(Y, V, iter);
    setY(r.Y);
    setV(r.V);
    setKl(r.kl);
    setIter((n) => n + 1);
  }, [Y, V, iter, doStep]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    let curY = Y;
    let curV = V;
    let curIter = iter;

    const tick = () => {
      if (!runningRef.current) return;
      if (curIter >= MAX_ITER) {
        runningRef.current = false;
        setRunning(false);
        return;
      }
      const r = doStep(curY, curV, curIter);
      curY = r.Y;
      curV = r.V;
      curIter += 1;
      setY(curY);
      setV(curV);
      setKl(r.kl);
      setIter(curIter);
      timeoutRef.current = setTimeout(tick, STEP_DELAY);
    };
    tick();
  }, [Y, V, iter, doStep, stopRun]);

  const handleReset = useCallback(() => {
    resetState(initSeed);
  }, [initSeed, resetState]);

  const handleShuffleData = useCallback(() => {
    setDataSeed((s) => (s + 1) >>> 0);
    setInitSeed((s) => (s + 1) >>> 0);
  }, []);

  // dynamic viewport scaling: find max abs coord to autofit
  const scale = useMemo(() => {
    let m = 1;
    for (let i = 0; i < Y.length; i++) {
      const a = Math.abs(Y[i][0]);
      const b = Math.abs(Y[i][1]);
      if (a > m) m = a;
      if (b > m) m = b;
    }
    return Math.max(1, m * 1.15);
  }, [Y]);

  const toPx = useCallback((p) => {
    const sx = PAD + ((p[0] / scale + 1) / 2) * PLOT;
    const sy = PAD + (1 - (p[1] / scale + 1) / 2) * PLOT;
    return [sx, sy];
  }, [scale]);

  const sep = useMemo(() => separationScore(Y, labels), [Y, labels]);

  const phaseLabel = (() => {
    if (running) return 'optimizing';
    if (iter === 0) return 'random init';
    if (iter < 100) return 'early exaggeration';
    if (iter < MAX_ITER) return 'fine-tuning';
    return 'converged';
  })();

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <Grid />
          {Y.map((p, i) => {
            const [sx, sy] = toPx(p);
            const col = CLUSTER_COLORS[labels[i] % CLUSTER_COLORS.length];
            return (
              <circle
                key={`p${i}`}
                cx={sx}
                cy={sy}
                r={4}
                fill={col}
                opacity={0.85}
                stroke="var(--bg)"
                strokeWidth="0.6"
                style={{ transition: 'cx 0.08s linear, cy 0.08s linear' }}
              />
            );
          })}
          <text
            x={10}
            y={SIZE - 10}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.08em"
          >
            {`100 pts · 5D → 2D · ${phaseLabel}`}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>t-SNE</span>
          <span className="mlviz-val">iter {iter}</span>
          <span className="mlviz-sub">KL ≈ {kl === null ? '—' : snap(kl, 3)}</span>
          <span className="mlviz-sub">separation {snap(sep, 2)}</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">perplexity</span>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={perplexity}
              onChange={(e) => setPerplexity(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{perplexity}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learn rate</span>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={learningRate}
              onChange={(e) => setLearningRate(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{learningRate}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || iter >= MAX_ITER}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={iter >= MAX_ITER && !running}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Pause' : 'Run'}</span>
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
            onClick={handleShuffleData}
            disabled={running}
          >
            <Shuffle size={13} />
            <span>New data</span>
          </button>
        </div>

        <div className="mlviz-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {Array.from({ length: N_CLUSTERS }).map((_, c) => (
            <span
              key={`leg${c}`}
              className="mlviz-sub"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: CLUSTER_COLORS[c],
                }}
              />
              cluster {c + 1}
            </span>
          ))}
        </div>

        <div className="mlviz-hint">
          neighbour probabilities in 5D drive attractive forces; t-distribution in 2D drives repulsion — clusters separate when gradients balance
        </div>
      </div>
    </div>
  );
}
