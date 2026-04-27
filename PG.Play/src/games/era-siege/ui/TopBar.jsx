// TopBar — three-zone HUD frame.
//
// PlayerZone (left)   : your gold + your HP bar + portrait swatch
// CenterZone (middle) : era pill + XP arc + Evolve CTA
// EnemyZone (right)   : their HP bar + their era pill
//
// Sub-row underneath: Time / Speed / Pause / Power-ups / Settings / Sound / Shortcuts.
// Replaces the older flat HUD.jsx grid.

import { getEraByIndex, nextEra } from '../content/eras.js';
import { Icon } from '../../../icons.jsx';

export default function TopBar({
  gold, xp, eraIndex, playerHP, enemyHP, maxHP,
  enemyEraIndex, timeSec, speed,
  paused,
  specialReady,
  evolveReady, onEvolve,
  onTogglePause, onCycleSpeed, onOpenSettings, onOpenPowerUps, onOpenShortcuts,
}) {
  const era      = getEraByIndex(eraIndex);
  const next     = nextEra(era?.id);
  const enemyEra = getEraByIndex(enemyEraIndex);
  const xpR      = next ? Math.min(1, xp / next.xpToEvolve) : 1;
  const playerR  = clamp01(playerHP / maxHP);
  const enemyR   = clamp01(enemyHP / maxHP);
  const lowHP    = playerR > 0 && playerR < 0.25;

  return (
    <header className={`es-topbar2${lowHP ? ' is-low-hp' : ''}`} aria-label="Battle status">
      <div className="es-zone es-zone-player">
        <div className="es-portrait es-portrait-player" aria-hidden="true">YOU</div>
        <div className="es-zone-stack">
          <div className="es-zone-row">
            <span className="es-zone-icon" aria-hidden="true">{Icon.bolt}</span>
            <span className="es-zone-num es-zone-gold">{gold}</span>
            <span className="es-zone-label">gold</span>
          </div>
          <div className="es-hp2" aria-label={`Your base HP, ${Math.round(playerR * 100)}%`}>
            <div className="es-hp2-fill" style={{ width: `${playerR * 100}%` }}/>
            <span className="es-hp2-num">{Math.max(0, Math.round(playerHP))}</span>
          </div>
        </div>
      </div>

      <div className="es-zone es-zone-center">
        <div className="es-era-chip">
          <span className="es-era-chip-num">{eraIndex + 1}/5</span>
          <span className="es-era-chip-name">{era?.name}</span>
        </div>
        <div className="es-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xpR * 100)}>
          <div className="es-xp-track"><div className="es-xp-fill" style={{ width: `${xpR * 100}%` }}/></div>
          <span className="es-xp-label">{next ? `XP ${xp}/${next.xpToEvolve}` : 'Apex era'}</span>
        </div>
        {next && (
          <button
            type="button"
            className={`es-evolve-cta${evolveReady ? ' is-ready' : ''}`}
            disabled={!evolveReady}
            onClick={onEvolve}
            title={evolveReady ? `Evolve to ${next.name}` : `Reach ${next.xpToEvolve} XP and ${next.evolveCost}g`}>
            <span>Evolve</span>
            <span className="es-evolve-cta-cost">{next.evolveCost}g</span>
          </button>
        )}
      </div>

      <div className="es-zone es-zone-enemy">
        <div className="es-zone-stack es-zone-stack-right">
          <div className="es-zone-row">
            <span className="es-zone-label">era</span>
            <span className="es-zone-num">{enemyEraIndex + 1}/5</span>
          </div>
          <div className="es-hp2 es-hp2-enemy" aria-label={`Enemy base HP, ${Math.round(enemyR * 100)}%`}>
            <div className="es-hp2-fill" style={{ width: `${enemyR * 100}%` }}/>
            <span className="es-hp2-num">{Math.max(0, Math.round(enemyHP))}</span>
          </div>
        </div>
        <div className="es-portrait es-portrait-enemy" aria-hidden="true">{enemyEra?.name?.split(' ')[0] || 'FOE'}</div>
      </div>

      <nav className="es-tools" aria-label="Game controls">
        <span className="es-tool-time">{timeSec}s</span>
        <button type="button" className={`es-tool${speed > 1 ? ' is-on' : ''}`} onClick={onCycleSpeed} title={`Speed ${speed}×`}><span className="es-tool-text">{speed}×</span></button>
        <button type="button" className={`es-tool${paused ? ' is-on' : ''}`} onClick={onTogglePause} title={paused ? 'Resume (P)' : 'Pause (P)'}>{paused ? Icon.play : Icon.pause}</button>
        <button type="button" className="es-tool" onClick={onOpenPowerUps} title="Power-ups (U)" aria-label="Power-ups">{Icon.bolt}</button>
        <button type="button" className="es-tool" onClick={onOpenSettings}  title="Settings"     aria-label="Settings">{Icon.settings}</button>
        <button type="button" className="es-tool" onClick={onOpenShortcuts} title="Shortcuts (?)" aria-label="Shortcuts">{Icon.keyboard}</button>
        {specialReady && <span className="es-tool-pulse" aria-hidden="true"/>}
      </nav>
    </header>
  );
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
