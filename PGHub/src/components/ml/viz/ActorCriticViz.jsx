import React, { useReducer, useMemo, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const N = 6; // corridor cells 0..5, goal at 5
const GOAL = N - 1;
const PAD = 30;

const GAMMA = 0.9;
const ALPHA_A = 0.4; // actor lr
const ALPHA_C = 0.3; // critic lr
const GOAL_REWARD = 1.0;
const STEP_REWARD = 0;

const RUN_DELAY = 70;

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
  // actor: one logit per cell — P(right) = sigmoid(theta[s]); P(left) = 1 - that
  // critic: value V[s], one scalar per cell
  return {
    theta: Array(N).fill(0),
    V: Array(N).fill(0),
    pos: 0,
    step: 0,
    delta: 0,
    lastReward: 0,
    lastV: 0,
    lastVnext: 0,
    lastAction: null,
    episode: 0,
    seed: 24601,
    lastFrom: 0,
    lastTo: 0,
  };
}

function reducer(state, action) {
  if (action.type === 'reset') return freshState();
  if (action.type !== 'step') return state;

  const { theta, V, pos, seed, step } = state;
  const rand = mulberry32(seed + step * 40503 + state.episode * 7919);

  const pRight = sigmoid(theta[pos]);
  const goRight = rand() < pRight;
  const next = goRight ? Math.min(GOAL, pos + 1) : Math.max(0, pos - 1);

  const done = next === GOAL;
  const reward = done ? GOAL_REWARD : STEP_REWARD;

  const vS = V[pos];
  const vNext = done ? 0 : V[next];
  const target = reward + GAMMA * vNext;
  const delta = target - vS; // TD error == advantage

  // critic update
  const newV = V.slice();
  newV[pos] = vS + ALPHA_C * delta;

  // actor update — gradient of log pi w.r.t theta[pos]
  // d/dtheta log P(right) = (1 - pRight); d/dtheta log P(left) = -pRight
  const grad = goRight ? 1 - pRight : -pRight;
  const newTheta = theta.slice();
  newTheta[pos] = theta[pos] + ALPHA_A * delta * grad;

  return {
    ...state,
    theta: newTheta,
    V: newV,
    pos: done ? 0 : next,
    step: step + 1,
    delta,
    lastReward: reward,
    lastV: vS,
    lastVnext: vNext,
    lastAction: goRight ? 'right' : 'left',
    lastFrom: pos,
    lastTo: next,
    episode: done ? state.episode + 1 : state.episode,
  };
}

export default function ActorCriticViz() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const [playing, setPlaying] = React.useState(false);
  const timer = useRef(null);

  const { theta, V, pos, delta, lastReward, lastV, lastVnext, lastAction, episode, step, lastFrom, lastTo } = state;

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setInterval(() => dispatch({ type: 'step' }), RUN_DELAY);
    return () => clearInterval(timer.current);
  }, [playing]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const stepOnce = useCallback(() => {
    setPlaying(false);
    dispatch({ type: 'step' });
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    dispatch({ type: 'reset' });
  }, []);

  const probsRight = useMemo(() => theta.map((z) => sigmoid(z)), [theta]);
  const maxV = useMemo(() => Math.max(0.2, ...V.map(Math.abs)), [V]);

  // corridor layout
  const cellW = (W - PAD * 2) / N;
  const corrY = 90;
  const corrH = 46;

  // value bar panel
  const valY0 = 178;
  const valH = 96;

  const advHue = delta >= 0 ? 'var(--hue-mint)' : 'var(--warning)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          {/* ---------- ACTOR: corridor + action probabilities ---------- */}
          <text x={PAD} y={40} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            ACTOR · π(right | s) drives the move · episode {episode}
          </text>

          {Array.from({ length: N }).map((_, i) => {
            const cx = PAD + i * cellW;
            const isGoal = i === GOAL;
            const isAgent = i === pos;
            const pr = probsRight[i];
            return (
              <g key={`cell-${i}`}>
                <rect
                  x={cx + 3}
                  y={corrY}
                  width={cellW - 6}
                  height={corrH}
                  rx="6"
                  fill={isGoal ? 'rgba(var(--accent-rgb), 0.16)' : 'var(--surface)'}
                  stroke={isAgent ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isAgent ? 2 : 0.8}
                />
                {/* probability split bar inside cell */}
                {!isGoal && (
                  <>
                    <rect x={cx + 6} y={corrY + corrH - 8} width={(cellW - 12) * (1 - pr)} height={4} fill="var(--hue-violet)" opacity="0.7" rx="1" />
                    <rect
                      x={cx + 6 + (cellW - 12) * (1 - pr)}
                      y={corrY + corrH - 8}
                      width={(cellW - 12) * pr}
                      height={4}
                      fill="var(--accent)"
                      opacity="0.85"
                      rx="1"
                    />
                  </>
                )}
                <text x={cx + cellW / 2} y={corrY + 18} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  s{i}
                </text>
                {isGoal ? (
                  <text x={cx + cellW / 2} y={corrY + 33} fontSize="11.5" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="middle">
                    goal
                  </text>
                ) : (
                  <text x={cx + cellW / 2} y={corrY + 33} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                    →{snap(pr, 2)}
                  </text>
                )}
                {isAgent && (
                  <circle cx={cx + cellW / 2} cy={corrY - 8} r="5" fill="var(--accent)" />
                )}
              </g>
            );
          })}

          {/* ---------- CRITIC: value estimate bars ---------- */}
          <text x={PAD} y={valY0 - 10} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            CRITIC · V(s) estimate
          </text>
          <line x1={PAD} y1={valY0 + valH} x2={W - PAD} y2={valY0 + valH} stroke="var(--border)" strokeWidth="0.8" />
          {V.map((v, i) => {
            const cx = PAD + i * cellW;
            const bh = (Math.abs(v) / maxV) * valH;
            const by = valY0 + valH - bh;
            const isAgent = i === pos;
            return (
              <g key={`v-${i}`}>
                <rect x={cx + cellW * 0.18} y={by} width={cellW * 0.64} height={Math.max(1, bh)} fill="var(--hue-sky)" opacity={isAgent ? 0.9 : 0.55} rx="2" />
                <text x={cx + cellW / 2} y={by - 4} fontSize="11.5" fill={isAgent ? 'var(--accent)' : 'var(--text-dim)'} fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
                  {snap(v, 2)}
                </text>
                <text x={cx + cellW / 2} y={valY0 + valH + 12} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  s{i}
                </text>
              </g>
            );
          })}

          {/* ---------- advantage signal arrow ---------- */}
          <text x={PAD} y={valY0 + valH + 34} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            ADVANTAGE δ
          </text>
          <rect
            x={PAD + 90}
            y={valY0 + valH + 24}
            width={Math.min(Math.abs(delta) * 220, W - PAD - (PAD + 90))}
            height={14}
            fill={advHue}
            opacity="0.8"
            rx="3"
          />
          <text x={W - PAD} y={valY0 + valH + 35} fontSize="11.5" fill={advHue} fontFamily="var(--mono)" textAnchor="end" fontWeight="700">
            {delta >= 0 ? '+' : ''}{snap(delta, 3)} {delta >= 0 ? '(action ↑)' : '(action ↓)'}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">δ</span>
            <span className="mlviz-val">
              δ = r + γV(s′) − V(s) = {snap(lastReward, 2)} + {GAMMA}·{snap(lastVnext, 2)} − {snap(lastV, 2)} = {snap(delta, 3)}
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">a</span>
            <span className="mlviz-val">
              {lastAction ? `moved ${lastAction}: s${lastFrom} → s${lastTo}` : 'idle'}
            </span>
            <span className="mlviz-sub">
              {delta >= 0 ? 'beat expectation → π(a) pushed up' : 'below expectation → π(a) pushed down'}
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">V̂</span>
            <span className="mlviz-val">[{V.map((v) => snap(v, 2)).join(', ')}]</span>
            <span className="mlviz-sub">one shared δ trains both networks</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">π→</span>
            <span className="mlviz-val">[{probsRight.slice(0, GOAL).map((p) => snap(p, 2)).join(', ')}]</span>
            <span className="mlviz-sub">steps {step} · γ {GAMMA} · α_a {ALPHA_A} · α_c {ALPHA_C}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={toggle}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={stepOnce} disabled={playing}>
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          critic's TD error is the actor's advantage signal · positive steers toward the action, negative away
        </div>
      </div>
    </div>
  );
}
