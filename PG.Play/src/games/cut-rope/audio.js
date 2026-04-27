// Cut the Rope — sfx wiring. Wraps the platform sfx bus with
// game-specific cues so callers don't have to know which platform sound
// to fire for a "rope cut" vs a "level clear."
//
// The platform `sfx` cues are mute-aware via isMuted(); we just route.

import { sfx } from '../../sound.js';

export const audio = {
  ropeCut() { sfx.click?.(); },
  candySwing() { /* reserved — no platform cue is well-suited yet */ },
  starGet() { sfx.star?.() ?? sfx.coin?.(); },
  bubblePop() { sfx.bounce?.(); },
  blowerHum() { /* reserved — would require a sustained AudioContext loop */ },
  targetChomp() { sfx.confirm?.(); },
  levelClear() { sfx.win?.(); },
  levelFail() { sfx.lose?.(); },
  buttonClick() { sfx.click?.(); },
};
