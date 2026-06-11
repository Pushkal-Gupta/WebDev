import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Target, Sparkles, AlertTriangle, Flag } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

const W = 720;
const H = 360;
const GRID = 5;
const START = { r: 0, c: 0 };
const GOAL = { r: 4, c: 4 };
const ACTIONS = [
  { dr: -1, dc: 0, name: 'up' },
  { dr: 1, dc: 0, name: 'down' },
  { dr: 0, dc: -1, name: 'left' },
  { dr: 0, dc: 1, name: 'right' },
];
const GAMMA = 0.9;

const MODES = [
  { key: 'sparse', label: 'sparse', icon: 'flag' },
  { key: 'potential', label: 'potential shaping', icon: 'sparkles' },
  { key: 'misleading', label: 'misleading shaping', icon: 'warning' },
];

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function inBounds(r, c) {
  return r >= 0 && r < GRID && c >= 0 && c < GRID;
}

function manhattanToGoal(r, c) {
  return Math.abs(r - GOAL.r) + Math.abs(c - GOAL.c);
}

function potential(r, c) {
  // higher near goal
  return -manhattanToGoal(r, c);
}

function rewardFn(mode, r, c, nr, nc) {
  // base sparse reward — +1 on transitioning to goal
  const base = nr === GOAL.r && nc === GOAL.c ? 1 : 0;
  if (mode === 'sparse') return base;
  if (mode === 'potential') {
    // potential-based shaping: r' = r + gamma * phi(s') - phi(s)
    const shape = GAMMA * potential(nr, nc) - potential(r, c);
    return base + 0.05 * shape;
  }
  // misleading: rewards moving away from start (not toward goal) — induces local optimum
  // reward proportional to row, regardless of col. agent learns to hug bottom row,
  // misses the column convergence.
  const lure = (nr - r) * 0.05; // moving down rewarded
  const penaltyForUp = nr < r ? -0.02 : 0;
  return base + lure + penaltyForUp;
}

function runValueIteration(mode, sweeps) {
  const V = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  let lastDelta = Infinity;
  let convergeSweep = sweeps;
  for (let s = 0; s < sweeps; s++) {
    const Vnext = V.map((row) => row.slice());
    let delta = 0;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (r === GOAL.r && c === GOAL.c) {
          Vnext[r][c] = 0;
          continue;
        }
        let best = -Infinity;
        for (const a of ACTIONS) {
          const nr = r + a.dr;
          const nc = c + a.dc;
          if (!inBounds(nr, nc)) continue;
          const rwd = rewardFn(mode, r, c, nr, nc);
          const q = rwd + GAMMA * V[nr][nc];
          if (q > best) best = q;
        }
        Vnext[r][c] = best === -Infinity ? 0 : best;
        delta = Math.max(delta, Math.abs(Vnext[r][c] - V[r][c]));
      }
    }
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) V[r][c] = Vnext[r][c];
    if (delta < 1e-4 && convergeSweep === sweeps) convergeSweep = s + 1;
    lastDelta = delta;
  }
  return { V, convergeSweep, lastDelta };
}

function greedyPolicy(V, mode) {
  // For each cell, pick the action with the max Q
  const policy = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (r === GOAL.r && c === GOAL.c) continue;
      let bestA = null;
      let best = -Infinity;
      for (const a of ACTIONS) {
        const nr = r + a.dr;
        const nc = c + a.dc;
        if (!inBounds(nr, nc)) continue;
        const rwd = rewardFn(mode, r, c, nr, nc);
        const q = rwd + GAMMA * V[nr][nc];
        if (q > best) {
          best = q;
          bestA = a;
        }
      }
      policy[r][c] = bestA;
    }
  }
  return policy;
}

// Optimal policy: head right or down (any monotonic move toward goal)
function isOptimalAction(r, c, a) {
  if (r === GOAL.r && c === GOAL.c) return true;
  // optimal if action reduces manhattan distance
  const nr = r + a.dr;
  const nc = c + a.dc;
  if (!inBounds(nr, nc)) return false;
  return manhattanToGoal(nr, nc) < manhattanToGoal(r, c);
}

export default function RewardShapingViz() {
  const [mode, setMode] = useState('sparse');
  const [sweeps, setSweeps] = useState(15);

  const { V, convergeSweep } = useMemo(() => runValueIteration(mode, sweeps), [mode, sweeps]);
  const policy = useMemo(() => greedyPolicy(V, mode), [V, mode]);

  // Match % vs the canonical optimal direction (right/down)
  const matchPct = useMemo(() => {
    let total = 0;
    let match = 0;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (r === GOAL.r && c === GOAL.c) continue;
        total++;
        const a = policy[r][c];
        if (a && isOptimalAction(r, c, a)) match++;
      }
    }
    return total === 0 ? 0 : (match / total) * 100;
  }, [policy]);

  // Value range for color scaling
  const { vMin, vMax } = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      mn = Math.min(mn, V[r][c]);
      mx = Math.max(mx, V[r][c]);
    }
    if (mn === mx) mx = mn + 1;
    return { vMin: mn, vMax: mx };
  }, [V]);

  const handleMode = useCallback((m) => setMode(m), []);

  const formulaHtml = useMemo(() => katexHtml("r'(s,a,s') = r(s,a,s') + \\gamma\\phi(s') - \\phi(s)", false), []);

  // layout
  const gridSize = 250;
  const cellSize = gridSize / GRID;
  const gridX = 28;
  const gridY = 60;

  // accent for active mode
  const modeColor = mode === 'sparse'
    ? 'var(--hue-sky)'
    : mode === 'potential'
      ? 'var(--hue-mint)'
      : 'var(--warning)';

  function valColor(v) {
    const t = (v - vMin) / (vMax - vMin || 1);
    return { fill: modeColor, opacity: 0.12 + 0.65 * t };
  }

  function arrowD(cx, cy, a) {
    if (!a) return '';
    const len = cellSize * 0.32;
    const x2 = cx + a.dc * len;
    const y2 = cy + a.dr * len;
    return `M ${cx - a.dc * len * 0.4} ${cy - a.dr * len * 0.4} L ${x2} ${y2}`;
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="rsv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={modeColor} />
            </marker>
          </defs>

          {/* Grid */}
          <g>
            <text
              x={gridX}
              y={gridY - 14}
              fontSize="10"
              fontFamily="var(--mono)"
              fill="var(--text-dim)"
              letterSpacing="0.14em"
            >
              GRIDWORLD  5×5
            </text>
            {Array.from({ length: GRID }).map((_, r) =>
              Array.from({ length: GRID }).map((__, c) => {
                const x = gridX + c * cellSize;
                const y = gridY + r * cellSize;
                const v = V[r][c];
                const { fill, opacity } = valColor(v);
                const isStart = r === START.r && c === START.c;
                const isGoal = r === GOAL.r && c === GOAL.c;
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      fill={fill}
                      opacity={opacity}
                      stroke="var(--border)"
                      strokeWidth="0.8"
                      rx="3"
                    />
                    {/* value text */}
                    <text
                      x={x + cellSize / 2}
                      y={y + 13}
                      fontSize="8"
                      fontFamily="var(--mono)"
                      fill="var(--text-dim)"
                      textAnchor="middle"
                    >
                      {v.toFixed(2)}
                    </text>
                    {/* arrow */}
                    {policy[r][c] && !isGoal && (
                      <path
                        d={arrowD(x + cellSize / 2, y + cellSize / 2 + 3, policy[r][c])}
                        stroke={isOptimalAction(r, c, policy[r][c]) ? modeColor : 'var(--text-dim)'}
                        strokeWidth="1.6"
                        fill="none"
                        opacity={isOptimalAction(r, c, policy[r][c]) ? 0.95 : 0.5}
                        markerEnd="url(#rsv-arrow)"
                      />
                    )}
                    {/* start marker */}
                    {isStart && (
                      <text
                        x={x + cellSize - 6}
                        y={y + cellSize - 6}
                        fontSize="8"
                        fontFamily="var(--mono)"
                        fill="var(--accent)"
                        textAnchor="end"
                        fontWeight="700"
                      >
                        S
                      </text>
                    )}
                    {isGoal && (
                      <text
                        x={x + cellSize - 6}
                        y={y + cellSize - 6}
                        fontSize="8"
                        fontFamily="var(--mono)"
                        fill="var(--easy)"
                        textAnchor="end"
                        fontWeight="700"
                      >
                        G
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </g>

          {/* Right panel: explanation of reward shape */}
          <g>
            <text
              x={310}
              y={gridY - 14}
              fontSize="10"
              fontFamily="var(--mono)"
              fill="var(--text-dim)"
              letterSpacing="0.14em"
            >
              REWARD SURFACE
            </text>

            {/* Show a heatmap of per-cell incoming reward for the chosen mode */}
            {Array.from({ length: GRID }).map((_, r) =>
              Array.from({ length: GRID }).map((__, c) => {
                // Show shaping bonus only (excluding base goal reward)
                let bonus = 0;
                if (mode === 'potential') bonus = -potential(r, c);
                else if (mode === 'misleading') bonus = r * 0.04;
                const x = 310 + c * cellSize;
                const y = gridY + r * cellSize;
                const t = Math.min(1, bonus / 0.4);
                return (
                  <rect
                    key={`r-${r}-${c}`}
                    x={x + 1}
                    y={y + 1}
                    width={cellSize - 2}
                    height={cellSize - 2}
                    fill={mode === 'misleading' ? 'var(--warning)' : 'var(--hue-mint)'}
                    opacity={mode === 'sparse' ? (r === GOAL.r && c === GOAL.c ? 0.85 : 0.05) : 0.12 + 0.6 * t}
                    stroke="var(--border)"
                    strokeWidth="0.8"
                    rx="3"
                  />
                );
              })
            )}
            <text
              x={310 + gridSize / 2}
              y={gridY + gridSize + 16}
              fontSize="9"
              fontFamily="var(--mono)"
              fill="var(--text-dim)"
              textAnchor="middle"
            >
              {mode === 'sparse' && 'reward only at goal cell — most cells learn slowly'}
              {mode === 'potential' && 'gradient toward goal — preserves optimal policy'}
              {mode === 'misleading' && 'reward favors moving down — traps policy in bottom row'}
            </text>
          </g>

          <text
            x={W - 16}
            y={H - 12}
            fontSize="9"
            fontFamily="var(--mono)"
            fill="var(--text-dim)"
            textAnchor="end"
            letterSpacing="0.08em"
          >
            value iteration · γ=0.9 · greedy arrows
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <div className="mlviz-toggles" style={{ border: 'none', padding: 0, background: 'transparent' }}>
            {MODES.map((m) => {
              const Icon = m.icon === 'flag' ? Flag : m.icon === 'sparkles' ? Sparkles : AlertTriangle;
              return (
                <button
                  key={m.key}
                  type="button"
                  className={`mlviz-toggle ${mode === m.key ? 'is-on' : ''}`}
                  onClick={() => handleMode(m.key)}
                >
                  <Icon size={11} />
                  <span>{m.label}</span>
                  <span className="mlviz-toggle-dot" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Target size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              sweeps N
            </span>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={sweeps}
              onChange={(e) => setSweeps(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{sweeps}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">convergence</span>
            <span className="mlviz-val" style={{ color: modeColor }}>
              {convergeSweep >= sweeps ? `> ${sweeps}` : `step ${convergeSweep}`}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">optimal match</span>
            <span
              className="mlviz-val"
              style={{
                color: matchPct >= 90 ? 'var(--easy)' : matchPct >= 50 ? 'var(--medium)' : 'var(--hard)',
                fontWeight: 800,
              }}
            >
              {matchPct.toFixed(0)}%
            </span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.85rem' }}
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
        </div>

        <div className="mlviz-hint">
          flip modes to see how shaping changes convergence · misleading shaping breaks the policy
        </div>
      </div>
    </div>
  );
}
