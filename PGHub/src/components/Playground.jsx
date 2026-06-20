import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Loader2, RotateCcw, Copy, Check, Share2, Globe, Database, Code2, TerminalSquare, FileInput } from 'lucide-react';
import { runCode, PLAYGROUND_LANGS } from '../lib/codeRunner';
import { supabase } from '../lib/supabase';
import Select from './Select';
import PlaygroundSwitcher from './PlaygroundSwitcher';
import LanguageIcon from './LanguageIcon';
import './Playground.css';

// Lazy import - keeps pyodide (~10MB) out of the main bundle.
const loadInteractive = () => import('../lib/pythonInteractive.js');

// Recognizable brand logos from the open-source Devicon set, served over CDN.
// The URL carries only the language slug — no user data. Each entry is the
// Devicon path segment + the variant that actually ships a logo for that lang.
const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';
const LANG_LOGO = {
  python:     ['python', 'original'],
  javascript: ['javascript', 'original'],
  typescript: ['typescript', 'original'],
  java:       ['java', 'original'],
  cpp:        ['cplusplus', 'original'],
  c:          ['c', 'original'],
  go:         ['go', 'original-wordmark'],
  rust:       ['rust', 'original'],
  csharp:     ['csharp', 'original'],
  ruby:       ['ruby', 'original'],
  kotlin:     ['kotlin', 'original'],
  swift:      ['swift', 'original'],
  php:        ['php', 'original'],
  bash:       ['bash', 'original'],
};

function languageLogo(langKey) {
  const entry = LANG_LOGO[langKey];
  if (!entry) return null;
  const [slug, variant] = entry;
  return `${DEVICON_BASE}/${slug}/${slug}-${variant}.svg`;
}

// Devicon logo with a graceful fallback to the hand-drawn brand glyph, so a
// missing/blocked CDN asset never breaks the row.
function LanguageLogo({ lang, name, size = 18 }) {
  const [failed, setFailed] = useState(false);
  const src = languageLogo(lang);
  if (failed || !src) return <LanguageIcon lang={lang} size={size} />;
  return (
    <img
      src={src}
      alt={name || lang}
      width={size}
      height={size}
      loading="lazy"
      className="pg-lang-logo"
      onError={() => setFailed(true)}
    />
  );
}

const STARTERS = {
  python: `def main():\n    print("Hello, PG Hub!")\n    # Uncomment to try Terminal mode: type a number, click Run.\n    # n = int(input())\n    # print(n * 2)\n\nmain()\n`,
  javascript: `// Cmd/Ctrl+Enter to run.\nconsole.log("Hello, PG Hub!");\n`,
  typescript: `// TypeScript playground. (Compiles to JS, then runs on Node.)\nconst greet = (name: string) => \`Hello, \${name}!\`;\nconsole.log(greet("PG Hub"));\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, PG Hub!");\n    }\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, PG Hub!" << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, PG Hub!\\n");\n    return 0;\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, PG Hub!")\n}\n`,
  rust: `fn main() {\n    println!("Hello, PG Hub!");\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, PG Hub!");\n    }\n}\n`,
  ruby: `puts "Hello, PG Hub!"\n`,
  kotlin: `fun main() {\n    println("Hello, PG Hub!")\n}\n`,
  swift: `print("Hello, PG Hub!")\n`,
  php: `<?php\necho "Hello, PG Hub!\\n";\n`,
  bash: `echo "Hello, PG Hub!"\n`,
};

const codeKey = (lang) => `pgcode_playground_${lang}`;
const stdinKey = 'pgcode_playground_stdin';
const stdinModeKey = 'pg-playground-stdin-mode';

const STDIN_MODES = [
  { value: 'box', label: 'Stdin', title: 'Pre-fill input before running', icon: FileInput },
  { value: 'terminal', label: 'Terminal', title: 'Type input in the output panel before running', icon: TerminalSquare },
];

const isStdinMode = (v) => STDIN_MODES.some(m => m.value === v);

function slugify() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export default function Playground({ theme, preferredLang, session }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const langOptions = useMemo(() => PLAYGROUND_LANGS, []);
  const isValid = (l) => langOptions.some(o => o.value === l);
  const initialLang = isValid(preferredLang) ? preferredLang : 'python';

  const [lang, setLang] = useState(initialLang);
  const [code, setCode] = useState(() => localStorage.getItem(codeKey(initialLang)) || STARTERS[initialLang] || '');
  const [stdin, setStdin] = useState(() => localStorage.getItem(stdinKey) || '');
  const [stdinMode, setStdinMode] = useState(() => {
    const stored = localStorage.getItem(stdinModeKey);
    return isStdinMode(stored) ? stored : 'box';
  });
  const [terminalInput, setTerminalInput] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [shareError, setShareError] = useState(null);
  // Interactive (Pyodide) state - only used when lang === 'python' && mode === 'terminal'.
  // events: [{ kind: 'out'|'err'|'input', text }] - one record per stdout chunk / typed line.
  const [liveEvents, setLiveEvents] = useState([]);
  const [pyLoading, setPyLoading] = useState(false);
  const [pyPrompting, setPyPrompting] = useState(false);
  const [pyDone, setPyDone] = useState(null); // null | { code }
  const [pyTypedLine, setPyTypedLine] = useState('');
  const editorRef = useRef(null);
  const liveScrollRef = useRef(null);
  const inlineInputRef = useRef(null);
  const stdinResolverRef = useRef(null);
  const isInteractivePy = lang === 'python' && stdinMode === 'terminal';

  const PG_SPLIT_KEY = 'pgcode-playground-split';
  const [editorWidthPct, setEditorWidthPct] = useState(() => {
    const raw = Number(localStorage.getItem(PG_SPLIT_KEY));
    return Number.isFinite(raw) && raw >= 30 && raw <= 80 ? raw : 60;
  });
  const bodyRef = useRef(null);
  const draggingColRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingColRef.current) return;
      const el = bodyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(80, Math.max(30, (x / rect.width) * 100));
      setEditorWidthPct(pct);
    };
    const onUp = () => {
      if (!draggingColRef.current) return;
      draggingColRef.current = false;
      document.body.classList.remove('pg-resizing-col');
      try { localStorage.setItem(PG_SPLIT_KEY, String(editorWidthPct)); } catch { /* ignore */ }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [editorWidthPct]);

  const startColDrag = (e) => {
    e.preventDefault();
    draggingColRef.current = true;
    document.body.classList.add('pg-resizing-col');
  };

  // Load a shared snippet if a slug is in the URL
  useEffect(() => {
    if (!slug) {
      setShareError(null);
      setShareUrl(null);
      return;
    }
    setLoadingShare(true);
    setShareUrl(null);
    setShareError(null);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('PGcode_playground_snippets')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setShareError(`Couldn't load that snippet: ${error.message}`);
      } else if (!data) {
        setShareError(`No snippet found at /playground/share/${slug}.`);
      } else {
        if (isValid(data.language)) setLang(data.language);
        setCode(data.source_code || '');
        setStdin(data.stdin || '');
        setTerminalInput(data.stdin || '');
        setShareUrl(`${window.location.origin}${window.location.pathname}#/playground/share/${data.slug}`);
        // Atomic increment — avoids the read-then-write race when two tabs
        // load the same snippet concurrently.
        supabase.rpc('increment_snippet_views', { snippet_slug: data.slug }).then(({ error: rpcErr }) => {
          if (rpcErr) {
            // RPC not deployed yet → fall back to the older read-then-write path.
            supabase.from('PGcode_playground_snippets')
              .update({ view_count: (data.view_count || 0) + 1 })
              .eq('slug', data.slug)
              .then(() => {});
          }
        });
      }
      setLoadingShare(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const newSlug = slugify();
      const payload = {
        slug: newSlug,
        user_id: session?.user?.id || null,
        language: lang,
        source_code: code,
        stdin: stdinMode === 'terminal' ? terminalInput : stdin,
      };
      const { error } = await supabase.from('PGcode_playground_snippets').insert(payload);
      if (error) throw error;
      const url = `${window.location.origin}${window.location.pathname}#/playground/share/${newSlug}`;
      setShareUrl(url);
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      navigate(`/playground/share/${newSlug}`);
    } catch (e) {
      setShareUrl(null);
      setResult({ status: 'runtime_error', output: `Share failed: ${e?.message || e}`, elapsed: 0 });
    } finally {
      setSharing(false);
    }
  }, [code, lang, stdin, stdinMode, terminalInput, session, sharing, navigate]);

  const switchLang = useCallback((nextLang) => {
    if (nextLang === lang) return;
    localStorage.setItem(codeKey(lang), code);
    const stored = localStorage.getItem(codeKey(nextLang));
    setLang(nextLang);
    setCode(stored ?? STARTERS[nextLang] ?? '');
    setResult(null);
    setLiveEvents([]);
    setPyDone(null);
    setPyPrompting(false);
    setPyTypedLine('');
  }, [lang, code]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(codeKey(lang), code), 250);
    return () => clearTimeout(id);
  }, [code, lang]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(stdinKey, stdin), 250);
    return () => clearTimeout(id);
  }, [stdin]);

  useEffect(() => {
    localStorage.setItem(stdinModeKey, stdinMode);
  }, [stdinMode]);

  const effectiveStdin = useMemo(() => {
    if (stdinMode === 'terminal') return terminalInput;
    return stdin;
  }, [stdinMode, stdin, terminalInput]);

  const handleRunInteractive = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setLiveEvents([]);
    setPyDone(null);
    setPyPrompting(false);
    setPyTypedLine('');
    // Resolve any leftover stdin promise from a previous aborted run.
    if (stdinResolverRef.current) {
      try { stdinResolverRef.current(''); } catch { /* ignore */ }
      stdinResolverRef.current = null;
    }
    const t0 = performance.now();
    let needsLoad = false;
    try {
      const lib = await loadInteractive();
      // Show the loading state until the first pyodide instance is ready.
      // Subsequent runs hit the cached singleton and skip this.
      if (typeof window !== 'undefined' && !window.__pgcode_pyodide_warm) {
        needsLoad = true;
        setPyLoading(true);
      }
      await lib.loadPyodideOnce();
      if (needsLoad) {
        window.__pgcode_pyodide_warm = true;
        setPyLoading(false);
      }
      await lib.runInteractive(code, {
        onStdout: (text) => {
          setLiveEvents((prev) => [...prev, { kind: 'out', text }]);
        },
        onError: (text) => {
          setLiveEvents((prev) => [...prev, { kind: 'err', text }]);
        },
        onStdin: () => new Promise((resolve) => {
          stdinResolverRef.current = (line) => {
            stdinResolverRef.current = null;
            setPyPrompting(false);
            resolve(line);
          };
          setPyPrompting(true);
          // Focus the inline input after React commits.
          setTimeout(() => inlineInputRef.current?.focus(), 0);
        }),
        onDone: (exitCode) => {
          setPyDone({ code: exitCode });
        },
      });
      setResult({ status: 'success', output: '', elapsed: Math.round(performance.now() - t0) });
    } catch (err) {
      setLiveEvents((prev) => [...prev, { kind: 'err', text: `Runtime error: ${err?.message || err}\n` }]);
      setPyDone({ code: 1 });
      setResult({ status: 'runtime_error', output: err?.message || 'Execution failed', elapsed: Math.round(performance.now() - t0) });
    } finally {
      setPyLoading(false);
      setRunning(false);
    }
  }, [code, running]);

  const handleRun = useCallback(async () => {
    if (running) return;
    if (isInteractivePy) {
      return handleRunInteractive();
    }
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const out = await runCode(code, lang, effectiveStdin);
      setResult({ ...out, elapsed: Math.round(performance.now() - t0) });
    } catch (err) {
      setResult({ status: 'runtime_error', output: err?.message || 'Execution failed', elapsed: Math.round(performance.now() - t0) });
    } finally {
      setRunning(false);
    }
  }, [code, lang, effectiveStdin, running, isInteractivePy, handleRunInteractive]);

  const submitInlineInput = useCallback(() => {
    const resolver = stdinResolverRef.current;
    if (!resolver) return;
    const line = pyTypedLine;
    // Echo the typed line into the transcript so the user sees what they entered.
    setLiveEvents((prev) => [...prev, { kind: 'input', text: `${line}\n` }]);
    setPyTypedLine('');
    resolver(line);
  }, [pyTypedLine]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  // Keep the transcript pinned to the bottom as new events arrive.
  useEffect(() => {
    const el = liveScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveEvents, pyPrompting, pyDone, pyLoading]);

  const handleReset = () => {
    setCode(STARTERS[lang] ?? '');
    setResult(null);
  };

  const handleCopy = async () => {
    if (!result?.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const monacoLang = langOptions.find(l => l.value === lang)?.monaco || 'python';
  const monacoTheme = theme === 'light' || theme === 'solarized' ? 'light' : 'vs-dark';

  const statusLabel = (s) => {
    switch (s) {
      case 'success': return 'Success';
      case 'compile_error': return 'Compile Error';
      case 'runtime_error': return 'Runtime Error';
      case 'time_limit': return 'Time Limit Exceeded';
      default: return s || 'Idle';
    }
  };

  return (
    <div className="pg-playground">
      <div className="pg-pg-header">
        <div className="pg-pg-title-row">
          <PlaygroundSwitcher current="code" />
          <h1 className="pg-pg-title">Compiler</h1>
          <p className="pg-pg-sub">
            Free-form code execution across {langOptions.length} languages. Use the pills above
            to jump to Web (HTML/CSS/JS) or SQL (in-browser SQLite).
          </p>
        </div>
        <div className="pg-pg-controls">
          <Select
            value={lang}
            onChange={switchLang}
            options={langOptions}
            icon={<Code2 size={14} />}
            renderPrefix={(o) => <LanguageLogo lang={o.value} name={o.label} size={18} />}
            size="md"
          />
          <button className="pg-pg-btn pg-pg-btn-ghost" onClick={handleShare} disabled={sharing} title="Save a shareable link">
            {sharing ? <Loader2 size={14} className="pg-pg-spin" /> : <Share2 size={14} />}
            {shareUrl ? 'Link copied' : 'Share'}
          </button>
          <button className="pg-pg-btn pg-pg-btn-ghost" onClick={handleReset} title="Reset starter template">
            <RotateCcw size={14} /> Reset
          </button>
          <div className="pg-pg-segment" role="group" aria-label="Stdin mode">
            {STDIN_MODES.map((mode) => {
              const ModeIcon = mode.icon;
              return (
                <button
                  key={mode.value}
                  type="button"
                  className={`pg-pg-segment-btn${stdinMode === mode.value ? ' pg-pg-segment-btn-active' : ''}`}
                  onClick={() => setStdinMode(mode.value)}
                  title={mode.title}
                  aria-pressed={stdinMode === mode.value}
                >
                  <ModeIcon size={12} /> {mode.label}
                </button>
              );
            })}
          </div>
          <button
            className="pg-pg-btn pg-pg-btn-primary"
            onClick={handleRun}
            disabled={running}
            title="Run (Cmd/Ctrl+Enter)"
          >
            {running ? <Loader2 size={14} className="pg-pg-spin" /> : <Play size={14} />}
            {running ? 'Running' : 'Run'}
          </button>
        </div>
      </div>
      {(shareUrl || loadingShare || shareError) && (
        <div className={`pg-pg-share-row${shareError ? ' pg-pg-share-row-error' : ''}`}>
          {loadingShare && <span className="pg-pg-share-loading">Loading shared snippet…</span>}
          {!loadingShare && shareError && (
            <span className="pg-pg-share-error">{shareError}</span>
          )}
          {!loadingShare && !shareError && shareUrl && (
            <>
              <span className="pg-pg-share-label">Shareable link:</span>
              <code className="pg-pg-share-url">{shareUrl}</code>
            </>
          )}
        </div>
      )}

      <div className="pg-pg-body" ref={bodyRef}>
        <div className="pg-pg-editor" style={{ flexBasis: `${editorWidthPct}%` }}>
          <Editor
            height="100%"
            language={monacoLang}
            theme={monacoTheme}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            onMount={(ed) => { editorRef.current = ed; }}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12 },
              tabSize: 4,
              renderWhitespace: 'selection',
              fontFamily: '"Space Mono", monospace',
              wordWrap: 'on',
            }}
          />
        </div>

        <div
          className="pg-pg-hsplitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor and output"
          onMouseDown={startColDrag}
        />

        <div
          className={`pg-pg-side pg-pg-side-mode-${stdinMode}`}
          style={{ flexBasis: `calc(${100 - editorWidthPct}% - 4px)` }}
        >
          {stdinMode === 'box' && (
            <div className="pg-pg-panel">
              <div className="pg-pg-panel-head">
                <span className="pg-pg-panel-label">Stdin</span>
                <span className="pg-pg-panel-hint">(optional)</span>
              </div>
              <textarea
                className="pg-pg-stdin"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Lines fed to the program's standard input..."
                spellCheck={false}
              />
            </div>
          )}

          <div className="pg-pg-panel pg-pg-panel-output">
            <div className="pg-pg-panel-head">
              <span className="pg-pg-panel-label">
                {stdinMode === 'terminal' ? 'Terminal' : 'Output'}
              </span>
              <div className="pg-pg-panel-meta">
                {stdinMode === 'terminal' && (
                  <span className="pg-pg-panel-hint">simulated</span>
                )}
                {result && (
                  <span className={`pg-pg-status pg-pg-status-${result.status || 'idle'}`}>
                    {statusLabel(result.status)}
                  </span>
                )}
                {result?.elapsed != null && (
                  <span className="pg-pg-elapsed">{result.elapsed} ms</span>
                )}
                {(result?.output || (stdinMode === 'terminal' && terminalInput)) && (
                  <button
                    className="pg-pg-copy"
                    onClick={handleCopy}
                    title="Copy output"
                    disabled={!result?.output}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
            {stdinMode === 'terminal' ? (
              isInteractivePy ? (
                <div
                  className="pg-pg-terminal-live"
                  ref={liveScrollRef}
                  onClick={() => {
                    if (pyPrompting) inlineInputRef.current?.focus();
                  }}
                >
                  {pyLoading && (
                    <div className="pg-pg-terminal-line pg-pg-terminal-loading">
                      <Loader2 size={12} className="pg-pg-spin" />
                      <span>Loading Python runtime...</span>
                    </div>
                  )}
                  {!pyLoading && liveEvents.length === 0 && !pyPrompting && !pyDone && !running && (
                    <div className="pg-pg-terminal-line pg-pg-terminal-hint">
                      Click Run to start an interactive Python session. input() will pause here for you to type.
                    </div>
                  )}
                  {liveEvents.map((ev, i) => {
                    // When pyPrompting is true and this is the last event, strip
                    // a single trailing newline so the cursor lands inline-after
                    // the prompt text (matches Programiz/GDB behavior even when
                    // user code uses `print("Enter: ")` instead of `input("Enter: ")`).
                    const isLastBeforePrompt = pyPrompting && i === liveEvents.length - 1;
                    const text = isLastBeforePrompt && typeof ev.text === 'string' && ev.text.endsWith('\n')
                      ? ev.text.slice(0, -1)
                      : ev.text;
                    return (
                      <span
                        key={i}
                        className={
                          ev.kind === 'err'
                            ? 'pg-pg-terminal-line pg-pg-terminal-err'
                            : ev.kind === 'input'
                              ? 'pg-pg-terminal-line pg-pg-terminal-echo'
                              : 'pg-pg-terminal-line'
                        }
                      >{text}</span>
                    );
                  })}
                  {pyPrompting && (
                    <span className="pg-pg-terminal-prompt">
                      <input
                        ref={inlineInputRef}
                        className="pg-pg-terminal-input-inline"
                        value={pyTypedLine}
                        style={{ width: `${Math.max(1, pyTypedLine.length)}ch` }}
                        onChange={(e) => setPyTypedLine(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitInlineInput();
                          }
                        }}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        aria-label="Program input"
                      />
                    </span>
                  )}
                  {pyDone && (
                    <div className="pg-pg-terminal-footer">
                      Process exited ({pyDone.code === 0 ? 'success' : `code ${pyDone.code}`}).
                    </div>
                  )}
                </div>
              ) : (
                <div className="pg-pg-terminal-wrap">
                  {result?.output && (
                    <pre className="pg-pg-terminal-output">{result.output}</pre>
                  )}
                  <textarea
                    className="pg-pg-terminal-input"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder={running
                      ? 'Running...'
                      : (result?.output
                        ? 'Type more input, then Run again.'
                        : 'Type input here, then click Run')}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
              )
            ) : (
              <pre className="pg-pg-output">
{running ? 'Running...' : (result?.output ?? 'Run your code to see output.')}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
