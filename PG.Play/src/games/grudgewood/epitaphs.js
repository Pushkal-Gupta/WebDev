// Epitaphs — one-liners shown on death. Kind-keyed; falls back to generic.

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
  whip: 'A branch did this.',
  snare: 'The roots did this.',
  mushroom: 'A mushroom did this.',
  log: 'A log did this.',
  pit: 'The floor did this.',
  predator: 'A tree did this.',
  stump: 'A stump did this.',
  embers: 'The embers did this.',
  wind: 'The wind did this.',
  unknown: 'You died.',
};
