import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Thermometer, Zap } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * CurriculumTemperatureViz
 *
 * Knowledge-distillation temperature curriculum: start with a high T (soft
 * targets reveal "dark knowledge" — the relative ranking of non-target
 * classes) and anneal down to T=1 over the course of training. Three
 * schedules supported: linear, cosine, exponential.
 *
 * Bar chart renders the teacher distribution after softening with the current
 * T. Lower T => sharper (one-hot-like); higher T => flatter (uniform-like).
 * Top-1 prob and entropy update live.
 */

const W = 720;
const H = 330;
const PAD_X = 22;
const CHART_TOP = 28;
const CHART_BOTTOM_GAP = 92;
const CHART_H = H - CHART_TOP - CHART_BOTTOM_GAP;
const BASELINE_Y = CHART_TOP + CHART_H;

const TEACHER_LOGITS = [4.0, 2.6, 1.6, 0.9, 0.2, -0.6, -1.2, -1.9];
const CLASS_LABELS = ['cat', 'dog', 'fox', 'wolf', 'lynx', 'puma', 'lion', 'tiger'];
const N_CLASSES = TEACHER_LOGITS.length;
const BAR_GAP = 8;
const CHART_W = W - PAD_X * 2;
const BAR_W = (CHART_W - BAR_GAP * (N_CLASSES + 1)) / N_CLASSES;

const TOTAL_STEPS = 100;
const STEP_MS = 90;
const T_FLOOR = 1.0;
const DEFAULT_T_START = 5.0;

const SCHEDULES = [
  { id: 'linear', label: 'linear', tex: 'T_t = T_0 + (1-T_0)\\,t/N' },
  { id: 'cosine', label: 'cosine', tex: 'T_t = 1 + (T_0-1)\\cdot\\tfrac{1+\\cos(\\pi t/N)}{2}' },
  { id: 'exp', label: 'exp', tex: 'T_t = T_0 \\cdot (1/T_0)^{t/N}' },
];

function softmaxWithTemp(logits, T) {
  const t = Math.max(0.0001, T);
  const scaled = logits.map((z) => z / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

function entropyOf(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], 1e-12);
    h -= pi * Math.log(pi);
  }
  return h;
}

function scheduleT(schedule, T0, step, total) {
  const frac = Math.min(1, Math.max(0, step / total));
  if (schedule === 'linear') return T0 + (T_FLOOR - T0) * frac;
  if (schedule === 'cosine') return T_FLOOR + (T0 - T_FLOOR) * (1 + Math.cos(Math.PI * frac)) / 2;
  // exp
  return T0 * Math.pow(T_FLOOR / T0, frac);
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

export default function CurriculumTemperatureViz() {
  const [T0, setT0] = useState(DEFAULT_T_START);
  const [schedule, setSchedule] = useState('cosine');
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

  const isRunning = isRunningRaw && step < TOTAL_STEPS;

  const T = useMemo(() => scheduleT(schedule, T0, step, TOTAL_STEPS), [schedule, T0, step]);
  const probs = useMemo(() => softmaxWithTemp(TEACHER_LOGITS, T), [T]);
  const top1 = probs[0];
  const ent = useMemo(() => entropyOf(probs), [probs]);
  const maxEnt = Math.log(N_CLASSES);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const ms = reducedMotion ? 25 : STEP_MS;
    timerRef.current = setInterval(() => {
      setStep((s) => s + 1);
    }, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, reducedMotion]);

  const handleToggle = useCallback(() => {
    if (step >= TOTAL_STEPS) {
      setStep(0);
      setIsRunningRaw(true);
      return;
    }
    setIsRunningRaw((r) => !r);
  }, [step]);

  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setStep(0);
  }, []);

  const handleStep = useCallback(() => {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, []);

  const transition = reducedMotion ? 'none' : 'height 0.18s ease, y 0.18s ease, fill 0.18s ease';

  const scheduleHtml = useMemo(() => {
    const found = SCHEDULES.find((s) => s.id === schedule);
    return katexHtml(found ? found.tex : '', false);
  }, [schedule]);

  // schedule preview curve, sampled
  const previewPoints = useMemo(() => {
    const samples = 60;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const s = (i / samples) * TOTAL_STEPS;
      const t = scheduleT(schedule, T0, s, TOTAL_STEPS);
      pts.push({ s, t });
    }
    return pts;
  }, [schedule, T0]);

  // preview maps into a tiny strip beneath the bars
  const STRIP_TOP = BASELINE_Y + 28;
  const STRIP_H = 36;
  const stripX0 = PAD_X;
  const stripX1 = W - PAD_X;
  const tMin = T_FLOOR;
  const tMax = Math.max(T0, T_FLOOR + 0.01);

  const previewPath = previewPoints
    .map((p, i) => {
      const x = stripX0 + (p.s / TOTAL_STEPS) * (stripX1 - stripX0);
      const norm = (p.t - tMin) / (tMax - tMin);
      const y = STRIP_TOP + STRIP_H - norm * STRIP_H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const curX = stripX0 + (step / TOTAL_STEPS) * (stripX1 - stripX0);
  const curNorm = (T - tMin) / (tMax - tMin);
  const curY = STRIP_TOP + STRIP_H - curNorm * STRIP_H;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* chart frame */}
          <rect
            x={PAD_X}
            y={CHART_TOP - 6}
            width={CHART_W}
            height={CHART_H + 8}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            rx="8"
            opacity="0.55"
          />
          <line
            x1={PAD_X + 6}
            y1={BASELINE_Y}
            x2={W - PAD_X - 6}
            y2={BASELINE_Y}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* header text */}
          <text
            x={PAD_X}
            y={CHART_TOP - 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
            textAnchor="start"
          >
            TEACHER  p^T  (T = {T.toFixed(2)})
          </text>
          <text
            x={W - PAD_X}
            y={CHART_TOP - 12}
            fontSize="9.5"
            fill="var(--hue-sky)"
            fontFamily="var(--mono)"
            textAnchor="end"
            fontWeight="700"
          >
            step {step} / {TOTAL_STEPS}
          </text>

          {/* bars */}
          {probs.map((p, i) => {
            const h = Math.max(1, p * (CHART_H - 18));
            const x = PAD_X + BAR_GAP + i * (BAR_W + BAR_GAP);
            const y = BASELINE_Y - h;
            const isTop = i === 0;
            const fill = isTop ? 'var(--hue-sky)' : 'var(--hue-pink)';
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={h}
                  fill={fill}
                  opacity={isTop ? 0.95 : 0.6}
                  rx="2"
                  style={{ transition }}
                />
                <text
                  x={x + BAR_W / 2}
                  y={y - 5}
                  fontSize="9"
                  fill={isTop ? 'var(--hue-sky)' : 'var(--text-dim)'}
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight={isTop ? 700 : 500}
                >
                  {p.toFixed(2)}
                </text>
                <text
                  x={x + BAR_W / 2}
                  y={BASELINE_Y + 14}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--serif)"
                  fontStyle="italic"
                  textAnchor="middle"
                >
                  {CLASS_LABELS[i]}
                </text>
              </g>
            );
          })}

          {/* schedule preview strip */}
          <text
            x={PAD_X}
            y={STRIP_TOP - 6}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            SCHEDULE  ({schedule})
          </text>
          <text
            x={W - PAD_X}
            y={STRIP_TOP - 6}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
            letterSpacing="0.06em"
          >
            T₀={T0.toFixed(1)}  →  T_N=1.0
          </text>
          <rect
            x={stripX0}
            y={STRIP_TOP}
            width={stripX1 - stripX0}
            height={STRIP_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.55"
            rx="4"
          />
          <path d={previewPath} fill="none" stroke="var(--accent)" strokeWidth="1.6" opacity="0.85" />
          <line
            x1={curX}
            y1={STRIP_TOP}
            x2={curX}
            y2={STRIP_TOP + STRIP_H}
            stroke="var(--hue-mint)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <circle cx={curX} cy={curY} r="3.5" fill="var(--hue-mint)" stroke="var(--bg)" strokeWidth="1" />
          <text
            x={curX + 6}
            y={curY - 4}
            fontSize="8.5"
            fill="var(--hue-mint)"
            fontFamily="var(--mono)"
            fontWeight="700"
          >
            T={T.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="mlviz-toggles" style={{ borderBottom: 'none' }}>
        {SCHEDULES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`mlviz-toggle ${schedule === s.id ? 'is-on' : ''}`}
            onClick={() => setSchedule(s.id)}
            style={{ '--toggle-color': 'var(--accent)' }}
          >
            <span className="mlviz-toggle-dot" />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              starting T
            </span>
            <input
              type="range"
              min="2"
              max="10"
              step="0.1"
              value={T0}
              onChange={(e) => setT0(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{T0.toFixed(1)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">current T</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{T.toFixed(2)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">top-1 prob</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{top1.toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-sub">entropy H</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{ent.toFixed(3)}</span>
            <span className="mlviz-sub">/ max {maxEnt.toFixed(3)}</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.2rem' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.82rem' }}
            dangerouslySetInnerHTML={{ __html: scheduleHtml }}
          />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={handleToggle}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{step >= TOTAL_STEPS ? 'Restart' : isRunning ? 'Pause' : 'Train'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleStep} disabled={isRunning || step >= TOTAL_STEPS}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {step} / {TOTAL_STEPS} steps
          </span>
        </div>

        <div className="mlviz-hint">
          high T early reveals dark knowledge · anneal to T=1 to sharpen the target
        </div>
      </div>
    </div>
  );
}
