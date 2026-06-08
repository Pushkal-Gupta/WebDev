import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Layers } from 'lucide-react';
import './MLViz.css';

const INPUT_N = 32;
const NUM_LAYERS = 4;

const DEFAULT_LAYERS = [
  { k: 3, s: 1, d: 1 },
  { k: 3, s: 1, d: 1 },
  { k: 3, s: 1, d: 1 },
  { k: 3, s: 1, d: 1 },
];

const PRESETS = {
  Vanilla:   [{ k: 3, s: 1, d: 1 }, { k: 3, s: 1, d: 1 }, { k: 3, s: 1, d: 1 }, { k: 3, s: 1, d: 1 }],
  Strided:   [{ k: 3, s: 2, d: 1 }, { k: 3, s: 2, d: 1 }, { k: 3, s: 1, d: 1 }, { k: 3, s: 1, d: 1 }],
  Dilated:   [{ k: 3, s: 1, d: 1 }, { k: 3, s: 1, d: 2 }, { k: 3, s: 1, d: 4 }, { k: 3, s: 1, d: 8 }],
  VGGStack:  [{ k: 3, s: 1, d: 1 }, { k: 3, s: 1, d: 1 }, { k: 3, s: 2, d: 1 }, { k: 3, s: 1, d: 1 }],
};

// Effective kernel = (k - 1) * d + 1
// jump_l = jump_{l-1} * stride_l
// rf_l   = rf_{l-1} + (eff_k_l - 1) * jump_{l-1}
// out_size_l = floor((in_l - eff_k_l) / stride_l) + 1
function computeStack(layers, inputN) {
  let jump = 1;
  let rf = 1;
  let size = inputN;
  const out = [];
  out.push({ rf: 1, jump: 1, size, effK: 1, k: 1, s: 1, d: 1 });
  for (let i = 0; i < layers.length; i++) {
    const { k, s, d } = layers[i];
    const effK = (k - 1) * d + 1;
    rf = rf + (effK - 1) * jump;
    const newSize = Math.floor((size - effK) / s) + 1;
    const newJump = jump * s;
    out.push({ rf, jump: newJump, size: Math.max(1, newSize), effK, k, s, d });
    jump = newJump;
    size = Math.max(1, newSize);
  }
  return out;
}

// Map a feature pixel at layer L (row,col) back to input pixel range
// At layer L: feature pixel (r,c) corresponds to input region:
//   start_in = r * stride_total_to_L + offsets...
// Use recursive: rangeAtLayer(L, r, c) -> {rIn0, rIn1, cIn0, cIn1}
function receptiveFieldRange(layers, layerIdx, r, c) {
  let r0 = r, r1 = r, c0 = c, c1 = c;
  for (let i = layerIdx; i >= 1; i--) {
    const { k, s, d } = layers[i - 1];
    const effK = (k - 1) * d + 1;
    r0 = r0 * s;
    r1 = r1 * s + (effK - 1);
    c0 = c0 * s;
    c1 = c1 * s + (effK - 1);
  }
  return { r0, r1, c0, c1 };
}

// Layout constants
const STAGE_W = 760;
const STAGE_H = 520;
const PAD_X = 24;
const PAD_TOP = 32;
const LAYER_GAP_Y = 96;

// Input grid takes left side; layers stacked vertically on right? Actually,
// stack vertically: input at top, layers below progressively smaller.
// We'll show INPUT layer as 32x32 on the LEFT, and feature maps stacked on the RIGHT.

const INPUT_AREA_W = 280;
const FEATURE_AREA_X = PAD_X + INPUT_AREA_W + 40;
const FEATURE_AREA_W = STAGE_W - FEATURE_AREA_X - PAD_X;

function inputCellSize() {
  return INPUT_AREA_W / INPUT_N;
}

export default function ReceptiveFieldViz() {
  const [layers, setLayers] = useState(() => DEFAULT_LAYERS.map((l) => ({ ...l })));
  const [selected, setSelected] = useState({ layer: 4, r: 0, c: 0 });

  const stack = useMemo(() => computeStack(layers, INPUT_N), [layers]);

  const updateLayer = useCallback((idx, field, val) => {
    setLayers((prev) => {
      const next = prev.map((l) => ({ ...l }));
      const n = Math.max(1, Math.round(Number(val) || 1));
      next[idx][field] = n;
      return next;
    });
  }, []);

  const applyPreset = useCallback((name) => {
    setLayers(PRESETS[name].map((l) => ({ ...l })));
    setSelected({ layer: 4, r: 0, c: 0 });
  }, []);

  const handleReset = useCallback(() => {
    setLayers(DEFAULT_LAYERS.map((l) => ({ ...l })));
    setSelected({ layer: 4, r: 0, c: 0 });
  }, []);

  // Clamp selection if layer sizes shrink
  const clampedSelected = useMemo(() => {
    const layerInfo = stack[selected.layer];
    if (!layerInfo) return { layer: 0, r: 0, c: 0 };
    const sz = layerInfo.size;
    return {
      layer: selected.layer,
      r: Math.min(selected.r, sz - 1),
      c: Math.min(selected.c, sz - 1),
    };
  }, [selected, stack]);

  // Compute receptive field on the INPUT
  const rfRange = useMemo(() => {
    if (clampedSelected.layer === 0) {
      return { r0: clampedSelected.r, r1: clampedSelected.r, c0: clampedSelected.c, c1: clampedSelected.c };
    }
    return receptiveFieldRange(layers, clampedSelected.layer, clampedSelected.r, clampedSelected.c);
  }, [clampedSelected, layers]);

  const selectedRF = stack[clampedSelected.layer]?.rf || 1;
  const equivalentScale = selectedRF / INPUT_N;

  // Layout: INPUT 32x32 on left side
  const inputCell = inputCellSize();
  const inputX0 = PAD_X;
  const inputY0 = PAD_TOP;
  const inputSizePx = inputCell * INPUT_N;

  // Feature maps stacked vertically on right
  // Each feature map drawn with its own cell size to keep width <= FEATURE_AREA_W
  const featureMapMaxCell = 9; // px max per cell on feature maps
  const featureMaps = stack.slice(1); // layers 1..4

  const featureLayout = useMemo(() => {
    const totalH = inputSizePx;
    const perH = totalH / featureMaps.length;
    return featureMaps.map((fm, i) => {
      const sz = fm.size;
      const cell = Math.max(2, Math.min(featureMapMaxCell, Math.floor((FEATURE_AREA_W - 20) / sz), Math.floor((perH - 22) / sz)));
      const mapPx = cell * sz;
      const yTop = inputY0 + i * perH + 16;
      const xLeft = FEATURE_AREA_X + (FEATURE_AREA_W - mapPx) / 2;
      return { cell, mapPx, yTop, xLeft, sz, layerIdx: i + 1, ...fm };
    });
  }, [featureMaps, inputSizePx]);

  const stageH = Math.max(STAGE_H, inputY0 + inputSizePx + 40);

  return (
    <div className="mlviz-wrap rfv-wrap">
      <div className="mlviz-stage rfv-stage">
        <svg
          viewBox={`0 0 ${STAGE_W} ${stageH}`}
          className="mlviz-svg rfv-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Input label */}
          <text
            x={inputX0}
            y={inputY0 - 10}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.16em"
          >
            INPUT 32x32
          </text>

          {/* Input grid background */}
          <rect
            x={inputX0 - 1}
            y={inputY0 - 1}
            width={inputSizePx + 2}
            height={inputSizePx + 2}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="0.8"
            rx={3}
          />

          {/* Input grid lines (subtle) */}
          {Array.from({ length: INPUT_N + 1 }).map((_, i) => (
            <g key={`grid-${i}`} opacity="0.18">
              <line
                x1={inputX0 + i * inputCell}
                y1={inputY0}
                x2={inputX0 + i * inputCell}
                y2={inputY0 + inputSizePx}
                stroke="var(--border)"
                strokeWidth="0.4"
              />
              <line
                x1={inputX0}
                y1={inputY0 + i * inputCell}
                x2={inputX0 + inputSizePx}
                y2={inputY0 + i * inputCell}
                stroke="var(--border)"
                strokeWidth="0.4"
              />
            </g>
          ))}

          {/* Clickable cells on INPUT (layer 0) */}
          {Array.from({ length: INPUT_N }).map((_, r) =>
            Array.from({ length: INPUT_N }).map((__, c) => {
              const isSelected = clampedSelected.layer === 0 && clampedSelected.r === r && clampedSelected.c === c;
              return (
                <rect
                  key={`input-${r}-${c}`}
                  x={inputX0 + c * inputCell}
                  y={inputY0 + r * inputCell}
                  width={inputCell}
                  height={inputCell}
                  fill={isSelected ? 'rgba(var(--accent-rgb, 0,255,245), 0.45)' : 'transparent'}
                  stroke={isSelected ? 'var(--accent)' : 'none'}
                  strokeWidth={isSelected ? 1 : 0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected({ layer: 0, r, c })}
                />
              );
            })
          )}

          {/* Receptive field highlight on input */}
          {clampedSelected.layer > 0 && (() => {
            const x = inputX0 + rfRange.c0 * inputCell;
            const y = inputY0 + rfRange.r0 * inputCell;
            const w = (rfRange.c1 - rfRange.c0 + 1) * inputCell;
            const h = (rfRange.r1 - rfRange.r0 + 1) * inputCell;
            return (
              <g>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="rgba(var(--accent-rgb, 0,255,245), 0.18)"
                  stroke="var(--accent)"
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                  rx={2}
                  style={{ transition: 'all 0.18s ease' }}
                />
                <text
                  x={x + w / 2}
                  y={y - 4}
                  fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--accent)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  RF {rfRange.r1 - rfRange.r0 + 1}x{rfRange.c1 - rfRange.c0 + 1}
                </text>
              </g>
            );
          })()}

          {/* Feature maps on right */}
          {featureLayout.map((fl) => {
            const { cell, mapPx, yTop, xLeft, sz, layerIdx, k, s, d, effK, rf, jump } = fl;
            const isLayerSelected = clampedSelected.layer === layerIdx;
            return (
              <g key={`fl-${layerIdx}`}>
                <text
                  x={xLeft}
                  y={yTop - 6}
                  fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                  letterSpacing="0.14em"
                >
                  L{layerIdx} {sz}x{sz} · k={k} s={s} d={d} · RF={rf}
                </text>
                <rect
                  x={xLeft - 1}
                  y={yTop - 1}
                  width={mapPx + 2}
                  height={mapPx + 2}
                  fill="var(--bg)"
                  stroke={isLayerSelected ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isLayerSelected ? 1.2 : 0.8}
                  rx={3}
                />
                {/* feature grid */}
                {Array.from({ length: sz + 1 }).map((_, i) => (
                  <g key={`fgrid-${layerIdx}-${i}`} opacity="0.22">
                    <line
                      x1={xLeft + i * cell}
                      y1={yTop}
                      x2={xLeft + i * cell}
                      y2={yTop + mapPx}
                      stroke="var(--border)"
                      strokeWidth="0.35"
                    />
                    <line
                      x1={xLeft}
                      y1={yTop + i * cell}
                      x2={xLeft + mapPx}
                      y2={yTop + i * cell}
                      stroke="var(--border)"
                      strokeWidth="0.35"
                    />
                  </g>
                ))}
                {/* clickable feature cells */}
                {Array.from({ length: sz }).map((_, r) =>
                  Array.from({ length: sz }).map((__, c) => {
                    const isSel = isLayerSelected && clampedSelected.r === r && clampedSelected.c === c;
                    return (
                      <rect
                        key={`fc-${layerIdx}-${r}-${c}`}
                        x={xLeft + c * cell}
                        y={yTop + r * cell}
                        width={cell}
                        height={cell}
                        fill={isSel ? 'rgba(var(--accent-rgb, 0,255,245), 0.6)' : 'rgba(var(--accent-rgb, 0,255,245), 0.05)'}
                        stroke={isSel ? 'var(--accent)' : 'none'}
                        strokeWidth={isSel ? 1 : 0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelected({ layer: layerIdx, r, c })}
                      />
                    );
                  })
                )}
                {/* small RF badge on selected layer */}
                {isLayerSelected && (
                  <text
                    x={xLeft + mapPx + 6}
                    y={yTop + 10}
                    fontSize="9"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--accent)"
                    fontWeight="700"
                  >
                    sees {rf}x{rf}
                  </text>
                )}
              </g>
            );
          })}

          {/* Connector from selected feature pixel back to input RF */}
          {clampedSelected.layer > 0 && (() => {
            const fl = featureLayout[clampedSelected.layer - 1];
            if (!fl) return null;
            const cx = fl.xLeft + clampedSelected.c * fl.cell + fl.cell / 2;
            const cy = fl.yTop + clampedSelected.r * fl.cell + fl.cell / 2;
            const ix = inputX0 + (rfRange.c0 + rfRange.c1 + 1) / 2 * inputCell;
            const iy = inputY0 + (rfRange.r0 + rfRange.r1 + 1) / 2 * inputCell;
            return (
              <g opacity="0.55">
                <line
                  x1={cx}
                  y1={cy}
                  x2={ix}
                  y2={iy}
                  stroke="var(--accent)"
                  strokeWidth="0.8"
                  strokeDasharray="3 2.5"
                />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Controls per layer */}
      <div className="rfv-controls">
        <div className="rfv-controls-head">
          <span className="rfv-section-tag">
            <Layers size={12} /> Layer parameters
          </span>
          <div className="rfv-presets">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                className="mt-preset-btn"
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              className="mlviz-btn"
              onClick={handleReset}
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="rfv-layer-grid">
          {layers.map((layer, idx) => {
            const layerInfo = stack[idx + 1];
            return (
              <div className="rfv-layer-card" key={`layer-${idx}`}>
                <div className="rfv-layer-head">
                  <span className="rfv-layer-name">L{idx + 1}</span>
                  <span className="rfv-layer-stat">
                    out {layerInfo.size}x{layerInfo.size} · RF {layerInfo.rf}
                  </span>
                </div>
                <div className="rfv-slider-row">
                  <label className="rfv-slider-label">kernel</label>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    step={2}
                    value={layer.k}
                    onChange={(e) => updateLayer(idx, 'k', e.target.value)}
                    className="rfv-slider"
                  />
                  <span className="rfv-slider-val">{layer.k}</span>
                </div>
                <div className="rfv-slider-row">
                  <label className="rfv-slider-label">stride</label>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={1}
                    value={layer.s}
                    onChange={(e) => updateLayer(idx, 's', e.target.value)}
                    className="rfv-slider"
                  />
                  <span className="rfv-slider-val">{layer.s}</span>
                </div>
                <div className="rfv-slider-row">
                  <label className="rfv-slider-label">dilation</label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={1}
                    value={layer.d}
                    onChange={(e) => updateLayer(idx, 'd', e.target.value)}
                    className="rfv-slider"
                  />
                  <span className="rfv-slider-val">{layer.d}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Readout */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>RF</span>
          <span className="mlviz-val">{selectedRF}x{selectedRF}</span>
          <span className="mlviz-sub">selected: L{clampedSelected.layer} ({clampedSelected.r}, {clampedSelected.c})</span>
          <span className="mlviz-sub">feature scale {(equivalentScale * 100).toFixed(1)}% of input</span>
          <span className="mlviz-sub">jump {stack[clampedSelected.layer]?.jump}</span>
        </div>

        <div className="rfv-formula">
          <span className="rfv-formula-label">recurrence</span>
          <code>
            RF<sub>L</sub> = RF<sub>L-1</sub> + ((k - 1) · d) · jump<sub>L-1</sub>
            &nbsp;·&nbsp;
            jump<sub>L</sub> = jump<sub>L-1</sub> · stride
          </code>
        </div>

        <div className="rfv-formula-chain">
          {stack.map((s, i) => (
            <React.Fragment key={`chain-${i}`}>
              <span className={`rfv-rf-chip ${i === clampedSelected.layer ? 'rfv-rf-chip-sel' : ''}`}>
                L{i}: {s.rf}
              </span>
              {i < stack.length - 1 && <span className="rfv-arrow">&rarr;</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="mlviz-hint">
          click any pixel on any layer to see what input region it covers; drag sliders to retune
        </div>
      </div>
    </div>
  );
}
