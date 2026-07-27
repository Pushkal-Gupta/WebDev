import { useEffect, useState, useCallback } from 'react';
import { Phone, PhoneOff, Video as VideoIcon, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callChannel, sendCallDecline, callsEnabled } from '../../lib/callSignal';
import VideoCall from './VideoCall';
import '../../styles/versus.css';

// App-level universal calling. Anywhere in the app, `window.dispatchEvent(new
// CustomEvent('pg:start-call', { detail: { toUserId, toName, video } }))` starts a call;
// incoming invites surface a banner. The actual media rides VideoCall over `comms:{room}`.
export default function GlobalCall({ session }) {
  const userId = session?.user?.id;
  const myName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'You';
  const [incoming, setIncoming] = useState(null);  // { room, fromId, fromName, video }
  const [active, setActive] = useState(null);       // { room, autoStart, peerName }

  // Start a call (dispatched from anywhere, e.g. FriendsPanel).
  useEffect(() => {
    if (!userId) return undefined;
    const onStart = (e) => {
      if (!callsEnabled()) return;
      const { toUserId, toName, video } = e.detail || {};
      if (!toUserId || active) return;
      import('../../lib/callSignal').then(({ genRoom, sendCallInvite }) => {
        const room = genRoom();
        sendCallInvite(toUserId, { room, fromId: userId, fromName: myName, video: !!video });
        setActive({ room, autoStart: video ? 'video' : 'voice', peerName: toName || 'Friend' });
      });
    };
    window.addEventListener('pg:start-call', onStart);
    return () => window.removeEventListener('pg:start-call', onStart);
  }, [userId, myName, active]);

  // Listen for incoming invites on my personal call channel.
  useEffect(() => {
    if (!userId) return undefined;
    const ch = callChannel(userId);
    ch.on('broadcast', { event: 'call-invite' }, ({ payload }) => {
      if (!callsEnabled()) return;
      if (payload?.room && !active) setIncoming(payload);
    });
    ch.on('broadcast', { event: 'call-decline' }, () => { setActive(null); setIncoming(null); });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, active]);

  // Auto-dismiss a stale incoming ring.
  useEffect(() => {
    if (!incoming) return undefined;
    const t = setTimeout(() => setIncoming(null), 30000);
    return () => clearTimeout(t);
  }, [incoming]);

  const acceptIncoming = () => {
    if (!incoming) return;
    setActive({ room: incoming.room, autoStart: null, peerName: incoming.fromName || 'Friend' });
    setIncoming(null);
  };
  const declineIncoming = () => {
    if (incoming?.fromId) sendCallDecline(incoming.fromId, { fromId: userId, fromName: myName, reason: 'declined' });
    setIncoming(null);
  };
  const endCall = useCallback(() => setActive(null), []);

  if (!userId || !callsEnabled()) return null;

  return (
    <>
      {incoming && !active ? (
        <div className="vs-toast vs-call-toast">
          <span className="vs-toast-ic">{incoming.video ? <VideoIcon size={18} /> : <Phone size={18} />}</span>
          <div className="vs-toast-body">
            <b>{incoming.fromName || 'A friend'} is calling</b>
            <span>Incoming {incoming.video ? 'video' : 'voice'} call</span>
          </div>
          <button className="vs-toast-join" onClick={acceptIncoming}><Phone size={14} /> Accept</button>
          <button className="vs-toast-x" onClick={declineIncoming} aria-label="Decline"><X size={15} /></button>
        </div>
      ) : null}

      {active ? (
        <VideoCall
          key={active.room}
          code={active.room}
          userId={userId}
          myName={myName}
          oppName={active.peerName}
          autoStart={active.autoStart}
          onEnded={endCall}
        />
      ) : null}
    </>
  );
}
