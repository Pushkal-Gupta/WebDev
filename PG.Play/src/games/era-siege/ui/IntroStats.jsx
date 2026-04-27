// Era Siege intro stats card. Mounted by GameIntro for the aow entry.
// Reads from the game's local stats so the player sees a quick "your
// best" panel before they start a match.

import { useEffect, useState } from 'react';
import { readStats } from '../utils/stats.js';
import '../styles.css';   // styles for `.es-intro-stats*` and shared tokens

export default function EraSiegeIntroStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    try { setStats(readStats()); } catch { /* keep null */ }
  }, []);
  if (!stats) return null;
  if (stats.matches === 0) return null;     // hide on the very first visit

  const fmtTime = (s) => s > 0 ? `${s}s` : '—';
  const winRate = stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;
  const dailyStreak = stats.daily?.streak ?? 0;

  return (
    <section className="es-intro-stats" aria-label="Your Era Siege bests">
      <header className="es-intro-stats-head">
        <h3>Your campaign</h3>
        <span className="es-intro-stats-sub">
          {stats.matches} match{stats.matches === 1 ? '' : 'es'} · {winRate}% win rate
        </span>
      </header>

      <div className="es-intro-stats-grid">
        <div className="es-intro-stats-block">
          <div className="es-intro-stats-label">Skirmish</div>
          <div className="es-intro-stats-row"><span>Best score</span><b>{stats.bestScore.skirmish || '—'}</b></div>
          <div className="es-intro-stats-row"><span>Best era</span><b>{stats.bestEra.skirmish || '—'}/5</b></div>
          <div className="es-intro-stats-row"><span>Fastest win</span><b>{fmtTime(stats.fastestWinSec.skirmish)}</b></div>
        </div>
        <div className="es-intro-stats-block">
          <div className="es-intro-stats-label">Standard</div>
          <div className="es-intro-stats-row"><span>Best score</span><b>{stats.bestScore.standard || '—'}</b></div>
          <div className="es-intro-stats-row"><span>Best era</span><b>{stats.bestEra.standard || '—'}/5</b></div>
          <div className="es-intro-stats-row"><span>Fastest win</span><b>{fmtTime(stats.fastestWinSec.standard)}</b></div>
        </div>
        <div className={`es-intro-stats-block${stats.unlocks.conquest ? '' : ' is-locked'}`}>
          <div className="es-intro-stats-label">
            Conquest{stats.unlocks.conquest ? '' : ' · locked'}
          </div>
          <div className="es-intro-stats-row"><span>Best score</span><b>{stats.bestScore.conquest || '—'}</b></div>
          <div className="es-intro-stats-row"><span>Best era</span><b>{stats.bestEra.conquest || '—'}/5</b></div>
          <div className="es-intro-stats-row"><span>Fastest win</span><b>{fmtTime(stats.fastestWinSec.conquest)}</b></div>
        </div>
      </div>

      <div className="es-intro-stats-foot">
        <div><span>Daily best</span><b>{stats.daily.lastDailyScore || 0}/100</b></div>
        <div><span>Daily streak</span><b>{dailyStreak}</b></div>
        <div><span>Endless best</span><b>{stats.endless?.bestScore || 0}/100</b></div>
        <div><span>Endless longest</span><b>{stats.endless?.longestSec ? `${stats.endless.longestSec}s` : '—'}</b></div>
        <div><span>Total kills</span><b>{stats.totalKills}</b></div>
        <div><span>Era evolves</span><b>{stats.totalEvolves}</b></div>
      </div>
    </section>
  );
}
