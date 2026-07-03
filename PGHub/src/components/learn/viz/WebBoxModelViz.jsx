import React, { useMemo, useState } from 'react';
import { Box, RotateCcw, Ruler } from 'lucide-react';
import './WebBoxModelViz.css';

const DEFAULTS = { cw: 180, ch: 90, pad: 24, bord: 8, mar: 20 };

const RANGES = {
  cw: { min: 60, max: 260, step: 5, label: 'content width' },
  ch: { min: 40, max: 160, step: 5, label: 'content height' },
  pad: { min: 0, max: 48, step: 2, label: 'padding' },
  bord: { min: 0, max: 24, step: 1, label: 'border' },
  mar: { min: 0, max: 48, step: 2, label: 'margin' },
};

// Fixed SVG canvas; the box is drawn centered and scaled to fit.
const W = 720;
const H = 360;

export default function WebBoxModelViz() {
  const [dims, setDims] = useState(DEFAULTS);
  const [borderBox, setBorderBox] = useState(false);

  const set = (key) => (e) => {
    const v = Number(e.target.value);
    setDims((d) => ({ ...d, [key]: v }));
  };

  const model = useMemo(() => {
    const { cw, ch, pad, bord, mar } = dims;
    // In border-box the declared width holds padding + border inside it, so
    // the content shrinks; the border-box footprint equals the declared width.
    let contentW = cw;
    let contentH = ch;
    let declaredW = cw + pad * 2 + bord * 2;
    let declaredH = ch + pad * 2 + bord * 2;
    if (borderBox) {
      declaredW = cw;
      declaredH = ch;
      contentW = Math.max(0, cw - pad * 2 - bord * 2);
      contentH = Math.max(0, ch - pad * 2 - bord * 2);
    }
    const paddingBoxW = contentW + pad * 2;
    const borderBoxW = paddingBoxW + bord * 2;
    const borderBoxH = contentH + pad * 2 + bord * 2;
    const occupiedW = borderBoxW + mar * 2;
    const occupiedH = borderBoxH + mar * 2;
    return {
      contentW, contentH, paddingBoxW, borderBoxW, borderBoxH,
      declaredW, declaredH, occupiedW, occupiedH,
    };
  }, [dims, borderBox]);

  // Scale the whole occupied box to fit the canvas with a small inset.
  const inset = 28;
  const scale = Math.min(
    (W - inset * 2) / model.occupiedW,
    (H - inset * 2) / model.occupiedH,
    1.15,
  );
  const s = (v) => v * scale;

  const { pad, bord, mar } = dims;
  const occW = s(model.occupiedW);
  const occH = s(model.occupiedH);
  const ox = (W - occW) / 2;
  const oy = (H - occH) / 2;

  // Nested rings, outermost first.
  const borderX = ox + s(mar);
  const borderY = oy + s(mar);
  const padX = borderX + s(bord);
  const padY = borderY + s(bord);
  const contX = padX + s(pad);
  const contY = padY + s(pad);

  return (
    <div className="wbm">
      <div className="wbm-head">
        <div className="wbm-head-icon"><Box size={18} /></div>
        <div className="wbm-head-text">
          <h3 className="wbm-title">The box model, live</h3>
          <p className="wbm-sub">
            Drag the sliders to grow each ring &mdash; content, padding, border, margin &mdash;
            and flip <code>box-sizing</code> to watch how the declared width is measured.
          </p>
        </div>
        <button type="button" className="wbm-reset" onClick={() => { setDims(DEFAULTS); setBorderBox(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="wbm-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wbm-svg" preserveAspectRatio="xMidYMid meet">
          {/* margin ring (transparent footprint) */}
          <rect x={ox} y={oy} width={occW} height={occH} className="wbm-margin" rx={4} />
          {/* border ring */}
          <rect x={borderX} y={borderY} width={s(model.borderBoxW)} height={s(model.borderBoxH)} className="wbm-border" rx={3} />
          {/* padding ring */}
          <rect x={padX} y={padY} width={s(model.paddingBoxW)} height={s(model.contentH + pad * 2)} className="wbm-padding" rx={2} />
          {/* content */}
          <rect x={contX} y={contY} width={s(model.contentW)} height={s(model.contentH)} className="wbm-content" rx={2} />
          <text x={contX + s(model.contentW) / 2} y={contY + s(model.contentH) / 2 + 4} className="wbm-content-label" textAnchor="middle">
            content
          </text>

          {/* corner ring labels */}
          <text x={ox + 4} y={oy + 13} className="wbm-ring-tag is-margin">margin</text>
          <text x={borderX + 4} y={borderY + 12} className="wbm-ring-tag is-border">border</text>
          <text x={padX + 4} y={padY + 11} className="wbm-ring-tag is-padding">padding</text>
        </svg>
      </div>

      <div className="wbm-controls">
        <div className="wbm-sizing">
          <span className="wbm-sizing-label"><Ruler size={13} /> box-sizing</span>
          <div className="wbm-toggle">
            <button
              type="button"
              className={`wbm-toggle-btn${!borderBox ? ' is-on' : ''}`}
              onClick={() => setBorderBox(false)}
            >
              content-box
            </button>
            <button
              type="button"
              className={`wbm-toggle-btn${borderBox ? ' is-on' : ''}`}
              onClick={() => setBorderBox(true)}
            >
              border-box
            </button>
          </div>
        </div>

        <div className="wbm-sliders">
          {Object.keys(RANGES).map((key) => {
            const r = RANGES[key];
            return (
              <label key={key} className={`wbm-slider is-${key}`}>
                <span className="wbm-slider-top">
                  <span className="wbm-slider-name">{r.label}</span>
                  <span className="wbm-slider-val">{dims[key]}px</span>
                </span>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={dims[key]}
                  onChange={set(key)}
                  className="wbm-range"
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="wbm-readout">
        <div className="wbm-stat is-content">
          <span className="wbm-stat-label">content</span>
          <span className="wbm-stat-val">{Math.round(model.contentW)} &times; {Math.round(model.contentH)}</span>
        </div>
        <div className="wbm-stat is-padding">
          <span className="wbm-stat-label">+ padding</span>
          <span className="wbm-stat-val">{pad * 2}px</span>
        </div>
        <div className="wbm-stat is-border">
          <span className="wbm-stat-label">+ border</span>
          <span className="wbm-stat-val">{bord * 2}px</span>
        </div>
        <div className="wbm-stat is-declared">
          <span className="wbm-stat-label">width sets</span>
          <span className="wbm-stat-val">{borderBox ? 'border edge' : 'content'}</span>
        </div>
        <div className="wbm-stat is-total">
          <span className="wbm-stat-label">occupied</span>
          <span className="wbm-stat-val">{Math.round(model.occupiedW)} &times; {Math.round(model.occupiedH)}</span>
        </div>
      </div>

      <div className="wbm-note">
        <span className="wbm-note-label">now</span>
        <span className="wbm-note-body">
          {borderBox
            ? `border-box: width ${dims.cw}px measures to the border edge, so ${pad * 2 + bord * 2}px of padding + border fit INSIDE it — content shrinks to ${Math.round(model.contentW)}px.`
            : `content-box: width ${dims.cw}px measures only the content, so padding + border ADD ${pad * 2 + bord * 2}px on top — the border box renders ${Math.round(model.borderBoxW)}px wide.`}
        </span>
      </div>
    </div>
  );
}
