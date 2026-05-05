// TopBar — three-zone command bar (Phase 1 UI overhaul).
//
// LEFT  : your-side card — portrait + era name + LARGE GOLD COUNTER + population (X/MAX)
// CENTER: era badge + XP progress bar + evolve CTA (glows when ready)
// RIGHT : enemy-side card — portrait + era + base HP indicator
//
// Sub-row of compact tool buttons (time / speed / pause / power-ups /
// settings / shortcuts) sits below the main bar.

import { useEffect, useRef, useState } from 'react';
import { getEraByIndex, nextEra } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';
import { Icon } from '../../../icons.jsx';

export default function TopBar({
  gold, goldRate, xp, eraIndex, playerHP, enemyHP, maxHP,
  enemyEraIndex, timeSec, speed,
  population, populationMax,
  paused,
  specialReady,
  evolveReady, onEvolve,
  onTogglePause, onCycleSpeed, onOpenSettings, onOpenPowerUps, onOpenShortcuts, onOpenStats,
}) {
  const era      = getEraByIndex(eraIndex);
  const next     = nextEra(era?.id);
  const enemyEra = getEraByIndex(enemyEraIndex);
  // One-shot "just became ready" flash on the EVOLVE CTA. Watching the
  // transition rather than the steady-state lets us flag the moment the
  // player crossed the affordability line without spamming animation
  // every render.
  const [justReady, setJustReady] = useState(false);
  const prevReadyRef = useRef(false);
  useEffect(() => {
    if (evolveReady && !prevReadyRef.current) {
      setJustReady(true);
      const t = setTimeout(() => setJustReady(false), 1400);
      prevReadyRef.current = true;
      return () => clearTimeout(t);
    }
    if (!evolveReady) prevReadyRef.current = false;
  }, [evolveReady]);
  const xpR      = next ? Math.min(1, xp / next.xpToEvolve) : 1;
  const playerR  = clamp01(playerHP / maxHP);
  const enemyR   = clamp01(enemyHP / maxHP);
  const lowHP    = playerR > 0 && playerR < 0.25;
  const isCapped = gold >= BALANCE.GOLD_CAP;
  const popMax   = populationMax || BALANCE.MAX_UNITS_PER_SIDE || 10;

  return (
    <header className={`es-topbar2${lowHP ? ' is-low-hp' : ''}`} aria-label="Battle status">
      {/* LEFT — player card */}
      <div className="es-zone es-zone-player">
        <div className="es-portrait es-portrait-player" aria-hidden="true">
          <span className="es-portrait-glyph">{(era?.name || 'YOU').split(' ')[0]}</span>
        </div>
        <div className="es-zone-stack">
          <div className="es-gold-row" title={isCapped ? `Gold cap reached — spend it!` : `Gold (+${goldRate || 0}/s trickle)`}>
            <span className="es-gold-icon" aria-hidden="true">{Icon.bolt}</span>
            <span className={`es-gold-num${isCapped ? ' is-capped' : ''}`}>{gold}</span>
            <span className="es-gold-label">{isCapped ? `cap ${BALANCE.GOLD_CAP}` : 'GOLD'}</span>
            {!isCapped && goldRate > 0 && (
              <span className="es-gold-rate" aria-label={`+${goldRate} gold per second`}>+{goldRate}/s</span>
            )}
          </div>
          <div className="es-pop-row" title={`Population: ${population}/${popMax}`}>
            <span className="es-pop-label">POP</span>
            <div className="es-pop-cells" aria-hidden="true">
              {Array.from({ length: popMax }, (_, i) => (
                <i key={i} className={`es-pop-cell${i < population ? ' is-on' : ''}`}/>
              ))}
            </div>
            <span className="es-pop-num">{population}/{popMax}</span>
          </div>
        </div>
      </div>

      {/* CENTER — era + XP + evolve */}
      <div className="es-zone es-zone-center">
        <div className="es-era-chip">
          <span className="es-era-chip-num">AGE {eraIndex + 1}/5</span>
          <span className="es-era-chip-name">{era?.name}</span>
        </div>
        <div className="es-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xpR * 100)}>
          <div className="es-xp-track">
            <div className="es-xp-fill" style={{ width: `${xpR * 100}%` }}/>
            <span className="es-xp-label">{next ? `${xp} / ${next.xpToEvolve} XP` : 'APEX ERA'}</span>
          </div>
        </div>
        {next && (
          <button
            type="button"
            className={`es-evolve-cta${evolveReady ? ' is-ready' : ''}${justReady ? ' is-just-ready' : ''}`}
            disabled={!evolveReady}
            onClick={onEvolve}
            title={evolveReady ? `Evolve to ${next.name}` : `Reach ${next.xpToEvolve} XP and ${next.evolveCost}g`}>
            <span>EVOLVE</span>
            <span className="es-evolve-cta-cost">{next.evolveCost}g</span>
          </button>
        )}
      </div>

      {/* RIGHT — enemy card */}
      <div className="es-zone es-zone-enemy">
        <div className="es-zone-stack es-zone-stack-right">
          <div className="es-enemy-line">
            <span className="es-enemy-eralabel">AGE {enemyEraIndex + 1}/5</span>
            <span className="es-enemy-eraname">{enemyEra?.name}</span>
          </div>
          <div className="es-hp2 es-hp2-enemy" aria-label={`Enemy base HP, ${Math.round(enemyR * 100)}%`}>
            <div className="es-hp2-fill" style={{ width: `${enemyR * 100}%` }}/>
            <span className="es-hp2-num">{Math.max(0, Math.round(enemyHP))}/{maxHP}</span>
          </div>
        </div>
        <div className="es-portrait es-portrait-enemy" aria-hidden="true">
          <span className="es-portrait-glyph">{(enemyEra?.name || 'FOE').split(' ')[0]}</span>
        </div>
      </div>

      {/* Sub-row tools */}
      <nav className="es-tools" aria-label="Game controls">
        <span className="es-tool-time">{timeSec}s</span>
        <button type="button" className={`es-tool${speed > 1 ? ' is-on' : ''}`} onClick={onCycleSpeed} title={`Speed ${speed}×`}><span className="es-tool-text">{speed}×</span></button>
        <button type="button" className={`es-tool${paused ? ' is-on' : ''}`} onClick={onTogglePause} title={paused ? 'Resume (P)' : 'Pause (P)'}>{paused ? Icon.play : Icon.pause}</button>
        <button type="button" className="es-tool" onClick={onOpenPowerUps} title="Power-ups (U)" aria-label="Power-ups">{Icon.bolt}</button>
        <button type="button" className="es-tool" onClick={onOpenStats}     title="Stats"        aria-label="Stats">{Icon.trophy}</button>
        <button type="button" className="es-tool" onClick={onOpenSettings}  title="Settings"     aria-label="Settings">{Icon.settings}</button>
        <button type="button" className="es-tool" onClick={onOpenShortcuts} title="Shortcuts (?)" aria-label="Shortcuts">{Icon.keyboard}</button>
        {specialReady && <span className="es-tool-pulse" aria-hidden="true"/>}
      </nav>
    </header>
  );
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
