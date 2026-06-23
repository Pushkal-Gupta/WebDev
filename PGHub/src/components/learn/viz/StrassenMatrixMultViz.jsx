import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Grid3x3, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import './StrassenMatrixMultViz.css';

// Strassen's 2x2 block multiply: 7 products instead of the naive 8.
//
// For C = A·B with 2x2 blocks, the schoolbook method needs 8 block multiplies
// (C11 = A11·B11 + A12·B21, etc.). Strassen forms 7 clever products M1..M7 from
// sums/differences of blocks, then recombines them additively into C. Trading a
// multiply for a handful of cheap adds drops the recursion's branching from 8 to
// 7, giving T(n)=7T(n/2)+O(n^2) = Θ(n^{log2 7}) ≈ Θ(n^2.807).

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display });

const PRODUCTS = [
  { id: 'M1', tex: 'M_1 = (A_{11}+A_{22})(B_{11}+B_{22})', feeds: ['A11', 'A22', 'B11', 'B22'] },
  { id: 'M2', tex: 'M_2 = (A_{21}+A_{22})\\,B_{11}', feeds: ['A21', 'A22', 'B11'] },
  { id: 'M3', tex: 'M_3 = A_{11}(B_{12}-B_{22})', feeds: ['A11', 'B12', 'B22'] },
  { id: 'M4', tex: 'M_4 = A_{22}(B_{21}-B_{11})', feeds: ['A22', 'B21', 'B11'] },
  { id: 'M5', tex: 'M_5 = (A_{11}+A_{12})\\,B_{22}', feeds: ['A11', 'A12', 'B22'] },
  { id: 'M6', tex: 'M_6 = (A_{21}-A_{11})(B_{11}+B_{12})', feeds: ['A21', 'A11', 'B11', 'B12'] },
  { id: 'M7', tex: 'M_7 = (A_{12}-A_{22})(B_{21}+B_{22})', feeds: ['A12', 'A22', 'B21', 'B22'] },
];

const COMBINE = [
  { id: 'C11', tex: 'C_{11} = M_1 + M_4 - M_5 + M_7', uses: ['M1', 'M4', 'M5', 'M7'] },
  { id: 'C12', tex: 'C_{12} = M_3 + M_5', uses: ['M3', 'M5'] },
  { id: 'C21', tex: 'C_{21} = M_2 + M_4', uses: ['M2', 'M4'] },
  { id: 'C22', tex: 'C_{22} = M_1 - M_2 + M_3 + M_6', uses: ['M1', 'M2', 'M3', 'M6'] },
];

// step 0..6 highlight M1..M7; step 7..10 highlight C11..C22; total 11 steps.
const TOTAL_STEPS = PRODUCTS.length + COMBINE.length;

const BLOCK_POS = {
  A11: [0, 0], A12: [1, 0], A21: [0, 1], A22: [1, 1],
};
const BLOCK_POS_B = {
  B11: [0, 0], B12: [1, 0], B21: [0, 1], B22: [1, 1],
};

export default function StrassenMatrixMultViz() {
  const [step, setStep] = useState(0);

  const phase = step < PRODUCTS.length ? 'product' : 'combine';
  const active = phase === 'product' ? PRODUCTS[step] : COMBINE[step - PRODUCTS.length];

  const litBlocks = useMemo(() => {
    if (phase !== 'product') return new Set();
    return new Set(active.feeds);
  }, [phase, active]);

  const litProducts = useMemo(() => {
    if (phase === 'product') return new Set([active.id]);
    return new Set(active.uses);
  }, [phase, active]);

  const reset = () => setStep(0);

  // SVG geometry: A and B 2x2 grids at top-left, product list center, C grid right.
  const W = 940;
  const H = 470;

  const gridSize = 56;
  const gridGap = 6;
  const aX = 36;
  const bX = 36 + 2 * (gridSize + gridGap) + 40;
  const gridY = 64;

  const renderMatrix = (label, prefix, posMap, x, lit) => (
    <g>
      <text className="smm-mat-label" x={x} y={gridY - 12}>{label}</text>
      {Object.entries(posMap).map(([blk, [cx, cy]]) => {
        const px = x + cx * (gridSize + gridGap);
        const py = gridY + cy * (gridSize + gridGap);
        const on = lit.has(blk);
        const c = prefix === 'A' ? 'var(--hue-violet)' : 'var(--hue-sky)';
        return (
          <g key={blk}>
            <rect
              className={`smm-block ${on ? 'is-lit' : ''}`}
              x={px}
              y={py}
              width={gridSize}
              height={gridSize}
              rx={7}
              style={on ? { stroke: c, fill: `color-mix(in srgb, ${c}, var(--surface) 78%)` } : undefined}
            />
            <text className="smm-block-label" x={px + gridSize / 2} y={py + gridSize / 2 + 5}>
              {blk}
            </text>
          </g>
        );
      })}
    </g>
  );

  return (
    <div className="smm">
      <div className="smm-head">
        <h3 className="smm-title">Strassen's algorithm — 7 multiplies, not 8</h3>
        <p className="smm-sub">
          A 2x2 block product naively costs 8 multiplications. Strassen forms 7 products from block
          sums and differences, then recombines them — one fewer recursive branch, a smaller exponent.
        </p>
      </div>

      <div className="smm-controls">
        <span className="smm-phase">
          <Grid3x3 size={14} className="smm-phase-ic" />
          {phase === 'product'
            ? `product ${step + 1} of 7`
            : `combine ${step - PRODUCTS.length + 1} of 4`}
        </span>
        <span className="smm-spacer" aria-hidden="true" />
        <button
          type="button"
          className="smm-btn"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          type="button"
          className="smm-btn smm-btn-primary"
          onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
          disabled={step === TOTAL_STEPS - 1}
        >
          Step <ChevronRight size={14} />
        </button>
        <button type="button" className="smm-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div
        className="smm-active"
        dangerouslySetInnerHTML={{ __html: km(active.tex, true) }}
      />

      <div className="smm-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="smm-svg" preserveAspectRatio="xMidYMid meet">
          {renderMatrix('A', 'A', BLOCK_POS, aX, litBlocks)}
          <text className="smm-times" x={bX - 28} y={gridY + gridSize + 4}>×</text>
          {renderMatrix('B', 'B', BLOCK_POS_B, bX, litBlocks)}

          {/* product list M1..M7 */}
          <text className="smm-col-label" x={W / 2 - 6} y={gridY - 12}>7 products</text>
          {PRODUCTS.map((p, i) => {
            const py = gridY + i * 40;
            const on = litProducts.has(p.id);
            const px = W / 2 - 6;
            return (
              <g key={p.id}>
                <rect
                  className={`smm-prod ${on ? 'is-lit' : ''}`}
                  x={px}
                  y={py}
                  width={150}
                  height={32}
                  rx={6}
                />
                <text className="smm-prod-id" x={px + 14} y={py + 21}>{p.id}</text>
                <text className="smm-prod-feeds" x={px + 142} y={py + 21}>
                  {p.feeds.length} blocks
                </text>
              </g>
            );
          })}

          {/* C result grid */}
          {(() => {
            const cX = W - 36 - 2 * (gridSize + gridGap) + gridGap;
            return (
              <g>
                <text className="smm-mat-label" x={cX} y={gridY - 12}>C = A·B</text>
                {COMBINE.map((cc) => {
                  const [gx, gy] = {
                    C11: [0, 0], C12: [1, 0], C21: [0, 1], C22: [1, 1],
                  }[cc.id];
                  const px = cX + gx * (gridSize + gridGap);
                  const py = gridY + gy * (gridSize + gridGap);
                  const on = phase === 'combine' && active.id === cc.id;
                  return (
                    <g key={cc.id}>
                      <rect
                        className={`smm-block smm-cblock ${on ? 'is-lit' : ''}`}
                        x={px}
                        y={py}
                        width={gridSize}
                        height={gridSize}
                        rx={7}
                        style={on ? { stroke: 'var(--accent)', fill: 'rgba(var(--accent-rgb),0.16)' } : undefined}
                      />
                      <text className="smm-block-label" x={px + gridSize / 2} y={py + gridSize / 2 + 5}>
                        {cc.id}
                      </text>
                    </g>
                  );
                })}
                <text className="smm-c-hint" x={cX + gridSize + gridGap / 2} y={gridY + 2 * gridSize + gridGap + 26}>
                  recombined from M-products
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="smm-metrics">
        <div className="smm-metric">
          <span className="smm-metric-label">naive mults</span>
          <span className="smm-metric-value is-bad">8</span>
        </div>
        <div className="smm-metric">
          <span className="smm-metric-label">strassen mults</span>
          <span className="smm-metric-value is-good">7</span>
        </div>
        <div className="smm-metric">
          <span className="smm-metric-label">recurrence</span>
          <span
            className="smm-metric-katex"
            dangerouslySetInnerHTML={{ __html: km('7\\,T(n/2)+O(n^2)') }}
          />
        </div>
        <div className="smm-metric">
          <span className="smm-metric-label">exponent</span>
          <span
            className="smm-metric-katex"
            dangerouslySetInnerHTML={{ __html: km('\\log_2 7 \\approx 2.807') }}
          />
        </div>
      </div>

      <div className="smm-narration">
        <span className="smm-narration-label">why it matters</span>
        <span className="smm-narration-body">
          Each recursive call branches into 7 subproblems instead of 8, and that single saved multiply
          per level compounds: log_b(a) drops from log2(8)=3 to log2(7)≈2.807. The extra additions are
          O(n^2) and don't change the exponent, so for large matrices Strassen genuinely beats the
          cubic schoolbook algorithm.
        </span>
      </div>
    </div>
  );
}
