import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Plus, Minus, RefreshCw } from 'lucide-react';
import './McvPatternViz.css';

const ACTIONS = {
  increment: { label: '+1', icon: 'plus', delta: 1, verb: 'increment' },
  decrement: { label: '-1', icon: 'minus', delta: -1, verb: 'decrement' },
  reset: { label: 'reset', icon: 'reset', delta: null, verb: 'reset' },
};

function buildFrames(actionKey, startCount) {
  const action = ACTIONS[actionKey];
  const newCount = action.delta === null ? 0 : startCount + action.delta;
  const handled = `${action.verb}()`;

  const base = {
    model: { count: startCount },
    view: { display: `Count: ${startCount}`, dirty: false },
    controller: { lastAction: '—', handling: false },
    active: null,
    arrow: null,
    flow: 'idle',
    note: '',
  };

  const snap = (extra) => ({
    ...base,
    model: { ...base.model },
    view: { ...base.view },
    controller: { ...base.controller },
    ...extra,
  });

  const frames = [];

  frames.push(snap({
    active: 'view',
    flow: 'idle',
    note: `Steady state. The View shows the rendered display "Count: ${startCount}". Each layer owns one job: the Model holds data, the View shows it, the Controller routes input. They never reach across boundaries.`,
  }));

  frames.push(snap({
    active: 'view',
    arrow: 'v2c',
    flow: 'View -> Controller',
    controller: { lastAction: '—', handling: false },
    note: `The user clicks "${action.label}" inside the View. The View does not change data itself — that is not its job. It dispatches the intent toward the Controller.`,
  }));

  frames.push(snap({
    active: 'controller',
    arrow: 'v2c',
    flow: 'View -> Controller',
    controller: { lastAction: handled, handling: true },
    note: `The Controller receives the "${action.verb}" intent. It decides how the request should mutate application state, then forwards a command to the Model. It owns the input handling logic, nothing about rendering.`,
  }));

  frames.push(snap({
    active: 'model',
    arrow: 'c2m',
    flow: 'Controller -> Model',
    controller: { lastAction: handled, handling: true },
    model: { count: newCount },
    note: `The Controller mutates the Model: ${action.delta === null
      ? `reset count to ${newCount}`
      : `count ${startCount} ${action.delta > 0 ? '+' : '-'} ${Math.abs(action.delta)} = ${newCount}`}. The Model is the single source of truth — it knows nothing about screens or clicks.`,
  }));

  frames.push(snap({
    active: 'model',
    arrow: 'm2v',
    flow: 'Model -> View',
    controller: { lastAction: handled, handling: false },
    model: { count: newCount },
    view: { display: `Count: ${startCount}`, dirty: true },
    note: `State changed, so the Model notifies its observers. The View is subscribed; it is told "data changed" without the Model knowing what the View looks like. This decoupling is the whole point of MVC.`,
  }));

  frames.push(snap({
    active: 'view',
    arrow: 'm2v',
    flow: 'Model -> View',
    controller: { lastAction: handled, handling: false },
    model: { count: newCount },
    view: { display: `Count: ${newCount}`, dirty: false },
    note: `The View re-reads the Model and re-renders: "Count: ${newCount}". One user action has flowed View -> Controller -> Model -> View and settled. Ready for the next click.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

const LAYERS = {
  model: { title: 'Model', sub: 'holds the data', accent: 'var(--hue-mint)', x: 470, y: 70 },
  view: { title: 'View', sub: 'renders to user', accent: 'var(--hue-sky)', x: 150, y: 320 },
  controller: { title: 'Controller', sub: 'handles input', accent: 'var(--hue-violet)', x: 790, y: 320 },
};

export default function McvPatternViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [actionKey, setActionKey] = useState('increment');
  const [startCount, setStartCount] = useState(0);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(actionKey, startCount), [actionKey, startCount]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);
  const atEnd = step >= totalSteps - 1;

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const pickAction = (key) => {
    setActionKey(key);
    setIsRunning(false);
    setStep(0);
  };

  const applyAndContinue = () => {
    setStartCount(current.model.count);
    setStep(0);
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setStep(0);
    setStartCount(0);
    setActionKey('increment');
  };

  const W = 960;
  const H = 470;

  const arrows = [
    { key: 'v2c', from: 'view', to: 'controller', label: 'dispatch intent' },
    { key: 'c2m', from: 'controller', to: 'model', label: 'mutate' },
    { key: 'm2v', from: 'model', to: 'view', label: 'notify / re-render' },
  ];

  const boxW = 200;
  const boxH = 96;

  const center = (k) => ({ cx: LAYERS[k].x, cy: LAYERS[k].y + boxH / 2 });

  const edgePoint = (fromK, toK) => {
    const a = center(fromK);
    const b = center(toK);
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const pad = 58;
    return {
      x1: a.cx + ux * pad,
      y1: a.cy + uy * pad,
      x2: b.cx - ux * pad,
      y2: b.cy - uy * pad,
    };
  };

  const playLabel = isRunningRaw && !atEnd ? 'Pause' : (atEnd ? 'Replay' : 'Play');
  const ActionIcon = ({ name }) => {
    if (name === 'plus') return <Plus size={13} />;
    if (name === 'minus') return <Minus size={13} />;
    return <RefreshCw size={13} />;
  };

  return (
    <div className="mcv">
      <div className="mcv-head">
        <h3 className="mcv-title">Model · View · Controller — one click around the loop</h3>
        <p className="mcv-sub">
          A counter built in three layers. The View takes the click, the Controller decides what it means, the
          Model changes the data, and the Model notifies the View to re-render. Step a single action around the cycle.
        </p>
      </div>

      <div className="mcv-controls">
        <div className="mcv-action-group">
          <span className="mcv-input-label">action</span>
          {Object.entries(ACTIONS).map(([key, a]) => (
            <button
              key={key}
              type="button"
              className={`mcv-chip ${actionKey === key ? 'is-on' : ''}`}
              onClick={() => pickAction(key)}
            >
              <ActionIcon name={a.icon} /> {a.label}
            </button>
          ))}
        </div>

        <span className="mcv-spacer" aria-hidden="true" />

        <label className="mcv-speed">
          <span className="mcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="mcv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="mcv-buttons">
          <button
            type="button"
            className="mcv-btn mcv-btn-primary"
            onClick={() => {
              if (atEnd) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && !atEnd ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="mcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={atEnd}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={atEnd}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button
            type="button"
            className="mcv-btn"
            onClick={applyAndContinue}
            disabled={!atEnd}
            title="Keep the new count and fire the next action"
          >
            <Plus size={14} /> Next action
          </button>
          <button type="button" className="mcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mcv-arrowhead" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" className="mcv-arrowhead" />
            </marker>
            <marker id="mcv-arrowhead-on" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" className="mcv-arrowhead-on" />
            </marker>
          </defs>

          {arrows.map((ar) => {
            const p = edgePoint(ar.from, ar.to);
            const on = current.arrow === ar.key;
            const mx = (p.x1 + p.x2) / 2;
            const my = (p.y1 + p.y2) / 2;
            return (
              <g key={`ar-${ar.key}`}>
                <line
                  className={`mcv-arrow ${on ? 'is-on' : ''}`}
                  x1={p.x1}
                  y1={p.y1}
                  x2={p.x2}
                  y2={p.y2}
                  markerEnd={`url(#mcv-arrowhead${on ? '-on' : ''})`}
                  style={on ? { stroke: LAYERS[ar.to].accent } : undefined}
                />
                <rect
                  className={`mcv-arrow-pill ${on ? 'is-on' : ''}`}
                  x={mx - 56}
                  y={my - 12}
                  width={112}
                  height={24}
                  rx={12}
                  style={on ? { stroke: LAYERS[ar.to].accent } : undefined}
                />
                <text className={`mcv-arrow-label ${on ? 'is-on' : ''}`} x={mx} y={my + 4}>{ar.label}</text>
              </g>
            );
          })}

          {Object.entries(LAYERS).map(([key, L]) => {
            const on = current.active === key;
            let line1 = '';
            let line2 = '';
            if (key === 'model') {
              line1 = `count = ${current.model.count}`;
              line2 = 'single source of truth';
            } else if (key === 'view') {
              line1 = current.view.display;
              line2 = current.view.dirty ? 'stale — awaiting render' : 'rendered';
            } else {
              line1 = `last: ${current.controller.lastAction}`;
              line2 = current.controller.handling ? 'handling input' : 'waiting';
            }
            return (
              <g key={`box-${key}`}>
                <rect
                  className={`mcv-box ${on ? 'is-active' : ''}`}
                  x={L.x - boxW / 2}
                  y={L.y}
                  width={boxW}
                  height={boxH}
                  rx={12}
                  style={on ? { stroke: L.accent } : undefined}
                />
                <rect x={L.x - boxW / 2} y={L.y} width={boxW} height={6} rx={3} fill={L.accent} opacity={on ? 1 : 0.55} />
                <text className="mcv-box-title" x={L.x} y={L.y + 28} style={{ fill: L.accent }}>{L.title}</text>
                <text className="mcv-box-sub" x={L.x} y={L.y + 44}>{L.sub}</text>
                <text className="mcv-box-state" x={L.x} y={L.y + 66}>{line1}</text>
                <text className="mcv-box-state2" x={L.x} y={L.y + 82}>{line2}</text>
              </g>
            );
          })}

          <g>
            <rect className="mcv-flow-box" x={W / 2 - 150} y={H - 44} width={300} height={34} rx={9} />
            <text className="mcv-flow-label" x={W / 2 - 132} y={H - 22}>data flow</text>
            <text className="mcv-flow-value" x={W / 2 + 134} y={H - 22}>{current.flow}</text>
          </g>
        </svg>
      </div>

      <div className="mcv-metrics">
        <div className="mcv-metric">
          <span className="mcv-metric-label">Model</span>
          <span className="mcv-metric-value">count = {current.model.count}</span>
        </div>
        <div className="mcv-metric">
          <span className="mcv-metric-label">View</span>
          <span className="mcv-metric-value is-sky">{current.view.display}{current.view.dirty ? ' (stale)' : ''}</span>
        </div>
        <div className="mcv-metric">
          <span className="mcv-metric-label">Controller</span>
          <span className="mcv-metric-value is-violet">{current.controller.lastAction}</span>
        </div>
        <div className="mcv-metric">
          <span className="mcv-metric-label">flow direction</span>
          <span className="mcv-metric-value is-flow">{current.flow}</span>
        </div>
      </div>

      <div className="mcv-narration">
        <span className="mcv-narration-label">trace</span>
        <span className="mcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
