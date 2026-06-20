import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Upload, Download, Plus, Minus, AlertTriangle } from 'lucide-react';
import './DynamoArchitectureViz.css';

// Hash ring spans [0, RING). Physical nodes scatter as virtual tokens around it.
const RING = 360;
const PHYS_NODES = ['A', 'B', 'C', 'D', 'E'];
const VNODES_PER_NODE = 3;
const KEY_LABEL = 'cart:42';

// Deterministic FNV-like hash -> position on the ring. Salt distinguishes vnodes.
function hashPos(label, salt) {
  let h = 2166136261 >>> 0;
  const s = `${label}#${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % RING;
}

// Expand physical nodes into virtual tokens, sorted clockwise.
function buildTokens(nodes) {
  const tokens = [];
  for (const name of nodes) {
    for (let v = 0; v < VNODES_PER_NODE; v++) {
      tokens.push({ owner: name, pos: hashPos(name, v), vnode: v });
    }
  }
  tokens.sort((a, b) => a.pos - b.pos || (a.owner < b.owner ? -1 : 1));
  return tokens;
}

// Preference list: walk clockwise from keyPos collecting the next N DISTINCT physical nodes.
function preferenceList(tokens, keyPos, n) {
  const ordered = [];
  const seen = new Set();
  const len = tokens.length;
  // index of first token at or past keyPos
  let start = tokens.findIndex((t) => t.pos >= keyPos);
  if (start < 0) start = 0;
  for (let i = 0; i < len && ordered.length < n; i++) {
    const t = tokens[(start + i) % len];
    if (!seen.has(t.owner)) {
      seen.add(t.owner);
      ordered.push(t.owner);
    }
  }
  return ordered;
}

// Resolve effective write targets honoring failures + hinted handoff.
// Returns [{ node, role: 'replica'|'hint', forNode? }] for the N writes.
function resolveTargets(prefList, tokens, keyPos, failed, n) {
  const targets = [];
  const used = new Set();
  for (const node of prefList) {
    if (!failed.has(node)) {
      targets.push({ node, role: 'replica' });
      used.add(node);
      continue;
    }
    // node is down -> find next healthy distinct node clockwise not already chosen, takes a HINT
    const len = tokens.length;
    let start = tokens.findIndex((t) => t.pos >= keyPos);
    if (start < 0) start = 0;
    let hintNode = null;
    for (let i = 0; i < len; i++) {
      const t = tokens[(start + i) % len];
      if (!failed.has(t.owner) && !used.has(t.owner) && !prefList.includes(t.owner)) {
        hintNode = t.owner;
        break;
      }
    }
    if (!hintNode) {
      // fall back to any healthy node not yet used
      for (const cand of PHYS_NODES) {
        if (!failed.has(cand) && !used.has(cand)) { hintNode = cand; break; }
      }
    }
    if (hintNode) {
      targets.push({ node: hintNode, role: 'hint', forNode: node });
      used.add(hintNode);
    } else {
      targets.push({ node, role: 'down', forNode: node });
    }
  }
  return targets.slice(0, n);
}

function clockToString(clock) {
  const keys = Object.keys(clock).sort();
  if (keys.length === 0) return '[]';
  return `[${keys.map((k) => `${k}:${clock[k]}`).join(', ')}]`;
}

// Build the full step trace from an ordered list of operations.
// op: { type: 'write'|'read'|'fail'|'recover'|'concurrent', node?: }
function buildFrames(ops, n, r, w) {
  const frames = [];
  const failed = new Set();

  // value state: list of sibling versions, each { clock, by }
  let versions = [];

  const keyPos = hashPos(KEY_LABEL, 9);

  const snap = (extra) => {
    const tokens = buildTokens(PHYS_NODES);
    const prefList = preferenceList(tokens, keyPos, n);
    const targets = resolveTargets(prefList, tokens, keyPos, failed, n);
    return {
      keyPos,
      tokens,
      prefList,
      targets,
      failed: new Set(failed),
      versions: versions.map((v) => ({ clock: { ...v.clock }, by: v.by })),
      n, r, w,
      contactSet: [],
      ackSet: [],
      mode: null, // 'write' | 'read'
      quorumOk: false,
      conflict: versions.length > 1,
      note: '',
      ...extra,
    };
  };

  frames.push(snap({
    note: `Key "${KEY_LABEL}" hashes onto the ring. Its preference list is the next N=${n} distinct physical nodes clockwise. With N/R/W=${n}/${r}/${w}, R+W ${r + w > n ? '>' : '<='} N means consistency is ${r + w > n ? 'STRONG' : 'eventual'}.`,
  }));

  const tokens0 = buildTokens(PHYS_NODES);
  const pref0 = preferenceList(tokens0, keyPos, n);
  frames.push(snap({
    mode: null,
    note: `Preference list (replica set): ${pref0.join(' -> ')}. The first healthy member acts as coordinator for the request.`,
  }));

  for (const op of ops) {
    const tokens = buildTokens(PHYS_NODES);
    const prefList = preferenceList(tokens, keyPos, n);

    if (op.type === 'fail') {
      failed.add(op.node);
      frames.push(snap({
        note: `Node ${op.node} fails. If it sits in the preference list, its writes now divert via HINTED HANDOFF to the next healthy node, tagged with the intended owner.`,
      }));
    } else if (op.type === 'recover') {
      failed.delete(op.node);
      frames.push(snap({
        note: `Node ${op.node} recovers. Any node holding a hint for ${op.node} hands the data back, then drops the hint. The ring is whole again.`,
      }));
    } else if (op.type === 'write') {
      const targets = resolveTargets(prefList, tokens, keyPos, failed, n);
      const coordNode = targets[0] ? targets[0].node : prefList[0];
      const ackSet = targets.map((t) => t.node);
      const reachable = targets.filter((t) => t.role !== 'down').length;
      const quorumOk = reachable >= w;
      // advance vector clock: coordinator bumps its own counter on the surviving version
      const base = versions.length === 1 ? { ...versions[0].clock } : {};
      base[coordNode] = (base[coordNode] || 0) + 1;
      versions = [{ clock: base, by: coordNode }];
      const hints = targets.filter((t) => t.role === 'hint');
      frames.push(snap({
        mode: 'write',
        contactSet: ackSet,
        ackSet,
        quorumOk,
        note: `WRITE coordinated by ${coordNode}: send to all N replicas, wait for W=${w} acks. Reachable acks: ${reachable}. Quorum ${quorumOk ? 'SATISFIED' : 'FAILED'}. ` +
          (hints.length ? `Hint(s): ${hints.map((h) => `${h.node} holds for ${h.forNode}`).join('; ')}. ` : '') +
          `Vector clock -> ${clockToString(base)}.`,
      }));
    } else if (op.type === 'read') {
      const targets = resolveTargets(prefList, tokens, keyPos, failed, n);
      const contactSet = targets.slice(0, r).map((t) => t.node);
      const reachable = targets.filter((t) => t.role !== 'down').length;
      const quorumOk = reachable >= r;
      frames.push(snap({
        mode: 'read',
        contactSet,
        ackSet: contactSet,
        quorumOk,
        note: `READ from coordinator: query the N replicas, wait for R=${r} responses (${contactSet.join(', ')}). Quorum ${quorumOk ? 'SATISFIED' : 'FAILED'}. ` +
          (versions.length > 1
            ? `Two sibling versions returned with concurrent vector clocks — CONFLICT surfaced to the client to reconcile.`
            : `One causally-newest version returned: ${clockToString(versions[0] ? versions[0].clock : {})}.`),
      }));
    } else if (op.type === 'concurrent') {
      // two coordinators write the same prior version without seeing each other -> siblings
      const prior = versions.length === 1 ? { ...versions[0].clock } : {};
      const a = { ...prior }; a.A = (a.A || 0) + 1;
      const b = { ...prior }; b.B = (b.B || 0) + 1;
      versions = [{ clock: a, by: 'A' }, { clock: b, by: 'B' }];
      frames.push(snap({
        mode: 'write',
        contactSet: ['A', 'B'],
        ackSet: ['A', 'B'],
        quorumOk: true,
        note: `CONCURRENT writes: A and B each update the same parent version without seeing the other. Clocks ${clockToString(a)} and ${clockToString(b)} are not ancestors of one another — siblings, flagged as a CONFLICT for the client to merge.`,
      }));
    }
  }

  return frames;
}

const NODE_COLORS = {
  A: 'var(--accent)', B: 'var(--hue-mint)', C: 'var(--hue-violet)', D: 'var(--hue-pink)', E: 'var(--hue-sky)',
};
function colorOf(name) {
  return NODE_COLORS[name] || 'var(--text-dim)';
}

const RUN_DELAY_MS = 1200;

export default function DynamoArchitectureViz() {
  const [n, setN] = useState(3);
  const [r, setR] = useState(2);
  const [w, setW] = useState(2);
  const [ops, setOps] = useState([{ type: 'write' }, { type: 'read' }]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(ops, n, r, w), [ops, n, r, w]);
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

  // stepper helpers with constraint 1 <= R,W <= N
  const setNCount = (delta) => {
    const next = Math.max(1, Math.min(PHYS_NODES.length, n + delta));
    if (next === n) return;
    setIsRunning(false);
    setN(next);
    setR((v) => Math.min(v, next));
    setW((v) => Math.min(v, next));
    setStep(0);
  };
  const setRCount = (delta) => {
    const next = Math.max(1, Math.min(n, r + delta));
    if (next === r) return;
    setIsRunning(false);
    setR(next);
    setStep(0);
  };
  const setWCount = (delta) => {
    const next = Math.max(1, Math.min(n, w + delta));
    if (next === w) return;
    setIsRunning(false);
    setW(next);
    setStep(0);
  };

  const appendOp = (op) => {
    setIsRunning(false);
    setOps((list) => [...list, op]);
    setStep(totalSteps);
  };

  const failedNow = current.failed;
  const anyFailed = failedNow.size > 0;
  const toggleFail = () => {
    setIsRunning(false);
    // pick a preference-list member to fail, or recover the failed one
    if (anyFailed) {
      const node = [...failedNow][0];
      setOps((list) => [...list, { type: 'recover', node }]);
    } else {
      const victim = current.prefList[1] || current.prefList[0];
      setOps((list) => [...list, { type: 'fail', node: victim }]);
    }
    setStep(totalSteps);
  };

  const restart = () => {
    setIsRunning(false);
    setN(3); setR(2); setW(2);
    setOps([{ type: 'write' }, { type: 'read' }]);
    setStep(0);
  };

  // SVG geometry — ring on the left, replica panel on the right.
  const W = 940;
  const H = 440;
  const cx = 230;
  const cy = H / 2;
  const R = 158;
  const panelX = 480;
  const panelW = W - panelX - 24;

  const toXY = (pos, radius) => {
    const ang = (pos / RING) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius };
  };

  const tokens = current.tokens;
  const prefSet = new Set(current.prefList);
  const targetByNode = {};
  for (const t of current.targets) targetByNode[t.node] = t;
  const contactSet = new Set(current.contactSet);
  const keyPt = toXY(current.keyPos, R - 38);

  const strong = current.r + current.w > current.n;
  const conflict = current.conflict;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="dav">
      <div className="dav-head">
        <h3 className="dav-title">Amazon Dynamo — preference list, quorum, hinted handoff, vector clocks</h3>
        <p className="dav-sub">
          A key hashes onto a consistent-hashing ring; its N replicas are the next N distinct nodes clockwise.
          Writes need W acks, reads need R; R+W &gt; N gives strong reads. Failed replicas divert via hinted handoff;
          concurrent writes produce vector-clock siblings.
        </p>
      </div>

      <div className="dav-controls">
        <div className="dav-quorum">
          <span className="dav-input-label">N</span>
          <button type="button" className="dav-btn dav-btn-step" onClick={() => setNCount(-1)} disabled={n <= 1}>−</button>
          <span className="dav-quorum-val">{n}</span>
          <button type="button" className="dav-btn dav-btn-step" onClick={() => setNCount(1)} disabled={n >= PHYS_NODES.length}>+</button>
        </div>
        <div className="dav-quorum">
          <span className="dav-input-label">R</span>
          <button type="button" className="dav-btn dav-btn-step" onClick={() => setRCount(-1)} disabled={r <= 1}>−</button>
          <span className="dav-quorum-val">{r}</span>
          <button type="button" className="dav-btn dav-btn-step" onClick={() => setRCount(1)} disabled={r >= n}>+</button>
        </div>
        <div className="dav-quorum">
          <span className="dav-input-label">W</span>
          <button type="button" className="dav-btn dav-btn-step" onClick={() => setWCount(-1)} disabled={w <= 1}>−</button>
          <span className="dav-quorum-val">{w}</span>
          <button type="button" className="dav-btn dav-btn-step" onClick={() => setWCount(1)} disabled={w >= n}>+</button>
        </div>

        <div className="dav-group">
          <button type="button" className="dav-btn" onClick={() => appendOp({ type: 'write' })}>
            <Upload size={13} /> Write
          </button>
          <button type="button" className="dav-btn" onClick={() => appendOp({ type: 'read' })}>
            <Download size={13} /> Read
          </button>
          <button type="button" className="dav-btn" onClick={() => appendOp({ type: 'concurrent' })}>
            <Plus size={13} /> Concurrent
          </button>
          <button type="button" className={`dav-btn ${anyFailed ? 'is-active' : ''}`} onClick={toggleFail}>
            {anyFailed ? <RotateCcw size={13} /> : <AlertTriangle size={13} />}
            {anyFailed ? 'Recover node' : 'Fail node'}
          </button>
        </div>

        <span className="dav-spacer" aria-hidden="true" />

        <label className="dav-speed">
          <span className="dav-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dav-speed-range"
            aria-label="Playback speed"
          />
          <span className="dav-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="dav-group">
          <button
            type="button"
            className="dav-btn dav-btn-primary"
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
            className="dav-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dav-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dav-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="dav-btn" onClick={restart}>
            <Minus size={13} /> Restart
          </button>
        </div>
        <div className="dav-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dav-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dav-svg" preserveAspectRatio="xMidYMid meet">
          {/* ring base */}
          <circle cx={cx} cy={cy} r={R} className="dav-ring" />
          <text x={cx} y={cy - R - 12} className="dav-ring-mark">0 / {RING}</text>
          <text x={cx + R + 8} y={cy + 4} className="dav-ring-mark" textAnchor="start">{Math.round(RING / 4)}</text>
          <text x={cx} y={cy + R + 22} className="dav-ring-mark">{Math.round(RING / 2)}</text>
          <text x={cx - R - 8} y={cy + 4} className="dav-ring-mark" textAnchor="end">{Math.round((RING * 3) / 4)}</text>

          {/* key marker + spoke to ring */}
          <line x1={cx} y1={cy} x2={keyPt.x} y2={keyPt.y} className="dav-key-spoke" />
          <g>
            <circle className="dav-key" cx={keyPt.x} cy={keyPt.y} r={11} />
            <text className="dav-key-label" x={keyPt.x} y={keyPt.y + 3}>k</text>
          </g>

          {/* virtual node tokens */}
          {tokens.map((t, i) => {
            const p = toXY(t.pos, R);
            const col = colorOf(t.owner);
            const inPref = prefSet.has(t.owner);
            const isFailed = current.failed.has(t.owner);
            return (
              <g key={`tok-${t.owner}-${t.vnode}-${i}`}>
                <line x1={cx + (p.x - cx) * 0.9} y1={cy + (p.y - cy) * 0.9} x2={p.x} y2={p.y} className="dav-tick" style={{ stroke: col }} />
                <rect
                  className={`dav-node ${inPref ? 'is-pref' : ''} ${isFailed ? 'is-failed' : ''}`}
                  x={p.x - 11}
                  y={p.y - 11}
                  width={22}
                  height={22}
                  rx={6}
                  style={{ fill: isFailed ? 'var(--surface)' : col, stroke: isFailed ? 'var(--hard)' : col }}
                />
                <text className="dav-node-label" x={p.x} y={p.y + 4} style={{ fill: isFailed ? 'var(--hard)' : 'var(--bg)' }}>
                  {t.owner}{t.vnode}
                </text>
              </g>
            );
          })}

          {/* right panel: preference list rows */}
          <text x={panelX} y={30} className="dav-row-label">preference list · N = {current.n}</text>
          {current.prefList.map((node, i) => {
            const y = 46 + i * 50;
            const col = colorOf(node);
            const tgt = targetByNode[node];
            const isFailed = current.failed.has(node);
            const contacted = contactSet.has(node) || (tgt && contactSet.has(tgt.node));
            const handoff = current.targets.find((t) => t.role === 'hint' && t.forNode === node);
            const rowW = panelW;
            return (
              <g key={`pref-${node}`}>
                <rect
                  className={`dav-rep-row ${contacted ? 'is-contacted' : ''}`}
                  x={panelX}
                  y={y}
                  width={rowW}
                  height={40}
                  rx={7}
                  style={contacted ? { stroke: current.mode === 'read' ? 'var(--hue-sky)' : 'var(--easy)' } : undefined}
                />
                <rect x={panelX + 10} y={y + 9} width={22} height={22} rx={6} style={{ fill: isFailed ? 'var(--surface)' : col, stroke: isFailed ? 'var(--hard)' : col }} className="dav-rep-chip" />
                <text className="dav-rep-chip-label" x={panelX + 21} y={y + 24} style={{ fill: isFailed ? 'var(--hard)' : 'var(--bg)' }}>{node}</text>
                <text className="dav-rep-role" x={panelX + 42} y={y + 18}>
                  replica {i + 1}{i === 0 ? ' · coordinator' : ''}
                </text>
                <text className={`dav-rep-state ${isFailed ? 'is-down' : ''}`} x={panelX + 42} y={y + 33}>
                  {isFailed
                    ? (handoff ? `DOWN -> hint on ${handoff.node}` : 'DOWN')
                    : (contacted ? (current.mode === 'read' ? 'read ack' : 'write ack') : 'holds replica')}
                </text>
              </g>
            );
          })}

          {/* hint node callout, if a hint target lies outside the preference list */}
          {current.targets.filter((t) => t.role === 'hint' && !prefSet.has(t.node)).map((t, i) => {
            const y = 46 + current.prefList.length * 50 + i * 50;
            const col = colorOf(t.node);
            return (
              <g key={`hint-${t.node}`}>
                <rect className="dav-rep-row is-hint" x={panelX} y={y} width={panelW} height={40} rx={7} />
                <rect x={panelX + 10} y={y + 9} width={22} height={22} rx={6} style={{ fill: col, stroke: 'var(--warning)' }} className="dav-rep-chip" />
                <text className="dav-rep-chip-label" x={panelX + 21} y={y + 24}>{t.node}</text>
                <text className="dav-rep-role" x={panelX + 42} y={y + 18}>hinted handoff</text>
                <text className="dav-rep-state is-hint" x={panelX + 42} y={y + 33}>holds hint for {t.forNode} · hands back on recovery</text>
              </g>
            );
          })}

          {/* version / vector-clock box */}
          {(() => {
            const baseY = 46 + (current.prefList.length + current.targets.filter((t) => t.role === 'hint' && !prefSet.has(t.node)).length) * 50 + 10;
            return (
              <g>
                <text x={panelX} y={baseY + 2} className="dav-row-label">value version(s) · vector clock</text>
                {current.versions.length === 0 && (
                  <text x={panelX} y={baseY + 26} className="dav-rep-role">no value written yet</text>
                )}
                {current.versions.map((v, vi) => {
                  const y = baseY + 12 + vi * 30;
                  return (
                    <g key={`ver-${vi}`}>
                      <rect className={`dav-ver ${conflict ? 'is-conflict' : ''}`} x={panelX} y={y} width={panelW} height={24} rx={6} />
                      <text className="dav-ver-text" x={panelX + 10} y={y + 16}>
                        {conflict ? `sibling ${vi + 1}` : 'current'} · {clockToString(v.clock)} · by {v.by}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="dav-metrics">
        <div className="dav-metric">
          <span className="dav-metric-label">preference list</span>
          <span className="dav-metric-value">{current.prefList.join(' › ') || '—'}</span>
        </div>
        <div className="dav-metric">
          <span className="dav-metric-label">mode</span>
          <span className="dav-metric-value">{current.mode || 'idle'}</span>
        </div>
        <div className="dav-metric">
          <span className="dav-metric-label">quorum</span>
          <span className={`dav-metric-value ${current.mode ? (current.quorumOk ? 'is-ok' : 'is-bad') : ''}`}>
            {current.mode ? (current.quorumOk ? 'satisfied' : 'failed') : '—'}
          </span>
        </div>
        <div className="dav-metric">
          <span className="dav-metric-label">R + W &gt; N</span>
          <span className={`dav-metric-value ${strong ? 'is-ok' : 'is-bad'}`}>
            {current.r}+{current.w} {strong ? '> ' : '≤ '}{current.n} · {strong ? 'strong' : 'eventual'}
          </span>
        </div>
        <div className="dav-metric">
          <span className="dav-metric-label">conflict</span>
          <span className={`dav-metric-value ${conflict ? 'is-bad' : 'is-ok'}`}>{conflict ? 'siblings' : 'none'}</span>
        </div>
      </div>

      <div className="dav-narration">
        <span className="dav-narration-label">trace</span>
        <span className="dav-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
