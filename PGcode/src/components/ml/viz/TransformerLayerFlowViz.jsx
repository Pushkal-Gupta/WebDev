import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Layers, Database } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

const W = 760;
const H = 360;
const PANEL_TOP = 40;
const PANEL_H = 240;
const PANEL_GAP = 14;
const PANEL_W = (W - 32 - PANEL_GAP * 3) / 4;
const SEQ_LEN = 6;
const D_MODEL = 64;
const N_PANELS = 4;
const STEP_MS = 950;

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PANEL_LABELS = [
  { tag: 'INPUT  embeddings', sub: 'tokens → d_model' },
  { tag: 'MULTI-HEAD  self-attn', sub: 'Q,K,V per head' },
  { tag: 'ADD + NORM  →  FFN', sub: 'residual · 4×d_model' },
  { tag: 'OUTPUT  contextual', sub: 'projected back' },
];

const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];

function buildField(rng, panelIdx, heads) {
  // generate a SEQ_LEN x SEQ_LEN matrix of intensities per panel
  const rows = SEQ_LEN;
  const cells = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < rows; j++) {
      let v;
      if (panelIdx === 0) {
        // diagonal-dominant embeddings
        v = i === j ? 0.75 + rng() * 0.2 : 0.15 + rng() * 0.2;
      } else if (panelIdx === 1) {
        // attention with head mixing — slight off-diagonal
        const dist = Math.abs(i - j);
        const headBoost = 0.06 * heads;
        v = Math.max(0, 0.85 - dist * 0.18 + (rng() - 0.5) * 0.1 + (j > i ? -0.05 : 0));
        v = Math.min(1, v + headBoost * (1 - dist / SEQ_LEN));
      } else if (panelIdx === 2) {
        // post add+norm: smoothed, mid-range
        v = 0.35 + (rng() * 0.3) + (i === j ? 0.15 : 0);
      } else {
        // output: sharper, contextualised
        v = 0.2 + rng() * 0.25 + (Math.abs(i - j) <= 1 ? 0.35 : 0);
      }
      cells.push(Math.max(0, Math.min(1, v)));
    }
  }
  return cells;
}

export default function TransformerLayerFlowViz() {
  const [heads, setHeads] = useState(4);
  const [stage, setStage] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const rng = useMemo(() => mulberry32(1729 + heads * 7), [heads]);

  const fields = useMemo(() => {
    // Build a fresh RNG per panel so they don't drift as we re-render
    return Array.from({ length: N_PANELS }, (_, p) => buildField(mulberry32(1009 + p * 31 + heads * 13), p, heads));
  }, [heads]);

  const isRunning = isRunningRaw;

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const ms = reducedMotion ? 60 : STEP_MS;
    timerRef.current = setInterval(() => {
      setStage((s) => (s + 1) % N_PANELS);
    }, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, reducedMotion]);

  const handleToggle = useCallback(() => setIsRunningRaw((r) => !r), []);
  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setStage(0);
  }, []);

  // Parameter counts (per head, per layer in a standard block)
  const dHead = Math.floor(D_MODEL / heads);
  // Q,K,V each: d_model * d_head — but for "per head" we report d_model * d_head per projection
  const paramsPerHead = D_MODEL * dHead * 3;
  // KV cache estimate (fp16, 2 bytes): 2 (K+V) * seq_len * d_head * heads * bytes_per_elem
  const kvBytes = 2 * SEQ_LEN * dHead * heads * 2;

  const formulaHtml = useMemo(
    () => katexHtml('y = \\text{LN}\\big(x + \\text{FFN}(\\text{LN}(x + \\text{MHA}(x)))\\big)', false),
    []
  );
  const paramsHtml = useMemo(() => katexHtml('3 \\cdot d_{\\text{model}} \\cdot d_{\\text{head}}', false), []);
  const kvHtml = useMemo(() => katexHtml('2 \\cdot L \\cdot d_{\\text{head}} \\cdot h \\cdot b', false), []);

  const transition = reducedMotion ? 'none' : 'opacity 0.35s ease, fill 0.35s ease, stroke 0.35s ease';

  const cellSize = (Math.min(PANEL_W, PANEL_H - 70) - 10) / SEQ_LEN;
  const panelX = (idx) => 16 + idx * (PANEL_W + PANEL_GAP);

  function renderPanel(idx) {
    const x = panelX(idx);
    const active = stage === idx;
    const arr = fields[idx];
    const gridX = x + (PANEL_W - cellSize * SEQ_LEN) / 2;
    const gridY = PANEL_TOP + 30;
    return (
      <g key={idx} opacity={active ? 1 : 0.55} style={{ transition }}>
        <rect
          x={x}
          y={PANEL_TOP - 4}
          width={PANEL_W}
          height={PANEL_H}
          fill="var(--bg)"
          stroke={active ? 'var(--accent)' : 'var(--border)'}
          strokeWidth={active ? 1.6 : 1}
          rx="8"
          opacity={active ? 0.9 : 0.55}
        />
        <text
          x={x + 8}
          y={PANEL_TOP + 12}
          fontSize="9"
          fontFamily="var(--mono)"
          fill="var(--text-dim)"
          letterSpacing="0.14em"
        >
          {`STEP ${idx + 1}`}
        </text>
        <text
          x={x + PANEL_W - 8}
          y={PANEL_TOP + 12}
          fontSize="8.5"
          fontFamily="var(--mono)"
          fill={active ? 'var(--accent)' : 'var(--text-dim)'}
          textAnchor="end"
          fontWeight="700"
        >
          {PANEL_LABELS[idx].tag}
        </text>
        {/* grid */}
        {arr.map((v, k) => {
          const r = Math.floor(k / SEQ_LEN);
          const c = k % SEQ_LEN;
          const cx = gridX + c * cellSize;
          const cy = gridY + r * cellSize;
          // color: idx 0 = hue-sky, idx 1 = hue-pink, idx 2 = hue-mint, idx 3 = accent
          const colors = ['var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--accent)'];
          return (
            <rect
              key={k}
              x={cx + 0.5}
              y={cy + 0.5}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={colors[idx]}
              opacity={0.15 + v * 0.7}
              rx="1.5"
              style={{ transition }}
            />
          );
        })}
        {/* token labels along bottom */}
        {TOKENS.map((t, ti) => (
          <text
            key={ti}
            x={gridX + ti * cellSize + cellSize / 2}
            y={gridY + cellSize * SEQ_LEN + 12}
            fontSize="8"
            fontFamily="var(--serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
            textAnchor="middle"
          >
            {t}
          </text>
        ))}
        <text
          x={x + PANEL_W / 2}
          y={PANEL_TOP + PANEL_H - 14}
          fontSize="9"
          fontFamily="var(--mono)"
          fill="var(--text-dim)"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          {PANEL_LABELS[idx].sub}
        </text>
      </g>
    );
  }

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
            <marker id="tlf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" opacity="0.85" />
            </marker>
          </defs>

          {[0, 1, 2, 3].map(renderPanel)}

          {/* arrows between panels */}
          {[0, 1, 2].map((i) => {
            const x1 = panelX(i) + PANEL_W + 1;
            const x2 = panelX(i + 1) - 1;
            const y = PANEL_TOP + PANEL_H / 2;
            return (
              <line
                key={`a-${i}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="var(--accent)"
                strokeWidth="1.4"
                strokeDasharray={stage > i ? '0' : '3 3'}
                opacity={stage > i ? 0.95 : 0.5}
                markerEnd="url(#tlf-arrow)"
                style={{ transition }}
              />
            );
          })}

          <text
            x={W / 2}
            y={H - 12}
            fontSize="9.5"
            fontFamily="var(--mono)"
            fill="var(--text-dim)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            transformer block: embed → MHA → add+norm+FFN → output
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Layers size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              heads h
            </span>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={heads}
              onChange={(e) => setHeads(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{heads}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">d_head</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{dHead}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span dangerouslySetInnerHTML={{ __html: paramsHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
              {paramsPerHead.toLocaleString()}
            </span>
            <span className="mlviz-sub">params / head</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <Database size={11} style={{ verticalAlign: '-1px' }} />
            <span dangerouslySetInnerHTML={{ __html: kvHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {kvBytes.toLocaleString()} B
            </span>
            <span className="mlviz-sub">KV cache (fp16)</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.85rem' }}
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={handleToggle}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause' : 'Flow'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStage((s) => (s + 1) % N_PANELS)}
            disabled={isRunning}
          >
            <span>Next step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            stage {stage + 1} / {N_PANELS}
          </span>
        </div>

        <div className="mlviz-hint">
          slide heads to repartition d_model · watch the block flow embed → MHA → norm+FFN → output
        </div>
      </div>
    </div>
  );
}
