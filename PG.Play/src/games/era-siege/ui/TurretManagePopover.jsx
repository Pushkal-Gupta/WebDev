// TurretManagePopover — opens when an occupied slot is tapped.
//
// Three sections:
//   1. Stats (live values reflect upgrades)
//   2. Per-stat upgrade rail — Range / Damage / Rate, each level 0-3.
//      Costs ramp linearly per level. Upgrades apply mid-battle (the
//      sim no longer pauses while this is open, so the player makes
//      the call under pressure).
//   3. Era upgrade (when the slot's turret is from a past era) + Sell.

import { useEffect } from 'react';
import { getTurret, getTurretForEra, SELL_REFUND_PCT } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';
import { turretUpgradeCost, TURRET_UPGRADE_MAX } from '../sim/turret.js';

const STAT_ROWS = [
  { id: 'range',  label: 'Range',  blurb: '+20% reach per level' },
  { id: 'damage', label: 'Damage', blurb: '+25% per shot' },
  { id: 'rate',   label: 'Rate',   blurb: '−15% cooldown — fire faster' },
];

export default function TurretManagePopover({ open, slot, gold, eraIndex, onUpgrade, onSell, onUpgradeStat, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !slot) return null;
  const cur = getTurret(slot.turretId);
  if (!cur) return null;
  const era = getEraByIndex(eraIndex);
  const erasCurrent = getTurretForEra(era?.id);
  const upgradable = erasCurrent && erasCurrent.id !== cur.id;
  const refund = Math.round(cur.buildCost * SELL_REFUND_PCT);
  const canEraUpgrade = upgradable && gold >= erasCurrent.buildCost;
  const dps = (slot.damage / (slot.cooldownMaxMs / 1000)).toFixed(1);

  return (
    <div className="es-tm-scrim" role="dialog" aria-label="Manage turret" onClick={onClose}>
      <div className="es-tm-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-tm-head">
          <span className="es-tm-eyebrow">Slot {slot.slot + 1}</span>
          <h2>{cur.name}</h2>
          <p className="es-tm-blurb">Battle continues while you upgrade.</p>
        </header>

        <ul className="es-tm-stats">
          <li><span>Damage</span><b>{slot.damage}</b></li>
          <li><span>Range</span><b>{slot.range}px</b></li>
          <li><span>Cooldown</span><b>{(slot.cooldownMaxMs / 1000).toFixed(2)}s</b></li>
          <li><span>DPS</span><b>{dps}</b></li>
        </ul>

        <div className="es-tm-upgrades" aria-label="Per-turret upgrades">
          {STAT_ROWS.map((row) => {
            const level = (slot[row.id + 'Level'] | 0);
            const maxed = level >= TURRET_UPGRADE_MAX;
            const cost = maxed ? 0 : turretUpgradeCost(level);
            const canBuy = !maxed && gold >= cost;
            return (
              <button
                key={row.id}
                type="button"
                className={`es-tm-upg-row${maxed ? ' is-maxed' : ''}${canBuy ? '' : ' is-disabled'}`}
                disabled={!canBuy}
                onClick={() => canBuy && onUpgradeStat(slot.slot, row.id)}
                title={maxed ? 'Maxed' : `${row.blurb} · costs ${cost}g`}>
                <span className="es-tm-upg-label">{row.label}</span>
                <span className="es-tm-upg-pips" aria-hidden="true">
                  {Array.from({ length: TURRET_UPGRADE_MAX }, (_, i) => (
                    <i key={i} className={`es-tm-pip${i < level ? ' is-on' : ''}`}/>
                  ))}
                </span>
                <span className="es-tm-upg-cost">{maxed ? 'MAX' : `${cost}g`}</span>
              </button>
            );
          })}
        </div>

        {upgradable && (
          <div className="es-tm-upgrade">
            <strong>Era upgrade · {erasCurrent.name}</strong>
            <span>Replaces this turret with the era-current variant. Resets stat upgrades.</span>
          </div>
        )}

        <footer className="es-tm-foot">
          <button type="button" className="es-tm-sell" onClick={onSell}>
            Sell · {refund}g
          </button>
          {upgradable && (
            <button
              type="button"
              className={`es-tm-upgrade-cta${canEraUpgrade ? '' : ' is-disabled'}`}
              disabled={!canEraUpgrade}
              onClick={onUpgrade}>
              Era · {erasCurrent.buildCost}g
            </button>
          )}
          <button type="button" className="es-tm-close" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
