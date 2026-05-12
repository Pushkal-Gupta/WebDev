// Per-era palette. Renderer reads these directly; HUD bridges them via the
// `--es-accent` CSS custom property set on the game root.

export const PALETTES = {
  'ember-tribe': {
    // Sky: deep-blue twilight with an ember-warm sunset glow at the
    // horizon, instead of full-canvas orange. Keeps the warm flavour
    // as an accent against a cool dashboard atmosphere.
    sky:          ['#1c2840', '#0f1626'],
    mountain:     '#1c2030',
    ground:       '#1d2434',
    groundDetail: '#0e1320',
    midMotif:     '#ffb070',     // ember sparks in the air (warm accent)
    banner:       '#ffd05a',
    bannerEnemy:  '#ff5a4d',
    flash:        '#ffe14f',
    hudAccent:    '#ffb84a',     // HUD trim: amber (matches data-era token)
  },
  'iron-dominion': {
    sky:          ['#7d8794', '#262e38'],
    mountain:     '#1c2128',
    ground:       '#2c2a26',
    groundDetail: '#1a1714',
    midMotif:     '#a09080',     // banner haze
    banner:       '#d8d4cc',
    bannerEnemy:  '#c24237',
    flash:        '#ffe6c0',
    hudAccent:    '#7fd6ff',     // HUD trim: cyan (matches data-era token)
  },
  'sun-foundry': {
    // Deep industrial dusk — the gold furnace glow is preserved in the
    // motes + accents; the sky itself reads as a cool foundry-shadow.
    sky:          ['#2a2c3a', '#10131e'],
    mountain:     '#1c1f2a',
    ground:       '#23222a',
    groundDetail: '#0e0d14',
    midMotif:     '#ffcb6b',     // foundry haze (warm accent)
    banner:       '#ffcb6b',
    bannerEnemy:  '#bb441f',
    flash:        '#ffd97a',
    hudAccent:    '#ffd070',     // HUD trim: gold (matches data-era token)
  },
  'storm-republic': {
    sky:          ['#3c5777', '#0e1622'],
    mountain:     '#0c121b',
    ground:       '#1a2030',
    groundDetail: '#0a0e15',
    midMotif:     '#7be3ff',     // arc flicker
    banner:       '#7be3ff',
    bannerEnemy:  '#ff486b',
    flash:        '#bef3ff',
    hudAccent:    '#a8e1ff',     // HUD trim: ice (matches data-era token)
  },
  'void-ascendancy': {
    sky:          ['#1a0a3a', '#080014'],
    mountain:     '#0a0418',
    ground:       '#100828',
    groundDetail: '#04001a',
    midMotif:     '#c89bff',     // void shimmer
    banner:       '#e9c8ff',
    bannerEnemy:  '#ff4d6d',
    flash:        '#e9c8ff',
    hudAccent:    '#c79bff',     // HUD trim: violet (matches data-era token)
  },
};
