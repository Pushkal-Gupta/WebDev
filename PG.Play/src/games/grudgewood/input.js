// Input — keyboard + virtual touch sticks. Edge-triggered jump exposed via
// a one-frame `jumpPressed` flag.

export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.fwd = false;
    this.back = false;
    this.sprint = false;
    this.jumpDown = false;
    this.jumpPressed = false;
    this.touchAxis = { x: 0, y: 0 };
    this.touchActive = false;
    this.onPause = null;
    this.onRetry = null;
    this.onEsc = null;
    this._down = (e) => this._handleKey(e, true);
    this._up = (e) => this._handleKey(e, false);
  }

  _handleKey(e, down) {
    const k = e.key;
    let consumed = true;
    if (k === 'a' || k === 'A' || k === 'ArrowLeft')  this.left = down;
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') this.right = down;
    else if (k === 'w' || k === 'W' || k === 'ArrowUp')    this.fwd = down;
    else if (k === 's' || k === 'S' || k === 'ArrowDown')  this.back = down;
    else if (k === 'Shift') this.sprint = down;
    else if (k === ' ' || k === 'Spacebar') {
      if (down && !this.jumpDown) this.jumpPressed = true;
      this.jumpDown = down;
    } else if (down && (k === 'p' || k === 'P')) this.onPause?.();
    else if (down && (k === 'r' || k === 'R')) this.onRetry?.();
    else if (down && k === 'Escape') this.onEsc?.();
    else consumed = false;
    if (consumed && down) e.preventDefault?.();
  }

  attach(el) {
    window.addEventListener('keydown', this._down);
    window.addEventListener('keyup', this._up);
  }
  detach() {
    window.removeEventListener('keydown', this._down);
    window.removeEventListener('keyup', this._up);
  }

  // Touch axis (dpad emulation).
  setAxis(x, y) {
    this.touchAxis.x = x;
    this.touchAxis.y = y;
    this.touchActive = (Math.abs(x) > 0.05 || Math.abs(y) > 0.05);
  }

  // Snapshot — call once per frame. Resets edge flags after read.
  snapshot() {
    let left = this.left, right = this.right, fwd = this.fwd, back = this.back;
    if (this.touchActive) {
      // Stick → discrete movement.
      const x = this.touchAxis.x, y = this.touchAxis.y;
      if (x < -0.2) left = true;
      if (x > 0.2)  right = true;
      if (y < -0.2) fwd = true;   // up on dpad → forward
      if (y > 0.2)  back = true;
    }
    const snap = {
      left, right, fwd, back,
      sprint: this.sprint,
      jumpDown: this.jumpDown,
      jumpPressed: this.jumpPressed,
    };
    this.jumpPressed = false;
    return snap;
  }

  consumeJumpPress() {
    this.jumpPressed = true;
  }
}
