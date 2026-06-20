import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './BulkheadIsolationViz.css';

const MODES = [
  { key: 'shared', label: 'SHARED POOL' },
  { key: 'isolated', label: 'BULKHEADS' },
];

// Three downstream dependencies the service fans out to.
// B is the bad neighbour: it goes slow, so its calls hold a thread for a long
// time. A and C stay fast. The whole point is what that does to the others.
const DEPS = [
  { key: 'A', label: 'Dep A', slow: false },
  { key: 'B', label: 'Dep B', slow: true },
  { key: 'C', label: 'Dep C', slow: false },
];

// A fixed arrival schedule: at each tick, how many requests come in for A / B / C.
// Designed so B's stuck threads accumulate and the shared pool saturates, while
// in isolated mode B's own bulkhead saturates but A and C keep flowing.
const ARRIVALS = [
  { A: 1, B: 1, C: 1 },
  { A: 1, B: 2, C: 1 },
  { A: 1, B: 2, C: 1 },
  { A: 1, B: 3, C: 1 },
  { A: 2, B: 3, C: 2 },
  { A: 1, B: 3, C: 1 },
  { A: 2, B: 2, C: 2 },
  { A: 1, B: 2, C: 1 },
];

const SHARED_POOL = 10;     // total threads in the one shared pool
const BULKHEAD_SIZE = 4;    // fixed slots per dependency when isolated
const SLOW_HOLD = 4;        // ticks a slow (B) request occupies a thread
const FAST_HOLD = 1;        // ticks a fast (A/C) request occupies a thread

// Build the full step trace for one mode. We simulate a discrete-time thread
// pool. Each frame is a fully-resolved snapshot of pool occupancy, per-dep
// served/rejected counters, and a narration line.
//
// shared mode  : one pool of SHARED_POOL threads shared by A, B, C.
// isolated mode: A, B, C each get their own BULKHEAD_SIZE-slot pool.
//
// Order each tick: (1) release threads whose hold expired, (2) admit arrivals
// into free slots in fan order A,B,C; arrivals that find no slot are REJECTED.
function buildFrames(mode) {
  const frames = [];
  const isShared = mode === 'shared';

  // active[dep] = array of remaining-hold integers, one per occupied thread.
  // In shared mode all three feed one logical pool but we still track per-dep
  // occupancy so we can colour the pool and prove who is holding the threads.
  const active = { A: [], B: [], C: [] };
  const served = { A: 0, B: 0, C: 0 };
  const rejected = { A: 0, B: 0, C: 0 };

  const occ = (d) => active[d].length;
  const totalOcc = () => occ('A') + occ('B') + occ('C');
  const freeFor = (d) => (isShared ? SHARED_POOL - totalOcc() : BULKHEAD_SIZE - occ(d));

  const snap = (extra) => ({
    occ: { A: occ('A'), B: occ('B'), C: occ('C') },
    served: { ...served },
    rejected: { ...rejected },
    totalOcc: totalOcc(),
    t: -1,
    phase: 'init',
    activeDep: null,
    admittedNow: { A: 0, B: 0, C: 0 },
    rejectedNow: { A: 0, B: 0, C: 0 },
    releasedNow: 0,
    ...extra,
  });

  const poolCap = isShared ? SHARED_POOL : BULKHEAD_SIZE;
  frames.push(snap({
    note: isShared
      ? `SHARED POOL: one pool of ${SHARED_POOL} threads serves A, B and C. Dep B is slow — each B call holds a thread for ${SLOW_HOLD} ticks. Watch B's stuck threads eat the shared pool until A and C calls can't get a thread either.`
      : `BULKHEADS: A, B and C each get their own isolated pool of ${BULKHEAD_SIZE} slots. Dep B is still slow (${SLOW_HOLD}-tick hold), but its stuck threads can only fill B's own bulkhead — A and C have dedicated slots that B can never touch.`,
    poolCap,
  }));

  for (let t = 0; t < ARRIVALS.length; t++) {
    // Phase 1: release expired threads (calls that completed this tick).
    let released = 0;
    DEPS.forEach((d) => {
      const before = active[d.key].length;
      active[d.key] = active[d.key]
        .map((h) => h - 1)
        .filter((h) => h > 0);
      released += before - active[d.key].length;
    });
    frames.push(snap({
      t,
      phase: 'release',
      releasedNow: released,
      poolCap,
      note: released > 0
        ? `t=${t}: ${released} call${released === 1 ? '' : 's'} finished and released their thread${released === 1 ? '' : 's'}. Fast A/C calls finish in ${FAST_HOLD} tick; slow B calls only free up after ${SLOW_HOLD}. ${isShared ? `Shared pool now ${totalOcc()}/${SHARED_POOL}.` : 'Each bulkhead drains independently.'}`
        : `t=${t}: no calls completed yet — slow B calls are still holding their threads (${SLOW_HOLD}-tick hold). ${isShared ? `Shared pool ${totalOcc()}/${SHARED_POOL}.` : ''}`.trim(),
    }));

    // Phase 2: admit arrivals in fan order A, B, C.
    const arr = ARRIVALS[t];
    const admittedNow = { A: 0, B: 0, C: 0 };
    const rejectedNow = { A: 0, B: 0, C: 0 };
    DEPS.forEach((d) => {
      const want = arr[d.key];
      for (let i = 0; i < want; i++) {
        if (freeFor(d.key) > 0) {
          active[d.key].push(d.slow ? SLOW_HOLD : FAST_HOLD);
          served[d.key] += 1;
          admittedNow[d.key] += 1;
        } else {
          rejected[d.key] += 1;
          rejectedNow[d.key] += 1;
        }
      }
    });

    const aAdm = admittedNow.A; const aRej = rejectedNow.A;
    const bAdm = admittedNow.B; const bRej = rejectedNow.B;
    const cAdm = admittedNow.C; const cRej = rejectedNow.C;
    const collateral = (aRej > 0 || cRej > 0);

    let note;
    if (isShared) {
      if (collateral) {
        note = `t=${t}: B's stuck threads have the shared pool at ${totalOcc()}/${SHARED_POOL}. Now A and C requests also find NO free thread -> A rejected ${aRej}, C rejected ${cRej}. One slow dependency starved the whole service.`;
      } else if (bRej > 0) {
        note = `t=${t}: pool filling (${totalOcc()}/${SHARED_POOL}). B took what slots it could, ${bRej} B rejected. A,C still squeezed in for now — but B's threads won't release for ${SLOW_HOLD} ticks.`;
      } else {
        note = `t=${t}: admitted A ${aAdm}, B ${bAdm}, C ${cAdm}. Shared pool now ${totalOcc()}/${SHARED_POOL}. Fine for now — but B's calls hold their threads while A,C release theirs next tick.`;
      }
    } else if (bRej > 0) {
      note = `t=${t}: B's bulkhead is full at ${occ('B')}/${BULKHEAD_SIZE} (slow calls stuck) -> B rejects ${bRej} FAST, failing only itself. A admitted ${aAdm} (${occ('A')}/${BULKHEAD_SIZE}), C admitted ${cAdm} (${occ('C')}/${BULKHEAD_SIZE}) — untouched. Failure contained.`;
    } else {
      note = `t=${t}: admitted A ${aAdm}, B ${bAdm}, C ${cAdm} into their own pools (A ${occ('A')}/${BULKHEAD_SIZE}, B ${occ('B')}/${BULKHEAD_SIZE}, C ${occ('C')}/${BULKHEAD_SIZE}). B is loading up but A and C have dedicated slots.`;
    }

    frames.push(snap({
      t,
      phase: 'admit',
      admittedNow,
      rejectedNow,
      poolCap,
      note,
    }));
  }

  // Drain phase: let remaining calls finish so the contrast settles.
  let dt = ARRIVALS.length;
  while (totalOcc() > 0) {
    let released = 0;
    DEPS.forEach((d) => {
      const before = active[d.key].length;
      active[d.key] = active[d.key].map((h) => h - 1).filter((h) => h > 0);
      released += before - active[d.key].length;
    });
    frames.push(snap({
      t: dt,
      phase: 'drain',
      releasedNow: released,
      poolCap,
      note: `t=${dt}: no new arrivals — in-flight calls drain. ${released} released, ${totalOcc()} still busy (the last of B's slow calls).`,
    }));
    dt += 1;
  }

  const sTot = served.A + served.B + served.C;
  const rTot = rejected.A + rejected.B + rejected.C;
  const healthy = rejected.A === 0 && rejected.C === 0;
  frames.push(snap({
    t: dt,
    phase: 'done',
    poolCap,
    note: isShared
      ? `Done. Served ${sTot}, rejected ${rTot} (A ${rejected.A}, B ${rejected.B}, C ${rejected.C}). One slow dependency took down requests to A and C too — the failure was NOT contained. This is the case bulkheads exist to prevent.`
      : `Done. Served ${sTot}, rejected ${rTot} (A ${rejected.A}, B ${rejected.B}, C ${rejected.C}). ${healthy ? 'A and C lost ZERO requests' : 'A and C stayed healthy'} — only B shed load when its bulkhead filled. Failure contained: the service degraded, it did not go down.`,
  }));

  return frames;
}

const SERVICE_HEALTH = (current, mode) => {
  // Healthy if no dep rejecting; degraded if only the slow dep rejects; down if
  // healthy deps (A or C) are being rejected (shared-pool collapse).
  const r = current.rejected;
  if (r.A > 0 || r.C > 0) return mode === 'shared' ? 'DOWN' : 'DEGRADED';
  if (r.B > 0) return 'DEGRADED';
  return 'HEALTHY';
};

export default function BulkheadIsolationViz() {
  const [mode, setMode] = useState('shared');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode), [mode]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const isShared = mode === 'shared';
  const health = SERVICE_HEALTH(current, mode);

  // SVG geometry
  const W = 940;
  const H = 440;

  // Service node (left), pools (right). Slots drawn as a grid of cells.
  const svcX = 40;
  const svcY = 168;
  const svcW = 150;
  const svcH = 104;

  const depColor = (key) => (key === 'B' ? 'var(--hard)' : key === 'A' ? 'var(--hue-sky)' : 'var(--hue-mint)');

  // Layout for the pools region.
  const poolsX = 320;
  const poolsW = W - poolsX - 30;
  const cell = 30;
  const cellGap = 8;

  // Render a pool of `cap` slots, `used` of them occupied (we colour the first
  // `used` cells). For shared mode we render one wide pool whose cells are
  // coloured by which dep currently holds them (B first, then A, then C — the
  // order they pile up). For isolated we render three small pools.
  const renderSharedPool = () => {
    const cap = SHARED_POOL;
    const o = current.occ;
    // Colour map per occupied cell: B's threads first (they're the stuck ones),
    // then A, then C — so the visual shows B crowding everyone out.
    const cellDeps = [];
    for (let i = 0; i < o.B; i++) cellDeps.push('B');
    for (let i = 0; i < o.A; i++) cellDeps.push('A');
    for (let i = 0; i < o.C; i++) cellDeps.push('C');
    const perRow = 5;
    const gridX = poolsX + 40;
    const gridY = 120;
    return (
      <g>
        <text className="bhv-pool-title" x={gridX} y={gridY - 26}>Shared thread pool</text>
        <text className="bhv-pool-sub" x={gridX} y={gridY - 10}>{current.totalOcc}/{cap} threads busy</text>
        {Array.from({ length: cap }).map((_, i) => {
          const row = Math.floor(i / perRow);
          const col = i % perRow;
          const x = gridX + col * (cell + cellGap);
          const y = gridY + row * (cell + cellGap);
          const dep = cellDeps[i];
          const filled = i < current.totalOcc;
          return (
            <rect
              key={`cell-${i}`}
              className={`bhv-slot ${filled ? 'is-busy' : ''}`}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={5}
              style={filled ? { fill: depColor(dep), stroke: depColor(dep) } : undefined}
            />
          );
        })}
        {/* legend */}
        <g transform={`translate(${gridX + 230}, ${gridY})`}>
          {DEPS.map((d, i) => (
            <g key={d.key} transform={`translate(0, ${i * 26})`}>
              <rect className="bhv-legend-sw" x={0} y={-11} width={14} height={14} rx={3} style={{ fill: depColor(d.key), stroke: depColor(d.key) }} />
              <text className="bhv-legend-tx" x={22} y={0}>
                {d.label}{d.slow ? ' (slow)' : ''} — {current.occ[d.key]} held
              </text>
            </g>
          ))}
        </g>
        {(current.rejectedNow.A > 0 || current.rejectedNow.C > 0) && (
          <text className="bhv-collapse" x={gridX} y={gridY + 110}>
            A &amp; C blocked — service starved by B
          </text>
        )}
      </g>
    );
  };

  const renderIsolatedPools = () => {
    const cap = BULKHEAD_SIZE;
    const colW = poolsW / 3;
    return (
      <g>
        {DEPS.map((d, di) => {
          const baseX = poolsX + di * colW + 18;
          const gridY = 116;
          const used = current.occ[d.key];
          const full = used >= cap;
          const rejecting = current.rejectedNow[d.key] > 0;
          return (
            <g key={d.key}>
              <text className="bhv-pool-title" x={baseX} y={gridY - 26} style={{ fill: depColor(d.key) }}>
                {d.label}{d.slow ? ' (slow)' : ''}
              </text>
              <text className="bhv-pool-sub" x={baseX} y={gridY - 10}>{used}/{cap} slots</text>
              <rect
                className={`bhv-bulkhead ${full ? 'is-full' : ''}`}
                x={baseX - 8}
                y={gridY - 6}
                width={cell + 16}
                height={cap * (cell + cellGap) + 4}
                rx={8}
                style={full ? { stroke: depColor(d.key) } : undefined}
              />
              {Array.from({ length: cap }).map((_, i) => {
                const y = gridY + i * (cell + cellGap);
                const filled = i < used;
                return (
                  <rect
                    key={`cell-${d.key}-${i}`}
                    className={`bhv-slot ${filled ? 'is-busy' : ''}`}
                    x={baseX}
                    y={y}
                    width={cell}
                    height={cell}
                    rx={5}
                    style={filled ? { fill: depColor(d.key), stroke: depColor(d.key) } : undefined}
                  />
                );
              })}
              {rejecting && (
                <text className="bhv-reject-tag" x={baseX + cell / 2} y={gridY + cap * (cell + cellGap) + 22} textAnchor="middle">
                  rejects fast
                </text>
              )}
              {!rejecting && !d.slow && (
                <text className="bhv-ok-tag" x={baseX + cell / 2} y={gridY + cap * (cell + cellGap) + 22} textAnchor="middle">
                  healthy
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // arrival/flow indicators near the service node for the current tick.
  const arr = current.phase === 'admit' && current.t >= 0 ? ARRIVALS[current.t] : null;

  const sTot = current.served.A + current.served.B + current.served.C;
  const rTot = current.rejected.A + current.rejected.B + current.rejected.C;

  return (
    <div className="bhv">
      <div className="bhv-head">
        <h3 className="bhv-title">Bulkhead isolation — containing a slow dependency</h3>
        <p className="bhv-sub">
          A service fans out to three dependencies. B goes slow and holds its threads. With one shared pool,
          B starves A and C too; with a bulkhead per dependency, B fails alone and the service degrades instead of dies.
        </p>
      </div>

      <div className="bhv-controls">
        <div className="bhv-modes" role="tablist" aria-label="Isolation mode">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`bhv-mode ${mode === m.key ? 'is-on' : ''}`}
              onClick={() => switchMode(m.key)}
              aria-pressed={mode === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="bhv-speed">
          <span className="bhv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bhv-speed-range"
            aria-label="Playback speed"
          />
          <span className="bhv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="bhv-spacer" aria-hidden="true" />

        <div className="bhv-buttons">
          <button
            type="button"
            className="bhv-btn bhv-btn-primary"
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
            className="bhv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="bhv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="bhv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="bhv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="bhv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bhv-svg" preserveAspectRatio="xMidYMid meet">
          {/* service node */}
          <rect
            className={`bhv-svc ${health === 'DOWN' ? 'is-down' : health === 'DEGRADED' ? 'is-degraded' : 'is-healthy'}`}
            x={svcX}
            y={svcY}
            width={svcW}
            height={svcH}
            rx={12}
          />
          <text className="bhv-svc-title" x={svcX + svcW / 2} y={svcY + 34} textAnchor="middle">Service</text>
          <text className="bhv-svc-sub" x={svcX + svcW / 2} y={svcY + 54} textAnchor="middle">fans out to A·B·C</text>
          <text
            className={`bhv-svc-health ${health === 'DOWN' ? 'is-down' : health === 'DEGRADED' ? 'is-degraded' : 'is-healthy'}`}
            x={svcX + svcW / 2}
            y={svcY + 80}
            textAnchor="middle"
          >
            {health}
          </text>

          {/* fan-out arrows from service to the pools region */}
          {DEPS.map((d, i) => {
            const y1 = svcY + 26 + i * 26;
            const reqNow = arr ? arr[d.key] : 0;
            const rejNow = current.rejectedNow ? current.rejectedNow[d.key] : 0;
            const active = current.phase === 'admit' && reqNow > 0;
            const blocked = active && rejNow > 0 && (current.admittedNow ? current.admittedNow[d.key] === 0 : false);
            const stroke = blocked ? 'var(--hard)' : active ? depColor(d.key) : 'var(--border)';
            return (
              <g key={`fan-${d.key}`}>
                <line
                  className={`bhv-fan ${active ? 'is-active' : ''}`}
                  x1={svcX + svcW}
                  y1={y1}
                  x2={poolsX - 6}
                  y2={y1}
                  stroke={stroke}
                  strokeDasharray={blocked ? '5 4' : undefined}
                  markerEnd={`url(#bhv-arrow-${blocked ? 'rej' : d.key})`}
                />
                <text className="bhv-fan-label" x={(svcX + svcW + poolsX) / 2} y={y1 - 6} textAnchor="middle">
                  {d.key}{active ? ` +${reqNow}` : ''}{blocked ? ' blocked' : ''}
                </text>
              </g>
            );
          })}

          <defs>
            <marker id="bhv-arrow-A" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky)" />
            </marker>
            <marker id="bhv-arrow-B" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hard)" />
            </marker>
            <marker id="bhv-arrow-C" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-mint)" />
            </marker>
            <marker id="bhv-arrow-rej" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hard)" />
            </marker>
          </defs>

          {/* the pools */}
          {isShared ? renderSharedPool() : renderIsolatedPools()}

          {/* tick / phase badge */}
          <text className="bhv-tick" x={W - 30} y={32} textAnchor="end">
            {current.t >= 0 ? `t = ${current.t}` : 'init'} · {current.phase.toUpperCase()}
          </text>
        </svg>
      </div>

      <div className="bhv-metrics">
        <div className="bhv-metric">
          <span className="bhv-metric-label">mode</span>
          <span className="bhv-metric-value">{isShared ? 'SHARED POOL' : 'BULKHEADS'}</span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">service health</span>
          <span className={`bhv-metric-value ${health === 'DOWN' ? 'is-bad' : health === 'DEGRADED' ? 'is-warn' : 'is-ok'}`}>
            {health}
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">pool A</span>
          <span className="bhv-metric-value" style={{ color: depColor('A') }}>
            {current.occ.A}/{isShared ? SHARED_POOL : BULKHEAD_SIZE}
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">pool B (slow)</span>
          <span className="bhv-metric-value" style={{ color: depColor('B') }}>
            {current.occ.B}/{isShared ? SHARED_POOL : BULKHEAD_SIZE}
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">pool C</span>
          <span className="bhv-metric-value" style={{ color: depColor('C') }}>
            {current.occ.C}/{isShared ? SHARED_POOL : BULKHEAD_SIZE}
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">served · rejected</span>
          <span className="bhv-metric-value">
            <span className="is-ok">{sTot}</span> · <span className="is-bad">{rTot}</span>
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">A served / rej</span>
          <span className="bhv-metric-value" style={{ color: depColor('A') }}>
            {current.served.A} / {current.rejected.A}
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">B served / rej</span>
          <span className="bhv-metric-value" style={{ color: depColor('B') }}>
            {current.served.B} / {current.rejected.B}
          </span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">C served / rej</span>
          <span className="bhv-metric-value" style={{ color: depColor('C') }}>
            {current.served.C} / {current.rejected.C}
          </span>
        </div>
      </div>

      <div className="bhv-narration">
        <span className="bhv-narration-label">trace</span>
        <span className="bhv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
