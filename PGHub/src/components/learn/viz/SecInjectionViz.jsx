import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, ChevronRight, RotateCcw, ShieldAlert, ShieldCheck,
  Database, Braces, Gauge, KeyRound, Table2,
} from 'lucide-react';
import './SecInjectionViz.css';

// A login query built two ways from the SAME username input. In CONCAT mode the
// input is glued straight into the SQL string, so a quote closes the literal and
// the rest becomes syntax — auth bypass, stacked DROP, or a broken query (RED).
// In PARAMETERIZED mode the query text is compiled with a '?' placeholder and the
// input binds on a separate channel as a pure value — it can never be parsed as
// SQL, so the same bytes stay inert and match no user (GREEN).
//
// SAFETY: nothing here executes. Every "query" is DATA rendered only as SVG
// <text>. No database, no eval, no real SQL is ever run.

const PRESETS = [
  { id: 'benign', label: 'normal name', value: 'alice' },
  { id: 'taut', label: "' OR '1'='1", value: "' OR '1'='1" },
  { id: 'stacked', label: 'stacked DROP', value: "'; DROP TABLE users; --" },
  { id: 'comment', label: 'comment bypass', value: "admin' --" },
];

// Deterministic classification of what a concatenated input would do. Presence of
// a quote means the input can close the string literal and reach the grammar.
function classify(input) {
  const s = input || '';
  const breakout = /['"]/.test(s);
  if (!breakout) return 'none';
  if (/;\s*\w/.test(s) || /\b(drop|delete|truncate|insert|update)\b/i.test(s)) return 'stacked';
  if (/\bor\b[^=]*=/i.test(s)) return 'tautology';
  if (/--/.test(s)) return 'comment';
  return 'break';
}

function clip(str, max) {
  if (!str) return '(empty)';
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

const STEP_META = [
  { key: 'input', label: 'receive username' },
  { key: 'build', label: 'build the query' },
  { key: 'parse', label: 'engine parses' },
  { key: 'run', label: 'execute' },
];
const TOTAL_STEPS = STEP_META.length;
const RUN_DELAY_MS = 1500;

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SecInjectionViz() {
  const [input, setInput] = useState(PRESETS[1].value);
  const [param, setParam] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const kind = classify(input);
  const exploited = !param && kind !== 'none';
  const tone = exploited ? 'bad' : 'ok';

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
  const built = reached('build');
  const parsed = reached('parse');
  const decided = reached('run');

  const reset = () => { setIsRunning(false); setStep(0); };
  const setPreset = (v) => { setIsRunning(false); setStep(0); setInput(v); };
  const onEdit = (v) => { setIsRunning(false); setStep(0); setInput(v); };
  const toggleParam = () => { setIsRunning(false); setStep(0); setParam((v) => !v); };

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Run');

  const verdict = (() => {
    if (param) {
      return kind === 'none'
        ? { text: 'matched 1 user', detail: 'value bound safely — normal login', t: 'ok' }
        : { text: '0 rows', detail: 'input bound as a literal value — no match', t: 'ok' };
    }
    switch (kind) {
      case 'tautology': return { text: 'auth bypass', detail: 'WHERE always true — every row returned', t: 'bad' };
      case 'stacked': return { text: 'table dropped', detail: 'stacked statement executed', t: 'bad' };
      case 'comment': return { text: "logged in as 'admin'", detail: 'password check commented out', t: 'bad' };
      case 'break': return { text: 'query error', detail: 'quote broke the SQL grammar', t: 'bad' };
      default: return { text: 'matched 1 user', detail: 'no metacharacters — but still concatenated', t: 'ok' };
    }
  })();

  const STEP_NOTE = {
    input: 'A visitor submits a username in the login form. Right now it is untrusted data — possibly a real name, possibly a crafted payload carrying quotes and SQL keywords.',
    build: param
      ? 'Parameterized build: the query text is fixed with a ? placeholder and compiled once. The username is set aside to be sent on a separate channel as a bound value.'
      : 'Concatenation build: the username is glued directly into the SQL string between the quotes. Whatever it contains is now part of the query text itself.',
    parse: param
      ? 'The engine parses the compiled template — the placeholder is the only variable slot. The bound value is delivered as data and is never parsed as SQL.'
      : (exploited
        ? 'The engine parses the finished string. The quote in the input closed the name literal early, so everything after it is read as SQL grammar — not as a value.'
        : 'The engine parses the string. This input has no metacharacters, so it happens to stay inside the literal this time — but the query was still built unsafely.'),
    run: param
      ? (kind === 'none'
        ? 'The bound value matched a real user; the login proceeds normally. A crafted payload would simply have matched nothing.'
        : 'The payload was compared as a literal username. It matches no user, so the query returns zero rows. The injection is inert.')
      : (exploited
        ? 'The injected syntax executed. Concatenation let the input rewrite the query. The fix is a parameterized statement — separate the code from the data.'
        : 'The query ran normally this time, but the pattern is unsafe: a different input with a quote would break out. Parameterize to close the hole for good.'),
  };

  // SVG geometry — three columns: raw input, the query as built, verdict.
  const W = 960;
  const H = 320;
  const colW = 290;
  const gap = 24;
  const colY = 54;
  const colH = H - colY - 46;
  const colX = (i) => 22 + i * (colW + gap);

  const shownInput = clip(input, 26);
  const routeTag = built ? (param ? 'parameterize' : 'concatenate') : '…';

  return (
    <div className="siv">
      <div className="siv-head">
        <div className="siv-head-icon"><ShieldAlert size={18} /></div>
        <div className="siv-head-text">
          <h3 className="siv-title">SQL injection — data or code at the query boundary</h3>
          <p className="siv-sub">
            One username, built into a query two ways. Concatenate it and a quote turns input into
            SQL syntax; parameterize it and the same bytes bind as an inert value.
          </p>
        </div>
        <button type="button" className="siv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="siv-controls">
        <div className="siv-payload-edit" role="group" aria-label="Edit the username">
          <span className="siv-input-label">username</span>
          <input
            type="text"
            className="siv-text"
            value={input}
            onChange={(e) => onEdit(e.target.value)}
            spellCheck={false}
            aria-label="Edit the username input"
          />
        </div>

        <div className="siv-presets" role="group" aria-label="Preset inputs">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`siv-chip ${input === p.value ? 'is-on' : ''}`}
              onClick={() => setPreset(p.value)}
              title={p.value}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`siv-toggle ${param ? 'is-good' : ''}`}
          onClick={toggleParam}
          aria-pressed={param}
          title="Toggle between string concatenation and a parameterized query"
        >
          {param ? <ShieldCheck size={14} /> : <Braces size={14} />}
          {param ? 'parameterized' : 'concatenated'}
        </button>

        <span className="siv-spacer" aria-hidden="true" />

        <label className="siv-speed">
          <Gauge size={13} />
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="siv-speed-range"
            aria-label="Playback speed"
          />
          <span className="siv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="siv-buttons">
          <button
            type="button"
            className="siv-btn siv-btn-primary"
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
            className="siv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="siv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="siv-stepcount">
          step <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      <div className="siv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="siv-svg" preserveAspectRatio="xMidYMid meet">
          {/* column 1 — the login form / raw input */}
          <g>
            <rect className="siv-col" x={colX(0)} y={colY} width={colW} height={colH} rx={9} />
            <text className="siv-col-tag" x={colX(0) + 14} y={colY + 20}>LOGIN FORM · untrusted</text>
            <text className="siv-form-label" x={colX(0) + 14} y={colY + 48}>username</text>
            <rect className="siv-field" x={colX(0) + 14} y={colY + 56} width={colW - 28} height={30} rx={6} />
            <text className="siv-mono" x={colX(0) + 24} y={colY + 76}>{shownInput}</text>
            <text
              className={`siv-col-foot ${kind !== 'none' ? 'is-bad' : 'is-dim'}`}
              x={colX(0) + 14}
              y={colY + colH - 12}
            >
              {kind === 'none' ? 'no SQL metacharacters' : 'carries SQL metacharacters'}
            </text>
          </g>

          {/* arrow 1 -> 2 */}
          <g>
            <line
              className="siv-flow"
              x1={colX(0) + colW + 3}
              y1={colY + colH / 2}
              x2={colX(1) - 6}
              y2={colY + colH / 2}
              markerEnd="url(#siv-arrow)"
            />
            <g transform={`translate(${colX(0) + colW + gap / 2 - 7}, ${colY + colH / 2 - 21})`}>
              {param
                ? <Braces width={14} height={14} className="siv-flow-ic" />
                : <Database width={14} height={14} className="siv-flow-ic" />}
            </g>
            <text className="siv-flow-tag" x={colX(0) + colW + gap / 2} y={colY + colH / 2 + 22} textAnchor="middle">
              {routeTag}
            </text>
          </g>

          {/* column 2 — how the query is built */}
          <g>
            <rect
              className={`siv-col is-query ${built ? (param ? 'is-ok' : (exploited ? 'is-bad' : 'is-neutral')) : ''}`}
              x={colX(1)}
              y={colY}
              width={colW}
              height={colH}
              rx={9}
            />
            <text className="siv-col-tag" x={colX(1) + 14} y={colY + 20}>QUERY · as built</text>

            {!built && (
              <text className="siv-mono is-dim" x={colX(1) + 14} y={colY + 56}>waiting to build…</text>
            )}

            {built && !param && (
              <>
                <text className="siv-mono" x={colX(1) + 14} y={colY + 52}>SELECT * FROM users</text>
                <text className="siv-mono" x={colX(1) + 14} y={colY + 72}>
                  <tspan>WHERE name = &apos;</tspan>
                  <tspan className={parsed && kind !== 'none' ? 'siv-inject' : 'siv-value'}>{clip(input, 16)}</tspan>
                  <tspan>&apos;</tspan>
                </text>
                {parsed && kind !== 'none' && (
                  <text className="siv-inject-note" x={colX(1) + 14} y={colY + 94}>↑ input parsed as SQL syntax</text>
                )}
              </>
            )}

            {built && param && (
              <>
                <text className="siv-mono" x={colX(1) + 14} y={colY + 52}>SELECT * FROM users</text>
                <text className="siv-mono" x={colX(1) + 14} y={colY + 72}>
                  <tspan>WHERE name = </tspan>
                  <tspan className="siv-ph">?</tspan>
                </text>
                <rect className="siv-data-box" x={colX(1) + 14} y={colY + 86} width={colW - 28} height={30} rx={6} />
                <text className="siv-data-label" x={colX(1) + 22} y={colY + 100}>bound data</text>
                <text className="siv-mono is-ok" x={colX(1) + 22} y={colY + 113}>
                  ? = &quot;{clip(input, 18)}&quot;
                </text>
              </>
            )}

            <text
              className={`siv-col-foot is-${built ? (param ? 'ok' : (exploited ? 'bad' : 'dim')) : 'dim'}`}
              x={colX(1) + 14}
              y={colY + colH - 12}
            >
              {!built
                ? 'query not built yet'
                : (param
                  ? 'code and data on separate channels'
                  : (exploited ? 'input fused into the query text' : 'input concatenated into the text'))}
            </text>
          </g>

          {/* arrow 2 -> 3 */}
          <g>
            <line
              className="siv-flow"
              x1={colX(1) + colW + 3}
              y1={colY + colH / 2}
              x2={colX(2) - 6}
              y2={colY + colH / 2}
              markerEnd="url(#siv-arrow)"
            />
            <text className="siv-flow-tag" x={colX(1) + colW + gap / 2} y={colY + colH / 2 - 8} textAnchor="middle">
              {parsed ? 'execute' : '…'}
            </text>
          </g>

          {/* column 3 — verdict */}
          <g>
            <rect
              className={`siv-col is-verdict ${decided ? `is-${verdict.t}` : ''}`}
              x={colX(2)}
              y={colY}
              width={colW}
              height={colH}
              rx={9}
            />
            <text className="siv-col-tag" x={colX(2) + 14} y={colY + 20}>RESULT</text>

            <g transform={`translate(${colX(2) + colW / 2 - 14}, ${colY + 40})`}>
              {!decided && <Table2 width={28} height={28} className="siv-verdict-ic is-dim" />}
              {decided && verdict.t === 'bad' && <ShieldAlert width={28} height={28} className="siv-verdict-ic is-bad" />}
              {decided && verdict.t === 'ok' && <ShieldCheck width={28} height={28} className="siv-verdict-ic is-ok" />}
            </g>

            <text
              className={`siv-verdict-text is-${decided ? verdict.t : 'dim'}`}
              x={colX(2) + colW / 2}
              y={colY + 100}
              textAnchor="middle"
            >
              {decided ? verdict.text : 'pending'}
            </text>
            {decided && (
              <text className={`siv-verdict-detail is-${verdict.t}`} x={colX(2) + colW / 2} y={colY + 124} textAnchor="middle">
                {verdict.detail}
              </text>
            )}
          </g>

          <defs>
            <marker id="siv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="siv-ah" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="siv-readouts">
        <div className="siv-metric">
          <span className="siv-metric-label">build mode</span>
          <span className={`siv-metric-value ${param ? 'is-ok' : 'is-bad'}`}>
            {param ? 'parameterized' : 'concatenated'}
          </span>
        </div>
        <div className="siv-metric">
          <span className="siv-metric-label">input classified</span>
          <span className="siv-metric-value">
            {kind === 'none' ? 'plain value' : kind === 'tautology' ? 'tautology payload' : kind === 'stacked' ? 'stacked query' : kind === 'comment' ? 'comment bypass' : 'quote breakout'}
          </span>
        </div>
        <div className="siv-metric">
          <span className="siv-metric-label">input became SQL?</span>
          <span className={`siv-metric-value ${decided ? (exploited ? 'is-bad' : 'is-ok') : 'is-dim'}`}>
            {decided ? (exploited ? 'yes' : 'no') : 'not yet'}
          </span>
        </div>
        <div className="siv-metric siv-metric-dim">
          <span className="siv-metric-label">verdict</span>
          <span className={`siv-metric-value is-${decided ? tone : 'dim'}`}>
            {decided ? (exploited ? 'injection fires' : 'safe') : 'pending'}
          </span>
        </div>
      </div>

      <div className={`siv-narration is-${stepKey === 'run' ? tone : 'accent'}`}>
        <span className="siv-narration-label">{STEP_META[Math.min(step, TOTAL_STEPS - 1)].label}</span>
        <span className="siv-narration-body">{STEP_NOTE[stepKey]}</span>
      </div>

      <div className="siv-legend">
        <span className="siv-legend-item"><Database size={13} className="siv-ic is-bad" /> concatenation — input parsed as SQL</span>
        <span className="siv-legend-item"><Braces size={13} className="siv-ic is-ok" /> parameterized — input bound as data</span>
        <span className="siv-legend-item"><ShieldAlert size={13} className="siv-ic is-bad" /> injection fires — auth bypass / DROP</span>
        <span className="siv-legend-item"><KeyRound size={13} className="siv-ic is-ok" /> placeholder keeps code and data apart</span>
      </div>
    </div>
  );
}
