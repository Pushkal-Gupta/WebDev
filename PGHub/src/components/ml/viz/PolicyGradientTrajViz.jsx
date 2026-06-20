import React, { useReducer, useMemo, useCallback } from 'react';
import { StepForward, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const N = 5; // corridor cells 0..4, goal at 4, pit at 0
const GOAL = N - 1;
const PAD = 32;

const GAMMA = 0.95;
const ALPHA = 0.5;
const GOAL_REWARD = 1.0;
const PIT_REWARD = -1.0;
const STEP_REWARD = -0.04;
const MAX_LEN = 12;
const BATCH = 6; // trajectories sampled per update

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

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

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function freshState() {
  // theta[s] -> logit; P(right|s) = sigmoid(theta[s])
  return {
    theta: Array(N).fill(0),
    update: 0,
    trajectories: [],
    expectedReturn: 0,
    seed: 91173,
  };
}

// run one episode under current theta
function rollout(theta, rand) {
  let pos = 1; // start one cell right of the pit
  const states = [];
  const actions = [];
  const rewards = [];
  for (let step = 0; step < MAX_LEN; step++) {
    const pr = sigmoid(theta[pos]);
    const goRight = rand() < pr;
    states.push(pos);
    actions.push(goRight ? 1 : 0);
    const next = goRight ? Math.min(GOAL, pos + 1) : Math.max(0, pos - 1);
    let r = STEP_REWARD;
    let done = false;
    if (next === GOAL) {
      r = GOAL_REWARD;
      done = true;
    } else if (next === 0) {
      r = PIT_REWARD;
      done = true;
    }
    rewards.push(r);
    pos = next;
    if (done) break;
  }
  // total + reward-to-go
  let G = 0;
  const rtg = Array(rewards.length).fill(0);
  for (let i = rewards.length - 1; i >= 0; i--) {
    G = rewards[i] + GAMMA * G;
    rtg[i] = G;
  }
  const total = rewards.reduce((a, b) => a + b, 0);
  return { states, actions, rewards, rtg, total, end: states[states.length - 1] };
}

function reducer(state, action) {
  if (action.type === 'reset') return freshState();
  if (action.type !== 'update') return state;

  const { theta, seed, update } = state;
  const rand = mulberry32(seed + update * 1000003);

  const trajs = [];
  for (let b = 0; b < BATCH; b++) trajs.push(rollout(theta, rand));

  // baseline = mean total return (variance reduction)
  const meanReturn = trajs.reduce((a, t) => a + t.total, 0) / trajs.length;

  // accumulate REINFORCE gradient with reward-to-go minus baseline
  const grad = Array(N).fill(0);
  for (const tr of trajs) {
    for (let i = 0; i < tr.states.length; i++) {
      const s = tr.states[i];
      const a = tr.actions[i];
      const pr = sigmoid(theta[s]);
      // d/dtheta log P(a|s): right -> (1-pr), left -> -pr
      const g = a === 1 ? 1 - pr : -pr;
      const adv = tr.rtg[i] - meanReturn;
      grad[s] += g * adv;
    }
  }

  const newTheta = theta.map((z, i) => z + (ALPHA * grad[i]) / BATCH);

  return {
    ...state,
    theta: newTheta,
    update: update + 1,
    trajectories: trajs,
    expectedReturn: meanReturn,
  };
}

export default function PolicyGradientTrajViz() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const { theta, update, trajectories, expectedReturn } = state;

  const probsRight = useMemo(() => theta.map((z) => sigmoid(z)), [theta]);

  const stepUpdate = useCallback(() => dispatch({ type: 'update' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  // corridor layout
  const cellW = (W - PAD * 2) / N;
  const corrY = 60;
  const corrH = 34;
  const cx = (i) => PAD + i * cellW + cellW / 2;

  // trajectory lanes
  const laneY0 = 116;
  const laneGap = 18;

  // return color: high (mint) -> low (warning)
  function returnColor(total) {
    if (total > 0.3) return 'var(--hue-mint)';
    if (total > -0.2) return 'var(--hue-sky)';
    return 'var(--warning)';
  }

  // policy prob bars at bottom
  const barY0 = 250;
  const barH = 64;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          {/* ---------- corridor ---------- */}
          <text x={PAD} y={36} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            CORRIDOR · pit(−1) ← s0 … s4 → goal(+1) · update {update}
          </text>
          {Array.from({ length: N }).map((_, i) => {
            const x = PAD + i * cellW;
            const isGoal = i === GOAL;
            const isPit = i === 0;
            return (
              <g key={`c-${i}`}>
                <rect
                  x={x + 3}
                  y={corrY}
                  width={cellW - 6}
                  height={corrH}
                  rx="6"
                  fill={isGoal ? 'rgba(var(--accent-rgb), 0.16)' : isPit ? 'color-mix(in srgb, var(--warning) 16%, transparent)' : 'var(--surface)'}
                  stroke="var(--border)"
                  strokeWidth="0.8"
                />
                <text x={cx(i)} y={corrY + 16} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  s{i}
                </text>
                <text x={cx(i)} y={corrY + 28} fontSize="7" fill={isGoal ? 'var(--accent)' : isPit ? 'var(--warning)' : 'var(--text-dim)'} fontFamily="var(--mono)" textAnchor="middle">
                  {isGoal ? '+1' : isPit ? '−1' : '·'}
                </text>
              </g>
            );
          })}

          {/* ---------- sampled trajectories ---------- */}
          <text x={PAD} y={laneY0 - 6} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            SAMPLED TRAJECTORIES · color = return
          </text>
          {trajectories.length === 0 && (
            <text x={W / 2} y={laneY0 + 50} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              press Sample + update to roll out the current policy
            </text>
          )}
          {trajectories.map((tr, ti) => {
            const y = laneY0 + ti * laneGap;
            const pts = tr.states.map((s) => `${cx(s)},${y}`);
            // include the final landing cell
            const endX = cx(tr.end + (tr.actions[tr.actions.length - 1] === 1 ? 1 : -1));
            const safeEndX = Math.max(cx(0), Math.min(cx(GOAL), endX));
            const path = `M${pts.join(' L')} L${safeEndX},${y}`;
            const col = returnColor(tr.total);
            return (
              <g key={`tr-${ti}`}>
                <path d={path} fill="none" stroke={col} strokeWidth="2" opacity="0.85" strokeLinecap="round" />
                {tr.states.map((s, k) => (
                  <circle key={`d-${ti}-${k}`} cx={cx(s)} cy={y} r="2.4" fill={col} />
                ))}
                <text x={W - PAD + 2} y={y + 3} fontSize="7" fill={col} fontFamily="var(--mono)" textAnchor="end">
                  {snap(tr.total, 2)}
                </text>
              </g>
            );
          })}

          {/* ---------- policy probability bars ---------- */}
          <text x={PAD} y={barY0 - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            POLICY π(right | s) — shifts toward high-return actions
          </text>
          <line x1={PAD} y1={barY0 + barH} x2={W - PAD} y2={barY0 + barH} stroke="var(--border)" strokeWidth="0.8" />
          <line x1={PAD} y1={barY0 + barH / 2} x2={W - PAD} y2={barY0 + barH / 2} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.5" />
          <text x={PAD - 6} y={barY0 + barH / 2 + 3} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            0.5
          </text>
          {probsRight.map((pr, i) => {
            if (i === GOAL) return null;
            const x = PAD + i * cellW;
            const bh = pr * barH;
            const by = barY0 + barH - bh;
            return (
              <g key={`pb-${i}`}>
                <rect x={x + cellW * 0.2} y={by} width={cellW * 0.6} height={Math.max(1, bh)} fill="var(--accent)" opacity="0.75" rx="2" />
                <text x={cx(i)} y={by - 4} fontSize="7.5" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
                  {snap(pr, 2)}
                </text>
                <text x={cx(i)} y={barY0 + barH + 12} fontSize="7" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  s{i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">J</span>
            <span className="mlviz-val">expected return (batch mean) {snap(expectedReturn, 3)}</span>
            <span className="mlviz-sub">update {update} · climbs as π favours the right-ward path</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">π→</span>
            <span className="mlviz-val">[{probsRight.slice(0, GOAL).map((p) => snap(p, 2)).join(', ')}]</span>
            <span className="mlviz-sub">P(right | s) for s0..s3</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∇</span>
            <span className="mlviz-val">θ ← θ + α · Σ ∇log π(a|s) · (G − b)</span>
            <span className="mlviz-sub">baseline b = batch-mean return · reward-to-go advantage</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={stepUpdate}>
            <StepForward size={13} />
            <span>Sample + update</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          good trajectories push their actions' probabilities up · the baseline cancels the common return so only relative advantage steers θ
        </div>
      </div>
    </div>
  );
}
