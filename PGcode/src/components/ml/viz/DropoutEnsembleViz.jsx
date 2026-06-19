import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, StepForward, Play, Pause } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 320;

// network shape: 3 input, 5 hidden, 5 hidden, 2 output (only hidden units drop)
const LAYERS = [3, 5, 5, 2];

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// total droppable hidden units
const HIDDEN = LAYERS[1] + LAYERS[2];

function buildMask(step, p) {
  const rand = mulberry32(1000 + step * 31);
  // alive[layer][unit] — input + output always alive
  const alive = LAYERS.map((cnt, li) =>
    Array.from({ length: cnt }, () => {
      if (li === 0 || li === LAYERS.length - 1) return true;
      return rand() >= p;
    }),
  );
  return alive;
}

export default function DropoutEnsembleViz() {
  const [p, setP] = useState(0.4);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const alive = useMemo(() => buildMask(step, p), [step, p]);

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setInterval(() => setStep((s) => s + 1), 950);
    return () => clearInterval(timer.current);
  }, [playing]);

  const aliveHidden = alive[1].filter(Boolean).length + alive[2].filter(Boolean).length;

  // layout
  const padX = 70;
  const padY = 36;
  const colGap = (W - padX * 2) / (LAYERS.length - 1);
  const nodeR = 13;

  const pos = LAYERS.map((cnt, li) => {
    const x = padX + colGap * li;
    const slotH = (H - padY * 2) / Math.max(cnt, 1);
    return Array.from({ length: cnt }, (_, u) => ({
      x,
      y: padY + slotH * u + slotH / 2,
    }));
  });

  // 2^HIDDEN formatted
  const ensembleCount = useMemo(() => {
    // 2^HIDDEN as a readable string
    const exp = HIDDEN;
    const approx = Math.pow(2, exp);
    return { exp, approx };
  }, []);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '820px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* edges — only between alive nodes */}
          {pos.slice(0, -1).map((col, li) =>
            col.map((a, ai) =>
              pos[li + 1].map((b, bi) => {
                const on = alive[li][ai] && alive[li + 1][bi];
                return (
                  <line
                    key={`e-${li}-${ai}-${bi}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={on ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={on ? 1 : 0.5}
                    opacity={on ? 0.35 : 0.08}
                  />
                );
              }),
            ),
          )}

          {/* nodes */}
          {pos.map((col, li) =>
            col.map((nd, u) => {
              const on = alive[li][u];
              const droppable = li !== 0 && li !== LAYERS.length - 1;
              return (
                <g key={`n-${li}-${u}`}>
                  <circle
                    cx={nd.x}
                    cy={nd.y}
                    r={nodeR}
                    fill={on ? 'rgba(var(--accent-rgb), 0.14)' : 'var(--surface)'}
                    stroke={on ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={on ? 1.4 : 0.8}
                    strokeDasharray={!on && droppable ? '2 2' : undefined}
                    opacity={on ? 1 : 0.4}
                  />
                  {!on && droppable && (
                    <line
                      x1={nd.x - 6}
                      y1={nd.y - 6}
                      x2={nd.x + 6}
                      y2={nd.y + 6}
                      stroke="var(--text-dim)"
                      strokeWidth="1.2"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            }),
          )}

          {/* layer labels */}
          {['in', 'h1', 'h2', 'out'].map((lab, li) => (
            <text
              key={`l-${li}`}
              x={pos[li][0].x}
              y={H - 8}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              {lab}
            </text>
          ))}

          <text x={padX} y={18} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            forward pass #{step + 1} · this sub-network only
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">drop p</span>
          <input
            type="range"
            min="0"
            max="0.7"
            step="0.05"
            value={p}
            onChange={(e) => setP(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{p.toFixed(2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">m</span>
            <span className="mlviz-val">
              {aliveHidden} / {HIDDEN} hidden units alive this pass
            </span>
            <span className="mlviz-sub">fresh Bernoulli mask every minibatch</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">2ⁿ</span>
            <span className="mlviz-val">
              2^{ensembleCount.exp} ≈ {ensembleCount.approx.toLocaleString()} sub-networks
            </span>
            <span className="mlviz-sub">implicit ensemble over shared weights</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">×</span>
            <span className="mlviz-val">
              train: a⊙m / (1−p) = ×{(1 / (1 - p)).toFixed(2)} · test: full net, ×1
            </span>
            <span className="mlviz-sub">inverted-dropout scaling keeps E[a] fixed</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStep((s) => s + 1)}
          >
            <StepForward size={13} />
            <span>New mask</span>
          </button>
          <button
            type="button"
            className={`mlviz-btn${playing ? ' mlviz-btn-primary' : ''}`}
            onClick={() => setPlaying((v) => !v)}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setStep(0); setP(0.4); setPlaying(false); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          each pass samples a different sub-network · the weights are shared · test-time runs the full averaged net
        </div>
      </div>
    </div>
  );
}
