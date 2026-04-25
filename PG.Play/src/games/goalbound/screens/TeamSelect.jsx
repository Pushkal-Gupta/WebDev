// Team selection — pick home team (and away for Quick/2P).

import { useMemo, useState } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { TEAMS, ROSTERS, teamById } from '../content.js';
import {
  setRoute, setSelections, useSelection,
} from '../store.js';
import { Crest } from '../ui/Crest.jsx';
import { BackBar, ScreenHead, Pill, Stat } from '../ui/primitives.jsx';

export default function TeamSelect() {
  const sel = useSelection();
  const mode = sel.mode;
  const needsAway = mode === 'quick' || mode === '2p' || mode === 'practice' || mode === 'challenge';

  const [side, setSide] = useState('home');
  const [q, setQ] = useState('');

  const teams = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TEAMS;
    return TEAMS.filter((t) =>
      t.name.toLowerCase().includes(needle) ||
      t.short.toLowerCase().includes(needle) ||
      t.nation.toLowerCase().includes(needle) ||
      t.tagline.toLowerCase().includes(needle));
  }, [q]);

  const currentId = side === 'home' ? sel.homeTeam : sel.awayTeam;
  const otherId   = side === 'home' ? sel.awayTeam : sel.homeTeam;
  const pick = (id) => {
    sfx.click();
    if (side === 'home') {
      setSelections({ homeTeam: id, homePlayer: ROSTERS[id]?.[0]?.id || sel.homePlayer });
    } else {
      setSelections({ awayTeam: id, awayPlayer: ROSTERS[id]?.[0]?.id || sel.awayPlayer });
    }
  };
  const randomize = () => {
    const list = TEAMS.filter((t) => t.id !== otherId);
    pick(list[Math.floor(Math.random() * list.length)].id);
  };
  const ready = () => {
    sfx.confirm();
    if (needsAway && side === 'home') { setSide('away'); return; }
    // For tournament mode we jump to the tournament setup after picking home
    if (mode === 'tournament') { setRoute('tournament-setup'); return; }
    setRoute(mode === 'challenge' ? 'challenges' : 'player-select');
  };

  const current = teamById(currentId);

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker={side === 'home' ? 'Your club' : 'Opponent'}
        title={side === 'home' ? 'Choose the home side.' : 'Pick the opposition.'}
        blurb="Ratings affect AI strength and tournament simulation.">
        {needsAway && (
          <div className="gb-sidepicker">
            {['home','away'].map((s) => (
              <button key={s} className={`gb-sidepicker-tab ${side === s ? 'is-on' : ''}`} onClick={() => setSide(s)}>
                {s === 'home' ? 'Home' : 'Away'}
              </button>
            ))}
          </div>
        )}
      </ScreenHead>

      <section className="gb-team-hero" data-side={side}>
        <div className="gb-team-hero-crest">
          <Crest team={current} size={188}/>
        </div>
        <div className="gb-team-hero-body">
          <div className="gb-team-hero-kicker">{current.nation} · {current.stadium}</div>
          <h2 className="gb-team-hero-name">{current.name}</h2>
          <div className="gb-team-hero-tagline">{current.tagline}</div>
          <div className="gb-team-hero-stats">
            <Stat label="Rating" value={current.rating}/>
            <Stat label="Squad"  value={(ROSTERS[current.id] || []).length}/>
            <Stat label="Short"  value={current.short}/>
          </div>
          <div className="gb-team-hero-ctas">
            <button className="btn btn-ghost" onClick={randomize}>{Icon.sparkle} Random</button>
            <button className="btn btn-primary" onClick={ready}>
              {Icon.check}
              {needsAway && side === 'home' ? 'Confirm, pick opponent' : 'Confirm team'}
            </button>
          </div>
        </div>
      </section>

      <div className="gb-team-grid-head">
        <div className="gb-team-grid-title">All clubs</div>
        <input
          className="gb-team-search"
          placeholder="Search clubs"
          value={q}
          onChange={(e) => setQ(e.target.value)}/>
      </div>

      <div className="gb-team-grid">
        {teams.map((t) => {
          const isCurrent = t.id === currentId;
          const isOther   = t.id === otherId && needsAway;
          return (
            <button
              key={t.id}
              className={`gb-team-tile ${isCurrent ? 'is-selected' : ''} ${isOther ? 'is-other' : ''}`}
              onClick={() => !isOther && pick(t.id)}
              style={{ '--tm-primary': t.primary, '--tm-secondary': t.secondary }}>
              <Crest team={t} size={48}/>
              <div className="gb-team-tile-body">
                <div className="gb-team-tile-name">{t.name}</div>
                <div className="gb-team-tile-meta">
                  <span>{t.nation}</span>
                  <Pill tone="ghost">{t.rating}</Pill>
                </div>
              </div>
              {isOther && <span className="gb-team-tile-tag">opponent</span>}
              {isCurrent && <span className="gb-team-tile-check">{Icon.check}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
