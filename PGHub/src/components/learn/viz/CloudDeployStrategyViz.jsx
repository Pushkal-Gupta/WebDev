import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Rocket, Play, Pause, SkipForward, RotateCcw, Gauge, GitBranch, AlertTriangle } from 'lucide-react';
import './CloudDeployStrategyViz.css';

// Three deployment strategies, each a fixed deterministic script of fleet
// states. No randomness anywhere; a given (strategy, error) pair always
// produces the same steps. Version tags: old = v1 (green), new = v2 (teal),
// fail = broken new, boot = starting/health-checking, empty = not running.
const OLD = 'old';
const NEW = 'new';
const FAIL = 'fail';
const BOOT = 'boot';
const EMPTY = 'empty';

const N = 6; // instances in the fleet

const row = (v) => Array(N).fill(v);
const mix = (list) => list.slice(0, N);

const STRATEGIES = {
  rolling: {
    key: 'rolling',
    name: 'Rolling',
    icon: 'GitBranch',
    blurb: 'Replace instances a few at a time; capacity dips slightly, traffic never drops.',
    ok: [
      { fleet: row(OLD), note: 'Six old instances (v1) serving all traffic.', status: 'running' },
      { fleet: mix([BOOT, BOOT, OLD, OLD, OLD, OLD]), note: 'Two new pods (v2) start; readiness probe gates them.', status: 'starting' },
      { fleet: mix([NEW, NEW, OLD, OLD, OLD, OLD]), note: 'Two new pods pass health checks and take traffic.', status: 'healthy' },
      { fleet: mix([NEW, NEW, BOOT, BOOT, OLD, OLD]), note: 'Next batch of two new pods boots up.', status: 'starting' },
      { fleet: mix([NEW, NEW, NEW, NEW, OLD, OLD]), note: 'Four new pods healthy; two old pods remain.', status: 'healthy' },
      { fleet: mix([NEW, NEW, NEW, NEW, BOOT, BOOT]), note: 'Final batch boots; old pods drain last.', status: 'starting' },
      { fleet: row(NEW), note: 'Rollout complete — every instance runs v2, zero downtime.', status: 'done' },
    ],
    err: [
      { fleet: row(OLD), note: 'Six old instances (v1) serving all traffic.', status: 'running' },
      { fleet: mix([BOOT, BOOT, OLD, OLD, OLD, OLD]), note: 'Two new pods (v2) start; readiness probe gates them.', status: 'starting' },
      { fleet: mix([FAIL, FAIL, OLD, OLD, OLD, OLD]), note: 'New pods fail the readiness probe — rollout halts.', status: 'failing' },
      { fleet: row(OLD), note: 'Rolled back: the two bad pods are pulled, all v1 again.', status: 'rolledback' },
    ],
  },
  bluegreen: {
    key: 'bluegreen',
    name: 'Blue-Green',
    icon: 'Rocket',
    blurb: 'Stand up a full new fleet, verify it, then flip traffic atomically.',
    ok: [
      { blue: row(OLD), green: row(EMPTY), live: 'blue', note: 'Blue fleet (v1) is live; green stage is empty.', status: 'running' },
      { blue: row(OLD), green: row(BOOT), live: 'blue', note: 'Green fleet (v2) stands up in full, off to the side.', status: 'starting' },
      { blue: row(OLD), green: row(NEW), live: 'blue', note: 'Green fleet passes verification while blue still serves.', status: 'healthy' },
      { blue: row(OLD), green: row(NEW), live: 'green', note: 'Traffic flips to green in one atomic switch.', status: 'switching' },
      { blue: row(EMPTY), green: row(NEW), live: 'green', note: 'Green is live; blue kept briefly for instant rollback, then freed.', status: 'done' },
    ],
    err: [
      { blue: row(OLD), green: row(EMPTY), live: 'blue', note: 'Blue fleet (v1) is live; green stage is empty.', status: 'running' },
      { blue: row(OLD), green: row(BOOT), live: 'blue', note: 'Green fleet (v2) stands up in full, off to the side.', status: 'starting' },
      { blue: row(OLD), green: row(FAIL), live: 'blue', note: 'Green fails verification — traffic never leaves blue.', status: 'failing' },
      { blue: row(OLD), green: row(EMPTY), live: 'blue', note: 'Green discarded; blue stayed live the whole time (rollback).', status: 'rolledback' },
    ],
  },
  canary: {
    key: 'canary',
    name: 'Canary',
    icon: 'Rocket',
    blurb: 'Send a small % of traffic to the new version, watch metrics, then ramp.',
    ok: [
      { fleet: row(OLD), note: '100% of traffic on the old version (v1).', status: 'running' },
      { fleet: mix([NEW, OLD, OLD, OLD, OLD, OLD]), note: 'One canary on v2 takes ~2% of traffic; metrics watched.', status: 'healthy' },
      { fleet: mix([NEW, NEW, OLD, OLD, OLD, OLD]), note: 'Metrics hold — ramp to ~33% on v2.', status: 'healthy' },
      { fleet: mix([NEW, NEW, NEW, NEW, OLD, OLD]), note: 'Still healthy — ramp to ~66% on v2.', status: 'healthy' },
      { fleet: row(NEW), note: 'Canary promoted — 100% of traffic on v2.', status: 'done' },
    ],
    err: [
      { fleet: row(OLD), note: '100% of traffic on the old version (v1).', status: 'running' },
      { fleet: mix([NEW, OLD, OLD, OLD, OLD, OLD]), note: 'One canary on v2 takes ~2% of traffic; metrics watched.', status: 'healthy' },
      { fleet: mix([FAIL, OLD, OLD, OLD, OLD, OLD]), note: 'Canary error rate spikes — halt the ramp.', status: 'failing' },
      { fleet: row(OLD), note: 'Canary pulled; 100% back on v1 (rollback).', status: 'rolledback' },
    ],
  },
};

const ORDER = ['rolling', 'bluegreen', 'canary'];
const ICONS = { GitBranch, Rocket };

const STATUS_LABEL = {
  running: 'serving v1',
  starting: 'health-checking',
  healthy: 'progressing',
  switching: 'switching traffic',
  failing: 'unhealthy',
  rolledback: 'rolled back',
  done: 'complete',
};

function serving(step) {
  if (step.live) return step.live === 'blue' ? step.blue : step.green;
  return step.fleet;
}
function newCount(step) {
  return serving(step).filter((v) => v === NEW).length;
}

// Geometry — a single centered vertical column for the pipeline, then a fleet.
const W = 384;
const H = 540;
const TRUNK_X = 60;
const PIPE_X = 100;
const PIPE_W = 208;
const PIPE_H = 38;
const PIPE_PITCH = 52;
const PIPE_TOP = 14;
const PIPE_ROWS = [
  { key: 'build', name: 'Build image', detail: 'docker build -> app:git-sha' },
  { key: 'registry', name: 'Push to registry', detail: 'app@sha256 (immutable)' },
  { key: 'deploy', name: 'Deploy to cluster', detail: 'pull digest, roll out' },
];
const pipeMid = (i) => PIPE_TOP + i * PIPE_PITCH + PIPE_H / 2;

// fleet box grid
const BOX_W = 47;
const BOX_H = 38;
const BOX_LEFT = 22;
const BOX_GAP = (W - 2 * BOX_LEFT - N * BOX_W) / (N - 1);
const boxX = (i) => BOX_LEFT + i * (BOX_W + BOX_GAP);

const PIPE_BOTTOM = PIPE_TOP + PIPE_ROWS.length * PIPE_PITCH; // ~170
const FLEET_HEAD_Y = PIPE_BOTTOM + 24;
const ROW1_Y = FLEET_HEAD_Y + 16;
const ROW2_Y = ROW1_Y + BOX_H + 34;

const VER_TEXT = { old: 'v1', new: 'v2', fail: 'v2', boot: '...', empty: '--' };

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function FleetRow({ cells, y, label, dimmed }) {
  return (
    <g className={`cds-fleetrow${dimmed ? ' is-dim' : ''}`}>
      {label && <text x={BOX_LEFT} y={y - 6} className="cds-fleet-label">{label}</text>}
      {cells.map((v, i) => (
        <g key={i} className={`cds-box is-${v}`}>
          <rect x={boxX(i)} y={y} width={BOX_W} height={BOX_H} rx={7} className="cds-box-rect" />
          <text x={boxX(i) + BOX_W / 2} y={y + BOX_H / 2 + 4} textAnchor="middle" className="cds-box-text">
            {VER_TEXT[v]}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function CloudDeployStrategyViz() {
  const [stratKey, setStratKey] = useState('rolling');
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const strat = STRATEGIES[stratKey];
  const steps = useMemo(() => (error ? strat.err : strat.ok), [error, strat]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];
  const isBlueGreen = stratKey === 'bluegreen';

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function cycleStrategy() {
    const idx = ORDER.indexOf(stratKey);
    setStratKey(ORDER[(idx + 1) % ORDER.length]);
    setStep(0);
    setPlaying(false);
  }
  function toggleError() {
    setError((e) => !e);
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
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed, stratKey, error]);

  const StratIcon = ICONS[strat.icon] || Rocket;
  const rolledBack = cur.status === 'rolledback';
  const failing = cur.status === 'failing';

  return (
    <div className="cds">
      <div className="cds-head">
        <div className="cds-head-icon"><Rocket size={18} /></div>
        <div className="cds-head-text">
          <h3 className="cds-title">Ship it: build once, roll out safely</h3>
          <p className="cds-sub">
            An image flows down the pipeline &mdash; build, push, deploy &mdash; then the fleet
            updates by the chosen strategy. Flip the error toggle to watch a bad release roll back.
          </p>
        </div>
        <button type="button" className="cds-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cds-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cds-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cds-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="cds-arrow-head" />
            </marker>
            <filter id="cds-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* vertical pipeline trunk, top -> bottom */}
          <line x1={TRUNK_X} y1={pipeMid(0)} x2={TRUNK_X} y2={FLEET_HEAD_Y - 8} className="cds-trunk" />
          {PIPE_ROWS.map((r, i) => (
            <line
              key={`seg-${r.key}`}
              x1={TRUNK_X} y1={pipeMid(i) + 6}
              x2={TRUNK_X} y2={(i === PIPE_ROWS.length - 1 ? FLEET_HEAD_Y - 10 : pipeMid(i + 1) - 6)}
              className="cds-trunk-seg"
              markerEnd="url(#cds-arrow)"
            />
          ))}

          {PIPE_ROWS.map((r, i) => (
            <g key={r.key} className={`cds-pipe is-${r.key}`}>
              <rect x={PIPE_X} y={PIPE_TOP + i * PIPE_PITCH} width={PIPE_W} height={PIPE_H} rx={9} className="cds-pipe-box" />
              <text x={PIPE_X + 13} y={PIPE_TOP + i * PIPE_PITCH + 16} className="cds-pipe-name">{r.name}</text>
              <text x={PIPE_X + 13} y={PIPE_TOP + i * PIPE_PITCH + 30} className="cds-pipe-detail">{r.detail}</text>
            </g>
          ))}

          {/* fleet header */}
          <text x={BOX_LEFT} y={FLEET_HEAD_Y} className="cds-section-label">
            {strat.name} rollout &mdash; {STATUS_LABEL[cur.status]}
          </text>

          {isBlueGreen ? (
            <>
              <FleetRow cells={cur.blue} y={ROW1_Y} label="BLUE" dimmed={cur.live !== 'blue'} />
              <FleetRow cells={cur.green} y={ROW2_Y} label="GREEN" dimmed={cur.live !== 'green'} />
              {/* traffic pointer to the live fleet */}
              <g className="cds-traffic">
                <text
                  x={W - 20}
                  y={(cur.live === 'blue' ? ROW1_Y : ROW2_Y) + BOX_H / 2 + 4}
                  textAnchor="end"
                  className="cds-traffic-text"
                  filter="url(#cds-glow)"
                >
                  traffic &#8594;
                </text>
              </g>
            </>
          ) : (
            <FleetRow cells={cur.fleet} y={ROW1_Y + 6} label="FLEET (6 instances)" dimmed={false} />
          )}
        </svg>
      </div>

      <div className="cds-controls">
        <button type="button" className="cds-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="cds-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={safeStep >= total}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className="cds-btn cds-strat" onClick={cycleStrategy}>
          <StratIcon size={14} /> {strat.name}
        </button>
        <button type="button" className={`cds-btn cds-err${error ? ' is-on' : ''}`} onClick={toggleError}>
          <AlertTriangle size={14} /> Error {error ? 'on' : 'off'}
        </button>
        <label className="cds-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="cds-speed-range"
          />
          <span className="cds-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="cds-progress">{safeStep} / {total}</span>
      </div>

      <div className="cds-readout">
        <div className="cds-stat is-strat">
          <span className="cds-stat-label">strategy</span>
          <span className="cds-stat-val">{strat.name}</span>
        </div>
        <div className="cds-stat is-new">
          <span className="cds-stat-label">on new (v2)</span>
          <span className="cds-stat-val">{newCount(cur)} / {N}</span>
        </div>
        <div className={`cds-stat is-status${failing ? ' is-bad' : ''}${rolledBack ? ' is-warn' : ''}`}>
          <span className="cds-stat-label">status</span>
          <span className="cds-stat-val">{STATUS_LABEL[cur.status]}</span>
        </div>
      </div>

      <div className={`cds-note${failing ? ' is-bad' : ''}${rolledBack ? ' is-warn' : ''}`}>
        <span className="cds-note-label">now</span>
        <span className="cds-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
