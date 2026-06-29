import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Cpu, Play, Pause, SkipForward, RotateCcw, Save, Download } from 'lucide-react';
import './OsContextSwitchViz.css';

const Q = 4;   // run quantum (time units)
const SW = 1;  // context-switch overhead (time units)
const ROUNDS = 2;
const PROC_OPTIONS = [2, 3, 4];
const PROC_CLASS = ['is-p0', 'is-p1', 'is-p2', 'is-p3'];

function buildTimeline(n) {
  const segs = [];
  const runsTotal = ROUNDS * n;
  let proc = 0;
  for (let r = 0; r < runsTotal; r += 1) {
    segs.push({ kind: 'run', proc, dur: Q });
    if (r < runsTotal - 1) {
      segs.push({ kind: 'switch', from: proc, to: (proc + 1) % n, dur: SW });
    }
    proc = (proc + 1) % n;
  }
  return segs;
}

const W = 760;
const H = 188;
const BAR_Y = 96;
const BAR_H = 40;
const PAD_L = 40;
const PAD_R = 24;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function OsContextSwitchViz() {
  const [nProc, setNProc] = useState(2);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const segs = useMemo(() => buildTimeline(nProc), [nProc]);
  const total = segs.length;
  const totalTime = useMemo(() => segs.reduce((s, x) => s + x.dur, 0), [segs]);

  const starts = useMemo(() => {
    const out = [];
    let t = 0;
    for (const s of segs) { out.push(t); t += s.dur; }
    return out;
  }, [segs]);

  const usable = W - PAD_L - PAD_R;
  const xOf = (t) => PAD_L + (t / totalTime) * usable;

  function pickN(n) { setNProc(n); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 300 : 760);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const shownTime = useMemo(
    () => segs.slice(0, step).reduce((s, x) => s + x.dur, 0),
    [segs, step],
  );
  const overheadShown = useMemo(
    () => segs.slice(0, step).filter((s) => s.kind === 'switch').reduce((s, x) => s + x.dur, 0),
    [segs, step],
  );
  const usefulShown = shownTime - overheadShown;

  const totalOverhead = (ROUNDS * nProc - 1) * SW;
  const totalUseful = ROUNDS * nProc * Q;
  const overheadPct = ((totalOverhead / totalTime) * 100).toFixed(1);

  const current = step > 0 ? segs[step - 1] : null;
  const finished = step >= total;
  const showPause = playing && step < total;

  const noteText = current
    ? (current.kind === 'run'
      ? `CPU runs P${current.proc} for one quantum — useful work`
      : `Context switch: save P${current.from}'s registers, restore P${current.to}'s — pure overhead`)
    : 'press Step or Play to advance the CPU timeline';

  return (
    <div className="oscs">
      <div className="oscs-head">
        <div className="oscs-head-icon"><Cpu size={18} /></div>
        <div className="oscs-head-text">
          <h3 className="oscs-title">The cost of a context switch</h3>
          <p className="oscs-sub">
            One CPU time-shares several processes. Each switch saves the old registers and restores
            the new ones &mdash; time spent shuffling state, not doing work.
          </p>
        </div>
        <button type="button" className="oscs-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="oscs-chips">
        <span className="oscs-chips-label">processes</span>
        {PROC_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={`oscs-chip${n === nProc ? ' is-active' : ''}`}
            onClick={() => pickN(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="oscs-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="oscs-svg" preserveAspectRatio="xMidYMid meet">
          <text x={PAD_L} y={24} className="oscs-axis">CPU timeline</text>
          <text x={W - PAD_R} y={24} className="oscs-axis" textAnchor="end">time &rarr;</text>

          {/* register-file readout */}
          <g className="oscs-regs">
            <rect x={PAD_L} y={36} width={210} height={34} rx={8} className="oscs-regbox" />
            <text x={PAD_L + 12} y={57} className="oscs-reglabel">registers loaded:</text>
            <text
              x={PAD_L + 150}
              y={57}
              className={`oscs-regval ${current ? (current.kind === 'switch' ? 'is-switching' : PROC_CLASS[current.proc]) : ''}`}
            >
              {current ? (current.kind === 'switch' ? `P${current.from}→P${current.to}` : `P${current.proc}`) : '—'}
            </text>
          </g>

          {/* baseline track */}
          <line x1={PAD_L} y1={BAR_Y + BAR_H + 8} x2={W - PAD_R} y2={BAR_Y + BAR_H + 8} className="oscs-base" />

          {segs.map((s, i) => {
            const x = xOf(starts[i]);
            const w = (s.dur / totalTime) * usable;
            const shown = i < step;
            const isCur = i === step - 1;
            const cls = `oscs-seg ${s.kind === 'switch' ? 'is-switch' : `is-run ${PROC_CLASS[s.proc]}`}`
              + (shown ? ' is-shown' : '')
              + (isCur ? ' is-cur' : '');
            return (
              <g key={i} className={cls}>
                <rect x={x + 1} y={BAR_Y} width={Math.max(2, w - 2)} height={BAR_H} rx={5} className="oscs-seg-box" />
                {s.kind === 'run' ? (
                  <text x={x + w / 2} y={BAR_Y + BAR_H / 2 + 4} className="oscs-seg-text" textAnchor="middle">P{s.proc}</text>
                ) : (
                  <text x={x + w / 2} y={BAR_Y + BAR_H / 2 + 4} className="oscs-seg-sw" textAnchor="middle">&#8645;</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="oscs-controls">
        <button type="button" className="oscs-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="oscs-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="oscs-progress">{step} / {total} segments</span>
      </div>

      <div className="oscs-readout">
        <div className="oscs-stat is-useful">
          <Save size={13} />
          <span className="oscs-stat-label">useful</span>
          <span className="oscs-stat-val">{usefulShown}<span className="oscs-stat-of"> / {totalUseful}</span></span>
        </div>
        <div className="oscs-stat is-overhead">
          <Download size={13} />
          <span className="oscs-stat-label">switch overhead</span>
          <span className="oscs-stat-val">{overheadShown}<span className="oscs-stat-of"> / {totalOverhead}</span></span>
        </div>
        <div className="oscs-stat is-pct">
          <span className="oscs-stat-label">overhead share</span>
          <span className="oscs-stat-val">{overheadPct}%</span>
        </div>
      </div>

      <div className="oscs-note">
        <span className="oscs-note-label">now</span>
        <span className="oscs-note-body">{noteText}</span>
      </div>
    </div>
  );
}
