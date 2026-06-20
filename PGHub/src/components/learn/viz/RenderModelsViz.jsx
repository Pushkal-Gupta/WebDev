import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Server, Wifi, Cpu, MousePointerClick, Zap, Eye, Package,
} from 'lucide-react';
import './RenderModelsViz.css';

// Three web rendering models answering the SAME page request, drawn as
// waterfall timelines so the trade-offs are unmissable.
//
//   CSR  the server ships a near-empty HTML shell plus a big JS bundle. The
//        browser must DOWNLOAD that JS, parse+execute it, THEN fetch data and
//        only then paint. First paint is late; nothing is interactive until JS
//        has run; the most JS is shipped.
//   SSR  the server renders full HTML and sends it — the first paint lands
//        early off the wire. But the page is inert until the JS bundle arrives
//        and HYDRATES (re-attaches event handlers). Medium JS shipped.
//   RSC  server components render on the server and STREAM HTML; server-only
//        parts ship ZERO client JS. Only interactive islands ship JS, so the
//        bundle is small, paint is early, and TTI lands soonest.
//
// Each phase has a deterministic duration (ms) and a JS byte cost. No
// Math.random anywhere — every run is identical and reproducible.

// Phase kinds, mapped to theme tokens via CSS classes.
//   server  = hue-violet   network = hue-sky   jsexec = warning/hard
//   hydrate = medium       interactive = easy
const MODELS = {
  csr: {
    key: 'csr',
    label: 'CSR',
    full: 'Client-Side Rendering',
    jsKB: 240,
    wireKB: 18, // tiny HTML shell over the wire (plus JS counted separately)
    // phases laid end-to-end along the time axis (ms each)
    phases: [
      { kind: 'server', label: 'server: send shell', ms: 30 },
      { kind: 'network', label: 'network: HTML shell + JS bundle', ms: 220 },
      { kind: 'jsexec', label: 'JS: download, parse, execute', ms: 260 },
      { kind: 'network', label: 'fetch data (client)', ms: 130 },
      { kind: 'interactive', label: 'render + interactive', ms: 70 },
    ],
    // index of the phase boundary where first paint / TTI land
    firstPaintAfter: 4, // paint only after JS runs + data fetch (start of last phase)
    ttiAfter: 5, // interactive only once the final phase completes
    why: 'The browser gets an almost-empty page, then has to download and run a big JS bundle and fetch its data before anything appears. First paint is the latest of the three and the most JavaScript crosses the wire.',
  },
  ssr: {
    key: 'ssr',
    label: 'SSR',
    full: 'Server-Side Rendering',
    jsKB: 140,
    wireKB: 46, // full rendered HTML over the wire
    phases: [
      { kind: 'server', label: 'server: render full HTML', ms: 110 },
      { kind: 'network', label: 'network: full HTML', ms: 90 },
      { kind: 'jsexec', label: 'JS: download bundle', ms: 150 },
      { kind: 'hydrate', label: 'hydrate: attach handlers', ms: 120 },
      { kind: 'interactive', label: 'interactive', ms: 30 },
    ],
    firstPaintAfter: 2, // full HTML painted as soon as it lands off the wire
    ttiAfter: 5, // interactive only after hydration completes
    why: 'The server renders complete HTML, so the reader sees the page early — first paint beats CSR. But the page is frozen until the JS bundle arrives and hydration wires up every handler, so interactivity still trails the paint.',
  },
  rsc: {
    key: 'rsc',
    label: 'RSC',
    full: 'React Server Components',
    jsKB: 52,
    wireKB: 40, // streamed HTML
    phases: [
      { kind: 'server', label: 'server: render + stream HTML', ms: 90 },
      { kind: 'network', label: 'network: stream first bytes', ms: 60 },
      { kind: 'jsexec', label: 'JS: island bundle only', ms: 70 },
      { kind: 'hydrate', label: 'hydrate islands', ms: 50 },
      { kind: 'interactive', label: 'interactive', ms: 30 },
    ],
    firstPaintAfter: 2, // streamed HTML paints as the first bytes arrive
    ttiAfter: 5, // only the small island bundle needs to hydrate
    why: 'Server components render on the server and stream HTML; static parts ship no client JS at all. Only the interactive islands send a bundle, so the smallest JavaScript hydrates and time-to-interactive lands soonest.',
  },
};

const ORDER = ['csr', 'ssr', 'rsc'];

// Cumulative end time (ms) of phase index `i` (exclusive prefix sum + this phase).
function phaseBounds(model) {
  let t = 0;
  const bounds = model.phases.map((p) => {
    const start = t;
    t += p.ms;
    return { ...p, start, end: t };
  });
  return { bounds, total: t };
}

// Precompute per-model bounds + first-paint/TTI absolute times once.
const COMPUTED = Object.fromEntries(ORDER.map((k) => {
  const m = MODELS[k];
  const { bounds, total } = phaseBounds(m);
  // firstPaintAfter / ttiAfter are 1-based phase-completion indices; the marker
  // sits at the END of that phase (or START of the named phase for paint).
  const firstPaint = bounds[m.firstPaintAfter - 1].end;
  const tti = bounds[m.ttiAfter - 1].end;
  return [k, { bounds, total, firstPaint, tti }];
}));

// Global time scale so all three waterfalls + the comparison share one axis.
const MAX_TOTAL = Math.max(...ORDER.map((k) => COMPUTED[k].total));
const MAX_JS = Math.max(...ORDER.map((k) => MODELS[k].jsKB));
const MAX_TTI = Math.max(...ORDER.map((k) => COMPUTED[k].tti));

const TICK_MS = 620; // base per-phase reveal interval; divided by speed

export default function RenderModelsViz() {
  const [model, setModel] = useState('csr');
  const [step, setStep] = useState(0); // phases revealed so far
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const active = MODELS[model];
  const comp = COMPUTED[model];
  const totalSteps = active.phases.length;
  const isRunning = isRunningRaw && step < totalSteps;
  const delay = useMemo(() => Math.round(TICK_MS / Math.max(speed, 0.1)), [speed]);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps)), delay);
    return () => {
      if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => { if (runTimer.current) clearTimeout(runTimer.current); }, []);

  const reset = () => { setIsRunning(false); setStep(0); };

  const selectModel = (k) => {
    setModel(k);
    setStep(0);
    setIsRunning(false);
  };

  // time reached so far along the axis (end of last revealed phase)
  const reachedMs = step > 0 ? comp.bounds[Math.min(step, totalSteps) - 1].end : 0;
  const firstPaintReached = reachedMs >= comp.firstPaint;
  const ttiReached = reachedMs >= comp.tti;
  const done = step >= totalSteps;

  const playLabel = isRunningRaw && step < totalSteps
    ? 'Pause' : (step >= totalSteps ? 'Replay' : 'Play');

  // ---- SVG geometry ----
  const W = 960;
  const H = 470;

  // waterfall region
  const wfX0 = 150; // left gutter for phase labels
  const wfX1 = W - 150; // right gutter for ms readout
  const wfW = wfX1 - wfX0;
  const axisY = 70;
  const rowTop = 92;
  const rowH = 34;
  const barH = 22;
  const msToX = (ms) => wfX0 + (ms / Math.max(1, MAX_TOTAL)) * wfW;
  const msToW = (ms) => (ms / Math.max(1, MAX_TOTAL)) * wfW;

  // axis ticks every 100ms
  const ticks = [];
  for (let t = 0; t <= MAX_TOTAL; t += 100) ticks.push(t);

  const phaseKindClass = (kind) => `rmv-bar is-${kind}`;

  // comparison region (bottom): 3-bar TTI chart + JS-shipped chart
  const cmpTop = rowTop + 5 * rowH + 70;
  const cmpRowH = 26;
  const cmpGap = 8;
  const cmpBarX0 = wfX0; // align with waterfall
  const cmpBarW = (wfW - 110) / 2; // two charts side by side
  const cmpBarX0b = cmpBarX0 + cmpBarW + 110;

  const narr = active.why;

  return (
    <div className="rmv">
      <div className="rmv-head">
        <h3 className="rmv-title">Three ways to render a page — CSR vs SSR vs RSC</h3>
        <p className="rmv-sub">
          The same page request, played as a waterfall for each model. Watch where first paint and
          time-to-interactive land, and how much JavaScript each one ships.
        </p>
      </div>

      <div className="rmv-controls">
        <div className="rmv-seg" role="group" aria-label="Rendering model">
          {ORDER.map((k) => (
            <button
              key={k}
              type="button"
              className={`rmv-seg-btn ${model === k ? 'is-on' : ''}`}
              onClick={() => selectModel(k)}
              aria-pressed={model === k}
              title={MODELS[k].full}
            >
              {MODELS[k].label}
            </button>
          ))}
        </div>

        <label className="rmv-speed">
          <span className="rmv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rmv-speed-range" aria-label="Playback speed"
          />
          <span className="rmv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="rmv-spacer" aria-hidden="true" />

        <div className="rmv-buttons">
          <button
            type="button" className="rmv-btn rmv-btn-primary"
            onClick={() => { if (step >= totalSteps) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="rmv-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps))} disabled={step >= totalSteps}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="rmv-btn" onClick={() => setStep(totalSteps)} disabled={step >= totalSteps}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="rmv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <div className="rmv-stepcount">phase <strong>{Math.min(step, totalSteps)}</strong> / {totalSteps}</div>
      </div>

      <div className="rmv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rmv-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- waterfall header ---- */}
          <text className="rmv-region-label" x={wfX0} y={36} textAnchor="start">
            {`${active.label} — ${active.full}`}
          </text>
          <text className="rmv-region-sub" x={wfX1} y={36} textAnchor="end">
            time →
          </text>

          {/* time axis */}
          <line className="rmv-axis" x1={wfX0} y1={axisY} x2={wfX1} y2={axisY} />
          {ticks.map((t) => (
            <g key={`tick-${t}`}>
              <line className="rmv-tick" x1={msToX(t)} y1={axisY - 4} x2={msToX(t)} y2={axisY} />
              <text className="rmv-tick-t" x={msToX(t)} y={axisY - 8} textAnchor="middle">{t}</text>
            </g>
          ))}

          {/* phase rows */}
          {comp.bounds.map((p, i) => {
            const ry = rowTop + i * rowH;
            const revealed = i < step;
            const isCurrent = i === step - 1;
            const bx = msToX(p.start);
            const bw = Math.max(4, msToW(p.ms));
            return (
              <g key={`phase-${i}`}>
                <text className="rmv-phase-label" x={wfX0 - 10} y={ry + barH / 2 + 4} textAnchor="end">
                  {p.label}
                </text>
                {/* track ghost */}
                <rect className="rmv-track" x={bx} y={ry} width={bw} height={barH} rx={5} />
                {revealed && (
                  <rect
                    className={`${phaseKindClass(p.kind)} ${isCurrent ? 'is-current' : ''}`}
                    x={bx}
                    y={ry}
                    width={bw}
                    height={barH}
                    rx={5}
                  />
                )}
                {revealed && (
                  <text className="rmv-phase-ms" x={bx + bw + 8} y={ry + barH / 2 + 4} textAnchor="start">
                    {`${p.ms}ms`}
                  </text>
                )}
              </g>
            );
          })}

          {/* progress token — vertical sweep line at reached time */}
          <line
            className="rmv-sweep"
            x1={msToX(reachedMs)}
            y1={axisY}
            x2={msToX(reachedMs)}
            y2={rowTop + 5 * rowH - 6}
          />

          {/* First Paint marker */}
          <g className={`rmv-marker ${firstPaintReached ? 'is-lit' : ''}`}>
            <line
              className="rmv-marker-line is-paint"
              x1={msToX(comp.firstPaint)}
              y1={axisY - 2}
              x2={msToX(comp.firstPaint)}
              y2={rowTop + 5 * rowH + 6}
            />
            <rect
              className="rmv-marker-tag is-paint"
              x={msToX(comp.firstPaint) - 38}
              y={rowTop + 5 * rowH + 8}
              width={76}
              height={18}
              rx={4}
            />
            <text className="rmv-marker-t" x={msToX(comp.firstPaint)} y={rowTop + 5 * rowH + 21} textAnchor="middle">
              {`paint ${comp.firstPaint}ms`}
            </text>
          </g>

          {/* TTI marker */}
          <g className={`rmv-marker ${ttiReached ? 'is-lit' : ''}`}>
            <line
              className="rmv-marker-line is-tti"
              x1={msToX(comp.tti)}
              y1={axisY - 2}
              x2={msToX(comp.tti)}
              y2={rowTop + 5 * rowH + 28}
            />
            <rect
              className="rmv-marker-tag is-tti"
              x={msToX(comp.tti) - 34}
              y={rowTop + 5 * rowH + 30}
              width={68}
              height={18}
              rx={4}
            />
            <text className="rmv-marker-t" x={msToX(comp.tti)} y={rowTop + 5 * rowH + 43} textAnchor="middle">
              {`TTI ${comp.tti}ms`}
            </text>
          </g>

          {/* ---- comparison: TTI per model ---- */}
          <text className="rmv-region-label" x={cmpBarX0} y={cmpTop - 12} textAnchor="start">
            time-to-interactive — all three
          </text>
          {ORDER.map((k, i) => {
            const c = COMPUTED[k];
            const ry = cmpTop + i * (cmpRowH + cmpGap);
            const bw = (c.tti / Math.max(1, MAX_TTI)) * cmpBarW;
            const isSel = k === model;
            return (
              <g key={`tti-${k}`}>
                <text className={`rmv-cmp-label ${isSel ? 'is-sel' : ''}`} x={cmpBarX0 - 10} y={ry + cmpRowH / 2 + 4} textAnchor="end">
                  {MODELS[k].label}
                </text>
                <rect className="rmv-cmp-track" x={cmpBarX0} y={ry} width={cmpBarW} height={cmpRowH} rx={5} />
                <rect className={`rmv-cmp-bar is-tti ${isSel ? 'is-sel' : ''}`} x={cmpBarX0} y={ry} width={Math.max(4, bw)} height={cmpRowH} rx={5} />
                <text className={`rmv-cmp-v ${isSel ? 'is-sel' : ''}`} x={cmpBarX0 + Math.max(4, bw) + 8} y={ry + cmpRowH / 2 + 4} textAnchor="start">
                  {`${c.tti}ms`}
                </text>
              </g>
            );
          })}

          {/* ---- comparison: JS shipped per model ---- */}
          <text className="rmv-region-label" x={cmpBarX0b} y={cmpTop - 12} textAnchor="start">
            JavaScript shipped — all three
          </text>
          {ORDER.map((k, i) => {
            const m = MODELS[k];
            const ry = cmpTop + i * (cmpRowH + cmpGap);
            const bw = (m.jsKB / Math.max(1, MAX_JS)) * cmpBarW;
            const isSel = k === model;
            return (
              <g key={`js-${k}`}>
                <text className={`rmv-cmp-label ${isSel ? 'is-sel' : ''}`} x={cmpBarX0b - 10} y={ry + cmpRowH / 2 + 4} textAnchor="end">
                  {m.label}
                </text>
                <rect className="rmv-cmp-track" x={cmpBarX0b} y={ry} width={cmpBarW} height={cmpRowH} rx={5} />
                <rect className={`rmv-cmp-bar is-js ${isSel ? 'is-sel' : ''}`} x={cmpBarX0b} y={ry} width={Math.max(4, bw)} height={cmpRowH} rx={5} />
                <text className={`rmv-cmp-v ${isSel ? 'is-sel' : ''}`} x={cmpBarX0b + Math.max(4, bw) + 8} y={ry + cmpRowH / 2 + 4} textAnchor="start">
                  {`${m.jsKB}KB`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rmv-metrics">
        <div className="rmv-metric">
          <span className="rmv-metric-label">model</span>
          <span className="rmv-metric-value">{active.label}</span>
        </div>
        <div className="rmv-metric">
          <span className="rmv-metric-label">first paint</span>
          <span className={`rmv-metric-value ${firstPaintReached ? 'is-ok' : ''}`}>{`${comp.firstPaint}ms`}</span>
        </div>
        <div className="rmv-metric">
          <span className="rmv-metric-label">time-to-interactive</span>
          <span className={`rmv-metric-value ${ttiReached ? 'is-ok' : ''}`}>{`${comp.tti}ms`}</span>
        </div>
        <div className="rmv-metric">
          <span className="rmv-metric-label">JS shipped</span>
          <span className={`rmv-metric-value ${active.jsKB <= 60 ? 'is-ok' : active.jsKB >= 200 ? 'is-warn' : ''}`}>{`${active.jsKB}KB`}</span>
        </div>
        <div className="rmv-metric">
          <span className="rmv-metric-label">bytes over wire</span>
          <span className="rmv-metric-value">{`${active.wireKB + active.jsKB}KB`}</span>
        </div>
        <div className="rmv-metric rmv-metric-dim">
          <span className="rmv-metric-label">server work</span>
          <span className="rmv-metric-value">{`${active.phases[0].ms}ms`}</span>
        </div>
      </div>

      <div className="rmv-narration">
        <span className={`rmv-narration-label ${active.jsKB <= 60 ? 'is-ok' : active.jsKB >= 200 ? 'is-warn' : ''}`}>
          {done ? `${active.label} done` : active.label}
        </span>
        <span className="rmv-narration-body">{narr}</span>
      </div>

      <div className="rmv-legend">
        <span className="rmv-legend-item"><Server size={13} className="rmv-ic is-server" /> server work</span>
        <span className="rmv-legend-item"><Wifi size={13} className="rmv-ic is-network" /> network transfer</span>
        <span className="rmv-legend-item"><Cpu size={13} className="rmv-ic is-jsexec" /> JS download + execute</span>
        <span className="rmv-legend-item"><Package size={13} className="rmv-ic is-hydrate" /> hydrate</span>
        <span className="rmv-legend-item"><MousePointerClick size={13} className="rmv-ic is-interactive" /> interactive</span>
        <span className="rmv-legend-item"><Eye size={13} className="rmv-ic is-paint" /> first paint</span>
        <span className="rmv-legend-item"><Zap size={13} className="rmv-ic is-tti" /> time-to-interactive</span>
      </div>
    </div>
  );
}
