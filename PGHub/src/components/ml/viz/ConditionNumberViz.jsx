import React, { useMemo, useState, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// SVD of a symmetric-ish 2x2 built from a shear/stretch parameter t.
// We construct A = R(theta) * diag(s1, s2) so its singular values are s1, s2
// and the right-singular vectors are the axes rotated by -theta. This makes
// kappa = s1/s2 fully controllable by the slider while keeping a real map.
function buildMatrix(t, theta) {
  // s1 stays near 1.4, s2 shrinks as t grows -> kappa grows
  const s1 = 1.6;
  const s2 = 1.6 / Math.pow(10, t); // t in [0, 3] -> kappa 1 .. 1000+
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  // A = R * S, R rotates the output ellipse; columns of A are images of e1,e2
  const a = c * s1;
  const b = -sn * s2;
  const cc = sn * s1;
  const d = c * s2;
  return { a, b, c: cc, d, s1, s2, theta };
}

function applyMat(M, x, y) {
  return { x: M.a * x + M.b * y, y: M.c * x + M.d * y };
}

export default function ConditionNumberViz() {
  const [t, setT] = useState(1.0);
  const [theta, setTheta] = useState(0.5);
  // input unit vector angle (draggable), default 30deg
  const [phi, setPhi] = useState(Math.PI / 6);
  const svgRef = useRef(null);

  const M = useMemo(() => buildMatrix(t, theta), [t, theta]);
  const kappa = M.s1 / M.s2;

  // geometry: left panel = input unit circle, right panel = output ellipse
  const cxL = 160;
  const cyL = 175;
  const cxR = 440;
  const cyR = 175;
  const scale = 70; // px per unit

  // sample the unit circle, map through A to get the ellipse polyline
  const { circlePts, ellipsePts } = useMemo(() => {
    const cp = [];
    const ep = [];
    for (let i = 0; i <= 64; i++) {
      const ang = (i / 64) * 2 * Math.PI;
      const x = Math.cos(ang);
      const y = Math.sin(ang);
      cp.push([cxL + x * scale, cyL - y * scale]);
      const o = applyMat(M, x, y);
      ep.push([cxR + o.x * scale, cyR - o.y * scale]);
    }
    return { circlePts: cp, ellipsePts: ep };
  }, [M]);

  // principal axes of output ellipse (singular directions)
  const axes = useMemo(() => {
    // right-singular vectors are columns of V; with A = R*S, V = I, so the
    // input axes e1,e2 map to the ellipse semi-axes scaled by s1,s2 then rotated
    const major = applyMat(M, 1, 0);
    const minor = applyMat(M, 0, 1);
    return { major, minor };
  }, [M]);

  // input vector and its image
  const inVec = { x: Math.cos(phi), y: Math.sin(phi) };
  const outVec = applyMat(M, inVec.x, inVec.y);
  // a small perturbation of the input, fixed magnitude
  const dEps = 0.12;
  const inPerturbed = { x: Math.cos(phi + dEps), y: Math.sin(phi + dEps) };
  const outPerturbed = applyMat(M, inPerturbed.x, inPerturbed.y);

  const inDelta = Math.hypot(inPerturbed.x - inVec.x, inPerturbed.y - inVec.y);
  const outDelta = Math.hypot(outPerturbed.x - outVec.x, outPerturbed.y - outVec.y);
  const inLen = Math.hypot(inVec.x, inVec.y);
  const outLen = Math.hypot(outVec.x, outVec.y);
  const relIn = inDelta / inLen;
  const relOut = outDelta / outLen;
  const amplification = relOut / Math.max(relIn, 1e-9);

  const dragVec = useCallback((evt) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const dx = loc.x - cxL;
    const dy = cyL - loc.y;
    if (Math.hypot(dx, dy) < 4) return;
    setPhi(Math.atan2(dy, dx));
  }, []);

  const handleDown = (evt) => {
    dragVec(evt);
    const move = (e) => dragVec(e);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const reset = () => {
    setT(1.0);
    setTheta(0.5);
    setPhi(Math.PI / 6);
  };

  const circlePath = circlePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${snap(p[0], 1)} ${snap(p[1], 1)}`).join(' ') + ' Z';
  const ellipsePath = ellipsePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${snap(p[0], 1)} ${snap(p[1], 1)}`).join(' ') + ' Z';

  const condTone = kappa < 10 ? 'var(--easy)' : kappa < 100 ? 'var(--medium)' : 'var(--hard)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          <defs>
            <marker id="cn-arrow-acc" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill="var(--accent)" />
            </marker>
            <marker id="cn-arrow-pink" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="cn-arrow-sky" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill="var(--hue-sky)" />
            </marker>
          </defs>

          <text x={cxL} y={36} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            INPUT · unit circle
          </text>
          <text x={cxR} y={36} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            OUTPUT · A maps circle → ellipse
          </text>

          {/* axes for both panels */}
          {[[cxL, cyL], [cxR, cyR]].map(([cx, cy], idx) => (
            <g key={`ax-${idx}`}>
              <line x1={cx - scale * 1.7} y1={cy} x2={cx + scale * 1.7} y2={cy} stroke="var(--border)" strokeWidth="0.6" />
              <line x1={cx} y1={cy - scale * 1.7} x2={cx} y2={cy + scale * 1.7} stroke="var(--border)" strokeWidth="0.6" />
            </g>
          ))}

          {/* input unit circle */}
          <path d={circlePath} fill="rgba(var(--accent-rgb), 0.06)" stroke="var(--hue-sky)" strokeWidth="1.2" />
          {/* output ellipse */}
          <path d={ellipsePath} fill="rgba(var(--accent-rgb), 0.08)" stroke="var(--hue-violet)" strokeWidth="1.4" />

          {/* singular-value axes on the ellipse */}
          <line x1={cxR} y1={cyR} x2={cxR + axes.major.x * scale} y2={cyR - axes.major.y * scale}
                stroke="var(--text-dim)" strokeWidth="1.4" strokeDasharray="3 2" />
          <line x1={cxR} y1={cyR} x2={cxR + axes.minor.x * scale} y2={cyR - axes.minor.y * scale}
                stroke="var(--text-dim)" strokeWidth="1.4" strokeDasharray="3 2" />
          <text x={cxR + axes.major.x * scale} y={cyR - axes.major.y * scale - 4} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
            σmax {snap(M.s1, 2)}
          </text>
          <text x={cxR + axes.minor.x * scale + 4} y={cyR - axes.minor.y * scale} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
            σmin {snap(M.s2, 3)}
          </text>

          {/* input vector + perturbation (draggable) */}
          <line x1={cxL} y1={cyL} x2={cxL + inVec.x * scale} y2={cyL - inVec.y * scale}
                stroke="var(--accent)" strokeWidth="2" markerEnd="url(#cn-arrow-acc)" />
          <line x1={cxL} y1={cyL} x2={cxL + inPerturbed.x * scale} y2={cyL - inPerturbed.y * scale}
                stroke="var(--hue-pink)" strokeWidth="1.6" markerEnd="url(#cn-arrow-pink)" opacity="0.85" />
          <circle cx={cxL + inVec.x * scale} cy={cyL - inVec.y * scale} r="6"
                  fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5"
                  style={{ cursor: 'grab' }} onPointerDown={handleDown} />
          <text x={cxL} y={cyL + scale * 1.7 + 14} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            drag the dot · pink = small wobble δx
          </text>

          {/* output vector + its perturbed image */}
          <line x1={cxR} y1={cyR} x2={cxR + outVec.x * scale} y2={cyR - outVec.y * scale}
                stroke="var(--accent)" strokeWidth="2" markerEnd="url(#cn-arrow-acc)" />
          <line x1={cxR} y1={cyR} x2={cxR + outPerturbed.x * scale} y2={cyR - outPerturbed.y * scale}
                stroke="var(--hue-pink)" strokeWidth="1.6" markerEnd="url(#cn-arrow-pink)" opacity="0.85" />
          {/* amplified gap connector */}
          <line x1={cxR + outVec.x * scale} y1={cyR - outVec.y * scale}
                x2={cxR + outPerturbed.x * scale} y2={cyR - outPerturbed.y * scale}
                stroke="var(--hard)" strokeWidth="1.4" strokeDasharray="2 2" />
          <text x={cxR} y={cyR + scale * 1.7 + 14} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            same wobble, blown up by the map
          </text>

          {/* kappa banner */}
          <text x={W / 2} y={H - 8} fontSize="9.5" fill={condTone} fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
            κ(A) = σmax / σmin = {snap(kappa, kappa < 100 ? 2 : 0)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">ill-conditioning</span>
          <input type="range" min="0" max="3" step="0.05" value={t} onChange={(e) => setT(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">κ {snap(kappa, kappa < 100 ? 1 : 0)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">map rotation</span>
          <input type="range" min="0" max="1.57" step="0.02" value={theta} onChange={(e) => setTheta(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(theta, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">σ</span>
            <span className="mlviz-val">σmax = {snap(M.s1, 2)} · σmin = {snap(M.s2, 4)}</span>
            <span className="mlviz-sub">ellipse semi-axis lengths</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">in</span>
            <span className="mlviz-val">rel input wobble ‖δx‖/‖x‖ = {snap(relIn, 4)}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">out</span>
            <span className="mlviz-val">rel output wobble ‖δy‖/‖y‖ = {snap(relOut, 4)}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">amp</span>
            <span className="mlviz-val" style={{ color: condTone }}>
              amplification = {snap(amplification, 2)}×
            </span>
            <span className="mlviz-sub">≤ κ(A) = {snap(kappa, kappa < 100 ? 1 : 0)} (the ceiling)</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          a round input circle becomes a stretched ellipse · the thinner the ellipse, the more a tiny wobble in the worst direction gets amplified · κ = how thin
        </div>
      </div>
    </div>
  );
}
