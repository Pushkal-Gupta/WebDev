import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, RotateCcw, Thermometer, Zap } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

const TEACHER_LOGITS = [3.5, 1.8, 0.7, -0.2, -1.0];
const STUDENT_INIT = [0.2, 0.0, -0.1, 0.3, -0.4];
const N = TEACHER_LOGITS.length;
const CLASS_LABELS = ['husky', 'wolf', 'malamute', 'corgi', 'goldfish'];
const TRUE_CLASS = 0;
const DEFAULT_T = 2.0;
const DEFAULT_ALPHA = 0.7;
const LR = 0.55;
const MAX_STEPS = 60;
const STEP_MS = 220;

const W = 720;
const H = 320;
const PANEL_PAD_X = 18;
const PANEL_GAP = 20;
const PANEL_W = (W - PANEL_PAD_X * 2 - PANEL_GAP) / 2;
const PANEL_TOP = 32;
const PANEL_H = H - PANEL_TOP - 56;
const BAR_GAP = 8;
const BAR_W = (PANEL_W - BAR_GAP * (N + 1) - 12) / N;
const PROB_AREA_H = PANEL_H - 56;

const TEACHER_X = PANEL_PAD_X;
const STUDENT_X = PANEL_PAD_X + PANEL_W + PANEL_GAP;

function softmaxWithTemp(logits, T) {
  const t = Math.max(0.0001, T);
  const scaled = logits.map((z) => z / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

function klDivergence(p, q) {
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], 1e-12);
    const qi = Math.max(q[i], 1e-12);
    kl += pi * Math.log(pi / qi);
  }
  return Math.max(0, kl);
}

function crossEntropy(yIdx, p) {
  return -Math.log(Math.max(p[yIdx], 1e-12));
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function gradStep(studentLogits, teacherLogits, T, alpha, lr) {
  const pT = softmaxWithTemp(teacherLogits, T);
  const pS_T = softmaxWithTemp(studentLogits, T);
  const pS_1 = softmaxWithTemp(studentLogits, 1);
  const next = studentLogits.slice();
  for (let i = 0; i < N; i++) {
    const gradKL = (pS_T[i] - pT[i]) * T;
    const oneHot = i === TRUE_CLASS ? 1 : 0;
    const gradCE = pS_1[i] - oneHot;
    const g = alpha * T * T * gradKL + (1 - alpha) * gradCE;
    next[i] = studentLogits[i] - lr * g;
  }
  return next;
}

export default function KnowledgeDistillationViz() {
  const [T, setT] = useState(DEFAULT_T);
  const [alpha, setAlpha] = useState(DEFAULT_ALPHA);
  const [studentLogits, setStudentLogits] = useState(STUDENT_INIT);
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

  const teacherProbsT = useMemo(() => softmaxWithTemp(TEACHER_LOGITS, T), [T]);
  const teacherProbs1 = useMemo(() => softmaxWithTemp(TEACHER_LOGITS, 1), []);
  const studentProbsT = useMemo(() => softmaxWithTemp(studentLogits, T), [studentLogits, T]);
  const studentProbs1 = useMemo(() => softmaxWithTemp(studentLogits, 1), [studentLogits]);

  const kl = useMemo(() => klDivergence(teacherProbsT, studentProbsT), [teacherProbsT, studentProbsT]);
  const ce = useMemo(() => crossEntropy(TRUE_CLASS, studentProbs1), [studentProbs1]);
  const total = alpha * T * T * kl + (1 - alpha) * ce;

  const doStep = useCallback(() => {
    setStudentLogits((prev) => gradStep(prev, TEACHER_LOGITS, T, alpha, LR));
    setStep((s) => s + 1);
  }, [T, alpha]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const ms = reducedMotion ? 40 : STEP_MS;
    timerRef.current = setInterval(() => {
      setStudentLogits((prev) => gradStep(prev, TEACHER_LOGITS, T, alpha, LR));
      setStep((s) => s + 1);
    }, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, reducedMotion, T, alpha]);

  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setStudentLogits(STUDENT_INIT);
    setStep(0);
  }, []);

  const handleToggle = useCallback(() => {
    if (step >= MAX_STEPS) {
      setStudentLogits(STUDENT_INIT);
      setStep(0);
      setIsRunningRaw(true);
      return;
    }
    setIsRunningRaw((r) => !r);
  }, [step]);

  const trainLabel = step >= MAX_STEPS ? 'Restart' : isRunning ? 'Pause' : 'Train';

  const transition = reducedMotion ? 'none' : 'height 0.28s ease, y 0.28s ease, fill 0.28s ease';

  const formulaHtml = useMemo(
    () => katexHtml(
      'L = \\alpha \\cdot T^{2} \\cdot \\mathrm{KL}(p^{T}\\,\\|\\,p^{S}) + (1-\\alpha)\\,\\mathrm{CE}(y,\\,p^{S}_{T=1})',
      false
    ),
    []
  );

  const klHtml = useMemo(() => katexHtml('\\mathrm{KL}(p^{T}\\|p^{S})', false), []);
  const ceHtml = useMemo(() => katexHtml('\\mathrm{CE}(y, p^{S}_{T=1})', false), []);
  const totalHtml = useMemo(() => katexHtml('L_{\\text{total}}', false), []);

  function renderPanel(originX, label, sublabel, probs, color, fadeColor) {
    const baselineY = PANEL_TOP + PANEL_H - 28;
    return (
      <g>
        <text
          x={originX}
          y={PANEL_TOP - 12}
          fontSize="10"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          letterSpacing="0.14em"
          textAnchor="start"
        >
          {label}
        </text>
        <text
          x={originX + PANEL_W}
          y={PANEL_TOP - 12}
          fontSize="9.5"
          fill={color}
          fontFamily="var(--mono)"
          textAnchor="end"
          fontWeight="700"
        >
          {sublabel}
        </text>
        <rect
          x={originX}
          y={PANEL_TOP - 4}
          width={PANEL_W}
          height={PANEL_H}
          fill="var(--bg)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="8"
          opacity="0.6"
        />
        <line
          x1={originX + 6}
          y1={baselineY}
          x2={originX + PANEL_W - 6}
          y2={baselineY}
          stroke="var(--border)"
          strokeWidth="1"
        />
        {probs.map((p, i) => {
          const h = Math.max(1, p * PROB_AREA_H);
          const x = originX + 6 + BAR_GAP + i * (BAR_W + BAR_GAP);
          const y = baselineY - h;
          const isTrue = i === TRUE_CLASS;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={h}
                fill={isTrue ? color : fadeColor}
                opacity={isTrue ? 0.95 : 0.7}
                rx="2"
                style={{ transition }}
              />
              <text
                x={x + BAR_W / 2}
                y={y - 5}
                fontSize="9"
                fill={isTrue ? color : 'var(--text-dim)'}
                fontFamily="var(--mono)"
                textAnchor="middle"
                fontWeight={isTrue ? 700 : 500}
              >
                {p.toFixed(2)}
              </text>
              <text
                x={x + BAR_W / 2}
                y={baselineY + 14}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--serif)"
                fontStyle="italic"
                textAnchor="middle"
              >
                {CLASS_LABELS[i]}
              </text>
              {isTrue && (
                <text
                  x={x + BAR_W / 2}
                  y={baselineY + 26}
                  fontSize="8"
                  fill="var(--accent)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.1em"
                >
                  y=1
                </text>
              )}
            </g>
          );
        })}
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
            <marker
              id="kd-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" opacity="0.7" />
            </marker>
          </defs>

          {renderPanel(
            TEACHER_X,
            `TEACHER  p^T  (T=${T.toFixed(1)})`,
            `argmax = ${CLASS_LABELS[teacherProbsT.indexOf(Math.max(...teacherProbsT))]}`,
            teacherProbsT,
            'var(--hue-sky)',
            'var(--hue-sky)'
          )}

          {renderPanel(
            STUDENT_X,
            `STUDENT  p^S  (step ${step})`,
            step >= MAX_STEPS ? 'converged' : isRunning ? 'training…' : 'paused',
            studentProbsT,
            'var(--hue-pink)',
            'var(--hue-pink)'
          )}

          {/* arrow showing distillation direction */}
          <g opacity="0.85">
            <line
              x1={TEACHER_X + PANEL_W + 2}
              y1={PANEL_TOP + PANEL_H / 2}
              x2={STUDENT_X - 2}
              y2={PANEL_TOP + PANEL_H / 2}
              stroke="var(--accent)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              markerEnd="url(#kd-arrow)"
            />
            <text
              x={(TEACHER_X + PANEL_W + STUDENT_X) / 2}
              y={PANEL_TOP + PANEL_H / 2 - 8}
              fontSize="9.5"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              letterSpacing="0.1em"
              fontWeight="700"
            >
              distill
            </text>
            <text
              x={(TEACHER_X + PANEL_W + STUDENT_X) / 2}
              y={PANEL_TOP + PANEL_H / 2 + 16}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              T²·∇KL
            </text>
          </g>

          {/* teacher hard vs soft hint */}
          <text
            x={TEACHER_X}
            y={H - 28}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            {`hard: p[0]=${teacherProbs1[0].toFixed(2)}  •  softened: p[0]=${teacherProbsT[0].toFixed(2)}`}
          </text>
          <text
            x={STUDENT_X}
            y={H - 28}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            {`target = teacher's softened distribution`}
          </text>
          <text
            x={W / 2}
            y={H - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            higher T → flatter distribution → more dark knowledge revealed
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              temperature T
            </span>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={T}
              onChange={(e) => setT(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{T.toFixed(1)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">mixing α</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{alpha.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span dangerouslySetInnerHTML={{ __html: klHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{snap(kl).toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span dangerouslySetInnerHTML={{ __html: ceHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{snap(ce).toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span dangerouslySetInnerHTML={{ __html: totalHtml }} />
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {snap(total).toFixed(3)}
            </span>
          </span>
          <span className="mlviz-sub">
            = {snap(alpha * T * T).toFixed(2)} · KL + {snap(1 - alpha).toFixed(2)} · CE
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
            <span>{trainLabel}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={doStep} disabled={isRunning || step >= MAX_STEPS}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {step} / {MAX_STEPS} steps
          </span>
        </div>

        <div className="mlviz-hint">
          drag T to soften the teacher · press Train to watch the student match
        </div>
      </div>
    </div>
  );
}
