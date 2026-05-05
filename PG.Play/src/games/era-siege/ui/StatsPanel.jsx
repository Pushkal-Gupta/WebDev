// StatsPanel — persistent-stats screen.
//
// Reads the same stats blob that ResultPanel + the daily/endless
// achievements feed off. Open from the TopBar's chart-icon tool
// button. Pauses the match while open (treated as a read-mode
// overlay, same as Settings + Shortcuts).
//
// Shows:
//   - Match totals (matches / wins / losses / win-rate)
//   - Combat totals (kills / spawns / evolves)
//   - Per-difficulty bests (score / best era / fastest win)
//   - Daily streak + best-of-day score
//   - Endless best (longest survival + best score)

import { useEffect } from 'react';
import { readStats } from '../utils/stats.js';

const DIFFICULTY_ROWS = [
  { id: 'easy',     label: 'Easy',     legacy: 'skirmish' },
  { id: 'normal',   label: 'Normal',   legacy: 'standard' },
  { id: 'medium',   label: 'Medium',   legacy: null       },
  { id: 'hard',     label: 'Hard',     legacy: 'conquest' },
  { id: 'insane',   label: 'Insane',   legacy: null       },
];

export default function StatsPanel({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const s = readStats();
  const winRate = s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0;

  return (
    <div className="es-stats-scrim" role="dialog" aria-label="Statistics" onClick={onClose}>
      <aside className="es-stats-card" onClick={(e) => e.stopPropagation()}>
        <header className="es-stats-head">
          <div>
            <h2>Statistics</h2>
            <p>Lifetime totals across every Era Siege run on this device.</p>
          </div>
        </header>

        <div className="es-stats-body">
          {/* ── Top-line totals ─────────────────────────────── */}
          <section className="es-stats-section">
            <h3>Lifetime totals</h3>
            <div className="es-stats-grid">
              <Stat label="Matches"  value={s.matches}/>
              <Stat label="Wins"     value={s.wins}     accent="#35f0c9"/>
              <Stat label="Losses"   value={s.losses}   accent="#ff8aa3"/>
              <Stat label="Win rate" value={`${winRate}%`}/>
              <Stat label="Kills"    value={s.totalKills}/>
              <Stat label="Spawns"   value={s.totalSpawns}/>
              <Stat label="Evolves"  value={s.totalEvolves}/>
            </div>
          </section>

          {/* ── Per-difficulty bests ─────────────────────────── */}
          <section className="es-stats-section">
            <h3>Per-difficulty bests</h3>
            <table className="es-stats-table" role="table">
              <thead>
                <tr><th>Difficulty</th><th>Best score</th><th>Best era</th><th>Fastest win</th></tr>
              </thead>
              <tbody>
                {DIFFICULTY_ROWS.map((d) => {
                  // Resolve current id, fall back to legacy alias if old saves
                  // still hold scores under skirmish/standard/conquest.
                  const score = s.bestScore?.[d.id] ?? (d.legacy ? s.bestScore?.[d.legacy] : 0) ?? 0;
                  const era   = s.bestEra?.[d.id]   ?? (d.legacy ? s.bestEra?.[d.legacy]   : 0) ?? 0;
                  const fast  = s.fastestWinSec?.[d.id] ?? (d.legacy ? s.fastestWinSec?.[d.legacy] : 0) ?? 0;
                  return (
                    <tr key={d.id}>
                      <td>{d.label}</td>
                      <td><b>{score > 0 ? `${score}/100` : '—'}</b></td>
                      <td><b>{era > 0 ? `${era}/5` : '—'}</b></td>
                      <td><b>{fast > 0 ? `${fast}s` : '—'}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* ── Daily challenge ─────────────────────────────── */}
          <section className="es-stats-section">
            <h3>Daily challenge</h3>
            <div className="es-stats-grid">
              <Stat label="Streak"        value={s.daily?.streak       || 0}/>
              <Stat label="Longest streak" value={s.daily?.longestStreak || 0}/>
              <Stat label="Best daily"    value={s.daily?.lastDailyScore ? `${s.daily.lastDailyScore}/100` : '—'}/>
              <Stat label="Last claimed"  value={s.daily?.lastClaimedDate || '—'}/>
            </div>
          </section>

          {/* ── Endless ─────────────────────────────────────── */}
          <section className="es-stats-section">
            <h3>Endless</h3>
            <div className="es-stats-grid">
              <Stat label="Runs"          value={s.endless?.runs || 0}/>
              <Stat label="Best score"    value={s.endless?.bestScore || 0}/>
              <Stat label="Longest run"   value={s.endless?.longestSec ? `${s.endless.longestSec}s` : '—'}/>
            </div>
          </section>
        </div>

        <footer className="es-stats-foot">
          <span>Stats are stored locally in your browser. Clearing site data resets them.</span>
          <button type="button" className="es-stats-close" onClick={onClose}>Close</button>
        </footer>
      </aside>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="es-stats-pip">
      <span className="es-stats-pip-label">{label}</span>
      <b className="es-stats-pip-value" style={accent ? { color: accent } : undefined}>{value}</b>
    </div>
  );
}
