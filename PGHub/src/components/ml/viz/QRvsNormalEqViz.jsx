import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 320;
const PAD_L = 46;
const PAD_R = 18;
const PAD_T = 28;
const PAD_B = 38;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// mulberry32 deterministic seed
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a design matrix A (m x 2) and target b for a least-squares line.
// collinear in [0,1) controls how close column 2 gets to column 1 (near rank-deficient).
function buildData(m, collinear) {
  const rand = mulberry32(13 + m + Math.round(collinear * 1000));
  const xs = [];
  for (let i = 0; i < m; i++) xs.push(i / (m - 1));
  // true line: y = 1.0 + 2.0 x  (+ small noise)
  const A = [];
  const b = [];
  for (let i = 0; i < m; i++) {
    const x = xs[i];
    // second column nearly a copy of the first when collinear -> 1
    const noise = (1 - collinear) * (rand() - 0.5);
    const col2 = x * collinear + noise;
    A.push([1.0, x, col2]); // intercept, x, near-duplicate feature
    b.push(1.0 + 2.0 * x + 0.05 * (rand() - 0.5));
  }
  return { A, b, xs };
}

// --- tiny linear algebra in plain JS ---
function matT(M) {
  const r = M.length, c = M[0].length;
  const out = Array.from({ length: c }, () => Array(r).fill(0));
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[j][i] = M[i][j];
  return out;
}
function matMul(A, B) {
  const n = A.length, k = A[0].length, mm = B[0].length;
  const out = Array.from({ length: n }, () => Array(mm).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < mm; j++) {
      let s = 0;
      for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
      out[i][j] = s;
    }
  return out;
}
function matVec(A, v) {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
}

// Singular values of a small matrix via eigenvalues of M^T M (power-ish / analytic).
// We compute eigenvalues of the symmetric 3x3 G = A^T A through Jacobi rotation.
function symEig(G) {
  const n = G.length;
  const a = G.map((r) => r.slice());
  // Jacobi eigenvalue iteration
  for (let sweep = 0; sweep < 60; sweep++) {
    let p = 0, q = 1, off = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(a[i][j]) > off) { off = Math.abs(a[i][j]); p = i; q = j; }
      }
    if (off < 1e-14) break;
    const app = a[p][p], aqq = a[q][q], apq = a[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi), s = Math.sin(phi);
    for (let i = 0; i < n; i++) {
      const aip = a[i][p], aiq = a[i][q];
      a[i][p] = c * aip - s * aiq;
      a[i][q] = s * aip + c * aiq;
    }
    for (let i = 0; i < n; i++) {
      const api = a[p][i], aqi = a[q][i];
      a[p][i] = c * api - s * aqi;
      a[q][i] = s * api + c * aqi;
    }
  }
  return a.map((r, i) => r[i]).sort((x, y) => y - x);
}

// Solve a small SPD-ish system G x = rhs by Gaussian elimination with partial pivoting.
function solveLin(G, rhs) {
  const n = G.length;
  const M = G.map((r, i) => [...r, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    if (Math.abs(d) < 1e-15) return null;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((r, i) => r[n] / r[i][i]);
}

// Real reduced QR via classical Gram-Schmidt on the columns of A (m x n).
// Returns Q (m x n) with orthonormal columns and upper-triangular R (n x n).
function qrGramSchmidt(A) {
  const m = A.length, n = A[0].length;
  const cols = matT(A); // n columns, each length m
  const Q = Array.from({ length: n }, () => Array(m).fill(0));
  const R = Array.from({ length: n }, () => Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    const v = cols[j].slice();
    for (let i = 0; i < j; i++) {
      let dot = 0;
      for (let k = 0; k < m; k++) dot += Q[i][k] * cols[j][k];
      R[i][j] = dot;
      for (let k = 0; k < m; k++) v[k] -= dot * Q[i][k];
    }
    let norm = 0;
    for (let k = 0; k < m; k++) norm += v[k] * v[k];
    norm = Math.sqrt(norm);
    R[j][j] = norm;
    if (norm < 1e-300) { for (let k = 0; k < m; k++) Q[j][k] = 0; continue; }
    for (let k = 0; k < m; k++) Q[j][k] = v[k] / norm;
  }
  return { Q, R }; // Q stored row-per-column (n rows x m)
}

// Back-substitution for an upper-triangular R (n x n) solving R x = y.
function backSub(R, y) {
  const n = R.length;
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < n; j++) s -= R[i][j] * x[j];
    if (Math.abs(R[i][i]) < 1e-300) return null;
    x[i] = s / R[i][i];
  }
  return x;
}

export default function QRvsNormalEqViz() {
  const [m, setM] = useState(20);
  const [collinear, setCollinear] = useState(0.6);

  const { A, b, xs } = useMemo(() => buildData(m, collinear), [m, collinear]);

  const stats = useMemo(() => {
    const At = matT(A);
    const G = matMul(At, A); // A^T A
    const Atb = matVec(At, b);

    // singular values of A = sqrt(eigenvalues of A^T A)
    const eig = symEig(G).map((e) => Math.sqrt(Math.max(e, 0)));
    const sMax = eig[0];
    const sMin = eig[eig.length - 1];
    const condA = sMin > 1e-30 ? sMax / sMin : Infinity;
    const condG = condA * condA; // condition of normal-equations matrix

    // Normal-equations solve: form A^T A then solve (squares the conditioning).
    const xNE = solveLin(G, Atb);

    // QR path: factor A = QR by Gram-Schmidt, then solve R x = Q^T b.
    // This never forms A^T A, so it works at condition number kappa(A), not its square.
    const { Q, R } = qrGramSchmidt(A);
    // Q is stored as n rows (one per column) of length m, so Q^T b is a dot per column.
    const Qtb = Q.map((qcol) => qcol.reduce((s, qk, k) => s + qk * b[k], 0));
    const xQR = backSub(R, Qtb);

    function residual(x) {
      if (!x) return Infinity;
      const r = matVec(A, x).map((v, i) => v - b[i]);
      return Math.sqrt(r.reduce((s, v) => s + v * v, 0));
    }

    // Digits of accuracy each path can be expected to hold: NE loses ~log10(condG),
    // QR loses ~log10(condA). These describe the two solves above, not added noise.
    const digits = 16;
    const neLost = Math.min(digits, Math.log10(Math.max(condG, 1)));
    const qrLost = Math.min(digits, Math.log10(Math.max(condA, 1)));

    return {
      condA,
      condG,
      resNE: residual(xNE),
      resQR: residual(xQR),
      neLost,
      qrLost,
      xs,
      A,
      b,
    };
  }, [A, b, xs]);

  // ---- scatter plot of (x, b) ----
  const plotX = PAD_L;
  const plotY = PAD_T;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const bMax = Math.max(...b, 3.2);
  const bMin = Math.min(...b, 0.5);
  function px(x) { return plotX + x * plotW; }
  function py(v) { return plotY + plotH - ((v - bMin) / (bMax - bMin)) * plotH; }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '820px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x={plotX}
            y={plotY - 12}
            fontSize="11.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            LEAST-SQUARES FIT · m = {m} points · column 3 collinearity = {snap(collinear, 2)}
          </text>

          {/* axes */}
          <line x1={plotX} y1={plotY + plotH} x2={plotX + plotW} y2={plotY + plotH} stroke="var(--border)" strokeWidth="0.8" />
          <line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotH} stroke="var(--border)" strokeWidth="0.8" />

          {/* gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={`vg-${g}`}
              x1={px(g)}
              y1={plotY}
              x2={px(g)}
              y2={plotY + plotH}
              stroke="var(--border)"
              strokeWidth="0.3"
              strokeDasharray="2 3"
              opacity="0.4"
            />
          ))}

          {/* fitted line: y = 1 + 2x (the recoverable signal) */}
          <line
            x1={px(0)}
            y1={py(1.0)}
            x2={px(1)}
            y2={py(3.0)}
            stroke="var(--accent)"
            strokeWidth="1.6"
            opacity="0.85"
          />

          {/* data points */}
          {stats.xs.map((x, i) => (
            <circle
              key={`pt-${i}`}
              cx={px(x)}
              cy={py(b[i])}
              r="3"
              fill="var(--hue-violet)"
              opacity="0.7"
            />
          ))}

          <text x={plotX} y={plotY + plotH + 14} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            x = 0
          </text>
          <text x={plotX + plotW} y={plotY + plotH + 14} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            x = 1
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">collinearity</span>
          <input
            type="range"
            min="0"
            max="0.999"
            step="0.01"
            value={collinear}
            onChange={(e) => setCollinear(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(collinear, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">points</span>
          <input
            type="range"
            min="6"
            max="60"
            step="1"
            value={m}
            onChange={(e) => setM(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{m}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">κ(A)</span>
            <span className="mlviz-val">{Number.isFinite(stats.condA) ? stats.condA.toExponential(2) : '∞'}</span>
            <span className="mlviz-sub">QR works with this — loses ~{snap(stats.qrLost, 1)} digits</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">κ(AᵀA)</span>
            <span className="mlviz-val">{Number.isFinite(stats.condG) ? stats.condG.toExponential(2) : '∞'}</span>
            <span className="mlviz-sub">= κ(A)² — normal eqs square it, lose ~{snap(stats.neLost, 1)} digits</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">QR res</span>
            <span className="mlviz-val">{Number.isFinite(stats.resQR) ? stats.resQR.toExponential(3) : '—'}</span>
            <span className="mlviz-sub">residual ‖Ax−b‖ stays small and stable</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">NE res</span>
            <span className="mlviz-val">{Number.isFinite(stats.resNE) ? stats.resNE.toExponential(3) : '—'}</span>
            <span className="mlviz-sub">degrades as columns become near-collinear</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setCollinear(0.6); setM(20); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          push collinearity toward 1 · κ(A) climbs and κ(AᵀA) climbs as its square · the normal-equations residual blows up first while QR holds
        </div>
      </div>
    </div>
  );
}
