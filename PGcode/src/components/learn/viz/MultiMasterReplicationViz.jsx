import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Database, ArrowLeftRight, Pencil, AlertTriangle, Check, Clock, GitMerge,
} from 'lucide-react';
import './MultiMasterReplicationViz.css';

// Two masters (A and B) that both accept writes for the same keyspace, with
// asynchronous replication between them. The arc:
//   1. independent writes  — A and B each take a write to different keys; async
//      replication carries each write to the other side; both converge.
//   2. concurrent conflict — A and B write the SAME key at nearly the same time;
//      neither has seen the other's write when it commits. When the replication
//      streams cross, each side holds a different value for the key.
//   3. resolution          — two strategies:
//      last-write-wins (LWW): compare wall-clock timestamps, keep the latest,
//        silently DROP the loser (simple, but lost updates).
//      version vectors: track per-node counters; detect the writes are
//        concurrent (neither dominates) and MERGE both instead of dropping one.
// Pick master A's write, B's write, fire them, then choose a resolution strategy.

const KEY = 'cart:42';

function blankStore() {
  return {
    A: { key: KEY, value: '(empty)', ts: null, vv: { A: 0, B: 0 } },
    B: { key: KEY, value: '(empty)', ts: null, vv: { A: 0, B: 0 } },
  };
}

function clone(st) {
  return {
    store: { A: { ...st.store.A, vv: { ...st.store.A.vv } }, B: { ...st.store.B, vv: { ...st.store.B.vv } } },
    flow: st.flow ? { ...st.flow } : null,
    conflict: st.conflict,
    resolved: st.resolved,
    strategy: st.strategy,
    activeMaster: st.activeMaster,
  };
}

function snap(st, extra) {
  return { ...clone(st), phase: 'idle', note: '', ...extra };
}

function buildFrames(strategy) {
  const frames = [];
  const st = {
    store: blankStore(),
    flow: null,
    conflict: false,
    resolved: false,
    strategy,
    activeMaster: null,
  };

  frames.push(snap(st, {
    phase: 'init',
    note: `Two masters both accept writes for key "${KEY}". Replication between them is asynchronous, so for a moment each side only knows about its own write. The resolution strategy is ${strategy === 'lww' ? 'last-write-wins by timestamp' : 'version vectors that merge concurrent writes'}.`,
  }));

  // Independent (non-conflicting demo first) — A writes, replicates cleanly.
  st.store.A.value = 'add socks';
  st.store.A.ts = '10:00:01.100';
  st.store.A.vv = { A: 1, B: 0 };
  st.activeMaster = 'A';
  frames.push(snap(st, {
    phase: 'writeA',
    activeMaster: 'A',
    note: `A client writes to Master A: "${KEY}" = add socks at 10:00:01.100. Master A commits locally and acknowledges the client immediately — it does NOT wait for Master B. Version vector on A advances to A:1.`,
  }));

  st.flow = { dir: 'AtoB', label: 'replicate add socks' };
  frames.push(snap(st, {
    phase: 'replA',
    flow: { dir: 'AtoB', label: 'replicate (A:1)' },
    note: `Asynchronously, Master A streams its write to Master B. There is a replication lag window here — until this arrives, B is stale and unaware anything changed.`,
  }));

  st.store.B = { key: KEY, value: 'add socks', ts: '10:00:01.100', vv: { A: 1, B: 0 } };
  st.flow = null;
  frames.push(snap(st, {
    phase: 'converged',
    note: `B applies the replicated write. Both masters now agree: "${KEY}" = add socks (A:1). With writes to different keys or well-separated in time, multi-master just works and reads are served locally from either side.`,
  }));

  // Now the conflict — both write the SAME key concurrently.
  st.store.A.value = 'qty = 2';
  st.store.A.ts = '10:00:05.210';
  st.store.A.vv = { A: 2, B: 0 };
  st.activeMaster = 'A';
  frames.push(snap(st, {
    phase: 'concurrentA',
    activeMaster: 'A',
    note: `Now the dangerous case. A client writes Master A: "${KEY}" = qty = 2 at 10:00:05.210 (A:2). At almost the same instant, a different client writes Master B — and neither replication stream has crossed yet.`,
  }));

  st.store.B.value = 'qty = 5';
  st.store.B.ts = '10:00:05.190';
  st.store.B.vv = { A: 1, B: 1 };
  st.activeMaster = 'B';
  frames.push(snap(st, {
    phase: 'concurrentB',
    activeMaster: 'B',
    note: `Master B independently writes "${KEY}" = qty = 5 at 10:00:05.190 (B:1). Both masters committed and acked their clients. A holds qty = 2, B holds qty = 5 — and neither has seen the other.`,
  }));

  // Replication streams cross.
  st.flow = { dir: 'cross', label: 'streams cross' };
  st.conflict = true;
  frames.push(snap(st, {
    phase: 'detect',
    flow: { dir: 'cross', label: 'streams cross' },
    conflict: true,
    note: `The two replication streams cross on the wire. Each master now receives a write to "${KEY}" that disagrees with what it already stored. This is a write-write CONFLICT — the unavoidable cost of accepting writes in more than one place.`,
  }));

  // Resolution.
  if (strategy === 'lww') {
    // A's ts (10:00:05.210) is later than B's (10:00:05.190) -> A wins.
    const winner = 'qty = 2';
    st.store.A = { key: KEY, value: winner, ts: '10:00:05.210', vv: { A: 2, B: 1 } };
    st.store.B = { key: KEY, value: winner, ts: '10:00:05.210', vv: { A: 2, B: 1 } };
    st.resolved = true;
    st.flow = null;
    frames.push(snap(st, {
      phase: 'resolve',
      conflict: true,
      resolved: true,
      note: `Last-write-wins compares wall-clock timestamps: A's 10:00:05.210 is later than B's 10:00:05.190, so "qty = 2" wins and "qty = 5" is silently DROPPED. Both sides converge on qty = 2. Simple and deterministic — but the qty = 5 update is gone, a lost write. LWW also trusts clocks that may be skewed across machines.`,
    }));
  } else {
    // version vectors: A has {A:2,B:0}, B has {A:1,B:1}. Neither dominates -> concurrent -> merge.
    st.store.A = { key: KEY, value: 'qty = 2 | qty = 5 (merge)', ts: '10:00:05.210', vv: { A: 2, B: 1 } };
    st.store.B = { key: KEY, value: 'qty = 2 | qty = 5 (merge)', ts: '10:00:05.210', vv: { A: 2, B: 1 } };
    st.resolved = true;
    st.flow = null;
    frames.push(snap(st, {
      phase: 'resolve',
      conflict: true,
      resolved: true,
      note: `Version vectors compare causally: A holds {A:2, B:0}, B holds {A:1, B:1}. Neither dominates the other — A advanced its own counter without seeing B's write and vice-versa — so they are flagged CONCURRENT. Instead of dropping a write, both values are kept as siblings and merged (application or CRDT decides). No update is silently lost.`,
    }));
  }

  frames.push(snap(st, {
    phase: 'done',
    resolved: true,
    note: strategy === 'lww'
      ? `Converged via LWW. Every node holds the same value, achieved with nothing but a timestamp comparison — that is why LWW is the default in many systems (Cassandra, DynamoDB option). The tradeoff is permanent: concurrent updates to the same key lose data, and the "winner" depends on clock accuracy.`
      : `Converged via version-vector merge. Every node holds the same merged state, and crucially no concurrent update was thrown away. The cost is metadata (a counter per node) and application logic to merge siblings. This is how Dynamo-style stores and CRDTs avoid lost updates under multi-master writes.`,
  }));

  return frames;
}

const PHASE_LABEL = {
  init: 'setup',
  writeA: 'write on A',
  replA: 'replicate',
  converged: 'converged',
  concurrentA: 'concurrent write A',
  concurrentB: 'concurrent write B',
  detect: 'conflict detected',
  resolve: 'resolved',
  done: 'done',
};

const RUN_DELAY_MS = 1600;

export default function MultiMasterReplicationViz() {
  const [strategy, setStrategy] = useState('lww');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(strategy), [strategy]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  const reset = () => { setIsRunning(false); setStep(0); };
  const switchStrategy = (s) => {
    if (s === strategy) return;
    setIsRunning(false);
    setStep(0);
    setStrategy(s);
  };

  // SVG geometry — two master boxes, replication channel between them.
  const W = 940;
  const H = 360;
  const mAx = 200;
  const mBx = 740;
  const my = 150;
  const boxW = 220;
  const boxH = 150;
  const midX = (mAx + mBx) / 2;

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const flow = current.flow;
  const conflict = current.conflict && !current.resolved;
  const resolved = current.resolved;
  const A = current.store.A;
  const B = current.store.B;
  const agree = A.value === B.value && A.value !== '(empty)';

  const MasterBox = (m, x, store, active) => (
    <g>
      <rect className={`mmr-master ${active ? 'is-active' : ''} ${conflict ? 'is-conflict' : ''} ${resolved && agree ? 'is-ok' : ''}`} x={x - boxW / 2} y={my - boxH / 2} width={boxW} height={boxH} rx={12} />
      <g transform={`translate(${x - boxW / 2 + 14}, ${my - boxH / 2 + 12})`}>
        <Database width={20} height={20} className={`mmr-master-ic ${active ? 'is-active' : ''}`} />
      </g>
      <text className="mmr-master-label" x={x - boxW / 2 + 42} y={my - boxH / 2 + 28} textAnchor="start">{`Master ${m}`}</text>
      <text className="mmr-master-sub" x={x - boxW / 2 + 42} y={my - boxH / 2 + 43} textAnchor="start">accepts writes</text>

      <line className="mmr-row-div" x1={x - boxW / 2 + 14} y1={my - boxH / 2 + 56} x2={x + boxW / 2 - 14} y2={my - boxH / 2 + 56} />
      <text className="mmr-kv-key" x={x - boxW / 2 + 16} y={my - boxH / 2 + 78} textAnchor="start">{store.key}</text>
      <text className={`mmr-kv-val ${conflict ? 'is-conflict' : resolved ? 'is-ok' : ''}`} x={x - boxW / 2 + 16} y={my - boxH / 2 + 98} textAnchor="start">
        {store.value}
      </text>
      <text className="mmr-kv-meta" x={x - boxW / 2 + 16} y={my - boxH / 2 + 116} textAnchor="start">
        {`ts ${store.ts || '—'}`}
      </text>
      <text className="mmr-kv-meta" x={x - boxW / 2 + 16} y={my - boxH / 2 + 132} textAnchor="start">
        {`vv {A:${store.vv.A}, B:${store.vv.B}}`}
      </text>
    </g>
  );

  return (
    <div className="mmr">
      <div className="mmr-head">
        <h3 className="mmr-title">Multi-master replication — concurrent writes and the conflict they cause</h3>
        <p className="mmr-sub">
          Two masters both accept writes and replicate asynchronously. Writes to different keys converge
          cleanly; two writes to the same key at the same time collide. Pick a resolution strategy and
          watch last-write-wins drop a write while version vectors merge both.
        </p>
      </div>

      <div className="mmr-controls">
        <div className="mmr-modes" role="tablist" aria-label="Conflict resolution strategy">
          <button
            type="button"
            className={`mmr-mode ${strategy === 'lww' ? 'is-on' : ''}`}
            onClick={() => switchStrategy('lww')}
            aria-pressed={strategy === 'lww'}
          >
            <Clock size={13} /> last-write-wins
          </button>
          <button
            type="button"
            className={`mmr-mode ${strategy === 'vv' ? 'is-on' : ''}`}
            onClick={() => switchStrategy('vv')}
            aria-pressed={strategy === 'vv'}
          >
            <GitMerge size={13} /> version vectors
          </button>
        </div>

        <span className={`mmr-mode-tag ${conflict ? 'is-danger' : resolved ? 'is-ok' : ''}`}>
          {conflict ? 'conflict open' : resolved ? 'resolved' : 'in sync'}
        </span>

        <label className="mmr-speed">
          <span className="mmr-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mmr-speed-range"
            aria-label="Playback speed"
          />
          <span className="mmr-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mmr-spacer" aria-hidden="true" />

        <div className="mmr-buttons">
          <button
            type="button"
            className="mmr-btn mmr-btn-primary"
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
            className="mmr-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mmr-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="mmr-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mmr-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mmr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mmr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mmr-arr-repl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mmr-ah is-repl" />
            </marker>
            <marker id="mmr-arr-conflict" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mmr-ah is-conflict" />
            </marker>
          </defs>

          {/* replication channel */}
          <text className="mmr-channel-label" x={midX} y={my - boxH / 2 - 14} textAnchor="middle">
            async replication
          </text>

          {/* flow arrows */}
          {flow && flow.dir === 'AtoB' && (
            <g>
              <line className="mmr-flow is-repl" x1={mAx + boxW / 2 + 6} y1={my} x2={mBx - boxW / 2 - 12} y2={my} markerEnd="url(#mmr-arr-repl)" />
              <text className="mmr-flow-label is-repl" x={midX} y={my - 12} textAnchor="middle">{flow.label}</text>
            </g>
          )}
          {flow && flow.dir === 'cross' && (
            <g>
              <line className="mmr-flow is-conflict" x1={mAx + boxW / 2 + 6} y1={my - 12} x2={mBx - boxW / 2 - 12} y2={my - 12} markerEnd="url(#mmr-arr-conflict)" />
              <line className="mmr-flow is-conflict" x1={mBx - boxW / 2 - 6} y1={my + 12} x2={mAx + boxW / 2 + 12} y2={my + 12} markerEnd="url(#mmr-arr-conflict)" />
              <g transform={`translate(${midX - 10}, ${my - 10})`}>
                <AlertTriangle width={20} height={20} className="mmr-flow-ic is-conflict" />
              </g>
              <text className="mmr-flow-label is-conflict" x={midX} y={my + 34} textAnchor="middle">{flow.label}</text>
            </g>
          )}
          {!flow && !conflict && (
            <line className="mmr-flow is-idle" x1={mAx + boxW / 2 + 6} y1={my} x2={mBx - boxW / 2 - 6} y2={my} />
          )}

          {MasterBox('A', mAx, A, current.activeMaster === 'A')}
          {MasterBox('B', mBx, B, current.activeMaster === 'B')}
        </svg>
      </div>

      <div className="mmr-metrics">
        <div className="mmr-metric">
          <span className="mmr-metric-label">phase</span>
          <span className={`mmr-metric-value ${conflict ? 'is-bad' : resolved ? 'is-ok' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
        <div className="mmr-metric">
          <span className="mmr-metric-label">strategy</span>
          <span className="mmr-metric-value">{strategy === 'lww' ? 'last-write-wins' : 'version vectors'}</span>
        </div>
        <div className="mmr-metric">
          <span className="mmr-metric-label">replicas agree</span>
          <span className={`mmr-metric-value ${agree ? 'is-ok' : 'is-bad'}`}>{agree ? 'yes — converged' : 'no — diverged'}</span>
        </div>
        <div className="mmr-metric mmr-metric-dim">
          <span className="mmr-metric-label">data loss</span>
          <span className={`mmr-metric-value ${resolved && strategy === 'lww' ? 'is-bad' : resolved ? 'is-ok' : ''}`}>
            {resolved ? (strategy === 'lww' ? 'one write dropped' : 'none — merged') : '—'}
          </span>
        </div>
      </div>

      <div className={`mmr-narration ${conflict ? 'is-bad' : resolved ? 'is-ok' : ''}`}>
        <span className={`mmr-narration-label ${conflict ? 'is-bad' : resolved ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="mmr-narration-body">{current.note}</span>
      </div>

      <div className="mmr-legend">
        <span className="mmr-legend-item"><Pencil size={13} className="mmr-ic" /> write — accepted by either master</span>
        <span className="mmr-legend-item"><ArrowLeftRight size={13} className="mmr-ic is-repl" /> async replication between masters</span>
        <span className="mmr-legend-item"><AlertTriangle size={13} className="mmr-ic is-conflict" /> concurrent writes to one key — conflict</span>
        <span className="mmr-legend-item"><Check size={13} className="mmr-ic is-ok" /> resolved — LWW drops, VV merges</span>
      </div>
    </div>
  );
}
