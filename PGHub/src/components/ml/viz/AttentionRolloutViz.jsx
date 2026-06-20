import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Crosshair, RotateCcw, ToggleLeft, ToggleRight, Play, Pause } from 'lucide-react';
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

function lerpMatrix(A, B, t) {
  const n = A.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out[i][j] = A[i][j] + (B[i][j] - A[i][j]) * t;
  return out;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);
  return reduced;
}

export default function AttentionRolloutViz() {
  const [target, setTarget] = useState(N_TOKENS - 1);
  const [useResidual, setUseResidual] = useState(true);
  // `prog`: 0 = only layer 1 absorbed; goes up to N_LAYERS-1 as deeper layers fold in.
  const [prog, setProg] = useState(N_LAYERS - 1);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const rafRef = useRef(null);
  const lastRef = useRef(null);

  const layers = useMemo(() => {
    const rng = mulberry32(SEED);
    return Array.from({ length: N_LAYERS }, (_, l) => buildLayerAttention(l, rng));
  }, []);

  const transformed = useMemo(
    () => (useResidual ? layers.map(addResidualHalf) : layers),
    [layers, useResidual]
  );

  // Cumulative rollout up to a (possibly fractional) depth. The fractional part
  // smoothly blends the next layer's contribution in, so cells animate.
  const rollout = useMemo(() => {
    const full = Math.floor(prog);
    const frac = prog - full;
    let R = transformed[0];
    for (let l = 1; l <= full && l < transformed.length; l++) R = matMul(transformed[l], R);
    if (frac > 0 && full + 1 < transformed.length) {
      const Rnext = matMul(transformed[full + 1], R);
      R = lerpMatrix(R, Rnext, easeInOut(frac));
    }
    return R;
  }, [transformed, prog]);

  const depthAbsorbed = Math.round(prog) + 1; // number of layers folded in (1..N_LAYERS)

  const targetRow = rollout[target];
  const maxAtt = Math.max(...targetRow);
  const maxInputIdx = targetRow.indexOf(maxAtt);

  // Auto-play: roll deeper layers in one by one.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
      return undefined;
    }
    if (reduced) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setProg(N_LAYERS - 1);
      setPlaying(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined;
    }
    const SPEED = 0.7; // layers per second
    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setProg((p) => {
        const next = p + dt * SPEED;
        if (next >= N_LAYERS - 1) {
          setPlaying(false);
          return N_LAYERS - 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [playing, reduced]);

  // ---- VERTICAL layout: layers stacked top-to-bottom, rollout at the bottom ----
  const W = 560;
  const H = 620;
  const layerSize = 86;
  const layerX = (W - layerSize) / 2;
  const topY = 40;
  const vGap = 38;
  const lcell = layerSize / N_TOKENS;
  const rolloutSize = 260;
  const rolloutX = (W - rolloutSize) / 2;
  const rolloutY = topY + N_LAYERS * (layerSize + vGap) + 30;
  const rcell = rolloutSize / N_TOKENS;

  const heat = (v, max) => {
    if (!max) return 0;
    return Math.min(1, v / max);
  };

  const reset = () => {
    setPlaying(false);
    setTarget(N_TOKENS - 1);
    setUseResidual(true);
    setProg(N_LAYERS - 1);
  };

  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (Math.round(prog) >= N_LAYERS - 1) setProg(0);
    setPlaying(true);
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 480, width: '100%', height: 'auto' }}>
          <defs>
            <marker id="aroll-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="aroll-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>

          <text x={W / 2} y={20} fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.08em">
            PER-LAYER ATTENTION  ·  FOLDED DOWNWARD INTO ROLLOUT
          </text>

          {/* Vertical stack of layer matrices, flowing top-to-bottom */}
          {layers.map((M, l) => {
            const y = topY + l * (layerSize + vGap);
            const maxVal = Math.max(...M.flat());
            const absorbed = l < depthAbsorbed;
            return (
              <g key={`l${l}`}>
                <text x={layerX - 12} y={y + layerSize / 2 + 4} fontFamily="var(--mono)" fontSize="10" fill={absorbed ? 'var(--accent)' : 'var(--text-dim)'} textAnchor="end" fontWeight={absorbed ? 700 : 400}>
                  L{l + 1}
                </text>
                <rect
                  x={layerX} y={y} width={layerSize} height={layerSize}
                  fill="none"
                  stroke={absorbed ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={absorbed ? 1.4 : 1}
                  rx="3"
                  style={{ transition: reduced ? 'none' : 'stroke 0.25s ease' }}
                />
                {M.flatMap((row, i) =>
                  row.map((v, j) => (
                    <rect
                      key={`${l}-${i}-${j}`}
                      x={layerX + j * lcell}
                      y={y + i * lcell}
                      width={lcell}
                      height={lcell}
                      fill={`rgba(var(--accent-rgb), ${heat(v, maxVal) * (absorbed ? 0.9 : 0.45) + 0.04})`}
                      style={{ transition: reduced ? 'none' : 'fill 0.25s ease' }}
                    />
                  ))
                )}
                {/* downward connector arrow into the next layer (or rollout) */}
                <line
                  x1={W / 2}
                  y1={y + layerSize + 4}
                  x2={W / 2}
                  y2={y + layerSize + vGap - 4}
                  stroke={absorbed ? 'var(--accent)' : 'var(--text-dim)'}
                  strokeWidth={absorbed ? 1.4 : 1}
                  markerEnd={`url(#aroll-arrow${absorbed ? '-on' : ''})`}
                  style={{ transition: reduced ? 'none' : 'stroke 0.25s ease' }}
                />
                {l < N_LAYERS - 1 && (
                  <text x={W / 2 + 10} y={y + layerSize + vGap / 2 + 3} fontFamily="var(--mono)" fontSize="8.5" fill="var(--text-dim)">
                    {useResidual ? '½(A+I)·' : 'A·'}
                  </text>
                )}
              </g>
            );
          })}

          {/* Rollout matrix at the bottom */}
          <text x={rolloutX + rolloutSize / 2} y={rolloutY - 12} fontFamily="var(--mono)" fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">
            Rollout R = {useResidual ? '½(A+I)' : 'A'}<tspan baselineShift="super" fontSize="8">{depthAbsorbed}</tspan>{depthAbsorbed > 1 ? ' · … · ' : ' · '}{useResidual ? '½(A+I)' : 'A'}<tspan baselineShift="super" fontSize="8">1</tspan>
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
                style={{ transition: reduced ? 'none' : 'fill 0.25s ease' }}
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
              y={rolloutY + rolloutSize + 16}
              fontFamily="var(--mono)"
              fontSize="10"
              fill={j === maxInputIdx ? 'var(--accent)' : 'var(--text-dim)'}
              textAnchor="middle"
              fontWeight={j === maxInputIdx ? 700 : 400}
            >
              {t}
            </text>
          ))}
          <text x={rolloutX - 6} y={rolloutY - 2} fontFamily="var(--mono)" fontSize="8" fill="var(--text-dim)" textAnchor="end" letterSpacing="0.1em">target ↓</text>
          <text x={rolloutX + rolloutSize / 2} y={rolloutY + rolloutSize + 30} fontFamily="var(--mono)" fontSize="8" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.12em">INPUT TOKENS (where attention lands)</text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-btn-row" style={{ paddingBottom: '0.2rem' }}>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={togglePlay}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : (Math.round(prog) >= N_LAYERS - 1 ? 'Replay fold-in' : 'Fold layers in')}</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            depth absorbed: <strong style={{ color: 'var(--accent)' }}>{depthAbsorbed} / {N_LAYERS}</strong>
          </span>
        </div>
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
