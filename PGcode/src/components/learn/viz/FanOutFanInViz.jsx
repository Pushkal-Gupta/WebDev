import React, { useMemo, useState } from 'react';
import { Split, Merge, ShieldCheck } from 'lucide-react';
import './FanOutFanInViz.css';

// Deterministic hash → [0,1). Seeded per worker so re-renders are stable.
function seededUnit(seed) {
  let h = seed | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}

const BASE = 40; // baseline per-worker latency (ms)

// Each worker gets baseline + variance*random latency. Fan-out dispatches all
// in parallel, fan-in waits for the SLOWEST → total ≈ max(worker). A hedge
// re-issues any worker still running at the p-cutoff to a fresh replica, so the
// effective time is min(original, cutoff + fast replica).
function buildWorkers(count, variance, hedge) {
  const workers = [];
  for (let i = 0; i < count; i += 1) {
    const r = seededUnit(i * 71 + 13);
    const raw = Math.round(BASE + variance * r);
    workers.push({ id: i, raw });
  }
  const sorted = [...workers].map((w) => w.raw).sort((a, b) => a - b);
  // Hedge cutoff = p70 of latencies; slow workers get a hedged replica.
  const cutoff = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.7))];
  return workers.map((w) => {
    if (hedge && w.raw > cutoff) {
      const replica = Math.round(BASE + variance * seededUnit(w.id * 91 + 7) * 0.5);
      const effective = Math.min(w.raw, cutoff + replica);
      return { ...w, hedged: true, cutoff, effective };
    }
    return { ...w, hedged: false, cutoff, effective: w.raw };
  });
}

export default function FanOutFanInViz() {
  const [count, setCount] = useState(5);
  const [variance, setVariance] = useState(120);
  const [hedge, setHedge] = useState(false);

  const workers = useMemo(() => buildWorkers(count, variance, hedge), [count, variance, hedge]);
  const aggregate = useMemo(() => workers.reduce((m, w) => Math.max(m, w.effective), 0), [workers]);
  const slowest = useMemo(() => workers.reduce((m, w) => (w.effective > m.effective ? w : m), workers[0]), [workers]);
  const noHedgeAgg = useMemo(() => workers.reduce((m, w) => Math.max(m, w.raw), 0), [workers]);

  // SVG geometry
  const W = 940;
  const rowTop = 70;
  const rowH = 28;
  const rowGap = 8;
  const H = rowTop + count * (rowH + rowGap) + 44;
  const barLeft = 250;
  const barRight = W - 130;
  const barSpan = barRight - barLeft;
  const scaleMax = Math.max(noHedgeAgg, aggregate, 1);
  const wOf = (ms) => (barSpan * ms) / scaleMax;
  const reqX = 120;
  const reqY = rowTop + (count * (rowH + rowGap)) / 2 - 4;

  return (
    <div className="fov">
      <div className="fov-head">
        <h3 className="fov-title">Fan-out / fan-in — the slowest worker sets the clock</h3>
        <p className="fov-sub">
          One request fans OUT to N workers in parallel, then fans IN to aggregate. Total latency is bounded by
          the slowest worker — the tail. A hedge re-issues stragglers to a fresh replica to clip that tail.
        </p>
      </div>

      <div className="fov-controls">
        <label className="fov-slider">
          <span className="fov-input-label">workers</span>
          <input type="range" min={2} max={9} step={1} value={count}
            onChange={(e) => setCount(Number(e.target.value))} className="fov-range" aria-label="Worker count" />
          <span className="fov-slider-val">{count}</span>
        </label>
        <label className="fov-slider">
          <span className="fov-input-label">variance (ms)</span>
          <input type="range" min={20} max={300} step={20} value={variance}
            onChange={(e) => setVariance(Number(e.target.value))} className="fov-range" aria-label="Latency variance" />
          <span className="fov-slider-val">{variance}</span>
        </label>
        <span className="fov-spacer" aria-hidden="true" />
        <button type="button" className={`fov-toggle ${hedge ? 'is-on' : ''}`} onClick={() => setHedge((v) => !v)}>
          <ShieldCheck size={14} /> hedge {hedge ? 'on' : 'off'}
        </button>
      </div>

      <div className="fov-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fov-svg" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label="Fan-out fan-in worker latencies">
          <text x={barLeft} y={42} className="fov-axis-label">per-worker latency (ms) — fan-out parallel, fan-in waits for max →</text>

          {/* request node */}
          <circle cx={reqX} cy={reqY} r={20} className="fov-req" />
          <text x={reqX} y={reqY + 4} className="fov-req-glyph" textAnchor="middle">REQ</text>

          {/* aggregate / fan-in line */}
          <line x1={barRight + wOf(0)} y1={rowTop - 8} x2={barRight + wOf(0)} y2={H - 30} className="fov-agg-axis" />

          {workers.map((w, i) => {
            const y = rowTop + i * (rowH + rowGap);
            const cy = y + rowH / 2;
            const isSlow = slowest && w.id === slowest.id;
            return (
              <g key={`w-${i}`}>
                {/* fan-out edge */}
                <line x1={reqX + 20} y1={reqY} x2={barLeft} y2={cy} className="fov-edge" />
                <text x={barLeft - 86} y={cy + 4} className="fov-w-label" textAnchor="start">worker {i}</text>
                {/* baseline + variance bar */}
                <rect x={barLeft} y={y + 4} width={wOf(Math.min(w.raw, scaleMax))} height={rowH - 8} rx={4}
                  className={`fov-bar ${isSlow ? 'is-slow' : ''} ${w.hedged ? 'is-replaced' : ''}`} />
                {w.hedged && (
                  <rect x={barLeft} y={y + 4} width={wOf(w.effective)} height={rowH - 8} rx={4}
                    className="fov-bar-hedged" />
                )}
                <text x={barLeft + wOf(Math.max(w.raw, w.effective)) + 8} y={cy + 4} className="fov-bar-val">
                  {w.effective}{w.hedged ? ` (was ${w.raw})` : ''}
                </text>
                {w.hedged && (
                  <line x1={barLeft + wOf(w.cutoff)} y1={y + 1} x2={barLeft + wOf(w.cutoff)} y2={y + rowH - 1}
                    className="fov-cutoff" />
                )}
              </g>
            );
          })}

          <text x={barRight + 6} y={rowTop - 14} className="fov-agg-label">fan-in</text>
          <text x={barLeft} y={H - 12} className="fov-foot">
            {hedge
              ? 'Hedge on — workers past the p70 cutoff (dashed) re-issue to a replica; the aggregate tracks the clipped tail.'
              : 'Hedge off — the aggregate equals the single slowest worker. One straggler stalls the whole request.'}
          </text>
        </svg>
      </div>

      <div className="fov-metrics">
        <div className="fov-metric">
          <span className="fov-metric-label"><Split size={11} /> worker times (ms)</span>
          <span className="fov-metric-value">{workers.map((w) => w.effective).join(', ')}</span>
        </div>
        <div className="fov-metric">
          <span className="fov-metric-label"><Merge size={11} /> aggregate completion</span>
          <span className="fov-metric-value">{aggregate} ms</span>
        </div>
        <div className="fov-metric">
          <span className="fov-metric-label">tail (slowest)</span>
          <span className="fov-metric-value is-warn">worker {slowest ? slowest.id : 0} · {slowest ? slowest.effective : 0} ms</span>
        </div>
        <div className="fov-metric">
          <span className="fov-metric-label">tail clipped</span>
          <span className={`fov-metric-value ${hedge && noHedgeAgg > aggregate ? 'is-ok' : ''}`}>
            {hedge ? `${noHedgeAgg - aggregate} ms saved` : 'hedge off'}
          </span>
        </div>
      </div>

      <div className="fov-narration">
        <span className="fov-narration-label">trace</span>
        <span className="fov-narration-body">
          {hedge
            ? `${count} workers fan out; stragglers past ${workers[0] ? workers[0].cutoff : 0} ms hedge to a replica, cutting the aggregate from ${noHedgeAgg} to ${aggregate} ms.`
            : `${count} workers fan out in parallel; fan-in blocks on the slowest (${aggregate} ms). Adding workers raises the odds of a slow tail — toggle hedge to defend against it.`}
        </span>
      </div>
    </div>
  );
}
