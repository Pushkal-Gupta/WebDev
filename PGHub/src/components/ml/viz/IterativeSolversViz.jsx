import React, { useMemo, useState, useCallback } from 'react';
import { RotateCcw, StepForward, Play } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// SPD system A x = b. We use a fixed bowl with a tunable condition number.
// A = [[a, 0],[0, c]] rotated lightly so the contours tilt; b chosen so the
// solution sits at the origin region for clean plotting.
function buildSystem(kappa) {
  // eigenvalues 1 and kappa, rotated by phi for visual tilt
  const phi = 0.42;
  const l1 = 1.0;
  const l2 = kappa;
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  // A = R diag(l1,l2) R^T  (symmetric positive definite)
  const a11 = c * c * l1 + s * s * l2;
  const a12 = c * s * (l1 - l2);
  const a22 = s * s * l1 + c * c * l2;
  const A = [[a11, a12], [a12, a22]];
  const xStar = [1.1, -0.8]; // chosen solution
  const b = [A[0][0] * xStar[0] + A[0][1] * xStar[1], A[1][0] * xStar[0] + A[1][1] * xStar[1]];
  return { A, b, xStar };
}

function matvec(A, x) {
  return [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
}
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function norm(a) { return Math.hypot(a[0], a[1]); }

// run both methods to completion, collect iterate paths + residual histories
function runMethods(A, b, x0, steps) {
  // ---- steepest / gradient descent (exact line search on quadratic) ----
  const gdPath = [x0.slice()];
  const gdRes = [];
  let xg = x0.slice();
  {
    let r = [b[0] - matvec(A, xg)[0], b[1] - matvec(A, xg)[1]];
    gdRes.push(norm(r));
    for (let k = 0; k < steps; k++) {
      const Ar = matvec(A, r);
      const alpha = dot(r, r) / Math.max(dot(r, Ar), 1e-12);
      xg = [xg[0] + alpha * r[0], xg[1] + alpha * r[1]];
      r = [b[0] - matvec(A, xg)[0], b[1] - matvec(A, xg)[1]];
      gdPath.push(xg.slice());
      gdRes.push(norm(r));
    }
  }

  // ---- conjugate gradient ----
  const cgPath = [x0.slice()];
  const cgRes = [];
  let xc = x0.slice();
  {
    let r = [b[0] - matvec(A, xc)[0], b[1] - matvec(A, xc)[1]];
    let p = r.slice();
    let rsOld = dot(r, r);
    cgRes.push(Math.sqrt(rsOld));
    for (let k = 0; k < steps; k++) {
      const Ap = matvec(A, p);
      const alpha = rsOld / Math.max(dot(p, Ap), 1e-12);
      xc = [xc[0] + alpha * p[0], xc[1] + alpha * p[1]];
      r = [r[0] - alpha * Ap[0], r[1] - alpha * Ap[1]];
      const rsNew = dot(r, r);
      cgPath.push(xc.slice());
      cgRes.push(Math.sqrt(rsNew));
      const beta = rsNew / Math.max(rsOld, 1e-12);
      p = [r[0] + beta * p[0], r[1] + beta * p[1]];
      rsOld = rsNew;
    }
  }
  return { gdPath, gdRes, cgPath, cgRes };
}

const MAX_STEPS = 20;

export default function IterativeSolversViz() {
  const [kappa, setKappa] = useState(8);
  const [step, setStep] = useState(0);

  const { A, b, xStar } = useMemo(() => buildSystem(kappa), [kappa]);
  const x0 = useMemo(() => [-1.6, 1.6], []);
  const { gdPath, gdRes, cgPath, cgRes } = useMemo(() => runMethods(A, b, x0, MAX_STEPS), [A, b, x0]);

  // ---- contour panel geometry ----
  const px = 40;
  const py = 30;
  const pw = 320;
  const ph = 300;
  const range = 2.6;
  const toPx = (x, y) => [px + ((x + range) / (2 * range)) * pw, py + ((range - y) / (2 * range)) * ph];

  // contour ellipses: pick a few level sets above the minimum
  const contours = useMemo(() => {
    const levels = [0.4, 1.2, 2.6, 4.6, 7.2];
    return levels.map((lv) => {
      const pts = [];
      // for an SPD quadratic, level set f = fStar + lv is an ellipse around xStar.
      // sample direction angles and solve the radius via the quadratic form.
      for (let i = 0; i <= 60; i++) {
        const ang = (i / 60) * 2 * Math.PI;
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        // f(xStar + r d) - fStar = 0.5 r^2 d^T A d = lv  -> r = sqrt(2 lv / dAd)
        const Ad = matvec(A, [dx, dy]);
        const dAd = dx * Ad[0] + dy * Ad[1];
        const r = Math.sqrt((2 * lv) / dAd);
        const [sx, sy] = toPx(xStar[0] + r * dx, xStar[1] + r * dy);
        pts.push([sx, sy]);
      }
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${snap(p[0], 1)} ${snap(p[1], 1)}`).join(' ') + ' Z';
    });
  }, [A, xStar]);

  const gdVisible = gdPath.slice(0, step + 1);
  const cgVisible = cgPath.slice(0, step + 1);

  function pathStr(pts) {
    return pts.map((p, i) => {
      const [sx, sy] = toPx(p[0], p[1]);
      return `${i === 0 ? 'M' : 'L'} ${snap(sx, 1)} ${snap(sy, 1)}`;
    }).join(' ');
  }

  // ---- residual log-plot panel geometry ----
  const rx = 392;
  const ry = 56;
  const rw = 176;
  const rh = 220;
  const logMin = -6; // log10 floor
  const logMax = Math.log10(Math.max(gdRes[0], cgRes[0], 1e-9));
  const resToPx = (it, res) => {
    const lx = rx + (it / MAX_STEPS) * rw;
    const lr = Math.log10(Math.max(res, 1e-6));
    const ly = ry + rh - ((lr - logMin) / (logMax - logMin)) * rh;
    return [lx, Math.max(ry, Math.min(ry + rh, ly))];
  };
  function resPath(hist) {
    return hist.slice(0, step + 1).map((res, it) => {
      const [lx, ly] = resToPx(it, res);
      return `${it === 0 ? 'M' : 'L'} ${snap(lx, 1)} ${snap(ly, 1)}`;
    }).join(' ');
  }

  const next = useCallback(() => setStep((s) => Math.min(MAX_STEPS, s + 1)), []);
  const playAll = useCallback(() => setStep(MAX_STEPS), []);
  const reset = useCallback(() => { setStep(0); setKappa(8); }, []);

  const gdCur = gdRes[Math.min(step, gdRes.length - 1)];
  const cgCur = cgRes[Math.min(step, cgRes.length - 1)];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          <defs>
            <clipPath id="is-bowl"><rect x={px} y={py} width={pw} height={ph} /></clipPath>
          </defs>

          <text x={px} y={20} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            QUADRATIC BOWL · contours of ½xᵀAx − bᵀx
          </text>

          <g clipPath="url(#is-bowl)">
            {contours.map((d, i) => (
              <path key={`c-${i}`} d={d} fill="none" stroke="var(--border)" strokeWidth="0.8" opacity={0.4 + 0.1 * i} />
            ))}

            {/* gradient descent path */}
            <path d={pathStr(gdVisible)} fill="none" stroke="var(--hue-pink)" strokeWidth="1.8" />
            {gdVisible.map((p, i) => {
              const [sx, sy] = toPx(p[0], p[1]);
              return <circle key={`gd-${i}`} cx={sx} cy={sy} r={i === gdVisible.length - 1 ? 3.5 : 2} fill="var(--hue-pink)" />;
            })}

            {/* conjugate gradient path */}
            <path d={pathStr(cgVisible)} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
            {cgVisible.map((p, i) => {
              const [sx, sy] = toPx(p[0], p[1]);
              return <circle key={`cg-${i}`} cx={sx} cy={sy} r={i === cgVisible.length - 1 ? 3.5 : 2} fill="var(--accent)" />;
            })}
          </g>

          {/* solution marker */}
          {(() => { const [sx, sy] = toPx(xStar[0], xStar[1]); return (
            <g>
              <circle cx={sx} cy={sy} r="4.5" fill="none" stroke="var(--easy)" strokeWidth="1.6" />
              <circle cx={sx} cy={sy} r="1.6" fill="var(--easy)" />
              <text x={sx + 7} y={sy - 5} fontSize="8" fill="var(--easy)" fontFamily="var(--mono)">x*</text>
            </g>
          ); })()}

          {/* panel frame */}
          <rect x={px} y={py} width={pw} height={ph} fill="none" stroke="var(--border)" strokeWidth="0.6" />

          {/* legend */}
          <g fontSize="8" fontFamily="var(--mono)">
            <rect x={px + 6} y={py + 6} width="9" height="3" fill="var(--accent)" />
            <text x={px + 19} y={py + 9.5} fill="var(--text-dim)">conjugate gradient</text>
            <rect x={px + 6} y={py + 18} width="9" height="3" fill="var(--hue-pink)" />
            <text x={px + 19} y={py + 21.5} fill="var(--text-dim)">gradient descent</text>
          </g>

          {/* residual log plot */}
          <text x={rx} y={44} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.08em">
            RESIDUAL ‖b−Ax‖ (log)
          </text>
          <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="var(--border)" strokeWidth="0.6" />
          {[0, -2, -4, -6].map((lg) => {
            const ly = ry + rh - ((lg - logMin) / (logMax - logMin)) * rh;
            return (
              <g key={`grid-${lg}`}>
                <line x1={rx} y1={ly} x2={rx + rw} y2={ly} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.5" />
                <text x={rx - 4} y={ly + 3} fontSize="7" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">1e{lg}</text>
              </g>
            );
          })}
          <path d={resPath(gdRes)} fill="none" stroke="var(--hue-pink)" strokeWidth="1.6" />
          <path d={resPath(cgRes)} fill="none" stroke="var(--accent)" strokeWidth="1.6" />
          <text x={rx + rw / 2} y={ry + rh + 14} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            iteration →  ({step}/{MAX_STEPS})
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">condition κ(A)</span>
          <input type="range" min="2" max="40" step="1" value={kappa} onChange={(e) => { setKappa(parseInt(e.target.value, 10)); setStep(0); }} />
          <span className="mlviz-slider-val">{kappa}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>CG</span>
            <span className="mlviz-val">residual = {cgCur < 1e-4 ? cgCur.toExponential(2) : snap(cgCur, 4)}</span>
            <span className="mlviz-sub">A-conjugate steps, finishes in ≤ 2 here</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag" style={{ color: 'var(--hue-pink)' }}>GD</span>
            <span className="mlviz-val">residual = {gdCur < 1e-4 ? gdCur.toExponential(2) : snap(gdCur, 4)}</span>
            <span className="mlviz-sub">zig-zags worse as κ grows</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={next} disabled={step >= MAX_STEPS}>
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={playAll} disabled={step >= MAX_STEPS}>
            <Play size={13} />
            <span>Run all</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          both descend the same bowl from the same start · conjugate gradient picks A-orthogonal directions and lands in two steps · gradient descent ricochets across the valley, slower the more stretched the bowl
        </div>
      </div>
    </div>
  );
}
