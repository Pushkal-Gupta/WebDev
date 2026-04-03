import { useState, useEffect } from 'react';
import styles from './ClubsPage.module.css';
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../store/authStore';
import ClubPage from './ClubPage';

// ── Create Club Modal ────────────────────────────────────────────────────────

function CreateClubModal({ onClose, onCreated }) {
  const { user, username } = useAuthStore();
  const [name, setName]     = useState('');
  const [desc, setDesc]     = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setErr('Club name is required.'); return; }
    setSaving(true); setErr('');
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data, error } = await supabase.from('clubs').insert({
      name: name.trim(), slug, description: desc.trim() || null,
      owner_id: user.id, is_public: isPublic,
    }).select().single();
    if (error) { setErr(error.message); setSaving(false); return; }
    // Auto-join as owner
    await supabase.from('club_members').insert({
      club_id: data.id, user_id: user.id, username: username || user.email, role: 'owner',
    });
    onCreated(data);
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create Club</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Club Name</label>
          <input className={styles.input} value={name}
            onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Warriors" maxLength={40} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
          <textarea className={styles.textarea} value={desc}
            onChange={e => setDesc(e.target.value)} placeholder="What's your club about?" rows={3} maxLength={200} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Visibility</label>
          <div className={styles.segmented}>
            <button className={`${styles.seg} ${isPublic ? styles.segActive : ''}`} onClick={() => setIsPublic(true)}>
              Public
            </button>
            <button className={`${styles.seg} ${!isPublic ? styles.segActive : ''}`} onClick={() => setIsPublic(false)}>
              Private
            </button>
          </div>
        </div>

        {err && <div className={styles.fieldErr}>{err}</div>}

        <button className={styles.createBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating…' : 'Create Club'}
        </button>
      </div>
    </div>
  );
}

// ── Main ClubsPage ───────────────────────────────────────────────────────────

export default function ClubsPage() {
  const { user } = useAuthStore();
  const [clubs, setClubs]         = useState([]);
  const [myClubs, setMyClubs]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [tab, setTab]             = useState('all'); // 'all' | 'mine'

  const loadClubs = async () => {
    setLoading(true);
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from('clubs').select('*').eq('is_public', true).order('member_count', { ascending: false }).limit(50),
      user?.id
        ? supabase.from('club_members').select('club_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);
    setClubs(all || []);
    if (mine?.length) {
      const ids = mine.map(m => m.club_id);
      const { data: mc } = await supabase.from('clubs').select('*').in('id', ids);
      setMyClubs(mc || []);
    } else {
      setMyClubs([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadClubs(); }, [user?.id]); // eslint-disable-line

  if (viewingId) {
    return <ClubPage clubId={viewingId} onBack={() => { setViewingId(null); loadClubs(); }} />;
  }

  const displayed = tab === 'mine' ? myClubs : clubs;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Clubs</h2>
          <p className={styles.sub}>Join or create a chess community</p>
        </div>
        {user && (
          <button className={styles.newBtn} onClick={() => setShowCreate(true)}>+ New Club</button>
        )}
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'all' ? styles.tabActive : ''}`} onClick={() => setTab('all')}>
          All Clubs
        </button>
        {user && (
          <button className={`${styles.tab} ${tab === 'mine' ? styles.tabActive : ''}`} onClick={() => setTab('mine')}>
            My Clubs {myClubs.length > 0 && <span className={styles.tabCount}>{myClubs.length}</span>}
          </button>
        )}
      </div>

      {loading && <div className={styles.empty}>Loading…</div>}

      {!loading && displayed.length === 0 && (
        <div className={styles.empty}>
          {tab === 'mine'
            ? "You haven't joined any clubs yet."
            : 'No public clubs yet. Be the first to create one!'}
        </div>
      )}

      <div className={styles.grid}>
        {displayed.map(c => (
          <button key={c.id} className={styles.card} onClick={() => setViewingId(c.id)}>
            <div className={styles.cardAvatar}>{(c.name || '?')[0].toUpperCase()}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardName}>{c.name}</div>
              {c.description && <div className={styles.cardDesc}>{c.description}</div>}
              <div className={styles.cardMeta}>
                <span>👥 {c.member_count}</span>
                {!c.is_public && <span className={styles.privateBadge}>Private</span>}
              </div>
            </div>
            <span className={styles.cardArrow}>›</span>
          </button>
        ))}
      </div>

      {showCreate && (
        <CreateClubModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setShowCreate(false); setViewingId(c.id); }}
        />
      )}
    </div>
  );
}
