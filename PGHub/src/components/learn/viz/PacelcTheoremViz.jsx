import React, { useMemo, useState } from 'react';
import {
  Zap, ShieldCheck, Activity, Network, Gauge, Scale,
} from 'lucide-react';
import './PacelcTheoremViz.css';

// PACELC: if there is a network Partition (P), a distributed system must trade
// Availability (A) against Consistency (C); Else (E), in normal operation, it
// trades Latency (L) against Consistency (C). Every system therefore lands in
// one of four buckets — PA/EL, PA/EC, PC/EL, PC/EC — by its two independent
// choices. The reader toggles a real system (or tunes the two knobs by hand),
// flips the partition on and off, and sees which quadrant it occupies and what
// the user actually experiences right now.

// Each system is fixed by (partitionChoice, elseChoice).
//   partitionChoice: 'A' (stay available) | 'C' (stay consistent)
//   elseChoice:      'L' (favour latency) | 'C' (favour consistency)
const SYSTEMS = [
  { id: 'dynamo', name: 'Dynamo / Cassandra', p: 'A', e: 'L', note: 'Tuned for always-on writes and low latency; reads may be stale.' },
  { id: 'cosmos', name: 'Cosmos DB (default)', p: 'A', e: 'L', note: 'Session/eventual tiers favour availability and latency.' },
  { id: 'pnuts', name: 'Yahoo PNUTS', p: 'C', e: 'L', note: 'Stays consistent under partition, but optimizes latency when healthy.' },
  { id: 'mongo', name: 'MongoDB (majority)', p: 'C', e: 'C', note: 'A partitioned minority side refuses writes; majority reads are consistent.' },
  { id: 'spanner', name: 'Google Spanner', p: 'C', e: 'C', note: 'TrueTime keeps it strongly consistent, paying latency for it.' },
  { id: 'hbase', name: 'HBase / BigTable', p: 'C', e: 'C', note: 'CP store: a region without quorum becomes unavailable.' },
  { id: 'riak', name: 'Riak (eventual)', p: 'A', e: 'L', note: 'Sloppy quorums + read repair keep it available and fast.' },
];

// Quadrant key from the two choices.
function quadrant(p, e) {
  return `P${p}/E${e}`;
}

const QUAD_META = {
  'PA/EL': { title: 'PA/EL', blurb: 'Available under partition, latency-first when healthy. The classic AP store.' },
  'PA/EC': { title: 'PA/EC', blurb: 'Available under partition, but consistent when healthy — an unusual mix.' },
  'PC/EL': { title: 'PC/EL', blurb: 'Consistent under partition, latency-first when healthy. PNUTS-style.' },
  'PC/EC': { title: 'PC/EC', blurb: 'Consistent always — pays availability under partition and latency when healthy. The classic CP store.' },
};

export default function PacelcTheoremViz() {
  const [sysId, setSysId] = useState('dynamo');
  const [partitionChoice, setPartitionChoice] = useState('A');
  const [elseChoice, setElseChoice] = useState('L');
  const [partitioned, setPartitioned] = useState(false);
  const [custom, setCustom] = useState(false);

  const active = useMemo(() => SYSTEMS.find((s) => s.id === sysId) || SYSTEMS[0], [sysId]);
  const p = custom ? partitionChoice : active.p;
  const e = custom ? elseChoice : active.e;
  const quad = quadrant(p, e);

  const selectSystem = (id) => {
    const s = SYSTEMS.find((x) => x.id === id);
    if (!s) return;
    setCustom(false);
    setSysId(id);
    setPartitionChoice(s.p);
    setElseChoice(s.e);
  };

  const setKnobP = (choice) => { setCustom(true); setPartitionChoice(choice); };
  const setKnobE = (choice) => { setCustom(true); setElseChoice(choice); };

  // Which axis is live right now depends on the partition toggle.
  const liveAxis = partitioned ? 'P' : 'E';
  const liveChoice = partitioned ? p : e;

  // What the user experiences right now.
  const experience = partitioned
    ? (p === 'A'
      ? { label: 'available, possibly stale', tone: 'avail', detail: 'A partition is active. This system keeps serving reads and writes on both sides, so it stays up — but the two sides can disagree until the link heals.' }
      : { label: 'consistent, possibly unavailable', tone: 'cons', detail: 'A partition is active. This system refuses to diverge, so the minority side stops accepting writes (errors or timeouts) until the partition heals. No stale data, but reduced availability.' })
    : (e === 'L'
      ? { label: 'low latency, possibly stale', tone: 'avail', detail: 'No partition. This system answers from the nearest replica without waiting for a global quorum, so responses are fast — at the price of occasionally serving slightly stale reads.' }
      : { label: 'strongly consistent, higher latency', tone: 'cons', detail: 'No partition. This system coordinates a quorum (or a global clock) on every operation, so every read reflects the latest write — but each request pays extra round-trip latency for that guarantee.' });

  // SVG 2x2 grid geometry.
  const W = 640;
  const H = 460;
  const gx = 120;
  const gy = 70;
  const cell = 180;
  // columns: left = E choice L (latency), right = E choice C (consistency)
  // rows:    top  = P choice A (available), bottom = P choice C (consistent)
  const colOf = (eChoice) => (eChoice === 'L' ? 0 : 1);
  const rowOf = (pChoice) => (pChoice === 'A' ? 0 : 1);
  const cellX = (eChoice) => gx + colOf(eChoice) * cell;
  const cellY = (pChoice) => gy + rowOf(pChoice) * cell;

  const cells = [
    { p: 'A', e: 'L' },
    { p: 'A', e: 'C' },
    { p: 'C', e: 'L' },
    { p: 'C', e: 'C' },
  ];

  // systems plotted in each cell for context.
  const systemsInCell = (pc, ec) => SYSTEMS.filter((s) => s.p === pc && s.e === ec);

  return (
    <div className="ptv">
      <div className="ptv-head">
        <h3 className="ptv-title">PACELC — two tradeoffs, one quadrant</h3>
        <p className="ptv-sub">
          If a Partition happens, a system trades Availability against Consistency; Else, in normal
          operation, it trades Latency against Consistency. Pick a system or tune the two knobs, flip
          the partition on and off, and see where it lands and what a user feels.
        </p>
      </div>

      <div className="ptv-controls">
        <label className="ptv-select-wrap">
          <span className="ptv-input-label">system</span>
          <select
            className="ptv-select"
            value={custom ? 'custom' : sysId}
            onChange={(ev) => {
              if (ev.target.value === 'custom') { setCustom(true); return; }
              selectSystem(ev.target.value);
            }}
            aria-label="Pick a system"
          >
            {SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>{`${s.name} (${quadrant(s.p, s.e)})`}</option>
            ))}
            <option value="custom">custom — tune the knobs</option>
          </select>
        </label>

        <button
          type="button"
          className={`ptv-toggle ${partitioned ? 'is-danger' : ''}`}
          onClick={() => setPartitioned((v) => !v)}
          aria-pressed={partitioned}
          title="Toggle a network partition"
        >
          <Network size={14} />
          partition {partitioned ? 'ON' : 'off'}
        </button>

        <div className="ptv-knobs">
          <div className="ptv-knob">
            <span className="ptv-knob-label"><Network size={11} /> if partition (P)</span>
            <div className="ptv-knob-row">
              <button type="button" className={`ptv-knob-btn ${p === 'A' ? 'is-on is-avail' : ''}`} onClick={() => setKnobP('A')} aria-pressed={p === 'A'}>
                <Activity size={12} /> Availability
              </button>
              <button type="button" className={`ptv-knob-btn ${p === 'C' ? 'is-on is-cons' : ''}`} onClick={() => setKnobP('C')} aria-pressed={p === 'C'}>
                <ShieldCheck size={12} /> Consistency
              </button>
            </div>
          </div>
          <div className="ptv-knob">
            <span className="ptv-knob-label"><Gauge size={11} /> else (E)</span>
            <div className="ptv-knob-row">
              <button type="button" className={`ptv-knob-btn ${e === 'L' ? 'is-on is-avail' : ''}`} onClick={() => setKnobE('L')} aria-pressed={e === 'L'}>
                <Zap size={12} /> Latency
              </button>
              <button type="button" className={`ptv-knob-btn ${e === 'C' ? 'is-on is-cons' : ''}`} onClick={() => setKnobE('C')} aria-pressed={e === 'C'}>
                <ShieldCheck size={12} /> Consistency
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ptv-body">
        <div className="ptv-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="ptv-svg" preserveAspectRatio="xMidYMid meet">
            {/* axis titles */}
            <text className="ptv-axis-title" x={gx + cell} y={36} textAnchor="middle">ELSE (no partition): Latency vs Consistency</text>
            <text className="ptv-axis-side" x={40} y={gy + cell} textAnchor="middle" transform={`rotate(-90 40 ${gy + cell})`}>
              IF PARTITION: Availability vs Consistency
            </text>

            {/* column headers */}
            <text className="ptv-col-head is-avail" x={cellX('L') + cell / 2} y={gy - 8} textAnchor="middle">EL — favour Latency</text>
            <text className="ptv-col-head is-cons" x={cellX('C') + cell / 2} y={gy - 8} textAnchor="middle">EC — favour Consistency</text>
            {/* row headers */}
            <text className="ptv-row-head is-avail" x={gx - 12} y={cellY('A') + cell / 2 - 6} textAnchor="end">PA</text>
            <text className="ptv-row-head is-avail-sub" x={gx - 12} y={cellY('A') + cell / 2 + 10} textAnchor="end">Available</text>
            <text className="ptv-row-head is-cons" x={gx - 12} y={cellY('C') + cell / 2 - 6} textAnchor="end">PC</text>
            <text className="ptv-row-head is-cons-sub" x={gx - 12} y={cellY('C') + cell / 2 + 10} textAnchor="end">Consistent</text>

            {/* cells */}
            {cells.map((c) => {
              const x = cellX(c.e);
              const y = cellY(c.p);
              const isActiveCell = c.p === p && c.e === e;
              const qk = quadrant(c.p, c.e);
              const occupants = systemsInCell(c.p, c.e);
              return (
                <g key={qk}>
                  <rect
                    className={`ptv-cell ${isActiveCell ? 'is-active' : ''}`}
                    x={x}
                    y={y}
                    width={cell - 8}
                    height={cell - 8}
                    rx={10}
                  />
                  <text className={`ptv-cell-key ${isActiveCell ? 'is-active' : ''}`} x={x + 14} y={y + 26} textAnchor="start">{qk}</text>
                  {occupants.slice(0, 4).map((s, k) => (
                    <text
                      key={s.id}
                      className={`ptv-cell-sys ${isActiveCell && (custom || s.id === sysId) ? 'is-active' : ''}`}
                      x={x + 14}
                      y={y + 52 + k * 18}
                      textAnchor="start"
                    >
                      {`• ${s.name}`}
                    </text>
                  ))}
                  {isActiveCell && (
                    <g transform={`translate(${x + cell - 44}, ${y + 14})`}>
                      <Scale width={20} height={20} className="ptv-cell-pin" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* live-axis highlight ring on the active column or row */}
            {partitioned ? (
              <rect
                className="ptv-live-band is-row"
                x={gx - 6}
                y={cellY(p) - 6}
                width={cell * 2 + 4}
                height={cell + 4}
                rx={12}
              />
            ) : (
              <rect
                className="ptv-live-band is-col"
                x={cellX(e) - 6}
                y={gy - 6}
                width={cell + 4}
                height={cell * 2 + 4}
                rx={12}
              />
            )}
          </svg>
        </div>

        <div className="ptv-side">
          <div className="ptv-card">
            <div className="ptv-card-head">
              <Scale size={14} className="ptv-ic" />
              <span className="ptv-card-title">lands in</span>
              <span className="ptv-card-quad">{quad}</span>
            </div>
            <p className="ptv-card-blurb">{QUAD_META[quad].blurb}</p>
            {!custom && <p className="ptv-card-sysnote">{active.note}</p>}
          </div>

          <div className={`ptv-experience is-${experience.tone}`}>
            <div className="ptv-exp-head">
              <span className="ptv-exp-state">
                {partitioned ? <Network size={13} /> : <Gauge size={13} />}
                {partitioned ? 'partition active — P axis live' : 'healthy — E axis live'}
              </span>
              <span className={`ptv-exp-choice is-${experience.tone}`}>
                {liveAxis}{liveChoice}
              </span>
            </div>
            <div className="ptv-exp-label">
              {experience.tone === 'avail' ? <Zap size={14} className="ptv-ic is-avail" /> : <ShieldCheck size={14} className="ptv-ic is-cons" />}
              {experience.label}
            </div>
            <p className="ptv-exp-detail">{experience.detail}</p>
          </div>

          <div className="ptv-metrics">
            <div className="ptv-metric">
              <span className="ptv-metric-label">P-choice</span>
              <span className={`ptv-metric-value ${p === 'A' ? 'is-avail' : 'is-cons'}`}>{p === 'A' ? 'Available' : 'Consistent'}</span>
            </div>
            <div className="ptv-metric">
              <span className="ptv-metric-label">E-choice</span>
              <span className={`ptv-metric-value ${e === 'L' ? 'is-avail' : 'is-cons'}`}>{e === 'L' ? 'Latency' : 'Consistent'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ptv-legend">
        <span className="ptv-legend-item"><Network size={13} className="ptv-ic" /> P — behaviour during a network partition</span>
        <span className="ptv-legend-item"><Gauge size={13} className="ptv-ic" /> E — behaviour in normal (healthy) operation</span>
        <span className="ptv-legend-item"><Activity size={13} className="ptv-ic is-avail" /> A / L — stay up, answer fast</span>
        <span className="ptv-legend-item"><ShieldCheck size={13} className="ptv-ic is-cons" /> C — never serve stale data</span>
      </div>
    </div>
  );
}
