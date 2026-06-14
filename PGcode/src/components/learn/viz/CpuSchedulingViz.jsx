import React, { useMemo, useState } from 'react';
import { Shuffle, Clock } from 'lucide-react';
import './CpuSchedulingViz.css';

const MODES = [
  { id: 'fcfs', label: 'FCFS' },
  { id: 'sjf', label: 'SJF' },
  { id: 'rr', label: 'ROUND ROBIN' },
  { id: 'priority', label: 'PRIORITY' },
];

const PROC_HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--accent)'];

// Seeded LCG so reshuffle is deterministic per seed (never Math.random).
function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Derive a 4-5 process set from a seed. arrival 0..7, burst 1..8, priority 1..5.
function buildProcesses(seed) {
  const rng = makeRng(seed + 7);
  const n = 4 + Math.floor(rng() * 2); // 4 or 5
  const procs = [];
  for (let i = 0; i < n; i += 1) {
    const arrival = i === 0 ? 0 : Math.floor(rng() * 8);
    const burst = 1 + Math.floor(rng() * 8);
    const priority = 1 + Math.floor(rng() * 5);
    procs.push({ id: i, name: `P${i + 1}`, arrival, burst, priority });
  }
  // Ensure at least one process arrives at t=0 so the CPU never idles forever at start.
  if (!procs.some((p) => p.arrival === 0)) procs[0].arrival = 0;
  return procs;
}

// Each scheduler returns { slices: [{id, start, end}], metrics: {id->{completion,turnaround,waiting,burst}} }.
function scheduleFCFS(procs) {
  const order = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  const slices = [];
  let t = 0;
  const metrics = {};
  for (const p of order) {
    if (t < p.arrival) {
      slices.push({ id: -1, start: t, end: p.arrival });
      t = p.arrival;
    }
    const start = t;
    const end = t + p.burst;
    slices.push({ id: p.id, start, end });
    t = end;
    metrics[p.id] = {
      completion: end,
      turnaround: end - p.arrival,
      waiting: end - p.arrival - p.burst,
      burst: p.burst,
    };
  }
  return { slices, metrics };
}

function scheduleSelectKey(procs, keyOf) {
  // Generic non-preemptive: at each decision pick ready process minimizing keyOf.
  const remaining = procs.map((p) => ({ ...p, done: false }));
  const slices = [];
  const metrics = {};
  let t = 0;
  let completed = 0;
  while (completed < remaining.length) {
    const ready = remaining.filter((p) => !p.done && p.arrival <= t);
    if (ready.length === 0) {
      const next = remaining.filter((p) => !p.done).reduce((m, p) => Math.min(m, p.arrival), Infinity);
      slices.push({ id: -1, start: t, end: next });
      t = next;
      continue;
    }
    ready.sort((a, b) => keyOf(a) - keyOf(b) || a.arrival - b.arrival || a.id - b.id);
    const p = ready[0];
    const start = t;
    const end = t + p.burst;
    slices.push({ id: p.id, start, end });
    t = end;
    p.done = true;
    completed += 1;
    metrics[p.id] = {
      completion: end,
      turnaround: end - p.arrival,
      waiting: end - p.arrival - p.burst,
      burst: p.burst,
    };
  }
  return { slices, metrics };
}

function scheduleRR(procs, quantum) {
  const order = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  const rem = {};
  procs.forEach((p) => { rem[p.id] = p.burst; });
  const slices = [];
  const metrics = {};
  const queue = [];
  let t = 0;
  let dispatched = 0;
  const total = procs.length;
  let completed = 0;

  // Enqueue everything arriving at time <= upTo that has not been enqueued yet.
  const enqueueArrivals = (upTo) => {
    for (const p of order) {
      if (p.arrival <= upTo && !p.enqueued && rem[p.id] > 0) {
        p.enqueued = true;
        queue.push(p.id);
        dispatched += 1;
      }
    }
  };

  enqueueArrivals(t);
  while (completed < total) {
    if (queue.length === 0) {
      // CPU idle: jump to the next arrival.
      const next = order.filter((p) => !p.enqueued && rem[p.id] > 0).reduce((m, p) => Math.min(m, p.arrival), Infinity);
      if (next === Infinity) break;
      slices.push({ id: -1, start: t, end: next });
      t = next;
      enqueueArrivals(t);
      continue;
    }
    const id = queue.shift();
    const run = Math.min(quantum, rem[id]);
    const start = t;
    const end = t + run;
    slices.push({ id, start, end });
    rem[id] -= run;
    t = end;
    // Newly-arrived during this slice enter the queue BEFORE the preempted process re-enters.
    enqueueArrivals(t);
    if (rem[id] > 0) {
      queue.push(id);
    } else {
      const p = procs.find((x) => x.id === id);
      metrics[id] = {
        completion: end,
        turnaround: end - p.arrival,
        waiting: end - p.arrival - p.burst,
        burst: p.burst,
      };
      completed += 1;
    }
  }
  // dispatched is informational; silence unused via void.
  void dispatched;
  return { slices, metrics };
}

function schedule(procs, mode, quantum) {
  if (mode === 'fcfs') return scheduleFCFS(procs);
  if (mode === 'sjf') return scheduleSelectKey(procs, (p) => p.burst);
  if (mode === 'priority') return scheduleSelectKey(procs, (p) => p.priority);
  return scheduleRR(procs, quantum);
}

export default function CpuSchedulingViz() {
  const [seed, setSeed] = useState(12345);
  const [mode, setMode] = useState('fcfs');
  const [quantum, setQuantum] = useState(2);

  const procs = useMemo(() => buildProcesses(seed), [seed]);
  const { slices, metrics } = useMemo(() => schedule(procs, mode, quantum), [procs, mode, quantum]);

  const stats = useMemo(() => {
    const vals = procs.map((p) => metrics[p.id]).filter(Boolean);
    if (vals.length === 0) return { avgWait: 0, avgTat: 0, makespan: 0 };
    const avgWait = vals.reduce((s, m) => s + m.waiting, 0) / vals.length;
    const avgTat = vals.reduce((s, m) => s + m.turnaround, 0) / vals.length;
    const makespan = vals.reduce((m, v) => Math.max(m, v.completion), 0);
    return { avgWait, avgTat, makespan };
  }, [procs, metrics]);

  const tEnd = useMemo(
    () => slices.reduce((m, s) => Math.max(m, s.end), 0) || 1,
    [slices],
  );

  const hueFor = (id) => (id < 0 ? 'var(--text-dim)' : PROC_HUES[id % PROC_HUES.length]);

  const switchMode = (m) => { if (m !== mode) setMode(m); };
  const reshuffle = () => {
    const rng = makeRng(seed + 1);
    setSeed(Math.floor(rng() * 1e9) + 1);
  };

  // SVG geometry
  const W = 940;
  const ROW_H = 28;
  const tableTop = 150;
  const tableRowH = 30;
  const H = tableTop + procs.length * tableRowH + 30;

  const axisLeft = 64;
  const axisRight = W - 30;
  const axisW = axisRight - axisLeft;
  const ganttY = 64;
  const ganttH = 44;
  const tx = (t) => axisLeft + (t / tEnd) * axisW;

  // Build integer ticks, capping density so labels never overlap.
  const tickStep = Math.max(1, Math.ceil(tEnd / 18));
  const ticks = [];
  for (let t = 0; t <= tEnd; t += tickStep) ticks.push(t);
  if (ticks[ticks.length - 1] !== tEnd) ticks.push(tEnd);

  return (
    <div className="cpuv">
      <div className="cpuv-head">
        <h3 className="cpuv-title">CPU scheduling — Gantt timeline</h3>
        <p className="cpuv-sub">
          Pick a scheduling policy and watch the same process set resolve into a different timeline.
          Average waiting and turnaround update live as the algorithm, quantum, or workload changes.
        </p>
      </div>

      <div className="cpuv-controls">
        <div className="cpuv-modes" role="tablist" aria-label="Scheduling algorithm">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`cpuv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className={`cpuv-slider ${mode === 'rr' ? '' : 'is-disabled'}`}>
          <span className="cpuv-input-label">quantum</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={quantum}
            onChange={(e) => setQuantum(Number(e.target.value))}
            className="cpuv-range"
            aria-label="Round robin time quantum"
            disabled={mode !== 'rr'}
          />
          <span className="cpuv-slider-val">{quantum}</span>
        </label>

        <span className="cpuv-spacer" aria-hidden="true" />

        <button type="button" className="cpuv-btn cpuv-btn-primary" onClick={reshuffle}>
          <Shuffle size={14} /> Reshuffle
        </button>
      </div>

      <div className="cpuv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cpuv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="cpuv-row-label" x={axisLeft} y={36}>
            {mode === 'rr' ? `round-robin gantt (quantum ${quantum})` : `${mode} gantt`}
          </text>

          {/* Gantt blocks, one per executed slice */}
          {slices.map((s, i) => {
            const x = tx(s.start);
            const w = Math.max(0, tx(s.end) - tx(s.start));
            const idle = s.id < 0;
            return (
              <g key={`slice-${i}`}>
                <rect
                  className={`cpuv-block ${idle ? 'is-idle' : ''}`}
                  x={x}
                  y={ganttY}
                  width={w}
                  height={ganttH}
                  rx={6}
                  style={idle ? undefined : { fill: hueFor(s.id), stroke: hueFor(s.id) }}
                />
                {w > 16 && (
                  <text className={`cpuv-block-label ${idle ? 'is-idle' : ''}`} x={x + w / 2} y={ganttY + ganttH / 2 + 5}>
                    {idle ? 'idle' : procs.find((p) => p.id === s.id)?.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* time axis under the gantt */}
          <line className="cpuv-axis" x1={axisLeft} y1={ganttY + ganttH + 8} x2={axisRight} y2={ganttY + ganttH + 8} />
          {ticks.map((t) => (
            <g key={`tick-${t}`}>
              <line className="cpuv-tick" x1={tx(t)} y1={ganttY + ganttH + 8} x2={tx(t)} y2={ganttY + ganttH + 14} />
              <text className="cpuv-tick-label" x={tx(t)} y={ganttY + ganttH + 28}>{t}</text>
            </g>
          ))}
          <text className="cpuv-axis-label" x={axisRight} y={ganttY + ganttH + 28} textAnchor="end">time</text>

          {/* per-process metrics rendered as SVG rows (no HTML table, no scrollbar) */}
          <text className="cpuv-row-label" x={axisLeft} y={tableTop - 14}>per-process metrics</text>
          <g className="cpuv-thead">
            <text className="cpuv-th" x={axisLeft + 4} y={tableTop + 2}>proc</text>
            <text className="cpuv-th" x={axisLeft + 150} y={tableTop + 2} textAnchor="end">arr</text>
            <text className="cpuv-th" x={axisLeft + 230} y={tableTop + 2} textAnchor="end">burst</text>
            {mode === 'priority' && (
              <text className="cpuv-th" x={axisLeft + 320} y={tableTop + 2} textAnchor="end">prio</text>
            )}
            <text className="cpuv-th" x={axisLeft + 460} y={tableTop + 2} textAnchor="end">completion</text>
            <text className="cpuv-th" x={axisLeft + 600} y={tableTop + 2} textAnchor="end">turnaround</text>
            <text className="cpuv-th" x={axisLeft + 740} y={tableTop + 2} textAnchor="end">waiting</text>
          </g>
          {procs.map((p, i) => {
            const m = metrics[p.id] || { completion: '—', turnaround: '—', waiting: '—' };
            const rowY = tableTop + 14 + i * tableRowH;
            return (
              <g key={`row-${p.id}`}>
                <rect className="cpuv-trow" x={axisLeft - 6} y={rowY - ROW_H / 2 - 2} width={W - axisLeft - 16} height={ROW_H} rx={5} />
                <circle cx={axisLeft + 8} cy={rowY} r={7} fill={hueFor(p.id)} />
                <text className="cpuv-td-name" x={axisLeft + 24} y={rowY + 4}>{p.name}</text>
                <text className="cpuv-td" x={axisLeft + 150} y={rowY + 4} textAnchor="end">{p.arrival}</text>
                <text className="cpuv-td" x={axisLeft + 230} y={rowY + 4} textAnchor="end">{p.burst}</text>
                {mode === 'priority' && (
                  <text className="cpuv-td" x={axisLeft + 320} y={rowY + 4} textAnchor="end">{p.priority}</text>
                )}
                <text className="cpuv-td" x={axisLeft + 460} y={rowY + 4} textAnchor="end">{m.completion}</text>
                <text className="cpuv-td" x={axisLeft + 600} y={rowY + 4} textAnchor="end">{m.turnaround}</text>
                <text className="cpuv-td is-wait" x={axisLeft + 740} y={rowY + 4} textAnchor="end">{m.waiting}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cpuv-metrics">
        <div className="cpuv-metric">
          <span className="cpuv-metric-label">policy</span>
          <span className="cpuv-metric-value">{MODES.find((m) => m.id === mode)?.label.toLowerCase()}</span>
        </div>
        <div className="cpuv-metric">
          <span className="cpuv-metric-label">processes</span>
          <span className="cpuv-metric-value">{procs.length}</span>
        </div>
        <div className="cpuv-metric">
          <span className="cpuv-metric-label">avg waiting</span>
          <span className="cpuv-metric-value is-wait">{stats.avgWait.toFixed(2)}</span>
        </div>
        <div className="cpuv-metric">
          <span className="cpuv-metric-label">avg turnaround</span>
          <span className="cpuv-metric-value is-ok">{stats.avgTat.toFixed(2)}</span>
        </div>
        <div className="cpuv-metric cpuv-metric-dim">
          <span className="cpuv-metric-label">makespan</span>
          <span className="cpuv-metric-value cpuv-metric-dimval">{stats.makespan}</span>
        </div>
      </div>

      <div className="cpuv-narration">
        <span className="cpuv-narration-label"><Clock size={12} /> note</span>
        <span className="cpuv-narration-body">
          {mode === 'fcfs' && 'First-come first-served runs each process to completion in arrival order. Simple and fair, but one long job arriving first stalls everyone behind it (the convoy effect).'}
          {mode === 'sjf' && 'Shortest-job-first picks the ready process with the smallest burst at each decision point. It minimizes average waiting time, but long jobs can starve while short ones keep jumping ahead.'}
          {mode === 'rr' && `Round robin gives each process a ${quantum}-unit slice, then rotates. A smaller quantum improves responsiveness but adds context-switch overhead; a larger quantum degrades toward FCFS.`}
          {mode === 'priority' && 'Priority scheduling (non-preemptive) runs the ready process with the lowest priority number first. Equal-priority ties fall back to arrival order; low-priority jobs risk starvation without aging.'}
        </span>
      </div>
    </div>
  );
}
