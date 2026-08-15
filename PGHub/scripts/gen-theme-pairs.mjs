// Generate the missing LIGHT pairs so every theme has a dark+light sibling.
// Reuses the same derive-everything-from-a-compact-spec approach as gen-themes.mjs.
const hx = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const to = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const rgb = (h) => hx(h).join(', ');
const mix = (a, b, t) => { const [r1, g1, b1] = hx(a), [r2, g2, b2] = hx(b); return to(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t); };

const THEMES = [
  { id: 'gruvbox-light', name: 'Gruvbox Light', mode: 'light', pair: 'gruvbox',
    bg: '#f2e5bc', surface: '#fbf1c7', textMain: '#3c3836', textDim: '#7c6f64', accent: '#b57614', border: '#e6d5a8',
    easy: '#79740e', medium: '#b57614', hard: '#9d0006', warning: '#af3a03',
    blue: '#076678', violet: '#8f3f71', green: '#79740e', orange: '#af3a03', red: '#9d0006', yellow: '#b57614',
    hSky: '#076678', hViolet: '#8f3f71', hPink: '#9d0006', hMint: '#427b58' },
  { id: 'latte', name: 'Catppuccin Latte', mode: 'light', pair: 'mocha',
    bg: '#eff1f5', surface: '#ffffff', textMain: '#4c4f69', textDim: '#6c6f85', accent: '#8839ef', border: '#dce0e8',
    easy: '#40a02b', medium: '#df8e1d', hard: '#d20f39', warning: '#fe640b',
    blue: '#1e66f5', violet: '#8839ef', green: '#40a02b', orange: '#fe640b', red: '#d20f39', yellow: '#df8e1d',
    hSky: '#04a5e5', hViolet: '#8839ef', hPink: '#ea76cb', hMint: '#179299' },
  { id: 'cyberpunk-light', name: 'Cyberpunk Light', mode: 'light', pair: 'cyberpunk',
    bg: '#f3edff', surface: '#ffffff', textMain: '#1a0b2e', textDim: '#6b5b8a', accent: '#d6009c', border: '#e2d5f5',
    easy: '#00a86b', medium: '#c77800', hard: '#e30052', warning: '#ff6b00',
    blue: '#0091ff', violet: '#7b2ff7', green: '#00a86b', orange: '#ff6b00', red: '#e30052', yellow: '#c9a400',
    hSky: '#00b8d4', hViolet: '#7b2ff7', hPink: '#ff0080', hMint: '#00a58c' },
  { id: 'forest-light', name: 'Forest Light', mode: 'light', pair: 'forest',
    bg: '#eef3e9', surface: '#ffffff', textMain: '#1f2d22', textDim: '#5a6b5d', accent: '#2f855a', border: '#d7e2cf',
    easy: '#38a169', medium: '#b7791f', hard: '#c53030', warning: '#c05621',
    blue: '#2b6cb0', violet: '#6b46c1', green: '#38a169', orange: '#c05621', red: '#c53030', yellow: '#b7791f',
    hSky: '#2b6cb0', hViolet: '#6b46c1', hPink: '#d53f8c', hMint: '#319795' },
];

function block(t) {
  const chBg = (c) => mix(c, t.bg, 0.86), chBar = (c) => mix(c, t.bg, 0.74);
  const diffBg = (c) => `rgba(${rgb(c)}, 0.14)`;
  return `[data-theme="${t.id}"] {
  --bg: ${t.bg}; --surface: ${t.surface}; --text-main: ${t.textMain}; --text-dim: ${t.textDim};
  --accent: ${t.accent}; --border: ${t.border}; --card-bg: ${t.surface}; --hover-box: rgba(${rgb(t.accent)}, 0.09);
  --easy: ${t.easy}; --medium: ${t.medium}; --hard: ${t.hard}; --warning: ${t.warning};
  --easy-bg: ${diffBg(t.easy)}; --medium-bg: ${diffBg(t.medium)}; --hard-bg: ${diffBg(t.hard)};
  --easy-hover: ${mix(t.easy, '#000', 0.12)}; --error-bg: rgba(${rgb(t.hard)}, 0.09); --error-border: rgba(${rgb(t.hard)}, 0.22);
  --blue: ${t.blue}; --blue-bg: ${chBg(t.blue)}; --blue-bar: ${chBar(t.blue)}; --violet: ${t.violet}; --violet-bg: ${chBg(t.violet)}; --violet-bar: ${chBar(t.violet)};
  --green: ${t.green}; --green-bg: ${chBg(t.green)}; --green-bar: ${chBar(t.green)}; --orange: ${t.orange}; --orange-bg: ${chBg(t.orange)}; --orange-bar: ${chBar(t.orange)};
  --red: ${t.red}; --red-bg: ${chBg(t.red)}; --red-bar: ${chBar(t.red)}; --yellow: ${t.yellow}; --yellow-bg: ${chBg(t.yellow)};
  --accent-rgb: ${rgb(t.accent)}; --easy-rgb: ${rgb(t.easy)}; --medium-rgb: ${rgb(t.medium)}; --hard-rgb: ${rgb(t.hard)}; --warning-rgb: ${rgb(t.warning)};
  --hue-violet: ${t.hViolet}; --hue-sky: ${t.hSky}; --hue-pink: ${t.hPink}; --hue-mint: ${t.hMint};
  --hue-violet-rgb: ${rgb(t.hViolet)}; --hue-sky-rgb: ${rgb(t.hSky)}; --hue-pink-rgb: ${rgb(t.hPink)}; --hue-mint-rgb: ${rgb(t.hMint)};
}`;
}
console.log('/* CSS */');
console.log(THEMES.map(block).join('\n'));
console.log('/* PRESETS */');
for (const t of THEMES) console.log(`  { id: '${t.id}', name: '${t.name}', mode: '${t.mode}', pair: '${t.pair}', swatches: ['${t.bg}', '${t.surface}', '${t.accent}'] },`);
console.log('/* META */');
for (const t of THEMES) console.log(`    '${t.id}': { mode: '${t.mode}', pair: '${t.pair}' },`);
console.log('/* VALID */');
console.log(THEMES.map((t) => `'${t.id}'`).join(', '));
