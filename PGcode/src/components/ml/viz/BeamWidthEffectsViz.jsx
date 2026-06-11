import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sliders, RotateCcw, Cpu, Trophy } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * BeamWidthEffectsViz
 *
 * Beam search over a small synthetic vocabulary tree of fixed depth D.
 * At each step every surviving partial sequence is expanded by V candidates;
 * only the top `width` partial-sequence log-likelihoods survive.
 *
 * The viz draws the full expansion tree, highlighting which nodes survive
 * at each step. Diminishing returns are evident: width 1→5 changes the
 * best-score noticeably, 5→8 barely moves it.
 *
 * Live readouts:
 *   - best log-likelihood found
 *   - unique sequences considered (∝ width × depth × V)
 *   - estimated multiplications (cost proxy)
 */

const W = 720;
const H = 340;
const DEPTH = 4;
const VOCAB = 5; // branching factor per step
const SEED = 23;
const DEFAULT_WIDTH = 3;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

// Build a deterministic full expansion tree.
// Each node has VOCAB children. Each edge has a per-token log-probability
// drawn from a peaked distribution: one strong winner, several weak siblings.
// Node id encodes its path (e.g. "0-1-3").
function buildTree() {
  const rng = mulberry32(SEED);
  // For each parent path we draw VOCAB log-probs from softmax(scores) and
  // make the first child the strongest, second second strongest, etc. — this
  // gives a deterministic, interpretable tree.
  const edgeLogp = new Map(); // key: parent path "" or "0-2"; value: array of length VOCAB
  function ensureChildren(path) {
    if (edgeLogp.has(path)) return edgeLogp.get(path);
    const depth = path === '' ? 0 : path.split('-').length;
    const base = [];
    if (depth === 0) {
      // ROOT: scores are close (small log-prob differences). Token 0 looks
      // strongest (greedy attractor; subtree is a trap). Tokens 1–3 look weaker
      // but each holds a progressively richer jackpot.
      base.push(1.6, 1.4, 1.2, 1.0, 0.4);
    } else {
      const first = parseInt(path.split('-')[0], 10);
      if (first === 0) {
        // TRAP subtree: all flat & boring
        for (let i = 0; i < VOCAB; i++) base.push(0.5 - i * 0.2 + (rng() - 0.5) * 0.2);
      } else if (first === 1) {
        // Small jackpot
        for (let i = 0; i < VOCAB; i++) {
          const bonus = i === 0 ? 0.5 * depth : -i * 0.2;
          base.push(0.9 + bonus + (rng() - 0.5) * 0.2);
        }
      } else if (first === 2) {
        // Medium jackpot
        for (let i = 0; i < VOCAB; i++) {
          const bonus = i === 1 ? 0.85 * depth : -i * 0.2;
          base.push(1.0 + bonus + (rng() - 0.5) * 0.2);
        }
      } else if (first === 3) {
        // Big jackpot
        for (let i = 0; i < VOCAB; i++) {
          const bonus = i === 2 ? 1.2 * depth : -i * 0.2;
          base.push(1.1 + bonus + (rng() - 0.5) * 0.2);
        }
      } else {
        for (let i = 0; i < VOCAB; i++) base.push(0.4 + (rng() - 0.5) * 0.3);
      }
    }
    const m = Math.max(...base);
    const ex = base.map((s) => Math.exp(s - m));
    const sum = ex.reduce((a, b) => a + b, 0);
    const logp = ex.map((e) => Math.log(e / sum));
    edgeLogp.set(path, logp);
    return logp;
  }
  // Pre-populate the whole tree (depth × VOCAB^depth) — but we cap by enumerating
  // only the paths we'll actually expand. For viz purposes we materialize all paths
  // because VOCAB^DEPTH = 4^4 = 256 which is fine.
  function rec(path, depthLeft) {
    ensureChildren(path);
    if (depthLeft === 0) return;
    for (let i = 0; i < VOCAB; i++) {
      const child = path === '' ? String(i) : `${path}-${i}`;
      rec(child, depthLeft - 1);
    }
  }
  rec('', DEPTH);
  return edgeLogp;
}

// Run beam search of given width over the prebuilt tree.
// Returns { survivorsByDepth: [[{path, logp}, ...], ...], bestScore, uniqueConsidered, multCost }.
function runBeam(edgeLogp, width) {
  // beam at depth 0 = a single empty path
  let beam = [{ path: '', logp: 0 }];
  const survivorsByDepth = [beam.slice()];
  let uniqueConsidered = 1; // include the root
  for (let d = 0; d < DEPTH; d++) {
    const candidates = [];
    for (const node of beam) {
      const logps = edgeLogp.get(node.path);
      for (let i = 0; i < VOCAB; i++) {
        const child = node.path === '' ? String(i) : `${node.path}-${i}`;
        candidates.push({ path: child, logp: node.logp + logps[i] });
      }
    }
    uniqueConsidered += candidates.length;
    candidates.sort((a, b) => b.logp - a.logp);
    beam = candidates.slice(0, width);
    survivorsByDepth.push(beam.slice());
  }
  const bestScore = beam.length > 0 ? beam[0].logp : 0;
  // multiplications proxy: each candidate scoring is O(V * width) softmax-ish; sum over depth
  const multCost = uniqueConsidered * VOCAB;
  return { survivorsByDepth, bestScore, uniqueConsidered, multCost, finalBeam: beam };
}

export default function BeamWidthEffectsViz() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const edgeLogp = useMemo(() => buildTree(), []);

  const { survivorsByDepth, bestScore, uniqueConsidered, multCost, finalBeam } = useMemo(
    () => runBeam(edgeLogp, width),
    [edgeLogp, width]
  );

  // For the curve of "best score vs width", precompute all widths once
  const bestVsWidth = useMemo(() => {
    const arr = [];
    for (let w = 1; w <= 8; w++) {
      const { bestScore: bs } = runBeam(edgeLogp, w);
      arr.push({ w, bs });
    }
    return arr;
  }, [edgeLogp]);

  // Survivor lookup for fast highlight
  const survivorSet = useMemo(() => {
    const s = new Set();
    survivorsByDepth.forEach((level) => level.forEach((node) => s.add(node.path)));
    return s;
  }, [survivorsByDepth]);

  // ----- layout -----
  const PAD_L = 36;
  const PAD_R = 200; // right column for inset chart
  const PAD_T = 28;
  const PAD_B = 50;
  const TREE_W = W - PAD_L - PAD_R;
  const TREE_H = H - PAD_T - PAD_B;

  // y positions per depth (D+1 layers including root)
  const layerY = useCallback((d) => PAD_T + (d * TREE_H) / DEPTH, [TREE_H]);

  // Build a map path → (x, y) using a treelike layout.
  // At each depth, lay out all VOCAB^depth nodes evenly across TREE_W.
  const nodePos = useMemo(() => {
    const pos = new Map();
    pos.set('', { x: PAD_L + TREE_W / 2, y: layerY(0) });
    function rec(path, depth, minX, maxX) {
      if (depth === DEPTH) return;
      const childCount = VOCAB;
      const span = (maxX - minX) / childCount;
      for (let i = 0; i < childCount; i++) {
        const child = path === '' ? String(i) : `${path}-${i}`;
        const cMin = minX + i * span;
        const cMax = minX + (i + 1) * span;
        pos.set(child, { x: (cMin + cMax) / 2, y: layerY(depth + 1) });
        rec(child, depth + 1, cMin, cMax);
      }
    }
    rec('', 0, PAD_L, PAD_L + TREE_W);
    return pos;
  }, [TREE_W, layerY]);

  // Enumerate edges for drawing
  const edges = useMemo(() => {
    const arr = [];
    nodePos.forEach((_, path) => {
      if (path === '') return;
      const parent = path.includes('-') ? path.slice(0, path.lastIndexOf('-')) : '';
      arr.push({ parent, child: path });
    });
    return arr;
  }, [nodePos]);

  const finalBest = finalBeam.length > 0 ? finalBeam[0] : null;
  const finalBestPath = finalBest?.path;

  // Identify the highlighted "winner" path nodes (for the gold trail)
  const winnerPathSet = useMemo(() => {
    const s = new Set();
    if (!finalBestPath) return s;
    const parts = finalBestPath.split('-');
    let acc = '';
    s.add('');
    for (const p of parts) {
      acc = acc === '' ? p : `${acc}-${p}`;
      s.add(acc);
    }
    return s;
  }, [finalBestPath]);

  const transition = reducedMotion ? 'none' : 'opacity 0.22s ease, fill 0.22s ease, r 0.22s ease';

  const eqHtml = useMemo(
    () => katexHtml('\\hat{y} = \\arg\\max_{|B|=w}\\,\\sum_{t} \\log p(y_t \\mid y_{<t})'),
    []
  );

  function resetAll() {
    setWidth(DEFAULT_WIDTH);
  }

  // Best score chart inset on the right
  const chartX = PAD_L + TREE_W + 24;
  const chartY = PAD_T + 8;
  const chartW = PAD_R - 40;
  const chartH = TREE_H - 24;
  const bsMin = Math.min(...bestVsWidth.map((p) => p.bs));
  const bsMax = Math.max(...bestVsWidth.map((p) => p.bs));
  const bsSpan = Math.max(1e-6, bsMax - bsMin);
  const chartXFor = (w) => chartX + ((w - 1) / 7) * chartW;
  const chartYFor = (bs) => chartY + chartH - ((bs - bsMin) / bsSpan) * (chartH - 6);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* tree panel frame */}
          <rect
            x={PAD_L - 8}
            y={PAD_T - 8}
            width={TREE_W + 16}
            height={TREE_H + 16}
            rx={8}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.45"
          />

          {/* edges */}
          {edges.map(({ parent, child }, idx) => {
            const p = nodePos.get(parent);
            const c = nodePos.get(child);
            if (!p || !c) return null;
            const onSurvivor = survivorSet.has(child) && survivorSet.has(parent);
            const onWinner = winnerPathSet.has(child) && winnerPathSet.has(parent);
            const stroke = onWinner ? 'var(--accent)' : onSurvivor ? 'var(--hue-sky)' : 'var(--text-dim)';
            const opacity = onWinner ? 0.95 : onSurvivor ? 0.55 : 0.13;
            const sw = onWinner ? 2.0 : onSurvivor ? 1.2 : 0.5;
            return (
              <line
                key={`e-${idx}`}
                x1={p.x}
                y1={p.y}
                x2={c.x}
                y2={c.y}
                stroke={stroke}
                strokeWidth={sw}
                opacity={opacity}
                style={{ transition: reducedMotion ? 'none' : 'stroke 0.22s ease, opacity 0.22s ease' }}
              />
            );
          })}

          {/* nodes */}
          {Array.from(nodePos.entries()).map(([path, { x, y }]) => {
            const onSurvivor = survivorSet.has(path);
            const onWinner = winnerPathSet.has(path);
            let fill = 'var(--text-dim)';
            let opacity = 0.25;
            let r = 3.2;
            if (onSurvivor) {
              fill = 'var(--hue-sky)';
              opacity = 0.75;
              r = 4.4;
            }
            if (onWinner) {
              fill = 'var(--accent)';
              opacity = 0.95;
              r = 5.6;
            }
            return (
              <circle
                key={`n-${path || 'root'}`}
                cx={x}
                cy={y}
                r={r}
                fill={fill}
                opacity={opacity}
                stroke={onWinner ? 'var(--accent)' : 'none'}
                strokeWidth="1"
                style={{ transition }}
              />
            );
          })}

          {/* depth labels */}
          {Array.from({ length: DEPTH + 1 }).map((_, d) => (
            <text
              key={`dl-${d}`}
              x={PAD_L - 14}
              y={layerY(d) + 4}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
              letterSpacing="0.08em"
            >
              t={d}
            </text>
          ))}

          {/* legend */}
          <g transform={`translate(${PAD_L}, ${PAD_T + TREE_H + 16})`}>
            <circle cx={4} cy={0} r="4" fill="var(--accent)" opacity="0.95" />
            <text x={14} y={3} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
              winner
            </text>
            <g transform="translate(80, 0)">
              <circle cx={4} cy={0} r="4" fill="var(--hue-sky)" opacity="0.75" />
              <text x={14} y={3} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
                surviving beam
              </text>
            </g>
            <g transform="translate(200, 0)">
              <circle cx={4} cy={0} r="3" fill="var(--text-dim)" opacity="0.4" />
              <text x={14} y={3} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
                pruned
              </text>
            </g>
          </g>

          {/* INSET CHART · best score vs width */}
          <g>
            <rect
              x={chartX - 8}
              y={chartY - 18}
              width={chartW + 24}
              height={chartH + 36}
              rx={6}
              fill="var(--bg)"
              stroke="var(--border)"
              strokeWidth="1"
              opacity="0.6"
            />
            <text
              x={chartX - 4}
              y={chartY - 6}
              fontSize="9.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              letterSpacing="0.1em"
            >
              best log-lik vs width
            </text>

            {/* axis */}
            <line
              x1={chartX}
              y1={chartY + chartH}
              x2={chartX + chartW}
              y2={chartY + chartH}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <line
              x1={chartX}
              y1={chartY}
              x2={chartX}
              y2={chartY + chartH}
              stroke="var(--border)"
              strokeWidth="1"
            />

            {/* curve as a polyline */}
            <polyline
              points={bestVsWidth.map((p) => `${chartXFor(p.w)},${chartYFor(p.bs)}`).join(' ')}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.6"
              opacity="0.85"
            />

            {/* dots */}
            {bestVsWidth.map((p) => {
              const active = p.w === width;
              return (
                <g key={`bw-${p.w}`}>
                  <circle
                    cx={chartXFor(p.w)}
                    cy={chartYFor(p.bs)}
                    r={active ? 4.2 : 2.6}
                    fill={active ? 'var(--accent)' : 'var(--hue-sky)'}
                    opacity={active ? 1 : 0.7}
                    style={{ transition }}
                  />
                  {active && (
                    <text
                      x={chartXFor(p.w)}
                      y={chartYFor(p.bs) - 8}
                      fontSize="9"
                      fill="var(--accent)"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      fontWeight="700"
                    >
                      w={p.w}
                    </text>
                  )}
                </g>
              );
            })}

            {/* x-axis ticks 1, 4, 8 */}
            {[1, 4, 8].map((w) => (
              <text
                key={`tx-${w}`}
                x={chartXFor(w)}
                y={chartY + chartH + 12}
                fontSize="8"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="middle"
              >
                {w}
              </text>
            ))}

            {/* diminishing returns annotation */}
            <text
              x={chartX + chartW / 2}
              y={chartY + chartH + 28}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              fast rise · flattens past w≈4
            </text>
          </g>

          <text
            x={W / 2}
            y={H - 8}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            beam width w controls how many partial sequences survive each step
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              beam width
            </span>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">w = {width}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Trophy size={11} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              best log-lik
            </span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {bestScore.toFixed(3)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              sequences considered
            </span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              {uniqueConsidered}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Cpu size={11} style={{ color: 'var(--text-dim)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              cost (mults)
            </span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)', fontWeight: 800 }}>
              {multCost}
            </span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem' }}>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: eqHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setWidth((w) => Math.max(1, w - 1))}>
            <span>narrower</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => setWidth((w) => Math.min(8, w + 1))}>
            <span>wider</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={resetAll}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            depth {DEPTH} · vocab {VOCAB}
          </span>
        </div>

        <div className="mlviz-hint">
          w=1 is greedy · curve climbs fast then flattens · diminishing returns past w≈5
        </div>
      </div>
    </div>
  );
}
