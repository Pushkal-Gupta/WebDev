import { useState, useEffect, useCallback } from 'react';
import { Users, Search, UserPlus, Check, X, Swords, Clock3 } from 'lucide-react';
import { searchUsers, getFriends, getIncomingRequests, getOutgoingRequests, sendFriendRequest, respondFriendRequest } from '../../lib/friends';

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

  const reload = useCallback(() => {
    if (!user) return;
    getFriends(user.id).then(setFriends).catch(() => {});
    getIncomingRequests(user.id).then(setIncoming).catch(() => {});
    getOutgoingRequests(user.id).then(setOutgoing).catch(() => {});
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

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
