import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './EventLoopViz.css';

// A small fixed program whose execution order proves the key rule:
//   microtasks (promise callbacks) drain fully before the next macrotask (timer callback).
//
//   console.log('A');                       // sync   -> output A
//   setTimeout(cb, 0);                       // Web API -> macrotask queue (logs 'C')
//   Promise.resolve().then(cb2);             // microtask queue (logs 'D')
//   console.log('B');                        // sync   -> output B
//
// Real-JS output order: A, B, D, C.
const PROGRAM = [
  { kind: 'sync', label: "console.log('A')", out: 'A' },
  { kind: 'timer', label: 'setTimeout(cb, 0)', cbLabel: 'cb', out: 'C' },
  { kind: 'promise', label: 'Promise.resolve().then(cb2)', cbLabel: 'cb2', out: 'D' },
  { kind: 'sync', label: "console.log('B')", out: 'B' },
];

function buildFrames() {
  const frames = [];
  const stack = [];        // call-stack frames (top = last element)
  const webApis = [];      // pending timers registered with the host
  const macroQ = [];       // macrotask (callback) queue
  const microQ = [];       // microtask (promise) queue
  const output = [];       // console output, in emit order

  const snap = (extra) => ({
    stack: [...stack],
    webApis: [...webApis],
    macroQ: [...macroQ],
    microQ: [...microQ],
    output: [...output],
    region: null,    // which region to highlight: stack | webapi | macro | micro | output
    phase: 'run',
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: "Start. The call stack runs main() top to bottom. console.log fires synchronously; setTimeout and Promise hand work off to the host, then return immediately.",
  }));

  // --- Run the synchronous top-level script line by line ---
  stack.push('main()');
  frames.push(snap({ region: 'stack', note: 'Push main() onto the call stack and execute the script body line by line.' }));

  for (let i = 0; i < PROGRAM.length; i += 1) {
    const line = PROGRAM[i];
    if (line.kind === 'sync') {
      stack.push(line.label);
      frames.push(snap({ region: 'stack', note: `Run "${line.label}" — a synchronous call. It runs immediately on the stack.` }));
      output.push(line.out);
      frames.push(snap({ region: 'output', note: `console.log writes "${line.out}" to the output now. Output: [${output.join(', ')}].` }));
      stack.pop();
      frames.push(snap({ region: 'stack', note: `"${line.label}" returns and pops off the stack.` }));
    } else if (line.kind === 'timer') {
      stack.push(line.label);
      frames.push(snap({ region: 'stack', note: `Run "${line.label}". setTimeout does NOT run ${line.cbLabel} now — it registers a timer with the host (Web APIs).` }));
      webApis.push({ cb: line.cbLabel, out: line.out, delay: '0ms' });
      frames.push(snap({ region: 'webapi', note: `Timer for ${line.cbLabel} handed to Web APIs with delay 0ms. The 0ms timer still cannot jump the queue.` }));
      stack.pop();
      frames.push(snap({ region: 'stack', note: `setTimeout returns immediately (it does not block). Pop it off the stack.` }));
    } else if (line.kind === 'promise') {
      stack.push(line.label);
      frames.push(snap({ region: 'stack', note: `Run "${line.label}". The promise is already resolved, so .then schedules ${line.cbLabel} as a microtask.` }));
      microQ.push({ cb: line.cbLabel, out: line.out });
      frames.push(snap({ region: 'micro', note: `${line.cbLabel} enqueued on the MICROTASK queue. Microtasks have priority over macrotasks.` }));
      stack.pop();
      frames.push(snap({ region: 'stack', note: `.then returns immediately. Pop it off the stack.` }));
    }
  }

  // expire the 0ms timer: Web API -> macrotask queue
  if (webApis.length > 0) {
    const t = webApis.shift();
    macroQ.push({ cb: t.cb, out: t.out });
    frames.push(snap({ region: 'macro', note: `The 0ms timer elapsed. The host moves ${t.cb} from Web APIs into the MACROTASK (callback) queue. It waits — the stack is still busy.` }));
  }

  // top-level script finished
  stack.pop(); // main()
  frames.push(snap({ region: 'stack', note: 'Top-level script finished. main() pops. The call stack is now EMPTY — the event loop takes over.' }));

  // --- Event loop: drain ALL microtasks before touching the macrotask queue ---
  frames.push(snap({
    phase: 'loop',
    region: 'micro',
    note: 'Stack empty -> the event loop FIRST drains the entire microtask queue, before any macrotask. This is the rule that decides the order.',
  }));

  while (microQ.length > 0) {
    const m = microQ.shift();
    stack.push(`${m.cb}()`);
    frames.push(snap({ phase: 'loop', region: 'stack', note: `Dequeue microtask ${m.cb} and run it on the stack.` }));
    output.push(m.out);
    frames.push(snap({ phase: 'loop', region: 'output', note: `${m.cb} runs console.log("${m.out}"). Output: [${output.join(', ')}].` }));
    stack.pop();
    frames.push(snap({ phase: 'loop', region: 'stack', note: `${m.cb} returns, stack empty again. Check microtask queue once more before any macrotask.` }));
  }

  frames.push(snap({
    phase: 'loop',
    region: 'macro',
    note: 'Microtask queue is empty. ONLY NOW does the loop take ONE macrotask from the callback queue.',
  }));

  while (macroQ.length > 0) {
    const m = macroQ.shift();
    stack.push(`${m.cb}()`);
    frames.push(snap({ phase: 'loop', region: 'stack', note: `Dequeue macrotask ${m.cb} (the setTimeout callback) and run it on the stack.` }));
    output.push(m.out);
    frames.push(snap({ phase: 'loop', region: 'output', note: `${m.cb} runs console.log("${m.out}"). Output: [${output.join(', ')}].` }));
    stack.pop();
    frames.push(snap({ phase: 'loop', region: 'stack', note: `${m.cb} returns and the stack is empty. After each macrotask the loop would again drain microtasks (none left).` }));
  }

  frames.push(snap({
    phase: 'done',
    region: 'output',
    note: `Done. Final output order: ${output.join(' -> ')}. Sync (A, B) first; then the microtask D; then the macrotask C — even though both were scheduled with "zero" delay.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function EventLoopViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
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

  // SVG geometry
  const W = 940;
  const H = 430;
  const colGap = 18;
  const colW = (W - 40 - colGap * 3) / 4;
  const colX = (i) => 20 + i * (colW + colGap);
  const colTop = 70;
  const colH = 250;
  const itemH = 30;
  const itemGap = 6;

  const regionMeta = [
    { key: 'stack', title: 'Call Stack', sub: 'top -> bottom', items: current.stack, accent: 'var(--accent)', fromBottom: true, empty: 'empty' },
    { key: 'webapi', title: 'Web APIs', sub: 'timers', items: current.webApis.map((t) => `${t.cb} · ${t.delay}`), accent: 'var(--hue-sky)', fromBottom: false, empty: 'idle' },
    { key: 'macro', title: 'Macrotask Queue', sub: 'callbacks (FIFO)', items: current.macroQ.map((m) => m.cb), accent: 'var(--hue-pink)', fromBottom: false, empty: 'empty' },
    { key: 'micro', title: 'Microtask Queue', sub: 'promises (drained first)', items: current.microQ.map((m) => m.cb), accent: 'var(--hue-mint)', fromBottom: false, empty: 'empty' },
  ];

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const outY = colTop + colH + 56;

  return (
    <div className="elv">
      <div className="elv-head">
        <h3 className="elv-title">The JavaScript event loop — microtasks before macrotasks</h3>
        <p className="elv-sub">
          Step a small program through the runtime. Sync code runs on the call stack; setTimeout parks a timer in
          the Web APIs then a macrotask; promise callbacks become microtasks. When the stack empties, the loop
          drains every microtask before taking one macrotask.
        </p>
      </div>

      <div className="elv-controls">
        <div className="elv-program">
          {PROGRAM.map((line, i) => (
            <span
              key={`pl-${i}`}
              className={`elv-code-line elv-code-${line.kind}`}
            >
              {line.label};
            </span>
          ))}
        </div>

        <span className="elv-spacer" aria-hidden="true" />

        <label className="elv-speed">
          <span className="elv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="elv-speed-range"
            aria-label="Playback speed"
          />
          <span className="elv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="elv-buttons">
          <button
            type="button"
            className="elv-btn elv-btn-primary"
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
            className="elv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="elv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="elv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="elv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="elv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="elv-svg" preserveAspectRatio="xMidYMid meet">
          {regionMeta.map((r, ri) => {
            const x = colX(ri);
            const active = current.region === r.key;
            const slots = Math.floor((colH - 34) / (itemH + itemGap));
            return (
              <g key={`reg-${r.key}`}>
                <rect
                  className={`elv-region ${active ? 'is-active' : ''}`}
                  x={x}
                  y={colTop}
                  width={colW}
                  height={colH}
                  rx={9}
                  style={active ? { stroke: r.accent } : undefined}
                />
                <rect x={x} y={colTop} width={colW} height={5} rx={2.5} fill={r.accent} opacity={active ? 1 : 0.55} />
                <text className="elv-region-title" x={x + colW / 2} y={colTop + 24}>{r.title}</text>
                <text className="elv-region-sub" x={x + colW / 2} y={colTop + 40}>{r.sub}</text>

                {r.items.length === 0 && (
                  <text className="elv-region-empty" x={x + colW / 2} y={colTop + colH / 2 + 14}>{r.empty}</text>
                )}

                {r.items.slice(0, slots).map((item, ii) => {
                  // call stack grows upward from the bottom; queues list top-down.
                  const y = r.fromBottom
                    ? colTop + colH - 12 - (ii + 1) * (itemH + itemGap) + itemGap
                    : colTop + 50 + ii * (itemH + itemGap);
                  const isTop = r.fromBottom ? ii === r.items.length - 1 : ii === 0;
                  return (
                    <g key={`it-${r.key}-${ii}`}>
                      <rect
                        className={`elv-item ${isTop ? 'is-head' : ''}`}
                        x={x + 10}
                        y={y}
                        width={colW - 20}
                        height={itemH}
                        rx={6}
                        style={isTop ? { stroke: r.accent } : undefined}
                      />
                      <text className="elv-item-text" x={x + colW / 2} y={y + itemH / 2 + 4}>{item}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* output console */}
          <rect
            className={`elv-region elv-output ${current.region === 'output' ? 'is-active' : ''}`}
            x={20}
            y={outY}
            width={W - 40}
            height={62}
            rx={9}
            style={current.region === 'output' ? { stroke: 'var(--easy)' } : undefined}
          />
          <text className="elv-region-sub elv-output-label" x={32} y={outY + 18}>console output</text>
          {current.output.length === 0 && (
            <text className="elv-region-empty" x={W / 2} y={outY + 42}>nothing printed yet</text>
          )}
          {current.output.map((o, oi) => {
            const bx = 32 + oi * 56;
            const isLast = oi === current.output.length - 1;
            return (
              <g key={`out-${oi}`}>
                <rect className={`elv-out-cell ${isLast ? 'is-last' : ''}`} x={bx} y={outY + 26} width={44} height={26} rx={6} />
                <text className="elv-out-text" x={bx + 22} y={outY + 26 + 18}>{o}</text>
                {oi < current.output.length - 1 && (
                  <text className="elv-out-arrow" x={bx + 48} y={outY + 26 + 18}>-&gt;</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="elv-metrics">
        <div className="elv-metric">
          <span className="elv-metric-label">phase</span>
          <span className="elv-metric-value">{current.phase}</span>
        </div>
        <div className="elv-metric">
          <span className="elv-metric-label">stack</span>
          <span className="elv-metric-value">[{current.stack.join(', ') || '—'}]</span>
        </div>
        <div className="elv-metric">
          <span className="elv-metric-label">microtasks</span>
          <span className="elv-metric-value is-micro">[{current.microQ.map((m) => m.cb).join(', ') || '—'}]</span>
        </div>
        <div className="elv-metric">
          <span className="elv-metric-label">macrotasks</span>
          <span className="elv-metric-value is-macro">[{current.macroQ.map((m) => m.cb).join(', ') || '—'}]</span>
        </div>
        <div className="elv-metric">
          <span className="elv-metric-label">output</span>
          <span className="elv-metric-value is-out">[{current.output.join(', ') || '—'}]</span>
        </div>
      </div>

      <div className="elv-narration">
        <span className="elv-narration-label">trace</span>
        <span className="elv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
