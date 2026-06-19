import React, { useMemo, useState } from 'react';
import { Ruler, Sigma, Crosshair } from 'lucide-react';
import './MLViz.css';

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function encoding(pos, dim, dModel) {
  const i = Math.floor(dim / 2);
  const denom = Math.pow(10000, (2 * i) / dModel);
  const arg = pos / denom;
  return dim % 2 === 0 ? Math.sin(arg) : Math.cos(arg);
}

function fullVector(pos, dModel) {
  const v = new Array(dModel);
  for (let d = 0; d < dModel; d++) v[d] = encoding(pos, d, dModel);
  return v;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export default function PositionalEncodingViz() {
  const [maxPos, setMaxPos] = useState(32);
  const [dModel, setDModel] = useState(64);
  const [hover, setHover] = useState(null);
  const [pinA, setPinA] = useState(0);
  const [pinB, setPinB] = useState(8);

  const { grid, vecA, sim } = useMemo(() => {
    const g = [];
    for (let p = 0; p < maxPos; p++) {
      const row = new Array(dModel);
      for (let d = 0; d < dModel; d++) row[d] = encoding(p, d, dModel);
      g.push(row);
    }
    const a = fullVector(Math.min(pinA, maxPos - 1), dModel);
    const b = fullVector(Math.min(pinB, maxPos - 1), dModel);
    return { grid: g, vecA: a, sim: dot(a, b) / dModel };
  }, [maxPos, dModel, pinA, pinB]);

  const W = 720;
  const H = 380;
  const gridLeft = 64;
  const gridRight = W - 18;
  const gridTop = 36;
  const gridBottom = 240;
  const gridW = gridRight - gridLeft;
  const gridH = gridBottom - gridTop;
  const cellW = gridW / dModel;
  const cellH = gridH / maxPos;

  const hoverPos = hover ? hover.p : null;
  const hoverDim = hover ? hover.d : null;
  const focusedPos = hoverPos != null ? hoverPos : pinA;
  const focusedVec = hoverPos != null ? fullVector(hoverPos, dModel) : vecA;

  const barTop = gridBottom + 32;
  const barH = 56;
  const barLeft = gridLeft;
  const barRight = gridRight;
  const barW = barRight - barLeft;
  const barCellW = barW / dModel;
  const barMid = barTop + barH / 2;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* axis labels */}
          <text x={gridLeft} y={gridTop - 14} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            DIMENSION (d) →
          </text>
          <text
            x={gridLeft - 8}
            y={gridTop + gridH / 2}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
            textAnchor="end"
            transform={`rotate(-90, ${gridLeft - 8}, ${gridTop + gridH / 2})`}
          >
            POSITION (p) →
          </text>

          {/* tick labels */}
          <text x={gridLeft} y={gridBottom + 12} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            0
          </text>
          <text x={gridRight} y={gridBottom + 12} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            {dModel - 1}
          </text>
          <text x={gridLeft - 6} y={gridTop + 8} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            0
          </text>
          <text
            x={gridLeft - 6}
            y={gridBottom - 2}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
          >
            {maxPos - 1}
          </text>

          {/* heatmap */}
          {grid.map((row, p) =>
            row.map((v, d) => {
              const x = gridLeft + d * cellW;
              const y = gridTop + p * cellH;
              const norm = clamp01(Math.abs(v));
              const fill = v >= 0 ? 'var(--hue-sky)' : 'var(--hue-pink)';
              const isHover = hoverPos === p && hoverDim === d;
              return (
                <rect
                  key={`${p}-${d}`}
                  x={x}
                  y={y}
                  width={Math.max(0.5, cellW)}
                  height={Math.max(0.5, cellH)}
                  fill={fill}
                  fillOpacity={0.18 + 0.78 * norm}
                  stroke={isHover ? 'var(--accent)' : 'transparent'}
                  strokeWidth={isHover ? 1.2 : 0}
                  onMouseEnter={() => setHover({ p, d })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })
          )}

          {/* row highlight for pinA and pinB */}
          {[{ p: pinA, color: 'var(--hue-violet)', label: 'A' }, { p: pinB, color: 'var(--hue-mint)', label: 'B' }].map(
            ({ p, color, label }) =>
              p < maxPos && (
                <g key={label}>
                  <rect
                    x={gridLeft - 18}
                    y={gridTop + p * cellH}
                    width={14}
                    height={cellH}
                    fill={color}
                    fillOpacity="0.85"
                    rx="2"
                  />
                  <text
                    x={gridLeft - 11}
                    y={gridTop + p * cellH + cellH / 2 + 3}
                    fontSize={Math.min(8.5, cellH - 2)}
                    fill="var(--bg)"
                    fontFamily="var(--mono)"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                </g>
              )
          )}

          {hoverPos != null && (
            <line
              x1={gridLeft - 4}
              y1={gridTop + hoverPos * cellH + cellH / 2}
              x2={gridLeft}
              y2={gridTop + hoverPos * cellH + cellH / 2}
              stroke="var(--accent)"
              strokeWidth="2"
            />
          )}

          {/* bottom: focused encoding vector as a row */}
          <text
            x={barLeft}
            y={barTop - 8}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            PE(pos={focusedPos}) =
          </text>
          <text
            x={barRight}
            y={barTop - 8}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
          >
            d = 0 .. {dModel - 1}
          </text>
          <line
            x1={barLeft}
            y1={barMid}
            x2={barRight}
            y2={barMid}
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.7"
          />
          {focusedVec.map((v, d) => {
            const x = barLeft + d * barCellW;
            const h = (Math.abs(v) * (barH / 2 - 4));
            const y = v >= 0 ? barMid - h : barMid;
            const fill = v >= 0 ? 'var(--hue-sky)' : 'var(--hue-pink)';
            return (
              <rect
                key={`bar-${d}`}
                x={x}
                y={y}
                width={Math.max(0.5, barCellW - 0.4)}
                height={Math.max(0.5, h)}
                fill={fill}
                fillOpacity="0.85"
              />
            );
          })}

          {/* hover cell readout */}
          {hover && (
            <text
              x={W / 2}
              y={barTop + barH + 22}
              fontSize="10"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              fontWeight="700"
            >
              PE[{hoverPos}, {hoverDim}] = {grid[hoverPos][hoverDim].toFixed(3)} ({hoverDim % 2 === 0 ? 'sin' : 'cos'})
            </text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Ruler size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              max position
            </span>
            <input
              type="range"
              min="8"
              max="64"
              step="1"
              value={maxPos}
              onChange={(e) => setMaxPos(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{maxPos}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sigma size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              d_model
            </span>
            <input
              type="range"
              min="16"
              max="128"
              step="2"
              value={dModel}
              onChange={(e) => setDModel(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{dModel}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label" style={{ color: 'var(--hue-violet)' }}>
              <Crosshair size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              position A
            </span>
            <input
              type="range"
              min="0"
              max={maxPos - 1}
              step="1"
              value={Math.min(pinA, maxPos - 1)}
              onChange={(e) => setPinA(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{Math.min(pinA, maxPos - 1)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label" style={{ color: 'var(--hue-mint)' }}>
              <Crosshair size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              position B
            </span>
            <input
              type="range"
              min="0"
              max={maxPos - 1}
              step="1"
              value={Math.min(pinB, maxPos - 1)}
              onChange={(e) => setPinB(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{Math.min(pinB, maxPos - 1)}</span>
          </label>
        </div>
        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span className="mlviz-tag">⟨PE(A), PE(B)⟩ / d_model</span>
          <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{sim.toFixed(4)}</span>
          <span className="mlviz-sub">|A − B| = {Math.abs(pinA - pinB)}</span>
          <span className="mlviz-sub">
            near positions → high similarity · far → near zero
          </span>
        </div>
        <div className="mlviz-hint">
          hover the heatmap to inspect a cell · A and B markers show the two compared rows
        </div>
      </div>
    </div>
  );
}
