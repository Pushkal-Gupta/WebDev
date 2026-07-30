import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Users, Search, UserPlus, Check, X, Clock3, Send, Rss, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  searchUsers, getFriends, getIncomingRequests, getOutgoingRequests,
  sendFriendRequest, respondFriendRequest, getThread, sendMessage, dmChannel,
} from '../../lib/friends';
import FeedTab from './FeedTab';
import ProfileTab from './ProfileTab';
import './PGConnect.css';

function Avatar({ name, url, size = 40 }) {
  if (url) return <img className="pgc-av" src={url} alt="" style={{ width: size, height: size }} />;
  return <span className="pgc-av pgc-av-ph" style={{ width: size, height: size, fontSize: size * 0.4 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

// PGConnect — the social home: messaging (WhatsApp-style), people, and (next) a feed +
// customizable profiles. This foundation ships Messages + People fully working on the
// existing friends/DM infra; Feed + profile customization arrive with their migration.
export default function PGConnect({ session }) {
  const user = session?.user;
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
  const scrollRef = useRef(null);

  const reload = useCallback(() => {
    if (!user) return;
    getFriends(user.id).then(setFriends).catch(() => {});
    getIncomingRequests(user.id).then(setIncoming).catch(() => {});
    getOutgoingRequests(user.id).then(setOutgoing).catch(() => {});
  }, [user]);
  useEffect(() => { reload(); }, [reload]);

  // load thread + subscribe to live incoming from anyone (refresh the open thread).
  useEffect(() => {
    if (!user) return undefined;
    const ch = dmChannel(user.id);
    ch.on('broadcast', { event: 'dm' }, ({ payload }) => {
      if (active && payload?.from === active.id) {
        setMessages((prev) => [...prev, { id: `r${Date.now()}`, mine: false, body: payload.body, at: new Date().toISOString() }]);
      }
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, active]);

  useEffect(() => {
    if (!active || !user) return;
    getThread(user.id, active.id).then(setMessages).catch(() => setMessages([]));
  }, [active, user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

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

  if (!user) {
    return <div className="pgc-page"><div className="pgc-signin"><MessageSquare size={30} /><h2>Sign in to PGConnect</h2><p>Message friends, find coders, and connect.</p></div></div>;
  }

  return (
    <div className="pgc-page">
      <div className="pgc-shell">
        <nav className="pgc-rail">
          <div className="pgc-brand"><span className="pgc-brand-pg">PG</span>Connect</div>
          <button className={`pgc-rail-btn ${tab === 'messages' ? 'on' : ''}`} onClick={() => setTab('messages')}><MessageSquare size={17} /> Messages</button>
          <button className={`pgc-rail-btn ${tab === 'people' ? 'on' : ''}`} onClick={() => setTab('people')}><Users size={17} /> People</button>
          <button className={`pgc-rail-btn ${tab === 'feed' ? 'on' : ''}`} onClick={() => setTab('feed')}><Rss size={17} /> Feed</button>
          <button className={`pgc-rail-btn ${tab === 'profile' ? 'on' : ''}`} onClick={() => setTab('profile')}><User size={17} /> Profile</button>
        </nav>

        {tab === 'messages' && (
          <div className="pgc-messenger">
            <aside className={`pgc-convos ${active ? 'has-active' : ''}`}>
              <div className="pgc-convos-head">Chats</div>
              {friends.length === 0 ? (
                <p className="pgc-empty">No friends yet. Find people in the People tab.</p>
              ) : friends.map((f) => (
                <button key={f.id} className={`pgc-convo ${active?.id === f.id ? 'on' : ''}`} onClick={() => setActive(f)}>
                  <Avatar name={f.name} url={f.avatar} size={38} />
                  <span className="pgc-convo-name">{f.name}</span>
                </button>
              ))}
            </aside>
            <section className={`pgc-thread ${active ? 'open' : ''}`}>
              {active ? (
                <>
                  <div className="pgc-thread-head">
                    <button className="pgc-back" onClick={() => setActive(null)}><ArrowLeft size={16} /></button>
                    <Avatar name={active.name} url={active.avatar} size={34} />
                    <span className="pgc-thread-name">{active.name}</span>
                  </div>
                  <div className="pgc-msgs" ref={scrollRef}>
                    {messages.length === 0 ? <p className="pgc-empty">Say hi to {active.name}.</p>
                      : messages.map((m) => <div key={m.id} className={`pgc-msg ${m.mine ? 'mine' : 'theirs'}`}>{m.body}</div>)}
                  </div>
                  <form className="pgc-compose" onSubmit={send}>
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${active.name}`} maxLength={2000} />
                    <button type="submit" disabled={!draft.trim()}><Send size={16} /></button>
                  </form>
                </>
              ) : (
                <div className="pgc-thread-empty"><MessageSquare size={34} /><p>Select a chat to start messaging.</p></div>
              )}
            </section>
          </div>
        )}

        {tab === 'people' && (
          <div className="pgc-people">
            <form className="pgc-search" onSubmit={runSearch}>
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a coder by name or username" />
              <button type="submit" disabled={q.trim().length < 2}>Search</button>
            </form>
            {results ? (
              <div className="pgc-list">
                {results.length === 0 ? <p className="pgc-empty">No coders found for “{q}”.</p> : results.map((r) => (
                  <div key={r.id} className="pgc-person">
                    <Avatar name={r.name} url={r.avatar} size={40} />
                    <span className="pgc-person-name">{r.name}{r.username ? <em>@{r.username}</em> : null}</span>
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
                        <button className="pgc-icon ok" onClick={() => respond(r.rowId, true)}><Check size={15} /></button>
                        <button className="pgc-icon no" onClick={() => respond(r.rowId, false)}><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pgc-group">
                  <span className="pgc-group-label"><Users size={13} /> Friends ({friends.length})</span>
                  {friends.length === 0 ? <p className="pgc-empty">No friends yet — search above to add someone.</p> : friends.map((f) => (
                    <div key={f.id} className="pgc-person">
                      <Avatar name={f.name} url={f.avatar} size={40} />
                      <span className="pgc-person-name">{f.name}</span>
                      <button className="pgc-icon msg" title="Message" onClick={() => { setActive(f); setTab('messages'); }}><MessageSquare size={15} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'feed' && <div className="pgc-scrollpane"><FeedTab user={user} myName={myName} /></div>}
        {tab === 'profile' && <div className="pgc-scrollpane"><ProfileTab user={user} myName={myName} /></div>}
      </div>
    </div>
  );
}
