// Stats screen — matches played, W/L/D, goals, trophies,
// challenge stars, streaks. Reset progress lives in Help.

import { Icon } from '../../../icons.jsx';
import { TEAMS, CHALLENGES, templateById, teamById } from '../content.js';
import { setRoute, useGoalboundStore } from '../store.js';
import { Crest } from '../ui/Crest.jsx';
import { BackBar, ScreenHead, Stat, Stars, Pill } from '../ui/primitives.jsx';

export default function StatsScreen() {
  const stats = useGoalboundStore((s) => s.stats);
  const totalStars = Object.values(stats.challengeStars || {}).reduce((a, b) => a + b, 0);
  const maxStars = CHALLENGES.reduce((a, c) => a + c.stars, 0);
  const fav = teamById(stats.favoriteTeamId);

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Stats"
        title="Your record, clean and unvarnished."
        blurb="Everything persists across reloads. Reset in Help if you want a clean slate."/>

      <section className="gb-stats-top">
        <div className="gb-stats-big">
          <Stat label="Matches"        value={stats.matchesPlayed}/>
          <Stat label="Wins"            value={stats.wins}/>
          <Stat label="Draws"           value={stats.draws}/>
          <Stat label="Losses"          value={stats.losses}/>
          <Stat label="Goals for"       value={stats.goalsScored}/>
          <Stat label="Goals against"   value={stats.goalsConceded}/>
          <Stat label="Hat-tricks"      value={stats.hatTricks}/>
          <Stat label="Clean sheets"    value={stats.cleanSheets}/>
          <Stat label="Best streak"     value={stats.streak?.best || 0}/>
        </div>
      </section>

      <section className="gb-stats-split">
        <div className="gb-stats-panel">
          <h2 className="gb-section-title">Trophies</h2>
          {stats.trophies?.length > 0 ? (
            <ol className="gb-trophy-list">
              {stats.trophies.slice().reverse().map((t, i) => {
                const tpl = templateById(t.templateId);
                const team = teamById(t.teamId);
                return (
                  <li key={i}>
                    <Crest team={team} size={32}/>
                    <div>
                      <div className="gb-trophy-list-title">{tpl.label}</div>
                      <div className="gb-trophy-list-sub">{team.name} · {new Date(t.at).toLocaleDateString()}</div>
                    </div>
                    {Icon.trophy}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="gb-empty">No trophies yet. Win a tournament.</div>
          )}
        </div>

        <div className="gb-stats-panel">
          <h2 className="gb-section-title">Challenge medals <span className="gb-stats-right">{totalStars}/{maxStars} ★</span></h2>
          <div className="gb-challenge-list-lite">
            {CHALLENGES.map((c) => {
              const filled = stats.challengeStars?.[c.id] || 0;
              return (
                <div key={c.id} className={`gb-challenge-row ${filled ? 'is-done' : ''}`}>
                  <div>
                    <div className="gb-challenge-row-title">{c.label}</div>
                    <div className="gb-challenge-row-goal">{c.goal}</div>
                  </div>
                  <Stars filled={filled} total={c.stars}/>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gb-stats-panel">
          <h2 className="gb-section-title">Favorite club</h2>
          <div className="gb-fav">
            <Crest team={fav} size={60}/>
            <div>
              <div className="gb-fav-name">{fav.name}</div>
              <div className="gb-fav-sub">Rating {fav.rating} · {fav.nation}</div>
            </div>
            <Pill tone="accent">{stats.wins} wins with club</Pill>
          </div>
        </div>
      </section>
    </div>
  );
}
