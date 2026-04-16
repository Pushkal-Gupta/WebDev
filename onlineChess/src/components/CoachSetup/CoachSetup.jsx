import { useState } from 'react';
import styles from './CoachSetup.module.css';
import COACHES, { COACH_LEVELS } from '../../data/coaches';

const TC_OPTIONS = [
  { display: '3+0',   total: 180_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+0',   total: 300_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+3',   total: 300_000,   incr: 3_000,  cat: 'Blitz',     delayType: 'fischer', delay: 3_000 },
  { display: '10+0',  total: 600_000,   incr: 0,      cat: 'Rapid',     delayType: 'none', delay: 0 },
  { display: '10+5',  total: 600_000,   incr: 5_000,  cat: 'Rapid',     delayType: 'fischer', delay: 5_000 },
  { display: '15+10', total: 900_000,   incr: 10_000, cat: 'Rapid',     delayType: 'fischer', delay: 10_000 },
  { display: '30+0',  total: 1_800_000, incr: 0,      cat: 'Classical', delayType: 'none', delay: 0 },
];

const TC_COLOR = { Bullet: '#f0c94c', Blitz: '#ffa94d', Rapid: '#6fdc8c', Classical: '#a78bfa' };

export default function CoachSetup({ onStart }) {
  const [selected, setSelected] = useState(COACHES[0]);
  const [level, setLevel]       = useState(COACH_LEVELS[3]);
  const [tc, setTc]             = useState(TC_OPTIONS[3]);
  const [noLimit, setNoLimit]   = useState(false);
  const [color, setColor]       = useState('white');

  return (
    <div className={styles.page}>
      {/* ── Left: coach grid + selected details ── */}
      <div className={styles.mainCol}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose Your Coach</h2>
          <p className={styles.subtitle}>Pick a training style, then customize the match.</p>
        </div>

        <div className={styles.grid}>
          {COACHES.map((c) => (
            <button
              key={c.id}
              className={`${styles.card} ${selected?.id === c.id ? styles.cardActive : ''}`}
              style={{ '--c': c.color }}
              onClick={() => setSelected(c)}
            >
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" width="24" height="24"
                  style={{ color: c.color }}
                  dangerouslySetInnerHTML={{ __html: c.icon }} />
              </div>
              <div className={styles.cardText}>
                <span className={styles.cardName}>{c.name}</span>
                <span className={styles.cardTag}>{c.tagline}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected coach details */}
        <div className={styles.details} style={{ '--c': selected.color }}>
          <div className={styles.detailHeader}>
            <div className={styles.detailIcon}>
              <svg viewBox="0 0 24 24" width="36" height="36"
                style={{ color: selected.color }}
                dangerouslySetInnerHTML={{ __html: selected.icon }} />
            </div>
            <div>
              <h3 className={styles.detailName} style={{ color: selected.color }}>{selected.name}</h3>
              <p className={styles.detailTag}>{selected.description}</p>
            </div>
          </div>
          <div className={styles.detailMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Best for</span>
              <span className={styles.metaValue}>{selected.focus?.slice(0, 2).join(', ')}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Style</span>
              <span className={styles.metaValue}>{selected.focus?.[2] || 'Guided play'}</span>
            </div>
          </div>
          <div className={styles.detailQuote}>{selected.greetings[0]}</div>
        </div>
      </div>

      {/* ── Right: sticky settings panel ── */}
      <div className={styles.settingsPanel}>
        <h3 className={styles.settingsTitle}>Match Setup</h3>

        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Skill Level</h4>
          <div className={styles.levelGrid}>
            {COACH_LEVELS.map((lv) => (
              <button
                key={lv.id}
                className={`${styles.levelBtn} ${level.id === lv.id ? styles.levelBtnActive : ''}`}
                onClick={() => setLevel(lv)}
              >
                {lv.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Time Control</h4>
          <div className={styles.tcGrid}>
            {TC_OPTIONS.map((opt) => (
              <button
                key={opt.display}
                className={`${styles.tcBtn} ${!noLimit && tc.display === opt.display ? styles.tcBtnActive : ''}`}
                style={{ '--tc-color': TC_COLOR[opt.cat] || '#888' }}
                onClick={() => { setTc(opt); setNoLimit(false); }}
              >
                <span className={styles.tcTime}>{opt.display}</span>
                <span className={styles.tcCat}>{opt.cat}</span>
              </button>
            ))}
            <button
              className={`${styles.tcBtn} ${noLimit ? styles.tcBtnActive : ''}`}
              style={{ '--tc-color': 'rgba(255,255,255,0.4)' }}
              onClick={() => setNoLimit(true)}
            >
              <span className={styles.tcTime}>--:--</span>
              <span className={styles.tcCat}>No Limit</span>
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Play As</h4>
          <div className={styles.colorRow}>
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

        <button
          className={styles.startBtn}
          onClick={() => onStart(selected, level, noLimit ? null : tc, color)}
        >
          Play with {selected.name}
        </button>
      </div>
    </div>
  );
}
