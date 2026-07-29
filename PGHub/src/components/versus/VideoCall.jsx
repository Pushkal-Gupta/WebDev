import { useEffect, useRef, useState, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare, Send, X, GripVertical, Maximize2, ScreenShare, ScreenShareOff, Wand2 } from 'lucide-react';
import { startVirtualBg } from '../../lib/virtualBg';

const MIN_W = 200, MAX_W = 760, MIN_H = 130, MAX_H = 540;
const DEFAULT_DIMS = { w: 320, h: 214 };
function loadDims() {
  try { const d = JSON.parse(localStorage.getItem('pg_call_dims') || 'null'); if (d && d.w && d.h) return d; } catch { /* ignore */ }
  return DEFAULT_DIMS;
}
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import '../../styles/versus.css';

// STUN finds a direct path; TURN relays media across strict/symmetric NAT (mobile
// carriers, corporate firewalls) so calls still connect. For a reliable cross-network
// call — especially phone-to-phone — a real TURN relay is REQUIRED; set VITE_TURN_URL /
// VITE_TURN_USER / VITE_TURN_CRED (e.g. a free Metered relay key) in production.
// The public OpenRelay fallback only reliably answers on port 80 now (443 is dead), and
// TURN-over-TCP:80 is the most firewall-tolerant, so it goes first.
const env = import.meta.env || {};
const TURN = env.VITE_TURN_URL
  ? [{ urls: String(env.VITE_TURN_URL).split(',').map((s) => s.trim()), username: env.VITE_TURN_USER, credential: env.VITE_TURN_CRED }]
  : [
      { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    ];
const ICE = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.relay.metered.ca:80'] },
    ...TURN,
  ],
};

// A single draggable comms island for a PGBattle match: video call, audio call, and chat.
// All signalling + chat ride one Realtime channel `comms:{code}`. The caller RINGS, the
// callee ACCEPTS (so both have media + a peer connection ready before the SDP/ICE exchange),
// ICE candidates that arrive early are buffered, and a 25s watchdog fails the call cleanly
// instead of hanging on "Connecting…". Whoever starts a call/text pings the other side.
export default function VideoCall({ code, userId, myName = 'You', oppName = 'Rival', autoStart = null, onEnded }) {
  const [pos, setPos] = useState(() => { try { return JSON.parse(localStorage.getItem('pg_call_pos') || 'null'); } catch { return null; } }); // {x,y}; persists where you drop it
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
  const [netState, setNetState] = useState('');    // live ICE connection state readout
  const [dims, setDims] = useState(loadDims);      // free-resizable call window {w,h}
  const [localBox, setLocalBox] = useState(() => { try { return JSON.parse(localStorage.getItem('pg_call_localbox') || 'null'); } catch { return null; } }); // draggable+resizable self-view
  const [speaking, setSpeaking] = useState(false); // local voice activity (mic pulse)
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [sharing, setSharing] = useState(false);   // screen share active
  const [bg, setBg] = useState('none');            // virtual background: none | blur
  const [bgBusy, setBgBusy] = useState(false);
  const screenStreamRef = useRef(null);
  const camTrackRef = useRef(null);
  const bgProcRef = useRef(null);
  const relayFound = useRef(false);                // did we ever gather a TURN relay candidate?
  const micOnRef = useRef(true);
  micOnRef.current = micOn;
  // Free drag-to-resize (like the Meet screen-share window): drag the corner handle to any
  // size within sane bounds; the dimensions persist.
  const onResizeStart = (e) => {
    e.preventDefault(); e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, w: dims.w, h: dims.h };
    let latest = dims;
    const move = (ev) => {
      latest = {
        w: Math.round(Math.min(MAX_W, Math.max(MIN_W, start.w + (ev.clientX - start.x)))),
        h: Math.round(Math.min(MAX_H, Math.max(MIN_H, start.h + (ev.clientY - start.y)))),
      };
      setDims(latest);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      try { localStorage.setItem('pg_call_dims', JSON.stringify(latest)); } catch { /* private */ }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const toggleFullscreen = () => {
    const el = stageEl.current; if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  };

  const chanRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localVidEl = useRef(null);
  const remoteVidEl = useRef(null);
  const remoteAudEl = useRef(null);
  const stageEl = useRef(null);
  const pendingIce = useRef([]);
  const watchdog = useRef(null);
  const chatEndRef = useRef(null);
  const dragRef = useRef(null);
  const onEndedRef = useRef(null);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  const send = useCallback((obj) => chanRef.current?.send({ type: 'broadcast', event: 'comms', payload: { from: userId, name: myName, ...obj } }), [userId, myName]);

  const teardown = useCallback((announce) => {
    clearTimeout(watchdog.current);
    if (announce) send({ t: 'bye' });
    try { pcRef.current?.close(); } catch { /* noop */ }
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null; remoteRef.current = null;
    pendingIce.current = [];
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null; camTrackRef.current = null;
    bgProcRef.current?.stop(); bgProcRef.current = null;
    if (remoteVidEl.current) remoteVidEl.current.srcObject = null;
    if (remoteAudEl.current) remoteAudEl.current.srcObject = null;
    if (localVidEl.current) localVidEl.current.srcObject = null;
    setCall('idle'); setIncoming(null); setNetState(''); setSharing(false); setBg('none');
    onEndedRef.current?.();
  }, [send]);

  const getMedia = async (video) => {
    // Explicit audio processing so the browser applies AEC/NS/AGC — without these some
    // browsers hand back raw mic audio, which causes the echo + muddy voice the user heard.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      video,
    });
    localRef.current = stream;
    setMicOn(true); setCamOn(video);
    if (localVidEl.current) { localVidEl.current.muted = true; localVidEl.current.srcObject = stream; }
    return stream;
  };

  const flushIce = useCallback(async () => {
    const pc = pcRef.current; if (!pc || !pc.remoteDescription) return;
    const q = pendingIce.current; pendingIce.current = [];
    for (const c of q) { try { await pc.addIceCandidate(c); } catch { /* stale candidate */ } }
  }, []);

  const makePc = useCallback((stream) => {
    relayFound.current = false;
    const pc = new RTCPeerConnection(ICE);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      // Track whether a TURN relay candidate was ever gathered — if the call fails
      // WITHOUT one, the TURN server is unreachable (the common cross-network failure).
      if (e.candidate.type === 'relay' || / typ relay /.test(e.candidate.candidate || '')) relayFound.current = true;
      send({ t: 'ice', candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      remoteRef.current = stream;
      // Audio always plays through the dedicated <audio> element (present in both video and
      // voice modes); the remote <video> is muted so we never get two overlapping audio outputs.
      // Explicitly play() + unmute — otherwise the browser's autoplay policy silently blocks the
      // audio element (the "video comes but no audio" bug), even though the muted video plays.
      if (remoteAudEl.current) {
        remoteAudEl.current.srcObject = stream;
        remoteAudEl.current.muted = false;
        remoteAudEl.current.volume = 1;
        remoteAudEl.current.play?.().catch(() => {});
      }
      if (remoteVidEl.current) {
        // React's `muted` JSX attr is unreliable on <video> — set it imperatively, or the
        // video element ALSO plays the remote audio on top of the <audio> sink, which the
        // user hears as an echo/replay on the call.
        remoteVidEl.current.muted = true;
        remoteVidEl.current.srcObject = stream;
        remoteVidEl.current.play?.().catch(() => {});
      }
      clearTimeout(watchdog.current); setCall('live');
    };
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      setNetState(s);
      if (s === 'failed') {
        // Distinguish "no relay path at all" from a transient failure so the user knows
        // whether to blame TURN config vs. a flaky network.
        setErr(relayFound.current
          ? 'Call failed — the media connection could not be established.'
          : 'Call failed — no TURN relay was reachable. A relay server is needed for cross-network calls.');
        teardown(false);
      }
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'failed') { setErr((prev) => prev || 'Call dropped — the connection failed.'); teardown(false); }
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
            // Calls are strictly 1:1 per room, so a ring while already engaged is ALWAYS the
            // same caller re-ringing (universal-call retry) — ignore it silently. Replying
            // "busy" here would tear down the call the instant it connects.
            if (pcRef.current) break;
            setIncoming((cur) => (cur && cur.from === payload.from) ? cur : { from: payload.from, name: payload.name, video: payload.video });
            setCall((c) => (c === 'live' || c === 'connecting') ? c : 'incoming');
            break;
          case 'accept': {  // callee accepted → we (caller) create the offer
            const stream = localRef.current; if (!stream) break;
            setCall('connecting');  // stop the universal-call re-ring; we're negotiating now
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

  // Universal calling: the caller (autoStart set) rings on a short interval until answered,
  // so a callee that opens the call a moment after the invite still catches a ring.
  useEffect(() => {
    if (!autoStart) return undefined;
    let stop = false;
    const ring = () => {
      if (stop) return;
      if (call === 'idle') startCall(autoStart === 'video');
      else if (call === 'ringing') send({ t: 'ring', video: autoStart === 'video' });
    };
    const t0 = setTimeout(ring, 500);
    const iv = setInterval(ring, 2200);
    return () => { stop = true; clearTimeout(t0); clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, call]);
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

  const stopScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    const sender = pc?.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender && camTrackRef.current) { try { await sender.replaceTrack(camTrackRef.current); } catch { /* gone */ } }
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null; camTrackRef.current = null;
    if (localVidEl.current) { localVidEl.current.muted = true; localVidEl.current.srcObject = localRef.current; }
    setSharing(false);
  }, []);

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) { setErr('Screen sharing is not supported in this browser.'); return; }
    if (bg !== 'none') await clearBg();   // screen share and virtual background are mutually exclusive
    let ds;
    try { ds = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }); }
    catch { return; } // user cancelled the picker
    const screenTrack = ds.getVideoTracks()[0];
    if (!screenTrack) return;
    screenStreamRef.current = ds;
    const pc = pcRef.current;
    const sender = pc?.getSenders().find((s) => s.track && s.track.kind === 'video');
    try {
      if (sender) {
        camTrackRef.current = sender.track;          // remember camera to restore later
        await sender.replaceTrack(screenTrack);      // no renegotiation needed
      } else if (pc) {
        pc.addTrack(screenTrack, ds);                // voice call → add video + renegotiate
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ t: 'offer', sdp: offer });
      }
    } catch { /* sender race */ }
    if (localVidEl.current) { localVidEl.current.muted = true; localVidEl.current.srcObject = ds; }
    setSharing(true);
    screenTrack.onended = () => { stopScreenShare(); };
  };
  const toggleScreenShare = () => (sharing ? stopScreenShare() : startScreenShare());

  // Virtual background — swaps the outgoing camera track for a segmentation-composited one.
  const videoSender = () => pcRef.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
  const clearBg = useCallback(async () => {
    bgProcRef.current?.stop(); bgProcRef.current = null;
    const cam = localRef.current?.getVideoTracks()[0];
    const sender = videoSender();
    if (sender && cam) { try { await sender.replaceTrack(cam); } catch { /* gone */ } }
    if (localVidEl.current) { localVidEl.current.muted = true; localVidEl.current.srcObject = localRef.current; }
    setBg('none');
  }, []);
  const applyBg = async () => {
    const cam = localRef.current?.getVideoTracks()[0];
    if (!cam) return;
    setBgBusy(true); setErr('');
    try {
      const proc = await startVirtualBg(cam, 'blur');
      bgProcRef.current?.stop();
      bgProcRef.current = proc;
      const sender = videoSender();
      if (sender) await sender.replaceTrack(proc.track);
      if (localVidEl.current) { localVidEl.current.muted = true; localVidEl.current.srcObject = new MediaStream([proc.track]); }
      setBg('blur');
    } catch { setErr('Background effect could not load — using your normal camera.'); }
    setBgBusy(false);
  };
  const toggleBg = () => { if (bgBusy) return; return bg === 'none' ? applyBg() : clearBg(); };

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
    let latest = origin;
    const move = (ev) => {
      const w = dragRef.current?.offsetWidth || base.width || 0;
      const h = dragRef.current?.offsetHeight || base.height || 0;
      const maxX = Math.max(6, window.innerWidth - w - 6);
      const maxY = Math.max(70, window.innerHeight - h - 6);
      latest = {
        x: Math.min(maxX, Math.max(6, origin.x + ev.clientX - start.x)),
        y: Math.min(maxY, Math.max(70, origin.y + ev.clientY - start.y)),
      };
      setPos(latest);
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      try { localStorage.setItem('pg_call_pos', JSON.stringify(latest)); } catch { /* private */ }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // Double-click the grip to reset the call window to its default place + size.
  const resetLayout = () => {
    setPos(null); setDims(DEFAULT_DIMS); setLocalBox(null);
    try { localStorage.removeItem('pg_call_pos'); localStorage.removeItem('pg_call_dims'); localStorage.removeItem('pg_call_localbox'); } catch { /* private */ }
  };

  // Self-view ("You") picture-in-picture: draggable anywhere in the call window and
  // resizable via its own corner — fully under the user's control, position+size persist.
  const localDims = () => {
    const w = Math.round(localBox?.w || Math.min(150, Math.round(dims.w * 0.42)));
    const h = Math.round(w * 0.72);
    let x = localBox?.x ?? (dims.w - w - 10);
    let y = localBox?.y ?? 10;
    x = Math.min(Math.max(4, x), Math.max(4, dims.w - w - 4));
    y = Math.min(Math.max(4, y), Math.max(4, dims.h - h - 4));
    return { x, y, w, h };
  };
  const onLocalDrag = (e) => {
    e.stopPropagation();
    const b = localDims();
    const start = { x: e.clientX, y: e.clientY };
    let latest = { x: b.x, y: b.y, w: b.w };
    const move = (ev) => {
      const x = Math.min(dims.w - b.w - 4, Math.max(4, b.x + ev.clientX - start.x));
      const y = Math.min(dims.h - b.h - 4, Math.max(4, b.y + ev.clientY - start.y));
      latest = { x, y, w: b.w };
      setLocalBox(latest);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); try { localStorage.setItem('pg_call_localbox', JSON.stringify(latest)); } catch { /* private */ } };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const onLocalResize = (e) => {
    e.stopPropagation(); e.preventDefault();
    const b = localDims();
    const start = { x: e.clientX };
    let latest = { x: b.x, y: b.y, w: b.w };
    const move = (ev) => {
      const nw = Math.min(Math.min(340, dims.w - b.x - 4), Math.max(70, b.w + ev.clientX - start.x));
      latest = { x: b.x, y: b.y, w: nw };
      setLocalBox(latest);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); try { localStorage.setItem('pg_call_localbox', JSON.stringify(latest)); } catch { /* private */ } };
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

  // Voice-activity animation: sample local + remote loudness via Web Audio, flip a
  // boolean when someone crosses the talking threshold (only re-renders on change).
  useEffect(() => {
    if (call !== 'live') { setSpeaking(false); setRemoteSpeaking(false); return undefined; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return undefined;
    const ctx = new AC();
    ctx.resume?.();
    const analyser = (stream) => {
      if (!stream || !stream.getAudioTracks || !stream.getAudioTracks().length) return null;
      try { const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = 0.7; src.connect(an); return an; }
      catch { return null; }
    };
    const la = analyser(localRef.current), ra = analyser(remoteRef.current);
    const buf = new Uint8Array(128);
    const loud = (an) => { if (!an) return 0; an.getByteFrequencyData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i]; return (s / buf.length) / 80; };
    let raf, lastL = false, lastR = false;
    const tick = () => {
      const l = micOnRef.current && loud(la) > 0.06;
      const r = loud(ra) > 0.06;
      if (l !== lastL) { lastL = l; setSpeaking(l); }
      if (r !== lastR) { lastR = r; setRemoteSpeaking(r); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); try { ctx.close(); } catch { /* already closed */ } };
  }, [call]);

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

      {/* call window (Google-Meet style) — free drag-to-resize via the corner handle */}
      {inCall ? (
        <div className={`vs-meet ${wantVideo ? '' : 'audio'}`} style={{ width: dims.w }}>
          <div className={`vs-meet-stage ${remoteSpeaking ? 'speaking' : ''}`} ref={stageEl} style={{ height: dims.h }}>
            {wantVideo ? <video ref={remoteVidEl} className="vs-meet-remote" autoPlay playsInline muted /> : <div className={`vs-meet-avatar ${remoteSpeaking ? 'speaking' : ''}`}><span>{(oppName || 'R').slice(0, 1).toUpperCase()}</span></div>}
            {/* single audio sink for the remote peer — works for both video and voice-only calls */}
            <audio ref={remoteAudEl} autoPlay />
            <div className="vs-meet-name">{oppName}</div>
            {wantVideo ? (() => { const lb = localDims(); return (
              <div className="vs-meet-local" style={{ left: lb.x, top: lb.y, width: lb.w, height: lb.h }} onPointerDown={onLocalDrag} title="Drag to move · resize from the corner">
                <video ref={localVidEl} autoPlay playsInline muted />
                <span className="vs-meet-local-tag">You</span>
                <div className="vs-meet-local-resize" onPointerDown={onLocalResize} title="Resize your view" />
              </div>
            ); })() : null}
            {call !== 'live' ? <div className="vs-meet-status">{call === 'ringing' ? 'Ringing…' : (netState === 'checking' ? 'Connecting… (finding a path)' : 'Connecting…')}</div> : null}
            <div className="vs-meet-resize" onPointerDown={onResizeStart} title="Drag to resize the window"><span /></div>
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
        <button className="vs-island-grip" onPointerDown={onDragStart} onDoubleClick={resetLayout} title="Drag to move · double-click to reset"><GripVertical size={15} /></button>
        {inCall ? (
          <>
            <button className={`vs-island-btn ${micOn ? '' : 'off'} ${micOn && speaking ? 'talking' : ''}`} onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'}>{micOn ? <Mic size={16} /> : <MicOff size={16} />}</button>
            {wantVideo ? <button className={`vs-island-btn ${camOn ? '' : 'off'}`} onClick={toggleCam} title={camOn ? 'Camera off' : 'Camera on'}>{camOn ? <Video size={16} /> : <VideoOff size={16} />}</button> : null}
            {wantVideo ? <button className={`vs-island-btn ${bg !== 'none' ? 'on' : ''}`} onClick={toggleBg} disabled={bgBusy} title={bg === 'none' ? 'Blur background' : 'Turn off background'}><Wand2 size={15} /></button> : null}
            <button className={`vs-island-btn ${sharing ? 'on' : ''}`} onClick={toggleScreenShare} title={sharing ? 'Stop sharing' : 'Share screen'}>{sharing ? <ScreenShareOff size={15} /> : <ScreenShare size={15} />}</button>
            {wantVideo ? <button className="vs-island-btn" onClick={toggleFullscreen} title="Fullscreen"><Maximize2 size={15} /></button> : null}
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
