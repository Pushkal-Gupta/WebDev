import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ApiVersioningViz.css';

const STRATEGIES = [
  { id: 'path', label: 'URL PATH', loc: 'path' },
  { id: 'header', label: 'HEADER', loc: 'header' },
  { id: 'query', label: 'QUERY PARAM', loc: 'query' },
];

const VERSIONS = [1, 2, 3];

// Response shapes per version. v1 -> v2 is a BREAKING split of `name`;
// v2 -> v3 is an ADDITIVE field. Old clients pinned to v1 keep the v1 shape.
const SHAPES = {
  1: { fields: ['id: 42', 'name: "Ada Lovelace"'], breaking: false },
  2: { fields: ['id: 42', 'firstName: "Ada"', 'lastName: "Lovelace"'], breaking: true },
  3: { fields: ['id: 42', 'firstName: "Ada"', 'lastName: "Lovelace"', 'email: "ada@x.io"'], breaking: false },
};

function requestLine(strategy, version) {
  if (strategy === 'path') return `GET /v${version}/users/42`;
  if (strategy === 'header') return 'GET /users/42  ·  Accept-Version: ' + version;
  return `GET /users/42?version=${version}`;
}

function locWord(strategy) {
  if (strategy === 'path') return 'the URL path segment /v{n}';
  if (strategy === 'header') return 'the Accept-Version header';
  return 'the ?version= query parameter';
}

// Pure: returns ordered snapshot frames for (strategy, version).
function buildFrames(strategy, version) {
  const frames = [];
  const shape = SHAPES[version];
  const req = requestLine(strategy, version);

  const snap = (extra) => ({
    strategy,
    version,
    req,
    stage: 'client',     // client | router | handler | response
    parsedVersion: null,
    readFrom: null,
    served: null,
    responseFields: [],
    note: '',
    ...extra,
  });

  frames.push(snap({
    stage: 'client',
    note: `A client sends "${req}". The version it wants (v${version}) is encoded in ${locWord(strategy)}.`,
  }));

  frames.push(snap({
    stage: 'router',
    readFrom: STRATEGIES.find((s) => s.id === strategy).loc,
    note: `The router inspects ${locWord(strategy)} to parse the requested version — it does not guess from the body.`,
  }));

  frames.push(snap({
    stage: 'router',
    readFrom: STRATEGIES.find((s) => s.id === strategy).loc,
    parsedVersion: version,
    note: `Parsed version = v${version}. The router will dispatch to v${version}Handler; every other handler stays untouched.`,
  }));

  frames.push(snap({
    stage: 'handler',
    parsedVersion: version,
    readFrom: STRATEGIES.find((s) => s.id === strategy).loc,
    served: version,
    note: `v${version}Handler runs. It owns the v${version} contract, so it builds exactly the shape v${version} clients expect — older handlers are frozen.`,
  }));

  const breakNote = version === 1
    ? 'v1 returns a single `name` string. This is the original contract; clients pinned here never see the later split.'
    : version === 2
      ? 'BREAKING vs v1: `name` is split into `firstName` + `lastName`. A v1 client reading `name` would break — which is exactly why v1 stays separate.'
      : 'ADDITIVE vs v2: `email` is added, but firstName/lastName are unchanged. v2 clients ignore the new field and keep working.';

  frames.push(snap({
    stage: 'response',
    parsedVersion: version,
    readFrom: STRATEGIES.find((s) => s.id === strategy).loc,
    served: version,
    responseFields: shape.fields,
    note: `Response returned to the client. ${breakNote}`,
  }));

  frames.push(snap({
    stage: 'response',
    parsedVersion: version,
    readFrom: STRATEGIES.find((s) => s.id === strategy).loc,
    served: version,
    responseFields: shape.fields,
    note: `Done. Strategy=${strategy}, parsed from ${locWord(strategy)}, served by v${version}Handler. A client pinned to v1 still gets { id, name } no matter how far v2/v3 evolve — versioning shields it from the breaking split.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function ApiVersioningViz() {
  const [strategy, setStrategy] = useState('path');
  const [version, setVersion] = useState(2);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(strategy, version), [strategy, version]);
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

  const switchStrategy = (id) => {
    if (id === strategy) return;
    setIsRunning(false);
    setStep(0);
    setStrategy(id);
  };

  const switchVersion = (v) => {
    if (v === version) return;
    setIsRunning(false);
    setStep(0);
    setVersion(v);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 430;

  const clientX = 30;
  const clientY = 150;
  const boxW = 150;
  const boxH = 90;

  const routerX = 320;
  const routerY = 130;
  const routerW = 200;
  const routerH = 130;

  const handlerX = 600;
  const handlerW = 150;
  const handlerH = 56;
  const handlerGap = 16;
  const handlerTop = 80;
  const handlerY = (i) => handlerTop + i * (handlerH + handlerGap);

  const respX = 600;
  const respY = 290;
  const respW = W - respX - 30;
  const respH = 118;

  const stageOrder = ['client', 'router', 'handler', 'response'];
  const stageIdx = stageOrder.indexOf(current.stage);

  const accentForVersion = (v) => (v === 1 ? 'var(--hue-sky)' : v === 2 ? 'var(--hue-pink)' : 'var(--hue-mint)');

  const locActive = (loc) => current.readFrom === loc;

  return (
    <div className="avv">
      <div className="avv-head">
        <h3 className="avv-title">API versioning — routing a request to the right handler</h3>
        <p className="avv-sub">
          Pick where the version lives — path, header, or query — then step a request through the router to the
          matching handler. Watch the response shape change, and see how a v1 client is shielded from the v1-&gt;v2
          breaking split.
        </p>
      </div>

      <div className="avv-controls">
        <div className="avv-modes" role="tablist" aria-label="Versioning strategy">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`avv-mode ${strategy === s.id ? 'is-on' : ''}`}
              onClick={() => switchStrategy(s.id)}
              aria-pressed={strategy === s.id}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="avv-versions" role="tablist" aria-label="Requested version">
          {VERSIONS.map((v) => (
            <button
              key={`ver-${v}`}
              type="button"
              className={`avv-ver ${version === v ? 'is-on' : ''}`}
              onClick={() => switchVersion(v)}
              aria-pressed={version === v}
            >
              v{v}
            </button>
          ))}
        </div>

        <label className="avv-speed">
          <span className="avv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="avv-speed-range"
            aria-label="Playback speed"
          />
          <span className="avv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="avv-spacer" aria-hidden="true" />

        <div className="avv-buttons">
          <button
            type="button"
            className="avv-btn avv-btn-primary"
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
            className="avv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="avv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="avv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="avv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="avv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="avv-svg" preserveAspectRatio="xMidYMid meet">
          {/* flow arrows light up as the request advances */}
          <line
            className={`avv-flow ${stageIdx >= 1 ? 'is-on' : ''}`}
            x1={clientX + boxW}
            y1={clientY + boxH / 2}
            x2={routerX}
            y2={routerY + routerH / 2}
            markerEnd="url(#avv-arrow)"
          />
          <line
            className={`avv-flow ${stageIdx >= 2 ? 'is-on' : ''}`}
            x1={routerX + routerW}
            y1={routerY + routerH / 2}
            x2={handlerX}
            y2={handlerY(current.served ? current.served - 1 : 1) + handlerH / 2}
            markerEnd="url(#avv-arrow)"
          />
          <line
            className={`avv-flow ${stageIdx >= 3 ? 'is-on' : ''}`}
            x1={handlerX + handlerW / 2}
            y1={current.served ? handlerY(current.served - 1) + handlerH : handlerTop}
            x2={respX + respW / 2}
            y2={respY}
            markerEnd="url(#avv-arrow)"
          />

          <defs>
            <marker id="avv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="avv-arrowhead" />
            </marker>
          </defs>

          {/* client */}
          <rect
            className={`avv-box ${current.stage === 'client' ? 'is-active' : ''}`}
            x={clientX}
            y={clientY}
            width={boxW}
            height={boxH}
            rx={9}
          />
          <text className="avv-box-title" x={clientX + boxW / 2} y={clientY + 22}>Client</text>
          <text className="avv-req" x={clientX + boxW / 2} y={clientY + 46}>{current.req}</text>
          <text className="avv-box-sub" x={clientX + boxW / 2} y={clientY + 70}>wants v{current.version}</text>

          {/* router */}
          <rect
            className={`avv-box ${current.stage === 'router' ? 'is-active' : ''}`}
            x={routerX}
            y={routerY}
            width={routerW}
            height={routerH}
            rx={9}
          />
          <text className="avv-box-title" x={routerX + routerW / 2} y={routerY + 24}>Router / dispatch</text>

          {/* the three read locations; the active one highlights */}
          {[
            { loc: 'path', label: 'path' },
            { loc: 'header', label: 'header' },
            { loc: 'query', label: 'query' },
          ].map((l, li) => (
            <g key={`loc-${l.loc}`}>
              <rect
                className={`avv-loc ${locActive(l.loc) ? 'is-read' : ''}`}
                x={routerX + 14 + li * 58}
                y={routerY + 38}
                width={52}
                height={26}
                rx={5}
              />
              <text className="avv-loc-text" x={routerX + 14 + li * 58 + 26} y={routerY + 55}>{l.label}</text>
            </g>
          ))}

          <text className="avv-router-parsed" x={routerX + routerW / 2} y={routerY + 92}>
            {current.parsedVersion ? `parsed: v${current.parsedVersion}` : 'parsing…'}
          </text>
          <text className="avv-box-sub" x={routerX + routerW / 2} y={routerY + 112}>
            {current.readFrom ? `read from ${current.readFrom}` : 'inspecting request'}
          </text>

          {/* handlers */}
          {VERSIONS.map((v, vi) => {
            const active = current.served === v;
            const y = handlerY(vi);
            return (
              <g key={`handler-${v}`}>
                <rect
                  className={`avv-handler ${active ? 'is-active' : ''}`}
                  x={handlerX}
                  y={y}
                  width={handlerW}
                  height={handlerH}
                  rx={8}
                  style={active ? { stroke: accentForVersion(v) } : undefined}
                />
                <rect x={handlerX} y={y} width={5} height={handlerH} rx={2.5} fill={accentForVersion(v)} opacity={active ? 1 : 0.5} />
                <text className="avv-handler-title" x={handlerX + handlerW / 2} y={y + 24}>v{v}Handler</text>
                <text className="avv-handler-sub" x={handlerX + handlerW / 2} y={y + 42}>
                  {v === 1 ? '{ id, name }' : v === 2 ? '{ id, first, last }' : '{ …, email }'}
                </text>
              </g>
            );
          })}

          {/* breaking boundary marker between v1 and v2 */}
          <g>
            <line
              className="avv-break-line"
              x1={handlerX - 8}
              y1={handlerY(1) - handlerGap / 2}
              x2={handlerX + handlerW + 8}
              y2={handlerY(1) - handlerGap / 2}
            />
            <text className="avv-break-text" x={handlerX + handlerW + 14} y={handlerY(1) - handlerGap / 2 + 4} textAnchor="start">
              BREAKING
            </text>
          </g>
          <text className="avv-additive-text" x={handlerX + handlerW + 14} y={handlerY(2) - handlerGap / 2 + 4} textAnchor="start">
            additive
          </text>

          {/* response panel — JSON lines that wrap, never scroll */}
          <rect
            className={`avv-box avv-resp ${current.stage === 'response' ? 'is-active' : ''}`}
            x={respX}
            y={respY}
            width={respW}
            height={respH}
            rx={9}
          />
          <text className="avv-resp-title" x={respX + 12} y={respY + 20}>
            response · v{current.served || current.version}
          </text>
          {current.responseFields.length === 0 ? (
            <text className="avv-resp-empty" x={respX + respW / 2} y={respY + respH / 2 + 10}>awaiting handler…</text>
          ) : (
            <>
              <text className="avv-resp-brace" x={respX + 12} y={respY + 40}>{'{'}</text>
              {current.responseFields.map((f, fi) => {
                const broken = current.served === 2 && (f.startsWith('firstName') || f.startsWith('lastName'));
                const added = current.served === 3 && f.startsWith('email');
                return (
                  <text
                    key={`rf-${fi}`}
                    className={`avv-resp-field ${broken ? 'is-broken' : ''} ${added ? 'is-added' : ''}`}
                    x={respX + 26}
                    y={respY + 58 + fi * 16}
                  >
                    {f}
                    {fi < current.responseFields.length - 1 ? ',' : ''}
                  </text>
                );
              })}
              <text className="avv-resp-brace" x={respX + 12} y={respY + 58 + current.responseFields.length * 16}>{'}'}</text>
            </>
          )}
        </svg>
      </div>

      <div className="avv-metrics">
        <div className="avv-metric">
          <span className="avv-metric-label">strategy</span>
          <span className="avv-metric-value">{strategy}</span>
        </div>
        <div className="avv-metric">
          <span className="avv-metric-label">read from</span>
          <span className="avv-metric-value">{current.readFrom || '—'}</span>
        </div>
        <div className="avv-metric">
          <span className="avv-metric-label">parsed version</span>
          <span className="avv-metric-value">{current.parsedVersion ? `v${current.parsedVersion}` : '—'}</span>
        </div>
        <div className="avv-metric">
          <span className="avv-metric-label">served by</span>
          <span className="avv-metric-value is-served">{current.served ? `v${current.served}Handler` : '—'}</span>
        </div>
        <div className="avv-metric">
          <span className="avv-metric-label">change vs prev</span>
          <span className={`avv-metric-value ${current.version === 2 ? 'is-broken' : current.version === 3 ? 'is-added' : ''}`}>
            {current.version === 1 ? 'baseline' : current.version === 2 ? 'BREAKING' : 'additive'}
          </span>
        </div>
      </div>

      <div className="avv-narration">
        <span className="avv-narration-label">trace</span>
        <span className="avv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
