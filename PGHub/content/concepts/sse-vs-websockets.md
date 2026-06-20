---
slug: sse-vs-websockets
module: sd-network
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
The wrong choice burns engineering time. SSE for chat means an extra HTTP round-trip per client-to-server message (worse latency, higher cost). WebSockets for one-way notifications means more complex infrastructure (separate protocol, harder to debug, no built-in auto-reconnect). Standardizing on the right tool simplifies load balancers, observability, and retry logic. SSE (HTML5 EventSource, WHATWG spec) powers ChatGPT's streamed responses, Vercel's deployment-log viewer, GitHub's live-checks UI, and OpenAI's `/v1/chat/completions` SSE endpoint. WebSockets (RFC 6455) power Slack, Discord, Figma's collaborative cursor, Google Docs, Linear's real-time updates, and every multiplayer game's lobby. Both ship in every modern browser; choosing between them is a real systems-design call.

## intuition
SSE is one-way: server pushes events to the client over a long-lived HTTP response. The client opens `GET /events` with `Accept: text/event-stream`; the server replies with `Content-Type: text/event-stream` and keeps the response open, writing `data: {...}\n\n` chunks whenever it has news. The browser's built-in `EventSource` parses chunks, fires `onmessage`, and *auto-reconnects* with the `Last-Event-ID` header on disconnect — that auto-reconnect plus event-replay is the killer feature of SSE.

WebSockets are full-duplex: after a single HTTP `Upgrade` handshake, both sides exchange framed binary or text messages over the same TCP connection in either direction. The protocol is its own thing (RFC 6455 framing), so you need a WebSocket-aware load balancer, WebSocket-aware proxy logging, and your own reconnect/heartbeat logic.

The decision rule: if the client mostly *listens* (notifications, log streams, AI token streams, dashboard updates, server-sent metrics), SSE is simpler and cheaper. If both sides regularly *talk* (chat, collaborative editing, multiplayer games, presence, voice signaling), WebSockets are the right tool. The hybrid pattern — SSE for downstream, plain HTTP POSTs for upstream — works perfectly for chat-style interfaces and avoids the WebSocket infrastructure tax. SSE also benefits from every HTTP feature you already pay for: standard auth headers, normal CORS, HTTP/2 stream multiplexing, ordinary CDN caching of the initial GET, and the entire ecosystem of proxy and load-balancer tooling. WebSockets need explicit upgrade-aware support at every hop and their own auth scheme since the protocol switch drops the original HTTP headers after the handshake.

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
Use SSE when the data flow is server-to-client and the client only occasionally sends back state (heartbeat, ack). Use WebSockets when both sides talk frequently and the message rate or interactive latency would make HTTP overhead noticeable. For chat in a browser, the SSE-plus-POST hybrid is almost always the right answer; for collaborative editing or real-time games, WebSockets win.

```javascript
// SSE server (Node + Express)
app.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',  // disable proxy buffering for Nginx
    });
    const id = subscribe(msg => {
        res.write(`id: ${msg.id}\ndata: ${JSON.stringify(msg)}\n\n`);
    });
    req.on('close', () => unsubscribe(id));
});

// SSE client
const es = new EventSource('/events');
es.onmessage = (e) => render(JSON.parse(e.data));

// WebSocket server (Node + ws)
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
    ws.on('message', (data) => broadcast(data));
    ws.on('pong', () => (ws.isAlive = true));
});
setInterval(() => wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false; ws.ping();
}), 30000);
```

The critical SSE line is `'X-Accel-Buffering': 'no'` — without it, Nginx (the most common reverse proxy) buffers the response until the connection ends, which defeats the entire point of SSE. The critical WebSocket pattern is the ping/pong heartbeat with `terminate()` on missed pongs; WebSockets do not auto-reconnect, so the server must detect dead clients and the client must implement its own backoff-and-resubscribe logic. For SSE behind HTTP/1.1 keep an eye on the browser's 6-connection-per-origin cap — use HTTP/2 or HTTP/3 (where streams multiplex on one connection) for SSE-heavy SPAs.

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
