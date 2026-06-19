import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, Thermometer } from 'lucide-react';
import './MLViz.css';

function mulberry32(a) {
  return function () {
    let t = (a = (a + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 720;
const H = 360;
const SEED = 0xCAFEBABE;
const MAX_STEPS = 24;
const STEP_MS = 600;

const SEED_PROMPT = 'The cat sat on the';

const VOCAB = [
  { tok: 'mat', logit: 3.1 },
  { tok: 'rug', logit: 2.4 },
  { tok: 'chair', logit: 2.0 },
  { tok: 'floor', logit: 1.8 },
  { tok: 'sofa', logit: 1.3 },
  { tok: 'table', logit: 0.9 },
  { tok: 'roof', logit: 0.2 },
  { tok: 'fence', logit: -0.2 },
  { tok: 'cloud', logit: -0.6 },
  { tok: 'star', logit: -1.1 },
];

const CONTINUATIONS = {
  mat: [
    { tok: 'and', logit: 2.6 },
    { tok: 'while', logit: 1.7 },
    { tok: 'then', logit: 1.3 },
    { tok: 'purring', logit: 1.1 },
    { tok: 'softly', logit: 0.8 },
    { tok: 'silently', logit: 0.5 },
    { tok: 'briefly', logit: 0.1 },
    { tok: 'again', logit: -0.3 },
    { tok: 'maybe', logit: -0.7 },
    { tok: 'never', logit: -1.0 },
  ],
  default: [
    { tok: 'and', logit: 2.4 },
    { tok: 'while', logit: 2.0 },
    { tok: 'then', logit: 1.5 },
    { tok: 'as', logit: 1.2 },
    { tok: 'softly', logit: 0.9 },
    { tok: 'quietly', logit: 0.6 },
    { tok: 'briefly', logit: 0.3 },
    { tok: 'again', logit: -0.1 },
    { tok: 'maybe', logit: -0.5 },
    { tok: 'never', logit: -0.9 },
  ],
};

// alternate small vocab pools used after each token
const POOL_POOLS = [
  [
    { tok: 'the', logit: 2.9 },
    { tok: 'a', logit: 2.4 },
    { tok: 'small', logit: 1.6 },
    { tok: 'tired', logit: 1.2 },
    { tok: 'happy', logit: 0.9 },
    { tok: 'curious', logit: 0.6 },
    { tok: 'old', logit: 0.3 },
    { tok: 'cold', logit: -0.1 },
    { tok: 'wet', logit: -0.5 },
    { tok: 'angry', logit: -0.9 },
  ],
  [
    { tok: 'dog', logit: 2.7 },
    { tok: 'cat', logit: 2.5 },
    { tok: 'bird', logit: 1.9 },
    { tok: 'owl', logit: 1.4 },
    { tok: 'mouse', logit: 1.0 },
    { tok: 'fox', logit: 0.6 },
    { tok: 'frog', logit: 0.2 },
    { tok: 'snail', logit: -0.2 },
    { tok: 'crow', logit: -0.6 },
    { tok: 'beetle', logit: -1.0 },
  ],
  [
    { tok: 'looked', logit: 2.5 },
    { tok: 'watched', logit: 2.1 },
    { tok: 'waited', logit: 1.7 },
    { tok: 'slept', logit: 1.3 },
    { tok: 'dreamed', logit: 0.9 },
    { tok: 'sighed', logit: 0.5 },
    { tok: 'purred', logit: 0.1 },
    { tok: 'rolled', logit: -0.3 },
    { tok: 'jumped', logit: -0.7 },
    { tok: 'vanished', logit: -1.1 },
  ],
];

function softmaxWithTemp(logits, T) {
  const t = Math.max(0.0001, T);
  const scaled = logits.map((z) => z / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

function entropy(probs) {
  let s = 0;
  for (const p of probs) {
    if (p > 1e-12) s += -p * Math.log(p);
  }
  return s;
}

// top-p filter: keep smallest set of tokens whose cumulative prob >= p, renormalize
function topPFilter(probs, p) {
  const idx = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
  const out = new Array(probs.length).fill(0);
  let cum = 0;
  for (const i of idx) {
    out[i] = probs[i];
    cum += probs[i];
    if (cum >= p) break;
  }
  const s = out.reduce((a, b) => a + b, 0) || 1;
  return out.map((x) => x / s);
}

function sampleFromProbs(probs, rng) {
  const u = rng();
  let c = 0;
  for (let i = 0; i < probs.length; i++) {
    c += probs[i];
    if (u <= c) return i;
  }
  return probs.length - 1;
}

function vocabForStep(stepIdx, prevTok) {
  if (stepIdx === 0) return VOCAB;
  if (stepIdx === 1) {
    if (prevTok && CONTINUATIONS[prevTok]) return CONTINUATIONS[prevTok];
    return CONTINUATIONS.default;
  }
  return POOL_POOLS[(stepIdx - 2) % POOL_POOLS.length];
}

export default function TokenGenerationStreamViz() {
  const [temperature, setTemperature] = useState(0.9);
  const [topP, setTopP] = useState(0.9);
  const [tokens, setTokens] = useState([]); // [{tok, logProb}]
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [lastSample, setLastSample] = useState(null);
  const rngRef = useRef(null);
  const timerRef = useRef(null);

  if (rngRef.current == null) rngRef.current = mulberry32(SEED);

  const isRunning = isRunningRaw && step < MAX_STEPS;

  const prevTok = tokens.length > 0 ? tokens[tokens.length - 1].tok : null;
  const currentVocab = useMemo(() => vocabForStep(step, prevTok), [step, prevTok]);
  const baseLogits = useMemo(() => currentVocab.map((v) => v.logit), [currentVocab]);

  const rawProbs = useMemo(() => softmaxWithTemp(baseLogits, temperature), [baseLogits, temperature]);
  const filteredProbs = useMemo(() => topPFilter(rawProbs, topP), [rawProbs, topP]);
  const distEntropy = useMemo(() => entropy(filteredProbs), [filteredProbs]);
  const cumLogProb = useMemo(() => tokens.reduce((s, t) => s + t.logProb, 0), [tokens]);

  const doStep = useCallback(() => {
    if (step >= MAX_STEPS) return;
    const idx = sampleFromProbs(filteredProbs, rngRef.current);
    const tok = currentVocab[idx].tok;
    const lp = Math.log(Math.max(filteredProbs[idx], 1e-12));
    setTokens((prev) => [...prev, { tok, logProb: lp }]);
    setLastSample({ idx, tok, prob: filteredProbs[idx] });
    setStep((s) => s + 1);
  }, [step, filteredProbs, currentVocab]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      doStep();
    }, STEP_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning, doStep]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTokens([]);
    setStep(0);
    setLastSample(null);
    rngRef.current = mulberry32(SEED);
  }, []);

  const handlePlay = useCallback(() => {
    if (step >= MAX_STEPS) {
      handleReset();
      setIsRunning(true);
      return;
    }
    setIsRunning((r) => !r);
  }, [step, handleReset]);

  const runningText = useMemo(() => {
    const body = tokens.map((t) => t.tok).join(' ');
    return body ? `${SEED_PROMPT} ${body}` : SEED_PROMPT;
  }, [tokens]);

  // SVG layout
  const TEXT_BOX_X = 18;
  const TEXT_BOX_Y = 24;
  const TEXT_BOX_W = W - 36;
  const TEXT_BOX_H = 70;

  const BAR_BOX_X = 18;
  const BAR_BOX_Y = TEXT_BOX_Y + TEXT_BOX_H + 18;
  const BAR_BOX_W = W - 36;
  const BAR_BOX_H = H - BAR_BOX_Y - 30;
  const rowH = (BAR_BOX_H - 28) / VOCAB.length;
  const labelColW = 70;
  const barAreaX = BAR_BOX_X + labelColW + 8;
  const barAreaW = BAR_BOX_W - labelColW - 70;

  // Wrap text into multiple lines to never overflow
  const wrappedLines = useMemo(() => {
    const charsPerLine = 60;
    const words = runningText.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= charsPerLine) {
        cur = (cur + ' ' + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(-3); // max 3 visible lines
  }, [runningText]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', maxWidth: '100%', height: 'auto', aspectRatio: `${W} / ${H}`, display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Running text box */}
          <rect
            x={TEXT_BOX_X}
            y={TEXT_BOX_Y}
            width={TEXT_BOX_W}
            height={TEXT_BOX_H}
            fill="var(--bg)"
            stroke="var(--border)"
            rx="8"
          />
          <text
            x={TEXT_BOX_X + 8}
            y={TEXT_BOX_Y - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            GENERATED STREAM
          </text>
          {wrappedLines.map((line, i) => (
            <text
              key={i}
              x={TEXT_BOX_X + 12}
              y={TEXT_BOX_Y + 22 + i * 18}
              fontSize="13"
              fill="var(--text-main)"
              fontFamily="var(--mono)"
            >
              {line}
              {i === wrappedLines.length - 1 && step < MAX_STEPS && (
                <tspan
                  fill="var(--accent)"
                  style={{ animation: 'blink 1s steps(2) infinite' }}
                >
                  {' '}▌
                </tspan>
              )}
            </text>
          ))}
          <text
            x={TEXT_BOX_X + TEXT_BOX_W - 8}
            y={TEXT_BOX_Y + TEXT_BOX_H - 8}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
          >
            step {step}/{MAX_STEPS}
          </text>

          {/* Distribution box */}
          <rect
            x={BAR_BOX_X}
            y={BAR_BOX_Y}
            width={BAR_BOX_W}
            height={BAR_BOX_H}
            fill="var(--bg)"
            stroke="var(--border)"
            rx="8"
          />
          <text
            x={BAR_BOX_X + 8}
            y={BAR_BOX_Y - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            NEXT-TOKEN CANDIDATES  (T={temperature.toFixed(2)}, top-p={topP.toFixed(2)})
          </text>

          {currentVocab.map((v, i) => {
            const y = BAR_BOX_Y + 14 + i * rowH;
            const p = filteredProbs[i];
            const pRaw = rawProbs[i];
            const inFilter = p > 0;
            const barW = Math.max(1, p * barAreaW);
            const justSampled = lastSample && lastSample.idx === i;
            const color = justSampled
              ? 'var(--accent)'
              : inFilter
                ? 'var(--hue-sky)'
                : 'var(--text-dim)';
            return (
              <g key={i}>
                <text
                  x={BAR_BOX_X + 10}
                  y={y + rowH * 0.62}
                  fontSize="11"
                  fontFamily="var(--mono)"
                  fill={justSampled ? 'var(--accent)' : 'var(--text-main)'}
                  fontWeight={justSampled ? 700 : 500}
                >
                  {v.tok}
                </text>
                <rect
                  x={barAreaX}
                  y={y + 4}
                  width={Math.max(1, pRaw * barAreaW)}
                  height={rowH - 8}
                  fill="var(--text-dim)"
                  opacity="0.18"
                  rx="2"
                />
                <rect
                  x={barAreaX}
                  y={y + 4}
                  width={barW}
                  height={rowH - 8}
                  fill={color}
                  opacity={inFilter ? 0.85 : 0.35}
                  rx="2"
                  style={{ transition: 'width 0.3s ease, fill 0.2s ease' }}
                />
                <text
                  x={barAreaX + barAreaW + 8}
                  y={y + rowH * 0.62}
                  fontSize="10"
                  fontFamily="var(--mono)"
                  fill={inFilter ? 'var(--text-main)' : 'var(--text-dim)'}
                >
                  {p.toFixed(3)}
                </text>
              </g>
            );
          })}

          {/* horizontal label divider */}
          <line
            x1={barAreaX}
            y1={BAR_BOX_Y + BAR_BOX_H - 4}
            x2={barAreaX + barAreaW}
            y2={BAR_BOX_Y + BAR_BOX_H - 4}
            stroke="var(--border)"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              temperature
            </span>
            <input
              type="range"
              min="0.05"
              max="2"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{temperature.toFixed(2)}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">top-p</span>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{topP.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>cum log-prob</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{cumLogProb.toFixed(3)}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>H(dist)</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{distEntropy.toFixed(3)}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>tokens</span>
            <span className="mlviz-val">{tokens.length}</span>
          </span>
          {lastSample && (
            <span>
              <span className="mlviz-slider-label" style={{ marginRight: 6 }}>last p</span>
              <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{lastSample.prob.toFixed(3)}</span>
            </span>
          )}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={handlePlay}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{step >= MAX_STEPS ? 'Restart' : isRunning ? 'Pause' : 'Play'}</span>
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
            faded bar = raw softmax · solid = post top-p
          </span>
        </div>

        <div className="mlviz-hint">
          T → 0 makes argmax · T → ∞ flattens · top-p clips the tail
        </div>
      </div>
    </div>
  );
}
