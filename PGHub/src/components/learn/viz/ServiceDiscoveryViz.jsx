import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, HeartCrack, HeartPulse } from 'lucide-react';
import './ServiceDiscoveryViz.css';

const MODELS = [
  { id: 'client', label: 'CLIENT-SIDE', sub: 'fat client picks instance' },
  { id: 'server', label: 'SERVER-SIDE', sub: 'LB owns the lookup' },
  { id: 'mesh', label: 'SERVICE MESH', sub: 'sidecar + control plane' },
];

// mulberry32 seeded RNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INSTANCE_COUNT = 4;

// Geometry. Caller left, registry/control-plane top-center, instances right column.
const W = 940;
const H = 460;

const CALLER = { x: 36, y: 196, w: 150, h: 84 };
const REGISTRY = { x: 372, y: 24, w: 196, h: 96 };
// middlebox (LB for server-side, sidecar for mesh) sits between caller and instances
const MIDBOX = { x: 372, y: 198, w: 150, h: 80 };
const INST = { x: 742, w: 162, h: 60, gap: 16, top: 56 };
const instY = (i) => INST.top + i * (INST.h + INST.gap);

// Build the ordered hop frames for a model + which instances are healthy + chosen idx.
function buildFrames(model, healthy, chosenIdx) {
  const frames = [];
  const healthyList = healthy.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);
  const chosen = chosenIdx;

  const base = (extra) => ({
    model,
    stage: 'idle',
    activeEdge: null,   // edge id whose dot animates
    litRegistry: false,
    litMidbox: false,
    pickIdx: null,      // instance being highlighted during round-robin scan
    target: null,       // final chosen instance
    hops: 0,
    note: '',
    ...extra,
  });

  if (model === 'client') {
    frames.push(base({ stage: 'start', note: 'The caller needs an instance of Service B. In client-side discovery it owns the lookup — no middlebox stands between it and the registry.' }));
    frames.push(base({ stage: 'query', activeEdge: 'caller-registry', litRegistry: true, hops: 1, note: 'Hop 1: the caller queries the registry (Eureka / Consul) directly for the current list of healthy Service B instances.' }));
    frames.push(base({ stage: 'return', activeEdge: 'registry-caller', litRegistry: true, hops: 1, note: `The registry returns the healthy set (${healthyList.length} of ${INSTANCE_COUNT} instances UP). The caller caches it in-process for the TTL window.` }));
    frames.push(base({ stage: 'pick', litRegistry: true, pickIdx: chosen, hops: 1, note: `Round-robin: the caller picks instance #${chosen + 1} itself. Load-balancing logic lives inside the client — that is the "fat client" cost.` }));
    frames.push(base({ stage: 'call', activeEdge: 'caller-instance', pickIdx: chosen, target: chosen, hops: 2, note: `Hop 2: the caller connects straight to instance #${chosen + 1}. Total: 2 hops, no extra middlebox latency — the in-process lookup is the win.` }));
  } else if (model === 'server') {
    frames.push(base({ stage: 'start', note: 'The caller knows only one stable URL (an ALB / k8s ClusterIP). It hits the load balancer and lets the middlebox do all the discovery.' }));
    frames.push(base({ stage: 'toLb', activeEdge: 'caller-midbox', litMidbox: true, hops: 1, note: 'Hop 1: the caller sends the request to the load balancer endpoint. The client carries no discovery logic at all — thin client.' }));
    frames.push(base({ stage: 'lbQuery', activeEdge: 'midbox-registry', litMidbox: true, litRegistry: true, hops: 1, note: 'The LB consults the registry / health table for the current healthy Service B targets — the lookup happens here, not in the caller.' }));
    frames.push(base({ stage: 'pick', litMidbox: true, litRegistry: true, pickIdx: chosen, hops: 1, note: `The LB selects instance #${chosen + 1} from the ${healthyList.length} healthy targets and prepares to forward.` }));
    frames.push(base({ stage: 'forward', activeEdge: 'midbox-instance', litMidbox: true, pickIdx: chosen, target: chosen, hops: 2, note: `Hop 2: the LB forwards to instance #${chosen + 1}. Two hops total — the extra middlebox hop is the price of a simple, uniform client.` }));
  } else {
    frames.push(base({ stage: 'start', note: 'Mesh: every service carries a sidecar proxy (Envoy). The app makes a plain call to localhost — it believes it is doing simple server-side discovery.' }));
    frames.push(base({ stage: 'toSidecar', activeEdge: 'caller-midbox', litMidbox: true, hops: 1, note: 'Hop 1 (local): the app calls its own sidecar over loopback. No code in the app knows about discovery — the sidecar intercepts the outbound call.' }));
    frames.push(base({ stage: 'xds', activeEdge: 'midbox-registry', litMidbox: true, litRegistry: true, hops: 1, note: 'The sidecar consults the control plane over xDS for the latest topology — the lookup is client-side, but inside the proxy, not the app.' }));
    frames.push(base({ stage: 'pick', litMidbox: true, litRegistry: true, pickIdx: chosen, hops: 1, note: `The sidecar load-balances locally and picks instance #${chosen + 1} — applying mTLS, retries, and zone affinity as policy.` }));
    frames.push(base({ stage: 'callRemote', activeEdge: 'midbox-instance', litMidbox: true, pickIdx: chosen, target: chosen, hops: 2, note: `Hop 2: the sidecar dials the remote instance #${chosen + 1}. Best of both: zero app changes, in-proxy lookup, sub-second propagation.` }));
  }

  return frames;
}

const RUN_DELAY_MS = 1200;

// edge endpoint resolver -> {x1,y1,x2,y2}
function edgePoints(edge, targetIdx) {
  const cMid = { x: CALLER.x + CALLER.w, y: CALLER.y + CALLER.h / 2 };
  const cTop = { x: CALLER.x + CALLER.w, y: CALLER.y + CALLER.h / 2 - 16 };
  const cBot = { x: CALLER.x + CALLER.w, y: CALLER.y + CALLER.h / 2 + 16 };
  const rLeft = { x: REGISTRY.x, y: REGISTRY.y + REGISTRY.h / 2 };
  const rBot = { x: REGISTRY.x + REGISTRY.w / 2, y: REGISTRY.y + REGISTRY.h };
  const mLeft = { x: MIDBOX.x, y: MIDBOX.y + MIDBOX.h / 2 };
  const mTop = { x: MIDBOX.x + MIDBOX.w / 2, y: MIDBOX.y };
  const mRight = { x: MIDBOX.x + MIDBOX.w, y: MIDBOX.y + MIDBOX.h / 2 };
  const ti = targetIdx == null ? 1 : targetIdx;
  const iLeft = { x: INST.x, y: instY(ti) + INST.h / 2 };

  switch (edge) {
    case 'caller-registry': return { ...lineUp(cTop, rLeft) };
    case 'registry-caller': return { ...lineUp(rLeft, cTop) };
    case 'caller-instance': return { ...lineUp(cBot, iLeft) };
    case 'caller-midbox': return { ...lineUp(cMid, mLeft) };
    case 'midbox-registry': return { ...lineUp(mTop, rBot) };
    case 'midbox-instance': return { ...lineUp(mRight, iLeft) };
    default: return null;
  }
}

function lineUp(a, b) {
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

export default function ServiceDiscoveryViz({ seed = 7 }) {
  const [model, setModel] = useState('client');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [unhealthy, setUnhealthy] = useState(() => {
    // seeded: one instance down by default
    const rand = mulberry32(seed);
    const arr = Array.from({ length: INSTANCE_COUNT }, () => true);
    const down = Math.floor(rand() * INSTANCE_COUNT);
    arr[down] = false;
    return arr;
  });
  const runTimer = useRef(null);

  const healthy = unhealthy; // true = UP
  const healthyIdxs = useMemo(() => healthy.map((h, i) => (h ? i : -1)).filter((i) => i >= 0), [healthy]);
  // chosen = first healthy via round-robin from a seeded offset
  const chosenIdx = useMemo(() => {
    if (healthyIdxs.length === 0) return 0;
    const rand = mulberry32(seed + 100);
    const off = Math.floor(rand() * healthyIdxs.length);
    return healthyIdxs[off];
  }, [healthyIdxs, seed]);

  const frames = useMemo(() => buildFrames(model, healthy, chosenIdx), [model, healthy, chosenIdx]);
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

  const switchModel = (id) => {
    if (id === model) return;
    setIsRunning(false);
    setStep(0);
    setModel(id);
  };

  const toggleInstance = (i) => {
    setIsRunning(false);
    setStep(0);
    setUnhealthy((prev) => {
      const next = [...prev];
      // never let all go down
      if (next[i] && next.filter(Boolean).length <= 1) return prev;
      next[i] = !next[i];
      return next;
    });
  };

  const reset = () => {
    setIsRunning(false);
    setStep(0);
    const rand = mulberry32(seed);
    const arr = Array.from({ length: INSTANCE_COUNT }, () => true);
    arr[Math.floor(rand() * INSTANCE_COUNT)] = false;
    setUnhealthy(arr);
    setModel('client');
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const midboxLabel = model === 'server' ? 'Load Balancer' : model === 'mesh' ? 'Sidecar (Envoy)' : null;
  const registryLabel = model === 'mesh' ? 'Control Plane (xDS)' : 'Registry';
  const showMidbox = model !== 'client';

  const edge = current.activeEdge ? edgePoints(current.activeEdge, chosenIdx) : null;
  const extraHopNote = model === 'client'
    ? 'in-process lookup, no extra hop'
    : model === 'server'
      ? '+1 hop through the LB'
      : '+1 local hop through sidecar';

  return (
    <div className="sdv">
      <div className="sdv-head">
        <h3 className="sdv-title">Service discovery — tracing a request to a live instance</h3>
        <p className="sdv-sub">
          Pick client-side, server-side, or mesh discovery, then step a request hop by hop. Toggle an instance
          unhealthy and watch the lookup route around it.
        </p>
      </div>

      <div className="sdv-controls">
        <div className="sdv-modes" role="tablist" aria-label="Discovery model">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`sdv-mode ${model === m.id ? 'is-on' : ''}`}
              onClick={() => switchModel(m.id)}
              aria-pressed={model === m.id}
            >
              <span className="sdv-mode-label">{m.label}</span>
              <span className="sdv-mode-sub">{m.sub}</span>
            </button>
          ))}
        </div>

        <label className="sdv-speed">
          <span className="sdv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="sdv-speed-range"
            aria-label="Playback speed"
          />
          <span className="sdv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="sdv-spacer" aria-hidden="true" />

        <div className="sdv-buttons">
          <button
            type="button"
            className="sdv-btn sdv-btn-primary"
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
            className="sdv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="sdv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sdv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="sdv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="sdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sdv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="sdv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="sdv-arrowhead" />
            </marker>
            <filter id="sdv-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* static skeleton edges (faint) */}
          {(model === 'client'
            ? ['caller-registry', 'caller-instance']
            : ['caller-midbox', 'midbox-registry', 'midbox-instance']
          ).map((e) => {
            const p = edgePoints(e, chosenIdx);
            if (!p) return null;
            return (
              <line
                key={`skel-${e}`}
                className="sdv-skel"
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
              />
            );
          })}

          {/* active edge + animated dot */}
          {edge && (
            <g>
              <line
                className="sdv-active-edge"
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                markerEnd="url(#sdv-arrow)"
              />
              <circle className="sdv-packet" r={6} filter="url(#sdv-glow)">
                <animate
                  attributeName="cx"
                  from={edge.x1}
                  to={edge.x2}
                  dur={`${(RUN_DELAY_MS / speed / 1000).toFixed(2)}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  from={edge.y1}
                  to={edge.y2}
                  dur={`${(RUN_DELAY_MS / speed / 1000).toFixed(2)}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* caller */}
          <rect
            className={`sdv-box ${current.stage === 'start' ? 'is-active' : ''}`}
            x={CALLER.x}
            y={CALLER.y}
            width={CALLER.w}
            height={CALLER.h}
            rx={9}
          />
          <text className="sdv-box-title" x={CALLER.x + CALLER.w / 2} y={CALLER.y + 26}>Caller</text>
          <text className="sdv-box-sub" x={CALLER.x + CALLER.w / 2} y={CALLER.y + 48}>service A</text>
          <text className="sdv-box-sub" x={CALLER.x + CALLER.w / 2} y={CALLER.y + 66}>
            {model === 'client' ? 'fat client' : model === 'mesh' ? 'thin · app code' : 'thin client'}
          </text>

          {/* registry / control plane */}
          <rect
            className={`sdv-box sdv-registry ${current.litRegistry ? 'is-lit' : ''}`}
            x={REGISTRY.x}
            y={REGISTRY.y}
            width={REGISTRY.w}
            height={REGISTRY.h}
            rx={9}
          />
          <text className="sdv-box-title" x={REGISTRY.x + REGISTRY.w / 2} y={REGISTRY.y + 24}>{registryLabel}</text>
          <text className="sdv-box-sub" x={REGISTRY.x + REGISTRY.w / 2} y={REGISTRY.y + 44}>
            payments → {healthyIdxs.length} UP
          </text>
          {/* health dots inside registry */}
          {healthy.map((up, i) => (
            <circle
              key={`reg-dot-${i}`}
              className={`sdv-reg-dot ${up ? 'is-up' : 'is-down'}`}
              cx={REGISTRY.x + 34 + i * 34}
              cy={REGISTRY.y + 72}
              r={8}
            />
          ))}

          {/* middlebox (LB / sidecar) */}
          {showMidbox && (
            <g>
              <rect
                className={`sdv-box sdv-midbox ${current.litMidbox ? 'is-lit' : ''}`}
                x={MIDBOX.x}
                y={MIDBOX.y}
                width={MIDBOX.w}
                height={MIDBOX.h}
                rx={9}
              />
              <text className="sdv-box-title" x={MIDBOX.x + MIDBOX.w / 2} y={MIDBOX.y + 30}>{midboxLabel}</text>
              <text className="sdv-box-sub" x={MIDBOX.x + MIDBOX.w / 2} y={MIDBOX.y + 52}>
                {model === 'server' ? 'owns routing' : 'in-proxy lookup'}
              </text>
            </g>
          )}

          {/* instances */}
          {healthy.map((up, i) => {
            const y = instY(i);
            const isPick = current.pickIdx === i;
            const isTarget = current.target === i;
            const hue = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-mint)', 'var(--hue-pink)'][i % 4];
            return (
              <g key={`inst-${i}`} onClick={() => toggleInstance(i)} className="sdv-inst-group">
                <rect
                  className={`sdv-inst ${!up ? 'is-down' : ''} ${isPick ? 'is-pick' : ''} ${isTarget ? 'is-target' : ''}`}
                  x={INST.x}
                  y={y}
                  width={INST.w}
                  height={INST.h}
                  rx={8}
                  style={up && (isPick || isTarget) ? { stroke: hue } : undefined}
                />
                <rect x={INST.x} y={y} width={5} height={INST.h} rx={2.5} fill={up ? hue : 'var(--text-dim)'} opacity={up ? 1 : 0.4} />
                <text className={`sdv-inst-title ${!up ? 'is-down' : ''}`} x={INST.x + 22} y={y + 26} textAnchor="start">
                  B · instance {i + 1}
                </text>
                <text className={`sdv-inst-sub ${!up ? 'is-down' : ''}`} x={INST.x + 22} y={y + 44} textAnchor="start">
                  {up ? `10.0.${i + 1}.4:8080 · UP` : 'evicted · DOWN'}
                </text>
                <g transform={`translate(${INST.x + INST.w - 26}, ${y + INST.h / 2 - 8})`}>
                  {up
                    ? <HeartPulse className="sdv-inst-icon is-up" size={16} />
                    : <HeartCrack className="sdv-inst-icon is-down" size={16} />}
                </g>
              </g>
            );
          })}
          <text className="sdv-inst-hint" x={INST.x + INST.w / 2} y={instY(INSTANCE_COUNT - 1) + INST.h + 22} textAnchor="middle">
            click an instance to toggle health
          </text>
        </svg>
      </div>

      <div className="sdv-metrics">
        <div className="sdv-metric">
          <span className="sdv-metric-label">model</span>
          <span className="sdv-metric-value">{model}</span>
        </div>
        <div className="sdv-metric">
          <span className="sdv-metric-label">hops so far</span>
          <span className="sdv-metric-value is-accent">{current.hops}</span>
        </div>
        <div className="sdv-metric">
          <span className="sdv-metric-label">target</span>
          <span className="sdv-metric-value is-target">
            {current.target != null ? `instance ${current.target + 1}` : '—'}
          </span>
        </div>
        <div className="sdv-metric">
          <span className="sdv-metric-label">registry size</span>
          <span className="sdv-metric-value">{healthyIdxs.length} UP / {INSTANCE_COUNT}</span>
        </div>
        <div className="sdv-metric">
          <span className="sdv-metric-label">lookup cost</span>
          <span className="sdv-metric-value">{extraHopNote}</span>
        </div>
      </div>

      <div className="sdv-narration">
        <span className="sdv-narration-label">trace</span>
        <span className="sdv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
