import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Play, RotateCcw, StepForward, FastForward } from 'lucide-react';
import './MLViz.css';

// Canvas geometry — tree grows top-down. Width adapts to depth (more depth → wider).
const CANVAS_W = 880;
const CANVAS_H = 460;
const PAD_L = 30;
const PAD_R = 30;
const PAD_T = 38;
const PAD_B = 30;
const PLOT_W = CANVAS_W - PAD_L - PAD_R;
const PLOT_H = CANVAS_H - PAD_T - PAD_B;

const MAX_DEPTH = 5;
const VOCAB_PER_NODE = 5;

// Vocabulary — small enough to stay readable, varied enough that branches don't all look alike.
const VOCAB = [
  'the', 'a', 'cat', 'dog', 'sat',
  'ran', 'fast', 'and', 'then', 'jumped',
  'on', 'mat', 'roof', 'happily', 'quietly',
  'with', 'soft', 'tail', '.', '!',
];

// Beam colors — distinct hues from theme so up to 5 beams stay visually separable.
const BEAM_COLORS = [
  'var(--accent)',
  'var(--hue-violet, #b48cff)',
  'var(--hue-pink, #ff66cc)',
  'var(--hue-mint, #6ee7b7)',
  'var(--hue-sky, #6dd5ff)',
];

// --- Seeded RNG (mulberry32) — every call to mockLLM(prefix) is deterministic. ---
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mock LLM: given a prefix (a list of token indices), return top-5 (token, prob)
// pairs that sum to ~1. Determined entirely by hash(prefix + seed).
function mockLLM(prefix, seed) {
  const key = `${seed}|${prefix.join(',')}`;
  const rng = mulberry32(hashStr(key));
  // Score every vocab token, then take top-5 and softmax-normalize.
  const scores = VOCAB.map(() => -Math.log(-Math.log(Math.max(rng(), 1e-9))));
  const ranked = scores
    .map((s, i) => ({ tok: i, s }))
    .sort((a, b) => b.s - a.s)
    .slice(0, VOCAB_PER_NODE);
  // Temperature 1.2 — keeps probs from collapsing to ~1 on the top option,
  // so beam search has interesting tradeoffs.
  const T = 1.2;
  const exps = ranked.map((r) => Math.exp(r.s / T));
  const Z = exps.reduce((a, b) => a + b, 0);
  return ranked.map((r, i) => ({ tok: r.tok, prob: exps[i] / Z }));
}

// --- Beam search step. Given current hypotheses (each with tokens, logp), expand
// each by 5 next tokens, then keep the top-k overall.
function expandBeams(hypotheses, k, seed) {
  const candidates = [];
  hypotheses.forEach((h, parentIdx) => {
    const dist = mockLLM(h.tokens, seed);
    dist.forEach((d) => {
      candidates.push({
        tokens: [...h.tokens, d.tok],
        logp: h.logp + Math.log(d.prob),
        parentIdx,
        prob: d.prob,
        parentLogp: h.logp,
      });
    });
  });
  candidates.sort((a, b) => b.logp - a.logp);
  return candidates.slice(0, k);
}

// --- Greedy step: pick the single highest-prob next token from the current path.
function greedyStep(path, seed) {
  const dist = mockLLM(path.tokens, seed);
  // Already sorted by score, but be defensive.
  const best = dist.reduce((a, b) => (b.prob > a.prob ? b : a));
  return {
    tokens: [...path.tokens, best.tok],
    logp: path.logp + Math.log(best.prob),
    prob: best.prob,
  };
}

// --- Build the full tree of expansions across all steps. Each level contains
// nodes that were generated (kept or pruned). We render kept beams highlighted.
function buildTree(seed, beamWidth, depth) {
  // Root: empty prefix, logp = 0.
  const root = { id: 'root', tokens: [], logp: 0, depth: 0, kept: true, parent: null, beamIdx: 0 };
  const levels = [[root]];
  let kept = [root];

  for (let step = 0; step < depth; step++) {
    const nextLevel = [];
    const allCandidates = [];

    kept.forEach((parent) => {
      const dist = mockLLM(parent.tokens, seed);
      dist.forEach((d) => {
        const child = {
          id: `${parent.id}-${d.tok}`,
          tokens: [...parent.tokens, d.tok],
          logp: parent.logp + Math.log(d.prob),
          depth: step + 1,
          kept: false,
          parent,
          tokenStr: VOCAB[d.tok],
          stepProb: d.prob,
          beamIdx: parent.beamIdx,
        };
        nextLevel.push(child);
        allCandidates.push(child);
      });
    });

    // Rank candidates, keep top beamWidth.
    allCandidates.sort((a, b) => b.logp - a.logp);
    const newKept = allCandidates.slice(0, beamWidth);
    newKept.forEach((c, i) => {
      c.kept = true;
      // Assign beam color slot based on rank at this step (stable through step).
      c.beamIdx = i;
    });

    levels.push(nextLevel);
    kept = newKept;
  }
  return { levels, finalKept: kept };
}

// --- Greedy path: single deterministic chain from root.
function buildGreedy(seed, depth) {
  let path = { tokens: [], logp: 0 };
  const nodes = [{ ...path, depth: 0, tokenStr: '<s>', stepProb: 1 }];
  for (let step = 0; step < depth; step++) {
    const dist = mockLLM(path.tokens, seed);
    const best = dist.reduce((a, b) => (b.prob > a.prob ? b : a));
    path = { tokens: [...path.tokens, best.tok], logp: path.logp + Math.log(best.prob) };
    nodes.push({
      ...path,
      depth: step + 1,
      tokenStr: VOCAB[best.tok],
      stepProb: best.prob,
    });
  }
  return nodes;
}

// --- Layout: assign (x, y) to each node. Depth → y. Within a level, lay nodes out
// horizontally with parent-grouping so siblings cluster under their parent.
function layoutTree(levels, depth) {
  const positions = new Map(); // id -> { x, y }
  const levelY = (d) => PAD_T + (d / depth) * PLOT_H;

  // Root.
  positions.set('root', { x: PAD_L + PLOT_W / 2, y: levelY(0) });

  for (let d = 1; d <= depth; d++) {
    const lvl = levels[d];
    if (!lvl || lvl.length === 0) continue;

    // Group by parent.
    const groups = new Map();
    lvl.forEach((n) => {
      const pid = n.parent ? n.parent.id : 'root';
      if (!groups.has(pid)) groups.set(pid, []);
      groups.get(pid).push(n);
    });

    // Compute parent x ordering.
    const parentXs = [];
    groups.forEach((children, pid) => {
      const p = positions.get(pid);
      parentXs.push({ pid, px: p ? p.x : PAD_L + PLOT_W / 2, children });
    });
    parentXs.sort((a, b) => a.px - b.px);

    // For each parent group, lay children in a small fan beneath the parent.
    // Width per child shrinks as level gets crowded.
    const totalChildren = lvl.length;
    const maxSpacing = PLOT_W / Math.max(totalChildren, 1);
    const childSpacing = Math.min(56, maxSpacing);

    // First pass: each group claims a slot centered under its parent.
    parentXs.forEach(({ pid, px, children }) => {
      const groupW = (children.length - 1) * childSpacing;
      let startX = px - groupW / 2;
      // Clamp to viewport.
      startX = Math.max(PAD_L + 14, startX);
      startX = Math.min(PAD_L + PLOT_W - groupW - 14, startX);
      children.forEach((c, i) => {
        positions.set(c.id, { x: startX + i * childSpacing, y: levelY(d) });
      });
    });

    // Second pass: resolve overlaps level-wide. Sort by x, push apart if too close.
    const ordered = lvl
      .map((n) => ({ id: n.id, pos: positions.get(n.id) }))
      .sort((a, b) => a.pos.x - b.pos.x);
    const minGap = Math.max(28, childSpacing * 0.7);
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1].pos;
      const cur = ordered[i].pos;
      if (cur.x - prev.x < minGap) {
        cur.x = prev.x + minGap;
      }
    }
    // Clamp right edge.
    for (let i = ordered.length - 1; i >= 0; i--) {
      const p = ordered[i].pos;
      const maxX = PAD_L + PLOT_W - 14;
      if (p.x > maxX) {
        p.x = maxX;
        if (i > 0) {
          const prev = ordered[i - 1].pos;
          if (p.x - prev.x < minGap) prev.x = p.x - minGap;
        }
      }
    }
  }
  return positions;
}

function decodeTokens(tokens) {
  return tokens.map((t) => VOCAB[t]).join(' ');
}

function fmtLogp(lp) {
  if (lp === 0) return '0.000';
  return lp.toFixed(3);
}

function fmtProb(p) {
  return p.toFixed(3);
}

export default function BeamSearchViz() {
  const [seed, setSeed] = useState(42);
  const [beamWidth, setBeamWidth] = useState(3);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [hoverNode, setHoverNode] = useState(null);
  const [autoTimer, setAutoTimer] = useState(null);

  // The tree is computed up to currentDepth. Greedy path always uses MAX_DEPTH for
  // the final-comparison readout but we only render the greedy nodes up to currentDepth.
  const tree = useMemo(() => buildTree(seed, beamWidth, currentDepth), [seed, beamWidth, currentDepth]);
  const greedyAll = useMemo(() => buildGreedy(seed, MAX_DEPTH), [seed]);
  const greedyAtDepth = greedyAll.slice(0, currentDepth + 1);
  const beamFinal = useMemo(() => buildTree(seed, beamWidth, MAX_DEPTH).finalKept, [seed, beamWidth]);

  const positions = useMemo(() => layoutTree(tree.levels, Math.max(currentDepth, 1)), [tree, currentDepth]);

  // For greedy, lay out as a single column down the left edge of the tree area.
  const greedyPositions = useMemo(() => {
    const m = new Map();
    greedyAtDepth.forEach((n, i) => {
      const y = PAD_T + (i / Math.max(currentDepth, 1)) * PLOT_H;
      const x = PAD_L + 24;
      m.set(`g${i}`, { x, y });
    });
    return m;
  }, [greedyAtDepth, currentDepth]);

  // --- Stepping controls.
  const step = useCallback(() => {
    setCurrentDepth((d) => Math.min(MAX_DEPTH, d + 1));
  }, []);

  const reset = useCallback(() => {
    if (autoTimer) {
      clearInterval(autoTimer);
      setAutoTimer(null);
    }
    setCurrentDepth(0);
  }, [autoTimer]);

  const runAll = useCallback(() => {
    if (autoTimer) return;
    if (currentDepth >= MAX_DEPTH) return;
    const t = setInterval(() => {
      setCurrentDepth((d) => {
        if (d >= MAX_DEPTH) {
          clearInterval(t);
          setAutoTimer(null);
          return d;
        }
        return d + 1;
      });
    }, 520);
    setAutoTimer(t);
  }, [autoTimer, currentDepth]);

  // Cleanup interval on unmount or param change.
  useEffect(() => () => { if (autoTimer) clearInterval(autoTimer); }, [autoTimer]);

  // Reset on seed/beam change.
  useEffect(() => {
    if (autoTimer) {
      clearInterval(autoTimer);
      setAutoTimer(null);
    }
    setCurrentDepth(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, beamWidth]);

  // Find the best final beam (highest logp at currentDepth).
  const keptAtCurrent = tree.levels[currentDepth] ? tree.levels[currentDepth].filter((n) => n.kept) : [];
  const bestBeam = keptAtCurrent.length
    ? [...keptAtCurrent].sort((a, b) => b.logp - a.logp)[0]
    : null;
  const greedyAtCurrent = greedyAtDepth[greedyAtDepth.length - 1];

  // --- Render: collect edges and nodes for SVG.
  // Edges: from parent to child for every node in every level.
  const edges = [];
  for (let d = 1; d <= currentDepth; d++) {
    const lvl = tree.levels[d];
    if (!lvl) continue;
    lvl.forEach((n) => {
      const pPos = positions.get(n.parent ? n.parent.id : 'root');
      const cPos = positions.get(n.id);
      if (!pPos || !cPos) return;
      edges.push({
        x1: pPos.x,
        y1: pPos.y,
        x2: cPos.x,
        y2: cPos.y,
        kept: n.kept,
        parentKept: n.parent ? n.parent.kept : true,
        beamIdx: n.beamIdx,
        prob: n.stepProb,
        id: `e-${n.id}`,
      });
    });
  }

  // Greedy edges.
  const greedyEdges = [];
  for (let i = 1; i <= currentDepth; i++) {
    const a = greedyPositions.get(`g${i - 1}`);
    const b = greedyPositions.get(`g${i}`);
    if (!a || !b) continue;
    greedyEdges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, id: `ge-${i}` });
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.5rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
          <defs>
            <linearGradient id="bs-bg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background panel */}
          <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="url(#bs-bg)" />

          {/* Column dividers — left strip is greedy, rest is beam */}
          <line
            x1={PAD_L + 70}
            y1={PAD_T - 18}
            x2={PAD_L + 70}
            y2={CANVAS_H - PAD_B + 8}
            stroke="var(--border)"
            strokeWidth="0.8"
            strokeDasharray="3 4"
            opacity="0.6"
          />

          {/* Section labels */}
          <text
            x={PAD_L + 24}
            y={PAD_T - 22}
            fontSize="11"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
            textAnchor="middle"
          >
            greedy
          </text>
          <text
            x={PAD_L + PLOT_W / 2 + 60}
            y={PAD_T - 22}
            fontSize="11"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
            textAnchor="middle"
          >
            beam search (k = {beamWidth})
          </text>

          {/* Depth labels on the left margin */}
          {Array.from({ length: MAX_DEPTH + 1 }).map((_, d) => {
            const y = PAD_T + (d / MAX_DEPTH) * PLOT_H;
            return (
              <g key={`dl${d}`}>
                <text
                  x={PAD_L - 8}
                  y={y + 3}
                  fontSize="9.5"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                  textAnchor="end"
                  opacity={d <= currentDepth ? 1 : 0.35}
                >
                  t={d}
                </text>
                <line
                  x1={PAD_L - 4}
                  y1={y}
                  x2={PAD_L}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.8"
                  opacity={d <= currentDepth ? 0.9 : 0.3}
                />
              </g>
            );
          })}

          {/* Greedy edges */}
          {greedyEdges.map((e) => (
            <line
              key={e.id}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="var(--easy, #2ecc71)"
              strokeWidth="2.2"
              opacity="0.85"
              strokeLinecap="round"
            />
          ))}

          {/* Beam edges — pruned shown faded, kept shown in beam color */}
          {edges.map((e) => {
            const color = e.kept && e.parentKept ? BEAM_COLORS[e.beamIdx % BEAM_COLORS.length] : 'var(--border)';
            const w = e.kept && e.parentKept ? 1.8 : 0.7;
            const op = e.kept && e.parentKept ? 0.9 : 0.32;
            return (
              <line
                key={e.id}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={color}
                strokeWidth={w}
                opacity={op}
                strokeLinecap="round"
              />
            );
          })}

          {/* Greedy nodes */}
          {greedyAtDepth.map((n, i) => {
            const p = greedyPositions.get(`g${i}`);
            if (!p) return null;
            const isRoot = i === 0;
            const isCurrent = i === currentDepth;
            return (
              <g key={`gn${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isRoot ? 8 : 10}
                  fill={isRoot ? 'var(--bg)' : 'var(--easy, #2ecc71)'}
                  stroke={isCurrent ? 'var(--text-main)' : 'var(--easy, #2ecc71)'}
                  strokeWidth={isCurrent ? 2.2 : 1.4}
                  opacity={isRoot ? 0.85 : 0.95}
                />
                <text
                  x={p.x + 16}
                  y={p.y + 3.5}
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-main)"
                  fontWeight="600"
                >
                  {n.tokenStr}
                </text>
                {!isRoot && (
                  <text
                    x={p.x + 16}
                    y={p.y + 16}
                    fontSize="8.5"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--text-dim)"
                  >
                    p={fmtProb(n.stepProb)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Beam nodes — render pruned first (back), kept on top */}
          {[false, true].map((keptPass) => (
            <g key={`pass-${keptPass}`}>
              {tree.levels.slice(0, currentDepth + 1).flat().map((n) => {
                const p = positions.get(n.id);
                if (!p) return null;
                if (n.id === 'root') {
                  if (!keptPass) return null;
                  return (
                    <g key={`n-${n.id}`}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={9}
                        fill="var(--bg)"
                        stroke="var(--text-dim)"
                        strokeWidth="1.6"
                      />
                      <text
                        x={p.x}
                        y={p.y + 3.5}
                        fontSize="9"
                        fontFamily="var(--mono, monospace)"
                        fill="var(--text-dim)"
                        textAnchor="middle"
                      >
                        &lt;s&gt;
                      </text>
                    </g>
                  );
                }
                const showInThisPass = (keptPass === n.kept);
                if (!showInThisPass) return null;
                const color = n.kept ? BEAM_COLORS[n.beamIdx % BEAM_COLORS.length] : 'var(--text-dim)';
                const r = n.kept ? 11 : 6.5;
                const isHover = hoverNode === n.id;
                const isBest = bestBeam && n.id === bestBeam.id;
                return (
                  <g
                    key={`n-${n.id}`}
                    onMouseEnter={() => setHoverNode(n.id)}
                    onMouseLeave={() => setHoverNode((h) => (h === n.id ? null : h))}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isBest ? r + 2 : r}
                      fill={n.kept ? color : 'var(--bg)'}
                      stroke={isBest ? 'var(--text-main)' : color}
                      strokeWidth={isBest ? 2.4 : (n.kept ? 1.4 : 1)}
                      fillOpacity={n.kept ? 0.85 : 0.25}
                      opacity={n.kept ? 1 : 0.6}
                    />
                    {n.kept && (
                      <text
                        x={p.x}
                        y={p.y - r - 6}
                        fontSize="10"
                        fontFamily="var(--mono, monospace)"
                        fill="var(--text-main)"
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {n.tokenStr}
                      </text>
                    )}
                    {n.kept && (
                      <text
                        x={p.x}
                        y={p.y + r + 11}
                        fontSize="8.5"
                        fontFamily="var(--mono, monospace)"
                        fill="var(--text-dim)"
                        textAnchor="middle"
                      >
                        {fmtLogp(n.logp)}
                      </text>
                    )}
                    {isHover && (
                      <g>
                        <rect
                          x={p.x + 14}
                          y={p.y - 24}
                          width={130}
                          height={42}
                          rx={4}
                          fill="var(--surface)"
                          stroke="var(--border)"
                          strokeWidth="1"
                        />
                        <text
                          x={p.x + 20}
                          y={p.y - 11}
                          fontSize="9"
                          fontFamily="var(--mono, monospace)"
                          fill="var(--text-main)"
                        >
                          {n.tokenStr} | p={fmtProb(n.stepProb)}
                        </text>
                        <text
                          x={p.x + 20}
                          y={p.y + 1}
                          fontSize="9"
                          fontFamily="var(--mono, monospace)"
                          fill="var(--text-dim)"
                        >
                          log p = {fmtLogp(n.logp)}
                        </text>
                        <text
                          x={p.x + 20}
                          y={p.y + 13}
                          fontSize="8.5"
                          fontFamily="var(--mono, monospace)"
                          fill="var(--text-dim)"
                        >
                          {n.kept ? 'kept' : 'pruned'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Legend */}
          <g transform={`translate(${CANVAS_W - PAD_R - 200}, ${CANVAS_H - PAD_B + 6})`}>
            <circle cx={6} cy={6} r={4.5} fill="var(--easy, #2ecc71)" />
            <text x={16} y={9} fontSize="9.5" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
              greedy
            </text>
            <circle cx={70} cy={6} r={4.5} fill="var(--accent)" />
            <text x={80} y={9} fontSize="9.5" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
              kept beam
            </text>
            <circle cx={148} cy={6} r={3} fill="var(--bg)" stroke="var(--text-dim)" strokeWidth="1" />
            <text x={158} y={9} fontSize="9.5" fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
              pruned
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={step}
            disabled={currentDepth >= MAX_DEPTH || !!autoTimer}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={runAll}
            disabled={currentDepth >= MAX_DEPTH || !!autoTimer}
          >
            <FastForward size={13} />
            <span>{autoTimer ? 'Running…' : `Run to t=${MAX_DEPTH}`}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
            disabled={currentDepth === 0 && !autoTimer}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            depth {currentDepth} / {MAX_DEPTH}
          </span>
        </div>

        <div className="mlviz-row mlviz-controls" style={{ marginTop: 4 }}>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">beam width</span>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={beamWidth}
              onChange={(e) => setBeamWidth(parseInt(e.target.value, 10))}
              disabled={!!autoTimer}
            />
            <span className="mlviz-slider-val">k = {beamWidth}</span>
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
              disabled={!!autoTimer}
            />
            <span className="mlviz-slider-val">{seed}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ marginTop: 4 }}>
          <span className="mlviz-tag" style={{ color: 'var(--easy, #2ecc71)' }}>greedy</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>
            {greedyAtDepth.length > 1 ? decodeTokens(greedyAtCurrent.tokens) : '—'}
          </span>
          <span className="mlviz-sub">
            log p = {greedyAtDepth.length > 1 ? fmtLogp(greedyAtCurrent.logp) : '—'}
          </span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>beam best</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>
            {bestBeam ? decodeTokens(bestBeam.tokens) : '—'}
          </span>
          <span className="mlviz-sub">
            log p = {bestBeam ? fmtLogp(bestBeam.logp) : '—'}
          </span>
        </div>

        {/* All kept beams at current depth — laid out as colored chip rows. */}
        {keptAtCurrent.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: 4,
            paddingTop: 6,
            borderTop: '1px dashed var(--border)',
          }}>
            <div style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.66rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: 2,
            }}>
              live beams (t={currentDepth})
            </div>
            {[...keptAtCurrent]
              .sort((a, b) => b.logp - a.logp)
              .map((n) => (
                <div
                  key={`beam-${n.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--mono, monospace)',
                    fontSize: '0.74rem',
                  }}
                >
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: BEAM_COLORS[n.beamIdx % BEAM_COLORS.length],
                    flexShrink: 0,
                  }} />
                  <span style={{ color: 'var(--text-main)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {decodeTokens(n.tokens)}
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>
                    {fmtLogp(n.logp)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Final-state comparison when run to MAX_DEPTH */}
        {currentDepth >= MAX_DEPTH && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.66rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}>
              final comparison
            </div>
            <div style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              fontFamily: 'var(--mono, monospace)',
              fontSize: '0.78rem',
            }}>
              <div style={{ flex: '1 1 220px' }}>
                <div style={{ color: 'var(--easy, #2ecc71)', fontWeight: 600, marginBottom: 2 }}>
                  greedy result
                </div>
                <div style={{ color: 'var(--text-main)' }}>
                  {decodeTokens(greedyAll[MAX_DEPTH].tokens)}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  log p = {fmtLogp(greedyAll[MAX_DEPTH].logp)}
                </div>
              </div>
              <div style={{ flex: '1 1 220px' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
                  beam result (k={beamWidth})
                </div>
                <div style={{ color: 'var(--text-main)' }}>
                  {decodeTokens([...beamFinal].sort((a, b) => b.logp - a.logp)[0].tokens)}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  log p = {fmtLogp([...beamFinal].sort((a, b) => b.logp - a.logp)[0].logp)}
                </div>
              </div>
              <div style={{ flex: '0 1 auto', alignSelf: 'center' }}>
                <div style={{
                  padding: '6px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.74rem',
                }}>
                  Δ log p ={' '}
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {fmtLogp(
                      [...beamFinal].sort((a, b) => b.logp - a.logp)[0].logp - greedyAll[MAX_DEPTH].logp
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mlviz-hint">
          Greedy picks the highest-prob token at every step — fast, but locks into local choices. Beam search keeps the top-k partial sequences by cumulative log-prob, then re-ranks after each expansion — often finds a sequence greedy missed because the best path went through a less-likely first token.
        </div>
      </div>
    </div>
  );
}
