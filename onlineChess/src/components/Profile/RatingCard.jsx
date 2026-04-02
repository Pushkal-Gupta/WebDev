import styles from './RatingCard.module.css';

const ICONS  = { bullet: '⚡', blitz: '🔥', rapid: '⏱', classical: '♟' };
const COLORS = {
  bullet:    { bg: 'rgba(255,200,0,0.08)',   border: 'rgba(255,200,0,0.25)',   text: '#ffd666' },
  blitz:     { bg: 'rgba(255,120,0,0.08)',   border: 'rgba(255,120,0,0.25)',   text: '#ff9966' },
  rapid:     { bg: 'rgba(0,200,255,0.08)',   border: 'rgba(0,200,255,0.25)',   text: '#66d9ff' },
  classical: { bg: 'rgba(160,120,255,0.08)', border: 'rgba(160,120,255,0.25)', text: '#c4aaff' },
};

const DEFAULT = { rating: 1500, rd: 350, games_played: 0, wins: 0, losses: 0, draws: 0, peak_rating: 1500 };

/**
 * Displays one category's Glicko-2 rating with W/D/L record.
 * @param {{ category: string, data: object|null }} props
 */
export default function RatingCard({ category, data }) {
  const cat  = (category || 'blitz').toLowerCase();
  const icon = ICONS[cat]  || '♟';
  const clr  = COLORS[cat] || COLORS.classical;
  const r    = data ? { ...DEFAULT, ...data } : DEFAULT;

  const provisional = r.rd > 110; // High RD = fewer games, less confident

  return (
    <div className={styles.card} style={{ background: clr.bg, borderColor: clr.border }}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.catName} style={{ color: clr.text }}>
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </span>
        {provisional && <span className={styles.provisional}>?</span>}
      </div>

      <div className={styles.rating} style={{ color: clr.text }}>
        {r.rating}
      </div>

      <div className={styles.peak}>Peak {r.peak_rating}</div>

      <div className={styles.record}>
        <span className={styles.wins}>{r.wins}W</span>
        <span className={styles.sep}>/</span>
        <span className={styles.draws}>{r.draws}D</span>
        <span className={styles.sep}>/</span>
        <span className={styles.losses}>{r.losses}L</span>
      </div>

      <div className={styles.games}>{r.games_played} games</div>
    </div>
  );
}
