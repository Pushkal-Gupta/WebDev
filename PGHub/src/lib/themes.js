// Theme registry — the single source of truth for the palette picker and any
// theme-switching UI. Each preset declares its mode and a `pair` pointing to its
// opposite-mode sibling so the Dark/Light toggle keeps palette identity.
// `swatches` are [bg, surface, accent] for the picker chips. Full palettes live
// in src/styles/theme.css as [data-theme="<id>"] blocks; ids here must match, and
// must also appear in VALID_THEMES + THEME_META in src/App.jsx.
export const THEME_PRESETS = [
  { id: 'dark',             name: 'Default Dark',     mode: 'dark',  pair: 'light',            swatches: ['#030a0a', '#061010', '#00fff5'] },
  { id: 'light',            name: 'Default Light',    mode: 'light', pair: 'dark',             swatches: ['#f5f2ed', '#ffffff', '#008a7e'] },
  { id: 'midnight',         name: 'Midnight',         mode: 'dark',  pair: 'midnight-light',   swatches: ['#0b1024', '#131a3a', '#a78bfa'] },
  { id: 'midnight-light',   name: 'Midnight Light',   mode: 'light', pair: 'midnight',         swatches: ['#eef1ff', '#dfe5ff', '#6b4dff'] },
  { id: 'solarized',        name: 'Solarized Light',  mode: 'light', pair: 'solarized-dark',   swatches: ['#fdf6e3', '#eee8d5', '#268bd2'] },
  { id: 'solarized-dark',   name: 'Solarized Dark',   mode: 'dark',  pair: 'solarized',        swatches: ['#002b36', '#073642', '#268bd2'] },
  { id: 'dracula',          name: 'Dracula',          mode: 'dark',  pair: 'dracula-light',    swatches: ['#282a36', '#21222c', '#ff79c6'] },
  { id: 'dracula-light',    name: 'Dracula Light',    mode: 'light', pair: 'dracula',          swatches: ['#f4f4ff', '#e5e5f5', '#c4378a'] },
  { id: 'nord',             name: 'Nord',             mode: 'dark',  pair: 'nord-light',       swatches: ['#2e3440', '#3b4252', '#88c0d0'] },
  { id: 'nord-light',       name: 'Nord Light',       mode: 'light', pair: 'nord',             swatches: ['#eceff4', '#ffffff', '#5e81ac'] },
  { id: 'rose-pine',        name: 'Rosé Pine',        mode: 'dark',  pair: 'rose-pine-dawn',   swatches: ['#191724', '#1f1d2e', '#ebbcba'] },
  { id: 'rose-pine-dawn',   name: 'Rosé Pine Dawn',   mode: 'light', pair: 'rose-pine',        swatches: ['#faf4ed', '#fffaf3', '#b4637a'] },
  { id: 'gruvbox',          name: 'Gruvbox',          mode: 'dark',  pair: 'gruvbox-light',    swatches: ['#282828', '#32302f', '#fabd2f'] },
  { id: 'gruvbox-light',    name: 'Gruvbox Light',    mode: 'light', pair: 'gruvbox',          swatches: ['#f2e5bc', '#fbf1c7', '#b57614'] },
  { id: 'mocha',            name: 'Catppuccin Mocha', mode: 'dark',  pair: 'latte',            swatches: ['#1e1e2e', '#181825', '#cba6f7'] },
  { id: 'latte',            name: 'Catppuccin Latte', mode: 'light', pair: 'mocha',            swatches: ['#eff1f5', '#ffffff', '#8839ef'] },
  { id: 'cyberpunk',        name: 'Cyberpunk',        mode: 'dark',  pair: 'cyberpunk-light',  swatches: ['#0d0221', '#170a33', '#ff2a6d'] },
  { id: 'cyberpunk-light',  name: 'Cyberpunk Light',  mode: 'light', pair: 'cyberpunk',        swatches: ['#f3edff', '#ffffff', '#d6009c'] },
  { id: 'forest',           name: 'Forest',           mode: 'dark',  pair: 'forest-light',     swatches: ['#0f1a14', '#16241b', '#4ade80'] },
  { id: 'forest-light',     name: 'Forest Light',     mode: 'light', pair: 'forest',           swatches: ['#eef3e9', '#ffffff', '#2f855a'] },
  { id: 'tokyo-night',      name: 'Tokyo Night',      mode: 'dark',  pair: 'tokyo-day',        swatches: ['#1a1b26', '#24283b', '#7aa2f7'] },
  { id: 'tokyo-day',        name: 'Tokyo Day',        mode: 'light', pair: 'tokyo-night',      swatches: ['#e6e7ed', '#ffffff', '#2e7de9'] },
  { id: 'one-dark',         name: 'One Dark',         mode: 'dark',  pair: 'one-light',        swatches: ['#282c34', '#31363f', '#61afef'] },
  { id: 'one-light',        name: 'One Light',        mode: 'light', pair: 'one-dark',         swatches: ['#eaeaeb', '#ffffff', '#4078f2'] },
  { id: 'everforest',       name: 'Everforest',       mode: 'dark',  pair: 'everforest-light', swatches: ['#2d353b', '#343f44', '#a7c080'] },
  { id: 'everforest-light', name: 'Everforest Light', mode: 'light', pair: 'everforest',       swatches: ['#eef1e5', '#fdf6e3', '#8da101'] },
  { id: 'ayu-mirage',       name: 'Ayu Mirage',       mode: 'dark',  pair: 'ayu-light',        swatches: ['#1f2430', '#242936', '#ffcc66'] },
  { id: 'ayu-light',        name: 'Ayu Light',        mode: 'light', pair: 'ayu-mirage',       swatches: ['#f0eee4', '#fcfcfc', '#f2ae49'] },
];

const LIGHT_THEMES = new Set(THEME_PRESETS.filter((t) => t.mode === 'light').map((t) => t.id));
// 'dark' | 'light' for a theme id (unknown → dark). Used to keep data-theme-mode
// correct on initial load so the Navbar toggle shows the right position.
export const modeOf = (id) => (LIGHT_THEMES.has(id) ? 'light' : 'dark');
