import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Skull, Timer, Unplug, ShieldCheck, Zap } from 'lucide-react';
import './ChaosEngineeringViz.css';

const NODES = [
  { id: 'gw', label: 'Gateway', sub: 'edge', x: 90, y: 180 },
  { id: 'a', label: 'Service A', sub: 'orders', x: 320, y: 90 },
  { id: 'b', label: 'Service B', sub: 'payments', x: 320, y: 270 },
  { id: 'cache', label: 'Cache', sub: 'read path', x: 560, y: 90 },
  { id: 'db', label: 'Database', sub: 'primary', x: 560, y: 270 },
  { id: 'replica', label: 'Replica', sub: 'standby', x: 790, y: 270 },
];

const EDGES = [
  { id: 'gw-a', from: 'gw', to: 'a' },
  { id: 'gw-b', from: 'gw', to: 'b' },
  { id: 'a-cache', from: 'a', to: 'cache' },
  { id: 'a-db', from: 'a', to: 'db' },
  { id: 'b-db', from: 'b', to: 'db' },
  { id: 'db-replica', from: 'db', to: 'replica' },
];

const N = (id) => NODES.find((n) => n.id === id);

const FAULT_NODES = ['a', 'b', 'cache', 'db'];

const BATCHES = 22;

function makeLcg(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function routeFor(rng, faults, resilient) {
  const killed = faults.kill;
  const slow = faults.latency;
  const partitioned = faults.partition;

  const useA = rng() < 0.5;
  const primary = useA ? 'a' : 'b';
  const path = ['gw', primary];
  let target = useA ? (rng() < 0.5 ? 'cache' : 'db') : 'db';
  path.push(target);

  let latency = 40 + Math.round(rng() * 30);
  let failedNode = null;
  let edgeCut = false;
  let rerouted = false;
  let breakerTrip = false;

  const isSlow = (n) => slow === n;
  const isKilled = (n) => killed === n;
  const isCut = (n) => partitioned === n;

  for (const n of path) {
    if (isSlow(n)) latency += 90;
  }

  const broken = path.find((n) => isKilled(n) || isCut(n));
  if (broken) {
    if (isCut(broken)) edgeCut = true;
    if (resilient) {
      if (broken === 'db' || broken === 'cache') {
        if (broken === 'db') {
          target = 'replica';
          path[path.length - 1] = 'replica';
          rerouted = true;
          latency += 50;
        } else {
          target = 'db';
          path[path.length - 1] = 'db';
          rerouted = true;
          latency += 35;
        }
      } else {
        const alt = broken === 'a' ? 'b' : 'a';
        path[1] = alt;
        path[2] = 'db';
        target = 'db';
        rerouted = true;
        latency += 45;
      }
      if (latency > 180) {
        breakerTrip = true;
        latency = 60;
      }
      const stillBad = path.find((n) => isKilled(n) || isCut(n));
      if (stillBad || rng() < 0.18) {
        failedNode = broken;
        return { path, target, latency, ok: false, failedNode, edgeCut, rerouted, breakerTrip };
      }
      return { path, target, latency, ok: true, failedNode: null, edgeCut, rerouted, breakerTrip };
    }
    failedNode = broken;
    return { path, target, latency, ok: false, failedNode, edgeCut, rerouted: false, breakerTrip: false };
  }

  if (slow && path.includes(slow)) {
    if (resilient && latency > 170) {
      breakerTrip = true;
      latency = 65;
    } else if (!resilient && rng() < 0.12) {
      failedNode = slow;
      return { path, target, latency, ok: false, failedNode, edgeCut: false, rerouted: false, breakerTrip: false };
    }
  }

  return { path, target, latency, ok: true, failedNode: null, edgeCut: false, rerouted, breakerTrip };
}

function buildFrames(faults, resilient) {
  const frames = [];
  const rng = makeLcg(1337 + (faults.kill ? 7 : 0) + (faults.latency ? 31 : 0) + (faults.partition ? 71 : 0) + (resilient ? 101 : 0));
  let ok = 0;
  let fail = 0;
  let latSum = 0;
  let consecutiveFail = 0;
  let breakerOpen = false;
  let breakerHalf = false;

  const activeList = () => {
    const out = [];
    if (faults.kill) out.push(`kill:${N(faults.kill).label}`);
    if (faults.latency) out.push(`slow:${N(faults.latency).label}`);
    if (faults.partition) out.push(`cut:${N(faults.partition).label}`);
    return out;
  };

  const breakerState = () => (breakerOpen ? 'open' : breakerHalf ? 'half-open' : 'closed');

  const snap = (extra) => ({
    ok,
    fail,
    total: ok + fail,
    avgLat: ok + fail > 0 ? Math.round(latSum / (ok + fail)) : 0,
    route: [],
    target: null,
    failedNode: null,
    edgeCut: false,
    rerouted: false,
    breaker: breakerState(),
    active: activeList(),
    note: '',
    ...extra,
  });

  const faultDesc = activeList().length ? activeList().join(', ') : 'none';
  frames.push(snap({
    note: `Traffic flows Gateway -> Service A/B -> Cache/Database, with a standby Replica behind the primary. Resilience (retries + circuit-breaker) is ${resilient ? 'ON' : 'OFF'}. Active faults: ${faultDesc}.`,
  }));

  for (let i = 0; i < BATCHES; i += 1) {
    const r = routeFor(rng, faults, resilient);
    latSum += r.latency;
    if (r.ok) {
      ok += 1;
      consecutiveFail = Math.max(0, consecutiveFail - 1);
      if (breakerOpen && resilient) {
        breakerOpen = false;
        breakerHalf = true;
      } else if (breakerHalf) {
        breakerHalf = false;
      }
    } else {
      fail += 1;
      consecutiveFail += 1;
      if (resilient && consecutiveFail >= 3) {
        breakerOpen = true;
        breakerHalf = false;
      }
    }
    if (r.breakerTrip && resilient) breakerOpen = false;

    let note;
    const routeStr = r.path.map((n) => N(n).label).join(' -> ');
    if (r.ok) {
      note = `Batch #${i + 1}: ${routeStr} -> ${r.target ? N(r.target).label : ''} succeeded${r.rerouted ? ' (rerouted around a fault)' : ''} in ${r.latency}ms.`;
    } else {
      note = `Batch #${i + 1}: ${routeStr} FAILED at ${N(r.failedNode).label}${r.edgeCut ? ' (link partitioned)' : ''}.${resilient ? ' Retry exhausted.' : ' No retry — request dropped.'}`;
    }
    if (breakerOpen) note += ' Circuit breaker OPEN — shedding load to the failing dependency.';
    else if (breakerHalf) note += ' Breaker HALF-OPEN — probing recovery.';

    frames.push(snap({
      route: r.path,
      target: r.target,
      failedNode: r.ok ? null : r.failedNode,
      edgeCut: r.edgeCut,
      rerouted: r.rerouted,
      ok: r.ok ? ok : ok,
      note,
    }));
  }

  const rate = ok + fail > 0 ? Math.round((ok / (ok + fail)) * 100) : 100;
  frames.push(snap({
    note: `Done. ${ok}/${ok + fail} succeeded (${rate}%). With resilience ${resilient ? 'ON, retries + the breaker rerouted around the fault and held the success rate up' : 'OFF, requests through the faulty path simply dropped'}. Compare both toggles under the same fault to see graceful degradation vs a hard crater.`,
  }));

  return frames;
}

export default function ChaosEngineeringViz() {
  const [kill, setKill] = useState('');
  const [latency, setLatency] = useState('');
  const [partition, setPartition] = useState('');
  const [resilient, setResilient] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const faults = useMemo(() => ({ kill, latency, partition }), [kill, latency, partition]);
  const frames = useMemo(() => buildFrames(faults, resilient), [faults, resilient]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const cycleFault = (value, setter) => {
    setIsRunning(false);
    setStep(0);
    const idx = FAULT_NODES.indexOf(value);
    const next = idx < 0 ? FAULT_NODES[0] : (idx + 1 >= FAULT_NODES.length ? '' : FAULT_NODES[idx + 1]);
    setter(next);
  };

  const toggleResilient = () => {
    setIsRunning(false);
    setStep(0);
    setResilient((v) => !v);
  };

  const onPath = (id) => current.route.includes(id);
  const nodeState = (id) => {
    if (current.failedNode === id) return 'fail';
    if (kill === id || partition === id) return current.route.includes(id) ? 'fail' : 'dead';
    if (latency === id) return 'slow';
    if (onPath(id)) return 'active';
    return 'idle';
  };

  const edgeOnPath = (e) => {
    const ri = current.route.indexOf(e.from);
    return ri >= 0 && current.route[ri + 1] === e.to;
  };
  const edgeState = (e) => {
    if (partition === e.from || partition === e.to) {
      if (current.edgeCut && edgeOnPath(e)) return 'cut';
    }
    if (current.failedNode && (e.to === current.failedNode) && edgeOnPath(e)) return 'fail';
    if (edgeOnPath(e)) return 'active';
    return 'idle';
  };

  const rate = current.total > 0 ? Math.round((current.ok / current.total) * 100) : 100;
  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 380;

  return (
    <div className="cev">
      <div className="cev-head">
        <h3 className="cev-title">Chaos engineering — fault injection and graceful degradation</h3>
        <p className="cev-sub">
          Inject faults into a service-dependency graph, then send traffic. Watch the same fault crater the
          success rate with resilience off, and degrade gracefully when retries and a circuit-breaker are on.
        </p>
      </div>

      <div className="cev-controls">
        <div className="cev-faults">
          <button
            type="button"
            className={`cev-fault ${kill ? 'is-on' : ''}`}
            onClick={() => cycleFault(kill, setKill)}
          >
            <Skull size={14} /> Kill {kill ? N(kill).label : 'node'}
          </button>
          <button
            type="button"
            className={`cev-fault ${latency ? 'is-on' : ''}`}
            onClick={() => cycleFault(latency, setLatency)}
          >
            <Timer size={14} /> Latency {latency ? N(latency).label : 'node'}
          </button>
          <button
            type="button"
            className={`cev-fault ${partition ? 'is-on' : ''}`}
            onClick={() => cycleFault(partition, setPartition)}
          >
            <Unplug size={14} /> Partition {partition ? N(partition).label : 'node'}
          </button>
        </div>

        <button
          type="button"
          className={`cev-toggle ${resilient ? 'is-on' : ''}`}
          onClick={toggleResilient}
          aria-pressed={resilient}
        >
          {resilient ? <ShieldCheck size={14} /> : <Zap size={14} />}
          retries + breaker {resilient ? 'ON' : 'OFF'}
        </button>

        <label className="cev-slider">
          <span className="cev-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cev-range" aria-label="Playback speed"
          />
          <span className="cev-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="cev-spacer" aria-hidden="true" />

        <div className="cev-buttons">
          <button
            type="button"
            className="cev-btn cev-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel === 'Play' ? 'Send traffic' : playLabel}
          </button>
          <button
            type="button"
            className="cev-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cev-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cev-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cev-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cev-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cev-svg" preserveAspectRatio="xMidYMid meet">
          <text className="cev-row-label" x={20} y={28}>service dependency graph (highlighted path = current request)</text>

          {EDGES.map((e) => {
            const a = N(e.from);
            const b = N(e.to);
            const st = edgeState(e);
            return (
              <g key={`edge-${e.id}`}>
                <line
                  className={`cev-edge is-${st}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
                {st === 'cut' && (
                  <g className="cev-edge-cut">
                    <line
                      x1={(a.x + b.x) / 2 - 6}
                      y1={(a.y + b.y) / 2 - 6}
                      x2={(a.x + b.x) / 2 + 6}
                      y2={(a.y + b.y) / 2 + 6}
                    />
                    <line
                      x1={(a.x + b.x) / 2 + 6}
                      y1={(a.y + b.y) / 2 - 6}
                      x2={(a.x + b.x) / 2 - 6}
                      y2={(a.y + b.y) / 2 + 6}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {NODES.map((n) => {
            const st = nodeState(n.id);
            return (
              <g key={`node-${n.id}`}>
                <rect
                  className={`cev-node is-${st}`}
                  x={n.x - 58}
                  y={n.y - 26}
                  width={116}
                  height={52}
                  rx={10}
                />
                <text className="cev-node-label" x={n.x} y={n.y - 2}>{n.label}</text>
                <text className="cev-node-sub" x={n.x} y={n.y + 15}>{n.sub}</text>
              </g>
            );
          })}

          <g>
            <text className="cev-rate-label" x={W - 150} y={40}>success rate</text>
            <text className={`cev-rate ${rate >= 90 ? 'is-good' : rate >= 70 ? 'is-warn' : 'is-bad'}`} x={W - 150} y={78}>
              {rate}%
            </text>
            <text className="cev-rate-sub" x={W - 150} y={100}>
              {current.ok} ok · {current.fail} failed
            </text>
            <text className="cev-rate-sub" x={W - 150} y={118}>
              breaker {current.breaker}
            </text>
          </g>
        </svg>
      </div>

      <div className="cev-metrics">
        <div className="cev-metric">
          <span className="cev-metric-label">resilience</span>
          <span className={`cev-metric-value ${resilient ? 'is-good' : 'is-bad'}`}>{resilient ? 'on' : 'off'}</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">success rate</span>
          <span className={`cev-metric-value ${rate >= 90 ? 'is-good' : rate >= 70 ? 'is-warn' : 'is-bad'}`}>{rate}%</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">failed</span>
          <span className="cev-metric-value is-bad">{current.fail}</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">avg latency</span>
          <span className="cev-metric-value">{current.avgLat}ms</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">breaker</span>
          <span className={`cev-metric-value ${current.breaker === 'open' ? 'is-bad' : current.breaker === 'half-open' ? 'is-warn' : 'is-good'}`}>{current.breaker}</span>
        </div>
        <div className="cev-metric">
          <span className="cev-metric-label">active faults</span>
          <span className="cev-metric-value">{current.active.length ? current.active.join(' · ') : '—'}</span>
        </div>
      </div>

      <div className="cev-narration">
        <span className="cev-narration-label">trace</span>
        <span className="cev-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
