import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Brain, RotateCcw, Eraser, Shuffle, Play } from 'lucide-react';
import './MnistNetViz.css';

// ---- deterministic PRNG (mulberry32) ----
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- network shape ----
const GRID = 8; // 8x8 input
const IN = GRID * GRID; // 64
const HID = 16;
const OUT = 10;
const SEED = 0x5eed1234;

// Build fixed demo weights once (Glorot-ish scaled). Illustrative, not trained.
function buildNet() {
  const rng = mulberry32(SEED);
  const gauss = () => {
    // Box-Muller from two uniforms (deterministic via rng)
    const u1 = Math.max(1e-9, rng());
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const s1 = Math.sqrt(2 / IN);
  const s2 = Math.sqrt(2 / HID);
  const W1 = Array.from({ length: HID }, () =>
    Array.from({ length: IN }, () => gauss() * s1)
  );
  const b1 = Array.from({ length: HID }, () => gauss() * 0.05);
  const W2 = Array.from({ length: OUT }, () =>
    Array.from({ length: HID }, () => gauss() * s2)
  );
  const b2 = Array.from({ length: OUT }, () => gauss() * 0.05);
  const params = HID * IN + HID + OUT * HID + OUT;
  return { W1, b1, W2, b2, params };
}

const NET = buildNet();

// ---- tiny hardcoded 8x8 digit bitmaps (original, hand-laid 0/1 grids) ----
const SAMPLES = {
  0: [
    0, 0, 1, 1, 1, 1, 0, 0,
    0, 1, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 1, 1, 0,
    0, 0, 1, 1, 1, 1, 0, 0,
  ],
  1: [
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 1, 1, 1, 0, 0, 0,
    0, 1, 1, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 1, 1, 1, 1, 0, 0,
    0, 1, 1, 1, 1, 1, 1, 0,
  ],
  2: [
    0, 1, 1, 1, 1, 1, 0, 0,
    1, 1, 0, 0, 0, 1, 1, 0,
    0, 0, 0, 0, 0, 1, 1, 0,
    0, 0, 0, 0, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 0, 0,
    0, 1, 1, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 0,
  ],
  3: [
    0, 1, 1, 1, 1, 1, 0, 0,
    1, 1, 0, 0, 0, 1, 1, 0,
    0, 0, 0, 0, 0, 1, 1, 0,
    0, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 1, 1, 0,
    0, 0, 0, 0, 0, 1, 1, 0,
    1, 1, 0, 0, 0, 1, 1, 0,
    0, 1, 1, 1, 1, 1, 0, 0,
  ],
  7: [
    1, 1, 1, 1, 1, 1, 1, 0,
    0, 0, 0, 0, 0, 1, 1, 0,
    0, 0, 0, 0, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 0, 0,
  ],
};
const SAMPLE_KEYS = ['0', '1', '2', '3', '7'];

// ---- forward math (REAL: matmul + ReLU + softmax) ----
function relu(x) {
  return x > 0 ? x : 0;
}
function softmax(z) {
  const m = Math.max(...z);
  const ex = z.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((v) => v / s);
}
function forward(pixels) {
  // hidden pre-activation z1, activation a1
  const a1 = new Array(HID);
  for (let h = 0; h < HID; h++) {
    let acc = NET.b1[h];
    const row = NET.W1[h];
    for (let i = 0; i < IN; i++) acc += row[i] * pixels[i];
    a1[h] = relu(acc);
  }
  const z2 = new Array(OUT);
  for (let o = 0; o < OUT; o++) {
    let acc = NET.b2[o];
    const row = NET.W2[o];
    for (let h = 0; h < HID; h++) acc += row[h] * a1[h];
    z2[o] = acc;
  }
  const probs = softmax(z2);
  return { a1, probs };
}

function emptyGrid() {
  return new Array(IN).fill(0);
}

// ---- layout geometry (VERTICAL, top -> bottom) ----
const W = 460;
const H = 560;
const HUE = ['--hue-sky', '--hue-violet', '--hue-pink', '--hue-mint'];

function neuronColor(idx) {
  return `var(${HUE[idx % HUE.length]})`;
}

export default function MnistNetViz() {
  const uid = useId().replace(/:/g, '');
  const [pixels, setPixels] = useState(() => SAMPLES['3'].slice());
  const [sampleIdx, setSampleIdx] = useState(3); // index into SAMPLE_KEYS
  const [stage, setStage] = useState(3); // 0 input,1 hidden,2 output,3 all
  const gridRef = useRef(null);
  const paintRef = useRef(false);
  const paintValRef = useRef(1);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { a1, probs } = useMemo(() => forward(pixels), [pixels]);

  const pred = useMemo(() => {
    let best = 0;
    for (let i = 1; i < OUT; i++) if (probs[i] > probs[best]) best = i;
    return best;
  }, [probs]);

  const top2 = useMemo(() => {
    const order = probs
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p - a.p);
    return order.slice(0, 2);
  }, [probs]);

  const hidNorm = useMemo(() => {
    const max = Math.max(...a1, 1e-6);
    return a1.map((v) => v / max);
  }, [a1]);

  // ---- drawing ----
  const cellFromEvent = useCallback((clientX, clientY) => {
    const el = gridRef.current;
    if (!el) return -1;
    const rect = el.getBoundingClientRect();
    const cx = Math.floor(((clientX - rect.left) / rect.width) * GRID);
    const cy = Math.floor(((clientY - rect.top) / rect.height) * GRID);
    if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return -1;
    return cy * GRID + cx;
  }, []);

  const paintAt = useCallback(
    (idx, val) => {
      if (idx < 0) return;
      setPixels((prev) => {
        if (prev[idx] === val) return prev;
        const next = prev.slice();
        next[idx] = val;
        return next;
      });
    },
    []
  );

  const onGridPointerDown = useCallback(
    (e) => {
      paintRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      const idx = cellFromEvent(e.clientX, e.clientY);
      const val = idx >= 0 && pixels[idx] === 1 ? 0 : 1;
      paintValRef.current = val;
      paintAt(idx, val);
    },
    [cellFromEvent, paintAt, pixels]
  );
  const onGridPointerMove = useCallback(
    (e) => {
      if (!paintRef.current) return;
      paintAt(cellFromEvent(e.clientX, e.clientY), paintValRef.current);
    },
    [cellFromEvent, paintAt]
  );
  const onGridPointerUp = useCallback((e) => {
    paintRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const clear = useCallback(() => setPixels(emptyGrid()), []);
  const cycleSample = useCallback(() => {
    const ni = (sampleIdx + 1) % SAMPLE_KEYS.length;
    setSampleIdx(ni);
    setPixels(SAMPLES[SAMPLE_KEYS[ni]].slice());
  }, [sampleIdx]);

  const runFlow = useCallback(() => {
    if (reducedMotion) {
      setStage(3);
      return;
    }
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 320);
    const t2 = setTimeout(() => setStage(2), 720);
    const t3 = setTimeout(() => setStage(3), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion]);

  const reset = useCallback(() => {
    setPixels(SAMPLES['3'].slice());
    setSampleIdx(3);
    setStage(3);
  }, []);

  // ---- SVG node positions (vertical column) ----
  const COL_X = W / 2;
  const Y_INPUT = 70;
  const Y_HID = 250;
  const Y_OUT = 440;

  // input represented as a compact strip of "flattened" markers
  const inSpread = 320;
  const inX = (i) => COL_X - inSpread / 2 + (inSpread * i) / (IN - 1);

  const hidSpread = 360;
  const hidX = (h) => COL_X - hidSpread / 2 + (hidSpread * h) / (HID - 1);
  const HID_R = 9;

  const outSpread = 360;
  const outX = (o) => COL_X - outSpread / 2 + (outSpread * o) / (OUT - 1);
  const OUT_R = 11;

  // pick the strongest edges per hidden node for a clean (non-hairball) draw
  const hidEdges = useMemo(() => {
    const edges = [];
    for (let h = 0; h < HID; h++) {
      const row = NET.W1[h];
      // top-3 contributing input pixels that are ON
      const cand = [];
      for (let i = 0; i < IN; i++) {
        if (pixels[i] > 0) cand.push({ i, w: Math.abs(row[i]) });
      }
      cand.sort((a, b) => b.w - a.w);
      cand.slice(0, 2).forEach(({ i }) => edges.push({ h, i }));
    }
    return edges;
  }, [pixels]);

  const outEdges = useMemo(() => {
    const edges = [];
    for (let o = 0; o < OUT; o++) {
      const row = NET.W2[o];
      const cand = [];
      for (let h = 0; h < HID; h++) cand.push({ h, w: Math.abs(row[h]) * hidNorm[h] });
      cand.sort((a, b) => b.w - a.w);
      cand.slice(0, 3).forEach(({ h }) => edges.push({ o, h }));
    }
    return edges;
  }, [hidNorm]);

  const showInput = stage >= 0;
  const showHid = stage >= 1;
  const showOut = stage >= 2;

  const flowAnim = (active) =>
    !reducedMotion && active ? `${uid}-pulse 1.4s linear infinite` : 'none';

  const probMax = Math.max(...probs, 1e-6);

  return (
    <div className="mlviz-wrap mnv-wrap">
      <div className="mnv-head">
        <span className="mnv-head-icon">
          <Brain size={16} />
        </span>
        <span className="mnv-head-text">
          <span className="mnv-head-title">Inside a digit classifier</span>
          <span className="mnv-head-sub">
            draw an 8×8 digit — the signal flows down through real matmul · ReLU · softmax
          </span>
        </span>
        <span className="mnv-chip">predicts {pred}</span>
      </div>

      <div className="mnv-body">
        {/* left: draw pad + readouts */}
        <div className="mnv-left">
          <div className="mnv-padwrap">
            <div
              ref={gridRef}
              className="mnv-pad"
              onPointerDown={onGridPointerDown}
              onPointerMove={onGridPointerMove}
              onPointerUp={onGridPointerUp}
              onPointerLeave={onGridPointerUp}
              style={{
                gridTemplateColumns: `repeat(${GRID}, 1fr)`,
                gridTemplateRows: `repeat(${GRID}, 1fr)`,
              }}
            >
              {pixels.map((v, i) => (
                <span
                  key={i}
                  className={`mnv-cell${v ? ' is-on' : ''}`}
                  style={
                    v
                      ? { background: 'var(--accent)', opacity: 0.35 + 0.65 * v }
                      : undefined
                  }
                />
              ))}
            </div>
            <span className="mnv-pad-hint">tap or drag to paint</span>
          </div>

          <div className="mlviz-statcol mnv-cards">
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">predicted digit</span>
              <span className="mlviz-statcard-val">{pred}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-violet">
              <span className="mlviz-statcard-label">confidence</span>
              <span className="mlviz-statcard-val">
                {(probs[pred] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">layer sizes</span>
              <span className="mlviz-statcard-val">
                {IN}·{HID}·{OUT}
              </span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-mint">
              <span className="mlviz-statcard-label">parameters</span>
              <span className="mlviz-statcard-val">{NET.params}</span>
            </div>
          </div>
        </div>

        {/* right: vertical network */}
        <div className="mlviz-stage mnv-stage">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mnv-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
              <filter
                id={`${uid}-glow`}
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            <style>{`
              @keyframes ${uid}-pulse {
                0% { stroke-dashoffset: 18; }
                100% { stroke-dashoffset: 0; }
              }
            `}</style>

            {/* layer labels */}
            <text
              x={18}
              y={Y_INPUT - 28}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              input · 64 px (flattened)
            </text>
            <text
              x={18}
              y={Y_HID - 26}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              hidden · 16 · ReLU
            </text>
            <text
              x={18}
              y={Y_OUT - 28}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              output · 10 · softmax
            </text>

            {/* edges: input -> hidden */}
            {showHid &&
              hidEdges.map(({ h, i }, k) => (
                <line
                  key={`e1-${k}`}
                  x1={inX(i)}
                  y1={Y_INPUT + 6}
                  x2={hidX(h)}
                  y2={Y_HID - HID_R}
                  stroke="var(--accent)"
                  strokeWidth="0.9"
                  strokeDasharray="3 3"
                  opacity={0.25 + 0.5 * hidNorm[h]}
                  style={{ animation: flowAnim(true) }}
                />
              ))}

            {/* edges: hidden -> output */}
            {showOut &&
              outEdges.map(({ o, h }, k) => (
                <line
                  key={`e2-${k}`}
                  x1={hidX(h)}
                  y1={Y_HID + HID_R}
                  x2={outX(o)}
                  y2={Y_OUT - OUT_R}
                  stroke={o === pred ? 'var(--hue-violet)' : 'var(--border)'}
                  strokeWidth={o === pred ? 1.3 : 0.8}
                  strokeDasharray="3 3"
                  opacity={o === pred ? 0.6 : 0.28}
                  style={{ animation: flowAnim(o === pred) }}
                />
              ))}

            {/* input markers */}
            {showInput &&
              pixels.map((v, i) => (
                <circle
                  key={`in-${i}`}
                  cx={inX(i)}
                  cy={Y_INPUT}
                  r={2.4}
                  fill={v ? 'var(--accent)' : 'var(--surface)'}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity={v ? 0.4 + 0.6 * v : 0.55}
                />
              ))}

            {/* hidden neurons */}
            {showHid &&
              hidNorm.map((act, h) => (
                <g key={`h-${h}`}>
                  {act > 0.6 && (
                    <circle
                      cx={hidX(h)}
                      cy={Y_HID}
                      r={HID_R + 4}
                      fill={`color-mix(in srgb, ${neuronColor(h)} ${Math.round(
                        act * 60
                      )}%, transparent)`}
                      filter={`url(#${uid}-glow)`}
                    />
                  )}
                  <circle
                    cx={hidX(h)}
                    cy={Y_HID}
                    r={HID_R}
                    fill={`color-mix(in srgb, ${neuronColor(h)} ${Math.round(
                      15 + act * 75
                    )}%, var(--surface))`}
                    stroke="var(--border)"
                    strokeWidth="0.8"
                  />
                </g>
              ))}

            {/* output neurons + bars */}
            {showOut &&
              probs.map((p, o) => {
                const barH = 60 * (p / probMax);
                const isPred = o === pred;
                return (
                  <g key={`o-${o}`}>
                    {/* probability bar growing downward from node */}
                    <rect
                      x={outX(o) - 7}
                      y={Y_OUT + OUT_R + 6}
                      width={14}
                      height={Math.max(1.5, barH)}
                      rx={2}
                      fill={`color-mix(in srgb, ${neuronColor(o)} ${Math.round(
                        35 + (p / probMax) * 55
                      )}%, var(--surface))`}
                      opacity={isPred ? 1 : 0.85}
                    />
                    {isPred && (
                      <circle
                        cx={outX(o)}
                        cy={Y_OUT}
                        r={OUT_R + 5}
                        fill="color-mix(in srgb, var(--accent) 45%, transparent)"
                        filter={`url(#${uid}-glow)`}
                      />
                    )}
                    <circle
                      cx={outX(o)}
                      cy={Y_OUT}
                      r={OUT_R}
                      fill={
                        isPred
                          ? 'var(--accent)'
                          : `color-mix(in srgb, ${neuronColor(
                              o
                            )} 22%, var(--surface))`
                      }
                      stroke={isPred ? 'var(--accent)' : 'var(--border)'}
                      strokeWidth={isPred ? 1.6 : 0.8}
                    />
                    <text
                      x={outX(o)}
                      y={Y_OUT + 3.5}
                      fontSize="10"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      fill={isPred ? 'var(--bg)' : 'var(--text-main)'}
                      fontWeight="600"
                    >
                      {o}
                    </text>
                    <text
                      x={outX(o)}
                      y={Y_OUT + OUT_R + 6 + Math.max(1.5, barH) + 11}
                      fontSize="7.5"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      fill="var(--text-dim)"
                    >
                      {(p * 100).toFixed(0)}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>
      </div>

      <div className="mlviz-readout mnv-readout">
        <div className="mlviz-row mlviz-btn-row mnv-btns">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={runFlow}>
            <Play size={13} />
            <span>Run</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={cycleSample}>
            <Shuffle size={13} />
            <span>Sample</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={clear}>
            <Eraser size={13} />
            <span>Clear</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mnv-top2">
            top-2: {top2[0].i} ({(top2[0].p * 100).toFixed(0)}%) ·{' '}
            {top2[1].i} ({(top2[1].p * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="mlviz-hint">
          pixels become a 64-vector → each hidden unit takes a weighted sum and fires through
          ReLU → 10 scores are squashed by softmax into probabilities that add to 1. Demo weights
          are fixed, so it shows the mechanism, not a trained accuracy.
        </div>
      </div>
    </div>
  );
}
