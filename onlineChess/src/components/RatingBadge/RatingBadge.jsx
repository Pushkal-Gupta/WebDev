import styles from './RatingBadge.module.css';

const CATEGORY_ICONS = {
  bullet:    'Bu',
  blitz:     'Bz',
  rapid:     'Ra',
  classical: 'Cl',
};

/**
 * Small chip displaying a player's rating + category icon.
 * @param {{ rating: number, category: string, size?: 'sm'|'md' }} props
 */
export default function RatingBadge({ rating, category, size = 'md' }) {
  const cat = (category || '').toLowerCase();
  const icon = CATEGORY_ICONS[cat] || 'Cl';

  return (
    <span className={`${styles.badge} ${styles[size]}`}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.value}>{rating ?? '?'}</span>
    </span>
  );
}
