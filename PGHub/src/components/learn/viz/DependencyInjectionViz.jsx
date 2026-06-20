import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Boxes, Database, Mail, Wrench } from 'lucide-react';
import './DependencyInjectionViz.css';

const MODES = [
  { id: 'hardwired', label: 'HARD-WIRED' },
  { id: 'injected', label: 'INJECTED' },
];

const DB_IMPLS = [
  { id: 'postgres', label: 'PostgresDB', kind: 'real', ctor: 'new PostgresDB()' },
  { id: 'mock', label: 'MockDB', kind: 'test', ctor: 'new MockDB()' },
];

const MAILER_IMPLS = [
  { id: 'smtp', label: 'SmtpMailer', kind: 'real', ctor: 'new SmtpMailer()' },
  { id: 'fake', label: 'FakeMailer', kind: 'test', ctor: 'new FakeMailer()' },
];

const dbOf = (id) => DB_IMPLS.find((d) => d.id === id);
const mailerOf = (id) => MAILER_IMPLS.find((m) => m.id === id);

function buildFrames(mode, dbId, mailerId) {
  const db = dbOf(dbId);
  const mailer = mailerOf(mailerId);
  const frames = [];

  const snap = (extra) => ({
    active: null,
    boundDb: null,
    boundMailer: null,
    serviceRunning: false,
    filesChanged: 0,
    note: '',
    swapNote: '',
    ...extra,
  });

  if (mode === 'hardwired') {
    frames.push(snap({
      note: 'OrderService needs a Database and a Mailer. In the hard-wired design it will build them itself, with `new` calls hidden inside its own constructor.',
      swapNote: 'No swap point yet — the dependencies live inside the class.',
    }));
    frames.push(snap({
      active: 'service',
      note: 'OrderService is the only box. There is no interface boundary — it reaches straight for concrete classes by name.',
      swapNote: 'OrderService hard-codes which classes it uses.',
    }));
    frames.push(snap({
      active: 'newDb',
      boundDb: db.id,
      note: `Inside OrderService's constructor: \`this.db = ${db.ctor};\`. The construction arrow starts INSIDE the box — the class owns this decision.`,
      swapNote: `DB is wired to ${db.label} from within OrderService.`,
    }));
    frames.push(snap({
      active: 'newMailer',
      boundDb: db.id,
      boundMailer: mailer.id,
      note: `Same constructor: \`this.mailer = ${mailer.ctor};\`. Both concrete dependencies are now baked into the class body.`,
      swapNote: `Mailer is wired to ${mailer.label} from within OrderService.`,
    }));
    frames.push(snap({
      active: 'run',
      boundDb: db.id,
      boundMailer: mailer.id,
      serviceRunning: true,
      note: `placeOrder() runs: it calls this.db.save(order) on ${db.label} and this.mailer.send(receipt) on ${mailer.label}. Works — but the wiring is frozen.`,
      swapNote: `Running against ${db.label} + ${mailer.label}.`,
    }));
    frames.push(snap({
      active: 'swap',
      boundDb: db.id,
      boundMailer: mailer.id,
      serviceRunning: true,
      filesChanged: 1,
      note: `Now swap DB for a test double. There is no seam: you must open OrderService.java and edit the constructor line \`new PostgresDB()\` -> \`new MockDB()\`. The class itself changes and recompiles.`,
      swapNote: 'Swap DB: must EDIT OrderService source (replace new PostgresDB with new MockDB). Class recompiles. Tests can no longer use the real class as written.',
    }));
    return frames;
  }

  frames.push(snap({
    note: 'OrderService declares it needs a Database and a Mailer — but only as INTERFACES, never naming a concrete class. Something outside will supply them.',
    swapNote: 'OrderService depends on abstractions, not implementations.',
  }));
  frames.push(snap({
    active: 'interfaces',
    note: 'Two interfaces define the contract: Database (save) and Mailer (send). OrderService is written against these contracts only.',
    swapNote: 'Database + Mailer interfaces are the swap seam.',
  }));
  frames.push(snap({
    active: 'construct',
    boundDb: db.id,
    boundMailer: mailer.id,
    note: `The Container (composition root) constructs the concrete objects: \`${db.ctor}\` and \`${mailer.ctor}\`. This is the ONE place that knows real class names.`,
    swapNote: `Container built ${db.label} + ${mailer.label}.`,
  }));
  frames.push(snap({
    active: 'wire',
    boundDb: db.id,
    boundMailer: mailer.id,
    note: `The Container passes them into the constructor: \`new OrderService(${db.label.toLowerCase()}, ${mailer.label.toLowerCase()})\`. The active binding arrow points to the chosen impl; the other is dimmed.`,
    swapNote: `Wired: Database -> ${db.label}, Mailer -> ${mailer.label}.`,
  }));
  frames.push(snap({
    active: 'run',
    boundDb: db.id,
    boundMailer: mailer.id,
    serviceRunning: true,
    note: `placeOrder() runs against whatever was injected — it calls db.save / mailer.send through the interface, never knowing it talks to ${db.label} or ${mailer.label}.`,
    swapNote: `Running against ${db.label} + ${mailer.label} via interfaces.`,
  }));
  frames.push(snap({
    active: 'swap',
    boundDb: db.id,
    boundMailer: mailer.id,
    serviceRunning: true,
    filesChanged: 1,
    note: 'Now swap DB for a test double. Change ONE line in the Container: `new PostgresDB()` -> `new MockDB()`. OrderService is never opened, never recompiled — it just receives a different object that honours the same interface.',
    swapNote: 'Swap DB: change 1 line in Container (new MockDB()). OrderService untouched. Tests inject MockDB freely.',
  }));
  return frames;
}

export default function DependencyInjectionViz() {
  const [mode, setMode] = useState('hardwired');
  const [dbImpl, setDbImpl] = useState('postgres');
  const [mailerImpl, setMailerImpl] = useState('smtp');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(mode, dbImpl, mailerImpl),
    [mode, dbImpl, mailerImpl],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const changeImpl = (setter, value) => {
    setIsRunning(false);
    setStep(0);
    setter(value);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const db = dbOf(dbImpl);
  const mailer = mailerOf(mailerImpl);
  const injected = mode === 'injected';

  // SVG geometry
  const W = 940;
  const H = 470;

  // node coordinates
  const svcX = 360;
  const svcY = injected ? 168 : 60;
  const svcW = 220;
  const svcH = 96;

  const contX = 360;
  const contY = 24;
  const contW = 220;
  const contH = 56;

  // implementation boxes (bottom row)
  const implW = 168;
  const implH = 78;
  const implY = 330;
  const dbRealX = 78;
  const dbMockX = 78 + implW + 28;
  const mlRealX = W - 78 - implW - (implW + 28);
  const mlFakeX = W - 78 - implW;

  const isActive = (k) => current.active === k;

  const edgeCls = (on) => `dij-edge ${on ? 'is-active' : ''}`;
  const implCls = (kind, chosen, dimmed) => [
    'dij-node', 'dij-impl',
    kind === 'real' ? 'is-real' : 'is-test',
    chosen ? 'is-chosen' : '',
    dimmed ? 'is-dim' : '',
  ].filter(Boolean).join(' ');

  // active binding line endpoints
  const dbChosenX = dbImpl === 'postgres' ? dbRealX + implW / 2 : dbMockX + implW / 2;
  const mlChosenX = mailerImpl === 'smtp' ? mlRealX + implW / 2 : mlFakeX + implW / 2;
  const dbSourceX = injected ? contX + 50 : svcX + 55;
  const mlSourceX = injected ? contX + contW - 50 : svcX + svcW - 55;
  const sourceY = injected ? contY + contH : svcY + svcH;

  const dbWired = current.boundDb != null;
  const mlWired = current.boundMailer != null;

  return (
    <div className="dij">
      <div className="dij-head">
        <h3 className="dij-title">Dependency injection — who builds the dependencies?</h3>
        <p className="dij-sub">
          Step the same OrderService through two wiring styles. Hard-wired: the class builds its own concrete
          dependencies with new. Injected: a container builds them and passes them in through interfaces. Then
          try to swap the database for a test double and watch how much code has to change.
        </p>
      </div>

      <div className="dij-controls">
        <div className="dij-modes" role="tablist" aria-label="Wiring mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`dij-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="dij-select">
          <span className="dij-input-label">database</span>
          <select
            className="dij-dropdown"
            value={dbImpl}
            onChange={(e) => changeImpl(setDbImpl, e.target.value)}
            aria-label="Database implementation"
          >
            <option value="postgres">PostgresDB (real)</option>
            <option value="mock">MockDB (test)</option>
          </select>
        </label>

        <label className="dij-select">
          <span className="dij-input-label">mailer</span>
          <select
            className="dij-dropdown"
            value={mailerImpl}
            onChange={(e) => changeImpl(setMailerImpl, e.target.value)}
            aria-label="Mailer implementation"
          >
            <option value="smtp">SmtpMailer (real)</option>
            <option value="fake">FakeMailer (test)</option>
          </select>
        </label>

        <label className="dij-slider">
          <span className="dij-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dij-range" aria-label="Playback speed"
          />
          <span className="dij-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="dij-spacer" aria-hidden="true" />

        <div className="dij-buttons">
          <button
            type="button"
            className="dij-btn dij-btn-primary"
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
            className="dij-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dij-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dij-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="dij-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dij-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dij-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dij-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path className="dij-arrow-head" d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
            <marker id="dij-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path className="dij-arrow-head is-active" d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>

          {/* Container box (injected mode only) */}
          {injected && (
            <g>
              <rect
                className={`dij-node dij-container ${isActive('construct') || isActive('wire') ? 'is-active' : ''}`}
                x={contX} y={contY} width={contW} height={contH} rx={10}
              />
              <text className="dij-node-title" x={contX + 26} y={contY + 24}>Container</text>
              <text className="dij-node-sub" x={contX + 26} y={contY + 42}>composition root</text>
              <Boxes x={contX + contW - 34} y={contY + 16} width={22} height={22} className="dij-icon" />
              {/* container -> service wire */}
              <line
                className={edgeCls(isActive('wire') || isActive('construct') || isActive('run'))}
                x1={contX + contW / 2} y1={contY + contH}
                x2={svcX + svcW / 2} y2={svcY}
                markerEnd={`url(#${isActive('wire') ? 'dij-arrow-on' : 'dij-arrow'})`}
              />
              <text className="dij-edge-label" x={contX + contW / 2 + 96} y={svcY - 8}>injects deps</text>
            </g>
          )}

          {/* interfaces row (injected mode) */}
          {injected && (
            <g>
              <rect
                className={`dij-node dij-iface ${isActive('interfaces') ? 'is-active' : ''}`}
                x={svcX - 150} y={svcY + 4} width={120} height={40} rx={8}
              />
              <text className="dij-iface-title" x={svcX - 150 + 60} y={svcY + 22}>«interface»</text>
              <text className="dij-iface-name" x={svcX - 150 + 60} y={svcY + 37}>Database</text>

              <rect
                className={`dij-node dij-iface ${isActive('interfaces') ? 'is-active' : ''}`}
                x={svcX + svcW + 30} y={svcY + 4} width={120} height={40} rx={8}
              />
              <text className="dij-iface-title" x={svcX + svcW + 30 + 60} y={svcY + 22}>«interface»</text>
              <text className="dij-iface-name" x={svcX + svcW + 30 + 60} y={svcY + 37}>Mailer</text>
            </g>
          )}

          {/* OrderService box */}
          <g>
            <rect
              className={`dij-node dij-service ${current.serviceRunning ? 'is-running' : ''} ${isActive('service') || isActive('run') ? 'is-active' : ''} ${isActive('swap') && !injected ? 'is-edit' : ''}`}
              x={svcX} y={svcY} width={svcW} height={svcH} rx={10}
            />
            <text className="dij-node-title" x={svcX + 16} y={svcY + 26}>OrderService</text>
            <text className="dij-node-sub" x={svcX + 16} y={svcY + 44}>
              {injected ? 'needs Database, Mailer' : 'builds its own deps'}
            </text>

            {/* hard-wired: show the new X() lines INSIDE the box */}
            {!injected && (
              <>
                <text
                  className={`dij-code-line ${isActive('newDb') ? 'is-active' : ''} ${isActive('swap') ? 'is-edit' : ''}`}
                  x={svcX + 16} y={svcY + 66}
                >
                  this.db = {db.ctor};
                </text>
                <text
                  className={`dij-code-line ${isActive('newMailer') ? 'is-active' : ''}`}
                  x={svcX + 16} y={svcY + 84}
                >
                  this.mailer = {mailer.ctor};
                </text>
              </>
            )}
            {injected && (
              <text className="dij-code-line is-clean" x={svcX + 16} y={svcY + 70}>
                placeOrder() {'{'} db.save(); mailer.send(); {'}'}
              </text>
            )}
          </g>

          {/* RUN badge */}
          {current.serviceRunning && (
            <text className="dij-run-badge" x={svcX + svcW / 2} y={svcY - 10}>placeOrder() running</text>
          )}

          {/* edit warning for hard-wired swap */}
          {isActive('swap') && !injected && (
            <text className="dij-edit-warn" x={svcX + svcW / 2} y={svcY - 10}>EDITING CLASS SOURCE</text>
          )}

          {/* Implementation boxes */}
          {/* DB real */}
          <g>
            <rect
              className={implCls('real', dbImpl === 'postgres', dbWired && dbImpl !== 'postgres')}
              x={dbRealX} y={implY} width={implW} height={implH} rx={10}
            />
            <Database x={dbRealX + 14} y={implY + 14} width={20} height={20} className="dij-icon" />
            <text className="dij-impl-title" x={dbRealX + implW / 2 + 12} y={implY + 30}>PostgresDB</text>
            <text className="dij-impl-sub" x={dbRealX + implW / 2 + 12} y={implY + 50}>real database</text>
            <text className="dij-impl-tag is-real" x={dbRealX + implW / 2} y={implY + 68}>implements Database</text>
          </g>
          {/* DB mock */}
          <g>
            <rect
              className={implCls('test', dbImpl === 'mock', dbWired && dbImpl !== 'mock')}
              x={dbMockX} y={implY} width={implW} height={implH} rx={10}
            />
            <Database x={dbMockX + 14} y={implY + 14} width={20} height={20} className="dij-icon" />
            <text className="dij-impl-title" x={dbMockX + implW / 2 + 12} y={implY + 30}>MockDB</text>
            <text className="dij-impl-sub" x={dbMockX + implW / 2 + 12} y={implY + 50}>in-memory test</text>
            <text className="dij-impl-tag is-test" x={dbMockX + implW / 2} y={implY + 68}>implements Database</text>
          </g>
          {/* Mailer real */}
          <g>
            <rect
              className={implCls('real', mailerImpl === 'smtp', mlWired && mailerImpl !== 'smtp')}
              x={mlRealX} y={implY} width={implW} height={implH} rx={10}
            />
            <Mail x={mlRealX + 14} y={implY + 14} width={20} height={20} className="dij-icon" />
            <text className="dij-impl-title" x={mlRealX + implW / 2 + 12} y={implY + 30}>SmtpMailer</text>
            <text className="dij-impl-sub" x={mlRealX + implW / 2 + 12} y={implY + 50}>sends real email</text>
            <text className="dij-impl-tag is-real" x={mlRealX + implW / 2} y={implY + 68}>implements Mailer</text>
          </g>
          {/* Mailer fake */}
          <g>
            <rect
              className={implCls('test', mailerImpl === 'fake', mlWired && mailerImpl !== 'fake')}
              x={mlFakeX} y={implY} width={implW} height={implH} rx={10}
            />
            <Mail x={mlFakeX + 14} y={implY + 14} width={20} height={20} className="dij-icon" />
            <text className="dij-impl-title" x={mlFakeX + implW / 2 + 12} y={implY + 30}>FakeMailer</text>
            <text className="dij-impl-sub" x={mlFakeX + implW / 2 + 12} y={implY + 50}>captures in test</text>
            <text className="dij-impl-tag is-test" x={mlFakeX + implW / 2} y={implY + 68}>implements Mailer</text>
          </g>

          {/* binding lines: source -> chosen impl */}
          {dbWired && (
            <line
              className={edgeCls(isActive('newDb') || isActive('construct') || isActive('wire') || isActive('run') || isActive('swap'))}
              x1={dbSourceX} y1={sourceY}
              x2={dbChosenX} y2={implY}
              markerEnd={`url(#${isActive('newDb') || isActive('wire') ? 'dij-arrow-on' : 'dij-arrow'})`}
            />
          )}
          {mlWired && (
            <line
              className={edgeCls(isActive('newMailer') || isActive('construct') || isActive('wire') || isActive('run') || isActive('swap'))}
              x1={mlSourceX} y1={sourceY}
              x2={mlChosenX} y2={implY}
              markerEnd={`url(#${isActive('newMailer') || isActive('wire') ? 'dij-arrow-on' : 'dij-arrow'})`}
            />
          )}
        </svg>
      </div>

      <div className="dij-swap">
        <span className="dij-swap-label">
          <Wrench size={13} /> what gets swapped
        </span>
        <span className={`dij-swap-body ${injected ? 'is-good' : 'is-bad'}`}>{current.swapNote}</span>
      </div>

      <div className="dij-metrics">
        <div className="dij-metric">
          <span className="dij-metric-label">mode</span>
          <span className="dij-metric-value">{injected ? 'injected' : 'hard-wired'}</span>
        </div>
        <div className="dij-metric">
          <span className="dij-metric-label">DB impl</span>
          <span className={`dij-metric-value ${db.kind === 'test' ? 'is-test' : 'is-real'}`}>{db.label}</span>
        </div>
        <div className="dij-metric">
          <span className="dij-metric-label">Mailer impl</span>
          <span className={`dij-metric-value ${mailer.kind === 'test' ? 'is-test' : 'is-real'}`}>{mailer.label}</span>
        </div>
        <div className="dij-metric">
          <span className="dij-metric-label">files changed to swap</span>
          <span className={`dij-metric-value ${injected ? 'is-good' : 'is-bad'}`}>
            {current.filesChanged === 0 ? '—' : (injected ? '1 (Container)' : '1+ (incl. OrderService)')}
          </span>
        </div>
      </div>

      <div className="dij-narration">
        <span className="dij-narration-label">trace</span>
        <span className="dij-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
