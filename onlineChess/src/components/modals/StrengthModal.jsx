import { useState } from 'react';
import styles from './Modals.module.css';

export default function StrengthModal({ onSelect, onCancel }) {
  const [strength, setStrength] = useState(4);

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>Select Strength and Color</h3>
        <input
          type="range"
          min="1"
          max="10"
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
          className={styles.strengthSlider}
        />
        <p className={styles.levelText}>Stockfish Level {strength}</p>
        <div className={styles.colorBtns}>
          <button onClick={() => onSelect(strength, 'white')}>Play as White</button>
          <button onClick={() => onSelect(strength, 'random')}>Random</button>
          <button onClick={() => onSelect(strength, 'black')}>Play as Black</button>
        </div>
        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
