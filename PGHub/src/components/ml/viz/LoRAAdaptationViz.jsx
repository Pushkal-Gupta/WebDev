import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Snowflake, Flame } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/* LoRAAdaptationViz
   Animate the forward pass y = (W + (alpha/r) * B A) x.
   - W: frozen d x d weight matrix (left panel, snowflake icon).
   - B: d x r tall thin matrix (trainable, flame icon).
   - A: r x d short wide matrix (trainable, flame icon).
   - A vector x flows in, the upper path computes W x, the lower path computes
     B (A x) and scales by alpha / r, then the two are summed into y.
   Sliders: rank r, dimension d, scale alpha.
   Readouts: trainable params (2 d r), full params (d * d), ratio (2 r / d), and a tiny
   bar comparing y_base = W x vs y_adapt = (W + s B A) x for one slot. */

const W = 760;
const H = 360;
const SEED = 7;
const STEP_MS = 900;
const MAX_STEPS = 5;

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

function fmtCount(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

/* Build a tiny deterministic "demo slot" computation so the readouts feel grounded.
   We do NOT simulate d x d math — we sample a single output coordinate so the
   reader sees the size of (W x) versus the size of (alpha/r) * (B (A x)). */
function sampleSlot(rng, d, r) {
  let wx = 0;
  for (let i = 0; i < 12; i++) wx += (rng() - 0.5) * 1.4;
  let ax = 0;
  for (let i = 0; i < Math.min(8, r); i++) ax += (rng() - 0.5) * 1.1;
  let bax = 0;
  for (let i = 0; i < Math.min(8, r); i++) bax += (rng() - 0.5) * ax * 1.6;
  // dampen so display stays in a sane range when d grows
  const damp = 12 / Math.max(12, Math.sqrt(d));
  return { wx: wx * damp, bax: bax * damp };
}

export default function LoRAAdaptationViz() {
  const [r, setR] = useState(8);
  const [d, setD] = useState(64);
  const [alpha, setAlpha] = useState(8);
  const [seed, setSeed] = useState(SEED);
  const [step, setStep] = useState(0);
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

  const isRunning = isRunningRaw && step < MAX_STEPS;

  const stats = useMemo(() => {
    const full = d * d;
    const lora = 2 * d * r;
    const scale = alpha / r;
    const slot = sampleSlot(mulberry32(seed + 19), d, r);
    const yBase = slot.wx;
    const yAdapt = slot.wx + scale * slot.bax;
    return {
      full,
      lora,
      ratio: lora / full,
      ratioPct: (lora / full) * 100,
      scale,
      yBase,
      yAdapt,
      delta: scale * slot.bax,
    };
  }, [d, r, alpha, seed]);

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
      setStep((s) => Math.min(MAX_STEPS, s + 1));
    }, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, reducedMotion]);

  const handleToggle = useCallback(() => {
    if (step >= MAX_STEPS) {
      setStep(0);
      setIsRunningRaw(true);
      return;
    }
    setIsRunningRaw((v) => !v);
  }, [step]);

  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setStep(0);
    setSeed((s) => s + 1);
  }, []);

  // Layout
  const xIn = 50;
  const xW = 200;
  const xA = 200;
  const xB = 360;
  const xScale = 470;
  const xSum = 580;
  const xOut = 700;
  const yTop = 100;
  const yBot = 240;
  const yMid = (yTop + yBot) / 2;

  // W matrix box visual: scale to dimension d
  const wSize = 70 + Math.min(60, Math.log2(Math.max(2, d)) * 8);
  // A: r x d (short, wide); B: d x r (tall, narrow)
  const aW = wSize;
  const aH = Math.max(8, (wSize * r) / Math.max(d, 4));
  const bW = Math.max(8, (wSize * r) / Math.max(d, 4));
  const bH = wSize;

  const wActive = step >= 1;
  const aActive = step >= 1;
  const bActive = step >= 2;
  const scaleActive = step >= 3;
  const sumActive = step >= 4;
  const outActive = step >= 5;

  const formulaHtml = useMemo(
    () => katexHtml('y = W x + \\frac{\\alpha}{r}\\,B(A x)', false),
    []
  );
  const paramHtml = useMemo(
    () => katexHtml('|\\theta_{\\text{LoRA}}| = 2 d r', false),
    []
  );

  // Helper to render an animated dot along a line
  function flowDot(active, x1, y1, x2, y2, color) {
    if (!active) return null;
    const dur = reducedMotion ? '0.001s' : '0.9s';
    return (
      <circle r="3.5" fill={color}>
        <animate attributeName="cx" from={x1} to={x2} dur={dur} repeatCount="indefinite" />
        <animate attributeName="cy" from={y1} to={y2} dur={dur} repeatCount="indefinite" />
      </circle>
    );
  }

  const transition = reducedMotion ? 'none' : 'opacity 0.3s ease, stroke 0.3s ease, fill 0.3s ease';

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
            <marker id="lora-ad-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="lora-ad-arrow-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <pattern id="lora-ad-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border)" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Title strip */}
          <text x={W / 2} y="22" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" letterSpacing="0.18em">
            LoRA · FORWARD PASS
          </text>
          <text x={W / 2} y="40" textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="13" fill="var(--text-main)">
            y = W x + (α/r) · B (A x)
          </text>

          {/* Input x */}
          <g style={{ transition }}>
            <circle cx={xIn} cy={yMid} r="16" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.4" />
            <text x={xIn} y={yMid + 4} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="14" fill="var(--accent)" fontWeight="700">
              x
            </text>
            <text x={xIn} y={yMid + 32} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.1em">
              d = {d}
            </text>
          </g>

          {/* Top branch — W (frozen) */}
          <g opacity={wActive ? 1 : 0.45} style={{ transition }}>
            <rect
              x={xW - wSize / 2}
              y={yTop - wSize / 2}
              width={wSize}
              height={wSize}
              fill="url(#lora-ad-hatch)"
              stroke="var(--text-dim)"
              strokeWidth="1.2"
              rx="3"
            />
            <rect
              x={xW - wSize / 2}
              y={yTop - wSize / 2}
              width={wSize}
              height={wSize}
              fill="none"
              stroke="var(--text-dim)"
              strokeWidth="1.2"
              rx="3"
            />
            <text x={xW} y={yTop - wSize / 2 - 8} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="14" fill="var(--text-main)" fontWeight="700">
              W
            </text>
            <text x={xW} y={yTop - wSize / 2 - 22} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.1em">
              d × d (frozen)
            </text>
            <g transform={`translate(${xW + wSize / 2 - 14}, ${yTop - wSize / 2 + 4})`}>
              <circle r="9" fill="var(--surface)" stroke="var(--text-dim)" strokeWidth="1" />
              <g transform="translate(-6, -6)">
                <path
                  d="M6 0 L6 12 M0 6 L12 6 M1.5 1.5 L10.5 10.5 M10.5 1.5 L1.5 10.5"
                  stroke="var(--text-dim)"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </g>
            <text x={xW} y={yTop + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--text-dim)">
              {fmtCount(stats.full)} params
            </text>
          </g>

          {/* Arrow x -> W */}
          <line x1={xIn + 16} y1={yMid} x2={xIn + 70} y2={yMid} stroke="var(--text-dim)" strokeWidth="1.2" />
          <line
            x1={xIn + 70}
            y1={yMid}
            x2={xW - wSize / 2 - 4}
            y2={yTop}
            stroke="var(--text-dim)"
            strokeWidth="1.2"
            markerEnd="url(#lora-ad-arrow)"
          />
          {flowDot(wActive, xIn + 70, yMid, xW - wSize / 2 - 4, yTop, 'var(--text-dim)')}

          {/* Bottom branch — A then B */}
          <g opacity={aActive ? 1 : 0.45} style={{ transition }}>
            <rect
              x={xA - aW / 2}
              y={yBot - aH / 2}
              width={aW}
              height={aH}
              fill="rgba(var(--accent-rgb), 0.16)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              rx="2"
            />
            <text x={xA} y={yBot - aH / 2 - 8} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="14" fill="var(--accent)" fontWeight="700">
              A
            </text>
            <text x={xA} y={yBot + aH / 2 + 14} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.08em">
              r × d
            </text>
            <g transform={`translate(${xA + aW / 2 - 14}, ${yBot - aH / 2 + 4})`}>
              <Flame size={0} />
              <path
                d="M0 0 c2 -3 0 -5 0 -7 c3 2 5 6 5 9 c0 3 -2 5 -5 5 c-3 0 -5 -2 -5 -5 c0 -2 2 -3 2 -5 c1 1 2 2 3 3 z"
                fill="var(--accent)"
                opacity="0.85"
              />
            </g>
          </g>

          <g opacity={bActive ? 1 : 0.45} style={{ transition }}>
            <rect
              x={xB - bW / 2}
              y={yBot - bH / 2}
              width={bW}
              height={bH}
              fill="rgba(var(--accent-rgb), 0.16)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              rx="2"
            />
            <text x={xB} y={yBot - bH / 2 - 8} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="14" fill="var(--accent)" fontWeight="700">
              B
            </text>
            <text x={xB} y={yBot + bH / 2 + 14} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.08em">
              d × r
            </text>
          </g>

          {/* Arrow x -> A */}
          <line x1={xIn + 70} y1={yMid} x2={xA - aW / 2 - 4} y2={yBot} stroke="var(--accent)" strokeWidth="1.2" markerEnd="url(#lora-ad-arrow-acc)" opacity={aActive ? 0.9 : 0.35} />
          {flowDot(aActive, xIn + 70, yMid, xA - aW / 2 - 4, yBot, 'var(--accent)')}

          {/* Arrow A -> B with r label */}
          <line x1={xA + aW / 2} y1={yBot} x2={xB - bW / 2 - 4} y2={yBot} stroke="var(--accent)" strokeWidth="1.2" markerEnd="url(#lora-ad-arrow-acc)" opacity={bActive ? 0.9 : 0.35} />
          {flowDot(bActive, xA + aW / 2, yBot, xB - bW / 2 - 4, yBot, 'var(--accent)')}
          <text
            x={(xA + xB) / 2}
            y={yBot - 8}
            textAnchor="middle"
            fontFamily="var(--mono)"
            fontSize="10"
            fill={bActive ? 'var(--accent)' : 'var(--text-dim)'}
            fontWeight="700"
            style={{ transition }}
          >
            rank r = {r}
          </text>

          {/* Scale node alpha/r */}
          <g opacity={scaleActive ? 1 : 0.45} style={{ transition }}>
            <circle cx={xScale} cy={yBot} r="22" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.4" />
            <text x={xScale} y={yBot - 2} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)">
              ×
            </text>
            <text x={xScale} y={yBot + 10} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--accent)" fontWeight="700">
              {stats.scale.toFixed(2)}
            </text>
            <text x={xScale} y={yBot - 30} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.1em">
              α / r
            </text>
          </g>
          <line x1={xB + bW / 2} y1={yBot} x2={xScale - 22} y2={yBot} stroke="var(--accent)" strokeWidth="1.2" markerEnd="url(#lora-ad-arrow-acc)" opacity={scaleActive ? 0.9 : 0.35} />
          {flowDot(scaleActive, xB + bW / 2, yBot, xScale - 22, yBot, 'var(--accent)')}

          {/* Sum node */}
          <g opacity={sumActive ? 1 : 0.45} style={{ transition }}>
            <circle cx={xSum} cy={yMid} r="22" fill="var(--surface)" stroke={sumActive ? 'var(--accent)' : 'var(--text-dim)'} strokeWidth="1.6" />
            <text x={xSum} y={yMid + 5} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="18" fill={sumActive ? 'var(--accent)' : 'var(--text-dim)'} fontWeight="700">
              +
            </text>
          </g>

          {/* W -> sum */}
          <line x1={xW + wSize / 2} y1={yTop} x2={xSum - 16} y2={yMid - 12} stroke="var(--text-dim)" strokeWidth="1.2" markerEnd="url(#lora-ad-arrow)" opacity={sumActive ? 0.9 : 0.35} />
          {flowDot(sumActive, xW + wSize / 2, yTop, xSum - 16, yMid - 12, 'var(--text-dim)')}

          {/* scale -> sum */}
          <line x1={xScale + 22} y1={yBot} x2={xSum - 16} y2={yMid + 12} stroke="var(--accent)" strokeWidth="1.2" markerEnd="url(#lora-ad-arrow-acc)" opacity={sumActive ? 0.9 : 0.35} />
          {flowDot(sumActive, xScale + 22, yBot, xSum - 16, yMid + 12, 'var(--accent)')}

          {/* Output y */}
          <g opacity={outActive ? 1 : 0.45} style={{ transition }}>
            <circle cx={xOut} cy={yMid} r="18" fill="var(--surface)" stroke={outActive ? 'var(--accent)' : 'var(--text-dim)'} strokeWidth="1.6" />
            <text x={xOut} y={yMid + 5} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize="15" fill={outActive ? 'var(--accent)' : 'var(--text-dim)'} fontWeight="700">
              y
            </text>
            <text x={xOut} y={yMid + 34} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.1em">
              adapted
            </text>
          </g>
          <line x1={xSum + 22} y1={yMid} x2={xOut - 18} y2={yMid} stroke="var(--text-dim)" strokeWidth="1.2" markerEnd="url(#lora-ad-arrow)" opacity={outActive ? 0.9 : 0.35} />
          {flowDot(outActive, xSum + 22, yMid, xOut - 18, yMid, 'var(--text-dim)')}

          {/* y_base vs y_adapt mini-bars in bottom-right corner */}
          <g transform={`translate(${W - 180}, ${H - 56})`}>
            <text x="0" y="-6" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)" letterSpacing="0.1em">
              SAMPLE OUTPUT SLOT
            </text>
            <line x1="0" y1="0" x2="170" y2="0" stroke="var(--border)" strokeWidth="1" />
            <text x="0" y="14" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)">
              y_base
            </text>
            <rect x="48" y="6" width={Math.min(110, Math.abs(stats.yBase) * 18)} height="8" fill="var(--text-dim)" opacity="0.65" />
            <text x="0" y="32" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)">
              y_adapt
            </text>
            <rect x="48" y="24" width={Math.min(110, Math.abs(stats.yAdapt) * 18)} height="8" fill="var(--accent)" opacity="0.9" />
            <text x="166" y="14" textAnchor="end" fontFamily="var(--mono)" fontSize="9" fill="var(--text-dim)">
              {stats.yBase.toFixed(2)}
            </text>
            <text x="166" y="32" textAnchor="end" fontFamily="var(--mono)" fontSize="9" fill="var(--accent)" fontWeight="700">
              {stats.yAdapt.toFixed(2)}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">rank r</span>
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={r}
              onChange={(e) => setR(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{r}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">dim d</span>
            <input
              type="range"
              min="32"
              max="128"
              step="4"
              value={d}
              onChange={(e) => setD(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{d}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">scale α</span>
            <input
              type="range"
              min="0.5"
              max="16"
              step="0.5"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{alpha.toFixed(1)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">trainable (2dr)</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{fmtCount(stats.lora)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">full (d²)</span>
            <span className="mlviz-val">{fmtCount(stats.full)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">ratio (2r/d)</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {stats.ratioPct.toFixed(2)}%
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">α/r</span>
            <span className="mlviz-val">{stats.scale.toFixed(2)}</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.1rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.85rem' }}
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
          <span style={{ marginLeft: 'auto' }} className="ml-imath" dangerouslySetInnerHTML={{ __html: paramHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`} onClick={handleToggle}>
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{step >= MAX_STEPS ? 'Replay' : isRunning ? 'Pause' : 'Trace'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Snowflake size={11} /> W frozen
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)' }}>
              <Flame size={11} /> A, B trainable
            </span>
          </span>
        </div>

        <div className="mlviz-hint">
          slide r and d to watch trainable share shrink · α / r rescales the low-rank delta
        </div>
      </div>
    </div>
  );
}
