import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Sliders, Zap } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * SpeculativeDecodingViz
 *
 * A small draft model proposes K candidate tokens ahead of the target.
 * The target verifies all K positions in a single forward pass. Tokens
 * where draft == target are accepted (green) and march forward; the first
 * mismatch becomes the target's choice (pink) and remaining draft tokens
 * are discarded.
 */

const W = 720;
const H = 320;
const PAD_X = 22;

const VOCAB = ['the', 'cat', 'sat', 'on', 'mat', 'red', 'ran', 'far', 'jumped', 'high', 'fox', 'sleeps', 'rug'];
const SEED = 11;
const DEFAULT_K = 5;
const STEP_MS = 1100;
const MAX_STEPS = 6;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

function buildRound(rng, K, baseAgreement = 0.78) {
  const draft = [];
  const target = [];
  for (let i = 0; i < K; i++) {
    const draftTok = VOCAB[Math.floor(rng() * VOCAB.length)];
    const agreement = baseAgreement * Math.pow(0.93, i);
    const matched = rng() < agreement;
    const targetTok = matched ? draftTok : VOCAB[Math.floor(rng() * VOCAB.length)];
    draft.push(draftTok);
    target.push(targetTok);
  }
  let acceptedUpTo = 0;
  while (acceptedUpTo < K && draft[acceptedUpTo] === target[acceptedUpTo]) acceptedUpTo++;
  return { draft, target, acceptedUpTo };
}

export default function SpeculativeDecodingViz() {
  const [K, setK] = useState(DEFAULT_K);
  const [phase, setPhase] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
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

  const rounds = useMemo(() => {
    const r = mulberry32(SEED + K * 31);
    const arr = [];
    for (let i = 0; i < MAX_STEPS; i++) arr.push(buildRound(r, K));
    return arr;
  }, [K]);

  const currentRound = rounds[stepIdx % MAX_STEPS];

  const acceptedHistory = useMemo(() => {
    let tokens = [];
    for (let i = 0; i < stepIdx; i++) {
      const r = rounds[i % MAX_STEPS];
      tokens = tokens.concat(r.draft.slice(0, r.acceptedUpTo));
      if (r.acceptedUpTo < K) tokens.push(r.target[r.acceptedUpTo]);
    }
    return tokens;
  }, [rounds, stepIdx, K]);

  const tokensPerStep = useMemo(() => {
    if (stepIdx === 0) {
      let expectedAcc = 0;
      let surv = 1;
      for (let i = 0; i < K; i++) {
        const p = 0.78 * Math.pow(0.93, i);
        surv *= p;
        expectedAcc += surv;
      }
      return expectedAcc + 1;
    }
    let total = 0;
    for (let i = 0; i < stepIdx; i++) {
      const r = rounds[i % MAX_STEPS];
      total += r.acceptedUpTo + 1;
    }
    return total / stepIdx;
  }, [rounds, stepIdx, K]);

  const advance = useCallback(() => {
    setPhase((p) => {
      if (p < 2) return p + 1;
      setStepIdx((s) => (s + 1) % MAX_STEPS);
      return 0;
    });
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const ms = reducedMotion ? 80 : STEP_MS;
    timerRef.current = setInterval(advance, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, reducedMotion, advance]);

  const handleReset = () => {
    setIsRunning(false);
    setStepIdx(0);
    setPhase(0);
  };

  const handleStep = () => advance();

  const laneTop = 56;
  const laneH = 70;
  const targetTop = 160;
  const acceptedTop = 252;

  const slotL = PAD_X + 110;
  const slotR = W - PAD_X - 14;
  const slotGap = 6;
  const slotW = (slotR - slotL - slotGap * (K - 1)) / K;

  const transition = reducedMotion ? 'none' : 'opacity 0.25s ease, fill 0.25s ease';

  const formulaHtml = useMemo(
    () => katexHtml('\\mathbb{E}[\\text{tokens/step}] = 1 + \\tfrac{\\alpha\\,(1-\\alpha^{K})}{1-\\alpha}'),
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
          {/* DRAFT lane label */}
          <text x={PAD_X} y={laneTop + 16} fontSize="10" fill="var(--hue-sky)" fontFamily="var(--mono)" letterSpacing="0.12em" fontWeight="700">
            DRAFT
          </text>
          <text x={PAD_X} y={laneTop + 32} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
            small model
          </text>
          <text x={PAD_X} y={laneTop + 46} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
            K tokens
          </text>

          <rect
            x={slotL - 6}
            y={laneTop - 6}
            width={slotR - slotL + 12}
            height={laneH}
            rx={6}
            fill="var(--surface)"
            stroke="var(--hue-sky)"
            strokeWidth="1"
            opacity="0.4"
          />

          {currentRound.draft.map((tok, i) => {
            const x = slotL + i * (slotW + slotGap);
            const emittedAtPhase0 = i <= Math.floor((K - 1) * 0.6);
            const visible = phase >= 1 || emittedAtPhase0;
            return (
              <g key={`d-${i}`} style={{ transition, opacity: visible ? 1 : 0.18 }}>
                <rect
                  x={x}
                  y={laneTop}
                  width={slotW}
                  height={42}
                  rx={5}
                  fill="var(--hue-sky)"
                  opacity="0.32"
                  stroke="var(--hue-sky)"
                  strokeWidth="1"
                />
                <text
                  x={x + slotW / 2}
                  y={laneTop + 19}
                  fontSize="11"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {tok}
                </text>
                <text
                  x={x + slotW / 2}
                  y={laneTop + 34}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  t+{i + 1}
                </text>
              </g>
            );
          })}

          {/* TARGET lane label */}
          <text x={PAD_X} y={targetTop + 16} fontSize="10" fill="var(--accent)" fontFamily="var(--mono)" letterSpacing="0.12em" fontWeight="700">
            TARGET
          </text>
          <text x={PAD_X} y={targetTop + 32} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
            big model
          </text>
          <text x={PAD_X} y={targetTop + 46} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
            1 forward pass
          </text>

          <rect
            x={slotL - 6}
            y={targetTop - 6}
            width={slotR - slotL + 12}
            height={laneH}
            rx={6}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth="1"
            opacity="0.45"
          />

          {currentRound.target.map((tok, i) => {
            const x = slotL + i * (slotW + slotGap);
            const verifyingFlash = phase === 1;
            const resolved = phase >= 2;
            const accepted = i < currentRound.acceptedUpTo;
            const firstReject = resolved && i === currentRound.acceptedUpTo && i < K;
            const discarded = resolved && i > currentRound.acceptedUpTo;

            let fill = 'var(--accent)';
            let opacity = 0.32;
            if (verifyingFlash) opacity = 0.7;
            if (resolved) {
              if (accepted) {
                fill = 'var(--easy, var(--accent))';
                opacity = 0.78;
              } else if (firstReject) {
                fill = 'var(--hue-pink)';
                opacity = 0.78;
              } else if (discarded) {
                fill = 'var(--text-dim)';
                opacity = 0.22;
              }
            }

            const shown = phase === 0 ? '?' : tok;

            const status = resolved
              ? accepted
                ? 'ok'
                : firstReject
                ? 'fix'
                : 'drop'
              : verifyingFlash
              ? 'verify'
              : '';

            return (
              <g key={`t-${i}`} style={{ transition }}>
                <rect
                  x={x}
                  y={targetTop}
                  width={slotW}
                  height={42}
                  rx={5}
                  fill={fill}
                  opacity={opacity}
                  stroke={resolved && firstReject ? 'var(--hue-pink)' : 'var(--accent)'}
                  strokeWidth="1"
                />
                <text
                  x={x + slotW / 2}
                  y={targetTop + 19}
                  fontSize="11"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {shown}
                </text>
                <text
                  x={x + slotW / 2}
                  y={targetTop + 34}
                  fontSize="8"
                  fill={resolved ? (accepted ? 'var(--easy, var(--accent))' : firstReject ? 'var(--hue-pink)' : 'var(--text-dim)') : 'var(--text-dim)'}
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  {status}
                </text>
              </g>
            );
          })}

          {/* Sequence ribbon */}
          <text x={PAD_X} y={acceptedTop + 14} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            SEQUENCE
          </text>
          <rect
            x={slotL - 6}
            y={acceptedTop}
            width={slotR - slotL + 12}
            height={40}
            rx={6}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.7"
          />
          {(() => {
            const N_RIBBON = 14;
            const tokens = acceptedHistory.slice(-N_RIBBON);
            const stripW = (slotR - slotL + 12 - 12) / N_RIBBON;
            return tokens.map((tok, i) => {
              const x = slotL - 6 + 6 + i * stripW;
              return (
                <g key={`a-${i}`} style={{ transition }}>
                  <rect
                    x={x + 1}
                    y={acceptedTop + 6}
                    width={stripW - 2}
                    height={28}
                    rx={4}
                    fill="var(--accent)"
                    opacity="0.18"
                  />
                  <text
                    x={x + stripW / 2}
                    y={acceptedTop + 24}
                    fontSize="9.5"
                    fill="var(--accent)"
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {tok}
                  </text>
                </g>
              );
            });
          })()}

          {/* connection lines */}
          {Array.from({ length: K }).map((_, i) => {
            const x = slotL + i * (slotW + slotGap) + slotW / 2;
            return (
              <line
                key={`c-${i}`}
                x1={x}
                y1={laneTop + 42}
                x2={x}
                y2={targetTop}
                stroke="var(--text-dim)"
                strokeWidth="0.7"
                opacity="0.35"
                strokeDasharray="2 3"
              />
            );
          })}

          <text
            x={W / 2}
            y={H - 8}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            {phase === 0
              ? 'draft proposing K tokens sequentially…'
              : phase === 1
              ? 'target verifies all K in one forward pass'
              : `accepted ${currentRound.acceptedUpTo}/${K}, target adds the fix token`}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              speculation depth K
            </span>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={K}
              onChange={(e) => {
                setK(parseInt(e.target.value, 10));
                setStepIdx(0);
                setPhase(0);
              }}
            />
            <span className="mlviz-slider-val">{K}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              tokens / step
            </span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {tokensPerStep.toFixed(2)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              speedup vs greedy
            </span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)', fontWeight: 800 }}>
              {tokensPerStep.toFixed(2)}×
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              accepted this step
            </span>
            <span className="mlviz-val" style={{ color: 'var(--easy, var(--accent))' }}>
              {currentRound.acceptedUpTo} / {K}
            </span>
          </span>
          <span className="mlviz-sub">step {stepIdx}</span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem' }}>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={() => setIsRunning((r) => !r)}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleStep} disabled={isRunning}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            phase {phase + 1} of 3
          </span>
        </div>

        <div className="mlviz-hint">
          increase K to chase a bigger speedup · gains plateau as draft drifts further from target
        </div>
      </div>
    </div>
  );
}
