// Shared Monaco theme registration + resolution. Single source of truth so the
// Workspace editor and every RunnableCodePanel render with identical colors.
// defineTheme is idempotent across modules, so registering twice is harmless.

export const MONACO_THEME_MAP = {
  dark: 'pg-dark',
  light: 'pg-light',
  midnight: 'pg-midnight',
  solarized: 'pg-solarized',
  dracula: 'pg-dracula',
  'midnight-light': 'pg-midnight-light',
  'dracula-light': 'pg-dracula-light',
  'solarized-dark': 'pg-solarized-dark',
};

export const DARK_PRESETS = new Set(['dark', 'midnight', 'dracula', 'solarized-dark']);

const THEME_DEFS = {
  'pg-dark':     { base: 'vs-dark', bg: '#030a0a', fg: '#d7e9e6' },
  'pg-light':    { base: 'vs',      bg: '#f5f2ed', fg: '#1c1f23' },
  'pg-midnight': { base: 'vs-dark', bg: '#0b1024', fg: '#dbe2ff' },
  'pg-solarized':{ base: 'vs',      bg: '#fdf6e3', fg: '#586e75' },
  'pg-dracula':  { base: 'vs-dark', bg: '#282a36', fg: '#f8f8f2' },
  'pg-midnight-light':  { base: 'vs',      bg: '#eef1ff', fg: '#1a2040' },
  'pg-dracula-light':   { base: 'vs',      bg: '#f4f4ff', fg: '#2d2f3f' },
  'pg-solarized-dark':  { base: 'vs-dark', bg: '#002b36', fg: '#93a1a1' },
};

let registered = false;
export function registerMonacoThemes(monaco) {
  if (registered || !monaco?.editor?.defineTheme) return;
  for (const [name, d] of Object.entries(THEME_DEFS)) {
    monaco.editor.defineTheme(name, {
      base: d.base,
      inherit: true,
      rules: [],
      colors: {
        'editor.background': d.bg,
        'editor.foreground': d.fg,
        'editorLineNumber.foreground': d.base === 'vs-dark' ? '#4a5d7a' : '#a0a8b0',
        'editorLineNumber.activeForeground': d.fg,
        'editor.selectionBackground': d.base === 'vs-dark' ? '#1f3a4a' : '#cfe2f3',
        'editor.lineHighlightBackground': d.base === 'vs-dark' ? '#0e1f24' : '#ece9e0',
        'editorCursor.foreground': d.fg,
        'editorWidget.background': d.bg,
      },
    });
  }
  registered = true;
}

// Resolve the active app theme (from <html data-theme>) to a registered Monaco
// theme name. Falls back to the built-in vs/vs-dark when unregistered.
export function resolveMonacoTheme(themeAttr) {
  const t = themeAttr ?? (typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-theme')
    : null);
  return MONACO_THEME_MAP[t] || (DARK_PRESETS.has(t) ? 'vs-dark' : 'vs');
}
