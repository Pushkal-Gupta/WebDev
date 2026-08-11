import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { Heart, MessageCircle, Trash2, UserPlus, UserCheck, Send, Rss, Loader2, Bookmark, Hash, ArrowLeft, Puzzle, X, Search } from 'lucide-react';
import {
  getFeed, createPost, deletePost, setLike, getFollowSet, setFollow, getReplies,
  getBookmarkSet, setBookmark, getBookmarkedPosts, getPostsByTag, searchProblems,
} from '../../lib/social';

const DIFF_CLASS = { Easy: 'easy', Medium: 'medium', Hard: 'hard' };

// Rich card for a problem shared into the feed. Links to the problem page.
function AttachedProblem({ att }) {
  if (!att || att.type !== 'problem') return null;
  const to = att.topic ? `/category/${att.topic}/${att.id}` : `/solution/${att.id}`;
  return (
    <Link to={to} className="pgc-attach-card" title={`Open ${att.name}`}>
      <span className="pgc-attach-ico"><Puzzle size={16} /></span>
      <span className="pgc-attach-main">
        <span className="pgc-attach-name">{att.name}</span>
        <span className="pgc-attach-sub">Practice problem</span>
      </span>
      {att.difficulty ? <span className={`pgc-attach-diff ${DIFF_CLASS[att.difficulty] || 'medium'}`}>{att.difficulty}</span> : null}
    </Link>
  );
}

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

const viewProfile = (id, name) => { if (id) window.dispatchEvent(new CustomEvent('pg:view-profile', { detail: { id, name } })); };

export default function FeedTab({ user, myName }) {
  const [scope, setScope] = useState('all');       // all | following | saved
  const [activeTag, setActiveTag] = useState(null); // hashtag filter (overrides scope)
  const [posts, setPosts] = useState(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [following, setFollowing] = useState(new Set());
  const [bookmarks, setBookmarks] = useState(new Set());
  const [openReplies, setOpenReplies] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyDraft, setReplyDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachQ, setAttachQ] = useState('');
  const [attachResults, setAttachResults] = useState(null);
  const [attachment, setAttachment] = useState(null); // { type:'problem', id, name, difficulty, topic }
  const attachTimer = useRef(null);

  const load = useCallback(() => {
    const fetcher = activeTag ? getPostsByTag(activeTag, user.id)
      : scope === 'saved' ? getBookmarkedPosts(user.id, user.id)
      : getFeed(user.id, { scope });
    fetcher.then(setPosts).catch(() => setPosts([]));
    getFollowSet(user.id).then(setFollowing).catch(() => {});
    getBookmarkSet(user.id).then(setBookmarks).catch(() => {});
  }, [user.id, scope, activeTag]);
  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosts(null);
    const fetcher = activeTag ? getPostsByTag(activeTag, user.id)
      : scope === 'saved' ? getBookmarkedPosts(user.id, user.id)
      : getFeed(user.id, { scope });
    fetcher.then((r) => { if (alive) setPosts(r); }).catch(() => { if (alive) setPosts([]); });
    getFollowSet(user.id).then((s) => { if (alive) setFollowing(s); }).catch(() => {});
    getBookmarkSet(user.id).then((s) => { if (alive) setBookmarks(s); }).catch(() => {});
    return () => { alive = false; };
  }, [user.id, scope, activeTag]);

  const openTag = (tag) => { setActiveTag(tag); setOpenReplies(null); };
  const clearTag = () => setActiveTag(null);

  // Explore's trending-tag chips deep-link into the feed via this event.
  useEffect(() => {
    const onTag = (e) => { if (e.detail) { setActiveTag(String(e.detail).replace(/^#/, '')); setOpenReplies(null); } };
    window.addEventListener('pg:open-tag', onTag);
    return () => window.removeEventListener('pg:open-tag', onTag);
  }, []);

  const renderBody = (text) => String(text).split(/(#[a-zA-Z0-9_]+)/g).map((part, i) => (
    /^#[a-zA-Z0-9_]+$/.test(part)
      ? <button key={i} type="button" className="pgc-tag-link" onClick={() => openTag(part.slice(1))}>{part}</button>
      : part
  ));

  const onAttachQ = (val) => {
    setAttachQ(val);
    if (attachTimer.current) clearTimeout(attachTimer.current);
    if (val.trim().length < 2) { setAttachResults(null); return; }
    attachTimer.current = setTimeout(() => {
      searchProblems(val).then(setAttachResults).catch(() => setAttachResults([]));
    }, 220);
  };
  const pickProblem = (p) => {
    setAttachment({ type: 'problem', id: p.id, name: p.name, difficulty: p.difficulty, topic: p.topic_id });
    setAttachOpen(false); setAttachQ(''); setAttachResults(null);
  };

  const submit = async (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if ((!body && !attachment) || posting) return;
    setPosting(true);
    try {
      const created = await createPost(user.id, body, null, attachment);
      setDraft(''); setAttachment(null); setAttachOpen(false); setAttachQ(''); setAttachResults(null);
      if (created && !activeTag && scope !== 'saved') setPosts((p) => [created, ...(p || [])]);
    } catch { /* ignore */ }
    setPosting(false);
  };

  const toggleLike = async (post) => {
    const next = !post.likedByMe;
    setPosts((list) => list.map((p) => p.id === post.id ? { ...p, likedByMe: next, like_count: (p.like_count || 0) + (next ? 1 : -1) } : p));
    try { await setLike(post.id, user.id, next); } catch { load(); }
  };
  const toggleBookmark = async (post) => {
    const on = !bookmarks.has(post.id);
    setBookmarks((s) => { const n = new Set(s); if (on) n.add(post.id); else n.delete(post.id); return n; });
    if (scope === 'saved' && !on) setPosts((list) => (list || []).filter((p) => p.id !== post.id));
    try { await setBookmark(user.id, post.id, on); } catch { load(); }
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
    setFollowing((s) => { const n = new Set(s); if (isF) n.delete(authorId); else n.add(authorId); return n; });
    try { await setFollow(user.id, authorId, !isF); } catch { getFollowSet(user.id).then(setFollowing); }
  };

  const emptyCopy = activeTag
    ? { h: `No posts tagged #${activeTag}`, p: 'Be the first to post with this tag.' }
    : scope === 'saved' ? { h: 'No saved posts', p: 'Tap the bookmark on any post to save it here.' }
    : scope === 'following' ? { h: 'Follow people to see their posts', p: 'Find coders in the People tab and follow them.' }
    : { h: 'No posts yet', p: 'Be the first to share something with the community.' };

  return (
    <div className="pgc-feed">
      <form className="pgc-composer" onSubmit={submit}>
        <Avatar name={myName} size={40} />
        <div className="pgc-composer-main">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share an update, ask a question, or add #tags…" aria-label="Share a post" maxLength={2000} rows={2} />
          {attachment ? (
            <div className="pgc-attach-preview">
              <Puzzle size={14} />
              <span className="pgc-attach-preview-name">{attachment.name}</span>
              {attachment.difficulty ? <span className={`pgc-attach-diff ${DIFF_CLASS[attachment.difficulty] || 'medium'}`}>{attachment.difficulty}</span> : null}
              <button type="button" className="pgc-attach-x" onClick={() => setAttachment(null)} aria-label="Remove attached problem"><X size={13} /></button>
            </div>
          ) : null}
          {attachOpen && !attachment ? (
            <div className="pgc-attach-picker">
              <div className="pgc-attach-search">
                <Search size={14} />
                <input autoFocus value={attachQ} onChange={(e) => onAttachQ(e.target.value)} placeholder="Search a problem to attach…" aria-label="Search a problem" />
                <button type="button" onClick={() => { setAttachOpen(false); setAttachQ(''); setAttachResults(null); }} aria-label="Close problem search"><X size={14} /></button>
              </div>
              {attachResults === null ? (
                attachQ.trim().length >= 2 ? <div className="pgc-attach-hint"><Loader2 size={14} className="pgc-spin" /></div> : <div className="pgc-attach-hint">Type at least 2 characters.</div>
              ) : attachResults.length === 0 ? (
                <div className="pgc-attach-hint">No problems match “{attachQ.trim()}”.</div>
              ) : (
                <ul className="pgc-attach-results">
                  {attachResults.map((p) => (
                    <li key={p.id}><button type="button" onClick={() => pickProblem(p)}>
                      <Puzzle size={14} />
                      <span className="pgc-attach-rname">{p.name}</span>
                      {p.difficulty ? <span className={`pgc-attach-diff ${DIFF_CLASS[p.difficulty] || 'medium'}`}>{p.difficulty}</span> : null}
                    </button></li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          <div className="pgc-composer-foot">
            <button type="button" className={`pgc-composer-attach ${attachOpen || attachment ? 'on' : ''}`} onClick={() => setAttachOpen((v) => !v)} title="Attach a problem">
              <Puzzle size={14} /> Problem
            </button>
            <span className="pgc-composer-count">{draft.length}/2000</span>
            <button type="submit" disabled={(!draft.trim() && !attachment) || posting}>{posting ? <Loader2 size={14} className="pgc-spin" /> : <Send size={14} />} Post</button>
          </div>
        </div>
      </form>

      {activeTag ? (
        <div className="pgc-feed-tag-head">
          <span className="pgc-feed-tag-name"><Hash size={15} />{activeTag}</span>
          <button className="pgc-feed-tag-back" onClick={clearTag}><ArrowLeft size={14} /> Back to feed</button>
        </div>
      ) : (
        <div className="pgc-feed-scope">
          <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>Everyone</button>
          <button className={scope === 'following' ? 'on' : ''} onClick={() => setScope('following')}>Following</button>
          <button className={scope === 'saved' ? 'on' : ''} onClick={() => setScope('saved')}><Bookmark size={13} /> Saved</button>
        </div>
      )}

      {posts === null ? (
        <div className="pgc-feed-loading"><Loader2 size={22} className="pgc-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="pgc-soon"><Rss size={28} /><h3>{emptyCopy.h}</h3><p>{emptyCopy.p}</p></div>
      ) : (
        <div className="pgc-posts">
          {posts.map((p) => (
            <article key={p.id} className="pgc-post">
              <button className="pgc-post-av" onClick={() => viewProfile(p.author_id, p.authorName)}><Avatar name={p.authorName} url={p.authorAvatar} size={42} /></button>
              <div className="pgc-post-main">
                <div className="pgc-post-head">
                  <button className="pgc-post-name link" onClick={() => viewProfile(p.author_id, p.authorName)}>{p.authorName}</button>
                  {p.authorUsername ? <span className="pgc-post-handle">@{p.authorUsername}</span> : null}
                  <span className="pgc-post-dot">·</span>
                  <span className="pgc-post-time">{timeAgo(p.created_at)}</span>
                  {p.author_id !== user.id ? (
                    <button className={`pgc-post-follow ${following.has(p.author_id) ? 'on' : ''}`} onClick={() => toggleFollow(p.author_id)}>
                      {following.has(p.author_id) ? <><UserCheck size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
                    </button>
                  ) : null}
                </div>
                {p.body ? <p className="pgc-post-body">{renderBody(p.body)}</p> : null}
                {p.attachment ? <AttachedProblem att={p.attachment} /> : null}
                <div className="pgc-post-actions">
                  <button className={`pgc-post-act ${p.likedByMe ? 'liked' : ''}`} onClick={() => toggleLike(p)}>
                    <Heart size={15} fill={p.likedByMe ? 'currentColor' : 'none'} /> {p.like_count || 0}
                  </button>
                  <button className={`pgc-post-act ${openReplies === p.id ? 'on' : ''}`} onClick={() => toggleReplies(p)}><MessageCircle size={15} /> {p.reply_count || 0}</button>
                  <button className={`pgc-post-act bm ${bookmarks.has(p.id) ? 'on' : ''}`} title={bookmarks.has(p.id) ? 'Saved' : 'Save'} onClick={() => toggleBookmark(p)}>
                    <Bookmark size={15} fill={bookmarks.has(p.id) ? 'currentColor' : 'none'} />
                  </button>
                  {p.author_id === user.id ? <button className="pgc-post-act del" onClick={() => remove(p)} aria-label="Delete post"><Trash2 size={14} /></button> : null}
                </div>
                {openReplies === p.id ? (
                  <div className="pgc-replies">
                    {(replies[p.id] || []).map((r) => (
                      <div key={r.id} className="pgc-reply">
                        <Avatar name={r.authorName} url={r.authorAvatar} size={28} />
                        <div><span className="pgc-reply-name">{r.authorName}</span> <span className="pgc-reply-body">{renderBody(r.body)}</span></div>
                      </div>
                    ))}
                    <form className="pgc-reply-compose" onSubmit={(e) => { e.preventDefault(); submitReply(p); }}>
                      <input value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="Write a reply…" aria-label="Write a reply" maxLength={2000} />
                      <button type="submit" disabled={!replyDraft.trim()} aria-label="Send reply"><Send size={13} /></button>
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
