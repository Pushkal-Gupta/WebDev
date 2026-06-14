import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Loader2, Terminal } from 'lucide-react';
import { runCode, LANG_MAP } from '../../lib/codeRunner';
import './RunnableCode.css';

const LIGHT_THEMES = new Set(['light', 'solarized']);

function resolveMonacoTheme() {
  if (typeof document === 'undefined') return 'vs-dark';
  const t = document.documentElement.getAttribute('data-theme');
  return LIGHT_THEMES.has(t) ? 'light' : 'vs-dark';
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

// Editable + runnable reference implementation. The active language is driven by
// the parent's language tabs (`lang`). Each language keeps its own edit buffer so
// switching tabs preserves edits; Reset restores the current language to its seed.
export default function RunnableCode({ code, lang, tabs }) {
  const seeds = code || {};
  const [buffers, setBuffers] = useState({});
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [monacoTheme, setMonacoTheme] = useState(resolveMonacoTheme);
  const editorRef = useRef(null);

  // Track theme changes (data-theme attribute on <html>).
  useEffect(() => {
    const obs = new MutationObserver(() => setMonacoTheme(resolveMonacoTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const seed = seeds[lang] ?? '';
  const value = buffers[lang] !== undefined ? buffers[lang] : seed;

  // Clear stale output when switching languages.
  useEffect(() => { setResult(null); }, [lang]);

  const monacoLang = LANG_MAP[lang]?.monaco || 'plaintext';

  const handleChange = useCallback((v) => {
    setBuffers((prev) => ({ ...prev, [lang]: v ?? '' }));
  }, [lang]);

  const handleReset = useCallback(() => {
    setBuffers((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
    setResult(null);
  }, [lang]);

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const out = await runCode(value, lang, '');
      setResult({ ...out, elapsed: Math.round(performance.now() - t0) });
    } catch (err) {
      setResult({
        status: 'runtime_error',
        output: err?.message || 'Execution failed',
        elapsed: Math.round(performance.now() - t0),
      });
    } finally {
      setRunning(false);
    }
  }, [running, value, lang]);

  const langLabel = useMemo(
    () => (tabs || []).find((t) => t.value === lang)?.label || LANG_MAP[lang]?.name || lang,
    [tabs, lang],
  );

  const dirty = buffers[lang] !== undefined && buffers[lang] !== seed;

  if (!seed && !dirty) {
    return <p className="learn-empty-sub">No code sample for this language yet.</p>;
  }

  return (
    <div className="rc-wrap">
      <div className="rc-toolbar">
        <span className="rc-langtag">{langLabel}</span>
        <div className="rc-actions">
          <button
            type="button"
            className="rc-btn rc-btn-reset"
            onClick={handleReset}
            disabled={!dirty || running}
            title="Restore the original reference code"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            type="button"
            className="rc-btn rc-btn-run"
            onClick={handleRun}
            disabled={running}
            title="Run this code"
          >
            {running ? <Loader2 size={13} className="rc-spin" /> : <Play size={13} />}
            {running ? 'Running' : 'Run'}
          </button>
        </div>
      </div>

      <div className="rc-editor">
        <Editor
          height="100%"
          language={monacoLang}
          theme={monacoTheme}
          value={value}
          onChange={handleChange}
          onMount={(ed) => { editorRef.current = ed; }}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
            tabSize: 4,
            renderWhitespace: 'selection',
            fontFamily: 'var(--mono)',
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            folding: false,
          }}
        />
      </div>

      <div className="rc-output">
        <div className="rc-output-head">
          <span className="rc-output-title">
            <Terminal size={12} />
            Output
          </span>
          {result?.status && (
            <span className={`rc-status rc-status-${result.status}`}>
              {statusLabel(result.status)}
              {typeof result.elapsed === 'number' && result.status === 'success'
                ? ` · ${result.elapsed}ms`
                : ''}
            </span>
          )}
        </div>
        <pre className="rc-output-body">
          {running ? 'Running…' : (result?.output ?? 'Run the code to see output.')}
        </pre>
      </div>
    </div>
  );
}
