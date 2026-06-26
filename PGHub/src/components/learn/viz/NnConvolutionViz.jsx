import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Grid3x3, Scan } from 'lucide-react';
import './NnConvolutionViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// 7x7 input "image": a bright square on a dark field, plus a diagonal, so different
// kernels yield visibly different feature maps. Deterministic, hand-authored.
const IMG = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 9, 9, 9, 0, 0, 0],
  [0, 9, 9, 9, 0, 0, 0],
  [0, 9, 9, 9, 9, 0, 0],
  [0, 0, 0, 9, 9, 9, 0],
  [0, 0, 0, 9, 9, 9, 0],
  [0, 0, 0, 0, 0, 0, 0],
];
const N = IMG.length;
const K = 3;
const OUT = N - K + 1; // 5

const KERNELS = {
  edgeV: { label: 'Vertical edge', m: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
  edgeH: { label: 'Horizontal edge', m: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
  blur: { label: 'Blur', m: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)) },
  sharpen: { label: 'Sharpen', m: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
};

function convolveAll(img, ker) {
  const out = [];
  for (let i = 0; i < OUT; i++) {
    const row = [];
    for (let j = 0; j < OUT; j++) {
      let s = 0;
      for (let m = 0; m < K; m++)
        for (let n = 0; n < K; n++) s += img[i + m][j + n] * ker[m][n];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

export default function NnConvolutionViz() {
  const [kerKey, setKerKey] = useState('edgeV');
  const [pos, setPos] = useState({ i: 0, j: 0 }); // top-left of the window in input coords

  const reset = () => { setKerKey('edgeV'); setPos({ i: 0, j: 0 }); };

  const ker = KERNELS[kerKey].m;
  const fmap = useMemo(() => convolveAll(IMG, ker), [ker]);

  const fmin = useMemo(() => Math.min(...fmap.flat()), [fmap]);
  const fmax = useMemo(() => Math.max(...fmap.flat()), [fmap]);

  const curVal = fmap[pos.i][pos.j];

  // dot-product terms for the current window
  const terms = useMemo(() => {
    const t = [];
    for (let m = 0; m < K; m++)
      for (let n = 0; n < K; n++) t.push({ img: IMG[pos.i + m][pos.j + n], k: ker[m][n] });
    return t;
  }, [pos, ker]);

  // SVG geometry
  const CELL = 30;
  const GAP = 2;
  const PAD = 18;
  const gridPx = (N * CELL) + ((N - 1) * GAP);
  const outPx = (OUT * CELL) + ((OUT - 1) * GAP);
  const VB_W = 560;
  const VB_H = Math.max(gridPx, outPx) + PAD * 2 + 26;
  const inputX = PAD;
  const outputX = VB_W - PAD - outPx;
  const topY = PAD + 22;

  const cellXY = (r, c, baseX) => ({
    x: baseX + c * (CELL + GAP),
    y: topY + r * (CELL + GAP),
  });

  const shade = (v) => {
    // input 0..9 -> brightness via hue-sky tint
    const t = Math.max(0, Math.min(1, v / 9));
    return `color-mix(in srgb, var(--hue-sky) ${Math.round(t * 80)}%, var(--bg))`;
  };
  const fshade = (v) => {
    // feature map: diverging, mint for positive, pink for negative
    if (fmax === fmin) return 'var(--surface)';
    if (v >= 0) {
      const t = fmax > 0 ? v / fmax : 0;
      return `color-mix(in srgb, var(--hue-mint) ${Math.round(t * 85)}%, var(--surface))`;
    }
    const t = fmin < 0 ? v / fmin : 0;
    return `color-mix(in srgb, var(--hue-pink) ${Math.round(t * 85)}%, var(--surface))`;
  };

  const move = (di, dj) => setPos((p) => ({
    i: Math.max(0, Math.min(OUT - 1, p.i + di)),
    j: Math.max(0, Math.min(OUT - 1, p.j + dj)),
  }));

  // window highlight rect over the input
  const winTL = cellXY(pos.i, pos.j, inputX);
  const winPx = (K * CELL) + ((K - 1) * GAP);
  // current output cell over the feature map
  const outTL = cellXY(pos.i, pos.j, outputX);

  const dotTex = terms
    .map((t) => `${t.img}{\\cdot}${t.k % 1 === 0 ? t.k : t.k.toFixed(2)}`)
    .join('+')
    .replace(/\+-/g, '-');

  return (
    <div className="ncv">
      <div className="ncv-head">
        <div className="ncv-head-icon"><Grid3x3 size={18} /></div>
        <div className="ncv-head-text">
          <h3 className="ncv-title">Convolution: slide a shared kernel, one dot product per feature-map cell</h3>
          <p className="ncv-sub">
            Drag the highlighted window (or use the arrows) across the input. Each position multiplies the kernel by the
            patch beneath it and sums &mdash; that single number becomes one cell of the feature map. Swap kernels to see
            different features emerge.
          </p>
        </div>
        <button type="button" className="ncv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="ncv-kernels">
        {Object.entries(KERNELS).map(([key, k]) => (
          <button key={key} type="button"
            className={`ncv-chip ${kerKey === key ? 'ncv-chip-on' : ''}`}
            onClick={() => setKerKey(key)}>{k.label}</button>
        ))}
        <div className="ncv-arrows">
          <button type="button" className="ncv-arrow" onClick={() => move(-1, 0)} aria-label="up">&uarr;</button>
          <button type="button" className="ncv-arrow" onClick={() => move(1, 0)} aria-label="down">&darr;</button>
          <button type="button" className="ncv-arrow" onClick={() => move(0, -1)} aria-label="left">&larr;</button>
          <button type="button" className="ncv-arrow" onClick={() => move(0, 1)} aria-label="right">&rarr;</button>
        </div>
      </div>

      <div className="ncv-stage">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="ncv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={inputX} y={PAD + 4} className="ncv-cap">input (7&times;7)</text>
          <text x={outputX} y={PAD + 4} className="ncv-cap">feature map (5&times;5)</text>

          {/* input grid */}
          {IMG.map((row, r) => row.map((v, c) => {
            const { x, y } = cellXY(r, c, inputX);
            const inWin = r >= pos.i && r < pos.i + K && c >= pos.j && c < pos.j + K;
            return (
              <g key={`i-${r}-${c}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx={4}
                  fill={shade(v)} className={`ncv-cell ${inWin ? 'ncv-cell-win' : ''}`} />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle"
                  className={`ncv-cnum ${v > 4 ? 'ncv-cnum-bright' : ''}`}>{v}</text>
              </g>
            );
          }))}

          {/* draggable window highlight */}
          <rect x={winTL.x - 2} y={winTL.y - 2} width={winPx + 4} height={winPx + 4} rx={6}
            className="ncv-window"
            onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              const svg = e.currentTarget.ownerSVGElement;
              const pt = svg.createSVGPoint();
              pt.x = e.clientX; pt.y = e.clientY;
              const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
              const c = Math.round((loc.x - inputX - winPx / 2) / (CELL + GAP));
              const r = Math.round((loc.y - topY - winPx / 2) / (CELL + GAP));
              setPos({
                i: Math.max(0, Math.min(OUT - 1, r)),
                j: Math.max(0, Math.min(OUT - 1, c)),
              });
            }}
          />

          {/* feature map grid */}
          {fmap.map((row, r) => row.map((v, c) => {
            const { x, y } = cellXY(r, c, outputX);
            const isCur = r === pos.i && c === pos.j;
            return (
              <g key={`o-${r}-${c}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx={4}
                  fill={fshade(v)} className={`ncv-fcell ${isCur ? 'ncv-fcell-cur' : ''}`} />
                <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle"
                  className="ncv-fnum">{v % 1 === 0 ? v : v.toFixed(1)}</text>
              </g>
            );
          }))}

          {/* current output cell pulse */}
          <rect x={outTL.x - 2} y={outTL.y - 2} width={CELL + 4} height={CELL + 4} rx={6} className="ncv-curcell" />
        </svg>
      </div>

      <div className="ncv-foot">
        <div className="ncv-kerbox">
          <span className="ncv-kerbox-cap"><Scan size={11} /> kernel</span>
          <div className="ncv-kergrid">
            {ker.map((row, r) => row.map((v, c) => (
              <span key={`k-${r}-${c}`} className="ncv-kercell">{v % 1 === 0 ? v : v.toFixed(2)}</span>
            )))}
          </div>
        </div>
        <div className="ncv-dot">
          <span className="ncv-dot-cap">dot product at window ({pos.i},{pos.j})</span>
          <span className="ncv-dot-math" dangerouslySetInnerHTML={{ __html: km(`${dotTex}=${curVal % 1 === 0 ? curVal : curVal.toFixed(2)}`) }} />
        </div>
        <div className="ncv-result">
          <span className="ncv-result-lab">feature-map cell</span>
          <span className="ncv-result-val">{curVal % 1 === 0 ? curVal : curVal.toFixed(2)}</span>
          <span className="ncv-result-hint">{curVal > 0 ? 'strong match' : curVal < 0 ? 'inverse match' : 'no match'}</span>
        </div>
      </div>
    </div>
  );
}
