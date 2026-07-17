import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Search, UserPlus, Check, X, Swords, Clock3, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { searchUsers, getFriends, getIncomingRequests, getOutgoingRequests, sendFriendRequest, respondFriendRequest, getThread, sendMessage, dmChannel } from '../../lib/friends';

function Avatar({ name, url }) {
  if (url) return <img className="vs-fr-av" src={url} alt="" />;
  return <span className="vs-fr-av vs-fr-av-ph">{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

export default function FriendsPanel({ session, onChallenge, challengingId }) {
  const user = session?.user;
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [thread, setThread] = useState(null);     // open friend { id, name }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';
  const scrollRef = useRef(null);

  const reload = useCallback(() => {
    if (!user) return;
    getFriends(user.id).then(setFriends).catch(() => {});
    getIncomingRequests(user.id).then(setIncoming).catch(() => {});
    getOutgoingRequests(user.id).then(setOutgoing).catch(() => {});
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  // open thread: load history + subscribe to live incoming from this friend
  useEffect(() => {
    if (!thread || !user) return;
    let live = true;
    getThread(user.id, thread.id).then((m) => { if (live) setMessages(m); }).catch(() => {});
    const ch = dmChannel(user.id);
    ch.on('broadcast', { event: 'dm' }, ({ payload }) => {
      if (payload?.from === thread.id) setMessages((prev) => [...prev, { id: `r${Date.now()}`, mine: false, body: payload.body, at: new Date().toISOString() }]);
    });
    ch.subscribe();
    return () => { live = false; supabase.removeChannel(ch); };
  }, [thread, user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !thread) return;
    setDraft('');
    const optimistic = { id: `o${Date.now()}`, mine: true, body, at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    try { await sendMessage(user.id, thread.id, body, myName); } catch { /* keep optimistic */ }
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    if (q.trim().length < 2) { setResults(null); return; }
    setSearching(true);
    try { setResults(await searchUsers(q, user.id)); } catch { setResults([]); }
    setSearching(false);
  };

  const add = async (id) => {
    setOutgoing((o) => [...o, id]);
    try { await sendFriendRequest(user.id, id); } catch { /* ignore */ }
  };
  const respond = async (rowId, accept) => {
    setIncoming((r) => r.filter((x) => x.rowId !== rowId));
    try { await respondFriendRequest(rowId, accept); } finally { reload(); }
  };

  const friendIds = new Set(friends.map((f) => f.id));

  if (thread) {
    return (
      <div className="vs-friends-card">
        <div className="vs-fr-thread-head">
          <button className="vs-fr-back" onClick={() => { setThread(null); setMessages([]); }}><ArrowLeft size={15} /></button>
          <Avatar name={thread.name} url={thread.avatar} />
          <span className="vs-fr-name">{thread.name}</span>
          <button className="vs-fr-btn challenge" disabled={!!challengingId} onClick={() => onChallenge(thread)}><Swords size={13} /> Challenge</button>
        </div>
        <div className="vs-fr-msgs" ref={scrollRef}>
          {messages.length === 0 ? <p className="vs-fr-empty">Say hi, then challenge them to a battle.</p>
            : messages.map((m) => <div key={m.id} className={`vs-fr-msg ${m.mine ? 'mine' : 'theirs'}`}>{m.body}</div>)}
        </div>
        <form className="vs-fr-compose" onSubmit={send}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${thread.name}`} maxLength={2000} />
          <button type="submit" disabled={!draft.trim()}><Send size={15} /></button>
        </form>
      </div>
    );
  }

  return (
    <div className="vs-friends-card">
      <div className="vs-fr-head"><Users size={15} /> Friends</div>

      <form className="vs-fr-search" onSubmit={runSearch}>
        <Search size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a coder by name" />
        <button type="submit" disabled={q.trim().length < 2}>{searching ? '…' : 'Search'}</button>
      </form>

      {results ? (
        <div className="vs-fr-list vs-fr-results">
          {results.length === 0 ? <p className="vs-fr-empty">No coders found for “{q}”.</p> : results.map((r) => (
            <div key={r.id} className="vs-fr-row">
              <Avatar name={r.name} url={r.avatar} />
              <span className="vs-fr-name">{r.name}{r.username ? <em>@{r.username}</em> : null}</span>
              {friendIds.has(r.id) ? <span className="vs-fr-tag">friend</span>
                : outgoing.includes(r.id) ? <span className="vs-fr-tag"><Clock3 size={12} /> sent</span>
                : <button className="vs-fr-btn" onClick={() => add(r.id)}><UserPlus size={13} /> Add</button>}
            </div>
          ))}
          <button className="vs-fr-clear" onClick={() => { setResults(null); setQ(''); }}>Back to friends</button>
        </div>
      ) : (
        <>
          {incoming.length > 0 && (
            <div className="vs-fr-requests">
              <span className="vs-fr-sub">Requests</span>
              {incoming.map((r) => (
                <div key={r.rowId} className="vs-fr-row">
                  <Avatar name={r.name} />
                  <span className="vs-fr-name">{r.name}</span>
                  <button className="vs-fr-icon ok" title="Accept" onClick={() => respond(r.rowId, true)}><Check size={14} /></button>
                  <button className="vs-fr-icon no" title="Ignore" onClick={() => respond(r.rowId, false)}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="vs-fr-list">
            {friends.length === 0 ? (
              <p className="vs-fr-empty">No friends yet — search above to add someone, then challenge them to a battle.</p>
            ) : friends.map((f) => (
              <div key={f.id} className="vs-fr-row">
                <Avatar name={f.name} url={f.avatar} />
                <span className="vs-fr-name">{f.name}</span>
                <button className="vs-fr-icon msg" title={`Message ${f.name}`} onClick={() => setThread(f)}><MessageSquare size={14} /></button>
                <button className="vs-fr-btn challenge" disabled={!!challengingId} onClick={() => onChallenge(f)}>
                  <Swords size={13} /> {challengingId === f.id ? '…' : 'Challenge'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
