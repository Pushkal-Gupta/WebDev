---
slug: webhooks-design
module: sd-api
title: Webhooks Design
subtitle: Server → client HTTP callbacks for events. Sign, retry, dedupe, idempotency-key — the four properties of a reliable webhook.
difficulty: Intermediate
position: 44
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Stripe Engineering — webhooks best practices"
    url: "https://stripe.com/docs/webhooks"
    type: book
  - title: "Brandur — webhooks: a guide"
    url: "https://brandur.org/webhooks"
    type: blog
  - title: "svix/svix-webhooks — open-source webhook service"
    url: "https://github.com/svix/svix-webhooks"
    type: repo
status: published
---

## intro
A **webhook** is a server-to-server HTTP callback: your service POSTs an event to a customer's URL when something happens (`payment.completed`, `user.signup`). Reverse of polling — customer doesn't ask, you tell. Four properties make a webhook "reliable":
1. **Signed** (HMAC) so receiver can verify it came from you.
2. **Retried** on failure (with exponential backoff).
3. **Deduplicated** (receiver gets the same event ID twice; processes once).
4. **Idempotency-key** so duplicate retries don't re-execute side effects.

## whyItMatters
Every modern SaaS exposes webhooks: Stripe payments, GitHub events, Slack, Twilio, Shopify, AWS SNS. Customers want events pushed, not polled. Done wrong: customers' systems break, you get blamed.

The 4 properties above are non-negotiable at scale. Stripe processes billions of webhook deliveries; Svix is an entire company built around this primitive.

## intuition
Your service emits an event → enqueues a delivery row → worker POSTs to the customer's URL with the JSON payload + an HMAC signature. If 2xx → mark delivered. If 4xx → log + don't retry (customer bug). If 5xx / timeout → retry with backoff.

Receiver verifies signature, looks up `event_id` in dedupe table → if seen, return 200 without re-processing (idempotent); if new, run the handler + record `event_id`.

## visualization
```
Producer (you):
  Event: charge.succeeded {id: ch_xyz, amount: 100}
       │
       ▼
  ┌──────────────────────────┐
  │ webhook_deliveries table │  ← row per (subscriber, event)
  │  status: pending         │
  │  attempt: 0              │
  │  next_retry: now()       │
  └────┬─────────────────────┘
       │ worker picks up
       ▼
  POST https://customer.example.com/webhook
  Headers:
    X-Webhook-Id: evt_abc123
    X-Webhook-Timestamp: 1729000000
    X-Webhook-Signature: sha256=...    ← HMAC(secret, timestamp + body)
  Body: {"id": "ch_xyz", "type": "charge.succeeded", ...}
       │
       ▼
  Receiver:
    1. Verify signature (HMAC + timestamp within 5min).
    2. dedupe: seen evt_abc123 before? → return 200 (skip).
    3. Else: process, store evt_abc123 in dedupe table, return 200.

  If receiver returns 500: producer schedules retry at backoff(attempt).
  Attempts: 1, 5, 25, 125, 625 seconds (exponential * 5).
  After N failures (24h): mark as dead-letter; alert customer.
```

## bruteForce
**Fire-and-forget POST**: no retry → if customer's server is down even briefly → event lost.

**Polling**: customer pulls `/events?since=...` periodically. Higher latency, doesn't scale to large fanout, customers complain.

**No signature**: anyone can POST to the customer's webhook URL and forge events.

Production webhooks: queue + retry + signature + dedupe + dead-letter.

## optimal
**Schema** (producer side):
```sql
CREATE TABLE webhook_subscribers (
  id UUID PRIMARY KEY,
  account_id UUID,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,             -- shared secret for HMAC
  events TEXT[] NOT NULL,            -- subscribed event types
  active BOOLEAN DEFAULT true
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  subscriber_id UUID REFERENCES webhook_subscribers(id),
  event_id TEXT NOT NULL,            -- unique event identifier
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,              -- pending | sent | failed | dead_letter
  attempt INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  response_status INT,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
CREATE INDEX idx_deliveries_pending ON webhook_deliveries (next_retry_at)
  WHERE status IN ('pending', 'failed');
```

**Signing (HMAC-SHA256)**:
```python
import hmac, hashlib, time
def sign(secret, payload_bytes):
    timestamp = str(int(time.time()))
    signed_msg = timestamp.encode() + b'.' + payload_bytes
    signature = hmac.new(secret.encode(), signed_msg, hashlib.sha256).hexdigest()
    return timestamp, signature

# Receiver:
def verify(secret, timestamp, signature, body_bytes, max_age=300):
    if abs(time.time() - int(timestamp)) > max_age: return False  # replay protection
    expected = hmac.new(secret.encode(), timestamp.encode() + b'.' + body_bytes,
                        hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)   # constant-time compare
```

**Retry policy**: exponential backoff with jitter. After max attempts → dead-letter + email customer.

**Receiver dedupe**:
```sql
CREATE TABLE processed_webhooks (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
-- on receive:
INSERT INTO processed_webhooks (event_id) VALUES (?)
ON CONFLICT (event_id) DO NOTHING RETURNING event_id;
-- if RETURNING returns nothing, it was a duplicate → skip processing.
```

**Ordering**: webhooks may arrive out of order (retries). Include version / sequence number in payload; receiver checks if newer.

## complexity
- **Send overhead**: 1 DB insert + 1 HTTP request per delivery.
- **HMAC compute**: negligible (~μs).
- **Receiver verify**: 1 HMAC compute + 1 dedupe lookup.
- **Storage**: 1 row per delivery; archive after 30 days.

## pitfalls
- **No replay protection (timestamp check)**: attacker replays old valid signed webhook → side effect re-fires.
- **No timeout on the HTTP call**: slow customer holds your worker → throughput tanks. Use 10-30s timeout.
- **Per-customer queue**: one slow customer slows ALL deliveries. Shard workers by subscriber_id.
- **Customer 4xx ≠ retry**: 4xx means client error (invalid signature, malformed request) — don't retry. Only retry 5xx / timeout.
- **Webhook URL must be HTTPS**: signed payloads sent over HTTP can be MITM'd.
- **Forgetting dead-letter alerts**: customer's webhook URL went down 3 weeks ago; you've silently failed 100k events. Email after N consecutive failures.

## interviewTips
- For "design webhook system" — signed + retried + dedupe + dead-letter.
- Reference **Stripe / GitHub** as gold standards.
- For senior interviews, discuss **per-customer queue isolation**, **multi-tenant rate limiting**, **HMAC vs JWT signatures**.

## code.python
```python
# Async worker (FastAPI background task)
import httpx, hmac, hashlib, time, asyncio
async def deliver(delivery, subscriber):
    body = json.dumps(delivery.payload).encode()
    ts = str(int(time.time()))
    sig = hmac.new(subscriber.secret.encode(), ts.encode() + b'.' + body, hashlib.sha256).hexdigest()
    headers = {'X-Webhook-Id': delivery.event_id, 'X-Webhook-Timestamp': ts, 'X-Webhook-Signature': f'sha256={sig}'}
    try:
        r = await httpx.post(subscriber.url, content=body, headers=headers, timeout=10)
        if r.status_code < 300: mark_delivered(delivery)
        elif r.status_code < 500: mark_failed(delivery, 'client_error')   # no retry
        else: schedule_retry(delivery)
    except (httpx.TimeoutException, httpx.NetworkError):
        schedule_retry(delivery)
```

## code.javascript
```javascript
// Receiver: verify + dedupe (Express)
app.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const ts = req.headers['x-webhook-timestamp'];
  const sig = req.headers['x-webhook-signature']?.replace('sha256=','');
  if (Math.abs(Date.now()/1000 - parseInt(ts)) > 300) return res.status(400).end('stale');
  const expected = crypto.createHmac('sha256', SECRET).update(`${ts}.${req.body}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return res.status(401).end('bad sig');
  const id = req.headers['x-webhook-id'];
  const seen = await db.oneOrNone('INSERT INTO processed_webhooks (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id', [id]);
  if (!seen) return res.status(200).end('dup');
  await processEvent(JSON.parse(req.body));
  res.status(200).end();
});
```

## code.java
```java
// Spring receiver
@PostMapping("/webhook")
public ResponseEntity<String> webhook(@RequestHeader("X-Webhook-Signature") String sig,
                                       @RequestHeader("X-Webhook-Timestamp") long ts,
                                       @RequestBody byte[] body) {
    if (Math.abs(Instant.now().getEpochSecond() - ts) > 300) return ResponseEntity.status(400).body("stale");
    String expected = hmacSha256(SECRET, ts + "." + new String(body));
    if (!MessageDigest.isEqual(sig.replace("sha256=","").getBytes(), expected.getBytes()))
        return ResponseEntity.status(401).body("bad sig");
    // dedupe + process...
    return ResponseEntity.ok().build();
}
```

## code.cpp
```cpp
// Drogon receiver — HMAC-SHA256 via OpenSSL
// auto sig = req->getHeader("x-webhook-signature");
// auto ts = std::stoi(req->getHeader("x-webhook-timestamp"));
// if (std::abs(now - ts) > 300) return 400;
// auto expected = hmac_sha256(SECRET, ts + "." + body);
// if (!constant_time_eq(sig, expected)) return 401;
```
