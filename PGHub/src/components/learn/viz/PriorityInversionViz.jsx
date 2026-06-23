import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Lock, Unlock, AlertTriangle, Check } from 'lucide-react';
import './PriorityInversionViz.css';

const TICK_MS = 700;
const TASKS = ['H', 'M', 'L'];

// Each timeline cell: who runs at this tick + flags. Two scenarios.
// run: 'H'|'M'|'L'|null  | lockHolder | hBlocked | boosted (L boosted) | event
function buildTimeline(inherit) {
  const cells = [];
  const push = (c) => cells.push(c);

  if (!inherit) {
    push({ t: 0, run: 'L', holder: 'L', hBlocked: false, event: 'L acquires lock K' });
    push({ t: 1, run: 'L', holder: 'L', hBlocked: false, event: 'L runs in critical section' });
    push({ t: 2, run: 'H', holder: 'L', hBlocked: true, event: 'H wakes, preempts L, tries K — blocks' });
    push({ t: 3, run: 'M', holder: 'L', hBlocked: true, event: 'M wakes; scheduler picks M over L' });
    push({ t: 4, run: 'M', holder: 'L', hBlocked: true, event: 'M monopolises CPU — L starved' });
    push({ t: 5, run: 'M', holder: 'L', hBlocked: true, event: 'M still running — H deadline approaching' });
    push({ t: 6, run: 'M', holder: 'L', hBlocked: true, deadlineMiss: true, event: 'H deadline MISSED — unbounded inversion' });
    push({ t: 7, run: 'M', holder: 'L', hBlocked: true, event: 'M eventually yields…' });
    push({ t: 8, run: 'L', holder: 'L', hBlocked: true, event: 'L finally runs, releases K' });
    push({ t: 9, run: 'H', holder: null, hBlocked: false, released: true, event: 'H unblocks — far too late' });
    return cells;
  }

  push({ t: 0, run: 'L', holder: 'L', hBlocked: false, event: 'L acquires lock K' });
  push({ t: 1, run: 'L', holder: 'L', hBlocked: false, event: 'L runs in critical section' });
  push({ t: 2, run: 'L', holder: 'L', hBlocked: true, boosted: true, event: 'H blocks on K → boost L to H priority' });
  push({ t: 3, run: 'L', holder: 'L', hBlocked: true, boosted: true, event: 'M wakes but cannot preempt boosted L' });
  push({ t: 4, run: 'L', holder: 'L', hBlocked: true, boosted: true, event: 'L finishes critical section fast' });
  push({ t: 5, run: 'H', holder: null, hBlocked: false, released: true, event: 'L releases K, drops priority; H proceeds' });
  push({ t: 6, run: 'H', holder: null, hBlocked: false, event: 'H meets its deadline' });
  push({ t: 7, run: 'M', holder: null, hBlocked: false, event: 'M runs afterward — correct order' });
  return cells;
}

function laneState(cell, task) {
  if (cell.run === task) return cell.boosted && task === 'L' ? 'boost' : 'run';
  if (task === 'H' && cell.hBlocked) return 'blocked';
  if (task === 'H' && cell.released && cell.run === 'H') return 'run';
  return 'idle';
}

export default function PriorityInversionViz() {
  const [inherit, setInherit] = useState(false);
  const cells = useMemo(() => buildTimeline(inherit), [inherit]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const [prev, setPrev] = useState(cells);
  if (prev !== cells) {
    setPrev(cells);
    setIdx(0);
    setPlaying(false);
  }

  const atEnd = idx >= cells.length - 1;
  const playing = playingRaw && !atEnd;
  const cell = cells[Math.min(idx, cells.length - 1)];

  const next = useCallback(() => {
    setIdx((i) => (i >= cells.length - 1 ? i : i + 1));
  }, [cells.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return undefined;
    }
    timerRef.current = setInterval(next, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  const colW = 44;
  const laneH = 40;
  const labelW = 70;
  const W = labelW + cells.length * colW + 10;
  const H = TASKS.length * laneH + 30;

  return (
    <div className="piviz">
      <div className="piviz-header">
        <div className="piviz-title">Priority inversion</div>
        <div className="piviz-toggle">
          <button
            type="button"
            className={`piviz-tgbtn ${!inherit ? 'piviz-tgbtn-active' : ''}`}
            onClick={() => setInherit(false)}
            aria-pressed={!inherit}
          >
            Naive
          </button>
          <button
            type="button"
            className={`piviz-tgbtn ${inherit ? 'piviz-tgbtn-active' : ''}`}
            onClick={() => setInherit(true)}
            aria-pressed={inherit}
          >
            Priority inheritance
          </button>
        </div>
      </div>

      <div className="piviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="piviz-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Scheduling timeline">
          {TASKS.map((task, li) => {
            const y = 24 + li * laneH;
            const labelMap = { H: 'High', M: 'Medium', L: 'Low' };
            return (
              <g key={task}>
                <text x={8} y={y + laneH / 2 - 2} className="piviz-lane-label">
                  {task}
                </text>
                <text x={8} y={y + laneH / 2 + 11} className="piviz-lane-sub">
                  {labelMap[task]}
                </text>
                {cells.map((c, ci) => {
                  const x = labelW + ci * colW;
                  const active = ci <= idx;
                  const state = laneState(c, task);
                  let cls = 'piviz-block piviz-block-idle';
                  if (state === 'run') cls = 'piviz-block piviz-block-run';
                  else if (state === 'boost') cls = 'piviz-block piviz-block-boost';
                  else if (state === 'blocked') cls = 'piviz-block piviz-block-blocked';
                  return (
                    <rect
                      key={ci}
                      x={x + 2}
                      y={y + 4}
                      width={colW - 4}
                      height={laneH - 12}
                      rx={4}
                      className={cls}
                      opacity={active ? 1 : 0.18}
                    />
                  );
                })}
              </g>
            );
          })}
          {/* lock holder markers along bottom */}
          {cells.map((c, ci) => {
            const x = labelW + ci * colW;
            const active = ci <= idx;
            return (
              <text
                key={`tk${ci}`}
                x={x + colW / 2}
                y={H - 8}
                className="piviz-tick"
                textAnchor="middle"
                opacity={active ? 1 : 0.3}
              >
                {c.t}
              </text>
            );
          })}
          {/* playhead */}
          <line
            x1={labelW + idx * colW + colW / 2}
            y1={18}
            x2={labelW + idx * colW + colW / 2}
            y2={H - 18}
            className="piviz-playhead"
          />
        </svg>
      </div>

      <div className="piviz-status">
        <div className="piviz-status-item">
          {cell.holder ? <Lock size={13} aria-hidden="true" /> : <Unlock size={13} aria-hidden="true" />}
          <span>lock K: {cell.holder ? `held by ${cell.holder}` : 'free'}</span>
        </div>
        <div className="piviz-status-item">
          <span className={`piviz-dot ${cell.hBlocked ? 'piviz-dot-bad' : 'piviz-dot-ok'}`} />
          <span>H {cell.hBlocked ? 'blocked' : 'runnable'}</span>
        </div>
        {cell.boosted && (
          <div className="piviz-status-item piviz-status-boost">
            <span>L boosted to H priority</span>
          </div>
        )}
      </div>

      <p className={`piviz-caption ${cell.deadlineMiss ? 'piviz-caption-bad' : ''}`}>
        {cell.deadlineMiss && <AlertTriangle size={14} aria-hidden="true" />}
        {cell.released && inherit && <Check size={14} className="piviz-cap-ok" aria-hidden="true" />}
        <span>{cell.event}</span>
      </p>

      <div className="piviz-controls">
        <button
          type="button"
          className="piviz-btn piviz-btn-ghost"
          onClick={() => {
            setPlaying(false);
            setIdx(0);
          }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="piviz-btn piviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="piviz-btn piviz-btn-ghost"
          onClick={next}
          disabled={atEnd}
        >
          <SkipForward size={15} aria-hidden="true" />
          <span>Step</span>
        </button>
        <span className="piviz-step-count">
          t = {cell.t} · {idx} / {cells.length - 1}
        </span>
      </div>
    </div>
  );
}
