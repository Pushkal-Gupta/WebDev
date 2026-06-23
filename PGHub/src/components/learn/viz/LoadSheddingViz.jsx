import React, { useMemo, useState } from 'react';
import { Activity, ShieldX, AlertTriangle } from 'lucide-react';
import './LoadSheddingViz.css';

const CAPACITY = 100; // rps the server can process safely
const PRIORITIES = [
  { key: 'enterprise', label: 'enterprise', share: 0.15, hue: 'var(--easy)' },
  { key: 'paid', label: 'paid', share: 0.35, hue: 'var(--accent)' },
  { key: 'free', label: 'free-tier', share: 0.50, hue: 'var(--hue-violet)' },
];

// Simulate 60s of operation at a given inbound rate, with/without shedding.
function simulate(inbound, shed) {
  const seconds = 60;
  let queue = 0;
  const queueSeries = [];
  let served = 0;
  let droppedShed = 0;
  let crashed = false;
  let crashAt = null;
  const MAX_QUEUE = 4000; // OOM threshold
  for (let t = 1; t <= seconds; t += 1) {
    let arrivals = inbound;
    if (shed && queue > CAPACITY * 1.0) {
      // shed lowest priority first to keep queue bounded near capacity
      const overflow = Math.max(0, (queue + arrivals) - CAPACITY * 1.2);
      const dropped = Math.min(arrivals, overflow);
      droppedShed += dropped;
      arrivals -= dropped;
    }
    queue += arrivals;
    const processed = Math.min(queue, CAPACITY);
    queue -= processed;
    served += processed;
    if (!shed && queue > MAX_QUEUE && !crashed) { crashed = true; crashAt = t; }
    queueSeries.push(Math.min(queue, MAX_QUEUE * 1.1));
    if (crashed) { queue = 0; }
  }
  return { queueSeries, served, droppedShed, crashed, crashAt, finalQueue: queueSeries[queueSeries.length - 1] };
}

export default function LoadSheddingViz() {
  const [inbound, setInbound] = useState(180);
  const [shed, setShed] = useState(true);

  const sim = useMemo(() => simulate(inbound, shed), [inbound, shed]);
  const baseline = useMemo(() => simulate(inbound, false), [inbound]);

  const W = 920;
  const H = 300;
  const padL = 56;
  const padR = 20;
  const padT = 24;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const yMax = 4400;
  const n = sim.queueSeries.length;

  const pts = (series) => series.map((q, i) => {
    const x = padL + (i / (n - 1)) * plotW;
    const y = padT + plotH - (q / yMax) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const capY = padT + plotH - (CAPACITY / yMax) * plotH;
  const overload = inbound > CAPACITY;
  const latencyEst = shed ? Math.round((Math.min(sim.finalQueue, CAPACITY * 1.2) / CAPACITY) * 1000) : (sim.crashed ? 30000 : Math.round((sim.finalQueue / CAPACITY) * 1000));

  return (
    <div className="lsv">
      <div className="lsv-head">
        <h3 className="lsv-title"><Activity size={18} className="lsv-ticon" /> Load shedding — bounded queue vs cascading collapse</h3>
        <p className="lsv-sub">
          Server safe rate is {CAPACITY} rps. Drag the inbound rate past capacity and toggle shedding. Without it the queue grows unboundedly toward an OOM crash; with it, the queue stays bounded by dropping the lowest-priority traffic.
        </p>
      </div>

      <div className="lsv-controls">
        <label className="lsv-slider">
          <span className="lsv-slider-label">inbound rate</span>
          <input type="range" min={40} max={300} step={10} value={inbound} onChange={(e) => setInbound(Number(e.target.value))} className="lsv-range" />
          <span className="lsv-slider-value">{inbound} rps</span>
        </label>
        <div className="lsv-toggle">
          <button type="button" className={`lsv-tg ${shed ? 'lsv-tg-on' : ''}`} onClick={() => setShed(true)}><ShieldX size={14} /> shed</button>
          <button type="button" className={`lsv-tg ${!shed ? 'lsv-tg-on' : ''}`} onClick={() => setShed(false)}><AlertTriangle size={14} /> no shedding</button>
        </div>
        <div className="lsv-load" style={{ color: overload ? 'var(--hard)' : 'var(--easy)' }}>
          load {(inbound / CAPACITY).toFixed(2)}× {overload ? 'over capacity' : 'within capacity'}
        </div>
      </div>

      <div className="lsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lsv-svg" preserveAspectRatio="xMidYMid meet">
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <text x={16} y={padT + plotH / 2} className="lsv-axis" transform={`rotate(-90 16 ${padT + plotH / 2})`} style={{ textAnchor: 'middle' }}>queue depth</text>
          <text x={padL + plotW / 2} y={H - 8} className="lsv-axis" style={{ textAnchor: 'middle' }}>time (60s window)</text>

          {/* capacity line */}
          <line x1={padL} y1={capY} x2={W - padR} y2={capY} stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="5 4" opacity={0.7} />
          <text x={W - padR - 4} y={capY - 5} className="lsv-cap" style={{ textAnchor: 'end' }}>safe queue ≈ capacity</text>

          {/* baseline (no shedding) ghost when shedding is on */}
          {shed && (
            <polyline points={pts(baseline.queueSeries)} fill="none" stroke="var(--hard)" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.35} />
          )}
          <polyline points={pts(sim.queueSeries)} fill="none"
            stroke={shed ? 'var(--accent)' : 'var(--hard)'} strokeWidth={2.8} />

          {sim.crashed && (
            <g>
              {(() => {
                const cx = padL + ((sim.crashAt - 1) / (n - 1)) * plotW;
                return (
                  <>
                    <line x1={cx} y1={padT} x2={cx} y2={padT + plotH} stroke="var(--hard)" strokeWidth={1.4} strokeDasharray="3 3" />
                    <text x={cx + 6} y={padT + 16} className="lsv-crash">OOM crash @ {sim.crashAt}s</text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      <div className="lsv-priorities">
        <span className="lsv-pri-label">when shedding, drop lowest priority first:</span>
        <div className="lsv-pri-bar">
          {PRIORITIES.map((p) => (
            <div key={p.key} className="lsv-pri-seg" style={{ flex: p.share, background: p.hue, opacity: shed && overload && p.key === 'free' ? 0.3 : 1 }}>
              <span className="lsv-pri-name">{p.label}{shed && overload && p.key === 'free' ? ' (shed)' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lsv-metrics">
        <div className="lsv-metric"><span className="lsv-metric-label">final queue</span>
          <span className="lsv-metric-value" style={{ color: sim.crashed ? 'var(--hard)' : 'var(--accent)' }}>{sim.crashed ? 'OOM' : Math.round(sim.finalQueue)}</span>
        </div>
        <div className="lsv-metric"><span className="lsv-metric-label">est. latency</span>
          <span className="lsv-metric-value" style={{ color: latencyEst > 5000 ? 'var(--hard)' : 'var(--easy)' }}>{latencyEst >= 1000 ? `${(latencyEst / 1000).toFixed(1)}s` : `${latencyEst}ms`}</span>
        </div>
        <div className="lsv-metric"><span className="lsv-metric-label">served (60s)</span><span className="lsv-metric-value">{Math.round(sim.served).toLocaleString()}</span></div>
        <div className="lsv-metric"><span className="lsv-metric-label">shed (60s)</span><span className="lsv-metric-value">{Math.round(sim.droppedShed).toLocaleString()}</span></div>
      </div>

      <div className="lsv-trace">
        <span className="lsv-trace-label">verdict</span>
        <span className="lsv-trace-val">
          {!overload
            ? 'At or below capacity: queue stays near zero either way — shedding is dormant.'
            : shed
              ? `Overloaded ${(inbound / CAPACITY).toFixed(2)}×: shedding drops free-tier fast (clean 503 + Retry-After), keeps the queue bounded so paid/enterprise stay fast.`
              : `Overloaded ${(inbound / CAPACITY).toFixed(2)}×: queue grows ${inbound - CAPACITY}/s → memory exhaustion → OOM kill → every queued request lost → fleet cascade.`}
        </span>
      </div>
    </div>
  );
}
