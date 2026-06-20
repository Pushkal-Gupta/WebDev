import React, { useMemo, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 340;

const TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat', 'today', 'too'];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function softmax(z) {
  const m = Math.max(...z);
  const exps = z.map((zi) => Math.exp(zi - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

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

// Build deterministic Q/K/V vectors (dim 3) for n tokens.
function buildQKV(n) {
  const rand = mulberry32(7 + n * 13);
  const q = [];
  const k = [];
  const v = [];
  for (let i = 0; i < n; i++) {
    q.push([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]);
    k.push([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]);
    v.push([snap(rand() * 2 - 1, 2), snap(rand() * 2 - 1, 2), snap(rand() * 2 - 1, 2)]);
  }
  return { q, k, v };
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export default function QueryKeyValueViz() {
  const [n, setN] = useState(5);
  const [queryIdx, setQueryIdx] = useState(2);

  const { q, k, v } = useMemo(() => buildQKV(n), [n]);
  const dk = 3;
  const scale = Math.sqrt(dk);

  const qi = Math.min(queryIdx, n - 1);

  const scores = useMemo(
    () => k.map((kj) => dot(q[qi], kj) / scale),
    [k, q, qi, scale],
  );
  const weights = useMemo(() => softmax(scores), [scores]);

  // weighted sum of values
  const output = useMemo(() => {
    const o = [0, 0, 0];
    for (let j = 0; j < n; j++) {
      for (let d = 0; d < dk; d++) o[d] += weights[j] * v[j][d];
    }
    return o.map((x) => snap(x, 2));
  }, [weights, v, n]);

  // ---- layout ----
  const colLeft = 70;
  const colRight = W - 200;
  const top = 56;
  const rowH = (H - top - 36) / Math.max(n, 1);
  const yFor = (j) => top + rowH * j + rowH / 2;

  const maxW = Math.max(...weights);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '820px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text x={colLeft} y={28} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            QUERY token
          </text>
          <text x={colRight - 10} y={28} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em" textAnchor="end">
            KEYS · softmax weight · VALUE
          </text>

          {/* query node */}
          <g>
            <rect
              x={colLeft - 34}
              y={yFor(qi) - 14}
              width="68"
              height="28"
              rx="6"
              fill="rgba(var(--accent-rgb), 0.12)"
              stroke="var(--accent)"
              strokeWidth="1.4"
            />
            <text x={colLeft} y={yFor(qi) - 1} fontSize="11" fill="var(--accent)" fontFamily="var(--serif)" fontStyle="italic" textAnchor="middle" fontWeight="700">
              {TOKENS[qi]}
            </text>
            <text x={colLeft} y={yFor(qi) + 10} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              q{qi}
            </text>
          </g>

          {/* edges + key/value rows */}
          {Array.from({ length: n }).map((_, j) => {
            const wj = weights[j];
            const y = yFor(j);
            const isMax = wj === maxW;
            return (
              <g key={`row-${j}`}>
                <line
                  x1={colLeft + 34}
                  y1={yFor(qi)}
                  x2={colRight - 44}
                  y2={y}
                  stroke="var(--accent)"
                  strokeWidth={Math.max(0.5, wj * 7)}
                  opacity={0.25 + wj * 0.6}
                />
                {/* key token */}
                <rect
                  x={colRight - 44}
                  y={y - 13}
                  width="58"
                  height="26"
                  rx="6"
                  fill={isMax ? 'rgba(var(--accent-rgb), 0.14)' : 'var(--surface)'}
                  stroke={isMax ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isMax ? 1.3 : 0.8}
                />
                <text x={colRight - 15} y={y - 1} fontSize="10" fill="var(--text-main)" fontFamily="var(--serif)" fontStyle="italic" textAnchor="middle">
                  {TOKENS[j]}
                </text>
                <text x={colRight - 15} y={y + 9} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  k{j}
                </text>
                {/* weight bar */}
                <rect x={colRight + 22} y={y - 6} width="90" height="12" rx="3" fill="var(--border)" opacity="0.35" />
                <rect
                  x={colRight + 22}
                  y={y - 6}
                  width={Math.max(2, wj * 90)}
                  height="12"
                  rx="3"
                  fill="var(--hue-violet)"
                  opacity={isMax ? 0.95 : 0.6}
                />
                <text x={W - 8} y={y + 3} fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="end" fontWeight={isMax ? 700 : 400}>
                  {snap(wj, 2)}
                </text>
              </g>
            );
          })}

          {/* output box */}
          <rect x={colLeft - 50} y={H - 28} width={W - 90} height="0.6" fill="var(--border)" />
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">tokens</span>
          <input
            type="range"
            min="3"
            max={TOKENS.length}
            step="1"
            value={n}
            onChange={(e) => {
              const nv = parseInt(e.target.value, 10);
              setN(nv);
              if (queryIdx >= nv) setQueryIdx(nv - 1);
            }}
          />
          <span className="mlviz-slider-val">{n}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">query i</span>
          <input
            type="range"
            min="0"
            max={n - 1}
            step="1"
            value={qi}
            onChange={(e) => setQueryIdx(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{TOKENS[qi]}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">s</span>
            <span className="mlviz-val">q·kⱼ/√d = [{scores.map((s) => snap(s, 2)).join(', ')}]</span>
            <span className="mlviz-sub">raw scaled scores</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">α</span>
            <span className="mlviz-val">softmax(s) = [{weights.map((w) => snap(w, 2)).join(', ')}]</span>
            <span className="mlviz-sub">attention weights, sum = 1</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">o</span>
            <span className="mlviz-val">Σ αⱼ·vⱼ = [{output.join(', ')}]</span>
            <span className="mlviz-sub">context vector for &ldquo;{TOKENS[qi]}&rdquo;</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setQueryIdx((p) => (p + 1) % n)}
          >
            <StepForward size={13} />
            <span>Next query</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setN(5); setQueryIdx(2); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          one query dots every key · softmax routes the mass · output is the weighted average of values
        </div>
      </div>
    </div>
  );
}
