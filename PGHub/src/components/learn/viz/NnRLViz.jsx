import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Trophy, Bot } from 'lucide-react';
import './NnRLViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLS = 5;
const ROWS = 4;
const START = { r: 3, c: 0 };
const GOAL = { r: 0, c: 4 };
const WALLS = new Set(['1,1', '1,3', '2,1']);
const GAMMA = 0.92;
const ALPHA = 0.5;
const ACTIONS = [
  { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
];

const key = (r, c) => `${r},${c}`;
const isWall = (r, c) => WALLS.has(key(r, c));
const inBounds = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const isGoal = (r, c) => r === GOAL.r && c === GOAL.c;

// Precompute a full training run: each "frame" is one episode end-state of the Q-table.
function trainEpisodes(nEpisodes) {
  const rnd = mulberry32(42);
  const Q = {};
  const qv = (r, c, a) => Q[`${r},${c},${a}`] ?? 0;
  const frames = [];
  let totalReward = 0;
  for (let ep = 0; ep < nEpisodes; ep++) {
    const eps = Math.max(0.08, 1 - ep / (nEpisodes * 0.8));
    let { r, c } = START;
    let steps = 0;
    let epReward = 0;
    const path = [{ r, c }];
    while (!isGoal(r, c) && steps < 60) {
      let a;
      if (rnd() < eps) {
        a = Math.floor(rnd() * 4);
      } else {
        let best = 0; let bestV = -Infinity;
        for (let k = 0; k < 4; k++) { const v = qv(r, c, k); if (v > bestV) { bestV = v; best = k; } }
        a = best;
      }
      let nr = r + ACTIONS[a].dr; let nc = c + ACTIONS[a].dc;
      if (!inBounds(nr, nc) || isWall(nr, nc)) { nr = r; nc = c; }
      const reward = isGoal(nr, nc) ? 1 : -0.02;
      epReward += reward;
      let bestNext = -Infinity;
      for (let k = 0; k < 4; k++) bestNext = Math.max(bestNext, qv(nr, nc, k));
      if (bestNext === -Infinity) bestNext = 0;
      const cur = qv(r, c, a);
      Q[`${r},${c},${a}`] = cur + ALPHA * (reward + GAMMA * bestNext - cur);
      r = nr; c = nc; steps += 1;
      path.push({ r, c });
    }
    totalReward += epReward;
    // snapshot state-value V(s) = max_a Q(s,a)
    const V = {};
    for (let rr = 0; rr < ROWS; rr++) {
      for (let cc = 0; cc < COLS; cc++) {
        if (isWall(rr, cc)) continue;
        let m = 0; let any = false;
        for (let k = 0; k < 4; k++) { const v = qv(rr, cc, k); if (v !== 0) { any = true; } m = Math.max(m, v); }
        V[key(rr, cc)] = any ? m : 0;
      }
    }
    frames.push({ V, path, eps, epReward, steps, avgReward: totalReward / (ep + 1) });
  }
  return frames;
}

const N_EP = 120;
const VB = 232;
const PAD = 10;
const GRID = VB - 2 * PAD;
const CELL = GRID / COLS;
const cx = (c) => PAD + c * CELL;
const cy = (r) => PAD + r * CELL;

export default function NnRLViz() {
  const frames = useMemo(() => trainEpisodes(N_EP), []);
  const [playing, setPlaying] = useState(true);
  const [ep, setEp] = useState(0);
  const [agentIdx, setAgentIdx] = useState(0);
  const raf = useRef(null);
  const last = useRef(0);
  const lastAgent = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const frame = frames[Math.min(ep, N_EP - 1)];

  const reset = () => { setEp(0); setAgentIdx(0); setPlaying(true); };

  useEffect(() => {
    if (!playing) return undefined;
    const epInterval = reduced ? 520 : 240;
    const agentInterval = reduced ? 220 : 90;
    const tick = (ts) => {
      const curPathLen = frames[Math.min(ep, N_EP - 1)].path.length;
      // animate the agent walking its path within the current episode
      if (ts - lastAgent.current >= agentInterval) {
        lastAgent.current = ts;
        setAgentIdx((ai) => (ai < curPathLen - 1 ? ai + 1 : ai));
      }
      // advance episode once the agent finished its walk
      if (ts - last.current >= epInterval) {
        last.current = ts;
        if (ep >= N_EP - 1) {
          // final episode finished its walk -> stop
          setAgentIdx((ai) => {
            if (ai >= curPathLen - 1) setPlaying(false);
            return ai;
          });
        } else {
          setEp((e) => e + 1);
          setAgentIdx(0);
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, ep, reduced, frames]);

  const agentPos = frame.path[Math.min(agentIdx, frame.path.length - 1)];

  const valColor = (v) => {
    const t = Math.max(0, Math.min(1, v / 1));
    // low value -> sky/violet, high value -> mint (warmer = better)
    return `color-mix(in srgb, var(--hue-mint) ${Math.round(t * 80)}%, color-mix(in srgb, var(--hue-violet) 30%, var(--surface)))`;
  };

  return (
    <div className="nrl">
      <div className="nrl-head">
        <div className="nrl-head-icon"><Bot size={18} /></div>
        <div className="nrl-head-text">
          <h3 className="nrl-title">A gridworld agent learning where the reward lives</h3>
          <p className="nrl-sub">
            The agent explores, and Q-learning seeps value back from the goal:
            <span dangerouslySetInnerHTML={{ __html: km('\\;V(s)\\leftarrow V(s)+\\alpha\\,[\\,r+\\gamma V(s\')-V(s)\\,]') }} />.
          </p>
        </div>
        <button type="button" className="nrl-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nrl-controls">
        <button type="button" className="nrl-btn nrl-btn-primary"
          onClick={() => (ep >= N_EP - 1 && agentIdx >= frame.path.length - 1 ? reset() : setPlaying((p) => !p))}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> {ep >= N_EP - 1 ? 'Replay' : 'Play'}</>}
        </button>
        <span className="nrl-legend">
          <span className="nrl-legend-item"><span className="nrl-sw nrl-sw-lo" /> low value</span>
          <span className="nrl-legend-item"><span className="nrl-sw nrl-sw-hi" /> high value</span>
        </span>
      </div>

      <div className="nrl-body">
        <div className="nrl-stage">
          <svg viewBox={`0 0 ${VB} ${VB}`} className="nrl-svg" preserveAspectRatio="xMidYMid meet">
            {Array.from({ length: ROWS }).map((_, r) => (
              Array.from({ length: COLS }).map((__, c) => {
                if (isWall(r, c)) {
                  return <rect key={key(r, c)} x={cx(c) + 1} y={cy(r) + 1} width={CELL - 2} height={CELL - 2}
                    rx={4} className="nrl-wall" />;
                }
                const v = isGoal(r, c) ? 1 : (frame.V[key(r, c)] || 0);
                return (
                  <g key={key(r, c)}>
                    <rect x={cx(c) + 1} y={cy(r) + 1} width={CELL - 2} height={CELL - 2} rx={4}
                      className="nrl-cell" style={{ fill: isGoal(r, c) ? 'color-mix(in srgb, var(--easy) 35%, var(--surface))' : valColor(v) }} />
                    {v > 0.01 && !isGoal(r, c) && (
                      <text x={cx(c) + CELL / 2} y={cy(r) + CELL / 2 + 3} className="nrl-vlab" textAnchor="middle">
                        {v.toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })
            ))}

            {/* goal flag */}
            <Trophy x={cx(GOAL.c) + CELL / 2 - 8} y={cy(GOAL.r) + CELL / 2 - 9} width={16} height={16} className="nrl-goal-ico" />

            {/* agent */}
            <circle cx={cx(agentPos.c) + CELL / 2} cy={cy(agentPos.r) + CELL / 2} r={CELL * 0.26}
              className="nrl-agent" />
          </svg>
        </div>

        <div className="nrl-side">
          <div className="nrl-readouts">
            <div className="nrl-stat nrl-stat-ep">
              <span className="nrl-stat-lab">episode</span>
              <span className="nrl-stat-val">{Math.min(ep + 1, N_EP)} <span className="nrl-stat-max">/ {N_EP}</span></span>
            </div>
            <div className="nrl-stat">
              <span className="nrl-stat-lab">episode reward</span>
              <span className="nrl-stat-val">{frame.epReward.toFixed(2)}</span>
            </div>
            <div className="nrl-stat nrl-stat-eps">
              <span className="nrl-stat-lab">exploration ε</span>
              <span className="nrl-stat-val">{frame.eps.toFixed(2)}</span>
            </div>
            <div className="nrl-stat">
              <span className="nrl-stat-lab">steps to goal</span>
              <span className="nrl-stat-val">{frame.steps}</span>
            </div>
          </div>

          <label className="nrl-slider">
            <span className="nrl-slider-lab">
              <span>scrub episodes</span>
              <span className="nrl-slider-val">ep {Math.min(ep + 1, N_EP)}</span>
            </span>
            <input type="range" min={0} max={N_EP - 1} step={1} value={ep}
              onChange={(e) => { setPlaying(false); setEp(parseInt(e.target.value, 10)); setAgentIdx(0); }} />
          </label>

          <div className="nrl-note">
            Early on, a high ε makes the agent wander randomly (explore). As ε anneals down it exploits the
            values it has learned, and value spreads outward from the goal until the shortest path glows brightest.
          </div>
        </div>
      </div>
    </div>
  );
}
