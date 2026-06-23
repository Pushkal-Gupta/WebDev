import React, { useMemo, useState } from 'react';
import { Database, Clock } from 'lucide-react';
import './TimeSeriesStorageViz.css';

const CHUNK_HOURS = 2;
const N_CHUNKS = 18; // 36h window of chunks, newest on the right
const RAW_POINTS_PER_CHUNK = 7200; // 1s resolution over 2h

// Retention tiers: recent = raw, then 1-min, then 1-hour aggregate, then dropped.
function tierForAge(ageHours) {
  if (ageHours <= 6) return { name: 'raw 1s', factor: 1, hue: 'var(--accent)' };
  if (ageHours <= 18) return { name: '1-min agg', factor: 60, hue: 'var(--hue-sky)' };
  if (ageHours <= 30) return { name: '1-hour agg', factor: 3600, hue: 'var(--hue-violet)' };
  return { name: 'dropped', factor: 0, hue: 'var(--text-dim)' };
}

export default function TimeSeriesStorageViz() {
  const [queryHours, setQueryHours] = useState(6);
  const [compress, setCompress] = useState(true);

  const chunks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < N_CHUNKS; i += 1) {
      // chunk 0 is oldest, chunk N-1 newest
      const ageHours = (N_CHUNKS - 1 - i) * CHUNK_HOURS;
      const tier = tierForAge(ageHours);
      const logicalPoints = tier.factor === 0 ? 0 : RAW_POINTS_PER_CHUNK / (tier.factor);
      arr.push({ i, ageHours, tier, logicalPoints });
    }
    return arr;
  }, []);

  // query window touches the newest ceil(queryHours/2) chunks
  const touched = Math.ceil(queryHours / CHUNK_HOURS);
  const W = 920;
  const H = 250;
  const padL = 24;
  const padR = 24;
  const padT = 56;
  const trackW = W - padL - padR;
  const gap = 5;
  const cw = (trackW - gap * (N_CHUNKS - 1)) / N_CHUNKS;
  const ch = 86;

  // bytes: raw point = 16B; compressed via gorilla ~ 1.4B ts + 1.4B val
  const rawBytes = (pts) => pts * 16;
  const compBytes = (pts) => pts * 2.8;
  const totalLogical = chunks.reduce((s, c) => s + c.logicalPoints, 0);
  const onDisk = compress ? compBytes(totalLogical) : rawBytes(totalLogical);
  const ratio = compress ? (rawBytes(totalLogical) / compBytes(totalLogical)) : 1;

  return (
    <div className="tsv">
      <div className="tsv-head">
        <h3 className="tsv-title"><Database size={18} className="tsv-ticon" /> Time-series storage — chunks, compression, downsampling</h3>
        <p className="tsv-sub">
          Data is split into immutable per-window chunks (newest on the right). A range query touches only the chunks it overlaps; old chunks are downsampled then dropped; columnar delta + XOR encoding shrinks each point to ~2 bytes.
        </p>
      </div>

      <div className="tsv-controls">
        <label className="tsv-slider">
          <span className="tsv-slider-label"><Clock size={13} /> query window</span>
          <input type="range" min={2} max={36} step={2} value={queryHours} onChange={(e) => setQueryHours(Number(e.target.value))} className="tsv-range" />
          <span className="tsv-slider-value">last {queryHours}h</span>
        </label>
        <div className="tsv-toggle">
          <button type="button" className={`tsv-tg ${compress ? 'tsv-tg-on' : ''}`} onClick={() => setCompress(true)}>compressed</button>
          <button type="button" className={`tsv-tg ${!compress ? 'tsv-tg-on' : ''}`} onClick={() => setCompress(false)}>raw rows</button>
        </div>
        <div className="tsv-touch">{touched} of {N_CHUNKS} chunks scanned</div>
      </div>

      <div className="tsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tsv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={padL} y={28} className="tsv-axis">older ←</text>
          <text x={W - padR} y={28} className="tsv-axis" style={{ textAnchor: 'end' }}>→ now (write-ahead log + memtable)</text>

          {chunks.map((c) => {
            const x = padL + c.i * (cw + gap);
            const inQuery = c.i >= N_CHUNKS - touched;
            const isWal = c.i === N_CHUNKS - 1;
            const dropped = c.tier.factor === 0;
            const fillH = dropped ? 0 : Math.max(8, (Math.log2(c.logicalPoints + 1) / Math.log2(RAW_POINTS_PER_CHUNK + 1)) * (ch - 24));
            return (
              <g key={c.i}>
                <rect x={x} y={padT} width={cw} height={ch} rx={4}
                  fill={inQuery ? 'rgba(var(--accent-rgb),0.12)' : 'var(--surface)'}
                  stroke={inQuery ? 'var(--accent)' : 'var(--border)'} strokeWidth={inQuery ? 2 : 1} />
                {!dropped && (
                  <rect x={x + 3} y={padT + ch - 12 - fillH} width={cw - 6} height={fillH} rx={2}
                    fill={c.tier.hue} opacity={inQuery ? 0.9 : 0.5} />
                )}
                {dropped && <text x={x + cw / 2} y={padT + ch / 2 + 4} className="tsv-drop" style={{ textAnchor: 'middle' }}>∅</text>}
                {isWal && <rect x={x} y={padT} width={cw} height={ch} rx={4} fill="none" stroke="var(--warning)" strokeWidth={2} strokeDasharray="4 3" />}
              </g>
            );
          })}

          {/* tier legend along bottom */}
          {[
            { name: 'raw 1s', hue: 'var(--accent)' },
            { name: '1-min', hue: 'var(--hue-sky)' },
            { name: '1-hour', hue: 'var(--hue-violet)' },
            { name: 'dropped', hue: 'var(--text-dim)' },
          ].map((t, idx) => (
            <g key={t.name} transform={`translate(${padL + idx * 130}, ${padT + ch + 26})`}>
              <rect x={0} y={-9} width={11} height={11} rx={2} fill={t.hue} opacity={0.8} />
              <text x={16} y={0} className="tsv-legend">{t.name}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="tsv-metrics">
        <div className="tsv-metric"><span className="tsv-metric-label">chunks scanned</span><span className="tsv-metric-value">{touched} / {N_CHUNKS}</span></div>
        <div className="tsv-metric"><span className="tsv-metric-label">on disk</span><span className="tsv-metric-value">{(onDisk / 1e6).toFixed(1)} MB</span></div>
        <div className="tsv-metric"><span className="tsv-metric-label">compression</span><span className="tsv-metric-value">{ratio.toFixed(1)}×</span></div>
        <div className="tsv-metric tsv-metric-dim"><span className="tsv-metric-label">retention</span><span className="tsv-metric-value tsv-metric-dimval">drop &gt; 30h</span></div>
      </div>

      <div className="tsv-trace">
        <span className="tsv-trace-label">why it beats a B-tree store</span>
        <span className="tsv-trace-val">
          {`A "last ${queryHours}h" query reads only ${touched} immutable chunk${touched === 1 ? '' : 's'} — no random-IO B-tree walk over billions of rows. `}
          {compress
            ? `Delta-of-delta timestamps (~1.4B) + XOR-encoded values (~1.4B) give ${ratio.toFixed(1)}× compression, so the whole ${(totalLogical / 1e6).toFixed(1)}M logical points fit in ${(onDisk / 1e6).toFixed(1)}MB.`
            : 'Stored as raw 16-byte rows it bloats; flip to compressed to see Gorilla-style columnar encoding shrink it.'}
          {' Retention drops chunks older than the cutoff in constant time — no per-row delete, no vacuum.'}
        </span>
      </div>
    </div>
  );
}
