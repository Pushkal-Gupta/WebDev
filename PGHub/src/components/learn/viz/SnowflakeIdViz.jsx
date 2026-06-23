import React, { useMemo, useState } from 'react';
import { Snowflake, Clock, Server, Hash, RotateCcw, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import './SnowflakeIdViz.css';

// Twitter Snowflake — a 64-bit ID packed as:
//   1 unused sign bit | 41-bit timestamp (ms since a custom epoch)
//   | 10-bit machine/worker id | 12-bit per-ms sequence.
// Timestamp in the high bits makes IDs roughly time-sortable (k-sortable);
// the 12-bit sequence lets one worker mint 4096 unique IDs per millisecond;
// the 10-bit worker id keeps 1024 machines from colliding without coordination.

const SEQ_BITS = 12;
const WORKER_BITS = 10;
const TIME_BITS = 41;
const MAX_SEQ = (1 << SEQ_BITS) - 1; // 4095 -> 4096 capacity

// Custom epoch (Twitter used 2010-11-04). Fixed constant — deterministic.
const EPOCH = 1288834974657;

// Deterministic starting offset so the timestamp segment is a stable number.
const START_OFFSET = 41_500_000;

const WORKERS = [0, 1, 7, 42, 511, 1023];

const seg = (color, label) => ({ color, label });
const FIELDS = {
  time: seg('var(--hue-sky)', 'timestamp'),
  worker: seg('var(--hue-violet)', 'worker'),
  seq: seg('var(--hue-mint)', 'sequence'),
};

export default function SnowflakeIdViz() {
  const [tsOffset, setTsOffset] = useState(START_OFFSET);
  const [worker, setWorker] = useState(7);
  const [seq, setSeq] = useState(0);

  const model = useMemo(() => {
    const ts = tsOffset; // ms since custom epoch
    // Assemble using BigInt so the full 64-bit shape is exact.
    const id =
      (BigInt(ts) << BigInt(WORKER_BITS + SEQ_BITS)) |
      (BigInt(worker) << BigInt(SEQ_BITS)) |
      BigInt(seq);
    const wallClock = EPOCH + ts;
    return { ts, id, wallClock };
  }, [tsOffset, worker, seq]);

  const reset = () => {
    setTsOffset(START_OFFSET);
    setWorker(7);
    setSeq(0);
  };

  // Advance the clock one ms — resets the per-ms sequence to 0.
  const tick = () => {
    setTsOffset((t) => t + 1);
    setSeq(0);
  };

  // Mint another ID in the SAME ms — sequence increments, rolls into next ms at 4096.
  const mint = () => {
    setSeq((s) => {
      if (s >= MAX_SEQ) {
        setTsOffset((t) => t + 1);
        return 0;
      }
      return s + 1;
    });
  };

  const stepWorker = (dir) => {
    const idx = WORKERS.indexOf(worker);
    const base = idx === -1 ? 0 : idx;
    setWorker(WORKERS[(base + dir + WORKERS.length) % WORKERS.length]);
  };

  // SVG geometry — single horizontal bit-field bar (a bit layout, not a flow).
  const W = 940;
  const H = 360;
  const barX = 24;
  const barY = 64;
  const barW = W - 48;
  const barH = 92;

  // Proportional widths per field across the 63 meaningful bits (sign bit shown thin).
  const totalBits = 1 + TIME_BITS + WORKER_BITS + SEQ_BITS; // 64
  const unit = barW / totalBits;
  const signW = unit * 1;
  const timeW = unit * TIME_BITS;
  const workerW = unit * WORKER_BITS;
  const seqW = unit * SEQ_BITS;

  const signX = barX;
  const timeX = signX + signW;
  const workerX = timeX + timeW;
  const seqX = workerX + workerW;

  const capacityPct = ((seq + 1) / (MAX_SEQ + 1)) * 100;

  const field = (x, w, fld, valueLabel, bits) => (
    <g>
      <rect
        className="sfv-field"
        x={x}
        y={barY}
        width={w}
        height={barH}
        rx={8}
        style={{ stroke: fld.color }}
      />
      <rect x={x} y={barY} width={w} height={6} rx={3} fill={fld.color} />
      <text className="sfv-field-name" x={x + w / 2} y={barY + 30} style={{ fill: fld.color }}>
        {fld.label}
      </text>
      <text className="sfv-field-bits" x={x + w / 2} y={barY + 50}>
        {bits} bits
      </text>
      <text className="sfv-field-val" x={x + w / 2} y={barY + 76} style={{ fill: fld.color }}>
        {valueLabel}
      </text>
    </g>
  );

  return (
    <div className="sfv">
      <div className="sfv-head">
        <h3 className="sfv-title">Snowflake IDs — 64 bits of time, machine, and sequence</h3>
        <p className="sfv-sub">
          One signed 64-bit integer holds a 41-bit timestamp, a 10-bit worker id, and a 12-bit per-millisecond
          counter. Time in the high bits keeps freshly minted IDs roughly sorted.
        </p>
      </div>

      <div className="sfv-controls">
        <button type="button" className="sfv-btn sfv-btn-primary" onClick={mint}>
          <Plus size={14} /> Mint ID (same ms)
        </button>
        <button type="button" className="sfv-btn" onClick={tick}>
          <Clock size={14} /> Advance 1 ms
        </button>

        <span className="sfv-worker">
          <span className="sfv-input-label">worker</span>
          {WORKERS.map((wk) => (
            <button
              key={wk}
              type="button"
              className={`sfv-chip ${worker === wk ? 'is-active' : ''}`}
              onClick={() => setWorker(wk)}
            >
              {wk}
            </button>
          ))}
          <span className="sfv-stepper">
            <button type="button" className="sfv-step-btn" onClick={() => stepWorker(1)} aria-label="Next worker">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="sfv-step-btn" onClick={() => stepWorker(-1)} aria-label="Previous worker">
              <ChevronDown size={13} />
            </button>
          </span>
        </span>

        <span className="sfv-spacer" aria-hidden="true" />

        <button type="button" className="sfv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="sfv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sfv-svg" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${barX + 2}, 24)`}>
            <Snowflake width={16} height={16} className="sfv-ic" />
          </g>
          <text className="sfv-bar-title" x={barX + 26} y={37}>
            ID = {model.id.toString()}
          </text>
          <text className="sfv-bar-sub" x={barX + barW} y={37}>
            64-bit signed integer
          </text>

          {/* sign bit (unused, always 0) */}
          <rect className="sfv-sign" x={signX} y={barY} width={signW} height={barH} rx={5} />
          <text className="sfv-sign-label" x={signX + signW / 2} y={barY + barH / 2 + 4}>
            0
          </text>

          {field(timeX, timeW, FIELDS.time, model.ts.toLocaleString(), TIME_BITS)}
          {field(workerX, workerW, FIELDS.worker, String(worker), WORKER_BITS)}
          {field(seqX, seqW, FIELDS.seq, String(seq), SEQ_BITS)}

          {/* sign bit caption below */}
          <text className="sfv-axis" x={signX} y={barY + barH + 22}>
            sign bit (unused)
          </text>

          {/* per-ms sequence capacity meter */}
          <text className="sfv-meter-label" x={barX} y={barY + barH + 64}>
            per-ms sequence used
          </text>
          <rect className="sfv-meter-track" x={barX} y={barY + barH + 76} width={barW} height={18} rx={9} />
          <rect
            className="sfv-meter-fill"
            x={barX}
            y={barY + barH + 76}
            width={Math.max(4, (barW * capacityPct) / 100)}
            height={18}
            rx={9}
          />
          <text className="sfv-meter-val" x={barX + barW} y={barY + barH + 90}>
            {seq + 1} / {MAX_SEQ + 1}
          </text>
        </svg>
      </div>

      <div className="sfv-metrics">
        <div className="sfv-metric">
          <span className="sfv-metric-label">assembled ID</span>
          <span className="sfv-metric-value">{model.id.toString()}</span>
        </div>
        <div className="sfv-metric">
          <span className="sfv-metric-label">timestamp segment</span>
          <span className="sfv-metric-value is-time">{model.ts.toLocaleString()} ms</span>
        </div>
        <div className="sfv-metric">
          <span className="sfv-metric-label">worker id</span>
          <span className="sfv-metric-value is-worker">{worker} / 1023</span>
        </div>
        <div className="sfv-metric">
          <span className="sfv-metric-label">sequence</span>
          <span className="sfv-metric-value is-seq">{seq} / {MAX_SEQ}</span>
        </div>
        <div className="sfv-metric">
          <span className="sfv-metric-label">IDs / ms capacity</span>
          <span className="sfv-metric-value">{(MAX_SEQ + 1).toLocaleString()}</span>
        </div>
      </div>

      <div className="sfv-narration">
        <span className="sfv-narration-label">why it matters</span>
        <span className="sfv-narration-body">
          Because the timestamp occupies the most significant bits, comparing two IDs as plain integers
          orders them by mint time — they are k-sortable, so a database index on the ID column is also
          roughly a time index, no extra created_at needed. A single worker can stamp {MAX_SEQ + 1} IDs in
          one millisecond before it must wait for the clock to advance; with 1024 workers, that is millions
          per second with zero coordination between machines.
        </span>
      </div>
    </div>
  );
}
