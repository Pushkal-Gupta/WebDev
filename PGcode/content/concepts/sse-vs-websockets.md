---
slug: sse-vs-websockets
module: system-design
title: Server-Sent Events vs WebSockets
subtitle: Two browser-server push channels — SSE is one-way HTTP/1.1, WebSockets are bidirectional full-duplex. Pick per use case.
difficulty: Intermediate
position: 25
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "MDN — Server-Sent Events (EventSource)"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
    type: book
  - title: "High Scalability — WebSockets at scale"
    url: "http://highscalability.com/blog/category/websockets"
    type: blog
  - title: "websocket/ws — Node.js WebSocket library"
    url: "https://github.com/websockets/ws"
    type: repo
status: published
---

## intro
You need to push updates from server to browser in real time — stock prices, chat, notifications, live scores. Two standards-based options:
- **Server-Sent Events (SSE)** — built on HTTP/1.1. Server holds the connection open and writes `data: <json>\n\n` chunks. Browser auto-reconnects. **One-way (server → browser only).**
- **WebSockets** — separate `ws://`/`wss://` protocol upgraded from HTTP. Full-duplex binary or text. **Bidirectional.**

Pick SSE for one-way push (notifications, live feed). Pick WebSockets when the client also pushes (chat, collaborative editing, game state sync).

## whyItMatters
The wrong choice burns engineering time:
- SSE for chat: extra HTTP round-trip per message in the client→server direction (worse latency, higher cost).
- WebSockets for one-way notifications: more complex (separate protocol, harder to debug, no built-in auto-reconnect).

Standardizing on the right tool simplifies infrastructure (load balancers, observability, retry logic).

## intuition
**SSE flow**:
1. Browser opens `GET /events` with `Accept: text/event-stream`.
2. Server responds `200 OK` + headers `Content-Type: text/event-stream` + `Cache-Control: no-cache` + keeps connection open.
3. Server writes `data: {"x":1}\n\n` chunks whenever it has news.
4. Browser's `EventSource` parses chunks + fires `onmessage`. Auto-reconnects after disconnect.

**WebSocket flow**:
1. Browser sends HTTP `GET /ws` with `Upgrade: websocket` header.
2. Server responds `101 Switching Protocols`.
3. Both sides exchange framed binary/text messages over the same TCP connection, full-duplex.

## visualization
```
SSE:
  Browser ──GET /events Accept: text/event-stream──► Server
  Browser ◄──200 + "data: {...}\n\n" stream──── Server
  Browser ◄──"data: {...}\n\n"────── Server
  ...
  (client→server: separate HTTP request to /api/...)

WebSocket:
  Browser ──GET /ws Upgrade: websocket──► Server
  Browser ◄──101 Switching Protocols──── Server
  Browser ◄══frame══► Server  (bidirectional, persistent)
  Browser ◄══frame══► Server
```

## bruteForce
**Long polling** — browser sends a request, server holds it until news arrives, responds, browser re-sends. Works everywhere; high overhead (one new HTTP request per message).

**Short polling** — browser polls every N seconds. Simple but wasteful + has up to N-second latency.

**Streaming over fetch** — manually parse `fetch().body.getReader()` chunks. Like SSE but you write the framing. Reinventing SSE.

## optimal
**SSE — server (Node Express)**:
```javascript
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 1000);
  req.on('close', () => clearInterval(interval));
});
```

**SSE — browser**:
```javascript
const es = new EventSource('/events');
es.onmessage = (e) => console.log(JSON.parse(e.data));
es.onerror = () => { /* auto-reconnects */ };
```

**WebSocket — server (Node `ws`)**:
```javascript
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (socket) => {
  socket.on('message', (msg) => { socket.send(`echo: ${msg}`); });
});
```

**WebSocket — browser**:
```javascript
const ws = new WebSocket('wss://example.com/ws');
ws.onmessage = (e) => console.log(e.data);
ws.send('hello');
```

## complexity
- **SSE**: ~1KB overhead per chunk (HTTP headers reused; chunks small). Auto-reconnect built-in. Connection-per-tab capped at 6 over HTTP/1.1 (use HTTP/2 to multiplex).
- **WebSocket**: ~14 bytes overhead per frame after handshake. No connection-count limit. No auto-reconnect (implement client-side).
- **Both**: keep-alive heartbeats every 15-30s to keep middleboxes from closing idle connections.

## pitfalls
- **SSE over HTTP/1.1 has a 6-connection-per-domain browser cap**. Open SSE on a separate domain or migrate the whole site to HTTP/2/3.
- **WebSocket buffer pressure**: client falls behind → server's send buffer fills. Implement backpressure (drop, batch, or close slow consumers).
- **Proxies / load balancers**: nginx default `proxy_read_timeout` is 60s — kills idle SSE/WS connections. Set to several minutes.
- **CORS**: SSE respects CORS (origin checks); WebSockets do NOT (use Origin header check server-side).
- **Auth**: WebSockets can't send `Authorization` headers from the browser — pass auth via subprotocol or first message. SSE works with cookies/bearer.

## interviewTips
- For "real-time stock prices to browser" → SSE.
- For "real-time chat between users" → WebSocket.
- Mention **HTTP/2 multiplexing** removes SSE's connection cap.
- For senior interviews, discuss **scaling 100k+ WS connections**: pinned by L4 LB (sticky session), in-memory connection registry, pub/sub backend (Redis Streams / NATS) to fan out across replicas.

## code.python
```python
# SSE server (Flask)
from flask import Flask, Response
import json, time
app = Flask(__name__)

@app.route('/events')
def events():
    def stream():
        while True:
            yield f"data: {json.dumps({'time': time.time()})}\n\n"
            time.sleep(1)
    return Response(stream(), mimetype='text/event-stream')
```

## code.javascript
```javascript
// WebSocket client + auto-reconnect
function connect() {
  const ws = new WebSocket('wss://example.com/ws');
  ws.onmessage = (e) => console.log(e.data);
  ws.onclose = () => setTimeout(connect, 1000);   // simple retry
  ws.onerror = () => ws.close();
}
connect();
```

## code.java
```java
// Spring WebFlux Server-Sent Events
@GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<String> events() {
    return Flux.interval(Duration.ofSeconds(1))
               .map(i -> "tick " + i);
}
```

## code.cpp
```cpp
// WebSocket via uWebSockets or Boost.Beast — production-grade C++ WS libs.
// uWS::App().ws<UserData>("/*", { ... }).listen(9001, ...).run();
```
