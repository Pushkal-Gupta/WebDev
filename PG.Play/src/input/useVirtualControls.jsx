// Virtual on-screen controls for touch devices.
//
// Design choice: the pad dispatches synthetic `keydown`/`keyup` events on
// window with a matching `key` + `code`. Games already listen for those, so
// this layer slots in underneath without editing any game component.
//
// Per-game bindings are declarative (BINDINGS). Multitouch works naturally
// because pointer events fire independently per-finger.

import { useEffect, useRef, useState } from 'react';

const MOBILE_MQ = '(max-width: 820px), (pointer: coarse)';

export function useIsMobile() {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const handler = () => setM(mq.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return m;
}

/**
 * Each binding entry maps a game id to the physical controls we want to
 * surface on mobile. `dpad` is optional; `buttons` is an ordered list.
 * `key` / `code` must match what the game's native keyboard handler checks.
 */
const BINDINGS = {
  grudgewood: {
    dpad: {
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'jump', label: 'Jump', key: ' ', code: 'Space' }],
  },
  nightcap: {
    dpad: {
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'jump', label: 'Jump', key: ' ', code: 'Space' }],
  },
  hook: {
    // Stickman Hook is a one-button game — grab + release.
    dpad: null,
    buttons: [{ id: 'grab', label: 'Grab', key: ' ', code: 'Space' }],
  },
  vex: {
    // Trace — precision platformer. Left/right + jump.
    dpad: {
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'jump', label: 'Jump', key: ' ', code: 'Space' }],
  },
  bob: {
    // Night Shift — walk + tiptoe (Shift).
    dpad: {
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'sneak', label: 'Tiptoe', key: 'Shift', code: 'ShiftLeft' }],
  },
  badicecream: {
    // Frost Fight — grid maze: 4-way d-pad + freeze/melt action.
    dpad: {
      up:    { key: 'w', code: 'KeyW' },
      down:  { key: 's', code: 'KeyS' },
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'freeze', label: 'Freeze', key: ' ', code: 'Space' }],
  },
  goalbound: {
    // Goalbound — 1P vs Bot: move + jump + kick.
    dpad: {
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [
      { id: 'jump', label: 'Jump', key: 'w', code: 'KeyW' },
      { id: 'kick', label: 'Kick', key: 's', code: 'KeyS' },
    ],
  },
  happywheels: {
    // Faceplant — throttle / brake / lean
    dpad: {
      up:    { key: 'w', code: 'KeyW' },
      down:  { key: 's', code: 'KeyS' },
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'throttle', label: 'Gas', key: 'd', code: 'KeyD' }],
  },
  fps: {
    // Raycaster reads WASD codes. No aim stick yet — touch-drag on canvas
    // turns the camera via the game's existing mouse handler.
    dpad: {
      up:    { key: 'w', code: 'KeyW' },
      down:  { key: 's', code: 'KeyS' },
      left:  { key: 'a', code: 'KeyA' },
      right: { key: 'd', code: 'KeyD' },
    },
    buttons: [{ id: 'fire', label: 'Fire', key: ' ', code: 'Space' }],
  },
};

export function hasBinding(gameId) {
  return !!BINDINGS[gameId];
}

const dispatch = (type, b) => {
  const e = new KeyboardEvent(type, { key: b.key, code: b.code, bubbles: true });
  window.dispatchEvent(e);
};

export default function VirtualControls({ gameId, visible = true }) {
  const isMobile = useIsMobile();
  const binding  = BINDINGS[gameId];
  const activeRef = useRef({});

  // Release any held keys if the component unmounts mid-hold.
  useEffect(() => () => {
    Object.keys(activeRef.current).forEach((code) => {
      dispatch('keyup', { key: activeRef.current[code]?.key ?? '', code });
    });
    activeRef.current = {};
  }, []);

  if (!isMobile || !visible || !binding) return null;

  const press = (b) => {
    if (activeRef.current[b.code]) return;
    activeRef.current[b.code] = b;
    dispatch('keydown', b);
  };
  const release = (b) => {
    if (!activeRef.current[b.code]) return;
    delete activeRef.current[b.code];
    dispatch('keyup', b);
  };

  const pad = (b, cls, label) => (
    <button
      key={b.code}
      className={`vctl-btn ${cls}`}
      onPointerDown={(e) => {
        e.preventDefault();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
        press(b);
      }}
      onPointerUp={(e) => { e.preventDefault(); release(b); }}
      onPointerCancel={(e) => { e.preventDefault(); release(b); }}
      onPointerLeave={(e) => { if (e.buttons === 0) release(b); }}
      aria-label={label}>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="vctl" aria-hidden="false">
      {binding.dpad && (
        <div className="vctl-dpad">
          {binding.dpad.up    && pad(binding.dpad.up,    'vctl-up',    '↑')}
          {binding.dpad.left  && pad(binding.dpad.left,  'vctl-left',  '←')}
          {binding.dpad.right && pad(binding.dpad.right, 'vctl-right', '→')}
          {binding.dpad.down  && pad(binding.dpad.down,  'vctl-down',  '↓')}
        </div>
      )}
      <div className="vctl-actions">
        {binding.buttons.map((b) => pad(b, 'vctl-action', b.label))}
      </div>
    </div>
  );
}
