import { useState, useEffect } from 'react';
import styles from './LeaderboardPage.module.css';
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../store/authStore';

const CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'];
const CAT_LABEL  = { bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', classical: 'Classical' };

function RdBadge({ rd }) {
  // Low RD = established rating; high RD = provisional
  const provisional = rd > 150;
  if (!provisional) return null;
  return <span className={styles.provisional} title={`Rating deviation: ${Math.round(rd)} — needs more games`}>?</span>;
}

function FlagEmoji({ country }) {
  if (!country || country.length !== 2) return null;
  const flag = country.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
  return <span className={styles.flag}>{flag}</span>;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('blitz');
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('leaderboard')
      .select('*')
      .eq('category', category)
      .order('rank', { ascending: true })
      .limit(100)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setRows(data || []);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Leaderboard</h2>
        <p className={styles.sub}>Top 100 players per time control</p>
      </div>

      {/* Category tabs */}
      <div className={styles.tabs}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.tab} ${category === cat ? styles.tabActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            {CAT_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading && <div className={styles.loading}>Loading…</div>}
        {error   && <div className={styles.empty}>Error: {error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div className={styles.empty}>
            No ranked players yet in {CAT_LABEL[category]}.<br />
            Play some games to appear here!
          </div>
        )}

        {!loading && rows.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thRank}>#</th>
                <th className={styles.thPlayer}>Player</th>
                <th className={styles.thRating}>Rating</th>
                <th className={styles.thPeak}>Peak</th>
                <th className={styles.thGames}>Games</th>
                <th className={styles.thWld}>W / L / D</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isMe = user?.id === r.user_id;
                return (
                  <tr key={`${r.user_id}-${r.category}`} className={`${styles.row} ${isMe ? styles.rowMe : ''}`}>
                    <td className={styles.tdRank}>
                      {r.rank <= 3
                        ? <span className={`${styles.medal} ${styles[`medal${r.rank}`]}`}>{r.rank}</span>
                        : r.rank}
                    </td>
                    <td className={styles.tdPlayer}>
                      <FlagEmoji country={r.country} />
                      <span className={styles.playerName}>{r.username}</span>
                      {isMe && <span className={styles.youBadge}>you</span>}
                      <RdBadge rd={r.rd} />
                    </td>
                    <td className={styles.tdRating}>{r.rating}</td>
                    <td className={styles.tdPeak}>{r.peak_rating}</td>
                    <td className={styles.tdGames}>{r.games_played}</td>
                    <td className={styles.tdWld}>
                      <span className={styles.wins}>{r.wins}</span>
                      <span className={styles.sep}>/</span>
                      <span className={styles.losses}>{r.losses}</span>
                      <span className={styles.sep}>/</span>
                      <span className={styles.draws}>{r.draws}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
