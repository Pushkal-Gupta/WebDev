// TurretManagePopover — opens when an occupied slot is tapped.
// Shows the turret's current stats, sell-refund, and (when the slot's
// era is older than the player's) an Upgrade-now CTA.

import { useEffect } from 'react';
import { getTurret, getTurretForEra, SELL_REFUND_PCT } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';

export default function TurretManagePopover({ open, slot, gold, eraIndex, onUpgrade, onSell, onClose }) {
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
  const canUpgrade = upgradable && gold >= erasCurrent.buildCost;
  const dps = (cur.damage / (cur.cooldownMs / 1000)).toFixed(1);

  return (
    <div className="es-tm-scrim" role="dialog" aria-label="Manage turret" onClick={onClose}>
      <div className="es-tm-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-tm-head">
          <span className="es-tm-eyebrow">Slot {slot.slot + 1}</span>
          <h2>{cur.name}</h2>
        </header>

        <ul className="es-tm-stats">
          <li><span>Damage</span><b>{cur.damage}</b></li>
          <li><span>Range</span><b>{cur.range}px</b></li>
          <li><span>Cooldown</span><b>{(cur.cooldownMs / 1000).toFixed(1)}s</b></li>
          <li><span>DPS</span><b>{dps}</b></li>
        </ul>

        {upgradable && (
          <div className="es-tm-upgrade">
            <strong>Upgradable to {erasCurrent.name}</strong>
            <span>+{erasCurrent.damage - cur.damage} damage · +{erasCurrent.range - cur.range}px range</span>
          </div>
        )}

        <footer className="es-tm-foot">
          <button type="button" className="es-tm-sell" onClick={onSell}>
            Sell · {refund}g
          </button>
          {upgradable ? (
            <button
              type="button"
              className={`es-tm-upgrade-cta${canUpgrade ? '' : ' is-disabled'}`}
              disabled={!canUpgrade}
              onClick={onUpgrade}>
              Upgrade · {erasCurrent.buildCost}g
            </button>
          ) : (
            <button type="button" className="es-tm-close" onClick={onClose}>Close</button>
          )}
        </footer>
      </div>
    </div>
  );
}
