import React, { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  ChevronRight, ChevronDown, Play, Loader2, Terminal, Lightbulb, Check,
  FileText, ListChecks, Sparkles, FlaskConical, Layers, Target, BookOpen,
  CheckCircle2, XCircle, MinusCircle, AlertTriangle,
} from 'lucide-react';
import { getForgeProblem } from './pgForgeProblemsData';
import { isSolved, markSolved, unmarkSolved } from './forgeProgressStore';
import { runCode } from '../../../lib/codeRunner';
import RunnableCodePanel from '../../RunnableCodePanel';
import ActivationExplorerViz from '../viz/ActivationExplorerViz';
import './PGForgeProblemDetail.css';

// Per-problem identity hue — rotate the four hue tokens by a stable hash of the slug.
const HUE_TOKENS = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];
function identityHue(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return HUE_TOKENS[h % HUE_TOKENS.length];
}

// Map a problem to an inline concept viz when a sensible match exists. Each entry
// is { Comp, props } rendered inside the statement area; null = no viz for this slug.
function inlineVizFor(slug) {
  const activation = {
    'sigmoid-tanh': 'sigmoid',
    gelu: 'gelu',
    'relu-family': 'relu',
    'silu-swish': 'sigmoid',
    'leaky-relu': 'leaky',
  };
  if (slug in activation) {
    return { Comp: ActivationExplorerViz, props: { fn: activation[slug] }, label: 'Explore the activation' };
  }
  return null;
}

function katexHtml(tex, displayMode) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

// Render a markdown-ish statement: paragraphs, **bold**, `code`, ordered lists,
// inline \(...\) and display \[...\] math via KaTeX. No raw backslashes survive.
function renderStatement(text) {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    const displayMatch = trimmed.match(/^\\\[([\s\S]*?)\\\]$/);
    if (displayMatch) {
      return (
        <div
          key={bi}
          className="forge-pd-math"
          dangerouslySetInnerHTML={{ __html: katexHtml(displayMatch[1].trim(), true) }}
        />
      );
    }

    const lines = trimmed.split('\n');
    const isOrdered = lines.every((l) => /^\s*\d+\.\s/.test(l));
    if (isOrdered) {
      return (
        <ol key={bi} className="forge-pd-ol">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*\d+\.\s/, ''))}</li>
          ))}
        </ol>
      );
    }

    return <p key={bi} className="forge-pd-p">{renderInline(trimmed)}</p>;
  });
}

// Inline pass: split on \(...\) math, then format **bold** and `code` in the rest.
function renderInline(text) {
  const parts = [];
  const re = /\\\(([\s\S]*?)\\\)/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(...formatRich(text.slice(last, m.index), key++));
    parts.push(
      <span
        key={`m${key++}`}
        className="forge-pd-imath"
        dangerouslySetInnerHTML={{ __html: katexHtml(m[1].trim(), false) }}
      />,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(...formatRich(text.slice(last), key++));
  return parts;
}

function formatRich(chunk, baseKey) {
  const out = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(chunk)) !== null) {
    if (m.index > last) out.push(chunk.slice(last, m.index));
    if (m[2] !== undefined) out.push(<strong key={`b${baseKey}-${k++}`}>{m[2]}</strong>);
    else out.push(<code key={`c${baseKey}-${k++}`} className="forge-pd-code">{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < chunk.length) out.push(chunk.slice(last));
  return out;
}

const STATUS_LABEL = {
  success: 'Ran successfully',
  compile_error: 'Compile error',
  runtime_error: 'Runtime error',
  time_limit: 'Time limit exceeded',
};

// Sentinels framing the auto-grader output so the user's own module-level prints
// stay separate from the per-test verdicts. Chosen to be vanishingly unlikely in
// real stdout.
const HARNESS_BEGIN = '@@PGFORGE_TESTS_BEGIN@@';
const HARNESS_LINE = '@@PGFORGE_CASE@@';

// Collect every top-level `def name(params):` in the starter so we can pick the
// real entry point (some problems define helpers like `sigmoid` before the real
// function). Returns [{ name, params, required }] where params is the ordered list
// of the signature's parameter names (annotations stripped, *args/**kw skipped) and
// `required` is the subset that has no default — used to skip under-specified tests.
function topLevelDefs(starter) {
  const defs = [];
  const re = /^def\s+([A-Za-z_]\w*)\s*\(([\s\S]*?)\)\s*(?:->[^\n:]*)?:/gm;
  let m;
  while ((m = re.exec(starter || '')) !== null) {
    const params = [];
    const required = new Set();
    let depth = 0;
    let buf = '';
    const flush = () => {
      const raw = buf.trim();
      buf = '';
      if (!raw || raw.startsWith('*')) return;
      const hasDefault = raw.includes('=');
      const name = raw.split('=')[0].split(':')[0].trim();
      if (!name) return;
      params.push(name);
      if (!hasDefault) required.add(name);
    };
    for (const ch of m[2]) {
      if (ch === '[' || ch === '(' || ch === '{') depth += 1;
      else if (ch === ']' || ch === ')' || ch === '}') depth -= 1;
      if (ch === ',' && depth === 0) flush();
      else buf += ch;
    }
    flush();
    defs.push({ name: m[1], params, required });
  }
  return defs;
}

// Pull the kwarg names a test input references (`X=..., y=...` -> ['X','y']).
function referencedNames(input) {
  const names = [];
  const re = /(?:^|,)\s*([A-Za-z_]\w*)\s*=/g;
  let m;
  while ((m = re.exec(String(input || ''))) !== null) names.push(m[1]);
  return names;
}

// Choose the entry function: the top-level def whose parameter list best covers
// the names the tests reference (helpers like `sigmoid(z)` lose to the real
// `logistic_regression(X, y, ...)`). Falls back to the last top-level def.
function entryFn(starter, tests) {
  const defs = topLevelDefs(starter);
  if (defs.length === 0) return null;
  if (defs.length === 1) return defs[0];
  const wanted = new Set();
  (tests || []).forEach((t) => referencedNames(t.input).forEach((n) => wanted.add(n)));
  let best = defs[defs.length - 1];
  let bestScore = -1;
  defs.forEach((d) => {
    let score = 0;
    d.params.forEach((p) => { if (wanted.has(p)) score += 1; });
    if (score > bestScore) { bestScore = score; best = d; }
  });
  return best;
}

// Split a string on top-level commas, respecting [] () {} nesting and quotes.
function splitTopLevel(s) {
  const parts = [];
  let depth = 0;
  let quote = '';
  let buf = '';
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (quote) {
      buf += ch;
      if (ch === quote && s[i - 1] !== '\\') quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === '[' || ch === '(' || ch === '{') depth += 1;
    else if (ch === ']' || ch === ')' || ch === '}') depth -= 1;
    if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; } else buf += ch;
  }
  if (buf.trim() !== '' || parts.length > 0) parts.push(buf);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

// Is `v` valid Python literal-argument syntax we can hand to eval safely? Accepts
// numbers (incl. floats, scientific, signs), bools/None, quoted strings, and
// lists/tuples/dicts whose contents are themselves literals. Rejects barewords,
// names, calls (np.array(...)), and `3x3`-style junk.
function isLiteral(v) {
  const s = String(v).trim();
  if (s === '') return false;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return true;
  if (/^(True|False|None)$/.test(s)) return true;
  if (/^'[^']*'$/.test(s) || /^"[^"]*"$/.test(s)) return true;
  if (/^[[({]/.test(s) && /[\])}]$/.test(s)) {
    // Bracketed: every comma-separated (and dict-colon) piece must be a literal.
    const inner = s.slice(1, -1).trim();
    if (inner === '') return true;
    return splitTopLevel(inner).every((piece) => {
      const kv = piece.split(/:(.*)/s);
      if (kv.length >= 2 && /^[[({]/.test(s) && s[0] === '{') {
        return isLiteral(kv[0]) && isLiteral(kv[1]);
      }
      return isLiteral(piece);
    });
  }
  return false;
}

// A bare identifier that real tests use as a string positional (e.g. `relu`,
// `leaky`, `sigmoid`, `tanh` for a `kind=` param) — we quote it into a string.
function isBareWord(v) {
  return /^[A-Za-z_]\w*$/.test(String(v).trim());
}

// Strip an optional leading `LABEL:` or descriptive `phrase, ` prefix, but ONLY
// when removing it leaves a string that starts with a kwarg or a literal. A bare
// descriptive phrase like `single key` (no following parseable args we can map)
// is left intact so the case is honestly skipped rather than mis-parsed.
function stripPrefix(s) {
  const colon = /^[^=,]*?:\s+/.exec(s);
  if (colon) {
    const rest = s.slice(colon[0].length).trim();
    if (/^[A-Za-z_]\w*\s*=/.test(rest) || isLiteral(rest.split(',')[0].trim())) return rest;
  }
  return s;
}

// Expand a chained assignment `Q=K=expr` into `Q=expr, K=expr` so shared-tensor
// tests grade. Only triggers when the LHS names are simple identifiers.
function expandChained(seg) {
  const m = /^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/.exec(seg.trim());
  if (!m) return [seg];
  return [`${m[1]}=${m[3]}`, `${m[2]}=${m[3]}`];
}

// Turn a test's display string into a Python call-argument source. Strategy: build
// an all-keyword call mapped through the entry function's signature so positional,
// mixed, bare-word, and chained inputs all normalize cleanly. Returns the argument
// source (e.g. "xs=[1,2,3], kind='relu'") or null when genuinely unsupported
// (unparseable literal, missing required arg, custom-class reference) — those are
// reported "skipped", never faked into a pass.
function parseCall(input, fn) {
  if (!input || !fn) return null;
  const params = fn.params || [];
  let s = stripPrefix(String(input).trim());

  let segments = [];
  splitTopLevel(s).forEach((seg) => { segments = segments.concat(expandChained(seg)); });
  if (segments.length === 0) return null;

  const kwargs = new Map();
  const positional = [];
  let seenKw = false;
  for (const seg of segments) {
    const eq = /^([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/.exec(seg);
    if (eq) {
      seenKw = true;
      const name = eq[1];
      const val = eq[2].trim();
      if (isLiteral(val)) kwargs.set(name, val);
      else if (isBareWord(val)) kwargs.set(name, `'${val}'`);
      else return null;
    } else if (isLiteral(seg)) {
      positional.push(seg);
    } else if (isBareWord(seg)) {
      positional.push(`'${seg}'`);
    } else {
      return null;
    }
  }

  const required = fn.required || new Set();
  const missingRequired = (filled) => [...required].some((p) => !filled.has(p));

  // Pure keyword form: emit directly (unless a required param was left unfilled —
  // that would raise a misleading TypeError, so skip it honestly instead).
  if (positional.length === 0) {
    if (kwargs.size === 0) return null;
    if (params.length > 0 && missingRequired(kwargs)) return null;
    return [...kwargs.entries()].map(([k, v]) => `${k}=${v}`).join(', ');
  }

  // Positional present: map everything to keywords via the signature so a mix of
  // `xs=..., relu` becomes `xs=..., kind='relu'` (valid Python; mixed order isn't).
  if (params.length === 0) {
    if (seenKw) return null;
    return positional.join(', ');
  }
  const free = params.filter((p) => !kwargs.has(p));
  if (positional.length > free.length) return null;
  positional.forEach((v, i) => kwargs.set(free[i], v));
  if (missingRequired(kwargs)) return null;
  // Preserve signature order for readability.
  const ordered = params.filter((p) => kwargs.has(p)).map((p) => `${p}=${kwargs.get(p)}`);
  return ordered.join(', ');
}

// Build a single Python program: the user's code, then a grader block that calls
// the entry function once per parseable test and prints a sentinel-delimited
// verdict line. Float-tolerant comparison happens IN Python (eval expected vs
// actual, round nested floats) so precision noise doesn't read as a failure.
function buildHarness(userCode, fnName, cases) {
  const py = JSON.stringify(cases.map((c) => ({ k: c.args, e: c.expected })));
  return `${userCode}

# --- PGForge auto-grader (appended) ---
import json as _pgj
print(${JSON.stringify(HARNESS_BEGIN)})
def _pg_round(v):
    if isinstance(v, float):
        return round(v, 4)
    if isinstance(v, (list, tuple)):
        return [_pg_round(x) for x in v]
    if isinstance(v, dict):
        return {k: _pg_round(x) for k, x in v.items()}
    return v
def _pg_eq(a, b):
    try:
        return _pg_round(a) == _pg_round(b)
    except Exception:
        return repr(a) == repr(b)
_pg_cases = _pgj.loads(${JSON.stringify(py)})
for _pg_i, _pg_c in enumerate(_pg_cases):
    _pg_status = 'fail'
    _pg_got = ''
    try:
        _pg_actual = eval("${fnName}(" + _pg_c["k"] + ")")
        _pg_got = repr(_pg_actual)
        try:
            _pg_exp = eval(_pg_c["e"])
            _pg_status = 'pass' if _pg_eq(_pg_actual, _pg_exp) else 'fail'
        except Exception:
            _pg_status = 'pass' if str(_pg_actual) == _pg_c["e"] else 'fail'
    except Exception as _pg_err:
        _pg_status = 'error'
        _pg_got = type(_pg_err).__name__ + ': ' + str(_pg_err)
    print("${HARNESS_LINE}" + _pgj.dumps({"i": _pg_i, "s": _pg_status, "g": _pg_got}))
`;
}

// Split a harness run's stdout into the user's own output and the parsed verdicts.
function parseHarnessOutput(output) {
  const text = output || '';
  const at = text.indexOf(HARNESS_BEGIN);
  const userOut = (at >= 0 ? text.slice(0, at) : text).replace(/\n+$/, '');
  const verdicts = [];
  if (at >= 0) {
    for (const line of text.slice(at).split('\n')) {
      const idx = line.indexOf(HARNESS_LINE);
      if (idx < 0) continue;
      try {
        verdicts.push(JSON.parse(line.slice(idx + HARNESS_LINE.length)));
      } catch { /* malformed verdict line — skip */ }
    }
  }
  return { userOut, verdicts };
}

export default function PGForgeProblemDetail() {
  const { slug } = useParams();
  const problem = useMemo(() => getForgeProblem(slug), [slug]);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [solved, setSolved] = useState(() => (problem ? isSolved(problem.slug) : false));

  const toggleSolved = useCallback(() => {
    if (!problem) return;
    if (solved) {
      unmarkSolved(problem.slug);
      setSolved(false);
    } else {
      markSolved(problem.slug, problem.difficulty);
      setSolved(true);
    }
  }, [problem, solved]);

  const renderedStatement = useMemo(
    () => (problem ? renderStatement(problem.statement) : null),
    [problem],
  );

  const hue = useMemo(() => (problem ? identityHue(problem.slug) : 'var(--accent)'), [problem]);
  const inlineViz = useMemo(() => (problem ? inlineVizFor(problem.slug) : null), [problem]);

  // Resolve the entry function (best signature match across helpers), then for
  // each declared test decide whether its input marshals to a valid Python call
  // we can feed that function — or is genuinely unsupported (display-only).
  const fn = useMemo(
    () => (problem ? entryFn(problem.starterCode.python, problem.tests) : null),
    [problem],
  );
  const fnName = fn ? fn.name : null;
  const testPlan = useMemo(() => {
    if (!problem) return { checkable: [], display: [] };
    const checkable = [];
    const display = [];
    problem.tests.forEach((t, i) => {
      const args = fn ? parseCall(t.input, fn) : null;
      if (args != null) checkable.push({ index: i, args, expected: t.expected });
      else display.push(i);
    });
    return { checkable, display };
  }, [problem, fn]);

  // Submit feeds the current editor buffer to the python grader. Free execution is
  // handled by the panel's own Run button; grading is the canonical python path.
  const handleSubmit = useCallback(async (code, lang) => {
    if (!problem) return;
    if (lang !== 'python') {
      setReport(null);
      setResult({
        status: 'runtime_error',
        output: 'Grading runs against the Python reference. Switch to the Python tab to submit.',
      });
      return;
    }
    setRunning(true);
    setResult(null);
    setReport(null);
    try {
      const canGrade = fnName && testPlan.checkable.length > 0;
      const source = canGrade
        ? buildHarness(code, fnName, testPlan.checkable)
        : code;
      const out = await runCode(source, 'python', '');

      if (!out || out.status !== 'success') {
        setResult(out || { status: 'runtime_error', output: 'No response from the execution service.' });
        return;
      }

      if (!canGrade) {
        setResult(out);
        return;
      }

      const { userOut, verdicts } = parseHarnessOutput(out.output);
      const byIndex = new Map();
      verdicts.forEach((v) => {
        const planned = testPlan.checkable[v.i];
        if (planned) byIndex.set(planned.index, { status: v.s, got: v.g });
      });

      const rows = problem.tests.map((t, i) => {
        const graded = byIndex.get(i);
        if (graded) {
          return {
            index: i, input: t.input, expected: t.expected,
            status: graded.status, got: graded.got,
          };
        }
        return { index: i, input: t.input, expected: t.expected, status: 'skipped', got: '' };
      });
      const passed = rows.filter((r) => r.status === 'pass').length;
      const checked = rows.filter((r) => r.status !== 'skipped').length;
      const allPassed = checked > 0 && passed === checked;
      setReport({ rows, passed, checked, allPassed });
      setResult({ status: out.status, output: userOut });

      // Honest auto-mark: only when real grading shows every gradeable test
      // passing. Reuses the existing localStorage solve mechanism — no new
      // persistence plumbing.
      if (allPassed && !solved) {
        markSolved(problem.slug, problem.difficulty);
        setSolved(true);
      }
    } catch (err) {
      setResult({ status: 'runtime_error', output: err.message || String(err) });
    } finally {
      setRunning(false);
    }
  }, [problem, fnName, testPlan, solved]);

  const starter = useMemo(
    () => (problem ? { python: problem.starterCode.python } : {}),
    [problem],
  );

  if (!problem) return <Navigate to="/ml/problems" replace />;

  return (
    <div className="forge-pd" style={{ '--pd-hue': hue }}>
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <Link to="/ml/problems" className="forge-crumb-link">Problems</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">{problem.title}</span>
      </nav>

      <div className="forge-pd-grid">
        <section className="forge-pd-left" aria-label="Problem description">
          <header className="forge-pd-header">
            <div className="forge-pd-meta">
              <span className={`forge-pd-diff forge-pd-diff-${problem.difficulty}`}>
                {problem.difficulty}
              </span>
              <span className="forge-pd-chip forge-pd-chip-hue">{problem.topic}</span>
              {problem.category && problem.category !== problem.topic && (
                <span className="forge-pd-chip">{problem.category}</span>
              )}
            </div>
            <div className="forge-pd-title-row">
              <h1 className="forge-pd-title">{problem.title}</h1>
              <button
                type="button"
                className={`forge-pd-solve ${solved ? 'is-solved' : ''}`}
                onClick={toggleSolved}
                aria-pressed={solved}
              >
                <Check size={14} />
                {solved ? 'Solved' : 'Mark as solved'}
              </button>
            </div>

            <div className="forge-pd-facts">
              <div className="forge-pd-fact">
                <Target size={13} className="forge-pd-fact-ic" />
                <span className="forge-pd-fact-k">Topic</span>
                <span className="forge-pd-fact-v">{problem.topic}</span>
              </div>
              <div className="forge-pd-fact">
                <Layers size={13} className="forge-pd-fact-ic" />
                <span className="forge-pd-fact-k">Category</span>
                <span className="forge-pd-fact-v">{problem.category}</span>
              </div>
              <div className="forge-pd-fact">
                <FileText size={13} className="forge-pd-fact-ic" />
                <span className="forge-pd-fact-k">Examples</span>
                <span className="forge-pd-fact-v">{problem.examples.length}</span>
              </div>
              <div className="forge-pd-fact">
                <FlaskConical size={13} className="forge-pd-fact-ic" />
                <span className="forge-pd-fact-k">Test cases</span>
                <span className="forge-pd-fact-v">{problem.tests.length}</span>
              </div>
            </div>
          </header>

          <div className="forge-pd-stmt-card">
            <div className="forge-pd-stmt-eyebrow">
              <BookOpen size={12} />
              <span>The task</span>
            </div>
            <div className="forge-pd-statement">{renderedStatement}</div>
          </div>

          {inlineViz && (
            <div className="forge-pd-inlineviz">
              <div className="forge-pd-inlineviz-head">
                <Sparkles size={13} />
                <span>{inlineViz.label}</span>
              </div>
              <inlineViz.Comp {...inlineViz.props} />
            </div>
          )}

          <div className="forge-pd-block">
            <h2 className="forge-pd-sec"><FileText size={13} /> Examples</h2>
            <div className="forge-pd-examples">
              {problem.examples.map((ex, i) => (
                <div key={i} className="forge-pd-ex">
                  <span className="forge-pd-ex-num">Example {i + 1}</span>
                  <div className="forge-pd-ex-row">
                    <span className="forge-pd-ex-key">Input</span>
                    <pre className="forge-pd-ex-val">{ex.input}</pre>
                  </div>
                  <div className="forge-pd-ex-row">
                    <span className="forge-pd-ex-key">Output</span>
                    <pre className="forge-pd-ex-val">{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <div className="forge-pd-ex-row">
                      <span className="forge-pd-ex-key">Why</span>
                      <span className="forge-pd-ex-exp">{ex.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="forge-pd-cta-card">
            <div className="forge-pd-cta-copy">
              <span className="forge-pd-cta-title">Ready to solve it?</span>
              <span className="forge-pd-cta-sub">
                Edit the code, then hit Run my code to grade it against {testPlan.checkable.length || problem.tests.length} test
                {(testPlan.checkable.length || problem.tests.length) === 1 ? '' : 's'}.
              </span>
            </div>
            <span className="forge-pd-cta-badge">
              {running ? <Loader2 size={15} className="forge-pd-spin" /> : <Play size={15} />}
              {running ? 'Grading' : 'Run my code'}
            </span>
          </div>

          <div className="forge-pd-block">
            <button
              type="button"
              className="forge-pd-hints-toggle"
              onClick={() => setHintsOpen((o) => !o)}
              aria-expanded={hintsOpen}
            >
              <Lightbulb size={14} />
              <span>Hints ({problem.hints.length})</span>
              <ChevronDown size={14} className={hintsOpen ? 'forge-pd-chev-open' : ''} />
            </button>
            {hintsOpen && (
              <ol className="forge-pd-hints">
                {problem.hints.map((h, i) => <li key={i}>{h}</li>)}
              </ol>
            )}
          </div>
        </section>

        <section className="forge-pd-right" aria-label="Code editor">
          <div className="forge-pd-editor">
            <RunnableCodePanel
              fill
              code={starter}
              lang="python"
              runnable
              onSubmit={handleSubmit}
              submitLabel="Run my code"
            />
          </div>

          <div className="forge-pd-results">
            {report ? (
              <>
                {report.allPassed ? (
                  <div className="forge-pd-banner forge-pd-banner-pass" role="status">
                    <CheckCircle2 size={18} className="forge-pd-banner-ic" />
                    <div className="forge-pd-banner-copy">
                      <span className="forge-pd-banner-title">All tests passed — solved!</span>
                      <span className="forge-pd-banner-sub">
                        {report.checked} of {report.checked} test{report.checked === 1 ? '' : 's'} graded clean.
                      </span>
                    </div>
                  </div>
                ) : report.checked === 0 ? (
                  <div className="forge-pd-banner forge-pd-banner-neutral" role="status">
                    <MinusCircle size={18} className="forge-pd-banner-ic" />
                    <div className="forge-pd-banner-copy">
                      <span className="forge-pd-banner-title">Ran, but no gradeable tests</span>
                      <span className="forge-pd-banner-sub">
                        Every case is display-only — nothing to verify against yet.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="forge-pd-banner forge-pd-banner-fail" role="status">
                    <XCircle size={18} className="forge-pd-banner-ic" />
                    <div className="forge-pd-banner-copy">
                      <span className="forge-pd-banner-title">
                        {report.checked - report.passed} test{report.checked - report.passed === 1 ? '' : 's'} still failing
                      </span>
                      <span className="forge-pd-banner-sub">
                        {report.passed} of {report.checked} passing — review the cases below.
                      </span>
                    </div>
                  </div>
                )}
                <div className="forge-pd-tests-head">
                  <ListChecks size={13} />
                  <span>Results</span>
                  <span
                    className={`forge-pd-summary ${report.allPassed ? 'is-all' : 'is-some'}`}
                  >
                    {report.passed} / {report.checked} passed
                  </span>
                </div>
                <ul className="forge-pd-tests-list">
                  {report.rows.map((r) => (
                    <li key={r.index} className={`forge-pd-vtest forge-pd-v-${r.status}`}>
                      <div className="forge-pd-vtest-top">
                        <span className="forge-pd-vtest-ic">
                          {r.status === 'pass' && <CheckCircle2 size={14} />}
                          {r.status === 'fail' && <XCircle size={14} />}
                          {r.status === 'error' && <AlertTriangle size={14} />}
                          {r.status === 'skipped' && <MinusCircle size={14} />}
                        </span>
                        <span className="forge-pd-vtest-in">{r.input}</span>
                      </div>
                      {r.status === 'skipped' ? (
                        <div className="forge-pd-vtest-row">
                          <span className="forge-pd-vtest-k">Note</span>
                          <span className="forge-pd-vtest-note">
                            Shown for reference — expected {r.expected}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="forge-pd-vtest-row">
                            <span className="forge-pd-vtest-k">Expected</span>
                            <span className="forge-pd-vtest-v">{r.expected}</span>
                          </div>
                          <div className="forge-pd-vtest-row">
                            <span className="forge-pd-vtest-k">{r.status === 'error' ? 'Error' : 'Got'}</span>
                            <span className="forge-pd-vtest-v">{r.got || '(no value)'}</span>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <div className="forge-pd-tests-head">
                  <ListChecks size={13} />
                  <span>Test cases</span>
                  <span className="forge-pd-tests-count">{problem.tests.length}</span>
                </div>
                <ul className="forge-pd-tests-list">
                  {problem.tests.map((t, i) => (
                    <li key={i} className="forge-pd-test">
                      <span className="forge-pd-test-in">{t.input}</span>
                      <ChevronRight size={12} className="forge-pd-test-arrow" />
                      <span className="forge-pd-test-exp">{t.expected}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {(running || result) && (
            <div className="forge-pd-output">
              <div className="forge-pd-output-head">
                <Terminal size={13} />
                <span>Submission output</span>
                {result && (
                  <span className={`forge-pd-status forge-pd-status-${result.status}`}>
                    {STATUS_LABEL[result.status] || result.status}
                  </span>
                )}
              </div>
              <pre className="forge-pd-output-body">
                {running
                  ? 'Grading on the judge...'
                  : (result.output || '(no output)')}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
