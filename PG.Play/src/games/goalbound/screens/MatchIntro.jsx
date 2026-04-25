// Match intro — animated versus screen. Countdown, then kickoff.

import { useEffect, useState } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import {
  teamById, playerById, arenaById, weatherById, ballById, crowdById,
  durationById, difficultyById,
} from '../content.js';
import { setRoute, useSelection, useGoalboundStore } from '../store.js';
import { Crest } from '../ui/Crest.jsx';
import { Portrait } from '../ui/Portrait.jsx';

export default function MatchIntro() {
  const sel = useSelection();
  const challengeId = useGoalboundStore((s) => s.challenge);
  const [count, setCount] = useState(3);

  const home = teamById(sel.homeTeam);
  const away = teamById(sel.awayTeam);
  const homeP = playerById(sel.homeTeam, sel.homePlayer);
  const awayP = playerById(sel.awayTeam, sel.awayPlayer);
  const arena = arenaById(sel.arena);
  const weather = weatherById(sel.weather);
  const ball = ballById(sel.ball);
  const crowd = crowdById(sel.crowd);
  const duration = durationById(sel.duration);
  const diff = difficultyById(sel.difficulty);

  useEffect(() => {
    const t1 = setTimeout(() => { sfx.whistle(); }, 1500);
    const t2 = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(t2); return 0; }
        return c - 1;
      });
    }, 700);
    const t3 = setTimeout(() => setRoute('match'), 3600);
    return () => { clearTimeout(t1); clearInterval(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="gb-intro" style={{
      '--home': home.primary,
      '--away': away.primary,
      '--sky-a': arena.sky[0],
      '--sky-b': arena.sky[1],
    }}>
      <div className="gb-intro-bg" aria-hidden="true">
        <div className="gb-intro-bg-sky"/>
        <div className="gb-intro-bg-stripe gb-intro-bg-stripe-l"/>
        <div className="gb-intro-bg-stripe gb-intro-bg-stripe-r"/>
        <div className="gb-intro-bg-glow"/>
      </div>

      <div className="gb-intro-kicker">{challengeId ? 'Challenge' : sel.mode === 'tournament' ? 'Tournament match' : 'Kick-off'}</div>

      <div className="gb-intro-grid">
        <Side team={home} player={homeP} side="home"/>
        <div className="gb-intro-middle">
          <div className="gb-intro-vs">VS</div>
          <div className="gb-intro-chips">
            <span>{Icon.clock}<b>{duration.label}</b></span>
            <span>{arena.label}</span>
            <span>{weather.label}</span>
            <span>{ball.label}</span>
            {diff && <span>{diff.label}</span>}
            <span>{crowd.label}</span>
          </div>
          <div className={`gb-intro-count ${count > 0 ? 'is-on' : 'is-go'}`}>
            {count > 0 ? count : 'GO'}
          </div>
        </div>
        <Side team={away} player={awayP} side="away"/>
      </div>

      <div className="gb-intro-foot">
        <button className="btn btn-ghost btn-sm" onClick={() => setRoute('menu')}>{Icon.close} Cancel kickoff</button>
      </div>
    </div>
  );
}

function Side({ team, player, side }) {
  return (
    <div className={`gb-intro-side gb-intro-side-${side}`}>
      <div className="gb-intro-side-crest"><Crest team={team} size={72}/></div>
      <div className="gb-intro-side-name">{team.name}</div>
      <div className="gb-intro-side-sub">{team.nation} · R{team.rating}</div>
      <Portrait player={player} team={team} size={96}/>
      <div className="gb-intro-side-player">{player?.name}</div>
      <div className="gb-intro-side-num">#{player?.num} · {player?.role}</div>
    </div>
  );
}
