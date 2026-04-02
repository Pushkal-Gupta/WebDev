import { useState, useEffect, useRef } from 'react';
import styles from './TournamentsPage.module.css';
import useTournamentStore from '../../store/tournamentStore';
import useAuthStore from '../../store/authStore';
import useRatingStore from '../../store/ratingStore';
import TournamentDetail from './TournamentDetail';

const STATUS_LABEL = { upcoming: 'Upcoming', registration: 'Open', active: 'Live', finished: 'Finished' };
const STATUS_CLS   = { upcoming: 'statusUpcoming', registration: 'statusOpen', active: 'statusLive', finished: 'statusDone' };
const CAT_LABEL    = { bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', classical: 'Classical' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTC(tc) {
  if (!tc) return '—';
  if (tc.noTimer) return '∞';
  const min = Math.floor((tc.initialTime || 0) / 60);
  const sec = (tc.initialTime || 0) % 60;
  const base = sec > 0 ? `${min}:${String(sec).padStart(2,'0')}` : `${min}`;
  return tc.increment ? `${base}+${tc.increment}` : base;
}

// ── Create Tournament Modal ────────────────────────────────────────────────

const TC_OPTIONS = [
  { display: '1+0',   initialTime:  60, increment: 0, cat: 'bullet' },
  { display: '2+1',   initialTime: 120, increment: 1, cat: 'bullet' },
  { display: '3+0',   initialTime: 180, increment: 0, cat: 'blitz' },
  { display: '3+2',   initialTime: 180, increment: 2, cat: 'blitz' },
  { display: '5+0',   initialTime: 300, increment: 0, cat: 'blitz' },
  { display: '10+0',  initialTime: 600, increment: 0, cat: 'rapid' },
  { display: '15+10', initialTime: 900, increment: 10, cat: 'rapid' },
  { display: '30+0',  initialTime: 1800, increment: 0, cat: 'classical' },
];

function CreateModal({ onClose, onCreated }) {
  const { createTournament } = useTournamentStore();
  const [name, setName]           = useState('');
  const [format, setFormat]       = useState('swiss');
  const [tcIdx, setTcIdx]         = useState(2); // 3+0 default
  const [rounds, setRounds]       = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [startsAt, setStartsAt]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const tc = TC_OPTIONS[tcIdx];

  const handleSubmit = async () => {
    if (!name.trim()) { setErr('Tournament name is required.'); return; }
    if (!startsAt)    { setErr('Start date/time is required.'); return; }
    setSaving(true); setErr('');
    try {
      const t = await createTournament({
        name: name.trim(),
        format,
        category: tc.cat,
        timeControl: { initialTime: tc.initialTime, increment: tc.increment },
        numRounds: rounds,
        maxPlayers,
        startsAt: new Date(startsAt).toISOString(),
      });
      onCreated(t);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create Tournament</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Saturday Blitz Open"
            maxLength={60}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Format</label>
            <div className={styles.segmented}>
              {['swiss','arena'].map(f => (
                <button key={f} className={`${styles.seg} ${format === f ? styles.segActive : ''}`}
                  onClick={() => setFormat(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Time Control</label>
            <select className={styles.select} value={tcIdx} onChange={e => setTcIdx(+e.target.value)}>
              {TC_OPTIONS.map((t, i) => (
                <option key={t.display} value={i}>{t.display} ({t.cat})</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.fieldRow}>
          {format === 'swiss' && (
            <div className={styles.field}>
              <label className={styles.label}>Rounds</label>
              <input type="number" className={styles.input} min={3} max={12}
                value={rounds} onChange={e => setRounds(+e.target.value)} />
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Max players</label>
            <input type="number" className={styles.input} min={4} max={128}
              value={maxPlayers} onChange={e => setMaxPlayers(+e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Start date/time</label>
          <input type="datetime-local" className={styles.input}
            value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        </div>

        {err && <div className={styles.fieldErr}>{err}</div>}

        <button className={styles.createBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating…' : 'Create Tournament'}
        </button>
      </div>
    </div>
  );
}

// ── Main TournamentsPage ───────────────────────────────────────────────────

export default function TournamentsPage() {
  const { tournaments, loading, error, loadTournaments } = useTournamentStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate]       = useState(false);
  const [viewingId, setViewingId]         = useState(null);

  useEffect(() => { loadTournaments(); }, []); // eslint-disable-line

  if (viewingId) {
    return <TournamentDetail tournamentId={viewingId} onBack={() => { setViewingId(null); loadTournaments(); }} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Tournaments</h2>
          <p className={styles.sub}>Swiss and Arena events</p>
        </div>
        {user && (
          <button className={styles.newBtn} onClick={() => setShowCreate(true)}>
            + New Tournament
          </button>
        )}
      </div>

      {loading && <div className={styles.loading}>Loading…</div>}
      {error   && <div className={styles.empty}>Error: {error}</div>}

      {!loading && !error && tournaments.length === 0 && (
        <div className={styles.empty}>
          No tournaments scheduled yet.<br />
          {user ? 'Create one above!' : 'Sign in to create a tournament.'}
        </div>
      )}

      <div className={styles.grid}>
        {tournaments.map(t => (
          <button key={t.id} className={styles.card} onClick={() => setViewingId(t.id)}>
            <div className={styles.cardTop}>
              <span className={`${styles.status} ${styles[STATUS_CLS[t.status]]}`}>
                {STATUS_LABEL[t.status]}
              </span>
              <span className={styles.format}>{t.format}</span>
            </div>
            <div className={styles.cardName}>{t.name}</div>
            <div className={styles.cardMeta}>
              <span>{CAT_LABEL[t.category] || t.category}</span>
              <span className={styles.dot}>·</span>
              <span>{formatTC(t.time_control)}</span>
              {t.format === 'swiss' && (
                <><span className={styles.dot}>·</span><span>{t.num_rounds}R</span></>
              )}
            </div>
            <div className={styles.cardDate}>{formatDate(t.starts_at)}</div>
          </button>
        ))}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => { setShowCreate(false); setViewingId(t.id); }}
        />
      )}
    </div>
  );
}
