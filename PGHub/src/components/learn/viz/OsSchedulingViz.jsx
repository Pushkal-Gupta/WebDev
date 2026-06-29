import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ListOrdered, Play, Pause, SkipForward, RotateCcw, Clock, Hourglass } from 'lucide-react';
import './OsSchedulingViz.css';

// Fixed, deterministic job set. priority: lower number = higher priority.
const JOBS = [
  { name: 'A', arrival: 0, burst: 6, priority: 3 },
  { name: 'B', arrival: 1, burst: 2, priority: 1 },
  { name: 'C', arrival: 2, burst: 8, priority: 4 },
  { name: 'D', arrival: 3, burst: 3, priority: 2 },
];
const JOB_CLASS = { A: 'is-a', B: 'is-b', C: 'is-c', D: 'is-d' };
const RR_Q = 2;

const ALGOS = [
  { id: 'fcfs', label: 'FCFS', desc: 'first come, first served (arrival order)' },
  { id: 'sjf', label: 'SJF', desc: 'shortest job first (min burst, non-preemptive)' },
  { id: 'rr', label: `Round Robin (q=${RR_Q})`, desc: 'fixed quantum, rotate the queue' },
  { id: 'priority', label: 'Priority', desc: 'highest priority first (lowest number)' },
];

function simNonPreempt(cmp) {
  const finished = new Set();
  const slices = [];
  const complete = {};
  let t = 0;
  while (finished.size < JOBS.length) {
    const ready = JOBS.filter((j) => !finished.has(j.name) && j.arrival <= t);
    if (ready.length === 0) {
      t = Math.min(...JOBS.filter((j) => !finished.has(j.name)).map((j) => j.arrival));
      continue;
    }
    ready.sort(cmp);
    const j = ready[0];
    slices.push({ job: j.name, start: t, end: t + j.burst });
    t += j.burst;
    complete[j.name] = t;
    finished.add(j.name);
  }
  return { slices, complete };
}

function simRR() {
  const arrivals = [...JOBS].sort((a, b) => a.arrival - b.arrival || a.name.localeCompare(b.name));
  const rem = {};
  JOBS.forEach((j) => { rem[j.name] = j.burst; });
  const queue = [];
  const slices = [];
  const complete = {};
  let t = 0;
  let idx = 0;
  const admit = () => { while (idx < arrivals.length && arrivals[idx].arrival <= t) { queue.push(arrivals[idx].name); idx += 1; } };
  admit();
  while (Object.keys(complete).length < JOBS.length) {
    if (queue.length === 0) { t = arrivals[idx].arrival; admit(); continue; }
    const name = queue.shift();
    const run = Math.min(RR_Q, rem[name]);
    const last = slices[slices.length - 1];
    if (last && last.job === name && last.end === t) last.end += run;
    else slices.push({ job: name, start: t, end: t + run });
    t += run;
    rem[name] -= run;
    admit();
    if (rem[name] > 0) queue.push(name);
    else complete[name] = t;
  }
  return { slices, complete };
}

function simulate(algo) {
  if (algo === 'fcfs') return simNonPreempt((a, b) => a.arrival - b.arrival || a.name.localeCompare(b.name));
  if (algo === 'sjf') return simNonPreempt((a, b) => a.burst - b.burst || a.arrival - b.arrival);
  if (algo === 'priority') return simNonPreempt((a, b) => a.priority - b.priority || a.arrival - b.arrival);
  return simRR();
}

const W = 760;
const H = 150;
const PAD_L = 36;
const PAD_R = 22;
const BAR_Y = 52;
const BAR_H = 46;
const SPAN = 19; // total schedule length for this job set

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function OsSchedulingViz() {
  const [algo, setAlgo] = useState('fcfs');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const { slices, complete } = useMemo(() => simulate(algo), [algo]);
  const total = slices.length;
  const usable = W - PAD_L - PAD_R;
  const xOf = (t) => PAD_L + (t / SPAN) * usable;

  function pickAlgo(id) { setAlgo(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 320 : 720);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const shownEnd = step > 0 ? slices[step - 1].end : 0;
  const completedJobs = useMemo(
    () => JOBS.filter((j) => complete[j.name] !== undefined && complete[j.name] <= shownEnd),
    [complete, shownEnd],
  );

  const metrics = completedJobs.map((j) => {
    const turnaround = complete[j.name] - j.arrival;
    const waiting = turnaround - j.burst;
    return { name: j.name, waiting, turnaround };
  });
  const avg = (arr, key) => (arr.length ? (arr.reduce((s, x) => s + x[key], 0) / arr.length) : 0);
  const avgWait = avg(metrics, 'waiting');
  const avgTurn = avg(metrics, 'turnaround');

  const finished = step >= total;
  const showPause = playing && step < total;
  const current = step > 0 ? slices[step - 1] : null;
  const activeAlgo = ALGOS.find((a) => a.id === algo);

  return (
    <div className="ossch">
      <div className="ossch-head">
        <div className="ossch-head-icon"><ListOrdered size={18} /></div>
        <div className="ossch-head-text">
          <h3 className="ossch-title">Scheduling: who runs next?</h3>
          <p className="ossch-sub">
            Four jobs, one CPU. Pick a policy and watch the Gantt chart fill &mdash; the average
            waiting and turnaround time changes with the order it picks.
          </p>
        </div>
        <button type="button" className="ossch-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="ossch-chips">
        {ALGOS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`ossch-chip${a.id === algo ? ' is-active' : ''}`}
            onClick={() => pickAlgo(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="ossch-legend">
        {JOBS.map((j) => (
          <span key={j.name} className={`ossch-leg ${JOB_CLASS[j.name]}`}>
            <span className="ossch-leg-dot" />
            {j.name}
            <span className="ossch-leg-meta">arr {j.arrival} · burst {j.burst} · pri {j.priority}</span>
          </span>
        ))}
      </div>

      <div className="ossch-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ossch-svg" preserveAspectRatio="xMidYMid meet">
          <text x={PAD_L} y={24} className="ossch-axis">Gantt chart</text>
          <line x1={PAD_L} y1={BAR_Y + BAR_H + 6} x2={W - PAD_R} y2={BAR_Y + BAR_H + 6} className="ossch-base" />

          {slices.map((s, i) => {
            const x = xOf(s.start);
            const w = xOf(s.end) - x;
            const shown = i < step;
            const isCur = i === step - 1;
            const cls = `ossch-seg ${JOB_CLASS[s.job]}`
              + (shown ? ' is-shown' : '')
              + (isCur ? ' is-cur' : '');
            return (
              <g key={i} className={cls}>
                <rect x={x + 1} y={BAR_Y} width={Math.max(2, w - 2)} height={BAR_H} rx={5} className="ossch-seg-box" />
                <text x={x + w / 2} y={BAR_Y + BAR_H / 2 + 4} className="ossch-seg-text" textAnchor="middle">{s.job}</text>
              </g>
            );
          })}

          {/* time ticks at slice boundaries */}
          {slices.map((s, i) => (
            <text key={`t${i}`} x={xOf(s.start)} y={BAR_Y + BAR_H + 20} className="ossch-tick" textAnchor="middle">
              {i < step ? s.start : ''}
            </text>
          ))}
          {finished && (
            <text x={xOf(SPAN)} y={BAR_Y + BAR_H + 20} className="ossch-tick" textAnchor="middle">{SPAN}</text>
          )}
        </svg>
      </div>

      <div className="ossch-controls">
        <button type="button" className="ossch-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="ossch-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="ossch-progress">{step} / {total} slices</span>
      </div>

      <div className="ossch-readout">
        <div className="ossch-stat is-wait">
          <Hourglass size={13} />
          <span className="ossch-stat-label">avg waiting</span>
          <span className="ossch-stat-val">{avgWait.toFixed(2)}</span>
        </div>
        <div className="ossch-stat is-turn">
          <Clock size={13} />
          <span className="ossch-stat-label">avg turnaround</span>
          <span className="ossch-stat-val">{avgTurn.toFixed(2)}</span>
        </div>
        <div className="ossch-stat is-done">
          <span className="ossch-stat-label">completed</span>
          <span className="ossch-stat-val">{completedJobs.length} / {JOBS.length}</span>
        </div>
      </div>

      <div className="ossch-note">
        <span className="ossch-note-label">now</span>
        <span className="ossch-note-body">
          {current
            ? `running ${current.job} during [${current.start}, ${current.end}) — ${activeAlgo.desc}`
            : `policy: ${activeAlgo.desc}`}
        </span>
      </div>
    </div>
  );
}
