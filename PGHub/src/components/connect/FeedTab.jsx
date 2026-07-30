import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Trash2, UserPlus, UserCheck, Send, Rss, Loader2 } from 'lucide-react';
import { getFeed, createPost, deletePost, setLike, getFollowSet, setFollow, getReplies } from '../../lib/social';

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

export default function FeedTab({ user, myName }) {
  const [scope, setScope] = useState('all');
  const [posts, setPosts] = useState(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [following, setFollowing] = useState(new Set());
  const [openReplies, setOpenReplies] = useState(null); // postId whose replies are expanded
  const [replies, setReplies] = useState({});           // postId -> reply[]
  const [replyDraft, setReplyDraft] = useState('');

  const load = useCallback(() => {
    getFeed(user.id, { scope }).then(setPosts).catch(() => setPosts([]));
    getFollowSet(user.id).then(setFollowing).catch(() => {});
  }, [user.id, scope]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosts(null); // show the loading state while the new scope loads
    load();
  }, [load]);

  const submit = async (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const created = await createPost(user.id, body);
      setDraft('');
      if (created) setPosts((p) => [created, ...(p || [])]);
    } catch { /* ignore */ }
    setPosting(false);
  };

  const toggleLike = async (post) => {
    const next = !post.likedByMe;
    setPosts((list) => list.map((p) => p.id === post.id ? { ...p, likedByMe: next, like_count: p.like_count + (next ? 1 : -1) } : p));
    try { await setLike(post.id, user.id, next); } catch { load(); }
  };
  const remove = async (post) => {
    setPosts((list) => list.filter((p) => p.id !== post.id));
    try { await deletePost(post.id); } catch { load(); }
  };
  const toggleReplies = (post) => {
    if (openReplies === post.id) { setOpenReplies(null); return; }
    setOpenReplies(post.id); setReplyDraft('');
    if (!replies[post.id]) getReplies(post.id, user.id).then((r) => setReplies((m) => ({ ...m, [post.id]: r }))).catch(() => {});
  };
  const submitReply = async (post) => {
    const body = replyDraft.trim();
    if (!body) return;
    setReplyDraft('');
    try {
      const created = await createPost(user.id, body, post.id);
      if (created) {
        setReplies((m) => ({ ...m, [post.id]: [...(m[post.id] || []), created] }));
        setPosts((list) => list.map((p) => p.id === post.id ? { ...p, reply_count: (p.reply_count || 0) + 1 } : p));
      }
    } catch { /* ignore */ }
  };
  const toggleFollow = async (authorId) => {
    const isF = following.has(authorId);
    setFollowing((s) => { const n = new Set(s); isF ? n.delete(authorId) : n.add(authorId); return n; });
    try { await setFollow(user.id, authorId, !isF); } catch { getFollowSet(user.id).then(setFollowing); }
  };

  return (
    <div className="pgc-feed">
      <form className="pgc-composer" onSubmit={submit}>
        <Avatar name={myName} size={40} />
        <div className="pgc-composer-main">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share an update or ask a question…" maxLength={2000} rows={2} />
          <div className="pgc-composer-foot">
            <span className="pgc-composer-count">{draft.length}/2000</span>
            <button type="submit" disabled={!draft.trim() || posting}>{posting ? <Loader2 size={14} className="pgc-spin" /> : <Send size={14} />} Post</button>
          </div>
        </div>
      </form>

      <div className="pgc-feed-scope">
        <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>Everyone</button>
        <button className={scope === 'following' ? 'on' : ''} onClick={() => setScope('following')}>Following</button>
      </div>

      {posts === null ? (
        <div className="pgc-feed-loading"><Loader2 size={22} className="pgc-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="pgc-soon"><Rss size={28} /><h3>{scope === 'following' ? 'Follow people to see their posts' : 'No posts yet'}</h3><p>{scope === 'following' ? 'Find coders in the People tab and follow them.' : 'Be the first to share something with the community.'}</p></div>
      ) : (
        <div className="pgc-posts">
          {posts.map((p) => (
            <article key={p.id} className="pgc-post">
              <Avatar name={p.authorName} url={p.authorAvatar} size={42} />
              <div className="pgc-post-main">
                <div className="pgc-post-head">
                  <span className="pgc-post-name">{p.authorName}</span>
                  {p.authorUsername ? <span className="pgc-post-handle">@{p.authorUsername}</span> : null}
                  <span className="pgc-post-dot">·</span>
                  <span className="pgc-post-time">{timeAgo(p.created_at)}</span>
                  {p.author_id !== user.id ? (
                    <button className={`pgc-post-follow ${following.has(p.author_id) ? 'on' : ''}`} onClick={() => toggleFollow(p.author_id)}>
                      {following.has(p.author_id) ? <><UserCheck size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
                    </button>
                  ) : null}
                </div>
                <p className="pgc-post-body">{p.body}</p>
                <div className="pgc-post-actions">
                  <button className={`pgc-post-act ${p.likedByMe ? 'liked' : ''}`} onClick={() => toggleLike(p)}>
                    <Heart size={15} fill={p.likedByMe ? 'currentColor' : 'none'} /> {p.like_count || 0}
                  </button>
                  <button className={`pgc-post-act ${openReplies === p.id ? 'on' : ''}`} onClick={() => toggleReplies(p)}><MessageCircle size={15} /> {p.reply_count || 0}</button>
                  {p.author_id === user.id ? <button className="pgc-post-act del" onClick={() => remove(p)}><Trash2 size={14} /></button> : null}
                </div>
                {openReplies === p.id ? (
                  <div className="pgc-replies">
                    {(replies[p.id] || []).map((r) => (
                      <div key={r.id} className="pgc-reply">
                        <Avatar name={r.authorName} url={r.authorAvatar} size={28} />
                        <div><span className="pgc-reply-name">{r.authorName}</span> <span className="pgc-reply-body">{r.body}</span></div>
                      </div>
                    ))}
                    <form className="pgc-reply-compose" onSubmit={(e) => { e.preventDefault(); submitReply(p); }}>
                      <input value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="Write a reply…" maxLength={2000} />
                      <button type="submit" disabled={!replyDraft.trim()}><Send size={13} /></button>
                    </form>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
