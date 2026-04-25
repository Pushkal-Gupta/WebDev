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

const IDLE_HIDE_MS = 2400; // hide chrome after this much idle time during play

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
  // Drawer is closed by default — companion content is opt-in during play so the
  // game owns the viewport. Help/pause overlays still cover the screen on demand.
  const [companionOpen, setCompanionOpen] = useState(false);
  // Auto-hide top chrome after idle. Suppressed when paused/help/companion is open.
  const [chromeVisible, setChromeVisible] = useState(true);
  const idleTimerRef = useRef(0);
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
  const toggleCompanion = useCallback(() => setCompanionOpen((c) => !c), []);

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
        if (companionOpen) { setCompanionOpen(false); return; }
        if (paused) { togglePause(); return; }
        return; // parent (GameIntro) handles exit
      }
      if (e.key === 'p' || e.key === 'P') togglePause();
      else if (e.key === 'i' || e.key === 'I') toggleCompanion();
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) toggleHelp();
      else if (e.key === 'm' || e.key === 'M') toggleMute();
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'r' || e.key === 'R') {
        if (onRestart) onRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [helpOpen, paused, companionOpen, togglePause, toggleHelp, toggleCompanion, toggleMute, toggleFullscreen, onRestart]);

  // Auto-hide chrome when the player is mid-game. Any pointer/key activity
  // resurfaces it for a few seconds. We deliberately keep the back button
  // visible at all times for safety — only the chips/toolbar fade.
  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;
    const ping = () => {
      setChromeVisible(true);
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        // Don't hide if any non-game UI is currently relevant to the user.
        if (!paused && !helpOpen && !companionOpen) setChromeVisible(false);
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
  }, [paused, helpOpen, companionOpen]);

  const modeLabel = MODE_LABEL[mode] || (mode ? String(mode) : null);
  const device = DEVICE_CHIPS[game.mobileSupport];

  const effectiveHelpSections = helpSections || (controls ? controls.map((c) => ({
    title: c.title,
    items: c.items.map((it) => ({ keys: it.keys, label: it.label })),
  })) : []);

  const hasCompanion = !hideCompanion && (goals || controls || (tips && tips.length) || stats);

  return (
    <div
      className="game-shell"
      ref={shellRef}
      data-paused={paused ? '1' : '0'}
      data-chrome={chromeVisible ? 'on' : 'off'}
      data-companion={companionOpen ? 'open' : 'closed'}>
      {/* Slim, edge-to-edge top chrome. Auto-hides after idle so the canvas
          can breathe; reappears on any pointer / key activity. */}
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
            onToggleCompanion={hasCompanion ? toggleCompanion : null}
            companionOpen={companionOpen}/>
        </div>
      </div>

      <div className="game-shell-stage">
        <div className={`game-shell-viewport ${viewportClassName}`} data-paused={paused ? '1' : '0'}>
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

        {/* Companion is a slide-in drawer overlay so it never steals canvas space. */}
        {hasCompanion && !needsDeviceHint && (
          <>
            <button
              className="shell-companion-scrim"
              aria-label="Close info panel"
              onClick={() => setCompanionOpen(false)}
              tabIndex={companionOpen ? 0 : -1}/>
            <div className="shell-companion-drawer" data-open={companionOpen ? '1' : '0'} aria-hidden={!companionOpen}>
              <CompanionPanel
                game={game}
                mode={modeLabel}
                best={best}
                goals={goals}
                tips={tips}
                controls={controls}
                stats={stats}
                onClose={() => setCompanionOpen(false)}
                onOpen={() => {}}/>
            </div>
          </>
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
