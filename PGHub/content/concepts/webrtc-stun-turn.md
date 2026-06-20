---
slug: webrtc-stun-turn
module: sd-network
title: WebRTC STUN and TURN
subtitle: How two browsers behind different home NATs negotiate a peer-to-peer media path, and what to do when symmetric NAT says no.
difficulty: Advanced
position: 55
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "highscalability.com — Real-Time Architectures"
    url: "http://highscalability.com/"
    type: blog
  - title: "GeeksforGeeks — STUN and TURN"
    url: "https://www.geeksforgeeks.org/what-is-stun-server/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
WebRTC lets two browsers stream audio, video, or arbitrary data peer-to-peer without an intermediary proxying every packet. The hard part is not the codecs (Opus, VP9) — it is *connection establishment*. Both peers sit behind home routers doing NAT, so neither has a public IP. STUN servers (a public IP, a UDP echo) let each peer discover what its NAT-translated public address looks like. TURN servers (a public IP, a media relay) are the fallback for NAT topologies where no direct path exists. ICE is the algorithm that tries every candidate path and picks the best.

## whyItMatters
Every video-call product — Zoom, Google Meet, Discord, FaceTime, Twitch Whispers — runs the same STUN/TURN dance. Get it wrong and 5-15% of your calls (the symmetric-NAT users) silently fail to connect. TURN bandwidth is also the single biggest cost line of any consumer video app, because every relayed minute is media you pay for. Senior interviews on "design a video calling app" expect you to compare mesh / SFU / MCU and to explain when TURN cost dominates.

## intuition
Three NAT outcomes:
- *Full-cone* or *restricted-cone* — the NAT keeps a stable mapping; STUN discovers it; peer-to-peer works directly.
- *Port-restricted-cone* — works with hole punching: both sides send a packet simultaneously and the NAT opens a pinhole.
- *Symmetric NAT* — the NAT picks a *different* external port for every destination, so the address peer A learns via STUN does not match the address NAT-A uses to talk to peer B. Hole punching fails. TURN is mandatory.

ICE collects all candidate addresses (host, server-reflexive via STUN, relay via TURN), pairs them, and runs connectivity checks until the first pair succeeds. Each peer prefers the candidate with the lowest priority value — usually a direct host pair, then srflx, then relay last.

## visualization
```
Peer A (NAT-A)                  STUN srv                 Peer B (NAT-B)
   |--- Binding Request --->      |
   |<-- Mapped Addr: 1.2.3.4:55 --|
   |                                                         |
   |---------- offer (SDP + ICE candidates: host+srflx) ---->|  (via signaling server)
   |<--------- answer (SDP + ICE candidates) ----------------|
   |
   |--- STUN check 10.0.0.5:50 (host pair) ---X    (fails: behind NAT)
   |--- STUN check 1.2.3.4:55 -> 5.6.7.8:60 (srflx pair) -- success
   |
   |==== media (SRTP) flows directly peer-to-peer ====|

If both NATs are symmetric:
   |--- TURN Allocate -----> | (returns 9.9.9.9:7000 as relay)
   |--- media to 9.9.9.9:7000 -- relay -- 9.9.9.9 -> Peer B's relay -- Peer B
```

## bruteForce
"Just route every call through a central media server." Easy to build, doubles your bandwidth bill, adds 30-80 ms of latency, and forces every byte of HD video through your datacenter. For 1:1 calling this is wasteful; for 6+ party calls a media server (SFU) is correct because P2P mesh becomes O(N^2) uplink. The bruteForce is using a media server when STUN would have worked.

## optimal
- Always offer host + srflx + relay candidates. Let ICE pick.
- Run STUN as a tiny stateless UDP service — it costs almost nothing (Google runs free public STUN on port 19302).
- Run TURN with `coturn`, authenticated by short-lived credentials minted by your backend (REST-based TURN credentials, RFC 7635).
- TURN over TLS on port 443 as a last resort — punches through corporate firewalls that block UDP entirely.
- For multi-party (>=4 peers), switch to an SFU (selective forwarding unit like mediasoup, Janus, LiveKit). Each peer sends one stream up and receives N-1 down without re-encoding.
- Monitor `selected_candidate_pair_type` in `RTCPeerConnection.getStats()` — track relay% as a cost metric.

## complexity
time: ICE gathering completes in 1-3 seconds typically; checks fan out in parallel.
space: O(C^2) candidate pairs where C is per-peer candidates (usually <10), bounded and small.
notes: Relayed traffic costs roughly 1 GB / hour for 720p video per participant pair. Symmetric NAT prevalence is ~8% on consumer ISPs and much higher (~30%) on cellular and corporate networks — assume TURN is non-optional.

## pitfalls
- No TURN server — your call quality looks fine in dev (you and your laptop are on the same WiFi) and breaks in production for the symmetric-NAT slice.
- Long-lived TURN credentials in client code — extracted and used to mine your bandwidth budget. Mint per-call, expire in 1 hour.
- Forgetting TURN/443 fallback — corporate firewalls block UDP and your call never starts.
- Trusting `getUserMedia()` permissions silently — Safari and Firefox have different permission models; handle the rejection case.
- Not tearing down `RTCPeerConnection` on call end — leaks media tracks and keeps the camera light on.
- ICE restart not implemented — network change (Wi-Fi to LTE) drops the call instead of reconnecting.

## interviewTips
- Define STUN (discover NAT mapping) vs TURN (relay media when P2P fails) — two sentences.
- Mention the symmetric NAT case explicitly; this is the question behind the question.
- Sketch the offer/answer + ICE candidate exchange via signaling server (anything: WebSocket, Firestore, SSE).
- For >2 peers, pivot to SFU. Explain mesh's O(N^2) uplink problem.
- TURN cost is the operational story — short-lived creds, region selection, fall back to TLS/443.

## code.python
```python
# aiortc — server peer joining a call
import asyncio
from aiortc import RTCPeerConnection, RTCConfiguration, RTCIceServer, RTCSessionDescription

config = RTCConfiguration(iceServers=[
    RTCIceServer(urls="stun:stun.l.google.com:19302"),
    RTCIceServer(urls="turn:turn.example.com:3478",
                 username="alice", credential="ephemeral-secret"),
])

async def answer(offer_sdp):
    pc = RTCPeerConnection(configuration=config)
    @pc.on("track")
    def on_track(track):
        print("got track", track.kind)
    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer_sdp, type="offer"))
    await pc.setLocalDescription(await pc.createAnswer())
    return pc.localDescription.sdp
```

## code.javascript
```javascript
// Browser — both peers run this; signaling channel omitted.
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:turn.example.com:3478", username: "alice", credential: "ephemeral" },
  ],
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => stream.getTracks().forEach(t => pc.addTrack(t, stream)));

pc.onicecandidate = e => e.candidate && signaling.send({ candidate: e.candidate });
pc.ontrack = e => remoteVideo.srcObject = e.streams[0];

// Caller
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
signaling.send({ sdp: offer });

// Callee receives offer
async function onOffer(sdp) {
  await pc.setRemoteDescription(sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  signaling.send({ sdp: answer });
}
```

## code.java
```java
// Android: Google's libwebrtc bindings.
import org.webrtc.*;

PeerConnectionFactory factory = PeerConnectionFactory.builder().createPeerConnectionFactory();

List<PeerConnection.IceServer> ice = List.of(
    PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
    PeerConnection.IceServer.builder("turn:turn.example.com:3478")
        .setUsername("alice").setPassword("ephemeral").createIceServer()
);

PeerConnection pc = factory.createPeerConnection(
    new PeerConnection.RTCConfiguration(ice),
    new PeerConnection.Observer() {
        @Override public void onIceCandidate(IceCandidate c) { signaling.send(c); }
        @Override public void onAddStream(MediaStream s) { renderRemote(s); }
        // ... other callbacks
    });
pc.addTrack(localVideoTrack);
pc.createOffer(sdpObserver, new MediaConstraints());
```

## code.cpp
```cpp
// libdatachannel — minimal C++ WebRTC stack
#include <rtc/rtc.hpp>

rtc::Configuration cfg;
cfg.iceServers.emplace_back("stun:stun.l.google.com:19302");
cfg.iceServers.emplace_back(rtc::IceServer{
    "turn.example.com", 3478, "alice", "ephemeral", rtc::IceServer::Type::Turn});

auto pc = std::make_shared<rtc::PeerConnection>(cfg);
pc->onLocalDescription([](rtc::Description d){ signaling_send(std::string(d)); });
pc->onLocalCandidate([](rtc::Candidate c){ signaling_send(std::string(c)); });
pc->onTrack([](std::shared_ptr<rtc::Track> t){ /* render */ });

auto track = pc->addTrack(rtc::Description::Video("video"));
pc->setLocalDescription();
```
