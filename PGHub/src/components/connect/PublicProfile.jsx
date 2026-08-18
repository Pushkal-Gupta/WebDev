import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trophy, Users, UserPlus, UserCheck, MessageSquare, Loader2, FileText, ExternalLink, Heart, Share2, Check } from 'lucide-react';
import { getProfileById, getFollowCounts, getFollowSet, setFollow, getUserPosts } from '../../lib/social';
import { sendFriendRequest, getFriends, getOutgoingRequests } from '../../lib/friends';
import { platformById } from '../../lib/connections';

const BG_PRESETS = {
  aurora: 'linear-gradient(135deg, color-mix(in srgb, var(--hue-violet) 70%, transparent), color-mix(in srgb, var(--hue-sky) 70%, transparent))',
  ocean:  'linear-gradient(135deg, color-mix(in srgb, var(--hue-sky) 75%, transparent), color-mix(in srgb, var(--hue-mint) 70%, transparent))',
  sunset: 'linear-gradient(135deg, color-mix(in srgb, var(--hard) 70%, transparent), color-mix(in srgb, var(--warning) 70%, transparent))',
  mint:   'linear-gradient(135deg, color-mix(in srgb, var(--hue-mint) 75%, transparent), color-mix(in srgb, var(--easy) 65%, transparent))',
  violet: 'linear-gradient(135deg, color-mix(in srgb, var(--hue-violet) 80%, transparent), color-mix(in srgb, var(--hue-pink) 65%, transparent))',
  accent: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--surface)))',
};

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now'; const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`; const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : `${Math.floor(d / 7)}w`;
}

export default function PublicProfile({ user, userId, name, onBack, onMessage }) {
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState(false);
  const [friendState, setFriendState] = useState('none'); // none | sent | friends
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const share = () => {
    const { origin, pathname, search } = window.location;
    const link = `${origin}${pathname}${search}#/connect/u/${userId}`;
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {});
  };

  const load = useCallback(() => {
    Promise.all([
      getProfileById(userId),
      getFollowCounts(userId),
      getUserPosts(userId, user.id),
      getFollowSet(user.id),
      getFriends(user.id),
      getOutgoingRequests(user.id),
    ]).then(([p, c, ps, fset, friends, outgoing]) => {
      setProfile(p); setCounts(c); setPosts(ps || []); setFollowing(fset.has(userId));
      if ((friends || []).some((f) => f.id === userId)) setFriendState('friends');
      else if ((outgoing || []).includes(userId)) setFriendState('sent');
      else setFriendState('none');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId, user.id]);
  useEffect(() => { load(); }, [load]);

  const addFriend = async () => {
    setFriendState('sent');
    try { await sendFriendRequest(user.id, userId); } catch { setFriendState('none'); }
  };

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (next ? 1 : -1)) }));
    try { await setFollow(user.id, userId, next); } catch { setFollowing(!next); }
  };

  if (loading) return <div className="pgc-feed-loading"><Loader2 size={22} className="pgc-spin" /></div>;

  const prof = profile || {};
  const isMe = userId === user.id;
  const dName = prof.display_name || name || 'Coder';
  const bg = BG_PRESETS[prof.background_preset] || BG_PRESETS.aurora;

  return (
    <div className="pgc-profile">
      <div className="pgc-pubhead"><button className="pgc-back-btn" onClick={onBack}><ArrowLeft size={15} /> Back</button></div>
      <div className="pgc-banner" style={{ background: bg }}>
        <span className="pgc-banner-av">{dName.slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="pgc-profile-body">
        <div className="pgc-pub-top">
          <div className="pgc-pub-id">
            <h2 className="pgc-profile-name">{dName}</h2>
            {prof.username ? <span className="pgc-profile-handle">@{prof.username}</span> : null}
          </div>
          <div className="pgc-pub-actions">
            {!isMe ? (
              <>
                <button className={`pgc-follow-btn ${following ? 'on' : ''}`} onClick={toggleFollow}>
                  {following ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                </button>
                {friendState === 'friends'
                  ? <button className="pgc-follow-btn on" disabled><UserCheck size={14} /> Friends</button>
                  : friendState === 'sent'
                  ? <button className="pgc-follow-btn" disabled><Check size={14} /> Requested</button>
                  : <button className="pgc-follow-btn" onClick={addFriend}><Users size={14} /> Add friend</button>}
                <button className="pgc-msg-btn" onClick={() => onMessage?.({ id: userId, name: dName })}><MessageSquare size={14} /> Message</button>
              </>
            ) : null}
            <button className="pgc-msg-btn" onClick={share}>{copied ? <><Check size={14} /> Copied</> : <><Share2 size={14} /> Share</>}</button>
          </div>
        </div>

        {prof.bio ? <p className="pgc-profile-bio">{prof.bio}</p> : null}

        <div className="pgc-profile-stats">
          {(() => {
            const across = (prof.linked_accounts || []).reduce((s, a) => s + (Number(a.stats?.solved) || 0), 0);
            const solved = Math.max(prof.total_solved || 0, across);
            return <span><b>{solved.toLocaleString()}</b> <Trophy size={12} /> solved{across > 0 ? <em className="pgc-stat-sub">across platforms</em> : null}</span>;
          })()}
          <span><b>{counts.followers}</b> <Users size={12} /> followers</span>
          <span><b>{counts.following}</b> following</span>
        </div>

        {prof.linked_accounts?.length || prof.resume_url ? (
          <div className="pgc-profile-links">
            {(prof.linked_accounts || []).map((a) => {
              const p = platformById(a.id); if (!p) return null;
              return (
                <a key={a.id} className="pgc-plink" href={p.url(a.handle)} target="_blank" rel="noreferrer" style={{ '--pc': `var(${p.hue})` }}>
                  {p.name}{a.stats?.solved != null ? <b>{a.stats.solved}</b> : <ExternalLink size={11} />}
                </a>
              );
            })}
            {prof.resume_url ? (
              <a className="pgc-plink" href={prof.resume_url} target="_blank" rel="noreferrer" style={{ '--pc': 'var(--accent)' }}><FileText size={12} /> Resume</a>
            ) : null}
          </div>
        ) : null}

        <div className="pgc-profile-posts">
          <div className="pgc-group-label">Posts</div>
          {posts.length === 0 ? <p className="pgc-empty">No posts yet.</p> : posts.map((p) => (
            <article key={p.id} className="pgc-post compact">
              <div className="pgc-post-main">
                <div className="pgc-post-head"><span className="pgc-post-time">{timeAgo(p.created_at)}</span></div>
                <p className="pgc-post-body">{p.body}</p>
                <div className="pgc-post-actions"><span className="pgc-post-act"><Heart size={14} /> {p.like_count || 0}</span></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
