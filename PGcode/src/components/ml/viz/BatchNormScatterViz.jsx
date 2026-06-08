import React, { useCallback, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import './MLViz.css';

const W = 480;
const H = 320;
const PAD_L = 36;
const PAD_R = 18;
const PLOT_W = W - PAD_L - PAD_R;

const TOP_Y = 70;
const BOTTOM_Y = 220;
const LINE_LEN = PLOT_W;

const EPS = 1e-5;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Mulberry32 — deterministic seeded PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededGaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateBatch(n, mean, std, seed) {
  const rng = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(mean + std * seededGaussian(rng));
  return out;
}

function batchStats(arr) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  const std = Math.sqrt(variance);
  return { mean, variance, std };
}

// Nice axis range padded around min/max
function niceRange(min, max) {
  const span = max - min || 1;
  const pad = span * 0.15;
  return [min - pad, max + pad];
}

function makeScale(min, max) {
  return (v) => PAD_L + ((v - min) / (max - min)) * LINE_LEN;
}

function NumberLine({ y, min, max, ticks, label, values, mean, std, accent }) {
  const scale = makeScale(min, max);
  const meanX = scale(mean);
  const stdLeftX = scale(mean - std);
  const stdRightX = scale(mean + std);

  return (
    <g>
      {/* panel label */}
      <text
        x={PAD_L}
        y={y - 36}
        fontSize="10"
        fontFamily="var(--mono, monospace)"
        fill="var(--accent)"
        letterSpacing="0.14em"
        fontWeight="700"
      >
        {label}
      </text>

      {/* std band */}
      <rect
        x={stdLeftX}
        y={y - 22}
        width={Math.max(1, stdRightX - stdLeftX)}
        height={44}
        fill={accent}
        opacity={0.08}
        rx={2}
      />

      {/* axis */}
      <line
        x1={PAD_L}
        y1={y}
        x2={PAD_L + LINE_LEN}
        y2={y}
        stroke="var(--border)"
        strokeWidth="1"
      />

      {/* axis ticks */}
      {ticks.map((t) => {
        const tx = scale(t);
        return (
          <g key={`t${t}`}>
            <line
              x1={tx}
              y1={y - 3}
              x2={tx}
              y2={y + 3}
              stroke="var(--border)"
              strokeWidth="0.7"
            />
            <text
              x={tx}
              y={y + 14}
              fontSize="8.5"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              textAnchor="middle"
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* value ticks */}
      {values.map((v, i) => {
        const vx = scale(v);
        return (
          <g key={`v${i}`}>
            <line
              x1={vx}
              y1={y - 14}
              x2={vx}
              y2={y + 14}
              stroke={accent}
              strokeWidth="1.6"
              opacity={0.85}
            />
            <circle
              cx={vx}
              cy={y}
              r={2.5}
              fill={accent}
            />
            <text
              x={vx}
              y={y - 18}
              fontSize="8"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              textAnchor="middle"
            >
              {snap(v, 1)}
            </text>
          </g>
        );
      })}

      {/* mean marker */}
      <g>
        <line
          x1={meanX}
          y1={y + 18}
          x2={meanX}
          y2={y + 34}
          stroke="var(--hue-sky, #5ecbff)"
          strokeWidth="1.6"
        />
        <polygon
          points={`${meanX - 4},${y + 18} ${meanX + 4},${y + 18} ${meanX},${y + 14}`}
          fill="var(--hue-sky, #5ecbff)"
        />
        <text
          x={meanX}
          y={y + 46}
          fontSize="9"
          fontFamily="var(--mono, monospace)"
          fill="var(--hue-sky, #5ecbff)"
          textAnchor="middle"
          fontWeight="700"
        >
          μ = {snap(mean)}
        </text>
      </g>

      {/* std bracket */}
      <g>
        <line
          x1={stdLeftX}
          y1={y + 60}
          x2={stdRightX}
          y2={y + 60}
          stroke="var(--hue-pink, #ff8fb3)"
          strokeWidth="1.2"
        />
        <line
          x1={stdLeftX}
          y1={y + 56}
          x2={stdLeftX}
          y2={y + 64}
          stroke="var(--hue-pink, #ff8fb3)"
          strokeWidth="1.2"
        />
        <line
          x1={stdRightX}
          y1={y + 56}
          x2={stdRightX}
          y2={y + 64}
          stroke="var(--hue-pink, #ff8fb3)"
          strokeWidth="1.2"
        />
        <text
          x={(stdLeftX + stdRightX) / 2}
          y={y + 74}
          fontSize="9"
          fontFamily="var(--mono, monospace)"
          fill="var(--hue-pink, #ff8fb3)"
          textAnchor="middle"
          fontWeight="700"
        >
          σ = {snap(std)}
        </text>
      </g>
    </g>
  );
}

function buildTicks(min, max, count = 9) {
  // Find a nice step; we just use evenly spaced rounded ticks.
  const step = (max - min) / (count - 1);
  const ticks = [];
  for (let i = 0; i < count; i++) {
    ticks.push(snap(min + i * step, 0));
  }
  // dedupe consecutive
  return Array.from(new Set(ticks));
}

export default function BatchNormScatterViz() {
  const [batchSize, setBatchSize] = useState(12);
  const [rawMean, setRawMean] = useState(5);
  const [rawStd, setRawStd] = useState(3);
  const [seed, setSeed] = useState(7);

  const batch = useMemo(
    () => generateBatch(batchSize, rawMean, rawStd, seed),
    [batchSize, rawMean, rawStd, seed]
  );

  const beforeStats = useMemo(() => batchStats(batch), [batch]);
  const normalized = useMemo(() => {
    const denom = Math.sqrt(beforeStats.variance + EPS);
    return batch.map((x) => (x - beforeStats.mean) / denom);
  }, [batch, beforeStats]);
  const afterStats = useMemo(() => batchStats(normalized), [normalized]);

  // axis ranges
  const beforeRange = useMemo(() => {
    const lo = Math.min(...batch);
    const hi = Math.max(...batch);
    return niceRange(lo, hi);
  }, [batch]);
  const afterRange = useMemo(() => {
    const lo = Math.min(...normalized);
    const hi = Math.max(...normalized);
    return niceRange(Math.min(lo, -3), Math.max(hi, 3));
  }, [normalized]);

  const beforeTicks = useMemo(() => buildTicks(beforeRange[0], beforeRange[1], 9), [beforeRange]);
  const afterTicks = useMemo(() => buildTicks(afterRange[0], afterRange[1], 9), [afterRange]);

  const handleReseed = useCallback(() => {
    setSeed((s) => (s * 1664525 + 1013904223) >>> 0);
  }, []);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <NumberLine
            y={TOP_Y}
            min={beforeRange[0]}
            max={beforeRange[1]}
            ticks={beforeTicks}
            label="BEFORE BN"
            values={batch}
            mean={beforeStats.mean}
            std={beforeStats.std}
            accent="var(--accent)"
          />

          {/* arrow between panels */}
          <g>
            <line
              x1={W / 2}
              y1={TOP_Y + 84}
              x2={W / 2}
              y2={BOTTOM_Y - 50}
              stroke="var(--text-dim)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity={0.6}
            />
            <polygon
              points={`${W / 2 - 4},${BOTTOM_Y - 50} ${W / 2 + 4},${BOTTOM_Y - 50} ${W / 2},${BOTTOM_Y - 44}`}
              fill="var(--text-dim)"
              opacity={0.6}
            />
            <text
              x={W / 2 + 10}
              y={(TOP_Y + BOTTOM_Y) / 2 - 4}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              x̂ = (x − μ) / √(σ² + ε)
            </text>
          </g>

          <NumberLine
            y={BOTTOM_Y}
            min={afterRange[0]}
            max={afterRange[1]}
            ticks={afterTicks}
            label="AFTER BN"
            values={normalized}
            mean={afterStats.mean}
            std={afterStats.std}
            accent="var(--hue-sky, #5ecbff)"
          />
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>x</span>
          <span className="mlviz-val">μ = {snap(beforeStats.mean)}</span>
          <span className="mlviz-sub">σ = {snap(beforeStats.std)}</span>
          <span className="mlviz-sub">n = {batchSize}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>x̂</span>
          <span className="mlviz-val">μ = {snap(afterStats.mean)}</span>
          <span className="mlviz-sub">σ = {snap(afterStats.std)}</span>
          <span className="mlviz-sub">(target: 0, 1)</span>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">batch n</span>
            <input
              type="range"
              min="4"
              max="32"
              step="1"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{batchSize}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">raw μ</span>
            <input
              type="range"
              min="-5"
              max="10"
              step="0.1"
              value={rawMean}
              onChange={(e) => setRawMean(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(rawMean, 1)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">raw σ</span>
            <input
              type="range"
              min="0.5"
              max="6"
              step="0.1"
              value={rawStd}
              onChange={(e) => setRawStd(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(rawStd, 1)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleReseed}
          >
            <RefreshCw size={13} />
            <span>Sample new batch</span>
          </button>
        </div>

        <div className="mlviz-hint">
          slide the raw mean and spread — BN re-centers to 0 and rescales to unit σ every time.
        </div>
      </div>
    </div>
  );
}
