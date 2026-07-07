import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  GitCommitHorizontal, Play, Pause, SkipForward, RotateCcw, Gauge,
  Check, X, Rocket, Download, SearchCode, FlaskConical, Hammer, Globe,
} from 'lucide-react';
import './TestCiPipelineViz.css';

// Vertical CI pipeline. A commit flows straight DOWN through the stages.
// Deterministic; no randomness anywhere.
const STAGES = [
  { key: 'push', label: 'git push', sub: 'commit enters CI', Icon: GitCommitHorizontal },
  { key: 'install', label: 'install', sub: 'restore dependencies', Icon: Download },
  { key: 'lint', label: 'lint', sub: 'style + static checks', Icon: SearchCode },
  { key: 'unit', label: 'unit tests', sub: 'fast tests + coverage', Icon: FlaskConical },
  { key: 'build', label: 'build', sub: 'compile + bundle', Icon: Hammer },
  { key: 'e2e', label: 'e2e tests', sub: 'browser end-to-end', Icon: Globe },
  { key: 'deploy', label: 'deploy', sub: 'ship to production', Icon: Rocket },
];

const SCENARIOS = {
  green: { label: 'all green', tag: 'deploys', failKey: null },
  unit: { label: 'unit fails', tag: 'blocks', failKey: 'unit' },
  e2e: { label: 'e2e fails', tag: 'blocks', failKey: 'e2e' },
};
const SCEN_ORDER = ['green', 'unit', 'e2e'];

const STAGE_TEXT = {
  push: 'A commit is pushed and enters the pipeline.',
  install: 'Dependencies are restored on a clean runner.',
  lint: 'Style and static checks run first — cheapest, fail-fast.',
  unit: 'Fast unit tests run and coverage is measured.',
  build: 'The project compiles and bundles.',
  e2e: 'End-to-end tests exercise the app in a browser.',
  deploy: 'All gates green — the commit ships to production.',
};

// Geometry
const W = 360;
const H = 470;
const NODE_W = 210;
const NODE_X = (W - NODE_W) / 2;
const NODE_H = 42;
const Y0 = 14;
const STEP_Y = 62;
const nodeY = (i) => Y0 + i * STEP_Y;
const nodeCX = NODE_X + NODE_W / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function TestCiPipelineViz() {
  const [scenario, setScenario] = useState('green');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const failKey = SCENARIOS[scenario].failKey;
  const failIndex = failKey ? STAGES.findIndex((s) => s.key === failKey) : -1;
  const lastStage = failIndex >= 0 ? failIndex : STAGES.length - 1;
  const active = Math.min(step, lastStage);

  const done = step >= lastStage;
  const deployed = failIndex < 0 && done;
  const blocked = failIndex >= 0 && done;
  const outcome = deployed ? 'deployed' : blocked ? 'blocked' : 'running';

  function selectScenario(key) {
    setScenario(key);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (step >= lastStage) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= lastStage) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(lastStage, s + 1)),
      Math.round((reduced() ? 420 : 950) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, lastStage, speed]);

  const stateOf = useMemo(() => (i) => {
    if (failIndex >= 0 && i > failIndex) return 'blocked';
    if (i < active) return 'pass';
    if (i > active) return 'pending';
    if (i === failIndex) return 'fail';
    if (active === lastStage && failIndex < 0) return 'pass';
    return 'running';
  }, [active, failIndex, lastStage]);

  const activeStage = STAGES[active];

  return (
    <div className="tci">
      <div className="tci-head">
        <div className="tci-head-icon"><Gauge size={18} /></div>
        <div className="tci-head-text">
          <h3 className="tci-title">Continuous-integration pipeline</h3>
          <p className="tci-sub">
            A commit flows down through each stage. The first failure trips the gate &mdash;
            everything below is blocked and nothing deploys until the build is green.
          </p>
        </div>
        <button type="button" className="tci-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="tci-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tci-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tci-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="tci-arrow-head" />
            </marker>
            <marker id="tci-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="tci-arrow-head-hot" />
            </marker>
            <marker id="tci-arrow-dead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="tci-arrow-head-dead" />
            </marker>
          </defs>

          {/* downward trunk arrows */}
          {STAGES.slice(0, -1).map((s, i) => {
            const y1 = nodeY(i) + NODE_H;
            const y2 = nodeY(i + 1);
            const passedThrough = i < active;
            const dead = failIndex >= 0 && i >= failIndex;
            const cls = dead ? ' is-dead' : passedThrough ? ' is-hot' : '';
            const marker = dead ? 'url(#tci-arrow-dead)' : passedThrough ? 'url(#tci-arrow-hot)' : 'url(#tci-arrow)';
            return (
              <line
                key={`edge-${s.key}`}
                x1={nodeCX} y1={y1} x2={nodeCX} y2={y2}
                className={`tci-edge${cls}`}
                markerEnd={marker}
              />
            );
          })}

          {/* commit token riding down the left gutter */}
          <g className="tci-commit" transform={`translate(40, ${nodeY(active) + NODE_H / 2})`}>
            <circle r={12} className="tci-commit-halo" />
            <GitCommitHorizontal x={-8} y={-8} width={16} height={16} className="tci-commit-icon" />
          </g>

          {/* stage nodes */}
          {STAGES.map((s, i) => {
            const st = stateOf(i);
            const y = nodeY(i);
            const StageIcon = s.Icon;
            return (
              <g key={s.key} className={`tci-node is-${st}`}>
                <rect x={NODE_X} y={y} width={NODE_W} height={NODE_H} rx={9} className="tci-node-box" />
                <g transform={`translate(${NODE_X + 12}, ${y + NODE_H / 2 - 8})`}>
                  <StageIcon width={16} height={16} className="tci-node-lead" />
                </g>
                <text x={NODE_X + 38} y={y + 18} className="tci-node-label">{s.label}</text>
                <text x={NODE_X + 38} y={y + 32} className="tci-node-sub">{s.sub}</text>
                {st === 'pass' && (
                  <g transform={`translate(${NODE_X + NODE_W - 26}, ${y + NODE_H / 2 - 8})`}>
                    <Check width={16} height={16} className="tci-node-mark is-pass" />
                  </g>
                )}
                {st === 'fail' && (
                  <g transform={`translate(${NODE_X + NODE_W - 26}, ${y + NODE_H / 2 - 8})`}>
                    <X width={16} height={16} className="tci-node-mark is-fail" />
                  </g>
                )}
                {st === 'running' && (
                  <circle cx={NODE_X + NODE_W - 18} cy={y + NODE_H / 2} r={4} className="tci-node-pulse" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="tci-scenarios">
        {SCEN_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`tci-scen-btn tci-scen-${key}${scenario === key ? ' is-on' : ''}`}
            onClick={() => selectScenario(key)}
          >
            <span className="tci-scen-label">{SCENARIOS[key].label}</span>
            <span className="tci-scen-tag">{SCENARIOS[key].tag}</span>
          </button>
        ))}
      </div>

      <div className="tci-controls">
        <button type="button" className="tci-btn" onClick={togglePlay}>
          {playing && step < lastStage ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < lastStage ? 'Pause' : (step >= lastStage ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="tci-btn" onClick={() => setStep((s) => Math.min(lastStage, s + 1))} disabled={step >= lastStage}>
          <SkipForward size={14} /> Step
        </button>
        <label className="tci-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="tci-speed-range"
          />
          <span className="tci-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="tci-progress">stage {active + 1} / {STAGES.length}</span>
      </div>

      <div className="tci-readout">
        <div className="tci-stat is-stage">
          <span className="tci-stat-label">stage</span>
          <span className="tci-stat-val">{activeStage.label}</span>
        </div>
        <div className="tci-stat is-scen">
          <span className="tci-stat-label">scenario</span>
          <span className="tci-stat-val">{SCENARIOS[scenario].label}</span>
        </div>
        <div className={`tci-stat is-outcome is-${outcome}`}>
          <span className="tci-stat-label">outcome</span>
          <span className="tci-stat-val">
            {outcome === 'deployed' && <Rocket size={13} />}
            {outcome === 'blocked' && <X size={13} />}
            {outcome === 'deployed' ? 'deployed' : outcome === 'blocked' ? 'deploy blocked' : 'running…'}
          </span>
        </div>
      </div>

      <div className="tci-note">
        <span className="tci-note-label">now</span>
        <span className="tci-note-body">
          {stateOf(active) === 'fail'
            ? <>The <strong>{activeStage.label}</strong> stage failed. The gate trips: every stage below is blocked and nothing deploys.</>
            : deployed
              ? <>Every gate passed. <em>Green build — the commit deploys to production.</em></>
              : <>{STAGE_TEXT[activeStage.key]}</>}
        </span>
      </div>
    </div>
  );
}
