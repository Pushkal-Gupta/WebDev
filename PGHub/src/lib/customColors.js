// Custom CSS-var overrides for the theme system. Stored in localStorage so
// they survive reload, applied on top of whatever base theme is active.

const CUSTOM_TOKENS = ['--accent', '--bg', '--surface', '--text-main', '--text-dim', '--border', '--hover-box'];

export function loadCustomColors() {
  try { return JSON.parse(localStorage.getItem('pg-custom-colors') || '{}') || {}; }
  catch { return {}; }
}

export function applyCustomColors(map) {
  const root = document.documentElement;
  for (const t of CUSTOM_TOKENS) {
    const v = map?.[t];
    if (v) root.style.setProperty(t, v);
    else root.style.removeProperty(t);
  }
}

export function saveCustomColors(map) {
  const clean = {};
  for (const [k, v] of Object.entries(map || {})) {
    if (CUSTOM_TOKENS.includes(k) && v) clean[k] = v;
  }
  localStorage.setItem('pg-custom-colors', JSON.stringify(clean));
  applyCustomColors(clean);
}
