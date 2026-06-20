import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Radio } from 'lucide-react';
import './GossipProtocolViz.css';

// Gossip / epidemic dissemination.
//
// A cluster of N nodes sits in a ring. Node 0 starts holding a fresh piece of
// information (the "infected" / updated node). Every ROUND, each already-informed
// node picks `fanout` random peer(s) and pushes the info to them; any peer that
// did not yet know it becomes informed and joins in for the next round.
//
// Because the informed set roughly multiplies by (1 + fanout) each round, the
// whole cluster converges in O(log n) rounds — the classic anti-entropy curve
// used by Cassandra, DynamoDB, Consul and Serf to spread membership + state.
//
// Peer selection is driven by a seeded mulberry32 PRNG so the spread replays
// identically every time (deterministic per round) — verified in node to
// converge for N=12 at both fanout 1 and 2.

const N = 12;
const SEED = 12;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ring layout — node i sits at angle i/N around a circle.
function buildNodes(cx, cy, r) {
  const nodes = [];
  for (let i = 0; i < N; i += 1) {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ id: i, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
  }
  return nodes;
}

// One frame per round. Frame 0 = the seed state (only node 0 informed).
function buildFrames(fanout) {
  const rng = mulberry32(SEED + fanout * 1000);
  const informed = new Array(N).fill(false);
  informed[0] = true;

  const frames = [{
    round: 0,
    informed: [...informed],
    newly: [0],
    gossips: [],
    count: 1,
    note: `Round 0 — only node 0 holds the new value (the infected source). Every other node is stale. Press Step or Play to spread it by gossip with fanout ${fanout}.`,
  }];

  let round = 0;
  while (informed.filter(Boolean).length < N && round < 40) {
    round += 1;
    const informers = [];
    for (let i = 0; i < N; i += 1) if (informed[i]) informers.push(i);

    const gossips = [];
    const newlySet = new Set();
    for (const u of informers) {
      const picked = new Set();
      for (let f = 0; f < fanout; f += 1) {
        let v;
        let tries = 0;
        do {
          v = Math.floor(rng() * N);
          tries += 1;
        } while ((v === u || picked.has(v)) && tries < 24);
        picked.add(v);
        const fresh = !informed[v] && !newlySet.has(v);
        gossips.push({ from: u, to: v, fresh });
        if (!informed[v]) newlySet.add(v);
      }
    }
    for (const v of newlySet) informed[v] = true;

    const newly = [...newlySet].sort((a, b) => a - b);
    const count = informed.filter(Boolean).length;
    const informerLabel = informers.length <= 6
      ? `{${informers.join(', ')}}`
      : `${informers.length} informed nodes`;
    const newlyLabel = newly.length ? `{${newly.join(', ')}}` : 'no new nodes (peers already knew)';
    frames.push({
      round,
      informed: [...informed],
      newly,
      gossips,
      count,
      note: newly.length
        ? `Round ${round} — ${informerLabel} each gossip to ${fanout === 1 ? 'a' : fanout} random peer -> ${newlyLabel} newly informed. ${count}/${N} now know.`
        : `Round ${round} — ${informerLabel} gossiped but every peer already knew. ${count}/${N} know.`,
    });
  }

  const last = frames[frames.length - 1];
  frames.push({
    ...last,
    gossips: [],
    newly: [],
    note: `Converged in ${round} round${round === 1 ? '' : 's'}. All ${N} nodes hold the value. Starting from one source, the informed set roughly multiplied each round — O(log n) rounds to reach the whole cluster, the property that makes gossip scale.`,
  });

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function GossipProtocolViz() {
  const [fanout, setFanout] = useState(1);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(fanout), [fanout]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const pickFanout = (f) => {
    setFanout(f);
    setIsRunning(false);
    setStep(0);
  };

  const W = 940;
  const H = 420;
  const cx = 235;
  const cy = H / 2;
  const ringR = 150;
  const nodes = useMemo(() => buildNodes(cx, cy, ringR), [cx, cy]);

  const pct = Math.round((current.count / N) * 100);
  const newlySet = useMemo(() => new Set(current.newly), [current.newly]);

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // Right-side convergence chart: informed count per round.
  const chartX = 500;
  const chartW = W - chartX - 36;
  const chartY = 70;
  const chartH = H - 150;
  const maxRound = frames[frames.length - 2] ? frames[frames.length - 2].round : 1;
  const bx = (r) => chartX + (maxRound === 0 ? 0 : (r / maxRound) * chartW);
  const by = (c) => chartY + chartH - (c / N) * chartH;
  // points up to current round only
  const points = frames
    .filter((f, i) => i < totalSteps - 1 && f.round <= current.round)
    .map((f) => ({ r: f.round, c: f.count }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${bx(p.r)} ${by(p.c)}`).join(' ');

  return (
    <div className="gpv">
      <div className="gpv-head">
        <h3 className="gpv-title">Gossip protocol — epidemic dissemination in O(log n) rounds</h3>
        <p className="gpv-sub">
          One node starts with a fresh value. Each round every informed node pushes it to random peer(s); newly
          informed nodes join the next round. The informed set roughly multiplies per round, so the whole cluster
          converges in logarithmically many rounds.
        </p>
      </div>

      <div className="gpv-controls">
        <div className="gpv-fanout" role="group" aria-label="fanout">
          <span className="gpv-input-label">fanout</span>
          {[1, 2].map((f) => (
            <button
              key={`fan-${f}`}
              type="button"
              className={`gpv-chip ${fanout === f ? 'is-on' : ''}`}
              onClick={() => pickFanout(f)}
            >
              {f} peer{f > 1 ? 's' : ''}
            </button>
          ))}
        </div>

        <label className="gpv-speed">
          <span className="gpv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="gpv-speed-range"
            aria-label="Playback speed"
          />
          <span className="gpv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="gpv-spacer" aria-hidden="true" />

        <div className="gpv-buttons">
          <button
            type="button"
            className="gpv-btn gpv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="gpv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="gpv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="gpv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="gpv-stepcount">
          round <strong>{current.round}</strong>
        </div>
      </div>

      <div className="gpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gpv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gpv-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="gpv-arrow-dim" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={chartX - 56} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={36} y={42} className="gpv-section-label">cluster · gossip this round</text>

          {/* gossip edges flashing this round */}
          {current.gossips.map((g, i) => {
            const a = nodes[g.from];
            const b = nodes[g.to];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const r = 18;
            const ax = a.x + (dx / len) * r;
            const ay = a.y + (dy / len) * r;
            const bx2 = b.x - (dx / len) * (r + 4);
            const by2 = b.y - (dy / len) * (r + 4);
            return (
              <line
                key={`g-${i}`}
                x1={ax}
                y1={ay}
                x2={bx2}
                y2={by2}
                className={`gpv-edge ${g.fresh ? 'is-fresh' : 'is-stale'}`}
                markerEnd={`url(#${g.fresh ? 'gpv-arrow' : 'gpv-arrow-dim'})`}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((nd) => {
            const isInformed = current.informed[nd.id];
            const isNew = newlySet.has(nd.id);
            const isSource = nd.id === 0;
            const cls = isNew ? 'is-new' : isInformed ? 'is-informed' : 'is-stale';
            return (
              <g key={`n-${nd.id}`} className={`gpv-node ${cls}`}>
                {isNew && <circle cx={nd.x} cy={nd.y} r={26} className="gpv-node-halo" />}
                <circle cx={nd.x} cy={nd.y} r={18} className="gpv-node-disc" />
                <text x={nd.x} y={nd.y + 4} className="gpv-node-label">{nd.id}</text>
                {isSource && <text x={nd.x} y={nd.y - 26} className="gpv-node-tag">src</text>}
              </g>
            );
          })}

          {/* convergence chart */}
          <rect x={chartX - 20} y={20} width={chartW + 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={chartX} y={42} className="gpv-section-label">informed nodes per round</text>

          {/* axes */}
          <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} className="gpv-axis" />
          <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} className="gpv-axis" />
          {/* full = N gridline */}
          <line x1={chartX} y1={by(N)} x2={chartX + chartW} y2={by(N)} className="gpv-grid" />
          <text x={chartX - 8} y={by(N) + 4} className="gpv-axis-tick" textAnchor="end">{N}</text>
          <text x={chartX - 8} y={by(N / 2) + 4} className="gpv-axis-tick" textAnchor="end">{N / 2}</text>
          <text x={chartX - 8} y={by(0) + 4} className="gpv-axis-tick" textAnchor="end">0</text>
          <text x={chartX + chartW} y={chartY + chartH + 20} className="gpv-axis-tick" textAnchor="end">round {maxRound}</text>
          <text x={chartX} y={chartY + chartH + 20} className="gpv-axis-tick" textAnchor="start">0</text>

          {linePath && <path d={linePath} className="gpv-curve" fill="none" />}
          {points.map((p) => (
            <g key={`pt-${p.r}`}>
              <line x1={bx(p.r)} y1={by(p.c)} x2={bx(p.r)} y2={by(0)} className="gpv-stem" />
              <circle cx={bx(p.r)} cy={by(p.c)} r={p.r === current.round ? 6 : 4} className={`gpv-dot ${p.r === current.round ? 'is-cur' : ''}`} />
              <text x={bx(p.r)} y={by(p.c) - 12} className="gpv-dot-label" textAnchor="middle">{p.c}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="gpv-metrics">
        <div className="gpv-metric">
          <span className="gpv-metric-label">round</span>
          <span className="gpv-metric-value">{current.round}</span>
        </div>
        <div className="gpv-metric">
          <span className="gpv-metric-label">informed</span>
          <span className="gpv-metric-value">{current.count} / {N}</span>
        </div>
        <div className="gpv-metric">
          <span className="gpv-metric-label">converged</span>
          <span className="gpv-metric-value">{pct}%</span>
        </div>
        <div className="gpv-metric gpv-metric-dim">
          <span className="gpv-metric-label">fanout</span>
          <span className="gpv-metric-value gpv-metric-dimval">
            <Radio size={12} /> {fanout} peer{fanout > 1 ? 's' : ''}/node
          </span>
        </div>
      </div>

      <div className="gpv-caption">
        <span className="gpv-caption-label">trace</span>
        <span className="gpv-caption-body">{current.note}</span>
      </div>
    </div>
  );
}
