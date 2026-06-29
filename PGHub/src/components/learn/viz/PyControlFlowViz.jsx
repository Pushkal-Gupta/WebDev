import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GitBranch, Play, Pause, SkipForward, RotateCcw, Check, X, ArrowRight, Hash, Sigma } from 'lucide-react';
import './PyControlFlowViz.css';

const LINES = [
  { text: 'total = 0', indent: 0 },
  { text: 'for n in [1, 2, 3, 4]:', indent: 0 },
  { text: 'if n % 2 == 0:', indent: 1 },
  { text: 'total = total + n', indent: 2 },
  { text: 'print(total)', indent: 0 },
];

const L_INIT = 0;
const L_FOR = 1;
const L_IF = 2;
const L_BODY = 3;
const L_PRINT = 4;

function buildTrace() {
  const steps = [];
  let total = 0;
  steps.push({
    line: L_INIT, n: null, total, branch: null,
    note: 'total starts at 0 — the accumulator before the loop runs.',
  });
  for (const n of [1, 2, 3, 4]) {
    steps.push({
      line: L_FOR, n, total, branch: null,
      note: `the loop takes n = ${n} from the list and runs the body.`,
    });
    const even = n % 2 === 0;
    steps.push({
      line: L_IF, n, total, branch: even,
      note: even
        ? `n = ${n} is even, so n % 2 == 0 is True — the if-body runs.`
        : `n = ${n} is odd, so n % 2 == 0 is False — the if-body is skipped.`,
    });
    if (even) {
      const next = total + n;
      steps.push({
        line: L_BODY, n, total: next, branch: true,
        note: `total becomes ${total} + ${n} = ${next}.`,
      });
      total = next;
    }
  }
  steps.push({
    line: L_PRINT, n: 4, total, branch: null,
    note: `the loop is done — print(total) outputs ${total}.`,
  });
  return steps;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PyControlFlowViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const trace = useMemo(() => buildTrace(), []);
  const total = trace.length;

  function togglePlay() {
    if (step >= total - 1) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), reduced() ? 360 : 920);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const cur = trace[step];
  const finished = step >= total - 1;
  const showPause = playing && step < total - 1;

  return (
    <div className="pycf">
      <div className="pycf-head">
        <div className="pycf-head-icon"><GitBranch size={18} /></div>
        <div className="pycf-head-text">
          <h3 className="pycf-title">Stepping through a loop with a branch</h3>
          <p className="pycf-sub">
            The control pointer walks the program line by line. Each pass of the loop tests a
            condition &mdash; True runs the indented body, False skips it.
          </p>
        </div>
        <button type="button" className="pycf-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="pycf-stage">
        <ol className="pycf-code">
          {LINES.map((ln, i) => {
            const active = i === cur.line;
            return (
              <li
                key={i}
                className={`pycf-line pycf-indent-${ln.indent}${active ? ' is-active' : ''}`}
              >
                <span className="pycf-gutter">{i + 1}</span>
                <span className="pycf-caret">{active ? <ArrowRight size={13} /> : null}</span>
                <code className="pycf-src">{ln.text}</code>
                {i === L_IF && active && cur.branch !== null ? (
                  <span className={`pycf-badge${cur.branch ? ' is-true' : ' is-false'}`}>
                    {cur.branch ? <Check size={12} /> : <X size={12} />}
                    {cur.branch ? 'True' : 'False'}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="pycf-branch">
          <span className="pycf-branch-label">branch</span>
          {cur.branch === null ? (
            <span className="pycf-branch-val is-idle">&mdash;</span>
          ) : cur.branch ? (
            <span className="pycf-branch-val is-taken">
              <Check size={13} /> if-body taken
            </span>
          ) : (
            <span className="pycf-branch-val is-skip">
              <X size={13} /> if-body skipped
            </span>
          )}
        </div>
      </div>

      <div className="pycf-controls">
        <button type="button" className="pycf-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="pycf-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <span className="pycf-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="pycf-readout">
        <div className="pycf-stat is-n">
          <Hash size={13} />
          <span className="pycf-stat-label">n</span>
          <span className="pycf-stat-val">{cur.n === null ? '—' : cur.n}</span>
        </div>
        <div className="pycf-stat is-total">
          <Sigma size={13} />
          <span className="pycf-stat-label">total</span>
          <span className="pycf-stat-val">{cur.total}</span>
        </div>
        <div className={`pycf-stat is-cond${cur.branch === null ? ' is-idle' : cur.branch ? ' is-true' : ' is-false'}`}>
          {cur.branch === null ? <GitBranch size={13} /> : cur.branch ? <Check size={13} /> : <X size={13} />}
          <span className="pycf-stat-label">n % 2 == 0</span>
          <span className="pycf-stat-val">
            {cur.branch === null ? '—' : cur.branch ? 'True' : 'False'}
          </span>
        </div>
      </div>

      <div className="pycf-note">
        <span className="pycf-note-label">now</span>
        <span className="pycf-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
