import React, { useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Crosshair, Target, AlertTriangle, Check } from 'lucide-react';
import './NnPerceptronViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Two presets in normalized 0..1 feature space.
const PRESETS = {
  separable: {
    label: 'Linearly separable',
    points: [
      { x: 0.18, y: 0.22, c: 0 }, { x: 0.28, y: 0.34, c: 0 },
      { x: 0.12, y: 0.40, c: 0 }, { x: 0.34, y: 0.18, c: 0 },
      { x: 0.40, y: 0.30, c: 0 }, { x: 0.22, y: 0.12, c: 0 },
      { x: 0.70, y: 0.78, c: 1 }, { x: 0.82, y: 0.66, c: 1 },
      { x: 0.64, y: 0.62, c: 1 }, { x: 0.78, y: 0.84, c: 1 },
      { x: 0.88, y: 0.72, c: 1 }, { x: 0.60, y: 0.88, c: 1 },
    ],
    init: { w1: 1.0, w2: 1.0, b: -1.0 },
  },
  xor: {
    label: 'XOR (not separable)',
    points: [
      { x: 0.18, y: 0.18, c: 0 }, { x: 0.24, y: 0.12, c: 0 }, { x: 0.12, y: 0.24, c: 0 },
      { x: 0.82, y: 0.82, c: 0 }, { x: 0.88, y: 0.76, c: 0 }, { x: 0.76, y: 0.88, c: 0 },
      { x: 0.82, y: 0.18, c: 1 }, { x: 0.88, y: 0.24, c: 1 }, { x: 0.76, y: 0.12, c: 1 },
      { x: 0.18, y: 0.82, c: 1 }, { x: 0.12, y: 0.76, c: 1 }, { x: 0.24, y: 0.88, c: 1 },
    ],
    init: { w1: 1.0, w2: 0.0, b: -0.5 },
  },
};

const VB = 320;
const PAD = 24;
const span = VB - 2 * PAD;
const toPx = (v) => PAD + v * span;
const toPy = (v) => PAD + (1 - v) * span;

export default function NnPerceptronViz() {
  const [presetKey, setPresetKey] = useState('separable');
  const preset = PRESETS[presetKey];
  const [w, setW] = useState(preset.init);
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const choosePreset = (k) => { setPresetKey(k); setW(PRESETS[k].init); };
  const reset = () => setW(preset.init);

  const score = (p) => w.w1 * p.x + w.w2 * p.y + w.b;
  const accuracy = useMemo(() => {
    const ok = preset.points.filter((p) => (score(p) >= 0 ? 1 : 0) === p.c).length;
    return ok / preset.points.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, presetKey]);

  // Decision boundary  w1*x + w2*y + b = 0  ->  endpoints clipped to [0,1].
  const line = useMemo(() => {
    const pts = [];
    if (Math.abs(w.w2) > 1e-6) {
      for (const x of [0, 1]) pts.push({ x, y: -(w.w1 * x + w.b) / w.w2 });
    }
    if (Math.abs(w.w1) > 1e-6) {
      for (const y of [0, 1]) pts.push({ x: -(w.w2 * y + w.b) / w.w1, y });
    }
    const inside = pts.filter((p) => p.x >= -0.001 && p.x <= 1.001 && p.y >= -0.001 && p.y <= 1.001);
    if (inside.length < 2) return null;
    return [inside[0], inside[inside.length - 1]];
  }, [w]);

  // Weight-vector arrow from centroid, length normalized.
  const arrow = useMemo(() => {
    const mag = Math.hypot(w.w1, w.w2) || 1;
    const cx = 0.5, cy = 0.5;
    const L = 0.26;
    return { x1: cx, y1: cy, x2: cx + (w.w1 / mag) * L, y2: cy + (w.w2 / mag) * L };
  }, [w]);

  const onPointer = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const fx = ((e.clientX - r.left) / r.width) * VB;
    const fy = ((e.clientY - r.top) / r.height) * VB;
    const ux = (fx - PAD) / span - 0.5;
    const uy = (1 - (fy - PAD) / span) - 0.5;
    const mag = Math.hypot(ux, uy) || 1;
    setW((p) => ({ ...p, w1: (ux / mag) * 1.6, w2: (uy / mag) * 1.6 }));
  };
  const startDrag = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); onPointer(e); };
  const endDrag = () => { dragging.current = false; };

  const accPct = Math.round(accuracy * 100);
  const accColor = accPct === 100 ? 'var(--easy)' : accPct >= 75 ? 'var(--warning)' : 'var(--hard)';

  return (
    <div className="npv">
      <div className="npv-head">
        <div className="npv-head-icon"><Crosshair size={18} /></div>
        <div className="npv-head-text">
          <h3 className="npv-title">A perceptron draws one straight line — drag the weight vector to separate the classes</h3>
          <p className="npv-sub">
            The boundary is <span dangerouslySetInnerHTML={{ __html: km('\\mathbf{w}\\cdot\\mathbf{x}+b=0') }} />; the
            arrow is <span dangerouslySetInnerHTML={{ __html: km('\\mathbf{w}') }} />, perpendicular to it and pointing
            at the positive class. Switch to XOR to see why one line can never reach 100&percnt;.
          </p>
        </div>
        <button type="button" className="npv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="npv-controls">
        {Object.entries(PRESETS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`npv-chip ${presetKey === k ? 'npv-chip-on' : ''}`}
            onClick={() => choosePreset(k)}
          >
            <Target size={12} /> {v.label}
          </button>
        ))}
      </div>

      <div className="npv-body">
        <div className="npv-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VB}`}
            className="npv-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onPointer}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <defs>
              <marker id="npv-wtip" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="npv-wtip-fill" />
              </marker>
            </defs>

            <rect x={PAD} y={PAD} width={span} height={span} rx={8} className="npv-plot" />
            {[0.25, 0.5, 0.75].map((g) => (
              <g key={g}>
                <line x1={toPx(g)} y1={PAD} x2={toPx(g)} y2={PAD + span} className="npv-grid" />
                <line x1={PAD} y1={toPy(g)} x2={PAD + span} y2={toPy(g)} className="npv-grid" />
              </g>
            ))}

            {line && (
              <line x1={toPx(line[0].x)} y1={toPy(line[0].y)} x2={toPx(line[1].x)} y2={toPy(line[1].y)}
                className="npv-boundary" />
            )}

            {preset.points.map((p, i) => {
              const pred = score(p) >= 0 ? 1 : 0;
              const correct = pred === p.c;
              return (
                <g key={i} className={`npv-pt ${correct ? '' : 'npv-pt-wrong'}`}>
                  {p.c === 1
                    ? <circle cx={toPx(p.x)} cy={toPy(p.y)} r={6} className="npv-pt-pos" />
                    : <rect x={toPx(p.x) - 5.5} y={toPy(p.y) - 5.5} width={11} height={11} rx={2} className="npv-pt-neg" />}
                  {!correct && <circle cx={toPx(p.x)} cy={toPy(p.y)} r={10} className="npv-pt-ring" />}
                </g>
              );
            })}

            <line x1={toPx(arrow.x1)} y1={toPy(arrow.y1)} x2={toPx(arrow.x2)} y2={toPy(arrow.y2)}
              className="npv-warrow" markerEnd="url(#npv-wtip)" />
            <circle cx={toPx(arrow.x1)} cy={toPy(arrow.y1)} r={9} className="npv-whandle"
              onPointerDown={startDrag} />
          </svg>
        </div>

        <div className="npv-side">
          <div className="npv-acc" style={{ borderLeftColor: accColor }}>
            <span className="npv-acc-lab">accuracy</span>
            <span className="npv-acc-val" style={{ color: accColor }}>{accPct}%</span>
            <span className="npv-acc-hint">
              {accPct === 100
                ? (<><Check size={12} /> every point on its correct side</>)
                : (<><AlertTriangle size={12} /> {preset.points.filter((p) => (score(p) >= 0 ? 1 : 0) !== p.c).length} misclassified (ringed)</>)}
            </span>
          </div>

          <div className="npv-sliders">
            <Slider label={km('w_1')} value={w.w1} min={-2} max={2}
              onChange={(v) => setW((p) => ({ ...p, w1: v }))} />
            <Slider label={km('w_2')} value={w.w2} min={-2} max={2}
              onChange={(v) => setW((p) => ({ ...p, w2: v }))} />
            <Slider label={km('b')} value={w.b} min={-2} max={2}
              onChange={(v) => setW((p) => ({ ...p, b: v }))} />
          </div>

          <div className="npv-note">
            {presetKey === 'xor'
              ? 'XOR puts each class on two opposite corners. No single straight cut separates them — accuracy caps below 100%. A hidden layer is the fix.'
              : 'These two clouds are linearly separable: rotate w until the line drops between them and accuracy hits 100%.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <label className="npv-slider">
      <span className="npv-slider-lab">
        <span dangerouslySetInnerHTML={{ __html: label }} />
        <span className="npv-slider-val">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}
