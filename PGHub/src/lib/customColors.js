// Custom CSS-var overrides for the theme system. Stored in localStorage so
// they survive reload, applied on top of whatever base theme is active.

// Tokens the user can override via the picker.
const CUSTOM_TOKENS = [
  '--accent', '--bg', '--surface', '--text-main', '--text-dim', '--border', '--hover-box',
  '--easy', '--medium', '--hard', '--warning',
  '--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint',
];

// Tokens that also have an `<token>-rgb` companion (used inside rgba(var(--x-rgb), a)).
// When one of these is overridden we must recompute the -rgb form too, or tints
// keep using the base theme's value and drift from the picked color.
const RGB_COMPANION = new Set([
  '--accent', '--easy', '--medium', '--hard', '--warning',
  '--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint',
]);

function hexToRgbString(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return `${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}`;
}

export function loadCustomColors() {
  try { return JSON.parse(localStorage.getItem('pg-custom-colors') || '{}') || {}; }
  catch { return {}; }
}

export function applyCustomColors(map) {
  const root = document.documentElement;
  for (const t of CUSTOM_TOKENS) {
    const v = map?.[t];
    if (v) {
      root.style.setProperty(t, v);
      if (RGB_COMPANION.has(t)) {
        const rgb = hexToRgbString(v);
        if (rgb) root.style.setProperty(`${t}-rgb`, rgb);
      }
    } else {
      root.style.removeProperty(t);
      if (RGB_COMPANION.has(t)) root.style.removeProperty(`${t}-rgb`);
    }
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
