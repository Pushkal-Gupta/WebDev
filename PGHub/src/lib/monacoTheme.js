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

// The editor is a NEUTRAL code surface in every app theme — a clean grey/black
// (the universally-recognised "code editor" look), never tinted by the app's
// teal/blue palette. Dark app themes -> neutral dark grey (#1e1e1e); light app
// themes -> neutral near-white. This keeps syntax highlighting (from the base
// vs/vs-dark tokenizers) crisp for every language, in every theme.
const DARK_EDITOR = { base: 'vs-dark', bg: '#1e1e1e', fg: '#e6e6e6' };
const LIGHT_EDITOR = { base: 'vs', bg: '#fbfbfb', fg: '#1f2328' };
const THEME_DEFS = {
  'pg-dark':            DARK_EDITOR,
  'pg-light':           LIGHT_EDITOR,
  'pg-midnight':        DARK_EDITOR,
  'pg-solarized':       LIGHT_EDITOR,
  'pg-dracula':         DARK_EDITOR,
  'pg-midnight-light':  LIGHT_EDITOR,
  'pg-dracula-light':   LIGHT_EDITOR,
  'pg-solarized-dark':  DARK_EDITOR,
};

let registered = false;
export function registerMonacoThemes(monaco) {
  if (registered || !monaco?.editor?.defineTheme) return;
  for (const [name, d] of Object.entries(THEME_DEFS)) {
    const dark = d.base === 'vs-dark';
    monaco.editor.defineTheme(name, {
      base: d.base,
      inherit: true,
      rules: [],
      colors: {
        'editor.background': d.bg,
        'editor.foreground': d.fg,
        'editorLineNumber.foreground': dark ? '#858585' : '#9aa0a6',
        'editorLineNumber.activeForeground': dark ? '#c6c6c6' : '#24292f',
        'editor.selectionBackground': dark ? '#264f78' : '#add6ff',
        'editor.lineHighlightBackground': dark ? '#2a2d2e' : '#f0f0f0',
        'editor.lineHighlightBorder': '#00000000',
        'editorCursor.foreground': dark ? '#e6e6e6' : '#1f2328',
        'editorWidget.background': dark ? '#252526' : '#f3f3f3',
        'editorGutter.background': d.bg,
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
