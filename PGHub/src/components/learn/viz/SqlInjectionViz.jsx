import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck,
  ShieldAlert, Database, Table, Bug, Lock, AlertTriangle, Check,
} from 'lucide-react';
import './SqlInjectionViz.css';

// String-concatenation SQL is the classic injection bug. The query template
//   SELECT * FROM users WHERE username = '<input>'
// embeds the raw input INSIDE the string literal. Feed it ' OR '1'='1 and the
// closing quote ends the literal early, OR '1'='1 becomes part of the WHERE
// clause, and the predicate is now always true -> every row leaks. Feed it
// '; DROP TABLE users;-- and the statement terminator lets a second command
// run. The parameterized fix sends the SQL skeleton (with a ? placeholder) and
// the input SEPARATELY as a bound value; the database treats the input as inert
// data — a literal username to match — and never parses it as SQL.

const USERS = [
  { id: 1, username: 'alice', role: 'user', email: 'alice@corp.io' },
  { id: 2, username: 'bob', role: 'user', email: 'bob@corp.io' },
  { id: 3, username: 'carol', role: 'editor', email: 'carol@corp.io' },
  { id: 4, username: 'admin', role: 'admin', email: 'admin@corp.io' },
];

const PRESETS = [
  { label: 'normal: alice', value: 'alice', tone: 'safe' },
  { label: "' OR '1'='1", value: "' OR '1'='1", tone: 'danger' },
  { label: "'; DROP TABLE users;--", value: "'; DROP TABLE users;--", tone: 'danger' },
  { label: "admin'--", value: "admin'--", tone: 'danger' },
];

const TEMPLATE_PREFIX = "SELECT * FROM users WHERE username = '";
const TEMPLATE_SUFFIX = "'";
const SAFE_TEMPLATE = 'SELECT * FROM users WHERE username = ?';

// Deterministic classification of what the input does in vulnerable mode.
// No randomness — the effect is a pure function of the input string.
function classifyInjection(raw) {
  const v = raw.trim();
  const lower = v.toLowerCase();
  if (/;\s*drop\s+table/i.test(lower)) {
    return { kind: 'drop', injected: v, breaksOut: true };
  }
  // A lone quote followed by a tautology, or a comment that swallows the rest.
  if (/'\s*or\s*'?1'?\s*=\s*'?1/i.test(lower)) {
    return { kind: 'tautology', injected: v, breaksOut: true };
  }
  if (/'\s*--/.test(v) || /'\s*#/.test(v)) {
    return { kind: 'comment', injected: v, breaksOut: true };
  }
  if (v.includes("'")) {
    return { kind: 'quote', injected: v, breaksOut: true };
  }
  return { kind: 'literal', injected: v, breaksOut: false };
}

// Rows the DB would actually return / the side effect, deterministically.
function evalEffect(mode, raw) {
  const cls = classifyInjection(raw);
  if (mode === 'safe') {
    const match = USERS.filter((u) => u.username === raw);
    return {
      rows: match,
      dropped: false,
      tone: match.length ? 'safe' : 'neutral',
      summary: match.length
        ? `${match.length} row matched — input compared as a literal username`
        : '0 rows — input treated as a literal username, no SQL parsed',
    };
  }
  // vulnerable
  if (cls.kind === 'drop') {
    return { rows: [], dropped: true, tone: 'danger', summary: 'table dropped — second statement executed' };
  }
  if (cls.kind === 'tautology') {
    return { rows: USERS.slice(), dropped: false, tone: 'danger', summary: `WHERE TRUE -> all ${USERS.length} rows leaked` };
  }
  if (cls.kind === 'comment') {
    // admin'-- closes the quote, comments out the rest -> matches that name only
    const head = raw.split("'")[0];
    const match = USERS.filter((u) => u.username === head);
    return {
      rows: match,
      dropped: false,
      tone: 'danger',
      summary: match.length
        ? `auth bypassed — matched ${head} with no password check`
        : 'comment swallowed the rest of the query',
    };
  }
  if (cls.kind === 'quote') {
    return { rows: [], dropped: false, tone: 'danger', summary: 'syntax error / broken literal — quote escaped the string' };
  }
  const match = USERS.filter((u) => u.username === raw);
  return {
    rows: match,
    dropped: false,
    tone: match.length ? 'safe' : 'neutral',
    summary: match.length ? `${match.length} row matched` : '0 rows — no such username',
  };
}

const STEP_META = [
  { key: 'template', label: 'build template' },
  { key: 'substitute', label: 'substitute input' },
  { key: 'parse', label: 'DB parses' },
  { key: 'result', label: 'result' },
];
const TOTAL_STEPS = STEP_META.length;
const RUN_DELAY_MS = 1600;

function noteFor(stepKey, mode, raw, effect, cls) {
  if (stepKey === 'template') {
    return mode === 'safe'
      ? 'The safe path ships the SQL skeleton with a ? placeholder where the value goes. The structure of the query is fixed before the input is ever seen.'
      : 'The vulnerable path builds the query by gluing strings together. The input will be dropped straight inside the quoted string literal — the database has no way to tell the two apart later.';
  }
  if (stepKey === 'substitute') {
    return mode === 'safe'
      ? 'The driver sends the query and the value over separate channels. The input rides along as a bound parameter — pure data, quoted and escaped by the protocol, never spliced into the SQL text.'
      : `The input is concatenated in. Notice the closing quote: ${raw.includes("'") ? 'your input contains its own quote, so it ends the string literal early and the rest spills into the command.' : 'with a plain value the literal stays intact — but any quote in the input would break out.'}`;
  }
  if (stepKey === 'parse') {
    if (mode === 'safe') {
      return 'The database parses the fixed query once, then binds the value into the placeholder slot. The value is matched as a literal username; it is never tokenized as SQL keywords or operators.';
    }
    if (cls.breaksOut) {
      return cls.kind === 'drop'
        ? 'The parser sees the statement terminator, finishes the SELECT, then reads DROP TABLE users as a brand-new command. The trailing -- comments out whatever follows. Two statements, one input box.'
        : 'The injected fragment is now parsed as SQL, not data. The highlighted text became part of the WHERE clause — the predicate the attacker wrote, not the one you wrote.';
    }
    return 'A plain value stays inside the literal, so the parser reads exactly the query you intended.';
  }
  // result
  return mode === 'safe'
    ? `Bound as data: ${effect.summary}. The same payload that leaked everything in vulnerable mode does nothing here.`
    : `${effect.summary}. Concatenation handed the attacker the keyboard.`;
}

export default function SqlInjectionViz() {
  const [mode, setMode] = useState('vuln');
  const [input, setInput] = useState("' OR '1'='1");
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const cls = useMemo(() => classifyInjection(input), [input]);
  const effect = useMemo(() => evalEffect(mode, input), [mode, input]);

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

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const setInputAndReset = (v) => {
    setIsRunning(false);
    setStep(0);
    setInput(v);
  };

  const setModeAndReset = (m) => {
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Run');

  const vuln = mode === 'vuln';
  const substituted = reached('substitute');
  const parsed = reached('parse');
  const resulted = reached('result');

  // The final query string the DB parses, split so the injected fragment can
  // be highlighted in vulnerable mode.
  const breaksOut = vuln && cls.breaksOut;

  const note = noteFor(stepKey, mode, input, effect, cls);

  // SVG geometry.
  const W = 940;
  const H = 220;
  const padX = 22;
  const rowW = W - padX * 2;
  const rowH = 50;
  const gap = 14;
  const rowY = (i) => 16 + i * (rowH + gap);

  // Wrap a long SQL string into chunks so it never overflows the SVG width.
  const wrapSql = (s, max = 64) => {
    if (s.length <= max) return [s];
    const out = [];
    let rest = s;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(' ', max);
      if (cut <= 0) cut = max;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut).replace(/^\s/, '');
    }
    if (rest) out.push(rest);
    return out;
  };

  const finalQueryLines = vuln
    ? wrapSql(`${TEMPLATE_PREFIX}${input}${TEMPLATE_SUFFIX}`)
    : wrapSql(SAFE_TEMPLATE);

  const toneClass = vuln ? (effect.tone === 'danger' ? 'is-bad' : 'is-ok') : 'is-ok';
  const narrTone = !resulted
    ? (vuln ? 'accent' : 'ok')
    : vuln
      ? (effect.tone === 'danger' ? 'bad' : 'ok')
      : 'ok';

  return (
    <div className="sqlv">
      <div className="sqlv-head">
        <h3 className="sqlv-title">SQL injection — when input becomes code</h3>
        <p className="sqlv-sub">
          Type a username, or pick a payload, and watch a concatenated query let it break out of the
          string and run as SQL. Flip to the parameterized fix and the same payload is bound as inert data.
        </p>
      </div>

      <div className="sqlv-controls">
        <div className="sqlv-input-wrap" role="group" aria-label="Attacker-controlled input">
          <span className="sqlv-input-label">username input</span>
          <input
            type="text"
            className="sqlv-text"
            value={input}
            onChange={(e) => setInputAndReset(e.target.value)}
            spellCheck={false}
            aria-label="Username input field"
            placeholder="type a username or payload"
          />
        </div>

        <div className="sqlv-presets" role="group" aria-label="Preset payloads">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`sqlv-preset ${p.tone === 'danger' ? 'is-danger' : ''} ${input === p.value ? 'is-active' : ''}`}
              onClick={() => setInputAndReset(p.value)}
              title={p.tone === 'danger' ? 'Malicious payload' : 'Benign username'}
            >
              {p.tone === 'danger' ? <Bug size={12} /> : <Check size={12} />}
              {p.label}
            </button>
          ))}
        </div>

        <div className="sqlv-mode" role="group" aria-label="Query mode">
          <button
            type="button"
            className={`sqlv-mode-btn ${vuln ? 'is-on is-bad' : ''}`}
            onClick={() => setModeAndReset('vuln')}
            aria-pressed={vuln}
          >
            <ShieldAlert size={13} /> Vulnerable
          </button>
          <button
            type="button"
            className={`sqlv-mode-btn ${!vuln ? 'is-on is-ok' : ''}`}
            onClick={() => setModeAndReset('safe')}
            aria-pressed={!vuln}
          >
            <ShieldCheck size={13} /> Safe (parameterized)
          </button>
        </div>

        <span className="sqlv-spacer" aria-hidden="true" />

        <label className="sqlv-speed">
          <span className="sqlv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="sqlv-speed-range"
            aria-label="Playback speed"
          />
          <span className="sqlv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="sqlv-buttons">
          <button
            type="button"
            className="sqlv-btn sqlv-btn-primary"
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
            className="sqlv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="sqlv-btn"
            onClick={() => setStep(TOTAL_STEPS - 1)}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sqlv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="sqlv-stepcount">
          step <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      <div className="sqlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sqlv-svg" preserveAspectRatio="xMidYMid meet">
          {/* row 1 — template */}
          <g>
            <rect className="sqlv-row" x={padX} y={rowY(0)} width={rowW} height={rowH} rx={8} />
            <text className="sqlv-row-tag" x={padX + 12} y={rowY(0) + 16}>
              {vuln ? 'TEMPLATE · string-concatenated' : 'TEMPLATE · parameterized'}
            </text>
            <text className="sqlv-row-body" x={padX + 12} y={rowY(0) + 37}>
              {vuln ? (
                <>
                  <tspan>{TEMPLATE_PREFIX}</tspan>
                  <tspan className="sqlv-slot">[input]</tspan>
                  <tspan>{TEMPLATE_SUFFIX}</tspan>
                </>
              ) : (
                <tspan>{SAFE_TEMPLATE}</tspan>
              )}
            </text>
          </g>

          {/* row 2 — substitute / bind */}
          <g>
            <rect
              className={`sqlv-row ${substituted ? 'is-active' : ''}`}
              x={padX} y={rowY(1)} width={rowW} height={rowH} rx={8}
            />
            <text className="sqlv-row-tag" x={padX + 12} y={rowY(1) + 16}>
              {vuln ? 'SUBSTITUTE · input spliced into the string' : 'BIND · input sent as a separate value'}
            </text>
            {!substituted && (
              <text className="sqlv-row-body is-dim" x={padX + 12} y={rowY(1) + 37}>
                waiting — press Step or Run
              </text>
            )}
            {substituted && vuln && (
              <text className="sqlv-row-body" x={padX + 12} y={rowY(1) + 37}>
                <tspan>{TEMPLATE_PREFIX}</tspan>
                <tspan className={breaksOut ? 'sqlv-inject' : 'sqlv-data'}>{input}</tspan>
                <tspan>{TEMPLATE_SUFFIX}</tspan>
              </text>
            )}
            {substituted && !vuln && (
              <text className="sqlv-row-body" x={padX + 12} y={rowY(1) + 37}>
                <tspan>{SAFE_TEMPLATE.replace('?', '')}</tspan>
                <tspan className="sqlv-ph">?</tspan>
                <tspan className="sqlv-row-body">{'   bind 1 = '}</tspan>
                <tspan className="sqlv-data">{`'${input}'`}</tspan>
                <tspan className="sqlv-row-body is-dim">{'  (inert data)'}</tspan>
              </text>
            )}
          </g>

          {/* row 3 — what the DB parses */}
          <g>
            <rect
              className={`sqlv-row ${parsed ? (breaksOut ? 'is-bad' : 'is-ok') : ''}`}
              x={padX} y={rowY(2)} width={rowW} height={rowH + (finalQueryLines.length > 1 ? 16 : 0)} rx={8}
            />
            <text className="sqlv-row-tag" x={padX + 12} y={rowY(2) + 16}>
              DB PARSES · {parsed ? (vuln ? (breaksOut ? 'injected fragment is now SQL' : 'literal value') : 'placeholder + bound value') : 'not yet'}
            </text>
            {!parsed && (
              <text className="sqlv-row-body is-dim" x={padX + 12} y={rowY(2) + 37}>
                waiting — press Step or Run
              </text>
            )}
            {parsed && vuln && finalQueryLines.map((line, i) => (
              <text
                key={`fq-${i}`}
                className="sqlv-row-body"
                x={padX + 12}
                y={rowY(2) + 37 + i * 16}
              >
                {i === 0 ? (
                  <>
                    <tspan>{TEMPLATE_PREFIX}</tspan>
                    <tspan className={breaksOut ? 'sqlv-inject' : 'sqlv-data'}>{input}</tspan>
                    <tspan>{TEMPLATE_SUFFIX}</tspan>
                  </>
                ) : line}
              </text>
            ))}
            {parsed && !vuln && (
              <text className="sqlv-row-body" x={padX + 12} y={rowY(2) + 37}>
                <tspan>SELECT * FROM users WHERE username = </tspan>
                <tspan className="sqlv-data">{`'${input}'`}</tspan>
                <tspan className="sqlv-row-body is-dim">{'  ← matched as one literal string'}</tspan>
              </text>
            )}
          </g>
        </svg>
      </div>

      <div className="sqlv-lower">
        {/* the users table */}
        <div className={`sqlv-table-card ${resulted && effect.dropped ? 'is-dropped' : ''}`}>
          <div className="sqlv-table-head">
            <Table size={13} className="sqlv-ic" />
            <span className="sqlv-table-title">users table</span>
            <span className={`sqlv-table-status ${resulted ? toneClass : ''}`}>
              {resulted
                ? (effect.dropped ? 'DROPPED' : `${effect.rows.length} / ${USERS.length} rows returned`)
                : `${USERS.length} rows`}
            </span>
          </div>
          {effect.dropped && resulted ? (
            <div className="sqlv-table-gone">
              <AlertTriangle size={15} /> table users no longer exists — the second statement destroyed it
            </div>
          ) : (
            <div className="sqlv-rows">
              <div className="sqlv-tr is-head">
                <span>id</span><span>username</span><span>role</span><span>email</span>
              </div>
              {USERS.map((u) => {
                const leaked = resulted && effect.rows.some((r) => r.id === u.id);
                const dim = resulted && !leaked && !effect.dropped;
                return (
                  <div
                    key={u.id}
                    className={`sqlv-tr ${leaked ? (vuln && effect.tone === 'danger' ? 'is-leaked' : 'is-match') : ''} ${dim ? 'is-dim' : ''}`}
                  >
                    <span>{u.id}</span>
                    <span>{u.username}</span>
                    <span>{u.role}</span>
                    <span>{u.email}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sqlv-metrics">
          <div className="sqlv-metric">
            <span className="sqlv-metric-label">mode</span>
            <span className={`sqlv-metric-value ${vuln ? 'is-bad' : 'is-ok'}`}>
              {vuln ? 'vulnerable · concatenated' : 'safe · parameterized'}
            </span>
          </div>
          <div className="sqlv-metric">
            <span className="sqlv-metric-label">input parsed as</span>
            <span className={`sqlv-metric-value ${breaksOut ? 'is-bad' : 'is-ok'}`}>
              {vuln ? (breaksOut ? 'SQL — broke out of the literal' : 'data — stayed a literal') : 'data — bound value'}
            </span>
          </div>
          <div className="sqlv-metric">
            <span className="sqlv-metric-label">effect</span>
            <span className={`sqlv-metric-value ${resulted ? (vuln && effect.tone === 'danger' ? 'is-bad' : 'is-ok') : 'is-pending'}`}>
              {resulted ? effect.summary : 'pending'}
            </span>
          </div>
          <div className="sqlv-metric sqlv-metric-dim">
            <span className="sqlv-metric-label">payload type</span>
            <span className="sqlv-metric-value">
              {cls.kind === 'literal' ? 'plain value' : cls.kind === 'drop' ? 'stacked DROP' : cls.kind === 'tautology' ? "OR '1'='1 tautology" : cls.kind === 'comment' ? "comment (--) bypass" : 'stray quote'}
            </span>
          </div>
        </div>
      </div>

      <div className={`sqlv-narration is-${narrTone}`}>
        <span className="sqlv-narration-label">{STEP_META[Math.min(step, TOTAL_STEPS - 1)].label}</span>
        <span className="sqlv-narration-body">{note}</span>
      </div>

      <div className="sqlv-legend">
        <span className="sqlv-legend-item"><Database size={13} className="sqlv-ic" /> query template — the SQL skeleton</span>
        <span className="sqlv-legend-item"><Bug size={13} className="sqlv-ic is-bad" /> injected fragment — input parsed as SQL</span>
        <span className="sqlv-legend-item"><Lock size={13} className="sqlv-ic is-ok" /> bound value — input kept as inert data</span>
        <span className="sqlv-legend-item"><AlertTriangle size={13} className="sqlv-ic is-warn" /> all rows leaked / table dropped</span>
        <span className="sqlv-legend-item"><Check size={13} className="sqlv-ic is-ok" /> parameterized = same payload, no harm</span>
      </div>
    </div>
  );
}
