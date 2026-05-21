import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Loader2, RotateCcw, Copy, Check, Share2, Globe, Database, Code2 } from 'lucide-react';
import { runCode, PLAYGROUND_LANGS } from '../lib/codeRunner';
import { supabase } from '../lib/supabase';
import Select from './Select';
import PlaygroundSwitcher from './PlaygroundSwitcher';
import './Playground.css';

const STARTERS = {
  python: `# Free-form Python playground. Cmd/Ctrl+Enter to run.\nprint("Hello, PGcode!")\n`,
  javascript: `// Free-form JS playground. Cmd/Ctrl+Enter to run.\nconsole.log("Hello, PGcode!");\n`,
  typescript: `// TypeScript playground. (Compiles to JS, then runs on Node.)\nconst greet = (name: string) => \`Hello, \${name}!\`;\nconsole.log(greet("PGcode"));\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, PGcode!");\n    }\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, PGcode!" << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, PGcode!\\n");\n    return 0;\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, PGcode!")\n}\n`,
  rust: `fn main() {\n    println!("Hello, PGcode!");\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, PGcode!");\n    }\n}\n`,
  ruby: `puts "Hello, PGcode!"\n`,
  kotlin: `fun main() {\n    println("Hello, PGcode!")\n}\n`,
  swift: `print("Hello, PGcode!")\n`,
  php: `<?php\necho "Hello, PGcode!\\n";\n`,
  bash: `echo "Hello, PGcode!"\n`,
};

const codeKey = (lang) => `pgcode_playground_${lang}`;
const stdinKey = 'pgcode_playground_stdin';

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
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [shareError, setShareError] = useState(null);
  const editorRef = useRef(null);

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
        stdin,
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
  }, [code, lang, stdin, session, sharing, navigate]);

  const switchLang = useCallback((nextLang) => {
    if (nextLang === lang) return;
    localStorage.setItem(codeKey(lang), code);
    const stored = localStorage.getItem(codeKey(nextLang));
    setLang(nextLang);
    setCode(stored ?? STARTERS[nextLang] ?? '');
    setResult(null);
  }, [lang, code]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(codeKey(lang), code), 250);
    return () => clearTimeout(id);
  }, [code, lang]);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(stdinKey, stdin), 250);
    return () => clearTimeout(id);
  }, [stdin]);

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const out = await runCode(code, lang, stdin);
      setResult({ ...out, elapsed: Math.round(performance.now() - t0) });
    } catch (err) {
      setResult({ status: 'runtime_error', output: err?.message || 'Execution failed', elapsed: Math.round(performance.now() - t0) });
    } finally {
      setRunning(false);
    }
  }, [code, lang, stdin, running]);

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
            icon={<Code2 size={12} />}
            size="sm"
          />
          <button className="pg-pg-btn pg-pg-btn-ghost" onClick={handleShare} disabled={sharing} title="Save a shareable link">
            {sharing ? <Loader2 size={14} className="pg-pg-spin" /> : <Share2 size={14} />}
            {shareUrl ? 'Link copied' : 'Share'}
          </button>
          <button className="pg-pg-btn pg-pg-btn-ghost" onClick={handleReset} title="Reset starter template">
            <RotateCcw size={14} /> Reset
          </button>
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

      <div className="pg-pg-body">
        <div className="pg-pg-editor">
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
            }}
          />
        </div>

        <div className="pg-pg-side">
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

          <div className="pg-pg-panel pg-pg-panel-output">
            <div className="pg-pg-panel-head">
              <span className="pg-pg-panel-label">Output</span>
              <div className="pg-pg-panel-meta">
                {result && (
                  <span className={`pg-pg-status pg-pg-status-${result.status || 'idle'}`}>
                    {statusLabel(result.status)}
                  </span>
                )}
                {result?.elapsed != null && (
                  <span className="pg-pg-elapsed">{result.elapsed} ms</span>
                )}
                {result?.output && (
                  <button className="pg-pg-copy" onClick={handleCopy} title="Copy output">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
            <pre className="pg-pg-output">
{running ? 'Running...' : (result?.output ?? 'Run your code to see output.')}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
