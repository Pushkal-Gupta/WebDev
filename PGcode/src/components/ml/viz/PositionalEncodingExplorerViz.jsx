import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Waves, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 360;
const LEFT = 40;
const RIGHT = 16;
const TOP = 22;
const BOT = 70; // room for the encoding-vector strip
const GRID_W = W - LEFT - RIGHT;
const HEAT_H = H - TOP - BOT;

const DEFAULT_LEN = 32;
const DEFAULT_DIM = 16;
const DEFAULT_POS = 8;
const MIN_LEN = 8;
const MAX_LEN = 48;
const MIN_DIM = 8;
const MAX_DIM = 24;

// PE(pos, 2i)=sin(pos/10000^(2i/d)), PE(pos,2i+1)=cos(...). Returns vector length d.
function peVector(pos, d) {
  const v = new Array(d);
  for (let i = 0; i < d; i++) {
    const pair = Math.floor(i / 2);
    const denom = Math.pow(10000, (2 * pair) / d);
    const angle = pos / denom;
    v[i] = i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  }
  return v;
}

// wavelength of pair holding dimension `dim` (round trip = 2*pi*10000^(2i/d))
function wavelengthAt(dim, d) {
  const pair = Math.floor(dim / 2);
  return 2 * Math.PI * Math.pow(10000, (2 * pair) / d);
}

function fmt(v, p = 2) {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
  return v.toFixed(p);
}

// map value in [-1,1] to a fill: negative → pink, positive → sky, via opacity.
function cellFill(val) {
  return val >= 0 ? 'var(--hue-sky)' : 'var(--hue-pink)';
}

export default function PositionalEncodingExplorerViz() {
  const [len, setLen] = useState(DEFAULT_LEN);
  const [dim, setDim] = useState(DEFAULT_DIM);
  const [pos, setPos] = useState(DEFAULT_POS);
  const [selDim, setSelDim] = useState(2);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const clampedPos = Math.min(pos, len - 1);

  const cellW = GRID_W / len;
  const cellH = HEAT_H / dim;

  // full heatmap matrix [pos][dim]
  const heat = useMemo(() => {
    const m = [];
    for (let p = 0; p < len; p++) m.push(peVector(p, dim));
    return m;
  }, [len, dim]);

  const selVector = useMemo(() => peVector(clampedPos, dim), [clampedPos, dim]);
  const wavelength = wavelengthAt(selDim, dim);
  const selValue = selVector[selDim];

  const markerX = LEFT + (clampedPos + 0.5) * cellW;

  const updatePos = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const rx = ((clientX - rect.left) / rect.width) * W;
      const ry = ((clientY - rect.top) / rect.height) * H;
      if (dragRef.current === 'pos') {
        let p = Math.floor((rx - LEFT) / cellW);
        p = Math.max(0, Math.min(len - 1, p));
        setPos(p);
      } else if (dragRef.current === 'dim') {
        let dpos = Math.floor((ry - TOP) / cellH);
        dpos = Math.max(0, Math.min(dim - 1, dpos));
        setSelDim(dpos);
      }
    },
    [cellW, cellH, len, dim]
  );

  const onPointerDown = useCallback(
    (which) => (e) => {
      dragRef.current = which;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updatePos(e.clientX, e.clientY);
    },
    [updatePos]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updatePos(e.clientX, e.clientY);
    },
    [updatePos]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const onHeatDown = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const ry = ((e.clientY - rect.top) / rect.height) * H;
      // dragging anywhere on the heat body moves position; clicking a row selects dim
      dragRef.current = 'pos';
      e.currentTarget.setPointerCapture?.(e.pointerId);
      let dpos = Math.floor((ry - TOP) / cellH);
      dpos = Math.max(0, Math.min(dim - 1, dpos));
      setSelDim(dpos);
      updatePos(e.clientX, e.clientY);
    },
    [updatePos, cellH, dim]
  );

  const reset = useCallback(() => {
    setLen(DEFAULT_LEN);
    setDim(DEFAULT_DIM);
    setPos(DEFAULT_POS);
    setSelDim(2);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'x 0.08s linear';

  // encoding-vector strip beneath the heatmap (selected position)
  const stripY = TOP + HEAT_H + 16;
  const stripH = 26;
  const stripCellW = GRID_W / dim;

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Waves size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Positional-encoding explorer</span>
          <span className="aev-head-sub">
            drag across positions — fast low dims flip per token, slow high dims drift
          </span>
        </span>
        <span className="aev-chip">pos = {clampedPos}</span>
      </div>

      <div className="aev-body pex-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg pex-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <filter id="pex-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.6" />
              </filter>
            </defs>

            {/* heatmap cells — clickable body */}
            <g onPointerDown={onHeatDown} style={{ cursor: 'crosshair' }}>
              <rect
                x={LEFT}
                y={TOP}
                width={GRID_W}
                height={HEAT_H}
                fill="var(--bg)"
              />
              {heat.map((vec, p) =>
                vec.map((val, d) => (
                  <rect
                    key={`c-${p}-${d}`}
                    x={LEFT + p * cellW}
                    y={TOP + d * cellH}
                    width={cellW + 0.4}
                    height={cellH + 0.4}
                    fill={cellFill(val)}
                    opacity={0.12 + Math.abs(val) * 0.72}
                  />
                ))
              )}
            </g>

            {/* selected-dim row highlight */}
            <rect
              x={LEFT}
              y={TOP + selDim * cellH}
              width={GRID_W}
              height={cellH}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.4"
              opacity="0.9"
            />

            {/* position marker column */}
            <line
              x1={markerX}
              y1={TOP}
              x2={markerX}
              y2={TOP + HEAT_H}
              stroke="var(--accent)"
              strokeWidth="2"
              filter="url(#pex-glow)"
              opacity="0.6"
              style={{ transition: trans }}
            />
            <line
              x1={markerX}
              y1={TOP}
              x2={markerX}
              y2={TOP + HEAT_H}
              stroke="var(--accent)"
              strokeWidth="1.1"
              style={{ transition: trans }}
            />

            {/* draggable position handle (top) */}
            <g
              onPointerDown={onPointerDown('pos')}
              style={{ cursor: 'ew-resize' }}
            >
              <rect
                x={markerX - 7}
                y={TOP - 12}
                width="14"
                height="9"
                rx="2"
                fill="var(--accent)"
                style={{ transition: trans }}
              />
            </g>

            {/* axis labels */}
            <text
              x={LEFT}
              y={TOP - 4}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              position →
            </text>
            <text
              x={LEFT - 6}
              y={TOP + 6}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              d0
            </text>
            <text
              x={LEFT - 6}
              y={TOP + HEAT_H}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              d{dim - 1}
            </text>

            {/* encoding-vector strip for selected position */}
            <text
              x={LEFT}
              y={stripY - 4}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              PE(pos={clampedPos}) vector
            </text>
            {selVector.map((val, d) => {
              const h = (Math.abs(val) / 1) * (stripH / 2);
              const mid = stripY + stripH / 2;
              return (
                <rect
                  key={`v-${d}`}
                  x={LEFT + d * stripCellW + 0.6}
                  y={val >= 0 ? mid - h : mid}
                  width={Math.max(1, stripCellW - 1.2)}
                  height={Math.max(0.5, h)}
                  fill={d === selDim ? 'var(--accent)' : cellFill(val)}
                  opacity={d === selDim ? 1 : 0.7}
                />
              );
            })}
            <line
              x1={LEFT}
              y1={stripY + stripH / 2}
              x2={LEFT + GRID_W}
              y2={stripY + stripH / 2}
              stroke="var(--border)"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div className="mlviz-statcol pex-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">position</span>
            <span className="mlviz-statcard-val">{clampedPos}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">selected dim</span>
            <span className="mlviz-statcard-val">d{selDim}</span>
            <span className="mlviz-statcard-sub">value {fmt(selValue)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">wavelength @ dim</span>
            <span className="mlviz-statcard-val">{fmt(wavelength, 1)}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">seq len</span>
          <input
            type="range"
            min={MIN_LEN}
            max={MAX_LEN}
            step="1"
            value={len}
            onChange={(e) => setLen(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{len}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">dim d</span>
          <input
            type="range"
            min={MIN_DIM}
            max={MAX_DIM}
            step="2"
            value={dim}
            onChange={(e) => {
              const nd = parseInt(e.target.value, 10);
              setDim(nd);
              setSelDim((s) => Math.min(s, nd - 1));
            }}
          />
          <span className="mlviz-slider-val">{dim}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          sky = positive · pink = negative · click a row to inspect that dimension's frequency
        </div>
      </div>
    </div>
  );
}
