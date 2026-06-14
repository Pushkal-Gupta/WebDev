import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Cpu, Database, Check, X, AlertTriangle } from 'lucide-react';
import './DeadlockViz.css';

// Deadlock and the four Coffman conditions, via a resource-allocation graph.
//
//   Processes P1, P2 (circles) and resources R1, R2 (squares, single-instance).
//   assignment edge  R -> P : resource R is currently HELD by process P.
//   request edge     P -> R : process P is WAITING for resource R.
//
// Scenario (classic two-process / two-resource deadlock):
//   1. P1 acquires R1            -> assignment edge R1 -> P1
//   2. P2 acquires R2            -> assignment edge R2 -> P2
//   3. P1 requests R2 (held P2)  -> request edge   P1 -> R2  (P1 blocks)
//   4. P2 requests R1 (held P1)  -> request edge   P2 -> R1  (P2 blocks)
//        cycle  P1 -> R2 -> P2 -> R1 -> P1  => circular wait => DEADLOCK.
//
// The four Coffman conditions must ALL hold for deadlock. The reader can toggle any
// one OFF (a prevention strategy) and the same scenario no longer deadlocks:
//   - mutual exclusion off  : resources become shareable, no edge ever blocks.
//   - hold and wait off     : a process must request everything up front (all-or-nothing),
//                             so P1 never holds R1 while waiting for R2.
//   - no preemption off     : the system can forcibly take R1 back from P1 to break the wait.
//   - circular wait off     : resources are globally ordered, both processes lock R1
//                             before R2, so the request edges can never close a cycle.

const PROCS = ['P1', 'P2'];
const RES = ['R1', 'R2'];

const CONDITIONS = [
  { key: 'mutex', label: 'Mutual Exclusion', short: 'a resource is held by at most one process at a time' },
  { key: 'holdwait', label: 'Hold and Wait', short: 'a process holds resources while requesting more' },
  { key: 'nopreempt', label: 'No Preemption', short: 'a held resource cannot be forcibly taken away' },
  { key: 'circular', label: 'Circular Wait', short: 'a closed chain of processes each waiting on the next' },
];

// Detect a cycle in the wait-for / resource-allocation directed graph.
// edges: array of { from, to } over node ids (process + resource ids).
// Returns the ordered node-id cycle (closed: first === last) or null.
function findCycle(nodeIds, edges) {
  const adj = new Map(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    if (adj.has(e.from)) adj.get(e.from).push(e.to);
  }
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const color = new Map(nodeIds.map((id) => [id, WHITE]));
  const parent = new Map();
  let cycleStart = null;
  let cycleEnd = null;

  const dfs = (u) => {
    color.set(u, GREY);
    for (const v of adj.get(u) || []) {
      if (color.get(v) === WHITE) {
        parent.set(v, u);
        if (dfs(v)) return true;
      } else if (color.get(v) === GREY) {
        cycleStart = v;
        cycleEnd = u;
        return true;
      }
    }
    color.set(u, BLACK);
    return false;
  };

  for (const id of nodeIds) {
    if (color.get(id) === WHITE && dfs(id)) break;
  }
  if (cycleStart == null) return null;

  const path = [cycleEnd];
  let cur = cycleEnd;
  while (cur !== cycleStart) {
    cur = parent.get(cur);
    path.push(cur);
  }
  path.reverse();
  path.push(cycleStart);
  return path;
}

// Build the immutable frame trace for the scenario under the given prevention toggle.
// conditions: { mutex, holdwait, nopreempt, circular } booleans (true = condition holds).
function buildFrames(conditions) {
  const { mutex, holdwait, nopreempt, circular } = conditions;
  const frames = [];

  // edges keyed by a stable id so the SVG can animate them appearing.
  const edges = [];
  const procState = { P1: 'running', P2: 'running' };

  const snap = (extra) => {
    const present = [...edges.map((e) => ({ ...e }))];
    const nodeIds = [...PROCS, ...RES];
    const cyclePath = findCycle(nodeIds, present);
    const cycleSet = new Set();
    if (cyclePath) {
      for (let i = 0; i + 1 < cyclePath.length; i += 1) {
        cycleSet.add(`${cyclePath[i]}->${cyclePath[i + 1]}`);
      }
    }
    return {
      edges: present,
      proc: { ...procState },
      cyclePath,
      cycleSet,
      activeEdge: -1,
      activeProc: null,
      note: '',
      phase: 'run',
      ...extra,
    };
  };

  // Which conditions currently hold (a broken toggle flips the matching one false).
  const held = {
    mutex,
    holdwait,
    nopreempt,
    circular,
  };

  frames.push(snap({
    phase: 'init',
    held,
    note: `Resource-allocation graph. Two single-instance resources (R1, R2) and two processes (P1, P2). An arrow R->P means the resource is held by that process; an arrow P->R means the process is waiting for it. All four Coffman conditions hold by default — watch them turn true as the scenario runs, and a cycle close into deadlock.${
      mutex && holdwait && nopreempt && circular ? '' : ' One condition has been switched OFF (a prevention strategy), so the deadlock should be averted.'
    }`,
  }));

  // If mutual exclusion is broken, resources are shareable: no request ever blocks.
  if (!mutex) {
    edges.push({ id: 'a1', from: 'R1', to: 'P1', kind: 'assign' });
    frames.push(snap({ phase: 'acquire', activeProc: 'P1', activeEdge: edges.length - 1, held, note: 'P1 acquires R1. assignment edge R1 -> P1.' }));
    edges.push({ id: 'a2', from: 'R2', to: 'P2', kind: 'assign' });
    frames.push(snap({ phase: 'acquire', activeProc: 'P2', activeEdge: edges.length - 1, held, note: 'P2 acquires R2. assignment edge R2 -> P2.' }));
    // Sharing: requests are granted immediately, drawn as a second assignment edge.
    edges.push({ id: 'a3', from: 'R2', to: 'P1', kind: 'assign' });
    frames.push(snap({ phase: 'share', activeProc: 'P1', activeEdge: edges.length - 1, held, note: 'MUTUAL EXCLUSION is OFF: R2 is shareable, so P1 is granted R2 immediately instead of waiting. No request edge, no blocking.' }));
    edges.push({ id: 'a4', from: 'R1', to: 'P2', kind: 'assign' });
    frames.push(snap({ phase: 'share', activeProc: 'P2', activeEdge: edges.length - 1, held, note: 'R1 is shareable too, so P2 also gets R1 without waiting. Both processes proceed.' }));
    frames.push(snap({ phase: 'safe', held, note: 'No process ever blocks because nothing is exclusively owned. No request edges exist, so no cycle can form. DEADLOCK PREVENTED by killing mutual exclusion (only works for truly shareable resources — read-only files, etc.).' }));
    return frames;
  }

  // Step 1: P1 acquires R1.
  edges.push({ id: 'a1', from: 'R1', to: 'P1', kind: 'assign' });
  frames.push(snap({ phase: 'acquire', activeProc: 'P1', activeEdge: edges.length - 1, held, note: 'P1 acquires R1 (exclusive). assignment edge R1 -> P1. Mutual exclusion now holds: R1 has a single owner.' }));

  // Step 2: P2 acquires R2.
  edges.push({ id: 'a2', from: 'R2', to: 'P2', kind: 'assign' });
  frames.push(snap({ phase: 'acquire', activeProc: 'P2', activeEdge: edges.length - 1, held, note: 'P2 acquires R2 (exclusive). assignment edge R2 -> P2.' }));

  // If hold-and-wait is broken: a process must request all resources atomically up front.
  if (!holdwait) {
    frames.push(snap({ phase: 'safe', held, note: 'HOLD AND WAIT is OFF: each process must request ALL its resources atomically before it starts. P1 could not get R1 and R2 both, so it released R1 and retried later; it never holds one while waiting for the other. With no "hold while waiting", the request that would close the cycle is never issued. DEADLOCK PREVENTED.' }));
    return frames;
  }

  // If circular wait is broken: global ordering R1 < R2, so both lock R1 first then R2.
  if (!circular) {
    // P2 would actually have taken R1 first under the ordering; model the safe interleaving:
    // both want R1 then R2. P1 holds R1; P2 must wait for R1 (not R2), so the wait points
    // the SAME direction for everyone -> no cycle.
    edges.length = 0;
    edges.push({ id: 'a1', from: 'R1', to: 'P1', kind: 'assign' });
    frames.push(snap({ phase: 'acquire', activeProc: 'P1', activeEdge: edges.length - 1, held, note: 'CIRCULAR WAIT is OFF: resources are globally ordered R1 < R2, so EVERY process must take R1 before R2. P1 takes R1 first.' }));
    edges.push({ id: 'r2', from: 'P2', to: 'R1', kind: 'request' });
    procState.P2 = 'waiting';
    frames.push(snap({ phase: 'request', activeProc: 'P2', activeEdge: edges.length - 1, held, note: 'P2 also needs R1 first (it may not grab R2 ahead of R1). R1 is held by P1, so P2 waits for R1: request edge P2 -> R1. Both wait-arrows point toward the lower-ordered resource — they can never form a loop.' }));
    edges.push({ id: 'a2', from: 'R2', to: 'P1', kind: 'assign' });
    frames.push(snap({ phase: 'acquire', activeProc: 'P1', activeEdge: edges.length - 1, held, note: 'P1 now takes R2 (its higher resource), finishes, and will release both. No cycle ever existed. DEADLOCK PREVENTED by ordering resources.' }));
    procState.P1 = 'done';
    frames.push(snap({ phase: 'safe', held, note: 'P1 releases R1 and R2; P2 then acquires R1 and proceeds. A global resource order makes circular wait impossible: a cycle would require some process to wait "downward", which the ordering forbids.' }));
    return frames;
  }

  // Step 3: P1 requests R2 (held by P2) -> P1 blocks.
  edges.push({ id: 'r1', from: 'P1', to: 'R2', kind: 'request' });
  procState.P1 = 'waiting';
  frames.push(snap({ phase: 'request', activeProc: 'P1', activeEdge: edges.length - 1, held, note: 'P1 requests R2, but R2 is held by P2. Request edge P1 -> R2. P1 cannot get it (mutual exclusion), and it keeps R1 (hold-and-wait), so P1 BLOCKS — still holding R1.' }));

  // Step 4: P2 requests R1 (held by P1) -> closes the cycle.
  edges.push({ id: 'r2', from: 'P2', to: 'R1', kind: 'request' });
  procState.P2 = 'waiting';
  const closing = snap({
    phase: 'cycle',
    activeProc: 'P2',
    activeEdge: edges.length - 1,
    held,
    note: 'P2 requests R1, held by P1. Request edge P2 -> R1 closes the chain P1 -> R2 -> P2 -> R1 -> P1. Every process waits on a resource the next one holds = CIRCULAR WAIT. All four conditions now hold simultaneously.',
  });
  frames.push(closing);

  // Deadlock: no preemption means nobody can be forced to give up a resource.
  if (nopreempt) {
    frames.push(snap({
      phase: 'deadlock',
      held,
      note: 'DEADLOCK. The cycle P1 -> R2 -> P2 -> R1 -> P1 is highlighted. Neither process can progress, and No Preemption means the OS may not yank a resource back to break it. P1 and P2 wait forever. All four Coffman conditions hold — that is exactly the deadlock recipe.',
    }));
  } else {
    // No-preemption broken: the OS preempts R1 from P1, breaking the cycle.
    // Remove R1->P1 (preempted) and P2->R1 wait is satisfied: R1 -> P2.
    const idx = edges.findIndex((e) => e.id === 'a1');
    if (idx >= 0) edges.splice(idx, 1);
    const ridx = edges.findIndex((e) => e.id === 'r2');
    if (ridx >= 0) edges.splice(ridx, 1);
    edges.push({ id: 'a3', from: 'R1', to: 'P2', kind: 'assign' });
    procState.P2 = 'running';
    frames.push(snap({
      phase: 'preempt',
      activeProc: 'P2',
      held,
      note: 'NO PREEMPTION is OFF: the OS forcibly preempts R1 from P1 (rolling P1 back) and grants it to P2. The edge R1 -> P1 disappears and the cycle is broken — R1 -> P2 now. P2 proceeds.',
    }));
    frames.push(snap({
      phase: 'safe',
      held,
      note: 'No cycle remains. P2 finishes and releases R1 and R2; P1 retries and completes. DEADLOCK PREVENTED by allowing preemption (the cost is rollback / lost work for the preempted process).',
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1150;

const NODE_POS = {
  P1: { x: 180, y: 120, type: 'proc' },
  P2: { x: 180, y: 320, type: 'proc' },
  R1: { x: 470, y: 120, type: 'res' },
  R2: { x: 470, y: 320, type: 'res' },
};

const PROC_R = 34;
const RES_HALF = 30;

export default function DeadlockViz() {
  const [conditions, setConditions] = useState({ mutex: true, holdwait: true, nopreempt: true, circular: true });
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(conditions), [conditions]);
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

  const toggleCondition = (key) => {
    setIsRunning(false);
    setStep(0);
    setConditions((c) => ({ ...c, [key]: !c[key] }));
  };

  const W = 650;
  const H = 440;

  const isDeadlock = current.phase === 'deadlock';
  const hasCycle = !!current.cyclePath;
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // Geometry helper: endpoints trimmed to the node boundary so arrowheads sit on the edge.
  const edgeGeom = (from, to) => {
    const a = NODE_POS[from];
    const b = NODE_POS[to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const ra = a.type === 'proc' ? PROC_R : RES_HALF + 6;
    const rb = b.type === 'proc' ? PROC_R + 4 : RES_HALF + 10;
    return {
      x1: a.x + ux * ra,
      y1: a.y + uy * ra,
      x2: b.x - ux * rb,
      y2: b.y - uy * rb,
    };
  };

  const deadlockedProcs = isDeadlock || (hasCycle && current.phase === 'cycle')
    ? PROCS.filter((p) => current.proc[p] === 'waiting')
    : [];

  const conditionsAllHold = current.held
    ? CONDITIONS.every((c) => current.held[c.key])
    : false;

  // A condition counts as "active/true right now" once the scenario has reached the
  // step that establishes it. We derive that from the live graph + phase.
  const condTrueNow = (key) => {
    if (!current.held[key]) return false;
    if (key === 'mutex') {
      return current.edges.some((e) => e.kind === 'assign');
    }
    if (key === 'holdwait') {
      // a process holds something AND is requesting something else.
      return PROCS.some((p) => {
        const holds = current.edges.some((e) => e.kind === 'assign' && e.to === p);
        const waits = current.edges.some((e) => e.kind === 'request' && e.from === p);
        return holds && waits;
      });
    }
    if (key === 'nopreempt') {
      // holds true the whole run (default); only false if preemption happened.
      return current.phase !== 'preempt' && current.phase !== 'safe';
    }
    if (key === 'circular') {
      return hasCycle;
    }
    return false;
  };

  return (
    <div className="dlv">
      <div className="dlv-head">
        <h3 className="dlv-title">Deadlock and the four Coffman conditions</h3>
        <p className="dlv-sub">
          Step a classic two-process / two-resource scenario in a resource-allocation graph. P1 holds R1 and wants R2;
          P2 holds R2 and wants R1 — the request edges close a cycle, and all four conditions hold at once: deadlock.
          Toggle any condition off to apply that prevention strategy and watch the deadlock disappear.
        </p>
      </div>

      <div className="dlv-controls">
        <div className="dlv-buttons">
          <button
            type="button"
            className="dlv-btn dlv-btn-primary"
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
            className="dlv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dlv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dlv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <label className="dlv-speed">
          <span className="dlv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dlv-speed-range"
            aria-label="Playback speed"
          />
          <span className="dlv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dlv-spacer" aria-hidden="true" />

        <div className="dlv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dlv-body">
        <div className="dlv-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="dlv-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="dlv-arrow-assign" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className="dlv-ah-assign" />
              </marker>
              <marker id="dlv-arrow-request" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className="dlv-ah-request" />
              </marker>
              <marker id="dlv-arrow-cycle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className="dlv-ah-cycle" />
              </marker>
            </defs>

            <text className="dlv-legend" x={20} y={28}>
              R -&gt; P held · P -&gt; R waiting
            </text>
            {hasCycle && (
              <g className={`dlv-cyclebadge ${isDeadlock ? 'is-dead' : ''}`} transform={`translate(${W - 188}, 14)`}>
                <rect className="dlv-cyclebadge-bg" x={0} y={0} width={172} height={26} rx={13} />
                <g transform="translate(10, 5)">
                  <AlertTriangle width={15} height={15} className="dlv-ic is-bad" />
                </g>
                <text className="dlv-cyclebadge-text" x={32} y={18}>
                  {isDeadlock ? 'DEADLOCK · cycle' : 'cycle detected'}
                </text>
              </g>
            )}

            {/* edges */}
            {current.edges.map((e, i) => {
              const g = edgeGeom(e.from, e.to);
              const inCycle = current.cycleSet.has(`${e.from}->${e.to}`);
              const isActive = i === current.activeEdge;
              const tone = inCycle ? 'cycle' : e.kind;
              return (
                <g key={e.id}>
                  <line
                    className={`dlv-edge is-${tone} ${isActive ? 'is-hot' : ''} ${inCycle && isDeadlock ? 'is-dead' : ''}`}
                    x1={g.x1}
                    y1={g.y1}
                    x2={g.x2}
                    y2={g.y2}
                    markerEnd={`url(#dlv-arrow-${tone})`}
                  />
                </g>
              );
            })}

            {/* resources (squares, single instance) */}
            {RES.map((id) => {
              const p = NODE_POS[id];
              const held = current.edges.find((e) => e.kind === 'assign' && e.from === id);
              return (
                <g key={id}>
                  <rect
                    className={`dlv-res ${held ? 'is-held' : ''}`}
                    x={p.x - RES_HALF}
                    y={p.y - RES_HALF}
                    width={RES_HALF * 2}
                    height={RES_HALF * 2}
                    rx={8}
                  />
                  <g transform={`translate(${p.x - 9}, ${p.y - 20})`}>
                    <Database width={18} height={18} className="dlv-ic" />
                  </g>
                  <text className="dlv-node-label" x={p.x} y={p.y + 16}>{id}</text>
                  <circle className="dlv-res-dot" cx={p.x + RES_HALF - 9} cy={p.y - RES_HALF + 9} r={3.5} />
                </g>
              );
            })}

            {/* processes (circles) */}
            {PROCS.map((id) => {
              const p = NODE_POS[id];
              const st = current.proc[id];
              const isWaiting = st === 'waiting';
              const isDead = isDeadlock && deadlockedProcs.includes(id);
              const isActive = current.activeProc === id;
              return (
                <g key={id}>
                  <circle
                    className={`dlv-proc ${isWaiting ? 'is-waiting' : ''} ${isDead ? 'is-dead' : ''} ${isActive ? 'is-active' : ''}`}
                    cx={p.x}
                    cy={p.y}
                    r={PROC_R}
                  />
                  <g transform={`translate(${p.x - 9}, ${p.y - 22})`}>
                    <Cpu width={18} height={18} className="dlv-ic" />
                  </g>
                  <text className="dlv-node-label" x={p.x} y={p.y + 8}>{id}</text>
                  <text className={`dlv-proc-state ${isWaiting ? 'is-waiting' : ''} ${isDead ? 'is-dead' : ''}`} x={p.x} y={p.y + 24}>
                    {isDead ? 'deadlocked' : st}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="dlv-side">
          <div className="dlv-checklist">
            <div className="dlv-checklist-head">
              <span className="dlv-checklist-title">Coffman conditions</span>
              <span className={`dlv-checklist-tag ${conditionsAllHold ? 'is-on' : 'is-off'}`}>
                {conditionsAllHold ? 'all four can hold' : 'one prevented'}
              </span>
            </div>
            {CONDITIONS.map((c) => {
              const enabled = current.held[c.key];
              const trueNow = condTrueNow(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`dlv-cond ${enabled ? '' : 'is-disabled'} ${trueNow ? 'is-true' : ''}`}
                  onClick={() => toggleCondition(c.key)}
                  aria-pressed={!enabled}
                  title={enabled ? `Toggle OFF to prevent via "${c.label}"` : 'Toggle back ON'}
                >
                  <span className={`dlv-cond-check ${trueNow ? 'is-true' : enabled ? 'is-pending' : 'is-off'}`}>
                    {!enabled ? <X width={13} height={13} /> : trueNow ? <Check width={13} height={13} /> : null}
                  </span>
                  <span className="dlv-cond-body">
                    <span className="dlv-cond-label">{c.label}</span>
                    <span className="dlv-cond-short">{enabled ? c.short : 'broken (prevention applied)'}</span>
                  </span>
                </button>
              );
            })}
            <p className="dlv-checklist-hint">Click a condition to break it. Deadlock needs all four — remove any one and it cannot form.</p>
          </div>

          <div className="dlv-metrics">
            <div className="dlv-metric">
              <span className="dlv-metric-label">cycle present</span>
              <span className={`dlv-metric-value ${hasCycle ? 'is-bad' : 'is-ok'}`}>{hasCycle ? 'yes' : 'no'}</span>
            </div>
            <div className="dlv-metric">
              <span className="dlv-metric-label">deadlocked</span>
              <span className={`dlv-metric-value ${deadlockedProcs.length ? 'is-bad' : 'is-ok'}`}>
                {deadlockedProcs.length ? deadlockedProcs.join(', ') : 'none'}
              </span>
            </div>
            <div className="dlv-metric">
              <span className="dlv-metric-label">cycle path</span>
              <span className="dlv-metric-value dlv-metric-mono">
                {current.cyclePath ? current.cyclePath.join(' -> ') : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`dlv-narration ${isDeadlock ? 'is-dead' : current.phase === 'safe' ? 'is-safe' : ''}`}>
        <span className="dlv-narration-label">
          {isDeadlock ? 'deadlock' : current.phase === 'safe' ? 'prevented' : current.phase === 'cycle' ? 'circular wait' : 'trace'}
        </span>
        <span className="dlv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
