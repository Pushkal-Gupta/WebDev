import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Waves, Warehouse, Database, Table, FileJson, Image, ScrollText,
} from 'lucide-react';
import './DataLakeWarehouseViz.css';

// Each incoming data SHAPE either conforms to a fixed schema (structured) or not.
// schema-on-write (warehouse) REJECTS non-conforming shapes unless transformed.
const SHAPES = [
  { id: 'tabular', label: 'clean tabular row', structured: true, icon: Table, hue: 'var(--hue-mint)' },
  { id: 'json', label: 'raw JSON blob', structured: false, icon: FileJson, hue: 'var(--hue-violet)' },
  { id: 'image', label: 'image / binary', structured: false, icon: Image, hue: 'var(--hue-pink)' },
  { id: 'log', label: 'semi-structured log', structured: false, icon: ScrollText, hue: 'var(--hue-sky)' },
];

const TARGETS = [
  {
    id: 'lake',
    name: 'Data Lake',
    icon: 'Waves',
    schema: 'on-read',
    formats: 'any format',
    flexibility: 5,
    performance: 2,
  },
  {
    id: 'warehouse',
    name: 'Data Warehouse',
    icon: 'Warehouse',
    schema: 'on-write',
    formats: 'modeled tables',
    flexibility: 2,
    performance: 5,
  },
  {
    id: 'lakehouse',
    name: 'Lakehouse',
    icon: 'Database',
    schema: 'hybrid',
    formats: 'open + table layer',
    flexibility: 4,
    performance: 4,
  },
];

const shapeById = (id) => SHAPES.find((s) => s.id === id);

// warehouse accepts only structured shapes (schema-on-write gate).
function accepts(targetId, shape) {
  if (targetId === 'warehouse') return shape.structured;
  return true;
}

// Build the frame trace from a queue of routed items. Each item expands into:
// arrive -> evaluate at gate -> resolve in each target (land or reject).
function buildFrames(queue) {
  const frames = [];
  const held = { lake: [], warehouse: [], lakehouse: [] };
  let landed = 0;
  let rejected = 0;

  const snap = (extra) => ({
    held: {
      lake: held.lake.slice(),
      warehouse: held.warehouse.slice(),
      lakehouse: held.lakehouse.slice(),
    },
    landed,
    rejected,
    activeShape: null,
    phase: 'idle',
    resolved: {},
    rejectedAt: null,
    ...extra,
  });

  frames.push(snap({
    note: `Three storage targets stand ready. A data lake takes any byte stream and defers schema to read time; a warehouse demands data conform to a modeled schema before it lands; a lakehouse keeps raw files yet layers a table format on top for warehouse-grade queries.`,
  }));

  queue.forEach((shapeId, qi) => {
    const shape = shapeById(shapeId);

    frames.push(snap({
      activeShape: shapeId,
      phase: 'arrive',
      note: `Item #${qi + 1} arrives: a ${shape.label}. ${shape.structured
        ? 'It already matches a clean tabular schema.'
        : 'It carries no fixed schema — fields vary or the payload is opaque bytes.'}`,
    }));

    const resolved = {};
    const rejTargets = [];
    TARGETS.forEach((t) => {
      const ok = accepts(t.id, shape);
      resolved[t.id] = ok ? 'land' : 'reject';
      if (!ok) rejTargets.push(t.id);
    });

    frames.push(snap({
      activeShape: shapeId,
      phase: 'gate',
      resolved,
      rejectedAt: rejTargets.length ? 'warehouse' : null,
      note: shape.structured
        ? `The warehouse schema-on-write gate inspects the row, finds every column conforms, and waves it through — alongside the lake and lakehouse, which accept anything.`
        : `The warehouse schema-on-write gate inspects the payload and finds no matching table schema, so it REJECTS the item. The lake and lakehouse take it as-is.`,
    }));

    TARGETS.forEach((t) => {
      if (resolved[t.id] === 'land') held[t.id].push(shapeId);
    });
    landed += shape.structured ? 3 : 2;
    if (!shape.structured) rejected += 1;

    frames.push(snap({
      activeShape: shapeId,
      phase: 'settle',
      resolved,
      rejectedAt: shape.structured ? null : 'warehouse',
      note: shape.structured
        ? `The ${shape.label} settles into all three stores. Structured-from-source data is the one shape every architecture handles without friction.`
        : `The ${shape.label} settles into the lake and lakehouse. To reach the warehouse it must first be cleaned and conformed by an ETL job — schema-on-write is a wall, not a shrug.`,
    }));
  });

  frames.push(snap({
    activeShape: null,
    phase: 'done',
    note: `Done. The lake and lakehouse hold every item; the warehouse holds only the shapes that conformed to its schema. That is the core trade: schema-on-read buys flexibility, schema-on-write buys governed, fast analytics, and the lakehouse chases both.`,
  }));

  return frames;
}

const DEFAULT_QUEUE = ['tabular', 'json', 'log', 'image'];
const ICONS = { Waves, Warehouse, Database };

export default function DataLakeWarehouseViz() {
  const [queue, setQueue] = useState(DEFAULT_QUEUE);
  const [pick, setPick] = useState('json');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(queue), [queue]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const sendItem = () => {
    setIsRunning(false);
    setQueue((q) => [...q, pick]);
    setStep(totalSteps); // index of the first new arrive frame
  };

  const restart = () => {
    setIsRunning(false);
    setQueue(DEFAULT_QUEUE);
    setStep(0);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — incoming lane on the left, three storage targets across.
  const W = 940;
  const H = 380;
  const laneX = 30;
  const laneW = 150;
  const colGap = 20;
  const colsX = 210;
  const colsW = W - colsX - 20;
  const colW = (colsW - colGap * 2) / 3;
  const binTop = 120;
  const binH = 200;
  const binBottom = binTop + binH;

  const activeShape = current.activeShape ? shapeById(current.activeShape) : null;
  const phase = current.phase;

  // x for each target column
  const colX = (i) => colsX + i * (colW + colGap);

  // incoming item travels from lane toward the columns by phase.
  const flowX = phase === 'arrive'
    ? laneX + laneW + 10
    : phase === 'gate'
      ? colsX - 26
      : laneX + laneW / 2;
  const showFlow = activeShape && (phase === 'arrive' || phase === 'gate');

  return (
    <div className="dlw">
      <div className="dlw-head">
        <h3 className="dlw-title">Data lake vs warehouse vs lakehouse — where does each shape land?</h3>
        <p className="dlw-sub">
          Send a data item of any shape downstream. The lake and lakehouse swallow anything; the
          warehouse&apos;s schema-on-write gate rejects whatever does not fit a modeled table.
        </p>
      </div>

      <div className="dlw-controls">
        <div className="dlw-shapes" role="tablist" aria-label="Incoming data shape">
          {SHAPES.map((s) => {
            const Ico = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                className={`dlw-shape ${pick === s.id ? 'is-on' : ''}`}
                onClick={() => setPick(s.id)}
                aria-pressed={pick === s.id}
                style={{ '--shape-hue': s.hue }}
              >
                <Ico size={13} />
                {s.label}
              </button>
            );
          })}
        </div>

        <button type="button" className="dlw-btn dlw-btn-send" onClick={sendItem}>
          <ChevronRight size={14} /> Send item
        </button>

        <label className="dlw-speed">
          <span className="dlw-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dlw-speed-range"
            aria-label="Playback speed"
          />
          <span className="dlw-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dlw-spacer" aria-hidden="true" />

        <div className="dlw-group">
          <button
            type="button"
            className="dlw-btn dlw-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="dlw-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dlw-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dlw-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="dlw-btn" onClick={restart}>
            <RotateCcw size={13} /> Restart
          </button>
        </div>
        <div className="dlw-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dlw-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dlw-svg" preserveAspectRatio="xMidYMid meet">
          {/* incoming lane */}
          <text className="dlw-row-label" x={laneX} y={28}>incoming</text>
          <rect className="dlw-lane" x={laneX} y={40} width={laneW} height={H - 70} rx={8} />
          {activeShape ? (
            <g>
              <text
                className="dlw-lane-shape"
                x={laneX + laneW / 2}
                y={70}
                style={{ fill: activeShape.hue }}
              >
                {activeShape.label}
              </text>
              <text className="dlw-lane-sub" x={laneX + laneW / 2} y={90}>
                {activeShape.structured ? 'structured' : 'unstructured'}
              </text>
            </g>
          ) : (
            <text className="dlw-lane-sub" x={laneX + laneW / 2} y={H / 2}>idle</text>
          )}

          {/* flow chevron carrying the item toward the targets */}
          {showFlow && (
            <g className="dlw-flow" style={{ '--flow-hue': activeShape.hue }}>
              <circle cx={flowX} cy={binTop - 36} r={13} className="dlw-flow-dot" />
              <path
                className="dlw-flow-arrow"
                d={`M ${flowX - 5} ${binTop - 41} L ${flowX + 5} ${binTop - 36} L ${flowX - 5} ${binTop - 31} Z`}
              />
            </g>
          )}

          {/* three storage targets */}
          {TARGETS.map((t, i) => {
            const x = colX(i);
            const Ico = ICONS[t.icon];
            const items = current.held[t.id];
            const res = current.resolved[t.id];
            const isReject = res === 'reject';
            const isLand = res === 'land';
            // stacked items rise from the bin floor.
            const slotH = 16;
            const maxSlots = Math.floor((binH - 16) / slotH);
            const shown = items.slice(-maxSlots);
            return (
              <g key={t.id}>
                {/* header */}
                <g transform={`translate(${x + 10}, 60)`} className="dlw-target-icon">
                  <Ico size={16} />
                </g>
                <text className="dlw-target-name" x={x + 34} y={66}>{t.name}</text>
                <text className="dlw-target-schema" x={x + 10} y={84}>
                  schema {t.schema}
                </text>

                {/* gate marker for warehouse */}
                {t.id === 'warehouse' && (
                  <g>
                    <line
                      className={`dlw-gate ${isReject ? 'is-shut' : isLand ? 'is-open' : ''}`}
                      x1={x}
                      y1={binTop - 6}
                      x2={x + colW}
                      y2={binTop - 6}
                    />
                    <text className="dlw-gate-label" x={x + colW / 2} y={binTop - 11}>
                      schema gate
                    </text>
                  </g>
                )}

                {/* bin */}
                <rect
                  className={`dlw-bin ${isLand ? 'is-land' : ''} ${isReject ? 'is-reject' : ''}`}
                  x={x}
                  y={binTop}
                  width={colW}
                  height={binH}
                  rx={8}
                />

                {/* stacked landed items */}
                {shown.map((sid, k) => {
                  const sh = shapeById(sid);
                  const y = binBottom - 8 - (k + 1) * slotH;
                  return (
                    <rect
                      key={`${t.id}-it-${k}`}
                      className="dlw-item"
                      x={x + 8}
                      y={y}
                      width={colW - 16}
                      height={slotH - 4}
                      rx={3}
                      style={{ fill: sh.hue }}
                    />
                  );
                })}

                {/* reject marker */}
                {isReject && (
                  <g>
                    <line
                      className="dlw-reject-x"
                      x1={x + colW / 2 - 12}
                      y1={binTop + binH / 2 - 18}
                      x2={x + colW / 2 + 12}
                      y2={binTop + binH / 2 + 6}
                    />
                    <line
                      className="dlw-reject-x"
                      x1={x + colW / 2 + 12}
                      y1={binTop + binH / 2 - 18}
                      x2={x + colW / 2 - 12}
                      y2={binTop + binH / 2 + 6}
                    />
                    <text className="dlw-reject-label" x={x + colW / 2} y={binTop + binH / 2 + 28}>
                      rejected at
                    </text>
                    <text className="dlw-reject-label" x={x + colW / 2} y={binTop + binH / 2 + 42}>
                      schema gate
                    </text>
                  </g>
                )}

                {/* count + flex/perf bars under the bin */}
                <text className="dlw-count" x={x + 10} y={binBottom + 22}>
                  {items.length} item{items.length === 1 ? '' : 's'}
                </text>
                <text className="dlw-bar-label" x={x + 10} y={binBottom + 40}>flex</text>
                <rect className="dlw-bar-bg" x={x + 44} y={binBottom + 32} width={colW - 54} height={8} rx={4} />
                <rect
                  className="dlw-bar dlw-bar-flex"
                  x={x + 44}
                  y={binBottom + 32}
                  width={((colW - 54) * t.flexibility) / 5}
                  height={8}
                  rx={4}
                />
                <text className="dlw-bar-label" x={x + 10} y={binBottom + 54}>perf</text>
                <rect className="dlw-bar-bg" x={x + 44} y={binBottom + 46} width={colW - 54} height={8} rx={4} />
                <rect
                  className="dlw-bar dlw-bar-perf"
                  x={x + 44}
                  y={binBottom + 46}
                  width={((colW - 54) * t.performance) / 5}
                  height={8}
                  rx={4}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dlw-readout">
        {TARGETS.map((t) => (
          <div key={t.id} className="dlw-card">
            <div className="dlw-card-head">
              {React.createElement(ICONS[t.icon], { size: 15 })}
              <span className="dlw-card-name">{t.name}</span>
            </div>
            <div className="dlw-card-row">
              <span className="dlw-card-key">schema</span>
              <span className="dlw-card-val">{t.schema}</span>
            </div>
            <div className="dlw-card-row">
              <span className="dlw-card-key">formats</span>
              <span className="dlw-card-val">{t.formats}</span>
            </div>
            <div className="dlw-card-row">
              <span className="dlw-card-key">flexibility</span>
              <span className="dlw-card-val">{t.flexibility >= 4 ? 'high' : t.flexibility >= 3 ? 'mixed' : 'low'}</span>
            </div>
            <div className="dlw-card-row">
              <span className="dlw-card-key">query perf</span>
              <span className="dlw-card-val">{t.performance >= 4 ? 'high' : t.performance >= 3 ? 'mixed' : 'low'}</span>
            </div>
            <div className="dlw-card-row">
              <span className="dlw-card-key">holds</span>
              <span className="dlw-card-val is-count">{current.held[t.id].length}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dlw-metrics">
        <div className="dlw-metric">
          <span className="dlw-metric-label">phase</span>
          <span className="dlw-metric-value">{phase}</span>
        </div>
        <div className="dlw-metric">
          <span className="dlw-metric-label">incoming</span>
          <span className="dlw-metric-value">{activeShape ? activeShape.label : '—'}</span>
        </div>
        <div className="dlw-metric">
          <span className="dlw-metric-label">total landed</span>
          <span className="dlw-metric-value is-land">{current.landed}</span>
        </div>
        <div className="dlw-metric">
          <span className="dlw-metric-label">warehouse rejects</span>
          <span className="dlw-metric-value is-reject">{current.rejected}</span>
        </div>
        <div className="dlw-metric">
          <span className="dlw-metric-label">queued</span>
          <span className="dlw-metric-value">{queue.length}</span>
        </div>
      </div>

      <div className="dlw-narration">
        <span className="dlw-narration-label">trace</span>
        <span className="dlw-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
