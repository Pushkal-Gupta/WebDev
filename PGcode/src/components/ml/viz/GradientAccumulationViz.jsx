import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sliders, Zap } from 'lucide-react';
import './MLViz.css';

/*
 * GradientAccumulationViz
 *
 * N micro-batches run forward+backward, each adding a noisy gradient into a
 * fixed-size accumulator. Only after the Nth does the optimizer step.
 * Left: the noisy micro-gradients vs their running average vs the true
 * gradient. Right: the timeline of fwd/bwd boxes followed by one OPT box.
 */

const W = 720;
const H = 300;
const CX = 168;
const CY = 158;
const SCALE = 105;
const SEED = 17;
const MICRO_B = 32;
const STEP_MS = 900;
const TRUE_ANGLE = 0.62;
const NOISE = 0.85;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function microGrads(optStep, n) {
  const rng = mulberry32(SEED + optStep * 101);
  const out = [];
  for (let i = 0; i < n; i++) {
    const ang = TRUE_ANGLE + (rng() - 0.5) * 2 * NOISE;
    const mag = 0.75 + rng() * 0.5;
    out.push({ x: mag * Math.cos(ang), y: mag * Math.sin(ang) });
  }
  return out;
}

export default function GradientAccumulationViz() {
  const [accumN, setAccumN] = useState(4);
  const [microIdx, setMicroIdx] = useState(0);
  const [optStep, setOptStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const timerRef = useRef(null);

  const grads = useMemo(() => microGrads(optStep, accumN), [optStep, accumN]);

  const done = grads.slice(0, microIdx);
  const avg = done.length
    ? { x: done.reduce((s, g) => s + g.x, 0) / done.length, y: done.reduce((s, g) => s + g.y, 0) / done.length }
    : null;
  const trueG = { x: Math.cos(TRUE_ANGLE), y: Math.sin(TRUE_ANGLE) };
  const angleErr = avg
    ? Math.abs(Math.atan2(avg.y, avg.x) - TRUE_ANGLE) * (180 / Math.PI)
    : null;
  const atOptStep = microIdx === accumN;

  const advance = useCallback(() => {
    setMicroIdx((m) => {
      if (m < accumN) return m + 1;
      setOptStep((s) => s + 1);
      return 0;
    });
  }, [accumN]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(advance, reducedMotion ? 120 : STEP_MS);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isRunning, reducedMotion, advance]);

  const handleReset = () => { setIsRunning(false); setMicroIdx(0); setOptStep(0); };

  const toXY = (g) => ({ x: CX + g.x * SCALE, y: CY - g.y * SCALE });

  // timeline geometry
  const tlL = 340;
  const tlR = W - 26;
  const tlY = 70;
  const boxGap = 6;
  const boxW = (tlR - tlL - boxGap * accumN - 64) / accumN;

  const caption = atOptStep
    ? `All ${accumN} micro-batches summed — the optimizer finally steps on the averaged gradient of ${accumN * MICRO_B} examples.`
    : microIdx === 0
      ? `Accumulator is empty. Micro-batch 1 of ${accumN} is about to run forward and backward.`
      : `Micro-batch ${microIdx} of ${accumN} adds its noisy gradient — the accumulator now averages ${microIdx * MICRO_B} examples; still no weight update.`;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text x={26} y={24} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            GRADIENT SPACE
          </text>
          <text x={tlL} y={24} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            ONE OPTIMIZER STEP · {accumN} MICRO-BATCHES
          </text>

          {/* gradient plane */}
          <circle cx={CX} cy={CY} r={SCALE + 14} fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.75" />
          <line x1={CX - SCALE - 10} y1={CY} x2={CX + SCALE + 10} y2={CY} stroke="var(--border)" strokeWidth="0.7" opacity="0.5" />
          <line x1={CX} y1={CY - SCALE - 10} x2={CX} y2={CY + SCALE + 10} stroke="var(--border)" strokeWidth="0.7" opacity="0.5" />

          {/* true gradient */}
          {(() => {
            const p = toXY(trueG);
            return (
              <g>
                <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="var(--text-dim)" strokeWidth="1.6" strokeDasharray="5 4" opacity="0.7" />
                <text x={p.x + 6} y={p.y - 4} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">true grad</text>
              </g>
            );
          })()}

          {/* micro gradients added so far */}
          {done.map((g, i) => {
            const p = toXY(g);
            return (
              <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="var(--hue-sky)" strokeWidth="1.2" opacity="0.45" />
            );
          })}

          {/* running average */}
          {avg && (() => {
            const p = toXY(avg);
            return (
              <g>
                <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={atOptStep ? 'var(--easy, var(--accent))' : 'var(--accent)'} strokeWidth="3" opacity="0.95" />
                <circle cx={p.x} cy={p.y} r="4.5" fill={atOptStep ? 'var(--easy, var(--accent))' : 'var(--accent)'} />
                <text x={p.x + 7} y={p.y + 3} fontSize="9.5" fill="var(--accent)" fontFamily="var(--mono)" fontWeight="700">accumulated avg</text>
              </g>
            );
          })()}

          {/* timeline */}
          {Array.from({ length: accumN }).map((_, i) => {
            const x = tlL + i * (boxW + boxGap);
            const processed = i < microIdx;
            const active = i === microIdx && !atOptStep;
            return (
              <g key={i}>
                <rect
                  x={x} y={tlY} width={boxW} height={56} rx="6"
                  fill={processed ? 'var(--hue-sky)' : 'var(--surface)'}
                  opacity={processed ? 0.55 : active ? 0.9 : 0.5}
                  stroke={active ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={active ? 1.8 : 1}
                />
                <text x={x + boxW / 2} y={tlY + 24} fontSize="9.5" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
                  fwd+bwd
                </text>
                <text x={x + boxW / 2} y={tlY + 40} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  µB {i + 1}
                </text>
              </g>
            );
          })}
          <rect
            x={tlR - 58} y={tlY} width={58} height={56} rx="6"
            fill={atOptStep ? 'var(--easy, var(--accent))' : 'var(--surface)'}
            opacity={atOptStep ? 0.85 : 0.45}
            stroke={atOptStep ? 'var(--easy, var(--accent))' : 'var(--border)'}
            strokeWidth={atOptStep ? 1.8 : 1}
          />
          <text x={tlR - 29} y={tlY + 32} fontSize="10" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
            OPT
          </text>

          {/* accumulator gauge */}
          <text x={tlL} y={tlY + 88} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            ACCUMULATOR
          </text>
          <rect x={tlL} y={tlY + 96} width={tlR - tlL} height={14} rx="7" fill="var(--bg)" stroke="var(--border)" strokeWidth="1" />
          <rect
            x={tlL} y={tlY + 96}
            width={Math.max(0, (tlR - tlL) * (microIdx / accumN))}
            height={14} rx="7"
            fill="var(--accent)" opacity="0.7"
            style={{ transition: reducedMotion ? 'none' : 'width 0.3s ease' }}
          />
          <text x={tlR} y={tlY + 128} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            {microIdx} / {accumN} micro-batches summed · GPU memory held: 1 micro-batch, always
          </text>

          <text x={W / 2} y={H - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.06em">
            {caption}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              accumulation steps N
            </span>
            <input
              type="range" min="1" max="8" step="1" value={accumN}
              onChange={(e) => { setAccumN(parseInt(e.target.value, 10)); setMicroIdx(0); }}
            />
            <span className="mlviz-slider-val">{accumN}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">micro-batch size</span>
            <span className="mlviz-val">{MICRO_B}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">effective batch</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>{MICRO_B * accumN}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">avg vs true grad</span>
            <span className="mlviz-val" style={{ color: angleErr !== null && angleErr < 10 ? 'var(--easy, var(--accent))' : 'var(--hue-pink)' }}>
              {angleErr !== null ? `${angleErr.toFixed(1)}° off` : '—'}
            </span>
          </span>
          <span className="mlviz-sub">optimizer step {optStep}</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`} onClick={() => setIsRunning((r) => !r)}>
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={advance} disabled={isRunning}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          more micro-batches = less noisy average and a bigger effective batch — at the same GPU memory · the only cost is wall-clock time per optimizer step
        </div>
      </div>
    </div>
  );
}
