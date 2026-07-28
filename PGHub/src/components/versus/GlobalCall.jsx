import { useEffect, useState, useCallback, useRef } from 'react';
import { Phone, Video as VideoIcon, X, Users, PhoneCall, Hash, Plus, Check, Copy, EyeOff, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callChannel, sendCallDecline, callsEnabled, genShortCode, launcherVisible, setLauncherVisible } from '../../lib/callSignal';
import { getFriends } from '../../lib/friends';
import VideoCall from './VideoCall';
import '../../styles/versus.css';

// App-level universal calling — available on EVERY page. Three ways to call:
//   1. A friend (invite lands on their personal channel, they get a banner anywhere)
//   2. Create a shareable room code (anyone with the code joins — friends or not)
//   3. Join by code
// The media always rides VideoCall over `comms:{room}` (the same path battles use), which
// carries every feature: resize, fullscreen, screen share, mic animations, virtual bg.
// Dispatch `window.dispatchEvent(new CustomEvent('pg:start-call', { detail:{ toUserId, toName, video } }))`
// from anywhere to start a friend call programmatically.
export default function GlobalCall({ session }) {
  const userId = session?.user?.id;
  const myName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'You';
  const [incoming, setIncoming] = useState(null);  // { room, fromId, fromName, video }
  const [active, setActive] = useState(null);       // { room, autoStart, peerName, shareCode? }
  const [friends, setFriends] = useState([]);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [enabled, setEnabled] = useState(callsEnabled());
  const [fabShown, setFabShown] = useState(launcherVisible());
  const [pos, setPos] = useState(() => { try { return JSON.parse(localStorage.getItem('pg_launcher_pos') || 'null'); } catch { return null; } });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const onSetting = () => { setEnabled(callsEnabled()); setFabShown(launcherVisible()); };
    window.addEventListener('pg:calls-setting', onSetting);
    window.addEventListener('pg:launcher-setting', onSetting);
    window.addEventListener('storage', onSetting);
    return () => { window.removeEventListener('pg:calls-setting', onSetting); window.removeEventListener('pg:launcher-setting', onSetting); window.removeEventListener('storage', onSetting); };
  }, []);

  // Drag the floating button; movement beyond a small threshold is a drag (not a click),
  // and the position persists. Clamped to the viewport so it can't be lost off-screen.
  const onFabPointerDown = (e) => {
    const el = dragRef.current; if (!el) return;
    const base = el.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const origin = pos || { x: base.left, y: base.top };
    movedRef.current = false;
    let latest = origin;
    const move = (ev) => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) { movedRef.current = true; setDragging(true); }
      const w = el.offsetWidth, h = el.offsetHeight;
      latest = {
        x: Math.min(Math.max(6, origin.x + dx), window.innerWidth - w - 6),
        y: Math.min(Math.max(60, origin.y + dy), window.innerHeight - h - 6),
      };
      setPos(latest);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragging(false);
      if (movedRef.current) {
        // Snap to the nearest side edge (AssistiveTouch-style); keep the vertical position.
        const w = el.offsetWidth;
        latest = { x: (latest.x + w / 2 < window.innerWidth / 2) ? 6 : window.innerWidth - w - 6, y: latest.y };
        setPos(latest);
        try { localStorage.setItem('pg_launcher_pos', JSON.stringify(latest)); } catch { /* private */ }
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onFabClick = () => { if (movedRef.current) { movedRef.current = false; return; } setLauncherOpen((o) => !o); };
  const hideLauncher = () => { setLauncherVisible(false); setFabShown(false); setLauncherOpen(false); window.dispatchEvent(new CustomEvent('pg:launcher-setting')); };

  useEffect(() => {
    if (!userId) return;
    getFriends(userId).then(setFriends).catch(() => {});
  }, [userId]);

  const startFriendCall = useCallback((toUserId, toName, video) => {
    if (!callsEnabled() || !toUserId) return;
    window.dispatchEvent(new CustomEvent('pg:start-call', { detail: { toUserId, toName, video } }));
    setLauncherOpen(false);
  }, []);

  // Create a shareable room (I'm the caller — auto-ring; the code is shown to share).
  const newRoom = (video) => {
    const code = genShortCode();
    setActive({ room: code, autoStart: video ? 'video' : 'voice', peerName: 'Guest', shareCode: code });
    setLauncherOpen(false);
  };
  // Join a room by code (I'm the answerer — I'll get their ring on the shared channel).
  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    setActive({ room: code, autoStart: null, peerName: 'Guest' });
    setJoinCode(''); setLauncherOpen(false);
  };

  // Programmatic friend-call starts (from FriendsPanel or anywhere).
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

  useEffect(() => {
    if (!userId) return undefined;
    const ch = callChannel(userId);
    ch.on('broadcast', { event: 'call-invite' }, ({ payload }) => {
      if (callsEnabled() && payload?.room && !active) setIncoming(payload);
    });
    ch.on('broadcast', { event: 'call-decline' }, () => { setActive(null); setIncoming(null); });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, active]);

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
  const endCall = useCallback(() => { setActive(null); setCopied(false); }, []);
  const copyCode = () => { if (active?.shareCode) { navigator.clipboard?.writeText(active.shareCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } };

  if (!userId || !enabled) return null;

  return (
    <>
      {/* Always-available launcher — on every page, draggable, hideable */}
      {!active && !incoming && fabShown ? (
        <div className={`vs-launcher ${dragging ? 'dragging' : ''}`} ref={dragRef} style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}>
          {launcherOpen ? (
            <div className="vs-launcher-panel">
              <div className="vs-launcher-head">
                <PhoneCall size={14} /> Call
                <button className="vs-launcher-hide" onClick={hideLauncher} title="Hide the call button (re-enable in Friends → Calls)"><EyeOff size={13} /> Hide</button>
                <button className="vs-launcher-x" onClick={() => setLauncherOpen(false)} aria-label="Close"><X size={14} /></button>
              </div>

              {/* Shareable room code — call anyone, friend or not */}
              <div className="vs-launcher-section">
                <div className="vs-launcher-sub"><Hash size={12} /> Room code</div>
                <div className="vs-launcher-newrow">
                  <button className="vs-launcher-new" onClick={() => newRoom(true)} title="Start a video room"><Plus size={13} /><VideoIcon size={14} /> Video room</button>
                  <button className="vs-launcher-new" onClick={() => newRoom(false)} title="Start a voice room"><Plus size={13} /><Phone size={14} /> Voice room</button>
                </div>
                <div className="vs-launcher-join">
                  <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter a code" maxLength={8}
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()} />
                  <button className="vs-launcher-joinbtn" onClick={joinRoom} disabled={joinCode.trim().length < 4}>Join</button>
                </div>
              </div>

              {/* Friends */}
              <div className="vs-launcher-section">
                <div className="vs-launcher-sub"><Users size={12} /> Friends</div>
                {friends.length === 0 ? (
                  <p className="vs-launcher-empty">Add friends in PGBattle, or share a room code above.</p>
                ) : (
                  <div className="vs-launcher-list">
                    {friends.map((f) => (
                      <div key={f.id} className="vs-launcher-row">
                        <span className="vs-launcher-name">{f.name}</span>
                        <button className="vs-launcher-call" title={`Voice call ${f.name}`} onClick={() => startFriendCall(f.id, f.name, false)}><Phone size={14} /></button>
                        <button className="vs-launcher-call" title={`Video call ${f.name}`} onClick={() => startFriendCall(f.id, f.name, true)}><VideoIcon size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <button className={`vs-launcher-fab ${launcherOpen ? 'on' : ''}`} onPointerDown={onFabPointerDown} onClick={onFabClick} title="Call (drag to move)" aria-label="Call">
            <PhoneCall size={20} />
          </button>
        </div>
      ) : null}

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

      {/* Share-code chip for a room I created, so I can send the code to whoever's joining */}
      {active?.shareCode ? (
        <div className="vs-roomcode">
          <span className="vs-roomcode-label"><Hash size={12} /> Share this code</span>
          <button className="vs-roomcode-val" onClick={copyCode} title="Copy code">
            {active.shareCode} {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
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
