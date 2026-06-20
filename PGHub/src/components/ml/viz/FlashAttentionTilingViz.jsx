import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Grid3x3, Zap, MemoryStick } from 'lucide-react';
import './MLViz.css';

/*
 * FlashAttentionTilingViz
 *
 * The N×N attention-score matrix never exists in HBM. Flash attention sweeps
 * it one B×B tile at a time: load a Q row-block and a K/V column-block into
 * SRAM, compute the tile's scores on-chip, fold them into each row's running
 * max and sum (online softmax), discard the tile. Step through the sweep.
 */

const W = 720;
const H = 340;
const N = 16;
const GRID_X = 50;
const GRID_Y = 56;
const GRID_SIZE = 240;
const CELL = GRID_SIZE / N;
const SRAM_X = 360;
const STEP_MS = 700;

export default function FlashAttentionTilingViz() {
  const [tileB, setTileB] = useState(4);
  const [tileIdx, setTileIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const timerRef = useRef(null);

  const T = N / tileB; // tiles per side
  const totalTiles = T * T;
  const curRow = Math.min(Math.floor(tileIdx / T), T - 1);
  const curCol = tileIdx % T;
  const finished = tileIdx >= totalTiles;

  const advance = useCallback(() => {
    setTileIdx((t) => (t >= T * T ? 0 : t + 1));
  }, [T]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(advance, reducedMotion ? 100 : STEP_MS);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isRunning, reducedMotion, advance]);

  const handleReset = () => { setIsRunning(false); setTileIdx(0); };

  // per-row-block progress: how many column blocks folded in
  const rowProgress = useMemo(() => {
    const out = new Array(T).fill(0);
    for (let t = 0; t < Math.min(tileIdx, T * T); t++) {
      out[Math.floor(t / T)] += 1;
    }
    return out;
  }, [tileIdx, T]);

  const sramCells = tileB * tileB;
  const hbmScoreCells = N * N;
  const kvLoads = Math.min(tileIdx, totalTiles);

  const caption = finished
    ? `Sweep complete: all ${totalTiles} tiles processed on-chip — the ${N}×${N} score matrix never touched HBM.`
    : tileIdx === 0
      ? `Ready: ${T}×${T} tiles of ${tileB}×${tileB}. Standard attention would write all ${hbmScoreCells} scores to HBM first.`
      : `Tile (${curRow},${curCol}): K/V block ${curCol} streams into SRAM; row block ${curRow}'s running max and sum fold in scores ${curCol + 1}/${T}.`;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text x={GRID_X} y={26} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            SCORE MATRIX QKᵀ ({N}×{N}) — NEVER MATERIALIZED
          </text>
          <text x={SRAM_X} y={26} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            ON-CHIP SRAM · RUNNING SOFTMAX STATE
          </text>

          <text x={GRID_X - 8} y={GRID_Y + GRID_SIZE / 2} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end" transform={`rotate(-90 ${GRID_X - 8} ${GRID_Y + GRID_SIZE / 2})`}>
            queries (row blocks)
          </text>
          <text x={GRID_X + GRID_SIZE / 2} y={GRID_Y + GRID_SIZE + 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            keys / values (column blocks)
          </text>

          {/* cells */}
          {Array.from({ length: N }).map((_, i) =>
            Array.from({ length: N }).map((_, j) => {
              const tr = Math.floor(i / tileB);
              const tc = Math.floor(j / tileB);
              const t = tr * T + tc;
              const isDone = t < Math.min(tileIdx, totalTiles);
              const isCur = !finished && tr === curRow && tc === curCol;
              return (
                <rect
                  key={`${i}-${j}`}
                  x={GRID_X + j * CELL + 0.5}
                  y={GRID_Y + i * CELL + 0.5}
                  width={CELL - 1}
                  height={CELL - 1}
                  fill={isCur ? 'var(--accent)' : isDone ? 'var(--hue-sky)' : 'var(--surface)'}
                  opacity={isCur ? 0.9 : isDone ? 0.35 : 0.5}
                  style={{ transition: reducedMotion ? 'none' : 'fill 0.2s ease, opacity 0.2s ease' }}
                />
              );
            })
          )}

          {/* tile grid lines */}
          {Array.from({ length: T + 1 }).map((_, k) => (
            <g key={k}>
              <line x1={GRID_X + k * tileB * CELL} y1={GRID_Y} x2={GRID_X + k * tileB * CELL} y2={GRID_Y + GRID_SIZE} stroke="var(--border)" strokeWidth="1" opacity="0.8" />
              <line x1={GRID_X} y1={GRID_Y + k * tileB * CELL} x2={GRID_X + GRID_SIZE} y2={GRID_Y + k * tileB * CELL} stroke="var(--border)" strokeWidth="1" opacity="0.8" />
            </g>
          ))}

          {/* current tile outline */}
          {!finished && (
            <rect
              x={GRID_X + curCol * tileB * CELL}
              y={GRID_Y + curRow * tileB * CELL}
              width={tileB * CELL}
              height={tileB * CELL}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
            />
          )}

          {/* SRAM panel */}
          <rect x={SRAM_X} y={GRID_Y} width={W - SRAM_X - 26} height={92} rx="8" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.2" opacity="0.85" />
          <text x={SRAM_X + 12} y={GRID_Y + 20} fontSize="9.5" fill="var(--accent)" fontFamily="var(--mono)" fontWeight="700" letterSpacing="0.1em">
            SRAM — {sramCells} score cells live ({tileB}×{tileB})
          </text>
          <text x={SRAM_X + 12} y={GRID_Y + 40} fontSize="9.5" fill="var(--text-main)" fontFamily="var(--mono)">
            Q block {finished ? '—' : curRow} · K block {finished ? '—' : curCol} · V block {finished ? '—' : curCol}
          </text>
          <text x={SRAM_X + 12} y={GRID_Y + 58} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            compute exp(scores − m) on-chip, rescale old sum,
          </text>
          <text x={SRAM_X + 12} y={GRID_Y + 74} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            add tile's contribution, discard the tile
          </text>

          {/* per-row-block running state */}
          <text x={SRAM_X} y={GRID_Y + 118} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            ROW BLOCKS — running (m, ℓ) coverage
          </text>
          {Array.from({ length: T }).map((_, r) => {
            const barW = W - SRAM_X - 26 - 70;
            const y = GRID_Y + 128 + r * (T <= 4 ? 22 : 12);
            const frac = rowProgress[r] / T;
            return (
              <g key={r}>
                <text x={SRAM_X} y={y + 9} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">blk {r}</text>
                <rect x={SRAM_X + 38} y={y} width={barW} height={T <= 4 ? 12 : 7} rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.7" />
                <rect
                  x={SRAM_X + 38} y={y}
                  width={barW * frac}
                  height={T <= 4 ? 12 : 7} rx="3"
                  fill={frac >= 1 ? 'var(--easy, var(--accent))' : 'var(--accent)'}
                  opacity="0.75"
                  style={{ transition: reducedMotion ? 'none' : 'width 0.25s ease' }}
                />
                <text x={SRAM_X + 38 + barW + 6} y={y + 9} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
                  {rowProgress[r]}/{T}
                </text>
              </g>
            );
          })}

          <text x={W / 2} y={H - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.06em">
            {caption}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Grid3x3 size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              tile size B
            </span>
            <input
              type="range" min="0" max="2" step="1"
              value={Math.log2(tileB) - 1}
              onChange={(e) => { setTileB(2 ** (parseInt(e.target.value, 10) + 1)); setTileIdx(0); }}
            />
            <span className="mlviz-slider-val">{tileB}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <MemoryStick size={11} style={{ color: 'var(--text-dim)', alignSelf: 'center' }} />
            <span className="mlviz-sub">score cells in HBM</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{hbmScoreCells}</span>
            <span className="mlviz-sub">standard ·</span>
            <span className="mlviz-val" style={{ color: 'var(--easy, var(--accent))', fontWeight: 800 }}>0</span>
            <span className="mlviz-sub">flash</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">peak on-chip</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{sramCells}</span>
            <span className="mlviz-sub">cells</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">K/V blocks loaded</span>
            <span className="mlviz-val">{kvLoads} / {totalTiles}</span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`} onClick={() => setIsRunning((r) => !r)}>
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={advance} disabled={isRunning}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            tile {Math.min(tileIdx, totalTiles)} of {totalTiles}
          </span>
        </div>

        <div className="mlviz-hint">
          bigger tiles = fewer K/V reloads but more SRAM per tile — the exact trade flash attention tunes per GPU · same math as standard attention, just IO-aware
        </div>
      </div>
    </div>
  );
}
