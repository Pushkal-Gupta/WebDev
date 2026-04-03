import useThemeStore from '../../store/themeStore';
import useGameStore from '../../store/gameStore';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const {
    pieceSets, pieceSetIndex, setPieceSet,
    themes, themeIndex, applyTheme,
    clr1, clr2, clr1c, clr1p, clr1x,
    setColor, resetDefault,
    soundEnabled, setSoundEnabled, soundVolume, setSoundVolume,
  } = useThemeStore();
  const {
    showLabels, setShowLabels,
    highlightLastMove, setHighlightLastMove,
    highlightSelected, setHighlightSelected,
    showLegalDots, setShowLegalDots,
    dotSize, setDotSize,
    blindfoldMode, setBlindfoldMode,
  } = useGameStore();

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Settings</h2>

      {/* ── Piece Set ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Piece Set</h3>
        <div className={styles.pieceGrid}>
          {pieceSets.map((ps, i) => (
            <button
              key={ps.name}
              className={`${styles.pieceBtn} ${pieceSetIndex === i ? styles.pieceBtnActive : ''}`}
              onClick={() => setPieceSet(i)}
            >
              <img src={`./images/${ps.path}queen-white.png`} alt={ps.name} className={styles.pieceImg} />
              <span>{ps.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Board Theme ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Board Theme</h3>
        <div className={styles.themeGrid}>
          {themes.map((th, i) => (
            <button
              key={th.name}
              className={`${styles.themeBtn} ${themeIndex === i ? styles.themeBtnActive : ''}`}
              onClick={() => applyTheme(i)}
            >
              <div className={styles.themeSwatch}>
                <div style={{ background: th.clr1, width: '50%', height: '100%' }} />
                <div style={{ background: th.clr2, width: '50%', height: '100%' }} />
              </div>
              <span>{th.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Board Colors ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Board Colors</h3>
        <div className={styles.colorGrid}>
          <label className={styles.colorItem}>
            <span>Light Square</span>
            <input type="color" value={clr1} onChange={e => setColor('clr1', e.target.value)} />
          </label>
          <label className={styles.colorItem}>
            <span>Dark Square</span>
            <input type="color" value={clr2} onChange={e => setColor('clr2', e.target.value)} />
          </label>
          <label className={styles.colorItem}>
            <span>Highlight</span>
            <input type="color" value={clr1x} onChange={e => { setColor('clr1x', e.target.value); setColor('clr2x', e.target.value); }} />
          </label>
          <label className={styles.colorItem}>
            <span>Check</span>
            <input type="color" value={clr1c} onChange={e => { setColor('clr1c', e.target.value); setColor('clr2c', e.target.value); }} />
          </label>
          <label className={styles.colorItem}>
            <span>Last Move</span>
            <input type="color" value={clr1p} onChange={e => { setColor('clr1p', e.target.value); setColor('clr2p', e.target.value); }} />
          </label>
        </div>
      </section>

      {/* ── Display ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Display</h3>
        <div className={styles.toggleList}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
            <span>Board Labels</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={highlightLastMove} onChange={e => setHighlightLastMove(e.target.checked)} />
            <span>Highlight Last Move</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={highlightSelected} onChange={e => setHighlightSelected(e.target.checked)} />
            <span>Highlight Selected</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={showLegalDots} onChange={e => setShowLegalDots(e.target.checked)} />
            <span>Legal Move Dots</span>
          </label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={blindfoldMode} onChange={e => setBlindfoldMode(e.target.checked)} />
            <span>Blindfold Mode</span>
          </label>
        </div>
        {showLegalDots && (
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Dot Size: {dotSize}px</label>
            <input
              type="range" min="4" max="28"
              value={dotSize}
              onChange={e => setDotSize(Number(e.target.value))}
              className={styles.range}
            />
          </div>
        )}
      </section>

      {/* ── Sound ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Sound</h3>
        <div className={styles.toggleList}>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
            <span>Sound Effects</span>
          </label>
        </div>
        {soundEnabled && (
          <div className={styles.rangeField}>
            <label className={styles.rangeLabel}>Volume: {Math.round(soundVolume * 100)}%</label>
            <input
              type="range" min="0" max="100"
              value={Math.round(soundVolume * 100)}
              onChange={e => setSoundVolume(Number(e.target.value) / 100)}
              className={styles.range}
            />
          </div>
        )}
      </section>

      {/* ── Reset ── */}
      <button className={styles.resetBtn} onClick={resetDefault}>
        Reset All to Default
      </button>
    </div>
  );
}
