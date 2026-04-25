// Grudgewood — analog touch joystick + Jump button.
//
// Renders only on coarse-pointer devices and only while the gameplay phase
// is `play`. Direct mutation of the Input instance mirrors how the keyboard
// handler talks to the same fields, so the snapshot() pipeline downstream
// is unchanged.

import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../../input/useVirtualControls.jsx';

export default function TouchControls({ inputRef, active }) {
  const isMobile = useIsMobile();
  const stickElRef = useRef(null);
  const stickPointer = useRef({ id: null, cx: 0, cy: 0, r: 56 });
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [jumpDown, setJumpDown] = useState(false);

  // If the component unmounts mid-press, release the input cleanly.
  useEffect(() => () => {
    const input = inputRef?.current;
    if (input) {
      input.setAxis?.(0, 0);
      input.jumpDown = false;
    }
  }, [inputRef]);

  if (!isMobile || !active) return null;

  const updateStick = (clientX, clientY) => {
    const input = inputRef?.current; if (!input) return;
    const { cx, cy, r } = stickPointer.current;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > r) { dx = (dx / len) * r; dy = (dy / len) * r; }
    setKnob({ x: dx, y: dy });
    input.setAxis(dx / r, dy / r);
  };

  const onStickDown = (e) => {
    e.preventDefault();
    const el = stickElRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    stickPointer.current = {
      id: e.pointerId,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      r: rect.width / 2,
    };
    try { el.setPointerCapture(e.pointerId); } catch {}
    updateStick(e.clientX, e.clientY);
  };
  const onStickMove = (e) => {
    if (e.pointerId !== stickPointer.current.id) return;
    e.preventDefault();
    updateStick(e.clientX, e.clientY);
  };
  const onStickEnd = (e) => {
    if (e.pointerId !== stickPointer.current.id) return;
    e.preventDefault();
    stickPointer.current.id = null;
    setKnob({ x: 0, y: 0 });
    inputRef?.current?.setAxis?.(0, 0);
  };

  const onJumpDown = (e) => {
    const input = inputRef?.current; if (!input) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setJumpDown(true);
    // Match what the keyboard handler does in Input._handleKey:
    // - first edge sets jumpPressed for the next snapshot,
    // - jumpDown stays true while held.
    if (!input.jumpDown) input.consumeJumpPress?.();
    input.jumpDown = true;
  };
  const onJumpUp = (e) => {
    const input = inputRef?.current; if (!input) return;
    e.preventDefault();
    setJumpDown(false);
    input.jumpDown = false;
  };

  return (
    <div className="gw-touch-layer" aria-hidden="false">
      <div
        ref={stickElRef}
        className="gw-touch-stick"
        role="application"
        aria-label="Move"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
      >
        <div
          className="gw-touch-stick-knob"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <button
        type="button"
        className={`gw-touch-jump ${jumpDown ? 'is-active' : ''}`}
        aria-label="Jump"
        onPointerDown={onJumpDown}
        onPointerUp={onJumpUp}
        onPointerCancel={onJumpUp}
        onPointerLeave={(e) => { if (e.buttons === 0) onJumpUp(e); }}
        onContextMenu={(e) => e.preventDefault()}
      >JUMP</button>
    </div>
  );
}
