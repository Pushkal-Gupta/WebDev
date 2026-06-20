import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const CX = 300;
const CY = 180;
const SCALE = 64; // px per unit in parameter space

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Surrogate loss surface: a tilted quadratic bowl whose minimum sits far
// "downhill" from the current policy. The linear surrogate that TRPO/PPO
// optimise is accurate only locally — far steps overshoot the true objective.
// True objective: J(p) with an optimum near the bowl center but degrading
// sharply once you leave the trust region (the surrogate stops being valid).
const OPT = { x: 2.3, y: -1.4 }; // surrogate optimum direction
const TRUE_OPT = { x: 0.9, y: -0.55 }; // where the REAL improvement peaks

function surrogateVal(x, y) {
  // linear-ish improvement growing toward OPT (what the model believes)
  return (x * OPT.x + y * OPT.y);
}

function trueVal(x, y) {
  // real objective: rises then falls — overshooting hurts
  const dx = x - TRUE_OPT.x * 2;
  const dy = y - TRUE_OPT.y * 2;
  return -(0.5 * dx * dx + 0.5 * dy * dy);
}

// KL(θ_old || θ) approximated as quadratic 0.5 * dθ^T F dθ; here F ~ diag,
// so the trust region {KL <= delta} is an ellipse (circle for isotropic F).
function klApprox(x, y) {
  return 0.5 * (x * x + 1.4 * y * y);
}

export default function TrustRegionViz() {
  const [delta, setDelta] = useState(0.8); // KL budget
  const [constrained, setConstrained] = useState(true);

  // unconstrained natural-gradient step heads straight to OPT direction,
  // scaled large -> overshoots. Constrained step is projected onto KL ball.
  const rawStep = useMemo(() => {
    const len = Math.hypot(OPT.x, OPT.y);
    const ux = OPT.x / len;
    const uy = OPT.y / len;
    const mag = 2.6; // unconstrained march
    return { x: ux * mag, y: uy * mag };
  }, []);

  // project step so that klApprox(step) <= delta (line search along direction)
  const trustStep = useMemo(() => {
    const len = Math.hypot(OPT.x, OPT.y);
    const ux = OPT.x / len;
    const uy = OPT.y / len;
    // find max t with klApprox(t*u) <= delta
    // klApprox = 0.5*(t^2 ux^2 + 1.4 t^2 uy^2) = 0.5 t^2 (ux^2+1.4uy^2)
    const a = 0.5 * (ux * ux + 1.4 * uy * uy);
    const tMax = Math.sqrt(delta / a);
    return { x: ux * tMax, y: uy * tMax };
  }, [delta]);

  const step = constrained ? trustStep : rawStep;
  const px = (x) => CX + x * SCALE;
  const py = (y) => CY - y * SCALE;

  // trust-region ellipse radii in px (boundary where klApprox == delta)
  // 0.5*(rx_unit^2)=delta along x -> x = sqrt(2 delta); along y -> sqrt(2 delta/1.4)
  const rxU = Math.sqrt(2 * delta);
  const ryU = Math.sqrt((2 * delta) / 1.4);
  const rxPx = rxU * SCALE;
  const ryPx = ryU * SCALE;

  // contour ellipses of the surrogate (lines perpendicular to OPT direction)
  const contours = useMemo(() => {
    const out = [];
    const len = Math.hypot(OPT.x, OPT.y);
    const ux = OPT.x / len;
    const uy = OPT.y / len;
    // perpendicular
    const nx = -uy;
    const ny = ux;
    for (let c = -3; c <= 3; c++) {
      const offset = c * 0.85;
      const cxp = ux * offset;
      const cyp = uy * offset;
      out.push({
        x1: px(cxp - nx * 3),
        y1: py(cyp - ny * 3),
        x2: px(cxp + nx * 3),
        y2: py(cyp + ny * 3),
        lead: c === 0,
      });
    }
    return out;
  }, []);

  const klStep = klApprox(step.x, step.y);
  const trueGain = trueVal(step.x, step.y) - trueVal(0, 0);
  const surGain = surrogateVal(step.x, step.y);
  const overshoot = !constrained && trueGain < trueVal(trustStep.x, trustStep.y) - trueVal(0, 0);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          <text x={20} y={22} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            POLICY-PARAMETER SPACE θ · surrogate contours + KL trust region
          </text>

          {/* surrogate loss contours */}
          {contours.map((c, i) => (
            <line key={`ct-${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={c.lead ? 'var(--hue-violet)' : 'var(--border)'} strokeWidth={c.lead ? 1.1 : 0.7} strokeDasharray={c.lead ? '0' : '3 4'} opacity={c.lead ? 0.7 : 0.55} />
          ))}

          {/* improvement direction arrow toward surrogate optimum */}
          <line x1={px(0)} y1={py(0)} x2={px(OPT.x * 0.55)} y2={py(OPT.y * 0.55)} stroke="var(--hue-violet)" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />

          {/* KL trust region ellipse */}
          <ellipse cx={px(0)} cy={py(0)} rx={rxPx} ry={ryPx} fill="var(--accent)" opacity="0.08" stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="4 3" />
          <text x={px(0) + rxPx - 4} y={py(0) - ryPx + 12} fontSize="8" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="end">
            KL ≤ δ
          </text>

          {/* true optimum marker */}
          <circle cx={px(TRUE_OPT.x)} cy={py(TRUE_OPT.y)} r="5" fill="none" stroke="var(--hue-mint)" strokeWidth="1.6" />
          <text x={px(TRUE_OPT.x) + 8} y={py(TRUE_OPT.y) + 3} fontSize="8" fill="var(--hue-mint)" fontFamily="var(--mono)">
            real peak
          </text>

          {/* the step */}
          <line x1={px(0)} y1={py(0)} x2={px(step.x)} y2={py(step.y)} stroke={overshoot ? 'var(--hard)' : 'var(--accent)'} strokeWidth="2.4" markerEnd="url(#tr-arrow)" />
          <defs>
            <marker id="tr-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={overshoot ? 'var(--hard)' : 'var(--accent)'} />
            </marker>
          </defs>

          {/* old policy point */}
          <circle cx={px(0)} cy={py(0)} r="5.5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.4" />
          <text x={px(0) - 8} y={py(0) + 18} fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="end">
            θ_old
          </text>

          {/* new policy point */}
          <circle cx={px(step.x)} cy={py(step.y)} r="4.5" fill={overshoot ? 'var(--hard)' : 'var(--hue-sky)'} stroke="var(--bg)" strokeWidth="1.2" />
          <text x={px(step.x) + 6} y={py(step.y) - 6} fontSize="8" fill={overshoot ? 'var(--hard)' : 'var(--hue-sky)'} fontFamily="var(--mono)">
            θ_new
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">δ (KL budget)</span>
          <input type="range" min="0.1" max="2.0" step="0.05" value={delta} onChange={(e) => setDelta(parseFloat(e.target.value))} disabled={!constrained} />
          <span className="mlviz-slider-val">{snap(delta, 2)}</span>
        </label>

        <div className="mlviz-toggles">
          <button type="button" className={`mlviz-toggle ${constrained ? 'is-on' : ''}`} onClick={() => setConstrained(true)}>
            <span className="mlviz-toggle-dot" />KL-constrained step (TRPO)
          </button>
          <button type="button" className={`mlviz-toggle ${!constrained ? 'is-on' : ''}`} onClick={() => setConstrained(false)}>
            <span className="mlviz-toggle-dot" />unconstrained step (overshoots)
          </button>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">KL</span>
            <span className="mlviz-val">{snap(klStep, 3)} {constrained ? `≤ δ=${snap(delta, 2)}` : `(no cap)`}</span>
            <span className="mlviz-sub">{constrained ? 'step sits on the trust-region boundary' : 'step blows past the region where the surrogate is valid'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">L̂</span>
            <span className="mlviz-val">surrogate {snap(surGain, 3)}</span>
            <span className="mlviz-sub">the linear model always looks better the further you go</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">ΔJ</span>
            <span className="mlviz-val" style={{ color: trueGain < 0 ? 'var(--hard)' : 'var(--text-main)' }}>
              true {snap(trueGain, 3)}
            </span>
            <span className="mlviz-sub">{trueGain < 0 ? 'real objective got WORSE — the surrogate lied out here' : 'real improvement — monotonic step'}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => { setDelta(0.8); setConstrained(true); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the surrogate is trustworthy only near θ_old · cap the KL step so true improvement is guaranteed
        </div>
      </div>
    </div>
  );
}
