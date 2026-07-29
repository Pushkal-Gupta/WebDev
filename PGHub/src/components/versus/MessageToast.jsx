import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { dmChannel } from '../../lib/friends';
import '../../styles/versus.css';

// App-level listener: whenever a friend DMs the signed-in user, surface a toast anywhere
// in the app (like the challenge/call banners). Clicking opens the social area. Ephemeral.
export default function MessageToast({ session }) {
  const nav = useNavigate();
  const userId = session?.user?.id;
  const [msgs, setMsgs] = useState([]); // recent incoming DMs { id, fromName, body }

  useEffect(() => {
    if (!userId) return undefined;
    const ch = dmChannel(userId);
    ch.on('broadcast', { event: 'dm' }, ({ payload }) => {
      if (!payload?.body) return;
      const id = `${payload.from || 'x'}-${Math.random().toString(36).slice(2, 8)}`;
      setMsgs((m) => [...m.slice(-2), { id, fromName: payload.fromName, body: String(payload.body) }]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 7000);
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  if (!userId || !msgs.length) return null;
  const dismiss = (id) => setMsgs((m) => m.filter((x) => x.id !== id));
  return (
    <div className="vs-msg-toasts">
      {msgs.map((m) => (
        <div key={m.id} className="vs-toast vs-msg-toast" onClick={() => { dismiss(m.id); nav('/battle'); }} role="button">
          <span className="vs-toast-ic"><MessageSquare size={16} /></span>
          <div className="vs-toast-body">
            <b>{m.fromName || 'A friend'}</b>
            <span>{m.body.slice(0, 64)}{m.body.length > 64 ? '…' : ''}</span>
          </div>
          <button className="vs-toast-x" onClick={(e) => { e.stopPropagation(); dismiss(m.id); }} aria-label="Dismiss"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}
