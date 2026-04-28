// Public API for the cut-rope entity factories. Each factory builds
// a Three.js mesh hierarchy + a state object, returning an interface
// the gameplay loop drives via `update / sync / dispose`.

export { makeAnchor } from './anchor.js';
export { makeCandy }  from './candy.js';
export { makeRope }   from './rope.js';
export { makeStar }   from './star.js';
export { makeTarget } from './target.js';
export { makeBubble } from './bubble.js';
export { makeBlower } from './blower.js';
export { makeSpike }  from './spike.js';
export { makeTutorialPulse } from './tutorial.js';
