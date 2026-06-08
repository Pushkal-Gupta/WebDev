import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, FastForward, Check } from 'lucide-react';
import './PageRankViz.css';

const DAMPING = 0.85;
const CONVERGENCE_EPS = 1e-4;
const MAX_ITERATIONS = 80;

const NODES = [
  { id: 'A', x: 140, y: 110 },
  { id: 'B', x: 320, y: 70  },
  { id: 'C', x: 500, y: 110 },
  { id: 'D', x: 580, y: 250 },
  { id: 'E', x: 500, y: 390 },
  { id: 'F', x: 320, y: 430 },
  { id: 'G', x: 140, y: 390 },
  { id: 'H', x: 60,  y: 250 },
];

const EDGES = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'H' },
  { from: 'B', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'C', to: 'D' },
  { from: 'C', to: 'A' },
  { from: 'D', to: 'E' },
  { from: 'E', to: 'F' },
  { from: 'E', to: 'B' },
  { from: 'F', to: 'G' },
  { from: 'F', to: 'C' },
  { from: 'G', to: 'H' },
  { from: 'G', to: 'A' },
  { from: 'H', to: 'A' },
];

const N = NODES.length;

const OUT_DEG = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = 0; });
  EDGES.forEach((e) => { map[e.from] += 1; });
  return map;
})();

const IN_EDGES = (() => {
  const map = {};
  NODES.forEach((n) => { map[n.id] = []; });
  EDGES.forEach((e) => { map[e.to].push(e.from); });
  return map;
})();

function initialScores() {
  const init = 1 / N;
  const scores = {};
  NODES.forEach((n) => { scores[n.id] = init; });
  return scores;
}

function powerStep(scores) {
  const next = {};
  const teleport = (1 - DAMPING) / N;
  let danglingMass = 0;
  NODES.forEach((n) => {
    if (OUT_DEG[n.id] === 0) danglingMass += scores[n.id];
  });
  const danglingShare = (DAMPING * danglingMass) / N;
  NODES.forEach((v) => {
    let sum = 0;
    IN_EDGES[v.id].forEach((u) => {
      sum += scores[u] / OUT_DEG[u];
    });
    next[v.id] = teleport + danglingShare + DAMPING * sum;
  });
  return next;
}

function maxDelta(a, b) {
  let m = 0;
  NODES.forEach((n) => {
    const d = Math.abs((a[n.id] || 0) - (b[n.id] || 0));
    if (d > m) m = d;
  });
  return m;
}

function fmt(x) {
  return x.toFixed(4);
}

const MIN_RADIUS = 18;
const MAX_RADIUS = 38;

function radiusForScore(score) {
  const lo = 1 / N / 4;
  const hi = 0.45;
  const clamped = Math.max(lo, Math.min(hi, score));
  const t = (clamped - lo) / (hi - lo);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

function edgeGeometry(a, b, rA, rB) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const x1 = a.x + ux * rA;
  const y1 = a.y + uy * rA;
  const x2 = b.x - ux * (rB + 5);
  const y2 = b.y - uy * (rB + 5);
  return { x1, y1, x2, y2 };
}

export default function PageRankViz() {
  const [scores, setScores] = useState(() => initialScores());
  const [prevScores, setPrevScores] = useState(() => initialScores());
  const [iter, setIter] = useState(0);
  const [delta, setDelta] = useState(0);
  const [converged, setConverged] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lastAction, setLastAction] = useState('init');
  const timerRef = useRef(null);

  const handleStep = useCallback(() => {
    setScores((current) => {
      const next = powerStep(current);
      const d = maxDelta(current, next);
      setPrevScores(current);
      setDelta(d);
      setIter((i) => i + 1);
      setLastAction('step');
      if (d < CONVERGENCE_EPS) {
        setConverged(true);
        setPlaying(false);
      }
      return next;
    });
  }, []);

  const handleRunToConvergence = useCallback(() => {
    setPlaying(false);
    setScores((current) => {
      let s = current;
      let prev = current;
      let count = 0;
      let lastDelta = Infinity;
      while (count < MAX_ITERATIONS) {
        const nxt = powerStep(s);
        const d = maxDelta(s, nxt);
        prev = s;
        s = nxt;
        count += 1;
        lastDelta = d;
        if (d < CONVERGENCE_EPS) break;
      }
      setPrevScores(prev);
      setIter((i) => i + count);
      setDelta(lastDelta);
      setConverged(lastDelta < CONVERGENCE_EPS);
      setLastAction('converge');
      return s;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPlaying(false);
    const init = initialScores();
    setScores(init);
    setPrevScores(init);
    setIter(0);
    setDelta(0);
    setConverged(false);
    setLastAction('init');
  }, []);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      handleStep();
    }, 900);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, handleStep]);

  useEffect(() => {
    if (converged && playing) setPlaying(false);
  }, [converged, playing]);

  const ranking = useMemo(() => {
    const arr = NODES.map((n) => ({ id: n.id, score: scores[n.id] }));
    arr.sort((a, b) => b.score - a.score);
    return arr;
  }, [scores]);

  const totalMass = useMemo(() => {
    return NODES.reduce((s, n) => s + scores[n.id], 0);
  }, [scores]);

  const topId = ranking[0]?.id;

  const caption = useMemo(() => {
    if (lastAction === 'init') {
      return `Initialize: every node starts with rank 1/N = ${fmt(1 / N)}. Mass is distributed uniformly across all ${N} nodes.`;
    }
    if (lastAction === 'converge') {
      if (converged) {
        return `Power iteration converged after ${iter} step${iter === 1 ? '' : 's'}. Final delta ${delta.toExponential(2)} is below threshold ${CONVERGENCE_EPS}. Node ${topId} holds the highest rank.`;
      }
      return `Reached iteration cap (${MAX_ITERATIONS}). Last delta ${delta.toExponential(2)} - still drifting. Run again or reset.`;
    }
    if (converged) {
      return `Converged at iteration ${iter}. Each node now equals (1 - d)/N + d times the weighted sum of inbound ranks divided by out-degree.`;
    }
    return `Iteration ${iter}: each node redistributes ${(DAMPING * 100).toFixed(0)}% of its rank along outgoing edges; ${((1 - DAMPING) * 100).toFixed(0)}% is teleported uniformly. Max change this step: ${delta.toExponential(2)}.`;
  }, [lastAction, converged, iter, delta, topId]);

  const radii = useMemo(() => {
    const map = {};
    NODES.forEach((n) => { map[n.id] = radiusForScore(scores[n.id]); });
    return map;
  }, [scores]);

  return (
    <div className="prviz">
      <div className="prviz-header">
        <div className="prviz-title">PageRank power iteration</div>
        <div className="prviz-meta">
          <span className="prviz-meta-row">
            <span className="prviz-meta-label">d</span>
            <span className="prviz-meta-value">{DAMPING.toFixed(2)}</span>
          </span>
          <span className="prviz-meta-row">
            <span className="prviz-meta-label">N</span>
            <span className="prviz-meta-value">{N}</span>
          </span>
        </div>
      </div>

      <div className="prviz-legend">
        <span className="prviz-legend-item">
          <span className="prviz-dot prviz-dot-small" /> low rank
        </span>
        <span className="prviz-legend-item">
          <span className="prviz-dot prviz-dot-mid" /> mid rank
        </span>
        <span className="prviz-legend-item">
          <span className="prviz-dot prviz-dot-large" /> high rank
        </span>
        <span className="prviz-legend-item">
          <span className="prviz-dot prviz-dot-top" /> current top
        </span>
        <span className="prviz-legend-item">
          <span className="prviz-line" /> directed link
        </span>
      </div>

      <div className="prviz-stage">
        <svg
          className="prviz-svg"
          viewBox="0 0 640 500"
          role="img"
          aria-label="PageRank power iteration visualization"
        >
          <defs>
            <marker
              id="prviz-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="prviz-arrow-head" />
            </marker>
            <marker
              id="prviz-arrow-top"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="prviz-arrow-head-top" />
            </marker>
          </defs>

          <g className="prviz-edges">
            {EDGES.map((e) => {
              const a = NODES.find((n) => n.id === e.from);
              const b = NODES.find((n) => n.id === e.to);
              const geom = edgeGeometry(a, b, radii[e.from], radii[e.to]);
              if (!geom) return null;
              const intoTop = e.to === topId;
              return (
                <g key={`${e.from}-${e.to}`} className={`prviz-edge-group${intoTop ? ' prviz-edge-into-top' : ''}`}>
                  <line
                    className="prviz-edge"
                    x1={geom.x1}
                    y1={geom.y1}
                    x2={geom.x2}
                    y2={geom.y2}
                    markerEnd={intoTop ? 'url(#prviz-arrow-top)' : 'url(#prviz-arrow)'}
                  />
                </g>
              );
            })}
          </g>

          <g className="prviz-nodes">
            {NODES.map((n) => {
              const score = scores[n.id];
              const prev = prevScores[n.id];
              const r = radii[n.id];
              const isTop = n.id === topId;
              const changed = Math.abs(score - prev) > 1e-9;
              const rising = score > prev + 1e-9;
              const t = (score - 1 / N / 4) / (0.45 - 1 / N / 4);
              const tier = isTop ? 'top' : t > 0.55 ? 'large' : t > 0.28 ? 'mid' : 'small';
              return (
                <g
                  key={n.id}
                  className={`prviz-node prviz-node-${tier}${changed ? (rising ? ' prviz-node-rising' : ' prviz-node-falling') : ''}`}
                  transform={`translate(${n.x},${n.y})`}
                >
                  {isTop && (
                    <circle className="prviz-node-ring" r={r + 8} />
                  )}
                  <circle className="prviz-node-circle" r={r} />
                  <text className="prviz-node-label" textAnchor="middle" dominantBaseline="central">{n.id}</text>

                  <g className="prviz-score-badge" transform={`translate(0,${-(r + 18)})`}>
                    <rect x="-30" y="-11" width="60" height="20" rx="6" className="prviz-score-bg" />
                    <text className="prviz-score-text" textAnchor="middle" dominantBaseline="central">{fmt(score)}</text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="prviz-status">
        <div className="prviz-status-row">
          <span className="prviz-status-label">Iteration</span>
          <span className="prviz-status-value">{iter}</span>
        </div>
        <div className="prviz-status-row">
          <span className="prviz-status-label">Delta</span>
          <span className="prviz-status-value">
            {iter === 0 ? '-' : delta === 0 ? '0' : delta.toExponential(2)}
          </span>
        </div>
        <div className="prviz-status-row">
          <span className="prviz-status-label">Sum</span>
          <span className="prviz-status-value">{fmt(totalMass)}</span>
        </div>
        <div className="prviz-status-row">
          <span className="prviz-status-label">Top</span>
          <span className="prviz-status-value">
            {topId} · {fmt(ranking[0]?.score ?? 0)}
          </span>
        </div>
        <div className="prviz-status-row">
          <span className="prviz-status-label">State</span>
          <span className="prviz-status-value">
            {converged
              ? <span className="prviz-converged"><Check size={12} aria-hidden="true" /> converged</span>
              : iter === 0
                ? <span className="prviz-muted">initialized</span>
                : <span className="prviz-muted">iterating</span>}
          </span>
        </div>
      </div>

      <div className="prviz-ranking">
        <div className="prviz-ranking-label">Ranking (highest to lowest)</div>
        <div className="prviz-ranking-bars">
          {ranking.map((r, i) => {
            const width = Math.max(2, r.score * 240);
            return (
              <div key={r.id} className={`prviz-bar-row${i === 0 ? ' prviz-bar-row-top' : ''}`}>
                <span className="prviz-bar-rank">#{i + 1}</span>
                <span className="prviz-bar-id">{r.id}</span>
                <span className="prviz-bar-track">
                  <span className="prviz-bar-fill" style={{ width: `${width}px` }} />
                </span>
                <span className="prviz-bar-score">{fmt(r.score)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="prviz-caption">
        {converged && <Check size={14} className="prviz-caption-icon" aria-hidden="true" />}
        <span>{caption}</span>
      </p>

      <div className="prviz-controls">
        <button
          type="button"
          className="prviz-btn prviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="prviz-btn prviz-btn-primary"
          onClick={() => {
            if (converged) return;
            setPlaying((p) => !p);
          }}
          disabled={converged}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          className="prviz-btn prviz-btn-secondary"
          onClick={handleStep}
          disabled={converged || playing}
          aria-label="Step one iteration"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <button
          type="button"
          className="prviz-btn prviz-btn-secondary"
          onClick={handleRunToConvergence}
          disabled={converged || playing}
          aria-label="Run to convergence"
        >
          <FastForward size={16} />
          <span>Run to convergence</span>
        </button>
      </div>
    </div>
  );
}
