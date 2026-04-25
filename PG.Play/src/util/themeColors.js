// Read CSS design-system tokens from the live stylesheet at runtime.
//
// Games drawing to canvas hardcode hex values; when the app flips
// data-theme, those canvases stay frozen on old colors. This helper
// reads the current values of the CSS custom properties and exposes
// a subscription for theme flips so scenes can repaint.

const KEYS = [
  'bg', 'surface', 'surface-2', 'surface-raised', 'surface-sunken',
  'text', 'text-dim', 'text-mute',
  'line', 'line-strong',
  'accent', 'ember', 'warn', 'danger',
];

function read() {
  const s = getComputedStyle(document.documentElement);
  const out = {};
  for (const k of KEYS) {
    out[k] = s.getPropertyValue('--' + k).trim();
  }
  return out;
}

// Parse an rgb()/rgba()/hex string into a 0xRRGGBB int, for use with
// three.js .setHex(). Returns null if unparseable.
export function toHexInt(css) {
  if (!css) return null;
  const s = css.trim();
  if (s.startsWith('#')) {
    return parseInt(s.slice(1), 16);
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((n) => parseInt(n, 10));
    return (r << 16) | (g << 8) | b;
  }
  return null;
}

export function readThemeColors() {
  return read();
}

// Subscribe to theme flips. Fires whenever [data-theme] attribute on
// <html> changes, with the fresh token map.
export function onThemeChange(cb) {
  const obs = new MutationObserver(() => cb(read()));
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => obs.disconnect();
}
