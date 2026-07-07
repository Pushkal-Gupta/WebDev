import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, Gauge, Database } from 'lucide-react';
import './CloudImageLayersViz.css';

// Build steps, bottom (base) -> top (writable). Every value is a fixed
// constant; there is no randomness anywhere, so a run is fully deterministic.
// `stable` marks layers whose inputs rarely change (base + deps) — on a
// code-only rebuild these are reused from cache, the app layer + up rebuild.
const LAYERS = [
  { key: 'base', instr: 'FROM debian:slim', name: 'Base OS userspace', mb: 74, stable: true, hue: 'is-base' },
  { key: 'deps', instr: 'RUN apt-get install', name: 'System packages', mb: 46, stable: true, hue: 'is-deps' },
  { key: 'manifest', instr: 'COPY package.json', name: 'Dependency manifest', mb: 1, stable: true, hue: 'is-manifest' },
  { key: 'modules', instr: 'RUN npm ci', name: 'Installed modules', mb: 120, stable: true, hue: 'is-modules' },
  { key: 'app', instr: 'COPY . .', name: 'Application code', mb: 8, stable: false, hue: 'is-app' },
  { key: 'write', instr: 'container start', name: 'Writable layer', mb: 0, stable: false, writable: true, hue: 'is-write' },
];

const IMAGE_MB = LAYERS.reduce((s, l) => s + l.mb, 0);
// On a code-only rebuild, the cache breaks at the first non-stable layer.
const FIRST_CHANGED = LAYERS.findIndex((l) => !l.stable);

function actionFor(layer, rebuild, cached) {
  if (cached) return `${layer.instr} — layer unchanged, reused from cache (no work).`;
  if (layer.writable) {
    return 'Container starts: a thin copy-on-write writable layer is added on top.';
  }
  if (rebuild) return `${layer.instr} — inputs changed, this layer is rebuilt.`;
  return `${layer.instr} — a new read-only layer of ${layer.mb} MB is committed.`;
}

// A step is a resting state after one layer has been placed on the stack.
function buildSteps(rebuild) {
  return LAYERS.map((layer, idx) => {
    const cached = rebuild && layer.stable && idx < FIRST_CHANGED;
    return {
      idx,
      cached,
      rebuilt: rebuild && !cached && !layer.writable,
      action: actionFor(layer, rebuild, cached),
    };
  });
}

// Geometry — a single centered vertical stack, base at the bottom.
const W = 380;
const H = 476;
const COL_X = 78;
const COL_W = 232;
const ROW_H = 52;
const GAP = 10;
const BOTTOM_Y = 452; // baseline the base layer sits on

const layerTop = (i) => BOTTOM_Y - (i + 1) * ROW_H - i * GAP;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CloudImageLayersViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [rebuild, setRebuild] = useState(false);
  const timer = useRef(null);

  const steps = useMemo(() => buildSteps(rebuild), [rebuild]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const curLayer = LAYERS[cur.idx];

  const builtMb = useMemo(
    () => LAYERS.slice(0, safeStep + 1).reduce((s, l) => s + l.mb, 0),
    [safeStep],
  );
  const cachedMb = useMemo(
    () => steps.slice(0, safeStep + 1)
      .filter((s) => s.cached)
      .reduce((s, x) => s + LAYERS[x.idx].mb, 0),
    [steps, safeStep],
  );

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function toggleRebuild() {
    setRebuild((r) => !r);
    setStep(0);
    setPlaying(false);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 340 : 820) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  return (
    <div className="cil">
      <div className="cil-head">
        <div className="cil-head-icon"><Layers size={18} /></div>
        <div className="cil-head-text">
          <h3 className="cil-title">An image is a stack of layers</h3>
          <p className="cil-sub">
            Each Dockerfile step commits one read-only layer, base at the bottom. A container adds a
            thin writable layer on top. Toggle rebuild &mdash; unchanged early layers come back from
            cache, only the changed layer and those above it rebuild.
          </p>
        </div>
        <button type="button" className="cil-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cil-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cil-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="cil-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="cil-union" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* union-mount bracket down the left, spanning the read-only image layers */}
          <line
            x1={44} y1={layerTop(LAYERS.length - 2)} x2={44} y2={BOTTOM_Y}
            className="cil-union-bar"
          />
          <text x={30} y={(layerTop(LAYERS.length - 2) + BOTTOM_Y) / 2} className="cil-union-label"
            transform={`rotate(-90 30 ${(layerTop(LAYERS.length - 2) + BOTTOM_Y) / 2})`}
            textAnchor="middle">
            read-only image
          </text>

          {/* the layer stack */}
          {LAYERS.map((layer, i) => {
            const placed = i <= safeStep;
            const active = cur.idx === i;
            const stepState = steps[i];
            const cached = active ? cur.cached : (placed && stepState.cached);
            const rebuilt = active ? cur.rebuilt : (placed && stepState.rebuilt);
            const y = layerTop(i);
            return (
              <g
                key={layer.key}
                className={`cil-layer ${layer.hue}`
                  + `${placed ? ' is-placed' : ' is-pending'}`
                  + `${active ? ' is-active' : ''}`
                  + `${cached ? ' is-cached' : ''}`
                  + `${rebuilt ? ' is-rebuilt' : ''}`
                  + `${layer.writable ? ' is-writable' : ''}`}
              >
                <rect
                  x={COL_X} y={y} width={COL_W} height={ROW_H} rx={9}
                  className="cil-layer-box"
                  filter={active ? 'url(#cil-glow)' : undefined}
                />
                <text x={COL_X + 14} y={y + 20} className="cil-layer-name">{layer.name}</text>
                <text x={COL_X + 14} y={y + 37} className="cil-layer-instr">{layer.instr}</text>
                <text x={COL_X + COL_W - 12} y={y + 30} className="cil-layer-tag" textAnchor="end">
                  {!placed ? '' : cached ? 'CACHED' : rebuilt ? 'REBUILD' : layer.writable ? 'RW' : `${layer.mb} MB`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cil-controls">
        <button type="button" className="cil-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="cil-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`cil-btn cil-rebuild${rebuild ? ' is-on' : ''}`} onClick={toggleRebuild}>
          <Database size={14} /> Rebuild {rebuild ? 'on' : 'off'}
        </button>
        <label className="cil-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="cil-speed-range"
          />
          <span className="cil-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="cil-progress">{safeStep} / {total}</span>
      </div>

      <div className="cil-readout">
        <div className="cil-stat is-layer">
          <span className="cil-stat-label">layer</span>
          <span className="cil-stat-val">{curLayer.name}</span>
        </div>
        <div className="cil-stat is-size">
          <span className="cil-stat-label">image so far</span>
          <span className="cil-stat-val">{builtMb} / {IMAGE_MB} MB</span>
        </div>
        <div className="cil-stat is-cache">
          <span className="cil-stat-label">cache</span>
          <span className="cil-stat-val">{rebuild ? `reused ${cachedMb} MB` : 'cold build'}</span>
        </div>
      </div>

      <div className="cil-note">
        <span className="cil-note-label">now</span>
        <span className="cil-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
