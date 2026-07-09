import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Workflow, Play, Pause, SkipForward, RotateCcw, Gauge, Sigma } from 'lucide-react';
import './FpMapReduceViz.css';

// Deterministic map -> filter -> reduce pipeline, flowing top-to-bottom.
const INPUT = [1, 2, 3, 4, 5, 6];
const MAPPED = INPUT.map((x) => x * x);          // [1,4,9,16,25,36]
const KEEP = MAPPED.map((v) => v % 2 === 0);     // [F,T,F,T,F,T]
const KEPT = MAPPED.filter((v) => v % 2 === 0);  // [4,16,36]
const N = INPUT.length;

const MAP_STEPS = N;                 // 0..5
const FILTER_STEPS = N;              // 6..11
const REDUCE_STEPS = KEPT.length;    // 12..14
const TOTAL = MAP_STEPS + FILTER_STEPS + REDUCE_STEPS - 1; // last index

const W = 470;
const H = 470;
const CELL_W = 58;
const CELL_H = 40;
const GAP = 8;
const ROW_W = N * CELL_W + (N - 1) * GAP;
const X0 = (W - ROW_W) / 2;
const cellX = (i) => X0 + i * (CELL_W + GAP);

const Y_INPUT = 34;
const Y_MAP = 160;
const Y_FILTER = 286;
const Y_REDUCE = 410;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FpMapReduceViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  function togglePlay() {
    if (step >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 360 : 780) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, speed]);

  const view = useMemo(() => {
    const g = step;
    const inMap = g < MAP_STEPS;
    const inFilter = g >= MAP_STEPS && g < MAP_STEPS + FILTER_STEPS;
    const inReduce = g >= MAP_STEPS + FILTER_STEPS;
    const mapRevealed = Math.min(g + 1, MAP_STEPS);
    const filterRevealed = inFilter ? (g - MAP_STEPS + 1) : (g >= MAP_STEPS ? N : 0);
    const reduceRevealed = inReduce ? (g - MAP_STEPS - FILTER_STEPS + 1) : 0;
    const acc = KEPT.slice(0, reduceRevealed).reduce((a, x) => a + x, 0);
    const mapActive = inMap ? g : -1;
    const filterActive = inFilter ? g - MAP_STEPS : -1;
    const phase = inMap ? 'map' : inFilter ? 'filter' : 'reduce';
    return { mapRevealed, filterRevealed, reduceRevealed, acc, mapActive, filterActive, phase, inReduce };
  }, [step]);

  const noteText = view.phase === 'map'
    ? `map applies x => x*x to element ${view.mapActive >= 0 ? INPUT[view.mapActive] : ''} -> ${view.mapActive >= 0 ? MAPPED[view.mapActive] : ''}. Same length out, every element transformed independently.`
    : view.phase === 'filter'
      ? `filter keeps x where x % 2 == 0. ${view.filterActive >= 0 ? (KEEP[view.filterActive] ? `${MAPPED[view.filterActive]} is even — kept.` : `${MAPPED[view.filterActive]} is odd — dropped.`) : ''} The list can only shrink.`
      : `reduce folds the kept values into one accumulator: running total is ${view.acc}. reduce collapses many values into a single result.`;

  return (
    <div className="fpmr">
      <div className="fpmr-head">
        <div className="fpmr-head-icon"><Workflow size={18} /></div>
        <div className="fpmr-head-text">
          <h3 className="fpmr-title">map · filter · reduce, step by step</h3>
          <p className="fpmr-sub">
            One array flows down three pure stages: <code>map</code> transforms every element,
            <code>filter</code> drops some, <code>reduce</code> folds the rest into one value.
          </p>
        </div>
        <button type="button" className="fpmr-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="fpmr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fpmr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="fpmr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="fpmr-arrow-head" />
            </marker>
          </defs>

          {/* stage labels + down arrows */}
          <line x1={W / 2} y1={Y_INPUT + CELL_H + 4} x2={W / 2} y2={Y_MAP - 6} className="fpmr-edge" markerEnd="url(#fpmr-arrow)" />
          <text x={W / 2 + 10} y={(Y_INPUT + CELL_H + Y_MAP) / 2 + 4} className="fpmr-op" textAnchor="start">map: x =&gt; x*x</text>
          <line x1={W / 2} y1={Y_MAP + CELL_H + 4} x2={W / 2} y2={Y_FILTER - 6} className="fpmr-edge" markerEnd="url(#fpmr-arrow)" />
          <text x={W / 2 + 10} y={(Y_MAP + CELL_H + Y_FILTER) / 2 + 4} className="fpmr-op" textAnchor="start">filter: x % 2 == 0</text>
          <line x1={W / 2} y1={Y_FILTER + CELL_H + 4} x2={W / 2} y2={Y_REDUCE - 6} className="fpmr-edge" markerEnd="url(#fpmr-arrow)" />
          <text x={W / 2 + 10} y={(Y_FILTER + CELL_H + Y_REDUCE) / 2 + 4} className="fpmr-op" textAnchor="start">reduce: (a,x) =&gt; a+x</text>

          {/* input row */}
          {INPUT.map((v, i) => (
            <g key={`in-${i}`} className="fpmr-cell is-input">
              <rect x={cellX(i)} y={Y_INPUT} width={CELL_W} height={CELL_H} rx={8} className="fpmr-cell-box" />
              <text x={cellX(i) + CELL_W / 2} y={Y_INPUT + 26} className="fpmr-cell-val" textAnchor="middle">{v}</text>
            </g>
          ))}

          {/* mapped row */}
          {MAPPED.map((v, i) => {
            const shown = i < view.mapRevealed;
            const active = i === view.mapActive;
            return (
              <g key={`map-${i}`} className={`fpmr-cell is-map ${shown ? 'is-on' : 'is-off'} ${active ? 'is-active' : ''}`}>
                <rect x={cellX(i)} y={Y_MAP} width={CELL_W} height={CELL_H} rx={8} className="fpmr-cell-box" />
                <text x={cellX(i) + CELL_W / 2} y={Y_MAP + 26} className="fpmr-cell-val" textAnchor="middle">{shown ? v : ''}</text>
              </g>
            );
          })}

          {/* filtered row */}
          {MAPPED.map((v, i) => {
            const shown = i < view.filterRevealed;
            const kept = KEEP[i];
            const active = i === view.filterActive;
            return (
              <g key={`fil-${i}`} className={`fpmr-cell is-filter ${shown ? (kept ? 'is-kept' : 'is-dropped') : 'is-off'} ${active ? 'is-active' : ''}`}>
                <rect x={cellX(i)} y={Y_FILTER} width={CELL_W} height={CELL_H} rx={8} className="fpmr-cell-box" />
                <text x={cellX(i) + CELL_W / 2} y={Y_FILTER + 26} className="fpmr-cell-val" textAnchor="middle">{shown ? v : ''}</text>
                {shown && !kept && (
                  <line x1={cellX(i) + 12} y1={Y_FILTER + CELL_H / 2} x2={cellX(i) + CELL_W - 12} y2={Y_FILTER + CELL_H / 2} className="fpmr-strike" />
                )}
              </g>
            );
          })}

          {/* reduce accumulator */}
          <g className={`fpmr-acc ${view.inReduce ? 'is-on' : 'is-off'}`}>
            <rect x={W / 2 - 80} y={Y_REDUCE} width={160} height={CELL_H + 6} rx={10} className="fpmr-acc-box" />
            <text x={W / 2 - 62} y={Y_REDUCE + 28} className="fpmr-acc-label" textAnchor="start">acc</text>
            <text x={W / 2 + 60} y={Y_REDUCE + 29} className="fpmr-acc-val" textAnchor="end">{view.reduceRevealed > 0 ? view.acc : 0}</text>
          </g>
        </svg>
      </div>

      <div className="fpmr-controls">
        <button type="button" className="fpmr-btn" onClick={togglePlay}>
          {playing && step < TOTAL ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < TOTAL ? 'Pause' : (step >= TOTAL ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="fpmr-btn" onClick={() => setStep((s) => Math.min(TOTAL, s + 1))} disabled={step >= TOTAL}>
          <SkipForward size={14} /> Step
        </button>
        <label className="fpmr-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="fpmr-speed-range"
          />
          <span className="fpmr-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="fpmr-progress">{step + 1} / {TOTAL + 1}</span>
      </div>

      <div className="fpmr-readout">
        <div className="fpmr-stat is-map">
          <span className="fpmr-stat-label">stage</span>
          <span className="fpmr-stat-val">{view.phase}</span>
        </div>
        <div className="fpmr-stat is-filter">
          <span className="fpmr-stat-label">kept</span>
          <span className="fpmr-stat-val">{KEPT.length} of {N}</span>
        </div>
        <div className="fpmr-stat is-reduce">
          <Sigma size={15} />
          <span className="fpmr-stat-label">acc</span>
          <span className="fpmr-stat-val">{view.reduceRevealed > 0 ? view.acc : 0}</span>
        </div>
      </div>

      <div className="fpmr-note">
        <span className="fpmr-note-label">now</span>
        <span className="fpmr-note-body">{noteText}</span>
      </div>
    </div>
  );
}
