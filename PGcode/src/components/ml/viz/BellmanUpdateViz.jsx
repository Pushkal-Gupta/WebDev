import React, { useMemo, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import './MLViz.css';

// Single-update decomposition of the Bellman backup on a 1xN reward chain.
// Q(s,a) <- Q(s,a) + alpha * [ r + gamma * max_a' Q(s',a') - Q(s,a) ].
// The agent always walks right toward the goal; each Step applies the backup
// at one transition, so the reward value seeps one cell upstream per pass.

const W = 600;
const H = 300;
const N = 5;                 // cells 0..4, cell 4 is the goal
const GOAL = N - 1;
const GOAL_REWARD = 10;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// deterministic — the chain has no randomness, but keep the convention
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// the agent walks right; the transitions visited in order, looping each pass
function transitions() {
  const t = [];
  for (let s = 0; s < GOAL; s++) t.push({ s, sp: s + 1 });
  return t;
}

const TR = transitions();

export default function BellmanUpdateViz({ alpha: alpha0 = 0.5, gamma: gamma0 = 0.9 } = {}) {
  const [alpha, setAlpha] = useState(alpha0);
  const [gamma, setGamma] = useState(gamma0);
  const [step, setStep] = useState(0);          // number of backups applied
  // re-seed the rng once so lint sees it used; values are deterministic anyway
  const seed = useMemo(() => mulberry32(7)(), []);

  // Replay the whole backup history from scratch for the current step count.
  // Returns the Q array for the right action plus the decomposition of the
  // LAST applied backup so the panel can show the target assembling.
  const state = useMemo(() => {
    const Q = new Array(N).fill(0);   // Q(cell, right)
    let last = null;
    for (let k = 0; k < step; k++) {
      const { s, sp } = TR[k % TR.length];
      const terminal = sp === GOAL;
      const r = terminal ? GOAL_REWARD : 0;
      const oldQ = Q[s];
      const future = terminal ? 0 : gamma * Q[sp];   // gamma * max_a' Q(s',a')
      const target = r + future;
      const tdError = target - oldQ;
      const newQ = oldQ + alpha * tdError;
      Q[s] = newQ;
      last = { s, sp, r, future, oldQ, target, tdError, newQ, terminal };
    }
    return { Q, last };
  }, [step, alpha, gamma]);

  const { Q, last } = state;
  const activeS = last ? last.s : null;
  const activeSp = last ? last.sp : null;

  // ---- layout ----
  const cellW = 88;
  const cellH = 64;
  const gap = 26;
  const totalW = N * cellW + (N - 1) * gap;
  const x0 = (W - totalW) / 2;
  const yCells = 150;
  const maxQ = GOAL_REWARD;

  function cellX(i) { return x0 + i * (cellW + gap); }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', maxWidth: '820px' }}
        >
          <text
            x={x0}
            y={36}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            STATE CHAIN · Q(cell, right) · backups applied: {step}
          </text>

          {/* edges between cells */}
          {TR.map(({ s, sp }) => {
            const ax = cellX(s) + cellW;
            const bx = cellX(sp);
            const my = yCells + cellH / 2;
            const isActive = activeS === s && activeSp === sp;
            return (
              <g key={`edge-${s}`}>
                <line
                  x1={ax}
                  y1={my}
                  x2={bx}
                  y2={my}
                  stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isActive ? 2.2 : 1}
                  markerEnd="url(#bell-arrow)"
                />
              </g>
            );
          })}

          <defs>
            <marker
              id="bell-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="5.5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* cells */}
          {Q.map((q, i) => {
            const cx = cellX(i);
            const isGoal = i === GOAL;
            const isS = activeS === i;
            const isSp = activeSp === i;
            const barFrac = Math.min(1, q / maxQ);
            const barH = barFrac * (cellH - 10);
            return (
              <g key={`cell-${i}`}>
                <rect
                  x={cx}
                  y={yCells}
                  width={cellW}
                  height={cellH}
                  rx="8"
                  fill={isGoal ? 'rgba(var(--accent-rgb), 0.12)' : 'var(--surface)'}
                  stroke={
                    isS ? 'var(--accent)' : isSp ? 'var(--hue-mint)' : 'var(--border)'
                  }
                  strokeWidth={isS || isSp ? 2 : 1}
                />
                {/* value bar inside cell */}
                <rect
                  x={cx + 8}
                  y={yCells + cellH - 5 - barH}
                  width={10}
                  height={barH}
                  rx="2"
                  fill={isGoal ? 'var(--accent)' : 'var(--hue-violet)'}
                  opacity="0.75"
                />
                <text
                  x={cx + cellW / 2 + 6}
                  y={yCells + cellH / 2 - 2}
                  fontSize="15"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {snap(q, 2)}
                </text>
                <text
                  x={cx + cellW / 2 + 6}
                  y={yCells + cellH / 2 + 14}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  Q(s{i})
                </text>
                <text
                  x={cx + cellW / 2}
                  y={yCells - 10}
                  fontSize="9"
                  fill={isGoal ? 'var(--accent)' : 'var(--text-dim)'}
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                >
                  {isGoal ? `goal +${GOAL_REWARD}` : `cell ${i}`}
                </text>
              </g>
            );
          })}

          {/* TD-target assembly bar for the last applied backup */}
          {last && (
            <g>
              <text
                x={x0}
                y={252}
                fontSize="8.5"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                letterSpacing="0.08em"
              >
                LAST BACKUP · cell {last.s} → cell {last.sp}
                {last.terminal ? '  (terminal: no future term)' : ''}
              </text>
              {(() => {
                const bx = x0;
                const by = 262;
                const bw = totalW;
                const segScale = bw / Math.max(GOAL_REWARD, last.target || 1);
                const rW = last.r * segScale;
                const fW = last.future * segScale;
                return (
                  <g>
                    <rect
                      x={bx}
                      y={by}
                      width={Math.max(0, rW)}
                      height={14}
                      fill="var(--accent)"
                      opacity="0.8"
                      rx="2"
                    />
                    <rect
                      x={bx + rW}
                      y={by}
                      width={Math.max(0, fW)}
                      height={14}
                      fill="var(--hue-mint)"
                      opacity="0.7"
                      rx="2"
                    />
                    <text
                      x={bx + rW / 2}
                      y={by + 10}
                      fontSize="7.5"
                      fill="var(--bg)"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      fontWeight="700"
                    >
                      {rW > 24 ? `r=${snap(last.r, 1)}` : ''}
                    </text>
                    <text
                      x={bx + rW + fW / 2}
                      y={by + 10}
                      fontSize="7.5"
                      fill="var(--bg)"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      fontWeight="700"
                    >
                      {fW > 40 ? `γ·maxQ=${snap(last.future, 2)}` : ''}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">α</span>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(alpha, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">γ</span>
          <input
            type="range"
            min="0"
            max="0.99"
            step="0.01"
            value={gamma}
            onChange={(e) => setGamma(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(gamma, 2)}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          {last ? (
            <>
              <div className="mlviz-row" style={{ gap: '0.6rem' }}>
                <span className="mlviz-tag">target</span>
                <span className="mlviz-val">
                  r + γ·maxₐ′Q(s′,a′) = {snap(last.r, 2)} + {snap(last.future, 2)} = {snap(last.target, 3)}
                </span>
              </div>
              <div className="mlviz-row" style={{ gap: '0.6rem' }}>
                <span className="mlviz-tag">δ</span>
                <span className="mlviz-val">
                  target − Q(s) = {snap(last.target, 2)} − {snap(last.oldQ, 2)} = {snap(last.tdError, 3)}
                </span>
                <span className="mlviz-sub">temporal-difference error</span>
              </div>
              <div className="mlviz-row" style={{ gap: '0.6rem' }}>
                <span className="mlviz-tag">Q←</span>
                <span className="mlviz-val">
                  {snap(last.oldQ, 2)} + {snap(alpha, 2)}·{snap(last.tdError, 2)} = {snap(last.newQ, 3)}
                </span>
                <span className="mlviz-sub">new Q(cell {last.s})</span>
              </div>
            </>
          ) : (
            <div className="mlviz-row" style={{ gap: '0.6rem' }}>
              <span className="mlviz-tag">Q</span>
              <span className="mlviz-val">all zeros — press Step to apply the first backup</span>
            </div>
          )}
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">seed</span>
            <span className="mlviz-sub">deterministic chain (rng {snap(seed, 3)})</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={() => setStep((s) => s + 1)}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setStep(0); setAlpha(alpha0); setGamma(gamma0); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          value seeps one cell upstream per pass · converges to Q(cell d) = {GOAL_REWARD}·γ^(distance to goal)
        </div>
      </div>
    </div>
  );
}
