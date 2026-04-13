import { useState, useEffect } from 'react';
import { fetchExplorerData } from '../../utils/openingExplorer';
import styles from './OpeningExplorer.module.css';

function WinBar({ white, draws, black }) {
  const total = white + draws + black;
  if (total === 0) return null;
  const wPct = ((white / total) * 100).toFixed(1);
  const dPct = ((draws / total) * 100).toFixed(1);
  const bPct = ((black / total) * 100).toFixed(1);

  return (
    <div className={styles.winBar}>
      <div className={styles.winW} style={{ width: `${wPct}%` }}>
        {wPct > 10 && <span>{wPct}%</span>}
      </div>
      <div className={styles.winD} style={{ width: `${dPct}%` }}>
        {dPct > 10 && <span>{dPct}%</span>}
      </div>
      <div className={styles.winB} style={{ width: `${bPct}%` }}>
        {bPct > 10 && <span>{bPct}%</span>}
      </div>
    </div>
  );
}

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function OpeningExplorer({ fen, onPlayMove }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [db, setDb]           = useState('lichess'); // 'lichess' | 'masters'

  useEffect(() => {
    if (!fen) return;
    let cancelled = false;
    setLoading(true);
    fetchExplorerData(fen, db).then(result => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [fen, db]);

  const totalGames = data ? data.white + data.draws + data.black : 0;

  return (
    <div className={styles.explorer}>
      {/* DB selector */}
      <div className={styles.dbRow}>
        <button
          className={`${styles.dbBtn} ${db === 'lichess' ? styles.dbBtnActive : ''}`}
          onClick={() => setDb('lichess')}
        >
          Lichess
        </button>
        <button
          className={`${styles.dbBtn} ${db === 'masters' ? styles.dbBtnActive : ''}`}
          onClick={() => setDb('masters')}
        >
          Masters
        </button>
        {totalGames > 0 && (
          <span className={styles.totalGames}>{formatCount(totalGames)} games</span>
        )}
      </div>

      {/* Opening name */}
      {data?.opening && (
        <div className={styles.openingName}>
          {data.eco && <span className={styles.eco}>{data.eco}</span>}
          {data.opening}
        </div>
      )}

      {/* Overall win bar */}
      {totalGames > 0 && (
        <WinBar white={data.white} draws={data.draws} black={data.black} />
      )}

      {loading && <div className={styles.loading}>Loading explorer...</div>}

      {!loading && !data && fen && (
        <div className={styles.empty}>
          Explorer data unavailable. The Lichess Explorer API may require authentication.
          <br /><br />
          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
            Try refreshing, or check back later.
          </span>
        </div>
      )}

      {!loading && data && data.moves.length === 0 && (
        <div className={styles.empty}>No games found in this position.</div>
      )}

      {/* Move table */}
      {!loading && data && data.moves.length > 0 && (
        <div className={styles.moveTable}>
          <div className={styles.moveHeader}>
            <span className={styles.colMove}>Move</span>
            <span className={styles.colGames}>Games</span>
            <span className={styles.colBar}>Result</span>
          </div>
          {data.moves.map(m => {
            const total = m.white + m.draws + m.black;
            const wPct = total ? Math.round((m.white / total) * 100) : 0;
            const dPct = total ? Math.round((m.draws / total) * 100) : 0;
            const bPct = total ? Math.round((m.black / total) * 100) : 0;
            return (
              <div
                key={m.san}
                className={styles.moveRow}
                onClick={() => onPlayMove?.(m.uci, m.san)}
              >
                <span className={styles.moveSan}>{m.san}</span>
                <span className={styles.moveGames}>{formatCount(total)}</span>
                <div className={styles.miniBar}>
                  <div className={styles.miniW} style={{ width: `${wPct}%` }} />
                  <div className={styles.miniD} style={{ width: `${dPct}%` }} />
                  <div className={styles.miniB} style={{ width: `${bPct}%` }} />
                </div>
                <span className={styles.movePcts}>
                  <span className={styles.pctW}>{wPct}</span>
                  <span className={styles.pctD}>{dPct}</span>
                  <span className={styles.pctB}>{bPct}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Top games */}
      {!loading && data?.topGames?.length > 0 && (
        <div className={styles.topGames}>
          <div className={styles.topGamesLabel}>Notable Games</div>
          {data.topGames.map(g => (
            <div key={g.id} className={styles.topGame}>
              <span className={styles.tgPlayers}>
                {g.white} ({g.whiteRating}) vs {g.black} ({g.blackRating})
              </span>
              <span className={styles.tgResult}>
                {g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2'}
              </span>
              {g.year && <span className={styles.tgYear}>{g.year}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
