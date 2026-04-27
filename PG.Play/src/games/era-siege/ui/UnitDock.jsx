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

export default function UnitDock({ unitIds, gold, cooldownsMs, onSpawn }) {
  const [flashId, setFlashId] = useState(null);
  const [tipId, setTipId]     = useState(null);
  const flashTimeoutRef = useRef(null);

  const triggerPoorFlash = (id) => {
    setFlashId(id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashId(null), 360);
  };

  useEffect(() => {
    if (!tipId) return;
    const close = () => setTipId(null);
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', close, { once: true });
    }, 50);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', close); };
  }, [tipId]);

  return (
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
            tipOpen={tipId === id}
            onClick={() => {
              if (cd > 0) return;
              if (tooPoor) { triggerPoorFlash(id); return; }
              onSpawn(id);
            }}
            onLongPress={() => setTipId((cur) => cur === id ? null : id)}
          />
        );
      })}
    </div>
  );
}

function UnitCard({ def, idx, cd, tooPoor, isFlashing, tipOpen, onClick, onLongPress }) {
  const cdR = cd > 0 ? cd / def.spawnCooldownMs : 0;
  const disabled = cd > 0;
  const longPress = useLongPress({ onLongPress, delayMs: 450 });

  return (
    <div className="es-card2-wrap">
      <button
        type="button"
        className={`es-card2${disabled ? ' is-disabled' : ''}${tooPoor ? ' is-poor' : ''}${isFlashing ? ' is-flash' : ''}`}
        onClick={onClick}
        disabled={disabled}
        title={`${def.name} · ${def.cost}g`}
        aria-label={`Spawn ${def.name}, costs ${def.cost} gold`}
        {...longPress}>
        <UnitSilhouette def={def}/>
        <div className="es-card2-name" style={{ color: def.visual.colorBody }}>
          <span className="es-card2-name-text">{def.name}</span>
          <RoleIcon role={def.role} className="es-card2-role"/>
        </div>
        <div className="es-card2-foot">
          <span className={`es-card2-cost${tooPoor ? ' is-poor' : ''}`}>{def.cost}g</span>
          <span className="es-card2-key" aria-hidden="true">{idx + 1}</span>
        </div>
        {cd > 0 && (
          <div className="es-card2-cd" style={{ width: `${cdR * 100}%` }}/>
        )}
      </button>
      {tipOpen && <UnitTip def={def}/>}
    </div>
  );
}

function UnitSilhouette({ def }) {
  // A faithful silhouette of the unit using its content-data colours.
  // Swapped to an authored PNG once `unit/era<N>/<role>.png` lands.
  const v = def.visual;
  const w = 92;
  const h = 92;
  return (
    <div className="es-card2-art" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`}>
        {/* Ground shadow */}
        <ellipse cx={w / 2} cy={h - 8} rx={w * 0.32} ry={4} fill="rgba(0,0,0,0.4)"/>
        {/* Legs */}
        <rect x={w / 2 - v.silhouetteW / 2} y={h - 26} width={v.silhouetteW} height={14} fill={v.colorBody}/>
        {/* Torso */}
        <rect x={w / 2 - v.silhouetteW / 2} y={h - 26 - v.silhouetteH * 0.6} width={v.silhouetteW} height={v.silhouetteH * 0.6} fill={v.colorBody}/>
        {/* Trim */}
        <rect x={w / 2 - v.silhouetteW / 2} y={h - 26 - v.silhouetteH * 0.45} width={v.silhouetteW} height={3} fill={v.colorTrim}/>
        {/* Head */}
        <circle cx={w / 2} cy={h - 26 - v.silhouetteH * 0.6 - v.headRadius} r={v.headRadius} fill={v.colorBody}/>
        {/* Weapon glyph */}
        {def.role === 'frontline' && <rect x={w / 2 + v.silhouetteW / 2} y={h - 38} width="14" height="2" fill={v.colorTrim}/>}
        {def.role === 'ranged'    && <rect x={w / 2 + v.silhouetteW / 2} y={h - 38} width="18" height="2" fill={v.colorTrim}/>}
        {def.role === 'heavy'     && <rect x={w / 2 + v.silhouetteW / 2} y={h - 40} width="14" height="6" fill={v.colorTrim}/>}
      </svg>
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
