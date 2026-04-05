import { useEffect } from 'react';
import styles from './Modals.module.css';
import { usePieceResolver } from '../../utils/pieceResolver';

const PIECES = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
];

export default function PromotionModal({ color, onSelect }) {
  const resolvePiece = usePieceResolver();
  const colorLetter = color === 'white' ? 'w' : 'b';

  // ESC defaults to queen promotion
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onSelect('q');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelect]);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onSelect('q')}>
      <div className={styles.popup} role="dialog" aria-label="Promote pawn">
        <h3>Promote Pawn</h3>
        <div className={styles.promotionGrid}>
          {PIECES.map(({ type, label }) => (
            <button key={type} className={styles.promoBtn} onClick={() => onSelect(type)} title={label}>
              <img src={resolvePiece(type, colorLetter)} alt={label} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
