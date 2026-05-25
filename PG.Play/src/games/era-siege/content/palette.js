// Per-era palette. Renderer reads these directly; HUD bridges them via the
// `--es-accent` CSS custom property set on the game root.
//
// Each palette can ship `themePalettes.<pack>` overrides. When that pack
// is active, the matching keys merge over the base so the procedural
// battlefield reads as the chosen theme even before painted art lands.

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
    themePalettes: {
      // Painted II — Volcanic Basalt. Charred basalt ground, deep
      // ember-red sky, lava-bright motes.
      v2: {
        sky:          ['#3a1810', '#150505'],
        mountain:     '#2a1410',
        ground:       '#1f1410',
        groundDetail: '#080202',
        midMotif:     '#ff6028',
        banner:       '#ff5a20',
        bannerEnemy:  '#ff9060',
        flash:        '#ffb060',
        hudAccent:    '#ff6428',
      },
    },
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
    themePalettes: {
      // Painted II — Biolume Reef. Deep teal sea-shadow with cyan
      // bioluminescent motes, coral-tinted enemy banner.
      v2: {
        sky:          ['#0c4044', '#03181c'],
        mountain:     '#0a3236',
        ground:       '#0e2e2e',
        groundDetail: '#031818',
        midMotif:     '#48f7e5',
        banner:       '#48f7e5',
        bannerEnemy:  '#ff5cb6',
        flash:        '#aaf5ec',
        hudAccent:    '#3df0d8',
      },
    },
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
    // Sun Foundry already matches Painted II's "Sun Foundry / Sun
    // Foundry Gate / Foundry Strike" theme so no override needed.
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
    // Storm Republic already matches Painted II.
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
    themePalettes: {
      // Painted II — Void Crystal. Slightly cooler crystal-violet
      // sky/ground with magenta highlights.
      v2: {
        sky:          ['#2a0e54', '#0a0220'],
        mountain:     '#15082a',
        ground:       '#180a3c',
        groundDetail: '#06001a',
        midMotif:     '#d4a8ff',
        banner:       '#e0b8ff',
        bannerEnemy:  '#ff5cb6',
        flash:        '#f0d0ff',
        hudAccent:    '#c47cff',
      },
    },
  },
};
