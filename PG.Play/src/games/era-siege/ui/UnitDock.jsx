// UnitDock — bottom command deck.
//
// Each card has three sections stacked top-to-bottom:
//   1. silhouette art slot (placeholder primitive; replaced by PNG via assets manifest)
//   2. name + role icon
//   3. cost + cooldown bar
//
// Long-press / hover reveals the full stat tooltip popover (UnitTip).
// Failed click on insufficient gold flashes red.

import { useEffect, useRef, useState } from 'react';
import { getUnit } from '../content/units.js';
import { useLongPress } from '../utils/useLongPress.js';
import RoleIcon from './RoleIcon.jsx';

export default function UnitDock({ unitIds, generalId, generalsUnlocked, generalUnlockCost, generalCooldownMs, generalAlive, gold, cooldownsMs, spawnQueue, onSpawn, onCancelQueued, onUnlockGenerals }) {
  const [flashId, setFlashId] = useState(null);
  const [tipId, setTipId]     = useState(null);
  const flashTimeoutRef = useRef(null);
  const [confirmId, setConfirmId] = useState(null);
  const confirmTimeoutRef = useRef(null);

  const triggerPoorFlash = (id) => {
    setFlashId(id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashId(null), 360);
  };
  const triggerConfirm = (id) => {
    setConfirmId(id);
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    confirmTimeoutRef.current = setTimeout(() => setConfirmId(null), 240);
  };

  useEffect(() => {
    if (!tipId) return;
    const close = () => setTipId(null);
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', close, { once: true });
    }, 50);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', close); };
  }, [tipId]);

  const generalDef = generalId ? getUnit(generalId) : null;
  const queue = spawnQueue || [];

  return (
    <div className="es-dock2-wrap">
      {/* Queued units strip — sits above the dock cards. Click to cancel
          (refunds 50% of unit cost). Only renders when queue non-empty
          so the layout doesn't reserve dead space. */}
      {queue.length > 0 && (
        <div className="es-queue" role="group" aria-label="Spawn queue">
          <span className="es-queue-label">QUEUE</span>
          <div className="es-queue-cells">
            {queue.map((id, i) => {
              const def = getUnit(id);
              if (!def) return null;
              const eraN = ERA_INDEX_BY_ID[def.eraId] || 1;
              const role = def.role;
              const src = `games/era-siege/unit/era${eraN}/${role}.png?v=${_VER}`;
              // Cooldown ratio for the HEAD card — when this unit-id's
              // spawn cooldown is decaying, show the bar so the player
              // sees WHY the queue isn't draining.
              const headCd = i === 0 ? (cooldownsMs?.[id] || 0) : 0;
              const cdR = (i === 0 && def.spawnCooldownMs > 0)
                ? Math.max(0, Math.min(1, headCd / def.spawnCooldownMs))
                : 0;
              return (
                <button
                  key={i + ':' + id}
                  type="button"
                  className={`es-queue-cell${i === 0 ? ' is-head' : ''}${cdR > 0 ? ' is-cooling' : ''}`}
                  onClick={() => onCancelQueued && onCancelQueued(i)}
                  title={`${def.name} — click to cancel (refund ${Math.floor(def.cost * 0.5)}g)`}>
                  <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
                  {cdR > 0 && (
                    <span className="es-queue-cd" style={{ width: `${(1 - cdR) * 100}%` }} aria-hidden="true"/>
                  )}
                </button>
              );
            })}
            {Array.from({ length: 5 - queue.length }, (_, i) => (
              <div key={'pad' + i} className="es-queue-cell is-pad" aria-hidden="true"/>
            ))}
          </div>
        </div>
      )}

      <div className="es-dock2" role="group" aria-label="Spawn unit">
      {unitIds.map((id, idx) => {
        const def = getUnit(id);
        if (!def) return null;
        const cd = cooldownsMs[id] || 0;
        const tooPoor = gold < def.cost;
        return (
          <UnitCard
            key={id}
            def={def}
            idx={idx}
            cd={cd}
            tooPoor={tooPoor}
            isFlashing={flashId === id}
            isConfirming={confirmId === id}
            tipOpen={tipId === id}
            onClick={() => {
              if (cd > 0) return;
              if (tooPoor) { triggerPoorFlash(id); return; }
              triggerConfirm(id);
              onSpawn(id);
            }}
            onLongPress={() => setTipId((cur) => cur === id ? null : id)}
          />
        );
      })}
      {generalDef && (
        <GeneralCard
          def={generalDef}
          unlocked={!!generalsUnlocked}
          unlockCost={generalUnlockCost}
          cooldownMs={generalCooldownMs}
          alive={generalAlive}
          gold={gold}
          tipOpen={tipId === '__general'}
          onUnlock={onUnlockGenerals}
          onSpawn={() => onSpawn(generalDef.id)}
          onLongPress={() => setTipId((cur) => cur === '__general' ? null : '__general')}
          poorFlash={flashId === '__general'}
          triggerPoorFlash={() => triggerPoorFlash('__general')}
        />
      )}
      </div>
    </div>
  );
}

// 4th card — the era's general. Two states:
//   locked   → shows a lock icon + the unlock cost; click pays the
//              one-time GENERAL_UNLOCK_COST gold to unlock
//   unlocked → behaves like a normal unit card but with the longer
//              cooldown + one-living cap baked into the sim.
function GeneralCard({ def, unlocked, unlockCost, cooldownMs, alive, gold, tipOpen, onUnlock, onSpawn, onLongPress, poorFlash, triggerPoorFlash }) {
  const longPress = useLongPress({ onLongPress, delayMs: 450 });
  const cdR = unlocked && cooldownMs > 0 && def.spawnCooldownMs > 0
    ? Math.max(0, Math.min(1, cooldownMs / def.spawnCooldownMs))
    : 0;
  let label, sub, disabled, tooPoor, onClick;
  if (!unlocked) {
    label = 'LOCKED';
    sub = `Unlock ${unlockCost}g`;
    tooPoor = gold < unlockCost;
    disabled = false;  // click still allowed (poor-flash if not enough)
    onClick = () => { if (tooPoor) triggerPoorFlash(); else onUnlock(); };
  } else if (alive) {
    label = def.name;
    sub = 'On the field';
    tooPoor = false;
    disabled = true;
    onClick = () => {};
  } else if (cooldownMs > 0) {
    label = def.name;
    sub = `Reform ${Math.ceil(cooldownMs / 1000)}s`;
    tooPoor = false;
    disabled = true;
    onClick = () => {};
  } else {
    label = def.name;
    sub = `${def.cost}g`;
    tooPoor = gold < def.cost;
    disabled = false;
    onClick = () => { if (tooPoor) triggerPoorFlash(); else onSpawn(); };
  }
  return (
    <div className="es-card2-wrap es-card2-wrap-general">
      <button
        type="button"
        className={`es-card2 es-card2-general${disabled ? ' is-disabled' : ''}${tooPoor ? ' is-poor' : ''}${poorFlash ? ' is-flash' : ''}${!unlocked ? ' is-locked' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={`${def.name} (general). ${unlocked ? sub : 'Locked. Click to unlock for ' + unlockCost + ' gold.'}`}
        title={unlocked ? `${def.name} · ${sub}` : `Unlock generals (${unlockCost}g)`}
        {...longPress}>
        <UnitSilhouette def={def}/>
        <div className="es-card2-name">
          <span>{label}</span>
          <span className="es-card2-role" aria-hidden="true"><RoleIcon role="general"/></span>
        </div>
        <div className="es-card2-cost">
          <span>{sub}</span>
          {!unlocked && (
            <svg className="es-card2-lock" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
            </svg>
          )}
        </div>
        {unlocked && cdR > 0 && (
          <div className="es-card2-cd"
               data-cd-text={`${Math.ceil((cooldownMs || 0) / 1000)}s`}
               style={{ '--cd-height': `${cdR * 100}%` }}/>
        )}
      </button>
      {tipOpen && <UnitTip def={def}/>}
    </div>
  );
}

function UnitCard({ def, idx, cd, tooPoor, isFlashing, isConfirming, tipOpen, onClick, onLongPress }) {
  const cdR = cd > 0 ? cd / def.spawnCooldownMs : 0;
  const disabled = cd > 0;
  const longPress = useLongPress({ onLongPress, delayMs: 450 });
  const cdSec = Math.ceil(cd / 1000);

  return (
    <div className="es-card2-wrap">
      <button
        type="button"
        className={`es-card2${disabled ? ' is-disabled is-cooling' : ''}${tooPoor ? ' is-poor' : ''}${isFlashing ? ' is-flash' : ''}${isConfirming ? ' is-confirming' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled || tooPoor}
        title={`${def.name} · ${def.cost}g${tooPoor ? ' (need more gold)' : ''}`}
        aria-label={`Spawn ${def.name}, costs ${def.cost} gold${tooPoor ? ', not enough gold' : ''}`}
        {...longPress}>
        <UnitSilhouette def={def}/>
        <div className="es-card2-name">
          <span className="es-card2-name-text">{def.name}</span>
          <RoleIcon role={def.role} className="es-card2-role"/>
        </div>
        <div className="es-card2-foot">
          <span className={`es-card2-cost${tooPoor ? ' is-poor' : ''}`}>{def.cost}g</span>
          <span className="es-card2-key" aria-hidden="true">{idx + 1}</span>
        </div>
        {cd > 0 && (
          <div className="es-card2-cd"
               data-cd-text={cdSec > 0 ? `${cdSec}s` : ''}
               style={{ '--cd-height': `${cdR * 100}%` }}/>
        )}
      </button>
      {tipOpen && <UnitTip def={def}/>}
    </div>
  );
}

// Map a unit def to its baked PNG path. Lookup is by eraId so the dock
// stays in sync with the era — when the player evolves, the cards
// automatically pull the new era's art.
const ERA_INDEX_BY_ID = {
  'ember-tribe': 1, 'iron-dominion': 2, 'sun-foundry': 3,
  'storm-republic': 4, 'void-ascendancy': 5,
};

// Build version is injected by vite's `define` (see vite.config.js).
// Falls back to a session-stable random when define isn't applied
// (e.g. some test envs). Used to bust the browser cache on every
// build so swapped-in hand-art shows up after a refresh.
const _VER = (typeof BUILD_VERSION !== 'undefined' && BUILD_VERSION)
          || `dev-${Math.floor(Math.random() * 1e9).toString(36)}`;

function UnitSilhouette({ def }) {
  const eraN = ERA_INDEX_BY_ID[def.eraId] || 1;
  const role = def.role;
  // Base path resolves against `document.baseURI` so the same path
  // works on Vite dev (5180), Live Server, and the GitHub Pages
  // sub-path (/PG.Play/dist/) without absolute-vs-relative quirks.
  const src = `games/era-siege/unit/era${eraN}/${role}.png?v=${_VER}`;
  return (
    <div className="es-card2-art" aria-hidden="true">
      <img className="es-card2-img" src={src} alt="" loading="lazy"
           onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
    </div>
  );
}

function UnitTip({ def }) {
  const range = def.projectileId ? `${def.range}px (ranged)` : `${def.range}px (melee)`;
  return (
    <div className="es-card2-tip" role="tooltip" onClick={(e) => e.stopPropagation()}>
      <div className="es-card2-tip-head" style={{ color: def.visual.colorBody }}>{def.name}</div>
      <ul className="es-card2-tip-list">
        <li><span>Role</span><b>{def.role}</b></li>
        <li><span>HP</span><b>{def.hp}</b></li>
        <li><span>Damage</span><b>{def.damage}</b></li>
        <li><span>Range</span><b>{range}</b></li>
        <li><span>Speed</span><b>{def.moveSpeed} px/s</b></li>
        <li><span>Cost</span><b>{def.cost}g</b></li>
        <li><span>Bounty</span><b>{def.bountyGold}g · {def.bountyXp}xp</b></li>
        <li><span>Cooldown</span><b>{(def.spawnCooldownMs / 1000).toFixed(1)}s</b></li>
      </ul>
    </div>
  );
}
