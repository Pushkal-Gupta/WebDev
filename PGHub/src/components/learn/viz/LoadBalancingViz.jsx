import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Server, Network, Hash, Scale, Plus, Minus, Repeat } from 'lucide-react';
import './LoadBalancingViz.css';

// Live load balancer. Each tick the LB receives `rate` requests and routes each to
// a backend per the chosen strategy. A routed request occupies one connection slot
// on its backend for a few ticks (its "cost"), then frees it — so active-connections
// rises and falls and least-connections actually has something to balance against.
//
// STRATEGIES
//   round-robin      : cycle backends 0,1,2,... in order, ignoring current load.
//   least-connections: route to the backend with the fewest active connections.
//   weighted         : smooth weighted round-robin over per-backend weights [3,2,1,..];
//                      heavier backends are picked proportionally more often.
//   hash             : each request carries a client key; backend = hash(key) % N, so
//                      the same key is sticky — it always lands on the same backend.

const STRATEGIES = [
  { id: 'round-robin', label: 'round robin', icon: Repeat },
  { id: 'least-connections', label: 'least connections', icon: Scale },
  { id: 'weighted', label: 'weighted', icon: Network },
  { id: 'hash', label: 'hash (sticky)', icon: Hash },
];

const WEIGHTS = [3, 2, 1, 1, 2, 1];
const CLIENT_KEYS = ['user-3', 'user-7', 'user-1', 'user-9', 'user-4', 'user-2', 'user-8'];

const MIN_N = 2;
const MAX_N = 6;
const TICK_MS = 720;
const MAX_BAR = 14; // connection slots a bar can show before it caps visually

// Deterministic small string hash so the same key always maps to the same backend.
function hashKey(key) {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

function freshBackends(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    active: 0, // current connection slots in use
    served: 0, // lifetime dispatched count
    weight: WEIGHTS[i % WEIGHTS.length],
  }));
}

export default function LoadBalancingViz() {
  const [strategy, setStrategy] = useState('round-robin');
  const [nBackends, setNBackends] = useState(4);
  const [rate, setRate] = useState(2);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1.5);

  // Live mutable simulation state kept in refs (so the interval doesn't re-bind on
  // every tick); a `tick` counter in state forces a re-render after each step.
  const backendsRef = useRef(freshBackends(4));
  const inflightRef = useRef([]); // [{ backend, ttl }]
  const rrRef = useRef(0); // round-robin cursor
  const swrrRef = useRef([]); // smooth weighted round-robin current weights
  const keyRef = useRef(0); // rotating client-key cursor
  const totalRef = useRef(0);
  const lastRef = useRef({ backend: null, key: null, reason: '' });
  const [, setTick] = useState(0);
  const runTimer = useRef(null);

  // Hold the live values the interval needs so the tick reads fresh state without
  // forcing the interval to rebind on every change.
  const strategyRef = useRef(strategy);
  const rateRef = useRef(rate);
  useEffect(() => { strategyRef.current = strategy; }, [strategy]);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  const delay = Math.round(TICK_MS / speed);

  // Re-seed the live simulation from scratch.
  const reset = (n = nBackends) => {
    backendsRef.current = freshBackends(n);
    inflightRef.current = [];
    rrRef.current = 0;
    swrrRef.current = new Array(n).fill(0);
    keyRef.current = 0;
    totalRef.current = 0;
    lastRef.current = { backend: null, key: null, reason: '' };
    setTick((t) => t + 1);
  };

  // Re-seed whenever backend count changes so weights/cursors stay consistent.
  useEffect(() => {
    reset(nBackends);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- N drives a fresh sim; reset is stable
  }, [nBackends]);

  // Reset cursors/weights on strategy switch so distribution reflects only the
  // chosen algorithm.
  useEffect(() => {
    rrRef.current = 0;
    swrrRef.current = new Array(backendsRef.current.length).fill(0);
    keyRef.current = 0;
  }, [strategy]);

  // Pick a backend index for one request under the active strategy.
  const pickBackend = (backends) => {
    const n = backends.length;
    const strat = strategyRef.current;
    if (strat === 'round-robin') {
      const idx = rrRef.current % n;
      rrRef.current = (rrRef.current + 1) % n;
      return { idx, key: null, reason: `round robin -> backend ${idx + 1}` };
    }
    if (strat === 'least-connections') {
      let best = 0;
      for (let i = 1; i < n; i += 1) {
        if (backends[i].active < backends[best].active) best = i;
      }
      return {
        idx: best,
        key: null,
        reason: `least connections routed req to backend ${best + 1} (${backends[best].active} active, lowest)`,
      };
    }
    if (strat === 'weighted') {
      // Smooth weighted round-robin (Nginx style).
      const cur = swrrRef.current;
      let total = 0;
      let best = 0;
      for (let i = 0; i < n; i += 1) {
        cur[i] += backends[i].weight;
        total += backends[i].weight;
        if (cur[i] > cur[best]) best = i;
      }
      cur[best] -= total;
      return {
        idx: best,
        key: null,
        reason: `weighted picked backend ${best + 1} (weight ${backends[best].weight})`,
      };
    }
    // hash (sticky)
    const key = CLIENT_KEYS[keyRef.current % CLIENT_KEYS.length];
    keyRef.current += 1;
    const idx = hashKey(key) % n;
    return { idx, key, reason: `hash(key=${key}) -> backend ${idx + 1}, always` };
  };

  // Advance the simulation one tick: complete some in-flight requests (freeing their
  // connection slot), then dispatch `rate` new requests.
  const stepSim = () => {
    const backends = backendsRef.current;
    const n = backends.length;

    const stillInflight = [];
    for (const f of inflightRef.current) {
      if (f.ttl <= 1) {
        if (f.backend < n && backends[f.backend].active > 0) backends[f.backend].active -= 1;
      } else {
        stillInflight.push({ backend: f.backend, ttl: f.ttl - 1 });
      }
    }
    inflightRef.current = stillInflight;

    let last = lastRef.current;
    for (let r = 0; r < rateRef.current; r += 1) {
      const pick = pickBackend(backends);
      const b = backends[pick.idx];
      b.active += 1;
      b.served += 1;
      totalRef.current += 1;
      const cost = 2 + (totalRef.current % 4); // each request holds a slot 2..5 ticks
      inflightRef.current.push({ backend: pick.idx, ttl: cost });
      last = { backend: pick.idx, key: pick.key, reason: pick.reason };
    }
    lastRef.current = last;
    setTick((t) => t + 1);
  };

  useEffect(() => {
    if (!running) return undefined;
    runTimer.current = setInterval(stepSim, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepSim reads live refs; rebind only on run/delay change
  }, [running, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const backends = backendsRef.current;
  const last = lastRef.current;

  const metrics = useMemo(() => {
    const loads = backends.map((b) => b.active);
    const maxLoad = loads.length ? Math.max(...loads) : 0;
    const minLoad = loads.length ? Math.min(...loads) : 0;
    const maxIdx = loads.indexOf(maxLoad);
    const dist = backends.map((b) => b.served);
    return {
      maxLoad,
      minLoad,
      imbalance: maxLoad - minLoad,
      maxIdx,
      dist,
      total: totalRef.current,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute each render tick from live refs
  }, [backends.map((b) => `${b.active}:${b.served}`).join('|')]);

  // ---- SVG geometry ----------------------------------------------------------
  const W = 940;
  const H = 460;
  const lbW = 150;
  const lbH = 110;
  const lbX = 40;
  const lbY = H / 2 - lbH / 2;
  const lbCx = lbX + lbW;
  const lbCy = lbY + lbH / 2;

  const beW = 240;
  const beX = W - beW - 40;
  const beTop = 56;
  const beBottom = H - 30;
  const slotH = (beBottom - beTop - (nBackends - 1) * 16) / nBackends;
  const beY = (i) => beTop + i * (slotH + 16);

  const barMaxW = beW - 150;
  const barX = beX + 138;

  const stratMeta = STRATEGIES.find((s) => s.id === strategy) || STRATEGIES[0];

  const beTone = (i) => {
    if (metrics.imbalance === 0) return 'neutral';
    if (i === metrics.maxIdx) return 'hot';
    if (backends[i].active === metrics.minLoad) return 'cool';
    return 'neutral';
  };

  const activeBackend = last.backend;

  return (
    <div className="lbv">
      <div className="lbv-head">
        <h3 className="lbv-title">Load balancing — routing requests across backends, live</h3>
        <p className="lbv-sub">
          A running balancer fans incoming requests out to N backends. Each request holds a connection for a
          few ticks then frees it, so load rises and falls. Switch strategy and watch how evenly the work spreads.
        </p>
      </div>

      <div className="lbv-controls">
        <div className="lbv-modes" role="tablist" aria-label="Strategy">
          {STRATEGIES.map((s) => {
            const Ic = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                className={`lbv-mode ${strategy === s.id ? 'is-on' : ''}`}
                onClick={() => setStrategy(s.id)}
                aria-pressed={strategy === s.id}
              >
                <Ic size={13} /> {s.label}
              </button>
            );
          })}
        </div>

        <span className="lbv-spacer" aria-hidden="true" />

        <div className="lbv-stepper" role="group" aria-label="Backend count">
          <span className="lbv-input-label">backends</span>
          <button
            type="button"
            className="lbv-btn lbv-btn-sq"
            onClick={() => setNBackends((v) => Math.max(MIN_N, v - 1))}
            disabled={nBackends <= MIN_N}
            aria-label="Remove a backend"
          >
            <Minus size={13} />
          </button>
          <span className="lbv-stepper-value">{nBackends}</span>
          <button
            type="button"
            className="lbv-btn lbv-btn-sq"
            onClick={() => setNBackends((v) => Math.min(MAX_N, v + 1))}
            disabled={nBackends >= MAX_N}
            aria-label="Add a backend"
          >
            <Plus size={13} />
          </button>
        </div>

        <label className="lbv-range">
          <span className="lbv-input-label">req / tick</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="lbv-range-input"
            aria-label="Request rate"
          />
          <span className="lbv-range-value">{rate}</span>
        </label>

        <label className="lbv-range">
          <span className="lbv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="lbv-range-input"
            aria-label="Tick speed"
          />
          <span className="lbv-range-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="lbv-buttons">
          <button
            type="button"
            className="lbv-btn lbv-btn-primary"
            onClick={() => setRunning((v) => !v)}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="lbv-btn" onClick={() => reset()}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="lbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="lbv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="lbv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="lbv-ah" />
            </marker>
          </defs>

          <text className="lbv-col-label" x={lbX} y={32} textAnchor="start">load balancer</text>
          <text className="lbv-col-label" x={beX + beW} y={32} textAnchor="end">backends</text>

          {/* edges from the LB to each backend; the most-recent dispatch pulses */}
          {backends.map((b, i) => {
            const ty = beY(i) + slotH / 2;
            const hot = i === activeBackend;
            return (
              <path
                key={`edge-${i}`}
                className={`lbv-edge ${hot ? 'is-hot' : ''}`}
                d={`M ${lbCx} ${lbCy} C ${lbCx + 110} ${lbCy}, ${beX - 110} ${ty}, ${beX} ${ty}`}
                markerEnd="url(#lbv-arrow)"
              />
            );
          })}

          {/* a request packet travelling along the active edge */}
          {activeBackend != null && running && (() => {
            const ty = beY(activeBackend) + slotH / 2;
            const mx = (lbCx + beX) / 2 + 20;
            const my = (lbCy + ty) / 2;
            return <circle key={`pkt-${metrics.total}`} className="lbv-packet" cx={mx} cy={my} r={6} />;
          })()}

          {/* load balancer node */}
          <g>
            <rect className="lbv-lb" x={lbX} y={lbY} width={lbW} height={lbH} rx={12} />
            <g transform={`translate(${lbX + 14}, ${lbY + 13})`}>
              <Network width={17} height={17} className="lbv-ic" />
            </g>
            <text className="lbv-lb-title" x={lbX + 40} y={lbY + 27}>balancer</text>
            <line className="lbv-rule" x1={lbX + 14} y1={lbY + 40} x2={lbX + lbW - 14} y2={lbY + 40} />
            <text className="lbv-lb-k" x={lbX + 14} y={lbY + 62}>strategy</text>
            <text className="lbv-lb-v" x={lbX + lbW - 14} y={lbY + 80}>{stratMeta.label}</text>
            <text className="lbv-lb-k" x={lbX + 14} y={lbY + 98}>{`rate ${rate}/tick`}</text>
          </g>

          {/* backends with live connection-load bars */}
          {backends.map((b, i) => {
            const y = beY(i);
            const tone = beTone(i);
            const hot = i === activeBackend;
            const fill = Math.min(b.active, MAX_BAR) / MAX_BAR;
            const bw = Math.max(2, fill * barMaxW);
            const cy = y + slotH / 2;
            const barY = cy - 9;
            return (
              <g key={`be-${i}`}>
                <rect
                  className={`lbv-be is-${tone} ${hot ? 'is-hot' : ''}`}
                  x={beX}
                  y={y}
                  width={beW}
                  height={slotH}
                  rx={11}
                />
                <g transform={`translate(${beX + 12}, ${y + 10})`}>
                  <Server width={15} height={15} className="lbv-ic" />
                </g>
                <text className="lbv-be-id" x={beX + 34} y={y + 22}>{`backend ${i + 1}`}</text>
                {strategy === 'weighted' && (
                  <text className="lbv-be-w" x={beX + 34} y={cy + 14}>{`w=${b.weight}`}</text>
                )}
                <text className="lbv-be-served" x={beX + 34} y={slotH > 56 ? y + slotH - 12 : cy + 14}>
                  {`served ${b.served}`}
                </text>

                <rect className="lbv-bar-track" x={barX} y={barY} width={barMaxW} height={18} rx={9} />
                <rect className={`lbv-bar-fill is-${tone}`} x={barX} y={barY} width={bw} height={18} rx={9} />
                <text className="lbv-bar-text" x={barX + barMaxW - 8} y={barY + 13}>
                  {`${b.active} active`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="lbv-metrics">
        <div className="lbv-metric">
          <span className="lbv-metric-label">strategy</span>
          <span className="lbv-metric-value">{stratMeta.label}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">backends</span>
          <span className="lbv-metric-value">{nBackends}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">requests dispatched</span>
          <span className="lbv-metric-value">{metrics.total}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">request rate</span>
          <span className="lbv-metric-value">{`${rate}/tick`}</span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">most loaded</span>
          <span className="lbv-metric-value">
            {metrics.total === 0 ? '—' : `backend ${metrics.maxIdx + 1} (${metrics.maxLoad})`}
          </span>
        </div>
        <div className="lbv-metric">
          <span className="lbv-metric-label">imbalance (max−min)</span>
          <span className={`lbv-metric-value ${metrics.imbalance > 2 ? 'is-bad' : metrics.imbalance <= 1 ? 'is-ok' : ''}`}>
            {metrics.imbalance}
          </span>
        </div>
        <div className="lbv-metric lbv-metric-wide">
          <span className="lbv-metric-label">distribution (served per backend)</span>
          <span className="lbv-metric-value lbv-dist">
            {metrics.dist.map((d, i) => (
              <span key={`d-${i}`} className="lbv-dist-cell">{`b${i + 1}:${d}`}</span>
            ))}
          </span>
        </div>
      </div>

      <div className="lbv-narration">
        <span className="lbv-narration-label">{running ? 'dispatch' : 'paused'}</span>
        <span className="lbv-narration-body">
          {last.reason
            ? last.reason
            : 'Press Play. The balancer will start fanning requests out to the backends using the chosen strategy.'}
        </span>
      </div>

      <div className="lbv-legend">
        <span className="lbv-legend-item"><span className="lbv-swatch is-hot" /> most-loaded backend</span>
        <span className="lbv-legend-item"><span className="lbv-swatch is-cool" /> least-loaded backend</span>
        <span className="lbv-legend-item"><Hash size={13} className="lbv-ic" /> hash keeps a key sticky to one backend</span>
      </div>
    </div>
  );
}
