import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Workflow, Play, Pause, SkipForward, RotateCcw, Gauge, AlertTriangle, Database } from 'lucide-react';
import './DataEtlPipelineViz.css';

// Vertical ETL pipeline, top -> bottom. A batch of records falls through each
// stage; with the poison toggle on, one record is diverted to a dead-letter
// path at TRANSFORM. Every value is fixed -- no randomness, fully deterministic.
const STAGES = [
  { key: 'source', name: 'Source', detail: 'orders DB / event stream', hue: 'is-source' },
  { key: 'extract', name: 'Extract', detail: 'rows since last watermark', hue: 'is-extract' },
  { key: 'transform', name: 'Transform', detail: 'clean · join · aggregate', hue: 'is-transform' },
  { key: 'load', name: 'Load', detail: 'idempotent MERGE / upsert', hue: 'is-load' },
  { key: 'warehouse', name: 'Warehouse', detail: 'fact + dimension tables', hue: 'is-warehouse' },
];

const BATCH = 5;            // records entering the pipeline
const TRANSFORM_IDX = 2;    // where a poison row is quarantined

function buildSteps(poison) {
  return STAGES.map((st, idx) => {
    const diverted = poison && idx >= TRANSFORM_IDX ? 1 : 0;
    const healthy = BATCH - diverted;
    let action;
    if (st.key === 'source') {
      action = `Batch of ${BATCH} records waits at the source system.`;
    } else if (st.key === 'extract') {
      action = 'Incremental extract pulls only rows changed since the high-water mark.';
    } else if (st.key === 'transform') {
      action = poison
        ? 'A malformed record fails validation and is routed to the dead-letter queue; the healthy rows continue.'
        : 'Records are cleaned, joined, and aggregated; all pass validation.';
    } else if (st.key === 'load') {
      action = 'Rows are upserted with MERGE on a stable key, so replays converge (no duplicates).';
    } else {
      action = `${healthy} clean records land in the warehouse${diverted ? `; ${diverted} quarantined in the dead-letter queue` : ''}.`;
    }
    return { idx, healthy, diverted, action };
  });
}

// Geometry -- a single centered vertical column with a dead-letter gutter node.
const W = 400;
const H = 470;
const ROW_X = 96;
const ROW_W = 210;
const ROW_H = 46;
const PITCH = 88;
const ROW_TOP = 16;
const TRUNK_X = 56;
const DLQ_X = 322;
const DLQ_W = 68;
const DLQ_H = 52;

const rowTop = (i) => ROW_TOP + i * PITCH;
const rowMid = (i) => rowTop(i) + ROW_H / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DataEtlPipelineViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [poison, setPoison] = useState(true);
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(poison), [poison]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const curStage = STAGES[cur.idx];
  const dlqTop = rowMid(TRANSFORM_IDX) - DLQ_H / 2;

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function togglePoison() { setPoison((p) => !p); setStep(0); setPlaying(false); }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const batchY = rowMid(cur.idx);
  const dlqActive = poison && cur.idx >= TRANSFORM_IDX;

  return (
    <div className="detl">
      <div className="detl-head">
        <div className="detl-head-icon"><Workflow size={18} /></div>
        <div className="detl-head-text">
          <h3 className="detl-title">A batch falling through the pipeline</h3>
          <p className="detl-sub">
            Records flow top to bottom &mdash; extract, transform, load &mdash; into the warehouse.
            Turn the poison record on and watch one row peel off to the dead-letter queue while the
            healthy rows continue.
          </p>
        </div>
        <button type="button" className="detl-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="detl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="detl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="detl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="detl-arrow-head" />
            </marker>
            <marker id="detl-arrow-dlq" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="detl-arrow-head-dlq" />
            </marker>
            <filter id="detl-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line x1={TRUNK_X} y1={rowMid(0)} x2={TRUNK_X} y2={rowMid(STAGES.length - 1)} className="detl-trunk" />
          {STAGES.slice(0, -1).map((s, i) => (
            <line
              key={`arr-${s.key}`}
              x1={TRUNK_X} y1={rowMid(i) + 6}
              x2={TRUNK_X} y2={rowMid(i + 1) - 6}
              className="detl-trunk-seg"
              markerEnd="url(#detl-arrow)"
            />
          ))}

          {/* dead-letter branch off the transform stage */}
          <line
            x1={ROW_X + ROW_W} y1={rowMid(TRANSFORM_IDX)}
            x2={DLQ_X} y2={rowMid(TRANSFORM_IDX)}
            className={`detl-dlq-edge${dlqActive ? ' is-active' : ''}`}
            markerEnd="url(#detl-arrow-dlq)"
          />
          <g className={`detl-dlq${dlqActive ? ' is-active' : ''}`}>
            <rect x={DLQ_X} y={dlqTop} width={DLQ_W} height={DLQ_H} rx={9} className="detl-dlq-box" />
            <AlertTriangle x={DLQ_X + DLQ_W / 2 - 8} y={dlqTop + 8} width={16} height={16} className="detl-dlq-ic" />
            <text x={DLQ_X + DLQ_W / 2} y={dlqTop + 40} className="detl-dlq-label" textAnchor="middle">dead-letter</text>
          </g>

          {STAGES.map((s, i) => {
            const active = cur.idx === i;
            const done = cur.idx > i;
            return (
              <g key={s.key} className={`detl-row ${s.hue}${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
                <rect x={ROW_X} y={rowTop(i)} width={ROW_W} height={ROW_H} rx={10} className="detl-row-box" />
                {s.key === 'warehouse'
                  ? <Database x={ROW_X + 12} y={rowTop(i) + 14} width={16} height={16} className="detl-row-ic" />
                  : null}
                <text x={ROW_X + (s.key === 'warehouse' ? 36 : 14)} y={rowTop(i) + 20} className="detl-row-name">{s.name}</text>
                <text x={ROW_X + (s.key === 'warehouse' ? 36 : 14)} y={rowTop(i) + 36} className="detl-row-detail">{s.detail}</text>
              </g>
            );
          })}

          {/* the batch of records riding the trunk */}
          <g className="detl-batch" filter="url(#detl-glow)">
            {Array.from({ length: cur.healthy }).map((_, k) => (
              <circle key={k} cx={TRUNK_X - 16 + k * 8} cy={batchY} r={4.5} className="detl-chip" />
            ))}
          </g>
        </svg>
      </div>

      <div className="detl-controls">
        <button type="button" className="detl-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="detl-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`detl-btn detl-poison${poison ? ' is-on' : ''}`} onClick={togglePoison}>
          <AlertTriangle size={14} /> Poison {poison ? 'on' : 'off'}
        </button>
        <label className="detl-speed">
          <Gauge size={13} />
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="detl-speed-range" />
          <span className="detl-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="detl-progress">{safeStep} / {total}</span>
      </div>

      <div className="detl-readout">
        <div className="detl-stat is-stage">
          <span className="detl-stat-label">stage</span>
          <span className="detl-stat-val">{curStage.name}</span>
        </div>
        <div className="detl-stat is-healthy">
          <span className="detl-stat-label">healthy</span>
          <span className="detl-stat-val">{cur.healthy}</span>
        </div>
        <div className="detl-stat is-dead">
          <span className="detl-stat-label">dead-letter</span>
          <span className="detl-stat-val">{cur.diverted}</span>
        </div>
      </div>

      <div className="detl-note">
        <span className="detl-note-label">now</span>
        <span className="detl-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
