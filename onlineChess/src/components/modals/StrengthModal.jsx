import { useState } from 'react';
import styles from './Modals.module.css';

const LEVELS = [
  { level: 1,  label: 'Beginner',     desc: 'Just learning the basics' },
  { level: 2,  label: 'Novice',       desc: 'Simple tactics & blunders' },
  { level: 3,  label: 'Casual',       desc: 'Occasional good moves' },
  { level: 4,  label: 'Club Player',  desc: 'Solid play, some mistakes' },
  { level: 5,  label: 'Intermediate', desc: 'Consistent strategy' },
  { level: 6,  label: 'Advanced',     desc: 'Strong positional play' },
  { level: 7,  label: 'Expert',       desc: 'Stockfish — tough' },
  { level: 8,  label: 'Master',       desc: 'Stockfish — very tough' },
  { level: 9,  label: 'Grandmaster',  desc: 'Stockfish — brutal' },
  { level: 10, label: 'Engine',       desc: 'Stockfish — max strength' },
];

export default function StrengthModal({ onSelect, onCancel }) {
  const [strength, setStrength] = useState(4);
  const current = LEVELS[strength - 1];
  const isStockfish = strength >= 7;
  const accent = isStockfish ? '#ffaa44' : '#00fff5';
  const accentAlpha = isStockfish ? 'rgba(255,160,0,' : 'rgba(0,255,245,';

  return (
    <div className={styles.overlay}>
      <div className={styles.popup} style={{ maxWidth: 380 }}>
        <h3>Play vs Computer</h3>

        {/* Level badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '8px 0 6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 24px', borderRadius: 12,
            background: `${accentAlpha}0.07)`,
            border: `1px solid ${accentAlpha}0.28)`,
            minWidth: 190, justifyContent: 'center',
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: accent, lineHeight: 1 }}>{strength}</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: accent }}>{current.label}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0, textAlign: 'center' }}>
            {current.desc}
          </p>
          {isStockfish && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,160,0,0.65)', background: 'rgba(255,160,0,0.06)', padding: '2px 10px', borderRadius: 4, border: '1px solid rgba(255,160,0,0.18)' }}>
              ⚙ Stockfish engine
            </span>
          )}
        </div>

        {/* Slider */}
        <input
          type="range"
          min="1" max="10"
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
          className={styles.strengthSlider}
          style={{ accentColor: accent }}
        />

        {/* Level dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '2px 0 16px' }}>
          {LEVELS.map(l => (
            <button
              key={l.level}
              title={l.label}
              onClick={() => setStrength(l.level)}
              style={{
                width: 10, height: 10, borderRadius: '50%', padding: 0, cursor: 'pointer',
                border: `1px solid ${l.level >= 7 ? 'rgba(255,160,0,0.45)' : 'rgba(255,255,255,0.22)'}`,
                background: strength === l.level
                  ? accent
                  : l.level >= 7 ? 'rgba(255,160,0,0.18)' : 'rgba(255,255,255,0.1)',
                transform: strength === l.level ? 'scale(1.35)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>

        {/* Color buttons */}
        <p className={styles.levelText} style={{ marginBottom: 10, fontSize: '0.85rem' }}>Play as:</p>
        <div className={styles.colorBtns}>
          <button onClick={() => onSelect(strength, 'white')}>♔ White</button>
          <button onClick={() => onSelect(strength, 'random')}>⚄ Random</button>
          <button onClick={() => onSelect(strength, 'black')}>♚ Black</button>
        </div>

        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
