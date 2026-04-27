// Victory / defeat panel. Shows match stats + persisted bests for the
// current difficulty + daily flag.

import { useState } from 'react';
import { getEraByIndex } from '../content/eras.js';

export default function ResultPanel({
  status, eraIndex, timeSec, score, stats, difficulty, seed,
  isDaily, persistedStats, onAgain,
}) {
  if (status !== 'won' && status !== 'lost') return null;
  const era = getEraByIndex(eraIndex);
  const summary = status === 'won'
    ? `Enemy base destroyed in ${era.name}.`
    : eraIndex === 0
      ? 'Defeat — try saving 2 frontliners in the first 10s.'
      : `Defeat in ${era.name}. Try ${eraIndex < 3 ? 'evolving sooner' : 'turtling a turret line'}.`;

  const bestScore = persistedStats?.bestScore?.[difficulty] || 0;
  const bestEra   = persistedStats?.bestEra?.[difficulty]   || 0;
  const fastestSec = persistedStats?.fastestWinSec?.[difficulty] || 0;
  const isPB     = score > 0 && score >= bestScore;
  const isFastestWin = status === 'won' && fastestSec === timeSec;

  return (
    <div className="es-result" role="dialog" aria-label={status === 'won' ? 'Victory' : 'Defeat'}>
      <div className={`es-result-tag ${status === 'won' ? 'is-won' : 'is-lost'}`}>
        {status === 'won' ? 'Victory' : 'Defeat'}
      </div>
      {isDaily && <div className="es-result-daily">Daily challenge result</div>}
      <div className="es-result-summary">{summary}</div>
      <div className="es-result-stats">
        <div><span>Era</span><b>{eraIndex + 1}/5</b></div>
        <div><span>Time</span><b>{timeSec}s</b></div>
        <div><span>Kills</span><b>{stats?.kills ?? 0}</b></div>
        <div><span>Units</span><b>{stats?.unitsSpawned ?? 0}</b></div>
        <div><span>Turrets</span><b>{stats?.turretsBuilt ?? 0}</b></div>
        <div><span>Specials</span><b>{stats?.specialsUsed ?? 0}</b></div>
        <div><span>Score</span><b>{score}/100{isPB && <em className="es-result-pb"> PB</em>}</b></div>
        {bestScore > 0 && (
          <div><span>Best ({difficulty})</span><b>{bestScore}/100</b></div>
        )}
      </div>
      {(bestEra > 0 || fastestSec > 0) && (
        <div className="es-result-meta">
          {bestEra > 0 && <span>best era {bestEra}/5</span>}
          {fastestSec > 0 && <span>fastest win {fastestSec}s{isFastestWin ? ' (new!)' : ''}</span>}
        </div>
      )}
      <div className="es-result-actions">
        <button type="button" className="es-result-again" onClick={onAgain}>Play again</button>
        {seed != null && !isDaily && <ShareSeedButton seed={seed}/>}
      </div>
    </div>
  );
}

function ShareSeedButton({ seed }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      const base = typeof window !== 'undefined' ? window.location : null;
      if (!base) return;
      // Build a URL that pins this seed — the hash route + es-seed query.
      const url = `${base.origin}${base.pathname}?es-seed=${seed >>> 0}#/game/aow`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        prompt('Copy this run URL:', url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* swallow */ }
  };
  return (
    <button
      type="button"
      className="es-result-share"
      onClick={onClick}
      title="Copy a URL that replays this match (same seed, same enemy AI rolls)"
      aria-label="Copy a link that replays this match">
      {copied ? 'Link copied' : 'Share run'}
    </button>
  );
}
