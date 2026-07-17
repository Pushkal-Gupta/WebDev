import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { challengeChannel } from '../../lib/friends';
import '../../styles/versus.css';

// App-level listener: whenever the signed-in user is challenged by a friend, a
// broadcast lands on their personal channel and we surface a Join banner anywhere
// in the app. Ephemeral — no DB row, no polling.
export default function ChallengeToast({ session }) {
  const nav = useNavigate();
  const userId = session?.user?.id;
  const [incoming, setIncoming] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const ch = challengeChannel(userId);
    ch.on('broadcast', { event: 'challenge' }, ({ payload }) => { if (payload?.code) setIncoming(payload); });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(() => setIncoming(null), 30000);
    return () => clearTimeout(t);
  }, [incoming]);

  if (!incoming) return null;
  return (
    <div className="vs-toast">
      <span className="vs-toast-ic"><Swords size={18} /></span>
      <div className="vs-toast-body">
        <b>{incoming.fromName || 'A friend'} challenged you</b>
        <span>{incoming.difficulty} · {Math.round((incoming.timeLimit || 900) / 60)} min · {incoming.language}</span>
      </div>
      <button className="vs-toast-join" onClick={() => { const c = incoming.code; setIncoming(null); nav(`/versus/${c}`); }}>Join</button>
      <button className="vs-toast-x" onClick={() => setIncoming(null)} aria-label="Dismiss"><X size={15} /></button>
    </div>
  );
}
