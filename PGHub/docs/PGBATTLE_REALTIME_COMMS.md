# PGBattle — Real-time Comms (video call, voice call, chat)

How two players in a PGBattle match talk to each other: **peer-to-peer video/voice over
WebRTC**, and **text chat**, with Supabase Realtime doing the signaling. This is the
"how did we actually build it" document, grounded in the real code.

- Comms UI + WebRTC + chat: `src/components/versus/VideoCall.jsx`
- Match state / progress: `src/components/versus/VersusMatch.jsx`, `src/lib/versus.js`
- Styles: `src/styles/versus.css`

---

## 1. The one-paragraph summary

Each match has **two Supabase Realtime channels**: `versus:{code}` carries the *game*
(presence, progress, typing, win), and `comms:{code}` carries *everything the comms
island needs* — WebRTC signaling **and** chat. Video/voice never touch our server:
Supabase only relays the small SDP/ICE messages that let the two browsers find each
other, after which **WebRTC streams media directly peer-to-peer**, falling back to a
**TURN relay** when a direct path is impossible. Chat is plain broadcast messages on the
same channel. There is **no media server and no chat table** — it's all ephemeral
Realtime broadcast.

```text
                    Supabase Realtime (WebSocket)
        ┌───────────────────────────────────────────────┐
        │   versus:{code}      │      comms:{code}        │
        │  presence, progress, │  ring/accept/offer/      │
        │  typing, win         │  answer/ice, chat        │
        └─────────┬────────────┴───────────┬─────────────┘
                  │ (signaling only)        │
            ┌─────┴─────┐             ┌─────┴─────┐
            │  User A   │             │  User B   │
            │  browser  │             │  browser  │
            └─────┬─────┘             └─────┬─────┘
                  │                         │
                  └────── WebRTC media ─────┘   ← video/audio, DIRECT
                       (or via TURN relay)         (server never sees it)
```

---

## 2. Why two channels

- `versus:{code}` (`matchChannel()` in `src/lib/versus.js`) uses **presence** (who is in
  the room, keyed by user id) plus broadcast events `progress` / `complexity` / `typing`
  / `joined` / `start` / `win`. Reloading keeps the same questions because the match +
  its `problem_ids` are persisted in Postgres — only the *live* progress is ephemeral.
- `comms:{code}` (created inside `VideoCall.jsx`) is dedicated to the comms island so a
  call's signaling and chat are isolated from game traffic and can be reasoned about on
  their own. Both channels set `broadcast: { self: false }` so a client never receives
  its own messages.

Every comms message is one broadcast event named `comms` with a payload
`{ from, name, t, ...}` where `t` is the message type (`ring`, `accept`, `offer`,
`answer`, `ice`, `busy`, `decline`, `bye`, `chat`). A tiny helper wraps it:

```js
const send = (obj) => chanRef.current?.send({
  type: 'broadcast', event: 'comms',
  payload: { from: userId, name: myName, ...obj },
});
```

---

## 3. Capturing camera + microphone

When a call starts, the browser is asked for media with **explicit audio processing**
turned on — without `echoCancellation`/`noiseSuppression`/`autoGainControl` some browsers
return raw mic audio, which caused the early "echo + muddy voice" bug:

```js
navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  video,  // true for a video call, false for voice-only
});
```

The returned `MediaStream` (a video track + an audio track) is shown in the local
`<video>` preview and later attached to the peer connection. No network is involved yet.

---

## 4. The call handshake (ring → accept → offer → answer → ICE)

The order matters: we make the **callee create its peer connection *before* the offer
arrives**, so an offer/ICE never lands on a peer that isn't ready. This is what fixed the
old "stuck at Connecting…" bug.

```text
 CALLER (User A)                 comms:{code}                 CALLEE (User B)
 ───────────────                 ────────────                 ───────────────
 getUserMedia()                                               (idle)
 send {t:'ring', video} ───────────────────────────────────▶ show "Incoming call"
 arm 25s watchdog                                             clicks Accept
                                                              getUserMedia()
                                                              makePc()  ← pc ready
                          ◀─────────────────────── send {t:'accept'}   arm watchdog
 makePc()
 createOffer(); setLocalDescription()
 send {t:'offer', sdp} ────────────────────────────────────▶ setRemoteDescription(offer)
                                                              createAnswer(); setLocalDescription()
                          ◀───────────────── send {t:'answer', sdp}     flushIce()
 setRemoteDescription(answer)
 flushIce()
        │                                                            │
        └──────── ICE candidates trickle both ways (t:'ice') ───────┘
        └──────── ontrack fires → setCall('live'), clear watchdog ──┘
```

Key mechanics in `VideoCall.jsx`:

- **`makePc(stream)`** builds the `RTCPeerConnection`, adds the local tracks, and wires
  `onicecandidate` (→ `send {t:'ice'}`), `ontrack` (→ attach remote stream, go `live`),
  and the ICE/connection state handlers.
- **Early-ICE buffering.** An `ice` message that arrives before `remoteDescription` is set
  is pushed to `pendingIce`; `flushIce()` drains it right after the description is applied.
  Without this, candidates racing ahead of the answer were silently dropped.
- **`busy` guard.** A `ring` received while already in a call replies `{t:'busy'}` instead
  of double-answering.
- **25s watchdog** (`armWatchdog`). If the call hasn't reached `live` in 25 seconds it
  tears down cleanly with a clear message instead of spinning on "Connecting…".

Call state machine: `idle → ringing → (remote: incoming) → connecting → live`, with
`busy`/`decline`/`bye`/watchdog all routing back to `idle` via `teardown()`.

---

## 5. ICE, STUN, and TURN — how the media path is found

The peer connection is created with this ICE configuration (`ICE` const in
`VideoCall.jsx`):

```text
iceServers:
  1. STUN  — stun.l.google.com:19302 (+ mirrors, + stun.relay.metered.ca:80)
             "what does my public address look like from the internet?"
  2. TURN  — VITE_TURN_URL / VITE_TURN_USER / VITE_TURN_CRED   (production)
             else OpenRelay fallback: turn:openrelay.metered.ca:80?transport=tcp,
                                      turn:openrelay.metered.ca:80
             "if direct fails, relay the media through me"
```

ICE gathers candidate paths and picks the first working pair:

- **host** (LAN address) → works only same-network.
- **server-reflexive** (via STUN) → your public NAT mapping; enables direct P2P across most
  home networks. **Best case — zero TURN bandwidth, lowest latency.**
- **relay** (via TURN) → used only when direct is impossible (symmetric/carrier-grade NAT
  on mobile, corporate/university firewalls).

**Why TURN-over-TCP:80 is listed first in the fallback:** restrictive networks that block
UDP and random ports almost always still allow outbound TCP on common web ports, so the
most firewall-tolerant transport is tried first. In production, set the `VITE_TURN_*`
vars (e.g. a Metered relay key) — the public OpenRelay fallback is unreliable and only
answers on port 80.

---

## 6. Playing the remote media

- A single dedicated `<audio ref={remoteAudEl}>` is the **only** audio sink, used for both
  video and voice-only calls. The remote `<video>` is **muted**, so we never get two
  overlapping audio outputs.
- For a video call the remote stream also drives `vs-meet-remote`, with the local preview
  as a small `vs-meet-local` tile (Google-Meet layout). Voice-only shows an avatar instead.

---

## 7. Diagnostics — knowing *where* a call failed

Because signaling was proven correct long ago, the remaining failures are always in the
**media path**. Two signals make that observable:

- **`netState`** mirrors `pc.iceConnectionState` live (`checking` shows "finding a path").
- **`relayFound`** records whether a TURN **relay** candidate was ever gathered. On
  `iceConnectionState === 'failed'` the error message branches:
  - relay gathered → *"the media connection could not be established"* (flaky network),
  - no relay gathered → *"no TURN relay was reachable — a relay server is needed for
    cross-network calls"* (TURN config / reachability problem — the common phone-to-phone
    failure).

| Stage | Direct P2P | TURN relay | Failed |
|---|---|---|---|
| Signaling / SDP / ICE exchange | ✅ | ✅ | ✅ |
| Working candidate pair | ✅ direct | ✅ via TURN | ❌ |
| Media (video/audio) | ✅ | ✅ | ❌ |

The takeaway (also in memory `project_pgbattle_videocall_turn`): **signaling is solved;
reliable cross-network calling depends on a real TURN relay** being configured.

---

## 8. Chat

Chat is the simplest piece — a `comms` broadcast with `t:'chat'`:

```js
// send: local echo immediately, then broadcast
setChat((c) => [...c, { mine: true, body }]);
send({ t: 'chat', body });

// receive: append + bump the unread badge if the panel is closed
setChat((c) => [...c, { mine: false, body: payload.body }]);
```

It shares the `comms:{code}` channel with signaling, so no extra connection and no DB
table — messages live only for the session (matching the ephemeral, in-the-moment nature
of a battle). An unread counter shows on the chat button when the panel is collapsed.

---

## 9. The movable island

All three affordances (video, voice, chat) live in one draggable "island"
(`vs-island`). Dragging is pointer-based and **clamped to the viewport on both axes**
(and re-clamped on window resize) so the controls can never be dragged off-screen and get
stuck. When idle it shows Start-video / Start-voice / Chat; in a call it shows
mute / camera / hang-up / chat.

---

## 10. What to change if calls are unreliable

1. **Set a real TURN relay** — `VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_CRED`
   (comma-separate multiple URLs). Use the exact URLs the provider (e.g. Metered) gives,
   including their TCP:443 / TCP:80 variants — more URLs = more connectivity options.
2. **Do not re-debug signaling** — the ring→accept→offer→answer→ICE flow + early-ICE
   buffering are proven. Failures at `iceConnectionState: failed` with `relayFound=false`
   are TURN-reachability problems, not signaling bugs.
3. TURN bandwidth is only consumed by **relayed** calls; direct P2P calls cost ~0. A quota
   (e.g. Metered's 20 GB) is "20 GB of relayed traffic", not total call minutes.
