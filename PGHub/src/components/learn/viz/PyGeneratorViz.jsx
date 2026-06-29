import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Zap, List, Play, Pause, SkipForward, RotateCcw, Layers, Boxes } from 'lucide-react';
import './PyGeneratorViz.css';

// squares of 0..4 — the running example shared by both lanes
const VALUES = [0, 1, 4, 9, 16];
const N = VALUES.length;

const W = 760;
const H = 300;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function noteFor(produced) {
  if (produced === 0) {
    return 'g = (n*n for n in range(5)) — the generator is created paused at the very top. Nothing is computed yet; the list, by contrast, already holds all five values.';
  }
  if (produced >= N) {
    return 'next(g) again would raise StopIteration — range(5) is exhausted. Five values were produced in total, but the generator never held more than one at a time.';
  }
  const n = produced - 1;
  return `next(g) resumes the frozen function: it computes ${n}*${n} -> yields ${VALUES[n]}, then freezes at yield again. The list still holds all ${N}; the generator holds just this one value.`;
}

export default function PyGeneratorViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const total = N + 1;            // step 0 = created/paused, then one yield per step
  const produced = Math.min(step, N);
  const finished = step >= total - 1;
  const curIdx = produced - 1;    // index just yielded (-1 when none yet)
  const genMem = produced > 0 && produced < total ? 1 : (produced === 0 ? 0 : 1);

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        const next = Math.min(total - 1, s + 1);
        if (next >= total - 1) setPlaying(false);
        return next;
      });
    }, reduced() ? 520 : 1150);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  // ---- list lane (eager) — all boxes filled from the start ----
  const cw = 76;
  const ch = 48;
  const gap = 14;
  const rowW = N * cw + (N - 1) * gap;
  const sx = (W - rowW) / 2;
  const yList = 70;
  const yGen = 196;

  const pauseX = curIdx >= 0 ? sx + curIdx * (cw + gap) + cw / 2 : sx + cw / 2;

  const memBars = useMemo(() => ({
    list: N,
    gen: produced === 0 ? 0 : 1,
  }), [produced]);

  return (
    <div className="pygen">
      <div className="pygen-head">
        <div className="pygen-head-icon"><Zap size={18} /></div>
        <div className="pygen-head-text">
          <h3 className="pygen-title">Eager list vs lazy generator — who holds what in memory</h3>
          <p className="pygen-sub">
            The list materializes every value at once. The generator yields one per <code>next()</code>, pausing at
            <code> yield</code> in between. Step through and watch the memory cost diverge.
          </p>
        </div>
      </div>

      <div className="pygen-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pygen-svg" preserveAspectRatio="xMidYMid meet">
          {/* ===== LIST LANE (eager) ===== */}
          <text x={sx} y={yList - 22} className="pygen-lane-label">
            list = [n*n for n in range(5)]  —  built all at once
          </text>
          {VALUES.map((v, i) => {
            const x = sx + i * (cw + gap);
            return (
              <g key={`l-${i}`} className="pygen-cell is-list">
                <rect x={x} y={yList} width={cw} height={ch} rx={9} className="pygen-cell-box" />
                <text x={x + cw / 2} y={yList + ch / 2 + 6} className="pygen-cell-val" textAnchor="middle">{v}</text>
              </g>
            );
          })}
          <text x={sx + rowW + 14} y={yList + ch / 2 + 5} className="pygen-mem-tag is-eager" textAnchor="start">
            {memBars.list} in memory
          </text>

          {/* ===== GENERATOR LANE (lazy) ===== */}
          <text x={sx} y={yGen - 22} className="pygen-lane-label">
            gen = (n*n for n in range(5))  —  one value per next()
          </text>

          {/* paused-at-yield pointer above the current value */}
          {produced > 0 && produced <= N && (
            <g className="pygen-pause">
              <rect x={pauseX - 13} y={yGen - 18} width={6} height={13} rx={1.5} className="pygen-pause-bar" />
              <rect x={pauseX + 7} y={yGen - 18} width={6} height={13} rx={1.5} className="pygen-pause-bar" />
              <text x={pauseX} y={yGen - 24} className="pygen-pause-label" textAnchor="middle">paused at yield</text>
            </g>
          )}

          {VALUES.map((v, i) => {
            const x = sx + i * (cw + gap);
            const done = i < produced;
            const isCur = i === curIdx;
            return (
              <g key={`g-${i}`} className={`pygen-cell is-gen${done ? ' is-done' : ' is-ghost'}${isCur ? ' is-cur' : ''}`}>
                {isCur && <rect x={x - 3} y={yGen - 3} width={cw + 6} height={ch + 6} rx={11} className="pygen-cur-halo" />}
                <rect x={x} y={yGen} width={cw} height={ch} rx={9} className="pygen-cell-box" />
                <text x={x + cw / 2} y={yGen + ch / 2 + 6} className="pygen-cell-val" textAnchor="middle">
                  {done ? v : '·'}
                </text>
              </g>
            );
          })}
          <text x={sx + rowW + 14} y={yGen + ch / 2 + 5} className="pygen-mem-tag is-lazy" textAnchor="start">
            {memBars.gen} in memory
          </text>

          {/* frozen-frame chip — shows state survives between pulls */}
          <text x={sx} y={yGen + ch + 30} className="pygen-frame" textAnchor="start">
            {produced === 0
              ? 'frame: not started — function body has not run'
              : produced >= total - 1
                ? 'frame: range exhausted — next() -> StopIteration'
                : `frame frozen: i = ${curIdx}, resumes just after yield`}
          </text>
        </svg>
      </div>

      <div className="pygen-controls">
        <button type="button" className="pygen-btn" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="pygen-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> next(g)
        </button>
        <button
          type="button"
          className="pygen-btn"
          onClick={() => { setStep(0); setPlaying(false); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
        <span className="pygen-progress">{step + 1} / {total} pulls</span>
      </div>

      <div className="pygen-readout">
        <div className="pygen-stat is-produced">
          <Layers size={13} />
          <span className="pygen-stat-label">produced so far</span>
          <span className="pygen-stat-val">{produced} / {N}</span>
        </div>
        <div className="pygen-stat is-eager">
          <List size={13} />
          <span className="pygen-stat-label">list memory</span>
          <span className="pygen-stat-val">{memBars.list} values · O(n)</span>
        </div>
        <div className="pygen-stat is-lazy">
          <Boxes size={13} />
          <span className="pygen-stat-label">generator memory</span>
          <span className="pygen-stat-val">{genMem} value · O(1)</span>
        </div>
      </div>

      <div className="pygen-note">
        <span className="pygen-note-label">now</span>
        <span className="pygen-note-body">{noteFor(produced)}</span>
      </div>
    </div>
  );
}
