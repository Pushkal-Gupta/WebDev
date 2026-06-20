import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Send } from 'lucide-react';
import './MediatorPatternViz.css';

const COMPONENTS = [
  { name: 'Button', short: 'Btn' },
  { name: 'Checkbox', short: 'Chk' },
  { name: 'TextField', short: 'Txt' },
  { name: 'Dropdown', short: 'Drp' },
  { name: 'Label', short: 'Lbl' },
];

const N = COMPONENTS.length;

const ROUTING = {
  0: [2, 4],
  1: [3, 4],
  2: [4],
  3: [0, 4],
  4: [],
};

function peerTargets(sender) {
  const mapped = ROUTING[sender] || [];
  if (mapped.length > 0) return mapped;
  return COMPONENTS.map((_, i) => i).filter((i) => i !== sender);
}

function buildFrames(mode, sender) {
  const frames = [];
  const targets = peerTargets(sender);
  const directCoupling = (N * (N - 1)) / 2;
  const mediatedCoupling = N;

  const snap = (extra) => ({
    mode,
    sender,
    targets,
    directCoupling,
    mediatedCoupling,
    activeEdges: [],
    litNodes: [],
    hubLit: false,
    path: [],
    note: '',
    ...extra,
  });

  if (mode === 'direct') {
    frames.push(snap({
      note: `Direct wiring: every widget holds a reference to every other widget. ${N} widgets means ${directCoupling} two-way connections — the full mesh. Pick a sender and press Send to watch a message fan out.`,
    }));
    frames.push(snap({
      litNodes: [sender],
      path: [COMPONENTS[sender].name],
      note: `${COMPONENTS[sender].name} changes state and must notify its peers itself. With no mediator it knows every other widget directly.`,
    }));
    const fanEdges = targets.map((t) => ({ from: sender, to: t, kind: 'direct' }));
    frames.push(snap({
      activeEdges: fanEdges,
      litNodes: [sender, ...targets],
      path: [COMPONENTS[sender].name, '-> ' + targets.map((t) => COMPONENTS[t].short).join(', ')],
      note: `${COMPONENTS[sender].name} calls ${targets.map((t) => COMPONENTS[t].name).join(', ')} one by one over its own direct edges. Each new widget added here multiplies the wiring it must maintain.`,
    }));
    frames.push(snap({
      activeEdges: fanEdges,
      litNodes: [sender, ...targets],
      path: [COMPONENTS[sender].name + ' delivered to ' + targets.length + ' peers directly'],
      note: `Delivered. The coupling cost is ${directCoupling} edges total and the sender is bound to ${targets.length} concrete peers — changing any peer's interface can break the sender.`,
    }));
    return frames;
  }

  frames.push(snap({
    hubLit: true,
    note: `Mediated wiring: a central Mediator owns all interaction logic. Each widget connects ONLY to the hub, so coupling drops from ${directCoupling} mesh edges to ${mediatedCoupling} spokes. Pick a sender and press Send to watch the Mediator route it.`,
  }));
  frames.push(snap({
    hubLit: true,
    litNodes: [sender],
    activeEdges: [{ from: sender, to: 'hub', kind: 'spoke' }],
    path: [COMPONENTS[sender].name, '-> Mediator'],
    note: `${COMPONENTS[sender].name} changes state. It does not know the other widgets — it just notifies the Mediator over its single spoke.`,
  }));
  frames.push(snap({
    hubLit: true,
    litNodes: [sender],
    activeEdges: [{ from: sender, to: 'hub', kind: 'spoke' }],
    path: [COMPONENTS[sender].name, '-> Mediator', '(deciding targets)'],
    note: `The Mediator holds the rules. For a ${COMPONENTS[sender].name} change it decides which widgets care: ${targets.map((t) => COMPONENTS[t].name).join(', ') || 'none'}.`,
  }));
  const routeEdges = targets.map((t) => ({ from: 'hub', to: t, kind: 'spoke' }));
  frames.push(snap({
    hubLit: true,
    litNodes: [sender, ...targets],
    activeEdges: [{ from: sender, to: 'hub', kind: 'spoke' }, ...routeEdges],
    path: [COMPONENTS[sender].name, '-> Mediator', '-> ' + (targets.map((t) => COMPONENTS[t].short).join(', ') || 'none')],
    note: `The Mediator forwards to ${targets.map((t) => COMPONENTS[t].name).join(', ') || 'no one'} over their own spokes. Widgets stay decoupled — only the Mediator knows the wiring.`,
  }));
  frames.push(snap({
    hubLit: true,
    litNodes: [sender, ...targets],
    activeEdges: [{ from: sender, to: 'hub', kind: 'spoke' }, ...routeEdges],
    path: [COMPONENTS[sender].name + ' -> Mediator -> ' + (targets.length ? targets.length + ' peers' : 'no peers')],
    note: `Routed. Total coupling stays at ${mediatedCoupling} spokes no matter how many widgets talk. Adding a widget adds one spoke, not a new edge to every peer.`,
  }));
  return frames;
}

const RUN_DELAY_MS = 1100;

export default function MediatorPatternViz() {
  const [mode, setMode] = useState('direct');
  const [sender, setSender] = useState(0);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(mode, sender), [mode, sender]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const send = () => {
    setStep(0);
    setIsRunning(true);
  };

  const W = 760;
  const H = 440;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const radius = 158;
  const nodeR = 34;

  const nodePos = (i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const meshPairs = useMemo(() => {
    const pairs = [];
    for (let a = 0; a < N; a += 1) {
      for (let b = a + 1; b < N; b += 1) pairs.push([a, b]);
    }
    return pairs;
  }, []);

  const isEdgeActive = (from, to) => current.activeEdges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const litSet = new Set(current.litNodes);

  return (
    <div className="medv">
      <div className="medv-head">
        <h3 className="medv-title">Mediator pattern — collapse the mesh to a hub</h3>
        <p className="medv-sub">
          Five widgets that react to each other. Wired directly they form a full mesh that grows quadratically; routed
          through a Mediator each widget keeps a single spoke and the hub owns every interaction rule.
        </p>
      </div>

      <div className="medv-controls">
        <div className="medv-toggle" role="group" aria-label="Wiring mode">
          <button
            type="button"
            className={`medv-toggle-btn ${mode === 'direct' ? 'is-on' : ''}`}
            onClick={() => { setMode('direct'); setStep(0); setIsRunning(false); }}
          >
            Direct mesh
          </button>
          <button
            type="button"
            className={`medv-toggle-btn ${mode === 'mediated' ? 'is-on' : ''}`}
            onClick={() => { setMode('mediated'); setStep(0); setIsRunning(false); }}
          >
            Mediated
          </button>
        </div>

        <label className="medv-sender">
          <span className="medv-input-label">sender</span>
          <select
            className="medv-select"
            value={sender}
            onChange={(e) => { setSender(Number(e.target.value)); setStep(0); setIsRunning(false); }}
            aria-label="Message sender"
          >
            {COMPONENTS.map((c, i) => (
              <option key={c.name} value={i}>{c.name}</option>
            ))}
          </select>
        </label>

        <button type="button" className="medv-btn medv-btn-primary" onClick={send}>
          <Send size={14} /> Send
        </button>

        <span className="medv-spacer" aria-hidden="true" />

        <label className="medv-speed">
          <span className="medv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="medv-speed-range"
            aria-label="Playback speed"
          />
          <span className="medv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="medv-buttons">
          <button
            type="button"
            className="medv-btn medv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="medv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="medv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="medv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="medv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="medv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="medv-svg" preserveAspectRatio="xMidYMid meet">
          {mode === 'direct' && meshPairs.map(([a, b]) => {
            const pa = nodePos(a);
            const pb = nodePos(b);
            const active = isEdgeActive(a, b);
            return (
              <line
                key={`mesh-${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={active ? 'var(--hard)' : 'var(--border)'}
                strokeWidth={active ? 3 : 1.2}
                opacity={active ? 1 : 0.5}
              />
            );
          })}

          {mode === 'mediated' && COMPONENTS.map((c, i) => {
            const p = nodePos(i);
            const active = isEdgeActive(i, 'hub');
            return (
              <line
                key={`spoke-${i}`}
                x1={p.x}
                y1={p.y}
                x2={cx}
                y2={cy}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={active ? 3.2 : 1.4}
                opacity={active ? 1 : 0.55}
              />
            );
          })}

          {mode === 'mediated' && (
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={nodeR + 6}
                fill={current.hubLit ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--surface)'}
                stroke="var(--accent)"
                strokeWidth={2.5}
              />
              <text x={cx} y={cy - 3} className="medv-node-name" style={{ fill: 'var(--accent)' }}>Mediator</text>
              <text x={cx} y={cy + 13} className="medv-node-sub">hub</text>
            </g>
          )}

          {COMPONENTS.map((c, i) => {
            const p = nodePos(i);
            const lit = litSet.has(i);
            const isSender = current.sender === i && lit;
            const fill = isSender ? 'rgba(var(--accent-rgb), 0.22)'
              : lit ? 'rgba(var(--accent-rgb), 0.12)'
              : 'var(--surface)';
            const stroke = isSender ? 'var(--hue-pink)'
              : lit ? 'var(--accent)'
              : 'var(--border)';
            return (
              <g key={c.name}>
                <circle cx={p.x} cy={p.y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={isSender ? 3 : 2} />
                <text x={p.x} y={p.y - 2} className="medv-node-name" style={{ fill: lit ? 'var(--text-main)' : 'var(--text-dim)' }}>
                  {c.short}
                </text>
                <text x={p.x} y={p.y + 13} className="medv-node-sub">{c.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="medv-metrics">
        <div className="medv-metric">
          <span className="medv-metric-label">mode</span>
          <span className="medv-metric-value">{mode === 'direct' ? 'direct mesh' : 'mediated'}</span>
        </div>
        <div className="medv-metric">
          <span className="medv-metric-label">direct coupling</span>
          <span className="medv-metric-value is-hard">{current.directCoupling} edges</span>
        </div>
        <div className="medv-metric">
          <span className="medv-metric-label">mediated coupling</span>
          <span className="medv-metric-value is-good">{current.mediatedCoupling} spokes</span>
        </div>
        <div className="medv-metric medv-metric-dim">
          <span className="medv-metric-label">routing path</span>
          <span className="medv-metric-value medv-metric-dimval">{current.path.join(' ') || '—'}</span>
        </div>
      </div>

      <div className="medv-narration">
        <span className="medv-narration-label">trace</span>
        <span className="medv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
