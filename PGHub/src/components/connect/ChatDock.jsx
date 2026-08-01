import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ChevronLeft, Phone, Video as VideoIcon } from 'lucide-react';
import { getFriends, getThread, sendMessage } from '../../lib/friends';
import { callsEnabled } from '../../lib/callSignal';
import './ChatDock.css';

function Avatar({ name, url, size = 32 }) {
  if (url) return <img className="pgc-av" src={url} alt="" style={{ width: size, height: size }} />;
  return <span className="pgc-av pgc-av-ph" style={{ width: size, height: size, fontSize: size * 0.42 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

// App-level chat dock — messaging that FLOWS through every tab. A floating button opens
// your chats; conversations stay live as you navigate. `pg:open-chat` opens a specific
// friend from anywhere (message toasts, a profile "message" button, etc.).
export default function ChatDock({ session }) {
  const user = session?.user;
  const myName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';
  const [open, setOpen] = useState(false);      // friend-list panel
  const [active, setActive] = useState(null);   // open friend { id, name, avatar }
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [unread, setUnread] = useState({});     // friendId -> count
  const scrollRef = useRef(null);
  const activeRef = useRef(null);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => { if (user) getFriends(user.id).then(setFriends).catch(() => {}); }, [user]);

  // open a chat from anywhere in the app
  useEffect(() => {
    const onOpen = (e) => {
      const { friendId, friendName, friendAvatar } = e.detail || {};
      if (!friendId) return;
      setActive({ id: friendId, name: friendName || 'Friend', avatar: friendAvatar });
      setOpen(true);
      setUnread((u) => { const n = { ...u }; delete n[friendId]; return n; });
    };
    window.addEventListener('pg:open-chat', onOpen);
    return () => window.removeEventListener('pg:open-chat', onOpen);
  }, []);

  // incoming DMs via the shared bus (persist across navigation)
  useEffect(() => {
    if (!user) return undefined;
    const onDm = (e) => {
      const payload = e.detail;
      if (!payload?.body) return;
      const cur = activeRef.current;
      if (cur && payload.from === cur.id) {
        setMessages((m) => [...m, { id: `r${Date.now()}`, mine: false, body: payload.body, at: new Date().toISOString() }]);
      } else {
        setUnread((u) => ({ ...u, [payload.from]: (u[payload.from] || 0) + 1 }));
      }
    };
    window.addEventListener('pg:dm', onDm);
    return () => window.removeEventListener('pg:dm', onDm);
  }, [user]);

  useEffect(() => { if (active && user) getThread(user.id, active.id).then(setMessages).catch(() => setMessages([])); }, [active, user]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !active) return;
    setDraft('');
    setMessages((m) => [...m, { id: `o${Date.now()}`, mine: true, body, at: new Date().toISOString() }]);
    try { await sendMessage(user.id, active.id, body, myName); } catch { /* keep optimistic */ }
  };
  const openFriend = (f) => { setActive(f); setUnread((u) => { const n = { ...u }; delete n[f.id]; return n; }); };
  const call = (video) => { if (active) window.dispatchEvent(new CustomEvent('pg:start-call', { detail: { toUserId: active.id, toName: active.name, video } })); };

  if (!user) return null;
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <div className="pgc-dock">
      {open && !active ? (
        <div className="pgc-dock-panel">
          <div className="pgc-dock-head"><MessageSquare size={14} /> Chats<button className="pgc-dock-x" onClick={() => setOpen(false)}><X size={14} /></button></div>
          <div className="pgc-dock-list">
            {friends.length === 0 ? <p className="pgc-dock-empty">Add friends in PGConnect to start chatting.</p>
              : friends.map((f) => (
                <button key={f.id} className="pgc-dock-friend" onClick={() => openFriend(f)}>
                  <Avatar name={f.name} url={f.avatar} size={34} />
                  <span className="pgc-dock-friend-name">{f.name}</span>
                  {unread[f.id] ? <span className="pgc-dock-badge">{unread[f.id]}</span> : null}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {active ? (
        <div className="pgc-dock-chat">
          <div className="pgc-dock-chat-head">
            <button className="pgc-dock-back" onClick={() => setActive(null)}><ChevronLeft size={16} /></button>
            <Avatar name={active.name} url={active.avatar} size={28} />
            <span className="pgc-dock-chat-name">{active.name}</span>
            {callsEnabled() ? (
              <>
                <button className="pgc-dock-call" title="Voice call" onClick={() => call(false)}><Phone size={14} /></button>
                <button className="pgc-dock-call" title="Video call" onClick={() => call(true)}><VideoIcon size={14} /></button>
              </>
            ) : null}
            <button className="pgc-dock-x" onClick={() => { setActive(null); setOpen(false); }}><X size={15} /></button>
          </div>
          <div className="pgc-dock-msgs" ref={scrollRef}>
            {messages.length === 0 ? <p className="pgc-dock-empty">Say hi to {active.name}.</p>
              : messages.map((m) => <div key={m.id} className={`pgc-msg ${m.mine ? 'mine' : 'theirs'}`}>{m.body}</div>)}
          </div>
          <form className="pgc-dock-compose" onSubmit={send}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${active.name}`} maxLength={2000} />
            <button type="submit" disabled={!draft.trim()}><Send size={15} /></button>
          </form>
        </div>
      ) : null}

      <button className="pgc-dock-fab" onClick={() => { if (active) setActive(null); else setOpen((o) => !o); }} title="Messages" aria-label="Messages">
        <MessageSquare size={20} />
        {totalUnread > 0 && !open && !active ? <span className="pgc-dock-fab-badge">{totalUnread > 9 ? '9+' : totalUnread}</span> : null}
      </button>
    </div>
  );
}
