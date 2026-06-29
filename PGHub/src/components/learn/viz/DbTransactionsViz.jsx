import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GitFork, Play, Pause, SkipForward, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import './DbTransactionsViz.css';

const LEVELS = ['READ UNCOMMITTED', 'READ COMMITTED', 'SERIALIZABLE'];

// Each schedule is the interleaving of a dirty-read scenario (balance starts 500).
// Step fields: tx ('T1'|'T2'), label, balance (committed value shown after step),
// dirty (a dirty read just happened), wait (T2 blocked), note.
const SCHEDULES = {
  'READ UNCOMMITTED': {
    anomaly: true,
    steps: [
      { tx: 'T1', label: 'BEGIN', balance: 500 },
      { tx: 'T1', label: 'UPDATE balance = 0', balance: 500, note: 'uncommitted write' },
      { tx: 'T2', label: 'READ balance → 0', balance: 500, dirty: true, note: 'reads T1’s uncommitted 0' },
      { tx: 'T2', label: 'deny withdrawal (sees 0)', balance: 500, note: 'acts on a phantom value' },
      { tx: 'T1', label: 'ROLLBACK', balance: 500, note: 'the 0 never existed' },
    ],
  },
  'READ COMMITTED': {
    anomaly: false,
    steps: [
      { tx: 'T1', label: 'BEGIN', balance: 500 },
      { tx: 'T1', label: 'UPDATE balance = 0', balance: 500, note: 'uncommitted write' },
      { tx: 'T2', label: 'READ balance → 500', balance: 500, note: 'reads last committed, not the 0' },
      { tx: 'T2', label: 'allow (sees true 500)', balance: 500 },
      { tx: 'T1', label: 'ROLLBACK', balance: 500, note: 'no harm: T2 never saw 0' },
    ],
  },
  SERIALIZABLE: {
    anomaly: false,
    steps: [
      { tx: 'T1', label: 'BEGIN (locks row)', balance: 500 },
      { tx: 'T1', label: 'UPDATE balance = 0', balance: 500, note: 'exclusive lock held' },
      { tx: 'T2', label: 'READ … waits', balance: 500, wait: true, note: 'blocked on T1’s lock' },
      { tx: 'T1', label: 'ROLLBACK (lock freed)', balance: 500 },
      { tx: 'T2', label: 'READ balance → 500', balance: 500, note: 'serial, consistent' },
    ],
  },
};

const W = 760;
const H = 220;
const LANE_T1 = 64;
const LANE_T2 = 150;
const COL0 = 40;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DbTransactionsViz() {
  const [level, setLevel] = useState('READ UNCOMMITTED');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const sched = SCHEDULES[level];
  const steps = sched.steps;
  const total = steps.length;
  const colW = (W - COL0 - 24) / total;

  function pickLevel(l) { setLevel(l); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 320 : 880);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const current = step > 0 ? steps[step - 1] : null;
  const finished = step >= total;
  const showPause = playing && step < total;
  const dirtyHappened = useMemo(() => steps.slice(0, step).some((s) => s.dirty), [steps, step]);

  const laneY = (tx) => (tx === 'T1' ? LANE_T1 : LANE_T2);
  const colX = (i) => COL0 + i * colW + colW / 2;

  return (
    <div className="dbtx">
      <div className="dbtx-head">
        <div className="dbtx-head-icon"><GitFork size={18} /></div>
        <div className="dbtx-head-text">
          <h3 className="dbtx-title">Isolation levels and the dirty read</h3>
          <p className="dbtx-sub">
            Two transactions interleave on one row. At low isolation T2 reads T1&rsquo;s uncommitted
            change; raise the level and the anomaly disappears.
          </p>
        </div>
        <button type="button" className="dbtx-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dbtx-chips">
        {LEVELS.map((l) => (
          <button key={l} type="button" className={`dbtx-chip${l === level ? ' is-active' : ''}`} onClick={() => pickLevel(l)}>
            {l}
          </button>
        ))}
      </div>

      <div className="dbtx-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dbtx-svg" preserveAspectRatio="xMidYMid meet">
          {/* lane labels + tracks */}
          <text x={6} y={LANE_T1 + 4} className="dbtx-lane-lbl dbtx-t1">T1</text>
          <text x={6} y={LANE_T2 + 4} className="dbtx-lane-lbl dbtx-t2">T2</text>
          <line x1={COL0} y1={LANE_T1} x2={W - 16} y2={LANE_T1} className="dbtx-track" />
          <line x1={COL0} y1={LANE_T2} x2={W - 16} y2={LANE_T2} className="dbtx-track" />
          <text x={COL0} y={20} className="dbtx-axis">time →</text>

          {steps.map((s, i) => {
            const shown = i < step;
            const isCur = i === step - 1;
            const y = laneY(s.tx);
            const cls = `dbtx-op${s.tx === 'T1' ? ' is-t1' : ' is-t2'}`
              + (shown ? ' is-shown' : '')
              + (isCur ? ' is-cur' : '')
              + (shown && s.dirty ? ' is-dirty' : '')
              + (shown && s.wait ? ' is-wait' : '');
            return (
              <g key={i} className={cls}>
                <rect x={colX(i) - colW / 2 + 4} y={y - 15} width={colW - 8} height={30} rx={7} className="dbtx-op-box" />
                <text x={colX(i)} y={y + 4} className="dbtx-op-text" textAnchor="middle">{s.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dbtx-controls">
        <button type="button" className="dbtx-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dbtx-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <span className="dbtx-progress">{step} / {total} operations</span>
      </div>

      <div className="dbtx-readout">
        <div className="dbtx-note">
          <span className="dbtx-note-label">now</span>
          <span className="dbtx-note-body">{current ? `${current.tx}: ${current.label}${current.note ? ` — ${current.note}` : ''}` : 'press Step or Play to interleave the operations'}</span>
        </div>
        <div className={`dbtx-verdict${finished ? (sched.anomaly ? ' is-bad' : ' is-good') : ''}`}>
          {finished
            ? (sched.anomaly
              ? <><ShieldAlert size={15} /> <span>DIRTY READ — T2 acted on a value that never committed</span></>
              : <><ShieldCheck size={15} /> <span>SAFE — T2 only ever saw committed data</span></>)
            : <><span className="dbtx-verdict-idle">{dirtyHappened ? 'a dirty read just occurred…' : 'running…'}</span></>}
        </div>
      </div>
    </div>
  );
}
