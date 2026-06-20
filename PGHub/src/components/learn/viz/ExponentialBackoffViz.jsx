import React, { useMemo, useState } from 'react';
import { Zap, Users, Timer } from 'lucide-react';
import './ExponentialBackoffViz.css';

const MAX_ATTEMPTS = 6;

// Deterministic hash → [0,1). Seeded by client id + attempt so re-renders are stable.
function seededUnit(seed) {
  let h = seed | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}

// For each client, walk the retry schedule. Without jitter every client picks
// the same delay = min(cap, base*2^attempt) and lands on the same wall-clock
// tick → thundering herd. With jitter we pick a uniform delay in [0, computed].
function buildSchedule(base, cap, clients, jitter) {
  const rows = [];
  for (let c = 0; c < clients; c += 1) {
    let t = 0;
    const attempts = [];
    for (let a = 0; a < MAX_ATTEMPTS; a += 1) {
      const exp = Math.min(cap, base * 2 ** a);
      const delay = jitter ? Math.round(seededUnit(c * 131 + a * 17 + 1) * exp) : exp;
      t += delay;
      attempts.push({ attempt: a, exp, delay, fireAt: t });
    }
    rows.push({ client: c, attempts });
  }
  return rows;
}

// Count synchronized retries: any wall-clock bucket where ≥2 clients fire at once.
function countCollisions(rows) {
  const buckets = new Map();
  rows.forEach((r) => r.attempts.forEach((a) => {
    const key = a.fireAt;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }));
  let herd = 0;
  let worstBucket = 0;
  buckets.forEach((n) => {
    if (n >= 2) herd += n;
    if (n > worstBucket) worstBucket = n;
  });
  return { herd, worstBucket };
}

export default function ExponentialBackoffViz() {
  const [base, setBase] = useState(1);
  const [cap, setCap] = useState(16);
  const [clients, setClients] = useState(8);
  const [jitter, setJitter] = useState(false);

  const rows = useMemo(() => buildSchedule(base, cap, clients, jitter), [base, cap, clients, jitter]);
  const { herd, worstBucket } = useMemo(() => countCollisions(rows), [rows]);
  const tMax = useMemo(() => {
    let m = 1;
    rows.forEach((r) => r.attempts.forEach((a) => { if (a.fireAt > m) m = a.fireAt; }));
    return m;
  }, [rows]);

  const delaysOf0 = rows[0] ? rows[0].attempts.map((a) => a.delay) : [];

  // SVG geometry
  const W = 940;
  const laneTop = 56;
  const laneH = 26;
  const laneGap = 6;
  const left = 96;
  const right = W - 28;
  const span = right - left;
  const H = laneTop + clients * (laneH + laneGap) + 70;
  const xOf = (t) => left + (span * t) / tMax;

  // Collision buckets for the marker glow
  const bucketCount = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => r.attempts.forEach((a) => m.set(a.fireAt, (m.get(a.fireAt) || 0) + 1)));
    return m;
  }, [rows]);

  return (
    <div className="ebv">
      <div className="ebv-head">
        <h3 className="ebv-title">Exponential backoff with jitter — taming the thundering herd</h3>
        <p className="ebv-sub">
          Every client retries after min(cap, base·2^attempt). Without jitter they all wait the same amount
          and slam the server in synchronized spikes. Adding jitter randomizes each wait and spreads the load.
        </p>
      </div>

      <div className="ebv-controls">
        <label className="ebv-slider">
          <span className="ebv-input-label">base (s)</span>
          <input type="range" min={1} max={4} step={1} value={base}
            onChange={(e) => setBase(Number(e.target.value))} className="ebv-range" aria-label="Base delay" />
          <span className="ebv-slider-val">{base}</span>
        </label>
        <label className="ebv-slider">
          <span className="ebv-input-label">cap (s)</span>
          <input type="range" min={4} max={64} step={4} value={cap}
            onChange={(e) => setCap(Number(e.target.value))} className="ebv-range" aria-label="Cap delay" />
          <span className="ebv-slider-val">{cap}</span>
        </label>
        <label className="ebv-slider">
          <span className="ebv-input-label">clients</span>
          <input type="range" min={3} max={12} step={1} value={clients}
            onChange={(e) => setClients(Number(e.target.value))} className="ebv-range" aria-label="Client count" />
          <span className="ebv-slider-val">{clients}</span>
        </label>
        <span className="ebv-spacer" aria-hidden="true" />
        <button type="button" className={`ebv-toggle ${jitter ? 'is-on' : ''}`} onClick={() => setJitter((v) => !v)}>
          <Zap size={14} /> jitter {jitter ? 'on' : 'off'}
        </button>
      </div>

      <div className="ebv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ebv-svg" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label="Retry timeline across clients">
          <text x={left} y={32} className="ebv-axis-label">retry timeline (wall-clock seconds) →</text>
          <line x1={left} y1={laneTop - 12} x2={right} y2={laneTop - 12} className="ebv-axis" />
          {Array.from({ length: 9 }).map((_, i) => {
            const t = (tMax * i) / 8;
            return (
              <g key={`gt-${i}`}>
                <line x1={xOf(t)} y1={laneTop - 16} x2={xOf(t)} y2={H - 54} className="ebv-grid" />
                <text x={xOf(t)} y={laneTop - 20} className="ebv-tick" textAnchor="middle">{Math.round(t)}</text>
              </g>
            );
          })}

          {rows.map((r, ri) => {
            const y = laneTop + ri * (laneH + laneGap);
            return (
              <g key={`lane-${ri}`}>
                <rect x={left} y={y} width={span} height={laneH} rx={5} className="ebv-lane" />
                <text x={left - 10} y={y + laneH / 2 + 4} className="ebv-lane-label" textAnchor="end">c{ri}</text>
                {r.attempts.map((a) => {
                  const n = bucketCount.get(a.fireAt) || 1;
                  const herding = !jitter && n >= 2;
                  return (
                    <g key={`a-${ri}-${a.attempt}`}>
                      <circle cx={xOf(a.fireAt)} cy={y + laneH / 2} r={6}
                        className={`ebv-hit ${herding ? 'is-herd' : 'is-spread'}`} />
                      <text x={xOf(a.fireAt)} y={y + laneH / 2 + 3} className="ebv-hit-num" textAnchor="middle">
                        {a.attempt + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <text x={left} y={H - 30} className="ebv-foot">
            {jitter
              ? 'jitter on — each client samples a random wait in [0, base·2^attempt]; retries scatter across the timeline.'
              : 'jitter off — identical waits stack retries onto the same ticks (red = synchronized spike).'}
          </text>
        </svg>
      </div>

      <div className="ebv-metrics">
        <div className="ebv-metric">
          <span className="ebv-metric-label"><Timer size={11} /> delays · client 0</span>
          <span className="ebv-metric-value">{delaysOf0.join(', ')} s</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label">computed (no jitter)</span>
          <span className="ebv-metric-value">{rows[0] ? rows[0].attempts.map((a) => a.exp).join(', ') : ''} s</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label"><Users size={11} /> synchronized retries</span>
          <span className={`ebv-metric-value ${herd > 0 ? 'is-bad' : 'is-ok'}`}>{herd}</span>
        </div>
        <div className="ebv-metric">
          <span className="ebv-metric-label">worst single spike</span>
          <span className={`ebv-metric-value ${worstBucket >= 2 ? 'is-bad' : 'is-ok'}`}>{worstBucket} clients</span>
        </div>
      </div>

      <div className="ebv-narration">
        <span className="ebv-narration-label">trace</span>
        <span className="ebv-narration-body">
          {jitter
            ? `With jitter, ${clients} clients spread retries so the worst tick sees only ${worstBucket} client${worstBucket === 1 ? '' : 's'} — the server load smooths out.`
            : `Without jitter, ${herd} retries collide onto shared ticks; the worst spike hits the server with ${worstBucket} clients at once. Toggle jitter to break the herd.`}
        </span>
      </div>
    </div>
  );
}
