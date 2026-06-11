import React, { useMemo, useState } from 'react';
import { Sliders, Image as ImageIcon, Grid3x3 } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * VisionTransformerPatchViz
 *
 * Reproduces the ViT input pipeline:
 *   image (H x W pixels) -> P x P patches -> flatten to vectors
 *     -> linear projection W_E -> token embeddings -> +pos embedding -> sequence
 *
 * - 9x9 image with deterministic mulberry32 colors mapped to hue tokens.
 * - patch size slider (1..5); only patch sizes that evenly divide 9
 *   are usable for a clean grid (1, 3, 9). For other values we still divide
 *   floor-style and show the leftover crop as faint.
 * - Each patch becomes a token: visible flatten arrow + projection box.
 * - Live readout: # patches, embedding dim, sequence length.
 *
 * Embedding dim is fixed at D=8 (visualized as 8 small chips per token).
 */

const W = 720;
const H = 360;
const IMG_SIZE = 9;
const PIXEL = 22;
const D_EMBED = 8;
const SEED = 17;

// Layout regions
const PAD = 18;
const IMG_X = PAD + 4;
const IMG_Y = 38;
const IMG_W = IMG_SIZE * PIXEL;
const IMG_H = IMG_SIZE * PIXEL;

const PROJ_X = IMG_X + IMG_W + 56;
const PROJ_Y = IMG_Y;
const PROJ_W = 80;
const PROJ_H = IMG_H;

const SEQ_X = PROJ_X + PROJ_W + 36;
const SEQ_Y = IMG_Y;
const SEQ_W = W - SEQ_X - PAD;

const HUE_TOKENS = ['var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--hue-violet)'];

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

export default function VisionTransformerPatchViz() {
  const [patchSize, setPatchSize] = useState(3);

  // Deterministic image as a 2D array of indices into HUE_TOKENS plus an alpha.
  const rng = useMemo(() => mulberry32(SEED), []);
  const pixels = useMemo(() => {
    const r = mulberry32(SEED);
    const grid = [];
    for (let y = 0; y < IMG_SIZE; y++) {
      const row = [];
      for (let x = 0; x < IMG_SIZE; x++) {
        const hue = Math.floor(r() * HUE_TOKENS.length);
        const alpha = 0.35 + r() * 0.55;
        row.push({ hue, alpha });
      }
      grid.push(row);
    }
    return grid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rng]);

  const P = Math.max(1, Math.min(5, patchSize));
  const nPatchesPerSide = Math.floor(IMG_SIZE / P);
  const nPatches = nPatchesPerSide * nPatchesPerSide;
  const seqLen = nPatches + 1; // +1 for [CLS]
  const flatDim = P * P * 3; // RGB-ish, illustrative
  const usedW = nPatchesPerSide * P;
  const cropX = IMG_X + usedW * PIXEL;
  const cropW = (IMG_SIZE - usedW) * PIXEL;

  // Compute average color per patch (averaging hue indices is illustrative)
  const patches = useMemo(() => {
    const out = [];
    for (let py = 0; py < nPatchesPerSide; py++) {
      for (let px = 0; px < nPatchesPerSide; px++) {
        const cells = [];
        let sumHue = 0;
        let sumAlpha = 0;
        for (let dy = 0; dy < P; dy++) {
          for (let dx = 0; dx < P; dx++) {
            const c = pixels[py * P + dy][px * P + dx];
            cells.push(c);
            sumHue += c.hue;
            sumAlpha += c.alpha;
          }
        }
        const meanHue = Math.round(sumHue / cells.length) % HUE_TOKENS.length;
        const meanAlpha = sumAlpha / cells.length;
        out.push({ py, px, cells, meanHue, meanAlpha });
      }
    }
    return out;
  }, [pixels, nPatchesPerSide, P]);

  // Token chip layout in sequence panel
  const tokenH = 30;
  const tokenGap = 6;
  const maxTokens = Math.floor((PROJ_H + tokenGap) / (tokenH + tokenGap));
  const visibleTokens = Math.min(seqLen, maxTokens);
  const tokenW = SEQ_W;
  const chipW = (tokenW - 56) / D_EMBED;

  const tokenLabels = useMemo(() => {
    const labels = ['[CLS]'];
    for (let i = 0; i < nPatches; i++) labels.push(`p${i + 1}`);
    return labels;
  }, [nPatches]);

  // Deterministic per-token chip intensities so we can render a fake embedding
  const chipVals = useMemo(() => {
    const r = mulberry32(SEED + 1 + P);
    const arr = [];
    for (let i = 0; i < seqLen; i++) {
      const row = [];
      for (let j = 0; j < D_EMBED; j++) row.push(r());
      arr.push(row);
    }
    return arr;
  }, [seqLen, P]);

  const formulaHtml = useMemo(
    () => katexHtml('z_0 = [\\,x_{\\text{cls}};\\,x_1 W_E;\\,\\dots;\\,x_N W_E\\,] + E_{\\text{pos}}', false),
    []
  );

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* image label */}
          <text
            x={IMG_X}
            y={IMG_Y - 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            IMAGE  {IMG_SIZE}×{IMG_SIZE}
          </text>

          {/* image frame */}
          <rect
            x={IMG_X - 4}
            y={IMG_Y - 4}
            width={IMG_W + 8}
            height={IMG_H + 8}
            rx="6"
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* pixels */}
          {pixels.map((row, y) =>
            row.map((c, x) => {
              const px = IMG_X + x * PIXEL;
              const py = IMG_Y + y * PIXEL;
              const inUsed = x < usedW && y < usedW;
              return (
                <rect
                  key={`${x}-${y}`}
                  x={px}
                  y={py}
                  width={PIXEL}
                  height={PIXEL}
                  fill={HUE_TOKENS[c.hue]}
                  opacity={inUsed ? c.alpha : c.alpha * 0.35}
                  stroke="var(--bg)"
                  strokeWidth="0.6"
                />
              );
            })
          )}

          {/* patch grid overlay */}
          {Array.from({ length: nPatchesPerSide + 1 }).map((_, i) => {
            const x = IMG_X + i * P * PIXEL;
            const y = IMG_Y + i * P * PIXEL;
            return (
              <g key={`g-${i}`}>
                <line
                  x1={x}
                  y1={IMG_Y}
                  x2={x}
                  y2={IMG_Y + usedW * PIXEL}
                  stroke="var(--accent)"
                  strokeWidth="1.3"
                  opacity="0.85"
                />
                <line
                  x1={IMG_X}
                  y1={y}
                  x2={IMG_X + usedW * PIXEL}
                  y2={y}
                  stroke="var(--accent)"
                  strokeWidth="1.3"
                  opacity="0.85"
                />
              </g>
            );
          })}

          {/* crop hint when patch size doesn't divide evenly */}
          {cropW > 0 && (
            <g>
              <rect
                x={cropX}
                y={IMG_Y}
                width={cropW}
                height={IMG_H}
                fill="var(--border)"
                opacity="0.15"
              />
              <rect
                x={IMG_X}
                y={IMG_Y + usedW * PIXEL}
                width={usedW * PIXEL}
                height={IMG_H - usedW * PIXEL}
                fill="var(--border)"
                opacity="0.15"
              />
            </g>
          )}

          {/* projection box */}
          <text
            x={PROJ_X}
            y={PROJ_Y - 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            FLATTEN · W_E
          </text>
          <rect
            x={PROJ_X}
            y={PROJ_Y}
            width={PROJ_W}
            height={PROJ_H}
            rx="6"
            fill="var(--bg)"
            stroke="var(--accent)"
            strokeWidth="1.2"
            opacity="0.95"
          />
          <text
            x={PROJ_X + PROJ_W / 2}
            y={PROJ_Y + PROJ_H / 2 - 8}
            fontSize="11"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            fontWeight="700"
          >
            P²·C → D
          </text>
          <text
            x={PROJ_X + PROJ_W / 2}
            y={PROJ_Y + PROJ_H / 2 + 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
          >
            {flatDim} → {D_EMBED}
          </text>

          {/* arrow image → projection */}
          <line
            x1={IMG_X + IMG_W + 4}
            y1={IMG_Y + IMG_H / 2}
            x2={PROJ_X - 4}
            y2={PROJ_Y + PROJ_H / 2}
            stroke="var(--accent)"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            markerEnd="url(#vtp-arrow)"
            opacity="0.8"
          />

          {/* arrow projection → sequence */}
          <line
            x1={PROJ_X + PROJ_W + 4}
            y1={PROJ_Y + PROJ_H / 2}
            x2={SEQ_X - 4}
            y2={SEQ_Y + PROJ_H / 2}
            stroke="var(--accent)"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            markerEnd="url(#vtp-arrow)"
            opacity="0.8"
          />

          <defs>
            <marker
              id="vtp-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" opacity="0.85" />
            </marker>
          </defs>

          {/* sequence */}
          <text
            x={SEQ_X}
            y={SEQ_Y - 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            TOKEN SEQUENCE  z₀  (N+1 = {seqLen})
          </text>

          {Array.from({ length: visibleTokens }).map((_, idx) => {
            const ty = SEQ_Y + idx * (tokenH + tokenGap);
            const isCls = idx === 0;
            const label = tokenLabels[idx];
            const vals = chipVals[idx];
            return (
              <g key={idx}>
                <rect
                  x={SEQ_X}
                  y={ty}
                  width={tokenW}
                  height={tokenH}
                  rx="5"
                  fill={isCls ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg)'}
                  stroke={isCls ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth="1"
                />
                <text
                  x={SEQ_X + 8}
                  y={ty + tokenH / 2 + 4}
                  fontSize="10"
                  fill={isCls ? 'var(--accent)' : 'var(--text-main)'}
                  fontFamily="var(--mono)"
                  fontWeight={isCls ? 700 : 500}
                >
                  {label}
                </text>
                {vals.map((v, j) => {
                  const cx = SEQ_X + 50 + j * chipW;
                  return (
                    <rect
                      key={j}
                      x={cx + 1}
                      y={ty + 5}
                      width={chipW - 2}
                      height={tokenH - 10}
                      rx="2"
                      fill="var(--hue-sky)"
                      opacity={0.15 + v * 0.7}
                    />
                  );
                })}
                <text
                  x={SEQ_X + tokenW - 6}
                  y={ty + tokenH / 2 + 4}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  +E_pos[{idx}]
                </text>
              </g>
            );
          })}

          {visibleTokens < seqLen && (
            <text
              x={SEQ_X + tokenW / 2}
              y={SEQ_Y + visibleTokens * (tokenH + tokenGap) + 8}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              … +{seqLen - visibleTokens} more
            </text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              patch size P
            </span>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={patchSize}
              onChange={(e) => setPatchSize(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{patchSize}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <ImageIcon size={11} style={{ color: 'var(--text-dim)' }} />
            <span className="mlviz-sub">grid</span>
            <span className="mlviz-val">{nPatchesPerSide}×{nPatchesPerSide}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Grid3x3 size={11} style={{ color: 'var(--text-dim)' }} />
            <span className="mlviz-sub"># patches N</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{nPatches}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">embed dim D</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{D_EMBED}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">seq len</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {seqLen}
            </span>
            <span className="mlviz-sub">= N+1</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.2rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.82rem' }}
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
        </div>

        <div className="mlviz-hint">
          image → P×P patches → flatten → linear project to D=8 → prepend [CLS] → add position
        </div>
      </div>
    </div>
  );
}
