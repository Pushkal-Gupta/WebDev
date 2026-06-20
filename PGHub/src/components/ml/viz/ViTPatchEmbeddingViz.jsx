import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 380;
const IMG = 168;
const IMG_X = 32;
const IMG_Y = 70;
const SEQ_Y = 300;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

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

// deterministic per-patch hue weight so each patch reads as a distinct cell
function patchTone(r, c, grid) {
  const rand = mulberry32(1009 + r * 31 + c * 7 + grid * 101);
  return 0.22 + rand() * 0.5;
}

const HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

export default function ViTPatchEmbeddingViz() {
  // grid = patches per side; image is fixed 168px, patchSize = IMG / grid
  const [grid, setGrid] = useState(4);
  const [dim, setDim] = useState(8);
  const [hoverIdx, setHoverIdx] = useState(-1);

  const nPatches = grid * grid;
  const seqLen = nPatches + 1; // + [CLS]
  const patchPx = Math.round(IMG / grid);
  const cell = IMG / grid;

  // embedding vectors are deterministic from patch index + hue weight
  const embeddings = useMemo(() => {
    const out = [];
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const rand = mulberry32(7 + r * 53 + c * 17 + grid * 211 + dim * 3);
        const vec = [];
        for (let k = 0; k < dim; k++) vec.push(rand() * 2 - 1);
        out.push({ r, c, vec, tone: patchTone(r, c, grid) });
      }
    }
    return out;
  }, [grid, dim]);

  // sequence token layout (CLS + patches), packed to fit width with no scroll
  const seqCount = seqLen;
  const seqGap = 3;
  const seqAvail = W - 24 - 36; // leave room for CLS label + margins
  const tokW = Math.min(26, (seqAvail - seqGap * (seqCount - 1)) / seqCount);
  const seqX0 = 30;

  // patch grid pixel geometry
  const lines = [];
  for (let i = 1; i < grid; i++) {
    lines.push(i * cell);
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '840px' }}
        >
          <text x={IMG_X} y={IMG_Y - 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            INPUT IMAGE · split into {grid}×{grid} = {nPatches} patches ({patchPx}px each)
          </text>

          {/* image patch grid */}
          <g transform={`translate(${IMG_X},${IMG_Y})`}>
            <rect x="0" y="0" width={IMG} height={IMG} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" rx="3" />
            {embeddings.map((p, i) => {
              const isHover = i === hoverIdx;
              return (
                <rect
                  key={`pp-${i}`}
                  x={p.c * cell + 1}
                  y={p.r * cell + 1}
                  width={cell - 2}
                  height={cell - 2}
                  fill={HUES[(p.r + p.c) % HUES.length]}
                  opacity={isHover ? 0.92 : p.tone}
                  stroke={isHover ? 'var(--accent)' : 'transparent'}
                  strokeWidth={isHover ? 1.6 : 0}
                  rx="2"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(-1)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
            {lines.map((p) => (
              <g key={`gl-${p}`}>
                <line x1={p} y1="0" x2={p} y2={IMG} stroke="var(--bg)" strokeWidth="0.8" opacity="0.5" />
                <line x1="0" y1={p} x2={IMG} y2={p} stroke="var(--bg)" strokeWidth="0.8" opacity="0.5" />
              </g>
            ))}
          </g>

          {/* flatten arrow */}
          <text x={IMG_X + IMG + 22} y={IMG_Y + 20} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            linear projection
          </text>
          <text x={IMG_X + IMG + 22} y={IMG_Y + 34} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            each patch → {dim}-d vector
          </text>
          <text x={IMG_X + IMG + 22} y={IMG_Y + 56} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
            + position index 0…{nPatches - 1}
          </text>
          <text x={IMG_X + IMG + 22} y={IMG_Y + 70} fontSize="8.5" fill="var(--accent)" fontFamily="var(--mono)">
            prepend [CLS] token
          </text>

          {/* hovered patch embedding readout */}
          {hoverIdx >= 0 && (
            <g transform={`translate(${IMG_X + IMG + 22},${IMG_Y + 90})`}>
              <text x="0" y="0" fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
                patch (r{embeddings[hoverIdx].r}, c{embeddings[hoverIdx].c}) embedding:
              </text>
              {embeddings[hoverIdx].vec.map((v, k) => (
                <rect
                  key={`ev-${k}`}
                  x={k * 12}
                  y={6}
                  width={10}
                  height={26}
                  fill={v >= 0 ? 'var(--hue-sky)' : 'var(--hue-pink)'}
                  opacity={0.35 + Math.min(0.6, Math.abs(v) * 0.6)}
                  rx="1.5"
                />
              ))}
            </g>
          )}

          {/* sequence row */}
          <text x={seqX0} y={SEQ_Y - 14} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            TOKEN SEQUENCE INTO ENCODER · length = {seqLen} ({nPatches} patches + 1 [CLS])
          </text>
          {Array.from({ length: seqCount }).map((_, i) => {
            const isCls = i === 0;
            const x = seqX0 + i * (tokW + seqGap);
            const emb = isCls ? null : embeddings[i - 1];
            const hov = !isCls && i - 1 === hoverIdx;
            return (
              <g key={`tok-${i}`}>
                <rect
                  x={x}
                  y={SEQ_Y}
                  width={tokW}
                  height={30}
                  rx="3"
                  fill={isCls ? 'var(--accent)' : HUES[emb ? (emb.r + emb.c) % HUES.length : 0]}
                  opacity={isCls ? 0.85 : hov ? 0.95 : emb ? emb.tone : 0.4}
                  stroke={hov ? 'var(--accent)' : 'transparent'}
                  strokeWidth={hov ? 1.4 : 0}
                  onMouseEnter={() => !isCls && setHoverIdx(i - 1)}
                  onMouseLeave={() => setHoverIdx(-1)}
                  style={{ cursor: isCls ? 'default' : 'pointer' }}
                />
                {tokW >= 14 && (
                  <text
                    x={x + tokW / 2}
                    y={SEQ_Y + 44}
                    fontSize="6.5"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {isCls ? 'CLS' : i - 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">patches/side</span>
          <input type="range" min="2" max="8" step="1" value={grid} onChange={(e) => setGrid(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{grid}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">embed dim</span>
          <input type="range" min="4" max="12" step="1" value={dim} onChange={(e) => setDim(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{dim}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">patch px</span>
            <span className="mlviz-val">{patchPx} × {patchPx}</span>
            <span className="mlviz-sub">smaller patches = finer detail, longer sequence</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">seq len</span>
            <span className="mlviz-val">{nPatches} + 1 = {seqLen} tokens</span>
            <span className="mlviz-sub">attention cost grows as O(seq²) = {snap(seqLen * seqLen / 1000, 2)}k</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">attn²</span>
            <span className="mlviz-val">{seqLen * seqLen} pairwise scores</span>
            <span className="mlviz-sub">halving patch size ≈ 4× the patches ≈ 16× attention work</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => { setGrid(4); setDim(8); setHoverIdx(-1); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          hover a patch to see its embedding vector · the [CLS] token aggregates all patches and feeds the classifier head
        </div>
      </div>
    </div>
  );
}
