// Victory / defeat panel.

import { getEraByIndex } from '../content/eras.js';

export default function ResultPanel({ status, eraIndex, timeSec, score, stats, onAgain }) {
  if (status !== 'won' && status !== 'lost') return null;
  const era = getEraByIndex(eraIndex);
  const summary = status === 'won'
    ? `Enemy base destroyed in ${era.name}.`
    : eraIndex === 0
      ? 'Defeat — try saving 2 frontliners in the first 10s.'
      : `Defeat in ${era.name}. Try ${eraIndex < 3 ? 'evolving sooner' : 'turtling a turret line'}.`;
  return (
    <div className="es-result" role="dialog" aria-label={status === 'won' ? 'Victory' : 'Defeat'}>
      <div className={`es-result-tag ${status === 'won' ? 'is-won' : 'is-lost'}`}>
        {status === 'won' ? 'Victory' : 'Defeat'}
      </div>
      <div className="es-result-summary">{summary}</div>
      <div className="es-result-stats">
        <div><span>Era</span><b>{eraIndex + 1}/5</b></div>
        <div><span>Time</span><b>{timeSec}s</b></div>
        <div><span>Kills</span><b>{stats?.kills ?? 0}</b></div>
        <div><span>Units</span><b>{stats?.unitsSpawned ?? 0}</b></div>
        <div><span>Turrets</span><b>{stats?.turretsBuilt ?? 0}</b></div>
        <div><span>Specials</span><b>{stats?.specialsUsed ?? 0}</b></div>
        <div><span>Score</span><b>{score}/100</b></div>
      </div>
      <button type="button" className="es-result-again" onClick={onAgain}>Play again</button>
    </div>
  );
}
