// Epitaphs — one-liners shown on death. Kind-keyed; falls back to generic.
// New death kinds (acorn, boar, vine, boulder, geyser) get their own
// flavour so the death card always lands a joke instead of a shrug.

export const EPITAPHS = {
  whip: [
    'A branch remembered an argument.',
    'Heard the creak. Stood still.',
    'Wrong tree. Wrong second.',
    'The oak took its shot.',
    'You gave the canopy an opening.',
  ],
  snare: [
    'The roots were listening.',
    'Standing still was the mistake.',
    'Roots know what you ate last.',
    'Patience, punished.',
  ],
  mushroom: [
    'Spores have opinions.',
    'Red cap. Red flag.',
    'A mushroom named you.',
  ],
  log: [
    'A log with errands.',
    'Downhill is a rumor.',
    'The bark let go on purpose.',
    'Momentum, delivered.',
  ],
  pit: [
    'You found the cellar.',
    'The forest floor wasn\'t.',
    'A short, final descent.',
    'Gravity, on the clock.',
  ],
  predator: [
    'The tree was staring the whole time.',
    'A branch came down like an appointment.',
    'It had been watching for a while.',
    'The grove had a favourite.',
  ],
  stump: [
    'The stump was holding a spike.',
    'You took a seat. It took its turn.',
    'Rest is for elsewhere.',
  ],
  embers: [
    'A coal disagreed.',
    'The Heart cleared its throat.',
    'You walked under the kindling.',
  ],
  wind: [
    'The wind shoved. The cliff helped.',
    'Air had plans.',
    'The gust knew where you would land.',
  ],
  acorn: [
    'A seed with intent.',
    'The tree had range.',
    'A canopy did the math.',
    'You miscounted the arc.',
  ],
  boar: [
    'A tree with somewhere to be.',
    'Roots are wheels in the wrong story.',
    'A trunk took the racing line.',
  ],
  vine: [
    'The grass was a question. The vine was the answer.',
    'You tried to time a hungry thing.',
    'Slow doesn\'t mean polite.',
  ],
  boulder: [
    'The shadow on the ground was advance notice.',
    'A rock, kept aloft, eventually falls.',
    'You stood under the punchline.',
  ],
  geyser: [
    'The bubbles were on schedule.',
    'You were exactly on time.',
    'Tar keeps a calendar.',
  ],
  lash: [
    'Two branches. One window. You walked through neither.',
    'It was a duet. You were the third part.',
    'The first whip set the tempo. The second kept it.',
  ],
  mirror: [
    'You stayed too long looking at yourself.',
    'It walked toward you because you let it.',
    'The reflection had range.',
  ],
  unknown: [
    'The forest filed it under "deserved".',
    'Something happened. The forest knows.',
    'The walk ended. The forest didn\'t.',
  ],
};

export function pickEpitaph(kind) {
  const arr = EPITAPHS[kind] || EPITAPHS.unknown;
  return arr[(Math.random() * arr.length) | 0];
}

export const KIND_LABEL = {
  whip:     'A branch did this.',
  snare:    'The roots did this.',
  mushroom: 'A mushroom did this.',
  log:      'A log did this.',
  pit:      'The floor did this.',
  predator: 'A tree did this.',
  stump:    'A stump did this.',
  embers:   'The embers did this.',
  wind:     'The wind did this.',
  acorn:    'An acorn did this.',
  boar:     'A charging tree did this.',
  vine:     'A vine did this.',
  boulder:  'A boulder did this.',
  geyser:   'A tar geyser did this.',
  lash:     'A pair of branches did this.',
  mirror:   'A mirror tree did this.',
  unknown:  'You died.',
};
