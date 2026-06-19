import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Database, Check, AlertTriangle, RotateCcw, Pencil, Eye, ShieldCheck } from 'lucide-react';
import './ReadReplicaQuorumViz.css';

// Quorum replication. N copies of one value live on N replicas. A write commits
// to W replicas (they take the newest version); a read contacts R replicas and
// returns the newest version among them. The guarantee: if W + R > N, the write
// set and the read set MUST overlap on at least one replica — so the read always
// sees the latest write (strong consistency). If W + R <= N they can be disjoint,
// and the read may return a stale version.
//
// We pick the write set and read set deterministically (lowest-index replicas
// first) so the overlap is visible and reproducible. A replica can be pinned
// STALE — it always keeps the old version even if it would otherwise be written.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Build the write set: W replicas, preferring NON-stale ones first so a write
// genuinely lands (a pinned-stale replica is written last / skipped if possible).
function pickWriteSet(n, w, staleId) {
  const order = [];
  for (let i = 0; i < n; i += 1) if (i !== staleId) order.push(i);
  if (staleId != null && staleId < n) order.push(staleId);
  return new Set(order.slice(0, w));
}

// Read set: R replicas, lowest index first — independent of the write set.
function pickReadSet(n, r) {
  const s = new Set();
  for (let i = 0; i < n && s.size < r; i += 1) s.add(i);
  return s;
}

function freshReplicas(n) {
  return Array.from({ length: n }, (_, i) => ({ id: i, version: 1, primary: i === 0 }));
}

export default function ReadReplicaQuorumViz() {
  const [n, setN] = useState(5);
  const [w, setW] = useState(3);
  const [r, setR] = useState(3);
  const [staleId, setStaleId] = useState(null);
  const [replicas, setReplicas] = useState(() => freshReplicas(5));
  const [latestVersion, setLatestVersion] = useState(1);

  // phase: idle | writing | reading
  const [phase, setPhase] = useState('idle');
  const [writeSet, setWriteSet] = useState(() => new Set());
  const [readSet, setReadSet] = useState(() => new Set());
  const [lastRead, setLastRead] = useState(null); // { version, consistent } | null
  const [note, setNote] = useState(
    'Set N replicas, the write quorum W, and the read quorum R. When W + R > N the write set and read set must overlap, so a read always sees the latest write. Do a write, then a read.',
  );
  const [tone, setTone] = useState('init');

  const animTimer = useRef(null);

  useEffect(() => () => {
    if (animTimer.current) clearTimeout(animTimer.current);
  }, []);

  // keep W, R, staleId valid when N shrinks.
  const reconcile = (nextN) => {
    setW((cur) => clamp(cur, 1, nextN));
    setR((cur) => clamp(cur, 1, nextN));
    setStaleId((cur) => (cur != null && cur >= nextN ? null : cur));
  };

  const hardReset = (nextN = n) => {
    if (animTimer.current) clearTimeout(animTimer.current);
    setReplicas(freshReplicas(nextN));
    setLatestVersion(1);
    setPhase('idle');
    setWriteSet(new Set());
    setReadSet(new Set());
    setLastRead(null);
    setTone('init');
    setNote(
      'Cluster reset — every replica holds v1. Do a write to bump W replicas to a new version, then read to see whether the read quorum catches it.',
    );
  };

  const changeN = (value) => {
    const nextN = clamp(value, 3, 7);
    setN(nextN);
    reconcile(nextN);
    hardReset(nextN);
  };

  const changeW = (value) => {
    setW(clamp(value, 1, n));
    setWriteSet(new Set());
    setReadSet(new Set());
    setLastRead(null);
    setPhase('idle');
  };

  const changeR = (value) => {
    setR(clamp(value, 1, n));
    setReadSet(new Set());
    setLastRead(null);
    if (phase === 'reading') setPhase('idle');
  };

  const toggleStale = (id) => {
    if (phase !== 'idle') return;
    setStaleId((cur) => (cur === id ? null : id));
    setWriteSet(new Set());
    setReadSet(new Set());
    setLastRead(null);
  };

  const doWrite = () => {
    if (animTimer.current) clearTimeout(animTimer.current);
    const ws = pickWriteSet(n, w, staleId);
    const newVersion = latestVersion + 1;
    setWriteSet(ws);
    setReadSet(new Set());
    setLastRead(null);
    setPhase('writing');
    setTone('write');
    const staleSkipped = staleId != null && !ws.has(staleId);
    setNote(
      `Writing v${newVersion} to ${w} of ${n} replica${w === 1 ? '' : 's'} (the write quorum). Those replicas ack and advance to v${newVersion}; the other ${n - w} keep v${latestVersion}.${staleSkipped ? ` Replica ${staleId + 1} is pinned stale, so it is left out of the write set and stays on v${latestVersion}.` : ''}`,
    );
    animTimer.current = setTimeout(() => {
      setReplicas((prev) => prev.map((rep) => (
        ws.has(rep.id) && rep.id !== staleId
          ? { ...rep, version: newVersion }
          : rep
      )));
      setLatestVersion(newVersion);
      setPhase('idle');
    }, 520);
  };

  const doRead = () => {
    if (animTimer.current) clearTimeout(animTimer.current);
    const rs = pickReadSet(n, r);
    setReadSet(rs);
    setPhase('reading');
    setTone('read');
    // newest version visible among the read set, computed against current replicas.
    setReplicas((prev) => {
      let best = 0;
      let sawLatestId = -1;
      prev.forEach((rep) => {
        if (rs.has(rep.id)) {
          if (rep.version > best) best = rep.version;
          if (rep.version === latestVersion) sawLatestId = rep.id;
        }
      });
      const consistent = best >= latestVersion;
      setLastRead({ version: best, consistent });
      const overlapCount = [...rs].filter((id) => writeSet.has(id)).length;
      if (consistent) {
        setNote(
          `Read contacted ${r} replica${r === 1 ? '' : 's'}; ${sawLatestId >= 0 ? `replica ${sawLatestId + 1} was in the write set, ` : ''}so the newest version v${best} wins — consistent read.${overlapCount > 0 ? ` Write set and read set overlap on ${overlapCount} replica${overlapCount === 1 ? '' : 's'}.` : ''}`,
        );
        setTone('good');
      } else {
        setNote(
          `Read contacted ${r} replica${r === 1 ? '' : 's'}, but none of them held the latest write — it returned v${best} while the cluster is on v${latestVersion}. STALE read: the read set missed the write set.`,
        );
        setTone('bad');
      }
      return prev;
    });
    animTimer.current = setTimeout(() => setPhase('idle'), 520);
  };

  const guaranteed = w + r > n;
  const overlap = useMemo(() => {
    const ids = [];
    writeSet.forEach((id) => { if (readSet.has(id)) ids.push(id); });
    return ids;
  }, [writeSet, readSet]);

  // SVG geometry — replicas in a centered row.
  const W = 960;
  const H = 430;
  const rowY = 150;
  const nodeR = 42;
  const marginX = 70;
  const span = W - marginX * 2;
  const nodeX = (i) => (n === 1 ? W / 2 : marginX + (span * i) / (n - 1));

  // client positions
  const writeClientX = W * 0.30;
  const readClientX = W * 0.70;
  const clientY = 350;

  const nodeTone = (rep) => {
    const inW = writeSet.has(rep.id);
    const inR = readSet.has(rep.id);
    if (inW && inR) return 'overlap';
    if (inW) return 'write';
    if (inR) return 'read';
    return 'idle';
  };

  const narrLabel = tone === 'bad' ? 'stale'
    : tone === 'good' ? 'consistent'
      : tone === 'write' ? 'writing'
        : tone === 'read' ? 'reading'
          : 'ready';
  const narrTone = tone === 'bad' ? 'is-bad' : tone === 'good' ? 'is-ok' : tone === 'write' || tone === 'read' ? 'is-warn' : '';

  return (
    <div className="rqv">
      <div className="rqv-head">
        <h3 className="rqv-title">Read / write quorums — when R + W &gt; N guarantees a fresh read</h3>
        <p className="rqv-sub">
          A write commits to W replicas; a read contacts R replicas and keeps the newest version it sees.
          Overlap is forced exactly when W + R &gt; N — that one shared replica is what makes the read consistent.
          Slide the quorums, pin a replica stale, then write and read to watch it hold or break.
        </p>
      </div>

      <div className="rqv-controls">
        <label className="rqv-slider">
          <span className="rqv-input-label">N replicas</span>
          <input
            type="range"
            min={3}
            max={7}
            step={1}
            value={n}
            onChange={(e) => changeN(Number(e.target.value))}
            className="rqv-range"
            aria-label="Number of replicas"
          />
          <span className="rqv-slider-value">{n}</span>
        </label>

        <label className="rqv-slider">
          <span className="rqv-input-label">W write quorum</span>
          <input
            type="range"
            min={1}
            max={n}
            step={1}
            value={w}
            onChange={(e) => changeW(Number(e.target.value))}
            className="rqv-range"
            aria-label="Write quorum"
          />
          <span className="rqv-slider-value">{w}</span>
        </label>

        <label className="rqv-slider">
          <span className="rqv-input-label">R read quorum</span>
          <input
            type="range"
            min={1}
            max={n}
            step={1}
            value={r}
            onChange={(e) => changeR(Number(e.target.value))}
            className="rqv-range"
            aria-label="Read quorum"
          />
          <span className="rqv-slider-value">{r}</span>
        </label>

        <span className="rqv-spacer" aria-hidden="true" />

        <div className="rqv-buttons">
          <button type="button" className="rqv-btn rqv-btn-primary" onClick={doWrite}>
            <Pencil size={14} /> Do write
          </button>
          <button
            type="button"
            className="rqv-btn rqv-btn-read"
            onClick={doRead}
            disabled={latestVersion <= 1 && writeSet.size === 0}
            title={latestVersion <= 1 && writeSet.size === 0 ? 'Do a write first to create a newer version' : 'Read from R replicas'}
          >
            <Eye size={14} /> Do read
          </button>
          <button type="button" className="rqv-btn" onClick={() => hardReset()}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className={`rqv-verdict ${guaranteed ? 'is-strong' : 'is-weak'}`}>
        {guaranteed
          ? <ShieldCheck size={16} className="rqv-ic is-ok" />
          : <AlertTriangle size={16} className="rqv-ic is-warn" />}
        <span className="rqv-verdict-math">{`W + R = ${w + r} ${guaranteed ? '>' : '<='} N = ${n}`}</span>
        <span className="rqv-verdict-text">
          {guaranteed
            ? 'write set and read set must overlap — every read sees the latest write (strong)'
            : 'sets can be disjoint — a read may miss the write and return stale data'}
        </span>
      </div>

      <div className="rqv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rqv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="rqv-arr-write" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="rqv-ah is-write" />
            </marker>
            <marker id="rqv-arr-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="rqv-ah is-read" />
            </marker>
          </defs>

          <text className="rqv-col-label" x={marginX} y={56} textAnchor="start">
            {`${n} replicas — each holds the value with a version`}
          </text>

          {/* write client -> write-set edges */}
          {Array.from(writeSet).map((id) => {
            const tx = nodeX(id);
            return (
              <line
                key={`we-${id}`}
                className={`rqv-edge is-write ${phase === 'writing' ? 'is-active' : ''}`}
                x1={writeClientX}
                y1={clientY - 18}
                x2={tx}
                y2={rowY + nodeR + 4}
                markerEnd="url(#rqv-arr-write)"
              />
            );
          })}

          {/* read client -> read-set edges */}
          {Array.from(readSet).map((id) => {
            const tx = nodeX(id);
            return (
              <line
                key={`re-${id}`}
                className={`rqv-edge is-read ${phase === 'reading' ? 'is-active' : ''}`}
                x1={readClientX}
                y1={clientY - 18}
                x2={tx}
                y2={rowY + nodeR + 4}
                markerEnd="url(#rqv-arr-read)"
              />
            );
          })}

          {/* replica nodes */}
          {replicas.map((rep) => {
            const x = nodeX(rep.id);
            const t = nodeTone(rep);
            const isStale = rep.id === staleId;
            const isLatest = rep.version === latestVersion && latestVersion > 1;
            return (
              <g
                key={`rep-${rep.id}`}
                className="rqv-node-g"
                onClick={() => toggleStale(rep.id)}
                role="button"
                aria-label={`Replica ${rep.id + 1}${isStale ? ', pinned stale' : ''}`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStale(rep.id); } }}
              >
                <circle
                  className={`rqv-node is-${t} ${isStale ? 'is-stale' : ''}`}
                  cx={x}
                  cy={rowY}
                  r={nodeR}
                />
                <g transform={`translate(${x - 9}, ${rowY - 28})`}>
                  <Database width={18} height={18} className="rqv-node-ic" />
                </g>
                <text className="rqv-node-id" x={x} y={rowY + 2} textAnchor="middle">
                  {rep.primary ? 'primary' : `R${rep.id + 1}`}
                </text>
                <text className={`rqv-node-ver ${isLatest ? 'is-latest' : ''}`} x={x} y={rowY + 18} textAnchor="middle">
                  {`v${rep.version}`}
                </text>
                {isStale && (
                  <text className="rqv-node-tag" x={x} y={rowY - nodeR - 8} textAnchor="middle">stale</text>
                )}
                {t === 'overlap' && (
                  <text className="rqv-node-tag is-overlap" x={x} y={rowY + nodeR + 18} textAnchor="middle">overlap</text>
                )}
              </g>
            );
          })}

          {/* write client */}
          <g className={phase === 'writing' ? 'is-active' : ''}>
            <rect className={`rqv-client is-write ${phase === 'writing' ? 'is-active' : ''}`} x={writeClientX - 64} y={clientY - 18} width={128} height={48} rx={10} />
            <g transform={`translate(${writeClientX - 52}, ${clientY - 4})`}>
              <Pencil width={15} height={15} className="rqv-ic is-write" />
            </g>
            <text className="rqv-client-label" x={writeClientX - 30} y={clientY + 11} textAnchor="start">{`write W=${w}`}</text>
          </g>

          {/* read client */}
          <g className={phase === 'reading' ? 'is-active' : ''}>
            <rect className={`rqv-client is-read ${phase === 'reading' ? 'is-active' : ''}`} x={readClientX - 64} y={clientY - 18} width={128} height={48} rx={10} />
            <g transform={`translate(${readClientX - 52}, ${clientY - 4})`}>
              <Eye width={15} height={15} className="rqv-ic is-read" />
            </g>
            <text className="rqv-client-label" x={readClientX - 30} y={clientY + 11} textAnchor="start">{`read R=${r}`}</text>
          </g>
        </svg>
      </div>

      <div className="rqv-metrics">
        <div className="rqv-metric">
          <span className="rqv-metric-label">N · W · R</span>
          <span className="rqv-metric-value">{`${n} · ${w} · ${r}`}</span>
        </div>
        <div className="rqv-metric">
          <span className="rqv-metric-label">W + R vs N</span>
          <span className={`rqv-metric-value ${guaranteed ? 'is-ok' : 'is-warn'}`}>
            {`${w + r} ${guaranteed ? '>' : '<='} ${n}`}
          </span>
        </div>
        <div className="rqv-metric">
          <span className="rqv-metric-label">write fault tolerance</span>
          <span className="rqv-metric-value">{`${n - w} replica${n - w === 1 ? '' : 's'} may be down`}</span>
        </div>
        <div className="rqv-metric">
          <span className="rqv-metric-label">read fault tolerance</span>
          <span className="rqv-metric-value">{`${n - r} replica${n - r === 1 ? '' : 's'} may be down`}</span>
        </div>
        <div className="rqv-metric">
          <span className="rqv-metric-label">set overlap</span>
          <span className={`rqv-metric-value ${overlap.length > 0 ? 'is-ok' : guaranteed ? '' : 'is-warn'}`}>
            {writeSet.size && readSet.size
              ? `${overlap.length} replica${overlap.length === 1 ? '' : 's'}`
              : '—'}
          </span>
        </div>
        <div className="rqv-metric">
          <span className="rqv-metric-label">last read</span>
          <span className={`rqv-metric-value ${lastRead ? (lastRead.consistent ? 'is-ok' : 'is-bad') : ''}`}>
            {lastRead
              ? `v${lastRead.version} of v${latestVersion} — ${lastRead.consistent ? 'consistent' : 'stale'}`
              : '—'}
          </span>
        </div>
      </div>

      <div className={`rqv-narration ${narrTone}`}>
        <span className={`rqv-narration-label ${narrTone}`}>{narrLabel}</span>
        <span className="rqv-narration-body">{note}</span>
      </div>

      <div className="rqv-legend">
        <span className="rqv-legend-item"><Pencil size={13} className="rqv-ic is-write" /> write set — W replicas take the new version</span>
        <span className="rqv-legend-item"><Eye size={13} className="rqv-ic is-read" /> read set — R replicas queried, newest wins</span>
        <span className="rqv-legend-item"><ShieldCheck size={13} className="rqv-ic is-ok" /> overlap replica saw the write — consistent</span>
        <span className="rqv-legend-item"><AlertTriangle size={13} className="rqv-ic is-warn" /> click a replica to pin it stale</span>
      </div>
    </div>
  );
}
