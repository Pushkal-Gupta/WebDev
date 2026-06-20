import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 420;
const PAD = 46;
const PLOT = Math.min(W - PAD * 2, H - PAD * 2);
const CX = PAD + PLOT / 2;
const CY = PAD + PLOT / 2;
// world coords span [-RANGE, RANGE] on each weight axis
const RANGE = 4;
const SCALE = PLOT / 2 / RANGE; // px per unit

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// world -> screen
function sx(w) {
  return CX + w * SCALE;
}
function sy(w) {
  return CY - w * SCALE;
}

// Unregularised data optimum (the place the loss alone wants).
const W_STAR = { x: 2.4, y: 1.3 };
// Anisotropic quadratic data loss: L = 0.5 * [a(x-x*)^2 + b(y-y*)^2] (axis-aligned bowl)
const A = 1.0;
const B = 2.6;

function dataLoss(x, y) {
  return 0.5 * (A * (x - W_STAR.x) ** 2 + B * (y - W_STAR.y) ** 2);
}

// Closed-form constrained optimum for L2 (ridge): minimise dataLoss + 0.5*lam*(x^2+y^2)
// d/dx: a(x-x*) + lam x = 0  ->  x = a x* / (a + lam)
function l2Optimum(lam) {
  return {
    x: (A * W_STAR.x) / (A + lam),
    y: (B * W_STAR.y) / (B + lam),
  };
}

// Closed-form constrained optimum for L1 (lasso) on a separable quadratic via soft-threshold.
// minimise 0.5 a (x - x*)^2 + lam |x|  -> x = sign(x*) * max(0, |a x*| - lam) / a
function softThreshold(coef, target, lam) {
  const raw = coef * target;
  const mag = Math.max(0, Math.abs(raw) - lam);
  return (Math.sign(raw) * mag) / coef;
}
function l1Optimum(lam) {
  return {
    x: softThreshold(A, W_STAR.x, lam),
    y: softThreshold(B, W_STAR.y, lam),
  };
}

// elliptical loss contour at a given level: points around the ellipse a(x-x*)^2 + b(y-y*)^2 = 2*level
function ellipsePath(level) {
  const pts = [];
  const rx = Math.sqrt((2 * level) / A);
  const ry = Math.sqrt((2 * level) / B);
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    const x = W_STAR.x + rx * Math.cos(t);
    const y = W_STAR.y + ry * Math.sin(t);
    pts.push(`${i === 0 ? 'M' : 'L'}${snap(sx(x), 1)},${snap(sy(y), 1)}`);
  }
  return pts.join(' ') + ' Z';
}

export default function WeightDecayContourViz() {
  const [lambda, setLambda] = useState(1.4);
  const [mode, setMode] = useState('l2'); // 'l1' | 'l2'

  const opt = useMemo(
    () => (mode === 'l2' ? l2Optimum(lambda) : l1Optimum(lambda)),
    [mode, lambda]
  );

  // penalty "ball" radius: the level set that passes through the constrained optimum.
  // L2 ball is a circle of radius r = ||opt||_2; L1 ball is a diamond of "radius" t = ||opt||_1.
  const l2r = Math.sqrt(opt.x ** 2 + opt.y ** 2);
  const l1t = Math.abs(opt.x) + Math.abs(opt.y);

  const lossAtOpt = dataLoss(opt.x, opt.y);
  const lossAtStar = 0;

  // which coordinate (if any) L1 has zeroed
  const zeroedX = mode === 'l1' && Math.abs(opt.x) < 1e-6;
  const zeroedY = mode === 'l1' && Math.abs(opt.y) < 1e-6;

  // contour levels to draw (a few rings around the data optimum)
  const levels = [0.25, 0.9, 1.9, 3.2, 4.8];

  // diamond path for L1 ball of half-extent t
  const diamond = `M${snap(sx(l1t), 1)},${snap(sy(0), 1)} L${snap(sx(0), 1)},${snap(
    sy(l1t),
    1
  )} L${snap(sx(-l1t), 1)},${snap(sy(0), 1)} L${snap(sx(0), 1)},${snap(sy(-l1t), 1)} Z`;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* plot frame */}
          <rect
            x={PAD}
            y={PAD}
            width={PLOT}
            height={PLOT}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.8"
            rx="6"
          />

          {/* axes through origin */}
          <line x1={sx(-RANGE)} y1={sy(0)} x2={sx(RANGE)} y2={sy(0)} stroke="var(--border)" strokeWidth="0.7" />
          <line x1={sx(0)} y1={sy(-RANGE)} x2={sx(0)} y2={sy(RANGE)} stroke="var(--border)" strokeWidth="0.7" />
          <text x={sx(RANGE) - 4} y={sy(0) - 6} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            w₁
          </text>
          <text x={sx(0) + 6} y={sy(RANGE) + 11} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">
            w₂
          </text>

          {/* loss contours (ellipses) */}
          {levels.map((lv, i) => (
            <path
              key={`c-${i}`}
              d={ellipsePath(lv)}
              fill="none"
              stroke="var(--hue-sky)"
              strokeWidth="1"
              opacity={0.22 + 0.5 * (1 - i / levels.length)}
            />
          ))}

          {/* penalty ball: circle (L2) or diamond (L1) */}
          {mode === 'l2' ? (
            <circle
              cx={sx(0)}
              cy={sy(0)}
              r={Math.max(2, l2r * SCALE)}
              fill="rgba(var(--accent-rgb), 0.07)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />
          ) : (
            <path
              d={diamond}
              fill="rgba(var(--accent-rgb), 0.07)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />
          )}

          {/* data optimum (unregularised) */}
          <g>
            <circle cx={sx(W_STAR.x)} cy={sy(W_STAR.y)} r="4.5" fill="var(--hue-violet)" />
            <text x={sx(W_STAR.x) + 8} y={sy(W_STAR.y) - 6} fontSize="8.5" fill="var(--hue-violet)" fontFamily="var(--mono)">
              w* (data only)
            </text>
          </g>

          {/* line from data optimum to constrained optimum */}
          <line
            x1={sx(W_STAR.x)}
            y1={sy(W_STAR.y)}
            x2={sx(opt.x)}
            y2={sy(opt.y)}
            stroke="var(--text-dim)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.7"
          />

          {/* constrained optimum */}
          <g>
            <circle cx={sx(opt.x)} cy={sy(opt.y)} r="5.5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.4" />
            <text x={sx(opt.x) - 8} y={sy(opt.y) + 16} fontSize="8.5" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="end">
              ŵ(λ)
            </text>
          </g>

          {/* highlight a zeroed coordinate sitting on an axis (sparsity) */}
          {(zeroedX || zeroedY) && (
            <g>
              <circle cx={sx(opt.x)} cy={sy(opt.y)} r="10" fill="none" stroke="var(--hue-mint)" strokeWidth="1.5" />
              <text
                x={sx(opt.x)}
                y={sy(opt.y) - 16}
                fontSize="8"
                fill="var(--hue-mint)"
                fontFamily="var(--mono)"
                textAnchor="middle"
                fontWeight="700"
              >
                {zeroedX ? 'w₁ = 0' : 'w₂ = 0'} (sparse)
              </text>
            </g>
          )}

          {/* header */}
          <text x={PAD} y={PAD - 16} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            {mode === 'l2' ? 'L2 BALL · circle · smooth shrink' : 'L1 BALL · diamond · corners → zeros'} · λ = {snap(lambda, 2)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-toggles">
          <button
            type="button"
            className={`mlviz-toggle${mode === 'l2' ? ' is-on' : ''}`}
            onClick={() => setMode('l2')}
          >
            <span className="mlviz-toggle-dot" />
            <span>L2 (ridge)</span>
          </button>
          <button
            type="button"
            className={`mlviz-toggle${mode === 'l1' ? ' is-on' : ''}`}
            onClick={() => setMode('l1')}
          >
            <span className="mlviz-toggle-dot" />
            <span>L1 (lasso)</span>
          </button>
        </div>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">λ</span>
          <input
            type="range"
            min="0"
            max="6"
            step="0.05"
            value={lambda}
            onChange={(e) => setLambda(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(lambda, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">ŵ</span>
            <span className="mlviz-val">
              [{snap(opt.x, 3)}, {snap(opt.y, 3)}]
            </span>
            <span className="mlviz-sub">constrained optimum · w* = [{W_STAR.x}, {W_STAR.y}]</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">‖ŵ‖</span>
            <span className="mlviz-val">
              L1 {snap(l1t, 3)} · L2 {snap(l2r, 3)}
            </span>
            <span className="mlviz-sub">size of the surviving weight vector</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">L</span>
            <span className="mlviz-val">
              data {snap(lossAtOpt, 3)} (was {snap(lossAtStar, 3)})
            </span>
            <span className="mlviz-sub">the penalty trades a little data loss for smaller weights</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">{mode === 'l1' ? '✦' : '○'}</span>
            <span className="mlviz-val">
              {mode === 'l1'
                ? zeroedX || zeroedY
                  ? `${zeroedX ? 'w₁' : 'w₂'} snapped to exactly 0`
                  : 'no coordinate zeroed yet — raise λ'
                : 'both weights shrink, neither hits 0'}
            </span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => { setLambda(1.4); setMode('l2'); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the optimum sits where a loss contour first touches the penalty ball · L1's corners pin it to an axis → sparsity
        </div>
      </div>
    </div>
  );
}
