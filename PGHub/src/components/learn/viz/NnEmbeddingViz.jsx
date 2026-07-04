import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Sparkles, Move3d } from 'lucide-react';
import './NnEmbeddingViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Each word carries a target (clustered) position in data space plus a cluster tag.
const CLUSTERS = {
  royalty: 'var(--hue-violet)',
  people: 'var(--hue-pink)',
  animals: 'var(--hue-mint)',
  verbs: 'var(--hue-sky)',
};

// Target positions chosen so man->king equals woman->queen (a clean parallelogram):
//   king - man + woman = (5,4) - (2,1) + (4,-1) = (7,2) = queen.
const WORDS = [
  { w: 'king', c: 'royalty', t: [5, 4] },
  { w: 'queen', c: 'royalty', t: [7, 2] },
  { w: 'prince', c: 'royalty', t: [6, 5.2] },
  { w: 'man', c: 'people', t: [2, 1] },
  { w: 'woman', c: 'people', t: [4, -1] },
  { w: 'cat', c: 'animals', t: [-6, 3.2] },
  { w: 'dog', c: 'animals', t: [-4.6, 4.4] },
  { w: 'kitten', c: 'animals', t: [-6.6, 2] },
  { w: 'wolf', c: 'animals', t: [-4.2, 5] },
  { w: 'run', c: 'verbs', t: [-2.2, -5] },
  { w: 'jump', c: 'verbs', t: [0.2, -5.6] },
  { w: 'walk', c: 'verbs', t: [1.6, -4.4] },
];

// Deterministic scrambled start positions (no meaning yet).
const rand = mulberry32(20240614);
const START = WORDS.map(() => [
  (rand() * 2 - 1) * 8.2,
  (rand() * 2 - 1) * 6.0,
]);

const VB_W = 380;
const VB_H = 264;
const PAD = 16;
const X_LO = -9.5;
const X_HI = 9.5;
const Y_LO = -7.2;
const Y_HI = 7.2;
const plotW = VB_W - 2 * PAD;
const plotH = VB_H - 2 * PAD;
const sx = (x) => PAD + ((x - X_LO) / (X_HI - X_LO)) * plotW;
const sy = (y) => PAD + (1 - (y - Y_LO) / (Y_HI - Y_LO)) * plotH;

const MAX_STEPS = 200;
const PHASE1_END = 110;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

function cosine(a, b) {
  const dot = a[0] * b[0] + a[1] * b[1];
  const na = Math.hypot(a[0], a[1]);
  const nb = Math.hypot(b[0], b[1]);
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

// Analogy anchor points (data space).
const P_KING = WORDS.find((d) => d.w === 'king').t;
const P_MAN = WORDS.find((d) => d.w === 'man').t;
const P_WOMAN = WORDS.find((d) => d.w === 'woman').t;
const P_MINUS = [P_KING[0] - P_MAN[0], P_KING[1] - P_MAN[1]];          // king - man
const P_RESULT = [P_MINUS[0] + P_WOMAN[0], P_MINUS[1] + P_WOMAN[1]];   // + woman = queen

export default function NnEmbeddingViz() {
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const reset = () => { setStep(0); setPlaying(true); };

  useEffect(() => {
    if (!playing || step >= MAX_STEPS) return undefined;
    const interval = reduced ? 96 : 40;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        setStep((s) => {
          const next = Math.min(MAX_STEPS, s + 1);
          if (next >= MAX_STEPS) setPlaying(false);
          return next;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, step, reduced]);

  const driftT = easeInOut(Math.min(1, step / PHASE1_END));
  const phase = step < PHASE1_END ? 1 : 2;
  const arithT = Math.max(0, Math.min(1, (step - PHASE1_END) / (MAX_STEPS - PHASE1_END)));

  // Current position of every word (scrambled -> clustered).
  const positions = WORDS.map((d, i) => lerp2(START[i], d.t, driftT));

  // Highlighted-pair cosine (king vs queen), from the live positions.
  const kingPos = positions[WORDS.findIndex((d) => d.w === 'king')];
  const queenPos = positions[WORDS.findIndex((d) => d.w === 'queen')];
  const cosKQ = cosine(kingPos, queenPos);

  // Moving arithmetic point along king -> (king-man) -> (king-man+woman).
  let movePt = P_KING;
  if (phase === 2) {
    movePt = arithT < 0.5
      ? lerp2(P_KING, P_MINUS, arithT / 0.5)
      : lerp2(P_MINUS, P_RESULT, (arithT - 0.5) / 0.5);
  }
  const analogySolved = phase === 2 && arithT >= 0.98;

  const arrow = (a, b, opacity, color, id) => {
    if (opacity <= 0) return null;
    return (
      <g style={{ opacity }} key={id}>
        <line x1={sx(a[0])} y1={sy(a[1])} x2={sx(b[0])} y2={sy(b[1])}
          className="nemb-arrow" style={{ stroke: color }} markerEnd={`url(#nemb-arw-${id})`} />
      </g>
    );
  };

  const phaseLabel = phase === 1 ? 'Clustering by meaning' : 'Vector arithmetic';

  return (
    <div className="nemb">
      <div className="nemb-head">
        <div className="nemb-head-icon"><Sparkles size={18} /></div>
        <div className="nemb-head-text">
          <h3 className="nemb-title">Meaning becomes geometry</h3>
          <p className="nemb-sub">
            Similar-context words drift into clusters, then an analogy falls out as a step in space:
            <span dangerouslySetInnerHTML={{ __html: km('\\;\\vec{king}-\\vec{man}+\\vec{woman}\\approx\\vec{queen}') }} />.
          </p>
        </div>
        <button type="button" className="nemb-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nemb-controls">
        <button type="button" className="nemb-btn nemb-btn-primary"
          onClick={() => (step >= MAX_STEPS ? reset() : setPlaying((p) => !p))}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> {step >= MAX_STEPS ? 'Replay' : 'Play'}</>}
        </button>
        <div className="nemb-legend">
          {Object.entries(CLUSTERS).map(([name, col]) => (
            <span key={name} className="nemb-leg">
              <span className="nemb-leg-dot" style={{ background: col }} />{name}
            </span>
          ))}
        </div>
      </div>

      <div className="nemb-body">
        <div className="nemb-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="nemb-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              {['sub', 'add'].map((id) => (
                <marker key={id} id={`nemb-arw-${id}`} viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" className={`nemb-arw-head nemb-arw-head-${id}`} />
                </marker>
              ))}
            </defs>

            <rect x={PAD} y={PAD} width={plotW} height={plotH} rx={12} className="nemb-plot" />
            <line x1={sx(X_LO)} y1={sy(0)} x2={sx(X_HI)} y2={sy(0)} className="nemb-axis" />
            <line x1={sx(0)} y1={sy(Y_LO)} x2={sx(0)} y2={sy(Y_HI)} className="nemb-axis" />

            {/* Phase 2: parallelogram + arithmetic arrows drawn beneath the points. */}
            {phase === 2 && (
              <g>
                <path
                  d={`M${sx(P_MAN[0])},${sy(P_MAN[1])} L${sx(P_KING[0])},${sy(P_KING[1])} `
                    + `L${sx(P_RESULT[0])},${sy(P_RESULT[1])} L${sx(P_WOMAN[0])},${sy(P_WOMAN[1])} Z`}
                  className="nemb-para" />
                {arrow(P_KING, P_MINUS, Math.min(1, arithT / 0.5), 'var(--hue-pink)', 'sub')}
                {arrow(P_MINUS, P_RESULT, Math.max(0, (arithT - 0.5) / 0.5), 'var(--hue-mint)', 'add')}
                {arithT > 0.02 && (
                  <circle cx={sx(P_MINUS[0])} cy={sy(P_MINUS[1])} r={3} className="nemb-ghost" />
                )}
                <circle cx={sx(movePt[0])} cy={sy(movePt[1])} r={6} className="nemb-move" />
                {analogySolved && (
                  <circle cx={sx(P_RESULT[0])} cy={sy(P_RESULT[1])} r={13} className="nemb-ring" />
                )}
              </g>
            )}

            {/* Word points + labels. */}
            {WORDS.map((d, i) => {
              const p = positions[i];
              const col = CLUSTERS[d.c];
              const isQueen = d.w === 'queen';
              const hl = phase === 2 && (d.w === 'king' || d.w === 'man' || d.w === 'woman'
                || (isQueen && analogySolved));
              return (
                <g key={d.w} className={`nemb-word ${hl ? 'is-hl' : ''}`}>
                  <circle cx={sx(p[0])} cy={sy(p[1])} r={hl ? 5 : 4}
                    className="nemb-dot" style={{ fill: col }} />
                  <text x={sx(p[0]) + 6} y={sy(p[1]) + 3} className="nemb-lab"
                    style={{ fill: hl ? col : 'var(--text-dim)' }}>{d.w}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="nemb-side">
          <div className="nemb-stat nemb-stat-phase" style={{ borderTopColor: 'var(--accent)' }}>
            <span className="nemb-stat-name"><Move3d size={13} /> phase {phase}</span>
            <span className="nemb-stat-val">{phaseLabel}</span>
          </div>

          <div className="nemb-stat" style={{ borderTopColor: 'var(--hue-violet)' }}>
            <span className="nemb-stat-name" style={{ color: 'var(--hue-violet)' }}>
              <span className="nemb-leg-dot" style={{ background: 'var(--hue-violet)' }} />
              cos(king, queen)
            </span>
            <span className="nemb-stat-val">{cosKQ.toFixed(3)}</span>
          </div>

          <div className="nemb-stat" style={{ borderTopColor: analogySolved ? 'var(--hue-mint)' : 'var(--border)' }}>
            <span className="nemb-stat-name" style={{ color: analogySolved ? 'var(--hue-mint)' : 'var(--text-dim)' }}>
              <span className="nemb-leg-dot" style={{ background: analogySolved ? 'var(--hue-mint)' : 'var(--border)' }} />
              analogy result
            </span>
            <span className="nemb-stat-val">{analogySolved ? 'queen' : phase === 2 ? '…' : '—'}</span>
          </div>

          <label className="nemb-slider">
            <span className="nemb-slider-lab">
              <span>scrub timeline</span>
              <span className="nemb-slider-val">{step}</span>
            </span>
            <input type="range" min={0} max={MAX_STEPS} step={1} value={step}
              onChange={(e) => { setPlaying(false); setStep(parseInt(e.target.value, 10)); }} />
          </label>

          <div className="nemb-note">
            {phase === 1
              ? 'Words that share contexts are pulled together; cosine similarity rises as related vectors point the same way.'
              : 'Subtract man, add woman: the royalty offset reused from man→king lands the result exactly on queen.'}
          </div>
        </div>
      </div>
    </div>
  );
}
