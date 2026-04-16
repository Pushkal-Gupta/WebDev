import { useState } from 'react';
import styles from './CoachSetup.module.css';
import COACHES, { COACH_LEVELS } from '../../data/coaches';

const TC_OPTIONS = [
  { display: '3+0',   total: 180_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+0',   total: 300_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '10+0',  total: 600_000,   incr: 0,      cat: 'Rapid',     delayType: 'none', delay: 0 },
  { display: '15+10', total: 900_000,   incr: 10_000, cat: 'Rapid',     delayType: 'fischer', delay: 10_000 },
  { display: '30+0',  total: 1_800_000, incr: 0,      cat: 'Classical', delayType: 'none', delay: 0 },
];

export default function CoachSetup({ onStart }) {
  const [selected, setSelected] = useState(COACHES[0]);
  const [level, setLevel]       = useState(COACH_LEVELS[3]);
  const [tc, setTc]             = useState(TC_OPTIONS[2]);
  const [noLimit, setNoLimit]   = useState(false);
  const [color, setColor]       = useState('white');

  return (
    <div className={styles.page}>
      {/* ── Left: coach roster tower (2 cols x 4 rows) ── */}
      <div className={styles.roster}>
        <h2 className={styles.rosterTitle}>Coaches</h2>
        <div className={styles.rosterGrid}>
          {COACHES.map((c) => (
            <button
              key={c.id}
              className={`${styles.card} ${selected?.id === c.id ? styles.cardActive : ''}`}
              style={{ '--c': c.color }}
              onClick={() => setSelected(c)}
            >
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" width="32" height="32"
                  style={{ color: c.color, filter: `drop-shadow(0 0 6px ${c.color}55)` }}
                  dangerouslySetInnerHTML={{ __html: c.icon }} />
              </div>
              <span className={styles.cardName}>{c.name}</span>
              <span className={styles.cardTag}>{c.tagline}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: selected coach dossier + settings ── */}
      <div className={styles.dossier}>
        {/* Hero header */}
        <div className={styles.hero} style={{ '--c': selected.color }}>
          <div className={styles.heroGlow} />
          <div className={styles.heroIcon}>
            <svg viewBox="0 0 24 24" width="56" height="56"
              style={{ color: selected.color, filter: `drop-shadow(0 0 12px ${selected.color}88)` }}
              dangerouslySetInnerHTML={{ __html: selected.icon }} />
          </div>
          <div className={styles.heroText}>
            <h2 className={styles.heroName} style={{ color: selected.color }}>{selected.name}</h2>
            <p className={styles.heroTag}>{selected.tagline}</p>
            {selected.focus && (
              <div className={styles.focusRow}>
                {selected.focus.map((f) => (
                  <span key={f} className={styles.chip} style={{ '--c': selected.color }}>{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description + quote */}
        <div className={styles.narrative}>
          <p className={styles.desc}>{selected.description}</p>
          <div className={styles.quote} style={{ '--c': selected.color }}>
            {selected.greetings[0]}
          </div>
        </div>

        {/* Settings strip */}
        <div className={styles.settings}>
          {/* Skill level */}
          <div className={styles.settingsSection}>
            <h4 className={styles.settingsLabel}>Skill Level</h4>
            <div className={styles.levelGrid}>
              {COACH_LEVELS.map((lv) => (
                <button
                  key={lv.id}
                  className={`${styles.levelBtn} ${level.id === lv.id ? styles.levelBtnActive : ''}`}
                  onClick={() => setLevel(lv)}
                >
                  <span className={styles.levelName}>{lv.name}</span>
                  <span className={styles.levelRating}>{lv.rating}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time + Color in a row */}
          <div className={styles.settingsRow}>
            <div className={styles.settingsSection}>
              <h4 className={styles.settingsLabel}>Time Control</h4>
              <div className={styles.tcGrid}>
                {TC_OPTIONS.map((opt) => (
                  <button
                    key={opt.display}
                    className={`${styles.tcBtn} ${!noLimit && tc.display === opt.display ? styles.tcBtnActive : ''}`}
                    onClick={() => { setTc(opt); setNoLimit(false); }}
                  >
                    <span className={styles.tcTime}>{opt.display}</span>
                    <span className={styles.tcCat}>{opt.cat}</span>
                  </button>
                ))}
                <button
                  className={`${styles.tcBtn} ${noLimit ? styles.tcBtnActive : ''}`}
                  onClick={() => setNoLimit(true)}
                >
                  <span className={styles.tcTime}>--:--</span>
                  <span className={styles.tcCat}>No Limit</span>
                </button>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h4 className={styles.settingsLabel}>Play As</h4>
              <div className={styles.colorBtns}>
                {['white', 'random', 'black'].map((c) => (
                  <button
                    key={c}
                    className={`${styles.colorBtn} ${color === c ? styles.colorBtnActive : ''}`}
                    onClick={() => setColor(c)}
                  >
                    <span
                      className={styles.colorDot}
                      style={{
                        background:
                          c === 'white' ? '#fff' :
                          c === 'random' ? 'linear-gradient(135deg, #fff 50%, #333 50%)' :
                          '#333',
                        border: c === 'black' ? '1px solid rgba(255,255,255,0.2)' : undefined,
                      }}
                    />
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          className={styles.startBtn}
          style={{ '--c': selected.color }}
          onClick={() => onStart(selected, level, noLimit ? null : tc, color)}
        >
          Play with {selected.name}
        </button>
      </div>
    </div>
  );
}
