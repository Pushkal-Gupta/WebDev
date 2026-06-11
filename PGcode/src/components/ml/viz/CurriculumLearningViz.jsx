import React, { useMemo, useState } from 'react';
import { Shuffle, ListOrdered, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 360;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 38;
const PAD_B = 78;
const N_BUCKETS = 5;
const TOTAL_STEPS = 200;
const BUCKET_LABELS = ['tiny', 'easy', 'medium', 'hard', 'expert'];

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

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Simulate a learner whose success probability on bucket d ∈ [0..N-1] is
// a logistic of (skill − difficulty).  Skill grows when the learner solves a
// task it picked; growth scales with the task's difficulty (you only get
// stronger by tackling harder things).
function simulate(order, rng) {
  // order: array of length TOTAL_STEPS, each entry = bucket index (0..N-1)
  let skill = 0.4;           // starts modest
  const rewardCurve = [];    // moving-window mean reward
  const bucketAcc = Array(N_BUCKETS).fill(0).map(() => ({ solved: 0, seen: 0 }));
  const window = [];
  let stepsToHardest = -1;
  for (let t = 0; t < order.length; t++) {
    const d = order[t];
    const diffNorm = (d + 1) / N_BUCKETS; // 0.2..1.0
    // logistic success
    const z = (skill - diffNorm) * 6;
    const p = 1 / (1 + Math.exp(-z));
    const solved = rng() < p ? 1 : 0;
    bucketAcc[d].seen += 1;
    bucketAcc[d].solved += solved;
    // skill update: gain proportional to attempted difficulty if solved,
    // tiny gain even on failure for the curriculum to make progress
    if (solved) {
      skill += 0.012 * diffNorm;
    } else {
      skill += 0.002 * diffNorm;
    }
    skill = Math.min(1.2, skill);
    window.push(solved);
    if (window.length > 20) window.shift();
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    rewardCurve.push(mean);
    // "steps to solve hardest": first time we score on the hardest bucket
    if (d === N_BUCKETS - 1 && solved && stepsToHardest < 0) {
      stepsToHardest = t + 1;
    }
  }
  const finalAcc = bucketAcc.map((b) => (b.seen > 0 ? b.solved / b.seen : 0));
  return { rewardCurve, finalAcc, stepsToHardest, finalSkill: skill, bucketAcc };
}

function buildOrder(mode, rng) {
  // both modes touch every bucket; difference is order.
  const order = [];
  if (mode === 'curriculum') {
    // four phases growing from easiest to hardest, plus a final "review all" phase.
    const phaseLen = Math.floor(TOTAL_STEPS / (N_BUCKETS + 1));
    for (let b = 0; b < N_BUCKETS; b++) {
      // sample mostly from bucket b, occasionally from prior buckets to retain skill.
      for (let i = 0; i < phaseLen; i++) {
        const u = rng();
        let pick = b;
        if (u < 0.18 && b > 0) pick = Math.floor(rng() * b);
        order.push(pick);
      }
    }
    // final phase: uniform mix
    while (order.length < TOTAL_STEPS) {
      order.push(Math.floor(rng() * N_BUCKETS));
    }
  } else {
    // random — uniform sampling across all buckets
    for (let i = 0; i < TOTAL_STEPS; i++) {
      order.push(Math.floor(rng() * N_BUCKETS));
    }
  }
  return order;
}

export default function CurriculumLearningViz() {
  const [mode, setMode] = useState('curriculum');
  const seed = 42;

  // independent RNGs per series so reordering doesn't change the inner roll
  const orderRng = useMemo(() => mulberry32(seed), [seed]);
  const simRng = useMemo(() => mulberry32(seed + 1), [seed]);

  const { curOrder, ranOrder } = useMemo(() => {
    const a = mulberry32(seed);
    const b = mulberry32(seed);
    return {
      curOrder: buildOrder('curriculum', a),
      ranOrder: buildOrder('random', b),
    };
  }, [seed, orderRng]);

  const curSim = useMemo(() => simulate(curOrder, mulberry32(seed + 3)), [curOrder, seed, simRng]);
  const ranSim = useMemo(() => simulate(ranOrder, mulberry32(seed + 4)), [ranOrder, seed, simRng]);

  const innerW = W - PAD_L - PAD_R;
  const plotH = 200;
  const plotY0 = PAD_T;
  const plotY1 = PAD_T + plotH;

  const bucketsY = plotY1 + 42;
  const bucketsH = 22;
  const bucketW = innerW / N_BUCKETS;

  const xFor = (t) => PAD_L + (t / (TOTAL_STEPS - 1)) * innerW;
  const yFor = (r) => plotY1 - r * plotH;

  // polylines
  const curPath = curSim.rewardCurve.map((r, t) => `${xFor(t)},${yFor(r)}`).join(' ');
  const ranPath = ranSim.rewardCurve.map((r, t) => `${xFor(t)},${yFor(r)}`).join(' ');

  // active series readout
  const active = mode === 'curriculum' ? curSim : ranSim;
  const other = mode === 'curriculum' ? ranSim : curSim;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* plot frame */}
          <rect
            x={PAD_L}
            y={plotY0}
            width={innerW}
            height={plotH}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            rx="4"
            opacity="0.6"
          />

          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g}>
              <line
                x1={PAD_L}
                y1={yFor(g)}
                x2={PAD_L + innerW}
                y2={yFor(g)}
                stroke="var(--border)"
                strokeOpacity="0.35"
                strokeDasharray="2 3"
              />
              <text
                x={PAD_L - 6}
                y={yFor(g) + 3}
                fontSize="8.5"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="end"
              >
                {g.toFixed(2)}
              </text>
            </g>
          ))}
          {/* axis ticks 0 / 1 */}
          {[0, 1].map((g) => (
            <text
              key={`t-${g}`}
              x={PAD_L - 6}
              y={yFor(g) + 3}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {g.toFixed(2)}
            </text>
          ))}

          {/* random series */}
          <polyline
            points={ranPath}
            fill="none"
            stroke="var(--hue-pink)"
            strokeWidth={mode === 'random' ? 2.2 : 1.4}
            opacity={mode === 'random' ? 0.95 : 0.55}
            strokeDasharray={mode === 'random' ? '0' : '3 3'}
          />
          {/* curriculum series */}
          <polyline
            points={curPath}
            fill="none"
            stroke="var(--hue-sky)"
            strokeWidth={mode === 'curriculum' ? 2.2 : 1.4}
            opacity={mode === 'curriculum' ? 0.95 : 0.55}
            strokeDasharray={mode === 'curriculum' ? '0' : '3 3'}
          />

          {/* axis labels */}
          <text
            x={PAD_L + innerW / 2}
            y={plotY1 + 20}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            training step (1 .. {TOTAL_STEPS})
          </text>
          <text
            x={14}
            y={plotY0 + plotH / 2}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            transform={`rotate(-90, 14, ${plotY0 + plotH / 2})`}
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            rolling reward (last 20)
          </text>

          {/* header */}
          <text
            x={PAD_L}
            y={PAD_T - 16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            REWARD OVER TRAINING · 5 buckets · {TOTAL_STEPS} steps
          </text>
          <text
            x={PAD_L + innerW}
            y={PAD_T - 16}
            fontSize="9.5"
            fontFamily="var(--mono)"
            textAnchor="end"
            fontWeight="700"
          >
            <tspan fill="var(--hue-pink)">random</tspan>
            <tspan fill="var(--text-dim)">  ·  </tspan>
            <tspan fill="var(--hue-sky)">curriculum</tspan>
          </text>

          {/* bucket strip — final per-bucket accuracy of ACTIVE mode */}
          <text
            x={PAD_L}
            y={bucketsY - 8}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            FINAL ACCURACY PER BUCKET · {mode}
          </text>
          {BUCKET_LABELS.map((lbl, i) => {
            const x = PAD_L + i * bucketW + 2;
            const w = bucketW - 4;
            const acc = active.finalAcc[i];
            const accOther = other.finalAcc[i];
            return (
              <g key={lbl}>
                {/* underlay = other mode (faded) */}
                <rect
                  x={x}
                  y={bucketsY}
                  width={w}
                  height={bucketsH}
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth="0.7"
                  rx="3"
                />
                <rect
                  x={x}
                  y={bucketsY}
                  width={w * accOther}
                  height={bucketsH}
                  fill={mode === 'curriculum' ? 'var(--hue-pink)' : 'var(--hue-sky)'}
                  opacity="0.18"
                  rx="3"
                />
                {/* active bar on top */}
                <rect
                  x={x}
                  y={bucketsY}
                  width={Math.max(2, w * acc)}
                  height={bucketsH}
                  fill={mode === 'curriculum' ? 'var(--hue-sky)' : 'var(--hue-pink)'}
                  opacity="0.85"
                  rx="3"
                />
                <text
                  x={x + w / 2}
                  y={bucketsY + bucketsH / 2 + 3.4}
                  fontSize="9"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {(acc * 100).toFixed(0)}%
                </text>
                <text
                  x={x + w / 2}
                  y={bucketsY + bucketsH + 12}
                  fontSize="8.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.06em"
                >
                  {lbl}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`mlviz-toggle ${mode === 'curriculum' ? 'is-on' : ''}`}
            onClick={() => setMode('curriculum')}
          >
            <ListOrdered size={12} />
            <span>Curriculum (easy → hard)</span>
          </button>
          <button
            type="button"
            className={`mlviz-toggle ${mode === 'random' ? 'is-on' : ''}`}
            onClick={() => setMode('random')}
          >
            <Shuffle size={12} />
            <span>Random order</span>
          </button>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.32rem' }}>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag">τ</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              curriculum hardest-solve  {curSim.stepsToHardest >= 0 ? `step ${curSim.stepsToHardest}` : 'never'}
            </span>
            <span className="mlviz-sub">·</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
              random hardest-solve  {ranSim.stepsToHardest >= 0 ? `step ${ranSim.stepsToHardest}` : 'never'}
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag">acc</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              curriculum final  {(curSim.finalAcc.reduce((a, b) => a + b, 0) / N_BUCKETS * 100).toFixed(1)}%
            </span>
            <span className="mlviz-sub">·</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
              random final  {(ranSim.finalAcc.reduce((a, b) => a + b, 0) / N_BUCKETS * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setMode('curriculum')}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            same total steps, same task set, different ordering
          </span>
        </div>

        <div className="mlviz-hint">
          curriculum builds skill before drilling hard tasks · random wastes early steps failing the expert bucket
        </div>
      </div>
    </div>
  );
}
