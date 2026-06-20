import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Box, Boxes, ScrollText, ShieldCheck, RefreshCw, ArrowLeftRight,
  Check, AlertTriangle, Layers,
} from 'lucide-react';
import './SidecarPatternViz.css';

// Sidecar pattern — a main APP container and a SIDECAR container share one pod.
// Cross-cutting concerns (TLS/auth proxy, log shipping, config sync) live in the
// sidecar, so the app stays focused on business logic and never re-implements them.
//
// TWO MODES:
//   sidecar  — concerns run in the sidecar. A request enters, the sidecar adds
//              TLS + auth, then forwards to the lean app. The app emits logs the
//              sidecar ships to a backend; the sidecar syncs config into a shared
//              volume the app reads. Swap the sidecar and the app is untouched.
//   baked    — the SAME concerns are compiled into the app itself. No sidecar, so
//              the app box bloats with proxy + logging + config code. Every app
//              must re-implement it, and changing any concern means redeploying
//              the whole app.
//
// Interactive: toggle which concern is highlighted (logging / proxy / config),
// flip between sidecar and baked-in to compare the app-code surface and the
// deploys-to-change-X tradeoff, then step or play the request/log/config flow.

const CONCERNS = [
  { key: 'proxy', label: 'Proxy / TLS', sub: 'TLS + auth', icon: ShieldCheck, hue: 'hue-sky' },
  { key: 'logging', label: 'Logging', sub: 'ship logs', icon: ScrollText, hue: 'hue-violet' },
  { key: 'config', label: 'Config sync', sub: 'pull config', icon: RefreshCw, hue: 'hue-mint' },
];
const CONCERN_KEYS = CONCERNS.map((c) => c.key);

function snapBase(mode, focus, extra) {
  return {
    mode,
    focus,
    // which element is lit this frame
    inbound: false, // request hitting the boundary
    tls: false, // sidecar adding tls/auth
    forward: false, // sidecar -> app
    appWork: false, // app handling business logic
    logOut: false, // app -> log path
    logShip: false, // log path -> backend
    configPull: false, // config source -> sync
    configWrite: false, // sync -> shared volume
    appReadConfig: false, // app reads volume
    phase: 'idle',
    note: '',
    ...extra,
  };
}

function buildSidecarFrames(focus) {
  const frames = [];
  const f = CONCERNS.find((c) => c.key === focus).label;

  frames.push(snapBase('sidecar', focus, {
    phase: 'setup',
    note: `One pod, two containers. The app holds only business logic; the sidecar holds the cross-cutting concerns (${CONCERNS.map((c) => c.label.toLowerCase()).join(', ')}). They share the pod network and a config volume, so the sidecar can wrap the app without the app knowing it exists. Focus is on ${f}.`,
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'inbound',
    inbound: true,
    note: 'A client request arrives at the pod. It does NOT hit the app directly — the sidecar owns the network boundary, so the request lands on the proxy first.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'proxy',
    tls: true,
    note: 'The sidecar terminates TLS and checks auth. The app never wrote a line of TLS or token-validation code — that concern is fully delegated. Every app in the fleet gets the same proxy by mounting the same sidecar.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'forward',
    forward: true,
    note: 'The sidecar forwards the now-verified request over plain localhost to the app. From the app\'s view it is just an unencrypted in-pod call — simple, no security code required.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'appwork',
    appWork: true,
    note: 'The app runs pure business logic and returns a response. Its code surface stays LEAN: handlers and domain rules, nothing else.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'log',
    logOut: true,
    note: 'The app emits plain log lines to stdout — it does not know where they go. The sidecar tails them.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'ship',
    logShip: true,
    note: 'The logging sidecar batches and ships those lines to the log backend. Change the log format or destination by swapping the sidecar image — the app is never rebuilt.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'configpull',
    configPull: true,
    note: 'On a timer, the config sidecar pulls the latest config from the source (a config server or git repo). The app has no client for that source.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'configwrite',
    configWrite: true,
    note: 'The sidecar writes the fresh config into the shared volume both containers mount. This is the only contact point — a file, not an API the app must speak.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'configread',
    appReadConfig: true,
    appWork: true,
    note: 'The app simply reads a local file from the shared volume. Config delivery, retries, and source auth all stayed in the sidecar. Separation of concerns achieved without changing the app.',
  }));

  frames.push(snapBase('sidecar', focus, {
    phase: 'done',
    note: 'Cycle complete. The app shipped business logic only; the sidecar carried proxy, logging, and config. To change any concern you redeploy ONE sidecar, and every app that mounts it inherits the change untouched.',
  }));

  return frames;
}

function buildBakedFrames(focus) {
  const frames = [];

  frames.push(snapBase('baked', focus, {
    phase: 'setup',
    note: 'No sidecar this time. The same three concerns are compiled straight into the app. The app box now carries business logic PLUS a TLS/auth library, a log shipper, and a config-source client — it has bloated.',
  }));

  frames.push(snapBase('baked', focus, {
    phase: 'inbound',
    inbound: true,
    note: 'The request hits the app directly — the app is the network boundary now, so it owns TLS itself.',
  }));

  frames.push(snapBase('baked', focus, {
    phase: 'proxy',
    tls: true,
    appWork: true,
    note: 'The app terminates TLS and validates auth INSIDE its own process. This security code lives in this app and must be copy-pasted into every other service that needs it.',
  }));

  frames.push(snapBase('baked', focus, {
    phase: 'appwork',
    appWork: true,
    note: 'Business logic runs, tangled in the same process as the cross-cutting code. The lean core is now buried under infrastructure plumbing.',
  }));

  frames.push(snapBase('baked', focus, {
    phase: 'ship',
    appWork: true,
    logShip: true,
    note: 'The app itself batches and ships logs to the backend — the log-shipper library is a dependency it compiles and maintains. Change the log destination and you rebuild and redeploy this app.',
  }));

  frames.push(snapBase('baked', focus, {
    phase: 'configpull',
    appWork: true,
    configPull: true,
    note: 'The app polls the config source through an embedded client, handling retries and source auth on its own. More dependencies, more code paths to test.',
  }));

  frames.push(snapBase('baked', focus, {
    phase: 'done',
    note: 'Cycle complete, but the cost is visible: the app re-implements every concern, every other service must do the same, and changing logging or TLS means a full app rebuild and redeploy. That is the bloat the sidecar avoids.',
  }));

  return frames;
}

const PHASE_LABEL = {
  setup: 'setup',
  inbound: 'inbound',
  proxy: 'proxy / TLS',
  forward: 'forward',
  appwork: 'business logic',
  log: 'app logs',
  ship: 'ship logs',
  configpull: 'pull config',
  configwrite: 'write volume',
  configread: 'app reads config',
  done: 'done',
};

const RUN_DELAY_MS = 1500;

export default function SidecarPatternViz() {
  const [mode, setMode] = useState('sidecar');
  const [focus, setFocus] = useState('proxy');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'baked' ? buildBakedFrames(focus) : buildSidecarFrames(focus)),
    [mode, focus],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  const reset = () => { setIsRunning(false); setStep(0); };

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const switchFocus = (k) => {
    if (k === focus) return;
    setIsRunning(false);
    setStep(0);
    setFocus(k);
  };

  const isSidecar = mode === 'sidecar';
  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- SVG geometry ----
  const W = 960;
  const H = 420;

  // pod boundary
  const podX = 250;
  const podY = 70;
  const podW = 470;
  const podH = 250;

  // app box (left in pod)
  const appX = podX + 26;
  const appY = podY + 60;
  const appW = isSidecar ? 200 : 280;
  const appH = isSidecar ? 130 : 170;

  // sidecar box (right in pod)
  const carX = appX + appW + 26;
  const carY = appY;
  const carW = 200;
  const carH = 130;

  // external nodes
  const clientX = 70;
  const clientY = podY + 90;
  const clientW = 130;
  const clientH = 56;

  const logBackX = podX + podW + 40;
  const logBackY = podY + 30;
  const logBackW = 160;
  const logBackH = 54;

  const configX = podX + podW + 40;
  const configY = podY + 150;
  const configW = 160;
  const configH = 54;

  // shared volume (bottom of pod)
  const volX = appX;
  const volY = podY + podH - 56;
  const volW = isSidecar ? carX + carW - appX : appW;
  const volH = 34;

  const focusMeta = CONCERNS.find((c) => c.key === focus);
  const FocusIcon = focusMeta.icon;

  // metric values
  const appSurface = isSidecar ? 'lean — logic only' : 'bloated — logic + 3 concerns';
  const deploysToChange = isSidecar ? '1 sidecar (app untouched)' : 'every app (full rebuild)';
  const reimplement = isSidecar ? 'once, in the sidecar' : 'in every service';

  // sidecar concern rows
  const concernActive = (key) => {
    if (key === 'proxy') return current.tls || current.forward;
    if (key === 'logging') return current.logShip || current.logOut;
    return current.configPull || current.configWrite;
  };

  const tone = current.mode === 'baked'
    && (current.phase === 'done' || current.phase === 'proxy' || current.phase === 'ship' || current.phase === 'configpull')
    ? 'warn'
    : current.phase === 'done' || current.phase === 'configread'
      ? 'ok'
      : '';

  const arrOn = (cond) => (cond ? 'is-on' : '');

  return (
    <div className="scp">
      <div className="scp-head">
        <h3 className="scp-title">Sidecar pattern — cross-cutting concerns beside the app, not inside it</h3>
        <p className="scp-sub">
          A lean app and a sidecar share one pod. The sidecar handles TLS/auth, log shipping, and config
          sync so the app stays pure business logic. Toggle a concern, then flip to the baked-in version to
          watch the app bloat and the cost of changing anything jump.
        </p>
      </div>

      <div className="scp-controls">
        <div className="scp-modes" role="group" aria-label="Where concerns live">
          <button
            type="button"
            className={`scp-mode ${isSidecar ? 'is-on' : ''}`}
            onClick={() => switchMode('sidecar')}
            aria-pressed={isSidecar}
          >
            <Boxes size={13} /> sidecar
          </button>
          <button
            type="button"
            className={`scp-mode ${!isSidecar ? 'is-on' : ''}`}
            onClick={() => switchMode('baked')}
            aria-pressed={!isSidecar}
          >
            <Box size={13} /> baked into app
          </button>
        </div>

        <div className="scp-concerns" role="group" aria-label="Highlighted concern">
          {CONCERNS.map((c) => {
            const Ic = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                className={`scp-concern ${focus === c.key ? 'is-on' : ''}`}
                onClick={() => switchFocus(c.key)}
                aria-pressed={focus === c.key}
              >
                <Ic size={13} /> {c.label}
              </button>
            );
          })}
        </div>

        <label className="scp-speed">
          <span className="scp-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="scp-speed-range"
            aria-label="Playback speed"
          />
          <span className="scp-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="scp-spacer" aria-hidden="true" />

        <div className="scp-buttons">
          <button
            type="button"
            className="scp-btn scp-btn-primary"
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
            className="scp-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="scp-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="scp-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="scp-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="scp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="scp-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="scp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="scp-ah" />
            </marker>
            <marker id="scp-arr-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="scp-ah is-on" />
            </marker>
            <marker id="scp-arr-warn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="scp-ah is-warn" />
            </marker>
          </defs>

          {/* client */}
          <rect className={`scp-ext ${current.inbound ? 'is-on' : ''}`} x={clientX} y={clientY} width={clientW} height={clientH} rx={8} />
          <text className="scp-ext-label" x={clientX + clientW / 2} y={clientY + 24} textAnchor="middle">client</text>
          <text className="scp-ext-sub" x={clientX + clientW / 2} y={clientY + 40} textAnchor="middle">HTTPS request</text>

          {/* inbound arrow: client -> sidecar (sidecar mode) or -> app (baked) */}
          {(() => {
            const targetX = isSidecar ? carX : appX;
            const targetY = isSidecar ? carY + 22 : appY + 22;
            return (
              <line
                className={`scp-flow ${arrOn(current.inbound)}`}
                x1={clientX + clientW}
                y1={clientY + clientH / 2}
                x2={targetX - 6}
                y2={targetY}
                markerEnd={`url(#scp-arr${current.inbound ? '-on' : ''})`}
              />
            );
          })()}

          {/* pod boundary */}
          <rect className="scp-pod" x={podX} y={podY} width={podW} height={podH} rx={12} />
          <g transform={`translate(${podX + 10}, ${podY - 22})`}>
            <Layers width={14} height={14} className="scp-pod-ic" />
          </g>
          <text className="scp-pod-label" x={podX + 30} y={podY - 11} textAnchor="start">
            one pod — shared network + config volume
          </text>

          {/* APP box */}
          <rect
            className={`scp-app ${current.appWork ? 'is-active' : ''} ${!isSidecar ? 'is-bloated' : ''}`}
            x={appX} y={appY} width={appW} height={appH} rx={10}
          />
          <g transform={`translate(${appX + 14}, ${appY + 12})`}>
            <Box width={18} height={18} className={`scp-app-ic ${current.appWork ? 'is-active' : ''}`} />
          </g>
          <text className="scp-app-label" x={appX + 40} y={appY + 26} textAnchor="start">app container</text>
          <text className="scp-app-sub" x={appX + 16} y={appY + 48} textAnchor="start">business logic</text>

          {/* baked-in concern chips bloating the app */}
          {!isSidecar && CONCERNS.map((c, i) => (
            <g key={c.key}>
              <rect
                className="scp-bloat"
                x={appX + 16}
                y={appY + 60 + i * 28}
                width={appW - 32}
                height={22}
                rx={5}
              />
              <text className="scp-bloat-t" x={appX + 26} y={appY + 75 + i * 28} textAnchor="start">
                {`+ ${c.sub} code`}
              </text>
            </g>
          ))}

          {/* SIDECAR box (only in sidecar mode) */}
          {isSidecar && (
            <g>
              <rect className="scp-car" x={carX} y={carY} width={carW} height={carH} rx={10} />
              <g transform={`translate(${carX + 14}, ${carY + 12})`}>
                <Boxes width={18} height={18} className="scp-car-ic" />
              </g>
              <text className="scp-car-label" x={carX + 40} y={carY + 26} textAnchor="start">sidecar</text>
              {CONCERNS.map((c, i) => {
                const Ic = c.icon;
                const active = concernActive(c.key);
                const isFocus = focus === c.key;
                return (
                  <g key={c.key}>
                    <rect
                      className={`scp-row ${active ? 'is-active' : ''} ${isFocus ? 'is-focus' : ''}`}
                      x={carX + 12}
                      y={carY + 44 + i * 27}
                      width={carW - 24}
                      height={22}
                      rx={5}
                    />
                    <g transform={`translate(${carX + 18}, ${carY + 49 + i * 27})`}>
                      <Ic width={12} height={12} className={`scp-row-ic ${active ? 'is-active' : ''}`} />
                    </g>
                    <text className={`scp-row-t ${active ? 'is-active' : ''}`} x={carX + 36} y={carY + 59 + i * 27} textAnchor="start">
                      {c.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* forward arrow sidecar -> app (localhost) */}
          {isSidecar && (
            <g>
              <line
                className={`scp-flow ${arrOn(current.forward)}`}
                x1={carX}
                y1={carY + 30}
                x2={appX + appW + 6}
                y2={appY + 30}
                markerEnd={`url(#scp-arr${current.forward ? '-on' : ''})`}
              />
              <text className={`scp-flow-label ${arrOn(current.forward)}`} x={(carX + appX + appW) / 2} y={appY + 18} textAnchor="middle">
                localhost
              </text>
            </g>
          )}

          {/* TLS badge over the boundary owner */}
          {current.tls && (
            <g>
              <rect
                className={`scp-badge ${isSidecar ? 'is-ok' : 'is-warn'}`}
                x={(isSidecar ? carX : appX) + 8}
                y={(isSidecar ? carY : appY) - 18}
                width={96}
                height={20}
                rx={10}
              />
              <text className="scp-badge-t" x={(isSidecar ? carX : appX) + 56} y={(isSidecar ? carY : appY) - 4} textAnchor="middle">
                TLS + auth
              </text>
            </g>
          )}

          {/* shared volume */}
          <rect
            className={`scp-vol ${current.configWrite || current.appReadConfig ? 'is-active' : ''}`}
            x={volX} y={volY} width={volW} height={volH} rx={7}
          />
          <text className="scp-vol-label" x={volX + volW / 2} y={volY + 21} textAnchor="middle">
            {isSidecar ? 'shared config volume — a file the app reads' : 'app reads its own config'}
          </text>
          {isSidecar && current.appReadConfig && (
            <line
              className="scp-flow is-on"
              x1={appX + 40}
              y1={appY + appH + 4}
              x2={appX + 40}
              y2={volY - 4}
              markerEnd="url(#scp-arr-on)"
            />
          )}
          {isSidecar && current.configWrite && (
            <line
              className="scp-flow is-on"
              x1={carX + 40}
              y1={carY + carH + 4}
              x2={carX + 40}
              y2={volY - 4}
              markerEnd="url(#scp-arr-on)"
            />
          )}

          {/* log backend */}
          <rect className={`scp-ext ${current.logShip ? 'is-on' : ''}`} x={logBackX} y={logBackY} width={logBackW} height={logBackH} rx={8} />
          <g transform={`translate(${logBackX + 12}, ${logBackY + 16})`}>
            <ScrollText width={16} height={16} className="scp-ext-ic" />
          </g>
          <text className="scp-ext-label" x={logBackX + logBackW / 2 + 12} y={logBackY + 26} textAnchor="middle">log backend</text>
          <text className="scp-ext-sub" x={logBackX + logBackW / 2 + 12} y={logBackY + 42} textAnchor="middle">stores log lines</text>

          {/* app -> sidecar log tail (sidecar mode) */}
          {isSidecar && current.logOut && (
            <line
              className="scp-flow is-on"
              x1={appX + appW + 6}
              y1={appY + 90}
              x2={carX - 6}
              y2={carY + 90}
              markerEnd="url(#scp-arr-on)"
            />
          )}
          {/* ship logs -> backend */}
          {(() => {
            const fromX = isSidecar ? carX + carW : appX + appW;
            const fromY = isSidecar ? carY + 60 : appY + 60;
            return (
              <line
                className={`scp-flow ${arrOn(current.logShip)}`}
                x1={fromX + 6}
                y1={fromY}
                x2={logBackX - 6}
                y2={logBackY + logBackH / 2}
                markerEnd={`url(#scp-arr${current.logShip ? '-on' : ''})`}
              />
            );
          })()}

          {/* config source */}
          <rect className={`scp-ext ${current.configPull ? 'is-on' : ''}`} x={configX} y={configY} width={configW} height={configH} rx={8} />
          <g transform={`translate(${configX + 12}, ${configY + 16})`}>
            <RefreshCw width={16} height={16} className="scp-ext-ic" />
          </g>
          <text className="scp-ext-label" x={configX + configW / 2 + 12} y={configY + 26} textAnchor="middle">config source</text>
          <text className="scp-ext-sub" x={configX + configW / 2 + 12} y={configY + 42} textAnchor="middle">server / git repo</text>

          {/* config source -> sidecar (or app) */}
          {(() => {
            const toX = isSidecar ? carX + carW : appX + appW;
            const toY = isSidecar ? carY + 100 : appY + 110;
            return (
              <line
                className={`scp-flow ${arrOn(current.configPull)}`}
                x1={configX - 6}
                y1={configY + configH / 2}
                x2={toX + 6}
                y2={toY}
                markerEnd={`url(#scp-arr${current.configPull ? '-on' : ''})`}
              />
            );
          })()}
        </svg>
      </div>

      <div className="scp-metrics">
        <div className="scp-metric">
          <span className="scp-metric-label">concerns live in</span>
          <span className="scp-metric-value">{isSidecar ? 'the sidecar' : 'the app itself'}</span>
        </div>
        <div className="scp-metric">
          <span className="scp-metric-label">active concern</span>
          <span className="scp-metric-value">{focusMeta.label}</span>
        </div>
        <div className="scp-metric">
          <span className="scp-metric-label">app-code surface</span>
          <span className={`scp-metric-value ${isSidecar ? 'is-ok' : 'is-warn'}`}>{appSurface}</span>
        </div>
        <div className="scp-metric">
          <span className="scp-metric-label">deploys to change {focusMeta.sub}</span>
          <span className={`scp-metric-value ${isSidecar ? 'is-ok' : 'is-warn'}`}>{deploysToChange}</span>
        </div>
        <div className="scp-metric scp-metric-dim">
          <span className="scp-metric-label">re-implement concern</span>
          <span className={`scp-metric-value ${isSidecar ? 'is-ok' : 'is-warn'}`}>{reimplement}</span>
        </div>
        <div className="scp-metric scp-metric-dim">
          <span className="scp-metric-label">phase</span>
          <span className={`scp-metric-value ${tone === 'ok' ? 'is-ok' : tone === 'warn' ? 'is-warn' : ''}`}>
            {PHASE_LABEL[current.phase] || current.phase}
          </span>
        </div>
      </div>

      <div className={`scp-narration ${tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : ''}`}>
        <span className={`scp-narration-label ${tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : ''}`}>
          <FocusIcon size={12} /> {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="scp-narration-body">{current.note}</span>
      </div>

      <div className="scp-legend">
        <span className="scp-legend-item"><ShieldCheck size={13} className="scp-ic is-sky" /> proxy / TLS — sidecar terminates TLS and auth</span>
        <span className="scp-legend-item"><ScrollText size={13} className="scp-ic is-violet" /> logging — sidecar ships the app&apos;s logs</span>
        <span className="scp-legend-item"><RefreshCw size={13} className="scp-ic is-mint" /> config sync — sidecar writes the shared volume</span>
        <span className="scp-legend-item"><ArrowLeftRight size={13} className="scp-ic" /> baked-in — every app re-implements all three</span>
        <span className="scp-legend-item"><Check size={13} className="scp-ic is-ok" /> sidecar: swap one image, app untouched</span>
        <span className="scp-legend-item"><AlertTriangle size={13} className="scp-ic is-warn" /> baked-in: change anything, rebuild the app</span>
      </div>
    </div>
  );
}
