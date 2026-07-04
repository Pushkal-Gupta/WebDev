import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Play, Pause, Layers, GitBranch } from 'lucide-react';
import './NnCnnArchViz.css';

// Deterministic PRNG (kept for API parity — the stack below is fully fixed, no randomness used).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A ResNet-style funnel. Spatial size shrinks; channels grow going down.
// rf = cumulative receptive field over the original input.
const STACK = [
  { name: 'input', kind: 'input', h: 32, c: 3, rf: 1, note: 'raw RGB image' },
  { name: 'conv 3x3', kind: 'conv', h: 32, c: 64, rf: 3, note: 'edges / colors', skipStart: true },
  { name: 'conv 3x3', kind: 'conv', h: 32, c: 64, rf: 5, note: 'edges combined', skipEnd: true },
  { name: 'pool /2', kind: 'pool', h: 16, c: 128, rf: 6, note: 'downsample, channels doubled' },
  { name: 'conv 3x3', kind: 'conv', h: 16, c: 128, rf: 10, note: 'textures / parts' },
  { name: 'pool /2', kind: 'pool', h: 8, c: 256, rf: 12, note: 'downsample again' },
  { name: 'conv 3x3', kind: 'conv', h: 8, c: 256, rf: 20, note: 'object parts, RF ~ whole image' },
  { name: 'global pool', kind: 'gpool', h: 1, c: 256, rf: 32, note: 'collapse spatial dims' },
  { name: 'dense', kind: 'dense', h: 1, c: 10, rf: 32, note: 'class scores' },
];

const KIND_HUE = {
  input: 'var(--hue-sky)',
  conv: 'var(--hue-violet)',
  pool: 'var(--hue-mint)',
  gpool: 'var(--hue-pink)',
  dense: 'var(--accent)',
};

const VB_W = 340;
const ROW_H = 34;
const TOP = 14;
const VB_H = TOP * 2 + STACK.length * ROW_H;
const CX = 168;
const BLK_H = 24;

// Block width scales with spatial size (funnel): big at top, thin at bottom.
const maxH = 32;
const blkW = (h) => 46 + (Math.sqrt(h) / Math.sqrt(maxH)) * 116;

export default function NnCnnArchViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // mulberry32 retained for deterministic contract; a fixed jitter keeps channel slabs stable.
  const slabJitter = useMemo(() => {
    const rnd = mulberry32(7);
    return STACK.map(() => 0.6 + rnd() * 0.4);
  }, []);

  const atEnd = step >= STACK.length - 1;
  const reset = () => { setStep(0); setPlaying(true); };

  useEffect(() => {
    if (!playing || atEnd) return undefined;
    const interval = reduced ? 1400 : 780;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        setStep((s) => Math.min(STACK.length - 1, s + 1));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, atEnd, step, reduced]);

  const rowY = (i) => TOP + i * ROW_H + ROW_H / 2;
  const active = STACK[step];
  const skipStartI = STACK.findIndex((s) => s.skipStart);
  const skipEndI = STACK.findIndex((s) => s.skipEnd);
  const skipLit = step >= skipEndI;

  // Channel-slab count (visual proxy for channel depth).
  const slabCount = (c) => Math.max(1, Math.min(6, Math.round(Math.log2(c + 1))));

  return (
    <div className="ncnn">
      <div className="ncnn-head">
        <div className="ncnn-head-icon"><Layers size={18} /></div>
        <div className="ncnn-head-text">
          <h3 className="ncnn-title">Step down a residual CNN funnel</h3>
          <p className="ncnn-sub">
            Feature maps shrink in height and width and grow in channels going down the stack;
            the skip arc bypasses a block so gradients flow straight back.
          </p>
        </div>
        <button type="button" className="ncnn-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="ncnn-controls">
        <button type="button" className="ncnn-btn ncnn-btn-primary"
          onClick={() => (atEnd ? reset() : setPlaying((p) => !p))}>
          {atEnd
            ? <><Play size={13} /> Replay</>
            : playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
        </button>
        <label className="ncnn-slider">
          <span className="ncnn-slider-lab">
            <span>step through layers</span>
            <span className="ncnn-slider-val">{step + 1} / {STACK.length}</span>
          </span>
          <input type="range" min={0} max={STACK.length - 1} step={1} value={step}
            onChange={(e) => { setPlaying(false); setStep(parseInt(e.target.value, 10)); }} />
        </label>
      </div>

      <div className="ncnn-body">
        <div className="ncnn-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="ncnn-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="ncnn-skip-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--hue-mint)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.6" />
              </linearGradient>
              <marker id="ncnn-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3"
                orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-dim)" />
              </marker>
              <marker id="ncnn-skip-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3.5"
                orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--hue-mint)" />
              </marker>
            </defs>

            {/* trunk edges (downward data flow) */}
            {STACK.slice(0, -1).map((_, i) => (
              <line key={`e${i}`} x1={CX} y1={rowY(i) + BLK_H / 2}
                x2={CX} y2={rowY(i + 1) - BLK_H / 2}
                className={`ncnn-edge ${step > i ? 'is-done' : ''}`}
                markerEnd="url(#ncnn-arrow)" />
            ))}

            {/* residual skip arc in the left gutter, bypassing the block pair */}
            {skipStartI >= 0 && skipEndI >= 0 && (() => {
              const y0 = rowY(skipStartI) - BLK_H / 2;
              const y1 = rowY(skipEndI) + BLK_H / 2;
              const gx = CX - blkW(STACK[skipStartI].h) / 2 - 30;
              return (
                <g className={`ncnn-skip ${skipLit ? 'is-lit' : ''}`}>
                  <path
                    d={`M ${CX - blkW(STACK[skipStartI].h) / 2} ${y0}
                        C ${gx} ${y0}, ${gx} ${y1}, ${CX - blkW(STACK[skipEndI].h) / 2} ${y1}`}
                    className="ncnn-skip-path" markerEnd="url(#ncnn-skip-arrow)" />
                  <text x={gx - 4} y={(y0 + y1) / 2} className="ncnn-skip-lab"
                    textAnchor="middle" transform={`rotate(-90 ${gx - 4} ${(y0 + y1) / 2})`}>
                    +x skip
                  </text>
                </g>
              );
            })()}

            {/* layer blocks */}
            {STACK.map((s, i) => {
              const w = blkW(s.h);
              const y = rowY(i);
              const hue = KIND_HUE[s.kind];
              const on = step === i;
              const past = step > i;
              const slabs = slabCount(s.c);
              return (
                <g key={i} className={`ncnn-block ${on ? 'is-active' : ''} ${past ? 'is-past' : ''}`}>
                  {/* channel slabs behind the main block (depth proxy) */}
                  {Array.from({ length: slabs - 1 }).map((_, k) => {
                    const off = (k + 1) * (2.4 * slabJitter[i]);
                    return (
                      <rect key={k} x={CX - w / 2 + off} y={y - BLK_H / 2 - off}
                        width={w} height={BLK_H} rx={5}
                        className="ncnn-slab" style={{ stroke: hue }} />
                    );
                  })}
                  <rect x={CX - w / 2} y={y - BLK_H / 2} width={w} height={BLK_H} rx={5}
                    className="ncnn-face"
                    style={on
                      ? { fill: `color-mix(in srgb, ${hue} 26%, var(--surface))`, stroke: hue }
                      : { stroke: hue }} />
                  <text x={CX} y={y + 0.5} className="ncnn-block-name" textAnchor="middle"
                    style={on ? { fill: 'var(--text-main)' } : undefined}>
                    {s.name}
                  </text>
                  <text x={CX + w / 2 + 8} y={y + 0.5} className="ncnn-block-dim">
                    {s.h}x{s.h} x {s.c}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="ncnn-side">
          <div className="ncnn-stat-head" style={{ borderTopColor: KIND_HUE[active.kind] }}>
            <span className="ncnn-stat-lab">layer {step + 1} / {STACK.length}</span>
            <span className="ncnn-stat-name" style={{ color: KIND_HUE[active.kind] }}>
              {active.name}
            </span>
            <span className="ncnn-stat-note">{active.note}</span>
          </div>

          <div className="ncnn-readouts">
            <div className="ncnn-stat">
              <span className="ncnn-stat-k">spatial</span>
              <span className="ncnn-stat-v">{active.h} x {active.h}</span>
            </div>
            <div className="ncnn-stat">
              <span className="ncnn-stat-k">channels</span>
              <span className="ncnn-stat-v" style={{ color: 'var(--hue-violet)' }}>{active.c}</span>
            </div>
            <div className="ncnn-stat">
              <span className="ncnn-stat-k">receptive field</span>
              <span className="ncnn-stat-v" style={{ color: 'var(--hue-mint)' }}>
                {active.rf} x {active.rf}
              </span>
            </div>
          </div>

          <div className={`ncnn-skip-card ${skipLit ? 'is-lit' : ''}`}>
            <span className="ncnn-skip-card-head">
              <GitBranch size={13} /> residual block
            </span>
            <span className="ncnn-skip-card-body">
              {skipLit
                ? 'y = F(x) + x closed — the +x shortcut carries the input past the conv pair, so the gradient keeps a clean path back.'
                : 'The +x shortcut is still open; step past the second conv to close it.'}
            </span>
          </div>

          <div className="ncnn-note">
            Down the funnel: spatial size shrinks (32 to 1), channels grow (3 to 256), and the
            receptive field widens until one late unit sees most of the image.
          </div>
        </div>
      </div>
    </div>
  );
}
