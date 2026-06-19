import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Boxes, Zap } from 'lucide-react';
import './BuildGraphViz.css';

const STRATEGIES = ['Webpack', 'Vite'];

const NODES = [
  { id: 'main', label: 'main.jsx', x: 90, y: 200, entry: true },
  { id: 'app', label: 'App.jsx', x: 280, y: 120 },
  { id: 'router', label: 'router.js', x: 280, y: 280 },
  { id: 'home', label: 'Home.jsx', x: 470, y: 60 },
  { id: 'utils', label: 'utils.js', x: 470, y: 160 },
  { id: 'about', label: 'About.jsx', x: 470, y: 260 },
  { id: 'settings', label: 'Settings.jsx', x: 470, y: 360 },
  { id: 'chart', label: 'chart.js', x: 660, y: 60 },
  { id: 'format', label: 'format.js', x: 660, y: 160 },
  { id: 'icons', label: 'icons.js', x: 660, y: 290 },
  { id: 'date', label: 'date.js', x: 660, y: 390 },
];

const EDGES = [
  ['main', 'app'],
  ['main', 'router'],
  ['app', 'home'],
  ['app', 'utils'],
  ['router', 'about'],
  ['router', 'settings'],
  ['home', 'chart'],
  ['home', 'format'],
  ['utils', 'format'],
  ['about', 'icons'],
  ['settings', 'date'],
];

const ENTRY = 'main';
const VITE_NEEDED = ['main', 'app', 'home', 'utils', 'chart', 'format'];

const childrenOf = (id) => EDGES.filter(([from]) => from === id).map(([, to]) => to);

function webpackBuildOrder() {
  const order = [];
  const seen = new Set();
  const visit = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    order.push(id);
    for (const child of childrenOf(id)) visit(child);
  };
  visit(ENTRY);
  for (const node of NODES) visit(node.id);
  return order;
}

function viteTransformOrder() {
  const order = [];
  const seen = new Set();
  const queue = [ENTRY];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id) || !VITE_NEEDED.includes(id)) continue;
    seen.add(id);
    order.push(id);
    for (const child of childrenOf(id)) {
      if (VITE_NEEDED.includes(child)) queue.push(child);
    }
  }
  return order;
}

function buildFrames(strategy) {
  const frames = [];
  const total = NODES.length;

  const snap = (extra) => ({
    done: [],
    active: null,
    firstPaint: false,
    requested: [],
    note: '',
    ...extra,
  });

  if (strategy === 'Webpack') {
    const order = webpackBuildOrder();
    frames.push(
      snap({
        note: 'Cold start. Webpack must crawl the whole import graph and bundle every module before the dev server can serve a single byte to the browser.',
      }),
    );
    const done = [];
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const label = NODES.find((n) => n.id === id).label;
      frames.push(
        snap({
          done: [...done],
          active: id,
          note: `Bundling ${label} (${i + 1}/${total}). No paint yet — the page stays blank until the whole bundle is assembled.`,
        }),
      );
      done.push(id);
    }
    frames.push(
      snap({
        done: [...done],
        firstPaint: true,
        note: `Bundle complete — all ${total} modules processed. Only now does the browser get a response and first paint happens. Cold start cost scales with the entire graph.`,
      }),
    );
    return frames;
  }

  const order = viteTransformOrder();
  frames.push(
    snap({
      note: 'Cold start. Vite serves native ESM. It hands the browser the entry module immediately; the browser then requests imports on demand and Vite transforms only those.',
    }),
  );
  const done = [];
  const requested = [];
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const node = NODES.find((n) => n.id === id);
    if (!requested.includes(id)) requested.push(id);
    frames.push(
      snap({
        done: [...done],
        active: id,
        requested: [...requested],
        firstPaint: i > 0,
        note: i === 0
          ? `Browser requests the entry ${node.label}; Vite transforms just this one file and the page paints almost instantly.`
          : `Browser hit an import, so Vite lazily transforms ${node.label} (${i + 1} so far). Untouched modules are never transformed at startup.`,
      }),
    );
    done.push(id);
    for (const child of childrenOf(id)) {
      if (VITE_NEEDED.includes(child) && !requested.includes(child)) requested.push(child);
    }
  }
  const skipped = total - done.length;
  frames.push(
    snap({
      done: [...done],
      requested: [...requested],
      firstPaint: true,
      note: `Page is interactive after transforming only ${done.length} of ${total} modules. ${skipped} modules behind unused routes stay untransformed until something actually imports them.`,
    }),
  );
  return frames;
}

export default function BuildGraphViz() {
  const [strategy, setStrategy] = useState('Webpack');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const framesByStrategy = useMemo(
    () => ({ Webpack: buildFrames('Webpack'), Vite: buildFrames('Vite') }),
    [],
  );
  const frames = framesByStrategy[strategy];

  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(820 / speed);

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

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const switchStrategy = (s) => {
    if (s === strategy) return;
    setStrategy(s);
    setIsRunningRaw(false);
    setStep(0);
  };

  const isVite = strategy === 'Vite';
  const doneSet = useMemo(() => new Set(current.done), [current.done]);
  const requestedSet = useMemo(() => new Set(current.requested), [current.requested]);

  const processed = current.done.length + (current.active && !doneSet.has(current.active) ? 1 : 0);
  const total = NODES.length;
  const skipped = total - processed;

  const verb = isVite ? 'transformed' : 'built';
  const paintMetric = current.firstPaint
    ? isVite
      ? `${current.done.length}/${total}`
      : `${total}/${total}`
    : 'pending';

  const nodeFill = (id) => {
    if (id === current.active) return isVite ? 'var(--hue-mint)' : 'var(--hue-pink)';
    if (doneSet.has(id)) return isVite ? 'var(--easy)' : 'var(--accent)';
    if (isVite && requestedSet.has(id)) return 'rgba(var(--accent-rgb), 0.18)';
    return 'var(--bg)';
  };

  const nodeStroke = (id) => {
    if (id === current.active) return isVite ? 'var(--hue-mint)' : 'var(--hue-pink)';
    if (doneSet.has(id)) return isVite ? 'var(--easy)' : 'var(--accent)';
    if (id === ENTRY) return 'var(--accent)';
    return 'var(--border)';
  };

  const nodeDark = (id) => id === current.active || doneSet.has(id);

  const edgeActive = (from, to) => doneSet.has(from) && (doneSet.has(to) || to === current.active);

  const W = 940;
  const H = 470;
  const graphW = 760;
  const NW = 104;
  const NH = 38;

  return (
    <div className="bgv">
      <div className="bgv-head">
        <h3 className="bgv-title">Cold start — Webpack bundles the whole graph, Vite transforms on demand</h3>
        <p className="bgv-sub">
          Step a cold dev-server start through the same module graph. Webpack must process every module before
          first paint; Vite serves the entry over native ESM and transforms only the imports the page actually pulls.
        </p>
      </div>

      <div className="bgv-controls">
        <div className="bgv-actions">
          <div className="bgv-modes" role="tablist" aria-label="bundler strategy">
            {STRATEGIES.map((s) => (
              <button
                key={s}
                type="button"
                className={`bgv-mode ${strategy === s ? 'is-on' : ''}`}
                onClick={() => switchStrategy(s)}
                aria-pressed={strategy === s}
              >
                {s === 'Vite' ? <Zap size={13} /> : <Boxes size={13} />}
                {s}
              </button>
            ))}
          </div>

          <div className="bgv-buttons">
            <button
              type="button"
              className="bgv-btn bgv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="bgv-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bgv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bgv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <label className="bgv-speed">
            <span className="bgv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bgv-speed-range"
            />
            <span className="bgv-speed-value">{speed.toFixed(1)}×</span>
          </label>

          <div className="bgv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bgv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="bgv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="bgv-row-label" x={20} y={28}>
            module dependency graph — {isVite ? 'transformed lazily on import' : 'bundled top to bottom'}
          </text>

          {EDGES.map(([from, to]) => {
            const a = NODES.find((n) => n.id === from);
            const b = NODES.find((n) => n.id === to);
            const active = edgeActive(from, to);
            return (
              <line
                key={`edge-${from}-${to}`}
                x1={a.x + NW / 2}
                y1={a.y}
                x2={b.x - NW / 2}
                y2={b.y}
                className={`bgv-edge ${active ? 'is-active' : ''}`}
                stroke={active ? (isVite ? 'var(--easy)' : 'var(--accent)') : 'var(--border)'}
              />
            );
          })}

          {NODES.map((node) => {
            const fill = nodeFill(node.id);
            const stroke = nodeStroke(node.id);
            const dark = nodeDark(node.id);
            const isActive = node.id === current.active;
            return (
              <g key={`node-${node.id}`}>
                <rect
                  x={node.x - NW / 2}
                  y={node.y - NH / 2}
                  width={NW}
                  height={NH}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive || node.id === ENTRY ? 2.4 : 1.2}
                />
                <text
                  x={node.x}
                  y={node.y - 1}
                  className="bgv-node-label"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-main)' }}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 12}
                  className="bgv-node-tag"
                  style={{ fill: dark ? 'var(--bg)' : 'var(--text-dim)' }}
                >
                  {node.id === ENTRY ? 'entry' : ''}
                </text>
              </g>
            );
          })}

          <rect
            x={graphW + 6}
            y={44}
            width={W - graphW - 26}
            height={H - 64}
            fill="var(--surface)"
            stroke="var(--border)"
            rx={8}
          />
          <text className="bgv-row-label" x={graphW + 22} y={70}>
            first paint
          </text>
          <text
            x={graphW + 22}
            y={104}
            className="bgv-readout-big"
            style={{ fill: current.firstPaint ? 'var(--easy)' : 'var(--warning)' }}
          >
            {current.firstPaint ? 'painted' : 'blank'}
          </text>
          <text className="bgv-readout-cap" x={graphW + 22} y={126}>
            {isVite ? 'entry serves immediately' : 'waits for full bundle'}
          </text>

          <line
            x1={graphW + 22}
            y1={146}
            x2={W - 26}
            y2={146}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text className="bgv-row-label" x={graphW + 22} y={170}>
            modules {verb}
          </text>
          <text className="bgv-readout-big" x={graphW + 22} y={204}>
            {processed} / {total}
          </text>
          <text className="bgv-readout-cap" x={graphW + 22} y={226}>
            {isVite ? `${skipped} skipped at startup` : 'whole graph required'}
          </text>

          <line
            x1={graphW + 22}
            y1={246}
            x2={W - 26}
            y2={246}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text className="bgv-row-label" x={graphW + 22} y={270}>
            cold-start cost
          </text>
          <text className="bgv-readout-mid" x={graphW + 22} y={296}>
            {isVite ? 'O(requested)' : 'O(whole graph)'}
          </text>
          <text className="bgv-readout-cap" x={graphW + 22} y={320}>
            {isVite ? 'near flat as app grows' : 'grows with module count'}
          </text>

          {[
            { fill: 'var(--accent)', label: 'entry / built' },
            { fill: isVite ? 'var(--hue-mint)' : 'var(--hue-pink)', label: isVite ? 'transforming' : 'bundling' },
            ...(isVite ? [{ fill: 'rgba(var(--accent-rgb), 0.18)', label: 'requested import' }] : []),
            { fill: 'var(--bg)', label: isVite ? 'not transformed' : 'queued' },
          ].map((row, i) => {
            const ly = 348 + i * 22;
            return (
              <g key={`lg-${row.label}`}>
                <rect
                  x={graphW + 22}
                  y={ly}
                  width={14}
                  height={14}
                  rx={3}
                  fill={row.fill}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text className="bgv-legend-text" x={graphW + 42} y={ly + 11}>
                  {row.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="bgv-metrics">
        <div className="bgv-metric">
          <span className="bgv-metric-label">strategy</span>
          <span className={`bgv-metric-value ${isVite ? 'is-vite' : 'is-webpack'}`}>{strategy}</span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">modules {verb}</span>
          <span className="bgv-metric-value">
            {processed} / {total}
          </span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">processed before paint</span>
          <span className="bgv-metric-value">{paintMetric}</span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">first paint</span>
          <span className={`bgv-metric-value ${current.firstPaint ? 'is-vite' : 'is-blank'}`}>
            {current.firstPaint ? 'painted' : 'blank'}
          </span>
        </div>
        <div className="bgv-metric">
          <span className="bgv-metric-label">startup skips</span>
          <span className="bgv-metric-value">{isVite ? skipped : 0}</span>
        </div>
      </div>

      <div className="bgv-trace">
        <span className="bgv-trace-label">trace</span>
        <span className="bgv-trace-body">{current.note}</span>
      </div>
    </div>
  );
}
