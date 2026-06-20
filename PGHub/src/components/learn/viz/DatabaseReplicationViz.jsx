import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database, PenLine, BookOpen, Power, Crown } from 'lucide-react';
import './DatabaseReplicationViz.css';

// Single-leader replication.
//
// One PRIMARY (leader) accepts all writes; each commit bumps a monotonic version.
// Two or three REPLICAS (followers) serve reads. A write fans out from the primary
// to the followers along the replication stream.
//
//   SYNCHRONOUS: the primary holds the commit until enough followers ack the new
//   version, so every replica is at the same version when the write returns ->
//   a read from any follower is always FRESH, but the write pays follower latency.
//
//   ASYNCHRONOUS: the primary commits and returns immediately, then ships the
//   change to followers in the background. Followers therefore LAG by some number
//   of versions, so a read served by a lagging follower can be STALE.
//
// To make staleness *visible*, the async trace commits two writes on the primary
// before the slow follower has applied anything, then issues a read against that
// follower -> it answers with an old version while the primary is already ahead.
//
// FAILOVER: if the primary dies, the most up-to-date live follower is promoted to
// be the new primary and writes resume there.

const REPLICAS = [
  { id: 'f1', label: 'follower-1', lag: 1 }, // applies promptly (one step behind)
  { id: 'f2', label: 'follower-2', lag: 3 }, // slow follower -> source of stale reads
];

const WRITE_VALUES = ['Ava', 'Ada', 'Lin', 'Mei'];

// Build the immutable frame trace for the chosen mode + primary-liveness.
// `primaryDown` toggles the failover branch.
function buildFrames(mode, primaryDown) {
  const frames = [];
  const sync = mode === 'sync';

  // mutable simulation state
  let leader = 'primary';
  let primaryVersion = 0;
  const primaryUp = !primaryDown;
  const replicas = REPLICAS.map((r) => ({ ...r, version: 0, up: true }));
  // for async, queued versions each follower still owes, applied lazily by lag
  const pending = {};
  replicas.forEach((r) => { pending[r.id] = []; });

  const snap = (extra) => ({
    mode,
    leader,
    primaryUp,
    primaryVersion,
    replicas: replicas.map((r) => ({ ...r })),
    region: null,        // primary | client | <replicaId>
    flow: null,          // { from, to, kind: 'replicate'|'ack'|'read', label }
    readResult: null,    // { from, version, stale }
    phase: 'run',
    note: '',
    ...extra,
  });

  const headVersion = () => Math.max(primaryVersion, ...replicas.map((r) => r.version));

  frames.push(snap({
    phase: 'init',
    note: sync
      ? `Single-leader replication, SYNCHRONOUS. All writes go to the primary; each commit bumps a version. The primary waits for followers to acknowledge the new version before the write returns, so every replica stays at the same version — reads from any follower are always fresh. The cost is write latency: the slowest follower gates every commit.`
      : `Single-leader replication, ASYNCHRONOUS. All writes go to the primary; each commit bumps a version. The primary commits and returns immediately, then ships the change to followers in the background. Followers lag behind, so a read served by a lagging follower can return a stale version.`,
  }));

  // ---- one WRITE on the primary ----
  const doWrite = (valIdx) => {
    if (leader === 'primary' && !primaryUp) {
      frames.push(snap({
        phase: 'write-fail', region: 'primary',
        note: `The primary is down, so it cannot accept this write. Until a follower is promoted, the cluster has no leader and writes are rejected.`,
      }));
      return;
    }
    primaryVersion += 1;
    const v = primaryVersion;
    const val = WRITE_VALUES[valIdx % WRITE_VALUES.length];
    const leaderLabel = leader === 'primary' ? 'primary' : replicas.find((r) => r.id === leader).label;

    frames.push(snap({
      phase: 'write-commit', region: leader,
      flow: { from: 'client', to: leader, kind: 'write', label: `put ${val}` },
      note: `WRITE "${val}". The ${leaderLabel} commits it at version v${v}.${sync ? ' Because replication is synchronous, the write is not acknowledged to the client yet — the primary first ships v' + v + ' to its followers and waits for acks.' : ' Because replication is asynchronous, the primary acks the client right now; followers will catch up later.'}`,
    }));

    // queue replication to live followers
    replicas.forEach((r) => {
      if (r.up && r.id !== leader) pending[r.id].push(v);
    });

    if (sync) {
      // synchronous: apply to every live follower immediately and collect acks
      replicas.forEach((r) => {
        if (!r.up || r.id === leader) return;
        r.version = v;
        pending[r.id] = pending[r.id].filter((pv) => pv > v);
        frames.push(snap({
          phase: 'replicate', region: r.id,
          flow: { from: leader, to: r.id, kind: 'replicate', label: `v${v}` },
          note: `The primary streams v${v} to ${r.label}, which applies it and acks. ${r.label} is now at v${v}.`,
        }));
      });
      frames.push(snap({
        phase: 'write-done', region: leader,
        flow: { from: leader, to: 'client', kind: 'ack', label: 'committed' },
        note: `All live followers acked v${v}, so the primary now returns success to the client. Every replica is at v${v} — fully consistent, at the price of waiting for the slowest follower.`,
      }));
    } else {
      // asynchronous: primary acks client right away; followers lag.
      frames.push(snap({
        phase: 'write-done', region: leader,
        flow: { from: leader, to: 'client', kind: 'ack', label: 'committed' },
        note: `The primary returns success for v${v} immediately. v${v} is queued for the followers but not yet applied — follower-2 in particular lags by several versions and is now behind by ${headVersion() - replicas.find((r) => r.id === 'f2').version}.`,
      }));
    }
  };

  // async helper: let a follower apply the oldest version it owes, paced by lag.
  const applyOne = (rid) => {
    const r = replicas.find((x) => x.id === rid);
    if (!r.up || pending[rid].length === 0) return false;
    const v = pending[rid].shift();
    r.version = v;
    frames.push(snap({
      phase: 'lag-apply', region: rid,
      flow: { from: leader, to: rid, kind: 'replicate', label: `v${v}` },
      note: `In the background, ${r.label} applies v${v}. It still trails the primary (v${primaryVersion}); its lag is ${primaryVersion - r.version} version${primaryVersion - r.version === 1 ? '' : 's'}.`,
    }));
    return true;
  };

  // ---- a READ served by a chosen follower ----
  const doRead = (rid) => {
    const r = replicas.find((x) => x.id === rid);
    if (!r.up) {
      frames.push(snap({
        phase: 'read-fail', region: rid,
        note: `${r.label} is down, so this read is routed elsewhere.`,
      }));
      return;
    }
    const head = headVersion();
    const stale = r.version < head;
    frames.push(snap({
      phase: 'read', region: rid,
      flow: { from: 'client', to: rid, kind: 'read', label: 'get' },
      readResult: { from: rid, version: r.version, stale },
      note: stale
        ? `READ from ${r.label} returns v${r.version} — but the latest committed version is v${head}. This is a STALE read: async replication let the primary move ahead of ${r.label} by ${head - r.version} version${head - r.version === 1 ? '' : 's'}.`
        : `READ from ${r.label} returns v${r.version}, which equals the latest committed version v${head}. Fresh read — ${r.label} was caught up when the read arrived.`,
    }));
  };

  if (primaryDown) {
    // ----- FAILOVER scenario -----
    // Land a couple of writes first so followers diverge, then kill the primary.
    doWrite(0);
    if (!sync) { applyOne('f1'); } // f1 catches up a bit; f2 still lags
    doWrite(1);
    if (!sync) { applyOne('f1'); }

    frames.push(snap({
      phase: 'primary-die', region: 'primary',
      note: `The primary crashes. No leader means no writes — the cluster must promote a follower. The promoted node should be the most up-to-date follower to lose the least data.`,
    }));

    // promote the most up-to-date live follower
    const candidate = replicas
      .filter((r) => r.up)
      .sort((a, b) => b.version - a.version)[0];
    leader = candidate.id;
    // the new leader's version becomes the cluster's primaryVersion baseline
    primaryVersion = candidate.version;

    frames.push(snap({
      phase: 'promote', region: candidate.id,
      note: `${candidate.label} held the highest version (v${candidate.version}) among live followers, so it is promoted to PRIMARY. Writes now resume against it. Any versions the old primary committed but never replicated are lost — a known risk of async failover.`,
    }));

    doWrite(2);
    if (!sync) { applyOne(replicas.find((r) => r.id !== leader && r.up)?.id || leader); }
    doRead(replicas.find((r) => r.id !== leader && r.up)?.id || leader);

    frames.push(snap({
      phase: 'done', region: null,
      note: `Failover complete. ${candidate.label} is the new leader and the surviving follower is catching up to it. The trade-off the cluster just made: availability (writes resumed fast) in exchange for whatever the dead primary hadn't yet shipped.`,
    }));
    return frames;
  }

  // ----- normal scenario -----
  if (sync) {
    doWrite(0);
    doWrite(1);
    doRead('f2'); // always fresh under sync
    doWrite(2);
    doRead('f1');
    frames.push(snap({
      phase: 'done', region: null,
      note: `Done. Under synchronous replication every read — even from the slowest follower — saw the latest version. The cluster traded write latency for read freshness: no stale reads are possible while all followers ack before commit.`,
    }));
  } else {
    doWrite(0);
    applyOne('f1');         // f1 keeps up
    doWrite(1);             // primary now at v2; f2 still at v0
    doRead('f2');           // STALE: f2 behind
    applyOne('f1');
    applyOne('f2');         // f2 drains one
    doWrite(2);
    applyOne('f1');
    applyOne('f2');
    applyOne('f2');         // f2 finally catches up
    doRead('f2');           // fresh now
    frames.push(snap({
      phase: 'done', region: null,
      note: `Done. The read of follower-2 mid-sequence was STALE because async replication let the primary commit ahead of it. Later, once the background stream drained, the same follower answered with the latest version. Async buys low write latency and read scaling, but the reader must tolerate a lag window.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1150;

export default function DatabaseReplicationViz() {
  const [mode, setMode] = useState('async');
  const [primaryDown, setPrimaryDown] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode, primaryDown), [mode, primaryDown]);
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
  const setModeVal = (m) => {
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };
  const toggleFail = () => {
    setIsRunning(false);
    setStep(0);
    setPrimaryDown((v) => !v);
  };

  // SVG geometry
  const W = 940;
  const H = 470;

  const clientW = 200;
  const clientH = 60;
  const clientX = (W - clientW) / 2;
  const clientY = 24;

  const primaryW = 260;
  const primaryH = 104;
  const primaryX = (W - primaryW) / 2;
  const primaryY = 150;

  const repW = 280;
  const repGap = 40;
  const repsTotal = REPLICAS.length * repW + (REPLICAS.length - 1) * repGap;
  const repLeft = (W - repsTotal) / 2;
  const repY = 332;
  const repH = 116;
  const repX = (i) => repLeft + i * (repW + repGap);
  const repCx = (i) => repX(i) + repW / 2;

  const clientCx = clientX + clientW / 2;
  const primaryCx = primaryX + primaryW / 2;

  const head = Math.max(current.primaryVersion, ...current.replicas.map((r) => r.version));
  const leaderIsReplica = current.leader !== 'primary';

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const flow = current.flow;
  const readRes = current.readResult;

  // edge endpoints by node key
  const nodeAnchor = (key) => {
    if (key === 'client') return { x: clientCx, y: clientY + clientH };
    if (key === 'primary') return { x: primaryCx, y: primaryY };
    const idx = REPLICAS.findIndex((r) => r.id === key);
    return { x: repCx(idx), y: repY };
  };
  const nodeTop = (key) => {
    if (key === 'client') return { x: clientCx, y: clientY + clientH };
    if (key === 'primary') return { x: primaryCx, y: primaryY + primaryH };
    const idx = REPLICAS.findIndex((r) => r.id === key);
    return { x: repCx(idx), y: repY + repH };
  };

  return (
    <div className="drv">
      <div className="drv-head">
        <h3 className="drv-title">Single-leader replication — sync stays consistent, async can read stale</h3>
        <p className="drv-sub">
          Writes go to the primary; followers serve reads. Toggle synchronous (primary waits for follower acks before
          commit) versus asynchronous (primary commits now, followers lag), then step a write/read sequence and watch a
          lagging follower return a stale version. Kill the primary to trigger a failover.
        </p>
      </div>

      <div className="drv-controls">
        <div className="drv-modeswitch" role="group" aria-label="Replication mode">
          <button
            type="button"
            className={`drv-mode ${mode === 'sync' ? 'is-on' : ''}`}
            onClick={() => setModeVal('sync')}
          >
            synchronous
          </button>
          <button
            type="button"
            className={`drv-mode ${mode === 'async' ? 'is-on' : ''}`}
            onClick={() => setModeVal('async')}
          >
            asynchronous
          </button>
        </div>

        <button
          type="button"
          className={`drv-btn drv-fail ${primaryDown ? 'is-on' : ''}`}
          onClick={toggleFail}
        >
          <Power size={14} /> {primaryDown ? 'failover scenario on' : 'fail primary'}
        </button>

        <label className="drv-speed">
          <span className="drv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="drv-range drv-speed-range"
            aria-label="Playback speed"
          />
          <span className="drv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="drv-spacer" aria-hidden="true" />

        <div className="drv-buttons">
          <button
            type="button"
            className="drv-btn drv-btn-primary"
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
            className="drv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="drv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="drv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="drv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="drv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="drv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="drv-arrow-write" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="drv-ah-write" />
            </marker>
            <marker id="drv-arrow-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="drv-ah-read" />
            </marker>
            <marker id="drv-arrow-rep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="drv-ah-rep" />
            </marker>
          </defs>

          {/* static replication edges primary -> each follower */}
          {REPLICAS.map((r, i) => (
            <path
              key={`base-${r.id}`}
              className="drv-edge is-base"
              d={`M ${primaryCx} ${primaryY + primaryH} C ${primaryCx} ${primaryY + primaryH + 40}, ${repCx(i)} ${repY - 40}, ${repCx(i)} ${repY}`}
            />
          ))}

          {/* active flow edge */}
          {flow && (() => {
            const tone = flow.kind === 'read' ? 'read' : flow.kind === 'replicate' ? 'rep' : 'write';
            const a = flow.kind === 'replicate'
              ? nodeTop(flow.from)
              : nodeAnchor(flow.from);
            const b = flow.kind === 'replicate'
              ? nodeAnchor(flow.to)
              : (flow.to === 'client' ? nodeAnchor(flow.from === 'client' ? flow.to : flow.from) : nodeAnchor(flow.to));
            // for ack to client, draw from leader up to client
            let p1 = a; let p2 = b;
            if (flow.to === 'client') { p1 = nodeAnchor(flow.from); p2 = nodeAnchor('client'); }
            if (flow.from === 'client') { p1 = nodeAnchor('client'); p2 = nodeAnchor(flow.to); }
            const midY = (p1.y + p2.y) / 2;
            const lx = (p1.x + p2.x) / 2;
            return (
              <g>
                <path
                  className={`drv-edge is-${tone}`}
                  d={`M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`}
                  markerEnd={`url(#drv-arrow-${tone})`}
                />
                <rect className={`drv-msg-pill is-${tone}`} x={lx - 36} y={midY - 13} width={72} height={20} rx={10} />
                <text className="drv-msg-text" x={lx} y={midY + 1}>{flow.label}</text>
              </g>
            );
          })()}

          {/* client */}
          <g>
            <rect
              className={`drv-client ${current.region === 'client' || (flow && (flow.from === 'client' || flow.to === 'client')) ? 'is-active' : ''}`}
              x={clientX}
              y={clientY}
              width={clientW}
              height={clientH}
              rx={12}
            />
            <text className="drv-client-title" x={clientCx} y={clientY + 25}>client</text>
            <text className="drv-client-sub" x={clientCx} y={clientY + 44}>
              {readRes ? `read = v${readRes.version}` : current.phase.startsWith('write') ? 'writing…' : 'idle'}
            </text>
          </g>

          {/* primary */}
          <g className={current.region === 'primary' ? 'is-active' : ''}>
            <rect
              className={`drv-node drv-primary ${current.region === 'primary' ? 'is-active' : ''} ${!current.primaryUp ? 'is-down' : ''} ${leaderIsReplica ? 'is-demoted' : ''}`}
              x={primaryX}
              y={primaryY}
              width={primaryW}
              height={primaryH}
              rx={12}
            />
            <g transform={`translate(${primaryX + 16}, ${primaryY + 14})`}>
              <Crown width={18} height={18} className={`drv-ic ${!current.primaryUp ? 'is-dim' : ''}`} />
            </g>
            <text className="drv-node-title" x={primaryX + 44} y={primaryY + 29}>
              {leaderIsReplica ? 'primary (dead)' : 'primary (leader)'}
            </text>
            <text className={`drv-node-state ${current.primaryUp ? 'is-up' : 'is-down'}`} x={primaryX + primaryW - 16} y={primaryY + 29}>
              {current.primaryUp ? 'up' : 'down'}
            </text>
            <line className="drv-node-rule" x1={primaryX + 16} y1={primaryY + 42} x2={primaryX + primaryW - 16} y2={primaryY + 42} />
            <text className="drv-node-k" x={primaryX + 16} y={primaryY + 68}>accepts writes</text>
            <text className="drv-node-v" x={primaryX + primaryW - 16} y={primaryY + 68}>
              {current.primaryUp && !leaderIsReplica ? 'yes' : 'no'}
            </text>
            <text className="drv-node-k" x={primaryX + 16} y={primaryY + 90}>version</text>
            <text className="drv-node-ver" x={primaryX + primaryW - 16} y={primaryY + 90}>
              {leaderIsReplica ? '—' : `v${current.primaryVersion}`}
            </text>
          </g>

          {/* followers */}
          {current.replicas.map((r, i) => {
            const x = repX(i);
            const isLeaderNow = current.leader === r.id;
            const lag = head - r.version;
            const active = current.region === r.id;
            const stale = readRes && readRes.from === r.id && readRes.stale;
            const fresh = readRes && readRes.from === r.id && !readRes.stale;
            return (
              <g key={`rep-${r.id}`} className={active ? 'is-active' : ''}>
                <rect
                  className={`drv-node drv-follower ${active ? 'is-active' : ''} ${!r.up ? 'is-down' : ''} ${isLeaderNow ? 'is-promoted' : ''} ${stale ? 'is-stale' : ''} ${fresh ? 'is-fresh' : ''}`}
                  x={x}
                  y={repY}
                  width={repW}
                  height={repH}
                  rx={12}
                />
                <g transform={`translate(${x + 16}, ${repY + 14})`}>
                  {isLeaderNow
                    ? <Crown width={17} height={17} className="drv-ic" />
                    : <Database width={17} height={17} className={`drv-ic ${!r.up ? 'is-dim' : ''}`} />}
                </g>
                <text className="drv-node-title" x={x + 44} y={repY + 28}>
                  {isLeaderNow ? `${r.label} (new leader)` : r.label}
                </text>
                <text
                  className={`drv-node-lag ${lag === 0 ? 'is-synced' : lag > 1 ? 'is-behind' : 'is-near'}`}
                  x={x + repW - 16}
                  y={repY + 28}
                >
                  {!r.up ? 'down' : lag === 0 ? 'in sync' : `lag ${lag}`}
                </text>
                <line className="drv-node-rule" x1={x + 16} y1={repY + 42} x2={x + repW - 16} y2={repY + 42} />
                <text className="drv-node-k" x={x + 16} y={repY + 68}>serves reads</text>
                <text className="drv-node-v" x={x + repW - 16} y={repY + 68}>{r.up ? 'yes' : 'no'}</text>
                <text className="drv-node-k" x={x + 16} y={repY + 92}>version</text>
                <text
                  className={`drv-node-ver ${lag === 0 && head > 0 ? 'is-fresh' : ''}`}
                  x={x + repW - 16}
                  y={repY + 92}
                >
                  v{r.version}
                </text>

                {stale && (
                  <text className="drv-read-tag is-stale" x={x + repW / 2} y={repY + repH + 18}>STALE READ</text>
                )}
                {fresh && (
                  <text className="drv-read-tag is-fresh" x={x + repW / 2} y={repY + repH + 18}>fresh read</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="drv-metrics">
        <div className="drv-metric">
          <span className="drv-metric-label">mode</span>
          <span className={`drv-metric-value ${mode === 'sync' ? 'is-ok' : ''}`}>
            {mode === 'sync' ? 'synchronous' : 'asynchronous'}
          </span>
        </div>
        <div className="drv-metric">
          <span className="drv-metric-label">latest version</span>
          <span className="drv-metric-value">{`v${head}`}</span>
        </div>
        {current.replicas.map((r) => {
          const lag = head - r.version;
          return (
            <div className="drv-metric" key={`m-${r.id}`}>
              <span className="drv-metric-label">{r.label}</span>
              <span className={`drv-metric-value ${!r.up ? 'is-bad' : lag === 0 ? 'is-ok' : lag > 1 ? 'is-bad' : ''}`}>
                {!r.up ? 'down' : `v${r.version} · lag ${lag}`}
              </span>
            </div>
          );
        })}
        <div className="drv-metric">
          <span className="drv-metric-label">read result</span>
          <span className={`drv-metric-value ${readRes ? (readRes.stale ? 'is-bad' : 'is-ok') : 'drv-dimval'}`}>
            {readRes ? `v${readRes.version} ${readRes.stale ? 'STALE' : 'fresh'}` : '—'}
          </span>
        </div>
      </div>

      <div className="drv-narration">
        <span className={`drv-narration-label ${readRes && readRes.stale ? 'is-bad' : ''}`}>
          {current.phase.startsWith('write') ? 'write'
            : current.phase.startsWith('read') ? 'read'
            : current.phase === 'replicate' || current.phase === 'lag-apply' ? 'replicate'
            : current.phase === 'promote' || current.phase === 'primary-die' ? 'failover'
            : 'setup'}
        </span>
        <span className="drv-narration-body">{current.note}</span>
      </div>

      <div className="drv-legend">
        <span className="drv-legend-item"><PenLine size={13} className="drv-ic is-write" /> write to primary</span>
        <span className="drv-legend-item"><BookOpen size={13} className="drv-ic is-read" /> read from follower</span>
        <span className="drv-legend-item"><span className="drv-swatch is-rep" /> replication stream</span>
        <span className="drv-legend-item"><Crown size={13} className="drv-ic" /> current leader</span>
      </div>
    </div>
  );
}
