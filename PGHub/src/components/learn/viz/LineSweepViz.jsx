import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './LineSweepViz.css';

const SEED = 0x5EE9BA11;
const N_SEGS = 8;
const X_MIN = 60;
const X_MAX = 620;
const Y_MIN = 60;
const Y_MAX = 320;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSegments(rand, n) {
  const segs = [];
  for (let i = 0; i < n; i++) {
    let x1 = Math.round(X_MIN + rand() * (X_MAX - X_MIN));
    let x2 = Math.round(X_MIN + rand() * (X_MAX - X_MIN));
    if (x1 === x2) x2 = Math.min(X_MAX, x1 + 40);
    if (x1 > x2) [x1, x2] = [x2, x1];
    const y1 = Math.round(Y_MIN + rand() * (Y_MAX - Y_MIN));
    const y2 = Math.round(Y_MIN + rand() * (Y_MAX - Y_MIN));
    segs.push({ id: i, x1, y1, x2, y2 });
  }
  return segs;
}

function segIntersect(s1, s2) {
  const { x1: a, y1: b, x2: c, y2: d } = s1;
  const { x1: p, y1: q, x2: r, y2: s } = s2;
  const det = (c - a) * (s - q) - (r - p) * (d - b);
  if (Math.abs(det) < 1e-9) return null;
  const lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
  const gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
  if (lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1) {
    return { x: a + lambda * (c - a), y: b + lambda * (d - b) };
  }
  return null;
}

function buildFrames(segments) {
  const events = [];
  for (const seg of segments) {
    events.push({ kind: 'start', x: seg.x1, segId: seg.id });
    events.push({ kind: 'end', x: seg.x2, segId: seg.id });
  }
  events.sort((a, b) => (a.x - b.x) || (a.kind === 'start' ? -1 : 1));

  const frames = [];
  const active = new Set();
  const intersections = [];
  const byId = new Map(segments.map((s) => [s.id, s]));

  frames.push({
    phase: 'init',
    sweepX: X_MIN - 20,
    activeIds: [],
    intersections: [],
    eventIdx: -1,
    eventDesc: '',
    note: `Sort ${events.length} events left to right. Sweep across the plane.`,
  });

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.kind === 'start') {
      const newlyChecked = [];
      for (const otherId of active) {
        const hit = segIntersect(byId.get(otherId), byId.get(ev.segId));
        if (hit) {
          intersections.push({ x: hit.x, y: hit.y, a: otherId, b: ev.segId });
          newlyChecked.push(otherId);
        }
      }
      active.add(ev.segId);
      frames.push({
        phase: 'start',
        sweepX: ev.x,
        activeIds: [...active],
        intersections: [...intersections],
        eventIdx: i,
        eventDesc: `START id ${ev.segId} @ x = ${ev.x}`,
        highlightId: ev.segId,
        checkedIds: newlyChecked,
        note: newlyChecked.length > 0
          ? `Add id ${ev.segId} to active set. Detected ${newlyChecked.length} new intersection(s) with active segments.`
          : `Add id ${ev.segId} to active set. No new intersections with currently active segments.`,
      });
    } else {
      active.delete(ev.segId);
      frames.push({
        phase: 'end',
        sweepX: ev.x,
        activeIds: [...active],
        intersections: [...intersections],
        eventIdx: i,
        eventDesc: `END id ${ev.segId} @ x = ${ev.x}`,
        highlightId: ev.segId,
        checkedIds: [],
        note: `Remove id ${ev.segId} from active set. Active size = ${active.size}.`,
      });
    }
  }

  frames.push({
    phase: 'done',
    sweepX: X_MAX + 20,
    activeIds: [],
    intersections: [...intersections],
    eventIdx: events.length,
    eventDesc: '',
    note: `Done. Found ${intersections.length} intersection(s) across ${events.length} events.`,
  });

  return frames;
}

export default function LineSweepViz() {
  const [seed, setSeed] = useState(SEED);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const rand = useMemo(() => mulberry32(seed), [seed]);
  const { frames, segments } = useMemo(() => {
    const segs = generateSegments(rand, N_SEGS);
    return { frames: buildFrames(segs), segments: segs };
  }, [rand]);

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const reseed = () => {
    reset();
    setSeed((s) => (s + 1) >>> 0);
  };

  const W = 900;
  const H = 380;
  const planeRight = 640;
  const panelX = 670;
  const panelW = W - panelX - 20;
  const cellH = 24;

  const byId = useMemo(() => new Map(segments.map((s) => [s.id, s])), [segments]);

  return (
    <div className="lsv">
      <div className="lsv-head">
        <h3 className="lsv-title">Line sweep — interval intersections in O((n + k) log n)</h3>
        <p className="lsv-sub">
          Sort segment endpoints as events. Sweep a vertical line left to right; maintain the set of active segments.
          On each start event, check the new segment against active set for crossings.
        </p>
      </div>

      <div className="lsv-controls">
        <div className="lsv-actions">
          <div className="lsv-buttons">
            <button
              type="button"
              className="lsv-btn lsv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="lsv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="lsv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="lsv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="lsv-btn" onClick={reseed}>
              Reseed
            </button>
          </div>
          <label className="lsv-speed">
            <span className="lsv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="lsv-speed-range"
            />
            <span className="lsv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="lsv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="lsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lsv-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={20} y={20} width={planeRight - 20} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={30} y={36} className="lsv-row-label">plane</text>

          {segments.map((s) => {
            const isActive = current.activeIds.includes(s.id);
            const isHighlight = s.id === current.highlightId;
            const isChecked = current.checkedIds && current.checkedIds.includes(s.id);
            const stroke = isHighlight ? 'var(--hue-pink)'
              : isChecked ? 'var(--hue-violet)'
              : isActive ? 'var(--accent)'
              : 'var(--text-dim)';
            const sw = isHighlight || isActive ? 2.5 : 1.5;
            const opacity = isActive || isHighlight || isChecked ? 1 : 0.45;
            return (
              <g key={`seg-${s.id}`}>
                <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={stroke} strokeWidth={sw} opacity={opacity} />
                <circle cx={s.x1} cy={s.y1} r={3} fill={stroke} opacity={opacity} />
                <circle cx={s.x2} cy={s.y2} r={3} fill={stroke} opacity={opacity} />
                <text x={(s.x1 + s.x2) / 2} y={(s.y1 + s.y2) / 2 - 6} className="lsv-seg-label" opacity={opacity}>
                  {s.id}
                </text>
              </g>
            );
          })}

          {current.intersections.map((p, i) => (
            <g key={`ix-${i}`}>
              <circle cx={p.x} cy={p.y} r={5} fill="var(--hard)" stroke="var(--bg)" strokeWidth={1.5} />
            </g>
          ))}

          <line
            x1={current.sweepX}
            y1={20}
            x2={current.sweepX}
            y2={H - 20}
            stroke="var(--hue-pink)"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <text x={current.sweepX + 4} y={H - 24} className="lsv-sweep-label">
            x = {Math.round(current.sweepX)}
          </text>

          <rect x={panelX - 10} y={20} width={panelW + 20} height={H - 40} fill="var(--surface)" stroke="var(--border)" rx={6} />
          <text x={panelX} y={36} className="lsv-row-label">active set</text>

          {current.activeIds.length === 0 && (
            <text x={panelX} y={64} className="lsv-empty">(empty)</text>
          )}

          {current.activeIds.map((id, i) => {
            const y = 50 + i * cellH;
            const seg = byId.get(id);
            return (
              <g key={`act-${id}-${i}`}>
                <rect
                  x={panelX}
                  y={y}
                  width={panelW}
                  height={cellH - 4}
                  fill={id === current.highlightId ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                  stroke={id === current.highlightId ? 'var(--accent)' : 'var(--border)'}
                  rx={4}
                />
                <text x={panelX + 8} y={y + (cellH - 4) / 2 + 4} className="lsv-active-text">
                  id {id}  ({seg.x1},{seg.y1}) → ({seg.x2},{seg.y2})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="lsv-metrics">
        <div className="lsv-metric">
          <span className="lsv-metric-label">phase</span>
          <span className="lsv-metric-value">{current.phase}</span>
        </div>
        <div className="lsv-metric">
          <span className="lsv-metric-label">active</span>
          <span className="lsv-metric-value">{current.activeIds.length}</span>
        </div>
        <div className="lsv-metric">
          <span className="lsv-metric-label">intersections</span>
          <span className="lsv-metric-value">{current.intersections.length}</span>
        </div>
        <div className="lsv-metric lsv-metric-dim">
          <span className="lsv-metric-label">event</span>
          <span className="lsv-metric-value lsv-metric-dimval">{current.eventDesc || '—'}</span>
        </div>
      </div>

      <div className="lsv-arith">
        <span className="lsv-arith-label">trace</span>
        <span className="lsv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
