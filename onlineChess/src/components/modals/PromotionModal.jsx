import styles from './Modals.module.css';

const PIECES = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

export default function PromotionModal({ color, imagePath, onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3>Promote Pawn</h3>
        <div className={styles.promotionGrid}>
          {PIECES.map(({ type, label }) => {
            const pieceNames = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' };
            const imgSrc = `${imagePath}${pieceNames[type]}-${color}.png`;
            return (
              <button key={type} className={styles.promoBtn} onClick={() => onSelect(type)} title={label}>
                <img src={imgSrc} alt={label} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
