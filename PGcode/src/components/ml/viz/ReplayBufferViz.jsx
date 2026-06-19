import React, { useMemo, useState } from 'react';
import { RotateCcw, Play, Shuffle, Snowflake } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const COLS = 8;
const ROWS = 4;
const CAP = COLS * ROWS; // 32 transitions
const CELL = 52;
const GAP = 6;
const GRID_X = 40;
const GRID_Y = 40;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// each transition carries an "episode" hue index so correlation is visible:
// sequential pushes share the same episode color for a run of cells.
function buildBuffer(fillTo) {
  const rand = mulberry32(7);
  const cells = [];
  let ep = 0;
  let runLeft = 2 + Math.floor(rand() * 4);
  for (let i = 0; i < fillTo; i++) {
    if (runLeft === 0) {
      ep += 1;
      runLeft = 2 + Math.floor(rand() * 4);
    }
    cells.push({ idx: i, ep, t: i });
    runLeft -= 1;
  }
  return cells;
}

const EP_TOKENS = ['var(--accent)', 'var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--medium)'];
function epColor(ep) {
  return EP_TOKENS[ep % EP_TOKENS.length];
}

export default function ReplayBufferViz() {
  const [fill, setFill] = useState(CAP);
  const [mode, setMode] = useState('random'); // 'random' | 'sequential'
  const [seed, setSeed] = useState(1);
  const [frozen, setFrozen] = useState(true);

  const cells = useMemo(() => buildBuffer(fill), [fill]);

  const batchSize = 6;
  const drawn = useMemo(() => {
    if (cells.length === 0) return [];
    if (mode === 'sequential') {
      const rand = mulberry32(seed * 31 + 5);
      const start = Math.floor(rand() * Math.max(1, cells.length - batchSize));
      return cells.slice(start, start + batchSize).map((c) => c.idx);
    }
    const rand = mulberry32(seed * 97 + 3);
    const pool = cells.map((c) => c.idx);
    const out = [];
    for (let i = 0; i < batchSize && pool.length; i++) {
      const j = Math.floor(rand() * pool.length);
      out.push(pool[j]);
      pool.splice(j, 1);
    }
    return out;
  }, [cells, mode, seed]);

  const drawnSet = useMemo(() => new Set(drawn), [drawn]);

  // correlation proxy: number of adjacent same-episode pairs within the batch
  const distinctEps = useMemo(() => {
    const eps = new Set(drawn.map((idx) => cells[idx]?.ep));
    return eps.size;
  }, [drawn, cells]);

  const cellOf = (i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    return {
      x: GRID_X + c * (CELL + GAP),
      y: GRID_Y + r * (CELL + GAP),
    };
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          <text x={GRID_X} y={24} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            REPLAY BUFFER · ring of {CAP} transitions (s, a, r, s′) · color = source episode
          </text>

          {Array.from({ length: CAP }).map((_, i) => {
            const { x, y } = cellOf(i);
            const filled = i < cells.length;
            const cell = cells[i];
            const isDrawn = drawnSet.has(i);
            return (
              <g key={`cell-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx="6"
                  fill={filled ? epColor(cell.ep) : 'var(--bg)'}
                  opacity={filled ? (isDrawn ? 0.92 : 0.28) : 1}
                  stroke={isDrawn ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isDrawn ? 2.2 : 0.8}
                />
                {filled && (
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 3}
                    fontSize="9"
                    fill={isDrawn ? 'var(--bg)' : 'var(--text-dim)'}
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                    fontWeight={isDrawn ? '700' : '500'}
                  >
                    {cell.t}
                  </text>
                )}
              </g>
            );
          })}

          {/* target-network freeze indicator */}
          <g transform={`translate(${GRID_X}, ${GRID_Y + ROWS * (CELL + GAP) + 6})`}>
            <rect x="0" y="0" width="240" height="26" rx="6" fill={frozen ? 'var(--hue-sky)' : 'var(--medium)'} opacity="0.14" stroke={frozen ? 'var(--hue-sky)' : 'var(--medium)'} strokeWidth="0.8" />
            <text x="12" y="17" fontSize="9" fill={frozen ? 'var(--hue-sky)' : 'var(--medium)'} fontFamily="var(--mono)" fontWeight="700">
              {frozen ? 'TARGET NET θ⁻ FROZEN — stable bootstrap' : 'TARGET NET θ⁻ SYNCING — copy θ → θ⁻'}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">fill</span>
          <input type="range" min="4" max={CAP} step="1" value={fill} onChange={(e) => setFill(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{fill}/{CAP}</span>
        </label>

        <div className="mlviz-toggles">
          <button type="button" className={`mlviz-toggle ${mode === 'random' ? 'is-on' : ''}`} onClick={() => setMode('random')}>
            <span className="mlviz-toggle-dot" />random minibatch (decorrelated)
          </button>
          <button type="button" className={`mlviz-toggle ${mode === 'sequential' ? 'is-on' : ''}`} onClick={() => setMode('sequential')}>
            <span className="mlviz-toggle-dot" />sequential slice (correlated)
          </button>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">B</span>
            <span className="mlviz-val">sampled = [{drawn.map((d) => cells[d]?.t).join(', ')}]</span>
            <span className="mlviz-sub">minibatch of {batchSize} transitions</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">ρ</span>
            <span className="mlviz-val">{distinctEps} distinct episodes</span>
            <span className="mlviz-sub">{mode === 'random' ? 'random draw spreads across episodes → low correlation' : 'consecutive slice is one episode → highly correlated'}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setSeed((s) => s + 1)}>
            <Shuffle size={13} />
            <span>Sample batch</span>
          </button>
          <button type="button" className={`mlviz-btn ${frozen ? '' : 'mlviz-btn-primary'}`} onClick={() => setFrozen((f) => !f)}>
            {frozen ? <Snowflake size={13} /> : <Play size={13} />}
            <span>{frozen ? 'Sync target' : 'Freeze target'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setFill(CAP); setMode('random'); setSeed(1); setFrozen(true); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          random replay breaks temporal correlation · a frozen target net keeps the TD target from chasing itself
        </div>
      </div>
    </div>
  );
}
