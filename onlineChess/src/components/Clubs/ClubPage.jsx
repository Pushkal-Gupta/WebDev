import { useState, useEffect } from 'react';
import styles from './ClubsPage.module.css';
import { supabase } from '../../utils/supabase';
import useAuthStore from '../../store/authStore';

export default function ClubPage({ clubId, onBack }) {
  const { user, username } = useAuthStore();
  const [club, setClub]         = useState(null);
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [err, setErr]           = useState('');

  const load = async () => {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('clubs').select('*').eq('id', clubId).single(),
      supabase.from('club_members').select('*').eq('club_id', clubId).order('joined_at'),
    ]);
    setClub(c);
    setMembers(m || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  if (loading || !club) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={onBack}>← Clubs</button>
        <div className={styles.empty}>Loading…</div>
      </div>
    );
  }

  const isMember  = members.some(m => m.user_id === user?.id);
  const isOwner   = club.owner_id === user?.id;

  const handleJoin = async () => {
    if (!user) return;
    setActing(true); setErr('');
    const { error } = await supabase.from('club_members').insert({
      club_id: clubId, user_id: user.id,
      username: username || user.email, role: 'member',
    });
    if (error) { setErr(error.message); } else { await load(); }
    setActing(false);
  };

  const handleLeave = async () => {
    setActing(true); setErr('');
    const { error } = await supabase.from('club_members')
      .delete().eq('club_id', clubId).eq('user_id', user.id);
    if (error) { setErr(error.message); } else { await load(); }
    setActing(false);
  };

  const handleKick = async (memberId) => {
    if (!isOwner || memberId === user.id) return;
    await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', memberId);
    await load();
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>← Clubs</button>

      {/* Club header */}
      <div className={styles.clubHeader}>
        <div className={styles.clubAvatar}>{club.name[0].toUpperCase()}</div>
        <div className={styles.clubHeaderInfo}>
          <h2 className={styles.title}>{club.name}</h2>
          {club.description && <p className={styles.clubDesc}>{club.description}</p>}
          <div className={styles.clubMeta}>
            <span>👥 {club.member_count} member{club.member_count !== 1 ? 's' : ''}</span>
            {!club.is_public && <span className={styles.privateBadge}>Private</span>}
            {isOwner && <span className={styles.ownerBadge}>You own this club</span>}
          </div>
        </div>
        <div className={styles.clubActions}>
          {err && <span className={styles.fieldErr}>{err}</span>}
          {user && !isMember && (
            <button className={styles.joinBtn} onClick={handleJoin} disabled={acting}>
              {acting ? '…' : 'Join Club'}
            </button>
          )}
          {user && isMember && !isOwner && (
            <button className={styles.leaveBtn} onClick={handleLeave} disabled={acting}>
              {acting ? '…' : 'Leave'}
            </button>
          )}
        </div>
      </div>

      {/* Members list */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Members ({members.length})</div>
        <div className={styles.memberList}>
          {members.map(m => (
            <div key={m.user_id} className={styles.memberRow}>
              <div className={styles.memberAvatar}>{(m.username || '?')[0].toUpperCase()}</div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{m.username || 'Unknown'}</span>
                {m.role !== 'member' && (
                  <span className={`${styles.roleTag} ${m.role === 'owner' ? styles.roleOwner : styles.roleAdmin}`}>
                    {m.role}
                  </span>
                )}
                {m.user_id === user?.id && <span className={styles.youBadge}>you</span>}
              </div>
              {isOwner && m.user_id !== user.id && (
                <button className={styles.kickBtn} onClick={() => handleKick(m.user_id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
