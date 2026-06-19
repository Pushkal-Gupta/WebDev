import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database, ScrollText, Plug, Radio, Inbox } from 'lucide-react';
import './CdcDebeziumViz.css';

const TABLE = 'orders';
const INIT_ROWS = [
  { id: 1, name: 'apples', qty: 12 },
  { id: 2, name: 'bread', qty: 3 },
  { id: 3, name: 'milk', qty: 8 },
];

// Predefined operation queue. Each expands into 4 stage-frames flowing left->right.
const INIT_OPS = [
  { op: 'c', id: 4, name: 'eggs', qty: 6 },
  { op: 'u', id: 2, field: 'qty', value: 9 },
  { op: 'd', id: 1 },
];

const OP_LABEL = { c: 'INSERT', u: 'UPDATE', d: 'DELETE' };
const STAGES = ['log', 'connector', 'topic', 'consumer'];

function rowStr(row) {
  if (!row) return 'null';
  return `{id:${row.id}, name:${row.name}, qty:${row.qty}}`;
}

// Apply an op to the working row table, returning before/after images of the row.
function applyOp(rows, op) {
  if (op.op === 'c') {
    const after = { id: op.id, name: op.name, qty: op.qty };
    return { rows: [...rows, after], before: null, after, key: op.id };
  }
  if (op.op === 'u') {
    let before = null;
    let after = null;
    const next = rows.map((r) => {
      if (r.id !== op.id) return r;
      before = { ...r };
      after = { ...r, [op.field]: op.value };
      return after;
    });
    return { rows: next, before, after, key: op.id };
  }
  // delete
  const before = rows.find((r) => r.id === op.id) || null;
  return { rows: rows.filter((r) => r.id !== op.id), before, after: null, key: op.id };
}

// Build the full stage-frame trace from a queue of ops applied in order.
function buildFrames(initialRows, ops) {
  const frames = [];
  let rows = initialRows.map((r) => ({ ...r }));
  let lsn = 1000;
  let produced = 0;
  let consumed = 0;
  const log = []; // append-only WAL entries
  const topic = []; // ordered change events in the partition

  const snap = (extra) => ({
    rows: rows.map((r) => ({ ...r })),
    log: log.slice(),
    topic: topic.slice(),
    produced,
    consumed,
    stage: null,
    event: null,
    ...extra,
  });

  frames.push(snap({
    note: `Source table "${TABLE}" holds ${rows.length} rows. Debezium tails the write-ahead log: every committed row change becomes an ordered change event, streamed through the connector into a topic, then applied downstream.`,
  }));

  ops.forEach((opSpec, oi) => {
    lsn += 7;
    const res = applyOp(rows, opSpec);
    const event = {
      op: opSpec.op,
      table: TABLE,
      before: res.before,
      after: res.after,
      lsn,
      key: res.key,
    };

    // stage 1: captured in WAL (row table mutates at commit time)
    rows = res.rows;
    log.push(event);
    frames.push(snap({
      stage: 'log',
      event,
      active: oi,
      note: `${OP_LABEL[opSpec.op]} on ${TABLE} commits at LSN ${lsn}. The change lands in the write-ahead log: before=${rowStr(res.before)}, after=${rowStr(res.after)}.`,
    }));

    // stage 2: connector reads the log entry
    frames.push(snap({
      stage: 'connector',
      event,
      active: oi,
      note: `Debezium reads LSN ${lsn} from the log, decodes it, and shapes the op-${opSpec.op} change event (key = ${res.key}). No polling of the table — it follows the log offset.`,
    }));

    // stage 3: written to topic
    topic.push(event);
    produced += 1;
    frames.push(snap({
      stage: 'topic',
      event,
      active: oi,
      note: `Event #${produced} is produced to the topic partition, ordered by LSN. Same-key events keep their relative order, so consumers replay the row's history exactly.`,
    }));

    // stage 4: applied by consumer
    consumed += 1;
    frames.push(snap({
      stage: 'consumer',
      event,
      active: oi,
      note: `Consumers apply event #${consumed}: the search index upserts (or removes on delete) row ${res.key}, and the cache invalidates that key. ${produced - consumed === 0 ? 'Fully caught up.' : `Lag = ${produced - consumed}.`}`,
    }));
  });

  frames.push(snap({
    note: `Done. ${produced} change event(s) produced, ${consumed} consumed — table state and downstream consumers are consistent. The log is the single source of truth; replaying it from any offset rebuilds every consumer.`,
  }));

  return frames;
}

const STAGE_ICON = { log: ScrollText, connector: Plug, topic: Radio, consumer: Inbox };

export default function CdcDebeziumViz() {
  const [ops] = useState(INIT_OPS);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(INIT_ROWS, ops), [ops]);
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

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const ev = current.event;
  const stageIdx = current.stage ? STAGES.indexOf(current.stage) : -1;

  // SVG geometry — five-node pipeline left -> right.
  const W = 940;
  const H = 360;
  const nodeY = 70;
  const nodeH = 120;
  const xs = [40, 220, 410, 580, 770];
  const ws = [150, 150, 130, 150, 130];
  const cxOf = (i) => xs[i] + ws[i] / 2;
  const connY = nodeY + nodeH / 2;

  const stageColors = ['var(--hue-sky)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-mint)'];
  const opColor = (op) => (op === 'c' ? 'var(--easy)' : op === 'u' ? 'var(--warning)' : 'var(--hard)');

  return (
    <div className="cdv">
      <div className="cdv-head">
        <h3 className="cdv-title">Change data capture — Debezium log streaming</h3>
        <p className="cdv-sub">
          Step one row change through the pipeline: it commits to the write-ahead log, the connector decodes it,
          the topic orders it, and downstream consumers apply it — one stage per step.
        </p>
      </div>

      <div className="cdv-controls">
        <div className="cdv-pipeline-legend">
          {STAGES.map((s, i) => {
            const Icon = STAGE_ICON[s];
            return (
              <span key={s} className={`cdv-leg ${current.stage === s ? 'is-on' : ''}`} style={{ '--leg': stageColors[i] }}>
                <Icon size={13} /> {s}
              </span>
            );
          })}
        </div>

        <label className="cdv-slider">
          <span className="cdv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cdv-range" aria-label="Playback speed"
          />
          <span className="cdv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="cdv-spacer" aria-hidden="true" />

        <div className="cdv-buttons">
          <button
            type="button"
            className="cdv-btn cdv-btn-primary"
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
            className="cdv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cdv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cdv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cdv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cdv-svg" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto' }}>
          {/* connecting flow lines between nodes */}
          {[0, 1, 2, 3].map((i) => {
            const x1 = xs[i] + ws[i];
            const x2 = xs[i + 1];
            const active = stageIdx === i + 1 || (stageIdx === i && i < 3);
            return (
              <g key={`flow-${i}`}>
                <line className="cdv-flow" x1={x1} y1={connY} x2={x2} y2={connY} />
                <path className="cdv-flow-arrow" d={`M ${x2 - 10} ${connY - 5} L ${x2} ${connY} L ${x2 - 10} ${connY + 5}`} />
                {active && ev && (
                  <circle className="cdv-packet" cx={(x1 + x2) / 2} cy={connY} r={7} style={{ fill: opColor(ev.op) }} />
                )}
              </g>
            );
          })}

          {/* node 0: source DB with rows table */}
          <g>
            <rect className={`cdv-node ${current.stage === 'log' ? '' : ''}`} x={xs[0]} y={nodeY} width={ws[0]} height={nodeH} rx={9} />
            <text className="cdv-node-title" x={cxOf(0)} y={nodeY + 18}>SOURCE DB</text>
            {current.rows.slice(0, 4).map((r, ri) => (
              <text key={`row-${r.id}`} className="cdv-row" x={xs[0] + 10} y={nodeY + 40 + ri * 19}>
                {`${r.id}·${r.name.slice(0, 5)}·${r.qty}`}
              </text>
            ))}
            <text className="cdv-node-sub" x={cxOf(0)} y={nodeY + nodeH - 8}>{TABLE}</text>
          </g>

          {/* node 1: WAL / log */}
          <g>
            <rect className={`cdv-node ${current.stage === 'log' ? 'is-active' : ''}`} x={xs[1]} y={nodeY} width={ws[1]} height={nodeH} rx={9} />
            <text className="cdv-node-title" x={cxOf(1)} y={nodeY + 18}>WAL LOG</text>
            {current.log.slice(-4).map((e, li) => (
              <text
                key={`log-${e.lsn}`}
                className={`cdv-logentry ${ev && e.lsn === ev.lsn && current.stage === 'log' ? 'is-new' : ''}`}
                x={xs[1] + 10}
                y={nodeY + 40 + li * 19}
                style={{ fill: opColor(e.op) }}
              >
                {`#${e.lsn} ${e.op}:${e.key}`}
              </text>
            ))}
            <text className="cdv-node-sub" x={cxOf(1)} y={nodeY + nodeH - 8}>append-only</text>
          </g>

          {/* node 2: connector */}
          <g>
            <rect className={`cdv-node ${current.stage === 'connector' ? 'is-active' : ''}`} x={xs[2]} y={nodeY} width={ws[2]} height={nodeH} rx={9} />
            <text className="cdv-node-title" x={cxOf(2)} y={nodeY + 18}>CONNECTOR</text>
            <text className="cdv-node-glyph" x={cxOf(2)} y={nodeY + 66}>Debezium</text>
            {current.stage === 'connector' && ev && (
              <text className="cdv-node-read" x={cxOf(2)} y={nodeY + 88} style={{ fill: opColor(ev.op) }}>
                read LSN {ev.lsn}
              </text>
            )}
            <text className="cdv-node-sub" x={cxOf(2)} y={nodeY + nodeH - 8}>log tail</text>
          </g>

          {/* node 3: topic partition */}
          <g>
            <rect className={`cdv-node ${current.stage === 'topic' ? 'is-active' : ''}`} x={xs[3]} y={nodeY} width={ws[3]} height={nodeH} rx={9} />
            <text className="cdv-node-title" x={cxOf(3)} y={nodeY + 18}>TOPIC</text>
            {current.topic.slice(-4).map((e, ti) => (
              <text
                key={`topic-${e.lsn}`}
                className={`cdv-msg ${ev && e.lsn === ev.lsn && current.stage === 'topic' ? 'is-new' : ''}`}
                x={xs[3] + 10}
                y={nodeY + 40 + ti * 19}
                style={{ fill: opColor(e.op) }}
              >
                {`[${e.op}] key=${e.key}`}
              </text>
            ))}
            <text className="cdv-node-sub" x={cxOf(3)} y={nodeY + nodeH - 8}>ordered partition</text>
          </g>

          {/* node 4: consumers */}
          <g>
            <rect className={`cdv-node ${current.stage === 'consumer' ? 'is-active' : ''}`} x={xs[4]} y={nodeY} width={ws[4]} height={nodeH} rx={9} />
            <text className="cdv-node-title" x={cxOf(4)} y={nodeY + 18}>CONSUMERS</text>
            <text className={`cdv-consumer ${current.stage === 'consumer' ? 'is-on' : ''}`} x={cxOf(4)} y={nodeY + 50}>search index</text>
            <text className={`cdv-consumer ${current.stage === 'consumer' ? 'is-on' : ''}`} x={cxOf(4)} y={nodeY + 74}>cache</text>
            <text className="cdv-node-sub" x={cxOf(4)} y={nodeY + nodeH - 8}>apply / invalidate</text>
          </g>

          {/* stage banner */}
          {current.stage && (
            <text className="cdv-banner" x={W / 2} y={nodeY + nodeH + 44} style={{ fill: stageColors[stageIdx] }}>
              {OP_LABEL[ev.op]} · stage {stageIdx + 1}/4 · {current.stage}
            </text>
          )}
        </svg>
      </div>

      {/* live change-event payload readout */}
      <div className="cdv-payload">
        <span className="cdv-payload-label">change event</span>
        {ev ? (
          <div className="cdv-payload-grid">
            <div className="cdv-pl-cell">
              <span className="cdv-pl-key">op</span>
              <span className="cdv-pl-val" style={{ color: opColor(ev.op) }}>{ev.op} · {OP_LABEL[ev.op]}</span>
            </div>
            <div className="cdv-pl-cell">
              <span className="cdv-pl-key">table</span>
              <span className="cdv-pl-val">{ev.table}</span>
            </div>
            <div className="cdv-pl-cell">
              <span className="cdv-pl-key">lsn / offset</span>
              <span className="cdv-pl-val">{ev.lsn}</span>
            </div>
            <div className="cdv-pl-cell cdv-pl-wide">
              <span className="cdv-pl-key">before</span>
              <span className="cdv-pl-val cdv-pl-img">{rowStr(ev.before)}</span>
            </div>
            <div className="cdv-pl-cell cdv-pl-wide">
              <span className="cdv-pl-key">after</span>
              <span className="cdv-pl-val cdv-pl-img">{rowStr(ev.after)}</span>
            </div>
          </div>
        ) : (
          <span className="cdv-payload-empty">No event in flight — start playback to stream a row change through the pipeline.</span>
        )}
      </div>

      <div className="cdv-metrics">
        <div className="cdv-metric">
          <span className="cdv-metric-label">table rows</span>
          <span className="cdv-metric-value"><Database size={12} /> {current.rows.length}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">log entries</span>
          <span className="cdv-metric-value">{current.log.length}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">stage</span>
          <span className="cdv-metric-value">{current.stage || '—'}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">produced</span>
          <span className="cdv-metric-value is-prod">{current.produced}</span>
        </div>
        <div className="cdv-metric">
          <span className="cdv-metric-label">consumed</span>
          <span className="cdv-metric-value is-cons">{current.consumed}</span>
        </div>
      </div>

      <div className="cdv-narration">
        <span className="cdv-narration-label">trace</span>
        <span className="cdv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
