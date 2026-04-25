// Main menu — entry hub for all Goalbound flows.

import { useMemo } from 'react';
import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import {
  setRoute, setSelections, useGoalboundStore,
  setTournament, setChallenge, setMatch,
} from '../store.js';
import { Crest } from '../ui/Crest.jsx';
import { teamById } from '../content.js';
import { Pill } from '../ui/primitives.jsx';
import { nextPlayerFixture } from '../engine/tournament.js';

export default function MainMenu() {
  const tournament   = useGoalboundStore((s) => s.tournament);
  const stats        = useGoalboundStore((s) => s.stats);
  const selections   = useGoalboundStore((s) => s.selections);
  const meta         = useGoalboundStore((s) => s.meta);

  const playerTeam = useMemo(() => teamById(selections.homeTeam), [selections.homeTeam]);
  const resume = useMemo(() => {
    if (tournament && tournament.phase !== 'done') {
      const next = nextPlayerFixture(tournament);
      return next ? { kind:'tournament', next } : null;
    }
    return null;
  }, [tournament]);

  const pick = (mode, route) => {
    sfx.click();
    setSelections({ mode });
    setMatch(null);
    setChallenge(null);
    if (mode !== 'tournament') setTournament(null);
    setRoute(route);
  };

  const cards = [
    { id:'quick',      title:'Quick Match',    sub:'1v1 vs AI · 60 seconds', tone:'primary',
      chip:'Play now',     icon:Icon.play,    onClick: () => pick('quick', 'team-select') },
    { id:'tournament', title:'Tournament',     sub:'Cup progression · groups + bracket', tone:'accent',
      chip:'New',          icon:Icon.trophy,  onClick: () => pick('tournament', 'tournament-setup') },
    { id:'2p',         title:'Local Versus',   sub:'Pass the keyboard · 2 players', tone:'default',
      chip:'2P',           icon:Icon.coop,    onClick: () => pick('2p', 'team-select') },
    { id:'shootout',   title:'Penalty Shootout', sub:'Five alternating kicks · one phone', tone:'default',
      chip:'Hotseat',      icon:Icon.target,  onClick: () => pick('shootout', 'shootout') },
    { id:'challenges', title:'Challenges',     sub:'Scenarios to earn stars', tone:'default',
      chip:`${Object.values(stats.challengeStars || {}).reduce((a, b) => a + b, 0)}★`, icon:Icon.sparkle,
      onClick: () => pick('challenge', 'challenges') },
    { id:'practice',   title:'Practice',       sub:'Free play · no clock · no AI', tone:'default',
      chip:'Free',         icon:Icon.target,  onClick: () => pick('practice', 'match-settings') },
    { id:'stats',      title:'Stats',          sub:`${stats.matchesPlayed} played · ${stats.wins}W / ${stats.draws}D / ${stats.losses}L`, tone:'ghost',
      chip:null,           icon:Icon.monitor, onClick: () => { sfx.click(); setRoute('stats'); } },
    { id:'help',       title:'How to play',    sub:'Controls · modes · tips', tone:'ghost',
      chip:null,           icon:Icon.help,    onClick: () => { sfx.click(); setRoute('help'); } },
  ];

  return (
    <div className="gb-menu">
      <div className="gb-menu-bg" aria-hidden="true">
        <div className="gb-menu-bg-pitch"/>
        <div className="gb-menu-bg-sky"/>
        <div className="gb-menu-bg-glow"/>
        <div className="gb-menu-bg-scan"/>
      </div>

      <div className="gb-menu-hero">
        <div className="gb-menu-hero-text">
          <div className="gb-kicker">Goalbound</div>
          <h1 className="gb-menu-title">Arcade football, <span className="gb-menu-title-accent">turn-one fast</span>.</h1>
          <p className="gb-menu-sub">
            Pick a mode. Pick a club. Own the pitch for a minute.
          </p>
          <div className="gb-menu-hero-row">
            <Pill tone="accent">{stats.wins} wins</Pill>
            <Pill tone="warm">{stats.hatTricks} hat-tricks</Pill>
            <Pill tone="ghost">{stats.trophies?.length || 0} trophies</Pill>
          </div>
        </div>

        <div className="gb-menu-hero-crest">
          <Crest team={playerTeam} size={120}/>
          <div className="gb-menu-hero-club">
            <div className="gb-menu-hero-club-short">{playerTeam.short}</div>
            <div className="gb-menu-hero-club-name">{playerTeam.name}</div>
            <div className="gb-menu-hero-club-rating">
              <span>Rating</span><b>{playerTeam.rating}</b>
            </div>
          </div>
        </div>
      </div>

      {resume && <ResumeCard resume={resume}/>}

      <div className="gb-menu-grid">
        {cards.map((c) => (
          <button
            key={c.id}
            className={`gb-menu-card gb-menu-card-${c.tone}`}
            onClick={c.onClick}>
            <div className="gb-menu-card-icon">{c.icon}</div>
            <div className="gb-menu-card-body">
              <div className="gb-menu-card-title">{c.title}</div>
              <div className="gb-menu-card-sub">{c.sub}</div>
            </div>
            {c.chip && <span className="gb-menu-card-chip">{c.chip}</span>}
            <span className="gb-menu-card-ring" aria-hidden="true"/>
          </button>
        ))}
      </div>

      {meta.lastPlayedAt && (
        <footer className="gb-menu-foot">
          Last match · <time>{new Date(meta.lastPlayedAt).toLocaleString()}</time>
        </footer>
      )}
    </div>
  );
}

function ResumeCard({ resume }) {
  const teamHome = teamById(resume.next.fixture.home);
  const teamAway = teamById(resume.next.fixture.away);
  return (
    <div className="gb-menu-resume">
      <div className="gb-menu-resume-kicker">Tournament · next match</div>
      <div className="gb-menu-resume-body">
        <div className="gb-menu-resume-team">
          <Crest team={teamHome} size={42}/>
          <span>{teamHome.name}</span>
        </div>
        <div className="gb-menu-resume-vs">VS</div>
        <div className="gb-menu-resume-team gb-menu-resume-team-right">
          <span>{teamAway.name}</span>
          <Crest team={teamAway} size={42}/>
        </div>
      </div>
      <button className="btn btn-primary" onClick={() => setRoute(resume.next.kind === 'league' ? 'group-stage' : 'bracket')}>
        {Icon.play} Continue
      </button>
    </div>
  );
}
