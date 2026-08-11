import { useState, useEffect, useCallback } from 'react';
import { Trophy, UserPlus, UserCheck, Heart, MessageCircle, TrendingUp, Loader2, Users, Hash } from 'lucide-react';
import { getLeaderboard, getSuggestedPeople, getTopPosts, getFollowSet, setFollow, getTrendingTags } from '../../lib/social';

const openTag = (tag) => {
  window.dispatchEvent(new CustomEvent('pg:connect-tab', { detail: 'feed' }));
  window.dispatchEvent(new CustomEvent('pg:open-tag', { detail: tag }));
};
import './ExploreTab.css';

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function Avatar({ name, url, size = 40 }) {
  if (url) return <img className="pgc-av" src={url} alt="" style={{ width: size, height: size }} />;
  return <span className="pgc-av pgc-av-ph" style={{ width: size, height: size, fontSize: size * 0.4 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

const openProfile = (id, name) => id && window.dispatchEvent(new CustomEvent('pg:view-profile', { detail: { id, name } }));

export default function ExploreTab({ user }) {
  const [leaders, setLeaders] = useState(null);
  const [people, setPeople] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [following, setFollowing] = useState(() => new Set());

  const load = useCallback(async () => {
    const [lb, sp, tp, tt, fs] = await Promise.all([
      getLeaderboard().catch(() => []),
      getSuggestedPeople(user.id).catch(() => []),
      getTopPosts(user.id).catch(() => []),
      getTrendingTags().catch(() => []),
      getFollowSet(user.id).catch(() => new Set()),
    ]);
    setPeople(sp || []);
    setPosts(tp || []);
    setTags(tt || []);
    setFollowing(fs instanceof Set ? fs : new Set());
    setLeaders(lb || []);
  }, [user.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const toggleFollow = useCallback(async (targetId) => {
    if (!targetId) return;
    const wasFollowing = following.has(targetId);
    setFollowing((prev) => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(targetId); else next.add(targetId);
      return next;
    });
    try {
      await setFollow(user.id, targetId, !wasFollowing);
    } catch {
      setFollowing((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(targetId); else next.delete(targetId);
        return next;
      });
    }
  }, [following, user.id]);

  if (leaders === null) {
    return (
      <div className="pgc-explore-loading">
        <Loader2 className="pgc-spin" size={30} />
      </div>
    );
  }

  return (
    <div className="pgc-explore">
      <header className="pgc-explore-head">
        <h1>Explore</h1>
        <p className="pgc-explore-sub">Discover top coders, people to follow, and what the community is posting.</p>
      </header>

      {tags.length > 0 ? (
        <section className="pgc-explore-section">
          <div className="pgc-group-label"><Hash size={14} /> Trending tags</div>
          <div className="pgc-explore-tags">
            {tags.map((t) => (
              <button key={t.tag} className="pgc-explore-tag" onClick={() => openTag(t.tag)}>
                <Hash size={13} />{t.tag}
                <span className="pgc-explore-tagcount">{t.count}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pgc-explore-section">
        <div className="pgc-group-label"><Trophy size={14} /> Leaderboard</div>
        {leaders.length === 0 ? (
          <p className="pgc-explore-empty">No ranked coders yet.</p>
        ) : (
          <ol className="pgc-explore-lb">
            {leaders.map((u, i) => (
              <li key={u.user_id} className="pgc-explore-lbrow">
                <span className={`pgc-explore-rank${i < 3 ? ' pgc-explore-rank-top' : ''}`}>#{i + 1}</span>
                <button className="pgc-explore-lbwho" onClick={() => openProfile(u.user_id, u.display_name)}>
                  <Avatar name={u.display_name} url={u.avatar_url} size={38} />
                  <span className="pgc-explore-lbid">
                    <span className="pgc-explore-name">{u.display_name || 'Coder'}</span>
                    {u.username && <span className="pgc-explore-uname">@{u.username}</span>}
                  </span>
                </button>
                <span className="pgc-explore-solved">{u.solved ?? u.total_solved ?? 0} solved</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="pgc-explore-section">
        <div className="pgc-group-label"><UserPlus size={14} /> People to follow</div>
        {people.length === 0 ? (
          <p className="pgc-explore-empty"><Users size={14} /> No suggestions right now.</p>
        ) : (
          <div className="pgc-explore-people">
            {people.map((p) => {
              const isFollowing = following.has(p.user_id);
              return (
                <div key={p.user_id} className="pgc-explore-pcard">
                  <button className="pgc-explore-pbody" onClick={() => openProfile(p.user_id, p.display_name)}>
                    <Avatar name={p.display_name} url={p.avatar_url} size={52} />
                    <span className="pgc-explore-name">{p.display_name || 'Coder'}</span>
                    {p.username && <span className="pgc-explore-uname">@{p.username}</span>}
                    <span className="pgc-explore-pstat">{p.total_solved ?? 0} solved</span>
                  </button>
                  <button
                    className={`pgc-explore-follow${isFollowing ? ' pgc-explore-following' : ''}`}
                    onClick={() => toggleFollow(p.user_id)}
                  >
                    {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="pgc-explore-section">
        <div className="pgc-group-label"><TrendingUp size={14} /> Trending posts</div>
        {posts.length === 0 ? (
          <p className="pgc-explore-empty">No trending posts yet.</p>
        ) : (
          <div className="pgc-explore-posts">
            {posts.map((p) => (
              <article key={p.id} className="pgc-explore-post">
                <button className="pgc-explore-posthead" onClick={() => openProfile(p.author_id, p.authorName)}>
                  <Avatar name={p.authorName} url={p.authorAvatar} size={38} />
                  <span className="pgc-explore-postmeta">
                    <span className="pgc-explore-name">{p.authorName || 'Coder'}</span>
                    <span className="pgc-explore-postsub">
                      {p.authorUsername && <span className="pgc-explore-uname">@{p.authorUsername}</span>}
                      <span className="pgc-explore-dot">·</span>
                      <span className="pgc-explore-time">{timeAgo(p.created_at)}</span>
                    </span>
                  </span>
                </button>
                <p className="pgc-explore-postbody">{p.body}</p>
                <div className="pgc-explore-postfoot">
                  <span className="pgc-explore-stat"><Heart size={14} /> {p.like_count ?? 0}</span>
                  <span className="pgc-explore-stat"><MessageCircle size={14} /> {p.reply_count ?? 0}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
