import styles from './LeftSidebar.module.css';
import useGameStore from '../../store/gameStore';

export default function LeftSidebar({ onAlert }) {
  const {
    flipped, setFlipped,
    undoMove, redoMove,
    getPgn,
    gameStarted, gameOver,
  } = useGameStore();

  const handleCopyPgn = () => {
    const pgn = getPgn();
    if (!pgn) { onAlert && onAlert('No game to copy'); return; }
    navigator.clipboard.writeText(pgn).then(() => onAlert && onAlert('PGN copied!'));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={() => setFlipped(!flipped)} title="Flip board">
          Flip
        </button>
        <button className={styles.btn} onClick={undoMove} disabled={!gameStarted} title="Undo">
          Undo
        </button>
        <button className={styles.btn} onClick={redoMove} disabled={!gameStarted} title="Redo">
          Redo
        </button>
        {gameOver && (
          <button className={styles.btn} onClick={handleCopyPgn} title="Copy PGN">
            Copy PGN
          </button>
        )}
      </div>
    </aside>
  );
}
