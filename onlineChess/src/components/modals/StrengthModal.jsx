import { useState } from 'react';
import styles from './Modals.module.css';
import BOTS from '../../data/bots';

function BotIcon({ bot, size = 36 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      style={{ color: bot.color, filter: `drop-shadow(0 0 6px ${bot.color}44)` }}
      dangerouslySetInnerHTML={{ __html: bot.icon }}
    />
  );
}

export default function StrengthModal({ onSelect, onCancel }) {
  const [selectedBot, setSelectedBot] = useState(null);

  const handlePlay = (color) => {
    if (!selectedBot) return;
    onSelect(selectedBot.strength, color);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup} style={{ maxWidth: 540, maxHeight: '85vh', overflow: 'auto' }}>
        <h3>Choose Your Opponent</h3>

        {/* Bot grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
          margin: '12px 0',
        }}>
          {BOTS.map(bot => {
            const isActive = selectedBot?.id === bot.id;
            return (
              <button
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '14px 8px 10px',
                  borderRadius: 10,
                  border: isActive ? `2px solid ${bot.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? `${bot.color}12` : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  color: '#fff',
                  fontFamily: 'inherit',
                }}
              >
                <BotIcon bot={bot} size={32} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? bot.color : '#fff', marginTop: 2 }}>
                  {bot.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  {bot.rating}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.3 }}>
                  {bot.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected bot detail */}
        {selectedBot && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: `${selectedBot.color}08`,
            border: `1px solid ${selectedBot.color}22`,
            margin: '8px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <BotIcon bot={selectedBot} size={40} />
              <div>
                <div style={{ fontWeight: 700, color: selectedBot.color, fontSize: '1rem' }}>
                  {selectedBot.name} ({selectedBot.rating})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  {selectedBot.description}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: '8px 0 6px' }}>Play as:</p>
            <div className={styles.colorBtns}>
              <button onClick={() => handlePlay('white')}>White</button>
              <button onClick={() => handlePlay('random')}>Random</button>
              <button onClick={() => handlePlay('black')}>Black</button>
            </div>
          </div>
        )}

        {!selectedBot && (
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '8px 0' }}>
            Select a bot to play against
          </p>
        )}

        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
