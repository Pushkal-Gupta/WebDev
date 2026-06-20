import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Thermometer, Hash, Eye, Play, Pause } from 'lucide-react';
import './MLViz.css';

const TOKEN_POOL = ['the', 'cat', 'sat', 'on', 'mat', 'and', 'purred', 'softly', 'while', 'dawn', 'rose', 'slow'];
const D_K = 4;
const SEED = 1337;

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

function deriveQK(n, rng) {
  const Q = [];
  const K = [];
  for (let i = 0; i < n; i++) {
    const q = new Array(D_K);
    const k = new Array(D_K);
    for (let d = 0; d < D_K; d++) {
      q[d] = (rng() - 0.5) * 2;
      k[d] = (rng() - 0.5) * 2;
    }
    Q.push(q);
    K.push(k);
  }
  return { Q, K };
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function softmaxRow(row, T) {
  const t = Math.max(0.0001, T);
  const scaled = row.map((v) => v / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((v) => v / s);
}

function entropy(p) {
  let h = 0;
  for (const v of p) {
    if (v > 1e-12) h -= v * Math.log(v);
  }
  return h;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
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

export default function AttentionHeatmapViz() {
  const [n, setN] = useState(8);
  const [T, setT] = useState(1.0);
  const [hover, setHover] = useState(null);
  const [scanRow, setScanRow] = useState(-1); // animated playhead row, -1 = idle
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const rafRef = useRef(null);
  const accRef = useRef(0);
  const lastRef = useRef(null);

  const { tokens, scores, weights, entropies } = useMemo(() => {
    const localRng = mulberry32(SEED);
    const toks = TOKEN_POOL.slice(0, n);
    const { Q, K } = deriveQK(n, localRng);
    const scale = Math.sqrt(D_K);
    const sc = [];
    for (let i = 0; i < n; i++) {
      const row = new Array(n);
      for (let j = 0; j < n; j++) row[j] = dot(Q[i], K[j]) / scale;
      sc.push(row);
    }
    const w = sc.map((row) => softmaxRow(row, T));
    const ent = w.map((row) => entropy(row));
    return { tokens: toks, scores: sc, weights: w, entropies: ent };
  }, [n, T]);

  // Auto-scan: advance the playhead query row at ~1.4 rows/sec, looping.
  useEffect(() => {
    if (!playing || reduced) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
      /* eslint-disable react-hooks/set-state-in-effect */
      if (reduced) setPlaying(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined;
    }
    const PERIOD = 0.7; // seconds per row
    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      accRef.current += dt;
      if (accRef.current >= PERIOD) {
        accRef.current = 0;
        setScanRow((r) => (r + 1) % n);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [playing, reduced, n]);

  // raw score range for color scaling
  const allScores = scores.flat();
  const sMin = Math.min(...allScores);
  const sMax = Math.max(...allScores);
  const sAbs = Math.max(Math.abs(sMin), Math.abs(sMax), 1e-6);

  const W = 720;
  const H = 360;
  const tokenRowY = 28;
  const tokenH = 22;
  const matrixTop = 78;
  const matrixBottom = H - 32;
  const matSize = matrixBottom - matrixTop;
  const cell = matSize / n;
  const leftMatX = 60;
  const rightMatX = W - 60 - matSize;

  function rawCell(v) {
    const norm = v / sAbs; // -1..1
    if (norm >= 0) {
      const a = clamp01(norm);
      return { fill: 'var(--hue-mint)', opacity: 0.18 + 0.78 * a };
    }
    const a = clamp01(-norm);
    return { fill: 'var(--hue-pink)', opacity: 0.18 + 0.78 * a };
  }
  function probCell(p) {
    const a = clamp01(p);
    return { fill: 'var(--accent)', opacity: 0.1 + 0.85 * a };
  }

  // Effective focus row: hover wins, else the animated scan row.
  const focusRow = hover ? hover.i : (playing ? scanRow : -1);
  const hoverI = hover ? hover.i : null;
  const hoverJ = hover ? hover.j : null;

  const tokenSpan = (W - 100) / Math.max(1, n);
  const tokenY = tokenRowY;

  // best key for the focused query row (for live readout)
  const focusInfo = useMemo(() => {
    if (focusRow < 0 || focusRow >= n) return null;
    const row = weights[focusRow];
    let bestJ = 0;
    for (let j = 1; j < row.length; j++) if (row[j] > row[bestJ]) bestJ = j;
    return { bestJ, weight: row[bestJ], h: entropies[focusRow] };
  }, [focusRow, weights, entropies, n]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setScanRow((r) => (r < 0 || r >= n ? 0 : r));
    setHover(null);
    setPlaying(true);
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="ah-cellglow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <linearGradient id="ah-entbar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          {/* token row */}
          <text x={50} y={tokenY - 8} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            TOKENS
          </text>
          {tokens.map((tok, i) => {
            const highlight = focusRow === i || hoverJ === i;
            const tag = focusRow === i ? 'query' : hoverJ === i ? 'key' : '';
            return (
              <g key={i}>
                <rect
                  x={50 + i * tokenSpan + 2}
                  y={tokenY}
                  width={tokenSpan - 4}
                  height={tokenH}
                  rx="4"
                  fill={highlight ? 'var(--accent)' : 'var(--bg)'}
                  opacity={highlight ? 0.85 : 0.6}
                  stroke="var(--border)"
                  strokeWidth="1"
                  style={{ transition: reduced ? 'none' : 'fill 0.2s ease, opacity 0.2s ease' }}
                />
                <text
                  x={50 + i * tokenSpan + tokenSpan / 2}
                  y={tokenY + 15}
                  fontSize="10"
                  textAnchor="middle"
                  fill={highlight ? 'var(--bg)' : 'var(--text-main)'}
                  fontFamily="var(--mono)"
                  fontWeight={highlight ? 700 : 500}
                >
                  {tok}
                </text>
                {tag && (
                  <text
                    x={50 + i * tokenSpan + tokenSpan / 2}
                    y={tokenY + tokenH + 11}
                    fontSize="8.5"
                    textAnchor="middle"
                    fill="var(--accent)"
                    fontFamily="var(--mono)"
                    letterSpacing="0.12em"
                  >
                    {tag}
                  </text>
                )}
              </g>
            );
          })}

          {/* left matrix: raw scores */}
          <text
            x={leftMatX}
            y={matrixTop - 10}
            fontSize="10"
            fill="var(--hue-sky)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
            fontWeight="700"
          >
            Q · Kᵀ / √dₖ
          </text>
          <text
            x={leftMatX + matSize}
            y={matrixTop - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
          >
            raw scores
          </text>
          {scores.map((row, i) =>
            row.map((v, j) => {
              const x = leftMatX + j * cell;
              const y = matrixTop + i * cell;
              const isHover = hoverI === i && hoverJ === j;
              const inFocusRow = focusRow === i;
              const dim = focusRow >= 0 && !inFocusRow;
              const c = rawCell(v);
              return (
                <g key={`s-${i}-${j}`}>
                  {(isHover || (inFocusRow && Math.abs(v) > sAbs * 0.5)) && (
                    <rect
                      x={x}
                      y={y}
                      width={cell - 0.5}
                      height={cell - 0.5}
                      rx={Math.min(3, cell * 0.18)}
                      fill={c.fill}
                      fillOpacity={Math.min(1, c.opacity + 0.2)}
                      filter="url(#ah-cellglow)"
                      pointerEvents="none"
                    />
                  )}
                  <rect
                    x={x}
                    y={y}
                    width={cell - 0.5}
                    height={cell - 0.5}
                    rx={Math.min(3, cell * 0.18)}
                    fill={c.fill}
                    fillOpacity={dim ? c.opacity * 0.35 : c.opacity}
                    stroke={isHover || inFocusRow ? 'var(--accent)' : 'transparent'}
                    strokeWidth={isHover ? 1.5 : inFocusRow ? 0.8 : 0}
                    onMouseEnter={() => { setPlaying(false); setHover({ i, j }); }}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'pointer', transition: reduced ? 'none' : 'fill-opacity 0.18s ease' }}
                  />
                </g>
              );
            })
          )}
          {/* left matrix value when hovered */}
          {hover && (
            <text
              x={leftMatX + matSize / 2}
              y={matrixBottom + 18}
              fontSize="10"
              fill="var(--hue-sky)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              fontWeight="700"
            >
              score[{hoverI},{hoverJ}] = {scores[hoverI][hoverJ].toFixed(3)}
            </text>
          )}

          {/* right matrix: softmax weights */}
          <text
            x={rightMatX}
            y={matrixTop - 10}
            fontSize="10"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
            fontWeight="700"
          >
            softmax(scores / T)
          </text>
          <text
            x={rightMatX + matSize}
            y={matrixTop - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
          >
            T = {T.toFixed(2)}
          </text>
          {weights.map((row, i) =>
            row.map((p, j) => {
              const x = rightMatX + j * cell;
              const y = matrixTop + i * cell;
              const isHover = hoverI === i && hoverJ === j;
              const inFocusRow = focusRow === i;
              const dim = focusRow >= 0 && !inFocusRow;
              const c = probCell(p);
              return (
                <g key={`w-${i}-${j}`}>
                  {(isHover || (inFocusRow && p > 0.3)) && (
                    <rect
                      x={x}
                      y={y}
                      width={cell - 0.5}
                      height={cell - 0.5}
                      rx={Math.min(3, cell * 0.18)}
                      fill={c.fill}
                      fillOpacity={Math.min(1, c.opacity + 0.2)}
                      filter="url(#ah-cellglow)"
                      pointerEvents="none"
                    />
                  )}
                  <rect
                    x={x}
                    y={y}
                    width={cell - 0.5}
                    height={cell - 0.5}
                    rx={Math.min(3, cell * 0.18)}
                    fill={c.fill}
                    fillOpacity={dim ? c.opacity * 0.35 : c.opacity}
                    stroke={isHover || inFocusRow ? 'var(--accent)' : 'transparent'}
                    strokeWidth={isHover ? 1.5 : inFocusRow ? 0.8 : 0}
                    onMouseEnter={() => { setPlaying(false); setHover({ i, j }); }}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'pointer', transition: reduced ? 'none' : 'fill-opacity 0.18s ease' }}
                  />
                </g>
              );
            })
          )}
          {hover && (
            <text
              x={rightMatX + matSize / 2}
              y={matrixBottom + 18}
              fontSize="10"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              fontWeight="700"
            >
              p[{hoverI},{hoverJ}] = {weights[hoverI][hoverJ].toFixed(3)}
            </text>
          )}

          {/* row entropy column between matrices */}
          <text
            x={W / 2}
            y={matrixTop - 10}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.12em"
          >
            H(row)
          </text>
          {entropies.map((h, i) => {
            const y = matrixTop + i * cell + cell / 2;
            const maxH = Math.log(n);
            const norm = clamp01(h / maxH);
            const inFocusRow = focusRow === i;
            return (
              <g key={`h-${i}`}>
                <rect
                  x={W / 2 - 26}
                  y={y - cell / 2 + 2}
                  width={52}
                  height={cell - 4}
                  rx="3"
                  fill="var(--bg)"
                  stroke={inFocusRow ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth="1"
                  opacity="0.55"
                />
                <rect
                  x={W / 2 - 24}
                  y={y - cell / 2 + 4}
                  width={48 * norm}
                  height={cell - 8}
                  rx="2"
                  fill="url(#ah-entbar)"
                  opacity={0.6 + 0.35 * norm}
                  style={{ transition: reduced ? 'none' : 'width 0.25s ease' }}
                />
                <text
                  x={W / 2}
                  y={y + 3}
                  fontSize={Math.min(9, cell - 4)}
                  fill={inFocusRow ? 'var(--accent)' : 'var(--text-main)'}
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight={inFocusRow ? 700 : 500}
                >
                  {h.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-btn-row" style={{ paddingBottom: '0.2rem' }}>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={togglePlay}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause scan' : 'Scan queries'}</span>
          </button>
          {focusInfo && (
            <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
              query <strong style={{ color: 'var(--accent)' }}>{tokens[focusRow]}</strong>
              {' '}→ <strong style={{ color: 'var(--accent)' }}>{tokens[focusInfo.bestJ]}</strong>
              {' '}({focusInfo.weight.toFixed(2)}) · H={focusInfo.h.toFixed(2)}
            </span>
          )}
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Hash size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              sequence length
            </span>
            <input
              type="range"
              min="4"
              max="12"
              step="1"
              value={n}
              onChange={(e) => setN(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{n}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              temperature T
            </span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={T}
              onChange={(e) => setT(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{T.toFixed(2)}</span>
          </label>
        </div>
        <div className="mlviz-statcol mlviz-statrow" style={{ paddingTop: '0.3rem' }}>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">
              <Eye size={10} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              mean H
            </span>
            <span className="mlviz-statcard-val">
              {(entropies.reduce((a, b) => a + b, 0) / n).toFixed(3)}
            </span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">max possible</span>
            <span className="mlviz-statcard-val">{Math.log(n).toFixed(3)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">temperature T</span>
            <span className="mlviz-statcard-val">{T.toFixed(2)}</span>
          </div>
        </div>
        <div className="mlviz-row" style={{ paddingTop: '0.1rem' }}>
          <span className="mlviz-sub">low H = focused · high H = diffuse · max = ln({n})</span>
        </div>
        <div className="mlviz-hint">
          press Scan to sweep each query row · or hover any cell to highlight its query (row) and key (column) token
        </div>
      </div>
    </div>
  );
}
