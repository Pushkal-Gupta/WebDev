import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database, PenLine, BookOpen, Power } from 'lucide-react';
import './QuorumConsensusViz.css';

// Quorum-based replication (Dynamo-style sloppy/strict quorums).
//
// N replicas each hold a (value, version). A WRITE goes to W replicas and bumps
// their version to the new write version. A READ contacts R replicas and returns
// the value with the HIGHEST version it sees.
//
// The quorum-intersection rule: if R + W > N then any set of R replicas and any
// set of W replicas must share at least one replica (pigeonhole), so a read
// quorum always overlaps the most recent write quorum and therefore observes the
// latest version -> strong (read-your-writes) consistency. If R + W <= N the two
// quorums can be disjoint, so a read can miss every freshly-written replica and
// return a STALE version.
//
// To make staleness *visible* we deterministically pick the write quorum as the
// first W replicas and the read quorum as the last R replicas. When R + W <= N
// those windows don't overlap and the read sees only old versions; when
// R + W > N they are forced to share a replica and the read is fresh.

const N = 5;

// Replica indices for a write quorum: the first W live replicas (left side).
function writeQuorum(replicas, w) {
  const picked = [];
  for (let i = 0; i < replicas.length && picked.length < w; i += 1) {
    if (replicas[i].up) picked.push(i);
  }
  return picked;
}

// Replica indices for a read quorum: the last R live replicas (right side).
// Choosing from the opposite end maximises the chance of a disjoint quorum,
// which is exactly the stale-read scenario when R + W <= N.
function readQuorum(replicas, r) {
  const picked = [];
  for (let i = replicas.length - 1; i >= 0 && picked.length < r; i -= 1) {
    if (replicas[i].up) picked.push(i);
  }
  return picked.sort((a, b) => a - b);
}

function liveCount(replicas) {
  return replicas.filter((rp) => rp.up).length;
}

// Build the immutable frame trace for one WRITE then one READ at the given W/R,
// over a given replica liveness map. `baseVersion` is the version already on the
// freshly-written replicas before this write (0 on first write).
function buildFrames(replicasInit, w, r) {
  const frames = [];
  const replicas = replicasInit.map((rp) => ({ ...rp }));
  const live = liveCount(replicas);
  const verdict = w + r > N ? 'consistent' : 'can-be-stale';

  const snap = (extra) => ({
    replicas: replicas.map((rp) => ({ ...rp })),
    w,
    r,
    verdict,
    writeSet: [],
    readSet: [],
    overlap: [],
    phase: 'idle',
    readVersion: null,
    fresh: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `${N} replicas, each holding a (value, version). Write quorum W=${w}, read quorum R=${r}. `
      + `R+W = ${r}+${w} = ${r + w} ${r + w > N ? '>' : '<='} N=${N}, so this configuration is ${verdict === 'consistent'
        ? 'strongly consistent: every read quorum must overlap the latest write quorum.'
        : 'eventually consistent: a read quorum can miss the latest write and return a stale value.'}`,
  }));

  // ---- WRITE phase ----
  const wq = writeQuorum(replicas, w);
  const writeOk = wq.length === w;
  const newVersion = Math.max(0, ...replicas.map((rp) => rp.version)) + 1;

  frames.push(snap({
    phase: 'write-start',
    writeSet: wq,
    note: writeOk
      ? `WRITE v${newVersion}. The client sends the new value to W=${w} replicas (the write quorum, shown on the left). It waits for ${w} acknowledgements before declaring the write durable.`
      : `WRITE cannot reach a quorum: only ${live} replica(s) are up but W=${w} acks are required. The write would block / fail.`,
  }));

  if (writeOk) {
    for (let k = 0; k < wq.length; k += 1) {
      const idx = wq[k];
      replicas[idx].version = newVersion;
      replicas[idx].value = `D${newVersion}`;
      frames.push(snap({
        phase: 'write-ack',
        writeSet: wq,
        activeReplica: idx,
        note: `Replica R${idx + 1} persists value D${newVersion} and bumps its version to v${newVersion}, then acks. `
          + `${k + 1}/${w} acks collected.`,
      }));
    }
    frames.push(snap({
      phase: 'write-done',
      writeSet: wq,
      note: `WRITE committed at version v${newVersion}. ${w} replica(s) now hold the fresh value; the other ${N - w} still hold an older version. The latest write quorum is { ${wq.map((i) => `R${i + 1}`).join(', ')} }.`,
    }));
  } else {
    return { frames, verdict, newVersion: null, writeOk: false };
  }

  // ---- READ phase ----
  const rq = readQuorum(replicas, r);
  const readOk = rq.length === r;
  const overlap = rq.filter((i) => wq.includes(i));

  frames.push(snap({
    phase: 'read-start',
    writeSet: wq,
    readSet: rq,
    overlap,
    note: readOk
      ? `READ. The client contacts R=${r} replicas (the read quorum, shown on the right) and will keep the value carrying the highest version it sees.`
      : `READ cannot reach a quorum: only ${live} replica(s) are up but R=${r} responses are required. The read would block / fail.`,
  }));

  if (!readOk) {
    return { frames, verdict, newVersion, writeOk: true };
  }

  let bestVersion = 0;
  for (let k = 0; k < rq.length; k += 1) {
    const idx = rq[k];
    bestVersion = Math.max(bestVersion, replicas[idx].version);
    frames.push(snap({
      phase: 'read-gather',
      writeSet: wq,
      readSet: rq,
      overlap,
      activeReplica: idx,
      readVersion: bestVersion,
      note: `Replica R${idx + 1} responds with version v${replicas[idx].version}. Highest version seen so far: v${bestVersion}. (${k + 1}/${r} responses.)`,
    }));
  }

  const fresh = bestVersion === newVersion;

  frames.push(snap({
    phase: 'read-done',
    writeSet: wq,
    readSet: rq,
    overlap,
    readVersion: bestVersion,
    fresh,
    note: overlap.length > 0
      ? `Read quorum overlaps the write quorum at { ${overlap.map((i) => `R${i + 1}`).join(', ')} } -> the read sees v${bestVersion}, the LATEST write. `
        + `R+W=${r + w} > N=${N} guarantees this overlap for every possible quorum pair: strong consistency.`
      : `Read quorum { ${rq.map((i) => `R${i + 1}`).join(', ')} } shares NO replica with write quorum { ${wq.map((i) => `R${i + 1}`).join(', ')} }. `
        + `The read returns v${bestVersion} but the latest write was v${newVersion} -> STALE read. R+W=${r + w} <= N=${N} allowed the quorums to be disjoint.`,
  }));

  return { frames, verdict, newVersion, writeOk: true };
}

const RUN_DELAY_MS = 1100;

export default function QuorumConsensusViz() {
  // replica liveness is the only mutable config across runs; W/R drive the trace.
  const [wRaw, setW] = useState(3);
  const [rRaw, setR] = useState(3);
  const [down, setDown] = useState(() => new Set());
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const replicasInit = useMemo(
    () => Array.from({ length: N }, (_, i) => ({ value: 'D0', version: 0, up: !down.has(i) })),
    [down],
  );

  // effective quorum sizes are clamped to the number of live replicas so a quorum
  // is always reachable; derived during render (never via a clamp effect).
  const live = liveCount(replicasInit);
  const w = Math.min(wRaw, live);
  const r = Math.min(rRaw, live);

  const built = useMemo(() => buildFrames(replicasInit, w, r), [replicasInit, w, r]);
  const frames = built.frames;
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

  const setWval = (v) => {
    setIsRunning(false);
    setStep(0);
    setW(v);
  };
  const setRval = (v) => {
    setIsRunning(false);
    setStep(0);
    setR(v);
  };
  const toggleReplica = (i) => {
    setIsRunning(false);
    setStep(0);
    setDown((prev) => {
      const nextDown = new Set(prev);
      if (nextDown.has(i)) nextDown.delete(i);
      else nextDown.add(i);
      // keep W/R within the live-replica count so a quorum stays reachable
      return nextDown;
    });
  };

  // SVG geometry
  const W = 940;
  const H = 460;

  const clientW = 220;
  const clientH = 64;
  const clientX = (W - clientW) / 2;
  const clientY = 28;

  const repW = 150;
  const repGap = 22;
  const repsTotal = N * repW + (N - 1) * repGap;
  const repLeft = (W - repsTotal) / 2;
  const repY = 250;
  const repH = 132;
  const repX = (i) => repLeft + i * (repW + repGap);
  const repCx = (i) => repX(i) + repW / 2;

  const clientCx = clientX + clientW / 2;
  const clientBottom = clientY + clientH;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const inWrite = current.writeSet.includes.bind(current.writeSet);
  const inRead = current.readSet.includes.bind(current.readSet);
  const inOverlap = current.overlap.includes.bind(current.overlap);

  const phaseIsRead = current.phase.startsWith('read');
  const phaseIsWrite = current.phase.startsWith('write');

  // which replicas currently have an edge drawn to the client
  const edgeFor = (i) => {
    if (phaseIsWrite && inWrite(i)) {
      return { tone: 'write', kind: current.phase === 'write-ack' && current.activeReplica === i ? 'ack' : 'send' };
    }
    if (phaseIsRead && inRead(i)) {
      return { tone: 'read', kind: current.phase === 'read-gather' && current.activeReplica === i ? 'resp' : 'ask' };
    }
    return null;
  };

  const repTone = (i) => {
    if (inOverlap(i) && phaseIsRead) return 'overlap';
    if (phaseIsWrite && inWrite(i)) return 'write';
    if (phaseIsRead && inRead(i)) return 'read';
    return 'idle';
  };

  const latestVersion = built.newVersion;
  const freshVerdict = current.fresh;

  return (
    <div className="qcv">
      <div className="qcv-head">
        <h3 className="qcv-title">Quorum consensus — when R + W &gt; N, reads always see the latest write</h3>
        <p className="qcv-sub">
          Write to W replicas, read from R replicas, return the highest version seen. Slide W and R: when their sum
          exceeds N the read and write quorums are forced to share a replica, so every read is fresh. Drop the sum to
          N or below and watch a read quorum miss the write entirely and return a stale value.
        </p>
      </div>

      <div className="qcv-controls">
        <div className="qcv-sliders">
          <label className="qcv-slider">
            <span className="qcv-input-label">W (write quorum)</span>
            <input
              type="range"
              min={1}
              max={live}
              step={1}
              value={w}
              onChange={(e) => setWval(Number(e.target.value))}
              className="qcv-range"
              aria-label="Write quorum size"
            />
            <span className="qcv-slider-value">{w}</span>
          </label>
          <label className="qcv-slider">
            <span className="qcv-input-label">R (read quorum)</span>
            <input
              type="range"
              min={1}
              max={live}
              step={1}
              value={r}
              onChange={(e) => setRval(Number(e.target.value))}
              className="qcv-range"
              aria-label="Read quorum size"
            />
            <span className="qcv-slider-value">{r}</span>
          </label>
        </div>

        <label className="qcv-speed">
          <span className="qcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="qcv-range qcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="qcv-slider-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="qcv-spacer" aria-hidden="true" />

        <div className="qcv-buttons">
          <button
            type="button"
            className="qcv-btn qcv-btn-primary"
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
            className="qcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="qcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="qcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="qcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="qcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="qcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="qcv-arrow-write" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="qcv-ah-write" />
            </marker>
            <marker id="qcv-arrow-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="qcv-ah-read" />
            </marker>
          </defs>

          {/* edges client <-> replicas */}
          {Array.from({ length: N }, (_, i) => {
            const info = edgeFor(i);
            if (!info) return null;
            const up = info.kind === 'ack' || info.kind === 'resp';
            const cx = repCx(i);
            const x1 = up ? cx - 14 : clientCx - 30 + i * 15;
            const x2 = up ? clientCx - 30 + i * 15 : cx - 14;
            const y1 = up ? repY : clientBottom;
            const y2 = up ? clientBottom : repY;
            const midY = (clientBottom + repY) / 2;
            const labels = { send: 'put', ack: 'ack', ask: 'get', resp: `v${current.replicas[i].version}` };
            const labelY = up ? midY + 16 : midY - 8;
            return (
              <g key={`edge-${i}`}>
                <path
                  className={`qcv-edge is-${info.tone}`}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  markerEnd={`url(#qcv-arrow-${info.tone})`}
                />
                <rect
                  className={`qcv-msg-pill is-${info.tone}`}
                  x={(x1 + x2) / 2 - 22}
                  y={labelY - 13}
                  width={44}
                  height={19}
                  rx={9}
                />
                <text className="qcv-msg-text" x={(x1 + x2) / 2} y={labelY + 1}>{labels[info.kind]}</text>
              </g>
            );
          })}

          {/* client */}
          <g>
            <rect
              className={`qcv-client ${phaseIsWrite ? 'is-write' : ''} ${phaseIsRead ? 'is-read' : ''}`}
              x={clientX}
              y={clientY}
              width={clientW}
              height={clientH}
              rx={12}
            />
            <text className="qcv-client-title" x={clientCx} y={clientY + 26}>client</text>
            <text className="qcv-client-sub" x={clientCx} y={clientY + 46}>
              {phaseIsWrite ? `writing v${latestVersion ?? ''}` : phaseIsRead ? `read = v${current.readVersion ?? '—'}` : 'idle'}
            </text>
          </g>

          {/* quorum band labels */}
          <text className="qcv-band-label is-write" x={repLeft} y={repY - 18} textAnchor="start">
            write quorum -&gt; first {w} live
          </text>
          <text className="qcv-band-label is-read" x={repLeft + repsTotal} y={repY - 18} textAnchor="end">
            read quorum -&gt; last {r} live
          </text>

          {/* replicas */}
          {Array.from({ length: N }, (_, i) => {
            const rp = current.replicas[i];
            const tone = repTone(i);
            const active = current.activeReplica === i;
            const x = repX(i);
            const isDown = !rp.up;
            return (
              <g key={`rep-${i}`} className={active ? 'is-active' : ''}>
                <rect
                  className={`qcv-rep is-${tone} ${active ? 'is-active' : ''} ${isDown ? 'is-down' : ''}`}
                  x={x}
                  y={repY}
                  width={repW}
                  height={repH}
                  rx={12}
                />
                <g transform={`translate(${x + 14}, ${repY + 13})`}>
                  <Database width={16} height={16} className={`qcv-ic ${isDown ? 'is-dim' : ''}`} />
                </g>
                <text className="qcv-rep-title" x={x + 38} y={repY + 26}>{`R${i + 1}`}</text>
                <text className={`qcv-rep-up ${isDown ? 'is-down' : 'is-up'}`} x={x + repW - 14} y={repY + 26}>
                  {isDown ? 'down' : 'up'}
                </text>
                <line className="qcv-rep-rule" x1={x + 14} y1={repY + 40} x2={x + repW - 14} y2={repY + 40} />

                <text className="qcv-rep-k" x={x + 14} y={repY + 64}>value</text>
                <text className="qcv-rep-v" x={x + repW - 14} y={repY + 64}>{isDown ? '—' : rp.value}</text>

                <text className="qcv-rep-k" x={x + 14} y={repY + 88}>version</text>
                <text
                  className={`qcv-rep-ver ${!isDown && rp.version === latestVersion && latestVersion ? 'is-fresh' : ''}`}
                  x={x + repW - 14}
                  y={repY + 88}
                >
                  {isDown ? '—' : `v${rp.version}`}
                </text>

                {tone === 'overlap' && (
                  <text className="qcv-rep-tag is-overlap" x={x + repW / 2} y={repY + repH - 12}>overlap</text>
                )}
                {tone === 'write' && (
                  <text className="qcv-rep-tag is-write" x={x + repW / 2} y={repY + repH - 12}>in write set</text>
                )}
                {tone === 'read' && (
                  <text className="qcv-rep-tag is-read" x={x + repW / 2} y={repY + repH - 12}>in read set</text>
                )}

                <foreignObject x={x + repW / 2 - 16} y={repY + repH + 8} width={32} height={28}>
                  <button
                    type="button"
                    className={`qcv-toggle ${isDown ? 'is-down' : ''}`}
                    onClick={() => toggleReplica(i)}
                    title={isDown ? `Bring R${i + 1} up` : `Take R${i + 1} down`}
                    aria-label={isDown ? `Bring R${i + 1} up` : `Take R${i + 1} down`}
                  >
                    <Power size={13} />
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="qcv-metrics">
        <div className="qcv-metric">
          <span className="qcv-metric-label">R + W vs N</span>
          <span className={`qcv-metric-value ${current.verdict === 'consistent' ? 'is-ok' : 'is-bad'}`}>
            {r}+{w} = {r + w} {r + w > N ? '>' : '<='} {N}
          </span>
        </div>
        <div className="qcv-metric">
          <span className="qcv-metric-label">guarantee</span>
          <span className={`qcv-metric-value ${current.verdict === 'consistent' ? 'is-ok' : 'is-bad'}`}>
            {current.verdict === 'consistent' ? 'strong (overlaps)' : 'can be stale'}
          </span>
        </div>
        <div className="qcv-metric">
          <span className="qcv-metric-label">latest write</span>
          <span className="qcv-metric-value">{latestVersion ? `v${latestVersion}` : '—'}</span>
        </div>
        <div className="qcv-metric">
          <span className="qcv-metric-label">read result</span>
          <span className="qcv-metric-value">{current.readVersion == null ? '—' : `v${current.readVersion}`}</span>
        </div>
        <div className="qcv-metric qcv-metric-dim">
          <span className="qcv-metric-label">read is</span>
          <span className={`qcv-metric-value ${freshVerdict === true ? 'is-ok' : freshVerdict === false ? 'is-bad' : 'qcv-metric-dimval'}`}>
            {freshVerdict === true ? 'fresh' : freshVerdict === false ? 'STALE' : '—'}
          </span>
        </div>
      </div>

      <div className="qcv-narration">
        <span className={`qcv-narration-label ${freshVerdict === false ? 'is-bad' : ''}`}>
          {phaseIsWrite ? 'write' : phaseIsRead ? 'read' : 'setup'}
        </span>
        <span className="qcv-narration-body">{current.note}</span>
      </div>

      <div className="qcv-legend">
        <span className="qcv-legend-item"><PenLine size={13} className="qcv-ic is-write" /> write quorum (W)</span>
        <span className="qcv-legend-item"><BookOpen size={13} className="qcv-ic is-read" /> read quorum (R)</span>
        <span className="qcv-legend-item"><span className="qcv-swatch is-overlap" /> intersection replica</span>
        <span className="qcv-legend-item"><Power size={13} className="qcv-ic is-dim" /> toggle a replica down</span>
      </div>
    </div>
  );
}
