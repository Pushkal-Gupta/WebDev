import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Square, StepForward, FastForward } from 'lucide-react';
import './MLViz.css';

const SIZE = 460;
const PAD = 30;
const N = 10;
const K_LAYERS = 3;
const FEATURE_DIM = 3;
const ANIM_MS = 720;
const STEP_DELAY = 280;

const FEATURE_COLORS = [
  'var(--hue-sky, #5ecbff)',
  'var(--hue-pink, #ff66cc)',
  'var(--hue-mint, #74e3a3)',
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
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

// Layout 10 nodes around a central node + outer ring for a clearer "neighborhood".
function buildGraph(seed) {
  const rand = rngFrom(seed * 23 + 11);
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const nodes = [];
  // Node 0: center.
  nodes.push({ id: 0, x: cx, y: cy });
  // Nodes 1..6: inner ring.
  const innerR = 95;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: i + 1,
      x: cx + Math.cos(a) * innerR,
      y: cy + Math.sin(a) * innerR,
    });
  }
  // Nodes 7..9: outer satellites.
  const outerR = 175;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    nodes.push({
      id: i + 7,
      x: cx + Math.cos(a) * outerR,
      y: cy + Math.sin(a) * outerR,
    });
  }
  // Edges: center connected to inner ring, inner ring connected cyclically,
  // outer satellites attach to nearest inner ring nodes plus one extra.
  const edges = new Set();
  const addEdge = (a, b) => {
    if (a === b) return;
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    edges.add(k);
  };
  for (let i = 1; i <= 6; i++) addEdge(0, i);
  for (let i = 1; i <= 6; i++) addEdge(i, i === 6 ? 1 : i + 1);
  addEdge(7, 1); addEdge(7, 2); addEdge(7, 6);
  addEdge(8, 3); addEdge(8, 4); addEdge(8, 2);
  addEdge(9, 5); addEdge(9, 6); addEdge(9, 4);
  // Sprinkle a deterministic extra edge for irregularity.
  const extras = [[1, 4], [3, 5]];
  for (const [a, b] of extras) {
    if (rand() > 0.3) addEdge(a, b);
  }
  const edgeList = Array.from(edges).map((k) => {
    const [a, b] = k.split('-').map(Number);
    return { a, b };
  });
  // Adjacency including self loop (standard GCN trick).
  const adj = Array.from({ length: N }, (_, i) => new Set([i]));
  for (const { a, b } of edgeList) {
    adj[a].add(b);
    adj[b].add(a);
  }
  return { nodes, edges: edgeList, adj: adj.map((s) => Array.from(s).sort((p, q) => p - q)) };
}

function initFeatures(seed) {
  const rand = rngFrom(seed * 41 + 7);
  const feats = [];
  for (let i = 0; i < N; i++) {
    const f = [];
    for (let d = 0; d < FEATURE_DIM; d++) {
      f.push(rand() * 0.9 + 0.05);
    }
    feats.push(f);
  }
  return feats;
}

// Fixed weight matrix per layer (3x3) + bias — deterministic from seed, mild rotation.
function initWeights(seed) {
  const layers = [];
  for (let l = 0; l < K_LAYERS; l++) {
    const rand = rngFrom((seed + l * 97) * 19 + 3);
    const W = [];
    for (let r = 0; r < FEATURE_DIM; r++) {
      const row = [];
      for (let c = 0; c < FEATURE_DIM; c++) {
        // Sample around identity-ish so updates stay bounded and visually meaningful.
        const base = r === c ? 0.8 : 0.0;
        row.push(base + (rand() - 0.5) * 0.6);
      }
      W.push(row);
    }
    const b = [];
    for (let r = 0; r < FEATURE_DIM; r++) b.push((rand() - 0.5) * 0.1);
    layers.push({ W, b });
  }
  return layers;
}

function relu(v) {
  return Math.max(0, v);
}

// Mean-pool neighbor features (self loop already in adj) → W·mean + b → ReLU.
function gcnLayer(features, adj, W, b) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const nbrs = adj[i];
    const mean = new Array(FEATURE_DIM).fill(0);
    for (const j of nbrs) {
      for (let d = 0; d < FEATURE_DIM; d++) mean[d] += features[j][d];
    }
    for (let d = 0; d < FEATURE_DIM; d++) mean[d] /= nbrs.length;
    const out_i = new Array(FEATURE_DIM).fill(0);
    for (let r = 0; r < FEATURE_DIM; r++) {
      let s = b[r];
      for (let c = 0; c < FEATURE_DIM; c++) s += W[r][c] * mean[c];
      out_i[r] = relu(s);
    }
    out.push(out_i);
  }
  return out;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerpFeats(a, b, t) {
  return a.map((fa, i) => fa.map((v, d) => v + (b[i][d] - v) * t));
}

// Max value across all features (for bar scaling). Clamp away from 0 to keep bars visible.
function maxFeature(feats) {
  let m = 0.1;
  for (const f of feats) for (const v of f) if (v > m) m = v;
  return m;
}

const NODE_R = 18;
const BAR_W = 4;
const BAR_GAP = 2;
const BAR_MAX_H = 22;

function FeatureBars({ feat, scale, highlight }) {
  const totalW = FEATURE_DIM * BAR_W + (FEATURE_DIM - 1) * BAR_GAP;
  const startX = -totalW / 2;
  return (
    <g>
      {feat.map((v, d) => {
        const h = Math.max(1.5, (v / scale) * BAR_MAX_H);
        return (
          <rect
            key={`b${d}`}
            x={startX + d * (BAR_W + BAR_GAP)}
            y={-h - 1}
            width={BAR_W}
            height={h}
            rx={1}
            fill={FEATURE_COLORS[d]}
            opacity={highlight ? 1 : 0.85}
            style={{ transition: 'height 0.4s ease, y 0.4s ease' }}
          />
        );
      })}
    </g>
  );
}

export default function GCNViz() {
  const animRef = useRef(null);
  const runningRef = useRef(false);
  const cancelRef = useRef(false);

  const [graphSeed, setGraphSeed] = useState(1);
  const [featSeed, setFeatSeed] = useState(1);

  const graph = useMemo(() => buildGraph(graphSeed), [graphSeed]);
  const weights = useMemo(() => initWeights(graphSeed), [graphSeed]);

  const baseFeats = useMemo(() => initFeatures(featSeed), [featSeed]);

  const [features, setFeatures] = useState(baseFeats);
  const [renderFeats, setRenderFeats] = useState(baseFeats);
  const [layer, setLayer] = useState(0);
  // Index of the node currently being aggregated (-1 = none / global step).
  const [focusNode, setFocusNode] = useState(-1);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('ready'); // 'ready' | 'aggregating' | 'updating' | 'done'

  const cancelAnim = useCallback(() => {
    cancelRef.current = true;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    cancelAnim();
  }, [cancelAnim]);

  const hardReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    cancelAnim();
    cancelRef.current = false;
    setFeatures(baseFeats);
    setRenderFeats(baseFeats);
    setLayer(0);
    setFocusNode(-1);
    setPhase('ready');
  }, [baseFeats, cancelAnim]);

  useEffect(() => {
    hardReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphSeed, featSeed]);

  const wait = useCallback((ms) =>
    new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        if (cancelRef.current) { resolve(); return; }
        if (now - start >= ms) { resolve(); return; }
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    }), []);

  const animateFeats = useCallback((from, to, ms = ANIM_MS) =>
    new Promise((resolve) => {
      cancelRef.current = false;
      const start = performance.now();
      const tick = (now) => {
        if (cancelRef.current) {
          setRenderFeats(to);
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / ms);
        const e = easeInOut(t);
        setRenderFeats(lerpFeats(from, to, e));
        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      animRef.current = requestAnimationFrame(tick);
    }), []);

  const doLayer = useCallback(async () => {
    if (layer >= K_LAYERS) return;
    const { W, b } = weights[layer];
    const next = gcnLayer(features, graph.adj, W, b);
    // Walk through each node sequentially for the "aggregation sweep" feel.
    setPhase('aggregating');
    const SWEEP_MS = 110;
    for (let i = 0; i < N; i++) {
      if (cancelRef.current) break;
      setFocusNode(i);
      await wait(SWEEP_MS);
    }
    if (cancelRef.current) return;
    setFocusNode(-1);
    setPhase('updating');
    await animateFeats(features, next);
    if (cancelRef.current) return;
    setFeatures(next);
    setRenderFeats(next);
    setLayer((l) => l + 1);
    setPhase(layer + 1 >= K_LAYERS ? 'done' : 'ready');
  }, [animateFeats, features, graph.adj, layer, wait, weights]);

  const handleStep = useCallback(async () => {
    if (runningRef.current || layer >= K_LAYERS) return;
    runningRef.current = true;
    setRunning(true);
    await doLayer();
    runningRef.current = false;
    setRunning(false);
  }, [doLayer, layer]);

  const handleRunAll = useCallback(async () => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      cancelAnim();
      return;
    }
    if (layer >= K_LAYERS) return;
    runningRef.current = true;
    setRunning(true);
    cancelRef.current = false;
    let curFeats = features;
    let curLayer = layer;
    while (runningRef.current && curLayer < K_LAYERS) {
      const { W, b } = weights[curLayer];
      const next = gcnLayer(curFeats, graph.adj, W, b);
      setPhase('aggregating');
      const SWEEP_MS = 90;
      for (let i = 0; i < N; i++) {
        if (!runningRef.current || cancelRef.current) break;
        setFocusNode(i);
        await wait(SWEEP_MS);
      }
      if (!runningRef.current || cancelRef.current) break;
      setFocusNode(-1);
      setPhase('updating');
      await animateFeats(curFeats, next);
      if (!runningRef.current || cancelRef.current) break;
      curFeats = next;
      curLayer += 1;
      setFeatures(next);
      setRenderFeats(next);
      setLayer(curLayer);
      setPhase(curLayer >= K_LAYERS ? 'done' : 'ready');
      await wait(STEP_DELAY);
    }
    runningRef.current = false;
    setRunning(false);
  }, [animateFeats, cancelAnim, features, graph.adj, layer, wait, weights]);

  const handleReset = useCallback(() => {
    hardReset();
  }, [hardReset]);

  const handleNewGraph = useCallback(() => {
    setGraphSeed((s) => (s + 1) >>> 0);
  }, []);

  const handleNewFeats = useCallback(() => {
    setFeatSeed((s) => (s + 1) >>> 0);
  }, []);

  const scale = useMemo(() => maxFeature(renderFeats), [renderFeats]);

  const focusNbrs = useMemo(() => {
    if (focusNode < 0) return new Set();
    return new Set(graph.adj[focusNode]);
  }, [focusNode, graph.adj]);

  const phaseLabel = (() => {
    switch (phase) {
      case 'aggregating':
        return focusNode >= 0
          ? `node ${focusNode} · mean-pool ${graph.adj[focusNode].length} neighbors`
          : 'aggregating';
      case 'updating':
        return 'h_new = ReLU(W · mean + b)';
      case 'done':
        return `${K_LAYERS}-hop receptive field reached`;
      default:
        return layer === 0 ? 'layer 0 · raw features' : `layer ${layer} ready`;
    }
  })();

  const done = layer >= K_LAYERS;

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glowTransition = reducedMotion ? 'none' : 'opacity 0.25s ease';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg" style={{ maxWidth: 560 }}>
          <defs>
            <linearGradient id="gcn-edge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet, #c39bff)" />
            </linearGradient>
            <filter id="gcn-edge-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <filter id="gcn-node-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id="gcn-ring-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
          </defs>

          {/* Soft glow under incident/active edges (decoration, behind everything). */}
          {graph.edges.map(({ a, b }, i) => {
            const incident =
              focusNode >= 0 && (a === focusNode || b === focusNode);
            if (!incident) return null;
            const na = graph.nodes[a];
            const nb = graph.nodes[b];
            return (
              <line
                key={`eg${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="url(#gcn-edge-grad)"
                strokeWidth={4.5}
                strokeLinecap="round"
                filter="url(#gcn-edge-glow)"
                opacity={0.5}
                pointerEvents="none"
                style={{ transition: glowTransition }}
              />
            );
          })}

          {/* Edges so they sit behind nodes. */}
          {graph.edges.map(({ a, b }, i) => {
            const na = graph.nodes[a];
            const nb = graph.nodes[b];
            const incident =
              focusNode >= 0 && (a === focusNode || b === focusNode);
            return (
              <line
                key={`e${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={incident ? 'url(#gcn-edge-grad)' : 'var(--border)'}
                strokeWidth={incident ? 1.8 : 0.9}
                opacity={incident ? 0.95 : 0.55}
                style={{ transition: 'stroke 0.25s ease, opacity 0.25s ease' }}
              />
            );
          })}

          {/* Neighbor halos (violet) + focus halo (accent), behind node circles. */}
          {focusNode >= 0 && graph.nodes.map((n, i) => {
            const isFocus = i === focusNode;
            const isNbr = focusNbrs.has(i) && !isFocus;
            if (!isFocus && !isNbr) return null;
            return (
              <circle
                key={`halo${i}`}
                cx={n.x}
                cy={n.y}
                r={NODE_R + (isFocus ? 5 : 2)}
                fill={isFocus ? 'var(--accent)' : 'var(--hue-violet, #c39bff)'}
                filter="url(#gcn-node-glow)"
                opacity={isFocus ? 0.45 : 0.28}
                pointerEvents="none"
                style={{ transition: glowTransition }}
              />
            );
          })}

          {/* Aggregation ring around focused node + gentle glow. */}
          {focusNode >= 0 && (
            <g pointerEvents="none">
              <circle
                cx={graph.nodes[focusNode].x}
                cy={graph.nodes[focusNode].y}
                r={NODE_R + 9}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.6}
                strokeDasharray="3 3"
                filter="url(#gcn-ring-glow)"
                opacity={0.5}
                style={{ transition: glowTransition }}
              />
              <circle
                cx={graph.nodes[focusNode].x}
                cy={graph.nodes[focusNode].y}
                r={NODE_R + 9}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                opacity={0.8}
              />
            </g>
          )}

          {/* Nodes with feature bars. */}
          {graph.nodes.map((n, i) => {
            const isFocus = i === focusNode;
            const isNbr = focusNbrs.has(i) && !isFocus;
            const dimmed = focusNode >= 0 && !isFocus && !isNbr;
            return (
              <g
                key={`n${i}`}
                transform={`translate(${n.x} ${n.y})`}
                opacity={dimmed ? 0.32 : 1}
                style={{ transition: 'opacity 0.25s ease' }}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={NODE_R}
                  fill="var(--surface)"
                  stroke={isFocus ? 'var(--accent)' : isNbr ? 'var(--hue-violet, #c39bff)' : 'var(--border)'}
                  strokeWidth={isFocus ? 2.2 : isNbr ? 1.6 : 1}
                />
                <FeatureBars feat={renderFeats[i]} scale={scale} highlight={isFocus || isNbr} />
                <text
                  y={NODE_R + 11}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--mono)"
                  fill={isFocus ? 'var(--accent)' : 'var(--text-dim)'}
                  fontWeight={isFocus ? 700 : 500}
                >
                  h{i}
                </text>
              </g>
            );
          })}

          {/* Layer pill in top-left. */}
          <g transform={`translate(${PAD - 8} ${PAD - 10})`}>
            <rect
              x={0}
              y={0}
              width={120}
              height={22}
              rx={11}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth="0.6"
              opacity={0.95}
            />
            <text
              x={10}
              y={14}
              fontSize="10"
              fontFamily="var(--mono)"
              fill="var(--text-main)"
              letterSpacing="0.05em"
            >
              LAYER {layer} / {K_LAYERS}
            </text>
            <circle cx={104} cy={11} r={4} fill={done ? 'var(--hue-mint, #74e3a3)' : 'var(--accent)'} />
          </g>

          {/* Feature legend bottom-right. */}
          <g transform={`translate(${SIZE - PAD - 86} ${SIZE - PAD - 30})`}>
            <rect
              x={-6}
              y={-12}
              width={98}
              height={34}
              rx={4}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth="0.6"
              opacity={0.92}
            />
            <text
              x={0}
              y={-2}
              fontSize="8"
              fontFamily="var(--mono)"
              fill="var(--text-dim)"
              letterSpacing="0.1em"
            >
              FEATURE DIMS
            </text>
            {FEATURE_COLORS.map((c, d) => (
              <g key={`lg${d}`} transform={`translate(${d * 28} 10)`}>
                <rect x={0} y={0} width={6} height={9} fill={c} rx={1} />
                <text
                  x={10}
                  y={8}
                  fontSize="8"
                  fontFamily="var(--mono)"
                  fill="var(--text-main)"
                >
                  d{d}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>GCN</span>
          <span className="mlviz-val">N = {N}</span>
          <span className="mlviz-sub">layer {layer}/{K_LAYERS}</span>
          <span className="mlviz-sub">|E| = {graph.edges.length}</span>
          <span
            className="mlviz-sub"
            style={{ color: done ? 'var(--hue-mint, #74e3a3)' : 'var(--text-dim)' }}
          >
            {phaseLabel}
          </span>
        </div>

        {focusNode >= 0 && (
          <div className="mlviz-row" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
            <span className="mlviz-sub">h{focusNode} =</span>
            {renderFeats[focusNode].map((v, d) => (
              <span
                key={`fv${d}`}
                className="mlviz-toggle"
                style={{
                  '--toggle-color': FEATURE_COLORS[d],
                  cursor: 'default',
                  color: 'var(--text-main)',
                  borderColor: FEATURE_COLORS[d],
                  background: `color-mix(in srgb, ${FEATURE_COLORS[d]} 12%, transparent)`,
                }}
              >
                <span className="mlviz-toggle-dot" />
                d{d} {snap(v, 2)}
              </span>
            ))}
            <span className="mlviz-sub">
              · nbrs {graph.adj[focusNode].filter((j) => j !== focusNode).join(', ') || '—'}
            </span>
          </div>
        )}

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || done}
            title="Run one GCN layer: mean-pool neighbors → W·mean + b → ReLU"
          >
            <StepForward size={13} />
            <span>Step layer</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRunAll}
            disabled={done && !running}
            title="Run all 3 layers in sequence"
          >
            {running ? <Square size={13} /> : <FastForward size={13} />}
            <span>{running ? 'Stop' : `Run all ${K_LAYERS} layers`}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
            title="Restore initial node features"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewFeats}
            disabled={running}
            title="Resample initial node features"
          >
            <Play size={13} />
            <span>New features</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewGraph}
            disabled={running}
            title="Rewire the graph and resample weights"
          >
            <Play size={13} />
            <span>New graph</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {done
            ? `after ${K_LAYERS} layers each node encodes its ${K_LAYERS}-hop neighborhood`
            : 'each layer: gather neighbor features → mean → linear map → ReLU. K layers reach K hops.'}
        </div>
      </div>
    </div>
  );
}
