// Tournament setup — template, seeding, difficulty, then starts.

import { Icon } from '../../../icons.jsx';
import { sfx } from '../../../sound.js';
import { TOURNAMENT_TEMPLATES, DIFFICULTIES, teamById } from '../content.js';
import {
  setRoute, setSelections, setTournament,
  useSelection, useGoalboundStore,
} from '../store.js';
import { createTournament } from '../engine/tournament.js';
import { Crest } from '../ui/Crest.jsx';
import { BackBar, ScreenHead, Choice, Pill } from '../ui/primitives.jsx';

export default function TournamentSetup() {
  const sel = useSelection();
  const existing = useGoalboundStore((s) => s.tournament);

  const pick = (templateId) => { sfx.click(); setSelections({ templateId }); };
  const toggleSeeded = () => { sfx.click(); setSelections({ seededDraw: !sel.seededDraw }); };
  const pickDiff = (id) => { sfx.click(); setSelections({ difficulty: id }); };

  const start = () => {
    sfx.confirm();
    const t = createTournament({
      templateId: sel.templateId,
      playerTeamId: sel.homeTeam,
      seeded: sel.seededDraw,
      seed: Date.now(),
    });
    setTournament(t);
    setRoute(t.phase === 'group' ? 'group-stage' : 'bracket');
  };

  const tpl = TOURNAMENT_TEMPLATES.find((t) => t.id === sel.templateId) || TOURNAMENT_TEMPLATES[1];
  const myTeam = teamById(sel.homeTeam);

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute('menu')}/>
      <ScreenHead
        kicker="Tournament"
        title="Set the competition."
        blurb="Pick your format, your draw, and how tough the AI should play every match."/>

      <section className="gb-t-summary">
        <div className="gb-t-summary-team">
          <Crest team={myTeam} size={72}/>
          <div>
            <div className="gb-t-summary-team-name">{myTeam.name}</div>
            <div className="gb-t-summary-team-sub">Your club · R{myTeam.rating}</div>
          </div>
        </div>
        <div className="gb-t-summary-swap">
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelections({ mode: 'tournament' }); setRoute('team-select'); }}>
            Change club
          </button>
        </div>
      </section>

      {existing && existing.phase !== 'done' && (
        <div className="gb-t-warn">
          {Icon.help} You already have a tournament in progress. Starting a new one will discard it.
        </div>
      )}

      <section className="gb-settings-group">
        <h3 className="gb-settings-label">Format</h3>
        <div className="gb-choice-grid">
          {TOURNAMENT_TEMPLATES.map((t) => (
            <Choice
              key={t.id}
              tone={t.id === sel.templateId ? 'accent' : 'default'}
              selected={t.id === sel.templateId}
              onClick={() => pick(t.id)}
              title={t.label}
              subtitle={t.blurb}
              meta={<Pill tone="ghost">{t.teams} teams</Pill>}/>
          ))}
        </div>
      </section>

      <section className="gb-settings-group">
        <h3 className="gb-settings-label">Draw</h3>
        <div className="gb-settings-row">
          <button className={`gb-seg-btn ${sel.seededDraw ? 'is-on' : ''}`} onClick={toggleSeeded}>
            <span className="gb-seg-label">Seeded</span>
            <span className="gb-seg-blurb">Ratings-based bracket — stronger teams meet late.</span>
          </button>
          <button className={`gb-seg-btn ${!sel.seededDraw ? 'is-on' : ''}`} onClick={toggleSeeded}>
            <span className="gb-seg-label">Random</span>
            <span className="gb-seg-blurb">Pure luck. Upsets everywhere.</span>
          </button>
        </div>
      </section>

      <section className="gb-settings-group">
        <h3 className="gb-settings-label">AI difficulty</h3>
        <div className="gb-settings-row gb-settings-row-tight">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className={`gb-seg-btn ${sel.difficulty === d.id ? 'is-on' : ''}`}
              onClick={() => pickDiff(d.id)}>
              <span className="gb-seg-label">{d.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="gb-ctabar">
        <Pill tone="warm">{tpl.teams} teams · {tpl.groups ? `${tpl.groups} groups of ${tpl.groupSize}` : 'straight knockouts'}</Pill>
        <button className="btn btn-primary btn-lg" onClick={start}>
          {Icon.trophy} Start tournament
        </button>
      </div>
    </div>
  );
}
