// useLongPress — fires `onLongPress` after `delayMs` of a sustained
// touchstart / pointerdown, while leaving normal click behaviour intact.
// Cancels on touchmove past `slopPx` so a scroll gesture doesn't trip it.

import { useCallback, useRef } from 'react';

export function useLongPress({ onLongPress, delayMs = 500, slopPx = 8 } = {}) {
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
    firedRef.current = false;
  }, []);

  const onPointerDown = useCallback((e) => {
    // Only respond to primary button or touch.
    if (e.button !== undefined && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    firedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress?.(e);
    }, delayMs);
  }, [delayMs, onLongPress]);

  const onPointerMove = useCallback((e) => {
    if (!startRef.current) return;
    const dx = (e.clientX || 0) - startRef.current.x;
    const dy = (e.clientY || 0) - startRef.current.y;
    if (Math.hypot(dx, dy) > slopPx) clear();
  }, [slopPx, clear]);

  const onPointerUp = useCallback(() => {
    clear();
  }, [clear]);

  // Suppresses the click that follows a long-press so the user doesn't
  // accidentally spawn a unit while reading its stats.
  const onClickCapture = useCallback((e) => {
    if (firedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      firedRef.current = false;
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onClickCapture,
  };
}
