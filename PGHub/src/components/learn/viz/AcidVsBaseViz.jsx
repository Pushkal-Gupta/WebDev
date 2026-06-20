import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Database, Lock, Zap, ServerCrash, RefreshCw,
} from 'lucide-react';
import './AcidVsBaseViz.css';

const REPLICA_COUNT = 4;
const OLD = 'v1';
const NEW = 'v2';

// states per replica: 'old' (stale), 'new' (fresh), 'locked' (committing), 'down' (partitioned/unavailable)
function buildFrames(model, partitioned) {
  const frames = [];
  // replica index REPLICA_COUNT-1 is the one cut off by the partition.
  const cut = REPLICA_COUNT - 1;

  const make = (states, extra) => ({
    model,
    partitioned,
    states: [...states],
    writeAcked: false,
    reading: false,
    consistency: model === 'acid' ? 'strong' : 'eventual',
    note: '',
    ...extra,
  });

  const base = Array.from({ length: REPLICA_COUNT }, () => 'old');

  frames.push(make(base, {
    note: `${model === 'acid' ? 'ACID' : 'BASE'} cluster of ${REPLICA_COUNT} replicas, all holding ${OLD}.${partitioned ? ' A network partition has cut off the last replica.' : ''} A write of ${NEW} is about to arrive.`,
  }));

  if (partitioned) {
    const s = base.map((v, i) => (i === cut ? 'down' : v));
    frames.push(make(s, {
      note: model === 'acid'
        ? `Partition active. ACID favours consistency (CP): the cut-off replica can’t be reached, so a write that must reach all replicas will be refused or blocked rather than risk divergence.`
        : `Partition active. BASE favours availability (AP): the cut-off replica keeps serving its old value; the cluster never stops accepting reads or writes.`,
    }));
  }

  if (model === 'acid') {
    if (partitioned) {
      const s = base.map((v, i) => (i === cut ? 'down' : 'locked'));
      frames.push(make(s, {
        writeAcked: false,
        note: 'Write arrives. ACID tries to lock and synchronously replicate to every replica. One replica is unreachable, so the transaction cannot commit everywhere.',
      }));
      const blocked = base.map((v, i) => (i === cut ? 'down' : 'old'));
      frames.push(make(blocked, {
        writeAcked: false,
        note: 'ACID under partition: the write is REJECTED / blocked (no quorum across all replicas). Reads still return a single consistent value — but the system gave up availability to keep consistency.',
      }));
      const reads = blocked;
      frames.push(make(reads, {
        reading: true,
        note: 'Concurrent reads on the reachable replicas all return the SAME old value — consistency is preserved. The partitioned replica is simply unavailable. Strong consistency, reduced availability.',
      }));
    } else {
      const locked = base.map(() => 'locked');
      frames.push(make(locked, {
        note: 'Write arrives. ACID acquires locks and synchronously replicates to every replica before acknowledging. Readers briefly wait — this is the latency cost of strong consistency.',
      }));
      const committed = base.map(() => 'new');
      frames.push(make(committed, {
        writeAcked: true,
        note: `Commit. Every replica now holds ${NEW}. Only after all replicas agree does the write acknowledge. The lock releases.`,
      }));
      frames.push(make(committed, {
        writeAcked: true,
        reading: true,
        note: `Concurrent reads from ANY replica return ${NEW} immediately. Every reader sees the latest write — strong, immediate consistency.`,
      }));
    }
  } else {
    // BASE: write returns fast on one replica, others converge.
    const start = base.slice();
    if (partitioned) start[cut] = 'down';
    const wrote = start.map((v, i) => (i === 0 ? 'new' : v));
    frames.push(make(wrote, {
      writeAcked: true,
      note: `Write arrives and is acknowledged immediately by the primary replica (${NEW}). BASE returns fast — it does NOT wait for the others. Basically available, soft state.`,
    }));
    frames.push(make(wrote, {
      writeAcked: true,
      reading: true,
      note: `Concurrent reads RIGHT NOW are inconsistent: replica 1 returns ${NEW}, the rest still return ${OLD}. This is the eventual-consistency window — stale reads are possible.`,
    }));
    const conv1 = wrote.map((v, i) => ((i === 1 || i === 2) ? 'new' : v));
    frames.push(make(conv1, {
      writeAcked: true,
      note: `Replication / gossip propagates ${NEW} to more replicas. The cluster is converging — fewer replicas are stale now.`,
    }));
    const conv2 = conv1.map((v, i) => (i === cut && partitioned ? 'down' : 'new'));
    frames.push(make(conv2, {
      writeAcked: true,
      reading: true,
      note: partitioned
        ? `All reachable replicas now hold ${NEW}. The partitioned replica stays stale until the partition heals, then it too converges. Eventual consistency, never unavailable.`
        : `Convergence complete: every replica holds ${NEW}. Reads are now consistent everywhere. The system stayed available the whole time.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1200;

export default function AcidVsBaseViz() {
  const [model, setModel] = useState('acid');
  const [partitioned, setPartitioned] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(model, partitioned), [model, partitioned]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  const change = (setter) => (value) => {
    setIsRunning(false);
    setStep(0);
    setter(value);
  };
  const setModelMode = change(setModel);
  const setPartition = change(setPartitioned);

  const stats = useMemo(() => {
    const fresh = current.states.filter((s) => s === 'new').length;
    const stale = current.states.filter((s) => s === 'old').length;
    const down = current.states.filter((s) => s === 'down').length;
    const reachable = REPLICA_COUNT - down;
    const consistentReads = current.reading
      ? (current.states.filter((s) => s !== 'down').every((s) => s === current.states.find((x) => x !== 'down')))
      : null;
    return { fresh, stale, down, reachable, consistentReads };
  }, [current]);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 360;
  const writerX = 60;
  const writerY = 150;
  const repTop = 60;
  const repGap = 18;
  const repW = 150;
  const repH = 96;
  const repCols = REPLICA_COUNT;
  const repAreaX = 280;
  const repTotalW = repCols * repW + (repCols - 1) * repGap;
  const colorFor = (s) => {
    if (s === 'new') return 'var(--easy)';
    if (s === 'old') return 'var(--warning)';
    if (s === 'down') return 'var(--hard)';
    return 'var(--accent)';
  };
  const valueFor = (s) => {
    if (s === 'new') return NEW;
    if (s === 'down') return 'unreachable';
    if (s === 'locked') return 'committing…';
    return OLD;
  };

  return (
    <div className="abv">
      <div className="abv-head">
        <h3 className="abv-title">ACID vs BASE — strong-and-immediate vs available-and-eventual</h3>
        <p className="abv-sub">
          One write, then concurrent reads across the replicas. ACID makes every replica agree before
          acknowledging; BASE returns fast and lets the replicas converge. Toggle a partition to see CP vs AP.
        </p>
      </div>

      <div className="abv-controls">
        <div className="abv-toggle-group">
          <span className="abv-input-label">model</span>
          <div className="abv-seg" role="tablist" aria-label="Consistency model">
            <button
              type="button"
              className={`abv-seg-btn ${model === 'acid' ? 'is-on' : ''}`}
              onClick={() => setModelMode('acid')}
              aria-pressed={model === 'acid'}
            >
              ACID
            </button>
            <button
              type="button"
              className={`abv-seg-btn ${model === 'base' ? 'is-on' : ''}`}
              onClick={() => setModelMode('base')}
              aria-pressed={model === 'base'}
            >
              BASE
            </button>
          </div>
        </div>

        <div className="abv-toggle-group">
          <span className="abv-input-label">network partition</span>
          <div className="abv-seg" role="tablist" aria-label="Network partition">
            <button
              type="button"
              className={`abv-seg-btn ${!partitioned ? 'is-on is-safe' : ''}`}
              onClick={() => setPartition(false)}
              aria-pressed={!partitioned}
            >
              HEALTHY
            </button>
            <button
              type="button"
              className={`abv-seg-btn is-danger ${partitioned ? 'is-on' : ''}`}
              onClick={() => setPartition(true)}
              aria-pressed={partitioned}
            >
              PARTITIONED
            </button>
          </div>
        </div>

        <label className="abv-slider">
          <span className="abv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="abv-range"
            aria-label="Playback speed"
          />
          <span className="abv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="abv-spacer" aria-hidden="true" />

        <div className="abv-buttons">
          <button
            type="button"
            className="abv-btn abv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((r) => !r);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="abv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="abv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="abv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="abv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="abv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="abv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="abv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="var(--accent)" />
            </marker>
          </defs>

          <rect className="abv-writer" x={writerX} y={writerY} width={150} height={70} rx={9} />
          <g transform={`translate(${writerX + 14}, ${writerY + 14})`}>
            {model === 'acid' ? <Lock size={15} color="var(--accent)" /> : <Zap size={15} color="var(--accent)" />}
          </g>
          <text className="abv-writer-title" x={writerX + 75} y={writerY + 30}>client write</text>
          <text className="abv-writer-sub" x={writerX + 75} y={writerY + 50}>set value = {NEW}</text>

          <line
            className="abv-flow"
            x1={writerX + 152}
            y1={writerY + 35}
            x2={repAreaX - 8}
            y2={repTop + repH / 2}
            markerEnd="url(#abv-arrow)"
          />
          <text className="abv-flow-label" x={(writerX + 152 + repAreaX) / 2} y={writerY - 6}>
            {current.writeAcked ? 'ack' : (model === 'acid' ? 'sync replicate' : 'async')}
          </text>

          {current.states.map((s, i) => {
            const x = repAreaX + i * (repW + repGap) - (repCols * (repW + repGap) - repTotalW) / 2;
            const accent = colorFor(s);
            const partCut = current.partitioned && i === REPLICA_COUNT - 1;
            return (
              <g key={`rep-${i}`}>
                {partCut && (
                  <line className="abv-partition" x1={x - repGap / 2} y1={repTop - 10} x2={x - repGap / 2} y2={repTop + repH + 10} />
                )}
                <rect
                  className={`abv-replica ${current.reading ? 'is-read' : ''}`}
                  x={x}
                  y={repTop}
                  width={repW}
                  height={repH}
                  rx={9}
                  style={{ stroke: accent }}
                />
                <rect x={x} y={repTop} width={repW} height={5} rx={2.5} fill={accent} opacity={0.85} />
                <g transform={`translate(${x + 12}, ${repTop + 14})`}>
                  {s === 'down'
                    ? <ServerCrash size={14} color={accent} />
                    : s === 'locked'
                      ? <Lock size={14} color={accent} />
                      : <Database size={14} color={accent} />}
                </g>
                <text className="abv-replica-title" x={x + repW / 2} y={repTop + 26}>replica {i + 1}</text>
                <text className="abv-replica-value" x={x + repW / 2} y={repTop + 56} style={{ fill: accent }}>
                  {valueFor(s)}
                </text>
                {current.reading && s !== 'down' && (
                  <text className="abv-replica-read" x={x + repW / 2} y={repTop + 78}>
                    read → {s === 'new' ? NEW : OLD}
                  </text>
                )}
              </g>
            );
          })}

          <text className="abv-cap" x={W / 2} y={repTop + repH + 56}>
            {model === 'acid'
              ? 'ACID · atomic · consistent · isolated · durable — agreement before ack'
              : 'BASE · basically available · soft state · eventual consistency — ack then converge'}
          </text>
          <g transform={`translate(${W / 2 - 110}, ${repTop + repH + 70})`}>
            {model === 'base' && current.writeAcked && stats.stale > 0 && (
              <RefreshCw size={13} color="var(--warning)" />
            )}
          </g>
        </svg>
      </div>

      <div className="abv-metrics">
        <div className="abv-metric">
          <span className="abv-metric-label">model</span>
          <span className="abv-metric-value is-accent">{model.toUpperCase()}</span>
        </div>
        <div className="abv-metric">
          <span className="abv-metric-label">consistency</span>
          <span className="abv-metric-value">{current.consistency}</span>
        </div>
        <div className="abv-metric">
          <span className="abv-metric-label">availability</span>
          <span className={`abv-metric-value ${stats.down > 0 && model === 'acid' ? 'is-bad' : 'is-good'}`}>
            {stats.reachable}/{REPLICA_COUNT} serving
          </span>
        </div>
        <div className="abv-metric">
          <span className="abv-metric-label">fresh · stale</span>
          <span className="abv-metric-value">
            <span className="is-good">{stats.fresh}</span> · <span className="is-bad">{stats.stale}</span>
          </span>
        </div>
        <div className="abv-metric">
          <span className="abv-metric-label">reads consistent?</span>
          <span className={`abv-metric-value ${stats.consistentReads === false ? 'is-bad' : stats.consistentReads ? 'is-good' : ''}`}>
            {stats.consistentReads === null ? '—' : stats.consistentReads ? 'yes' : 'no'}
          </span>
        </div>
      </div>

      <div className="abv-narration">
        <span className="abv-narration-label">
          {model === 'acid' ? <Lock size={13} /> : <Zap size={13} />} trace
        </span>
        <span className="abv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
