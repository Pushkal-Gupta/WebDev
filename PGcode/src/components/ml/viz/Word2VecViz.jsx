import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ChevronRight, Zap } from 'lucide-react';
import './MLViz.css';

// ----- canvas geometry -----
const W = 620;
const H = 460;
const PLOT = { x: 16, y: 16, w: 360, h: 360 };
const HEAT = { x: 392, y: 16, w: 212, h: 212 };
const LEGEND = { x: 392, y: 244, w: 212, h: 132 };

// Mini corpus and training params (locked — moderately small so 50 steps trains visibly).
const CORPUS = ['the', 'cat', 'sat', 'on', 'the', 'mat', 'the', 'dog', 'ate', 'the', 'cat'];
const WINDOW = 2;
const NUM_NEG = 4;
const LR_POS = 0.045;
const LR_NEG = 0.030;
const ANIM_MS = 520;
const AUTO_STEP_MS = 90;

// Deterministic vocab order (first-occurrence).
function uniqueWords(corpus) {
  const seen = new Set();
  const list = [];
  for (const w of corpus) {
    if (!seen.has(w)) {
      seen.add(w);
      list.push(w);
    }
  }
  return list;
}

// Seeded PRNG — keeps the layout reproducible across reloads.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Initial positions: jitter inside [0.15, 0.85]^2.
function seededPositions(words, seed = 1729) {
  const rand = mulberry32(seed);
  return words.map(() => ({
    x: 0.15 + rand() * 0.70,
    y: 0.15 + rand() * 0.70,
  }));
}

// Plot-space [0,1]^2 -> svg-px inside PLOT box.
function toPx(p) {
  return {
    cx: PLOT.x + p.x * PLOT.w,
    cy: PLOT.y + (1 - p.y) * PLOT.h,
  };
}

// Center-removed cosine similarity (vectors live in [0,1]^2; recenter at 0.5).
function cosSim(a, b) {
  const ax = a.x - 0.5, ay = a.y - 0.5;
  const bx = b.x - 0.5, by = b.y - 0.5;
  const dot = ax * bx + ay * by;
  const na = Math.hypot(ax, ay);
  const nb = Math.hypot(bx, by);
  if (na < 1e-9 || nb < 1e-9) return 0;
  return dot / (na * nb);
}

// Clamp inside plot frame.
function clamp01(v) {
  return Math.max(0.04, Math.min(0.96, v));
}

// Pick context positions inside [centerIdx-WINDOW, centerIdx+WINDOW] excluding the center.
function contextIndicesOf(centerIdx) {
  const out = [];
  for (let off = -WINDOW; off <= WINDOW; off++) {
    if (off === 0) continue;
    const j = centerIdx + off;
    if (j >= 0 && j < CORPUS.length) out.push(j);
  }
  return out;
}

// Pick NUM_NEG random negatives that aren't the center or one of its context words.
function pickNegatives(centerWord, contextWords, vocab, rand) {
  const excluded = new Set([centerWord, ...contextWords]);
  const candidates = vocab.filter((w) => !excluded.has(w));
  const pool = candidates.length > 0 ? candidates : vocab.filter((w) => w !== centerWord);
  const picks = [];
  const used = new Set();
  // If pool is smaller than NUM_NEG, allow duplicates.
  let guard = 0;
  while (picks.length < NUM_NEG && guard < 200) {
    const w = pool[Math.floor(rand() * pool.length)];
    if (!used.has(w) || pool.length < NUM_NEG) {
      picks.push(w);
      used.add(w);
    }
    guard++;
  }
  return picks;
}

// Build the next set of training positions from one center idx in the corpus.
function buildTrainingPlan(vocab, wordToIdx, corpusIdx, rand) {
  const centerWord = CORPUS[corpusIdx];
  const contextWordsRaw = contextIndicesOf(corpusIdx).map((i) => CORPUS[i]);
  // Dedupe context words (mat/dog/ate may repeat 'the' in window).
  const contextWords = Array.from(new Set(contextWordsRaw.filter((w) => w !== centerWord)));
  const negWords = pickNegatives(centerWord, contextWords, vocab, rand);
  return {
    centerWord,
    centerIdx: wordToIdx[centerWord],
    positives: contextWords.map((w) => ({ word: w, idx: wordToIdx[w] })),
    negatives: negWords.map((w) => ({ word: w, idx: wordToIdx[w] })),
  };
}

// Apply one SGD-style update: positives pulled toward center, negatives pushed away.
function applyStep(positions, plan) {
  const next = positions.map((p) => ({ ...p }));
  const c = next[plan.centerIdx];
  for (const pos of plan.positives) {
    const t = next[pos.idx];
    const nx = t.x + (c.x - t.x) * LR_POS * 5; // pull factor (visible movement)
    const ny = t.y + (c.y - t.y) * LR_POS * 5;
    t.x = clamp01(nx);
    t.y = clamp01(ny);
  }
  for (const neg of plan.negatives) {
    const t = next[neg.idx];
    const dx = t.x - c.x;
    const dy = t.y - c.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    // Push along the unit vector away from center.
    const push = LR_NEG * 1.6;
    t.x = clamp01(t.x + (dx / d) * push);
    t.y = clamp01(t.y + (dy / d) * push);
  }
  return next;
}

// Linear interpolation of two position arrays for animation.
function lerpPositions(a, b, t) {
  return a.map((p, i) => ({
    x: p.x + (b[i].x - p.x) * t,
    y: p.y + (b[i].y - p.y) * t,
  }));
}

// Color for a heatmap cell given cosine [-1,1].
function heatColor(sim) {
  // Positive -> accent; negative -> warning; zero -> dim.
  const a = Math.max(0, sim);
  const n = Math.max(0, -sim);
  if (a > n) {
    return `rgba(var(--accent-rgb, 0, 255, 245), ${(0.10 + a * 0.85).toFixed(3)})`;
  }
  return `rgba(255, 179, 71, ${(0.10 + n * 0.85).toFixed(3)})`;
}

export default function Word2VecViz() {
  const vocab = useMemo(() => uniqueWords(CORPUS), []);
  const wordToIdx = useMemo(() => {
    const m = {};
    vocab.forEach((w, i) => { m[w] = i; });
    return m;
  }, [vocab]);

  // Seeded RNG for negative sampling — recreated on reset.
  const rngRef = useRef(mulberry32(424242));

  const [positions, setPositions] = useState(() => seededPositions(vocab));
  const [corpusIdx, setCorpusIdx] = useState(0); // next center to train
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false); // batch training in progress
  const [animating, setAnimating] = useState(false);

  // Current training plan (for the upcoming step) — drives the rendered highlight.
  const [plan, setPlan] = useState(() =>
    buildTrainingPlan(vocab, wordToIdx, 0, rngRef.current)
  );

  // Animation refs.
  const animRafRef = useRef(null);
  const animStartRef = useRef(0);
  const animFromRef = useRef(positions);
  const animToRef = useRef(positions);

  // Batch run state — driven by an interval that triggers single steps.
  const batchTimerRef = useRef(null);
  const batchRemainingRef = useRef(0);

  // Cleanup on unmount.
  useEffect(() => () => {
    if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
  }, []);

  const animateTo = useCallback((from, to, onDone) => {
    if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    animFromRef.current = from;
    animToRef.current = to;
    animStartRef.current = performance.now();
    setAnimating(true);

    const tick = (now) => {
      const t = Math.min(1, (now - animStartRef.current) / ANIM_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const cur = lerpPositions(animFromRef.current, animToRef.current, eased);
      setPositions(cur);
      if (t < 1) {
        animRafRef.current = requestAnimationFrame(tick);
      } else {
        animRafRef.current = null;
        setAnimating(false);
        if (onDone) onDone();
      }
    };
    animRafRef.current = requestAnimationFrame(tick);
  }, []);

  const doStep = useCallback((onDone) => {
    const next = applyStep(positions, plan);
    const nextCorpus = (corpusIdx + 1) % CORPUS.length;
    const nextPlan = buildTrainingPlan(vocab, wordToIdx, nextCorpus, rngRef.current);
    animateTo(positions, next, () => {
      setCorpusIdx(nextCorpus);
      setSteps((s) => s + 1);
      setPlan(nextPlan);
      if (onDone) onDone();
    });
  }, [positions, plan, corpusIdx, vocab, wordToIdx, animateTo]);

  const handleStep = useCallback(() => {
    if (animating || running) return;
    doStep();
  }, [animating, running, doStep]);

  // Batch training: queue N steps back-to-back. We thread the current plan + corpus index
  // through refs so the loop closure always sees the freshest values (setState alone wouldn't
  // help — the closure captures the variables at handleTrain50 call time).
  const batchPlanRef = useRef(plan);
  const batchCorpusRef = useRef(corpusIdx);
  // Keep refs in sync with state so single-step + batch-step share progress.
  useEffect(() => { batchPlanRef.current = plan; }, [plan]);
  useEffect(() => { batchCorpusRef.current = corpusIdx; }, [corpusIdx]);

  const handleTrain50 = useCallback(() => {
    if (running || animating) return;
    setRunning(true);
    batchRemainingRef.current = 50;

    const stepLoop = () => {
      if (batchRemainingRef.current <= 0) {
        setRunning(false);
        return;
      }
      const curPlan = batchPlanRef.current;
      const curCorpus = batchCorpusRef.current;
      setPositions((cur) => applyStep(cur, curPlan));
      const nextCorpus = (curCorpus + 1) % CORPUS.length;
      const nextPlan = buildTrainingPlan(vocab, wordToIdx, nextCorpus, rngRef.current);
      batchPlanRef.current = nextPlan;
      batchCorpusRef.current = nextCorpus;
      setCorpusIdx(nextCorpus);
      setSteps((s) => s + 1);
      setPlan(nextPlan);
      batchRemainingRef.current -= 1;
      batchTimerRef.current = setTimeout(stepLoop, AUTO_STEP_MS);
    };
    stepLoop();
  }, [running, animating, vocab, wordToIdx]);

  // Stop a running batch if reset is pressed mid-flight.
  const stopBatch = useCallback(() => {
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchRemainingRef.current = 0;
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    stopBatch();
    if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    rngRef.current = mulberry32(424242);
    const fresh = seededPositions(vocab);
    setPositions(fresh);
    setCorpusIdx(0);
    setSteps(0);
    setPlan(buildTrainingPlan(vocab, wordToIdx, 0, rngRef.current));
  }, [stopBatch, vocab, wordToIdx]);

  // ----- derived view data -----
  const wordPx = positions.map(toPx);

  const centerPx = wordPx[plan.centerIdx];

  // Lines: positives green (accent), negatives orange (warning).
  const posLines = plan.positives.map((p) => ({
    word: p.word,
    idx: p.idx,
    dst: wordPx[p.idx],
  }));
  const negLines = plan.negatives.map((n) => ({
    word: n.word,
    idx: n.idx,
    dst: wordPx[n.idx],
  }));

  // Heatmap: vocab x vocab cosine.
  const heat = useMemo(() => {
    const n = vocab.length;
    const cell = (HEAT.w - 28) / n; // leave 28px gutter for axis labels
    const grid = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        grid.push({
          i, j,
          x: HEAT.x + 24 + j * cell,
          y: HEAT.y + 24 + i * cell,
          w: cell - 1,
          h: cell - 1,
          sim: cosSim(positions[i], positions[j]),
        });
      }
    }
    return { grid, cell, n };
  }, [positions, vocab.length]);

  // Top-3 nearest neighbour pairs for the active center, for the readout.
  const centerNbrs = useMemo(() => {
    const c = positions[plan.centerIdx];
    return vocab
      .map((w, i) => ({ word: w, idx: i, sim: cosSim(c, positions[i]) }))
      .filter((s) => s.idx !== plan.centerIdx)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);
  }, [positions, plan.centerIdx, vocab]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: 720, aspectRatio: `${W} / ${H}` }}
        >
          <defs>
            <radialGradient id="w2v-center-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <marker id="w2v-pull" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="w2v-push" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--warning, #ffb347)" />
            </marker>
          </defs>

          {/* ---------- PLOT FRAME ---------- */}
          <rect
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.w}
            height={PLOT.h}
            rx={10}
            ry={10}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g} opacity={0.55} pointerEvents="none">
              <line
                x1={PLOT.x + g * PLOT.w}
                y1={PLOT.y}
                x2={PLOT.x + g * PLOT.w}
                y2={PLOT.y + PLOT.h}
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeWidth={0.6}
              />
              <line
                x1={PLOT.x}
                y1={PLOT.y + g * PLOT.h}
                x2={PLOT.x + PLOT.w}
                y2={PLOT.y + g * PLOT.h}
                stroke="var(--border)"
                strokeDasharray="2 4"
                strokeWidth={0.6}
              />
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={PLOT.x + 8}
            y={PLOT.y + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
            pointerEvents="none"
          >
            EMBEDDING SPACE
          </text>
          <text
            x={PLOT.x + PLOT.w - 6}
            y={PLOT.y + PLOT.h - 6}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            textAnchor="end"
            pointerEvents="none"
          >
            dim 1
          </text>
          <text
            x={PLOT.x + 6}
            y={PLOT.y + 26}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            pointerEvents="none"
          >
            dim 2
          </text>

          {/* ---------- CENTER GLOW ---------- */}
          <circle
            cx={centerPx.cx}
            cy={centerPx.cy}
            r={34}
            fill="url(#w2v-center-glow)"
            pointerEvents="none"
          />

          {/* ---------- PULL LINES (positives -> center) ---------- */}
          {posLines.map((p) => (
            <g key={`pos-${p.idx}`} pointerEvents="none">
              <line
                x1={p.dst.cx}
                y1={p.dst.cy}
                x2={centerPx.cx}
                y2={centerPx.cy}
                stroke="var(--accent)"
                strokeWidth={1.6}
                opacity={0.85}
                strokeLinecap="round"
                markerEnd="url(#w2v-pull)"
              />
            </g>
          ))}

          {/* ---------- PUSH LINES (negatives <- center) ---------- */}
          {negLines.map((n) => (
            <g key={`neg-${n.idx}`} pointerEvents="none">
              <line
                x1={centerPx.cx}
                y1={centerPx.cy}
                x2={n.dst.cx}
                y2={n.dst.cy}
                stroke="var(--warning, #ffb347)"
                strokeWidth={1.2}
                opacity={0.75}
                strokeDasharray="3 3"
                strokeLinecap="round"
                markerEnd="url(#w2v-push)"
              />
            </g>
          ))}

          {/* ---------- WORD DOTS ---------- */}
          {vocab.map((w, i) => {
            const p = wordPx[i];
            const isCenter = i === plan.centerIdx;
            const isPos = plan.positives.some((pp) => pp.idx === i);
            const isNeg = plan.negatives.some((nn) => nn.idx === i);
            const color = isCenter
              ? 'var(--accent)'
              : isPos
                ? 'var(--accent)'
                : isNeg
                  ? 'var(--warning, #ffb347)'
                  : 'var(--text-dim)';
            const fill = isCenter
              ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.34)'
              : isPos
                ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.18)'
                : isNeg
                  ? 'rgba(255, 179, 71, 0.16)'
                  : 'rgba(var(--accent-rgb, 0, 255, 245), 0.06)';
            const r = isCenter ? 13 : (isPos || isNeg) ? 10 : 7;
            const sw = isCenter ? 2.4 : (isPos || isNeg) ? 1.7 : 1.1;
            return (
              <g key={`w-${i}`} pointerEvents="none">
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={r}
                  fill={fill}
                  stroke={color}
                  strokeWidth={sw}
                />
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={2.6}
                  fill={color}
                />
                <text
                  x={p.cx + r + 4}
                  y={p.cy + 4}
                  fontSize={isCenter ? 12 : 11}
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={isCenter ? 800 : (isPos || isNeg) ? 700 : 600}
                  fill={isCenter ? 'var(--accent)' : 'var(--text-main)'}
                >
                  {w}
                </text>
              </g>
            );
          })}

          {/* ---------- HEATMAP PANEL ---------- */}
          <rect
            x={HEAT.x}
            y={HEAT.y}
            width={HEAT.w}
            height={HEAT.w}
            rx={8}
            ry={8}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            x={HEAT.x + HEAT.w / 2}
            y={HEAT.y + 14}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            COSINE SIMILARITY
          </text>
          {/* Heat cells */}
          {heat.grid.map((c) => (
            <rect
              key={`h-${c.i}-${c.j}`}
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              fill={heatColor(c.sim)}
              stroke="var(--border)"
              strokeWidth={0.2}
            />
          ))}
          {/* Axis labels (words) — column labels at top, row labels at left. */}
          {vocab.map((w, i) => {
            const lx = HEAT.x + 24 + i * heat.cell + heat.cell / 2;
            const rowY = HEAT.y + 24 + i * heat.cell + heat.cell / 2 + 3;
            return (
              <g key={`hl-${i}`} pointerEvents="none">
                <text
                  x={lx}
                  y={HEAT.y + 22}
                  textAnchor="middle"
                  fontSize="6.6"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                >
                  {w}
                </text>
                <text
                  x={HEAT.x + 22}
                  y={rowY}
                  textAnchor="end"
                  fontSize="6.6"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                >
                  {w}
                </text>
              </g>
            );
          })}

          {/* ---------- LEGEND PANEL ---------- */}
          <rect
            x={LEGEND.x}
            y={LEGEND.y}
            width={LEGEND.w}
            height={LEGEND.h}
            rx={8}
            ry={8}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            x={LEGEND.x + LEGEND.w / 2}
            y={LEGEND.y + 16}
            textAnchor="middle"
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            TRAINING STEP
          </text>
          {/* Center marker */}
          <g>
            <circle
              cx={LEGEND.x + 18}
              cy={LEGEND.y + 38}
              r={6}
              fill="rgba(var(--accent-rgb, 0, 255, 245), 0.34)"
              stroke="var(--accent)"
              strokeWidth={1.8}
            />
            <text
              x={LEGEND.x + 30}
              y={LEGEND.y + 42}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              center
            </text>
            <text
              x={LEGEND.x + LEGEND.w - 10}
              y={LEGEND.y + 42}
              textAnchor="end"
              fontSize="11"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fontWeight={800}
              fill="var(--accent)"
            >
              {plan.centerWord}
            </text>
          </g>
          {/* Positive marker */}
          <g>
            <line
              x1={LEGEND.x + 10}
              y1={LEGEND.y + 62}
              x2={LEGEND.x + 26}
              y2={LEGEND.y + 62}
              stroke="var(--accent)"
              strokeWidth={1.8}
              markerEnd="url(#w2v-pull)"
            />
            <text
              x={LEGEND.x + 32}
              y={LEGEND.y + 66}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              pull positive  ({plan.positives.length})
            </text>
          </g>
          {/* Negative marker */}
          <g>
            <line
              x1={LEGEND.x + 10}
              y1={LEGEND.y + 82}
              x2={LEGEND.x + 26}
              y2={LEGEND.y + 82}
              stroke="var(--warning, #ffb347)"
              strokeWidth={1.4}
              strokeDasharray="3 3"
              markerEnd="url(#w2v-push)"
            />
            <text
              x={LEGEND.x + 32}
              y={LEGEND.y + 86}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-main)"
            >
              push negative ({plan.negatives.length})
            </text>
          </g>
          {/* Step counter */}
          <text
            x={LEGEND.x + 10}
            y={LEGEND.y + 110}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            STEPS
          </text>
          <text
            x={LEGEND.x + LEGEND.w - 10}
            y={LEGEND.y + 110}
            textAnchor="end"
            fontSize="13"
            fontFamily="var(--mono, monospace)"
            fontWeight={700}
            fill="var(--accent)"
          >
            {steps}
          </text>
          <text
            x={LEGEND.x + 10}
            y={LEGEND.y + 124}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            CORPUS POS
          </text>
          <text
            x={LEGEND.x + LEGEND.w - 10}
            y={LEGEND.y + 124}
            textAnchor="end"
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-main)"
          >
            {corpusIdx}/{CORPUS.length}
          </text>
        </svg>
      </div>

      {/* ---------- CORPUS STRIP ---------- */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            CORPUS
          </span>
          <span className="mlviz-sub">window = {WINDOW} · negatives = {NUM_NEG} per step</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: '0.4rem',
          }}
        >
          {CORPUS.map((w, i) => {
            const isCenter = i === corpusIdx;
            const isCtx = contextIndicesOf(corpusIdx).includes(i);
            const stroke = isCenter ? 'var(--accent)' : isCtx ? 'var(--accent)' : 'var(--border)';
            const bg = isCenter
              ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.18)'
              : isCtx
                ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.07)'
                : 'var(--bg)';
            const color = isCenter ? 'var(--accent)' : 'var(--text-main)';
            return (
              <span
                key={`cs-${i}`}
                style={{
                  padding: '0.22rem 0.55rem',
                  borderRadius: 999,
                  border: `1px solid ${stroke}`,
                  background: bg,
                  color,
                  fontFamily: 'var(--serif, serif)',
                  fontStyle: 'italic',
                  fontWeight: isCenter ? 800 : 600,
                  fontSize: '0.86rem',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>

      {/* ---------- NEAREST NEIGHBOURS ---------- */}
      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span
            className="mlviz-tag"
            style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontStyle: 'normal',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
            }}
          >
            NEAREST
          </span>
          <span className="mlviz-sub">closest words to <em>{plan.centerWord}</em> by cosine</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginTop: '0.4rem',
          }}
        >
          {centerNbrs.map((n, idx) => (
            <div
              key={`nb-${n.idx}`}
              style={{
                background: 'rgba(var(--accent-rgb, 0, 255, 245), 0.07)',
                border: '1px solid var(--accent)',
                borderRadius: 6,
                padding: '0.4rem 0.55rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.12em',
                  color: 'var(--text-dim)',
                }}
              >
                #{idx + 1}
              </span>
              <span
                style={{
                  fontFamily: 'var(--serif, serif)',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                }}
              >
                {n.word}
              </span>
              <span
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: '0.72rem',
                  color: 'var(--accent)',
                }}
              >
                cos {n.sim.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- CONTROLS ---------- */}
      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleStep}
            disabled={running || animating}
          >
            <ChevronRight size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleTrain50}
            disabled={running || animating}
          >
            {running ? <Zap size={13} /> : <Play size={13} />}
            <span>{running ? 'training…' : 'Train 50 steps'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={animating}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span
            className="mlviz-sub"
            style={{ marginLeft: 'auto' }}
          >
            skip-gram + negative sampling on a {CORPUS.length}-token corpus
          </span>
        </div>
        <div className="mlviz-hint">
          vocab: {vocab.join(', ')}
        </div>
      </div>
    </div>
  );
}
