// Results screen — scoreline, goal timeline, rewards, next steps.

import { useMemo } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import {
  teamById, playerById, durationById,
} from '../content.js';
import {
  setRoute, setMatch, setChallenge, useGoalboundStore,
} from '../store.js';
import { nextPlayerFixture } from '../engine/tournament.js';
import { challengeById } from '../engine/challenges.js';
import { Crest } from '../ui/Crest.jsx';
import { Portrait } from '../ui/Portrait.jsx';
import { BackBar, ScreenHead, Pill, Stars } from '../ui/primitives.jsx';

export default function Results() {
  const match = useGoalboundStore((s) => s.match);
  const tournament = useGoalboundStore((s) => s.tournament);

  if (!match || !match.finished) {
    // Defensive: no result recorded.
    return (
      <div className="gb-page">
        <BackBar onBack={() => setRoute('menu')}/>
        <ScreenHead kicker="No match" title="Nothing to report yet." blurb="Play a match — results land here."/>
        <div className="gb-ctabar">
          <button className="btn btn-primary" onClick={() => setRoute('menu')}>{Icon.home} Back to menu</button>
        </div>
      </div>
    );
  }

  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const homeP = playerById(match.homeId, match.homePlayerId);
  const awayP = playerById(match.awayId, match.awayPlayerId);

  const verdict = match.drawn ? 'Draw' : match.won ? 'Match won' : 'Match lost';
  const bigScore = `${match.scoreHome}–${match.scoreAway}`;
  const reason = {
    'time': 'Full time', 'first-to-3': 'First to 3',
    'golden': 'Golden goal', 'flip': 'Coin flip',
  }[match.reason] || 'Final';

  const challenge = match.challengeId ? challengeById(match.challengeId) : null;

  const tournamentNext = tournament && tournament.phase !== 'done'
    ? nextPlayerFixture(tournament)
    : null;

  const rematch = () => {
    sfx.click();
    setMatch(null);
    setRoute('match-intro');
  };
  const onContinue = () => {
    sfx.confirm();
    setMatch(null);
    if (match.mode === 'tournament') {
      if (!tournament) {
        setRoute('menu');
      } else if (tournament.phase === 'done' || tournament.phase?.startsWith('knockout')) {
        setRoute('bracket');
      } else if (tournament.phase === 'group') {
        setRoute('group-stage');
      } else {
        setRoute('bracket');
      }
    } else if (match.mode === 'challenge') {
      setChallenge(null);
      setRoute('challenges');
    } else {
      setRoute('menu');
    }
  };

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>

      <header className={`gb-results-hero is-${match.won ? 'won' : match.drawn ? 'draw' : 'lost'}`}>
        <div className="gb-results-kicker">{reason}</div>
        <h1 className="gb-results-title">{verdict}</h1>
        <div className="gb-results-score">{bigScore}</div>

        <div className="gb-results-vs">
          <ResultsSide team={home} player={homeP} goals={match.scoreHome}/>
          <div className="gb-results-sep">–</div>
          <ResultsSide team={away} player={awayP} goals={match.scoreAway}/>
        </div>
      </header>

      <section className="gb-results-detail">
        <h2 className="gb-section-title">Goal timeline</h2>
        {match.goalLog && match.goalLog.length > 0 ? (
          <ol className="gb-goal-timeline">
            {match.goalLog.map((g, i) => (
              <li key={i} className={`gb-goal-row is-${g.side}`}>
                <span className="gb-goal-minute">{g.t}s</span>
                <span className="gb-goal-flag" style={{ background: (g.side === 'home' ? home : away).primary }}/>
                <span className="gb-goal-team">{(g.side === 'home' ? home : away).name}</span>
                <span className="gb-goal-dash">scored</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="gb-empty">A scoreless affair — no goals this match.</div>
        )}

        {challenge && (
          <div className="gb-results-challenge">
            <div className="gb-results-challenge-head">
              <div>
                <div className="gb-kicker">Challenge · {challenge.label}</div>
                <div className="gb-results-challenge-goal">{challenge.goal}</div>
              </div>
              <Stars filled={match.challengeStars || 0} total={challenge.stars}/>
            </div>
            <div className="gb-results-challenge-body">
              {match.challengeStars > 0
                ? <Pill tone="accent">Challenge cleared · +{match.challengeStars} stars</Pill>
                : <Pill tone="warm">Challenge not cleared · try again</Pill>}
            </div>
          </div>
        )}
      </section>

      <div className="gb-ctabar">
        {tournamentNext && (
          <Pill tone="accent">Next: {teamById(tournamentNext.fixture.home).short} vs {teamById(tournamentNext.fixture.away).short}</Pill>
        )}
        <button className="btn btn-ghost" onClick={rematch}>{Icon.restart} Rematch</button>
        <button className="btn btn-primary btn-lg" onClick={onContinue}>
          {Icon.chevronRight}
          {match.mode === 'tournament' ? 'Continue tournament' : match.mode === 'challenge' ? 'Back to challenges' : 'Back to menu'}
        </button>
      </div>
    </div>
  );
}

function ResultsSide({ team, player, goals }) {
  return (
    <div className="gb-results-side">
      <Crest team={team} size={60}/>
      <div className="gb-results-side-body">
        <div className="gb-results-side-name">{team.name}</div>
        <div className="gb-results-side-player">
          {player && <Portrait player={player} team={team} size={36}/>}
          <span>{player?.name}</span>
        </div>
      </div>
      <div className="gb-results-side-goals">{goals}</div>
    </div>
  );
}
