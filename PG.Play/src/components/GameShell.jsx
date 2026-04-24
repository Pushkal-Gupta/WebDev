import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { isMuted, setMuted } from '../sound.js';
import Toolbar from './game-shell/Toolbar.jsx';
import CompanionPanel from './game-shell/CompanionPanel.jsx';
import { PauseOverlay, HelpOverlay } from './game-shell/Overlays.jsx';
import DeviceHint from './DeviceHint.jsx';
import VirtualControls, { hasBinding } from '../input/useVirtualControls.jsx';

const DEVICE_CHIPS = {
  'native':        { icon: 'phone',   label: 'Mobile native', tone: 'accent' },
  'touch-ok':      { icon: 'phone',   label: 'Touch ok',      tone: 'ghost' },
  'desktop-first': { icon: 'monitor', label: 'Keyboard',      tone: 'ghost' },
  'desktop-only':  { icon: 'monitor', label: 'Desktop only',  tone: 'warm' },
};

const MODE_LABEL = {
  '2p':    '2 Player',
  'bot':   'vs Bot',
  'start': 'Story',
  'coop':  'Co-op',
  'quick': 'Quick Match',
  'vs':    'Local Versus',
  'shootout': 'Penalty Shootout',
};

export default function GameShell({
  game,
  mode,
  best,
  onExit,
  onRestart,
  children,
  // companion panel content
  goals,
  controls,
  tips,
  stats,
  // help overlay content (falls back to controls)
  helpSections,
  helpTitle,
  // optional: override default behaviors
  getMuted,
  onMuteChange,
  onPauseChange,
  onBypassDeviceHint,
  // layout
  hideCompanion = false,
  viewportClassName = '',
}) {
  const [helpOpen, setHelpOpen]       = useState(false);
  const [paused, setPaused]           = useState(false);
  const [muted, setLocalMuted]        = useState(() => (getMuted ? getMuted() : isMuted()));
  const [isFullscreen, setFullscreen] = useState(false);
  const [deviceBypassed, setDeviceBypassed] = useState(false);
  const shellRef = useRef(null);

  // Device hint: show if this is a desktop-only title on a small screen
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

  const toggleHelp = useCallback(() => setHelpOpen((h) => !h), []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
    onMuteChange?.(next);
  }, [muted, onMuteChange]);

  const toggleFullscreen = useCallback(() => {
    const node = shellRef.current;
    if (!node) return;
    if (!document.fullscreenElement) {
      node.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      // Don't swallow keys that belong to text inputs.
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape') {
        if (helpOpen) { setHelpOpen(false); return; }
        if (paused) { togglePause(); return; }
        return; // parent (GameIntro) handles exit
      }
      if (e.key === 'p' || e.key === 'P') togglePause();
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) toggleHelp();
      else if (e.key === 'm' || e.key === 'M') toggleMute();
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'r' || e.key === 'R') {
        if (onRestart) onRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [helpOpen, paused, togglePause, toggleHelp, toggleMute, toggleFullscreen, onRestart]);

  const modeLabel = MODE_LABEL[mode] || (mode ? String(mode) : null);
  const device = DEVICE_CHIPS[game.mobileSupport];

  const effectiveHelpSections = helpSections || (controls ? controls.map((c) => ({
    title: c.title,
    items: c.items.map((it) => ({ keys: it.keys, label: it.label })),
  })) : []);

  return (
    <div className="game-shell" ref={shellRef} data-paused={paused ? '1' : '0'}>
      <div className="game-shell-topbar">
        <button className="btn btn-subtle game-shell-back" onClick={onExit} aria-label="Back to lobby">
          {Icon.back} <span className="game-shell-back-label">Back</span>
        </button>
        <div className="game-shell-title-block">
          <div className="game-shell-title">{game.name}</div>
          <div className="game-shell-meta">
            {modeLabel && <span className="chip chip-ghost chip-sm">{modeLabel}</span>}
            {device && (
              <span className={`chip chip-${device.tone} chip-sm`}>
                {Icon[device.icon]}<span>{device.label}</span>
              </span>
            )}
            {best !== undefined && best !== null && (
              <span className="chip chip-accent chip-sm">{Icon.trophy}<span>Best {best}</span></span>
            )}
          </div>
        </div>
        <div className="game-shell-toolbar-wrap">
          <Toolbar
            onRestart={onRestart}
            onTogglePause={togglePause}
            paused={paused}
            onToggleHelp={toggleHelp}
            helpOpen={helpOpen}
            onToggleMute={toggleMute}
            muted={muted}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            showRestart={!!onRestart}
          />
        </div>
      </div>

      <div className={`game-shell-stage ${hideCompanion ? 'game-shell-stage-full' : ''}`}>
        <div className={`game-shell-viewport ${viewportClassName}`} data-paused={paused ? '1' : '0'}>
          {needsDeviceHint ? (
            <DeviceHint
              game={game}
              onContinue={() => { setDeviceBypassed(true); onBypassDeviceHint?.(); }}
              onExit={onExit}/>
          ) : (
            <>
              <div className="game-shell-viewport-frame"/>
              <div className="game-shell-viewport-inner">
                {children}
              </div>
              {hasBinding(game.id) && <VirtualControls gameId={game.id}/>}
            </>
          )}
        </div>

        {!hideCompanion && !needsDeviceHint && (
          <CompanionPanel
            game={game}
            mode={modeLabel}
            best={best}
            goals={goals}
            tips={tips}
            controls={controls}
            stats={stats}
            onOpen={() => {}}/>
        )}
      </div>

      <PauseOverlay
        open={paused}
        onResume={togglePause}
        onRestart={() => { if (paused) togglePause(); onRestart?.(); }}
        onExit={onExit}/>
      <HelpOverlay
        open={helpOpen}
        onClose={toggleHelp}
        title={helpTitle || `${game.name} — how to play`}
        sections={effectiveHelpSections}/>
    </div>
  );
}
