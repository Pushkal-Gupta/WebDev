import React, { useMemo, useState } from 'react';
import { Layers, Crosshair, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import './MLViz.css';

const N_TOKENS = 8;
const N_LAYERS = 4;
const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat', '.', '<eos>'];
const SEED = 17;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLayerAttention(layerIdx, rng) {
  const m = Array.from({ length: N_TOKENS }, () => Array(N_TOKENS).fill(0));
  for (let i = 0; i < N_TOKENS; i++) {
    for (let j = 0; j < N_TOKENS; j++) {
      const distance = Math.abs(i - j);
      let v = Math.exp(-distance / (1.5 + layerIdx * 0.6));
      v += rng() * 0.18;
      if (i === j) v += 0.4;
      if (layerIdx >= 2 && j === 0) v += rng() * 0.35;
      if (layerIdx === N_LAYERS - 1 && j === N_TOKENS - 2) v += 0.25;
      m[i][j] = v;
    }
  }
  for (let i = 0; i < N_TOKENS; i++) {
    let row = 0;
    for (let j = 0; j < N_TOKENS; j++) row += m[i][j];
    for (let j = 0; j < N_TOKENS; j++) m[i][j] /= row;
  }
  return m;
}

function matMul(A, B) {
  const n = A.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      const a = A[i][k];
      if (!a) continue;
      for (let j = 0; j < n; j++) out[i][j] += a * B[k][j];
    }
  }
  return out;
}

function addResidualHalf(A) {
  const n = A.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out[i][j] = 0.5 * A[i][j] + (i === j ? 0.5 : 0);
    }
  }
  return out;
}

function rowMax(M) {
  return M.map((row) => row.reduce((m, v) => (v > m ? v : m), 0));
}

export default function AttentionRolloutViz() {
  const [target, setTarget] = useState(N_TOKENS - 1);
  const [useResidual, setUseResidual] = useState(true);

  const layers = useMemo(() => {
    const rng = mulberry32(SEED);
    return Array.from({ length: N_LAYERS }, (_, l) => buildLayerAttention(l, rng));
  }, []);

  const rollout = useMemo(() => {
    const transformed = useResidual ? layers.map(addResidualHalf) : layers;
    let R = transformed[0];
    for (let l = 1; l < transformed.length; l++) R = matMul(transformed[l], R);
    return R;
  }, [layers, useResidual]);

  const targetRow = rollout[target];
  const maxAtt = Math.max(...targetRow);
  const maxInputIdx = targetRow.indexOf(maxAtt);

  const W = 720;
  const H = 480;
  const layerW = 130;
  const layerH = 130;
  const layerGap = (W - 40 - layerW * N_LAYERS) / (N_LAYERS - 1);
  const cellW = layerW / N_TOKENS;
  const cellH = layerH / N_TOKENS;
  const rolloutSize = 240;
  const rolloutX = (W - rolloutSize) / 2;
  const rolloutY = 200;
  const rcell = rolloutSize / N_TOKENS;

  const heat = (v, max) => {
    if (!max) return 0;
    return Math.min(1, v / max);
  };

  const reset = () => {
    setTarget(N_TOKENS - 1);
    setUseResidual(true);
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto' }}>
          <text x={W / 2} y={18} fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.08em">
            PER-LAYER ATTENTION → CUMULATIVE ROLLOUT
          </text>

          {layers.map((M, l) => {
            const x = 20 + l * (layerW + layerGap);
            const y = 36;
            const maxVal = Math.max(...M.flat());
            return (
              <g key={`l${l}`}>
                <text x={x + layerW / 2} y={y - 6} fontFamily="var(--mono)" fontSize="10" fill="var(--text-dim)" textAnchor="middle">
                  Layer {l + 1}
                </text>
                <rect x={x} y={y} width={layerW} height={layerH} fill="none" stroke="var(--border)" strokeWidth="1" rx="3" />
                {M.flatMap((row, i) =>
                  row.map((v, j) => (
                    <rect
                      key={`${l}-${i}-${j}`}
                      x={x + j * cellW}
                      y={y + i * cellH}
                      width={cellW}
                      height={cellH}
                      fill={`rgba(var(--accent-rgb), ${heat(v, maxVal) * 0.9 + 0.05})`}
                    />
                  ))
                )}
              </g>
            );
          })}

          <line x1={W / 2} y1={172} x2={W / 2} y2={195} stroke="var(--text-dim)" strokeWidth="1" markerEnd="url(#aroll-arrow)" />
          <defs>
            <marker id="aroll-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          <text x={rolloutX + rolloutSize / 2} y={rolloutY - 8} fontFamily="var(--mono)" fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">
            Rollout R = {useResidual ? '½(A+I)' : 'A'}<tspan baselineShift="super" fontSize="8">{N_LAYERS}</tspan> · … · {useResidual ? '½(A+I)' : 'A'}<tspan baselineShift="super" fontSize="8">1</tspan>
          </text>

          <rect x={rolloutX} y={rolloutY} width={rolloutSize} height={rolloutSize} fill="none" stroke="var(--border)" strokeWidth="1" rx="3" />
          {rollout.flatMap((row, i) => {
            const maxRow = Math.max(...row);
            return row.map((v, j) => (
              <rect
                key={`r-${i}-${j}`}
                x={rolloutX + j * rcell}
                y={rolloutY + i * rcell}
                width={rcell}
                height={rcell}
                fill={`rgba(var(--accent-rgb), ${heat(v, maxRow) * 0.9 + 0.05})`}
                stroke={i === target ? 'var(--hue-pink)' : 'none'}
                strokeWidth={i === target ? 2 : 0}
                style={{ transition: 'fill 0.18s' }}
              />
            ));
          })}

          {TOKENS.map((t, i) => (
            <text
              key={`tl-${i}`}
              x={rolloutX - 6}
              y={rolloutY + i * rcell + rcell / 2 + 4}
              fontFamily="var(--mono)"
              fontSize="10"
              fill={i === target ? 'var(--hue-pink)' : 'var(--text-dim)'}
              textAnchor="end"
              fontWeight={i === target ? 700 : 400}
            >
              {t}
            </text>
          ))}
          {TOKENS.map((t, j) => (
            <text
              key={`tt-${j}`}
              x={rolloutX + j * rcell + rcell / 2}
              y={rolloutY + rolloutSize + 14}
              fontFamily="var(--mono)"
              fontSize="10"
              fill={j === maxInputIdx ? 'var(--accent)' : 'var(--text-dim)'}
              textAnchor="middle"
              fontWeight={j === maxInputIdx ? 700 : 400}
            >
              {t}
            </text>
          ))}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
          <span><Crosshair size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />target = <strong style={{ color: 'var(--hue-pink)' }}>{TOKENS[target]}</strong></span>
          <span>top input = <strong style={{ color: 'var(--accent)' }}>{TOKENS[maxInputIdx]}</strong></span>
          <span>max attention = <strong>{maxAtt.toFixed(3)}</strong></span>
          <span style={{ color: 'var(--text-dim)' }}>row Σ = {targetRow.reduce((a, b) => a + b, 0).toFixed(3)}</span>
        </div>
      </div>

      <div className="mlviz-controls">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <Layers size={13} />
          target token
          <input
            type="range"
            min={0}
            max={N_TOKENS - 1}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            style={{ width: 160, accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--text-main)', minWidth: '4ch' }}>{TOKENS[target]}</span>
        </label>
        <button
          type="button"
          className="mlviz-btn"
          onClick={() => setUseResidual((v) => !v)}
          title="Toggle residual ½(A+I)"
        >
          {useResidual ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          residual ½(A+I): {useResidual ? 'on' : 'off'}
        </button>
        <button type="button" className="mlviz-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
