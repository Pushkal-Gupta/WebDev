import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Sigma, RotateCcw, TreePine } from 'lucide-react';
import './MasterTheoremViz.css';

// The Master Theorem for divide-and-conquer recurrences:
//   T(n) = a * T(n/b) + O(n^d),   a >= 1, b > 1, d >= 0
//
// Compare the "leaf growth" exponent log_b(a) against the per-level work
// exponent d:
//   Case 1  log_b a > d   -> leaves dominate     -> Θ(n^{log_b a})
//   Case 2  log_b a = d   -> every level equal    -> Θ(n^d log n)
//   Case 3  log_b a < d   -> root dominates       -> Θ(n^d)
//
// The recursion tree makes it concrete: level i has a^i nodes each doing
// (n/b^i)^d work, so level work = a^i * (n / b^i)^d = n^d * (a / b^d)^i.
// The ratio a/b^d decides which level dominates the geometric sum.

const PRESETS = [
  { label: 'Binary search', a: 1, b: 2, d: 0 },
  { label: 'Merge sort', a: 2, b: 2, d: 1 },
  { label: 'Naive matmul', a: 8, b: 2, d: 2 },
  { label: 'Strassen', a: 7, b: 2, d: 2 },
  { label: 'Karatsuba', a: 3, b: 2, d: 1 },
];

const A_VALS = [1, 2, 3, 4, 7, 8];
const B_VALS = [2, 3, 4];
const D_VALS = [0, 1, 2, 3];

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display });

const fmt = (x) => {
  const r = Math.round(x * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : r.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
};

export default function MasterTheoremViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(2);
  const [d, setD] = useState(1);

  const model = useMemo(() => {
    const logba = Math.log(a) / Math.log(b);
    const eps = 1e-9;
    let kase;
    let result;
    if (logba > d + eps) {
      kase = 1;
      result = `\\Theta\\!\\left(n^{\\log_${b} ${a}}\\right) = \\Theta\\!\\left(n^{${fmt(logba)}}\\right)`;
    } else if (Math.abs(logba - d) <= eps) {
      kase = 2;
      result = d === 0
        ? `\\Theta(\\log n)`
        : `\\Theta\\!\\left(n^{${d}} \\log n\\right)`;
    } else {
      kase = 3;
      result = d === 0 ? `\\Theta(1)` : `\\Theta\\!\\left(n^{${d}}\\right)`;
    }
    const ratio = a / Math.pow(b, d);
    return { logba, kase, result, ratio };
  }, [a, b, d]);

  const applyPreset = (p) => {
    setA(p.a);
    setB(p.b);
    setD(p.d);
  };
  const reset = () => applyPreset(PRESETS[1]);

  const activePreset = PRESETS.find((p) => p.a === a && p.b === b && p.d === d);

  // SVG recursion tree: show levels 0..L with a^i nodes (capped) and a work bar
  // proportional to n^d * (a/b^d)^i (normalized).
  const W = 940;
  const H = 470;
  const levels = 4;
  const treeX0 = 30;
  const treeW = 520;
  const barX = treeX0 + treeW + 40;
  const barMaxW = W - barX - 130;
  const rowH = (H - 70) / (levels + 1);
  const topY = 50;

  const levelData = useMemo(() => {
    const rows = [];
    let maxWork = 0;
    for (let i = 0; i <= levels; i++) {
      const nodes = Math.pow(a, i);
      const work = Math.pow(model.ratio, i); // relative to n^d (level 0 = 1)
      maxWork = Math.max(maxWork, work);
      rows.push({ i, nodes, work });
    }
    return rows.map((r) => ({ ...r, frac: r.work / maxWork }));
  }, [a, model.ratio]);

  const caseColor =
    model.kase === 1 ? 'var(--hue-violet)' : model.kase === 2 ? 'var(--hue-sky)' : 'var(--hue-pink)';

  return (
    <div className="mtv">
      <div className="mtv-head">
        <h3 className="mtv-title">Master Theorem — which level of the recursion dominates</h3>
        <p className="mtv-sub">
          Set a, b, d for T(n)=a·T(n/b)+O(n^d). Comparing log_b(a) against d sorts the recurrence into
          one of three cases — the per-level work bars show why.
        </p>
      </div>

      <div className="mtv-controls">
        <div className="mtv-presets">
          <span className="mtv-input-label">preset</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`mtv-chip ${activePreset === p ? 'is-active' : ''}`}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="mtv-spacer" aria-hidden="true" />
        <button type="button" className="mtv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="mtv-sliders">
        <div className="mtv-slider">
          <span className="mtv-slider-label">a · subproblems</span>
          <div className="mtv-slider-vals">
            {A_VALS.map((v) => (
              <button
                key={v}
                type="button"
                className={`mtv-vchip ${a === v ? 'is-on' : ''}`}
                onClick={() => setA(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="mtv-slider">
          <span className="mtv-slider-label">b · shrink factor</span>
          <div className="mtv-slider-vals">
            {B_VALS.map((v) => (
              <button
                key={v}
                type="button"
                className={`mtv-vchip ${b === v ? 'is-on' : ''}`}
                onClick={() => setB(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="mtv-slider">
          <span className="mtv-slider-label">d · combine n^d</span>
          <div className="mtv-slider-vals">
            {D_VALS.map((v) => (
              <button
                key={v}
                type="button"
                className={`mtv-vchip ${d === v ? 'is-on' : ''}`}
                onClick={() => setD(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mtv-formula"
        dangerouslySetInnerHTML={{ __html: km(`T(n) = ${a}\\,T\\!\\left(\\tfrac{n}{${b}}\\right) + O(n^{${d}})`, true) }}
      />

      <div className="mtv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mtv-svg" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${treeX0}, 18)`}>
            <TreePine width={16} height={16} className="mtv-ic" />
          </g>
          <text className="mtv-stage-title" x={treeX0 + 24} y={31}>recursion tree</text>
          <text className="mtv-stage-title" x={barX} y={31}>work per level</text>

          {levelData.map((r) => {
            const cy = topY + r.i * rowH + rowH / 2;
            const shown = Math.min(r.nodes, Math.pow(2, r.i) > 8 ? 8 : r.nodes, 8);
            const nodeR = 9;
            const spread = Math.min(treeW, shown * 26);
            const startX = treeX0 + (treeW - spread) / 2 + nodeR;
            return (
              <g key={`lvl-${r.i}`}>
                {/* connector hint to next level */}
                {r.i < levels && (
                  <line
                    className="mtv-edge"
                    x1={treeX0 + treeW / 2}
                    y1={cy + nodeR}
                    x2={treeX0 + treeW / 2}
                    y2={topY + (r.i + 1) * rowH + rowH / 2 - nodeR}
                  />
                )}
                {Array.from({ length: shown }).map((_, k) => {
                  const x = shown === 1 ? treeX0 + treeW / 2 : startX + (k * (spread - 2 * nodeR)) / (shown - 1);
                  return <circle key={k} className="mtv-node" cx={x} cy={cy} r={nodeR} />;
                })}
                {r.nodes > shown && (
                  <text className="mtv-node-more" x={treeX0 + treeW - 4} y={cy + 4}>
                    …{fmt(r.nodes)} nodes
                  </text>
                )}
                <text className="mtv-lvl-label" x={treeX0 - 6} y={cy + 4}>
                  L{r.i}
                </text>

                {/* work bar */}
                <rect
                  className="mtv-bar-bg"
                  x={barX}
                  y={cy - 12}
                  width={barMaxW}
                  height={24}
                  rx={5}
                />
                <rect
                  className="mtv-bar"
                  x={barX}
                  y={cy - 12}
                  width={Math.max(3, r.frac * barMaxW)}
                  height={24}
                  rx={5}
                  style={{ fill: caseColor }}
                />
                <text className="mtv-bar-label" x={barX + barMaxW + 8} y={cy + 4}>
                  {fmt(r.nodes)}·(n/{fmt(Math.pow(b, r.i))})^{d}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mtv-metrics">
        <div className="mtv-metric">
          <span className="mtv-metric-label">log_b(a)</span>
          <span className="mtv-metric-value">{fmt(model.logba)}</span>
        </div>
        <div className="mtv-metric">
          <span className="mtv-metric-label">vs d</span>
          <span className="mtv-metric-value">
            {model.logba > d + 1e-9 ? '>' : Math.abs(model.logba - d) <= 1e-9 ? '=' : '<'} {d}
          </span>
        </div>
        <div className="mtv-metric">
          <span className="mtv-metric-label">case</span>
          <span className="mtv-metric-value" style={{ color: caseColor }}>Case {model.kase}</span>
        </div>
        <div className="mtv-metric is-wide">
          <span className="mtv-metric-label">Θ result</span>
          <span className="mtv-metric-katex" dangerouslySetInnerHTML={{ __html: km(model.result) }} />
        </div>
      </div>

      <div className="mtv-narration">
        <span className="mtv-narration-label">why it matters</span>
        <span className="mtv-narration-body">
          {model.kase === 1 &&
            'Leaves win: log_b(a) > d means node count grows faster than per-node work shrinks, so the bottom level holds the bulk — total cost is set by the leaf count n^{log_b a}.'}
          {model.kase === 2 &&
            'A perfect balance: log_b(a) = d makes every level do the same work, so the cost is one level times the number of levels — an extra log n factor on n^d.'}
          {model.kase === 3 &&
            'The root wins: log_b(a) < d means each call does so much combine work that the top level dominates the geometric sum — the whole recurrence is just Θ(n^d).'}
        </span>
      </div>
    </div>
  );
}
