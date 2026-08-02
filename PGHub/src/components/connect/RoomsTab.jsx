import { useState } from 'react';
import { Video as VideoIcon, Phone, Hash, ArrowRight, MonitorUp, Wand2, Maximize2, Smile, Users, ShieldCheck, Link2 } from 'lucide-react';
import { callsEnabled } from '../../lib/callSignal';

function Avatar({ name, url, size = 40 }) {
  if (url) return <img className="pgc-av" src={url} alt="" style={{ width: size, height: size }} />;
  return <span className="pgc-av pgc-av-ph" style={{ width: size, height: size, fontSize: size * 0.4 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
}

const FEATURES = [
  { icon: MonitorUp, label: 'Screen share', sub: 'Share a tab or your whole screen' },
  { icon: Wand2, label: 'Virtual backgrounds', sub: 'Blur or replace your background' },
  { icon: Maximize2, label: 'Resizable windows', sub: 'Drag any edge, snap the self-view' },
  { icon: Smile, label: 'Live reactions', sub: 'React without interrupting' },
  { icon: ShieldCheck, label: 'Peer-to-peer', sub: 'Media relays directly, room-scoped' },
  { icon: Link2, label: 'Shareable codes', sub: 'Anyone with the code can join' },
];

// The Meet hub — start or join a call from inside PGConnect. Media rides the same
// app-level VideoCall (GlobalCall) via window events, so every feature comes along.
export default function RoomsTab({ friends = [] }) {
  const [code, setCode] = useState('');
  const enabled = callsEnabled();
  const startRoom = (mode) => window.dispatchEvent(new CustomEvent('pg:start-room', { detail: { mode } }));
  const joinRoom = () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    window.dispatchEvent(new CustomEvent('pg:start-room', { detail: { mode: 'join', code: c } }));
    setCode('');
  };
  const callFriend = (f, video) => window.dispatchEvent(new CustomEvent('pg:start-call', { detail: { toUserId: f.id, toName: f.name, video } }));

  return (
    <div className="pgc-rooms">
      <header className="pgc-rooms-hero">
        <h1>Meet</h1>
        <p>Start a video or voice room, or join with a code — no scheduling, no downloads.</p>
        {!enabled ? <span className="pgc-rooms-off">Calls are turned off. Enable them in Account → Calls.</span> : null}
      </header>

      <div className="pgc-rooms-actions">
        <button className="pgc-room-card video" onClick={() => startRoom('video')} disabled={!enabled}>
          <span className="pgc-room-ic"><VideoIcon size={22} /></span>
          <span className="pgc-room-t">New video meeting</span>
          <span className="pgc-room-s">Camera + mic, screen share, backgrounds</span>
          <ArrowRight size={16} className="pgc-room-go" />
        </button>
        <button className="pgc-room-card voice" onClick={() => startRoom('voice')} disabled={!enabled}>
          <span className="pgc-room-ic"><Phone size={22} /></span>
          <span className="pgc-room-t">New voice meeting</span>
          <span className="pgc-room-s">Audio only — light and fast</span>
          <ArrowRight size={16} className="pgc-room-go" />
        </button>
        <div className="pgc-room-card join">
          <span className="pgc-room-ic"><Hash size={22} /></span>
          <span className="pgc-room-t">Join with a code</span>
          <div className="pgc-room-join">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter a code" maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()} disabled={!enabled} />
            <button onClick={joinRoom} disabled={!enabled || code.trim().length < 4}>Join</button>
          </div>
        </div>
      </div>

      <section className="pgc-rooms-section">
        <div className="pgc-group-label"><Users size={13} /> Call a friend</div>
        {friends.length === 0 ? (
          <p className="pgc-empty">No friends yet — add people in the People tab, or share a room code.</p>
        ) : (
          <div className="pgc-rooms-friends">
            {friends.map((f) => (
              <div key={f.id} className="pgc-rooms-friend">
                <Avatar name={f.name} url={f.avatar} size={42} />
                <span className="pgc-rooms-friend-name">{f.name}</span>
                <button className="pgc-rooms-call voice" title={`Voice call ${f.name}`} onClick={() => callFriend(f, false)} disabled={!enabled}><Phone size={15} /></button>
                <button className="pgc-rooms-call video" title={`Video call ${f.name}`} onClick={() => callFriend(f, true)} disabled={!enabled}><VideoIcon size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pgc-rooms-section">
        <div className="pgc-group-label">What's included</div>
        <div className="pgc-rooms-features">
          {FEATURES.map((f) => (
            <div key={f.label} className="pgc-feature">
              <span className="pgc-feature-ic"><f.icon size={18} /></span>
              <div><b>{f.label}</b><span>{f.sub}</span></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
