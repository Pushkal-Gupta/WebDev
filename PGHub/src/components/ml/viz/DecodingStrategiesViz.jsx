import React, { useMemo, useState } from 'react';
import { Sliders, Compass } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 360;
const PAD_L = 16;
const PAD_R = 16;
const PAD_T = 36;
const PAD_B = 36;

const SEED = 7;
const VOCAB = ['the', 'cat', 'sat', 'on', 'mat', 'fox', 'ran', 'far', 'red', 'big', 'sleeps', 'quietly'];
const V = VOCAB.length;

const STRATEGIES = [
  { key: 'greedy', label: 'greedy', color: 'var(--hue-sky)' },
  { key: 'beam',   label: 'beam b=3', color: 'var(--hue-violet)' },
  { key: 'topk',   label: 'top-k=50', color: 'var(--hue-mint)' },
  { key: 'topp',   label: 'top-p=0.9', color: 'var(--hue-pink)' },
  { key: 'temp',   label: 'temp=1.2', color: 'var(--accent)' },
];

function mulberry32(a) {
  let s = a >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softmax(logits, T = 1.0) {
  const t = Math.max(0.05, T);
  const scaled = logits.map((z) => z / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

// Deterministic logits per (context-token-idx, child) so all strategies see
// the SAME "model" — the only difference is how each selects from the dist.
function logitsAt(parentTokenIdx, depth) {
  // build a reproducible logit vector for this node from a tiny PRNG seeded by
  // (parentTokenIdx, depth)
  const r = mulberry32(SEED + (parentTokenIdx + 1) * 9973 + depth * 131);
  const logits = new Array(V);
  for (let i = 0; i < V; i++) {
    // skewed: low-index tokens get a head start so a clear winner exists
    logits[i] = r() * 2.5 - 0.5 + (V - i) * 0.18;
  }
  return logits;
}

function sampleFromDist(dist, rng) {
  const u = rng();
  let acc = 0;
  for (let i = 0; i < dist.length; i++) {
    acc += dist[i];
    if (u <= acc) return i;
  }
  return dist.length - 1;
}

function topKFilter(probs, k) {
  const idx = probs.map((p, i) => i).sort((a, b) => probs[b] - probs[a]).slice(0, k);
  const keep = new Set(idx);
  const out = probs.map((p, i) => (keep.has(i) ? p : 0));
  const s = out.reduce((a, b) => a + b, 0) || 1;
  return out.map((p) => p / s);
}

function topPFilter(probs, p) {
  const sortedIdx = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
  let cum = 0;
  const keep = new Set();
  for (const i of sortedIdx) {
    keep.add(i);
    cum += probs[i];
    if (cum >= p) break;
  }
  const out = probs.map((pr, i) => (keep.has(i) ? pr : 0));
  const s = out.reduce((a, b) => a + b, 0) || 1;
  return out.map((pr) => pr / s);
}

function decodeGreedy(len) {
  let prev = 0;
  const path = [];
  let logP = 0;
  for (let d = 0; d < len; d++) {
    const probs = softmax(logitsAt(prev, d));
    let best = 0;
    for (let i = 1; i < V; i++) if (probs[i] > probs[best]) best = i;
    path.push(best);
    logP += Math.log(Math.max(probs[best], 1e-12));
    prev = best;
  }
  return { path, logP };
}

function decodeBeam(len, beamWidth = 3) {
  let beams = [{ path: [], logP: 0, last: 0 }];
  for (let d = 0; d < len; d++) {
    const expanded = [];
    for (const b of beams) {
      const probs = softmax(logitsAt(b.last, d));
      for (let i = 0; i < V; i++) {
        expanded.push({
          path: b.path.concat(i),
          logP: b.logP + Math.log(Math.max(probs[i], 1e-12)),
          last: i,
        });
      }
    }
    expanded.sort((a, b) => b.logP - a.logP);
    beams = expanded.slice(0, beamWidth);
  }
  const top = beams[0];
  return { path: top.path, logP: top.logP };
}

function decodeFiltered(len, mode, rngSeed) {
  const rng = mulberry32(rngSeed);
  let prev = 0;
  const path = [];
  let logP = 0;
  for (let d = 0; d < len; d++) {
    let probs = softmax(logitsAt(prev, d));
    if (mode === 'topk') probs = topKFilter(probs, 50); // 50 > vocab so effectively no-op for our tiny vocab; keep semantics
    if (mode === 'topp') probs = topPFilter(probs, 0.9);
    if (mode === 'temp') probs = softmax(logitsAt(prev, d), 1.2);
    const tok = sampleFromDist(probs, rng);
    path.push(tok);
    logP += Math.log(Math.max(probs[tok], 1e-12));
    prev = tok;
  }
  return { path, logP };
}

function repetitionRate(path) {
  if (path.length <= 1) return 0;
  let rep = 0;
  for (let i = 1; i < path.length; i++) if (path[i] === path[i - 1]) rep++;
  return rep / (path.length - 1);
}

export default function DecodingStrategiesViz() {
  const [length, setLength] = useState(5);

  const results = useMemo(() => {
    return {
      greedy: decodeGreedy(length),
      beam: decodeBeam(length, 3),
      topk: decodeFiltered(length, 'topk', SEED + 101),
      topp: decodeFiltered(length, 'topp', SEED + 202),
      temp: decodeFiltered(length, 'temp', SEED + 303),
    };
  }, [length]);

  // layout: 5 horizontal lanes, one per strategy
  const laneCount = STRATEGIES.length;
  const laneH = (H - PAD_T - PAD_B) / laneCount;
  const colWidth = (W - PAD_L - PAD_R - 110) / Math.max(1, length); // 110 reserved for label column
  const labelColX = PAD_L + 6;
  const tokenColX = PAD_L + 110;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* col headers */}
          <text x={labelColX} y={22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            STRATEGY
          </text>
          <text x={tokenColX} y={22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            SAMPLED TOKEN PATH
          </text>
          <text x={W - PAD_R} y={22} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em" textAnchor="end">
            log P  ·  REP RATE
          </text>
          <line x1={PAD_L} y1={28} x2={W - PAD_R} y2={28} stroke="var(--border)" strokeWidth="0.7" opacity="0.6" />

          {STRATEGIES.map((strat, lane) => {
            const yTop = PAD_T + lane * laneH;
            const yMid = yTop + laneH / 2;
            const res = results[strat.key];
            const rep = repetitionRate(res.path);
            return (
              <g key={strat.key}>
                {/* lane background */}
                <rect
                  x={PAD_L}
                  y={yTop + 4}
                  width={W - PAD_L - PAD_R}
                  height={laneH - 8}
                  rx="6"
                  fill="var(--bg)"
                  stroke="var(--border)"
                  strokeWidth="1"
                  opacity="0.55"
                />
                {/* color stripe */}
                <rect x={PAD_L} y={yTop + 4} width="4" height={laneH - 8} rx="2" fill={strat.color} opacity="0.9" />

                {/* strategy label */}
                <text
                  x={labelColX}
                  y={yMid - 2}
                  fontSize="11"
                  fill="var(--text-main)"
                  fontFamily="var(--mono)"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  {strat.label}
                </text>

                {/* tree path: connect token nodes */}
                {res.path.map((tok, i) => {
                  if (i === 0) return null;
                  const x1 = tokenColX + (i - 1) * colWidth + colWidth * 0.35;
                  const x2 = tokenColX + i * colWidth - colWidth * 0.35;
                  return (
                    <line
                      key={`edge-${i}`}
                      x1={x1}
                      y1={yMid}
                      x2={x2}
                      y2={yMid}
                      stroke={strat.color}
                      strokeWidth="1.4"
                      opacity="0.55"
                    />
                  );
                })}

                {/* token nodes */}
                {res.path.map((tok, i) => {
                  const cx = tokenColX + i * colWidth + colWidth * 0.35;
                  return (
                    <g key={`tok-${i}`}>
                      <circle cx={cx} cy={yMid} r="9" fill="var(--surface)" stroke={strat.color} strokeWidth="1.6" />
                      <text
                        x={cx + 12}
                        y={yMid + 3}
                        fontSize="10"
                        fill="var(--text-main)"
                        fontFamily="var(--mono)"
                      >
                        {VOCAB[tok]}
                      </text>
                    </g>
                  );
                })}

                {/* right-side metrics */}
                <text
                  x={W - PAD_R - 4}
                  y={yMid - 4}
                  fontSize="10"
                  fill={strat.color}
                  fontFamily="var(--mono)"
                  textAnchor="end"
                  fontWeight="700"
                >
                  {res.logP.toFixed(2)}
                </text>
                <text
                  x={W - PAD_R - 4}
                  y={yMid + 9}
                  fontSize="9"
                  fill={rep > 0 ? 'var(--hue-pink)' : 'var(--text-dim)'}
                  fontFamily="var(--mono)"
                  textAnchor="end"
                >
                  rep {Math.round(rep * 100)}%
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
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              sequence length
            </span>
            <input
              type="range"
              min="3"
              max="8"
              step="1"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{length}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.0rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          {STRATEGIES.map((s) => (
            <span key={s.key} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block', alignSelf: 'center' }} />
              <span className="mlviz-tag">{s.label}</span>
              <span className="mlviz-val" style={{ color: s.color }}>{results[s.key].logP.toFixed(2)}</span>
            </span>
          ))}
        </div>

        <div className="mlviz-hint">
          <Compass size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
          greedy and beam maximize log-prob; top-k/top-p/temperature trade probability for diversity — watch repetition rise as temperature kicks in
        </div>
      </div>
    </div>
  );
}
