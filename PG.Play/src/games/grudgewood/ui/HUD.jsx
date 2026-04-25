// HUD — biome name, deaths, timer, retry hint, near-miss flash, death overlay.
// Pure presentational — driven by props from the main game state.

import { Icon } from '../../../icons.jsx';

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.max(0, s - m * 60);
  return `${m}:${r.toFixed(2).padStart(5, '0')}`;
};

export default function HUD({
  biomeName,
  segmentLabel,
  deaths,
  time,
  axeUnlocked,
  flashKey,
  deathState,
  onRetry,
  paused,
  axeBeacon,
  toast,
}) {
  return (
    <div className="gw-hud" data-flash={flashKey || 0}>
      <div className="gw-hud-top">
        <div className="gw-hud-biome">
          <div className="gw-hud-biome-name">{biomeName}</div>
          <div className="gw-hud-biome-sub">{segmentLabel}</div>
        </div>
        <div className="gw-hud-stats">
          <div className="gw-hud-stat" title="Deaths">
            <span className="gw-hud-icon">{Icon.heartF}</span><span>{deaths}</span>
          </div>
          <div className="gw-hud-stat" title="Time">
            <span className="gw-hud-icon">{Icon.clock}</span><span>{fmtTime(time)}</span>
          </div>
          {axeUnlocked ? (
            <div className="gw-hud-stat gw-hud-stat--axe" title="Axe">
              <span className="gw-hud-icon">{Icon.bolt}</span>
            </div>
          ) : null}
        </div>
      </div>

      {axeBeacon ? (
        <div className="gw-axe-beacon">
          <div className="gw-axe-beacon-dot" />
          <span>{axeBeacon}</span>
        </div>
      ) : null}

      {toast ? <div className="gw-toast">{toast}</div> : null}

      {deathState ? (
        <div className="gw-death">
          <div className="gw-death-card">
            <div className="gw-death-cause">{deathState.kind || 'You died.'}</div>
            <div className="gw-death-epitaph">{deathState.epitaph}</div>
            <button className="gw-btn gw-btn--primary" onClick={onRetry} autoFocus>
              <span className="gw-hud-icon">{Icon.restart}</span> Retry — Space
            </button>
            <div className="gw-death-hint">Last checkpoint: {deathState.nearestCheckpoint || '—'}</div>
          </div>
        </div>
      ) : null}

      {paused && !deathState ? (
        <div className="gw-paused">PAUSED — press P to resume</div>
      ) : null}
    </div>
  );
}
