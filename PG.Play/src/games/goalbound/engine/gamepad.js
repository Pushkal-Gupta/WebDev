// GOALBOUND — gamepad polling helper.
//
//   Polls the Gamepad API and exposes a normalized button/dpad state
//   each frame. Maps standard mapping to the same {left, right, jump,
//   kick} shape the keyboard layer uses.
//
//   Usage:
//     const gp = createGamepadReader();
//     // each frame:
//     const inputs = gp.read(); // [{p1: {...}}, {p2: {...}}] or null

export const createGamepadReader = () => {
  const read = () => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    const pads = Array.from(navigator.getGamepads()).filter(Boolean);
    if (pads.length === 0) return null;
    return pads.map(snapshotPad);
  };
  return { read };
};

const DEAD = 0.25;

const snapshotPad = (p) => {
  // Standard mapping:
  //   buttons[0] = A (jump in our layout)
  //   buttons[1] = B (kick)
  //   buttons[2] = X (alt kick)
  //   buttons[12] / [13] / [14] / [15] = D-pad up/down/left/right
  //   axes[0] = left stick X
  const ax = p.axes?.[0] || 0;
  const dpadL = p.buttons?.[14]?.pressed;
  const dpadR = p.buttons?.[15]?.pressed;
  return {
    left:  dpadL || ax < -DEAD,
    right: dpadR || ax > DEAD,
    jump:  !!(p.buttons?.[0]?.pressed || p.buttons?.[12]?.pressed),
    kick:  !!(p.buttons?.[1]?.pressed || p.buttons?.[2]?.pressed),
    index: p.index,
  };
};
