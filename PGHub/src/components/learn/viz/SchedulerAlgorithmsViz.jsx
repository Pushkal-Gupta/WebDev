import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Cpu, Clock, ListOrdered,
  Gauge, Layers, ArrowRight, StepForward,
} from 'lucide-react';
import './SchedulerAlgorithmsViz.css';

// CPU scheduling on a single core. A ready queue of jobs (arrival + burst, plus a
// priority for the Priority policy) is scheduled four ways, each computed into a
// Gantt timeline of {pid, start, end} slices:
//
//   FCFS      run jobs in arrival order to completion. Simple, but a long early
//             job makes everyone behind it wait (the convoy effect).
//   SJF       non-preemptive: among the jobs that have arrived, run the one with
//             the shortest burst next. Minimises average wait, can starve long jobs.
//   RR        time-quantum slices: run each ready job for at most one quantum,
//             then requeue it if burst remains. Fairer latency, more context switches.
//   Priority  non-preemptive: among arrived jobs, run the highest priority next.
//             Lower number = higher priority.
//
// CPU idle gaps (no job has arrived yet) become an "idle" slice. Per job we report
// completion, turnaround (completion - arrival) and waiting (turnaround - burst),
// plus the averages. The same job set is rescheduled live as the reader switches
// policy or drags the RR quantum, so the trade-offs are directly comparable.

const IDLE = '__idle__';

const JOB_SETS = {
  classic: {
    label: 'classic',
    jobs: [
      { pid: 'P1', arrival: 0, burst: 7, priority: 2 },
      { pid: 'P2', arrival: 2, burst: 4, priority: 1 },
      { pid: 'P3', arrival: 4, burst: 1, priority: 3 },
      { pid: 'P4', arrival: 5, burst: 4, priority: 2 },
    ],
  },
  staggered: {
    label: 'staggered',
    jobs: [
      { pid: 'P1', arrival: 0, burst: 5, priority: 3 },
      { pid: 'P2', arrival: 1, burst: 3, priority: 1 },
      { pid: 'P3', arrival: 2, burst: 6, priority: 2 },
      { pid: 'P4', arrival: 8, burst: 2, priority: 1 },
    ],
  },
};

const COLOR_KEYS = ['violet', 'sky', 'mint', 'pink', 'accent'];
function colorForPid(pid, jobs) {
  const idx = jobs.findIndex((j) => j.pid === pid);
  if (idx < 0) return 'accent';
  return COLOR_KEYS[idx % COLOR_KEYS.length];
}

// ---- schedulers: each returns an ordered array of {pid, start, end} slices ----

function scheduleFCFS(jobs) {
  const order = [...jobs].sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
  const slices = [];
  let t = 0;
  order.forEach((j) => {
    if (j.arrival > t) {
      slices.push({ pid: IDLE, start: t, end: j.arrival });
      t = j.arrival;
    }
    slices.push({ pid: j.pid, start: t, end: t + j.burst });
    t += j.burst;
  });
  return slices;
}

function scheduleSJF(jobs) {
  const rem = jobs.map((j) => ({ ...j, remaining: j.burst, done: false }));
  const slices = [];
  let t = 0;
  let completed = 0;
  while (completed < rem.length) {
    const ready = rem.filter((j) => !j.done && j.arrival <= t);
    if (ready.length === 0) {
      const next = rem.filter((j) => !j.done).reduce((m, j) => Math.min(m, j.arrival), Infinity);
      slices.push({ pid: IDLE, start: t, end: next });
      t = next;
      continue;
    }
    ready.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || a.pid.localeCompare(b.pid));
    const job = ready[0];
    slices.push({ pid: job.pid, start: t, end: t + job.remaining });
    t += job.remaining;
    job.remaining = 0;
    job.done = true;
    completed += 1;
  }
  return slices;
}

function schedulePriority(jobs) {
  const rem = jobs.map((j) => ({ ...j, done: false }));
  const slices = [];
  let t = 0;
  let completed = 0;
  while (completed < rem.length) {
    const ready = rem.filter((j) => !j.done && j.arrival <= t);
    if (ready.length === 0) {
      const next = rem.filter((j) => !j.done).reduce((m, j) => Math.min(m, j.arrival), Infinity);
      slices.push({ pid: IDLE, start: t, end: next });
      t = next;
      continue;
    }
    ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.pid.localeCompare(b.pid));
    const job = ready[0];
    slices.push({ pid: job.pid, start: t, end: t + job.burst });
    t += job.burst;
    job.done = true;
    completed += 1;
  }
  return slices;
}

function scheduleRR(jobs, quantum) {
  const q = Math.max(1, quantum);
  const sorted = [...jobs].sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
  const rem = sorted.map((j) => ({ ...j, remaining: j.burst }));
  const slices = [];
  const queue = [];
  let t = 0;
  let nextArrival = 0;
  let completed = 0;
  const total = rem.length;

  const enqueueArrived = (upto) => {
    while (nextArrival < rem.length && rem[nextArrival].arrival <= upto) {
      queue.push(rem[nextArrival]);
      nextArrival += 1;
    }
  };

  enqueueArrived(t);
  while (completed < total) {
    if (queue.length === 0) {
      const future = rem.find((j) => j.remaining > 0 && j.arrival > t);
      const next = future ? future.arrival : t;
      if (next > t) {
        slices.push({ pid: IDLE, start: t, end: next });
        t = next;
      }
      enqueueArrived(t);
      continue;
    }
    const job = queue.shift();
    const run = Math.min(q, job.remaining);
    slices.push({ pid: job.pid, start: t, end: t + run });
    t += run;
    job.remaining -= run;
    enqueueArrived(t);
    if (job.remaining > 0) {
      queue.push(job);
    } else {
      completed += 1;
    }
  }
  return slices;
}

function computeSchedule(algo, jobs, quantum) {
  if (algo === 'fcfs') return scheduleFCFS(jobs);
  if (algo === 'sjf') return scheduleSJF(jobs);
  if (algo === 'priority') return schedulePriority(jobs);
  return scheduleRR(jobs, quantum);
}

function perJobStats(slices, jobs) {
  const completion = {};
  slices.forEach((s) => {
    if (s.pid === IDLE) return;
    completion[s.pid] = Math.max(completion[s.pid] || 0, s.end);
  });
  return jobs.map((j) => {
    const comp = completion[j.pid] ?? 0;
    const turnaround = comp - j.arrival;
    const waiting = turnaround - j.burst;
    return { ...j, completion: comp, turnaround, waiting };
  });
}

const ALGOS = [
  { key: 'fcfs', label: 'FCFS' },
  { key: 'rr', label: 'Round-Robin' },
  { key: 'sjf', label: 'SJF' },
  { key: 'priority', label: 'Priority' },
];

const ALGO_NOTE = {
  fcfs: 'First-come, first-served runs jobs in arrival order, each to completion. Watch a long early job push everyone behind it — the convoy effect inflates the average wait.',
  rr: 'Round-Robin gives each ready job one time quantum, then requeues it if burst remains. Smaller quantum spreads the CPU more evenly but adds context switches. Drag the quantum to compare.',
  sjf: 'Shortest-job-first picks the shortest available burst next. It provably minimises average wait for a fixed batch — but a steady stream of short jobs can starve a long one.',
  priority: 'Priority scheduling runs the highest-priority arrived job next (lower number = higher priority). Like SJF it is non-preemptive here, so a low-priority job already running finishes before a higher one preempts.',
};

export default function SchedulerAlgorithmsViz() {
  const [algo, setAlgo] = useState('fcfs');
  const [quantum, setQuantum] = useState(2);
  const [setKey, setSetKey] = useState('classic');
  const [bursts, setBursts] = useState(() => JOB_SETS.classic.jobs.map((j) => j.burst));
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [tone, setTone] = useState('init');

  const playTimer = useRef(null);
  useEffect(() => () => { if (playTimer.current) clearTimeout(playTimer.current); }, []);

  const jobs = useMemo(() => JOB_SETS[setKey].jobs.map((j, i) => ({
    ...j,
    burst: bursts[i] ?? j.burst,
  })), [setKey, bursts]);

  const slices = useMemo(() => computeSchedule(algo, jobs, quantum), [algo, jobs, quantum]);
  const totalTime = slices.length ? slices[slices.length - 1].end : 0;
  const stats = useMemo(() => perJobStats(slices, jobs), [slices, jobs]);

  const avgWait = jobs.length
    ? stats.reduce((a, s) => a + s.waiting, 0) / jobs.length
    : null;
  const avgTurn = jobs.length
    ? stats.reduce((a, s) => a + s.turnaround, 0) / jobs.length
    : null;

  // playhead sweeps left -> right one slice boundary at a time
  useEffect(() => {
    if (!playing) return undefined;
    playTimer.current = setTimeout(() => {
      setPlayhead((p) => {
        if (p >= totalTime) {
          setPlaying(false);
          return totalTime;
        }
        return p + 1;
      });
    }, Math.round(520 / speed));
    return () => { if (playTimer.current) { clearTimeout(playTimer.current); playTimer.current = null; } };
  }, [playing, playhead, totalTime, speed]);

  const currentSlice = useMemo(() => {
    if (!playing && playhead === 0) return null;
    return slices.find((s) => playhead > s.start && playhead <= s.end)
      || slices.find((s) => playhead >= s.start && playhead < s.end)
      || null;
  }, [slices, playhead, playing]);

  const currentPid = currentSlice
    ? (currentSlice.pid === IDLE ? 'idle' : currentSlice.pid)
    : '—';

  const selectAlgo = (key) => {
    setAlgo(key);
    setPlaying(false);
    setPlayhead(0);
    setTone('run');
  };

  const togglePlay = () => {
    setTone('run');
    setPlaying((v) => {
      if (!v && playhead >= totalTime) setPlayhead(0);
      return !v;
    });
  };

  const stepOnce = () => {
    setTone('run');
    setPlaying(false);
    setPlayhead((p) => (p >= totalTime ? 0 : Math.min(totalTime, p + 1)));
  };

  const bump = (i, delta) => {
    setBursts((prev) => {
      const next = [...prev];
      const base = next[i] ?? jobs[i].burst;
      next[i] = Math.min(12, Math.max(1, base + delta));
      return next;
    });
    setPlaying(false);
    setPlayhead(0);
    setTone('run');
  };

  const switchSet = (key) => {
    setSetKey(key);
    setBursts(JOB_SETS[key].jobs.map((j) => j.burst));
    setPlaying(false);
    setPlayhead(0);
    setTone('run');
  };

  const reset = () => {
    if (playTimer.current) { clearTimeout(playTimer.current); playTimer.current = null; }
    setBursts(JOB_SETS[setKey].jobs.map((j) => j.burst));
    setPlaying(false);
    setPlayhead(0);
    setTone('init');
  };

  const narrTone = tone === 'warn' ? 'is-warn' : tone === 'run' ? 'is-ok' : '';
  const note = tone === 'init'
    ? 'Pick a scheduling policy and watch the same four jobs land on the CPU differently. Drag the Round-Robin quantum, tweak a burst, or press play to sweep the playhead across the Gantt chart slice by slice.'
    : ALGO_NOTE[algo];

  // ---- SVG geometry ----
  const W = 960;
  const H = 320;
  const padL = 44;
  const padR = 24;
  const trackY = 96;
  const trackH = 64;
  const axisY = trackY + trackH + 4;
  const usableW = W - padL - padR;
  const scaleX = totalTime > 0 ? usableW / totalTime : 0;
  const tx = (t) => padL + t * scaleX;

  const axisTicks = [];
  for (let i = 0; i <= totalTime; i += 1) axisTicks.push(i);
  const tickStep = totalTime > 18 ? 2 : 1;

  return (
    <div className="sch">
      <div className="sch-head">
        <h3 className="sch-title">CPU scheduling — one core, four policies, the same jobs</h3>
        <p className="sch-sub">
          A ready queue of jobs lands on a single CPU. Switch policy, drag the Round-Robin quantum,
          and watch the Gantt chart and the average waiting time change for the same job set.
        </p>
      </div>

      <div className="sch-controls">
        <div className="sch-algos" role="group" aria-label="Scheduling policy">
          {ALGOS.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`sch-algo ${algo === a.key ? 'is-on' : ''}`}
              onClick={() => selectAlgo(a.key)}
              aria-pressed={algo === a.key}
            >
              {a.label}
            </button>
          ))}
        </div>

        <label className={`sch-quantum ${algo === 'rr' ? '' : 'is-off'}`}>
          <span className="sch-input-label">RR quantum</span>
          <input
            type="range" min={1} max={4} step={1} value={quantum}
            onChange={(e) => { setQuantum(Number(e.target.value)); setPlaying(false); setPlayhead(0); }}
            className="sch-range" aria-label="Round-Robin time quantum"
            disabled={algo !== 'rr'}
          />
          <span className="sch-quantum-value">{quantum}</span>
        </label>

        <span className="sch-spacer" aria-hidden="true" />

        <div className="sch-buttons">
          <button type="button" className={`sch-btn ${playing ? 'sch-btn-on' : ''}`} onClick={togglePlay}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="sch-btn" onClick={stepOnce} disabled={playhead >= totalTime}>
            <StepForward size={14} /> Step
          </button>
          <button type="button" className="sch-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <label className="sch-speed">
            <span className="sch-speed-label">speed</span>
            <input
              type="range" min={0.5} max={4} step={0.5} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))} className="sch-speed-range"
              aria-label="Playback speed"
            />
            <span className="sch-speed-value">{speed.toFixed(1)}×</span>
          </label>
        </div>
      </div>

      <div className="sch-jobset">
        <span className="sch-jobset-label"><Layers size={13} /> jobs</span>
        {Object.keys(JOB_SETS).map((k) => (
          <button
            key={k}
            type="button"
            className={`sch-set ${setKey === k ? 'is-on' : ''}`}
            onClick={() => switchSet(k)}
            aria-pressed={setKey === k}
          >
            {JOB_SETS[k].label}
          </button>
        ))}
        <span className="sch-jobset-sep" aria-hidden="true" />
        {jobs.map((j, i) => (
          <span key={j.pid} className={`sch-chip is-${colorForPid(j.pid, jobs)}`}>
            <span className="sch-chip-pid">{j.pid}</span>
            <span className="sch-chip-meta">a{j.arrival} · b{j.burst} · pr{j.priority}</span>
            <span className="sch-chip-bump">
              <button type="button" className="sch-chip-btn" onClick={() => bump(i, -1)} aria-label={`Decrease ${j.pid} burst`}>−</button>
              <button type="button" className="sch-chip-btn" onClick={() => bump(i, 1)} aria-label={`Increase ${j.pid} burst`}>+</button>
            </span>
          </span>
        ))}
      </div>

      <div className="sch-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sch-svg" preserveAspectRatio="xMidYMid meet">
          <text className="sch-stage-title" x={padL} y={28} textAnchor="start">
            Gantt chart — who holds the CPU at each tick
          </text>
          <g transform={`translate(${padL}, 44)`}>
            <Cpu width={15} height={15} className="sch-stage-ic" />
          </g>

          {/* track baseline */}
          <rect className="sch-track" x={padL} y={trackY} width={usableW} height={trackH} rx={8} />

          {/* slices */}
          {slices.map((s, i) => {
            const x = tx(s.start);
            const w = Math.max(0, tx(s.end) - tx(s.start));
            const isIdle = s.pid === IDLE;
            const ck = isIdle ? 'idle' : colorForPid(s.pid, jobs);
            const active = currentSlice && currentSlice.start === s.start && currentSlice.end === s.end;
            return (
              <g key={`${s.pid}-${s.start}-${i}`}>
                <rect
                  className={`sch-slice is-${ck} ${active ? 'is-active' : ''}`}
                  x={x + 1.5} y={trackY + 6} width={Math.max(0, w - 3)} height={trackH - 12} rx={5}
                />
                {w > 16 && (
                  <text className={`sch-slice-pid is-${ck}`} x={x + w / 2} y={trackY + trackH / 2 + 4} textAnchor="middle">
                    {isIdle ? 'idle' : s.pid}
                  </text>
                )}
              </g>
            );
          })}

          {/* axis line + ticks */}
          <line className="sch-axis" x1={padL} y1={axisY} x2={padL + usableW} y2={axisY} />
          {axisTicks.map((t) => (
            (t % tickStep === 0 || t === totalTime) && (
              <g key={`tk-${t}`}>
                <line className="sch-tick" x1={tx(t)} y1={axisY} x2={tx(t)} y2={axisY + 5} />
                <text className="sch-tick-label" x={tx(t)} y={axisY + 16} textAnchor="middle">{t}</text>
              </g>
            )
          ))}

          {/* playhead */}
          {(playing || playhead > 0) && totalTime > 0 && (
            <g>
              <line className="sch-playhead" x1={tx(playhead)} y1={trackY - 10} x2={tx(playhead)} y2={axisY + 2} />
              <circle className="sch-playhead-dot" cx={tx(playhead)} cy={trackY - 10} r={4} />
              <text className="sch-playhead-label" x={tx(playhead)} y={trackY - 16} textAnchor="middle">t={playhead}</text>
            </g>
          )}

          {/* per-job mini-table header */}
          <text className="sch-tbl-title" x={padL} y={H - 84} textAnchor="start">
            per-job waiting / turnaround
          </text>
          {jobs.map((j, i) => {
            const st = stats[i];
            const colW = usableW / jobs.length;
            const cx = padL + i * colW;
            const ck = colorForPid(j.pid, jobs);
            return (
              <g key={`row-${j.pid}`}>
                <rect className={`sch-tbl-cell is-${ck}`} x={cx + 4} y={H - 72} width={colW - 8} height={52} rx={6} />
                <text className={`sch-tbl-pid is-${ck}`} x={cx + 14} y={H - 54} textAnchor="start">{j.pid}</text>
                <text className="sch-tbl-meta" x={cx + colW - 14} y={H - 54} textAnchor="end">comp {st.completion}</text>
                <text className="sch-tbl-stat" x={cx + 14} y={H - 36} textAnchor="start">wait {st.waiting}</text>
                <text className="sch-tbl-stat" x={cx + 14} y={H - 22} textAnchor="start">turn {st.turnaround}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sch-metrics">
        <div className="sch-metric">
          <span className="sch-metric-label">policy</span>
          <span className="sch-metric-value">{ALGOS.find((a) => a.key === algo).label}</span>
        </div>
        <div className="sch-metric">
          <span className="sch-metric-label">quantum</span>
          <span className="sch-metric-value">{algo === 'rr' ? quantum : '—'}</span>
        </div>
        <div className="sch-metric">
          <span className="sch-metric-label">total time</span>
          <span className="sch-metric-value">{totalTime}</span>
        </div>
        <div className="sch-metric">
          <span className="sch-metric-label">avg wait</span>
          <span className="sch-metric-value is-warn">{avgWait === null ? '—' : avgWait.toFixed(2)}</span>
        </div>
        <div className="sch-metric">
          <span className="sch-metric-label">avg turnaround</span>
          <span className="sch-metric-value is-ok">{avgTurn === null ? '—' : avgTurn.toFixed(2)}</span>
        </div>
        <div className="sch-metric sch-metric-dim">
          <span className="sch-metric-label">on CPU now</span>
          <span className="sch-metric-value">{currentPid}</span>
        </div>
      </div>

      <div className={`sch-narration ${narrTone}`}>
        <span className={`sch-narration-label ${narrTone}`}>
          {tone === 'init' ? 'ready' : 'scheduling'}
        </span>
        <span className="sch-narration-body">{note}</span>
      </div>

      <div className="sch-legend">
        <span className="sch-legend-item"><Cpu size={13} className="sch-ic" /> each colored bar is one CPU slice for that job</span>
        <span className="sch-legend-item"><Clock size={13} className="sch-ic is-idle" /> idle — no job has arrived yet</span>
        <span className="sch-legend-item"><ListOrdered size={13} className="sch-ic" /> priority: lower number = higher priority</span>
        <span className="sch-legend-item"><Gauge size={13} className="sch-ic" /> wait = turnaround − burst</span>
        <span className="sch-legend-item"><ArrowRight size={13} className="sch-ic" /> playhead sweeps the timeline left to right</span>
      </div>
    </div>
  );
}
