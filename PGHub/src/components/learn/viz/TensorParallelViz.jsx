import React, { useMemo, useState } from 'react';
import { Cpu, Layers } from 'lucide-react';
import './TensorParallelViz.css';

const N_OPTIONS = [1, 2, 4, 8];

export default function TensorParallelViz() {
  const [n, setN] = useState(2);
  const [stage, setStage] = useState('all'); // all | gpu0 view focus

  const h = 8192; // hidden dim
  const ffn = 4 * h;
  const fullParams = (h * ffn + ffn * h); // two linears
  const perGpu = fullParams / n;
  const bytesGB = (p) => (p * 2) / 1e9; // bf16

  const W = 920;
  const H = 420;
  const colW = Math.min(150, (W - 120) / Math.min(n, 4));
  const lanes = Math.min(n, 4); // draw up to 4 lanes, label rest as "…"
  const startX = (W - lanes * colW - (lanes - 1) * 20) / 2;

  // vertical block stack per lane: x -> col-parallel W1 -> GELU -> row-parallel W2 -> partial
  const blocks = useMemo(() => ([
    { key: 'in', label: 'x (b × h)', sub: 'replicated input', hue: 'var(--text-dim)' },
    { key: 'col', label: `col-parallel W1ᵢ`, sub: `h × ${(ffn / n / 1000).toFixed(0)}k shard`, hue: 'var(--accent)' },
    { key: 'gelu', label: 'GELU', sub: 'elementwise · no comm', hue: 'var(--hue-sky)' },
    { key: 'row', label: 'row-parallel W2ᵢ', sub: `${(ffn / n / 1000).toFixed(0)}k × h shard`, hue: 'var(--hue-violet)' },
    { key: 'partial', label: 'yᵢ (partial)', sub: 'b × h, half-summed', hue: 'var(--warning)' },
  ]), [n, ffn]);

  const blockH = 50;
  const vGap = 24;
  const topY = 50;

  return (
    <div className="tpvw">
      <div className="tpvw-head">
        <h3 className="tpvw-title"><Cpu size={18} className="tpvw-ticon" /> Tensor parallelism — one MLP block, sharded N ways</h3>
        <p className="tpvw-sub">
          Column-parallel the first linear, keep activations sharded through GELU, row-parallel the second, then one all-reduce sums the partials. Slide N and watch the largest layer — and its memory — get divided across GPUs.
        </p>
      </div>

      <div className="tpvw-controls">
        <label className="tpvw-slider">
          <span className="tpvw-slider-label"><Layers size={13} /> tensor-parallel size N</span>
          <input type="range" min={0} max={3} step={1} value={N_OPTIONS.indexOf(n)} onChange={(e) => setN(N_OPTIONS[Number(e.target.value)])} className="tpvw-range" />
          <span className="tpvw-slider-value">N = {n}</span>
        </label>
        <div className="tpvw-toggle">
          <button type="button" className={`tpvw-tg ${stage === 'all' ? 'tpvw-tg-on' : ''}`} onClick={() => setStage('all')}>all GPUs</button>
          <button type="button" className={`tpvw-tg ${stage === 'one' ? 'tpvw-tg-on' : ''}`} onClick={() => setStage('one')}>one GPU</button>
        </div>
      </div>

      <div className="tpvw-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpvw-svg" preserveAspectRatio="xMidYMid meet">
          <text x={W / 2} y={26} className="tpvw-flowlbl" style={{ textAnchor: 'middle' }}>data flows top → bottom · {n === 1 ? 'single GPU' : `${n} tensor-parallel ranks`}</text>

          {Array.from({ length: lanes }).map((_, lane) => {
            const x = startX + lane * (colW + 20);
            const dim = stage === 'one' && lane !== 0;
            return (
              <g key={`lane-${lane}`} opacity={dim ? 0.28 : 1}>
                <text x={x + colW / 2} y={topY - 14} className="tpvw-gpulbl" style={{ textAnchor: 'middle' }}>GPU {lane}</text>
                {blocks.map((b, bi) => {
                  const y = topY + bi * (blockH + vGap);
                  const sharded = b.key === 'col' || b.key === 'gelu' || b.key === 'row' || b.key === 'partial';
                  return (
                    <g key={b.key}>
                      {bi > 0 && (
                        <line x1={x + colW / 2} y1={y - vGap} x2={x + colW / 2} y2={y}
                          stroke="var(--text-dim)" strokeWidth={1.6} markerEnd={`url(#tpvw-arrow)`} />
                      )}
                      <rect x={x} y={y} width={colW} height={blockH} rx={7}
                        fill={n > 1 && sharded ? 'rgba(var(--accent-rgb),0.1)' : 'var(--surface)'}
                        stroke={b.hue} strokeWidth={1.8} />
                      <text x={x + colW / 2} y={y + 20} className="tpvw-blbl" style={{ textAnchor: 'middle' }}>{b.label}</text>
                      <text x={x + colW / 2} y={y + 37} className="tpvw-bsub" style={{ textAnchor: 'middle' }}>{b.sub}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {n > 3 && (
            <text x={startX + lanes * (colW + 20) - 8} y={topY + 2 * (blockH + vGap)} className="tpvw-more">… ×{n}</text>
          )}

          {/* all-reduce bar joining partials */}
          {n > 1 && (() => {
            const y = topY + blocks.length * (blockH + vGap) + 4;
            const x0 = startX;
            const x1 = startX + lanes * (colW + 20) - 20;
            return (
              <g>
                {Array.from({ length: lanes }).map((_, lane) => {
                  const cx = startX + lane * (colW + 20) + colW / 2;
                  return <line key={`ar-${lane}`} x1={cx} y1={y - 26} x2={(x0 + x1) / 2} y2={y + 8} stroke="var(--easy)" strokeWidth={1.6} opacity={0.7} />;
                })}
                <rect x={(x0 + x1) / 2 - 110} y={y + 8} width={220} height={34} rx={8} fill="rgba(var(--accent-rgb),0.14)" stroke="var(--easy)" strokeWidth={1.8} />
                <text x={(x0 + x1) / 2} y={y + 30} className="tpvw-ar" style={{ textAnchor: 'middle' }}>all-reduce(SUM) → y (full, b × h)</text>
              </g>
            );
          })()}

          <defs>
            <marker id="tpvw-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="tpvw-metrics">
        <div className="tpvw-metric"><span className="tpvw-metric-label">params / GPU</span><span className="tpvw-metric-value">{(perGpu / 1e9).toFixed(2)} B</span></div>
        <div className="tpvw-metric"><span className="tpvw-metric-label">weight mem / GPU</span><span className="tpvw-metric-value">{bytesGB(perGpu).toFixed(1)} GB</span></div>
        <div className="tpvw-metric"><span className="tpvw-metric-label">all-reduces / block</span><span className="tpvw-metric-value">{n > 1 ? '1 fwd + 1 bwd' : '0'}</span></div>
        <div className="tpvw-metric tpvw-metric-dim"><span className="tpvw-metric-label">comm size</span><span className="tpvw-metric-value tpvw-metric-dimval">{n > 1 ? 'b × h per dir' : 'none'}</span></div>
      </div>

      <div className="tpvw-trace">
        <span className="tpvw-trace-label">the win</span>
        <span className="tpvw-trace-val">
          {n === 1
            ? 'N=1: the whole MLP lives on one GPU. The 4h-wide intermediate is fully materialized — fine until the matrices outgrow a single device.'
            : `N=${n}: each GPU holds 1/${n} of W1 and W2. Activations stay half-width between the column- and row-parallel linears, so the b×4h intermediate is never materialized in full anywhere — that is the memory win. Cost: one all-reduce of size b×h per forward and per backward.`}
        </span>
      </div>
    </div>
  );
}
