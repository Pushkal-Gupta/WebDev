import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import styles from './SpectateList.module.css';
import SpectateBoard from './SpectateBoard';
import { getPublicGames, getRoom } from '../../utils/multiplayerService';

function formatTC(tc) {
  if (!tc) return '—';
  if (tc.noTimer) return '∞';
  const min = Math.floor((tc.initialTime || 0) / 60);
  const sec = (tc.initialTime || 0) % 60;
  const base = sec > 0 ? `${min}:${String(sec).padStart(2,'0')}` : `${min}`;
  return tc.increment ? `${base}+${tc.increment}` : base;
}

function formatAgo(dateStr) {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// Tiny static board thumbnail from FEN
function FenThumbnail({ fen }) {
  const PIECE_CHARS = { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙', k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' };
  try {
    const chess = new Chess(fen);
    const board = chess.board();
    return (
      <div className={styles.thumb}>
        {board.map((row, r) =>
          row.map((sq, c) => {
            const light = (r + c) % 2 === 0;
            return (
              <div key={`${r}-${c}`} className={`${styles.thumbCell} ${light ? styles.thumbL : styles.thumbD}`}>
                {sq && <span className={sq.color === 'w' ? styles.thumbPW : styles.thumbPB}>
                  {PIECE_CHARS[sq.color === 'w' ? sq.type.toUpperCase() : sq.type]}
                </span>}
              </div>
            );
          })
        )}
      </div>
    );
  } catch {
    return <div className={styles.thumb} />;
  }
}

export default function SpectateList() {
  const [games, setGames]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [spectating, setSpectating] = useState(null); // room object

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicGames();
      setGames(data);
    } catch (err) {
      console.error('Failed to fetch public games:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line — refresh is stable

  const handleWatch = useCallback(async (gameId) => {
    const room = await getRoom(gameId);
    if (room) setSpectating(room);
  }, []);

  if (spectating) {
    return (
      <SpectateBoard
        room={spectating}
        onBack={() => { setSpectating(null); refresh(); }}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Live Games</h2>
        <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {!loading && games.length === 0 && (
        <div className={styles.empty}>No games in progress right now.</div>
      )}

      <div className={styles.grid}>
        {games.map(g => (
          <button key={g.id} className={styles.card} onClick={() => handleWatch(g.id)}>
            <FenThumbnail fen={g.current_fen} />
            <div className={styles.cardInfo}>
              <div className={styles.players}>
                <span className={styles.white}>⬜ {g.host_name || 'Player'}</span>
                <span className={styles.vs}>vs</span>
                <span className={styles.black}>⬛ {g.guest_name || 'Player'}</span>
              </div>
              <div className={styles.meta}>
                <span className={styles.tc}>{formatTC(g.time_control)}</span>
                {g.spectator_count > 0 && (
                  <span className={styles.specCount}>👁 {g.spectator_count}</span>
                )}
                <span className={styles.age}>{formatAgo(g.last_move_at || g.created_at)}</span>
              </div>
            </div>
            <div className={styles.watchLabel}>Watch →</div>
          </button>
        ))}
      </div>
    </div>
  );
}
