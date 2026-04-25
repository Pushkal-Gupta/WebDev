// Player selection — pick striker/keeper identity per side. Not
// gameplay-critical (stats modulate AI slightly); mostly cosmetic.

import { useState } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { ROSTERS, teamById } from '../content.js';
import { setRoute, setSelections, useSelection } from '../store.js';
import { Crest } from '../ui/Crest.jsx';
import { Portrait } from '../ui/Portrait.jsx';
import { BackBar, ScreenHead, Stat, CyclerArrow } from '../ui/primitives.jsx';

export default function PlayerSelect() {
  const sel = useSelection();
  const needsAway = sel.mode === 'quick' || sel.mode === '2p' || sel.mode === 'practice' || sel.mode === 'challenge';
  const [side, setSide] = useState('home');

  const teamId = side === 'home' ? sel.homeTeam : sel.awayTeam;
  const team   = teamById(teamId);
  const roster = ROSTERS[teamId] || [];
  const pid    = side === 'home' ? sel.homePlayer : sel.awayPlayer;
  const idx    = Math.max(0, roster.findIndex((p) => p.id === pid));
  const player = roster[idx] || roster[0];

  const cycle = (delta) => {
    const next = roster[(idx + delta + roster.length) % roster.length];
    sfx.click();
    if (side === 'home') setSelections({ homePlayer: next.id });
    else                 setSelections({ awayPlayer: next.id });
  };
  const randomize = () => {
    const next = roster[Math.floor(Math.random() * roster.length)];
    if (side === 'home') setSelections({ homePlayer: next.id });
    else                 setSelections({ awayPlayer: next.id });
  };
  const next = () => {
    sfx.confirm();
    if (needsAway && side === 'home') { setSide('away'); return; }
    if (sel.mode === 'quick') setRoute('difficulty');
    else if (sel.mode === 'challenge') setRoute('challenges');
    else setRoute('match-settings');
  };

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('team-select')}/>
      <ScreenHead
        kicker={side === 'home' ? 'Home squad' : 'Away squad'}
        title={`Meet the ${side === 'home' ? 'home' : 'away'} ${player?.role || 'striker'}.`}
        blurb="Player stats are flavor — they nudge AI aggression and shot power slightly.">
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

      <section className="gb-player-hero" style={{ '--tm-primary': team.primary, '--tm-secondary': team.secondary }}>
        <CyclerArrow dir="prev" onClick={() => cycle(-1)} label="Previous player"/>

        <div className="gb-player-card">
          <Portrait player={player} team={team} size={180}/>
          <Crest team={team} size={44}/>
          <div className="gb-player-name">{player.name}</div>
          <div className="gb-player-sub">#{player.num} · {player.role}</div>
          <div className="gb-player-attrs">
            <Stat label="POW" value={player.power}/>
            <Stat label="JMP" value={player.jump}/>
            <Stat label="SPD" value={player.speed}/>
            <Stat label="CTR" value={player.control}/>
          </div>
          <div className="gb-player-ring" aria-hidden="true"/>
        </div>

        <CyclerArrow dir="next" onClick={() => cycle(1)} label="Next player"/>
      </section>

      <div className="gb-player-roster">
        {roster.map((p, i) => (
          <button
            key={p.id}
            className={`gb-player-chip ${i === idx ? 'is-on' : ''}`}
            onClick={() => side === 'home' ? setSelections({ homePlayer: p.id }) : setSelections({ awayPlayer: p.id })}>
            <span className="gb-player-chip-num">#{p.num}</span>
            <span className="gb-player-chip-name">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="gb-ctabar">
        <button className="btn btn-ghost" onClick={randomize}>{Icon.sparkle} Random</button>
        <button className="btn btn-primary" onClick={next}>
          {Icon.check} {needsAway && side === 'home' ? 'Pick away player' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
