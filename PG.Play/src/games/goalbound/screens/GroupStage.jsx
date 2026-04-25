// Group stage — standings table, fixtures, next-match CTA,
// simulate-others button. Auto-routes to bracket when the group
// phase completes.

import { useEffect, useMemo } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { teamById } from '../content.js';
import {
  setRoute, setTournament, setSelections,
  useGoalboundStore,
} from '../store.js';
import {
  nextPlayerFixture, simulateOthers, standingsSorted,
} from '../engine/tournament.js';
import { Crest } from '../ui/Crest.jsx';
import { BackBar, ScreenHead, Pill } from '../ui/primitives.jsx';

export default function GroupStage() {
  const t = useGoalboundStore((s) => s.tournament);
  const sel = useSelection();

  useEffect(() => {
    if (!t || t.phase === 'knockout-sf' || t.phase === 'knockout-f' || t.phase === 'done') {
      // Auto-navigate as phases advance.
      if (!t) { setRoute('tournament-setup'); return; }
      if (t.phase === 'knockout-sf' || t.phase === 'knockout-f' || t.phase === 'done') setRoute('bracket');
    }
  }, [t]);

  const nxt = useMemo(() => t ? nextPlayerFixture(t) : null, [t]);

  const simulate = () => {
    sfx.click();
    setTournament(simulateOthers(t));
  };
  const playNext = () => {
    if (!nxt) return;
    sfx.confirm();
    // Player always plays on the left (home side) for arcade simplicity —
    // opposition is whoever isn't the player's club.
    const awayTeamId = nxt.fixture.home === t.playerTeamId ? nxt.fixture.away : nxt.fixture.home;
    setSelections({ awayTeam: awayTeamId, mode: 'tournament' });
    setRoute('match-intro');
  };

  if (!t) return null;
  const isContinental = !!t.groups && t.groups.length > 1;

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Tournament · group stage"
        title={isContinental ? 'Two groups. Top two go through.' : 'Round robin. Most points wins.'}
        blurb="Play your fixtures or simulate the rest of the round.">
        <button className="btn btn-ghost btn-sm" onClick={simulate}>{Icon.sparkle} Simulate others</button>
      </ScreenHead>

      <div className="gb-t-layout">
        <section className="gb-t-groups">
          {isContinental
            ? t.groups.map((g) => <StandingsTable key={g.id} groupId={g.id} t={t}/>)
            : <StandingsTable groupId={null} t={t}/>
          }
        </section>

        <section className="gb-t-fixtures">
          <h3 className="gb-settings-label">Fixtures</h3>
          <div className="gb-fixture-list">
            {t.fixtures.map((f) => (
              <FixtureRow key={f.id} f={f} t={t}/>
            ))}
          </div>
        </section>
      </div>

      <div className="gb-ctabar">
        {nxt ? (
          <>
            <div className="gb-t-nextline">
              <div className="gb-t-nextline-kicker">Next up</div>
              <NextVs t={t} fixture={nxt.fixture}/>
            </div>
            <button className="btn btn-primary btn-lg" onClick={playNext}>{Icon.play} Play match</button>
          </>
        ) : (
          <button className="btn btn-ghost" onClick={simulate}>{Icon.sparkle} Advance round</button>
        )}
      </div>
    </div>
  );
}

function StandingsTable({ groupId, t }) {
  const standings = groupId ? t.standings[groupId] : t.standings;
  if (!standings) return null;
  const rows = standingsSorted(standings);
  const qualLimit = groupId ? 2 : 0;
  return (
    <div className="gb-standings">
      {groupId && <div className="gb-standings-head">Group {groupId}</div>}
      <table>
        <thead>
          <tr>
            <th>#</th><th className="t-left">Club</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const team = teamById(r.id);
            const mine = team.id === t.playerTeamId;
            const qualifies = groupId ? i < qualLimit : false;
            return (
              <tr key={r.id} className={`${mine ? 'is-mine' : ''} ${qualifies ? 'is-qual' : ''}`}>
                <td>{i + 1}</td>
                <td className="t-left">
                  <Crest team={team} size={22}/> <span>{team.name}</span>
                </td>
                <td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td>
                <td>{r.gf}</td><td>{r.ga}</td><td className={r.gd > 0 ? 'up' : r.gd < 0 ? 'down' : ''}>{r.gd > 0 ? '+' + r.gd : r.gd}</td>
                <td className="pts">{r.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {groupId && <div className="gb-standings-legend">Top 2 qualify</div>}
    </div>
  );
}

function FixtureRow({ f, t }) {
  const home = teamById(f.home), away = teamById(f.away);
  const mine = f.home === t.playerTeamId || f.away === t.playerTeamId;
  return (
    <div className={`gb-fixture ${mine ? 'is-mine' : ''} ${f.done ? 'is-done' : ''}`}>
      <div className="gb-fixture-round">{f.group ? `Group ${f.group}` : `R${f.round}`}</div>
      <div className="gb-fixture-team gb-fixture-team-home">
        <span>{home.name}</span>
        <Crest team={home} size={22}/>
      </div>
      <div className="gb-fixture-score">
        {f.done ? <><b>{f.score.home}</b>–<b>{f.score.away}</b></> : <span className="gb-fixture-vs">vs</span>}
      </div>
      <div className="gb-fixture-team gb-fixture-team-away">
        <Crest team={away} size={22}/>
        <span>{away.name}</span>
      </div>
      {mine && !f.done && <span className="gb-fixture-tag">your match</span>}
    </div>
  );
}

function NextVs({ t, fixture }) {
  const home = teamById(fixture.home), away = teamById(fixture.away);
  return (
    <div className="gb-t-nextvs">
      <span>{home.name}</span>
      <Crest team={home} size={26}/>
      <b>VS</b>
      <Crest team={away} size={26}/>
      <span>{away.name}</span>
    </div>
  );
}
