// Top bar — gold, base HPs, time, era pill (compact).

import { getEraByIndex } from '../content/eras.js';

export default function HUD({ gold, playerHP, enemyHP, maxHP, eraIndex, timeSec }) {
  const era = getEraByIndex(eraIndex);
  return (
    <div className="es-topbar">
      <div className="es-stat">
        <span className="es-stat-label">Gold</span>
        <b className="es-stat-num es-gold">{gold}</b>
      </div>
      <div className="es-stat es-hp">
        <span className="es-stat-label">You</span>
        <div className="es-hp-bar"><div className="es-hp-fill" style={{ width: `${(playerHP/maxHP)*100}%` }}/></div>
        <b className="es-stat-num">{Math.max(0, playerHP)}</b>
      </div>
      <div className="es-stat es-era-pill">
        <span className="es-stat-label">Era</span>
        <b className="es-stat-num">{(era?.name || '').split(' ')[0]} {eraIndex + 1}</b>
      </div>
      <div className="es-stat es-hp es-enemy">
        <span className="es-stat-label">Enemy</span>
        <div className="es-hp-bar"><div className="es-hp-fill is-enemy" style={{ width: `${(enemyHP/maxHP)*100}%` }}/></div>
        <b className="es-stat-num">{Math.max(0, enemyHP)}</b>
      </div>
      <div className="es-stat">
        <span className="es-stat-label">Time</span>
        <b className="es-stat-num">{timeSec}s</b>
      </div>
    </div>
  );
}
