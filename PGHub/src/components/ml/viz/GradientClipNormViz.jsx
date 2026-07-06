import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

/*
 * Two panels. Left: the geometric view — a 2D gradient vector, the clip
 * threshold drawn as a norm-ball (circle) and a box. Clip-by-norm rescales
 * the vector to land on the ball, preserving direction. Clip-by-value clamps
 * each component into the box, distorting the direction. Right: a spiky
 * gradient-norm timeline (one deterministic seed) with the clip ceiling
 * overlaid, showing the rare spikes flattened to the cap.
 */

const W = 600;
const H = 320;

// left geometric panel
const GX = 16;
const GW = 280;
const GCX = GX + GW / 2;
const GCY = H / 2;
const GSCALE = 22; // px per gradient unit

// right timeline panel
const TX = GX + GW + 24;
const TW = W - TX - 16;
const TPAD_T = 30;
const TPAD_B = 34;
const TH = H - TPAD_T - TPAD_B;

function snap(v, p = 3) { const m = Math.pow(10, p); return Math.round(v * m) / m; }

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

// deterministic gradient-norm timeline: mostly small with rare spikes
const N_STEPS = 48;
function buildTimeline() {
  const rand = mulberry32(7);
  const norms = [];
  for (let i = 0; i < N_STEPS; i++) {
    let v = 0.4 + rand() * 0.8; // baseline noise
    if (rand() > 0.86) v += 3 + rand() * 6; // rare exploding spike
    norms.push(v);
  }
  return norms;
}

export default function GradientClipNormViz() {
  const [gx, setGx] = useState(4.2);
  const [gy, setGy] = useState(3.1);
  const [clip, setClip] = useState(3.5);

  const timeline = useMemo(() => buildTimeline(), []);
  const maxNorm = useMemo(() => Math.max(...timeline, 8), [timeline]);

  const norm = Math.hypot(gx, gy);
  const fires = norm > clip;
  const scale = fires ? clip / norm : 1;

  // clip-by-norm result
  const ngx = gx * scale;
  const ngy = gy * scale;
  const normNorm = Math.hypot(ngx, ngy);

  // clip-by-value: clamp each component into [-clip, clip] (box half-width = clip)
  const vgx = Math.max(-clip, Math.min(clip, gx));
  const vgy = Math.max(-clip, Math.min(clip, gy));
  const valNorm = Math.hypot(vgx, vgy);
  // angle distortion of value-clip vs original direction
  const dot = gx * vgx + gy * vgy;
  const cosTheta = dot / (norm * valNorm || 1);
  const angleDeg = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * (180 / Math.PI);

  const COLOR_RAW = 'var(--hue-pink)';
  const COLOR_NORM = 'var(--accent)';
  const COLOR_VAL = 'var(--hue-violet)';

  // map gradient coords -> px (y up)
  const toPx = (x, y) => [GCX + x * GSCALE, GCY - y * GSCALE];
  const [rawTx, rawTy] = toPx(gx, gy);
  const [normTx, normTy] = toPx(ngx, ngy);
  const [valTx, valTy] = toPx(vgx, vgy);

  const ballR = clip * GSCALE;
  const boxHalf = clip * GSCALE;

  // timeline scaling
  const tToPx = (i) => TX + (i / (N_STEPS - 1)) * TW;
  const nToPx = (v) => TPAD_T + (1 - Math.min(1, v / maxNorm)) * TH;
  const clipY = nToPx(clip);

  const timelinePath = timeline
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${tToPx(i).toFixed(1)},${nToPx(v).toFixed(1)}`)
    .join(' ');
  const clippedPath = timeline
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${tToPx(i).toFixed(1)},${nToPx(Math.min(v, clip)).toFixed(1)}`)
    .join(' ');

  const spikesTamed = timeline.filter((v) => v > clip).length;

  const handleReset = () => { setGx(4.2); setGy(3.1); setClip(3.5); };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg gcn-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gcn-raw" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 Z" fill={COLOR_RAW} /></marker>
            <marker id="gcn-norm" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 Z" fill={COLOR_NORM} /></marker>
            <marker id="gcn-val" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 Z" fill={COLOR_VAL} /></marker>
          </defs>

          {/* ===== left: geometric panel ===== */}
          <text x={GX} y={16} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">NORM-BALL GEOMETRY</text>

          {/* clip-by-value box */}
          <rect x={GCX - boxHalf} y={GCY - boxHalf} width={boxHalf * 2} height={boxHalf * 2} fill="none" stroke={COLOR_VAL} strokeWidth="1.1" strokeDasharray="4 3" opacity="0.7" />
          {/* clip-by-norm ball */}
          <circle cx={GCX} cy={GCY} r={ballR} fill="var(--accent)" fillOpacity="0.05" stroke={COLOR_NORM} strokeWidth="1.3" opacity="0.85" />

          {/* axes */}
          <line x1={GX} y1={GCY} x2={GX + GW} y2={GCY} stroke="var(--border)" strokeWidth="0.8" opacity="0.5" />
          <line x1={GCX} y1={GCY - GW / 2} x2={GCX} y2={GCY + GW / 2} stroke="var(--border)" strokeWidth="0.8" opacity="0.5" />

          {/* raw gradient */}
          <line x1={GCX} y1={GCY} x2={rawTx} y2={rawTy} stroke={COLOR_RAW} strokeWidth="2.4" markerEnd="url(#gcn-raw)" />
          {/* clip-by-value result */}
          <line x1={GCX} y1={GCY} x2={valTx} y2={valTy} stroke={COLOR_VAL} strokeWidth="2" markerEnd="url(#gcn-val)" opacity="0.9" />
          {/* clip-by-norm result */}
          <line x1={GCX} y1={GCY} x2={normTx} y2={normTy} stroke={COLOR_NORM} strokeWidth="2.4" markerEnd="url(#gcn-norm)" opacity="0.95" />

          <text x={GCX} y={H - 8} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            ‖g‖ {snap(norm, 2)} {fires ? `→ clip fires (×${snap(scale, 2)})` : '→ under threshold'}
          </text>

          {/* divider */}
          <line x1={TX - 12} y1={12} x2={TX - 12} y2={H - 12} stroke="var(--border)" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.6" />

          {/* ===== right: spiky timeline ===== */}
          <text x={TX} y={16} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">GRADIENT NORM OVER STEPS</text>

          {/* baseline */}
          <line x1={TX} y1={TPAD_T + TH} x2={TX + TW} y2={TPAD_T + TH} stroke="var(--border)" strokeWidth="0.8" opacity="0.6" />
          {/* clip ceiling */}
          <line x1={TX} y1={clipY} x2={TX + TW} y2={clipY} stroke={COLOR_NORM} strokeWidth="1.2" strokeDasharray="5 3" opacity="0.8" />
          <text x={TX + TW} y={clipY - 4} fontSize="11.5" fill={COLOR_NORM} fontFamily="var(--mono)" textAnchor="end">clip c = {snap(clip, 1)}</text>

          {/* raw spiky norm */}
          <path d={timelinePath} fill="none" stroke={COLOR_RAW} strokeWidth="1.4" opacity="0.55" strokeLinejoin="round" />
          {/* clipped (tamed) norm */}
          <path d={clippedPath} fill="none" stroke={COLOR_NORM} strokeWidth="2" strokeLinejoin="round" />

          {/* spike dots that exceed the cap */}
          {timeline.map((v, i) => (
            v > clip ? (
              <circle key={`sp${i}`} cx={tToPx(i)} cy={nToPx(v)} r={2.6} fill={COLOR_RAW} opacity="0.8" />
            ) : null
          ))}

          <text x={TX + TW / 2} y={H - 8} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            {spikesTamed} spike{spikesTamed === 1 ? '' : 's'} flattened to the cap
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">grad g_x</span>
          <input type="range" min="-6" max="6" step="0.1" value={gx} onChange={(e) => setGx(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(gx, 1)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">grad g_y</span>
          <input type="range" min="-6" max="6" step="0.1" value={gy} onChange={(e) => setGy(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(gy, 1)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">clip threshold c</span>
          <input type="range" min="0.5" max="8" step="0.1" value={clip} onChange={(e) => setClip(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(clip, 1)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.3rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-val" style={{ color: COLOR_RAW, minWidth: '9rem' }}>raw gradient</span>
            <span className="mlviz-val">‖g‖ = {snap(norm, 3)}</span>
            <span className="mlviz-sub">{fires ? 'exceeds c — both clips engage' : 'under c — no clip'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-val" style={{ color: COLOR_NORM, minWidth: '9rem' }}>clip-by-norm</span>
            <span className="mlviz-val">‖g′‖ = {snap(normNorm, 3)}</span>
            <span className="mlviz-sub">rescaled to the ball · direction unchanged</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-val" style={{ color: COLOR_VAL, minWidth: '9rem' }}>clip-by-value</span>
            <span className="mlviz-val">‖g′‖ = {snap(valNorm, 3)}</span>
            <span className="mlviz-sub">clamped to the box · direction off by {snap(angleDeg, 1)}°</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} /><span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          clip-by-norm projects g onto the norm-ball of radius c — same direction, capped length · clip-by-value clamps each component into the box, bending the direction · the timeline shows clipping flattening only the rare exploding spikes, leaving normal steps untouched
        </div>
      </div>

      <style>{`
        .gcn-svg { aspect-ratio: ${W} / ${H}; max-width: 620px; }
      `}</style>
    </div>
  );
}
