import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldAlert,
  ShieldCheck, Code2, Type, Server, Globe, Lock, Check, X,
} from 'lucide-react';
import './XssPreventionViz.css';

// Reflected/stored XSS and the two defenses that stop it. Untrusted input that
// contains markup ( <script>...</script>, <img onerror=...> ) is reflected back
// into a response and rendered by the browser. With NO output encoding the
// browser parses the markup and the injected script runs. The fix is output
// encoding — HTML-escaping the dangerous characters ( & < > " ' ) so the same
// bytes render as inert visible TEXT, not executable nodes. A Content-Security-
// Policy ( script-src 'self' ) is the second layer: even if raw markup slips
// through, the browser refuses to run inline script. Encoding ON neutralizes
// regardless of CSP; encoding OFF leaves the outcome to CSP.
//
// SAFETY: every payload string here is DATA only. It is HTML-escaped by a pure
// string function and rendered exclusively as plain SVG <text>. Nothing is ever
// injected as real HTML — no dangerouslySetInnerHTML, no eval, no script node.

const PRESETS = [
  { id: 'benign', label: 'benign', value: 'Hello there' },
  { id: 'script', label: 'script tag', value: '<script>steal(cookie)</script>' },
  { id: 'img', label: 'img onerror', value: '<img src=x onerror=alert(1)>' },
  { id: 'bold', label: 'bold tag', value: '<b>bold</b>' },
];

// Pure HTML-escape: turns the five dangerous characters into named entities so
// the markup can only ever render as visible text. Order matters — & first so
// we do not double-escape entities produced by later replacements.
function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Does this string carry executable markup? A real parser would decide; here we
// flag the two classic vectors: a <script> element or an inline event handler
// such as onerror= / onload= on a tag. Benign text and inert tags ( <b> ) do not.
function hasActiveMarkup(str) {
  const lower = str.toLowerCase();
  const scriptTag = /<script[\s>]/.test(lower);
  const eventHandler = /<[^>]+\son\w+\s*=/.test(lower);
  return scriptTag || eventHandler;
}

// Soft-wrap a long string into lines that fit the SVG column without an inner
// scrollbar. Breaks on the character budget, never mid-impossible.
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
  { key: 'reflect', label: 'server reflects / stores' },
  { key: 'parse', label: 'browser parses' },
  { key: 'csp', label: 'CSP check' },
  { key: 'outcome', label: 'outcome' },
];
const TOTAL_STEPS = STEP_META.length;
const RUN_DELAY_MS = 1500;

export default function XssPreventionViz() {
  const [payload, setPayload] = useState(PRESETS[1].value);
  const [encoding, setEncoding] = useState(false);
  const [csp, setCsp] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  // Deterministic outcome from (encoding, csp, input). Encoding wins outright:
  // escaped markup is inert text no matter what CSP says. Otherwise CSP decides
  // whether the parsed script is allowed to run.
  const active = hasActiveMarkup(payload);
  const escaped = htmlEscape(payload);
  const rendered = encoding ? escaped : payload;

  let outcome; // 'safe-text' | 'fires' | 'blocked'
  if (encoding) outcome = 'safe-text';
  else if (!active) outcome = 'safe-text';
  else if (csp) outcome = 'blocked';
  else outcome = 'fires';

  const scriptExecuted = outcome === 'fires';
  const verdict = outcome === 'fires'
    ? 'XSS fires'
    : outcome === 'blocked' ? 'neutralized' : 'neutralized';
  const tone = outcome === 'fires' ? 'bad' : outcome === 'blocked' ? 'warn' : 'ok';

  const isRunning = isRunningRaw && step < TOTAL_STEPS - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(0.5, speed));

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
  const parsed = reached('parse');
  const cspChecked = reached('csp');
  const decided = reached('outcome');

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

  const toggleEncoding = () => {
    setIsRunning(false);
    setStep(0);
    setEncoding((v) => !v);
  };

  const toggleCsp = () => {
    setIsRunning(false);
    setStep(0);
    setCsp((v) => !v);
  };

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Run');

  const STEP_NOTE = {
    input: 'A user submits a value into a form, URL parameter, or comment field. Right now it is just bytes — completely untrusted, possibly carrying markup. The server has not decided yet whether to treat it as data or let it become part of the page.',
    reflect: encoding
      ? 'The server reflects the value back into the response, but escapes it first: every dangerous character ( & < > " \' ) becomes a named entity. The markup is now stored and sent as inert text.'
      : 'The server reflects or stores the value and drops it straight into the HTML response with no escaping. Whatever the user typed becomes part of the page source verbatim — this is the mistake XSS exploits.',
    parse: encoding
      ? 'The browser parses the response. Because the angle brackets arrived as &lt; and &gt;, there is no tag to open — the parser produces a single text node. The reader sees the literal characters, nothing executes.'
      : (active
        ? 'The browser parses the raw response and sees a real tag. It builds an executable node — a <script> element or an element with an inline event handler — exactly as if the page author had written it.'
        : 'The browser parses the response. This input has no executable markup, so it lands as plain content with nothing to run.'),
    csp: encoding
      ? 'Content-Security-Policy never even comes into play here — there is no script node to govern. Encoding already turned the payload into harmless text upstream of any policy decision.'
      : (csp
        ? 'A Content-Security-Policy header ( script-src \'self\' ) is set. Before running any inline script the browser checks the policy. Inline script has no matching source, so the browser refuses to execute it.'
        : 'No Content-Security-Policy is set, so the browser applies no restriction. Any inline script the parser created is free to run.'),
    outcome: outcome === 'fires'
      ? 'The injected script executes in the victim\'s session — it can read cookies, forge requests, or rewrite the page. This is a live XSS. The fix is to escape on output, and to add a CSP as a backstop.'
      : (outcome === 'blocked'
        ? 'The script node existed, but Content-Security-Policy blocked it from running. The attack is neutralized — though CSP is the second line of defense; output encoding should have stopped the node from ever forming.'
        : 'The payload rendered as inert text. Output encoding (or harmless input) means no executable node was ever created, so there was nothing for an attacker to run.'),
  };

  // SVG geometry — three columns: raw input, DOM landing, verdict.
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

  // The middle column reveals its true nature only once the browser has parsed.
  const domLabel = !parsed
    ? 'waiting for parse'
    : (encoding
      ? 'rendered as text, inert'
      : (active ? 'script ran' : 'plain content'));

  // What kind of node the DOM column is showing after parse.
  const domKind = !parsed
    ? 'pending'
    : (encoding || !active)
      ? 'text'
      : (cspChecked && csp ? 'blocked' : 'exec');

  const verdictText = !decided
    ? 'pending'
    : (outcome === 'fires' ? 'XSS fires' : 'neutralized');

  const cspNodeLabel = outcome === 'blocked'
    ? "blocked by Content-Security-Policy: script-src 'self'"
    : null;

  return (
    <div className="xssv">
      <div className="xssv-head">
        <h3 className="xssv-title">XSS prevention — escape on output, then a CSP backstop</h3>
        <p className="xssv-sub">
          Untrusted input reflected into a page. Without output encoding the browser parses the markup
          and the script runs; HTML-escape the dangerous characters and the same bytes land as inert text.
          Toggle encoding and the policy to see what each layer stops.
        </p>
      </div>

      <div className="xssv-controls">
        <div className="xssv-payload-edit" role="group" aria-label="Edit the payload">
          <span className="xssv-input-label">payload</span>
          <input
            type="text"
            className="xssv-text"
            value={payload}
            onChange={(e) => onEdit(e.target.value)}
            spellCheck={false}
            aria-label="Edit the input payload"
          />
        </div>

        <div className="xssv-presets" role="group" aria-label="Preset payloads">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`xssv-chip ${payload === p.value ? 'is-on' : ''}`}
              onClick={() => setPreset(p.value)}
              title={p.value}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`xssv-toggle ${encoding ? 'is-good' : ''}`}
          onClick={toggleEncoding}
          aria-pressed={encoding}
          title="HTML-escape the output so markup renders as inert text"
        >
          {encoding ? <ShieldCheck size={14} /> : <Code2 size={14} />}
          encoding {encoding ? 'on' : 'off'}
        </button>

        <button
          type="button"
          className={`xssv-toggle ${csp ? 'is-good' : ''}`}
          onClick={toggleCsp}
          aria-pressed={csp}
          title="Send a Content-Security-Policy header blocking inline script"
        >
          {csp ? <Lock size={14} /> : <Globe size={14} />}
          CSP {csp ? 'on' : 'off'}
        </button>

        <span className="xssv-spacer" aria-hidden="true" />

        <label className="xssv-speed">
          <span className="xssv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="xssv-speed-range"
            aria-label="Playback speed"
          />
          <span className="xssv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="xssv-buttons">
          <button
            type="button"
            className="xssv-btn xssv-btn-primary"
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
            className="xssv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="xssv-btn"
            onClick={() => setStep(TOTAL_STEPS - 1)}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="xssv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="xssv-stepcount">
          step <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      <div className="xssv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="xssv-svg" preserveAspectRatio="xMidYMid meet">
          {/* column 1 — raw input string */}
          <g>
            <rect className="xssv-col" x={colX(0)} y={colY} width={colW} height={colH} rx={9} />
            <text className="xssv-col-tag" x={colX(0) + 14} y={colY + 20}>RAW INPUT · untrusted</text>
            {rawLines.map((ln, i) => (
              <text
                key={`raw-${i}`}
                className="xssv-mono"
                x={colX(0) + 14}
                y={colY + 46 + i * 17}
              >
                {ln}
              </text>
            ))}
            <text
              className={`xssv-col-foot ${active ? 'is-bad' : 'is-dim'}`}
              x={colX(0) + 14}
              y={colY + colH - 12}
            >
              {active ? 'carries executable markup' : 'no executable markup'}
            </text>
          </g>

          {/* arrow 1 -> 2 */}
          <g>
            <line
              className="xssv-flow"
              x1={colX(0) + colW + 3}
              y1={colY + colH / 2}
              x2={colX(1) - 6}
              y2={colY + colH / 2}
              markerEnd="url(#xssv-arrow)"
            />
            <text className="xssv-flow-tag" x={colX(0) + colW + gap / 2} y={colY + colH / 2 - 8} textAnchor="middle">
              {encoding ? 'escape' : 'reflect'}
            </text>
          </g>

          {/* column 2 — how it lands in the DOM */}
          <g>
            <rect
              className={`xssv-col is-dom ${parsed ? `is-${domKind}` : ''}`}
              x={colX(1)}
              y={colY}
              width={colW}
              height={colH}
              rx={9}
            />
            <text className="xssv-col-tag" x={colX(1) + 14} y={colY + 20}>DOM · how it renders</text>

            {domKind === 'exec' && (
              <g transform={`translate(${colX(1) + colW - 30}, ${colY + 10})`}>
                <ShieldAlert width={18} height={18} className="xssv-dom-ic is-bad" />
              </g>
            )}
            {domKind === 'blocked' && (
              <g transform={`translate(${colX(1) + colW - 30}, ${colY + 10})`}>
                <Lock width={18} height={18} className="xssv-dom-ic is-warn" />
              </g>
            )}
            {domKind === 'text' && (
              <g transform={`translate(${colX(1) + colW - 30}, ${colY + 10})`}>
                <Type width={18} height={18} className="xssv-dom-ic is-ok" />
              </g>
            )}

            {domLines.map((ln, i) => (
              <text
                key={`dom-${i}`}
                className={`xssv-mono ${parsed ? `is-${domKind}` : ''}`}
                x={colX(1) + 14}
                y={colY + 46 + i * 17}
              >
                {ln}
              </text>
            ))}

            <text
              className={`xssv-col-foot is-${domKind === 'exec' ? 'bad' : domKind === 'blocked' ? 'warn' : domKind === 'text' ? 'ok' : 'dim'}`}
              x={colX(1) + 14}
              y={colY + colH - 12}
            >
              {domLabel}
            </text>
          </g>

          {/* arrow 2 -> 3 */}
          <g>
            <line
              className="xssv-flow"
              x1={colX(1) + colW + 3}
              y1={colY + colH / 2}
              x2={colX(2) - 6}
              y2={colY + colH / 2}
              markerEnd="url(#xssv-arrow)"
            />
            <text className="xssv-flow-tag" x={colX(1) + colW + gap / 2} y={colY + colH / 2 - 8} textAnchor="middle">
              {cspChecked ? (csp && !encoding ? 'CSP' : 'render') : '…'}
            </text>
          </g>

          {/* column 3 — verdict */}
          <g>
            <rect
              className={`xssv-col is-verdict ${decided ? `is-${tone}` : ''}`}
              x={colX(2)}
              y={colY}
              width={colW}
              height={colH}
              rx={9}
            />
            <text className="xssv-col-tag" x={colX(2) + 14} y={colY + 20}>VERDICT</text>

            <g transform={`translate(${colX(2) + colW / 2 - 14}, ${colY + 44})`}>
              {!decided && <Server width={28} height={28} className="xssv-verdict-ic is-dim" />}
              {decided && tone === 'bad' && <ShieldAlert width={28} height={28} className="xssv-verdict-ic is-bad" />}
              {decided && tone === 'warn' && <ShieldCheck width={28} height={28} className="xssv-verdict-ic is-warn" />}
              {decided && tone === 'ok' && <ShieldCheck width={28} height={28} className="xssv-verdict-ic is-ok" />}
            </g>

            <text
              className={`xssv-verdict-text is-${decided ? tone : 'dim'}`}
              x={colX(2) + colW / 2}
              y={colY + 104}
              textAnchor="middle"
            >
              {verdictText}
            </text>

            {decided && cspNodeLabel
              ? wrapChars(cspNodeLabel, 34).map((ln, i) => (
                <text
                  key={`cspn-${i}`}
                  className="xssv-verdict-detail is-warn"
                  x={colX(2) + colW / 2}
                  y={colY + 128 + i * 15}
                  textAnchor="middle"
                >
                  {ln}
                </text>
              ))
              : decided && (
                <text
                  className={`xssv-verdict-detail is-${tone}`}
                  x={colX(2) + colW / 2}
                  y={colY + 128}
                  textAnchor="middle"
                >
                  {outcome === 'fires'
                    ? 'inline script executed'
                    : encoding ? 'escaped to inert text' : 'no executable node'}
                </text>
              )}
          </g>

          <defs>
            <marker id="xssv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="xssv-ah" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="xssv-readouts">
        <div className="xssv-metric">
          <span className="xssv-metric-label">encoding</span>
          <span className={`xssv-metric-value ${encoding ? 'is-ok' : 'is-dim'}`}>
            {encoding ? 'on — output escaped' : 'off — raw output'}
          </span>
        </div>
        <div className="xssv-metric">
          <span className="xssv-metric-label">CSP</span>
          <span className={`xssv-metric-value ${csp ? 'is-ok' : 'is-dim'}`}>
            {csp ? "on — script-src 'self'" : 'off — no policy'}
          </span>
        </div>
        <div className="xssv-metric">
          <span className="xssv-metric-label">script executed?</span>
          <span className={`xssv-metric-value ${decided ? (scriptExecuted ? 'is-bad' : 'is-ok') : 'is-dim'}`}>
            {decided ? (scriptExecuted ? 'yes' : 'no') : 'not yet'}
          </span>
        </div>
        <div className="xssv-metric xssv-metric-dim">
          <span className="xssv-metric-label">verdict</span>
          <span className={`xssv-metric-value is-${decided ? tone : 'dim'}`}>
            {decided ? verdict : 'pending'}
          </span>
        </div>
      </div>

      <div className={`xssv-narration is-${stepKey === 'outcome' ? tone : 'accent'}`}>
        <span className="xssv-narration-label">{STEP_META[Math.min(step, TOTAL_STEPS - 1)].label}</span>
        <span className="xssv-narration-body">{STEP_NOTE[stepKey]}</span>
      </div>

      <div className="xssv-legend">
        <span className="xssv-legend-item"><Code2 size={13} className="xssv-ic is-bad" /> raw output — markup parsed as nodes</span>
        <span className="xssv-legend-item"><Type size={13} className="xssv-ic is-ok" /> escaped output — markup is inert text</span>
        <span className="xssv-legend-item"><ShieldAlert size={13} className="xssv-ic is-bad" /> script ran — live XSS</span>
        <span className="xssv-legend-item"><Lock size={13} className="xssv-ic is-warn" /> CSP backstop — inline script blocked</span>
        <span className="xssv-legend-item"><Check size={13} className="xssv-ic is-ok" /> encoding neutralizes regardless of CSP</span>
        <span className="xssv-legend-item"><X size={13} className="xssv-ic is-dim" /> & &lt; &gt; &quot; &#39; become entities on escape</span>
      </div>
    </div>
  );
}
