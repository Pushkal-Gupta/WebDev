import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 420;
const H = 420;
const PAD = 40;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// A linear classifier: score(x) = w . x + b.  Sign of score = predicted class.
// Boundary is the line w.x + b = 0.  For FGSM the adversarial step is
// x' = x + eps * sign(grad_x loss).  For a linear model the loss gradient
// w.r.t. x is proportional to -w (to increase loss you move opposite the
// correct-class direction), so sign(grad) = sign(-w) componentwise.
const W_VEC = [0.8, 0.6]; // unit-ish normal to the boundary
const B = 0.0;

// data domain is [-2, 2] in both axes
const DMIN = -2;
const DMAX = 2;

function toPx(x, y) {
  const sx = PAD + ((x - DMIN) / (DMAX - DMIN)) * (W - 2 * PAD);
  const sy = H - PAD - ((y - DMIN) / (DMAX - DMIN)) * (H - 2 * PAD);
  return [sx, sy];
}

function score(p) {
  return W_VEC[0] * p[0] + W_VEC[1] * p[1] + B;
}

export default function AdversarialPerturbationViz() {
  const [eps, setEps] = useState(0.0);

  // a clean point that sits on the positive side, close-ish to the boundary
  const x0 = useMemo(() => [-0.55, 0.95], []);

  // FGSM step uses the SIGN of the gradient -> moves in {-eps, +eps} per axis.
  // gradient of loss wrt x points along -w for a correctly-classified positive
  // example, so the adversarial direction is sign(-w) = -sign(w).
  const dir = useMemo(() => [-Math.sign(W_VEC[0]), -Math.sign(W_VEC[1])], []);
  const xAdv = useMemo(() => [x0[0] + eps * dir[0], x0[1] + eps * dir[1]], [x0, eps, dir]);

  const s0 = score(x0);
  const sAdv = score(xAdv);
  const flipped = Math.sign(s0) !== Math.sign(sAdv);

  // L-infinity perturbation size = eps (max per-coordinate change)
  const linfMove = eps;
  // L2 actual displacement
  const l2Move = Math.hypot(xAdv[0] - x0[0], xAdv[1] - x0[1]);

  // boundary line endpoints: w.x + b = 0 -> solve for two x-values
  const lineP1 = useMemo(() => {
    // at x = DMIN, y = -(b + w0*x)/w1
    const y = -(B + W_VEC[0] * DMIN) / W_VEC[1];
    return toPx(DMIN, y);
  }, []);
  const lineP2 = useMemo(() => {
    const y = -(B + W_VEC[0] * DMAX) / W_VEC[1];
    return toPx(DMAX, y);
  }, []);

  const [px0, py0] = toPx(x0[0], x0[1]);
  const [pxA, pyA] = toPx(xAdv[0], xAdv[1]);

  // epsilon-budget box around the clean point (L-infinity ball = a square)
  const [boxX0] = toPx(x0[0] - eps, 0);
  const [boxX1] = toPx(x0[0] + eps, 0);
  const [, boxY0] = toPx(0, x0[1] + eps);
  const [, boxY1] = toPx(0, x0[1] - eps);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '420px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* shaded half-planes: positive (sky) above-left, negative (pink) */}
          <defs>
            <clipPath id="adv-frame">
              <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
            </clipPath>
          </defs>
          <g clipPath="url(#adv-frame)">
            <polygon
              points={`${PAD},${PAD} ${lineP1[0]},${lineP1[1]} ${lineP2[0]},${lineP2[1]} ${W - PAD},${PAD}`}
              fill="var(--hue-sky)"
              opacity="0.1"
            />
            <polygon
              points={`${PAD},${H - PAD} ${lineP1[0]},${lineP1[1]} ${lineP2[0]},${lineP2[1]} ${W - PAD},${H - PAD}`}
              fill="var(--hue-pink)"
              opacity="0.1"
            />
          </g>

          {/* frame */}
          <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="var(--border)" strokeWidth="1" />

          {/* decision boundary */}
          <line x1={lineP1[0]} y1={lineP1[1]} x2={lineP2[0]} y2={lineP2[1]} stroke="var(--text-dim)" strokeWidth="1.6" strokeDasharray="6 4" />
          <text x={lineP2[0] - 6} y={lineP2[1] - 6} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            w·x + b = 0
          </text>

          {/* class labels */}
          <text x={PAD + 10} y={PAD + 18} fontSize="9" fill="var(--hue-sky)" fontFamily="var(--mono)" fontWeight="700">
            class +
          </text>
          <text x={W - PAD - 10} y={H - PAD - 8} fontSize="9" fill="var(--hue-pink)" fontFamily="var(--mono)" fontWeight="700" textAnchor="end">
            class −
          </text>

          {/* epsilon L-inf budget box */}
          {eps > 0.001 && (
            <rect
              x={boxX0}
              y={boxY0}
              width={boxX1 - boxX0}
              height={boxY1 - boxY0}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.7"
            />
          )}

          {/* perturbation step arrow */}
          {eps > 0.001 && (
            <line x1={px0} y1={py0} x2={pxA} y2={pyA} stroke="var(--accent)" strokeWidth="1.6" markerEnd="url(#adv-arrow)" />
          )}
          <defs>
            <marker id="adv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* clean point */}
          <circle cx={px0} cy={py0} r="5.5" fill="var(--hue-sky)" stroke="var(--bg)" strokeWidth="1.4" />
          <text x={px0 - 9} y={py0 - 8} fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="end">
            x
          </text>

          {/* adversarial point */}
          <circle
            cx={pxA}
            cy={pyA}
            r="5.5"
            fill={flipped ? 'var(--hue-pink)' : 'var(--hue-sky)'}
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
          <text x={pxA + 9} y={pyA + 3} fontSize="8.5" fill="var(--accent)" fontFamily="var(--mono)">
            x′
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">ε</span>
          <input
            type="range"
            min="0"
            max="1.6"
            step="0.02"
            value={eps}
            onChange={(e) => setEps(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(eps, 2)}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">x′</span>
            <span className="mlviz-val">x′ = x + ε·sign(∇ₓ L)</span>
            <span className="mlviz-sub">FGSM step along the gradient sign</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∇</span>
            <span className="mlviz-val">sign(∇ₓ L) = −sign(w) = [{dir[0]}, {dir[1]}]</span>
            <span className="mlviz-sub">for this correct +class point, raising L = lowering the score = moving away from class +</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">‖δ‖</span>
            <span className="mlviz-val">L∞ = {snap(linfMove, 2)} · L₂ = {snap(l2Move, 2)}</span>
            <span className="mlviz-sub">budget is the per-pixel L∞ cap</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">f</span>
            <span className="mlviz-val">
              score: {snap(s0, 2)} → {snap(sAdv, 2)} · {flipped ? 'LABEL FLIPPED' : 'still class +'}
            </span>
            <span className="mlviz-sub">a tiny shift crosses the boundary</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setEps(0.0)}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the point barely moves in pixel space, yet the prediction flips · adversarial training adds these x′ back into the loss
        </div>
      </div>
    </div>
  );
}
