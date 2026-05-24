---
slug: webhook-receiver-best-practices
module: system-design
title: Webhook Receiver Best Practices
subtitle: Verify signatures, dedupe by event id, queue async, ack fast — never do work inline.
difficulty: Intermediate
position: 69
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "AWS Builders' Library — Reliability"
    url: "https://aws.amazon.com/builders-library"
    type: blog
  - title: "Microservices.io — Transactional Outbox"
    url: "https://microservices.io/patterns/data/transactional-outbox.html"
    type: book
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Webhooks look simple: receive an HTTP POST, do something, return 200. In production they're a minefield of replay attacks, duplicates, slow handlers, retry storms, and silent data loss. The four-step rule: **verify signature, dedupe by event id, enqueue async, ack within 2 seconds**. The handler does the actual work later.

## whyItMatters
Senders (Stripe, GitHub, Twilio, Slack) retry aggressively on any timeout or non-2xx. A slow handler that takes 30s to process inline = 5-10 retries = 5-10 duplicate side effects. A naive `if (event.type == 'charge.succeeded') chargeUser()` runs 6 times, the customer is billed 6 times, the support ticket arrives Monday.

## intuition
**Four pillars**:

1. **Verify** — every legitimate sender signs the body with HMAC + a shared secret (Stripe-Signature, X-Hub-Signature-256, etc.). Recompute and compare in constant time. Reject if mismatch.

2. **Dedupe** — every event has an id (Stripe `evt_...`, GitHub `X-GitHub-Delivery`, etc.). Persist `(event_id, received_at)` with a UNIQUE constraint. On duplicate insert -> just 200 and stop.

3. **Enqueue** — drop the validated event onto a queue (SQS, Kafka, BullMQ, even Postgres `outbox`). Return 200 immediately.

4. **Process async** — worker picks up the event, does the work with idempotency (the receiver already deduped at the network edge; the worker should be idempotent for crash recovery).

**Why fast ack**: most senders have <5s timeout. Stripe: 30s. GitHub: 10s. Slack: 3s. If you're slow they retry; retries deliver the same event again; without dedupe you double-process.

## visualization
```
Sender                  Receiver (edge)           Queue            Worker
  |                         |                       |                |
  | --POST /webhook + sig-->|                       |                |
  |                         | verify HMAC           |                |
  |                         | dedupe by event_id    |                |
  |                         | (UNIQUE constraint)   |                |
  |                         | INSERT outbox row --->|                |
  | <----- 200 (~50ms) -----|                       |                |
  |                                                 | -- pop ------> |
  |                                                 |                | do work
  |                                                 |                | (idempotent)
  |                                                 |                | mark processed
  |                                                 |                |
  |                                                 |  retry on fail |
  |                                                 |  DLQ after N   |
```

Dedupe table:
```sql
CREATE TABLE webhook_events (
  event_id TEXT PRIMARY KEY,        -- sender's id
  source   TEXT NOT NULL,
  payload  JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status   TEXT DEFAULT 'queued'    -- queued | done | failed
);
```

## bruteForce
**Process inline**: webhook handler runs the business logic. Slow handler -> sender times out -> retries -> duplicate processing.

**No signature check**: anyone can POST anything to your /webhook endpoint and trigger refunds / shipments.

**Dedupe in memory** (a Map per pod): horizontal scale -> different pods see the same event -> both process.

**Single try/except + 200 on everything**: silently drop legitimate events; you find out in the support ticket.

## optimal
**Receiver edge** (latency budget <500ms):
1. Read body as raw bytes (signature is over raw bytes — frameworks that re-serialize JSON break this).
2. `hmac.compare_digest(expected, header)` — constant-time.
3. `INSERT INTO webhook_events (event_id, ...) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`. If no row returned -> duplicate -> return 200.
4. Enqueue (or rely on a CDC / outbox pattern).
5. Return 200.

**Worker**:
- Pop from queue, process, mark `processed_at`.
- On failure -> requeue with exponential backoff; after N (e.g., 8) attempts -> DLQ.
- Idempotency: the business action itself should tolerate replay (use `upsert`, check `if (order.charged) return`).

**Operational**:
- Allowlist sender IP ranges if published (Stripe / Twilio publish them).
- TLS 1.2+ required.
- Replay window check: reject events older than 5 min using `Stripe-Signature t=`.
- DLQ alarm on N items.
- Public health endpoint that returns 200 (sender's "is endpoint up?" check).

## complexity
- Edge: 1 HMAC + 1 INSERT ON CONFLICT + 1 enqueue. ~5-20ms.
- Throughput limited by queue (Kafka/SQS scale to millions/sec).
- Storage: events table grows; partition by month, drop partitions >90d.

## pitfalls
- **Verifying signature on parsed JSON**: re-serialization changes whitespace/key order, breaks HMAC. Always raw body.
- **String compare instead of constant-time**: timing attack reveals signature byte-by-byte.
- **No replay window check**: attacker captures one valid request and replays 6 months later.
- **Returning 500 on dedupe**: sender retries forever. Dupes should be 200.
- **Processing in the request handler**: hits sender timeout, retried 10x. ALWAYS enqueue.
- **Workers not idempotent**: queue can deliver twice. Use upsert + status checks.
- **Logging full payload**: PII compliance issue. Redact tokens / emails.
- **No DLQ**: poison pill loops forever, blocks queue.

## interviewTips
- Lead with the four-pillar rule (**verify, dedupe, enqueue, ack**).
- Mention specific senders and their quirks (Stripe replay window, GitHub `X-GitHub-Delivery`, Slack 3s timeout).
- Discuss **outbox pattern** for end-to-end exactly-once semantics.
- For senior interviews: replay-window enforcement + IP allowlisting + DLQ + reprocess tooling.

## code.python
```python
import hmac, hashlib, time
def handle_webhook(req, db, queue, secret):
    raw = req.body  # raw bytes BEFORE JSON parse
    sig_header = req.headers['Stripe-Signature']
    t, v1 = parse_stripe_sig(sig_header)
    if abs(int(time.time()) - int(t)) > 300: return 400
    expected = hmac.new(secret.encode(), f'{t}.{raw.decode()}'.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, v1): return 401
    body = json.loads(raw)
    event_id = body['id']
    rows = db.execute(
        "INSERT INTO webhook_events (event_id, source, payload) VALUES (%s,'stripe',%s) "
        "ON CONFLICT (event_id) DO NOTHING RETURNING event_id",
        (event_id, json.dumps(body)))
    if rows:
        queue.enqueue('process_webhook', event_id)
    return 200
```

## code.javascript
```javascript
const crypto = require('crypto');
async function handleWebhook(req, db, queue, secret) {
  const raw = req.rawBody;
  const sig = req.headers['stripe-signature'];
  const { t, v1 } = parseStripeSig(sig);
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return 400;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) return 401;
  const body = JSON.parse(raw);
  const r = await db.oneOrNone(
    `INSERT INTO webhook_events (event_id, source, payload) VALUES ($1,'stripe',$2)
     ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
    [body.id, body]);
  if (r) await queue.add('process_webhook', { eventId: body.id });
  return 200;
}
```

## code.java
```java
int handleWebhook(HttpRequest req, JdbcTemplate db, Queue q, String secret) throws Exception {
    byte[] raw = req.getRawBody();
    String sig = req.getHeader("Stripe-Signature");
    long t = parseT(sig);
    if (Math.abs(System.currentTimeMillis() / 1000 - t) > 300) return 400;
    String expected = hmacSha256Hex(secret, t + "." + new String(raw));
    if (!MessageDigest.isEqual(expected.getBytes(), parseV1(sig).getBytes())) return 401;
    String eventId = parseId(raw);
    int inserted = db.update(
        "INSERT INTO webhook_events(event_id, source, payload) VALUES (?, 'stripe', ?::jsonb) ON CONFLICT (event_id) DO NOTHING",
        eventId, new String(raw));
    if (inserted > 0) q.enqueue("process_webhook", eventId);
    return 200;
}
```

## code.cpp
```cpp
// int handleWebhook(const Request& req, Db& db, Queue& q, const std::string& secret) {
//   auto raw = req.rawBody();
//   auto [t, v1] = parseStripeSig(req.header("Stripe-Signature"));
//   if (std::abs(time(nullptr) - t) > 300) return 400;
//   auto expected = hmac_sha256_hex(secret, std::to_string(t) + "." + raw);
//   if (!constant_time_eq(expected, v1)) return 401;
//   auto id = json::parse(raw)["id"].get<std::string>();
//   auto inserted = db.exec("INSERT INTO webhook_events(event_id,source,payload) VALUES ($1,'stripe',$2) ON CONFLICT DO NOTHING", id, raw);
//   if (inserted) q.enqueue("process_webhook", id);
//   return 200;
// }
```
