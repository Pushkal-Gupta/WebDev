import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, ChevronRight, RotateCcw, ShieldAlert, ShieldCheck,
  Type, Code2, Gauge, Server, Database, Globe,
} from 'lucide-react';
import './SecXssViz.css';

// A single untrusted payload travels one of two routes — reflected straight off
// the server, or stored and served later — then hits the browser parser. With
// output escaping OFF and active markup present, the parser builds an executable
// node and the script fires (RED). With escaping ON (or a benign payload), the
// same bytes become an inert text node (GREEN).
//
// SAFETY: every payload string here is DATA only. It is HTML-escaped by a pure
// function and rendered exclusively as SVG <text>. Nothing is ever injected as
// real HTML — no dangerouslySetInnerHTML, no eval, no script node.

const PRESETS = [
  { id: 'benign', label: 'benign', value: 'Hello there' },
  { id: 'script', label: 'script tag', value: '<script>steal(cookie)</script>' },
  { id: 'img', label: 'img onerror', value: '<img src=x onerror=alert(1)>' },
  { id: 'bold', label: 'bold tag', value: '<b>bold</b>' },
];

// Pure HTML-escape: turns the five dangerous characters into named entities so
// the markup can only render as visible text. Order matters — & first so we do
// not double-escape entities produced by later replacements.
function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Does this string carry executable markup? A real parser would decide; here we
// flag the two classic vectors: an embedding/script element or an inline event
// handler such as onerror= / onload=. Benign text and inert tags ( <b> ) do not.
function hasActiveMarkup(str) {
  const lower = str.toLowerCase();
  const dangerousTag = /<\s*(script|iframe|object|embed|svg)\b/.test(lower);
  const eventHandler = /<[^>]+\son\w+\s*=/.test(lower);
  const jsUri = /(?:href|src)\s*=\s*['"]?\s*javascript:/.test(lower);
  return dangerousTag || eventHandler || jsUri;
}

// Soft-wrap a long string into lines that fit the SVG column without an inner
// scrollbar. Breaks on a fixed character budget.
function wrapChars(str, perLine) {
  if (!str) return [''];
  const lines = [];
  for (let i = 0; i < str.length; i += perLine) {
    lines.push(str.slice(i, i + perLine));
  }
  return lines.length ? lines : [''];
}

const STEP_META = [
  { key: 'input', label: 'receive input' },
  { key: 'route', label: 'server reflects / stores' },
  { key: 'parse', label: 'browser parses' },
  { key: 'render', label: 'render' },
];
const TOTAL_STEPS = STEP_META.length;
const RUN_DELAY_MS = 1500;

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SecXssViz() {
  const [payload, setPayload] = useState(PRESETS[2].value);
  const [escape, setEscape] = useState(false);
  const [stored, setStored] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const active = hasActiveMarkup(payload);
  const escaped = htmlEscape(payload);
  const rendered = escape ? escaped : payload;

  // Deterministic outcome from (escape, input). Escaping wins outright: escaped
  // markup is inert text. Otherwise active markup fires; benign input is inert.
  const fires = !escape && active;
  const tone = fires ? 'bad' : 'ok';

  const isRunning = isRunningRaw && step < TOTAL_STEPS - 1;
  const baseDelay = prefersReduced() ? RUN_DELAY_MS * 1.6 : RUN_DELAY_MS;
  const delay = Math.round(baseDelay / Math.max(0.5, speed));

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const stepKey = STEP_META[Math.min(step, TOTAL_STEPS - 1)].key;
  const reached = (k) => step >= STEP_META.findIndex((m) => m.key === k);
  const routed = reached('route');
  const parsed = reached('parse');
  const decided = reached('render');

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const setPreset = (value) => {
    setIsRunning(false);
    setStep(0);
    setPayload(value);
  };

  const onEdit = (value) => {
    setIsRunning(false);
    setStep(0);
    setPayload(value);
  };

  const toggleEscape = () => {
    setIsRunning(false);
    setStep(0);
    setEscape((v) => !v);
  };

  const toggleStored = () => {
    setIsRunning(false);
    setStep(0);
    setStored((v) => !v);
  };

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Run');

  const STEP_NOTE = {
    input: 'A user submits a value — a form field, URL parameter, or comment. Right now it is just bytes: completely untrusted, possibly carrying markup. Nothing has decided yet whether it becomes data or code.',
    route: stored
      ? (escape
        ? 'Stored route: the server escapes the value, then saves it to the database. Every future viewer is served the same inert, entity-encoded text.'
        : 'Stored route: the server saves the raw value to the database and serves it to every future viewer verbatim. One injection poisons everyone who loads the page.')
      : (escape
        ? 'Reflected route: the server escapes the value and echoes it straight back in this response — dangerous characters are now named entities.'
        : 'Reflected route: the server echoes the raw value straight back into this response with no escaping. Whatever was typed becomes part of the page source.'),
    parse: escape
      ? 'The browser parses the response. Because the angle brackets arrived as &lt; and &gt;, no tag can open — the parser produces a single text node. The reader sees literal characters; nothing runs.'
      : (active
        ? 'The browser parses the raw response and finds a real tag. It builds an executable node — a script element or an element with an inline handler — exactly as if the author had written it.'
        : 'The browser parses the response. This input carries no executable markup, so it lands as ordinary content with nothing to run.'),
    render: fires
      ? 'The injected script executes in the victim\'s session — it can read cookies, forge requests, or rewrite the page. This is a live XSS. The fix is to escape on output for this context.'
      : (escape
        ? 'The payload rendered as inert text. Output escaping converted every special character upstream, so no executable node was ever created.'
        : 'The payload rendered as inert text — this input had no executable markup, so there was nothing for an attacker to run.'),
  };

  // SVG geometry — three columns: raw input, browser landing, verdict.
  const W = 960;
  const H = 300;
  const colW = 290;
  const gap = 24;
  const colY = 54;
  const colH = H - colY - 50;
  const colX = (i) => 22 + i * (colW + gap);
  const PER_LINE = 30;

  const rawLines = wrapChars(payload || '(empty)', PER_LINE);
  const domLines = wrapChars(rendered || '(empty)', PER_LINE);

  const domKind = !parsed
    ? 'pending'
    : (fires ? 'exec' : 'text');

  const domLabel = !parsed
    ? 'waiting for parse'
    : (escape ? 'rendered as text, inert' : (active ? 'script node built' : 'plain content'));

  const verdictText = !decided
    ? 'pending'
    : (fires ? 'script fires' : 'inert text');

  const routeTag = routed ? (stored ? 'stored' : 'reflected') : '…';

  return (
    <div className="sxv">
      <div className="sxv-head">
        <div className="sxv-head-icon"><ShieldAlert size={18} /></div>
        <div className="sxv-head-text">
          <h3 className="sxv-title">Cross-Site Scripting — data or code at the parse boundary</h3>
          <p className="sxv-sub">
            One untrusted payload, reflected or stored, then parsed by the browser. Escape the output and
            the same bytes land as inert text; skip it and active markup becomes an executable node.
          </p>
        </div>
        <button type="button" className="sxv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="sxv-controls">
        <div className="sxv-payload-edit" role="group" aria-label="Edit the payload">
          <span className="sxv-input-label">payload</span>
          <input
            type="text"
            className="sxv-text"
            value={payload}
            onChange={(e) => onEdit(e.target.value)}
            spellCheck={false}
            aria-label="Edit the input payload"
          />
        </div>

        <div className="sxv-presets" role="group" aria-label="Preset payloads">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`sxv-chip ${payload === p.value ? 'is-on' : ''}`}
              onClick={() => setPreset(p.value)}
              title={p.value}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`sxv-toggle ${escape ? 'is-good' : ''}`}
          onClick={toggleEscape}
          aria-pressed={escape}
          title="HTML-escape the output so markup renders as inert text"
        >
          {escape ? <ShieldCheck size={14} /> : <Code2 size={14} />}
          escape {escape ? 'on' : 'off'}
        </button>

        <button
          type="button"
          className="sxv-toggle sxv-mode"
          onClick={toggleStored}
          aria-pressed={stored}
          title="Toggle between reflected and stored delivery"
        >
          {stored ? <Database size={14} /> : <Globe size={14} />}
          {stored ? 'stored' : 'reflected'}
        </button>

        <span className="sxv-spacer" aria-hidden="true" />

        <label className="sxv-speed">
          <Gauge size={13} />
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="sxv-speed-range"
            aria-label="Playback speed"
          />
          <span className="sxv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="sxv-buttons">
          <button
            type="button"
            className="sxv-btn sxv-btn-primary"
            onClick={() => {
              if (step >= TOTAL_STEPS - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < TOTAL_STEPS - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="sxv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="sxv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="sxv-stepcount">
          step <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      <div className="sxv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sxv-svg" preserveAspectRatio="xMidYMid meet">
          {/* column 1 — raw input string */}
          <g>
            <rect className="sxv-col" x={colX(0)} y={colY} width={colW} height={colH} rx={9} />
            <text className="sxv-col-tag" x={colX(0) + 14} y={colY + 20}>RAW INPUT · untrusted</text>
            {rawLines.map((ln, i) => (
              <text key={`raw-${i}`} className="sxv-mono" x={colX(0) + 14} y={colY + 46 + i * 17}>
                {ln}
              </text>
            ))}
            <text
              className={`sxv-col-foot ${active ? 'is-bad' : 'is-dim'}`}
              x={colX(0) + 14}
              y={colY + colH - 12}
            >
              {active ? 'carries executable markup' : 'no executable markup'}
            </text>
          </g>

          {/* arrow 1 -> 2 */}
          <g>
            <line
              className="sxv-flow"
              x1={colX(0) + colW + 3}
              y1={colY + colH / 2}
              x2={colX(1) - 6}
              y2={colY + colH / 2}
              markerEnd="url(#sxv-arrow)"
            />
            <g transform={`translate(${colX(0) + colW + gap / 2}, ${colY + colH / 2 - 14})`}>
              {stored
                ? <Database x={-7} y={-7} width={14} height={14} className="sxv-flow-ic" />
                : <Server x={-7} y={-7} width={14} height={14} className="sxv-flow-ic" />}
            </g>
            <text className="sxv-flow-tag" x={colX(0) + colW + gap / 2} y={colY + colH / 2 + 20} textAnchor="middle">
              {routeTag}
            </text>
          </g>

          {/* column 2 — how it lands in the DOM */}
          <g>
            <rect
              className={`sxv-col is-dom ${parsed ? `is-${domKind}` : ''}`}
              x={colX(1)}
              y={colY}
              width={colW}
              height={colH}
              rx={9}
            />
            <text className="sxv-col-tag" x={colX(1) + 14} y={colY + 20}>BROWSER · how it renders</text>

            {domKind === 'exec' && (
              <g transform={`translate(${colX(1) + colW - 30}, ${colY + 10})`}>
                <ShieldAlert width={18} height={18} className="sxv-dom-ic is-bad" />
              </g>
            )}
            {domKind === 'text' && (
              <g transform={`translate(${colX(1) + colW - 30}, ${colY + 10})`}>
                <Type width={18} height={18} className="sxv-dom-ic is-ok" />
              </g>
            )}

            {domLines.map((ln, i) => (
              <text
                key={`dom-${i}`}
                className={`sxv-mono ${parsed ? `is-${domKind}` : ''}`}
                x={colX(1) + 14}
                y={colY + 46 + i * 17}
              >
                {ln}
              </text>
            ))}

            <text
              className={`sxv-col-foot is-${domKind === 'exec' ? 'bad' : domKind === 'text' ? 'ok' : 'dim'}`}
              x={colX(1) + 14}
              y={colY + colH - 12}
            >
              {domLabel}
            </text>
          </g>

          {/* arrow 2 -> 3 */}
          <g>
            <line
              className="sxv-flow"
              x1={colX(1) + colW + 3}
              y1={colY + colH / 2}
              x2={colX(2) - 6}
              y2={colY + colH / 2}
              markerEnd="url(#sxv-arrow)"
            />
            <text className="sxv-flow-tag" x={colX(1) + colW + gap / 2} y={colY + colH / 2 - 8} textAnchor="middle">
              {parsed ? (escape ? 'escape' : 'render') : '…'}
            </text>
          </g>

          {/* column 3 — verdict */}
          <g>
            <rect
              className={`sxv-col is-verdict ${decided ? `is-${tone}` : ''}`}
              x={colX(2)}
              y={colY}
              width={colW}
              height={colH}
              rx={9}
            />
            <text className="sxv-col-tag" x={colX(2) + 14} y={colY + 20}>VERDICT</text>

            <g transform={`translate(${colX(2) + colW / 2 - 14}, ${colY + 44})`}>
              {!decided && <Server width={28} height={28} className="sxv-verdict-ic is-dim" />}
              {decided && tone === 'bad' && <ShieldAlert width={28} height={28} className="sxv-verdict-ic is-bad" />}
              {decided && tone === 'ok' && <ShieldCheck width={28} height={28} className="sxv-verdict-ic is-ok" />}
            </g>

            <text
              className={`sxv-verdict-text is-${decided ? tone : 'dim'}`}
              x={colX(2) + colW / 2}
              y={colY + 104}
              textAnchor="middle"
            >
              {verdictText}
            </text>

            {decided && (
              <text
                className={`sxv-verdict-detail is-${tone}`}
                x={colX(2) + colW / 2}
                y={colY + 128}
                textAnchor="middle"
              >
                {fires
                  ? 'inline script executed'
                  : escape ? 'escaped to inert text' : 'no executable node'}
              </text>
            )}
          </g>

          <defs>
            <marker id="sxv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="sxv-ah" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="sxv-readouts">
        <div className="sxv-metric">
          <span className="sxv-metric-label">escape output</span>
          <span className={`sxv-metric-value ${escape ? 'is-ok' : 'is-dim'}`}>
            {escape ? 'on — output escaped' : 'off — raw output'}
          </span>
        </div>
        <div className="sxv-metric">
          <span className="sxv-metric-label">delivery</span>
          <span className="sxv-metric-value">
            {stored ? 'stored — served to all' : 'reflected — this response'}
          </span>
        </div>
        <div className="sxv-metric">
          <span className="sxv-metric-label">script executed?</span>
          <span className={`sxv-metric-value ${decided ? (fires ? 'is-bad' : 'is-ok') : 'is-dim'}`}>
            {decided ? (fires ? 'yes' : 'no') : 'not yet'}
          </span>
        </div>
        <div className="sxv-metric sxv-metric-dim">
          <span className="sxv-metric-label">verdict</span>
          <span className={`sxv-metric-value is-${decided ? tone : 'dim'}`}>
            {decided ? (fires ? 'XSS fires' : 'neutralized') : 'pending'}
          </span>
        </div>
      </div>

      <div className={`sxv-narration is-${stepKey === 'render' ? tone : 'accent'}`}>
        <span className="sxv-narration-label">{STEP_META[Math.min(step, TOTAL_STEPS - 1)].label}</span>
        <span className="sxv-narration-body">{STEP_NOTE[stepKey]}</span>
      </div>

      <div className="sxv-legend">
        <span className="sxv-legend-item"><Code2 size={13} className="sxv-ic is-bad" /> raw output — markup parsed as a node</span>
        <span className="sxv-legend-item"><Type size={13} className="sxv-ic is-ok" /> escaped output — markup is inert text</span>
        <span className="sxv-legend-item"><ShieldAlert size={13} className="sxv-ic is-bad" /> script fires — live XSS</span>
        <span className="sxv-legend-item"><ShieldCheck size={13} className="sxv-ic is-ok" /> escaping neutralizes every route</span>
      </div>
    </div>
  );
}
