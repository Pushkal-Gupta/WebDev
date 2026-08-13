// Generate full [data-theme] CSS blocks + themes.js preset lines + App.jsx registration lines
// from a compact per-theme palette spec. Derives -rgb, -bg, -bar, hover-box etc. consistently so
// every token matches its hex and contrast stays even. Output is pasted into the 3 registration points.
const hx = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const to = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const rgb = (h) => hx(h).join(', ');
const mix = (a, b, t) => { const [r1, g1, b1] = hx(a), [r2, g2, b2] = hx(b); return to(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t); };
const light = (h, t) => mix(h, '#ffffff', t);

// Each spec: id,name,mode,pair, bg,surface,textMain,textDim,accent,border, easy,medium,hard,warning,
//   blue,violet,green,orange,red,yellow, hSky,hViolet,hPink,hMint
const THEMES = [
  { id: 'tokyo-night', name: 'Tokyo Night', mode: 'dark', pair: 'tokyo-day',
    bg: '#1a1b26', surface: '#24283b', textMain: '#c0caf5', textDim: '#7f8bb0', accent: '#7aa2f7', border: '#2f3549',
    easy: '#9ece6a', medium: '#e0af68', hard: '#f7768e', warning: '#ff9e64',
    blue: '#7aa2f7', violet: '#bb9af7', green: '#9ece6a', orange: '#ff9e64', red: '#f7768e', yellow: '#e0af68',
    hSky: '#7dcfff', hViolet: '#bb9af7', hPink: '#f7768e', hMint: '#73daca' },
  { id: 'tokyo-day', name: 'Tokyo Day', mode: 'light', pair: 'tokyo-night',
    bg: '#e6e7ed', surface: '#ffffff', textMain: '#343b58', textDim: '#6a7395', accent: '#2e7de9', border: '#c4c8da',
    easy: '#587539', medium: '#8c6c3e', hard: '#c64343', warning: '#b15c00',
    blue: '#2e7de9', violet: '#9854f1', green: '#587539', orange: '#b15c00', red: '#c64343', yellow: '#8c6c3e',
    hSky: '#007197', hViolet: '#9854f1', hPink: '#c64343', hMint: '#118c74' },
  { id: 'one-dark', name: 'One Dark', mode: 'dark', pair: 'one-light',
    bg: '#282c34', surface: '#31363f', textMain: '#abb2bf', textDim: '#7f879a', accent: '#61afef', border: '#3b4048',
    easy: '#98c379', medium: '#e5c07b', hard: '#e06c75', warning: '#d19a66',
    blue: '#61afef', violet: '#c678dd', green: '#98c379', orange: '#d19a66', red: '#e06c75', yellow: '#e5c07b',
    hSky: '#56b6c2', hViolet: '#c678dd', hPink: '#e06c75', hMint: '#98c379' },
  { id: 'one-light', name: 'One Light', mode: 'light', pair: 'one-dark',
    bg: '#eaeaeb', surface: '#ffffff', textMain: '#383a42', textDim: '#6b6f7b', accent: '#4078f2', border: '#cfd1d6',
    easy: '#50a14f', medium: '#986801', hard: '#e45649', warning: '#c18401',
    blue: '#4078f2', violet: '#a626a4', green: '#50a14f', orange: '#c18401', red: '#e45649', yellow: '#986801',
    hSky: '#0184bc', hViolet: '#a626a4', hPink: '#e45649', hMint: '#50a14f' },
  { id: 'everforest', name: 'Everforest', mode: 'dark', pair: 'everforest-light',
    bg: '#2d353b', surface: '#343f44', textMain: '#d3c6aa', textDim: '#9da9a0', accent: '#a7c080', border: '#3d484d',
    easy: '#a7c080', medium: '#dbbc7f', hard: '#e67e80', warning: '#e69875',
    blue: '#7fbbb3', violet: '#d699b6', green: '#a7c080', orange: '#e69875', red: '#e67e80', yellow: '#dbbc7f',
    hSky: '#7fbbb3', hViolet: '#d699b6', hPink: '#e67e80', hMint: '#83c092' },
  { id: 'everforest-light', name: 'Everforest Light', mode: 'light', pair: 'everforest',
    bg: '#eef1e5', surface: '#fdf6e3', textMain: '#5c6a72', textDim: '#829181', accent: '#8da101', border: '#dce0cf',
    easy: '#8da101', medium: '#dfa000', hard: '#f85552', warning: '#f57d26',
    blue: '#3a94c5', violet: '#df69ba', green: '#8da101', orange: '#f57d26', red: '#f85552', yellow: '#dfa000',
    hSky: '#3a94c5', hViolet: '#df69ba', hPink: '#f85552', hMint: '#35a77c' },
  { id: 'ayu-mirage', name: 'Ayu Mirage', mode: 'dark', pair: 'ayu-light',
    bg: '#1f2430', surface: '#242936', textMain: '#cccac2', textDim: '#8a91a0', accent: '#ffcc66', border: '#323947',
    easy: '#87d96c', medium: '#ffd580', hard: '#f28779', warning: '#ffad66',
    blue: '#73d0ff', violet: '#dfbfff', green: '#87d96c', orange: '#ffad66', red: '#f28779', yellow: '#ffd580',
    hSky: '#73d0ff', hViolet: '#dfbfff', hPink: '#f28779', hMint: '#95e6cb' },
  { id: 'ayu-light', name: 'Ayu Light', mode: 'light', pair: 'ayu-mirage',
    bg: '#f0eee4', surface: '#fcfcfc', textMain: '#5c6166', textDim: '#8a8986', accent: '#f2ae49', border: '#dad8ce',
    easy: '#6cbf43', medium: '#f2ae49', hard: '#f07171', warning: '#fa8d3e',
    blue: '#399ee6', violet: '#a37acc', green: '#6cbf43', orange: '#fa8d3e', red: '#f07171', yellow: '#e6ba7e',
    hSky: '#399ee6', hViolet: '#a37acc', hPink: '#f07171', hMint: '#4cbf99' },
];

function block(t) {
  const isDark = t.mode === 'dark';
  const chBg = (c) => mix(c, t.bg, 0.82), chBar = (c) => mix(c, t.bg, 0.7);
  const diffBg = (c) => `rgba(${rgb(c)}, 0.14)`;
  return `[data-theme="${t.id}"] {
  --bg: ${t.bg}; --surface: ${t.surface}; --text-main: ${t.textMain}; --text-dim: ${t.textDim};
  --accent: ${t.accent}; --border: ${t.border}; --card-bg: ${t.surface}; --hover-box: rgba(${rgb(t.accent)}, 0.09);
  --easy: ${t.easy}; --medium: ${t.medium}; --hard: ${t.hard}; --warning: ${t.warning};
  --easy-bg: ${diffBg(t.easy)}; --medium-bg: ${diffBg(t.medium)}; --hard-bg: ${diffBg(t.hard)};
  --easy-hover: ${isDark ? light(t.easy, 0.14) : mix(t.easy, '#000', 0.12)}; --error-bg: rgba(${rgb(t.hard)}, 0.09); --error-border: rgba(${rgb(t.hard)}, 0.22);
  --blue: ${t.blue}; --blue-bg: ${chBg(t.blue)}; --blue-bar: ${chBar(t.blue)}; --violet: ${t.violet}; --violet-bg: ${chBg(t.violet)}; --violet-bar: ${chBar(t.violet)};
  --green: ${t.green}; --green-bg: ${chBg(t.green)}; --green-bar: ${chBar(t.green)}; --orange: ${t.orange}; --orange-bg: ${chBg(t.orange)}; --orange-bar: ${chBar(t.orange)};
  --red: ${t.red}; --red-bg: ${chBg(t.red)}; --red-bar: ${chBar(t.red)}; --yellow: ${t.yellow}; --yellow-bg: ${chBg(t.yellow)};
  --accent-rgb: ${rgb(t.accent)}; --easy-rgb: ${rgb(t.easy)}; --medium-rgb: ${rgb(t.medium)}; --hard-rgb: ${rgb(t.hard)}; --warning-rgb: ${rgb(t.warning)};
  --hue-violet: ${t.hViolet}; --hue-sky: ${t.hSky}; --hue-pink: ${t.hPink}; --hue-mint: ${t.hMint};
  --hue-violet-rgb: ${rgb(t.hViolet)}; --hue-sky-rgb: ${rgb(t.hSky)}; --hue-pink-rgb: ${rgb(t.hPink)}; --hue-mint-rgb: ${rgb(t.hMint)};
}`;
}

console.log('/* ===== CSS BLOCKS (paste into src/styles/theme.css) ===== */');
console.log(THEMES.map(block).join('\n'));
console.log('\n/* ===== themes.js THEME_PRESETS lines ===== */');
for (const t of THEMES) console.log(`  { id: '${t.id}', name: '${t.name}', mode: '${t.mode}', pair: '${t.pair}', swatches: ['${t.bg}', '${t.surface}', '${t.accent}'] },`);
console.log('\n/* ===== App.jsx THEME_META lines ===== */');
for (const t of THEMES) console.log(`    '${t.id}': { mode: '${t.mode}', pair: '${t.pair}' },`);
console.log('\n/* ===== App.jsx VALID_THEMES additions ===== */');
console.log(THEMES.map((t) => `'${t.id}'`).join(', '));
