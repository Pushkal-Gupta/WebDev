import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Cpu } from 'lucide-react';
import './PipelineParallelViz.css';

const TICK_MS = 360;

// Build a schedule grid: schedule[stage][tick] = { type:'F'|'B', mb } | null
function buildGPipe(P, M) {
  const ticks = [];
  // forward: stage s starts mb at tick s+mb ; backward mirrored after fill
  // We model GPipe: all forwards, then all backwards.
  const grid = Array.from({ length: P }, () => []);
  const fwdLen = P + M - 1;
  // forward phase
  for (let t = 0; t < fwdLen; t += 1) {
    for (let s = 0; s < P; s += 1) {
      const mb = t - s;
      grid[s][t] = mb >= 0 && mb < M ? { type: 'F', mb } : null;
    }
  }
  // backward phase (reverse stage order), starts after forward fully drains at last stage
  const bStart = fwdLen;
  for (let t = 0; t < fwdLen; t += 1) {
    for (let s = 0; s < P; s += 1) {
      // backward of mb on stage s happens at offset (P-1-s)
      const mb = M - 1 - (t - (P - 1 - s));
      const gt = bStart + t;
      grid[s][gt] = mb >= 0 && mb < M ? { type: 'B', mb } : null;
    }
  }
  ticks.push(bStart + fwdLen);
  return { grid, total: bStart + fwdLen };
}

function build1F1B(P, M) {
  // Compact 1F1B: warm-up forwards, steady 1F1B, cool-down backwards.
  const total = 2 * M + 2 * (P - 1);
  const grid = Array.from({ length: P }, () => new Array(total).fill(null));
  for (let s = 0; s < P; s += 1) {
    const warm = P - 1 - s;
    // forwards for this stage occupy ticks: s + mb*... approximate steady cadence
    let t = s; // first forward arrives at tick s
    let fMb = 0;
    let bMb = 0;
    const numWarm = Math.min(P - s, M);
    // warm-up forwards
    for (let i = 0; i < numWarm && fMb < M; i += 1) {
      if (t < total) grid[s][t] = { type: 'F', mb: fMb };
      fMb += 1;
      t += 1;
    }
    void warm;
    // steady 1F1B: alternate B then F
    while (bMb < M && t < total) {
      if (bMb < M) {
        grid[s][t] = { type: 'B', mb: bMb };
        bMb += 1;
        t += 1;
      }
      if (fMb < M && t < total) {
        grid[s][t] = { type: 'F', mb: fMb };
        fMb += 1;
        t += 1;
      }
    }
  }
  return { grid, total };
}

export default function PipelineParallelViz() {
  const [P, setP] = useState(4);
  const [M, setM] = useState(6);
  const [sched, setSched] = useState('gpipe');

  const { grid, total } = useMemo(
    () => (sched === 'gpipe' ? buildGPipe(P, M) : build1F1B(P, M)),
    [P, M, sched]
  );

  const [tick, setTick] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const [prev, setPrev] = useState(grid);
  if (prev !== grid) {
    setPrev(grid);
    setTick(0);
    setPlaying(false);
  }

  const atEnd = tick >= total - 1;
  const playing = playingRaw && !atEnd;

  const next = useCallback(() => {
    setTick((t) => (t >= total - 1 ? t : t + 1));
  }, [total]);

  useEffect(() => {
    if (!playing) return undefined;
    timerRef.current = setTimeout(() => {
      setTick((t) => Math.min(t + 1, total - 1));
    }, Math.round(TICK_MS / speed));
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [playing, tick, speed, total]);

  // bubble: idle cells / total cells up to now
  let busy = 0;
  let idle = 0;
  for (let s = 0; s < P; s += 1) {
    for (let t = 0; t <= tick; t += 1) {
      if (grid[s][t]) busy += 1;
      else idle += 1;
    }
  }
  const util = busy + idle > 0 ? Math.round((busy / (busy + idle)) * 100) : 0;
  const bubbleFrac = Math.round(((P - 1) / M) * 100);

  const cellW = Math.max(20, Math.min(34, Math.floor(640 / total)));
  const cellH = 30;
  const labelW = 56;
  const W = labelW + total * cellW + 8;
  const H = P * cellH + 36;

  return (
    <div className="ppviz">
      <div className="ppviz-header">
        <div className="ppviz-head-left">
          <span className="ppviz-iconbox">
            <Cpu size={16} aria-hidden="true" />
          </span>
          <div>
            <div className="ppviz-title">Pipeline-parallel schedule</div>
            <div className="ppviz-sub">
              {P} stages · {M} micro-batches · {sched === 'gpipe' ? 'GPipe' : '1F1B'}
            </div>
          </div>
        </div>
        <div className="ppviz-toggle">
          <button
            type="button"
            className={`ppviz-tgbtn ${sched === 'gpipe' ? 'ppviz-tgbtn-active' : ''}`}
            onClick={() => setSched('gpipe')}
            aria-pressed={sched === 'gpipe'}
          >
            GPipe
          </button>
          <button
            type="button"
            className={`ppviz-tgbtn ${sched === '1f1b' ? 'ppviz-tgbtn-active' : ''}`}
            onClick={() => setSched('1f1b')}
            aria-pressed={sched === '1f1b'}
          >
            1F1B
          </button>
        </div>
      </div>

      <div className="ppviz-controls">
        <label className="ppviz-field">
          <span>Stages P = {P}</span>
          <input type="range" min={2} max={6} value={P} onChange={(e) => setP(Number(e.target.value))} />
        </label>
        <label className="ppviz-field">
          <span>Micro-batches M = {M}</span>
          <input type="range" min={2} max={10} value={M} onChange={(e) => setM(Number(e.target.value))} />
        </label>
      </div>

      <div className="ppviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ppviz-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Pipeline schedule grid">
          {Array.from({ length: P }).map((_, s) => {
            const y = 26 + s * cellH;
            return (
              <g key={s}>
                <text x={8} y={y + cellH / 2 + 3} className="ppviz-stage-label">
                  GPU {s}
                </text>
                {Array.from({ length: total }).map((__, t) => {
                  const cell = grid[s][t];
                  const x = labelW + t * cellW;
                  const visible = t <= tick;
                  let cls = 'ppviz-cell ppviz-cell-idle';
                  if (cell?.type === 'F') cls = 'ppviz-cell ppviz-cell-f';
                  else if (cell?.type === 'B') cls = 'ppviz-cell ppviz-cell-b';
                  const current = t === tick;
                  return (
                    <g key={t}>
                      <rect
                        x={x + 1.5}
                        y={y + 2}
                        width={cellW - 3}
                        height={cellH - 6}
                        rx={3}
                        className={cls}
                        opacity={visible ? 1 : 0.12}
                      />
                      {cell && visible && (
                        <text
                          x={x + cellW / 2}
                          y={y + cellH / 2 + 1}
                          className="ppviz-cell-text"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {cell.type}
                          {cell.mb + 1}
                        </text>
                      )}
                      {current && (
                        <rect
                          x={x + 0.5}
                          y={y + 1}
                          width={cellW - 1}
                          height={cellH - 4}
                          rx={4}
                          className="ppviz-cell-cursor"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
          <text x={labelW} y={H - 6} className="ppviz-axis">
            tick {tick}
          </text>
        </svg>
      </div>

      <div className="ppviz-stats">
        <div className="ppviz-stat">
          <span className="ppviz-stat-k">utilization (so far)</span>
          <span className="ppviz-stat-v">{util}%</span>
        </div>
        <div className="ppviz-stat">
          <span className="ppviz-stat-k">bubble (P-1)/M</span>
          <span className="ppviz-stat-v">{bubbleFrac}%</span>
        </div>
        <div className="ppviz-stat">
          <span className="ppviz-stat-k">total ticks</span>
          <span className="ppviz-stat-v">{total}</span>
        </div>
      </div>

      <p className="ppviz-caption">
        {sched === 'gpipe'
          ? 'GPipe: stream all forwards down the stages (the fill bubble), then unwind all backwards (drain bubble). Steady state in the middle keeps every GPU busy; the warm-up/cool-down idle is (P-1)/M.'
          : '1F1B interleaves one backward after each forward, so each stage holds at most P micro-batches of activations — same bubble, far less activation memory.'}
      </p>

      <div className="ppviz-controlsrow">
        <button
          type="button"
          className="ppviz-btn ppviz-btn-ghost"
          onClick={() => {
            setPlaying(false);
            setTick(0);
          }}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="ppviz-btn ppviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setTick(0);
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
          className="ppviz-btn ppviz-btn-ghost"
          onClick={next}
          disabled={atEnd}
        >
          <SkipForward size={15} aria-hidden="true" />
          <span>Step</span>
        </button>
        <label className="ppviz-speed">
          <span className="ppviz-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="ppviz-speed-range"
          />
          <span className="ppviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="ppviz-legend">
          <span className="ppviz-leg ppviz-leg-f">forward</span>
          <span className="ppviz-leg ppviz-leg-b">backward</span>
          <span className="ppviz-leg ppviz-leg-i">idle bubble</span>
        </span>
      </div>
    </div>
  );
}
