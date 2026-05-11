// TopBar — carved war-table command strip.
//
// Three plates separated by engraved grooves:
//   L · player faction banner + bronze gold plinth + bone pop notches
//   C · era waypoint rail with XP fill + evolve plinth
//   R · enemy banner + segmented HP plate + utility coin cluster
//
// All visuals are built from primitives in styles.css:
//   .es-surface-plinth, .es-surface-banner, .es-surface-coin,
//   .es-bar-segmented, .es-text-stamp(-gold), .es-text-display

import { useEffect, useRef, useState } from 'react';
import { getEraByIndex, nextEra, ERAS } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';
import { Icon } from '../../../icons.jsx';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

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

  // One-shot "just became ready" flash on the EVOLVE plinth.
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
  const enemyR   = clamp01(enemyHP / maxHP);
  const playerR  = clamp01(playerHP / maxHP);
  const lowHP    = playerR > 0 && playerR < 0.25;
  const isCapped = gold >= BALANCE.GOLD_CAP;
  const popMax   = populationMax || BALANCE.MAX_UNITS_PER_SIDE || 10;

  return (
    <header className={`es-strip es-surface-plinth${lowHP ? ' is-low-hp' : ''}`} aria-label="Battle status">
      {/* L · player faction banner + economy */}
      <section className="es-strip-zone es-strip-l">
        <FactionBanner index={eraIndex} name={era?.name} side="player"/>
        <GoldPlinth gold={gold} rate={goldRate} capped={isCapped}/>
        <PopNotches population={population} max={popMax}/>
      </section>

      {/* C · path of ascension */}
      <section className="es-strip-zone es-strip-c">
        <EraWaypoints currentIdx={eraIndex} totalEras={ERAS.length}/>
        <XpRail xpR={xpR} xp={xp} target={next?.xpToEvolve} apex={!next}/>
        {next && (
          <EvolvePlinth
            ready={evolveReady}
            justReady={justReady}
            cost={next.evolveCost}
            nextName={next.name}
            xpMet={xp >= next.xpToEvolve}
            onEvolve={onEvolve}
          />
        )}
      </section>

      {/* R · enemy summary + tools */}
      <section className="es-strip-zone es-strip-r">
        <FactionBanner index={enemyEraIndex} name={enemyEra?.name} side="enemy"/>
        <EnemyHpPlate ratio={enemyR} hp={enemyHP} max={maxHP}/>
        <UtilityCluster
          timeSec={timeSec}
          speed={speed}
          paused={paused}
          onCycleSpeed={onCycleSpeed}
          onTogglePause={onTogglePause}
          onOpenPowerUps={onOpenPowerUps}
          onOpenStats={onOpenStats}
          onOpenSettings={onOpenSettings}
          onOpenShortcuts={onOpenShortcuts}
          specialReady={specialReady}
        />
      </section>
    </header>
  );
}

// ── Components ─────────────────────────────────────────────────────

function FactionBanner({ index, name, side }) {
  const num = ROMAN[index] || (index + 1);
  return (
    <div className={`es-banner es-surface-banner es-banner-${side}`} aria-hidden="true">
      <div className="es-banner-numeral">{num}</div>
      <div className="es-banner-name">{name || 'UNKNOWN'}</div>
    </div>
  );
}

function GoldPlinth({ gold, rate, capped }) {
  return (
    <div className={`es-gold-plinth${capped ? ' is-capped' : ''}`}
         title={capped ? `Gold cap reached — spend!` : `Gold (+${rate || 0}/s)`}>
      <div className="es-gold-coin" aria-hidden="true">G</div>
      <div className="es-gold-stack">
        <div className="es-gold-num es-text-stamp es-text-stamp-gold">{gold}</div>
        <div className="es-gold-rate-row">
          {capped
            ? <span className="es-gold-rate is-cap">CAP</span>
            : (rate > 0 && <span className="es-gold-rate">+{rate}/s</span>)}
        </div>
      </div>
    </div>
  );
}

function PopNotches({ population, max }) {
  return (
    <div className="es-pop-notches" title={`Population ${population}/${max}`}>
      <span className="es-text-eyebrow">POP</span>
      <div className="es-pop-bones" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={`es-pop-bone${i < population ? ' is-on' : ''}`}/>
        ))}
      </div>
      <span className="es-pop-num es-text-stamp">{population}<i>/{max}</i></span>
    </div>
  );
}

function EraWaypoints({ currentIdx, totalEras }) {
  return (
    <div className="es-waypoints" aria-hidden="true">
      <span className="es-text-eyebrow">PATH OF ASCENSION</span>
      <div className="es-waypoints-row">
        {Array.from({ length: totalEras }, (_, i) => (
          <span key={i}
                className={`es-waypoint${i < currentIdx ? ' is-past' : i === currentIdx ? ' is-current' : ' is-future'}`}>
            {ROMAN[i]}
          </span>
        ))}
      </div>
    </div>
  );
}

function XpRail({ xpR, xp, target, apex }) {
  return (
    <div className="es-xprail" role="progressbar"
         aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xpR * 100)}>
      <div className="es-xprail-track">
        <div className="es-xprail-fill" style={{ width: `${xpR * 100}%` }}/>
      </div>
      <div className="es-xprail-readout es-text-stamp">
        {apex ? 'APEX ERA' : `${xp} / ${target} XP`}
      </div>
    </div>
  );
}

function EvolvePlinth({ ready, justReady, cost, nextName, xpMet, onEvolve }) {
  return (
    <button
      type="button"
      className={`es-evolve-plinth es-press${ready ? ' is-ready' : ''}${justReady ? ' is-just-ready' : ''}${!xpMet ? ' is-faded' : ''}`}
      disabled={!ready}
      onClick={onEvolve}
      title={ready ? `Evolve → ${nextName}` : `Need ${cost}g + XP threshold`}>
      <span className="es-evolve-stamp es-text-display">EVOLVE</span>
      <span className="es-evolve-cost es-text-stamp es-text-stamp-gold">{cost}g</span>
    </button>
  );
}

function EnemyHpPlate({ ratio, hp, max }) {
  // 10 segments; segments empty as damage accrues.
  //   filled === 1  → full red flicker (critical, 'is-warn').
  //   filled ≤ 3    → softer breath on the topmost filled segment ('is-low').
  //   ratio ≤ 0.30  → "DANGER" eyebrow tag rides above the bar.
  const segs = 10;
  const filled = Math.max(0, Math.ceil(ratio * segs));
  const criticalSeg = filled === 1;
  const lowSeg = filled > 1 && filled <= 3;
  const danger = ratio > 0 && ratio <= 0.30;
  return (
    <div className="es-enemyhp" aria-label={`Enemy base ${Math.round(ratio * 100)}%`}>
      {danger && <span className="es-enemyhp-danger" aria-hidden="true">DANGER</span>}
      <div className="es-bar-segmented es-enemyhp-bar"
           style={{ '--es-bar-segments': segs, '--es-bar-color': '#c1352e', '--es-bar-color-hi': '#ff5e7a' }}>
        {Array.from({ length: segs }, (_, i) => {
          const isTopFilled = i === filled - 1;
          const cls =
            `es-bar-segment${i < filled ? ' is-on' : ''}` +
            `${isTopFilled && criticalSeg ? ' is-warn' : ''}` +
            `${isTopFilled && lowSeg ? ' is-low' : ''}`;
          return <div key={i} className={cls}/>;
        })}
      </div>
      <div className="es-enemyhp-readout es-text-stamp">{Math.max(0, Math.round(hp))}<i>/{max}</i></div>
    </div>
  );
}

function UtilityCluster({ timeSec, speed, paused, onCycleSpeed, onTogglePause, onOpenPowerUps, onOpenStats, onOpenSettings, onOpenShortcuts, specialReady }) {
  return (
    <nav className="es-utility" aria-label="Game controls">
      <span className="es-utility-time es-text-stamp" aria-label={`Time ${timeSec}s`}>{formatClock(timeSec)}</span>
      <span className="es-utility-sep" aria-hidden="true"/>
      <UtilCoin label={`${speed}×`} active={speed > 1} title={`Speed ${speed}×`} onClick={onCycleSpeed}>
        <span className="es-utility-text">{speed}×</span>
      </UtilCoin>
      <UtilCoin active={paused} title={paused ? 'Resume (P)' : 'Pause (P)'} onClick={onTogglePause}>
        {paused ? Icon.play : Icon.pause}
      </UtilCoin>
      <UtilCoin title="Power-ups (U)" onClick={onOpenPowerUps}>{Icon.bolt}</UtilCoin>
      <UtilCoin title="Stats" onClick={onOpenStats}>{Icon.trophy}</UtilCoin>
      <UtilCoin title="Settings" onClick={onOpenSettings}>{Icon.settings}</UtilCoin>
      <UtilCoin title="Shortcuts (?)" onClick={onOpenShortcuts}>{Icon.keyboard}</UtilCoin>
      {specialReady && <span className="es-utility-pulse" aria-hidden="true"/>}
    </nav>
  );
}

function UtilCoin({ children, active, title, onClick }) {
  return (
    <button type="button"
            className={`es-utility-coin es-press${active ? ' is-on' : ''}`}
            onClick={onClick}
            title={title}>
      {children}
    </button>
  );
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
