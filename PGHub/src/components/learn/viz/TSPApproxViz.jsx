import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  RotateCcw,
  Shuffle,
  Zap,
  GitBranch,
  Trophy,
} from 'lucide-react';
import './TSPApproxViz.css';

const NUM_CITIES = 12;
const PLANE_W = 560;
const PLANE_H = 360;
const PAD = 30;
const TICK_MS = 320;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCities(seed, count = NUM_CITIES) {
  const rng = mulberry32(seed);
  const cities = [];
  let guard = 0;
  while (cities.length < count && guard < 5000) {
    guard += 1;
    const x = PAD + rng() * (PLANE_W - PAD * 2);
    const y = PAD + rng() * (PLANE_H - PAD * 2);
    // Reject points too close to existing ones for readability.
    let tooClose = false;
    for (const c of cities) {
      const dx = c.x - x;
      const dy = c.y - y;
      if (dx * dx + dy * dy < 40 * 40) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    cities.push({ id: cities.length, x, y });
  }
  return cities;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function tourLength(order, cities) {
  let total = 0;
  for (let i = 0; i < order.length; i += 1) {
    const a = cities[order[i]];
    const b = cities[order[(i + 1) % order.length]];
    total += dist(a, b);
  }
  return total;
}

function buildDistMatrix(cities) {
  const n = cities.length;
  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const d = dist(cities[i], cities[j]);
      m[i][j] = d;
      m[j][i] = d;
    }
  }
  return m;
}

// Nearest-neighbour construction. Yields step frames as it walks.
function nearestNeighborFrames(cities, startIdx = 0) {
  const n = cities.length;
  const dm = buildDistMatrix(cities);
  const visited = new Array(n).fill(false);
  const order = [startIdx];
  visited[startIdx] = true;
  const frames = [];
  frames.push({
    order: [...order],
    candidate: null,
    closed: false,
    caption: `Start at city ${startIdx}. Greedy walk: always pick the nearest unvisited neighbour.`,
  });
  for (let step = 1; step < n; step += 1) {
    const cur = order[order.length - 1];
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j += 1) {
      if (visited[j]) continue;
      if (dm[cur][j] < bestD) {
        bestD = dm[cur][j];
        best = j;
      }
    }
    visited[best] = true;
    order.push(best);
    frames.push({
      order: [...order],
      candidate: { from: cur, to: best, d: bestD },
      closed: false,
      caption: `Step ${step}: from city ${cur}, nearest unvisited is ${best} (d = ${bestD.toFixed(1)}).`,
    });
  }
  frames.push({
    order: [...order],
    candidate: null,
    closed: true,
    caption: `Close the tour: return from city ${order[order.length - 1]} to ${order[0]}. Length = ${tourLength(order, cities).toFixed(1)}.`,
  });
  return { frames, finalOrder: order, finalLength: tourLength(order, cities) };
}

// Christofides-inspired approximation:
// 1) MST via Prim
// 2) Find odd-degree vertices in MST
// 3) Greedy perfect matching among odd-degree vertices (true Christofides uses
//    minimum-weight perfect matching; greedy gives an illustrative variant)
// 4) Combine MST + matching => multigraph with all even degrees
// 5) Eulerian circuit
// 6) Shortcut repeated visits => Hamiltonian tour
function christofidesFrames(cities) {
  const n = cities.length;
  const dm = buildDistMatrix(cities);
  const frames = [];

  // ---- 1) Prim's MST ----
  const inTree = new Array(n).fill(false);
  const minEdge = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  minEdge[0] = 0;
  const mstEdges = [];
  for (let it = 0; it < n; it += 1) {
    let u = -1;
    for (let v = 0; v < n; v += 1) {
      if (!inTree[v] && (u === -1 || minEdge[v] < minEdge[u])) u = v;
    }
    inTree[u] = true;
    if (parent[u] !== -1) {
      mstEdges.push([parent[u], u]);
      frames.push({
        phase: 'mst',
        mstEdges: mstEdges.map((e) => [...e]),
        matching: [],
        tourEdges: [],
        order: [],
        closed: false,
        caption: `MST: add edge ${parent[u]}-${u} (length ${dm[parent[u]][u].toFixed(1)}).`,
      });
    }
    for (let v = 0; v < n; v += 1) {
      if (!inTree[v] && dm[u][v] < minEdge[v]) {
        minEdge[v] = dm[u][v];
        parent[v] = u;
      }
    }
  }

  // ---- 2) Odd-degree vertices ----
  const degree = new Array(n).fill(0);
  for (const [a, b] of mstEdges) {
    degree[a] += 1;
    degree[b] += 1;
  }
  const oddVerts = [];
  for (let i = 0; i < n; i += 1) if (degree[i] % 2 === 1) oddVerts.push(i);

  frames.push({
    phase: 'odd',
    mstEdges: mstEdges.map((e) => [...e]),
    matching: [],
    tourEdges: [],
    order: [],
    closed: false,
    oddSet: [...oddVerts],
    caption: `Odd-degree vertices in MST: {${oddVerts.join(', ')}}. There are always an even number of them.`,
  });

  // ---- 3) Greedy perfect matching on odd-degree vertices ----
  const matching = [];
  const usedOdd = new Set();
  const oddSorted = [...oddVerts];
  // Pair greedily by shortest available edge.
  while (usedOdd.size < oddVerts.length) {
    let bestI = -1;
    let bestJ = -1;
    let bestD = Infinity;
    for (let a = 0; a < oddSorted.length; a += 1) {
      const va = oddSorted[a];
      if (usedOdd.has(va)) continue;
      for (let b = a + 1; b < oddSorted.length; b += 1) {
        const vb = oddSorted[b];
        if (usedOdd.has(vb)) continue;
        if (dm[va][vb] < bestD) {
          bestD = dm[va][vb];
          bestI = va;
          bestJ = vb;
        }
      }
    }
    if (bestI === -1) break;
    usedOdd.add(bestI);
    usedOdd.add(bestJ);
    matching.push([bestI, bestJ]);
    frames.push({
      phase: 'matching',
      mstEdges: mstEdges.map((e) => [...e]),
      matching: matching.map((e) => [...e]),
      tourEdges: [],
      order: [],
      closed: false,
      oddSet: [...oddVerts],
      caption: `Greedy matching: pair odd vertices ${bestI}-${bestJ} (d = ${bestD.toFixed(1)}).`,
    });
  }

  // ---- 4) Build multigraph adjacency ----
  const multi = Array.from({ length: n }, () => []);
  for (const [a, b] of mstEdges) {
    multi[a].push(b);
    multi[b].push(a);
  }
  for (const [a, b] of matching) {
    multi[a].push(b);
    multi[b].push(a);
  }

  // ---- 5) Hierholzer's Eulerian circuit ----
  // Track edges as multiset using counts in a per-pair map.
  const adj = multi.map((list) => list.slice());
  const stack = [0];
  const circuit = [];
  while (stack.length) {
    const v = stack[stack.length - 1];
    if (adj[v].length > 0) {
      const u = adj[v].pop();
      const idx = adj[u].indexOf(v);
      if (idx !== -1) adj[u].splice(idx, 1);
      stack.push(u);
    } else {
      circuit.push(stack.pop());
    }
  }
  circuit.reverse();

  // ---- 6) Shortcut to Hamiltonian tour ----
  const seen = new Set();
  const tour = [];
  for (const v of circuit) {
    if (!seen.has(v)) {
      seen.add(v);
      tour.push(v);
    }
  }
  // Build tour edges progressively for animation.
  const tourEdgesProgress = [];
  for (let i = 0; i < tour.length; i += 1) {
    const a = tour[i];
    const b = tour[(i + 1) % tour.length];
    tourEdgesProgress.push([a, b]);
    frames.push({
      phase: 'shortcut',
      mstEdges: mstEdges.map((e) => [...e]),
      matching: matching.map((e) => [...e]),
      tourEdges: tourEdgesProgress.map((e) => [...e]),
      order: tour.slice(0, Math.min(i + 2, tour.length)),
      closed: i === tour.length - 1,
      caption:
        i === tour.length - 1
          ? `Shortcut Eulerian -> Hamiltonian. Final tour length = ${tourLength(tour, cities).toFixed(1)}.`
          : `Shortcut: walk Eulerian circuit and skip already-visited cities. Edge ${a}-${b}.`,
    });
  }

  return {
    frames,
    finalOrder: tour,
    finalLength: tourLength(tour, cities),
    mstEdges,
    matching,
  };
}

// 2-opt improvement on a starting tour.
function twoOptFrames(startOrder, cities, maxPasses = 6) {
  const n = startOrder.length;
  const dm = buildDistMatrix(cities);
  let order = [...startOrder];
  let bestLen = tourLength(order, cities);
  const frames = [];
  frames.push({
    order: [...order],
    swap: null,
    caption: `Start from existing tour. Length = ${bestLen.toFixed(1)}. Try every edge pair (i, k) and reverse if it shortens the tour.`,
  });
  let improved = true;
  let pass = 0;
  while (improved && pass < maxPasses) {
    improved = false;
    pass += 1;
    for (let i = 0; i < n - 1; i += 1) {
      for (let k = i + 1; k < n; k += 1) {
        const a = order[i];
        const b = order[(i + 1) % n];
        const c = order[k];
        const d = order[(k + 1) % n];
        if (a === c || b === d || a === d) continue;
        const before = dm[a][b] + dm[c][d];
        const after = dm[a][c] + dm[b][d];
        const delta = after - before;
        if (delta < -1e-9) {
          // Reverse segment i+1..k
          const newOrder = order.slice(0, i + 1)
            .concat(order.slice(i + 1, k + 1).reverse())
            .concat(order.slice(k + 1));
          order = newOrder;
          bestLen = tourLength(order, cities);
          frames.push({
            order: [...order],
            swap: { i, k, a, b, c, d, delta },
            caption: `Pass ${pass}: swap edges (${a}-${b}) and (${c}-${d}) -> (${a}-${c}) and (${b}-${d}). Saves ${(-delta).toFixed(1)}. New length ${bestLen.toFixed(1)}.`,
          });
          improved = true;
        }
      }
    }
  }
  frames.push({
    order: [...order],
    swap: null,
    caption: `2-opt converged after ${pass} pass${pass === 1 ? '' : 'es'}. Final length = ${bestLen.toFixed(1)}.`,
  });
  return { frames, finalOrder: order, finalLength: bestLen };
}

const ALGOS = [
  { id: 'nearest', label: 'Nearest neighbour', icon: Zap },
  { id: 'christofides', label: 'Christofides-style', icon: GitBranch },
  { id: 'twoopt', label: '2-opt improvement', icon: RotateCcw },
];

export default function TSPApproxViz() {
  const [seed, setSeed] = useState(42);
  const [algo, setAlgo] = useState('nearest');
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [results, setResults] = useState({}); // { nearest: len, christofides: len, twoopt: len }
  const timerRef = useRef(null);

  const cities = useMemo(() => generateCities(seed), [seed]);

  // Pre-compute frame banks per algorithm. For 2-opt we need a seed tour;
  // use the nearest-neighbour final order so the swaps land on something real.
  const nearestRun = useMemo(() => nearestNeighborFrames(cities, 0), [cities]);
  const christofidesRun = useMemo(() => christofidesFrames(cities), [cities]);
  const twoOptRun = useMemo(
    () => twoOptFrames(nearestRun.finalOrder, cities),
    [cities, nearestRun.finalOrder]
  );

  const activeRun = algo === 'nearest'
    ? nearestRun
    : algo === 'christofides'
      ? christofidesRun
      : twoOptRun;
  const frames = activeRun.frames;
  const step = frames[Math.min(idx, frames.length - 1)] || frames[0];
  const atEnd = idx >= frames.length - 1;

  // Reset playhead when algo or seed changes.
  const [prevAlgoSeed, setPrevAlgoSeed] = useState({ algo, seed });
  if (prevAlgoSeed.algo !== algo || prevAlgoSeed.seed !== seed) {
    setPrevAlgoSeed({ algo, seed });
    setIdx(0);
    setPlaying(false);
  }

  // Auto-record result whenever a run finishes playback.
  const recordKey = atEnd ? `${algo}:${activeRun.finalLength}` : null;
  const [prevRecordKey, setPrevRecordKey] = useState(null);
  if (recordKey !== null && recordKey !== prevRecordKey) {
    setPrevRecordKey(recordKey);
    setResults((prev) => {
      if (prev[algo] !== undefined && Math.abs(prev[algo] - activeRun.finalLength) < 1e-6) {
        return prev;
      }
      return { ...prev, [algo]: activeRun.finalLength };
    });
  }

  // Derive `playing` so the interval effect never has to call setPlaying(false)
  // on reaching the last frame — avoids cascading-render lint.
  const playing = playingRaw && idx < frames.length - 1;

  const advance = useCallback(() => {
    setIdx((i) => (i >= frames.length - 1 ? i : i + 1));
  }, [frames.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(advance, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, advance]);

  const handleRun = () => {
    if (atEnd) {
      setIdx(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const handleNewCities = () => {
    setPlaying(false);
    setSeed((s) => (s * 1664525 + 1013904223) >>> 0);
    setResults({});
  };

  // Derive edges to render for current step.
  const renderEdges = useMemo(() => {
    const out = {
      mst: [],
      matching: [],
      tour: [], // array of {from, to, kind}
      candidate: null,
      swap: null,
    };

    if (algo === 'nearest') {
      const order = step.order || [];
      for (let i = 0; i < order.length - 1; i += 1) {
        out.tour.push({ from: order[i], to: order[i + 1], kind: 'solid' });
      }
      if (step.closed && order.length > 1) {
        out.tour.push({ from: order[order.length - 1], to: order[0], kind: 'close' });
      }
      if (step.candidate) {
        out.candidate = step.candidate;
      }
    } else if (algo === 'christofides') {
      out.mst = step.mstEdges || [];
      out.matching = step.matching || [];
      const tourEdges = step.tourEdges || [];
      tourEdges.forEach(([a, b]) => out.tour.push({ from: a, to: b, kind: 'solid' }));
    } else if (algo === 'twoopt') {
      const order = step.order || [];
      for (let i = 0; i < order.length; i += 1) {
        const a = order[i];
        const b = order[(i + 1) % order.length];
        out.tour.push({ from: a, to: b, kind: 'solid' });
      }
      if (step.swap) out.swap = step.swap;
    }
    return out;
  }, [algo, step]);

  const currentLength = useMemo(() => {
    if (algo === 'nearest') {
      const o = step.order || [];
      if (!step.closed || o.length < 2) {
        // partial path length
        let s = 0;
        for (let i = 0; i < o.length - 1; i += 1) s += dist(cities[o[i]], cities[o[i + 1]]);
        return s;
      }
      return tourLength(o, cities);
    }
    if (algo === 'twoopt') {
      const o = step.order || [];
      return tourLength(o, cities);
    }
    if (algo === 'christofides') {
      const tourEdges = step.tourEdges || [];
      if (tourEdges.length === cities.length) {
        // Closed tour
        return tourEdges.reduce((acc, [a, b]) => acc + dist(cities[a], cities[b]), 0);
      }
      // Partial
      return tourEdges.reduce((acc, [a, b]) => acc + dist(cities[a], cities[b]), 0);
    }
    return 0;
  }, [algo, step, cities]);

  const visitedSet = useMemo(() => {
    if (algo === 'nearest') return new Set(step.order || []);
    if (algo === 'twoopt') return new Set(step.order || []);
    if (algo === 'christofides') {
      // Highlight all cities once the tour begins; before that, the active subset
      // is the matching/odd set being discussed.
      if ((step.tourEdges || []).length > 0) {
        return new Set(cities.map((c) => c.id));
      }
      return new Set();
    }
    return new Set();
  }, [algo, step, cities]);

  const oddHighlight = useMemo(() => {
    if (algo !== 'christofides') return new Set();
    return new Set(step.oddSet || []);
  }, [algo, step]);

  const ranked = useMemo(() => {
    const entries = Object.entries(results).map(([k, v]) => ({
      id: k,
      label: ALGOS.find((a) => a.id === k)?.label || k,
      length: v,
    }));
    entries.sort((a, b) => a.length - b.length);
    return entries;
  }, [results]);

  return (
    <div className="tspviz">
      <div className="tspviz-header">
        <div className="tspviz-title">Traveling Salesman approximations</div>
        <div className="tspviz-seed">
          <span className="tspviz-seed-label">Seed</span>
          <span className="tspviz-seed-value">{seed}</span>
        </div>
      </div>

      <div className="tspviz-modes" role="toolbar" aria-label="Algorithm">
        {ALGOS.map((a) => {
          const Icon = a.icon;
          const active = algo === a.id;
          return (
            <button
              key={a.id}
              type="button"
              className={`tspviz-mode ${active ? 'tspviz-mode-active' : ''}`}
              onClick={() => setAlgo(a.id)}
              aria-pressed={active}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>

      <div className="tspviz-legend">
        <span className="tspviz-legend-item">
          <span className="tspviz-swatch tspviz-swatch-city" /> city
        </span>
        <span className="tspviz-legend-item">
          <span className="tspviz-swatch tspviz-swatch-visited" /> visited
        </span>
        <span className="tspviz-legend-item">
          <span className="tspviz-swatch tspviz-swatch-tour" /> tour edge
        </span>
        {algo === 'christofides' && (
          <>
            <span className="tspviz-legend-item">
              <span className="tspviz-swatch tspviz-swatch-mst" /> MST
            </span>
            <span className="tspviz-legend-item">
              <span className="tspviz-swatch tspviz-swatch-match" /> matching
            </span>
            <span className="tspviz-legend-item">
              <span className="tspviz-swatch tspviz-swatch-odd" /> odd-degree
            </span>
          </>
        )}
        {algo === 'twoopt' && (
          <span className="tspviz-legend-item">
            <span className="tspviz-swatch tspviz-swatch-swap" /> swapped pair
          </span>
        )}
        {algo === 'nearest' && (
          <span className="tspviz-legend-item">
            <span className="tspviz-swatch tspviz-swatch-candidate" /> chosen edge
          </span>
        )}
      </div>

      <div className="tspviz-stage">
        <svg
          className="tspviz-svg"
          viewBox={`0 0 ${PLANE_W} ${PLANE_H}`}
          role="img"
          aria-label="Traveling salesman tour on a plane"
        >
          <defs>
            <pattern
              id="tspviz-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" className="tspviz-grid-line" />
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width={PLANE_W}
            height={PLANE_H}
            className="tspviz-plane"
          />
          <rect
            x="0"
            y="0"
            width={PLANE_W}
            height={PLANE_H}
            fill="url(#tspviz-grid)"
          />

          {/* MST edges (Christofides only) */}
          {renderEdges.mst.map(([a, b], i) => {
            const ca = cities[a];
            const cb = cities[b];
            return (
              <line
                key={`mst-${i}`}
                x1={ca.x}
                y1={ca.y}
                x2={cb.x}
                y2={cb.y}
                className="tspviz-edge-mst"
              />
            );
          })}

          {/* Matching edges */}
          {renderEdges.matching.map(([a, b], i) => {
            const ca = cities[a];
            const cb = cities[b];
            return (
              <line
                key={`match-${i}`}
                x1={ca.x}
                y1={ca.y}
                x2={cb.x}
                y2={cb.y}
                className="tspviz-edge-match"
              />
            );
          })}

          {/* Tour edges */}
          {renderEdges.tour.map((e, i) => {
            const ca = cities[e.from];
            const cb = cities[e.to];
            return (
              <line
                key={`tour-${i}`}
                x1={ca.x}
                y1={ca.y}
                x2={cb.x}
                y2={cb.y}
                className={`tspviz-edge-tour ${e.kind === 'close' ? 'tspviz-edge-tour-close' : ''}`}
              />
            );
          })}

          {/* Nearest-neighbour candidate (animated head) */}
          {renderEdges.candidate && (() => {
            const ca = cities[renderEdges.candidate.from];
            const cb = cities[renderEdges.candidate.to];
            return (
              <line
                x1={ca.x}
                y1={ca.y}
                x2={cb.x}
                y2={cb.y}
                className="tspviz-edge-candidate"
              />
            );
          })()}

          {/* 2-opt swap arrows */}
          {renderEdges.swap && (() => {
            const { a, b, c, d } = renderEdges.swap;
            const ca = cities[a];
            const cb = cities[b];
            const cc = cities[c];
            const cd = cities[d];
            return (
              <g className="tspviz-swap-group">
                <line x1={ca.x} y1={ca.y} x2={cc.x} y2={cc.y} className="tspviz-edge-swap" />
                <line x1={cb.x} y1={cb.y} x2={cd.x} y2={cd.y} className="tspviz-edge-swap" />
              </g>
            );
          })()}

          {/* Cities */}
          {cities.map((c) => {
            const visited = visitedSet.has(c.id);
            const isOdd = oddHighlight.has(c.id);
            const isCandidateFrom =
              renderEdges.candidate && renderEdges.candidate.from === c.id;
            const isCandidateTo =
              renderEdges.candidate && renderEdges.candidate.to === c.id;
            let cls = 'tspviz-city';
            if (visited) cls += ' tspviz-city-visited';
            if (isOdd) cls += ' tspviz-city-odd';
            if (isCandidateTo) cls += ' tspviz-city-active';
            if (isCandidateFrom) cls += ' tspviz-city-current';
            return (
              <g key={c.id} transform={`translate(${c.x},${c.y})`} className={cls}>
                <circle r="9" className="tspviz-city-bg" />
                <circle r="5" className="tspviz-city-dot" />
                <text
                  y="-12"
                  textAnchor="middle"
                  className="tspviz-city-label"
                >
                  {c.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tspviz-status">
        <div className="tspviz-status-row">
          <span className="tspviz-status-label">Step</span>
          <span className="tspviz-status-value">
            {idx} / {frames.length - 1}
          </span>
        </div>
        <div className="tspviz-status-row">
          <span className="tspviz-status-label">Cities</span>
          <span className="tspviz-status-value">{cities.length}</span>
        </div>
        <div className="tspviz-status-row">
          <span className="tspviz-status-label">Current length</span>
          <span className="tspviz-status-value tspviz-status-len">
            {currentLength.toFixed(1)}
          </span>
        </div>
        <div className="tspviz-status-row">
          <span className="tspviz-status-label">Algorithm</span>
          <span className="tspviz-status-value">
            {ALGOS.find((a) => a.id === algo)?.label}
          </span>
        </div>
      </div>

      <p className="tspviz-caption">
        <span>{step.caption}</span>
      </p>

      <div className="tspviz-controls">
        <button
          type="button"
          className="tspviz-btn tspviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="tspviz-btn tspviz-btn-primary"
          onClick={handleRun}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          <Play size={16} />
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : `Run ${ALGOS.find((a) => a.id === algo)?.label.toLowerCase()}`}</span>
        </button>
        <button
          type="button"
          className="tspviz-btn tspviz-btn-secondary"
          onClick={handleNewCities}
          aria-label="New cities"
        >
          <Shuffle size={16} />
          <span>New cities</span>
        </button>
      </div>

      {ranked.length > 0 && (
        <div className="tspviz-results">
          <div className="tspviz-results-head">
            <Trophy size={14} aria-hidden="true" />
            <span>Comparison</span>
          </div>
          <div className="tspviz-results-rows">
            {ranked.map((r, i) => {
              const best = ranked[0].length;
              const ratio = best > 0 ? r.length / best : 1;
              const pct = Math.min(100, (best / r.length) * 100);
              return (
                <div key={r.id} className={`tspviz-result-row ${i === 0 ? 'tspviz-result-row-best' : ''}`}>
                  <span className="tspviz-result-rank">#{i + 1}</span>
                  <span className="tspviz-result-name">{r.label}</span>
                  <div className="tspviz-result-bar">
                    <div
                      className="tspviz-result-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="tspviz-result-len">{r.length.toFixed(1)}</span>
                  <span className="tspviz-result-ratio">
                    {i === 0 ? 'best' : `${(ratio * 100 - 100).toFixed(1)}% longer`}
                  </span>
                </div>
              );
            })}
          </div>
          {ranked.length < ALGOS.length && (
            <div className="tspviz-results-hint">
              Run the other algorithms to fill the leaderboard.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
