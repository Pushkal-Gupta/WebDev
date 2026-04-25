// Knockout bracket — shows QF/SF/F in a tree layout. Highlights the
// player's path, marks wins, offers "Play next match" CTA.

import { useEffect, useMemo } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { teamById, templateById } from '../content.js';
import {
  setRoute, setTournament, setSelections,
  useGoalboundStore,
} from '../store.js';
import { nextPlayerFixture, simulateOthers } from '../engine/tournament.js';
import { Crest } from '../ui/Crest.jsx';
import { BackBar, ScreenHead, Pill } from '../ui/primitives.jsx';

export default function Bracket() {
  const t = useGoalboundStore((s) => s.tournament);

  const nxt = useMemo(() => t ? nextPlayerFixture(t) : null, [t]);

  useEffect(() => {
    if (!t) { setRoute('tournament-setup'); return; }
  }, [t]);

  if (!t || !t.bracket) return null;

  const simulate = () => {
    sfx.click();
    setTournament(simulateOthers(t));
  };
  const playNext = () => {
    if (!nxt) return;
    sfx.confirm();
    const awayTeamId = nxt.fixture.home === t.playerTeamId ? nxt.fixture.away : nxt.fixture.home;
    setSelections({ awayTeam: awayTeamId, mode: 'tournament' });
    setRoute('match-intro');
  };

  const trophied = t.phase === 'done';
  const champTeam = trophied ? teamById(t.champion) : null;
  const myChamp = trophied && t.champion === t.playerTeamId;

  const tpl = templateById(t.templateId);

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker={trophied ? 'Tournament · champions' : `Tournament · ${tpl.label}`}
        title={trophied ? (myChamp ? 'You lifted the trophy.' : `${champTeam.name} lifted the trophy.`) : 'Knockout stage.'}
        blurb={trophied ? 'Every match below is in the record books.' : 'Single-leg knockouts. Ties resolve by coin flip.'}>
        {!trophied && <button className="btn btn-ghost btn-sm" onClick={simulate}>{Icon.sparkle} Simulate round</button>}
      </ScreenHead>

      {trophied && (
        <section className="gb-trophy">
          <div className="gb-trophy-cup" aria-hidden="true">
            <svg viewBox="0 0 120 140" width="96" height="112">
              <defs>
                <linearGradient id="trophyG" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#ffe68a"/>
                  <stop offset="1" stopColor="#b8860b"/>
                </linearGradient>
              </defs>
              <path d="M30 10 H90 V40 Q90 62 60 62 Q30 62 30 40 Z" fill="url(#trophyG)" stroke="#6a4e08" strokeWidth="2"/>
              <path d="M20 20 Q6 20 6 40 Q6 56 26 58" fill="none" stroke="url(#trophyG)" strokeWidth="4"/>
              <path d="M100 20 Q114 20 114 40 Q114 56 94 58" fill="none" stroke="url(#trophyG)" strokeWidth="4"/>
              <rect x="52" y="62" width="16" height="18" fill="url(#trophyG)"/>
              <rect x="38" y="80" width="44" height="8" rx="2" fill="url(#trophyG)"/>
              <rect x="30" y="90" width="60" height="12" rx="3" fill="#2a1a08"/>
            </svg>
          </div>
          <div className="gb-trophy-body">
            <div className="gb-trophy-kicker">Champions</div>
            <div className="gb-trophy-title">{champTeam.name}</div>
            <div className="gb-trophy-sub">{tpl.label}</div>
          </div>
          <div className="gb-trophy-cta">
            <button className="btn btn-ghost" onClick={() => { setTournament(null); setRoute('menu'); }}>{Icon.home} To menu</button>
          </div>
        </section>
      )}

      <section className="gb-bracket">
        {t.bracket.rounds.map((round, ri) => (
          <div key={ri} className="gb-bracket-round">
            <div className="gb-bracket-round-title">{round.name}</div>
            {round.matches.map((m, mi) => (
              <BracketMatch key={m.id || mi} m={m} t={t}/>
            ))}
          </div>
        ))}
      </section>

      {!trophied && (
        <div className="gb-ctabar">
          {nxt
            ? <button className="btn btn-primary btn-lg" onClick={playNext}>{Icon.play} Play next match</button>
            : <Pill tone="warm">Waiting on other fixtures — simulate to advance.</Pill>}
        </div>
      )}
    </div>
  );
}

function BracketMatch({ m, t }) {
  const home = m.home ? teamById(m.home) : null;
  const away = m.away ? teamById(m.away) : null;
  const isMine = (m.home && m.home === t.playerTeamId) || (m.away && m.away === t.playerTeamId);
  const done = !!m.score;
  return (
    <div className={`gb-bracket-match ${isMine ? 'is-mine' : ''} ${done ? 'is-done' : ''}`}>
      <BracketSide team={home} winner={done && m.winner === m.home} score={done ? m.score.home : null}/>
      <BracketSide team={away} winner={done && m.winner === m.away} score={done ? m.score.away : null}/>
    </div>
  );
}
function BracketSide({ team, winner, score }) {
  if (!team) return (
    <div className="gb-bracket-side is-empty">
      <span>TBD</span><span/>
    </div>
  );
  return (
    <div className={`gb-bracket-side ${winner ? 'is-winner' : ''}`}>
      <span className="gb-bracket-side-name">
        <Crest team={team} size={20}/> {team.name}
      </span>
      <span className="gb-bracket-side-score">{score ?? ''}</span>
    </div>
  );
}
