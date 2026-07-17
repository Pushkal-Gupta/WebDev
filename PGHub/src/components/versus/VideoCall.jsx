import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import '../../styles/versus.css';

// Peer-to-peer voice/video for a PGBattle match. Signalling (offer/answer/ICE) rides a
// dedicated Realtime channel `rtc:{code}` so it never touches the match channel. STUN-only
// (Google public STUN) — works on most home/office networks; symmetric-NAT peers would need
// a TURN relay (not configured). The HOST is the deterministic offerer.
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

export default function VideoCall({ code, userId }) {
  const [callState, setCallState] = useState('idle'); // idle | calling | live
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [err, setErr] = useState('');

  const pcRef = useRef(null);
  const chanRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const cleanup = useCallback(() => {
    try { pcRef.current?.close(); } catch { /* noop */ }
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  // one persistent signalling channel for the pair
  useEffect(() => {
    if (!code || !userId) return;
    const ch = supabase.channel(`rtc:${code}`, { config: { broadcast: { self: false } } });
    chanRef.current = ch;
    ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (payload.from === userId) return;
      try {
        const pc = pcRef.current;
        if (payload.kind === 'offer') {
          // callee side: someone is calling us
          if (!pc) await startCall(false, payload.sdp);
          else { await pc.setRemoteDescription(payload.sdp); const a = await pc.createAnswer(); await pc.setLocalDescription(a); send({ kind: 'answer', sdp: a }); }
        } else if (payload.kind === 'answer' && pc) {
          await pc.setRemoteDescription(payload.sdp);
        } else if (payload.kind === 'ice' && pc && payload.candidate) {
          try { await pc.addIceCandidate(payload.candidate); } catch { /* candidate may arrive early */ }
        } else if (payload.kind === 'bye') {
          endCall(false);
        }
      } catch (e) { setErr(e.message || 'Call error'); }
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, userId]);

  const send = (obj) => chanRef.current?.send({ type: 'broadcast', event: 'signal', payload: { from: userId, ...obj } });

  const makePc = (stream) => {
    const pc = new RTCPeerConnection(ICE);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => { if (e.candidate) send({ kind: 'ice', candidate: e.candidate }); };
    pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; setCallState('live'); };
    pc.onconnectionstatechange = () => { if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) setCallState((s) => (s === 'live' ? 'idle' : s)); };
    return pc;
  };

  // caller=true → we initiate (send offer). caller=false → we answer an incoming offer.
  async function startCall(caller, incomingOffer) {
    setErr(''); setCallState('calling');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); }
    catch { setErr('Camera/mic blocked. Allow access to call.'); setCallState('idle'); return; }
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    const pc = makePc(stream);
    pcRef.current = pc;
    if (caller) {
      const o = await pc.createOffer(); await pc.setLocalDescription(o); send({ kind: 'offer', sdp: o });
    } else if (incomingOffer) {
      await pc.setRemoteDescription(incomingOffer); const a = await pc.createAnswer(); await pc.setLocalDescription(a); send({ kind: 'answer', sdp: a });
    }
  }

  const endCall = (announce = true) => {
    if (announce) send({ kind: 'bye' });
    cleanup();
    setCallState('idle');
  };

  const toggleMic = () => { const t = localStreamRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); } };
  const toggleCam = () => { const t = localStreamRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setCamOn(t.enabled); } };

  return (
    <div className={`vs-call ${callState !== 'idle' ? 'active' : ''}`}>
      {callState !== 'idle' && (
        <div className="vs-call-videos">
          <video ref={remoteVideoRef} className="vs-call-remote" autoPlay playsInline />
          <video ref={localVideoRef} className="vs-call-local" autoPlay playsInline muted />
          {callState === 'calling' ? <div className="vs-call-status">Connecting…</div> : null}
        </div>
      )}
      <div className="vs-call-controls">
        {callState === 'idle' ? (
          <button className="vs-call-btn start" onClick={() => startCall(true)} title="Start voice + video call"><Phone size={15} /> Call</button>
        ) : (
          <>
            <button className={`vs-call-btn ${micOn ? '' : 'off'}`} onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'}>{micOn ? <Mic size={15} /> : <MicOff size={15} />}</button>
            <button className={`vs-call-btn ${camOn ? '' : 'off'}`} onClick={toggleCam} title={camOn ? 'Camera off' : 'Camera on'}>{camOn ? <Video size={15} /> : <VideoOff size={15} />}</button>
            <button className="vs-call-btn end" onClick={() => endCall(true)} title="Hang up"><PhoneOff size={15} /></button>
          </>
        )}
      </div>
      {err ? <div className="vs-call-err">{err}</div> : null}
    </div>
  );
}
