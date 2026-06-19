import React, { useMemo, useState } from 'react';
import { Layers, Network, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 740;
const H = 420;
const N_TOKENS = 8;
const MAX_EXPERTS = 8;
const TOKEN_X = 70;
const ROUTER_X = 260;
const EXPERT_X = 540;
const ROUTER_R = 26;
const TOKEN_SIZE = 26;
const EXPERT_W = 130;
const EXPERT_H = 28;

const HUES = ['var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--easy)', 'var(--medium)', 'var(--hard)', 'var(--accent)'];

const TOKEN_LABELS = ['the', 'cat', 'sat', 'on', 'a', 'red', 'mat', '·'];

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

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Per-token logits over experts.  Deterministic from a seed so the diagram is
// stable, but skewed so a few experts dominate (this is the load-balance
// problem MoE always faces).
function generateLogits(seed, nExperts) {
  const rng = mulberry32(seed);
  const logits = [];
  for (let t = 0; t < N_TOKENS; t++) {
    const row = [];
    // each token has a "preferred" expert biased by token id
    const fav = (t * 3 + 1) % nExperts;
    for (let e = 0; e < nExperts; e++) {
      const base = (rng() - 0.5) * 1.6;
      const bias = e === fav ? 2.4 : 0;
      const tail = e === (fav + 1) % nExperts ? 1.0 : 0;
      row.push(base + bias + tail);
    }
    logits.push(row);
  }
  return logits;
}

function softmax(vec) {
  const m = Math.max(...vec);
  const ex = vec.map((v) => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

function topK(vec, k) {
  const idx = vec.map((_, i) => i).sort((a, b) => vec[b] - vec[a]);
  return idx.slice(0, k);
}

export default function MixtureOfExpertsViz() {
  const [k, setK] = useState(2);
  const [nExperts, setNExperts] = useState(4);
  const seed = 7;

  const logits = useMemo(() => generateLogits(seed, nExperts), [seed, nExperts]);

  const routing = useMemo(() => {
    const routes = []; // routes[t] = { probs, picks: [expertIdx], gates: [weight] }
    const loads = Array(nExperts).fill(0);
    for (let t = 0; t < N_TOKENS; t++) {
      const probs = softmax(logits[t]);
      const picks = topK(probs, Math.min(k, nExperts));
      const pickWeights = picks.map((p) => probs[p]);
      const wSum = pickWeights.reduce((a, b) => a + b, 0) || 1;
      const gates = pickWeights.map((w) => w / wSum);
      picks.forEach((p, i) => { loads[p] += gates[i]; });
      routes.push({ probs, picks, gates });
    }
    return { routes, loads };
  }, [logits, k, nExperts]);

  const maxLoad = Math.max(...routing.loads);
  const minLoad = Math.min(...routing.loads);
  const imbalance = minLoad > 1e-6 ? maxLoad / minLoad : Infinity;

  // layout helpers
  const tokenY = (t) => 60 + t * 38;
  const expertY = (e) => {
    const totalH = nExperts * (EXPERT_H + 6) - 6;
    const startY = (H - totalH) / 2 - 10;
    return startY + e * (EXPERT_H + 6);
  };

  const reset = () => {
    setK(2);
    setNExperts(4);
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* column headers */}
          <text x={TOKEN_X - TOKEN_SIZE / 2} y={32} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            TOKENS
          </text>
          <text x={ROUTER_X - 30} y={32} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            ROUTER · top-{k}
          </text>
          <text x={EXPERT_X} y={32} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            EXPERTS · {nExperts}
          </text>

          {/* router circle */}
          <circle
            cx={ROUTER_X}
            cy={H / 2 - 30}
            r={ROUTER_R}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <text
            x={ROUTER_X}
            y={H / 2 - 30 + 4}
            fontSize="10"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            gate
          </text>

          {/* tokens (left) */}
          {Array.from({ length: N_TOKENS }, (_, t) => {
            const y = tokenY(t);
            // primary color = top-1 expert's color
            const top1 = routing.routes[t].picks[0];
            const color = HUES[top1 % HUES.length];
            return (
              <g key={`tok-${t}`}>
                <rect
                  x={TOKEN_X - TOKEN_SIZE / 2}
                  y={y - TOKEN_SIZE / 2}
                  width={TOKEN_SIZE}
                  height={TOKEN_SIZE}
                  fill={color}
                  fillOpacity="0.18"
                  stroke={color}
                  strokeWidth="1.2"
                  rx="5"
                />
                <text
                  x={TOKEN_X}
                  y={y + 4}
                  fontSize="9.5"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {TOKEN_LABELS[t]}
                </text>
                {/* token → router line */}
                <line
                  x1={TOKEN_X + TOKEN_SIZE / 2}
                  y1={y}
                  x2={ROUTER_X - ROUTER_R}
                  y2={H / 2 - 30}
                  stroke="var(--border)"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                  opacity="0.55"
                />
              </g>
            );
          })}

          {/* router → expert routing curves coloured per-token */}
          {routing.routes.map((r, t) => {
            const ty = tokenY(t);
            return r.picks.map((e, i) => {
              const color = HUES[e % HUES.length];
              const w = Math.max(0.8, r.gates[i] * 3.2);
              const ey = expertY(e) + EXPERT_H / 2;
              const c1x = ROUTER_X + 60;
              const c1y = H / 2 - 30;
              const c2x = EXPERT_X - 60;
              const c2y = ey;
              const d = `M ${ROUTER_X + ROUTER_R} ${H / 2 - 30} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${EXPERT_X} ${ey}`;
              return (
                <g key={`r-${t}-${e}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={w}
                    opacity={i === 0 ? 0.7 : 0.45}
                  />
                  {/* gate weight label near expert side */}
                  <text
                    x={c2x + 12}
                    y={c2y - 4 + (i * 8) - (r.picks.length - 1) * 4}
                    fontSize="7.5"
                    fill={color}
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                    opacity="0.85"
                  >
                    {r.gates[i].toFixed(2)}
                  </text>
                  {/* small starting badge near token for routing visibility */}
                  <circle
                    cx={TOKEN_X + TOKEN_SIZE / 2 + 5}
                    cy={ty - 7 + i * 6}
                    r="2.2"
                    fill={color}
                  />
                </g>
              );
            });
          })}

          {/* experts (right) */}
          {Array.from({ length: nExperts }, (_, e) => {
            const y = expertY(e);
            const color = HUES[e % HUES.length];
            const load = routing.loads[e];
            const loadFrac = maxLoad > 0 ? load / maxLoad : 0;
            return (
              <g key={`exp-${e}`}>
                <rect
                  x={EXPERT_X}
                  y={y}
                  width={EXPERT_W}
                  height={EXPERT_H}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth="1.3"
                  rx="4"
                />
                {/* expert load fill */}
                <rect
                  x={EXPERT_X}
                  y={y}
                  width={EXPERT_W * loadFrac}
                  height={EXPERT_H}
                  fill={color}
                  fillOpacity="0.22"
                  rx="4"
                />
                <text
                  x={EXPERT_X + 10}
                  y={y + EXPERT_H / 2 + 3.5}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  fontWeight="700"
                >
                  E{e + 1}
                </text>
                <text
                  x={EXPERT_X + EXPERT_W - 8}
                  y={y + EXPERT_H / 2 + 3.5}
                  fontSize="9"
                  fill={color}
                  fontFamily="var(--mono)"
                  textAnchor="end"
                  fontWeight="600"
                >
                  load {load.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* load-balance bar */}
          <text
            x={EXPERT_X}
            y={H - 56}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            LOAD BALANCE BAR
          </text>
          {(() => {
            const totalLoad = routing.loads.reduce((a, b) => a + b, 0) || 1;
            const barX = EXPERT_X;
            const barW = EXPERT_W;
            const barY = H - 44;
            const barH = 16;
            const segments = routing.loads.map((l, e) => {
              const w = (l / totalLoad) * barW;
              const prior = routing.loads
                .slice(0, e)
                .reduce((a, b) => a + b, 0);
              const x = barX + (prior / totalLoad) * barW;
              return { key: `lb-${e}`, x, w, e };
            });
            return (
              <g>
                <rect x={barX} y={barY} width={barW} height={barH} fill="var(--surface)" stroke="var(--border)" strokeWidth="0.8" rx="3" />
                {segments.map((s) => (
                  <rect
                    key={s.key}
                    x={s.x}
                    y={barY}
                    width={s.w}
                    height={barH}
                    fill={HUES[s.e % HUES.length]}
                    fillOpacity="0.7"
                  />
                ))}
                <text
                  x={barX + barW + 8}
                  y={barY + barH / 2 + 3.5}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                >
                  max/min = {Number.isFinite(imbalance) ? imbalance.toFixed(2) : '∞'}
                </text>
              </g>
            );
          })()}

          {/* token-side legend: per-token routing readable list */}
          <text
            x={20}
            y={H - 56}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            TOKEN ROUTING
          </text>
          {routing.routes.map((r, t) => {
            const baseY = H - 40 + Math.floor(t / 4) * 14;
            const col = t % 4;
            const x = 20 + col * 60;
            return (
              <g key={`leg-${t}`}>
                <text
                  x={x}
                  y={baseY}
                  fontSize="8"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                >
                  {TOKEN_LABELS[t]}→
                  {r.picks.map((e) => `E${e + 1}`).join(',')}
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
              top-k
            </span>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{k}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Network size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              # experts
            </span>
            <input
              type="range"
              min="4"
              max={MAX_EXPERTS}
              step="1"
              value={nExperts}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                setNExperts(next);
                if (k > next) setK(next);
              }}
            />
            <span className="mlviz-slider-val">{nExperts}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.32rem' }}>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag">ι</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>
              imbalance  max/min = {Number.isFinite(imbalance) ? imbalance.toFixed(2) : '∞'}
            </span>
            <span className="mlviz-sub">
              {imbalance > 2.5 ? '· skewed — add aux load-balancing loss' : '· healthy'}
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.7rem', flexWrap: 'wrap' }}>
            <span className="mlviz-tag">Σ</span>
            {routing.loads.map((l, e) => (
              <span key={`load-${e}`} className="mlviz-val" style={{ color: HUES[e % HUES.length] }}>
                E{e + 1}:{snap(l).toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {N_TOKENS} tokens · {k * N_TOKENS} routes
          </span>
        </div>

        <div className="mlviz-hint">
          gate softmax over experts · top-k routing · load = Σ gate weights touching that expert
        </div>
      </div>
    </div>
  );
}
