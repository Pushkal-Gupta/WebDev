import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Terminal, FileText } from 'lucide-react';
import './ShellPipesViz.css';

// A fixed pipeline that exercises pipes AND every redirection operator the shell
// rewires before the first process runs:
//
//   cat < input.txt | grep ERROR 2> errors.log | wc -l > out.txt
//
//   cat   : fd0 <- input.txt (redirected stdin), fd1 -> pipe A, fd2 -> tty
//   grep  : fd0 <- pipe A,    fd1 -> pipe B,      fd2 -> errors.log (2>)
//   wc    : fd0 <- pipe B,    fd1 -> out.txt (>),  fd2 -> tty
//
// The shell sets all this wiring up (dup2 onto fds 0/1/2) BEFORE exec, so each
// process just reads fd0 and writes fd1 without knowing where they point.
// We then push concrete byte chunks through and watch them transform stage to stage.

const PROCS = [
  { name: 'cat', cmd: 'cat' },
  { name: 'grep', cmd: 'grep ERROR' },
  { name: 'wc', cmd: 'wc -l' },
];

// Targets: 'tty' terminal, { file } a disk file, { pipe } a pipe id.
const WIRING = [
  { fd0: { file: 'input.txt' }, fd1: { pipe: 'A' }, fd2: 'tty' },
  { fd0: { pipe: 'A' }, fd1: { pipe: 'B' }, fd2: { file: 'errors.log' } },
  { fd0: { pipe: 'B' }, fd1: { file: 'out.txt' }, fd2: 'tty' },
];

// Deterministic input lines fed into cat. grep keeps lines containing ERROR;
// non-matching lines vanish, and cat emits one diagnostic on stderr.
const INPUT_LINES = [
  { text: 'INFO  boot ok', kind: 'plain' },
  { text: 'ERROR disk full', kind: 'match' },
  { text: 'WARN  retrying', kind: 'plain' },
  { text: 'ERROR timeout', kind: 'match' },
];

const CAT_STDERR = "cat: input.txt: partial read";

const targetLabel = (t) => {
  if (t === 'tty') return 'tty';
  if (t.file) return t.file;
  if (t.pipe) return `pipe ${t.pipe}`;
  return '?';
};

function buildFrames() {
  const frames = [];

  // World state carried across frames.
  const files = { 'input.txt': INPUT_LINES.map((l) => l.text), 'errors.log': [], 'out.txt': [] };
  const pipes = { A: [], B: [] }; // bytes currently buffered in each pipe
  const tty = []; // terminal lines
  let chunk = null; // the byte chunk in flight: { text, kind, at } at = stage marker

  const snap = (extra) => ({
    files: { 'input.txt': [...files['input.txt']], 'errors.log': [...files['errors.log']], 'out.txt': [...files['out.txt']] },
    pipes: { A: [...pipes.A], B: [...pipes.B] },
    tty: [...tty],
    chunk: chunk ? { ...chunk } : null,
    active: -1,
    flow: null, // which conduit lights up: { kind:'pipe', id } | { kind:'file', name } | { kind:'tty' }
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `The shell parses "cat < input.txt | grep ERROR 2> errors.log | wc -l > out.txt". Before any program runs it builds two pipes (A, B), opens the files, and points each process's fd 0 (stdin), fd 1 (stdout), fd 2 (stderr) at the right place with dup2. Each program then just reads fd 0 and writes fd 1 — blind to what is on the other end. Step through to watch bytes flow.`,
  }));

  // Stage 0 — cat reads input.txt and writes to pipe A, with one stderr diagnostic.
  INPUT_LINES.forEach((line, i) => {
    chunk = { text: line.text, kind: line.kind, at: 'cat-in' };
    frames.push(snap({
      active: 0,
      flow: { kind: 'file', name: 'input.txt' },
      note: `cat reads fd 0, which the shell redirected with "<" to point at input.txt. Line ${i + 1}: "${line.text}" arrives on cat's stdin.`,
    }));
    pipes.A.push(line.text);
    chunk = { text: line.text, kind: line.kind, at: 'pipeA' };
    frames.push(snap({
      active: 0,
      flow: { kind: 'pipe', id: 'A' },
      note: `cat writes "${line.text}" to fd 1, which is the write end of pipe A. The bytes sit in the kernel pipe buffer until grep reads them. cat does not know a pipe is there — it just wrote stdout.`,
    }));
  });

  tty.push(CAT_STDERR);
  chunk = { text: CAT_STDERR, kind: 'err', at: 'tty' };
  frames.push(snap({
    active: 0,
    flow: { kind: 'tty' },
    note: `cat emits one diagnostic on fd 2 (stderr). cat's fd 2 was left pointing at the terminal (tty), so "${CAT_STDERR}" prints to your screen — separate from the piped stdout stream.`,
  }));
  chunk = null;

  // Stage 1 — grep reads pipe A, keeps matches to pipe B, sends a note to errors.log on fd2.
  INPUT_LINES.forEach((line) => {
    pipes.A.shift();
    chunk = { text: line.text, kind: line.kind, at: 'grep-in' };
    frames.push(snap({
      active: 1,
      flow: { kind: 'pipe', id: 'A' },
      note: `grep reads fd 0 = read end of pipe A. It pulls "${line.text}" out of the pipe buffer. grep thinks it is reading plain stdin.`,
    }));
    if (line.kind === 'match') {
      pipes.B.push(line.text);
      chunk = { text: line.text, kind: 'match', at: 'pipeB' };
      frames.push(snap({
        active: 1,
        flow: { kind: 'pipe', id: 'B' },
        note: `"${line.text}" contains ERROR, so grep writes it to fd 1 = write end of pipe B, on its way to wc.`,
      }));
    } else {
      const msg = `dropped non-match: ${line.text}`;
      files['errors.log'].push(msg);
      chunk = { text: msg, kind: 'err', at: 'errfile' };
      frames.push(snap({
        active: 1,
        flow: { kind: 'file', name: 'errors.log' },
        note: `"${line.text}" has no ERROR, so grep drops it from stdout. Its diagnostic goes to fd 2, which "2>" redirected to errors.log — captured to disk instead of cluttering the terminal.`,
      }));
    }
  });
  chunk = null;

  // Stage 2 — wc counts lines from pipe B, writes the count to out.txt via '>'.
  let count = 0;
  const matched = INPUT_LINES.filter((l) => l.kind === 'match');
  matched.forEach((line) => {
    pipes.B.shift();
    count += 1;
    chunk = { text: line.text, kind: 'match', at: 'wc-in' };
    frames.push(snap({
      active: 2,
      flow: { kind: 'pipe', id: 'B' },
      note: `wc reads fd 0 = read end of pipe B. It consumes "${line.text}" and bumps its line counter to ${count}. wc never sees the original file — only what grep forwarded.`,
    }));
  });

  const result = String(count);
  files['out.txt'].push(result);
  chunk = { text: result, kind: 'out', at: 'outfile' };
  frames.push(snap({
    active: 2,
    flow: { kind: 'file', name: 'out.txt' },
    note: `wc -l finishes and writes its result "${result}" to fd 1, which ">" redirected to out.txt — truncating any old contents first. Nothing prints to the terminal; the answer landed on disk.`,
  }));
  chunk = null;

  frames.push(snap({
    note: `Done. ${matched.length} lines contained ERROR, so out.txt holds "${result}". errors.log captured grep's ${files['errors.log'].length} drop notes (2>), and only cat's one stderr line reached the tty. The whole pipeline ran concurrently: each stage read its stdin and wrote its stdout, while the shell's pre-set fd wiring quietly routed every byte to the right pipe or file.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function ShellPipesViz() {
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

  // SVG geometry — three process boxes left-to-right, pipes between them,
  // a redirection rail of files above, and the tty below.
  const W = 960;
  const H = 460;
  const procW = 188;
  const procH = 120;
  const procGap = (W - 80 - procW * 3) / 2;
  const procX = (i) => 40 + i * (procW + procGap);
  const procY = 196;

  const fileY = 40;
  const ttyY = 384;

  const fdRowY = (i) => procY + 30 + i * 28;
  const fdDot = (pi, fi) => ({ x: procX(pi) + procW - 14, y: fdRowY(fi) - 4 });

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const fdTargets = (pi) => [WIRING[pi].fd0, WIRING[pi].fd1, WIRING[pi].fd2];

  const chunkClass = (kind) => {
    if (kind === 'match') return 'is-match';
    if (kind === 'err') return 'is-err';
    if (kind === 'out') return 'is-out';
    return 'is-plain';
  };

  // Where to draw the in-flight chunk based on its stage marker.
  const c = current.chunk;
  const chunkPos = c
    ? {
      'cat-in': { x: procX(0) - 6, y: procY + procH / 2 },
      pipeA: { x: procX(0) + procW + procGap / 2, y: procY + procH / 2 },
      'grep-in': { x: procX(1) - 6, y: procY + procH / 2 },
      pipeB: { x: procX(1) + procW + procGap / 2, y: procY + procH / 2 },
      'wc-in': { x: procX(2) - 6, y: procY + procH / 2 },
      tty: { x: procX(0) + procW / 2, y: ttyY - 14 },
      errfile: { x: procX(1) + procW / 2, y: fileY + 56 },
      outfile: { x: procX(2) + procW / 2, y: fileY + 56 },
    }[c.at] || null
    : null;

  const pipeBuf = (id) => current.pipes[id];

  return (
    <div className="spv">
      <div className="spv-head">
        <h3 className="spv-title">How a shell wires processes — pipes and redirection</h3>
        <p className="spv-sub">
          Step a real pipeline through the kernel. The shell points each process&apos;s fd 0/1/2 at a pipe, a file,
          or the terminal before any program runs; then bytes flow stdout to stdin down the chain while stderr
          diverges to its own destination.
        </p>
      </div>

      <div className="spv-controls">
        <div className="spv-cmd">
          <Terminal size={13} className="spv-cmd-ic" />
          <code className="spv-cmd-text">cat &lt; input.txt | grep ERROR 2&gt; errors.log | wc -l &gt; out.txt</code>
        </div>

        <span className="spv-spacer" aria-hidden="true" />

        <label className="spv-speed">
          <span className="spv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="spv-speed-range"
            aria-label="Playback speed"
          />
          <span className="spv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="spv-buttons">
          <button
            type="button"
            className="spv-btn spv-btn-primary"
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
            className="spv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="spv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="spv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="spv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="spv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="spv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="spv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="spv-ah" />
            </marker>
            <marker id="spv-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="spv-ah-hot" />
            </marker>
          </defs>

          {/* file rail (top) — input.txt, errors.log, out.txt */}
          {[
            { name: 'input.txt', x: procX(0), op: '<', lines: current.files['input.txt'] },
            { name: 'errors.log', x: procX(1), op: '2>', lines: current.files['errors.log'] },
            { name: 'out.txt', x: procX(2), op: '>', lines: current.files['out.txt'] },
          ].map((f) => {
            const hot = current.flow && current.flow.kind === 'file' && current.flow.name === f.name;
            return (
              <g key={`file-${f.name}`}>
                <rect className={`spv-file ${hot ? 'is-hot' : ''}`} x={f.x} y={fileY} width={procW} height={70} rx={8} />
                <g transform={`translate(${f.x + 12}, ${fileY + 12})`}>
                  <FileText width={14} height={14} className="spv-file-ic" />
                </g>
                <text className="spv-file-name" x={f.x + 32} y={fileY + 23}>{f.name}</text>
                <text className="spv-file-op" x={f.x + procW - 12} y={fileY + 23}>{f.op}</text>
                <text className="spv-file-body" x={f.x + 12} y={fileY + 46}>
                  {f.lines.length === 0 ? '(empty)' : `${f.lines.length} line${f.lines.length === 1 ? '' : 's'}`}
                </text>
                <text className="spv-file-tail" x={f.x + 12} y={fileY + 62}>
                  {f.lines.length === 0 ? '' : `last: ${f.lines[f.lines.length - 1].slice(0, 22)}`}
                </text>
              </g>
            );
          })}

          {/* connectors from each process's redirected fd up to its file / down to tty */}
          {[0, 1, 2].map((pi) => {
            const targets = fdTargets(pi);
            return targets.map((t, fi) => {
              if (t === 'tty') {
                const hot = current.active === pi && current.flow && current.flow.kind === 'tty';
                const sx = procX(pi) + procW / 2;
                return (
                  <line
                    key={`tty-${pi}-${fi}`}
                    className={`spv-link ${hot ? 'is-hot' : ''}`}
                    x1={sx}
                    y1={procY + procH}
                    x2={sx}
                    y2={ttyY}
                    markerEnd={hot ? 'url(#spv-arrow-hot)' : 'url(#spv-arrow)'}
                  />
                );
              }
              if (t.file) {
                const hot = current.active === pi && current.flow && current.flow.kind === 'file' && current.flow.name === t.file;
                const sx = procX(pi) + procW / 2;
                return (
                  <line
                    key={`flink-${pi}-${fi}`}
                    className={`spv-link ${hot ? 'is-hot' : ''}`}
                    x1={sx}
                    y1={t.file === 'input.txt' ? fileY + 70 : procY}
                    x2={sx}
                    y2={t.file === 'input.txt' ? procY : fileY + 70}
                    markerEnd={hot ? 'url(#spv-arrow-hot)' : 'url(#spv-arrow)'}
                  />
                );
              }
              return null;
            });
          })}

          {/* pipes between processes */}
          {[{ id: 'A', li: 0 }, { id: 'B', li: 1 }].map(({ id, li }) => {
            const x1 = procX(li) + procW;
            const x2 = procX(li + 1);
            const cy = procY + procH / 2;
            const hot = current.flow && current.flow.kind === 'pipe' && current.flow.id === id;
            const buf = pipeBuf(id);
            return (
              <g key={`pipe-${id}`}>
                <rect className={`spv-pipe ${hot ? 'is-hot' : ''}`} x={x1 + 6} y={cy - 16} width={x2 - x1 - 12} height={32} rx={16} />
                <line className={`spv-link ${hot ? 'is-hot' : ''}`} x1={x1} y1={cy} x2={x2} y2={cy} markerEnd={hot ? 'url(#spv-arrow-hot)' : 'url(#spv-arrow)'} />
                <text className="spv-pipe-label" x={(x1 + x2) / 2} y={cy - 22}>pipe {id}</text>
                <text className={`spv-pipe-buf ${buf.length ? 'has-bytes' : ''}`} x={(x1 + x2) / 2} y={cy + 5}>
                  {buf.length ? `${buf.length} buffered` : 'empty'}
                </text>
              </g>
            );
          })}

          {/* process boxes with fd tables */}
          {PROCS.map((p, pi) => {
            const x = procX(pi);
            const active = current.active === pi;
            const targets = fdTargets(pi);
            return (
              <g key={`proc-${p.name}`}>
                <rect className={`spv-proc ${active ? 'is-active' : ''}`} x={x} y={procY} width={procW} height={procH} rx={10} />
                <text className="spv-proc-name" x={x + 12} y={procY + 20}>{p.cmd}</text>
                {['fd 0', 'fd 1', 'fd 2'].map((fd, fi) => {
                  const t = targets[fi];
                  const dot = fdDot(pi, fi);
                  return (
                    <g key={`fd-${pi}-${fi}`}>
                      <text className="spv-fd-name" x={x + 12} y={fdRowY(fi)}>{fd}</text>
                      <text className={`spv-fd-arrow spv-fd-${fi}`} x={x + 52} y={fdRowY(fi)}>{fi === 0 ? '<-' : '->'}</text>
                      <text className="spv-fd-target" x={x + 74} y={fdRowY(fi)}>{targetLabel(t)}</text>
                      <circle className={`spv-fd-dot spv-fd-${fi}`} cx={dot.x} cy={dot.y} r={3} />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* terminal (bottom) */}
          {(() => {
            const hot = current.flow && current.flow.kind === 'tty';
            return (
              <g>
                <rect className={`spv-tty ${hot ? 'is-hot' : ''}`} x={40} y={ttyY} width={W - 80} height={56} rx={8} />
                <g transform={`translate(52, ${ttyY + 11})`}>
                  <Terminal width={14} height={14} className="spv-tty-ic" />
                </g>
                <text className="spv-tty-label" x={72} y={ttyY + 22}>terminal (tty)</text>
                <text className="spv-tty-body" x={72} y={ttyY + 43}>
                  {current.tty.length === 0 ? 'no output on screen yet' : current.tty.join('  •  ')}
                </text>
              </g>
            );
          })()}

          {/* the byte chunk in flight */}
          {current.chunk && chunkPos && (
            <g className="spv-chunk-g">
              <rect
                className={`spv-chunk ${chunkClass(current.chunk.kind)}`}
                x={chunkPos.x - 70}
                y={chunkPos.y - 13}
                width={140}
                height={26}
                rx={7}
              />
              <text className="spv-chunk-text" x={chunkPos.x} y={chunkPos.y + 4}>
                {current.chunk.text.length > 22 ? `${current.chunk.text.slice(0, 21)}…` : current.chunk.text}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="spv-metrics">
        {PROCS.map((p, pi) => {
          const t = fdTargets(pi);
          return (
            <div className="spv-metric" key={`m-${p.name}`}>
              <span className="spv-metric-label">{p.cmd}</span>
              <span className="spv-metric-value">
                0&lt;{targetLabel(t[0])} · 1&gt;{targetLabel(t[1])} · 2&gt;{targetLabel(t[2])}
              </span>
            </div>
          );
        })}
        <div className="spv-metric">
          <span className="spv-metric-label">pipe A / pipe B</span>
          <span className="spv-metric-value is-pipe">
            {current.pipes.A.length} / {current.pipes.B.length} buffered
          </span>
        </div>
        <div className="spv-metric">
          <span className="spv-metric-label">out.txt / errors.log</span>
          <span className="spv-metric-value is-file">
            {current.files['out.txt'].join(' ') || '—'} · {current.files['errors.log'].length} err
          </span>
        </div>
      </div>

      <div className="spv-narration">
        <span className={`spv-narration-label ${current.active >= 0 ? `spv-stage-${current.active}` : ''}`}>
          {current.active >= 0 ? PROCS[current.active].name : 'shell'}
        </span>
        <span className="spv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
