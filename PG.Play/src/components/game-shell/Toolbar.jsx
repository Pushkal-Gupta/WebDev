import { Icon } from '../../icons.jsx';

export default function Toolbar({
  onRestart,
  onTogglePause,
  paused,
  onToggleHelp,
  helpOpen,
  onToggleMute,
  muted,
  onToggleFullscreen,
  isFullscreen,
  showPause = true,
  showRestart = true,
  showHelp = true,
  showMute = true,
  showFullscreen = true,
}) {
  return (
    <div className="shell-toolbar" role="toolbar" aria-label="Game controls">
      {showRestart && (
        <button className="btn-tool" onClick={onRestart} aria-label="Restart match" title="Restart (R)">
          {Icon.restart}
        </button>
      )}
      {showPause && (
        <button
          className={'btn-tool' + (paused ? ' is-active' : '')}
          onClick={onTogglePause}
          aria-label={paused ? 'Resume' : 'Pause'}
          title={paused ? 'Resume (P)' : 'Pause (P)'}>
          {paused ? Icon.play : Icon.pause}
        </button>
      )}
      {showHelp && (
        <button
          className={'btn-tool' + (helpOpen ? ' is-active' : '')}
          onClick={onToggleHelp}
          aria-label="How to play"
          title="Help (?)">
          {Icon.help}
        </button>
      )}
      {showMute && (
        <button
          className={'btn-tool' + (muted ? ' is-active' : '')}
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Unmute (M)' : 'Mute (M)'}>
          {muted ? Icon.mute : Icon.volume}
        </button>
      )}
      {showFullscreen && (
        <button
          className="btn-tool"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}>
          {isFullscreen ? Icon.fullscreenExit : Icon.fullscreen}
        </button>
      )}
    </div>
  );
}
