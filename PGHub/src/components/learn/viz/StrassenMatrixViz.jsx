import React, { useMemo, useState } from 'react';
import { Grid3x3, RotateCcw, ChevronRight, SkipForward, Minus, Plus, Check } from 'lucide-react';
import './StrassenMatrixViz.css';

const A_DEFAULT = [[1, 2], [3, 4]];
const B_DEFAULT = [[5, 6], [7, 8]];

const QUAD = ['11', '12', '21', '22'];

// Each of the 7 Strassen products, described declaratively so we can render the
// formula, highlight the contributing quadrants, and compute the value live.
const PRODUCTS = [
  {
    id: 'M1',
    formula: 'M1 = (A11 + A22)(B11 + B22)',
    aTerms: [['11', +1], ['22', +1]],
    bTerms: [['11', +1], ['22', +1]],
  },
  {
    id: 'M2',
    formula: 'M2 = (A21 + A22) B11',
    aTerms: [['21', +1], ['22', +1]],
    bTerms: [['11', +1]],
  },
  {
    id: 'M3',
    formula: 'M3 = A11 (B12 - B22)',
    aTerms: [['11', +1]],
    bTerms: [['12', +1], ['22', -1]],
  },
  {
    id: 'M4',
    formula: 'M4 = A22 (B21 - B11)',
    aTerms: [['22', +1]],
    bTerms: [['21', +1], ['11', -1]],
  },
  {
    id: 'M5',
    formula: 'M5 = (A11 + A12) B22',
    aTerms: [['11', +1], ['12', +1]],
    bTerms: [['22', +1]],
  },
  {
    id: 'M6',
    formula: 'M6 = (A21 - A11)(B11 + B12)',
    aTerms: [['21', +1], ['11', -1]],
    bTerms: [['11', +1], ['12', +1]],
  },
  {
    id: 'M7',
    formula: 'M7 = (A12 - A22)(B21 + B22)',
    aTerms: [['12', +1], ['22', -1]],
    bTerms: [['21', +1], ['22', +1]],
  },
];

// C reconstructions from the 7 products.
const C_RECON = {
  11: { label: 'C11 = M1 + M4 - M5 + M7', terms: [['M1', +1], ['M4', +1], ['M5', -1], ['M7', +1]] },
  12: { label: 'C12 = M3 + M5', terms: [['M3', +1], ['M5', +1]] },
  21: { label: 'C21 = M2 + M4', terms: [['M2', +1], ['M4', +1]] },
  22: { label: 'C22 = M1 - M2 + M3 + M6', terms: [['M1', +1], ['M2', -1], ['M3', +1], ['M6', +1]] },
};

function termSum(matrix, terms) {
  // matrix indexed by quadrant string ('11'..'22'); terms = [['11', sign], ...]
  return terms.reduce((acc, [q, sign]) => acc + sign * matrix[q], 0);
}

function signStr(sign) {
  return sign > 0 ? '+' : '-';
}

export default function StrassenMatrixViz() {
  const [A, setA] = useState(A_DEFAULT);
  const [B, setB] = useState(B_DEFAULT);
  const [depth, setDepth] = useState(2); // n = 2^depth; slider drives leaf-count demo
  // step: -1 = intro, 0..6 = products M1..M7, 7 = C reconstruction / verify
  const [step, setStep] = useState(-1);

  const aQuad = useMemo(() => ({ 11: A[0][0], 12: A[0][1], 21: A[1][0], 22: A[1][1] }), [A]);
  const bQuad = useMemo(() => ({ 11: B[0][0], 12: B[0][1], 21: B[1][0], 22: B[1][1] }), [B]);

  const productVals = useMemo(() => {
    const out = {};
    PRODUCTS.forEach((p) => {
      const av = termSum(aQuad, p.aTerms);
      const bv = termSum(bQuad, p.bTerms);
      out[p.id] = { av, bv, val: av * bv };
    });
    return out;
  }, [aQuad, bQuad]);

  const cVals = useMemo(() => {
    const out = {};
    QUAD.forEach((q) => {
      out[q] = termSum(
        Object.fromEntries(PRODUCTS.map((p) => [p.id, productVals[p.id].val])),
        C_RECON[q].terms,
      );
    });
    return out;
  }, [productVals]);

  // Naive product for verification.
  const naive = useMemo(() => ({
    11: A[0][0] * B[0][0] + A[0][1] * B[1][0],
    12: A[0][0] * B[0][1] + A[0][1] * B[1][1],
    21: A[1][0] * B[0][0] + A[1][1] * B[1][0],
    22: A[1][0] * B[0][1] + A[1][1] * B[1][1],
  }), [A, B]);

  const matches = QUAD.every((q) => cVals[q] === naive[q]);

  const totalSteps = PRODUCTS.length + 2; // intro + 7 + reconstruct
  const multiplyCount = Math.max(0, Math.min(step + 1, 7));
  const activeProduct = step >= 0 && step < 7 ? PRODUCTS[step] : null;
  const onRecon = step >= 7;

  const n = 2 ** depth;
  const leafStrassen = 7 ** depth;
  const leafNaive = 8 ** depth;

  const editCell = (which, r, c, delta) => {
    const set = which === 'A' ? setA : setB;
    set((m) => {
      const next = m.map((row) => row.slice());
      next[r][c] = Math.max(-9, Math.min(9, next[r][c] + delta));
      return next;
    });
    setStep(-1);
  };

  const reset = () => {
    setA(A_DEFAULT);
    setB(B_DEFAULT);
    setStep(-1);
  };

  const narration = (() => {
    if (step === -1) {
      return 'Naive 2x2 block multiply needs 8 sub-multiplies. Strassen rewrites it as 7. Step through to watch the seven products build the answer.';
    }
    if (activeProduct) {
      const pv = productVals[activeProduct.id];
      return `${activeProduct.formula} = (${pv.av})(${pv.bv}) = ${pv.val}. That is multiply ${step + 1} of 7 — one fewer than the naive 8.`;
    }
    return matches
      ? 'Reconstruct the four C quadrants by adding and subtracting the 7 products (no new multiplies). The result equals the naive product — Strassen is correct.'
      : 'Reconstructing C from the 7 products. Adjust the inputs and the result tracks the naive product exactly.';
  })();

  // ---- SVG geometry for the two input matrices + result matrix ----
  const W = 940;
  const H = 300;
  const cell = 58;
  const gap = 6;
  const matW = cell * 2 + gap;

  const aX = 70;
  const bX = 380;
  const cX = 700;
  const matY = 70;

  const quadHi = (which, q) => {
    if (!activeProduct) return null;
    const terms = which === 'A' ? activeProduct.aTerms : activeProduct.bTerms;
    const found = terms.find(([qq]) => qq === q);
    return found ? found[1] : null;
  };

  const renderMatrix = (which, x, vals, hueClass) => (
    <g>
      <text className="strm-mat-label" x={x + matW / 2} y={matY - 14} textAnchor="middle">
        {which}
      </text>
      {QUAD.map((q, i) => {
        const r = i < 2 ? 0 : 1;
        const c = i % 2;
        const cx = x + c * (cell + gap);
        const cy = matY + r * (cell + gap);
        let cls = `strm-quad ${hueClass}`;
        let tag = null;
        if (which === 'C') {
          if (onRecon) cls += ' is-active';
        } else {
          const sign = quadHi(which, q);
          if (sign !== null) {
            cls += sign > 0 ? ' is-pos' : ' is-neg';
            tag = signStr(sign);
          }
        }
        return (
          <g key={`${which}-${q}`}>
            <rect className={cls} x={cx} y={cy} width={cell} height={cell} rx={8} />
            <text className="strm-quad-val" x={cx + cell / 2} y={cy + cell / 2 + 7} textAnchor="middle">
              {vals[q]}
            </text>
            <text className="strm-quad-name" x={cx + 7} y={cy + 16}>
              {which}{q}
            </text>
            {tag && (
              <text className={`strm-quad-tag ${tag === '+' ? 'is-pos' : 'is-neg'}`} x={cx + cell - 8} y={cy + 16} textAnchor="end">
                {tag}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );

  return (
    <div className="strm">
      <div className="strm-head">
        <span className="strm-head-icon"><Grid3x3 size={18} /></span>
        <div className="strm-head-text">
          <h3 className="strm-title">Strassen&apos;s matrix multiplication</h3>
          <p className="strm-sub">
            Seven products instead of eight. Edit the quadrants, step the seven multiplies, and watch the
            recursion gap 7^d vs 8^d open up.
          </p>
        </div>
      </div>

      <div className="strm-editors">
        {[['A', A], ['B', B]].map(([name, m]) => (
          <div className="strm-editor" key={name}>
            <span className="strm-editor-label">{name}</span>
            <div className="strm-editor-grid">
              {[0, 1].map((r) => [0, 1].map((c) => (
                <div className="strm-edit-cell" key={`${name}-${r}-${c}`}>
                  <span className="strm-edit-quad">{name}{QUAD[r * 2 + c]}</span>
                  <div className="strm-stepper">
                    <button
                      type="button"
                      className="strm-step-btn"
                      onClick={() => editCell(name, r, c, -1)}
                      aria-label={`decrease ${name}${QUAD[r * 2 + c]}`}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="strm-edit-val">{m[r][c]}</span>
                    <button
                      type="button"
                      className="strm-step-btn"
                      onClick={() => editCell(name, r, c, +1)}
                      aria-label={`increase ${name}${QUAD[r * 2 + c]}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </div>
        ))}
      </div>

      <div className="strm-controls">
        <div className="strm-buttons">
          <button
            type="button"
            className="strm-btn strm-btn-primary"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 2))}
            disabled={step >= totalSteps - 2}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="strm-btn"
            onClick={() => setStep(totalSteps - 2)}
            disabled={step >= totalSteps - 2}
          >
            <SkipForward size={14} /> All 7
          </button>
          <button type="button" className="strm-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <span className="strm-spacer" aria-hidden="true" />
        <div className="strm-stepcount">
          {step < 0 ? 'ready' : onRecon ? 'reconstruct C' : `product ${step + 1} / 7`}
        </div>
      </div>

      <div className="strm-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="strm-svg" preserveAspectRatio="xMidYMid meet">
          {renderMatrix('A', aX, aQuad, 'is-a')}
          <text className="strm-op" x={(aX + matW + bX) / 2} y={matY + matW / 2 + 6} textAnchor="middle">x</text>
          {renderMatrix('B', bX, bQuad, 'is-b')}
          <text className="strm-op" x={(bX + matW + cX) / 2} y={matY + matW / 2 + 6} textAnchor="middle">=</text>
          {renderMatrix('C', cX, onRecon ? cVals : { 11: '?', 12: '?', 21: '?', 22: '?' }, 'is-c')}

          {activeProduct && (
            <g>
              <rect className="strm-prodcard" x={70} y={matY + matW + 22} width={W - 140} height={56} rx={9} />
              <text className="strm-prod-formula" x={88} y={matY + matW + 47}>
                {activeProduct.formula}
              </text>
              <text className="strm-prod-eval" x={88} y={matY + matW + 67}>
                = ({productVals[activeProduct.id].av})({productVals[activeProduct.id].bv}) = {productVals[activeProduct.id].val}
              </text>
              <text className="strm-prod-id" x={W - 88} y={matY + matW + 56} textAnchor="end">
                {activeProduct.id}
              </text>
            </g>
          )}
          {onRecon && (
            <g>
              <rect className="strm-prodcard is-ok" x={70} y={matY + matW + 22} width={W - 140} height={56} rx={9} />
              <text className="strm-prod-formula" x={88} y={matY + matW + 47}>
                {C_RECON[11].label} · {C_RECON[12].label}
              </text>
              <text className="strm-prod-eval" x={88} y={matY + matW + 67}>
                {C_RECON[21].label} · {C_RECON[22].label}
              </text>
              <text className={`strm-prod-id ${matches ? 'is-ok' : 'is-warn'}`} x={W - 88} y={matY + matW + 56} textAnchor="end">
                {matches ? 'C = A·B' : 'mismatch'}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="strm-counters">
        <div className="strm-counter is-naive">
          <span className="strm-counter-label">naive multiplies</span>
          <span className="strm-counter-big">8</span>
          <span className="strm-counter-foot">O(n^3) per level</span>
        </div>
        <div className="strm-counter is-strassen">
          <span className="strm-counter-label">strassen multiplies</span>
          <span className="strm-counter-big">
            {multiplyCount}<span className="strm-counter-of"> / 7</span>
          </span>
          <span className="strm-counter-foot">O(n^2.807)</span>
        </div>
        <div className="strm-counter">
          <span className="strm-counter-label">verification</span>
          <span className="strm-counter-big strm-verify">
            {onRecon ? (
              matches ? <><Check size={20} /> equal</> : 'mismatch'
            ) : '—'}
          </span>
          <span className="strm-counter-foot">vs naive product</span>
        </div>
      </div>

      <div className="strm-recursion">
        <div className="strm-recursion-head">
          <label className="strm-rec-slider">
            <span className="strm-input-label">n = 2^d</span>
            <input
              type="range" min={1} max={5} step={1} value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="strm-range" aria-label="Recursion depth"
            />
            <span className="strm-slider-val">n = {n} (d = {depth})</span>
          </label>
          <span className="strm-rec-caption">Leaf multiplies at the bottom of the recursion</span>
        </div>
        <div className="strm-rec-bars">
          {(() => {
            const max = leafNaive;
            return (
              <>
                <div className="strm-bar-row">
                  <span className="strm-bar-name is-naive">naive 8^d</span>
                  <div className="strm-bar-track">
                    <div className="strm-bar-fill is-naive" style={{ width: `${(leafNaive / max) * 100}%` }} />
                  </div>
                  <span className="strm-bar-val is-naive">{leafNaive.toLocaleString()}</span>
                </div>
                <div className="strm-bar-row">
                  <span className="strm-bar-name is-strassen">strassen 7^d</span>
                  <div className="strm-bar-track">
                    <div className="strm-bar-fill is-strassen" style={{ width: `${(leafStrassen / max) * 100}%` }} />
                  </div>
                  <span className="strm-bar-val is-strassen">{leafStrassen.toLocaleString()}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="strm-narration">
        <span className="strm-narration-label">trace</span>
        <span className="strm-narration-body">{narration}</span>
      </div>
    </div>
  );
}
