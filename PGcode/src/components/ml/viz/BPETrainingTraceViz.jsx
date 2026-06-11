import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Zap, Layers } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 360;
const STEP_MS = 950;
const CORPUS = ['banana', 'ananas', 'anaconda'];

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initialTokens(words) {
  return words.map((w) => Array.from(w));
}

function countPairs(tokenized) {
  const counts = new Map();
  for (const word of tokenized) {
    for (let i = 0; i < word.length - 1; i++) {
      const k = word[i] + '' + word[i + 1];
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  return counts;
}

function topPair(counts, rng) {
  let best = null;
  let bestCount = 0;
  const ties = [];
  for (const [k, c] of counts) {
    if (c > bestCount) {
      bestCount = c;
      best = k;
      ties.length = 0;
      ties.push(k);
    } else if (c === bestCount) {
      ties.push(k);
    }
  }
  if (ties.length > 1) {
    // deterministic tiebreak: alphabetical first, but salt with rng for variety
    ties.sort();
    const pick = Math.floor(rng() * ties.length);
    best = ties[pick];
  }
  if (!best) return null;
  const [a, b] = best.split('');
  return { a, b, count: bestCount };
}

function mergePair(tokenized, a, b) {
  const merged = a + b;
  return tokenized.map((word) => {
    const out = [];
    let i = 0;
    while (i < word.length) {
      if (i < word.length - 1 && word[i] === a && word[i + 1] === b) {
        out.push(merged);
        i += 2;
      } else {
        out.push(word[i]);
        i++;
      }
    }
    return out;
  });
}

function buildTrace(maxMerges, seedRng) {
  const initialVocab = new Set();
  for (const w of CORPUS) for (const ch of w) initialVocab.add(ch);

  const frames = [];
  let tokenized = initialTokens(CORPUS);
  let vocab = new Set(initialVocab);
  frames.push({
    tokenized: tokenized.map((w) => w.slice()),
    vocab: Array.from(vocab),
    lastMerge: null,
    topPair: null,
    step: 0,
  });

  for (let step = 1; step <= maxMerges; step++) {
    const counts = countPairs(tokenized);
    const tp = topPair(counts, seedRng);
    if (!tp || tp.count < 2) break;
    const merged = tp.a + tp.b;
    tokenized = mergePair(tokenized, tp.a, tp.b);
    vocab = new Set(vocab);
    vocab.add(merged);
    frames.push({
      tokenized: tokenized.map((w) => w.slice()),
      vocab: Array.from(vocab),
      lastMerge: { a: tp.a, b: tp.b, merged, count: tp.count },
      topPair: tp,
      step,
    });
  }
  return frames;
}

function tokenColor(tok) {
  if (tok.length === 1) return 'var(--text-dim)';
  if (tok.length === 2) return 'var(--hue-sky)';
  if (tok.length === 3) return 'var(--hue-mint)';
  if (tok.length === 4) return 'var(--hue-pink)';
  return 'var(--hue-violet)';
}

function tokenFill(tok) {
  if (tok.length === 1) return 'rgba(var(--accent-rgb, 0,255,245), 0.04)';
  return 'rgba(var(--accent-rgb, 0,255,245), 0.12)';
}

export default function BPETrainingTraceViz() {
  const [maxMerges, setMaxMerges] = useState(12);
  const [seed] = useState(7);
  const [stepIdx, setStepIdx] = useState(0);
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

  const rng = useMemo(() => mulberry32(seed), [seed]);
  const frames = useMemo(() => buildTrace(maxMerges, rng), [maxMerges, rng]);
  const totalSteps = frames.length;

  useEffect(() => {
    if (stepIdx >= totalSteps) setStepIdx(totalSteps - 1);
  }, [totalSteps, stepIdx]);

  const isRunning = isRunningRaw && stepIdx < totalSteps - 1;

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    const ms = reducedMotion ? 60 : STEP_MS;
    timerRef.current = setInterval(() => {
      setStepIdx((s) => Math.min(s + 1, totalSteps - 1));
    }, ms);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isRunning, reducedMotion, totalSteps]);

  const frame = frames[Math.min(stepIdx, totalSteps - 1)];
  const handleToggle = useCallback(() => {
    if (stepIdx >= totalSteps - 1) { setStepIdx(0); setIsRunningRaw(true); return; }
    setIsRunningRaw((r) => !r);
  }, [stepIdx, totalSteps]);
  const handleStep = useCallback(() => setStepIdx((s) => Math.min(s + 1, totalSteps - 1)), [totalSteps]);
  const handleReset = useCallback(() => { setStepIdx(0); setIsRunningRaw(false); }, []);

  // Layout
  const LEFT_X = 18, LEFT_W = 460;
  const RIGHT_X = LEFT_X + LEFT_W + 16, RIGHT_W = W - RIGHT_X - 18;
  const HEAD_Y = 22;
  const CORP_Y = 50;
  const CORP_H = 200;
  const MERGE_Y = CORP_Y + CORP_H + 14;
  const MERGE_H = H - MERGE_Y - 14;

  const transition = reducedMotion ? 'none' : 'fill 0.25s ease, opacity 0.25s ease';

  // Render corpus as words → tokens with merges highlighted
  function renderWord(word, baseX, baseY, maxW) {
    const padX = 6, gap = 4;
    let x = baseX;
    const tokens = [];
    for (let i = 0; i < word.length; i++) {
      const tok = word[i];
      const charW = Math.max(14, 8 * tok.length + 8);
      const isJustMerged = frame.lastMerge && tok === frame.lastMerge.merged;
      tokens.push(
        <g key={`${i}-${tok}`} style={{ transition }}>
          <rect
            x={x} y={baseY - 11} width={charW} height={22}
            rx={5}
            fill={isJustMerged ? 'rgba(var(--accent-rgb, 0,255,245), 0.22)' : tokenFill(tok)}
            stroke={isJustMerged ? 'var(--accent)' : tokenColor(tok)}
            strokeWidth={isJustMerged ? 1.4 : 1}
            opacity={tok.length === 1 ? 0.85 : 1}
            style={{ transition }}
          />
          <text
            x={x + charW / 2}
            y={baseY + 4}
            fontSize="11"
            fill={isJustMerged ? 'var(--accent)' : 'var(--text-main)'}
            fontFamily="var(--mono)"
            textAnchor="middle"
            fontWeight={isJustMerged ? 700 : 600}
          >
            {tok}
          </text>
        </g>
      );
      x += charW + gap;
      if (x - baseX > maxW) break;
    }
    return tokens;
  }

  const vocab = frame.vocab;
  const merged = vocab.filter((v) => v.length > 1);
  const singles = vocab.filter((v) => v.length === 1);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* LEFT PANEL — corpus */}
          <text x={LEFT_X} y={HEAD_Y} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            CORPUS  ·  step {frame.step} / {totalSteps - 1}
          </text>
          <rect x={LEFT_X} y={CORP_Y - 16} width={LEFT_W} height={CORP_H} rx={8}
                fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />

          {frame.tokenized.map((word, wi) => (
            <g key={wi}>
              <text x={LEFT_X + 10} y={CORP_Y + 6 + wi * 56} fontSize="9" fill="var(--text-dim)"
                    fontFamily="var(--mono)" letterSpacing="0.12em">
                {`"${CORPUS[wi]}"`}
              </text>
              <g transform={`translate(0, ${CORP_Y + 24 + wi * 56})`}>
                {renderWord(word, LEFT_X + 10, 0, LEFT_W - 24)}
              </g>
            </g>
          ))}

          {/* MERGE bar */}
          <text x={LEFT_X} y={MERGE_Y - 4} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            CURRENT MERGE
          </text>
          <rect x={LEFT_X} y={MERGE_Y} width={LEFT_W} height={MERGE_H} rx={8}
                fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />

          {frame.lastMerge ? (
            <g>
              <rect x={LEFT_X + 16} y={MERGE_Y + 14} width={48} height={28} rx={5}
                    fill={tokenFill(frame.lastMerge.a)} stroke={tokenColor(frame.lastMerge.a)} />
              <text x={LEFT_X + 40} y={MERGE_Y + 32} fontSize="12" fill="var(--text-main)"
                    fontFamily="var(--mono)" textAnchor="middle" fontWeight={700}>
                {frame.lastMerge.a}
              </text>
              <text x={LEFT_X + 80} y={MERGE_Y + 32} fontSize="14" fill="var(--text-dim)"
                    fontFamily="var(--mono)" textAnchor="middle">+</text>
              <rect x={LEFT_X + 96} y={MERGE_Y + 14} width={48} height={28} rx={5}
                    fill={tokenFill(frame.lastMerge.b)} stroke={tokenColor(frame.lastMerge.b)} />
              <text x={LEFT_X + 120} y={MERGE_Y + 32} fontSize="12" fill="var(--text-main)"
                    fontFamily="var(--mono)" textAnchor="middle" fontWeight={700}>
                {frame.lastMerge.b}
              </text>
              <text x={LEFT_X + 160} y={MERGE_Y + 32} fontSize="14" fill="var(--accent)"
                    fontFamily="var(--mono)" textAnchor="middle">→</text>
              <rect x={LEFT_X + 180} y={MERGE_Y + 14} width={72} height={28} rx={5}
                    fill="rgba(var(--accent-rgb, 0,255,245), 0.18)" stroke="var(--accent)" strokeWidth={1.4} />
              <text x={LEFT_X + 216} y={MERGE_Y + 32} fontSize="12" fill="var(--accent)"
                    fontFamily="var(--mono)" textAnchor="middle" fontWeight={800}>
                {frame.lastMerge.merged}
              </text>
              <text x={LEFT_X + 270} y={MERGE_Y + 32} fontSize="10" fill="var(--text-dim)"
                    fontFamily="var(--mono)">
                {`freq = ${frame.lastMerge.count}`}
              </text>
            </g>
          ) : (
            <text x={LEFT_X + 16} y={MERGE_Y + 32} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)">
              {totalSteps <= 1 ? 'no merges possible — increase maxMerges' : 'press Play / Step to begin'}
            </text>
          )}

          {/* RIGHT PANEL — vocab */}
          <text x={RIGHT_X} y={HEAD_Y} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            VOCAB  ·  size {vocab.length}
          </text>
          <rect x={RIGHT_X} y={CORP_Y - 16} width={RIGHT_W} height={H - CORP_Y - 2} rx={8}
                fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />

          {/* Singles row */}
          <text x={RIGHT_X + 8} y={CORP_Y - 2} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)"
                letterSpacing="0.08em">base chars</text>
          {singles.slice(0, 18).map((tok, i) => {
            const col = i % 9;
            const row = Math.floor(i / 9);
            const x = RIGHT_X + 10 + col * 22;
            const y = CORP_Y + 8 + row * 22;
            return (
              <g key={`s-${tok}`}>
                <rect x={x} y={y} width={20} height={18} rx={4}
                      fill="rgba(var(--accent-rgb, 0,255,245), 0.04)" stroke="var(--text-dim)" strokeWidth={1} opacity={0.85} />
                <text x={x + 10} y={y + 13} fontSize="10" fill="var(--text-main)"
                      fontFamily="var(--mono)" textAnchor="middle">{tok}</text>
              </g>
            );
          })}

          {/* Merged tokens column */}
          <text x={RIGHT_X + 8} y={CORP_Y + 64} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)"
                letterSpacing="0.08em">merged tokens</text>
          {merged.slice(-12).map((tok, i) => {
            const charW = Math.max(38, 7 * tok.length + 14);
            const x = RIGHT_X + 10;
            const y = CORP_Y + 76 + i * 18;
            if (y > H - 14) return null;
            const isFresh = frame.lastMerge && tok === frame.lastMerge.merged;
            return (
              <g key={`m-${tok}-${i}`}>
                <rect x={x} y={y} width={Math.min(charW, RIGHT_W - 20)} height={15} rx={4}
                      fill={isFresh ? 'rgba(var(--accent-rgb, 0,255,245), 0.22)' : tokenFill(tok)}
                      stroke={isFresh ? 'var(--accent)' : tokenColor(tok)} strokeWidth={isFresh ? 1.4 : 1}
                      style={{ transition }} />
                <text x={x + 6} y={y + 11} fontSize="10"
                      fill={isFresh ? 'var(--accent)' : 'var(--text-main)'}
                      fontFamily="var(--mono)" fontWeight={isFresh ? 700 : 600}>
                  {tok}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Layers size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              max merges
            </span>
            <input type="range" min="5" max="25" step="1" value={maxMerges}
                   onChange={(e) => { setMaxMerges(parseInt(e.target.value, 10)); setStepIdx(0); setIsRunningRaw(false); }} />
            <span className="mlviz-slider-val">{maxMerges}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span>
            <span className="mlviz-sub">vocab size</span>{' '}
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{vocab.length}</span>
          </span>
          <span>
            <span className="mlviz-sub">top pair freq</span>{' '}
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              {frame.lastMerge ? frame.lastMerge.count : '—'}
            </span>
          </span>
          <span>
            <span className="mlviz-sub">merges done</span>{' '}
            <span className="mlviz-val">{frame.step}</span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`} onClick={handleToggle}>
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{stepIdx >= totalSteps - 1 ? 'Restart' : isRunning ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleStep}
                  disabled={isRunning || stepIdx >= totalSteps - 1}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            corpus: {CORPUS.join(' · ')}
          </span>
        </div>

        <div className="mlviz-hint">
          each step picks the most-frequent adjacent pair · merges it into a new token · vocab grows
        </div>
      </div>
    </div>
  );
}
