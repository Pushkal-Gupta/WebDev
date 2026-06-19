import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Radio } from 'lucide-react';
import './GossipProtocolViz2.css';

// Gossip / epidemic dissemination — slider-driven cluster + fanout.
//
// One node learns a fact. Every ROUND, each already-infected node picks `fanout`
// random peers and tells them; any peer that did not know becomes infected and
// gossips next round. The infected set roughly multiplies by ~(1+fanout) per
// round, so the whole cluster converges in O(log n) rounds — the property that
// lets Cassandra / Dynamo / Serf spread membership without a coordinator.
//
// Sliders control cluster size N (8..40) and fanout (1..4). The right panel
// charts infected fraction per round so the reader sees the S-curve flatten as
// it saturates. Peer choice uses a seeded mulberry32 PRNG keyed by (N, fanout)
// so every configuration replays identically.

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

function buildNodes(n, cx, cy, r) {
  const nodes = [];
  for (let i = 0; i < n; i += 1) {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ id: i, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
  }
  return nodes;
}

function buildFrames(n, fanout) {
  const rng = mulberry32(n * 131 + fanout * 977 + 7);
  const infected = new Array(n).fill(false);
  infected[0] = true;

  const frames = [{
    round: 0,
    infected: [...infected],
    newly: [0],
    gossips: [],
    count: 1,
    note: `Round 0 — node 0 just learned the fact; the other ${n - 1} nodes are stale. Each round every infected node will tell ${fanout} random peer${fanout > 1 ? 's' : ''}.`,
  }];

  let round = 0;
  while (infected.filter(Boolean).length < n && round < 60) {
    round += 1;
    const informers = [];
    for (let i = 0; i < n; i += 1) if (infected[i]) informers.push(i);

    const gossips = [];
    const newlySet = new Set();
    for (const u of informers) {
      const picked = new Set();
      for (let f = 0; f < fanout; f += 1) {
        let v; let tries = 0;
        do { v = Math.floor(rng() * n); tries += 1; } while ((v === u || picked.has(v)) && tries < 40);
        picked.add(v);
        const fresh = !infected[v] && !newlySet.has(v);
        gossips.push({ from: u, to: v, fresh });
        if (!infected[v]) newlySet.add(v);
      }
    }
    for (const v of newlySet) infected[v] = true;

    const newly = [...newlySet].sort((a, b) => a - b);
    const count = infected.filter(Boolean).length;
    frames.push({
      round,
      infected: [...infected],
      newly,
      gossips,
      count,
      note: newly.length
        ? `Round ${round} — ${informers.length} infected node${informers.length > 1 ? 's' : ''} gossiped; ${newly.length} newly learned the fact. ${count}/${n} now know (${Math.round((count / n) * 100)}%).`
        : `Round ${round} — every contacted peer already knew. ${count}/${n} know.`,
    });
  }

  const last = frames[frames.length - 1];
  const conv = last.count >= n;
  frames.push({
    ...last,
    gossips: [],
    newly: [],
    note: conv
      ? `Converged in ${round} round${round === 1 ? '' : 's'}. All ${n} nodes hold the fact. With fanout ${fanout}, the infected set multiplied each round — roughly log_${1 + fanout}(${n}) rounds, the O(log n) spread that makes gossip scale.`
      : `Stopped at ${round} rounds with ${last.count}/${n} infected.`,
  });

  return frames;
}

const RUN_DELAY_MS = 1000;

export default function GossipProtocolViz2() {
  const [n, setN] = useState(20);
  const [fanout, setFanout] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.8);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(n, fanout), [n, fanout]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => { if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; } };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => { if (runTimer.current) clearTimeout(runTimer.current); }, []);

  const reset = () => { setIsRunning(false); setStep(0); };
  const changeN = (v) => { setN(v); setIsRunning(false); setStep(0); };
  const changeFanout = (v) => { setFanout(v); setIsRunning(false); setStep(0); };

  const W = 940;
  const H = 430;
  const cx = 230;
  const cy = H / 2;
  const ringR = Math.min(165, 70 + n * 4.5);
  const nodes = useMemo(() => buildNodes(n, cx, cy, ringR), [n, cx, cy, ringR]);

  const pct = Math.round((current.count / n) * 100);
  const newlySet = useMemo(() => new Set(current.newly), [current.newly]);
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const roundsToFull = totalSteps - 2;
  const nodeR = Math.max(7, Math.min(17, 220 / n));

  // chart
  const chartX = 510;
  const chartW = W - chartX - 36;
  const chartY = 78;
  const chartH = H - 160;
  const maxRound = frames[frames.length - 2] ? frames[frames.length - 2].round : 1;
  const bx = (r) => chartX + (maxRound === 0 ? 0 : (r / maxRound) * chartW);
  const by = (frac) => chartY + chartH - frac * chartH;
  const points = frames
    .filter((f, i) => i < totalSteps - 1 && f.round <= current.round)
    .map((f) => ({ r: f.round, frac: f.count / n, c: f.count }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${bx(p.r)} ${by(p.frac)}`).join(' ');

  return (
    <div className="gpv2">
      <div className="gpv2-head">
        <h3 className="gpv2-title">Gossip protocol — epidemic spread across the cluster</h3>
        <p className="gpv2-sub">
          One node learns a fact; each round every infected node tells a few random peers. Tune cluster size and
          fanout, then watch the infected fraction climb its S-curve to full propagation.
        </p>
      </div>

      <div className="gpv2-controls">
        <label className="gpv2-slider">
          <span className="gpv2-input-label">cluster N</span>
          <input type="range" min={8} max={40} step={1} value={n} onChange={(e) => changeN(Number(e.target.value))} aria-label="cluster size" />
          <span className="gpv2-slider-value">{n}</span>
        </label>
        <label className="gpv2-slider">
          <span className="gpv2-input-label">fanout</span>
          <input type="range" min={1} max={4} step={1} value={fanout} onChange={(e) => changeFanout(Number(e.target.value))} aria-label="fanout" />
          <span className="gpv2-slider-value">{fanout}</span>
        </label>
        <label className="gpv2-slider">
          <span className="gpv2-input-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed" />
          <span className="gpv2-slider-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="gpv2-spacer" aria-hidden="true" />

        <div className="gpv2-buttons">
          <button
            type="button"
            className="gpv2-btn gpv2-btn-primary"
            onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="gpv2-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="gpv2-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="gpv2-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="gpv2-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gpv2-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gpv2-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="gpv2-arrow-dim" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          <rect x={20} y={20} width={chartX - 56} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={36} y={42} className="gpv2-section-label">cluster · gossip this round</text>

          {current.gossips.map((g, i) => {
            const a = nodes[g.from];
            const b = nodes[g.to];
            if (!a || !b) return null;
            const dx = b.x - a.x; const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ax = a.x + (dx / len) * nodeR;
            const ay = a.y + (dy / len) * nodeR;
            const bx2 = b.x - (dx / len) * (nodeR + 4);
            const by2 = b.y - (dy / len) * (nodeR + 4);
            return (
              <line
                key={`g-${i}`}
                x1={ax}
                y1={ay}
                x2={bx2}
                y2={by2}
                className={`gpv2-edge ${g.fresh ? 'is-fresh' : 'is-stale'}`}
                markerEnd={`url(#${g.fresh ? 'gpv2-arrow' : 'gpv2-arrow-dim'})`}
              />
            );
          })}

          {nodes.map((nd) => {
            const isInfected = current.infected[nd.id];
            const isNew = newlySet.has(nd.id);
            const isSource = nd.id === 0;
            const cls = isNew ? 'is-new' : isInfected ? 'is-infected' : 'is-stale';
            return (
              <g key={`n-${nd.id}`} className={`gpv2-node ${cls}`}>
                {isNew && <circle cx={nd.x} cy={nd.y} r={nodeR + 7} className="gpv2-node-halo" />}
                <circle cx={nd.x} cy={nd.y} r={nodeR} className="gpv2-node-disc" />
                {isSource && <text x={nd.x} y={nd.y - nodeR - 6} className="gpv2-node-tag">src</text>}
              </g>
            );
          })}

          <rect x={chartX - 20} y={20} width={chartW + 40} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={chartX} y={42} className="gpv2-section-label">infected fraction per round</text>

          <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} className="gpv2-axis" />
          <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} className="gpv2-axis" />
          <line x1={chartX} y1={by(1)} x2={chartX + chartW} y2={by(1)} className="gpv2-grid" />
          <text x={chartX - 8} y={by(1) + 4} className="gpv2-axis-tick" textAnchor="end">100%</text>
          <text x={chartX - 8} y={by(0.5) + 4} className="gpv2-axis-tick" textAnchor="end">50%</text>
          <text x={chartX - 8} y={by(0) + 4} className="gpv2-axis-tick" textAnchor="end">0</text>
          <text x={chartX + chartW} y={chartY + chartH + 20} className="gpv2-axis-tick" textAnchor="end">round {maxRound}</text>
          <text x={chartX} y={chartY + chartH + 20} className="gpv2-axis-tick" textAnchor="start">0</text>

          {linePath && <path d={linePath} className="gpv2-curve" fill="none" />}
          {points.map((p) => (
            <g key={`pt-${p.r}`}>
              <line x1={bx(p.r)} y1={by(p.frac)} x2={bx(p.r)} y2={by(0)} className="gpv2-stem" />
              <circle cx={bx(p.r)} cy={by(p.frac)} r={p.r === current.round ? 6 : 4} className={`gpv2-dot ${p.r === current.round ? 'is-cur' : ''}`} />
              <text x={bx(p.r)} y={by(p.frac) - 11} className="gpv2-dot-label" textAnchor="middle">{Math.round(p.frac * 100)}%</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="gpv2-metrics">
        <div className="gpv2-metric">
          <span className="gpv2-metric-label">round</span>
          <span className="gpv2-metric-value">{current.round}</span>
        </div>
        <div className="gpv2-metric">
          <span className="gpv2-metric-label">infected</span>
          <span className="gpv2-metric-value">{current.count} / {n}</span>
        </div>
        <div className="gpv2-metric">
          <span className="gpv2-metric-label">infected fraction</span>
          <span className="gpv2-metric-value">{pct}%</span>
        </div>
        <div className="gpv2-metric">
          <span className="gpv2-metric-label">rounds to full</span>
          <span className="gpv2-metric-value">{roundsToFull}</span>
        </div>
        <div className="gpv2-metric gpv2-metric-dim">
          <span className="gpv2-metric-label">fanout</span>
          <span className="gpv2-metric-value gpv2-metric-dimval"><Radio size={12} /> {fanout}/node</span>
        </div>
      </div>

      <div className="gpv2-caption">
        <span className="gpv2-caption-label">trace</span>
        <span className="gpv2-caption-body">{current.note}</span>
      </div>
    </div>
  );
}
