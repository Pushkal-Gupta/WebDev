import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Triangle, Play, Pause, SkipForward, RotateCcw, Gauge, Zap, ShieldCheck } from 'lucide-react';
import './TestPyramidViz.css';

// The testing pyramid. Three stacked trapezoid layers, base widest.
// Deterministic; no randomness anywhere. Stepping walks base -> top.
const LAYERS = [
  {
    key: 'unit',
    label: 'Unit',
    sub: 'one function, isolated',
    cls: 'is-unit',
    count: '~1000s',
    speedText: 'fast · ~1ms',
    costText: 'cheap',
    catches: 'Logic, edge cases, and branches in a single function or class — no I/O, precise on failure.',
    speed: 0.96,
    confidence: 0.28,
    cost: 0.14,
  },
  {
    key: 'integration',
    label: 'Integration',
    sub: 'components at the seams',
    cls: 'is-integration',
    count: '~50-200',
    speedText: 'medium · ~10-100ms',
    costText: 'moderate',
    catches: 'Contracts between real components — a service and its database, a handler and its dependencies.',
    speed: 0.55,
    confidence: 0.62,
    cost: 0.5,
  },
  {
    key: 'e2e',
    label: 'End-to-End',
    sub: 'whole app, like a user',
    cls: 'is-e2e',
    count: '~5-15',
    speedText: 'slow · ~1-10s',
    costText: 'expensive',
    catches: 'Critical user journeys through the real UI and full stack — highest confidence, but slow and brittle.',
    speed: 0.16,
    confidence: 0.95,
    cost: 0.9,
  },
];

const TOTAL = LAYERS.length - 1;

// Geometry — a centred pyramid. Base widest at the bottom.
const W = 460;
const H = 360;
const APEX_X = 230;
const APEX_Y = 26;
const BASE_Y = 300;
const HALF_BASE = 180; // half-width of the base
// three horizontal cut lines across the triangle (top of each band)
const BAND_TOPS = [BASE_Y, BASE_Y - 92, BASE_Y - 184]; // unit, integration, e2e band bottoms

function halfWidthAt(y) {
  // linear from 0 at apex to HALF_BASE at base
  const t = (y - APEX_Y) / (BASE_Y - APEX_Y);
  return HALF_BASE * t;
}

function bandPath(idx) {
  // band idx: 0 = unit (bottom), 1 = integration, 2 = e2e (apex triangle)
  const yBottom = BAND_TOPS[idx];
  const yTop = idx === TOTAL ? APEX_Y : BAND_TOPS[idx + 1];
  const hbBottom = halfWidthAt(yBottom);
  const hbTop = halfWidthAt(yTop);
  return `M ${APEX_X - hbBottom} ${yBottom} L ${APEX_X + hbBottom} ${yBottom} L ${APEX_X + hbTop} ${yTop} L ${APEX_X - hbTop} ${yTop} Z`;
}

function bandCenterY(idx) {
  const yBottom = BAND_TOPS[idx];
  const yTop = idx === TOTAL ? APEX_Y : BAND_TOPS[idx + 1];
  return (yBottom + yTop) / 2;
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function TestPyramidViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hover, setHover] = useState(null);
  const timer = useRef(null);

  const activeIdx = hover !== null ? hover : Math.min(step, TOTAL);
  const active = LAYERS[activeIdx];

  function togglePlay() {
    if (step >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 460 : 1100) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, speed]);

  const bars = useMemo(() => ([
    { key: 'speed', label: 'speed', icon: <Zap size={13} />, value: active.speed, cls: 'is-speed' },
    { key: 'confidence', label: 'confidence', icon: <ShieldCheck size={13} />, value: active.confidence, cls: 'is-confidence' },
    { key: 'cost', label: 'cost', icon: <Gauge size={13} />, value: active.cost, cls: 'is-cost' },
  ]), [active]);

  return (
    <div className="tpy">
      <div className="tpy-head">
        <div className="tpy-head-icon"><Triangle size={18} /></div>
        <div className="tpy-head-text">
          <h3 className="tpy-title">The testing pyramid</h3>
          <p className="tpy-sub">
            Many fast unit tests at the base, fewer integration tests in the middle, a thin cap of
            slow end-to-end tests &mdash; climb for confidence, descend for speed.
          </p>
        </div>
        <button type="button" className="tpy-reset" onClick={() => { setStep(0); setPlaying(false); setHover(null); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="tpy-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpy-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="tpy-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.4" result="tpy-blur" />
              <feMerge>
                <feMergeNode in="tpy-blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* speed axis (left, fast at base) and confidence axis (right, high at apex) */}
          <text x="14" y={BASE_Y} className="tpy-axis" textAnchor="start">fast</text>
          <text x="14" y={APEX_Y + 30} className="tpy-axis" textAnchor="start">slow</text>
          <text x={W - 14} y={BASE_Y} className="tpy-axis" textAnchor="end">narrow</text>
          <text x={W - 14} y={APEX_Y + 30} className="tpy-axis" textAnchor="end">broad</text>

          {LAYERS.map((layer, idx) => {
            const on = idx === activeIdx;
            const cy = bandCenterY(idx);
            return (
              <g
                key={layer.key}
                className={`tpy-band ${layer.cls}${on ? ' is-on' : ''}`}
                onMouseEnter={() => setHover(idx)}
                onMouseLeave={() => setHover(null)}
              >
                <path
                  d={bandPath(idx)}
                  className="tpy-band-shape"
                  filter={on ? 'url(#tpy-glow)' : undefined}
                />
                <text x={APEX_X} y={cy - 3} className="tpy-band-label" textAnchor="middle">{layer.label}</text>
                <text x={APEX_X} y={cy + 13} className="tpy-band-count" textAnchor="middle">{layer.count}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tpy-bars">
        {bars.map(({ key, label, icon, value, cls }) => (
          <div key={key} className={`tpy-bar ${cls}`}>
            <span className="tpy-bar-head">
              {icon} {label}
            </span>
            <span className="tpy-bar-track">
              <span className="tpy-bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
            </span>
            <span className="tpy-bar-val">{Math.round(value * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="tpy-controls">
        <button type="button" className="tpy-btn" onClick={togglePlay}>
          {playing && step < TOTAL ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < TOTAL ? 'Pause' : (step >= TOTAL ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="tpy-btn"
          onClick={() => { setHover(null); setStep((s) => Math.min(TOTAL, s + 1)); }}
          disabled={hover === null && step >= TOTAL}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="tpy-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="tpy-speed-range"
          />
          <span className="tpy-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="tpy-progress">{activeIdx + 1} / {TOTAL + 1}</span>
      </div>

      <div className="tpy-readout">
        <div className="tpy-stat is-layer">
          <span className="tpy-stat-label">layer</span>
          <span className="tpy-stat-val">{active.label}</span>
        </div>
        <div className="tpy-stat is-count">
          <span className="tpy-stat-label">count</span>
          <span className="tpy-stat-val">{active.count}</span>
        </div>
        <div className="tpy-stat is-speed">
          <span className="tpy-stat-label">speed</span>
          <span className="tpy-stat-val">{active.speedText}</span>
        </div>
        <div className="tpy-stat is-conf">
          <span className="tpy-stat-label">confidence</span>
          <span className="tpy-stat-val">{Math.round(active.confidence * 100)}%</span>
        </div>
      </div>

      <div className="tpy-note">
        <span className="tpy-note-label">catches</span>
        <span className="tpy-note-body">
          {active.catches} <em>Cost: {active.costText}.</em>
        </span>
      </div>
    </div>
  );
}
