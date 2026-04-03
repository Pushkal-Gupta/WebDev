import { useState } from 'react';
import styles from './ComputerSetup.module.css';
import BOTS from '../../data/bots';

const TC_OPTIONS = [
  { display: '1+0',   total: 60,   incr: 0,  cat: 'Bullet',    delayType: 'none', delay: 0 },
  { display: '3+0',   total: 180,  incr: 0,  cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '5+0',   total: 300,  incr: 0,  cat: 'Blitz',     delayType: 'none', delay: 0 },
  { display: '10+0',  total: 600,  incr: 0,  cat: 'Rapid',     delayType: 'none', delay: 0 },
  { display: '15+10', total: 900,  incr: 10, cat: 'Rapid',     delayType: 'fischer', delay: 10 },
  { display: '30+0',  total: 1800, incr: 0,  cat: 'Classical',  delayType: 'none', delay: 0 },
];

export default function ComputerSetup({ onStart }) {
  const [selectedBot, setSelectedBot] = useState(BOTS[2]); // Omar as default
  const [selectedTC, setSelectedTC] = useState(TC_OPTIONS[2]); // 5+0 default
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [playerColor, setPlayerColor] = useState('random');

  const handleStart = () => {
    const tc = noTimeLimit ? null : selectedTC;
    onStart(selectedBot, tc, playerColor);
  };

  return (
    <div className={styles.page}>
      {/* Bot selection grid */}
      <div className={styles.botGrid}>
        <h2 className={styles.sectionTitle}>Choose Your Opponent</h2>
        <div className={styles.grid}>
          {BOTS.map(bot => (
            <button
              key={bot.id}
              className={`${styles.botCard} ${selectedBot?.id === bot.id ? styles.botCardActive : ''}`}
              style={{ '--bot-color': bot.color }}
              onClick={() => setSelectedBot(bot)}
            >
              <div className={styles.botIcon}>
                <svg viewBox="0 0 24 24" width="28" height="28" style={{ color: bot.color, filter: `drop-shadow(0 0 6px ${bot.color}44)` }} dangerouslySetInnerHTML={{ __html: bot.icon }} />
              </div>
              <div className={styles.botInfo}>
                <span className={styles.botName}>{bot.name}</span>
                <span className={styles.botRating}>{bot.rating}</span>
              </div>
              <span className={styles.botTagline}>{bot.tagline}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Details + settings panel */}
      <div className={styles.detailPanel}>
        {selectedBot && (
          <>
            <div className={styles.selectedHeader}>
              <svg viewBox="0 0 24 24" width="48" height="48" style={{ color: selectedBot.color, filter: `drop-shadow(0 0 8px ${selectedBot.color}66)` }} dangerouslySetInnerHTML={{ __html: selectedBot.icon }} />
              <div>
                <h3 className={styles.selectedName} style={{ color: selectedBot.color }}>{selectedBot.name}</h3>
                <span className={styles.selectedRating}>Rating: {selectedBot.rating}</span>
              </div>
            </div>
            <p className={styles.description}>{selectedBot.description}</p>
            <div className={styles.personality}>
              <div className={styles.msgRow}><span className={styles.msgLabel}>On win:</span> <span>{selectedBot.winMsg}</span></div>
              <div className={styles.msgRow}><span className={styles.msgLabel}>On lose:</span> <span>{selectedBot.loseMsg}</span></div>
            </div>
          </>
        )}

        {/* Time control */}
        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Time Control</h4>
          <div className={styles.tcGrid}>
            {TC_OPTIONS.map(tc => (
              <button
                key={tc.display}
                className={`${styles.tcBtn} ${!noTimeLimit && selectedTC?.display === tc.display ? styles.tcBtnActive : ''}`}
                onClick={() => { setSelectedTC(tc); setNoTimeLimit(false); }}
              >
                <span className={styles.tcTime}>{tc.display}</span>
                <span className={styles.tcCat}>{tc.cat}</span>
              </button>
            ))}
            <button
              className={`${styles.tcBtn} ${noTimeLimit ? styles.tcBtnActive : ''}`}
              onClick={() => setNoTimeLimit(true)}
            >
              <span className={styles.tcTime}>No Limit</span>
              <span className={styles.tcCat}>Casual</span>
            </button>
          </div>
        </div>

        {/* Color selection */}
        <div className={styles.section}>
          <h4 className={styles.sectionLabel}>Play As</h4>
          <div className={styles.colorBtns}>
            {['white', 'random', 'black'].map(c => (
              <button
                key={c}
                className={`${styles.colorBtn} ${playerColor === c ? styles.colorBtnActive : ''}`}
                onClick={() => setPlayerColor(c)}
              >
                {c === 'white' && <span className={styles.colorIcon} style={{ background: '#fff' }} />}
                {c === 'random' && <span className={styles.colorIcon} style={{ background: 'linear-gradient(135deg, #fff 50%, #333 50%)' }} />}
                {c === 'black' && <span className={styles.colorIcon} style={{ background: '#333', border: '1px solid rgba(255,255,255,0.2)' }} />}
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start Game vs {selectedBot?.name || 'Computer'}
        </button>
      </div>
    </div>
  );
}
