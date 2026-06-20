import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Search, RotateCcw, Sparkles } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 420;

const PLOT = { x: 16, y: 14, w: 360, h: 360 };
const PANEL = { x: 388, y: 14, w: 158, h: 360 };

// 16 words across 4 clusters with hand-tuned positions in [0,1]^2.
// Clusters: animals (top-left), royals (top-right), colors (bottom-left), tech (bottom-right).
// Cluster id is used purely for the color-of-dot key.
const VOCAB = [
  // animals
  { word: 'cat',     x: 0.18, y: 0.78, cluster: 0 },
  { word: 'dog',     x: 0.24, y: 0.84, cluster: 0 },
  { word: 'fish',    x: 0.10, y: 0.70, cluster: 0 },
  { word: 'bird',    x: 0.28, y: 0.72, cluster: 0 },
  // royals
  { word: 'king',    x: 0.78, y: 0.82, cluster: 1 },
  { word: 'queen',   x: 0.82, y: 0.76, cluster: 1 },
  { word: 'prince',  x: 0.72, y: 0.88, cluster: 1 },
  { word: 'princess',x: 0.88, y: 0.84, cluster: 1 },
  // colors
  { word: 'red',     x: 0.16, y: 0.22, cluster: 2 },
  { word: 'blue',    x: 0.22, y: 0.14, cluster: 2 },
  { word: 'green',   x: 0.10, y: 0.30, cluster: 2 },
  { word: 'yellow',  x: 0.28, y: 0.26, cluster: 2 },
  // tech
  { word: 'code',    x: 0.78, y: 0.22, cluster: 3 },
  { word: 'data',    x: 0.86, y: 0.30, cluster: 3 },
  { word: 'model',   x: 0.72, y: 0.14, cluster: 3 },
  { word: 'neuron',  x: 0.88, y: 0.16, cluster: 3 },
];

const CLUSTER_COLORS = [
  { stroke: 'var(--accent)',                     fillRgb: 'var(--accent-rgb, 0, 255, 245)', name: 'animals' },
  { stroke: 'var(--hue-pink, #ff66cc)',          fillRgb: '255, 102, 204',                  name: 'royals'  },
  { stroke: 'var(--hue-violet, #b07bff)',        fillRgb: '176, 123, 255',                  name: 'colors'  },
  { stroke: 'var(--hue-sky, #5ecbff)',           fillRgb: '94, 203, 255',                   name: 'tech'    },
];

// Convert a plot-space point [0,1]^2 into svg-px.
function toPx(p) {
  return {
    cx: PLOT.x + p.x * PLOT.w,
    cy: PLOT.y + (1 - p.y) * PLOT.h,
  };
}

// Convert svg-px back into plot-space (for click-to-place query).
function fromPx(cx, cy) {
  return {
    x: Math.max(0, Math.min(1, (cx - PLOT.x) / PLOT.w)),
    y: Math.max(0, Math.min(1, 1 - (cy - PLOT.y) / PLOT.h)),
  };
}

// Cosine similarity between two 2D vectors (rooted at plot center 0.5,0.5).
// Re-centering keeps the cosine meaningful even though the dots live in [0,1]^2.
function cosSim(a, b) {
  const ax = a.x - 0.5, ay = a.y - 0.5;
  const bx = b.x - 0.5, by = b.y - 0.5;
  const dot = ax * bx + ay * by;
  const na = Math.hypot(ax, ay);
  const nb = Math.hypot(bx, by);
  if (na < 1e-9 || nb < 1e-9) return 0;
  return dot / (na * nb);
}

// Top-K nearest neighbours (excluding the query word itself if it's a vocab entry).
function topK(query, k, excludeIdx = -1) {
  const scored = VOCAB.map((v, i) => ({ i, word: v.word, sim: cosSim(query, v) }));
  scored.sort((a, b) => b.sim - a.sim);
  return scored.filter((s) => s.i !== excludeIdx).slice(0, k);
}

function findWordIdx(s) {
  if (!s) return -1;
  const needle = s.trim().toLowerCase();
  return VOCAB.findIndex((v) => v.word === needle);
}

export default function WordEmbeddingViz() {
  const svgRef = useRef(null);

  // Mode: 'word' (a vocab word selected) or 'query' (free query vector).
  // Initial state: highlight 'king' so the page lands with a useful view.
  const [selectedIdx, setSelectedIdx] = useState(4); // 'king'
  const [queryPoint, setQueryPoint] = useState({ x: 0.5, y: 0.5 });
  const [queryMode, setQueryMode] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Analogy form inputs.
  const [aWord, setAWord] = useState('king');
  const [bWord, setBWord] = useState('queen');
  const [cWord, setCWord] = useState('prince');
  const [analogyResult, setAnalogyResult] = useState(null); // { word, sim, vec } | null

  // What is "active" — either the selected vocab word or the freely-set query point.
  const activePoint = useMemo(() => {
    if (queryMode) return queryPoint;
    if (selectedIdx >= 0) return { x: VOCAB[selectedIdx].x, y: VOCAB[selectedIdx].y };
    return queryPoint;
  }, [queryMode, queryPoint, selectedIdx]);

  // Top-3 neighbours of the active point.
  const neighbours = useMemo(() => {
    const exclude = queryMode ? -1 : selectedIdx;
    return topK(activePoint, 3, exclude);
  }, [activePoint, queryMode, selectedIdx]);

  // Drag handling for query point.
  const updateQueryFromEvent = useCallback((evt) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    // Map client-space into svg viewBox coords.
    const px = ((clientX - rect.left) / rect.width) * W;
    const py = ((clientY - rect.top) / rect.height) * H;
    // Reject if outside plot frame.
    if (px < PLOT.x || px > PLOT.x + PLOT.w || py < PLOT.y || py > PLOT.y + PLOT.h) return;
    setQueryPoint(fromPx(px, py));
  }, []);

  const handlePlotPointerDown = useCallback((evt) => {
    setQueryMode(true);
    setSelectedIdx(-1);
    setDragging(true);
    updateQueryFromEvent(evt.nativeEvent || evt);
  }, [updateQueryFromEvent]);

  const handlePlotPointerMove = useCallback((evt) => {
    if (!dragging) return;
    updateQueryFromEvent(evt.nativeEvent || evt);
  }, [dragging, updateQueryFromEvent]);

  const handlePlotPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const pickWord = useCallback((i) => {
    setQueryMode(false);
    setDragging(false);
    setSelectedIdx(i);
  }, []);

  const resetAll = useCallback(() => {
    setQueryMode(false);
    setSelectedIdx(4);
    setQueryPoint({ x: 0.5, y: 0.5 });
    setAnalogyResult(null);
  }, []);

  // Slider drives x and y of the query vector in [0,1]^2.
  // We expose two sliders side by side; using a slider also switches to query mode.
  const onSliderX = (val) => {
    setQueryMode(true);
    setSelectedIdx(-1);
    setQueryPoint((q) => ({ ...q, x: val }));
  };
  const onSliderY = (val) => {
    setQueryMode(true);
    setSelectedIdx(-1);
    setQueryPoint((q) => ({ ...q, y: val }));
  };

  // Analogy: A - B + C => find nearest word (excluding the 3 inputs).
  const runAnalogy = useCallback(() => {
    const ai = findWordIdx(aWord);
    const bi = findWordIdx(bWord);
    const ci = findWordIdx(cWord);
    if (ai < 0 || bi < 0 || ci < 0) {
      setAnalogyResult({ word: null, sim: 0, vec: null, error: 'Unknown word — try one of the 16 in the plot.' });
      return;
    }
    const A = VOCAB[ai], B = VOCAB[bi], C = VOCAB[ci];
    // Vector arithmetic in the centered embedding space, then re-add 0.5.
    const vx = (A.x - 0.5) - (B.x - 0.5) + (C.x - 0.5) + 0.5;
    const vy = (A.y - 0.5) - (B.y - 0.5) + (C.y - 0.5) + 0.5;
    const target = { x: Math.max(0, Math.min(1, vx)), y: Math.max(0, Math.min(1, vy)) };
    const scored = VOCAB
      .map((v, i) => ({ i, word: v.word, sim: cosSim(target, v) }))
      .filter((s) => s.i !== ai && s.i !== bi && s.i !== ci)
      .sort((a, b) => b.sim - a.sim);
    const best = scored[0];
    setQueryMode(true);
    setSelectedIdx(-1);
    setQueryPoint(target);
    setAnalogyResult({ word: best.word, sim: best.sim, vec: target });
  }, [aWord, bWord, cWord]);

  // Active marker px coords.
  const activePx = toPx(activePoint);

  // Lines from active marker to its 3 neighbours.
  const neighbourLines = neighbours.map((n) => {
    const dst = toPx(VOCAB[n.i]);
    // Midpoint for similarity label.
    const mx = (activePx.cx + dst.cx) / 2;
    const my = (activePx.cy + dst.cy) / 2;
    return { ...n, dst, mx, my };
  });

  // "Active" label text — what to print as the title under the plot.
  const activeLabel = queryMode
    ? `query (${activePoint.x.toFixed(2)}, ${activePoint.y.toFixed(2)})`
    : selectedIdx >= 0
      ? VOCAB[selectedIdx].word
      : 'query';

  // Cluster legend chips.
  const clusterChips = CLUSTER_COLORS.map((c, i) => ({
    name: c.name,
    stroke: c.stroke,
    fillRgb: c.fillRgb,
    count: VOCAB.filter((v) => v.cluster === i).length,
  }));

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}
          onMouseMove={handlePlotPointerMove}
          onMouseUp={handlePlotPointerUp}
          onMouseLeave={handlePlotPointerUp}
          onTouchMove={handlePlotPointerMove}
          onTouchEnd={handlePlotPointerUp}
        >
          <defs>
            <radialGradient id="we-query-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <marker id="we-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* ---------- PLOT FRAME ---------- */}
          <rect
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.w}
            height={PLOT.h}
            rx={10}
            ry={10}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
            onMouseDown={handlePlotPointerDown}
            onTouchStart={handlePlotPointerDown}
            style={{ cursor: 'crosshair' }}
          />

          {/* Grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g} opacity={0.55} pointerEvents="none">
              <line
                x1={PLOT.x + g * PLOT.w}
                y1={PLOT.y}
                x2={PLOT.x + g * PLOT.w}
                y2={PLOT.y + PLOT.h}
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeWidth={0.6}
              />
              <line
                x1={PLOT.x}
                y1={PLOT.y + g * PLOT.h}
                x2={PLOT.x + PLOT.w}
                y2={PLOT.y + g * PLOT.h}
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeWidth={0.6}
              />
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={PLOT.x + 8}
            y={PLOT.y + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
            pointerEvents="none"
          >
            2D PROJECTION OF EMBEDDING
          </text>
          <text
            x={PLOT.x + PLOT.w - 6}
            y={PLOT.y + PLOT.h - 6}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            textAnchor="end"
            pointerEvents="none"
          >
            dim 1
          </text>
          <text
            x={PLOT.x + 6}
            y={PLOT.y + 26}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            pointerEvents="none"
          >
            dim 2
          </text>

          {/* ---------- NEIGHBOUR LINES (under dots so dots cover endpoints) ---------- */}
          {neighbourLines.map((n) => (
            <g key={`nbr-${n.i}`} pointerEvents="none">
              <line
                x1={activePx.cx}
                y1={activePx.cy}
                x2={n.dst.cx}
                y2={n.dst.cy}
                stroke="var(--accent)"
                strokeWidth={0.6 + Math.max(0, n.sim) * 2.4}
                opacity={0.35 + Math.max(0, n.sim) * 0.5}
                strokeLinecap="round"
              />
              {/* Similarity score label on the midpoint */}
              <rect
                x={n.mx - 18}
                y={n.my - 8}
                width={36}
                height={14}
                rx={4}
                fill="var(--bg)"
                stroke="var(--border)"
                strokeWidth={0.6}
                opacity={0.92}
              />
              <text
                x={n.mx}
                y={n.my + 2}
                fontSize="9"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-main)"
                textAnchor="middle"
              >
                {n.sim.toFixed(2)}
              </text>
            </g>
          ))}

          {/* ---------- ACTIVE QUERY GLOW + CROSSHAIR ---------- */}
          {queryMode && (
            <g pointerEvents="none">
              <circle
                cx={activePx.cx}
                cy={activePx.cy}
                r={28}
                fill="url(#we-query-glow)"
              />
              <line
                x1={PLOT.x}
                y1={activePx.cy}
                x2={PLOT.x + PLOT.w}
                y2={activePx.cy}
                stroke="var(--accent)"
                strokeWidth={0.5}
                strokeDasharray="3 4"
                opacity={0.45}
              />
              <line
                x1={activePx.cx}
                y1={PLOT.y}
                x2={activePx.cx}
                y2={PLOT.y + PLOT.h}
                stroke="var(--accent)"
                strokeWidth={0.5}
                strokeDasharray="3 4"
                opacity={0.45}
              />
            </g>
          )}

          {/* ---------- WORD DOTS ---------- */}
          {VOCAB.map((v, i) => {
            const p = toPx(v);
            const C = CLUSTER_COLORS[v.cluster];
            const isActive = !queryMode && i === selectedIdx;
            const isNeighbour = neighbours.find((n) => n.i === i);
            const dim = (selectedIdx >= 0 || queryMode) && !isActive && !isNeighbour;
            return (
              <g
                key={`w-${i}`}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); pickWord(i); }}
                onTouchStart={(e) => { e.stopPropagation(); }}
                opacity={dim ? 0.35 : 1}
              >
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={isActive ? 13 : isNeighbour ? 10 : 8}
                  fill={`rgba(${C.fillRgb}, ${isActive ? 0.28 : 0.16})`}
                  stroke={C.stroke}
                  strokeWidth={isActive ? 2.4 : isNeighbour ? 1.8 : 1.3}
                />
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={3}
                  fill={C.stroke}
                />
                <text
                  x={p.cx + 13}
                  y={p.cy + 4}
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={isActive ? 800 : 700}
                  fill={isActive ? 'var(--accent)' : 'var(--text-main)'}
                >
                  {v.word}
                </text>
              </g>
            );
          })}

          {/* ---------- QUERY MARKER (on top) ---------- */}
          {queryMode && (
            <g pointerEvents="none">
              <circle
                cx={activePx.cx}
                cy={activePx.cy}
                r={6}
                fill="var(--accent)"
                stroke="var(--bg)"
                strokeWidth={1.5}
              />
              <text
                x={activePx.cx + 9}
                y={activePx.cy - 9}
                fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--accent)"
                fontWeight={700}
              >
                ?
              </text>
            </g>
          )}

          {/* ---------- RIGHT-SIDE PANEL: CLUSTER LEGEND + NEIGHBOUR LIST ---------- */}
          <g>
            <text
              x={PANEL.x + PANEL.w / 2}
              y={PANEL.y + 12}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.14em"
            >
              CLUSTERS
            </text>
            {clusterChips.map((c, i) => {
              const y0 = PANEL.y + 26 + i * 22;
              return (
                <g key={`cl-${i}`}>
                  <circle
                    cx={PANEL.x + 14}
                    cy={y0 + 6}
                    r={5}
                    fill={`rgba(${c.fillRgb}, 0.22)`}
                    stroke={c.stroke}
                    strokeWidth={1.4}
                  />
                  <text
                    x={PANEL.x + 26}
                    y={y0 + 10}
                    fontSize="11"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    fontWeight={700}
                    fill="var(--text-main)"
                  >
                    {c.name}
                  </text>
                  <text
                    x={PANEL.x + PANEL.w - 8}
                    y={y0 + 10}
                    fontSize="9"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--text-dim)"
                    textAnchor="end"
                  >
                    ×{c.count}
                  </text>
                </g>
              );
            })}

            <text
              x={PANEL.x + PANEL.w / 2}
              y={PANEL.y + 126}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.14em"
            >
              NEAREST · cos
            </text>
            <text
              x={PANEL.x + PANEL.w / 2}
              y={PANEL.y + 142}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              of {activeLabel}
            </text>
            {neighbours.map((n, idx) => {
              const y0 = PANEL.y + 158 + idx * 26;
              const v = VOCAB[n.i];
              const C = CLUSTER_COLORS[v.cluster];
              return (
                <g
                  key={`nl-${n.i}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => pickWord(n.i)}
                >
                  <rect
                    x={PANEL.x + 8}
                    y={y0}
                    width={PANEL.w - 16}
                    height={22}
                    rx={6}
                    fill={`rgba(${C.fillRgb}, 0.08)`}
                    stroke={C.stroke}
                    strokeWidth={0.8}
                  />
                  <text
                    x={PANEL.x + 18}
                    y={y0 + 15}
                    fontSize="11"
                    fontFamily="var(--serif, serif)"
                    fontStyle="italic"
                    fontWeight={700}
                    fill="var(--text-main)"
                  >
                    {idx + 1}. {v.word}
                  </text>
                  <text
                    x={PANEL.x + PANEL.w - 16}
                    y={y0 + 15}
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--accent)"
                    textAnchor="end"
                  >
                    {n.sim.toFixed(3)}
                  </text>
                </g>
              );
            })}

            {/* Analogy result, if any */}
            {analogyResult && analogyResult.word && (
              <g>
                <text
                  x={PANEL.x + PANEL.w / 2}
                  y={PANEL.y + 250}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                  letterSpacing="0.14em"
                >
                  ANALOGY
                </text>
                <rect
                  x={PANEL.x + 8}
                  y={PANEL.y + 258}
                  width={PANEL.w - 16}
                  height={36}
                  rx={6}
                  fill="rgba(var(--accent-rgb, 0, 255, 245), 0.10)"
                  stroke="var(--accent)"
                  strokeWidth={1}
                />
                <text
                  x={PANEL.x + PANEL.w / 2}
                  y={PANEL.y + 276}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={800}
                  fill="var(--accent)"
                >
                  {analogyResult.word}
                </text>
                <text
                  x={PANEL.x + PANEL.w / 2}
                  y={PANEL.y + 290}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                >
                  cos {analogyResult.sim.toFixed(3)}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* ---------- READOUT: ACTIVE QUERY ---------- */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            ACTIVE
          </span>
          <span className="mlviz-sub">
            {queryMode
              ? `query vector at (${activePoint.x.toFixed(2)}, ${activePoint.y.toFixed(2)})`
              : selectedIdx >= 0
                ? `${VOCAB[selectedIdx].word} — click any other word, or drag in the plot to enter explore mode`
                : 'click a word to highlight its nearest neighbours'}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginTop: '0.4rem',
          }}
        >
          {neighbours.map((n, idx) => {
            const v = VOCAB[n.i];
            const C = CLUSTER_COLORS[v.cluster];
            return (
              <div
                key={`rd-${n.i}`}
                style={{
                  background: `rgba(${C.fillRgb}, 0.10)`,
                  border: `1px solid ${C.stroke}`,
                  borderRadius: 6,
                  padding: '0.4rem 0.55rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono, monospace)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.12em',
                    color: 'var(--text-dim)',
                  }}
                >
                  #{idx + 1}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--serif, serif)',
                    fontStyle: 'italic',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                  }}
                >
                  {v.word}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--mono, monospace)',
                    fontSize: '0.72rem',
                    color: 'var(--accent)',
                  }}
                >
                  cos {n.sim.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- EXPLORE: x/y sliders ---------- */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            EXPLORE
          </span>
          <span className="mlviz-sub">drag the plot or use the sliders to move the query vector</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 60px',
            rowGap: 8,
            columnGap: 10,
            marginTop: '0.45rem',
            alignItems: 'center',
          }}
        >
          <label
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              letterSpacing: '0.10em',
            }}
          >
            X
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={queryMode ? queryPoint.x : activePoint.x}
            onChange={(e) => onSliderX(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <span
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              textAlign: 'right',
            }}
          >
            {(queryMode ? queryPoint.x : activePoint.x).toFixed(2)}
          </span>

          <label
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              letterSpacing: '0.10em',
            }}
          >
            Y
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={queryMode ? queryPoint.y : activePoint.y}
            onChange={(e) => onSliderY(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <span
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              textAlign: 'right',
            }}
          >
            {(queryMode ? queryPoint.y : activePoint.y).toFixed(2)}
          </span>
        </div>
        <div className="mlviz-row mlviz-btn-row" style={{ marginTop: '0.6rem' }}>
          <button
            type="button"
            className="mlviz-btn"
            onClick={resetAll}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ---------- ANALOGY ---------- */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            ANALOGY
          </span>
          <span className="mlviz-sub">A is to B as C is to ? — solved by A − B + C</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr',
            gap: 6,
            alignItems: 'center',
            marginTop: '0.45rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
            }}
          >
            A
          </span>
          <input
            type="text"
            value={aWord}
            onChange={(e) => setAWord(e.target.value)}
            className="ah-input"
            placeholder="king"
            style={{ minWidth: 0 }}
          />
          <span
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
            }}
          >
            B
          </span>
          <input
            type="text"
            value={bWord}
            onChange={(e) => setBWord(e.target.value)}
            className="ah-input"
            placeholder="queen"
            style={{ minWidth: 0 }}
          />
          <span
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
            }}
          >
            C
          </span>
          <input
            type="text"
            value={cWord}
            onChange={(e) => setCWord(e.target.value)}
            className="ah-input"
            placeholder="prince"
            style={{ minWidth: 0 }}
          />
        </div>
        <div className="mlviz-row mlviz-btn-row" style={{ marginTop: '0.6rem' }}>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={runAnalogy}
          >
            <Search size={13} />
            <span>Find analogy</span>
          </button>
          {analogyResult && analogyResult.word && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginLeft: 'auto',
                fontFamily: 'var(--serif, serif)',
                fontStyle: 'italic',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              <Sparkles size={13} />
              <span>{analogyResult.word}</span>
              <span
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontStyle: 'normal',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                }}
              >
                cos {analogyResult.sim.toFixed(3)}
              </span>
            </span>
          )}
          {analogyResult && !analogyResult.word && (
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--mono, monospace)',
                fontSize: '0.72rem',
                color: 'var(--warning, #ffb347)',
              }}
            >
              {analogyResult.error}
            </span>
          )}
        </div>
        <div className="mlviz-hint">
          vocab: {VOCAB.map((v) => v.word).join(', ')}
        </div>
      </div>
    </div>
  );
}
