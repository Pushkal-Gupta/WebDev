import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, ExternalLink, Maximize2, Minimize2, FileCode, Palette, Braces, ChevronLeft } from 'lucide-react';
import PlaygroundSwitcher from './PlaygroundSwitcher';
import { registerMonacoThemes, resolveMonacoTheme } from '../lib/monacoTheme';
import './WebSandbox.css';

const STARTERS = {
  html: `<!doctype html>\n<html>\n  <head><title>PG Hub Sandbox</title></head>\n  <body>\n    <h1 id="hello">Hello, PG Hub!</h1>\n    <button id="go">Click me</button>\n  </body>\n</html>\n`,
  css: `body {\n  font-family: system-ui, -apple-system, sans-serif;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n  margin: 0;\n  background: #0b1024;\n  color: #f5f4ff;\n}\nh1 { font-weight: 700; }\nbutton {\n  background: #a78bfa;\n  border: none;\n  color: #0b1024;\n  padding: 0.6rem 1.2rem;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 600;\n}\n`,
  js: `document.getElementById('go').addEventListener('click', () => {\n  const h = document.getElementById('hello');\n  h.textContent = h.textContent === 'Hello, PG Hub!' ? 'PG Hub works!' : 'Hello, PG Hub!';\n});\n`,
};

const STORAGE_KEY = 'pgcode_websandbox_v1';

function buildSrcDoc(html, css, js) {
  // If user supplied a full document, inject css/js inside. Otherwise wrap with a minimal shell.
  const hasDoctype = /<!doctype/i.test(html);
  if (hasDoctype) {
    return html
      .replace(/<\/head>/i, `<style>${css}</style></head>`)
      .replace(/<\/body>/i, `<script>${js}</script></body>`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
}

const TABS = [
  { id: 'html', label: 'HTML', icon: FileCode, lang: 'html' },
  { id: 'css',  label: 'CSS',  icon: Palette,  lang: 'css' },
  { id: 'js',   label: 'JS',   icon: Braces,   lang: 'javascript' },
];

export default function WebSandbox({ theme }) {
  const initial = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') return { ...STARTERS, ...saved };
    } catch { /* ignore */ }
    return STARTERS;
  }, []);

  const [files, setFiles] = useState(initial);
  const [activeTab, setActiveTab] = useState('html');
  const [autoRun, setAutoRun] = useState(true);
  const [srcDoc, setSrcDoc] = useState(() => buildSrcDoc(initial.html, initial.css, initial.js));
  const [fullscreen, setFullscreen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    }, 250);
    return () => clearTimeout(id);
  }, [files]);

  const compile = useCallback(() => {
    setSrcDoc(buildSrcDoc(files.html, files.css, files.js));
  }, [files]);

  useEffect(() => {
    if (!autoRun) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(compile, 400);
    return () => clearTimeout(debounceRef.current);
  }, [autoRun, compile]);

  const handleReset = () => {
    setFiles(STARTERS);
    setSrcDoc(buildSrcDoc(STARTERS.html, STARTERS.css, STARTERS.js));
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const monacoTheme = resolveMonacoTheme(theme);
  const activeTabMeta = TABS.find(t => t.id === activeTab);

  return (
    <div className={`web-sandbox ${fullscreen ? 'fullscreen' : ''}`}>
      <header className="ws-sb-header">
        <div className="ws-sb-title-row">
          <PlaygroundSwitcher current="web" />
          <h1 className="ws-sb-title">Web Sandbox</h1>
          <p className="ws-sb-sub">HTML + CSS + JS, live preview. Auto-runs as you type. Nothing leaves your browser.</p>
        </div>
        <div className="ws-sb-controls">
          <label className="ws-sb-auto">
            <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} />
            <span>Auto-run</span>
          </label>
          {!autoRun && (
            <button className="ws-sb-btn ws-sb-btn-primary" onClick={compile}>
              <Play size={13} /> Run
            </button>
          )}
          <button className="ws-sb-btn ws-sb-btn-ghost" onClick={handleReset} title="Reset to starter">
            <RotateCcw size={13} /> Reset
          </button>
          <button className="ws-sb-btn ws-sb-btn-ghost" onClick={handleOpenInNewTab} title="Open preview in new tab">
            <ExternalLink size={13} />
          </button>
          <button
            className="ws-sb-btn ws-sb-btn-ghost"
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </header>

      <div className="ws-sb-body">
        <div className="ws-sb-editor-pane">
          <div className="ws-sb-tabs">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`ws-sb-tab ws-sb-tab-${t.id} ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>
          <Editor
            height="100%"
            language={activeTabMeta?.lang || 'html'}
            beforeMount={(monaco) => registerMonacoThemes(monaco)}
            theme={monacoTheme}
            value={files[activeTab] ?? ''}
            onChange={(v) => setFiles(f => ({ ...f, [activeTab]: v ?? '' }))}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 10 },
              tabSize: 2,
              fontFamily: '"Space Mono", monospace',
            }}
          />
        </div>

        <div className="ws-sb-preview-pane">
          <div className="ws-sb-preview-head">
            <span className="ws-sb-preview-label">Preview</span>
            <span className="ws-sb-preview-host">about:srcdoc</span>
          </div>
          <iframe
            className="ws-sb-iframe"
            sandbox="allow-scripts allow-modals allow-forms"
            srcDoc={srcDoc}
            title="Sandbox preview"
          />
        </div>
      </div>
    </div>
  );
}
