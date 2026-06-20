import React, { useMemo, useState } from 'react';
import { Server, ArrowRight, CheckCircle, Upload, RotateCcw, Network } from 'lucide-react';
import './BlueGreenDeployViz.css';

// Blue/green deployment, event-driven.
// Two identical environments (BLUE + GREEN) sit behind a router. Exactly one is
// "live" and receives 100% of traffic; the other is standby. We deploy the next
// version to standby, smoke-test it, then cut traffic over INSTANTLY (not canary),
// keeping the previous live env as an instant rollback target.

const INIT_VERSION = 'v1.4.0';

function bumpVersion(v) {
  const m = /^v(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return v;
  const major = Number(m[1]);
  const minor = Number(m[2]) + 1;
  return `v${major}.${minor}.0`;
}

const INITIAL = {
  live: 'blue',
  prevLive: null,
  blue: { version: INIT_VERSION, status: 'live' },
  green: { version: null, status: 'idle' },
};

const STATUS_LABEL = {
  idle: 'idle',
  deploying: 'deploying',
  deployed: 'deployed',
  'tested-pass': 'tests pass',
  live: 'live',
  standby: 'standby',
};

export default function BlueGreenDeployViz() {
  const [state, setState] = useState(INITIAL);

  const live = state.live;
  const standby = live === 'blue' ? 'green' : 'blue';
  const blue = state.blue;
  const green = state.green;

  // The standby env is the deploy target this cycle.
  const target = state[standby];
  const canDeploy = target.status === 'idle' || target.status === 'standby';
  const canTest = target.status === 'deployed';
  const canCutover = target.status === 'tested-pass';
  const canRollback = state.prevLive != null;

  const trafficLive = 100;
  const trafficStandby = 0;

  const note = useMemo(() => {
    if (canCutover) {
      return `${standby.toUpperCase()} passed smoke tests on ${target.version}. Cut over to flip 100% of traffic to it instantly — ${live.toUpperCase()} stays warm as the rollback target.`;
    }
    if (canTest) {
      return `${standby.toUpperCase()} is deployed with ${target.version} but takes no live traffic yet. Run smoke tests against it before any cutover.`;
    }
    if (state.prevLive != null) {
      return `Traffic is now 100% on ${live.toUpperCase()} (${state[live].version}). ${standby.toUpperCase()} holds the previous version as a warm standby — Rollback flips back in one step with zero deploy.`;
    }
    return `${live.toUpperCase()} is live on ${state[live].version}, serving 100% of traffic. ${standby.toUpperCase()} is idle. Deploy the next version to the standby env to begin a release.`;
  }, [canCutover, canTest, standby, target.version, live, state]);

  const deploy = () => {
    if (!canDeploy) return;
    const nextVersion = bumpVersion(state[live].version);
    setState((s) => ({
      ...s,
      [standby]: { version: nextVersion, status: 'deployed' },
    }));
  };

  const runTests = () => {
    if (!canTest) return;
    setState((s) => ({
      ...s,
      [standby]: { ...s[standby], status: 'tested-pass' },
    }));
  };

  const cutover = () => {
    if (!canCutover) return;
    setState((s) => {
      const oldLive = s.live;
      const newLive = oldLive === 'blue' ? 'green' : 'blue';
      return {
        ...s,
        live: newLive,
        prevLive: oldLive,
        [newLive]: { ...s[newLive], status: 'live' },
        [oldLive]: { ...s[oldLive], status: 'standby' },
      };
    });
  };

  const rollback = () => {
    if (!canRollback) return;
    setState((s) => {
      const oldLive = s.live;
      const back = s.prevLive;
      if (back == null) return s;
      return {
        ...s,
        live: back,
        prevLive: oldLive,
        [back]: { ...s[back], status: 'live' },
        [oldLive]: { ...s[oldLive], status: 'standby' },
      };
    });
  };

  const reset = () => setState(INITIAL);

  // SVG geometry
  const W = 940;
  const H = 420;
  const routerW = 220;
  const routerH = 66;
  const routerX = W / 2 - routerW / 2;
  const routerY = 40;
  const routerCx = W / 2;
  const routerBottom = routerY + routerH;

  const envW = 320;
  const envH = 188;
  const envY = 200;
  const blueX = 60;
  const greenX = W - 60 - envW;
  const blueCx = blueX + envW / 2;
  const greenCx = greenX + envW / 2;

  const envGeom = {
    blue: { x: blueX, cx: blueCx, hue: 'var(--hue-sky)', label: 'BLUE', data: blue },
    green: { x: greenX, cx: greenCx, hue: 'var(--hue-mint)', label: 'GREEN', data: green },
  };

  const renderArrow = (envKey) => {
    const g = envGeom[envKey];
    const isLive = live === envKey;
    const endX = g.cx;
    const midY = (routerBottom + envY) / 2;
    const d = `M ${routerCx} ${routerBottom} C ${routerCx} ${midY}, ${endX} ${midY - 18}, ${endX} ${envY}`;
    return (
      <g key={`arrow-${envKey}`}>
        <path
          className={`bgv-route ${isLive ? 'is-live' : 'is-idle'}`}
          d={d}
          markerEnd={isLive ? 'url(#bgv-arrowhead)' : 'url(#bgv-arrowhead-dim)'}
        />
        <text
          className={`bgv-route-label ${isLive ? 'is-live' : 'is-idle'}`}
          x={(routerCx + endX) / 2}
          y={midY - 24}
          textAnchor="middle"
        >
          {isLive ? '100%' : '0%'}
        </text>
      </g>
    );
  };

  const renderEnv = (envKey) => {
    const g = envGeom[envKey];
    const d = g.data;
    const isLive = live === envKey;
    return (
      <g key={`env-${envKey}`}>
        <rect
          className={`bgv-env ${isLive ? 'is-live' : 'is-standby'}`}
          x={g.x}
          y={envY}
          width={envW}
          height={envH}
          rx={12}
          style={{ stroke: isLive ? 'var(--accent)' : g.hue }}
        />
        <rect className="bgv-env-strip" x={g.x} y={envY} width={envW} height={8} rx={4} style={{ fill: g.hue }} />

        <circle cx={g.x + 30} cy={envY + 40} r={14} style={{ fill: g.hue }} />
        <text className="bgv-env-name" x={g.x + 54} y={envY + 36}>{g.label}</text>
        <text className="bgv-env-role" x={g.x + 54} y={envY + 54}>
          {isLive ? 'serving traffic' : 'standby pool'}
        </text>

        {isLive && (
          <g>
            <rect className="bgv-live-badge" x={g.x + envW - 86} y={envY + 22} width={70} height={26} rx={13} />
            <text className="bgv-live-badge-text" x={g.x + envW - 51} y={envY + 39} textAnchor="middle">LIVE</text>
          </g>
        )}

        <text className="bgv-env-k" x={g.x + 24} y={envY + 96}>version</text>
        <text className="bgv-env-version" x={g.x + 24} y={envY + 120}>{d.version || '—'}</text>

        <text className="bgv-env-k" x={g.x + 24} y={envY + 148}>status</text>
        <text
          className={`bgv-env-status is-${d.status}`}
          x={g.x + 24}
          y={envY + 170}
        >
          {STATUS_LABEL[d.status] || d.status}
        </text>

        <text className="bgv-env-k" x={g.x + envW - 24} y={envY + 96} textAnchor="end">traffic</text>
        <text
          className={`bgv-env-traffic ${isLive ? 'is-live' : ''}`}
          x={g.x + envW - 24}
          y={envY + 124}
          textAnchor="end"
        >
          {isLive ? `${trafficLive}%` : `${trafficStandby}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="bgv">
      <div className="bgv-head">
        <h3 className="bgv-title">Blue / green deployment — instant cutover with a warm rollback</h3>
        <p className="bgv-sub">
          Deploy the next version to the standby environment, smoke-test it off to the side, then flip the
          router so 100% of traffic moves over in one step. The old version stays live for an instant rollback.
        </p>
      </div>

      <div className="bgv-controls">
        <div className="bgv-buttons">
          <button type="button" className="bgv-btn" onClick={deploy} disabled={!canDeploy}>
            <Upload size={14} /> Deploy to {standby}
          </button>
          <button type="button" className="bgv-btn" onClick={runTests} disabled={!canTest}>
            <CheckCircle size={14} /> Run smoke tests
          </button>
          <button type="button" className="bgv-btn bgv-btn-primary" onClick={cutover} disabled={!canCutover}>
            <ArrowRight size={14} /> Cut over
          </button>
          <button type="button" className="bgv-btn" onClick={rollback} disabled={!canRollback}>
            <RotateCcw size={14} /> Rollback
          </button>
          <button type="button" className="bgv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <span className="bgv-spacer" aria-hidden="true" />

        <div className="bgv-live-pill">
          <Network size={13} />
          <span className="bgv-live-pill-label">live</span>
          <strong className={`bgv-live-pill-env is-${live}`}>{live.toUpperCase()}</strong>
        </div>
      </div>

      <div className="bgv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bgv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="bgv-arrowhead" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="bgv-arrowhead-dim" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {renderArrow('blue')}
          {renderArrow('green')}

          {/* router / load balancer on top */}
          <rect className="bgv-router" x={routerX} y={routerY} width={routerW} height={routerH} rx={10} />
          <circle cx={routerX + 26} cy={routerY + routerH / 2} r={13} className="bgv-router-icon-bg" />
          <text className="bgv-router-title" x={routerX + 48} y={routerY + 27}>router / load balancer</text>
          <text className="bgv-router-sub" x={routerX + 48} y={routerY + 46}>
            routing 100% &#8594; {live.toUpperCase()}
          </text>

          {renderEnv('blue')}
          {renderEnv('green')}
        </svg>
      </div>

      <div className="bgv-metrics">
        <div className="bgv-metric">
          <span className="bgv-metric-label">live env</span>
          <span className={`bgv-metric-value is-${live}`}>{live.toUpperCase()}</span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">blue</span>
          <span className="bgv-metric-value">{blue.version || '—'}</span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">green</span>
          <span className="bgv-metric-value">{green.version || '—'}</span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">standby status</span>
          <span className={`bgv-metric-value is-status-${target.status}`}>
            {STATUS_LABEL[target.status] || target.status}
          </span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">rollback ready</span>
          <span className={`bgv-metric-value ${canRollback ? 'is-ok' : ''}`}>
            {canRollback ? 'yes' : 'no'}
          </span>
        </div>
      </div>

      <div className="bgv-narration">
        <span className="bgv-narration-label">state</span>
        <span className="bgv-narration-body">{note}</span>
      </div>
    </div>
  );
}
