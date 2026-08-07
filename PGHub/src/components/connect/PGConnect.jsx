import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import { MessageSquare, Users, Search, UserPlus, Check, X, Clock3, Send, Rss, User, ArrowLeft, Video as VideoIcon, Phone, Hash, Link2, Compass, Bell } from 'lucide-react';
import {
  searchUsers, getFriends, getIncomingRequests, getOutgoingRequests,
  sendFriendRequest, respondFriendRequest, getThread, sendMessage,
} from '../../lib/friends';
import { callsEnabled } from '../../lib/callSignal';
import { getUnreadCount } from '../../lib/notifications';
import { usePresence } from '../../lib/presence';
import FeedTab from './FeedTab';
import ProfileTab from './ProfileTab';
import ConnectionsTab from './ConnectionsTab';
import PublicProfile from './PublicProfile';
import NotificationsTab from './NotificationsTab';
import ExploreTab from './ExploreTab';
import './PGConnect.css';

function Avatar({ name, url, size = 40 }) {
  if (url) return <img className="pgc-av" src={url} alt="" style={{ width: size, height: size }} />;
  return <span className="pgc-av pgc-av-ph" style={{ width: size, height: size, fontSize: size * 0.4 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

// PGConnect — the social home. Tabs: Messages, Feed, Explore, People, Notifications,
// Accounts, Profile — plus public-profile views and a Start-a-meeting sidebar. Built on
// the friends/DM infra, the social tables (posts/likes/follows/bookmarks/notifications),
// and account connections. All reads degrade gracefully when a migration isn't applied.
export default function PGConnect({ session }) {
  const user = session?.user;
  const { userId: routeUserId } = useParams();
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';
  const [tab, setTab] = useState('messages');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [active, setActive] = useState(null); // open friend { id, name, avatar }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [viewUser, setViewUser] = useState(routeUserId ? { id: routeUserId, name: null } : null); // public profile being viewed (deep-linkable via /connect/u/:userId)
  const [joinCode, setJoinCode] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const presence = usePresence(user?.id);
  const scrollRef = useRef(null);

  const reload = useCallback(() => {
    if (!user) return;
    getFriends(user.id).then(setFriends).catch(() => {});
    getIncomingRequests(user.id).then(setIncoming).catch(() => {});
    getOutgoingRequests(user.id).then(setOutgoing).catch(() => {});
  }, [user]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (user) getUnreadCount(user.id).then(setUnreadNotifs).catch(() => {}); }, [user]);

  // live incoming for the open thread, via the shared DM bus.
  useEffect(() => {
    if (!user) return undefined;
    const onDm = (e) => {
      const payload = e.detail;
      if (active && payload?.from === active.id) {
        setMessages((prev) => [...prev, { id: `r${Date.now()}`, mine: false, body: payload.body, at: new Date().toISOString() }]);
      }
    };
    window.addEventListener('pg:dm', onDm);
    return () => window.removeEventListener('pg:dm', onDm);
  }, [user, active]);

  useEffect(() => {
    if (!active || !user) return;
    getThread(user.id, active.id).then(setMessages).catch(() => setMessages([]));
  }, [active, user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // child panes (Profile onboarding cards) can switch tabs
  useEffect(() => {
    const onTab = (e) => { if (e.detail) { setTab(e.detail); setViewUser(null); } };
    window.addEventListener('pg:connect-tab', onTab);
    return () => window.removeEventListener('pg:connect-tab', onTab);
  }, []);

  // open any user's public profile from the feed, People, or a chat header
  useEffect(() => {
    const onView = (e) => { const d = e.detail; if (d?.id) setViewUser({ id: d.id, name: d.name }); };
    window.addEventListener('pg:view-profile', onView);
    return () => window.removeEventListener('pg:view-profile', onView);
  }, []);

  const send = async (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !active) return;
    setDraft('');
    setMessages((m) => [...m, { id: `o${Date.now()}`, mine: true, body, at: new Date().toISOString() }]);
    try { await sendMessage(user.id, active.id, body, myName); } catch { /* keep optimistic */ }
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    if (q.trim().length < 2) { setResults(null); return; }
    try { setResults(await searchUsers(q, user.id)); } catch { setResults([]); }
  };
  const add = async (id) => { setOutgoing((o) => [...o, id]); try { await sendFriendRequest(user.id, id); } catch { /* ignore */ } };
  const respond = async (rowId, accept) => { setIncoming((r) => r.filter((x) => x.rowId !== rowId)); try { await respondFriendRequest(rowId, accept); } finally { reload(); } };
  const friendIds = new Set(friends.map((f) => f.id));
  const startRoom = (mode) => window.dispatchEvent(new CustomEvent('pg:start-room', { detail: { mode } }));
  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    window.dispatchEvent(new CustomEvent('pg:start-room', { detail: { mode: 'join', code } }));
    setJoinCode('');
  };
  const callFriend = (f, video) => window.dispatchEvent(new CustomEvent('pg:start-call', { detail: { toUserId: f.id, toName: f.name, video } }));
  const viewProfile = (id, name) => setViewUser({ id, name });

  if (!user) {
    return <div className="pgc-page"><div className="pgc-signin"><MessageSquare size={30} /><h2>Sign in to PGConnect</h2><p>Message friends, find coders, and connect.</p></div></div>;
  }

  return (
    <div className="pgc-page">
      <div className="pgc-shell has-side">
        <nav className="pgc-rail">
          <div className="pgc-brand"><span className="pgc-brand-pg">PG</span>Connect</div>
          <button className={`pgc-rail-btn ${tab === 'profile' ? 'on' : ''}`} onClick={() => setTab('profile')}><User size={17} /> Profile</button>
          <button className={`pgc-rail-btn ${tab === 'messages' ? 'on' : ''}`} onClick={() => setTab('messages')}><MessageSquare size={17} /> Messages</button>
          <button className={`pgc-rail-btn ${tab === 'feed' ? 'on' : ''}`} onClick={() => setTab('feed')}><Rss size={17} /> Feed</button>
          <button className={`pgc-rail-btn ${tab === 'explore' ? 'on' : ''}`} onClick={() => setTab('explore')}><Compass size={17} /> Explore</button>
          <button className={`pgc-rail-btn ${tab === 'people' ? 'on' : ''}`} onClick={() => setTab('people')}><Users size={17} /> People</button>
          <button className={`pgc-rail-btn ${tab === 'notifications' ? 'on' : ''}`} onClick={() => { setTab('notifications'); setUnreadNotifs(0); }}>
            <span className="pgc-rail-ic-wrap"><Bell size={17} />{unreadNotifs > 0 ? <span className="pgc-rail-badge">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span> : null}</span> Notifications
          </button>
          <button className={`pgc-rail-btn ${tab === 'accounts' ? 'on' : ''}`} onClick={() => setTab('accounts')}><Link2 size={17} /> Accounts</button>
          <div className="pgc-rail-spacer" />
          <div className="pgc-rail-user">
            <Avatar name={myName} url={user?.user_metadata?.avatar_url} size={38} />
            <span className="pgc-rail-user-name">{myName}<span className="pgc-rail-user-sub">Your account</span></span>
          </div>
        </nav>

        {viewUser && (
          <div className="pgc-scrollpane">
            <PublicProfile
              key={viewUser.id}
              user={user}
              userId={viewUser.id}
              name={viewUser.name}
              onBack={() => setViewUser(null)}
              onMessage={(f) => { setActive(f); setTab('messages'); setViewUser(null); }}
            />
          </div>
        )}

        {!viewUser && tab === 'messages' && (
          <div className="pgc-messenger">
            <aside className={`pgc-convos ${active ? 'has-active' : ''}`}>
              <div className="pgc-convos-head">Chats</div>
              {friends.length === 0 ? (
                <p className="pgc-empty">No friends yet. Find people in the People tab.</p>
              ) : friends.map((f) => (
                <button key={f.id} className={`pgc-convo ${active?.id === f.id ? 'on' : ''}`} onClick={() => setActive(f)}>
                  <span className="pgc-av-wrap"><Avatar name={f.name} url={f.avatar} size={38} />{presence.has(f.id) ? <span className="pgc-online" title="Online" /> : null}</span>
                  <span className="pgc-convo-name">{f.name}</span>
                </button>
              ))}
            </aside>
            <section className={`pgc-thread ${active ? 'open' : ''}`}>
              {active ? (
                <>
                  <div className="pgc-thread-head">
                    <button className="pgc-back" onClick={() => setActive(null)} aria-label="Back to chats"><ArrowLeft size={16} /></button>
                    <Avatar name={active.name} url={active.avatar} size={34} />
                    <span className="pgc-thread-name">{active.name}</span>
                  </div>
                  <div className="pgc-msgs" ref={scrollRef}>
                    {messages.length === 0 ? <p className="pgc-empty">Say hi to {active.name}.</p>
                      : messages.map((m) => <div key={m.id} className={`pgc-msg ${m.mine ? 'mine' : 'theirs'}`}>{m.body}</div>)}
                  </div>
                  <form className="pgc-compose" onSubmit={send}>
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${active.name}`} aria-label={`Message ${active.name}`} maxLength={2000} />
                    <button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={16} /></button>
                  </form>
                </>
              ) : (
                <div className="pgc-thread-empty"><MessageSquare size={34} /><p>Select a chat to start messaging.</p></div>
              )}
            </section>
          </div>
        )}

        {!viewUser && tab === 'people' && (
          <div className="pgc-people">
            <form className="pgc-search" onSubmit={runSearch}>
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a coder by name or username" aria-label="Search people" />
              <button type="submit" disabled={q.trim().length < 2}>Search</button>
            </form>
            {results ? (
              <div className="pgc-list">
                {results.length === 0 ? <p className="pgc-empty">No coders found for “{q}”.</p> : results.map((r) => (
                  <div key={r.id} className="pgc-person">
                    <button className="pgc-person-open" onClick={() => viewProfile(r.id, r.name)}>
                      <Avatar name={r.name} url={r.avatar} size={40} />
                      <span className="pgc-person-name">{r.name}{r.username ? <em>@{r.username}</em> : null}</span>
                    </button>
                    {friendIds.has(r.id) ? <span className="pgc-tag">friend</span>
                      : outgoing.includes(r.id) ? <span className="pgc-tag"><Clock3 size={12} /> sent</span>
                      : <button className="pgc-add" onClick={() => add(r.id)}><UserPlus size={14} /> Add</button>}
                  </div>
                ))}
                <button className="pgc-clear" onClick={() => { setResults(null); setQ(''); }}>Back</button>
              </div>
            ) : (
              <>
                {incoming.length > 0 && (
                  <div className="pgc-group">
                    <span className="pgc-group-label"><Clock3 size={13} /> Requests</span>
                    {incoming.map((r) => (
                      <div key={r.rowId} className="pgc-person">
                        <Avatar name={r.name} size={40} />
                        <span className="pgc-person-name">{r.name}</span>
                        <button className="pgc-icon ok" onClick={() => respond(r.rowId, true)} aria-label="Accept request"><Check size={15} /></button>
                        <button className="pgc-icon no" onClick={() => respond(r.rowId, false)} aria-label="Decline request"><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pgc-group">
                  <span className="pgc-group-label"><Users size={13} /> Friends ({friends.length})</span>
                  {friends.length === 0 ? <p className="pgc-empty">No friends yet — search above to add someone.</p> : friends.map((f) => (
                    <div key={f.id} className="pgc-person">
                      <button className="pgc-person-open" onClick={() => viewProfile(f.id, f.name)}>
                        <span className="pgc-av-wrap"><Avatar name={f.name} url={f.avatar} size={40} />{presence.has(f.id) ? <span className="pgc-online" title="Online" /> : null}</span>
                        <span className="pgc-person-name">{f.name}</span>
                      </button>
                      <button className="pgc-icon msg" title="Message" onClick={() => { setActive(f); setTab('messages'); }}><MessageSquare size={15} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!viewUser && tab === 'accounts' && <div className="pgc-scrollpane"><ConnectionsTab user={user} /></div>}
        {!viewUser && tab === 'explore' && <div className="pgc-scrollpane"><ExploreTab user={user} /></div>}
        {!viewUser && tab === 'notifications' && <div className="pgc-scrollpane"><NotificationsTab user={user} /></div>}
        {!viewUser && tab === 'feed' && <div className="pgc-scrollpane"><FeedTab user={user} myName={myName} /></div>}
        {!viewUser && tab === 'profile' && <div className="pgc-scrollpane"><ProfileTab user={user} myName={myName} /></div>}

        {tab !== 'rooms' && (
          <aside className="pgc-side">
            {callsEnabled() ? (
              <div className="pgc-side-card">
                <div className="pgc-side-title"><VideoIcon size={14} /> Start a meeting</div>
                <button className="pgc-side-action video" onClick={() => startRoom('video')}><VideoIcon size={16} /> New video room</button>
                <button className="pgc-side-action voice" onClick={() => startRoom('voice')}><Phone size={16} /> New voice room</button>
                <form className="pgc-side-join" onSubmit={(e) => { e.preventDefault(); joinRoom(); }}>
                  <span className="pgc-side-join-ic"><Hash size={13} /></span>
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter a code" maxLength={8} />
                  <button type="submit" disabled={joinCode.trim().length < 4}>Join</button>
                </form>
                <p className="pgc-side-note">Meetings open in a floating window you can drag anywhere.</p>
              </div>
            ) : null}

            <div className="pgc-side-card">
              <div className="pgc-side-title"><Users size={14} /> Quick call</div>
              {friends.length === 0 ? (
                <p className="pgc-side-empty">Add friends in People to call them in one tap.</p>
              ) : (
                <div className="pgc-side-friends">
                  {friends.slice(0, 6).map((f) => (
                    <div key={f.id} className="pgc-side-friend">
                      <span className="pgc-av-wrap"><Avatar name={f.name} url={f.avatar} size={32} />{presence.has(f.id) ? <span className="pgc-online" title="Online" /> : null}</span>
                      <span className="pgc-side-friend-name">{f.name}</span>
                      <button title={`Message ${f.name}`} onClick={() => { setActive(f); setTab('messages'); }}><MessageSquare size={14} /></button>
                      {callsEnabled() ? <button title={`Video call ${f.name}`} onClick={() => callFriend(f, true)}><VideoIcon size={14} /></button> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pgc-side-card pgc-side-tip">
              <div className="pgc-side-title"><Rss size={14} /> Get started</div>
              <ul>
                <li>Share a post in the Feed</li>
                <li>Find coders in People and follow them</li>
                <li>Start a Meet room and share the code</li>
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
