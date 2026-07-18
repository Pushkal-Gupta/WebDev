import { useEffect, useRef, useState, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare, Send, X, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import '../../styles/versus.css';

// STUN finds a direct path; TURN relays media across strict/symmetric NAT so calls still
// connect. Defaults to free public OpenRelay TURN (public creds, not secrets); override with
// VITE_TURN_URL / VITE_TURN_USER / VITE_TURN_CRED for a private relay.
const env = import.meta.env || {};
const TURN = env.VITE_TURN_URL
  ? [{ urls: env.VITE_TURN_URL, username: env.VITE_TURN_USER, credential: env.VITE_TURN_CRED }]
  : [
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    ];
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, ...TURN] };

// A single draggable comms island for a PGBattle match: video call, audio call, and chat.
// All signalling + chat ride one Realtime channel `comms:{code}`. The caller RINGS, the
// callee ACCEPTS (so both have media + a peer connection ready before the SDP/ICE exchange),
// ICE candidates that arrive early are buffered, and a 25s watchdog fails the call cleanly
// instead of hanging on "Connecting…". Whoever starts a call/text pings the other side.
export default function VideoCall({ code, userId, myName = 'You', oppName = 'Rival' }) {
  const [pos, setPos] = useState(null);            // {x,y} once dragged; null = default anchor
  const [call, setCall] = useState('idle');        // idle | ringing | incoming | connecting | live
  const [wantVideo, setWantVideo] = useState(true);
  const [incoming, setIncoming] = useState(null);  // {from,name,video}
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState('');
  const [unread, setUnread] = useState(0);
  const [err, setErr] = useState('');

  const chanRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localVidEl = useRef(null);
  const remoteVidEl = useRef(null);
  const pendingIce = useRef([]);
  const watchdog = useRef(null);
  const chatEndRef = useRef(null);
  const dragRef = useRef(null);

  const send = useCallback((obj) => chanRef.current?.send({ type: 'broadcast', event: 'comms', payload: { from: userId, name: myName, ...obj } }), [userId, myName]);

  const teardown = useCallback((announce) => {
    clearTimeout(watchdog.current);
    if (announce) send({ t: 'bye' });
    try { pcRef.current?.close(); } catch { /* noop */ }
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null; remoteRef.current = null;
    pendingIce.current = [];
    if (remoteVidEl.current) remoteVidEl.current.srcObject = null;
    if (localVidEl.current) localVidEl.current.srcObject = null;
    setCall('idle'); setIncoming(null);
  }, [send]);

  const getMedia = async (video) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localRef.current = stream;
    setMicOn(true); setCamOn(video);
    if (localVidEl.current) localVidEl.current.srcObject = stream;
    return stream;
  };

  const flushIce = useCallback(async () => {
    const pc = pcRef.current; if (!pc || !pc.remoteDescription) return;
    const q = pendingIce.current; pendingIce.current = [];
    for (const c of q) { try { await pc.addIceCandidate(c); } catch { /* stale candidate */ } }
  }, []);

  const makePc = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => { if (e.candidate) send({ t: 'ice', candidate: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      remoteRef.current = e.streams[0];
      if (remoteVidEl.current) remoteVidEl.current.srcObject = e.streams[0];
      clearTimeout(watchdog.current); setCall('live');
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'failed') { setErr('Call dropped — the connection failed.'); teardown(false); }
      else if (s === 'disconnected' || s === 'closed') setCall((c) => (c === 'live' ? 'idle' : c));
    };
    pcRef.current = pc;
    return pc;
  }, [send, teardown]);

  const armWatchdog = useCallback(() => {
    clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => { setCall((c) => { if (c !== 'live' && c !== 'idle') { setErr("Couldn't connect — your rival may be offline or behind a strict firewall."); teardown(true); } return c; }); }, 25000);
  }, [teardown]);

  // channel: signalling + chat + presence-less pings
  useEffect(() => {
    if (!code || !userId) return;
    const ch = supabase.channel(`comms:${code}`, { config: { broadcast: { self: false } } });
    chanRef.current = ch;
    ch.on('broadcast', { event: 'comms' }, async ({ payload }) => {
      if (payload.from === userId) return;
      try {
        switch (payload.t) {
          case 'chat':
            setChat((c) => [...c, { mine: false, body: payload.body }]);
            setChatOpen((o) => { if (!o) setUnread((u) => u + 1); return o; });
            break;
          case 'ring':
            if (pcRef.current || call !== 'idle') { send({ t: 'busy' }); break; }
            setIncoming({ from: payload.from, name: payload.name, video: payload.video }); setCall('incoming');
            break;
          case 'accept': {  // callee accepted → we (caller) create the offer
            const stream = localRef.current; if (!stream) break;
            const pc = makePc(stream);
            const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
            send({ t: 'offer', sdp: offer }); armWatchdog();
            break;
          }
          case 'offer': {   // we (callee) already have media+pc from accepting
            let pc = pcRef.current; if (!pc) break;
            await pc.setRemoteDescription(payload.sdp);
            const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
            send({ t: 'answer', sdp: ans }); await flushIce();
            break;
          }
          case 'answer':
            if (pcRef.current) { await pcRef.current.setRemoteDescription(payload.sdp); await flushIce(); }
            break;
          case 'ice':
            if (pcRef.current?.remoteDescription) { try { await pcRef.current.addIceCandidate(payload.candidate); } catch { /* stale */ } }
            else pendingIce.current.push(payload.candidate);
            break;
          case 'busy':
            setErr('Your rival is already on a call.'); teardown(false); break;
          case 'decline':
            setErr('Call declined.'); teardown(false); break;
          case 'bye':
            teardown(false); break;
          default: break;
        }
      } catch (e) { setErr(friendlyError(e, 'Call error.')); }
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); teardown(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, userId]);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ block: 'nearest' }); }, [chat, chatOpen]);
  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  // caller: grab media, ring the rival
  const startCall = async (video) => {
    if (call !== 'idle') return;
    setErr(''); setWantVideo(video); setCall('ringing');
    try { await getMedia(video); } catch { setErr('Camera/microphone blocked — allow access to call.'); setCall('idle'); return; }
    send({ t: 'ring', video }); armWatchdog();
  };
  // callee: accept an incoming ring
  const accept = async () => {
    if (!incoming) return;
    setErr(''); setWantVideo(incoming.video); setCall('connecting');
    try { await getMedia(incoming.video); } catch { setErr('Camera/microphone blocked — allow access to answer.'); teardown(true); return; }
    makePc(localRef.current);              // callee is the answerer; pc ready before offer
    send({ t: 'accept' }); setIncoming(null); armWatchdog();
  };
  const decline = () => { send({ t: 'decline' }); teardown(false); };

  const toggleMic = () => { const t = localRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); } };
  const toggleCam = () => { const t = localRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCamOn(t.enabled); } };

  const sendChat = (e) => {
    e?.preventDefault();
    const body = draft.trim(); if (!body) return;
    setDraft(''); setChat((c) => [...c, { mine: true, body }]);
    send({ t: 'chat', body });
  };

  // drag the island — clamped to the viewport on BOTH axes so it can never be
  // dragged off-screen and get stuck out of reach.
  const onDragStart = (e) => {
    const start = { x: e.clientX, y: e.clientY };
    const base = dragRef.current.getBoundingClientRect();
    const origin = pos || { x: base.left, y: base.top };
    const move = (ev) => {
      const w = dragRef.current?.offsetWidth || base.width || 0;
      const h = dragRef.current?.offsetHeight || base.height || 0;
      const maxX = Math.max(6, window.innerWidth - w - 6);
      const maxY = Math.max(70, window.innerHeight - h - 6);
      const x = Math.min(maxX, Math.max(6, origin.x + ev.clientX - start.x));
      const y = Math.min(maxY, Math.max(70, origin.y + ev.clientY - start.y));
      setPos({ x, y });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // If the window resizes (or the island grew) such that it now sits off-screen,
  // snap it back into view so the controls are always reachable.
  useEffect(() => {
    if (!pos) return undefined;
    const clampIntoView = () => {
      const el = dragRef.current; if (!el) return;
      const w = el.offsetWidth, h = el.offsetHeight;
      setPos((p) => {
        if (!p) return p;
        const x = Math.min(Math.max(6, window.innerWidth - w - 6), Math.max(6, p.x));
        const y = Math.min(Math.max(70, window.innerHeight - h - 6), Math.max(70, p.y));
        return (x === p.x && y === p.y) ? p : { x, y };
      });
    };
    clampIntoView();
    window.addEventListener('resize', clampIntoView);
    return () => window.removeEventListener('resize', clampIntoView);
  }, [pos, call, chatOpen]);

  const style = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined;
  const inCall = call === 'ringing' || call === 'connecting' || call === 'live';

  return (
    <div className="vs-island" ref={dragRef} style={style}>
      {/* incoming-call ping */}
      {call === 'incoming' && incoming ? (
        <div className="vs-ring">
          <div className="vs-ring-ic">{incoming.video ? <Video size={18} /> : <Phone size={18} />}</div>
          <div className="vs-ring-txt"><b>{incoming.name || oppName}</b><span>Incoming {incoming.video ? 'video' : 'voice'} call</span></div>
          <button className="vs-ring-accept" onClick={accept}><Phone size={15} /></button>
          <button className="vs-ring-decline" onClick={decline}><PhoneOff size={15} /></button>
        </div>
      ) : null}

      {/* call window (Google-Meet style) */}
      {inCall ? (
        <div className={`vs-meet ${wantVideo ? '' : 'audio'}`}>
          <div className="vs-meet-stage">
            {wantVideo ? <video ref={remoteVidEl} className="vs-meet-remote" autoPlay playsInline /> : <div className="vs-meet-avatar"><span>{(oppName || 'R').slice(0, 1).toUpperCase()}</span></div>}
            <div className="vs-meet-name">{oppName}</div>
            {wantVideo ? <video ref={localVidEl} className="vs-meet-local" autoPlay playsInline muted /> : null}
            {call !== 'live' ? <div className="vs-meet-status">{call === 'ringing' ? 'Ringing…' : 'Connecting…'}</div> : null}
          </div>
        </div>
      ) : null}

      {/* chat panel */}
      {chatOpen ? (
        <div className="vs-island-chat">
          <div className="vs-chat-head"><MessageSquare size={14} /> {oppName}<button className="vs-chat-x" onClick={() => setChatOpen(false)}><X size={14} /></button></div>
          <div className="vs-chat-body">
            {chat.length === 0 ? <p className="vs-chat-empty">Say something to your rival…</p>
              : chat.map((m, i) => <div key={i} className={`vs-chat-msg ${m.mine ? 'mine' : 'theirs'}`}>{m.body}</div>)}
            <div ref={chatEndRef} />
          </div>
          <form className="vs-chat-compose" onSubmit={sendChat}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message…" maxLength={500} />
            <button type="submit" disabled={!draft.trim()}><Send size={14} /></button>
          </form>
        </div>
      ) : null}

      {err ? <div className="vs-island-err" onClick={() => setErr('')}>{err}</div> : null}

      {/* one movable island — start buttons when idle, call controls when live */}
      <div className="vs-island-bar">
        <button className="vs-island-grip" onPointerDown={onDragStart} title="Drag"><GripVertical size={15} /></button>
        {inCall ? (
          <>
            <button className={`vs-island-btn ${micOn ? '' : 'off'}`} onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'}>{micOn ? <Mic size={16} /> : <MicOff size={16} />}</button>
            {wantVideo ? <button className={`vs-island-btn ${camOn ? '' : 'off'}`} onClick={toggleCam} title={camOn ? 'Camera off' : 'Camera on'}>{camOn ? <Video size={16} /> : <VideoOff size={16} />}</button> : null}
            <button className="vs-island-btn end" onClick={() => teardown(true)} title="Hang up"><PhoneOff size={16} /></button>
          </>
        ) : (
          <>
            <button className="vs-island-btn" onClick={() => startCall(true)} title="Start video call"><Video size={16} /></button>
            <button className="vs-island-btn" onClick={() => startCall(false)} title="Start voice call"><Phone size={16} /></button>
          </>
        )}
        <button className={`vs-island-btn ${chatOpen ? 'on' : ''}`} onClick={() => setChatOpen((o) => !o)} title="Chat">
          <MessageSquare size={16} />{unread > 0 && !chatOpen ? <span className="vs-island-badge">{unread}</span> : null}
        </button>
      </div>
    </div>
  );
}
