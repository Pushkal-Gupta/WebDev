// GameShell — immersive wrapper. Black background, full-bleed canvas,
// and a tiny floating top-left cluster (Exit · Pause · Fullscreen) that
// fades to ~35% opacity while the player is engaged. Pause overlay holds
// the mute toggle. No site chrome — if a player is here, they're playing.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { isMuted, setMuted } from '../sound.js';
import { PauseOverlay } from './game-shell/Overlays.jsx';
import DeviceHint from './DeviceHint.jsx';
import VirtualControls, { hasBinding } from '../input/useVirtualControls.jsx';

const IDLE_HIDE_MS = 1500;

export default function GameShell({
  game,
  mode,
  onExit,
  onRestart,
  children,
  onPauseChange,
  onBypassDeviceHint,
}) {
  const [paused, setPaused]                 = useState(false);
  const [muted, setLocalMuted]              = useState(() => isMuted());
  const [isFullscreen, setFullscreen]       = useState(false);
  const [deviceBypassed, setDeviceBypassed] = useState(false);
  const [chromeVisible, setChromeVisible]   = useState(true);
  const idleTimerRef = useRef(0);
  const shellRef = useRef(null);

  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 820);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 820);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const needsDeviceHint = !deviceBypassed && narrow && game.mobileSupport === 'desktop-only';

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      onPauseChange?.(next);
      return next;
    });
  }, [onPauseChange]);

  const toggleMute = useCallback(() => {
    setLocalMuted((m) => {
      const next = !m;
      setMuted(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const node = shellRef.current;
    if (!node) return;
    if (!document.fullscreenElement) {
      node.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Auto-request fullscreen once on mount (browsers gate this on user gesture;
  // since the click that took us to /play counts, this usually works).
  useEffect(() => {
    if (needsDeviceHint) return;
    const node = shellRef.current;
    if (!node) return;
    const t = setTimeout(() => {
      if (!document.fullscreenElement) node.requestFullscreen?.().catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [needsDeviceHint]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape') {
        if (paused) togglePause();
        return;
      }
      if (e.key === 'p' || e.key === 'P') togglePause();
      else if (e.key === 'm' || e.key === 'M') toggleMute();
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'r' || e.key === 'R') onRestart?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, togglePause, toggleMute, toggleFullscreen, onRestart]);

  // Auto-hide the floating cluster after idle. Any pointer/key activity brings it back.
  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;
    const ping = () => {
      setChromeVisible(true);
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        if (!paused) setChromeVisible(false);
      }, IDLE_HIDE_MS);
    };
    ping();
    node.addEventListener('mousemove', ping);
    node.addEventListener('pointerdown', ping);
    node.addEventListener('touchstart', ping, { passive: true });
    window.addEventListener('keydown', ping);
    return () => {
      window.clearTimeout(idleTimerRef.current);
      node.removeEventListener('mousemove', ping);
      node.removeEventListener('pointerdown', ping);
      node.removeEventListener('touchstart', ping);
      window.removeEventListener('keydown', ping);
    };
  }, [paused]);

  return (
    <div
      className="game-shell"
      ref={shellRef}
      data-paused={paused ? '1' : '0'}
      data-chrome={chromeVisible ? 'on' : 'off'}>
      {/* Tiny floating cluster, top-left. Fades to 35% on idle, full on hover. */}
      <div className="game-shell-floating">
        <button
          className="floating-btn"
          onClick={onExit}
          aria-label="Back to lobby"
          title="Back (Esc)">
          {Icon.back}
        </button>
        <button
          className={'floating-btn' + (paused ? ' is-active' : '')}
          onClick={togglePause}
          aria-label={paused ? 'Resume' : 'Pause'}
          title={paused ? 'Resume (P)' : 'Pause (P)'}>
          {paused ? Icon.play : Icon.pause}
        </button>
        <button
          className="floating-btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
          {isFullscreen ? Icon.fullscreenExit : Icon.fullscreen}
        </button>
      </div>

      <div className="game-shell-stage">
        {needsDeviceHint ? (
          <DeviceHint
            game={game}
            onContinue={() => { setDeviceBypassed(true); onBypassDeviceHint?.(); }}
            onExit={onExit}/>
        ) : (
          <>
            <div className="game-shell-viewport-inner">
              {children}
            </div>
            {hasBinding(game.id) && <VirtualControls gameId={game.id}/>}
          </>
        )}
      </div>

      <PauseOverlay
        open={paused}
        onResume={togglePause}
        onRestart={() => { if (paused) togglePause(); onRestart?.(); }}
        onExit={onExit}
        onToggleMute={toggleMute}
        muted={muted}/>
    </div>
  );
}
