import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './GraphColoringViz.css';

// A crown-style graph (2-colorable). The L set {A,C,E} and the R set {B,D,F}
// are fully cross-connected except matching pairs; hub G links the L side.
// Node IDS alternate L,R so the NATURAL id-order is the adversarial one:
// pairing A-B, C-D, E-F early forces greedy up to 4 colors, while the
// by-degree (Welsh-Powell) order recovers the optimal 2-coloring.
const NODES = [
  { id: 0, label: 'A', x: 140, y: 80 },  // L0
  { id: 1, label: 'B', x: 430, y: 80 },  // R0
  { id: 2, label: 'C', x: 140, y: 185 }, // L1
  { id: 3, label: 'D', x: 430, y: 185 }, // R1
  { id: 4, label: 'E', x: 140, y: 290 }, // L2
  { id: 5, label: 'F', x: 430, y: 290 }, // R2
  { id: 6, label: 'G', x: 285, y: 185 }, // hub
];

// Crown edges: Li -- Rj for i != j, plus hub G -- each Li.
const EDGES = [
  { u: 0, v: 3 }, // A-D
  { u: 0, v: 5 }, // A-F
  { u: 2, v: 1 }, // C-B
  { u: 2, v: 5 }, // C-F
  { u: 4, v: 1 }, // E-B
  { u: 4, v: 3 }, // E-D
  { u: 6, v: 0 }, // G-A
  { u: 6, v: 2 }, // G-C
  { u: 6, v: 4 }, // G-E
].map((e, i) => ({ ...e, id: i }));

const COLOR_TOKENS = [
  'var(--hue-sky)',
  'var(--hue-pink)',
  'var(--hue-mint)',
  'var(--hue-violet)',
  'var(--medium)',
  'var(--accent)',
];

function buildAdj() {
  const adj = NODES.map(() => []);
  for (const e of EDGES) {
    adj[e.u].push(e.v);
    adj[e.v].push(e.u);
  }
  return adj;
}

function degrees(adj) {
  return adj.map((a) => a.length);
}

// Welsh-Powell: vertices in descending degree order (ties broken by id).
function welshPowellOrder(adj) {
  const deg = degrees(adj);
  return NODES.map((n) => n.id).sort((a, b) => deg[b] - deg[a] || a - b);
}

function naturalOrder() {
  return NODES.map((n) => n.id);
}

const lbl = (id) => NODES[id].label;

function buildFrames(order) {
  const adj = buildAdj();
  const color = new Array(NODES.length).fill(-1);
  const frames = [];

  const usedColorCount = () => {
    const s = new Set();
    color.forEach((c) => { if (c >= 0) s.add(c); });
    return s.size;
  };

  const snap = (extra) => ({
    color: [...color],
    activeNode: -1,
    forbidden: [],
    chosen: -1,
    scanNeighbour: -1,
    usedCount: usedColorCount(),
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `Order: ${order.map(lbl).join(' -> ')}. Each vertex takes the smallest color none of its already-colored neighbours use.`,
  }));

  for (const u of order) {
    frames.push(snap({
      activeNode: u,
      note: `Pick ${lbl(u)}. Scan its neighbours to collect the colors it may NOT use.`,
    }));

    const forbidden = new Set();
    for (const v of adj[u]) {
      if (color[v] >= 0) {
        forbidden.add(color[v]);
        frames.push(snap({
          activeNode: u,
          scanNeighbour: v,
          forbidden: [...forbidden],
          note: `Neighbour ${lbl(v)} has color ${color[v] + 1} -> forbidden set = {${[...forbidden].map((c) => c + 1).sort((a, b) => a - b).join(', ')}}.`,
        }));
      } else {
        frames.push(snap({
          activeNode: u,
          scanNeighbour: v,
          forbidden: [...forbidden],
          note: `Neighbour ${lbl(v)} is still uncolored -> it does not constrain ${lbl(u)}.`,
        }));
      }
    }

    let c = 0;
    while (forbidden.has(c)) c += 1;
    color[u] = c;

    const fset = [...forbidden].map((x) => x + 1).sort((a, b) => a - b);
    frames.push(snap({
      activeNode: u,
      forbidden: [...forbidden],
      chosen: c,
      note: fset.length
        ? `${lbl(u)}: neighbours use {${fset.join(', ')}} -> smallest free color is ${c + 1}. Assign color ${c + 1}.`
        : `${lbl(u)}: no colored neighbours -> take color 1. Assign color 1.`,
    }));
  }

  const total = usedColorCount();
  frames.push(snap({
    note: `Done. Proper coloring uses ${total} color${total === 1 ? '' : 's'}. Greedy never exceeds maxDegree + 1.`,
  }));

  return { frames, finalColors: [...color], colorsUsed: total };
}

const ORDERINGS = [
  { key: 'natural', label: 'Natural (A..G)', make: () => naturalOrder() },
  { key: 'welsh', label: 'By degree (Welsh-Powell)', make: (adj) => welshPowellOrder(adj) },
];

export default function GraphColoringViz() {
  const [orderKey, setOrderKey] = useState('natural');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const maxDegree = useMemo(() => Math.max(...degrees(buildAdj())), []);

  const { frames, colorsUsed } = useMemo(() => {
    const adj = buildAdj();
    const ord = ORDERINGS.find((o) => o.key === orderKey).make(adj);
    return buildFrames(ord);
  }, [orderKey]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const pickOrder = (key) => {
    setOrderKey(key);
    setIsRunningRaw(false);
    setStep(0);
  };

  const W = 720;
  const H = 360;
  const panelX = 530;
  const panelW = W - panelX - 20;
  const NR = 22;

  const colorFill = (c) => (c < 0 ? null : COLOR_TOKENS[c % COLOR_TOKENS.length]);

  // Palette legend: span colors actually used so far plus a hint of headroom.
  const legendColors = useMemo(() => {
    const maxUsed = current.color.reduce((m, c) => Math.max(m, c + 1), 0);
    const span = Math.max(maxUsed, Math.min(current.chosen + 1, COLOR_TOKENS.length), 3);
    return Array.from({ length: span }, (_, i) => i);
  }, [current.color, current.chosen]);

  return (
    <div className="gcv">
      <div className="gcv-head">
        <h3 className="gcv-title">Greedy graph coloring</h3>
        <p className="gcv-sub">
          Walk the vertices in some order; give each the smallest color no already-colored neighbour uses.
          Switch the order to watch the color count change — greedy never needs more than maxDegree + 1.
        </p>
      </div>

      <div className="gcv-controls">
        <div className="gcv-actions">
          <div className="gcv-buttons">
            <button
              type="button"
              className="gcv-btn gcv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="gcv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="gcv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="gcv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="gcv-speed">
            <span className="gcv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="gcv-speed-range"
            />
            <span className="gcv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="gcv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
        <div className="gcv-orders">
          <span className="gcv-orders-label">vertex order</span>
          {ORDERINGS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`gcv-chip${orderKey === o.key ? ' gcv-chip-active' : ''}`}
              onClick={() => pickOrder(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gcv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={16} y={16} width={panelX - 36} height={H - 32} fill="var(--bg)" stroke="var(--border)" rx={6} />
          <text x={30} y={36} className="gcv-col-label">undirected graph</text>

          {EDGES.map((e) => {
            const a = NODES[e.u];
            const b = NODES[e.v];
            const touchesActive = e.u === current.activeNode || e.v === current.activeNode;
            const scanEdge = (e.u === current.activeNode && e.v === current.scanNeighbour)
              || (e.v === current.activeNode && e.u === current.scanNeighbour);
            const stroke = scanEdge ? 'var(--accent)' : 'var(--text-dim)';
            const sw = scanEdge ? 3 : touchesActive ? 1.8 : 1.2;
            const op = scanEdge ? 1 : touchesActive ? 0.7 : 0.4;
            return (
              <line
                key={`e-${e.id}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke} strokeWidth={sw} opacity={op}
                strokeDasharray={scanEdge ? '6 4' : undefined}
              />
            );
          })}

          {NODES.map((nd) => {
            const c = current.color[nd.id];
            const isActive = nd.id === current.activeNode;
            const isScan = nd.id === current.scanNeighbour;
            const fill = c >= 0 ? colorFill(c) : 'var(--surface)';
            const stroke = isActive ? 'var(--accent)'
              : isScan ? 'var(--accent)'
              : c >= 0 ? colorFill(c)
              : 'var(--border)';
            const labelDark = c >= 0;
            return (
              <g key={`n-${nd.id}`}>
                <circle
                  cx={nd.x} cy={nd.y} r={NR}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive ? 4 : isScan ? 3 : 2}
                  strokeDasharray={isScan && c < 0 ? '4 3' : undefined}
                />
                <text x={nd.x} y={nd.y + 5} className="gcv-node-label" style={{ fill: labelDark ? 'var(--bg)' : 'var(--text-main)' }}>
                  {nd.label}
                </text>
                {c >= 0 && (
                  <text x={nd.x} y={nd.y - NR - 6} className="gcv-node-meta">c{c + 1}</text>
                )}
              </g>
            );
          })}

          {/* state panel */}
          <rect x={panelX - 8} y={16} width={panelW + 16} height={H - 32} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={36} className="gcv-col-label">current vertex</text>
          <text x={panelX} y={64} className="gcv-readout-big">
            {current.activeNode < 0 ? '—' : lbl(current.activeNode)}
          </text>

          <text x={panelX} y={96} className="gcv-col-label">forbidden colors</text>
          <g>
            {current.forbidden.length === 0 ? (
              <text x={panelX} y={118} className="gcv-row-meta">none</text>
            ) : (
              [...current.forbidden].sort((a, b) => a - b).map((fc, i) => (
                <g key={`fb-${fc}`}>
                  <rect x={panelX + i * 30} y={104} width={24} height={20} rx={4} fill={colorFill(fc)} opacity={0.85} />
                  <text x={panelX + i * 30 + 12} y={118} className="gcv-swatch-text">{fc + 1}</text>
                </g>
              ))
            )}
          </g>

          <text x={panelX} y={150} className="gcv-col-label">chosen color</text>
          {current.chosen >= 0 ? (
            <g>
              <rect x={panelX} y={158} width={26} height={22} rx={4} fill={colorFill(current.chosen)} />
              <text x={panelX + 13} y={174} className="gcv-swatch-text">{current.chosen + 1}</text>
            </g>
          ) : (
            <text x={panelX} y={174} className="gcv-row-meta">—</text>
          )}

          <line x1={panelX} y1={194} x2={panelX + panelW} y2={194} stroke="var(--border)" strokeWidth={1} />

          <text x={panelX} y={216} className="gcv-col-label">colors used</text>
          <text x={panelX} y={246} className="gcv-readout-big">
            {current.usedCount}
          </text>
          <text x={panelX} y={272} className="gcv-col-label">palette</text>
          <g>
            {legendColors.map((ci, i) => {
              const inUse = current.color.includes(ci);
              return (
                <g key={`lg-${ci}`}>
                  <rect
                    x={panelX + i * 28} y={280} width={22} height={22} rx={4}
                    fill={colorFill(ci)}
                    opacity={inUse ? 1 : 0.3}
                    stroke={inUse ? 'var(--text-main)' : 'var(--border)'}
                    strokeWidth={inUse ? 1.5 : 1}
                  />
                  <text x={panelX + i * 28 + 11} y={295} className="gcv-swatch-text">{ci + 1}</text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="gcv-metrics">
        <div className="gcv-metric">
          <span className="gcv-metric-label">current vertex</span>
          <span className="gcv-metric-value">{current.activeNode < 0 ? '—' : lbl(current.activeNode)}</span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">neighbour colors</span>
          <span className="gcv-metric-value">
            {current.forbidden.length === 0 ? '∅' : `{${[...current.forbidden].map((c) => c + 1).sort((a, b) => a - b).join(', ')}}`}
          </span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">chosen color</span>
          <span className="gcv-metric-value">{current.chosen < 0 ? '—' : current.chosen + 1}</span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">colors used</span>
          <span className="gcv-metric-value">{current.usedCount}</span>
        </div>
        <div className="gcv-metric gcv-metric-dim">
          <span className="gcv-metric-label">bound</span>
          <span className="gcv-metric-value gcv-metric-dimval">&le; &Delta;+1 = {maxDegree + 1}</span>
        </div>
        <div className="gcv-metric gcv-metric-dim">
          <span className="gcv-metric-label">final (this order)</span>
          <span className="gcv-metric-value gcv-metric-dimval">{colorsUsed} colors</span>
        </div>
      </div>

      <div className="gcv-arith">
        <span className="gcv-arith-label">trace</span>
        <span className="gcv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
