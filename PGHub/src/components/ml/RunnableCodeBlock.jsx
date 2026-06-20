import React, { useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import { runCode, LANG_MAP } from '../../lib/codeRunner';

const LANG_ALIAS = {
  py: 'python', python: 'python', python3: 'python',
  js: 'javascript', javascript: 'javascript', node: 'javascript',
  ts: 'typescript', typescript: 'typescript',
  java: 'java',
  'c++': 'cpp', cpp: 'cpp', cplusplus: 'cpp',
  c: 'c', go: 'go', golang: 'go', rust: 'rust', rs: 'rust',
};

const RUNNABLE = new Set(['python', 'javascript', 'java', 'cpp']);

function normalizeLang(raw) {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  return LANG_ALIAS[key] || (LANG_MAP[key] ? key : null);
}

export default function RunnableCodeBlock({ section }) {
  const original = section.body || '';
  const langKey = useMemo(() => normalizeLang(section.language), [section.language]);
  const canRun = langKey && RUNNABLE.has(langKey);
  const langLabel = (langKey && LANG_MAP[langKey]?.name) || section.language || 'code';

  const [code, setCode] = useState(original);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const taRef = useRef(null);

  const dirty = code !== original;

  async function handleRun() {
    if (!canRun || running) return;
    setRunning(true);
    setResult(null);
    try {
      const out = await runCode(code, langKey, '');
      setResult(out || { status: 'runtime_error', output: 'No response from the execution service.' });
    } catch (err) {
      setResult({ status: 'runtime_error', output: err?.message || 'Execution failed.' });
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    setCode(original);
    setResult(null);
    if (taRef.current) taRef.current.style.height = 'auto';
  }

  function autoGrow(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = `${code.slice(0, start)}    ${code.slice(end)}`;
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4; });
    }
  }

  return (
    <div className="ml-rcode-wrap">
      <div className="ml-rcode-head">
        <span className="ml-rcode-lang">{langLabel}</span>
        {section.heading && <span className="ml-rcode-title">{section.heading}</span>}
        <div className="ml-rcode-actions">
          {dirty && (
            <button type="button" className="ml-rcode-btn" onClick={handleReset} title="Restore the original code">
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          {canRun && (
            <button
              type="button"
              className="ml-rcode-btn ml-rcode-run"
              onClick={handleRun}
              disabled={running}
              title="Run this code"
            >
              {running ? <Loader2 size={13} className="ml-rcode-spin" /> : <Play size={13} />}
              <span>{running ? 'Running' : 'Run'}</span>
            </button>
          )}
        </div>
      </div>

      {canRun ? (
        <textarea
          ref={taRef}
          className="ml-rcode-editor"
          value={code}
          spellCheck={false}
          wrap="soft"
          onChange={(e) => { setCode(e.target.value); autoGrow(e.target); }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => autoGrow(e.target)}
          rows={Math.max(3, code.split('\n').length)}
          aria-label={`Editable ${langLabel} code`}
        />
      ) : (
        <pre className="ml-rcode-static"><code>{original}</code></pre>
      )}

      {canRun && (result || running) && (
        <div className="ml-rcode-output">
          <div className="ml-rcode-out-head">
            <span>Output</span>
            {result?.status && result.status !== 'success' && (
              <span className="ml-rcode-out-status">{result.status.replace(/_/g, ' ')}</span>
            )}
          </div>
          <pre className="ml-rcode-out-body">{running ? 'Running...' : (result?.output || '(no output)')}</pre>
        </div>
      )}
    </div>
  );
}
