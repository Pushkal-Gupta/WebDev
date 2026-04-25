// Match settings — duration, weather, ball, arena, crowd, accessibility.

import { Icon } from '../../../icons.jsx';
import { sfx, setMuted } from '../../../sound.js';
import {
  MATCH_DURATIONS, WEATHER_PRESETS, BALL_TYPES, ARENAS, CROWD_MODIFIERS,
} from '../content.js';
import {
  setRoute, setSelections, setSettings,
  useSelection, useSettings,
} from '../store.js';
import { BackBar, ScreenHead, Pill } from '../ui/primitives.jsx';

const Group = ({ label, children }) => (
  <section className="gb-settings-group">
    <h3 className="gb-settings-label">{label}</h3>
    <div className="gb-settings-row">{children}</div>
  </section>
);
const Btn = ({ active, onClick, children, blurb }) => (
  <button className={`gb-seg-btn ${active ? 'is-on' : ''}`} onClick={onClick}>
    <span className="gb-seg-label">{children}</span>
    {blurb && <span className="gb-seg-blurb">{blurb}</span>}
  </button>
);

export default function MatchSettings() {
  const sel = useSelection();
  const settings = useSettings();
  const update = (p) => { sfx.click(); setSelections(p); };
  const tog = (p) => { sfx.click(); setSettings(p); };

  const random = () => {
    sfx.click();
    update({
      duration: MATCH_DURATIONS[Math.floor(Math.random() * MATCH_DURATIONS.length)].id,
      weather:  WEATHER_PRESETS[Math.floor(Math.random() * WEATHER_PRESETS.length)].id,
      ball:     BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)].id,
      arena:    ARENAS[Math.floor(Math.random() * ARENAS.length)].id,
      crowd:    CROWD_MODIFIERS[Math.floor(Math.random() * CROWD_MODIFIERS.length)].id,
    });
  };

  const next = () => {
    sfx.confirm();
    setRoute('match-intro');
  };

  return (
    <div className="gb-page">
      <BackBar onBack={() => setRoute(sel.mode === 'quick' ? 'difficulty' : 'player-select')}/>
      <ScreenHead
        kicker="Match"
        title="Set the conditions."
        blurb="Every dial changes how the ball feels. Random picks four surprises.">
        <button className="btn btn-ghost btn-sm" onClick={random}>{Icon.sparkle} Randomize</button>
      </ScreenHead>

      <Group label="Duration">
        {MATCH_DURATIONS.map((d) => (
          <Btn key={d.id} active={sel.duration === d.id} onClick={() => update({ duration: d.id })}>
            {d.label}
          </Btn>
        ))}
      </Group>

      <Group label="Weather">
        {WEATHER_PRESETS.map((w) => (
          <Btn key={w.id} active={sel.weather === w.id} onClick={() => update({ weather: w.id })} blurb={w.blurb}>
            {w.label}
          </Btn>
        ))}
      </Group>

      <Group label="Ball">
        {BALL_TYPES.map((b) => (
          <Btn key={b.id} active={sel.ball === b.id} onClick={() => update({ ball: b.id })} blurb={b.blurb}>
            {b.label}
          </Btn>
        ))}
      </Group>

      <Group label="Arena">
        <div className="gb-arena-row">
          {ARENAS.map((a) => (
            <button
              key={a.id}
              className={`gb-arena-card ${sel.arena === a.id ? 'is-on' : ''}`}
              onClick={() => update({ arena: a.id })}
              style={{ '--tm-sky-a': a.sky[0], '--tm-sky-b': a.sky[1], '--tm-light': a.lights }}>
              <div className="gb-arena-card-preview" aria-hidden="true">
                <div className="gb-arena-card-sky"/>
                <div className="gb-arena-card-light"/>
                <div className="gb-arena-card-pitch"/>
              </div>
              <div className="gb-arena-card-body">
                <div className="gb-arena-card-title">{a.label}</div>
                <div className="gb-arena-card-blurb">{a.blurb}</div>
              </div>
            </button>
          ))}
        </div>
      </Group>

      <Group label="Crowd">
        {CROWD_MODIFIERS.map((c) => (
          <Btn key={c.id} active={sel.crowd === c.id} onClick={() => update({ crowd: c.id })} blurb={c.blurb}>
            {c.label}
          </Btn>
        ))}
      </Group>

      <Group label="Accessibility">
        <button
          className={`gb-toggle ${settings.reducedMotion ? 'is-on' : ''}`}
          onClick={() => tog({ reducedMotion: !settings.reducedMotion })}>
          <span className="gb-toggle-dot"/> Reduce motion
        </button>
        <button
          className={`gb-toggle ${settings.staticStadium ? 'is-on' : ''}`}
          onClick={() => tog({ staticStadium: !settings.staticStadium })}>
          <span className="gb-toggle-dot"/> Static stadium
        </button>
        <button
          className={`gb-toggle ${settings.sfx ? 'is-on' : ''}`}
          onClick={() => { const next = !settings.sfx; tog({ sfx: next }); setMuted(!next); if (next) sfx.click(); }}>
          <span className="gb-toggle-dot"/> Sound effects
        </button>
      </Group>

      <div className="gb-ctabar">
        <Pill tone="ghost">Settings autosave</Pill>
        <button className="btn btn-primary btn-lg" onClick={next}>{Icon.play} Kick-off</button>
      </div>
    </div>
  );
}
