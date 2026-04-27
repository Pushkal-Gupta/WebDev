// Per-era palette. Renderer reads these directly; HUD bridges them via the
// `--es-accent` CSS custom property set on the game root.

export const PALETTES = {
  'ember-tribe': {
    sky:          ['#ff8a3a', '#7d2a10'],
    mountain:     '#2c150a',
    ground:       '#3a2a10',
    groundDetail: '#1e1608',
    midMotif:     '#ffb070',     // ember sparks in the air
    banner:       '#ffd05a',
    bannerEnemy:  '#ff5a4d',
    flash:        '#ffe14f',
    hudAccent:    '#ffb070',
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
    hudAccent:    '#d8d4cc',
  },
  'sun-foundry': {
    sky:          ['#dba85a', '#62311a'],
    mountain:     '#3a1f12',
    ground:       '#3a261a',
    groundDetail: '#1f140c',
    midMotif:     '#ffcb6b',     // foundry haze
    banner:       '#ffcb6b',
    bannerEnemy:  '#bb441f',
    flash:        '#ffd97a',
    hudAccent:    '#ffcb6b',
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
    hudAccent:    '#7be3ff',
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
    hudAccent:    '#c89bff',
  },
};
