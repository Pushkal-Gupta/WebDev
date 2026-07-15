import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Pause, RotateCcw, ChevronsLeft, ChevronsRight,
  SkipBack, SkipForward, Terminal, AlertTriangle, Code2,
  Maximize2, Minimize2,
} from 'lucide-react';
import {
  ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer,
  NumberGridRenderer, TreeRenderer,
} from './AlgoVisualizer';
import { INTERACTIVE_TEMPLATES } from './interactiveTemplates';
import { registerMonacoThemes, resolveMonacoTheme } from '../../lib/monacoTheme';
import './InteractiveVisualizer.css';

const MAX_FRAMES = 600;
const EXEC_TIMEOUT_MS = 1500;

function pickRenderer(rendererKind, frame) {
  if (rendererKind === 'graph')  return <GraphRenderer frame={frame} />;
  if (rendererKind === 'window') return <SlidingWindowRenderer frame={frame} />;
  if (rendererKind === 'grid')   return <NumberGridRenderer frame={frame} />;
  if (rendererKind === 'tree')   return <TreeRenderer frame={frame} />;
  return <ArrayBarRenderer frame={frame} />;
}

function normalizeFrame(payload, caption) {
  if (payload == null || typeof payload !== 'object') {
    return { caption };
  }
  const next = { ...payload };
  if (caption && !next.caption) next.caption = caption;
  if (next.eliminated && Array.isArray(next.eliminated)) {
    next.eliminated = new Set(next.eliminated);
  }
  return next;
}

function deepClone(value) {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  if (value instanceof Set) return new Set(Array.from(value, deepClone));
  if (value instanceof Map) return new Map(Array.from(value, ([k, v]) => [k, deepClone(v)]));
  const out = {};
  for (const k of Object.keys(value)) out[k] = deepClone(value[k]);
  return out;
}

// Pretty-print the input JSON but keep arrays of PRIMITIVES on ONE line (e.g.
// "array": [5, 2, 9, 1, 7] instead of one element per line) — far easier to edit.
// Objects and arrays-of-objects still indent normally for readability.
function formatInput(value, indent = 0) {
  const pad = '  '.repeat(indent);
  const padIn = '  '.repeat(indent + 1);
  if (Array.isArray(value)) {
    if (value.every((v) => v === null || typeof v !== 'object')) {
      return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`; // inline primitive array
    }
    if (value.length === 0) return '[]';
    return `[\n${value.map((v) => padIn + formatInput(v, indent + 1)).join(',\n')}\n${pad}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    return `{\n${keys.map((k) => `${padIn}${JSON.stringify(k)}: ${formatInput(value[k], indent + 1)}`).join(',\n')}\n${pad}}`;
  }
  return JSON.stringify(value);
}

export default function InteractiveVisualizer({ slug }) {
  const template = INTERACTIVE_TEMPLATES[slug];

  const [code, setCode] = useState(() => template?.initialCode || '');
  const [inputText, setInputText] = useState(() =>
    formatInput(template?.initialInput ?? null),
  );
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(0);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);
  const [hasRun, setHasRun] = useState(false);
  const [editorFull, setEditorFull] = useState(false);
  const playRef = useRef(null);

  // Custom full-width bottom resize for the JSON input: drag anywhere along the
  // bottom edge (the native corner grip is disabled in CSS).
  const inputRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(null);
  const startInputResize = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = inputRef.current?.getBoundingClientRect().height ?? 90;
    const onMove = (ev) => {
      const next = Math.max(60, startH + (ev.clientY - startY));
      setInputHeight(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  useEffect(() => {
    if (!template) return;
    // Reset all state when switching algorithms; mirrors the new template into local editor state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(template.initialCode);
    setInputText(formatInput(template.initialInput ?? null));
    setFrames([]);
    setIdx(0);
    setLogs([]);
    setError(null);
    setPlaying(false);
    setHasRun(false);
  }, [slug, template]);

  const parsedInput = useMemo(() => {
    try { return { value: JSON.parse(inputText), err: null }; }
    catch (e) { return { value: null, err: e.message }; }
  }, [inputText]);

  const run = useCallback(() => {
    setPlaying(false);
    setError(null);
    setLogs([]);
    if (parsedInput.err) {
      setError(`Input is not valid JSON: ${parsedInput.err}`);
      return;
    }
    const capturedFrames = [];
    const capturedLogs = [];
    const startedAt = Date.now();
    const step = (state, caption = '') => {
      if (capturedFrames.length >= MAX_FRAMES) {
        throw new Error(`step() called more than ${MAX_FRAMES} times. Tighten your loop or reduce input size.`);
      }
      if (Date.now() - startedAt > EXEC_TIMEOUT_MS) {
        throw new Error(`Execution exceeded ${EXEC_TIMEOUT_MS}ms. Likely an infinite loop.`);
      }
      capturedFrames.push(normalizeFrame(deepClone(state), caption));
    };
    const log = (...args) => {
      capturedLogs.push(args.map(a => {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(' '));
    };
    try {
      const fn = new Function('input', 'step', 'log',
        `"use strict";\nconst console = { log };\n${code}`);
      fn(deepClone(parsedInput.value), step, log);
      setFrames(capturedFrames);
      setLogs(capturedLogs);
      setIdx(0);
      setHasRun(true);
      if (capturedFrames.length === 0) {
        setError('Code ran but never called step(). Call step(state, caption) inside your algorithm to record a frame.');
      }
    } catch (e) {
      setFrames(capturedFrames);
      setLogs(capturedLogs);
      setIdx(Math.max(0, capturedFrames.length - 1));
      setHasRun(true);
      setError(e.message || String(e));
    }
  }, [code, parsedInput]);

  // Live: auto-run on mount and (debounced) whenever the code or input changes, so
  // the visualization re-renders as the reader edits — no need to press Run.
  useEffect(() => {
    const t = setTimeout(() => { run(); }, 550);
    return () => clearTimeout(t);
  }, [run]);

  const reset = useCallback(() => {
    setPlaying(false);
    setCode(template.initialCode);
    setInputText(formatInput(template.initialInput ?? null));
    setFrames([]);
    setIdx(0);
    setLogs([]);
    setError(null);
    setHasRun(false);
  }, [template]);

  useEffect(() => {
    if (!playing || frames.length === 0) return undefined;
    if (idx >= frames.length - 1) {
      // End of timeline — stop autoplay. Sync setState is unavoidable here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaying(false);
      return undefined;
    }
    playRef.current = setTimeout(() => setIdx(i => Math.min(i + 1, frames.length - 1)), speedMs);
    return () => clearTimeout(playRef.current);
  }, [playing, idx, frames.length, speedMs]);

  if (!template) {
    return (
      <div className="iv-empty">
        <p>No interactive template registered for "{slug}".</p>
      </div>
    );
  }

  const currentFrame = frames[idx];
  const stepCount = frames.length;
  const canStep = stepCount > 0;

  return (
    <div className="iv-container">
      <header className="iv-header">
        <div className="iv-header-text">
          <h2 className="iv-title">{template.title}</h2>
          <p className="iv-sub">{template.description}</p>
        </div>
        <div className="iv-header-actions">
          <button type="button" className="iv-btn iv-btn-primary" onClick={run}>
            <Play size={14} /> Run
          </button>
          <button type="button" className="iv-btn iv-btn-ghost" onClick={reset} title="Reset code and input">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </header>

      <div className="iv-grid">
        <section className={`iv-pane iv-pane-editor${editorFull ? ' is-full' : ''}`} aria-label="Code editor">
          <div className="iv-pane-head">
            <Code2 size={14} />
            <span>Edit the algorithm</span>
            <span className="iv-pane-meta">JavaScript</span>
            <button
              type="button"
              className="iv-pane-expand"
              onClick={() => setEditorFull((v) => !v)}
              title={editorFull ? 'Exit full screen' : 'Expand editor'}
              aria-label={editorFull ? 'Exit full screen' : 'Expand editor'}
            >
              {editorFull ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
          <div className="iv-editor-wrap">
            <Editor
              height="100%"
              language="javascript"
              value={code}
              onChange={(v) => setCode(v ?? '')}
              beforeMount={(monaco) => registerMonacoThemes(monaco)}
              theme={resolveMonacoTheme()}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                tabSize: 2,
                automaticLayout: true,
                wordWrap: 'on',
              }}
            />
          </div>
          <div className="iv-input-block">
            <label className="iv-input-label" htmlFor={`iv-input-${slug}`}>
              Input (JSON) — bound to <code>input</code> inside your code
            </label>
            <div className="iv-input-wrap" style={inputHeight ? { height: inputHeight } : undefined}>
              <textarea
                ref={inputRef}
                id={`iv-input-${slug}`}
                className={`iv-input ${parsedInput.err ? 'iv-input-error' : ''}`}
                value={inputText}
                spellCheck={false}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
              />
              {/* Full-width drag handle: grab anywhere along the bottom edge, not
                  just the native corner grip. */}
              <div
                className="iv-input-resize"
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize input"
                onPointerDown={startInputResize}
              />
            </div>
            {parsedInput.err && (
              <p className="iv-input-msg"><AlertTriangle size={12} /> {parsedInput.err}</p>
            )}
          </div>
          <details className="iv-help">
            <summary>API available to your code</summary>
            <ul>
              <li><code>input</code> — the JSON above, deep-cloned per run.</li>
              <li><code>step(state, caption?)</code> — record a frame. <code>state</code> matches the renderer for this algorithm ({template.renderer}). Mutate freely; each call clones a snapshot.</li>
              <li><code>log(...args)</code> — write to the console pane below the canvas. <code>console.log</code> is wired to the same.</li>
            </ul>
            {template.stateHint && (
              <pre className="iv-help-pre">{template.stateHint}</pre>
            )}
          </details>
        </section>

        <section className="iv-pane iv-pane-viz" aria-label="Visualization">
          <div className="iv-pane-head">
            <Play size={14} />
            <span>Live walkthrough</span>
            {canStep && (
              <span className="iv-pane-meta">{idx + 1} / {stepCount}</span>
            )}
          </div>
          <div className="iv-canvas">
            {error && (
              <div className="iv-error" role="alert">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {!hasRun && !error && (
              <div className="iv-placeholder">
                <p>Run the code to see frames here.</p>
                <p className="iv-placeholder-hint">Each <code>step(state, caption)</code> call becomes one frame in the timeline.</p>
              </div>
            )}
            {hasRun && !error && stepCount === 0 && (
              <div className="iv-placeholder">
                <p>No frames captured. Add at least one <code>step(state, caption)</code> call.</p>
              </div>
            )}
            {currentFrame && (
              <div className="iv-frame">
                {pickRenderer(template.renderer, currentFrame)}
                {currentFrame.caption && (
                  <p className="iv-caption">{currentFrame.caption}</p>
                )}
              </div>
            )}
          </div>

          <div className="iv-controls">
            <button type="button" className="iv-ctrl" onClick={() => setIdx(0)} disabled={!canStep} title="First frame">
              <ChevronsLeft size={14} />
            </button>
            <button type="button" className="iv-ctrl" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={!canStep || idx === 0} title="Previous">
              <SkipBack size={14} />
            </button>
            <button
              type="button"
              className="iv-ctrl iv-ctrl-play"
              onClick={() => {
                if (idx >= frames.length - 1) setIdx(0);
                setPlaying(p => !p);
              }}
              disabled={!canStep}
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button type="button" className="iv-ctrl" onClick={() => setIdx(i => Math.min(stepCount - 1, i + 1))} disabled={!canStep || idx >= stepCount - 1} title="Next">
              <SkipForward size={14} />
            </button>
            <button type="button" className="iv-ctrl" onClick={() => setIdx(stepCount - 1)} disabled={!canStep} title="Last frame">
              <ChevronsRight size={14} />
            </button>
            <input
              type="range"
              className="iv-scrub"
              min={0}
              max={Math.max(0, stepCount - 1)}
              value={idx}
              onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
              disabled={!canStep}
              aria-label="Scrub to frame"
            />
            <label className="iv-speed">
              Speed
              <select value={speedMs} onChange={(e) => setSpeedMs(Number(e.target.value))}>
                <option value={1600}>0.5x</option>
                <option value={900}>1x</option>
                <option value={500}>2x</option>
                <option value={220}>4x</option>
              </select>
            </label>
          </div>

          <div className="iv-console">
            <div className="iv-console-head">
              <Terminal size={12} />
              <span>Console</span>
              {logs.length > 0 && <span className="iv-console-count">{logs.length}</span>}
            </div>
            <div className="iv-console-body">
              {logs.length === 0
                ? <p className="iv-console-empty">log() output appears here.</p>
                : logs.map((l, i) => <pre key={i} className="iv-console-line">{l}</pre>)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
