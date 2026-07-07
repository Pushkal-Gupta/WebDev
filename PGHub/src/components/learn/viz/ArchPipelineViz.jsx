import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Play, Pause, SkipForward, RotateCcw, Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';
import './ArchPipelineViz.css';

const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];
const STAGE_HUE = {
  IF: 'var(--hue-sky)',
  ID: 'var(--hue-violet)',
  EX: 'var(--accent)',
  MEM: 'var(--hue-pink)',
  WB: 'var(--hue-mint)',
};

// Six instructions. The `and` reads x2 that the preceding `lw` loads → load-use hazard.
const INSTRS = [
  { text: 'lw   x2, 0(x1)' },
  { text: 'and  x4, x2, x5' },
  { text: 'or   x6, x3, x7' },
  { text: 'add  x8, x6, x9' },
  { text: 'sub  x10,x8, x2' },
  { text: 'sw   x10,4(x1)' },
];

// Deterministic schedules: for each instruction, the starting cycle of each of the 5 stages.
// A value of -1 in a cycle column means a bubble/stall for that instruction on that cycle.
// "clean" = textbook overlapping diagonal. "hazard" = one-cycle load-use bubble on the `and`.
function buildClean() {
  return INSTRS.map((_, i) => STAGES.map((_s, k) => i + k));
}

function buildHazard() {
  // Instruction 1 (`and`) stalls one cycle in ID (bubble), then everything after shifts right by 1.
  const rows = [];
  for (let i = 0; i < INSTRS.length; i += 1) {
    if (i === 0) {
      rows.push(STAGES.map((_s, k) => k));            // lw: 0,1,2,3,4
    } else if (i === 1) {
      // and: IF at 1, then a stall bubble at cycle 2, ID at 3, EX 4, MEM 5, WB 6
      rows.push([1, 3, 4, 5, 6]);
    } else {
      // shift the clean schedule right by one after the bubble
      rows.push(STAGES.map((_s, k) => i + k + 1));
    }
  }
  return rows;
}

const SCHED = { clean: buildClean(), hazard: buildHazard() };
const BUBBLE = { row: 1, cycle: 2 }; // where the stall bubble sits in the hazard schedule

const MODES = [
  { id: 'clean', label: 'no hazard' },
  { id: 'hazard', label: 'load-use hazard' },
];

// geometry
const LABEL_W = 128;
const CELL_W = 52;
const CELL_H = 34;
const TOP = 40;
const GAP = 4;
const N_CYCLES = 11;
const W = LABEL_W + N_CYCLES * CELL_W + 24;
const H = TOP + INSTRS.length * CELL_H + 22;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ArchPipelineViz() {
  const [mode, setMode] = useState('clean');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const sched = SCHED[mode];
  const total = N_CYCLES; // number of clock cycles to advance through

  function pickMode(id) { setMode(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s2) => Math.min(total, s2 + 1)),
      Math.round((reduced() ? 320 : 820) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const finished = step >= total;
  const showPause = playing && step < total;
  const curCycle = step; // cycles revealed 0..step-1 (cycle index = column)

  // For each instruction, find which stage (if any) is active on a given cycle column.
  function stageAt(row, cycle) {
    const starts = sched[row];
    for (let k = 0; k < STAGES.length; k += 1) {
      if (starts[k] === cycle) return STAGES[k];
    }
    return null;
  }
  function isBubble(row, cycle) {
    return mode === 'hazard' && row === BUBBLE.row && cycle === BUBBLE.cycle;
  }

  // readouts
  const completed = INSTRS.reduce((acc, _in, i) => {
    const wbCycle = sched[i][4];
    return acc + (wbCycle < curCycle ? 1 : 0);
  }, 0);
  const stalls = mode === 'hazard' ? 1 : 0;
  const cpiSoFar = completed > 0 ? ((curCycle) / completed).toFixed(2) : '—';

  // "now" note
  let noteBody = 'press Step or Play to advance the clock';
  if (curCycle > 0) {
    const c = curCycle - 1;
    const active = [];
    for (let i = 0; i < INSTRS.length; i += 1) {
      if (isBubble(i, c)) { active.push(`bubble in the pipe (I${i + 1} stalls)`); continue; }
      const st = stageAt(i, c);
      if (st) active.push(`I${i + 1} in ${st}`);
    }
    noteBody = `Cycle ${c + 1}: ${active.length ? active.join(', ') : 'pipeline draining'}.`;
  }

  return (
    <div className="archpl">
      <div className="archpl-head">
        <div className="archpl-head-icon"><Cpu size={18} /></div>
        <div className="archpl-head-text">
          <h3 className="archpl-title">The 5-stage pipeline: overlap and the load-use stall</h3>
          <p className="archpl-sub">
            Each instruction flows IF → ID → EX → MEM → WB. Stages overlap so a new
            instruction starts every cycle — until a value one instruction needs isn&apos;t
            ready yet, forcing a bubble.
          </p>
        </div>
        <button type="button" className="archpl-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="archpl-chips">
        {MODES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`archpl-chip${c.id === mode ? ' is-active' : ''}`}
            onClick={() => pickMode(c.id)}
          >
            {c.label}
          </button>
        ))}
        <div className="archpl-legend">
          {STAGES.map((st) => (
            <span key={st} className="archpl-legend-item">
              <span className="archpl-legend-swatch" style={{ background: `color-mix(in srgb, ${STAGE_HUE[st]} 60%, transparent)` }} />
              {st}
            </span>
          ))}
        </div>
      </div>

      <div className="archpl-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="archpl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="archpl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" className="archpl-hatch-bg" />
              <line x1="0" y1="0" x2="0" y2="6" className="archpl-hatch-line" />
            </pattern>
          </defs>

          {/* cycle column headers */}
          {Array.from({ length: N_CYCLES }).map((_, c) => (
            <g key={`h${c}`}>
              <text
                x={LABEL_W + c * CELL_W + CELL_W / 2}
                y={26}
                textAnchor="middle"
                className={`archpl-cyc${c < curCycle ? ' is-done' : ''}${c === curCycle - 1 ? ' is-now' : ''}`}
              >
                {c + 1}
              </text>
            </g>
          ))}

          {/* the "now" cycle vertical marker */}
          {curCycle > 0 && curCycle <= N_CYCLES && (
            <rect
              x={LABEL_W + (curCycle - 1) * CELL_W}
              y={TOP - 8}
              width={CELL_W}
              height={INSTRS.length * CELL_H + 6}
              rx={5}
              className="archpl-nowcol"
            />
          )}

          {/* rows */}
          {INSTRS.map((ins, i) => (
            <g key={`r${i}`}>
              <text x={12} y={TOP + i * CELL_H + CELL_H / 2 + 4} className="archpl-instr">{ins.text}</text>
              {Array.from({ length: N_CYCLES }).map((_, c) => {
                const revealed = c < curCycle;
                const bubble = isBubble(i, c);
                const st = stageAt(i, c);
                const x = LABEL_W + c * CELL_W + GAP / 2;
                const y = TOP + i * CELL_H + GAP / 2;
                const cw = CELL_W - GAP;
                const ch = CELL_H - GAP;
                if (bubble) {
                  return (
                    <g key={`c${i}-${c}`} className={`archpl-cell${revealed ? ' is-on' : ''}`}>
                      <rect x={x} y={y} width={cw} height={ch} rx={5} fill="url(#archpl-hatch)" className="archpl-bubble" />
                      <text x={x + cw / 2} y={y + ch / 2 + 4} textAnchor="middle" className="archpl-bubble-t">
                        stall
                      </text>
                    </g>
                  );
                }
                if (!st) return null;
                return (
                  <g key={`c${i}-${c}`} className={`archpl-cell${revealed ? ' is-on' : ''}`}>
                    <rect
                      x={x}
                      y={y}
                      width={cw}
                      height={ch}
                      rx={5}
                      className="archpl-stagecell"
                      style={{
                        fill: `color-mix(in srgb, ${STAGE_HUE[st]} ${revealed ? 26 : 8}%, transparent)`,
                        stroke: STAGE_HUE[st],
                      }}
                    />
                    <text
                      x={x + cw / 2}
                      y={y + ch / 2 + 4}
                      textAnchor="middle"
                      className="archpl-stage-t"
                      style={{ fill: STAGE_HUE[st] }}
                    >
                      {st}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      <div className="archpl-controls">
        <button type="button" className="archpl-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="archpl-btn" onClick={() => setStep((x) => Math.min(total, x + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="archpl-speed">
          <span className="archpl-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="archpl-speed-range"
          />
          <span className="archpl-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="archpl-progress">cycle {Math.min(curCycle, total)} / {total}</span>
      </div>

      <div className="archpl-readout">
        <div className="archpl-stat is-cycle">
          <Gauge size={13} />
          <span className="archpl-stat-label">cycle</span>
          <span className="archpl-stat-val">{Math.min(curCycle, total)}</span>
        </div>
        <div className="archpl-stat is-good">
          <CheckCircle2 size={13} />
          <span className="archpl-stat-label">completed</span>
          <span className="archpl-stat-val">{completed} / {INSTRS.length}</span>
        </div>
        <div className={`archpl-stat ${stalls > 0 ? 'is-warn' : 'is-good'}`}>
          <AlertTriangle size={13} />
          <span className="archpl-stat-label">stalls</span>
          <span className="archpl-stat-val">{stalls}</span>
        </div>
        <div className="archpl-stat is-cpi">
          <span className="archpl-stat-label">CPI so far</span>
          <span className="archpl-stat-val">{cpiSoFar}</span>
        </div>
      </div>

      <div className="archpl-note">
        <span className="archpl-note-label">now</span>
        <span className="archpl-note-body">{noteBody}</span>
      </div>
    </div>
  );
}
