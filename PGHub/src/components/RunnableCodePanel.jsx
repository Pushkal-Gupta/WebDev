import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Loader2, Terminal, Send } from 'lucide-react';
import { runCode, LANG_MAP } from '../lib/codeRunner';
import { registerMonacoThemes, resolveMonacoTheme } from '../lib/monacoTheme';
import LanguageIcon from './LanguageIcon';
import './RunnableCodePanel.css';

// Canonical display order + labels. Only languages present in `code` (non-empty)
// get a tab — so a single-snippet block shows one tab, a 4-language reference
// shows four, all switched from ONE bar over ONE editor (never stacked boxes).
const LANG_ORDER = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const LANG_ALIAS = {
  py: 'python', python: 'python', python3: 'python',
  js: 'javascript', javascript: 'javascript', node: 'javascript', jsx: 'javascript',
  ts: 'typescript', typescript: 'typescript',
  java: 'java',
  'c++': 'cpp', cpp: 'cpp', cplusplus: 'cpp', cc: 'cpp',
  c: 'c', go: 'go', golang: 'go', rust: 'rust', rs: 'rust',
};

function normLang(raw) {
  if (!raw) return null;
  const k = String(raw).trim().toLowerCase();
  return LANG_ALIAS[k] || (LANG_MAP[k] ? k : null);
}

function statusLabel(s) {
  switch (s) {
    case 'success': return 'Success';
    case 'compile_error': return 'Compile Error';
    case 'runtime_error': return 'Runtime Error';
    case 'time_limit': return 'Time Limit Exceeded';
    default: return s || 'Idle';
  }
}

// Unified runnable code surface. `code` is either a string (single language, set
// `lang`) or an object keyed by language → source. Drives one Monaco editor with
// per-language edit buffers behind an in-panel language bar.
//
//   fill=false (default) → inline: editor auto-sizes to its content (no inner
//                          scrollbar); used in lessons / tutorials / concepts.
//   fill=true           → fills the parent (height:100%); used on problem pages.
const RunnableCodePanel = forwardRef(function RunnableCodePanel({
  code,
  lang,
  title,
  runnable = true,
  fill = false,
  minLines = 3,
  maxFontSize = 13,
  storageKey,
  onSubmit,
  submitLabel = 'Submit',
  onLanguageChange,
}, ref) {
  // Normalize input into { lang: source }.
  const seeds = useMemo(() => {
    if (typeof code === 'string') {
      const k = normLang(lang) || 'plaintext';
      return { [k]: code };
    }
    const out = {};
    for (const [rawK, v] of Object.entries(code || {})) {
      const k = normLang(rawK) || rawK;
      const src = typeof v === 'string' ? v : (v?.code ?? '');
      if (src && src.trim()) out[k] = src;
    }
    return out;
  }, [code, lang]);

  const langs = useMemo(() => {
    const present = LANG_ORDER.filter((o) => seeds[o.value] !== undefined);
    // Include any non-standard keys (e.g. plaintext) at the end.
    for (const k of Object.keys(seeds)) {
      if (!present.some((p) => p.value === k)) {
        present.push({ value: k, label: LANG_MAP[k]?.name || k });
      }
    }
    return present;
  }, [seeds]);

  const initial = (normLang(lang) && seeds[normLang(lang)] !== undefined)
    ? normLang(lang)
    : (langs[0]?.value || 'plaintext');
  const [active, setActive] = useState(initial);
  const activeLang = seeds[active] !== undefined ? active : (langs[0]?.value || 'plaintext');

  const [buffers, setBuffers] = useState({});
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [monacoTheme, setMonacoTheme] = useState(() => resolveMonacoTheme());
  const [contentHeight, setContentHeight] = useState(0);
  const editorRef = useRef(null);

  useEffect(() => {
    const obs = new MutationObserver(() => setMonacoTheme(resolveMonacoTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // Restore persisted edits.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(`pg-rcp-${storageKey}`);
      if (raw) setBuffers(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => { setResult(null); }, [activeLang]);

  const seed = seeds[activeLang] ?? '';
  const value = buffers[activeLang] !== undefined ? buffers[activeLang] : seed;
  const dirty = buffers[activeLang] !== undefined && buffers[activeLang] !== seed;
  const monacoLang = LANG_MAP[activeLang]?.monaco || 'plaintext';
  const canRun = runnable && !!LANG_MAP[activeLang]?.harness;

  // Auto-size inline editors to their REAL rendered content height (reported by
  // Monaco), so word-wrapped long lines never get clipped behind a hidden inline
  // scrollbar. A line-count estimate seeds the first paint / pre-mount min; once
  // mounted, onDidContentSizeChange drives the actual height.
  const lineH = maxFontSize + 7;
  const minHeight = minLines * lineH + 18;
  const inlineHeight = Math.max(minHeight, contentHeight || minHeight);

  const switchLang = useCallback((next) => {
    setActive(next);
    onLanguageChange?.(next);
  }, [onLanguageChange]);

  const handleChange = useCallback((v) => {
    const code = v ?? '';
    setBuffers((prev) => {
      const next = { ...prev, [activeLang]: code };
      if (storageKey) {
        try { localStorage.setItem(`pg-rcp-${storageKey}`, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  }, [activeLang, storageKey]);

  const handleReset = useCallback(() => {
    setBuffers((prev) => {
      const next = { ...prev };
      delete next[activeLang];
      if (storageKey) {
        try { localStorage.setItem(`pg-rcp-${storageKey}`, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
    setResult(null);
  }, [activeLang, storageKey]);

  const handleRun = useCallback(async () => {
    if (running || !canRun) return;
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const out = await runCode(value, activeLang, '');
      setResult({ ...out, elapsed: Math.round(performance.now() - t0) });
    } catch (err) {
      setResult({ status: 'runtime_error', output: err?.message || 'Execution failed', elapsed: 0 });
    } finally {
      setRunning(false);
    }
  }, [running, canRun, value, activeLang]);

  const handleSubmit = useCallback(() => {
    onSubmit?.(value, activeLang);
  }, [onSubmit, value, activeLang]);

  // Expose the live editor buffer + active language so an external trigger (e.g. a
  // page-level "Run my code" CTA) can grade the exact code on screen without
  // duplicating the editor state.
  useImperativeHandle(ref, () => ({
    getCode: () => value,
    getLanguage: () => activeLang,
    submit: handleSubmit,
  }), [value, activeLang, handleSubmit]);

  if (!langs.length) return null;

  return (
    <div className={`rcp${fill ? ' rcp-fill' : ''}`}>
      <div className="rcp-bar">
        <div className="rcp-tabs" role="tablist" aria-label="Language">
          {langs.map((o) => (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={activeLang === o.value}
              className={`rcp-tab${activeLang === o.value ? ' active' : ''}`}
              onClick={() => switchLang(o.value)}
              title={o.label}
            >
              <LanguageIcon lang={o.value} size={13} />
              <span className="rcp-tab-label">{o.label}</span>
            </button>
          ))}
        </div>
        {title && <span className="rcp-title">{title}</span>}
        <div className="rcp-actions">
          {dirty && (
            <button type="button" className="rcp-btn" onClick={handleReset} disabled={running} title="Restore original">
              <RotateCcw size={13} /><span>Reset</span>
            </button>
          )}
          {canRun && (
            <button type="button" className="rcp-btn rcp-btn-run" onClick={handleRun} disabled={running} title="Run">
              {running ? <Loader2 size={13} className="rcp-spin" /> : <Play size={13} />}
              <span>{running ? 'Running' : 'Run'}</span>
            </button>
          )}
          {onSubmit && (
            <button type="button" className="rcp-btn rcp-btn-submit" onClick={handleSubmit} disabled={running} title={submitLabel}>
              <Send size={13} /><span>{submitLabel}</span>
            </button>
          )}
        </div>
      </div>

      <div className="rcp-editor" style={fill ? undefined : { height: inlineHeight }}>
        <Editor
          height="100%"
          language={monacoLang}
          theme={monacoTheme}
          value={value}
          onChange={handleChange}
          onMount={(ed, monaco) => {
            editorRef.current = ed;
            registerMonacoThemes(monaco);
            if (!fill) {
              const sync = () => setContentHeight(ed.getContentHeight());
              ed.onDidContentSizeChange(sync);
              sync();
            }
          }}
          options={{
            fontSize: maxFontSize,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 9, bottom: 9 },
            tabSize: 4,
            fontFamily: '"Space Mono", var(--mono, monospace)',
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            folding: false,
            renderLineHighlight: fill ? 'line' : 'none',
            scrollbar: fill
              ? { vertical: 'auto', horizontal: 'hidden' }
              : { vertical: 'hidden', horizontal: 'hidden', handleMouseWheel: false, alwaysConsumeMouseWheel: false },
            overviewRulerLanes: 0,
            readOnly: !runnable,
            domReadOnly: !runnable,
          }}
        />
      </div>

      {canRun && (result || running) && (
        <div className="rcp-output">
          <div className="rcp-output-head">
            <span className="rcp-output-title"><Terminal size={12} /> Output</span>
            {result?.status && (
              <span className={`rcp-status rcp-status-${result.status}`}>
                {statusLabel(result.status)}
                {typeof result.elapsed === 'number' && result.status === 'success' ? ` · ${result.elapsed}ms` : ''}
              </span>
            )}
          </div>
          <pre className="rcp-output-body">{running ? 'Running…' : (result?.output ?? '')}</pre>
        </div>
      )}
    </div>
  );
});

export default RunnableCodePanel;
