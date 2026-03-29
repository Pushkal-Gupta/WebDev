import { useState } from 'react';
import styles from './LeftSidebar.module.css';
import useGameStore from '../../store/gameStore';
import useThemeStore from '../../store/themeStore';

function Toggle({ checked, onChange }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.slider}></span>
    </label>
  );
}

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span className={styles.sectionTitle}>{icon} {title}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▼</span>
      </div>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function LeftSidebar({ onAlert }) {
  const {
    showLabels, setShowLabels,
    highlightLastMove, setHighlightLastMove,
    highlightSelected, setHighlightSelected,
    showLegalDots, setShowLegalDots,
    dotSize, setDotSize,
    flipped, setFlipped,
    undoMove, redoMove,
    getPgn, importPgn,
    gameStarted,
  } = useGameStore();

  const {
    clr1, clr2, clr1c, clr2c, clr1p, clr2p, clr1x, clr2x,
    setColor, applyTheme, resetDefault, themes, themeIndex,
    pieceSets, pieceSetIndex, setPieceSet,
  } = useThemeStore();

  const [importText, setImportText] = useState('');

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importPgn(importText.trim());
    if (success) {
      onAlert && onAlert('PGN imported successfully');
      setImportText('');
    } else {
      onAlert && onAlert('Invalid PGN format');
    }
  };

  const handleCopyPgn = () => {
    const pgn = getPgn();
    if (!pgn) { onAlert && onAlert('No game in progress'); return; }
    navigator.clipboard.writeText(pgn).then(() => onAlert && onAlert('PGN copied!'));
  };

  return (
    <aside className={styles.sidebar}>
      {/* Board Settings */}
      <Section title="Board Settings" icon="♟">
        <div className={styles.label} style={{ marginBottom: 4 }}>Themes</div>
        <div className={styles.themeGrid}>
          {themes.map((t, i) => (
            <button
              key={i}
              className={`${styles.themeBtn} ${themeIndex === i ? styles.themeBtnActive : ''}`}
              onClick={() => applyTheme(i)}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Light Square</span>
          <div className={styles.colorSwatch}>
            <input type="color" value={clr1} onChange={(e) => setColor('clr1', e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Dark Square</span>
          <div className={styles.colorSwatch}>
            <input type="color" value={clr2} onChange={(e) => setColor('clr2', e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Highlight Color</span>
          <div className={styles.colorSwatch}>
            <input type="color" value={clr1x} onChange={(e) => { setColor('clr1x', e.target.value); setColor('clr2x', e.target.value); }} />
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Check Color</span>
          <div className={styles.colorSwatch}>
            <input type="color" value={clr1c} onChange={(e) => { setColor('clr1c', e.target.value); setColor('clr2c', e.target.value); }} />
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Last Move Color</span>
          <div className={styles.colorSwatch}>
            <input type="color" value={clr1p} onChange={(e) => { setColor('clr1p', e.target.value); setColor('clr2p', e.target.value); }} />
          </div>
        </div>

        <div className={styles.label} style={{ marginTop: 4 }}>Piece Set</div>
        <select
          className={styles.select}
          value={pieceSetIndex}
          onChange={(e) => setPieceSet(Number(e.target.value))}
        >
          {pieceSets.map((ps, i) => (
            <option key={i} value={i}>{ps.name}</option>
          ))}
        </select>

        <div className={styles.row}>
          <span className={styles.label}>Show Labels</span>
          <Toggle checked={showLabels} onChange={setShowLabels} />
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Flip Board</span>
          <Toggle checked={flipped} onChange={setFlipped} />
        </div>

        <button className={styles.btn} onClick={resetDefault}>Reset to Default</button>
      </Section>

      {/* Move Settings */}
      <Section title="Move Settings" icon="↔">
        <div className={styles.row}>
          <span className={styles.label}>Highlight Last Move</span>
          <Toggle checked={highlightLastMove} onChange={setHighlightLastMove} />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Highlight Selected</span>
          <Toggle checked={highlightSelected} onChange={setHighlightSelected} />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Show Legal Dots</span>
          <Toggle checked={showLegalDots} onChange={setShowLegalDots} />
        </div>
        <div>
          <div className={styles.row}>
            <span className={styles.label}>Dot Size: {dotSize}</span>
          </div>
          <input
            type="range"
            min="4"
            max="28"
            value={dotSize}
            onChange={(e) => setDotSize(Number(e.target.value))}
            className={styles.range}
          />
        </div>
      </Section>

      {/* Game Settings */}
      <Section title="Game Settings" icon="📖">
        <div className={styles.label}>Current PGN</div>
        <textarea
          className={styles.textarea}
          value={getPgn()}
          readOnly
          placeholder="No game in progress"
        />
        <button className={styles.btn} onClick={handleCopyPgn}>Copy PGN</button>

        <div className={styles.label} style={{ marginTop: 6 }}>Import PGN</div>
        <textarea
          className={styles.textarea}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste PGN here..."
        />
        <button className={styles.btn} onClick={handleImport}>Import PGN</button>

        <div className={styles.btnRow} style={{ marginTop: 4 }}>
          <button className={styles.btn} onClick={undoMove} disabled={!gameStarted}>Undo</button>
          <button className={styles.btn} onClick={redoMove} disabled={!gameStarted}>Redo</button>
        </div>
      </Section>
    </aside>
  );
}
