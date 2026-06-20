import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Boxes, Waves } from 'lucide-react';
import './BulkheadPatternViz.css';

const DEPS = [
  { id: 'pay', label: 'Payments', color: 'var(--hue-sky)' },
  { id: 'search', label: 'Search', color: 'var(--hue-mint)' },
  { id: 'reco', label: 'Recommends', color: 'var(--hue-violet)' },
];

const SLOTS_PER_POOL = 4;
const SHARED_SLOTS = SLOTS_PER_POOL * DEPS.length;

// Fixed incoming-call script: which dependency each call targets, in arrival order.
// Replays a realistic mix weighted toward the dependency that gets flooded.
const SCRIPT = [
  'pay', 'search', 'reco', 'pay', 'search', 'pay', 'reco', 'pay',
  'search', 'pay', 'reco', 'pay', 'search', 'pay', 'reco', 'pay',
  'search', 'reco',
];

// A flooded dependency's calls hang and never release their slot.
// Healthy calls hold their slot for `HOLD` frames then release.
const HOLD = 2;

function depLabel(id) {
  return DEPS.find((d) => d.id === id)?.label || id;
}

// Build a frame trace for the given mode + flooded dependency.
// In 'bulkhead' mode each dependency owns its own pool of SLOTS_PER_POOL.
// In 'shared' mode all dependencies draw from one pool of SHARED_SLOTS.
function buildFrames(mode, flooded) {
  const frames = [];

  // Per-pool occupancy: array of slots, each null or { dep, callId, hung, ttl }.
  const pools = {};
  if (mode === 'bulkhead') {
    for (const d of DEPS) pools[d.id] = Array(SLOTS_PER_POOL).fill(null);
  } else {
    pools.shared = Array(SHARED_SLOTS).fill(null);
  }

  let served = 0;
  let rejected = 0;
  let callId = 0;

  const poolKey = (dep) => (mode === 'bulkhead' ? dep : 'shared');
  const totalFor = () => (mode === 'bulkhead' ? SLOTS_PER_POOL : SHARED_SLOTS);

  // Availability = fraction of dependencies that still have a free slot to serve.
  const availability = () => {
    let ok = 0;
    for (const d of DEPS) {
      const pool = pools[poolKey(d.id)];
      if (pool.some((s) => s === null)) ok += 1;
    }
    return Math.round((ok / DEPS.length) * 100);
  };

  const snap = (extra) => ({
    pools: mode === 'bulkhead'
      ? Object.fromEntries(DEPS.map((d) => [d.id, pools[d.id].map((s) => (s ? { ...s } : null))]))
      : { shared: pools.shared.map((s) => (s ? { ...s } : null)) },
    served,
    rejected,
    availability: availability(),
    decision: null,
    target: null,
    ...extra,
  });

  const tickReleases = () => {
    for (const key of Object.keys(pools)) {
      const pool = pools[key];
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        if (s && !s.hung) {
          s.ttl -= 1;
          if (s.ttl <= 0) pool[i] = null;
        }
      }
    }
  };

  const poolDesc = mode === 'bulkhead'
    ? `each dependency owns its own pool of ${SLOTS_PER_POOL} slots`
    : `all dependencies share one pool of ${SHARED_SLOTS} slots`;

  frames.push(snap({
    note: `${mode === 'bulkhead' ? 'BULKHEAD' : 'SHARED'} mode: ${poolDesc}. ${depLabel(flooded)} is flooded — its calls hang and never give their slot back. Step through the incoming calls and watch where the saturation lands.`,
  }));

  SCRIPT.forEach((dep) => {
    tickReleases();
    callId += 1;
    const key = poolKey(dep);
    const pool = pools[key];
    const free = pool.indexOf(null);
    const hung = dep === flooded;

    if (free >= 0) {
      pool[free] = { dep, callId, hung, ttl: HOLD };
      served += 1;
      const used = pool.filter(Boolean).length;
      frames.push(snap({
        decision: 'served',
        target: dep,
        note: hung
          ? `Call #${callId} -> ${depLabel(dep)} acquires slot ${free + 1} of ${totalFor()} in ${mode === 'bulkhead' ? 'its own' : 'the shared'} pool. ${depLabel(dep)} is flooded, so this call HANGS and holds the slot (${used}/${pool.length} used).`
          : `Call #${callId} -> ${depLabel(dep)} acquires slot ${free + 1} of ${totalFor()} and serves quickly (${used}/${pool.length} used).`,
      }));
    } else {
      rejected += 1;
      frames.push(snap({
        decision: 'rejected',
        target: dep,
        note: mode === 'bulkhead'
          ? `Call #${callId} -> ${depLabel(dep)} pool is full (${pool.length}/${pool.length}). REJECTED — but only ${depLabel(dep)} is starved; other pools keep serving.`
          : `Call #${callId} -> shared pool is full (${pool.length}/${pool.length}); the flooded ${depLabel(flooded)} hangs hog every slot. REJECTED — everything starves together.`,
      }));
    }
  });

  const avail = availability();
  frames.push(snap({
    note: mode === 'bulkhead'
      ? `Done. ${served} served, ${rejected} rejected. ${depLabel(flooded)}'s pool saturated, but the other two pools stayed independent — availability holds at ${avail}%. One sinking dependency cannot pull the rest under.`
      : `Done. ${served} served, ${rejected} rejected. The flooded ${depLabel(flooded)}'s hung calls consumed the whole shared pool, so healthy dependencies starved too — availability collapsed to ${avail}%.`,
  }));

  return frames;
}

export default function BulkheadPatternViz() {
  const [mode, setMode] = useState('bulkhead');
  const [flooded, setFlooded] = useState('pay');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode, flooded), [mode, flooded]);
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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const switchFlood = (id) => {
    if (id === flooded) return;
    setIsRunning(false);
    setStep(0);
    setFlooded(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — pools laid out as labelled slot grids across the stage.
  const W = 940;
  const H = 360;
  const slotW = 46;
  const slotH = 46;
  const slotGap = 10;

  // Per-dependency layout: three columns. In shared mode the single pool spans
  // the full width as a 4×3 grid, but we still group slots by their occupant's
  // color so the takeover is visible.
  const colW = (W - 80) / DEPS.length;
  const colX = (i) => 40 + i * colW;

  // Saturation per visible pool, for metrics.
  const poolStats = DEPS.map((d) => {
    const pool = mode === 'bulkhead' ? current.pools[d.id] : current.pools.shared;
    const used = pool.filter(Boolean).length;
    return { id: d.id, used, total: pool.length };
  });

  const sharedPool = mode === 'shared' ? current.pools.shared : null;

  const availColor = current.availability >= 66
    ? 'var(--easy)'
    : current.availability >= 34
      ? 'var(--medium)'
      : 'var(--hard)';

  return (
    <div className="bhv">
      <div className="bhv-head">
        <h3 className="bhv-title">Bulkhead pattern — isolate pools so one failure can&apos;t sink the ship</h3>
        <p className="bhv-sub">
          A service calls three downstream dependencies. Give each its own connection pool, or let them
          share one. Flood a dependency and watch how far the damage spreads.
        </p>
      </div>

      <div className="bhv-controls">
        <div className="bhv-modes" role="tablist" aria-label="Pool isolation mode">
          <button
            type="button"
            className={`bhv-mode ${mode === 'bulkhead' ? 'is-on' : ''}`}
            onClick={() => switchMode('bulkhead')}
            aria-pressed={mode === 'bulkhead'}
          >
            <Boxes size={13} /> BULKHEAD
          </button>
          <button
            type="button"
            className={`bhv-mode ${mode === 'shared' ? 'is-on' : ''}`}
            onClick={() => switchMode('shared')}
            aria-pressed={mode === 'shared'}
          >
            <Waves size={13} /> SHARED
          </button>
        </div>

        <div className="bhv-flood">
          <span className="bhv-input-label">flood</span>
          {DEPS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`bhv-flood-btn ${flooded === d.id ? 'is-on' : ''}`}
              onClick={() => switchFlood(d.id)}
              aria-pressed={flooded === d.id}
              style={flooded === d.id ? { borderColor: d.color, color: d.color } : undefined}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="bhv-slider">
          <span className="bhv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bhv-range" aria-label="Playback speed"
          />
          <span className="bhv-slider-val">{speed.toFixed(1)}×</span>
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
          <text className="bhv-row-label" x={40} y={26}>
            {mode === 'bulkhead' ? 'three isolated pools — one per dependency' : 'one shared pool feeding all three dependencies'}
          </text>

          {/* dependency headers */}
          {DEPS.map((d, i) => {
            const x = colX(i) + colW / 2 - slotGap;
            const isFlood = d.id === flooded;
            const isTarget = current.target === d.id;
            return (
              <g key={`hdr-${d.id}`}>
                <rect
                  className={`bhv-dep ${isTarget ? 'is-target' : ''}`}
                  x={colX(i)}
                  y={44}
                  width={colW - slotGap}
                  height={34}
                  rx={7}
                  style={{ stroke: d.color, fill: 'var(--surface)' }}
                />
                <text className="bhv-dep-label" x={x} y={66} style={{ fill: d.color }}>
                  {d.label}{isFlood ? ' ⚠' : ''}
                </text>
              </g>
            );
          })}

          {mode === 'bulkhead' ? (
            DEPS.map((d, i) => {
              const pool = current.pools[d.id];
              const baseX = colX(i) + (colW - slotGap - (slotW * 2 + slotGap)) / 2;
              return (
                <g key={`pool-${d.id}`}>
                  {pool.map((slot, s) => {
                    const r = Math.floor(s / 2);
                    const c = s % 2;
                    const x = baseX + c * (slotW + slotGap);
                    const y = 100 + r * (slotH + slotGap);
                    const hung = slot && slot.hung;
                    const filled = !!slot;
                    return (
                      <g key={`slot-${d.id}-${s}`}>
                        <rect
                          className={`bhv-slot ${filled ? 'is-filled' : ''} ${hung ? 'is-hung' : ''}`}
                          x={x}
                          y={y}
                          width={slotW}
                          height={slotH}
                          rx={7}
                          style={filled ? { fill: d.color, stroke: d.color } : undefined}
                        />
                        {filled && (
                          <text className="bhv-slot-id" x={x + slotW / 2} y={y + slotH / 2 + 4}>
                            {hung ? '∞' : `#${slot.callId}`}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })
          ) : (
            <g>
              {sharedPool.map((slot, s) => {
                const cols = 6;
                const r = Math.floor(s / cols);
                const c = s % cols;
                const gridW = cols * (slotW + slotGap) - slotGap;
                const baseX = (W - gridW) / 2;
                const x = baseX + c * (slotW + slotGap);
                const y = 100 + r * (slotH + slotGap);
                const filled = !!slot;
                const hung = slot && slot.hung;
                const col = filled ? DEPS.find((d) => d.id === slot.dep)?.color : null;
                return (
                  <g key={`shared-slot-${s}`}>
                    <rect
                      className={`bhv-slot ${filled ? 'is-filled' : ''} ${hung ? 'is-hung' : ''}`}
                      x={x}
                      y={y}
                      width={slotW}
                      height={slotH}
                      rx={7}
                      style={filled ? { fill: col, stroke: col } : undefined}
                    />
                    {filled && (
                      <text className="bhv-slot-id" x={x + slotW / 2} y={y + slotH / 2 + 4}>
                        {hung ? '∞' : `#${slot.callId}`}
                      </text>
                    )}
                  </g>
                );
              })}
              <text className="bhv-shared-cap" x={W / 2} y={H - 30}>
                shared pool · {SHARED_SLOTS} slots for all three
              </text>
            </g>
          )}

          {/* live decision badge */}
          {current.decision && (
            <text
              className={`bhv-badge ${current.decision === 'served' ? 'is-served' : 'is-rejected'}`}
              x={W - 40}
              y={26}
              textAnchor="end"
            >
              {current.decision === 'served' ? 'SERVED' : 'REJECTED'} · {depLabel(current.target)}
            </text>
          )}
        </svg>
      </div>

      <div className="bhv-metrics">
        <div className="bhv-metric">
          <span className="bhv-metric-label">mode</span>
          <span className="bhv-metric-value">{mode === 'bulkhead' ? 'bulkhead' : 'shared pool'}</span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">flooded</span>
          <span className="bhv-metric-value is-flood">{depLabel(flooded)}</span>
        </div>
        {poolStats.map((p) => {
          const sat = Math.round((p.used / p.total) * 100);
          return (
            <div className="bhv-metric" key={`m-${p.id}`}>
              <span className="bhv-metric-label">{depLabel(p.id)}</span>
              <span className={`bhv-metric-value ${sat >= 100 ? 'is-rejected' : ''}`}>
                {p.used}/{p.total}{mode === 'shared' ? ' shared' : ''}
              </span>
            </div>
          );
        })}
        <div className="bhv-metric">
          <span className="bhv-metric-label">availability</span>
          <span className="bhv-metric-value" style={{ color: availColor }}>{current.availability}%</span>
        </div>
        <div className="bhv-metric">
          <span className="bhv-metric-label">served / rejected</span>
          <span className="bhv-metric-value">
            <span className="is-served">{current.served}</span> / <span className="is-rejected">{current.rejected}</span>
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
