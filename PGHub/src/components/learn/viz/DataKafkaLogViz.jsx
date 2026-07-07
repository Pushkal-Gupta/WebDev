import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScrollText, Play, Pause, SkipForward, RotateCcw, Gauge, History } from 'lucide-react';
import './DataKafkaLogViz.css';

// A partitioned append-only log. Producers append to the end of a partition;
// two consumer groups (billing, analytics) track independent offsets over the
// same messages. With replay on, the analytics group rewinds to offset 0 and
// re-reads history -- possible only because messages are retained, not deleted
// on read. Deterministic: a fixed op script, no randomness.

const P_COUNT = 2;
const INIT = [[0, 1, 2], [0, 1]]; // starting messages per partition (by offset)

const BASE_OPS = [
  { kind: 'append', p: 0 },
  { kind: 'read', group: 'billing', p: 0 },
  { kind: 'read', group: 'analytics', p: 0 },
  { kind: 'append', p: 1 },
  { kind: 'read', group: 'billing', p: 0 },
  { kind: 'read', group: 'billing', p: 1 },
  { kind: 'read', group: 'analytics', p: 0 },
  { kind: 'append', p: 0 },
  { kind: 'read', group: 'billing', p: 0 },
];

const REPLAY_OPS = [
  { kind: 'replay', group: 'analytics', p: 0, to: 0 },
  { kind: 'read', group: 'analytics', p: 0 },
  { kind: 'read', group: 'analytics', p: 0 },
];

function clone(state) {
  return {
    parts: state.parts.map((a) => [...a]),
    off: { billing: [...state.off.billing], analytics: [...state.off.analytics] },
  };
}

function buildSteps(replay) {
  const ops = replay ? [...BASE_OPS, ...REPLAY_OPS] : BASE_OPS;
  let state = {
    parts: INIT.map((a) => [...a]),
    off: { billing: [0, 0], analytics: [0, 0] },
  };
  const frames = [{ ...clone(state), action: 'Two partitions hold retained messages; both consumer groups start at offset 0.', hot: null }];

  ops.forEach((op) => {
    state = clone(state);
    let action; let hot = null;
    if (op.kind === 'append') {
      const off = state.parts[op.p].length;
      state.parts[op.p].push(off);
      action = `Producer appends message #${off} to the end of partition ${op.p}.`;
      hot = { p: op.p, off, kind: 'append' };
    } else if (op.kind === 'read') {
      const cur = state.off[op.group][op.p];
      if (cur < state.parts[op.p].length) {
        state.off[op.group][op.p] = cur + 1;
        action = `Group "${op.group}" reads message #${cur} on partition ${op.p} and advances its offset.`;
        hot = { p: op.p, off: cur, kind: 'read', group: op.group };
      } else {
        action = `Group "${op.group}" is caught up on partition ${op.p}; nothing to read.`;
      }
    } else if (op.kind === 'replay') {
      state.off[op.group][op.p] = op.to;
      action = `Replay: group "${op.group}" resets its partition-${op.p} offset to ${op.to} and re-reads history — messages were never deleted.`;
      hot = { p: op.p, off: op.to, kind: 'replay', group: op.group };
    }
    frames.push({ ...clone(state), action, hot });
  });
  return frames;
}

const W = 460;
const H = 232;
const CELL_W = 34;
const CELL_H = 30;
const ROW_X = 48;
const ROW_Y = [66, 158];
const GROUPS = ['billing', 'analytics'];

function lagTotal(frame, group) {
  return frame.off[group].reduce((s, o, p) => s + (frame.parts[p].length - o), 0);
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function DataKafkaLogViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [replay, setReplay] = useState(true);
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(replay), [replay]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function toggleReplay() { setReplay((r) => !r); setStep(0); setPlaying(false); }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 880) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const offX = (o) => ROW_X + o * CELL_W;

  return (
    <div className="dkl">
      <div className="dkl-head">
        <div className="dkl-head-icon"><ScrollText size={18} /></div>
        <div className="dkl-head-text">
          <h3 className="dkl-title">A partitioned log with independent offsets</h3>
          <p className="dkl-sub">
            Producers append to the end of each partition; two consumer groups read the same messages
            at their own pace, each tracking its own offset. Because nothing is deleted on read, the
            analytics group can rewind and replay history.
          </p>
        </div>
        <button type="button" className="dkl-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dkl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dkl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dkl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="dkl-arrow-head" />
            </marker>
            <filter id="dkl-glow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {cur.parts.map((msgs, p) => {
            const y = ROW_Y[p];
            return (
              <g key={`p-${p}`}>
                <text x={12} y={y + CELL_H / 2 + 4} className="dkl-plabel">P{p}</text>
                {msgs.map((m, i) => {
                  const hot = cur.hot && cur.hot.p === p && cur.hot.off === m;
                  return (
                    <g key={`c-${p}-${m}`} className={`dkl-cell${hot ? ` is-hot is-${cur.hot.kind}` : ''}`} filter={hot ? 'url(#dkl-glow)' : undefined}>
                      <rect x={offX(i)} y={y} width={CELL_W - 4} height={CELL_H} rx={5} className="dkl-cell-box" />
                      <text x={offX(i) + (CELL_W - 4) / 2} y={y + 20} className="dkl-cell-off" textAnchor="middle">{m}</text>
                    </g>
                  );
                })}
                {/* append point (log end) */}
                <line
                  x1={offX(msgs.length) + 2} y1={y + CELL_H / 2}
                  x2={offX(msgs.length) + 18} y2={y + CELL_H / 2}
                  className="dkl-append-edge" markerEnd="url(#dkl-arrow)"
                />
                <text x={offX(msgs.length) + 22} y={y + CELL_H / 2 + 4} className="dkl-append-label">append</text>

                {/* billing pointer above the row */}
                <g className="dkl-ptr is-billing" style={{ transform: `translateX(${offX(cur.off.billing[p])}px)` }}>
                  <path d={`M ${-6} ${y - 12} L 6 ${y - 12} L 0 ${y - 3} z`} className="dkl-ptr-tri" />
                  <text x={0} y={y - 15} className="dkl-ptr-label" textAnchor="middle">billing {cur.off.billing[p]}</text>
                </g>
                {/* analytics pointer below the row */}
                <g className="dkl-ptr is-analytics" style={{ transform: `translateX(${offX(cur.off.analytics[p])}px)` }}>
                  <path d={`M ${-6} ${y + CELL_H + 12} L 6 ${y + CELL_H + 12} L 0 ${y + CELL_H + 3} z`} className="dkl-ptr-tri" />
                  <text x={0} y={y + CELL_H + 24} className="dkl-ptr-label" textAnchor="middle">analytics {cur.off.analytics[p]}</text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dkl-controls">
        <button type="button" className="dkl-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="dkl-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`dkl-btn dkl-replay${replay ? ' is-on' : ''}`} onClick={toggleReplay}>
          <History size={14} /> Replay {replay ? 'on' : 'off'}
        </button>
        <label className="dkl-speed">
          <Gauge size={13} />
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="dkl-speed-range" />
          <span className="dkl-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="dkl-progress">{safeStep} / {total}</span>
      </div>

      <div className="dkl-readout">
        <div className="dkl-stat is-billing">
          <span className="dkl-stat-label">billing lag</span>
          <span className="dkl-stat-val">{lagTotal(cur, 'billing')}</span>
        </div>
        <div className="dkl-stat is-analytics">
          <span className="dkl-stat-label">analytics lag</span>
          <span className="dkl-stat-val">{lagTotal(cur, 'analytics')}</span>
        </div>
        <div className="dkl-stat is-total">
          <span className="dkl-stat-label">messages</span>
          <span className="dkl-stat-val">{cur.parts.reduce((s, m) => s + m.length, 0)}</span>
        </div>
      </div>

      <div className="dkl-note">
        <span className="dkl-note-label">now</span>
        <span className="dkl-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
