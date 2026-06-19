import React, { useMemo, useState } from 'react';
import { Scissors, TrendingUp, Activity, AlertTriangle, Maximize2 } from 'lucide-react';
import './GradientClippingViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STEPS = 40;

function buildLossCurves(threshold) {
  const rng = mulberry32(20260615);
  const noClip = [];
  const clipped = [];
  let lNo = 2.6;
  let lClip = 2.6;
  const spikeStart = 18;
  for (let i = 0; i < STEPS; i += 1) {
    const jitter = (rng() - 0.5) * 0.12;
    if (i < spikeStart) {
      lNo = Math.max(0.4, lNo - 0.07 + jitter);
    } else {
      const blow = Math.pow(1.42, i - spikeStart);
      lNo = Math.min(9.5, 0.9 + blow * 0.18 + jitter);
    }
    const clipGain = Math.min(1, threshold / 5);
    const decay = 0.06 + clipGain * 0.04;
    lClip = Math.max(0.28, lClip - decay + jitter * 0.5);
    noClip.push(lNo);
    clipped.push(lClip);
  }
  return { noClip, clipped };
}

export default function GradientClippingViz() {
  const [threshold, setThreshold] = useState(2.0);
  const [magnitude, setMagnitude] = useState(4.2);
  const [mode, setMode] = useState('norm');
  const angleDeg = 33;

  const derived = useMemo(() => {
    const theta = (angleDeg * Math.PI) / 180;
    const gx = magnitude * Math.cos(theta);
    const gy = magnitude * Math.sin(theta);
    const rawNorm = Math.hypot(gx, gy);

    let cx = gx;
    let cy = gy;
    let scale = 1;
    if (mode === 'norm') {
      if (rawNorm > threshold) {
        scale = threshold / rawNorm;
        cx = gx * scale;
        cy = gy * scale;
      }
    } else {
      cx = Math.max(-threshold, Math.min(threshold, gx));
      cy = Math.max(-threshold, Math.min(threshold, gy));
      scale = rawNorm > 0 ? Math.hypot(cx, cy) / rawNorm : 1;
    }
    const clippedNorm = Math.hypot(cx, cy);
    const active = mode === 'norm'
      ? rawNorm > threshold
      : Math.abs(gx) > threshold || Math.abs(gy) > threshold;

    const { noClip, clipped } = buildLossCurves(threshold);
    return { gx, gy, cx, cy, rawNorm, clippedNorm, scale, active, noClip, clipped };
  }, [threshold, magnitude, mode]);

  const W = 940;
  const H = 380;

  const vbX = 60;
  const vbY = 30;
  const vbW = 380;
  const vbH = 320;
  const ox = vbX + vbW / 2;
  const oy = vbY + vbH / 2;
  const unit = 30;

  const rawEndX = ox + derived.gx * unit;
  const rawEndY = oy - derived.gy * unit;
  const clipEndX = ox + derived.cx * unit;
  const clipEndY = oy - derived.cy * unit;
  const clipRadius = threshold * unit;

  const lpX = 500;
  const lpY = 60;
  const lpW = 380;
  const lpH = 250;
  const lossMax = 10;
  const stepX = (i) => lpX + (i / (STEPS - 1)) * lpW;
  const lossY = (v) => lpY + lpH - (Math.min(lossMax, v) / lossMax) * lpH;

  const noClipPts = derived.noClip.map((v, i) => `${stepX(i).toFixed(1)},${lossY(v).toFixed(1)}`).join(' ');
  const clipPts = derived.clipped.map((v, i) => `${stepX(i).toFixed(1)},${lossY(v).toFixed(1)}`).join(' ');

  return (
    <div className="gcv">
      <div className="gcv-head">
        <h3 className="gcv-title">Gradient clipping — exploding gradients tamed</h3>
        <p className="gcv-sub">
          A gradient longer than the threshold gets rescaled before the optimizer step. Clip-by-norm keeps
          direction; clip-by-value clamps each axis. Watch the loss diverge without it and settle with it.
        </p>
      </div>

      <div className="gcv-controls">
        <label className="gcv-slider">
          <span className="gcv-input-label">threshold</span>
          <input
            type="range" min={0.5} max={5} step={0.1} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="gcv-range" aria-label="Clip threshold"
          />
          <span className="gcv-slider-val">{threshold.toFixed(1)}</span>
        </label>
        <label className="gcv-slider">
          <span className="gcv-input-label">raw magnitude</span>
          <input
            type="range" min={0.5} max={8} step={0.1} value={magnitude}
            onChange={(e) => setMagnitude(Number(e.target.value))}
            className="gcv-range" aria-label="Raw gradient magnitude"
          />
          <span className="gcv-slider-val">{magnitude.toFixed(1)}</span>
        </label>

        <span className="gcv-spacer" aria-hidden="true" />

        <div className="gcv-modes">
          <button
            type="button"
            className={`gcv-btn ${mode === 'norm' ? 'is-active' : ''}`}
            onClick={() => setMode('norm')}
          >
            <Maximize2 size={14} /> clip-by-norm
          </button>
          <button
            type="button"
            className={`gcv-btn ${mode === 'value' ? 'is-active' : ''}`}
            onClick={() => setMode('value')}
          >
            <Scissors size={14} /> clip-by-value
          </button>
        </div>
      </div>

      <div className="gcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gcv-arrow-raw" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path className="gcv-arrowhead-raw" d="M0,0 L7,3 L0,6 Z" />
            </marker>
            <marker id="gcv-arrow-clip" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path className="gcv-arrowhead-clip" d="M0,0 L7,3 L0,6 Z" />
            </marker>
          </defs>

          <text className="gcv-row-label" x={vbX} y={20}>gradient vector · clip region</text>

          {/* axes */}
          <line className="gcv-axis" x1={vbX} y1={oy} x2={vbX + vbW} y2={oy} />
          <line className="gcv-axis" x1={ox} y1={vbY} x2={ox} y2={vbY + vbH} />

          {/* clip region */}
          {mode === 'norm' ? (
            <circle className="gcv-region" cx={ox} cy={oy} r={Math.min(clipRadius, vbW / 2)} />
          ) : (
            <rect
              className="gcv-region"
              x={ox - Math.min(clipRadius, vbW / 2)}
              y={oy - Math.min(clipRadius, vbH / 2)}
              width={Math.min(clipRadius, vbW / 2) * 2}
              height={Math.min(clipRadius, vbH / 2) * 2}
            />
          )}

          {/* raw vector */}
          <line
            className="gcv-vec-raw"
            x1={ox} y1={oy} x2={rawEndX} y2={rawEndY}
            markerEnd="url(#gcv-arrow-raw)"
          />
          <text className="gcv-vec-label gcv-raw-txt" x={rawEndX + 6} y={rawEndY - 4}>
            raw ‖g‖={derived.rawNorm.toFixed(2)}
          </text>

          {/* clipped vector */}
          {derived.active && (
            <line
              className="gcv-vec-clip"
              x1={ox} y1={oy} x2={clipEndX} y2={clipEndY}
              markerEnd="url(#gcv-arrow-clip)"
            />
          )}
          <text className="gcv-vec-label gcv-clip-txt" x={clipEndX + 6} y={clipEndY + 16}>
            clipped ‖g‖={derived.clippedNorm.toFixed(2)}
          </text>

          <circle className="gcv-origin" cx={ox} cy={oy} r={3.5} />

          {/* loss panel */}
          <text className="gcv-row-label" x={lpX} y={44}>training loss · 40 steps</text>
          <rect className="gcv-loss-frame" x={lpX} y={lpY} width={lpW} height={lpH} rx={6} />
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={`grid-${f}`}
              className="gcv-loss-grid"
              x1={lpX} y1={lpY + lpH * f} x2={lpX + lpW} y2={lpY + lpH * f}
            />
          ))}
          <polyline className="gcv-loss-noclip" points={noClipPts} />
          <polyline className="gcv-loss-clip" points={clipPts} />

          <text className="gcv-loss-axis" x={lpX - 6} y={lpY + 10} textAnchor="end">{lossMax}</text>
          <text className="gcv-loss-axis" x={lpX - 6} y={lpY + lpH} textAnchor="end">0</text>
          <text className="gcv-loss-axis" x={lpX} y={lpY + lpH + 16}>step 0</text>
          <text className="gcv-loss-axis" x={lpX + lpW} y={lpY + lpH + 16} textAnchor="end">step 40</text>

          <g transform={`translate(${lpX + 12}, ${lpY + 18})`}>
            <line className="gcv-leg-noclip" x1={0} y1={0} x2={20} y2={0} />
            <text className="gcv-leg-txt gcv-raw-txt" x={26} y={4}>no clipping</text>
            <line className="gcv-leg-clip" x1={0} y1={18} x2={20} y2={18} />
            <text className="gcv-leg-txt gcv-clip-txt" x={26} y={22}>with clipping</text>
          </g>
        </svg>
      </div>

      <div className="gcv-metrics">
        <div className="gcv-metric">
          <span className="gcv-metric-label">mode</span>
          <span className="gcv-metric-value">{mode === 'norm' ? 'by-norm' : 'by-value'}</span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">raw norm</span>
          <span className="gcv-metric-value is-bad">{derived.rawNorm.toFixed(2)}</span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">clipped norm</span>
          <span className="gcv-metric-value is-good">{derived.clippedNorm.toFixed(2)}</span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">scale factor</span>
          <span className="gcv-metric-value is-hi">{derived.scale.toFixed(3)}</span>
        </div>
        <div className="gcv-metric">
          <span className="gcv-metric-label">clipping</span>
          <span className={`gcv-metric-value ${derived.active ? 'is-bad' : 'is-good'}`}>
            {derived.active ? 'ACTIVE' : 'inactive'}
          </span>
        </div>
      </div>

      <div className="gcv-narration">
        <span className="gcv-narration-label">
          {derived.active ? <AlertTriangle size={13} /> : <Activity size={13} />} trace
        </span>
        <span className="gcv-narration-body">
          {derived.active
            ? (mode === 'norm'
              ? `Raw norm ${derived.rawNorm.toFixed(2)} exceeds threshold ${threshold.toFixed(1)}, so the vector is rescaled by ${derived.scale.toFixed(3)} down to length ${derived.clippedNorm.toFixed(2)} — the direction is preserved, only the step size shrinks.`
              : `At least one component exceeds ±${threshold.toFixed(1)}, so each axis is clamped independently. Norm drops to ${derived.clippedNorm.toFixed(2)} and the direction shifts toward the box corner — the trade-off of clip-by-value.`)
            : `Raw norm ${derived.rawNorm.toFixed(2)} is within threshold ${threshold.toFixed(1)} — no clipping applied, the gradient passes through untouched (scale ${derived.scale.toFixed(3)}). Push raw magnitude up to trigger a clip.`}
          {' '}
          <TrendingUp size={11} style={{ verticalAlign: 'middle' }} /> Without clipping the loss diverges past step 18; with clipping it keeps descending.
        </span>
      </div>
    </div>
  );
}
