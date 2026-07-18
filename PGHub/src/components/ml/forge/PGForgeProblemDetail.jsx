import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  ChevronRight, Terminal, Lightbulb, Check,
  FileText, ListChecks, Sparkles, FlaskConical, BookOpen,
  CheckCircle2, XCircle, MinusCircle, AlertTriangle, Eye, KeyRound,
  Plus, X, BarChart3, PlayCircle, Info,
} from 'lucide-react';
import { getForgeProblem } from './pgForgeProblemsData';
import Breadcrumb from '../../common/Breadcrumb';
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
        if _pg_c["e"] == "":
            _pg_status = 'info'
        else:
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

// Turn a full reference solution into a starter SCAFFOLD the reader builds from:
// keep imports and every top-level def/class SIGNATURE (plus its docstring), blank
// the body to a TODO, and drop module-level demo code (prints, top-level calls).
// Always emits syntactically valid Python; imperfect parses still yield signature +
// TODO, never the answer.
function makeScaffold(src) {
  if (!src || typeof src !== 'string') return '# TODO: implement your solution\n';
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let emittedDef = false;
  while (i < lines.length) {
    const line = lines[i];
    const isTopLevel = line.length > 0 && !/^\s/.test(line);

    // Keep module-level imports verbatim.
    if (isTopLevel && /^(import\s|from\s)/.test(line)) { out.push(line); i++; continue; }

    // Top-level def/class: keep the (possibly multi-line) signature, its docstring,
    // then stub the body.
    if (isTopLevel && /^(def|class)\s/.test(line)) {
      let sig = line;
      while (!/:\s*(#.*)?$/.test(sig) && i + 1 < lines.length) { i++; sig += '\n' + lines[i]; }
      if (emittedDef) out.push('');
      out.push(sig);
      emittedDef = true;

      // Optional leading docstring inside the body.
      let k = i + 1;
      while (k < lines.length && lines[k].trim() === '') k++;
      const q = lines[k] && (lines[k].trim().startsWith('"""') ? '"""' : lines[k].trim().startsWith("'''") ? "'''" : null);
      if (q) {
        const first = lines[k];
        out.push(first);
        const oneLine = first.trim().length > 3 && first.trim().endsWith(q);
        if (!oneLine) {
          k++;
          while (k < lines.length) { out.push(lines[k]); if (lines[k].includes(q)) break; k++; }
        }
      }
      out.push('    # TODO: implement');
      out.push('    raise NotImplementedError');

      // Skip the real body (blank or more-indented lines than the def/class).
      let m = i + 1;
      while (m < lines.length && (lines[m].trim() === '' || /^\s/.test(lines[m]))) m++;
      i = m;
      continue;
    }

    // Drop everything else at module level (demo prints, top-level statements).
    i++;
  }
  let text = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!/def\s|class\s/.test(text)) text = (text ? text + '\n\n' : '') + '# TODO: implement your solution';
  return text + '\n';
}

export default function PGForgeProblemDetail() {
  const { slug } = useParams();
  const problem = useMemo(() => getForgeProblem(slug), [slug]);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [leftTab, setLeftTab] = useState('description');
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [solved, setSolved] = useState(() => (problem ? isSolved(problem.slug) : false));
  const [customCases, setCustomCases] = useState([]);

  // Draggable split between the problem pane and the editor pane — mirrors the
  // DSA Workspace divider. Width is the left pane's percentage, clamped 25–75,
  // persisted so the reader's preferred ratio survives navigation.
  const [leftWidth, setLeftWidth] = useState(() => {
    const v = parseInt(localStorage.getItem('pgforge_pd_split'), 10);
    return Number.isFinite(v) ? Math.min(75, Math.max(25, v)) : 50;
  });
  const leftWidthRef = useRef(leftWidth);
  useEffect(() => { leftWidthRef.current = leftWidth; }, [leftWidth]);
  const mainRef = useRef(null);

  const handleDividerDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = leftWidthRef.current;
    let finalPct = startW;
    const onMove = (ev) => {
      const c = mainRef.current;
      if (!c || !c.offsetWidth) return;
      const pct = Math.max(25, Math.min(75, startW + ((ev.clientX - startX) / c.offsetWidth) * 100));
      finalPct = pct;
      setLeftWidth(pct);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try { localStorage.setItem('pgforge_pd_split', String(Math.round(finalPct))); } catch { /* ignore */ }
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  const addCustom = useCallback(() => {
    setCustomCases((p) => (p.length >= 8 ? p : [...p, { input: '', expected: '' }]));
  }, []);
  const removeCustom = useCallback((i) => {
    setCustomCases((p) => p.filter((_, j) => j !== i));
  }, []);
  const updateCustom = useCallback((i, key, val) => {
    setCustomCases((p) => p.map((c, j) => (j === i ? { ...c, [key]: val } : c)));
  }, []);

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
      const entry = { id: `t${i}`, index: i, input: t.input, expected: t.expected };
      if (args != null) checkable.push({ ...entry, args });
      else display.push(entry);
    });
    return { checkable, display };
  }, [problem, fn]);

  // Grade the current editor buffer against the python auto-grader. `mode` decides
  // the breadth: 'run' is a fast sample check (first few built-in cases + any custom
  // ones), 'submit' is the thorough grade over EVERY built-in test plus the custom
  // ones. Custom cases are non-blocking — an unparseable one is honestly skipped, it
  // never blocks or fakes the real verdicts. Auto-solve only fires on a full submit.
  const SAMPLE_N = 3;
  const handleGrade = useCallback(async (code, lang, mode) => {
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
      const builtin = mode === 'run' ? testPlan.checkable.slice(0, SAMPLE_N) : testPlan.checkable;
      const customParsed = customCases
        .map((c) => ({ input: (c.input || '').trim(), expected: (c.expected || '').trim() }))
        .filter((c) => c.input)
        .map((c) => ({ ...c, args: fn ? parseCall(c.input, fn) : null }));
      const gradedCustom = customParsed.filter((c) => c.args != null);

      const harnessCases = [
        ...builtin.map((c) => ({ args: c.args, expected: c.expected })),
        ...gradedCustom.map((c) => ({ args: c.args, expected: c.expected })),
      ];

      const canGrade = fnName && harnessCases.length > 0;
      const source = canGrade ? buildHarness(code, fnName, harnessCases) : code;
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
      const verdictAt = new Map();
      verdicts.forEach((v) => verdictAt.set(v.i, { status: v.s, got: v.g }));

      const rows = [];
      builtin.forEach((c, pos) => {
        const gv = verdictAt.get(pos);
        rows.push({ id: c.id, kind: 'builtin', input: c.input, expected: c.expected, status: gv?.status || 'skipped', got: gv?.got || '' });
      });
      // Full grade also surfaces the display-only built-ins (honestly skipped).
      if (mode === 'submit') {
        testPlan.display.forEach((d) => {
          rows.push({ id: d.id, kind: 'builtin', input: d.input, expected: d.expected, status: 'skipped', got: '' });
        });
      }
      let cpos = builtin.length;
      customParsed.forEach((c, j) => {
        if (c.args != null) {
          const gv = verdictAt.get(cpos);
          cpos += 1;
          rows.push({ id: `c${j}`, kind: 'custom', input: c.input, expected: c.expected, status: gv?.status || 'skipped', got: gv?.got || '' });
        } else {
          rows.push({ id: `c${j}`, kind: 'custom', input: c.input, expected: c.expected, status: 'skipped', got: '', unparsed: true });
        }
      });

      const passed = rows.filter((r) => r.status === 'pass').length;
      const failed = rows.filter((r) => r.status === 'fail').length;
      const errored = rows.filter((r) => r.status === 'error').length;
      const checked = passed + failed + errored;
      const allPassed = checked > 0 && failed === 0 && errored === 0;
      setReport({ rows, passed, failed, errored, checked, allPassed, mode });
      setResult({ status: out.status, output: userOut });

      // Honest auto-mark: full submit, every gradeable case passing.
      if (mode === 'submit' && allPassed && !solved) {
        markSolved(problem.slug, problem.difficulty);
        setSolved(true);
      }
    } catch (err) {
      setResult({ status: 'runtime_error', output: err.message || String(err) });
    } finally {
      setRunning(false);
    }
  }, [problem, fn, fnName, testPlan, customCases, solved]);

  // Editor loads a SCAFFOLD; the real reference stays behind the Solution tab.
  const starter = useMemo(
    () => (problem ? { python: makeScaffold(problem.starterCode.python) } : {}),
    [problem],
  );

  if (!problem) return <Navigate to="/ml/problems" replace />;

  return (
    <div className="forge-pd" style={{ '--pd-hue': hue }}>
      <Breadcrumb
        items={[
          { label: 'PGForge', to: '/ml' },
          { label: 'Problems', to: '/ml/problems' },
          { label: problem.title || 'Problem' },
        ]}
      />

      <div className="forge-pd-main" ref={mainRef}>
        <section
          className="forge-pd-left"
          aria-label="Problem description"
          style={{ width: `${leftWidth}%` }}
        >
          <header className="forge-pd-header">
            <div className="forge-pd-head-row">
              <h1 className="forge-pd-title">{problem.title}</h1>
              <span className={`forge-pd-diff forge-pd-diff-${problem.difficulty}`}>
                {problem.difficulty}
              </span>
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

            <div className="forge-pd-tags">
              <span className="forge-pd-chip forge-pd-chip-hue">{problem.topic}</span>
              {problem.category && problem.category !== problem.topic && (
                <span className="forge-pd-chip">{problem.category}</span>
              )}
              <span className="forge-pd-metaline">
                {problem.examples.length} example{problem.examples.length === 1 ? '' : 's'}
                {' · '}
                {problem.tests.length} test{problem.tests.length === 1 ? '' : 's'}
              </span>
            </div>
          </header>

          <div className="forge-pd-tabs" role="tablist">
            {[
              { key: 'description', label: 'Description', Icon: BookOpen },
              { key: 'hints', label: `Hints (${problem.hints.length})`, Icon: Lightbulb },
              { key: 'solution', label: 'Solution', Icon: KeyRound },
              { key: 'tests', label: `Test cases (${problem.tests.length})`, Icon: FlaskConical },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={leftTab === t.key}
                className={`forge-pd-tab ${leftTab === t.key ? 'is-active' : ''}`}
                onClick={() => setLeftTab(t.key)}
              >
                <t.Icon size={13} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {leftTab === 'description' && (
            <>
              <div className="forge-pd-statement">{renderedStatement}</div>

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
                          <span className="forge-pd-ex-key">Explanation</span>
                          <span className="forge-pd-ex-exp">{ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="forge-pd-grade-note">
                Build your solution in the editor. <strong>Run</strong> checks the first few sample
                cases fast; <strong>Submit</strong> grades against all{' '}
                {testPlan.checkable.length || problem.tests.length} test
                {(testPlan.checkable.length || problem.tests.length) === 1 ? '' : 's'} plus any custom cases you add.
              </p>
            </>
          )}

          {leftTab === 'hints' && (
            <div className="forge-pd-block">
              <h2 className="forge-pd-sec"><Lightbulb size={13} /> Hints</h2>
              {problem.hints.length ? (
                <ol className="forge-pd-hints">
                  {problem.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ol>
              ) : (
                <p className="forge-pd-empty-note">No hints for this one — lean on the examples.</p>
              )}
            </div>
          )}

          {leftTab === 'solution' && (
            <div className="forge-pd-block">
              <h2 className="forge-pd-sec"><KeyRound size={13} /> Reference solution</h2>
              {solutionRevealed ? (
                <pre className="forge-pd-solution-code"><code>{problem.starterCode.python}</code></pre>
              ) : (
                <div className="forge-pd-solution-guard">
                  <p className="forge-pd-solution-guard-copy">
                    Try building it yourself first — the editor has a scaffold. Reveal the canonical
                    solution only when you&apos;re stuck or want to compare approaches.
                  </p>
                  <button
                    type="button"
                    className="forge-pd-reveal-btn"
                    onClick={() => setSolutionRevealed(true)}
                  >
                    <Eye size={14} /> Reveal solution
                  </button>
                </div>
              )}
            </div>
          )}

          {leftTab === 'tests' && (
            <div className="forge-pd-block">
              <h2 className="forge-pd-sec"><FlaskConical size={13} /> Test cases</h2>
              <ul className="forge-pd-testlist">
                {problem.tests.map((t, i) => (
                  <li key={i} className="forge-pd-testlist-item">
                    <span className="forge-pd-testlist-in">{t.input}</span>
                    <span className="forge-pd-testlist-arrow"><ChevronRight size={12} /></span>
                    <span className="forge-pd-testlist-out">{t.expected}</span>
                  </li>
                ))}
              </ul>

              <div className="forge-pd-custom">
                <div className="forge-pd-custom-head">
                  <FlaskConical size={13} />
                  <span>Your custom cases</span>
                  <span className="forge-pd-custom-count">{customCases.length}/8</span>
                </div>
                <p className="forge-pd-custom-note">
                  Add up to 8 of your own cases — write the input like the examples
                  (e.g. <code className="forge-pd-code">xs=[1,2,3]</code>); expected is optional.
                  They run with both Run and Submit.
                </p>

                {customCases.length === 0 ? (
                  <p className="forge-pd-empty-note">No custom cases yet — add one to probe an edge case.</p>
                ) : (
                  <div className="forge-pd-custom-list">
                    {customCases.map((c, i) => (
                      <div key={i} className="forge-pd-custom-row">
                        <div className="forge-pd-custom-fields">
                          <input
                            className="forge-pd-custom-in"
                            value={c.input}
                            onChange={(e) => updateCustom(i, 'input', e.target.value)}
                            placeholder="input, e.g. xs=[1,2,3]"
                            aria-label={`Custom case ${i + 1} input`}
                            spellCheck={false}
                          />
                          <input
                            className="forge-pd-custom-in"
                            value={c.expected}
                            onChange={(e) => updateCustom(i, 'expected', e.target.value)}
                            placeholder="expected (optional)"
                            aria-label={`Custom case ${i + 1} expected`}
                            spellCheck={false}
                          />
                        </div>
                        <button
                          type="button"
                          className="forge-pd-custom-del"
                          onClick={() => removeCustom(i)}
                          aria-label={`Remove custom case ${i + 1}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {customCases.length < 8 && (
                  <button type="button" className="forge-pd-custom-add" onClick={addCustom}>
                    <Plus size={13} /> Add case
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <div
          className="forge-pd-divider"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          onPointerDown={handleDividerDrag}
        />

        <section className="forge-pd-right" aria-label="Code editor">
          <div className="forge-pd-editor">
            <RunnableCodePanel
              fill
              code={starter}
              lang="python"
              runnable
              busy={running}
              onRun={(c, l) => handleGrade(c, l, 'run')}
              onSubmit={(c, l) => handleGrade(c, l, 'submit')}
              submitLabel="Submit"
            />
          </div>

          <div className="forge-pd-results">
            {report ? (
              <>
                {report.allPassed ? (
                  <div className="forge-pd-banner forge-pd-banner-pass" role="status">
                    <CheckCircle2 size={18} className="forge-pd-banner-ic" />
                    <div className="forge-pd-banner-copy">
                      <span className="forge-pd-banner-title">
                        {report.mode === 'submit' ? 'All tests passed — solved!' : 'Sample cases passed'}
                      </span>
                      <span className="forge-pd-banner-sub">
                        {report.checked} of {report.checked} case{report.checked === 1 ? '' : 's'} graded clean
                        {report.mode === 'run' ? ' — Submit to grade the full set.' : '.'}
                      </span>
                    </div>
                  </div>
                ) : report.checked === 0 ? (
                  <div className="forge-pd-banner forge-pd-banner-neutral" role="status">
                    <MinusCircle size={18} className="forge-pd-banner-ic" />
                    <div className="forge-pd-banner-copy">
                      <span className="forge-pd-banner-title">Ran, but no gradeable cases</span>
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
                        {report.checked - report.passed} case{report.checked - report.passed === 1 ? '' : 's'} still failing
                      </span>
                      <span className="forge-pd-banner-sub">
                        {report.passed} of {report.checked} passing — review the cases below.
                      </span>
                    </div>
                  </div>
                )}

                {report.checked > 0 && (
                  <div className="forge-pd-analysis">
                    <div className="forge-pd-analysis-head">
                      <BarChart3 size={13} />
                      <span>Result breakdown</span>
                      <span className={`forge-pd-mode ${report.mode === 'submit' ? 'is-full' : 'is-sample'}`}>
                        {report.mode === 'submit' ? 'Full grade' : 'Sample run'}
                      </span>
                    </div>
                    <div className="forge-pd-bar" role="img" aria-label={`${report.passed} passed, ${report.failed} failed, ${report.errored} errored`}>
                      {report.passed > 0 && (
                        <span className="forge-pd-bar-seg is-pass" style={{ flexGrow: report.passed }} />
                      )}
                      {report.failed > 0 && (
                        <span className="forge-pd-bar-seg is-fail" style={{ flexGrow: report.failed }} />
                      )}
                      {report.errored > 0 && (
                        <span className="forge-pd-bar-seg is-error" style={{ flexGrow: report.errored }} />
                      )}
                    </div>
                    <div className="forge-pd-legend">
                      <span className="forge-pd-leg is-pass"><i /> {report.passed} passed</span>
                      <span className="forge-pd-leg is-fail"><i /> {report.failed} failed</span>
                      {report.errored > 0 && (
                        <span className="forge-pd-leg is-error"><i /> {report.errored} errored</span>
                      )}
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
                    <li key={r.id} className={`forge-pd-vtest forge-pd-v-${r.status}`}>
                      <div className="forge-pd-vtest-top">
                        <span className="forge-pd-vtest-ic">
                          {r.status === 'pass' && <CheckCircle2 size={14} />}
                          {r.status === 'fail' && <XCircle size={14} />}
                          {r.status === 'error' && <AlertTriangle size={14} />}
                          {r.status === 'info' && <Info size={14} />}
                          {r.status === 'skipped' && <MinusCircle size={14} />}
                        </span>
                        <span className="forge-pd-vtest-in">{r.input}</span>
                        {r.kind === 'custom' && <span className="forge-pd-vtest-tag">custom</span>}
                      </div>
                      {r.status === 'skipped' ? (
                        <div className="forge-pd-vtest-row">
                          <span className="forge-pd-vtest-k">Note</span>
                          <span className="forge-pd-vtest-note">
                            {r.unparsed
                              ? "Couldn't parse this input — leave it as a literal like the examples."
                              : `Shown for reference — expected ${r.expected}`}
                          </span>
                        </div>
                      ) : r.status === 'info' ? (
                        <div className="forge-pd-vtest-row">
                          <span className="forge-pd-vtest-k">Got</span>
                          <span className="forge-pd-vtest-v">{r.got || '(no value)'}</span>
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
              <div className="forge-pd-prelude">
                <PlayCircle size={22} className="forge-pd-prelude-ic" />
                <div className="forge-pd-prelude-copy">
                  <span className="forge-pd-prelude-title">Run to check, Submit to grade</span>
                  <span className="forge-pd-prelude-sub">
                    Run checks the first {Math.min(SAMPLE_N, testPlan.checkable.length) || 'few'} sample
                    case{Math.min(SAMPLE_N, testPlan.checkable.length) === 1 ? '' : 's'} fast. Submit grades against
                    all {testPlan.checkable.length || problem.tests.length} test
                    {(testPlan.checkable.length || problem.tests.length) === 1 ? '' : 's'}
                    {customCases.length ? ` plus your ${customCases.length} custom` : ''}. Results appear here.
                  </span>
                </div>
              </div>
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
