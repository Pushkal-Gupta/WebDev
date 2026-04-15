import { useState } from 'react';
import styles from './CoachSetup.module.css';
import COACHES, { COACH_LEVELS } from '../../data/coaches';

// Reuse the same time control presets as ComputerSetup for consistency.
const TC_OPTIONS = [
  { display: '3+0',   total: 180_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+0',   total: 300_000,   incr: 0,      cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '10+0',  total: 600_000,   incr: 0,      cat: 'Rapid',     delayType: 'none', delay: 0 },
  { display: '15+10', total: 900_000,   incr: 10_000, cat: 'Rapid',     delayType: 'fischer', delay: 10_000 },
  { display: '30+0',  total: 1_800_000, incr: 0,      cat: 'Classical', delayType: 'none', delay: 0 },
];

export default function CoachSetup({ onStart }) {
  const [selectedCoach, setSelectedCoach] = useState(COACHES[0]);
  const [level, setLevel]         = useState(COACH_LEVELS[3]);  // Intermediate default
  const [tc, setTc]               = useState(TC_OPTIONS[2]);    // 10+0 default
  const [noLimit, setNoLimit]     = useState(false);
  const [playerColor, setColor]   = useState('white');

  const handleStart = () => {
    onStart(selectedCoach, level, noLimit ? null : tc, playerColor);
  };

  return (
    <div className={styles.page}>
      {/* ── Coach grid (left) ─────────────────────────────────────────────── */}
      <div className={styles.coachGrid}>
        <h2 className={styles.sectionTitle}>Choose Your Coach</h2>
        <div className={styles.grid}>
          {COACHES.map((coach) => (
            <button
              key={coach.id}
              className={`${styles.coachCard} ${selectedCoach?.id === coach.id ? styles.coachCardActive : ''}`}
              style={{ '--coach-color': coach.color }}
              onClick={() => setSelectedCoach(coach)}
            >
              <div className={styles.coachIcon}>
                <svg viewBox="0 0 24 24" width="28" height="28"
                  style={{ color: coach.color, filter: `drop-shadow(0 0 6px ${coach.color}44)` }}
                  dangerouslySetInnerHTML={{ __html: coach.icon }} />
              </div>
              <div className={styles.coachInfo}>
                <span className={styles.coachName}>{coach.name}</span>
              </div>
              <span className={styles.coachTagline}>{coach.tagline}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Detail panel + settings (right) ───────────────────────────────── */}
      <div className={styles.detailPanel}>
        {selectedCoach && (
          <>
            <div
              className={styles.selectedHeader}
              style={{ '--coach-color': selectedCoach.color }}
            >
              <svg viewBox="0 0 24 24" width="48" height="48"
                style={{ color: selectedCoach.color, filter: `drop-shadow(0 0 8px ${selectedCoach.color}66)` }}
                dangerouslySetInnerHTML={{ __html: selectedCoach.icon }} />
              <div className={styles.selectedHeaderText}>
                <h3 className={styles.selectedName} style={{ color: selectedCoach.color }}>
                  {selectedCoach.name}
                </h3>
                <span className={styles.selectedTag}>{selectedCoach.tagline}</span>
              </div>
            </div>

            {selectedCoach.focus && (
              <div className={styles.focusRow}>
                {selectedCoach.focus.map((f) => (
                  <span key={f} className={styles.focusChip} style={{ '--coach-color': selectedCoach.color }}>{f}</span>
                ))}
              </div>
            )}

            <p className={styles.description}>{selectedCoach.description}</p>

            <div className={styles.quoteBubble} style={{ '--coach-color': selectedCoach.color }}>
              {selectedCoach.greetings[0]}
            </div>
          </>
        )}

        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Skill Level</h4>
          <div className={styles.levelList}>
            {COACH_LEVELS.map((lv) => (
              <button
                key={lv.id}
                className={`${styles.levelBtn} ${level.id === lv.id ? styles.levelBtnActive : ''}`}
                onClick={() => setLevel(lv)}
              >
                <span className={styles.levelName}>{lv.name}</span>
                <span className={styles.levelRating}>({lv.rating})</span>
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
              <span className={styles.tcTime}>No Limit</span>
              <span className={styles.tcCat}>Casual</span>
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Play As</h4>
          <div className={styles.colorBtns}>
            {['white', 'random', 'black'].map((c) => (
              <button
                key={c}
                className={`${styles.colorBtn} ${playerColor === c ? styles.colorBtnActive : ''}`}
                onClick={() => setColor(c)}
              >
                <span
                  className={styles.colorIcon}
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

        <button className={styles.startBtn} onClick={handleStart}>
          Play with {selectedCoach.name}
        </button>
      </div>
    </div>
  );
}
